// Port forwarding (dc forward). Docker and the devcontainer CLI are stood in for
// by Node scripts, so these run on every OS, Windows included. The fake
// `docker exec -i <id> node -e <script> <port>` really runs the relay's inner
// script, against a local test server, so the whole data path is exercised.

import { test as nodeTest } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, mkdtempSync, mkdirSync, readFileSync, existsSync, realpathSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer, connect } from 'node:net';
import { fileURLToPath } from 'node:url';
import { parsePorts, stateDir } from '../.devcontainer/dc.mjs';

// A hang becomes a named failure instead of stalling the whole run.
const test = (name, fn) => nodeTest(name, { timeout: 60000 }, fn);

const DC = resolve(fileURLToPath(import.meta.url), '../../.devcontainer/dc.mjs');

test('parsePorts: accepts port numbers, rejects anything else', () => {
  assert.deepEqual(parsePorts(['8999', '1', '65535']), [8999, 1, 65535]);
  for (const bad of ['0', '65536', '80a', '-1', '8999:3000', '']) {
    assert.throws(() => parsePorts([bad]), /not a port number/, bad);
  }
});

test('stateDir: per-OS default, overridable', () => {
  assert.equal(stateDir({ DC_STATE_DIR: '/x' }, 'linux'), '/x');
  assert.equal(stateDir({ XDG_STATE_HOME: '/s' }, 'linux'), join('/s', 'dc'));
  assert.equal(stateDir({ LOCALAPPDATA: 'C:\\L' }, 'win32'), join('C:\\L', 'dc', 'state'));
});

const FAKE_DOCKER = `
import { readFileSync, appendFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const st = JSON.parse(readFileSync(process.env.FAKE_STATE, 'utf8'));
const args = process.argv.slice(2);
appendFileSync(process.env.FAKE_LOG, 'docker ' + args.join(' ') + '\\n');
const a = args.join(' ');
if (a === 'info') process.exit(0);
if (st.dockerDown) process.exit(1);
if (args[0] === 'ps') {
  const running = args.includes('status=running');
  if (st.container && (!running || st.running)) {
    process.stdout.write(running ? 'c1\\t' + st.folder + '\\n' : 'c1\\t' + (st.running ? 'running' : 'exited') + '\\t' + st.folder + '\\n');
  }
  process.exit(0);
}
if (args[0] === 'inspect') { process.stdout.write('[]'); process.exit(0); }
if (args[0] === 'volume') process.exit(0);
if (args[0] === 'exec') {
  if (!st.running) process.exit(1);
  const rest = args.slice(args[1] === '-i' ? 3 : 2);
  if (rest[0] === 'node' && rest[1] === '--version') { if (st.noNode) process.exit(127); console.log('v24.0.0'); process.exit(0); }
  if (rest[0] === 'kill') { try { process.kill(+rest[1]); } catch {} process.exit(0); }
  if (rest[0] === 'node' && rest[1] === '-e') {
    // The container's port maps to the test server's real port.
    const port = String(st.portmap[rest[3]] ?? rest[3]);
    const child = spawn(process.execPath, ['-e', rest[2], port], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 1));
  } else process.exit(1);
} else process.exit(0);
`;

const FAKE_DEVCONTAINER = `
import { appendFileSync } from 'node:fs';
appendFileSync(process.env.FAKE_LOG, 'devcontainer ' + process.argv.slice(2).join(' ') + '\\n');
`;

/** A free TCP port on 127.0.0.1. */
function freePort() {
  return new Promise((res) => {
    const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
  });
}

/** Can we connect to 127.0.0.1:port? */
function canConnect(port) {
  return new Promise((res) => {
    const c = connect(port, '127.0.0.1');
    c.once('connect', () => { c.destroy(); res(true); });
    c.once('error', () => res(false));
  });
}

/** Send `msg` through localhost:port and return the reply. */
function roundTrip(port, msg) {
  return new Promise((res, rej) => {
    const c = connect(port, '127.0.0.1');
    let got = '';
    c.on('data', (d) => { got += d; });
    c.on('end', () => res(got));
    c.on('error', rej);
    c.end(msg);
  });
}

async function until(fn, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 100)); }
  return false;
}

