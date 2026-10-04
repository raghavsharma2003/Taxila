// Arm A finish: raw GLB -> meshopt + quantized GLB (the runtime's required extensions, CHARACTER-PIPELINE §4.1).
//   node finish.mjs <raw.glb> <out.glb>
// Tools live outside the repo in $CHAR_TOOLS (default /tmp/claude-0/char/tools, set up by scripts/character/build.mjs).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const TOOLS = process.env.CHAR_TOOLS || "/tmp/claude-0/char/tools";
const req = createRequire(path.join(TOOLS, "package.json"));
const { NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS } = req("@gltf-transform/extensions");
const { meshopt, prune, dedup, weld, quantize } = req("@gltf-transform/functions");
const { MeshoptEncoder, MeshoptDecoder } = req("meshoptimizer");

const [src, out] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(src);
await doc.transform(dedup(), prune({ keepAttributes: true, keepLeaves: false }), meshopt({ encoder: MeshoptEncoder, level: "high" }));
await io.write(out, doc);
const sz = fs.statSync(out).size;
let tris = 0, morphs = {};
for (const m of doc.getRoot().listMeshes()) {
  for (const p of m.listPrimitives()) {
    const idx = p.getIndices();
    tris += idx ? idx.getCount() / 3 : p.getAttribute("POSITION").getCount() / 3;
    morphs[m.getName()] = p.listTargets().length;
  }
}
console.log(JSON.stringify({ out, bytes: sz, MB: +(sz / 1048576).toFixed(3), tris, morphs }));
