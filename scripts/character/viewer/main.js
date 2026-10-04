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
// alpha: false is REQUIRED: alpha-to-coverage writes the fragment alpha into the drawing buffer, and an alpha canvas
// then composites every brow, lash and hair-card edge against the page (pale brows, bright card edges; iteration 2)
// three r180 ALWAYS asks the browser for an alpha context (alpha: false only clears alpha to 1), so the context is made
// here with alpha: false and handed to three.
const canvas = document.createElement("canvas");
const context = canvas.getContext("webgl2", { alpha: false, antialias: qs.get("msaa") !== "0", preserveDrawingBuffer: true, powerPreference: "high-performance", depth: true, stencil: false });
const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: qs.get("msaa") !== "0", preserveDrawingBuffer: true });
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
let rig = null, look = null, eyeY = 1.47, lipY = 1.40;

const FRAMES = {
  bust: { dist: 1.05, dy: -0.07, fov: 22 },
  face: { dist: 0.62, dy: -0.025, fov: 20 },
  mouth: { dist: 0.42, dy: -0.06, fov: 16 },
};
function frame(name = "bust", yawDeg = 0) {
  const f = FRAMES[name];
  camera.fov = f.fov;
  camera.aspect = W / H;
  // the mouth camera is framed on the lip landmark, not on a fixed offset from the eyes (slate's mouth was cut off)
  const y0 = name === "mouth" ? lipY : eyeY + f.dy;
  camera.position.set(0, name === "mouth" ? y0 : eyeY + f.dy * 0.4, f.dist);
  camera.lookAt(0, y0, 0);
  camera.updateProjectionMatrix();
  pivot.rotation.y = (yawDeg * Math.PI) / 180;
}

