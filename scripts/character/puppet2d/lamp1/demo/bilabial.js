// Bilabial closures from the word text (round 4, lamp1). Measured on Diya DragonHD reading a romanised Hinglish line
// (scratch tts/line-marks.json, 2026-10-10): of 9 words with a b / m / p sound, Azure's viseme track held a viseme 21
// (p b m) for 5 (mazedaar, dabbe, mein x2, phir) and none for 4 (baarah, pencil, dabbon, batao), so the mouth never sealed
// on them although the rig seals on every 21 it is given (gap 0.00 px at each). This adds the missing seal from the word
// boundary + the word's letters, only where Azure gave the word no 21 at all:
//   - a word-initial b / bh / p / m (Roman) or प ब भ म (Devanagari): one 21 at the word start - 20 ms (Azure's own seals sit
//     30 ms before to 10 ms after the word start on this line);
//   - else a word-internal bb / pp / mm / mb / mp: one 21 at the letter's share of the word's duration.
// "ph" is left to Azure (Hinglish "phir" is [pʰ], English "phone" is [f]). Pure; the input is not mutated.
const ONSET_ROMAN = /^(?:bh|b|p(?!h)|m)/;
const ONSET_DEV = /^[पबभम]/u;
const INNER_ROMAN = /(?:bb|pp|mm|mb|mp)/;
export function addBilabials(visemes, words) {
  if (!words || !words.length) return visemes.slice();
  const out = visemes.slice();
  const has21 = (a, b) => visemes.some((v) => v.id === 21 && v.ms >= a && v.ms <= b);
  for (const w of words) {
    const raw = String(w.text || "").normalize("NFC");
    const dev = /[ऀ-ॿ]/u.test(raw);
    const r = dev ? raw : raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!r || has21(w.ms - 60, w.ms + w.durMs)) continue;
    let at = null;
    if (dev ? ONSET_DEV.test(r) : ONSET_ROMAN.test(r)) at = w.ms - 20;
    else if (!dev) { const m = INNER_ROMAN.exec(r); if (m) at = Math.round(w.ms + w.durMs * ((m.index + 1) / r.length)); }
    if (at == null) continue;
    // never on top of another event: 15 ms clear of its neighbours
    const prev = out.filter((v) => v.ms <= at).reduce((a, v) => Math.max(a, v.ms), -Infinity);
    if (at - prev < 15) at = prev + 15;
    out.push({ ms: at, id: 21 });
  }
  out.sort((a, b) => a.ms - b.ms);
  return out;
}
