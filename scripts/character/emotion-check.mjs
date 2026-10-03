// Cheap legibility self-check BEFORE the child panel (E-T4), review item 10: a vision model makes a blind forced choice
// over the 9 emotion stills of each look. Bar (the E-T4 bar, borrowed): >= 70% correct per emotion. This is a proxy:
// a model is not a 9-year-old, and n per emotion is tiny (looks x reps), so it can only flag a pooled pair, never pass
// the panel. Azure only (taxila-brain, server/azure.js); stills are synthetic renders, no child data.
//   NODE_USE_ENV_PROXY=1 node scripts/character/emotion-check.mjs [--looks teal,slate,plum] [--reps 2]
import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { chat, DEPLOY } = await import("../../server/azure.js");
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const LOOKS = opt("--looks", "teal,slate,plum").split(",");
const REPS = +opt("--reps", "2");
const E = ["warm", "encouraging", "curious", "thinking", "listening", "concerned", "delighted", "playful", "surprised"];
const DESC = {
  warm: "a warm, friendly smile", encouraging: "encouraging, supportive, urging someone on", curious: "curious, interested, intrigued",
  thinking: "thinking, concentrating, working something out", listening: "attentively listening", concerned: "gently concerned, caring",
  delighted: "delighted, celebrating", playful: "playful, sharing a gentle joke", surprised: "pleasantly surprised",
};
const schema = { type: "object", additionalProperties: false, properties: { label: { type: "string", enum: E } }, required: ["label"] };
const rows = [];
for (let r = 0; r < REPS; r++) for (const look of LOOKS) {
  const order = [...E].sort(() => Math.random() - 0.5);
  for (const e of order) {
    const ROOT = opt("--root", "docs/design/teacher/renders/{look}/emotions");
    const img = fs.readFileSync(path.join(ROOT.replace("{look}", look), `${e}.png`)).toString("base64");
    const labels = [...E].sort(() => Math.random() - 0.5).map((k) => `${k} (${DESC[k]})`).join("; ");
    const res = await chat(DEPLOY.brain, [
      { role: "system", content: "You judge facial expressions of a 3D teacher character for an animation QA sheet. Answer with exactly one label." },
      { role: "user", content: [
        { type: "text", text: `Which ONE label best describes this teacher's facial expression and head pose? Labels: ${labels}.` },
        { type: "image_url", image_url: { url: `data:image/png;base64,${img}` } },
      ] },
    ], { schema, schemaName: "emotion", maxTokens: 2000, effort: "low", timeoutMs: 60000, retries: 2 });
    rows.push({ look, rep: r, truth: e, said: res.json.label });
    process.stdout.write(`${look}:${e}->${res.json.label} `);
  }
}
const per = Object.fromEntries(E.map((e) => {
  const rr = rows.filter((x) => x.truth === e);
  const conf = {};
  for (const x of rr) conf[x.said] = (conf[x.said] || 0) + 1;
  return [e, { n: rr.length, correct: rr.filter((x) => x.said === e).length, pct: Math.round(100 * rr.filter((x) => x.said === e).length / rr.length), confusions: conf }];
}));
const out = { date: new Date().toISOString(), model: DEPLOY.brain, method: `blind forced choice, 9 labels with short glosses, shuffled; ${LOOKS.length} looks x ${REPS} reps per emotion; bar >= 70% per emotion (proxy for E-T4)`,
  overallPct: Math.round(100 * rows.filter((x) => x.said === x.truth).length / rows.length), per, rows };
fs.writeFileSync(opt("--out", "docs/design/teacher/renders/emotion-check.json"), JSON.stringify(out, null, 1));
console.log(`\noverall ${out.overallPct}%`);
for (const [e, v] of Object.entries(per)) console.log(`${e.padEnd(12)} ${v.correct}/${v.n} ${v.pct}% ${v.pct >= 70 ? "ok" : "BELOW"} ${JSON.stringify(v.confusions)}`);
