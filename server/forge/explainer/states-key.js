// Does a line state the open card's key? (main v6.11; moved here from server/stagecraft/board-first.js in round 8 so the
// explainer templates can use it without an import cycle — board-first imports templates.js. board-first re-exports
// fracSay and lineStatesKey, so its callers are unchanged.) PURE.

/** main v6.9 S11: a fraction in her picture line is said as words ("ek-chauthai", "teen bata paanch"), never "(1/4)". */
export const NUM_HI = ["shunya", "ek", "do", "teen", "chaar", "paanch", "chhe", "saat", "aath", "nau", "das", "gyaarah", "baarah"];
export const FRAC_HI = { "1/2": "aadha", "1/3": "ek-tihaai", "2/3": "do-tihaai", "1/4": "ek-chauthai", "2/4": "do-chauthai", "3/4": "teen-chauthai" };
export function fracSay(a, b) {
  const k = `${a}/${b}`;
  return FRAC_HI[k] ?? (NUM_HI[a] && NUM_HI[b] ? `${NUM_HI[a]} bata ${NUM_HI[b]}` : `${a} bata ${b}`);
}
/**
 * main v6.11 (director19 c4 steady 18: "1 rangin, yaani aadha" said while the open card's key was 1/2): does `line` state one
 * of the live card's keys — in digits or in words, a fraction in any form of the same value (1/2, 2/4, "aadha", "do bata
 * chaar"), a whole number as digits or its Hinglish word? PURE.
 */
export function lineStatesKey(line, keys) {
  const L = ` ${String(line ?? "").toLowerCase()} `;
  for (const k0 of keys ?? []) {
    const k = String(k0).trim().toLowerCase();
    const fr = /^(\d+)\s*\/\s*(\d+)$/.exec(k);
    if (fr) {
      const v = Number(fr[1]) / Number(fr[2]);
      for (let b = 1; b <= 12; b++) for (let a = 0; a <= b; a++) {
        if (Math.abs(a / b - v) > 1e-9) continue;
        if (new RegExp(`(^|[^\\d/])${a}\\s*/\\s*${b}(?![\\d/])`).test(L) || L.includes(` ${fracSay(a, b)}`)) return true;
      }
      continue;
    }
    if (/^\d+$/.test(k)) {
      const n = Number(k);
      if (new RegExp(`(^|[^\\d/])${n}(?![\\d/])`).test(L) || (NUM_HI[n] && new RegExp(`\\b${NUM_HI[n]}\\b`).test(L))) return true;
    }
  }
  return false;
}

// round 8 (board grammar item 5): a board's own short words (a mix-up marker) may be in English too: "half", "two"
const EN_NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const EN_FRAC = { 2: "halves|half", 3: "thirds?", 4: "quarters?|fourths?", 5: "fifths?", 6: "sixths?", 8: "eighths?", 10: "tenths?", 12: "twelfths?" };
/** lineStatesKey, or a key said in English words ("one half", "two quarters", "three"). PURE. */
export function statesKeyAnyLang(line, keys) {
  if (lineStatesKey(line, keys)) return true;
  const L = ` ${String(line ?? "").toLowerCase()} `;
  for (const k0 of keys ?? []) {
    const k = String(k0).trim().toLowerCase();
    const fr = /^(\d+)\s*\/\s*(\d+)$/.exec(k);
    if (fr) {
      const v = Number(fr[1]) / Number(fr[2]);
      for (const [b, w] of Object.entries(EN_FRAC)) for (let a = 1; a <= Number(b); a++) {
        if (Math.abs(a / Number(b) - v) > 1e-9) continue;
        const num = a === 1 ? "(?:a|an|one|1)" : `(?:${EN_NUM[a]}|${a})`;
        if (new RegExp(`\\b${num}[\\s-]+(?:${w})\\b`).test(L) || (a === 1 && b === "2" && /\bhalf\b/.test(L))) return true;
      }
      continue;
    }
    if (/^\d+$/.test(k) && EN_NUM[Number(k)] && new RegExp(`\\b${EN_NUM[Number(k)]}\\b`).test(L)) return true;
  }
  return false;
}
