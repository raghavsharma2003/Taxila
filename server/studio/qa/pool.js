// The gate's execution lane (LIVE-STUDIO D7, §3.6 "where it runs"). Generated code NEVER runs in the trusted API
// process: production posts the build to the isolated `studio-qa` service (infra/studio-qa, a Container App in the
// untrusted environment `taxila-forge-untrusted`, egress denied, no secrets; ACA Sandboxes after O-1). A local
// Chromium is allowed only where the operator says so (STUDIO_QA_LOCAL=1: the bench, tests, the studio-qa image itself).
//
// gateClient() → { gate(job) → report, close() }. The report is runGate()'s shape (pass, checks, ms, ...). A gate that
// cannot run (service down, timeout) returns { pass: false, unavailable: true }: un-gated code is never revealed
// (LIVE-STUDIO §9: the gate-result cache, W2-H, decides whether an earlier pass may mount).

const DEFAULT_TIMEOUT_MS = 30_000;

/** A remote gate on the studio-qa service. The request carries only the build, its params and strings (kit data). */
export function remoteGate(base = process.env.STUDIO_QA_URL, { timeoutMs = DEFAULT_TIMEOUT_MS, token = process.env.STUDIO_QA_TOKEN } = {}) {
  const url = String(base ?? "").replace(/\/+$/, "");
  return {
    kind: "remote",
    async gate(job) {
      if (!url) return { pass: false, unavailable: true, checks: [{ id: "gate_unavailable", pass: false, detail: "STUDIO_QA_URL unset" }] };
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        const res = await fetch(`${url}/gate`, { method: "POST", signal: ctl.signal,
          headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(job) });
        if (!res.ok) return { pass: false, unavailable: true, checks: [{ id: "gate_unavailable", pass: false, detail: `HTTP ${res.status}` }] };
        return await res.json();
      } catch (e) {
        return { pass: false, unavailable: true, checks: [{ id: "gate_unavailable", pass: false, detail: String(e?.name === "AbortError" ? "timeout" : e?.message ?? e).slice(0, 80) }] };
      } finally { clearTimeout(t); }
    },
    async close() {},
  };
}

/**
 * A local gate on a shared Chromium (one browser, one context per gate, at most `concurrency` at once).
 * Refuses to start unless STUDIO_QA_LOCAL=1 (the trusted API process never runs generated code).
 */
export function localGate({ concurrency = Number(process.env.STUDIO_QA_CONCURRENCY) || 3 } = {}) {
  if (process.env.STUDIO_QA_LOCAL !== "1") throw new Error("local Studio gate refused: set STUDIO_QA_LOCAL=1 (bench / tests / the studio-qa image only)");
  let browserP = null, active = 0;
  const waiters = [];
  const acquire = () => (active < concurrency ? (active++, Promise.resolve()) : new Promise((r) => waiters.push(r)));
  const release = () => { const w = waiters.shift(); if (w) w(); else active--; };
  return {
    kind: "local",
    async gate(job) {
      await acquire();
      try {
        if (!browserP) browserP = import("playwright").then(({ chromium }) => chromium.launch());
        const browser = await browserP;
        const { runGate } = await import("./gate.js");
        return await runGate(browser, job);
      } catch (e) {
        return { pass: false, unavailable: true, checks: [{ id: "gate_unavailable", pass: false, detail: String(e?.message ?? e).slice(0, 120) }] };
      } finally { release(); }
    },
    async close() { if (browserP) (await browserP).close().catch(() => {}); browserP = null; },
  };
}

let client = null;
/** The process's gate client: remote when STUDIO_QA_URL is set, local only when STUDIO_QA_LOCAL=1, else unavailable. */
export function gateClient() {
  if (client) return client;
  if (process.env.STUDIO_QA_URL) client = remoteGate();
  else if (process.env.STUDIO_QA_LOCAL === "1") client = localGate();
  else client = remoteGate("");
  return client;
}
/** Test seam. */
export const _setGateClient = (c) => { client = c; };
