// core3d@1 · the contract a 3D play engine implements (round 4, stream G1; docs/design/round4/build/games-core/CORE-API.md).
//
// A 3D engine is a VIEW over a round-3 family law (src/play/families/<family>/*.logic.ts). It never owns truth:
//   - the level comes from the law's generator on the server (solver-proven, shortcut-free) and arrives as PlayLevel;
//   - every child decision is a law act dispatched through the PlayController (it records the raw envelope the server
//     replays and grades); the engine only animates what the law answered (moments);
//   - the same FamilyView chrome contract as the 2D views (goal, readouts, DOM controls with stable ids, react, demo), so
//     PlayStage, PlaySession, the voice grammar (core/voice.ts pressesFor), lessonBridge and the signed evidence path are
//     unchanged: the lesson seam does not move;
//   - the 2D view of the same (family, mode) is the BOARD TWIN and the low-tier fallback. The host keeps the controller
//     when it swaps (context loss, frame errors, tier), so the child's acts and the level's state survive: never a blank
//     stage, never a lost act.
//
// Erasable TypeScript only (rs4-erasable-ts). No runtime code here except the closed enums and the pure dress validator,
// which the server imports too (server/play/dress.js).
import type { FamilyId, Lang, Moment, PlayMode } from "../../../../shared/play.ts";
import type { PlayController } from "../../core/controller.ts";
import type { ControlSpec, Readout } from "../../core/viewkit.ts";
import type { PerfSummary, PointerKind } from "../../core/stage.ts";

export const CORE3D_VERSION = "core3d@1" as const;

// ───────────────────────────── engines and tiers ─────────────────────────────

/** The real-game engines (FEASIBILITY.md §4.3). Each renders one or more family laws. */
export const ENGINES = ["antariksh", "khand"] as const;
export type EngineId = (typeof ENGINES)[number];

/**
 * Render tier for play (decided once at mount by detectTier(); the governor only steps DOWN inside a tier).
 *   "3d"      WebGL2, not a known-bad GPU: the full engine (DPR cap 1.5, governed to 1.0)
 *   "3d-lite" WebGL2 on a lite GPU, data saver, or a context lost once this session: DPR 1.0, particles ×0.4, no bloom-like
 *             additive layers beyond the learning objects
 *   "2d"      no WebGL2, a known-bad or software GPU (outside the harness), context lost twice, or play forced plain: the
 *             round-3 Canvas2D view of the same law (the board twin)
 */
export type PlayTier = "3d" | "3d-lite" | "2d";
export interface TierFacts {
  webgl2: boolean;
  /** a context made with failIfMajorPerformanceCaveat failed (software rasteriser or blocklisted driver) */
  majorCaveat: boolean;
  /** UNMASKED_RENDERER_WEBGL when the browser gives it, else "" */
  renderer: string;
  saveData: boolean;
  /** WebGL contexts lost by play this session */
  contextLosses: number;
  /** a harness / dev override: "3d" lets SwiftShader through so the proxy can measure the engine; "2d" forces the twin */
  force?: PlayTier | null;
}
export interface TierBudget {
  /** backing-store pixel ratio cap at mount; the governor steps down from here in 0.25 steps to `dprFloor` */
  dprCap: number; dprFloor: number;
  /** draw calls / triangles per frame the engine must stay under (cert C10 reads renderer.info against these) */
  maxDraws: number; maxTris: number;
  /** particle budget scale 0..1 (engines multiply their pools by it) */
  particles: number;
}
export const TIER_BUDGET: Record<Exclude<PlayTier, "2d">, TierBudget> = {
  "3d": { dprCap: 1.5, dprFloor: 0.75, maxDraws: 80, maxTris: 150_000, particles: 1 },
  "3d-lite": { dprCap: 1, dprFloor: 1, maxDraws: 40, maxTris: 60_000, particles: 0.4 },
};

// ───────────────────────────── the dress (the ONLY thing a model may write) ─────────────────────────────

