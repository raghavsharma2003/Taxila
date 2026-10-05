// STAGECRAFT: the speculative content conductor (docs/design/stagecraft/STAGECRAFT.md). Types and interfaces only.
//
// The duplex idea, applied to content (OWNER-RESET item 17, 2026-10-05). While the conversation runs, a bounded
// PORTFOLIO of candidate pieces is built in parallel, from several sources at once. The candidates are pieces Stagecraft
// may show: library hits, engine specs, images, and rarely a live build. At each turn-relevant point the REVEAL POLICY
// shows the one piece that still fits what is being discussed. If no such piece is ready, it shows the next-best ready
// rung of the same idea. If nothing is ready, the teacher draws on the board. The child never sees a loading state, a
// stale piece or a wrong piece.
//
// Laws this file encodes (each one is a field or a type below):
//   L1 lossless: speculation changes WHEN a piece is ready, never WHICH piece the code policy picks (SC-1)
//   L2 intent, not value: candidates are keyed on intent; the child's own values are bound at commit (SC-4)
//   L3 premise, not clock: a candidate is fresh only while its ValidityKey equals the state at the boundary (SC-11)
//   L4 boundary only: nothing reaches the stage except at a RevealPoint, and never while the child holds the floor
//   L5 kernel picks: a model never decides whether or when to show something, and never grades (SC-5, rj-sc-model-decides-reveal)
//   L6 safety drops the pool: a safety turn quarantines every candidate, in flight or ready (SC-13)
//   L7 words bound to stage: the teacher refers only to StageFacts of what is revealed, or of what is being revealed
//      with her line. Every candidate carries a board twin with the same values, so a mount failure keeps her words true.
//
// Erasable TypeScript only (no enums, no namespaces): plain Node with type stripping, and the server, can import it.
import type { BeatType } from "./brain.ts";
import type { Band4 } from "./learner.ts";
import type { StepState } from "./signals.ts";
import type { StudioFacts, StudioKind } from "./studio.ts";

export type StagecraftContractVersion = "stagecraft/2026-10-05";
export type Ms = number;
export type Usd = number;
/** 0..1 */
export type Prob = number;

// ───────────────────────────── rungs (the build ladder) ─────────────────────────────
/**
 * How a candidate is made. Ordered from fastest to slowest to build. The `board` rung is always available, because
 * drawing on the board IS the content. `steer` is not a new piece: it is a knob change or a timeline seek on the piece
 * already on stage.
 *   steer           < 100 ms   engine knob (speed, tolerance, marks) or timeline seek; no generation
 *   library         ≤ 1 s      promoted library variant (server/studio/library.js lookup), params re-bound from the kit
 *   engine_default  ≈ 0 ms     RS-4 engine with kit-seeded params (validateSpec(arch, kitSeed) → reviewed default)
 *   generated_spec  ≈ 3.25 s   small-model spec (studio-spec@2) → validateSpec → engine truth recomputation
 *   image           ≈ 15 s     text-free art (flare-low, then gpt-image-2 low on a 429); never carries a fact
 *   live_codegen    34-54 s    Wave 2 two-arm race (server/studio/build.js); planned from lookahead ≥ 90 s only
 *   board           streamed   whiteboard script (planWhiteboard) or the code-built board twin of a candidate
 */
export type Rung = "steer" | "library" | "engine_default" | "generated_spec" | "image" | "live_codegen" | "board";
/** The rungs a scheduler tier owns (each tier has its own concurrency cap and budget). */
export type Tier = "instant" | "spec" | "image" | "live";
export const RUNG_TIER: Readonly<Record<Rung, Tier>> = {
  steer: "instant", library: "instant", engine_default: "instant", board: "instant",
  generated_spec: "spec", image: "image", live_codegen: "live",
};

