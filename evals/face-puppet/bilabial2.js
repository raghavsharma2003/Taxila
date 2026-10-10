// CANDIDATE, not wired (round 4 stream 5): rig2's bilabial extension, copied from claude/r4-asha-rig2
// scripts/character/puppet2d/lamp2/bilabial2.js @ 9a43c6ba for the r8 / lamp2 comparison in ./lipsync-looks.mjs.
// Bilabial closures from the word text, lamp2 extension of lamp1's rule (scripts/character/puppet2d/lamp1/demo/bilabial.js,
// kept as is: word-initial b / bh / p / m and Roman bb / pp / mm / mb / mp). Measured on the 24-line Diya battery
// (battery.mjs, 2026-10-10): with lamp1's rule 121/132 bilabial words sealed; the 11 misses were words where Azure's
// track held no viseme 21 and the b / m / p was single and inside or at the end of the word (Ab, tum, hum, dhoop,
// carbon, about, lagbhag, खुशबू, Shabash, vaashpikaran). This adds, ONLY in a word Azure gave no 21 and lamp1's rule did
// not seal, one 21 per b / m / p letter: at the letter's share of the word's duration, or 45 ms before the word's end for a
// word-final letter. "ph" stays Azure's (Hinglish [pʰ] vs English [f]). Pure; the input is not mutated.
import { addBilabials } from "../../src/face-puppet/visemes.ts";
const DEV = /[पबभम]/u;
export function addBilabials2(visemes, words) {
  const base = addBilabials(visemes, words);
  if (!words || !words.length) return base;
  const out = base.slice();
  const has21 = (a, b) => base.some((v) => v.id === 21 && v.ms >= a && v.ms <= b);
  for (const w of words) {
    const raw = String(w.text || "").normalize("NFC");
    if (has21(w.ms - 60, w.ms + w.durMs)) continue;
    const dev = /[ऀ-ॿ]/u.test(raw);
    const letters = dev ? [...raw].filter((c) => /[ऀ-ॿ]/u.test(c)) : [...raw.toLowerCase().replace(/[^a-z]/g, "")];
    const n = letters.length;
    for (let i = 0; i < n; i++) {
      const c = letters[i];
      const bil = dev ? DEV.test(c) : (c === "b" || c === "m" || (c === "p" && letters[i + 1] !== "h"));
      if (!bil) continue;
      let at = i === n - 1 ? w.ms + w.durMs - 45 : Math.round(w.ms + w.durMs * ((i + 0.5) / n));
      const prev = out.filter((v) => v.ms <= at).reduce((a, v) => Math.max(a, v.ms), -Infinity);
      if (at - prev < 15) at = prev + 15;
      out.push({ ms: at, id: 21 });
    }
  }
  out.sort((a, b) => a.ms - b.ms);
  return out;
}
