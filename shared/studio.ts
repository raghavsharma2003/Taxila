// Live Studio contracts (LIVE-STUDIO §3.1, §10) plus the whiteboard slot (owner 2026-10-04,
// whiteboard-by-drawing-script-2026-10-04). W2 seam commit (BUILD-PLAN §4): TYPES ONLY. OWNED BY W2-H.
//
// Who fills what:
//   - W2-H: server/studio/{store,library,grade,seam}.js, SSE /api/studio/stream, src/studio/** (stage, frame, veil);
//   - W2-F: router, planner, builders, gate, archetypes (incl. the whiteboard archetype's drawing-script planner);
//   - W2-B: the artifact renderers (the whiteboard renderer, explainer@1, scene@1 diagrams), registered in
//     src/studio/renderers.ts;
//   - W2-E: the beat/turn that asks for a piece and reveals it (TurnStudio in shared/brain.ts).
//
// Every artifact renders INSIDE the StudioStage box (src/studio/StudioStage.tsx): a fixed, aspect-fitted box inside
// the Work tray. An artifact declares its design size (`StageSize`) and draws in those units; the stage scales it to fit
// at 360x800 through desktop and clips anything outside it. Nothing a build or a script does may change the tray's size.
import type { Band4 } from "./bands.ts";
import type { BeatType, TurnStudio } from "./brain.ts";

// ───────────────────────────── intent (§3.1) ─────────────────────────────
/** What Studio can make. `whiteboard` is a timed drawing script rendered by our own code (never a code bundle). */
export type StudioKind = "game" | "simulation" | "explorable" | "animation" | "diagram" | "chart" | "image" | "minisite" | "whiteboard";
export type StudioLang = "hi" | "en" | "hinglish";
export interface StudioIntent {
  intentId: string; lessonId: string;              // never the child id in anything sent to a model
  kind: StudioKind; skillId: string; itemIds?: string[];   // kit items the piece must use (truth)
  need: "introduce" | "contrast_misconception" | "practice" | "probe" | "explore_question" | "celebrate_mastery" | "explain";
  misconceptionId?: string;                        // from the kit's diagnostic catalogue, never free text
  beat: BeatType;                                  // TEACHER-BRAIN shared/brain.ts (incl. contrast, practice_set, explore_question)
  neededAtMs: number;                              // Brain's estimate of when it will reach for it (lesson clock)
  priority: "on_cue" | "opportunistic";
  style: { band: Band4; lang: StudioLang; interest?: string /* from an allowlist */;
           representation?: "concrete" | "pictorial" | "symbolic"; motion: "calm" | "lively" };
  childQuestion?: { normalised: string };          // only via the brain's paraphrase, PII-scrubbed; see §5.4
}

// ───────────────────────────── plan, status, facts, records (§10) ─────────────────────────────
export interface BuildPlan {
  planId: string; intentId: string; archetype: string; kind: StudioKind; skeleton: string;
  params: Record<string, unknown>;                    // from the kit, zod-validated against the archetype
  strings: Record<string, string>;                    // Q8-passed; may contain {child} slot only via host
  craft: { mood: "warm" | "cool" | "earthy" | "night"; motion: "calm" | "lively"; interest?: string };
  teacherCue: string;                                 // telegraphic, for the Brain only
  seam: Record<string, string>; checks: string[]; budgets: { bytes: number; ms: number };
}
export type StudioFallback = "skeleton" | "engine" | "template" | "board" | "voice";
export type StudioStatus =
  | { state: "planning" | "skeleton_shown"; intentId: string }
  | { state: "building"; intentId: string; etaMs: number }
  | { state: "ready" | "revealed" | "in_use"; intentId: string; buildSha: string; facts: StudioFacts }
  | { state: "failed"; intentId: string; fallback: StudioFallback };
export type StudioState = StudioStatus["state"];
/** The one facts shape the Brain reads for whatever is on screen (shared with W2-B's moduleFacts): values, never prose. */
export interface StudioFacts { kind: StudioKind; archetype: string; onScreen: Record<string, string | number>; step?: number; itemId?: string }
export interface BuildRecord {
  buildSha: string; identity: string; planId: string; builder: { dep: string; effort?: string };
  timings: { ttftMs: number; firstPaintMs?: number; genMs: number; qaMs: number; repairs: number; toPlayableMs: number };
  usage: { in: number; cached: number; out: number }; usd: number;
  gate: { pass: boolean; checks: { id: string; pass: boolean; detail?: unknown }[] };
  status: "live_passed" | "transfer_passed" | "promoted" | "retired" | "failed";
}
// client ← server (SSE /api/studio/stream)
export type StudioWire =
  | { t: "skeleton"; intentId: string; skeleton: string; params: Record<string, unknown>; strings: Record<string, string>; stage?: StageSize }
  | { t: "partial"; intentId: string; html: string }          // guarded, markup-only, pre-ready
  | { t: "status"; status: StudioStatus }
  | { t: "ready"; intentId: string; src: string; sha256: string; stage?: StageSize }
  | { t: "script"; intentId: string; script: WhiteboardScript };   // a whiteboard script (or its next chunk)

