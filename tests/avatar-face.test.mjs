// The 3D tutor (avatar-m0), pure parts: the lip driver, the floor FSM, the behaviour invariants (AVATAR.md §4.6
// subset), the compositor rules (§4.5), tiers and the governor (§6), and the audio-floor contract (§2.5 tests 1, 3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { LipDriver, LipRing, lipKeys, rmsOf } from "../src/avatar/lip.ts";
import { Behaviour, floorState, springStep, SPRING_PEAK_PER_V, MUTUAL_GAZE_MAX_S, EYE_YAW_MAX, EYE_PITCH_DOWN, EYE_PITCH_UP } from "../src/avatar/behaviour.ts";
import { Compositor, MAX_DELTA } from "../src/avatar/compositor.ts";
import { Governor, longFrameMs, probeVerdict, staticTier, tierOverride } from "../src/avatar/tier.ts";
import { TeacherTap, windowFromLevel } from "../src/avatar/tap.ts";
import { LevelMeter } from "../src/lesson/level.ts";
import { mouthCell } from "../src/avatar/plateMouth.ts";

const SR = 48000;
/** A 2048-sample window of a voiced vowel-ish signal at amplitude a. */
function voiced(a, f0 = 210, bright = 0.5) {
  const b = new Float32Array(2048);
  for (let i = 0; i < b.length; i++) { let s = 0; for (let h = 1; h <= 10; h++) s += Math.sin((2 * Math.PI * f0 * h * i) / SR) / h * (h < 4 ? 1 : bright * 1.4); b[i] = a * s; }
  return b;
}
const silent = () => new Float32Array(2048);

// ───────────── lip driver ─────────────

test("lip: silence keeps the jaw shut and her floor off", () => {
  const d = new LipDriver(SR);
  let f;
  for (let k = 0; k < 30; k++) f = d.step(silent(), k / 30);
  assert.equal(f.jaw, 0);
  assert.equal(f.speaking, false);
  assert.equal(f.voiced, false);
});

test("lip: onset after 2 voiced frames, offset only after ≥ 250 ms of silence (§3.1 VAD)", () => {
  const d = new LipDriver(SR);
  assert.equal(d.step(voiced(0.08), 0).speaking, false);
  assert.equal(d.step(voiced(0.08), 1 / 30).speaking, true);
  let t = 2 / 30;
  for (let k = 0; k < 10; k++, t += 1 / 30) d.step(voiced(0.08), t);
  // 200 ms of silence: still her floor (a pause); 300 ms: released
  let f;
  for (let k = 0; k < 6; k++, t += 1 / 30) f = d.step(silent(), t);
  assert.equal(f.speaking, true, `pause of ${f.silenceMs.toFixed(0)} ms is not an offset`);
  for (let k = 0; k < 4; k++, t += 1 / 30) f = d.step(silent(), t);
  assert.equal(f.speaking, false);
  assert.ok(f.silenceMs >= 250);
});

test("lip: the jaw opens on voice and closes on silence within ~150 ms (τ 50 ms)", () => {
  const d = new LipDriver(SR);
  let t = 0, f;
  for (let k = 0; k < 20; k++, t += 1 / 30) f = d.step(voiced(0.1), t);
  assert.ok(f.jaw > 0.4, `open jaw ${f.jaw}`);
  for (let k = 0; k < 5; k++, t += 1 / 30) f = d.step(silent(), t);
  assert.ok(f.jaw < 0.05, `closed jaw ${f.jaw}`);
});

test("lip: level-normalised: the same speech 10 dB quieter converges to a similar jaw (GR-9)", () => {
  const run = (gain) => {
    const d = new LipDriver(SR);
    const jaws = [];
    for (let k = 0; k < 600; k++) { // 20 s of syllables: 4 frames voiced, 3 silent
      const on = k % 7 < 4;
      const f = d.step(on ? voiced(0.1 * gain * (0.7 + 0.3 * Math.sin(k))) : silent(), k / 30);
      if (k > 450 && on) jaws.push(f.jaw);
    }
    return jaws.reduce((a, b) => a + b, 0) / jaws.length;
  };
  const loud = run(1), quiet = run(0.316);
  assert.ok(Math.abs(loud - quiet) < 0.12, `loud ${loud.toFixed(3)} vs quiet ${quiet.toFixed(3)}`);
  assert.ok(quiet > 0.2, "a quieter received voice still opens the mouth");
});

