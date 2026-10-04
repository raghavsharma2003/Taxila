// Model scout 2026-10-04, IMAGES. 10 prompts (5 text-free illustrations in the docs/design/assets house style, 5 labelled
// diagrams with English labels) x 2 samples x 5 Azure arms, judged by two vision judges from different families
// (taxila-brain = OpenAI gpt-5.6-sol; grok-4-20-reasoning = xAI). The 1-5 rubric (adherence/text/authenticity/appeal/
// artifacts) is VERBATIM from docs/research/models/image-bench.mjs so scores sit next to 2026-10-02 and the scout run.
// Added (rj-holistic-model-judge-gate): atomic per-label checks and binary items, the VERDICT is computed in code.
// Bedrock image arms: none callable (see REPORT §Bedrock), so this harness is Azure-only.
// MAI has no seed parameter (400 unsupported_request_argument "seed"), so "2 seeds" = 2 independent samples; FLUX gets seed.
// Usage (repo root): NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/model-scout-2026-10-04/images/run.mjs [--arms a,b] [--n 2]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = new URL("../../../", import.meta.url).pathname;
const HERE = new URL("./", import.meta.url).pathname;
const IMG = HERE + "results/img/"; mkdirSync(IMG, { recursive: true });
const OUTF = HERE + "results/rows-2026-10-04.json";
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const HOST = E.match(/^https:\/\/([^.]+)\./)[1];
const SI = process.env.AZURE_AI_SOUTHINDIA_ENDPOINT.replace(/\/$/, ""), SIK = process.env.AZURE_AI_SOUTHINDIA_KEY;
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

