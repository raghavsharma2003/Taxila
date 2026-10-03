// stylised-premium: try candidate poses for ONE emotion and score each with the same blind 9-way judge as
// scripts/character/emotion-check.mjs (same prompt, same glosses, same deployment), n reps per variant.
//   NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/stylised-premium/variants.mjs --emotion encouraging --file variants.json [--reps 6]
// variants.json: { "<name>": { bs: {...}, head: [p,y,r], gaze: [y,p], lean } , ... }
import fs from "node:fs";
import path from "node:path";
import { openHarness } from "./harness.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const EMO = opt("--emotion", "encouraging");
const REPS = +opt("--reps", "6");
const V = JSON.parse(fs.readFileSync(opt("--file")));
const OUT = opt("--out", "/tmp/claude-0/char/bakeoff-sp/variants");
fs.mkdirSync(OUT, { recursive: true });
const hx = await openHarness({ w: 600, h: 750 });
await hx.page.evaluate(() => TX.load("teal", "H"));
for (const [name, p] of Object.entries(V)) {
  await hx.page.evaluate((pp) => { TX.frame("face", 0); TX.pose(pp); TX.render(); }, p);
  await hx.shot(path.join(OUT, `${name}.png`));
}
await hx.close();
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { chat, DEPLOY } = await import("../../../../server/azure.js");
const E = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"];
const DESC = {
  warm: "a warm, friendly smile", encouraging: "encouraging, supportive, urging someone on", curious: "curious, interested, intrigued",
  thinking: "thinking, concentrating, working something out", listening: "attentively listening", concerned: "gently concerned, caring",
  delighted: "delighted, celebrating", playful: "playful, sharing a gentle joke", surprised: "pleasantly surprised",
};
const schema = { type: "object", additionalProperties: false, properties: { label: { type: "string", enum: E } }, required: ["label"] };
const res = {};
await Promise.all(Object.keys(V).map(async (name) => {
  const img = fs.readFileSync(path.join(OUT, `${name}.png`)).toString("base64");
  const said = [];
  for (let r = 0; r < REPS; r++) {
    const labels = [...E].sort(() => Math.random() - 0.5).map((k) => `${k} (${DESC[k]})`).join("; ");
    const x = await chat(DEPLOY.brain, [
      { role: "system", content: "You judge facial expressions of a 3D teacher character for an animation QA sheet. Answer with exactly one label." },
      { role: "user", content: [
        { type: "text", text: `Which ONE label best describes this teacher's facial expression and head pose? Labels: ${labels}.` },
        { type: "image_url", image_url: { url: `data:image/png;base64,${img}` } },
      ] },
    ], { schema, schemaName: "emotion", maxTokens: 2000, effort: "low", timeoutMs: 60000, retries: 2 });
    said.push(x.json.label);
  }
  res[name] = { hit: said.filter((s) => s === EMO).length, n: REPS, said };
}));
for (const [k, v] of Object.entries(res)) console.log(`${EMO} ${k}: ${v.hit}/${v.n}  ${v.said.join(",")}`);
fs.writeFileSync(path.join(OUT, `${EMO}.json`), JSON.stringify({ date: new Date().toISOString(), emotion: EMO, variants: V, res }, null, 1));
