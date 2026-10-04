// Relational OS contracts (RELATIONAL-OS §13). OWNED BY W2-I (filled in W2-I R0/R1/R4, 2026-10-04).
// The server seam is server/relational/seam.js (snapshot / decide / onLessonEnd); the writers are
// server/relational/writers.js (re-exported by server/learner/writer.js). Nothing below NM-3 is ever persisted:
// RelSession and every child-affect field live in memory for one session only. The bond record (rel_bond, rel_event,
// relational_note: db/migrations/018_relational.sql) holds facts about what happened, never estimates about the child.
export type Stage = "meeting" | "first_sessions" | "regular" | "long_haul";          // S0-S3; never regresses
export const STAGES: readonly Stage[] = ["meeting", "first_sessions", "regular", "long_haul"];
export type TeacherOwnedKind = "unheard" | "unfair" | "teacher_error" | "net_loss";
export type ChildRuptureKind = "felt_scolded" | "pushed_fast" | "brushed_off";      // session only (NM-3)
export type RelLegalMode = "M0" | "M1" | "M2" | "M3";
export type LastEnd = "child_exit" | "timecap" | "disconnect" | "safeguard" | "completed" | null;

export interface BondSnapshot {                       // loaded once per lesson; mode-gated reads
  agentId: string; childId: string; legalMode: RelLegalMode;
  stage: Stage; stageSince: string; sessions: number; distinctDays: number;
  address: { teacherCallsChild: { name: string; source: "guardian" | "child_said" };
             childCallsTeacher: string | null; pronoun: "tum" | "aap" };
  teacherOpen: { eventId: string; kind: TeacherOwnedKind; ackedAtOpen: boolean } | null;
  christened: { methodId: string; skillId: string; label: string }[];        // label in the child's words, ≤ 6 words
  milestonesFired: string[]; rituals: Record<string, string>;
  callbacks: CallbackCandidate[];                     // already filtered by mode, consent, cooldown, sensitivity
  lastEnd: LastEnd;
  overlayOn: boolean;                                 // M3 cross-session overlay; false in M1/M2
  /** A stage crossing the academic record earned before this lesson (stageFor); written at lesson end. */
  stageUp?: { from: Stage; to: Stage } | null;
  /** Class level and language mode for this lesson (bands from shared/bands.ts; never a usage key). */
  classLevel: number; lang: "english" | "hinglish" | "hindi";
}
export interface CallbackCandidate { id: string; kind: "L" | "P" | "W"; tags: string[]; fragment: string; cite: { lessonId: string; turnIdx: number[] } }

/** The academic-record counts the stage gates read (RELATIONAL-OS §5.2): never a usage key, never an estimate. */
export interface StageCounts {
  sessions: number; distinctDays: number; spanDays: number;
  /** lessons with an unaided correct attempt after a not-yet on the same item (kt_evidence) */
  retryAfterNotYetLessons: number;
  /** explain-back passes (probe.teachback high) and the distinct skills they cover */
  explainBackPasses: number; explainBackTopics: number;
  /** an unrepaired teacher-owned event is open */
  teacherOpen: boolean;
}

export type RelSignalKind =
  | "uptake_gap" | "contest" | "misheard" | "self_label" | "withdrawal" | "warmth_offer" | "permanence_ask" | "secret_ask"
  | "contact_ask" | "romance" | "night_ask" | "goodbye" | "end_request" | "goodbye_distress" | "loneliness" | "harm" | "joke"
  | "share" | "share_sad" | "identity_q" | "memory_q" | "feelings_q" | "tired" | "reason_given" | "persisted" | "asked_harder"
  | "forget_ask";
export interface RelSignal {
  kind: RelSignalKind; turn: number; lane: "L" | "G" | "typed" | "chip"; confidence: "lexical" | "both_lanes";
  /** contact_ask / secret_ask: a third party (not the teacher) is the one asking: the F6 grooming branch */
  thirdParty?: boolean;
}

export interface RelClimate {                          // evidence COUNTS, not an emotion (§4.2); session only
  uptakeMisses: number; withdrawalTurns: number; selfLabels: number; contests: number; warmthOffers: number;
  permanenceAsks: number; secretAsks: number; contactAsks: number; romance: number; sharesOpen: number; tiredSays: number;
  stopAsks: number; nightAsks: number; lonelySays: number;
}

export interface RelSession {                         // in memory; deleted at lesson end
  turn: number;
  safeToBeWrong: number;                              // 0..1 this session only, never persisted
  climate: RelClimate;
  childRupture: { kind: ChildRuptureKind; openedTurn: number; repair: "open" | "repairing" | "repaired" } | null;
  teacherEvents: { kind: TeacherOwnedKind; turn: number; owned: boolean }[];
  affectTrail: TeacherAffect[];                       // ≤ 3 (TA5)
  callbackUsed: string | null; noticesUsed: string[]; jokes: { turn: number; tag: string }[];
  inSessionFacts: { id: string; fragment: string; turn: number }[];   // e.g. a pet's name said today
  overlayMoves: { pointOut: boolean; callbacksOff: boolean; reminderDue: boolean };
  /** the turn of the last end_request (the second stop within two turns releases) */
  lastStopAsk: number | null;
  /** distress or a disclosure happened this session (I-7: a goodbye gets one check-in first) */
  distressAt: number | null;
  /** the check-in before release was given (once per session) */
  checkInAt: number | null;
  /** the child's goodbye was honoured (RELEASE); nothing relational follows it */
  releasedAt: number | null;
  /** recent graded outcomes (correct | incorrect | partial | …), newest last, ≤ 6: persistence and error spacing */
  outcomes: string[];
  /** child words per turn (median for withdrawal), ≤ 20 */
  words: number[];
  /** the last turn a delight / warm_pride / playful display fired (caps) */
  lastPraiseAt: number | null; playfulCount: number; lastErrorAt: number | null;
  /** parent-visible notes and bond events drafted this lesson (deduplicated by kind), written at lesson end */
  notes: RelNoteDraft[]; events: RelEventDraft[];
}

