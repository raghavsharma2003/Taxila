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
    // wait time II: 2.5-3.5 s (was 2-3 s: TaxilaFDB train 2026-10-04, 49/440 mid-explanation pauses of 2.2-2.8 s were cut
    // by the backstop on the fast lane; ends with a yield tag no longer wait for it)
    backstopMs: (_p50, p90) => Math.min(3500, Math.max(2500, 1.5 * p90)),
  },
  question_to_her: { speakPc: 0.75, speakPh: 0.25, nods: true, bC: -0.5, bH: -1.5, wSil: 1.0, wHSil: 1.5, backstopMs: () => 800 },
  chit_chat: { speakPc: 0.7, speakPh: 0.3, nods: true, bC: -0.5, bH: -1.2, wSil: 1.0, wHSil: 1.5, backstopMs: () => 700 },
  free: { speakPc: 0.8, speakPh: 0.25, nods: true, bC: -1.0, bH: -1.2, wSil: 1.0, wHSil: 1.5, backstopMs: () => 1000 },
};

/** While the child plainly holds the floor (pHoldWanted >= this), any backstop is stretched by BACKSTOP_HOLD_STRETCH. */
export const BACKSTOP_HOLD_PH = 0.6;
export const BACKSTOP_HOLD_STRETCH = 2.5;

/**
 * Within-turn pace (critique 2026-10-04): the longest pause this turn after which the child went on (>= minMs) sets a floor
 * of k x that pause on every later backstop (capMs) and on the verdict delay (verdictCapMs). k [E], chosen on the TaxilaFDB
 * TRAIN split under the slow-child perturbation (evals/duplex/critic), never on test.
 */
export const TURN_PACE = { k: 1.3, minMs: 400 as Ms, capMs: 6000 as Ms, verdictCapMs: 4000 as Ms };

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
/**
 * duplex-real (2026-10-07): the least child silence before a turn_end SPEAK OUTSIDE a closed answer, by the prosody of the
 * pause (stage A has no semantic estimate in production, and on real adult Hindi through the real STT the lexical "this
 * clause is complete" read committed inside 22-58 % of >= 500 ms thinking pauses: evals/duplex-real). One mutable row so
 * the sweep (evals/duplex-real/eot-sweep.mjs, TRAIN half of eot-bench Hindi) can set it; the values below were chosen on
 * TRAIN and reported on TEST (docs/design/round2/duplex-real/CRITERIA.md, context/inbox/duplex-real.json). Closed answers keep their own waits (extraWait).
 */
// Chosen on TRAIN (even row ids, 77 holds >= 500 ms, both lanes; evals/duplex-real/eot-sweep.mjs 2026-10-07): uniform 1,100 ms
// gave the fewest cut-offs (D4 18.2 -> 9.1 %, MAI 68.8 -> 15.6 %) at gap p50 922 / 911 ms; prosody-split rows cut more for
// ~70 ms less gap. It is Rowe's wait time II, not a latency target: closed answers, questions to her and "pata nahi" keep 0.
export const OPEN_TURN_WAIT = { prosodyFinal: 1100 as Ms, neutral: 1100 as Ms, prosodyContinue: 1100 as Ms };
/**
 * Round 3 (duplex, 2026-10-09): THE WORD-AWARE END OF TURN outside closed answers. The least child silence before she takes
 * the floor, by the pause class of the covered words (engineRules.ts pauseClass): a hold shape (open tail, filler, a
 * projection, a comma, a broken word, an unclosed number, a hold request) waits `hold`; a number being read out
 * `enumerating`; a finished question to her `question`; "pata nahi" `idk`; any other covered words `complete`. In the free,
 * question-to-her and chit-chat exchanges this is ALSO the silence backstop (G10), so the backstop never undercuts the
 * class (before: free 1,000 ms beat the 1,100 ms turn-end wait on 303/400 real turns). Chosen on the TRAIN half of
 * eot-bench Hindi (even row ids; 77 thinking pauses >= 500 ms; both real STT lanes; evals/duplex-r3/eot-policy.mjs) as the
 * fastest setting with <= 3 % cut-offs on both lanes; reported on TEST. Supersedes OPEN_TURN_WAIT (kept for older imports).
 * Real adult speech, not children: the pilot refits it. Mutable so the sweep can set it.
 */
export const PAUSE_WAIT: Record<"hold" | "enumerating" | "question" | "idk" | "complete", Ms> = { hold: 1600, enumerating: 1200, question: 900, idk: 0, complete: 1100 };
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

