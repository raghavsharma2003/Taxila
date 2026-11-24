// Round 7, stream G (platform-graceful-shutdown): drain a web replica on SIGTERM instead of cutting it. ACA sends SIGTERM
// when a revision is deactivated, scaled in or restarted, then SIGKILL after terminationGracePeriodSeconds (deploy-azure
// sets 30 s). In order:
//   1. stop accepting: server.close() (no new connections), readiness answers 503 (isDraining) so the platform stops
//      routing here, idle keep-alive sockets close now;
//   2. every open WebSocket (the D5 relay) gets `d5.closed {reason: "server_restart"}` then close 1012 (Service Restart),
//      so the client takes its existing lost-link → reconnect path onto a live replica instead of a silent cut;
//   3. in-flight HTTP requests (a lesson turn mid-reply) get up to `graceMs` (20 s) to finish; any still open then are
//      closed;
//   4. the flight recorder's buffer (up to 1 s / 5,000 events) is flushed, with a deadline;
//   5. exit 0.
// Testable without a process: createDrain takes the server, the socket registry, the flush and the exit as arguments.

let draining = false;
/** True once a drain has started: /api/health?ready=1 answers 503 so no new traffic is routed here. */
export const isDraining = () => draining;
/** Tests only. */
export const _resetDraining = () => { draining = false; };

/** Count in-flight requests on an http.Server. → { active(): number } */
export function trackRequests(server) {
  let n = 0;
  server.on("request", (req, res) => {
    n++;
    let done = false;
    const end = () => { if (!done) { done = true; n--; } };
    res.once("finish", end);
    res.once("close", end);
  });
  return { active: () => n };
}

/**
 * @param {{ server: import("http").Server, requests: { active(): number }, drainSockets?: (msg: string) => number,
 *   flush?: () => Promise<unknown>, exit?: (code: number) => void, log?: (s: string) => void, graceMs?: number,
 *   flushMs?: number, pollMs?: number, now?: () => number }} o
 * @returns {(signal?: string) => Promise<{ sockets: number, leftOpen: number, ms: number }>}
 */
export function createDrain({ server, requests, drainSockets = () => 0, flush = async () => {}, exit = (c) => process.exit(c),
  log = (s) => console.log(s), graceMs = 20_000, flushMs = 5_000, pollMs = 100, now = () => Date.now() }) {
  let running = null;
  return (signal = "SIGTERM") => (running ??= (async () => {
    const t0 = now();
    draining = true;
    log(`[shutdown] ${signal}: draining (${requests.active()} requests in flight, grace ${graceMs / 1000} s)`);
    server.close();
    server.closeIdleConnections?.();
    let sockets = 0;
    try { sockets = drainSockets(JSON.stringify({ type: "d5.closed", reason: "server_restart" })); } catch { /* best effort */ }
    while (requests.active() > 0 && now() - t0 < graceMs) await new Promise((r) => setTimeout(r, pollMs));
    const leftOpen = requests.active();
    if (leftOpen) { log(`[shutdown] ${leftOpen} requests still open after ${graceMs / 1000} s: closing them`); server.closeAllConnections?.(); }
    try { await Promise.race([flush(), new Promise((r) => setTimeout(r, flushMs))]); } catch { /* the trace is best effort */ }
    const ms = now() - t0;
    log(`[shutdown] drained in ${ms} ms (${sockets} websockets told to reconnect, ${leftOpen} requests cut)`);
    exit(0);
    return { sockets, leftOpen, ms };
  })());
}
