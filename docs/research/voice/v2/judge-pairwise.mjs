#!/usr/bin/env node
// PAIRWISE AI-judge proxy (experiments only, OpenRouter). Absolute 1-5 ratings from audio LLM judges sit at the
// ceiling (most TTS gets 5/5 "human"), so the top of the field is compared head-to-head on the SAME passage, both
// presentation orders (position bias cancels), blind to names. Arms = top-N of judge-summary.json per_arm
// (negative control and human anchors excluded) unless PAIR_ARMS is given.
// Usage: set -a; . .env.local; set +a; NODE_USE_ENV_PROXY=1 TOPN=10 node docs/research/voice/v2/judge-pairwise.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { PASSAGES } from "./passages-ref.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const S = path.join(HERE, "samples");
const OUTF = path.join(HERE, "judge-pairwise.json");
const TMP = process.env.JUDGE_TMP || path.join(HERE, ".judge-tmp");
const OR = process.env.OPENROUTER_API_KEY;
const JUDGES = (process.env.PAIR_JUDGES || "google/gemini-3.1-pro-preview,qwen/qwen3.8-omni-flash").split(",");
const TOPN = +(process.env.TOPN || 10), CONC = +(process.env.CONC || 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(TMP, { recursive: true });

const ka = fs.existsSync(path.join(S, "KEY.json")) ? JSON.parse(fs.readFileSync(path.join(S, "KEY.json"), "utf8")) : {};
const kr = JSON.parse(fs.readFileSync(path.join(S, "KEY-ref.json"), "utf8")).clips;
const armOf = (id) => {
  if (id.startsWith("ref-")) { const k = kr[id.slice(4)]; let a = `REF ${k.engine}:${k.voice || "default"}`; if (k.arm && k.arm !== "director-note") a += ` [${k.arm}]`; return [a, k.passage]; }
  const k = ka[id]; return k ? [`AZ ${k.arm}`, k.passage] : [null, null];
};
const clipIndex = {}; // arm -> passage -> file
for (const f of fs.readdirSync(S).filter((f) => f.endsWith(".mp3"))) {
  const id = f.replace(/\.mp3$/, ""); const [a, p] = armOf(id); if (!a) continue;
  (clipIndex[a] ??= {})[p] = path.join(S, f);
}
const summary = JSON.parse(fs.readFileSync(path.join(HERE, "judge-summary.json"), "utf8"));
const ARMS = process.env.PAIR_ARMS ? process.env.PAIR_ARMS.split("|") :
  summary.per_arm.filter((e) => !e.arm.startsWith("HUMAN") && !e.arm.includes("NEGATIVE") && clipIndex[e.arm]).slice(0, TOPN).map((e) => e.arm);
console.log("arms:", ARMS);

function prep(file) {
  const out = path.join(TMP, crypto.createHash("sha1").update(file + fs.statSync(file).size).digest("hex").slice(0, 12) + ".mp3");
  if (fs.existsSync(out)) return out;
  const m = JSON.parse(execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${file}" -af "aresample=24000,loudnorm=I=-24:TP=-1:LRA=20:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p'`]).toString());
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-af", `aresample=24000,loudnorm=I=-24:TP=-1:LRA=20:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", out]);
  return out;
}

const PROMPT = (text) => `You are a native Hindi speaker from North India and an experienced primary-school teacher, expert at telling real Indian speakers from synthetic voices.
You will hear TWO clips, A then B, of the same intended words, spoken as an Indian teacher to a child of about 8-10:
"""${text}"""
Compare them only on what you hear. For each question answer "A" or "B" (no ties):
- more_human: which sounds more like a real person talking, less like text-to-speech.
- more_native_indian: which sounds more like a native Indian (Hindi-belt) speaker, with less Western-accent leakage on Hindi words.
- warmer: which is warmer and more engaging for one child.
- overall: which one you would choose as the child's teacher voice.
- margin: 1 = barely different, 2 = clear, 3 = large.
Return only JSON: {"more_human":"A|B","more_native_indian":"A|B","warmer":"A|B","overall":"A|B","margin":n,"reason":"one short sentence"}`;

