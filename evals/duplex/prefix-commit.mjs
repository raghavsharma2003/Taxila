// prefix-commit.mjs — Study B (duplex models & papers), measurement M-B1, 2026-10-04.
//
// Question: if the teacher decided a child's numeric answer MID-UTTERANCE (the "answer before the sentence ends" behaviour
// that SHANKS / duplex models / PredGen-style speculation make possible), how often would the early verdict be wrong, and
// how many words of the child's turn would it save?
//
// Method (deterministic, no model calls, no network):
//   corpus  = the 15 gradable child-answer stimuli in docs/research/voice/v2/stt/stimuli.mjs (those with `ans`), as
//             (a) the reference text and (b) every final transcript of those clips from the production STT arm
//             (D4 live-tx kw+prompt) and MAI-Transcribe-2-Streaming (S0) in the 2026-10-04 refresh rows (clean, child, tv arms).
//   values  = the repo's existing extractor `extractValues()` (docs/research/voice/v2/stt/score.mjs): numbers + "a बटा b" fractions.
//   truth   = the answer graded on the WHOLE utterance by the repo's `answerOK()` rule, i.e. the value the grader would use.
//   prefix  = the first k words of the transcript (word-level partial; real streaming partials are noisier, so this is a
//             LOWER bound on early-commit error).
//   policies:
//     P1 "first value"  — commit to the first gradable value heard (what an eager mid-utterance answerer does).
//     P2 "latest value" — at each word, the current last value; measure the earliest word after which it never changes
//                         again (the stable point) and how many words remain after it (the saving a perfect oracle gets).
// Output: evals/duplex/results/prefix-commit-2026-10-04.json  (+ a printed table).
// Limits: text prefixes, not audio timing; synthetic child TTS clips (no real children yet: E1 pending); n is small.
import fs from "node:fs"; import path from "node:path";
import { STIMULI } from "../../docs/research/voice/v2/stt/stimuli.mjs";
import { extractValues } from "../../docs/research/voice/v2/stt/score.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const rowsFile = path.join(HERE, "../model-refresh-2026-10-04/stt/results/rows-2026-10-04.json");
const ARMS = ["D4 live-tx kw+prompt (CURRENT)", "S0 MAI-Tx-2-Streaming nohint"];
const gradable = STIMULI.filter((s) => s.ans);
const byId = Object.fromEntries(gradable.map((s) => [s.id, s]));

const SEP = new Set(["बटा", "बटे", "by", "upon", "over", "/", "batta", "bata", "बाय", "into", "times", "सत्ते", "दूनी"]);
const words = (t) => String(t || "").replace(/[।.,!?]/g, " ").split(/\s+/).filter(Boolean);
const finalValue = (spec, vals) => (vals.length ? (spec.last ? vals.at(-1) : (vals.find((v) => String(v) === String(spec.want)) ?? vals.at(-1))) : null);

function analyse(spec, text) {
  const w = words(text); const n = w.length;
  const full = extractValues(text); const truth = finalValue(spec, full);
  let first = null, firstAt = null, stableAt = null, firstConf = null, firstConfAt = null;
  const seq = [];
  for (let k = 1; k <= n; k++) {
    const v = extractValues(w.slice(0, k).join(" "));
    const cur = v.length ? v.at(-1) : null;
    if (cur !== null && first === null) { first = cur; firstAt = k; }
    // P1b: a value counts as heard only once the NEXT word adds no number or fraction separator (one-word lookahead)
    if (firstConf === null && k >= 2) {
      const before = extractValues(w.slice(0, k - 1).join(" "));
      const nextWord = w[k - 1];
      const nextIsNumOrSep = SEP.has(nextWord.toLowerCase()) || extractValues(nextWord).length > 0;
      if (before.length && !nextIsNumOrSep && JSON.stringify(v) === JSON.stringify(before)) { firstConf = before.at(-1); firstConfAt = k; }
    }
    seq.push(cur);
  }
  // stable point: earliest k such that seq[k..n] all equal truth
  for (let k = n; k >= 1; k--) { if (String(seq[k - 1]) === String(truth)) stableAt = k; else break; }
  return {
    n, truth, first, firstAt,
    p1Wrong: first !== null && truth !== null && String(first) !== String(truth),
    firstConf, firstConfAt, p1bWrong: firstConf !== null && truth !== null && String(firstConf) !== String(truth),
    p1bWordsSaved: firstConfAt ? n - firstConfAt : 0,
    stableAt, wordsSavedOracle: stableAt ? n - stableAt : 0,
    fracAtStable: stableAt ? +(stableAt / n).toFixed(3) : null,
    gradedRight: truth !== null && String(truth) === String(spec.want),
  };
}

