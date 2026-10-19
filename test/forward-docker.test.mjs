// dc forward against real Docker. Runs only when DC_DOCKER_E2E=1 (Linux CI sets
// it); everywhere else it's skipped. A plain node container stands in for a dev
// container: it carries the label dc looks for and serves on its own localhost
// only, which is exactly the case `appPort` can't reach and forwarding must.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createServer, connect } from 'node:net';
import { get } from 'node:http';
import { fileURLToPath } from 'node:url';

const DC = resolve(fileURLToPath(import.meta.url), '../../.devcontainer/dc.mjs');
const enabled = process.env.DC_DOCKER_E2E === '1';

const freePort = () => new Promise((res) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
});
const canConnect = (port) => new Promise((res) => {
  const c = connect(port, '127.0.0.1');
  c.once('connect', () => { c.destroy(); res(true); });
  c.once('error', () => res(false));
});
const fetchText = (port) => new Promise((res, rej) => {
  get({ host: '127.0.0.1', port, path: '/' }, (r) => { let b = ''; r.on('data', (d) => { b += d; }); r.on('end', () => res(b)); }).on('error', rej);
});
async function until(fn, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 200)); }
  return false;
}
const runDc = (env, cwd, ...args) => new Promise((res) => {
  const child = spawn(process.execPath, [DC, ...args], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (d) => { stdout += d; });
  child.stderr.on('data', (d) => { stderr += d; });
  child.on('exit', (status) => res({ status, stdout, stderr }));
});

test('dc forward with real Docker: reaches a localhost-only server, stops on --rm and with the container',
  { skip: !enabled && 'set DC_DOCKER_E2E=1 to run against real Docker', timeout: 180000 }, async (t) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'dc-e2e-')));
    const proj = join(dir, 'proj');
    mkdirSync(join(proj, '.devcontainer'), { recursive: true });
    writeFileSync(join(proj, '.devcontainer', 'devcontainer.json'), '{}');
    const env = { ...process.env, DC_STATE_DIR: join(dir, 'state') };
    const port = await freePort();
    const server = `require('http').createServer((q,r)=>r.end('hello from the container')).listen(${port},'127.0.0.1')`;
    const run = spawnSync('docker', ['run', '-d', '--label', `devcontainer.local_folder=${proj}`,
      'node:22-alpine', 'node', '-e', server], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const id = run.stdout.trim();
    t.after(() => {
      spawnSync('docker', ['rm', '-f', id]);
      rmSync(env.DC_STATE_DIR, { recursive: true, force: true });
      rmSync(dir, { recursive: true, force: true });
    });

    // The server listens on the container's localhost only.
    assert.ok(await until(() => spawnSync('docker', ['exec', id, 'node', '-e',
      `require('net').connect(${port},'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))`]).status === 0),
    'server up inside the container');

    const fwd = await runDc(env, proj, 'forward', String(port));
    assert.equal(fwd.status, 0, fwd.stderr + fwd.stdout);
    assert.equal(await fetchText(port), 'hello from the container');

    const stop = await runDc(env, proj, 'forward', '--rm', String(port));
    assert.equal(stop.status, 0, stop.stderr);
    assert.equal(await canConnect(port), false);

    assert.equal((await runDc(env, proj, 'forward', String(port))).status, 0);
    assert.equal(await fetchText(port), 'hello from the container');
    spawnSync('docker', ['stop', '-t', '1', id]);
    assert.ok(await until(async () => !(await canConnect(port))), 'forward stops with the container');
  });
