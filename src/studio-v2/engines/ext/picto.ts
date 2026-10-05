// DATA DESK — `pictograph@1` (VALUES-100 V3.1: data handling). Tally a live stream as it passes the gate (tap the
// right counter; tally marks bundle in fives), draw pictograph rows with a key (full and half symbols), drag bars to
// their counts on a scaled axis, and call claims about a chart TRUE or FALSE before they land — on an axis that may
// not start at zero. The host grades each row, bar, tally or call from the spec's counts.
import { claimText, claimTruth, tallyStream, type PdRoundT, type PictoSpec } from "../../../../shared/studio-spec-ext/picto.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, rng } from "../../core/math.ts";
import { magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, textBlock } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const CHECK = { x: 830, y: 500, w: 140, h: 66 }, COLS = [C.ion, C.sci, C.amber, "#FF8FB1", C.mint];
function create(api: EngineApi, spec: PictoSpec): EngineInstance {
  const T = spec.strings, accent = C.sci;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 137 + 1);
  const g = { stream: [] as number[], si: 0, items: [] as { cat: number; x: number }[], spawnT: 0, tally: [] as number[], sym: [] as number[], bars: [] as number[], drag: -1, ci: 0, claimY: 0, answered: false, verdicts: [] as string[], revealT: 0, right: 0, n: 0, coachA: 1, coachGone: false };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "right", label: T.right }]);
  const rd = (): PdRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) { const r = spec.rounds[k]; g.stream = tallyStream(r); g.si = 0; g.items = []; g.spawnT = 0.5; g.tally = r.cats.map(() => 0); g.sym = r.cats.map(() => 0); g.bars = r.cats.map(() => r.axisStart); g.ci = 0; g.claimY = 150; g.answered = false; g.verdicts = []; g.revealT = 0; api.task(`${T.round} ${k + 1}`, r.sub || r.title); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 }); },
    onEnd(k) { api.event("round_end", { round: k + 1 }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function submitAll() {
    if (g.answered) return; const r = rd(); g.answered = true; g.revealT = 0;
    r.cats.forEach((c, i) => { const v = r.mode === "tally" ? g.tally[i] : r.mode === "picto" ? g.sym[i] : g.bars[i]; const got = r.mode === "picto" ? v * r.scale : v; const grade = api.answer(`r${flow.round + 1}:${i}`, v, got === c.count ? "right" : "wrong"); g.verdicts[i] = grade.verdict; g.n++; if (grade.verdict === "right") g.right++; });
    const allOk = g.verdicts.every((v) => v === "right");
    if (allOk) { api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(40); } else sfx.blip({ f: 230, f2: 140, dur: 0.22, gain: 0.15 });
    api.facts({ round: flow.round + 1, mode: r.mode, rows: g.verdicts.join(",") });
  }
  function call(v: boolean) {
    const r = rd(); if (g.ci >= r.claims.length) return;
    const t = claimTruth(r, r.claims[g.ci]), grade = api.answer(`r${flow.round + 1}:${g.ci}`, v, v === t ? "right" : "wrong");
    g.verdicts[g.ci] = grade.verdict; g.n++; if (grade.verdict === "right") { g.right++; sfx.blip({ f: 600, f2: 900, dur: 0.12, type: "triangle", gain: 0.14 }); api.fx.burst(500, g.claimY, { n: 16, color: C.mint, speed: 300, life: 0.4, size: 8 }); } else { sfx.blip({ f: 220, f2: 140, dur: 0.2, gain: 0.14 }); api.fx.shake(3, 0.15); }
    g.ci++; g.claimY = 150; if (g.ci >= r.claims.length) { g.answered = true; g.revealT = 0; }
  }
  const counterBtns = () => { const n = rd().cats.length, w = Math.min(180, (W - 100) / n - 14); return rd().cats.map((c, i) => ({ i, x: 60 + i * ((W - 100) / n), y: 440, w, h: 140 })); };
  const rowY = (i: number) => 196 + i * 72;
  const AX = { x0: 210, y0: 500, h: 290 }, barX = (i: number) => AX.x0 + 40 + i * Math.min(130, 560 / rd().cats.length), barW = () => Math.min(90, 560 / rd().cats.length - 30);
  const maxV = () => { const r = rd(); const m = Math.max(...r.cats.map((c) => c.count)); return Math.ceil((m * 1.15) / r.scale) * r.scale; };
  const yOf = (v: number) => { const r = rd(); return AX.y0 - ((v - r.axisStart) / Math.max(1, maxV() - r.axisStart)) * AX.h; };
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      const r = rd();
      if (r.mode === "claims") { if (p.y >= 470 && p.y <= 570) call(p.x < 500); return; }
      if (p.x >= CHECK.x && p.x <= CHECK.x + CHECK.w && p.y >= CHECK.y && p.y <= CHECK.y + CHECK.h && r.mode !== "tally") { submitAll(); return; }
      if (r.mode === "tally") { const b = counterBtns().find((q) => p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h); if (b) { g.tally[b.i]++; sfx.blip({ f: 520 + b.i * 80, dur: 0.05, type: "triangle", gain: 0.08 }); api.record("tally", { cat: b.i }); } return; }
      if (r.mode === "picto") {
        r.cats.forEach((_, i) => { const y = rowY(i); if (p.y < y - 30 || p.y > y + 30) return; if (p.x >= 640 && p.x <= 710) { g.sym[i] = Math.min(10, g.sym[i] + 1); api.record("picto", { row: i, add: 1 }); } else if (p.x >= 720 && p.x <= 790) { g.sym[i] = Math.min(10, g.sym[i] + 0.5); api.record("picto", { row: i, add: 0.5 }); } else if (p.x >= 330 && p.x <= 630 && g.sym[i] > 0) { g.sym[i] = Math.max(0, g.sym[i] - (g.sym[i] % 1 ? 0.5 : 1)); api.record("picto", { row: i, remove: true }); } });
        return;
      }
      r.cats.forEach((_, i) => { const x = barX(i); if (p.x >= x - 20 && p.x <= x + barW() + 20 && p.y >= AX.y0 - AX.h - 40 && p.y <= AX.y0 + 10) { g.drag = i; drag(p.y); } });
    },
    move(p) { if (g.drag >= 0) drag(p.y); },
    up() { if (g.drag >= 0) { api.record("bars", { bar: g.drag, v: g.bars[g.drag] }); g.drag = -1; } },
  });
  function drag(y: number) { const r = rd(), v = r.axisStart + ((AX.y0 - y) / AX.h) * (maxV() - r.axisStart), snap = r.scale <= 2 ? 1 : r.scale / 2; g.bars[g.drag] = clamp(Math.round(v / snap) * snap, r.axisStart, maxV()); }
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    const r = rd();
    if (r.mode === "tally" && !g.answered) {
      g.spawnT -= dt; if (g.si < g.stream.length && g.spawnT <= 0) { g.items.push({ cat: g.stream[g.si++], x: W + 60 }); g.spawnT = 1.5 / r.speed; }
      for (const it of g.items) it.x -= 150 * r.speed * dt;
      g.items = g.items.filter((it) => it.x > -80);
      if (g.si >= g.stream.length && g.items.length === 0) submitAll();
    }
    if (r.mode === "claims" && !g.answered) { g.claimY += 44 * r.speed * dt; if (g.claimY > 430) call(!claimTruth(r, r.claims[g.ci])); }
    if (g.answered) { g.revealT += dt; if (g.revealT > 3.2) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("right", `${g.right}/${g.n}`, { bump: true });
  }
  function marks(ctx: Ctx, n: number, x: number, y: number) { for (let k = 0; k < n; k++) { const grp = Math.floor(k / 5), i = k % 5, gx = x + grp * 46; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); if (i < 4) { ctx.moveTo(gx + i * 8, y - 16); ctx.lineTo(gx + i * 8, y + 16); } else { ctx.moveTo(gx - 4, y + 12); ctx.lineTo(gx + 30, y - 12); } ctx.stroke(); } }
  function paintBg(c: Ctx) { backdrop(c, accent, 101, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "tally") {
      ctx.fillStyle = "#121621"; ctx.fillRect(0, 300, W, 14);
      ctx.save(); ctx.strokeStyle = hexA(C.volt, 0.6); ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(500, 190); ctx.lineTo(500, 320); ctx.stroke(); ctx.restore();
      for (const it of g.items) { const c = r.cats[it.cat]; ctx.save(); ctx.fillStyle = "rgba(22,26,36,.96)"; roundRect(ctx, it.x - 54, 214, 108, 84, 16); ctx.fill(); ctx.strokeStyle = COLS[it.cat % 5]; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); if (c.glyph) drawGlyph(ctx, c.glyph, it.x, 256, 56, C.ink, hexA(COLS[it.cat % 5], 0.35)); else api.text(ctx, c.label.slice(0, 1), it.x, 258, { font: "display", size: 44, weight: 800, align: "center", baseline: "middle" }); }
      counterBtns().forEach((b) => { const c = r.cats[b.i], col = COLS[b.i % 5], v = g.verdicts[b.i]; ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, b.x, b.y, b.w, b.h, 18); ctx.fill(); ctx.strokeStyle = done ? (v === "right" ? C.mint : C.amber) : col; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); api.text(ctx, c.label, b.x + b.w / 2, b.y + 30, { size: 38, weight: 700, align: "center", baseline: "middle", maxWidth: b.w - 12 }); marks(ctx, g.tally[b.i], b.x + 18, b.y + 92); if (done) api.text(ctx, String(c.count), b.x + b.w - 24, b.y + 92, { font: "display", size: 40, weight: 800, color: v === "right" ? C.mint : C.amber, align: "center", baseline: "middle" }); });
    } else if (r.mode === "picto") {
      pill(api, ctx, `${T.key} ${r.scale}`, 600, 150, { color: accent, size: 38 });
      r.cats.forEach((c, i) => {
        const y = rowY(i), v = g.verdicts[i];
        api.text(ctx, c.label, 70, y + 2, { size: 38, weight: 700, baseline: "middle", maxWidth: 200 });
        api.text(ctx, String(c.count), 300, y + 2, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "right", baseline: "middle" });
        for (let k = 0; k < Math.ceil(g.sym[i]); k++) { const half = k + 1 > g.sym[i], x = 345 + k * 30; ctx.save(); if (half) { ctx.beginPath(); ctx.rect(x - 14, y - 20, 14, 40); ctx.clip(); } if (c.glyph) drawGlyph(ctx, c.glyph, x, y, 34, C.ink, hexA(COLS[i % 5], 0.6)); else { ctx.fillStyle = COLS[i % 5]; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
        for (const [bx, lab] of [[640, "+"], [720, T.half]] as [number, string][]) { ctx.save(); ctx.fillStyle = done ? "rgba(255,255,255,.04)" : "rgba(22,26,36,.95)"; roundRect(ctx, bx, y - 28, 70, 56, 12); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); api.text(ctx, lab, bx + 35, y + 2, { font: "display", size: 40, weight: 800, align: "center", baseline: "middle" }); }
        if (done) { if (v === "right") tick(ctx, 815, y, C.mint, 0.8); else { magnifier(ctx, 815, y, C.amber, 0.8); api.text(ctx, String(c.count / r.scale), 870, y + 2, { font: "mono", size: 38, weight: 600, color: C.amber, baseline: "middle" }); } }
      });
    } else {
      const mx = maxV();
      ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(AX.x0, AX.y0 - AX.h - 10); ctx.lineTo(AX.x0, AX.y0); ctx.lineTo(AX.x0 + 600, AX.y0); ctx.stroke(); ctx.restore();
      if (r.axisStart > 0) { ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(AX.x0 - 12, AX.y0 - 10); ctx.lineTo(AX.x0 + 12, AX.y0 - 18); ctx.moveTo(AX.x0 - 12, AX.y0 - 2); ctx.lineTo(AX.x0 + 12, AX.y0 - 10); ctx.stroke(); ctx.restore(); }
      const step = Math.max(r.scale, Math.ceil((mx - r.axisStart) / 6 / r.scale) * r.scale);
      for (let v = r.axisStart; v <= mx + 1e-6; v += step) { const y = yOf(v); ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(AX.x0, y); ctx.lineTo(AX.x0 + 600, y); ctx.stroke(); api.text(ctx, String(v), AX.x0 - 14, y, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "right", baseline: "middle" }); }
      r.cats.forEach((c, i) => {
        const x = barX(i), bw = barW(), v = r.mode === "claims" ? c.count : g.bars[i], y = yOf(v), col = COLS[i % 5], vd = g.verdicts[i];
        ctx.save(); ctx.fillStyle = hexA(col, 0.8); roundRect(ctx, x, y, bw, AX.y0 - y, 6); ctx.fill(); if (r.mode === "bars" && !done) { ctx.strokeStyle = g.drag === i ? C.volt : C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + bw + 6, y); ctx.stroke(); } ctx.restore();
        api.text(ctx, c.label, x + bw / 2, AX.y0 + 30, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: bw + 30 });
        if (r.mode === "bars") { api.text(ctx, String(c.count), x + bw / 2, 172, { font: "mono", size: 38, weight: 600, color: done ? (vd === "right" ? C.mint : C.amber) : C.ink, align: "center", baseline: "middle" }); }
      });
      if (r.mode === "claims") {
        const c = r.claims[Math.min(g.ci, r.claims.length - 1)];
        if (!done) { ctx.save(); ctx.fillStyle = "rgba(22,26,36,.97)"; roundRect(ctx, 600 - 40, g.claimY - 40, 380, 80, 18); ctx.fill(); ctx.strokeStyle = C.volt; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); textBlock(api, ctx, claimText(r, c, T.total), 750, g.claimY, 350, { font: "display", size: 40, weight: 800 }, 1); }
        for (const [x, lab] of [[300, T.trueW], [700, T.falseW]] as [number, string][]) { ctx.save(); ctx.fillStyle = "rgba(22,26,36,.95)"; roundRect(ctx, x - 160, 480, 320, 80, 18); ctx.fill(); ctx.strokeStyle = done ? C.line : C.volt; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, lab, x, 522, { font: "display", size: 44, weight: 800, color: done ? C.ink3 : C.ink, align: "center", baseline: "middle" }); }
        if (done) pill(api, ctx, `${g.verdicts.filter((v) => v === "right").length}/${r.claims.length}`, 750, 300, { color: C.ion, size: 44 });
      }
    }
    if (r.mode === "picto" || r.mode === "bars") { const on = !done; ctx.save(); ctx.fillStyle = on ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, CHECK.x, CHECK.y, CHECK.w, CHECK.h, 16); ctx.fill(); ctx.strokeStyle = on ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, T.check, CHECK.x + CHECK.w / 2, CHECK.y + CHECK.h / 2 + 2, { font: "display", size: 38, weight: 800, color: on ? C.volt : C.ink3, align: "center", baseline: "middle" }); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.verdicts.filter((v) => v === "right").length}/${g.verdicts.length}`, T.right]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.right]] });
    drawCoach(api, ctx, T.coach, flow.state === "play" && r.mode === "tally" ? g.coachA : 0, now, 150);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.08;
    if (r.mode === "tally") { const it = g.items.find((q) => q.x < 520 && q.x > 420 && !(q as { seen?: boolean }).seen); if (!it) return { type: "wait", ms: 80 }; (it as { seen?: boolean }).seen = true; const b = counterBtns()[slip ? (it.cat + 1) % r.cats.length : it.cat]; return { type: "tap", at: [b.x + b.w / 2, b.y + 60], after: 60 }; }
    if (r.mode === "picto") { for (let i = 0; i < r.cats.length; i++) { const want = r.cats[i].count / r.scale; if (g.sym[i] + 1 <= want) return { type: "tap", at: [675, rowY(i)], after: 120 }; if (g.sym[i] + 0.5 <= want) return { type: "tap", at: [755, rowY(i)], after: 120 }; } return { type: "tap", at: [CHECK.x + 70, CHECK.y + 33], after: 600 }; }
    if (r.mode === "bars") { for (let i = 0; i < r.cats.length; i++) if (g.bars[i] !== r.cats[i].count) { const x = barX(i) + barW() / 2; return { type: "drag", from: [x, yOf(g.bars[i])], to: [x, yOf(r.cats[i].count)], ms: 300, after: 200 }; } return { type: "tap", at: [CHECK.x + 70, CHECK.y + 33], after: 600 }; }
    if (g.claimY < 230) return { type: "wait", ms: 300 };
    const t = claimTruth(r, r.claims[g.ci]) !== slip; return { type: "tap", at: [t ? 300 : 700, 520], after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, tally: g.tally, sym: g.sym, bars: g.bars, claim: g.ci, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => { const r0 = spec.rounds[0]; return { title: spec.title, lines: [r0.cats.map((c) => `${c.label} ${c.count}`).join(" · ")], figure: { kind: "bars", values: r0.cats.map((c) => c.count), labels: r0.cats.map((c) => c.label.slice(0, 6)) }, accent }; },
  };
}
export const picto: EngineDef<PictoSpec> = { archetype: "pictograph@1", label: "Game · Data Desk", accent: C.sci, create };
