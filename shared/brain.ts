// Teacher Brain contracts (TEACHER-BRAIN §4.1, §5, §6). W2 seam commit (BUILD-PLAN §4): TYPES ONLY. OWNED BY W2-E.
// Bands come from shared/bands.ts (one table); relational types from shared/relational.ts (RELATIONAL-OS §13);
// Studio intents from shared/studio.ts (LIVE-STUDIO §3.1). The kernel (server/brain/kernel.js) is the only place the
// per-turn authority order lives; every other component reaches the turn as a PROPOSER returning `Proposal`s.
import type { Band4 } from "./bands.ts";
import type { Move, MoveKind, UiDirectives } from "./contracts.ts";
import type { RelationalDirective, Stage, TeacherAffect } from "./relational.ts";
import type { StudioIntent, StudioSlot } from "./studio.ts";

export type BeatType = "arrive" | "warmup" | "hook" | "explain" | "worked_example" | "contrast" | "practice_set"
  | "probe" | "explore_question" | "teachback" | "reflect" | "recap" | "wrap" | "break" | "safeguard";
export type Representation = "concrete" | "pictorial" | "symbolic";
export type GuidanceLevel = "worked" | "faded" | "attempt";           // wb-guidance-ladder
export type EngagementState = "warming" | "engaged" | "strained" | "disengaging" | "stopped";
export type BondStage = Stage;                                          // meeting | first_sessions | regular | long_haul (S0-S3)
export type LessonPurpose = "lesson" | "practice" | "ask" | "homework";
export type ReasonCode = string;                                        // closed vocabulary in server/brain/reasons.js
/** An interest tag from the one registry (shared/interests.js, W2-C); "none" when the turn carries none. */
export type InterestTag = string;

/** The persona adapter's output (server/persona/adapter.js knobsFor): session config + the VIBE row, never sentences. */
export interface VibeKnobs {
  waitNudgeSec: number; endpointSilenceMs: number; turnWords: [number, number];
  humour: string; register: string; address: { childCallsTeacher: string; teacherCallsChild: string };
  exampleDomain: string | null; challenge: string; energy: string; probeSkin: string; languageMix: number; suppressed: boolean;
}

export interface BeatPlan {
  beatId: string; type: BeatType; skillId?: string; itemIds: string[];
  estMs: number;                        // estimated duration from the band's pacing table (§7.2)
  representation: Representation; guidance: GuidanceLevel;
  studio?: StudioIntent;                // LIVE-STUDIO §3.1 shape; neededAtMs on the lesson clock
  probeBudget: number;                  // test weight this beat may spend
  reason: ReasonCode[];                 // why this beat (codes, never prose)
  experiment?: { pointId: string; arm: string; p: number };
}
export interface LessonPlan {
  v: 1; lessonId: string; purpose: LessonPurpose;
  beats: BeatPlan[]; cursor: number; plannedMin: number; wrapAtMs: number;
  prefetch: StudioIntent[];             // opportunistic intents issued at start for beats 2-4
  inputsHash: string;                   // replay key (same discipline as PlannerInputs)
}
export interface TurnSignals {          // from the classify call (TB4); a hypothesis, never stored as a trait
  act: "answer" | "question_curious" | "question_clarify" | "chit_chat" | "idk_not_known" | "idk_cant_recall"
     | "frustration_words" | "pride_words" | "meta_slow" | "meta_break";
  personalShare: boolean; interest: InterestTag | "none"; humour: boolean;
}
export type ProposalSource = "safety" | "consent" | "conductor" | "governor" | "director" | "comprehension"
  | "relational" | "vibe" | "studio";
export interface ProposalCosts { latencyMs: number; attention: 0 | 1; testWeight: number; novelty: number; usd: number }
export interface Proposal {
  source: ProposalSource; kind: string;            // e.g. "move", "probe", "open_callback", "reveal", "wrap"
  payload: unknown; priority: number;              // derived from source authority + urgency (§10): 100 − 10 × rank + urgency
  costs: ProposalCosts;
  mandatory?: boolean;                             // safety, mandatory probes, parent limits
  reason: ReasonCode[];
  /** What this proposal vetoes BELOW its own authority (server/brain/kernel.js): "*", a source, or "kind:<kind>". */
  vetoes?: string[];
}
/** What the turn tells Studio to do (TurnPlan.studio, and TurnResponse.studio on the wire). */
export interface TurnStudio {
  reveal?: string; highlight?: string; retire?: string;
  setParam?: { intentId: string; name: string; value: unknown };
}
export interface TurnPlan {
  move: Move;                                      // existing shared Move
  probe?: { shapeId: string; facet: "K" | "U" | "T" | "M"; weight: number };
  relational?: RelationalDirective;                // RELATIONAL-OS decide() output, after arbitration (moveOverlay may be vetoed)
  studio?: TurnStudio;
  knobs: VibeKnobs;                                // persona adapter output
  ui: UiDirectives;
  accepted: Proposal[]; rejected: { p: Proposal; why: ReasonCode }[];
}
export interface Moment {                          // TB6: one object for voice and face
  move: MoveKind; verdict: "correct" | "not_yet" | "partial" | "ungraded";   // for licences only (no laugh after not_yet), never for affect
  engagement: EngagementState;                     // affect machine: task evidence + the child's words, never tone (ct-no-voice-emotion-inference)
  teacherAffect: TeacherAffect;                    // RELATIONAL-OS appraise(): display + intensity + cause; the ONLY affect producer
  bondStage: BondStage; safety: boolean; childLaughed: boolean; thinkAloud: boolean;
  studio?: "announcing" | "revealing" | "narrating";
  band: Band4; lang: "hi" | "hinglish" | "en";
  uptakePrelude?: { text: string };                // §5.4 L3: the child's own key token, verdict-neutral; absent on safety turns
}
/** The beat the turn belongs to, for the client (UiDirectives.beat): the L1 end-of-turn threshold reads `type`. */
export interface UiBeat { beatId: string; type: BeatType; index?: number; of?: number }

/** Quota lanes (BUILD-PLAN §1.3, server/lanes.js): hot and background calls never share a quota pool. */
export type QuotaLane = "hot" | "background";

/**
 * The whiteboard ask (owner priority 6, W2-E → W2-H): on an explanation beat whose kernel arbitration accepted it, the turn
 * hands Studio the guarded line she is about to speak, so the drawing script (W2-F's archetype; rendered by W2-B's player
 * inside the StudioStage box) follows her words: `server/studio/seam.js` `requestIntent(ask) → StudioAskAck | null`,
 * synchronous (it starts the async work itself), never throwing. Never the child's id or words; never the answer of an
 * item still to be asked (the drawing's numbers come from `line.text` and `kit.content`, the move's own kit content).
 */
export interface StudioAsk {
  intent: StudioIntent;
  /** The line the drawing anchors to (`WhiteboardScript.line`, anchor "line_audio_start"). */
  line: { lessonId: string; teacherReplySeq?: number; text: string };
  /** "continue" while the same explanation beat goes on (draw on the previous board); "fresh" clears it. */
  mode: "fresh" | "continue";
  kit: { topicId: string; kitHash?: string; content: string[]; item?: { id: string; prompt_en: string; prompt_hi: string }; onScreen?: boolean };
}
/** Studio accepted the ask: the slot the script will stream into (`StudioWire` {t: "script"} on SSE). */
export interface StudioAskAck { slotId: string; intentId: string; state?: StudioSlot["state"] }
