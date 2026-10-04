// score2.mjs — numSeq2: the v2 number-sequence metric with the scorer artefacts from stt-hinglish review R4
// removed. Primary tables keep v2's numSeq (comparability with 2026-10-02); numSeq2 is reported beside it.
// Changes vs v2 extractValues:
//   - Devanagari-transliterated English numerals count (सेवन = 7, एट = 8, फिफ्टी सिक्स = 56, ...)
//   - "सत्ते" (x7 in a recited times table) and its homophone spellings सप्त/सत्य count as 7 on BOTH sides,
//     so "8 7 56" for "आठ सत्ते छप्पन" passes; plural multipliers ("eights", "एट्स") stay uncounted as in v2
//   - decimals ("0.5") and "half" are not counted as numbers on either side (m09 "half pizza" → "0.5 पिज़्ज़ा")
import { normText } from "../../../docs/research/voice/asr-e0/score.mjs";
import { NUM } from "../../../docs/research/voice/v2/stt/stimuli.mjs";

const EXTRA = { 1: ["वन"], 2: ["टू"], 3: ["थ्री"], 4: ["फोर", "फ़ोर"], 5: ["फाइव"], 6: ["सिक्स"], 7: ["सेवन", "सत्ते", "सप्त", "सत्य"], 8: ["एट"],
  21: ["ट्वेंटी वन"], 24: ["ट्वेंटी फोर"], 56: ["फिफ्टी सिक्स", "fifty-six"] };
const ALIAS = {};
for (const [v, forms] of Object.entries(NUM)) ALIAS[v] = [...new Set([...forms, ...(EXTRA[v] || []), String(v)].map(normText))];
const SEP = new Set(["बटा", "बटे", "by", "upon", "over", "/", "batta", "bata", "बाय", "بٹا"]);
const pre = (t) => normText(String(t).replace(/\d+\.\d+/g, " ").replace(/\bhalf\b|हाफ/gi, " "));
export function values2(text) {
  const toks = pre(text).split(" ").filter(Boolean); const vals = [];
  for (let i = 0; i < toks.length; i++) {
    const two = i + 1 < toks.length ? toks[i] + " " + toks[i + 1] : null; let hit = null, span = 1;
    if (two) for (const [v, f] of Object.entries(ALIAS)) if (f.includes(two)) { hit = +v; span = 2; break; }
    if (hit === null) for (const [v, f] of Object.entries(ALIAS)) if (f.includes(toks[i])) { hit = +v; break; }
    if (hit !== null) { vals.push({ v: hit }); i += span - 1; } else if (SEP.has(toks[i])) vals.push({ sep: true });
  }
  const out = [];
  for (let k = 0; k < vals.length; k++) {
    if (vals[k].v !== undefined && vals[k + 1]?.sep && vals[k + 2]?.v !== undefined) { out.push(`${vals[k].v}/${vals[k + 2].v}`); k += 2; }
    else if (vals[k].v !== undefined) out.push(String(vals[k].v));
  }
  return out;
}
export function numSeq2(ref, hyp) { const r = values2(ref); return r.length ? JSON.stringify(r) === JSON.stringify(values2(hyp)) : null; }
