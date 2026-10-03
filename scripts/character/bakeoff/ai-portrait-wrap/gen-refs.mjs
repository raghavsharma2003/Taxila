// ai-portrait-wrap step 1: a consistent reference set for one look from the Azure Foundry image deployment
// (taxila-image = gpt-image-2). Front neutral is generated from text; every other view is an EDIT of that front
// image ("the same woman"), which is what keeps the identity consistent across views.
//   NODE_USE_ENV_PROXY=1 node scripts/character/bakeoff/ai-portrait-wrap/gen-refs.mjs [--look teal] [--only front,...]
import fs from "node:fs";
import path from "node:path";
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const LOOK = opt("--look", "teal");
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const DEP = process.env.DEPLOY_IMAGE || "taxila-image";
const OUT = `art/character/bakeoff/ai-portrait-wrap/refs/${LOOK}`;
fs.mkdirSync(OUT, { recursive: true });

// shapes, not lines: the identity is described as attributes (TEACHER-VISUAL 4.3 row 1, owner target mid-30s, MST 6)
const IDENT = {
  teal: "a warm Indian woman schoolteacher in her mid-30s, Monk skin tone 6 (medium warm brown), oval face, soft cheekbones, "
    + "dark brown eyes, natural thick dark eyebrows, straight nose of medium width, full natural lips with no lipstick, "
    + "dark brown-black hair pulled back neatly into a low ponytail with a centre parting and a few loose strands, small gold stud earrings, "
    + "a teal cotton kurti with a thin orange piping at the neckline, light everyday makeup at most",
};
const STYLE = "Studio reference photograph for a 3D character artist: head and upper shoulders, perfectly even soft frontal studio light, "
  + "no hard shadows, no rim light, plain light warm-grey seamless background, sharp focus, natural skin texture with visible pores, "
  + "photoreal-leaning, neutral colour grading, 85mm lens, camera at eye level. A kind, approachable adult teacher; modest, professional, "
  + "not glamorous. No text, no watermark, no jewellery other than the studs, no hands in frame.";
const VIEWS = {
  front: { gen: true, pose: "Facing the camera straight on, head level, eyes looking into the lens, a relaxed neutral expression with closed lips." },
  front_smile: { pose: "Identical framing, pose and light; she now smiles warmly with a genuine (Duchenne) smile, upper teeth slightly visible, eyes crinkling." },
  q3_left: { pose: "Identical light and background; she has turned her head 35 degrees to her right (we see more of her left cheek), eyes following the head, neutral closed-lip expression." },
  q3_right: { pose: "Identical light and background; she has turned her head 35 degrees to her left (we see more of her right cheek), eyes following the head, neutral closed-lip expression." },
  profile_left: { pose: "Identical light and background; exact side profile, she faces 90 degrees to the right of the image, neutral closed-lip expression, the whole ear visible." },
  q3_left_smile: { pose: "Identical light and background; head turned 35 degrees to her right, a warm genuine smile, upper teeth slightly visible." },
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
async function gen(name, prompt) {
  const r = await fetch(`${E}/images/generations`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" },
    body: JSON.stringify({ model: DEP, prompt, n: 1, size: "1024x1536", quality: "high" }) });
  if (!r.ok) throw new Error(`${name} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  await save(name, await r.json(), prompt);
}
async function edit(name, prompt, src) {
  const fd = new FormData();
  fd.append("model", DEP); fd.append("prompt", prompt); fd.append("n", "1"); fd.append("size", "1024x1536"); fd.append("quality", "high");
  fd.append("input_fidelity", "high");
  fd.append("image[]", new Blob([fs.readFileSync(src)], { type: "image/png" }), "front.png");
  let r = await fetch(`${E}/images/edits`, { method: "POST", headers: { "api-key": K }, body: fd });
  if (!r.ok && r.status === 400) {           // retry without input_fidelity if the deployment rejects it
    const fd2 = new FormData(); for (const [k, v] of fd.entries()) if (k !== "input_fidelity") fd2.append(k, v);
    r = await fetch(`${E}/images/edits`, { method: "POST", headers: { "api-key": K }, body: fd2 });
  }
  if (!r.ok) throw new Error(`${name} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  await save(name, await r.json(), prompt);
}
const id = IDENT[LOOK];
if (only.includes("front")) await gen("front", `${STYLE} Subject: ${id}. ${VIEWS.front.pose}`);
const rest = only.filter((v) => v !== "front");
await Promise.all(rest.map((v) => edit(v, `The same woman as in the input photo, same identity, same face, hair, earrings and clothes. ${STYLE} ${VIEWS[v].pose}`, path.join(OUT, "front.png"))
  .catch((e) => console.log(`[refs] FAIL ${v}: ${e.message}`))));
