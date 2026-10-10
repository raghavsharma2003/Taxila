// Blind check of each front with Azure vision models, in the manner of scripts/character/puppet2d/judge-r*-blind.mjs:
// the judge is told nothing about who she is meant to be (no age, no job, no country, no product). Open questions come
// before the yes/no ones so the yes/no cannot lead the open answer. A model's opinion is a proxy, not the owner's.
//   NODE_USE_ENV_PROXY=1 node blind.mjs <out.json> <model> <n> <label=path.png> ...
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
4. reads_as_teacher: could she credibly be a schoolteacher? true/false, plus one short reason.
5. childish: does anything about the figure or the drawing read as childish, babyish, toy-like or made for toddlers (proportions, eyes, style)? true/false, plus what.
6. sexualised: does anything read as sexualised, glamorous, seductive, coy or flirtatious (expression, pose, framing, clothing, make-up)? true/false, plus what.
7. reads_as_indian: does she read as Indian specifically? true/false, plus which details.
8. idealised: does the face read as an idealised doll or model face rather than a real individual? true/false.
9. style: the art style in a few words.
Reply JSON only: {"apparent_age_range":"","occupation_guesses":[],"origin_guess":"","reads_as_teacher":{"v":bool,"why":""},"childish":{"v":bool,"what":""},"sexualised":{"v":bool,"what":""},"reads_as_indian":{"v":bool,"details":""},"idealised":bool,"style":""}`;
const jpg = (p) => execFileSync("python3", ["-I", "-c", `import sys,io,base64;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");im.thumbnail((1024,1024));b=io.BytesIO();im.save(b,"JPEG",quality=90);sys.stdout.write(base64.b64encode(b.getvalue()).decode())`, p]).toString();
const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : { method: "blind single-image questionnaire, no context given; PROMPT verbatim below", prompt: PROMPT, runs: [] };
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
      return { label, file: path.replace("/home/user/Taxila/", ""), model, rep, date: new Date().toISOString(), answer: v, usage: j.usage };
    } catch (e) { if (a === 3) return { label, model, rep, error: String(e.message).slice(0, 200) }; await new Promise((s) => setTimeout(s, 5000 * (a + 1))); }
  }
}
const jobs = [];
for (const it of items) { const [label, p] = it.split("="); for (let r = 0; r < N; r++) jobs.push([label, p, r]); }
const worker = async () => { while (jobs.length) { const [l, p, r] = jobs.shift(); const x = await one(l, p, r); res.runs.push(x); fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log(l, model, r, x.error ? "ERR " + x.error : `${x.answer.apparent_age_range} | ${x.answer.occupation_guesses?.join("; ")} | ${x.answer.origin_guess} | teacher=${x.answer.reads_as_teacher?.v} childish=${x.answer.childish?.v} sex=${x.answer.sexualised?.v} indian=${x.answer.reads_as_indian?.v} ideal=${x.answer.idealised}`); } };
await Promise.all([worker(), worker(), worker()]);
