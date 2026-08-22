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
import { dirname, join, resolve, parse as parsePath } from 'node:path';
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
export function buildExecArgs(root, argv, { login = true } = {}) {
  const base = ['exec', '--workspace-folder', root];
  if (!login) return [...base, ...argv];
  const [cmd, ...rest] = argv;
  // `bash -lc '<script>' <argv0> <args...>` — argv0 fills $0 so "$@" is the real args.
  return [...base, 'bash', '-lc', `${cmd} "$@"`, cmd, ...rest];
}

/** Split dc's own flags from positional args. Only used for dc's own commands —
 *  forwarding commands (exec, claude, ...) pass their argv through untouched so
 *  user flags keep their original order and meaning. */
export function parseArgs(argv) {
  const flags = new Set();
  const rest = [];
  for (const a of argv) { if (a.startsWith('--')) flags.add(a); else rest.push(a); }
  return { flags, rest };
}

// ── process helpers ─────────────────────────────────────────────────────────

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: IS_WIN, ...opts });

const capture = (cmd, args) =>
  spawnSync(cmd, args, { encoding: 'utf8', shell: IS_WIN });

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

function requireRoot() {
  const root = findProjectRoot(process.cwd());
  if (!root) {
    console.error('dc: no .devcontainer/devcontainer.json found in this directory or any parent.');
    process.exit(1);
  }
  return root;
}

/** Containers this project owns, newest first. */
function findContainers(root) {
  const want = normalizeLocalFolder(root);
  const r = capture('docker', [
    'ps', '-a', '--filter', `label=${LABEL}`,
    '--format', `{{.ID}}\t{{.State}}\t{{.Label "${LABEL}"}}`,
  ]);
  if (r.status !== 0) return [];
  return (r.stdout || '')
    .split('\n').filter(Boolean)
    .map((line) => { const [id, state, folder] = line.split('\t'); return { id, state, folder }; })
    .filter((c) => normalizeLocalFolder(c.folder) === want);
}

// ── install / uninstall ─────────────────────────────────────────────────────

const installPaths = (name = 'dc') => IS_WIN
  ? { payload: join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Programs', 'dc'),
      binDir:  join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'Programs', 'dc'),
      shim: `${name}.cmd` }
  : { payload: join(homedir(), '.local', 'share', 'dc'),
      binDir:  join(homedir(), '.local', 'bin'),
      shim: name };

function cmdInstall(flags, rest) {
  const name = (rest[0] || 'dc').replace(/[^\w.-]/g, '');
  const link = flags.has('--link');
  const { payload, binDir, shim } = installPaths(name);
  mkdirSync(binDir, { recursive: true });

  // --link points the shim at the repo copy so edits take effect immediately.
  const target = link ? join(HERE, 'dc.mjs') : join(payload, 'dc.mjs');
  if (!link) { mkdirSync(payload, { recursive: true }); copyFileSync(join(HERE, 'dc.mjs'), target); }

  // Generated shims embed an ABSOLUTE path, so there is no symlink resolution to
  // get wrong (BSD/macOS readlink lacks -f on older releases).
  const shimPath = join(binDir, shim);
  if (IS_WIN) {
    writeFileSync(shimPath, `@node "${target}" %*\r\n`);
  } else {
    writeFileSync(shimPath, `#!/bin/sh\nexec node "${target}" "$@"\n`);
    chmodSync(shimPath, 0o755);
  }

  console.log(`installed: ${shimPath}${link ? '  (linked to repo)' : ''}`);

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
  const { payload, binDir, shim } = installPaths(name);

  const shimPath = join(binDir, shim);
  if (existsSync(shimPath)) { rmSync(shimPath, { force: true }); console.log(`removed: ${shimPath}`); }
  else console.log(`not installed: ${shimPath}`);

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
  if (IS_WIN) console.log('note: your user PATH entry was left in place.');
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

  const root = findProjectRoot(process.cwd());
  console.log(`${ok(!!root)} project ${root || 'no .devcontainer/devcontainer.json found'}`);
  if (root && dockerOk) {
    const cs = findContainers(root);
    console.log(`     containers: ${cs.length ? cs.map((x) => `${x.id} (${x.state})`).join(', ') : 'none'}`);
  }
  return dockerOk && nodeOk ? 0 : 1;
}

// ── commands ────────────────────────────────────────────────────────────────

const HELP = `dc — dev containers without VS Code

  dc up [--rebuild] [--no-cache]   create/start the container
  dc build                         build the image
  dc shell                         interactive shell inside it
  dc exec <cmd> [args...]          run a command inside it
  dc claude|codex|gemini|pw [...]  run an agent inside it
  dc down                          stop the container
  dc rm                            stop and remove it
  dc status                        show this project's containers
  dc logs [--follow]               container logs
  dc doctor                        check prerequisites
  dc install [name] [--link]       install to your PATH
  dc uninstall [name]              remove it
`;

const FORWARDING = new Set(['exec', 'claude', 'codex', 'gemini', 'pw']);

function main(argv) {
  const cmd = argv[0];
  // Forwarding commands keep their arguments verbatim; only dc's own commands
  // get flag parsing.
  const raw = argv.slice(1);
  const { flags, rest } = FORWARDING.has(cmd) ? { flags: new Set(), rest: raw } : parseArgs(raw);

  if (!cmd || cmd === 'help' || flags.has('--help')) { console.log(HELP); return 0; }
  if (cmd === 'version' || flags.has('--version')) { console.log('dc 1.0.0'); return 0; }
  if (cmd === 'install') return cmdInstall(flags, rest);
  if (cmd === 'uninstall') return cmdUninstall(flags, rest);
  if (cmd === 'doctor') return cmdDoctor();

  const root = requireRoot();

  switch (cmd) {
    case 'up': {
      const a = ['up', '--workspace-folder', root];
      if (flags.has('--rebuild')) a.push('--remove-existing-container');
      if (flags.has('--no-cache')) a.push('--build-no-cache');
      return dc(a);
    }
    case 'build':
      return dc(['build', '--workspace-folder', root, ...(flags.has('--no-cache') ? ['--no-cache'] : [])]);
    case 'shell':
      return dc(['exec', '--workspace-folder', root, 'bash', '-l']);
    case 'exec': {
      if (!raw.length) { console.error('dc exec: need a command'); return 1; }
      // Login shell here too: node/npm resolve via /etc/profile.d in this image,
      // so a non-login exec would not find them either.
      return dc(buildExecArgs(root, raw));
    }
    case 'claude': case 'codex': case 'gemini': case 'pw': {
      const tool = cmd === 'pw' ? 'playwright-cli' : cmd;
      return dc(buildExecArgs(root, [tool, ...raw]));
    }
    case 'down': case 'rm': {
      const cs = findContainers(root);
      if (!cs.length) { console.log('no container for this project'); return 0; }
      for (const c of cs) {
        run('docker', cmd === 'rm' ? ['rm', '-f', c.id] : ['stop', c.id]);
      }
      return 0;
    }
    case 'status': {
      const cs = findContainers(root);
      if (!cs.length) { console.log(`no container for ${root}`); return 0; }
      for (const c of cs) console.log(`${c.id}  ${c.state}  ${c.folder}`);
      return 0;
    }
    case 'logs': {
      const [c] = findContainers(root);
      if (!c) { console.log('no container for this project'); return 1; }
      return run('docker', ['logs', ...(flags.has('--follow') ? ['-f'] : []), c.id]).status ?? 1;
    }
    default:
      console.error(`dc: unknown command '${cmd}'\n`);
      console.log(HELP);
      return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
