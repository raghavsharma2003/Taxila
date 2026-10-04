// Signals contracts (docs/design/signals/SIGNALS-SPEC.md §3, §6, §8.1). TYPES ONLY, plus two constant tables the
// client and server both read. Evidence and action licences, never feelings (SL-2, SL-3): every output name here is in
// the closed vocabulary of SIGNALS-SPEC §3.1, and tests/signals-lint.test.mjs fails the build on an affect word.
// Nothing here is persisted except via the existing voice_feature E-licence booleans (§5); SignalSession lives in
// lesson.state.sig and is cleared at lesson end (G-SIG-NM3).
//
// Deviations from the §8.1 draft, all owned by this workstream (logged in context/inbox/signals.json):
//   - SignalSession.item.attempts holds { h, num?, v } (an FNV-1a hash of the normalised answer, the numeric value when
//     the answer is a number, and the verdict), not the answer text: the session is "counts only, no text" (§5).
//   - evidenceWeight.k is the T-tier product only and lrE the E-tier product only, so a consumer never double-counts.
//   - SignalInput gains optional consumed fields (gaming, wheelSpin, voice.baseline, item.key/keyNum, plannedMinutes,
//     deltaFitted) that §6 implies but the draft type did not name.
import type { Band4 } from "./bands.ts";
import type { TurnSignals } from "./brain.ts";

export type SigTier = "T" | "E";
export type AsrSource = "gpt-live-transcribe" | "mai-transcribe-2" | "gpt-4o-transcribe" | "typed" | "unknown";
export type LangMode = "hi" | "hinglish" | "en";
export type FeatureId = `A${number}` | `L${number}` | `I${number}` | `G${number}`;
export type Rel = "high" | "low" | "none";
export interface Why { features: FeatureId[]; tier: SigTier; rel: Rel }

export type StepState = "progressing" | "stuck_productive" | "stuck_unproductive";
/** ⊂ relational CauseEvent; self_repair maps to effort inside appraise() (SIGNALS-SPEC §8.2 step 6). */
export type ChildWinCause = "insight" | "effort" | "child_joke" | "self_repair";
export type ItemForm = "number" | "word" | "choice_spoken" | "explain" | "read_aloud";
export type Verdict = "correct" | "partial" | "not_yet" | "ungraded";

/** A z-baseline summary in transformed units (server/voice/features.js BASELINED transform), for D11 timing only. */
export interface BaselineStat { n: number; mean: number; sd: number }

export interface SignalInput {
  turn: number; childText: string; lane: "voice" | "cascade" | "text"; typed: boolean; safety: boolean;
  asrSource: AsrSource; asrConfidence?: number;
  /** turnVoice() output for THIS utterance when it arrived in time. f = raw features, z = per-child z (null = young baseline). */
  voice?: {
    f: Record<string, number>; z: Record<string, number | null>; reliable: boolean; anchorReset?: boolean;
    /** Child onset baseline per form (log(1 + ms/100) units), when the caller loaded it; D11 only. */
    baseline?: { onsetMs?: BaselineStat };
  };
  cls: { outcome: string; flags?: Record<string, unknown>; signals?: TurnSignals | null } | null;
  verdict: Verdict;
  item?: {
    id: string; skillId: string; form: ItemForm; b?: number; expectsNumber?: boolean; kitTerms: string[];
    /** Normalised key text / numeric key, for in-turn repair grading (L5) and progress toward the key (I1). */
    key?: string; keyNum?: number;
  };
  ledger?: { theta?: number; pL?: number; mastered?: boolean; wheelSpin?: boolean };
  hintRung?: 1 | 2 | 3 | 4; beatType?: string; band: Band4; langModeHint?: LangMode;
  /** W2-I predicate hits this turn (server/relational/signals.js); the names are W2-I's (allowlisted in the lint). */
  relSignals?: { selfLabel?: boolean; contest?: boolean; withdrawal?: boolean; share?: boolean; tiredSaid?: boolean };
  /** affect.js gaming() for this turn (consumed, never recomputed). */
  gaming?: boolean;
  held?: number; teacherLast3: string[]; minutes: number; daypart?: "morning" | "afternoon" | "evening" | "late";
  plannedMinutes?: number;
  /** True once the population δ table (SG-M10) is fitted and passed; until then latency is timing-only (§2.5.3). */
  deltaFitted?: boolean;
  /** δ(form, b − θ) in log-onset units, looked up by the caller from signal_norms; 0 when unfitted. */
  delta?: number;
}

export interface SigAttempt { h: string; num?: number; v: Verdict }

