// analyze.mjs — stt-v3 open-weight bench: scores the GPU job's raw rows with the repo's EXISTING STT scorer
// (docs/research/voice/v2/stt/score.mjs + evals/model-refresh-2026-10-04/stt/score2.mjs) and puts them next to the
// 2026-10-04 refresh rows for D4 (current production lane), S0/X2 (MAI-Transcribe-2) and G3, which were scored by the
// same functions on the same 180 + 12 clips. Deterministic; no model scores.
//
//   node evals/stt-v3/analyze.mjs <job-results-dir>     (dir holding <arm>/{rows,paced}.jsonl, load.json, soak.json, env.json)
// Writes evals/stt-v3/results/{rows-stt-v3.json, summary-stt-v3.json, tables-stt-v3.md}.
import fs from "node:fs"; import path from "node:path";
import { STIMULI, DECOYS } from "../../docs/research/voice/v2/stt/stimuli.mjs";
import { scoreOne, decoyHits } from "../../docs/research/voice/v2/stt/score.mjs";
import { numSeq2 } from "../model-refresh-2026-10-04/stt/score2.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const RES = process.argv[2]; if (!RES) { console.error("usage: node analyze.mjs <job-results-dir>"); process.exit(2); }
const OUTD = path.join(HERE, "results"); fs.mkdirSync(OUTD, { recursive: true });
const S = Object.fromEntries(STIMULI.map((s) => [s.id, s]));
const jl = (f) => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const js = (f) => fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
const mean = (a) => { const b = a.filter((x) => x != null && !Number.isNaN(x)); return b.length ? b.reduce((x, y) => x + y, 0) / b.length : null; };
const pct = (a, p) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : null; };
const wilson = (k, n, z = 1.2816) => { if (!n) return [null, null]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [+((c - h) / d).toFixed(3), +((c + h) / d).toFixed(3)]; };
const cnt = (a) => { const b = a.filter((x) => x !== null && x !== undefined); return { k: b.filter(Boolean).length, n: b.length }; };
const f3 = (x) => x == null ? null : +x.toFixed(3);
const hasText = (t) => (t || "").replace(/[^\p{L}\p{N}]/gu, "").length > 0;

// ---- refresh baselines (already scored by probe.mjs score; same scorer) ----
const REF_KEEP = ["D4", "S0", "X2", "G3"];
const refRows = JSON.parse(fs.readFileSync(path.join(HERE, "../model-refresh-2026-10-04/stt/results/rows-2026-10-04.json"), "utf8"))
  .filter((r) => REF_KEEP.includes(r.cfg.split(" ")[0])).map((r) => ({ ...r, source: "refresh-2026-10-04" }));

// ---- open arms ----
const arms = fs.readdirSync(RES).filter((d) => fs.existsSync(path.join(RES, d, "rows.jsonl"))).sort();
const ns12 = (c) => /^n(0[1-9]|1[0-2])-/.test(c);
// labels corrected after a run (the transformers "offline" Nemotron path still uses the processor's default 3-frame lookahead)
const RENAME = { "O-NOhi nemotron-3.5 offline (full context) hi-IN": "O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead)" };
function scoreRow(r0) {
  const r = { ...r0, cfg: RENAME[r0.cfg] || r0.cfg };
  const [id, src, arm] = r.clip.split("-"); const base = { clip: r.clip, cfg: r.cfg, text: r.text || "", err: r.err, id, src, arm, source: "stt-v3" };
  if (id.startsWith("n") || id.startsWith("b")) return { ...base, cat: id.startsWith("b") ? "babble" : "nonspeech", ns12: ns12(r.clip), halluc: hasText(r.text) };
  const sc = scoreOne(S[id], r.text || ""); const { script, ...rest } = sc;
  return { ...base, cat: S[id].cat, ...rest, wrongScript: script?.wrongScript ?? null, numSeq2OK: numSeq2(S[id].ref, r.text || ""), decoys: decoyHits(DECOYS, r.text),
    reqMs: r.reqMs ?? null, rtf: r.rtf ?? null, algoFirstPartialMs: r.algoFirstPartialMs ?? null, algoLastTextMs: r.algoLastTextMs ?? null };
}
const openRows = []; const meta = {};
for (const a of arms) {
  const rows = jl(path.join(RES, a, "rows.jsonl")); const paced = jl(path.join(RES, a, "paced.jsonl"));
  const env = js(path.join(RES, a, "env.json")), load = js(path.join(RES, a, "load.json")), soak = js(path.join(RES, a, "soak.json"));
  for (const r of rows) openRows.push(scoreRow(r));
  meta[a] = { cfg: RENAME[rows[0]?.cfg] || rows[0]?.cfg, env, load, soak, paced };
}
const allRows = [...refRows, ...openRows];
fs.writeFileSync(path.join(OUTD, "rows-stt-v3.json"), JSON.stringify(openRows));

