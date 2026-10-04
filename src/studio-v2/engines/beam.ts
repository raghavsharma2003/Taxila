// TILT — `balance-beam@1` (STUDIO-V2 §6.1 #5). Torque physics: the beam's angular acceleration comes from the real
// moment sum (weight × distance), with damping and end stops, so every placement is felt as the beam swings and
// settles. Rounds: level it; further out; a mystery crate that reveals its weight once balanced (an equation solved
// as an act); "same to both sides" (remove pairs and stay level: 2x + 3 = 11 → 2x = 8); grams that balance a
// kilogram on a pan scale. Placements are the act; the host recomputes the torque from the spec and grades.
import { torque, type BeamSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { DEG, lerp } from "../core/math.ts";
import { bloom, roundRect, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const PIV: XY = [500, 380], PEG = 76, TRAY_Y = 560;
type Side = "left" | "right";
interface Item { id: number; w: number; side: Side | null; d: number; fixed: boolean; unknown: boolean; tx: number; ty: number; x: number; y: number }

function create(api: EngineApi, spec: BeamSpec): EngineInstance {
  const T = spec.strings;
  const g = { state: "boot" as "boot" | "intro" | "play" | "won" | "end" | "final", r: -1, stateT: 0, theta: 0, omega: 0, items: [] as Item[], drag: null as null | { it: Item; ox: number; oy: number; from: { side: Side | null; d: number } }, hover: null as null | { side: Side; d: number },
    levelT: 0, removedL: [] as { w: number; d: number }[], removedR: [] as { w: number; d: number }[], results: [] as { verdict: string }[], introA: 0, coachA: 1, coachGone: false, bootT: 0, endA: 0, finalA: 0, reveal: 0, nid: 1, thud: 0 };
  const round = () => spec.rounds[Math.max(0, g.r)];
  const pans = () => round().mode === "pans";
  const unit = () => (round().unit === "g" ? T.g : T.kg);
  const hud = api.hud([{ key: "round", label: T.round }, { key: "left", label: "left" }, { key: "right", label: "right" }]);
  const beamPt = (side: Side, d: number, lift = 0): XY => { const s = side === "left" ? -1 : 1, x = s * d * PEG, c = Math.cos(g.theta), sn = Math.sin(g.theta); return [PIV[0] + x * c + lift * sn, PIV[1] + x * sn - lift * c]; };
  const on = (side: Side) => g.items.filter((i) => i.side === side);
  const moments = () => { const L = on("left").map((i) => ({ w: i.w, d: i.d })), R = on("right").map((i) => ({ w: i.w, d: i.d })); return { L, R, tq: torque(L, R) }; };
  const sizeOf = (w: number) => (pans() ? 30 + Math.sqrt(w) * 1.6 : 38 + Math.sqrt(w) * 9);
  function startRound(i: number) {
    g.r = i; g.state = "intro"; g.stateT = 0; g.introA = 0; g.items = []; g.removedL = []; g.removedR = []; g.levelT = 0; g.reveal = 0; g.theta = 0; g.omega = 0;
    const rd = round();
    for (const p of rd.left) g.items.push(mk(p.w, "left", p.d, true, false));
    for (const p of rd.right) g.items.push(mk(p.w, "right", p.d, true, false));
    if (rd.unknown) for (let k = 0; k < rd.unknown.n; k++) g.items.push(mk(rd.unknown.w, "left", rd.unknown.d, true, true));
    if (rd.mode === "sameBoth") for (const it of g.items) if (!it.unknown) it.fixed = false;      // the ones may be lifted off; crates stay
    layoutTray(); stackAll(true);
    api.tw.add(g, { introA: 1 }, { dur: 0.45 });
    api.task(`${T.round} ${i + 1}/${spec.rounds.length}`, rd.mode === "sameBoth" ? T.sameBoth : rd.mode === "unknown" ? "Balance it to find the crate" : rd.mode === "pans" ? "Balance one kilogram with grams" : "Make the beam level");
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("round_start", { round: i + 1, mode: rd.mode, targets: rd.targets ?? null });
  }
  function mk(w: number, side: Side | null, d: number, fixed: boolean, unknown: boolean): Item { return { id: g.nid++, w, side, d, fixed, unknown, tx: 0, ty: 0, x: 500, y: TRAY_Y }; }
  function layoutTray() {
    const tray = round().tray; let x = 500 - ((tray.length - 1) * 110) / 2;
    for (const w of tray) { const it = mk(w, null, 0, false, false); it.x = it.tx = x; it.y = it.ty = TRAY_Y; g.items.push(it); x += 110; }
  }
  function stackAll(snap = false) {
    // items on the same peg stack upward; tray items sit in their slots
    const slots = new Map<string, number>();
    for (const it of g.items) {
      if (!it.side) continue;
      const k = `${it.side}:${it.d}`, n = slots.get(k) ?? 0; slots.set(k, n + 1);
      const sz = sizeOf(it.w);
      it.ty = n * (sz + 4) + sz / 2 + 8;       // lift above the beam (applied in beam frame at render)
      if (snap) { it.x = 0; it.y = it.ty; }
    }
  }
  api.onPointer({
    down(p) {
      if (g.state !== "play") return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); }
      let best: Item | null = null, bd = 70;
      for (const it of g.items) { if (it.fixed) continue; const [x, y] = posOf(it); const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = it; } }
      if (!best) return;
      const [x, y] = posOf(best);
      g.drag = { it: best, ox: p.x - x, oy: p.y - y, from: { side: best.side, d: best.d } };
      best.side = null; best.x = x; best.y = y; stackAll();
      sfx.blip({ f: 500, dur: 0.05, type: "square", gain: 0.05 });
    },
    move(p) {
      if (!g.drag) return;
      g.drag.it.x = p.x - g.drag.ox; g.drag.it.y = p.y - g.drag.oy;
      g.hover = nearestPeg(g.drag.it.x, g.drag.it.y);
    },
    up() {
      if (!g.drag) return;
      const it = g.drag.it, from = g.drag.from, h = g.hover; g.drag = null; g.hover = null;
      if (h) { it.side = h.side; it.d = h.d; sfx.blip({ f: 300, f2: 200, dur: 0.08, type: "square", gain: 0.1 }); }
      else {
        it.side = null;
        if (round().mode === "sameBoth" && from.side) { (from.side === "left" ? g.removedL : g.removedR).push({ w: it.w, d: from.d }); g.items.splice(g.items.indexOf(it), 1); api.fx.burst(it.x, it.y, { n: 10, color: C.ink3, speed: 160, life: 0.4, size: 7 }); sfx.noise({ dur: 0.1, f: 500, gain: 0.08 }); }
        else { it.tx = it.x; it.ty = TRAY_Y; relayTray(); }
      }
      stackAll(); g.levelT = 0;
    },
  });
  function relayTray() { const free = g.items.filter((x) => !x.side && !x.fixed); let x = 500 - ((free.length - 1) * 110) / 2; for (const it of free) { it.tx = x; it.ty = TRAY_Y; x += 110; } }
  function nearestPeg(x: number, y: number): { side: Side; d: number } | null {
    let best: { side: Side; d: number } | null = null, bd = 80;
    for (const side of ["left", "right"] as Side[]) for (const d of pans() ? [4] : [1, 2, 3, 4, 5]) { const [px, py] = beamPt(side, d, pans() ? -110 : 30); const dd = Math.hypot(x - px, y - py); if (dd < bd) { bd = dd; best = { side, d }; } }
    return best;
  }
  function posOf(it: Item): XY {
    if (!it.side) return [it.x, it.y];
    if (pans()) { const [hx, hy] = beamPt(it.side, 4); const n = on(it.side).indexOf(it); return [hx - 30 + (n % 3) * 30, hy + 150 - Math.floor(n / 3) * 34 - sizeOf(it.w) / 2]; }
    return beamPt(it.side, it.d, it.ty);
  }
  function update(dt: number) {
    g.stateT += dt;
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startRound(0); } return; }
    if (g.state === "intro" && g.stateT > 1.8) { g.state = "play"; g.stateT = 0; api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); }
    const { tq, L, R } = moments();
    // rigid beam: I·α = τ·g·k − c·ω; end stops at ±14°
    const tqN = pans() ? tq / 200 : tq, I = 6 + g.items.filter((i) => i.side).length * 0.6;
    const alpha = (tqN * 1.1) / I - 2.6 * g.omega - (tq === 0 ? 9 * g.theta : 0);
    g.omega += alpha * dt; g.theta += g.omega * dt;
    const stop = 14 * DEG;
    if (Math.abs(g.theta) > stop) { g.theta = Math.sign(g.theta) * stop; if (Math.abs(g.omega) > 0.4) { g.thud = 0.2; sfx.noise({ dur: 0.08, f: 300, gain: Math.min(0.25, Math.abs(g.omega) * 0.1) }); api.fx.shake(2, 0.12); } g.omega *= -0.25; }
    g.thud = Math.max(0, g.thud - dt);
    for (const it of g.items) if (!it.side && g.drag?.it !== it) { it.x = lerp(it.x, it.tx, 1 - Math.exp(-dt * 12)); it.y = lerp(it.y, it.ty, 1 - Math.exp(-dt * 12)); }
    if (g.state === "play") {
      const level = tq === 0 && Math.abs(g.theta) < 0.6 * DEG && Math.abs(g.omega) < 0.05;
      const rd = round(), isolated = rd.mode !== "sameBoth" || on("left").every((i) => i.unknown);
      const acted = rd.mode === "sameBoth" ? g.removedL.length + g.removedR.length > 0 : g.items.some((i) => i.side && !i.fixed);
      g.levelT = level && isolated && acted ? g.levelT + dt : 0;
      if (g.levelT > 1.1) win();
    }
    if (g.reveal > 0 || g.state === "won") g.reveal = Math.min(1, g.reveal + dt * 1.6);
    if (g.state === "won" && g.stateT > 2.8) { g.state = "end"; g.stateT = 0; g.endA = 0; api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: 2.2 }); }
    if (g.state === "end" && g.stateT > 2.8) { if (g.r + 1 < spec.rounds.length) startRound(g.r + 1); else { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.runDone, "done"); api.done({ rounds: spec.rounds.length, level: g.results.filter((x) => x.verdict === "right").length }); } }
    if (g.state !== "final" && g.r >= 0) {
      const lsum = L.reduce((a, p) => a + p.w * p.d, 0), rsum = R.reduce((a, p) => a + p.w * p.d, 0), hide = g.items.some((i) => i.unknown && i.side) && g.state === "play";
      hud.set("round", `${g.r + 1}/${spec.rounds.length}`); hud.set("left", hide ? "?" : pans() ? `${L.reduce((a, p) => a + p.w, 0)} ${unit()}` : `${lsum}`, { tone: tq === 0 ? "mint" : null }); hud.set("right", pans() ? `${R.reduce((a, p) => a + p.w, 0)} ${unit()}` : `${rsum}`, { tone: tq === 0 ? "mint" : null });
    }
  }
  function win() {
    const rd = round(), added = { left: on("left").filter((i) => !i.fixed && rd.mode !== "sameBoth").map((i) => ({ w: i.w, d: i.d })), right: on("right").filter((i) => !i.fixed && rd.mode !== "sameBoth").map((i) => ({ w: i.w, d: i.d })) };
    const value = rd.mode === "sameBoth" ? { left: [], right: [], removedLeft: g.removedL, removedRight: g.removedR } : added;
    const grade = api.answer(`r${g.r + 1}`, value, "right");
    g.results.push({ verdict: grade.verdict }); g.state = "won"; g.stateT = 0; g.reveal = 0.01;
    api.fx.burst(PIV[0], PIV[1] - 20, { n: 36, color: C.mint, speed: 460, life: 0.8, size: 10 }); api.fx.ring(PIV[0], PIV[1], { color: C.mint, r0: 20, r1: 260, life: 0.7, width: 8 }); api.fx.pop(T.balanced, PIV[0], PIV[1] - 96, { color: C.mint, size: 54, rise: 40 });
    api.fx.flash(C.mint, 0.12); api.hitstop(60); sfx.blip({ f: 523, f2: 1046, dur: 0.22, type: "triangle", gain: 0.2 });
    api.facts({ round: g.r + 1, mode: rd.mode, verdict: grade.verdict, ...(rd.unknown ? { crate: rd.unknown.w } : {}) });
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0B0C13"); gr.addColorStop(1, "#13141D"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const v = c.createRadialGradient(500, 330, 30, 500, 330, 520); v.addColorStop(0, "rgba(255,210,122,.07)"); v.addColorStop(1, "rgba(255,210,122,0)"); c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.fillStyle = "#171A25"; roundRect(c, 120, TRAY_Y - 46, 760, 92, 22); c.fill(); c.strokeStyle = "rgba(255,255,255,.06)"; c.lineWidth = 2; c.stroke();
  }
  function drawCrate(ctx: Ctx, it: Item, x: number, y: number, rot: number) {
    const s = sizeOf(it.w), revealed = it.unknown && (g.state === "won" || g.state === "end");
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (pans() && !it.unknown) { ctx.fillStyle = "#9AA3B8"; roundRect(ctx, -s / 2, -s / 2, s, s, 6); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 2; ctx.stroke(); api.text(ctx, `${it.w}`, 0, 2, { font: "mono", size: 38, weight: 700, color: "#0B0D14", align: "center", baseline: "middle", decor: true }); ctx.restore(); return; }
    const col = it.unknown ? (revealed ? C.mint : C.sun) : it.w >= 1000 ? "#C9D0E6" : C.ion;
    bloom(ctx, col, 0, 0, s * 0.9, it.unknown ? 0.35 : 0.18);
    const gr = ctx.createLinearGradient(0, -s / 2, 0, s / 2); gr.addColorStop(0, it.unknown ? "#3A2E14" : "#232A45"); gr.addColorStop(1, it.unknown ? "#211A0B" : "#141829");
    ctx.fillStyle = gr; roundRect(ctx, -s / 2, -s / 2, s, s, 10); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();
    if (it.unknown && !revealed) { ctx.strokeStyle = "rgba(255,210,122,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-s / 2 + 8, -s / 2 + 8); ctx.lineTo(s / 2 - 8, s / 2 - 8); ctx.moveTo(s / 2 - 8, -s / 2 + 8); ctx.lineTo(-s / 2 + 8, s / 2 - 8); ctx.stroke(); }
    const lbl = it.unknown ? (revealed ? `${it.w}` : "x") : `${it.w}`;
    api.text(ctx, lbl, 0, 3, { font: "display", size: Math.max(38, Math.min(56, s * 0.55)), weight: 800, align: "center", baseline: "middle", color: it.unknown && !revealed ? C.sun : C.ink });
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // fulcrum
    ctx.fillStyle = "#262C3D"; ctx.beginPath(); ctx.moveTo(PIV[0], PIV[1] + 6); ctx.lineTo(PIV[0] - 56, PIV[1] + 128); ctx.lineTo(PIV[0] + 56, PIV[1] + 128); ctx.closePath(); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
    // level gauge arc
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(PIV[0], PIV[1], 96, Math.PI * 1.35, Math.PI * 1.65); ctx.stroke();
    const lv = Math.abs(g.theta) < 0.6 * DEG && moments().tq === 0;
    ctx.strokeStyle = lv ? C.mint : C.ink3; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PIV[0], PIV[1]); ctx.lineTo(PIV[0] + Math.sin(g.theta) * 96, PIV[1] - Math.cos(g.theta) * 96); ctx.stroke();
    // beam
    const bl = 5.6 * PEG;
    ctx.save(); ctx.translate(PIV[0], PIV[1]); ctx.rotate(g.theta);
    bloom(ctx, lv ? C.mint : C.ion, 0, 0, bl, lv ? 0.22 : 0.1);
    const gr = ctx.createLinearGradient(0, -12, 0, 12); gr.addColorStop(0, "#C9CFE0"); gr.addColorStop(1, "#6B7390");
    ctx.fillStyle = gr; roundRect(ctx, -bl, -10, bl * 2, 20, 8); ctx.fill();
    if (!pans()) for (const s of [-1, 1]) for (let d = 1; d <= 5; d++) { const x = s * d * PEG; ctx.fillStyle = "#1A1F2C"; ctx.beginPath(); ctx.arc(x, 0, 6, 0, Math.PI * 2); ctx.fill(); api.text(ctx, `${d}`, x, 46, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", decor: true }); }
    ctx.fillStyle = "#2F3547"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (pans()) for (const side of ["left", "right"] as Side[]) { const [hx, hy] = beamPt(side, 4); ctx.strokeStyle = C.ink3; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - 60, hy + 150); ctx.moveTo(hx, hy); ctx.lineTo(hx + 60, hy + 150); ctx.stroke(); ctx.fillStyle = "#3A4157"; roundRect(ctx, hx - 80, hy + 150, 160, 14, 6); ctx.fill(); }
    // hover target
    if (g.drag && g.hover) { const [hx, hy] = beamPt(g.hover.side, g.hover.d, pans() ? -110 : 30); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, pans() ? hy + 260 : hy, 36, 0, Math.PI * 2); ctx.stroke(); }
    for (const it of g.items) if (it.side && g.drag?.it !== it) { const [x, y] = posOf(it); drawCrate(ctx, it, x, y, pans() ? 0 : g.theta); }
    for (const it of g.items) if (!it.side && g.drag?.it !== it) drawCrate(ctx, it, it.x, it.y, 0);
    if (g.drag) drawCrate(ctx, g.drag.it, g.drag.it.x, g.drag.it.y, 0);
    // equation strip on win
    if ((g.state === "won" || g.state === "end") && g.reveal > 0) {
      const rd = round(), { L, R } = moments();
      let eq = "";
      if (rd.mode === "unknown" && rd.unknown) eq = `x × ${rd.unknown.d} = ${R.map((p) => `${p.w}×${p.d}`).join(" + ") || "0"}  →  x = ${rd.unknown.w}`;
      else if (rd.mode === "sameBoth" && rd.unknown) eq = `${rd.unknown.n}x = ${R.reduce((a, p) => a + p.w, 0)}  →  x = ${rd.unknown.w}`;
      else if (rd.mode === "pans") eq = `${R.map((p) => p.w).join(" + ")} = 1000 ${T.g} = 1 ${T.kg}`;
      else eq = `${L.map((p) => `${p.w}×${p.d}`).join(" + ")} = ${R.map((p) => `${p.w}×${p.d}`).join(" + ")}`;
      ctx.save(); ctx.globalAlpha = g.reveal; pill(api, ctx, eq, 500, 150, { color: C.mint }); ctx.restore();
    }
    fx.drawWorld(ctx); ctx.restore();
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.round} ${g.r + 1} / ${spec.rounds.length}`, title: round().title, sub: round().sub, accent: C.sun });
    if (g.state === "end") drawStatCard(api, ctx, { a: g.endA, head: `${T.round} ${g.r + 1} · ${T.balanced}`, ticked: true, stats: [[round().unknown ? `${round().unknown!.w} ${unit()}` : "level", round().unknown ? T.reveal : "beam"]] });
    if (g.state === "final") drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.results.length}/${spec.rounds.length}`, "level"]] });
    drawCoach(api, ctx, round()?.mode === "sameBoth" ? T.sameBoth : T.coach, g.state === "play" ? g.coachA : 0, now, 612);
  }
  // QA bot: search a placement that balances; for sameBoth remove 1-pairs
  function bot(): BotAction | null {
    if (g.state !== "play" || g.drag) return { type: "wait", ms: 250 };
    const rd = round();
    if (rd.mode === "sameBoth") {
      const l = on("left").find((i) => !i.unknown), r = on("right").find((i) => !i.unknown && i.w === l?.w && i.d === l?.d);
      if (!l) return { type: "wait", ms: 400 };
      const nl = on("left").filter((i) => !i.unknown).length, nr = on("right").filter((i) => !i.unknown && i.w === l.w).length;
      const pick = nl >= nr ? l : r ?? l;
      return { type: "drag", from: posOf(pick), to: [pick.side === "left" ? 140 : 860, 470], ms: 500, after: 700 };
    }
    const { tq } = moments();
    if (tq === 0 && g.items.some((i) => i.side && !i.fixed)) return { type: "wait", ms: 300 };
    const free = g.items.filter((i) => !i.side && !i.fixed);
    const ds = pans() ? [4] : [1, 2, 3, 4, 5];
    // try single placements, then pairs, of free weights to cancel the torque
    for (const it of free) for (const side of ["left", "right"] as Side[]) for (const d of ds) { const s = side === "right" ? 1 : -1; if (tq + s * it.w * d === 0) return { type: "drag", from: [it.x, it.y], to: beamPt(side, d, pans() ? -110 : 30), ms: 600, after: 900 }; }
    for (const a of free) for (const b of free) { if (a === b) continue; for (const sa of [-1, 1]) for (const da of ds) for (const sb of [-1, 1]) for (const db of ds) if (tq + sa * a.w * da + sb * b.w * db === 0) return { type: "drag", from: [a.x, a.y], to: beamPt(sa > 0 ? "right" : "left", da, pans() ? -110 : 30), ms: 600, after: 700 }; }
    for (const a of free) for (const b of free) for (const c of free) { if (a === b || b === c || a === c) continue; if (tq + a.w * 4 * (tq < 0 ? 1 : -1) + b.w * 4 * (tq < 0 ? 1 : -1) + c.w * 4 * (tq < 0 ? 1 : -1) === 0) return { type: "drag", from: [a.x, a.y], to: beamPt(tq < 0 ? "right" : "left", 4, pans() ? -110 : 30), ms: 600, after: 700 }; }
    const placed = g.items.find((i) => i.side && !i.fixed);
    if (placed) return { type: "drag", from: posOf(placed), to: [placed.tx || 500, TRAY_Y], ms: 500, after: 500 };
    return free[0] ? { type: "drag", from: [free[0].x, free[0].y], to: beamPt(tq < 0 ? "right" : "left", pans() ? 4 : 2, pans() ? -110 : 30), ms: 600, after: 700 } : { type: "wait", ms: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, round: g.r + 1, theta: +(g.theta / DEG).toFixed(2), torque: moments().tq, items: g.items.map((i) => ({ w: i.w, side: i.side, d: i.d, fixed: i.fixed })) }),
    knob(k) { if (k === "again") { g.results = []; startRound(0); return true; } return false; },
    board: () => { const rd = round(); return { title: rd.mode === "pans" ? "1 kg = 1000 g" : rd.mode === "sameBoth" ? "Same off both sides" : "Weight × distance", lines: rd.mode === "pans" ? ["A kilogram balances a thousand grams."] : ["The beam is level when both sides turn equally.", "Do the same to both sides and it stays level."], figure: { kind: "beam", left: rd.unknown ? "x" : rd.left.map((p) => `${p.w}×${p.d}`).join("+") || "?", right: rd.right.map((p) => `${p.w}×${p.d}`).join("+") || "?" }, accent: C.sun }; },
  };
}
export const beam: EngineDef<BeamSpec> = { archetype: "balance-beam@1", label: "Game · Tilt", accent: C.sun, create };
