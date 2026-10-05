// DUKAAN RUSH — `dukaan@1` (VALUES-100 V3.1: operations on large numbers, money and remainders). A shop counter with a
// queue whose patience runs down. Pay or change: tap notes and coins from the till onto the counter (tap one on the
// counter to take it back), then hand it over; the host grades the amount laid down against the bill the engine
// computed. Pack: add crates and watch them fill from the pile; the last crate fills only partly, and whether it
// counts depends on the job (sell full crates vs carry them all). Estimate: is the money enough? decide before the
// customer leaves. The truth is always shown after the act (exact bill, exact change, the remainder in the crate).
import { DENOMS, billOf, packKey, rupees, type DkRoundT, type DukaanSpec } from "../../../../shared/studio-spec-ext/dukaan.ts";
import { C, W, H } from "../../core/tokens.ts";
import { hexA, lerp, rng } from "../../core/math.ts";
import { magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const NOTE_COL: Record<number, string> = { 50000: "#9AA0A6", 20000: "#F2C230", 10000: "#B9A4E0", 5000: "#5FC8E8", 2000: "#C7D85A", 1000: "#9C6B48" };
const TILL_Y = 520, COUNTER = { x: 500, y: 168, w: 470, h: 250 }, GIVE = { x: 760, y: 432, w: 210, h: 64 };
interface Tok { v: number; x: number; y: number; tx: number; ty: number }

function create(api: EngineApi, spec: DukaanSpec): EngineInstance {
  const T = spec.strings, accent = C.amber;
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const botR = rng(api.seed * 97 + 5);
  const g = { k: 0, toks: [] as Tok[], patience: 1, answered: false, verdict: "", revealT: 0, crates: [] as number[], pile: 0, choice: null as boolean | null, right: 0, n: 0, streak: 0, roundR: 0, roundN: 0, coachA: 1, coachGone: false, speedK: 1 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "served", label: T.served }, { key: "pat", label: T.patience, meter: true }]);
  const rd = (): DkRoundT => spec.rounds[Math.max(0, flow.round)];
  const units = () => { const r = rd(); return r.mode === "pack" ? r.jobs.length : r.customers.length; };
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { g.k = 0; g.roundR = 0; g.roundN = 0; g.speedK = spec.rounds[k].speed; api.event("round_start", { round: k + 1, mode: spec.rounds[k].mode }); sfx.blip({ f: 196, f2: 392, dur: 0.3, type: "triangle", gain: 0.12 }); start(); },
    onEnd(k) { api.event("round_end", { round: k + 1, right: g.roundR, of: g.roundN }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const denoms = () => { const r = rd(); return (DENOMS as readonly number[]).filter((d) => (r.mode === "pay" || r.mode === "change") && (r.coins || d >= 1000)); };
  const till = () => { const ds = denoms(), n = ds.length, w = Math.min(96, (W - 60) / n - 8); return ds.map((v, i) => ({ v, x: 30 + i * ((W - 60) / n) + ((W - 60) / n - w) / 2, w })); };
  function start() {
    g.toks = []; g.answered = false; g.verdict = ""; g.revealT = 0; g.choice = null; g.crates = []; g.patience = 1;
    const r = rd();
    if (r.mode === "pack") g.pile = r.jobs[g.k].n;
    api.task(`${T.round} ${flow.round + 1}`, r.mode === "pay" ? T.bill : r.mode === "change" ? T.change : r.mode === "pack" ? `${T.pack}: ${r.jobs[g.k].need === "all" ? T.carry : T.full}` : `${T.enough}?`);
  }
  const counterSum = () => g.toks.reduce((a, t) => a + t.v, 0);
  function layoutToks() { let x = COUNTER.x + 20, y = COUNTER.y + 24, rowH = 0; for (const t of g.toks) { const w = t.v >= 1000 ? 118 : 56, h = t.v >= 1000 ? 58 : 56; if (x + w > COUNTER.x + COUNTER.w - 14) { x = COUNTER.x + 20; y += rowH + 10; rowH = 0; } t.tx = x + w / 2; t.ty = y + h / 2; x += w + 10; rowH = Math.max(rowH, h); } }
  function judge(value: unknown, local: string) {
    if (g.answered) return;
    const grade = api.answer(`r${flow.round + 1}:${g.k}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.revealT = 0; g.n++; g.roundN++;
    if (grade.verdict === "right") { g.right++; g.roundR++; g.streak++; api.fx.burst(COUNTER.x + COUNTER.w / 2, COUNTER.y + 100, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.flash(C.mint, 0.08); sfx.blip({ f: 523 * Math.pow(1.05, Math.min(8, g.streak)), f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else { g.streak = 0; g.speedK = Math.max(0.6, g.speedK * 0.88); sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 }); api.fx.shake(4, 0.2); api.event("adapt", { speed: +g.speedK.toFixed(2), why: "slip" }); }
    api.facts({ round: flow.round + 1, unit: g.k + 1, verdict: grade.verdict, truth: String(grade.truth) });
  }
  const r2 = () => rd();
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      const r = r2();
      if (r.mode === "pay" || r.mode === "change") {
        for (const t of till()) if (p.x >= t.x && p.x <= t.x + t.w && p.y >= TILL_Y - 10 && p.y <= TILL_Y + 90) { if (g.toks.length >= 24) return; g.toks.push({ v: t.v, x: t.x + t.w / 2, y: TILL_Y + 40, tx: 0, ty: 0 }); layoutToks(); sfx.blip({ f: t.v >= 1000 ? 300 : 900, dur: 0.05, type: t.v >= 1000 ? "triangle" : "sine", gain: 0.08 }); api.record("counter", { add: t.v }); return; }
        const hit = g.toks.findIndex((t) => Math.abs(p.x - t.tx) < (t.v >= 1000 ? 60 : 30) && Math.abs(p.y - t.ty) < 30);
        if (hit >= 0) { const [t] = g.toks.splice(hit, 1); layoutToks(); api.record("counter", { remove: t.v }); return; }
        if (p.x >= GIVE.x && p.x <= GIVE.x + GIVE.w && p.y >= GIVE.y && p.y <= GIVE.y + GIVE.h && g.toks.length) { const c = r.customers[g.k], key = r.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c); judge(g.toks.map((t) => t.v), counterSum() === key ? "right" : "wrong"); }
      } else if (r.mode === "pack") {
        const j = r.jobs[g.k];
        if (p.x >= 560 && p.x <= 760 && p.y >= 440 && p.y <= 500 && g.pile > 0 && g.crates.length < 14) { const put = Math.min(j.per, g.pile); g.crates.push(put); g.pile -= put; sfx.blip({ f: 400 + g.crates.length * 30, dur: 0.08, type: "triangle", gain: 0.1 }); api.record("crates", { add: put }); return; }
        if (p.x >= 780 && p.x <= 970 && p.y >= 440 && p.y <= 500 && g.crates.length) { judge(g.crates.length, g.crates.length === packKey(j) ? "right" : "wrong"); return; }
        if (p.x >= 560 && p.x <= 970 && p.y >= 170 && p.y <= 420 && g.crates.length) { const put = g.crates.pop()!; g.pile += put; api.record("crates", { remove: put }); }
      } else {
        const c = r.customers[g.k], enough = (c.budget ?? 0) >= billOf(c);
        if (p.y >= 440 && p.y <= 520) { if (p.x >= 520 && p.x <= 740) { g.choice = true; judge(true, enough ? "right" : "wrong"); } else if (p.x >= 760 && p.x <= 980) { g.choice = false; judge(false, !enough ? "right" : "wrong"); } }
      }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    for (const t of g.toks) { t.x = lerp(t.x, t.tx, Math.min(1, dt * 14)); t.y = lerp(t.y, t.ty, Math.min(1, dt * 14)); }
    if (flow.state !== "play") return;
    const r = rd();
    if (!g.answered) {
      g.patience -= dt * (r.mode === "estimate" ? 1 / 7 : r.mode === "pack" ? 1 / 40 : 1 / 45) * g.speedK;
      if (g.patience <= 0) {
        g.patience = 0;
        if (r.mode === "estimate") judge(null, "wrong");
        else if (r.mode === "pack") judge(g.crates.length, g.crates.length === packKey(r.jobs[g.k]) ? "right" : "wrong");
        else judge(g.toks.map((t) => t.v), "wrong");
      }
    } else { g.revealT += dt; if (g.revealT > (g.verdict === "right" ? 2.0 : 3.2)) { if (g.k + 1 < units()) { g.k++; start(); } else flow.endRound(); } }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("served", `${g.right}/${g.n}`, { bump: true });
    hud.set("pat", `${Math.round(g.patience * 100)}%`, { meter: g.patience, tone: g.patience < 0.25 ? "amber" : null });
  }
  function note(ctx: Ctx, v: number, x: number, y: number, s = 1) {
    if (v >= 1000) { const w = 112 * s, h = 54 * s; ctx.save(); ctx.fillStyle = NOTE_COL[v] ?? "#999"; roundRect(ctx, x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2; ctx.stroke(); if (s >= 1) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.beginPath(); ctx.arc(x + w * 0.28, y, h * 0.3, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); api.text(ctx, String(v / 100), s < 1 ? x : x - w * 0.12, y + 2, { font: "display", size: 38 * Math.max(1, s), weight: 800, color: "#14161C", align: "center", baseline: "middle" }); }
    else { const r = 27 * s; ctx.save(); ctx.fillStyle = v >= 1000 ? "#C9B26A" : v === 50 ? "#B7BCC4" : "#C9CED6"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, v >= 100 ? String(v / 100) : "½", x, y + 2, { font: "display", size: 38, weight: 800, color: "#14161C", align: "center", baseline: "middle" }); }
  }
  function paintBg(c: Ctx) { backdrop(c, C.amber, 41, 0); c.fillStyle = "rgba(60,40,24,.55)"; c.fillRect(0, 430, W, H - 430); c.fillStyle = "rgba(255,200,120,.08)"; c.fillRect(0, 426, W, 6); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // the customer and the bill
    if (r.mode !== "pack") {
      const c = r.customers[g.k];
      drawGlyph(ctx, "person", 78, 250, 110, C.ink2, hexA(C.amber, 0.18));
      ctx.save(); ctx.fillStyle = "rgba(24,22,30,.97)"; roundRect(ctx, 150, 150, 336, 300, 18); ctx.fill(); ctx.strokeStyle = hexA(C.amber, 0.7); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, r.mode === "estimate" ? `${T.budget} ${rupees(c.budget ?? 0)}` : T.bill, 318, 184, { font: "mono", size: 38, weight: 600, color: C.amber, align: "center", baseline: "middle", maxWidth: 320 });
      c.items.slice(0, 3).forEach((it, i) => {
        api.text(ctx, it.name, 170, 236 + i * 76, { size: 38, weight: 700, baseline: "middle", maxWidth: 300 });
        api.text(ctx, `${it.qty} × ${rupees(it.price)}`, 470, 272 + i * 76, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "right", baseline: "middle" });
      });
      if (r.mode === "change") pill(api, ctx, `${T.pays} ${rupees(c.pays ?? 0)}`, 318, 490, { color: C.amber, size: 38 });
      // patience
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,.08)"; roundRect(ctx, 26, 330, 104, 10, 5); ctx.fill(); ctx.fillStyle = g.patience < 0.25 ? C.amber : C.mint; roundRect(ctx, 26, 330, 104 * g.patience, 10, 5); ctx.fill(); ctx.restore();
    }
    if (r.mode === "pay" || r.mode === "change") {
      ctx.save(); ctx.fillStyle = "rgba(14,16,22,.7)"; roundRect(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 18); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      for (const t of g.toks) note(ctx, t.v, t.x, t.y);
      // till
      for (const t of till()) { ctx.save(); ctx.fillStyle = "rgba(18,16,14,.9)"; roundRect(ctx, t.x - 2, TILL_Y - 6, t.w + 4, 92, 12); ctx.fill(); ctx.restore(); note(ctx, t.v, t.x + t.w / 2, TILL_Y + 40, t.v >= 1000 ? Math.min(0.82, t.w / 120) : 1); }
      const can = g.toks.length > 0 && !g.answered;
      ctx.save(); ctx.fillStyle = can ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, GIVE.x, GIVE.y, GIVE.w, GIVE.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, r.mode === "pay" ? T.bill + " →" : T.change + " →", GIVE.x + GIVE.w / 2, GIVE.y + GIVE.h / 2 + 2, { font: "display", size: 38, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" });
      if (g.answered) {
        const c = r.customers[g.k], key = r.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c), sum = counterSum(), ok = g.verdict === "right";
        pill(api, ctx, ok ? `${T.exact} ${rupees(key)}` : `${rupees(sum)} · ${sum < key ? T.short : T.over} ${rupees(Math.abs(key - sum))}`, COUNTER.x + COUNTER.w / 2, COUNTER.y + COUNTER.h - 34, { color: ok ? C.mint : C.amber, size: 38 });
        if (ok) tick(ctx, COUNTER.x + COUNTER.w - 20, COUNTER.y + 20, C.mint, 0.9); else magnifier(ctx, COUNTER.x + COUNTER.w - 24, COUNTER.y + 24, C.amber, 0.9);
      }
    } else if (r.mode === "pack") {
      const j = r.jobs[g.k];
      // the pile
      const pr = rng(j.n * 7 + 1);
      for (let i = 0; i < Math.min(g.pile, 160); i++) { const x = 80 + pr() * 380, y = 220 + pr() * 190; ctx.fillStyle = hexA(C.amber, 0.85); ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); }
      api.text(ctx, `${g.pile} ${j.thing}`, 270, 190, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" });
      api.text(ctx, `${j.per} ${T.each}`, 270, 450, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      // crates
      g.crates.forEach((n, i) => {
        const cx = 570 + (i % 4) * 100, cy = 180 + Math.floor(i / 4) * 66, full = n === j.per;
        ctx.save(); ctx.fillStyle = "rgba(60,45,25,.6)"; roundRect(ctx, cx, cy, 90, 56, 8); ctx.fill(); ctx.fillStyle = "rgba(150,110,60,.9)"; const fh = 56 * (n / j.per); roundRect(ctx, cx, cy + 56 - fh, 90, fh, 8); ctx.fill(); ctx.strokeStyle = full ? C.ink2 : C.amber; ctx.lineWidth = 3; roundRect(ctx, cx, cy, 90, 56, 8); ctx.stroke(); ctx.restore();
        api.text(ctx, String(n), cx + 45, cy + 30, { font: "mono", size: 38, weight: 600, color: full ? C.ink : C.amber, align: "center", baseline: "middle", maxWidth: 88 });
      });
      for (const [x, lab, on] of [[560, `+ ${T.crates}`, g.pile > 0 && !g.answered], [780, "✔", g.crates.length > 0 && !g.answered]] as [number, string, boolean][]) {
        ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, x, 440, x === 560 ? 200 : 190, 60, 16); ctx.fill(); ctx.strokeStyle = on ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        if (x === 560) api.text(ctx, lab, x + 100, 472, { font: "display", size: 40, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle" });
        else tick(ctx, x + 95, 470, on ? C.volt : C.ink3, 1);
      }
      if (g.answered) { const key = packKey(j), ok = g.verdict === "right"; pill(api, ctx, `${key} ${T.crates}${j.n % j.per ? ` · ${j.n % j.per} ${j.need === "all" ? T.inLast : T.left}` : ""}`, 640, 408, { color: ok ? C.mint : C.amber, size: 38 }); }
    } else {
      const c = r.customers[g.k], bill = billOf(c), enough = (c.budget ?? 0) >= bill;
      for (const [x, lab, val] of [[520, T.enough, true], [760, T.notEnough, false]] as [number, string, boolean][]) {
        const chosen = g.choice === val, edge = g.answered ? (val === enough ? C.mint : chosen ? C.amber : C.line2) : C.volt;
        ctx.save(); ctx.fillStyle = "rgba(22,24,30,.95)"; roundRect(ctx, x, 440, 220, 80, 18); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        api.text(ctx, lab, x + 110, 482, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle", maxWidth: 200 });
      }
      if (g.answered) pill(api, ctx, `${T.bill} ${rupees(bill)}`, 760, 300, { color: enough ? C.mint : C.amber, size: 40 });
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent: C.amber });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundR}/${g.roundN}`, T.served]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.served]] });
    drawCoach(api, ctx, r.mode === "pay" || r.mode === "change" ? T.coach : "", flow.state === "play" ? g.coachA : 0, now, 120);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd();
    if (r.mode === "pay" || r.mode === "change") {
      const c = r.customers[g.k], key = (r.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c)) + (botR() < 0.1 ? 1000 : 0), have = counterSum();
      if (have === key || have > key) return { type: "tap", at: [GIVE.x + GIVE.w / 2, GIVE.y + GIVE.h / 2], after: 600 };
      const need = key - have, d = till().find((t) => t.v <= need);
      return d ? { type: "tap", at: [d.x + d.w / 2, TILL_Y + 40], after: 160 } : { type: "tap", at: [GIVE.x + GIVE.w / 2, GIVE.y + GIVE.h / 2], after: 600 };
    }
    if (r.mode === "pack") { const j = r.jobs[g.k], key = packKey(j); if (g.crates.length < key && g.pile > 0) return { type: "tap", at: [660, 470], after: 300 }; return { type: "tap", at: [875, 470], after: 600 }; }
    const c = r.customers[g.k], enough = (c.budget ?? 0) >= billOf(c), pick = botR() < 0.85 ? enough : !enough;
    return { type: "tap", at: [pick ? 630 : 870, 480], after: 1500 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, k: g.k, counter: counterSum(), crates: g.crates.length, right: g.right, n: g.n }),
    knob(k) { if (k === "slower" || k === "easier") { g.speedK = Math.max(0.5, g.speedK * 0.8); return true; } if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; } if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; if (r0.mode === "pack") { const j = r0.jobs[0]; return { title: spec.title, lines: [`${j.n} ${j.thing}, ${j.per} in a crate`, `${Math.floor(j.n / j.per)} full, ${j.n % j.per} left over`], figure: { kind: "none" }, accent }; } const c = r0.customers[0]; return { title: spec.title, lines: [...c.items.map((i) => `${i.qty} × ${i.name} at ${rupees(i.price)}`).slice(0, 3), `${T.bill}: ${rupees(billOf(c))}`], figure: { kind: "none" }, accent }; },
  };
}
export const dukaan: EngineDef<DukaanSpec> = { archetype: "dukaan@1", label: "Game · Dukaan Rush", accent: C.amber, create };
