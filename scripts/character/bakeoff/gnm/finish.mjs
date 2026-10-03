// Stage 3 (node): raw tier GLB + PNG maps -> shipped GLB (KTX2 textures, meshopt geometry) + budget check.
//
//   node scripts/character/finish.mjs <buildDir> <look> <outDir>
//
// Texture slots. The runtime replaces every material with the Taxila shaders (CHARACTER-PIPELINE.md §runtime), but
// the maps travel in standard glTF slots so any glTF viewer shows a sane fallback and three's GLTFLoader decodes them
// all. Slots whose factor is 0 (emissive, clearcoat, sheen) carry data maps and change nothing in a generic viewer.
// The slot -> meaning table is written into each material's extras.taxila so the mapping is self-describing.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const TOOLS = process.env.CHAR_TOOLS || "/tmp/claude-0/char/tools";
const req = createRequire(path.join(TOOLS, "package.json"));
const { NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS, KHRTextureBasisu, EXTMeshoptCompression, KHRMeshQuantization,
  KHRMaterialsClearcoat, KHRMaterialsSheen, KHRMaterialsSpecular } = req("@gltf-transform/extensions");
const { meshopt, prune, dedup } = req("@gltf-transform/functions");
const { MeshoptEncoder, MeshoptDecoder } = req("meshoptimizer");
const KTX = fs.readdirSync(TOOLS).find((d) => d.startsWith("KTX-Software"));
const TOKTX = path.join(TOOLS, KTX, "bin", "toktx");
const KTXLIB = path.join(TOOLS, KTX, "lib");

