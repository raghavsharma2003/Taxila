// c3 stage 3 (fork of c2/finish.mjs, itself a fork of scripts/character/finish.mjs): raw tier GLB + PNG maps -> shipped GLB (KTX2, meshopt) + budgets.
//
//   node scripts/character/candidates/c3/finish_c3.mjs <buildDir> c3 public/assets/teacher-candidates/c3
// Differences: c3 ships albedo only (VRoid's stylised source has painted shading, no normal / wrinkle / packed maps;
// the rig skips those paths), plus an eye atlas (iris + highlight) for the stylised eye path of the c3 rig fork.
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
  KHRMaterialsClearcoat, KHRMaterialsSheen } = req("@gltf-transform/extensions");
const { meshopt, prune, dedup } = req("@gltf-transform/functions");
const { MeshoptEncoder, MeshoptDecoder } = req("meshoptimizer");
const KTX = fs.readdirSync(TOOLS).find((d) => d.startsWith("KTX-Software"));
const TOKTX = path.join(TOOLS, KTX, "bin", "toktx");
const KTXLIB = path.join(TOOLS, KTX, "lib");

const [buildDir, look, outDir] = process.argv.slice(2);
// VRM PL 1.0 s3(b): an adapted work carries the licensor's licence settings; they travel in the GLB's root extras
const VRM_META = { licenseUrl: "https://vrm.dev/licenses/1.0/", copyrightInformation: "(c) 2022 pixiv Inc.", authors: ["pixiv Inc."],
  avatarPermission: "everyone", commercialUsage: "corporation", creditNotation: "unnecessary", allowRedistribution: true,
  modification: "allowModificationRedistribution", allowExcessivelyViolentUsage: true, allowExcessivelySexualUsage: true,
  allowPoliticalOrReligiousUsage: true, allowAntisocialOrHateUsage: false, adaptedBy: "Taxila (modified: recoloured, cut to a bust, re-rigged, keys synthesised)" };
fs.mkdirSync(outDir, { recursive: true });
const tex = (f) => path.join(buildDir, "tex", f);

// [file, slotOwner, slot, {H:[w,h,enc], Bplus:[...], Blite:[...]}, colour?]
// enc: "u" = UASTC (normals, alpha, hero colour), "e" = ETC1S (B+ colour), null = not shipped on that tier
const MAPS = [
  ["skin_albedo_H.png", "TaxilaSkin", "baseColor", { H: [2048, 2048, "u"], Bplus: null, Blite: null }, true],
  ["skin_albedo.png", "TaxilaSkin", "baseColor", { H: null, Bplus: [1024, 1024, "u"], Blite: [1024, 1024, "e"] }, true],
  ["eye_albedo.png", "TaxilaEye", "baseColor", { H: [1024, 1024, "u"], Bplus: [512, 512, "u"], Blite: [512, 512, "e"] }, true],
  ["hair_albedo.png", "TaxilaHair", "baseColor", { H: [1024, 1024, "u"], Bplus: [512, 512, "u"], Blite: [512, 512, "e"] }, true],
  ["garment_albedo.png", "TaxilaCloth", "baseColor", { H: [1024, 1024, "u"], Bplus: [512, 512, "e"], Blite: [512, 512, "e"] }, true],
];
const MEANING = {
  baseColor: "albedo (sRGB; garment alpha = roughness)", normal: "tangent-space normal (base detail)",
  occlusion: "packed: R cavity, G roughness, B thickness, A ambient occlusion",
  emissive: "wrinkle normal, compress (blend by region masks)", metallicRoughness: "region mask A: forehead, glabella, crowL, crowR",
  sheenColor: "region mask B: nasoL, nasoR, chin, neck", clearcoatNormal: "wrinkle normal, stretch",
};

// card textures (hair, brows, lashes) take a stronger UASTC rate-distortion setting: their fine alpha survives it,
// and it pays for the 2x brow alpha resolution on H inside the 6 MB cap
// c3: the H face atlas takes RDO 1.5 (flat painted texels survive it)
const RDO = { "hair_albedo.png": "2.0", "skin_albedo_H.png": "1.5" };
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
    } else if (slot === "clearcoatNormal") {
      const c = m.getExtension("KHR_materials_clearcoat") || cc.createClearcoat();
      c.setClearcoatFactor(0).setClearcoatNormalTexture(t);
      m.setExtension("KHR_materials_clearcoat", c);
    }
    (slotsUsed[owner] ||= {})[slot] = { map: file.replace(".png", ""), meaning: MEANING[slot], px: `${sz[0]}x${sz[1]}`, enc: sz[2] === "u" ? "UASTC" : "ETC1S" };
  }
  for (const m of root.listMaterials()) {
    m.setDoubleSided(true);   // c3: every VRoid part is opaque (no alpha cards); VRoid relies on double-sided hair and clothes
    if (m.getName() === "TaxilaLens") m.setAlphaMode("BLEND").setBaseColorFactor([0.9, 0.95, 1, 0.08]);
    m.setExtras({ taxila: { shader: m.getName(), slots: slotsUsed[m.getName()] || {}, tier } });
  }
  doc.getRoot().setExtras({ taxila: { look, tier, generator: "scripts/character/candidates/c3 (VRM1_Constraint_Twist_Sample, (c) 2022 pixiv Inc., VRM Public License 1.0; recoloured, re-rigged, ARKit/viseme keys synthesised; modified by Taxila)", vrmLicense: VRM_META } });
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
