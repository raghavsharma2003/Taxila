// gnm round 2: reference portrait sets for slate and plum from the Azure Foundry image deployment (taxila-image),
// in the teal set's style (merged/identity/gen-refs.mjs, whose teal set the GNM teal was fitted to). art/gen/teacher has
// turnarounds for arjun / uma, but they are stylised CG concept art ("clearly an illustration-to-3D concept, not a
// photograph"), arjun is 26 and wears glasses: unusable for landmark fitting and photographic skin projection.
// Front neutral from text; every other view is an EDIT of that front ("the same person"). Slate is shot WITHOUT glasses
// (VERDICT: frames throw the landmarks; the lens mesh goes on after the fit). No names in prompts or files.
//   NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/gnm/gen-refs.mjs --look slate [--only front,...]
import fs from "node:fs";
import path from "node:path";
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const LOOK = opt("--look", "slate");
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const DEP = process.env.DEPLOY_IMAGE || "taxila-image";
const OUT = `art/character/bakeoff/gnm/refs/${LOOK}`;
fs.mkdirSync(OUT, { recursive: true });
// shapes, not lines: identity as attributes (TEACHER-VISUAL 4.3 rows 2 and 3; the coordinator's 2026-10-04 briefs)
const IDENT = {
  slate: { who: "man", p: ["he", "his", "him"], d: "a friendly Indian man schoolteacher in his late 30s, Monk skin tone 7 (medium-deep warm brown), "
    + "an open oval face, dark brown eyes, natural dark eyebrows, short dense black hair in tight natural curls, light short stubble (not a beard), "
    + "a slate-blue check cotton shirt worn open over a plain off-white t-shirt, no glasses, no jewellery" },
  plum: { who: "woman", p: ["she", "her", "her"], d: "a kind older Indian woman schoolteacher in her mid-50s, Monk skin tone 8 (deep warm brown), "
    + "a round-oval face with soft natural age lines, dark brown eyes, natural eyebrows, dark brown-black hair with a few grey strands pulled back "
    + "into a neat low bun at the nape with a centre parting, small gold stud earrings, a plum-coloured cotton saree with a thin rust-red border and a "
    + "muted mustard blouse, the pallu over her left shoulder, no bindi, no other jewellery" },
};
const I = IDENT[LOOK], [S, P, O] = I.p;
const STYLE = "Studio reference photograph for a 3D character artist: head and upper shoulders, perfectly even soft frontal studio light, "
  + "no hard shadows, no rim light, plain light warm-grey seamless background, sharp focus, natural skin texture with visible pores, "
  + "photoreal-leaning, neutral colour grading, 85mm lens, camera at eye level. A kind, approachable adult teacher; modest, professional, "
  + "not glamorous. No text, no watermark, no hands in frame.";
const VIEWS = {
  front: `Facing the camera straight on, head level, eyes looking into the lens, a relaxed neutral expression with closed lips.`,
  q3_left: `Identical light and background; ${S} has turned ${P} head 35 degrees to ${P} right (we see more of ${P} left cheek), eyes following the head, neutral closed-lip expression.`,
  q3_right: `Identical light and background; ${S} has turned ${P} head 35 degrees to ${P} left (we see more of ${P} right cheek), eyes following the head, neutral closed-lip expression.`,
  q45_left: `Identical light and background; ${P} head is turned exactly 45 degrees to ${P} right (we see more of ${P} left cheek), head level, not tilted up or down, eyes following the head, neutral closed-lip expression.`,
  q45_right: `Identical light and background; ${P} head is turned exactly 45 degrees to ${P} left (we see more of ${P} right cheek), head level, not tilted up or down, eyes following the head, neutral closed-lip expression.`,
  profile90_left: `Identical light and background; a TRUE side profile: ${P} head is turned exactly 90 degrees so that ${P} nose points straight at the right edge of the image, the full ear is visible, head level (not tilted up or down), neutral closed-lip expression, the whole jaw line, chin and front of the neck clearly visible against the background.`,
  profile90_right: `Identical light and background; a TRUE side profile: ${P} head is turned exactly 90 degrees so that ${P} nose points straight at the left edge of the image, the full ear is visible, head level (not tilted up or down), neutral closed-lip expression, the whole jaw line, chin and front of the neck clearly visible against the background.`,
};
const only = opt("--only", Object.keys(VIEWS).join(",")).split(",");
async function save(name, j, prompt) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(j.data[0].b64_json, "base64"));
  const metaF = path.join(OUT, "refs.json");
  const meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF)) : { model: DEP, look: LOOK, views: {} };
  meta.views[name] = { prompt, date: new Date().toISOString(), usage: j.usage ?? null };
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  console.log(`[refs] ${LOOK} ${name}`);
}
async function call(url, init, name) {
  for (let a = 0; a < 3; a++) {
    const r = await fetch(url, init());
    if (r.ok) return r.json();
    const t = (await r.text()).slice(0, 300);
    console.log(`[refs] ${name} HTTP ${r.status} (try ${a + 1}): ${t}`);
    if (r.status < 429 && r.status !== 408) throw new Error(t);
    await new Promise((res) => setTimeout(res, 15000));
  }
  throw new Error(`${name} failed`);
}
if (only.includes("front")) {
  const prompt = `${STYLE} Subject: ${I.d}. ${VIEWS.front}`;
  await save("front", await call(`${E}/images/generations`, () => ({ method: "POST", headers: { "api-key": K, "content-type": "application/json" },
    body: JSON.stringify({ model: DEP, prompt, n: 1, size: "1024x1536", quality: "high" }) }), "front"), prompt);
}
const rest = only.filter((v) => v !== "front");
for (let i = 0; i < rest.length; i += 3) await Promise.all(rest.slice(i, i + 3).map(async (v) => {
  const prompt = `The same ${I.who} as in the input photo, same identity, same face, hair and clothes. ${STYLE} ${VIEWS[v]}`;
  const mk = () => { const fd = new FormData(); fd.append("model", DEP); fd.append("prompt", prompt); fd.append("n", "1"); fd.append("size", "1024x1536");
    fd.append("quality", "high"); fd.append("input_fidelity", "high");
    fd.append("image[]", new Blob([fs.readFileSync(path.join(OUT, "front.png"))], { type: "image/png" }), "front.png"); return { method: "POST", headers: { "api-key": K }, body: fd }; };
  try { await save(v, await call(`${E}/images/edits`, mk, v), prompt); } catch (e) { console.log(`[refs] FAIL ${v}: ${e.message}`); }
}));
