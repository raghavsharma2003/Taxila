// Taxila shared contracts — the seams between client, server and content.
// Server code is plain JS (ESM) and documents these shapes with JSDoc `import("../shared/contracts").X`.
// Change a type here ⇒ update both sides in the same commit.
import type { Moment, TurnStudio, UiBeat } from "./brain.ts";
import type { TeacherAffectUi } from "./relational.ts";
import type { StudioSlot } from "./studio.ts";

// ───────────────────────────── content ─────────────────────────────
export type TopicType = "T1" | "T2" | "T3" | "T4" | "T5"; // verbatim · vocab · concept · procedure · problem-solving
export type FormatFamily = "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8";
export type ItemKind =
  | "practice" | "near_transfer" | "far_transfer" | "predict" | "contrast" | "why"
  | "teachback" | "retrieval" | "error_spot" | "translate_rep";

export interface KitItem {
  id: string; skillId: string; kind: ItemKind; difficulty: 1 | 2 | 3 | 4 | 5;
  prompt_en: string; prompt_hi: string; answer: string; acceptable: string[];
  hints: [string, string, string, string]; targetsMisconception?: string;
  verified?: { solverAnswer: string; agrees: boolean; note?: string };
}
export interface KitMisconception {
  id: string; belief: string; signs: string[];
  /** null when the kit's diagnostic is invalid or cannot be pinned in the prompt budget (server/content/kits.js normalizeKit). */
  diagnostic: { prompt_en: string; prompt_hi: string; options: { text: string; misconceptionId: string | null; correct: boolean }[] } | null;
  remediation: { representation: string; moveShape: string };
}
export interface TopicKit {
  topicId: string; topicType: TopicType;
  skills: { id: string; title: string; prereqSkillIds: string[] }[];
  expectations: string[]; misconceptions: KitMisconception[]; items: KitItem[];
  /** null when the kit ships none (the director then skips the worked-example step). */
  workedExample: { problem: string; steps: string[]; fadedVersion: string[] } | null;
  formats: { primary: FormatFamily; secondary: string[]; engineHints: string[] };
  interestContexts: string[];
  /** false for an on-the-fly mini-kit (model-written keys): its evidence weighs half. Set by the server loader. */
  verified?: boolean;
}

// ───────────────────────────── learner ─────────────────────────────
export type SkillStatus = "unseen" | "introduced" | "practising" | "learned_today" | "mastered" | "due";
export type ProbeId = `P${number}`;
export type EvidenceOutcome = "correct" | "incorrect" | "partial" | "misconception" | "no_evidence";

export interface Evidence {
  skillId: string; itemId?: string; probe: ProbeId; outcome: EvidenceOutcome;
  misconceptionId?: string; hintsUsed: number; weight: number;
}
export interface SkillState {
  skillId: string; pKnown: number; status: SkillStatus; attempts: number; correctUnaided: number;
  generativePass: boolean; delayedPass: boolean; lastSeen: string; nextReview?: string;
}
/** Compact child brief the voice teacher sees (≤600 tokens when rendered). */
export interface ChildBrief {
  firstName: string; classLevel: number; ageBand: "6-9" | "10-15"; languagePref: "hinglish" | "hindi" | "english";
  interests: string[]; recentWins: string[]; activeMisconceptions: string[]; memoryCallbacks: string[];
  vibe: { pace: "slow" | "medium" | "fast"; verbosity: "brief" | "chatty"; humour: "low" | "medium" | "high" };
  relationshipStage: string;
}

// ───────────────────────────── lesson / director ─────────────────────────────
export type MoveKind =
  | "greet" | "retrieval" | "hook" | "explain" | "worked_example" | "probe" | "hint" | "reteach"
  | "show_module" | "practice" | "teachback" | "celebrate" | "break" | "wrap" | "repair" | "safeguard";

