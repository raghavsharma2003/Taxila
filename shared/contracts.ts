// Taxila shared contracts — the seams between client, server and content.
// Server code is plain JS (ESM) and documents these shapes with JSDoc `import("../shared/contracts").X`.
// Change a type here ⇒ update both sides in the same commit.

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
  diagnostic: { prompt_en: string; prompt_hi: string; options: { text: string; misconceptionId: string | null; correct: boolean }[] };
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
}

export interface TurnRequest {
  lessonId: string;
  childText: string;                 // final transcript of the child's last turn ("" if only module events)
  asrConfidence?: number;
  teacherText?: string;              // teacher's last turn transcript (as heard)
  teacherInterrupted?: boolean;
  moduleEvents?: ModuleEvent[];      // debounced since the last call
  chipId?: string;                   // the child tapped a choice chip
  typed?: boolean;                   // text-mode turn (no ASR)
}
export interface TurnResponse {
  instructions: string;              // full compiled instructions → session.update (applied verbatim)
  move: Move;
  moduleCommands: ModuleCommand[];
  ui: UiDirectives;
  /** In text mode the server also returns the teacher's reply text (no realtime voice). */
  teacherReply?: string;
  end?: boolean;
  debug?: Record<string, unknown>;
}

export interface LessonStartRequest { childId: string; topicId?: string; mode?: "voice" | "text" }
export interface LessonStartResponse {
  lessonId: string; topic: { id: string; title: string; chapter: string };
  instructions: string; teacher: { id: string; name: string; voice: string };
  moduleCommands: ModuleCommand[]; ui: UiDirectives; teacherOpening?: string;
}
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
