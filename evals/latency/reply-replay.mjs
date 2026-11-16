// round 7 (main 2026-11-05, T5): is the director3 reply-latency rise Azure load by time of day? One real reply prompt (the c6
// worked-example turn, the longest-output move that rose most) is captured once from textReply, then sent N times as is to the
// reply deployment; per-call ms are written to evals/latency/results/<stamp>.json. No DB.
//   node --env-file=.env.local evals/latency/reply-replay.mjs [--n 20] [--label now|quiet]
import { mkdirSync, writeFileSync } from "node:fs";
import { initLessonState, step } from "../../server/director/state.js";
import { textReply, replyDeps } from "../../server/brain/say.js";
import { instructionsFor } from "../../server/compiler/instructions.js";
import { chat, DEPLOY } from "../../server/azure.js";
import { kitFromFile } from "../../server/content/kits.js";
import { getTopic } from "../../server/content/curriculum.js";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const N = Math.min(40, Number(arg("n", "20")));
const label = arg("label", "now");
const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend baby elephant" }, ageBand: "10-15", lang: "hinglish",
  interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: K.title ?? K.topicId, classLevel: 6, sessionId: "replay" };
let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
const NE = { outcome: "no_evidence", confidence: 1, source: "replay", flags: {} };
for (let i = 0; i < 6 && r.move.kind !== "worked_example"; i++) r = step(r.state, { event: "turn", kit: K, cls: NE, text: "haan", now: (i + 1) * 20000 });
const brief = { firstName: "Riya", classLevel: 6, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], recentWins: [], activeMisconceptions: [],
  memoryCallbacks: [], vibe: { pace: "medium", verbosity: "brief", humour: "medium" }, relationshipStage: "first_meeting (0 sessions together)" };
const state = { ...r.state, brief, mode: "text", kitVerified: K.verified, kitHash: K.hash };
let captured = null;
replyDeps.chat = async (dep, messages, opts) => { if (!captured) captured = { dep, messages, opts }; return { text: "Chalo, ek sawaal saath mein hal karte hain." }; };
await textReply({ instructions: instructionsFor(state, K), state, kit: K, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null });
replyDeps.chat = chat;
if (!captured) throw new Error("no reply prompt captured");
const ms = [], outChars = [];
for (let i = 0; i < N; i++) {
  const t0 = performance.now();
  const out = await chat(captured.dep, captured.messages, captured.opts);
  ms.push(Math.round(performance.now() - t0)); outChars.push(String(out?.text ?? "").length);
}
const sorted = [...ms].sort((a, b) => a - b);
const res = { at: new Date().toISOString(), label, deployment: captured.dep ?? DEPLOY.reply, move: r.move.kind, n: N, promptChars: JSON.stringify(captured.messages).length,
  p50: sorted[Math.floor(N / 2)], p90: sorted[Math.floor(N * 0.9)], min: sorted[0], max: sorted.at(-1), ms, outChars };
mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
writeFileSync(new URL(`./results/reply-replay-${res.at.replace(/[:.]/g, "-")}-${label}.json`, import.meta.url), JSON.stringify(res, null, 1) + "\n");
console.log(`${label} ${res.at}: n ${N} p50 ${res.p50} ms p90 ${res.p90} ms (min ${res.min}, max ${res.max}); prompt ${res.promptChars} chars; move ${res.move}`);
