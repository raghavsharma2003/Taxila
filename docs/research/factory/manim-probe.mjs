// manim-probe.mjs — Taxila factory/video-animation-gen: LLM → Manim CE explainer, render + repair loop (2026-10-02).
// For each (model × concept): generate one Scene, render with manim (-ql), feed the traceback back up to 2 times.
// Records: first-try render pass, pass within 2 repairs, gen ms, tokens, render s, video duration vs narration plan.
// Usage: node --env-file=.env.local docs/research/factory/manim-probe.mjs --manim <path/to/manim> --work <dir> [--models taxila-codex,taxila-fast]
import fs from "node:fs"; import path from "node:path"; import { execFileSync, spawnSync } from "node:child_process";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const MANIM = arg("manim", "manim"); const WORK = arg("work", "/tmp/manim-probe"); fs.mkdirSync(WORK, { recursive: true });
const MODELS = arg("models", "taxila-codex,taxila-fast").split(",");
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const CONCEPTS = [
  { id: "c1-fraction", text: "Class 3 maths: three-quarters (3/4). A round roti is cut into 4 equal parts; 3 parts are coloured; show the fraction 3/4 with numerator = parts coloured and denominator = equal parts in total. Misconception to address: the parts must be EQUAL." },
  { id: "c2-place-value", text: "Class 2 maths: place value of 345. Show 3 hundred-flats, 4 ten-rods, 5 ones-cubes, then 345 = 300 + 40 + 5. Misconception to address: the 4 in 345 means 40, not 4." },
  { id: "c3-area", text: "Class 4 maths: area of a 4 by 3 rectangle by counting unit squares (12 square units). Rows of 4, three rows, 4 + 4 + 4 = 12 = 4 x 3. Misconception to address: area is not the perimeter." },
  { id: "c4-reflection", text: "Class 7 science: law of reflection. A ray hits a plane mirror; draw the normal; angle of incidence equals angle of reflection (both 40 degrees). Misconception to address: angles are measured from the normal, not from the mirror." },
  { id: "c5-triangle-sum", text: "Class 7 maths: angles of a triangle add up to 180 degrees. Colour the three corners, move them so they sit side by side on a straight line, which is 180 degrees." },
];
const SYSTEM = [
  "You write Manim Community Edition v0.21 Python. Output exactly one ```python fenced block and nothing else.",
  "Define exactly one class `Explainer(Scene)`. `from manim import *` only; no other imports, no files, no network, no images, no SVG files.",
  "LaTeX is NOT installed: never use MathTex, Tex, or any Tex-based mobject (including DecimalNumber/Integer/axes number labels — build labels with Text). Use Text() for all text.",
  "Audience: Indian children; audio narration is added separately. Keep text large (font_size >= 32), at most 6 words per Text, nothing touching the frame edge (stay within x∈[-6.5,6.5], y∈[-3.6,3.6]), no overlapping labels.",
  "Define a module-level list NARRATION = [(\"sentence\", seconds), ...] of 5-7 short spoken sentences (simple English) whose seconds sum to 25-35.",
  "In construct(), segment i must take exactly NARRATION[i][1] seconds: the run_time values of its play() calls plus its wait() calls must sum to that number.",
].join("\n");
async function gen(model, messages) {
  const t0 = Date.now();
  const body = { model, instructions: SYSTEM, input: messages, max_output_tokens: 12000 };
  if (model.includes("codex") || model.includes("brain")) body.reasoning = { effort: "medium" };
  const r = await fetch(BASE + "/responses", { method: "POST", headers: { "api-key": process.env.AZURE_OPENAI_API_KEY, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) return { err: `HTTP ${r.status} ${String(j?.error?.message || "").slice(0, 200)}`, ms: Date.now() - t0 };
  const text = (j.output || []).filter((o) => o.type === "message").flatMap((o) => o.content || []).map((c) => c.text || "").join("\n");
  return { code: (text.match(/```(?:python|py)?\n([\s\S]*?)```/) || [, text])[1], ms: Date.now() - t0, usage: j.usage, raw: text };
}
function render(dir, file) {
  const t0 = Date.now();
  const p = spawnSync(MANIM, ["-ql", "--disable_caching", "--media_dir", dir, file, "Explainer"], { cwd: dir, encoding: "utf8", timeout: 300000 });
  const ms = Date.now() - t0; const out = (p.stdout || "") + (p.stderr || "");
  const mp4 = execFileSync("bash", ["-c", `find ${dir} -name 'Explainer.mp4' | head -1`]).toString().trim();
  return { ok: p.status === 0 && !!mp4, ms, mp4, tail: out.split("\n").filter(Boolean).slice(-12).join("\n").slice(-1500) };
}
function planSeconds(code) { const m = code.match(/NARRATION\s*=\s*\[([\s\S]*?)\]\s*\n/); if (!m) return null; return [...m[1].matchAll(/,\s*([0-9.]+)\s*\)/g)].reduce((a, x) => a + Number(x[1]), 0); }
const results = [];
for (const model of MODELS) for (const c of CONCEPTS) {
  const dir = path.join(WORK, `${model}-${c.id}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const rec = { model, concept: c.id, rounds: [] }; let messages = [{ role: "user", content: c.text }];
  for (let round = 0; round <= 2; round++) {
    const g = await gen(model, messages); if (g.err) { rec.rounds.push({ round, err: g.err }); break; }
    const file = path.join(dir, `r${round}.py`); fs.writeFileSync(file, g.code);
    const rr = render(dir, file);
    const step = { round, gen_ms: g.ms, out_tokens: g.usage?.output_tokens, in_tokens: g.usage?.input_tokens, render_ok: rr.ok, render_ms: rr.ms, plan_s: planSeconds(g.code) };
    if (rr.ok) {
      step.video_s = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", rr.mp4]).toString().trim());
      fs.copyFileSync(rr.mp4, path.join(WORK, `${model}-${c.id}.mp4`));
      try { execFileSync("ffmpeg", ["-v", "error", "-y", "-i", rr.mp4, "-vf", `fps=${(12 / Math.max(step.video_s, 1)).toFixed(3)},scale=427:-1,tile=4x3`, "-frames:v", "1", path.join(WORK, `${model}-${c.id}-contact.jpg`)]); } catch {}
      rec.rounds.push(step); break;
    }
    step.error = rr.tail.split("\n").slice(-3).join(" | ").slice(0, 300); rec.rounds.push(step);
    messages = [...messages, { role: "assistant", content: "```python\n" + g.code + "\n```" }, { role: "user", content: "Rendering failed. Fix it and output the whole file again.\n" + rr.tail }];
  }
  rec.pass_first = !!rec.rounds[0]?.render_ok; rec.pass_any = rec.rounds.some((r) => r.render_ok);
  console.log(JSON.stringify(rec)); results.push(rec);
}
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "manim-probe-2026-10-02.json"), JSON.stringify({ date: "2026-10-02", manim: execFileSync(MANIM, ["--version"]).toString().trim(), quality: "-ql 854x480@15", results }, null, 2));