// House style condensed from docs/design/assets/CODEX-PROMPT.md §4 GLOBAL WORLD STYLE (colour NAMES, not hex: hex in a
// prompt can be drawn). The no-text rule is the manifest's P9.
const STYLE = "Matte gouache-and-pencil digital painting on warm paper grain, soft edges, visible brush texture. One soft cream key light from the upper left, gentle fill. Palette: warm paper off-white, deep ink blue, teal, terracotta, leaf green, neem green, dusty rose, pale day-sky blue, stone grey, natural Indian skin tones; no marigold, saffron, gold, mustard or bright yellow, no neon, no decorative gradients. Everyday, specific, unglamorous modern Indian life. Absolutely no text, letters, digits, symbols, logos, signage or watermarks anywhere.";
const DIAG = "Flat, clean educational illustration for an Indian school science book, white background, bright flat colours, thin dark leader lines, large readable English labels in a plain sans-serif font, no title, no other text.";
export const PROMPTS = [
  // text-free illustrations (manifest subjects: bg/home-young-wide, bg/home-older-wide, topics/mango-basket, subjects/science; I5 people)
  { id: "i1-courtyard", kind: "illus", text: `${STYLE} A sunlit Indian home courtyard in calm morning light, rounder and brighter for ages 6-9: limewash walls in warm off-white, a neem tree at the right edge with its leaf shadows on the wall, an open wooden veranda doorway at the left, empty and calm inside, white rice-flour kolam dots on the floor near the edges only, two terracotta pots with leafy plants and a magenta bougainvillea spray, a charpai with teal cotton-tape weave at the far right. Detail at the edges, the centre third calm and low in detail. No people.` },
  { id: "i2-rooftop", kind: "illus", text: `${STYLE} A flat Indian rooftop at dusk, editorial and muted for ages 10-15: a black plastic water tank on a low brick stand at one edge, a simple painted iron rail, a steel telescope on a tripod pointing at the sky, a string of unlit bulbs on a wire, city lights far below as tiny cool-white and soft-rose points (never orange). Deep indigo sky with a faint rose-violet glow at the horizon, never orange or gold. Lots of negative space. No people.` },
  { id: "i3-mangoes", kind: "illus", text: `${STYLE} One small still life, centred, filling about 85% of the frame, on a plain warm off-white paper background: a shallow woven basket heaped with raw green mangoes with a rosy blush, too many to count at a glance. Rounded and bright for ages 6-9. No ground plane, no cast shadow outside the object, no faces on objects.` },
  { id: "i4-science", kind: "illus", text: `${STYLE} Still life, centred, on a plain warm off-white paper background, editorial and muted for ages 10-15: a glass jar with a sprouting bean, a magnifying glass and a red horseshoe magnet. No faces on objects, no labels on the jar.` },
  { id: "i5-children", kind: "illus", text: `${STYLE} Two Indian children about 8 years old with different natural medium and darker skin tones and varied hair, one wearing glasses, in plain school uniforms with no logos, sitting cross-legged on a woven floor mat in a courtyard and sharing a completely blank black slate and a piece of chalk, both smiling, friendly and never stereotyped. Hands with five fingers. The slate has nothing written on it.` },
  // labelled diagrams (English labels; Hindi is never baked in: diagram-router-no-baked-labels)
  { id: "d1-plant", kind: "diagram", labels: ["Root", "Stem", "Leaf", "Flower", "Fruit"],
    text: "A clean labelled educational diagram of the parts of a flowering plant for an Indian class 3 science book. Exactly five English labels with leader lines pointing to the right part: Root, Stem, Leaf, Flower, Fruit. White background, bright flat colours, large readable labels.", science: "each leader line ends on its part; the root is below the soil line" },
  { id: "d2-watercycle", kind: "diagram", labels: ["Evaporation", "Condensation", "Precipitation", "Collection"],
    text: `${DIAG} The water cycle for class 5: a sun, the sea, clouds over green hills, rain falling from the clouds, a river flowing back into the sea. Exactly four labels with arrows: Evaporation (on upward arrows rising from the sea), Condensation (at the clouds), Precipitation (at the falling rain), Collection (at the river and sea).`, science: "evaporation arrows go UP from water; rain falls from clouds; the river flows downhill into the sea" },
  { id: "d3-circuit", kind: "diagram", labels: ["Cell", "Switch", "Bulb", "Wire"],
    text: `${DIAG} A simple closed electric circuit for class 6: one dry cell, one switch shown in the CLOSED (ON) position so the metal strip touches both contacts, one glowing torch bulb, joined by wires into one complete unbroken loop. Exactly four labels with leader lines: Cell, Switch, Bulb, Wire.`, science: "the switch is visibly closed and the loop is unbroken, so the bulb glowing is consistent" },
  { id: "d4-digestive", kind: "diagram", labels: ["Mouth", "Food pipe", "Stomach", "Small intestine", "Large intestine"],
    text: `${DIAG} The human digestive system for class 7, front view inside a simple outline of a child's head and torso. Exactly five labels with leader lines: Mouth, Food pipe, Stomach, Small intestine, Large intestine.`, science: "stomach on the body's left (viewer's right) below the ribs; small intestine coiled in the centre and framed by the large intestine; food pipe runs from throat to stomach" },
  { id: "d5-flower", kind: "diagram", labels: ["Petal", "Sepal", "Stamen", "Pistil"],
    text: `${DIAG} A labelled longitudinal section of a flower for class 7. Exactly four labels with leader lines: Petal, Sepal, Stamen, Pistil.`, science: "sepals are the small green leaf-like parts at the base outside the petals; stamens (filament + anther) surround the central pistil" },
];

// --- price per image, Azure retail read 2026-10-04 (evals/model-refresh-2026-10-04/setup/results/prices-2026-10-04.json)
const PRICE = {
  "MAI-Image-2.6": (u) => (u.num_output_tokens * 38 + (u.num_input_text_tokens || 0) * 5) / 1e6,
  "MAI-Image-2.6-Flash": (u) => (u.num_output_tokens * 19 + (u.num_input_text_tokens || 0) * 1.75) / 1e6,
  "MAI-Image-2.5-Pro": (u) => (u.num_output_tokens * 106 + (u.num_input_text_tokens || 0) * 5) / 1e6,
  "FLUX.2-pro": () => 0.03, // "Flux 2 Pro Initial MP" Global, 1024x1024 = 1 MP
  "gpt-image-2-medium": (u) => u ? ((u.output_tokens || 0) * 30 + (u.input_tokens || 0) * 5) / 1e6 : 0.053,
};
const JUDGE_PRICE = { "taxila-brain": { in: 4, out: 20 }, "grok-4-20-reasoning": { in: 2, out: 6, u: true } }; // grok-4-20: [U] stand-in = grok-4.6 Direct $2/$6