test("lip: mouthClose never exceeds jawOpen; shapes are hints below the jaw", () => {
  const d = new LipDriver(SR);
  for (let k = 0; k < 60; k++) {
    const f = d.step(k % 3 ? voiced(0.09, 220, k % 2) : silent(), k / 30);
    const L = lipKeys(f);
    assert.ok(L.mouthClose <= L.jawOpen + 1e-9);
    assert.ok(f.wide <= 0.35 + 1e-9 && f.round <= 0.35 + 1e-9, "shapeGain caps the shape hint");
  }
});

test("lip ring: reads the frame at t − faceDelay; flush empties it", () => {
  const r = new LipRing(8);
  for (let k = 0; k < 8; k++) r.push({ t: k * 0.05, rms: 0, jaw: k, voiced: false, speaking: false, silenceMs: 0, wide: 0, round: 0 });
  assert.equal(r.read(0.35, 0).jaw, 7);
  assert.equal(r.read(0.35, 150).jaw, 4);
  r.flush();
  assert.equal(r.read(1, 0), null);
});

test("amplitude fallback: a meter level maps back to the RMS the meter heard", () => {
  const b = new Float32Array(2048);
  const rms = rmsOf(windowFromLevel(0.8, b), 2048); // level 0.8 = -20 dBFS
  assert.ok(Math.abs(20 * Math.log10(rms) - -20) < 0.5);
  assert.equal(rmsOf(windowFromLevel(0, b)), 0);
});

// ───────────── floor FSM (§3.5, §4.1) ─────────────

test("floorState: the tap is canonical for her speech; the child talking wins; status is the cross-check", () => {
  const F = (status, tapSpeaking, silenceMs = 0, spokeSinceStatus = false) => floorState({ status, tapSpeaking, silenceMs, spokeSinceStatus });
  assert.equal(F("listening", true), "listening");
  assert.equal(F("thinking", true), "speaking", "her audible onset beats a lagging status");
  assert.equal(F("speaking", false, 400), "speaking", "a pause inside her turn");
  assert.equal(F("speaking", false, 1300), "your_turn", "≥ 1.2 s silence without the end hint");
  assert.equal(F("thinking", false, 0, false), "thinking");
  assert.equal(F("your_turn", false), "your_turn");
  assert.equal(F(null, false), "idle");
});

test("contract 2 (events suppressed): with status stuck at 'thinking' the face still goes speaking → your_turn from the tap", () => {
  // drive LipDriver + floorState as Stage3D does, with no status changes at all
  const d = new LipDriver(SR);
  let spoke = false, t = 0;
  const states = [];
  for (let k = 0; k < 90; k++, t += 1 / 30) {
    const on = k >= 15 && k < 45; // she speaks from 0.5 s to 1.5 s
    const f = d.step(on ? voiced(0.09) : silent(), t);
    if (f.speaking) spoke = true;
    states.push({ t, s: floorState({ status: "thinking", tapSpeaking: f.speaking, silenceMs: f.silenceMs, spokeSinceStatus: spoke }) });
  }
  const firstSpeak = states.find((x) => x.s === "speaking").t;
  const firstTurn = states.find((x) => x.s === "your_turn").t;
  assert.ok(firstSpeak - 0.5 <= 0.3 + 1e-9, `speaking ${((firstSpeak - 0.5) * 1000).toFixed(0)} ms after the audible onset (bar 300 ms)`);
  assert.ok(firstTurn - 1.5 <= 0.3 + 1e-9, `your_turn ${((firstTurn - 1.5) * 1000).toFixed(0)} ms after her offset (bar 300 ms)`);
});

// ───────────── behaviour invariants (§4.6 subset) ─────────────

function simulate({ state, seconds, fps = 30, opts = {}, onT } = {}) {
  const b = new Behaviour({ band: "b2", seed: 7, ...opts });
  const frames = [];
  for (let k = 0; k < seconds * fps; k++) {
    const t = 1 + k / fps;
    onT?.(b, t);
    if (state) b.setState(typeof state === "function" ? state(t) : state);
    frames.push(b.update(t, { herRms: 0, herVoiced: false }));
  }
  return { b, frames };
}

