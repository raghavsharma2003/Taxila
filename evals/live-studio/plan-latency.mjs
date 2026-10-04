// Live Studio probe: the PLAN step (Teacher Brain intent -> BuildPlan JSON, strict schema) on taxila-fast.
// n = 8 intents x effort {none, low}. Measures latency and schema validity; the plan's quality is not judged here.
import { loadEnv } from "./models.mjs";
loadEnv();
const { chat } = await import("../../server/azure.js");
const schema = { type: "object", additionalProperties: false, required: ["kind", "archetype", "goal", "mechanic", "screens", "strings", "teacherCue", "fallbackEngine"],
  properties: { kind: { type: "string", enum: ["game", "simulation", "explorable", "animation", "diagram", "chart", "image", "minisite"] },
    archetype: { type: "string" }, goal: { type: "string" }, mechanic: { type: "string" },
    screens: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "purpose"], properties: { id: { type: "string" }, purpose: { type: "string" } } } },
    strings: { type: "array", items: { type: "object", additionalProperties: false, required: ["key", "text"], properties: { key: { type: "string" }, text: { type: "string" } } } },
    teacherCue: { type: "string" }, fallbackEngine: { type: "string" } } };
const intents = [
  "topic c4 fractions halves-quarters; child confuses 1/4 > 1/2 (bigger denominator = bigger); likes cricket; Hinglish; class 4",
  "topic c7 photosynthesis; child thinks plants eat soil; likes drawing; Hinglish; class 7",
  "topic c5 data handling bar graphs; child reads bar top as label; likes fruit stall at home; class 5",
  "topic c6 integers number line; child thinks -5 > -2; likes football; English; class 6",
  "topic c3 time clock reading; child swaps hour and minute hands; likes trains; Hindi; class 3",
  "topic c8 force and pressure; child thinks heavier objects fall faster; likes cycling; Hinglish; class 8",
  "topic c6 SST latitude longitude; child mixes them up; likes maps of cricket grounds; English; class 6",
  "topic c2 addition with carrying; child forgets the carry; likes cooking; Hinglish; class 2",
];
const sys = "You are the Live Studio planner. Turn a teacher-brain intent into a BuildPlan for one interactive piece built in the background while the teacher talks. Child-visible strings: short, warm, Hinglish/Hindi/English as asked, no numbers inside strings. teacherCue = a telegraphic note for the teacher (not a line to say). fallbackEngine = closest existing engine id or 'none'.";
for (const effort of ["none", "low"]) {
  const lat = []; let ok = 0;
  await Promise.all(intents.map(async (it) => { const t = performance.now(); try { const r = await chat("taxila-fast", [{ role: "system", content: sys }, { role: "user", content: it }], { schema, schemaName: "build_plan", effort, maxTokens: 2500, timeoutMs: 30000 }); lat.push(performance.now() - t); if (r.json?.strings?.length) ok++; } catch (e) { console.log("ERR", e.message.slice(0, 120)); } }));
  lat.sort((a, b) => a - b);
  console.log(JSON.stringify({ effort, n: intents.length, valid: ok, p50: Math.round(lat[lat.length >> 1]), max: Math.round(lat.at(-1)) }));
}