async function ask(model, text, fa, fb) {
  const content = [{ type: "text", text: PROMPT(text) }, { type: "text", text: "Clip A:" }, { type: "input_audio", input_audio: { data: fs.readFileSync(fa).toString("base64"), format: "mp3" } },
    { type: "text", text: "Clip B:" }, { type: "input_audio", input_audio: { data: fs.readFileSync(fb).toString("base64"), format: "mp3" } }];
  const body = { model, temperature: 0, messages: [{ role: "user", content }], response_format: { type: "json_object" } };
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${OR}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json(); const t = j.choices?.[0]?.message?.content; const m = typeof t === "string" && t.match(/\{[\s\S]*\}/);
      if (m) { const o = JSON.parse(m[0]); if (/^[AB]$/.test(o.overall)) return { ...o, _cost: j.usage?.cost ?? null }; }
      console.log(`  retry ${a} ${model} ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
    } catch (e) { console.log(`  retry ${a} ${e.message}`); }
    await sleep(2500 * a);
  }
  return { error: true };
}

const res = fs.existsSync(OUTF) ? JSON.parse(fs.readFileSync(OUTF, "utf8")) : { schema: "taxila-voice-pairwise/v1", created: new Date().toISOString(), note: "AI-judge PROXY, pairwise, both orders, blind. Not a human ear test.", judges: JUDGES, arms: ARMS, trials: {} };
res.arms = ARMS;
const tasks = [];
for (const p of Object.keys(PASSAGES)) for (let i = 0; i < ARMS.length; i++) for (let k = i + 1; k < ARMS.length; k++) {
  const x = ARMS[i], y = ARMS[k]; if (!clipIndex[x]?.[p] || !clipIndex[y]?.[p]) continue;
  for (const [a, b] of [[x, y], [y, x]]) for (const j of JUDGES) { const id = `${j}|${p}|${a}|${b}`; if (!res.trials[id] || res.trials[id].error) tasks.push({ id, j, p, a, b }); }
}
console.log("tasks", tasks.length);
let k = 0, n = 0; const save = () => fs.writeFileSync(OUTF, JSON.stringify(res, null, 1));
await Promise.all(Array.from({ length: CONC }, async () => { while (k < tasks.length) { const t = tasks[k++];
  const r = await ask(t.j, PASSAGES[t.p].text, prep(clipIndex[t.a][t.p]), prep(clipIndex[t.b][t.p]));
  res.trials[t.id] = { judge: t.j, passage: t.p, A: t.a, B: t.b, ...r }; if (++n % 20 === 0) { save(); console.log(`${n}/${tasks.length}`); } } }));
save();

// win rates (overall + per question), position-bias check
const W = {}; let firstWins = 0, tot = 0;
for (const t of Object.values(res.trials)) {
  if (t.error || !ARMS.includes(t.A) || !ARMS.includes(t.B)) continue; tot++; if (t.overall === "A") firstWins++;
  for (const q of ["overall", "more_human", "more_native_indian", "warmer"]) {
    const w = t[q] === "A" ? t.A : t.B, l = t[q] === "A" ? t.B : t.A;
    for (const [arm, win] of [[w, 1], [l, 0]]) { const e = (W[arm] ??= {}); const s = (e[q] ??= { w: 0, n: 0, byJudge: {} }); s.w += win; s.n++; const bj = (s.byJudge[t.judge] ??= { w: 0, n: 0 }); bj.w += win; bj.n++; }
  }
}
res.win_rates = Object.entries(W).map(([arm, e]) => ({ arm, ...Object.fromEntries(Object.entries(e).map(([q, s]) => [q, +(s.w / s.n).toFixed(3)])), n: e.overall.n,
  overall_by_judge: Object.fromEntries(Object.entries(e.overall.byJudge).map(([j, s]) => [j, +(s.w / s.n).toFixed(3)])) })).sort((a, b) => b.overall - a.overall);
res.position_bias = { first_clip_overall_win_rate: +(firstWins / tot).toFixed(3), n: tot };
save();
for (const r of res.win_rates) console.log(r.arm.padEnd(55), r.overall, r.more_human, r.more_native_indian, r.warmer, JSON.stringify(r.overall_by_judge));
console.log(res.position_bias);