// ───────────────────────────── candidate sources (per tick) ─────────────────────────────
export type SourceKind =
  | "plan_lookahead"     // the next 2-3 beats of the lesson arc (W2-H candidateIntents, Brain beat plan)
  | "partial_intent"     // the duplex partial stream (server/duplex/buildIntent.js: misconception, curiosity, hint)
  | "child_request"      // explicit: "dikhao", "game banao", "dusre tarike se", an aid tap (StageRequest source child_request)
  | "child_signal"       // stuck / fragile / disengaged / curious (server/signals, server/voicesig)
  | "board_state";       // what is on stage now and how the child is doing on it (StudioTurnView.outcome)

/** What a source says the child will need. A nomination is SILENT: it can create, re-score or invalidate candidates, never reveal. */
export interface Nomination {
  source: SourceKind;
  /** The intent family this belongs to (one family = one idea; candidates in a family are alternative rungs or modalities of it). */
  family: FamilyKey;
  need: StageNeed;
  /** Closed-vocabulary target: kit ids only, never free text and never the child's words. */
  target: { skillId: string; itemId?: string | null; misconceptionId?: string | null; term?: string | null };
  /** Preferred kinds in order (code table, STUDIO-V2 §7 and the SC-8 priors), e.g. ["animation", "game"]. */
  kinds: StudioKind[];
  /** The source's own probability that this family is wanted at its deadline (calibrated per source, §2 of the doc). */
  pNeed: Prob;
  /** When it would be shown, on the lesson clock (a beat boundary, the next turn boundary, or "next TRP" for a request). */
  deadlineAt: Ms;
  /** Strength of the signal, which sets the highest tier it may start (SC-3 eagerness by tier). */
  strength: "weak" | "stable" | "planned" | "explicit";
  /** A child's explicit ask: pNeed is 1 and it is urgent. */
  childRequested?: boolean;
  at: Ms;
}
export type StageNeed =
  | "explain" | "introduce" | "contrast_misconception" | "practice" | "probe" | "explore_question"
  | "re_represent"      // explain differently / switch representation (stuck_unproductive, "dusre tarike se")
  | "switch_modality"   // disengagement: game ↔ sim ↔ animation (choiceDue)
  | "verify"            // a fragile right answer: a transfer item on a different representation (verifyDue)
  | "celebrate_mastery";
/** `${skillId}|${need}|${misconceptionId ?? "-"}|${itemId ?? "-"}`: built in code, stable across ticks. */
export type FamilyKey = string;

/** The child-signal reading Stagecraft accepts (a projection of the signal frame; licences only, never affect). */
export interface SignalReading {
  stepState?: StepState | null;          // stuck_unproductive → re_represent; stuck_productive → HOLD the stage (no new piece)
  verifyDue?: boolean;                   // a fragile right answer → verify
  choiceDue?: boolean;                   // disengagement risk → switch_modality
  curious?: { depth: "what" | "why_how" | "what_if"; term?: string | null } | null;   // L9 question depth → explore_question
  breakDue?: boolean;                    // suppresses all new nominations (a break is not a content moment)
  abstain?: boolean;                     // ABSTAIN: the reading adds nothing
}

/** The board-state reading: what is on stage and the HOST's grades on it (never the frame's claim). */
export interface BoardReading {
  onStage: StageFacts | null;
  outcome?: { lastVerdict: "right" | "wrong" | null; wrongCount: number; complete: boolean } | null;
  /** The child is steering the running piece: answered by a knob change, never by a new generation. */
  steer?: "harder" | "easier" | "slower" | "faster" | "again" | null;
}

// ───────────────────────────── the premise (validity key) ─────────────────────────────
/**
 * The conversation state a candidate was built for. Re-derived at every reveal point. A candidate is fresh only if
 * every field still matches (L3). Ids only: no words, no child id.
 */
export interface ValidityKey {
  lessonId: string;
  topicId: string;
  skillId: string;
  beat: BeatType;
  itemId: string | null;
  misconceptionId: string | null;
  /** The learner model's view of that misconception at build time: "active" | "resolved" | "unknown". */
  misconceptionState: "active" | "resolved" | "unknown";
  hintRung: number;
  representation: "concrete" | "pictorial" | "symbolic" | null;
  band: Band4;
  lang: "hi" | "en" | "hinglish";
  kitHash: string;
  /** Ledger version at build; a change matters only where it changes the target (see InvalidationRule). */
  learnerRev: number;
  /** The last committed turn sequence the candidate saw. */
  floorRev: number;
  /** Ids of grades, classifies and safety reads in flight at build time (LiveKit #1365 guard). */
  pending: string[];
}

