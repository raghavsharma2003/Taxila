// FAIR TEST LAB — `fair-test@1` (VALUES-100 V3.1: the science process). A bench of 2-4 setups; the model (shared, pure)
// grows sprouts, rust, mould, sets curd, dries cloth, dissolves sugar, floats clay, keeps or kills a flame over a
// time-lapse the child launches. The acts are scientific: predict (tap every setup that will show it), design a fair
// test (cycle the condition chips so the setups differ in ONE thing), conclude (tap the factor that matters), or drip
// base into acid and stop at the colour change. The host grades every act from the spec through the same model.
import { FT_MODELS, dripKey, ftShows, type FairSpec, type FtRoundT } from "../../../../shared/studio-spec-ext/fair.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, ease, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawCoach, drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, textBlock, voltBox } from "./kit.ts";
import { drawGlyph } from "./glyphs.ts";

const RUN = { x: 22, y: 96, w: 150, h: 64 }, BOX_Y = 192, CHIP_H = 50;
function create(api: EngineApi, spec: FairSpec): EngineInstance {
  const T = spec.strings, accent = C.sci, M = FT_MODELS[spec.model];
  const BOX_H = Math.min(214, 604 - BOX_Y - 14 - M.vars.length * (CHIP_H + 8));
  const devaNeeded = /[ऀ-ॿ]/.test(JSON.stringify(spec));
  let fontOk = !devaNeeded; if (devaNeeded) void devaReady().then(() => { fontOk = true; });
  const botR = rng(api.seed * 83 + 7);
  const g = { setups: [] as Record<string, string>[], sel: new Set<number>(), day: 0, running: false, ran: false, verdict: "", answered: false, pick: null as string | null, drops: 0, holding: false, dripT: 0,
    right: 0, n: 0, coachA: 1, coachGone: false, diff: [] as string[], doneT: 0 };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "calls", label: T.correct }, { key: "day", label: T.day }]);
  const rd = (): FtRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k]; g.sel.clear(); g.day = 0; g.running = false; g.ran = false; g.verdict = ""; g.answered = false; g.pick = null; g.drops = 0; g.diff = []; g.doneT = 0;
      g.setups = r.mode === "predict" ? r.setups.map((c) => ({ ...c })) : r.mode === "design" ? r.start.map((c) => ({ ...c })) : r.mode === "conclude" ? [] : [];
      api.event("round_start", { round: k + 1, mode: r.mode, model: spec.model });
      api.task(`${T.round} ${k + 1}`, r.mode === "predict" ? `${T.predict}: ${M.outcome}` : r.mode === "design" ? `${T.design}: ${M.vars.find((v) => v.id === (r as Extract<FtRoundT, { mode: "design" }>).vary)?.label ?? ""}` : r.mode === "conclude" ? (r.ask === "matters" ? T.conclude : T.notMatter) : T.drip);
      sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  const nS = () => g.setups.length;
  const boxW = () => Math.min(220, (W - 120) / Math.max(1, nS()) - 24);
  const boxX = (i: number) => { const n = nS(), w = boxW(), gap = (W - 80 - n * w) / (n + 1); return 40 + gap + i * (w + gap); };
  function judge(itemValue: unknown, local: string) {
    const grade = api.answer(`r${flow.round + 1}`, itemValue, local);
    g.verdict = grade.verdict; g.answered = true; g.n++; if (grade.verdict === "right") g.right++;
    if (grade.verdict === "right") { api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.22, type: "triangle", gain: 0.18 }); api.hitstop(50); }
    else sfx.blip({ f: 230, f2: 140, dur: 0.24, gain: 0.16 });
    return grade;
  }
  function run() {
    const r = rd(); if (g.running || g.ran || flow.state !== "play") return;
    if (r.mode === "predict") { const truth = g.setups.map((c, i) => (ftShows(M, c) ? i : -1)).filter((i) => i >= 0); const pick = [...g.sel].sort(); judge(pick, pick.length === truth.length && pick.every((v, i) => v === truth[i]) ? "right" : "wrong"); }
    if (r.mode === "design") { g.diff = M.vars.filter((v) => g.setups[0][v.id] !== g.setups[1][v.id]).map((v) => v.id); const fair = g.diff.length === 1 && g.diff[0] === r.vary; judge(g.setups.map((c) => ({ ...c })), fair ? "right" : "wrong"); }
    g.running = true; g.day = 0; api.event("run", { setups: g.setups });
    sfx.blip({ f: 200, f2: 600, dur: 0.4, type: "sawtooth", gain: 0.06 });
  }
  api.onPointer({
    down(p) {
      if (flow.state !== "play") return;
      if (!g.coachGone) { g.coachGone = true; api.tw.add(g, { coachA: 0 }, { dur: 0.3 }); }
      const r = rd();
      if (r.mode === "drip") { if (!g.answered) { g.holding = true; } return; }
      if (r.mode === "conclude") {
        if (g.answered) return;
        r.options.forEach((o, i) => { const { x, y, w, h } = optRect(i, r.options.length); if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) { g.pick = o; const key = r.options.find((q) => (r.ask === "matters") === M.matters.includes(q)); judge(o, o === key ? "right" : "wrong"); g.doneT = 0; } });
        return;
      }
      if (p.x >= RUN.x && p.x <= RUN.x + RUN.w && p.y >= RUN.y && p.y <= RUN.y + RUN.h) { run(); return; }
      if (g.running || g.ran) return;
      for (let i = 0; i < nS(); i++) {
        const x = boxX(i), w = boxW();
        if (r.mode === "predict" && p.x >= x && p.x <= x + w && p.y >= BOX_Y && p.y <= BOX_Y + BOX_H) { if (g.sel.has(i)) g.sel.delete(i); else g.sel.add(i); sfx.blip({ f: 440, dur: 0.06, type: "triangle", gain: 0.08 }); api.record("select", { i, on: g.sel.has(i) }); return; }
        if (r.mode === "design") M.vars.forEach((v, vi) => {
          const cy = BOX_Y + BOX_H + 14 + vi * (CHIP_H + 8);
          if (p.x >= x && p.x <= x + w && p.y >= cy && p.y <= cy + CHIP_H) { const vals = v.values.map((q) => q.id), k = vals.indexOf(g.setups[i][v.id]); g.setups[i][v.id] = vals[(k + 1) % vals.length]; sfx.blip({ f: 520, dur: 0.05, type: "square", gain: 0.05 }); api.record("chip", { setup: i, v: v.id, to: g.setups[i][v.id] }); }
        });
      }
    },
    up() {
      const r = rd();
      if (r?.mode === "drip" && g.holding && !g.answered) { g.holding = false; const key = dripKey(r.acid); judge(g.drops, g.drops === key ? "right" : Math.abs(g.drops - key) <= 1 ? "partial" : "wrong"); g.doneT = 0; }
    },
  });
  function optRect(i: number, n: number) { const w = Math.min(260, (W - 160) / n - 20), gap = (W - n * w) / (n + 1); return { x: gap + i * (w + gap), y: 300, w, h: 110 }; }
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    if (flow.state !== "play") return;
    const r = rd();
    if (g.running) { g.day += dt * (M.days / 4.2); if (g.day >= M.days) { g.day = M.days; g.running = false; g.ran = true; g.doneT = 0; api.facts({ model: spec.model, results: g.setups.map((c) => (ftShows(M, c) ? M.outcome : "no")).join(",") }); } }
    if (g.ran || (g.answered && (r.mode === "conclude" || r.mode === "drip"))) { g.doneT += dt; if (g.doneT > 3.0) flow.endRound(); }
    if (r.mode === "drip" && g.holding && !g.answered) { g.dripT += dt; if (g.dripT > 0.32) { g.dripT = 0; g.drops++; sfx.blip({ f: 900, dur: 0.03, type: "sine", gain: 0.06 }); api.record("drops", { n: g.drops }); } }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("calls", `${g.right}/${g.n}`, { bump: true }); hud.set("day", r.mode === "drip" ? String(g.drops) : g.day.toFixed(M.days > 2 ? 0 : 1));
    if (r.mode === "drip") hud.label("day", T.drops);
  }
  // ── the setups, drawn by model
  function drawSetup(ctx: Ctx, c: Record<string, string>, x: number, y: number, w: number, h: number, now: number) {
    const p = M.result(c, g.day), cx = x + w / 2, by = y + h - 18;
    const cold = c.warmth === "cold" || c.temp === "cold", dark = c.light === "dark";
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.clip();
    if (cold) { ctx.fillStyle = "rgba(160,200,255,.10)"; ctx.fillRect(x, y, w, h); }
    switch (spec.model) {
      case "germination": {
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.ellipse(cx, by - 16, w * 0.4, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.water === "moist" ? "rgba(120,170,255,.35)" : "rgba(230,220,200,.35)"; ctx.beginPath(); ctx.ellipse(cx, by - 20, w * 0.36, 16, 0, 0, Math.PI * 2); ctx.fill();
        if (c.air === "no") { ctx.fillStyle = "rgba(80,140,255,.35)"; ctx.fillRect(x + w * 0.12, by - 110, w * 0.76, 92); ctx.strokeStyle = "rgba(160,200,255,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.12, by - 110); ctx.lineTo(x + w * 0.88, by - 110); ctx.stroke(); }
        for (let s = 0; s < 4; s++) { const sx = cx - 45 + s * 30; ctx.fillStyle = "#C9A46A"; ctx.beginPath(); ctx.ellipse(sx, by - 22, 8, 5, 0.3, 0, Math.PI * 2); ctx.fill();
          if (p > 0) { const hh = 90 * p * (0.8 + 0.2 * Math.sin(s * 2.1)); ctx.strokeStyle = "#5BD38A"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, by - 24); ctx.quadraticCurveTo(sx + 8, by - 24 - hh * 0.5, sx + 2, by - 24 - hh); ctx.stroke(); if (p > 0.6) { ctx.fillStyle = "#5BD38A"; ctx.beginPath(); ctx.ellipse(sx + 10, by - 24 - hh, 10, 5, -0.5, 0, Math.PI * 2); ctx.fill(); } } }
        if (dark) { ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x, y, w, h); }
        break;
      }
      case "rusting": {
        const tx = cx - 30, tw = 60;
        ctx.strokeStyle = "rgba(220,230,255,.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, y + 30); ctx.lineTo(tx, by - 10); ctx.arc(cx, by - 10, 30, Math.PI, 0, true); ctx.lineTo(tx + tw, y + 30); ctx.stroke();
        if (c.water === "yes") { ctx.fillStyle = "rgba(90,150,255,.3)"; ctx.fillRect(tx + 2, by - 110, tw - 4, 100); if (c.air === "no") { ctx.fillStyle = "rgba(255,210,90,.55)"; ctx.fillRect(tx + 2, by - 118, tw - 4, 10); } }
        if (c.air === "no" && c.water !== "yes") { ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect(tx - 4, y + 22, tw + 8, 10); }
        ctx.fillStyle = c.coat === "paint" ? "#4F7BD8" : "#9AA3B5"; ctx.fillRect(cx - 5, y + 50, 10, by - y - 70); ctx.fillRect(cx - 14, y + 44, 28, 8);
        if (p > 0) { const rr = rng(7); ctx.fillStyle = `rgba(160,82,45,${0.5 + 0.4 * p})`; for (let k = 0; k < 18 * p; k++) { ctx.beginPath(); ctx.arc(cx + (rr() - 0.5) * 12, y + 56 + rr() * (by - y - 80), 3 + rr() * 4, 0, Math.PI * 2); ctx.fill(); } }
        if (c.salt === "yes") api.text(ctx, "NaCl", x + w - 12, y + 30, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "right", baseline: "middle", decor: true });
        break;
      }
      case "spoilage": {
        ctx.fillStyle = c.moisture === "dry" ? "#C8A877" : "#D9B98A"; ctx.beginPath(); ctx.roundRect(cx - 60, by - 110, 120, 96, 24); ctx.fill();
        if (c.salt === "yes") { ctx.fillStyle = "rgba(255,255,255,.9)"; const rr = rng(3); for (let k = 0; k < 30; k++) ctx.fillRect(cx - 55 + rr() * 110, by - 105 + rr() * 86, 2.5, 2.5); }
        if (p > 0) { const rr = rng(11); for (let k = 0; k < 14; k++) { const r0 = (4 + rr() * 12) * p; ctx.fillStyle = k % 3 ? "rgba(110,160,90,.85)" : "rgba(80,90,80,.85)"; ctx.beginPath(); ctx.arc(cx - 50 + rr() * 100, by - 100 + rr() * 78, r0, 0, Math.PI * 2); ctx.fill(); } }
        if (c.lid === "covered") { ctx.strokeStyle = "rgba(220,230,255,.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, by - 14, 80, Math.PI, 0); ctx.stroke(); }
        break;
      }
      case "curd": {
        ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.ellipse(cx, by - 40, 74, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 74, by - 40); ctx.quadraticCurveTo(cx, by + 30, cx + 74, by - 40); ctx.fill();
        ctx.fillStyle = `rgb(${lerp(245, 238, p)},${lerp(245, 230, p)},${lerp(240, 205, p)})`; ctx.beginPath(); ctx.ellipse(cx, by - 40, 66, 14, 0, 0, Math.PI * 2); ctx.fill();
        if (p > 0.7) { ctx.strokeStyle = "rgba(200,190,160,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx + 10, by - 42, 30, 6, 0.2, 0, Math.PI); ctx.stroke(); }
        if (c.temp === "boiling") for (let k = 0; k < 3; k++) { const u = (now * 0.5 + k / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - u)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 20 + k * 20, by - 60 - u * 60); ctx.quadraticCurveTo(cx - 10 + k * 20, by - 80 - u * 60, cx - 20 + k * 20, by - 100 - u * 60); ctx.stroke(); }
        if (c.starter === "yes") drawGlyph(ctx, "drop", cx + 60, by - 120, 34, C.ink, "rgba(255,255,255,.5)");
        break;
      }
      case "drying": {
        ctx.strokeStyle = C.ink3; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 10, y + 50); ctx.lineTo(x + w - 10, y + 50); ctx.stroke();
        const wet = 1 - p, cw = c.spread === "spread" ? w * 0.7 : w * 0.38;
        ctx.fillStyle = `rgb(${lerp(200, 60, wet)},${lerp(120, 50, wet)},${lerp(140, 90, wet)})`; ctx.fillRect(cx - cw / 2, y + 52, cw, c.spread === "spread" ? 100 : 130);
        if (wet > 0.15) for (let k = 0; k < 3; k++) { const u = (now * 0.8 + k / 3) % 1; ctx.fillStyle = `rgba(120,170,255,${0.7 * wet})`; ctx.beginPath(); ctx.arc(cx - 20 + k * 20, y + 160 + u * 40, 4, 0, Math.PI * 2); ctx.fill(); }
        if (c.sun === "yes") drawGlyph(ctx, "sun", x + w - 34, y + 26, 36, C.sun, hexA(C.sun, 0.4));
        if (c.wind === "yes") drawGlyph(ctx, "wind", x + 30, by - 20, 40, C.ink2, "rgba(0,0,0,0)");
        if (c.humid === "yes") { ctx.fillStyle = "rgba(200,210,230,.12)"; ctx.fillRect(x, y, w, h); }
        break;
      }
      case "dissolving": {
        ctx.strokeStyle = "rgba(220,230,255,.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 60, y + 40); ctx.lineTo(cx - 60, by); ctx.lineTo(cx + 60, by); ctx.lineTo(cx + 60, y + 40); ctx.stroke();
        ctx.fillStyle = c.temp === "hot" ? "rgba(255,150,120,.18)" : "rgba(120,170,255,.2)"; ctx.fillRect(cx - 58, y + 80, 116, by - y - 82);
        const left = 1 - p;
        if (left > 0.02) { ctx.fillStyle = "rgba(255,255,255,.9)"; if (c.grain === "lump") { const s = 30 * Math.sqrt(left); ctx.fillRect(cx - s / 2, by - s - 2, s, s); } else { ctx.beginPath(); ctx.ellipse(cx, by - 6, 40 * left + 4, 10 * left + 2, 0, Math.PI, 0); ctx.fill(); } }
        if (c.stir === "yes" && g.running) { const a = now * 6; ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 30, by - 30); ctx.lineTo(cx + Math.cos(a) * 10, y + 30); ctx.stroke(); }
        break;
      }
      case "float": {
        ctx.fillStyle = c.liquid === "salt" ? "rgba(120,200,220,.3)" : "rgba(90,150,255,.3)"; ctx.fillRect(x + 12, y + 70, w - 24, by - y - 62);
        const ran = g.running || g.ran, k = ran ? ease.outCubic(clamp(g.day / M.days * 1.5, 0, 1)) : 0, fl = M.result(c, M.days) > 0.5;
        const oy = fl ? y + 70 : lerp(y + 70, by - 22, k), col = c.colour === "red" ? "#B5543A" : "#7D8494";
        ctx.fillStyle = col; if (c.shape === "boat") { ctx.beginPath(); ctx.moveTo(cx - 40, oy - 8); ctx.lineTo(cx + 40, oy - 8); ctx.lineTo(cx + 26, oy + 14); ctx.lineTo(cx - 26, oy + 14); ctx.closePath(); ctx.fill(); } else { ctx.beginPath(); ctx.arc(cx, oy, 18, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case "combustion": {
        ctx.fillStyle = "#E8E2D0"; ctx.fillRect(cx - 14, by - 90, 28, 80); ctx.strokeStyle = "#333"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, by - 90); ctx.lineTo(cx, by - 100); ctx.stroke();
        if (c.fuel === "no") { ctx.fillStyle = "rgba(10,12,18,.8)"; ctx.fillRect(cx - 14, by - 90, 28, 80); }
        const f = g.running || g.ran ? p : c.fuel === "yes" && c.flame === "yes" ? 1 : 0;
        if (f > 0.02) { bloom(ctx, C.amber, cx, by - 116, 50 * f, 0.6); drawGlyph(ctx, "fire", cx, by - 118, 40 * (0.5 + 0.5 * f) * (1 + 0.06 * Math.sin(now * 14)), "#FFD27A", hexA(C.amber, 0.8)); }
        if (c.air === "no") { ctx.strokeStyle = "rgba(220,230,255,.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 60, by); ctx.lineTo(cx - 60, y + 40); ctx.quadraticCurveTo(cx, y + 10, cx + 60, y + 40); ctx.lineTo(cx + 60, by); ctx.stroke(); }
        break;
      }
    }
    ctx.restore();
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 31, 0); }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return;
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "predict" || r.mode === "design") {
      // the sun / moon arc during the time-lapse
      const night = g.running ? 0.5 - 0.5 * Math.cos(g.day * Math.PI * 2) : 0;   // day / night breathing during the time-lapse
      for (let i = 0; i < nS(); i++) {
        const x = boxX(i), w = boxW(), c = g.setups[i], shows = ftShows(M, c), sel = g.sel.has(i);
        const edge = g.ran ? (shows ? C.mint : C.line2) : sel ? C.volt : hexA(accent, 0.6);
        ctx.save(); ctx.fillStyle = "rgba(18,22,32,.96)"; roundRect(ctx, x, BOX_Y, w, BOX_H, 18); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = sel || g.ran ? 4 : 3; ctx.stroke(); ctx.restore();
        drawSetup(ctx, c, x, BOX_Y, w, BOX_H, now);
        if (night > 0.02) { ctx.save(); ctx.fillStyle = `rgba(5,8,20,${0.35 * night})`; roundRect(ctx, x, BOX_Y, w, BOX_H, 18); ctx.fill(); ctx.restore(); }
        api.text(ctx, String(i + 1), x + 22, BOX_Y + 26, { font: "display", size: 38, weight: 800, color: C.ink3, align: "center", baseline: "middle" });
        if (sel && !g.ran && r.mode === "predict") voltBox(ctx, x, BOX_Y, w, BOX_H, now, 18);
        if (g.ran && r.mode === "predict") { const want = shows, got = sel; if (want === got) tick(ctx, x + w - 18, BOX_Y + 20, C.mint, 0.8); else magnifier(ctx, x + w - 22, BOX_Y + 22, C.amber, 0.8); }
        // condition chips
        M.vars.forEach((v, vi) => {
          const cy = BOX_Y + BOX_H + 14 + vi * (CHIP_H + 8), val = v.values.find((q) => q.id === c[v.id])?.label ?? "";
          const differs = r.mode === "design" && (g.ran || g.running) && g.diff.includes(v.id), isVary = r.mode === "design" && v.id === r.vary;
          const ce = differs ? (g.diff.length === 1 && isVary ? C.mint : C.amber) : r.mode === "design" && !g.running && !g.ran ? hexA(C.ink, 0.35) : C.line;
          ctx.save(); ctx.fillStyle = differs ? hexA(ce, 0.14) : "rgba(22,26,36,.9)"; roundRect(ctx, x, cy, w, CHIP_H, 14); ctx.fill(); ctx.strokeStyle = ce; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
          api.text(ctx, val, x + w / 2, cy + CHIP_H / 2 + 1, { size: 38, weight: 600, color: C.ink, align: "center", baseline: "middle", maxWidth: w - 12 });
        });
      }
      // RUN
      const can = !g.running && !g.ran;
      ctx.save(); if (can) bloom(ctx, C.volt, RUN.x + RUN.w / 2, RUN.y + RUN.h / 2, 90, 0.25); ctx.fillStyle = can ? "rgba(203,255,77,.14)" : "rgba(255,255,255,.04)"; roundRect(ctx, RUN.x, RUN.y, RUN.w, RUN.h, 16); ctx.fill(); ctx.strokeStyle = can ? C.volt : C.line2; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      api.text(ctx, T.run, RUN.x + RUN.w / 2, RUN.y + RUN.h / 2 + 2, { font: "display", size: 40, weight: 800, color: can ? C.volt : C.ink3, align: "center", baseline: "middle" });
      if (r.mode === "design" && g.answered) pill(api, ctx, g.verdict === "right" ? T.fair : T.unfair, 500, BOX_Y - 6, { color: g.verdict === "right" ? C.mint : C.amber, size: 38 });
    } else if (r.mode === "conclude") {
      textBlock(api, ctx, `${M.outcome}?`, 500, 220, 700, { font: "display", size: 52, weight: 800 }, 1);
      r.options.forEach((o, i) => {
        const { x, y, w, h } = optRect(i, r.options.length), key = r.options.find((q) => (r.ask === "matters") === M.matters.includes(q)), isKey = o === key, chosen = g.pick === o;
        const edge = g.answered ? (isKey ? C.mint : chosen ? C.amber : C.line2) : hexA(accent, 0.7);
        ctx.save(); ctx.fillStyle = "rgba(18,22,32,.96)"; roundRect(ctx, x, y, w, h, 20); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        textBlock(api, ctx, M.vars.find((v) => v.id === o)?.label ?? o, x + w / 2, y + h / 2, w - 20, { size: 44, weight: 700 }, 2);
        if (!g.answered) { const p = 0.5 + 0.5 * Math.sin(now * 4 + i); ctx.save(); ctx.strokeStyle = C.volt; ctx.globalAlpha = 0.3 + 0.3 * p; ctx.lineWidth = 3; roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 24); ctx.stroke(); ctx.restore(); }
        if (g.answered && isKey) tick(ctx, x + w - 16, y + 14, C.mint, 0.8);
        if (g.answered && chosen && !isKey) magnifier(ctx, x + w - 18, y + 18, C.amber, 0.8);
      });
    } else {
      // drip: flask colour from drops vs the neutral point
      const key = dripKey(r.acid), k = g.drops / key, turned = g.drops >= key;
      const col = r.indicator === "phenolphthalein" ? (turned ? "rgba(230,80,160,.75)" : "rgba(230,230,240,.25)") : r.indicator === "rose" ? (turned ? (g.drops > key ? "rgba(50,160,90,.75)" : "rgba(190,140,170,.6)") : "rgba(200,30,100,.7)") : (turned && g.drops > key ? "rgba(200,50,40,.75)" : "rgba(232,185,35,.7)");
      const fx0 = 500, fy0 = 470;
      ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx0 - 30, 300); ctx.lineTo(fx0 - 110, fy0); ctx.lineTo(fx0 + 110, fy0); ctx.lineTo(fx0 + 30, 300); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(220,230,255,.6)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx0 - 26, 210); ctx.lineTo(fx0 - 26, 290); ctx.lineTo(fx0 - 120, fy0 + 4); ctx.lineTo(fx0 + 120, fy0 + 4); ctx.lineTo(fx0 + 26, 290); ctx.lineTo(fx0 + 26, 210); ctx.stroke(); ctx.restore();
      drawGlyph(ctx, "beaker", fx0, 166, 70, C.ink, "rgba(120,170,255,.4)");
      if (g.holding) { const u = (now * 3) % 1; ctx.fillStyle = "rgba(120,170,255,.9)"; ctx.beginPath(); ctx.arc(fx0, 200 + u * 90, 6, 0, Math.PI * 2); ctx.fill(); }
      api.text(ctx, `${g.drops} ${T.drops}`, fx0, 540, { font: "mono", size: 40, weight: 600, align: "center", baseline: "middle" });
      if (g.answered) pill(api, ctx, g.verdict === "right" ? T.neutral : `${T.neutral}: ${key}`, 760, 360, { color: g.verdict === "right" ? C.mint : C.amber, size: 40 });
      void k;
    }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: g.verdict === "right", color: g.verdict === "right" ? C.mint : C.amber, stats: [[`${g.verdict === "right" ? 1 : 0}/1`, T.correct]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.correct]] });
    drawCoach(api, ctx, r.mode === "design" ? T.hint : r.mode === "drip" ? T.drip : "", flow.state === "play" ? g.coachA : 0, now, 600);
  }
  function bot(): BotAction | null {
    if (flow.state !== "play") return { type: "wait", ms: 300 };
    const r = rd();
    if (r.mode === "predict") {
      if (g.running || g.ran) return { type: "wait", ms: 400 };
      const truth = g.setups.map((c, i) => ftShows(M, c) ? i : -1).filter((i) => i >= 0);
      const todo = g.setups.map((_, i) => i).find((i) => truth.includes(i) !== g.sel.has(i) && botR() < 0.92);
      if (todo !== undefined) return { type: "tap", at: [boxX(todo) + boxW() / 2, BOX_Y + BOX_H / 2], after: 400 };
      return { type: "tap", at: [RUN.x + RUN.w / 2, RUN.y + RUN.h / 2], after: 500 };
    }
    if (r.mode === "design") {
      if (g.running || g.ran) return { type: "wait", ms: 400 };
      for (let vi = 0; vi < M.vars.length; vi++) {
        const v = M.vars[vi], a = g.setups[0][v.id], b = g.setups[1][v.id];
        const want = v.id === r.vary ? a !== b : a === b;
        if (!want) return { type: "tap", at: [boxX(1) + boxW() / 2, BOX_Y + BOX_H + 14 + vi * (CHIP_H + 8) + CHIP_H / 2], after: 300 };
      }
      return { type: "tap", at: [RUN.x + RUN.w / 2, RUN.y + RUN.h / 2], after: 500 };
    }
    if (r.mode === "conclude") { if (g.answered) return { type: "wait", ms: 400 }; const key = r.options.findIndex((q) => (r.ask === "matters") === M.matters.includes(q)); const i = botR() < 0.85 ? key : Math.floor(botR() * r.options.length); const o = optRect(i, r.options.length); return { type: "tap", at: [o.x + o.w / 2, o.y + o.h / 2], after: 600 }; }
    if (g.answered) return { type: "wait", ms: 400 };
    const target = dripKey(r.acid) + (botR() < 0.8 ? 0 : 1); const ms = target * 320 + 120;
    return { type: "path", points: [[500, 380], [501, 380]], ms, after: 400 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, model: spec.model, day: +g.day.toFixed(2), ran: g.ran, verdict: g.verdict, sel: [...g.sel], drops: g.drops }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: [`${M.outcome}: ${M.matters.map((m) => M.vars.find((v) => v.id === m)?.label ?? m).join(" + ")}`, `${T.hint}`], figure: { kind: "none" }, accent }),
  };
}
export const fair: EngineDef<FairSpec> = { archetype: "fair-test@1", label: "Simulation · Fair Test Lab", accent: C.sci, create };
