// SHADOW PLAY — `shadow-play@1` (STUDIO-V2 §6.1 #35 + A19). A side-view light bench traced exactly: a point torch slides
// along a rail; rays graze the object's top and bottom edges and land on the screen, so the shadow's size is
// (screen − torch) / (object − torch) times the object (shared/studio-spec.ts shadowFactor, the same function the host
// grades with). Steps: size a shadow (2×, 1.5×), keep it inside a moving band for 4 s, then test materials and sort
// them; a red card still casts a dark shadow (c7-science-ch11-t02-m2).
import { SHADOW, SHADOW_MATERIALS, shadowBand, shadowFactor, torchForFactor, type ShadowMat, type ShadowSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, lerp, rng } from "../core/math.ts";
import { bloom, roundRect, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { pill, voltRing } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const S = SHADOW, OT = S.torchY - S.objH / 2, OB = S.torchY + S.objH / 2;
type Step = ShadowSpec["steps"][number];
const KINDS = ["opaque", "translucent", "transparent"] as const;

function create(api: EngineApi, spec: ShadowSpec): EngineInstance {
  const T = spec.strings;
  const g = { si: -1, phase: "boot" as "boot" | "play" | "met" | "final", stepT: 0, tx: 200, target: 200, dragTorch: false, grab: 0, hold: 0, inBand: 0, clock: 0, samples: [] as [number, number][], sampleT: 0,
    holder: null as null | ShadowMat, tested: new Set<ShadowMat>(), sorted: {} as Record<string, string>, drag: null as null | { id: ShadowMat; x: number; y: number }, results: [] as string[], bootT: 0, reveal: 0 };
  const botRnd = rng(api.seed * 29 + 3);
  const step = (): Step | null => (g.si >= 0 && g.si < spec.steps.length ? spec.steps[g.si] : null);
  const hud = api.hud([{ key: "step", label: T.step }, { key: "size", label: T.tall }]);
  const f = () => shadowFactor(g.tx);
  const yAt = (factor: number, top: boolean) => S.torchY + (top ? -1 : 1) * (S.objH / 2) * factor;
  const cardPos = (i: number): XY => [380 + (i % 4) * 160, i < 4 ? 215 : 315];
  const binPos = (k: number): XY => [142, 215 + k * 92];
  const SHORT: Record<ShadowMat, string> = { card: "Card", redcard: "Red card", tracing: "Tracing", glass: "Glass", wood: "Wood", frosted: "Frosted" };
  function startStep(i: number) {
    api.resetLog("samples");
    g.si = i; g.phase = "play"; g.stepT = 0; g.hold = 0; g.inBand = 0; g.clock = 0; g.samples = []; g.holder = null; g.tested = new Set(); g.sorted = {}; g.reveal = 0;
    const st = spec.steps[i];
    api.task(`${T.step} ${i + 1}/${spec.steps.length}`, st.kind === "size" ? `Make the shadow ${st.factor}${T.times}` : st.kind === "catch" ? T.band : T.sort);
    api.event("step_start", { step: i + 1, kind: st.kind, targets: st.targets ?? null });
  }
  api.onPointer({
    down(p) {
      const st = step(); if (!st || g.phase !== "play") return;
      if (st.kind === "materials") {
        const i = st.items.findIndex((_, k) => { const [x, y] = cardPos(k); return Math.abs(p.x - x) < 76 && Math.abs(p.y - y) < 48; });
        if (i >= 0 && !g.sorted[st.items[i]]) { g.drag = { id: st.items[i], x: p.x, y: p.y }; return; }
        if (g.holder && Math.abs(p.x - S.objX) < 50 && Math.abs(p.y - S.torchY) < 70) { g.drag = { id: g.holder, x: p.x, y: p.y }; g.holder = null; return; }
      }
      if (Math.abs(p.x - g.tx) < 90 && Math.abs(p.y - S.torchY) < 80) { g.dragTorch = true; g.grab = g.target - p.x; }
    },
    move(p) { if (g.dragTorch) g.target = clamp(p.x + g.grab, S.torchMin, S.torchMax); if (g.drag) { g.drag.x = p.x; g.drag.y = p.y; } },
    up(p) {
      g.dragTorch = false;
      const d = g.drag; g.drag = null;
      const st = step(); if (!d || !st || st.kind !== "materials") return;
      if (Math.abs(p.x - S.objX) < 70 && Math.abs(p.y - S.torchY) < 90) { g.holder = d.id; g.tested.add(d.id); g.reveal = 0; sfx.blip({ f: 600, f2: 800, dur: 0.06, type: "triangle", gain: 0.08 }); api.event("observe", { material: d.id, pass: SHADOW_MATERIALS[d.id].pass }); return; }
      const k = KINDS.findIndex((_, i) => { const [x, y] = binPos(i); return Math.abs(p.x - x) < 136 && Math.abs(p.y - y) < 44; });
      if (k >= 0) { g.sorted[d.id] = KINDS[k]; sfx.blip({ f: 420, dur: 0.06, type: "square", gain: 0.06 }); if (st.items.every((it) => g.sorted[it])) finishMaterials(st); }
    },
  });
  function finishMaterials(st: Extract<Step, { kind: "materials" }>) {
    const grade = api.answer(`s${g.si + 1}`, { sorted: { ...g.sorted } }, st.items.every((it) => g.sorted[it] === SHADOW_MATERIALS[it].kind) ? "right" : "partial");
    met(grade.verdict, grade.verdict === "right" ? "Light through: transparent; some: translucent; none: opaque" : "Look again at how much light got through");
    api.facts({ step: "materials", verdict: grade.verdict, ...(grade.detail ? { detail: grade.detail } : {}) });
  }
  function met(verdict: string, msg: string) {
    g.results.push(verdict); g.phase = "met"; g.stepT = 0;
    api.task(`${T.step} ${g.si + 1}/${spec.steps.length}`, msg, verdict === "right" ? "done" : "warn");
    if (verdict === "right") { api.fx.flash(C.mint, 0.1); sfx.blip({ f: 659, dur: 0.12, type: "triangle", gain: 0.14 }); setTimeout(() => sfx.blip({ f: 988, dur: 0.18, type: "triangle", gain: 0.12 }), 110); }
  }
  function update(dt: number) {
    g.stepT += dt; g.reveal = Math.min(1, g.reveal + dt * 2);
    g.tx = lerp(g.tx, g.target, 1 - Math.exp(-dt * 14));
    if (g.phase === "boot") { g.bootT += dt; if (g.bootT > 0.4) { hud.show(true); startStep(0); } return; }
    const st = step();
    if (g.phase === "play" && st) {
      g.clock += dt;
      if (st.kind === "size") {
        const rel = Math.abs(f() - st.factor) / st.factor;
        g.hold = rel <= 0.03 && !g.dragTorch ? g.hold + dt : rel <= 0.03 ? g.hold + dt * 0.5 : 0;
        if (g.hold > 1.2) { const grade = api.answer(`s${g.si + 1}`, { torchX: +g.tx.toFixed(2) }, "right"); met(grade.verdict, `${T.got}: ${f().toFixed(2)}${T.times}`); api.facts({ step: "size", target: st.factor, factor: +f().toFixed(2), verdict: grade.verdict }); }
      } else if (st.kind === "catch") {
        g.sampleT += dt;
        if (g.sampleT >= 0.1) { g.sampleT = 0; const smp: [number, number] = [+g.clock.toFixed(2), +g.tx.toFixed(1)]; g.samples.push(smp); api.record("samples", smp); }
        const b = shadowBand(g.clock, st.lo, st.hi), inside = Math.abs(f() - b.f) <= b.half;
        if (inside) g.inBand += dt;
        if (g.inBand >= st.seconds + 0.2 || g.clock > 25) { const grade = api.answer(`s${g.si + 1}`, { samples: { $hostLog: "samples" } }, g.inBand >= st.seconds ? "right" : "partial"); met(grade.verdict, grade.verdict === "right" ? `${T.got}: ${grade.error ?? g.inBand.toFixed(1)} s in the band` : "Closer to the screen: bigger. Further: smaller."); api.facts({ step: "catch", inBand: +(Number(grade.error ?? g.inBand)).toFixed(1), verdict: grade.verdict }); }
      }
    }
    if (g.phase === "met" && g.stepT > 2.8) { if (g.si + 1 < spec.steps.length) startStep(g.si + 1); else { g.phase = "final"; api.task("", T.done, "done"); api.done({ steps: spec.steps.length, right: g.results.filter((r) => r === "right").length }); } }
    if (g.phase !== "final") { hud.set("step", `${Math.min(g.si + 1, spec.steps.length)}/${spec.steps.length}`); hud.set("size", `${f().toFixed(2)}×`, { tone: st && st.kind === "size" && Math.abs(f() - st.factor) / st.factor <= 0.03 ? "mint" : null }); }
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#08090E"); gr.addColorStop(1, "#0E1016"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "#161922"; c.fillRect(0, S.table, W, H - S.table);
    c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, S.table); c.lineTo(W, S.table); c.stroke();
    c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(S.torchMin - 30, S.torchY + 46); c.lineTo(S.torchMax + 30, S.torchY + 46); c.stroke();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx, st = step(), src: XY = [g.tx, S.torchY];
    const mat = st && st.kind === "materials" ? g.holder : "card" as ShadowMat | null;
    const pass = mat ? SHADOW_MATERIALS[mat].pass : 1;
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    // light cone to the screen (additive), then the shadow wedge cut from it
    const top = S.screenTop, bot = S.table;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const cone = ctx.createRadialGradient(src[0], src[1], 10, src[0], src[1], S.screenX - src[0] + 80); cone.addColorStop(0, "rgba(255,226,160,.55)"); cone.addColorStop(1, "rgba(255,210,140,.10)");
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(src[0], src[1]); ctx.lineTo(S.screenX, top); ctx.lineTo(S.screenX, bot); ctx.closePath(); ctx.fill(); ctx.restore();
    const fac = f(), yT = yAt(fac, true), yB = Math.min(bot, yAt(fac, false));
    if (mat) {
      ctx.save(); ctx.fillStyle = `rgba(6,7,11,${0.94 * (1 - pass) * (st?.kind === "materials" ? g.reveal : 1)})`; ctx.beginPath(); ctx.moveTo(S.objX, OT); ctx.lineTo(S.screenX, yT); ctx.lineTo(S.screenX, yB); ctx.lineTo(S.objX, OB); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = "rgba(255,226,160,.55)"; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(src[0], src[1]); ctx.lineTo(S.screenX, yT); ctx.moveTo(src[0], src[1]); ctx.lineTo(S.screenX, yB); ctx.stroke(); ctx.restore();
    }
    // screen
    ctx.fillStyle = "#E9E3D2"; ctx.globalAlpha = 0.9; ctx.fillRect(S.screenX, top, 26, bot - top); ctx.globalAlpha = 1;
    if (mat) { ctx.fillStyle = `rgba(10,11,16,${0.95 * (1 - pass)})`; ctx.fillRect(S.screenX, yT, 26, yB - yT); }
    ctx.fillStyle = "#3A3F4E"; ctx.fillRect(S.screenX + 26, top, 6, bot - top);
    // targets on the screen
    if (st && st.kind === "size" && g.phase === "play") { const t1 = yAt(st.factor, true), t2 = Math.min(bot, yAt(st.factor, false)); ctx.strokeStyle = C.ion; ctx.lineWidth = 4; for (const y of [t1, t2]) { ctx.beginPath(); ctx.moveTo(S.screenX - 30, y); ctx.lineTo(S.screenX + 50, y); ctx.stroke(); } pill(api, ctx, `${st.factor}${T.times.split(" ")[0]}`, S.screenX - 70, t1 - 4, { color: C.ion, size: 38 }); }
    if (st && st.kind === "catch" && g.phase === "play") { const b = shadowBand(g.clock, st.lo, st.hi), y1 = yAt(b.f + b.half, true), y2 = yAt(b.f - b.half, true); ctx.fillStyle = "rgba(139,152,255,.28)"; ctx.fillRect(S.screenX - 36, y1, 100, y2 - y1); ctx.strokeStyle = C.ion; ctx.lineWidth = 3; ctx.strokeRect(S.screenX - 36, y1, 100, y2 - y1); const k = clamp(g.inBand / st.seconds, 0, 1); ctx.fillStyle = "rgba(255,255,255,.1)"; roundRect(ctx, 300, 150, 400, 12, 6); ctx.fill(); ctx.fillStyle = C.mint; roundRect(ctx, 300, 150, 400 * k, 12, 6); ctx.fill(); }
    // object (or material) on its post
    ctx.fillStyle = "#2A2F3D"; ctx.fillRect(S.objX - 4, OB, 8, S.table - OB);
    if (mat) drawMaterial(ctx, mat, S.objX, S.torchY, 1);
    else { ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 3; roundRect(ctx, S.objX - 30, OT, 60, S.objH, 8); ctx.stroke(); ctx.setLineDash([]); }
    if (st && st.kind === "materials" && g.holder === "redcard" && g.reveal > 0.6) pill(api, ctx, `${T.shadowColour}: dark`, S.screenX - 150, 560, { color: C.ink, size: 38 });
    // torch
    ctx.save(); ctx.translate(g.tx, S.torchY);
    bloom(ctx, "#FFE2A0", 14, 0, 70, 0.7);
    ctx.fillStyle = "#2C3142"; roundRect(ctx, -86, -18, 86, 36, 10); ctx.fill(); ctx.fillStyle = "#3C4256"; roundRect(ctx, -20, -26, 30, 52, 8); ctx.fill();
    ctx.fillStyle = "#FFF1C8"; ctx.beginPath(); ctx.arc(10, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (g.phase === "play" && st && st.kind !== "materials" && !g.dragTorch && g.stepT < 4) voltRing(ctx, g.tx - 30, S.torchY, 56, now);
    // materials tray and bins
    if (st && st.kind === "materials") {
      st.items.forEach((it, k) => { if (g.sorted[it] || g.holder === it || g.drag?.id === it) return; const [x, y] = cardPos(k); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, x - 74, y - 46, 148, 92, 14); ctx.fill(); ctx.strokeStyle = g.tested.has(it) ? C.ion : C.line2; ctx.lineWidth = 2; ctx.stroke(); drawMaterial(ctx, it, x, y - 8, 0.4); api.text(ctx, SHORT[it], x, y + 34, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", maxWidth: 144 }); });
      KINDS.forEach((kind, k) => { const [x, y] = binPos(k), n = Object.values(g.sorted).filter((v) => v === kind).length; ctx.fillStyle = "rgba(16,19,27,.9)"; roundRect(ctx, x - 134, y - 40, 268, 80, 16); ctx.fill(); ctx.strokeStyle = g.drag ? C.volt : C.line2; ctx.lineWidth = 2; ctx.stroke(); api.text(ctx, (T as Record<string, string>)[kind], x - 18, y + 2, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 230 }); api.text(ctx, `${n}`, x + 112, y + 2, { font: "display", size: 38, weight: 800, align: "center", baseline: "middle" }); });
      if (g.phase === "met") st.items.forEach((it) => { const k = KINDS.indexOf(SHADOW_MATERIALS[it].kind as (typeof KINDS)[number]); const [x, y] = binPos(k); if (g.sorted[it] === SHADOW_MATERIALS[it].kind) tick(ctx, x + 150, y - 20); });
      if (g.drag) drawMaterial(ctx, g.drag.id, g.drag.x, g.drag.y, 0.8);
    }
    fx.drawWorld(ctx); ctx.restore();
  }
  function drawMaterial(ctx: Ctx, id: ShadowMat, x: number, y: number, sc: number) {
    const m = SHADOW_MATERIALS[id], w = 46 * sc, h = S.objH * sc;
    ctx.save(); ctx.translate(x, y);
    const fill = id === "redcard" ? "#C2334D" : id === "card" ? "#8C6B4A" : id === "wood" ? "#6E4E33" : id === "tracing" ? "rgba(235,240,255,.55)" : id === "frosted" ? "rgba(200,225,240,.5)" : "rgba(190,235,255,.18)";
    ctx.fillStyle = fill; roundRect(ctx, -w / 2, -h / 2, w, h, 6 * sc); ctx.fill();
    ctx.strokeStyle = m.kind === "transparent" ? "rgba(220,240,255,.7)" : "rgba(255,255,255,.3)"; ctx.lineWidth = 2; ctx.stroke();
    if (id === "glass" || id === "frosted") { ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.moveTo(-w / 2 + 6, -h / 2 + 10); ctx.lineTo(-w / 2 + 14, -h / 2 + 30); ctx.stroke(); }
    ctx.restore();
  }
  function bot(): BotAction | null {
    const st = step();
    if (!st || g.phase !== "play") return { type: "wait", ms: 300 };
    const moveTorch = (x: number, ms = 400): BotAction => ({ type: "drag", from: [g.target - 30, S.torchY], to: [clamp(x, S.torchMin, S.torchMax) - 30, S.torchY], ms, after: 250 });
    if (st.kind === "size") { const x = torchForFactor(st.factor); return Math.abs(g.target - x) > 2 ? moveTorch(x + (botRnd() - 0.5) * 2) : { type: "wait", ms: 300 }; }
    if (st.kind === "catch") { const b = shadowBand(g.clock + 0.35, st.lo, st.hi); return moveTorch(torchForFactor(b.f), 220); }
    if (g.drag) return { type: "wait", ms: 200 };
    const next = st.items.find((it) => !g.sorted[it] && g.holder !== it);
    if (g.holder && !g.sorted[g.holder] && g.reveal >= 1) { const it = g.holder, k = KINDS.indexOf((botRnd() < 0.92 ? SHADOW_MATERIALS[it].kind : "translucent") as (typeof KINDS)[number]); return { type: "drag", from: [S.objX, S.torchY], to: binPos(k), ms: 500, after: 300 }; }
    if (next && !g.holder) return { type: "drag", from: cardPos(st.items.indexOf(next)), to: [S.objX, S.torchY], ms: 500, after: 900 };
    return { type: "wait", ms: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ phase: g.phase, step: step()?.kind ?? null, torchX: +g.tx.toFixed(1), factor: +f().toFixed(3), inBand: +g.inBand.toFixed(2), sorted: g.sorted }),
    knob(k) { if (k === "again") { g.results = []; startStep(0); return true; } return false; },
    board: () => ({ title: "Closer light, bigger shadow", lines: ["Light travels in straight lines past the edges.", "A red card still makes a dark shadow."], figure: { kind: "none" }, accent: C.sun }),
  };
}
export const shadow: EngineDef<ShadowSpec> = { archetype: "shadow-play@1", label: "Sim · Light", accent: C.sun, create };
