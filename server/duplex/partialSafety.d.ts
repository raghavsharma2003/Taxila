// Types for server/duplex/partialSafety.js (sticky safety on every partial; the shipped scanSafety predicate).
export type SafetyKind = "self_harm" | "abuse" | "fear" | null;
export interface PartialSafetyState {
  distress: boolean;
  kind: SafetyKind;
  firstAt: number | null;
  checkedThroughMs: number | null;
  source: "predicate" | "model_note" | null;
}
export declare class PartialSafety {
  constructor(o?: { scan?: (text: string) => { distress: boolean; kind: string | null } });
  readonly checks: number;
  begin(t: number, o?: { carry?: boolean }): void;
  check(text: string, coverageEndMs: number | null, t: number, alts?: string[]): PartialSafetyState & { tripped: boolean };
  modelNote(kind: SafetyKind, t: number): PartialSafetyState & { tripped: boolean };
  state(): PartialSafetyState;
}
