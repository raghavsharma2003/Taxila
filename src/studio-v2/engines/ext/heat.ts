// HEAT & MATTER LAB — `heat-lab@1` (VALUES-100 V3.1: conduction, convection, radiation; separating mixtures). Every
// outcome on screen comes from the model the host grades with (shared/studio-spec-ext/heat.ts):
//   conduct  — tap the rods in the order you think their wax pins will fall, then HEAT: the rods glow by a 1-D heat flow
//              using each material's diffusivity and the pins drop when their spot passes 60 °C (time is sped up)
//   breeze   — the sun is at the asked hour; dip the thermometer in the sea and on the land, then send the breeze; the
//              convection loop then runs the true way round
//   radiate  — tanks of different finishes on a roof: pick the one that best keeps the water cool (or warm), RUN an hour
//              of sun and watch every thermometer
//   separate — tap a machine to run the mixture through it; it splits into what was caught and what passed; tap the
//              bowl to keep; repeat until only the target is left (dry)
import { FLAME_C, MACHINES, MELT_C, PIN_AT, PROPS, ROD_N, ROD_T, ROOM_C, bestFinish, breezeAt, fallTimes, isPure, landC, machine, rodStep, seaC, separatePlan, tankC, type Comp, type HeatSpec, type HlRoundT, type Machine, type Stream } from "../../../../shared/studio-spec-ext/heat.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill } from "./kit.ts";

