// The GLB teacher rig: the factory-asset implementation of the HeadRig contract (./head.ts)
//   apply(bs, head[p,y,r], gaze[yaw,pitch], lean, breath), dispose(), stats()
// plus correctives, the B+ viseme fold, lid-follow and the wrinkle drivers (./presets.ts). Ported from
// scripts/character/bakeoff/merged/viewer/rig.js; every per-face setting comes from the look's runtime.json
// (./contract.ts resolveShading), so any face that follows the contract loads with zero code change.
//
// Lives in the lazy stage3d chunk only (GLTFLoader + KTX2Loader + MeshoptDecoder never reach the cold path).
// Relative morphs are kept (avatar-m0-dead-ends #1). The basis transcoder is self-hosted, one worker.
import {
  DoubleSide, Quaternion, Euler, RepeatWrapping, ShaderMaterial, Vector2, Vector3, Vector4, Color,
  type Group, type Mesh, type Object3D,
  type Bone, type DataTexture, type Texture, type WebGLRenderer, type BufferGeometry, type IUniform,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { resolveShading, type RigTier, type RuntimeJson } from "./contract.ts";
import { correctiveParents, finalWeights, lidClose, mouthOpening, wrinkleWeights } from "./presets.ts";
import { SHADERS, lightUniforms, makeSkinLUT } from "./shaders.ts";
import type { HeadRig } from "./head.ts";

const DEG = Math.PI / 180;
/** Self-hosted, versioned with three (public/assets/teacher/basis/r180). */
export const BASIS_PATH = "/assets/teacher/basis/r180/";
let LUT: DataTexture | null = null;
let ktx2: KTX2Loader | null = null;

export interface GlbRig extends HeadRig {
  tier: RigTier;
  loadMs: number;
  landmarks: { eyeL: Vector3; eyeR: Vector3; mouthFront: Vector3; lipLine: Vector3 };
  final: Record<string, number>;
  meshes: Record<string, Mesh>;
}

type Uniforms = Record<string, IUniform>;
type StdMat = { map?: Texture | null; normalMap?: Texture | null; aoMap?: Texture | null; emissiveMap?: Texture | null; metalnessMap?: Texture | null;
  sheenColorMap?: Texture | null; clearcoatNormalMap?: Texture | null; specularIntensityMap?: Texture | null; clearcoatRoughnessMap?: Texture | null; dispose?: () => void };

/** Fetch + decode a tier GLB and build the rig on it. `signal` aborts the fetch (the 8 s timeout). */
export async function loadTeacher(renderer: WebGLRenderer, url: string, rt: RuntimeJson, tier: RigTier, opts: { signal?: AbortSignal } = {}): Promise<GlbRig> {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH).setWorkerLimit(1);
  ktx2.detectSupport(renderer);
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const t0 = performance.now();
  const res = await fetch(url, { signal: opts.signal, credentials: "same-origin" });
  if (!res.ok) throw new Error(`GLB ${res.status}`);
  const buf = await res.arrayBuffer();
  const base = url.slice(0, url.lastIndexOf("/") + 1);
  const gltf = await loader.parseAsync(buf, base);
  if (opts.signal?.aborted) throw new Error("aborted");
  return buildRig(gltf.scene, rt, tier, performance.now() - t0);
}

