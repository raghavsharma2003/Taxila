// The flight recorder, client side (release 12, docs/design/round4/build/r12/TRACKING-BRIEF.md, dc-r12-flight-recorder).
// installTrace() runs once at boot (src/main.tsx): it captures the page's original fetch for its own sends, wraps
// fetch / EventSource / WebSocket for /api calls (X-Taxila-Rid), and starts the page hooks. Tier 1 for every account,
// always on, no audio and no DOM recording; tier 2 (the owner cohort) adds the rrweb DOM replay, the REC chip and the
// owner's flag. A fault anywhere in here is swallowed: the app runs exactly as it would without the recorder.
import { busy, emit, onSession, start, stats, setSink, flush } from "./bus.ts";
import { wrapEventSource, wrapFetch, wrapWebSocket } from "./net.ts";
import { devInfo, hookErrors, hookMedia, hookPerf, hookRoute, hookTaps } from "./hooks.ts";
import { installTier2, sessionChanged } from "./tier2.ts";

let installed = false;

export function installTrace(o: { build?: string; disabled?: boolean } = {}): void {
  if (installed || o.disabled || typeof window === "undefined") return;
  installed = true;
  try {
    const orig = window.fetch.bind(window);
    start(orig);
    try { window.fetch = wrapFetch(orig); } catch { /* fetch untraced */ }
    try { if (window.EventSource) window.EventSource = wrapEventSource(window.EventSource); } catch { /* untraced */ }
    try { if (window.WebSocket) window.WebSocket = wrapWebSocket(window.WebSocket); } catch { /* untraced */ }
    for (const h of [hookErrors, hookPerf, hookRoute, hookTaps, hookMedia]) { try { h(); } catch { /* that hook only */ } }
    devInfo(o.build);
    installTier2(orig);
    onSession(() => sessionChanged());
    (window as Window & { __trace?: unknown }).__trace = { stats, flush, setSink, emit: (k: string, d?: Record<string, unknown>) => busy(() => emit(k, d)) };
  } catch { /* the recorder is off; the app is not affected */ }
}

export { emit } from "./bus.ts";
