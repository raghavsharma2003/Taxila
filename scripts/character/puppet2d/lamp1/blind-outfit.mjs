// Blind check of each outfit front (round-4 Asha), in the manner of docs/design/round4/face/source/blind.mjs: the judge is
// told nothing about who she is meant to be or what is being tested. Open questions (age, occupation, origin, clothing)
// come before any question that names a teacher, so the later items cannot lead the open answers. A model's opinion is
// a proxy, not the owner's, a parent's or a child's.
//   NODE_USE_ENV_PROXY=1 node blind-outfit.mjs <out.json> <model> <n> <label=path> ...
import fs from "node:fs";
import { execFileSync } from "node:child_process";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const [out, model, nS, ...items] = process.argv.slice(2);
const N = +nS;
export const PROMPT = `You are shown one character portrait. Answer only from what is drawn. Be blunt and specific.
1. apparent_age_range: the age range the person appears to be, as "lo-hi" years.
2. occupation_guesses: your top 3 guesses for her occupation or role, most likely first.
3. origin_guess: where in the world would you guess she is from? Open answer, as specific as the picture allows.
4. clothing: what she is wearing, in at most 12 words.
5. reads_as_teacher: could she credibly be a schoolteacher? true/false, plus one short reason.
6. friendly: how friendly and approachable does she look? 1-5 (1 = cold or stern, 5 = very warm and approachable), plus one short reason.
7. cool: if she were a teacher, how likely is a 12-year-old to think she is a "cool" teacher? 1-5 (1 = not at all, 5 = very), plus one short reason.
8. parent_professional: would a parent see her look and outfit as professional enough for their child's teacher? 1-5 (1 = not at all, 5 = fully), plus one short reason.
9. childish: does anything about the figure or the drawing read as childish, babyish, toy-like or made for toddlers? true/false, plus what.
10. sexualised: does anything read as sexualised, glamorous, seductive, coy or flirtatious (expression, pose, framing, clothing, make-up)? true/false, plus what.
11. reads_as_indian: does she read as Indian specifically? true/false, plus which details.
Reply JSON only: {"apparent_age_range":"","occupation_guesses":[],"origin_guess":"","clothing":"","reads_as_teacher":{"v":bool,"why":""},"friendly":{"v":n,"why":""},"cool":{"v":n,"why":""},"parent_professional":{"v":n,"why":""},"childish":{"v":bool,"what":""},"sexualised":{"v":bool,"what":""},"reads_as_indian":{"v":bool,"details":""}}`;
const jpg = (p) => execFileSync("python3", ["-I", "-c", `import sys,io,base64;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");im.thumbnail((1024,1024));b=io.BytesIO();im.save(b,"JPEG",quality=90);sys.stdout.write(base64.b64encode(b.getvalue()).decode())`, p]).toString();
const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : { method: "blind single-image questionnaire, no context given; PROMPT verbatim", prompt: PROMPT, runs: [] };
async function one(label, path, rep) {
  const body = { model, messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: "data:image/jpeg;base64," + jpg(path), detail: "high" } }] }] };
  if (model === "taxila-brain") { body.max_completion_tokens = 6000; body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; }
  else body.max_tokens = 3000;
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000) });
      const j = await r.json();
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
      const txt = (j.choices?.[0]?.message?.content || "").replace(/^```(json)?|```$/gm, "").trim();
      const v = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      return { label, file: path.replace(/^.*\/(r4-asha|asha)\//, "$1/"), model, rep, date: new Date().toISOString(), answer: v, usage: j.usage };
    } catch (e) { if (a === 3) return { label, model, rep, error: String(e.message).slice(0, 200) }; await new Promise((s) => setTimeout(s, 5000 * (a + 1))); }
  }
}
const jobs = [];
for (const it of items) { const [label, p] = it.split("="); for (let r = 0; r < N; r++) jobs.push([label, p, r]); }
const worker = async () => { while (jobs.length) { const [l, p, r] = jobs.shift(); const x = await one(l, p, r); res.runs.push(x); fs.writeFileSync(out, JSON.stringify(res, null, 1));
  const A = x.answer; console.log(l, model, r, x.error ? "ERR " + x.error : `${A.apparent_age_range} | ${A.occupation_guesses?.join("; ")} | teacher=${A.reads_as_teacher?.v} friendly=${A.friendly?.v} cool=${A.cool?.v} prof=${A.parent_professional?.v} childish=${A.childish?.v} sex=${A.sexualised?.v} indian=${A.reads_as_indian?.v}`); } };
await Promise.all([worker(), worker(), worker()]);
