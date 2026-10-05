// FRACTION WORKS — `fraction-ops@1` (VALUES-100 V3.1: operations on fractions as quantities). Orchard: set the
// field's columns and rows and how many of each to shade; the overlap is what you harvest (a/b of c/d). Scoops: scoop
// a measure into a container until it is full; the count is the quotient. Join: re-cut two bars into a number of equal
// parts — only a common multiple makes the cuts line up — then pour. The host grades the construction exactly.
import { fadd, fdiv, feq, fmul, fstr, type F, type FoRoundT, type FracOpsSpec } from "../../../../shared/studio-spec-ext/fracops.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, rng } from "../../core/math.ts";
import { magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady } from "./kit.ts";

const GO = { x: 760, y: 556, w: 210, h: 62 }, FIELD = { x: 110, y: 190, w: 420, h: 300 };
function create(api: EngineApi, spec: FracOpsSpec): EngineInstance {
  const T = spec.strings, accent = C.amber;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 139 + 7);
  const g = { cols: 1, cs: 0, rows: 1, rs: 0, scoops: 0, pourT: 0, parts: 1, poured: 0, answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): FoRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { Object.assign(g, { cols: 1, cs: 0, rows: 1, rs: 0, scoops: 0, pourT: 0, parts: 1, poured: 0, answered: false, verdict: "", detail: "", revealT: 0 }); api.task(`${T.round} ${k + 1}`, spec.rounds[k].sub || spec.rounds[k].title); api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const steppers = (): { key: "cols" | "cs" | "rows" | "rs" | "parts"; label: string; y: number; max: () => number }[] => {
    const r = rd();
    if (r.mode === "orchard") return [{ key: "cols", label: T.cols, y: 222, max: () => 12 }, { key: "cs", label: T.shade, y: 318, max: () => g.cols }, { key: "rows", label: T.rows, y: 414, max: () => 12 }, { key: "rs", label: T.shade, y: 510, max: () => g.rows }];
    if (r.mode === "join") return [{ key: "parts", label: T.cut, y: 240, max: () => 24 }];
    return [];
  };
  function go() {
    if (g.answered || flow.state !== "play") return;
    const r = rd(); let value: unknown, local = "wrong";
    if (r.mode === "orchard") { value = { cols: g.cols, colsShaded: g.cs, rows: g.rows, rowsShaded: g.rs }; local = feq([g.cs * g.rs, g.cols * g.rows], fmul(r.a, r.b)) ? "right" : "wrong"; }
    else if (r.mode === "scoop") { value = { scoops: g.scoops }; local = g.scoops === fdiv(r.whole, r.part) ? "right" : "wrong"; }
    else { value = { parts: g.parts }; local = g.parts % r.a[1] === 0 && g.parts % r.b[1] === 0 ? "right" : "wrong"; g.poured = 0; }
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.detail = grade.detail ?? ""; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.burst(320, 340, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, mode: r.mode, verdict: grade.verdict, detail: g.detail });
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (p.x >= GO.x && p.x <= GO.x + GO.w && p.y >= GO.y && p.y <= GO.y + GO.h) { go(); return; }
      const r = rd();
      if (r.mode === "scoop") { if (p.x >= 560 && p.x <= 780 && p.y >= 300 && p.y <= 400) { g.scoops++; g.pourT = 0.5; sfx.noise({ dur: 0.18, f: 1800, filter: "bandpass", gain: 0.08 }); api.record("scoop", { n: g.scoops }); } return; }
      for (const s of steppers()) { if (p.y < s.y - 30 || p.y > s.y + 30) continue; const cur = g[s.key]; if (p.x >= 640 && p.x <= 700) g[s.key] = Math.max(s.key === "cs" || s.key === "rs" ? 0 : 1, cur - 1); else if (p.x >= 880 && p.x <= 940) g[s.key] = Math.min(s.max(), cur + 1); else continue; if (s.key === "cols") g.cs = Math.min(g.cs, g.cols); if (s.key === "rows") g.rs = Math.min(g.rs, g.rows); sfx.blip({ f: 400 + g[s.key] * 30, dur: 0.04, type: "triangle", gain: 0.07 }); api.record("stepper", { [s.key]: g[s.key] }); }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    g.pourT = Math.max(0, g.pourT - dt);
    if (flow.state !== "play") return;
    if (g.answered) { g.revealT += dt; g.poured = Math.min(1, g.poured + dt * 0.8); if (g.revealT > 3.2) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function bar(ctx: Ctx, x: number, y: number, w: number, h: number, f: F, n: number, col: string, own: number) {
    ctx.save(); ctx.fillStyle = "rgba(18,22,32,.95)"; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = hexA(col, 0.8); ctx.fillRect(x + 3, y + 3, (w - 6) * (f[0] / f[1]), h - 6);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4; for (let i = 1; i < own; i++) { const xx = x + (w * i) / own; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
    if (n > 1) for (let i = 1; i < n; i++) { const xx = x + (w * i) / n, lines = (i * own) % n === 0; ctx.strokeStyle = lines ? C.ink2 : hexA(C.amber, 0.7); ctx.lineWidth = 2; ctx.setLineDash(lines ? [] : [6, 6]); ctx.beginPath(); ctx.moveTo(xx, y + 6); ctx.lineTo(xx, y + h - 6); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4; roundRect(ctx, x, y, w, h, 10); ctx.stroke(); ctx.restore();
  }
  function stepperUI(ctx: Ctx) { for (const s of steppers()) { api.text(ctx, s.label, 790, s.y - 46, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle" }); for (const [x, t] of [[640, "−"], [880, "+"]] as [number, string][]) { ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, x, s.y - 28, 60, 56, 12); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, t, x + 30, s.y + 2, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle" }); } api.text(ctx, String(g[s.key]), 790, s.y + 2, { font: "display", size: 48, weight: 800, align: "center", baseline: "middle" }); } }
  function paintBg(c: Ctx) { backdrop(c, accent, 111, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const ok = g.verdict === "right", done = g.answered;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "orchard") {
      const cw = FIELD.w / g.cols, rh = FIELD.h / g.rows;
      ctx.fillStyle = "#3A2E22"; ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
      ctx.fillStyle = hexA(C.sun, 0.35); ctx.fillRect(FIELD.x, FIELD.y, cw * g.cs, FIELD.h);
      ctx.fillStyle = hexA(C.sci, 0.35); ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, rh * g.rs);
      const hk = done ? ease.outCubic(clamp(g.revealT / 0.8, 0, 1)) : 0;
      ctx.fillStyle = hexA(C.mint, 0.55 + 0.35 * hk); ctx.fillRect(FIELD.x, FIELD.y, cw * g.cs, rh * g.rs);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; for (let i = 1; i < g.cols; i++) { ctx.beginPath(); ctx.moveTo(FIELD.x + i * cw, FIELD.y); ctx.lineTo(FIELD.x + i * cw, FIELD.y + FIELD.h); ctx.stroke(); } for (let j = 1; j < g.rows; j++) { ctx.beginPath(); ctx.moveTo(FIELD.x, FIELD.y + j * rh); ctx.lineTo(FIELD.x + FIELD.w, FIELD.y + j * rh); ctx.stroke(); }
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
      stepperUI(ctx);
      if (done) pill(api, ctx, `${g.cs * g.rs}/${g.cols * g.rows} = ${fstr(fmul(r.a, r.b))}${ok ? "" : " ?"}`, FIELD.x + FIELD.w / 2, FIELD.y + FIELD.h + 46, { color: ok ? C.mint : C.amber, size: 40 });
    } else if (r.mode === "scoop") {
      const total = fdiv(r.whole, r.part), lvl = g.scoops / total, jx = 200, jy = 180, jw = 220, jh = 330;
      ctx.save(); ctx.beginPath(); ctx.rect(jx, jy, jw, jh); ctx.clip(); ctx.fillStyle = hexA(C.sun, 0.75); const fill = Math.min(1.08, lvl) * jh; ctx.fillRect(jx, jy + jh - fill, jw, fill); ctx.restore();
      if (lvl > 1) { ctx.fillStyle = hexA(C.sun, 0.6); ctx.fillRect(jx + jw, jy - 4, 10, 60 * Math.min(1, lvl - 1) + 20); }
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(jx, jy, jw, jh);
      const wholes = r.whole[0] / r.whole[1];
      for (let k = 1; k < total; k++) { const y = jy + jh - (k / total) * jh; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(jx, y); ctx.lineTo(jx + 26, y); ctx.stroke(); }
      for (let u = 1; u <= Math.floor(wholes); u++) { const y = jy + jh - (u / wholes) * jh; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(jx, y); ctx.lineTo(jx + 50, y); ctx.stroke(); api.text(ctx, `${u}`, jx - 16, y, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "right", baseline: "middle" }); }
      api.text(ctx, `${fstr(r.whole)} ${r.unit}`, jx + jw / 2, jy - 26, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      ctx.save(); ctx.fillStyle = done ? "rgba(255,255,255,.04)" : "rgba(22,26,36,.95)"; roundRect(ctx, 560, 300, 220, 100, 20); ctx.fill(); ctx.strokeStyle = done ? C.line : C.volt; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, `${T.scoop} ${fstr(r.part)}`, 670, 352, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle" });
      if (g.pourT > 0) { ctx.fillStyle = hexA(C.sun, 0.8); ctx.fillRect(jx + jw / 2 - 6, jy - 60 + (1 - g.pourT * 2) * 0, 12, 60); }
      pill(api, ctx, `${g.scoops} ${T.scoops}`, 670, 250, { color: done ? (ok ? C.mint : C.amber) : C.ink, size: 40 });
      if (done && !ok) pill(api, ctx, `${fstr(r.whole)} ÷ ${fstr(r.part)} = ${total}`, 670, 460, { color: C.ion, size: 38 });
    } else {
      const n = g.parts, sgn = r.op === "+" ? 1 : -1, res = fadd(r.a, r.b, sgn);
      api.text(ctx, fstr(r.a), 100, 255, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" });
      api.text(ctx, fstr(r.b), 100, 355, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" });
      api.text(ctx, r.op === "+" ? T.plus : T.minus, 100, 305, { font: "display", size: 44, weight: 800, color: accent, align: "center", baseline: "middle" });
      bar(ctx, 150, 220, 460, 70, r.a, n, C.ion, r.a[1]); bar(ctx, 150, 320, 460, 70, r.b, n, C.sci, r.b[1]);
      if (done) { const k = ease.outCubic(g.poured); const show: F = [res[0] * k, res[1]]; bar(ctx, 150, 440, 460, 70, show, ok ? n : 1, ok ? C.mint : C.amber, ok ? n : 1); pill(api, ctx, ok ? `${(res[0] * n) / res[1]}/${n} = ${fstr(res)}` : g.detail, 380, 548, { color: ok ? C.mint : C.amber, size: 38 }); }
      stepperUI(ctx);
    }
    const lab = r.mode === "orchard" ? T.harvest : r.mode === "scoop" ? T.full : T.pour;
    ctx.save(); ctx.fillStyle = !done ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, GO.x, GO.y, GO.w, GO.h, 16); ctx.fill(); ctx.strokeStyle = !done ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, lab, GO.x + GO.w / 2, GO.y + GO.h / 2 + 2, { font: "display", size: 38, weight: 800, color: !done ? C.volt : C.ink3, align: "center", baseline: "middle", maxWidth: GO.w - 10 });
    if (done) { if (ok) tick(ctx, 960, 200, C.mint, 1); else magnifier(ctx, 955, 200, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: g.verdict === "right", color: g.verdict === "right" ? C.mint : C.amber, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
    void now;
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1, tap = (key: string, up: boolean): BotAction => ({ type: "tap", at: [up ? 910 : 670, steppers().find((s) => s.key === key)!.y], after: 120 });
    if (r.mode === "orchard") { const want = { cols: r.b[1], cs: r.b[0], rows: r.a[1], rs: r.a[0] + (slip ? 1 : 0) } as Record<string, number>; for (const k of ["cols", "cs", "rows", "rs"] as const) if (g[k] !== Math.min(want[k], k === "cs" ? g.cols : k === "rs" ? g.rows : 12)) return tap(k, g[k] < want[k]); return { type: "tap", at: [GO.x + 80, GO.y + 33], after: 700 }; }
    if (r.mode === "scoop") { const want = fdiv(r.whole, r.part) + (slip ? 1 : 0); if (g.scoops < want) return { type: "tap", at: [670, 350], after: 220 }; return { type: "tap", at: [GO.x + 80, GO.y + 33], after: 700 }; }
    const want = slip ? Math.max(r.a[1], r.b[1]) + 1 : (r.a[1] * r.b[1]) / (function gg(a: number, b: number): number { return b ? gg(b, a % b) : a; })(r.a[1], r.b[1]);
    if (g.parts !== want) return tap("parts", g.parts < want); return { type: "tap", at: [GO.x + 80, GO.y + 33], after: 700 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, cols: g.cols, cs: g.cs, rows: g.rows, rs: g.rs, scoops: g.scoops, parts: g.parts, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; return { title: spec.title, lines: [r0.mode === "orchard" ? `${fstr(r0.a)} of ${fstr(r0.b)} = ${fstr(fmul(r0.a, r0.b))}` : r0.mode === "scoop" ? `${fstr(r0.whole)} ÷ ${fstr(r0.part)} = ${fdiv(r0.whole, r0.part)}` : `${fstr(r0.a)} ${r0.op} ${fstr(r0.b)} = ${fstr(fadd(r0.a, r0.b, r0.op === "+" ? 1 : -1))}`], figure: { kind: "none" }, accent }; },
  };
}
export const fracops: EngineDef<FracOpsSpec> = { archetype: "fraction-ops@1", label: "Game · Fraction Works", accent: C.amber, create };
