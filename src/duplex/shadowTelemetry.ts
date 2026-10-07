/**
 * duplex-real (round 2, 2026-10-07): SHADOW TELEMETRY — the evidence the shadow → live switch needs, from real lessons.
 *
 * Why this exists: ship five runs the duplex engine in shadow on prod (TAXILA_DUPLEX=shadow), but nothing it computes leaves
 * the device. CascadeLink never passes `log` to CascadeDuplex, there is no route for it, and no table holds it, so "what the
 * engine would have done vs what happened" was never recorded for a single prod lesson (docs/design/round2/duplex-real/
 * CRITERIA.md §1). This module turns the engine's governed rows (ShadowRow) plus what the shipped path actually did into one
 * CONTENT-BLIND summary per lesson: numbers and closed codes only, never words, never audio, never a transcript hash.
 *
 * Per child turn (opened by child voice after her line, closed by the shipped path's committed final):
 *   eg   engine decision gap: the engine's first SPEAK / CUT_IN in the turn minus the child's last voiced frame before it (ms)
 *   sg   shipped decision gap: the shipped final's arrival minus the child's last voiced frame before it (ms)
 *   ec   the engine would have CUT the child off: after its SPEAK the child voiced again (>= RESUME_MS) before the shipped final
 *   ep   the silence (ms) the engine spoke into, when ec (the length of the thinking pause it would have cut)
 *   sc   the shipped path cut her off: the child voiced again (>= RESUME_MS) within CUT_WINDOW_MS after the shipped final,
 *        before her reply was audible
 *   r    the engine's speak reason code (turn_end / backstop_silence / safeguard / ...), or null
 * Per overlap (her reply audible and the child voicing over it for >= OVERLAP_MIN_MS):
 *   ey   engine yield latency from the burst onset (ms; null = the engine kept talking)
 *   ss   shipped stop latency from the burst onset (ms; null = the shipped path kept talking)
 *   bm   burst length (ms)
 * Lesson: safety rows (the engine entered a safety act) and fallbacks (codes). Shadow never sends the engine's micro-commit
 * probes (they would split the shipped path's finals), so its text arrives on the shipped 900 ms server VAD and `eg` in
 * shadow is pessimistic against live mode (CRITERIA.md §1.3).
 *
 * Voicing here is the device's own coarse gate (RMS over an adaptive floor, 100 ms hangover) on frames her reply is NOT
 * sounding; it is not the engine's tracker on purpose, so the record judges the engine with an independent ruler.
 * Erasable TypeScript, pure (no DOM, no timers): tests drive it with a fake clock.
 */
import type { ShadowRow } from "./host.ts";

export const SHADOW_SCHEMA = "duplex-shadow/1";
/** A burst after the engine's SPEAK this long (voiced) means the child went on: the engine would have cut a pause. */
export const RESUME_MS = 200;
/** The shipped path "cut" the child when she voiced again within this long after its final, before her reply sounded. */
export const CUT_WINDOW_MS = 3000;
/** An overlap counts once the child voiced over her this long. */
export const OVERLAP_MIN_MS = 150;
const HANGOVER_MS = 100;
const MAX_TURNS = 400;
const MAX_OVERLAPS = 400;

export interface ShadowTurn { eg: number | null; sg: number | null; ec: 0 | 1; ep: number | null; sc: 0 | 1; r: string | null }
export interface ShadowOverlap { ey: number | null; ss: number | null; bm: number }
export interface ShadowSummary {
  schema: typeof SHADOW_SCHEMA;
  mode: "shadow" | "on";
  band: string | null;
  lane: string;
  durMs: number;
  frames: number;
  turns: ShadowTurn[];
  overlaps: ShadowOverlap[];
  safetyRows: number;
  fallbacks: string[];
}

const SPEAKS = new Set(["SPEAK", "CUT_IN"]);
const SAFETY_CODES = new Set(["safeguard", "safety"]);
/** Closed set of reason codes allowed into the summary (anything else becomes "other"). */
const REASONS = new Set(["turn_end", "backstop_silence", "wt1_nudge", "safeguard", "safety", "word_search_cue", "off_task_drift", "question_to_her", "hold_offer", "repeat_request"]);

interface OpenTurn { engineAt: number | null; engineGap: number | null; reason: string | null; cut: boolean; cutPause: number | null; lastVoiceEndAtSpeak: number | null }

export class ShadowTelemetry {
  private readonly mode: "shadow" | "on";
  private readonly band: string | null;
  private readonly lane: string;
  private t0: number | null = null;
  private tLast = 0;
  private frames = 0;
  // voicing gate
  private floorDb = -60;
  private voiced = false;
  private voiceStart: number | null = null;
  private lastVoiced: number | null = null;
  /** End of the last voiced run (ms), null while voicing or before any voice. */
  private lastVoiceEnd: number | null = null;
  // her
  private herOn = false;
  // turns
  private turn: OpenTurn | null = null;
  private afterShipped: { at: number; idx: number } | null = null;
  private readonly turns: ShadowTurn[] = [];
  // overlaps
  private ov: { onset: number; voicedMs: number; counted: boolean; engineAt: number | null; shippedAt: number | null; lastFrame: number } | null = null;
  private readonly overlaps: ShadowOverlap[] = [];
  private safetyRows = 0;
  private readonly fallbacks: string[] = [];

