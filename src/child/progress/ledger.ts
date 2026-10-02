// Ledger status → what a child surface shows (PRODUCT-DESIGN §8.4-8.6, §6.4.1). Shape carries state; the
// words appear only for Older (and always for the parent). Monotone and absence-invariant: "due" is derived
// from elapsed time on the server (bkt.js), so it NEVER changes the child's display (T2, PD-G19); the bird
// renders only from a server-written recheck_scheduled flag (R13).
import type { MapSkill } from "../api.ts";

export type Stage = "seed" | "sprout" | "flower" | "fruit";

export function stageOf(s: Pick<MapSkill, "status" | "delayedPass">): Stage {
  switch (s.status) {
    case "unseen":
      return "seed";
    case "introduced":
    case "practising":
      return "sprout";
    case "learned_today":
      return "flower";
    case "mastered":
      return "fruit";
    case "due":
      return s.delayedPass ? "fruit" : "flower";
  }
}

/** The gender-neutral ledger words, Devanagari-first (R11): अभी नहीं · अभ्यास में · आ गया · पक्का. */
export const STATE_WORD: Record<Stage, { hi: string; en: string }> = {
  seed: { hi: "अभी नहीं", en: "Abhi nahi" },
  sprout: { hi: "अभ्यास में", en: "Abhyaas mein" },
  flower: { hi: "आ गया", en: "Aa gaya" },
  fruit: { hi: "पक्का", en: "Pakka" },
};

export interface Chapter {
  name: string;
  skills: MapSkill[];
}

/** Group by chapter (or topic), keeping server order. */
export function chaptersOf(skills: MapSkill[]): Chapter[] {
  const map = new Map<string, MapSkill[]>();
  for (const s of skills) {
    const k = s.chapter ?? s.topicId ?? "—";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(s);
  }
  return [...map.entries()].map(([name, list]) => ({ name, skills: list }));
}

/** Older counts line: counts, never % ("shows what you have shown so far"). */
export function countsLine(skills: MapSkill[]): { pakka: number; total: number } {
  return { pakka: skills.filter((s) => stageOf(s) === "fruit").length, total: skills.length };
}
