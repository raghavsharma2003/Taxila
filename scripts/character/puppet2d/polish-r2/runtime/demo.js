// Arm P standalone demo: the stage3d tick contract (tap -> LipDriver -> floorState -> Behaviour -> Compositor ->
// rig.apply -> render) on the painted puppet, with a scripted lesson-moment timeline. src/avatar/{lip,behaviour,
// compositor}.ts are imported unchanged and bundled from the real source.
//   demo.html            realtime (audio plays in the talking scene)
//   demo.html?capture=1  deterministic: window.P2D.renderAt(t) renders the frame at t seconds (Playwright frames)
import { LipDriver, lipKeys } from "../../../../../src/avatar/lip.ts";
import { Behaviour, floorState } from "../../../../../src/avatar/behaviour.ts";
import { Compositor } from "../../../../../src/avatar/compositor.ts";
import { Puppet2DRig } from "./rig.js";
import { Expressions, EXPRESSIONS, Listener } from "./expr.js";

const Q = new URLSearchParams(location.search);
const CAPTURE = Q.has("capture");
const BASE = Q.get("base") || "./layers/";

// ---- timeline (seconds). The Director's expression beats go through the r2 expression emitters (expr.js: compositor
// presets for thinking, warm, delight, concern, surprise, playful, listening); behaviour.ts is unchanged.
const TALK_AT = 5.0;
const SCENES = [
  { id: "idle", t0: 0, t1: 5, status: null },
  { id: "talking", t0: TALK_AT, t1: 17.9, status: "speaking" },
  { id: "listening", t0: 17.9, t1: 23.4, status: "listening", preset: "listening", child: [9.2, 14.7] },
  { id: "thinking", t0: 23.4, t1: 27.4, status: "thinking", preset: "thinking" },
  { id: "warm", t0: 27.4, t1: 29.6, status: "your_turn", preset: "warm" },
  { id: "delight", t0: 29.6, t1: 32.0, status: "your_turn", preset: "delight" },
  { id: "concern", t0: 32.0, t1: 34.6, status: "your_turn", preset: "concern" },
  { id: "surprise", t0: 34.6, t1: 36.8, status: "your_turn", preset: "surprise" },
  { id: "playful", t0: 36.8, t1: 39.2, status: "your_turn", preset: "playful" },
  { id: "turns", t0: 39.2, t1: 45.2, status: null, turn: true },
];
export const DURATION = 45.2;

function sceneAt(t) {
  for (const s of SCENES) if (t >= s.t0 && t < s.t1) return s;
  return SCENES[SCENES.length - 1];
}
const env = (t, t0, t1, a = 0.35, r = 0.35) => Math.max(0, Math.min(1, (t - t0) / a, (t1 - t) / r));

// ---- visemes from the forced alignment (scripts/character/align.py) -> segments with coarticulation ramps
const RETRO_WORDS = { baanta: "t" };   // ट in बाँटा: the romanised alignment cannot tell dental from retroflex
function visemeTrack(align) {
  const segs = [];
  for (const w of align.words) {
    const units = align.visemes.filter((v) => v.word === w.word && v.t0 >= w.t0 - 0.35 && v.t0 <= w.t1 + 0.05);
    units.forEach((u, i) => {
      const next = units[i + 1];
      const t0 = u.t0, t1 = next ? next.t0 : Math.max(u.t1, w.t1) + 0.04;
      const tongue = {};
      if (u.viseme === "viseme_DD" || u.viseme === "viseme_nn") tongue.tongueTipUp = 0.8;
      if (u.letters === "l") Object.assign(tongue, { tongueTipUp: 0.8, tongueWide: 0.6 });
      if (RETRO_WORDS[w.word] && u.letters === RETRO_WORDS[w.word]) Object.assign(tongue, { tongueCurl: 0.9, tongueTipUp: 0 });
      segs.push({ t0, t1, v: u.viseme, tongue, letters: u.letters, word: w.word });
    });
  }
  return segs;
}
function visemesAt(segs, t) {
  const out = {};
  for (const s of segs) {
    if (t < s.t0 - 0.06 || t > s.t1 + 0.06) continue;
    const w = Math.max(0, Math.min(1, (t - (s.t0 - 0.05)) / 0.05, (s.t1 + 0.05 - t) / 0.05));
    out[s.v] = Math.max(out[s.v] ?? 0, w);
    for (const [k, v] of Object.entries(s.tongue)) out[k] = Math.max(out[k] ?? 0, v * w);
  }
  return out;
}

