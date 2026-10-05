// WHERE RAIN COMES FROM — `water-cycle@1` (STUDIO-V2 §6.2 A16). A narration-locked, scrubbable explainer (state = f(t)).
// It is built against three named misconceptions: clouds are vapour (c7-science-ch07-t04-m3 and c6-science-ch08-t01-m2:
// the kettle's clear gap is the vapour, the white plume is droplets), groundwater is an underground lake (m1: water
// fills the gaps between grains, like a sponge), and evaporated water is gone (c5-evs-ch01-t01-m3: same water, round
// and round). Ends hands-on: tap where the water you cannot see is; the host checks the tap against the vapour region.
import { WC_VAPOUR_REGION, type WaterCycleSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, ease, lerp, rng } from "../core/math.ts";
import { bloom, magnifier, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { ExplainerShell } from "../core/explainer.ts";
import type { TimelineConfig } from "../core/timeline.ts";
import type { EngineApi, EngineDef, EngineInstance } from "../core/types.ts";

const INIT: Record<string, number> = { "sea.a": 0, "sun.a": 0, "land.a": 0, "title.a": 0, "ground.a": 0, "kettle.a": 0, "sun.heat": 0, "evap": 0, "cond": 0, "wind": 0, "rain": 0, "flow": 0, "zoom": 0,
  "cam.x": 500, "cam.y": 312, "cam.zoom": 1, "lbl.vapour": 0, "lbl.cloud": 0, "lbl.rain": 0, "lbl.ground": 0, "lbl.river": 0, "lbl.cool": 0, "lbl.steam": 0, "lbl.gap": 0 };
const CFG: TimelineConfig = { init: INIT, showable: ["sea", "sun", "land", "title", "ground", "kettle"], labels: ["vapour", "cloud", "rain", "ground", "river", "cool", "steam", "gap"],
  verbs: { sun: { prop: "sun.heat", key: "to", min: 0, max: 1 }, evaporate: { prop: "evap", key: "to", min: 0, max: 1 }, condense: { prop: "cond", key: "to", min: 0, max: 1 }, wind: { prop: "wind", key: "to", min: 0, max: 1, ease: "inOutSine" }, rain: { prop: "rain", key: "to", min: 0, max: 1 }, flow: { prop: "flow", key: "to", min: 0, max: 1 }, zoom: { prop: "zoom", key: "to", min: 0, max: 1 } } };
const SEA_Y = 432;
const landY = (x: number) => (x < 470 ? SEA_Y + 20 : x < 600 ? 450 - (x - 470) * 0.35 : x < 760 ? 405 - (x - 600) * 1.1 : x < 840 ? 229 + (x - 760) * 0.9 : x < 900 ? 301 - (x - 840) * 0.25 : 286 + (x - 900) * 0.5);

function create(api: EngineApi, spec: WaterCycleSpec): EngineInstance {
  const T = spec.strings, sh = new ExplainerShell(api, spec, CFG), V = sh.V;
  const r0 = rng(31);
  const vap = Array.from({ length: 80 }, () => ({ x: 30 + r0() * 420, ph: r0(), sp: 0.12 + r0() * 0.1, w: r0() * 6.28 }));
  const drops = Array.from({ length: 60 }, () => ({ ox: (r0() - 0.5) * 160, ph: r0(), sp: 0.9 + r0() * 0.6 }));
  const puffs = Array.from({ length: 22 }, () => ({ ox: (r0() - 0.5) * 210, oy: (r0() - 0.5) * 60, r: 26 + r0() * 30 }));
  const grains = Array.from({ length: 140 }, () => ({ x: 520 + r0() * 480, y: 478 + r0() * 147, r: 7 + r0() * 9 }));
  const live = { tapped: null as null | { x: number; y: number; ok: boolean; t: number }, done: false };
  const paintBase = (g: Ctx) => {
    const sky = g.createLinearGradient(0, 0, 0, SEA_Y); sky.addColorStop(0, "#08122A"); sky.addColorStop(0.7, "#1A2C55"); sky.addColorStop(1, "#3E5482");
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const r2 = rng(9); for (let i = 0; i < 80; i++) { g.globalAlpha = 0.2 + r2() * 0.4; g.fillStyle = "#DDE6FF"; g.fillRect(r2() * W, r2() * 200, 1.5, 1.5); } g.globalAlpha = 1;
  };
  const paintLand = (g: Ctx) => {
    g.fillStyle = "#1E2B25"; g.beginPath(); g.moveTo(440, H); for (let x = 440; x <= W; x += 10) g.lineTo(x, landY(x)); g.lineTo(W, H); g.closePath(); g.fill();
    g.fillStyle = "#2D3650"; g.beginPath(); g.moveTo(640, 360); for (let x = 640; x <= W; x += 10) g.lineTo(x, landY(x)); g.lineTo(W, 380); g.closePath(); g.fill();
    g.fillStyle = "#E6ECF5"; g.beginPath(); g.moveTo(735, 257); g.lineTo(760, 229); g.lineTo(790, 256); g.lineTo(772, 250); g.lineTo(760, 260); g.closePath(); g.fill();
  };
  function render(ctx: Ctx, now: number) {
    const t = sh.head.t, z = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y");
    ctx.drawImage(api.layer("base", paintBase), 0, 0, W, H);
    ctx.save(); ctx.translate(500, 312); ctx.scale(z, z); ctx.translate(-cx, -cy);
    const sunA = V("sun.a"), heat = V("sun.heat");
    if (sunA > 0.01) { bloom(ctx, "#FFC46B", 150, 120, 150 + 90 * heat, sunA * (0.5 + 0.4 * heat)); ctx.save(); ctx.globalAlpha = sunA; ctx.fillStyle = "#FFE7A8"; ctx.beginPath(); ctx.arc(150, 120, 44, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    const landA = V("land.a"); if (landA > 0.01) { ctx.save(); ctx.globalAlpha = landA; ctx.drawImage(api.layer("land", paintLand), 0, 0, W, H); ctx.restore(); }
    // groundwater cut-away: grains with water filling the gaps (a sponge, not a lake)
    const gA = V("ground.a"), flow = V("flow");
    if (gA > 0.01) {
      ctx.save(); ctx.globalAlpha = gA; ctx.beginPath(); ctx.moveTo(520, H); for (let x = 520; x <= W; x += 10) ctx.lineTo(x, Math.max(landY(x) + 30, 478)); ctx.lineTo(W, H); ctx.closePath(); ctx.clip();
      ctx.fillStyle = "#2A2118"; ctx.fillRect(520, 470, 480, 160);
      const wl = lerp(625, 520, clamp(flow, 0, 1)); ctx.fillStyle = "rgba(80,150,255,.55)"; ctx.fillRect(520, wl, 480, H - wl);
      for (const g of grains) { ctx.fillStyle = "#6B5642"; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill(); }
      if (!api.reducedMotion) { ctx.fillStyle = "rgba(160,205,255,.9)"; for (let i = 0; i < 24; i++) { const k = ((t * 0.08 + i / 24) % 1); ctx.beginPath(); ctx.arc(980 - k * 470, wl + 18 + (i % 5) * 18 + Math.sin(k * 20 + i) * 6, 3, 0, Math.PI * 2); ctx.fill(); } }
      ctx.restore();
    }
    // sea
    const seaA = V("sea.a");
    if (seaA > 0.01) {
      ctx.save(); ctx.globalAlpha = seaA;
      const gr = ctx.createLinearGradient(0, SEA_Y, 0, H); gr.addColorStop(0, "#1E5594"); gr.addColorStop(1, "#0B2142"); ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= 500; x += 10) ctx.lineTo(x, SEA_Y + Math.sin(x * 0.04 + t * 1.6) * 4); ctx.lineTo(500, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(200,225,255,.25)"; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let x = 0; x <= 480; x += 10) { const y = SEA_Y + 20 + k * 30 + Math.sin(x * 0.05 + t * (1.2 + k * 0.2) + k) * 3; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.restore();
    }
    // river
    if (flow > 0.01) { ctx.save(); ctx.strokeStyle = "rgba(110,170,255,.85)"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.setLineDash([18, 14]); ctx.lineDashOffset = api.reducedMotion ? 0 : t * 60; ctx.globalAlpha = flow; ctx.beginPath(); ctx.moveTo(765, 262); ctx.bezierCurveTo(720, 340, 650, 360, 600, 410); ctx.bezierCurveTo(560, 440, 520, 445, 470, 446); ctx.stroke(); ctx.restore(); }
    // invisible vapour: barely-there shimmer rising from the sea (a teaching cue, labelled invisible)
    const evap = V("evap");
    if (evap > 0.01 && !sh.interactive) for (const v of vap) { const k = (v.ph + t * v.sp) % 1, y = SEA_Y - k * 250, x = v.x + Math.sin(k * 8 + v.w) * 10; ctx.fillStyle = `rgba(220,235,255,${0.28 * evap * (1 - k)})`; ctx.fillRect(x, y, 2.2, 2.2); }
    // cloud = droplets
    const cond = V("cond"), wind = V("wind"), ccx = lerp(300, 715, ease.inOutSine(wind)), ccy = lerp(190, 212, wind);   // ends clear of the teacher PiP zone
    if (cond > 0.01) { ctx.save(); ctx.globalAlpha = Math.min(1, cond * 1.2); for (const p of puffs) { const r = p.r * (0.4 + 0.6 * cond); ctx.fillStyle = "rgba(235,240,250,.85)"; ctx.beginPath(); ctx.arc(ccx + p.ox * (0.5 + 0.5 * cond), ccy + p.oy, r, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = "rgba(170,180,200,.35)"; ctx.beginPath(); ctx.ellipse(ccx, ccy + 28, 130 * cond, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    // rain
    const rain = V("rain");
    if (rain > 0.01) { ctx.save(); ctx.strokeStyle = `rgba(150,195,255,${0.8 * rain})`; ctx.lineWidth = 3; for (const d of drops) { const k = (d.ph + t * d.sp) % 1, x = ccx + d.ox, y0 = ccy + 30, y = lerp(y0, landY(x), k); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14); ctx.stroke(); } ctx.restore(); }
    ctx.restore();   // camera
    // kettle inset: the clear gap is the vapour; the white plume is droplets
    const kA = V("kettle.a"), zk = V("zoom");
    if (kA > 0.01 && zk > 0.01) {
      const ix = 300, iy = 330, R = 160 * ease.outCubic(zk);
      ctx.save(); ctx.globalAlpha = kA; ctx.beginPath(); ctx.arc(ix, iy, R, 0, Math.PI * 2); ctx.fillStyle = "#121726"; ctx.fill(); ctx.clip();
      ctx.fillStyle = "#4A5168"; ctx.beginPath(); ctx.ellipse(ix - 30, iy + 90, 70, 50, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#4A5168"; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(ix + 20, iy + 70); ctx.lineTo(ix + 70, iy + 30); ctx.stroke();
      for (let i = 0; i < 26; i++) { const k = ((t * 0.5 + i / 26) % 1), px = ix + 78 + k * 40 + Math.sin(k * 9 + i) * 10 * k, py = iy + 10 - 40 - k * 130; ctx.fillStyle = `rgba(240,244,250,${0.75 * (1 - k)})`; ctx.beginPath(); ctx.arc(px, py, 8 + k * 16, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = kA; ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ix, iy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      if (V("lbl.gap") > 0.01) { ctx.save(); ctx.globalAlpha = V("lbl.gap"); ctx.strokeStyle = C.ion; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix + 80, iy + 22); ctx.lineTo(ix + 200, iy + 60); ctx.stroke(); api.text(ctx, T.gap, ix + 206, iy + 72, { font: "mono", size: 38, weight: 600, color: C.ion, maxWidth: 480 }); ctx.restore(); }
      if (V("lbl.steam") > 0.01) { ctx.save(); ctx.globalAlpha = V("lbl.steam"); ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix + 110, iy - 90); ctx.lineTo(ix + 200, iy - 110); ctx.stroke(); api.text(ctx, T.steam, ix + 206, iy - 100, { font: "mono", size: 38, weight: 600, color: C.ink, maxWidth: 480 }); ctx.restore(); }
    }
    // labels (screen space, never scaled below the minimum)
    const lbl = (k: string, text: string, x: number, y: number, col: string = C.ink) => { const a = V("lbl." + k); if (a > 0.01) api.text(ctx, text, x, y, { font: "mono", size: 38, weight: 600, color: col, alpha: a, maxWidth: 560 }); };
    const toS = (x: number, y: number) => [(x - cx) * z + 500, (y - cy) * z + 312];
    if (!sh.interactive) lbl("vapour", T.vapour, 60, 330, "#BFD4FF");
    const [ccxS, ccyS] = toS(ccx, ccy);
    { const a = V("lbl.cloud"); if (a > 0.01) api.text(ctx, T.cloud, clamp(ccxS - 150, 420, 700), clamp(ccyS + 4, 190, 560), { font: "mono", size: 38, weight: 600, color: C.ink, alpha: a, align: "right", baseline: "middle", maxWidth: 400 }); }
    lbl("cool", T.cool, 200, 120, C.ink2);
    lbl("rain", T.rain, clamp(ccxS + 140, 200, 820), ccyS + 110, "#9CC4FF");
    lbl("river", T.river, 560, 470, "#9CC4FF");
    lbl("ground", T.ground, 560, 600, "#9CC4FF");
    const tA = V("title.a"); if (tA > 0.01) { ctx.save(); ctx.globalAlpha = tA; api.text(ctx, T.title, 500, 300, { font: "display", size: 74, weight: 800, align: "center", baseline: "middle", maxWidth: 900 }); ctx.strokeStyle = C.ion; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(500 - 130 * tA, 360); ctx.lineTo(500 + 130 * tA, 360); ctx.stroke(); ctx.restore(); }
    if (live.tapped) { const tp = live.tapped, k = clamp(tp.t / 0.3, 0, 1); ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = tp.ok ? C.mint : C.amber; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(tp.x, tp.y, 30, 0, Math.PI * 2); ctx.stroke(); if (tp.ok) tick(ctx, tp.x + 46, tp.y - 26); else magnifier(ctx, tp.x + 46, tp.y - 26); if (tp.ok || tp.t > 1.2) { const R = WC_VAPOUR_REGION; ctx.setLineDash([10, 8]); ctx.strokeStyle = C.mint; ctx.strokeRect(R.x, R.y, R.w, R.h); ctx.setLineDash([]); for (const v of vap) { const kk = (v.ph + now * v.sp) % 1; ctx.fillStyle = `rgba(220,235,255,${0.45 * (1 - kk)})`; ctx.fillRect(v.x, SEA_Y - kk * 250, 2.4, 2.4); } } ctx.restore(); }
    api.fx.drawWorld(ctx);
  }
  api.onPointer({
    down(p) {
      if (sh.tapToPlay()) return;
      if (!sh.interactive || live.done) return;
      const R = WC_VAPOUR_REGION, inCloud = Math.hypot(p.x - 715, p.y - 212) < 140;
      const g = api.answer("tap_vapour", { x: +p.x.toFixed(1), y: +p.y.toFixed(1) }, p.x >= R.x && p.x <= R.x + R.w && p.y >= R.y && p.y <= R.y + R.h ? "right" : "wrong");
      live.tapped = { x: p.x, y: p.y, ok: g.verdict === "right", t: 0 };
      if (g.verdict === "right") { sfx.blip({ f: 660, f2: 990, dur: 0.18, type: "triangle", gain: 0.12 }); sh.say("W11", "Exactly. The air over the sea is full of water you can't see."); live.done = true; api.done({ task: "vapour" }); }
      else { sfx.blip({ f: 260, f2: 160, dur: 0.2, gain: 0.12 }); sh.say("W12", inCloud ? "That's droplets: you can see them. The vapour is in the clear air." : "Look higher, over the water. Clear air, full of vapour."); }
      api.facts({ task: "tap_vapour", verdict: g.verdict, tappedCloud: inCloud ? 1 : 0 });
    },
  });
  api.onKey((k, d) => { if (d) sh.key(k); });
  return {
    update(dt) {
      if (sh.step(dt)) { api.task("", T.task); api.event("interactive", { task: "tap_vapour" }); }
      if (live.tapped) live.tapped.t += dt;
      api.facts({ t: +sh.head.t.toFixed(1), mode: sh.head.mode });
    },
    render,
    seam: () => ({ state: live.done ? "final" : sh.head.mode, t: +sh.head.t.toFixed(2), total: +sh.tl.interactiveAt.toFixed(2) }),
    bot() {
      if (!sh.interactive) return sh.skim();
      if (live.done) return { type: "wait", ms: 500 };
      if (!live.tapped) return { type: "tap", at: [715, 215], after: 2600 };       // first, the classic wrong tap (the cloud)
      const R = WC_VAPOUR_REGION; return { type: "tap", at: [R.x + R.w * 0.5, R.y + R.h * 0.4], after: 2000 };
    },
    knob: (k) => sh.knob(k, () => { live.tapped = null; live.done = false; }),
    board: () => ({ title: "Same water, round and round", lines: ["Vapour is invisible; clouds are droplets.", "Groundwater fills the gaps in soil, like a sponge."], figure: { kind: "chain", items: ["sea", "vapour", "cloud", "rain", "river"] }, accent: "#9CC4FF" }),
    dispose: () => sh.dispose(),
  };
}
export const watercycle: EngineDef<WaterCycleSpec> = { archetype: "water-cycle@1", label: "Animation · Water", accent: C.sci, create };
