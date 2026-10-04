// TURRET — `angle-cannon@1` (STUDIO-V2 §6.1 #7). Angles as turns, under time: the turret turns from the zero arm
// (anticlockwise); there is no angle readout, so every shot is an estimate of the turn. Threats are cloaked until the
// shot reveals where the called angle really is. "Copy the turn" shows a reference wedge with arms of a different
// length and orientation (c5-maths-ch03-t01-m-angle-is-length); "Obtuse only" makes the child classify moving drones
// by eye; "Past straight" opens the full turn (reflex). The aim angle is the act; the host grades it.
import { angleKind, type AngleSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, DEG, norm360, rng } from "../core/math.ts";
import { bloom, magnifier, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

interface Drone { i: number; ang: number; r: number; v: number; alive: boolean; shot: boolean; t: number }
interface Shot { ang: number; r: number; hit: boolean; t: number; truth: number | null; off: number }

function create(api: EngineApi, spec: AngleSpec): EngineInstance {
  const T = spec.strings;
  const g = { state: "boot" as "boot" | "intro" | "aim" | "reveal" | "end" | "final", w: -1, i: 0, stateT: 0, ang: 30, target: 30, vel: 0, dragging: false, moved: false, callT: 0, limit: 7,
    drones: [] as Drone[], shots: [] as Shot[], reveal: null as null | { truth: number; aim: number; r: number; hit: boolean; t: number; off: number }, refRot: 0, refLen: [140, 90] as [number, number],
    hits: 0, n: 0, results: [] as { err: number; verdict: string }[], waveRes: [] as { verdict: string; err: number }[], introA: 0, coachA: 1, coachGone: false, bootT: 0, endA: 0, finalA: 0, spawnT: 0, spawned: 0, sweep: 0 };
  const botRnd = rng(api.seed * 19 + 7);
  const wave = () => spec.waves[Math.max(0, g.w)];
  const pivot = (): XY => (wave().range === 360 ? [500, 360] : [500, 548]);
  const R = () => (wave().range === 360 ? 230 : 380);
  const hud = api.hud([{ key: "wave", label: T.wave }, { key: "hits", label: T.hits }, { key: "acc", label: T.accuracy, meter: true }]);
  const accOf = (r: { err: number }[]) => (r.length ? Math.round(100 * (r.reduce((a, b) => a + (1 - Math.min(1, b.err / 30)), 0) / r.length)) : 100);
  const at = (ang: number, r: number): XY => { const [px, py] = pivot(); return [px + Math.cos(ang * DEG) * r, py - Math.sin(ang * DEG) * r]; };
  const angOf = (x: number, y: number) => { const [px, py] = pivot(); let a = Math.atan2(py - y, x - px) / DEG; if (wave().range === 180) a = clamp(a < -90 ? 180 : a, 0, 180); else a = norm360(a); return a; };
  const key = () => wave().items[g.i];
  function startWave(k: number) {
    g.w = k; g.i = 0; g.state = "intro"; g.stateT = 0; g.introA = 0; g.waveRes = []; g.drones = []; g.spawned = 0; g.spawnT = 0;
    g.ang = g.target = wave().range === 360 ? 0 : 20;
    api.tw.add(g, { introA: 1 }, { dur: 0.45 });
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("wave_start", { wave: k + 1, mode: wave().mode, targets: wave().targets ?? null });
  }
  function nextCall() {
    g.state = "aim"; g.stateT = 0; g.callT = 0; g.reveal = null; g.limit = 7.5 / wave().speed;
    g.refRot = (api.rnd() - 0.5) * 200; g.refLen = api.rnd() < 0.5 ? [170, 110] : [70, 46];
    if (wave().mode === "copy") api.task(`${T.wave} ${g.w + 1}`, T.copy);
    else if (wave().mode === "classify") api.task(`${T.wave} ${g.w + 1}`, `${T.only} ${T[wave().kind ?? "obtuse"]}`);
    // call mode: the big call card on the stage is the cue; no duplicate pill
  }
  api.onPointer({
    down(p) { if (g.state !== "aim") return; if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); } g.dragging = true; g.moved = false; g.target = angOf(p.x, p.y); },
    move(p) { if (!g.dragging) return; g.moved = true; g.target = angOf(p.x, p.y); },
    up() { if (!g.dragging) return; g.dragging = false; fire(); },
  });
  function fire() {
    if (g.state !== "aim") return;
    g.ang = g.target;
    sfx.noise({ dur: 0.14, f: 1800, filter: "bandpass", gain: 0.25 }); sfx.blip({ f: 140, f2: 70, dur: 0.18, gain: 0.25 });
    api.fx.shake(3, 0.14);
    const [mx, my] = at(g.ang, 70); api.fx.burst(mx, my, { n: 10, color: C.ink, speed: 300, life: 0.3, size: 6, angle: -g.ang * DEG, spread: 0.5 });
    if (wave().mode === "classify") {
      // a hit on a drone within 8° along its ray; a miss hits nothing
      const d = g.drones.filter((x) => x.alive).sort((a, b) => Math.abs(norm360(a.ang - g.ang + 180) - 180) - Math.abs(norm360(b.ang - g.ang + 180) - 180))[0];
      g.shots.push({ ang: g.ang, r: R() + 60, hit: false, t: 0, truth: null, off: 0 });
      if (d && Math.abs(norm360(d.ang - g.ang + 180) - 180) <= 8) {
        d.alive = false; d.shot = true;
        const ok = angleKind(d.ang) === wave().kind, grade = api.answer(`w${g.w + 1}:${d.i}`, { fired: true }, ok ? "right" : "wrong");
        const [x, y] = at(d.ang, d.r);
        if (grade.verdict === "right") { g.hits++; api.fx.burst(x, y, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.ring(x, y, { color: C.mint, r0: 8, r1: 80, life: 0.5, width: 6 }); api.fx.pop(T.hit, x, y - 50, { color: C.mint, size: 42 }); sfx.blip({ f: 660, f2: 1320, dur: 0.18, type: "triangle", gain: 0.18 }); api.hitstop(50); }
        else { api.fx.burst(x, y, { n: 14, color: C.amber, speed: 260, life: 0.7, size: 10, shard: true }); api.fx.pop(`${Math.round(d.ang)}° · ${angleKind(d.ang)}`, x, y - 50, { color: C.amber, size: 40, life: 1.4 }); sfx.blip({ f: 200, f2: 110, dur: 0.2, gain: 0.2 }); }
        g.results.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.waveRes.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.n++;
      }
      return;
    }
    const truth = key(), err = Math.abs(norm360(g.ang - truth + 180) - 180);
    const local = err <= 5 ? "right" : err <= 12 ? "partial" : "wrong";
    const grade = api.answer(`w${g.w + 1}:${g.i}`, +g.ang.toFixed(1), local);
    const hit = grade.verdict === "right", r = R() * (0.7 + api.rnd() * 0.25);
    g.reveal = { truth, aim: g.ang, r, hit, t: 0, off: Math.round(err) };
    g.shots.push({ ang: g.ang, r: R() + 80, hit, t: 0, truth, off: err });
    g.results.push({ err, verdict: grade.verdict }); g.waveRes.push({ err, verdict: grade.verdict }); g.n++;
    g.state = "reveal"; g.stateT = 0;
    const [tx, ty] = at(truth, r);
    if (hit) { g.hits++; setTimeout(() => { api.fx.burst(tx, ty, { n: 34, color: C.mint, speed: 480, life: 0.7, size: 11 }); api.fx.ring(tx, ty, { color: C.mint, r0: 10, r1: 110, life: 0.6, width: 7 }); api.fx.flash(C.mint, 0.1); api.fx.shake(5, 0.2); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.2 }); }, 180); api.fx.pop(T.hit, tx, ty - 60, { color: C.mint, size: 46 }); }
    else { sfx.blip({ f: 230, f2: 120, dur: 0.24, gain: 0.2 }); if (grade.detail?.includes("wrong-scale")) api.event("misconception_sign", { id: grade.detail }); }
    api.facts({ wave: g.w + 1, call: truth, aimed: Math.round(g.ang), verdict: grade.verdict, accuracy: accOf(g.results) });
  }
  function update(dt: number) {
    g.stateT += dt; g.sweep += dt * 1.6;
    const k = 140, c = 2 * Math.sqrt(k); let d = norm360(g.target - g.ang + 180) - 180; if (wave().range === 180) d = g.target - g.ang;
    g.vel += (k * d - c * g.vel) * dt; g.ang += g.vel * dt; if (wave().range === 180) g.ang = clamp(g.ang, 0, 180); else g.ang = norm360(g.ang);
    for (const s of g.shots) s.t += dt;
    g.shots = g.shots.filter((s) => s.t < 1.2);
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startWave(0); } return; }
    if (g.state === "intro" && g.stateT > 1.8) { api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); nextCall(); }
    if (g.state === "aim" && wave().mode !== "classify") {
      g.callT += dt;
      if (g.callT > g.limit) {      // the threat slips through: graded as no shot
        const grade = api.answer(`w${g.w + 1}:${g.i}`, null, "wrong");
        g.reveal = { truth: key(), aim: g.ang, r: R() * 0.8, hit: false, t: 0, off: -1 }; g.results.push({ err: 30, verdict: grade.verdict }); g.waveRes.push({ err: 30, verdict: grade.verdict }); g.n++;
        g.state = "reveal"; g.stateT = 0; sfx.blip({ f: 300, f2: 150, dur: 0.3, gain: 0.14 });
      }
    }
    if (g.state === "aim" && wave().mode === "classify") {
      g.spawnT -= dt;
      if (g.spawned < wave().items.length && g.spawnT <= 0) { g.drones.push({ i: g.spawned, ang: wave().items[g.spawned], r: R() + 40, v: 46 * wave().speed, alive: true, shot: false, t: 0 }); g.spawned++; g.spawnT = 2.1 / wave().speed; }
      for (const dr of g.drones) {
        if (!dr.alive) continue;
        dr.t += dt; dr.r -= dr.v * dt;
        if (dr.r < 70) { dr.alive = false; const ok = angleKind(dr.ang) !== wave().kind, grade = api.answer(`w${g.w + 1}:${dr.i}`, { fired: false }, ok ? "right" : "wrong"); g.results.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.waveRes.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.n++; if (!ok) { const [x, y] = at(dr.ang, 90); api.fx.pop(`${Math.round(dr.ang)}° slipped by`, x, y - 30, { color: C.amber, size: 38, life: 1.2 }); } }
      }
      if (g.spawned >= wave().items.length && g.drones.every((x) => !x.alive)) endWave();
    }
    if (g.reveal) g.reveal.t += dt;
    if (g.state === "reveal" && g.stateT > (g.reveal?.hit ? 1.3 : 2.1)) { g.i++; if (g.i < wave().items.length) nextCall(); else endWave(); }
    if (g.state === "end" && g.stateT > 3.1) { if (g.w + 1 < spec.waves.length) startWave(g.w + 1); else { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.runDone, "done"); api.done({ hits: g.hits, shots: g.n, accuracy: accOf(g.results) }); } }
    if (g.w >= 0 && g.state !== "final") {
      hud.set("wave", `${g.w + 1}/${spec.waves.length}`); hud.set("hits", `${g.hits}/${g.n}`, { bump: true });
      const a = g.results.length ? accOf(g.results) : null; hud.set("acc", a == null ? "—" : `${a}%`, { meter: a == null ? 0 : a / 100, tone: a != null && a >= 85 ? "mint" : null });
    }
  }
  function endWave() { if (g.state === "end") return; g.state = "end"; g.stateT = 0; g.endA = 0; api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: 2.5 }); api.event("wave_end", { wave: g.w + 1, accuracy: accOf(g.waveRes) }); }
  function paintBg(c: Ctx) {
    const gr = c.createRadialGradient(500, 520, 40, 500, 420, 760); gr.addColorStop(0, "#14182A"); gr.addColorStop(1, "#07080D");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const r2 = rng(3); for (let i = 0; i < 120; i++) { c.globalAlpha = 0.2 + r2() * 0.5; c.fillStyle = "#C9D2F2"; c.fillRect(r2() * W, r2() * H * 0.8, 1.5, 1.5); }
    c.globalAlpha = 1;
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (g.w >= 0) {
      const [px, py] = pivot(), r = R(), full = wave().range === 360;
      ctx.strokeStyle = "rgba(139,152,255,.14)"; ctx.lineWidth = 2;
      for (const rr of [r * 0.4, r * 0.7, r]) { ctx.beginPath(); if (full) ctx.arc(px, py, rr, 0, Math.PI * 2); else ctx.arc(px, py, rr, Math.PI, 0); ctx.stroke(); }
      // radar sweep
      if (!api.reducedMotion && g.state !== "end") { const sa = full ? g.sweep % (Math.PI * 2) : Math.PI * (0.5 + 0.5 * Math.sin(g.sweep * 0.6)); const grd = ctx.createLinearGradient(px, py, px + Math.cos(sa) * r, py - Math.sin(sa) * r); grd.addColorStop(0, "rgba(139,152,255,0)"); grd.addColorStop(1, "rgba(139,152,255,.35)"); ctx.strokeStyle = grd; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(sa) * r, py - Math.sin(sa) * r); ctx.stroke(); }
      // zero arm (the base ray)
      ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + r + 20, py); ctx.stroke();
      api.text(ctx, "0°", px + r + 34, py + 14, { font: "mono", size: 38, weight: 600, color: C.ink2 });
      if (!full) { ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 3; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - r - 20, py); ctx.stroke(); ctx.setLineDash([]); }
      const sc = wave().scaffold;
      if (sc !== "none") {
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3;
        for (let a = 10; a < (full ? 360 : 180); a += 10) { const big = a % 90 === 0, [x0, y0] = at(a, r - (big ? 26 : 14)), [x1, y1] = at(a, r); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); if (sc === "protractor" || big) { const [lx, ly] = at(a, r + 30); api.text(ctx, `${a}`, lx, ly, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle" }); } }
      }
      // reference wedge for copy mode
      if (wave().mode === "copy" && (g.state === "aim" || g.state === "reveal")) {
        const cx = full ? 160 : 175, cy = full ? 470 : 330, a0 = g.refRot * DEG, a1 = a0 + key() * DEG;
        ctx.save(); ctx.fillStyle = "rgba(16,19,27,.85)"; ctx.beginPath(); ctx.roundRect(cx - 140, cy - 150, 280, 270, 20); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = C.ion; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * g.refLen[0], cy - Math.sin(a0) * g.refLen[0]); ctx.lineTo(cx, cy); ctx.lineTo(cx + Math.cos(a1) * g.refLen[1], cy - Math.sin(a1) * g.refLen[1]); ctx.stroke();
        ctx.strokeStyle = "rgba(139,152,255,.7)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 30, -a0, -a1, true); ctx.stroke();
        api.text(ctx, "THIS TURN", cx, cy + 96, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" });
        ctx.restore();
      }
      // drones (classify)
      for (const d of g.drones) { if (!d.alive) continue; const [x, y] = at(d.ang, d.r); ctx.save(); ctx.globalAlpha = Math.min(1, d.t * 3); ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 2; ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]); bloom(ctx, C.ion, x, y, 60, 0.4); ctx.fillStyle = "#1A2036"; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 26, y + 14); ctx.lineTo(x - 26, y + 14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
      // reveal: truth ray vs aim ray, the arc between, the decloaked threat
      if (g.reveal) {
        const rv = g.reveal, k = Math.min(1, rv.t / 0.25), [tx, ty] = at(rv.truth, rv.r);
        ctx.save(); ctx.globalAlpha = k;
        ctx.strokeStyle = rv.hit ? C.mint : C.ion; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        if (!rv.hit) { ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.beginPath(); const lo = Math.min(rv.truth, rv.aim), hi = Math.max(rv.truth, rv.aim); ctx.arc(px, py, 110, -hi * DEG, -lo * DEG); ctx.stroke(); const [mx, my] = at((rv.truth + rv.aim) / 2, 160); if (rv.off >= 0) pill(api, ctx, `${T.offBy} ${rv.off}°`, clamp(mx, 210, 790), clamp(my, 190, 600), { color: C.amber }); magnifier(ctx, tx + 40, ty - 30); }
        else tick(ctx, tx + 44, ty - 34);
        bloom(ctx, rv.hit ? C.mint : C.ion, tx, ty, 70, 0.5); ctx.fillStyle = "#1A2036"; ctx.beginPath(); ctx.moveTo(tx, ty - 24); ctx.lineTo(tx + 28, ty + 16); ctx.lineTo(tx - 28, ty + 16); ctx.closePath(); ctx.fill(); ctx.strokeStyle = rv.hit ? C.mint : C.ion; ctx.lineWidth = 4; ctx.stroke();
        pill(api, ctx, `${rv.truth}°`, clamp(tx, 220, 780), clamp(ty + 56, 200, 600), { color: rv.hit ? C.mint : C.ion });
        ctx.restore();
      }
      for (const s of g.shots) { const k = Math.min(1, s.t / 0.22), [x0, y0] = at(s.ang, 70), [x1, y1] = at(s.ang, 70 + (s.r - 70) * k); ctx.save(); ctx.globalAlpha = 1 - s.t / 1.2; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); bloom(ctx, "#FFE8B0", x1, y1, 30, 0.8); ctx.restore(); }
      // turret
      const [bx, by] = at(g.ang, 92);
      ctx.save(); bloom(ctx, g.dragging ? C.volt : C.ion, px, py, 90, 0.3);
      ctx.strokeStyle = g.dragging ? C.volt : C.ink; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = "#1F2536"; ctx.beginPath(); ctx.arc(px, py, 38, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      // call card + countdown
      if (g.state === "aim" && wave().mode === "call") {
        api.text(ctx, T.threat, 500, full ? 116 : 150, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 5 });
        api.text(ctx, `${key()}°`, 500, full ? 172 : 220, { font: "display", size: 88, weight: 800, align: "center", baseline: "middle", glow: C.ion });
      }
      if (g.state === "aim" && wave().mode !== "classify") { const k = clamp(g.callT / g.limit, 0, 1); ctx.strokeStyle = k > 0.7 ? C.amber : "rgba(255,255,255,.35)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px, py, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke(); }
    }
    fx.drawWorld(ctx); ctx.restore();
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.wave} ${g.w + 1} / ${spec.waves.length}`, title: wave().title, sub: wave().sub });
    if (g.state === "end") drawStatCard(api, ctx, { a: g.endA, head: `${T.wave} ${g.w + 1}`, ticked: true, stats: [[`${g.waveRes.filter((r) => r.verdict === "right").length}/${g.waveRes.length}`, T.hits], [`${accOf(g.waveRes)}%`, T.accuracy]] });
    if (g.state === "final") drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.hits}/${g.n}`, T.hits], [`${accOf(g.results)}%`, T.accuracy]] });
    drawCoach(api, ctx, T.coach, g.state === "aim" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (g.state !== "aim") return { type: "wait", ms: 200 };
    const r = R() * 0.6;
    const aimTo = (a: number, after = 500): BotAction => ({ type: "drag", from: at(g.ang, r), to: at(a, r), ms: 450, after });
    if (wave().mode === "classify") {
      const d = g.drones.filter((x) => x.alive && x.r < R() - 20).sort((a, b) => a.r - b.r)[0];
      if (!d) return { type: "wait", ms: 200 };
      const shouldFire = (angleKind(d.ang) === wave().kind) !== (botRnd() < 0.12);
      if (!shouldFire) return { type: "wait", ms: 300 };
      return aimTo(d.ang, 300);
    }
    return aimTo(clamp(key() + (botRnd() + botRnd() - 1) * 9, 0, wave().range === 180 ? 180 : 359.9), 400);
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, wave: g.w + 1, mode: g.w >= 0 ? wave().mode : null, call: g.w >= 0 ? key() : null, ang: +g.ang.toFixed(1), hits: g.hits, n: g.n }),
    knob(k) { if (k === "slower" || k === "easier") { g.limit *= 1.4; g.callT = 0; return true; } if (k === "again") { g.results = []; g.hits = 0; g.n = 0; startWave(0); return true; } return false; },
    board: () => ({ title: `${g.w >= 0 && wave().mode !== "classify" ? key() : 120}° is a turn`, lines: ["Start at the zero arm and turn anticlockwise.", "Longer arms don't make a bigger angle."], figure: { kind: "angle", deg: g.w >= 0 && wave().mode !== "classify" ? key() : 120 }, accent: C.ion }),
  };
}
export const angle: EngineDef<AngleSpec> = { archetype: "angle-cannon@1", label: "Game · Turret", accent: C.ion, create };
