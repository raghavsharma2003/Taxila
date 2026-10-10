// r4-latency: the per-stage turn table from a first-sound run (evals/relational-human/first-sound.mjs --out file.json).
// Every number is ms after the child's speech end (page clock of the harness), except the "server" rows, which are ms
// after the /turn request arrived (lessonTurn's own marks, server/brain/turn.js mark()), and the model rows, which are
// call durations (server/azure.js trace entries).
//
//   node evals/latency/stages.mjs run.json [more.json ...] [--md]
import fs from "fs";

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const MD = process.argv.includes("--md");
const rows = files.flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8")).rows ?? []);
const q = (v, p) => v[Math.min(v.length - 1, Math.floor(p * (v.length - 1) + 0.5))];
const stat = (vals) => {
  const v = vals.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? { n: v.length, p50: q(v, 0.5), p90: q(v, 0.9), min: v[0], max: v.at(-1) } : null;
};
const table = [];
const add = (label, vals) => { const s = stat(vals); if (s) table.push([label, s]); };

add("end of speech → server VAD stop", rows.map((r) => r.endpoint));
add("→ final transcript", rows.map((r) => r.finalAfterEnd));
add("→ turn POST", rows.map((r) => r.turnAfterEnd));
for (const m of ["ctx", "kit", "prefetch_adopted", "classified", "noted", "settled", "planned", "kernel", "replied", "stored"]) {
  add(`  server @${m}`, rows.map((r) => r.marks?.[m]));
}
add("  server total", rows.map((r) => r.serverMs));
add("turn round trip (client)", rows.map((r) => r.director));
add("→ turn response", rows.map((r) => r.turnAfterEnd + r.director));
add("response → first PCM byte", rows.map((r) => r.tts));
add("TTS prewarm age at tts-stream", rows.map((r) => r.ttsPrewarmedMs));
add("→ first PCM byte", rows.map((r) => r.replyFirstByte));
add("→ reply audible (+60 lead +50 nominal out)", rows.map((r) => r.replySound));
add("→ echo audible (played only)", rows.map((r) => r.ackSoundAfterEnd));
add("→ first sound (echo or reply)", rows.map((r) => r.firstSound));
const graded = (r) => /^(correct|incorrect|partial|misconception)\//.test(r.cls ?? "");
add("first sound, graded answers", rows.filter(graded).map((r) => r.firstSound));
add("first sound, non-answers", rows.filter((r) => !graded(r)).map((r) => r.firstSound));
// model calls by deployment (durations)
const byDep = {};
for (const r of rows) for (const c of r.calls ?? []) {
  const k = `${c.dep}${c.spec ? " (speculative)" : ""}${c.pf ? " (prefetch)" : ""}`;
  (byDep[k] ??= []).push(c.ms);
}
for (const [k, v] of Object.entries(byDep).sort()) add(`  model ${k}`, v);

const counts = {
  turns: rows.length,
  speculation: `${rows.filter((r) => r.speculation === "hit").length}/${rows.filter((r) => r.speculation !== "none").length} hit`,
  prefetchAdopted: `${rows.filter((r) => r.prefetched).length}/${rows.length}`,
  rewrites: rows.filter((r) => /rewrit|replaced/.test(r.guard ?? "")).length,
  echoPlayed: `${rows.filter((r) => r.ackPlayed).length}/${rows.filter(graded).length} graded`,
  under900: `${rows.filter((r) => r.replySound <= 900).length}/${rows.length} reply ≤ 900 ms`,
};
if (MD) {
  console.log("| stage | n | p50 | p90 | min | max |\n|---|---|---|---|---|---|");
  for (const [l, s] of table) console.log(`| ${l.trim()} | ${s.n} | ${s.p50} | ${s.p90} | ${s.min} | ${s.max} |`);
} else {
  console.log(`${"stage".padEnd(48)}   n    p50    p90    min    max`);
  for (const [l, s] of table) console.log(`${l.padEnd(48)} ${String(s.n).padStart(3)} ${String(s.p50).padStart(6)} ${String(s.p90).padStart(6)} ${String(s.min).padStart(6)} ${String(s.max).padStart(6)}`);
}
console.log(JSON.stringify(counts));
