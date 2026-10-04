// Multi-view reference sheet for the owner-chosen style C teacher (docs/design/teacher/stylised/build/TECH-PLAN.md §2).
// Every image is an EDIT of concepts/c-front.webp on the Foundry image deployment (taxila-image = gpt-image-2), so the
// identity is carried by the pixels, not by the text. Prompts describe shapes and views, never lines she could say.
//   NODE_USE_ENV_PROXY=1 node scripts/character/stylised/gen-refs.mjs [--only neutral,q3-left] [--force] [--fidelity high|low]
// Output: docs/design/teacher/stylised/build/refs/<name>.webp + refs.json (prompt, date, usage per image). Cap: 30 images.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const E = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
const DEP = process.env.DEPLOY_IMAGE || "taxila-image";
const OUT = "docs/design/teacher/stylised/build/refs";
const SRC_WEBP = "docs/design/teacher/stylised/concepts/c-front.webp";
fs.mkdirSync(OUT, { recursive: true });
const SRC = path.join(OUT, ".c-front.png");
if (!fs.existsSync(SRC)) execFileSync("python3", ["-c", `from PIL import Image; Image.open("${SRC_WEBP}").convert("RGB").save("${SRC}")`]);

const SAME = "The same character as in the input image, rendered by the same 3D emoji-avatar renderer: identical identity, "
  + "face proportions, oversized rounded head, eye shape and size, thick soft brows, small rounded nose, soft mouth, "
  + "warm medium-brown matte skin, small dark bindi, small gold stud earrings, dark sculpted solid hair (smooth broad "
  + "masses with a few soft grooves, centre parting, swept back into a low bun at the nape behind her left ear, two thin "
  + "soft loose locks in front of the ears), teal kurta with thin orange piping on the neckline and placket. Identical "
  + "materials, palette and soft even studio lighting, plain warm-cream background. No text, no letters, no labels, "
  + "no watermark, no frame, no hands.";
const NEUTRAL_FACE = "Neutral relaxed face: lips gently closed and together, no smile, eyes open and looking straight ahead, brows relaxed.";
const MOUTH = (shape) => `Front view, head and shoulders, facing the viewer exactly as in the input image, eyes open and relaxed on the viewer, brows neutral. `
  + `Her mouth holds one sustained speech shape: ${shape} Only the mouth, jaw and cheeks change; everything else stays as in the input image.`;