/** Run dc asynchronously (the relay it may start must not block the test's event loop). */
function runDcAsync(env, cwd, ...args) {
  return new Promise((res) => {
    const child = spawn(process.execPath, [DC, ...args], { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('exit', (status) => res({ status, stdout, stderr }));
  });
}

async function setup(t, { running = true } = {}) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'dc-fwd-')));
  const proj = join(dir, 'proj');
  mkdirSync(join(proj, '.devcontainer'), { recursive: true });
  writeFileSync(join(proj, '.devcontainer', 'devcontainer.json'), '{}');
  writeFileSync(join(dir, 'docker.mjs'), FAKE_DOCKER);
  writeFileSync(join(dir, 'devcontainer.mjs'), FAKE_DEVCONTAINER);

  // The "container's" server: echoes back what it receives, uppercased.
  const server = createServer((s) => {
    let buf = '';
    s.on('data', (d) => { buf += d; });
    s.on('end', () => s.end(buf.toUpperCase()));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = await freePort();
  const statePath = join(dir, 'state.json');
  const state = { container: true, running, folder: proj, portmap: { [port]: server.address().port } };
  const save = () => writeFileSync(statePath, JSON.stringify(state));
  save();

  const env = {
    ...process.env,
    DC_FAKE_DOCKER: join(dir, 'docker.mjs'),
    DC_FAKE_DEVCONTAINER: join(dir, 'devcontainer.mjs'),
    DC_STATE_DIR: join(dir, 'dcstate'),
    FAKE_STATE: statePath,
    FAKE_LOG: join(dir, 'calls.log'),
  };
  const relayFile = () => {
    const d = env.DC_STATE_DIR;
    if (!existsSync(d)) return null;
    const { readdirSync } = require_fs;
    const f = readdirSync(d).find((n) => /^relay-.*\.json$/.test(n));
    return f ? JSON.parse(readFileSync(join(d, f), 'utf8')) : null;
  };
  t.after(async () => {
    // Show what the relay and the fake docker did, for diagnosing CI.
    try {
      const { readdirSync } = require_fs;
      for (const f of readdirSync(env.DC_STATE_DIR).filter((x) => x.endsWith('.log'))) {
        t.diagnostic(`${f}:\n${readFileSync(join(env.DC_STATE_DIR, f), 'utf8').trim()}`);
      }
    } catch { /* no state */ }
    // Read the relay's pid before removing its state, then make sure it's gone.
    const r = relayFile();
    rmSync(env.DC_STATE_DIR, { recursive: true, force: true });
    try { if (r) process.kill(r.pid); } catch { /* gone */ }
    await new Promise((r) => server.close(r));
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });
  const dc = (...args) => runDcAsync(env, proj, ...args);
  return { dc, port, state, save, relayFile, env, dir };
}

import * as require_fs from 'node:fs';

test('dc forward <port>: forwards localhost to the container, and --rm stops it', async (t) => {
  const { dc, port, relayFile } = await setup(t);
  const r = await dc('forward', String(port));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(`Forwarding localhost:${port}`));
  assert.equal(await roundTrip(port, 'hello'), 'HELLO');
  assert.equal(await roundTrip(port, 'again'), 'AGAIN');

  const list = await dc('forward');
  assert.match(list.stdout, new RegExp(`localhost:${port} → container port ${port}`));

  const stop = await dc('forward', '--rm', String(port));
  assert.equal(stop.status, 0, stop.stderr);
  assert.match(stop.stdout, new RegExp(`Stopped forwarding ${port}`));
  assert.equal(await canConnect(port), false);
  assert.ok(await until(() => relayFile() === null), 'the relay exits once nothing is forwarded');
});

test('dc forward: the relay stops when the container does, and dc up starts it again', async (t) => {
  const { dc, port, state, save, relayFile } = await setup(t);
  assert.equal((await dc('forward', String(port))).status, 0);
  assert.ok(await canConnect(port));

  state.running = false; save();
  assert.ok(await until(async () => !(await canConnect(port)) && relayFile() === null), 'forward stops with the container');

  const listed = await dc('forward');
  assert.match(listed.stdout, /starts with the container/);

  state.running = true; save();
  const up = await dc('up');
  assert.equal(up.status, 0, up.stderr);
  assert.match(up.stdout, new RegExp(`Forwarding localhost:${port}`));
  assert.equal(await roundTrip(port, 'back'), 'BACK');
});

test('dc forward while the container is stopped: saved, and started by dc up', async (t) => {
  const { dc, port, state, save } = await setup(t, { running: false });
  const r = await dc('forward', String(port));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Saved/);
  assert.equal(await canConnect(port), false);

  state.running = true; save();
  const up = await dc('up');
  assert.match(up.stdout, new RegExp(`Forwarding localhost:${port}`));
  assert.equal(await roundTrip(port, 'up'), 'UP');
});

