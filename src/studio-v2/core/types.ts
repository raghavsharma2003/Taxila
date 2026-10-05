// The seam between the Studio v2 host and an archetype engine. Engines are thin: they get an EngineApi from the host
// and return an EngineInstance. Everything the model never writes (fit, loop guard, fallback, grading, juice) is host.
import type { Graded } from "../../../shared/studio-spec.ts";
import type { Ctx, TextOpts } from "./draw.ts";
import type { FX } from "./fx.ts";
import type { Tweens } from "./tween.ts";
import type { BoardSpec } from "./board.ts";

export interface Pointer { x: number; y: number; down: boolean; type: string; id: number }
export interface PointerHandlers { down?(p: Pointer): void; move?(p: Pointer): void; up?(p: Pointer): void }
export type XY = [number, number];
/** The QA bot's next real-pointer action, in world units (LIVE-STUDIO G5 pattern: a bot reads the seam and plays). */
export type BotAction =
  | { type: "drag"; from: XY; to: XY; ms?: number; after?: number }
  | { type: "path"; points: XY[]; ms?: number; after?: number }
  | { type: "tap"; at: XY; after?: number }
  | { type: "key"; key: string; after?: number }
  | { type: "wait"; ms: number };
export type Knob = "harder" | "easier" | "slower" | "faster" | "again";
export type HudTone = "ion" | "mint" | "amber" | null;
export interface HudDef { key: string; label: string; meter?: boolean }
export interface StudioMessage {
  k: "ready" | "event" | "answer" | "done" | "engine_failed" | "fallback" | "say";
  at: number; archetype: string; name?: string; data?: unknown; itemId?: string; value?: unknown;
  /** the HOST's grade of the raw act, from the validated spec (never the engine's own claim) */
  grade?: Graded; local?: string; summary?: unknown;
}
export interface EngineApi {
  readonly archetype: string; readonly reducedMotion: boolean; readonly seed: number;
  readonly fx: FX; readonly tw: Tweens;
  rnd(): number;
  text(ctx: Ctx, s: string, x: number, y: number, o?: TextOpts): void;
  measure(ctx: Ctx, s: string, o?: TextOpts): number;
  /** static layer painted once per backing-store size and blitted 1:1 (perf: STUDIO-V2 §14 M3) */
  layer(key: string, paint: (g: Ctx) => void): HTMLCanvasElement;
  hitstop(ms: number): void;
  onPointer(h: PointerHandlers): void;
  onKey(h: (key: string, down: boolean) => void): void;
  hud(defs: HudDef[]): { set(key: string, value: string, o?: { tone?: HudTone; meter?: number; bump?: boolean }): void; label(key: string, text: string): void; show(on: boolean): void };
  task(step: string, goal: string, mode?: "done" | "warn" | null): void;
  caption(text: string): void;
  progress(frac: number, marks?: number[]): void;
  /** the child's RAW act; the host grades it against the validated spec and returns that grade. Any `{ $hostLog: name }`
   *  inside `value` is replaced by the HOST's own record of that input channel (see `record`), never the frame's copy. */
  answer(itemId: string, value: unknown, local?: string): Graded;
  /** append a raw input to a host-side channel (control changes, actions, samples) as it happens */
  record(channel: string, entry: unknown): void;
  /** start a channel afresh (e.g. at a new step) */
  resetLog(channel: string): void;
  event(name: string, data?: unknown): void;
  say(lineId: string): void;
  done(summary?: unknown): void;
  facts(onScreen: Record<string, string | number>): void;
  now(): number;
}
export interface EngineInstance {
  update(dt: number, t: number): void;
  render(ctx: Ctx, t: number): void;
  seam?(): Record<string, unknown>;
  bot?(): BotAction | null;
  knob?(k: Knob): boolean;
  /** the board version of the same idea with the same values (rung 4 of the ladder) */
  board?(): BoardSpec;
  dispose?(): void;
}
export interface EngineDef<S = unknown> {
  archetype: string;
  label: string;        // host type label, e.g. "Game · Landfall"
  accent: string;       // subject marker colour
  create(api: EngineApi, spec: S): EngineInstance;
}
