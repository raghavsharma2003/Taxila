// The CONSENTED real-child pilot's recorder (docs/design/round3/voicesig/PILOT-PROTOCOL.md). The ONLY code in Taxila that
// keeps a child's audio, and only like this:
//   - it starts only on the page load the study coordinator opened with a pilot code in the URL (?vspilot=P07-S1), after the
//     parent signed the V3 form for that code; there is no default, no server switch that turns it on, no account flag, and
//     (round 3 fix, adversarial N4) nothing persists it: a later lesson on the device records nothing;
//   - it records exactly what the product's front-end analyses (the shared tap's processed P track, 16 kHz mono, after the
//     worklet's decimation), so pilot features recomputed offline equal the features the lesson computed;
//   - nothing is uploaded: at the lesson's end the WAV and a numbers-only sidecar (chunk clock, per-turn kv, the hold cue's
//     counters) are offered as two downloads ON THE DEVICE; the coordinator moves them to the study's private Azure
//     Storage container (India) by hand, as the protocol says, and deletes them from the device;
//   - a visible "study recording" badge is on screen the whole time (the child's assent covers being recorded; they must
//     be able to see that it is happening); closing or reloading the page ends it;
//   - a hard cap (MAX_MINUTES) stops recording; a failure anywhere stops recording and never touches the lesson.
// "No audio leaves the device" stays true for every lesson that is not a consented pilot session.
import type { KnowledgeVoice } from "./types.ts";

export const PILOT_KEY = "tx.flag.voicesig.pilot";
/** Pilot codes the coordinator issues: participant + session, e.g. P07-S1. Anything else is ignored. */
export const PILOT_CODE_RE = /^P\d{2,3}-S[1-3]$/;
export const MAX_MINUTES = 45;
const RATE = 16_000;

/**
 * The URL this page was LOADED with (the navigation entry), not wherever the router is now: the coordinator's link
 * (?vspilot=P07-S1) is the page load of that one session, and in-app navigation keeps it for exactly that page load.
 */
function bootLocation(): { search: string } | undefined {
  try {
    const nav = typeof performance !== "undefined" ? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined) : undefined;
    if (nav?.name) return { search: new URL(nav.name).search };
  } catch { /* fall through */ }
  return typeof location !== "undefined" ? location : undefined;
}

/**
 * The device's pilot code for THIS page load, or null. Round 3 fix (adversarial N4): the code is never persisted. It used
 * to live in localStorage with no expiry, so a missed "?vspilot=0" at the end of the coordinator's day meant every later
 * lesson on the family's device was recorded and offered as a WAV, a safeguarding session included. Now only the link the
 * coordinator opens for the session carries it; a reload or a later lesson opened any other way records nothing. A code
 * left in storage by the earlier build is removed on sight.
 */
export function pilotCode(loc: { search: string } | undefined = bootLocation(),
  store: Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined = typeof localStorage !== "undefined" ? localStorage : undefined): string | null {
  try {
    try { store?.removeItem(PILOT_KEY); } catch { /* storage blocked */ }
    const v = loc ? new URLSearchParams(loc.search).get("vspilot") : null;
    return v && PILOT_CODE_RE.test(v) ? v : null;
  } catch {
    return null;
  }
}

export interface PilotTurn { at: number; durationMs: number; bargeIn: boolean; kv: KnowledgeVoice | null }
export interface PilotSidecar {
  v: 1; code: string; sampleRate: 16000; startedAt: number; endedAt: number; samples: number; capped: boolean;
  /** Where the clock jumps (a dropped chunk, a re-anchor): sample offset → epoch ms of that sample. */
  segments: Array<{ sample: number; t: number }>;
  turns: PilotTurn[];
  /** Epoch-ms spans when her audio was audible at the device (the scorer drops detector runs inside them). */
  herSpans: Array<[number, number]>;
}

export class PilotRecorder {
  readonly code: string;
  private chunks: Int16Array[] = [];
  private samples = 0;
  private segments: Array<{ sample: number; t: number }> = [];
  private nextT: number | null = null;
  private turns: PilotTurn[] = [];
  private herSpans: Array<[number, number]> = [];
  private startedAt: number | null = null;
  private capped = false;
  stopped = false;

