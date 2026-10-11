// The flight recorder's dev harness (never shipped). Installs the recorder BEFORE the lesson page loads, exactly as
// src/main.tsx does in the app, then loads Kaksha's Desk dev page (the real LessonRuntime on a scripted Director).
//   ?trace=off       no recorder at all (the baseline for "a broken recorder leaves the lesson identical")
//   &tier=2          the account is tier 2 (rrweb, REC chip, flag), as /api/me would say
//   &sabotage=1      the recorder is broken on purpose: every event's sink throws, every send throws, rrweb fails to load
// The page's own events are kept on window.__traceEvents (and rrweb chunks on window.__rrweb) for the harnesses.
import { installTrace } from "../index.ts";
import { setSink, setTier } from "../bus.ts";
import { setChunkTap } from "../tier2.ts";
import type { TraceEvent } from "../../../shared/trace.ts";

const q = new URLSearchParams(location.search);
const w = window as Window & { __traceEvents?: TraceEvent[]; __rrweb?: unknown[]; __traceSent?: number };
w.__traceEvents = [];
w.__rrweb = [];
w.__traceSent = 0;
if (q.get("trace") !== "off") {
  const realFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const u = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (u.includes("/api/trace/")) {
      if (q.get("sabotage")) return Promise.reject(new Error("sabotaged send"));
      w.__traceSent!++;
      const blob = u.includes("/api/trace/blob");
      return Promise.resolve(new Response(JSON.stringify(blob ? { ref: `dev/${Date.now()}.json`, bytes: 0, type: "application/x-rrweb+json" } : { accepted: 1, rejected: 0, tier: q.get("tier") === "2" ? 2 : 1 }), { headers: { "content-type": "application/json" } }));
    }
    return realFetch(input, init);
  }) as typeof fetch;
  installTrace({ build: "dev-harness" });
  if (q.get("tier") === "2") setTier(2);
  setSink((e) => {
    if (q.get("sabotage")) throw new Error("sabotaged sink");
    w.__traceEvents!.push(e);
  });
  setChunkTap((events) => { if (q.get("sabotage")) throw new Error("sabotaged chunk"); w.__rrweb!.push(...events); });
}
await import("../../ui-v3/kaksha/dev/desk.tsx");
