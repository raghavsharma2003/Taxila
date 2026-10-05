// LIFE LAB — `life-lab@1` (VALUES-100 V3.1: life processes as working systems). Three bodies that run in real time on
// the deterministic models in shared/studio-spec-ext/life.ts, so what the child sees is exactly what the host grades:
//   leaf   — a leaf in the sun: slide the stomata open and CO2 streams in, sugar builds, water vapour streams out; the
//            roots refill the water slowly; let it run dry and the leaf wilts (stomata shut, nothing made for 4 s).
//            With `transport`, the stem shows xylem lifting water and phloem carrying sugar down.
//   breath — pull the diaphragm down: the chest grows, air rushes in, the lungs fill. Each breath tops up the blood's
//            oxygen; the body burns it faster walking and faster still running.
//   gut    — the meal travels mouth → stomach → small intestine → large intestine on a clock; tap a juice to drop it
//            on the meal where it is NOW. Digested food is absorbed through the small intestine wall.
import { DECAY, GUT_END, JUICES, LEAF_DT, O2_GAIN, O2_LOW, O2_START, STATIONS, STATION_T, gutPlan, gutRun, leafBest, leafStep, stationAt, type LeafState, type LifeSpec, type LlRoundT } from "../../../../shared/studio-spec-ext/life.ts";
import { C, W, H } from "../../core/tokens.ts";
import { clamp, hexA, lerp, rng } from "../../core/math.ts";
import { bloom, magnifier, roundRect, tick, type Ctx } from "../../core/draw.ts";
import { sfx } from "../../core/sfx.ts";
import { drawIntro, drawStatCard, pill } from "../../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../../core/types.ts";
import { RoundFlow, backdrop, devaReady, taskPill } from "./kit.ts";

