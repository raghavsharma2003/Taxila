// Writes tests/fixtures/studio-v2-text-metrics.json: per-character advance widths (at 100 px) of the three Studio v2 stage
// faces at the weights the engines draw with, measured in Chromium's canvas with the SHIPPED font files. The node layout
// check (tests/studio-v2-layout.test.mjs) measures canvas text with this table instead of a browser, so it runs in
// test:all. Re-run when a stage font file changes:   node src/studio-v2/tools/text-metrics.mjs
import fs from "node:fs";
import path from "node:path";
import { launch, repo } from "./pw.mjs";
import { FONT } from "../core/tokens.ts";

const b64 = (p) => fs.readFileSync(path.join(repo, p)).toString("base64");
const FACES = [
  { family: "Bricolage Grotesque", key: "display", src: "src/studio-v2/gallery/fonts/bricolage-latin.woff2", weight: "200 800" },
  { family: "Geist Mono", key: "mono", src: "src/studio-v2/gallery/fonts/geist-mono-latin.woff2", weight: "100 900" },
  { family: "Atkinson Hyperlegible Next", key: "ui", src: "public/fonts/atkinson-hyperlegible-next-latin.woff2", weight: "400 700",   // as src/styles/fonts.css declares it
    unicodeRange: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" },
];
// the Devanagari faces exactly as src/studio-v2/engines/ext/deva.css declares them under each stage family
const M6 = "src/studio-v2/engines/ext/fonts/mukta-600-devanagari.woff2", M7 = "src/studio-v2/engines/ext/fonts/mukta-700-devanagari.woff2";
const DEVA = { display: [{ src: M7, weight: "400 900" }], mono: [{ src: M6, weight: "400 900" }], ui: [{ src: M6, weight: "400 600" }, { src: M7, weight: "700 900" }] };
const WEIGHTS = [400, 500, 600, 700, 800];
const chars = [];
for (let c = 32; c < 127; c++) chars.push(String.fromCharCode(c));
for (const c of "°·×÷−–—…₹→←↑↓✓✔★√π½¼¾²³±≤≥≠≈•“”‘’…⁄∠△▲▼◀▶●○■□") chars.push(c);
for (let c = 0x900; c <= 0x97f; c++) chars.push(String.fromCharCode(c));

const browser = await launch();
const page = await browser.newPage();
await page.setContent("<!doctype html><body></body>");
const out = await page.evaluate(async ({ faces, deva, weights, chars }) => {
  const bin = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
  for (const f of faces) {
    const ff = new FontFace(f.family, bin(f.b64), f.unicodeRange ? { weight: f.weight, unicodeRange: f.unicodeRange } : { weight: f.weight }); await ff.load(); document.fonts.add(ff);
    for (const d of deva[f.key]) { const fd = new FontFace(f.family, bin(d.b64), { weight: d.weight, unicodeRange: "U+0900-097F" }); await fd.load(); document.fonts.add(fd); }
  }
  await document.fonts.ready;
  for (const f of faces) for (const w of weights) await document.fonts.load(`${w} 100px "${f.family}"`, "Aक");
  const c = document.createElement("canvas").getContext("2d");
  const res = {};
  for (const f of faces) for (const w of weights) {
    c.font = `${w} 100px ${f.stack}`;   // the stage's own stack (core/tokens.ts FONT), fallbacks included
    res[`${f.key}:${w}`] = Object.fromEntries(chars.map((ch) => [ch, Math.round(c.measureText(ch).width * 10) / 10]));
  }
  return res;
}, { faces: FACES.map((f) => ({ ...f, stack: FONT[f.key], b64: b64(f.src) })), deva: Object.fromEntries(Object.entries(DEVA).map(([k, l]) => [k, l.map((d) => ({ ...d, b64: b64(d.src) }))])), weights: WEIGHTS, chars });
await browser.close();
const file = path.join(repo, "tests/fixtures/studio-v2-text-metrics.json");
fs.writeFileSync(file, JSON.stringify({ note: "advance widths at 100px; written by src/studio-v2/tools/text-metrics.mjs", widths: out }) + "\n");
console.log("wrote", path.relative(repo, file), Object.keys(out).length, "faces ×", chars.length, "chars");