export type InvalidationReason =
  | "topic_change"            // skillId or topicId moved: every candidate of the old skill dies
  | "item_change"             // an item-bound candidate for an item no longer active
  | "beat_exit"               // the beat it was for ended and it is not admissible in the next one
  | "misconception_revealed"  // a different misconception was detected: siblings in the old family are demoted
  | "misconception_resolved"  // the child repaired (wrong_to_right) or the ledger cleared it: its contrast pieces die
  | "request_superseded"      // a newer child request replaced an older one ("game" after "diagram")
  | "representation_change"   // hint rung or representation moved past what the piece shows
  | "pending_changed_choice"  // an in-flight grade or classify landed and changes the choice
  | "kit_change"
  | "lang_change"
  | "safety"                  // pool-wide quarantine (L6)
  | "parent_off"              // Studio off or ready-made only: speculative rungs stop
  | "stale_age"               // ready and unrevealed past readyUnrevealedMs (4 min): goes to the library, not the bin
  | "churn"                   // the family flipped faster than this tier can build: demoted to a cheaper tier
  | "budget"                  // pre-empted by a higher-value candidate under a full tier
  | "validation_failed"       // a failed validator: the next rung down is tried; never visible
  | "lost_race";              // the other arm passed first (kept as a library variant if it passed the gate)

export interface InvalidationRule {
  reason: InvalidationReason;
  /** Which ValidityKey fields trigger it. */
  fields: (keyof ValidityKey)[];
  /** kill: discard now. demote: keep, but pNeed × factor. library: return a gated piece to the library. */
  effect: "kill" | "demote" | "library";
  demoteFactor?: number;
}

// ───────────────────────────── the portfolio ─────────────────────────────
export type CandidateState =
  | "nominated"   // scored, not launched (waiting for budget or a stronger signal)
  | "building"
  | "ready"       // validated and stage-contract checked; invisible
  | "revealed"
  | "discarded"
  | "library";    // passed every gate but was not shown: kept for reuse

export interface Candidate {
  id: string;
  family: FamilyKey;
  rung: Rung;
  kind: StudioKind;
  /** RS-4 archetype (e.g. "catch-on-line@1"), a Wave 2 archetype, or "whiteboard" | "image". */
  archetype: string;
  state: CandidateState;
  premise: ValidityKey;
  sources: SourceKind[];
  /** max over the family's live nominations, decayed by age; 1 for a child request. */
  pNeed: Prob;
  /** Signed learning value of this piece for this premise (an off-target or seductive piece is negative, SC-7). */
  value: number;
  deadlineAt: Ms;
  estCostUsd: Usd;
  estReadyAt: Ms;
  launchedAt?: Ms;
  readyAt?: Ms;
  /** The intent-shaped payload. Values the child will supply are slots, bound at commit (L2). */
  payload: CandidatePayload;
  /** The code-built board version of the same idea with the same values (L7): what plays if the mount fails. */
  boardTwin: BoardTwin;
  checks?: CandidateChecks;
  /** Telegraphic facts for the Brain, from the validated payload; never sentences (recitation law). */
  facts?: StageFacts;
  invalidated?: { reason: InvalidationReason; at: Ms };
  costUsd?: Usd;
  /** Model deployment that built it (for 429 accounting and the router). */
  deployment?: string;
}

export type CandidatePayload =
  | { rung: "steer"; knob: string; value: number | string }
  | { rung: "library"; buildSha: string; identity: string; params: Record<string, unknown> }
  | { rung: "engine_default" | "generated_spec"; archetype: string; spec: unknown; lateBind?: LateBindSlot[] }
  | { rung: "image"; prompt: PromptRef; blobUrl?: string; overlays: { term: string; anchor: [number, number] }[] }
  | { rung: "live_codegen"; intentId: string; buildSha?: string }
  | { rung: "board"; scriptRef: string };
