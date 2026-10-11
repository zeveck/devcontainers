#!/usr/bin/env node
// dc — a small wrapper around @devcontainers/cli.
//
// All logic lives here so the platform shims (dc, dc.cmd) stay one line each and
// there is nothing to keep in sync between them.
//
// Runs on the HOST, not inside the container. Discovers the project by walking up
// from the current directory looking for .devcontainer/devcontainer.json, so the
// installed copy works in any project.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync, chmodSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix, resolve, win32 } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir, platform } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const IS_WIN = platform() === 'win32';
const LABEL = 'devcontainer.local_folder';

// ── pure helpers (unit-tested; see test/dc.test.mjs) ─────────────────────────

/** Walk up from `start` for a directory containing .devcontainer/devcontainer.json. */
export function findProjectRoot(start, exists = existsSync) {
  let dir = resolve(start);
  for (;;) {
    if (exists(join(dir, '.devcontainer', 'devcontainer.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Canonicalize a host path for comparison against the devcontainer.local_folder
 * label. Docker Desktop on Windows is inconsistent about slash direction and
 * drive-letter case, so compare normalized forms rather than raw strings.
 */
export function normalizeLocalFolder(p, plat = platform()) {
  if (!p) return '';
  let s = String(p).trim().replace(/\\/g, '/').replace(/\/+$/, '');
  if (plat === 'win32') {
    s = s.replace(/^([a-zA-Z]):/, (_m, d) => d.toLowerCase() + ':');
    s = s.toLowerCase();
  }
  return s;
}

/**
 * Build the argv for running a tool inside the container.
 *
 * A LOGIN shell is required: claude resolves via ~/.profile and codex/gemini/
 * playwright-cli via /etc/profile.d, neither of which a plain `devcontainer exec`
 * sources. Without -l these are "command not found".
 */
/**
 * Terminal capability vars to forward into the container.
 *
 * `devcontainer exec` passes nothing through by default, so a tool that renders
 * 256-colour or truecolour output degrades to the nearest 16-colour approximation
 * (Claude Code's orange turns red). VS Code sets these itself, which is why the
 * same tool looks right in its terminal. Windows shells set neither, so default
 * to values every modern terminal, including Windows Terminal, supports.
 *
 * These only advertise capability; they do not force colour on, so piped output
 * is unaffected -- tools still check isatty.
 */
export function terminalEnv(env = {}) {
  const out = [`TERM=${env.TERM || 'xterm-256color'}`, `COLORTERM=${env.COLORTERM || 'truecolor'}`];
  if (env.LANG) out.push(`LANG=${env.LANG}`);
  return out;
}

export function buildExecArgs(root, argv, { login = true, env = {} } = {}) {
  const base = ['exec', '--workspace-folder', root];
  for (const kv of terminalEnv(env)) base.push('--remote-env', kv);
  if (!login) return [...base, ...argv];
  const [cmd, ...rest] = argv;
  // `bash -lc '<script>' <argv0> <args...>` — argv0 fills $0 so "$@" is the real args.
  return [...base, 'bash', '-lc', `${cmd} "$@"`, cmd, ...rest];
}

/**
 * Message for a failed prerequisite, or null if everything needed is present.
 * Pure so the wording is unit-tested; the probing lives in preflight() below.
 */
export function preflightError(hasDocker, daemonRunning, plat = platform()) {
  const desktop = plat === 'win32' || plat === 'darwin';
  if (!hasDocker) {
    return 'Docker not found on PATH.\n'
      + (desktop
        ? '  Install Docker Desktop: https://www.docker.com/products/docker-desktop/'
        : '  Install Docker: https://docs.docker.com/engine/install/')
      + '\n  Then run `dc doctor` to verify.';
  }
  if (!daemonRunning) {
    return 'Docker is installed but not running.\n'
      + (desktop
        ? '  Start Docker Desktop and wait for it to report "running", then try again.'
        : '  Start the daemon (e.g. sudo systemctl start docker), then try again.')
      + '\n  `dc doctor` will confirm.';
  }
  return null;
}

/**
 * The per-project agent volumes devcontainer.json declares:
 * agent-<tool>-${devcontainerId}. A devcontainerId is 52 base-32 digits, so
 * matching that exact shape keeps dc away from every other volume.
 */
export const AGENT_TOOLS = ['claude', 'codex', 'gemini'];
export const AGENT_VOLUME = /^agent-(claude|codex|gemini)-[0-9a-v]{52}$/;

/**
 * ${devcontainerId} exactly as @devcontainers/cli computes it: SHA-256 of the
 * id labels as key-sorted JSON, written in base 32 and padded to 52 digits.
 */
export function devcontainerId(idLabels) {
  const json = JSON.stringify(idLabels, Object.keys(idLabels).sort());
  const hex = createHash('sha256').update(json, 'utf8').digest('hex');
  return BigInt(`0x${hex}`).toString(32).padStart(52, '0');
}

/**
 * The id labels the CLI gives a project's container: its folder and config
 * file. On Windows the CLI normalizes paths and lowercases the drive letter.
 */
export function idLabelsFor(root, plat = platform()) {
  const form = (p) => {
    if (plat !== 'win32') return p;
    const s = win32.normalize(p);
    return s.length >= 2 && s[1] === ':' ? s[0].toLowerCase() + s.slice(1) : s;
  };
  const join_ = plat === 'win32' ? win32.join : posix.join;
  return {
    'devcontainer.local_folder': form(root),
    'devcontainer.config_file': form(join_(root, '.devcontainer', 'devcontainer.json')),
  };
}

export const agentVolumeNames = (id) => AGENT_TOOLS.map((tool) => `agent-${tool}-${id}`);

/** Agent volume names among a container's mounts (docker inspect .Mounts). */
export function agentVolumesFromMounts(mounts) {
  return (mounts || [])
    .filter((m) => m && m.Type === 'volume' && AGENT_VOLUME.test(m.Name || ''))
    .map((m) => m.Name)
    .sort();
}

/** Agent volume names in a newline-separated `docker volume ls -q` listing. */
export function agentVolumesFromList(stdout) {
  return String(stdout || '').split('\n').map((s) => s.trim()).filter((n) => AGENT_VOLUME.test(n)).sort();
}

export function parseArgs(argv) {
  const flags = new Set();
  const rest = [];
  for (const a of argv) { if (a.startsWith('--')) flags.add(a); else rest.push(a); }
  return { flags, rest };
}

// ── process helpers ─────────────────────────────────────────────────────────

// DOCKER_CLI_HINTS=false suppresses Docker Desktop's "What's next: try docker
// debug ..." promo, which the docker CLI prints after commands the devcontainer
// CLI runs on our behalf -- noise in the middle of every `dc claude`.
const CHILD_ENV = { ...process.env, DOCKER_CLI_HINTS: 'false' };

/**
 * Quote one argument for a cmd.exe command line.
 *
 * Never rely on Node's shell:true here: it joins arguments UNQUOTED, so a space
 * splits an argument in two, and cmd.exe interprets a bare | or & as its own
 * operator. That silently dropped every multi-word argument on Windows -- the
 * login-shell wrapper, prompts passed to `dc claude`, paths with spaces, and
 * the tab-separated docker --format string.
 *
 * Standard MSVCRT rules: backslashes double only when they precede a quote;
 * embedded quotes become backslash-quote. Args with cmd metacharacters are
 * quoted too -- inside double quotes cmd leaves them alone.
 */
export function winQuote(a) {
  a = String(a);
  if (a === '') return '""';
  if (!/[\s"&|<>^%();=,]/.test(a)) return a;
  let out = '"', bs = 0;
  for (const ch of a) {
    if (ch === '\\') { bs++; continue; }
    if (ch === '"') { out += '\\'.repeat(bs * 2 + 1) + '"'; bs = 0; continue; }
    out += '\\'.repeat(bs) + ch; bs = 0;
  }
  return out + '\\'.repeat(bs * 2) + '"';
}

/**
 * Spawn a child with arguments passed intact.
 *
 * Tries a direct (no-shell) spawn first, which is exact on every OS. On Windows
 * that fails for .cmd shims (npm installs devcontainer/npx as .cmd, and Node
 * refuses to exec those without a shell), so fall back to cmd.exe with a
 * command line we quote ourselves via winQuote.
 */
export function spawnSmart(cmd, args, opts = {}) {
  let r = spawnSync(cmd, args, { ...opts, env: CHILD_ENV });
  if (IS_WIN && r.error) {
    const line = '"' + [cmd, ...args].map(winQuote).join(' ') + '"';
    r = spawnSync('cmd.exe', ['/d', '/s', '/c', line],
      { ...opts, env: CHILD_ENV, windowsVerbatimArguments: true });
  }
  return r;
}

const run = (cmd, args, opts = {}) => spawnSmart(cmd, args, { stdio: 'inherit', ...opts });
const capture = (cmd, args) => spawnSmart(cmd, args, { encoding: 'utf8' });

function has(cmd) {
  const r = capture(IS_WIN ? 'where' : 'which', [cmd]);
  return r.status === 0;
}

/** Prefer a globally installed devcontainer binary; fall back to npx. */
function devcontainerCmd() {
  if (has('devcontainer')) return ['devcontainer', []];
  return ['npx', ['-y', '@devcontainers/cli@latest']];
}

function dc(args) {
  const [cmd, prefix] = devcontainerCmd();
  return run(cmd, [...prefix, ...args]).status ?? 1;
}

/** Fail fast with a readable message instead of letting the CLI emit a stack trace. */
function preflight() {
  const hasDocker = has('docker');
  const daemon = hasDocker && capture('docker', ['info']).status === 0;
  const err = preflightError(hasDocker, daemon);
  if (err) { console.error(`dc: ${err}`); return false; }
  return true;
}

/** All agent volumes on this machine (or only those no container uses). */
function agentVolumesOnMachine({ danglingOnly = false } = {}) {
  const args = ['volume', 'ls', '-q', ...(danglingOnly ? ['--filter', 'dangling=true'] : [])];
  const r = capture('docker', args);
  return r.status === 0 ? agentVolumesFromList(r.stdout) : [];
}

/**
 * This project's agent volumes: those its containers mount, plus any whose
 * name matches the id the CLI derives from this folder. The second finds the
 * data after `dc rm`, when there is no container to ask. Only names that
 * exist are returned, so a path form the hash doesn't match finds nothing
 * rather than something wrong.
 */
function projectVolumes(root, containers) {
  const names = new Set();
  for (const c of containers) {
    const r = capture('docker', ['inspect', '--format', '{{json .Mounts}}', c.id]);
    if (r.status !== 0) continue;
    try { for (const n of agentVolumesFromMounts(JSON.parse(r.stdout))) names.add(n); } catch { /* skip */ }
  }
  const existing = new Set(agentVolumesOnMachine());
  for (const n of agentVolumeNames(devcontainerId(idLabelsFor(root)))) if (existing.has(n)) names.add(n);
  return [...names].sort();
}

/** Ask before deleting. --yes skips; without a terminal to ask on, refuse. */
async function confirm(question, flags) {
  if (flags.has('--yes')) return true;
  if (!process.stdin.isTTY) {
    console.error('dc: not deleting without confirmation; rerun with --yes.');
    return false;
  }
  // Imported here so an old Node still reaches the friendly version check.
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return /^y(es)?$/i.test((await rl.question(`${question} [y/N] `)).trim()); }
  catch { process.stdout.write('\n'); return false; } // Ctrl+C / Ctrl+D at the prompt
  finally { rl.close(); }
}

/** Remove the containers, then the volumes (Docker refuses while a container uses them). */
function removeContainersAndVolumes(containers, volumes) {
  for (const c of containers) {
    if ((run('docker', ['rm', '-f', c.id]).status ?? 1) !== 0) {
      console.error(`dc: could not remove container ${c.id} (see above); nothing was deleted.`);
      return 1;
    }
  }
  if (!volumes.length) return 0;
  const status = run('docker', ['volume', 'rm', ...volumes]).status ?? 1;
  if (status !== 0) {
    console.error('dc: could not delete every volume (see above).'
      + (containers.length ? ' The container was removed; `dc up` starts it again.' : ''));
  }
  return status;
}

function listVolumes(volumes) {
  for (const v of volumes) console.log(`  ${v}`);
}

async function cmdPrune(flags) {
  const orphans = agentVolumesOnMachine({ danglingOnly: true });
  if (!orphans.length) { console.log('no unused agent volumes.'); return 0; }
  console.log('Agent volumes no container uses, from any project on this machine that was');
  console.log('moved, renamed, or removed with `dc rm` and not started again:');
  listVolumes(orphans);
  console.log('\nA project removed with `dc rm` picks its data up again on its next `dc up`;');
  console.log('deleting it here loses that history.');
  if (!(await confirm(`Delete these ${orphans.length} volume(s)?`, flags))) return 1;
  return run('docker', ['volume', 'rm', ...orphans]).status ?? 1;
}

async function cmdVolumes(root, flags) {
  const cs = findContainers(root);
  const volumes = projectVolumes(root, cs);
  if (!volumes.length) {
    console.log('this project has no saved agent data.');
    if (!cs.length) {
      const n = agentVolumesOnMachine({ danglingOnly: true }).length;
      if (n) console.log(`(${n} agent volume(s) on this machine are unused; \`dc volumes --prune\` lists them.)`);
    }
    return 0;
  }
  if (!flags.has('--rm')) {
    console.log('Saved agent data for this project (history, memory, settings, plugins; no sign-ins):');
    listVolumes(volumes);
    console.log('\n`dc volumes --rm` deletes it; `dc up --fresh` deletes it and starts a new container.');
    return 0;
  }
  console.log(cs.length ? 'This removes the container and deletes:' : 'This deletes:');
  listVolumes(volumes);
  if (!(await confirm('Delete this project\'s agent history, memory, settings, and plugins?', flags))) return 1;
  const status = removeContainersAndVolumes(cs, volumes);
  if (status === 0) console.log('done. The next `dc up` starts with empty agent folders.');
  return status;
}

function requireRoot() {
  const root = findProjectRoot(process.cwd());
  if (!root) {
    console.error('dc: no .devcontainer/devcontainer.json found in this directory or any parent.');
    process.exit(1);
  }
  return root;
}

/** Every container the devcontainer CLI has labelled, regardless of project. */
function allDevcontainers() {
  const r = capture('docker', [
    'ps', '-a', '--filter', `label=${LABEL}`,
    '--format', `{{.ID}}\t{{.State}}\t{{.Label "${LABEL}"}}`,
  ]);
  if (r.status !== 0) return [];
  return (r.stdout || '')
    .split('\n').filter(Boolean)
    .map((line) => { const [id, state, folder] = line.split('\t'); return { id, state, folder }; });
}

/** Containers this project owns. */
function findContainers(root) {
  const want = normalizeLocalFolder(root);
  return allDevcontainers().filter((c) => normalizeLocalFolder(c.folder) === want);
}

/**
 * Explain a no-match. Distinguishes "you have no containers" from "your label
 * looks different than expected", which is the likely failure on Docker Desktop's
 * WSL2 backend where host paths can be rewritten.
 */
function reportNoMatch(root) {
  const all = allDevcontainers();
  console.log(`no container for ${root}`);
  if (!all.length) return;
  console.log(`\n  ${all.length} dev container(s) exist, but none match this path:`);
  for (const c of all) console.log(`    ${c.id}  ${c.state}  ${c.folder}`);
  console.log(`\n  looking for (normalized): ${normalizeLocalFolder(root)}`);
  console.log('  If one of the above is this project, the label format is unhandled --');
  console.log('  please report it.');
}

// ── install / uninstall ─────────────────────────────────────────────────────

// Windows gets BOTH shims. CMD cannot run a .ps1, and PowerShell going through
// a .cmd loses arguments: PS does not quote a bare `a&b`, so cmd.exe splits on
// the & and discards everything after it. Each shell needs its own entry point.
const installPaths = (name = 'dc') => IS_WIN
  ? { payload: join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Programs', 'dc'),
      binDir:  join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Programs', 'dc'),
      shims: [`${name}.cmd`, `${name}.ps1`] }
  : { payload: join(homedir(), '.local', 'share', 'dc'),
      binDir:  join(homedir(), '.local', 'bin'),
      shims: [name] };

/** Body for a generated shim, with the payload path baked in absolutely. */
export function shimBody(kind, target) {
  if (kind === 'cmd') return `@node "${target}" %*\r\n`;
  if (kind === 'ps1') return `node "${target}" @args\r\nexit $LASTEXITCODE\r\n`;
  return `#!/bin/sh\nexec node "${target}" "$@"\n`;
}

function cmdInstall(flags, rest) {
  const name = (rest[0] || 'dc').replace(/[^\w.-]/g, '');
  const link = flags.has('--link');
  const { payload, binDir, shims } = installPaths(name);
  mkdirSync(binDir, { recursive: true });

  // --link points the shim at the repo copy so edits take effect immediately.
  const target = link ? join(HERE, 'dc.mjs') : join(payload, 'dc.mjs');
  if (!link) { mkdirSync(payload, { recursive: true }); copyFileSync(join(HERE, 'dc.mjs'), target); }

  // Generated shims embed an ABSOLUTE path, so there is no symlink resolution to
  // get wrong (BSD/macOS readlink lacks -f on older releases).
  for (const shim of shims) {
    const shimPath = join(binDir, shim);
    const kind = shim.endsWith('.cmd') ? 'cmd' : shim.endsWith('.ps1') ? 'ps1' : 'sh';
    writeFileSync(shimPath, shimBody(kind, target));
    if (kind === 'sh') chmodSync(shimPath, 0o755);
    console.log(`installed: ${shimPath}${link ? '  (linked to repo)' : ''}`);
  }

  const onPath = (process.env.PATH || '').split(IS_WIN ? ';' : ':')
    .some((p) => normalizeLocalFolder(p) === normalizeLocalFolder(binDir));

  if (IS_WIN) {
    // Append to the *registry* User PATH, not the merged process PATH.
    const ps = has('pwsh') ? 'pwsh' : 'powershell';
    const script =
      `$d='${binDir}';` +
      `$u=[Environment]::GetEnvironmentVariable('Path','User');` +
      `if(($u -split ';') -notcontains $d){[Environment]::SetEnvironmentVariable('Path',($u.TrimEnd(';')+';'+$d),'User');Write-Output 'added'}`;
    const r = capture(ps, ['-NoProfile', '-Command', script]);
    if ((r.stdout || '').includes('added')) {
      console.log(`added to your user PATH: ${binDir}`);
      console.log('open a NEW terminal for it to take effect.');
    }
  } else if (!onPath) {
    console.log(`\nNOTE: ${binDir} is not on your PATH. Add to your shell profile:`);
    console.log(`  export PATH="${binDir}:$PATH"`);
  }
  if (!IS_WIN && name === 'dc' && has('dc')) {
    console.log('\nNOTE: a `dc` command already exists (POSIX desk calculator).');
    console.log('This install shadows it. Re-run as `dc install dcx` to pick another name.');
  }
  return 0;
}

function cmdUninstall(_flags, rest) {
  const name = (rest[0] || 'dc').replace(/[^\w.-]/g, '');
  const { payload, binDir, shims } = installPaths(name);

  let any = false;
  for (const shim of shims) {
    const shimPath = join(binDir, shim);
    if (existsSync(shimPath)) { rmSync(shimPath, { force: true }); console.log(`removed: ${shimPath}`); any = true; }
  }
  if (!any) console.log(`not installed: ${join(binDir, shims[0])}`);

  // Only drop the shared payload once no remaining shim references it — installing
  // under a second name (dc install dcx) must not be broken by removing the first.
  if (existsSync(payload)) {
    const target = join(payload, 'dc.mjs');
    const stillUsed = readdirSync(binDir).some((f) => {
      try { return readFileSync(join(binDir, f), 'utf8').includes(target); } catch { return false; }
    });
    if (stillUsed) console.log(`kept: ${payload} (still used by another install)`);
    else { rmSync(payload, { recursive: true, force: true }); console.log(`removed: ${payload}`); }
  }
  // If nothing of ours is left in the bin dir, remove the PATH entry install
  // added. Only ever the exact directory we created, so nothing else can break.
  // On Windows payload and binDir are the SAME folder, so by this point the
  // payload removal above has usually deleted it -- a missing dir means the
  // same thing as an empty one: the last install is gone.
  if (IS_WIN && (!existsSync(binDir) || readdirSync(binDir).length === 0)) {
    rmSync(binDir, { recursive: true, force: true });
    const ps = has('pwsh') ? 'pwsh' : 'powershell';
    const script =
      `$d='${binDir}';` +
      `$u=[Environment]::GetEnvironmentVariable('Path','User');` +
      `$n=(($u -split ';') | Where-Object { $_ -and $_ -ne $d }) -join ';';` +
      `if($n -ne $u){[Environment]::SetEnvironmentVariable('Path',$n,'User');Write-Output 'removed'}`;
    const r = capture(ps, ['-NoProfile', '-Command', script]);
    if ((r.stdout || '').includes('removed')) console.log('removed the PATH entry too.');
    else if (r.stderr) console.error(`warning: could not remove the PATH entry: ${r.stderr.trim().split('\n')[0]}`);
  }
  return 0;
}

function cmdDoctor() {
  const ok = (b) => (b ? 'ok  ' : 'FAIL');
  const nodeOk = Number(process.versions.node.split('.')[0]) >= 18;
  console.log(`${ok(nodeOk)} node ${process.versions.node}${nodeOk ? '' : '  (need >= 18)'}`);

  const dockerOk = has('docker') && capture('docker', ['info']).status === 0;
  console.log(`${ok(dockerOk)} docker ${dockerOk ? 'running' : 'not found or not running'}`);

  const [c] = devcontainerCmd();
  console.log(`${ok(true)} devcontainer cli via ${c === 'devcontainer' ? 'global install' : 'npx (slower; npm i -g @devcontainers/cli)'}`);

  // Not being in a project is not a broken setup, so do not shout FAIL at
  // someone running `dc doctor` from their home directory to check the install.
  const root = findProjectRoot(process.cwd());
  if (root) console.log(`${ok(true)} project ${root}`);
  else console.log(`--   project  none here; cd to a folder with .devcontainer/devcontainer.json`);
  if (root && dockerOk) {
    const cs = findContainers(root);
    console.log(`     containers: ${cs.length ? cs.map((x) => `${x.id} (${x.state})`).join(', ') : 'none'}`);
  }
  return dockerOk && nodeOk ? 0 : 1;
}

// ── commands ────────────────────────────────────────────────────────────────

const HELP = `dc — dev containers without VS Code

  dc up [--rebuild] [--no-cache]   create/start the container
  dc up --fresh [--yes]            rebuild with empty agent folders (deletes history)
  dc build                         build the image
  dc shell                         interactive shell inside it
  dc exec <cmd> [args...]          run a command inside it
  dc claude|codex|gemini|pw [...]  run an agent inside it
  dc down                          stop the container
  dc rm                            stop and remove it (agent data is kept)
  dc volumes [--rm | --prune]      list or delete saved agent data (--yes: don't ask)
  dc status                        show this project's containers
  dc logs [--follow]               container logs
  dc doctor                        check prerequisites
  dc install [name] [--link]       install to your PATH
  dc uninstall [name]              remove it
`;

const FORWARDING = new Set(['exec', 'claude', 'codex', 'gemini', 'pw']);

async function main(argv) {
  const cmd = argv[0];
  // Forwarding commands keep their arguments verbatim; only dc's own commands
  // get flag parsing.
  const raw = argv.slice(1);
  const { flags, rest } = FORWARDING.has(cmd) ? { flags: new Set(), rest: raw } : parseArgs(raw);

  if (Number(process.versions.node.split('.')[0]) < 18) {
    console.error(`dc: Node 18+ required (found ${process.versions.node}).`);
    return 1;
  }
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h' || flags.has('--help')) { console.log(HELP); return 0; }
  if (cmd === 'version' || cmd === '--version' || flags.has('--version')) { console.log('dc 1.0.0'); return 0; }
  if (cmd === 'install') return cmdInstall(flags, rest);
  if (cmd === 'uninstall') return cmdUninstall(flags, rest);
  if (cmd === 'doctor') return cmdDoctor();
  if (cmd === 'volumes') {
    const unknown = [...flags].filter((f) => !['--rm', '--prune', '--yes'].includes(f));
    if (unknown.length) { console.error(`dc volumes: unknown option ${unknown.join(' ')}`); return 1; }
  }
  if (cmd === 'volumes' && flags.has('--prune')) {
    if (flags.has('--rm')) { console.error('dc volumes: use --rm or --prune, not both.'); return 1; }
    // Works across projects, so it doesn't need to run inside one.
    return preflight() ? cmdPrune(flags) : 1;
  }

  const root = requireRoot();
  // Every remaining command talks to Docker one way or another.
  if (!preflight()) return 1;

  switch (cmd) {
    case 'up': {
      const a = ['up', '--workspace-folder', root];
      if (flags.has('--fresh')) {
        const cs = findContainers(root);
        const volumes = projectVolumes(root, cs);
        if (volumes.length) {
          console.log('--fresh deletes this project\'s saved agent data:');
          listVolumes(volumes);
          if (!(await confirm('Delete it and rebuild?', flags))) return 1;
        } else {
          console.log('no saved agent data for this project; nothing to clear.');
        }
        const status = removeContainersAndVolumes(cs, volumes);
        if (status !== 0) return status;
      }
      if (flags.has('--rebuild') || flags.has('--fresh')) a.push('--remove-existing-container');
      if (flags.has('--no-cache')) a.push('--build-no-cache');
      return dc(a);
    }
    case 'build':
      return dc(['build', '--workspace-folder', root, ...(flags.has('--no-cache') ? ['--no-cache'] : [])]);
    case 'shell':
      return dc(buildExecArgs(root, ['bash', '-l'], { login: false, env: process.env }));
    case 'exec': {
      if (!raw.length) { console.error('dc exec: need a command'); return 1; }
      // Login shell here too: node/npm resolve via /etc/profile.d in this image,
      // so a non-login exec would not find them either.
      return dc(buildExecArgs(root, raw, { env: process.env }));
    }
    case 'claude': case 'codex': case 'gemini': case 'pw': {
      const tool = cmd === 'pw' ? 'playwright-cli' : cmd;
      return dc(buildExecArgs(root, [tool, ...raw], { env: process.env }));
    }
    case 'down': case 'rm': {
      const cs = findContainers(root);
      if (!cs.length) { reportNoMatch(root); return 0; }
      const volumes = cmd === 'rm' ? projectVolumes(root, cs) : [];
      for (const c of cs) {
        run('docker', cmd === 'rm' ? ['rm', '-f', c.id] : ['stop', c.id]);
      }
      if (volumes.length) {
        console.log('agent data kept for the next `dc up`:');
        listVolumes(volumes);
        console.log('`dc volumes --rm` deletes it.');
      }
      return 0;
    }
    case 'volumes':
      return cmdVolumes(root, flags);
    case 'status': {
      const cs = findContainers(root);
      if (!cs.length) { reportNoMatch(root); return 0; }
      for (const c of cs) console.log(`${c.id}  ${c.state}  ${c.folder}`);
      return 0;
    }
    case 'logs': {
      const [c] = findContainers(root);
      if (!c) { reportNoMatch(root); return 1; }
      return run('docker', ['logs', ...(flags.has('--follow') ? ['-f'] : []), c.id]).status ?? 1;
    }
    default:
      console.error(`dc: unknown command '${cmd}'\n`);
      console.log(HELP);
      return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => { console.error(`dc: ${err && err.message ? err.message : err}`); process.exit(1); },
  );
}