export interface Move {
  kind: MoveKind;
  /** Shape note for the teacher (never a script). */
  shape: string;
  itemId?: string; skillId?: string; probe?: ProbeId; hintLevel?: 0 | 1 | 2 | 3 | 4;
  format?: FormatFamily;
}

export type LessonPhase = "warmup" | "teach" | "practice" | "teachback" | "wrap" | "done";

export interface LessonStateSnapshot {
  phase: LessonPhase; topicId: string; turn: number;
  activeItemId?: string; hintLevel: number; itemsDone: string[];
  pendingWhy?: string; lastMove?: Move; minutes: number;
}

/** Child-facing UI hints the Director can send. */
export interface UiDirectives {
  whiteboard?: { kind: "text" | "math" | "image"; value: string };
  chips?: { id: string; label: string }[];          // 2-4 low-stakes choices
  status?: "listening" | "thinking" | "speaking" | "your_turn";
  caption?: string;
  /** The text the child is asked to read aloud right now (voice features measure WCPM against it). */
  readAloud?: string;
  /**
   * Lesson start only (an Ask, purpose "doubt"): the child's first words were handled by the start itself (her opening
   * answers them, or met them with the safeguard move). The client shows them on the question card and does NOT send
   * them again as a turn (W2-C review: the same question was explained twice).
   */
  askConsumed?: boolean;
  /**
   * NEEDS A DIRECTOR PRODUCER (no move sets it yet): the child's effort or insight on the turn just closed,
   * which lets the teacher's face play its one "delighted" beat (src/stage/useDelight). Never correctness:
   * a right answer alone is not "insight". Until the Director sends it, the child UI's delight never fires.
   */
  affect?: "insight" | "effort";
  // ── PRODUCT-DESIGN-V2 §4.10 (server: director/state.js uiFor, routes/lesson.js withAsk / uiVerdictOf) ──
  /**
   * The question as displayed on the Question card, pinned until the item resolves. Set on every turn that hands a
   * kit item to the child (its text in the lesson language, in the child's aap/tum register, ≤ 120 chars); on a
   * text-lane turn with no item, the question the teacher's reply actually handed back. Absent on the voice lane
   * when no item is on the table (the realtime model writes its own words).
   */
  ask?: { text: string; spoken?: string; picture?: string; itemId?: string };
  /** What the turn hands to the child. "chain" (she keeps the floor) is not produced yet: every turn hands back. */
  handover?: "chain" | "answer" | "choice" | "judge" | "ready" | "finish";
  /** How the child is expected to answer: it drives the dock body. */
  answerForm?: "words" | "number" | "choice" | "draw" | "read_aloud" | "tap_in_tray";
  /**
   * W2 integration: the NumberPad also shows a "," key (the item's verified key is written with commas, e.g. Indian
   * grouping "1,07,040"). Without it a digits-only pad cannot enter the answer the item checks for.
   */
  padComma?: boolean;
  /** Only from the verified-key classifier on a kit item. Absent = ungraded (a covert why / teach-back, an unclear reply). */
  verdict?: "correct" | "not_yet" | "partial";
  /** A correct verdict that came after a hint rung (the tick in outline, §4.6 "With help"). */
  withHelp?: boolean;
  /** The phase line (Older) and the geometry decision. */
  phase?: LessonPhase;
  /** What the tray holds this turn: none → Face layout (no empty box, audit #5). */
  tray?: "none" | "module" | "board" | "tiles" | "pad" | "studio";
  /** ≤ 24 chars on a word boundary, for the top bar. Never a syllabus objective (G-OBJ-1). */
  shortTitle?: string;
  /** Demonstration cue → floor SHOWING (not produced yet). */
  cues?: { program?: "demo" | "point"; target?: string };
  // ── W2 seam commit (BUILD-PLAN §4; TEACHER-BRAIN §3.2, RELATIONAL-OS §13, LIVE-STUDIO §10). Not produced yet. ──
  /** The beat this turn belongs to (W2-E). The client's end-of-turn threshold reads `type` (TEACHER-BRAIN §5.4 L1). */
  beat?: UiBeat;
  /** What the Work tray's `studio` kind holds (W2-H); rendered by src/studio/StudioStage.tsx inside the tray. */
  studioSlot?: StudioSlot;
  /** The teacher's face display from RELATIONAL-OS appraise() only (W2-I → W2-D); never keyed to a correct verdict. */
  teacherAffect?: TeacherAffectUi;
  /**
   * Quick practice's counter (W2-A client; producer W2-C, the practice purpose): item `n` of `of` (≤ 5) is on the table;
   * `done` on the turn that closes the set ("That's the set"). Older shows "Practice · n of 5"; Young shows no count.
   * Until W2-C sends it, the client counts the graded items of a practice lesson itself (useDesk practiceCount).
   */
  practice?: { n: number; of: number; done?: boolean };
}

