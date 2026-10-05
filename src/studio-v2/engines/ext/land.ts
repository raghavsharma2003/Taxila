// LAND & WATER LAB — `land-lab@1` (VALUES-100 V3.1: rain and relief, rivers, floods). Predict on the land first, then
// the model plays out on screen — the same model the host grades with:
//   rain  — drag each place onto the coast-and-hills profile; LOCK sends the moist sea wind over the land and the rain
//           falls where the air is forced up (and hardly at all in the hills' shadow)
//   river — tap cells from the spring down to the sea to say where the water will go; RAIN runs it down the steepest way
//   flood — drag the building along the valley side, choose trees, then STORM fills the valley to the computed level
import { RAIN_N, floodLevel, groundAt, rainAt, rainOk, rainProfile, heightAt, riverPath, siteHeight, type LandSpec, type LdRoundT } from "../../../../shared/studio-spec-ext/land.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill, textBlock } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const BTN = { x: 800, y: 520, w: 170, h: 66 };
const PX = { x0: 120, x1: 760, base: 540, top: 250 };
const chip = (i: number) => ({ x: 775, y: 178 + i * 110, w: 210, h: 100 });
function create(api: EngineApi, spec: LandSpec): EngineInstance {
  const T = spec.strings, accent = "#7FD3A6";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 181 + 19), setTask = taskPill(api);
  const g = { placed: [] as (number | null)[], drag: -1, dragXY: [0, 0] as [number, number], running: false, runT: 0, cells: [] as [number, number][], site: 0.5, trees: false, slide: false, judged: 0, answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, results: [] as string[] };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): LdRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { placed: r.mode === "rain" ? r.asks.map(() => null) : [], drag: -1, running: false, runT: 0, cells: r.mode === "river" ? [r.spring] : [], site: 0.5, trees: false, slide: false, judged: 0, answered: false, verdict: "", detail: "", revealT: 0, results: [] });
      setTask(`${T.round} ${k + 1}`, r.mode === "river" ? T.trace : r.sub || r.title); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function judge(item: string, value: unknown, local: "right" | "wrong") {
    const grade = api.answer(item, value, local); g.n++; g.results.push(grade.verdict);
    if (grade.verdict === "right") { g.right++; sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); } else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, item, verdict: grade.verdict, detail: grade.detail ?? "" });
    return grade;
  }
  const inB = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const xOf = (f: number) => PX.x0 + f * (PX.x1 - PX.x0), fOf = (x: number) => clamp((x - PX.x0) / (PX.x1 - PX.x0), 0, 1);
  const rainY = (r: Extract<LdRoundT, { mode: "rain" }>, f: number) => PX.base - groundAt(r, f) * 300 * (f < r.coast ? 0 : 1);
  const rgrid = (r: Extract<LdRoundT, { mode: "river" }>) => { const cell = Math.min(64, 620 / r.w, 380 / r.h); return { cell, x0: 440 - (cell * r.w) / 2, y0: 380 - (cell * r.h) / 2 }; };
  const fy = (m: number) => PX.base - (m / 12) * (PX.base - PX.top);
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered || g.running) return;
      const r = rd();
      if (r.mode === "rain") {
        if (inB(p, BTN) && g.placed.every((x) => x !== null)) { g.running = true; g.runT = 0; api.record("rain", { placed: g.placed }); return; }
        r.asks.forEach((_, i) => { const c = chip(i), px = g.placed[i]; if (inB(p, c) || (px !== null && Math.hypot(p.x - xOf(px), p.y - (rainY(r, px) - 30)) < 40)) { g.drag = i; g.dragXY = [p.x, p.y]; } });
        return;
      }
      if (r.mode === "river") {
        if (inB(p, BTN) && g.cells.length > 1) { g.running = true; g.runT = 0; api.record("trace", { cells: g.cells }); return; }
        const G = rgrid(r), cx = Math.floor((p.x - G.x0) / G.cell), cy = Math.floor((p.y - G.y0) / G.cell); if (cx < 0 || cy < 0 || cx >= r.w || cy >= r.h) return;
        const at = g.cells.findIndex((c) => c[0] === cx && c[1] === cy); if (at >= 0) { g.cells = g.cells.slice(0, Math.max(1, at + 1)); return; }
        const [lx, ly] = g.cells[g.cells.length - 1]; if (Math.abs(lx - cx) + Math.abs(ly - cy) === 1 && ly < r.h - 1) { g.cells.push([cx, cy]); sfx.blip({ f: 500 + g.cells.length * 20, dur: 0.04, type: "triangle", gain: 0.07 }); }
        return;
      }
      if (inB(p, BTN)) { g.running = true; g.runT = 0; api.record("storm", { x: g.site, trees: g.trees }); sfx.noise({ dur: 1.2, f: 800, filter: "lowpass", gain: 0.06 }); return; }
      if (inB(p, { x: 775, y: 390, w: 210, h: 90 })) { g.trees = !g.trees; api.record("trees", { trees: g.trees }); return; }
      if (p.x > PX.x0 && p.x < PX.x1 && p.y > 200 && p.y < 580) { g.slide = true; g.site = fOf(p.x); }
    },
    move(p) { if (g.drag >= 0) g.dragXY = [p.x, p.y]; if (g.slide) g.site = fOf(p.x); },
    up(p) {
      if (g.drag >= 0) { if (p.x >= PX.x0 && p.x <= PX.x1 && p.y > 160 && p.y < 600) { g.placed[g.drag] = +fOf(p.x).toFixed(3); api.record("place", { i: g.drag, x: g.placed[g.drag] }); sfx.blip({ f: 600, dur: 0.05, type: "triangle", gain: 0.08 }); } g.drag = -1; }
      if (g.slide) { g.slide = false; api.record("site", { x: g.site }); }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    if (g.running && !g.answered) {
      g.runT += dt;
      if (r.mode === "rain" && g.runT > 3.2) { r.asks.forEach((a, i) => judge(`r${flow.round + 1}:${i}`, { x: g.placed[i] }, rainOk(r, a.need, g.placed[i] ?? -1) ? "right" : "wrong")); finish(); }
      if (r.mode === "river") { const path = riverPath(r) ?? []; if (g.runT > path.length * 0.25 + 0.6) { const gr = judge(`r${flow.round + 1}`, { cells: g.cells }, "right"); g.detail = gr.detail ?? ""; finish(); } }
      if (r.mode === "flood" && g.runT > 3) { const gr = judge(`r${flow.round + 1}`, { x: +g.site.toFixed(3), trees: g.trees }, siteHeight(r, g.site) > floodLevel(r, g.trees) ? "right" : "wrong"); g.detail = gr.detail ?? ""; finish(); }
    }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3.2) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function finish() { g.running = true; g.answered = true; g.revealT = 0; const allRight = g.results.every((v) => v === "right"); g.verdict = allRight ? "right" : g.results.some((v) => v === "right") ? "partial" : "wrong"; if (allRight) api.fx.flash(C.mint, 0.1); }
  function paintBg(c: Ctx) { backdrop(c, accent, 181, 0); }
  function button(ctx: Ctx, b: { x: number; y: number; w: number; h: number }, label: string, on: boolean, now: number, col: string = C.volt) {
    ctx.save(); ctx.fillStyle = on ? hexA(col, 0.14) : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = on ? hexA(col, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    textBlock(api, ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 2, b.w - 16, { size: 38, weight: 700, color: on ? col : C.ink3 }, 2, 1.05);
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "rain") {
      ctx.save(); ctx.fillStyle = "#1F5D8C"; ctx.fillRect(PX.x0, PX.base - 4, xOf(r.coast) - PX.x0, 64); ctx.fillStyle = "#5C7A46"; ctx.beginPath(); ctx.moveTo(xOf(r.coast), PX.base + 60); for (let i = 0; i <= 160; i++) { const f = r.coast + (i / 160) * (1 - r.coast); ctx.lineTo(xOf(f), rainY(r, f)); } ctx.lineTo(PX.x1, PX.base + 60); ctx.fill(); ctx.restore();
      api.text(ctx, T.sea, (PX.x0 + xOf(r.coast)) / 2, PX.base + 30, { size: 38, weight: 700, color: "#CFE3FF", align: "center", baseline: "middle", maxWidth: xOf(r.coast) - PX.x0 });
      ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(140, 200); ctx.lineTo(250, 200); ctx.stroke(); ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.moveTo(262, 200); ctx.lineTo(244, 190); ctx.lineTo(244, 210); ctx.fill(); ctx.restore();
      api.text(ctx, T.wind, 196, 236, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      if (g.running || done) { // clouds march in and rain by the model
        const prof = rainProfile(r), front = clamp(g.runT / 2.4, 0, 1);
        for (let i = 0; i < RAIN_N; i += 2) { const f = i / (RAIN_N - 1); if (f > front || f < r.coast) continue; const lvl = rainAt(r, f); if (lvl < 0.06) continue; const x = xOf(f), gy = rainY(r, f); ctx.save(); ctx.strokeStyle = `rgba(150,200,255,${0.25 + lvl * 0.7})`; ctx.lineWidth = 2; for (let k = 0; k < Math.round(lvl * 5); k++) { const yy = 200 + ((now * 260 + k * 47 + i * 13) % Math.max(20, gy - 200)); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 3, yy + 12); ctx.stroke(); } ctx.restore(); }
        const cx = xOf(Math.min(front, 0.98)); ctx.save(); ctx.fillStyle = "rgba(220,228,240,.85)"; for (const [dx, dy, rr] of [[-30, 0, 26], [0, -12, 32], [30, 0, 26]]) { ctx.beginPath(); ctx.arc(cx + dx, 192 + dy, rr * (0.6 + 0.4 * (prof[Math.round(front * (RAIN_N - 1))] ? 1 : 0.6)), 0, Math.PI * 2); ctx.fill(); } ctx.restore();
      }
      r.asks.forEach((a, i) => {
        const c = chip(i), px = g.placed[i]; const dragging = g.drag === i;
        ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, c.x, c.y, c.w, c.h, 14); ctx.fill(); ctx.strokeStyle = a.need === "wet" ? "#6FB8FF" : C.sun; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        drawGlyph(ctx, a.glyph, c.x + 30, c.y + 34, 40, C.ink, hexA(accent, 0.3)); drawGlyph(ctx, a.need === "wet" ? "rain" : "sun", c.x + 30, c.y + 74, 30, a.need === "wet" ? "#6FB8FF" : C.sun, "rgba(0,0,0,0)");
        textBlock(api, ctx, a.label, c.x + 132, c.y + c.h / 2, 140, { size: 38, weight: 700, color: C.ink }, 2, 1.05);
        const at: [number, number] | null = dragging ? g.dragXY : px !== null ? [xOf(px), rainY(r, px) - 30] : null;
        if (at) { const res = done ? g.results[i] : ""; bloom(ctx, res === "right" ? C.mint : res ? C.amber : accent, at[0], at[1], 40, 0.5); drawGlyph(ctx, a.glyph, at[0], at[1], 52, C.ink, hexA(res === "right" ? C.mint : res ? C.amber : accent, 0.5)); }
      });
      button(ctx, BTN, T.lock, !done && !g.running && g.placed.every((x) => x !== null), now);
    } else if (r.mode === "river") {
      const G = rgrid(r); let hmax = -1e9, hmin = 1e9; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const hh = heightAt(r, x, y); hmax = Math.max(hmax, hh); hmin = Math.min(hmin, hh); }
      for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) { const f = (heightAt(r, x, y) - hmin) / (hmax - hmin || 1); ctx.fillStyle = y === r.h - 1 ? "#1F5D8C" : f < 0.33 ? `rgb(${Math.round(lerp(70, 120, f * 3))},${Math.round(lerp(120, 140, f * 3))},70)` : f < 0.7 ? `rgb(${Math.round(lerp(140, 150, (f - 0.33) * 2.7))},${Math.round(lerp(130, 105, (f - 0.33) * 2.7))},${Math.round(lerp(75, 70, f))})` : `rgb(${Math.round(lerp(160, 235, (f - 0.7) * 3.3))},${Math.round(lerp(140, 230, (f - 0.7) * 3.3))},${Math.round(lerp(120, 225, (f - 0.7) * 3.3))})`; ctx.fillRect(G.x0 + x * G.cell, G.y0 + y * G.cell, G.cell + 0.5, G.cell + 0.5); }
      api.text(ctx, T.sea, G.x0 + (r.w * G.cell) / 2, G.y0 + (r.h - 0.5) * G.cell, { size: 38, weight: 700, color: "#CFE3FF", align: "center", baseline: "middle" });
      ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash([2, 12]); ctx.beginPath(); g.cells.forEach(([x, y], i) => { const px = G.x0 + (x + 0.5) * G.cell, py = G.y0 + (y + 0.5) * G.cell; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.stroke(); ctx.restore();
      if (g.running || done) { const path = riverPath(r) ?? [], n = Math.min(path.length, Math.floor(g.runT / 0.25) + 1); ctx.save(); ctx.strokeStyle = "#5FB8FF"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = 0.85; ctx.beginPath(); path.slice(0, n).forEach(([x, y], i) => { const px = G.x0 + (x + 0.5) * G.cell, py = G.y0 + (y + 0.5) * G.cell; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.stroke(); ctx.restore(); }
      const [sx, sy] = r.spring; bloom(ctx, "#5FB8FF", G.x0 + (sx + 0.5) * G.cell, G.y0 + (sy + 0.5) * G.cell, 30, 0.7); drawGlyph(ctx, "drop", G.x0 + (sx + 0.5) * G.cell, G.y0 + (sy + 0.5) * G.cell, G.cell * 0.6, C.ink, "rgba(95,184,255,.6)");
      api.text(ctx, T.high, 885, 230, { size: 38, weight: 700, color: "#E8E2D8", align: "center", baseline: "middle" }); ctx.save(); const lg = ctx.createLinearGradient(0, 260, 0, 400); lg.addColorStop(0, "#EBE6E1"); lg.addColorStop(0.4, "#968746"); lg.addColorStop(1, "#467846"); ctx.fillStyle = lg; ctx.fillRect(865, 260, 40, 140); ctx.restore(); api.text(ctx, T.low, 885, 430, { size: 38, weight: 700, color: "#7FB07F", align: "center", baseline: "middle" });
      if (done) pill(api, ctx, g.detail, 440, 600, { color: ok ? C.mint : C.amber, size: 38 });
      button(ctx, BTN, T.rain, !done && !g.running && g.cells.length > 1, now, "#5FB8FF");
    } else {
      const n = r.profile.length - 1, sx = (i: number) => PX.x0 + (i / n) * (PX.x1 - PX.x0);
      const lvl = floodLevel(r, g.trees), shown = g.running || done ? Math.min(lvl, Math.min(...r.profile) + (lvl - Math.min(...r.profile)) * clamp(g.runT / 2.4, 0, 1)) : Math.min(...r.profile) + 0.3;
      ctx.save(); ctx.fillStyle = "rgba(80,150,230,.55)"; ctx.fillRect(PX.x0, fy(shown), PX.x1 - PX.x0, PX.base - fy(shown) + 20); ctx.restore();
      ctx.save(); ctx.fillStyle = "#6D5A3A"; ctx.beginPath(); ctx.moveTo(PX.x0, PX.base + 40); r.profile.forEach((m, i) => ctx.lineTo(sx(i), fy(m))); ctx.lineTo(PX.x1, PX.base + 40); ctx.fill(); ctx.restore();
      if (g.trees) for (let i = 0; i <= n; i++) if (r.profile[i] > Math.min(...r.profile) + 1.5) drawGlyph(ctx, "tree", sx(i), fy(r.profile[i]) - 20, 40, "#2F5D2F", "rgba(80,160,80,.85)");
      for (const m of [0, 4, 8, 12]) api.text(ctx, `${m} m`, PX.x0 - 8, fy(m), { font: "mono", size: 38, weight: 600, color: "rgba(255,255,255,.4)", align: "right", baseline: "middle", decor: true });
      const bx = xOf(g.site), by = fy(siteHeight(r, g.site)); bloom(ctx, done ? (ok ? C.mint : C.amber) : C.volt, bx, by - 30, 50, 0.4); drawGlyph(ctx, r.glyph, bx, by - 30, 58, C.ink, hexA(done ? (ok ? C.mint : C.amber) : C.volt, 0.5));
      api.text(ctx, r.label, clamp(bx, 200, 680), by - 86, { size: 38, weight: 700, color: C.ink, align: "center", baseline: "middle", maxWidth: 240 });
      api.text(ctx, `${r.rain}`, 885, 230, { font: "display", size: 52, weight: 800, color: "#9FD0FF", align: "center", baseline: "middle" });
      textBlock(api, ctx, T.mm, 885, 292, 200, { size: 38, weight: 600, color: C.ink2 }, 2, 1.05);
      button(ctx, { x: 775, y: 390, w: 210, h: 90 }, `${g.trees ? "✓ " : ""}${T.trees}`, !done && !g.running, now, C.mint);
      if (done) pill(api, ctx, ok ? T.safe : T.flooded, 440, 200, { color: ok ? C.mint : C.amber, size: 40 });
      button(ctx, BTN, T.storm, !done && !g.running, now, "#5FB8FF");
    }
    if (done) { const [tx, ty] = r.mode === "rain" ? [720, 200] : r.mode === "river" ? [885, 480] : [885, 300]; if (ok) tick(ctx, tx, ty, C.mint, 1); else magnifier(ctx, tx - 5, ty, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered || g.running) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1;
    if (r.mode === "rain") {
      const i = g.placed.findIndex((x) => x === null);
      if (i >= 0) { const a = r.asks[i], xs = Array.from({ length: 101 }, (_, j) => j / 100).filter((x) => rainOk(r, slip ? (a.need === "wet" ? "dry" : "wet") : a.need, x)); const f = xs[Math.floor(xs.length / 2)] ?? 0.5, c = chip(i); return { type: "drag", from: [c.x + 100, c.y + 42], to: [xOf(f), rainY(r, f) - 30], ms: 600, after: 300 }; }
      return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
    }
    if (r.mode === "river") {
      const path = riverPath(r) ?? [], n = g.cells.length; const G = rgrid(r);
      if (n < path.length - 1 && !(slip && n > 2)) { const [x, y] = path[n]; return { type: "tap", at: [G.x0 + (x + 0.5) * G.cell, G.y0 + (y + 0.5) * G.cell], after: 200 }; }
      return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
    }
    const lvl = floodLevel(r, false), xs = Array.from({ length: 101 }, (_, j) => j / 100).filter((x) => (slip ? siteHeight(r, x) < lvl : siteHeight(r, x) > lvl + 0.6)), want = xs[Math.floor(xs.length / 2)] ?? 0.9;
    if (Math.abs(g.site - want) > 0.01) return { type: "drag", from: [xOf(g.site), 380], to: [xOf(want), 380], ms: 600, after: 300 };
    return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, placed: g.placed, cells: g.cells.length, site: g.site, trees: g.trees, results: g.results, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const land: EngineDef<LandSpec> = { archetype: "land-lab@1", label: "Simulation · Land & Water Lab", accent: "#7FD3A6", create };
