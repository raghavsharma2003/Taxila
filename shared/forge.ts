// Forge seams, G1 subset (FACTORY.md §13 is the full v1 contract; the G2/G3 types land with their milestones).
// Server code (server/forge/*.js) documents these shapes with JSDoc `import("../../shared/forge").X`.
import type { ModuleCommand, MoveKind } from "./contracts";

export type Band = "B1" | "B2" | "B3" | "B4";
export type InterestId = "cricket" | "football" | "food" | "animals" | "vehicles" | "films_music" | "festivals" | "space" | "trains"
  | "drawing" | "stories" | "building" | "nature" | "generic";
export type ForgeTier = "L0" | "G1" | "G2" | "G3";
/** What a G1 fill renders on: a T1 engine (params) or a T2a scene@1 template. */
export type G1Renderer = "fraction-bars@1" | "scene@1";
export type G1Template = "choice-card@1" | "sequence-steps@1";

/** How gradeEvent (server/forge/grade.js) turns a module event into a value comparable with the key. Built from the
 *  gated payload; server-side only. */
export type GradeBinding =
  | { engine: "fraction-bars@1"; moduleId: string; goal: string; mode: "shade" }
  | { engine: "fraction-bars@1"; moduleId: string; goal: string; mode: "compare"; question: "bigger" | "smaller"; fractions: string[] }
  | { engine: "scene@1"; moduleId: string; goal: string; template: "choice-card@1"; probeId: string; var: string; correctId: string;
      options: Record<string, { value: string; misc: string | null }> }
  | { engine: "scene@1"; moduleId: string; goal: string; template: "sequence-steps@1"; probeId: string; orderNode: string; correctOrder: string[] };

/** Server-side only: what the host/classify grades the activity against (never sent to the client). */
export interface GradeEntry {
  key: string; acceptable: string[];
  distractors: { value: string; misc: string /* kit misconception id | "other" */ }[];
  keyBasis: "kitmath" | "kit_answer" | "kit_diagnostic";
  /** scene@1 trap token (MC.*) → kit misconception id. */
  miscMap?: Record<string, string>;
  binding: GradeBinding;
}

/** The value the scene@1 renderer reports on commit (src/modules/frame/scene/scene.tsx): ModuleToHost
 *  { type: "answer", value: SceneCommitValue, correct }. gradeEvent reads vars / order only; `correct` and `misc`
 *  are the renderer's claims and are never trusted. */
export interface SceneCommitValue {
  kind: "sc.commit"; probe: string; probe_kind?: string; via?: string;
  vars: Record<string, unknown>; order?: Record<string, string[]>; placed?: Record<string, string | null>;
  misc?: string; attempt?: number; changes?: number;
}

/** What gradeEvent returns for an event that is evidence (null otherwise). */
export interface G1Evidence {
  outcome: "correct" | "incorrect" | "misconception"; misconceptionId?: string; value: string;
  source: "forge_g1"; via: "goal_met" | "compare" | "choice" | "order";
}

/** Moves the planner fills (server/forge/planner.js FILL_MOVES); any other move is a "move_excludes_module" gap. */
export type G1FillMove = "practice" | "probe" | "retrieval" | "remediate" | "homework" | "show_module" | "reteach"
  | "explain" | "worked_example" | "hint";

/** The learner snapshot G1 personalises from (server/forge/learner-view.js). */
export interface G1Learner {
  child: { firstName: string; classLevel: number; languagePref: string; interests: string[] } | null;
  recentWrong: string[]; activeMisconceptions: string[]; pKnown: Record<string, number>;
}

/** The Director's call: one per item that wants an activity. childId comes from the lesson, never a client body. */
export interface G1FillRequest {
  lessonId?: string; childId?: string; topicId?: string; itemId?: string;
  /** The kit and item the Director already holds (preferred over topicId / itemId lookups). */
  kit?: unknown; item?: unknown;
  move?: G1FillMove | MoveKind | { kind: string }; needByMs?: number;
  /** Per-lesson snapshot; omitted → the per-lesson memo (primeLearner / prefetchLessonFills), then a bounded read. */
  learner?: G1Learner;
  /** Override the frame's mountable renderers (evals, tests). */
  renderers?: Set<string>;
  trace?: unknown[];
  /** Do not write a forge_gap demand row (prefetch: demand counts only items a lesson reaches). */
  noGapRow?: boolean;
}

export interface G1FillResult {
  status: "ready" | "gap";
  tier?: "T1" | "T2a"; renderer?: G1Renderer; template?: G1Template | null;
  fillKey?: string; cached?: "memory" | "db" | null;
  /** Mount exactly this (params are the renderer's own params; the item binding rides in `goal` = "g1:<itemId>"). */
  command?: Extract<ModuleCommand, { op: "mount" }>;
  /** A private copy: grade module events with gradeEvent(grade, ev). */
  grade?: GradeEntry;
  ui?: { caption?: string };
  plan?: { primary: string | null; fallbacks: string[]; reasons: string[] };
  gate?: { ok: boolean; version: string; ms: number; bytes: number };
  flavour?: { by: "model" | "code"; ms: number; error?: string; modelRejected?: boolean };
  /** Activities (or flavours) the gate or the child-name check rejected before this one shipped. */
  rejectedBeforeShip?: { activity: string | null; failures: string[]; flavour?: string }[];
  /** gap: why the gate rejected every eligible activity. */
  gateFailures?: { activity: string | null; failures: string[]; flavour?: string }[];
  /** gap: why derivation rejected each activity family (derive.js). */
  rejects?: string[];
  /** gap: no kit for the topic. */
  reasons?: string[];
  timings?: Record<string, number>;
  renderable?: boolean; blobUrl?: string | null;
}

/** POST /api/forge/requests response (the client-safe view: no grade). Consumer: dev pages only today. */
export interface ForgeRequestResponse {
  requestId: string; status: G1FillResult["status"]; tier: G1FillResult["tier"] | null;
  renderer: G1Renderer | null; template: G1Template | null;
  command: G1FillResult["command"] | null; ui: { caption?: string };
  plan: G1FillResult["plan"] | null; cached: G1FillResult["cached"]; timings?: Record<string, number>;
}
