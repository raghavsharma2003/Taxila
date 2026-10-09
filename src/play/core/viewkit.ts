// What a family view gives the play host besides drawing: the goal line, the live readouts on the rail, the DOM controls
// (crisp, ≥ 44 px, accessible) and its reaction to the law's moments (juice and sound). Views draw only through the
// painter (styles.ts) and register every touch target with api.target (the audit measures what is touched).
import type { Lang, Moment, PlayActBody, PlayLevel } from "../../../shared/play.ts";
import type { PlayController } from "./controller.ts";
import type { View, ViewApi } from "./stage.ts";
import type { Role } from "./styles.ts";

export interface ControlSpec {
  id: string; label: string;
  kind?: "primary" | "secondary" | "pad" | "choice";
  disabled?: boolean;
  /** the one "your move" element of the state (volt rule): at most one control per state sets it */
  you?: boolean;
  onPress(): void;
  /** controls with the same group share a row */
  group?: string;
  aria?: string;
}
export interface Readout { k: string; v: string; role?: Role }
export interface FamilyView extends View {
  goal(): string;
  readouts(): Readout[];
  controls(): ControlSpec[];
  /** the law answered: juice + sound (never a verdict on the child) */
  react(ms: Moment[], refused: string | undefined): void;
  /** the teacher's demonstrated move: one legal act animated with the ghost hand (class 4-5 first contact) */
  demo?(): void;
  /** a voice act already parsed by src/play/core/voice.ts */
  voice?(act: PlayActBody): boolean;
}
export interface ViewDeps<P = unknown, S = unknown, A extends PlayActBody = PlayActBody> {
  level: PlayLevel<P>;
  ctl: PlayController<P, S, A>;
  lang: Lang;
  /** ask the host to re-render its DOM chrome (goal, readouts, controls) */
  changed(): void;
}
export type MakeView = (api: ViewApi, deps: ViewDeps) => FamilyView;

/** Fit `n` items of preferred size `pref` (≥ `min`) with `gap` into `avail`; returns the size or null if even `min` fails. */
export function fitRow(n: number, avail: number, pref: number, min: number, gap: number): number | null {
  if (n <= 0) return pref;
  const s = Math.min(pref, (avail - gap * (n - 1)) / n);
  return s >= min ? s : null;
}
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
