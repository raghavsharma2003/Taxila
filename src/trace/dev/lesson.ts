// The flight recorder's dev harness (never shipped). Installs the recorder BEFORE the lesson page loads, exactly as
// src/main.tsx does in the app, then loads Kaksha's Desk dev page (the real LessonRuntime on a scripted Director).
//   ?trace=off       no recorder at all (the baseline for "a broken recorder leaves the lesson identical")
//   &tier=2          the account is tier 2 (rrweb, REC chip, flag), as /api/me would say
//   &sabotage=1      the recorder is broken on purpose: every event's sink throws, every send throws, every chunk throws
//   &page=play       the play dev harness (a game) instead of the Desk dev page
// The page's own events are kept on window.__traceEvents (and rrweb chunks on window.__rrweb) for the harnesses.
import { installTrace } from "../index.ts";
import { setSink, setTier } from "../bus.ts";
import { setChunkTap, stopReplay } from "../tier2.ts";
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
    // &real=1: the trace endpoints are the real API's (the vite proxy's :8790; the TEST end-to-end replay proof)
    if (u.includes("/api/trace/") && !q.get("real")) {
      if (q.get("sabotage")) return Promise.reject(new Error("sabotaged send"));
      w.__traceSent!++;
      const blob = u.includes("/api/trace/blob");
      return Promise.resolve(new Response(JSON.stringify(blob ? { ref: `dev/${Date.now()}.json`, bytes: 0, type: "application/x-rrweb+json" } : { accepted: 1, rejected: 0, tier: q.get("tier") === "2" ? 2 : 1 }), { headers: { "content-type": "application/json" } }));
    }
    return realFetch(input, init);
  }) as typeof fetch;
  installTrace({ build: "dev-harness" });
  if (q.get("tier") === "2" && !q.get("real")) setTier(2); // real: the server's batch response says the tier
  setSink((e) => {
    if (q.get("sabotage")) throw new Error("sabotaged sink");
    w.__traceEvents!.push(e);
  });
  (window as Window & { __traceStop?: () => void }).__traceStop = () => stopReplay();
  setChunkTap((events) => { if (q.get("sabotage")) throw new Error("sabotaged chunk"); w.__rrweb!.push(...events); });
}
// &page=play loads the play dev harness instead (a game: the tier-2 frame-rate budget is measured on it)
if (q.get("page") === "play") { document.body.style.cssText = "margin:0;height:100vh;overflow:hidden"; document.getElementById("root")!.style.height = "100%"; await import("../../play/dev/main.tsx"); }
else await import("../../ui-v3/kaksha/dev/desk.tsx");
