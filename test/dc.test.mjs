// Unit tests for dc's platform-sensitive logic. These run anywhere, which is the
// point: the Windows-specific behaviour is expressed as pure functions so it can
// be tested without Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, mkdtempSync, mkdirSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findProjectRoot, normalizeLocalFolder, buildExecArgs, parseArgs, preflightError, terminalEnv, winQuote, spawnSmart, AGENT_VOLUME, agentVolumesFromMounts, agentVolumesFromList } from '../.devcontainer/dc.mjs';

test('normalizeLocalFolder: windows drive-letter case and slashes', () => {
  const a = normalizeLocalFolder('C:\\Users\\rich\\proj', 'win32');
  assert.equal(a, normalizeLocalFolder('c:/Users/rich/proj', 'win32'));
  assert.equal(a, normalizeLocalFolder('C:/USERS/RICH/PROJ/', 'win32'));
});

test('normalizeLocalFolder: posix stays case-sensitive', () => {
  assert.notEqual(normalizeLocalFolder('/home/Rich/p', 'linux'), normalizeLocalFolder('/home/rich/p', 'linux'));
  assert.equal(normalizeLocalFolder('/home/rich/p/', 'linux'), '/home/rich/p');
});

test('normalizeLocalFolder: empty input', () => {
  assert.equal(normalizeLocalFolder(undefined), '');
  assert.equal(normalizeLocalFolder(''), '');
});

test('findProjectRoot: walks up to the nearest project', () => {
  const root = resolve('/a/b');
  const marker = join(root, '.devcontainer', 'devcontainer.json');
  assert.equal(findProjectRoot(resolve('/a/b/c/d'), (p) => p === marker), root);
});

test('findProjectRoot: terminates at the filesystem root', () => {
  assert.equal(findProjectRoot(resolve('/x/y'), () => false), null);
});

test('buildExecArgs: uses a LOGIN shell and passes args via "$@"', () => {
  const a = buildExecArgs('/proj', ['claude', '--model', 'opus', 'say "hi"']);
  assert.deepEqual(a.slice(-7), [
    'bash', '-lc', 'claude "$@"',
    'claude', '--model', 'opus', 'say "hi"',
  ]);
  assert.equal(a[0], 'exec');
});

test('terminalEnv: defaults for shells that set nothing (Windows)', () => {
  assert.deepEqual(terminalEnv({}), ['TERM=xterm-256color', 'COLORTERM=truecolor']);
});

test('terminalEnv: forwards the host values when present', () => {
  assert.deepEqual(terminalEnv({ TERM: 'screen-256color', COLORTERM: '24bit', LANG: 'en_US.UTF-8' }),
    ['TERM=screen-256color', 'COLORTERM=24bit', 'LANG=en_US.UTF-8']);
});

test('buildExecArgs: advertises colour capability to the container', () => {
  const a = buildExecArgs('/p', ['claude'], { env: {} });
  assert.ok(a.includes('--remote-env') && a.includes('COLORTERM=truecolor'));
});

test('buildExecArgs: login:false bypasses the shell wrapper', () => {
  assert.deepEqual(buildExecArgs('/p', ['ls', '-la'], { login: false }).slice(-2), ['ls', '-la']);
});

test('parseArgs: separates flags from positionals', () => {
  const { flags, rest } = parseArgs(['--rebuild', 'name', '--no-cache']);
  assert.ok(flags.has('--rebuild') && flags.has('--no-cache'));
  assert.deepEqual(rest, ['name']);
});

test('preflightError: missing docker names the platform installer', () => {
  assert.match(preflightError(false, false, 'win32'), /Docker Desktop/);
  assert.match(preflightError(false, false, 'linux'), /docs\.docker\.com\/engine/);
});

test('preflightError: installed but stopped is a different message', () => {
  assert.match(preflightError(true, false, 'darwin'), /installed but not running/);
  assert.match(preflightError(true, false, 'linux'), /systemctl/);
});

test('preflightError: null when everything is present', () => {
  assert.equal(preflightError(true, true, 'linux'), null);
});

