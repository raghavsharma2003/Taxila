#!/usr/bin/env node
// gen-assets: the image pack's build step (PRODUCT-DESIGN-V2 §12, "after the owner's Codex run").
//
//   node scripts/gen-assets.mjs            convert what has landed, report the rest (exit 1 only on a hard error)
//   node scripts/gen-assets.mjs --strict   the B2-A2 acceptance run: every shipped id present, 0 pending, every
//                                          budget and lint met, a provenance row per file, OCR run (exit 1 otherwise)
//   node scripts/gen-assets.mjs --ocr      also run the no-text presence check (Azure AI Vision Read; needs
//                                          AZURE_VISION_ENDPOINT + AZURE_VISION_KEY in the environment or .env.local)
//   node scripts/gen-assets.mjs --json     print the report as JSON
//
// What it does, per docs/design/assets/MANIFEST.json (the one source; never hand-edit it):
//  1. Masters (PNG with alpha, or WebP for opaque scenes) under public/assets/gen/** are converted to SHIPPED WebP at
//     1x and 2x under public/assets/art/** (lossy q 80 for backgrounds, alpha-preserving lossy for sprites), plus the
//     360-dp phone crops for the wide scenes that have no painted phone version. File names carry a content hash,
//     so the server's immutable /assets/* caching is correct.
//  2. Byte budgets (§12, [I]): backgrounds <= 120 KB at 1x (phone crop <= 60 KB); spots, states and tiles <= 40 KB;
//     avatars and pictograms <= 16 KB. Quality steps down until the file fits; an image that cannot fit at the floor
//     quality is NOT shipped (its flat fallback renders) and is reported.
//  3. OCR no-text presence check (only with --ocr): any detected glyph fails the image (`generated-media-carries-facts`:
//     OCR is valid only as a presence check, never as a spelling gate).
//  4. Lamp-hue pixel lint: > 1.5 % of opaque pixels with HSL S >= 35 %, L 20-85 % and hue within 12 deg of 39.5 deg
//     fails the image; items whose manifest lint is "skin-review" are reported, not failed.
//  5. Provenance: public/assets/gen/<category>/provenance.json must have a row per master; INDEX.json pending items
//     are listed (a failure under --strict).
//  6. Writes public/assets/gen/manifest.json, which the client reads (src/ui/Art.tsx, src/child/art.tsx): per id the
//     1x/2x URLs, CSS-pixel size, bytes, a tiny LQIP for backgrounds, the lint share and the OCR result.
//
// Masters never ship: vite.config.ts (taxila:art-masters) deletes dist/assets/gen/** after the build, keeping only
// manifest.json. Encoder: `sharp` when it is installed, else ImageMagick 7 (`magick`) or 6 (`convert`) with libwebp.
import { execFile as execFileCb } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCb);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PATHS = {
  manifest: "docs/design/assets/MANIFEST.json",
  index: "public/assets/gen/INDEX.json",
  out: "public/assets/art",
  clientManifest: "public/assets/gen/manifest.json",
};

// ───────────────────────────── pure policy (unit-tested: tests/ui-v2-b2-assets.test.mjs) ─────────────────────────────

const KB = 1024;
/** §12 budgets at 1x, in bytes. The 2x budget is provisional [I]: 3x the 1x budget (2x has 4x the pixels). */
export const BUDGETS = { bg: 120 * KB, bgPhone: 60 * KB, spot: 40 * KB, small: 16 * KB };
export const TWO_X_FACTOR = 3;
/** The §12 step-4 lint. */
export const LAMP = { hue: 39.5, window: 12, sMin: 0.35, lMin: 0.2, lMax: 0.85, maxShare: 0.015 };

/** Categories that are copied as-is (store/launcher icons, splashes, the OG card): not client art, not budgeted. */
const PASSTHROUGH = new Set(["brand"]);
const PASSTHROUGH_IDS = new Set(["landing/og-share"]);

