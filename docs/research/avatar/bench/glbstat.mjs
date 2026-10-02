import { NodeIO } from "@gltf-transform/core"; import { ALL_EXTENSIONS } from "@gltf-transform/extensions"; import fs from "node:fs";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
for (const f of process.argv.slice(2)) { const doc = await io.read(f); const root = doc.getRoot();
  let tris = 0, verts = 0, morphMeshes = 0, maxTargets = 0, prims = 0, names = new Set(), morphVerts = 0;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { prims++; const n = p.getAttribute("POSITION").getCount(); verts += n;
    tris += (p.getIndices()?.getCount() ?? n) / 3; const t = p.listTargets().length; if (t) { morphMeshes++; morphVerts += n * t; maxTargets = Math.max(maxTargets, t); }
    const tn = m.getExtras()?.targetNames; if (tn) tn.forEach(x => names.add(x)); }
  let texPx = 0; for (const t of root.listTextures()) { const s = t.getSize(); if (s) texPx += s[0] * s[1]; }
  const has = k => names.has(k) ? "y" : "n";
  console.log(JSON.stringify({ file: f.split("/").pop(), MB: +(fs.statSync(f).size / 1e6).toFixed(2), prims, tris: Math.round(tris), verts, morphMeshes, maxTargets, morphVertexTargets: morphVerts,
    textures: root.listTextures().length, texMpx: +(texPx / 1e6).toFixed(1), bones: root.listSkins().reduce((s, k) => Math.max(s, k.listJoints().length), 0),
    arkitJawOpen: has("jawOpen"), oculus_viseme_aa: has("viseme_aa"), nTargetNames: names.size })); }
