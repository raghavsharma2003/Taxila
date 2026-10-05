// SIEVE STORM — `sieve-storm@1` (VALUES-100 V3.1: number properties). Number crystals rain down five columns. Swipe
// (or tap) to slash every number that fits the rule; let the rest fall into the vault. Each crystal is graded once,
// by the host, at the moment it is slashed or lands. A slashed composite splits into its factor pair; a wrong cut or
// a slipped number flashes its proof (2 × 7 · ÷3 leaves 1 · HCF = 1). Adaptive: a slip slows the storm 10%, a combo of
// 5 speeds it 6%. Reduced motion: no shards, no shake.
import { fits, proof, sieveStream, type SieveSpec, type SvRoundT } from "../../../../shared/studio-spec-ext/sieve.ts";
import { factorsOf } from "../../../../shared/studio-spec-ext/common.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { bloom, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { taskPill, RoundFlow, backdrop, devaReady } from "./kit.ts";

const COLS = [250, 380, 510, 640, 770], R = 46, VAULT = 556, TOP = 168;
interface Cr { i: number; n: number; x: number; y: number; v: number; state: "fall" | "cut" | "vault"; t: number; ok?: boolean; proof?: string }
interface Piece { s: string; x: number; y: number; vx: number; vy: number; t: number; col: string }

