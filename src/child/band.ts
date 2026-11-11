// Visual band, reading level and per-band timing tokens (PRODUCT-DESIGN §4.2, §5.2). Pure data: no React.
// The band follows class at setup (§5.4); the child may move up one band from settings, never down.

import { classesOf, registerOf } from "../../shared/bands.ts";

export type Band = "b1" | "b2" | "b3" | "b4";
export type Family = "young" | "older";
export type ReadingLevel = "R0" | "R1" | "R2";

/**
 * Class → visual band. r7 D3 (main loop 2026-11-04, OWNER-RESET #1: class 4 got a five-year-old's app): the look follows the
 * teacher's register from Brain's ONE band table (shared/bands.ts registerOf: young 1-3, preteen 4-6, teen 7-9): the
 * young register gets the young family, preteen and teen the older one. Visually: B1 classes 1-2, B2 the rest of the
 * young register (class 3), B3 up to class 7, B4 8-9. No second table: YOUNG_MAX_CLASS is read from Brain's.
 */
export const YOUNG_MAX_CLASS: number = classesOf("young")[1];
export function bandForClass(classLevel: number): Band {
  if (classLevel <= 2) return "b1";
  const c = Math.min(9, Math.max(1, Math.round(classLevel) || 1));
  if (registerOf(c) === "young") return "b2";
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
