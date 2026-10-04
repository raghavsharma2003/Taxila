// Style C evidence page (headless Chromium via Playwright, SwiftShader). Loads a teacher GLB, swaps every material for
// TaxilaToon, exposes window.TX = { load, pose, view, render } for scripts/character/stylised/r2/render3.mjs.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { toonFor } from "./toon.js";

const qs = new URLSearchParams(location.search);
const W = +(qs.get("w") || 1024), H = +(qs.get("h") || 1024);
const canvas = document.createElement("canvas");
const context = canvas.getContext("webgl2", { alpha: false, antialias: true, preserveDrawingBuffer: true, depth: true, stencil: false });
const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(252 / 255, 229 / 255, 189 / 255).convertSRGBToLinear();
const camera = new THREE.PerspectiveCamera(14, W / H, 0.05, 20);
const pivot = new THREE.Group();
scene.add(pivot);
let root = null, morphMeshes = [], bones = {}, eyeMats = [], hairMats = [], tier = "H";
const ktx2 = new KTX2Loader().setTranscoderPath("/node_modules/three/examples/jsm/libs/basis/").detectSupport(renderer);
const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);

// views in glTF coordinates (Blender x, z, -y): target, frame height (m), yaw (deg, + = camera to her left), pitch
const VIEWS = {
  front: { t: [-0.0047, -0.0211, -0.02], h: 0.323, yaw: 0 },
  q3L: { t: [0, -0.0211, -0.03], h: 0.323, yaw: 35 },
  q3R: { t: [0, -0.0211, -0.03], h: 0.323, yaw: -35 },
  profile: { t: [0, -0.0211, -0.05], h: 0.323, yaw: 90 },
  back: { t: [0, -0.0211, -0.05], h: 0.323, yaw: 180 },
  face: { t: [0, -0.012, 0.02], h: 0.21, yaw: 0 },
  close: { t: [0, -0.018, 0.02], h: 0.17, yaw: 0 },
  eyes: { t: [0, -0.006, 0.02], h: 0.12, yaw: 0 },
  mouth: { t: [0, -0.044, 0.03], h: 0.075, yaw: 0 },
  bust: { t: [0, -0.05, -0.02], h: 0.42, yaw: 0 },
  turn: { t: [0, -0.0211, -0.035], h: 0.323, yaw: 0 },
  temple: { t: [0.05, 0.0, 0.0], h: 0.13, yaw: 55 },
};
function view(name, yawOverride) {
  const v = typeof name === "string" ? VIEWS[name] : name;
  const yaw = ((yawOverride ?? v.yaw) * Math.PI) / 180, pitch = ((v.pitch || 0) * Math.PI) / 180;
  const d = v.h / (2 * Math.tan((camera.fov * Math.PI) / 360));
  const t = new THREE.Vector3(...v.t);
  camera.position.set(t.x + Math.sin(yaw) * Math.cos(pitch) * d, t.y + Math.sin(pitch) * d, t.z + Math.cos(yaw) * Math.cos(pitch) * d);
  camera.lookAt(t);
  camera.updateProjectionMatrix();
}

window.TX = {
  async load(url, t = "H") {
    tier = t;
    if (root) pivot.remove(root);
    const g = await loader.loadAsync(url + "?v=" + Date.now());
    root = g.scene; morphMeshes = []; bones = {}; eyeMats = []; hairMats = [];
    const missing = new Set();
    root.traverse((o) => {
      if (o.isBone) bones[o.name] = o;
      if (o.isMesh) {
        const src = o.material;
        const m = toonFor(src.name, src, tier);
        if (!m) { missing.add(src.name); return; }
        o.material = m; o.userData.srcMat = src.name;
        o.frustumCulled = false;
        if (src.name === "eye" || src.name === "cornea") eyeMats.push({ m, mesh: o });
        if (src.name === "cornea") o.renderOrder = 2;
        if (src.name === "hair") hairMats.push(m);
        if (o.morphTargetDictionary) morphMeshes.push(o);
      }
    });
    pivot.add(root);
    root.updateMatrixWorld(true);
    let tris = 0;
    root.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    window.TX.pose({});
    return { tris, missing: [...missing], morphs: morphMeshes.length ? Object.keys(morphMeshes[0].morphTargetDictionary).length : 0, bones: Object.keys(bones) };
  },
  pose(p) {
    const bs = p.bs || {};
    for (const m of morphMeshes) {
      const d = m.morphTargetDictionary;
      m.morphTargetInfluences.fill(0);
      for (const [k, v] of Object.entries(bs)) if (k in d) m.morphTargetInfluences[d[k]] = v;
    }
    const [gy, gp] = p.gaze || [0, 0];
    for (const n of ["LeftEye", "RightEye"]) {
      const b = bones[n];
      if (!b) continue;
      if (!b.userData.q0) b.userData.q0 = b.quaternion.clone();
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((-gp * Math.PI) / 180, (gy * Math.PI) / 180, 0, "YXZ"));
      // bone frames come from Blender (bone axis along -Y Blender); rotate in the parent's frame
      b.quaternion.copy(b.userData.q0);
      const parentQ = new THREE.Quaternion(); b.parent.getWorldQuaternion(parentQ);
      const wq = parentQ.clone().invert().multiply(q).multiply(parentQ);
      b.quaternion.premultiply(wq);
    }
    const [hy, hp, hr] = p.head || [0, 0, 0];
    if (bones.Head) {
      const b = bones.Head;
      if (!b.userData.q0) b.userData.q0 = b.quaternion.clone();
      b.quaternion.copy(b.userData.q0).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((hp * Math.PI) / 180, (hy * Math.PI) / 180, (hr * Math.PI) / 180)));
    }
    root.updateMatrixWorld(true);
    for (const hm of hairMats) { const hw = new THREE.Vector3(); if (bones.Head) { bones.Head.getWorldPosition(hw); } hm.uniforms.uEyeC.value.set(hw.x + 0.015, hw.y + 0.02, hw.z - 0.047); }  // bun attach (Blender 0.015, 0.095, -0.04)
    for (const n of ["LeftEye", "RightEye"]) {
      const b = bones[n]; if (!b) continue;
      const c = new THREE.Vector3(); b.getWorldPosition(c);
      for (const { m, mesh } of eyeMats) {
        // each eye mesh is bound to one bone: pick by side
        const bx = mesh.geometry.boundingBox || (mesh.geometry.computeBoundingBox(), mesh.geometry.boundingBox);
        const side = (bx.min.x + bx.max.x) > 0 ? "LeftEye" : "RightEye";
        if (side === n) m.uniforms.uEyeC.value.copy(c);
      }
    }
  },
  wire(on = true) {
    root.traverse((o) => {
      if (o.isMesh && o.material.uniforms && o.material.uniforms.uKind && o.material.uniforms.uKind.value === 0) {
        if (on && !o.userData.wire) {
          const w = new THREE.LineSegments(new THREE.WireframeGeometry(o.geometry), new THREE.LineBasicMaterial({ color: 0x202020 }));
          o.parent.add(w); o.userData.wire = w;
        }
      }
    });
  },
  hide(names) { root.traverse((o) => { if (o.isMesh && o.userData.srcMat && names.includes(o.userData.srcMat)) o.visible = false; }); },
  view,
  render() { renderer.render(scene, camera); return renderer.info.render.triangles; },
  bones() { return Object.fromEntries(Object.entries(bones).map(([k, b]) => { const v = new THREE.Vector3(); b.getWorldPosition(v); return [k, v.toArray()]; })); },
};
window.TX_READY = true;
