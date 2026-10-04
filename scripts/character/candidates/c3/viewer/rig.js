// c3 fork of scripts/character/viewer/rig.js. The HeadRig contract (apply / dispose / stats), the bone rules, lid follow,
// correctives, the B+ viseme fold, the jaw ceiling and the landmarks are unchanged. Changed: (1) materials are the
// stylised TaxilaToon family (toon.js) on the shared light rig; (2) the mouth-interior opening proxy also counts the
// visemes' own opening (c1's fix: VRoid's vowels open the mouth by their own deltas, not through jawOpen).
// GLB teacher rig: the factory-asset implementation of src/avatar/three/head.ts's HeadRig contract
//   apply(bs, head[p,y,r], gaze[yaw,pitch], lean, breath), dispose(), stats()
// plus correctives (product of parents), the B+ viseme fold, lid-follow, and the wrinkle-map drivers.
// Framework-free; three r180. The avatar workstream ports this file into src/avatar/three/ (runtime contract).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { lightUniforms } from "../../../viewer/shaders.js";
import { correctiveParents, VISEME_TO_ARKIT, wrinkleWeights } from "../../../viewer/presets.js";
import { TOON_VERT, TOON_VERT_PLAIN, TOON_SKIN_FRAG, TOON_EYE_FRAG, TOON_HAIR_FRAG, TOON_CLOTH_FRAG } from "./toon.js";

const DEG = Math.PI / 180;
const VISEME_OPEN = Object.entries({ viseme_aa: 0.55, viseme_O: 0.42, viseme_E: 0.32, viseme_I: 0.26, viseme_U: 0.22, viseme_CH: 0.22, viseme_kk: 0.26, viseme_DD: 0.22, viseme_TH: 0.22, viseme_RR: 0.22, viseme_nn: 0.16, viseme_SS: 0.14, viseme_FF: 0.14 });
// Runtime calibration gains. The first build needed 1.2-1.6 on smile / squint / brow because the CC0 units are soft;
// those gains pushed the units past their designed range (corner artefacts). keys.py now bakes scripted corrective
// deltas into the units instead (expression_correctives), so every gain is 1.0 and this table is empty.
export const CALIBRATION = {};
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
  // ---------------- c3: every part takes TaxilaToon (toon.js); the light rig and uniform names are the shared ones
  const T = opts.toon || {};
  const toonU = () => ({ uShadeK: { value: T.shadeK ?? 0.78 }, uShadeTint: { value: new THREE.Vector3(...(T.shadeTint || [0.92, 0.78, 0.78])) },
    uRampShift: { value: T.rampShift ?? 0.0 }, uRampSoft: { value: T.rampSoft ?? 0.22 }, uRimK: { value: lite ? 0 : (T.rimK ?? 0.5) } });
  const face = meshes.face;
  face.material = mk(face, TOON_VERT, TOON_SKIN_FRAG, { ...toonU(), tAlbedo: { value: src(face).map },
    uAlbedoGain: { value: new THREE.Vector3(1, 1, 1) }, uMouthOpen: { value: 0 }, uMouthFront: { value: new THREE.Vector3() },
    uFlush: { value: 0 }, uCheekL: { value: new THREE.Vector3() }, uCheekR: { value: new THREE.Vector3() }, uSpec: { value: lite ? 0 : (T.spec ?? 0.5) },
    uBrowBias: { value: T.browBias ?? 0.035 }, uChinY: { value: -9 }, uNeckShade: { value: T.neckShade ?? 0.22 } }, {}, { side: THREE.DoubleSide });
  const eyes = meshes.eyes;
  eyes.material = mk(eyes, TOON_VERT, TOON_EYE_FRAG, { ...toonU(), tAlbedo: { value: src(eyes).map }, uLidShade: { value: T.irisK ?? 1.0 } }, {});
  const hair = meshes.hair;
  hair.material = mk(hair, TOON_VERT_PLAIN, TOON_HAIR_FRAG, { ...toonU(), tAlbedo: { value: src(hair).map }, uRing: { value: lite ? 0 : (T.ring ?? 0.18) },
    uHeadC: { value: new THREE.Vector3() } }, {}, { side: THREE.DoubleSide });
  const garment = meshes.garment;
  garment.material = mk(garment, TOON_VERT_PLAIN, TOON_CLOTH_FRAG, { ...toonU(), tAlbedo: { value: src(garment).map } }, {}, { side: THREE.DoubleSide });
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
  // c3: chin = the lowest face-skin vertex near the midline in front of the neck (for the toon neck shadow)
  {
    let chinY = 1e9;
    for (let i = 0; i < reg.count; i++) {
      if (Math.round(reg.getX(i)) !== 0) continue;
      const w = worldOf(face, i);
      if (Math.abs(w.x) < 0.01 && w.z > lipsFront.z - 0.03 && w.y < lipsFront.y && w.y > lipsFront.y - 0.08 && w.y < chinY && w.z > lipsFront.z - 0.012) chinY = w.y;
    }
    face.material.uniforms.uChinY.value = chinY < 1e8 ? chinY : -9;
    landmarks.chinY = chinY;
  }

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
    let open = final.jawOpen || 0;
    for (const [k, g] of VISEME_OPEN) if (final[k]) open = Math.max(open, final[k] * g);
    u.uMouthOpen.value = open;
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