  constructor(o: { mode: "shadow" | "on"; band?: string | null; lane?: string }) {
    this.mode = o.mode;
    this.band = o.band ?? null;
    this.lane = o.lane ?? "live_transcribe";
  }

  /** One 20 ms mic frame (linear RMS) and whether her reply is sounding. */
  frame(t: number, rms: number, herSounding: boolean): void {
    this.t0 ??= t;
    this.tLast = t;
    this.frames++;
    const db = 20 * Math.log10(Math.max(rms, 1e-7));
    // adaptive floor: fast down, slow up (only on quiet frames)
    if (db < this.floorDb) this.floorDb = db;
    else if (!this.voiced) this.floorDb += Math.min(0.05, db - this.floorDb) ;
    const on = db > Math.max(-55, this.floorDb + 12);
    if (herSounding || this.herOn) {
      // over her: the overlap tracker (the mic carries her echo too; a burst must clear the floor by the same margin)
      this.overlapFrame(t, on);
      return;
    }
    if (on) {
      if (!this.voiced) { this.voiced = true; this.voiceStart = t; this.onVoiceOnset(t); }
      this.lastVoiced = t;
    } else if (this.voiced && this.lastVoiced !== null && t - this.lastVoiced > HANGOVER_MS) {
      this.voiced = false;
      this.lastVoiceEnd = this.lastVoiced + 20;
      this.voiceStart = null;
    }
    // a voiced run long enough after an engine SPEAK / a shipped final = the child went on
    if (this.voiced && this.voiceStart !== null && t - this.voiceStart >= RESUME_MS) this.onResumed(this.voiceStart);
  }

  /** The engine's governed row (CascadeDuplexOptions.log). */
  row(r: ShadowRow): void {
    if (r.reasons.some((c) => SAFETY_CODES.has(c)) || (r.detail && SAFETY_CODES.has(r.detail))) this.safetyRows++;
    if (r.action.startsWith("fallback:")) { if (this.fallbacks.length < 8) this.fallbacks.push(r.action.slice(9, 40)); return; }
    if (SPEAKS.has(r.action) && !this.herOn) {
      this.turn ??= newTurn();
      if (this.turn.engineAt === null) {
        this.turn.engineAt = r.t;
        this.turn.engineGap = this.voiced || this.lastVoiceEnd === null ? 0 : Math.max(0, r.t - this.lastVoiceEnd);
        this.turn.lastVoiceEndAtSpeak = this.lastVoiceEnd;
        const why = r.detail && REASONS.has(r.detail) ? r.detail : r.reasons.find((c) => REASONS.has(c)) ?? null;
        this.turn.reason = why;
      }
    }
    if (r.action === "YIELD" && this.ov && this.ov.engineAt === null) this.ov.engineAt = r.t;
  }

  /** A realtime transcription event the link received (only its type is read). */
  stt(t: number, type: string, nonEmptyFinal: boolean): void {
    if (type === "conversation.item.input_audio_transcription.completed" && nonEmptyFinal && !this.herOn) this.shippedFinal(t);
  }

  herStart(_t: number): void {
    this.herOn = true;
    this.afterShipped = null;
  }

  /** Her reply ended (completed) or was stopped by the shipped path (`stopped` = the shipped barge-in). */
  herEnd(t: number, stopped: boolean): void {
    if (stopped && this.ov && this.ov.shippedAt === null) this.ov.shippedAt = t;
    this.closeOverlap();
    this.herOn = false;
    this.voiced = false;
    this.voiceStart = null;
    this.lastVoiceEnd = null;
  }

  summary(): ShadowSummary {
    if (this.turn && this.turn.engineAt !== null) this.pushTurn(null);
    this.closeOverlap();
    return {
      schema: SHADOW_SCHEMA, mode: this.mode, band: this.band, lane: this.lane,
      durMs: this.t0 === null ? 0 : Math.round(this.tLast - this.t0), frames: this.frames,
      turns: this.turns.slice(0, MAX_TURNS), overlaps: this.overlaps.slice(0, MAX_OVERLAPS),
      safetyRows: this.safetyRows, fallbacks: [...this.fallbacks],
    };
  }

  // ───────────────────────────── internals ─────────────────────────────

  private onVoiceOnset(_t: number): void {
    this.turn ??= newTurn();
  }

