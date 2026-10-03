// GLB teacher rig: the factory-asset implementation of src/avatar/three/head.ts's HeadRig contract
//   apply(bs, head[p,y,r], gaze[yaw,pitch], lean, breath), dispose(), stats()
// plus correctives (product of parents), the B+ viseme fold, lid-follow, and the wrinkle-map drivers.
// Framework-free; three r180. The avatar workstream ports this file into src/avatar/three/ (runtime contract).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { SHADERS, lightUniforms, makeSkinLUT } from "./shaders.js";
import { correctiveParents, VISEME_TO_ARKIT, wrinkleWeights } from "./presets.js";

const DEG = Math.PI / 180;
// Runtime calibration gains. The first build needed 1.2-1.6 on smile / squint / brow because the CC0 units are soft;
// those gains pushed the units past their designed range (corner artefacts). keys.py now bakes scripted corrective
// deltas into the units instead (expression_correctives), so every gain is 1.0 and this table is empty.
export const CALIBRATION = {};
let LUT = null;
let ktx2 = null;

export async function loadTeacher(renderer, url, opts = {}) {
  // opts: { tier, look: { iris }, lights (lightUniforms(runtime.json.lighting)), jawCeiling (runtime.json.jawCeiling) }
  const tier = opts.tier || "H";
  if (!ktx2) {
    ktx2 = new KTX2Loader().setTranscoderPath(opts.basisPath || "/node_modules/three/examples/jsm/libs/basis/").detectSupport(renderer);
    // evidence harness only (?ktxRaw=1): transcode to uncompressed RGBA, to separate encoder faults from GPU decode faults
    if (opts.ktxRaw) for (const k of Object.keys(ktx2.workerConfig)) if (k.endsWith("Supported")) ktx2.workerConfig[k] = false;
  }
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const t0 = performance.now();
  const gltf = await loader.loadAsync(url);
  const loadMs = performance.now() - t0;
  LUT ||= makeSkinLUT();
  const root = gltf.scene;
  const lights = opts.lights || lightUniforms();
  const look = opts.look || {};
  const meshes = {};
  root.traverse((o) => { if (o.isMesh) meshes[o.name] = o; });
  const lite = tier === "Blite";
  const jawCeiling = opts.jawCeiling ?? 1;
  const materials = [];

  function mk(o, vert, frag, uniforms, defines, extra = {}) {
    const m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { ...lights, ...uniforms }, defines, ...extra });
    materials.push(m);
    return m;
  }
  const src = (o) => o.material; // the loader's material carries the decoded maps in standard slots
  // ---------------- face (TaxilaSkin)
  const face = meshes.face;
  {
    const s = src(face);
    const defs = {};
    const u = {
      tAlbedo: { value: s.map }, tLUT: { value: LUT },
      uTeeth: { value: new THREE.Vector3(0.86, 0.78, 0.64) }, uGum: { value: new THREE.Vector3(0.30, 0.10, 0.09) },
      uTongue: { value: new THREE.Vector3(0.46, 0.16, 0.14) }, uBag: { value: new THREE.Vector3(0.16, 0.045, 0.04) },   // merged: a warm dark red, not near-black
      uAlbedoGain: { value: new THREE.Vector3(1, 1, 1) },
      uMouthOpen: { value: 0 }, uMouthFront: { value: new THREE.Vector3() },
      uFlush: { value: 0 }, uCheekL: { value: new THREE.Vector3() }, uCheekR: { value: new THREE.Vector3() }, uSpec: { value: 0.42 }, uDebugAlbedo: { value: 0 },
    };
    if (s.normalMap && !lite) { defs.HAS_NORMAL = ""; u.tNormal = { value: s.normalMap }; u.uNormalScale = { value: 1.0 }; }
    if (s.aoMap) { defs.HAS_PACKED = ""; u.tPacked = { value: s.aoMap }; }
    if (s.emissiveMap && s.metalnessMap && s.sheenColorMap && !lite) {
      defs.HAS_WRINKLE = ""; u.tWrinkle = { value: s.emissiveMap }; u.tMaskA = { value: s.metalnessMap }; u.tMaskB = { value: s.sheenColorMap };
      u.uWrA = { value: new THREE.Vector4() }; u.uWrB = { value: new THREE.Vector4() };
    }
    if (s.clearcoatNormalMap && !lite) { defs.HAS_STRETCH = ""; u.tWrinkleS = { value: s.clearcoatNormalMap }; u.uStretch = { value: 0 }; }
    // procedural-v3 maps (self-described in extras.taxila): detail = KHR_materials_specular.specularTexture,
    // micro tile = KHR_materials_clearcoat.clearcoatRoughnessTexture (H only)
    if (s.specularIntensityMap && !lite) {
      defs.HAS_DETAIL = ""; u.tDetail = { value: s.specularIntensityMap };
      u.uFuzz = { value: 0.55 }; u.uSSSTint = { value: new THREE.Vector3(1.0, 0.32, 0.18) }; u.uSSS = { value: 0.45 }; u.uWet = { value: 1.0 };
    }
    if (s.clearcoatRoughnessMap && tier === "H") {
      defs.HAS_MICRO = ""; s.clearcoatRoughnessMap.wrapS = s.clearcoatRoughnessMap.wrapT = THREE.RepeatWrapping;
      s.clearcoatRoughnessMap.needsUpdate = true;
      u.tMicro = { value: s.clearcoatRoughnessMap }; u.uMicroTile = { value: 46.0 }; u.uMicroK = { value: 0.55 };
    }
    if (tier === "H") defs.TIER_H = "";
    if (lite) defs.TIER_LITE = "";
    face.material = mk(face, SHADERS.SKIN_VERT, SHADERS.SKIN_FRAG, u, defs);
  }
  // ---------------- eyes (TaxilaEye): centres from the bind-pose geometry
  const eyes = meshes.eyes;
  {
    const p = eyes.geometry.attributes.position;
    const L = new THREE.Vector3(), R = new THREE.Vector3();
    let nl = 0, nr = 0, rad = 0;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x > 0) { L.x += x; L.y += p.getY(i); L.z += p.getZ(i); nl++; } else { R.x += x; R.y += p.getY(i); R.z += p.getZ(i); nr++; } }
    L.divideScalar(nl); R.divideScalar(nr);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x > 0 && p.getZ(i) < L.z) rad = Math.max(rad, Math.hypot(x - L.x, p.getY(i) - L.y, p.getZ(i) - L.z)); }
    const iris = new THREE.Color(look.iris || "#3A2416").convertSRGBToLinear();
    eyes.material = mk(eyes, SHADERS.EYE_VERT, SHADERS.EYE_FRAG, {
      uEyeL: { value: L }, uEyeR: { value: R }, uEyeRad: { value: rad }, uIris: { value: new THREE.Vector3(iris.r, iris.g, iris.b) },
      uPupil: { value: 0.33 }, uLidShadow: { value: 0.65 }, uIrisDetail: { value: tier === "H" ? 1 : 0.6 },
      // merged eye pass: sclera albedo from the look (tuned to the reference's sclera / skin ratio), lid-following shadow
      uSclera: { value: new THREE.Vector3(...(look.sclera || [0.78, 0.74, 0.70])) }, uLidClose: { value: new THREE.Vector2(look.restLid ?? 0.35, look.restLid ?? 0.35) } }, {});
  }
  // ---------------- hair + cards (alpha-to-coverage under MSAA; never alpha-blend)
  for (const nm of ["hair", "cards"]) {
    const o = meshes[nm];
    if (!o) continue;
    // brows and lashes take no Kajiya-Kay highlight: it lit the brow cards tan and patchy (review item 11)
    o.material = mk(o, SHADERS.HAIR_VERT, SHADERS.HAIR_FRAG, { tAlbedo: { value: src(o).map }, uShift: { value: nm === "hair" ? 0.1 : 0 },
      uSpecTint: { value: new THREE.Vector3(1.0, 0.85, 0.7) }, uKK: { value: nm === "hair" ? 0.32 : 0.0 } },
    o.geometry.attributes._strand ? { HAS_STRAND: "" } : {},
    { side: THREE.DoubleSide, alphaToCoverage: true, transparent: false });
  }
  const garment = meshes.garment;
  garment.material = mk(garment, SHADERS.PLAIN_VERT, SHADERS.CLOTH_FRAG, { tAlbedo: { value: src(garment).map } }, {}, { side: THREE.DoubleSide });
  if (meshes.lens) {
    meshes.lens.material = mk(meshes.lens, SHADERS.PLAIN_VERT, SHADERS.LENS_FRAG, {}, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    meshes.lens.renderOrder = 2;
  }
  for (const o of Object.values(meshes)) o.frustumCulled = false;

  // ---------------- bones and the character-space rotation helper
  const bones = {};
  root.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  root.updateMatrixWorld(true);
  const rest = {};
  for (const [n, b] of Object.entries(bones)) {
    rest[n] = { q: b.quaternion.clone(), parentWorld: b.parent.getWorldQuaternion(new THREE.Quaternion()) };
  }
  const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  /** Rotate a bone by Euler (x pitch, y yaw, z roll; radians) expressed in character space (Y up, Z forward). */
  function rot(name, x, y, z) {
    const b = bones[name];
    if (!b) return;
    const r = rest[name];
    tmpQ.setFromEuler(tmpE.set(x, y, z, "YXZ"));
    // local = parentWorld^-1 * G * parentWorld * restLocal
    const pw = r.parentWorld;
    b.quaternion.copy(pw).invert().multiply(tmpQ).multiply(pw).multiply(r.q);
  }

  // landmarks in WORLD space at rest (positions may be quantized: KHR_mesh_quantization moves the dequantisation into
  // the skin's inverse bind matrices, so raw attributes are not metres; getVertexPosition applies skinning)
  root.updateMatrixWorld(true);
  const wv = new THREE.Vector3();
  const worldOf = (mesh, i) => mesh.localToWorld(mesh.getVertexPosition(i, wv)).clone();
  const eyeW = { L: new THREE.Vector3(), R: new THREE.Vector3() };
  {
    const p = eyes.geometry.attributes.position; let nl = 0, nr = 0;
    for (let i = 0; i < p.count; i += 3) { const w = worldOf(eyes, i); if (w.x > 0) { eyeW.L.add(w); nl++; } else { eyeW.R.add(w); nr++; } }
    eyeW.L.divideScalar(nl); eyeW.R.divideScalar(nr);
  }
  const reg = face.geometry.attributes._region;
  const lipsFront = new THREE.Vector3(0, 0, -1e9);
  for (let i = 0; i < reg.count; i++) {
    if (Math.round(reg.getX(i)) !== 1) continue;
    const w = worldOf(face, i);
    if (w.z > lipsFront.z) lipsFront.copy(w);
  }
  face.material.uniforms.uMouthFront.value.copy(lipsFront);
  face.material.uniforms.uCheekL.value.copy(eyeW.L).add(new THREE.Vector3(0.012, -0.03, 0.004));
  face.material.uniforms.uCheekR.value.copy(eyeW.R).add(new THREE.Vector3(-0.012, -0.03, 0.004));
  // lip line: the skin vertex nearest the midline in front of the teeth (frames the mouth camera; review item 15)
  const lipLine = new THREE.Vector3(0, 0, -1e9);
  for (let i = 0; i < reg.count; i++) {
    if (Math.round(reg.getX(i)) !== 0) continue;
    const w = worldOf(face, i);
    if (Math.abs(w.x) < 0.004 && Math.abs(w.y - lipsFront.y) < 0.007 && w.z > lipLine.z) lipLine.copy(w);
  }
  const landmarks = { eyeL: eyeW.L, eyeR: eyeW.R, mouthFront: lipsFront, lipLine };

  const dict = face.morphTargetDictionary;
  const corrNames = Object.keys(dict).map((k) => [k, correctiveParents(k)]).filter(([, p]) => p);
  const hasVisemes = "viseme_aa" in dict;
  const morphMeshes = Object.values(meshes).filter((m) => m.morphTargetDictionary);
  const final = {};

  function apply(bs, head = [0, 0, 0], gaze = [0, 0], lean = 0, breath = 0, extra = {}) {
    for (const k in final) delete final[k];
    for (const [k, v] of Object.entries(bs)) {
      if (k.startsWith("viseme_") && !hasVisemes) {
        for (const [a, w] of Object.entries(VISEME_TO_ARKIT[k] || {})) final[a] = (final[a] || 0) + w * v;
      } else final[k] = (final[k] || 0) + v;
    }
    // lid follow: the upper lid tracks vertical gaze at gain 0.5, lower at 0.25 (via the eyeLook keys)
    const up = Math.max(0, gaze[1]) / 25, dn = Math.max(0, -gaze[1]) / 25;
    for (const S of ["Left", "Right"]) {
      final[`eyeLookUp${S}`] = (final[`eyeLookUp${S}`] || 0) + up * 0.5;
      final[`eyeLookDown${S}`] = (final[`eyeLookDown${S}`] || 0) + dn * 0.5;
    }
    // rig calibration: the CC0 face units are authored softer than Apple's ARKit reference on some keys; these gains
    // map a spec amplitude (TEACHER-VISUAL §6) to the same visible size (runtime.json "calibration")
    for (const [k, g] of Object.entries(CALIBRATION)) if (final[k]) final[k] *= g;
    for (const k in final) final[k] = Math.max(0, Math.min(1, final[k]));
    // per-look jaw ceiling (runtime.json.jawCeiling): the open-jaw frames read as gaping above ~0.55 on these faces
    if (final.jawOpen) final.jawOpen = Math.min(final.jawOpen, jawCeiling);
    for (const [k, p] of corrNames) final[k] = (final[p[0]] || 0) * (final[p[1]] || 0);
    for (const m of morphMeshes) {
      const d = m.morphTargetDictionary, inf = m.morphTargetInfluences;
      inf.fill(0);
      for (const k in final) { const i = d[k]; if (i !== undefined) inf[i] = final[k]; }
    }
    const u = face.material.uniforms;
    if (u.uWrA) { const w = wrinkleWeights(final); u.uWrA.value.fromArray(w.A); u.uWrB.value.fromArray(w.B); if (u.uStretch) u.uStretch.value = w.stretch * 0.6; }
    u.uMouthOpen.value = final.jawOpen || 0;
    { // merged: the upper lid position for the eye shader's lid shadow (rest lid + blink - wide + squint share)
      const r0 = look.restLid ?? 0.35, el = eyes.material.uniforms.uLidClose.value, cl = (S) => Math.max(0, Math.min(1,
        r0 + (1 - r0) * (final[`eyeBlink${S}`] || 0) - 0.35 * (final[`eyeWide${S}`] || 0) + 0.25 * (final[`eyeSquint${S}`] || 0) + 0.3 * (final[`eyeLookDown${S}`] || 0) - 0.3 * (final[`eyeLookUp${S}`] || 0)));
      el.set(cl("Left"), cl("Right"));
    }
    u.uFlush.value = tier === "H" ? (extra.flush || 0) : 0;
    // head: neck carries 35%, head 65%; + = chin down / her left; roll sign matches head.ts
    const [p, y, r] = head;
    rot("Neck", p * 0.35 * DEG, y * 0.35 * DEG, -r * 0.35 * DEG);
    rot("Head", p * 0.65 * DEG, y * 0.65 * DEG, -r * 0.65 * DEG);
    // eyes: yaw + = her left, pitch + = up
    for (const e of ["LeftEye", "RightEye"]) rot(e, -gaze[1] * DEG, gaze[0] * DEG, 0);
    // lean-in (spine pitch forward) and breathing (shoulders 2-3 mm, chest)
    rot("Spine2", lean * 4 * DEG + breath * 0.4 * DEG, 0, 0);
    rot("LeftShoulder", 0, 0, breath * 0.9 * DEG);
    rot("RightShoulder", 0, 0, -breath * 0.9 * DEG);
  }

  return {
    root, tier, loadMs, meshes, bones, final, landmarks,
    apply,
    stats() {
      let triangles = 0, m = 0;
      root.traverse((o) => { if (o.isMesh) { m++; triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
      return { triangles, meshes: m, morphTargets: Object.keys(dict).length };
    },
    dispose() {
      root.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } });
      for (const m of materials) m.dispose();
    },
  };
}