function create(api: EngineApi, spec: SieveSpec): EngineInstance {
  const T = spec.strings, accent = C.ion;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec.strings))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 109 + 1);
  const g = { stream: [] as number[], next: 0, spawnT: 0, crs: [] as Cr[], pieces: [] as Piece[], last: null as null | { x: number; y: number }, right: 0, n: 0, combo: 0, best: 0, roundR: 0, roundN: 0, speedK: 1, coachA: 1, coachGone: false, trail: [] as { x: number; y: number; t: number }[] };
  const task = taskPill(api);
  const hud = api.hud([{ key: "round", label: T.round }, { key: "calls", label: T.slashed }, { key: "combo", label: T.combo }]);
  const rd = (): SvRoundT => spec.rounds[Math.max(0, flow.round)];
  const ruleText = (r: SvRoundT) => r.rule === "multiple" ? `${T.multipleOf} ${r.a}` : r.rule === "common" ? `${T.commonOf} ${r.a} ${T.and} ${r.b}` : r.rule === "factor" ? `${T.factorOf} ${r.a}` : r.rule === "cfactor" ? `${T.cfactorOf} ${r.a} ${T.and} ${r.b}` : r.rule === "divisible" ? `${T.divisibleBy} ${r.a}` : r.rule === "coprime" ? `${T.coprimeWith} ${r.a}` : (T as Record<string, string>)[r.rule] ?? r.rule;
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { const r = spec.rounds[k]; g.stream = sieveStream(r); g.next = 0; g.spawnT = 0.4; g.crs = []; g.speedK = r.speed; g.roundR = 0; g.roundN = 0; api.event("round_start", { round: k + 1, rule: r.rule, a: r.a ?? null, b: r.b ?? null }); sfx.blip({ f: 220, f2: 440, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1, right: g.roundR, of: g.roundN }); },
    onFinal() { task("", T.runDone, "done"); api.done({ right: g.right, of: g.n, bestCombo: g.best }); },
  });
  function grade(c: Cr, act: "slash" | "pass") {
    const r = rd(), want = fits(r, c.n) ? "slash" : "pass";
    const gr = api.answer(`r${flow.round + 1}:${c.i}`, act, act === want ? "right" : "wrong");
    const ok = gr.verdict === "right"; c.ok = ok; c.proof = proof(r, c.n); c.t = 0;
    g.n++; g.roundN++;
    if (ok) { g.right++; g.roundR++; g.combo++; g.best = Math.max(g.best, g.combo); if (g.combo % 5 === 0) { g.speedK = Math.min(1.5, g.speedK * 1.06); api.event("adapt", { speed: +g.speedK.toFixed(2), why: "combo" }); } }
    else { g.combo = 0; g.speedK = Math.max(0.55, g.speedK * 0.9); api.event("adapt", { speed: +g.speedK.toFixed(2), why: act === "pass" ? "slipped" : "wrong-cut" }); }
    if (act === "slash") {
      c.state = "cut";
      if (ok) {
        const f = factorsOf(c.n).filter((d) => d > 1 && d < c.n), a = f.length ? f[Math.floor(f.length / 2)] : null;
        const parts = (r.rule === "composite" || r.rule === "prime") && a ? [String(a), String(c.n / a)] : [String(c.n)];
        if (!api.reducedMotion) parts.forEach((s, j) => g.pieces.push({ s, x: c.x + (j ? 20 : -20), y: c.y, vx: (j ? 1 : -1) * (120 + api.rnd() * 60), vy: -220, t: 0, col: C.mint }));
        api.fx.burst(c.x, c.y, { n: 22, color: C.mint, speed: 380, life: 0.5, size: 9, shard: true, gravity: 600 });
        sfx.blip({ f: 600 * Math.pow(1.04, Math.min(10, g.combo)), f2: 1200, dur: 0.12, type: "triangle", gain: 0.16 }); if (g.combo > 3) api.hitstop(25);
      } else { api.fx.burst(c.x, c.y, { n: 12, color: C.amber, speed: 240, life: 0.6, size: 9, shard: true }); sfx.blip({ f: 240, f2: 150, dur: 0.2, gain: 0.15 }); api.fx.shake(4, 0.18); }
    } else { c.state = "vault"; if (ok) sfx.blip({ f: 330, dur: 0.06, type: "sine", gain: 0.06 }); else { sfx.blip({ f: 200, f2: 120, dur: 0.25, gain: 0.16 }); api.fx.shake(3, 0.15); } }
    api.facts({ number: c.n, rule: r.rule, act, verdict: gr.verdict, proof: c.proof });
  }
  function slashSeg(ax: number, ay: number, bx: number, by: number) {
    for (const c of g.crs) {
      if (c.state !== "fall") continue;
      const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = clamp(((c.x - ax) * dx + (c.y - ay) * dy) / L, 0, 1), px = ax + dx * t, py = ay + dy * t;
      if (Math.hypot(c.x - px, c.y - py) < R) grade(c, "slash");
    }
  }
  api.onPointer({
    down(p) { if (flow.state !== "play") return; if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); } g.last = { x: p.x, y: p.y }; slashSeg(p.x, p.y, p.x, p.y); g.trail.push({ x: p.x, y: p.y, t: api.now() }); },
    move(p) { if (!g.last) return; slashSeg(g.last.x, g.last.y, p.x, p.y); g.last = { x: p.x, y: p.y }; g.trail.push({ x: p.x, y: p.y, t: api.now() }); if (g.trail.length > 40) g.trail.shift(); api.record("swipe", { x: Math.round(p.x), y: Math.round(p.y) }); },
    up() { g.last = null; },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    for (const p of g.pieces) { p.t += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    g.pieces = g.pieces.filter((p) => p.t < 1.4);
    g.trail = g.trail.filter((t) => api.now() - t.t < 0.25);
    if (flow.state !== "play") return;
    task(`${T.round} ${flow.round + 1}`, ruleText(rd()));
    g.spawnT -= dt;
    if (g.next < g.stream.length && g.spawnT <= 0) {
      const r = rd(), free = COLS.filter((cx) => !g.crs.some((c) => c.state === "fall" && c.x === cx && c.y < TOP + R * 3.2));
      const pickFrom = free.length ? free : COLS, col = pickFrom[Math.floor(rng(r.seed + g.next * 13)() * pickFrom.length)];
      g.crs.push({ i: g.next, n: g.stream[g.next], x: col, y: TOP, v: 70, state: "fall", t: 0 });
      g.next++; g.spawnT = 1.25 / g.speedK;
    }
    for (const c of g.crs) {
      c.t += dt;
      if (c.state === "fall") { c.y += c.v * g.speedK * dt; if (c.y >= VAULT - R) grade(c, "pass"); }
    }
    g.crs = g.crs.filter((c) => c.state === "fall" || c.t < 1.4);
    if (g.next >= g.stream.length && g.crs.every((c) => c.state !== "fall") && g.crs.length === 0) flow.endRound();
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("calls", `${g.right}/${g.n}`, { bump: true }); hud.set("combo", String(g.combo), { tone: g.combo >= 5 ? "mint" : null });
  }
  function hex(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  function paintBg(c: Ctx) { backdrop(c, accent, 61, 70); c.fillStyle = "rgba(139,152,255,.06)"; c.fillRect(0, VAULT, W, H - VAULT); c.strokeStyle = hexA(C.ion, 0.5); c.lineWidth = 3; c.beginPath(); c.moveTo(150, VAULT); c.lineTo(870, VAULT); c.stroke(); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    for (const col of COLS) { ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(col, TOP); ctx.lineTo(col, VAULT); ctx.stroke(); }
    for (const c of g.crs) {
      if (c.state === "fall") {
        bloom(ctx, accent, c.x, c.y, R * 1.6, 0.25);
        ctx.save(); hex(ctx, c.x, c.y, R); ctx.fillStyle = "rgba(24,28,46,.96)"; ctx.fill(); ctx.strokeStyle = hexA(accent, 0.9); ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        api.text(ctx, String(c.n), c.x, c.y + 2, { font: "display", size: c.n >= 1000 ? 38 : 44, weight: 800, align: "center", baseline: "middle" });
      } else {
        const k = clamp(c.t / 1.2, 0, 1), col = c.ok ? C.mint : C.amber;
        if (c.state === "vault") { ctx.save(); ctx.globalAlpha = 1 - k; hex(ctx, c.x, VAULT - R + k * 40, R * (1 - k * 0.4)); ctx.fillStyle = hexA(col, 0.25); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
        if (!c.ok || c.state === "vault") api.text(ctx, c.ok ? String(c.n) : c.proof ?? "", c.x, (c.state === "vault" ? VAULT - R : c.y) - 64 - k * 30, { font: "mono", size: 38, weight: 600, color: col, align: "center", baseline: "middle", alpha: 1 - k * 0.8 });
      }
    }
    for (const p of g.pieces) { const a = 1 - p.t / 1.4; ctx.save(); ctx.globalAlpha = a; hex(ctx, p.x, p.y, 30); ctx.fillStyle = hexA(p.col, 0.25); ctx.fill(); ctx.strokeStyle = p.col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, p.s, p.x, p.y + 2, { font: "display", size: 38, weight: 800, color: p.col, align: "center", baseline: "middle", alpha: a, decor: true }); }
    if (g.trail.length > 1) { ctx.save(); ctx.strokeStyle = C.volt; ctx.lineCap = "round"; for (let i = 1; i < g.trail.length; i++) { const a = 1 - (api.now() - g.trail[i].t) / 0.25; ctx.globalAlpha = clamp(a, 0, 1); ctx.lineWidth = 6 * a; ctx.beginPath(); ctx.moveTo(g.trail[i - 1].x, g.trail[i - 1].y); ctx.lineTo(g.trail[i].x, g.trail[i].y); ctx.stroke(); } ctx.restore(); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: ruleText(r), accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundR}/${g.roundN}`, T.slashed], [String(g.best), T.combo]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.slashed], [String(g.best), T.combo]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play") return { type: "wait", ms: 250 };
    const r = rd(), c = g.crs.filter((x) => x.state === "fall" && x.y > 250 && x.y < VAULT - R - 30).sort((a, b) => b.y - a.y)[0];
    if (!c) return { type: "wait", ms: 200 };
    const should = fits(r, c.n) !== (botR() < 0.1);
    if (!should) return { type: "wait", ms: 250 };
    const y = c.y + c.v * g.speedK * 0.12;
    return { type: "drag", from: [c.x - 34, y - 8], to: [c.x + 34, y + 8], ms: 90, after: 120 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, rule: rd()?.rule, falling: g.crs.filter((c) => c.state === "fall").map((c) => c.n), right: g.right, n: g.n, combo: g.combo }),
    knob(k) { if (k === "slower" || k === "easier") { g.speedK = Math.max(0.5, g.speedK * 0.8); return true; } if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; } if (k === "again") { g.right = 0; g.n = 0; g.combo = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0], st = sieveStream(r0); return { title: spec.title, lines: [ruleText(r0), st.filter((n) => fits(r0, n)).slice(0, 8).join(", ")], figure: { kind: "none" }, accent }; },
  };
}
export const sieve: EngineDef<SieveSpec> = { archetype: "sieve-storm@1", label: "Game · Sieve Storm", accent: C.ion, create };
