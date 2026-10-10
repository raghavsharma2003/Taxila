// Pure helpers for the W1-A answer surfaces (no React, no JSX: unit-tested in Node by tests/director-truth.test.mjs).
import type { W1AKey } from "../../copy/en.ts";

/** The start purpose for a lesson variant (LessonStartRequest.purpose; flows G1). */
export const purposeOf = (v: "lesson" | "practice" | "doubt"): "lesson" | "practice" | "doubt" => (v === "practice" ? "practice" : v === "doubt" ? "doubt" : "lesson");

export interface StartRefusal {
  state: "done" | "capped" | "resting" | "safety_hold" | string;
  opensAt?: string | null;
  capRemaining?: number;
  control?: "hours" | "daily_limit" | "done" | "safety" | null;
  window?: { from: string; to: string } | null;
}

/** A 409 LessonStartRefused body → a refusal the screen can show, or null when it is not one. */
export function refusalOf(body: unknown): StartRefusal | null {
  const b = body as Partial<StartRefusal> | null;
  if (!b || typeof b !== "object" || typeof b.state !== "string") return null;
  if (!["done", "capped", "resting", "safety_hold"].includes(b.state)) return null;
  return { state: b.state, opensAt: b.opensAt ?? null, capRemaining: b.capRemaining, control: b.control ?? null, window: b.window ?? null };
}

/** The Hint sheet / Help menu chip ids (useDesk.ts REQUESTS): a tap on one is a help request, never an answer (flows G3, G5). */
export const HELP_CHIP_IDS: Record<string, "hint" | "why" | "know" | "another" | "slower" | "skip" | "choices" | "how"> = {
  hint: "hint", why: "why", know: "know", another: "another", slower: "slower", skip: "skip", help_choices: "choices", help_how: "how",
};

/** The Question card's chip state for a help request ("Hint asked"), or null for an answer. */
export const helpAskedKey = (chipId: string | undefined): W1AKey | null => {
  const k = chipId && Object.hasOwn(HELP_CHIP_IDS, chipId) ? HELP_CHIP_IDS[chipId] : undefined;
  return k ? (`help.asked.${k}` as W1AKey) : null;
};

/** A small whole number as dots on a Young picture tile: null when the label is not one. */
/** round 3 fix (experience B10): a label that is words, not a numeral / short answer ("Keep going", "Stop for today"):
 *  its tile is set at the label size (desk.css .dk-tile[data-words]), never the 36-40 px numeral size. */
export const isWordLabel = (label: string) => /\s/.test(String(label ?? "").trim()) || String(label ?? "").trim().length > 5;

export function dotsFor(label: string): number | null {
  const n = /^\s*(\d{1,2})\s*$/.exec(label);
  if (!n) return null;
  const v = Number(n[1]);
  return v >= 1 && v <= 10 ? v : null;
}

/** A fraction question (the Older pad's "/" key; live-content 10). */
export const fractionQuestion = (ask: string, topicTitle = "") => /\d\s*\/\s*\d/.test(ask) || /fraction|bhinn/i.test(topicTitle);
