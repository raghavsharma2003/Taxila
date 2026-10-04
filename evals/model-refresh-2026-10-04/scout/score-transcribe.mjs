// Scores results/transcribe-rows.jsonl with the stt-hinglish v2 scorer (docs/research/voice/v2/stt/score.mjs),
// same cell() metrics as probe.mjs, and prints the 2026-10-02 reference arms beside it.
import fs from "node:fs";
import { STIMULI, DECOYS } from "../../../docs/research/voice/v2/stt/stimuli.mjs";
import { scoreOne, decoyHits } from "../../../docs/research/voice/v2/stt/score.mjs";
const here = (p) => new URL(p, import.meta.url).pathname;
const raw = fs.readFileSync(here("results/transcribe-rows.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const S = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
const rows = raw.map((r) => { const [id, src, arm] = r.clip.split("-"); const base = { ...r, id, src, arm, cat: id.startsWith("n") ? "nonspeech" : S[id].cat };
  if (id.startsWith("n")) return { ...base, halluc: (r.text || "").replace(/[^\p{L}\p{N}]/gu, "").length > 0 };
  return { ...base, ...scoreOne(S[id], r.text || ""), decoys: decoyHits(DECOYS, r.text) }; });
const mean = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)); return b.length ? +(b.reduce((x, y) => x + y, 0) / b.length).toFixed(3) : null; };
const pct = (a, p) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : null; };
const frac = (a) => { const b = a.filter((x) => x !== null && x !== undefined); return b.length ? `${b.filter(Boolean).length}/${b.length}` : null; };
const cell = (g) => { const ok = g.filter((r) => !r.err); return { n: g.length, errs: g.length - ok.length, werNorm: mean(ok.map((r) => r.werNorm)), cerNorm: mean(ok.map((r) => r.cerNorm)),
  keyRecall: mean(ok.map((r) => r.keyRecall)), numSeq: frac(ok.map((r) => r.numSeqOK)), answers: frac(ok.map((r) => r.answer)), wrongScript: ok.filter((r) => r.script?.wrongScript).length,
  firstPartialP50: pct(ok.map((r) => r.firstPartialMs), 0.5), finalAfterEndP50: pct(ok.map((r) => r.finalAfterEndMs), 0.5), finalAfterEndP90: pct(ok.map((r) => r.finalAfterEndMs), 0.9) }; };
const agg = { overall: {}, byArm: {}, nonspeech: {} };
for (const cfg of [...new Set(rows.map((r) => r.cfg))]) {
  const R = rows.filter((r) => r.cfg === cfg), sp = R.filter((r) => r.cat !== "nonspeech");
  agg.overall[cfg] = cell(sp); for (const a of ["clean", "white", "pink"]) agg.byArm[`${cfg} | ${a}`] = cell(sp.filter((r) => r.arm === a));
  const ns = R.filter((r) => r.cat === "nonspeech"); agg.nonspeech[cfg] = { n: ns.length, halluc: ns.filter((r) => r.halluc).length, texts: ns.filter((r) => r.halluc).map((r) => r.text) };
}
const ref = JSON.parse(fs.readFileSync(here("../../../docs/research/voice/v2/stt/results-2026-10-02.json"), "utf8")).agg.overall;
fs.writeFileSync(here("results/transcribe-scored-2026-10-04.json"), JSON.stringify({ date: "2026-10-04", from: "US container -> ap-south-1 Transcribe streaming, real-time pace", agg, rows }, null, 1));
console.table(Object.fromEntries(Object.entries(agg.overall)));
console.table(Object.fromEntries(Object.entries(ref).map(([k, v]) => [k, { n: v.n, werNorm: v.werNorm, cerNorm: v.cerNorm, keyRecall: v.keyRecall, numSeq: v.numSeq, answers: v.answers, wrongScript: v.wrongScript, finalAfterEndP50: v.finalAfterEndP50 }])));
console.log(JSON.stringify(agg.nonspeech)); console.table(agg.byArm);