async function post(url, headers, body, timeoutMs = 240_000) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 240)}`);
  return j;
}
const mai = (dep) => async (prompt) => { const j = await post(`${SI}/mai/v1/images/generations`, { "api-key": SIK }, { model: dep, prompt, width: 1024, height: 1024 }); return { b64: j.data[0].b64_json, usage: j.usage }; };
const ARMS = {
  "MAI-Image-2.6": { region: "southindia", gen: mai("scout-mai-image26") },
  "MAI-Image-2.6-Flash": { region: "southindia", gen: mai("scout-mai-image26-flash") },
  "MAI-Image-2.5-Pro": { region: "southindia", gen: mai("scout-mai-image25-pro") },
  "FLUX.2-pro": { region: "eastus2", gen: async (prompt, seed) => { const j = await post(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/flux-2-pro?api-version=preview`, { "api-key": K }, { model: "taxila-flux2", prompt, n: 1, width: 1024, height: 1024, output_format: "png", seed }); return { b64: j.data[0].b64_json }; } },
  "gpt-image-2-medium": { region: "eastus2", gen: async (prompt) => { const j = await post(`${E}/images/generations`, { "api-key": K }, { model: "taxila-image", prompt, n: 1, size: "1024x1024", quality: "medium" }); return { b64: j.data[0].b64_json, usage: j.usage }; } },
};

