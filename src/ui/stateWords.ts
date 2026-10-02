// The four ledger words (R11, §6.4): gender-neutral, Devanagari-first by the parent's language tile.
// One table for every surface that shows them (parent corner; Older children's own map per R12).
export type Lang = "hi" | "hinglish" | "en";
export type StateKey = "unseen" | "practising" | "learned_today" | "mastered";
export interface LedgerState { level: 0 | 1 | 2 | 3; key: StateKey; recheck?: boolean }

export const STATE_WORDS: Record<StateKey, Record<Lang, string>> = {
  unseen: { hi: "अभी नहीं", hinglish: "Abhi nahi", en: "Not yet" },
  practising: { hi: "अभ्यास में", hinglish: "Abhyaas mein", en: "Practising" },
  learned_today: { hi: "आ गया", hinglish: "Aa gaya", en: "Got it" },
  mastered: { hi: "पक्का", hinglish: "Pakka", en: "Secure" },
};
export const RECHECK_TAG: Record<Lang, string> = { hi: "दोबारा जाँच", hinglish: "dobara jaanch", en: "re-check due" };
export const RECHECK_ON: Record<Lang, string> = { hi: "जाँच", hinglish: "jaanch", en: "re-check" };

/** What each word means, in one plain line (the sheet's legend). */
export const STATE_MEANING: Record<StateKey, string> = {
  unseen: "Not started yet.",
  practising: "Working on it. Some answers right, not yet on their own every time.",
  learned_today: "Got it on their own and explained it, on the same day. She checks again on a later day before it counts as secure.",
  mastered: "Got it on their own, explained it, and was still right on a later day.",
};

export function readLang(): Lang {
  try {
    const v = localStorage.getItem("tx.lang");
    if (v === "hi" || v === "hinglish" || v === "en") return v;
  } catch { /* storage blocked */ }
  return "hinglish";
}
