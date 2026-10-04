// assemble.py's scene (JSON + raw arrays) -> <buildDir>/<tier>.raw.glb in the contract's layout: nodes face / eyes / cards
// / hair / garment skinned to the Armature (Spine2 Neck Head LeftEye RightEye LeftShoulder RightShoulder), materials
// named after the Taxila shaders (finish.mjs attaches the maps and compresses), morph target names in mesh extras.
//   node write_glb.mjs <buildDir> <tier>
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const TOOLS = process.env.CHAR_TOOLS || "/tmp/claude-0/char/tools";
const req = createRequire(path.join(TOOLS, "package.json"));
const { Document, NodeIO } = req("@gltf-transform/core");
const { ALL_EXTENSIONS } = req("@gltf-transform/extensions");
const [bd, tier] = process.argv.slice(2);
const dir = path.join(bd, tier);
const sc = JSON.parse(fs.readFileSync(path.join(dir, "scene.json")));
const doc = new Document();
const buf = doc.createBuffer();
const rd = (f, T) => { const b = fs.readFileSync(path.join(dir, f)); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
// bones
const nodes = {};
for (const b of sc.bones) nodes[b.name] = doc.createNode(b.name).setTranslation(b.t).setRotation(b.r).setScale(b.s);
for (const b of sc.bones) if (b.parent) nodes[b.parent].addChild(nodes[b.name]);
const scene = doc.createScene("Scene").addChild(nodes.Armature);
// world matrices for the inverse binds
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; };
const trs = (t, q, s) => { const [x, y, z, w] = q; const m = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
  2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, t[0], t[1], t[2], 1]; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) m[c * 4 + r] *= s[c]; return m; };
const byName = Object.fromEntries(sc.bones.map((b) => [b.name, b]));
const world = (n) => { const b = byName[n]; const l = trs(b.t, b.r, b.s); return b.parent ? mul(world(b.parent), l) : l; };
function inv4(m) { // general 4x4 inverse (column-major)
  const a = m, o = new Array(16);
  const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5],
    b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12],
    b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det; o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
  o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det; o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
  o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det; o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
  o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det; o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
  return o;
}
const ibm = new Float32Array(sc.joints.flatMap((j) => inv4(world(j))));
const skin = doc.createSkin("skin").setSkeleton(nodes.Armature)
  .setInverseBindMatrices(doc.createAccessor("ibm").setType("MAT4").setArray(ibm).setBuffer(buf));
for (const j of sc.joints) skin.addJoint(nodes[j]);
const TYPES = { 1: "SCALAR", 2: "VEC2", 3: "VEC3", 4: "VEC4" };
for (const m of sc.meshes) {
  const prim = doc.createPrimitive();
  for (const [sem, a] of Object.entries(m.attrs)) {
    const arr = a.type === "u8" ? rd(a.file, Uint8Array) : rd(a.file, Float32Array);
    prim.setAttribute(sem, doc.createAccessor(`${m.name}_${sem}`).setType(TYPES[a.size]).setArray(arr).setBuffer(buf));
  }
  prim.setIndices(doc.createAccessor(`${m.name}_idx`).setType("SCALAR").setArray(rd(m.indices, Uint32Array)).setBuffer(buf));
  m.targets.forEach((f, i) => {
    const t = doc.createPrimitiveTarget(m.targetNames[i]);
    t.setAttribute("POSITION", doc.createAccessor(`${m.name}_t${i}`).setType("VEC3").setArray(rd(f, Float32Array)).setBuffer(buf));
    prim.addTarget(t);
  });
  prim.setMaterial(doc.createMaterial(m.material).setDoubleSided(m.material === "TaxilaCloth"));
  const mesh = doc.createMesh(m.name).addPrimitive(prim);
  if (m.targetNames.length) mesh.setWeights(new Array(m.targetNames.length).fill(0));
  mesh.setExtras({ ...(m.extras || {}), ...(m.targetNames.length ? { targetNames: m.targetNames } : {}) });
  scene.addChild(doc.createNode(m.name).setMesh(mesh).setSkin(skin));
}
doc.getRoot().setDefaultScene(scene);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const out = path.join(bd, `${tier}.raw.glb`);
await io.write(out, doc);
console.log(`[glb] ${out} ${(fs.statSync(out).size / 1e6).toFixed(2)} MB`);
