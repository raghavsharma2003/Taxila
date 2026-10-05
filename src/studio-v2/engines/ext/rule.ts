// MACHINE FACTORY — `rule-machine@1` (VALUES-100 V3.1: patterns, rules, expressions, equations). The child builds a
// machine from op tiles (tap a tile to drop it in the next socket, tap a socket to clear it) and presses RUN: inputs
// ride the belt through the machine and each output stamps against the order it had to fill. The host grades the
// MACHINE (rule equivalence on the inputs plus hidden probes), so a lucky match on one input does not pass.
// Also: growing patterns drawn by code (build the step → count machine; it then predicts step 10), think-of-a-number
// run backwards, one pair of brackets to hit a target, and Collatz / reverse-and-add exploration.
import { collatzSteps, evalTokens, inverseOp, patternCount, reverseSteps, runOps, sameRule, type RmRoundT, type RuleSpec } from "../../../../shared/studio-spec-ext/rule.ts";
import { C, W, H } from "../../core/tokens.ts";
import { hexA, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, fmtNum, textBlock } from "./kit.ts";

const MACH = { x: 330, y: 300, w: 340, h: 130 }, RUN = { x: 790, y: 470, w: 180, h: 70 }, TRAY_Y = 480;
function create(api: EngineApi, spec: RuleSpec): EngineInstance {
  const T = spec.strings, accent = C.ion;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 113 + 9);
  const g = { slots: [null, null, null] as (string | null)[], ran: false, runT: 0, verdict: "", br: [] as number[], start: 0, chain: [] as number[], right: 0, n: 0, coachA: 1, coachGone: false, doneT: 0 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "built", label: T.built }]);
  const rd = (): RmRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.slots = [null, null, null]; g.ran = false; g.runT = 0; g.verdict = ""; g.br = []; g.chain = []; g.doneT = 0; const r = spec.rounds[k]; if (r.mode === "explore") g.start = r.lo; api.event("round_start", { round: k + 1, mode: r.mode }); api.task(`${T.round} ${k + 1}`, r.sub || r.title); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const built = () => g.slots.filter((s): s is string => !!s);
  const tiles = () => { const r = rd(); return "tiles" in r ? r.tiles : []; };
  const tileRect = (i: number, _n: number) => { const w = 108, gap = 14, x0 = 70; return { x: x0 + i * (w + gap), y: TRAY_Y, w, h: 66 }; };
  const slotRect = (i: number) => ({ x: MACH.x + 22 + i * 102, y: MACH.y + 32, w: 92, h: 66 });
  function run() {
    if (g.ran || flow.state !== "play") return;
    const r = rd(); let value: unknown, local = "wrong";
    if (r.mode === "build" || r.mode === "seq") { value = built(); local = built().length && sameRule(r.rule, built(), r.mode === "build" ? r.inputs : [1, 2, 3, 4, r.ask]) ? "right" : "wrong"; if (!built().length) return; }
    else if (r.mode === "inverse") { if (!built().length) return; value = built(); local = runOps(built(), runOps(r.rule, r.secret)!) === r.secret ? "right" : "wrong"; }
    else if (r.mode === "brackets") { if (g.br.length < 2) return; value = [g.br[0], g.br[1]]; local = evalTokens(r.tokens, [g.br[0], g.br[1]]) === r.target ? "right" : "wrong"; }
    else { value = g.start; const s = r.machine === "collatz" ? collatzSteps(g.start) : reverseSteps(g.start); local = s >= r.minSteps && s < 99 ? "right" : "wrong"; g.chain = chainOf(r, g.start); }
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.ran = true; g.runT = 0; g.verdict = grade.verdict; g.n++; if (grade.verdict === "right") g.right++;
    sfx.blip({ f: 180, f2: 360, dur: 0.4, type: "sawtooth", gain: 0.05 });
    api.facts({ round: flow.round + 1, mode: r.mode, verdict: grade.verdict, machine: built().join(" ") });
  }
  function chainOf(r: Extract<RmRoundT, { mode: "explore" }>, n: number) { const out = [n]; let v = n; for (let i = 0; i < 40; i++) { if (r.machine === "collatz") { if (v === 1) break; v = v % 2 ? 3 * v + 1 : v / 2; } else { const s = String(v); if (s === s.split("").reverse().join("") && i > 0) break; v = v + Number(s.split("").reverse().join("")); } out.push(v); } return out; }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.ran) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      const r = rd();
      if (p.x >= RUN.x && p.x <= RUN.x + RUN.w && p.y >= RUN.y && p.y <= RUN.y + RUN.h) { run(); return; }
      if (r.mode === "brackets") {
        const pos = tokenPos(r);
        const hit = pos.findIndex((q, i) => i % 2 === 0 && Math.abs(p.x - q.x) < q.w / 2 + 14 && Math.abs(p.y - q.y) < 50);
        if (hit >= 0) { if (g.br.length >= 2) g.br = []; if (g.br.length === 1 && hit <= g.br[0]) g.br = [hit]; else g.br.push(hit); sfx.blip({ f: 520, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("brackets", { at: hit }); }
        return;
      }
      if (r.mode === "explore") { if (p.y >= 260 && p.y <= 420) { if (p.x < 500) g.start = Math.max(r.lo, g.start - 1); else g.start = Math.min(r.hi, g.start + 1); sfx.blip({ f: 440 + (g.start % 12) * 20, dur: 0.04, type: "triangle", gain: 0.06 }); } return; }
      const ts = tiles();
      for (let i = 0; i < ts.length; i++) { const q = tileRect(i, ts.length); if (p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h) { const e = g.slots.indexOf(null); if (e >= 0) { g.slots[e] = ts[i]; sfx.blip({ f: 600, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("machine", { put: ts[i], slot: e }); } return; } }
      for (let i = 0; i < 3; i++) { const q = slotRect(i); if (p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h && g.slots[i]) { g.slots[i] = null; g.slots = [...g.slots.filter(Boolean), null, null, null].slice(0, 3) as (string | null)[]; api.record("machine", { clear: i }); return; } }
    },
  });
  function tokenPos(r: Extract<RmRoundT, { mode: "brackets" }>) { const ws = r.tokens.map((t) => (/^\d/.test(t) ? 40 + t.length * 30 : 54)); const total = ws.reduce((a, b) => a + b, 0) + 16 * (ws.length - 1); let x = 500 - total / 2; return ws.map((w) => { const q = { x: x + w / 2, y: 320, w }; x += w + 16; return q; }); }
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    if (g.ran) { g.runT += dt; if (g.runT > 2.4 && g.verdict) { g.doneT += dt; if (g.doneT > 1.6) flow.endRound(); } }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("built", `${g.right}/${g.n}`, { bump: true });
  }
  function machine(ctx: Ctx, now: number, label = "") {
    ctx.save(); bloom(ctx, accent, MACH.x + MACH.w / 2, MACH.y + MACH.h / 2, MACH.w * 0.7, g.ran ? 0.35 : 0.18);
    ctx.fillStyle = "#1B2033"; roundRect(ctx, MACH.x, MACH.y, MACH.w, MACH.h, 22); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.9); ctx.lineWidth = 4; ctx.stroke();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = (g.ran && Math.floor(now * 8 + i) % 2) ? C.volt : "#2C3350"; ctx.beginPath(); ctx.arc(MACH.x + 30 + i * 56, MACH.y + 16, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 3; i++) { const q = slotRect(i), op = g.slots[i]; ctx.save(); ctx.fillStyle = op ? hexA(accent, 0.22) : "rgba(0,0,0,.35)"; roundRect(ctx, q.x, q.y, q.w, q.h, 14); ctx.fill(); ctx.strokeStyle = op ? accent : C.line2; ctx.lineWidth = 3; ctx.setLineDash(op ? [] : [8, 6]); ctx.stroke(); ctx.restore(); if (op) api.text(ctx, op, q.x + q.w / 2, q.y + q.h / 2 + 2, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" }); }
    if (label) api.text(ctx, label, MACH.x + MACH.w / 2, MACH.y + MACH.h + 30, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle" });
  }
  function tray(ctx: Ctx) { const ts = tiles(); ts.forEach((t, i) => { const q = tileRect(i, ts.length); ctx.save(); ctx.fillStyle = "rgba(22,26,40,.96)"; roundRect(ctx, q.x, q.y, q.w, q.h, 14); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.6); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, t, q.x + q.w / 2, q.y + q.h / 2 + 2, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" }); }); }
  function runBtn(ctx: Ctx, label = T.run) { const can = !g.ran; ctx.save(); ctx.fillStyle = can ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, RUN.x, RUN.y, RUN.w, RUN.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, label, RUN.x + RUN.w / 2, RUN.y + RUN.h / 2 + 2, { font: "display", size: 40, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" }); }
  function drawPattern(ctx: Ctx, p: Extract<RmRoundT, { mode: "seq" }>["pattern"], n: number, cx: number, cy: number) {
    ctx.save(); ctx.strokeStyle = C.sun; ctx.fillStyle = C.sun; ctx.lineWidth = 5; ctx.lineCap = "round";
    const s = 34;
    if (p === "sticks-squares") { const x0 = cx - (n * s) / 2; for (let i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(x0 + i * s, cy - s / 2); ctx.lineTo(x0 + i * s, cy + s / 2); ctx.stroke(); } for (let i = 0; i < n; i++) for (const y of [cy - s / 2, cy + s / 2]) { ctx.beginPath(); ctx.moveTo(x0 + i * s + 3, y); ctx.lineTo(x0 + (i + 1) * s - 3, y); ctx.stroke(); } }
    else if (p === "sticks-triangles") { const x0 = cx - ((n + 1) * s) / 4; for (let i = 0; i < n; i++) { const bx = x0 + (i * s) / 2, up = i % 2 === 0; ctx.beginPath(); if (up) { ctx.moveTo(bx, cy + s / 2); ctx.lineTo(bx + s / 2, cy - s / 2); ctx.lineTo(bx + s, cy + s / 2); } else { ctx.moveTo(bx, cy - s / 2); ctx.lineTo(bx + s / 2, cy + s / 2); ctx.lineTo(bx + s, cy - s / 2); } ctx.stroke(); } }
    else if (p === "dots-triangle") { for (let row = 0; row < n; row++) for (let i = 0; i <= row; i++) { ctx.beginPath(); ctx.arc(cx + (i - row / 2) * 22, cy - (n * 22) / 2 + row * 22, 6, 0, Math.PI * 2); ctx.fill(); } }
    else if (p === "dots-square") { for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { ctx.beginPath(); ctx.arc(cx + (a - (n - 1) / 2) * 22, cy + (b - (n - 1) / 2) * 22, 6, 0, Math.PI * 2); ctx.fill(); } }
    else if (p === "dots-line") { for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(cx + (i - (n - 1) / 2) * 18, cy + (r2 - 0.5) * 18, 5, 0, Math.PI * 2); ctx.fill(); } }
    else if (p === "L-shape") { for (let i = 0; i < n; i++) { ctx.fillRect(cx - 40, cy - 40 + i * 16, 14, 14); if (i) ctx.fillRect(cx - 40 + i * 16, cy - 40 + (n - 1) * 16, 14, 14); } }
    else { const k = n + 2, t = 14; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) if (a === 0 || b === 0 || a === k - 1 || b === k - 1) ctx.fillRect(cx - (k * t) / 2 + a * t, cy - (k * t) / 2 + b * t, t - 2, t - 2); }
    ctx.restore();
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 71, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    const ok = g.verdict === "right";
    if (r.mode === "build") {
      machine(ctx, now); tray(ctx); runBtn(ctx);
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(60, MACH.y + MACH.h / 2); ctx.lineTo(940, MACH.y + MACH.h / 2); ctx.stroke();
      r.inputs.forEach((v, i) => {
        const y = 180 + i * 50, want = runOps(r.rule, v)!, got = g.ran ? runOps(built(), v) : null, show = g.ran && g.runT > 0.4 + i * 0.35;
        api.text(ctx, fmtNum(v), 150, y, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle" });
        api.text(ctx, fmtNum(want), 760, y, { font: "display", size: 40, weight: 800, color: C.ink2, align: "center", baseline: "middle" });
        if (show) { const good = got === want; api.text(ctx, got === null ? "?" : fmtNum(got), 870, y, { font: "display", size: 40, weight: 800, color: good ? C.mint : C.amber, align: "center", baseline: "middle" }); }
      });
      api.text(ctx, T.want, 760, 150 - 4, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", decor: true });
    } else if (r.mode === "seq") {
      [1, 2, 3].forEach((n, i) => { const cx = 250 + i * 250; drawPattern(ctx, r.pattern, n, cx, 200); api.text(ctx, `${T.step} ${n}: ${patternCount(r.pattern, n)}`, cx, 266, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" }); });
      machine(ctx, now); tray(ctx); runBtn(ctx);
      if (g.ran && g.runT > 0.6) pill(api, ctx, `${T.predict} ${r.ask}: ${runOps(built(), r.ask) ?? "?"}`, 500, 455, { color: ok ? C.mint : C.amber, size: 40 });
    } else if (r.mode === "inverse") {
      const out = runOps(r.rule, r.secret)!;
      textBlock(api, ctx, `? → ${r.rule.join(" → ")} → ${fmtNum(out)}`, 500, 200, 820, { font: "display", size: 48, weight: 800 }, 1);
      machine(ctx, now); tray(ctx); runBtn(ctx);
      if (g.ran && g.runT > 0.5) { const got = runOps(built(), out); pill(api, ctx, `${fmtNum(out)} → ${got === null ? "?" : fmtNum(got)}`, 500, 455, { color: ok ? C.mint : C.amber, size: 40 }); }
    } else if (r.mode === "brackets") {
      const pos = tokenPos(r);
      r.tokens.forEach((t, i) => { const q = pos[i]; api.text(ctx, t, q.x, q.y, { font: "display", size: 64, weight: 800, align: "center", baseline: "middle", color: /^\d/.test(t) ? C.ink : accent }); if (i % 2 === 0 && !g.ran) { const p = 0.5 + 0.5 * Math.sin(now * 4 + i); ctx.save(); ctx.strokeStyle = C.volt; ctx.globalAlpha = 0.2 + 0.25 * p; ctx.lineWidth = 2; roundRect(ctx, q.x - q.w / 2 - 6, q.y - 46, q.w + 12, 92, 14); ctx.stroke(); ctx.restore(); } });
      if (g.br.length >= 1) api.text(ctx, "(", pos[g.br[0]].x - pos[g.br[0]].w / 2 - 10, 316, { font: "display", size: 76, weight: 800, color: C.volt, align: "center", baseline: "middle" });
      if (g.br.length >= 2) api.text(ctx, ")", pos[g.br[1]].x + pos[g.br[1]].w / 2 + 10, 316, { font: "display", size: 76, weight: 800, color: C.volt, align: "center", baseline: "middle" });
      const cur = g.br.length >= 2 ? evalTokens(r.tokens, [g.br[0], g.br[1]]) : evalTokens(r.tokens);
      pill(api, ctx, `= ${cur === null ? "?" : fmtNum(cur)}`, 500, 420, { color: g.ran ? (ok ? C.mint : C.amber) : C.ink2, size: 44 });
      pill(api, ctx, `${T.target} ${fmtNum(r.target)}`, 500, 205, { color: accent, size: 44 });
      runBtn(ctx);
    } else {
      api.text(ctx, String(g.start), 500, 330, { font: "display", size: 110, weight: 800, align: "center", baseline: "middle", glow: accent });
      for (const [x, s] of [[300, "−"], [700, "+"]] as [number, string][]) { ctx.save(); ctx.fillStyle = "rgba(22,26,40,.96)"; roundRect(ctx, x - 60, 290, 120, 90, 18); ctx.fill(); ctx.strokeStyle = hexA(accent, 0.7); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, s, x, 336, { font: "display", size: 64, weight: 800, align: "center", baseline: "middle" }); }
      pill(api, ctx, `≥ ${r.minSteps} ${T.steps}`, 500, 205, { color: accent, size: 40 });
      if (g.ran) { const k = Math.min(g.chain.length, Math.floor(g.runT * 8)); const show = g.chain.slice(Math.max(0, k - 7), k); show.forEach((v, i) => api.text(ctx, fmtNum(v), 120 + i * 110, 450, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 104 })); pill(api, ctx, `${g.chain.length - 1} ${T.steps}`, 500, 520, { color: ok ? C.mint : C.amber, size: 40 }); }
      runBtn(ctx);
    }
    if (g.ran && g.runT > 0.9) { if (ok) tick(ctx, 960, 200, C.mint, 1); else magnifier(ctx, 955, 200, C.amber, 1); if (r.mode === "build" || r.mode === "seq") pill(api, ctx, ok ? T.works : T.fix, r.mode === "build" ? 500 : 830, r.mode === "build" ? MACH.y - 34 : MACH.y + MACH.h / 2, { color: ok ? C.mint : C.amber, size: 38 }); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: g.verdict === "right", color: g.verdict === "right" ? C.mint : C.amber, stats: [[`${g.right}/${g.n}`, T.built]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.built]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" && (r.mode === "build" || r.mode === "seq" || r.mode === "inverse") ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.ran) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.12;
    if (r.mode === "build" || r.mode === "seq" || r.mode === "inverse") {
      const want = r.mode === "inverse" ? (r.rule.map(inverseOp).reverse() as string[]) : r.rule;
      const plan = slip ? [...want].reverse() : want, b = built();
      if (b.length < plan.length) { const i = tiles().indexOf(plan[b.length]); if (i >= 0) { const q = tileRect(i, tiles().length); return { type: "tap", at: [q.x + q.w / 2, q.y + q.h / 2], after: 300 }; } }
      return { type: "tap", at: [RUN.x + RUN.w / 2, RUN.y + RUN.h / 2], after: 600 };
    }
    if (r.mode === "brackets") {
      if (g.br.length < 2) { let best: [number, number] = [0, 2]; for (let i = 0; i < r.tokens.length; i += 2) for (let j = i + 2; j < r.tokens.length; j += 2) if (evalTokens(r.tokens, [i, j]) === r.target) best = [i, j]; const q = tokenPos(r)[best[g.br.length]]; return { type: "tap", at: [q.x, q.y], after: 300 }; }
      return { type: "tap", at: [RUN.x + RUN.w / 2, RUN.y + RUN.h / 2], after: 600 };
    }
    const f = r.machine === "collatz" ? collatzSteps : reverseSteps;
    let goal = r.lo; for (let n = r.lo; n <= r.hi; n++) if (f(n) >= r.minSteps && f(n) < 99) { goal = n; break; }
    if (g.start < goal) return { type: "tap", at: [700, 335], after: 60 };
    if (g.start > goal) return { type: "tap", at: [300, 335], after: 60 };
    return { type: "tap", at: [RUN.x + RUN.w / 2, RUN.y + RUN.h / 2], after: 600 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, machine: built(), brackets: g.br, start: g.start, ran: g.ran, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; return { title: spec.title, lines: r0.mode === "build" ? r0.inputs.slice(0, 3).map((v) => `${v} → ${runOps(r0.rule, v)}`) : r0.mode === "seq" ? [1, 2, 3].map((n) => `${T.step} ${n}: ${patternCount(r0.pattern, n)}`) : [r0.sub || r0.title], figure: { kind: "none" }, accent }; },
  };
}
export const rule: EngineDef<RuleSpec> = { archetype: "rule-machine@1", label: "Game · Machine Factory", accent: C.ion, create };
