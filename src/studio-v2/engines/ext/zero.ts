// ZERO PAIR LAB — `zero-pair@1` (VALUES-100 V3.1: integers with the token model). + tokens (amber) and − tokens (blue)
// on a moving belt and in a tray. A + and a − together make a zero pair: they link and dim (they are still there, they
// just add up to nothing). Make a target by grabbing off the belt; take tokens away, adding zero pairs when there are
// not enough of the kind you must take; build k groups of m, or share a tray into k equal groups. LOCK hands the tray
// (and the moves) to the host.
import { zpKey, type ZeroSpec, type ZpRoundT } from "../../../../shared/studio-spec-ext/zero.ts";
import { C, W, H } from "../../core/tokens.ts";
import { rng } from "../../core/math.ts";
import { magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady } from "./kit.ts";

const LOCK = { x: 830, y: 510, w: 140, h: 66 }, TRAY = { x: 150, y: 300, w: 640, h: 200 }, POS = "#FFB547", NEG = "#5FA8FF";
interface Tok { s: 1 | -1; x: number; y: number; group: number }
function create(api: EngineApi, spec: ZeroSpec): EngineInstance {
  const T = spec.strings, accent = C.ion;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 149 + 3);
  const g = { tray: [] as Tok[], belt: [] as { s: 1 | -1; x: number }[], beltT: 0, takenPos: 0, takenNeg: 0, sel: -1, selGroup: 0, answered: false, verdict: "", revealT: 0, right: 0, n: 0, coachA: 1, coachGone: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }, { key: "val", label: T.value }]);
  const rd = (): ZpRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k]; g.tray = []; g.belt = []; g.beltT = 0; g.takenPos = 0; g.takenNeg = 0; g.sel = -1; g.selGroup = 0; g.answered = false; g.verdict = ""; g.revealT = 0;
      if (r.mode === "subtract") for (let i = 0; i < Math.abs(r.start); i++) g.tray.push({ s: r.start > 0 ? 1 : -1, x: 0, y: 0, group: -1 });
      if (r.mode === "groups" && r.share) for (let i = 0; i < Math.abs(r.k * r.m); i++) g.tray.push({ s: r.m > 0 ? 1 : -1, x: 0, y: 0, group: -1 });
      api.task(`${T.round} ${k + 1}`, r.sub || r.title); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const counts = () => { const pos = g.tray.filter((t) => t.s === 1).length, neg = g.tray.length - pos; return { pos, neg }; };
  const groupBoxes = () => { const r = rd(); const k = r.mode === "groups" ? r.k : 0; const w = Math.min(150, 640 / Math.max(1, k) - 16); return Array.from({ length: k }, (_, i) => ({ i, x: 150 + i * (640 / k) + (640 / k - w) / 2, y: 330, w, h: 160 })); };
  function layout() {
    const r = rd();
    if (r.mode === "groups") { const gb = groupBoxes(); const per = new Map<number, number>(); const loose = g.tray.filter((t) => t.group < 0); loose.forEach((t, i) => { t.x = 200 + (i % 12) * 44; t.y = 230 + Math.floor(i / 12) * 44; }); for (const t of g.tray) if (t.group >= 0) { const b = gb[t.group]; const k = per.get(t.group) ?? 0; per.set(t.group, k + 1); t.x = b.x + 28 + (k % 3) * 44; t.y = b.y + 30 + Math.floor(k / 3) * 44; } return; }
    const pos = g.tray.filter((t) => t.s === 1), neg = g.tray.filter((t) => t.s === -1), pairs = Math.min(pos.length, neg.length);
    let col = 0; const place = (t: Tok, row: number) => { t.x = TRAY.x + 40 + (col % 13) * 46; t.y = TRAY.y + 40 + row * 60 + Math.floor(col / 13) * 0; };
    for (let i = 0; i < pairs; i++) { place(pos[i], 0); place(neg[i], 1); col++; }
    for (let i = pairs; i < pos.length; i++) { place(pos[i], 2); col++; }
    for (let i = pairs; i < neg.length; i++) { place(neg[i], 2); col++; }
  }
  function lock() {
    if (g.answered || flow.state !== "play") return;
    const r = rd(), { pos, neg } = counts();
    const groupsVal = r.mode === "groups" ? groupBoxes().map((b) => g.tray.filter((t) => t.group === b.i).reduce((a, t) => a + t.s, 0)) : [];
    const value = { pos, neg, used: pos + neg + (r.mode === "make" ? 0 : 0), takenPos: g.takenPos, takenNeg: g.takenNeg, groups: groupsVal };
    const local = (r.mode === "groups" ? groupsVal.length === r.k && groupsVal.every((x) => x === r.m) : pos - neg === zpKey(r)) ? "right" : "wrong";
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.answered = true; g.verdict = grade.verdict; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.burst(470, 400, { n: 30, color: C.mint, speed: 420, life: 0.6, size: 10 }); api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, value: pos - neg, key: zpKey(r), verdict: grade.verdict, detail: grade.detail ?? "" });
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      if (p.x >= LOCK.x && p.x <= LOCK.x + LOCK.w && p.y >= LOCK.y && p.y <= LOCK.y + LOCK.h) { lock(); return; }
      const r = rd();
      if (r.mode === "make") { const b = g.belt.findIndex((t) => Math.abs(t.x - p.x) < 30 && Math.abs(230 - p.y) < 34); if (b >= 0 && g.tray.length < 26) { const [t] = g.belt.splice(b, 1); g.tray.push({ s: t.s, x: t.x, y: 230, group: -1 }); layout(); sfx.blip({ f: t.s > 0 ? 660 : 440, dur: 0.06, type: "triangle", gain: 0.08 }); api.record("tray", { add: t.s }); } else { const i = g.tray.findIndex((t) => Math.hypot(t.x - p.x, t.y - p.y) < 22); if (i >= 0) { g.tray.splice(i, 1); layout(); api.record("tray", { remove: true }); } } return; }
      if (r.mode === "subtract") {
        if (p.x >= 830 && p.x <= 970 && p.y >= 330 && p.y <= 400 && g.tray.length < 24) { g.tray.push({ s: 1, x: 0, y: 0, group: -1 }, { s: -1, x: 0, y: 0, group: -1 }); layout(); sfx.blip({ f: 330, f2: 500, dur: 0.1, type: "triangle", gain: 0.08 }); api.record("tray", { zeroPair: true }); return; }
        const i = g.tray.findIndex((t) => Math.hypot(t.x - p.x, t.y - p.y) < 22); if (i >= 0) { const [t] = g.tray.splice(i, 1); if (t.s > 0) g.takenPos++; else g.takenNeg++; layout(); sfx.blip({ f: 300, dur: 0.06, type: "sine", gain: 0.08 }); api.record("tray", { take: t.s }); }
        return;
      }
      // groups
      const gb = groupBoxes(), hitBox = gb.find((b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
      if (r.share) { const i = g.tray.findIndex((t) => Math.hypot(t.x - p.x, t.y - p.y) < 22); if (i >= 0) { g.sel = i; return; } if (hitBox && g.sel >= 0) { g.tray[g.sel].group = hitBox.i; g.sel = -1; layout(); api.record("share", { to: hitBox.i }); } return; }
      if (hitBox) { g.selGroup = hitBox.i; }
      for (const [x, s] of [[830, 1], [900, -1]] as [number, 1 | -1][]) if (p.x >= x && p.x <= x + 60 && p.y >= 330 && p.y <= 390) { g.tray.push({ s, x: 0, y: 0, group: g.selGroup }); layout(); sfx.blip({ f: s > 0 ? 660 : 440, dur: 0.06, type: "triangle", gain: 0.08 }); api.record("groups", { group: g.selGroup, add: s }); return; }
      const i = g.tray.findIndex((t) => Math.hypot(t.x - p.x, t.y - p.y) < 22); if (i >= 0) { g.tray.splice(i, 1); layout(); }
    },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state === "intro" && flow.stateT < 0.05) layout();
    if (flow.state !== "play") return;
    const r = rd();
    if (r.mode === "make" && !g.answered) { g.beltT -= dt; if (g.beltT <= 0) { g.belt.push({ s: api.rnd() < 0.5 ? 1 : -1, x: W + 30 }); g.beltT = 0.75 / r.speed; } for (const t of g.belt) t.x -= 130 * r.speed * dt; g.belt = g.belt.filter((t) => t.x > -40); }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3.0) flow.endRound(); }
    const { pos, neg } = counts();
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true }); hud.set("val", `${pos - neg >= 0 ? "+" : "−"}${Math.abs(pos - neg)}`);
  }
  function token(ctx: Ctx, s: 1 | -1, x: number, y: number, dim = false, sel = false) { ctx.save(); ctx.globalAlpha *= dim ? 0.45 : 1; ctx.fillStyle = s > 0 ? POS : NEG; ctx.beginPath(); ctx.arc(x, y, 19, 0, Math.PI * 2); ctx.fill(); if (sel) { ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.stroke(); } ctx.strokeStyle = "#0A0C12"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); if (s > 0) { ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); } ctx.stroke(); ctx.restore(); }
  function paintBg(c: Ctx) { backdrop(c, accent, 121, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const ok = g.verdict === "right", done = g.answered;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "make") { ctx.fillStyle = "#121621"; ctx.fillRect(0, 254, W, 12); for (const t of g.belt) token(ctx, t.s, t.x, 230); pill(api, ctx, `${r.target >= 0 ? "+" : "−"}${Math.abs(r.target)}`, 900, 400, { color: accent, size: 48 }); }
    if (r.mode !== "groups") {
      ctx.save(); ctx.fillStyle = "rgba(14,16,24,.85)"; roundRect(ctx, TRAY.x, TRAY.y, TRAY.w, TRAY.h, 20); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      const pos = g.tray.filter((t) => t.s === 1), neg = g.tray.filter((t) => t.s === -1), pairs = Math.min(pos.length, neg.length);
      for (let i = 0; i < pairs; i++) { ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(neg[i].x, neg[i].y); ctx.stroke(); ctx.restore(); }
      pos.forEach((t, i) => token(ctx, 1, t.x, t.y, i < pairs)); neg.forEach((t, i) => token(ctx, -1, t.x, t.y, i < pairs));
      if (r.mode === "subtract") { ctx.save(); ctx.fillStyle = done ? "rgba(255,255,255,.04)" : "rgba(22,26,36,.95)"; roundRect(ctx, 830, 330, 140, 70, 14); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); token(ctx, 1, 870, 365); token(ctx, -1, 930, 365); api.text(ctx, `${T.take} ${r.take > 0 ? "+" : "−"}${Math.abs(r.take)}`, 470, 240, { font: "display", size: 48, weight: 800, align: "center", baseline: "middle" }); }
    } else {
      groupBoxes().forEach((b) => { ctx.save(); ctx.fillStyle = "rgba(14,16,24,.85)"; roundRect(ctx, b.x, b.y, b.w, b.h, 18); ctx.fill(); ctx.strokeStyle = !r.share && g.selGroup === b.i ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); const v = g.tray.filter((t) => t.group === b.i).reduce((a, t) => a + t.s, 0); api.text(ctx, `${v >= 0 ? "+" : "−"}${Math.abs(v)}`, b.x + b.w / 2, b.y + b.h + 28, { font: "mono", size: 38, weight: 600, color: done ? (v === r.m ? C.mint : C.amber) : C.ink2, align: "center", baseline: "middle" }); });
      g.tray.forEach((t, i) => token(ctx, t.s, t.x, t.y, false, i === g.sel));
      if (!r.share) { token(ctx, 1, 860, 360); token(ctx, -1, 930, 360); }
      api.text(ctx, r.share ? `${T.share} ${r.k}` : `${r.k} ${T.groups} ${r.m >= 0 ? "+" : "−"}${Math.abs(r.m)}`, 470, 210, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" });
    }
    ctx.save(); ctx.fillStyle = !done ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, LOCK.x, LOCK.y, LOCK.w, LOCK.h, 16); ctx.fill(); ctx.strokeStyle = !done ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    api.text(ctx, T.lock, LOCK.x + LOCK.w / 2, LOCK.y + LOCK.h / 2 + 2, { font: "display", size: 38, weight: 800, color: !done ? C.volt : C.ink3, align: "center", baseline: "middle" });
    if (done) { if (ok) tick(ctx, 960, 200, C.mint, 1); else magnifier(ctx, 955, 200, C.amber, 1); pill(api, ctx, `= ${zpKey(r) >= 0 ? "+" : "−"}${Math.abs(zpKey(r))}`, 470, 548, { color: ok ? C.mint : C.amber, size: 40 }); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: g.verdict === "right", color: g.verdict === "right" ? C.mint : C.amber, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" && r.mode === "make" ? g.coachA : 0, now, 150);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), { pos, neg } = counts(), slip = botR() < 0.08;
    if (r.mode === "make") { const val = pos - neg, used = pos + neg; if (val === r.target + (slip ? 1 : 0) && used >= r.minTokens) return { type: "tap", at: [LOCK.x + 70, LOCK.y + 33], after: 600 }; const want: 1 | -1 = used < r.minTokens - Math.abs(r.target - val) ? (val > r.target ? -1 : 1) : (val < r.target ? 1 : -1); const t = g.belt.filter((b) => b.s === want && b.x > 60 && b.x < 900)[0]; return t ? { type: "tap", at: [t.x - 8, 230], after: 120 } : { type: "wait", ms: 150 }; }
    if (r.mode === "subtract") { const need = Math.abs(r.take), sign = r.take > 0 ? 1 : -1, taken = sign > 0 ? g.takenPos : g.takenNeg; if (taken < need) { const t = g.tray.find((q) => q.s === sign); if (t) return { type: "tap", at: [t.x, t.y], after: 200 }; return { type: "tap", at: [900, 365], after: 250 }; } return { type: "tap", at: [LOCK.x + 70, LOCK.y + 33], after: 600 }; }
    const gb = groupBoxes();
    if (r.share) { const loose = g.tray.findIndex((t) => t.group < 0); if (loose >= 0) { if (g.sel < 0) return { type: "tap", at: [g.tray[loose].x, g.tray[loose].y], after: 100 }; const counts2 = gb.map((b) => g.tray.filter((t) => t.group === b.i).length); const b = gb[counts2.indexOf(Math.min(...counts2))]; return { type: "tap", at: [b.x + b.w / 2, b.y + b.h - 20], after: 120 }; } return { type: "tap", at: [LOCK.x + 70, LOCK.y + 33], after: 600 }; }
    for (const b of gb) { const v = g.tray.filter((t) => t.group === b.i).reduce((a, t) => a + t.s, 0); if (v !== r.m) { if (g.selGroup !== b.i) return { type: "tap", at: [b.x + b.w / 2, b.y + b.h - 15], after: 100 }; return { type: "tap", at: [v < r.m ? 860 : 930, 360], after: 120 }; } }
    return { type: "tap", at: [LOCK.x + 70, LOCK.y + 33], after: 600 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, ...counts(), takenPos: g.takenPos, takenNeg: g.takenNeg, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => `${x.title} = ${zpKey(x)}`).slice(0, 3), figure: { kind: "numberline", min: -6, max: 6, marks: [{ v: zpKey(spec.rounds[0]), label: String(zpKey(spec.rounds[0])) }] }, accent }),
  };
}
export const zero: EngineDef<ZeroSpec> = { archetype: "zero-pair@1", label: "Game · Zero Pair Lab", accent: C.ion, create };
