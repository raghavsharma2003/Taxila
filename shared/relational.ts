// Relational OS contracts (RELATIONAL-OS §13). W2 seam commit (BUILD-PLAN §4): TYPES ONLY. OWNED BY W2-I.
// The server seam is server/relational/seam.js (snapshot / decide / onLessonEnd); the writers are
// server/relational/writers.js (re-exported by server/learner/writer.js). Nothing below NM-3 is ever persisted:
// RelSession and every child-affect field live in memory for one session only.
export type Stage = "meeting" | "first_sessions" | "regular" | "long_haul";          // S0-S3; never regresses
export type TeacherOwnedKind = "unheard" | "unfair" | "teacher_error" | "net_loss";
export type ChildRuptureKind = "felt_scolded" | "pushed_fast" | "brushed_off";      // session only (NM-3)
export type RelLegalMode = "M0" | "M1" | "M2" | "M3";

export interface BondSnapshot {                       // loaded once per lesson; mode-gated reads
  agentId: string; childId: string; legalMode: RelLegalMode;
  stage: Stage; stageSince: string; sessions: number; distinctDays: number;
  address: { teacherCallsChild: { name: string; source: "guardian" | "child_said" };
             childCallsTeacher: string | null; pronoun: "tum" | "aap" };
  teacherOpen: { eventId: string; kind: TeacherOwnedKind; ackedAtOpen: boolean } | null;
  christened: { methodId: string; skillId: string; label: string }[];        // label in the child's words, ≤ 6 words
  milestonesFired: string[]; rituals: Record<string, string>;
  callbacks: CallbackCandidate[];                     // already filtered by mode, consent, cooldown, sensitivity
  lastEnd: "child_exit" | "timecap" | "disconnect" | "safeguard" | "completed" | null;
  overlayOn: boolean;                                 // M3 cross-session overlay; false in M1/M2
}
export interface CallbackCandidate { id: string; kind: "L" | "P" | "W"; tags: string[]; fragment: string; cite: { lessonId: string; turnIdx: number[] } }

export interface RelSession {                         // in memory; deleted at lesson end
  safeToBeWrong: number;                              // 0..1 this session only, never persisted
  climate: { uptakeMisses: number; withdrawalTurns: number; selfLabels: number; contests: number; warmthOffers: number;
             permanenceAsks: number; secretAsks: number; contactAsks: number; romance: number; sharesOpen: number; tiredSays: number };
  childRupture: { kind: ChildRuptureKind; openedTurn: number; repair: "open" | "repairing" | "repaired" } | null;
  teacherEvents: { kind: TeacherOwnedKind; turn: number; owned: boolean }[];
  affectTrail: TeacherAffect[];                       // ≤ 3
  callbackUsed: string | null; noticesUsed: string[]; jokes: { turn: number; tag: string }[];
  inSessionFacts: { id: string; fragment: string; turn: number }[];   // e.g. a pet's name said today
  overlayMoves: { pointOut: boolean; callbacksOff: boolean; reminderDue: boolean };
}

export type Display = "delight" | "warm_pride" | "enthusiasm" | "gentle_concern" | "playful" | "calm_curious" | "sheepish_own" | "neutral_warm" | "calm_steady";
/** What caused a display. `correct` is never a cause (TA1): a right answer alone moves no affect. */
export type CauseEvent = "insight" | "christened" | "effort" | "milestone" | "topic_hook" | "share_sad" | "tired" | "withdrawal"
  | "self_label" | "child_joke" | "flip_slip" | "confusion" | "contest" | "teacher_owned_verified" | "release" | "safety" | "none";
export interface TeacherAffect { display: Display; intensity: 1 | 2; cause: CauseEvent; causeFragment?: string; turn: number }
/** What the client face receives (UiDirectives.teacherAffect): display and intensity only, never the cause. */
export interface TeacherAffectUi { display: Display; intensity: 1 | 2 }

export interface RelSignal { kind: string; turn: number; lane: "L" | "G" | "typed" | "chip"; confidence: "lexical" | "both_lanes" }

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
}

/** A parent-visible relational fact, drafted in the turn and written at lesson end (relational_note). */
export interface RelNoteDraft { kind: string; text: string; cite?: { lessonId: string; turnIdx: number[] } }
/** A bond event (rel_event): teacher-owned events, christenings, address changes, milestones, rituals. */
export interface RelEventDraft {
  kind: "teacher_owned" | "christened" | "address" | "milestone" | "ritual" | "stage";
  payload: Record<string, unknown>; turn: number;
}

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
}

/** onLessonEnd's input: the writers it returns land in the end transaction (like the Conductor hooks). */
export interface RelLessonEnd {
  lessonId: string; childId: string; endedBy: "pagehide" | "client" | "safeguard" | "timecap";
  turns: number;
}
