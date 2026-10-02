// codec.mjs — pure codec decode time (no gltf-transform graph overhead), single thread, median of 15.
// meshopt: MeshoptDecoder.decodeGltfBuffer over every EXT_meshopt_compression bufferView (what three's GLTFLoader calls).
// draco:   draco3d Decoder over every KHR_draco_mesh_compression bufferView (what DRACOLoader's worker does).
// Usage: node codec.mjs   (expects out/<name>.{meshopt,draco}.glb written by asset.mjs --write)
import { MeshoptDecoder } from "meshoptimizer"; import draco3d from "draco3dgltf"; import fs from "node:fs";
await MeshoptDecoder.ready; const D = await draco3d.createDecoderModule();
const med = (a) => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
function glb(buf) { const dv = new DataView(buf.buffer, buf.byteOffset); const jl = dv.getUint32(12, true);
  const json = JSON.parse(Buffer.from(buf.subarray(20, 20 + jl)).toString()); const bin = buf.subarray(20 + jl + 8); return { json, bin }; }
function meshoptMs(buf) { const { json, bin } = glb(buf); const views = json.bufferViews.filter((v) => v.extensions?.EXT_meshopt_compression);
  let outBytes = 0; const t = [];
  for (let r = 0; r < 15; r++) { const s = performance.now();
    for (const v of views) { const e = v.extensions.EXT_meshopt_compression; const src = bin.subarray(e.byteOffset ?? 0, (e.byteOffset ?? 0) + e.byteLength);
      const dst = new Uint8Array(e.count * e.byteStride); MeshoptDecoder.decodeGltfBuffer(dst, e.count, e.byteStride, src, e.mode, e.filter); if (!r) outBytes += dst.length; }
    t.push(performance.now() - s); }
  return { ms: med(t), views: views.length, outMB: +(outBytes / 1e6).toFixed(2) }; }
function dracoMs(buf) { const { json, bin } = glb(buf); const prims = json.meshes.flatMap((m) => m.primitives).filter((p) => p.extensions?.KHR_draco_mesh_compression);
  const t = []; let verts = 0;
  for (let r = 0; r < 15; r++) { const s = performance.now();
    for (const p of prims) { const bv = json.bufferViews[p.extensions.KHR_draco_mesh_compression.bufferView];
      const data = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
      const dec = new D.Decoder(); const mesh = new D.Mesh(); const st = dec.DecodeArrayToMesh(data, data.length, mesh); if (!st.ok()) throw new Error(st.error_msg());
      if (!r) verts += mesh.num_points();
      for (let a = 0; a < mesh.num_attributes(); a++) { const att = dec.GetAttribute(mesh, a); const n = mesh.num_points() * att.num_components();
        const ptr = D._malloc(n * 4); dec.GetAttributeDataArrayForAllPoints(mesh, att, D.DT_FLOAT32, n * 4, ptr); D._free(ptr); }
      const fi = mesh.num_faces() * 3; const ip = D._malloc(fi * 4); dec.GetTrianglesUInt32Array(mesh, fi * 4, ip); D._free(ip);
      D.destroy(mesh); D.destroy(dec); }
    t.push(performance.now() - s); }
  return { ms: med(t), prims: prims.length, verts }; }
for (const n of ["brunette", "avaturn", "vroid", "avatarsdk", "mpfb"]) {
  const mo = fs.readFileSync(`out/${n}.meshopt.glb`), dr = fs.readFileSync(`out/${n}.draco.glb`);
  console.log(JSON.stringify({ n, meshopt: meshoptMs(mo), draco: dracoMs(dr) })); }
