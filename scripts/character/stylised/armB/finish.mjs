// Arm B finish: raw Blender GLB -> shipped GLB (KTX2 textures, meshopt geometry + quantization) + budget report.
//   node scripts/character/stylised/armB/finish.mjs <raw.glb> <out.glb> [--etc1s]
// Uses the pinned tools in $CHAR_TOOLS (default /tmp/claude-0/char/tools): @gltf-transform, meshoptimizer, KTX-Software.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const TOOLS = process.env.CHAR_TOOLS || "/tmp/claude-0/char/tools";
const req = createRequire(path.join(TOOLS, "package.json"));
const { NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS, KHRTextureBasisu, EXTMeshoptCompression } = req("@gltf-transform/extensions");
const { meshopt, prune, dedup } = req("@gltf-transform/functions");
const { MeshoptEncoder, MeshoptDecoder } = req("meshoptimizer");
const KTX = fs.readdirSync(TOOLS).find((d) => d.startsWith("KTX-Software"));
const TOKTX = path.join(TOOLS, KTX, "bin", "toktx");
const KTXLIB = path.join(TOOLS, KTX, "lib");

const [raw, out] = process.argv.slice(2);
const etc1s = process.argv.includes("--etc1s");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
await MeshoptEncoder.ready;
const doc = await io.read(raw);
const root = doc.getRoot();
let hasTex = false;
for (const t of root.listTextures()) {
  const img = t.getImage();
  if (!img) continue;
  hasTex = true;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ktx-"));
  const src = path.join(tmp, "in.png"), dst = path.join(tmp, "out.ktx2");
  fs.writeFileSync(src, Buffer.from(img));
  const args = ["--t2", "--genmipmap", "--assign_oetf", "srgb"];
  if (etc1s) args.push("--encode", "etc1s", "--clevel", "2", "--qlevel", "160");
  else args.push("--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "1.0", "--zcmp", "19");
  execFileSync(TOKTX, [...args, dst, src], { env: { ...process.env, LD_LIBRARY_PATH: KTXLIB } });
  t.setImage(fs.readFileSync(dst)).setMimeType("image/ktx2");
  fs.rmSync(tmp, { recursive: true });
}
if (hasTex) doc.createExtension(KHRTextureBasisu).setRequired(true);
for (const n of root.listNodes()) if (n.getMesh()) n.getMesh().setName(n.getName());
root.setExtras({ taxila: { look: "c", arm: "B", generator: "scripts/character/stylised/armB (in-house; AI sculpt used as a shape target only)" } });
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await doc.transform(dedup(), prune({ keepAttributes: true, keepLeaves: false }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
await io.write(out, doc);
let tris = 0, draws = 0, morphVerts = 0;
const meshes = {};
for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) {
  draws++;
  const t = (p.getIndices() ? p.getIndices().getCount() : p.getAttribute("POSITION").getCount()) / 3;
  tris += t;
  const nt = p.listTargets().length;
  morphVerts += p.getAttribute("POSITION").getCount() * nt;
  meshes[mesh.getName()] = { tris: (meshes[mesh.getName()]?.tris || 0) + t, verts: p.getAttribute("POSITION").getCount(), morphs: nt };
}
const rep = { bytes: fs.statSync(out).size, tris, draws, morphTextureMB: +(morphVerts * 16 / 1e6).toFixed(2), meshes };
console.log(JSON.stringify(rep));
