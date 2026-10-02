// tex.mjs — texture path bench on the avatars' own 1024² base-colour textures.
// Arms: WebP (what the sibling's pipeline emits) vs KTX2 ETC1S vs KTX2 UASTC(+zstd).
// Measures: bytes, decode/transcode ms (single thread, median of 9), GPU bytes after upload.
import { NodeIO } from "@gltf-transform/core"; import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer"; import sharp from "sharp"; import { encodeToKTX2 } from "ktx2-encoder";
import fs from "node:fs"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const med = (a) => { a = [...a].sort((x, y) => x - y); return a[a.length >> 1]; };
// three's basis transcoder (same wasm KTX2Loader runs in its workers)
const BASIS = require("./basis.cjs");
const B = await BASIS({ wasmBinary: fs.readFileSync("./node_modules/three/examples/jsm/libs/basis/basis_transcoder.wasm") }); B.initializeBasis();
const TF = B.transcoder_texture_format; // enum
function transcode(buf, fmt) { const t = []; let bytes = 0;
  for (let r = 0; r < 9; r++) { const s = performance.now(); const k = new B.KTX2File(new Uint8Array(buf)); k.startTranscoding();
    bytes = 0; for (let l = 0; l < k.getLevels(); l++) { const sz = k.getImageTranscodedSizeInBytes(l, 0, 0, fmt); const dst = new Uint8Array(sz);
      if (!k.transcodeImage(dst, l, 0, 0, fmt, 0, -1, -1)) throw new Error("transcode failed"); bytes += sz; }
    k.close(); k.delete(); t.push(performance.now() - s); }
  return { ms: +med(t).toFixed(1), gpuMB: +(bytes / 1e6).toFixed(2) }; }
const decoder = async (b) => { const { data, info } = await sharp(Buffer.from(b)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { width: info.width, height: info.height, data: new Uint8Array(data) }; };
const rows = [];
for (const n of ["brunette", "avaturn", "avatarsdk", "mpfb"]) {
  const doc = await io.read(`../avlip/opt/${n}.glb`);
  const mat = doc.getRoot().listMaterials().map((m) => m.getBaseColorTexture()).filter(Boolean)
    .sort((a, b) => b.getSize()[0] * b.getSize()[1] - a.getSize()[0] * a.getSize()[1])[0];
  const webp = Buffer.from(mat.getImage()); const [w, h] = mat.getSize();
  const td = []; for (let r = 0; r < 9; r++) { const s = performance.now(); await sharp(webp).raw().toBuffer(); td.push(performance.now() - s); }
  const png = await sharp(webp).png().toBuffer();
  const e1 = await encodeToKTX2(new Uint8Array(png), { isUASTC: false, qualityLevel: 128, compressionLevel: 2, generateMipmap: true, isKTX2File: true, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, imageDecoder: decoder });
  const e2 = await encodeToKTX2(new Uint8Array(png), { isUASTC: true, needSupercompression: true, enableRDO: true, rdoQualityLevel: 1, generateMipmap: true, isKTX2File: true, isPerceptual: true, isSetKTX2SRGBTransferFunc: true, imageDecoder: decoder });
  fs.writeFileSync(`out/${n}.etc1s.ktx2`, e1); fs.writeFileSync(`out/${n}.uastc.ktx2`, e2);
  const rgbaMip = w * h * 4 * 4 / 3;
  const row = { n, size: `${w}x${h}`,
    webp: { KB: Math.round(webp.length / 1024), decodeMs: +med(td).toFixed(1), gpuMB_rgba8_mips: +(rgbaMip / 1e6).toFixed(2) },
    etc1s: { KB: Math.round(e1.length / 1024), toETC2_RGBA: transcode(e1, 1), toETC1_RGB: transcode(e1, 0), toASTC4x4: transcode(e1, 10) },
    uastc_zstd: { KB: Math.round(e2.length / 1024), toASTC4x4: transcode(e2, 10), toETC2_RGBA: transcode(e2, 1) } };
  rows.push(row); console.log(JSON.stringify(row)); }
fs.writeFileSync("tex-result.json", JSON.stringify(rows, null, 1));
