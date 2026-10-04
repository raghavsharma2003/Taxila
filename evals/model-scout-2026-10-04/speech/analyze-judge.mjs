// Aggregates results/judge.json: per arm mean humanlike / emotion_fit / pitch_movement over 5 lines x 2 judgments,
// glitch and spoken-direction counts, ASR recall + leaks; pairwise Polly-vs-Diya net score (+1 per position the
// judge prefers Polly, -1 per position it prefers Diya; range -10..+10 per comparison over 5 lines).
import fs from "node:fs";
const R = JSON.parse(fs.readFileSync(new URL("./results/judge.json", import.meta.url), "utf8"));
const arms = [...new Set(Object.keys(R).filter((k) => !k.startsWith("__")).map((k) => k.split("__")[0]))];
const m = (a) => { const b = a.filter((x) => typeof x === "number"); return b.length ? +(b.reduce((x, y) => x + y, 0) / b.length).toFixed(2) : null; };
const out = { perArm: {}, pairs: {} };
for (const arm of arms) {
  const cs = Object.entries(R).filter(([k]) => k.startsWith(arm + "__")).map(([, v]) => v);
  const js = cs.flatMap((c) => [c.judge0, c.judge1]).filter((j) => j && !j.error);
  out.perArm[arm] = { clips: cs.length, judgments: js.length, humanlike: m(js.map((j) => j.humanlike)), emotion_fit: m(js.map((j) => j.emotion_fit)), pitch_movement: m(js.map((j) => j.pitch_movement)),
    glitch: js.filter((j) => j.glitch === true).length, spokenDirection: js.filter((j) => j.spoken_direction === true).length, asrRecall: m(cs.map((c) => c.recall)), asrLeaks: cs.filter((c) => c.leak).length,
    glitchDesc: js.filter((j) => j.glitch === true).map((j) => j.glitch_desc).filter(Boolean) };
}
for (const [k, v] of Object.entries(R.__pairs || {})) { const [polly, , ref, line] = k.split("__"); const key = `${polly} vs ${ref}`;
  out.pairs[key] ??= { lines: 0, net: 0, pollyWins: 0, diyaWins: 0, ties: 0, byLine: {} };
  const p = out.pairs[key]; p.lines++; p.net += v.pollyScore; p.byLine[line] = [v.ab?.winner, v.ba?.winner, v.pollyScore];
  for (const [w, pollyIs] of [[v.ab?.winner, "A"], [v.ba?.winner, "B"]]) { if (!w || w === "tie") p.ties++; else if (w === pollyIs) p.pollyWins++; else p.diyaWins++; } }
console.table(Object.fromEntries(Object.entries(out.perArm).map(([k, v]) => [k, { ...v, glitchDesc: undefined }])));
console.log(JSON.stringify(out.perArm, null, 0).slice(0, 2000)); console.log(JSON.stringify(out.pairs, null, 1));
fs.writeFileSync(new URL("./results/judge-summary.json", import.meta.url), JSON.stringify({ date: "2026-10-04", judge: "gpt-realtime-2.1 taxila-realtime via voice-probe/rtjudge.mjs (calibrated 11/16, weak instrument)", ...out }, null, 1));
