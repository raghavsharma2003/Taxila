// PHASE SHIFT — `phase-shift@1` (STUDIO-V2 §6.1 #32 + A17 Inside Matter). A beaker of particles driven by the shared
// energy model (shared/studio-spec.ts waterStep): sensible heat, the 0 °C and 100 °C plateaus (latent heat), evaporation
// below boiling that a fan speeds up and that cools what is left, and condensation on a cold lid. The particle view is
// the molecule-scale picture of that macro state: ice on a vibrating lattice, liquid jostling, vapour flying free.
// Every control change is logged in sim time; the host replays the log with the same fixed step and grades the goal.
import { WATER, WATER_PROBES, waterGoalMet, waterInit, waterStep, type PhaseSpec, type WaterInput, type WaterLog, type WaterState } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, lerp, mix, rng } from "../core/math.ts";
import { bloom, roundRect, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { pill, voltRing } from "../core/ui.ts";
import type { BotAction, EngineApi, EngineDef, EngineInstance } from "../core/types.ts";

const BK = { x0: 360, x1: 640, top: 250, bot: 540 }, N = 96, SL = { x: 190, y0: 250, y1: 530 }, BTN = { fan: { x: 845, y: 330 }, lid: { x: 845, y: 430 } };
interface P { x: number; y: number; vx: number; vy: number; role: "ice" | "liq" | "vap" | "drop" | "gone"; site: number }
type Step = PhaseSpec["steps"][number];

function create(api: EngineApi, spec: PhaseSpec): EngineInstance {
  const T = spec.strings;
  let s: WaterState = waterInit(spec.start);
  const u: WaterInput = { heat: 0, fan: 0, lid: 0 };
  const log: WaterLog[] = [{ t: 0, heat: 0, fan: 0, lid: 0 }];
  let acc = 0;
  const g = { si: -1, from: 0, base: s, stepT: 0, phase: "boot" as "boot" | "goal" | "probe" | "reveal" | "met" | "final", pick: null as null | string, dragging: false, warn: 0, results: [] as string[], bootT: 0, bubbles: [] as { x: number; y: number; r: number; v: number }[], plateau: "" };
  const r0 = rng(api.seed * 5 + 1);
  const ps: P[] = Array.from({ length: N }, (_, i) => ({ x: 400 + r0() * 200, y: 470 + r0() * 60, vx: 0, vy: 0, role: "ice", site: i }));
  const site = (k: number) => ({ x: 430 + (k % 12) * 12.5 + (Math.floor(k / 12) % 2) * 6, y: BK.bot - 12 - Math.floor(k / 12) * 12 });
  const step = (): Step | null => (g.si >= 0 && g.si < spec.steps.length ? spec.steps[g.si] : null);
  const hud = api.hud([{ key: "step", label: T.step }, { key: "temp", label: T.temp }, { key: "state", label: "state" }]);
  // Inputs are applied (and logged) only on 0.1 s sim boundaries, so the log stays ≤ 10 entries/s and the host's replay,
  // which applies each entry at its time, steps through exactly the same inputs.
  const want: WaterInput = { heat: 0, fan: 0, lid: 0 };
  let lastLogT = 0;
  function control(k: keyof WaterInput, v: number) { want[k] = v; }
  function applyInputs() {
    if (s.t - lastLogT < 0.1 - 1e-9 || (want.heat === u.heat && want.fan === u.fan && want.lid === u.lid)) return;
    u.heat = want.heat; u.fan = want.fan; u.lid = want.lid; lastLogT = s.t;
    log.push({ t: s.t, heat: u.heat, fan: u.fan, lid: u.lid });
  }
  function startStep(i: number) {
    g.si = i; g.from = s.t; g.base = s; g.stepT = 0; g.pick = null; g.warn = 0;
    const st = spec.steps[i];
    if (st.kind === "probe") { g.phase = "probe"; api.task(`${T.step} ${i + 1}/${spec.steps.length}`, `${T.predict}: ${WATER_PROBES[st.probe].q}`); }
    else { g.phase = "goal"; api.task(`${T.step} ${i + 1}/${spec.steps.length}`, st.goal === "evaporate" ? `${st.text} (${T.noBoil} ${st.tMax} °C)` : st.text); }
    api.event("step_start", { step: i + 1, kind: st.kind, targets: st.targets ?? null });
  }
  const chips = () => { const st = step(); if (!st || st.kind !== "probe") return []; const opts = WATER_PROBES[st.probe].options; return opts.map((o, i) => ({ o, x: 500 + (i - (opts.length - 1) / 2) * 290, y: 586, w: 270, h: 70 })); };
  api.onPointer({
    down(p) {
      const st = step();
      if (g.phase === "probe" && st?.kind === "probe") { const c = chips().find((b) => Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.y - b.y) < b.h / 2); if (c) answerProbe(c.o); return; }
      if (Math.abs(p.x - SL.x) < 80 && p.y > SL.y0 - 40 && p.y < SL.y1 + 40) { g.dragging = true; setHeat(p.y); return; }
      if (Math.hypot(p.x - BTN.fan.x, p.y - BTN.fan.y) < 70) { control("fan", want.fan ? 0 : 1); sfx.blip({ f: want.fan ? 500 : 300, dur: 0.06, type: "square", gain: 0.06 }); return; }
      if (Math.hypot(p.x - BTN.lid.x, p.y - BTN.lid.y) < 70) { control("lid", want.lid ? 0 : 1); sfx.blip({ f: want.lid ? 500 : 300, dur: 0.06, type: "square", gain: 0.06 }); }
    },
    move(p) { if (g.dragging) setHeat(p.y); },
    up() { g.dragging = false; },
  });
  function setHeat(y: number) { const k = clamp((y - SL.y0) / (SL.y1 - SL.y0), 0, 1), v = Math.round((1 - 2 * k) * 20) / 20; control("heat", Math.abs(v) < 0.06 ? 0 : v); }
  function answerProbe(o: string) {
    const st = step(); if (!st || st.kind !== "probe") return;
    const grade = api.answer(`s${g.si + 1}`, { pick: o }, o === WATER_PROBES[st.probe].key ? "right" : "wrong");
    g.pick = o; g.phase = "reveal"; g.stepT = 0; g.results.push(grade.verdict);
    if (grade.verdict === "right") { api.fx.flash(C.mint, 0.1); sfx.blip({ f: 523, f2: 1046, dur: 0.2, type: "triangle", gain: 0.18 }); } else sfx.blip({ f: 230, f2: 140, dur: 0.22, gain: 0.18 });
    api.facts({ step: st.probe, picked: o, truth: WATER_PROBES[st.probe].key, verdict: grade.verdict });
  }
  function simulate(dt: number) {
    acc += Math.min(dt, 0.1);
    while (acc >= WATER.dt) {
      applyInputs();
      s = waterStep(s, u); acc -= WATER.dt;
      const st = step();
      if (g.phase === "goal" && st && st.kind === "goal") {
        if (st.goal === "evaporate" && s.T > st.tMax + 0.5) { g.from = s.t; g.base = s; g.warn = 2.5; }
        if (waterGoalMet(st.goal, s, g.base, st.arg)) {
          const grade = api.answer(`s${g.si + 1}`, { log: [...log], until: s.t, from: g.from }, "right");
          g.results.push(grade.verdict); g.phase = "met"; g.stepT = 0;
          api.task(`${T.step} ${g.si + 1}/${spec.steps.length}`, `${T.done}: ${st.text}`, "done");
          api.fx.flash(C.mint, 0.1); sfx.blip({ f: 659, dur: 0.12, type: "triangle", gain: 0.14 }); setTimeout(() => sfx.blip({ f: 988, dur: 0.18, type: "triangle", gain: 0.12 }), 110);
          api.facts({ step: st.goal, verdict: grade.verdict, T: +s.T.toFixed(1), ice: +s.ice.toFixed(2), gone: +(s.vapour + s.escaped).toFixed(2), droplets: +s.droplets.toFixed(2) });
        }
      }
    }
  }
  function assignRoles() {
    const nIce = Math.round(N * s.ice), nLiq = Math.round(N * s.liquid), nVap = Math.round(N * s.vapour), nDrop = Math.min(18, Math.round(N * s.droplets));
    for (let i = 0; i < N; i++) {
      const role: P["role"] = i < nIce ? "ice" : i < nIce + nLiq ? "liq" : i < nIce + nLiq + nVap ? "vap" : i < nIce + nLiq + nVap + nDrop ? "drop" : "gone";
      const p = ps[i];
      if (role !== p.role) { if (role === "vap") { p.vy = -160 - r0() * 80; p.vx = (r0() - 0.5) * 120; } if (role === "gone" && p.role === "vap") { p.vy = -200; } p.role = role; }
    }
  }
  function particles(dt: number) {
    const th = clamp((s.T + 20) / 120, 0, 1.2), kick = 18 + 90 * th, surfaceN = ps.filter((p) => p.role === "liq").length, level = BK.bot - Math.max(16, (surfaceN / N) * 210);
    for (const p of ps) {
      if (p.role === "ice") { const st = site(p.site), a = 0.5 + 2.4 * clamp((s.T + 20) / 20, 0, 1.4); p.x = lerp(p.x, st.x + (r0() - 0.5) * a, 0.35); p.y = lerp(p.y, st.y + (r0() - 0.5) * a, 0.35); p.vx = p.vy = 0; continue; }
      if (p.role === "liq") { p.vy += 900 * dt; p.vx += (r0() - 0.5) * kick * 6 * dt * 10; p.vy += (r0() - 0.5) * kick * 3 * dt * 10; p.vx *= Math.exp(-dt * 3); p.vy *= Math.exp(-dt * 2); if (p.y < level - 6) p.vy += 600 * dt; }
      else if (p.role === "vap") { p.vx += (r0() - 0.5) * 900 * dt; p.vy += (r0() - 0.5) * 900 * dt - 40 * dt; const sp = Math.hypot(p.vx, p.vy), want = 150 + 120 * th; if (sp > 1) { p.vx *= want / sp; p.vy *= want / sp; } }
      else if (p.role === "drop") { const k = ps.indexOf(p) % 18; p.x = lerp(p.x, BK.x0 + 20 + k * 14, 0.2); p.y = lerp(p.y, BK.top + 10 + (k % 3) * 2, 0.2); continue; }
      else { p.vy = Math.min(p.vy, -120); p.y += p.vy * dt; p.x += p.vx * dt; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < BK.x0 + 8) { p.x = BK.x0 + 8; p.vx = Math.abs(p.vx) * 0.6; } if (p.x > BK.x1 - 8) { p.x = BK.x1 - 8; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y > BK.bot - 8) { p.y = BK.bot - 8; p.vy = -Math.abs(p.vy) * 0.4; }
      const ceil = u.lid ? BK.top + 16 : -40;
      if (p.y < ceil) { p.y = ceil; p.vy = Math.abs(p.vy) * 0.8; }
    }
    // soft repulsion inside the liquid and ice-liquid contact
    for (let i = 0; i < N; i++) { const a = ps[i]; if (a.role !== "liq") continue; for (let j = i + 1; j < N; j++) { const b = ps[j]; if (b.role !== "liq" && b.role !== "ice") continue; const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy; if (d2 < 144 && d2 > 1e-4) { const d = Math.sqrt(d2), f = (12 - d) * 0.5, nx = dx / d, ny = dy / d; a.x -= nx * f; a.y -= ny * f; if (b.role === "liq") { b.x += nx * f; b.y += ny * f; } } } }
    // boiling bubbles
    if (s.T >= 99.5 && u.heat > 0 && s.liquid > 0.05 && r0() < dt * 10) g.bubbles.push({ x: BK.x0 + 30 + r0() * (BK.x1 - BK.x0 - 60), y: BK.bot - 10, r: 4, v: 60 + r0() * 50 });
    for (const b of g.bubbles) { b.y -= b.v * dt; b.r = Math.min(16, b.r + dt * 14); }
    g.bubbles = g.bubbles.filter((b) => b.y > level);
  }
  function update(dt: number) {
    g.stepT += dt; g.warn = Math.max(0, g.warn - dt);
    if (g.phase === "boot") { g.bootT += dt; if (g.bootT > 0.4) { hud.show(true); startStep(0); } return; }
    if (g.phase !== "final") simulate(dt);
    assignRoles(); particles(dt);
    if (g.phase === "met" && g.stepT > 2.6) next();
    if (g.phase === "reveal" && g.stepT > 4.2) next();
    g.plateau = s.ice > 0.01 && s.liquid > 0.01 && u.heat > 0 ? T.plateau : s.T >= 99.9 && s.liquid > 0.01 && u.heat > 0 ? T.boiling : "";
    if (g.phase !== "final") {
      hud.set("step", `${Math.min(g.si + 1, spec.steps.length)}/${spec.steps.length}`);
      hud.set("temp", `${s.T.toFixed(0)} °C`, { tone: s.T >= 99.9 ? "amber" : s.T <= 0 ? "ion" : null });
      hud.set("state", s.ice > 0.99 ? T.ice : s.ice > 0.01 ? `${T.ice}+${T.water}` : s.liquid > 0.01 ? T.water : T.vapour);
    }
  }
  function next() { if (g.si + 1 < spec.steps.length) startStep(g.si + 1); else { g.phase = "final"; api.task("", T.done, "done"); api.done({ steps: spec.steps.length, right: g.results.filter((r) => r === "right").length }); } }
  function paintBg(c: Ctx) {
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0A0C12"); gr.addColorStop(1, "#10131B"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = "#151924"; roundRect(c, 300, 556, 400, 26, 10); c.fill();
  }
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const fx = api.fx; ctx.save(); ctx.translate(fx.ox, fx.oy);
    // burner / chiller glow
    if (u.heat > 0) bloom(ctx, "#FF8A4C", 500, 568, 160 + 80 * u.heat, 0.5 * u.heat);
    if (u.heat < 0) bloom(ctx, "#7FD6FF", 500, 568, 160, -0.5 * u.heat);
    // beaker glass
    ctx.save(); ctx.fillStyle = "rgba(139,152,255,.04)"; ctx.fillRect(BK.x0, BK.top, BK.x1 - BK.x0, BK.bot - BK.top);
    ctx.strokeStyle = "rgba(220,230,255,.45)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(BK.x0, BK.top - 20); ctx.lineTo(BK.x0, BK.bot); ctx.lineTo(BK.x1, BK.bot); ctx.lineTo(BK.x1, BK.top - 20); ctx.stroke(); ctx.restore();
    // lid
    if (u.lid) { ctx.fillStyle = "#9FD8F0"; roundRect(ctx, BK.x0 - 16, BK.top - 6, BK.x1 - BK.x0 + 32, 14, 6); ctx.fill(); bloom(ctx, "#7FD6FF", 500, BK.top, 180, 0.25); }
    // ice bonds
    ctx.strokeStyle = "rgba(190,235,255,.35)"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < N; i++) { const a = ps[i]; if (a.role !== "ice") continue; for (const j of [i + 1, i + 12]) { const b = ps[j]; if (!b || b.role !== "ice" || Math.hypot(a.x - b.x, a.y - b.y) > 18) continue; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } }
    ctx.stroke();
    for (const b of g.bubbles) { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); }
    for (const p of ps) {
      if (p.role === "gone" && p.y < -10) continue;
      const col = p.role === "ice" ? "#CFF2FF" : p.role === "liq" ? mix("#5F7BFF", "#9AA7FF", clamp(s.T / 100, 0, 1)) : p.role === "drop" ? "#9FD8F0" : "rgba(242,244,248,.75)";
      const r = p.role === "vap" || p.role === "gone" ? 3.5 : 5;
      ctx.fillStyle = col; ctx.globalAlpha = p.role === "vap" || p.role === "gone" ? 0.55 : 1; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (s.vapour > 0.02) api.text(ctx, T.invisible, 500, BK.top - 40, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" });
    // heat slider
    ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(SL.x, SL.y0); ctx.lineTo(SL.x, SL.y1); ctx.stroke();
    const hy = lerp(SL.y1, SL.y0, (u.heat + 1) / 2), hcol = u.heat > 0 ? "#FF9A5C" : u.heat < 0 ? "#7FD6FF" : C.ink2;
    ctx.strokeStyle = hcol; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(SL.x, (SL.y0 + SL.y1) / 2); ctx.lineTo(SL.x, hy); ctx.stroke();
    ctx.fillStyle = "#1F2536"; ctx.beginPath(); ctx.arc(SL.x, hy, 26, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = hcol; ctx.lineWidth = 4; ctx.stroke();
    if (g.phase === "goal" && g.si === 0 && u.heat === 0) voltRing(ctx, SL.x, hy, 36, now);
    api.text(ctx, T.heat, SL.x, SL.y0 - 30, { font: "mono", size: 38, weight: 600, color: "#FF9A5C", align: "center" });
    api.text(ctx, T.cool, SL.x, SL.y1 + 56, { font: "mono", size: 38, weight: 600, color: "#7FD6FF", align: "center" });
    // thermometer
    const tx = 715, ty0 = 260, ty1 = 520, tk = clamp((s.T + 20) / 140, 0, 1);
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(tx, ty0); ctx.lineTo(tx, ty1); ctx.stroke();
    ctx.strokeStyle = s.T >= 99.9 ? "#FF9A5C" : s.T <= 0 ? "#7FD6FF" : C.ion; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(tx, ty1); ctx.lineTo(tx, lerp(ty1, ty0, tk)); ctx.stroke();
    for (const [v, lb] of [[0, "0"], [100, "100"]] as [number, string][]) { const y = lerp(ty1, ty0, (v + 20) / 140); ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx + 12, y); ctx.lineTo(tx + 24, y); ctx.stroke(); api.text(ctx, lb, tx + 30, y + 13, { font: "mono", size: 38, weight: 600, color: C.ink3 }); }
    const st = step();
    if (st && st.kind === "goal" && st.goal === "evaporate") { const y = lerp(ty1, ty0, (st.tMax + 20) / 140); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(tx - 20, y); ctx.lineTo(tx + 20, y); ctx.stroke(); ctx.setLineDash([]); }
    api.text(ctx, `${s.T.toFixed(0)}°`, tx, ty1 + 62, { font: "display", size: 52, weight: 800, align: "center" });
    // buttons
    for (const [k, b, label] of [["fan", BTN.fan, T.fan], ["lid", BTN.lid, T.lid]] as const) {
      const on = u[k] > 0.5;
      ctx.fillStyle = on ? "rgba(139,152,255,.18)" : "rgba(22,26,36,.95)"; roundRect(ctx, b.x - 75, b.y - 40, 150, 80, 18); ctx.fill(); ctx.strokeStyle = on ? C.ion : C.line2; ctx.lineWidth = 2; ctx.stroke();
      api.text(ctx, label, b.x, b.y + 2, { font: "mono", size: 38, weight: 600, color: on ? C.ion : C.ink2, align: "center", baseline: "middle", maxWidth: 140 });
      if (k === "fan" && on && !api.reducedMotion) { ctx.strokeStyle = "rgba(139,152,255,.5)"; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const y = BK.top - 10 + i * 30, o = (now * 200 + i * 60) % 120; ctx.beginPath(); ctx.moveTo(BK.x1 + 120 - o, y); ctx.lineTo(BK.x1 + 80 - o, y); ctx.stroke(); } }
    }
    if (g.plateau) pill(api, ctx, g.plateau, 500, 205, { color: C.ink, size: 38 });
    if (g.warn > 0 && st && st.kind === "goal") pill(api, ctx, `over ${st.tMax} °C: that's boiling territory. Cool it`, 500, 205, { color: C.amber, size: 38 });
    // probe chips + reveal
    if (st && st.kind === "probe") {
      const pr = WATER_PROBES[st.probe];
      if (g.phase === "probe") for (const c of chips()) { ctx.fillStyle = "rgba(22,26,36,.96)"; roundRect(ctx, c.x - c.w / 2, c.y - c.h / 2, c.w, c.h, 18); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke(); api.text(ctx, c.o, c.x, c.y + 2, { font: "display", size: 40, weight: 700, align: "center", baseline: "middle", maxWidth: 250 }); }
      if (g.phase === "reveal") {
        const ok = g.pick === pr.key, k = clamp(g.stepT / 0.5, 0, 1);
        ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = "rgba(10,12,18,.82)"; ctx.fillRect(0, 0, W, H);
        const cx = 500, cy = 340, R = 150; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        const inner = st.probe === "steam" ? "#9FD8F0" : "rgba(242,244,248,.8)";
        for (let i = 0; i < 26; i++) { const a = i * 2.4 + g.stepT * (st.probe === "steam" ? 0.4 : 2.2), rr = (0.2 + ((i * 37) % 70) / 100) * R; ctx.fillStyle = inner; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a * 1.3) * rr * 0.8, st.probe === "steam" ? 7 : 5, 0, Math.PI * 2); ctx.fill(); }
        api.text(ctx, pr.key.toUpperCase(), cx, cy + R + 56, { font: "mono", size: 40, weight: 600, color: ok ? C.mint : C.ion, align: "center" });
        if (ok) tick(ctx, cx + R + 30, cy - R + 20);
        ctx.restore();
      }
    }
    fx.drawWorld(ctx); ctx.restore();
  }
  function bot(): BotAction | null {
    const st = step();
    if (!st) return { type: "wait", ms: 300 };
    const heatTo = (v: number): BotAction => ({ type: "drag", from: [SL.x, lerp(SL.y1, SL.y0, (want.heat + 1) / 2)], to: [SL.x, lerp(SL.y1, SL.y0, (v + 1) / 2)], ms: 300, after: 300 });
    if (g.phase === "probe" && st.kind === "probe") { const key = WATER_PROBES[st.probe].key, c = chips().find((x) => x.o === key)!; return { type: "tap", at: [c.x, c.y], after: 500 }; }
    if (g.phase !== "goal" || st.kind !== "goal") return { type: "wait", ms: 300 };
    if (st.goal === "melt" || st.goal === "boil") { if (want.lid) return { type: "tap", at: [BTN.lid.x, BTN.lid.y], after: 300 }; return want.heat < 0.95 ? heatTo(1) : { type: "wait", ms: 400 }; }
    if (st.goal === "evaporate") {
      if (!want.fan) return { type: "tap", at: [BTN.fan.x, BTN.fan.y], after: 300 };
      const wantHeat = s.T > st.tMax - 8 ? 0 : s.T > st.tMax - 20 ? 0.3 : 0.7;
      return Math.abs(want.heat - wantHeat) > 0.08 ? heatTo(wantHeat) : { type: "wait", ms: 400 };
    }
    if (st.goal === "condense") { if (want.fan) return { type: "tap", at: [BTN.fan.x, BTN.fan.y], after: 300 }; if (!want.lid) return { type: "tap", at: [BTN.lid.x, BTN.lid.y], after: 300 }; return want.heat < 0.95 ? heatTo(1) : { type: "wait", ms: 400 }; }
    return { type: "wait", ms: 300 };
  }
  return {
    update, render, bot,
    seam: () => ({ phase: g.phase, step: step()?.kind ?? null, T: +s.T.toFixed(2), ice: +s.ice.toFixed(3), liquid: +s.liquid.toFixed(3), gone: +(s.vapour + s.escaped).toFixed(3), droplets: +s.droplets.toFixed(3), simT: +s.t.toFixed(2), u: { ...u } }),
    knob(k) { if (k === "again") { s = waterInit(spec.start); log.length = 0; log.push({ t: 0, heat: 0, fan: 0, lid: 0 }); u.heat = u.fan = u.lid = 0; want.heat = want.fan = want.lid = 0; lastLogT = 0; acc = 0; g.results = []; startStep(0); return true; } return false; },
    board: () => ({ title: "Same water, three states", lines: ["0 °C holds while ice melts; 100 °C holds while water boils.", "Vapour is invisible. Clouds and steam are droplets."], figure: { kind: "chain", items: ["ice", "water", "vapour", "droplets"] }, accent: "#7FD6FF" }),
  };
}
export const phase: EngineDef<PhaseSpec> = { archetype: "phase-shift@1", label: "Sim · States of water", accent: C.sci, create };