function judgePrompt(p) {
  const rubric = `You judge an image generated for an Indian children's learning app (classes 1-9). The prompt was: "${p.text}"
Score each 1-5: adherence (everything asked is present, nothing odd), text (labels/numbers spelled right AND pointing at the right part; 5 if no text was asked and none appears; 1 if gibberish text appears), authenticity (looks genuinely Indian where relevant, no stereotype or Western default), appeal (a 9-year-old would like it), artifacts (5 = no anatomical/rendering defects).`;
  if (p.kind === "diagram") return `${rubric}
Then check each requested label ATOMICALLY. Look at where its leader line or arrow actually ENDS, not where the label should be. Do not assume correctness: read what is drawn.
Requested labels: ${p.labels.join(", ")}. Science that must hold: ${p.science}.
JSON only: {"adherence":n,"text":n,"authenticity":n,"appeal":n,"artifacts":n,
"labels":[{"label":"<requested>","present":bool,"spelled_right":bool,"points_to_right_part":bool,"note":"what it actually points at"}],
"extra_text":"any other text drawn (title, stray or gibberish words), or empty","science_ok":bool,"science_note":"short","issue":"one short sentence"}`;
  return `${rubric}
Also answer these yes/no items about what is actually drawn: any_text (any letters, digits, symbols, signage, watermark or pseudo-text anywhere), house_style (matte gouache-and-pencil painting on paper grain with soft edges, NOT glossy 3D render, NOT flat vector, NOT photo), forbidden_colour (any large area of marigold, saffron, gold, mustard or bright yellow), hands_or_faces_defect (any malformed hand, finger count, eye or face; false if no people).
JSON only: {"adherence":n,"text":n,"authenticity":n,"appeal":n,"artifacts":n,"any_text":bool,"house_style":bool,"forbidden_colour":bool,"hands_or_faces_defect":bool,"issue":"one short sentence"}`;
}
async function judge(model, jpgB64, p) {
  const body = { model, max_completion_tokens: 6000, messages: [{ role: "user", content: [{ type: "text", text: judgePrompt(p) }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpgB64}` } }] }] };
  if (model === "taxila-brain") { body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; }
  let usd = 0;
  for (let a = 0; a < 3; a++) {
    try {
      const j = await post(`${E}/chat/completions`, { "api-key": K }, body, 180_000);
      const u = j.usage || {}; const pr = JUDGE_PRICE[model];
      usd += ((u.prompt_tokens || 0) * pr.in + (u.completion_tokens || 0) * pr.out + (model.startsWith("grok") ? (u.completion_tokens_details?.reasoning_tokens || 0) * pr.out : 0)) / 1e6;
      const txt = (j.choices?.[0]?.message?.content || "").replace(/^```(json)?|```$/gm, "").trim();
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      return { v: JSON.parse(txt.slice(s, e + 1)), usd };
    } catch (e) { if (a === 2) return { v: null, err: String(e.message).slice(0, 200), usd }; await new Promise((r) => setTimeout(r, 3000)); }
  }
}
// code verdicts (judge supplies atomic observations; code decides)
export function verdict(p, v) {
  if (!v) return null;
  if (p.kind === "diagram") {
    const ls = p.labels.map((l) => (v.labels || []).find((x) => String(x.label).toLowerCase() === l.toLowerCase()));
    const correct = ls.filter((x) => x && x.present && x.spelled_right && x.points_to_right_part).length;
    return { labels_correct: correct, labels_total: p.labels.length, science_ok: !!v.science_ok, pass: correct === p.labels.length && !!v.science_ok };
  }
  return { pass: !v.any_text && (v.adherence ?? 0) >= 4 && (v.artifacts ?? 0) >= 4 && !v.hands_or_faces_defect, any_text: !!v.any_text, house_style: !!v.house_style, forbidden_colour: !!v.forbidden_colour };
}

const N = +arg("n", 2);
const arms = arg("arms", Object.keys(ARMS).join(",")).split(",");
const only = arg("prompts", null)?.split(",");
const rows = existsSync(OUTF) ? JSON.parse(readFileSync(OUTF, "utf8")).rows : [];
const done = new Set(rows.filter((r) => r.file).map((r) => `${r.prompt}|${r.arm}|${r.rep}`));
const save = () => writeFileSync(OUTF, JSON.stringify({ date: "2026-10-04", from: "US sandbox container (latency includes the US->region round trip)", judges: ["taxila-brain (gpt-5.6-sol, effort medium)", "grok-4-20-reasoning (xAI)"], rubric: "image-bench.mjs verbatim + atomic checks", rows }, null, 1));

async function runArm(arm) {
  for (let rep = 0; rep < N; rep++) for (const p of PROMPTS) {
    if (only && !only.includes(p.id)) continue;
    if (done.has(`${p.id}|${arm}|${rep}`)) continue;
    let res, err, ms, n429 = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const t0 = performance.now();
      try { res = await ARMS[arm].gen(p.text, 1000 + rep); err = null; ms = Math.round(performance.now() - t0); break; }
      catch (e) { err = String(e.message); ms = Math.round(performance.now() - t0); if (!/429|ETIMEDOUT|fetch failed|aborted|timeout|50[023]/i.test(err)) break; if (/429/.test(err)) n429++; await new Promise((r) => setTimeout(r, 60_000)); }
    }
    const row = { prompt: p.id, kind: p.kind, arm, region: ARMS[arm].region, rep, ms, n429, err };
    if (res) {
      const stem = `${p.id}__${arm}__${rep}`, png = IMG + stem + ".png", jpg = IMG + stem + ".jpg";
      writeFileSync(png, Buffer.from(res.b64, "base64"));
      execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}");print(im.size);im=im.convert("RGB");im.thumbnail((768,768));im.save("${jpg}",quality=85)`]);
      execFileSync("rm", [png]);
      row.file = jpg.replace(ROOT, ""); row.usage = res.usage || null; row.usd = +PRICE[arm](res.usage).toFixed(4);
      const b = readFileSync(jpg).toString("base64");
      const [jb, jg] = await Promise.all([judge("taxila-brain", b, p), judge("grok-4-20-reasoning", b, p)]);
      row.judge = { brain: jb.v, grok: jg.v }; row.judgeErr = { brain: jb.err, grok: jg.err }; row.judgeUsd = +(jb.usd + jg.usd).toFixed(4);
      row.verdict = { brain: verdict(p, jb.v), grok: verdict(p, jg.v) };
    }
    rows.push(row); save();
    console.log(p.id.padEnd(14), arm.padEnd(20), String(rep), (ms + "ms").padStart(8), err ? "ERR " + err.slice(0, 120) : "", row.verdict ? `brain:${JSON.stringify(row.verdict.brain)} grok:${JSON.stringify(row.verdict.grok)}` : "", row.usd ?? "");
  }
}
await Promise.all(arms.map(runArm));
console.log("done", rows.length);
