// LIGHTHOUSE — `angle-cannon@1` (STUDIO-V2 §6.1 #7; the archetype id is historical). Angles as turns, under time: the
// lighthouse's beam turns from the zero arm (anticlockwise); there is no angle readout, so every light is an estimate of the
// turn. The boat at the called angle sits in the dark until the light reveals where the called angle really is: on target
// the boat lights up, off target the beam passes beside it. "Copy the turn" shows a reference wedge with arms of a
// different length and orientation (c5-maths-ch03-t01-m-angle-is-length); "Obtuse only" makes the child light only the
// boats coming in on an obtuse bearing, by eye; "Past straight" opens the full turn (reflex). The beam's angle is the act;
// the host grades it. (Words and picture agree: a beam of light, boats, no projectile, no muzzle, no recoil — judges fail
// a piece whose words disagree with its picture; 2026-11-11.)
import { angleKind, type AngleSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, DEG, hexA, norm360, rng } from "../core/math.ts";
import { bloom, magnifier, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill, wrapLines } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";
import { dots, tally } from "../core/dots.ts";

/** A boat coming in along its bearing (classify mode). `litT` counts up once the beam has lit it. */
interface Boat { i: number; ang: number; r: number; v: number; alive: boolean; lit: boolean; litT: number; t: number }
/** One "light it": the beam flares along the angle it was let go at, then fades. */
interface Flash { ang: number; r: number; hit: boolean; t: number }
/** The beam's colour: warm lamplight (the palette's sun token). */
const LAMP = C.sun;
/** Least gap (world units) between two neighbouring scale labels. */
const LABEL_GAP = 10;
/**
 * The dial's numbers. Both scaffolds tick every 10°; "tens" numbers the right angles (90, 180, 270), "protractor" numbers
 * the ticks at the finest step of 10°, 30° or 90° whose labels keep a LABEL_GAP between every pair at the label's real size
 * (`box` measures one: "110" ran into "100" at l1366, 2026-11-11). In a wave that asks for angles (`asked`: call, copy) no
 * number is drawn at an asked angle — its tick stays, the other numbers stay so the scale is still a scale (rubric v2: a
 * guide mark that draws the asked tick gives the answer; c5-ch03-t01 printed 90/180/270 at the called 90/180/270).
 */
export function scaleLabels(sc: "none" | "tens" | "protractor", range: 180 | 360, asked: readonly number[], box: (a: number) => [number, number, number, number]): number[] {
  if (sc === "none") return [];
  const lattice = (step: number) => { const out: number[] = []; for (let a = step; a < range; a += step) out.push(a); return out; };
  const clear = (as: number[]) => { const bs = as.map(box); return bs.every((p, i) => bs.every((q, j) => j <= i || p[2] + LABEL_GAP <= q[0] || q[2] + LABEL_GAP <= p[0] || p[3] + LABEL_GAP <= q[1] || q[3] + LABEL_GAP <= p[1])); };
  const steps = sc === "tens" ? [90] : [10, 30, 90];
  const pick = steps.map(lattice).find(clear) ?? lattice(90);
  const ask = new Set(asked.map((a) => Math.round(a)));
  return pick.filter((a) => !ask.has(a));
}

