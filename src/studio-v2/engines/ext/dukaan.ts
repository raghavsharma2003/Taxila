// DUKAAN RUSH — `dukaan@1` (VALUES-100 V3.1: operations on large numbers, money and remainders). A shop counter with a
// queue whose patience runs down. Pay or change: tap notes and coins from the till onto the counter (tap one on the
// counter to take it back), then hand it over; the host grades the amount laid down against the bill the engine
// computed. Pack: add crates and watch them fill from the pile; the last crate fills only partly, and whether it
// counts depends on the job (sell full crates vs carry them all). Estimate: is the money enough? decide before the
// customer leaves. The truth is always shown after the act (exact bill, exact change, the remainder in the crate).
import { DENOMS, billOf, packKey, rupees, type DkRoundT, type DukaanSpec } from "../../../../shared/studio-spec-ext/dukaan.ts";
import { C, W, H } from "../../core/tokens.ts";
import { withAlpha } from "../../../theme/palette.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill, wrapLines } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, tally } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";
import { dots } from "../../core/dots.ts";

const NOTE_COL = (): Record<number, string> => ({ 50000: C.dkNote500, 20000: C.dkNote200, 10000: C.dkNote100, 5000: C.dkNote50, 2000: C.dkNote20, 1000: C.dkNote10 });
// the till sits low enough that the "pays" pill has a gap above (bill card ends 450) and below (till box TILL_Y - 6)
// (judges, 2026-11-11: "Diye ₹20" touched the Bill card's bottom border at l1366)
const TILL_Y = 532, COUNTER = { x: 500, y: 168, w: 470, h: 250 }, GIVE = { x: 760, y: 432, w: 210, h: 64 };
/** estimate mode's two answers, stacked full width on the right so "Not enough" fits whole at the young floor */
const EST = [{ val: true, x: 540, y: 296, w: 420, h: 84 }, { val: false, x: 540, y: 396, w: 420, h: 84 }] as const;
interface Tok { v: number; x: number; y: number; tx: number; ty: number }
/** One pile per denomination on the counter (2026-11-11, class 5 pay specs: a big bill laid out note by note ran past
 *  the counter and under the result pill). A pile is the note or coin, plus a "×n" badge beside it when n > 1. */