const [buildDir, look, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const tex = (f) => path.join(buildDir, "tex", f);

// [file, slotOwner, slot, {H:[w,h,enc], Bplus:[...], Blite:[...]}, colour?]
// enc: "u" = UASTC (normals, alpha, hero colour), "e" = ETC1S (B+ colour), null = not shipped on that tier
const MAPS = [
  // H: albedo without the painted brows (the H brow cards carry them; painted + cards was a double brow). B+ face albedo
  // in UASTC: ETC1S left a yellow blotch on plum's forehead (review item 14); B-lite keeps ETC1S.
  ["skin_albedo_H.png", "TaxilaSkin", "baseColor", { H: [1536, 1536, "u"], Bplus: null, Blite: null }, true],
  ["skin_albedo.png", "TaxilaSkin", "baseColor", { H: null, Bplus: [1024, 1024, "u"], Blite: [1024, 1024, "e"] }, true],
  ["skin_normal.png", "TaxilaSkin", "normal", { H: [1536, 1536, "u"], Bplus: [1024, 1024, "u"], Blite: null }, false],
  ["skin_packed.png", "TaxilaSkin", "occlusion", { H: [1024, 1024, "u"], Bplus: [512, 512, "u"], Blite: [256, 256, "e"] }, false],
  ["skin_wrinkle.png", "TaxilaSkin", "emissive", { H: [1024, 1024, "u"], Bplus: [512, 512, "u"], Blite: null }, false],
  ["skin_maskA.png", "TaxilaSkin", "metallicRoughness", { H: [512, 512, "u"], Bplus: [256, 256, "u"], Blite: null }, false],
  ["skin_maskB.png", "TaxilaSkin", "sheenColor", { H: [512, 512, "u"], Bplus: [256, 256, "u"], Blite: null }, false],
  ["skin_wrinkle_stretch.png", "TaxilaSkin", "clearcoatNormal", { H: [1024, 1024, "u"], Bplus: null, Blite: null }, false],
  // procedural-v3: skin detail (R fuzz, G subsurface tint, B moisture, A micro strength) and the tiled micro tile
  ["skin_detail.png", "TaxilaSkin", "specular", { H: [1024, 1024, "u"], Bplus: [512, 512, "u"], Blite: null }, false],
  // merged: the micro tile is dropped on the projected face (VERDICT budgets row; stylised-premium did the same): H must
  // carry 1536 photo-derived face maps under 6 MB, and the projected high-pass normal already carries the pore detail
  // ["skin_micro.png", "TaxilaSkin", "clearcoatRoughness", { H: [512, 512, "u"], Bplus: null, Blite: null }, false],
  ["garment_albedo.png", "TaxilaCloth", "baseColor", { H: [1024, 1024, "u"], Bplus: [512, 512, "e"], Blite: [512, 512, "e"] }, true],
  ["hair_atlas.png", "TaxilaHair", "baseColor", { H: [2048, 1024, "u"], Bplus: [1024, 512, "u"], Blite: [1024, 512, "e"] }, true],
  ["cards_atlas.png", "TaxilaCards", "baseColor", { H: [2048, 1024, "u"], Bplus: [512, 256, "u"], Blite: [512, 256, "e"] }, true],
];
const MEANING = {
  baseColor: "albedo (sRGB; garment alpha = roughness)", normal: "tangent-space normal (base detail)",
  occlusion: "packed: R cavity, G roughness, B thickness, A ambient occlusion",
  emissive: "wrinkle normal, compress (blend by region masks)", metallicRoughness: "region mask A: forehead, glabella, crowL, crowR",
  sheenColor: "region mask B: nasoL, nasoR, chin, neck", clearcoatNormal: "wrinkle normal, stretch",
  specular: "procedural-v3 detail: R peach fuzz, G subsurface tint weight, B moisture, A micro-normal strength (KHR_materials_specular.specularTexture, factor 0)",
  clearcoatRoughness: "procedural-v3 micro tile (tiled x46 in uv): RG micro normal, B specular breakup, A micro cavity (KHR_materials_clearcoat.clearcoatRoughnessTexture)",
};

// card textures (hair, brows, lashes) take a stronger UASTC rate-distortion setting: their fine alpha survives it,
// and it pays for the 2x brow alpha resolution on H inside the 6 MB cap
// merged (from ai-portrait-wrap): photo-derived albedo and normal do not compress like procedural noise (H 7.43 MB at
// RDO 1.0, measured there); they take RDO 3, and on H the face albedo and normal are 1536 (still above the source)
const RDO = { "hair_atlas.png": "2.5", "cards_atlas.png": "2.5", "skin_albedo_H.png": "3", "skin_albedo.png": "3", "skin_normal.png": "3" };
function ktx2(src, w, h, enc, srgb) {
  const out = path.join(os.tmpdir(), `tx-${process.pid}-${path.basename(src, ".png")}-${w}-${enc}.ktx2`);
  const args = ["--t2", "--genmipmap", "--resize", `${w}x${h}`, "--assign_oetf", srgb ? "srgb" : "linear"];
  if (enc === "u") args.push("--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", RDO[path.basename(src)] || "1.0", "--zcmp", "19");
  else args.push("--encode", "etc1s", "--clevel", "2", "--qlevel", "160");
  execFileSync(TOKTX, [...args, out, src], { env: { ...process.env, LD_LIBRARY_PATH: KTXLIB } });
  const b = fs.readFileSync(out);
  fs.unlinkSync(out);
  return b;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
await MeshoptEncoder.ready;
const report = {};
for (const tier of ["H", "Bplus", "Blite"]) {
  const raw = path.join(buildDir, `${tier === "Blite" ? "Bplus" : tier}.raw.glb`);
  const doc = await io.read(raw);
  const root = doc.getRoot();
  doc.createExtension(KHRTextureBasisu).setRequired(true);
  const cc = doc.createExtension(KHRMaterialsClearcoat);
  const sh = doc.createExtension(KHRMaterialsSheen);
  const spx = doc.createExtension(KHRMaterialsSpecular);
  // names: meshes and nodes carry part names only (face, eyes, cards, hair, garment, lens) -- never a person's name
  for (const n of root.listNodes()) if (n.getMesh()) n.getMesh().setName(n.getName());
  const mats = Object.fromEntries(root.listMaterials().map((m) => [m.getName(), m]));
  for (const m of root.listMaterials()) {
    m.setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(0.6).setEmissiveFactor([0, 0, 0]);
  }
  const slotsUsed = {};
  for (const [file, owner, slot, sizes, srgb] of MAPS) {
    const sz = sizes[tier];
    const m = mats[owner];
    if (!sz || !m || !fs.existsSync(tex(file))) continue;
    const t = doc.createTexture(file.replace(".png", "")).setMimeType("image/ktx2").setImage(ktx2(tex(file), sz[0], sz[1], sz[2], srgb));
    if (slot === "baseColor") m.setBaseColorTexture(t);
    else if (slot === "normal") m.setNormalTexture(t);
    else if (slot === "occlusion") m.setOcclusionTexture(t);
    else if (slot === "emissive") m.setEmissiveTexture(t);
    else if (slot === "metallicRoughness") m.setMetallicRoughnessTexture(t);
    else if (slot === "sheenColor") {
      const s = m.getExtension("KHR_materials_sheen") || sh.createSheen();
      s.setSheenColorFactor([0, 0, 0]).setSheenColorTexture(t);
      m.setExtension("KHR_materials_sheen", s);
    } else if (slot === "specular") {
      const sp = m.getExtension("KHR_materials_specular") || spx.createSpecular();
      sp.setSpecularFactor(1).setSpecularTexture(t);
      m.setExtension("KHR_materials_specular", sp);
    } else if (slot === "clearcoatRoughness") {
      const c = m.getExtension("KHR_materials_clearcoat") || cc.createClearcoat();
      c.setClearcoatFactor(0).setClearcoatRoughnessTexture(t);
      m.setExtension("KHR_materials_clearcoat", c);
    } else if (slot === "clearcoatNormal") {
      const c = m.getExtension("KHR_materials_clearcoat") || cc.createClearcoat();
      c.setClearcoatFactor(0).setClearcoatNormalTexture(t);
      m.setExtension("KHR_materials_clearcoat", c);
    }
    (slotsUsed[owner] ||= {})[slot] = { map: file.replace(".png", ""), meaning: MEANING[slot], px: `${sz[0]}x${sz[1]}`, enc: sz[2] === "u" ? "UASTC" : "ETC1S" };
  }
  for (const m of root.listMaterials()) {
    const hair = ["TaxilaHair", "TaxilaCards"].includes(m.getName());
    if (hair) m.setAlphaMode("MASK").setAlphaCutoff(0.4).setDoubleSided(true);
    if (m.getName() === "TaxilaLens") m.setAlphaMode("BLEND").setBaseColorFactor([0.9, 0.95, 1, 0.08]);
    m.setExtras({ taxila: { shader: m.getName(), slots: slotsUsed[m.getName()] || {}, tier } });
  }
  doc.getRoot().setExtras({ taxila: { look, tier, generator: "scripts/character (in-house, CC0 inputs)" } });
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
  await doc.transform(dedup(), prune({ keepAttributes: true, keepLeaves: false }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const out = path.join(outDir, `${tier}.glb`);
  await io.write(out, doc);
  let tris = 0, draws = 0, morphVerts = 0, morphs = 0;
  for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) {
    draws++;
    tris += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute("POSITION").getCount()) / 3;
    if (p.listTargets().length) { morphVerts += p.getAttribute("POSITION").getCount() * p.listTargets().length; morphs = Math.max(morphs, p.listTargets().length); }
  }
  report[tier] = { bytes: fs.statSync(out).size, tris, draws, maxMorphTargets: morphs,
    morphTextureMB: +(morphVerts * 16 / 1e6).toFixed(2), slots: slotsUsed };
  console.log(`[finish:${look}] ${tier} ${(report[tier].bytes / 1e6).toFixed(2)} MB, ${tris} tris, ${draws} draws, morphTex ${report[tier].morphTextureMB} MB`);
}
fs.writeFileSync(path.join(buildDir, "finish.json"), JSON.stringify(report, null, 1));