const SL = { x0: 800, x1: 960, y: 560 };
const JUICE_COL: Record<string, string> = { saliva: "#9FE7FF", gastric: "#FF8F6B", bile: "#C6E85C", pancreatic: "#FFD36B" };
const CHIP = (i: number) => ({ x: 140 + (i % 2) * 320, y: 492 + Math.floor(i / 2) * 64, w: 300, h: 56 });
const PATH: Record<(typeof STATIONS)[number], [number, number][]> = {
  mouth: [[160, 200], [290, 200]], pipe: [[290, 200], [320, 270]], stomach: [[320, 270], [400, 305], [500, 295], [545, 250]],
  small: [[545, 250], [625, 300], [300, 330], [300, 372], [640, 372], [640, 410], [300, 410]], large: [[300, 410], [232, 410], [232, 455], [735, 455], [735, 225]],
};
const LABELS: [string, number, number][] = [["mouth", 225, 172], ["stomach", 440, 238], ["small", 470, 350], ["large", 650, 185]];
function along(pts: [number, number][], f: number): [number, number] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = seg.reduce((a, b) => a + b, 0); let d = clamp(f, 0, 1) * tot;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? d / seg[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= seg[i]; }
  return pts[pts.length - 1];
}
function bolusAt(t: number): [number, number] { const s = stationAt(Math.min(t, GUT_END - 1e-6)), [a, b] = STATION_T[s]; return along(PATH[s], (t - a) / (b - a)); }
function create(api: EngineApi, spec: LifeSpec): EngineInstance {
  const T = spec.strings, accent = C.mint;
  let fontOk = true; if (/[ऀ-ॿ]/.test(JSON.stringify(spec))) { fontOk = false; void devaReady().then(() => { fontOk = true; }); }
  const botR = rng(api.seed * 163 + 7), setTask = taskPill(api);
  const g = {
    t: 0, running: false, open: 0, opens: [] as number[], acc: 0, leaf: { water: 0, sugar: 0, wilt: 0 } as LeafState, slide: false,
    pull: 0, drag: false, inBreath: false, depth: 0, breaths: [] as [number, number][], o2: O2_START, vol: 0,
    drops: [] as [string, number][], splash: [] as { x: number; y: number; c: string; t: number }[],
    parts: [] as { x: number; y: number; vx: number; vy: number; c: string; life: number }[],
    answered: false, verdict: "", detail: "", revealT: 0, right: 0, n: 0, plan: [] as [string, number][], botBest: [] as number[],
  };
  const hud = api.hud([{ key: "round", label: T.round }, { key: "done", label: T.done }]);
  const rd = (): LlRoundT => spec.rounds[Math.max(0, flow.round)];
  const flow = new RoundFlow(api, spec.rounds.length, {
    onRound(k) {
      const r = spec.rounds[k];
      Object.assign(g, { t: 0, running: false, open: 0, opens: [], acc: 0, slide: false, pull: 0, drag: false, inBreath: false, depth: 0, breaths: [], o2: O2_START, vol: 0, drops: [], splash: [], parts: [], answered: false, verdict: "", detail: "", revealT: 0 });
      if (r.mode === "leaf") { g.leaf = { water: r.water0, sugar: 0, wilt: 0 }; g.botBest = leafBest(r); }
      if (r.mode === "gut") g.plan = gutPlan(r);
      setTask(`${T.round} ${k + 1}`, r.sub || r.title); api.event("round_start", { round: k + 1, mode: r.mode }); sfx.blip({ f: 262, f2: 524, dur: 0.3, type: "triangle", gain: 0.12 });
    },
    onEnd(k) { api.event("round_end", { round: k + 1, verdict: g.verdict }); },
    onFinal() { api.task("", T.runDone, "done"); api.done({ right: g.right, of: g.n }); },
  });
  function judge(value: unknown, local: "right" | "wrong") {
    const grade = api.answer(`r${flow.round + 1}`, value, local);
    g.answered = true; g.running = false; g.verdict = grade.verdict; g.detail = grade.detail ?? ""; g.revealT = 0; g.n++;
    if (grade.verdict === "right") { g.right++; api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); api.hitstop(40); } else sfx.blip({ f: 220, f2: 140, dur: 0.24, gain: 0.16 });
    api.facts({ round: flow.round + 1, verdict: grade.verdict, detail: g.detail });
  }
  const pullOf = (y: number) => clamp((y - 470) / 110, 0, 1);
  api.onPointer({
    down(p) {
      if (flow.state !== "play" || g.answered) return;
      const r = rd(); g.running = true;
      if (r.mode === "leaf") { if (p.x >= SL.x0 - 30 && p.x <= SL.x1 + 30 && Math.abs(p.y - SL.y) < 44) { g.slide = true; g.open = clamp((p.x - SL.x0) / (SL.x1 - SL.x0), 0, 1); } return; }
      if (r.mode === "breath") { if (Math.abs(p.x - 400) < 220 && p.y > 440) { g.drag = true; g.pull = pullOf(p.y); } return; }
      for (let i = 0; i < JUICES.length; i++) { const c = CHIP(i); if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) { if (g.drops.length >= r.drops || g.t >= GUT_END) return; const j = JUICES[i]; g.drops.push([j, +g.t.toFixed(2)]); const [bx, by] = bolusAt(g.t); g.splash.push({ x: bx, y: by, c: JUICE_COL[j], t: 0 }); api.fx.burst(bx, by, { n: 14, color: JUICE_COL[j], speed: 220, life: 0.5, size: 7 }); sfx.blip({ f: 520, f2: 300, dur: 0.12, type: "sine", gain: 0.1 }); api.record("drop", { juice: j, t: g.t, at: stationAt(g.t) }); return; } }
    },
    move(p) { if (g.slide) g.open = clamp((p.x - SL.x0) / (SL.x1 - SL.x0), 0, 1); if (g.drag) g.pull = pullOf(p.y); },
    up() { if (g.slide) { g.slide = false; api.record("stomata", { open: +g.open.toFixed(2) }); } g.drag = false; },
  });
  function update(dt: number) {
    if (!fontOk) return;
    flow.tick(dt, 1.8);
    if (flow.state === "intro" && flow.stateT < 0.05) hud.show(true);
    const r = rd(); if (!r) return;
    if (flow.state === "play" && !g.answered) {
      if (r.mode === "leaf") {
        g.running = true; g.acc += dt;
        while (g.acc >= LEAF_DT) { g.acc -= LEAF_DT; g.opens.push(+g.open.toFixed(3)); g.leaf = leafStep(r, g.leaf, g.open, LEAF_DT); g.t += LEAF_DT; if (g.leaf.wilt >= 3.99) { api.fx.shake(4, 0.3); sfx.blip({ f: 160, f2: 90, dur: 0.3, gain: 0.12 }); api.record("wilt", { t: g.t }); } }
        const o = g.leaf.wilt > 0 ? 0 : g.open, rr = rng(Math.floor(g.t * 40));
        if (rr() < o * 0.9) g.parts.push({ x: 380 + (rr() - 0.5) * 30, y: 520, vx: (rr() - 0.5) * 30, vy: -90, c: "#B8C2D9", life: 1.2 });
        if (rr() < o * r.heat * 0.7) g.parts.push({ x: 400 + (rr() - 0.5) * 20, y: 450, vx: 60 + rr() * 50, vy: 70, c: "#6FB8FF", life: 1.1 });
        if (g.t >= r.time - 1e-6) judge({ open: g.opens }, g.leaf.sugar >= r.goal ? "right" : "wrong");
      } else if (r.mode === "breath") {
        if (g.running) {
          g.t += dt; g.o2 = Math.max(0, g.o2 - DECAY[r.activity] * dt);
          if (g.pull > 0.2 && !g.inBreath) { g.inBreath = true; g.depth = 0; }
          if (g.inBreath) g.depth = Math.max(g.depth, g.pull);
          if (g.inBreath && g.pull < 0.12) { g.inBreath = false; const d = +g.depth.toFixed(2); g.breaths.push([+g.t.toFixed(2), d]); g.o2 = Math.min(1, g.o2 + O2_GAIN * d); sfx.noise({ dur: 0.3, f: 900, filter: "lowpass", gain: 0.05 }); api.record("breath", { t: g.t, depth: d }); }
          if (g.t >= r.dur) judge({ breaths: g.breaths }, g.o2 >= O2_LOW ? "right" : "wrong");
        }
        const dv = g.pull - g.vol; g.vol += dv * Math.min(1, dt * 10);
        if (dv > 0.01) { const rr = rng(Math.floor(g.t * 60)); if (rr() < 0.8) g.parts.push({ x: 400 + (rr() - 0.5) * 16, y: 150, vx: 0, vy: 160, c: "#9FE7FF", life: 0.5 }); }
      } else {
        g.running = true;
        { g.t += dt; if (g.t >= GUT_END) { const out = gutRun(r, g.drops); judge({ drops: g.drops }, out.missed.length ? "wrong" : "right"); } }
      }
    }
    for (const q of g.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    g.parts = g.parts.filter((q) => q.life > 0).slice(-160);
    for (const s of g.splash) s.t += dt;
    if (g.answered) { g.revealT += dt; if (g.revealT > 3) flow.endRound(); }
    hud.set("round", `${Math.max(1, flow.round + 1)}/${spec.rounds.length}`); hud.set("done", `${g.right}/${g.n}`, { bump: true });
  }
  function paintBg(c: Ctx) { backdrop(c, accent, 163, 0); }
  function bar(ctx: Ctx, label: string, value: string, f: number, x: number, y: number, color: string, mark?: number) {
    if (label) api.text(ctx, label, x, y, { font: "mono", size: 38, weight: 600, color: C.ink2, baseline: "middle", maxWidth: 180 });
    api.text(ctx, value, x, y + 44, { font: "display", size: 40, weight: 800, color, baseline: "middle", maxWidth: 180 });
    const by = y + 72; ctx.save(); ctx.fillStyle = "rgba(255,255,255,.08)"; roundRect(ctx, x, by, 180, 22, 11); ctx.fill(); ctx.fillStyle = color; roundRect(ctx, x, by, Math.max(8, 180 * clamp(f, 0, 1)), 22, 11); ctx.fill();
    if (mark !== undefined) { ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 180 * mark, by - 6); ctx.lineTo(x + 180 * mark, by + 28); ctx.stroke(); }
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    if (!fontOk) return;
    const r = rd(); if (!r) return; const done = g.answered, ok = g.verdict === "right";
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    if (r.mode === "leaf") {
      const f = g.t / r.time, sx = lerp(170, 640, f), sy = 230 - Math.sin(f * Math.PI) * 50, wilt = g.leaf.wilt > 0, o = wilt ? 0 : g.open, dry = 1 - g.leaf.water / r.water0;
      bloom(ctx, C.sun, sx, sy, 70 * (r.light / 100), 0.7); ctx.save(); ctx.fillStyle = C.sun; ctx.globalAlpha = 0.5 + 0.5 * (r.light / 100); ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (r.transport) { ctx.save(); ctx.strokeStyle = "#4F7A3A"; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(380, 470); ctx.lineTo(380, 615); ctx.stroke(); ctx.fillStyle = "#6FB8FF"; ctx.fillStyle = "#6FB8FF"; for (let i = 0; i < 6; i++) { const y = 615 - ((now * 90 * (0.3 + o) + i * 26) % 150); ctx.fillRect(372, y, 5, 10); } ctx.fillStyle = "#FFB547"; for (let i = 0; i < 6; i++) { const y = 470 + ((now * 70 * (0.2 + o) + i * 26) % 150); ctx.fillRect(384, y, 5, 10); } ctx.restore(); api.text(ctx, `${T.xylem} ↑`, 350, 600, { font: "mono", size: 38, weight: 600, color: "#6FB8FF", align: "right", baseline: "middle" }); api.text(ctx, `${T.phloem} ↓`, 410, 600, { font: "mono", size: 38, weight: 600, color: "#FFB547", baseline: "middle" }); }
      ctx.save(); ctx.translate(380, 360); ctx.rotate(wilt ? 0.25 : -0.04 + dry * 0.12);
      const lg = ctx.createLinearGradient(-230, 0, 230, 0); lg.addColorStop(0, wilt ? "#7D7A3A" : "#2F7D3A"); lg.addColorStop(1, wilt ? "#9A8E44" : "#4FB860"); ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(-240, 0); ctx.quadraticCurveTo(0, -150, 240, 0); ctx.quadraticCurveTo(0, 120, -240, 0); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-230, 0); ctx.lineTo(230, 0); ctx.stroke();
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 70, 0); ctx.lineTo(i * 70 + 50, -50); ctx.moveTo(i * 70, 0); ctx.lineTo(i * 70 + 50, 40); ctx.stroke(); }
      // stoma on the underside
      ctx.fillStyle = "#1A3020"; ctx.beginPath(); ctx.ellipse(0, 70, 34 * (0.2 + o * 0.8), 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#8BD99A"; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(-8 - o * 14, 70, 22, 16, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.ellipse(8 + o * 14, 70, 22, 16, 0, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      ctx.restore();
      for (const q of g.parts) { ctx.save(); ctx.globalAlpha = clamp(q.life, 0, 1); ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      api.text(ctx, "CO₂ ↑", 290, 515, { font: "mono", size: 38, weight: 600, color: "#B8C2D9", align: "center", baseline: "middle", decor: true });
      if (wilt && !done) pill(api, ctx, T.wilted, 380, 250, { color: C.amber, size: 40 });
      bar(ctx, T.sugar, `${g.leaf.sugar.toFixed(1)} / ${r.goal}`, g.leaf.sugar / (r.goal * 1.3), 790, 200, C.sun, 1 / 1.3);
      bar(ctx, T.water, `${g.leaf.water.toFixed(1)}`, g.leaf.water / r.water0, 790, 320, "#6FB8FF");
      api.text(ctx, T.stomata, 880, 456, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 200 });
      api.text(ctx, o > 0.05 ? T.open : T.closed, 880, 500, { font: "display", size: 40, weight: 800, color: o > 0.05 ? C.mint : C.ink2, align: "center", baseline: "middle", maxWidth: 200 });
      ctx.save(); ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(SL.x1, SL.y); ctx.stroke(); ctx.strokeStyle = C.mint; ctx.beginPath(); ctx.moveTo(SL.x0, SL.y); ctx.lineTo(SL.x0 + g.open * (SL.x1 - SL.x0), SL.y); ctx.stroke(); ctx.fillStyle = g.slide ? C.volt : C.ink; ctx.beginPath(); ctx.arc(SL.x0 + g.open * (SL.x1 - SL.x0), SL.y, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (r.mode === "breath") {
      const v = g.vol, dy = g.pull * 90;
      ctx.save(); ctx.strokeStyle = "#B8C2D9"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(400, 150); ctx.lineTo(400, 230); ctx.moveTo(400, 230); ctx.lineTo(340, 270); ctx.moveTo(400, 230); ctx.lineTo(460, 270); ctx.stroke();
      for (const sgn of [-1, 1]) { const cx = 400 + sgn * (95 + v * 18), cy = 340; const lg = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, 110); lg.addColorStop(0, "#FFB2B8"); lg.addColorStop(1, "#C25B6B"); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(cx, cy + v * 18, 70 + v * 22, 110 + v * 34, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = hexA("#E8ECF5", 0.35); ctx.lineWidth = 6; for (let i = 0; i < 5; i++) { const y = 230 + i * 48; ctx.beginPath(); ctx.ellipse(400, y + 40, 200 + v * 18 + i * 4, 30, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke(); }
      ctx.strokeStyle = C.sci; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(190, 470); ctx.quadraticCurveTo(400, 400 + dy * 1.6, 610, 470); ctx.stroke(); ctx.restore();
      const hy = 470 + g.pull * 110; ctx.save(); ctx.fillStyle = g.drag ? C.volt : C.ink; roundRect(ctx, 340, hy, 120, 40, 20); ctx.fill(); ctx.restore();
      api.text(ctx, "⇕", 400, hy + 21, { font: "display", size: 38, weight: 800, color: "#0B0E14", align: "center", baseline: "middle", decor: true });
      for (const q of g.parts) { ctx.save(); ctx.globalAlpha = clamp(q.life * 2, 0, 1); ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      if (!g.running && !done) pill(api, ctx, T.pull, 400, 600, { color: C.volt, size: 38 });
      const lowF = O2_LOW;
      bar(ctx, T.oxygen, `${Math.round(g.o2 * 100)}%`, g.o2, 790, 200, g.o2 < lowF ? C.amber : C.mint, lowF);
      api.text(ctx, T[r.activity], 880, 350, { font: "display", size: 44, weight: 800, color: C.ink, align: "center", baseline: "middle" });
      const perMin = g.t > 2 ? (g.breaths.length / g.t) * 60 : 0; api.text(ctx, `${Math.round(perMin)} ${T.perMin}`, 880, 400, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 210 });
      bar(ctx, "", `${Math.max(0, r.dur - g.t).toFixed(0)} s`, 1 - g.t / r.dur, 790, 440, C.ion);
    } else {
      // gut tube
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (const s of STATIONS) { const pts = PATH[s]; ctx.strokeStyle = s === "small" ? "#C77B8B" : s === "large" ? "#A86C5E" : "#D49AA6"; ctx.lineWidth = s === "stomach" ? 46 : s === "large" ? 30 : 22; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
      ctx.restore();
      const cur = stationAt(g.t);
      for (const [k, x, y] of LABELS) { const on = cur === k && g.running; ctx.save(); ctx.fillStyle = "rgba(10,13,20,.82)"; const w = api.measure(ctx, T[k as keyof typeof T], { size: 38, weight: 700 }) + 24; roundRect(ctx, x - w / 2, y - 24, w, 48, 12); ctx.fill(); ctx.restore(); api.text(ctx, T[k as keyof typeof T], x, y, { size: 38, weight: 700, color: on ? C.volt : C.ink2, align: "center", baseline: "middle" }); }
      // absorption into blood along the small intestine
      const out = gutRun(r, g.drops);
      if (cur === "small" || cur === "large" || done) for (let i = 0; i < out.absorbed.length * 6; i++) { const [x, y] = along(PATH.small, ((now * 0.2 + i / 18) % 1)); ctx.save(); ctx.fillStyle = "#FF5A6E"; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(x, y - 18, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      const [bx, by] = bolusAt(g.t); bloom(ctx, C.sun, bx, by, 34, 0.5);
      const cols: Record<string, string> = { starch: "#F5E6B8", protein: "#E8A07A", fat: "#F7D44C" };
      r.meal.forEach((n, i) => { const dg = (out.absorbed as string[]).includes(n); ctx.save(); ctx.fillStyle = cols[n]; ctx.globalAlpha = dg ? 0.45 : 1; ctx.beginPath(); ctx.arc(bx + (i - (r.meal.length - 1) / 2) * 16, by, dg ? 6 : 11, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
      for (const s of g.splash) if (s.t < 1) { ctx.save(); ctx.globalAlpha = 1 - s.t; ctx.strokeStyle = s.c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(s.x, s.y, 14 + s.t * 40, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      JUICES.forEach((j, i) => { const c = CHIP(i), live = !done && g.drops.length < r.drops; ctx.save(); ctx.fillStyle = hexA(JUICE_COL[j], live ? 0.16 : 0.05); roundRect(ctx, c.x, c.y, c.w, c.h, 14); ctx.fill(); ctx.strokeStyle = hexA(JUICE_COL[j], live ? 0.9 : 0.3); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); api.text(ctx, T[j], c.x + c.w / 2, c.y + c.h / 2 + 1, { size: 38, weight: 700, color: live ? JUICE_COL[j] : C.ink3, align: "center", baseline: "middle", maxWidth: c.w - 16 }); });
      api.text(ctx, `${r.drops - g.drops.length}`, 880, 300, { font: "display", size: 56, weight: 800, color: C.ink, align: "center", baseline: "middle" });
      api.text(ctx, T.drops, 880, 350, { size: 38, weight: 600, color: C.ink2, align: "center", baseline: "middle", maxWidth: 210 });
      r.meal.forEach((n, i) => { const dg = (out.absorbed as string[]).includes(n); api.text(ctx, `${dg ? "✓" : "·"} ${T[n]}`, 800, 430 + i * 50, { size: 38, weight: 700, color: dg ? C.mint : C.ink2, baseline: "middle", maxWidth: 190 }); });
    }
    if (done) { if (r.mode === "leaf") pill(api, ctx, g.detail, 380, 250, { color: ok ? C.mint : C.amber, size: 38 }); else if (r.mode === "breath") pill(api, ctx, g.detail, 400, 600, { color: ok ? C.mint : C.amber, size: 38 }); if (ok) tick(ctx, 960, 200, C.mint, 1); else magnifier(ctx, 955, 200, C.amber, 1); }
    fx.drawWorld(ctx); ctx.restore(); fx.drawScreen(ctx);
    if (flow.state === "intro" || flow.introA > 0.01) drawIntro(api, ctx, { a: flow.introA, t: flow.stateT, kicker: `${T.round} ${flow.round + 1} / ${spec.rounds.length}`, title: r.title, sub: r.sub, accent });
    if (flow.state === "end") drawStatCard(api, ctx, { a: flow.endA, head: `${T.round} ${flow.round + 1}`, ticked: true, stats: [[`${g.right}/${g.n}`, T.done]] });
    if (flow.state === "final") drawStatCard(api, ctx, { a: flow.finalA, head: T.runDone, color: C.ion, stats: [[`${g.right}/${g.n}`, T.done]] });
  }
  function bot(): BotAction | null {
    if (flow.state !== "play" || g.answered) return { type: "wait", ms: 300 };
    const r = rd(), slip = botR() < 0.08;
    if (r.mode === "leaf") { const want = slip ? 1 : g.botBest[Math.min(g.botBest.length - 1, g.opens.length)] ?? 0; if (Math.abs(want - g.open) > 0.04) return { type: "drag", from: [SL.x0 + g.open * (SL.x1 - SL.x0), SL.y], to: [SL.x0 + want * (SL.x1 - SL.x0), SL.y], ms: 160, after: 0 }; return { type: "wait", ms: 120 }; }
    if (r.mode === "breath") { const need = DECAY[r.activity] / O2_GAIN, gap = (1 / need) * 0.8; const last = g.breaths.length ? g.breaths[g.breaths.length - 1][0] : -9; if (!g.running || g.t - last >= gap * (slip ? 2.5 : 1)) return { type: "path", points: [[400, 480], [400, 590], [400, 470]], ms: 700, after: 0 }; return { type: "wait", ms: 100 }; }
    const next = g.plan[g.drops.length]; if (!next || slip) return { type: "wait", ms: 200 };
    if (g.t >= next[1] && g.t < next[1] + 1.2) { const c = CHIP(JUICES.indexOf(next[0] as (typeof JUICES)[number])); return { type: "tap", at: [c.x + c.w / 2, c.y + c.h / 2], after: 0 }; }
    return { type: "wait", ms: 80 };
  }
  return {
    update, render, bot,
    seam: () => ({ state: flow.state, round: flow.round + 1, mode: rd()?.mode, t: +g.t.toFixed(2), sugar: +g.leaf.sugar.toFixed(2), o2: +g.o2.toFixed(2), drops: g.drops, verdict: g.verdict, right: g.right, n: g.n }),
    knob(k) { if (k === "again") { g.right = 0; g.n = 0; flow.startRound(0); return true; } return false; },
    board: () => ({ title: spec.title, lines: spec.rounds.map((x) => x.sub || x.title).slice(0, 3), figure: { kind: "none" }, accent }),
  };
}
export const life: EngineDef<LifeSpec> = { archetype: "life-lab@1", label: "Simulation · Life Lab", accent: C.mint, create };
