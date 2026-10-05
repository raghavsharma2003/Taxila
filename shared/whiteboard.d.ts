// Types for shared/whiteboard.js (the whiteboard script's one implementation; the script TYPES are shared/studio.ts).
import type { StudioFacts, WbOp, WhiteboardScript } from "./studio.ts";

export const LIMITS: Readonly<{ maxOps: number; maxPointsPerStroke: number; maxTextChars: number; maxDurationMs: number; minBoard: number; maxBoard: number; maxNumRows: number; maxNumCols: number; maxCellChars: number }>;
export const OPS: readonly string[];
export const INKS: readonly string[];
export const GROUNDS: readonly string[];
export const NUM_LAYOUTS: readonly string[];
export const TEXT_SIZE: Readonly<{ s: number; m: number; l: number }>;

export interface Box { x: number; y: number; w: number; h: number }
export interface DrawnText { x: number; y: number; text: string; size: number; align: string; small?: boolean }
export interface OpGeometry { paths: string[]; texts: DrawnText[]; fill?: string; box: Box }

export function textProblem(t: unknown): string | null;
export function textBox(text: string, size?: "s" | "m" | "l", at?: [number, number], align?: "start" | "middle" | "end"): Box;
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
