// Speech scout 2026-10-04: scores every Amazon Transcribe arm on the stt-hinglish v2 corpus with the SAME deterministic
// scorer (docs/research/voice/v2/stt/score.mjs) and prints the 2026-10-02 Azure arms (D4 live-transcribe, R4, C1) beside it.
// Inputs: ../../model-refresh-2026-10-04/scout/results/transcribe-rows.jsonl (T1 hi-IN, T2 en-IN; same day, same script
// lineage) + results/transcribe-rows.jsonl (T3 multi-LID, T4 single LID, T5 hi-IN+vocab, L1/L3 latency controls).
// Adds what the scout scorer left out: decoy insertions, fillers kept, by-category/by-source cells, non-speech output,
// and per-clip PAIRED cerNorm vs D4 and R4. Output: results/transcribe-scored.json
import fs from "node:fs";
import { STIMULI, DECOYS } from "../../../docs/research/voice/v2/stt/stimuli.mjs";
import { scoreOne, decoyHits } from "../../../docs/research/voice/v2/stt/score.mjs";
const here = (p) => new URL(p, import.meta.url).pathname;
const read = (p) => fs.readFileSync(here(p), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const raw = [...read("../../model-refresh-2026-10-04/scout/results/transcribe-rows.jsonl").filter((r) => !r.cfg.startsWith("T3")), ...read("results/transcribe-rows.jsonl")];
const S = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
const rows = raw.map((r) => { const [id, src, arm] = r.clip.split("-"); const base = { ...r, id, src, arm, cat: id.startsWith("n") ? "nonspeech" : S[id].cat };
  if (id.startsWith("n")) return { ...base, halluc: (r.text || "").replace(/[^\p{L}\p{N}]/gu, "").length > 0 };
  return { ...base, ...scoreOne(S[id], r.text || ""), decoys: decoyHits(DECOYS, r.text || "") }; });
const mean = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)); return b.length ? +(b.reduce((x, y) => x + y, 0) / b.length).toFixed(3) : null; };
const pct = (a, p) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : null; };
const frac = (a) => { const b = a.filter((x) => x !== null && x !== undefined); return b.length ? `${b.filter(Boolean).length}/${b.length}` : null; };
const cell = (g) => { const ok = g.filter((r) => !r.err); return { n: g.length, errs: g.length - ok.length, cerNorm: mean(ok.map((r) => r.cerNorm)), werNorm: mean(ok.map((r) => r.werNorm)), werRaw: mean(ok.map((r) => r.werRaw)),
  keyRecall: mean(ok.map((r) => r.keyRecall)), numSeq: frac(ok.map((r) => r.numSeqOK)), answers: frac(ok.map((r) => r.answer)), fillerKept: frac(ok.map((r) => r.fillerKept)), wrongScript: ok.filter((r) => r.script?.wrongScript).length,
  decoys: ok.reduce((a, r) => a + (r.decoys?.length || 0), 0), decoyTexts: ok.filter((r) => r.decoys?.length).map((r) => `${r.clip}: ${r.decoys.join(",")}`),
  firstPartialP50: pct(ok.map((r) => r.firstPartialMs), 0.5), finalAfterEndP50: pct(ok.map((r) => r.finalAfterEndMs), 0.5), finalAfterEndP90: pct(ok.map((r) => r.finalAfterEndMs), 0.9) }; };
const ref = JSON.parse(fs.readFileSync(here("../../../docs/research/voice/v2/stt/results-2026-10-02.json"), "utf8"));
const refRows = (cfg) => Object.fromEntries(ref.rows.filter((r) => r.cfg === cfg).map((r) => [r.clip, r]));
const D4 = refRows("D4 live-transcribe kw+scriptprompt"), R4 = refRows("R4 azure-rt LID(hi,en)+phrases");
const agg = { overall: {}, byArm: {}, byCat: {}, bySrc: {}, nonspeech: {}, paired: {}, langs: {} };
for (const cfg of [...new Set(rows.map((r) => r.cfg))].sort()) {
  const R = rows.filter((r) => r.cfg === cfg), sp = R.filter((r) => r.cat !== "nonspeech");
  agg.overall[cfg] = cell(sp);
  if (cfg.startsWith("L")) continue;
  for (const a of ["clean", "white", "pink"]) agg.byArm[`${cfg} | ${a}`] = cell(sp.filter((r) => r.arm === a));
  for (const c of ["hinglish", "hindi", "english", "hesitant"]) agg.byCat[`${cfg} | ${c}`] = cell(sp.filter((r) => r.cat === c));
  for (const s of ["G", "Z"]) agg.bySrc[`${cfg} | ${s}`] = cell(sp.filter((r) => r.src === s));
  const ns = R.filter((r) => r.cat === "nonspeech"); agg.nonspeech[cfg] = { n: ns.length, halluc: ns.filter((r) => r.halluc).length, texts: ns.filter((r) => r.halluc).map((r) => r.text) };
  for (const [nm, RR] of [["D4", D4], ["R4", R4]]) { let better = 0, worse = 0, same = 0, numOnlyAws = 0, numOnlyRef = 0;
    for (const r of sp) { const o = RR[r.clip]; if (!o || r.err) continue; const d = r.cerNorm - o.cerNorm; if (d < -1e-9) better++; else if (d > 1e-9) worse++; else same++;
      if (r.numSeqOK === true && o.numSeqOK === false) numOnlyAws++; if (r.numSeqOK === false && o.numSeqOK === true) numOnlyRef++; }
    agg.paired[`${cfg} vs ${nm}`] = { awsLowerCER: better, awsHigherCER: worse, equal: same, numbersRightOnlyAws: numOnlyAws, numbersRightOnlyRef: numOnlyRef }; }
  agg.langs[cfg] = Object.entries(sp.reduce((m, r) => { const k = (r.langs || []).join("+") || "-"; m[k] = (m[k] || 0) + 1; return m; }, {}));
}
const refAgg = Object.fromEntries(["D4 live-transcribe kw+scriptprompt", "R4 azure-rt LID(hi,en)+phrases", "C1 azure-fast hi-IN+en-IN", "R1 azure-rt hi-IN"].map((k) => [k, ref.agg.overall[k]]));
const refByCat = Object.fromEntries(Object.entries(ref.agg.byCat).filter(([k]) => k.startsWith("D4") || k.startsWith("R4")));
const audioMin = rows.reduce((a, r) => a + (r.audioSec || 0), 0) / 60;
fs.writeFileSync(here("results/transcribe-scored.json"), JSON.stringify({ date: "2026-10-04", from: "US cloud container (agent proxy) -> Transcribe streaming ap-south-1, 100 ms PCM chunks at real time", audioMinutesStreamed: +audioMin.toFixed(1), agg, refAgg, refByCat, rows }, null, 1));
const brief = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { cer: v.cerNorm, wer: v.werNorm, werRaw: v.werRaw, key: v.keyRecall, num: v.numSeq, ans: v.answers, ws: v.wrongScript, dec: v.decoys, fill: v.fillerKept, p1: v.firstPartialP50, f50: v.finalAfterEndP50, f90: v.finalAfterEndP90, err: v.errs }]));
console.table(brief(agg.overall)); console.table(brief(refAgg)); console.log(JSON.stringify(agg.nonspeech)); console.table(agg.paired); console.table(brief(agg.byCat)); console.table(brief(refByCat)); console.table(brief(agg.bySrc)); console.log(JSON.stringify(agg.langs)); console.log("audio min", audioMin.toFixed(1));
for (const v of Object.values(agg.overall)) if (v.decoyTexts?.length) console.log(v.decoyTexts);