/** 1x CSS width per category (the largest size a screen draws it at, §6 / §12.2). */
const SPOT_WIDTH = {
  avatars: 112, picto: 64, interests: 128, home: 96, subjects: 120, topics: 112, promises: 120, onboarding: 144,
  states: 240, protege: 152, sky: 160, landing: 800,
};
const GARDEN_WIDTH = { "garden/sunbird": 64, "garden/chapter-seal": 160, "garden/watering-can": 96 };
/** 1x CSS width for the backgrounds that are not a plain phone (1440x2560) or wide (2560x1440) painting. */
const BG_WIDTH = {
  "bg/stage-young": 480, "bg/stage-older": 480, "bg/garden-panorama": 1200, "bg/sky-panel": 800,
  "bg/onboarding-edge": 400, "bg/landing-hero": 1200, "bg/parent-header": 1200,
};
/** Wide scenes with no painted phone version get a 360-dp crop (centre, cover). */
const PHONE_CROPS = { "bg/sky-panel": [360, 640], "bg/landing-hero": [360, 280] };

/**
 * What to ship for one manifest entry: null = not client art (reference-only, passthrough), else the budget class,
 * the 1x CSS width and an optional phone crop.
 */
export function shipPlan(a) {
  if (!a.ships) return null;
  if (PASSTHROUGH.has(a.category) || PASSTHROUGH_IDS.has(a.id)) return { kind: "passthrough" };
  if (a.category === "bg") {
    const phone = /-phone$/.test(a.id);
    const w = BG_WIDTH[a.id] ?? (phone ? 360 : a.width >= a.height ? 1280 : 360);
    const crop = PHONE_CROPS[a.id];
    return { kind: "image", budget: phone ? "bgPhone" : "bg", width: w, crop: crop ? { width: crop[0], height: crop[1], budget: "bgPhone" } : null, lossy: "bg" };
  }
  if (a.category === "landing") return { kind: "image", budget: "bg", width: SPOT_WIDTH.landing, crop: null, lossy: a.alpha ? "sprite" : "bg" };
  if (a.category === "teacher") return { kind: "image", budget: "spot", width: a.width > 1000 ? 360 : 200, crop: null, lossy: "sprite" };
  if (a.category === "garden") return { kind: "image", budget: "spot", width: GARDEN_WIDTH[a.id] ?? 112, crop: null, lossy: "sprite" };
  const small = a.category === "avatars" || a.category === "picto";
  return { kind: "image", budget: small ? "small" : "spot", width: SPOT_WIDTH[a.category] ?? 160, crop: null, lossy: a.alpha ? "sprite" : "bg" };
}

/** Quality ladder: start at the §12 q 80 and step down; below the floor the image does not ship. */
export const QUALITIES = { bg: [80, 75, 70, 65, 60, 55, 50], sprite: [80, 74, 68, 62, 56, 50, 45] };

/** Height of a resize to `w` keeping the master's aspect ratio. */
export const heightFor = (a, w) => Math.round((a.height * w) / a.width);

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

/** Share of opaque pixels that read as the lamp (§12 step 4). `rgba` is 8-bit RGBA, any size. */
export function lampHueShare(rgba) {
  let hit = 0, n = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    n++;
    const [h, s, l] = rgbToHsl(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (s < LAMP.sMin || l < LAMP.lMin || l > LAMP.lMax) continue;
    const dh = Math.abs(((h - LAMP.hue + 540) % 360) - 180);
    if (dh <= LAMP.window) hit++;
  }
  return n ? hit / n : 0;
}

/** The verdict for one image's lint share. */
export function lintVerdict(share, lintKind) {
  if (lintKind === "reference-only" || lintKind === "rig") return "skipped";
  if (share <= LAMP.maxShare) return "pass";
  return lintKind === "skin-review" ? "report" : "fail";
}

// ───────────────────────────── encoders ─────────────────────────────

