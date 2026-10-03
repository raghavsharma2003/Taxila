// merged: emotion legibility with TWO judges (a held-out second model and a second prompt) and a CLIP mode.
// A vision model makes a blind forced choice of one label out of 9 per image; labels shuffled per call.
//   judge A: taxila-brain (DEPLOY.brain), the bake-off's prompt (QA-sheet framing, labels with short glosses), unchanged
//            from scripts/character/emotion-check.mjs so the numbers stay comparable with the earlier rows;
//   judge B: taxila-fast (DEPLOY.fast), a DIFFERENT prompt written for this check (what the student would feel she is
//            showing, bare labels, no glosses), never used to choose a pose: the held-out judge;
//   clip   : `encouraging` is judged on a 2 s clip with the nod (the logged decision `encouraging-judged-on-motion`):
//            6 frames left to right in one strip image (emotions/encouraging_clip.png, rendered by render.mjs), and both
//            prompts say it is a strip of frames from a short clip.
// Bar: >= 70% per emotion on 8 of 9 under EACH judge (n = --reps per judge per emotion), and pooled.
//   NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/merged/emotion-check.mjs [--reps 12] [--judges A,B] [--gate 70]
//        [--root <dir with {look}>] [--out file] [--only e1,e2]
// A model is not a 9-year-old: this is a proxy that flags pooled pairs, never the E-T4 child panel.
import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { chat, DEPLOY } = await import("../../../../server/azure.js");
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const LOOKS = opt("--looks", "teal").split(",");
const REPS = +opt("--reps", "12");
const JUDGES = opt("--judges", "A,B").split(",");
const ROOT = opt("--root", "docs/design/teacher/bakeoff/merged/renders/{look}/emotions");
const CLIP = new Set(opt("--clip", "encouraging").split(",").filter(Boolean));
const E = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"];
const ONLY = opt("--only") ? opt("--only").split(",") : E;
const DESC = {
  warm: "a warm, friendly smile", encouraging: "encouraging, supportive, urging someone on", curious: "curious, interested, intrigued",
  thinking: "thinking, concentrating, working something out", listening: "attentively listening", concerned: "gently concerned, caring",
  delighted: "delighted, celebrating", playful: "playful, sharing a gentle joke", surprised: "pleasantly surprised",
};
const schema = { type: "object", additionalProperties: false, properties: { label: { type: "string", enum: E } }, required: ["label"] };
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const J = {
  A: {
    model: DEPLOY.brain,
    msgs: (img, clip) => [
      { role: "system", content: "You judge facial expressions of a 3D teacher character for an animation QA sheet. Answer with exactly one label." },
      { role: "user", content: [
        { type: "text", text: (clip ? "The image is a strip of 6 frames, left to right, from a 2-second clip of the same character. " : "")
          + `Which ONE label best describes this teacher's facial expression and head ${clip ? "motion" : "pose"}? Labels: ${shuffle(E).map((k) => `${k} (${DESC[k]})`).join("; ")}.` },
        { type: "image_url", image_url: { url: `data:image/png;base64,${img}` } }] }],
  },
  B: {
    model: DEPLOY.fast,
    msgs: (img, clip) => [
      { role: "system", content: "You are helping test an animated teacher for a children's learning app. Look only at her face and head, and reply with one word from the list." },
      { role: "user", content: [
        { type: "text", text: (clip ? "These are 6 moments in order (left to right) from a short 2-second clip of her. " : "")
          + `A student is looking at this teacher. What is she showing the student? Choose exactly one: ${shuffle(E).join(", ")}.` },
        { type: "image_url", image_url: { url: `data:image/png;base64,${img}` } }] }],
  },
};
const rows = [];
const jobs = [];
for (const j of JUDGES) for (const look of LOOKS) for (const e of ONLY) {
  const clip = CLIP.has(e);
  const file = path.join(ROOT.replace("{look}", look), clip ? `${e}_clip.png` : `${e}.png`);
  const img = fs.readFileSync(file).toString("base64");
  for (let r = 0; r < REPS; r++) jobs.push({ j, look, e, clip, img, r, file });
}
// a few calls in flight at once (each call is independent and blind)
const POOL = +opt("--pool", "6");
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const x = jobs[next++];
    let said = null, err = null;
    try {
      const res = await chat(J[x.j].model, J[x.j].msgs(x.img, x.clip), { schema, schemaName: "emotion", maxTokens: 2000, effort: "low", timeoutMs: 90000, retries: 2 });
      said = res.json.label;
    } catch (e) { err = String(e.message || e).slice(0, 160); }
    rows.push({ judge: x.j, model: J[x.j].model, look: x.look, rep: x.r, truth: x.e, clip: x.clip, said, err });
    process.stdout.write(`${x.j}:${x.e}->${said ?? "ERR"} `);
  }
}
await Promise.all(Array.from({ length: POOL }, worker));
const score = (rr) => {
  const ok = rr.filter((x) => x.said);
  const conf = {};
  for (const x of ok) conf[x.said] = (conf[x.said] || 0) + 1;
  const c = ok.filter((x) => x.said === x.truth).length;
  return { n: ok.length, errors: rr.length - ok.length, correct: c, pct: ok.length ? Math.round((100 * c) / ok.length) : 0, confusions: conf };
};
const per = {};
for (const j of [...JUDGES, "pooled"]) {
  per[j] = Object.fromEntries(ONLY.map((e) => [e, score(rows.filter((x) => x.truth === e && (j === "pooled" || x.judge === j)))]));
}
const bar = +opt("--gate", "70");
const passes = Object.fromEntries(Object.entries(per).map(([j, p]) => [j, Object.values(p).filter((v) => v.pct >= bar).length]));
const out = {
  date: new Date().toISOString(),
  judges: Object.fromEntries(JUDGES.map((j) => [j, { model: J[j].model, prompt: j === "A" ? "QA-sheet framing, 9 labels with short glosses (the bake-off prompt)" : "student-facing framing, 9 bare labels (held-out prompt, never used to choose a pose)" }])),
  method: `blind forced choice of 1 of 9 labels, shuffled per call; ${LOOKS.length} look x ${REPS} reps per emotion per judge; ${[...CLIP].join(", ") || "none"} judged on a 6-frame strip of a 2 s clip; bar >= ${bar}% per emotion on 8 of 9 (proxy for E-T4)`,
  overallPct: Object.fromEntries([...JUDGES, "pooled"].map((j) => { const rr = rows.filter((x) => x.said && (j === "pooled" || x.judge === j)); return [j, Math.round((100 * rr.filter((x) => x.said === x.truth).length) / Math.max(1, rr.length))]; })),
  passing: passes, per, rows,
};
fs.writeFileSync(opt("--out", "docs/design/teacher/bakeoff/merged/renders/emotion-check.json"), JSON.stringify(out, null, 1));
console.log("");
for (const j of [...JUDGES, "pooled"]) {
  console.log(`judge ${j} (${j === "pooled" ? "all" : J[j].model}): overall ${out.overallPct[j]}%, ${passes[j]}/${ONLY.length} at >= ${bar}%`);
  for (const [e, v] of Object.entries(per[j])) console.log(`  ${e.padEnd(12)} ${v.correct}/${v.n} ${v.pct}% ${v.pct >= bar ? "ok" : "BELOW"} ${JSON.stringify(v.confusions)}`);
}
if (argv.includes("--gate")) {
  const need = Math.min(8, ONLY.length);
  const bad = Object.entries(passes).filter(([, n]) => n < need).map(([j]) => j);
  if (bad.length) { console.log(`EMOTION GATE FAILED (fewer than ${need} emotions >= ${bar}% under judge ${bad.join(", ")})`); process.exit(3); }
  console.log(`emotion gate: >= ${need} of ${ONLY.length} emotions at >= ${bar}% under every judge`);
}