test("I-blink: per-state rates hold (idle ≈ 17/min, speaking ≈ 26/min) and both lids always move together", () => {
  for (const [state, rate] of [["idle", 17], ["speaking", 26]]) {
    const { frames } = simulate({ state, seconds: 600 });
    let blinks = 0, prev = 0;
    for (const f of frames) {
      assert.equal(f.bs.eyeBlinkLeft, f.bs.eyeBlinkRight, "blink applied to both lids equally");
      if (f.bs.eyeBlinkLeft > 0.9 && prev <= 0.9) blinks++;
      prev = f.bs.eyeBlinkLeft;
    }
    const perMin = blinks / 10;
    assert.ok(Math.abs(perMin - rate) / rate < 0.25, `${state}: ${perMin}/min vs ${rate}`);
  }
});

test("I13: a blink's closing phase is visible at the 20 and 30 fps caps (≥ 1 frame between open and shut)", () => {
  for (const fps of [20, 30]) {
    const { frames } = simulate({ state: "idle", seconds: 120, fps });
    const partial = frames.filter((f) => f.bs.eyeBlinkLeft > 0.05 && f.bs.eyeBlinkLeft < 0.95).length;
    assert.ok(partial > 0, `${fps} fps shows in-between lid frames`);
  }
});

test("I12: no continuous mutual gaze longer than 4 s, in every state", () => {
  for (const state of ["idle", "speaking", "listening", "your_turn"]) {
    const { frames } = simulate({ state, seconds: 120 });
    let run = 0, longest = 0;
    for (const f of frames) {
      run = f.gazeMode === "child" ? run + 1 / 30 : 0;
      longest = Math.max(longest, run);
    }
    assert.ok(longest <= MUTUAL_GAZE_MAX_S + 0.05, `${state}: ${longest.toFixed(2)} s`);
  }
});

test("I10: eye-in-head stays inside ±25° yaw / +20…−25° pitch; head ≤ 20°", () => {
  const { frames } = simulate({ state: (t) => (["thinking", "speaking", "listening", "your_turn"][Math.floor(t / 3) % 4]), seconds: 120 });
  for (const f of frames) {
    assert.ok(Math.abs(f.gaze[0]) <= EYE_YAW_MAX && f.gaze[1] <= EYE_PITCH_UP && f.gaze[1] >= EYE_PITCH_DOWN);
    for (const h of f.head) assert.ok(Math.abs(h) <= 20);
  }
});

test("I8: nod peak is frame-rate independent (±20% at 15/24/30 fps; GR-1.2)", () => {
  for (const fps of [15, 24, 30]) {
    const nod = { x: 0, v: 3 / SPRING_PEAK_PER_V };
    let peak = 0;
    for (let k = 0; k < fps; k++) {
      springStep(nod, 1 / fps);
      peak = Math.max(peak, nod.x);
    }
    assert.ok(Math.abs(peak - 3) / 3 <= 0.2, `${fps} fps: sampled peak ${peak.toFixed(2)}° for 3°`);
  }
});

test("I1: THINKING is verdict-neutral: an expression is released within 300 ms of entering it", () => {
  const b = new Behaviour({ band: "b1", seed: 3, faceStyle: { smile: 0.8 } });
  let t = 1;
  b.setState("speaking");
  b.update(t);
  b.arm("proud", 2);
  for (let k = 0; k < 45; k++) b.update((t += 1 / 30));
  const during = b.update((t += 1 / 30));
  assert.ok(during.bs.cheekSquintLeft > 0.05, "the expression is on while she speaks");
  b.setState("thinking");
  let f;
  for (let k = 0; k < 10; k++) f = b.update((t += 1 / 30)); // 333 ms
  assert.ok((f.bs.cheekSquintLeft ?? 0) < 0.01 && (f.bs.eyeSquintLeft ?? 0) < 0.01, "cheek/eye squint released");
  assert.ok(f.bs.mouthSmileLeft <= 0.03 * 0.8 * 1.07 + 1e-6, `only the thinking rest smile remains (${f.bs.mouthSmileLeft})`);
});