  constructor(code: string) { this.code = code; }

  /** One 20 ms P chunk at epoch ms t. */
  chunk(t: number, p: Float32Array): void {
    if (this.stopped || this.capped) return;
    if (this.startedAt === null) this.startedAt = t;
    if (this.nextT === null || Math.abs(t - this.nextT) > 25) this.segments.push({ sample: this.samples, t });
    const q = new Int16Array(p.length);
    for (let i = 0; i < p.length; i++) q[i] = Math.max(-32768, Math.min(32767, Math.round(p[i] * 32767)));
    this.chunks.push(q);
    this.samples += p.length;
    this.nextT = t + (p.length / RATE) * 1000;
    if (this.samples >= MAX_MINUTES * 60 * RATE) this.capped = true;
  }

  /** Her audio was audible at epoch ms t (the teacher meter); spans closer than 300 ms merge. */
  her(t: number): void {
    if (this.stopped) return;
    const last = this.herSpans[this.herSpans.length - 1];
    if (last && t - last[1] <= 300) last[1] = Math.max(last[1], t);
    else this.herSpans.push([t, t]);
  }

  /** The committed child turn's numbers (kv is numbers only; no words are ever kept here). */
  turn(at: number, durationMs: number, bargeIn: boolean, kv: KnowledgeVoice | null): void {
    if (!this.stopped) this.turns.push({ at, durationMs, bargeIn, kv: kv ? JSON.parse(JSON.stringify(kv)) : null });
  }

  /** Stop and return the WAV bytes (16-bit PCM, 16 kHz mono) and the sidecar. */
  finish(now = Date.now()): { wav: Uint8Array; sidecar: PilotSidecar } {
    if (this.stopped) { this.samples = 0; this.turns = []; this.segments = []; this.herSpans = []; }
    this.stopped = true;
    const data = this.samples * 2;
    const out = new Uint8Array(44 + data);
    const dv = new DataView(out.buffer);
    const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
    w(0, "RIFF"); dv.setUint32(4, 36 + data, true); w(8, "WAVE"); w(12, "fmt ");
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, RATE, true);
    dv.setUint32(28, RATE * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, data, true);
    let o = 44;
    for (const c of this.chunks) { for (let i = 0; i < c.length; i++, o += 2) dv.setInt16(o, c[i], true); }
    this.chunks = [];
    return {
      wav: out,
      sidecar: { v: 1, code: this.code, sampleRate: 16000, startedAt: this.startedAt ?? now, endedAt: now, samples: this.samples, capped: this.capped, segments: this.segments, turns: this.turns, herSpans: this.herSpans },
    };
  }
}

/** Browser only: the visible badge, and the two downloads at the end. Never throws. */
export function pilotBadge(code: string): () => void {
  try {
    if (typeof document === "undefined") return () => {};
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.textContent = `● study recording ${code}`;
    el.style.cssText = "position:fixed;top:6px;left:6px;z-index:2147483647;background:#7a0010;color:#fff;font:600 12px/1.6 system-ui,sans-serif;padding:2px 8px;border-radius:10px;pointer-events:none";
    document.body.appendChild(el);
    return () => { try { el.remove(); } catch { /* gone */ } };
  } catch {
    return () => {};
  }
}

export function offerDownloads(r: { wav: Uint8Array; sidecar: PilotSidecar }): void {
  try {
    if (typeof document === "undefined" || typeof URL === "undefined") return;
    const stamp = new Date(r.sidecar.startedAt).toISOString().replace(/[:.]/g, "-");
    const files: Array<[string, Blob]> = [
      [`taxila-pilot-${r.sidecar.code}-${stamp}.wav`, new Blob([r.wav.buffer as ArrayBuffer], { type: "audio/wav" })],
      [`taxila-pilot-${r.sidecar.code}-${stamp}.json`, new Blob([JSON.stringify(r.sidecar)], { type: "application/json" })],
    ];
    for (const [name, blob] of files) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 60_000);
    }
  } catch {
    // the coordinator re-runs the session; the lesson itself is unaffected
  }
}
