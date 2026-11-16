// Types for shared/scene.js (round 7 M5a: the code-built cinematic scene).
export type Pt = [number, number];
export interface ScenePart { shape: "circle" | "ellipse" | "rect" | "poly" | "sector" | "line" | "path" | "text"; fill?: string; stroke?: string; sw?: number; w?: number; opacity?: number; rot?: number;
  c?: Pt; r?: number; rx?: number; ry?: number; at?: Pt; h?: number; round?: number; points?: Pt[]; closed?: boolean; from?: Pt | number; to?: Pt | number; d?: string; text?: string; size?: number }
export interface SceneActor { id: string; prop?: string; parts?: ScenePart[]; at: Pt; scale: number; rot: number; opacity: number; z: number }
export interface SceneKey { t: number; at?: Pt; rot?: number; scale?: number; opacity?: number }
export interface SceneTrack { actor: string; keys: SceneKey[]; ease: "inOut" | "linear"; loop?: number }
export interface SceneCaption { t: number; until: number; text: string; at: "top" | "bottom" }
export interface SceneBeat { t: number; clause?: number; says: string }
export interface Scene { v: 1; kind: "scene"; id: string; topicId?: string; stage: { w: number; h: number }; bg: string; durationMs: number; actors: SceneActor[]; tracks: SceneTrack[];
  captions: SceneCaption[]; beats: SceneBeat[]; facts: Record<string, unknown> }
export interface ActorState { id: string; a: SceneActor; x: number; y: number; rot: number; scale: number; opacity: number }
export const SCENE_STAGE: Readonly<{ w: number; h: number }>;
export const COLOURS: readonly string[];
export const BACKGROUNDS: readonly string[];
export const CAPTION_MAX: number;
export const CAPTION_SIZE: number;
export function partProblem(p: unknown): string | null;
export function partsBox(parts: ScenePart[]): { x: number; y: number; w: number; h: number };
export function textW(text: string, size?: number): number;
export function actorParts(a: SceneActor): ScenePart[];
export function normalizeScene(s: unknown): { ok: boolean; scene: Scene; errors: string[] };
export function sceneAt(scene: Scene, t: number): { actors: ActorState[]; captions: SceneCaption[] };
export function actorBox(a: SceneActor, st: ActorState): { x: number; y: number; w: number; h: number };
export function lintScene(scene: Scene): string[];
export function lineWarp(scene: Scene, clauseOnsets?: readonly number[]): (tLine: number) => number;
export function stillAt(scene: Scene, t: number): number;
export function beatAt(scene: Scene, t: number): SceneBeat | null;
export function sceneValues(scene: Scene): string[];
export function sceneShowsHeld(scene: Scene, held: readonly string[] | null | undefined): string[];
export function sceneMayPlay(scene: Scene, o?: { held?: readonly string[] | null; cardLive?: boolean }): { ok: boolean; why: string };