test('dc forward: a port already in use on this machine is reported, not hidden', async (t) => {
  const { dc, port } = await setup(t);
  const busy = createServer().listen(port, '127.0.0.1');
  await new Promise((r) => busy.once('listening', r));
  t.after(() => busy.close());
  const r = await dc('forward', String(port));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /already using that port/);
});

test('dc down: says the forwards stop and come back with dc up', async (t) => {
  const { dc, port } = await setup(t, { running: false });
  await dc('forward', String(port));
  const r = await dc('down');
  assert.match(r.stdout, new RegExp(`Forwarding of ${port} stops with the container`));
});

test('dc forward: bad input is rejected', async (t) => {
  const { dc } = await setup(t);
  assert.match((await dc('forward', 'abc')).stderr, /not a port number: abc/);
  assert.match((await dc('forward', '--rm')).stderr, /name the port/);
  assert.match((await dc('forward', '--all')).stderr, /unknown option --all/);
  assert.match((await dc('forward', '--rm', '1234')).stdout, /1234 wasn't forwarded/);
});

test('dc forward: HTTP with keep-alive, as a browser uses it', async (t) => {
  const { dc, port, state, save } = await setup(t);
  const { createServer: createHttp, Agent, get } = await import('node:http');
  const web = createHttp((req, res) => res.end(`you asked for ${req.url}`));
  await new Promise((r) => web.listen(0, '127.0.0.1', r));
  t.after(() => web.close());
  state.portmap[port] = web.address().port; save();

  assert.equal((await dc('forward', String(port))).status, 0);
  const agent = new Agent({ keepAlive: true, maxSockets: 1 });
  t.after(() => agent.destroy());
  const fetchText = (path) => new Promise((res, rej) => {
    get({ host: '127.0.0.1', port, path, agent }, (r) => { let b = ''; r.on('data', (d) => { b += d; }); r.on('end', () => res(b)); }).on('error', rej);
  });
  assert.equal(await fetchText('/one'), 'you asked for /one');
  assert.equal(await fetchText('/two'), 'you asked for /two'); // same connection, reused
});

test('dc forward --rm <one>: stops that port and leaves the others running', async (t) => {
  const { dc, port, state, save } = await setup(t);
  const second = await freePort();
  state.portmap[second] = state.portmap[port]; save();
  assert.equal((await dc('forward', String(port), String(second))).status, 0);
  assert.equal(await roundTrip(second, 'two'), 'TWO');

  assert.equal((await dc('forward', '--rm', String(second))).status, 0);
  assert.equal(await canConnect(second), false);
  assert.equal(await roundTrip(port, 'still'), 'STILL');
});

test('dc up right after dc down: waits out a relay that is still exiting, then starts a new one', async (t) => {
  const { dc, port, env } = await setup(t, { running: false });
  await dc('forward', String(port)); // saved only; the container is stopped
  // Stand in for a relay that saw its container stop and is about to exit: a
  // live process whose state file says it forwards nothing.
  const { readdirSync } = require_fs;
  const lingering = spawn(process.execPath, ['-e', 'setTimeout(()=>{}, 60000)'], { stdio: 'ignore' });
  t.after(() => lingering.kill());
  const id = readdirSync(env.DC_STATE_DIR).find((n) => n.startsWith('forwards-')).slice('forwards-'.length, -'.json'.length);
  writeFileSync(join(env.DC_STATE_DIR, `relay-${id}.json`), JSON.stringify({ pid: lingering.pid, ts: Date.now(), listening: [], errors: {} }));
  setTimeout(() => { lingering.kill(); rmSync(join(env.DC_STATE_DIR, `relay-${id}.json`), { force: true }); }, 1500);

  const st = JSON.parse(readFileSync(env.FAKE_STATE, 'utf8')); st.running = true; writeFileSync(env.FAKE_STATE, JSON.stringify(st));
  const up = await dc('up');
  assert.match(up.stdout, new RegExp(`Forwarding localhost:${port}`), up.stderr);
  assert.equal(await roundTrip(port, 'fresh'), 'FRESH');
});


test('dc forward: two at once both stick', async (t) => {
  const { dc, port, state, save } = await setup(t);
  const second = await freePort();
  state.portmap[second] = state.portmap[port]; save();
  const [a, b] = await Promise.all([dc('forward', String(port)), dc('forward', String(second))]);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  const list = await dc('forward');
  assert.match(list.stdout, new RegExp(`localhost:${port} →`));
  assert.match(list.stdout, new RegExp(`localhost:${second} →`));
  assert.equal(await roundTrip(port, 'a'), 'A');
  assert.equal(await roundTrip(second, 'b'), 'B');
});

test('dc forward: a host server holding the port on ::1 counts as busy', async (t) => {
  const { dc, port } = await setup(t);
  const v6 = createServer();
  const ok = await new Promise((r) => { v6.once('error', () => r(false)); v6.listen(port, '::1', () => r(true)); });
  if (!ok) return t.skip('no IPv6 loopback here');
  t.after(() => v6.close());
  const r = await dc('forward', String(port));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /already using that port/);
  assert.equal(await canConnect(port), false, 'the IPv4 side is not left half-forwarded');
});

