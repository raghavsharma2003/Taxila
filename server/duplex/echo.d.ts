// Types for server/duplex/echo.js (pure, browser-safe; known-text echo subtraction).
export declare const ECHO: { windowMs: number; minRun: number; echoShare: number; echoMinTokens: number; freshMs: number };
export declare class EchoSubtractor {
  constructor(o?: { windowMs?: number; minRun?: number });
  heard(utteranceId: string, words: { w: string; startMs: number; endMs: number }[]): void;
  heardText(utteranceId: string, text: string, startedAt: number, msPerChar: number): void;
  stopAt(utteranceId: string, t: number): void;
  stripAll(text: string, t: number, lagMs?: number): string;
  recent(t: number, lagMs?: number): { u: string; w: string; sk: string; startMs: number; endMs: number }[];
  subtract(text: string, t: number, lagMs?: number, span?: { fromMs: number; toMs: number } | null, times?: { startMs: number; endMs: number }[] | null): { text: string; removed: number };
}
