// Bundle the V4 harness (the production src/face-puppet code + the judged runtime) into evals/face-puppet/out/harness/.
//   node evals/face-puppet/build-harness.mjs
import { build } from "vite";
import fs from "node:fs";
const OUT = "evals/face-puppet/out/harness";
fs.mkdirSync(OUT, { recursive: true });
fs.copyFileSync("evals/face-puppet/harness/index.html", `${OUT}/index.html`);
await build({
  configFile: false, logLevel: "warn", publicDir: false,
  define: { "import.meta.env.DEV": "false" },
  build: { outDir: OUT, emptyOutDir: false, minify: true, lib: { entry: "evals/face-puppet/harness/harness.ts", formats: ["es"], fileName: () => "harness.js" } },
});
console.log("built", OUT, fs.statSync(`${OUT}/harness.js`).size, "B");
