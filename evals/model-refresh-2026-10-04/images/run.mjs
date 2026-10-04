// Model refresh 2026-10-04, IMAGES. Same 10 prompts as evals/model-scout-2026-10-04/images/run.mjs (copied verbatim below:
// 5 text-free illustrations in the docs/design/assets GLOBAL WORLD STYLE, 5 English-label class diagrams) x 2 samples x 8 arms:
// gpt-image-2 medium/low (taxila-image), gpt-image-2.5-flare medium/low, gpt-image-2.5-sunburst medium/low, FLUX.2-pro
// (taxila-flux2), FLUX.2-flex (taxila-flux2-flex, deployed for measurement by deploy.mjs).
// Judges (three families; rj-holistic-model-judge-gate: atomic items, verdict in code, advisory only): taxila-brain (OpenAI
// gpt-5.6-sol, effort medium), taxila-kimi-code (Moonshot Kimi-K2.7-Code), taxila-mistral-m35 (Mistral Medium 3.5).
// grok-4-20-reasoning is NOT used (rj-grok-label-judge). My own look (results/eyeball-2026-10-04.json) is the authority.
// gpt-image models take no seed: "2 seeds" = 2 independent samples; FLUX gets seed 2000+rep (scout used 1000+rep).
// Usage (repo root): NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/model-refresh-2026-10-04/images/run.mjs [--arms a,b] [--n 2]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = new URL("../../../", import.meta.url).pathname;
const HERE = new URL("./", import.meta.url).pathname;
const IMG = HERE + "results/img/"; mkdirSync(IMG, { recursive: true });
const OUTF = HERE + "results/rows-2026-10-04.json";
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const HOST = E.match(/^https:\/\/([^.]+)\./)[1];
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

// --- price per image, Azure retail meters read 2026-10-04 (../setup/results/prices-2026-10-04.json, eastus2 Global):
// Image 2 / Image-2.5-flare / Image-2.5-sunburst: txt inp $5/1M, img opt $30/1M (identical). FLUX.2-pro "Flux 2 Pro Initial MP"
// $0.03 (1024^2 = 1 MP). FLUX.2-flex "Flex Megapixel" $0.05/MP.
const tok = (u) => u ? ((u.output_tokens || 0) * 30 + (u.input_tokens || 0) * 5) / 1e6 : null;
const JUDGE_PRICE = { "taxila-brain": { in: 4, out: 20 }, "taxila-kimi-code": { in: 0.95, out: 4 }, "taxila-mistral-m35": { in: 1.5, out: 7.5 } };
const JUDGES = { brain: "taxila-brain", kimi: "taxila-kimi-code", mistral: "taxila-mistral-m35" };