test("reduced motion: head motion ≥ 3× smaller, blinks unchanged; gentle face never touches brows or blinks", () => {
  const spread = (frames) => { const p = frames.map((f) => f.head[1]); const m = p.reduce((a, b) => a + b, 0) / p.length; return Math.sqrt(p.reduce((a, b) => a + (b - m) ** 2, 0) / p.length); };
  const full = simulate({ state: "speaking", seconds: 60 });
  const calm = simulate({ state: "speaking", seconds: 60, opts: { reducedMotion: true } });
  assert.ok(spread(calm.frames) < spread(full.frames) / 3, `${spread(calm.frames).toFixed(2)} vs ${spread(full.frames).toFixed(2)}`);
  const blinks = (fr) => fr.filter((f, i) => f.bs.eyeBlinkLeft > 0.9 && (fr[i - 1]?.bs.eyeBlinkLeft ?? 0) <= 0.9).length;
  assert.ok(blinks(calm.frames) > 0.7 * blinks(full.frames));
  const g = simulate({ state: "listening", seconds: 5, opts: { gentle: true } });
  const n = simulate({ state: "listening", seconds: 5 });
  assert.equal(g.frames.at(-1).bs.browInnerUp, n.frames.at(-1).bs.browInnerUp);
});

// ───────────── compositor (§4.5) ─────────────

test("compositor: lips own the jaw, mouthClose ≤ jawOpen, the jaw ceiling holds, deltas are capped, tiny weights zeroed", () => {
  const c = new Compositor(0.85);
  let out = c.compose({ mouthSmileLeft: 0.5, browInnerUp: 0.4, eyeBlinkLeft: 1 }, { jawOpen: 1.2, mouthClose: 0.9 }, 1 / 30);
  assert.equal(out.jawOpen, 0.85);
  assert.ok(out.mouthClose <= out.jawOpen);
  assert.equal(out.eyeBlinkLeft, 1, "blinks are never delta-capped");
  assert.ok(out.mouthSmileLeft <= MAX_DELTA + 1e-9 && out.browInnerUp <= MAX_DELTA + 1e-9, "anti-snap from rest");
  out = c.compose({ jawOpen: 0.9, browInnerUp: 0.004 }, { jawOpen: 0.2 }, 1 / 30);
  assert.equal(out.jawOpen, 0.2, "behaviour never writes the jaw");
  for (let k = 0; k < 20; k++) out = c.compose({ browInnerUp: 0.004 }, { jawOpen: 0 }, 1 / 30);
  assert.equal(out.browInnerUp ?? 0, 0, "weights under 0.01 are zeroed");
});

// ───────────── tiers + governor (§6) ─────────────