test('winQuote: plain args pass through unquoted', () => {
  assert.equal(winQuote('abc'), 'abc');
  assert.equal(winQuote('C:\\Users\\x'), 'C:\\Users\\x');
});

test('winQuote: spaces, metacharacters, quotes, empties', () => {
  assert.equal(winQuote('a b'), '"a b"');
  assert.equal(winQuote('a&b'), '"a&b"');
  assert.equal(winQuote('claude "$@"'), '"claude \\"$@\\""');
  assert.equal(winQuote(''), '""');
  // trailing backslash inside quotes must double, or it escapes the closing quote
  assert.equal(winQuote('a b\\'), '"a b\\\\"');
});

test('spawnSmart: multi-word and metachar args arrive intact', (t) => {
  // Direct spawn path (every OS). On Windows CI this also exercises the
  // cmd.exe fallback below.
  const echo = join(tmpdir(), `dcargs-${process.pid}.mjs`);
  writeFileSync(echo, 'console.log(JSON.stringify(process.argv.slice(2)))');
  const argv = ['a b', 'a&b', 'C:\\Users\\x', 'claude "$@"', '--flag', ''];
  const r = spawnSmart(process.execPath, [echo, ...argv], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), argv);
});

test('spawnSmart: .cmd shim on Windows keeps args intact', (t) => {
  if (process.platform !== 'win32') return t.skip('windows only');
  const dir = tmpdir();
  const echo = join(dir, 'dcargs2.mjs');
  writeFileSync(echo, 'console.log(JSON.stringify(process.argv.slice(2)))');
  const shim = join(dir, 'dcargs2.cmd');
  writeFileSync(shim, `@node "${echo}" %*\r\n`);
  const argv = ['a b', 'C:\\Users\\x', 'claude "$@"', '--flag'];
  const r = spawnSmart(shim, argv, { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), argv);
});

// ── agent volumes ───────────────────────────────────────────────────────────

const ID = 'a'.repeat(20) + '0123456789bcdefghijklmnopqrstuv';

test('AGENT_VOLUME: matches only the volumes devcontainer.json declares', () => {
  for (const tool of ['claude', 'codex', 'gemini']) assert.ok(AGENT_VOLUME.test(`agent-${tool}-${ID}`));
  for (const name of ['agent-claude-', 'agent-gh-abc', 'my-agent-claude-abc', 'agent-claude-ABC', 'postgres-data', `agent-claude-${ID}/x`]) {
    assert.ok(!AGENT_VOLUME.test(name), name);
  }
});

test('agentVolumesFromMounts: keeps agent volumes, drops binds and other volumes', () => {
  const mounts = [
    { Type: 'bind', Source: '/home/me/proj', Destination: '/workspaces/proj' },
    { Type: 'volume', Name: `agent-gemini-${ID}`, Destination: '/home/vscode/.gemini' },
    { Type: 'volume', Name: `agent-claude-${ID}`, Destination: '/home/vscode/.claude' },
    { Type: 'volume', Name: 'node_modules-cache', Destination: '/workspaces/proj/node_modules' },
  ];
  assert.deepEqual(agentVolumesFromMounts(mounts), [`agent-claude-${ID}`, `agent-gemini-${ID}`]);
  assert.deepEqual(agentVolumesFromMounts(null), []);
});

test('agentVolumesFromList: filters a docker volume ls listing', () => {
  assert.deepEqual(agentVolumesFromList(`postgres-data\nagent-codex-${ID}\n\n`), [`agent-codex-${ID}`]);
});

// ── commands against a fake docker ──────────────────────────────────────────
// A stand-in docker/devcontainer pair on PATH records every call, so these
// tests pin down exactly what dc asks Docker to do. POSIX shell fakes, so not
// on Windows; the pure helpers above cover the matching logic everywhere.

const DC = fileURLToPath(new URL('../.devcontainer/dc.mjs', import.meta.url));
const OTHER = 'b'.repeat(52);