/** The teacher as every surface shows them: the server is the one source (compiler/characters teacherCard). */
export interface TeacherCard {
  /**
   * `name`: the name the child gave the teacher (decision child-names-teacher), else the character's own; pinned for the
   * life of a lesson. `characterName`: the look's own name (Asha, Arjun, Uma), for "Reset to {characterName}".
   */
  id: string; name: string; characterName?: string; addressedAs: string; role: "AI teacher";
  pronouns: { subject: string; object: string; possessive: string };
  voice: string; lookRev: number | null; signatureColor: string | null;
}

/**
 * One Director call. A MODULE-ONLY turn is one with no childText, no chipId, asrConfidence not 0 and at
 * least one moduleEvent: the child acted in an activity and said nothing. It is never graded as a reply
 * (no child turn row, no transcript classification); a module answer on the active item is still machine
 * truth, and goal_met / stuck get a reaction without moving the lesson plan.
 */
export interface TurnRequest {
  lessonId: string;
  childText: string;                 // final transcript of the child's last turn ("" for a module-only turn)
  asrConfidence?: number;            // 0 with childText "" = the child spoke and ASR failed (a child turn, not module-only)
  teacherText?: string;              // voice lane: teacher's finished turn(s) as heard. Text lane omits it (the server wrote and stored them)
  teacherInterrupted?: boolean;      // the child cut that teacher turn off (text lane: the latest stored teacher turn)
  moduleEvents?: ModuleEvent[];      // buffered since the last call
  droppedEvents?: number;            // events the client dropped at its buffer cap since the last call
  chipId?: string;                   // the child tapped a choice chip
  typed?: boolean;                   // no ASR (typed or tapped); does not select the text lane
  voiceFeatures?: VoiceUtterance;    // on-device numeric features of this spoken turn (src/voice/); never audio or text
  /**
   * The outbox's per-lesson key for this answer (src/lesson/outbox.ts). The server dedupes on (lessonId, turnSeq): a
   * resend of a turn that already landed gets that turn's response back (`duplicate: true`) and is never counted twice.
   */
  turnSeq?: number;
  /** A resend (a retry, "Try again", "Send again"); its child row is marked retried. */
  retried?: boolean;
  /**
   * "Fix" on a misheard transcript: the same turnSeq with the corrected words. It REPLACES the earlier attempt when that
   * attempt has not landed yet (the earlier one then loses with 409); after it landed, the landed turn's response
   * comes back with `editLanded: true` (the ledger is append-only, so a landed answer is never counted twice).
   */
  edited?: boolean;
  /**
   * W2-D: the first turn after the lesson moved from the realtime lane to the cascade lane (POST /api/lesson/lane). It has
   * no childText and stores no child row (no evidence). teacherText may carry the realtime turn last heard: the server
   * accepts it ONCE although the lesson is now cascade, stores it and runs the voice-lane checks on it. If the move
   * planned for the child's last answer was never voiced, the cascade voices it on this turn.
   */
  laneResume?: boolean;
  /**
   * The duplex engine's turn summary (docs/research/duplex/INTEGRATION.md §2; server/duplex/slice.js turnSummary). Hashes
   * and flags only, never words. `safetyPending`: the predicate tripped on a PARTIAL of this turn (sticky): the server
   * safeguards even if `childText` now reads clean (OR semantics; safety-robust 2026-10-05).
   */
  duplex?: {
    transcriptHash: string;
    genId?: string | null;
    safetyPending?: { kind: "self_harm" | "abuse" | "fear" | null; source: "predicate" | "model_note" | null } | null;
    superseded?: string[];
    heardUpTo?: { chars: number; words: number; ms: number } | null;
    cutInReason?: "safety" | "word_search_cue" | "off_task_drift" | "question_to_her" | "hold_offer" | null;
    engineSummary?: { engine: string; reasons: string[]; pComplete: number[]; decidedAfterEndMs: number | null } | null;
  };
}
/**
 * One child utterance's voice features, computed on the device (src/voice/tracker.ts UtteranceFeatures).
 * The server validates every key against server/voice/features.js FEATURE_RANGES, stores it, z-scores it
 * against the child's own baseline, and derives capped tie-breaker signals for THIS turn.
 */
