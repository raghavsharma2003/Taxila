// GEO FORGE — `geo-forge@1` (VALUES-100 V3.1: geometry by building). A pin-board under a blueprint clock: tap pins to
// place corners (tap the first pin to close), two pins for a line, one pin for an equidistant point, three sticks
// from the tray, or braces across a frame that wobbles until it is rigid. CHECK hands the raw construction to the host,
// which judges it with exact lattice geometry (shared/studio-spec-ext/geo.ts) and the engine shows the measured truth.
import { GEO_COLS, GEO_ROWS, angleAt, area2, canTriangle, judgeGeo, perimeterRect, rectilinear, rigid, simple, type GeoCh, type GeoSpec, type GfRoundT, type P2 } from "../../../../shared/studio-spec-ext/geo.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady } from "./kit.ts";

const OX = 200, OY = 182, S = 50, UNDO = { x: 830, y: 300, w: 140, h: 62 }, CHECK = { x: 830, y: 380, w: 140, h: 70 };
const px = (p: P2): [number, number] => [OX + p[0] * S, OY + p[1] * S];
function create(api: EngineApi, spec: GeoSpec): EngineInstance {
  const T = spec.strings, accent = C.ion;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 127 + 3);
  const g = { ci: 0, pts: [] as P2[], closed: false, pick: [] as number[], edges: [] as [number, number][], bA: -1, clock: 0, answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, coachA: 1, coachGone: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "built", label: T.built }, { key: "clock", label: T.time, meter: true }]);
  const rd = (): GfRoundT => spec.rounds[Math.max(0, flow.round)];
  const ch = (): GeoCh => rd().challenges[g.ci];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.ci = 0; api.event("round_start", { round: k + 1, challenges: spec.rounds[k].challenges.map((c) => c.kind) }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); start(); },
    onEnd(k) { api.event("round_end", { round: k + 1 }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const L = (k: string) => (T as Record<string, string>)[k] ?? k;
  function prompt(c: GeoCh): string {
    switch (c.kind) {
      case "polygon": return `${T.make} ${c.sides}-${T.polygon} ${T.any}`;
      case "perimeter": return `${T.make} ${T.any} ${T.withPerim} ${c.value} ${T.units}`;
      case "area": return `${T.make} ${L(c.shape === "any" ? "any" : c.shape)} ${T.withArea} ${c.value} ${T.sq}`;
      case "triangle": return `${T.make} ${L(c.type)}`;
      case "quad": return `${T.make} ${L(c.type)}`;
      case "sticks": return c.want === "triangle" ? T.sticks : T.noTriangle;
      case "rigid": return T.rigid;
      case "parallel": return T.parallel; case "perpendicular": return T.perpendicular;
      case "equidistant": return T.equidistant; case "angle": return `${T.angle} ${c.deg}°`;
    }
  }
  function start() { g.pts = []; g.closed = false; g.pick = []; g.edges = []; g.bA = -1; g.clock = rd().time; g.answered = false; g.verdict = ""; g.detail = ""; g.revealT = 0; api.task(`${T.round} ${flow.round + 1}`, prompt(ch())); }
  function check() {
    if (g.answered || flow.state !== "play") return;
    const c = ch(), value = { pts: g.pts, pick: g.pick, edges: g.edges };
    const j = judgeGeo(c, value);
    const grade = api.answer(`r${flow.round + 1}:${g.ci}`, value, j.ok ? "right" : "wrong");
    g.answered = true; g.verdict = grade.verdict; g.detail = grade.detail ?? j.detail; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; const [cx, cy] = g.pts.length ? px(g.pts[0]) : [500, 330]; api.fx.burst(cx, cy, { n: 30, color: C.mint, speed: 400, life: 0.6, size: 10 }); api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else { sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 }); api.fx.shake(4, 0.2); }
    api.facts({ challenge: c.kind, verdict: grade.verdict, measured: g.detail });
  }
  const nearPin = (x: number, y: number): P2 | null => { const c = Math.round((x - OX) / S), r = Math.round((y - OY) / S); if (c < 0 || c >= GEO_COLS || r < 0 || r >= GEO_ROWS) return null; const [qx, qy] = px([c, r]); return Math.hypot(qx - x, qy - y) < 22 ? [c, r] : null; };
  const stickRects = (c: Extract<GeoCh, { kind: "sticks" }>) => c.sticks.map((s, i) => ({ s, x: 140, y: 196 + i * 58, w: s * 50, h: 34 }));
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      if (p.x >= CHECK.x && p.x <= CHECK.x + CHECK.w && p.y >= CHECK.y && p.y <= CHECK.y + CHECK.h) { check(); return; }
      if (p.x >= UNDO.x && p.x <= UNDO.x + UNDO.w && p.y >= UNDO.y && p.y <= UNDO.y + UNDO.h) { if (g.closed) g.closed = false; else g.pts.pop(); g.pick.pop(); g.edges.pop(); g.bA = -1; api.record("geo", { undo: true }); return; }
      const c = ch();
      if (c.kind === "sticks") { const hit = stickRects(c).findIndex((q) => p.x >= q.x - 10 && p.x <= q.x + Math.max(60, q.w) + 10 && p.y >= q.y - 12 && p.y <= q.y + q.h + 12); if (hit >= 0) { const k = g.pick.indexOf(hit); if (k >= 0) g.pick.splice(k, 1); else if (g.pick.length < 3) g.pick.push(hit); sfx.blip({ f: 500, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("geo", { pick: hit }); } return; }
      if (c.kind === "rigid") { const i = c.frame.findIndex((q) => { const [qx, qy] = px(q as P2); return Math.hypot(qx - p.x, qy - p.y) < 30; }); if (i < 0) return; if (g.bA < 0) g.bA = i; else { if (i !== g.bA && Math.abs(i - g.bA) !== 1 && !(Math.min(i, g.bA) === 0 && Math.max(i, g.bA) === c.frame.length - 1)) { g.edges.push([g.bA, i]); sfx.blip({ f: 700, dur: 0.06, type: "triangle", gain: 0.1 }); api.record("geo", { brace: [g.bA, i] }); } g.bA = -1; } return; }
      const pin = nearPin(p.x, p.y); if (!pin) return;
      const max = c.kind === "parallel" || c.kind === "perpendicular" ? 2 : c.kind === "equidistant" ? 1 : c.kind === "angle" ? 3 : 8;
      if (g.closed) return;
      if (["polygon", "perimeter", "area", "triangle", "quad"].includes(c.kind) && g.pts.length >= 3 && pin[0] === g.pts[0][0] && pin[1] === g.pts[0][1]) { g.closed = true; sfx.blip({ f: 660, f2: 990, dur: 0.12, type: "triangle", gain: 0.12 }); return; }
      if (g.pts.some((q) => q[0] === pin[0] && q[1] === pin[1])) return;
      if (g.pts.length < max) { g.pts.push(pin); sfx.blip({ f: 420 + g.pts.length * 40, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("geo", { pin }); }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    if (!g.answered) { g.clock -= dt; if (g.clock <= 0) check(); }
    else { g.revealT += dt; if (g.revealT > (g.verdict === "right" ? 2.2 : 3.4)) { if (g.ci + 1 < rd().challenges.length) { g.ci++; start(); } else flow.endRound(); } }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("built", `${g.right}/${g.n}`, { bump: true });
    hud.set("clock", `${Math.max(0, Math.ceil(g.clock))}s`, { meter: clamp(g.clock / rd().time, 0, 1), tone: g.clock < 8 ? "amber" : null });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 81, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const c = ch();
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    const ok = g.verdict === "right", done = g.answered;
    if (c.kind !== "sticks") for (let i = 0; i < GEO_COLS; i++) for (let j = 0; j < GEO_ROWS; j++) { const [x, y] = px([i, j]); ctx.fillStyle = "rgba(200,210,240,.35)"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    if (c.kind === "parallel" || c.kind === "perpendicular") {
      const [a, b] = c.line.map((q) => px(q as P2)); const dx = b[0] - a[0], dy = b[1] - a[1], k = 2000 / Math.hypot(dx, dy);
      ctx.save(); ctx.strokeStyle = C.sun; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a[0] - dx * k, a[1] - dy * k); ctx.lineTo(a[0] + dx * k, a[1] + dy * k); ctx.stroke(); ctx.restore();
      const [tx, ty] = px(c.through as P2); bloom(ctx, C.volt, tx, ty, 30, 0.6); ctx.fillStyle = C.volt; ctx.beginPath(); ctx.arc(tx, ty, 9, 0, Math.PI * 2); ctx.fill();
      if (g.pts.length === 2) { const [p0, p1] = g.pts.map(px); const ex = p1[0] - p0[0], ey = p1[1] - p0[1], kk = 2000 / Math.hypot(ex, ey); ctx.save(); ctx.strokeStyle = done ? (ok ? C.mint : C.amber) : accent; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p0[0] - ex * kk, p0[1] - ey * kk); ctx.lineTo(p0[0] + ex * kk, p0[1] + ey * kk); ctx.stroke(); ctx.restore(); }
    }
    if (c.kind === "equidistant") for (const q of c.points) { const [x, y] = px(q as P2); bloom(ctx, C.sun, x, y, 28, 0.6); ctx.fillStyle = C.sun; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); if (g.pts.length) { const [ox, oy] = px(g.pts[0]); ctx.save(); ctx.strokeStyle = hexA(done ? (ok ? C.mint : C.amber) : accent, 0.7); ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.arc(ox, oy, Math.hypot(x - ox, y - oy), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } }
    if (c.kind === "rigid") {
      const n = c.frame.length, isRigid = rigid(c.frame as P2[], [...c.frame.map((_, i) => [i, (i + 1) % n] as [number, number]), ...g.edges]);
      const wob = isRigid ? 0 : Math.sin(now * 3) * 0.18;
      const base = c.frame.map((q) => px(q as P2)), cy0 = Math.max(...base.map((b) => b[1]));
      const P = base.map(([x, y]) => [x + (cy0 - y) * wob, y] as [number, number]);
      ctx.save(); ctx.lineCap = "round";
      for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      for (const [i, j] of g.edges) { ctx.strokeStyle = C.volt; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); }
      P.forEach(([x, y], i) => { ctx.fillStyle = i === g.bA ? C.volt : "#2A3142"; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.stroke(); });
      ctx.restore();
      pill(api, ctx, isRigid ? T.holds : T.wobbles, 500, 530, { color: isRigid ? C.mint : C.amber, size: 38 });
    } else if (c.kind === "sticks") {
      stickRects(c).forEach((q, i) => { const sel = g.pick.includes(i); ctx.save(); ctx.fillStyle = sel ? C.volt : ["#E0457B", "#5FC8E8", "#F2C230", "#7BD389", "#B9A4E0", "#FF9E5E"][i % 6]; roundRect(ctx, q.x, q.y, q.w, q.h, 8); ctx.fill(); ctx.restore(); api.text(ctx, String(q.s), q.x - 30, q.y + q.h / 2 + 2, { font: "mono", size: 38, weight: 600, align: "center", baseline: "middle" }); });
      if (g.pick.length === 3) {
        const [a, b, cc] = g.pick.map((i) => c.sticks[i]).sort((x, y) => y - x), close = canTriangle(a, b, cc), base0: [number, number] = [520, 520], sc = 26;
        ctx.save(); ctx.lineCap = "round"; ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.moveTo(base0[0], base0[1]); ctx.lineTo(base0[0] + a * sc, base0[1]); ctx.stroke();
        if (close) { const x = (a * a + b * b - cc * cc) / (2 * a), y = Math.sqrt(Math.max(0, b * b - x * x)); ctx.strokeStyle = C.mint; ctx.beginPath(); ctx.moveTo(base0[0], base0[1]); ctx.lineTo(base0[0] + x * sc, base0[1] - y * sc); ctx.lineTo(base0[0] + a * sc, base0[1]); ctx.stroke(); }
        else { ctx.strokeStyle = C.amber; const t1 = (50 * Math.PI) / 180; ctx.beginPath(); ctx.moveTo(base0[0], base0[1]); ctx.lineTo(base0[0] + Math.cos(t1) * b * sc, base0[1] - Math.sin(t1) * b * sc); ctx.stroke(); ctx.beginPath(); ctx.moveTo(base0[0] + a * sc, base0[1]); ctx.lineTo(base0[0] + a * sc - Math.cos(t1) * cc * sc, base0[1] - Math.sin(t1) * cc * sc); ctx.stroke(); }
        ctx.restore();
        pill(api, ctx, close ? T.closes : T.gap, 680, 270, { color: close ? C.mint : C.amber, size: 38 });
      }
    } else {
      // vertices / polygon
      if (g.pts.length) {
        const P = g.pts.map(px), col = done ? (ok ? C.mint : C.amber) : accent;
        if (g.closed) { ctx.save(); ctx.fillStyle = hexA(col, 0.18); ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (g.closed) ctx.closePath(); ctx.stroke(); ctx.restore();
        P.forEach(([x, y], i) => { ctx.fillStyle = i === 0 && !g.closed && g.pts.length >= 3 ? C.volt : col; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); });
        if (c.kind === "angle" && g.pts.length === 3) pill(api, ctx, `${angleAt(g.pts[1], g.pts[0], g.pts[2]).toFixed(0)}°`, px(g.pts[1])[0], px(g.pts[1])[1] - 46, { color: col, size: 38 });
      }
      if (done && g.closed && simple(g.pts)) pill(api, ctx, rectilinear(g.pts) ? `${T.perimeter} ${perimeterRect(g.pts)} · ${T.area} ${area2(g.pts) / 2}` : `${T.area} ${area2(g.pts) / 2}`, 500, 528, { color: ok ? C.mint : C.amber, size: 38 });
    }
    // buttons
    for (const [b, lab, on] of [[UNDO, T.undo, !done], [CHECK, T.check, !done]] as [typeof UNDO, string, boolean][]) { ctx.save(); ctx.fillStyle = on ? (b === CHECK ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)") : "rgba(255,255,255,.04)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = on ? (b === CHECK ? C.volt : C.line2) : C.line; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, lab, b.x + b.w / 2, b.y + b.h / 2 + 2, { font: "display", size: 38, weight: 800, color: on ? (b === CHECK ? C.volt : C.ink2) : C.ink3, align: "center", baseline: "middle" }); }
    if (done) { if (ok) tick(ctx, 900, 230, C.mint, 1.1); else magnifier(ctx, 895, 230, C.amber, 1.1); if (!(g.closed && simple(g.pts))) pill(api, ctx, g.detail.slice(0, 34), 500, 556, { color: ok ? C.mint : C.amber, size: 38 }); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.built]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.built]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" && ["polygon", "perimeter", "area", "triangle", "quad"].includes(c.kind) ? g.coachA : 0, now, 600);
  }
  // ── the QA bot: a known solution per challenge (searched where needed)
  function solution(c: GeoCh): { pts?: P2[]; pick?: number[]; edges?: [number, number][] } {
    const off = (ps: P2[], dx = 2, dy = 1): P2[] => ps.map(([a, b]) => [a + dx, b + dy]);
    switch (c.kind) {
      case "polygon": { const shapes: Record<number, P2[]> = { 3: [[0, 4], [4, 0], [8, 4]], 4: [[0, 0], [6, 0], [6, 4], [0, 4]], 5: [[3, 0], [6, 2], [5, 5], [1, 5], [0, 2]], 6: [[2, 0], [6, 0], [8, 2], [6, 4], [2, 4], [0, 2]], 7: [[3, 0], [6, 1], [8, 3], [6, 5], [2, 5], [0, 3], [1, 1]], 8: [[2, 0], [5, 0], [7, 2], [7, 3], [5, 5], [2, 5], [0, 3], [0, 2]] }; return { pts: off(shapes[c.sides], 2, 0) }; }
      case "perimeter": { for (let w = 1; w <= 12; w++) { const h = c.value / 2 - w; if (h >= 1 && h <= 6 && Number.isInteger(h)) return { pts: [[0, 0], [w, 0], [w, h], [0, h]] }; } return { pts: [] }; }
      case "area": { if (c.shape !== "triangle") for (let w = 1; w <= 12; w++) { const h = c.value / w; if (Number.isInteger(h) && h <= 6) return { pts: [[0, 0], [w, 0], [w, h], [0, h]] }; } for (let b = 1; b <= 12; b++) { const h = (2 * c.value) / b; if (Number.isInteger(h) && h <= 6) return { pts: [[0, h], [b, h], [0, 0]] }; } return { pts: [] }; }
      case "triangle": return { pts: off(({ right: [[0, 0], [4, 0], [0, 3]], isosceles: [[0, 4], [3, 0], [6, 4]], scalene: [[0, 0], [5, 1], [2, 4]], obtuse: [[0, 0], [6, 0], [8, 3]], acute: [[0, 4], [3, 0], [5, 4]] } as Record<string, P2[]>)[c.type]) };
      case "quad": return { pts: off(({ square: [[0, 0], [4, 0], [4, 4], [0, 4]], rectangle: [[0, 0], [7, 0], [7, 3], [0, 3]], parallelogram: [[0, 0], [5, 0], [7, 3], [2, 3]], rhombus: [[3, 0], [6, 2], [3, 4], [0, 2]], trapezium: [[0, 0], [8, 0], [6, 3], [2, 3]], kite: [[3, 0], [5, 2], [3, 5], [1, 2]] } as Record<string, P2[]>)[c.type]) };
      case "sticks": { const s = c.sticks; for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) for (let k = j + 1; k < s.length; k++) if (canTriangle(s[i], s[j], s[k]) === (c.want === "triangle")) return { pick: [i, j, k] }; return { pick: [] }; }
      case "rigid": { const n = c.frame.length, e: [number, number][] = []; for (let i = 2; i < n - (n === 4 ? 1 : 1); i++) e.push([0, i]); return { edges: e.slice(0, n - 3 || 1) }; }
      case "parallel": case "perpendicular": {
        let dx = c.line[1][0] - c.line[0][0], dy = c.line[1][1] - c.line[0][1]; if (c.kind === "perpendicular") [dx, dy] = [-dy, dx];
        const gg = (a: number, b: number): number => (b ? gg(b, a % b) : Math.abs(a) || 1); const k = gg(dx, dy); dx /= k; dy /= k;
        for (const m of [1, -1, 2, -2, 3, -3]) { const q: P2 = [c.through[0] + dx * m, c.through[1] + dy * m]; if (q[0] >= 0 && q[0] < GEO_COLS && q[1] >= 0 && q[1] < GEO_ROWS) return { pts: [c.through as P2, q] }; }
        return { pts: [] };
      }
      case "equidistant": for (let a = 0; a < GEO_COLS; a++) for (let b = 0; b < GEO_ROWS; b++) { const d = c.points.map((q) => (q[0] - a) ** 2 + (q[1] - b) ** 2); if (d.every((x) => x === d[0]) && d[0] > 0) return { pts: [[a, b]] }; } return { pts: [] };
      case "angle": { const o: P2 = [1, 5]; let best: P2 = [5, 1], be = 1e9; for (let a = -1; a < GEO_COLS; a++) for (let b = 0; b < GEO_ROWS; b++) { const q: P2 = [a, b]; if (a < 0 || (a === o[0] && b === o[1])) continue; const e = Math.abs(angleAt(o, [12, 5], q) - c.deg); if (e < be) { be = e; best = q; } } return { pts: [[12, 5], o, best] }; }
    }
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const c = ch(), sol = solution(c), slip = botR() < 0.1;
    if (c.kind === "sticks") { const want = sol.pick ?? []; if (g.pick.length < 3) { const i = slip ? (want[g.pick.length] + 1) % c.sticks.length : want[g.pick.length]; if (i === undefined || g.pick.includes(i)) return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 500 }; const q = stickRects(c)[i]; return { type: "tap", at: [q.x + 20, q.y + q.h / 2], after: 300 }; } return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 800 }; }
    if (c.kind === "rigid") { const e = sol.edges ?? []; if (g.edges.length < e.length) { const [a, b] = e[g.edges.length], v = g.bA < 0 ? a : b; const [x, y] = px(c.frame[v] as P2); return { type: "tap", at: [x, y], after: 300 }; } return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 1200 }; }
    const pts = sol.pts ?? [];
    if (g.pts.length < pts.length) { const q = slip && g.pts.length === pts.length - 1 ? [clamp(pts[g.pts.length][0] + 1, 0, GEO_COLS - 1), pts[g.pts.length][1]] as P2 : pts[g.pts.length]; const [x, y] = px(q); return { type: "tap", at: [x, y], after: 250 }; }
    if (["polygon", "perimeter", "area", "triangle", "quad"].includes(c.kind) && !g.closed && g.pts.length >= 3) { const [x, y] = px(g.pts[0]); return { type: "tap", at: [x, y], after: 300 }; }
    return { type: "tap", at: [CHECK.x + 70, CHECK.y + 35], after: 800 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, challenge: ch()?.kind, pts: g.pts, closed: g.closed, pick: g.pick, edges: g.edges, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "slower" || k === "easier") { g.clock += 20; return true; } if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds[0].challenges.slice(0, 3).map(prompt), figure: { kind: "grid", w: 6, h: 3 }, accent }),
  };
}
export const geo: EngineDef<GeoSpec> = { archetype: "geo-forge@1", label: "Game · Geo Forge", accent: C.ion, create };
