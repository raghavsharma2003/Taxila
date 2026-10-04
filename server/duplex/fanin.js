// PARTIALS FAN-IN (ARCHITECTURE.md v2 §2.2, §2.5.4): every STT item of the child's turn → one TranscriptView, with the
// LEXICAL HORIZON. Pure, synchronous, browser-safe: the device host and the server slice run this same module.
//
// Full-session, hands-free: the STT stream never stops (owner-always-listen-full-session-2026-10-04), so items arrive
// continuously. A turn is an EPOCH over that stream: `begin(t)` opens a new one; items whose audio started before it are
// ignored for this turn (a late final from the last turn never leaks in), except the overlap words a barge-in carries
// over (`begin(t, { carryFrom })`: the fold-in).
//
// Coverage (what audio the visible words describe), per source, most exact first:
//   1. word timings (Nemotron token times): the last word's end;
//   2. a final that followed a client commit (the MAI micro-commit probe, or D4's commit): the commit time; a final after
//      server VAD: its audio end (speech_stopped) when the source gives it;
//   3. a partial without timings (D4 deltas): arrival − the source's p90 lag (CONSERVATIVE: assume the words are old).
// The host turns coverage into `unseenVoicedMs` with its own voiced-run log (G5 vetoes speech while it is > 120 ms).
//
// Stable prefix = tokens unchanged across the last two versions of an item, or finalised (drafts key on it).
// Stability = P(the visible tail is not revised), from this session's own revision history.
// Every item version may pass through an injected `filter` first (known-text echo subtraction, echo.js), so her own words
// never reach the markers, the safety slice or a draft key.
import { normText, textHash } from "./understand.js";

/** Text arrival after the audio it covers, per source (ms). [T] measured, [E] estimate. */
export const SOURCE_LAG = {
  // M-D2 (n=28, US → eastus2): D4 delta lag 713 / 1,477 ms [T]
  live_transcribe: { p50: 713, p90: 1477 },
  // MAI streaming partials: first partial 2.58 s after onset [T, STT-v3]; per-word partial lag [E] 900-1,600 ms. Finals
  // after a commit land 68 / 75 ms in-DC Chennai [T] (that path reports coverage exactly, so this prior rarely binds).
  mai_stream: { p50: 1200, p90: 1600 },
  // Nemotron-3.5: text complete 254 / 452 ms after speech end on the GPU host [T, STT-v3]
  nemotron: { p50: 254, p90: 452 },
  sim: { p50: 700, p90: 1400 },
  other: { p50: 900, p90: 1600 },
};

const toks = (t) => { const n = normText(t); return n ? n.split(" ") : []; };
const commonPrefix = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };

export class TurnTranscript {
  /**
   * @param {{ source?: string, lag?: {p50:number,p90:number}, filter?: (text:string, meta:{itemId:string,t:number}) => {text:string, removed:number} }} [o]
   */
  constructor(o = {}) {
    this.source = o.source || "other";
    this.lag = o.lag || SOURCE_LAG[this.source] || SOURCE_LAG.other;
    this.filter = o.filter || null;
    /** all items of the session seen so far: id → record (trimmed to the last 64) */
    this.items = new Map();
    this.order = [];
    this.turnStart = 0;
    this.carryFrom = null;
    this.commitAt = null;          // last client commit not yet answered by a final
    this.revisions = { n: 0, revised: 0 };
    this.lagSamples = [];
    this.updatedAt = null;
    this.echoRemoved = 0;
  }

  /** A new turn (epoch). `carryFrom`: keep items whose audio started at or after this time (overlap words, fold-in). */
  begin(t, { carryFrom = null } = {}) {
    this.turnStart = t;
    this.carryFrom = carryFrom;
    this.updatedAt = null;
    this.echoRemoved = 0;
    for (const it of this.items.values()) it.inTurn = this.belongs(it);
  }

  belongs(it) {
    const start = it.audioStartMs ?? it.firstAt;
    if (this.carryFrom !== null && start >= this.carryFrom - 40) return true;
    return start >= this.turnStart - 40;
  }

  /** The host sent `input_audio_buffer.commit` at t: the next final of the open item covers audio up to t. */
  commitSent(t) { this.commitAt = t; }

