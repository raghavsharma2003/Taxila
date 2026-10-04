// Types for server/duplex/echo.js (pure, browser-safe; known-text echo subtraction).
export declare const ECHO: { windowMs: number; minRun: number; echoShare: number; echoMinTokens: number };
export declare class EchoSubtractor {
  constructor(o?: { windowMs?: number; minRun?: number });
  heard(utteranceId: string, words: { w: string; startMs: number; endMs: number }[]): void;
  heardText(utteranceId: string, text: string, startedAt: number, msPerChar: number): void;
  stopAt(utteranceId: string, t: number): void;
  recent(t: number, lagMs?: number): { u: string; w: string; sk: string; startMs: number; endMs: number }[];
  subtract(text: string, t: number, lagMs?: number): { text: string; removed: number };
}
