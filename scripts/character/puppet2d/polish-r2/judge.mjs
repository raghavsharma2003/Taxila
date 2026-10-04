// Blind advisory panel (PLAN §11.1-§11.4) for arm P stills: two Foundry vision families (taxila-brain = OpenAI
// gpt-5.6-sol; grok-4-20-reasoning = xAI). The judge returns atomic yes/no observations; code tallies them. A sanity
// battery runs first: a known-failed 3D render must be rejected and a reference-vs-reference pair accepted.
// Advisory only: the owner's side-by-side yes is the gate (rj-holistic-model-judge-gate).
//   NODE_USE_ENV_PROXY=1 node scripts/character/puppet2d/polish-r2/judge.mjs [round]
import fs from "node:fs";
import { execFileSync } from "node:child_process";
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const round = process.argv[2] || "r1";
const W = "art/character/puppet2d/polish-r2/work";
const C = "docs/design/teacher/stylised/concepts", RF = "docs/design/teacher/stylised/build/refs";
const jpg = (f, size) => execFileSync("python3", ["-c", `import sys,io,base64
from PIL import Image
im=Image.open("${f}").convert("RGB").crop((112,0,912,800)) if "${f}".find("work/poses")>=0 or "${f}".find("c-")>=0 or "${f}".find("refs/")>=0 else Image.open("${f}").convert("RGB")
im.thumbnail((${size},${size}))
b=io.BytesIO(); im.save(b,"JPEG",quality=90); sys.stdout.write(base64.b64encode(b.getvalue()).decode())`]).toString();
const PROMPT = `You are a harsh art director for a premium children's learning app. Image REF is the approved concept of a cartoon teacher character (Memoji-style soft 3D cartoon). Image X is one frame of an attempt to ANIMATE that same character (any expression or head angle is allowed; judge whether it is the same character done well). Be strict: anything that looks like a paper cut-out puppet, flat clip-art, cheap game, uncanny, smeared, or with visible cut edges fails.
Answer each item for X with true/false and a short reason:
I1 same character and same art style as REF
I2 premium: looks like a polished app character, not a paper cut-out, not flat vector, not a cheap game
I3 not uncanny: no dead eyes, no stretched or smeared mouth, no warped texture
S1 no visible seams, halos, holes or cut edges anywhere
S2 colours match REF (skin, near-black hair, teal kurta, orange piping, gold studs, bindi)
S3 the soft Memoji shading is kept (not flattened)
E1 a catchlight is visible in each open eye (true if eyes are closed)
E2 the eyelids wrap the eyes and the lash line is smooth and tapered
M1 the lips have soft volume
M2 if teeth show, they are one smooth curved row inside the lips (true if no teeth show)
Then score 1-5 (4 = clearly the same character at app quality, would ship; 5 = delightful; 3 = recognisable but not shippable; 2 = rough; 1 = wrong), and name the 2 most damaging defects.
Reply as JSON only: {"items":{"I1":[bool,"reason"],...},"score":n,"defects":["...","..."]}`;
const LABELS = ["warm smile", "delight", "gentle concern", "surprise", "playful", "listening", "thinking", "neutral talking"];
const EMO_PROMPT = `This is one frame of an animated cartoon teacher. Which ONE label best describes her expression or state? Choose exactly one of: ${LABELS.join(", ")}. Reply as JSON only: {"label":"...","confidence":0-1,"why":"..."}`;
async function call(model, content) {
  const body = { model, max_completion_tokens: 6000, messages: [{ role: "user", content }] };
  if (model === "taxila-brain") { body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; }
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      const txt = (j.choices?.[0]?.message?.content || "").replace(/^```(json)?|```$/gm, "").trim();
      return { v: JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)), usage: j.usage };
    } catch (e) { if (a === 2) return { v: null, err: String(e.message).slice(0, 200) }; await new Promise((s) => setTimeout(s, 4000)); }
  }
}
const img = (f, size) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpg(f, size)}` } });
const MODELS = ["taxila-brain", "grok-4-20-reasoning"];
const PAIRS = [
  ["sanity-bad-3d", `${C}/c-front.webp`, `${W}/sanity-3d-armA.png`],
  ["sanity-ref-ref", `${C}/c-front.webp`, `${RF}/neutral.webp`],
  ["rest", `${C}/c-front.webp`, `${W}/poses/rest.png`],
  ["talk_aa", `${C}/c-talking.webp`, `${W}/poses/talk_aa.png`],
  ["delight", `${C}/c-happy.webp`, `${W}/poses/delight.png`],
  ["thinking", `${C}/c-thinking.webp`, `${W}/poses/thinking.png`],
  ["listening", `${C}/c-listening.webp`, `${W}/poses/listening.png`],
  ["yaw_p20", `${C}/c-front.webp`, `${W}/poses/yaw_p20.png`],
  ["blink_mid", `${C}/c-front.webp`, `${W}/poses/blink_mid.png`],
  ["tongue_RETRO", `${C}/c-talking.webp`, `${W}/poses/tongue_RETRO_curl.png`],
];
const EMO = { warm: "warm smile", delight: "delight", concern: "gentle concern", surprise: "surprise", playful: "playful", listening: "listening", thinking: "thinking", talk_E: "neutral talking" };
const out = { round, date: new Date().toISOString(), models: MODELS, pairs: [], emotions: [] };
const jobs = [];
for (const [id, ref, x] of PAIRS) for (const size of [1024, 256]) for (const m of MODELS)
  jobs.push(async () => {
    const r = await call(m, [{ type: "text", text: PROMPT }, { type: "text", text: "Image REF:" }, img(ref, size), { type: "text", text: "Image X:" }, img(x, size)]);
    out.pairs.push({ id, size, model: m, ...r });
    console.log(id, size, m, r.v ? r.v.score : r.err);
  });
for (const [pose, label] of Object.entries(EMO)) for (const m of MODELS)
  jobs.push(async () => {
    const r = await call(m, [{ type: "text", text: EMO_PROMPT }, img(`${W}/poses/${pose}.png`, 256)]);
    out.emotions.push({ pose, truth: label, model: m, got: r.v?.label, ok: r.v?.label === label });
    console.log("emo", pose, m, r.v?.label);
  });
const q = [...jobs];
await Promise.all([0, 1, 2, 3].map(async () => { while (q.length) await q.shift()(); }));
// tally (code decides)
const items = ["I1", "I2", "I3", "S1", "S2", "S3", "E1", "E2", "M1", "M2"];
const tally = {};
for (const p of out.pairs) {
  if (!p.v) continue;
  const t = (tally[p.id] ||= { n: 0, score: [], items: Object.fromEntries(items.map((k) => [k, 0])) });
  t.n++;
  t.score.push(p.v.score);
  for (const k of items) if (p.v.items?.[k]?.[0] === true) t.items[k]++;
}
out.tally = tally;
out.emotionAcc = `${out.emotions.filter((e) => e.ok).length}/${out.emotions.length}`;
fs.writeFileSync(`art/character/puppet2d/polish-r2/judge-${round}.json`, JSON.stringify(out, null, 1));
for (const [id, t] of Object.entries(tally)) console.log(id, "score", (t.score.reduce((a, b) => a + b, 0) / t.n).toFixed(2), JSON.stringify(t.items), "n", t.n);
console.log("emotion forced choice", out.emotionAcc);
