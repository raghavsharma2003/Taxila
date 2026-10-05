// PLOT — `area-claim@1` (STUDIO-V2 §6.1 #9 + #10). Real-time strategy on a grid: drift creeps in from the edges and
// eats free cells, so plots must be staked fast. Drag out a rectangle: live readouts show area and perimeter. Rounds
// ask for an exact area, an exact perimeter, the same again in a new shape, and the most area a perimeter can hold.
// The rectangle (w, h) is the act; the host grades it. Same-perimeter shapes are laid side by side after the round.
import { maxAreaForPerimeter, type AreaSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, rng } from "../core/math.ts";
import { bloom, roundRect, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const AREA = { x: 60, y: 168, w: 880, h: 420 };
interface Rect { c: number; r: number; w: number; h: number }

function create(api: EngineApi, spec: AreaSpec): EngineInstance {
  const T = spec.strings, { cols, rows } = spec.grid;
  const s = Math.floor(Math.min(AREA.w / cols, AREA.h / rows)), gx = AREA.x + (AREA.w - s * cols) / 2, gy = AREA.y + (AREA.h - s * rows) / 2;
  const g = { state: "boot" as "boot" | "intro" | "play" | "won" | "lost" | "end" | "final", r: -1, stateT: 0, t: 0, drag: null as null | { a: XY; b: XY }, claimed: null as null | (Rect & { t: number }),
    flash: null as null | { rect: Rect; t: number; text: string }, prev: [] as { w: number; h: number }[], results: [] as { r: number; verdict: string; attempts: number; w: number; h: number }[], attempts: 0,
    introA: 0, coachA: 1, coachGone: false, bootT: 0, endA: 0, finalA: 0, compare: null as null | { shapes: { w: number; h: number }[]; per: number } };
  const driftAt = new Float32Array(cols * rows);
  const sprouts: { x: number; y: number; d: number; h: number }[] = [];
  const botRnd = rng(api.seed * 11 + 9);
  const round = () => spec.rounds[Math.max(0, g.r)];
  const hud = api.hud([{ key: "area", label: T.area }, { key: "per", label: T.perimeter }, { key: "plot", label: T.round }]);
  const cellAt = (x: number, y: number): XY => [clamp(Math.floor((x - gx) / s), 0, cols - 1), clamp(Math.floor((y - gy) / s), 0, rows - 1)];
  const rectOf = (a: XY, b: XY): Rect => ({ c: Math.min(a[0], b[0]), r: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]) + 1, h: Math.abs(a[1] - b[1]) + 1 });
  const drifted = (c: number, r: number) => spec.drift > 0 && g.t >= driftAt[r * cols + c];
  const overlapsDrift = (q: Rect) => { for (let r = q.r; r < q.r + q.h; r++) for (let c = q.c; c < q.c + q.w; c++) if (drifted(c, r)) return true; return false; };
  function seedDrift() {
    const rr = rng(api.seed * 101 + g.r * 7), dmax = Math.min(cols, rows) / 2, sec = round().seconds;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const d = Math.min(c, r, cols - 1 - c, rows - 1 - r); driftAt[r * cols + c] = spec.drift > 0 ? sec * clamp((0.14 + 0.86 * (d / dmax)) / (0.6 + 0.6 * spec.drift) + (rr() - 0.5) * 0.08, 0.08, 1.2) : 1e9; }
  }
  const goalText = () => { const rd = round(); return rd.goal === "area" ? `Stake exactly ${rd.target} ${T.sq} ${T.units}` : rd.goal === "perimeter" ? `Perimeter exactly ${rd.target} ${T.units}` : `${T.maxArea} perimeter ${rd.target}`; };
  function startRound(i: number) {
    g.r = i; g.state = "intro"; g.stateT = 0; g.t = 0; g.introA = 0; g.attempts = 0; g.claimed = null; g.flash = null; sprouts.length = 0;
    seedDrift(); api.tw.add(g, { introA: 1 }, { dur: 0.45 });
    api.task(`${T.round} ${i + 1}/${spec.rounds.length}`, goalText() + (round().different ? ` · ${T.newShape}` : ""));
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("round_start", { round: i + 1, goal: round().goal, target: round().target, targets: round().targets ?? null });
  }
  api.onPointer({
    down(p) { if (g.state !== "play") return; if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); } const a = cellAt(p.x, p.y); g.drag = { a, b: a }; sfx.blip({ f: 700, dur: 0.04, type: "square", gain: 0.05 }); },
    move(p) { if (!g.drag) return; const b = cellAt(p.x, p.y); if (b[0] !== g.drag.b[0] || b[1] !== g.drag.b[1]) { g.drag.b = b; sfx.blip({ f: 900 + (Math.abs(b[0] - g.drag.a[0]) + Math.abs(b[1] - g.drag.a[1])) * 40, dur: 0.03, type: "sine", gain: 0.04 }); } },
    up() { if (!g.drag) return; const q = rectOf(g.drag.a, g.drag.b); g.drag = null; claim(q); },
  });
  function claim(q: Rect) {
    if (g.state !== "play") return;
    if (overlapsDrift(q)) { g.flash = { rect: q, t: 0, text: "drift there" }; sfx.noise({ dur: 0.12, f: 400, gain: 0.1 }); return; }
    const rd = round();
    if (rd.different && g.prev.length) { const p = g.prev[g.prev.length - 1]; if ((p.w === q.w && p.h === q.h) || (p.w === q.h && p.h === q.w)) { g.flash = { rect: q, t: 0, text: T.newShape }; sfx.noise({ dur: 0.12, f: 400, gain: 0.1 }); return; } }
    g.attempts++;
    const area = q.w * q.h, per = 2 * (q.w + q.h);
    const local = rd.goal === "area" ? (area === rd.target ? "right" : "wrong") : rd.goal === "perimeter" ? (per === rd.target ? "right" : "wrong") : per === rd.target ? (area === maxAreaForPerimeter(rd.target) ? "right" : "partial") : "wrong";
    const grade = api.answer(`r${g.r + 1}`, { w: q.w, h: q.h }, local);
    if (grade.verdict === "right") {
      g.claimed = { ...q, t: 0 }; g.state = "won"; g.stateT = 0;
      g.results.push({ r: g.r, verdict: "right", attempts: g.attempts, w: q.w, h: q.h }); g.prev.push({ w: q.w, h: q.h });
      for (let r = q.r; r < q.r + q.h; r++) for (let c = q.c; c < q.c + q.w; c++) sprouts.push({ x: gx + (c + 0.5) * s, y: gy + (r + 0.8) * s, d: (Math.abs(c - q.c) + Math.abs(r - q.r)) * 0.04, h: 0.5 + api.rnd() * 0.5 });
      const cx = gx + (q.c + q.w / 2) * s, cy = gy + (q.r + q.h / 2) * s;
      api.fx.burst(cx, cy, { n: 30, color: C.mint, speed: 420, life: 0.7, size: 10 }); api.fx.ring(cx, cy, { color: C.mint, r0: 20, r1: 220, life: 0.6, width: 8 }); api.fx.pop(T.claim, cx, cy - 40, { color: C.mint, size: 52 });
      api.fx.flash(C.mint, 0.12); api.hitstop(60); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.2 }); setTimeout(() => sfx.blip({ f: 784, f2: 1568, dur: 0.22, type: "triangle", gain: 0.14 }), 120);
    } else {
      const need = rd.goal === "area" ? `${T.area} ${area} · ${T.need} ${rd.target}` : rd.goal === "perimeter" ? `${T.perimeter} ${per} · ${T.need} ${rd.target}` : per === rd.target ? `${T.area} ${area}: more fits inside ${rd.target}` : `${T.perimeter} ${per} · ${T.need} ${rd.target}`;
      g.flash = { rect: q, t: 0, text: need };
      sfx.blip({ f: 200, f2: 120, dur: 0.2, gain: 0.2 });
    }
    api.facts({ round: g.r + 1, goal: rd.goal, target: rd.target, last: `${q.w}x${q.h}`, area, perimeter: per, verdict: grade.verdict });
  }
  function update(dt: number) {
    g.stateT += dt;
    if (g.flash) { g.flash.t += dt; if (g.flash.t > 1.8) g.flash = null; }
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startRound(0); } return; }
    if (g.state === "intro" && g.stateT > 1.8) { g.state = "play"; g.stateT = 0; api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); }
    if (g.state === "play") {
      g.t += dt;
      if (g.t >= round().seconds) { g.state = "lost"; g.stateT = 0; g.results.push({ r: g.r, verdict: "timeout", attempts: g.attempts, w: 0, h: 0 }); api.event("timeout", { round: g.r + 1 }); sfx.blip({ f: 260, f2: 130, dur: 0.4, gain: 0.16 }); }
    }
    if (g.claimed) g.claimed.t += dt;
    if ((g.state === "won" && g.stateT > 1.9) || (g.state === "lost" && g.stateT > 1.6)) {
      const rd = round(), nxt = spec.rounds[g.r + 1];
      if (rd.goal === "perimeter" && rd.different && g.prev.length >= 2) g.compare = { shapes: g.prev.slice(-2), per: rd.target };
      g.state = "end"; g.stateT = 0; g.endA = 0; api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: g.compare ? 3.6 : 1.6 });
      void nxt;
    }
    if (g.state === "end" && g.stateT > (g.compare ? 4.2 : 2.2)) { g.compare = null; if (g.r + 1 < spec.rounds.length) startRound(g.r + 1); else { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.task("", T.runDone, "done"); api.done({ plots: g.results.filter((r) => r.verdict === "right").length, rounds: spec.rounds.length, attempts: g.results.reduce((a, b) => a + b.attempts, 0) }); } }
    const q = g.drag ? rectOf(g.drag.a, g.drag.b) : g.claimed;
    hud.set("area", q ? `${q.w * q.h}` : "—", { tone: q && round().goal === "area" && q.w * q.h === round().target ? "mint" : null });
    hud.set("per", q ? `${2 * (q.w + q.h)}` : "—", { tone: q && round().goal !== "area" && 2 * (q.w + q.h) === round().target ? "mint" : null });
    if (g.r >= 0) hud.set("plot", `${g.r + 1}/${spec.rounds.length}`);
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0A0D12"); gr.addColorStop(1, "#0F1511"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "#101712"; roundRect(c, gx - 14, gy - 14, s * cols + 28, s * rows + 28, 18); c.fill(); c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 2; c.stroke();
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) { c.fillStyle = (r + cc) % 2 ? "#16211A" : "#18241C"; c.fillRect(gx + cc * s + 1, gy + r * s + 1, s - 2, s - 2); }
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("field", paintBg), 0, 0, W, H);
    const fx = api.fx;
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    // drift: slate fog with a moving hatch, edges first
    if (spec.drift > 0 && g.r >= 0) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const t0 = driftAt[r * cols + c], k = clamp((g.t - t0) / 0.6, 0, 1), warn = clamp((g.t - (t0 - 1.2)) / 1.2, 0, 1);
        if (k <= 0 && warn <= 0) continue;
        const x = gx + c * s, y = gy + r * s;
        if (k > 0) { ctx.fillStyle = `rgba(52,60,82,${0.92 * k})`; ctx.fillRect(x + 1, y + 1, s - 2, s - 2); ctx.strokeStyle = `rgba(132,140,160,${0.35 * k})`; ctx.lineWidth = 2; ctx.beginPath(); const o = (now * 14) % 12; for (let d = -s; d < s; d += 12) { ctx.moveTo(x + d + o, y + s); ctx.lineTo(x + d + o + s, y); } ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, s - 2, s - 2); ctx.clip(); ctx.stroke(); ctx.restore(); }
        else { ctx.fillStyle = `rgba(132,140,160,${0.12 * warn})`; ctx.fillRect(x + 1, y + 1, s - 2, s - 2); }
      }
    }
    if (g.claimed) {
      const q = g.claimed, x = gx + q.c * s, y = gy + q.r * s;
      for (let r = 0; r < q.h; r++) for (let c = 0; c < q.w; c++) { const k = clamp((q.t - (c + r) * 0.04) / 0.25, 0, 1); ctx.fillStyle = `rgba(61,220,151,${0.42 * k})`; ctx.fillRect(x + c * s + 2, y + r * s + 2, s - 4, s - 4); }
      for (const sp of sprouts) {
        const k = clamp((q.t - sp.d) / 0.5, 0, 1); if (k <= 0) continue;
        const top = sp.y - s * 0.5 * k * sp.h, lf = s * 0.16 * k;
        ctx.strokeStyle = "#7BE3A9"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x, top); ctx.stroke();
        ctx.fillStyle = "#7BE3A9"; ctx.beginPath(); ctx.ellipse(sp.x - lf * 0.9, top + lf * 0.4, lf, lf * 0.45, -0.6, 0, Math.PI * 2); ctx.ellipse(sp.x + lf * 0.9, top + lf * 0.1, lf, lf * 0.45, 0.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = C.mint; ctx.lineWidth = 5; ctx.strokeRect(x, y, q.w * s, q.h * s);
      bloom(ctx, C.mint, x + (q.w * s) / 2, y + (q.h * s) / 2, Math.max(q.w, q.h) * s * 0.8, 0.25);
      pill(api, ctx, `${q.w} × ${q.h}`, x + (q.w * s) / 2, y - 30, { color: C.mint });
    }
    if (g.drag) {
      const q = rectOf(g.drag.a, g.drag.b), x = gx + q.c * s, y = gy + q.r * s, bad = overlapsDrift(q);
      ctx.fillStyle = bad ? "rgba(255,181,71,.14)" : "rgba(203,255,77,.16)"; ctx.fillRect(x, y, q.w * s, q.h * s);
      ctx.strokeStyle = bad ? C.amber : C.volt; ctx.lineWidth = 5; ctx.strokeRect(x, y, q.w * s, q.h * s);
      ctx.fillStyle = bad ? C.amber : C.volt; for (let i = 0; i < q.w; i++) ctx.fillRect(x + i * s + s / 2 - 3, y - 9, 6, 6); for (let j = 0; j < q.h; j++) ctx.fillRect(x - 9, y + j * s + s / 2 - 3, 6, 6);
      pill(api, ctx, `${q.w} × ${q.h}`, clamp(x + (q.w * s) / 2, 200, 800), clamp(y - 30, 190, 600), { color: bad ? C.amber : C.ink });
    }
    if (g.flash) {
      const q = g.flash.rect, x = gx + q.c * s, y = gy + q.r * s, a = 1 - clamp((g.flash.t - 1.2) / 0.6, 0, 1);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.amber; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.strokeRect(x, y, q.w * s, q.h * s); ctx.setLineDash([]);
      pill(api, ctx, g.flash.text, clamp(x + (q.w * s) / 2, 260, 740), clamp(y + q.h * s + 34, 200, 600), { color: C.amber });
      ctx.restore();
    }
    if (g.state === "play" || g.state === "won") {
      const k = clamp(g.t / round().seconds, 0, 1), y = gy + rows * s + 22;
      ctx.fillStyle = "rgba(255,255,255,.08)"; roundRect(ctx, gx, y, cols * s, 6, 3); ctx.fill();
      ctx.fillStyle = k > 0.8 ? C.amber : C.ink3; roundRect(ctx, gx, y, cols * s * (1 - k), 6, 3); ctx.fill();
    }
    if (g.state === "lost") pill(api, ctx, T.timeUp, 500, 380, { color: C.amber });
    fx.drawWorld(ctx);
    ctx.restore();
    if (g.compare && g.state === "end") drawCompare(ctx, g.compare, g.endA);
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.round} ${g.r + 1} / ${spec.rounds.length}`, title: round().goal === "maxArea" ? "Most area" : round().goal === "area" ? `Area ${round().target}` : `Perimeter ${round().target}`, sub: round().different ? T.newShape : goalText(), accent: C.mint });
    if (g.state === "end" && !g.compare) { const res = g.results[g.results.length - 1]; drawStatCard(api, ctx, { a: g.endA, head: res?.verdict === "right" ? `${T.round} ${g.r + 1} · ${T.claim}` : T.timeUp, color: res?.verdict === "right" ? C.mint : C.amber, ticked: res?.verdict === "right", stats: [[res && res.w ? `${res.w}×${res.h}` : "—", "shape"], [res && res.w ? `${res.w * res.h}` : "—", T.area], [`${res?.attempts ?? 0}`, "tries"]] }); }
    if (g.state === "final") drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.results.filter((r) => r.verdict === "right").length}/${spec.rounds.length}`, "plots"], [`${g.results.reduce((a, b) => a + b.attempts, 0)}`, "tries"]] });
    drawCoach(api, ctx, T.coach, g.state === "play" ? g.coachA : 0, now, 140);
  }
  function drawCompare(ctx: Ctx, c: { shapes: { w: number; h: number }[]; per: number }, a: number) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(10,12,18,.8)"; ctx.fillRect(0, 0, W, H);
    // two short lines, not one 860-unit line: the long line ran into the PiP corner (safe-zone battery, 2026-10-05)
    api.text(ctx, `SAME PERIMETER (${c.per})`, 500, 140, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", track: 3, maxWidth: 620 });
    api.text(ctx, `DIFFERENT AREA`, 500, 190, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 3, maxWidth: 620 });
    const cs = 34;
    c.shapes.forEach((sh, i) => {
      const cx = 290 + i * 420, x = cx - (sh.w * cs) / 2, y = 330 - (sh.h * cs) / 2;
      ctx.fillStyle = i ? "rgba(139,152,255,.35)" : "rgba(61,220,151,.35)"; ctx.fillRect(x, y, sh.w * cs, sh.h * cs);
      ctx.strokeStyle = i ? C.ion : C.mint; ctx.lineWidth = 5; ctx.strokeRect(x, y, sh.w * cs, sh.h * cs);
      api.text(ctx, `${sh.w} × ${sh.h}`, cx, 520, { font: "display", size: 52, weight: 800, align: "center" });
      api.text(ctx, `area ${sh.w * sh.h}`, cx, 570, { font: "mono", size: 40, weight: 600, color: i ? C.ion : C.mint, align: "center" });
    });
    ctx.restore();
  }
  function bot(): BotAction | null {
    if (g.state !== "play" || g.drag) return { type: "wait", ms: 250 };
    const rd = round(), cands: { w: number; h: number }[] = [];
    if (rd.goal === "area") { for (let w = 1; w <= cols; w++) if (rd.target % w === 0 && rd.target / w <= rows) cands.push({ w, h: rd.target / w }); }
    else { const half = rd.target / 2; for (let w = 1; w < half; w++) if (w <= cols && half - w <= rows) cands.push({ w, h: half - w }); }
    let pickC = rd.goal === "maxArea" ? [...cands].sort((a, b) => b.w * b.h - a.w * a.h)[0] : cands.sort((a, b) => Math.abs(a.w - a.h) - Math.abs(b.w - b.h))[Math.min(cands.length - 1, g.attempts === 0 ? 0 : 1)];
    if (rd.goal === "maxArea" && g.attempts === 0 && cands.length > 1 && botRnd() < 0.6) pickC = cands[0];       // a first try that isn't the best
    if (rd.different && g.prev.length) { const p = g.prev[g.prev.length - 1]; pickC = cands.find((q) => !((q.w === p.w && q.h === p.h) || (q.w === p.h && q.h === p.w))) ?? pickC; }
    if (!pickC) return { type: "wait", ms: 500 };
    const c0 = Math.floor((cols - pickC.w) / 2), r0 = Math.floor((rows - pickC.h) / 2), ctr = (c: number, r: number): XY => [gx + (c + 0.5) * s, gy + (r + 0.5) * s];
    return { type: "drag", from: ctr(c0, r0), to: ctr(c0 + pickC.w - 1, r0 + pickC.h - 1), ms: 700, after: 900 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, round: g.r + 1, t: +g.t.toFixed(1), attempts: g.attempts, results: g.results.length }),
    knob(k) {
      if (k === "slower" || k === "easier") { for (let i = 0; i < driftAt.length; i++) driftAt[i] += round().seconds * 0.25; return true; }
      if (k === "again") { g.results = []; g.prev = []; startRound(0); return true; }
      return false;
    },
    board: () => { const rd = round(); return { title: rd.goal === "area" ? `Area ${rd.target} square units` : `Perimeter ${rd.target} units`, lines: ["Area counts the squares inside.", "Perimeter walks the edge, all four sides."], figure: (() => { if (rd.goal !== "area") { const half = rd.target / 2, w = Math.ceil(half / 2); return { kind: "grid" as const, w, h: Math.max(1, half - w) }; } let w = Math.ceil(Math.sqrt(rd.target)); while (rd.target % w) w++; return { kind: "grid" as const, w, h: rd.target / w }; })(), accent: C.mint }; },
  };
}
export const area: EngineDef<AreaSpec> = { archetype: "area-claim@1", label: "Game · Plot", accent: C.mint, create };