interface Pile { v: number; n: number; x: number; y: number; w: number; badgeW: number }
const PILE_GAP = 12, ROW_GAP = 10, MAX_TOKS = 60;

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
    g.toks = []; piles = []; g.answered = false; g.verdict = ""; g.revealT = 0; g.choice = null; g.crates = []; g.patience = 1;
    const r = rd();
    if (r.mode === "pack") g.pile = r.jobs[g.k].n;
    api.task(`${T.round} ${flow.round + 1}`, r.mode === "pay" ? T.bill : r.mode === "change" ? T.change : r.mode === "pack" ? `${T.pack}: ${r.jobs[g.k].need === "all" ? T.carry : T.full}` : `${T.enough}?`);
  }
  const counterSum = () => g.toks.reduce((a, t) => a + t.v, 0);
  let piles: Pile[] = [], lastCtx: Ctx | undefined;
  const badgeO = { font: "mono", size: 38, weight: 700 } as const;
  /** Piles, biggest value first, flowed into rows across the counter's full height (the result pill sits below it). */
  function layoutToks(ctx?: Ctx) {
    const counts = new Map<number, number>(); for (const t of g.toks) counts.set(t.v, (counts.get(t.v) ?? 0) + 1);
    const vs = [...counts.keys()].sort((a, b) => b - a);
    let x = COUNTER.x + 18, y = COUNTER.y + 18, rowH = 0;
    piles = vs.map((v) => {
      const n = counts.get(v)!, noteW = v >= 1000 ? 112 : 54, h = v >= 1000 ? 54 : 54;
      const badgeW = n > 1 ? (ctx ? api.measure(ctx, `×${n}`, badgeO) : 24 * String(n).length + 30) + 6 : 0;
      const w = noteW + (badgeW ? 8 + badgeW : 0);
      if (x + w > COUNTER.x + COUNTER.w - 14 && x > COUNTER.x + 18) { x = COUNTER.x + 18; y += rowH + ROW_GAP; rowH = 0; }
      const p = { v, n, x, y, w, badgeW }; x += w + PILE_GAP; rowH = Math.max(rowH, h); return p;
    });
    for (const p of piles) { let i = 0; const cx = p.x + (p.v >= 1000 ? 56 : 27), cy = p.y + 27; for (const t of g.toks) if (t.v === p.v) { const k = Math.min(i++, 2); t.tx = cx + k * 3; t.ty = cy - k * 3; } }
  }
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
        for (const t of till()) if (p.x >= t.x && p.x <= t.x + t.w && p.y >= TILL_Y - 10 && p.y <= TILL_Y + 90) { if (g.toks.length >= MAX_TOKS) return; g.toks.push({ v: t.v, x: t.x + t.w / 2, y: TILL_Y + 40, tx: 0, ty: 0 }); layoutToks(lastCtx); sfx.blip({ f: t.v >= 1000 ? 300 : 900, dur: 0.05, type: t.v >= 1000 ? "triangle" : "sine", gain: 0.08 }); api.record("counter", { add: t.v }); return; }
        // a tap on a pile (its note or its badge) takes one of that value back
        const pile = piles.find((q) => p.x >= q.x - 4 && p.x <= q.x + q.w + 4 && p.y >= q.y - 4 && p.y <= q.y + 58);
        const hit = pile ? g.toks.map((t) => t.v).lastIndexOf(pile.v) : -1;
        if (hit >= 0) { const [t] = g.toks.splice(hit, 1); layoutToks(lastCtx); api.record("counter", { remove: t.v }); return; }
        if (p.x >= GIVE.x && p.x <= GIVE.x + GIVE.w && p.y >= GIVE.y && p.y <= GIVE.y + GIVE.h && g.toks.length) { const c = r.customers[g.k], key = r.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c); judge(g.toks.map((t) => t.v), counterSum() === key ? "right" : "wrong"); }
      } else if (r.mode === "pack") {
        const j = r.jobs[g.k];
        if (p.x >= 560 && p.x <= 760 && p.y >= 440 && p.y <= 500 && g.pile > 0 && g.crates.length < 14) { const put = Math.min(j.per, g.pile); g.crates.push(put); g.pile -= put; sfx.blip({ f: 400 + g.crates.length * 30, dur: 0.08, type: "triangle", gain: 0.1 }); api.record("crates", { add: put }); return; }
        if (p.x >= 780 && p.x <= 970 && p.y >= 440 && p.y <= 500 && g.crates.length) { judge(g.crates.length, g.crates.length === packKey(j) ? "right" : "wrong"); return; }
        if (p.x >= 560 && p.x <= 970 && p.y >= 170 && p.y <= 420 && g.crates.length) { const put = g.crates.pop()!; g.pile += put; api.record("crates", { remove: put }); }
      } else {
        const c = r.customers[g.k], enough = (c.budget ?? 0) >= billOf(c);
        const b = EST.find((e) => p.x >= e.x && p.x <= e.x + e.w && p.y >= e.y && p.y <= e.y + e.h);
        if (b) { g.choice = b.val; judge(b.val, b.val === enough ? "right" : "wrong"); }
      }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    for (const t of g.toks) { t.x = lerp(t.x, t.tx, Math.min(1, dt * 14)); t.y = lerp(t.y, t.ty, Math.min(1, dt * 14)); }
    if (flow.round >= 0 && flow.state !== "play") { hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("served", tally(g.roundR, units()), { bump: true }); }   // the round's readouts from its intro on, never a stale or "0/0" count
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
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("served", tally(g.roundR, units()), { bump: true });
    hud.set("pat", `${Math.round(g.patience * 100)}%`, { meter: g.patience, tone: g.patience < 0.25 ? "amber" : null });
  }
  function note(ctx: Ctx, v: number, x: number, y: number, s = 1, bare = false) {
    if (bare) { ctx.save(); ctx.fillStyle = v >= 1000 ? (NOTE_COL()[v] ?? C.dkNoteUnknown) : v === 50 ? C.dkCoinSmall : C.dkCoin; ctx.globalAlpha *= 0.4; /* a faint edge under the pile, not an opaque card on the one above it */ if (v >= 1000) roundRect(ctx, x - 56 * s, y - 27 * s, 112 * s, 54 * s, 6); else { ctx.beginPath(); ctx.arc(x, y, 27 * s, 0, Math.PI * 2); } ctx.fill(); ctx.strokeStyle = withAlpha(C.lo, .35); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); return; }
    if (v >= 1000) { const w = 112 * s, h = 54 * s; ctx.save(); ctx.fillStyle = NOTE_COL()[v] ?? C.dkNoteUnknown; roundRect(ctx, x - w / 2, y - h / 2, w, h, 6); ctx.fill(); ctx.strokeStyle = withAlpha(C.lo, .35); ctx.lineWidth = 2; ctx.stroke(); if (s >= 1) { ctx.fillStyle = withAlpha(C.hi, .25); ctx.beginPath(); ctx.arc(x + w * 0.28, y, h * 0.3, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); api.text(ctx, String(v / 100), s < 1 ? x : x - w * 0.12, y + 2, { font: "display", size: 38 * Math.max(1, s), weight: 800, color: C.onBright, align: "center", baseline: "middle" }); }
    else { const r = 27 * s; ctx.save(); ctx.fillStyle = v >= 1000 ? C.dkCoinGold : v === 50 ? C.dkCoinSmall : C.dkCoin; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = withAlpha(C.lo, .35); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, v >= 100 ? String(v / 100) : "½", x, y + 2, { font: "display", size: 38, weight: 800, color: C.onBright, align: "center", baseline: "middle" }); }
  }
  function paintBg(c: Ctx) { backdrop(c, C.amber, 41, 0); c.fillStyle = withAlpha(C.dkCounter, .55); c.fillRect(0, 430, W, H - 430); c.fillStyle = withAlpha(C.dkLamp, .08); c.fillRect(0, 426, W, 6); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // the customer and the bill
    if (r.mode !== "pack") {
      const c = r.customers[g.k];
      drawGlyph(ctx, "person", 78, 250, 110, C.ink2, hexA(C.amber, 0.18));
      // (the card's top clears the task pill over the world at l1366, whose bottom sits at y ~154: layout probe 2026-11-11)
      const top = Math.max(150, Math.min(160, api.chromeBottom() + 6));
      // the item rows: a name and its price share a line when both fit the row, else the price goes on its own line under
      // it; lines a young label apart, the rows spread over the card, and the card grows down (to 512, short of the till;
      // in change mode its "pays" pill holds it at 450) when the lines need it (a third price ran over the card's bottom edge
      // at 438 — layout probe, c4-ch04-t03, 2026-11-11)
      const nameO = { size: 38, weight: 700 } as const, priceO = { font: "mono", size: 38, weight: 600 } as const, lh = Math.max(38, api.minLabel) * 1.15;
      const rows = c.items.slice(0, 3).map((it) => { const p = `${it.qty} × ${rupees(it.price)}`; return { it, p, one: api.measure(ctx, it.name, nameO) + 20 + api.measure(ctx, p, priceO) <= 300 }; });
      const nLines = rows.reduce((a, q) => a + (q.one ? 1 : 2), 0), rowsTop = top + 58;
      const bottom = clamp(rowsTop + nLines * lh + (rows.length - 1) * 12 + 14, 450, r.mode === "change" ? 450 : 512);
      const gap = clamp((bottom - 10 - rowsTop - nLines * lh) / Math.max(1, rows.length - 1), 0, 30);
      ctx.save(); ctx.fillStyle = withAlpha(C.dkCard, .97); roundRect(ctx, 150, top, 336, bottom - top, 18); ctx.fill(); ctx.strokeStyle = hexA(C.amber, 0.7); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, r.mode === "estimate" ? `${T.budget} ${rupees(c.budget ?? 0)}` : T.bill, 318, top + 31, { font: "mono", size: 38, weight: 600, color: C.amber, align: "center", baseline: "middle", maxWidth: 320 });
      // (a name and its price line a full young label apart: at 43-unit young text 36 overlapped, "Pencil box" over "1 × ₹0.50")
      let ly = rowsTop + lh / 2;
      for (const q of rows) {
        api.text(ctx, q.it.name, 170, ly, { ...nameO, baseline: "middle", maxWidth: 300 });
        if (!q.one) ly += lh;
        api.text(ctx, q.p, 470, ly, { ...priceO, color: C.ink2, align: "right", baseline: "middle" });
        ly += lh + gap;
      }
      if (r.mode === "change") pill(api, ctx, `${T.pays} ${rupees(c.pays ?? 0)}`, 318, 488, { color: C.amber, size: 38 });   // 458-518: 8 clear of the bill card (ends 450) and of the till (starts 526)
      // patience
      ctx.save(); ctx.fillStyle = withAlpha(C.hi, .08); roundRect(ctx, 26, 330, 104, 10, 5); ctx.fill(); ctx.fillStyle = g.patience < 0.25 ? C.amber : C.mint; roundRect(ctx, 26, 330, 104 * g.patience, 10, 5); ctx.fill(); ctx.restore();
    }
    if (r.mode === "pay" || r.mode === "change") {
      ctx.save(); ctx.fillStyle = withAlpha(C.dkTray, .7); roundRect(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 18); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      // each pile: the copies under it bare, its top note or coin with its value, then "×n" beside it
      lastCtx = ctx;
      for (const q of piles) {
        const mine = g.toks.filter((t) => t.v === q.v), top = mine[mine.length - 1];
        mine.slice(0, -1).forEach((t) => note(ctx, t.v, t.x, t.y, 1, true));
        if (top) note(ctx, top.v, top.x, top.y);
        if (q.n > 1) api.text(ctx, `×${q.n}`, q.x + q.w - q.badgeW / 2, q.y + 29, { ...badgeO, color: C.amber, align: "center", baseline: "middle" });
      }
      // till
      for (const t of till()) { ctx.save(); ctx.fillStyle = withAlpha(C.dkTill, .9); roundRect(ctx, t.x - 2, TILL_Y - 6, t.w + 4, 92, 12); ctx.fill(); ctx.restore(); note(ctx, t.v, t.x + t.w / 2, TILL_Y + 40, t.v >= 1000 ? Math.min(0.82, t.w / 120) : 1); }
      const can = g.toks.length > 0 && !g.answered;
      // (the result pill takes the hand-over button's place once the act is done: it sat on the counter's own notes)
      if (!g.answered) {
      ctx.save(); ctx.fillStyle = can ? withAlpha(C.volt, .14) : withAlpha(C.hi, .04); roundRect(ctx, GIVE.x, GIVE.y, GIVE.w, GIVE.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, r.mode === "pay" ? T.bill + " →" : T.change + " →", GIVE.x + GIVE.w / 2, GIVE.y + GIVE.h / 2 + 2, { font: "display", size: 38, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" });
      } else {
        const c = r.customers[g.k], key = r.mode === "pay" ? billOf(c) : (c.pays ?? 0) - billOf(c), sum = counterSum(), ok = g.verdict === "right";
        // (left of centre it would meet the bill card, which ends at x 486; a young-size "₹10 · over by ₹4.50" is that wide)
        // (at the young size on a phone the whole line is wider than the room right of the bill: keep "over by ₹4.50", the
        // part the child acts on; the bill is on its card)
        const room = W - 12 - COUNTER.x, wOf = (m: string) => api.measure(ctx, m, { font: "mono", size: 38, weight: 600 }) + 36;
        const diff = `${sum < key ? T.short : T.over} ${rupees(Math.abs(key - sum))}`, full = ok ? `${T.exact} ${rupees(key)}` : `${rupees(sum)} · ${diff}`;
        const msg = ok || wOf(full) <= room ? full : diff;
        const pw = wOf(msg), px = clamp(COUNTER.x + COUNTER.w / 2, COUNTER.x + pw / 2, W - 12 - pw / 2);
        pill(api, ctx, msg, px, GIVE.y + GIVE.h / 2, { color: ok ? C.mint : C.amber, size: 38 });
        if (ok) tick(ctx, COUNTER.x + COUNTER.w - 20, COUNTER.y + 20, C.mint, 0.9); else magnifier(ctx, COUNTER.x + COUNTER.w - 24, COUNTER.y + 24, C.amber, 0.9);
      }
    } else if (r.mode === "pack") {
      const j = r.jobs[g.k];
      // the pile
      const pr = rng(j.n * 7 + 1);
      for (let i = 0; i < Math.min(g.pile, 160); i++) { const x = 80 + pr() * 380, y = 220 + pr() * 190; ctx.fillStyle = hexA(C.amber, 0.85); ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); }
      api.text(ctx, `${g.pile} ${j.thing}`, 270, Math.max(190, Math.min(204, api.chromeBottom() + 26)), { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" });
      api.text(ctx, `${j.per} ${T.each}`, 270, 450, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle" });
      // crates
      g.crates.forEach((n, i) => {
        const cx = 570 + (i % 4) * 100, cy = 180 + Math.floor(i / 4) * 66, full = n === j.per;
        ctx.save(); ctx.fillStyle = withAlpha(C.dkCrate, .6); roundRect(ctx, cx, cy, 90, 56, 8); ctx.fill(); ctx.fillStyle = withAlpha(C.dkCrateFill, .9); const fh = 56 * (n / j.per); roundRect(ctx, cx, cy + 56 - fh, 90, fh, 8); ctx.fill(); ctx.strokeStyle = full ? C.ink2 : C.amber; ctx.lineWidth = 3; roundRect(ctx, cx, cy, 90, 56, 8); ctx.stroke(); ctx.restore();
        api.text(ctx, String(n), cx + 45, cy + 30, { font: "mono", size: 38, weight: 600, color: full ? C.ink : C.amber, align: "center", baseline: "middle", maxWidth: 88 });
      });
      for (const [x, lab, on] of [[560, `+ ${T.crates}`, g.pile > 0 && !g.answered], [780, "✔", g.crates.length > 0 && !g.answered]] as [number, string, boolean][]) {
        ctx.save(); ctx.fillStyle = on ? withAlpha(C.volt, .14) : withAlpha(C.hi, .04); roundRect(ctx, x, 440, x === 560 ? 200 : 190, 60, 16); ctx.fill(); ctx.strokeStyle = on ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        if (x === 560) api.text(ctx, lab, x + 100, 472, { font: "display", size: 40, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle" });
        else tick(ctx, x + 95, 470, on ? C.volt : C.ink3, 1);
      }
      // (the answer pill sits under the buttons, centred: at (640, 408) a long answer lay over the pile's "12 each" line and,
      // at the young floor, ran off the right edge — layout probe, 2026-11-11)
      if (g.answered) { const key = packKey(j), ok = g.verdict === "right"; pill(api, ctx, `${key} ${T.crates}${j.n % j.per ? ` · ${j.n % j.per} ${j.need === "all" ? T.inLast : T.left}` : ""}`, 500, 538, { color: ok ? C.mint : C.amber, size: 38 }); }
    } else {
      const c = r.customers[g.k], bill = billOf(c), enough = (c.budget ?? 0) >= bill;
      for (const b of EST) {
        const val = b.val, chosen = g.choice === val, edge = g.answered ? (val === enough ? C.mint : chosen ? C.amber : C.line2) : C.volt;
        ctx.save(); ctx.fillStyle = withAlpha(C.dkButton, .95); roundRect(ctx, b.x, b.y, b.w, b.h, 18); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        api.text(ctx, val ? T.enough : T.notEnough, b.x + b.w / 2, b.y + b.h / 2 + 2, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle", maxWidth: b.w - 24 });
      }
      if (g.answered) pill(api, ctx, `${T.bill} ${rupees(bill)}`, 750, 226, { color: enough ? C.mint : C.amber, size: 40 });
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${dots(flow.round, spec.rounds.length)}`, title: r.title, sub: r.sub, accent: C.amber });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.roundR}/${g.roundN}`, T.served]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.served]] });
    // the coach sits inside the empty counter it points at, never over the bill card (judges, 2026-11-11: "Notes aur sikke counter
    // par rakho" over the Bill card at p412 and l1366); it fades on the first tap, before any note lands there
    // (drawn here, not with drawCoach: its three-line cap cut the young-size coach to "…to put them on the" and lost
    // "counter". The counter is empty while the coach shows, so every line fits in it, centred)
    const ca = flow.state === "play" && (r.mode === "pay" || r.mode === "change") ? g.coachA : 0;
    if (ca > 0.01 && T.coach) {
      const co = { font: "mono", size: 38, weight: 500 } as const, lines = wrapLines(api, ctx, T.coach, COUNTER.w - 40, co), lh = Math.max(38, api.minLabel) * 1.15;
      const y0 = COUNTER.y + COUNTER.h / 2 - ((lines.length - 1) * lh) / 2 + lh * 0.3, alpha = ca * (0.65 + 0.35 * Math.sin(now * 4));
      lines.forEach((ln, i) => api.text(ctx, ln, COUNTER.x + COUNTER.w / 2, y0 + i * lh, { ...co, color: C.ink2, align: "center", alpha }));
    }
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
    const b = EST[pick ? 0 : 1];
    return { type: "tap", at: [b.x + b.w / 2, b.y + b.h / 2], after: 1500 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, k: g.k, counter: counterSum(), crates: g.crates.length, right: g.right, n: g.n }),
    knob(k) { if (k === "slower" || k === "easier") { g.speedK = Math.max(0.5, g.speedK * 0.8); return true; } if (k === "faster" || k === "harder") { g.speedK = Math.min(1.5, g.speedK * 1.15); return true; } if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; if (r0.mode === "pack") { const j = r0.jobs[0]; return { title: spec.title, lines: [`${j.n} ${j.thing}, ${j.per} in a crate`, `${Math.floor(j.n / j.per)} full, ${j.n % j.per} left over`], figure: { kind: "none" }, accent }; } const c = r0.customers[0]; return { title: spec.title, lines: [...c.items.map((i) => `${i.qty} × ${i.name} at ${rupees(i.price)}`).slice(0, 3), `${T.bill}: ${rupees(billOf(c))}`], figure: { kind: "none" }, accent }; },
  };
}
export const dukaan: EngineDef<DukaanSpec> = { archetype: "dukaan@1", label: "Game · Dukaan Rush", get accent() { return C.amber; }, create };
