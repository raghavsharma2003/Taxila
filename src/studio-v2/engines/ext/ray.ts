// RAY LAB — `ray-lab@1` (VALUES-100 V3.1: light in straight lines, reflection, periscope, pinhole camera). The beam is
// traced by the same function the host grades with:
//   mirror  — tap grid cells to stand a plane mirror (tap again to turn it, again to remove), then FIRE: the beam runs
//             cell by cell, turns at each mirror, stops at walls; reach the target with the mirrors allowed
//   angle   — the laser is pulsed: turn the mirror, FIRE (3 shots), see where the light went; after a hit the protractor
//             shows the normal and that i = r
//   pinhole — slide the screen in the box; the image is drawn upside down at the size similar triangles give; read it
//             on the screen's ruler and LOCK when it is the asked height
import { PIN_MAX, angleKey, mirrorPlan, rayMiss, reflectDir, traceBeam, type Mirrors, type RaySpec, type RlRoundT } from "../../../../shared/studio-spec-ext/ray.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const BTN = { x: 800, y: 520, w: 170, h: 66 };
const D2R = Math.PI / 180;
const BEAM = "#FF4D6D";
function create(api: EngineApi, spec: RaySpec): EngineInstance {
  const T = spec.strings, accent = "#FFD36B";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 179 + 17), setTask = taskPill(api);
  const g = { mirrors: {} as Mirrors, firing: false, fireT: 0, path: [] as [number, number][], hit: false, ang: 0, shots: 0, shown: false, dragging: false, screen: 10, slide: false, answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, plan: {} as Mirrors };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): RlRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { mirrors: {}, firing: false, fireT: 0, path: [], hit: false, ang: 0, shots: 0, shown: false, dragging: false, screen: 10, slide: false, answered: false, verdict: "", detail: "", revealT: 0 });
      if (r.mode === "mirror") g.plan = mirrorPlan(r) ?? {};
      if (r.mode === "angle") g.ang = (angleKey(r) + 40) % 180;
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
  const grid = (r: Extract<RlRoundT, { mode: "mirror" }>) => { const cell = Math.min(66, 600 / r.w, 380 / r.h); return { cell, x0: 420 - (cell * r.w) / 2, y0: 380 - (cell * r.h) / 2 }; };
  const pinScale = (r: Extract<RlRoundT, { mode: "pinhole" }>) => Math.min(8, 300 / r.objD, 300 / PIN_MAX, 150 / Math.max(r.objH, 1));
  const PIN = { x: 440, y: 380 };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered || g.firing) return;
      const r = rd();
      if (r.mode === "mirror") {
        if (inB(p, BTN)) { const t = traceBeam(r, g.mirrors); g.path = t.path; g.hit = t.hit; g.firing = true; g.fireT = 0; api.record("fire", { mirrors: { ...g.mirrors } }); sfx.blip({ f: 880, f2: 1320, dur: 0.15, type: "sawtooth", gain: 0.05 }); return; }
        const G = grid(r), cx = Math.floor((p.x - G.x0) / G.cell), cy = Math.floor((p.y - G.y0) / G.cell); if (cx < 0 || cy < 0 || cx >= r.w || cy >= r.h) return;
        const k = cx + "," + cy; if ((cx === r.source[0] && cy === r.source[1]) || (cx === r.target[0] && cy === r.target[1]) || r.walls.some((w) => w[0] === cx && w[1] === cy)) return;
        const cur = g.mirrors[k]; if (!cur) { if (Object.keys(g.mirrors).length >= r.maxMirrors) { api.fx.shake(3, 0.15); return; } g.mirrors[k] = "/"; } else if (cur === "/") g.mirrors[k] = "\\"; else delete g.mirrors[k];
        g.path = []; sfx.blip({ f: 520, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("mirror", { cell: k, m: g.mirrors[k] ?? null });
        return;
      }
      if (r.mode === "angle") {
        if (inB(p, BTN)) { g.shots++; g.shown = true; g.firing = true; g.fireT = 0; api.record("fire", { angle: +g.ang.toFixed(1), shot: g.shots }); sfx.blip({ f: 880, f2: 1320, dur: 0.15, type: "sawtooth", gain: 0.05 }); return; }
        if (Math.hypot(p.x - r.pivot[0], p.y - r.pivot[1]) < 200) { g.dragging = true; g.shown = false; }
        return;
      }
      if (inB(p, BTN)) { judge({ screen: +g.screen.toFixed(2) }, Math.abs((r.objH * g.screen) / r.objD - r.imgH) <= r.tol ? "right" : "wrong"); return; }
      if (p.y > 200 && p.y < 560 && p.x > PIN.x) { g.slide = true; g.screen = clamp((p.x - PIN.x) / pinScale(r), 2, PIN_MAX); }
    },
    move(p) {
      const r = rd();
      if (g.dragging && r.mode === "angle") g.ang = ((Math.atan2(p.y - r.pivot[1], p.x - r.pivot[0]) / D2R) % 180 + 180) % 180;
      if (g.slide && r.mode === "pinhole") g.screen = Math.round(clamp((p.x - PIN.x) / pinScale(r), 2, PIN_MAX) * 2) / 2;
    },
    up() { if (g.dragging) { g.dragging = false; api.record("turn", { angle: +g.ang.toFixed(1) }); } if (g.slide) { g.slide = false; api.record("screen", { cm: g.screen }); } },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    if (g.firing && !g.answered) {
      g.fireT += dt;
      if (r.mode === "mirror" && g.fireT > g.path.length * 0.07 + 0.4) { g.firing = false; if (g.hit) judge({ mirrors: { ...g.mirrors } }, "right"); else { api.fx.shake(3, 0.2); judge({ mirrors: { ...g.mirrors } }, "wrong"); } }
      if (r.mode === "angle" && g.fireT > 0.7) { g.firing = false; const miss = rayMiss(r, g.ang); if (miss <= r.tol) judge({ angle: +g.ang.toFixed(1) }, "right"); else if (g.shots >= 3) judge({ angle: +g.ang.toFixed(1) }, "wrong"); else sfx.blip({ f: 260, dur: 0.12, gain: 0.08 }); }
    }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 179, 0); }
  function button(ctx: Ctx, label: string, on: boolean, now: number) {
    ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.14)" : "rgba(22,26,36,.95)"; roundRect(ctx, BTN.x, BTN.y, BTN.w, BTN.h, 16); ctx.fill(); ctx.strokeStyle = on ? hexA(C.volt, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, label, BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + 2, { font: "display", size: 38, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle" });
  }
  function readout(ctx: Ctx, label: string, value: string, y: number) {
    api.text(ctx, label, 885, y, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 210 });
    api.text(ctx, value, 885, y + 46, { font: "display", size: 42, weight: 800, color: C.ink, align: "center", baseline: "middle", maxWidth: 210 });
  }
  function beamLine(ctx: Ctx, pts: [number, number][]) { if (pts.length < 2) return; ctx.save(); ctx.strokeStyle = hexA(BEAM, 0.35); ctx.lineWidth = 14; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.strokeStyle = BEAM; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "mirror") {
      const G = grid(r), cc = (c: [number, number]): [number, number] => [G.x0 + (c[0] + 0.5) * G.cell, G.y0 + (c[1] + 0.5) * G.cell];
      ctx.save(); ctx.fillStyle = "rgba(10,13,20,.7)"; ctx.fillRect(G.x0, G.y0, G.cell * r.w, G.cell * r.h); ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1; for (let i = 0; i <= r.w; i++) { ctx.beginPath(); ctx.moveTo(G.x0 + i * G.cell, G.y0); ctx.lineTo(G.x0 + i * G.cell, G.y0 + r.h * G.cell); ctx.stroke(); } for (let j = 0; j <= r.h; j++) { ctx.beginPath(); ctx.moveTo(G.x0, G.y0 + j * G.cell); ctx.lineTo(G.x0 + r.w * G.cell, G.y0 + j * G.cell); ctx.stroke(); } ctx.restore();
      for (const w of r.walls) { ctx.save(); ctx.fillStyle = "#7A4E3A"; ctx.fillRect(G.x0 + w[0] * G.cell + 2, G.y0 + w[1] * G.cell + 2, G.cell - 4, G.cell - 4); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(G.x0 + w[0] * G.cell + 2, G.y0 + (w[1] + 0.5) * G.cell); ctx.lineTo(G.x0 + (w[0] + 1) * G.cell - 2, G.y0 + (w[1] + 0.5) * G.cell); ctx.stroke(); ctx.restore(); }
      const [tx, ty] = cc(r.target); bloom(ctx, g.hit && (g.firing || done) ? C.mint : accent, tx, ty, G.cell, 0.5); drawGlyph(ctx, "eye", tx, ty, G.cell * 0.7, C.ink, hexA(accent, 0.4));
      const [sx, sy] = cc(r.source); drawGlyph(ctx, "torch", sx, sy, G.cell * 0.7, C.ink, hexA(BEAM, 0.4));
      for (const [k, m] of Object.entries(g.mirrors)) { const [cx, cy] = k.split(",").map(Number), [x, y] = cc([cx, cy]), h = G.cell * 0.42; ctx.save(); ctx.strokeStyle = "#DDE8FF"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); if (m === "/") { ctx.moveTo(x - h, y + h); ctx.lineTo(x + h, y - h); } else { ctx.moveTo(x - h, y - h); ctx.lineTo(x + h, y + h); } ctx.stroke(); ctx.restore(); }
      if (g.path.length && (g.firing || done)) { const n = Math.min(g.path.length, Math.floor(g.fireT / 0.07) + 1); const pts = g.path.slice(0, n).map((c) => cc(c)); pts[0] = [sx, sy]; beamLine(ctx, pts); }
      readout(ctx, T.mirrors, `${Object.keys(g.mirrors).length} / ${r.maxMirrors}`, 260);
      if (done) pill(api, ctx, g.hit ? T.hit : T.miss, 420, 600, { color: ok ? C.mint : C.amber, size: 38 });
      button(ctx, T.fire, !done && !g.firing, now);
    } else if (r.mode === "angle") {
      const [lx, ly] = r.laser, [px, py] = r.pivot, [gx, gy] = r.goal;
      bloom(ctx, accent, gx, gy, 40, 0.6); drawGlyph(ctx, "star", gx, gy, 54, C.ink, hexA(accent, 0.35));
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.atan2(py - ly, px - lx)); ctx.fillStyle = "#3A4256"; roundRect(ctx, -40, -16, 56, 32, 8); ctx.fill(); ctx.fillStyle = BEAM; ctx.fillRect(14, -5, 8, 10); ctx.restore();
      const sx = Math.cos(g.ang * D2R) * 80, sy = Math.sin(g.ang * D2R) * 80;
      ctx.save(); ctx.strokeStyle = "#DDE8FF"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px - sx, py - sy); ctx.lineTo(px + sx, py + sy); ctx.stroke(); ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (g.dragging) bloom(ctx, C.volt, px, py, 90, 0.2);
      if (g.shown || done) {
        const f = clamp(g.fireT / 0.35, 0, 1), [rx, ry] = reflectDir(r, g.ang), L = 700;
        const pts: [number, number][] = [[lx, ly], [lx + (px - lx) * Math.min(1, f * 2), ly + (py - ly) * Math.min(1, f * 2)]]; if (f > 0.5) pts.push([px + rx * L * (f - 0.5) * 2, py + ry * L * (f - 0.5) * 2]);
        ctx.save(); ctx.beginPath(); ctx.rect(110, 160, 680, 450); ctx.clip(); beamLine(ctx, pts); ctx.restore();
      }
      if (done && ok) { // protractor: normal, i and r
        const nx = -Math.sin(g.ang * D2R), ny = Math.cos(g.ang * D2R), s = (lx - px) * nx + (ly - py) * ny > 0 ? 1 : -1;
        ctx.save(); ctx.strokeStyle = hexA(C.ion, 0.8); ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + nx * s * 150, py + ny * s * 150); ctx.stroke(); ctx.restore();
        const a = [lx - px, ly - py], la = Math.hypot(a[0], a[1]), i = Math.acos(clamp((a[0] * nx * s + a[1] * ny * s) / la, -1, 1)) / D2R;
        pill(api, ctx, `${T.incidence} = ${i.toFixed(0)}°   ${T.reflection} = ${i.toFixed(0)}°`, 430, 600, { color: C.ion, size: 38 });
      }
      api.text(ctx, `${3 - g.shots}`, 885, 300, { font: "display", size: 56, weight: 800, color: C.ink, align: "center", baseline: "middle" });
      api.text(ctx, "⚡ ⚡ ⚡".slice(0, Math.max(0, 3 - g.shots) * 2), 885, 350, { size: 38, weight: 600, color: BEAM, align: "center", baseline: "middle", decor: true });
      button(ctx, T.fire, !done && !g.firing && g.shots < 3, now);
    } else {
      const s = pinScale(r), cx = PIN.x - r.objD * s, oh = r.objH * s, sx = PIN.x + g.screen * s, ih = ((r.objH * g.screen) / r.objD) * s;
      ctx.save(); ctx.fillStyle = "#1E2432"; ctx.fillRect(PIN.x, PIN.y - 170, PIN_MAX * s + 10, 340); ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.strokeRect(PIN.x, PIN.y - 170, PIN_MAX * s + 10, 340); ctx.fillStyle = "#0B0E14"; ctx.fillRect(PIN.x - 4, PIN.y - 170, 8, 340); ctx.fillStyle = "#FFF"; ctx.fillRect(PIN.x - 4, PIN.y - 3, 8, 6); ctx.restore();
      ctx.save(); ctx.fillStyle = "#F2E6C8"; ctx.fillRect(cx - 12, PIN.y + oh / 2 - oh, 24, oh); bloom(ctx, C.sun, cx, PIN.y - oh / 2 - 16, 40, 0.7); ctx.fillStyle = "#FFB547"; ctx.beginPath(); ctx.ellipse(cx, PIN.y - oh / 2 - 16 + Math.sin(now * 12) * 1.5, 9, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = hexA(C.sun, 0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, PIN.y - oh / 2 - 16); ctx.lineTo(sx, PIN.y + ih / 2 + (16 * g.screen) / r.objD); ctx.moveTo(cx, PIN.y + oh / 2); ctx.lineTo(sx, PIN.y - ih / 2); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = "rgba(240,240,250,.12)"; ctx.fillRect(sx - 4, PIN.y - 165, 8, 330); ctx.restore();
      ctx.save(); ctx.translate(sx - 14, PIN.y); ctx.scale(1, -1); ctx.fillStyle = "rgba(242,230,200,.85)"; ctx.fillRect(-6, -ih / 2, 12, ih); ctx.fillStyle = "rgba(255,181,71,.9)"; ctx.beginPath(); ctx.ellipse(0, -ih / 2 - (16 * g.screen) / r.objD, 4, 8 * (g.screen / r.objD) + 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (let c = -10; c <= 10; c++) { const y = PIN.y + c * s; if (Math.abs(c * s) > 160) continue; ctx.strokeStyle = c % 5 === 0 ? C.ink : "rgba(255,255,255,.4)"; ctx.lineWidth = c % 5 === 0 ? 2 : 1; ctx.beginPath(); ctx.moveTo(sx + 6, y); ctx.lineTo(sx + (c % 5 === 0 ? 22 : 14), y); ctx.stroke(); }
      readout(ctx, T.screen, `${g.screen.toFixed(1)} cm`, 230);
      api.text(ctx, T.object, cx, PIN.y + oh / 2 + 36, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 220 });
      api.text(ctx, `${r.objH} cm`, cx, PIN.y + oh / 2 + 80, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 220 });
      api.text(ctx, `${r.objD} cm`, (cx + PIN.x) / 2, PIN.y + 190, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", decor: true });
      if (done) pill(api, ctx, `${T.image} ${g.detail} · ${T.inverted}`, 470, 600, { color: ok ? C.mint : C.amber, size: 38 });
      button(ctx, T.lock, !done, now);
    }
    if (done) { if (ok) tick(ctx, 885, 430, C.mint, 1); else magnifier(ctx, 880, 430, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered || g.firing) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1;
    if (r.mode === "mirror") {
      const G = grid(r), need = Object.entries(g.plan).find(([k, m]) => g.mirrors[k] !== m);
      if (need && !slip) { const [cx, cy] = need[0].split(",").map(Number); return { type: "tap", at: [G.x0 + (cx + 0.5) * G.cell, G.y0 + (cy + 0.5) * G.cell], after: 250 }; }
      return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
    }
    if (r.mode === "angle") {
      const want = (angleKey(r) + (slip && g.shots === 0 ? 15 : 0)) % 180; if (Math.abs(((g.ang - want + 270) % 180) - 90) > 0.6) { const a = want * D2R; return { type: "drag", from: [r.pivot[0] + 120 * Math.cos(g.ang * D2R), r.pivot[1] + 120 * Math.sin(g.ang * D2R)], to: [r.pivot[0] + 120 * Math.cos(a), r.pivot[1] + 120 * Math.sin(a)], ms: 500, after: 300 }; }
      return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
    }
    const want = (r.imgH * r.objD) / r.objH * (slip ? 1.3 : 1), s = pinScale(r);
    if (Math.abs(g.screen - want) > 0.3) return { type: "drag", from: [PIN.x + g.screen * s, 380], to: [PIN.x + want * s, 380], ms: 500, after: 300 };
    return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, mirrors: g.mirrors, ang: +g.ang.toFixed(1), shots: g.shots, screen: g.screen, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const ray: EngineDef<RaySpec> = { archetype: "ray-lab@1", label: "Simulation · Ray Lab", accent: "#FFD36B", create };