const BTN = { x: 800, y: 520, w: 170, h: 66 }, RESET = { x: 770, y: 572, w: 220, h: 44 };
const ROD = { x0: 230, x1: 660 };
const rodY = (i: number, n: number) => 250 + i * (n > 3 ? 82 : 100);
const COMP_COL: Record<Comp, string> = { stones: "#8E96A8", rice: "#F2EEDC", flour: "#EDE6D3", husk: "#C9A26B", sand: "#D9B36C", salt: "#FFFFFF", sugar: "#FFF4D6", iron: "#5A6070", sawdust: "#B88B5A", chalk: "#F4F4F4" };
const MCH = (i: number) => ({ x: 770, y: 178 + i * 56, w: 220, h: 48 });
const BOWL = { main: [360, 330] as [number, number], caught: [250, 500] as [number, number], passed: [520, 500] as [number, number] };
const FIN_COL: Record<string, string> = { black: "#15171C", dark: "#3E4A5C", white: "#F2F4F8", shiny: "#C8D0DC" };
const heatCol = (t: number) => { const f = clamp((t - ROOM_C) / (FLAME_C - ROOM_C), 0, 1); return `rgb(${Math.round(lerp(90, 255, Math.min(1, f * 2)))},${Math.round(lerp(100, 120, f) * (1 - f * 0.4))},${Math.round(lerp(120, 40, f))})`; };
function create(api: EngineApi, spec: HeatSpec): EngineInstance {
  const T = spec.strings, accent = "#FF8F6B";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 167 + 11), setTask = taskPill(api);
  const g = {
    k: 0, order: [] as number[], temps: [] as number[][], heating: false, ht: 0, fell: [] as number[], pinY: [] as number[],
    probe: { sea: false, land: false }, loopT: 0, from: "" as "" | "sea" | "land",
    pick: -1, run: false, rt: 0,
    stream: { items: [], wet: false } as Stream, split: null as null | [Stream, Stream], lastM: "" as string, steps: [] as [string, number][], anim: 0, lost: false,
    answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, plan: [] as [Machine, number][],
  };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): HlRoundT => spec.rounds[Math.max(0, flow.round)];
  const units = () => { const r = rd(); return r.mode === "breeze" ? r.asks.length : 1; };
  function reset() {
    const r = rd();
    Object.assign(g, { order: [], heating: false, ht: 0, fell: [], pinY: [], probe: { sea: false, land: false }, loopT: 0, from: "", pick: -1, run: false, rt: 0, split: null, lastM: "", steps: [], anim: 0, lost: false, answered: false, verdict: "", detail: "", revealT: 0 });
    if (r.mode === "conduct") { g.temps = r.rods.map(() => { const t = Array(ROD_N).fill(ROOM_C); t[0] = FLAME_C; return t; }); g.fell = r.rods.map(() => -1); g.pinY = r.rods.map(() => 0); }
    if (r.mode === "separate") { g.stream = { items: [...r.mix], wet: false }; g.plan = separatePlan(r.mix, r.target) ?? []; }
    const goal = r.mode === "conduct" ? T.first : r.mode === "breeze" ? `${hourText(r.asks[g.k])}: ${r.sub || r.title}` : r.mode === "radiate" ? (r.goal === "cool" ? T.keepCool : T.keepWarm) : `${T.target} ${T[r.target]}`;
    setTask(`${T.round} ${flow.round + 1}`, goal);
  }
  const hourText = (h: number) => `${((h + 11) % 12) + 1} ${h < 12 ? "a.m." : "p.m."}`;
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.k = 0; reset(); api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1 }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function judge(item: string, value: unknown, local: "right" | "wrong") {
    const grade = api.answer(item, value, local);
    g.answered = true; g.verdict = grade.verdict; g.detail = grade.detail ?? ""; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(40); } else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, verdict: grade.verdict, detail: g.detail });
  }
  const inB = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const tanks = () => { const r = rd() as Extract<HlRoundT, { mode: "radiate" }>; const n = r.options.length, w = 560 / n; return r.options.map((f, i) => ({ f, x: 140 + i * w + w / 2, y: 330 })); };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd();
      if (r.mode === "conduct") {
        if (g.heating) return;
        if (inB(p, BTN) && g.order.length === r.rods.length) { g.heating = true; g.ht = 0; api.record("heat", { order: g.order }); sfx.noise({ dur: 0.5, f: 600, filter: "lowpass", gain: 0.06 }); return; }
        r.rods.forEach((_, i) => { const y = rodY(i, r.rods.length); if (p.y > y - 40 && p.y < y + 40 && p.x > ROD.x0 - 40 && p.x < ROD.x1 + 40) { const at = g.order.indexOf(i); if (at >= 0) g.order.splice(at, 1); else g.order.push(i); sfx.blip({ f: 440 + g.order.length * 80, dur: 0.06, type: "triangle", gain: 0.08 }); } });
        return;
      }
      if (r.mode === "breeze") {
        if (p.y > 330 && p.y < 540 && p.x > 100 && p.x < 760) { const side = p.x < 430 ? "sea" : "land"; g.probe[side] = true; api.record("probe", { side, hour: r.asks[g.k] }); sfx.blip({ f: 700, dur: 0.05, type: "sine", gain: 0.06 }); return; }
        for (const [side, b] of [["sea", { x: 780, y: 300, w: 200, h: 80 }], ["land", { x: 780, y: 410, w: 200, h: 80 }]] as const) if (inB(p, b)) { g.from = side; judge(`r${flow.round + 1}:${g.k}`, { from: side, probed: { ...g.probe } }, breezeAt(r.asks[g.k]) === side ? "right" : "wrong"); return; }
        return;
      }
      if (r.mode === "radiate") {
        if (g.run) return;
        if (inB(p, BTN) && g.pick >= 0) { g.run = true; g.rt = 0; api.record("run", { finish: r.options[g.pick] }); return; }
        tanks().forEach((t, i) => { if (Math.abs(p.x - t.x) < 70 && Math.abs(p.y - t.y) < 90) { g.pick = i; sfx.blip({ f: 500, dur: 0.05, type: "triangle", gain: 0.08 }); } });
        return;
      }
      if (g.anim > 0) return;
      const sp = g.split; if (sp) { for (const [k, at] of [[0, BOWL.caught], [1, BOWL.passed]] as const) if (Math.hypot(p.x - at[0], p.y - at[1]) < 100) { g.stream = sp[k]; g.steps.push([g.lastM, k]); g.split = null; api.record("keep", { machine: g.lastM, keep: k ? "passed" : "caught" }); sfx.blip({ f: 600, dur: 0.06, type: "triangle", gain: 0.08 }); afterKeep(); } return; }
      if (inB(p, RESET) && g.steps.length) { g.stream = { items: [...r.mix], wet: false }; g.steps = []; g.lost = false; api.record("restart", {}); return; }
      MACHINES.forEach((m, i) => { if (inB(p, MCH(i))) { const out = machine(m, g.stream); if (!out) { api.fx.shake(3, 0.15); sfx.blip({ f: 180, dur: 0.1, gain: 0.08 }); return; } g.split = out; g.lastM = m; g.anim = 1.1; api.record("machine", { machine: m }); sfx.noise({ dur: 0.4, f: 1200, filter: "bandpass", gain: 0.05 }); } });
    },
  });
  function afterKeep() {
    const r = rd() as Extract<HlRoundT, { mode: "separate" }>;
    if (isPure(g.stream, r.target)) { judge(`r${flow.round + 1}`, { steps: g.steps }, g.steps.length <= r.maxSteps ? "right" : "wrong"); return; }
    g.lost = !g.stream.items.includes(r.target);
    if (g.steps.length >= 10) judge(`r${flow.round + 1}`, { steps: g.steps }, "wrong");
  }
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    if (r.mode === "conduct" && g.heating && !g.answered) {
      g.ht += dt; g.temps = g.temps.map((t, i) => rodStep(t, r.rods[i], dt));
      g.temps.forEach((t, i) => { if (g.fell[i] < 0 && t[PIN_AT] >= MELT_C) { g.fell[i] = g.ht; sfx.blip({ f: 880 - i * 120, dur: 0.08, type: "triangle", gain: 0.1 }); } });
      const ft = fallTimes(r.rods), allDone = g.fell.every((f, i) => f >= 0 || !Number.isFinite(ft[i]));
      if ((allDone && g.ht > Math.max(...ft.filter(Number.isFinite)) + 1.5) || g.ht > ROD_T) judge(`r${flow.round + 1}`, { order: g.order }, "right");
    }
    if (r.mode === "conduct") g.fell.forEach((f, i) => { if (f >= 0) g.pinY[i] = Math.min(200, g.pinY[i] + dt * (200 + g.pinY[i] * 6)); });
    if (r.mode === "breeze" && g.answered) g.loopT += dt;
    if (r.mode === "radiate" && g.run && !g.answered) { g.rt += dt; if (g.rt > 4.2) judge(`r${flow.round + 1}`, { finish: r.options[g.pick] }, r.options[g.pick] === bestFinish(r) ? "right" : "wrong"); }
    if (g.anim > 0) g.anim = Math.max(0, g.anim - dt);
    if (g.answered) { g.revealT += dt; if (g.revealT > (r.mode === "breeze" ? 3.4 : 3)) { if (g.k + 1 < units()) { g.k++; reset(); } else flow.endRound(); } }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 167, 0); }
  function button(ctx: Ctx, b: { x: number; y: number; w: number; h: number }, label: string, on: boolean, now: number, col: string = C.volt) {
    ctx.save(); ctx.fillStyle = on ? hexA(col, 0.14) : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill(); ctx.strokeStyle = on ? hexA(col, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 2, { size: 38, weight: 700, color: on ? col : C.ink3, align: "center", baseline: "middle", maxWidth: b.w - 14 });
  }
  function bowl(ctx: Ctx, s: Stream, x: number, y: number, scale: number, seed: number, hot = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    if (hot) bloom(ctx, C.volt, 0, -10, 110, 0.25);
    ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.ellipse(0, 0, 100, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-100, 0); ctx.quadraticCurveTo(-90, 80, 0, 82); ctx.quadraticCurveTo(90, 80, 100, 0); ctx.fillStyle = "#2A3142"; ctx.fill(); ctx.strokeStyle = hot ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke();
    if (s.wet) { ctx.fillStyle = "rgba(90,160,255,.45)"; ctx.beginPath(); ctx.ellipse(0, 8, 92, 22, 0, 0, Math.PI * 2); ctx.fill(); }
    const rr = rng(seed);
    s.items.forEach((c, ci) => { const pr = PROPS[c]; for (let i = 0; i < (pr.big ? 6 : 16); i++) { const px = (rr() - 0.5) * 160, py = (rr() - 0.4) * 34 + (pr.light ? -8 : 4); ctx.globalAlpha = s.wet && pr.soluble ? 0.25 : 1; ctx.fillStyle = COMP_COL[c]; if (c === "salt" || c === "sugar") ctx.fillRect(px - 3, py - 3, 6, 6); else if (c === "iron") { ctx.fillRect(px - 5, py - 1, 10, 2.5); } else { ctx.beginPath(); ctx.ellipse(px, py, pr.big ? 9 : pr.light ? 6 : 3.5, pr.big ? 6 : pr.light ? 2.5 : 3.5, ci, 0, Math.PI * 2); ctx.fill(); } } });
    ctx.globalAlpha = 1; ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "conduct") {
      const n = r.rods.length;
      ctx.save(); ctx.fillStyle = "#3A4256"; ctx.fillRect(ROD.x0 - 26, rodY(0, n) - 50, 26, rodY(n - 1, n) - rodY(0, n) + 100); ctx.restore();
      r.rods.forEach((m, i) => {
        const y = rodY(i, n), t = g.temps[i] ?? [];
        for (let c = 0; c < ROD_N; c++) { ctx.fillStyle = heatCol(t[c] ?? ROOM_C); ctx.fillRect(ROD.x0 + (c * (ROD.x1 - ROD.x0)) / ROD_N, y - 9, (ROD.x1 - ROD.x0) / ROD_N + 1, 18); }
        const px = ROD.x0 + ((PIN_AT + 0.5) * (ROD.x1 - ROD.x0)) / ROD_N, py = y + 12 + g.pinY[i];
        ctx.save(); ctx.fillStyle = "#F3E7C4"; ctx.beginPath(); ctx.ellipse(px, y + 14, 9, 6, 0, 0, Math.PI * 2); ctx.globalAlpha = g.fell[i] >= 0 ? 0.3 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = "#C9D2E8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 30); ctx.stroke(); ctx.restore();
        api.text(ctx, T[m], ROD.x0, y - 34, { size: 38, weight: 700, color: C.ink2, baseline: "middle" });
        const rank = g.order.indexOf(i); if (rank >= 0) { ctx.save(); ctx.fillStyle = C.volt; ctx.beginPath(); ctx.arc(ROD.x1 + 46, y, 24, 0, Math.PI * 2); ctx.fill(); ctx.restore(); api.text(ctx, String(rank + 1), ROD.x1 + 46, y + 2, { font: "display", size: 38, weight: 800, color: "#0B0E14", align: "center", baseline: "middle" }); }
        if (g.fell[i] >= 0) api.text(ctx, `${g.fell[i].toFixed(1)} s`, px, y - 34, { font: "mono", size: 38, weight: 600, color: C.sun, align: "center", baseline: "middle", decor: true });
      });
      const fy = rodY(n - 1, n) + 70, fl = 1 + Math.sin(now * 20) * 0.1; if (g.heating) { bloom(ctx, C.sun, ROD.x0 - 13, fy - 20, 60, 0.6); ctx.save(); ctx.fillStyle = "#FFB547"; ctx.beginPath(); ctx.ellipse(ROD.x0 - 13, fy - 20 * fl, 14, 30 * fl, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.fillStyle = "#E8ECF5"; ctx.fillRect(ROD.x0 - 25, fy, 24, 40); ctx.restore();
      if (g.heating) api.text(ctx, `${g.ht.toFixed(1)} s`, 880, 300, { font: "display", size: 44, weight: 800, color: C.ink, align: "center", baseline: "middle" });
      button(ctx, BTN, T.heat, !done && !g.heating && g.order.length === n, now, C.sun);
    } else if (r.mode === "breeze") {
      const h = r.asks[g.k], day = h >= 6 && h < 18, a = ((h - 6) / 12) * Math.PI, sx = 430 - Math.cos(a) * 300, sy = 330 - Math.sin(a) * 140;
      ctx.save(); ctx.fillStyle = day ? "rgba(120,170,230,.12)" : "rgba(20,30,60,.4)"; ctx.fillRect(100, 170, 660, 200); ctx.restore();
      if (day) { bloom(ctx, C.sun, sx, sy, 60, 0.7); ctx.save(); ctx.fillStyle = C.sun; ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } else { ctx.save(); ctx.fillStyle = "#E8ECF5"; ctx.beginPath(); ctx.arc(640, 210, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#151A28"; ctx.beginPath(); ctx.arc(650, 204, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.fillStyle = "#1F5D8C"; ctx.fillRect(100, 400, 330, 130); ctx.fillStyle = "#6D5A3A"; ctx.beginPath(); ctx.moveTo(430, 400); ctx.lineTo(760, 380); ctx.lineTo(760, 530); ctx.lineTo(430, 530); ctx.fill(); ctx.restore();
      api.text(ctx, T.sea, 265, 470, { size: 38, weight: 700, color: "#CFE3FF", align: "center", baseline: "middle" });
      api.text(ctx, T.land, 600, 470, { size: 38, weight: 700, color: "#F3E1C0", align: "center", baseline: "middle" });
      if (g.probe.sea) pill(api, ctx, `${seaC(h).toFixed(0)} °C`, 265, 560, { color: "#9FD0FF", size: 38 });
      if (g.probe.land) pill(api, ctx, `${landC(h).toFixed(0)} °C`, 600, 560, { color: "#FFD49A", size: 38 });
      api.text(ctx, hourText(h), 430, 200, { font: "display", size: 44, weight: 800, color: C.ink, align: "center", baseline: "middle" });
      if (done) { // the true convection loop
        const toLand = breezeAt(h) === "sea", warmX = toLand ? 600 : 265, coolX = toLand ? 265 : 600;
        ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.strokeRect(Math.min(coolX, warmX), 250, Math.abs(warmX - coolX), 135); ctx.setLineDash([]); ctx.fillStyle = "#BFE4FF"; const ax = (coolX + warmX) / 2, dir = Math.sign(warmX - coolX); ctx.beginPath(); ctx.moveTo(ax + dir * 16, 385); ctx.lineTo(ax - dir * 10, 373); ctx.lineTo(ax - dir * 10, 397); ctx.fill(); ctx.restore();
        for (let i = 0; i < 18; i++) { const f = ((g.loopT * 0.35 + i / 18) % 1), pts: [number, number][] = [[coolX, 385], [warmX, 385], [warmX, 250], [coolX, 250], [coolX, 385]]; const seg = Math.floor(f * 4), k = f * 4 - seg, [x0, y0] = pts[seg], [x1, y1] = pts[seg + 1]; ctx.save(); ctx.fillStyle = seg === 0 ? "#BFE4FF" : seg === 1 ? "#FFB0A0" : "#E0E6F0"; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(lerp(x0, x1, k), lerp(y0, y1, k), 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      }
      button(ctx, { x: 780, y: 300, w: 200, h: 80 }, T.seaBreeze, !done, now, C.ion);
      button(ctx, { x: 780, y: 410, w: 200, h: 80 }, T.landBreeze, !done, now, C.sun);
    } else if (r.mode === "radiate") {
      ctx.save(); ctx.fillStyle = "#4A3A2E"; ctx.beginPath(); ctx.moveTo(110, 470); ctx.lineTo(430, 420); ctx.lineTo(750, 470); ctx.fill(); ctx.restore();
      bloom(ctx, C.sun, 680, 200, 70, 0.7); ctx.save(); ctx.fillStyle = C.sun; ctx.beginPath(); ctx.arc(680, 200, 26, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      tanks().forEach((t, i) => {
        const minutes = g.run || done ? Math.min(60, (g.rt / 4) * 60) : 0, temp = tankC(t.f, minutes), sel = i === g.pick;
        if (sel) bloom(ctx, C.volt, t.x, t.y, 90, 0.3);
        ctx.save(); ctx.fillStyle = FIN_COL[t.f]; roundRect(ctx, t.x - 50, t.y - 60, 100, 120, 14); ctx.fill(); if (t.f === "shiny") { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillRect(t.x - 36, t.y - 50, 10, 100); } ctx.strokeStyle = sel ? C.volt : C.line2; ctx.lineWidth = sel ? 5 : 2; roundRect(ctx, t.x - 50, t.y - 60, 100, 120, 14); ctx.stroke(); ctx.restore();
        api.text(ctx, T[t.f], t.x, t.y + 92, { size: 38, weight: 700, color: sel ? C.volt : C.ink2, align: "center", baseline: "middle", maxWidth: 140 });
        if (g.run || done) api.text(ctx, `${temp.toFixed(1)}°`, t.x, t.y - 92, { font: "display", size: 40, weight: 800, color: temp > 40 ? C.amber : C.ion, align: "center", baseline: "middle" });
      });
      button(ctx, BTN, T.run, !done && !g.run && g.pick >= 0, now, C.sun);
    } else {
      const showSplit = g.split && g.anim <= 0;
      bowl(ctx, g.stream, BOWL.main[0], BOWL.main[1] - (g.anim > 0 ? (1.1 - g.anim) * 20 : 0), 1.2, flow.round * 31 + g.steps.length, !g.split);
      if (g.stream.wet) api.text(ctx, T.wet, BOWL.main[0], BOWL.main[1] - 70, { font: "mono", size: 38, weight: 600, color: "#9FD0FF", align: "center", baseline: "middle", decor: true });
      if (g.anim > 0) { const k = 1 - g.anim / 1.1; api.fx.burst(BOWL.main[0], BOWL.main[1], { n: 1, color: C.ink2, speed: 120, life: 0.3, size: 4 }); ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI); api.text(ctx, T[g.lastM as Machine], BOWL.main[0], BOWL.main[1] + 140, { font: "display", size: 44, weight: 800, color: C.sun, align: "center", baseline: "middle" }); ctx.restore(); }
      if (showSplit && g.split) { for (const [k, at] of [[0, BOWL.caught], [1, BOWL.passed]] as const) { bowl(ctx, g.split[k], at[0], at[1], 0.85, 91 + k, true); api.text(ctx, k ? T.passed : T.caught, at[0], at[1] + 96, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", decor: true }); } pill(api, ctx, T.keep, 385, 420, { color: C.volt, size: 38 }); }
      MACHINES.forEach((m, i) => { const can = !done && !g.split && !!machine(m, g.stream); button(ctx, MCH(i), T[m], can, now, C.sci); });
      api.text(ctx, `${T.steps} ${g.steps.length}/${r.maxSteps}`, 150, 190, { font: "mono", size: 38, weight: 600, color: g.steps.length > r.maxSteps ? C.amber : C.ink2, baseline: "middle" });
      if (g.lost && !done) pill(api, ctx, `${T[r.target]} ✗`, 600, 250, { color: C.amber, size: 38 });
      button(ctx, RESET, T.reset, !done && g.steps.length > 0, now, C.amber);
    }
    if (done) { const tx = r.mode === "separate" ? 660 : 765; if (ok) tick(ctx, tx, 200, C.mint, 1); else magnifier(ctx, tx - 5, 200, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1;
    if (r.mode === "conduct") {
      if (g.heating) return { type: "wait", ms: 300 };
      const ft = fallTimes(r.rods), want = r.rods.map((_, i) => i).sort((a, b) => ft[a] - ft[b]); if (slip) want.reverse();
      if (g.order.length < want.length) { const i = want[g.order.length]; return { type: "tap", at: [(ROD.x0 + ROD.x1) / 2, rodY(i, r.rods.length)], after: 300 }; }
      return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 300 };
    }
    if (r.mode === "breeze") { const h = r.asks[g.k]; if (!g.probe.sea) return { type: "tap", at: [265, 450], after: 400 }; if (!g.probe.land) return { type: "tap", at: [600, 450], after: 500 }; const s = breezeAt(h) === "sea" ? (slip ? 410 : 300) : slip ? 300 : 410; return { type: "tap", at: [885, s + 40], after: 400 }; }
    if (r.mode === "radiate") { if (g.run) return { type: "wait", ms: 300 }; const best = r.options.indexOf(bestFinish(r)), want = slip ? (best + 1) % r.options.length : best; if (g.pick !== want) { const t = tanks()[want]; return { type: "tap", at: [t.x, t.y], after: 400 }; } return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 }; }
    if (g.anim > 0) return { type: "wait", ms: 200 };
    const step = g.plan[g.steps.length]; if (!step) return { type: "tap", at: [RESET.x + 110, RESET.y + 22], after: 400 };
    if (g.split) { const at = step[1] ? BOWL.passed : BOWL.caught; return { type: "tap", at, after: 400 }; }
    const m = MCH(MACHINES.indexOf(step[0])); return { type: "tap", at: [m.x + m.w / 2, m.y + m.h / 2], after: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, order: g.order, fell: g.fell, pick: g.pick, items: g.stream.items, wet: g.stream.wet, steps: g.steps, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const heat: EngineDef<HeatSpec> = { archetype: "heat-lab@1", label: "Simulation · Heat & Matter Lab", accent: "#FF8F6B", create };