async function makeEncoder() {
  try {
    const { default: sharp } = await import("sharp");
    return {
      name: "sharp",
      async webp(src, { width, height, crop, quality }) {
        let img = sharp(src);
        img = crop ? img.resize(width, height, { fit: "cover", position: "centre" }) : img.resize({ width, withoutEnlargement: false });
        return img.webp({ quality, alphaQuality: 100, effort: 6 }).toBuffer();
      },
      async rgba(src, size) {
        return sharp(src).resize(size, size, { fit: "fill" }).ensureAlpha().raw().toBuffer();
      },
    };
  } catch { /* not installed */ }
  for (const bin of ["magick", "convert"]) {
    try {
      const { stdout } = await execFile(bin, ["-version"]);
      if (!/ImageMagick/.test(stdout)) continue;
      const list = (await execFile(bin, ["-list", "format"], { maxBuffer: 8 << 20 })).stdout;
      if (!/^\s*WEBP\*?\s+WEBP\s+rw/m.test(list)) continue;
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-assets-"));
      let seq = 0;
      return {
        name: `imagemagick (${bin})`,
        async webp(src, { width, height, crop, quality }) {
          const out = path.join(tmp, `${seq++}.webp`);
          const geo = crop ? ["-resize", `${width}x${height}^`, "-gravity", "center", "-extent", `${width}x${height}`] : ["-resize", `${width}x`];
          await execFile(bin, [src, "-strip", "-filter", "Lanczos", ...geo, "-quality", String(quality), "-define", "webp:method=6",
            "-define", "webp:alpha-quality=100", "-define", "webp:exact=false", out]);
          const buf = fs.readFileSync(out);
          fs.rmSync(out, { force: true });
          return buf;
        },
        async rgba(src, size) {
          const { stdout } = await execFile(bin, [src, "-resize", `${size}x${size}!`, "-depth", "8", "rgba:-"], { encoding: "buffer", maxBuffer: 64 << 20 });
          return stdout;
        },
      };
    } catch { /* try the next */ }
  }
  return null;
}

// ───────────────────────────── OCR (presence only) ─────────────────────────────

