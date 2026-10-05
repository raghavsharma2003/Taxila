// MOTION LAB — `motion-lab@1` (VALUES-100 V3.1: time, speed, uniform and non-uniform motion). Every motion on screen
// is integrated in real time from the physics, so a 2-second pendulum really takes 2 seconds a swing, and the mass knob
// really changes nothing. Race: set the missing one of distance / time / speed on a dial and RUN it against the train.
// Drive: hold the pedal and watch your distance-time trace draw itself over the target graph.
import { DRIVE_DT, L_MAX, L_MIN, lengthFor, periodOf, raceKey, raceMax, targetAt, type MlRoundT, type MotionSpec } from "../../../../shared/studio-spec-ext/motion.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, fmtNum, taskPill, textBlock } from "./kit.ts";

const SL = { x0: 170, x1: 690, y: 572 };
const BTN = { swing: { x: 800, y: 250, w: 170, h: 70 }, lock: { x: 800, y: 510, w: 170, h: 70 }, run: { x: 800, y: 510, w: 170, h: 70 }, pedal: { x: 790, y: 330, w: 180, h: 240 } };
const MASSES = [50, 100, 200];
const GR = { x: 130, y: 190, w: 560, h: 320 };
const inB = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
function create(api: EngineApi, spec: MotionSpec): EngineInstance {
  const T = spec.strings, accent = C.sci;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 157 + 5), setTask = taskPill(api);
  const g = {
    L: 60, mass: 1, th: 0, om: 0, swinging: false, swT: 0, lastSign: 0, crossings: 0, firstCross: -1, lastCross: -1, measured: 0,
    dial: 0, dialDrag: false, running: false, runT: 0, ranOnce: false,
    pedal: false, v: 0, x: 0, dT: 0, trace: [0] as number[], driving: false, started: false,
    answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, slider: false,
  };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): MlRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      Object.assign(g, { L: 60, mass: 1, th: 0, om: 0, swinging: false, swT: 0, lastSign: 0, crossings: 0, firstCross: -1, lastCross: -1, measured: 0, dial: 0, running: false, runT: 0, ranOnce: false, pedal: false, v: 0, x: 0, dT: 0, trace: [0], driving: false, started: false, answered: false, verdict: "", detail: "", revealT: 0 });
      const r = spec.rounds[k]; setTask(`${T.round} ${k + 1}`, r.sub || r.title);
      api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function judge(value: unknown, local: "right" | "wrong") {
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.detail = grade.detail ?? ""; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(40); } else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, verdict: grade.verdict, detail: g.detail });
  }
  const Lof = (x: number) => Math.round(clamp(L_MIN + ((x - SL.x0) / (SL.x1 - SL.x0)) * (L_MAX - L_MIN), L_MIN, L_MAX));
  const xOfL = (L: number) => SL.x0 + ((L - L_MIN) / (L_MAX - L_MIN)) * (SL.x1 - SL.x0);
  const dialOf = (x: number) => { const r = rd() as Extract<MlRoundT, { mode: "race" }>, mx = raceMax(r), step = mx / 200; return Math.round(clamp(((x - SL.x0) / (SL.x1 - SL.x0)) * mx, 0, mx) / step) * step; };
  const xOfDial = (v: number) => { const r = rd() as Extract<MlRoundT, { mode: "race" }>; return SL.x0 + (v / raceMax(r)) * (SL.x1 - SL.x0); };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd();
      if (r.mode === "pendulum") {
        if (inB(p, BTN.lock) && g.measured > 0) { const e = Math.abs(periodOf(g.L) - r.period); judge({ length: g.L, mass: MASSES[g.mass] }, e <= r.tol ? "right" : "wrong"); return; }
        if (inB(p, BTN.swing)) { if (g.swinging) { g.swinging = false; g.th = 0; g.om = 0; } else { g.swinging = true; g.th = 0.21; g.om = 0; g.swT = 0; g.crossings = 0; g.firstCross = -1; g.lastCross = -1; g.lastSign = 1; api.record("swing", { length: g.L, mass: MASSES[g.mass] }); } return; }
        if (r.massKnob) for (let i = 0; i < 3; i++) if (Math.hypot(p.x - (830 + i * 60), p.y - 410) < 28) { g.mass = i; api.record("mass", { mass: MASSES[i] }); sfx.blip({ f: 400 + i * 100, dur: 0.05, type: "triangle", gain: 0.08 }); return; }
        if (Math.abs(p.y - SL.y) < 38 && !g.swinging) { g.slider = true; g.L = Lof(p.x); }
        return;
      }
      if (r.mode === "race") {
        if (inB(p, BTN.run) && !g.running) { if (g.dial <= 0) return; g.running = true; g.runT = 0; api.record("run", { value: g.dial }); sfx.blip({ f: 330, f2: 660, dur: 0.2, type: "triangle", gain: 0.1 }); return; }
        if (Math.abs(p.y - SL.y) < 38 && !g.running) { g.dialDrag = true; g.dial = dialOf(p.x); }
        return;
      }
      if (inB(p, BTN.pedal)) { g.pedal = true; if (!g.started) { g.started = true; g.driving = true; api.record("drive", { start: true }); } }
    },
    move(p) { if (g.slider) g.L = Lof(p.x); if (g.dialDrag) g.dial = dialOf(p.x); },
    up() { if (g.slider) { g.slider = false; api.record("length", { length: g.L }); } if (g.dialDrag) { g.dialDrag = false; api.record("dial", { value: g.dial }); } g.pedal = false; },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    if (r.mode === "pendulum" && g.swinging) {
      // real time, real g: θ'' = −(g/L)·sin θ, integrated in small sub-steps
      const Lm = g.L / 100, steps = 8, h = dt / steps;
      for (let i = 0; i < steps; i++) { g.om += (-9.81 / Lm) * Math.sin(g.th) * h; g.th += g.om * h; g.swT += h; const s = Math.sign(g.th); if (s !== 0 && s !== g.lastSign) { g.lastSign = s; g.crossings++; if (g.firstCross < 0) g.firstCross = g.swT; g.lastCross = g.swT; } }
      if (g.crossings >= 3) g.measured = ((g.lastCross - g.firstCross) / (g.crossings - 1)) * 2;
    }
    if (r.mode === "race" && g.running) { g.runT += dt; if (g.runT > 4.6 && !g.answered) { g.running = false; const key = raceKey(r), e = Math.abs(g.dial - key) / key * 100; judge({ value: +g.dial.toFixed(3) }, e <= r.tolPct ? "right" : "wrong"); } }
    if (r.mode === "drive" && g.driving && !g.answered) {
      const end = r.pts[r.pts.length - 1][0];
      g.v = g.pedal ? Math.min(r.vmax, g.v + (r.vmax / 1.1) * dt) : Math.max(0, g.v - (r.vmax / 0.5) * dt);
      g.x += g.v * dt; g.dT += dt;
      while (g.trace.length * DRIVE_DT <= g.dT) g.trace.push(+(g.x - g.v * (g.dT - g.trace.length * DRIVE_DT)).toFixed(2));
      if (g.dT >= end + 0.05) { g.driving = false; const gap = rms(r); judge({ trace: g.trace }, gap <= r.tol ? "right" : "wrong"); }
    }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function rms(r: Extract<MlRoundT, { mode: "drive" }>) { const end = r.pts[r.pts.length - 1][0], n = Math.round(end / DRIVE_DT); let s = 0; for (let i = 1; i <= n; i++) { const e = (g.trace[i] ?? g.x) - targetAt(r.pts, i * DRIVE_DT); s += e * e; } return Math.sqrt(s / n); }
  function paintBg(c: Ctx) { backdrop(c, accent, 157, 0); }
  function button(ctx: Ctx, b: { x: number; y: number; w: number; h: number }, label: string, on: boolean, now: number) {
    ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = on ? hexA(C.volt, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 2, { font: "display", size: 38, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle", maxWidth: b.w - 16 });
  }
  function slider(ctx: Ctx, x: number, label: string, active: boolean) {
    ctx.save(); ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(SL.x1, SL.y); ctx.stroke(); ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(x, SL.y); ctx.stroke();
    ctx.fillStyle = active ? C.volt : C.ink; ctx.beginPath(); ctx.arc(x, SL.y, 17, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    pill(api, ctx, label, clamp(x, 230, 630), SL.y - 58, { color: active ? C.volt : C.ink, size: 38 });
  }
  function readout(ctx: Ctx, label: string, value: string, x: number, y: number, color: string = C.ink) {
    api.text(ctx, label, x, y, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 250 });
    api.text(ctx, value, x, y + 46, { font: "display", size: 44, weight: 800, color, align: "center", baseline: "middle", maxWidth: 250 });
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "pendulum") {
      const px = 360, py = 170, len = 40 + g.L * 1.1, bx = px + Math.sin(g.th) * len, by = py + Math.cos(g.th) * len, br = 14 + g.mass * 7;
      ctx.save(); ctx.fillStyle = "#3A4256"; ctx.fillRect(px - 120, py - 14, 240, 14); ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 360); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke(); ctx.restore();
      bloom(ctx, accent, bx, by, br * 2.2, 0.4); ctx.save(); const gr = ctx.createRadialGradient(bx - br / 3, by - br / 3, 2, bx, by, br); gr.addColorStop(0, "#F5F7FF"); gr.addColorStop(1, "#8A93AE"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      slider(ctx, xOfL(g.L), `${T.length} ${g.L} cm`, g.slider);
      button(ctx, BTN.swing, g.swinging ? T.stop : T.release, !done, now);
      if (r.massKnob) { api.text(ctx, T.mass, 890, 360, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" }); MASSES.forEach((_, i) => { ctx.save(); ctx.fillStyle = i === g.mass ? hexA(accent, 0.5) : "rgba(22,26,36,.95)"; ctx.beginPath(); ctx.arc(830 + i * 60, 410, 12 + i * 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = i === g.mass ? accent : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }); }
      readout(ctx, g.measured ? T.period : T.timer, g.measured ? `${g.measured.toFixed(2)} s` : g.swinging ? `${g.swT.toFixed(1)} s` : "?", 640, 230, g.measured ? C.ion : C.ink2);
      button(ctx, BTN.lock, T.lock, !done && g.measured > 0, now);
      if (done) pill(api, ctx, `${periodOf(g.L).toFixed(2)} s`, 640, 400, { color: ok ? C.mint : C.amber, size: 40 });
    } else if (r.mode === "race") {
      const key = raceKey(r), trainV = r.d / r.t;
      const trackD = r.ask === "distance" ? Math.max(r.d, g.dial) * 1.1 : r.d, X0 = 130, X1 = 700, xd = (d: number) => X0 + (d / trackD) * (X1 - X0);
      const simT = (g.runT / 3.6) * r.t; // the run is shown in 3.6 s of screen time
      for (const [y, lab] of [[250, T.train], [380, T.you]] as [number, string][]) { ctx.save(); ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(X0 - 10, y - 40, X1 - X0 + 20, 80); ctx.restore(); api.text(ctx, lab, X0, y - 64, { font: "mono", size: 38, weight: 600, color: C.ink2, baseline: "middle" }); }
      ctx.save(); ctx.strokeStyle = C.sun; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(xd(r.d), 200); ctx.lineTo(xd(r.d), 430); ctx.stroke(); ctx.restore();
      if (r.ask === "distance" && g.dial > 0) { ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xd(g.dial), 340); ctx.lineTo(xd(g.dial), 430); ctx.stroke(); ctx.fillStyle = C.volt; ctx.beginPath(); ctx.moveTo(xd(g.dial), 340); ctx.lineTo(xd(g.dial) + 26, 352); ctx.lineTo(xd(g.dial), 364); ctx.fill(); ctx.restore(); }
      const tr = g.running || done ? Math.min(r.d, trainV * simT) : 0, you = !(g.running || done) ? 0 : r.ask === "speed" ? Math.min(r.d, g.dial * simT) : r.ask === "time" ? Math.min(r.d, trainV * simT) : trainV * Math.min(simT, r.t);
      // train
      ctx.save(); ctx.fillStyle = "#5FA8FF"; roundRect(ctx, xd(tr) - 90, 226, 90, 46, 10); ctx.fill(); ctx.fillStyle = "#CFE3FF"; for (let i = 0; i < 3; i++) ctx.fillRect(xd(tr) - 82 + i * 26, 234, 18, 14); ctx.restore();
      // your cart
      const ycx = xd(Math.min(you, trackD)); ctx.save(); bloom(ctx, C.volt, ycx - 30, 380, 40, g.running ? 0.4 : 0.15); ctx.fillStyle = C.volt; roundRect(ctx, ycx - 64, 360, 64, 34, 10); ctx.fill(); ctx.fillStyle = "#0B0E14"; ctx.beginPath(); ctx.arc(ycx - 50, 398, 9, 0, Math.PI * 2); ctx.arc(ycx - 14, 398, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (r.ask === "time" && g.dial > 0 && (g.running || done) && simT >= g.dial) pill(api, ctx, "⏰", ycx - 30, 320, { color: C.volt, size: 38 });
      // givens
      const uv = `${r.unitD}/${r.unitT}`, given: [string, string][] = r.ask === "speed" ? [[T.distance, `${fmtNum(r.d)} ${r.unitD}`], [T.time, `${fmtNum(r.t)} ${r.unitT}`]] : r.ask === "time" ? [[T.distance, `${fmtNum(r.d)} ${r.unitD}`], [T.speed, `${+trainV.toFixed(2)} ${uv}`]] : [[T.speed, `${+trainV.toFixed(2)} ${uv}`], [T.time, `${fmtNum(r.t)} ${r.unitT}`]];
      given.forEach(([a, b], i) => readout(ctx, a, b, 880, 230 + i * 130));
      const unit = r.ask === "speed" ? uv : r.ask === "time" ? r.unitT : r.unitD;
      slider(ctx, xOfDial(g.dial), `${T[r.ask]} ${+g.dial.toFixed(2)} ${unit}`, g.dialDrag);
      button(ctx, BTN.run, T.run, !done && !g.running && g.dial > 0, now);
      if (done) { const e = (g.dial - key) / key; pill(api, ctx, ok ? T.together : `${+key.toFixed(2)} ${unit}`, 415, 448, { color: ok ? C.mint : C.amber, size: 40 }); if (!ok) pill(api, ctx, (r.ask === "time" ? e < 0 : e > 0) ? T.early : T.late, 880, 470, { color: C.amber, size: 38 }); }
    } else {
      const end = r.pts[r.pts.length - 1][0], dMax = Math.max(...r.pts.map((p) => p[1])) * 1.25 || 10, gx = (t: number) => GR.x + (t / end) * GR.w, gy = (d: number) => GR.y + GR.h - (d / dMax) * GR.h;
      ctx.save(); ctx.fillStyle = "rgba(10,14,22,.7)"; ctx.fillRect(GR.x, GR.y, GR.w, GR.h); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(GR.x, GR.y); ctx.lineTo(GR.x, GR.y + GR.h); ctx.lineTo(GR.x + GR.w, GR.y + GR.h); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1; for (let t = 1; t <= end; t++) { ctx.beginPath(); ctx.moveTo(gx(t), GR.y); ctx.lineTo(gx(t), GR.y + GR.h); ctx.stroke(); }
      ctx.strokeStyle = hexA(C.ion, 0.8); ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = 0.45; ctx.beginPath(); r.pts.forEach(([t, d], i) => (i ? ctx.lineTo(gx(t), gy(d)) : ctx.moveTo(gx(t), gy(d)))); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.beginPath(); g.trace.forEach((d, i) => (i ? ctx.lineTo(gx(i * DRIVE_DT), gy(d)) : ctx.moveTo(gx(0), gy(d)))); if (g.driving) ctx.lineTo(gx(g.dT), gy(g.x)); ctx.stroke(); ctx.restore();
      api.text(ctx, T.distance, GR.x - 8, GR.y - 26, { font: "mono", size: 38, weight: 600, color: C.ink2, baseline: "middle" });
      api.text(ctx, `${T.time} →`, GR.x + GR.w, GR.y + GR.h + 30, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "right", baseline: "middle" });
      // the car on its road
      const cx = 140 + (g.x / dMax) * 520; ctx.save(); ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(120, 560, 560, 40); ctx.fillStyle = C.volt; roundRect(ctx, cx - 26, 564, 52, 26, 8); ctx.fill(); ctx.restore();
      ctx.save(); ctx.fillStyle = g.pedal ? "rgba(203,255,77,.22)" : "rgba(22,26,36,.95)"; roundRect(ctx, BTN.pedal.x, BTN.pedal.y, BTN.pedal.w, BTN.pedal.h, 22); ctx.fill(); ctx.strokeStyle = done ? C.line2 : C.volt; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      textBlock(api, ctx, T.hold, BTN.pedal.x + BTN.pedal.w / 2, BTN.pedal.y + BTN.pedal.h / 2, BTN.pedal.w - 24, { font: "display", size: 38, weight: 800, color: done ? C.ink3 : C.volt }, 3);
      readout(ctx, T.speed, `${g.v.toFixed(1)} m/s`, 880, 220);
      if (done) pill(api, ctx, g.detail, 410, 150 + 380, { color: ok ? C.mint : C.amber, size: 38 });
    }
    if (done) { if (ok) tick(ctx, 765, 200, C.mint, 1); else magnifier(ctx, 760, 200, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1;
    if (r.mode === "pendulum") {
      const want = Math.round(lengthFor(r.period) * (slip ? 1.4 : 1));
      if (Math.abs(g.L - want) > 1 && !g.swinging) return { type: "drag", from: [xOfL(g.L), SL.y], to: [xOfL(want) + 0.5, SL.y], ms: 500, after: 300 };
      if (!g.swinging && !g.measured) return { type: "tap", at: [BTN.swing.x + 85, BTN.swing.y + 35], after: 300 };
      if (!g.measured) return { type: "wait", ms: 400 };
      return { type: "tap", at: [BTN.lock.x + 85, BTN.lock.y + 35], after: 400 };
    }
    if (r.mode === "race") {
      if (g.running) return { type: "wait", ms: 400 };
      const want = raceKey(r) * (slip ? 1.25 : 1);
      if (Math.abs(g.dial - want) > raceMax(r) / 150) return { type: "drag", from: [xOfDial(g.dial), SL.y], to: [xOfDial(want), SL.y], ms: 500, after: 300 };
      return { type: "tap", at: [BTN.run.x + 85, BTN.run.y + 35], after: 400 };
    }
    // drive: look ahead on the target and hold the pedal while you are behind it
    const look = targetAt(r.pts, g.dT + 0.5), need = look - g.x;
    if (need > g.v * 0.5 + 0.3) return { type: "drag", from: [880, 450], to: [880, 451], ms: 120, after: 0 };
    return { type: "wait", ms: 60 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, L: g.L, measured: g.measured, dial: g.dial, x: g.x, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const motion: EngineDef<MotionSpec> = { archetype: "motion-lab@1", label: "Simulation · Motion Lab", accent: C.sci, create };
