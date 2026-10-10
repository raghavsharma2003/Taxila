// Stage C blind judges on the LIVE puppet: the approved still (image 1) against frames of the 15 s clip at a real
// product slot (image 2: 8 moments of the scene, numbered; image 3: 6 consecutive frames at 15 fps while she speaks).
// The judge is not told what the frames are meant to show, which product it is, or what we hope for.
// Gates (brief): childish <= 1/5, uncanny or "moving photo" <= 1/5, same person >= 4/5, over two model families.
//   NODE_USE_ENV_PROXY=1 node judge-live.mjs <out.json> <model> <n> <ref.png> <moments.png> <sequence.png>
import fs from "node:fs";
import { execFileSync } from "node:child_process";
for (const line of fs.readFileSync("/home/user/Taxila/.env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const [out, model, nS, ref, moments, seq] = process.argv.slice(2);
const PROMPT = `Three images.
Image 1: a character design, a single approved illustration.
Image 2: eight numbered frames (1-8, reading order) taken from a 15-second animation of a character, rendered live in a small app window.
Image 3: six numbered consecutive frames (1-6, reading order, 1/15 s apart) from the same animation.
Judge strictly, from what is drawn. Answer every item.
1. same_person: is the animated character (images 2 and 3) the same person as image 1, drawn in the same style? true/false.
2. childish: does the animated character read as childish (a child, or a toddler-cartoon look) rather than an adult? true/false.
3. uncanny: is anything uncanny (dead or misaligned eyes, rubbery or melting mouth, warped features, a face that seems to slide over the head)? true/false.
4. moving_photo: does the animation read like a photograph or a still painting being warped ("a moving photo", a deepfake), rather than a drawn character that is animated? true/false.
5. premium: how premium and production-quality is the animation, 1-5 (5 = top-tier studio quality, 3 = acceptable, 1 = broken or cheap).
6. defects: list visible rendering defects with image and frame number (seams or cut lines, smears, texture swimming, a pop or jump between consecutive frames, broken teeth or mouth interior, eye errors, hair or jewellery breaking up). Empty string if none.
7. reads_as: for each frame of image 2, what the character is doing, in 2-6 words.
8. apparent_age: an age range for the character in image 2.
9. one_fix: the single change that would most improve the animation.
Reply JSON only: {"same_person":bool,"childish":bool,"uncanny":bool,"moving_photo":bool,"premium":n,"defects":"","reads_as":{"1":"","2":"","3":"","4":"","5":"","6":"","7":"","8":""},"apparent_age":"","one_fix":""}`;
const jpg = (p) => execFileSync("python3", ["-I", "-c", `import sys,io,base64;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");b=io.BytesIO();im.save(b,"JPEG",quality=92);sys.stdout.write(base64.b64encode(b.getvalue()).decode())`, p]).toString();
const res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : { method: "blind 3-image questionnaire (ref still, 8 moments, 6 consecutive frames); prompt verbatim", prompt: PROMPT, inputs: { ref, moments, seq }, runs: [] };
const imgs = [ref, moments, seq].map((p) => ({ type: "image_url", image_url: { url: "data:image/jpeg;base64," + jpg(p), detail: "high" } }));
async function one(rep) {
  const body = { model, messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, ...imgs] }] };
  if (model === "taxila-brain") { body.max_completion_tokens = 9000; body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; } else body.max_tokens = 3000;
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(300000) });
      const j = await r.json(); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
      const t = (j.choices?.[0]?.message?.content || "").replace(/^```(json)?|```$/gm, "").trim();
      return { model, rep, date: new Date().toISOString(), answer: JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)), usage: j.usage };
    } catch (e) { if (a === 3) return { model, rep, error: String(e.message).slice(0, 200) }; await new Promise((s) => setTimeout(s, 5000 * (a + 1))); }
  }
}
const reps = Array.from({ length: +nS }, (_, i) => i);
const worker = async () => { while (reps.length) { const r = reps.shift(); const x = await one(r); res.runs.push(x); fs.writeFileSync(out, JSON.stringify(res, null, 1));
  const a = x.answer; console.log(model, r, x.error ? "ERR " + x.error : `same=${a.same_person} childish=${a.childish} uncanny=${a.uncanny} photo=${a.moving_photo} premium=${a.premium} age=${a.apparent_age} | defects: ${a.defects} | fix: ${a.one_fix}`); } };
await Promise.all([worker(), worker(), worker()]);