async function main() {
  const canvas = document.getElementById("c");
  const view = (Q.get("view") || "60,8,904").split(",").map(Number);
  if (Q.get("px")) canvas.style.width = Q.get("px") + "px";
  const rig = await Puppet2DRig.load(canvas, BASE, { dpr: CAPTURE ? 1 : Math.min(2, devicePixelRatio || 1), view, preserve: CAPTURE, clear: Q.get("bg") ? Q.get("bg").split(",").map((v) => +v / 255) : undefined });
  if (Q.get("dbg") || Q.get("only")) rig.debug = { tint: Q.get("dbg") === "tint", only: Q.get("only") ? Q.get("only").split(",") : null };
  const align = await fetch("./audio/voice.align.json").then((r) => r.json());
  const segs = visemeTrack(align);
  // decode the voice once; the "tap" window is read from the PCM at the line's clock (identical math to the live tap)
  const ab = await fetch("./audio/voice.mp3").then((r) => r.arrayBuffer());
  const actx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
  const audio = await actx.decodeAudioData(ab.slice(0));
  const pcm = audio.getChannelData(0), sr = audio.sampleRate;
  const lip = new LipDriver(sr);
  const behaviour = new Behaviour({ band: "b2", seed: 7, faceStyle: { smile: 0.7 } });
  const comp = new Compositor(0.85);
  const win = new Float32Array(1024);
  let lastT = -1, statusSince = 0, lastStatus = null, spoke = false, faceState = "idle";
  const exprs = new Expressions();
  const listener = new Listener();
  const stats = { work: [], intervals: [], frames: 0, rows: [] };

  function step(t) {
    const w0 = performance.now();
    const dt = lastT < 0 ? 1 / 60 : Math.min(0.25, t - lastT);
    lastT = t;
    const sc = sceneAt(t);
    if (sc.status !== lastStatus) { lastStatus = sc.status; statusSince = t; spoke = false; }
    // tap window from the PCM
    const ta = t - TALK_AT;
    const end = Math.floor(ta * sr);
    for (let i = 0; i < 1024; i++) {
      const j = end - 1024 + i;
      win[i] = j >= 0 && j < pcm.length ? pcm[j] : 0;
    }
    const lf = lip.step(win, t);
    if (lf.speaking) spoke = spoke || t - statusSince > 0.3;
    const st = floorState({ status: sc.status, tapSpeaking: lf.speaking, silenceMs: lf.silenceMs, spokeSinceStatus: spoke });
    faceState = st;
    behaviour.setState(st);
    const b = behaviour.update(t, { herRms: lf.rms, herVoiced: lf.voiced, childLevel: sc.id === "listening" ? 0.4 : 0 });
    const beh = { ...b.bs };
    const restSmile = 0.0;
    // scripted expression beat (demo Director)
    const head = [...b.head];
    // Director beats -> the expression emitters (compositor presets, expr.js)
    if (sc.preset && exprs.sceneId !== sc.id) { exprs.sceneId = sc.id; exprs.emote(sc.preset, t, { hold: Math.max(0.2, sc.t1 - sc.t0 - 0.9) }); }
    if (!sc.preset) exprs.sceneId = null;
    {
    }
    // listening backchannel from the REAL listening state: the child's mic level (here: a level track read from a
    // recorded voice segment standing in for the child, so the nods land on real phrase pauses, not a script)
    let childLevel = 0;
    if (sc.child) {
      const ct = sc.child[0] + (t - sc.t0);
      const j0 = Math.floor(ct * sr);
      let acc = 0;
      for (let i = 0; i < 1024; i++) { const v = pcm[j0 - 1024 + i] || 0; acc += v * v; }
      childLevel = Math.min(1, Math.sqrt(acc / 1024) * 9);
    }
    const ls = listener.update(t, dt, st === "listening", childLevel);
    head[0] += ls.pitch;
    beh.mouthSmileLeft = (beh.mouthSmileLeft ?? 0) + ls.smile;
    beh.mouthSmileRight = (beh.mouthSmileRight ?? 0) + ls.smile;
    if (sc.turn) {
      const u = t - sc.t0;
      const yaw = u < 1.5 ? -20 * Math.sin((u / 1.5) * Math.PI / 2) : u < 4.0 ? -20 + 40 * (0.5 - 0.5 * Math.cos(((u - 1.5) / 2.5) * Math.PI)) : 20 * Math.cos(((u - 4.0) / 2.0) * Math.PI / 2);
      head[1] = yaw;
      head[0] += u > 4.6 && u < 5.6 ? 8 * Math.sin(((u - 4.6) / 1.0) * Math.PI) : 0;
    }
    const lipL = lipKeys(lf);
    // the expression layer mixes into behaviour's frame; an expression's jawOpen belongs to the lip layer
    const gaze = [...b.gaze];
    exprs.apply(t, dt, beh, head, gaze, lipL);
    const bs = comp.compose(beh, lipL, dt);
    // visemes and tongue keys bypass the compositor's 0.06/frame anti-snap (they are lip keys; see notes)
    if (sc.id === "talking") Object.assign(bs, visemesAt(segs, ta));
    const breath = Math.sin(t * 2 * Math.PI * 0.25);
    rig.frame(bs, head, gaze, b.lean, breath);
    const work = performance.now() - w0;
    stats.work.push(work);
    stats.frames++;
    if (sc.id === "talking") stats.rows.push({ t: +ta.toFixed(3), row: rig.mouth.row, name: rig.mouth.name, vis: Object.keys(bs).filter((k) => k.startsWith("viseme_") && bs[k] > 0.5) });
    return { t, scene: sc.id, state: faceState, head, gaze, mouth: rig.mouth.name, work };
  }

  window.P2D = {
    duration: DURATION, scenes: SCENES, stats, rig, listener, EXPRESSIONS,
    renderAt: (t) => step(t),
    pose: (spec) => {  // a fixed pose for the frames sheet: {bs, head, gaze} or {expr: name} (full-level preset)
      rig.lastT = -1;
      let bs = { ...(spec.bs || {}) }, head = [...(spec.head || [0, 0, 0])], gz = [...(spec.gaze || [0, 0])];
      if (spec.expr) {
        const P = EXPRESSIONS[spec.expr];
        bs = { mouthSmileLeft: 0.06, mouthSmileRight: 0.06, ...bs };
        for (const [k, v] of Object.entries(P.bs)) bs[k] = v < 0 ? 0 : Math.max(bs[k] ?? 0, v);
        head = head.map((h, i) => h + P.head[i]);
        gz = [...P.gaze];
      }
      for (let i = 0; i < 6; i++) { rig.clock = 1000 + i / 60; rig.resetPhysics(); rig.frame(bs, head, gz, spec.lean || 0, 0); }
      return rig.mouth.name;
    },
  };
  if (CAPTURE) {
    window.P2D.ready = true;
    return;
  }
  // realtime
  const player = new Audio("./audio/voice.mp3");
  let started = false, t0 = performance.now() - (+(Q.get("start") || 0)) * 1000, lastNow = -1;
  const hud = document.getElementById("hud");
  const loop = (now) => {
    const t = ((now - t0) / 1000) % DURATION;
    if (lastNow > 0) stats.intervals.push(now - lastNow);
    lastNow = now;
    rig.clock = t + Math.floor((now - t0) / 1000 / DURATION) * DURATION;
    if (t < lastT) { lastT = -1; }
    if (!started && t >= TALK_AT && t < TALK_AT + 12) { started = true; player.currentTime = Math.max(0, t - TALK_AT); player.play().catch(() => {}); }
    if (t < TALK_AT) started = false;
    const r = step(t);
    if (hud && stats.frames % 15 === 0) {
      const iv = stats.intervals.slice(-120);
      const fps = iv.length ? 1000 / (iv.reduce((a, b) => a + b, 0) / iv.length) : 0;
      const w = stats.work.slice(-120).sort((a, b) => a - b);
      hud.textContent = `${r.scene} · ${r.state} · mouth ${r.mouth} · ${fps.toFixed(0)} fps · work p95 ${(w[Math.floor(w.length * 0.95)] || 0).toFixed(2)} ms · ${rig.stats().meshes} draws`;
    }
    requestAnimationFrame(loop);
  };
  document.getElementById("start")?.addEventListener("click", () => { t0 = performance.now(); started = false; lastT = -1; });
  requestAnimationFrame(loop);
  window.P2D.ready = true;
}
main().catch((e) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="color:red">${e.stack}</pre>`);
  window.P2D = { error: String(e) };
});
