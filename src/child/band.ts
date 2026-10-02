// Visual band, reading level and per-band timing tokens (PRODUCT-DESIGN §4.2, §5.2). Pure data: no React.
// The band follows class at setup (§5.4); the child may move up one band from settings, never down.

export type Band = "b1" | "b2" | "b3" | "b4";
export type Family = "young" | "older";
export type ReadingLevel = "R0" | "R1" | "R2";

/** Class → visual band: B1 6-7 (classes 1-2), B2 8-9 (3-4), B3 10-12 (5-7), B4 13-15 (8-9). */
export function bandForClass(classLevel: number): Band {
  if (classLevel <= 2) return "b1";
  if (classLevel <= 4) return "b2";
  if (classLevel <= 7) return "b3";
  return "b4";
}

/** Apply the child's "move up one band" setting; never moves down. */
export function effectiveBand(base: Band, moveUp: boolean): Band {
  if (!moveUp) return base;
  const order: Band[] = ["b1", "b2", "b3", "b4"];
  return order[Math.min(3, order.indexOf(base) + 1)];
}

export const familyOf = (b: Band): Family => (b === "b1" || b === "b2" ? "young" : "older");

/** Reading-level defaults before measurement (§3.8): B1 R0 · B2 R1 · B3-B4 R2. */
export const defaultReading = (b: Band): ReadingLevel => (b === "b1" ? "R0" : b === "b2" ? "R1" : "R2");

/** The server's age band string for ModuleHost init and the brief. */
export const ageBandOf = (b: Band): "6-9" | "10-15" => (familyOf(b) === "young" ? "6-9" : "10-15");

export interface BandTokens {
  /** YOUR TURN escalation, seconds (× timing multiplier): glow intensifies, tap options appear (null = on request). */
  glowS: number;
  tapOptionsS: number | null;
  /** End-of-speech silence ramp for tap-to-talk (s) and the hard cap on one talk (s). */
  eosS: number;
  talkCapS: number;
  /** Holdover guard floor (ms): taps landing this soon after a screen change are ignored. */
  holdoverMs: number;
  choicesMax: number;
  /** Earcons on by default. */
  earcons: boolean;
}

export const BAND_TOKENS: Record<Band, BandTokens> = {
  b1: { glowS: 4, tapOptionsS: 15, eosS: 3, talkCapS: 30, holdoverMs: 400, choicesMax: 2, earcons: true },
  b2: { glowS: 4, tapOptionsS: 15, eosS: 3, talkCapS: 30, holdoverMs: 400, choicesMax: 3, earcons: true },
  b3: { glowS: 6, tapOptionsS: null, eosS: 2, talkCapS: 60, holdoverMs: 250, choicesMax: 4, earcons: false },
  b4: { glowS: 6, tapOptionsS: null, eosS: 2, talkCapS: 60, holdoverMs: 250, choicesMax: 4, earcons: false },
};
