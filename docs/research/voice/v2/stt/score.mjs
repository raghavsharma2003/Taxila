// score.mjs (stt-hinglish v2) — deterministic, no model scores. Reuses the E0 script-agnostic skeleton
// (Devanagari / Nastaliq / Latin → one consonant space) and adds:
//   werRaw   exact-script WER vs canonical code-mix ref (fillers removed both sides, digits → spoken form)
//   werNorm  WER over per-word skeleton tokens (Devanagari↔Roman normalised; "teen" = "तीन")
//   cerNorm  skeleton CER with spaces removed (robust to "carbon dioxide" vs "कार्बनडाइऑक्साइड")
//   keyRecall / keyRawRecall, numSeqOK (every number in order), answer (graded value), fillerKept
import { normText, skeleton, scriptProfile, keyHit, rawKeyHit } from "../../asr-e0/score.mjs";
import { NUM, FILLERS } from "./stimuli.mjs";

const ALIAS = {};
for (const [v, forms] of Object.entries(NUM)) ALIAS[v] = [...new Set([...forms, String(v)].map(normText))];
const FRAC_SEP = new Set(["बटा", "बटे", "by", "upon", "over", "/", "batta", "bata", "बाय", "بٹا"]);
const FILL = new Set(FILLERS.map(normText));

const lev = (a, b) => {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
};
const dropFill = (t) => t.split(" ").filter((w) => w && !FILL.has(w) && !/^(u+m+|h+m+|अ+ं+)$/.test(w)).join(" ");

// digits → the spoken form the reference uses (so "15" vs "पंद्रह" is not an error); "3/4" → "तीन बटा चार"
export function numNormalize(hyp, ref) {
  const r = " " + normText(ref) + " ";
  const spoken = (d) => { const f = ALIAS[d]; if (!f) return d; return f.find((x) => !/^\d+$/.test(x) && r.includes(" " + x + " ")) || f.find((x) => !/^\d+$/.test(x)) || d; };
  return normText(hyp).replace(/(\d+) \/ (\d+)/g, (_m, a, b) => `${a} ${r.includes(" बटा ") ? "बटा" : "by"} ${b}`)
    .replace(/\b\d+\b/g, spoken);
}
export function extractValues(text) {
  const toks = normText(text).split(" ").filter(Boolean); const vals = [];
  for (let i = 0; i < toks.length; i++) {
    const two = i + 1 < toks.length ? toks[i] + " " + toks[i + 1] : null; let hit = null, span = 1;
    if (two) for (const [v, f] of Object.entries(ALIAS)) if (f.includes(two)) { hit = +v; span = 2; break; }
    if (hit === null) for (const [v, f] of Object.entries(ALIAS)) if (f.includes(toks[i])) { hit = +v; break; }
    if (hit !== null) { vals.push({ v: hit }); i += span - 1; } else if (FRAC_SEP.has(toks[i])) vals.push({ sep: true });
  }
  const out = [];
  for (let k = 0; k < vals.length; k++) {
    if (vals[k].v !== undefined && vals[k + 1]?.sep && vals[k + 2]?.v !== undefined) { out.push(`${vals[k].v}/${vals[k + 2].v}`); k += 2; }
    else if (vals[k].v !== undefined) out.push(String(vals[k].v));
  }
  return out;
}
export function answerOK(spec, hyp) {
  if (!spec) return null; const v = extractValues(hyp); const eq = (a, b) => String(a) === String(b);
  if (spec.last) return v.length > 0 && eq(v[v.length - 1], spec.want);
  return v.some((x) => eq(x, spec.want)) && !v.some((x) => spec.not.some((n) => eq(x, n)));
}
export function scoreOne(stim, hypRaw = "") {
  const ref = dropFill(normText(stim.ref)), hyp = dropFill(numNormalize(hypRaw, stim.ref));
  const rw = ref.split(" ").filter(Boolean), hw = hyp.split(" ").filter(Boolean);
  const rs = rw.map(skeleton).filter(Boolean), hs = hw.map(skeleton).filter(Boolean);
  const rc = [...rs.join("")], hc = [...hs.join("")];
  const refVals = extractValues(stim.ref), hypVals = extractValues(hypRaw);
  const hasFill = normText(stim.ref).split(" ").some((w) => FILL.has(w));
  return {
    werRaw: +(lev(rw, hw) / rw.length).toFixed(3),
    werNorm: +(lev(rs, hs) / rs.length).toFixed(3),
    cerNorm: +(lev(rc, hc) / rc.length).toFixed(3),
    keyRecall: +(stim.keys.filter((k) => keyHit(k, hyp)).length / stim.keys.length).toFixed(3),
    keyRawRecall: +(stim.keys.filter((k) => rawKeyHit(k, hyp)).length / stim.keys.length).toFixed(3),
    numSeqOK: refVals.length ? JSON.stringify(refVals) === JSON.stringify(hypVals) : null,
    answer: answerOK(stim.ans, hypRaw),
    fillerKept: hasFill ? normText(hypRaw).split(" ").some((w) => FILL.has(w) || /^(u+m+|h+m+)$/.test(w)) : null,
    script: scriptProfile(hypRaw),
  };
}
export const decoyHits = (decoys, hyp) => decoys.filter((d) => keyHit(d, hyp || ""));
