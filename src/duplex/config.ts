/**
 * Starting values for the duplex runtime (ARCHITECTURE.md v2 §2.5-§2.7, §3, §4). EVERY number here is [E] unless marked
 * [T] (measured earlier in this repo) and is replaced by a fitted value in DX-3 / DX-5 / DX-6 (TaxilaFDB dev split,
 * frozen before test). One table, imported by the host, the stage A engine and the governor, so a threshold has exactly
 * one home. Erasable TypeScript (Node type stripping runs it in the evals).
 */
import type { ExchangeContext, Ms } from "./engine.ts";
import type { Band4 } from "../../shared/bands.ts";

/** The engine's timer (§2.1): 100 ms, plus an event tick on every stream event (no quantisation for those). */
export const TICK_MS: Ms = 100;

/** Per-context speaking thresholds and backstops (§2.6). bC / bH are the stage A combiner's context biases (§2.5.8). */
export interface ContextRow {
  /** SPEAK when pComplete >= speakPc AND pHoldWanted <= speakPh (and the governor allows). */
  speakPc: number;
  speakPh: number;
  /** The silence backstop while the engine stays uncertain (G10); a function of the child's own hold-pause profile. */
  backstopMs: (holdP50: Ms, holdP90: Ms, hasValue: boolean) => Ms;
  /** Content-blind nods allowed in this context (none inside a closed answer). */
  nods: boolean;
  bC: number;
  bH: number;
  /** Weight of the normalised silence term in z_C and z_H. */
  wSil: number;
  wHSil: number;
}

export const CONTEXT: Record<ExchangeContext, ContextRow> = {
  closed_answer: {
    speakPc: 0.85, speakPh: 0.2, nods: false, bC: -2.0, bH: -1.0, wSil: 1.5, wHSil: 1.5,
    // after a value: max(700 ms, the child's hold p50); no value yet: 1,500 ms then a code-built non-verdict prompt
    backstopMs: (p50, _p90, hasValue) => (hasValue ? Math.max(700, p50) : 1500),
  },
  open_explanation: {
    speakPc: 0.9, speakPh: 0.1, nods: true, bC: -1.0, bH: -1.5, wSil: 1.0, wHSil: 2.0,
    backstopMs: (_p50, p90) => Math.min(3000, Math.max(2000, 1.2 * p90)),
  },
  question_to_her: { speakPc: 0.75, speakPh: 0.25, nods: true, bC: -0.5, bH: -1.5, wSil: 1.0, wHSil: 1.5, backstopMs: () => 800 },
  chit_chat: { speakPc: 0.7, speakPh: 0.3, nods: true, bC: -0.5, bH: -1.2, wSil: 1.0, wHSil: 1.5, backstopMs: () => 700 },
  free: { speakPc: 0.8, speakPh: 0.25, nods: true, bC: -1.0, bH: -1.2, wSil: 1.0, wHSil: 1.5, backstopMs: () => 1000 },
};

/** While the child plainly holds the floor (pHoldWanted >= this), any backstop is stretched by BACKSTOP_HOLD_STRETCH. */
export const BACKSTOP_HOLD_PH = 0.6;
export const BACKSTOP_HOLD_STRETCH = 2.5;

/** The child's within-turn hold pauses until session 3 (§2.5.6, P12). B1/B4 extrapolated [E]. */
export const BAND_PACE: Record<Band4, { p50: Ms; p90: Ms }> = {
  B1: { p50: 800, p90: 2300 },
  B2: { p50: 700, p90: 2000 },
  B3: { p50: 600, p90: 1600 },
  B4: { p50: 500, p90: 1300 },
};
/** Answers in the child's weaker language get x1.3 windows (P4, P11). */
export const WEAKER_LANGUAGE_STRETCH = 1.3;

/** The lexical horizon (G5, §2.5.4): lexical evidence counts only while unseen child voice after coverage is <= this. */
export const HORIZON_MS: Ms = 120;
/** A fresh acoustic estimate this confident may vouch for the unseen tail (stage B; Smart Turn once X1 validates it). */
export const HORIZON_ACOUSTIC_P = 0.8;
export const ACOUSTIC_FRESH_MS: Ms = 300;
/** Semantic estimates: weight 0 once the text hash differs; decays to 0 over this after arrival (§2.5.2). */
export const SEMANTIC_DECAY_MS: Ms = 1500;

/**
 * Fast mouth, late verdict (G7, law 3): a verdict word plays no earlier than the last value's end + `delayMs`. One mutable
 * row so the simulator can sweep it (M-D7 swept 1.2 / 1.6 / 2.0 s; DX-6 refits it on TaxilaFDB). The first sound (the
 * uptake) is not delayed by it: only the verdict-bearing words are.
 */