window.TX = {
  async load(lookId, tier) {
    if (rig) { pivot.remove(rig.root); rig.dispose(); }
    look = await (await fetch(`/art/character/looks/${lookId}.json`)).json();
    rig = await loadTeacher(renderer, `/art/character/looks-out/${lookId}/${tier}.glb?v=${Date.now()}`, { tier, look: { iris: look.eyes.iris }, jawCeiling: look.jawCeiling ?? 1, ktxRaw: qs.get("ktxRaw") === "1" });
    pivot.add(rig.root);
    eyeY = rig.landmarks.eyeL.y;
    lipY = rig.landmarks.mouthFront.y - 0.003;   // the incisor front sits on the lip line
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
  // ---------------- G9: skin colour patches (cheek L/R, forehead, jaw L/R) from the CURRENT frame buffer
  setAlbedoGain(g) { rig.meshes.face.material.uniforms.uAlbedoGain.value.set(...g); },
  samplePatches(which = "skin") {
    const L = rig.landmarks, eL = L.eyeL, eR = L.eyeR, mid = eL.clone().add(eR).multiplyScalar(0.5);
    const V = (a, d) => a.clone().add(new THREE.Vector3(...d));
    const pts = which === "teeth" ? { teeth: V(L.mouthFront, [0, 0.003, 0]) } : {
      cheekL: V(eL, [0.006, -0.034, 0.012]), cheekR: V(eR, [-0.006, -0.034, 0.012]), forehead: V(mid, [0, 0.045, 0.012]),
      jawL: V(eL, [0.004, -0.066, 0.006]), jawR: V(eR, [-0.004, -0.066, 0.006]) };
    renderer.render(scene, camera);
    const gl = renderer.getContext();
    const out = {};
    const R = which === "teeth" ? 2 : 4;
    for (const [k, p] of Object.entries(pts)) {
      const w = p.clone(); pivot.localToWorld(w); w.project(camera);
      const x = Math.round((w.x * 0.5 + 0.5) * W), y = Math.round((w.y * 0.5 + 0.5) * H);
      const buf = new Uint8Array((2 * R + 1) ** 2 * 4);
      gl.readPixels(x - R, y - R, 2 * R + 1, 2 * R + 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      const px = [];
      for (let i = 0; i < buf.length; i += 4) px.push([buf[i], buf[i + 1], buf[i + 2]]);
      out[k] = { x, y: H - y, px };
    }
    return out;
  },
  // ---------------- lip-sync, arm "visemes": the aligned viseme timeline (scripts/character/align.py) drives H's viseme
  // morphs; Behaviour (head, brows, blinks, affect) and the Compositor run unchanged on top. The closure rule of §9 is
  // applied as written: during /p b m/ the smile scales to x0.4 and nothing opens the lips.
  async lipsyncVisemes(align, fps = 25, restSmile = 0.15) {
    const beh = new Behaviour({ seed: 7, band: "b2", faceStyle: look.faceStyle }), comp = new Compositor(look.jawCeiling ?? 0.85);
    beh.setState("speaking"); beh.arm("warm", 1);
    const n = Math.ceil((align.duration + 0.4) * fps);
    const ev = align.visemes;
    const isV = (v) => ["viseme_aa", "viseme_E", "viseme_I", "viseme_O", "viseme_U"].includes(v);
    const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const poses = []; let ppFrames = 0, ppClosed = 0, closure = 0;
    for (let f = 0; f < n; f++) {
      const t = f / fps;
      const w = {};
      for (const e of ev) {
        const pp = e.viseme === "viseme_PP";
        const a = pp ? 0.05 : 0.07, r = pp ? 0.06 : 0.08;
        const env = ss(e.t0 - a, e.t0 + 0.01, t) * (1 - ss(e.t1 - 0.01, e.t1 + r, t));
        const g = pp ? 1.0 : isV(e.viseme) ? 0.7 : 0.6;
        if (env > 0) w[e.viseme] = Math.max(w[e.viseme] || 0, env * g);
      }
      const wpp = w.viseme_PP || 0;
      for (const k of Object.keys(w)) if (k !== "viseme_PP") w[k] *= 1 - wpp;      // a bilabial wins the mouth
      let sum = 0; for (const v of Object.values(w)) sum += v;
      if (sum > 1) for (const k of Object.keys(w)) w[k] /= sum;
      const speaking = ev.some((e) => t > e.t0 - 0.2 && t < e.t1 + 0.3);
      if (!speaking && t > align.duration) beh.setState("idle");
      const b = beh.update(t, { herRms: speaking ? 0.05 : 0, herVoiced: speaking });
      const bs0 = { ...b.bs };
      closure += (1 - Math.exp(-(1 / fps) / (wpp > closure ? 0.06 : 0.12))) * (wpp - closure);
      bs0.mouthSmileLeft = ((bs0.mouthSmileLeft || 0) + restSmile * 0.5) * (1 - 0.6 * closure);
      bs0.mouthSmileRight = ((bs0.mouthSmileRight || 0) + restSmile * 0.5) * (1 - 0.6 * closure);
      const bs = { ...comp.compose(bs0, {}, 1 / fps), ...w };
      const inPP = ev.some((e) => e.viseme === "viseme_PP" && t >= e.t0 && t <= e.t1);
      if (inPP) { ppFrames++; const open = sum - wpp; if (wpp >= 0.6 && open <= 0.3 && (bs.jawOpen || 0) < 0.04) ppClosed++; }
      poses.push({ bs, head: b.head, gaze: b.gaze, lean: b.lean, breath: 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.25) });
    }
    window.__lip = poses;
    return { arm: "visemes", frames: n, duration: align.duration, bilabialFrames: ppFrames, bilabialClosed: ppClosed };
  },
  // ---------------- lip-sync, arm "rms": decode, run the real driver stack per video frame, keep poses
  async lipsyncPrepare(b64, fps = 25, restSmile = 0.15, lipOpts = {}, align = null) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ac = new OfflineAudioContext(1, 48000, 48000);
    const buf = await ac.decodeAudioData(bin.buffer);
    const x = buf.getChannelData(0), sr = buf.sampleRate;
    const lip = new LipDriver(sr, lipOpts), beh = new Behaviour({ seed: 7, band: "b2", faceStyle: look.faceStyle }), comp = new Compositor(lipOpts.jawCeiling ?? 0.85);
    let ppFrames = 0, ppClosed = 0;
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
      if (align && align.visemes.some((e) => e.viseme === "viseme_PP" && t >= e.t0 && t <= e.t1)) { ppFrames++; if ((bs.jawOpen || 0) < 0.04) ppClosed++; }
      poses.push({ bs, head: b.head, gaze: b.gaze, lean: b.lean, breath: 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.25) });
    }
    window.__lip = poses;
    return { arm: "rms", lipOpts, frames: n, duration: buf.duration, sampleRate: sr, jawMax, voicedFrames, closedVoicedFrames: closedVowel, bilabialFrames: ppFrames, bilabialClosed: ppClosed };
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
  get rig() { return rig; },
  THREE,
  EMOTIONS: Object.keys(EMOTIONS),
};
window.TX_READY = true;
