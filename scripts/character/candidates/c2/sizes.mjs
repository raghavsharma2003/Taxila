// byte breakdown of a shipped GLB: textures vs the rest. node sizes.mjs <glb>
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire("/tmp/claude-0/char/tools/package.json");
const { NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS } = req("@gltf-transform/extensions");
const { MeshoptDecoder } = req("meshoptimizer");
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
for (const f of process.argv.slice(2)) {
  const d = await io.read(f);
  let t = 0; const rows = [];
  for (const x of d.getRoot().listTextures()) { t += x.getImage().byteLength; rows.push(`${x.getName()} ${(x.getImage().byteLength / 1e6).toFixed(2)}`); }
  const total = fs.statSync(f).size;
  console.log(f, `total ${(total / 1e6).toFixed(2)} MB; textures ${(t / 1e6).toFixed(2)}; geometry+morphs ${((total - t) / 1e6).toFixed(2)}`, rows.join(" | "));
}
