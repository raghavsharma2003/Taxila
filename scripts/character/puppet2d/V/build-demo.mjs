// Bundle the arm V demo (real behaviour.ts/compositor.ts/lip.ts + rig.js + script) into one classic IIFE so
// art/character/puppet2d/V/demo.html opens from file:// as well as over http. From the repo root:
//   node scripts/character/puppet2d/V/build-demo.mjs
import { build } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
await build({
  configFile: false, logLevel: "warn", root: HERE,
  build: {
    outDir: path.join(HERE, "dist"), emptyOutDir: false, minify: true, sourcemap: false,
    lib: { entry: path.join(HERE, "demo/entry.js"), formats: ["iife"], name: "PuppetVDemo", fileName: () => "demo.js" },
  },
});
console.log("built", path.join(HERE, "dist/demo.js"));
