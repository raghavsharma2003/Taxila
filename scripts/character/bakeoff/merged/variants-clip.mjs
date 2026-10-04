// merged iteration 3: score candidate poses (stills) or clips (6-frame strips, as render.mjs makes them) for ONE emotion
// with a SELECTION judge (judge D: taxila-brain with a third prompt written for tuning only), so the held-out judges of
// emotion-check.mjs (C: held-out prompt, B: fast model) never see a candidate.
//   NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/merged/variants-clip.mjs --emotion encouraging --file v.json [--reps 8]
// v.json: { "<name>": { bs, head, gaze, lean, clip?: { durationS, keys: [{ t, head, bs }] } } }
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { openHarness } from "./harness.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const EMO = opt("--emotion"), REPS = +opt("--reps", "8");
const V = JSON.parse(fs.readFileSync(opt("--file")));
const OUT = opt("--out", "/tmp/claude-0/char/bakeoff-merged/variants-clip");
fs.mkdirSync(OUT, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
await hx.page.evaluate(() => TX.load("teal", "H"));
const pose = (p, t) => {
  if (!p.clip) return p;
  const k = p.clip.keys; let i = 0;
  while (i < k.length - 2 && t > k[i + 1].t) i++;
  const a = k[i], b = k[i + 1], u = Math.max(0, Math.min(1, (t - a.t) / Math.max(1e-6, b.t - a.t)));
  const bs = { ...p.bs };
  for (const key of new Set([...Object.keys(a.bs || {}), ...Object.keys(b.bs || {})])) bs[key] = (bs[key] || 0) + ((a.bs || {})[key] || 0) + (((b.bs || {})[key] || 0) - ((a.bs || {})[key] || 0)) * u;
  return { ...p, bs, head: (p.head || [0, 0, 0]).map((h, j) => h + a.head[j] + (b.head[j] - a.head[j]) * u) };
};
for (const [name, p] of Object.entries(V)) {
  if (!p.clip) { await hx.page.evaluate((pp) => { TX.frame("face", 0); TX.pose(pp); TX.render(); }, p); await hx.shot(path.join(OUT, `${name}.png`)); continue; }
  const fr = [];
  for (const [j, t] of [0, 0.3, 0.6, 0.95, 1.3, 1.9].entries()) {
    await hx.page.evaluate((pp) => { TX.frame("face", 0); TX.pose(pp); TX.render(); }, pose(p, t));
    const f = path.join(OUT, `${name}_${j}.png`); await hx.shot(f); fr.push(f);
  }
  execFileSync("python3", ["-c", "import sys\nfrom PIL import Image\nims=[Image.open(f).convert('RGB').resize((300,375)) for f in sys.argv[2:]]\nW=Image.new('RGB',(300*len(ims),375))\nfor i,im in enumerate(ims): W.paste(im,(300*i,0))\nW.save(sys.argv[1])", path.join(OUT, `${name}.png`), ...fr]);
}
await hx.close();
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const { chat, DEPLOY } = await import("../../../../server/azure.js");
const E = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"];
const schema = { type: "object", additionalProperties: false, properties: { label: { type: "string", enum: E } }, required: ["label"] };
const res = {};
await Promise.all(Object.entries(V).map(async ([name, p]) => {
  const img = fs.readFileSync(path.join(OUT, `${name}.png`)).toString("base64"); const said = [];
  for (let r = 0; r < REPS; r++) {
    const labels = [...E].sort(() => Math.random() - 0.5).join(" / ");
    const x = await chat(DEPLOY.brain, [
      { role: "system", content: "You are rating how clearly an animated character's face communicates a feeling. Be decisive; one word." },
      { role: "user", content: [{ type: "text", text: (p.clip ? "This strip shows 6 consecutive moments (left to right) of a 2-second animation of one teacher. " : "")
        + `If a child saw this teacher, which feeling would the child say she is expressing? One of: ${labels}.` },
        { type: "image_url", image_url: { url: `data:image/png;base64,${img}` } }] }],
      { schema, schemaName: "emotion", maxTokens: 2000, effort: "low", timeoutMs: 60000, retries: 2 });
    said.push(x.json.label);
  }
  res[name] = { hit: said.filter((s) => s === EMO).length, n: REPS, said };
}));
for (const [k, v] of Object.entries(res)) console.log(`${EMO} ${k}: ${v.hit}/${v.n}  ${v.said.join(",")}`);
fs.writeFileSync(path.join(OUT, `${EMO}.json`), JSON.stringify({ date: new Date().toISOString(), judge: "D (taxila-brain, tuning prompt)", emotion: EMO, variants: V, res }, null, 1));
