// Engine labels in the three languages the init `lang` field carries ("english" | "hinglish" | "hindi").
// Labels are short shapes (a verb, a noun), never teacher lines: the teacher speaks, the stage shows.
export interface Tri {
  en: string;
  hl: string;
  hi: string;
}

export const tri = (en: string, hl: string, hi: string): Tri => ({ en, hl, hi });

export function say(s: Tri, lang: string): string {
  return lang === "hindi" ? s.hi : lang === "hinglish" ? s.hl : s.en;
}

/** Words every engine shares. */
export const W = {
  check: tri("Check", "Check karo", "जाँचो"),
  reset: tri("Start again", "Phir se", "फिर से"),
  play: tri("Play", "Chalao", "चलाओ"),
  bigger: tri("Tap the bigger one", "Bada wala tap karo", "बड़ा वाला छुओ"),
  smaller: tri("Tap the smaller one", "Chhota wala tap karo", "छोटा वाला छुओ"),
  more: tri("Tap the one with more", "Zyada wala tap karo", "ज़्यादा वाला छुओ"),
  fewer: tri("Tap the one with fewer", "Kam wala tap karo", "कम वाला छुओ"),
  same: tri("Same", "Barabar", "बराबर"),
  right: tri("Right", "Sahi", "सही"),
  tryAgain: tri("Not yet", "Abhi nahi", "अभी नहीं"),
  less: tri("one less", "ek kam", "एक कम"),
  moreOne: tri("one more", "ek aur", "एक और"),
  delete: tri("delete", "mitao", "मिटाओ"),
  yourAnswer: tri("Your answer", "Tumhara jawab", "तुम्हारा जवाब"),
  predictFirst: tri("Guess first, then try it", "Pehle andaaza lagao, phir chala ke dekho", "पहले अंदाज़ा लगाओ, फिर चलाकर देखो"),
  tryIt: tri("Now try it", "Ab chala ke dekho", "अब चलाकर देखो"),
} as const;

/** Digits in the child's script (Hindi mode shows Devanagari numerals only where the engine opts in). */
export function numeral(n: number | string, lang: string, deva = false): string {
  const s = String(n);
  if (!deva || lang !== "hindi") return s;
  return s.replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);
}

/** Indian digit grouping: 1,23,45,678. */
export function indianGroup(n: number): string {
  const neg = n < 0;
  const s = String(Math.abs(Math.trunc(n)));
  if (s.length <= 3) return (neg ? "-" : "") + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (neg ? "-" : "") + rest + "," + last3;
}
