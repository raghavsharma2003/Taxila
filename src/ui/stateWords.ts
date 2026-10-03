// The four ledger words (PRODUCT-DESIGN-V2 §5.3): English chrome on every surface, whatever the family's spoken
// language (G-EN-1: no Devanagari, no Hinglish chrome words). The Lang key is kept so callers compile; every
// language maps to the same English word. One table for every surface (parent corner; Older children's map).
export type Lang = "hi" | "hinglish" | "en";
export type StateKey = "unseen" | "practising" | "learned_today" | "mastered";
export interface LedgerState { level: 0 | 1 | 2 | 3; key: StateKey; recheck?: boolean }

export const STATE_WORDS: Record<StateKey, Record<Lang, string>> = {
  unseen: { hi: "Not started", hinglish: "Not started", en: "Not started" },
  practising: { hi: "Practising", hinglish: "Practising", en: "Practising" },
  learned_today: { hi: "Got it", hinglish: "Got it", en: "Got it" },
  mastered: { hi: "Secure", hinglish: "Secure", en: "Secure" },
};
export const RECHECK_TAG: Record<Lang, string> = { hi: "check due", hinglish: "check due", en: "check due" };
export const RECHECK_ON: Record<Lang, string> = { hi: "check on", hinglish: "check on", en: "check on" };

/** What each word means, in one plain line (the sheet's legend). */
export const STATE_MEANING: Record<StateKey, string> = {
  unseen: "Not started yet.",
  practising: "Working on it. Some answers right, not yet on their own every time.",
  learned_today: "Got it on their own and explained it, on the same day. It is checked again on a later day before it counts as secure.",
  mastered: "Got it on their own, explained it, and was still right on a later day.",
};

export function readLang(): Lang {
  try {
    const v = localStorage.getItem("tx.lang");
    if (v === "hi" || v === "hinglish" || v === "en") return v;
  } catch { /* storage blocked */ }
  return "hinglish";
}
