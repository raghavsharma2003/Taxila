// songs-chant-rescore.mjs — re-run ASR on the probe's saved clips with the language pinned (hi / en),
// because unpinned gpt-4o-transcribe returned Urdu/Bengali/Gurmukhi/Korean script for Hindi audio,
// which confounds a Devanagari key match. Writes rescore fields into songs-chant-probe-2026-10-02.json.
// Run: set -a; . /home/user/Taxila/.env.local; set +a; NODE_USE_ENV_PROXY=1 node songs-chant-rescore.mjs
import { readFileSync, writeFileSync } from "node:fs";
const KEY = process.env.AZURE_OPENAI_API_KEY, OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const J = "./songs-chant-probe-2026-10-02.json", j = JSON.parse(readFileSync(J, "utf8"));
const KEYS = {
  "t2-1": [["दो"], ["एकम", "एकम्", "इकम"]], "t2-2": [["दूनी", "दुनी", "दूनि"], ["चार"]], "t2-3": [["तिया", "तीया", "तियां", "तिय"], ["छह", "छः", "छे", "छै", "छ"]],
  "t2-4": [["चौके", "चौका", "चौक"], ["आठ"]], "vm-1": [["क"], ["ख"], ["ग"], ["घ"], ["ङ", "अंग", "ंग"]], "en-1": [["mercury"], ["venus"], ["earth"], ["mars"]] };
const norm = (t) => t.toLowerCase().normalize("NFC").replace(/[़]/g, "").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ");
const tok = (t) => norm(t).split(/\s+/).filter(Boolean);
for (const r of j.rows) {
  if (r.err) continue;
  const w = readFileSync(`./songs-chant-probe-2026-10-02/${r.arm}_${r.line}_${r.rep}.wav`);
  const fd = new FormData(); fd.append("file", new Blob([w], { type: "audio/wav" }), "a.wav"); fd.append("language", r.line === "en-1" ? "en" : "hi");
  const res = await fetch(`${OAI.replace(/\/openai\/v1$/, "")}/openai/deployments/taxila-transcribe/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd });
  const text = res.ok ? (await res.json()).text : `HTTP ${res.status}`;
  // varnamala: letters must arrive as separate tokens (a run-together "कखगघ" is the failure we care about)
  const keys = KEYS[r.line];
  const recall = r.line === "vm-1" ? keys.filter((alts) => tok(text).some((t) => alts.includes(t))).length / keys.length
    : keys.filter((alts) => alts.some((a) => norm(text).includes(norm(a)))).length / keys.length;
  r.asrHi = text; r.recallHi = recall; console.log(r.arm, r.line, r.rep, recall, "|", text);
}
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor((s.length - 1) / 2)]; };
for (const arm of Object.keys(j.summary)) {
  const R = j.rows.filter((x) => x.arm === arm && !x.err);
  j.summary[arm].recallHiMean = +(R.reduce((s, x) => s + x.recallHi, 0) / R.length).toFixed(3);
  j.summary[arm].fullRecallHi = R.filter((x) => x.recallHi === 1).length;
  j.summary[arm].tableFullRecallHi = R.filter((x) => x.line.startsWith("t2") && x.recallHi === 1).length + "/" + R.filter((x) => x.line.startsWith("t2")).length;
  j.summary[arm].varnamalaSeparateLettersMean = +(R.filter((x) => x.line === "vm-1").reduce((s, x) => s + x.recallHi, 0) / 3).toFixed(2);
}
writeFileSync(J, JSON.stringify(j, null, 1));
for (const [a, s] of Object.entries(j.summary)) console.log(a, s.recallHiMean, s.fullRecallHi, s.tableFullRecallHi, s.varnamalaSeparateLettersMean);
