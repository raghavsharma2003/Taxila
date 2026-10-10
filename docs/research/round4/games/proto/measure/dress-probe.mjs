// Can an Azure model write the prototype's spec delta, and how fast? (FEASIBILITY.md §3.1, §5.2)
//   node --env-file=.env.local docs/research/round4/games/proto/measure/dress-probe.mjs [n=12]
// One strict-json_schema call per lesson context on the background twin of the reply deployment (as the round-3 probe,
// docs/design/round3/game/concepts/live-tech-probe/delta-probe.mjs), effort none. The model sees the lesson state and
// picks ENUMS only; code validates with the same cleanDress() the game uses. No key or endpoint is ever printed.
import { chat, normUsage } from "../../../../../../server/azure.js";
import { writeFileSync, readFileSync } from "node:fs";
import { cleanDress } from "../director.js";

const N = Number(process.argv[2] ?? 12), DEP = process.env.PROBE_DEP || "taxila-fast-bg";
const schema = JSON.parse(readFileSync(new URL("../specs/dress.schema.json", import.meta.url), "utf8"));
delete schema.$schema; delete schema.$id; delete schema.title; delete schema.description;
const sys = [
  "ROLE dress picker for a live lesson game; code already built the level and owns every number and word",
  "OUT one JSON object; enums only",
  "FIT theme and wrapper to the child's interests and mood; music off when the child is anxious or the family prefers quiet",
  "lang follows the child's language in the lesson; ghost-first only for a first time in this engine or after two stalls",
  "NEVER pick anything to make the child play longer; never reward, compete or hurry",
].join("\n");
const cases = [
  { class: 5, said: "game khelna hai, space wala", interests: ["cricket", "space"], lesson_lang: "hinglish", mood: "keen", first_time_engine: false, misconception: "c5-maths-ch02-t01-m-count-marks" },
  { class: 4, said: "मुझे समझ नहीं आया", interests: ["drawing"], lesson_lang: "hi", mood: "anxious", first_time_engine: true, misconception: null },
  { class: 7, said: "this is too easy, give me something harder", interests: ["football", "racing"], lesson_lang: "en", mood: "bored", first_time_engine: false, misconception: null },
  { class: 6, said: "haan theek hai, chalo", interests: ["cooking"], lesson_lang: "hinglish", mood: "tired", first_time_engine: false, misconception: "c5-maths-ch02-t01-m-all-less-than-one" },
];
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rows = [];
for (let i = 0; i < N; i++) {
  const c = cases[i % cases.length];
  const user = JSON.stringify({ engine: "antariksh-nishana", skill: "c5-maths-ch02-t01 fractions on the number line", ...c });
  const t0 = performance.now(); let r = null, err = null;
  try { r = await chat(DEP, [{ role: "system", content: sys }, { role: "user", content: user }], { schema, schemaName: "dress", maxTokens: 300, effort: "none", timeoutMs: 20000, retries: 0, quotaLane: "background" }); }
  catch (e) { err = String(e?.code || e?.status || e?.message || e).slice(0, 80); }
  const ms = Math.round(performance.now() - t0), u = normUsage(r?.usage), j = r?.json ?? null;
  const { dress, dropped } = cleanDress(j);
  rows.push({ i, case: i % cases.length, ms, err, out: u?.out ?? null, in: u?.in ?? null, raw: j, dropped, dress });
  process.stdout.write(`${i} ${ms}ms out=${u?.out} ${err ? "ERR " + err : dropped.length ? "dropped " + dropped : "ok"} ${j ? JSON.stringify(j) : ""}\n`);
  await new Promise((res) => setTimeout(res, 400));
}
const ok = rows.filter((r) => !r.err && r.raw);
const summary = { dep: DEP, effort: "none", n: rows.length, errors: rows.length - ok.length, valid: ok.filter((r) => !r.dropped.length).length,
  ms_p50: q(ok.map((r) => r.ms), 0.5), ms_p90: q(ok.map((r) => r.ms), 0.9), ms_max: Math.max(...ok.map((r) => r.ms)), out_p50: q(ok.map((r) => r.out), 0.5),
  langFollowed: ok.filter((r) => r.raw.lang === cases[r.case].lesson_lang).length, musicOffWhenAnxious: ok.filter((r) => cases[r.case].mood === "anxious").map((r) => r.raw.music),
  at: new Date().toISOString(), from: "US sandbox -> eastus2, sequential, 400 ms gap" };
writeFileSync(new URL("../results/dress-probe.json", import.meta.url), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary));
