// THINK WHILE LISTENING (ARCHITECTURE.md v2 §4): speculative drafts and TTS warm-up driven by the engine's pComplete
// TRAJECTORY, not by candidate silences. Pure and clock-agnostic (launchers are injected): the simulator injects virtual
// time, production injects azureLauncher (launch.js) and a TTS warm launcher.
//
// The engine sends one PrepareHint per tick (src/duplex/engine.ts): draft start/keep/cancel, warmTts start/keep/cancel,
// a text hash. This module turns that stream into at most a few real generations, with hysteresis and caps:
//   draft start   projected pComplete >= 0.5 (allowed while the child is still voicing): ONE live generation keyed by
//                 (lessonId, turnSeq, itemId, gen, textHash) through the prototype DraftManager (`reply-two-drafts`:
//                 duplicates are slower, so a new text cancels the old generation); <= 3 per turn; >= 300 ms apart;
//                 only when the stable text grew by >= 1 word
//   warm start    pComplete >= 0.8: synthesise the UPTAKE (the child's own value / words re-voiced, verdict-free, built in
//                 code) into a held buffer that is never audible unless promoted: the primed first sound (§8.2)
//   cancel        pComplete < 0.35 for >= 300 ms (the engine debounces it) or a stable-prefix change: abort and stop paying
//   promote       on SPEAK, only on text-hash identity (`cascade-speculative-reply`: lexical identity)
//   safety        a distress partial aborts AND quarantines every non-safety draft and warm buffer of the turn (v1 law 5)
// Wait-time drafts (W, v1 §2.3) still launch at her hand-over for code-gradable closed items, keyed without the child's
// words, and are promoted on the code grade (needs seam S5).
import { DraftManager } from "./drafts.js";
import { normText } from "./understand.js";

export const PREPARE_CAPS = { maxGenerationsPerTurn: 3, debounceMs: 300, minNewWords: 1, maxWarmPerTurn: 3 };

const nTok = (t) => { const n = normText(t); return n ? n.split(" ").length : 0; };

export class Speculator {
  /**
   * @param {{ launchDraft: (job:object, now:number) => object, launchWarm?: (job:object, now:number) => {abort:(now:number)=>number, readyAt?:number}, lessonId?: string, caps?: object }} o
   */
  constructor(o) {
    this.caps = { ...PREPARE_CAPS, ...(o.caps || {}) };
    this.dm = new DraftManager({ launch: o.launchDraft, lessonId: o.lessonId, caps: { maxCandidatePerTurn: this.caps.maxGenerationsPerTurn } });
    this.launchWarm = o.launchWarm || null;
    this.turn = 0;
    this.warm = null;
    this.stats = { hints: 0, draftStarts: 0, draftSkippedDebounce: 0, draftSkippedNoNewWords: 0, draftCancels: 0, warmStarts: 0, warmCancels: 0,
      warmPromoted: 0, warmWastedChars: 0, speaks: 0, safetyQuarantines: 0 };
    this.resetTurn();
  }

  resetTurn() {
    this.lastLaunchAt = -Infinity;
    this.lastLaunchTokens = 0;
    this.lastHash = null;
    this.warmCount = 0;
    this.safety = false;
  }

  /** Her hand-over: a new child turn. W drafts launch here for code-gradable closed items (outcomes keyed, no child words). */
  onHandover(now, { itemId = null, codeGradable = false, outcomes = [] } = {}) {
    this.abortWarm(now, "handover");
    this.dm.onHandover(now, { itemId, codeGradable, outcomes });
    this.turn++;
    this.resetTurn();
  }

  /**
   * One tick's preparation hint.
   * @param {number} now
   * @param {{draft:string, warmTts:string, textHash:string}} hint
   * @param {{ text: string, uptake?: string|null }} words  the stable text the hint keys on, and the code-built uptake
   */
  onPrepare(now, hint, words) {
    this.stats.hints++;
    if (this.safety || !hint) return;
    if (hint.draft === "cancel") {
      if (this.dm.liveCandidate()) { this.dm.onResume(now); this.stats.draftCancels++; }
      this.lastHash = null;
    } else if (hint.draft === "start" || (hint.draft === "keep" && hint.textHash !== this.lastHash)) {
      const n = nTok(words.text);
      if (!words.text) { /* nothing to key on yet */ }
      else if (hint.textHash === this.lastHash && this.dm.liveCandidate()) { /* same key: keep */ }
      else if (now - this.lastLaunchAt < this.caps.debounceMs) this.stats.draftSkippedDebounce++;
      else if (this.lastHash !== null && n - this.lastLaunchTokens < this.caps.minNewWords) this.stats.draftSkippedNoNewWords++;
      else if (this.dm.onCandidate(now, words.text)) {
        this.stats.draftStarts++;
        this.lastLaunchAt = now;
        this.lastLaunchTokens = n;
        this.lastHash = hint.textHash;
      }
    }
    if (hint.warmTts === "cancel") { if (this.warm) { this.abortWarm(now, "cancel"); this.stats.warmCancels++; } }
    else if (hint.warmTts === "start" && this.launchWarm && words.uptake && (!this.warm || this.warm.hash !== hint.textHash) && this.warmCount < this.caps.maxWarmPerTurn) {
      this.abortWarm(now, "rekey");
      this.warmCount++;
      this.stats.warmStarts++;
      const job = { key: { turn: this.turn, textHash: hint.textHash, kind: "uptake" }, text: words.uptake };
      this.warm = { hash: hint.textHash, text: words.uptake, startedAt: now, h: this.launchWarm(job, now) };
    }
  }

  abortWarm(now, why) {
    if (!this.warm) return;
    try { this.warm.h.abort?.(now); } catch { /* a warm buffer that cannot abort is simply never played */ }
    if (why !== "promoted") this.stats.warmWastedChars += this.warm.text.length;
    this.warm = null;
  }

  /**
   * SPEAK was governed. Returns what can play: a promoted draft (by grade for W, by text hash for speculation) and the warm
   * uptake buffer if its hash matches.
   * @param {number} now
   * @param {{ text: string, textHash: string, grade?: {outcome:string, value?:string}|null }} spk
   */
  onSpeak(now, spk) {
    this.stats.speaks++;
    const pick = this.safety ? { phase: "commit", readyAt: null, key: null } : this.dm.onCommit(now, spk.text, spk.grade ?? null);
    let warm = null;
    if (this.warm && !this.safety && this.warm.hash === spk.textHash) {
      warm = { readyAt: this.warm.h.readyAt ?? null, text: this.warm.text, startedAt: this.warm.startedAt };
      this.stats.warmPromoted++;
      this.abortWarm(now, "promoted");
    } else this.abortWarm(now, "miss");
    return { ...pick, warm };
  }

  /** The child resumed before her verdict word: the promoted draft is void; speculation may start again. */
  onRevoke(now) {
    this.dm.onRevoke(now);
    this.abortWarm(now, "revoke");
    this.lastHash = null;
  }

  /** Sticky safety: abort and quarantine everything non-safety for the rest of the turn. */
  onSafety(now) {
    if (this.safety) return;
    this.safety = true;
    this.stats.safetyQuarantines++;
    this.dm.onSafety(now);
    this.abortWarm(now, "safety");
  }

  close(now) { this.abortWarm(now, "close"); this.dm.closeTurn(now); }

  summary() { return { ...this.dm.summary(), prepare: { ...this.stats } }; }
}