/** A slot in a spec that takes the child's committed value (e.g. their wrong fraction as the contrast pair). */
export interface LateBindSlot { path: string; from: "committed_value" | "committed_misconception_value"; fallback: unknown }
/** A prompt is built in code from closed vocabulary; this is its id and hash, never the text in telemetry. */
export interface PromptRef { template: string; hash: string }
export interface BoardTwin { scriptRef: string; values: Record<string, string | number> }

/** Every check a candidate passes before it is "ready" (each is code; none is a model judgement). */
export interface CandidateChecks {
  /** validateSpec ran; fellBack means the reviewed default plays (still correct). */
  spec?: { ok: boolean; repairs: number; fellBack: boolean };
  /** Engine truth recomputed from the kit; items admissible; keys present for every answerable item. */
  truth: boolean;
  /** DESIGN-V3 §6: declared canvas in the allowed aspects, safe zones, minimum sizes (rendered gate for live builds). */
  stageContract: boolean;
  /** server/studio/seam.js aboutTopic + w2h-fraction-archetype-topic-guard. */
  onTopic: boolean;
  /** Q8 for every child-visible string; images: OCR no-text presence + Content Safety. */
  contentSafe: boolean;
  /** live_codegen only: router.revealable({ gate }). */
  gatePassed?: boolean;
}

/** The facts the teacher may speak about (a projection of StudioFacts plus the rung, for telemetry). */
export interface StageFacts extends StudioFacts { candidateId: string; rung: Rung }

export interface Portfolio {
  lessonId: string;
  candidates: Candidate[];
  /** Safety quarantine is sticky until the safeguard ends (the governor leaves safety_attend and the kernel closes it). */
  quarantined: boolean;
  onStage: StageFacts | null;
  spend: SpendLedger;
  rev: number;
}

// ───────────────────────────── the scheduler ─────────────────────────────
export interface TierCaps {
  /** Concurrent builds in this tier for this lesson. */
  concurrent: number;
  /** Live candidates per family (SC-2: about 3, across different archetypes or modalities). */
  perFamily: number;
  perMinute: number;
  perLessonHour: number;
  usdPerLessonHour: Usd;
  /** The weakest signal strength that may start this tier. */
  minStrength: Nomination["strength"];
  /** Minimum lead (deadline − now) at launch; below it the tier is skipped (it could not be ready in time). */
  minLeadMs: Ms;
}
export interface SchedulerConfig {
  tiers: Readonly<Record<Tier, TierCaps>>;
  /** Score hysteresis: a newcomer pre-empts a running build only if its score is this many times higher. */
  preemptRatio: number;
  /** No spec or image launches from her `committed` phase until this long into her_turn (the reply's TTFT window). */
  replyQuietMs: Ms;
  /** Reveal thresholds (SC-5): reveal at ≥ reveal, teacher offers ("dikhaun?") at ≥ offer, else nothing. */
  pReveal: Prob;
  pOffer: Prob;
  /** Spend caps that override every score. */
  usdPerLesson: Usd;
}

/** Shared, process-wide quota state per deployment (the image lane's 4 RPM is subscription-wide). */
export interface QuotaState {
  deployment: string;
  /** Token bucket for this deployment (requests per minute available to Stagecraft). */
  tokens: number;
  refillPerMin: number;
  /** After a 429: no launches until this time (Retry-After, else exponential from 2 s, max 60 s). */
  coolUntil: Ms;
  recent429: number;
  /** The reply lane's deployment is never used by Stagecraft, and its 429s pause Stagecraft spec launches. */
  isReplyLane: boolean;
}
export interface FailoverChain { tier: Tier; deployments: string[] }

export interface SpendLedger { usdLesson: Usd; usdWasted: Usd; byTier: Record<Tier, { launched: number; ready: number; revealed: number; usd: Usd }> }

