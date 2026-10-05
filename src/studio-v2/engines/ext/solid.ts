// SOLID STUDIO — `solid-view@1` (VALUES-100 V3.1: 3D shapes and views). A real 3D solid, back faces culled, lit by its
// normals: the corners, edges and faces you have not seen yet only appear when you turn it. Build mode stacks real
// cubes from a plan grid and draws your model's top / front / side views live beside the target's.
import { POLY, edgesOf, featureIds, viewFront, viewSide, viewTop, viewsMatch, type SolidRoundT, type SolidSpec, type V3 } from "../../../../shared/studio-spec-ext/solid.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill, textBlock } from "./kit.ts";

const LOCK = { x: 800, y: 530, w: 170, h: 62 };
const SC = { x: 400, y: 390, s: 135 };
const PLAN = { x: 560, y: 360, cell: 50 };
function create(api: EngineApi, spec: SolidSpec): EngineInstance {
  const T = spec.strings, accent = C.ion;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 193 + 29), setTask = taskPill(api);
  const g = { yaw: 0.6, pitch: 0.42, drag: false, last: [0, 0] as [number, number], moved: 0, marked: new Set<string>(), h: [] as number[][], answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, botTurn: 0 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): SolidRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k]; Object.assign(g, { yaw: 0.6, pitch: 0.42, drag: false, moved: 0, marked: new Set<string>(), answered: false, verdict: "", detail: "", revealT: 0, botTurn: 0 });
      if (r.mode === "build") g.h = r.heights.map((row) => row.map(() => 0));
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
  const rot = (p: V3): V3 => { const [x, y, z] = p, cy = Math.cos(g.yaw), sy = Math.sin(g.yaw), x1 = x * cy + z * sy, z1 = -x * sy + z * cy, cp = Math.cos(g.pitch), sp = Math.sin(g.pitch); return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
  const scr = (p: V3, s = SC.s, cx = SC.x, cy = SC.y): [number, number] => [cx + p[0] * s, cy - p[1] * s];
  /** the solid as seen now: projected vertices, visible faces (outward normal toward the viewer) */
  function view(r: Extract<SolidRoundT, { mode: "count" }>) {
    const P = POLY[r.solid], R = P.v.map(rot), S = R.map((p) => scr(p)), cen = R.reduce((a, p) => [a[0] + p[0] / R.length, a[1] + p[1] / R.length, a[2] + p[2] / R.length] as V3, [0, 0, 0] as V3);
    const faces = P.f.map((f, i) => { const a = R[f[0]], b = R[f[1]], c = R[f[2]], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const fc = f.reduce((acc, k) => [acc[0] + R[k][0] / f.length, acc[1] + R[k][1] / f.length, acc[2] + R[k][2] / f.length] as V3, [0, 0, 0] as V3); if ((fc[0] - cen[0]) * n[0] + (fc[1] - cen[1]) * n[1] + (fc[2] - cen[2]) * n[2] < 0) n = [-n[0], -n[1], -n[2]]; const L = Math.hypot(...n) || 1; return { i, f, n: [n[0] / L, n[1] / L, n[2] / L] as V3, vis: n[2] / L > 0.02, z: fc[2], c: scr(fc) }; });
    const visFace = new Set(faces.filter((f) => f.vis).map((f) => f.i));
    const vVis = P.v.map((_, k) => P.f.some((f, i) => visFace.has(i) && f.includes(k)));
    const edges = edgesOf(P).map(([a, b]) => ({ id: `e${a}-${b}`, a, b, vis: P.f.some((f, i) => visFace.has(i) && f.includes(a) && f.includes(b) && (Math.abs(f.indexOf(a) - f.indexOf(b)) === 1 || Math.abs(f.indexOf(a) - f.indexOf(b)) === f.length - 1)) }));
    return { P, S, faces, vVis, edges };
  }
  function pick(r: Extract<SolidRoundT, { mode: "count" }>, p: { x: number; y: number }): string | null {
    const V = view(r);
    if (r.feature === "corners") { let best: string | null = null, bd = 30; V.S.forEach((q, i) => { if (!V.vVis[i]) return; const d = Math.hypot(q[0] - p.x, q[1] - p.y); if (d < bd) { bd = d; best = `v${i}`; } }); return best; }
    if (r.feature === "edges") { let best: string | null = null, bd = 24; for (const e of V.edges) { if (!e.vis) continue; const [ax, ay] = V.S[e.a], [bx, by] = V.S[e.b], t = clamp(((p.x - ax) * (bx - ax) + (p.y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1), 0, 1), d = Math.hypot(p.x - (ax + t * (bx - ax)), p.y - (ay + t * (by - ay))); if (d < bd) { bd = d; best = e.id; } } return best; }
    const inside = (poly: [number, number][]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const hit = V.faces.filter((f) => f.vis && inside(f.f.map((k) => V.S[k]))).sort((a, b) => b.z - a.z)[0]; return hit ? `f${hit.i}` : null;
  }
  const planCell = (r: Extract<SolidRoundT, { mode: "build" }>, p: { x: number; y: number }) => { const x = Math.floor((p.x - PLAN.x) / PLAN.cell), z = Math.floor((p.y - PLAN.y) / PLAN.cell); return x >= 0 && z >= 0 && z < r.heights.length && x < r.heights[0].length ? [x, z] : null; };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd();
      if (p.x >= LOCK.x && p.x <= LOCK.x + LOCK.w && p.y >= LOCK.y && p.y <= LOCK.y + LOCK.h) {
        if (r.mode === "count" && g.marked.size) { const all = featureIds(r.solid, r.feature); judge({ marked: [...g.marked] }, all.every((f) => g.marked.has(f)) ? "right" : "wrong"); }
        else if (r.mode === "build" && g.h.flat().some((v) => v > 0)) { const mt = viewsMatch(r.heights, g.h); judge({ heights: g.h }, mt.top && mt.front && mt.side ? "right" : "wrong"); }
        return;
      }
      if (r.mode === "build") { const c = planCell(r, p); if (c) { g.h[c[1]][c[0]] = (g.h[c[1]][c[0]] + 1) % 4; sfx.blip({ f: 400 + g.h[c[1]][c[0]] * 120, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("stack", { x: c[0], z: c[1], h: g.h[c[1]][c[0]] }); return; } }
      g.drag = true; g.last = [p.x, p.y]; g.moved = 0;
    },
    move(p) { if (!g.drag) return; const dx = p.x - g.last[0], dy = p.y - g.last[1]; g.yaw += dx * 0.012; g.pitch = clamp(g.pitch + dy * 0.008, -1.2, 1.2); g.moved += Math.abs(dx) + Math.abs(dy); g.last = [p.x, p.y]; },
    up(p) {
      if (!g.drag) return; g.drag = false; const r = rd();
      if (r.mode === "count" && g.moved < 8 && !g.answered) { const id = pick(r, p ?? { x: g.last[0], y: g.last[1] }); if (id) { if (g.marked.has(id)) g.marked.delete(id); else g.marked.add(id); sfx.blip({ f: 700, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("mark", { id, on: g.marked.has(id) }); } }
      else if (g.moved >= 8) api.record("turn", { yaw: +g.yaw.toFixed(2), pitch: +g.pitch.toFixed(2) });
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (g.answered) { g.yaw += dt * 0.6; g.revealT += dt; if (g.revealT > 3) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 193, 0); }
  function lockBtn(ctx: Ctx, on: boolean, now: number) { ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)"; roundRect(ctx, LOCK.x, LOCK.y, LOCK.w, LOCK.h, 16); ctx.fill(); ctx.strokeStyle = on ? hexA(C.volt, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, T.lock, LOCK.x + LOCK.w / 2, LOCK.y + LOCK.h / 2 + 2, { font: "display", size: 38, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle" }); }
  function cubeAt(ctx: Ctx, x: number, y: number, z: number, s: number, cx: number, cy: number, col: string) {
    const corners: V3[] = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]].map(([a, b, c]) => rot([x + a, y + b, z + c]));
    const faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]], norms: V3[] = [[0, 0, -1], [0, 0, 1], [0, -1, 0], [0, 1, 0], [-1, 0, 0], [1, 0, 0]];
    faces.forEach((f, i) => { const n = rot(norms[i]); if (n[2] <= 0.01) return; const sh = 0.55 + 0.45 * Math.max(0, n[1] * 0.6 + n[2] * 0.6); ctx.fillStyle = hexA(col, sh); ctx.beginPath(); f.forEach((k, j) => { const [px, py] = scr(corners[k], s, cx, cy); if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 1.5; ctx.stroke(); });
  }
  function viewGrid(ctx: Ctx, cells: number[][], x: number, y: number, size: number, col: string, outline: boolean) {
    cells.forEach((row, j) => row.forEach((v, i) => { if (!v) return; ctx.save(); if (outline) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.strokeRect(x + i * size + 1, y + j * size + 1, size - 2, size - 2); } else { ctx.fillStyle = hexA(col, 0.55); ctx.fillRect(x + i * size + 3, y + j * size + 3, size - 6, size - 6); } ctx.restore(); }));
  }
  const colGrid = (cols: number[], maxH: number) => Array.from({ length: maxH }, (_, row) => cols.map((h) => (h >= maxH - row ? 1 : 0)));
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "count") {
      const V = view(r), light: V3 = [0.4, 0.7, 0.6];
      bloom(ctx, accent, SC.x, SC.y, 240, 0.12);
      for (const f of [...V.faces].filter((q) => q.vis).sort((a, b) => a.z - b.z)) { const sh = 0.35 + 0.55 * Math.max(0, f.n[0] * light[0] + f.n[1] * light[1] + f.n[2] * light[2]); const mk = r.feature === "faces" && g.marked.has(`f${f.i}`); ctx.save(); ctx.fillStyle = mk ? hexA(C.volt, 0.55) : `rgba(${Math.round(90 + 120 * sh)},${Math.round(120 + 110 * sh)},${Math.round(180 + 60 * sh)},.92)`; ctx.beginPath(); f.f.forEach((k, j) => (j ? ctx.lineTo(V.S[k][0], V.S[k][1]) : ctx.moveTo(V.S[k][0], V.S[k][1]))); ctx.closePath(); ctx.fill(); ctx.restore(); }
      for (const e of V.edges) { if (!e.vis) continue; const mk = r.feature === "edges" && g.marked.has(e.id); ctx.save(); ctx.strokeStyle = mk ? C.volt : "rgba(10,14,24,.8)"; ctx.lineWidth = mk ? 7 : 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(V.S[e.a][0], V.S[e.a][1]); ctx.lineTo(V.S[e.b][0], V.S[e.b][1]); ctx.stroke(); ctx.restore(); }
      if (r.feature === "corners") V.S.forEach(([x, y], i) => { if (!V.vVis[i]) return; const mk = g.marked.has(`v${i}`); ctx.save(); ctx.fillStyle = mk ? C.volt : "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(x, y, mk ? 11 : 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
      api.text(ctx, T[r.feature], 885, 230, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 210 });
      api.text(ctx, `${g.marked.size}`, 885, 290, { font: "display", size: 60, weight: 800, color: C.volt, align: "center", baseline: "middle" });
      api.text(ctx, T.marked, 885, 344, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 210 });
      textBlock(api, ctx, T[r.solid], SC.x, 600, 520, { size: 38, weight: 700, color: C.ink2 }, 1);
      if (!done && g.moved === 0 && g.marked.size === 0) pill(api, ctx, T.turn, SC.x, 190, { color: C.volt, size: 38 });
      if (done) pill(api, ctx, g.detail, SC.x, 190, { color: ok ? C.mint : C.amber, size: 38 });
      lockBtn(ctx, !done && g.marked.size > 0, now);
    } else {
      const d = r.heights.length, w = r.heights[0].length, s = 60, cx = 290, cy = 440;
      const cubes: { x: number; y: number; z: number; depth: number }[] = []; g.h.forEach((row, z) => row.forEach((h, x) => { for (let y = 0; y < h; y++) { const c = rot([x - w / 2 + 0.5, y, z - d / 2 + 0.5]); cubes.push({ x, y, z, depth: c[2] }); } }));
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1.5; for (let z = 0; z <= d; z++) { const a = scr(rot([-w / 2, 0, z - d / 2]), s, cx, cy), b = scr(rot([w / 2, 0, z - d / 2]), s, cx, cy); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } for (let x = 0; x <= w; x++) { const a = scr(rot([x - w / 2, 0, -d / 2]), s, cx, cy), b = scr(rot([x - w / 2, 0, d / 2]), s, cx, cy); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } ctx.restore();
      for (const c of cubes.sort((a, b) => a.depth - b.depth)) cubeAt(ctx, c.x - w / 2, c.y, c.z - d / 2, s, cx, cy, "#7FB2FF");
      const fa = scr(rot([0, 0, d / 2 + 1.4]), s, cx, cy); api.text(ctx, `${T.front} ↑`, clamp(fa[0], 140, 480), clamp(fa[1] + 24, 200, 600), { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", decor: true });
      g.h.forEach((row, z) => row.forEach((h, x) => { const X = PLAN.x + x * PLAN.cell, Y = PLAN.y + z * PLAN.cell; ctx.save(); ctx.fillStyle = h ? hexA("#7FB2FF", 0.15 + h * 0.2) : "rgba(22,26,36,.9)"; ctx.fillRect(X + 2, Y + 2, PLAN.cell - 4, PLAN.cell - 4); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.strokeRect(X + 2, Y + 2, PLAN.cell - 4, PLAN.cell - 4); ctx.restore(); if (h) api.text(ctx, String(h), X + PLAN.cell / 2, Y + PLAN.cell / 2 + 2, { font: "display", size: 38, weight: 800, color: C.ink, align: "center", baseline: "middle" }); }));
      textBlock(api, ctx, T.plan, PLAN.x + (w * PLAN.cell) / 2, PLAN.y - 56, 250, { size: 38, weight: 600, color: C.ink2 }, 2, 1.0);
      const maxH = Math.max(3, ...g.h.flat()), mt = viewsMatch(r.heights, g.h), vs = 16;
      const blocks: [string, number[][], number[][], boolean][] = [[T.top, viewTop(r.heights), viewTop(g.h), mt.top], [T.front, colGrid(viewFront(r.heights), maxH), colGrid(viewFront(g.h), maxH), mt.front], [T.side, colGrid([...viewSide(r.heights)].reverse(), maxH), colGrid([...viewSide(g.h)].reverse(), maxH), mt.side]];
      blocks.forEach(([lab, tgt, mine, ok2], i) => { const y0 = 180 + i * 116; api.text(ctx, lab, 830, y0 + 18, { size: 38, weight: 700, color: ok2 ? C.mint : C.ink2, baseline: "middle" }); const gx = 830, gy = y0 + 44; viewGrid(ctx, mine, gx, gy, vs, "#7FB2FF", false); viewGrid(ctx, tgt, gx, gy, vs, ok2 ? C.mint : C.sun, true); });
      if (done) pill(api, ctx, g.detail, 300, 190, { color: ok ? C.mint : C.amber, size: 38 });
      lockBtn(ctx, !done && g.h.flat().some((v) => v > 0), now);
    }
    if (done) { if (ok) tick(ctx, 965, 470, C.mint, 1); else magnifier(ctx, 960, 470, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.06;
    if (r.mode === "count") {
      const all = featureIds(r.solid, r.feature); if (all.every((f) => g.marked.has(f)) || g.botTurn > 9) return { type: "tap", at: [LOCK.x + 85, LOCK.y + 31], after: 400 };
      const V = view(r);
      const todo = r.feature === "corners" ? V.S.map((q, i) => ({ id: `v${i}`, at: q, vis: V.vVis[i] })) : r.feature === "edges" ? V.edges.map((e) => ({ id: e.id, at: [(V.S[e.a][0] + V.S[e.b][0]) / 2, (V.S[e.a][1] + V.S[e.b][1]) / 2] as [number, number], vis: e.vis })) : V.faces.map((f) => ({ id: `f${f.i}`, at: f.c, vis: f.vis }));
      const next = todo.find((t) => t.vis && !g.marked.has(t.id) && pick(r, { x: t.at[0], y: t.at[1] }) === t.id);
      if (next && !slip) return { type: "tap", at: next.at, after: 250 };
      g.botTurn++; return { type: "drag", from: [SC.x - 60, 560], to: [SC.x + 60, 560 + (g.botTurn % 3 === 2 ? -60 : g.botTurn % 3 === 0 ? 40 : 0)], ms: 400, after: 300 };
    }
    for (let z = 0; z < r.heights.length; z++) for (let x = 0; x < r.heights[0].length; x++) if (g.h[z][x] !== r.heights[z][x] && !(slip && z === 0 && x === 0)) return { type: "tap", at: [PLAN.x + (x + 0.5) * PLAN.cell, PLAN.y + (z + 0.5) * PLAN.cell], after: 200 };
    return { type: "tap", at: [LOCK.x + 85, LOCK.y + 31], after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, marked: g.marked.size, heights: g.h, yaw: +g.yaw.toFixed(2), verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const solid: EngineDef<SolidSpec> = { archetype: "solid-view@1", label: "Game · Solid Studio", accent: C.ion, create };
