// Copy a JUDGED polish round's puppet runtime and asset pack into the production paths, unchanged in behaviour:
//   node evals/face-puppet/sync-runtime.mjs r8
// - scripts/character/puppet2d/polish-<rev>/runtime/{rig,gl,lips,life,expr}.js → src/face-puppet/runtime/ (demo.js is not
//   copied: src/face-puppet/driver.ts replaces it). Each file gets a provenance header; the code is byte-identical below it,
//   so the in-app face is the face the judges scored. The only transform is the safety one in src/face-puppet/safety.ts,
//   applied at runtime, never by editing judged code.
// - art/character/puppet2d/polish-<rev>/pack/*.webp + geom.json → public/face-puppet/<rev>/ (the turn plates plateL/R are
//   left out: the product turn is the shared field, plates are the opt-in evaluation path).
// Re-run with a newer rev once that round is judged >= the shipped one; then bump PUPPET_REV in src/face-puppet/assets.ts.
import fs from "node:fs";
import crypto from "node:crypto";

const rev = process.argv[2] || "r8";
const SRC = `scripts/character/puppet2d/polish-${rev}/runtime/`;
const PACK = `art/character/puppet2d/polish-${rev}/pack/`;
const DST = "src/face-puppet/runtime/";
const PUB = `public/face-puppet/${rev}/`;
fs.mkdirSync(DST, { recursive: true });
fs.mkdirSync(PUB, { recursive: true });
const manifest = { rev, date: new Date().toISOString().slice(0, 10), runtime: {}, pack: {} };
for (const f of ["rig.js", "gl.js", "lips.js", "life.js", "expr.js"]) {
  const body = fs.readFileSync(SRC + f, "utf8");
  const sha = crypto.createHash("sha256").update(body).digest("hex").slice(0, 16);
  manifest.runtime[f] = sha;
  fs.writeFileSync(DST + f, `// SYNCED from ${SRC}${f} (puppet polish ${rev}, judged) by evals/face-puppet/sync-runtime.mjs; sha256 ${sha}.\n// Do not edit here: change the polish round, re-judge, re-sync.\n${body}`);
}
let bytes = 0;
for (const f of fs.readdirSync(PACK)) {
  if (!/\.(webp|json)$/.test(f) || /^plate[LR]\./.test(f) || f === "pack-report.json") continue;
  fs.copyFileSync(PACK + f, PUB + f);
  const n = fs.statSync(PUB + f).size;
  bytes += n;
  manifest.pack[f] = n;
}
manifest.packBytes = bytes;
fs.writeFileSync(PUB + "manifest.json", JSON.stringify(manifest, null, 1));
console.log(`synced ${rev}: runtime ${Object.keys(manifest.runtime).length} files, pack ${Object.keys(manifest.pack).length} files, ${bytes} B`);
