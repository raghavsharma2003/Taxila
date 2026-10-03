// Engine labels in the three languages the init `lang` field carries ("english" | "hinglish" | "hindi").
// Labels are short shapes (a verb, a noun), never teacher lines: the teacher speaks, the stage shows.
export interface Tri {
  en: string;
  hl: string;
  hi: string;
}

export const tri = (en: string, hl: string, hi: string): Tri => ({ en, hl, hi });
/** Chrome (buttons, verdict labels, aria-labels): English in every lesson language (PRODUCT-DESIGN-V2 §5.3, G-EN-1;
 *  audit #8 named "Phir se"). The teacher says the lesson-language word aloud; the screen's controls stay English. */
export const chrome = (en: string): Tri => ({ en, hl: en, hi: en });

export function say(s: Tri, lang: string): string {
  return lang === "hindi" ? s.hi : lang === "hinglish" ? s.hl : s.en;
}

/** Words every engine shares. chrome(): a control or a verdict label (English only). tri(): what the activity asks or
 *  offers as an answer, in the lesson's language (TrayContent). */
export const W = {
  check: chrome("Check"),
  reset: chrome("Start again"),
  play: chrome("Play"),
  bigger: tri("Tap the bigger one", "Bada wala tap karo", "बड़ा वाला छुओ"),
  smaller: tri("Tap the smaller one", "Chhota wala tap karo", "छोटा वाला छुओ"),
  more: tri("Tap the one with more", "Zyada wala tap karo", "ज़्यादा वाला छुओ"),
  fewer: tri("Tap the one with fewer", "Kam wala tap karo", "कम वाला छुओ"),
  same: tri("Same", "Barabar", "बराबर"),
  right: chrome("Right"),
  tryAgain: chrome("Not yet"),
  less: chrome("one less"),
  moreOne: chrome("one more"),
  delete: chrome("delete"),
  yourAnswer: chrome("Your answer"),
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