function cell(g) {
  const ok = g.filter((r) => !r.err);
  const num = cnt(ok.map((r) => r.numSeqOK)), num2 = cnt(ok.map((r) => r.numSeq2OK)), ans = cnt(ok.map((r) => r.answer));
  return { n: g.length, errs: g.length - ok.length, cerNorm: f3(mean(ok.map((r) => r.cerNorm))), werNorm: f3(mean(ok.map((r) => r.werNorm))), werRaw: f3(mean(ok.map((r) => r.werRaw))),
    keyRecall: f3(mean(ok.map((r) => r.keyRecall))), numSeq: num, numSeq80: wilson(num.k, num.n), numSeq2: num2, answers: ans, answers80: wilson(ans.k, ans.n),
    wrongScript: ok.filter((r) => r.wrongScript).length, decoys: ok.reduce((a, r) => a + (r.decoys?.length || 0), 0) };
}
const cfgs = [...new Set(allRows.map((r) => r.cfg))];
const BASE = cfgs.find((c) => c.startsWith("D4"));
function paired(cfg) {
  const by = (c) => { const m = {}; for (const r of allRows) if (r.cfg === c && !["nonspeech", "babble"].includes(r.cat) && !r.err) (m[r.id] ??= []).push(r.cerNorm); return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, mean(v)])); };
  const a = by(cfg), b = by(BASE); const ids = Object.keys(b).filter((k) => a[k] != null); const d = ids.map((k) => a[k] - b[k]);
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31; const boots = [];
  for (let i = 0; i < 4000; i++) { let s = 0; for (let j = 0; j < d.length; j++) s += d[Math.floor(rnd() * d.length)]; boots.push(s / d.length); } boots.sort((x, y) => x - y);
  return { items: ids.length, armBetter: d.filter((x) => x < -1e-9).length, armWorse: d.filter((x) => x > 1e-9).length, meanDeltaCER: f3(mean(d)), ci95: [f3(boots[100]), f3(boots[3899])], ci80: [f3(boots[400]), f3(boots[3599])] };
}
const SUM = { date: new Date().toISOString().slice(0, 10), base: BASE, resultsDir: RES, overall: {}, byArm: {}, byCat: {}, nonspeech12: {}, nonspeech30: {}, babble: {}, latency: {}, pairedVsBase: {}, load: {}, soak: {}, env: {} };
for (const c of cfgs) {
  const R = allRows.filter((r) => r.cfg === c), sp = R.filter((r) => !["nonspeech", "babble"].includes(r.cat));
  SUM.overall[c] = cell(sp);
  for (const arm of ["clean", "white", "pink"]) SUM.byArm[`${c} | ${arm}`] = cell(sp.filter((r) => r.arm === arm));
  for (const cat of ["hinglish", "hindi", "english", "hesitant"]) SUM.byCat[`${c} | ${cat}`] = cell(sp.filter((r) => r.cat === cat));
  const nsAll = R.filter((r) => r.cat === "nonspeech" && !r.err);
  const n12 = nsAll.filter((r) => ns12(r.clip)), bab = R.filter((r) => r.cat === "babble" && !r.err);
  const ns = (g) => ({ n: g.length, halluc: g.filter((r) => r.halluc).length, wilson80: wilson(g.filter((r) => r.halluc).length, g.length), texts: g.filter((r) => r.halluc).map((r) => `${r.clip}: ${r.text}`.slice(0, 120)) });
  SUM.nonspeech12[c] = ns(n12); if (nsAll.length > n12.length) SUM.nonspeech30[c] = ns(nsAll); if (bab.length) SUM.babble[c] = ns(bab);
  if (c !== BASE) SUM.pairedVsBase[c] = paired(c);
  if (R[0]?.source === "refresh-2026-10-04") {
    SUM.latency[c] = { source: "refresh 2026-10-04 (all 180 clips, real-time paced over the network from a US container)", finalAfterEndP50: pct(sp.map((r) => r.finalAfterEndMs), 0.5), finalAfterEndP90: pct(sp.map((r) => r.finalAfterEndMs), 0.9), firstPartialP50: pct(sp.map((r) => r.firstPartialMs), 0.5) };
  }
}
for (const a of arms) {
  const m = meta[a], c = m.cfg; const sp = m.paced.filter((r) => !r.err && !/^[nb]/.test(r.clip));
  const rows = openRows.filter((r) => r.cfg === c && !["nonspeech", "babble"].includes(r.cat));
  if (sp.length) SUM.latency[c] = { source: "stt-v3 paced (60 clean clips, audio fed at real time on the GPU host; no network)", n: sp.length,
    firstPartialP50: pct(sp.map((r) => r.firstPartialMs), 0.5), lastTextP50: pct(sp.map((r) => r.lastTextMs), 0.5), lastTextP90: pct(sp.map((r) => r.lastTextMs), 0.9),
    doneP50: pct(sp.map((r) => r.doneMs), 0.5), partialGapP50: pct(sp.map((r) => r.partialGapP50Ms), 0.5), partialsP50: pct(sp.map((r) => r.partials), 0.5),
    chunkLagP50: pct(sp.map((r) => r.chunkLagP50Ms), 0.5), algoLastTextP50: pct(rows.map((r) => r.algoLastTextMs), 0.5), algoFirstPartialP50: pct(rows.map((r) => r.algoFirstPartialMs), 0.5) };
  else if (rows.some((r) => r.reqMs != null)) SUM.latency[c] = { source: "stt-v3 batch: final = 600 ms endpoint hangover + request time (refresh convention for batch engines); GPU host, batch 1, no network",
    reqP50: pct(rows.map((r) => r.reqMs), 0.5), reqP90: pct(rows.map((r) => r.reqMs), 0.9), finalAfterEndP50: 600 + (pct(rows.map((r) => r.reqMs), 0.5) ?? 0), finalAfterEndP90: 600 + (pct(rows.map((r) => r.reqMs), 0.9) ?? 0), rtfP50: pct(rows.map((r) => r.rtf), 0.5) };
  SUM.load[c] = m.load; SUM.soak[c] = m.soak;
  SUM.env[c] = m.env && { model: m.env.model, env: m.env.env, accuracy: m.env.accuracy, peakGB: m.env.peakGB, totalS: m.env.totalS };
}
fs.writeFileSync(path.join(OUTD, "summary-stt-v3.json"), JSON.stringify(SUM, null, 1));

