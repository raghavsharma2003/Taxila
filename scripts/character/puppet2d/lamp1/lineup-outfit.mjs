// Blind forced-choice lineup of the outfit fronts (round-4 Asha): the four outfits in a 2 x 2 grid, positions shuffled
// per run (seeded), cells labelled A-D. The judge picks which reads most friendly, most "cool" to a 12-year-old, most
// professional to a parent, and which it would pick overall for a children's tutoring app teacher. A proxy, not a person.
//   NODE_USE_ENV_PROXY=1 node lineup-outfit.mjs <out.json> <model> <n> <seed0> <label=path> x4
import fs from "node:fs";
import { execFileSync } from "node:child_process";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const [out, model, nS, seedS, ...items] = process.argv.slice(2);
const N = +nS, seed0 = +seedS;
const PROMPT = `The image is a 2 x 2 grid of four portraits of the same woman in four different outfits, labelled A (top left), B (top right), C (bottom left), D (bottom right). Judge only what is drawn.
1. most_friendly: which cell looks the most friendly and approachable? one letter, plus one short reason.
2. most_cool: which cell would a 12-year-old most likely think of as a "cool" teacher? one letter, plus one short reason.
3. most_professional: which cell would a parent see as the most professional for their child's teacher? one letter, plus one short reason.
4. least_professional: which cell would a parent see as the least professional? one letter, plus one short reason.
5. overall: for the teacher of a children's tutoring app (ages 6-15) trusted by parents, which ONE outfit would you choose? one letter, plus one short reason.
6. ranking_overall: all four letters, best first.
Reply JSON only: {"most_friendly":{"v":"","why":""},"most_cool":{"v":"","why":""},"most_professional":{"v":"","why":""},"least_professional":{"v":"","why":""},"overall":{"v":"","why":""},"ranking_overall":[]}`;
const labels = items.map((s) => s.split("=")[0]), paths = items.map((s) => s.split("=")[1]);
function rng(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function grid(order, file) {
  execFileSync("python3", ["-I", "-c", `import sys
from PIL import Image, ImageDraw, ImageFont
ps=sys.argv[2:6]; W=Image.new('RGB',(1040,1040),'white'); d=ImageDraw.Draw(W)
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',34)
except Exception: f=None
for i,p in enumerate(ps):
  im=Image.open(p).convert('RGB').resize((512,512)); x=(i%2)*528; y=(i//2)*528; W.paste(im,(x,y))
  d.rectangle([x+6,y+6,x+52,y+52],fill='white'); d.text((x+16,y+10),'ABCD'[i],fill='black',font=f)
W.save(sys.argv[1],quality=90)`, file, ...order.map((i) => paths[i])]);
}
const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : { method: "blind 2x2 lineup, positions shuffled per run, letters mapped back to labels; prompt verbatim", prompt: PROMPT, runs: [] };
for (let r = 0; r < N; r++) {
  const R = rng(seed0 + r * 7919), order = [0, 1, 2, 3].sort(() => R() - 0.5);
  const file = `/tmp/claude-0/-home-user/ecee9fc1-62f9-5f67-a47d-69ca79d9981a/scratchpad/r4-asha/lineup-${model}-${seed0 + r}.jpg`;
  grid(order, file);
  const b64 = fs.readFileSync(file).toString("base64");
  const body = { model, messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + b64, detail: "high" } }] }] };
  if (model === "taxila-brain") { body.max_completion_tokens = 6000; body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; } else body.max_tokens = 3000;
  let x = null;
  for (let a = 0; a < 4 && !x; a++) {
    try {
      const rr = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000) });
      const j = await rr.json(); if (!rr.ok) throw new Error(`${rr.status} ${JSON.stringify(j).slice(0, 200)}`);
      const t = (j.choices?.[0]?.message?.content || "").replace(/^```(json)?|```$/gm, "").trim();
      const v = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
      const map = (L) => labels[order["ABCD".indexOf(String(L).trim().toUpperCase()[0])]] ?? `?${L}`;
      const mapped = {}; for (const k of ["most_friendly", "most_cool", "most_professional", "least_professional", "overall"]) mapped[k] = { v: map(v[k]?.v), why: v[k]?.why };
      mapped.ranking_overall = (v.ranking_overall || []).map(map);
      x = { model, rep: r, seed: seed0 + r, order: order.map((i) => labels[i]), date: new Date().toISOString(), raw: v, mapped, usage: j.usage };
    } catch (e) { if (a === 3) x = { model, rep: r, error: String(e.message).slice(0, 200) }; else await new Promise((s) => setTimeout(s, 5000 * (a + 1))); }
  }
  res.runs.push(x); fs.writeFileSync(out, JSON.stringify(res, null, 1));
  console.log(model, r, x.error ? "ERR " + x.error : `order=${x.order.join(",")} friendly=${x.mapped.most_friendly.v} cool=${x.mapped.most_cool.v} prof=${x.mapped.most_professional.v} least=${x.mapped.least_professional.v} overall=${x.mapped.overall.v} rank=${x.mapped.ranking_overall.join(">")}`);
}