const cases = [];
for (const s of gradable) cases.push({ src: "ref", id: s.id, cat: s.cat, text: s.ref, ...analyse(s.ans, s.ref) });
if (fs.existsSync(rowsFile)) {
  const rows = JSON.parse(fs.readFileSync(rowsFile, "utf8"));
  for (const r of rows) {
    if (!ARMS.includes(r.cfg)) continue;
    const [id, , arm] = String(r.clip).split("-");
    const s = byId[id]; if (!s || !r.text) continue;
    cases.push({ src: r.cfg.split(" ")[0] + ":" + arm, id, cat: s.cat, text: r.text, ...analyse(s.ans, r.text) });
  }
}

const summ = (g) => {
  const ok = g.filter((c) => c.truth !== null);
  const wrong = ok.filter((c) => c.p1Wrong).length;
  const saved = ok.map((c) => c.wordsSavedOracle).sort((a, b) => a - b);
  const frac = ok.map((c) => c.fracAtStable).filter((x) => x != null).sort((a, b) => a - b);
  const med = (a) => (a.length ? a[Math.floor(a.length / 2)] : null);
  const wrongB = ok.filter((c) => c.p1bWrong).length;
  return { n: ok.length, p1FirstValueWrong: wrong, p1WrongRate: ok.length ? +(wrong / ok.length).toFixed(3) : null,
    p1bConfirmedWrong: wrongB, p1bWrongRate: ok.length ? +(wrongB / ok.length).toFixed(3) : null,
    p1bWordsSavedMedian: med(ok.map((c) => c.p1bWordsSaved).sort((a, b) => a - b)),
    gradedRight: ok.filter((c) => c.gradedRight).length,
    oracleWordsSavedMedian: med(saved), oracleWordsSavedMean: saved.length ? +(saved.reduce((a, b) => a + b, 0) / saved.length).toFixed(2) : null,
    stableFracMedian: med(frac), zeroSaving: ok.filter((c) => c.wordsSavedOracle === 0).length };
};
const groups = {};
for (const c of cases) { const k = c.src.startsWith("ref") ? "ref" : c.src.split(":")[0]; (groups[k] ||= []).push(c); }
const byCat = {};
for (const c of cases.filter((x) => x.src === "ref" || x.src.startsWith("D4"))) (byCat[c.cat] ||= []).push(c);

const out = {
  measurement: "M-B1 prefix-commit", date: "2026-10-04", method: "word-prefix replay of child-answer transcripts through the repo's extractValues(); see header",
  summary: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, summ(g)])),
  byCategory_refPlusD4: Object.fromEntries(Object.entries(byCat).map(([k, g]) => [k, summ(g)])),
  p1WrongCases_ref: cases.filter((c) => c.src === "ref" && c.p1Wrong).map((c) => ({ id: c.id, text: c.text, first: c.first, firstConfirmed: c.firstConf, truth: c.truth })),
  noValueOnWholeUtterance_ref: gradable.filter((s) => !extractValues(s.ref).length).map((s) => s.id),
  cases: cases.map(({ text, ...r }) => r),
};
fs.mkdirSync(path.join(HERE, "results"), { recursive: true });
fs.writeFileSync(path.join(HERE, "results/prefix-commit-2026-10-04.json"), JSON.stringify(out, null, 1));
console.table(out.summary); console.table(out.byCategory_refPlusD4); console.log(JSON.stringify(out.p1WrongCases_ref)); console.log(out.noValueOnWholeUtterance_ref);
