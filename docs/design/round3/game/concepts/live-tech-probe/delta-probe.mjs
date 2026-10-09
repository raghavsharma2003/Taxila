// r3-game live-tech probe (scratch, not product code): how long does a SMALL "play delta" take on the background
// twin of the reply deployment, versus the measured full-spec rung (RS-4 bench 3.4-7.0 s p50)?
// The model only picks among code-made candidates and dresses them in the child's register; code built the game.
// Usage: node --env-file=.env.local docs/design/round3/game/concepts/live-tech-probe/delta-probe.mjs <arm:none|low> <n> <out.json>
import { chat, normUsage } from "../../../../../../server/azure.js";
import { writeFileSync } from "node:fs";

const [arm = "none", nStr = "12", out = "delta-probe.json"] = process.argv.slice(2);
const N = Number(nStr);
const DEP = process.env.PROBE_DEP || "taxila-fast-bg";

const CANDIDATES = ["rope-field.shape@area-grid", "rope-field.predict@area-grid", "rope-field.spot-slip@area-grid"];
const CONTEXTS = ["kitchen garden", "cricket practice net", "goat pen", "school flower bed", "rangoli border"];
const ROPES = ["16", "20", "24", "28"];
const BEATS = ["predict-build-twist-abstract", "build-twist-predict-abstract", "twist-build-abstract"];
const MOVES = ["ghost_thin_strip", "ghost_square_first", "none"];

const schema = {
  type: "object", additionalProperties: false,
  required: ["pick", "context", "rope_m", "beats", "teacher_move", "goal", "why_prompt"],
  properties: {
    pick: { type: "string", enum: CANDIDATES },
    context: { type: "string", enum: CONTEXTS },
    rope_m: { type: "string", enum: ROPES },
    beats: { type: "string", enum: BEATS },
    teacher_move: { type: "string", enum: MOVES },
    goal: { type: "string", description: "goal line on screen, child's register (Roman Hinglish), <= 48 chars, no answer numbers" },
    why_prompt: { type: "string", description: "one spoken why-question, Roman Hinglish, <= 60 chars" },
  },
};

const sys = [
  "ROLE play-delta picker for a live lesson game; code already built the game",
  "OUT one JSON object; pick only from the enums; no new numbers in strings",
  "REGISTER Roman Hinglish, class 6, respectful, short",
  "NEVER reveal an area value; never mention points, coins, winning against anyone",
].join("\n");

const userCases = [
  { said: "mujhe lagta hai dono ka area same hoga kyunki rassi utni hi hai", interests: ["cricket"], mis: "c6-maths-ch06-t02-m-same-perimeter-area" },
  { said: "perimeter same hai toh area bhi same na?", interests: ["kheti", "cooking"], mis: "c6-maths-ch06-t02-m-same-perimeter-area" },
  { said: "game banao na isse", interests: ["drawing"], mis: null },
  { said: "I think the long thin one is bigger because it is longer", interests: ["football"], mis: "c6-maths-ch06-t02-m-same-perimeter-area" },
];

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rows = [];
for (let i = 0; i < N; i++) {
  const c = userCases[i % userCases.length];
  const user = JSON.stringify({
    topic: "c6-maths-ch06-t02 area; skill s3 same perimeter can mean different area",
    child_said: c.said, interests: c.interests, misconception: c.mis,
    candidates: CANDIDATES, contexts: CONTEXTS, ropes_m: ROPES, beat_patterns: BEATS, teacher_moves: MOVES,
  });
  const t0 = performance.now();
  let r = null, err = null;
  try {
    r = await chat(DEP, [{ role: "system", content: sys }, { role: "user", content: user }], {
      schema, schemaName: "play_delta", maxTokens: arm === "none" ? 300 : 900, effort: arm, timeoutMs: 20000, retries: 0, quotaLane: "background",
    });
  } catch (e) { err = String(e?.code || e?.status || e?.message || e).slice(0, 80); }
  const ms = Math.round(performance.now() - t0);
  const u = normUsage(r?.usage);
  const j = r?.json;
  // code validation (the engine side): enums are guaranteed by strict schema, so check what the schema cannot
  const problems = [];
  if (j) {
    if (j.goal.length > 48) problems.push("goal_len");
    if (j.why_prompt.length > 60) problems.push("why_len");
    if (/\d/.test(j.goal)) problems.push("goal_digit");
    if (/[^\x00-\x7F‘’“”—–]/.test(j.goal + j.why_prompt)) problems.push("non_roman");
    if (/point|coin|score|win|jeet/i.test(j.goal + j.why_prompt)) problems.push("reward_word");
  }
  rows.push({ i, arm, ms, err, out: u?.out ?? null, reasoning: u?.reasoning ?? null, in: u?.in ?? null, usable: !!j && problems.length === 0, problems, j });
  process.stdout.write(`${i} ${ms}ms out=${u?.out} rs=${u?.reasoning} ${err ? "ERR " + err : problems.join(",") || "ok"}\n`);
  await new Promise((res) => setTimeout(res, 400));
}
const ok = rows.filter((r) => !r.err);
const summary = {
  dep: DEP, arm, n: rows.length, errors: rows.length - ok.length,
  ms_p50: q(ok.map((r) => r.ms), 0.5), ms_p90: q(ok.map((r) => r.ms), 0.9), ms_max: Math.max(...ok.map((r) => r.ms)),
  out_p50: q(ok.map((r) => r.out), 0.5), reasoning_p50: q(ok.map((r) => r.reasoning), 0.5),
  usable: rows.filter((r) => r.usable).length, at: new Date().toISOString(), from: "US sandbox -> eastus2, sequential, 400 ms gap",
};
writeFileSync(out, JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary));