export interface VoiceUtterance {
  context: "answer" | "read_aloud";
  itemId?: string;
  asrConf?: number;
  bargeIn: boolean;
  at: number;
  features: { [feature: string]: number | undefined };
}
export interface TurnResponse {
  /**
   * Voice lane only: full compiled instructions → session.update (applied verbatim). They carry the answer
   * key, so the text lane (whose reply the server writes) never receives them.
   */
  instructions?: string;
  move: Move;
  moduleCommands: ModuleCommand[];
  ui: UiDirectives;
  /** Text lane only: the teacher's reply text (no realtime voice), stored as teacher turn `teacherReplySeq`. */
  teacherReply?: string;
  /** Seq of the stored teacher turn holding teacherReply: what /api/tts may speak. */
  teacherReplySeq?: number;
  /**
   * Voice lane: voice these instructions now instead of waiting for the child's next turn.
   * "interrupt": cut the teacher off and speak at once (a safeguarding hand-off is never left to the
   * old instructions); "when_free": speak if nobody holds the floor (a reaction to a module milestone).
   */
  speakNow?: "interrupt" | "when_free";
  end?: boolean;
  /**
   * Pace knobs from the vibe persona (COMPREHENSION-ENGINE.md §6.4): session config for the voice runtime, never
   * prompt text. waitNudgeSec: silence before a gentle nudge; endpointSilenceMs: end-of-speech silence.
   */
  pace?: { waitNudgeSec: number; endpointSilenceMs: number };
  /** This turnSeq had already landed: the response is that turn's, replayed (nothing was stored again). */
  duplicate?: boolean;
  /** An edited resend arrived after the first attempt landed: the landed turn's response, replayed. */
  editLanded?: boolean;
  /**
   * A held answer for a lesson the page-hide beacon closed (src/lesson/api.ts endBeacon): it was stored and graded
   * like any turn, but the lesson stays closed and no teacher reply is written (`end` is true) — EXCEPT a disclosure:
   * then `move.kind` is "safeguard" and `teacherReply` is the fixed safeguarding line with both helplines, and the
   * client raises the Help sheet (runtime.ts flushOthers → LessonState.lateSafeguard) though the lesson stays closed.
   */
  late?: boolean;
  /** W2 seam (W2-E/W2-H): what Studio does on this turn (reveal / highlight / retire / setParam). Absent = nothing. */
  studio?: TurnStudio;
  /** W2 seam (W2-E): the turn's Moment for the voice layer and the face (TEACHER-BRAIN TB6). Absent until BR2. */
  moment?: Moment;
  debug?: Record<string, unknown>;
}

