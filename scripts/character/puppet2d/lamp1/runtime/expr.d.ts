// Types for the synced judged runtime (expr.js): the expression emitters and their presets.
export interface Preset {
  bs: Record<string, number>;
  head: [number, number, number];
  gaze: [number, number];
  env: [number, number, number];
  act?: string;
  bounce?: number;
  search?: [number, number];
  pulse?: { keys: string[]; delay: number; a: number; hold: number; r: number };
  wob?: Record<string, Array<[number, number]>>;
  mir?: boolean;
}
export declare const EXPRESSIONS: Record<string, Preset>;
export declare const VARIANTS: Record<string, Preset[]>;
export declare const WEIGHTS: Record<string, number[]>;
export declare const ACTS: Record<string, (u: number) => { head: [number, number, number]; lean: number }>;
export declare const EMOTION_TO_EXPRESSION: Record<string, string>;
export declare class Expressions {
  constructor(seed?: number);
  cur: { name: string; t0: number; hold: number; I: number; rel: number; P: Preset; variant: number } | null;
  lean: number;
  emote(name: string, t: number, o?: { hold?: number; intensity?: number; variant?: number }): void;
  release(t: number): void;
  level(t: number): number;
  apply(t: number, dt: number, bs: Record<string, number>, head: number[], gaze: number[], lip?: Record<string, number>): number;
}
export declare class Listener {
  constructor(seed?: number);
  nods: Array<[number, string]>;
  update(t: number, dt: number, listening: boolean, level: number): { pitch: number; smile: number };
}
export declare function searchAt(u: number, ph: number, amp?: [number, number]): [number, number];