  private onResumed(onset: number): void {
    const tr = this.turn;
    if (tr && tr.engineAt !== null && !tr.cut && onset > tr.engineAt) {
      tr.cut = true;
      tr.cutPause = tr.lastVoiceEndAtSpeak === null ? null : Math.max(0, onset - tr.lastVoiceEndAtSpeak);
      // the engine re-decides later in the same turn: its next SPEAK is the one that counts for the gap
      tr.engineAt = null;
      tr.engineGap = null;
    }
    const a = this.afterShipped;
    if (a && onset > a.at && onset - a.at <= CUT_WINDOW_MS) { this.turns[a.idx].sc = 1; this.afterShipped = null; }
  }

  private shippedFinal(t: number): void {
    const tr = this.turn ?? newTurn();
    const sg = this.voiced ? 0 : this.lastVoiceEnd === null ? null : Math.max(0, t - this.lastVoiceEnd);
    this.pushTurn(sg, tr);
    this.afterShipped = { at: t, idx: this.turns.length - 1 };
  }

  private pushTurn(sg: number | null, tr: OpenTurn | null = this.turn): void {
    if (!tr) return;
    if (this.turns.length < MAX_TURNS) {
      this.turns.push({ eg: tr.engineGap === null ? null : Math.round(tr.engineGap), sg: sg === null ? null : Math.round(sg), ec: tr.cut ? 1 : 0, ep: tr.cutPause === null ? null : Math.round(tr.cutPause), sc: 0, r: tr.engineAt !== null ? tr.reason ?? "other" : null });
    }
    this.turn = null;
  }

  private overlapFrame(t: number, on: boolean): void {
    if (!this.herOn) return;
    if (on) {
      if (!this.ov) this.ov = { onset: t, voicedMs: 0, counted: false, engineAt: null, shippedAt: null, lastFrame: t };
      this.ov.voicedMs += 20;
      this.ov.lastFrame = t;
      if (this.ov.voicedMs >= OVERLAP_MIN_MS) this.ov.counted = true;
    } else if (this.ov && t - this.ov.lastFrame > 300) {
      this.closeOverlap();
    }
  }

  private closeOverlap(): void {
    const o = this.ov;
    this.ov = null;
    if (!o || !o.counted || this.overlaps.length >= MAX_OVERLAPS) return;
    this.overlaps.push({ ey: o.engineAt === null ? null : Math.max(0, Math.round(o.engineAt - o.onset)), ss: o.shippedAt === null ? null : Math.max(0, Math.round(o.shippedAt - o.onset)), bm: Math.round(o.lastFrame + 20 - o.onset) });
  }
}

const newTurn = (): OpenTurn => ({ engineAt: null, engineGap: null, reason: null, cut: false, cutPause: null, lastVoiceEndAtSpeak: null });

/**
 * Validate and clamp a posted summary (the server route runs this; anything not in the schema is dropped). Returns null when
 * it is not a duplex-shadow/1 summary. Numbers are clamped to [0, 600000] ms; codes to the closed sets.
 */
export function sanitizeShadowSummary(x: unknown): ShadowSummary | null {
  const o = (x && typeof x === "object" ? x : null) as Record<string, unknown> | null;
  if (!o || o.schema !== SHADOW_SCHEMA) return null;
  const ms = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(600000, Math.round(v))) : null);
  const bit = (v: unknown): 0 | 1 => (v === 1 || v === true ? 1 : 0);
  const code = (v: unknown): string | null => (typeof v === "string" ? (REASONS.has(v) ? v : "other") : null);
  const arr = (v: unknown, n: number): Record<string, unknown>[] => (Array.isArray(v) ? v.slice(0, n).filter((e) => e && typeof e === "object") as Record<string, unknown>[] : []);
  return {
    schema: SHADOW_SCHEMA,
    mode: o.mode === "on" ? "on" : "shadow",
    band: typeof o.band === "string" && /^B[1-4]$/.test(o.band) ? o.band : null,
    lane: typeof o.lane === "string" && /^[a-z_]{1,24}$/.test(o.lane) ? o.lane : "other",
    durMs: ms(o.durMs) ?? 0,
    frames: Math.max(0, Math.min(10_000_000, Math.round(Number(o.frames) || 0))),
    turns: arr(o.turns, MAX_TURNS).map((t) => ({ eg: ms(t.eg), sg: ms(t.sg), ec: bit(t.ec), ep: ms(t.ep), sc: bit(t.sc), r: code(t.r) })),
    overlaps: arr(o.overlaps, MAX_OVERLAPS).map((v) => ({ ey: ms(v.ey), ss: ms(v.ss), bm: ms(v.bm) ?? 0 })),
    safetyRows: Math.max(0, Math.min(10000, Math.round(Number(o.safetyRows) || 0))),
    fallbacks: Array.isArray(o.fallbacks) ? o.fallbacks.slice(0, 8).map((f) => String(f).replace(/[^a-z_]/g, "").slice(0, 24)) : [],
  };
}
