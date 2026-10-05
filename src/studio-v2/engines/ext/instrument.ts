// INSTRUMENT BENCH — `instrument@1` (VALUES-100 V3.1: measurement and units). One instrument per round, the target
// always asked in a different form from the scale (1.25 l on an ml jug; 1 kg 350 g on a gram weight box; 1.35 m on a
// cm rule; 45 min after 10:50 a.m. on an analog clock; 37.6 °C on a 0.2-degree thermometer). Pour by holding (the flow
// speeds up), load weights then release the locked balance, tap to cut the unrolling ribbon, drag the minute hand (the
// hour hand is geared), tap when the drifting column reads the target. The host grades the measured quantity.
import { WEIGHTS, showQty, type InRoundT, type InstrumentSpec } from "../../../../shared/studio-spec-ext/instrument.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, fmtNum, textBlock } from "./kit.ts";

const CARD = { x: 610, y: 168, w: 360, h: 130 }, BTN = { x: 700, y: 470, w: 230, h: 70 };
function create(api: EngineApi, spec: InstrumentSpec): EngineInstance {
  const T = spec.strings, accent = C.ion;
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const botR = rng(api.seed * 101 + 3);
  const g = { k: 0, level: 0, show: 0, pouring: false, holdT: 0, pan: [] as number[], tilt: 0, tiltV: 0, released: false, ribbon: 0, cutAt: -1, minutes: 720, dragging: false, lastAng: 0, temp: 0, tT: 0,
    answered: false, verdict: "", measured: 0, revealT: 0, right: 0, n: 0, errs: [] as number[], coachA: 1, coachGone: false, speedK: 1 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.measured }, { key: "prec", label: T.precision, meter: true }]);
  const rd = (): InRoundT => spec.rounds[Math.max(0, flow.round)];
  const it = () => rd().items[g.k];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.k = 0; g.speedK = spec.rounds[k].speed; api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); start(); },
    onEnd(k) { api.event("round_end", { round: k + 1 }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const tMin = () => (rd().mode === "thermo" ? (it().target >= 340 && it().target <= 430 ? 350 : -100) : 0), tMax = () => (rd().mode === "thermo" ? (it().target >= 340 && it().target <= 430 ? 420 : 1100) : rd().scaleMax);
  function start() {
    g.level = 0; g.show = 0; g.pouring = false; g.holdT = 0; g.pan = []; g.tilt = 0; g.tiltV = 0; g.released = false; g.ribbon = 0; g.cutAt = -1; g.answered = false; g.verdict = ""; g.revealT = 0; g.tT = 0;
    const x = it(); g.minutes = rd().mode === "clock" ? (x.start ?? 720) : 720; g.temp = tMin() + (tMax() - tMin()) * 0.2;
    api.task(`${T.round} ${flow.round + 1}`, showQty(rd().mode, x.target, x.show, x.start));
  }
  function judge(value: unknown, measured: number, local: string) {
    if (g.answered) return;
    const grade = api.answer(`r${flow.round + 1}:${g.k}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.measured = measured; g.revealT = 0; g.n++;
    if (typeof grade.error === "number") g.errs.push(Math.min(1, Math.abs(grade.error) / Math.max(1, rd().minor * 4)));
    if (grade.verdict === "right") { g.right++; api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else { g.speedK = Math.max(0.6, g.speedK * 0.88); sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 }); api.event("adapt", { speed: +g.speedK.toFixed(2) }); }
    api.facts({ round: flow.round + 1, item: g.k + 1, asked: showQty(rd().mode, it().target, it().show, it().start), measured, verdict: grade.verdict });
  }
  // ── geometry
  const JUG = { x: 250, y: 170, w: 210, h: 340 };
  const jugY = (ml: number) => JUG.y + JUG.h - (ml / rd().scaleMax) * (JUG.h - 20);
  const RUL = { x0: 70, x1: 930, y: 380 };
  const rulX = (mm: number) => RUL.x0 + (mm / rd().scaleMax) * (RUL.x1 - RUL.x0);
  const CLK = { x: 330, y: 340, r: 150 };
  const TH = { x: 420, y0: 515, y1: 170 };
  const thY = (t: number) => TH.y0 - ((t - tMin()) / (tMax() - tMin())) * (TH.y0 - TH.y1);
  const weightBox = () => WEIGHTS.map((w, i) => ({ w, x: 40 + i * 82, y: 520 }));
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      const m = rd().mode;
      if (m === "pour") {
        if (p.x >= BTN.x && p.x <= BTN.x + BTN.w && p.y >= BTN.y && p.y <= BTN.y + BTN.h) { if (g.level > 0) { const ml = Math.round(g.level); judge(ml, ml, Math.abs(ml - it().target) <= rd().tol ? "right" : "wrong"); } return; }
        g.pouring = true; g.holdT = 0; sfx.noise({ dur: 0.25, f: 2000, filter: "bandpass", gain: 0.05 });
      }
      else if (m === "cut") { g.cutAt = g.ribbon; sfx.noise({ dur: 0.08, f: 3000, filter: "highpass", gain: 0.2 }); judge(Math.round(g.cutAt), g.cutAt, Math.abs(g.cutAt - it().target) <= rd().tol ? "right" : "wrong"); }
      else if (m === "thermo") { const reading = Math.round(g.temp); judge(reading, reading, Math.abs(reading - it().target) <= rd().tol ? "right" : "wrong"); }
      else if (m === "weigh") {
        const wb = weightBox().find((b) => p.x >= b.x && p.x <= b.x + 76 && p.y >= b.y - 6 && p.y <= b.y + 80);
        if (wb && g.pan.length < 16) { g.pan.push(wb.w); sfx.blip({ f: 300, dur: 0.06, type: "triangle", gain: 0.08 }); api.record("pan", { add: wb.w }); return; }
        if (p.x >= 560 && p.x <= 820 && p.y >= 230 && p.y <= 420 && g.pan.length) { const w = g.pan.pop()!; api.record("pan", { remove: w }); return; }
        if (p.x >= BTN.x && p.x <= BTN.x + BTN.w && p.y >= BTN.y && p.y <= BTN.y + BTN.h && g.pan.length) { g.released = true; const sum = g.pan.reduce((a, b) => a + b, 0); judge([...g.pan], sum, sum === it().target ? "right" : "wrong"); }
      } else if (m === "clock") {
        if (p.x >= BTN.x && p.x <= BTN.x + BTN.w && p.y >= BTN.y && p.y <= BTN.y + BTN.h) { const d = Math.min(Math.abs(g.minutes - it().target), 1440 - Math.abs(g.minutes - it().target)); judge({ minutes: g.minutes }, g.minutes, d <= rd().tol ? "right" : "wrong"); return; }
        if (p.x >= 640 && p.x <= 780 && p.y >= 340 && p.y <= 410) { if (g.minutes >= 720) g.minutes -= 720; api.record("clock", { ampm: "am" }); return; }
        if (p.x >= 800 && p.x <= 940 && p.y >= 340 && p.y <= 410) { if (g.minutes < 720) g.minutes += 720; api.record("clock", { ampm: "pm" }); return; }
        if (Math.hypot(p.x - CLK.x, p.y - CLK.y) < CLK.r + 30) { g.dragging = true; g.lastAng = Math.atan2(p.y - CLK.y, p.x - CLK.x); }
      }
    },
    move(p) {
      if (!g.dragging || rd().mode !== "clock") return;
      const a = Math.atan2(p.y - CLK.y, p.x - CLK.x); let d = a - g.lastAng; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; g.lastAng = a;
      g.minutes = ((g.minutes + (d / (Math.PI * 2)) * 60) % 1440 + 1440) % 1440;
    },
    up() {
      if (rd()?.mode === "pour" && g.pouring) { g.pouring = false; api.record("pour", { ml: Math.round(g.level) }); }
      if (g.dragging) { g.dragging = false; g.minutes = Math.round(g.minutes); api.record("clock", { minutes: g.minutes }); }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    const r = rd(), x = it();
    if (r.mode === "pour" && g.pouring && !g.answered) { g.holdT += dt; const rate = (r.scaleMax / 9) * (0.35 + Math.min(1.6, g.holdT * 0.7)) * g.speedK; g.level = Math.min(r.scaleMax, g.level + rate * dt); }
    g.show += (g.level - g.show) * Math.min(1, dt * 10);
    if (r.mode === "cut" && !g.answered) { g.ribbon += (r.scaleMax / 10) * g.speedK * dt; if (g.ribbon >= r.scaleMax) judge(Math.round(r.scaleMax), r.scaleMax, "wrong"); }
    if (r.mode === "thermo" && !g.answered) { g.tT += dt * g.speedK; const lo = Math.max(tMin(), x.target - 18), hi = Math.min(tMax(), x.target + 14); g.temp = lerp(lo, hi, 0.5 - 0.5 * Math.cos(g.tT * 0.55)); }
    if (r.mode === "weigh") { const diff = g.released ? clamp((x.target - g.pan.reduce((a, b) => a + b, 0)) / 500, -1, 1) * 0.32 : 0; g.tiltV += ((diff - g.tilt) * 60 - g.tiltV * 9) * dt; g.tilt += g.tiltV * dt; }
    if (g.answered) { g.revealT += dt; if (g.revealT > (g.verdict === "right" ? 2.2 : 3.2)) { if (g.k + 1 < r.items.length) { g.k++; start(); } else flow.endRound(); } }
    const prec = g.errs.length ? Math.round(100 * (1 - g.errs.reduce((a, b) => a + b, 0) / g.errs.length)) : null;
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
    hud.set("prec", prec == null ? "—" : `${prec}%`, { meter: prec == null ? 0 : prec / 100, tone: prec != null && prec >= 85 ? "mint" : null });
  }
  const fmtBase = (v: number) => { const m = rd().mode; return m === "pour" ? `${fmtNum(Math.round(v))} ml` : m === "weigh" ? `${fmtNum(v)} g` : m === "cut" ? `${fmtNum(Math.round(v))} mm` : m === "thermo" ? `${(v / 10).toFixed(1)} °C` : showQty("clock", Math.round(v), "12h"); };
  function paintBg(c: Ctx) { backdrop(c, accent, 51, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const x = it();
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // the asked target (never the scale's own unit)
    ctx.save(); ctx.fillStyle = "rgba(20,24,36,.96)"; roundRect(ctx, CARD.x, CARD.y, CARD.w, CARD.h, 20); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.7); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    textBlock(api, ctx, showQty(r.mode, x.target, x.show, x.start), CARD.x + CARD.w / 2, CARD.y + CARD.h / 2, CARD.w - 30, { font: "display", size: 52, weight: 800 }, 2);
    if (r.mode === "pour") {
      // tap + stream
      ctx.fillStyle = "#3A4256"; roundRect(ctx, JUG.x + 40, 120, 120, 26, 8); ctx.fill(); ctx.fillRect(JUG.x + 120, 146, 18, 24);
      if (g.pouring) { ctx.fillStyle = "rgba(110,170,255,.8)"; ctx.fillRect(JUG.x + 123, 170, 12 * Math.min(1.6, 0.6 + g.holdT * 0.5), jugY(g.show) - 170); }
      ctx.save(); ctx.beginPath(); ctx.rect(JUG.x, JUG.y, JUG.w, JUG.h); ctx.clip(); const ly = jugY(g.show); const gr = ctx.createLinearGradient(0, ly, 0, JUG.y + JUG.h); gr.addColorStop(0, "rgba(110,170,255,.75)"); gr.addColorStop(1, "rgba(40,90,190,.85)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(JUG.x, ly + Math.sin(now * 6) * (g.pouring ? 4 : 1)); ctx.lineTo(JUG.x + JUG.w, ly - Math.sin(now * 6) * (g.pouring ? 4 : 1)); ctx.lineTo(JUG.x + JUG.w, JUG.y + JUG.h); ctx.lineTo(JUG.x, JUG.y + JUG.h); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.strokeStyle = "rgba(220,230,255,.75)"; ctx.lineWidth = 4; ctx.strokeRect(JUG.x, JUG.y, JUG.w, JUG.h);
      const major = r.minor * (r.scaleMax / r.minor > 20 ? 5 : 2);
      for (let v = r.minor; v <= r.scaleMax + 1e-6; v += r.minor) { const y = jugY(v), big = Math.abs(v / major - Math.round(v / major)) < 1e-6; ctx.strokeStyle = big ? C.ink : C.ink3; ctx.lineWidth = big ? 3 : 2; ctx.beginPath(); ctx.moveTo(JUG.x + JUG.w, y); ctx.lineTo(JUG.x + JUG.w - (big ? 30 : 16), y); ctx.stroke(); if (big) api.text(ctx, String(Math.round(v)), JUG.x + JUG.w + 12, y, { font: "mono", size: 38, weight: 600, color: C.ink2, baseline: "middle" }); }
      api.text(ctx, "ml", JUG.x + JUG.w + 12, JUG.y - 18, { font: "mono", size: 38, weight: 600, color: C.ink3, baseline: "middle" });
      if (!g.answered) api.text(ctx, T.hold, 790, 380, { font: "mono", size: 38, weight: 600, color: g.pouring ? C.volt : C.ink2, align: "center", baseline: "middle" });
      const can = g.level > 0 && !g.answered;
      ctx.save(); ctx.fillStyle = can ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, BTN.x, BTN.y, BTN.w, BTN.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, T.set, BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + 2, { font: "display", size: 40, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" });
    } else if (r.mode === "weigh") {
      const cx = 480, cy = 250, L = 230, a = g.tilt;
      ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, 470); ctx.stroke(); ctx.fillStyle = "#2A3142"; roundRect(ctx, cx - 70, 470, 140, 20, 6); ctx.fill();
      ctx.translate(cx, cy); ctx.rotate(-a); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.stroke(); ctx.restore();
      if (!g.released) { ctx.save(); ctx.fillStyle = C.amber; roundRect(ctx, cx - 14, cy - 34, 28, 22, 4); ctx.fill(); ctx.restore(); }
      const lx = cx - Math.cos(a) * L, ly = cy + Math.sin(a) * L, rx = cx + Math.cos(a) * L, ry = cy - Math.sin(a) * L;
      for (const [px, py] of [[lx, ly], [rx, ry]] as [number, number][]) { ctx.strokeStyle = C.ink3; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 60, py + 90); ctx.moveTo(px, py); ctx.lineTo(px + 60, py + 90); ctx.stroke(); ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.ellipse(px, py + 92, 74, 14, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.save(); ctx.fillStyle = "#8A6A44"; roundRect(ctx, lx - 52, ly + 22, 104, 66, 8); ctx.fill(); ctx.strokeStyle = "#C9A46A"; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      g.pan.forEach((w, i) => { const s = w >= 500 ? 1 : w >= 100 ? 0.8 : 0.62, bx = rx - 50 + (i % 4) * 30, by = ry + 78 - Math.floor(i / 4) * 30; ctx.fillStyle = "#9AA3B5"; roundRect(ctx, bx - 14 * s, by - 26 * s, 28 * s, 26 * s, 4); ctx.fill(); });
      for (const b of weightBox()) { ctx.save(); ctx.fillStyle = "rgba(24,28,38,.95)"; roundRect(ctx, b.x, b.y, 76, 80, 12); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, b.w >= 1000 ? `${b.w / 1000}kg` : String(b.w), b.x + 38, b.y + 40, { font: "mono", size: 38, weight: 600, align: "center", baseline: "middle", maxWidth: 74 }); }
      const can = g.pan.length > 0 && !g.answered;
      ctx.save(); ctx.fillStyle = can ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, BTN.x, BTN.y - 160, BTN.w, BTN.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, T.release, BTN.x + BTN.w / 2, BTN.y - 160 + BTN.h / 2 + 2, { font: "display", size: 40, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" });
    } else if (r.mode === "cut") {
      ctx.fillStyle = "rgba(240,230,200,.95)"; roundRect(ctx, RUL.x0 - 10, RUL.y, RUL.x1 - RUL.x0 + 20, 70, 6); ctx.fill();
      const major = r.minor * (r.scaleMax / r.minor > 30 ? 10 : 5);
      for (let v = 0; v <= r.scaleMax + 1e-6; v += r.minor) { const xx = rulX(v), big = Math.abs(v / major - Math.round(v / major)) < 1e-6; ctx.strokeStyle = "#1A1A1A"; ctx.lineWidth = big ? 3 : 1.5; ctx.beginPath(); ctx.moveTo(xx, RUL.y); ctx.lineTo(xx, RUL.y + (big ? 30 : 14)); ctx.stroke(); if (big) api.text(ctx, String(Math.round(v / (r.scaleMax >= 5000 ? 1000 : 10))), xx, RUL.y + 52, { font: "mono", size: 38, weight: 600, color: "#1A1A1A", align: "center", baseline: "middle" }); }
      api.text(ctx, r.scaleMax >= 5000 ? "m" : "cm", RUL.x1 + 6, RUL.y - 24, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "right", baseline: "middle" });
      const len = g.cutAt >= 0 ? g.cutAt : g.ribbon, rx2 = rulX(len);
      ctx.fillStyle = "#E0457B"; ctx.fillRect(RUL.x0, RUL.y - 34, rx2 - RUL.x0, 26); if (g.cutAt < 0) { ctx.fillStyle = "#3A4256"; ctx.beginPath(); ctx.arc(rx2 + 26, RUL.y - 21, 26, 0, Math.PI * 2); ctx.fill(); }
      if (!g.answered) api.text(ctx, T.cut, 500, 300, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
    } else if (r.mode === "clock") {
      ctx.save(); bloom(ctx, accent, CLK.x, CLK.y, CLK.r * 1.3, 0.2); ctx.fillStyle = "rgba(20,24,36,.98)"; ctx.beginPath(); ctx.arc(CLK.x, CLK.y, CLK.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
      for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2 - Math.PI / 2, big = i % 5 === 0; ctx.strokeStyle = big ? C.ink : C.ink3; ctx.lineWidth = big ? 4 : 2; ctx.beginPath(); ctx.moveTo(CLK.x + Math.cos(a) * (CLK.r - (big ? 18 : 9)), CLK.y + Math.sin(a) * (CLK.r - (big ? 18 : 9))); ctx.lineTo(CLK.x + Math.cos(a) * (CLK.r - 3), CLK.y + Math.sin(a) * (CLK.r - 3)); ctx.stroke(); if (big) api.text(ctx, String(i / 5 || 12), CLK.x + Math.cos(a) * (CLK.r - 46), CLK.y + Math.sin(a) * (CLK.r - 46), { font: "display", size: 38, weight: 700, align: "center", baseline: "middle" }); }
      const mins = g.minutes, ma = ((mins % 60) / 60) * Math.PI * 2 - Math.PI / 2, ha = (((mins / 60) % 12) / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.lineCap = "round"; ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(CLK.x, CLK.y); ctx.lineTo(CLK.x + Math.cos(ha) * 80, CLK.y + Math.sin(ha) * 80); ctx.stroke();
      ctx.strokeStyle = g.dragging ? C.volt : accent; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(CLK.x, CLK.y); ctx.lineTo(CLK.x + Math.cos(ma) * 128, CLK.y + Math.sin(ma) * 128); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(CLK.x, CLK.y, 9, 0, Math.PI * 2); ctx.fill();
      for (const [bx, lab, on] of [[640, T.am, mins < 720], [800, T.pm, mins >= 720]] as [number, string, boolean][]) { ctx.save(); ctx.fillStyle = on ? hexA(accent, 0.2) : "rgba(22,26,36,.95)"; roundRect(ctx, bx, 340, 140, 70, 16); ctx.fill(); ctx.strokeStyle = on ? accent : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, lab, bx + 70, 377, { font: "display", size: 40, weight: 800, color: on ? C.ink : C.ink3, align: "center", baseline: "middle" }); }
      const can = !g.answered;
      ctx.save(); ctx.fillStyle = can ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, BTN.x, BTN.y, BTN.w, BTN.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, T.set, BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + 2, { font: "display", size: 40, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" });
    } else {
      ctx.save(); ctx.fillStyle = "rgba(230,235,245,.12)"; roundRect(ctx, TH.x - 22, TH.y1 - 20, 44, TH.y0 - TH.y1 + 40, 22); ctx.fill(); ctx.strokeStyle = "rgba(230,235,245,.6)"; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = "#D9413B"; ctx.beginPath(); ctx.arc(TH.x, TH.y0 + 40, 32, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(TH.x - 9, thY(g.temp), 18, TH.y0 + 20 - thY(g.temp)); ctx.restore();
      const mn = tMin(), mx = tMax(), minor = r.minor, major = minor * 5;
      for (let v = Math.ceil(mn / minor) * minor; v <= mx + 1e-6; v += minor) { const y = thY(v), big = Math.abs(v / major - Math.round(v / major)) < 1e-6; ctx.strokeStyle = big ? C.ink : C.ink3; ctx.lineWidth = big ? 3 : 1.5; ctx.beginPath(); ctx.moveTo(TH.x + 26, y); ctx.lineTo(TH.x + (big ? 60 : 42), y); ctx.stroke(); if (big) api.text(ctx, String(+(v / 10).toFixed(1)), TH.x + 70, y, { font: "mono", size: 38, weight: 600, color: C.ink2, baseline: "middle" }); }
      if (!g.answered) api.text(ctx, T.tapAt, 790, 380, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 360 });
    }
    if (g.answered) {
      const ok = g.verdict === "right", col = ok ? C.mint : C.amber;
      pill(api, ctx, `${ok ? T.exact : T.offBy} · ${fmtBase(g.measured)}`, 790, 340, { color: col, size: 38 });
      if (r.mode === "weigh" && g.released) pill(api, ctx, ok ? T.balanced : g.measured < x.target ? T.heavy : T.light, 790, 410, { color: col, size: 38 });
      if (!ok) pill(api, ctx, showQty(r.mode, x.target, r.mode === "pour" ? "ml" : r.mode === "weigh" ? "g" : r.mode === "cut" ? "mm" : x.show === "after" ? "12h" : x.show, x.start), 790, r.mode === "weigh" ? 480 : 410, { color: C.ion, size: 38 });
      if (ok) tick(ctx, CARD.x + CARD.w - 20, CARD.y + 18, C.mint, 0.9); else magnifier(ctx, CARD.x + CARD.w - 24, CARD.y + 22, C.amber, 0.9);
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.measured]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.measured]] });
    drawCoach(api, ctx, "", 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), x = it(), noisy = botR() < 0.15;
    if (r.mode === "pour") {
      if (g.pouring) return { type: "wait", ms: 200 };
      const want = x.target * (noisy ? 1.05 : 1), left = want - g.level;
      if (left <= r.tol * 0.6) return { type: "tap", at: [BTN.x + BTN.w / 2, BTN.y + BTN.h / 2], after: 800 };
      const rate0 = (r.scaleMax / 9) * 0.35 * g.speedK, ms = clamp((left * (left < 150 ? 0.2 : 0.35) / rate0) * 1000, 50, 700);   // short, shrinking bursts
      return { type: "path", points: [[800, 300], [801, 300]], ms: Math.round(ms), after: 450 };
    }
    if (r.mode === "cut") { const want = x.target * (noisy ? 1.05 : 1); const dt = (want - g.ribbon) / ((r.scaleMax / 10) * g.speedK); if (dt > 0.12) return { type: "wait", ms: Math.min(1200, (dt - 0.06) * 1000) }; return { type: "tap", at: [500, 250], after: 400 }; }
    if (r.mode === "thermo") { if (Math.abs(g.temp - x.target) <= Math.max(1, r.tol * 0.5) || (noisy && Math.abs(g.temp - x.target) < 6)) return { type: "tap", at: [700, 250], after: 400 }; return { type: "wait", ms: 30 }; }
    if (r.mode === "weigh") { const sum = g.pan.reduce((a, b) => a + b, 0), need = x.target - sum + (noisy && sum === 0 ? 100 : 0); if (need <= 0) return { type: "tap", at: [BTN.x + BTN.w / 2, BTN.y - 160 + BTN.h / 2], after: 800 }; const w = WEIGHTS.find((q) => q <= need)!; const b = weightBox().find((q) => q.w === w)!; return { type: "tap", at: [b.x + 38, b.y + 40], after: 150 }; }
    const want = x.target + (noisy ? 10 : 0), d = ((want - g.minutes) % 720 + 720) % 720;
    if (Math.abs(g.minutes - want) % 1440 < 0.6 || Math.abs(Math.abs(g.minutes - want) - 1440) < 0.6) return { type: "tap", at: [BTN.x + BTN.w / 2, BTN.y + BTN.h / 2], after: 600 };
    if ((g.minutes >= 720) !== (want % 1440 >= 720) && d < 1) return { type: "tap", at: [want % 1440 >= 720 ? 870 : 710, 375], after: 300 };
    const step = Math.min(d, 50), a0 = ((g.minutes % 60) / 60) * Math.PI * 2 - Math.PI / 2, pts: [number, number][] = [];
    for (let i = 0; i <= 8; i++) { const a = a0 + ((step / 60) * Math.PI * 2 * i) / 8; pts.push([CLK.x + Math.cos(a) * 120, CLK.y + Math.sin(a) * 120]); }
    return { type: "path", points: pts, ms: 500, after: 150 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, k: g.k, level: Math.round(g.level), ribbon: Math.round(g.ribbon), minutes: Math.round(g.minutes), temp: Math.round(g.temp), pan: g.pan.reduce((a, b) => a + b, 0), right: g.right, n: g.n }),
    knob(k) { if (k === "slower" || k === "easier") { g.speedK = Math.max(0.5, g.speedK * 0.8); return true; } if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; } if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; return { title: spec.title, lines: r0.items.slice(0, 3).map((i) => `${showQty(r0.mode, i.target, i.show, i.start)} = ${showQty(r0.mode, i.target, r0.mode === "pour" ? "ml" : r0.mode === "weigh" ? "g" : r0.mode === "cut" ? "cm" : "12h")}`), figure: { kind: "none" }, accent }; },
  };
}
export const instrument: EngineDef<InstrumentSpec> = { archetype: "instrument@1", label: "Game · Instrument Bench", accent: C.ion, create };
