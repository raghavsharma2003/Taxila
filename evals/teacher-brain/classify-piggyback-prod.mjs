// CRITIC re-run of M2 on the PRODUCTION classify deployment (grok-4-1-fast-non-reasoning, deploy-classify-grok). Copy of classify-piggyback.mjs; only the output path differs.
// TEACHER-BRAIN probe M2 (TEACHER-BRAIN.md §14): can the per-turn SIGNALS the Relational OS, the learner model and
// the vibe adapter need (dialogue act, IDK split, a personal share, an interest tag, humour) ride on the classify
// call the turn already makes, instead of a second model call? Measures the latency delta and whether adding the
// fields changes the grading label (they must not: the label is evidence).
//   NODE_USE_ENV_PROXY=1 node evals/teacher-brain/classify-piggyback.mjs [reps=3] [models=taxila-fast,grok-4-20-non-reasoning]
import fs from "node:fs";
import { loadEnv } from "../live-studio/models.mjs";
loadEnv();
const { chat } = await import("../../server/azure.js");
const REPS = +(process.argv[2] || 3);
const MODELS = (process.argv[3] || "taxila-fast,grok-4-20-non-reasoning").split(",");

const SYS = [
  "You label one reply from an Indian school child (class 4) in a live lesson. You never grade freely and never judge quality: you only say which listed option the reply matches.",
  "The child may speak Hindi, English or Hinglish, in Roman or Devanagari script. Number words count (aadha = 1/2). Transcripts come from speech recognition and can have small errors.",
  "distress: true ONLY for signs the child is unsafe, hurt, abused, frightened, very sad, or may harm themself — never for ordinary frustration with a question.",
  "asks_for_answer: they ask to be told the answer. wants_to_stop: they say they want to stop or leave now. off_topic: the reply is about something unrelated to the lesson.",
  "match rules:\n- key: the reply gives the KEY (any wording, language or equivalent form), even with extra words.\n- m1: the reply's answer or reason is what misconception m1 predicts.\n- other_wrong: any other attempted answer.\n- dont_know: says they don't know or are unsure, with no answer.\n- no_attempt: not an answer to this question.\nconfidence: 0-1.",
].join("\n");
const SIG = "act: what the reply mainly does. idk_cant_recall = knew it once but cannot recall now; idk_not_known = never learned it. personal_share: true if the child tells something about their own life. interest: the topic of that share if it is in the list, else none. humour: the child is joking or laughing.";
const USER = (t) => `QUESTION: Which is bigger, 1/2 or 1/4?\nKEY: 1/2\nm1: thinks the fraction with the bigger denominator is bigger (signs: "4 is bigger so 1/4")\nCHILD SAID: "${t}"`;
const flags = { off_topic: { type: "boolean" }, distress: { type: "boolean" }, asks_for_answer: { type: "boolean" }, wants_to_stop: { type: "boolean" } };
const base = { match: { type: "string", enum: ["key", "m1", "other_wrong", "dont_know", "no_attempt"] }, confidence: { type: "number" }, ...flags };
const sig = { act: { type: "string", enum: ["answer", "question_curious", "question_clarify", "chit_chat", "idk_not_known", "idk_cant_recall", "frustration_words", "pride_words", "meta_slow", "meta_break"] },
  personal_share: { type: "boolean" }, interest: { type: "string", enum: ["none", "cricket", "football", "cooking", "drawing", "animals", "trains", "music", "games", "space"] }, humour: { type: "boolean" } };
const obj = (p) => ({ type: "object", additionalProperties: false, required: Object.keys(p), properties: p });

// [reply, expected match, expected act] — expectations written before the run (single rater).
const R = [
  ["1/2 bada hai", "key", "answer"], ["1/4 kyunki 4 bada hai", "m1", "answer"],
  ["pata nahi, yaad nahi aa raha, kal kiya tha", "dont_know", "idk_cant_recall"], ["mujhe ye aata hi nahi", "dont_know", "idk_not_known"],
  ["didi aapko cricket pasand hai? main kal match khela", "no_attempt", "chit_chat"], ["aadha bada hai obviously haha", "key", "answer"],
  ["ek minute, thoda dheere boliye please", "no_attempt", "meta_slow"], ["ye bahut boring hai, main thak gaya", "no_attempt", "frustration_words"],
  ["half! maine pizza mein dekha tha mummy ne kaata tha", "key", "answer"], ["chhota wala neeche jo 4 hai woh bada hoga", "m1", "answer"],
];
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]); };
const out = { date: new Date().toISOString(), reps: REPS, models: {} };
for (const model of MODELS) {
  const res = {};
  for (const arm of ["plain", "signals"]) {
    const lat = []; let matchOk = 0, actOk = 0, n = 0, err = 0; const rows = [];
    for (const [t, m, a] of R) for (let r = 0; r < REPS; r++) {
      const t0 = performance.now();
      try {
        const opts = { schema: obj(arm === "plain" ? base : { ...base, ...sig }), schemaName: "classify_item", maxTokens: model === "taxila-fast" ? 900 : 160, timeoutMs: 15000 };
        if (model === "taxila-fast") opts.effort = "low";
        const { json } = await chat(model, [{ role: "system", content: arm === "plain" ? SYS : `${SYS}\n${SIG}` }, { role: "user", content: USER(t) }], opts);
        lat.push(performance.now() - t0); n++; matchOk += json.match === m; if (arm === "signals") actOk += json.act === a; rows.push({ t, match: json.match, act: json.act, share: json.personal_share, interest: json.interest });
      } catch (e) { err++; rows.push({ t, err: String(e.message).slice(0, 80) }); }
    }
    res[arm] = { match: `${matchOk}/${n}`, ...(arm === "signals" ? { act: `${actOk}/${n}` } : {}), err, p50: pct(lat, 0.5), p90: pct(lat, 0.9), rows };
    console.log(model, arm, JSON.stringify({ match: res[arm].match, act: res[arm].act, err, p50: res[arm].p50, p90: res[arm].p90 }));
  }
  out.models[model] = res;
}
fs.mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`./results/classify-piggyback-prodclassifier-${out.date.slice(0, 10)}.json`, import.meta.url), JSON.stringify(out, null, 1));