test("static tier: only KNOWN-bad GPUs go down; everything else starts at B", () => {
  const base = { webgl2: true, majorCaveat: false, saveData: false, dpr: 2 };
  assert.equal(staticTier({ ...base, renderer: "Mali-G57 MC2" }).tier, "B");
  assert.equal(staticTier({ ...base, renderer: "Adreno (TM) 619" }).tier, "B");
  assert.equal(staticTier({ ...base, renderer: "PowerVR Rogue GE8320" }).tier, "Blite");
  assert.equal(staticTier({ ...base, renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))" }).tier, "D");
  assert.equal(staticTier({ ...base, renderer: "Mali-T830" }).tier, "D");
  assert.equal(staticTier({ ...base, webgl2: false, renderer: "" }).tier, "D");
  assert.equal(staticTier({ ...base, renderer: "Mali-G57", majorCaveat: true }).tier, "D");
  assert.equal(staticTier({ ...base, renderer: "Mali-G57", contextLosses: 2 }).tier, "D");
  assert.equal(staticTier({ ...base, renderer: "Mali-G57", battery: { level: 0.08, charging: false } }).tier, "E");
  assert.equal(staticTier({ ...base, renderer: "Mali-G57", voiceOnly: true }).tier, "E");
  assert.ok(staticTier({ ...base, renderer: "Mali-G57" }).pixelRatio <= 1.25);
  assert.equal(tierOverride("?face=Blite"), "Blite");
  assert.equal(tierOverride("?face=Z"), null);
});

test("probe: a slow 2 s probe moves B → B-lite or D; a fast one keeps B", () => {
  const b = staticTier({ webgl2: true, majorCaveat: false, saveData: false, renderer: "Mali-G57" });
  assert.equal(probeVerdict(b, { workP90: 3, intervalP90: 34 }).tier, "B");
  assert.equal(probeVerdict(b, { workP90: 10, intervalP90: 40 }).tier, "Blite");
  assert.equal(probeVerdict(b, { workP90: 20, intervalP90: 90 }).tier, "D");
});

test("governor: a steady 20 fps cap is not 'bad' (regression: 50 ms frames were counted as long)", () => {
  const g = new Governor({ tier: "Blite", pixelRatio: 1, fps: { speaking: 20, listening: 20, idle: 15 }, why: [] });
  let t = 0;
  for (let k = 0; k < 400; k++) {
    t += 0.05;
    g.frame(t, k % 3 ? 50 : 66.7);
    if (k % 20 === 0) assert.deepEqual(g.tick(t, 20, 1000), { kind: "none" });
  }
  assert.ok(longFrameMs(20) > 66.7 && longFrameMs(30) <= 51);
});

test("governor: pixels first, then ONE tier step, only in her silence, after 5 s of bad", () => {
  const g = new Governor({ tier: "B", pixelRatio: 1.25, fps: { speaking: 30, listening: 30, idle: 20 }, why: [] });
  const acts = [];
  let t = 0;
  for (let k = 0; k < 40 * 10; k++) {
    t += 0.1;
    g.frame(t, 100); // 10 fps
    if (k % 10 === 0) {
      const silent = t > 30 ? 400 : 0; // she talks for the first 30 s
      const a = g.tick(t, 30, silent);
      if (a.kind !== "none") acts.push({ t, ...a });
    }
  }
  assert.equal(acts[0].kind, "pixels");
  assert.ok(acts[0].t >= 5, "not before 5 s of bad signal");
  const tiers = acts.filter((a) => a.kind === "tier");
  assert.equal(tiers.length, 1, "at most one non-thermal demotion per lesson");
  assert.ok(tiers[0].t > 30, "the tier switch waits for her silence");
  assert.equal(tiers[0].to, "Blite");
});

// ───────────── audio floor (§2.5 contract tests 1 and 3) ─────────────

function filesUnder(dir) {
  return readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? filesUnder(p) : [p]; });
}

test("contract 1 (static): src/avatar/** creates no AudioContext, output, delay, worklet or media-source node", () => {
  const banned = [/\.destination\b/, /createDelay/, /createMediaElementSource/, /createMediaStreamSource/, /new\s+AudioContext/, /audioWorklet/i, /createGain/, /createBufferSource/, /\.muted\s*=/];
  const files = filesUnder(new URL("../src/avatar/", import.meta.url).pathname).filter((f) => /\.(ts|tsx)$/.test(f));
  assert.ok(files.length >= 8);
  for (const f of files) {
    const src = readFileSync(f, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const re of banned) assert.ok(!re.test(src), `${f.split("src/")[1]} matches ${re}`);
  }
});

/** A fake analyser graph that records every connection. */
function fakeGraph() {
  const log = { created: [], connects: [] };
  const ctx = { sampleRate: 44100, createAnalyser() { const n = node("own"); log.created.push(n); return n; } };
  function node(kind) {
    return { kind, context: ctx, fftSize: 1024, smoothingTimeConstant: 0.8, outs: [],
      connect(dst) { log.connects.push([this.kind, dst === "DESTINATION" ? "DESTINATION" : dst.kind]); this.outs.push(dst); return dst; },
      disconnect(dst) { this.outs = this.outs.filter((o) => o !== dst); log.connects.push([this.kind, "x" + (dst?.kind ?? "")]); },
      getFloatTimeDomainData(b) { b.fill(0.05); } };
  }
  return { log, upstream: () => node("meter") };
}

test("contract 1 (runtime) + 3 (reconnect): the tap adds one analysis-only node per stream, never connected onward", () => {
  const g = fakeGraph();
  const meter = new LevelMeter();
  const tap = new TeacherTap([meter]);
  assert.equal(tap.read().buf, null, "no stream yet: amplitude fallback");
  const a1 = g.upstream();
  meter.attach(a1);
  assert.equal(g.log.created.length, 1);
  const r1 = tap.read();
  assert.ok(r1.buf && r1.fresh, "attached in the same frame, flagged fresh");
  assert.equal(r1.sampleRate, 44100);
  assert.equal(tap.read().fresh, false, "fresh fires once");
  // reconnect: a new remote stream → a new upstream analyser
  const a2 = g.upstream();
  meter.attach(a2);
  assert.equal(g.log.created.length, 2);
  assert.ok(tap.read().fresh, "re-attached within one read");
  assert.equal(a1.outs.length, 0, "the old stream's tap is disconnected");
  for (const n of g.log.created) assert.equal(n.outs.length, 0, "the tap's own node has no outgoing connection");
  assert.ok(!g.log.connects.some(([, d]) => d === "DESTINATION"));
  meter.detach();
  assert.equal(tap.read().buf, null, "detach → amplitude fallback");
  tap.dispose();
});

