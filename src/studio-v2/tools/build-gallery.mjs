// Builds the Studio v2 gallery into docs/design/reset/prework/rs4/gallery/ (multi-file, for the Playwright tools) and
// a single self-contained docs/design/reset/prework/rs4/index.html (fonts, posters and the moon narration inlined) for
// publishing. Uses Vite's API with no config file, so the app's vite.config.ts and its plugins are untouched.
//   node src/studio-v2/tools/build-gallery.mjs [--measured] [--single]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const root = path.resolve(here, "../gallery");
const outDir = path.join(repo, "docs/design/reset/prework/rs4/gallery");
const docs = path.join(repo, "docs/design/reset/prework/rs4");
const args = process.argv.slice(2);

// posters (jpg written by record.mjs) → data URIs; measured numbers → measured.json
const posterDir = path.join(docs, "posters");
const posters = {};
if (fs.existsSync(posterDir)) for (const f of fs.readdirSync(posterDir)) if (f.endsWith(".jpg")) posters[decodeURIComponent(f.slice(0, -4))] = "data:image/jpeg;base64," + fs.readFileSync(path.join(posterDir, f)).toString("base64");
fs.writeFileSync(path.join(root, "posters.json"), JSON.stringify(posters));
const measuredFile = path.join(docs, "measured.json");
if (fs.existsSync(measuredFile)) {
  const m = JSON.parse(fs.readFileSync(measuredFile, "utf8"));
  const slim = {};
  for (const [k, v] of Object.entries(m.engines ?? {})) slim[k] = { fps: v.perf?.fps, p95: v.perf?.p95, bootMs: v.bootMs, fuzz: v.fuzz ? `${v.fuzz.visibleFailures}/${v.fuzz.n}` : undefined };
  fs.writeFileSync(path.join(root, "measured.json"), JSON.stringify(slim));
}

await build({
  configFile: false, root, base: "./", logLevel: "warn",
  server: { fs: { allow: [repo] } },
  build: { outDir, emptyOutDir: true, assetsInlineLimit: 4 * 1024 * 1024, modulePreload: false, target: "es2022", reportCompressedSize: false, chunkSizeWarningLimit: 4096 },
});
const html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
// single-file: inline the module script and stylesheet
let single = html;
for (const m of html.matchAll(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g)) {
  const js = fs.readFileSync(path.join(outDir, m[1]), "utf8").replace(/<\/script/gi, "<\\/script");
  single = single.replace(m[0], `<script type="module">${js}</script>`);
}
for (const m of html.matchAll(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g)) {
  const css = fs.readFileSync(path.join(outDir, m[1]), "utf8");
  single = single.replace(m[0], `<style>${css}</style>`);
}
fs.writeFileSync(path.join(docs, "index.html"), single);
const size = (p) => (fs.statSync(p).size / 1024).toFixed(0) + " KB";
console.log("gallery:", outDir, "| single file:", path.join(docs, "index.html"), size(path.join(docs, "index.html")), "| posters:", Object.keys(posters).length);
