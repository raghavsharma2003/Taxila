// ERA DROP — `era-drop@1` (VALUES-100 V3.1: history and "when" topics). Landfall for time: an event pod falls toward
// the timeline; drag the time-dock to where it belongs before it lands. The landing spot is the answer (the host
// grades it); the pod then plants its flag at the true date and the gap is drawn ("off by 120 years"). Century rounds
// snap the dock to century boxes; order rounds drop two pods together and the child taps the one that happened first.
// Adaptive: two misses in a row slow the fall 14% and switch the scaffold ticks on; a chain of 3 speeds it 7%.
import { centuryOf, eraPairs, ordinal, type EraRoundT, type EraSpec } from "../../../../shared/studio-spec-ext/era.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, dust, fmtNum, textBlock } from "./kit.ts";

const X0 = 90, X1 = 910, LINE_Y = 470, POD_W = 360, POD_H = 112, TOP = 150, LAND = LINE_Y - 64;
interface Pod { idx: number; x: number; y: number; landed: boolean; t: number }

function create(api: EngineApi, spec: EraSpec): EngineInstance {
  const T = spec.strings, accent = "#C9A7FF";
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const { min, max } = spec.axis, span = max - min;
  const X = (v: number) => X0 + ((v - min) / span) * (X1 - X0), Vx = (x: number) => min + ((x - X0) / (X1 - X0)) * span;
  const botR = rng(api.seed * 61 + 9);
  const g = { k: 0, pods: [] as Pod[], dock: (X0 + X1) / 2, dockT: (X0 + X1) / 2, dragging: false, fall: 6.5, speedK: 1, misses: 0, chain: 0, scaffold: false,
    reveal: null as null | { idx: number; got: number; truth: number; verdict: string; t: number; pick?: number }, right: 0, n: 0, errs: [] as number[], roundR: 0, roundN: 0, coachA: 1, coachGone: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "landed", label: T.landed }, { key: "prec", label: T.precision, meter: true }]);
  const rd = (): EraRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.k = 0; g.roundR = 0; g.roundN = 0; g.speedK = spec.rounds[k].speed; g.scaffold = spec.rounds[k].ticks > 0; api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode, targets: spec.rounds[k].targets ?? null }); sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 }); spawn(); },
    onEnd(k) { api.event("round_end", { round: k + 1, right: g.roundR, of: g.roundN }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n, meanError: g.errs.length ? Math.round(g.errs.reduce((a, b) => a + b, 0) / g.errs.length) : null }); },
  });
  const units = () => (rd().mode === "order" ? eraPairs(rd()).length : rd().items.length);
  function spawn() {
    const r = rd(); g.reveal = null;
    g.pods = r.mode === "order" ? eraPairs(r)[g.k].map((idx, j) => ({ idx, x: j ? 700 : 300, y: TOP, landed: false, t: 0 })) : [{ idx: g.k, x: 500, y: TOP, landed: false, t: 0 }];
    g.fall = 6.6 / g.speedK;
    api.task(`${T.round} ${flow.round + 1}`, r.mode === "order" ? T.first : r.mode === "century" ? `${T.century}?` : T.coach);
  }
  const yearLabel = (v: number) => (v < 0 ? `${fmtNum(-v)} ${T.bce}` : min < 0 ? `${fmtNum(v)} ${T.ce}` : String(v));
  const snapCentury = (x: number) => { const c = centuryOf(Math.round(Vx(x)) || 1); const mid = c > 0 ? (c - 0.5) * 100 : -(Math.abs(c) - 0.5) * 100; return { c, x: clamp(X(mid), X0, X1) }; };
  function land() {
    const r = rd();
    if (r.mode === "order") return;   // order pods are graded on the tap (or as no-pick when they land)
    const it = r.items[g.k];
    let got: number, verdict: string;
    if (r.mode === "century") { const s = snapCentury(g.dock); got = s.c; const grade = api.answer(`r${flow.round + 1}:${g.k}`, got, got === centuryOf(it.value) ? "right" : "wrong"); verdict = grade.verdict; }
    else { got = Math.round(Vx(g.dock)); const e = Math.abs(got - it.value); const grade = api.answer(`r${flow.round + 1}:${g.k}`, got, e <= r.tol ? "right" : e <= r.tol * 2.5 ? "partial" : "wrong"); verdict = grade.verdict; g.errs.push(e); }
    after(verdict, it.value, got);
  }
  function after(verdict: string, truth: number, got: number, pick?: number) {
    g.reveal = { idx: g.k, got, truth, verdict, t: 0, pick }; g.n++; g.roundN++;
    if (verdict === "right") { g.right++; g.roundR++; g.chain++; g.misses = 0; if (g.chain % 3 === 0) { g.speedK = Math.min(1.5, g.speedK * 1.07); api.event("adapt", { speed: +g.speedK.toFixed(2), why: "chain" }); } }
    else { g.chain = 0; g.misses++; if (g.misses >= 2) { g.speedK = Math.max(0.55, g.speedK * 0.86); g.scaffold = true; g.misses = 0; api.event("adapt", { speed: +g.speedK.toFixed(2), scaffold: true, why: "misses" }); } }
    const tx = rd().mode === "order" ? X(truth) : X(rd().mode === "century" ? truth : truth);
    if (verdict === "right") { api.fx.burst(rd().mode === "order" ? g.pods.find((p) => p.idx === pick)?.x ?? 500 : g.dock, LINE_Y - 30, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.ring(g.dock, LINE_Y, { color: C.mint, r0: 10, r1: 100, life: 0.5 }); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); api.fx.shake(3, 0.15); }
    else { sfx.blip({ f: 220, f2: 130, dur: 0.24, gain: 0.16 }); void tx; }
    api.facts({ round: flow.round + 1, item: g.k + 1, verdict, truth: rd().mode === "century" ? `${ordinal(truth)} century` : yearLabel(truth), placed: rd().mode === "century" ? `${ordinal(got)} century` : yearLabel(got) });
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.reveal) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      if (rd().mode === "order") {
        const hit = g.pods.find((q) => p.x >= q.x - POD_W / 2 - 10 && p.x <= q.x + POD_W / 2 + 10 && p.y >= q.y - 20 && p.y <= q.y + POD_H + 20);
        if (hit) { const [a, b] = eraPairs(rd())[g.k], early = rd().items[a].value <= rd().items[b].value ? a : b; const grade = api.answer(`r${flow.round + 1}:${g.k}`, hit.idx, hit.idx === early ? "right" : "wrong"); after(grade.verdict, rd().items[early].value, rd().items[hit.idx].value, hit.idx); }
        return;
      }
      g.dragging = true; g.dockT = clamp(p.x, X0, X1);
    },
    move(p) { if (g.dragging) g.dockT = clamp(p.x, X0, X1); },
    up() { g.dragging = false; },
  });
  api.onKey((k, down) => { if (!down) return; if (k === "ArrowLeft") g.dockT = clamp(g.dockT - 30, X0, X1); if (k === "ArrowRight") g.dockT = clamp(g.dockT + 30, X0, X1); });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    g.dock += (g.dockT - g.dock) * Math.min(1, dt * 16);
    if (flow.state !== "play") return;
    if (!g.reveal) {
      for (const p of g.pods) { p.t += dt; p.y = TOP + (LAND - TOP) * ease.inQuad(clamp(p.t / g.fall, 0, 1)); }
      if (g.pods.length && g.pods[0].t >= g.fall) {
        if (rd().mode === "order") { const [a, b] = eraPairs(rd())[g.k], early = rd().items[a].value <= rd().items[b].value ? a : b; const grade = api.answer(`r${flow.round + 1}:${g.k}`, null, "wrong"); after(grade.verdict, rd().items[early].value, NaN, -1); }
        else land();
        sfx.noise({ dur: 0.1, f: 500, filter: "lowpass", gain: 0.18 });
      }
    } else {
      g.reveal.t += dt;
      if (g.reveal.t > (g.reveal.verdict === "right" ? 1.6 : 2.6)) { if (g.k + 1 < units()) { g.k++; spawn(); } else flow.endRound(); }
    }
    const prec = g.errs.length ? Math.round(100 * (1 - Math.min(1, g.errs.reduce((a, b) => a + b, 0) / g.errs.length / Math.max(1, span / 6)))) : null;
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("landed", `${g.right}/${g.n}`, { bump: true });
    hud.set("prec", prec == null ? "—" : `${prec}%`, { meter: prec == null ? 0 : prec / 100, tone: prec != null && prec >= 85 ? "mint" : null });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 17, 60); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    dust(ctx, now, 26, "#D9C8FF", 5);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // the timeline
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(X0, LINE_Y); ctx.lineTo(X1, LINE_Y); ctx.stroke(); ctx.restore();
    if (min < 0 && max > 0) { const zx = X(0); ctx.save(); ctx.strokeStyle = hexA(accent, 0.8); ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(zx, LINE_Y - 40); ctx.lineTo(zx, LINE_Y + 26); ctx.stroke(); ctx.restore(); }
    if (r.mode === "century") {
      const c0 = centuryOf(min || 1), c1 = centuryOf(max);
      for (let c = c0; c <= c1; c++) { if (c === 0) continue; const a = c > 0 ? (c - 1) * 100 : c * 100, b = c > 0 ? c * 100 : (c + 1) * 100, xa = X(clamp(a, min, max)), xb = X(clamp(b, min, max)); if (xb - xa < 4) continue; ctx.fillStyle = (c & 1) ? "rgba(201,167,255,.10)" : "rgba(255,255,255,.04)"; ctx.fillRect(xa, LINE_Y - 30, xb - xa, 60); if (xb - xa > 90) api.text(ctx, `${ordinal(c)}`, (xa + xb) / 2, LINE_Y + 56, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle" }); }
    }
    // end labels always; scaffold ticks when on
    api.text(ctx, yearLabel(min), X0, LINE_Y + 100, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
    api.text(ctx, yearLabel(max), X1, LINE_Y + 100, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
    if (g.scaffold && r.ticks > 0 && r.mode !== "century") {
      const first = Math.ceil(min / r.ticks) * r.ticks;
      const lab = (v: number) => yearLabel(v || 1);
      const lw = Math.max(api.measure(ctx, lab(first), { font: "mono", size: 38 }), api.measure(ctx, lab(max), { font: "mono", size: 38 })) + 20, every = Math.max(1, Math.ceil(lw / ((X(first + r.ticks) - X(first)) || 1)));
      let i = 0;
      for (let v = first; v <= max; v += r.ticks, i++) { const x = X(v); ctx.strokeStyle = hexA(accent, 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, LINE_Y - 14); ctx.lineTo(x, LINE_Y + 14); ctx.stroke(); if (i % every === 0 && Math.abs(x - X0) > lw && Math.abs(x - X1) > lw) api.text(ctx, lab(v), x, LINE_Y + 50, { font: "mono", size: 38, weight: 600, color: hexA(accent, 0.9), align: "center", baseline: "middle" }); }
    }
    // the dock
    if (r.mode !== "order") {
      const dx = r.mode === "century" ? snapCentury(g.dock).x : g.dock, col = g.dragging ? C.volt : C.ink;
      ctx.save(); bloom(ctx, col, dx, LINE_Y, 70, 0.4); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(dx - 44, LINE_Y - 30); ctx.lineTo(dx - 44, LINE_Y - 4); ctx.lineTo(dx + 44, LINE_Y - 4); ctx.lineTo(dx + 44, LINE_Y - 30); ctx.stroke(); ctx.restore();
      if (!g.reveal && g.pods[0]) { ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.moveTo(g.pods[0].x, g.pods[0].y + POD_H); ctx.lineTo(dx, LINE_Y - 34); ctx.stroke(); ctx.restore(); }
    }
    // pods
    for (const p of g.pods) {
      const it = r.items[p.idx], rv = g.reveal;
      const tone = !rv ? hexA(accent, 0.9) : r.mode === "order" ? (p.idx === rv.pick ? (rv.verdict === "right" ? C.mint : C.amber) : C.line2) : rv.verdict === "right" ? C.mint : rv.verdict === "partial" ? C.amber : C.ion;
      ctx.save(); bloom(ctx, tone, p.x, p.y + POD_H / 2, POD_W * 0.6, 0.25); ctx.fillStyle = "rgba(24,20,38,.97)"; roundRect(ctx, p.x - POD_W / 2, p.y, POD_W, POD_H, 18); ctx.fill(); ctx.strokeStyle = tone; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      textBlock(api, ctx, it.text, p.x, p.y + POD_H / 2, POD_W - 26, { size: 38, weight: 700 }, 3, 0.98);
      if (rv && r.mode === "order") pill(api, ctx, yearLabel(it.value), p.x, p.y - 34, { color: p.idx === (rd().items[eraPairs(r)[g.k][0]].value <= rd().items[eraPairs(r)[g.k][1]].value ? eraPairs(r)[g.k][0] : eraPairs(r)[g.k][1]) ? C.mint : C.ink2, size: 38 });
      if (rv && r.mode === "order" && p.idx === rv.pick && rv.verdict === "right") tick(ctx, p.x + POD_W / 2 - 10, p.y - 4, C.mint, 0.9);
      if (rv && r.mode === "order" && p.idx === rv.pick && rv.verdict !== "right") magnifier(ctx, p.x + POD_W / 2 - 10, p.y - 4, C.amber, 0.9);
    }
    // reveal: the true flag, the gap, the label
    if (g.reveal && r.mode !== "order") {
      const rv = g.reveal, k = clamp(rv.t / 0.35, 0, 1), tx = r.mode === "century" ? X(rv.truth > 0 ? (rv.truth - 0.5) * 100 : -(Math.abs(rv.truth) - 0.5) * 100) : X(rv.truth), col = rv.verdict === "right" ? C.mint : C.ion;
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx, LINE_Y); ctx.lineTo(tx, LINE_Y - 120); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(tx, LINE_Y - 120); ctx.lineTo(tx + 34, LINE_Y - 108); ctx.lineTo(tx, LINE_Y - 96); ctx.closePath(); ctx.fill(); ctx.restore();
      const lab = r.mode === "century" ? `${ordinal(rv.truth)} ${T.century} ${rv.truth < 0 ? T.bce : T.ce}` : yearLabel(rv.truth);
      pill(api, ctx, lab, clamp(tx, 190, 810), LINE_Y - 150, { color: col, size: 40 });
      if (rv.verdict !== "right" && r.mode === "place") {
        const dx = g.dock; ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = C.amber; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(Math.min(dx, tx), LINE_Y + 20); ctx.lineTo(Math.max(dx, tx), LINE_Y + 20); ctx.stroke(); ctx.restore();
        pill(api, ctx, `${T.offBy} ${fmtNum(Math.abs(rv.got - rv.truth))} ${T.years}`, clamp((dx + tx) / 2, 230, 770), 236, { color: C.amber, size: 38 });
      } else if (rv.verdict === "right") pill(api, ctx, T.exact, clamp(tx, 190, 810), 236, { color: C.mint, size: 38 });
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundR}/${g.roundN}`, T.landed]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.landed]] });
    drawCoach(api, ctx, r.mode === "order" ? T.first : T.coach, flow.state === "play" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.reveal || !g.pods.length) return { type: "wait", ms: 250 };
    const r = rd();
    if (r.mode === "order") {
      if (g.pods[0].t < 1.6) return { type: "wait", ms: 250 };
      const [a, b] = eraPairs(r)[g.k], early = r.items[a].value <= r.items[b].value ? a : b, pick = botR() < 0.85 ? early : early === a ? b : a;
      const p = g.pods.find((q) => q.idx === pick)!; return { type: "tap", at: [p.x, p.y + POD_H / 2], after: 400 };
    }
    const truth = r.items[g.k].value, aim = clamp(X(truth + (botR() + botR() - 1) * r.tol * 1.6), X0, X1);
    if (Math.abs(aim - g.dock) < 8 || g.pods[0].t < 0.8) return { type: "wait", ms: 300 };
    return { type: "drag", from: [g.dock, LINE_Y - 10], to: [aim, LINE_Y - 10], ms: 500, after: 700 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, k: g.k, dockYear: Math.round(Vx(g.dock)), right: g.right, n: g.n, speed: +g.speedK.toFixed(2) }),
    knob(k) { if (k === "slower" || k === "easier") { g.speedK = Math.max(0.55, g.speedK * 0.8); g.scaffold = true; return true; } if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; } if (k === "again") { g.right = 0; g.n = 0; g.errs = []; flow.startRound(0); return true; } return false; },
    board: () => {
      const r0 = spec.rounds[0], items = r0.items.slice(0, 5);
      return { title: spec.title, lines: items.slice(0, 3).map((i) => `${yearLabel(i.value)}: ${i.text}`), figure: /[ऀ-ॿ]/.test(items.map((i) => i.text).join("")) ? { kind: "none" } : { kind: "numberline", min, max, marks: items.slice(0, 4).map((i) => ({ v: i.value, label: i.value < 0 ? `${-i.value}BCE` : String(i.value) })) }, accent };
    },
  };
}
export const era: EngineDef<EraSpec> = { archetype: "era-drop@1", label: "Game · Era Drop", accent: "#C9A7FF", create };
