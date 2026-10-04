// GATE RUNNER — `line-runner@1` (STUDIO-V2 §6.1 #2). Real-time timing = position: a runner sprints along a number line;
// the child taps (or presses space) to jump at the moment it passes the called number. The gate materialises at the
// number's true place only after the jump, so the line never gives the answer away. Negatives, a backwards run, and
// decimals target the kit misconceptions. The take-off value is the act; the host grades it.
import { parseNum, type RunnerSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, rng } from "../core/math.ts";
import { bloom, magnifier, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../core/types.ts";

const LY = 440, X0 = 90, X1 = 910, BASE_V = 170;
const fmt = (v: number) => { const s = Math.abs(v) < 1e-9 ? "0" : (Math.round(v * 1000) / 1000).toString(); return s.replace("-", "−"); };

function create(api: EngineApi, spec: RunnerSpec): EngineInstance {
  const T = spec.strings;
  const g = { state: "boot" as "boot" | "intro" | "run" | "reveal" | "end" | "final", r: -1, call: 0, stateT: 0, x: X0, jumpT: -1, jumpX: 0, vScale: 1, chain: 0, best: 0, missRun: 0, scaffold: 0,
    results: [] as { err: number; verdict: string; call: string }[], roundRes: [] as { verdict: string; err: number }[], introA: 0, coachA: 1, coachGone: false, bootT: 0, endA: 0, finalA: 0,
    gate: null as null | { x: number; ok: boolean; jx: number | null; t: number; verdict: string; off: string }, phase: 0, callA: 0 };
  const botRnd = rng(api.seed * 13 + 1);
  const round = () => spec.rounds[Math.max(0, g.r)];
  const span = () => round().range[1] - round().range[0];
  const xOf = (v: number) => X0 + ((v - round().range[0]) / span()) * (X1 - X0);
  const vOf = (x: number) => round().range[0] + ((x - X0) / (X1 - X0)) * span();
  const speed = () => BASE_V * round().speed * g.vScale;
  const hud = api.hud([{ key: "round", label: T.round }, { key: "chain", label: T.chain }, { key: "acc", label: T.accuracy, meter: true }]);
  const accOf = (r: { err: number }[]) => (r.length ? Math.round(100 * (r.reduce((a, b) => a + (1 - Math.min(1, b.err / 0.15)), 0) / r.length)) : 100);
  const callVal = () => parseNum(round().calls[g.call])!;
  function jump() {
    if (g.state !== "run" || g.jumpT >= 0) return;
    if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.35 }); }
    g.jumpT = 0; g.jumpX = g.x;
    sfx.blip({ f: 330, f2: 660, dur: 0.14, type: "triangle", gain: 0.14 });
    resolve(g.x);
  }
  api.onPointer({ down() { jump(); } });
  api.onKey((k, down) => { if (down && (k === " " || k === "ArrowUp" || k === "Enter")) jump(); });
  function startRound(i: number) {
    g.r = i; g.call = 0; g.state = "intro"; g.stateT = 0; g.introA = 0; g.roundRes = [];
    api.tw.add(g, { introA: 1 }, { dur: 0.45 });
    sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    api.event("round_start", { round: i + 1, title: round().title, targets: round().targets ?? null });
  }
  function startRun() {
    g.state = "run"; g.stateT = 0; g.jumpT = -1; g.gate = null; g.x = round().dir === 1 ? X0 - 40 : X1 + 40; g.callA = 0;
    api.tw.add(g, { callA: 1 }, { dur: 0.35, ease: "outBack" });
  }
  function resolve(jx: number | null) {
    const truth = callVal(), tx = xOf(truth);
    const value = jx == null ? null : +vOf(jx).toFixed(4);
    const err = value == null ? 1 : Math.abs(value - truth) / span();
    const local = value == null ? "wrong" : err <= 0.025 ? "right" : err <= 0.05 ? "partial" : "wrong";
    const grade = api.answer(`r${g.r + 1}:${g.call}`, value, local);
    const ok = grade.verdict === "right";
    g.results.push({ err, verdict: grade.verdict, call: round().calls[g.call] }); g.roundRes.push({ err, verdict: grade.verdict });
    g.gate = { x: tx, ok, jx, t: 0, verdict: grade.verdict, off: value == null ? "" : fmt(Math.abs(value - truth)) };
    if (ok) {
      g.chain++; g.best = Math.max(g.best, g.chain); g.missRun = 0;
      api.fx.burst(tx, LY - 70, { n: 26, color: C.mint, speed: 420, life: 0.6, size: 10, angle: -Math.PI / 2, spread: Math.PI });
      api.fx.ring(tx, LY - 60, { color: C.mint, r0: 10, r1: 120, life: 0.5, width: 7 }); api.fx.pop(T.through, tx, LY - 200, { color: C.mint, size: 48 });
      api.fx.flash(C.mint, 0.1); api.hitstop(50);
      sfx.blip({ f: 523 * Math.pow(2, Math.min(g.chain, 12) / 12), f2: 784 * Math.pow(2, Math.min(g.chain, 12) / 12), dur: 0.16, type: "triangle", gain: 0.2 });
      if (g.chain % 3 === 0) { g.vScale = Math.min(1.35, g.vScale * 1.07); api.event("adapt", { dir: "harder", vScale: +g.vScale.toFixed(2) }); }
    } else {
      g.chain = 0; g.missRun++;
      api.fx.burst(tx, LY - 40, { n: 12, color: C.amber, speed: 300, life: 0.9, size: 11, gravity: 900, shard: true, floor: LY - 2, angle: -Math.PI / 2, spread: Math.PI });
      api.fx.shake(3, 0.18); sfx.blip({ f: 190, f2: 100, dur: 0.22, gain: 0.22 });
      if (g.missRun >= 2) { g.vScale = Math.max(0.65, g.vScale * 0.86); g.scaffold = 3; g.missRun = 0; api.event("adapt", { dir: "easier", vScale: +g.vScale.toFixed(2), scaffold: true }); }
    }
    api.facts({ round: g.r + 1, call: round().calls[g.call], verdict: grade.verdict, accuracy: accOf(g.results) });
  }
  function update(dt: number) {
    g.stateT += dt; g.phase += dt * speed() / 22;
    if (g.state === "boot") { g.bootT += dt; if (g.bootT > 0.45) { hud.show(true); startRound(0); } return; }
    if (g.state === "intro" && g.stateT > 1.8) { api.tw.add(g, { introA: 0 }, { dur: 0.35, ease: "inCubic" }); startRun(); }
    if (g.state === "run" || g.state === "reveal") {
      g.x += round().dir * speed() * dt;
      if (g.jumpT >= 0) g.jumpT += dt;
      if (g.state === "run" && g.jumpT < 0 && ((round().dir === 1 && g.x > X1 + 10) || (round().dir === -1 && g.x < X0 - 10))) resolve(null);
      if (g.gate) { g.gate.t += dt; if (g.state === "run") { g.state = "reveal"; g.stateT = 0; } }
      if (g.state === "reveal" && g.stateT > 1.5 && (g.x > X1 + 60 || g.x < X0 - 60 || g.stateT > 2.6)) {
        if (g.scaffold > 0) g.scaffold--;
        g.call++;
        if (g.call < round().calls.length) startRun();
        else { g.state = "end"; g.stateT = 0; g.endA = 0; api.tw.add(g, { endA: 1 }, { dur: 0.45 }); api.tw.add(g, { endA: 0 }, { dur: 0.35, delay: 2.5 }); api.event("round_end", { round: g.r + 1, accuracy: accOf(g.roundRes) }); }
      }
    }
    if (g.state === "end" && g.stateT > 3.1) { if (g.r + 1 < spec.rounds.length) startRound(g.r + 1); else { g.state = "final"; g.finalA = 0; api.tw.add(g, { finalA: 1 }, { dur: 0.6 }); api.done({ gates: g.results.length, through: g.results.filter((x) => x.verdict === "right").length, accuracy: accOf(g.results) }); } }
    if (g.state !== "final" && g.r >= 0) {
      hud.set("round", `${g.r + 1}/${spec.rounds.length}`);
      hud.set("chain", `×${g.chain}`, { bump: true, tone: g.chain >= 3 ? "ion" : null });
      const a = g.results.length ? accOf(g.results) : null; hud.set("acc", a == null ? "—" : `${a}%`, { meter: a == null ? 0 : a / 100, tone: a != null && a >= 85 ? "mint" : null });
    }
  }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#090B12"); gr.addColorStop(0.68, "#121732"); gr.addColorStop(1, "#0A0C14");
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    const r2 = rng(5); c.fillStyle = "#0C0F1D";
    for (let x = -20; x < W + 20;) { const w = 40 + r2() * 80, h = 40 + r2() * 120; c.fillRect(x, LY - 40 - h, w, h + 40); x += w + 4; }
    c.fillStyle = "rgba(139,152,255,.06)"; for (let i = 0; i < 60; i++) c.fillRect(r2() * W, LY - 160 + r2() * 110, 3, 4);
    c.fillStyle = "#0B0D16"; c.fillRect(0, LY, W, H - LY);
  }
  function drawRunner(ctx: Ctx, x: number, y: number, dir: number) {
    const ph = g.phase, air = g.jumpT >= 0 && g.jumpT < 0.62, lift = air ? Math.sin((g.jumpT / 0.62) * Math.PI) * 120 : 0;
    ctx.save(); ctx.translate(x, y - lift); ctx.scale(dir, 1);
    bloom(ctx, C.ion, 0, -60, 90, 0.35);
    ctx.strokeStyle = C.ink; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 9;
    const legA = air ? 0.9 : Math.sin(ph) * 0.9, legB = air ? -0.4 : Math.sin(ph + Math.PI) * 0.9;
    const hip = { x: 0, y: -52 }, sh = { x: 10, y: -104 };
    const limb = (ox: number, oy: number, a1: number, a2: number, l1: number, l2: number) => { const kx = ox + Math.sin(a1) * l1, ky = oy + Math.cos(a1) * l1; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(kx, ky); ctx.lineTo(kx + Math.sin(a1 + a2) * l2, ky + Math.cos(a1 + a2) * l2); ctx.stroke(); };
    ctx.strokeStyle = "rgba(242,244,248,.55)"; limb(hip.x, hip.y, legB, -0.9 - Math.max(0, -legB), 28, 28); limb(sh.x, sh.y, -legB * 0.9, 1.4, 24, 22);
    ctx.strokeStyle = C.ink; limb(hip.x, hip.y, legA, -0.9 - Math.max(0, -legA), 28, 28);
    ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(sh.x, sh.y); ctx.stroke();
    limb(sh.x, sh.y, legA * 0.9, 1.4, 24, 22);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(16, -124, 14, 0, Math.PI * 2); ctx.fill();
    if (!api.reducedMotion) { ctx.strokeStyle = "rgba(139,152,255,.5)"; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-30 - i * 22, -70 - i * 14); ctx.lineTo(-70 - i * 30, -70 - i * 14); ctx.stroke(); } }
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx;
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    ctx.strokeStyle = "rgba(139,152,255,.12)"; ctx.lineWidth = 1.5;
    const sc = api.reducedMotion ? 0 : (g.phase * 0.25) % 1;
    for (let j = 0; j < 7; j++) { const z = (j + sc) / 7, y = LY + Math.pow(z, 2) * (H - LY); ctx.globalAlpha = 0.2 + 0.8 * z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (g.r >= 0) {
      const rd = round(), stepN = Math.round(span() / rd.step), labels = g.scaffold > 0 ? "all" : rd.labels;
      bloom(ctx, C.ion, 500, LY, 460, 0.18);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(X0, LY); ctx.lineTo(X1, LY); ctx.stroke();
      const every = stepN > 12 ? 2 : 1;
      for (let k = 0; k <= stepN; k++) {
        const v = rd.range[0] + k * rd.step, x = xOf(v), end = k === 0 || k === stepN, zero = Math.abs(v) < 1e-9;
        ctx.strokeStyle = end || zero ? C.ink : C.ink3; ctx.lineWidth = end || zero ? 6 : 4;
        ctx.beginPath(); ctx.moveTo(x, LY - (end || zero ? 20 : 12)); ctx.lineTo(x, LY + (end || zero ? 20 : 12)); ctx.stroke();
        const show = labels === "all" ? k % every === 0 || end : labels === "ends" ? end : zero || end;
        if (show) api.text(ctx, fmt(v), x, LY + 62, { font: "mono", size: stepN > 16 ? 38 : 40, weight: 600, color: zero ? C.ink : C.ink2, align: "center" });
      }
    }
    if (g.gate) {
      const gt = g.gate, a = Math.min(1, gt.t / 0.18), col = gt.ok ? C.mint : C.amber;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = gt.ok ? C.mint : C.ion; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(gt.x - 34, LY); ctx.lineTo(gt.x - 34, LY - 150); ctx.arc(gt.x, LY - 150, 34, Math.PI, 0); ctx.lineTo(gt.x + 34, LY); ctx.stroke();
      bloom(ctx, gt.ok ? C.mint : C.ion, gt.x, LY - 100, 120, 0.35);
      pill(api, ctx, fmt(callVal()), gt.x, LY - 220, { color: gt.ok ? C.mint : C.ion });
      if (!gt.ok && gt.jx != null) {
        const yb = LY + 104; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(gt.jx, yb); ctx.lineTo(gt.x, yb); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(gt.jx, yb - 10); ctx.lineTo(gt.jx, yb + 10); ctx.moveTo(gt.x, yb - 10); ctx.lineTo(gt.x, yb + 10); ctx.stroke();
        magnifier(ctx, gt.x + (gt.x > gt.jx ? 34 : -34), LY - 40, C.amber);
        api.text(ctx, `${T.offBy} ${gt.off}`, clamp((gt.x + gt.jx) / 2, 200, 800), yb + 44, { font: "mono", size: 38, weight: 500, color: C.amber, align: "center", baseline: "middle" });
      } else if (gt.ok) tick(ctx, gt.x + 56, LY - 180);
      ctx.restore();
    }
    if (g.state === "run" || g.state === "reveal") drawRunner(ctx, g.x, LY - 6, round().dir);
    if (g.jumpT >= 0 && g.jumpT < 1.2) { ctx.save(); ctx.globalAlpha = 1 - g.jumpT / 1.2; ctx.strokeStyle = C.volt; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(g.jumpX, LY - 26); ctx.lineTo(g.jumpX, LY + 26); ctx.stroke(); ctx.restore(); }
    fx.drawWorld(ctx);
    ctx.restore();
    if ((g.state === "run" || g.state === "reveal") && g.r >= 0) {
      ctx.save(); ctx.globalAlpha = g.callA;
      api.text(ctx, T.jumpAt, 500, 150, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 6 });
      api.text(ctx, fmt(callVal()), 500, 225, { font: "display", size: 104, weight: 800, align: "center", baseline: "middle", glow: C.ion });
      ctx.restore();
    }
    if (g.state === "intro" || g.introA > 0.01) drawIntro(api, ctx, { a: g.introA, t: g.stateT, kicker: `${T.round} ${g.r + 1} / ${spec.rounds.length}`, title: round().title, sub: round().sub });
    if (g.state === "end") drawStatCard(api, ctx, { a: g.endA, head: `${T.round} ${g.r + 1}`, ticked: true, stats: [[`${g.roundRes.filter((r) => r.verdict === "right").length}/${g.roundRes.length}`, T.gates], [`${accOf(g.roundRes)}%`, T.accuracy], [`×${g.best}`, T.chain]] });
    if (g.state === "final") { const worst = [...g.results].sort((a, b) => b.err - a.err)[0]; drawStatCard(api, ctx, { a: g.finalA, head: T.runDone, color: C.ion, stats: [[`${g.results.filter((r) => r.verdict === "right").length}/${g.results.length}`, T.gates], [`${accOf(g.results)}%`, T.accuracy], [`×${g.best}`, T.chain]], foot: worst && worst.err > 0.025 ? `toughest: ${worst.call.replace("-", "−")}` : undefined }); }
    drawCoach(api, ctx, T.coach, g.state === "run" ? g.coachA : 0, now, 590);
  }
  function bot(): BotAction | null {
    if (g.state !== "run" || g.jumpT >= 0) return { type: "wait", ms: 120 };
    const tx = xOf(callVal()) + (botRnd() + botRnd() - 1) * 16;
    const dt = ((tx - g.x) * round().dir) / speed();
    if (dt > 0.14) return { type: "wait", ms: Math.min(400, (dt - 0.1) * 1000) };
    return { type: "key", key: " ", after: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: g.state, round: g.r + 1, call: g.r >= 0 ? round().calls[g.call] : null, x: g.x, v: speed(), results: g.results.length }),
    knob(k) {
      if (k === "slower" || k === "easier") { g.vScale = Math.max(0.65, g.vScale * 0.86); g.scaffold = 3; return true; }
      if (k === "harder" || k === "faster") { g.vScale = Math.min(1.35, g.vScale * 1.08); return true; }
      if (k === "again") { g.results = []; g.chain = 0; startRound(0); return true; }
      return false;
    },
    board: () => { const rd = round(); const marks = rd.calls.slice(0, 4).map((c) => ({ v: parseNum(c)!, label: c.replace("-", "−") })); return { title: rd.title, lines: ["Further right means bigger, even below zero.", "−7 is colder than −2: it sits further left."], figure: { kind: "numberline", min: rd.range[0], max: rd.range[1], marks }, accent: C.ion }; },
  };
}
export const runner: EngineDef<RunnerSpec> = { archetype: "line-runner@1", label: "Game · Gate Runner", accent: C.ion, create };