/** The seam's per-turn view for the Brain (server/studio/seam.js statusFacts): what is on screen, in values. */
export interface StudioTurnView {
  statuses: StudioStatus[];
  /** Facts of the revealed / in-use piece only: the reply may refer to nothing else (screenHasTargets). */
  onScreen: StudioFacts | null;
  /** Facts of the piece Studio proposes to reveal this turn (if the kernel accepts the reveal, the reply is grounded in these). */
  revealing?: StudioFacts;
  /**
   * What Studio proposes for this turn (reveal a `ready` piece on the teacher's cue, retire one at a beat exit). Until
   * W2-E's kernel arbitrates proposals (BR1) the call site applies it as is (never on a safeguarding turn); from BR1 it is
   * a `Proposal` with source "studio" and the kernel may reject it.
   */
  propose?: TurnStudio;
  /** How the child is doing on the piece on screen, from the HOST's grades (never the frame's). */
  outcome?: { lastVerdict: "right" | "wrong" | null; wrongCount: number; complete: boolean };
  /**
   * Studio's advice to the Director from that outcome: "reteach" after ≥ 2 wrong answers, "advance" once the piece is
   * finished. Advisory: the kernel weighs it from W2-E's BR2b; until then it reaches the reply as facts-row values.
   */
  suggest?: "reteach" | "advance";
}

// ───────────────────────────── the stage (owner priority 4) ─────────────────────────────
/** An artifact's design size in its own units (e.g. 400 x 300). The stage aspect-fits it; it never grows the tray. */
export interface StageSize { w: number; h: number }
/** The default design size every artifact gets unless it declares one: 4:3, which fits a 360 dp phone tray. */
export const STAGE_DEFAULT: StageSize = { w: 400, h: 300 };

/**
 * What the Work tray's `studio` kind holds this turn (UiDirectives.studioSlot). One piece at a time (LIVE-STUDIO §4.1).
 * `state` is the STUDENT-FLOW §5.3 tray state; `fallback_shown` is the client-side name for a failed build whose
 * skeleton (or rung) now IS the activity.
 */
export interface StudioSlot {
  slotId: string;
  intentId?: string;
  state: StudioState | "fallback_shown";
  artifact?: StudioArtifact;
}

/** Anything the StudioStage can render. Each kind is drawn by a renderer registered in src/studio/renderers.ts. */
export type StudioArtifact =
  | { kind: "whiteboard"; stage?: StageSize; script: WhiteboardScript }
  /** A gate-passed build (W2-H): `src` returns {sha256, fragment}; the host re-hashes the fragment and mounts it with the
   *  studio-kit@1 runtime under a hash-only CSP in an opaque-origin frame. `params` never hold host-only truth. */
  | { kind: "frame"; stage?: StageSize; studioKind: Exclude<StudioKind, "whiteboard" | "image">; src: string; sha256: string; params?: Record<string, unknown>;
      archetype?: string; intentId?: string; strings?: Record<string, string>; skeleton?: string }
  /** The code skeleton (LIVE-STUDIO D1 §3.4): correct by construction; interactive and host-graded when it is the activity. */
  | { kind: "skeleton"; stage?: StageSize; skeleton: string; params: Record<string, unknown>; strings: Record<string, string>; archetype?: string; intentId?: string }
  | { kind: "image"; stage?: StageSize; src: string; alt: string };
export type StudioArtifactKind = StudioArtifact["kind"];

