// analyze.mjs — aggregates results/rows-2026-10-04.json (from `probe.mjs score`) into results/summary-2026-10-04.json
// and prints markdown tables. Deterministic; no model.
//   node analyze.mjs [prevRowsJsonl]   (optional: the 2026-10-02 rows.jsonl for the D4 run-to-run check)
import fs from "node:fs"; import path from "node:path";
import { STIMULI, DECOYS } from "../../../docs/research/voice/v2/stt/stimuli.mjs";
import { scoreOne, decoyHits } from "../../../docs/research/voice/v2/stt/score.mjs";
import { numSeq2 } from "./score2.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const rows = JSON.parse(fs.readFileSync(path.join(HERE, "results", "rows-2026-10-04.json"), "utf8"));
const cfgs = [...new Set(rows.map((r) => r.cfg))];
const ORDER = ["D4", "D1", "D2", "D0", "S0", "S1", "X2", "X2k", "X15", "X15k", "W0", "W1", "G0", "G3", "A0", "A3", "B0", "B3", "C1", "R4"];
cfgs.sort((a, b) => ORDER.indexOf(a.split(" ")[0]) - ORDER.indexOf(b.split(" ")[0]));
const BASE = cfgs.find((c) => c.startsWith("D4"));

const mean = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)); return b.length ? b.reduce((x, y) => x + y, 0) / b.length : null; };
const pct = (a, p) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : null; };
// Wilson score interval; z = 1.2816 for 80 %
const wilson = (k, n, z = 1.2816) => { if (!n) return [null, null]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [+((c - h) / d).toFixed(3), +((c + h) / d).toFixed(3)]; };
const cnt = (a) => { const b = a.filter((x) => x !== null && x !== undefined); return { k: b.filter(Boolean).length, n: b.length }; };
const f3 = (x) => x == null ? null : +x.toFixed(3);

function cell(g) {
  const ok = g.filter((r) => !r.err);
  const num = cnt(ok.map((r) => r.numSeqOK)), num2 = cnt(ok.map((r) => r.numSeq2OK)), ans = cnt(ok.map((r) => r.answer));
  return { n: g.length, errs: g.length - ok.length, cerNorm: f3(mean(ok.map((r) => r.cerNorm))), werNorm: f3(mean(ok.map((r) => r.werNorm))), werRaw: f3(mean(ok.map((r) => r.werRaw))),
    keyRecall: f3(mean(ok.map((r) => r.keyRecall))), numSeq: num, numSeq80: wilson(num.k, num.n), numSeq2: num2, numSeq2_80: wilson(num2.k, num2.n), answers: ans, answers80: wilson(ans.k, ans.n),
    wrongScript: ok.filter((r) => r.wrongScript).length, decoys: ok.reduce((a, r) => a + (r.decoys?.length || 0), 0), fillerKept: cnt(ok.map((r) => r.fillerKept)),
    firstPartialP50: pct(ok.map((r) => r.firstPartialMs), 0.5), finalAfterEndP50: pct(ok.map((r) => r.finalAfterEndMs), 0.5), finalAfterEndP90: pct(ok.map((r) => r.finalAfterEndMs), 0.9),
    afterCommitP50: pct(ok.map((r) => r.afterCommitMs), 0.5), reqMsP50: pct(ok.map((r) => r.reqMs), 0.5), reqMsP90: pct(ok.map((r) => r.reqMs), 0.9) };
}
// item-level paired bootstrap of mean CER difference (arm - base), items = 30 sentences (6 clips each)
function paired(cfg) {
  const by = (c) => { const m = {}; for (const r of rows) if (r.cfg === c && r.cat !== "nonspeech" && !r.err) (m[r.id] ??= []).push(r.cerNorm); return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, mean(v)])); };
  const a = by(cfg), b = by(BASE); const ids = Object.keys(b).filter((k) => a[k] != null);
  const d = ids.map((k) => a[k] - b[k]); let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
  const boots = []; for (let i = 0; i < 4000; i++) { let s = 0; for (let j = 0; j < d.length; j++) s += d[Math.floor(rnd() * d.length)]; boots.push(s / d.length); } boots.sort((x, y) => x - y);
  // clip-level discordance on numbers (v2 metric and numSeq2)
  const key = (r) => r.clip; const A = new Map(rows.filter((r) => r.cfg === cfg && !r.err).map((r) => [key(r), r])), B = new Map(rows.filter((r) => r.cfg === BASE && !r.err).map((r) => [key(r), r]));
  let armOnly = 0, baseOnly = 0, armOnly2 = 0, baseOnly2 = 0; for (const [k, rb] of B) { const ra = A.get(k); if (!ra || rb.numSeqOK == null) continue; if (ra.numSeqOK && !rb.numSeqOK) armOnly++; if (!ra.numSeqOK && rb.numSeqOK) baseOnly++; if (ra.numSeq2OK && !rb.numSeq2OK) armOnly2++; if (!ra.numSeq2OK && rb.numSeq2OK) baseOnly2++; }
  return { items: ids.length, armBetter: d.filter((x) => x < -1e-9).length, armWorse: d.filter((x) => x > 1e-9).length, meanDeltaCER: f3(mean(d)),
    ci95: [f3(boots[100]), f3(boots[3899])], ci80: [f3(boots[400]), f3(boots[3599])], numbersArmOnly: armOnly, numbersBaseOnly: baseOnly, numbers2ArmOnly: armOnly2, numbers2BaseOnly: baseOnly2 };
}

