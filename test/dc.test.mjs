// Unit tests for dc's platform-sensitive logic. These run anywhere, which is the
// point: the Windows-specific behaviour is expressed as pure functions so it can
// be tested without Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { findProjectRoot, normalizeLocalFolder, buildExecArgs, parseArgs } from '../.devcontainer/dc.mjs';

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
  assert.deepEqual(a, [
    'exec', '--workspace-folder', '/proj',
    'bash', '-lc', 'claude "$@"',
    'claude', '--model', 'opus', 'say "hi"',
  ]);
});

test('buildExecArgs: login:false bypasses the shell wrapper', () => {
  assert.deepEqual(buildExecArgs('/p', ['ls', '-la'], { login: false }),
    ['exec', '--workspace-folder', '/p', 'ls', '-la']);
});

test('parseArgs: separates flags from positionals', () => {
  const { flags, rest } = parseArgs(['--rebuild', 'name', '--no-cache']);
  assert.ok(flags.has('--rebuild') && flags.has('--no-cache'));
  assert.deepEqual(rest, ['name']);
});
