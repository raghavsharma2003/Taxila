// TRAFFIC CENSUS — `data-rush@1` (STUDIO-V2 §6.1 #22). Real-time data collection, then a cinematic mean: traffic
// streams past for N "minutes"; the child taps every car (and only cars) to tally it. Each minute's bar grows live on
// a scaled chart (each square = 2), then the census camera corrects it to the true count. Last, the child drags a line
// to where the mean is; the bars above pour into the bars below until all are level. An outlier minute (a jam) shows
// why the mean need not be a data value. Tallies and the mean estimate are the acts; the host grades both.
import { DATA_THEMES, dataMean, dataStream, type DataSpec, type Vehicle } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, lerp, rng } from "../core/math.ts";
import { bloom, roundRect, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../core/types.ts";

const MIN_S = 7, ROAD_Y = 230, LANES = [205, 268], CH = { x0: 150, x1: 860, base: 575, top: 345 };
const SHAPE: Record<string, { w: number; h: number; col: string }> = { car: { w: 74, h: 36, col: "#9AA7FF" }, bus: { w: 150, h: 42, col: "#C9D0E6" }, bike: { w: 46, h: 18, col: "#A9B0C0" }, auto: { w: 60, h: 34, col: "#CBD58A" }, truck: { w: 130, h: 44, col: "#B7A79A" } };
interface Car { v: Vehicle; idx: number; x: number; tapped: boolean; flash: number; gone: boolean }

function create(api: EngineApi, spec: DataSpec): EngineInstance {
  const T = spec.strings, theme = DATA_THEMES[spec.theme], stream = dataStream(spec, MIN_S), M = spec.counts.length;
  const yMax = Math.max(...spec.counts, 4) + 2, step = spec.scaleStep, gridMax = Math.ceil(yMax / step) * step;
  const g = { state: "boot" as "boot" | "intro" | "count" | "census" | "mean" | "level" | "final", minute: -1, mt: 0, stateT: 0, cars: [] as Car[], spawned: 0, tallies: new Array(M).fill(0), shown: new Array(M).fill(0), official: new Array(M).fill(false),
    falseTaps: 0, line: gridMax * 0.75, dragging: false, meanAnswer: null as null | { v: number; verdict: string }, levelK: 0, introA: 0, coachA: 1, coachGone: false, bootT: 0, finalA: 0, censusT: 0, tallyRight: 0 };
  const botRnd = rng(api.seed * 23 + 11);
  const hud = api.hud([{ key: "min", label: T.minute }, { key: "tally", label: T.tally }, { key: "scale", label: T.scale }]);
  const bw = (CH.x1 - CH.x0) / M, yOf = (v: number) => CH.base - (v / gridMax) * (CH.base - CH.top), vOf = (y: number) => ((CH.base - y) / (CH.base - CH.top)) * gridMax;
  const mean = dataMean(spec.counts);
  function startMinute(m: number) { g.minute = m; g.mt = 0; g.state = "count"; g.stateT = 0; api.event("minute_start", { minute: m + 1 }); }
  api.onPointer({
    down(p) {
      if (!g.coachGone && g.state === "count") { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); }
      if (g.state === "count") {
        let best: Car | null = null, bd = 1e9;
        for (const c of g.cars) { if (c.gone || c.tapped) continue; const sh = SHAPE[c.v.kind], y = LANES[c.v.lane]; if (Math.abs(p.x - c.x) < sh.w / 2 + 26 && Math.abs(p.y - y) < sh.h / 2 + 30) { const d = Math.abs(p.x - c.x); if (d < bd) { bd = d; best = c; } } }
        if (!best) return;
        best.tapped = true; best.flash = 1;
        if (best.v.kind === theme.target) { g.tallies[best.v.minute]++; sfx.blip({ f: 720 + g.tallies[best.v.minute] * 30, dur: 0.07, type: "triangle", gain: 0.14 }); api.fx.burst(best.x, LANES[best.v.lane], { n: 10, color: C.ion, speed: 220, life: 0.4, size: 8 }); }
        else { g.falseTaps++; sfx.blip({ f: 220, f2: 160, dur: 0.1, gain: 0.12 }); api.fx.pop(T.extra, best.x, LANES[best.v.lane] - 46, { color: C.amber, size: 38, life: 0.9, rise: 30 }); api.event("false_tap", { kind: best.v.kind }); }
        return;
      }
      if (g.state === "mean") { g.dragging = true; g.line = clamp(vOf(p.y), 0, gridMax); }
    },
    move(p) { if (g.dragging && g.state === "mean") g.line = clamp(vOf(p.y), 0, gridMax); },
    up() {
      if (!g.dragging || g.state !== "mean") return;
      g.dragging = false;
      const v = +g.line.toFixed(2), local = Math.abs(v - mean) <= 0.35 ? "right" : Math.abs(v - mean) <= 0.8 ? "partial" : "wrong";
      const grade = api.answer("mean", v, local);
      g.meanAnswer = { v, verdict: grade.verdict }; g.state = "level"; g.stateT = 0; g.levelK = 0;
      api.tw.add(g, { levelK: 1 }, { dur: 2.4, ease: "inOutCubic", delay: 0.3 });
      sfx.noise({ dur: 1.6, f: 600, gain: 0.08 });
      api.facts({ meanTruth: +mean.toFixed(2), meanChild: v, verdict: grade.verdict, ...(grade.detail ? { detail: grade.detail } : {}) });
    },
  });
  function update(dt: number) {
    g.stateT += dt;
    for (const c of g.cars) c.flash = Math.max(0, c.flash - dt * 2);
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); g.state = "intro"; g.stateT = 0; api.tw.add(g, { introA: 1 }, { dur: 0.45 }); api.task(`${theme.unit} ${T.per}`, T.coach); } return; }
    if (g.state === "intro" && g.stateT > 2) { api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); startMinute(0); }
    const vpx = 250 * spec.speed;
    if (g.state === "count") {
      g.mt += dt;
      while (g.spawned < stream.length && stream[g.spawned].minute === g.minute && stream[g.spawned].at <= g.mt) { const v = stream[g.spawned]; g.cars.push({ v, idx: g.spawned, x: -90, tapped: false, flash: 0, gone: false }); g.spawned++; }
      const done = (g.spawned >= stream.length || stream[g.spawned].minute !== g.minute) && g.cars.every((c) => c.gone || c.v.minute !== g.minute);
      if (done) {
        g.state = "census"; g.stateT = 0; g.censusT = 0;
        const grade = api.answer(`m${g.minute + 1}`, g.tallies[g.minute], g.tallies[g.minute] === spec.counts[g.minute] ? "right" : Math.abs(g.tallies[g.minute] - spec.counts[g.minute]) <= 1 ? "partial" : "wrong");
        if (grade.verdict === "right") { g.tallyRight++; api.fx.ring(CH.x0 + bw * (g.minute + 0.5), yOf(spec.counts[g.minute]), { color: C.mint, r0: 6, r1: 60, life: 0.5, width: 5 }); sfx.blip({ f: 660, f2: 990, dur: 0.16, type: "triangle", gain: 0.16 }); }
      }
    }
    for (const c of g.cars) { if (c.gone) continue; c.x += vpx * c.v.speed * dt; if (c.x > W + 120) c.gone = true; }
    g.cars = g.cars.filter((c) => !c.gone || c.flash > 0);
    for (let m = 0; m < M; m++) { const target = g.official[m] ? spec.counts[m] : g.tallies[m]; g.shown[m] = lerp(g.shown[m], target, 1 - Math.exp(-dt * 8)); }
    if (g.state === "census") {
      g.censusT += dt;
      if (g.censusT > 0.5 && !g.official[g.minute]) { g.official[g.minute] = true; api.event("census", { minute: g.minute + 1, tally: g.tallies[g.minute], truth: spec.counts[g.minute] }); }
      if (g.censusT > 1.8) { if (g.minute + 1 < M) startMinute(g.minute + 1); else { g.state = "mean"; g.stateT = 0; api.task("", T.mean); } }
    }
    if (g.state === "level" && g.stateT > 4.2) { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.runDone, "done"); api.done({ tallyRight: g.tallyRight, minutes: M, falseTaps: g.falseTaps, mean: g.meanAnswer }); }
    if (g.state !== "final") { hud.set("min", g.minute >= 0 ? `${Math.min(g.minute + 1, M)}/${M}` : "—"); hud.set("tally", g.minute >= 0 && g.state !== "mean" && g.state !== "level" ? `${g.tallies[g.minute]}` : "—", { bump: true }); hud.set("scale", `${step}`); }
  }
  function drawVehicle(ctx: Ctx, kind: string, x: number, y: number, flash: number, tapped: boolean) {
    const sh = SHAPE[kind] ?? SHAPE.car;
    ctx.save(); ctx.translate(x, y);
    if (flash > 0) bloom(ctx, kind === theme.target ? C.ion : C.amber, 0, 0, sh.w, flash * 0.6);
    ctx.fillStyle = "rgba(0,0,0,.35)"; roundRect(ctx, -sh.w / 2 + 4, -sh.h / 2 + 6, sh.w, sh.h, 10); ctx.fill();
    ctx.fillStyle = sh.col; roundRect(ctx, -sh.w / 2, -sh.h / 2, sh.w, sh.h, kind === "bike" ? 9 : 10); ctx.fill();
    ctx.fillStyle = "rgba(10,12,20,.55)";
    if (kind === "car") { roundRect(ctx, -sh.w / 2 + 14, -sh.h / 2 + 5, 18, sh.h - 10, 4); ctx.fill(); roundRect(ctx, sh.w / 2 - 26, -sh.h / 2 + 5, 14, sh.h - 10, 4); ctx.fill(); }
    else if (kind === "bus") { for (let i = 0; i < 6; i++) { roundRect(ctx, -sh.w / 2 + 12 + i * 22, -sh.h / 2 + 6, 14, sh.h - 12, 3); ctx.fill(); } }
    else if (kind === "truck") { roundRect(ctx, sh.w / 2 - 34, -sh.h / 2 + 4, 28, sh.h - 8, 5); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(-sh.w / 2 + 6, -sh.h / 2 + 6, sh.w - 48, sh.h - 12); }
    else if (kind === "auto") { ctx.fillStyle = "#1F2536"; roundRect(ctx, -sh.w / 2 + 6, -sh.h / 2 + 4, sh.w - 22, sh.h - 8, 8); ctx.fill(); }
    else if (kind === "bike") { ctx.fillStyle = "#1F2536"; ctx.fillRect(-6, -sh.h / 2 + 3, 12, sh.h - 6); }
    ctx.fillStyle = "#FFF2C0"; ctx.fillRect(sh.w / 2 - 4, -sh.h / 2 + 4, 4, 6); ctx.fillRect(sh.w / 2 - 4, sh.h / 2 - 10, 4, 6);
    ctx.restore();
    if (tapped && kind === theme.target) tick(ctx, x, y - sh.h / 2 - 16, C.ion, 0.8);
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0A0C12"); gr.addColorStop(1, "#0E1118"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "#151924"; c.fillRect(0, ROAD_Y - 64, W, 128);
    c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 3; c.setLineDash([26, 20]); c.beginPath(); c.moveTo(0, ROAD_Y + 5); c.lineTo(W, ROAD_Y + 5); c.stroke(); c.setLineDash([]);
    c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, ROAD_Y - 64); c.lineTo(W, ROAD_Y - 64); c.moveTo(0, ROAD_Y + 64); c.lineTo(W, ROAD_Y + 64); c.stroke();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // census camera on the roadside
    ctx.fillStyle = "#1F2536"; roundRect(ctx, 880, ROAD_Y - 110, 70, 34, 8); ctx.fill(); ctx.fillStyle = g.state === "census" ? C.mint : "#3A4256"; ctx.beginPath(); ctx.arc(915, ROAD_Y - 93, 8, 0, Math.PI * 2); ctx.fill();
    for (const c of g.cars) if (!c.gone) drawVehicle(ctx, c.v.kind, c.x, LANES[c.v.lane], c.flash, c.tapped);
    // chart
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 2;
    const every = (CH.base - CH.top) / (gridMax / step) < 44 ? 2 : 1;
    for (let v = 0, k = 0; v <= gridMax; v += step, k++) { const y = yOf(v); ctx.beginPath(); ctx.moveTo(CH.x0, y); ctx.lineTo(CH.x1, y); ctx.stroke(); if (k % every === 0) api.text(ctx, String(v), CH.x0 - 16, y + 2, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "right", baseline: "middle" }); }
    const level = g.state === "level" || g.state === "final" ? g.levelK : 0;
    for (let m = 0; m < M; m++) {
      if (m > g.minute && !(g.state === "mean" || g.state === "level" || g.state === "final")) continue;
      const v = lerp(g.shown[m], mean, level), x = CH.x0 + bw * m + bw * 0.18, w = bw * 0.64, y = yOf(v);
      ctx.fillStyle = g.official[m] ? (g.tallies[m] === spec.counts[m] ? "rgba(139,152,255,.85)" : "rgba(139,152,255,.7)") : "rgba(139,152,255,.45)";
      roundRect(ctx, x, y, w, CH.base - y, 8); ctx.fill();
      if (m === g.minute && g.state === "count") { ctx.strokeStyle = C.ion; ctx.lineWidth = 3; ctx.stroke(); }
      if (g.official[m] && g.tallies[m] !== spec.counts[m] && level < 0.05) pill(api, ctx, `${T.missed} ${spec.counts[m] - g.tallies[m]}`, x + w / 2, Math.max(CH.top + 20, y - 34), { color: C.amber, size: 38 });
      else if (g.official[m] && level < 0.05) api.text(ctx, String(spec.counts[m]), x + w / 2, y - 22, { font: "display", size: 44, weight: 800, align: "center" });
      api.text(ctx, `${m + 1}`, x + w / 2, CH.base + 34, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" });
    }
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(CH.x0 - 6, CH.base); ctx.lineTo(CH.x1, CH.base); ctx.stroke();
    if (g.state === "mean" || g.state === "level" || g.state === "final") {
      const y = yOf(g.state === "mean" ? g.line : g.meanAnswer?.v ?? g.line);
      ctx.strokeStyle = g.state === "mean" ? C.volt : g.meanAnswer?.verdict === "right" ? C.mint : C.amber; ctx.lineWidth = 5; ctx.setLineDash(g.state === "mean" ? [] : [12, 10]);
      ctx.beginPath(); ctx.moveTo(CH.x0 - 6, y); ctx.lineTo(CH.x1 + 6, y); ctx.stroke(); ctx.setLineDash([]);
      if (g.state === "mean") { ctx.fillStyle = C.volt; ctx.beginPath(); ctx.arc(CH.x1 + 30, y, 16, 0, Math.PI * 2); ctx.fill(); pill(api, ctx, (Math.round(g.line * 10) / 10).toString(), CH.x1 + 74, y, { color: C.volt, size: 38 }); }
      if (g.state !== "mean" && level > 0.95) { const ym = yOf(mean); ctx.strokeStyle = C.mint; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(CH.x0 - 6, ym); ctx.lineTo(CH.x1 + 6, ym); ctx.stroke(); pill(api, ctx, `mean ${Math.round(mean * 100) / 100}`, (CH.x0 + CH.x1) / 2, ym - 36, { color: C.mint }); }
    }
    fx.drawWorld(ctx); ctx.restore();
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${M} minutes · ${theme.unit}`, title: "Count the cars", sub: `${T.scale} ${step}` });
    if (g.state === "census") pill(api, ctx, T.census, 500, 330, { color: C.mint });
    if (g.state === "final") drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.tallyRight}/${M}`, "exact tallies"], [`${Math.round(mean * 100) / 100}`, "mean"], [`${g.meanAnswer?.v ?? "—"}`, "your line"]], foot: g.meanAnswer && !spec.counts.some((c) => Math.abs(c - mean) < 0.01) ? "the mean need not be one of the counts" : undefined, footColor: C.ink2 });
    drawCoach(api, ctx, T.coach, g.state === "count" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (g.state === "count") {
      const c = g.cars.filter((x) => !x.gone && !x.tapped && x.x > 260 && x.x < 760 && x.v.kind === theme.target).sort((a, b) => b.x - a.x)[0];
      if (!c) { const d = g.cars.find((x) => !x.gone && !x.tapped && x.x > 300 && x.x < 700 && x.v.kind !== theme.target); if (d && botRnd() < 0.04) return { type: "tap", at: [d.x + 20, LANES[d.v.lane]], after: 120 }; return { type: "wait", ms: 80 }; }
      if (botRnd() < 0.06) return { type: "wait", ms: 400 };             // a missed car now and then
      return { type: "tap", at: [c.x + 250 * spec.speed * c.v.speed * 0.07, LANES[c.v.lane]], after: 90 };
    }
    if (g.state === "mean") { const target = clamp(mean + (botRnd() - 0.5) * 0.8, 0, gridMax); return { type: "drag", from: [CH.x1 - 40, yOf(g.line)], to: [CH.x1 - 40, yOf(target)], ms: 600, after: 600 }; }
    return { type: "wait", ms: 250 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, minute: g.minute + 1, tallies: g.tallies, cars: g.cars.filter((c) => !c.gone).length, mean }),
    knob(k) { if (k === "slower" || k === "easier") { spec = { ...spec, speed: Math.max(0.6, spec.speed * 0.85) }; return true; } return false; },
    board: () => ({ title: `Mean = ${Math.round(mean * 100) / 100}`, lines: [`${spec.counts.join(" + ")} = ${spec.counts.reduce((a, b) => a + b, 0)}`, `shared equally over ${M} minutes`], figure: { kind: "bars", values: spec.counts, labels: spec.counts.map((_, i) => `${i + 1}`), line: mean }, accent: C.ion }),
  };
}
export const data: EngineDef<DataSpec> = { archetype: "data-rush@1", label: "Game · Traffic Census", accent: C.ion, create };