async function post(url, headers, body, timeoutMs = 300_000) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 240)}`);
  return j;
}
const oai = (dep, quality) => ({ region: "eastus2", price: tok, gen: async (prompt) => { const j = await post(`${E}/images/generations`, { "api-key": K }, { model: dep, prompt, n: 1, size: "1024x1024", quality }); return { b64: j.data[0].b64_json, usage: j.usage }; } });
const bfl = (route, dep, usd) => ({ region: "eastus2", price: () => usd, gen: async (prompt, seed) => { const j = await post(`https://${HOST}.services.ai.azure.com/providers/blackforestlabs/v1/${route}?api-version=preview`, { "api-key": K }, { model: dep, prompt, n: 1, width: 1024, height: 1024, output_format: "png", seed }); return { b64: j.data[0].b64_json }; } });
const ARMS = {
  "gpt-image-2-medium": oai("taxila-image", "medium"),
  "gpt-image-2-low": oai("taxila-image", "low"),
  "flare-medium": oai(process.env.REFRESH_DEPLOY_IMAGE25_FLARE, "medium"),
  "flare-low": oai(process.env.REFRESH_DEPLOY_IMAGE25_FLARE, "low"),
  "sunburst-medium": oai(process.env.REFRESH_DEPLOY_IMAGE25_SUNBURST, "medium"),
  "sunburst-low": oai(process.env.REFRESH_DEPLOY_IMAGE25_SUNBURST, "low"),
  "FLUX.2-pro": bfl("flux-2-pro", "taxila-flux2", 0.03),
  "FLUX.2-flex": bfl("flux-2-flex", "taxila-flux2-flex", 0.05),
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
  const body = { model, messages: [{ role: "user", content: [{ type: "text", text: judgePrompt(p) }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${jpgB64}` } }] }] };
  if (model === "taxila-brain") { body.max_completion_tokens = 6000; body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; }
  else body.max_tokens = model === "taxila-kimi-code" ? 6000 : 2000;
  let usd = 0;
  for (let a = 0; a < 3; a++) {
    try {
      const j = await post(`${E}/chat/completions`, { "api-key": K }, body, 240_000);
      const u = j.usage || {}; const pr = JUDGE_PRICE[model];
      usd += ((u.prompt_tokens || 0) * pr.in + (u.completion_tokens || 0) * pr.out) / 1e6;
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
const save = () => writeFileSync(OUTF, JSON.stringify({ date: "2026-10-04", from: "US sandbox container (latency includes the US->eastus2 round trip)", judges: JUDGES, rubric: "image-bench.mjs verbatim + atomic checks (same as model-scout images)", rows }, null, 1));
const pending = [];

async function judgeRow(row, p) {
  const b = readFileSync(ROOT + row.file).toString("base64");
  const res = await Promise.all(Object.values(JUDGES).map((m) => judge(m, b, p)));
  row.judge = {}; row.judgeErr = {}; row.verdict = {}; row.judgeUsd = 0;
  Object.keys(JUDGES).forEach((k, i) => { row.judge[k] = res[i].v; row.judgeErr[k] = res[i].err; row.verdict[k] = verdict(p, res[i].v); row.judgeUsd += res[i].usd; });
  row.judgeUsd = +row.judgeUsd.toFixed(4); save();
  console.log("  judged", row.prompt, row.arm, row.rep, JSON.stringify(Object.fromEntries(Object.entries(row.verdict).map(([k, v]) => [k, v?.pass]))));
}
async function runArm(arm) {
  for (let rep = 0; rep < N; rep++) for (const p of PROMPTS) {
    if (only && !only.includes(p.id)) continue;
    if (done.has(`${p.id}|${arm}|${rep}`)) continue;
    let res, err, ms, n429 = 0;
    for (let attempt = 0; attempt < 6; attempt++) {
      const t0 = performance.now();
      try { res = await ARMS[arm].gen(p.text, 2000 + rep); err = null; ms = Math.round(performance.now() - t0); break; }
      catch (e) { err = String(e.message); ms = Math.round(performance.now() - t0); if (!/429|ETIMEDOUT|fetch failed|aborted|timeout|50[023]/i.test(err)) break; if (/429/.test(err)) n429++; await new Promise((r) => setTimeout(r, 45_000)); }
    }
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].prompt === p.id && rows[i].arm === arm && rows[i].rep === rep) rows.splice(i, 1);
    const row = { prompt: p.id, kind: p.kind, arm, region: ARMS[arm].region, rep, ms, n429, err, at: new Date().toISOString() };
    if (res) {
      const stem = `${p.id}__${arm}__${rep}`, png = IMG + stem + ".png", jpg = IMG + stem + ".jpg";
      writeFileSync(png, Buffer.from(res.b64, "base64"));
      execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${png}");print(im.size);im=im.convert("RGB");im.thumbnail((768,768));im.save("${jpg}",quality=85)`]);
      execFileSync("rm", [png]);
      row.file = jpg.replace(ROOT, ""); row.usage = res.usage || null; row.usd = +(ARMS[arm].price(res.usage) ?? 0).toFixed(4);
      pending.push(judgeRow(row, p));
    }
    rows.push(row); save();
    console.log(p.id.padEnd(14), arm.padEnd(18), String(rep), (ms + "ms").padStart(8), err ? "ERR " + err.slice(0, 140) : "", row.usd ?? "", "429s:" + n429);
  }
}
await Promise.all(arms.map(runArm));
await Promise.all(pending); save();
console.log("done", rows.length);