// ---- tables ----
const L = []; const p = (s) => L.push(s); const fr = (o) => o ? `${o.k}/${o.n}` : "-"; const iv = (w) => w ? `[${w[0]}, ${w[1]}]` : "";
const order = (c) => (c.startsWith("O-") ? 1 : 0);
const sorted = [...cfgs].sort((a, b) => order(a) - order(b) || REF_KEEP.indexOf(a.split(" ")[0]) - REF_KEEP.indexOf(b.split(" ")[0]) || a.localeCompare(b));
p("| arm | cerNorm | werNorm | werRaw | keyRecall | numbers (v2) | numbers (R4-fixed) | answers | wrong script | decoys | non-speech n12 | non-speech n30 | babble (reversed speech) |");
p("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const c of sorted) { const o = SUM.overall[c]; const a = SUM.nonspeech12[c], b = SUM.nonspeech30[c], d = SUM.babble[c];
  p(`| ${c} | ${o.cerNorm} | ${o.werNorm} | ${o.werRaw} | ${o.keyRecall} | ${fr(o.numSeq)} ${iv(o.numSeq80)} | ${fr(o.numSeq2)} | ${fr(o.answers)} ${iv(o.answers80)} | ${o.wrongScript} | ${o.decoys} | ${a ? `${a.halluc}/${a.n}` : "-"} | ${b ? `${b.halluc}/${b.n} ${iv(b.wilson80)}` : "-"} | ${d ? `${d.halluc}/${d.n}` : "-"} |${o.errs ? ` errs ${o.errs}` : ""}`); }
