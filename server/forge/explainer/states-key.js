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
// director20 (c4 steady 18: "1 rangin, yaani aadha" over a card whose key is "No" / "No, it's ½"): a key is not only "a/b" or
// an integer. Its VALUE TOKENS count wherever they stand in it: unicode vulgar fractions are read as a/b, every a/b in the key
// counts, and an integer counts only in a SHORT key — at most KEY_INT_WORDS words with exactly one integer outside its
// fractions ("6 laddoo", "No, it's 8"). A longer sentence key, or one with several integers ("2 × 6 = 12"), names its numbers
// incidentally, and blocking every line that says one of them would leave no picture line at all.
export const KEY_INT_WORDS = 5;
const VULGAR = { "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5", "⅙": "1/6",
  "⅚": "5/6", "⅐": "1/7", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8", "⅑": "1/9", "⅒": "1/10" };
const VULGAR_RE = new RegExp(`[${Object.keys(VULGAR).join("")}]`, "g");
/** Text with its vulgar fractions as " a/b " and the fraction slash (⁄) as "/". PURE. */
export function plainFractions(t) {
  return String(t ?? "").replace(VULGAR_RE, (c) => ` ${VULGAR[c]} `).replace(/\u2044/g, "/");
}
/** A key's value tokens: ["a/b" …, "n"] (see KEY_INT_WORDS). A key that is exactly "a/b" or an integer is itself. PURE. */
export function keyTokens(k0) {
  const k = plainFractions(k0).trim().toLowerCase().replace(/\s*\/\s*/g, "/");
  if (/^\d+\/\d+$/.test(k) || /^\d+$/.test(k)) return [k];
  const fracs = k.match(/\d+\/\d+/g) ?? [];
  const ints = [...new Set(k.replace(/\d+\/\d+/g, " ").replace(/\d+\.\d+/g, " ").match(/\d+/g) ?? [])];
  const words = k.split(/\s+/).filter(Boolean).length;
  return [...new Set([...fracs, ...(ints.length === 1 && words <= KEY_INT_WORDS ? ints : [])])];
}
const tokensOf = (keys) => [...new Set((keys ?? []).flatMap((k) => keyTokens(k)))];
/**
 * main v6.11 (director19 c4 steady 18: "1 rangin, yaani aadha" said while the open card's key was 1/2): does `line` state one
 * of the live card's keys — in digits or in words, a fraction in any form of the same value (1/2, 2/4, ½, "aadha", "do bata
 * chaar"), a whole number as digits or its Hinglish word? A key may be a sentence ("No, it's ½"): its value tokens count
 * (keyTokens). PURE.
 */
export function lineStatesKey(line, keys) {
  const L = ` ${plainFractions(line).toLowerCase()} `;
  for (const k of tokensOf(keys)) {
    const fr = /^(\d+)\/(\d+)$/.exec(k);
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
/**
 * director20 (c5-t01 steady and stuck 18: "aur ek ___ barabar hisson mein" — the open card's count stripped, a hole left): does
 * `line` carry a blank — a mask ("___", "…", "[ ]"), punctuation left with nothing between (", ,", a trailing ","), or a count slot left empty ("ek barabar hisson mein": "ek" before
 * "barabar" + a plural of parts is the article of a count that is missing)? A line with a blank is rewritten or not said. PURE.
 */
export function lineHasBlank(line) {
  const L = String(line ?? "").toLowerCase();
  return /_{2,}|…|\.{3}|\[\s*\]|\(\s*\)|\{\s*\}/.test(L) || /\bek\s+(?:barabar|alag-alag)\s+(?:hisson|hisse|tukde|tukdon|gaps|bhaag|bhaagon)\b/.test(L)
    || /[,;:]\s*[,;]|[,;:]\s*$|^\s*[,;:]/.test(L);
}

// round 8 (board grammar item 5): a board's own short words (a mix-up marker) may be in English too: "half", "two"
const EN_NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const EN_FRAC = { 2: "halves|half", 3: "thirds?", 4: "quarters?|fourths?", 5: "fifths?", 6: "sixths?", 8: "eighths?", 10: "tenths?", 12: "twelfths?" };
/** lineStatesKey, or a key said in English words ("one half", "two quarters", "three"). PURE. */
export function statesKeyAnyLang(line, keys) {
  if (lineStatesKey(line, keys)) return true;
  const L = ` ${plainFractions(line).toLowerCase()} `;
  for (const k of tokensOf(keys)) {
    const fr = /^(\d+)\/(\d+)$/.exec(k);
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
