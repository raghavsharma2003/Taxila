// PATTERN LAB — `pattern-lab@1` (VALUES-100 V3.1: number play and tilings). Four puzzle benches, every check computed:
//   magic  — drag tiles from the tray into the grid (tap a placed tile to send it back); row, column and diagonal sums
//            update live and glow when they hit the magic sum; CHECK
//   rhythm — build a rhythm from short (1 beat) and long (2 beats) blocks; ADD plays it and files it; find them all
//   cipher — each letter has a dial; turn them until the column sum is true
//   tile   — tap a polygon to fit it round the point; the angle ring fills; UNDO; CHECK when it closes at 360°
import { DIAG3, LINES3, allRhythms, cipherOk, interior, letters, magicOk, magicSolve, magicSum, rhythmOk, tileOk, tilePlans, cipherSolutions, type PatternSpec, type PlRoundT } from "../../../../shared/studio-spec-ext/pattern.ts";
import { C, W, H } from "../../core/tokens.ts";
import { hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill } from "./kit.ts";

const CHECK = { x: 800, y: 530, w: 170, h: 62 };
const GRID = { x: 180, y: 190, c: 100 };
const tray = (i: number) => ({ x: 790 + (i % 3) * 64, y: 190 + Math.floor(i / 3) * 70, w: 58, h: 58 });
const PT = { x: 400, y: 390, L: 110 };
const D2R = Math.PI / 180;
function create(api: EngineApi, spec: PatternSpec): EngineInstance {
  const T = spec.strings, accent = "#FFB547";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 197 + 31), setTask = taskPill(api);
  const g = { grid: [] as (number | null)[], pool: [] as (number | null)[], drag: -1, dragXY: [0, 0] as [number, number], cur: "", found: [] as string[], flash: "", flashT: 0, map: {} as Record<string, number>, shapes: [] as number[], answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, plan: [] as number[], sol: null as number[] | null, slip: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): PlRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { grid: Array(9).fill(null), pool: [], drag: -1, cur: "", found: [], flash: "", flashT: 0, map: {}, shapes: [], answered: false, verdict: "", detail: "", revealT: 0, slip: botR() < 0.12 });
      if (r.mode === "magic") { const pool = [...r.tiles]; for (const [c, v] of r.givens) { g.grid[c] = v; pool.splice(pool.indexOf(v), 1); } g.pool = pool; g.sol = magicSolve(r); }
      if (r.mode === "cipher") for (const L of letters(r)) g.map[L] = 0;
      if (r.mode === "tile") g.plan = tilePlans(r)[0] ?? [];
      setTask(`${T.round} ${k + 1}`, r.sub || r.title); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
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
  const inB = (p: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const RB = { S: { x: 140, y: 470, w: 150, h: 64 }, L: { x: 300, y: 470, w: 150, h: 64 }, X: { x: 460, y: 470, w: 150, h: 64 }, A: { x: 620, y: 470, w: 150, h: 64 } };
  const dial = (i: number, n: number) => ({ x: 400 - (n * 130) / 2 + i * 130, y: 470, w: 116, h: 130 });
  const palette = (i: number) => ({ x: 783 + (i % 2) * 106, y: 182 + Math.floor(i / 2) * 104, w: 100, h: 96 });
  function play(s: string) { let t = 0; for (const c of s) { const at = t; setTimeout(() => sfx.blip({ f: c === "S" ? 520 : 330, dur: c === "S" ? 0.08 : 0.2, type: "triangle", gain: 0.1 }), at * 1000); t += c === "S" ? 0.18 : 0.36; } }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd();
      if (r.mode === "magic") {
        if (inB(p, CHECK) && g.grid.every((v) => v !== null)) { judge({ grid: g.grid }, magicOk(r, g.grid) ? "right" : "wrong"); return; }
        for (let i = 0; i < g.pool.length; i++) if (g.pool[i] !== null && inB(p, tray(i))) { g.drag = i; g.dragXY = [p.x, p.y]; return; }
        const cx = Math.floor((p.x - GRID.x) / GRID.c), cy = Math.floor((p.y - GRID.y) / GRID.c), c = cy * 3 + cx;
        if (cx >= 0 && cx < 3 && cy >= 0 && cy < 3 && g.grid[c] !== null && !r.givens.some(([gc]) => gc === c)) { const v = g.grid[c]; g.grid[c] = null; const slot = g.pool.indexOf(null); if (slot >= 0) g.pool[slot] = v; else g.pool.push(v); api.record("unplace", { cell: c }); }
        return;
      }
      if (r.mode === "rhythm") {
        const used = [...g.cur].reduce((a, c) => a + (c === "S" ? 1 : 2), 0);
        if (inB(p, RB.S) && used + 1 <= r.beats) { g.cur += "S"; sfx.blip({ f: 520, dur: 0.06, type: "triangle", gain: 0.08 }); return; }
        if (inB(p, RB.L) && used + 2 <= r.beats) { g.cur += "L"; sfx.blip({ f: 330, dur: 0.14, type: "triangle", gain: 0.08 }); return; }
        if (inB(p, RB.X)) { g.cur = ""; return; }
        if (inB(p, RB.A) && rhythmOk(r.beats, g.cur)) { if (g.found.includes(g.cur)) { g.flash = T.repeat; g.flashT = 1.2; sfx.blip({ f: 200, dur: 0.12, gain: 0.08 }); } else { g.found.push(g.cur); play(g.cur); api.record("rhythm", { s: g.cur }); } g.cur = ""; return; }
        if (inB(p, CHECK) && g.found.length) { const all = allRhythms(r.beats); judge({ found: g.found }, all.every((s) => g.found.includes(s)) ? "right" : "wrong"); }
        return;
      }
      if (r.mode === "cipher") {
        const L = letters(r);
        if (inB(p, CHECK)) { judge({ map: { ...g.map } }, cipherOk(r, g.map) ? "right" : "wrong"); return; }
        L.forEach((c, i) => { const d = dial(i, L.length); if (inB(p, d)) { g.map[c] = (g.map[c] + (p.y < d.y + d.h / 2 ? 1 : 9)) % 10; sfx.blip({ f: 400 + g.map[c] * 40, dur: 0.04, type: "triangle", gain: 0.07 }); api.record("dial", { letter: c, digit: g.map[c] }); } });
        return;
      }
      if (inB(p, CHECK) && g.shapes.length >= 3) { const t = tileOk(r, g.shapes); judge({ shapes: g.shapes }, t.ok ? "right" : "wrong"); return; }
      if (inB(p, { x: 120, y: 560, w: 160, h: 50 }) && g.shapes.length) { g.shapes.pop(); return; }
      (r.allowed as number[]).forEach((n, i) => { if (inB(p, palette(i)) && g.shapes.length < 8) { g.shapes.push(n); sfx.blip({ f: 300 + n * 30, dur: 0.06, type: "triangle", gain: 0.08 }); api.record("shape", { n }); } });
    },
    move(p) { if (g.drag >= 0) g.dragXY = [p.x, p.y]; },
    up(p) {
      if (g.drag < 0) return; const r = rd(); const i = g.drag; g.drag = -1; if (r.mode !== "magic" || !p) return;
      const cx = Math.floor((p.x - GRID.x) / GRID.c), cy = Math.floor((p.y - GRID.y) / GRID.c), c = cy * 3 + cx;
      if (cx >= 0 && cx < 3 && cy >= 0 && cy < 3 && g.grid[c] === null) { g.grid[c] = g.pool[i]; g.pool[i] = null; sfx.blip({ f: 600, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("place", { cell: c, v: g.grid[c] }); }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    g.flashT = Math.max(0, g.flashT - dt);
    if (g.answered) { g.revealT += dt; if (g.revealT > 3) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 197, 0); }
  function btn(ctx: Ctx, b: { x: number; y: number; w: number; h: number }, label: string, on: boolean, now: number, col: string = C.volt) {
    ctx.save(); ctx.fillStyle = on ? hexA(col, 0.14) : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill(); ctx.strokeStyle = on ? hexA(col, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 2, { size: 38, weight: 800, color: on ? col : C.ink3, align: "center", baseline: "middle", maxWidth: b.w - 12 });
  }
  function polyAt(ctx: Ctx, n: number, theta: number, col: string, alpha = 0.8) {
    const ext = 360 / n; let [x, y] = [PT.x, PT.y], h = theta; ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < n - 1; k++) { x += PT.L * Math.cos(h * D2R); y -= PT.L * Math.sin(h * D2R); ctx.lineTo(x, y); h += ext; }
    ctx.closePath(); ctx.fillStyle = hexA(col, alpha * 0.55); ctx.fill(); ctx.strokeStyle = hexA(col, alpha); ctx.lineWidth = 3; ctx.stroke();
  }
  const POLY_COL: Record<number, string> = { 3: "#FF8FB1", 4: "#5FA8FF", 5: "#C9A7FF", 6: "#7FD3A6", 8: "#FFB547", 12: "#9FE7FF" };
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "magic") {
      const S = magicSum(r), lineSum = (l: number[]) => (l.every((i) => g.grid[i] !== null) ? l.reduce((a, i) => a + (g.grid[i] as number), 0) : null);
      for (let c = 0; c < 9; c++) { const x = GRID.x + (c % 3) * GRID.c, y = GRID.y + Math.floor(c / 3) * GRID.c, given = r.givens.some(([gc]) => gc === c); ctx.save(); ctx.fillStyle = given ? "rgba(255,181,71,.12)" : "rgba(22,26,36,.92)"; roundRect(ctx, x + 4, y + 4, GRID.c - 8, GRID.c - 8, 12); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); if (g.grid[c] !== null) api.text(ctx, String(g.grid[c]), x + GRID.c / 2, y + GRID.c / 2 + 3, { font: "display", size: 52, weight: 800, color: given ? accent : C.ink, align: "center", baseline: "middle" }); }
      const lab = (v: number | null, x: number, y: number) => api.text(ctx, v === null ? "·" : String(v), x, y, { font: "mono", size: 38, weight: 700, color: v === S ? C.mint : v === null ? C.ink3 : C.ink2, align: "center", baseline: "middle" });
      LINES3.slice(0, 3).forEach((l, i) => lab(lineSum(l), GRID.x + 3 * GRID.c + 44, GRID.y + i * GRID.c + GRID.c / 2));
      LINES3.slice(3).forEach((l, i) => lab(lineSum(l), GRID.x + i * GRID.c + GRID.c / 2, GRID.y + 3 * GRID.c + 34));
      if (r.diagonals) { lab(lineSum(DIAG3[0]), GRID.x + 3 * GRID.c + 44, GRID.y + 3 * GRID.c + 34); lab(lineSum(DIAG3[1]), GRID.x + 3 * GRID.c + 44, GRID.y - 26); }
      api.text(ctx, `${T.magic} ${S}`, 400, 590, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 560 });
      g.pool.forEach((v, i) => { if (v === null || i === g.drag) return; const b = tray(i); ctx.save(); ctx.fillStyle = "rgba(255,181,71,.16)"; roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, String(v), b.x + b.w / 2, b.y + b.h / 2 + 2, { font: "display", size: 40, weight: 800, color: C.ink, align: "center", baseline: "middle" }); });
      if (g.drag >= 0) { const [x, y] = g.dragXY; bloom(ctx, accent, x, y, 40, 0.5); api.text(ctx, String(g.pool[g.drag]), x, y, { font: "display", size: 52, weight: 800, color: C.volt, align: "center", baseline: "middle" }); }
      btn(ctx, CHECK, T.check, !done && g.grid.every((v) => v !== null), now);
    } else if (r.mode === "rhythm") {
      const unit = Math.min(64, 520 / r.beats), used = [...g.cur].reduce((a, c) => a + (c === "S" ? 1 : 2), 0);
      ctx.save(); ctx.strokeStyle = C.line2; ctx.setLineDash([6, 6]); ctx.strokeRect(140, 190, r.beats * unit, 70); ctx.restore();
      let x = 140; for (const c of g.cur) { const w = (c === "S" ? 1 : 2) * unit; ctx.save(); ctx.fillStyle = c === "S" ? "#5FA8FF" : accent; roundRect(ctx, x + 3, 194, w - 6, 62, 10); ctx.fill(); ctx.restore(); api.text(ctx, c === "S" ? "।" : "ऽ", x + w / 2, 226, { font: "display", size: 40, weight: 800, color: "#0B0E14", align: "center", baseline: "middle", decor: true }); x += w; }
      api.text(ctx, `${used} / ${r.beats} ${T.beats}`, 140 + r.beats * unit + 20, 226, { font: "mono", size: 38, weight: 600, color: used === r.beats ? C.mint : C.ink2, baseline: "middle" });
      g.found.forEach((s, i) => { const col = i % 4, row = Math.floor(i / 4), u = 16, bx = 140 + col * 160, by = 290 + row * 32; let xx = bx; for (const c of s) { const w = (c === "S" ? 1 : 2) * u; ctx.fillStyle = c === "S" ? "#5FA8FF" : accent; ctx.fillRect(xx + 1, by, w - 2, 22); xx += w; } });
      btn(ctx, RB.S, `। ${T.short}`, !done && used + 1 <= r.beats, now, "#5FA8FF"); btn(ctx, RB.L, `ऽ ${T.long}`, !done && used + 2 <= r.beats, now, accent); btn(ctx, RB.X, T.clear, !done && g.cur.length > 0, now, C.ink2); btn(ctx, RB.A, T.add, !done && rhythmOk(r.beats, g.cur), now, C.mint);
      api.text(ctx, `${g.found.length}`, 885, 260, { font: "display", size: 60, weight: 800, color: C.volt, align: "center", baseline: "middle" }); api.text(ctx, T.found, 885, 316, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      if (g.flashT > 0) pill(api, ctx, g.flash, 400, 570, { color: C.amber, size: 38 });
      btn(ctx, CHECK, T.check, !done && g.found.length > 0, now);
    } else if (r.mode === "cipher") {
      const L = letters(r), rows = [...r.terms, r.total], width = Math.max(...rows.map((w) => w.length)), cw = 62, right = 520;
      rows.forEach((w, j) => { const y = 214 + j * 92 + (j === rows.length - 1 ? 20 : 0); [...w].forEach((c, k) => { const x = right - (w.length - k) * cw + cw / 2; api.text(ctx, String(g.map[c] ?? "?"), x, y, { font: "display", size: 52, weight: 800, color: C.ink, align: "center", baseline: "middle" }); api.text(ctx, c, x + 22, y - 26, { font: "mono", size: 38, weight: 700, color: accent, align: "center", baseline: "middle", decor: true }); }); if (j === rows.length - 2) { ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(right - width * cw - 40, y + 46); ctx.lineTo(right + 10, y + 46); ctx.stroke(); ctx.restore(); api.text(ctx, "+", right - width * cw - 30, y, { font: "display", size: 48, weight: 800, color: C.ink2, align: "center", baseline: "middle" }); } });
      const live = cipherOk(r, g.map); api.text(ctx, live ? "✓" : "≠", 600, 214 + (rows.length - 1) * 92 + 20, { font: "display", size: 52, weight: 800, color: live ? C.mint : C.amber, align: "center", baseline: "middle" });
      L.forEach((c, i) => { const d = dial(i, L.length); ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, d.x, d.y, d.w, d.h, 14); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, "▲", d.x + d.w / 2, d.y + 22, { size: 38, weight: 700, color: C.ink2, align: "center", baseline: "middle", decor: true }); api.text(ctx, `${c}=${g.map[c]}`, d.x + d.w / 2, d.y + d.h / 2 + 2, { font: "display", size: 40, weight: 800, color: accent, align: "center", baseline: "middle", maxWidth: d.w - 8 }); api.text(ctx, "▼", d.x + d.w / 2, d.y + d.h - 20, { size: 38, weight: 700, color: C.ink2, align: "center", baseline: "middle", decor: true }); });
      btn(ctx, CHECK, T.check, !done, now);
    } else {
      let th = 0; g.shapes.forEach((n) => { polyAt(ctx, n, th, POLY_COL[n] ?? accent); th += interior(n); });
      const t = tileOk(r, g.shapes), over = t.sum > 360 + 1e-6;
      ctx.save(); ctx.strokeStyle = over ? C.amber : Math.abs(t.sum - 360) < 1e-6 ? C.mint : C.volt; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(PT.x, PT.y, 34, 0, -Math.min(360, t.sum) * D2R, true); ctx.stroke(); ctx.restore(); bloom(ctx, C.ink, PT.x, PT.y, 20, 0.5);
      api.text(ctx, `${Math.round(t.sum)}° / 360°`, 400, 190, { font: "mono", size: 38, weight: 700, color: over ? C.amber : C.ink, align: "center", baseline: "middle" });
      (r.allowed as number[]).forEach((n, i) => { const b = palette(i); ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.strokeStyle = hexA(POLY_COL[n] ?? accent, 0.8); ctx.lineWidth = 2; ctx.stroke(); const cx = b.x + b.w / 2, cy = b.y + 40, R = 24; ctx.beginPath(); for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k / n) * Math.PI * 2; if (k) ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); else ctx.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); } ctx.closePath(); ctx.fillStyle = hexA(POLY_COL[n] ?? accent, 0.6); ctx.fill(); ctx.restore(); api.text(ctx, `${Math.round(interior(n))}°`, cx, b.y + 80, { size: 38, weight: 700, color: C.ink2, align: "center", baseline: "middle", maxWidth: b.w - 4 }); });
      btn(ctx, { x: 120, y: 560, w: 160, h: 50 }, "UNDO", !done && g.shapes.length > 0, now, C.ink2);
      btn(ctx, CHECK, T.check, !done && g.shapes.length >= 3, now);
    }
    if (done) { pill(api, ctx, g.detail, 400, 160 + 0, { color: ok ? C.mint : C.amber, size: 38 }); if (ok) tick(ctx, 720, 590, C.mint, 1); else magnifier(ctx, 715, 590, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = g.slip;
    if (r.mode === "magic") {
      const sol = g.sol; if (!sol) return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
      const c = g.grid.findIndex((v, i) => v === null && i >= 0); if (c < 0) return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
      const want = slip && c === g.grid.indexOf(null) && g.grid.filter((v) => v === null).length === 2 ? g.pool.find((v) => v !== null && v !== sol[c]) ?? sol[c] : sol[c], found = g.pool.findIndex((v) => v === want), i = found >= 0 ? found : g.pool.findIndex((v) => v !== null); if (i < 0) return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
      const b = tray(i); return { type: "drag", from: [b.x + 29, b.y + 29], to: [GRID.x + (c % 3 + 0.5) * GRID.c, GRID.y + (Math.floor(c / 3) + 0.5) * GRID.c], ms: 400, after: 200 };
    }
    if (r.mode === "rhythm") {
      const all = allRhythms(r.beats), next = all.find((s) => !g.found.includes(s)); if (!next || (slip && g.found.length >= all.length - 1)) return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
      if (g.cur.length < next.length && next.startsWith(g.cur)) { const c = next[g.cur.length], b = c === "S" ? RB.S : RB.L; return { type: "tap", at: [b.x + 75, b.y + 32], after: 150 }; }
      if (g.cur === next) return { type: "tap", at: [RB.A.x + 75, RB.A.y + 32], after: 300 };
      return { type: "tap", at: [RB.X.x + 75, RB.X.y + 32], after: 150 };
    }
    if (r.mode === "cipher") {
      const sol = cipherSolutions(r, 1)[0]; const L = letters(r); if (!sol) return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
      const i = L.findIndex((c) => g.map[c] !== sol[c]); if (i < 0 || (slip && i === L.length - 1)) return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
      const d = dial(i, L.length); return { type: "tap", at: [d.x + d.w / 2, d.y + 20], after: 120 };
    }
    if (g.shapes.length < g.plan.length && !slip) { const i = (r.allowed as number[]).indexOf(g.plan[g.shapes.length]), b = palette(i); return { type: "tap", at: [b.x + b.w / 2, b.y + 40], after: 300 }; }
    return { type: "tap", at: [CHECK.x + 85, CHECK.y + 31], after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, grid: g.grid, found: g.found.length, map: g.map, shapes: g.shapes, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const pattern: EngineDef<PatternSpec> = { archetype: "pattern-lab@1", label: "Game · Pattern Lab", accent: "#FFB547", create };
