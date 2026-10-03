// Dump a raw (unquantized) tier GLB to <out>/index.json + <out>/*.f32|u16|u32 so the numpy stages can read it:
// every mesh's attributes, indices, morph-target POSITION deltas + names, the skin's joints and inverse binds, and
// the bone hierarchy (local TRS). Used to reuse procedural-v3's hair, brow/lash cards, kurti and bust skin (and its 82
// key shapes as the targets the GNM key solver fits) without re-running the MPFB build.
//   node dump_glb.mjs <in.raw.glb> <outDir>
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const TOOLS = process.env.CHAR_TOOLS || "/tmp/claude-0/char/tools";
const req = createRequire(path.join(TOOLS, "package.json"));
const { NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS } = req("@gltf-transform/extensions");
const { MeshoptDecoder } = req("meshoptimizer");
await MeshoptDecoder.ready;
const [inp, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(inp);
const root = doc.getRoot();
const index = { meshes: {}, bones: [] };
const save = (name, arr) => {
  const ext = arr instanceof Float32Array ? "f32" : arr instanceof Uint32Array ? "u32" : arr instanceof Uint16Array ? "u16" : arr instanceof Uint8Array ? "u8" : "f32";
  const a = ext === "f32" && !(arr instanceof Float32Array) ? Float32Array.from(arr) : arr;
  fs.writeFileSync(path.join(out, `${name}.${ext}`), Buffer.from(a.buffer, a.byteOffset, a.byteLength));
  return `${name}.${ext}`;
};
const nodes = root.listNodes();
for (const n of nodes) if (!n.getMesh()) {
  const parent = nodes.find((p) => p.listChildren().includes(n));
  index.bones.push({ name: n.getName(), parent: parent ? parent.getName() : null, t: n.getTranslation(), r: n.getRotation(), s: n.getScale() });
}
for (const n of nodes) {
  const m = n.getMesh();
  if (!m) continue;
  const prim = m.listPrimitives()[0];
  const rec = { node: n.getName(), mesh: m.getName(), material: prim.getMaterial()?.getName(), attrs: {}, targets: [], targetNames: m.getExtras().targetNames || [] };
  for (const sem of prim.listSemantics()) {
    const acc = prim.getAttribute(sem);
    rec.attrs[sem] = { file: save(`${n.getName()}_${sem}`, acc.getArray()), size: acc.getElementSize(), count: acc.getCount(), normalized: acc.getNormalized(), type: acc.getArray().constructor.name };
  }
  const idx = prim.getIndices();
  rec.indices = save(`${n.getName()}_idx`, Uint32Array.from(idx.getArray()));
  prim.listTargets().forEach((t, i) => { const p = t.getAttribute("POSITION"); rec.targets.push(save(`${n.getName()}_t${i}`, Float32Array.from(p.getArray()))); });
  const skin = n.getSkin();
  if (skin) {
    rec.joints = skin.listJoints().map((j) => j.getName());
    rec.ibm = save(`${n.getName()}_ibm`, Float32Array.from(skin.getInverseBindMatrices().getArray()));
  }
  index.meshes[n.getName()] = rec;
}
fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 1));
console.log(`[dump] ${inp} -> ${out}: ${Object.keys(index.meshes).join(", ")}; bones ${index.bones.map((b) => b.name).join(",")}`);