export interface SignalSession {                 // lesson.state.sig; counts only; cleared at lesson end (G-SIG-NM3)
  v: 1; answerWords: number[]; anchor: Record<string, number> | null; anchorN: number;
  anchorBuf: Record<string, number[]>;
  item: { id: string | null; impasse: number; attempts: SigAttempt[]; lastVerdict?: Verdict; lastHintRung?: number; clarified: boolean; notYet: number };
  turnsSinceVerify: number; consolidated: Record<string, number>;     // skillId → extra items used (≤ 2)
  graded: { y: 0 | 1; bt?: number }[];                                 // for G4, last 24
  gradedFirst: { y: 0 | 1; bt?: number }[];                            // the session's first 6 graded (G4 baseline)
  gradedN: number;
  skillLast: Record<string, (0 | 1)[]>;                                // last 2 graded outcomes per skill (D9)
  rel: { initiative: number; deepQuestions: number; alignmentSum: number; alignmentN: number; shares: number; retries: number; jokes: number };
  breakOffered: boolean; pendingE: Record<string, number>;            // 2-turn holds for E licences
  driftBuf: number[];                                                  // last 4 reliable answer-turn composite z (G3)
  driftHigh: number;                                                   // consecutive turns with G3 ≥ 1
  nonAnswers: (0 | 1)[];                                               // last 5 child turns (D5)
  lowWords: number;                                                    // consecutive answer turns at ≤ ⅓ median words (D5)
  answerAsks: number[];                                                // child-turn indexes of "just tell me" (D10, K = 10)
  childTurns: number;
  langCounts: Record<LangMode, number>;                                 // L16 per session (modal language; never stored)
}

export interface SignalFrame {
  v: 1; abstain: boolean;                        // true on any safety turn: every licence below is empty
  evidenceWeight?: { k: number; lrE: number; why: Why[] };            // k = T product ∈ [0.64, 1]; lrE = E product ∈ [0.9, 1.1]
  verifyDue?: { why: Why[] };
  unsureCorrect?: boolean;
  stepState?: { s: StepState; why: Why[] } | null;
  recall?: "recallCue" | "teachFresh";
  choiceDue?: { why: Why[] };
  paceDown?: { why: Why[] };
  breakDue?: { path: "child_said" | "composite"; why: Why[] };
  childWin?: { causes: ChildWinCause[]; fragment?: string };          // fragment = the child's own words for CHRISTEN, ≤ 6 words
  advance?: "advanceOk" | "consolidate";
  tryFirst?: boolean; evidenceDiscount?: number;
  turn: { waitLonger: boolean; nudgeAtSec: number; thinkAloud: boolean };
  relEvidence?: SignalSession["rel"] & { alignment: number };
  q: { asr: number; acoustic: number; source: AsrSource };
  reasons: string[];                              // "sig:<state>:<featureId>" codes for brain_trace
}

/** What src/signals adds to an utterance's VoiceFeatureValues (SIGNALS-SPEC §2.2 A2, A13, A14 + q terms). Numbers only. */
export interface SignalExtras {
  /** A2: onset + the leading filled (flat voiced) segment, capped at onset + duration. */
  onsetContentMs?: number;
  /** A13: 1 when echo could colour the onset (loudspeaker route or teacher audible at the mic during onset). */
  echoRisk: 0 | 1;
  /** A14: 1 when the utterance looks like a different speaker (q only; never identity, never shown). */
  speakerShift: 0 | 1;
  /** A16 (q only, added by the build): energy-peak syllable nuclei per voiced second, an ASR-independent rate. */
  nucleiPerSec?: number;
  /** q terms computed on the device. qBed (build addition): 0 when the room held speech before the teacher stopped. */
  qDur: number; qLevel: number; qBed: number;
}

/** The closed output vocabulary (SIGNALS-SPEC §3.1). The reasons pattern and the lint both read it. */
export const SIG_STATES = [
  "evidenceWeight", "verifyDue", "unsureCorrect", "stepState", "recallCue", "teachFresh", "choiceDue", "paceDown",
  "breakDue", "childWin", "advanceOk", "consolidate", "tryFirst", "evidenceDiscount", "waitLonger", "nudgeAtSec",
  "relEvidence", "ABSTAIN",
] as const;
export type SigState = (typeof SIG_STATES)[number];

/** Class-band priors (SIGNALS-SPEC §2.5.5). ALL [U]: planning estimates, replaced by SG-M9 pooled medians. Mirrored by
 * server/signals/priors.js (plain JS for the server); tests/signals-server.test.mjs asserts the two are equal. */
export const BAND_PRIORS: Record<Band4, { onsetNumberMs: number; onsetExplainMs: number; articulationWps: number; waitNudgeSec: number; medianWords: number; plannedMinutes: number }> = {
  B1: { onsetNumberMs: 1800, onsetExplainMs: 3200, articulationWps: 1.8, waitNudgeSec: 7, medianWords: 3, plannedMinutes: 15 },
  B2: { onsetNumberMs: 1500, onsetExplainMs: 2800, articulationWps: 2.1, waitNudgeSec: 6, medianWords: 4, plannedMinutes: 20 },
  B3: { onsetNumberMs: 1300, onsetExplainMs: 2400, articulationWps: 2.4, waitNudgeSec: 5, medianWords: 6, plannedMinutes: 25 },
  B4: { onsetNumberMs: 1200, onsetExplainMs: 2200, articulationWps: 2.6, waitNudgeSec: 5, medianWords: 7, plannedMinutes: 30 },
};
