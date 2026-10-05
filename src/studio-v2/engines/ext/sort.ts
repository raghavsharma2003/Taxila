// TEST BENCH SORT — `sort-storm@1` (VALUES-100 V3.1). Items roll off the belt onto the test pad; the belt clock runs.
// Tap a TOOL to test the item for real (a magnet drops and the nail jumps to it; a torch beam passes, dims or casts a
// shadow; the water tank floats or sinks it; the circuit's bulb lights; the flame catches; iodine turns blue-black),
// then drag the item into a bin. The drop is the act and the host grades it. A wrong bin replays the decisive test and
// the item flies to its true bin. Adaptive: a miss slows the belt 12%; a clean streak of 4 speeds it 6%.
import { PROP_OF, type SortRoundT, type SortSpec, type Tool } from "../../../../shared/studio-spec-ext/sort.ts";
import type { Glyph } from "../../../../shared/studio-spec-ext/scene.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, SUBJECT_ACCENT, backdrop, devaReady, shuffled, textBlock } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const PAD_X = 520, PAD_Y = 285, IT_W = 240, IT_H = 96, BIN_Y = 448, BIN_H = 150, TOOL_X = 30, TOOL_W = 150;
const TOOL_NAME: Record<Tool, string> = { magnet: "tMagnet", torch: "tTorch", tank: "tTank", tester: "tTester", flame: "tFlame", iodine: "tIodine", paper: "tPaper", biuret: "tBiuret", turmeric: "tTurmeric", litmus: "tLitmus", rose: "tRose" };
const TOOL_GLYPH: Record<Tool, Glyph> = { magnet: "magnet", torch: "torch", tank: "drop", tester: "bulb", flame: "fire", iodine: "beaker", paper: "letter", biuret: "beaker", turmeric: "drop", litmus: "ruler", rose: "flower" };
interface Live { id: string; x: number; y: number; vx: number; state: "in" | "pad" | "drag" | "fly" | "gone"; t: number; to?: { x: number; y: number }; verdict?: string; bin?: string }