/** Closed enums. A model fills these through one taxila-fast call with a strict schema; code validates field by field. */
export const DRESS_ENUMS = Object.freeze({
  wrapper: ["beacon-rescue", "mine-sweep", "comet-catch"] as const,
  music: ["calm", "drive", "off"] as const,
  pace: ["steady", "brisk"] as const,
  teacherMove: ["notice", "ghost-first"] as const,
  lang: ["hinglish", "en", "hi"] as const,
});
/** Per-engine themes (art packs). The dress `theme` must be one of the chosen engine's. */
export const ENGINE_THEMES: Record<EngineId, readonly string[]> = {
  antariksh: ["neela-nebula", "laal-grah", "hara-toofan"],
  khand: ["mitti", "barf", "jungle"],
};
export interface Dress {
  theme: string;
  wrapper: (typeof DRESS_ENUMS.wrapper)[number];
  music: (typeof DRESS_ENUMS.music)[number];
  /** "brisk" is honoured ONLY on a skill the ledger calls secure (the Director downgrades it otherwise; never a countdown) */
  pace: (typeof DRESS_ENUMS.pace)[number];
  teacherMove: (typeof DRESS_ENUMS.teacherMove)[number];
  lang: Lang;
}
/** Where each field of the dress the engine wears came from (reported to the harness and the Director's log). */
export type DressSource = "model" | "base" | "rule";
export interface DressedSpec {
  dress: Dress;
  from: Record<keyof Dress, DressSource>;
  /** the parent's wording switch (O-G4): "fire" ("daago") at non-living targets, or "scan"; never from a model */
  verb: "fire" | "scan";
  /** the skill is secure in the ledger: the only state in which `pace: "brisk"` may take effect */
  secure: boolean;
  /** music may sound at all (class 4-5 default off until the child turns it on, O-G2) */
  musicAllowed: boolean;
  /** the bed the dress chose before the class rule (what plays if the child turns music on); "off" = no toggle */
  musicMood: "calm" | "drive" | "off";
}

// ───────────────────────────── what the core gives an engine ─────────────────────────────

/** A point in the box, CSS px from the box's top-left (the same space as pointer input and the audit). */
export interface BoxPoint { x: number; y: number; /** in front of the camera and inside the box */ visible: boolean }
export interface Vec3 { x: number; y: number; z: number }

/**
 * A DOM label over the WebGL canvas (crisp text at any DPR, real fonts, Devanagari shaping, screen-reader text). The core
 * positions every live label after each render from its anchor, on a backing pill (O-G1: labels sit on pills over any
 * scenery), and records its computed size and rect in the audit, so C4 (text ≥ 14 / 16 px, numerals ≥ 18, nothing clipped,
 * nothing outside the box) is measured on what the child sees, never assumed.
 */
export interface LabelSpec {
  id: string;
  /** plain text only (never HTML); a fraction "2/3" may be drawn stacked with `frac: true` */
  text: string;
  /** BCP-47: "hi-Latn" for Hinglish, "hi" (Devanagari, Mukta), "en" */
  lang: string;
  /** font size in CSS px; the core clamps it UP to the floor for its kind (numeral 18, text 14, young text 16) */
  size: number;
  kind: "numeral" | "text";
  /** world anchor (projected each frame) or a fixed box point */
  at: Vec3 | { box: { x: number; y: number } };
  /** pixel offset after projection, and which point of the label sits on the anchor */
  dx?: number; dy?: number; align?: "center" | "top" | "bottom";
  role?: "ink" | "you" | "good" | "look" | "q1" | "q2";
  frac?: boolean;
  hidden?: boolean;
  /** clamp the label horizontally into the box (its text stays whole; it may sit a little off its anchor at an edge) */
  keepInBox?: boolean;
}
export interface LabelHandle { set(patch: Partial<Omit<LabelSpec, "id">>): void; remove(): void }

/** The audio bus (procedural WebAudio; no files, no network). One bus per stage. */
export interface AudioBus {
  /** a short SFX for an act or a law answer (≤ 400 ms); `x` 0..1 pans/pitches with position */
  sfx(ev: Sfx, o?: { x?: number; c?: number }): void;
  /** an engine bed that follows speed (0..1); silent when muted */
  hum(level: number): void;
  /** the adaptive music bed (O-G2): plays only when the dress allows it and the child has it on; hard-ducks to 0 within
   *  120 ms whenever the teacher speaks (`duck(true)`), SFX duck to 35% */
  music(mood: "calm" | "drive" | "off"): void;
  duck(on: boolean): void;
  readonly muted: boolean;
}
export type Sfx = "aim" | "fire" | "scan" | "reveal" | "hit" | "miss" | "near" | "gate" | "warp" | "select" | "undo" | "land" | "good" | "look";

/** The frame-time governor's read-out (also the C10 instrument). */
export interface Perf3D extends PerfSummary {
  /** our JS per frame (simulation + label placement + render submission), ms */
  workP50: number; workP95: number;
  draws: number; tris: number; textures: number; geometries: number;
  tier: PlayTier;
  /** particle scale after governing (0..1) */
  particles: number;
}

