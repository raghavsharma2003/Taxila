// pipeline.mjs — the tiered character pipeline, measured end to end on one sample avatar.
// T3: 52 ARKit + 15 Oculus morphs (pos+normal), 1024² textures KTX2 (ETC1S colour, UASTC normal), meshopt.
// T2: 52 ARKit morphs, POSITION ONLY (no morph normals), 1024² ETC1S, normal map dropped, meshopt.
// T2-lite: 28 ARKit morphs, pos only, 512² ETC1S, meshopt.
// Usage: node pipeline.mjs <in.glb>
import { NodeIO } from "@gltf-transform/core"; import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, reorder, quantize, prune, textureCompress, dedup } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer"; import sharp from "sharp"; import { ktx2 } from "ktx2-encoder/gltf-transform";
import fs from "node:fs";
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const imageDecoder = async (b) => { const { data, info } = await sharp(Buffer.from(b)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { width: info.width, height: info.height, data: new Uint8Array(data) }; };
const LITE = ["jawOpen","mouthClose","mouthFunnel","mouthPucker","mouthStretchLeft","mouthStretchRight","mouthSmileLeft","mouthSmileRight","mouthFrownLeft","mouthFrownRight",
  "mouthRollLower","mouthRollUpper","mouthPressLeft","mouthPressRight","mouthUpperUpLeft","mouthUpperUpRight","mouthLowerDownLeft","mouthLowerDownRight",
  "browInnerUp","browDownLeft","browDownRight","browOuterUpLeft","browOuterUpRight","eyeBlinkLeft","eyeBlinkRight","eyeSquintLeft","eyeSquintRight","cheekSquintLeft"];
function keepTargets(doc, keep, dropNormals) {
  for (const mesh of doc.getRoot().listMeshes()) { const names = mesh.getExtras()?.targetNames; if (!names) continue;
    const idx = names.map((n, i) => (keep(n) ? i : -1)).filter((i) => i >= 0);
    for (const p of mesh.listPrimitives()) { const ts = p.listTargets();
      ts.forEach((t, i) => { if (!idx.includes(i)) p.removeTarget(t); else if (dropNormals) { const nrm = t.getAttribute("NORMAL"); if (nrm) t.setAttribute("NORMAL", null); } }); }
    mesh.setWeights(idx.map(() => 0)); mesh.setExtras({ ...mesh.getExtras(), targetNames: idx.map((i) => names[i]) }); } }
function gpuEstimate(doc) { let geo = 0, morph = 0, verts = 0, tris = 0, targetsMax = 0, prims = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { prims++; const n = p.getAttribute("POSITION").getCount(); verts += n; tris += (p.getIndices()?.getCount() ?? n) / 3;
    for (const a of p.listAttributes()) geo += a.getArray().byteLength; if (p.getIndices()) geo += p.getIndices().getArray().byteLength;
    const ts = p.listTargets(); if (ts.length) { targetsMax = Math.max(targetsMax, ts.length); const hasN = ts.some((t) => t.getAttribute("NORMAL")); morph += n * (hasN ? 2 : 1) * 16 * ts.length; } }
  return { prims, verts, tris: Math.round(tris), targetsMax, geoMB: +(geo / 1e6).toFixed(2), morphTexMB: +(morph / 1e6).toFixed(2) }; }
async function texGpu(buf) { // read back the KTX2 level sizes: ETC1S -> ETC1 RGB (0.5 B/px) or ETC2 RGBA (1 B/px) for alpha; UASTC -> ASTC 1 B/px
  const doc = await io.readBinary(buf); let mb = 0;
  for (const t of doc.getRoot().listTextures()) { const [w, h] = t.getSize() ?? [0, 0]; const uastc = false;
    mb += (w * h * (uastc ? 1 : 1) * 4 / 3) / 1e6; } // conservative: 1 B/px (ETC2 RGBA / ASTC 4x4), with mips
  return +mb.toFixed(2); }
const arms = {
  T3: { keep: () => true, dropN: false, size: 1024, dropNormalMap: false },
  T2: { keep: (n) => !n.startsWith("viseme_"), dropN: true, size: 1024, dropNormalMap: true },
  "T2-lite": { keep: (n) => LITE.includes(n), dropN: true, size: 512, dropNormalMap: true } };
const src = process.argv[2]; const out = [];
for (const [name, a] of Object.entries(arms)) {
  const doc = await io.read(src);
  keepTargets(doc, a.keep, a.dropN);
  if (a.dropNormalMap) for (const m of doc.getRoot().listMaterials()) { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); }
  await doc.transform(prune(), dedup(), textureCompress({ encoder: sharp, targetFormat: "png", resize: [a.size, a.size] }),
    ktx2({ isUASTC: false, qualityLevel: 128, generateMipmap: true, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, slots: /^(baseColor|emissive)/, imageDecoder }),
    ktx2({ isUASTC: true, needSupercompression: true, generateMipmap: true, isPerceptual: false, slots: /^(normal|metallicRoughness|occlusion)/, imageDecoder }),
    reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
  const buf = await io.writeBinary(doc); fs.writeFileSync(`out/pipeline-${name}.glb`, buf);
  const est = gpuEstimate(await io.readBinary(buf)); const tex = await texGpu(buf);
  const r = { arm: name, glbMB: +(buf.length / 1e6).toFixed(2), textures: doc.getRoot().listTextures().length, texGpuMB: tex, ...est,
    morphTexPlusJsCopyMB: +(est.morphTexMB * 2).toFixed(2), totalResidentMB: +(est.geoMB + est.morphTexMB * 2 + tex).toFixed(1) };
  out.push(r); console.log(JSON.stringify(r)); }
fs.writeFileSync("pipeline-result.json", JSON.stringify(out, null, 1));