export const VERDICT = { delayMs: 2000 as Ms };
/** @deprecated read VERDICT.delayMs (kept for older imports; the v2-draft value). */
export const VERDICT_DELAY_MS: Ms = 1200;
/** A hesitant first value (pausesThisTurn >= 1 or a filler before it) waits for this much silence too (§2.5.1; M-B1 21/21). */
export const HESITANT_VALUE_SILENCE_MS: Ms = 300;
/** word / phrase forms: complete only with prosodic finality or this much silence (§2.5.1). */
export const PHRASE_SILENCE_MS: Ms = 300;
/** A child onset this soon after her first sound of a SPEAK (and before the verdict) REVOKES and merges (v1 revocableMs, P8). */
export const REVOCABLE_MS: Ms = 1500;

/** Think while listening (§4.1): hysteresis on the projected pComplete. */
export const PREPARE = { draftStart: 0.5, warmStart: 0.8, cancelBelow: 0.35, cancelHoldMs: 300 as Ms, probeSilenceMs: 150 as Ms };

/** Rate limits and legality of visible / audible listening acts (G8). */
export const RATE = { nodMs: 3000 as Ms, mmMs: 12000 as Ms, reactChangeMs: 500 as Ms, mmMinVoicedMs: 4000 as Ms };
/** A backchannel opportunity (BOP): a 200-500 ms falling dip after >= 1.5 s of child speech (v1 NOD, Ward & Tsukahara). */
export const BOP = { minVoicedMs: 1500 as Ms, dipMinMs: 200 as Ms, dipMaxMs: 500 as Ms, lowRange: 0.33, mmDipMinMs: 400 as Ms };

/** Hold requests (G3): face only; a check-in look at 8 s; an offer the child can refuse at 15 s (CUT_IN hold_offer). */
export const HOLD = { checkinMs: 8000 as Ms, offerMs: 15000 as Ms };
/** Safety (G1): the safeguard speaks at a TRP (pComplete >= 0.6) or after this much silence; never over child voice. */
export const SAFETY = { silenceMs: 1500 as Ms, speakPc: 0.6, presenceMs: 6000 as Ms };
/** The closed CUT_IN list's conditions (G6, §3.4). */
export const CUT_IN = { microPauseMs: 200 as Ms, wordSearchSilenceMs: 1500 as Ms, offTaskPauseMs: 300 as Ms, offTaskB2: 20000 as Ms, offTaskB3: 30000 as Ms };
/** The wait-time-I ladder after her question when the Director sends none (P4: recall B2 4 s then +3 s). */
export const WT1_DEFAULT = { faceMs: 4000 as Ms, voiceMs: 7000 as Ms };

/** Her floor (§3.2-§3.3, G11). */
export const OVERLAP = {
  /** The acoustic decision window opens after this much child voicing over her. */
  decideMs: 150 as Ms,
  /** Voicing this long without a break is a barge-in whatever else is true [E; DX-5 fits it]. */
  sustainedMs: 450 as Ms,
  /** G11: child voicing this long over her forces a yield. */
  forceYieldMs: 1000 as Ms,
  /** A yield that turns out to be a continuer resumes from heardUpTo if the overlap ended within this (Voice-Light 800 ms). */
  resumeWithinMs: 700 as Ms,
  /** Her clause-boundary slot: continuers live here. */
  boundarySlotMs: 250 as Ms,
  /** The reflex duck gain while undecided (shipped cascade DUCK_LEVEL). [T] */
  duckLevel: 0.2,
  /** A burst that ended undecided for this long un-ducks (shipped DUCK_RELEASE_MS 700). [T] */
  duckReleaseMs: 700 as Ms,
  yieldP: 0.6,
  continuerP: 0.6,
  /**
   * Evidence added for a burst still voicing at 250-449 ms. 0 = stay ducked and undecided until the 450 ms sustain or the
   * burst ends (a continuer "हम्म" lasts ~300-400 ms); 1.0 = the eager v2-draft value that yielded on continuers and
   * resumed 0.8 s later (M-D7 ablation "eager"). The duck at onset already backs her voice off within ~40 ms.
   */
  earlyVoicedZ: 0,
};

/**
 * When the FIRST words of a fresh voiced burst arrive after its onset, per source (p90). A resumable yield with no words yet
 * resumes only after this (+ 300 ms): before it, "no text" means "not transcribed yet", not "nothing said".
 * live_transcribe [T] M-D2 first delta after onset p90 2,048 ms (n=28); mai_stream [T] STT-v3 first partial 2.58-3.2 s;
 * nemotron [E] one 320 ms chunk + 452 ms text-complete p90 rounded.
 */
export const FIRST_TEXT_P90: Record<string, Ms> = { live_transcribe: 2048, mai_stream: 3200, nemotron: 800, sim: 2000, other: 2500 };

/** Fail patient (G10): no engine decision for this long → stage A rules; a stage A fault → today's silence policy. */
export const FALLBACK = { staleMs: 500 as Ms, silenceMs: 900 as Ms };

/** The child's acoustic tracker (device frames: 20 ms hop). */
export const AUDIO = {
  frameMs: 20 as Ms,
  /** Voicing hangover: shorter quiet runs are inter-word gaps, not pauses (the frame generator's word gaps are 30-80 ms). */
  hangoverMs: 100 as Ms,
  /** A pause that counts toward pausesThisTurn (dsp.ts MIN_PAUSE_MS). [T] */
  pauseMs: 250 as Ms,
};
