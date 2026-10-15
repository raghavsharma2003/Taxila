// R-KEY on numbers (COMPREHENSION-ENGINE.md §4.2): the numbers a child's turn gives, read by the one shared reader. Pure.

// round 5 (main, 2026-10-14; sim lab r5-voice-base-vs-combo: spoken-Hindi verdicts 77 → 51 correct): this file had its own
// reader, and it misread the ASR's Devanagari ("बारह सौ" → 100, "आठ हजार छह सौ चौदह" → 8600). It now reads with the ONE
// reader (server/grading/spoken-number.js numberPhrases) in its split mode: every number phrase in order, two numbers said
// back to back are two phrases (working aloud), never a null for the whole turn.
import { numberPhrases, statedResults } from "../../grading/spoken-number.js";

/**
 * Every number phrase in a child's turn, in order of appearance.
 * @param {string} text @param {{ lang?: string }} [o] lang 'en' disables Roman-Hindi number words (do, das, saath, …)
 * @returns {number[]}
 */
export function numbersIn(text, { lang = "mixed" } = {}) {
  const s = String(text ?? "").replace(/\bpaise\b/gi, " ");
  return numberPhrases(s, { split: true, lang }) ?? [];
}

/**
 * R-KEY on numbers: the child's answer is the LAST number phrase (children self-correct: "3... nahi, 4"); working aloud, a
 * stated result (not an operand) equal to the key.
 * @returns {'correct'|'wrong'|'NA'}
 */
export function matchNumber(text, key, { tol = 1e-9, relTol = 0, lang } = {}) {
  const ns = numbersIn(text, { lang });
  if (!ns.length) return "NA";
  const k = Number(key), near = (v) => Math.abs(v - k) <= Math.max(tol, relTol * Math.abs(k));
  // working aloud: the key among the numbers they STATE (never an operand of the working) is the answer
  const w = statedResults(text);
  if (w && w.all.length >= 2) return w.results.some(near) ? "correct" : near(w.results.at(-1) ?? ns.at(-1)) ? "correct" : "wrong";
  return near(ns.at(-1)) ? "correct" : "wrong";
}
