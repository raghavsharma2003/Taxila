// render.js — the avatar render loop used by BOTH arms (main thread and OffscreenCanvas worker).
// Simulates TalkingHead's per-frame work: ~14 active ARKit morphs, blink, head/neck bone motion, 30 fps cap.
import * as THREE from "/three/build/three.module.js";
import { GLTFLoader } from "/three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "/three/examples/jsm/libs/meshopt_decoder.module.js";

export async function start(canvas, { avatar, w, h, dpr, seconds, fpsCap = 30, getLip, log }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(25, w / h, 0.1, 20); cam.position.set(0, 1.62, 1.1); cam.lookAt(0, 1.6, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5)); const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(1, 2, 2); scene.add(dl);
  const t0 = performance.now();
  let gltf;
  if (avatar.endsWith("/tiny")) { // scheduling probe: 14 morph targets on a 2k-vertex sphere, negligible raster cost
    const g = new THREE.SphereGeometry(0.1, 48, 40); g.morphAttributes.position = [];
    const dict = {}; const nm = ["jawOpen","mouthClose","mouthFunnel","mouthPucker","mouthStretchLeft","mouthStretchRight","mouthSmileLeft","mouthSmileRight","browInnerUp","eyeBlinkLeft","eyeBlinkRight","cheekSquintLeft","cheekSquintRight","mouthRollLower"];
    nm.forEach((n, i) => { const a = g.attributes.position.clone(); for (let j = 0; j < a.count; j++) a.setY(j, a.getY(j) * (1 + 0.02 * (i + 1))); g.morphAttributes.position.push(a); dict[n] = i; });
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xc08060 })); m.position.set(0, 1.6, 0); m.updateMorphTargets(); m.morphTargetDictionary = dict;
    const sc = new THREE.Group(); sc.add(m); gltf = { scene: sc };
  } else gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(avatar);
  const loadMs = performance.now() - t0;
  scene.add(gltf.scene);
  const morphMeshes = []; const bones = {};
  gltf.scene.traverse((o) => { if (o.morphTargetDictionary) morphMeshes.push(o); if (o.isBone) bones[o.name] = o; });
  const names = ["jawOpen", "mouthClose", "mouthFunnel", "mouthPucker", "mouthStretchLeft", "mouthStretchRight", "mouthSmileLeft", "mouthSmileRight",
    "browInnerUp", "eyeBlinkLeft", "eyeBlinkRight", "cheekSquintLeft", "cheekSquintRight", "mouthRollLower"];
  const head = bones.Head || Object.values(bones).find((b) => /head/i.test(b.name)); const neck = bones.Neck || Object.values(bones).find((b) => /neck/i.test(b.name));
  // first frame compiles shaders: time it separately
  const c0 = performance.now(); renderer.render(scene, cam); const firstFrameMs = performance.now() - c0;
  const info = { loadMs, firstFrameMs, tris: renderer.info.render.triangles, calls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
  const frames = []; const raf = (globalThis.requestAnimationFrame || self.requestAnimationFrame).bind(globalThis);
  let last = 0; const end = performance.now() + seconds * 1000;
  return new Promise((resolve) => {
    function loop(now) {
      if (now > end) { resolve({ info, frames }); return; }
      raf(loop);
      if (now - last < 1000 / fpsCap - 2) return; // TalkingHead-style cap
      const s = performance.now(); const t = s / 1000; const lip = getLip ? getLip() : 0.5 + 0.5 * Math.sin(t * 9);
      for (const m of morphMeshes) { const d = m.morphTargetDictionary, inf = m.morphTargetInfluences;
        for (let i = 0; i < names.length; i++) { const k = d[names[i]]; if (k !== undefined) inf[k] = names[i] === "jawOpen" ? lip * 0.5 : (0.15 + 0.15 * Math.sin(t * (i + 1)));}
        const bl = (t % 4) < 0.15 ? 1 : 0; if (d.eyeBlinkLeft !== undefined) { inf[d.eyeBlinkLeft] = bl; inf[d.eyeBlinkRight] = bl; } }
      if (head) head.rotation.set(0.05 * Math.sin(t * 0.7), 0.08 * Math.sin(t * 0.5), 0.03 * Math.sin(t * 1.1));
      if (neck) neck.rotation.y = 0.04 * Math.sin(t * 0.3);
      renderer.render(scene, cam);
      const e = performance.now(); frames.push([now, e - s]); last = now;
    }
    raf(loop);
  });
}
