// THE SOLAR SYSTEM TO SCALE — `scale-cinematic@1` (STUDIO-V2 §6.2, c6-science-ch12-t02). A narration-locked explainer:
// the textbook row of planets morphs into true distances (AU, computed), the camera dives into the crowded inner system,
// a light pulse rides out to Neptune with an exact light-time clock (8.317 min per AU), sizes are compared as a football
// and a peppercorn, and Earth's nearly circular orbit (e = 0.0167) kills "summer is when we're closer"
// (c6-science-ch12-t02-m3: we are closest in January). Hands-on ending: drag a planet to where it really sits.
import { PLANETS, type ScaleSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, ease, lerp } from "../core/math.ts";
import { bloom, magnifier, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { ExplainerShell } from "../core/explainer.ts";
import type { TimelineConfig } from "../core/timeline.ts";
import type { EngineApi, EngineDef, EngineInstance } from "../core/types.ts";
import { pill } from "../core/ui.ts";

const INIT: Record<string, number> = { "title.a": 0, "row.a": 0, "axis.a": 0, "sizes.a": 0, "orbit.a": 0, "scale": 0, "travel": 0, "orbit": 0, "cam.x": 500, "cam.y": 330, "cam.zoom": 1,
  "lbl.notToScale": 0, "lbl.toScale": 0, "lbl.au": 0, "lbl.light": 0, "lbl.seasons": 0, "lbl.jan": 0, "lbl.july": 0 };
const CFG: TimelineConfig = { init: INIT, showable: ["title", "row", "axis", "sizes", "orbit"], labels: ["notToScale", "toScale", "au", "light", "seasons", "jan", "july"],
  verbs: { scale: { prop: "scale", key: "to", min: 0, max: 1, ease: "inOutCubic" }, travel: { prop: "travel", key: "to", min: 0, max: 1, ease: "linear" }, orbit: { prop: "orbit", key: "to", min: 0, max: 1, ease: "linear" } } };
const AXIS = { x0: 60, x1: 940, y: 360 }, KM_AU = 1.496e8, LIGHT_MIN_AU = 8.317;
const ROW_R = [9, 15, 16, 12, 38, 32, 22, 21];
const fmtTime = (min: number) => (min < 60 ? `${min.toFixed(1)} min` : `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, "0")} m`);

function create(api: EngineApi, spec: ScaleSpec): EngineInstance {
  const T = spec.strings, sh = new ExplainerShell(api, spec, CFG), V = sh.V;
  const ask = PLANETS.find((p) => p.id === spec.ask)!, span = ask.au <= 10 ? 12 : 32;
  const iax = { x0: 90, x1: 910, y: 380 };
  const live = { au: span * 0.62, dragging: false, answered: null as null | { au: number; verdict: string }, done: false, t: 0 };
  const auX = (au: number) => AXIS.x0 + (au / 30.05) * (AXIS.x1 - AXIS.x0);
  const iX = (au: number) => iax.x0 + (au / span) * (iax.x1 - iax.x0), iAu = (x: number) => clamp(((x - iax.x0) / (iax.x1 - iax.x0)) * span, 0, span);
  const paintBg = (g: Ctx) => {
    const gr = g.createRadialGradient(80, 330, 20, 300, 330, 1000); gr.addColorStop(0, "#151A2E"); gr.addColorStop(1, "#05060B"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) { const x = (i * 197.3) % W, y = (i * 73.7) % H; g.globalAlpha = 0.15 + ((i * 7) % 10) / 20; g.fillStyle = "#C9D2F2"; g.fillRect(x, y, 1.4, 1.4); }
    g.globalAlpha = 1;
  };
  function render(ctx: Ctx, now: number) {
    ctx.drawImage(api.layer("bg", paintBg), 0, 0, W, H);
    const z = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y"), sc = V("scale"), toS = (x: number, y: number) => [(x - cx) * z + 500, (y - cy) * z + 330];
    const rowA = V("row.a");
    if (!sh.interactive && rowA > 0.01) {
      // the Sun: huge at the left edge in the row view, a dot at x0 on the true axis
      const [sx, sy] = toS(lerp(-60, AXIS.x0, sc), AXIS.y), sr = lerp(150, 6, sc) * z;
      ctx.save(); ctx.globalAlpha = rowA; bloom(ctx, "#FFC46B", sx, sy, sr * 2.2 + 30, 0.7); ctx.fillStyle = "#FFE3A0"; ctx.beginPath(); ctx.arc(sx, sy, Math.max(4, sr), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (V("axis.a") > 0.01) { ctx.save(); ctx.globalAlpha = V("axis.a"); const [a0] = toS(AXIS.x0, AXIS.y), [a1] = toS(AXIS.x1, AXIS.y); ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a0, sy); ctx.lineTo(a1, sy); ctx.stroke(); for (let au = 0; au <= 30; au += 5) { const [x] = toS(auX(au), AXIS.y); ctx.beginPath(); ctx.moveTo(x, sy - 10); ctx.lineTo(x, sy + 10); ctx.stroke(); if (x > 20 && x < 980) api.text(ctx, `${au}`, x, sy + 50, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" }); } ctx.restore(); }
      PLANETS.forEach((p, i) => {
        const xRow = 160 + i * 98, x = lerp(xRow, auX(p.au), ease.inOutCubic(sc)), [px, py] = toS(x, AXIS.y), r = lerp(ROW_R[i], 4 + (i >= 4 ? 3 : 0), sc) * (sc > 0.5 ? Math.min(z, 2) : z);
        ctx.save(); ctx.globalAlpha = rowA; bloom(ctx, p.color, px, py, r * 2.4 + 10, 0.35); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(px, py, Math.max(3, r), 0, Math.PI * 2); ctx.fill();
        if (p.id === "saturn") { ctx.strokeStyle = "rgba(230,210,154,.8)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py, Math.max(6, r * 1.7), Math.max(2, r * 0.45), -0.3, 0, Math.PI * 2); ctx.stroke(); }
        const showLabel = sc < 0.5 ? true : z > 2 ? p.au < 2 : p.au > 2 || i === 2;
        if (showLabel && px > 30 && px < 970) api.text(ctx, p.name, clamp(px, 90, 905), py + (i % 2 ? 64 : -46), { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", alpha: rowA });
        ctx.restore();
      });
      // the light pulse
      const tr = V("travel");
      if (tr > 0.001) { const x = lerp(AXIS.x0, auX(30.05), tr), [px, py] = toS(x, AXIS.y); bloom(ctx, "#FFF3C8", px, py, 40, 0.9); ctx.fillStyle = "#FFF8E0"; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill(); if (V("lbl.light") > 0.01) pill(api, ctx, `${T.light} ${fmtTime(tr * 30.05 * LIGHT_MIN_AU)}`, clamp(px, 260, 740), py - 90, { color: "#FFE3A0" }); }
    }
    // sizes: football and peppercorn
    const szA = V("sizes.a");
    if (szA > 0.01) { ctx.save(); ctx.globalAlpha = szA; bloom(ctx, "#FFC46B", 260, 330, 190, 0.5); ctx.fillStyle = "#FFE3A0"; ctx.beginPath(); ctx.arc(260, 330, 110, 0, Math.PI * 2); ctx.fill(); api.text(ctx, "Sun · football, 22 cm", 260, 500, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center" }); bloom(ctx, "#4F8FEA", 760, 330, 16, 0.9); ctx.fillStyle = "#6FA3F0"; ctx.beginPath(); ctx.arc(760, 330, 3, 0, Math.PI * 2); ctx.fill(); api.text(ctx, "Earth · peppercorn, 2 mm", 760, 400, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center" }); ctx.setLineDash([8, 10]); ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(390, 330); ctx.lineTo(740, 330); ctx.stroke(); ctx.setLineDash([]); api.text(ctx, "25 steps", 565, 312, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" }); ctx.restore(); }
    // orbit: almost a circle; closest in January (India's winter)
    const oA = V("orbit.a");
    if (oA > 0.01) {
      const a = 200, e = 0.0167, b = a * Math.sqrt(1 - e * e), ocx = 500 + a * e, ocy = 340, th = V("orbit") * Math.PI * 2 + Math.PI;
      ctx.save(); ctx.globalAlpha = oA; bloom(ctx, "#FFC46B", 500, 340, 70, 0.7); ctx.fillStyle = "#FFE3A0"; ctx.beginPath(); ctx.arc(500, 340, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ocx, ocy, a, b, 0, 0, Math.PI * 2); ctx.stroke();
      const ex = ocx + a * Math.cos(th), ey = ocy + b * Math.sin(th), dist = Math.hypot(ex - 500, ey - 340) / a;
      bloom(ctx, "#4F8FEA", ex, ey, 26, 0.9); ctx.fillStyle = "#6FA3F0"; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,226,160,.4)"; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(500, 340); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      pill(api, ctx, `${(dist * KM_AU / 1e7).toFixed(2)} crore km`, 500, 590, { color: C.ink, size: 38 });
      if (V("lbl.jan") > 0.01) api.text(ctx, T.jan, ocx - a - 20, 340, { font: "mono", size: 38, weight: 600, color: "#9CC4FF", align: "right", baseline: "middle", alpha: V("lbl.jan"), maxWidth: 270 });
      if (V("lbl.july") > 0.01) api.text(ctx, T.july, ocx + a + 20, 340, { font: "mono", size: 38, weight: 600, color: "#FFB547", baseline: "middle", alpha: V("lbl.july"), maxWidth: 260 });
      if (V("lbl.seasons") > 0.01) api.text(ctx, T.seasons, 500, 120, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", alpha: V("lbl.seasons") });
      ctx.restore();
    }
    const L = (k: string, text: string, x: number, y: number, col: string = C.ink3) => { const a = V("lbl." + k); if (a > 0.01) api.text(ctx, text, x, y, { font: "mono", size: 38, weight: 600, color: col, align: "center", alpha: a }); };
    if (!sh.interactive) { L("notToScale", T.notToScale, 500, 130); L("toScale", T.toScale, 500, 130, C.ink2); L("au", T.au, 500, 580, C.ink3); }
    const tA = V("title.a"); if (tA > 0.01) { ctx.save(); ctx.globalAlpha = tA; api.text(ctx, T.title, 500, 230, { font: "display", size: 72, weight: 800, align: "center", baseline: "middle", maxWidth: 900 }); ctx.restore(); }
    if (sh.interactive) drawInteractive(ctx, now);
    api.fx.drawWorld(ctx);
  }
  function drawInteractive(ctx: Ctx, now: number) {
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(iax.x0, iax.y); ctx.lineTo(iax.x1, iax.y); ctx.stroke();
    for (let au = 0; au <= span; au += span <= 12 ? 1 : 5) { const x = iX(au); ctx.beginPath(); ctx.moveTo(x, iax.y - 10); ctx.lineTo(x, iax.y + 10); ctx.stroke(); if (au % (span <= 12 ? 2 : 10) === 0) api.text(ctx, `${au}`, x, iax.y + 52, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" }); }
    api.text(ctx, "AU", iax.x1 + 44, iax.y + 52, { font: "mono", size: 38, weight: 600, color: C.ink3 });
    bloom(ctx, "#FFC46B", iX(0), iax.y, 40, 0.8); ctx.fillStyle = "#FFE3A0"; ctx.beginPath(); ctx.arc(iX(0), iax.y, 10, 0, Math.PI * 2); ctx.fill();
    const refs = PLANETS.filter((p) => p.id !== ask.id && p.au <= span && (p.id === "earth" || p.id === "jupiter" || p.id === "saturn"));
    for (const p of refs) { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(iX(p.au), iax.y, 8, 0, Math.PI * 2); ctx.fill(); api.text(ctx, p.name, iX(p.au), iax.y - 34, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center" }); }
    const x = iX(live.au);
    if (!live.answered) { ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = live.dragging ? 1 : 0.6 + 0.4 * Math.sin(now * 4); ctx.beginPath(); ctx.arc(x, iax.y - 90, 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = ask.color; ctx.beginPath(); ctx.arc(x, iax.y - 90, 16, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = ask.color; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(x, iax.y - 70); ctx.lineTo(x, iax.y); ctx.stroke(); ctx.setLineDash([]);
    api.text(ctx, ask.name, x, iax.y - 140, { font: "mono", size: 38, weight: 600, color: ask.color, align: "center" });
    if (live.answered) {
      const tx = iX(ask.au), ok = live.answered.verdict === "right";
      ctx.save(); ctx.globalAlpha = clamp(live.t / 0.4, 0, 1); ctx.strokeStyle = C.mint; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx, iax.y - 24); ctx.lineTo(tx, iax.y + 24); ctx.stroke();
      pill(api, ctx, `${ask.name} · ${ask.au} AU`, clamp(tx, 220, 780), iax.y + 120, { color: C.mint }); if (ok) tick(ctx, x + 44, iax.y - 120); else magnifier(ctx, x + 44, iax.y - 120); ctx.restore();
    }
  }
  api.onPointer({
    down(p) { if (sh.tapToPlay()) return; if (!sh.interactive || live.answered) return; if (Math.abs(p.y - (iax.y - 90)) < 90) { live.dragging = true; live.au = iAu(p.x); } },
    move(p) { if (live.dragging) live.au = iAu(p.x); },
    up() {
      if (!live.dragging) return; live.dragging = false;
      const e = Math.abs(live.au - ask.au) / span, g = api.answer("place_planet", { au: +live.au.toFixed(2) }, e <= 0.04 ? "right" : e <= 0.09 ? "partial" : "wrong");
      live.answered = { au: live.au, verdict: g.verdict }; live.t = 0; live.done = true;
      if (g.verdict === "right") sfx.blip({ f: 660, f2: 990, dur: 0.18, type: "triangle", gain: 0.12 }); else sfx.blip({ f: 260, f2: 160, dur: 0.2, gain: 0.12 });
      sh.say("P09", g.verdict === "right" ? `Right. ${ask.name} sits at ${ask.au} AU.` : `${ask.name} is at ${ask.au} AU. Most of the solar system is empty space.`);
      api.done({ placed: +live.au.toFixed(2), truth: ask.au, verdict: g.verdict });
      api.facts({ task: "place_planet", planet: ask.id, placed: +live.au.toFixed(2), truth: ask.au, verdict: g.verdict });
    },
  });
  api.onKey((k, d) => { if (d) sh.key(k); });
  return {
    update(dt) { if (sh.step(dt)) { api.task("", T.task.replace("Mars", ask.name)); api.event("interactive", { task: "place_planet", planet: ask.id }); } live.t += dt; api.facts({ t: +sh.head.t.toFixed(1), mode: sh.head.mode }); },
    render,
    seam: () => ({ state: live.done ? "final" : sh.head.mode, t: +sh.head.t.toFixed(2), total: +sh.tl.interactiveAt.toFixed(2), au: +live.au.toFixed(2) }),
    bot() {
      if (!sh.interactive) return sh.skim();
      if (live.answered) return { type: "wait", ms: 500 };
      return { type: "drag", from: [iX(live.au), iax.y - 90], to: [iX(ask.au + 0.25), iax.y - 90], ms: 900, after: 800 };
    },
    knob: (k) => sh.knob(k, () => { live.answered = null; live.done = false; live.au = span * 0.62; }),
    board: () => ({ title: "Mostly empty space", lines: ["Inner planets crowd close to the Sun.", "Earth is closest to the Sun in January."], figure: { kind: "numberline", min: 0, max: 30, marks: [{ v: 1, label: "Earth" }, { v: 5.2, label: "Jupiter" }, { v: 30, label: "Neptune" }] }, accent: "#FFC46B" }),
    dispose: () => sh.dispose(),
  };
}
export const solarscale: EngineDef<ScaleSpec> = { archetype: "scale-cinematic@1", label: "Animation · Scale", accent: C.sci, create };