function buildRig(root: Group, rt: RuntimeJson, tier: RigTier, loadMs: number): GlbRig {
  LUT ||= makeSkinLUT();
  const lights = lightUniforms(rt.lighting);
  const sh = resolveShading(rt);
  const meshes: Record<string, Mesh> = {};
  root.traverse((o) => { if ((o as Mesh).isMesh) meshes[o.name] = o as Mesh; });
  for (const need of ["face", "eyes", "hair", "garment"]) if (!meshes[need]) throw new Error(`look ${rt.look}: mesh "${need}" missing`);
  const lite = tier === "Blite";
  const materials: ShaderMaterial[] = [];
  const replaced: StdMat[] = [];
  const profile: Record<string, string> = sh.merged ? { PROFILE_MERGED: "" } : {};

  function mk(vert: string, frag: string, uniforms: Uniforms, defines: Record<string, string>, extra: Record<string, unknown> = {}): ShaderMaterial {
    const m = new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { ...lights, ...uniforms }, defines: { ...profile, ...defines }, ...extra });
    materials.push(m);
    return m;
  }
  const src = (o: Mesh): StdMat => {
    const m = o.material as unknown as StdMat;
    replaced.push(m);
    return m;
  };
  const V3 = (a: number[]) => new Vector3(a[0], a[1], a[2]);

  // ---------------- face (TaxilaSkin)
  const face = meshes.face;
  {
    const s = src(face);
    const defs: Record<string, string> = {};
    const u: Uniforms = {
      tAlbedo: { value: s.map ?? null }, tLUT: { value: LUT },
      uTeeth: { value: V3(sh.teeth) }, uGum: { value: V3(sh.gum) }, uTongue: { value: V3(sh.tongue) }, uBag: { value: V3(sh.bag) },
      uAlbedoGain: { value: new Vector3(1, 1, 1) },
      uMouthOpen: { value: 0 }, uMouthFront: { value: new Vector3() },
      uFlush: { value: 0 }, uCheekL: { value: new Vector3() }, uCheekR: { value: new Vector3() }, uSpec: { value: 0.42 },
    };
    if (s.normalMap && !lite) { defs.HAS_NORMAL = ""; u.tNormal = { value: s.normalMap }; u.uNormalScale = { value: 1.0 }; }
    if (s.aoMap) { defs.HAS_PACKED = ""; u.tPacked = { value: s.aoMap }; }
    if (s.emissiveMap && s.metalnessMap && s.sheenColorMap && !lite) {
      defs.HAS_WRINKLE = ""; u.tWrinkle = { value: s.emissiveMap }; u.tMaskA = { value: s.metalnessMap }; u.tMaskB = { value: s.sheenColorMap };
      u.uWrA = { value: new Vector4() }; u.uWrB = { value: new Vector4() };
    }
    if (s.clearcoatNormalMap && !lite) { defs.HAS_STRETCH = ""; u.tWrinkleS = { value: s.clearcoatNormalMap }; u.uStretch = { value: 0 }; }
    if (s.specularIntensityMap && !lite) {
      defs.HAS_DETAIL = ""; u.tDetail = { value: s.specularIntensityMap };
      u.uFuzz = { value: 0.55 }; u.uSSSTint = { value: new Vector3(1.0, 0.32, 0.18) }; u.uSSS = { value: 0.45 }; u.uWet = { value: 1.0 };
    }
    if (s.clearcoatRoughnessMap && tier === "H") {
      defs.HAS_MICRO = ""; s.clearcoatRoughnessMap.wrapS = s.clearcoatRoughnessMap.wrapT = RepeatWrapping;
      s.clearcoatRoughnessMap.needsUpdate = true;
      u.tMicro = { value: s.clearcoatRoughnessMap }; u.uMicroTile = { value: 46.0 }; u.uMicroK = { value: 0.55 };
    }
    if (tier === "H") defs.TIER_H = "";
    if (lite) defs.TIER_LITE = "";
    if (sh.hairLumaGate) defs.HAIR_LUMA_GATE = "";
    face.material = mk(SHADERS.SKIN_VERT, SHADERS.SKIN_FRAG, u, defs);
  }
  // ---------------- eyes (TaxilaEye): centres from the bind-pose geometry
  const eyes = meshes.eyes;
  {
    const p = (eyes.geometry as BufferGeometry).attributes.position;
    const L = new Vector3(), R = new Vector3();
    let nl = 0, nr = 0, rad = 0;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x > 0) { L.x += x; L.y += p.getY(i); L.z += p.getZ(i); nl++; } else { R.x += x; R.y += p.getY(i); R.z += p.getZ(i); nr++; } }
    L.divideScalar(Math.max(1, nl)); R.divideScalar(Math.max(1, nr));
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x > 0 && p.getZ(i) < L.z) rad = Math.max(rad, Math.hypot(x - L.x, p.getY(i) - L.y, p.getZ(i) - L.z)); }
    const s = src(eyes);
    const eyeTex = !!s.map;
    if (eyeTex) {
      // a photo eye is usually a front cap, not a full ball: centre = the cap's lateral bbox centre, pushed back from
      // the apex by the lateral radius (bind space)
      for (const [C, sg] of [[L, 1], [R, -1]] as [Vector3, number][]) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z1 = -1e9;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i); if (x * sg <= 0) continue; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); z1 = Math.max(z1, p.getZ(i)); }
        rad = (x1 - x0) / 2;
        C.set((x0 + x1) / 2, (y0 + y1) / 2, z1 - rad);
      }
    }
    const iris = new Color(rt.iris || "#3A2416").convertSRGBToLinear();
    eyes.material = mk(SHADERS.EYE_VERT, SHADERS.EYE_FRAG, {
      uEyeL: { value: L }, uEyeR: { value: R }, uEyeRad: { value: rad || 0.012 }, uIris: { value: new Vector3(iris.r, iris.g, iris.b) },
      uPupil: { value: sh.pupil }, uLidShadow: { value: sh.lidShadow }, uIrisDetail: { value: tier === "H" ? 1 : 0.6 },
      uSclera: { value: V3(sh.sclera) }, uLidClose: { value: new Vector2(sh.restLid, sh.restLid) },
      ...(eyeTex ? { tEye: { value: s.map } } : {}),
    }, eyeTex ? { EYE_TEX: "" } : {});
  }
  // ---------------- hair + cards (alpha-to-coverage under MSAA; never alpha-blend)
  for (const nm of ["hair", "cards"]) {
    const o = meshes[nm];
    if (!o) continue;
    const geo = o.geometry as BufferGeometry;
    const defs: Record<string, string> = geo.attributes._strand ? { HAS_STRAND: "" } : {};
    if (!sh.cardRim && nm === "cards") defs.NO_CARD_RIM = "";
    // brows and lashes take no Kajiya-Kay highlight (it lit the brow cards tan and patchy)
    o.material = mk(SHADERS.HAIR_VERT, SHADERS.HAIR_FRAG, { tAlbedo: { value: src(o).map ?? null }, uShift: { value: nm === "hair" ? 0.1 : 0 },
      uSpecTint: { value: new Vector3(1.0, 0.85, 0.7) }, uKK: { value: nm === "hair" ? sh.hairKK : 0.0 } },
    defs, { side: DoubleSide, alphaToCoverage: true, transparent: false });
  }
  const garment = meshes.garment;
  garment.material = mk(SHADERS.PLAIN_VERT, SHADERS.CLOTH_FRAG, { tAlbedo: { value: src(garment).map ?? null } }, {}, { side: DoubleSide });
  if (meshes.lens) {
    src(meshes.lens);
    meshes.lens.material = mk(SHADERS.PLAIN_VERT, SHADERS.LENS_FRAG, {}, {}, { transparent: true, depthWrite: false, side: DoubleSide });
    meshes.lens.renderOrder = 2;
  }
  for (const o of Object.values(meshes)) o.frustumCulled = false;
  // the loader's standard materials are replaced: free them (their textures live on in our uniforms)
  for (const m of new Set(replaced)) m.dispose?.();

  // ---------------- bones and the character-space rotation helper
  const bones: Record<string, Bone> = {};
  root.traverse((o) => { if ((o as Bone).isBone) bones[o.name] = o as Bone; });
  root.updateMatrixWorld(true);
  const rest: Record<string, { q: Quaternion; parentWorld: Quaternion }> = {};
  for (const [n, b] of Object.entries(bones)) rest[n] = { q: b.quaternion.clone(), parentWorld: (b.parent as Object3D).getWorldQuaternion(new Quaternion()) };
  const tmpQ = new Quaternion(), tmpE = new Euler();
  /** Rotate a bone by Euler (x pitch, y yaw, z roll; radians) expressed in character space (Y up, Z forward). */
  function rot(name: string, x: number, y: number, z: number): void {
    const b = bones[name];
    if (!b) return;
    const r = rest[name];
    tmpQ.setFromEuler(tmpE.set(x, y, z, "YXZ"));
    b.quaternion.copy(r.parentWorld).invert().multiply(tmpQ).multiply(r.parentWorld).multiply(r.q);
  }

  // landmarks in WORLD space at rest (getVertexPosition applies skinning and the quantisation in the bind matrices)
  const wv = new Vector3();
  const worldOf = (mesh: Mesh, i: number) => mesh.localToWorld(mesh.getVertexPosition(i, wv)).clone();
  const eyeW = { L: new Vector3(), R: new Vector3() };
  {
    const p = (eyes.geometry as BufferGeometry).attributes.position; let nl = 0, nr = 0;
    for (let i = 0; i < p.count; i += 3) { const w = worldOf(eyes, i); if (w.x > 0) { eyeW.L.add(w); nl++; } else { eyeW.R.add(w); nr++; } }
    eyeW.L.divideScalar(Math.max(1, nl)); eyeW.R.divideScalar(Math.max(1, nr));
  }
  const reg = (face.geometry as BufferGeometry).attributes._region;
  const lipsFront = new Vector3(0, eyeW.L.y - 0.07, -1e9);
  const lipLine = new Vector3(0, 0, -1e9);
  if (reg) {
    for (let i = 0; i < reg.count; i++) {
      if (Math.round(reg.getX(i)) !== 1) continue;
      const w = worldOf(face, i);
      if (w.z > lipsFront.z) lipsFront.copy(w);
    }
    for (let i = 0; i < reg.count; i++) {
      if (Math.round(reg.getX(i)) !== 0) continue;
      const w = worldOf(face, i);
      if (Math.abs(w.x) < 0.004 && Math.abs(w.y - lipsFront.y) < 0.007 && w.z > lipLine.z) lipLine.copy(w);
    }
  }
  if (lipsFront.z < -1e8) lipsFront.z = eyeW.L.z;
  const fu = (face.material as ShaderMaterial).uniforms;
  fu.uMouthFront.value.copy(lipsFront);
  fu.uCheekL.value.copy(eyeW.L).add(new Vector3(0.012, -0.03, 0.004));
  fu.uCheekR.value.copy(eyeW.R).add(new Vector3(-0.012, -0.03, 0.004));
  const landmarks = { eyeL: eyeW.L, eyeR: eyeW.R, mouthFront: lipsFront, lipLine };

  const dict = face.morphTargetDictionary ?? {};
  const correctives = Object.keys(dict).map((k) => [k, correctiveParents(k)] as const).filter((x): x is readonly [string, [string, string]] => !!x[1])
    .map(([k, p]) => [k, p] as [string, [string, string]]);
  const hasVisemes = "viseme_aa" in dict;
  const morphMeshes = Object.values(meshes).filter((m) => m.morphTargetDictionary && m.morphTargetInfluences);
  const final: Record<string, number> = {};
  const fopts = { hasVisemes, fold: rt.visemeFold?.map, calibration: (rt as { calibration?: Record<string, number> }).calibration, jawCeiling: rt.jawCeiling ?? 1, correctives };
  const eu = (eyes.material as ShaderMaterial).uniforms;

  function apply(bs: Record<string, number>, head: [number, number, number] = [0, 0, 0], gaze: [number, number] = [0, 0], lean = 0, breath = 0): void {
    finalWeights(bs, gaze, fopts, final);
    for (const m of morphMeshes) {
      const d = m.morphTargetDictionary!, inf = m.morphTargetInfluences!;
      inf.fill(0);
      for (const k in final) { const i = d[k]; if (i !== undefined) inf[i] = final[k]; }
    }
    if (fu.uWrA) { const w = wrinkleWeights(final); fu.uWrA.value.fromArray(w.A); fu.uWrB.value.fromArray(w.B); if (fu.uStretch) fu.uStretch.value = w.stretch * 0.6; }
    fu.uMouthOpen.value = mouthOpening(final, hasVisemes);
    eu.uLidClose.value.set(lidClose(final, sh.restLid, "Left"), lidClose(final, sh.restLid, "Right"));
    // head: neck carries 35%, head 65%; + = chin down / her left; roll sign matches head.ts
    const [p, y, r] = head;
    rot("Neck", p * 0.35 * DEG, y * 0.35 * DEG, -r * 0.35 * DEG);
    rot("Head", p * 0.65 * DEG, y * 0.65 * DEG, -r * 0.65 * DEG);
    for (const e of ["LeftEye", "RightEye"]) rot(e, -gaze[1] * DEG, gaze[0] * DEG, 0);
    rot("Spine2", lean * 4 * DEG + breath * 0.4 * DEG, 0, 0);
    rot("LeftShoulder", 0, 0, breath * 0.9 * DEG);
    rot("RightShoulder", 0, 0, -breath * 0.9 * DEG);
  }

  let disposed = false;
  return {
    root, tier, loadMs, meshes, final, landmarks,
    apply,
    stats() {
      let triangles = 0, m = 0;
      root.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        m++;
        const g = mesh.geometry as BufferGeometry;
        triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
      });
      return { triangles, meshes: m };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const tex = new Set<Texture>();
      for (const m of materials) {
        for (const u of Object.values(m.uniforms)) if ((u.value as Texture)?.isTexture && u.value !== LUT) tex.add(u.value as Texture);
        m.dispose();
      }
      for (const t of tex) t.dispose();
      root.traverse((o) => { if ((o as Mesh).isMesh) ((o as Mesh).geometry as BufferGeometry).dispose(); });
    },
  };
}
