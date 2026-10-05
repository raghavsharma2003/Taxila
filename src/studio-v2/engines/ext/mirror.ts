// MIRROR STUDIO — `mirror-paint@1` (VALUES-100 V3.1: symmetry and congruence). Paint the mirror half of a design
// before the scanner sweeps through; fold-test a figure along candidate mirrors (the fold animates and the overlap
// shows) and mark every true line of symmetry; give a design quarter turns against a ghost of itself and count the
// matches; turn and flip a piece to fit its twin. The host grades the raw act from the cell set.
import { AXES, reflect, rot90, rotOrder, sameSet, norm, twinTarget, symmetryAxes, type Axis, type Cell, type MirrorSpec, type MpRoundT } from "../../../../shared/studio-spec-ext/mirror.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, rng } from "../../core/math.ts";
import { magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady } from "./kit.ts";

const CHECK = { x: 830, y: 450, w: 140, h: 70 };
function create(api: EngineApi, spec: MirrorSpec): EngineInstance {
  const T = spec.strings, accent = "#FF8FB1";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 131 + 5);
  const g = { painted: [] as Cell[], axes: [] as Axis[], foldA: null as Axis | null, foldT: 0, rot: 0, rotAnim: 0, flip: false, order: 0, clock: 0, answered: false, verdict: "", revealT: 0, right: 0, n: 0, coachA: 1, coachGone: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): MpRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.painted = []; g.axes = []; g.foldA = null; g.rot = 0; g.rotAnim = 0; g.flip = false; g.order = 0; g.clock = spec.rounds[k].time; g.answered = false; g.verdict = ""; g.revealT = 0; const r = spec.rounds[k]; api.task(`${T.round} ${k + 1}`, r.mode === "complete" ? T.coach : r.mode === "lines" ? T.lines : r.mode === "turn" ? T.turn : T.twin); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const geom = (r: MpRoundT, cx = r.mode === "twin" ? 300 : 400) => { const cell = Math.min(44, 330 / r.size), sz = cell * r.size; return { cell, x0: cx - sz / 2, y0: 352 - sz / 2, sz }; };
  const axisBtns = () => AXES.map((a, i) => ({ a, x: 640 + (i % 2) * 90, y: 210 + Math.floor(i / 2) * 90, w: 80, h: 80 }));
  const orderBtns = () => [1, 2, 4].map((o, i) => ({ o, x: 640 + i * 90, y: 300, w: 80, h: 80 }));
  const toolBtns = () => [{ k: "rotate", x: 830, y: 220, w: 140, h: 64 }, { k: "flip", x: 830, y: 300, w: 140, h: 64 }];
  function check() {
    if (g.answered || flow.state !== "play") return;
    const r = rd(); let value: unknown, local = "wrong";
    if (r.mode === "complete") { value = g.painted; const want = r.cells.map((c) => reflect(c, r.axis ?? "v", r.size)).filter((c) => !r.cells.some((h) => h[0] === c[0] && h[1] === c[1])); local = sameSet(g.painted, want) ? "right" : "wrong"; }
    else if (r.mode === "lines") { value = g.axes; const want = symmetryAxes(r.cells, r.size); local = want.length === g.axes.length && want.every((a) => g.axes.includes(a)) ? "right" : "wrong"; }
    else if (r.mode === "turn") { value = g.order; local = g.order === rotOrder(r.cells, r.size) ? "right" : "wrong"; }
    else { value = { rot: g.rot % 4, flip: g.flip }; local = sameSet(norm(cur(r)), twinTarget(r)) ? "right" : "wrong"; }
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.burst(400, 340, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, mode: r.mode, verdict: grade.verdict, detail: grade.detail ?? "" });
  }
  function cur(r: MpRoundT): Cell[] { let c = r.cells.map((q) => [q[0], q[1]] as Cell); for (let i = 0; i < g.rot % 4; i++) c = c.map((q) => rot90(q, r.size)); if (g.flip) c = c.map((q) => reflect(q, "v", r.size)); return c; }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      if (p.x >= CHECK.x && p.x <= CHECK.x + CHECK.w && p.y >= CHECK.y && p.y <= CHECK.y + CHECK.h) { check(); return; }
      const r = rd(), G = geom(r);
      if (r.mode === "complete") {
        const cx = Math.floor((p.x - G.x0) / G.cell), cy = Math.floor((p.y - G.y0) / G.cell); if (cx < 0 || cy < 0 || cx >= r.size || cy >= r.size) return;
        if (r.cells.some((c) => c[0] === cx && c[1] === cy)) return;
        const i = g.painted.findIndex((c) => c[0] === cx && c[1] === cy); if (i >= 0) g.painted.splice(i, 1); else g.painted.push([cx, cy]);
        sfx.blip({ f: 500 + cy * 30, dur: 0.04, type: "triangle", gain: 0.06 }); api.record("paint", { cell: [cx, cy], on: i < 0 });
      } else if (r.mode === "lines") {
        const b = axisBtns().find((q) => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h); if (!b) return;
        const i = g.axes.indexOf(b.a); if (i >= 0) g.axes.splice(i, 1); else g.axes.push(b.a); g.foldA = b.a; g.foldT = 0; sfx.blip({ f: 400, f2: 700, dur: 0.15, type: "triangle", gain: 0.08 }); api.record("axis", { a: b.a });
      } else if (r.mode === "turn") {
        const tb = toolBtns()[0]; if (p.x >= tb.x && p.x <= tb.x + tb.w && p.y >= tb.y && p.y <= tb.y + tb.h) { g.rot++; g.rotAnim = 1; sfx.blip({ f: 330, f2: 660, dur: 0.12, type: "triangle", gain: 0.08 }); api.record("turn", { rot: g.rot }); return; }
        const ob = orderBtns().find((q) => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y + 120 && p.y <= q.y + 120 + q.h); if (ob) { g.order = ob.o; check(); }
      } else {
        const [rb, fb] = toolBtns();
        if (p.x >= rb.x && p.x <= rb.x + rb.w && p.y >= rb.y && p.y <= rb.y + rb.h) { g.rot++; g.rotAnim = 1; api.record("twin", { rot: g.rot }); }
        if (p.x >= fb.x && p.x <= fb.x + fb.w && p.y >= fb.y && p.y <= fb.y + fb.h) { g.flip = !g.flip; api.record("twin", { flip: g.flip }); }
      }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    g.foldT += dt; g.rotAnim = Math.max(0, g.rotAnim - dt * 3);
    if (flow.state !== "play") return;
    if (!g.answered) { g.clock -= dt; if (g.clock <= 0) check(); }
    else { g.revealT += dt; if (g.revealT > 3.0) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function grid(ctx: Ctx, r: MpRoundT, G: ReturnType<typeof geom>, cells: Cell[], col: string, alpha = 1, rotA = 0) {
    ctx.save(); const cx = G.x0 + G.sz / 2, cy = G.y0 + G.sz / 2; ctx.translate(cx, cy); ctx.rotate(rotA); ctx.translate(-cx, -cy); ctx.globalAlpha *= alpha;
    for (const [x, y] of cells) { ctx.fillStyle = col; roundRect(ctx, G.x0 + x * G.cell + 2, G.y0 + y * G.cell + 2, G.cell - 4, G.cell - 4, 5); ctx.fill(); }
    ctx.restore(); void r;
  }
  function board(ctx: Ctx, G: ReturnType<typeof geom>, n: number) { ctx.save(); ctx.fillStyle = "rgba(18,20,30,.9)"; ctx.fillRect(G.x0, G.y0, G.sz, G.sz); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; for (let i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(G.x0 + i * G.cell, G.y0); ctx.lineTo(G.x0 + i * G.cell, G.y0 + G.sz); ctx.stroke(); ctx.beginPath(); ctx.moveTo(G.x0, G.y0 + i * G.cell); ctx.lineTo(G.x0 + G.sz, G.y0 + i * G.cell); ctx.stroke(); } ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.strokeRect(G.x0, G.y0, G.sz, G.sz); ctx.restore(); }
  function axisLine(ctx: Ctx, G: ReturnType<typeof geom>, a: Axis, col: string, w = 5) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash([12, 8]); ctx.beginPath(); const { x0, y0, sz } = G; if (a === "v") { ctx.moveTo(x0 + sz / 2, y0 - 14); ctx.lineTo(x0 + sz / 2, y0 + sz + 14); } else if (a === "h") { ctx.moveTo(x0 - 14, y0 + sz / 2); ctx.lineTo(x0 + sz + 14, y0 + sz / 2); } else if (a === "d1") { ctx.moveTo(x0 - 10, y0 - 10); ctx.lineTo(x0 + sz + 10, y0 + sz + 10); } else { ctx.moveTo(x0 + sz + 10, y0 - 10); ctx.lineTo(x0 - 10, y0 + sz + 10); } ctx.stroke(); ctx.restore(); }
  function btn(ctx: Ctx, b: { x: number; y: number; w: number; h: number }, label: string, on: boolean, sel = false) { ctx.save(); ctx.fillStyle = sel ? hexA(accent, 0.25) : on ? "rgba(22,26,36,.95)" : "rgba(255,255,255,.04)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = sel ? accent : on ? C.line2 : C.line; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 2, { font: "display", size: 40, weight: 800, color: on ? C.ink : C.ink3, align: "center", baseline: "middle", maxWidth: b.w - 8 }); }
  function paintBg(c: Ctx) { backdrop(c, accent, 91, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const G = geom(r);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    const ok = g.verdict === "right", done = g.answered;
    if (r.mode === "complete") {
      board(ctx, G, r.size); grid(ctx, r, G, r.cells, hexA(accent, 0.85)); grid(ctx, r, G, g.painted, hexA(C.volt, 0.85)); axisLine(ctx, G, r.axis ?? "v", C.ink);
      if (done) { const want = r.cells.map((c) => reflect(c, r.axis ?? "v", r.size)).filter((c) => !r.cells.some((h) => h[0] === c[0] && h[1] === c[1])); for (const [x, y] of want) if (!g.painted.some((c) => c[0] === x && c[1] === y)) { ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); roundRect(ctx, G.x0 + x * G.cell + 3, G.y0 + y * G.cell + 3, G.cell - 6, G.cell - 6, 5); ctx.stroke(); ctx.restore(); } }
      else { const k = 1 - clamp(g.clock / r.time, 0, 1), sy = G.y0 + G.sz * k; ctx.save(); ctx.fillStyle = hexA(C.sci, 0.18); ctx.fillRect(G.x0 - 10, sy - 3, G.sz + 20, 6); ctx.restore(); }
    } else if (r.mode === "lines") {
      board(ctx, G, r.size); grid(ctx, r, G, r.cells, hexA(accent, 0.85));
      if (g.foldA && g.foldT < 1.6) { const k = ease.inOutCubic(clamp(g.foldT / 0.8, 0, 1)) * (g.foldT < 0.8 ? 1 : clamp(2 - g.foldT / 0.8, 0, 1)); grid(ctx, r, G, r.cells.map((c) => reflect(c, g.foldA!, r.size)), hexA(C.volt, 0.5), k); }
      for (const a of g.axes) axisLine(ctx, G, a, C.volt);
      if (done) for (const a of symmetryAxes(r.cells, r.size)) axisLine(ctx, G, a, C.mint, 3);
      axisBtns().forEach((b) => { btn(ctx, b, "", !done, g.axes.includes(b.a)); const cx = b.x + b.w / 2, cy = b.y + b.h / 2; ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); if (b.a === "v") { ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy + 26); } else if (b.a === "h") { ctx.moveTo(cx - 26, cy); ctx.lineTo(cx + 26, cy); } else if (b.a === "d1") { ctx.moveTo(cx - 20, cy - 20); ctx.lineTo(cx + 20, cy + 20); } else { ctx.moveTo(cx + 20, cy - 20); ctx.lineTo(cx - 20, cy + 20); } ctx.stroke(); ctx.restore(); });
    } else if (r.mode === "turn") {
      board(ctx, G, r.size); grid(ctx, r, G, r.cells, "rgba(255,255,255,.12)");
      grid(ctx, r, G, cur(r), hexA(accent, 0.85), 1, -g.rotAnim * Math.PI / 2);
      if (g.rot > 0 && g.rotAnim < 0.05 && sameSet(cur(r), r.cells)) pill(api, ctx, `${T.same} · ${g.rot % 4 || 4}/4`, 400, 545, { color: C.mint, size: 38 });
      btn(ctx, toolBtns()[0], T.rotate, !done);
      api.text(ctx, T.order, 775, 395, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle" });
      orderBtns().forEach((b) => btn(ctx, { ...b, y: b.y + 120 }, String(b.o), !done, g.order === b.o));
    } else {
      board(ctx, G, r.size); grid(ctx, r, G, cur(r), hexA(accent, 0.85), 1, -g.rotAnim * Math.PI / 2);
      const tgt = twinTarget(r), tw = Math.max(...tgt.map((c) => c[0])) + 1, th = Math.max(...tgt.map((c) => c[1])) + 1, cell = G.cell, tx0 = 620, ty0 = 352 - (th * cell) / 2;
      ctx.save(); ctx.strokeStyle = done ? (ok ? C.mint : C.amber) : C.ink2; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); for (const [x, y] of tgt) roundRect(ctx, tx0 + x * cell + 2, ty0 + y * cell + 2, cell - 4, cell - 4, 5), ctx.stroke(); ctx.restore(); void tw;
      btn(ctx, toolBtns()[0], T.rotate, !done); btn(ctx, toolBtns()[1], T.flip, !done, g.flip);
    }
    if (r.mode !== "turn") btn(ctx, CHECK, T.check, !done);
    if (done) { if (ok) tick(ctx, 900, 400, C.mint, 1.1); else magnifier(ctx, 895, 400, C.amber, 1.1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: g.verdict === "right", color: g.verdict === "right" ? C.mint : C.amber, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
    drawCoach(api, ctx, "", 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), G = geom(r), slip = botR() < 0.1;
    if (r.mode === "complete") {
      const want = r.cells.map((c) => reflect(c, r.axis ?? "v", r.size)).filter((c) => !r.cells.some((h) => h[0] === c[0] && h[1] === c[1]));
      const next = want.find((c) => !g.painted.some((q) => q[0] === c[0] && q[1] === c[1]));
      if (next && !(slip && g.painted.length === want.length - 1)) return { type: "tap", at: [G.x0 + (next[0] + 0.5) * G.cell, G.y0 + (next[1] + 0.5) * G.cell], after: 150 };
      return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 700 };
    }
    if (r.mode === "lines") { const want = symmetryAxes(r.cells, r.size); const next = want.find((a) => !g.axes.includes(a)); if (next) { const b = axisBtns().find((q) => q.a === next)!; return { type: "tap", at: [b.x + 40, b.y + 40], after: 900 }; } return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 700 }; }
    if (r.mode === "turn") { if (g.rot < 4) return { type: "tap", at: [toolBtns()[0].x + 70, toolBtns()[0].y + 32], after: 700 }; const o = slip ? 2 : rotOrder(r.cells, r.size); const b = orderBtns().find((q) => q.o === o)!; return { type: "tap", at: [b.x + 40, b.y + 160], after: 600 }; }
    if (!sameSet(norm(cur(r)), twinTarget(r)) && g.rot < 8) { const flipNeeded = (() => { for (const f of [false, true]) for (let k = 0; k < 4; k++) { let c = r.cells.map((q) => [q[0], q[1]] as Cell); for (let i = 0; i < k; i++) c = c.map((q) => rot90(q, r.size)); if (f) c = c.map((q) => reflect(q, "v", r.size)); if (sameSet(norm(c), twinTarget(r))) return { f, k }; } return { f: false, k: 0 }; })(); if (flipNeeded.f !== g.flip) return { type: "tap", at: [toolBtns()[1].x + 70, toolBtns()[1].y + 32], after: 500 }; return { type: "tap", at: [toolBtns()[0].x + 70, toolBtns()[0].y + 32], after: 500 }; }
    return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 700 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, painted: g.painted.length, axes: g.axes, rot: g.rot, flip: g.flip, order: g.order, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "slower" || k === "easier") { g.clock += 20; return true; } if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "grid", w: 6, h: 6 }, accent }),
  };
}
export const mirror: EngineDef<MirrorSpec> = { archetype: "mirror-paint@1", label: "Game · Mirror Studio", accent: "#FF8FB1", create };
