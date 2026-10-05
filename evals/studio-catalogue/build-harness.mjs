// Builds the QA harness into docs/design/values/v3/gallery/ (multi-file, for the Playwright tools) and copies the
// catalogue specs next to it so `?topic=<id>&slot=game|explainer` can mount a real catalogue piece.
//   node evals/studio-catalogue/build-harness.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const root = path.join(here, "harness");
const outDir = path.join(repo, "docs/design/values/v3/gallery");
await build({
  configFile: false, root, base: "./", logLevel: "warn",
  server: { fs: { allow: [repo] } },
  build: { outDir, emptyOutDir: true, assetsInlineLimit: 4 * 1024 * 1024, modulePreload: false, target: "es2022", reportCompressedSize: false, chunkSizeWarningLimit: 8192 },
});
const cat = path.join(repo, "data/studio-catalogue/topics");
if (fs.existsSync(cat)) { fs.mkdirSync(path.join(outDir, "catalogue"), { recursive: true }); for (const f of fs.readdirSync(cat)) fs.copyFileSync(path.join(cat, f), path.join(outDir, "catalogue", f)); }
const fx = path.join(here, "fixtures");
if (fs.existsSync(fx)) { fs.mkdirSync(path.join(outDir, "fixtures"), { recursive: true }); for (const f of fs.readdirSync(fx)) fs.copyFileSync(path.join(fx, f), path.join(outDir, "fixtures", f)); }
console.log("harness built:", outDir);
