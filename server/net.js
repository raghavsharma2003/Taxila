// Outbound connection reuse for every fetch this server makes (Azure OpenAI chat / TTS, Neon SQL-over-HTTP).
// Node's fetch keeps an idle connection only 4 s unless the server announces otherwise, and a lesson's turns are
// further apart than that (the teacher speaks, the child thinks), so every turn paid a fresh TLS handshake on
// the reply path — measured from the build sandbox (context/measurements.md#cascade-latency-2026-10-02, after
// keep-alive): Neon `select 1` after a 5-15 s idle gap 345-443 ms → 48-62 ms, Azure GET /models ~550 → ~145 ms.
// A server that announces a shorter Keep-Alive timeout still wins (undici honours the hint), so this only
// lengthens our side's default. TAXILA_KEEPALIVE_MS=0 leaves Node's default in place.
//
// No dependency: Node's fetch is undici, which reads its global dispatcher from this well-known symbol
// (undici's own setGlobalDispatcher writes it). The dispatcher is created lazily on the first fetch, so a
// data: URL (no network) brings it up, and it is replaced by one of the SAME class — an EnvHttpProxyAgent
// under NODE_USE_ENV_PROXY keeps its proxy, a plain Agent stays plain.
const SYMBOL = Symbol.for("undici.globalDispatcher.1");
export const KEEPALIVE_MS = 30_000;

/** @returns {Promise<string>} what was done, for the startup log */
export async function keepConnectionsWarm(ms = Number(process.env.TAXILA_KEEPALIVE_MS ?? KEEPALIVE_MS)) {
  if (!Number.isFinite(ms) || ms <= 0) return "node default";
  try {
    if (!globalThis[SYMBOL]) await fetch("data:,").then((r) => r.arrayBuffer()).catch(() => {});
    const current = globalThis[SYMBOL];
    const Dispatcher = current?.constructor;
    if (typeof Dispatcher !== "function" || current.__taxilaKeepAlive) return "unchanged";
    const next = new Dispatcher({ keepAliveTimeout: ms, keepAliveMaxTimeout: Math.max(ms, 600_000) });
    next.__taxilaKeepAlive = ms;
    globalThis[SYMBOL] = next;
    // In-flight requests (none at startup) finish on the old dispatcher.
    current.close?.().catch?.(() => {});
    return `${Dispatcher.name} keepAlive ${ms} ms`;
  } catch (e) {
    console.warn("[net] keep-alive not applied:", e.message);
    return "node default (failed)";
  }
}

await keepConnectionsWarm();