test('dc forward: large transfers arrive intact', async (t) => {
  const { dc, port } = await setup(t);
  assert.equal((await dc('forward', String(port))).status, 0);
  const big = 'abcdefghij'.repeat(500000); // 5 MB
  assert.equal(await roundTrip(port, big), big.toUpperCase());
});

test('dc forward: a dead relay\'s leftover state is ignored, even if its pid was reused', async (t) => {
  const { dc, port, env } = await setup(t, { running: false });
  await dc('forward', String(port));
  const { readdirSync } = require_fs;
  const key = readdirSync(env.DC_STATE_DIR).find((n) => n.startsWith('forwards-')).slice('forwards-'.length, -'.json'.length);
  // A live process that isn't a relay, under an old timestamp.
  const other = spawn(process.execPath, ['-e', 'setTimeout(()=>{}, 60000)'], { stdio: 'ignore' });
  t.after(() => other.kill());
  writeFileSync(join(env.DC_STATE_DIR, `relay-${key}.json`),
    JSON.stringify({ pid: other.pid, ts: Date.now() - 60000, listening: [port], errors: {} }));
  const st = JSON.parse(readFileSync(env.FAKE_STATE, 'utf8')); st.running = true; writeFileSync(env.FAKE_STATE, JSON.stringify(st));
  const up = await dc('up');
  assert.match(up.stdout, new RegExp(`Forwarding localhost:${port}`), up.stderr);
  assert.equal(await roundTrip(port, 'real'), 'REAL');
});

test('dc forward: the relay gives up when Docker stops answering', async (t) => {
  const { dc, port, state, save, env, relayFile } = await setup(t);
  env.DC_RELAY_DOCKER_GRACE_MS = '2000';
  assert.equal((await dc('forward', String(port))).status, 0);
  state.dockerDown = true; save();
  assert.ok(await until(async () => !(await canConnect(port)) && relayFile() === null, 15000), 'ports released');
});

test('dc forward: a container without node is refused, and nothing is saved', async (t) => {
  const { dc, port, state, save } = await setup(t);
  state.noNode = true; save();
  const r = await dc('forward', String(port));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no `node`/);
  assert.match((await dc('forward')).stdout, /No ports forwarded/);
});

test('dc forward: when the client leaves, a server that keeps the connection open is cut off in the container', async (t) => {
  const { dc, port, state, save, env } = await setup(t);
  // A server that never ends its side and sends a heartbeat, like a WebSocket
  // or event stream.
  const held = [];
  const sticky = createServer({ allowHalfOpen: true }, (s) => {
    held.push(s); s.on('error', () => {}); s.write('hi');
    const beat = setInterval(() => { if (!s.destroyed) s.write('.'); }, 200);
    s.on('close', () => clearInterval(beat));
  });
  await new Promise((r) => sticky.listen(0, '127.0.0.1', r));
  t.after(() => { for (const s of held) s.destroy(); sticky.close(); });
  state.portmap[port] = sticky.address().port; save();
  assert.equal((await dc('forward', String(port))).status, 0);

  const c = connect(port, '127.0.0.1');
  await new Promise((r) => c.once('data', r));
  c.destroy();
  const killed = () => readFileSync(env.FAKE_LOG, 'utf8').split('\n').some((l) => /^docker exec c1 kill \d+$/.test(l));
  assert.ok(await until(killed, 10000), 'the inner process is stopped');
  assert.ok(await until(() => held.every((s) => s.destroyed || s.readableEnded), 10000), 'the server side closes');
});