/** score = pNeed × (value − valueOfBestReadyInFamily) × pReadyByDeadline × freshness − λ·cost (SC-9), × urgency. */
export interface ScoreTerms {
  pNeed: Prob;
  valueGain: number;
  pReady: Prob;
  freshness: Prob;
  costUsd: Usd;
  urgency: number;
  score: number;
}

// ───────────────────────────── the reveal policy ─────────────────────────────
/** A turn-relevant point. Reveals happen here and nowhere else (L4). */
export type RevealPointKind =
  | "trp"               // a governed transition to her floor: `committed` → `her_turn` (her reply starts; the reveal is fused to her line)
  | "beat_boundary"     // the kernel opened a new beat
  | "request_answered"; // her reply to a child request (same as trp, but the request family is pinned)
/** Duplex FloorPhase values that are boundaries (src/duplex/engine.ts; server/duplex/buildIntent.js PHASE_BOUNDARY). */
export type BoundaryPhase = "her_turn" | "committed" | "handover";

export interface RevealPoint {
  kind: RevealPointKind;
  phase: BoundaryPhase;
  turnSeq: number;
  /** The state re-derived NOW, which every candidate's premise is compared against. */
  current: ValidityKey;
  /** What the code policy (kernel + Director) wants shown this turn, decided with no knowledge of readiness (L1). */
  want: StageWant | null;
  safetyOpen: boolean;
  childHoldsFloor: boolean;
  at: Ms;
}
/** The policy's choice: an idea (family) and an archetype or kind preference. Stagecraft serves it or steps down rungs. */
export interface StageWant {
  family: FamilyKey;
  need: StageNeed;
  kinds: StudioKind[];
  archetype?: string | null;
  pNeed: Prob;
  childRequested: boolean;
}

export type RevealOutcome =
  | { act: "reveal"; candidateId: string; rung: Rung; facts: StageFacts; boundValues?: Record<string, unknown>; cue: RevealCue }
  | { act: "steer"; knob: string; value: number | string }
  | { act: "offer"; family: FamilyKey; candidateId: string }        // the teacher asks "dikhaun?"; the reveal waits for yes
  | { act: "board"; family: FamilyKey; scriptRef: string; facts: StageFacts }  // nothing ready and fresh: she draws
  | { act: "hold"; why: HoldWhy };                                   // nothing changes on stage
export type HoldWhy =
  | "no_want" | "safety" | "child_floor" | "below_threshold" | "stuck_productive" | "same_piece"
  | "no_reference_in_line" | "rate_limit" | "parent_off";
/** Fuse the reveal to her sentence: fire at the clause that names it, with the cue scheduler's 400 ms pre-roll. */
export interface RevealCue { clauseIdx: number; preRollMs: Ms; crossFadeMs: Ms }

/** Why a ready candidate was not served at a point (telemetry). */
export type RejectWhy = "stale" | "not_wanted" | "lower_value" | "unchecked" | "off_topic" | "after_binding_invalid";

// ───────────────────────────── the conductor (pure reducer + effects) ─────────────────────────────
export type StagecraftInput =
  | { t: "nominate"; n: Nomination }
  | { t: "signal"; reading: SignalReading; at: Ms }
  | { t: "board"; reading: BoardReading; at: Ms }
  | { t: "state"; key: ValidityKey; at: Ms }                          // a committed turn, beat change, ledger write
  | { t: "phase"; phase: string; turnSeq: number; at: Ms }            // the governed duplex FloorPhase, mirrored to the server
  | { t: "landed"; candidateId: string; ok: boolean; payload?: CandidatePayload; checks?: CandidateChecks; costUsd: Usd; at: Ms }
  | { t: "quota"; deployment: string; status: 429 | 200; retryAfterMs?: Ms; at: Ms }
  | { t: "safety"; open: boolean; at: Ms }
  | { t: "reveal_point"; point: RevealPoint }
  | { t: "revealed"; candidateId: string; at: Ms }                    // the device painted it (the stage acknowledged)
  | { t: "mount_failed"; candidateId: string; at: Ms }                // → the board twin crossfades in; same values
  | { t: "timer"; at: Ms };