export type Display = "delight" | "warm_pride" | "enthusiasm" | "gentle_concern" | "playful" | "calm_curious" | "sheepish_own" | "neutral_warm" | "calm_steady";
/** What caused a display. `correct` is never a cause (TA7): a right answer alone moves no affect. */
export type CauseEvent = "insight" | "christened" | "effort" | "milestone" | "topic_hook" | "share_sad" | "tired" | "withdrawal"
  | "self_label" | "child_joke" | "flip_slip" | "confusion" | "contest" | "teacher_owned_verified" | "release" | "safety" | "none";
export interface TeacherAffect { display: Display; intensity: 1 | 2; cause: CauseEvent; causeFragment?: string; turn: number }
/** What the client face receives (UiDirectives.teacherAffect): display and intensity only, never the cause. */
export interface TeacherAffectUi { display: Display; intensity: 1 | 2 }

export type RelOverlayKind = "WARM_BOUNDARY" | "RELEASE" | "CHECK_IN" | "OWN_SLIP" | "AFFIRM_RECHECK" | "SHARE_UPTAKE" | "NOTICE"
  | "CHRISTEN" | "HOME_TEACH_BACK" | "POINT_OUT" | "LAUGH_WITH";

export interface RelationalDirective {
  moveOverlay?: { kind: RelOverlayKind; shapeId: string; priority: number };
  affect: TeacherAffect;                              // neutral_warm on most turns (no tail row rendered)
  callbackId?: string; noticeId?: string; canRemember: boolean;
  floor?: "RELEASE" | "SAFETY" | "HOLD_ONE_TURN";     // HOLD_ONE_TURN = create_response:false for F2/F4/F6
  floorFix?: string[];                                // never-rules families to correct next turn
  ui: { teacherAffect: TeacherAffectUi };
  notes: RelNoteDraft[];                              // parent-visible facts, written at lesson end
  events: RelEventDraft[];                            // teacher-owned events, christenings, address changes
  /** reason codes for the decision log (closed vocabulary, never words) */
  reasons?: string[];
}

/** relational_note.kind: the closed set of parent-visible relational facts (RELATIONAL-OS §5.3, §10.4). */
export type RelNoteKind = "boundary_warmth" | "boundary_secret" | "boundary_contact" | "boundary_romance" | "boundary_goodbye"
  | "identity_asked" | "memory_forgotten" | "milestone" | "christened" | "teacher_slip_owned" | "safeguard_handoff";
/** A parent-visible relational fact, drafted in the turn and written at lesson end (relational_note). Closed slot
 *  values only (a move id, a stage, a skill id): never the child's words. */
export interface RelNoteDraft { kind: RelNoteKind; slots: Record<string, string | number | boolean>; turn: number }
/** rel_event.dim: the closed set of bond-record event dimensions. */
export type RelEventDim = "teacher_owned" | "repair" | "address" | "stage" | "milestone" | "ritual" | "christen" | "session";
/** A bond event (rel_event): teacher-owned events, christenings, address changes, milestones, rituals, stage crossings. */
export interface RelEventDraft { dim: RelEventDim; body: Record<string, string | number | boolean | null>; turn: number }

export interface RelBrief {                           // replaces ChildBrief.relationshipStage (string)
  stage: Stage; addressRow: string; methods: string[]; teacherOpenRow?: string; autonomyRow?: string;
}

/** The per-turn input to the seam's decide() (server/relational/seam.js). Pure: no network, ≤ 3 ms p99. */
export interface RelDecideInput {
  lessonId: string; childId: string; turn: number;
  /** The child's words for this turn (server-side only: decide() is pure code and never sends them to a model); "" for a help tap or a module-only turn. */
  childText: string;
  /** The classifier's outcome and signals (TurnSignals from shared/brain.ts once BR2 lands). */
  cls: { outcome: string; flags?: Record<string, unknown>; signals?: unknown } | null;
  /** The Director's planned move kind (the directive may veto or overlay it through the kernel). */
  move: string;
  lane: "voice" | "cascade" | "text";
  safety: boolean;
  /** Optional: a verdict reversed on re-check against the key this turn (teacher-owned `unfair`; RO-11). */
  verdictReversed?: boolean;
}

/** onLessonEnd's input: the writers it returns land in the end transaction (like the Conductor hooks). */
export interface RelLessonEnd {
  lessonId: string; childId: string; endedBy: "pagehide" | "client" | "safeguard" | "timecap";
  turns: number;
}
