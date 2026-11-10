// Types for shared/whiteboard.js (the whiteboard script's one implementation; the script TYPES are shared/studio.ts).
import type { StudioFacts, WbOp, WbPoint, WhiteboardScript } from "./studio.ts";

export const LIMITS: Readonly<{ maxOps: number; maxPointsPerStroke: number; maxTextChars: number; maxDurationMs: number; minBoard: number; maxBoard: number; maxNumRows: number; maxNumCols: number; maxCellChars: number; maxWordCellChars: number }>;
export const OPS: readonly string[];
export type WbRole = "focus" | "slot" | "answer" | "mixup" | "muted";
export const ROLE: Readonly<{ focus: "focus"; slot: "slot"; answer: "answer"; mixup: "mixup"; muted: "muted" }>;
export const ROLES: readonly WbRole[];
export const MEANING_ROLES: readonly WbRole[];
export const ROLE_SHAPES: Readonly<Record<"focus" | "slot" | "answer" | "mixup", readonly string[]>>;
export const INKS: readonly string[];
export const GROUNDS: readonly string[];
export const NUM_LAYOUTS: readonly string[];
export const TEXT_SIZE: Readonly<{ s: number; m: number; l: number }>;

export interface Box { x: number; y: number; w: number; h: number }
export interface DrawnText { x: number; y: number; text: string; size: number; align: string; small?: boolean }
/** widths: a path's own stroke width (a fraction's rule), else the op's; dashed: a path drawn dashed (a slot's box); slotFill: the slot box's tint. */
export interface OpGeometry { paths: string[]; texts: DrawnText[]; fill?: string; box: Box; widths?: (number | undefined)[]; dashed?: boolean[]; slotFill?: string }
export interface FractionRuns { pieces: ({ t: string; w: number } | { n: string; d: string; w: number })[]; fs: number; ns: number; gap: number; w: number; h: number }

export function textProblem(t: unknown): string | null;
export function textBox(text: string, size?: "s" | "m" | "l", at?: [number, number], align?: "start" | "middle" | "end"): Box;
export function fractionRuns(text: string, size?: "s" | "m" | "l"): FractionRuns | null;
export function stackNumeral(fs: number): number;
export function stackRule(ns: number): number;
export function fracStack(cx: number, barY: number, n: string | number, d: string | number, ns: number, halfW: number): { texts: DrawnText[]; path: string; width: number };
export function braceGeometry(op: { from: [number, number]; to: [number, number]; side?: string }): { d: string; apex: [number, number]; n: [number, number]; box: Box };
export function braceLabelId(id: string): string;
export function braceLabelAt(op: { from: [number, number]; to: [number, number]; side?: string }, text: string, size?: "s" | "m" | "l"): [number, number];
export function opTextSizes(op: WbOp, byId?: Map<string, WbOp>): number[];
export function rolesByShape(script: WhiteboardScript): { ok: boolean; why: string };
export function normalizeScript(raw: unknown, opts?: { strict?: boolean; clauses?: boolean; priorIds?: Iterable<string> | null }): { ok: boolean; script: WhiteboardScript | null; errors: string[]; fixes: string[] };
export function opProgress(op: WbOp, t: number): number;
export function erasers(script: WhiteboardScript): Map<string, WbOp>;
export function visibleShare(op: WbOp, t: number, er: Map<string, WbOp>): number;
export function stepsAt(script: WhiteboardScript, t: number): number;
export function scriptTokens(script: WhiteboardScript): string[];
export function scriptNumbers(script: WhiteboardScript): string[];
export function scriptFacts(script: WhiteboardScript, base?: Partial<StudioFacts>): StudioFacts;
export function seeded(str: string): () => number;
export function opGeometry(op: WbOp, byId?: Map<string, WbOp>): OpGeometry;
export function lintScript(script: WhiteboardScript): { id: string; check: string; detail?: unknown }[];
export function moveShift(ops: readonly WbOp[], id: string, t: number, reducedMotion?: boolean): [number, number];
export function shiftOp<T extends WbOp>(op: T, dx: number, dy: number): T;
export function settledScript(script: WhiteboardScript): WhiteboardScript;
export type WbMatrix = [number, number, number, number, number, number];
export const MOTION: ReadonlySet<string>;
export const MOTION_TARGETS: Readonly<Record<"rotate" | "scale" | "follow" | "sweep" | "morph", readonly string[]>>;
export function isMotionOp(op: unknown): boolean;
export function motionMatrix(ops: readonly WbOp[], id: string, t: number, reducedMotion?: boolean): WbMatrix;
export function isIdentity(m: WbMatrix): boolean;
export function morphAt(ops: readonly WbOp[], op: WbOp, t: number, reducedMotion?: boolean): WbPoint[] | null;
export function sweepAt(ops: readonly WbOp[], id: string, t: number, reducedMotion?: boolean): { p: number; dir: "up" | "down" | "left" | "right" } | null;
export function transformOp<T extends WbOp>(op: T, m: WbMatrix): T;
export function finalOp<T extends WbOp>(op: T, ops: readonly WbOp[]): T;
