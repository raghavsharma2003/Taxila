// r5 viseme gate: blind forced-choice labelling of mouth crops by a Foundry vision model. One crop per call (no
// side-by-side comparison), anonymous shuffled ids, no builder notes, the 9 labels as phoneme examples only.
//   node labeltest.mjs <cropDir> <model> <out.json>
import fs from "node:fs";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const [dir, model = "taxila-brain", out] = process.argv.slice(2);
const key = JSON.parse(fs.readFileSync(`${dir}/key.json`, "utf8"));   // id -> true class (never sent)
const LABELS = { A: "aa (as in 'baat', 'father')", B: "o (as in 'go', 'bol')", C: "ee / e (as in 'see', 'seekh')", D: "oo / u (as in 'food', 'bubbly')",
  E: "m / b / p (as in 'mama', 'bus', 'paani')", F: "f / v (as in 'fan', 'van')", G: "l / t / d / n (as in 'lal', 'tum', 'din', 'naam')",
  H: "ch / j / sh (as in 'chalo', 'jaana', 'shaam')", I: "a surprised 'oh!' expression (not a speech sound)" };
const CLS = { aa: "A", o: "B", ee: "C", oo: "D", mbp: "E", fv: "F", ltdn: "G", ch: "H", surprise: "I" };
const prompt = `This is a close-up of the mouth of an animated cartoon character (soft 3D cartoon style) captured in one frame while speaking a Hindi-English sentence, or making a facial expression. Which ONE of these is the mouth shape showing? Choose the single best match.\n${Object.entries(LABELS).map(([k, v]) => `${k}: ${v}`).join("\n")}\nReply JSON only: {"label":"<letter>","why":"<10 words>"}`;
const REPS = +(process.env.REPS || 1);   // independent calls per crop (n = crops x REPS)
const ids = Object.keys(key).sort().flatMap((id) => Array(REPS).fill(id));
const res = [];
let ok = 0;
for (const id of ids) {
  const img = fs.readFileSync(`${dir}/${id}.jpg`).toString("base64");
  const body = { model, max_completion_tokens: 4000, response_format: { type: "json_object" }, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + img, detail: "high" } }] }] };
  if (/brain|gpt/.test(model)) body.reasoning_effort = "low";
  let txt = "";
  for (let a = 0; a < 3 && !txt; a++) {
    const r = await fetch(E + "/chat/completions", { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    txt = j.choices?.[0]?.message?.content || "";
    if (!txt) { console.error(id, JSON.stringify(j).slice(0, 200)); await new Promise((r) => setTimeout(r, 3000)); }
  }
  let lab = "?"; try { lab = JSON.parse(txt.match(/\{[\s\S]*\}/)[0]).label.trim().toUpperCase().slice(0, 1); } catch {}
  const truth = CLS[key[id]], hit = lab === truth;
  ok += hit;
  res.push({ id, truth: key[id], said: lab, hit, why: txt.slice(0, 160) });
  process.stdout.write(hit ? "+" : "-");
}
const perClass = {};
for (const r of res) { const c = perClass[r.truth] || (perClass[r.truth] = { n: 0, hit: 0, said: [] }); c.n++; c.hit += r.hit; c.said.push(r.said); }
const summary = { model, n: res.length, correct: ok, accuracy: +(ok / res.length).toFixed(3), perClass };
fs.writeFileSync(out, JSON.stringify({ summary, res }, null, 1));
console.log("\n" + JSON.stringify(summary));
