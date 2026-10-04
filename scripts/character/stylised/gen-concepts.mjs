// Stylised-teacher concept sheet (docs/design/teacher/stylised/RESEARCH.md §concepts).
// Four style directions x (1 front portrait from text + 4 expression EDITS of that front) = 20 images on the Azure
// Foundry image deployment (taxila-image = gpt-image-2). Edits of the front keep the identity and style consistent.
//   NODE_USE_ENV_PROXY=1 node scripts/character/stylised/gen-concepts.mjs [--only a,b] [--views front,talking,...]
import fs from "node:fs";
import path from "node:path";
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const DEP = process.env.DEPLOY_IMAGE || "taxila-image";
const OUT = "docs/design/teacher/stylised/concepts";
fs.mkdirSync(OUT, { recursive: true });

// identity as attributes (shapes, not lines)
const IDENT = "a warm, friendly Indian woman schoolteacher in her late 20s, warm medium-brown skin, kind dark brown eyes, "
  + "natural dark eyebrows, dark brown-black hair in a neat low bun with a centre parting and a couple of soft loose strands, "
  + "small gold stud earrings, a small dark bindi, a teal cotton kurti with a thin orange piping at the neckline; "
  + "approachable, modest, cheerful, someone a 7-year-old would instantly trust";
const STYLES = {
  a: "Modern Japanese anime feature-film character design: clean confident line art, cel shading with two tones and soft "
    + "gradient highlights, expressive large-but-human eyes with detailed irises, simplified nose, appealing human proportions "
    + "(not chibi), soft pastel daylight palette. A polished key-visual quality illustration.",
  b: "Stylised 3D animated feature-film character, high-end family-movie look: appealing exaggerated proportions (slightly "
    + "larger head and eyes, soft rounded forms), subsurface-scattering skin, groomed stylised hair clumps, soft global "
    + "illumination studio render with gentle rim light. Warm, polished, cinematic.",
  // v2 (2026-10-04): v1 came out as a second family-movie render; push toward the phone-emoji-avatar register
  c: "3D emoji-avatar cartoon human, like a phone messaging-app avatar sticker: an oversized, almost spherical head about "
    + "as wide as the shoulders on a tiny simplified torso, very simplified geometric features, large simple oval eyes "
    + "with a single highlight, a minimal small nose, a simple soft mouth, hair as smooth sculpted solid shapes with no "
    + "individual strands, flat matte vinyl-toy materials with no skin texture and no pores, bright even soft lighting, "
    + "clearly a toy-like avatar, not a film character.",
  d: "Flat 2D vector illustration in the style of a friendly language-learning app character: bold simple geometric shapes, "
    + "flat solid colours with no gradients and no texture, thick rounded forms, minimal facial features (dot-like eyes with "
    + "a small highlight, simple curved mouth), playful and bright, clean edges, sticker-like.",
};
const COMMON = "Head and upper shoulders, centred, facing the viewer, plain soft light warm-cream background. "
  + "No text, no letters, no watermark, no logo, no frame, no hands in frame.";
const VIEWS = {
  front: { gen: true, pose: "Character design front portrait: looking straight at the viewer with a gentle, relaxed closed-mouth smile." },
  talking: { pose: "She is mid-sentence, explaining something warmly: mouth open in a clear speaking shape, eyebrows lifted in engagement, eyes bright and on the viewer." },
  listening: { pose: "She is listening attentively to a child: head tilted slightly to one side, soft closed-mouth smile, eyebrows gently raised, eyes focused on the viewer, mid-nod." },
  thinking: { pose: "She is thinking about a question: eyes looking up and to one side, lips pressed and pushed slightly to one side, one eyebrow raised, head tilted slightly back." },
  happy: { pose: "She is delighted and encouraging, praising a child: a big warm open smile showing upper teeth, eyes crinkled with joy, eyebrows lifted, cheeks raised." },
};
const only = opt("--only", "a,b,c,d").split(",");
const views = opt("--views", Object.keys(VIEWS).join(",")).split(",");
const metaF = path.join(OUT, "concepts.json");
const meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF)) : { model: DEP, images: {} };
function save(name, j, prompt) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(j.data[0].b64_json, "base64"));
  meta.images[name] = { prompt, date: new Date().toISOString(), usage: j.usage ?? null };
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  console.log(`[concept] ${name}`);
}
async function post(url, init, name) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, init());
    if (r.ok) return r.json();
    const t = (await r.text()).slice(0, 300);
    if (r.status !== 429 && r.status < 500) throw new Error(`${name} HTTP ${r.status}: ${t}`);
    console.log(`[concept] retry ${name} ${r.status}`); await new Promise((s) => setTimeout(s, 15000 * (i + 1)));
  }
  throw new Error(`${name}: retries exhausted`);
}
async function gen(name, prompt) {
  const j = await post(`${E}/images/generations`, () => ({ method: "POST", headers: { "api-key": K, "content-type": "application/json" },
    body: JSON.stringify({ model: DEP, prompt, n: 1, size: "1024x1024", quality: "high" }) }), name);
  save(name, j, prompt);
}
async function edit(name, prompt, src) {
  const j = await post(`${E}/images/edits`, () => {
    const fd = new FormData();
    fd.append("model", DEP); fd.append("prompt", prompt); fd.append("n", "1"); fd.append("size", "1024x1024"); fd.append("quality", "high");
    fd.append("input_fidelity", "high");
    fd.append("image[]", new Blob([fs.readFileSync(src)], { type: "image/png" }), "front.png");
    return { method: "POST", headers: { "api-key": K }, body: fd };
  }, name);
  save(name, j, prompt);
}
if (argv.includes("--serial")) {               // the deployment 429s on >4 concurrent edits; fill gaps one at a time
  for (const s of only) for (const v of views) {
    const name = `${s}-${v}`;
    if (fs.existsSync(path.join(OUT, `${name}.png`)) && !argv.includes("--force")) continue;
    try {
      if (v === "front") await gen(name, `${STYLES[s]} Subject: ${IDENT}. ${COMMON} ${VIEWS.front.pose}`);
      else await edit(name, `The same character as in the input image: same identity, face, hair, bindi, earrings, clothes, art style, rendering, palette and background. ${STYLES[s]} ${COMMON} ${VIEWS[v].pose}`, path.join(OUT, `${s}-front.png`));
    } catch (e) { console.log(`[concept] FAIL ${name}: ${e.message}`); }
  }
  process.exit(0);
}
await Promise.all(only.map(async (s) => {
  try {
    if (views.includes("front")) await gen(`${s}-front`, `${STYLES[s]} Subject: ${IDENT}. ${COMMON} ${VIEWS.front.pose}`);
    await Promise.all(views.filter((v) => v !== "front").map((v) => edit(`${s}-${v}`,
      `The same character as in the input image: same identity, face, hair, bindi, earrings, clothes, art style, rendering, palette and background. ${STYLES[s]} ${COMMON} ${VIEWS[v].pose}`,
      path.join(OUT, `${s}-front.png`)).catch((e) => console.log(`[concept] FAIL ${s}-${v}: ${e.message}`))));
  } catch (e) { console.log(`[concept] FAIL ${s}: ${e.message}`); }
}));