const S = { date: "2026-10-04", base: BASE, overall: {}, byArm: {}, bySrc: {}, byCat: {}, nonspeech: {}, pairedVsBase: {}, cleanPink: {} };
for (const c of cfgs) {
  const R = rows.filter((r) => r.cfg === c), sp = R.filter((r) => r.cat !== "nonspeech");
  S.overall[c] = cell(sp); S.cleanPink[c] = cell(sp.filter((r) => r.arm !== "white"));
  for (const arm of ["clean", "white", "pink"]) S.byArm[`${c} | ${arm}`] = cell(sp.filter((r) => r.arm === arm));
  for (const src of ["G", "Z"]) S.bySrc[`${c} | ${src}`] = cell(sp.filter((r) => r.src === src));
  for (const cat of ["hinglish", "hindi", "english", "hesitant"]) S.byCat[`${c} | ${cat}`] = cell(sp.filter((r) => r.cat === cat));
  const ns = R.filter((r) => r.cat === "nonspeech" && !r.err), h = ns.filter((r) => r.halluc).length;
  S.nonspeech[c] = { n: ns.length, errs: R.filter((r) => r.cat === "nonspeech" && r.err).length, halluc: h, wilson80: wilson(h, ns.length), texts: ns.filter((r) => r.halluc).map((r) => `${r.clip}: ${r.text}`.slice(0, 140)) };
  if (c !== BASE) S.pairedVsBase[c] = paired(c);
}
// run-to-run: today's D4 vs the 2026-10-02 D4 on the identical PCM
const prev = process.argv[2];
if (prev && fs.existsSync(prev)) {
  const St = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
  const old = fs.readFileSync(prev, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.cfg.startsWith("D4") && !r.err && !r.clip.startsWith("n"));
  const oldBy = new Map(old.map((r) => [r.clip, r])); const now = rows.filter((r) => r.cfg === BASE && r.cat !== "nonspeech" && !r.err);
  let same = 0, n = 0; const oc = [], nc = []; let on = 0, nn = 0, oa = 0, na = 0;
  for (const r of now) { const o = oldBy.get(r.clip); if (!o) continue; n++; if ((o.text || "").trim() === (r.text || "").trim()) same++; const so = scoreOne(St[r.id], o.text || ""); oc.push(so.cerNorm); nc.push(r.cerNorm); if (so.numSeqOK) on++; if (r.numSeqOK) nn++; if (so.answer) oa++; if (r.answer) na++; }
  S.d4RunToRun = { n, identicalText: same, cerOld: f3(mean(oc)), cerNow: f3(mean(nc)), numbersOld: on, numbersNow: nn, answersOld: oa, answersNow: na };
}
fs.writeFileSync(path.join(HERE, "results", "summary-2026-10-04.json"), JSON.stringify(S, null, 1));