const VIEWS = {
  neutral: `Front view, head and shoulders, same framing as the input image. ${NEUTRAL_FACE}`,
  "front-ortho": `Orthographic front elevation for a 3D modeller: perfectly frontal, symmetric, camera at eye height, no perspective, the whole head, hair and bun outline and shoulders fully in frame with margin. ${NEUTRAL_FACE}`,
  "q3-left": `Three-quarter view: her head and shoulders turned about 45 degrees so that she faces toward the left edge of the image, camera at eye height. ${NEUTRAL_FACE}`,
  "q3-right": `Three-quarter view: her head and shoulders turned about 45 degrees so that she faces toward the right edge of the image, camera at eye height. ${NEUTRAL_FACE}`,
  "profile-left": `Exact side profile, orthographic: she faces the left edge of the image, 90 degrees from the viewer; one eye visible in profile, the nose, lips and chin silhouette clear, the ear, hairline and the back of the sculpted hair visible. ${NEUTRAL_FACE}`,
  "profile-right": `Exact side profile, orthographic: she faces the right edge of the image, 90 degrees from the viewer; the low bun at the nape is clearly visible behind the ear, nose, lips and chin silhouette clear. ${NEUTRAL_FACE}`,
  back: "Seen from directly behind at eye height: the back of her head, the sculpted solid hair masses flowing from the crown down to the low bun at the nape (offset to her left), the back of the neck and the back of the teal kurta. Her face is not visible.",
  top: "Seen from above, camera high and looking steeply down onto the top of her head at about 70 degrees: the centre parting, how the solid hair masses sweep back from the parting to the low bun, the top of the forehead and nose tip just visible below.",
  "eye-closeup": "Extreme close-up of her eyes and brows only, frontal, filling the frame: the glossy cornea with a crisp white specular highlight, the very large warm-brown iris with a soft darker rim, a big dark pupil, the white sclera, the upper eyelid wrapping the eyeball with a thick dark lash line and a small outer flick, a soft lower lid, and the thick soft sculpted brows. Same matte-soft skin, no pores.",
  "hair-closeup": "Close-up of her hair from a three-quarter back angle: the smooth solid sculpted hair masses with a few broad soft grooves, the centre parting, the thin soft loose lock in front of the ear, the low rounded bun, matte-soft shading with a gentle broad sheen, no individual strands.",
  turnaround: `Character turnaround model sheet for a 3D modeller: four full head-and-shoulders views of her side by side in one row at the same scale and height, evenly spaced, orthographic, all with a neutral relaxed closed-mouth face: front, three-quarter, side profile, back.`,
  "mouth-A": MOUTH("the open 'aa' vowel, jaw dropped about a third, lips relaxed and open in a rounded rectangle, a little of the upper teeth and the tongue resting low visible, soft dark mouth interior."),
  "mouth-O": MOUTH("the rounded 'o' vowel, lips pushed forward and rounded into a small open oval, jaw slightly dropped."),
  "mouth-E": MOUTH("the 'ee' vowel, lips spread wide sideways and slightly open, upper and lower teeth visible close together, jaw almost closed, cheeks slightly raised."),
  "mouth-MBP": MOUTH("the 'm/b/p' closure, lips pressed firmly together and slightly rolled in, jaw closed, no smile."),
  "mouth-FV": MOUTH("the 'f/v' shape, the lower lip tucked up under the upper front teeth, upper teeth visible resting on the lower lip, jaw nearly closed."),
  "mouth-U": MOUTH("the 'oo' vowel, lips strongly puckered forward into a small round opening, jaw nearly closed."),
  "mouth-SS": MOUTH("the 's' shape, teeth together and visible, lips parted and slightly spread, jaw closed."),
  "mouth-TH": MOUTH("the 'l/t' tongue shape, mouth slightly open, the tongue tip raised and touching just behind the upper front teeth, visible."),
};
const only = opt("--only", Object.keys(VIEWS).join(",")).split(",");
if (only.length > 30) throw new Error("cap is 30 images");
const fidelity = opt("--fidelity", "high");
const metaF = path.join(OUT, "refs.json");
const meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF)) : { model: DEP, source: SRC_WEBP, images: {} };
function save(name, j, prompt) {
  const png = path.join(OUT, `.${name}.png`), webp = path.join(OUT, `${name}.webp`);
  fs.writeFileSync(png, Buffer.from(j.data[0].b64_json, "base64"));
  execFileSync("python3", ["-c", `from PIL import Image; Image.open("${png}").save("${webp}", quality=92, method=6)`]);
  fs.unlinkSync(png);
  meta.images[name] = { prompt, fidelity, date: new Date().toISOString(), usage: j.usage ?? null };
  fs.writeFileSync(metaF, JSON.stringify(meta, null, 1));
  console.log(`[refs] ${name}`);
}
async function edit(name, prompt) {
  for (let i = 0; i < 4; i++) {
    const fd = new FormData();
    fd.append("model", DEP); fd.append("prompt", prompt); fd.append("n", "1"); fd.append("size", "1024x1024");
    fd.append("quality", "high"); fd.append("input_fidelity", fidelity);
    fd.append("image[]", new Blob([fs.readFileSync(SRC)], { type: "image/png" }), "c-front.png");
    const r = await fetch(`${E}/images/edits`, { method: "POST", headers: { "api-key": K }, body: fd });
    if (r.ok) return save(name, await r.json(), prompt);
    const t = (await r.text()).slice(0, 300);
    if (r.status !== 429 && r.status < 500) throw new Error(`${name} HTTP ${r.status}: ${t}`);
    console.log(`[refs] retry ${name} ${r.status}`); await new Promise((s) => setTimeout(s, 20000 * (i + 1)));
  }
  throw new Error(`${name}: retries exhausted`);
}
const queue = only.filter((n) => argv.includes("--force") || !fs.existsSync(path.join(OUT, `${n}.webp`)));
const worker = async () => { while (queue.length) { const n = queue.shift(); try { await edit(n, `${SAME} ${VIEWS[n]}`); } catch (e) { console.log(`[refs] FAIL ${n}: ${e.message}`); } } };
await Promise.all([worker(), worker(), worker()]);   // the deployment 429s above ~4 concurrent edits
