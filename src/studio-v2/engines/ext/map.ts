// MAP ROOM — `map-route@1` (VALUES-100 V3.1: maps, directions, scale, the globe grid). Program a drone with direction
// tiles (compass, or forward / left / right from its own heading) and FLY it: it crosses the map cell by cell and
// crashes into water or buildings if the program is wrong. Measure between places with a tape, then slide the
// distance dial to real km using the scale. Drop pins at latitude and longitude, or fly to a named continent or
// ocean on a world map drawn from Natural Earth land (no borders). The host grades every act by computation.
import { LAND } from "../../../../shared/studio-spec-ext/land-data.ts";
import { curvePts, flyRoute, polyLen, regionOf, scaleKey, threadKey, traceStray, type MapSpec, type MrRoundT } from "../../../../shared/studio-spec-ext/map.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, fmtNum } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const GO = { x: 820, y: 520, w: 150, h: 64 }, UNDO = { x: 820, y: 440, w: 150, h: 60 };
const WM = { x: 70, y: 176, w: 860, h: 430 };
const wx = (lon: number) => WM.x + ((lon + 180) / 360) * WM.w, wy = (lat: number) => WM.y + ((90 - lat) / 180) * WM.h;
const lonOf = (x: number) => ((x - WM.x) / WM.w) * 360 - 180, latOf = (y: number) => 90 - ((y - WM.y) / WM.h) * 180;
function create(api: EngineApi, spec: MapSpec): EngineInstance {
  const T = spec.strings, accent = "#C9A7FF";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 151 + 9);
  const g = { prog: [] as string[], flying: false, flyT: 0, path: [] as [number, number][], blocked: false, tape: null as null | { a: [number, number]; b: [number, number] }, dragging: false, dial: 0, dialDrag: false, k: 0, pin: null as null | { lon: number; lat: number }, answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, coachA: 1, coachGone: false, trace: [] as [number, number][], tracing: false, straightT: 0 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): MrRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.k = 0; reset(); api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1 }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function reset() { g.prog = []; g.flying = false; g.flyT = 0; g.path = []; g.blocked = false; g.tape = null; g.dial = 0; g.pin = null; g.answered = false; g.verdict = ""; g.detail = ""; g.revealT = 0; const r = rd(); api.task(`${T.round} ${flow.round + 1}`, r.mode === "route" ? `${r.places[r.goal].label}: ${T.coach}` : r.mode === "scale" ? T.measure : r.mode === "globe" ? pinText(r.pins[g.k]) : r.mode === "thread" ? T.thread : `${T.fly} ${r.asks[g.k]}`); g.trace = []; g.tracing = false; }
  const units = () => { const r = rd(); return r.mode === "globe" ? r.pins.length : r.mode === "region" ? r.asks.length : 1; };
  const pinText = (p: { lat: number; lon: number }) => `${T.lat} ${Math.abs(p.lat)}°${p.lat >= 0 ? T.N : T.S}, ${T.lon} ${Math.abs(p.lon)}°${p.lon >= 0 ? T.E : T.W}`;
  const grid = (r: { w: number; h: number }) => { const cell = Math.min(60, 560 / r.w, 330 / r.h); return { cell, x0: 420 - (cell * r.w) / 2, y0: 356 - (cell * r.h) / 2 }; };
  const cc = (r: { w: number; h: number }, c: [number, number]): [number, number] => { const G = grid(r); return [G.x0 + (c[0] + 0.5) * G.cell, G.y0 + (c[1] + 0.5) * G.cell]; };
  const dirBtns = () => (rd() as Extract<MrRoundT, { mode: "route" }>).steer === "turns" ? [{ m: "F", lab: "↑", x: 860, y: 200 }, { m: "L", lab: "↺", x: 820, y: 300 }, { m: "R", lab: "↻", x: 900, y: 300 }] : [{ m: "N", lab: T.N, x: 860, y: 180 }, { m: "W", lab: T.W, x: 800, y: 260 }, { m: "E", lab: T.E, x: 920, y: 260 }, { m: "S", lab: T.S, x: 860, y: 340 }];
  const dialMax = () => { const r = rd(); return r.mode === "scale" ? Math.ceil((scaleKey(r) * 1.6) / 10) * 10 || 10 : 1; };
  const DIAL = { x0: 160, x1: 760, y: 572 };
  function judge(value: unknown, local: string) {
    const grade = api.answer(`r${flow.round + 1}:${g.k}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.detail = grade.detail ?? ""; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(40); } else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, verdict: grade.verdict, detail: g.detail });
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered || g.flying) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      const r = rd();
      if (r.mode === "route") {
        if (p.x >= GO.x && p.x <= GO.x + GO.w && p.y >= GO.y && p.y <= GO.y + GO.h && g.prog.length) { const f = flyRoute(r, g.prog); g.path = f.path; g.blocked = f.blocked; g.flying = true; g.flyT = 0; api.record("route", { prog: g.prog }); return; }
        if (p.x >= UNDO.x && p.x <= UNDO.x + UNDO.w && p.y >= UNDO.y && p.y <= UNDO.y + UNDO.h) { g.prog.pop(); return; }
        const b = dirBtns().find((q) => Math.hypot(p.x - q.x, p.y - q.y) < 40); if (b && g.prog.length < 30) { g.prog.push(b.m); sfx.blip({ f: 500, dur: 0.05, type: "triangle", gain: 0.08 }); }
        return;
      }
      if (r.mode === "scale") {
        if (p.x >= GO.x && p.x <= GO.x + GO.w && p.y >= GO.y && p.y <= GO.y + GO.h && g.dial > 0) { const key = scaleKey(r), e = Math.abs(g.dial - key); judge(+g.dial.toFixed(2), e <= r.tol ? "right" : "wrong"); return; }
        if (Math.abs(p.y - DIAL.y) < 36) { g.dialDrag = true; g.dial = clamp(((p.x - DIAL.x0) / (DIAL.x1 - DIAL.x0)) * dialMax(), 0, dialMax()); return; }
        g.dragging = true; g.tape = { a: [p.x, p.y], b: [p.x, p.y] }; return;
      }
      if (r.mode === "thread") { const G = grid(r), q: [number, number] = [(p.x - G.x0) / G.cell - 0.5, (p.y - G.y0) / G.cell - 0.5]; if (Math.hypot(q[0] - r.curve[0][0], q[1] - r.curve[0][1]) < 0.8) { g.tracing = true; g.trace = [r.curve[0]]; } return; }
      if (p.x < WM.x || p.x > WM.x + WM.w || p.y < WM.y || p.y > WM.y + WM.h) return;
      const lon = +lonOf(p.x).toFixed(1), lat = +latOf(p.y).toFixed(1); g.pin = { lon, lat };
      if (r.mode === "globe") { const t = r.pins[g.k], e = Math.max(Math.abs(lat - t.lat), Math.abs(((lon - t.lon + 540) % 360) - 180)); judge({ lat, lon }, e <= r.tol ? "right" : "wrong"); }
      else judge({ lat, lon }, regionOf(lon, lat) === r.asks[g.k] ? "right" : "wrong");
    },
    move(p) { const r0 = rd(); if (g.tracing && r0.mode === "thread") { const G = grid(r0), q: [number, number] = [(p.x - G.x0) / G.cell - 0.5, (p.y - G.y0) / G.cell - 0.5], l = g.trace[g.trace.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.08) g.trace.push([+q[0].toFixed(3), +q[1].toFixed(3)]); } if (g.dragging && g.tape) g.tape.b = [p.x, p.y]; if (g.dialDrag) g.dial = clamp(((p.x - DIAL.x0) / (DIAL.x1 - DIAL.x0)) * dialMax(), 0, dialMax()); },
    up() { const r0 = rd(); if (g.tracing && r0.mode === "thread") { g.tracing = false; const end = r0.curve[r0.curve.length - 1], l = g.trace[g.trace.length - 1]; if (g.trace.length > 3 && Math.hypot(l[0] - end[0], l[1] - end[1]) < 0.9) { const got = polyLen(g.trace) * r0.kmPerSquare, key = threadKey(r0); judge({ trace: g.trace }, Math.abs(got - key) / key * 100 <= r0.tolPct && traceStray(r0, g.trace) <= 0.35 ? "right" : "wrong"); g.straightT = 0; } else { g.trace = []; api.record("thread", { dropped: true }); } } if (g.dragging) { g.dragging = false; api.record("tape", g.tape); } if (g.dialDrag) { g.dialDrag = false; g.dial = Math.round(g.dial * 2) / 2; api.record("dial", { km: g.dial }); } },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    const r = rd();
    if (g.flying && r.mode === "route") { g.flyT += dt; if (g.flyT > (g.path.length - 1) * 0.28 + (g.blocked ? 0.35 : 0) + 0.2) { g.flying = false; const goal = r.places[r.goal].at, end = g.path[g.path.length - 1], ok = !g.blocked && end[0] === goal[0] && end[1] === goal[1] && g.path.length - 1 <= r.maxSteps; if (g.blocked) api.fx.shake(5, 0.25); judge([...g.prog], ok ? "right" : "wrong"); } }
    if (g.answered) g.straightT += dt;
    if (g.answered) { g.revealT += dt; if (g.revealT > 2.6) { if (g.k + 1 < units()) { g.k++; reset(); } else flow.endRound(); } }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 131, 0); }
  function paintWorld(c: Ctx) {
    c.fillStyle = "#0E2238"; c.fillRect(WM.x, WM.y, WM.w, WM.h);
    c.strokeStyle = "rgba(255,255,255,.1)"; c.lineWidth = 1;
    for (let lo = -180; lo <= 180; lo += 30) { c.beginPath(); c.moveTo(wx(lo), WM.y); c.lineTo(wx(lo), WM.y + WM.h); c.stroke(); }
    for (let la = -90; la <= 90; la += 30) { c.beginPath(); c.moveTo(WM.x, wy(la)); c.lineTo(WM.x + WM.w, wy(la)); c.stroke(); }
    c.strokeStyle = "rgba(255,210,122,.45)"; c.lineWidth = 2; c.beginPath(); c.moveTo(WM.x, wy(0)); c.lineTo(WM.x + WM.w, wy(0)); c.stroke(); c.beginPath(); c.moveTo(wx(0), WM.y); c.lineTo(wx(0), WM.y + WM.h); c.stroke();
    c.fillStyle = "#3C5A3E"; c.strokeStyle = "#6E8F70"; c.lineWidth = 1.2;
    for (const poly of LAND) { c.beginPath(); for (let i = 0; i < poly.length; i += 2) { const x = wx(poly[i]), y = wy(poly[i + 1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath(); c.fill(); c.stroke(); }
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const ok = g.verdict === "right", done = g.answered;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "route" || r.mode === "scale") {
      const G = grid(r);
      ctx.fillStyle = "#1B2B22"; ctx.fillRect(G.x0, G.y0, G.cell * r.w, G.cell * r.h);
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; for (let i = 0; i <= r.w; i++) { ctx.beginPath(); ctx.moveTo(G.x0 + i * G.cell, G.y0); ctx.lineTo(G.x0 + i * G.cell, G.y0 + r.h * G.cell); ctx.stroke(); } for (let j = 0; j <= r.h; j++) { ctx.beginPath(); ctx.moveTo(G.x0, G.y0 + j * G.cell); ctx.lineTo(G.x0 + r.w * G.cell, G.y0 + j * G.cell); ctx.stroke(); }
      if (r.mode === "route") for (const b of r.blocks) { ctx.fillStyle = "rgba(60,120,200,.75)"; ctx.fillRect(G.x0 + b[0] * G.cell + 1, G.y0 + b[1] * G.cell + 1, G.cell - 2, G.cell - 2); }
      r.places.forEach((pl, i) => { const [x, y] = cc(r, pl.at); const hot = r.mode === "route" ? i === r.goal : i === r.from || i === r.to; bloom(ctx, hot ? C.volt : accent, x, y, G.cell * 0.8, hot ? 0.4 : 0.2); drawGlyph(ctx, pl.glyph ?? "house", x, y, G.cell * 0.72, C.ink, hexA(hot ? C.volt : accent, 0.35)); api.text(ctx, pl.label, clamp(x, 150, 690), y - G.cell * 0.5 - 20, { size: 38, weight: 700, align: "center", baseline: "middle", color: hot ? C.volt : C.ink2, maxWidth: 220 }); });
      // compass rose
      api.text(ctx, "N", G.x0 - 34, G.y0 + 10, { font: "display", size: 40, weight: 800, color: C.ink2, align: "center", baseline: "middle" });
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(G.x0 - 34, G.y0 + 70); ctx.lineTo(G.x0 - 34, G.y0 + 34); ctx.stroke();
      if (r.mode === "route") {
        const [sx0, sy0] = cc(r, r.start); let dx = sx0, dy = sy0;
        if (g.flying || done) { const k = g.flyT / 0.28, i = Math.min(g.path.length - 1, Math.floor(k)), f = clamp(k - i, 0, 1), a = cc(r, g.path[i]), b = cc(r, g.path[Math.min(g.path.length - 1, i + 1)]); [dx, dy] = done ? cc(r, g.path[g.path.length - 1]) : [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; ctx.save(); ctx.strokeStyle = hexA(C.volt, 0.6); ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); g.path.slice(0, i + 1).forEach((c2, j) => { const [x, y] = cc(r, c2); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.lineTo(dx, dy); ctx.stroke(); ctx.restore(); }
        ctx.save(); bloom(ctx, C.volt, dx, dy, 40, 0.5); ctx.fillStyle = "#E8ECF5"; ctx.beginPath(); ctx.arc(dx, dy, 14, 0, Math.PI * 2); ctx.fill(); for (const [ox, oy] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { ctx.beginPath(); ctx.arc(dx + ox, dy + oy, 8 + Math.sin(now * 40) * 1.5, 0, Math.PI * 2); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke(); } ctx.restore();
        dirBtns().forEach((b) => { ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; ctx.beginPath(); ctx.arc(b.x, b.y, 36, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = done ? C.line : C.volt; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, b.lab, b.x, b.y + 2, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle" }); });
        g.prog.slice(-14).forEach((m, i) => { const lab = dirBtns().find((b) => b.m === m)?.lab ?? m; ctx.save(); ctx.fillStyle = "rgba(203,255,77,.12)"; roundRect(ctx, 150 + i * 46, 572, 40, 44, 8); ctx.fill(); ctx.restore(); api.text(ctx, lab, 170 + i * 46, 596, { font: "display", size: 38, weight: 800, align: "center", baseline: "middle", decor: true }); });
        if (done) pill(api, ctx, g.blocked ? T.blocked : ok ? T.arrived : g.detail, 460, 200, { color: ok ? C.mint : C.amber, size: 38 });
        for (const [b, lab] of [[UNDO, T.undo], [GO, T.go]] as [typeof GO, string][]) { ctx.save(); ctx.fillStyle = b === GO && !done ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = b === GO && !done ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, lab, b.x + b.w / 2, b.y + b.h / 2 + 2, { font: "display", size: 38, weight: 800, color: b === GO && !done ? C.volt : C.ink2, align: "center", baseline: "middle" }); }
      } else {
        api.text(ctx, T.scale, 880, 258, { font: "mono", size: 38, weight: 600, color: accent, align: "center", baseline: "middle", maxWidth: 240 }); api.text(ctx, `${fmtNum(r.kmPerSquare, r.kmPerSquare % 1 ? 1 : 0)} ${T.km}`, 880, 304, { font: "display", size: 44, weight: 800, color: accent, align: "center", baseline: "middle", maxWidth: 240 });
        if (g.tape) { const [a, b] = [g.tape.a, g.tape.b], len = Math.hypot(b[0] - a[0], b[1] - a[1]) / G.cell; ctx.save(); ctx.strokeStyle = C.sun; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore(); pill(api, ctx, `${len.toFixed(1)} □`, clamp((a[0] + b[0]) / 2, 200, 760), clamp((a[1] + b[1]) / 2 - 40, 200, 520), { color: C.sun, size: 38 }); }
        ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(DIAL.x0, DIAL.y); ctx.lineTo(DIAL.x1, DIAL.y); ctx.stroke(); const kx = DIAL.x0 + (g.dial / dialMax()) * (DIAL.x1 - DIAL.x0); ctx.fillStyle = g.dialDrag ? C.volt : C.ink; ctx.beginPath(); ctx.arc(kx, DIAL.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        pill(api, ctx, `${fmtNum(g.dial, g.dial % 1 ? 1 : 0)} ${T.km}`, 880, 460, { color: done ? (ok ? C.mint : C.amber) : C.ink, size: 40 });
        if (done) pill(api, ctx, `${scaleKey(r).toFixed(1)} ${T.km}`, 880, 380, { color: C.ion, size: 38 });
        ctx.save(); ctx.fillStyle = !done ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, GO.x, GO.y, GO.w, GO.h, 16); ctx.fill(); ctx.strokeStyle = !done ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, T.set, GO.x + GO.w / 2, GO.y + GO.h / 2 + 2, { font: "display", size: 38, weight: 800, color: !done ? C.volt : C.ink3, align: "center", baseline: "middle" });
      }
    } else if (r.mode === "thread") {
      const G = grid(r), toS = (q: [number, number]): [number, number] => [G.x0 + (q[0] + 0.5) * G.cell, G.y0 + (q[1] + 0.5) * G.cell];
      ctx.fillStyle = "#1B2B22"; ctx.fillRect(G.x0, G.y0, G.cell * r.w, G.cell * r.h);
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; for (let i = 0; i <= r.w; i++) { ctx.beginPath(); ctx.moveTo(G.x0 + i * G.cell, G.y0); ctx.lineTo(G.x0 + i * G.cell, G.y0 + r.h * G.cell); ctx.stroke(); } for (let j = 0; j <= r.h; j++) { ctx.beginPath(); ctx.moveTo(G.x0, G.y0 + j * G.cell); ctx.lineTo(G.x0 + r.w * G.cell, G.y0 + j * G.cell); ctx.stroke(); }
      const road = curvePts(r.curve).map(toS); ctx.save(); ctx.strokeStyle = "#8C6A44"; ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); road.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.strokeStyle = "rgba(255,230,180,.35)"; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.stroke(); ctx.restore();
      const [ax, ay] = toS(r.curve[0]), [bx, by] = toS(r.curve[r.curve.length - 1]);
      for (const [x, y, lab] of [[ax, ay, "A"], [bx, by, "B"]] as [number, number, string][]) { bloom(ctx, C.volt, x, y, 30, 0.5); ctx.save(); ctx.fillStyle = C.volt; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore(); api.text(ctx, lab, x, y + 1, { font: "display", size: 38, weight: 800, color: "#0B0E14", align: "center", baseline: "middle" }); }
      if (g.trace.length > 1) { const k = done ? clamp(g.straightT / 1.2, 0, 1) : 0, len = polyLen(g.trace); ctx.save(); ctx.strokeStyle = C.sun; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); let acc = 0; g.trace.forEach((q, i) => { if (i) acc += Math.hypot(q[0] - g.trace[i - 1][0], q[1] - g.trace[i - 1][1]); const [x, y] = toS(q), sx = 160 + (acc / Math.max(len, 1e-6)) * Math.min(600, len * G.cell), sy = 590; const X = x + (sx - x) * k, Y = y + (sy - y) * k; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore(); }
      api.text(ctx, T.scale, 870, 258, { font: "mono", size: 38, weight: 600, color: accent, align: "center", baseline: "middle", maxWidth: 240 }); api.text(ctx, `${fmtNum(r.kmPerSquare, r.kmPerSquare % 1 ? 1 : 0)} ${T.km}`, 870, 304, { font: "display", size: 44, weight: 800, color: accent, align: "center", baseline: "middle", maxWidth: 240 });
      if (done) { pill(api, ctx, g.detail, 870, 400, { color: ok ? C.mint : C.amber, size: 38 }); pill(api, ctx, `${threadKey(r).toFixed(1)} ${T.km}`, 870, 470, { color: C.ion, size: 38 }); }
    } else {
      ctx.drawImage(api.layer("world", paintWorld), 0, 0, W, H);
      for (const la of [-60, -30, 30, 60]) api.text(ctx, `${Math.abs(la)}°${la > 0 ? T.N : T.S}`, WM.x + 8, wy(la) - 2, { font: "mono", size: 38, weight: 600, color: "rgba(255,255,255,.45)", baseline: "bottom", decor: true });
      if (g.pin) { const x = wx(g.pin.lon), y = wy(g.pin.lat), col = done ? (ok ? C.mint : C.amber) : C.volt; bloom(ctx, col, x, y, 30, 0.6); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 18, 10, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y); ctx.stroke(); }
      if (done && r.mode === "globe") { const t = r.pins[g.k], x = wx(t.lon), y = wy(t.lat); ctx.save(); ctx.strokeStyle = C.ion; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(WM.x, y); ctx.lineTo(WM.x + WM.w, y); ctx.moveTo(x, WM.y); ctx.lineTo(x, WM.y + WM.h); ctx.stroke(); ctx.restore(); }
      if (done) pill(api, ctx, r.mode === "region" ? g.detail : ok ? "✓" : `${g.detail}°`, clamp(wx(g.pin?.lon ?? 0), 200, 800), clamp(wy(g.pin?.lat ?? 0) - 60, 200, 560), { color: ok ? C.mint : C.amber, size: 38 });
    }
    if (done) { const tx = r.mode === "route" || r.mode === "scale" ? 762 : 960; if (ok) tick(ctx, tx, 200, C.mint, 1); else magnifier(ctx, tx - 5, 200, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
    drawCoach(api, ctx, "", 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered || g.flying) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1;
    if (r.mode === "route") {
      // BFS for a compass path, then translate to turns if needed
      const goal = r.places[r.goal].at, blk = new Set(r.blocks.map((b) => b.join(","))), prev = new Map<string, [string, string]>(), q: [number, number][] = [r.start], seen = new Set([r.start.join(",")]);
      const D: Record<string, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
      while (q.length) { const [x, y] = q.shift()!; if (x === goal[0] && y === goal[1]) break; for (const [m, [ddx, ddy]] of Object.entries(D)) { const nx = x + ddx, ny = y + ddy, k = nx + "," + ny; if (nx < 0 || ny < 0 || nx >= r.w || ny >= r.h || blk.has(k) || seen.has(k)) continue; seen.add(k); prev.set(k, [x + "," + y, m]); q.push([nx, ny]); } }
      const moves: string[] = []; let cur = goal.join(","); while (prev.has(cur)) { const [p, m] = prev.get(cur)!; moves.unshift(m); cur = p; }
      let plan = moves; if (r.steer === "turns") { plan = []; let h = 0; const order = ["N", "E", "S", "W"]; for (const m of moves) { const want = order.indexOf(m); while (h !== want) { const right = (want - h + 4) % 4 <= 2; plan.push(right ? "R" : "L"); h = (h + (right ? 1 : 3)) % 4; } plan.push("F"); } }
      if (slip && plan.length) plan = plan.slice(0, -1);
      if (g.prog.length < plan.length) { const b = dirBtns().find((x) => x.m === plan[g.prog.length])!; return { type: "tap", at: [b.x, b.y], after: 120 }; }
      return { type: "tap", at: [GO.x + 75, GO.y + 32], after: 400 };
    }
    if (r.mode === "scale") {
      const a = cc(r, r.places[r.from].at), b = cc(r, r.places[r.to].at);
      if (!g.tape) return { type: "drag", from: a, to: b, ms: 600, after: 400 };
      const want = scaleKey(r) * (slip ? 1.3 : 1), kx = DIAL.x0 + (want / dialMax()) * (DIAL.x1 - DIAL.x0);
      if (Math.abs(g.dial - Math.round(want * 2) / 2) > 0.26) return { type: "drag", from: [DIAL.x0 + (g.dial / dialMax()) * (DIAL.x1 - DIAL.x0), DIAL.y], to: [kx, DIAL.y], ms: 400, after: 300 };
      return { type: "tap", at: [GO.x + 75, GO.y + 32], after: 500 };
    }
    if (r.mode === "thread") { const G = grid(r), pts = curvePts(r.curve, 6).map((q, i): [number, number] => [G.x0 + (q[0] + 0.5 + (slip && i % 2 ? 0.5 : 0)) * G.cell, G.y0 + (q[1] + 0.5) * G.cell]); return { type: "path", points: pts, ms: 2200, after: 900 }; }
    if (r.mode === "globe") { const t = r.pins[g.k]; return { type: "tap", at: [wx(t.lon + (slip ? 20 : 0)), wy(t.lat)], after: 900 }; }
    const anchors: Record<string, [number, number]> = { Asia: [90, 45], Africa: [20, 5], Europe: [15, 50], "North America": [-100, 45], "South America": [-60, -15], Australia: [134, -25], Antarctica: [0, -80], "Pacific Ocean": [-150, 0], "Atlantic Ocean": [-30, 10], "Indian Ocean": [75, -15], "Arctic Ocean": [0, 85], "Southern Ocean": [60, -63] };
    const [lo, la] = anchors[r.asks[g.k]] ?? [0, 0]; return { type: "tap", at: [wx(lo), wy(la)], after: 900 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, prog: g.prog, dial: g.dial, pin: g.pin, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const map: EngineDef<MapSpec> = { archetype: "map-route@1", label: "Game · Map Room", accent: "#C9A7FF", create };