/**
 * The progress store: the ONLY place an engine may keep state that changes what the child is asked next or what counts as
 * done (the current target, which targets are cleared, the phase that gates a decision). Every write names its cause: the
 * act (its seq in ctl.acts) or the law moment that justified it. The runtime economy lint (tests/r4-games-core-economy*)
 * replays a level and fails on a write whose cause is not an act or a moment of that level, and on any write after the
 * level is done. Cosmetic state (camera, particles, stars, idle spin) lives in the engine's own variables and never here.
 */
export interface ProgressStore {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown, cause: { act: number } | { moment: Moment["kind"]; seq: number } | { level: "start" }): void;
  /** the trace (key, cause) for the lint and the harness */
  trace(): { key: string; cause: string }[];
}

/**
 * What core3d hands an engine at mount (stage3d.ts implements it). The engine imports three itself (tree-shaken); the core
 * owns the renderer, the canvas at the REAL box (1 layout px = 1 CSS px, backing store at the governed DPR), the frame loop,
 * the label layer, the audit, the governor, context loss, input normalisation and the audio bus.
 */
export interface Core3D {
  readonly box: { w: number; h: number };
  readonly dpr: number;
  readonly tier: PlayTier;
  readonly budget: TierBudget;
  /** prefers-reduced-motion or the host's prop: no shake, no particles, no FOV kick; warps are cuts; idle motion stops */
  readonly reduced: boolean;
  readonly young: boolean;
  /** seconds since mount (scaled by hit-stop); never a wall clock, never an input to progress */
  readonly t: number;
  /** the three.js renderer / scene / camera the core renders each frame (typed as unknown here so the shared contract does
   *  not pull three's types into the server; engines cast to THREE types) */
  readonly renderer: unknown;
  readonly scene: unknown;
  camera: unknown;
  /** world ↔ box: project a world point to CSS px in the box; unproject a box point onto the plane z = `planeZ` */
  project(p: Vec3): BoxPoint;
  unproject(x: number, y: number, planeZ: number): Vec3 | null;
  /** world units per CSS px at depth `z` on the current camera (the layout solve's one primitive) */
  worldPerPx(z: number): number;
  label(spec: LabelSpec): LabelHandle;
  /** the label palette of the engine's theme (art-pack colours as numbers, 0xRRGGBB): applied to every label's pill and
   *  roles as CSS variables, so colours live with the theme, never as literals in CSS */
  labelColors(c: { ink: number; you: number; good: number; look: number; q1: number; q2: number; pill: number; pillAlpha: number }): void;
  /** a touch region for this frame, CSS px (drag-anywhere engines register the whole world once per layout) */
  target(id: string, x: number, y: number, w: number, h: number): void;
  audio: AudioBus;
  /** juice within the J1 limits (core enforces: hit-stop ≤ 80 ms, shake ≤ 6 px equivalent, flash ≤ 0.12 alpha) */
  hitstop(ms: number): void;
  shake(px: number): void;
  /** a seeded RNG for COSMETICS ONLY (stars, rocks, particles); the economy lint forbids it in progress code */
  cosmeticRandom(): number;
  progress: ProgressStore;
  /** a frame is needed (input changed something while idle); the core renders continuously while `busy()` is true */
  invalidate(): void;
  /** the engine cannot continue: the host swaps to the board twin with the same controller */
  fail(why: string): void;
}

/** What an engine returns: the FamilyView chrome contract minus Canvas2D drawing (the core renders the scene). */
export interface EngineView {
  /** lay the world out for this box (called at mount and on every resize; never draw a fixed world scaled down) */
  layout(box: { w: number; h: number }): void;
  /** per-frame simulation; dt in seconds, already hit-stop scaled */
  update(dt: number): void;
  /** pointer in CSS px inside the box (one active pointer: the child's finger) */
  pointer(kind: PointerKind, x: number, y: number): void;
  /** keyboard: arrows nudge, space / enter commit (the same acts the controls make) */
  key?(key: string): void;
  busy(): boolean;
  goal(): string;
  readouts(): Readout[];
  /** stable ids the voice grammar knows: commit, nudge-left, nudge-right, undo, round-<n>, order-<i>, order-same. A control
   *  with `voiceOnly` is not drawn as a button (the spatial act is the primary one) but stays reachable by voice and keys */
  controls(): (ControlSpec & { voiceOnly?: boolean })[];
  react(ms: Moment[], refused: string | undefined): void;
  /** the teacher's ghost demonstration (teacherMove "ghost-first"): one legal non-graded move animated, then handed back */
  demo?(): void;
  /** the teacher started / stopped speaking (captions and the lesson's TTS): duck, hold any reveal sweep */
  speaking?(on: boolean): void;
  /** the server's two doors after a level (garam / teekha). An engine that draws them in the world (warp gates the child
   *  steers into) returns true and calls `choose` on the child's commit; false = the host draws its DOM doors */
  doors?(doors: { door: "garam" | "teekha"; hint: string }[] | null, choose: (door: "garam" | "teekha") => void): boolean;
  /** the next level in the SAME world (the warp): a new level and a new controller, no remount. Absent = remount */
  relevel?(deps: EngineDeps): void;
  /** a validated dress that arrived after mount (the delta, ≤ 1.9 s): applied only if the child has not acted yet;
   *  returns false when refused (the base dress stays for this level) */
  redress?(spec: DressedSpec): boolean;
  dispose(): void;
}

