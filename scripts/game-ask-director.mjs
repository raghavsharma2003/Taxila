// Round 5 (14.3, main: "a game ask mounts the topic's engine"): over the c4-c9 maths topics with a topic engine
// (shared/engine-topic-map.json), what does the Director's own pure plan (state.js step, no model, no database) put in
// the tray when the child says "mujhe game khelna hai" at three points of a lesson (the first teaching turn, the third,
// and in practice)? engine = a topic engine mounted (the tray holds something to DO); rung = only the board explainer;
// none = nothing. Run before / after a change to modules.js.
//   node scripts/game-ask-director.mjs [--out file]
import fs from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { requestOf } from "../server/director/requests.js";
import { getTopic } from "../server/content/curriculum.js";

const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
const TOPIC_MAP = JSON.parse(fs.readFileSync("shared/engine-topic-map.json", "utf8"));
const RUNG = "explainer@1";
const ctxOf = (topicId) => { const c = Number(topicId.match(/^c(\d)/)[1]); return { sessionId: `ga-${topicId}`, classLevel: c, firstName: "Kabir", teacherName: "Arjun", teacherId: "arjun",
  protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand: c <= 4 ? "6-9" : "10-15", lang: "hinglish", interests: ["cricket"], address: "aap", firstMeeting: true,
  hasCallback: false, topicTitle: getTopic(topicId)?.title ?? topicId, nextTitle: "x", purpose: "lesson" }; };
const plain = { outcome: "no_evidence", confidence: 1, flags: {} };
const ask = requestOf("mujhe game khelna hai");
const rows = [];
for (let c = 4; c <= 9; c++) {
  const f = `data/kits/c${c}-maths.json`;
  if (!fs.existsSync(f)) continue;
  for (const kit of JSON.parse(fs.readFileSync(f, "utf8")).topics ?? []) {
    const engine = TOPIC_MAP[kit.topicId];
    if (!engine) continue;
    const at = {};
    for (const [label, warm] of [["turn1", 0], ["turn3", 2], ["practice", -1]]) {
      try {
        let r = step(initLessonState({ topicId: kit.topicId, kit, ctx: ctxOf(kit.topicId), seed: 7, now: 0 }), { event: "start", kit, now: 0 });
        let n = 0;
        const more = () => (warm === -1 ? r.state.phase !== "practice" && n < 12 : n < warm);
        while (more()) { r = step(r.state, { event: "turn", kit, cls: plain, now: (++n) * 20_000 }); }
        r = step(r.state, { event: "turn", kit, cls: { ...plain, source: "request", request: ask }, now: (n + 1) * 20_000, text: "mujhe game khelna hai" });
        const m = r.state.module;
        at[label] = r.ui?.tray === "module" && m && m.engine !== RUNG ? `engine:${m.engine}` : m?.engine === RUNG ? "rung" : "none";
      } catch (e) { at[label] = `error:${String(e?.message ?? e).slice(0, 50)}`; }
    }
    rows.push({ topicId: kit.topicId, engine, ...at });
  }
}
const share = (k) => rows.filter((r) => String(r[k]).startsWith("engine:")).length;
const sum = { topics: rows.length, engine: { turn1: share("turn1"), turn3: share("turn3"), practice: share("practice") } };
console.log(JSON.stringify(sum));
for (const r of rows.filter((r) => !["turn1", "turn3", "practice"].every((k) => String(r[k]).startsWith("engine:")))) console.log(r.topicId, r.engine, r.turn1, r.turn3, r.practice);
if (out) fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), sum, rows }, null, 1));