/** GET /api/tutors/name (the parent corner) and POST /api/tutors/name (the picker's naming step, the parent's reset). */
export interface TeacherNameResponse {
  name: string; characterName: string; custom: boolean;
  /** POST only: the card every surface renders from. */
  teacher?: TeacherCard;
  /** GET only: a stored name a later denylist entry retired (the character's own name is in use). */
  retired?: boolean;
  history?: { name: string | null; characterId: string; source: "child" | "parent" | "switch"; at: string }[];
  /** GET only: the look being named and the child's band (the parent row's "Change" opens the same naming step). */
  characterId?: string;
  band?: string;
}
/** 422 from POST /api/tutors/name: a gentle retry. The typed name is never echoed back. */
export interface TeacherNameRefused {
  error: string; reason: "shape" | "own_name" | "not_allowed" | "public_figure"; suggestions: string[];
}

/**
 * "cascade": the default voice lane — spoken child turns (ASR-gated), Director-written replies, streamed TTS.
 * `address`: the child's own aap / tum pick at Hello (honoured from class 5 up); the parent's controls and the class
 * default decide otherwise (server/director/register.js resolveAddress).
 */
export interface LessonStartRequest {
  childId: string; topicId?: string; mode?: "voice" | "text" | "cascade";
  /**
   * What the start is for. The server checks it against /api/child/plan: a "lesson" (the default) starts only in the
   * plan states start | first | resume; "practice" / "doubt" (Practice, Ask) are also allowed when the day is done
   * (V2 §6.3.3: "Practise something"). capped and resting refuse every purpose: 409 LessonStartRefused.
   * The aap/tum register is never a request field: the parent's controls decide it (V2 §3.3 step 4).
   */
  purpose?: "lesson" | "practice" | "doubt";
  /**
   * Ask ("doubt") only: the child's question, sent WITH the start (flows G11), so the server routes the lesson to the
   * matching topic (server/lesson/purpose.js routeAsk) and titles it by the question. ≤ 500 characters are read.
   */
  firstText?: string;
}
/** 409 from POST /api/lesson/start when the plan does not allow a lesson now (daily cap, lesson hours, done). */
export interface LessonStartRefused { error: string; state: ChildHomeState; opensAt: string | null; capRemaining: number }
export interface LessonStartResponse {
  lessonId: string; topic: { id: string; title: string; chapter: string };
  /** Voice lane only (see TurnResponse.instructions). */
  instructions?: string; teacher: TeacherCard;
  /** The register the teacher uses with this child (null: an English lesson). */
  address?: "tum" | "aap" | null;
  moduleCommands: ModuleCommand[]; ui: UiDirectives;
  /** Text lane: the teacher's opening line, stored as teacher turn `teacherOpeningSeq`. */
  teacherOpening?: string; teacherOpeningSeq?: number;
}
/** One "What you did today" card (V2 §6.3.5): the child's own answer, with a tick only if the key verified it. */
export interface DidCard {
  kind: "item" | "teachback";
  /** The question as it was asked (null for a teach-back). */
  ask: string | null;
  /** The child's own words (or the option they tapped). */
  answer: string;
  tick: boolean; withHelp: boolean;
  /** The child turn it came from (evidence row turn_id / the transcript). */
  turnSeq: number | null;
}
/** POST /api/lesson/end `did` and GET /api/lesson/summary?lessonId= `did`. */
export interface LessonSummary {
  title: string | null; shortTitle: string | null; cards: DidCard[];
  /** Only when nothing was verified: how many questions the child tried. */
  tried?: number;
  nextTitle: string | null;
  /** Verdict-neutral (ReactionGate): always "warm". */
  face: "warm";
  teacher?: TeacherCard;
  /** The child turn the teacher re-voices on the summary. */
  revoiceSeq: number | null;
}