// ───────────────────────────── the whiteboard (drawing script) ─────────────────────────────
// A model writes the SCRIPT (what to draw, where, when); our code draws it (hand-drawn strokes, shapes, labels,
// arrows, number work) in sync with the teacher's spoken line. Computer-use agents are rejected for live drawing
// (whiteboard-by-drawing-script-2026-10-04). Rules the renderer and the gate rely on:
//   - coordinates are in the script's `board` units (origin top-left, y down); nothing may be drawn outside it;
//   - times are ms relative to the START OF THE SPOKEN LINE's first audio sample (`anchor`), so the drawing follows
//     her voice whatever the lane latency; a clause anchor (HUMAN-VOICE DeliveryClause index) refines it when the
//     DeliveryPlan is known;
//   - every number and label drawn must come from kit truth or the reply's own tokens (the gate checks
//     drawn tokens ⊆ reply tokens ∪ kit values), never invented by the drawing model;
//   - text is never sentence-shaped narration: labels, numbers and short terms only (≤ 24 chars per text op);
//   - reduced motion: the renderer shows each op complete at its startMs (no stroke animation).
export type WbPoint = [number, number];
export type WbInk = "chalk" | "accent" | "ink" | "mark" | "good" | "soft";
export interface WbBase {
  /** Unique within the script; later ops may target it (highlight / erase / label leader). */
  id: string;
  /** Draw starts / completes (ms from the anchor). endMs ≥ startMs; equal = appears at once. */
  startMs: number; endMs: number;
  /** Refines the timing to a DeliveryPlan clause: startMs/endMs are then relative to that clause's onset. */
  clause?: number;
  ink?: WbInk; weight?: 1 | 2 | 3;
}
export type WbOp =
  | (WbBase & { op: "stroke"; points: WbPoint[] })                                         // freehand polyline, drawn along its length
  | (WbBase & { op: "line"; from: WbPoint; to: WbPoint; dashed?: boolean })
  | (WbBase & { op: "arrow"; from: WbPoint; to: WbPoint; bend?: number; head?: "end" | "both" })
  | (WbBase & { op: "rect"; at: WbPoint; w: number; h: number; fill?: WbInk; round?: number })
  | (WbBase & { op: "circle"; c: WbPoint; r: number; fill?: WbInk })
  | (WbBase & { op: "ellipse"; c: WbPoint; rx: number; ry: number; fill?: WbInk })
  | (WbBase & { op: "polygon"; points: WbPoint[]; fill?: WbInk })
  /** A pie / fraction slice: degrees clockwise from 12 o'clock. */
  | (WbBase & { op: "sector"; c: WbPoint; r: number; fromDeg: number; toDeg: number; fill?: WbInk })
  | (WbBase & { op: "text"; at: WbPoint; text: string; size: "s" | "m" | "l"; align?: "start" | "middle" | "end" })
  /** A label with a leader line to a point (or to another op's centre via `target`). */
  | (WbBase & { op: "label"; at: WbPoint; text: string; to?: WbPoint; target?: string })
  /** Number work laid out by code: column sums, fractions, equations, a number line. Cells are tokens, not prose. */
  | (WbBase & { op: "numwork"; at: WbPoint; layout: "column_add" | "column_sub" | "column_mul" | "long_div" | "fraction" | "equation" | "number_line";
      rows: string[][]; marks?: { row: number; col: number; kind: "carry" | "borrow" | "circle" | "tick" }[]; range?: [number, number] })
  /** Draw attention to an earlier op (circle, underline, pulse) without redrawing it. */
  | (WbBase & { op: "highlight"; target: string; style: "circle" | "underline" | "pulse" })
  | (WbBase & { op: "erase"; target: string });
export type WbOpKind = WbOp["op"];
export interface WhiteboardScript {
  v: 1;
  scriptId: string;
  /** The spoken line it accompanies: the lesson and the stored teacher turn seq (when known). */
  line: { lessonId: string; teacherReplySeq?: number };
  anchor: "line_audio_start";
  board: StageSize & { ground: "chalk" | "paper" | "grid" };
  /** "fresh" clears the board; "continue" draws on the previous script's board (a worked example across turns). */
  mode: "fresh" | "continue";
  durationMs: number;
  ops: WbOp[];
  /** The values on the board, for the teacher's facts row (the Brain reads the screen as values). */
  facts?: StudioFacts;
}
/** Bounds the renderer and the gate enforce (documented here so W2-B/F/H agree; enforced in code by the owners). */
export const WHITEBOARD_LIMITS = Object.freeze({ maxOps: 120, maxPointsPerStroke: 240, maxTextChars: 24, maxDurationMs: 60_000, minBoard: 100, maxBoard: 2000 });

// ───────────────────────────── the Studio routes (W2-H, server/routes/studio.js) ─────────────────────────────
/** POST /api/studio/answer → the HOST's grade (the frame's own `correct` is never read). */
export interface StudioAnswerResponse {
  correct: boolean; complete: boolean; itemId?: string; evidence?: boolean;
  /** The item was already closed (a remounted activity answered it again): right, and no second evidence row. */
  alreadyClosed?: boolean;
  /** Wrong answers on this item so far (the host's count). */
  wrongTries?: number;
}
/** POST /api/studio/answer body. `itemId` names the item a skeleton shows; `mount` is the stage's mount key (a remount
 *  restarts the host's bookkeeping with the activity on the child's screen). */
export interface StudioAnswerRequest { lessonId: string; intentId: string; value: unknown; itemId?: string; mount?: string }
/** Why a frame could not run (POST /api/studio/frame-error). Only csp / runtime / navigated count against the build. */
export type StudioFrameErrorReason = "csp" | "runtime" | "navigated" | "not_ready" | "unavailable" | "bytes";
/** POST /api/studio/feedback actions (STUDENT-FLOW §5.3): replay / reset, or retire it (that archetype is excluded for a week). */
export type StudioFeedbackAction = "again" | "not_this";
/** GET /api/studio/made-for → one card per revealed piece, newest first (STUDENT-FLOW §9.3; W2-A renders the shelf). */
export interface MadeForCard {
  id: string; lessonId: string; intentId: string; kind: StudioKind; archetype: string; title: string; topicId: string | null; skillId: string | null;
  misconceptionId: string | null; need: StudioIntent["need"] | null; at: string; completed: boolean;
  /** What "Play again" mounts (a library build or the skeleton), graded by the host. */
  replay: StudioArtifact | null;
}
