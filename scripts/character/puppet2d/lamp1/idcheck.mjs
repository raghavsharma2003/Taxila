// Blind identity + expression legibility check on each family's six frames (3 x 2 grid, reading order 1-6; order is
// rest, speaking, listening, thinking, warm, blink but the judge is NOT told that). A model's opinion is a proxy.
//   NODE_USE_ENV_PROXY=1 node idcheck.mjs <out.json> <model> <n> <label=grid.png> ...
import fs from "node:fs";
import { execFileSync } from "node:child_process";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const [out, model, nS, ...items] = process.argv.slice(2);
const PROMPT = `The image is a 3 x 2 grid of six portraits; cells are numbered 1-6 in reading order (top row 1, 2, 3; bottom row 4, 5, 6).
Judge strictly, from what is drawn.
1. same_person: are all six the same person drawn in the same art style? true/false.
2. differences: for each of cells 2-6, any difference from cell 1 in face shape, facial features, apparent age, skin tone, hair, jewellery, clothing or art style. IGNORE expression, gaze direction and head tilt. Empty string if none.
3. identity_score: identity consistency across the six, 1-5 (5 = clearly one character sheet, 3 = recognisably the same but with visible drift, 1 = different people).
4. state: for each cell 1-6, what the face is doing, in 2-5 words (open answer).
5. anything_off: anything in any cell that reads as childish, sexualised, disapproving, uncanny or broken, with the cell number. Empty string if none.
Reply JSON only: {"same_person":bool,"differences":{"2":"","3":"","4":"","5":"","6":""},"identity_score":n,"state":{"1":"","2":"","3":"","4":"","5":"","6":""},"anything_off":""}`;
const jpg = (p) => execFileSync("python3", ["-I", "-c", `import sys,io,base64;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");b=io.BytesIO();im.save(b,"JPEG",quality=90);sys.stdout.write(base64.b64encode(b.getvalue()).decode())`, p]).toString();
const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : { method: "blind 3x2 grid questionnaire; prompt verbatim", prompt: PROMPT, runs: [] };
async function one(label, p, rep) {
  const body = { model, messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + jpg(p), detail: "high" } }] }] };
  if (model === "taxila-brain") { body.max_completion_tokens = 8000; body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; } else body.max_tokens = 3000;
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300000) });
      const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
      const t = (j.choices?.[0]?.message?.content || "").replace(/^```(json)?|```$/gm, "").trim();
      return { label, model, rep, date: new Date().toISOString(), answer: JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)), usage: j.usage };
    } catch (e) { if (a === 3) return { label, model, rep, error: String(e.message).slice(0, 200) }; await new Promise((s) => setTimeout(s, 5000 * (a + 1))); }
  }
}
const jobs = []; for (const it of items) { const [l, p] = it.split("="); for (let r = 0; r < +nS; r++) jobs.push([l, p, r]); }
const worker = async () => { while (jobs.length) { const [l, p, r] = jobs.shift(); const x = await one(l, p, r); res.runs.push(x); fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log(l, model, r, x.error ? "ERR " + x.error : `same=${x.answer.same_person} id=${x.answer.identity_score} | ${Object.values(x.answer.state || {}).join(" / ")} | off: ${x.answer.anything_off}`); } };
await Promise.all([worker(), worker(), worker()]);