// ───────────────────────────── child surfaces (server/routes/child.js) ─────────────────────────────
/** GET /api/child/plan?childId= → the child home's one primary card (V2 §6.3.3). */
export type ChildHomeState = "start" | "first" | "resume" | "done" | "capped" | "resting"
  /** W2-A SF1 (STUDENT-FLOW §4.2): the parent's "Homework help today"; a school test window; the Conductor's safety hold. */
  | "homework" | "test_window" | "safety_hold";
/** One "Made for you" piece (STUDENT-FLOW §9.3), read from W2-H's studio_mount feed; [] until it has data. */
export interface MadeForItem {
  id: string; kind: string; title: string; topicTitle: string | null; at: string;
  /** the still rendered at reveal (an image URL), or null */
  still: string | null;
  /** "Why {T} made this", in plain words from the build record's misconception id (lexicon), never model prose */
  because: string | null;
  /** the child's result in it, for the parent ("On their own" / "With a hint"), never a score */
  result?: "on_own" | "with_hint" | null;
}
export interface ChildPlanResponse {
  state: ChildHomeState;
  /** Legacy shape for src/child/day.ts: start/first/resume → "default", done/capped → "done", resting → "resting". */
  homeState: "default" | "done" | "resting";
  plan: { openLesson: string | null; window: { from: string; to: string } };
  topic: { id: string; title: string; shortTitle: string | null; chapter: string; subject: string; minutes: number } | null;
  /** The open lesson to resume (< 6 h, at least one child turn): its pinned question for the thumbnail. */
  resume: { lessonId: string; ask: string | null; topicTitle: string } | null;
  /** Today's finished lesson (state done/capped). */
  today: { lessonId: string; summary: LessonSummary } | null;
  capRemaining: number | null; capMin: number; usedMin: number;
  /** "resting": when lessons open again (local time, HH:MM). */
  opensAt: string | null;
  packReady: null; day: string; tz: string;
  teacher: TeacherCard;
  /** Surfaces hidden by the parent's "Only this session" choice (learning_profile consent off). */
  surfaces: { map: boolean; notebook: boolean; resume: boolean };
  source: { dayPlan: number | null };
  /** W2-A SF1: today's (done) or recent made-for pieces for the mini-shelf; [] hides it (W2-H fills the feed). */
  madeFor?: MadeForItem[];
  /** W2-A SF1: the Question jar (STUDENT-FLOW §7); null until W3 stores jar items. */
  jar?: { waiting: number } | null;
  /** `test_window`: the school test the parent entered (calm copy, never a countdown). */
  testWindow?: { subject: string; from: string; to: string } | null;
  /** `homework`: the parent's homework help is on until this time; today's lesson stays as the second card. */
  homework?: { until: string } | null;
  /** The parent's per-child "Tap and type only" (Controls): the lesson starts in text mode on any device. */
  textOnly?: boolean;
}
/** Spec state shapes (V2 §4.8): plot/dot → sprout/ring → bloom/star → fruit/ticked star. */
export type MapState = "not_started" | "practising" | "got_it" | "secure";
export interface ChildMapSkill {
  skillId: string; title: string; topicId: string; chapter: string; subject: string;
  /** W2-A (flows G16): the skill in a child's words (the kit title's first clause, ≤ 6 words), for Young labels. */
  label?: string;
  /** Legacy status for src/child/api.ts normaliseSkills. */
  status: SkillStatus;
  state: MapState;
  /** A re-check the server scheduled (weave queue / a missed delayed check): the sunbird / return arrow. Never from time alone. */
  recheckScheduled: boolean;
}
export interface ChildMapResponse {
  mode: "garden" | "sky"; hidden: boolean;
  subjects: { subject: string; book: string; chapters: { id: string; number: number; title: string; sealed: boolean; here: boolean;
    secure: number; total: number; topics: { id: string; title: string; skills: ChildMapSkill[] }[] }[] }[];
  /** Flat list (src/child/api.ts reads `skills`). */
  skills: ChildMapSkill[];
  empty: boolean;
}