p("\n| arm | items better / worse vs D4 | mean dCER (arm - D4) | 80% CI | 95% CI |\n|---|---|---|---|---|");
for (const c of sorted) { const q = SUM.pairedVsBase[c]; if (q) p(`| ${c} | ${q.armBetter} / ${q.armWorse} | ${q.meanDeltaCER} | ${iv(q.ci80)} | ${iv(q.ci95)} |`); }
p("\n| arm | clean | white 10 dB | pink 10 dB |\n|---|---|---|---|");
for (const c of sorted) { const g = (a) => { const o = SUM.byArm[`${c} | ${a}`]; return `${o.cerNorm} / ${fr(o.numSeq)}`; }; p(`| ${c} | ${g("clean")} | ${g("white")} | ${g("pink")} |`); }
p("\n| arm | hinglish | hindi | english | hesitant |\n|---|---|---|---|---|");
for (const c of sorted) { const b = (k) => { const o = SUM.byCat[`${c} | ${k}`]; return `${o.cerNorm}; ans ${fr(o.answers)}; script ${o.wrongScript}`; }; p(`| ${c} | ${b("hinglish")} | ${b("hindi")} | ${b("english")} | ${b("hesitant")} |`); }
p("\n**Latency** (ms; streaming = wall clock with audio fed at real time; lastText = when the transcript last changed, relative to speech end)\n");
p("| arm | source | first partial p50 | last text p50 / p90 | stream done p50 | partial gap p50 | algorithmic last text p50 (audio clock) | final after end p50 / p90 (refresh / batch convention) |\n|---|---|---|---|---|---|---|---|");
for (const c of sorted) { const l = SUM.latency[c]; if (!l) continue; p(`| ${c} | ${l.source.split(" (")[0]} | ${l.firstPartialP50 ?? "-"} | ${l.lastTextP50 != null ? `${l.lastTextP50} / ${l.lastTextP90}` : "-"} | ${l.doneP50 ?? "-"} | ${l.partialGapP50 ?? "-"} | ${l.algoLastTextP50 ?? "-"} | ${l.finalAfterEndP50 != null ? `${l.finalAfterEndP50} / ${l.finalAfterEndP90}` : "-"} |`); }
p("\n**Concurrency on one GPU** (streaming: B synchronous streams batched per chunk step; batch: B utterances per call)\n");
p("| arm | GPU | mode | chunk ms | B: step p50/p95 ms (RTF p95) or latency p50 ms (throughput audio-s/s) | max B at RTF p95 <= 1 | paced at that B: lag p50 / p95 / first-third vs last-third p50 ms | peak GB |\n|---|---|---|---|---|---|---|---|");
for (const c of sorted) { const l = SUM.load[c]; if (!l) continue; const gpu = SUM.env[c]?.env?.gpu || "?";
  const lv = (l.levels || []).map((x) => x.err ? `B${x.B}: ${x.err.slice(0, 40)}` : l.mode?.startsWith("batched-sync") ? `B${x.B}: ${x.stepP50Ms}/${x.stepP95Ms} (${x.rtfP95})` : `B${x.B}: ${x.latP50Ms} (${x.throughputAudioSPerS})`).join("; ");
  const pa = l.pacedAtBest; const pk = Math.max(...(l.levels || []).map((x) => x.peakGB || 0));
  p(`| ${c} | ${gpu} | ${l.mode} | ${l.chunkMs ?? "-"} | ${lv} | ${l.maxBAtRtfP95le1 ?? "-"} | ${pa ? (pa.err ? pa.err.slice(0, 60) : `B${pa.B}: ${pa.lagP50Ms} / ${pa.lagP95Ms} / ${pa.lagFirstThirdP50} vs ${pa.lagLastThirdP50}`) : "-"} | ${pk || "-"} |`); }
p("\n**Always-on soak** (one stream; corpus utterances separated by 4-25 s of non-speech; characters emitted outside speech windows)\n");
p("| arm | minutes | utterances | chars outside speech | chars inside | examples outside |\n|---|---|---|---|---|---|");
for (const c of sorted) { const s = SUM.soak[c]; if (!s) continue; p(`| ${c} | ${s.minutes} | ${s.utterances} | ${s.err ? "ERR " + s.err.slice(0, 60) : s.charsOutsideSpeech} | ${s.charsInsideSpeech ?? "-"} | ${(s.outsidePieces || []).slice(0, 4).map((x) => `${x[0]}s ${JSON.stringify(x[1])}`).join("; ")} |`); }
p("\n**Non-speech outputs (any text = hallucination)**\n");
for (const c of sorted) { for (const [k, o] of [["n30", SUM.nonspeech30[c]], ["babble", SUM.babble[c]], ["n12", SUM.nonspeech30[c] ? null : SUM.nonspeech12[c]]]) if (o?.texts?.length) p(`- ${c} [${k}]: ${o.texts.map((t) => JSON.stringify(t)).join("; ")}`); }
fs.writeFileSync(path.join(OUTD, "tables-stt-v3.md"), L.join("\n") + "\n");
console.log(L.join("\n"));
