// Unit tests for dc's platform-sensitive logic. These run anywhere, which is the
// point: the Windows-specific behaviour is expressed as pure functions so it can
// be tested without Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { findProjectRoot, normalizeLocalFolder, buildExecArgs, parseArgs, preflightError, terminalEnv } from '../.devcontainer/dc.mjs';

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
