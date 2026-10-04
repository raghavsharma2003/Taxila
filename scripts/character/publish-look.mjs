// Publish one look to the versioned, immutable URL space the lesson runtime loads from (BUILD-PLAN W1-F item 3):
//
//   public/assets/teacher/<look>/<lookRev>/Bplus-<hash>.glb, Blite-<hash>.glb, plate-<hash>.webp, mouth-<hash>.webp,
//   blink-<hash>.webp, runtime-<hash>.json
//
// and record it in src/avatar/looks.gen.json (bundled: the plate paints at t = 0 with no lookup round trip).
// Every published file carries a content hash in its name, so server/serve.mjs's HASHED rule already serves it
// `max-age=31536000, immutable`; a new face is a new <lookRev> directory, never an overwrite.
//
//   node scripts/character/publish-look.mjs --src art/character/looks-out/teal [--look teal] [--rev N]
//        [--tiers Bplus,Blite] [--backdrop "#d9d2c7"] [--no-plate] [--prune]
//
// --src is any directory that follows the contract (runtime.json schema 1 + the tier GLBs + plate/): the pipeline's
// art/character/looks-out/<look>, a licensed candidate (public/assets/teacher-candidates/<id>), a bake-off row.
// H.glb is not published: tier H is not in the first ship (teacher-anim §5.3 step 4), so it stays out of the image.
// --prune removes older <rev> directories of this look from public/.
//
// The plate is REQUIRED (exit 1 before anything is written): tier D is rendered from the same rig, and the runtime
// (TutorFace.rigLookFor) refuses a look without one, so a plate-less publish would silently put a tutor back on the
// procedural head. --no-plate publishes anyway (a look under construction that no tutor points at yet).
// Backdrop, first hit wins: --backdrop, plate/plate.json "backdrop", runtime.json "backdrop", the pipeline default.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { validateRuntime } from "../../src/avatar/three/contract.ts";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const src = arg("src");
if (!src) { console.error("usage: publish-look.mjs --src <dir> [--look id] [--rev N] [--tiers Bplus,Blite]"); process.exit(2); }
const SRC = path.resolve(ROOT, src);
const rt = JSON.parse(fs.readFileSync(path.join(SRC, "runtime.json"), "utf8"));
const look = arg("look", rt.look);
if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(look)) throw new Error(`bad look id ${look}`);
const rev = Number(arg("rev", rt.lookRev ?? 1));
if (!Number.isInteger(rev) || rev < 1) throw new Error(`bad lookRev ${rev}`);
const tiers = arg("tiers", "Bplus,Blite").split(",");
const fail = (msg) => { console.error(`[publish] refused: ${msg}`); process.exit(1); };

const problems = validateRuntime(rt, { tiers });
if (problems.length) fail(`runtime.json does not follow the contract:\n  ${problems.join("\n  ")}`);
for (const t of tiers) if (!fs.existsSync(path.join(SRC, rt.tiers[t].file))) fail(`tier ${t} file ${rt.tiers[t].file} is missing in ${src}`);

// Plate: checked in full before the output directory is touched.
const pj = path.join(SRC, "plate", "plate.json");
const noPlate = process.argv.includes("--no-plate");
const PLATE_FILES = ["plate", "mouth", "blink"];
const plateMeta = fs.existsSync(pj) ? JSON.parse(fs.readFileSync(pj, "utf8")) : null;
const missingPlate = [...(plateMeta ? [] : ["plate/plate.json"]), ...PLATE_FILES.map((k) => `plate/${k}.webp`).filter((f) => !fs.existsSync(path.join(SRC, f)))];
if (missingPlate.length && !noPlate) fail(`${src} has no complete plate (missing ${missingPlate.join(", ")}); tier D must be rendered from this rig (scripts/character/render.mjs), or pass --no-plate for a look no tutor uses yet`);
if (missingPlate.length) console.warn(`[publish] WARNING --no-plate: ${look} has no plate; rigLookFor() will not use it on the lesson path`);

const DEFAULT_BACKDROP = "#d9d2c7"; // the plate renders' scene background (scripts/character/viewer/main.js)
const backdrop = arg("backdrop", plateMeta?.backdrop ?? rt.backdrop ?? DEFAULT_BACKDROP);
if (!/^#[0-9a-f]{6}$/i.test(backdrop)) fail(`bad backdrop ${backdrop} (expected #rrggbb)`);
if (!arg("backdrop") && !plateMeta?.backdrop && !rt.backdrop) console.warn(`[publish] no backdrop in the source metadata: using the pipeline default ${DEFAULT_BACKDROP}`);

const OUT = path.join(ROOT, "public/assets/teacher", look, String(rev));
const BASE = `/assets/teacher/${look}/${rev}/`;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const hash = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);
function put(file, stem) {
  const buf = fs.readFileSync(file);
  const name = `${stem}-${hash(buf)}${path.extname(file)}`;
  fs.writeFileSync(path.join(OUT, name), buf);
  return { name, bytes: buf.length };
}

const out = JSON.parse(JSON.stringify(rt));
out.look = look;
out.lookRev = rev;
const tierIndex = {};
for (const t of tiers) {
  const meta = rt.tiers[t];
  const f = put(path.join(SRC, meta.file), t);
  out.tiers[t] = { ...meta, file: f.name, bytes: f.bytes };
  tierIndex[t] = { file: f.name, bytes: f.bytes };
}
for (const t of Object.keys(out.tiers)) if (!tiers.includes(t)) delete out.tiers[t]; // unpublished tiers are not addressable

let plate = null;
if (!missingPlate.length) {
  const files = {};
  for (const k of PLATE_FILES) files[k] = put(path.join(SRC, "plate", `${k}.webp`), k).name;
  plate = { ...plateMeta, files };
  out.plates = plate;
}
const rtBuf = Buffer.from(JSON.stringify(out));
const runtimeName = `runtime-${hash(rtBuf)}.json`;
fs.writeFileSync(path.join(OUT, runtimeName), rtBuf);

const INDEX = path.join(ROOT, "src/avatar/looks.gen.json");
const index = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, "utf8")) : { note: "", looks: {} };
index.note = "GENERATED by scripts/character/publish-look.mjs: do not edit. One entry per published look; the runtime loads only looks listed here.";
index.looks[look] = { rev, base: BASE, runtime: runtimeName, backdrop, tiers: tierIndex, plate, iris: rt.iris ?? null, jawCeiling: rt.jawCeiling ?? null };
index.looks = Object.fromEntries(Object.entries(index.looks).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(INDEX, JSON.stringify(index, null, 1) + "\n");

if (process.argv.includes("--prune")) {
  for (const d of fs.readdirSync(path.dirname(OUT))) if (d !== String(rev)) fs.rmSync(path.join(path.dirname(OUT), d), { recursive: true, force: true });
}
const total = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`[publish] ${look} r${rev} -> ${BASE} (${(total / 1e6).toFixed(2)} MB: ${fs.readdirSync(OUT).join(", ")})`);