  /**
   * One STT event. Partials may be cumulative (default) or deltas (`delta: true`, D4/OpenAI style); a final replaces its
   * item. `words` (when the source times tokens) and `audioStartMs` / `audioEndMs` make coverage exact.
   * @param {{type:"partial"|"final", itemId:string, text:string, t:number, delta?:boolean, words?:{w:string,startMs:number,endMs:number}[]|null, audioStartMs?:number, audioEndMs?:number}} ev
   * @returns {boolean} the turn's visible text changed
   */
  push(ev) {
    let it = this.items.get(ev.itemId);
    if (!it) {
      it = { id: ev.itemId, raw: "", text: "", final: false, versions: [], firstAt: ev.t, updatedAt: ev.t, audioStartMs: ev.audioStartMs ?? null,
        coverEndMs: null, words: null, inTurn: false };
      it.inTurn = this.belongs(it);
      this.items.set(ev.itemId, it);
      this.order.push(ev.itemId);
      if (this.order.length > 64) this.items.delete(this.order.shift());
    }
    if (it.final && ev.type === "partial") return false;
    if (ev.audioStartMs !== undefined && it.audioStartMs === null) { it.audioStartMs = ev.audioStartMs; it.inTurn = this.belongs(it); }
    const raw = ev.delta ? it.raw + String(ev.text ?? "") : String(ev.text ?? "");
    it.raw = raw;
    let text = raw.trim();
    if (this.filter) {
      const f = this.filter(text, { itemId: it.id, t: ev.t });
      if (f.removed && it.inTurn) this.echoRemoved += f.removed;
      text = f.text;
    }
    const nt = toks(text);
    const prev = it.versions[it.versions.length - 1];
    if (prev) {
      this.revisions.n++;
      if (commonPrefix(prev, nt) < prev.length) this.revisions.revised++;
    }
    it.versions.push(nt);
    if (it.versions.length > 3) it.versions.shift();
    it.text = text;
    it.updatedAt = ev.t;
    if (ev.words && ev.words.length) {
      it.words = ev.words;
      it.coverEndMs = ev.words[ev.words.length - 1].endMs;
      this.sample(ev.t - it.coverEndMs);
    }
    if (ev.type === "final") {
      it.final = true;
      if (!it.words) {
        if (this.commitAt !== null && this.commitAt >= (it.audioStartMs ?? it.firstAt) - 40) { it.coverEndMs = this.commitAt; this.sample(ev.t - this.commitAt); }
        else if (ev.audioEndMs !== undefined) it.coverEndMs = ev.audioEndMs;
        else it.coverEndMs = ev.t - this.lag.p50;
      }
      this.commitAt = null;
    } else if (!it.words) {
      it.coverEndMs = ev.t - this.lag.p90;
    }
    if (it.inTurn) this.updatedAt = ev.t;
    return it.inTurn;
  }

  sample(ms) {
    if (!(ms >= 0) || ms > 10_000) return;
    this.lagSamples.push(ms);
    if (this.lagSamples.length > 50) this.lagSamples.shift();
  }

  /** Running p50 of arrival − covered audio for this source this session (the prior until 5 samples exist). */
  lagEstimate() {
    if (this.lagSamples.length < 5) return this.lag.p50;
    const s = [...this.lagSamples].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  turnItems() { return this.order.map((id) => this.items.get(id)).filter((it) => it && it.inTurn && it.text); }

  /**
   * The turn as the engine reads it.
   * @param {number} t
   * @param {(fromMs:number) => number} [voicedAfter] the host's voiced ms after a time (the horizon); 0 if absent
   * @returns {import("../../src/duplex/engine.ts").TranscriptView}
   */
  view(t, voicedAfter) {
    const items = this.turnItems();
    const text = items.map((it) => it.text).join(" ").trim();
    const stableParts = [];
    for (const it of items) {
      if (it.final) { stableParts.push(it.text); continue; }
      const v = it.versions;
      const k = v.length >= 2 ? commonPrefix(v[v.length - 2], v[v.length - 1]) : 0;
      if (k) stableParts.push(v[v.length - 1].slice(0, k).join(" "));
      break; // nothing after an unstable item is stable
    }
    const isFinal = items.length > 0 && items.every((it) => it.final);
    const rate = this.revisions.n >= 3 ? this.revisions.revised / this.revisions.n : 0.3;
    const stability = isFinal ? 1 : Math.max(0.2, Math.min(0.98, 1 - rate));
    let coverageEndMs = null;
    for (const it of items) if (it.coverEndMs !== null) coverageEndMs = coverageEndMs === null ? it.coverEndMs : Math.max(coverageEndMs, it.coverEndMs);
    const lastWords = items.length ? items[items.length - 1].words : null;
    const words = items.some((it) => it.words) ? items.flatMap((it) => it.words || []) : null;
    const from = coverageEndMs ?? this.turnStart;
    return {
      text,
      stablePrefix: stableParts.join(" ").trim(),
      stability,
      isFinal,
      words: lastWords ? words : null,
      coverageEndMs,
      unseenVoicedMs: voicedAfter ? Math.max(0, Math.round(voicedAfter(from))) : 0,
      source: this.source,
      lagMsEstimate: this.lagEstimate(),
      textHash: textHash(text),
      echoRemovedTokens: this.echoRemoved,
      updatedAt: this.updatedAt ?? this.turnStart,
    };
  }
}
