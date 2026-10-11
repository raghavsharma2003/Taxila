// The flight recorder, client side (release 12, docs/design/round4/build/r12/TRACKING-BRIEF.md, dc-r12-flight-recorder).
// installTrace() runs once at boot (src/main.tsx): it captures the page's original fetch for its own sends, wraps
// fetch / EventSource / WebSocket for /api calls (X-Taxila-Rid), and starts the page hooks. Tier 1 for every account,
// always on, no audio and no DOM recording; tier 2 (the owner cohort) adds the rrweb DOM replay, the REC chip and the
// owner's flag. A fault anywhere in here is swallowed: the app runs exactly as it would without the recorder.
import { busy, emit, getTier, onSession, start, stats, setSink, flush } from "./bus.ts";
import { wrapEventSource, wrapFetch, wrapWebSocket } from "./net.ts";
import { devInfo, hookErrors, hookMedia, hookPerf, hookRoute, hookTaps } from "./hooks.ts";
import { installTier2, sessionChanged, traceBlob } from "./tier2.ts";

let installed = false;

const EXT: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac" };
/** The sink T-voice's code calls: emit (tier 1 unless it asks for 2), full() = this account records tier 2, blob = a tier-2
 *  audio clip (uploaded, then `kind` points at it; a no-op below tier 2). Every call is wrapped; it never throws. */
export const voiceSink = {
  emit(kind: string, data: Record<string, unknown> = {}, o: { tier?: 1 | 2; turn?: number } = {}): void { busy(() => emit(kind, data, { tier: o.tier, turn: o.turn })); },
  full: (): boolean => getTier() === 2,
  blob(kind: string, b: Blob, data: Record<string, unknown> = {}): Promise<boolean> {
    try { return traceBlob(kind, b, { ext: EXT[(b.type || "").split(";")[0]] ?? "bin", data }); } catch { return Promise.resolve(false); }
  },
};

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
    // the voice code's sink (T-voice, src/voice/trace.ts looks for globalThis.__taxilaTrace): no cross-branch import
    (globalThis as typeof globalThis & { __taxilaTrace?: unknown }).__taxilaTrace = voiceSink;
  } catch { /* the recorder is off; the app is not affected */ }
}

export { emit } from "./bus.ts";
export { traceBlob } from "./tier2.ts";
