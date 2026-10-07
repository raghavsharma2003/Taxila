// Types for server/duplex/understand.js (pure, browser-safe; the device host imports the same module the server runs).
export declare function normText(t: string): string;
export declare function textHash(t: string): string;
export declare function valuesIn(text: string): { v: string; at: number }[];
export declare function afterHold(text: string): { held: boolean; rest: string; restTokens: number };
export interface UnderstandNote {
  safety: { distress: boolean; kind: "self_harm" | "abuse" | "fear" | null };
  stop: boolean;
  holdTail: boolean;
  repairOpen: boolean;
  repaired: boolean;
  asks: boolean;
  idk: boolean;
  wordSearch: boolean;
  values: string[];
  lastValue: string | null;
  misconception: string | null;
  lex: { p: number; cue: string };
  tokens: number;
  tailText: string;
}
export declare function understand(text: string, ctx?: { answerForm?: string; beat?: string | null; misconceptionValues?: string[] }): UnderstandNote;
export declare const LEX_OPTS: { copulaProjection: boolean };