const fr = (o) => `${o.k}/${o.n}`; const iv = (w) => `[${w[0]}, ${w[1]}]`;
console.log("| arm | cerNorm | werNorm | werRaw | keyRecall | numbers (v2) | numbers (R4-fixed) | answers | wrong script | decoys | non-speech output | final after speech end p50 / p90 |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const c of cfgs) { const o = S.overall[c], ns = S.nonspeech[c];
  console.log(`| ${c} | ${o.cerNorm} | ${o.werNorm} | ${o.werRaw} | ${o.keyRecall} | ${fr(o.numSeq)} ${iv(o.numSeq80)} | ${fr(o.numSeq2)} | ${fr(o.answers)} ${iv(o.answers80)} | ${o.wrongScript} | ${o.decoys} | ${ns.halluc}/${ns.n} | ${o.finalAfterEndP50} / ${o.finalAfterEndP90}${o.errs ? ` (errs ${o.errs})` : ""} |`); }
console.log("\n| arm | items better / worse vs D4 | mean dCER (arm - D4) | 80% CI | 95% CI | numbers: arm-only / D4-only (v2; fixed) |\n|---|---|---|---|---|---|");
for (const [c, p] of Object.entries(S.pairedVsBase)) console.log(`| ${c} | ${p.armBetter} / ${p.armWorse} | ${p.meanDeltaCER} | ${iv(p.ci80)} | ${iv(p.ci95)} | ${p.numbersArmOnly} / ${p.numbersBaseOnly}; ${p.numbers2ArmOnly} / ${p.numbers2BaseOnly} |`);
console.log("\n| arm | clean | white 10 dB | pink 10 dB | clean+pink CER / numbers |\n|---|---|---|---|---|");
for (const c of cfgs) { const g = (a) => { const o = S.byArm[`${c} | ${a}`]; return `${o.cerNorm} / ${fr(o.numSeq)}`; }; const cp = S.cleanPink[c]; console.log(`| ${c} | ${g("clean")} | ${g("white")} | ${g("pink")} | ${cp.cerNorm} / ${fr(cp.numSeq)} |`); }
console.log("\n| arm | G cer | Z cer | hinglish | hindi | english | hesitant |\n|---|---|---|---|---|---|---|");
for (const c of cfgs) { const b = (k) => S.byCat[`${c} | ${k}`]; const ct = (k) => `${b(k).cerNorm}; ${fr(b(k).answers)}`; console.log(`| ${c} | ${S.bySrc[`${c} | G`].cerNorm} | ${S.bySrc[`${c} | Z`].cerNorm} | ${ct("hinglish")} | ${ct("hindi")} | ${ct("english")} | ${ct("hesitant")} |`); }
console.log("\n| arm | first partial p50 | after commit p50 | request p50 / p90 |\n|---|---|---|---|");
for (const c of cfgs) { const o = S.overall[c]; console.log(`| ${c} | ${o.firstPartialP50} | ${o.afterCommitP50} | ${o.reqMsP50} / ${o.reqMsP90} |`); }
console.log("\nnon-speech:"); for (const c of cfgs) { const ns = S.nonspeech[c]; if (ns.halluc || ns.errs) console.log(c, `${ns.halluc}/${ns.n}`, iv(ns.wilson80), ns.errs ? "errs " + ns.errs : "", JSON.stringify(ns.texts)); }
if (S.d4RunToRun) console.log("\nD4 run-to-run:", JSON.stringify(S.d4RunToRun));
