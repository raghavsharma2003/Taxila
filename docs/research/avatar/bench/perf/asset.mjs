// asset.mjs — geometry codec bench: raw vs meshopt vs draco on the 5 TalkingHead sample avatars.
// Measures: wire bytes (raw and brotli), single-thread decode time (median of 7), and how much of each file is morph data.
// Usage: node asset.mjs <dir-with-optimised-glbs>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { draco, meshopt, reorder, quantize } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import draco3d from "draco3dgltf";
import fs from "node:fs"; import zlib from "node:zlib"; import path from "node:path";

await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const deps = { "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder,
  "draco3d.decoder": await draco3d.createDecoderModule(), "draco3d.encoder": await draco3d.createEncoderModule() };
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies(deps);
const br = (b) => zlib.brotliCompressSync(b, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const med = (a) => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
async function decodeMs(buf) { const t = []; for (let i = 0; i < 7; i++) { const s = performance.now(); await io.readBinary(buf); t.push(performance.now() - s); } return med(t); }
function stats(doc) { let morphBytes = 0, geomBytes = 0, texBytes = 0, morphPrims = 0, prims = 0;
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { prims++;
    for (const a of p.listAttributes()) geomBytes += a.getArray().byteLength; if (p.getIndices()) geomBytes += p.getIndices().getArray().byteLength;
    if (p.listTargets().length) morphPrims++;
    for (const t of p.listTargets()) for (const a of t.listAttributes()) morphBytes += a.getArray().byteLength; }
  for (const t of doc.getRoot().listTextures()) texBytes += t.getImage()?.byteLength ?? 0;
  return { prims, morphPrims, geomMB: +(geomBytes / 1e6).toFixed(2), morphMB: +(morphBytes / 1e6).toFixed(2), texMB: +(texBytes / 1e6).toFixed(2) }; }

const dir = process.argv[2]; const out = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".glb"))) {
  const src = await io.read(path.join(dir, f)); const s = stats(src);
  // raw: drop meshopt, keep the same textures
  const raw = await io.read(path.join(dir, f)); raw.getRoot().listExtensionsUsed().filter((e) => e.extensionName === "EXT_meshopt_compression").forEach((e) => e.dispose());
  const rawB = await io.writeBinary(raw);
  const mo = await io.read(path.join(dir, f)); mo.getRoot().listExtensionsUsed().filter((e) => e.extensionName === "EXT_meshopt_compression").forEach((e) => e.dispose());
  await mo.transform(reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: "high" }));
  const moB = await io.writeBinary(mo);
  const dr = await io.read(path.join(dir, f)); dr.getRoot().listExtensionsUsed().filter((e) => e.extensionName === "EXT_meshopt_compression").forEach((e) => e.dispose());
  let dracoNote = "";
  const warn = console.warn; console.warn = (...a) => { dracoNote += a.join(" ").slice(0, 120) + "; "; };
  await dr.transform(draco({ method: "edgebreaker" })); console.warn = warn;
  const drB = await io.writeBinary(dr);
  const nm=f.replace(".glb",""); fs.mkdirSync("out",{recursive:true}); fs.writeFileSync(`out/${nm}.meshopt.glb`, moB); fs.writeFileSync(`out/${nm}.draco.glb`, drB); fs.writeFileSync(`out/${nm}.raw.glb`, rawB);
  // how many primitives did draco actually compress?
  const drDoc = await io.readBinary(drB); const drJson = JSON.parse(Buffer.from(drB.subarray(20, 20 + new DataView(drB.buffer, drB.byteOffset).getUint32(12, true))).toString());
  const dracoPrims = drJson.meshes.flatMap((m) => m.primitives).filter((p) => p.extensions?.KHR_draco_mesh_compression).length;
  const row = { file: f, ...s,
    raw: { MB: +(rawB.length / 1e6).toFixed(2), brMB: +(br(rawB) / 1e6).toFixed(2), decodeMs: +(await decodeMs(rawB)).toFixed(1) },
    meshopt: { MB: +(moB.length / 1e6).toFixed(2), brMB: +(br(moB) / 1e6).toFixed(2), decodeMs: +(await decodeMs(moB)).toFixed(1) },
    draco: { MB: +(drB.length / 1e6).toFixed(2), brMB: +(br(drB) / 1e6).toFixed(2), decodeMs: +(await decodeMs(drB)).toFixed(1), primsCompressed: dracoPrims, warn: dracoNote.slice(0, 200) } };
  out.push(row); console.log(JSON.stringify(row));
}
fs.writeFileSync("asset-result.json", JSON.stringify(out, null, 1));