export interface EngineDeps<P = unknown, S = unknown> {
  level: import("../../../../shared/play.ts").PlayLevel<P>;
  ctl: PlayController<P, S>;
  lang: Lang;
  spec: DressedSpec;
  /** ask the host to re-render its DOM chrome (goal, readouts, controls) */
  changed(): void;
}

/** A registered engine (engines/registry.ts). `load` is a dynamic import so each engine is its own chunk. */
export interface EngineEntry {
  id: EngineId;
  /** which (family, mode) pairs it renders, and for which goals (absent = every goal of that mode) */
  renders: { family: FamilyId; mode: PlayMode; goals?: readonly string[] }[];
  load(): Promise<{ create(core: Core3D, deps: EngineDeps): EngineView }>;
}

// ───────────────────────────── the dress validator (pure; client and server) ─────────────────────────────

const isOneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === "string" && (list as readonly string[]).includes(v);

/**
 * PURE. The model's delta → the fields that are valid, field by field. A value outside its enum is DROPPED, never repaired
 * (no case folding, no nearest match, no trimming). Unknown keys are ignored. Never throws.
 */
export function validateDelta(engine: EngineId, raw: unknown): Partial<Dress> {
  const out: Partial<Dress> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const r = raw as Record<string, unknown>;
  if (isOneOf(r.theme, ENGINE_THEMES[engine])) out.theme = r.theme;
  if (isOneOf(r.wrapper, DRESS_ENUMS.wrapper)) out.wrapper = r.wrapper;
  if (isOneOf(r.music, DRESS_ENUMS.music)) out.music = r.music;
  if (isOneOf(r.pace, DRESS_ENUMS.pace)) out.pace = r.pace;
  if (isOneOf(r.teacherMove, DRESS_ENUMS.teacherMove)) out.teacherMove = r.teacherMove;
  if (isOneOf(r.lang, DRESS_ENUMS.lang)) out.lang = r.lang;
  return out;
}

export interface DressRules {
  engine: EngineId;
  base: Dress;
  /** the validated model delta, or null (late, invalid, quota, off) */
  delta: Partial<Dress> | null;
  classLevel: number;
  secure: boolean;
  /** the child turned music on themselves (a per-device preference, not a counter) */
  childMusicOn: boolean;
  /** the lesson language is authoritative: a delta may not change it */
  lessonLang: Lang;
  verb: "fire" | "scan";
}
/**
 * PURE. Base dress + validated delta + the rules that no model can override:
 *   - the language is the lesson's (a delta's `lang` is honoured only when it agrees);
 *   - `brisk` only on a secure skill;
 *   - music off for classes 4-5 unless the child turned it on (O-G2);
 *   - the theme is never the one the base rotation ruled out (the base already avoids the last theme; a delta repeating
 *     the last theme is allowed only if it equals the base).
 */
export function dressFor(r: DressRules): DressedSpec {
  const from = { theme: "base", wrapper: "base", music: "base", pace: "base", teacherMove: "base", lang: "base" } as Record<keyof Dress, DressSource>;
  const d: Dress = { ...r.base };
  for (const k of Object.keys(r.delta ?? {}) as (keyof Dress)[]) {
    const v = (r.delta as Partial<Dress>)[k];
    if (v === undefined) continue;
    (d as unknown as Record<string, unknown>)[k] = v; from[k] = "model";
  }
  if (d.lang !== r.lessonLang) { d.lang = r.lessonLang; from.lang = "rule"; }
  if (d.pace === "brisk" && !r.secure) { d.pace = "steady"; from.pace = "rule"; }
  const musicAllowed = r.classLevel >= 6 || r.childMusicOn;
  const musicMood = d.music;
  if (!musicAllowed && d.music !== "off") { d.music = "off"; from.music = "rule"; }
  return { dress: d, from, verb: r.verb, secure: r.secure, musicAllowed, musicMood };
}