/** Hold requests (G3): face only; a check-in look at 4 s; an offer the child can refuse at 8 s (CUT_IN hold_offer). */
// ship5 fixer (2026-10-06, experience review B4): the offer moved 15 s → 8 s and the look 8 s → 4 s. In the e2e lessons a
// child's "ruko ruko didi ek second" left 12 s+ of dead air (the offer never came before they spoke again). [E] — not
// measured on children; the pilot's hold lengths should set these.
export const HOLD = { checkinMs: 4000 as Ms, offerMs: 8000 as Ms };
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
  sustainedMs: 600 as Ms, // 450 → 600 (TaxilaFDB train split 2026-10-04: TTS continuers 380-530 ms, n=36; barge-in turns 980+ ms; answers / repairs are told apart by the yes-no and rising-burst terms, not by length)
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
  /**
   * The hush (p1-duplex 2026-10-05): after this much sustained non-echo child voice over her, her gain drops to hushLevel
   * while the engine decides (YIELD on a barge-in, un-hush on a continuer). 0 turns it off. [E; fitted on TaxilaFDB TRAIN]
   */
  hushMs: 120 as Ms,
  /** ≈ -26 dB: under a child talking at the phone, her line is masked; she has not stopped, so a continuer costs nothing. */
  hushLevel: 0.05,
  /** Hushes that ended with no words and no turn before the hush switches off for the session (her echo, a noisy room). */
  hushGiveUp: 4,
  /** A short ended burst rising at least this fast over at least risingMinMs reads as a repair request ("kya?"). [E, TRAIN] */
  risingStPerS: 25,
  risingMinMs: 180 as Ms,
  /** An ended burst at most this long with ≤ 3 tokens incl. a listening token is a continuer (leakage glued on). [E, TRAIN] */
  shortBurstMs: 650 as Ms,
  /**
   * A burst whose opening median f0 sits this many semitones (or more) below the child's own median f0 is not the child
   * (an adult on the TV, a parent): no hush, no yield on its words or its length. 0 = off. [E, TaxilaFDB TRAIN]
   */
  notChildSemitones: 5,
  /** A burst too short to read its own pitch inherits the last attribution made within this long (p1-duplex). [E, TRAIN] */
  attributionCarryMs: 2000 as Ms,
  /** An acoustic-only yield waits for the burst to end or reach sustainedMs (the hush covers the wait). (p1-duplex, AMI dev) */
  waitForSustain: true,
  /**
   * A burst whose opening median YIN f0 is at or above this is a steady tone, not a voice (p1-duplex 2026-10-06: a cooker
   * whistle aliases to 485-618 Hz, median 573, on 1,980/1,980 synthetic frames; child speech f0 on TaxilaFDB TRAIN p99 513
   * Hz, 1.4% of frames >= 500). 0 = off. [E]
   */
  toneF0Hz: 540,
  /** Removed echo words count as echo evidence only while the mic is within this many dB of her echo estimate. [E] */
  echoNearDb: 10,
  /**
   * A burst this far below the child's own speech level is the room (TV, a sibling across it), not the child. 0 = OFF, the
   * default: on TaxilaFDB TRAIN (FAST, child-level prior from the same voice and room) TV false yields went 16/24 → 15/24
   * at 8 dB and 15/24 at 6 dB (TV peaks sit within a few dB of the child), so it ships off until a speaker model (X3).
   */
  backgroundBelowChildDb: 0,
  /**
   * Round 3 (duplex, AMI real speech + real STT, 2026-10-09): the hush gave up for the WHOLE LESSON after 4 hushes that
   * ended with no words (`hushGiveUp`), meant for her own echo. On real meetings continuers and other voices used those 4 up
   * within minutes, and 13 of 22 real barge-ins (2 meetings) then got no hush at all: her audio kept sounding ~0.5-1.3 s
   * into the child's speech. Now only an ECHO-LIKE burst counts (its level within `echoNearDb` of her echo estimate), and a
   * hush the child's words confirm resets the count.
   */
  hushGiveUpEchoOnly: true,
  /**
   * Round 3: while she is HUSHED (inaudible under the child), an acoustics-only barge-in waits for this much voicing (or the
   * words) before she is paused: the hush already met the child within ~150 ms, so the pause can wait for evidence. Real AMI
   * continuers ("yeah", "mm-hmm") voiced 330-1,000 ms on the device and the 600 ms sustain paused her on 20 of 103 (2 meetings).
   */
  hushedSustainMs: 1000 as Ms,
  /**
   * Round 3: an ENDED burst no longer than `shortBurstMs` with no words yet is never an acoustic barge-in (a rising contour, a
   * repair request, and her yes/no question still decide at once): it waits, hushed, for its words. Before, a 400-650 ms
   * "yeah" that started mid-clause with a raised onset was a barge-in the moment it ended.
   */
  endedShortWaitsForWords: true,
  /**
   * Round 3: a child onset while her REPLY plays inside the revoke window ARMS the revoke instead of firing it: the same
   * overlap classifier decides (a continuer disarms; a barge-in, a turn's words or a sustained burst revokes). Before, any
   * sound in the first 1.5 s of her reply revoked it: 10 of 103 real continuers (2 meetings) stopped her and dropped the reply.
   * Before her reply sounds (phase committed) the revoke still fires at once.
   */
  armedRevoke: true,
  /**
   * Round 3: when a burst over her goes quiet for PREPARE.probeSilenceMs, commit the transcription buffer at once (the
   * micro-commit probe the child's own turn already uses), so the words that decide continuer vs barge-in arrive ~0.3-0.6 s
   * after the burst instead of at the lane's first-text delay (D4 p90 2.0 s, MAI 3.2 s). Live only (shadow never probes).
   */
  overlapProbe: true,
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