function fakeDocker({ container = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'dc-fake-'));
  const bin = join(dir, 'bin'); mkdirSync(bin);
  const proj = join(dir, 'proj'); mkdirSync(join(proj, '.devcontainer'), { recursive: true });
  writeFileSync(join(proj, '.devcontainer', 'devcontainer.json'), '{}');
  const log = join(dir, 'calls.log');
  const mounts = JSON.stringify([
    { Type: 'bind', Source: proj, Destination: '/workspaces/proj' },
    { Type: 'volume', Name: `agent-claude-${ID}` },
    { Type: 'volume', Name: `agent-codex-${ID}` },
  ]);
  writeFileSync(join(bin, 'docker'), `#!/bin/sh
echo "docker $*" >> '${log}'
case "$1 $2" in
  "info "*) exit 0 ;;
  "ps -a") ${container ? `printf 'c1\trunning\t%s\n' '${proj}'` : 'true'} ;;
  "inspect --format") echo '${mounts}' ;;
  "volume ls") printf 'agent-gemini-${OTHER}\npostgres-data\n' ;;
esac
exit 0
`);
  writeFileSync(join(bin, 'devcontainer'), `#!/bin/sh\necho "devcontainer $*" >> '${log}'\n`);
  chmodSync(join(bin, 'docker'), 0o755); chmodSync(join(bin, 'devcontainer'), 0o755);
  const runDc = (...args) => spawnSync(process.execPath, [DC, ...args], {
    cwd: proj, encoding: 'utf8', input: '',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });
  const calls = () => (existsSync(log) ? readFileSync(log, 'utf8') : '').split('\n')
    .filter((l) => l && !/^docker (info|ps|inspect|volume ls)/.test(l));
  return { runDc, calls, proj };
}

const posixOnly = (t) => { if (process.platform === 'win32') { t.skip('POSIX shell fakes'); return true; } return false; };

test('dc volumes: lists this project\'s agent volumes and changes nothing', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls } = fakeDocker();
  const r = runDc('volumes');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`agent-claude-${ID}`));
  assert.match(r.stdout, new RegExp(`agent-codex-${ID}`));
  assert.deepEqual(calls(), []);
});

test('dc volumes --rm: refuses without a terminal or --yes', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls } = fakeDocker();
  const r = runDc('volumes', '--rm');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--yes/);
  assert.deepEqual(calls(), []);
});

test('dc volumes --rm --yes: removes the container, then exactly its agent volumes', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls } = fakeDocker();
  const r = runDc('volumes', '--rm', '--yes');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(calls(), ['docker rm -f c1', `docker volume rm agent-claude-${ID} agent-codex-${ID}`]);
});

test('dc volumes --prune --yes: deletes only unattached agent volumes', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls } = fakeDocker();
  const r = runDc('volumes', '--prune', '--yes');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(calls(), [`docker volume rm agent-gemini-${OTHER}`]);
});

test('dc up --fresh --yes: clears the agent volumes before rebuilding', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls, proj } = fakeDocker();
  const r = runDc('up', '--fresh', '--yes');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(calls(), [
    'docker rm -f c1',
    `docker volume rm agent-claude-${ID} agent-codex-${ID}`,
    `devcontainer up --workspace-folder ${proj} --remove-existing-container`,
  ]);
});

test('dc up --rebuild: keeps the agent volumes', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls, proj } = fakeDocker();
  const r = runDc('up', '--rebuild');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(calls(), [`devcontainer up --workspace-folder ${proj} --remove-existing-container`]);
});

test('dc rm: removes the container, keeps its agent data, and says so', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls } = fakeDocker();
  const r = runDc('rm');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(calls(), ['docker rm -f c1']);
  assert.match(r.stdout, /agent data kept in 2 volume/);
});

test('dc up --fresh with no container: nothing to delete, just starts', (t) => {
  if (posixOnly(t)) return;
  const { runDc, calls, proj } = fakeDocker({ container: false });
  const r = runDc('up', '--fresh');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /no existing container/);
  assert.deepEqual(calls(), [`devcontainer up --workspace-folder ${proj} --remove-existing-container`]);
});
