// Bundle cost of the puppet: production-mode Vite builds of the adapter entry (code-split: the stage + judged runtime are
// a lazy chunk), (a) with everything outside src/face-puppet external (= the bytes this stream adds), (b) self-contained
// lazy chunk incl. src/avatar lip/behaviour/compositor/tap/faceCues (which the 3D face path also uses). gzip -9 sizes.
//   node evals/face-puppet/bundle-size.mjs
import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
const res = { date: new Date().toISOString().slice(0, 10) };
for (const [k, ext] of [["own", (id) => !id.includes("src/face-puppet") && !id.startsWith(".") && !id.startsWith("/") ? true : /src\/(avatar|ui-v3|duplex)\//.test(id) || /^(react|react-dom)/.test(id)], ["withAvatar", (id) => /^(react|react-dom|react\/)/.test(id) || /src\/(ui-v3)\//.test(id) || /TutorFace|picker\/copy|shared\/tutors/.test(id)]]) {
  const out = `evals/face-puppet/out/bundle-${k}`;
  fs.rmSync(out, { recursive: true, force: true });
  await build({ configFile: false, logLevel: "silent", publicDir: false, define: { "import.meta.env.DEV": "false" },
    build: { outDir: out, minify: true, rollupOptions: { input: "src/face-puppet/adapter.tsx", external: ext, preserveEntrySignatures: "strict", output: { format: "es", entryFileNames: "entry.js", chunkFileNames: "[name].js" } } } });
  const files = fs.readdirSync(out, { recursive: true }).filter((f) => f.endsWith(".js"));
  res[k] = Object.fromEntries(files.map((f) => { const b = fs.readFileSync(path.join(out, f)); return [f, { raw: b.length, gz: zlib.gzipSync(b, { level: 9 }).length }]; }));
}
const pack = JSON.parse(fs.readFileSync("public/face-puppet/r8/manifest.json", "utf8"));
res.pack = { bytes: pack.packBytes, files: Object.keys(pack.pack).length, posters: ["medium", "close"].map((f) => fs.statSync(`public/face-puppet/r8/rest-${f}.webp`).size) };
fs.writeFileSync("evals/face-puppet/out/bundle-size.json", JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