function create(api: EngineApi, spec: AngleSpec): EngineInstance {
  const T = spec.strings;
  const g = { state: "boot" as "boot" | "intro" | "aim" | "reveal" | "end" | "final", w: -1, i: 0, stateT: 0, ang: 30, target: 30, vel: 0, dragging: false, moved: false, callT: 0, limit: 7,
    boats: [] as Boat[], flashes: [] as Flash[], reveal: null as null | { truth: number; aim: number; r: number; hit: boolean; t: number; off: number }, refRot: 0, refLen: [140, 90] as [number, number],
    hits: 0, n: 0, results: [] as { err: number; verdict: string }[], waveRes: [] as { verdict: string; err: number }[], introA: 0, coachA: 1, coachGone: false, bootT: 0, endA: 0, finalA: 0, spawnT: 0, spawned: 0, pill: false, coachTop: 576 };
  const botRnd = rng(api.seed * 19 + 7);
  const wave = () => spec.waves[Math.max(0, g.w)];
  // the full turn fits between the HUD row and a two-line coach band (its 90 and 270 labels whole and clear of both)
  // (the half turn's pivot rises when the coach wraps to two lines — a young child's 43-unit floor — so the lighthouse's tower
  // stands clear above the coach: g.coachTop is measured at the first frame, 576 for a one-line coach)
  const pivot = (): XY => (wave().range === 360 ? [500, 300] : [500, clamp(g.coachTop - 52, 460, 500)]);
  // (the half turn's radius gives way to the host's task pill where it sits over the world, so the protractor's top labels
  // stay clear of it: at l1366 "60 … 120" lay under "COPY THIS TURN" — layout probe, 2026-11-11)
  const R = () => (wave().range === 360 ? 170 : clamp(pivot()[1] - 53 - api.chromeBottom(), 290, 360));
  const hud = api.hud([{ key: "wave", label: T.wave }, { key: "hits", label: T.hits }, { key: "acc", label: T.accuracy, meter: true }]);
  const accOf = (r: { err: number }[]) => (r.length ? Math.round(100 * (r.reduce((a, b) => a + (1 - Math.min(1, b.err / 30)), 0) / r.length)) : 100);
  const at = (ang: number, r: number): XY => { const [px, py] = pivot(); return [px + Math.cos(ang * DEG) * r, py - Math.sin(ang * DEG) * r]; };
  const angOf = (x: number, y: number) => { const [px, py] = pivot(); let a = Math.atan2(py - y, x - px) / DEG; if (wave().range === 180) a = clamp(a < -90 ? 180 : a, 0, 180); else a = norm360(a); return a; };
  const key = () => wave().items[g.i];
  function startWave(k: number) {
    g.w = k; g.i = 0; g.state = "intro"; g.stateT = 0; g.introA = 0; g.waveRes = []; g.boats = []; g.spawned = 0; g.spawnT = 0;
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
    // call mode: the big call card on the stage is the cue; no duplicate pill — unless an earlier wave left one up (the host
    // keeps the last pill: "LIGHT ONLY OBTUSE" stayed over the full-turn calls), then it says the call too
    else if (g.pill) api.task(`${T.wave} ${g.w + 1}`, `${T.threat} ${key()}°`);
    if (wave().mode !== "call") g.pill = true;
  }
  api.onPointer({
    down(p) { if (g.state !== "aim") return; if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); } g.dragging = true; g.moved = false; g.target = angOf(p.x, p.y); },
    move(p) { if (!g.dragging) return; g.moved = true; g.target = angOf(p.x, p.y); },
    up() { if (!g.dragging) return; g.dragging = false; lightIt(); },
  });
  function lightIt() {
    if (g.state !== "aim") return;
    g.ang = g.target;
    sfx.blip({ f: 740, f2: 1110, dur: 0.16, type: "sine", gain: 0.12 });   // the lamp brightening: a soft rising chime
    if (wave().mode === "classify") {
      // the beam lights a boat within 8° of its bearing; off every bearing it lights only the sea
      const d = g.boats.filter((x) => x.alive).sort((a, b) => Math.abs(norm360(a.ang - g.ang + 180) - 180) - Math.abs(norm360(b.ang - g.ang + 180) - 180))[0];
      g.flashes.push({ ang: g.ang, r: R() + 60, hit: false, t: 0 });
      if (d && Math.abs(norm360(d.ang - g.ang + 180) - 180) <= 8) {
        d.alive = false; d.lit = true; d.litT = 0;
        // (`fired` is the graded act's field name: the child chose to light this boat)
        const ok = angleKind(d.ang) === wave().kind, grade = api.answer(`w${g.w + 1}:${d.i}`, { fired: true }, ok ? "right" : "wrong");
        const [x, y] = at(d.ang, d.r);
        if (grade.verdict === "right") { g.hits++; api.fx.ring(x, y, { color: C.mint, r0: 8, r1: 80, life: 0.5, width: 6 }); api.fx.pop(T.hit, x, y - 50, { color: C.mint, size: 42 }); sfx.blip({ f: 660, f2: 1320, dur: 0.18, type: "triangle", gain: 0.18 }); api.hitstop(50); }
        else { api.fx.ring(x, y, { color: C.amber, r0: 8, r1: 64, life: 0.5, width: 5 }); api.fx.pop(`${Math.round(d.ang)}° · ${angleKind(d.ang)}`, x, y - 50, { color: C.amber, size: 40, life: 1.4 }); sfx.blip({ f: 330, f2: 247, dur: 0.22, type: "sine", gain: 0.14 }); }
        g.results.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.waveRes.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.n++;
      }
      return;
    }
    const truth = key(), err = Math.abs(norm360(g.ang - truth + 180) - 180);
    const local = err <= 5 ? "right" : err <= 12 ? "partial" : "wrong";
    const grade = api.answer(`w${g.w + 1}:${g.i}`, +g.ang.toFixed(1), local);
    const hit = grade.verdict === "right", r = R() * (0.7 + api.rnd() * 0.25);
    g.reveal = { truth, aim: g.ang, r, hit, t: 0, off: Math.round(err) };
    g.flashes.push({ ang: g.ang, r: R() + 80, hit, t: 0 });
    g.results.push({ err, verdict: grade.verdict }); g.waveRes.push({ err, verdict: grade.verdict }); g.n++;
    g.state = "reveal"; g.stateT = 0;
    const [tx, ty] = at(truth, r);
    // on target the boat lights up (a glow pulse once the beam reaches it); off target the beam passes beside it
    if (hit) { g.hits++; setTimeout(() => { api.fx.ring(tx, ty, { color: C.mint, r0: 10, r1: 110, life: 0.6, width: 7 }); api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.2 }); }, 180); api.fx.pop(T.hit, wave().range === 360 ? 150 : tx, wave().range === 360 ? 330 : ty - 60, { color: C.mint, size: 46 }); }   // (the full turn's ring is small: its pop goes to the open left column, not over the zero arm)
    else { sfx.blip({ f: 330, f2: 220, dur: 0.24, type: "sine", gain: 0.16 }); if (grade.detail?.includes("wrong-scale")) api.event("misconception_sign", { id: grade.detail }); }
    api.facts({ wave: g.w + 1, call: truth, aimed: Math.round(g.ang), verdict: grade.verdict, accuracy: accOf(g.results) });
  }
  function update(dt: number) {
    g.stateT += dt;
    const k = 140, c = 2 * Math.sqrt(k); let d = norm360(g.target - g.ang + 180) - 180; if (wave().range === 180) d = g.target - g.ang;
    g.vel += (k * d - c * g.vel) * dt; g.ang += g.vel * dt; if (wave().range === 180) g.ang = clamp(g.ang, 0, 180); else g.ang = norm360(g.ang);
    for (const s of g.flashes) s.t += dt;
    g.flashes = g.flashes.filter((s) => s.t < 1.2);
    for (const b of g.boats) if (b.lit) b.litT += dt;
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startWave(0); } return; }
    if (g.state === "intro" && g.stateT > 1.8) { api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); nextCall(); }
    if (g.state === "aim" && wave().mode !== "classify") {
      g.callT += dt;
      if (g.callT > g.limit) {      // time runs out with no light: graded as no answer
        const grade = api.answer(`w${g.w + 1}:${g.i}`, null, "wrong");
        g.reveal = { truth: key(), aim: g.ang, r: R() * 0.8, hit: false, t: 0, off: -1 }; g.results.push({ err: 30, verdict: grade.verdict }); g.waveRes.push({ err: 30, verdict: grade.verdict }); g.n++;
        g.state = "reveal"; g.stateT = 0; sfx.blip({ f: 300, f2: 150, dur: 0.3, gain: 0.14 });
      }
    }
    if (g.state === "aim" && wave().mode === "classify") {
      g.spawnT -= dt;
      if (g.spawned < wave().items.length && g.spawnT <= 0) { g.boats.push({ i: g.spawned, ang: wave().items[g.spawned], r: R() + 40, v: 46 * wave().speed, alive: true, lit: false, litT: 0, t: 0 }); g.spawned++; g.spawnT = 2.1 / wave().speed; }
      for (const dr of g.boats) {
        if (!dr.alive) continue;
        dr.t += dt; dr.r -= dr.v * dt;
        if (dr.r < 70) { dr.alive = false; const ok = angleKind(dr.ang) !== wave().kind, grade = api.answer(`w${g.w + 1}:${dr.i}`, { fired: false }, ok ? "right" : "wrong"); g.results.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.waveRes.push({ err: grade.verdict === "right" ? 0 : 30, verdict: grade.verdict }); g.n++; if (!ok) { const [x, y] = at(dr.ang, 90); api.fx.pop(`${Math.round(dr.ang)}° slipped by`, x, y - 30, { color: C.amber, size: 38, life: 1.2 }); } }
      }
      if (g.spawned >= wave().items.length && g.boats.every((x) => !x.alive)) endWave();
    }
    if (g.reveal) g.reveal.t += dt;
    if (g.state === "reveal" && g.stateT > (g.reveal?.hit ? 1.3 : 2.1)) { g.i++; if (g.i < wave().items.length) nextCall(); else endWave(); }
    if (g.state === "end" && g.stateT > 3.1) { if (g.w + 1 < spec.waves.length) startWave(g.w + 1); else { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.runDone, "done"); api.done({ hits: g.hits, shots: g.n, accuracy: accOf(g.results) }); } }
    if (g.w >= 0 && g.state !== "final") {
      hud.set("wave", `${dots(g.w, spec.waves.length)}`); hud.set("hits", tally(g.waveRes.filter((x) => x.verdict === "right").length, wave().items.length), { bump: true });   // the wave in play, "0/4" from its intro on
      const a = g.results.length ? accOf(g.results) : null; hud.set("acc", a == null ? "—" : `${a}%`, { meter: a == null ? 0 : a / 100, tone: a != null && a >= 85 ? "mint" : null });
    }
  }
  function endWave() { if (g.state === "end") return; g.state = "end"; g.stateT = 0; g.endA = 0; api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: 2.5 }); api.event("wave_end", { wave: g.w + 1, accuracy: accOf(g.waveRes) }); }
  /** Night sky over a dark sea. The half turn's zero arm is the shoreline (the sea below it); the full turn's lighthouse
   *  stands on a rock in open water (the sea all round). */
  function paintBg(c: Ctx, full: boolean, shore: number) {
    const gr = c.createRadialGradient(500, full ? 300 : 520, 40, 500, 420, 760); gr.addColorStop(0, full ? "#101C30" : "#14182A"); gr.addColorStop(1, "#07080D");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const r2 = rng(3);
    if (!full) {
      for (let i = 0; i < 120; i++) { c.globalAlpha = 0.2 + r2() * 0.5; c.fillStyle = "#C9D2F2"; c.fillRect(r2() * W, r2() * (shore - 30), 1.5, 1.5); }
      c.globalAlpha = 1; const sea = c.createLinearGradient(0, shore, 0, H); sea.addColorStop(0, "#0E1A2E"); sea.addColorStop(1, "#080C16");
      c.fillStyle = sea; c.fillRect(0, shore, W, H - shore);
    }
    // wave glints
    c.strokeStyle = "rgba(139,152,255,.16)"; c.lineWidth = 2; c.lineCap = "round";
    for (let i = 0; i < (full ? 46 : 18); i++) { const x = r2() * W, y = full ? r2() * H : shore + 20 + r2() * (H - shore - 30), w = 14 + r2() * 26; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 5, x + w, y); c.stroke(); }
  }
  /** A small boat (hull, mast, sail) centred on (x, y): dark at sea, lamp-lit once the beam finds it. */
  function boat(ctx: Ctx, x: number, y: number, edge: string, lit: number) {
    ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (lit > 0) bloom(ctx, LAMP, x, y, 64, 0.55 * lit);
    ctx.fillStyle = "#1A2036"; ctx.strokeStyle = edge; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 28, y + 4); ctx.lineTo(x + 28, y + 4); ctx.lineTo(x + 18, y + 17); ctx.lineTo(x - 18, y + 17); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2, y + 4); ctx.lineTo(x - 2, y - 26); ctx.stroke();
    ctx.fillStyle = lit > 0 ? hexA(LAMP, 0.35 + 0.6 * lit) : "#232A44";
    ctx.beginPath(); ctx.moveTo(x + 2, y - 24); ctx.lineTo(x + 22, y); ctx.lineTo(x + 2, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  /** A wedge of light from the lamp along `ang` (half-width `half`°), fading out along its length. */
  function beam(ctx: Ctx, ang: number, len: number, half: number, a: number) {
    if (a <= 0.01) return;
    const [px, py] = pivot(), [ex, ey] = at(ang, len);
    const gr = ctx.createLinearGradient(px, py, ex, ey); gr.addColorStop(0, hexA(LAMP, 0.5 * a)); gr.addColorStop(0.7, hexA(LAMP, 0.16 * a)); gr.addColorStop(1, hexA(LAMP, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, len, -(ang + half) * DEG, -(ang - half) * DEG); ctx.closePath(); ctx.fill();
  }
  /** The top of the coach block (one line, or two at the young floor; drawCoach grows it upward from y 606). */
  function coachTopOf(ctx: Ctx): number {
    const o = { font: "mono" as const, size: 38, weight: 500 }, size = Math.max(38, api.minLabel), n = Math.max(1, wrapLines(api, ctx, T.coach, 960, o).slice(0, 3).length);
    return 606 - (n - 1) * size * 1.15 - size * 0.8;
  }
  /** The lighthouse: a striped tower under the pivot, its lamp room AT the pivot (the angle's vertex: the beam turns about it). */
  function lighthouse(ctx: Ctx, px: number, py: number, full: boolean, hot: boolean) {
    const hgt = full ? 52 : clamp(g.coachTop - 8 - py, 24, 70), t = 15, b = t + (full ? 9 : 13) * (hgt - 16) / 54;
    ctx.save(); ctx.lineJoin = "round";
    if (full) { ctx.fillStyle = "#1B2233"; ctx.beginPath(); ctx.ellipse(px, py + hgt + 6, 46, 13, 0, 0, Math.PI * 2); ctx.fill(); }
    // tower (tapered), warm bands (one on a short tower)
    ctx.fillStyle = "#D9DEEA"; ctx.beginPath(); ctx.moveTo(px - t, py + 16); ctx.lineTo(px + t, py + 16); ctx.lineTo(px + b, py + hgt); ctx.lineTo(px - b, py + hgt); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hexA(C.amber, 0.85);
    for (const f of hgt > 40 ? [0.38, 0.72] : [0.45]) { const y0 = py + 16 + (hgt - 16) * f, y1 = y0 + (hgt - 16) * 0.16, w0 = t + (b - t) * f, w1 = t + (b - t) * (f + 0.16); ctx.beginPath(); ctx.moveTo(px - w0, y0); ctx.lineTo(px + w0, y0); ctx.lineTo(px + w1, y1); ctx.lineTo(px - w1, y1); ctx.closePath(); ctx.fill(); }
    // gallery rail and the lamp room (glazed, lit), its roof
    ctx.fillStyle = "#2A3146"; ctx.fillRect(px - 21, py + 12, 42, 6);
    bloom(ctx, LAMP, px, py, hot ? 84 : 72, hot ? 0.7 : 0.55);
    ctx.fillStyle = hexA(LAMP, 0.95); ctx.beginPath(); ctx.roundRect(px - 12, py - 12, 24, 24, 5); ctx.fill();
    ctx.strokeStyle = hot ? C.volt : "#2A3146"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#2A3146"; ctx.beginPath(); ctx.moveTo(px - 15, py - 12); ctx.lineTo(px, py - 26); ctx.lineTo(px + 15, py - 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    g.coachTop = coachTopOf(ctx);
    const full0 = g.w >= 0 && wave().range === 360;
    const shore = g.w >= 0 ? pivot()[1] : 500;
    ctx.drawImage(api.layer(full0 ? "bg360" : `bg180-${Math.round(shore)}`, (c) => paintBg(c, full0, shore)), 0, 0, W, H);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (g.w >= 0) {
      const [px, py] = pivot(), r = R(), full = wave().range === 360;
      ctx.strokeStyle = "rgba(139,152,255,.14)"; ctx.lineWidth = 2;
      for (const rr of [r * 0.4, r * 0.7, r]) { ctx.beginPath(); if (full) ctx.arc(px, py, rr, 0, Math.PI * 2); else ctx.arc(px, py, rr, Math.PI, 0); ctx.stroke(); }
      // zero arm (the base ray)
      ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + r + 20, py); ctx.stroke();
      api.text(ctx, "0°", px + r + 34, py + 14, { font: "mono", size: 38, weight: 600, color: C.ink2 });
      if (!full) { ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 3; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - r - 20, py); ctx.stroke(); ctx.setLineDash([]); }
      const sc = wave().scaffold;
      /** boxes the reveal's label must not cover: the protractor's labels, "0°", the lighthouse, the reference card */
      const keepOut: [number, number, number, number][] = [[px + r + 30, py - 22, px + r + 90, py + 22], [px - 34, py - 30, px + 34, py + 72]];
      if (sc !== "none") {
        ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3;
        for (let a = 10; a < (full ? 360 : 180); a += 10) { const big = a % 90 === 0, [x0, y0] = at(a, r - (big ? 26 : 14)), [x1, y1] = at(a, r); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
        const lo = { font: "mono" as const, size: 38, weight: 600 }, hh = Math.max(38, api.minLabel) * 0.5;
        const box = (a: number): [number, number, number, number] => { const [lx, ly] = at(a, r + 30), hw = api.measure(ctx, `${a}`, lo) / 2; return [lx - hw, ly - hh, lx + hw, ly + hh]; };
        for (const a of scaleLabels(sc, full ? 360 : 180, wave().mode === "classify" ? [] : wave().items, box)) {
          const [lx, ly] = at(a, r + 30); api.text(ctx, `${a}`, lx, ly, { ...lo, color: C.ink3, align: "center", baseline: "middle" }); keepOut.push([lx - 40, ly - 22, lx + 40, ly + 22]);
        }
      }
      // reference wedge for copy mode
      if (wave().mode === "copy" && (g.state === "aim" || g.state === "reveal")) {
        // (the full turn's box stays left of its 180 label; the half turn's box sits on the side the called angle is NOT on,
        // so the boat and its label at the reveal never land on it)
        const cx = full ? 132 : key() > 90 ? 825 : 175, cy = full ? 420 : 330, a0 = g.refRot * DEG, a1 = a0 + key() * DEG, bw = full ? 236 : 280;
        keepOut.push([cx - bw / 2, cy - 150, cx + bw / 2, cy + 120]);
        ctx.save(); ctx.fillStyle = "rgba(16,19,27,.85)"; ctx.beginPath(); ctx.roundRect(cx - bw / 2, cy - 150, bw, 270, 20); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = C.ion; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * g.refLen[0], cy - Math.sin(a0) * g.refLen[0]); ctx.lineTo(cx, cy); ctx.lineTo(cx + Math.cos(a1) * g.refLen[1], cy - Math.sin(a1) * g.refLen[1]); ctx.stroke();
        ctx.strokeStyle = "rgba(139,152,255,.7)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 30, -a0, -a1, true); ctx.stroke();
        api.text(ctx, "THIS TURN", cx, cy + 96, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", maxWidth: bw - 20 });
        ctx.restore();
      }
      // the lighthouse, its beam along the arm the child turns, and the flare of each "light it" (under the boats and the
      // reveal's labels: the light passes behind them)
      lighthouse(ctx, px, py, full, g.dragging);
      for (const f of g.flashes) { const k = 1 - f.t / 1.2; beam(ctx, f.ang, 40 + (f.r - 40) * Math.min(1, f.t / 0.15), 6, k); }
      beam(ctx, g.ang, r + 10, 4, g.state === "aim" ? 0.9 : 0.6);
      { const [x0, y0] = at(g.ang, 18), [x1, y1] = at(g.ang, r + 10); ctx.save(); ctx.strokeStyle = g.dragging ? C.volt : hexA(LAMP, 0.95); ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); }
      // boats coming in along their bearings (classify); a lit boat glows for a moment, then sails off
      for (const d of g.boats) {
        if (!d.alive && !(d.lit && d.litT < 1)) continue;
        const [x, y] = at(d.ang, d.r), good = angleKind(d.ang) === wave().kind;
        ctx.save(); ctx.globalAlpha = d.lit ? 1 - d.litT : Math.min(1, d.t * 3);
        if (!d.lit) { ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 2; ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]); }
        boat(ctx, x, y, d.lit ? (good ? C.mint : C.amber) : C.ion, d.lit ? 1 : 0);
        ctx.restore();
      }
      // reveal: the called bearing (dashed) vs where the beam went, the arc between, the boat that was waiting there
      if (g.reveal) {
        const rv = g.reveal, k = Math.min(1, rv.t / 0.25), [tx, ty] = at(rv.truth, rv.r);
        ctx.save(); ctx.globalAlpha = k;
        ctx.strokeStyle = rv.hit ? C.mint : C.ion; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        if (!rv.hit) { ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.beginPath(); const lo = Math.min(rv.truth, rv.aim), hi = Math.max(rv.truth, rv.aim); ctx.arc(px, py, 110, -hi * DEG, -lo * DEG); ctx.stroke(); magnifier(ctx, tx + 44, ty - 34); }
        else tick(ctx, tx + 44, ty - 34);
        boat(ctx, tx, ty, rv.hit ? C.mint : C.ion, rv.hit ? Math.min(1, Math.max(0, (rv.t - 0.12) / 0.2)) : 0);
        // one label under the boat: the called angle, and by how much the beam missed it (two pills collided on the full turn)
        // (placed where it covers no protractor label, the lighthouse or the reference card: under the boat, else above it,
        // else on the lamp's side of it — layout probe, 2026-11-11: "270°" sat on the 270 label, "45° · off by 5°" on 20 and 30)
        const lab = !rv.hit && rv.off >= 0 ? `${rv.truth}° · ${T.offBy} ${rv.off}°` : `${rv.truth}°`, lw = api.measure(ctx, lab, { font: "mono", size: 40, weight: 600 }) / 2 + 26;
        const [ix, iy] = at(rv.truth, Math.max(70, rv.r - 96));
        const spots: XY[] = [[tx, ty + 56], [tx, ty - 78], [ix, iy], ...(full ? [] : [[px, py - 100] as XY]), [tx + lw + 40, ty], [tx - lw - 40, ty]].map(([x, y]) => [clamp(x, lw, W - lw), clamp(y, 200, 590)] as XY);
        const hits = ([x, y]: XY) => keepOut.some((b) => x - lw < b[2] && x + lw > b[0] && y - 31 < b[3] && y + 31 > b[1]);
        const [sx, sy] = spots.find((p) => !hits(p)) ?? spots[0];
        pill(api, ctx, lab, sx, sy, { color: rv.hit ? C.mint : !rv.hit && rv.off >= 0 ? C.amber : C.ion });
        ctx.restore();
      }
      // call card + countdown
      if (g.state === "aim" && wave().mode === "call") {
        // the call card sits clear of the 90 label: the full turn's left column; inside the half turn's arc, under its top
        const cxc = full ? 132 : 500;
        api.text(ctx, T.threat, cxc, full ? 214 : 272, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", track: 5, maxWidth: full ? 236 : 600 });
        api.text(ctx, `${key()}°`, cxc, full ? 318 : 342, { font: "display", size: 88, weight: 800, align: "center", baseline: "middle", glow: C.ion });
      }
      if (g.state === "aim" && wave().mode !== "classify") { const k = clamp(g.callT / g.limit, 0, 1); ctx.strokeStyle = k > 0.7 ? C.amber : "rgba(255,255,255,.35)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px, py, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke(); }
    }
    fx.drawWorld(ctx); ctx.restore();
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.wave} ${dots(g.w, spec.waves.length)}`, title: wave().title, sub: wave().sub });
    if (g.state === "end") drawStatCard(api, ctx, { a: g.endA, head: `${T.wave} ${g.w + 1}`, ticked: true, stats: [[`${g.waveRes.filter((r) => r.verdict === "right").length}/${g.waveRes.length}`, T.hits], [`${accOf(g.waveRes)}%`, T.accuracy]] });
    if (g.state === "final") drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.hits}/${g.n}`, T.hits], [`${accOf(g.results)}%`, T.accuracy]] });
    drawCoach(api, ctx, T.coach, g.state === "aim" ? g.coachA : 0, now, 606, 960);
  }
  function bot(): BotAction | null {
    if (g.state !== "aim") return { type: "wait", ms: 200 };
    const r = R() * 0.6;
    const aimTo = (a: number, after = 500): BotAction => ({ type: "drag", from: at(g.ang, r), to: at(a, r), ms: 450, after });
    if (wave().mode === "classify") {
      const d = g.boats.filter((x) => x.alive && x.r < R() - 20).sort((a, b) => a.r - b.r)[0];
      if (!d) return { type: "wait", ms: 200 };
      const shouldLight = (angleKind(d.ang) === wave().kind) !== (botRnd() < 0.12);
      if (!shouldLight) return { type: "wait", ms: 300 };
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
export const angle: EngineDef<AngleSpec> = { archetype: "angle-cannon@1", label: "Game · Lighthouse", accent: C.ion, create };
