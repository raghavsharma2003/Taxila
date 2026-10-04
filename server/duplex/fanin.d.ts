// Types for server/duplex/fanin.js (pure, browser-safe; device host + server slice).
import type { TranscriptView, WordTiming } from "../../src/duplex/engine.ts";
export declare const SOURCE_LAG: Record<string, { p50: number; p90: number }>;
export interface SttEvent {
  type: "partial" | "final";
  itemId: string;
  text: string;
  t: number;
  delta?: boolean;
  words?: WordTiming[] | null;
  audioStartMs?: number;
  audioEndMs?: number;
}
export declare class TurnTranscript {
  constructor(o?: { source?: TranscriptView["source"]; lag?: { p50: number; p90: number }; filter?: (text: string, meta: { itemId: string; t: number; fromMs?: number; toMs?: number; times?: WordTiming[] | null }) => { text: string; removed: number } });
  readonly source: TranscriptView["source"];
  readonly lag: { p50: number; p90: number };
  readonly turnStart: number;
  readonly echoRemoved: number;
  readonly updatedAt: number | null;
  begin(t: number, o?: { carryFrom?: number | null }): void;
  commitSent(t: number): void;
  push(ev: SttEvent): boolean;
  lagEstimate(): number;
  view(t: number, voicedAfter?: (fromMs: number) => number): TranscriptView;
}
