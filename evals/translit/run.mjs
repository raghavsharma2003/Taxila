// run.mjs — word-level accuracy of server/voice/translit on real Director replies (gold: label.mjs + adjudicate.mjs).
//   node evals/translit/run.mjs [--split test|dev|all] [--write]
// Scored per word, exact match after norm() (spelling variants a voice says identically are folded, norm.mjs):
//   word accuracy           every word: output == gold (Latin kept counts as "=")
//   convert P / R           did the step convert exactly the words gold converts (Hindi) and keep the rest
//   hindi exact             among gold-Hindi words, Devanagari spelled right
//   english kept            among gold-keep words, left in Latin (an English word in Devanagari is the expensive error)
//   number words            among gold Hindi number words (cardinals, scale, ordinal and fraction words), spelled right
//   safety untouched        replies carrying a helpline / identity line, byte-identical after the step
//   µs per reply            mean wall time of toDevanagari over the split (single thread, warm)
// Arms: none = lexicon only (unknown words stay Latin), rules = lexicon + heuristic classifier + rule transliteration,
// model = lexicon + char n-gram naive Bayes classifier (dev-trained) + rule transliteration.
import fs from "node:fs";
import path from "node:path";
import { words } from "./tokens.mjs";
import { norm } from "./norm.mjs";
import { analyze, toDevanagari, safetyText } from "../../server/voice/translit/index.js";
import { NUMBER_WORDS } from "../../server/voice/translit/numbers.js";
import { WORDS } from "../../server/voice/spoken-lexicon.js";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SPLIT = arg("--split", "test");
const corpus = JSON.parse(fs.readFileSync(path.join(HERE, "data/corpus.json"), "utf8"));
const gold = JSON.parse(fs.readFileSync(path.join(HERE, "data/gold.json"), "utf8")).rows;
const NUMSET = new Set([...Object.values(NUMBER_WORDS), ...WORDS.hi.below100, "सौ", "हज़ार", "लाख", "करोड़"].map(norm));
const rows = corpus.rows.filter((r) => gold[r.id] && (SPLIT === "all" || gold[r.id].split === SPLIT));

function score(fallback) {
  const c = { words: 0, correct: 0, goldHi: 0, outHi: 0, bothHi: 0, hiExact: 0, goldKeep: 0, keptKeep: 0, num: 0, numOk: 0, numMiss: [], errs: new Map() };
  for (const r of rows) {
    const g = gold[r.id].labels;
    const ws = words(r.text);
    const an = analyze(r.text, { fallback });
    const byPos = new Map(an.map((a) => [a.i, a]));
    ws.forEach((x, k) => {
      const gl = g[k]; if (gl == null) return;
      const a = byPos.get(x.i);
      const out = a && a.out !== a.w ? a.out : "=";
      c.words++;
      const ok = norm(out) === norm(gl);
      if (ok) c.correct++;
      const gHi = gl !== "=", oHi = out !== "=";
      if (gHi) c.goldHi++; if (oHi) c.outHi++;
      if (gHi && oHi) c.bothHi++;
      if (gHi && ok) c.hiExact++;
      if (!gHi) { c.goldKeep++; if (!oHi) c.keptKeep++; }
      if (gHi && NUMSET.has(norm(gl))) { c.num++; if (ok) c.numOk++; else c.numMiss.push(`${x.w}→${out} (gold ${gl})`); }
      if (!ok) { const key = `${x.w.toLowerCase()} → ${out} | gold ${gl} [${a?.kind}]`; c.errs.set(key, (c.errs.get(key) ?? 0) + 1); }
    });
  }
  const pct = (a, b) => (b ? +(100 * a / b).toFixed(1) : null);
  return {
    fallback, replies: rows.length, words: c.words,
    wordAcc: pct(c.correct, c.words), convertP: pct(c.bothHi, c.outHi), convertR: pct(c.bothHi, c.goldHi),
    hindiExact: pct(c.hiExact, c.goldHi), englishKept: pct(c.keptKeep, c.goldKeep),
    numberWords: `${c.numOk}/${c.num}`, numberAcc: pct(c.numOk, c.num), numMiss: c.numMiss.slice(0, 20),
    topErrors: [...c.errs].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, n]) => `${n} ${k}`),
  };
}

// safety: every reply in the whole corpus that the predicate calls safety must come back byte-identical
let safetyN = 0, safetySame = 0;
for (const r of corpus.rows) {
  if (!safetyText(r.text)) continue;
  safetyN++;
  if (toDevanagari(r.text, { force: true, mode: "hinglish" }) === r.text) safetySame++;
}
// timing
const t0 = performance.now();
for (let k = 0; k < 3; k++) for (const r of rows) toDevanagari(r.text, { force: true, mode: "hinglish" });
const usPerReply = +((performance.now() - t0) * 1000 / (rows.length * 3)).toFixed(1);

const res = { date: new Date().toISOString().slice(0, 10), split: SPLIT, arms: [score("none"), score("rules"), score("model")], safety: { replies: safetyN, untouched: safetySame }, usPerReply };
for (const a of res.arms) {
  console.log(`\n[${a.fallback}] split=${SPLIT} replies=${a.replies} words=${a.words}  wordAcc ${a.wordAcc}%  convert P ${a.convertP}% R ${a.convertR}%  hindiExact ${a.hindiExact}%  englishKept ${a.englishKept}%  numbers ${a.numberWords} (${a.numberAcc}%)`);
  if (process.argv.includes("--errors")) { console.log(a.topErrors.join("\n")); console.log("num misses:", a.numMiss.join("; ")); }
}
console.log(`\nsafety replies untouched: ${safetySame}/${safetyN}   µs/reply: ${usPerReply}`);
if (process.argv.includes("--write")) fs.writeFileSync(path.join(HERE, `results/translit-${SPLIT}-${res.date}.json`), JSON.stringify(res, null, 1));