function create(api: EngineApi, spec: SortSpec): EngineInstance {
  const T = spec.strings, accent = SUBJECT_ACCENT[(spec.skills[0] ?? "").split("-")[1]] ?? C.sci;
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const botR = rng(api.seed * 71 + 2);
  const g = { order: [] as string[], k: 0, cur: null as Live | null, flying: [] as Live[], padT: 0, belt: 7, speedK: 1, tool: null as null | { tool: Tool; t: number; id: string }, tests: 0,
    right: 0, n: 0, streak: 0, roundR: 0, roundN: 0, binFlash: new Map<string, { t: number; ok: boolean }>(), coachA: 1, coachGone: false, beltOff: 0, dragOff: { x: 0, y: 0 } };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "sorted", label: T.sorted }, { key: "tests", label: T.tests }]);
  const rd = (): SortRoundT => spec.rounds[Math.max(0, flow.round)];
  const itemOf = (id: string) => rd().items.find((i) => i.id === id)!;
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { const r = spec.rounds[k]; g.order = shuffled(r.items.map((i) => i.id), api.seed * 5 + k); g.k = 0; g.speedK = r.speed; g.roundR = 0; g.roundN = 0; g.flying = []; api.event("round_start", { round: k + 1, items: r.items.length, tools: r.tools, targets: r.targets ?? null }); sfx.blip({ f: 196, f2: 392, dur: 0.3, type: "triangle", gain: 0.12 }); next(); },
    onEnd(k) { api.event("round_end", { round: k + 1, right: g.roundR, of: g.roundN }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n, tests: g.tests }); },
  });
  function next() {
    if (g.k >= g.order.length) { g.cur = null; flow.endRound(); return; }
    g.cur = { id: g.order[g.k], x: W + IT_W, y: PAD_Y, vx: 0, state: "in", t: 0 }; g.padT = 0; g.tool = null; g.belt = 7.5 / g.speedK;
    api.task(`${T.round} ${flow.round + 1}`, T.coach);
  }
  const bins = () => { const n = rd().bins.length, w = Math.min(250, (W - 230) / n - 16); return rd().bins.map((b, i) => ({ ...b, x: 210 + i * ((W - 230) / n) + ((W - 230) / n - w) / 2, w })); };
  const tools = () => rd().tools.map((t, i) => ({ tool: t, x: TOOL_X, y: 150 + i * 150 }));
  function runTool(t: Tool) {
    const c = g.cur; if (!c || c.state !== "pad" || g.tool) return;
    g.tool = { tool: t, t: 0, id: c.id }; g.tests++;
    api.record("tests", { item: c.id, tool: t, at: +api.now().toFixed(2) });
    api.event("tool", { tool: t, item: c.id, result: itemOf(c.id).props?.[PROP_OF[t]] ?? null });
    sfx.blip({ f: 330, f2: 500, dur: 0.12, type: "triangle", gain: 0.1 });
  }
  function drop(binId: string | null) {
    const c = g.cur; if (!c) return;
    const it = itemOf(c.id);
    const grade = api.answer(`r${flow.round + 1}:${c.id}`, binId, binId === it.bin ? "right" : "wrong");
    g.n++; g.roundN++;
    const ok = grade.verdict === "right";
    if (ok) { g.right++; g.roundR++; g.streak++; if (g.streak % 4 === 0) { g.speedK = Math.min(1.5, g.speedK * 1.06); api.event("adapt", { speed: +g.speedK.toFixed(2), why: "streak" }); } }
    else { g.streak = 0; g.speedK = Math.max(0.55, g.speedK * 0.88); api.event("adapt", { speed: +g.speedK.toFixed(2), why: binId ? "wrong-bin" : "missed" }); }
    const target = bins().find((b) => b.id === it.bin)!;
    const fly: Live = { ...c, state: "fly", t: 0, to: { x: target.x + target.w / 2, y: BIN_Y + BIN_H / 2 }, verdict: grade.verdict, bin: binId ?? undefined };
    g.binFlash.set(binId ?? "", { t: api.now(), ok }); if (!ok) g.binFlash.set(it.bin, { t: api.now() + 0.6, ok: true });
    if (ok) { api.fx.burst(target.x + target.w / 2, BIN_Y + 30, { n: 26, color: C.mint, speed: 380, life: 0.6, size: 10 }); sfx.blip({ f: 523 * Math.pow(1.05, Math.min(8, g.streak)), f2: 1046, dur: 0.18, type: "triangle", gain: 0.18 }); api.hitstop(40); }
    else { sfx.blip({ f: 220, f2: 140, dur: 0.22, gain: 0.16 }); api.fx.shake(4, 0.2); }
    // a wrong bin replays the decisive test (when the round is sorted by a property and that tool exists)
    const pt = rd().byProp ? (Object.keys(PROP_OF) as Tool[]).find((t) => PROP_OF[t] === rd().byProp) : undefined;
    if (!ok && pt) fly.t = -1.4;   // hold on the pad while the test replays
    if (!ok && pt) g.tool = { tool: pt, t: 0, id: c.id };
    g.flying.push(fly); g.cur = null; g.k++;
    api.facts({ item: it.text, bin: rd().bins.find((b) => b.id === binId)?.label ?? T.missed, truth: rd().bins.find((b) => b.id === it.bin)?.label ?? it.bin, verdict: grade.verdict });
    window.setTimeout(() => { if (flow.state === "play") next(); }, ok ? 450 : 1700);
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play") return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      for (const t of tools()) if (p.x >= t.x - 8 && p.x <= t.x + TOOL_W + 8 && p.y >= t.y - 8 && p.y <= t.y + 140) { runTool(t.tool); return; }
      const c = g.cur; if (!c || c.state !== "pad") return;
      if (p.x >= c.x - IT_W / 2 - 14 && p.x <= c.x + IT_W / 2 + 14 && p.y >= c.y - IT_H / 2 - 14 && p.y <= c.y + IT_H / 2 + 14) { c.state = "drag"; g.dragOff = { x: p.x - c.x, y: p.y - c.y }; }
    },
    move(p) { const c = g.cur; if (c && c.state === "drag") { c.x = p.x - g.dragOff.x; c.y = p.y - g.dragOff.y; } },
    up(p) {
      const c = g.cur; if (!c || c.state !== "drag") return;
      const b = bins().find((bb) => p.x >= bb.x - 10 && p.x <= bb.x + bb.w + 10 && p.y >= BIN_Y - 40);
      if (b) drop(b.id); else { c.state = "pad"; api.tw.add(c, { x: PAD_X, y: PAD_Y }, { dur: 0.25 }); }
    },
  });
  api.onKey((k, down) => { if (!down) return; const i = +k - 1; if (Number.isInteger(i) && i >= 0 && i < rd().bins.length && g.cur?.state === "pad") drop(rd().bins[i].id); if (k === "t" && rd().tools[0]) runTool(rd().tools[0]); });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    g.beltOff = (g.beltOff + dt * 60 * g.speedK) % 40;
    if (g.tool) g.tool.t += dt;
    for (const f of g.flying) { f.t += dt; if (f.t > 0 && f.to) { const k = ease.inOutCubic(clamp(f.t / 0.55, 0, 1)); f.x = lerp(PAD_X, f.to.x, k); f.y = lerp(PAD_Y, f.to.y, k) - Math.sin(k * Math.PI) * 120; if (f.t > 0.9) f.state = "gone"; } }
    g.flying = g.flying.filter((f) => f.state !== "gone");
    if (flow.state !== "play") return;
    const c = g.cur;
    if (c) {
      if (c.state === "in") { c.x = lerp(c.x, PAD_X, Math.min(1, dt * 5)); if (Math.abs(c.x - PAD_X) < 2) { c.x = PAD_X; c.state = "pad"; } }
      if (c.state === "pad" || c.state === "drag") { g.padT += dt; if (g.padT > g.belt && c.state === "pad") drop(null); }
    }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("sorted", `${g.right}/${g.n}`, { bump: true, tone: g.streak >= 4 ? "mint" : null }); hud.set("tests", String(g.tests));
  }
  function drawItem(ctx: Ctx, l: Live, a = 1, tone?: string) {
    const it = itemOf(l.id); if (!it) return;
    ctx.save(); ctx.globalAlpha *= a; bloom(ctx, tone ?? accent, l.x, l.y, IT_W * 0.55, 0.22);
    ctx.fillStyle = "rgba(22,26,36,.97)"; roundRect(ctx, l.x - IT_W / 2, l.y - IT_H / 2, IT_W, IT_H, 18); ctx.fill(); ctx.strokeStyle = tone ?? hexA(accent, 0.9); ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
    const gl = it.glyph; if (gl) drawGlyph(ctx, gl, l.x - IT_W / 2 + 40, l.y, 46, C.ink, hexA(accent, 0.3), a);
    textBlock(api, ctx, it.text, l.x + (gl ? 26 : 0), l.y, IT_W - (gl ? 80 : 26), { size: 38, weight: 700, alpha: a }, 2, 1.04);
  }
  function drawTool(ctx: Ctx, now: number) {
    const tl = g.tool; if (!tl) return;
    const it = itemOf(tl.id); if (!it) return;
    const val = it.props?.[PROP_OF[tl.tool]], k = clamp(tl.t / 0.6, 0, 1), k2 = clamp((tl.t - 0.6) / 0.6, 0, 1), fade = tl.t > 2.6 ? clamp(1 - (tl.t - 2.6) / 0.4, 0, 1) : 1;
    if (fade <= 0) { g.tool = null; return; }
    const c = g.cur && g.cur.id === tl.id ? g.cur : g.flying.find((f) => f.id === tl.id) ?? { x: PAD_X, y: PAD_Y };
    const px = c.x, py = c.y;
    ctx.save(); ctx.globalAlpha = fade;
    if (tl.tool === "magnet") {
      const my = lerp(120, py - IT_H / 2 - 58, ease.outCubic(k)), yes = val === "yes";
      drawGlyph(ctx, "magnet", px, my, 90, C.ink, hexA(C.amber, 0.5));
      if (yes && k2 > 0) { bloom(ctx, C.mint, px, py - 30, 120, 0.4 * k2); if (g.cur && g.cur.id === tl.id && g.cur.state === "pad") g.cur.y = PAD_Y - 30 * ease.outBack(Math.min(1, k2 * 1.5)); }
      if (g.cur && g.cur.id === tl.id && g.cur.state === "pad" && tl.t > 2.5) g.cur.y = PAD_Y;
      api.text(ctx, `${T.magnetic}: ${yes ? T.yes : T.no}`, px + 70, my, { align: "left", font: "mono", size: 38, weight: 600, color: yes ? C.mint : C.ink2, baseline: "middle", alpha: k2 });
    } else if (tl.tool === "torch") {
      const pass = val === "transparent" ? 1 : val === "translucent" ? 0.45 : 0;
      drawGlyph(ctx, "torch", 250, py, 70, C.ink, hexA(C.sun, 0.5));
      ctx.fillStyle = hexA(C.sun, 0.22 * k); ctx.beginPath(); ctx.moveTo(290, py - 12); ctx.lineTo(px - IT_W / 2, py - 46); ctx.lineTo(px - IT_W / 2, py + 46); ctx.lineTo(290, py + 12); ctx.closePath(); ctx.fill();
      if (k2 > 0) { ctx.fillStyle = hexA(C.sun, 0.22 * pass * k2); ctx.beginPath(); ctx.moveTo(px + IT_W / 2, py - 46); ctx.lineTo(800, py - 80); ctx.lineTo(800, py + 80); ctx.lineTo(px + IT_W / 2, py + 46); ctx.closePath(); ctx.fill(); ctx.fillStyle = pass > 0.9 ? hexA(C.sun, 0.8) : pass > 0 ? hexA(C.sun, 0.35) : "#05060A"; roundRect(ctx, 800, py - 90, 22, 180, 6); ctx.fill(); }
      api.text(ctx, val ?? "", 810, py - 120, { font: "mono", size: 38, weight: 600, color: pass > 0.9 ? C.sun : pass > 0 ? C.amber : C.ink2, align: "center", baseline: "middle", alpha: k2 });
    } else if (tl.tool === "tank") {
      const ty = lerp(H, py - 70, ease.outCubic(k)), floats = val === "yes";
      ctx.fillStyle = "rgba(80,150,255,.25)"; ctx.fillRect(px - 170, ty, 340, 200); ctx.strokeStyle = "rgba(160,200,255,.6)"; ctx.lineWidth = 3; ctx.strokeRect(px - 170, ty, 340, 200);
      if (k2 > 0) api.text(ctx, `${T.floats}: ${floats ? T.yes : T.no}`, px + 180, ty - 26, { align: "left", font: "mono", size: 38, weight: 600, color: floats ? C.mint : C.ink2, baseline: "middle", alpha: k2 });
      if (g.cur && g.cur.id === tl.id && g.cur.state === "pad") g.cur.y = PAD_Y + (floats ? Math.sin(now * 3) * 4 : 90 * ease.inQuad(k2));
    } else if (tl.tool === "tester") {
      const yes = val === "yes";
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - IT_W / 2 - 10, py); ctx.lineTo(px - IT_W / 2 - 60, py); ctx.lineTo(px - IT_W / 2 - 60, py + 110); ctx.lineTo(px + IT_W / 2 + 60, py + 110); ctx.lineTo(px + IT_W / 2 + 60, py); ctx.lineTo(px + IT_W / 2 + 10, py); ctx.stroke();
      if (yes && k2 > 0) bloom(ctx, C.sun, px, py + 110, 90, 0.7 * k2);
      drawGlyph(ctx, "bulb", px, py + 110, 64, C.ink, yes && k2 > 0 ? hexA(C.sun, 0.9) : "rgba(255,255,255,.05)");
      api.text(ctx, `${T.conducts}: ${yes ? T.yes : T.no}`, px + IT_W / 2 + 70, py + 60, { align: "left", font: "mono", size: 38, weight: 600, color: yes ? C.mint : C.ink2, baseline: "middle", alpha: k2 });
    } else if (tl.tool === "flame") {
      const yes = val === "yes";
      drawGlyph(ctx, "fire", px, py + IT_H / 2 + 50, 80 * (0.6 + 0.4 * Math.sin(now * 12) * 0.2 + 0.4), C.ink, hexA(C.amber, 0.7));
      if (yes && k2 > 0) { bloom(ctx, C.amber, px, py, 160, 0.5 * k2); }
      api.text(ctx, `${T.burns}: ${yes ? T.yes : T.no}`, px + IT_W / 2 + 30, py - 70, { align: "left", font: "mono", size: 38, weight: 600, color: yes ? C.amber : C.ink2, baseline: "middle", alpha: k2 });
    } else if (tl.tool === "iodine") {
      const yes = val === "yes", dy = lerp(110, py - IT_H / 2 - 30, ease.outCubic(k));
      drawGlyph(ctx, "beaker", px + 60, dy - 40, 60, C.ink, hexA("#A0522D", 0.6));
      if (k2 > 0) { ctx.fillStyle = yes ? hexA("#1B1446", 0.9 * k2) : hexA("#C8862B", 0.8 * k2); ctx.beginPath(); ctx.ellipse(px + 40, py - 6, 34 * k2, 22 * k2, 0, 0, Math.PI * 2); ctx.fill(); }
      api.text(ctx, `${T.starch}: ${yes ? T.yes : T.no}`, px + IT_W / 2 + 30, py - 70, { align: "left", font: "mono", size: 38, weight: 600, color: yes ? C.ion : C.ink2, baseline: "middle", alpha: k2 });
    } else {
      // reagent drops: paper patch (fat), copper sulphate + caustic soda (protein: violet), indicators (acid / base)
      const dy = lerp(110, py - IT_H / 2 - 30, ease.outCubic(k));
      drawGlyph(ctx, tl.tool === "paper" ? "letter" : tl.tool === "rose" ? "flower" : "beaker", px + 60, dy - 40, 60, C.ink, "rgba(255,255,255,.08)");
      let col = "#888", word = "";
      if (tl.tool === "paper") { col = val === "yes" ? "rgba(255,240,200,.55)" : "rgba(255,255,255,.12)"; word = `${T.fat}: ${val === "yes" ? T.yes : T.no}`; }
      else if (tl.tool === "biuret") { col = val === "yes" ? "#7B3FC4" : "#3C7FD9"; word = `${T.protein}: ${val === "yes" ? T.yes : T.no}`; }
      else if (tl.tool === "turmeric") { col = val === "base" ? "#C4302B" : "#E8B923"; word = val === "base" ? T.base : `${T.acid} / ${T.neutral}`; }
      else if (tl.tool === "litmus") { col = val === "acid" ? "#D9413B" : val === "base" ? "#3C6FD9" : "#8A6FB0"; word = (T as Record<string, string>)[val ?? "neutral"] ?? ""; }
      else if (tl.tool === "rose") { col = val === "acid" ? "#C2185B" : val === "base" ? "#2E9E4F" : "#C98BB0"; word = (T as Record<string, string>)[val ?? "neutral"] ?? ""; }
      if (k2 > 0) { ctx.fillStyle = col; ctx.globalAlpha = fade * k2; ctx.beginPath(); ctx.ellipse(px + 40, py - 4, 40 * k2, 26 * k2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = fade; }
      api.text(ctx, word, px + IT_W / 2 + 30, py - 70, { align: "left", font: "mono", size: 38, weight: 600, color: C.ink, baseline: "middle", alpha: k2 });
    }
    ctx.restore();
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 23, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // belt
    ctx.fillStyle = "#121621"; ctx.fillRect(200, PAD_Y + IT_H / 2 + 6, W - 200, 22);
    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 3; for (let x = 200 - g.beltOff; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, PAD_Y + IT_H / 2 + 8); ctx.lineTo(x + 18, PAD_Y + IT_H / 2 + 26); ctx.stroke(); }
    // pad
    ctx.save(); ctx.strokeStyle = hexA(accent, 0.5); ctx.lineWidth = 3; ctx.setLineDash([10, 8]); roundRect(ctx, PAD_X - IT_W / 2 - 16, PAD_Y - IT_H / 2 - 16, IT_W + 32, IT_H + 32, 24); ctx.stroke(); ctx.restore();
    // tools
    for (const t of tools()) {
      const active = g.tool?.tool === t.tool && g.cur?.id === g.tool?.id;
      ctx.save(); ctx.fillStyle = active ? hexA(accent, 0.2) : "rgba(22,26,36,.95)"; roundRect(ctx, t.x, t.y, TOOL_W, 96, 18); ctx.fill(); ctx.strokeStyle = active ? accent : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      drawGlyph(ctx, TOOL_GLYPH[t.tool], t.x + TOOL_W / 2, t.y + 40, 54, C.ink, hexA(accent, 0.3));
      api.text(ctx, (T as Record<string, string>)[TOOL_NAME[t.tool]] ?? t.tool, t.x + TOOL_W / 2, t.y + 122, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: TOOL_W + 10 });
    }
    // bins
    for (const b of bins()) {
      const fl = g.binFlash.get(b.id), fk = fl ? clamp(1 - (api.now() - fl.t) / 0.8, 0, 1) * (api.now() >= fl.t ? 1 : 0) : 0, edge = fk > 0 ? (fl!.ok ? C.mint : C.amber) : hexA(accent, 0.7);
      ctx.save(); if (fk > 0) bloom(ctx, edge, b.x + b.w / 2, BIN_Y + BIN_H / 2, b.w * 0.7, 0.4 * fk);
      ctx.fillStyle = "rgba(18,22,32,.96)"; roundRect(ctx, b.x, BIN_Y, b.w, BIN_H, 20); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = hexA(accent, 0.08); roundRect(ctx, b.x + 8, BIN_Y + 8, b.w - 16, 10, 5); ctx.fill(); ctx.restore();
      if (b.glyph) drawGlyph(ctx, b.glyph, b.x + b.w / 2, BIN_Y + 48, 54, C.ink, hexA(accent, 0.3));
      textBlock(api, ctx, b.label, b.x + b.w / 2, BIN_Y + (b.glyph ? 108 : BIN_H / 2), b.w - 20, { size: 38, weight: 700 }, 2, 1.04);
    }
    // the item and its clock
    const c = g.cur;
    if (c && c.state !== "gone") {
      if (c.state === "pad" || c.state === "drag") { const k = clamp(g.padT / g.belt, 0, 1); ctx.save(); ctx.strokeStyle = k > 0.75 ? C.amber : "rgba(255,255,255,.35)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(PAD_X + IT_W / 2 + 40, PAD_Y - IT_H / 2 - 10, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke(); ctx.restore(); }
      drawItem(ctx, c, 1, c.state === "drag" ? C.volt : undefined);
    }
    drawTool(ctx, now);
    for (const f of g.flying) { const tone = f.verdict === "right" ? C.mint : f.t > 0 ? C.ion : C.amber; drawItem(ctx, f, f.t > 0.6 ? clamp(1 - (f.t - 0.6) / 0.3, 0, 1) : 1, tone); if (f.verdict !== "right" && f.t < 0) magnifier(ctx, f.x + IT_W / 2 + 4, f.y - IT_H / 2, C.amber, 0.85); if (f.verdict === "right" && f.t > 0.3) tick(ctx, f.x + IT_W / 2, f.y - IT_H / 2, C.mint, 0.8); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundR}/${g.roundN}`, T.sorted], [String(g.tests), T.tests]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.sorted], [String(g.tests), T.tests]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" ? g.coachA : 0, now, 120);
  }
  function bot(): BotAction | null {
    const c = g.cur;
    if (flow.state !== "play" || !c || c.state !== "pad") return { type: "wait", ms: 250 };
    if (rd().tools.length && !g.tool && g.padT < 0.5 && botR() < 0.8) { const t = tools()[0]; return { type: "tap", at: [t.x + TOOL_W / 2, t.y + 48], after: 900 }; }
    if (g.tool && g.tool.t < 1.4) return { type: "wait", ms: 300 };
    const it = itemOf(c.id), b = botR() < 0.85 ? bins().find((x) => x.id === it.bin)! : bins()[Math.floor(botR() * bins().length)];
    return { type: "drag", from: [c.x, c.y], to: [b.x + b.w / 2, BIN_Y + BIN_H / 2], ms: 500, after: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, item: g.cur?.id ?? null, k: g.k, right: g.right, n: g.n, tests: g.tests, speed: +g.speedK.toFixed(2) }),
    knob(k) { if (k === "slower" || k === "easier") { g.speedK = Math.max(0.55, g.speedK * 0.8); g.belt *= 1.25; return true; } if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; } if (k === "again") { g.right = 0; g.n = 0; g.tests = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; return { title: spec.title, lines: r0.bins.slice(0, 3).map((b) => `${b.label}: ${r0.items.filter((i) => i.bin === b.id).slice(0, 3).map((i) => i.text).join(", ")}`), figure: { kind: "none" }, accent }; },
  };
}
export const sort: EngineDef<SortSpec> = { archetype: "sort-storm@1", label: "Game · Test Bench", accent: C.sci, create };
