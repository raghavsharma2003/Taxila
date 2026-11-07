// Round 7, stream G (platform-graceful-shutdown): a real http server, a real in-flight request and a real WebSocket.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createDrain, trackRequests, isDraining, _resetDraining } from "../server/shutdown.js";
import { acceptWebSocket, drainWebSockets, openWebSockets } from "../server/ws.js";

function serve(handler) {
  const server = http.createServer(handler);
  server.on("upgrade", (req, socket, head) => { const ws = acceptWebSocket(req, socket, head); ws.on("message", () => {}); });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}
/** Wait until the server has really accepted `n` requests (at most 5 s): a fixed sleep raced on loaded CI runners
 *  (leftOpen 0 on PR #38; the fix is C2 Games' patch 001, applied to both drain tests). */
async function inFlight(requests, n = 1) {
  for (let i = 0; i < 250 && requests.active() < n; i++) await new Promise((r) => setTimeout(r, 20));
}
const get = (port, path) => new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port, path, agent: false }, (res) => { let b = ""; res.on("data", (c) => (b += c)); res.on("end", () => resolve({ status: res.statusCode, body: b })); }).on("error", reject);
});

test("drain: in-flight request finishes, new connections refused, websocket told to reconnect (1012), trace flushed, exit 0", async () => {
  _resetDraining();
  const server = await serve((req, res) => {
    if (req.url === "/slow") setTimeout(() => res.end("done"), 300);
    else res.end("ok");
  });
  const port = server.address().port;
  const requests = trackRequests(server);
  const ws = new WebSocket(`ws://127.0.0.1:${port}/api/duplex/voicelive`);
  const wsEvents = [];
  await new Promise((r) => { ws.onopen = r; });
  ws.onmessage = (m) => wsEvents.push(JSON.parse(String(m.data)));
  const wsClosed = new Promise((r) => { ws.onclose = (e) => r(e.code); });
  assert.equal(openWebSockets(), 1);

  const slow = get(port, "/slow");
  await inFlight(requests);
  assert.equal(requests.active(), 1);

  let flushed = false, exitCode = null;
  const logs = [];
  const drain = createDrain({ server, requests, drainSockets: drainWebSockets, flush: async () => { flushed = true; }, exit: (c) => { exitCode = c; }, log: (s) => logs.push(s), graceMs: 5000, pollMs: 20 });
  const done = drain("SIGTERM");
  assert.equal(isDraining(), true);
  assert.equal(drain("SIGTERM"), done, "a second signal joins the same drain");

  assert.equal((await slow).body, "done", "the in-flight request was allowed to finish");
  assert.equal(await wsClosed, 1012);
  assert.deepEqual(wsEvents, [{ type: "d5.closed", reason: "server_restart" }]);
  const r = await done;
  assert.deepEqual([r.sockets, r.leftOpen, flushed, exitCode], [1, 0, true, 0]);
  assert.equal(openWebSockets(), 0);
  await assert.rejects(get(port, "/"), /ECONNREFUSED|ECONNRESET/, "no new connections");
  _resetDraining();
});

test("drain: a request still open after the grace is cut, and the drain still flushes and exits", async () => {
  _resetDraining();
  const server = await serve(() => { /* never answers */ });
  const port = server.address().port;
  const requests = trackRequests(server);
  const hung = get(port, "/hang").catch((e) => e);
  await inFlight(requests);
  let flushed = false, exitCode = null;
  const r = await createDrain({ server, requests, flush: async () => { flushed = true; }, exit: (c) => { exitCode = c; }, log: () => {}, graceMs: 200, pollMs: 20 })();
  assert.equal(r.leftOpen, 1);
  assert.ok(r.ms >= 200 && r.ms < 3000, String(r.ms));
  assert.deepEqual([flushed, exitCode], [true, 0]);
  assert.ok((await hung) instanceof Error, "the hung request was closed");
  _resetDraining();
});

test("drain: a flush that never settles cannot hold the exit past flushMs", async () => {
  _resetDraining();
  const server = await serve((req, res) => res.end());
  let exitCode = null;
  const t0 = Date.now();
  await createDrain({ server, requests: trackRequests(server), flush: () => new Promise(() => {}), exit: (c) => { exitCode = c; }, log: () => {}, flushMs: 150 })();
  assert.equal(exitCode, 0);
  assert.ok(Date.now() - t0 < 2000);
  _resetDraining();
});