function loadEnvLocal() {
  const f = path.join(ROOT, ".env.local");
  const env = {};
  try {
    for (const line of fs.readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* none */ }
  return env;
}

function ocrClient() {
  const env = { ...loadEnvLocal(), ...process.env };
  const endpoint = env.AZURE_VISION_ENDPOINT, key = env.AZURE_VISION_KEY;
  if (!endpoint || !key) return null;
  return async (buf) => {
    const url = `${endpoint.replace(/\/$/, "")}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=read`;
    const r = await fetch(url, { method: "POST", headers: { "Ocp-Apim-Subscription-Key": key, "content-type": "application/octet-stream" }, body: buf });
    if (!r.ok) throw new Error(`OCR HTTP ${r.status}`);
    const j = await r.json();
    const lines = (j.readResult?.blocks ?? []).flatMap((b) => b.lines ?? []);
    return lines.length ? "text" : "pass";
  };
}

// ───────────────────────────── main ─────────────────────────────

const sha = (buf, n = 64) => createHash("sha256").update(buf).digest("hex").slice(0, n);
const readJson = (p, d = null) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8")); } catch { return d; } };
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const urlOf = (p) => "/" + rel(p).replace(/^public\//, "");

async function fitBudget(enc, src, geo, ladder, budget) {
  let last = null;
  for (const q of ladder) {
    const buf = await enc.webp(src, { ...geo, quality: q });
    last = { buf, quality: q };
    if (buf.length <= budget) return { ...last, ok: true };
  }
  return { ...last, ok: false };
}

async function writeHashed(dir, stem, suffix, buf) {
  const file = path.join(dir, `${stem}.${sha(buf, 10)}${suffix}.webp`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
  return file;
}

export async function run({ strict = false, ocr = false, quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const manifest = readJson(PATHS.manifest);
  if (!manifest?.assets) throw new Error(`cannot read ${PATHS.manifest}`);
  const index = readJson(PATHS.index, { items: {} });
  const prev = readJson(PATHS.clientManifest, { assets: [] });
  const prevById = new Map((prev.assets ?? []).map((a) => [a.id, a]));
  const enc = await makeEncoder();
  if (!enc) throw new Error("no WebP encoder: install sharp (npm i -D sharp) or ImageMagick with libwebp");
  const ocrRun = ocr ? ocrClient() : null;
  if (ocr && !ocrRun) log("OCR: AZURE_VISION_ENDPOINT / AZURE_VISION_KEY not set; the no-text check is NOT run");
  const provenance = new Map();
  const provOf = (cat) => {
    if (!provenance.has(cat)) {
      const rows = readJson(`public/assets/gen/${cat}/provenance.json`, []);
      provenance.set(cat, new Set((Array.isArray(rows) ? rows : rows.items ?? []).map((r) => r.id)));
    }
    return provenance.get(cat);
  };

  const outDir = path.join(ROOT, PATHS.out);
  const report = { encoder: enc.name, shipped: [], passthrough: [], missing: [], pending: [], failed: [], lint: [], budget: [], provenance: [], ocr: [], errors: [] };
  const assets = [];
  const keep = new Set();

  for (const a of manifest.assets) {
    const plan = shipPlan(a);
    if (!plan) continue;
    const ix = index.items?.[a.id];
    const master = path.join(ROOT, a.path);
    const present = fs.existsSync(master);
    if (a.generator === "codex") {
      if (!ix || ix.status === "pending") report.pending.push(a.id);
      else if (ix.status === "failed" || ix.status === "skipped") report.failed.push(`${a.id} (${ix.status})`);
    }
    if (!present) {
      if (!(a.generator === "codex" && (!ix || ix.status !== "done"))) report.missing.push(a.id);
      continue;
    }
    const src = fs.readFileSync(master);
    const masterSha = sha(src);
    if (a.generator === "codex" && !provOf(a.category).has(a.id)) report.provenance.push(a.id);

    if (plan.kind === "passthrough") {
      const ext = path.extname(a.path);
      const file = path.join(outDir, `${a.id}.${masterSha.slice(0, 10)}${ext}`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (!fs.existsSync(file)) fs.writeFileSync(file, src);
      keep.add(file);
      assets.push({ id: a.id, url: urlOf(file), width: a.width, height: a.height, bytes: src.length, passthrough: true, masterSha256: masterSha });
      report.passthrough.push(a.id);
      continue;
    }

    try {
      // lint on the master's pixels (downsampled; the share is scale-invariant to within noise)
      const share = lampHueShare(await enc.rgba(master, 160));
      const verdict = lintVerdict(share, a.lint);
      if (verdict !== "pass" && verdict !== "skipped") report.lint.push(`${a.id}: ${(share * 100).toFixed(2)} % lamp-hue (${verdict})`);
      if (verdict === "fail") continue;

      const ladder = QUALITIES[plan.lossy];
      const b1 = BUDGETS[plan.budget];
      const w1 = plan.width, h1 = heightFor(a, w1);
      const one = await fitBudget(enc, master, { width: w1 }, ladder, b1);
      if (!one.ok) { report.budget.push(`${a.id}: 1x ${(one.buf.length / KB).toFixed(1)} KB > ${b1 / KB} KB at q ${one.quality}`); continue; }
      const w2 = Math.min(a.width, w1 * 2);
      const two = await fitBudget(enc, master, { width: w2 }, ladder.filter((q) => q <= one.quality + 6), b1 * TWO_X_FACTOR);
      if (!two.ok) report.budget.push(`${a.id}: 2x ${(two.buf.length / KB).toFixed(1)} KB > ${(b1 * TWO_X_FACTOR) / KB} KB (shipped 1x only)`);
      const stem = a.id;
      const f1 = await writeHashed(outDir, stem, "@1x", one.buf);
      keep.add(f1);
      const entry = {
        id: a.id, url: urlOf(f1), width: w1, height: h1, bytes: one.buf.length, quality: one.quality,
        alpha: !!a.alpha, lampHueShare: Number(share.toFixed(4)), lint: verdict, masterSha256: masterSha,
      };
      if (two.ok) { const f2 = await writeHashed(outDir, stem, "@2x", two.buf); keep.add(f2); entry.url2x = urlOf(f2); entry.bytes2x = two.buf.length; }
      if (plan.crop) {
        const c = plan.crop;
        const p1 = await fitBudget(enc, master, { width: c.width, height: c.height, crop: true }, ladder, BUDGETS[c.budget]);
        if (p1.ok) {
          const pf1 = await writeHashed(outDir, `${stem}-phone`, "@1x", p1.buf);
          keep.add(pf1);
          entry.phone = { url: urlOf(pf1), width: c.width, height: c.height, bytes: p1.buf.length };
          const p2 = await fitBudget(enc, master, { width: c.width * 2, height: c.height * 2, crop: true }, ladder, BUDGETS[c.budget] * TWO_X_FACTOR);
          if (p2.ok) { const pf2 = await writeHashed(outDir, `${stem}-phone`, "@2x", p2.buf); keep.add(pf2); entry.phone.url2x = urlOf(pf2); entry.phone.bytes2x = p2.buf.length; }
        } else report.budget.push(`${a.id}: phone crop ${(p1.buf.length / KB).toFixed(1)} KB > ${BUDGETS[c.budget] / KB} KB (no crop shipped)`);
      }
      if (a.category === "bg" || a.category === "landing") {
        const tiny = await enc.webp(master, { width: 24, quality: 40 });
        entry.lqip = `data:image/webp;base64,${tiny.toString("base64")}`;
      }
      // OCR: reuse the previous result for the same master bytes
      const before = prevById.get(a.id);
      entry.ocr = before?.masterSha256 === masterSha && before.ocr && before.ocr !== "not-run" ? before.ocr : "not-run";
      if (ocrRun && entry.ocr === "not-run") {
        try { entry.ocr = await ocrRun(two.ok ? two.buf : one.buf); } catch (e) { report.errors.push(`${a.id}: ${e.message}`); }
      }
      if (entry.ocr === "text") { report.ocr.push(a.id); continue; }
      assets.push(entry);
      report.shipped.push(a.id);
    } catch (e) {
      report.errors.push(`${a.id}: ${e.message}`);
    }
  }

  // drop files no entry points at any more (old hashes, failed items)
  if (fs.existsSync(outDir)) {
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    for (const f of walk(outDir)) if (!keep.has(f) && !f.endsWith(".gitkeep")) fs.rmSync(f);
  }

  const shippedCount = manifest.assets.filter((a) => shipPlan(a)?.kind === "image" && a.generator === "codex").length;
  const out = {
    version: 1,
    generatedBy: "scripts/gen-assets.mjs",
    source: PATHS.manifest,
    encoder: enc.name,
    budgets: { bgKB: BUDGETS.bg / KB, bgPhoneKB: BUDGETS.bgPhone / KB, spotKB: BUDGETS.spot / KB, smallKB: BUDGETS.small / KB, twoXFactor: TWO_X_FACTOR },
    summary: { shipped: report.shipped.length, of: shippedCount, pending: report.pending.length, failed: report.failed.length },
    // Young topic pictures by chapter id (MANIFEST.topicMap), so the client never downloads the 0.5 MB manifest.
    topicMap: { default: manifest.topicMap?.default ?? null, map: manifest.topicMap?.map ?? {} },
    assets: assets.sort((x, y) => x.id.localeCompare(y.id)),
  };
  fs.mkdirSync(path.dirname(path.join(ROOT, PATHS.clientManifest)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, PATHS.clientManifest), JSON.stringify(out, null, 1) + "\n");

  const hard = report.errors.length + report.ocr.length;
  const acceptance = report.pending.length + report.missing.length + report.lint.filter((l) => l.endsWith("(fail)")).length +
    report.budget.length + report.provenance.length + (ocr && ocrRun ? 0 : 1);
  report.ok = strict ? hard + acceptance === 0 : hard === 0;
  return report;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const flags = new Set(process.argv.slice(2));
  const strict = flags.has("--strict");
  const r = await run({ strict, ocr: flags.has("--ocr") || strict, quiet: flags.has("--json") }).catch((e) => {
    console.error(`gen-assets: ${e.message}`);
    process.exit(1);
  });
  if (flags.has("--json")) console.log(JSON.stringify(r, null, 1));
  else {
    const line = (label, xs, max = 12) => xs.length && console.log(`${label} (${xs.length}): ${xs.slice(0, max).join(", ")}${xs.length > max ? ", …" : ""}`);
    console.log(`gen-assets (${r.encoder}): shipped ${r.shipped.length} images, ${r.passthrough.length} passthrough → ${PATHS.out}, manifest ${PATHS.clientManifest}`);
    line("pending in INDEX.json", r.pending, 6);
    line("failed / skipped by the Codex run (flat fallback renders)", r.failed);
    line("missing master files", r.missing);
    line("lamp-hue lint", r.lint);
    line("budget", r.budget);
    line("no provenance row", r.provenance);
    line("OCR found text (not shipped)", r.ocr);
    line("errors", r.errors);
    console.log(r.ok ? (strict ? "PASS (strict)" : "ok") : strict ? "FAIL (strict acceptance B2-A2)" : "FAIL");
  }
  process.exit(r.ok ? 0 : 1);
}
