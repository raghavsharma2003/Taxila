// Evidence harness page (headless Chromium via Playwright). Exposes window.TX for scripts/character/render.mjs and
// measure.mjs. The lip-sync clip runs the REAL M0 driver stack from src/avatar (LipDriver -> Behaviour ->
// Compositor), fed from the decoded TTS waveform frame by frame, then drives this GLB rig.
import * as THREE from "three";
import { loadTeacher } from "./rig.js";
import { EMOTIONS, STATES, emotionPose } from "./presets.js";
import { LipDriver, lipKeys } from "/src/avatar/lip.ts";
import { Behaviour } from "/src/avatar/behaviour.ts";
import { Compositor } from "/src/avatar/compositor.ts";

const qs = new URLSearchParams(location.search);
const W = +(qs.get("w") || 720), H = +(qs.get("h") || 900);
const renderer = new THREE.WebGLRenderer({ antialias: qs.get("msaa") !== "0", preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(+(qs.get("dpr") || 1));
renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#d9d2c7").convertSRGBToLinear();
const camera = new THREE.PerspectiveCamera(20, W / H, 0.05, 20);
const pivot = new THREE.Group();
scene.add(pivot);
let rig = null, look = null, eyeY = 1.47;

const FRAMES = {
  bust: { dist: 1.05, dy: -0.07, fov: 22 },
  face: { dist: 0.62, dy: -0.025, fov: 20 },
  mouth: { dist: 0.34, dy: -0.06, fov: 18 },
};
function frame(name = "bust", yawDeg = 0) {
  const f = FRAMES[name];
  camera.fov = f.fov;
  camera.aspect = W / H;
  camera.position.set(0, eyeY + f.dy * 0.4, f.dist);
  camera.lookAt(0, eyeY + f.dy, 0);
  camera.updateProjectionMatrix();
  pivot.rotation.y = (yawDeg * Math.PI) / 180;
}

window.TX = {
  async load(lookId, tier) {
    if (rig) { pivot.remove(rig.root); rig.dispose(); }
    look = await (await fetch(`/art/character/looks/${lookId}.json`)).json();
    rig = await loadTeacher(renderer, `/public/assets/teacher/${lookId}/${tier}.glb?v=${Date.now()}`, { tier, look: { iris: look.eyes.iris } });
    pivot.add(rig.root);
    eyeY = rig.landmarks.eyeL.y;
    frame("bust", 0);
    rig.apply({}, [0, 0, 0], [0, 0], 0, 0);
    renderer.compile(scene, camera);
    return { loadMs: rig.loadMs, ...rig.stats() };
  },
  frame,
  pose(p) { rig.apply(p.bs || {}, p.head || [0, 0, 0], p.gaze || [0, 0], p.lean || 0, p.breath || 0, { flush: p.flush || 0 }); },
  emotion(name, i = 1) {
    const e = emotionPose(name, i, look.faceStyle.asym);
    return e;
  },
  state(name) {
    const s = STATES[name];
    const e = emotionPose(s.affect[0], s.affect[1], look.faceStyle.asym);
    const bs = { ...e.bs, ...(s.extra || {}) };
    if (s.viseme) bs[s.viseme[0]] = s.viseme[1];
    return { bs, head: s.head || e.head, gaze: s.gaze || e.gaze, lean: s.lean ?? e.lean, breath: s.breath || 0, flush: e.flush };
  },
  render() {
    renderer.render(scene, camera);
    const i = renderer.info.render;
    return { calls: i.calls, triangles: i.triangles };
  },
  // ---------------- lip-sync: decode, run the real driver stack per video frame, keep poses
  async lipsyncPrepare(b64, fps = 25, restSmile = 0.15) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ac = new OfflineAudioContext(1, 48000, 48000);
    const buf = await ac.decodeAudioData(bin.buffer);
    const x = buf.getChannelData(0), sr = buf.sampleRate;
    const lip = new LipDriver(sr), beh = new Behaviour({ seed: 7, band: "b2", faceStyle: look.faceStyle }), comp = new Compositor();
    beh.setState("speaking");
    beh.arm("warm", 1);
    const n = Math.ceil((buf.duration + 0.4) * fps);
    const poses = [];
    const win = new Float32Array(2048);
    let jawMax = 0, closedVowel = 0, voicedFrames = 0;
    for (let f = 0; f < n; f++) {
      const t = f / fps;
      const end = Math.floor(t * sr);
      for (let k = 0; k < 2048; k++) { const idx = end - 2048 + k; win[k] = idx >= 0 && idx < x.length ? x[idx] : 0; }
      const lf = lip.step(win, t);
      if (!lf.speaking && f > 3 && t > buf.duration) beh.setState("idle");
      const b = beh.update(t, { herRms: lf.rms, herVoiced: lf.voiced });
      const bs0 = { ...b.bs };
      bs0.mouthSmileLeft = (bs0.mouthSmileLeft || 0) + restSmile * 0.5;
      bs0.mouthSmileRight = (bs0.mouthSmileRight || 0) + restSmile * 0.5;
      const bs = comp.compose(bs0, lipKeys(lf), 1 / fps);
      jawMax = Math.max(jawMax, bs.jawOpen || 0);
      if (lf.voiced) { voicedFrames++; if ((bs.jawOpen || 0) < 0.04) closedVowel++; }
      poses.push({ bs, head: b.head, gaze: b.gaze, lean: b.lean, breath: 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.25) });
    }
    window.__lip = poses;
    return { frames: n, duration: buf.duration, sampleRate: sr, jawMax, voicedFrames, closedVoicedFrames: closedVowel };
  },
  lipFrame(i) { const p = window.__lip[i]; rig.apply(p.bs, p.head, p.gaze, p.lean, p.breath); },
  // ---------------- measurement: uncapped frames, each followed by a 1-px readPixels (gl.finish does not block in ANGLE)
  measure(n = 90, animate = true) {
    const gl = renderer.getContext();
    const px = new Uint8Array(4);
    const ts = [];
    for (let f = 0; f < n; f++) {
      if (animate) rig.apply({ jawOpen: 0.3 + 0.3 * Math.sin(f * 0.7), mouthSmileLeft: 0.3, mouthSmileRight: 0.3, eyeBlinkLeft: f % 30 < 3 ? 1 : 0, eyeBlinkRight: f % 30 < 3 ? 1 : 0, browInnerUp: 0.2 }, [Math.sin(f * 0.1) * 3, Math.sin(f * 0.07) * 4, 0], [Math.sin(f * 0.2) * 6, 0], 0, 0.5);
      const t0 = performance.now();
      renderer.render(scene, camera);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      ts.push(performance.now() - t0);
    }
    const s = [...ts].sort((a, b) => a - b);
    const i = renderer.info.render;
    return { p50: s[Math.floor(n * 0.5)], p90: s[Math.floor(n * 0.9)], mean: ts.reduce((a, b) => a + b, 0) / n, calls: i.calls, triangles: i.triangles,
      gpu: gl.getParameter(gl.getExtension("WEBGL_debug_renderer_info")?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER) };
  },
  debug() {
    const b = new THREE.Box3().setFromObject(pivot, true);
    const i = this.render();
    const progs = renderer.info.programs.map((p) => p.name || p.cacheKey?.slice(0, 40));
    const nodes = [];
    rig.root.traverse((o) => nodes.push(`${o.type}:${o.name} p=${o.position.toArray().map((v) => v.toFixed(3))} s=${o.scale.x.toFixed(2)} r=${o.rotation.toArray().slice(0, 3).map((v) => v.toFixed(2))}`));
    return { box: [b.min.toArray(), b.max.toArray()], cam: camera.position.toArray(), eyeY, calls: i.calls, tris: i.triangles, progs, nodes: nodes.slice(0, 30) };
  },
  EMOTIONS: Object.keys(EMOTIONS),
};
window.TX_READY = true;
