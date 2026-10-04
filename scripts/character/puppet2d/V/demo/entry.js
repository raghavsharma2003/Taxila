// Demo driver: the REAL behaviour.ts + compositor.ts + lip.ts (lipKeys) drive the arm V puppet through the unchanged
// HeadRig signature apply(bs, head, gaze, lean, breath). Bundled to dist/demo.js (IIFE) by build-demo.mjs.
//
// What the demo layer adds on top of the frozen modules (each is a proposal, not a behaviour.ts change):
//  * viseme_* + tongue keys from the forced-alignment track are merged AFTER the compositor (its anti-snap delta cap
//    would smear 80 ms phonemes); ?lip=jaw instead feeds the live-path lipKeys(jaw, wide, round) THROUGH it;
//  * listening nods and the head-turn sweep (Director cues); surprise / playful / thinking-lips ARKit mixes.
import { Behaviour, floorState } from "../../../../../src/avatar/behaviour.ts";
import { Compositor } from "../../../../../src/avatar/compositor.ts";
import { lipKeys } from "../../../../../src/avatar/lip.ts";
import { PuppetV } from "../rig.js";
import FEAT from "../features.json";
import { LINES, CUES, MIXES, MIX_HEAD, phonemes, visemesAt } from "./script.js";

const q = new URLSearchParams(location.search);
const lipMode = q.get("lip") === "jaw" ? "jaw" : "visemes";
const canvas = document.getElementById("c");
const dpr = Math.min(2, +(q.get("dpr") || window.devicePixelRatio || 1));
function size() {
  const box = canvas.parentElement.getBoundingClientRect();
  const s = Math.floor(Math.min(box.width, box.height));
  canvas.style.width = s + "px"; canvas.style.height = s + "px";
  canvas.width = Math.round(s * dpr); canvas.height = Math.round(s * dpr);
}
size();
window.addEventListener("resize", size);
const rig = new PuppetV(canvas, window.PUPPET_V, FEAT, { preserve: q.has("rec") });
const tracks = LINES.map(phonemes);
const beh = new Behaviour({ seed: 7, band: "b2" });
const comp = new Compositor(0.85);
const RESTSMILE = 0.25; // look runtime.json faceStyle.restSmile (stage3d adds restSmile*0.5 to each side)
const vis = {};
let ci = 0, label = "idle", mix = null, mixW = 0, mixPrev = null, preset = null, presetW = 0, sweepT0 = -1, nods = [];
let jawLive = 0, lastT = 0, endT = CUES[CUES.length - 1].t;
const capEl = document.getElementById("cap"), stEl = document.getElementById("st");

function step(t, dt) {
  while (ci < CUES.length && CUES[ci].t <= t) {
    const c = CUES[ci++];
    if (c.state) beh.setState(c.state);
    if (c.arm) beh.arm(c.arm, 1);
    if (c.label) label = c.label;
    if ("mix" in c) { mixPrev = mix; mix = c.mix; mixW = 0; }
    if ("preset" in c) preset = c.preset;
    if (c.nod) nods.push({ t0: t, a: c.nod });
    if (c.sweep) sweepT0 = t;
  }
  visemesAt(tracks, t, vis);
  let open = 0;
  for (const k in vis) if (k.startsWith("viseme_")) open = Math.max(open, vis[k] * ({ viseme_aa: 0.62, viseme_O: 0.4, viseme_E: 0.33, viseme_I: 0.19, viseme_U: 0.13, viseme_kk: 0.27, viseme_DD: 0.26 }[k] ?? 0.15));
  const speaking = open > 0.02;
  const herRms = speaking ? 0.02 + open * 0.12 : 0;
  const b = beh.update(t, { herRms, herVoiced: speaking, childLevel: label.startsWith("listening") ? 0.3 : 0 });
  const bsB = { ...b.bs, mouthSmileLeft: (b.bs.mouthSmileLeft ?? 0) + RESTSMILE * 0.5, mouthSmileRight: (b.bs.mouthSmileRight ?? 0) + RESTSMILE * 0.5 };
  let lip;
  if (lipMode === "jaw") {
    jawLive += (1 - Math.exp(-dt / 0.05)) * (open * 1.15 - jawLive);
    const wide = ((vis.viseme_E || 0) + (vis.viseme_I || 0) + (vis.viseme_SS || 0)) * 0.35, round = ((vis.viseme_O || 0) + (vis.viseme_U || 0)) * 0.35;
    lip = lipKeys({ jaw: Math.min(0.85, jawLive), wide, round });
  } else lip = { jawOpen: 0, mouthClose: 0 };
  const bs = comp.compose(bsB, lip, dt);
  if (lipMode !== "jaw") for (const k in vis) bs[k] = vis[k];
  // preset mixes (smooth in/out)
  mixW = Math.min(1, mixW + dt / 0.25);
  const head = [...b.head];
  const addMix = (name, w) => {
    if (!name || w <= 0) return;
    const M = MIXES[name];
    for (const k in M) bs[k] = Math.min(1, (bs[k] || 0) + M[k] * w);
    const h = MIX_HEAD[name] || [0, 0, 0];
    for (let i = 0; i < 3; i++) head[i] += h[i] * w;
  };
  addMix(mix, ss(mixW));
  addMix(mixPrev, 1 - ss(mixW));
  presetW += ((preset ? 1 : 0) - presetW) * (1 - Math.exp(-dt / 0.2));
  addMix(preset || "thinkLips", presetW);
  // listening nods: one damped cosine each
  for (const n of nods) {
    const e = t - n.t0;
    if (e > 0 && e < 0.9) head[0] += n.a * Math.sin((e / 0.9) * Math.PI) * Math.exp(-e * 1.5) * 1.6;
  }
  if (sweepT0 >= 0) {
    const e = t - sweepT0;
    if (e < 4) head[1] += 20 * Math.sin((e / 4) * Math.PI * 2) * Math.sin((e / 4) * Math.PI);
  }
  const breath = Math.sin(t * 2 * Math.PI * 0.25);
  rig.apply(bs, head, b.gaze, b.lean, breath);
  const t0 = performance.now();
  rig.render(dt);
  if (capEl) capEl.textContent = label;
  if (stEl) stEl.textContent = `${lipMode} · t ${t.toFixed(1)}s`;
  return performance.now() - t0;
}
function ss(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); }

// real-time loop, or a deterministic stepper for recording (?rec=1)
const perf = { intervals: [], work: [] };
window.DEMO = {
  rig, perf, endT,
  step(t, dt) { return step(t, dt); },
  lineText: LINES.map((l) => l.text),
};
if (!q.has("rec")) {
  let t0 = null, prev = null;
  const loop = (now) => {
    if (t0 === null) t0 = now;
    const t = ((now - t0) / 1000) % (endT + 0.5);
    if (t < lastT) { ci = 0; nods = []; sweepT0 = -1; mix = mixPrev = null; preset = null; }
    const dt = prev === null ? 1 / 60 : Math.min(0.1, (now - prev) / 1000);
    if (prev !== null) perf.intervals.push(now - prev);
    prev = now;
    lastT = t;
    const w0 = performance.now();
    step(t, dt);
    if (q.has("finish")) rig.gl.finish();
    perf.work.push(performance.now() - w0);
    if (perf.intervals.length > 4000) { perf.intervals.splice(0, 2000); perf.work.splice(0, 2000); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
window.DEMO_READY = true;
