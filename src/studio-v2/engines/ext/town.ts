// TOWN LAB — `town-lab@1` (VALUES-100 V3.1: barter and money, markets, savings, local budgets). The child runs a small
// economy; the host recomputes every outcome from the raw act:
//   barter  — tap a trader to offer what you hold; they swap only if it is what they want. Find the chain to the goal.
//             With money, the market turns any good into coins and coins into any good.
//   market  — OPEN the stall; customers walk up one at a time; drag the price at any moment; each buys only if your
//             price is within what they will pay. Reach the profit target before the day (or the stock) ends.
//   savings — choose the monthly saving, RUN the years: coins drop in monthly, the bank adds interest each year end
//   council — tap projects to fund them; the budget and the families helped update; LOCK the plan
import { COINS, barterPlan, bestPrice, councilBest, marketRun, minMonthly, savingsAfter, tradeStep, type TlRoundT, type TownSpec } from "../../../../shared/studio-spec-ext/town.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, fmtNum, taskPill, textBlock, wrap } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const BTN = { x: 800, y: 520, w: 170, h: 66 };
const tcard = (i: number) => ({ x: 122 + (i % 2) * 330, y: 178 + Math.floor(i / 2) * 140, w: 318, h: 130 });
const SL = { x0: 170, x1: 690, y: 580 };
function create(api: EngineApi, spec: TownSpec): EngineInstance {
  const T = spec.strings, accent = "#C9A7FF";
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 191 + 23), setTask = taskPill(api);
  const g = {
    hold: "", moves: [] as [number, string?][], shake: -1, shakeT: 0, flyT: 1,
    price: 0, slide: false, open: false, t: 0, ci: -1, prices: [] as number[], outcome: [] as boolean[], profit: 0, sold: 0,
    monthly: 0, running: false, runT: 0, pick: [] as number[],
    answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, plan: [] as [number, string?][],
  };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): TlRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { hold: r.mode === "barter" ? r.start : "", moves: [], shake: -1, shakeT: 0, flyT: 1, price: r.mode === "market" ? r.cost * 2 : 0, slide: false, open: false, t: 0, ci: -1, prices: [], outcome: [], profit: 0, sold: 0, monthly: 0, running: false, runT: 0, pick: [], answered: false, verdict: "", detail: "", revealT: 0 });
      if (r.mode === "barter") g.plan = barterPlan(r) ?? [];
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
  const priceMax = (r: Extract<TlRoundT, { mode: "market" }>) => Math.ceil((Math.max(...r.buyers) * 1.3) / 10) * 10;
  const moMax = (r: Extract<TlRoundT, { mode: "savings" }>) => Math.ceil((r.goal / (12 * r.years)) * 1.6 / 10) * 10;
  const slideVal = (x: number, max: number, step: number) => Math.round((clamp((x - SL.x0) / (SL.x1 - SL.x0), 0, 1) * max) / step) * step;
  const nCards = () => { const r = rd(); return r.mode === "barter" ? r.traders.length + (r.money ? 1 : 0) : r.mode === "council" ? r.projects.length : 0; };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd();
      if (r.mode === "barter") {
        if (inB(p, { x: 790, y: 540, w: 190, h: 56 }) && g.moves.length) { g.hold = r.start; g.moves = []; api.record("restart", {}); return; }
        for (let i = 0; i < nCards(); i++) if (inB(p, tcard(i))) {
          const who = i < r.traders.length ? i : -1, want = who === -1 && g.hold === COINS ? r.goal : undefined, nx = tradeStep(r, g.hold, who, want);
          if (nx === null) { g.shake = i; g.shakeT = 0.4; sfx.blip({ f: 180, dur: 0.1, gain: 0.08 }); api.record("refused", { who, hold: g.hold }); return; }
          g.moves.push(want ? [who, want] : [who]); g.hold = nx; g.flyT = 0; sfx.blip({ f: 660, f2: 880, dur: 0.12, type: "triangle", gain: 0.1 }); api.record("trade", { who, got: nx });
          if (g.hold === r.goal || g.moves.length >= 12) judge({ moves: g.moves }, g.hold === r.goal && g.moves.length <= g.plan.length + 1 ? "right" : "wrong");
          return;
        }
        return;
      }
      if (r.mode === "market") { if (!g.open && inB(p, BTN)) { g.open = true; g.t = 0; api.record("open", { price: g.price }); return; } if (Math.abs(p.y - SL.y) < 36) { g.slide = true; g.price = Math.max(1, slideVal(p.x, priceMax(r), 5)); } return; }
      if (r.mode === "savings") { if (g.running) return; if (inB(p, BTN) && g.monthly > 0) { g.running = true; g.runT = 0; api.record("run", { monthly: g.monthly }); return; } if (Math.abs(p.y - SL.y) < 36) { g.slide = true; g.monthly = slideVal(p.x, moMax(r), 1); } return; }
      if (inB(p, BTN)) { const cost = g.pick.reduce((a, i) => a + r.projects[i].cost, 0); if (!g.pick.length || cost > r.budget) return; const helps = g.pick.reduce((a, i) => a + r.projects[i].helps, 0); judge({ pick: g.pick }, cost <= r.budget && helps >= councilBest(r).helps ? "right" : "wrong"); return; }
      for (let i = 0; i < r.projects.length; i++) if (inB(p, tcard(i))) { const at = g.pick.indexOf(i); if (at >= 0) g.pick.splice(at, 1); else g.pick.push(i); sfx.blip({ f: at >= 0 ? 400 : 640, dur: 0.06, type: "triangle", gain: 0.08 }); api.record("project", { i, on: at < 0 }); return; }
    },
    move(p) { const r = rd(); if (g.slide && r.mode === "market") g.price = Math.max(1, slideVal(p.x, priceMax(r), 5)); if (g.slide && r.mode === "savings") g.monthly = slideVal(p.x, moMax(r), 1); },
    up() { if (g.slide) { g.slide = false; api.record("slide", { price: g.price, monthly: g.monthly }); } },
  });
  const STEP = 1.3;
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    g.shakeT = Math.max(0, g.shakeT - dt); g.flyT = Math.min(1, g.flyT + dt * 2.5);
    if (r.mode === "market" && g.open && !g.answered) {
      g.t += dt; const idx = Math.floor(g.t / STEP);
      if (idx > g.ci && idx < r.buyers.length) { g.ci = idx; g.prices[idx] = g.price; const out = marketRun(r, g.prices), before = g.sold; g.profit = out.profit; g.sold = out.sold; g.outcome[idx] = out.sold > before; if (g.outcome[idx]) sfx.blip({ f: 880, f2: 1320, dur: 0.1, type: "triangle", gain: 0.1 }); else sfx.blip({ f: 260, dur: 0.08, gain: 0.06 }); api.record("customer", { i: idx, price: g.price, bought: g.outcome[idx] }); }
      if (g.t >= r.buyers.length * STEP + 0.6 || (g.sold >= r.stock && g.t > (g.ci + 1) * STEP)) judge({ prices: g.prices }, g.profit >= r.target ? "right" : "wrong");
    }
    if (r.mode === "savings" && g.running && !g.answered) { g.runT += dt; if (g.runT > r.years * 2 + 0.6) judge({ monthly: g.monthly }, savingsAfter(r, g.monthly) >= r.goal && g.monthly <= minMonthly(r) * 1.1 ? "right" : "wrong"); }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3.2) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 191, 0); }
  function button(ctx: Ctx, b: { x: number; y: number; w: number; h: number }, label: string, on: boolean, now: number, col: string = C.volt) {
    ctx.save(); ctx.fillStyle = on ? hexA(col, 0.14) : "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = on ? hexA(col, 0.7 + 0.3 * Math.sin(now * 4)) : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    textBlock(api, ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 2, b.w - 16, { size: 38, weight: 700, color: on ? col : C.ink3 }, 2, 1.05);
  }
  function readout(ctx: Ctx, label: string, value: string, y: number, color: string = C.ink) {
    const lines = wrap(api, ctx, label, 210, { size: 38, weight: 600 }, 2); lines.forEach((ln, i) => api.text(ctx, ln, 885, y + i * 42, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 214 }));
    api.text(ctx, value, 885, y + 46 + (lines.length - 1) * 42, { font: "display", size: 42, weight: 800, color, align: "center", baseline: "middle", maxWidth: 210 });
  }
  function slider(ctx: Ctx, f: number, label: string) {
    ctx.save(); ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(SL.x1, SL.y); ctx.stroke(); const kx = SL.x0 + clamp(f, 0, 1) * (SL.x1 - SL.x0); ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(kx, SL.y); ctx.stroke(); ctx.fillStyle = g.slide ? C.volt : C.ink; ctx.beginPath(); ctx.arc(kx, SL.y, 17, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    pill(api, ctx, label, clamp(kx, 240, 620), SL.y - 56, { color: g.slide ? C.volt : C.ink, size: 38 });
  }
  const rs = (v: number) => `${T.rupee}${fmtNum(v)}`;
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "barter") {
      for (let i = 0; i < nCards(); i++) {
        const c = tcard(i), isM = i >= r.traders.length, t = r.traders[i], sh = g.shake === i ? Math.sin(g.shakeT * 60) * 8 * g.shakeT : 0;
        ctx.save(); ctx.translate(sh, 0); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, c.x, c.y, c.w, c.h, 16); ctx.fill(); ctx.strokeStyle = isM ? C.sun : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        drawGlyph(ctx, isM ? "coin" : t.glyph, c.x + 34 + sh, c.y + 65, 44, C.ink, hexA(isM ? C.sun : accent, 0.3));
        if (isM) { api.text(ctx, T.market, c.x + 66, c.y + 42, { size: 38, weight: 800, color: C.sun, baseline: "middle", maxWidth: c.w - 72 }); api.text(ctx, `⇄ ${T.coins}`, c.x + 66, c.y + 92, { size: 38, weight: 600, color: C.ink2, baseline: "middle", maxWidth: c.w - 72 }); }
        else { api.text(ctx, t.name, c.x + 66 + sh, c.y + 30, { size: 38, weight: 800, color: C.ink, baseline: "middle", maxWidth: c.w - 72 }); api.text(ctx, `${T.has} ${t.has}`, c.x + 66 + sh, c.y + 72, { size: 38, weight: 600, color: "#9FE7C4", baseline: "middle", maxWidth: c.w - 72 }); api.text(ctx, `${T.wants} ${t.wants}`, c.x + 66 + sh, c.y + 112, { size: 38, weight: 600, color: C.sun, baseline: "middle", maxWidth: c.w - 72 }); }
      }
      readout(ctx, T.have, g.hold, 190, g.hold === r.goal ? C.mint : C.volt);
      readout(ctx, T.need, r.goal, 310);
      api.text(ctx, `${T.trades} ${g.moves.length}`, 885, 450, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 210 });
      button(ctx, { x: 790, y: 540, w: 190, h: 56 }, T.reset, !done && g.moves.length > 0, now, C.amber);
      if (g.flyT < 1) { const k = g.flyT; ctx.save(); ctx.globalAlpha = 1 - k; bloom(ctx, C.volt, lerp(450, 885, k), lerp(380, 236, k), 40, 0.6); ctx.restore(); }
    } else if (r.mode === "market") {
      ctx.save(); ctx.fillStyle = "#3A2E26"; ctx.fillRect(140, 330, 260, 120); ctx.fillStyle = "#C9A7FF"; for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? "#FF8FB1" : "#FFD36B"; ctx.beginPath(); ctx.moveTo(140 + i * 44, 300); ctx.lineTo(184 + i * 44, 300); ctx.lineTo(184 + i * 44, 330); ctx.quadraticCurveTo(162 + i * 44, 346, 140 + i * 44, 330); ctx.fill(); } ctx.restore();
      const left = r.stock - g.sold; for (let i = 0; i < Math.min(left, 12); i++) drawGlyph(ctx, r.glyph, 170 + (i % 6) * 38, 380 + Math.floor(i / 6) * 40, 34, C.ink, hexA(C.sun, 0.4));
      api.text(ctx, `${T.stock} ${left}`, 270, 480, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      if (g.open) { const k = (g.t % STEP) / STEP, idx = g.ci; if (idx >= 0 && idx < r.buyers.length) { const x = lerp(720, 450, Math.min(1, k * 2.2)), leaving = k > 0.6, bought = g.outcome[idx]; const xx = leaving ? lerp(450, bought ? 450 : 760, (k - 0.6) / 0.4) : x, yy = leaving && bought ? lerp(390, 600, (k - 0.6) / 0.4) : 390; drawGlyph(ctx, "person", xx, yy, 70, C.ink, hexA(bought ? C.mint : accent, 0.35)); if (k > 0.45 && k < 0.85) pill(api, ctx, bought ? "✓" : T.noDeal, 520, 290, { color: bought ? C.mint : C.amber, size: 38 }); } }
      readout(ctx, T.profit, rs(g.profit), 190, g.profit >= r.target ? C.mint : C.ink);
      readout(ctx, T.target, rs(r.target), 300);
      readout(ctx, T.sold, `${g.sold}`, 410);
      slider(ctx, g.price / priceMax(r), `${T.price} ${rs(g.price)}`);
      if (!g.open) button(ctx, BTN, T.open, !done, now);
      api.text(ctx, `${T.cost} ${T.rupee}${r.cost}`, 270, 260, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", baseline: "middle", decor: true });
    } else if (r.mode === "savings") {
      const months = g.running || done ? Math.min(r.years * 12, Math.floor((g.runT / 2) * 12)) : 0;
      let bal = 0, interest = 0, start = 0; for (let m = 0; m < months; m++) { if (m % 12 === 0) start = bal; bal += g.monthly; if ((m + 1) % 12 === 0) { const add = Math.round((start * r.rate) / 100); interest += add; bal += add; } }
      const f = clamp(bal / (r.goal * 1.3), 0, 1), gy = 540 - (r.goal / (r.goal * 1.3)) * 330;
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,.06)"; roundRect(ctx, 300, 210, 160, 330, 16); ctx.fill(); const lg = ctx.createLinearGradient(0, 540, 0, 210); lg.addColorStop(0, "#C08A2B"); lg.addColorStop(1, "#FFD36B"); ctx.fillStyle = lg; roundRect(ctx, 300, 540 - f * 330, 160, f * 330, 16); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(280, gy); ctx.lineTo(480, gy); ctx.stroke(); ctx.restore();
      api.text(ctx, `${T.goal} ${rs(r.goal)}`, 490, gy, { font: "mono", size: 38, weight: 600, color: C.ink, baseline: "middle" });
      drawGlyph(ctx, "bank", 200, 300, 90, C.ink, hexA(accent, 0.3)); api.text(ctx, `${r.rate}%`, 200, 380, { font: "display", size: 40, weight: 800, color: accent, align: "center", baseline: "middle" });
      readout(ctx, T.saved, rs(bal), 190, bal >= r.goal ? C.mint : C.ink);
      readout(ctx, T.interest, rs(interest), 300, C.sun);
      readout(ctx, T.years, `${Math.min(r.years, Math.floor(months / 12))} / ${r.years}`, 410);
      slider(ctx, g.monthly / moMax(r), `${rs(g.monthly)} ${T.perMonth}`);
      button(ctx, BTN, T.run, !done && !g.running && g.monthly > 0, now);
    } else {
      const cost = g.pick.reduce((a, i) => a + r.projects[i].cost, 0), helps = g.pick.reduce((a, i) => a + r.projects[i].helps, 0), over = cost > r.budget;
      r.projects.forEach((pj, i) => { const c = tcard(i), on = g.pick.includes(i); if (on) bloom(ctx, C.volt, c.x + c.w / 2, c.y + c.h / 2, 120, 0.22); ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.1)" : "rgba(22,26,36,.95)"; roundRect(ctx, c.x, c.y, c.w, c.h, 16); ctx.fill(); ctx.strokeStyle = on ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); drawGlyph(ctx, pj.glyph, c.x + 34, c.y + 65, 44, C.ink, hexA(on ? C.volt : accent, 0.3)); api.text(ctx, pj.name, c.x + 66, c.y + 38, { size: 38, weight: 800, color: C.ink, baseline: "middle", maxWidth: c.w - 72 }); api.text(ctx, `${T.rupee}${pj.cost}`, c.x + 66, c.y + 92, { font: "display", size: 38, weight: 800, color: C.sun, baseline: "middle" }); drawGlyph(ctx, "group", c.x + 186, c.y + 90, 34, "#9FE7C4", "rgba(0,0,0,0)"); api.text(ctx, `${pj.helps}`, c.x + 210, c.y + 92, { size: 38, weight: 700, color: "#9FE7C4", baseline: "middle", maxWidth: c.w - 216 }); });
      readout(ctx, T.budget, `${T.rupee}${r.budget - cost}`, 190, over ? C.amber : C.ink);
      readout(ctx, T.families, `${helps}`, 320, C.mint);
      button(ctx, BTN, T.lock, !done && !over && g.pick.length > 0, now);
    }
    if (done) { pill(api, ctx, g.detail, 440, 150 + 460, { color: ok ? C.mint : C.amber, size: 38 }); if (ok) tick(ctx, 965, 470, C.mint, 1); else magnifier(ctx, 960, 470, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.1;
    if (r.mode === "barter") { const mv = g.plan[g.moves.length]; if (!mv) return { type: "wait", ms: 300 }; const i = slip ? (mv[0] + 1) % r.traders.length : mv[0] === -1 ? r.traders.length : mv[0], c = tcard(i); return { type: "tap", at: [c.x + c.w / 2, c.y + c.h / 2], after: 500 }; }
    if (r.mode === "market") { const want = bestPrice(r).price * (slip ? 1.3 : 1); if (Math.abs(g.price - want) > 4 && !g.open) return { type: "drag", from: [SL.x0 + (g.price / priceMax(r)) * (SL.x1 - SL.x0), SL.y], to: [SL.x0 + (want / priceMax(r)) * (SL.x1 - SL.x0), SL.y], ms: 500, after: 300 }; if (!g.open) return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 }; return { type: "wait", ms: 400 }; }
    if (r.mode === "savings") { if (g.running) return { type: "wait", ms: 400 }; const want = minMonthly(r) + (slip ? -40 : 2); if (Math.abs(g.monthly - want) > 1) return { type: "drag", from: [SL.x0 + (g.monthly / moMax(r)) * (SL.x1 - SL.x0), SL.y], to: [SL.x0 + (want / moMax(r)) * (SL.x1 - SL.x0) + 0.3, SL.y], ms: 500, after: 300 }; return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 }; }
    const best = councilBest(r).pick, todo = best.find((i) => !g.pick.includes(i)), extra = g.pick.find((i) => !best.includes(i));
    if (extra !== undefined) { const c = tcard(extra); return { type: "tap", at: [c.x + 150, c.y + 65], after: 300 }; }
    if (todo !== undefined && !slip) { const c = tcard(todo); return { type: "tap", at: [c.x + 150, c.y + 65], after: 300 }; }
    return { type: "tap", at: [BTN.x + 85, BTN.y + 33], after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, hold: g.hold, moves: g.moves.length, price: g.price, profit: g.profit, monthly: g.monthly, pick: g.pick, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const town: EngineDef<TownSpec> = { archetype: "town-lab@1", label: "Simulation · Town Lab", accent: "#C9A7FF", create };