test("LevelMeter.onTap: fires now when attached, on every attach, and with null on detach", () => {
  const m = new LevelMeter();
  const seen = [];
  const g = fakeGraph();
  const a = g.upstream();
  m.attach(a);
  const off = m.onTap((x) => seen.push(x));
  m.detach();
  m.attach(g.upstream());
  off();
  m.detach();
  assert.equal(seen.length, 3);
  assert.equal(seen[0], a);
  assert.equal(seen[1], null);
  m.detach();
});

test("plate mouth: 5 cells with hysteresis (no flicker on a boundary)", () => {
  let c = 0;
  c = mouthCell(0.25, c);
  assert.equal(c, 2);
  assert.equal(mouthCell(0.19, c), 2, "just under the edge stays (hysteresis)");
  assert.equal(mouthCell(0.1, c), 1);
  assert.equal(mouthCell(0.9, 0), 4);
});

// ───────────── mutation check (§4.6): each invariant must trip on a mutation that breaks it ─────────────

function longestContact(b, seconds = 60) {
  let run = 0, longest = 0;
  b.setState("listening");
  for (let k = 0; k < seconds * 30; k++) { const f = b.update(1 + k / 30); run = f.gazeMode === "child" ? run + 1 / 30 : 0; longest = Math.max(longest, run); }
  return longest;
}
function thinkingResidue(b) {
  let t = 1;
  b.setState("speaking"); b.update(t); b.arm("proud", 2);
  for (let k = 0; k < 46; k++) b.update((t += 1 / 30));
  b.setState("thinking");
  let f; for (let k = 0; k < 10; k++) f = b.update((t += 1 / 30));
  return f.bs.cheekSquintLeft ?? 0;
}
function lidAsymmetry(b) {
  b.setState("idle");
  let worst = 0;
  for (let k = 0; k < 30 * 60; k++) { const f = b.update(1 + k / 30); worst = Math.max(worst, Math.abs(f.bs.eyeBlinkLeft - f.bs.eyeBlinkRight)); }
  return worst;
}

test("mutation check: I12, I1 and lid symmetry each trip on their mutation (and hold unmutated)", () => {
  const fresh = () => new Behaviour({ band: "b2", seed: 11 });
  assert.ok(longestContact(fresh()) <= MUTUAL_GAZE_MAX_S + 0.05);
  const m1 = fresh(); m1.avert = () => {};                       // mutation: no aversions ever
  assert.ok(longestContact(m1) > MUTUAL_GAZE_MAX_S + 0.05, "I12 trips");
  assert.ok(thinkingResidue(fresh()) < 0.01);
  const m2 = fresh(); m2.release = () => {};                     // mutation: THINKING keeps the face
  assert.ok(thinkingResidue(m2) >= 0.01, "I1 trips");
  assert.equal(lidAsymmetry(fresh()), 0);
  const m3 = fresh(); const up = m3.update.bind(m3);              // mutation: one lid only
  m3.update = (t, i) => { const f = up(t, i); f.bs.eyeBlinkRight = 0; return f; };
  assert.ok(lidAsymmetry(m3) > 0.5, "symmetry trips");
});

test("mutation check: I8 trips when the spring integrates one step per frame (the pre-GR-1.2 bug)", () => {
  const naive = (fps) => { const n = { x: 0, v: 3 / SPRING_PEAK_PER_V }; let p = 0; const c = 2 * 0.6 * Math.sqrt(120);
    for (let k = 0; k < fps; k++) { const h = 1 / fps; n.v += (-120 * n.x - c * n.v) * h; n.x += n.v * h; p = Math.max(p, n.x); } return p; };
  assert.ok(Math.abs(naive(15) - 3) / 3 > 0.2, `one Euler step per frame at 15 fps peaks at ${naive(15).toFixed(2)}°`);
});