export type StagecraftEffect =
  | { e: "launch"; candidateId: string; rung: Rung; deployment: string | null; deadlineAt: Ms }
  | { e: "cancel"; candidateId: string; reason: InvalidationReason }
  | { e: "reveal"; outcome: RevealOutcome }
  | { e: "library_return"; candidateId: string }
  | { e: "telemetry"; row: StagecraftEvent };

export interface Stagecraft {
  readonly version: StagecraftContractVersion;
  /** Pure: same input + same state → same output. The production host and the evals simulator both run it. */
  step(state: Portfolio, input: StagecraftInput, cfg: SchedulerConfig): { state: Portfolio; effects: StagecraftEffect[] };
}

/** The builders Stagecraft calls (injected; production wires them to server/studio/** and the image lane). */
export interface RungBuilders {
  library(c: Candidate): Promise<CandidatePayload | null>;
  engineDefault(c: Candidate): CandidatePayload;                      // synchronous, code only
  generatedSpec(c: Candidate, deployment: string, signal: AbortSignal): Promise<CandidatePayload>;
  image(c: Candidate, deployment: string, signal: AbortSignal): Promise<CandidatePayload>;
  liveCodegen(c: Candidate, signal: AbortSignal): Promise<CandidatePayload>;   // router.decide must say "live"
  board(c: Candidate): BoardTwin;                                      // code-built twin; always succeeds
  check(c: Candidate, payload: CandidatePayload): CandidateChecks;     // validateSpec + truth + stage contract + topic + Q8
}

// ───────────────────────────── telemetry ─────────────────────────────
/** One row per candidate lifecycle change or reveal-point decision. Ids and numbers only: never child words. */
export interface StagecraftEvent {
  v: StagecraftContractVersion;
  lessonId: string;
  at: Ms;
  kind:
    | "nominated" | "launched" | "ready" | "invalidated" | "revealed" | "offered" | "board" | "held"
    | "discarded" | "library_return" | "quota_429" | "failover" | "mount_failed" | "point";
  candidateId?: string;
  family?: FamilyKey;
  rung?: Rung;
  source?: SourceKind;
  reason?: InvalidationReason | HoldWhy | RejectWhy;
  /** At a reveal point: the rung the policy's want was served at (null = nothing wanted). */
  servedRung?: Rung | null;
  /** At a reveal point: whether a fresh, checked candidate at the wanted rung or better was ready by the deadline. */
  readyWhenNeeded?: boolean;
  timeToReadyMs?: Ms;
  /** Reveal → her referring word, from the TTS clock (SC-6). */
  referenceGapMs?: Ms;
  costUsd?: Usd;
  deployment?: string;
  pNeed?: Prob;
  score?: number;
}

/** The numbers the eval reports against the targets (STAGECRAFT.md §6). */
export interface StagecraftScorecard {
  readyWhenNeededRate: Prob;
  readyWhenNeededByTrigger: Record<SourceKind, Prob>;
  timeToReadyMs: Record<Tier, { p50: Ms; p90: Ms }>;
  requestToFirstFrameMs: { p50: Ms; p95: Ms };
  wastedBuildsPerLessonHour: Record<Tier, number>;
  usdPerLessonHour: { total: Usd; wasted: Usd };
  wrongReveals: number;
  staleReveals: number;
  safetyTurnReveals: number;
  revealsWhileChildSpeaks: number;
  offTopicReveals: number;
  visibleFailures: number;
  /** L1: chosen (archetype, premise) identical with speculation off vs on, over the same replay. */
  losslessAgreement: Prob;
  generatedRevealsPerLesson: number;
  stageActiveShare: Prob;
  medianGapBetweenPiecesMs: Ms;
  childInitiatedShare: Prob;
  referenceGapMs: { p50: Ms; p90: Ms };
}