/** POST /api/tts: speak a stored teacher turn of the caller's lesson (never free text). */
export interface TtsRequest { lessonId: string; seq: number }
// ───────────────────────────── expressive voice (HUMAN-VOICE §5.3; W2 seam, filled by W2-G) ─────────────────────────────
export type Emotion = "neutral" | "warm" | "amused" | "delighted" | "surprised" | "calm" | "reassuring" | "curious" | "wonder" | "thinking" | "playful" | "proud";
export type NonVerbal = "none" | "breath" | "hum" | "chuckle" | "laugh" | "sigh_relief";
export interface DeliveryClause {
  text: string;                 // exact reply words (plus at most one inserted filler at the start)
  emotion: Emotion; intensity: number;      // 0..1, already capped by band
  pace: "slow" | "normal" | "brisk";
  pauseBeforeMs: number;        // 0 for clause 0, always
  nonverbalBefore: NonVerbal;   // licensed by MomentPlan, allowed by Governor
  emphasis?: string;            // one word of `text`
  filler?: string;              // which inserted word (for the governor and the logs)
}
/** Server-built only (server/voice/expressive/seam.js planDelivery); a client-sent plan is ignored. */
export interface DeliveryPlan {
  v: 1; lang: "hi" | "hinglish" | "en"; register: "normal" | "safety";
  clauses: DeliveryClause[];
  source: "moment" | "annotator" | "plain";     // plain = fail-closed
}
/**
 * The avatar frame in framed TTS v2 (HUMAN-VOICE B4 / HV-11 → W2-D's face): a laugh, breath or hum at `atMs` from the
 * first PCM sample of the reply. NOTE (owner 2026-10-04, voice-clips-off-and-numbers-normalised): no spliced
 * breath/hum clips ship, so today nothing emits these; the frame exists so the face can follow a model-voiced one.
 */
export interface AvatarVoiceEvent { kind: "laugh" | "breath" | "hum"; atMs: number; durMs?: number; clause?: number }

/** `session` is the minted session config WITHOUT its instructions (the secret already carries them). */
export interface RealtimeTokenResponse { token: string; expiresAt: number; base: string; session: Record<string, unknown> }

// ───────────────────────────── modules ─────────────────────────────
export interface EngineDef {
  id: string;                        // e.g. "fraction-bars@1"
  title: string; subjects: string[];
  params: Record<string, { type: "number" | "string" | "boolean" | "array" | "object"; default?: unknown; min?: number; max?: number; enum?: string[]; doc: string }>;
  emits: string[];                   // interaction event names
}
export type ModuleCommand =
  | { op: "mount"; moduleId: string; engine: string; params: Record<string, unknown>; goal?: string }
  | { op: "set_param"; moduleId: string; name: string; value: unknown }
  | { op: "highlight"; moduleId: string; target: string }
  | { op: "reveal"; moduleId: string }
  | { op: "unmount"; moduleId: string };

/** iframe/module → host */
export type ModuleToHost =
  | { type: "ready"; moduleId: string }
  | { type: "interaction"; moduleId: string; name: string; data: Record<string, unknown> }
  | { type: "answer"; moduleId: string; value: unknown; correct?: boolean }
  | { type: "goal_met"; moduleId: string; goal: string }
  | { type: "stuck"; moduleId: string; reason: string }
  | { type: "error"; moduleId: string; message: string };
/** host → iframe/module */
export type HostToModule =
  | { type: "init"; moduleId: string; engine: string; params: Record<string, unknown>; goal?: string; lang: string; ageBand: string }
  | { type: "set_param"; name: string; value: unknown }
  | { type: "highlight"; target: string }
  | { type: "reveal" }
  | { type: "reset" };

export interface ModuleEvent { moduleId: string; engine: string; type: ModuleToHost["type"]; name?: string; data?: unknown; at: number }
