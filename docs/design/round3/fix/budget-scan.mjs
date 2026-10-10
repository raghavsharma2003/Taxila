// Exhaustive-ish fit scan: every kit topic x the lead requests a child can make x registers x languages x lanes,
// at the hook (turn 1) and at the first practice item. Reports every compile BudgetError.
import { readFileSync, readdirSync } from "node:fs";
import { getKit, getTopic } from "/home/user/Taxila/server/content/index.js";
import { initLessonState, step } from "/home/user/Taxila/server/director/state.js";
import { instructionsAfter } from "/home/user/Taxila/server/compiler/instructions.js";
const T60 = "batting, main opener hoon apni colony team mein aur captain".slice(0, 60);
const LEADS = [
  { type: "uptake", kind: "personal_share", topic: T60 }, { type: "uptake", kind: "small_talk" }, { type: "uptake", kind: "joke" },
  { type: "park", topic: T60, learning: true }, { type: "detour", topic: T60 }, { type: "adapt", method: "step by step with a picture first and then a story about cricket" },
  { type: "decline" }, { type: "identity" }, { type: "answer_q" }, { type: "back" }, { type: "unclear" }, { type: "clarify" }, { type: "frustration" }, { type: "boredom" },
  { type: "visual", kind: "game" }, { type: "story" }, { type: "example" }, { type: "another" }, { type: "slower" }, { type: "change_topic" }, { type: "stop" },
];
const files = readdirSync("/home/user/Taxila/data/kits").filter((f) => /^c\d-.*\.json$/.test(f));
const topics = [];
for (const f of files) for (const t of JSON.parse(readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")).topics) topics.push(t.topicId);
const only = process.argv[2] ? Number(process.argv[2]) : topics.length;
let n = 0, fails = 0; const kinds = {};
for (const topicId of topics.slice(0, only)) {
  const kit = await getKit(topicId, { generate: false }).catch(() => null);
  if (!kit) continue;
  const topic = getTopic(topicId);
  const cl = Number(topicId.match(/^c(\d)/)[1]);
  for (const [lang, address] of [["hinglish", "aap"], ["hinglish", "tum"], ["english", null], ["hindi", "aap"]]) for (const mode of ["text", "voice"]) {
    const ageBand = cl <= 4 ? "6-9" : "10-15";
    const brief = { firstName: "Kabir", classLevel: cl, ageBand, languagePref: lang, interests: ["cricket"], recentWins: [], activeMisconceptions: [], memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
    const s0 = initLessonState({ topicId, kit, ctx: { sessionId: "x", classLevel: cl, firstName: "Kabir", teacherName: "Arjun", teacherId: "arjun", protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand, lang, interests: ["cricket"], address, firstMeeting: true, hasCallback: false, topicTitle: topic?.title ?? topicId, nextTitle: "x", purpose: "lesson" }, seed: 3, now: 0 });
    let r = step(s0, { event: "start", kit, now: 0 });
    r = { ...r, state: { ...r.state, brief, mode, kitVerified: true } };
    const points = [r];
    // and the first practice item
    let q = r; for (let i = 0; i < 12 && !(q.state.phase === "practice" && q.move.itemId && !q.move.itemId.startsWith("fade:")); i++) q = step(q.state, { event: "turn", kit, cls: { outcome: "no_evidence", confidence: 1, source: "model", flags: {} }, now: (i + 1) * 20000, text: "hmm" });
    if (q.state.phase === "practice") points.push(q);
    for (const at of points) for (const lead of LEADS) {
      n++;
      const cls = { outcome: "no_evidence", confidence: 1, source: "request", request: { ...lead, whole: true }, flags: {} };
      const nx = step(at.state, { event: "turn", kit, cls, now: at.state.turn * 20000 + 20000, text: "batting, main opener hoon apni colony team mein" });
      try { instructionsAfter(nx, kit, 0); } catch (e) { fails++; const k = `${lead.type}${lead.kind ? "/" + lead.kind : ""} ${nx.move.kind} ${String(e.message).slice(0, 40)}`; kinds[k] = (kinds[k] ?? 0) + 1; if (fails <= 8) console.log(topicId, lang, address, mode, lead.type, nx.move.kind, e.message.slice(0, 120)); }
    }
  }
}
console.log(JSON.stringify({ topics: Math.min(only, topics.length), compiles: n, fails, kinds }, null, 1));
