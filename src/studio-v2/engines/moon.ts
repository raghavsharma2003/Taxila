// WHY THE MOON HAS PHASES — `orbital-explainer@1` (STUDIO-V2 §11.3). Port of prototypes/reset/studio/03-moon-phases.
// A deterministic narration-locked timeline (core/timeline.ts): every property is f(t), so seek and replay are exact.
// Every lit half and terminator is computed from one angle (QB-A3: 0 disagreeing pixels over 49 phase angles in the
// prototype's probe, kept as `pixelCheck` on the seam). Ends hands-on: drag the Moon; the host grades the elongation.
import type { MoonSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, DEG, ease, mix, norm360, rng } from "../core/math.ts";
import { glow, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { captionAt, chunksOf, compileTimeline, lineTiming, Playhead, valueAt, type Chunk, type TimelineConfig } from "../core/timeline.ts";
import type { EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";

const INIT: Record<string, number> = {
  "sky.a": 1, "space.a": 0, "cam.zoom": 2.6, "cam.x": 500, "cam.y": 300, "title.a": 0, "skyMoon.E": 40,
  "sun.a": 0, "rays.a": 0, "earth.a": 1, "orbit.a": 0, "moon.a": 0, "moon.theta": 315, "ghosts.n": 0, "ghosts.a": 1,
  "arcSun.a": 0, "arcNear.a": 0, "overlap.a": 0, "sight.a": 0, "inset.a": 0, "strip.a": 0, "strip.n": 0, "phase.a": 0,
  "shadow.a": 0, "eclipse.k": 0, "lbl.sun": 0, "lbl.earth": 0, "lbl.moon": 0, "lbl.light": 0, "lbl.scale": 0, "lbl.eclipse": 0,
};
const CFG: TimelineConfig = {
  init: INIT,
  showable: ["sky", "space", "title", "sun", "rays", "earth", "orbit", "moon", "ghosts", "arcSun", "arcNear", "overlap", "sight", "inset", "strip", "phase", "shadow"],
  labels: ["sun", "earth", "moon", "light", "scale", "eclipse"],
  verbs: { orbit: { prop: "moon.theta", key: "to", ease: "inOutSine" }, skyPhase: { prop: "skyMoon.E", key: "to", ease: "inOutSine" }, ghosts: { prop: "ghosts.n", key: "n", min: 0, max: 8, ease: "linear" }, strip: { prop: "strip.n", key: "n", min: 0, max: 8, ease: "linear" }, eclipse: { prop: "eclipse.k", key: "k", min: 0, max: 1, ease: "inOutSine" } },
};
const EARTH = { x: 500, y: 300 }, R_ORB = 180, RE = 44, RM = 22, INSET = { x: 812, y: 336, r: 114 }, SUN = { x: -190, y: 300, r: 300 };
const elong = (theta: number) => norm360(theta - 180);
const moonWorld = (theta: number) => ({ x: EARTH.x + R_ORB * Math.cos(theta * DEG), y: EARTH.y - R_ORB * Math.sin(theta * DEG) });
const phaseIndex = (E: number) => Math.floor(norm360(E + 22.5) / 45) % 8;

function create(api: EngineApi, spec: MoonSpec): EngineInstance {
  const T = spec.strings;
  let pace = 1;
  let tl = compileTimeline(spec.beats, spec.text, spec.narration, CFG, pace);
  if (tl.repairs.length) api.event("timeline_repaired", { repairs: tl.repairs.slice(0, 20) });
  let head = new Playhead(tl, (id) => api.say(id));
  const live = { theta: null as number | null, dragging: false, task: 0, verdict: null as null | "good" | "look", verdictT: 0, done: false, chunks: null as Chunk[] | null, sayT: 0, finalT: 0, bootT: 0, timers: [] as number[] };
  const V = (p: string) => valueAt(tl, INIT, p, head.t);
  const r0 = rng(99);
  const stars = Array.from({ length: 150 }, () => ({ x: r0() * W, y: r0() * H, z: r0(), tw: r0() * 6.28 }));
  const craters = Array.from({ length: 9 }, () => ({ a: r0() * 6.28, d: r0() * 0.75, r: 0.12 + r0() * 0.22 }));
  const lands = Array.from({ length: 7 }, () => ({ a: r0() * 6.28, d: 0.35 + r0() * 0.5, r: 0.18 + r0() * 0.25 }));
  const TWINKLE = stars.filter((s) => s.z > 0.78);

  // ── primitives
  function moonPhaseDisc(ctx: Ctx, x: number, y: number, r: number, E0: number, eclipse = 0) {
    const E = norm360(E0), waxing = E < 180, e = waxing ? E : 360 - E, k = Math.cos(e * DEG);
    ctx.save(); ctx.translate(x, y); if (!waxing) ctx.scale(-1, 1);
    ctx.fillStyle = eclipse ? mix("#1C222F", "#3A1A12", eclipse) : "#1A2030"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, -r); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    if (k >= 0) ctx.ellipse(0, 0, Math.max(0.001, r * k), r, 0, Math.PI / 2, -Math.PI / 2, true); else ctx.ellipse(0, 0, Math.max(0.001, -r * k), r, 0, Math.PI / 2, Math.PI * 1.5, false);
    ctx.closePath(); ctx.clip();
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, eclipse ? mix("#F2F0EA", "#D0673C", eclipse) : "#F4F2EC"); g.addColorStop(1, eclipse ? mix("#B9BCC6", "#7A2E18", eclipse) : "#B5B9C4");
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
    ctx.globalAlpha *= 0.16; ctx.fillStyle = "#3A4050";
    for (const c of craters) { ctx.beginPath(); ctx.arc(Math.cos(c.a) * c.d * r, Math.sin(c.a) * c.d * r, c.r * r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function topMoon(ctx: Ctx, x: number, y: number, r: number, alpha: number, ek: number) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y);
    ctx.fillStyle = "#151A26"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false); ctx.closePath(); ctx.clip();
    const g = ctx.createRadialGradient(-r * 0.5, 0, 1, 0, 0, r); g.addColorStop(0, ek ? mix("#F4F2EC", "#D0673C", ek) : "#F4F2EC"); g.addColorStop(1, ek ? mix("#A9AEBA", "#6A2A16", ek) : "#A9AEBA");
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
    if (ek) { ctx.fillStyle = `rgba(150,60,30,${0.5 * ek})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha *= 0.18; ctx.fillStyle = "#2E3443";
    for (const c of craters) { ctx.beginPath(); ctx.arc(Math.cos(c.a) * c.d * r, Math.sin(c.a) * c.d * r, c.r * r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function earthTop(ctx: Ctx, x: number, y: number, r: number, alpha: number) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * 0.4, -r * 0.2, r * 0.1, 0, 0, r); g.addColorStop(0, "#3F8BF0"); g.addColorStop(1, "#13408F");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(92,170,110,.85)"; for (const l of lands) { ctx.beginPath(); ctx.ellipse(Math.cos(l.a) * l.d * r, Math.sin(l.a) * l.d * r, l.r * r * 1.3, l.r * r, l.a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "rgba(240,246,255,.92)"; ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2); ctx.fill();
    const ng = ctx.createLinearGradient(-r * 0.12, 0, r * 0.18, 0); ng.addColorStop(0, "rgba(4,7,18,0)"); ng.addColorStop(1, "rgba(4,7,18,.78)");
    ctx.fillStyle = ng; ctx.fillRect(-r * 0.12, -r, r * 2, r * 2); ctx.restore();
    ctx.strokeStyle = "rgba(130,190,255,.55)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // static layers
  const paintSky = (g: Ctx) => {
    const gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, "#070A1C"); gr.addColorStop(0.55, "#1A1D46"); gr.addColorStop(0.82, "#4A2E58"); gr.addColorStop(1, "#C0705A");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (const s of stars) { if (s.y > 470 || s.z > 0.78) continue; g.globalAlpha = (0.25 + 0.6 * s.z * 0.8) * (1 - s.y / 520); g.fillStyle = "#E8ECFF"; const r = 0.7 + s.z * 1.5; g.fillRect(s.x, s.y, r, r); }
    g.globalAlpha = 1;
  };
  const paintSkyline = (g: Ctx) => {
    const r2 = rng(7), base = 588; g.fillStyle = "#06070D";
    let x = -10; const wins: XY[] = [];
    while (x < W + 10) {
      const w = 34 + r2() * 70, h = 36 + r2() * 96; g.fillRect(x, base - h, w, h + 80);
      if (r2() < 0.45) { g.fillRect(x + w * 0.2, base - h - 14, w * 0.28, 14); g.beginPath(); g.ellipse(x + w * 0.34, base - h - 14, w * 0.14, 5, 0, 0, Math.PI * 2); g.fill(); }
      for (let yy = base - h + 14; yy < base - 10; yy += 18) for (let xx = x + 8; xx < x + w - 10; xx += 14) if (r2() < 0.18) wins.push([xx, yy]);
      x += w + 2 + r2() * 6;
    }
    g.beginPath(); g.moveTo(630, base - 70); g.quadraticCurveTo(650, base - 160, 668, base - 182); g.quadraticCurveTo(686, base - 160, 706, base - 70); g.closePath(); g.fill(); g.fillRect(665, base - 202, 6, 24);
    g.beginPath(); for (let i = 0; i < 11; i++) { const cx = 800 + i * 18, cy = base - 112 - Math.sin((i / 10) * Math.PI) * 30 + (i % 3) * 6; g.moveTo(cx + 34, cy); g.arc(cx, cy, 34 + (i % 2) * 8, 0, Math.PI * 2); } g.fill();
    g.fillRect(884, base - 96, 16, 100); g.fillRect(846, base - 70, 6, 74); g.fillRect(926, base - 74, 6, 78);
    g.fillStyle = "rgba(255,206,130,.55)"; for (const [wx, wy] of wins) g.fillRect(wx, wy, 6, 8);
    g.fillStyle = "#06070D"; g.fillRect(0, base, W, H - base);
  };
  const paintSpace = (g: Ctx) => {
    const bg = g.createRadialGradient(500, 300, 50, 500, 300, 700); bg.addColorStop(0, "#0D1120"); bg.addColorStop(1, "#05060B");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (const s of stars) { if (s.z > 0.78) continue; g.globalAlpha = 0.15 + 0.45 * s.z; g.fillStyle = "#C9D2F2"; const r = 0.6 + s.z * 1.3; g.fillRect(s.x, s.y, r, r); }
    g.globalAlpha = 1;
  };
  const paintSun = (g: Ctx) => {
    paintSpace(g);
    g.globalCompositeOperation = "lighter"; g.drawImage(glow("#FFB24A", 300, 0.15), SUN.x - 560, SUN.y - 560, 1120, 1120); g.globalCompositeOperation = "source-over";
    const sg = g.createRadialGradient(SUN.x + 60, SUN.y - 40, 40, SUN.x, SUN.y, SUN.r); sg.addColorStop(0, "#FFF4D6"); sg.addColorStop(0.7, "#FFD27A"); sg.addColorStop(1, "#FFA94A");
    g.fillStyle = sg; g.beginPath(); g.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2); g.fill();
  };

  // ── render
  function render(ctx: Ctx, now: number) {
    const theta = live.theta ?? V("moon.theta");
    ctx.fillStyle = "#07080E"; ctx.fillRect(0, 0, W, H);
    const skyA = V("sky.a"), spaceA = V("space.a");
    if (spaceA > 0.002) drawSpace(ctx, theta, spaceA, now);
    if (skyA > 0.002) drawSky(ctx, skyA, now);
    const insA = V("inset.a"); if (insA > 0.01) drawInset(ctx, theta, insA * spaceA);
    const stripA = V("strip.a"); if (stripA > 0.01) drawStrip(ctx, theta, stripA * spaceA);
    const tA = V("title.a");
    if (tA > 0.01) {
      ctx.save(); ctx.globalAlpha = tA; const y = 300 - (1 - ease.outCubic(tA)) * 12;
      api.text(ctx, T.title, 500, y, { font: "display", size: 78, weight: 800, align: "center", baseline: "middle", track: -2, maxWidth: 900 });
      ctx.strokeStyle = C.ion; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(500 - 130 * tA, y + 62); ctx.lineTo(500 + 130 * tA, y + 62); ctx.stroke(); ctx.restore();
    }
    if (head.mode !== "timeline") drawInteractiveCue(ctx, theta, now);
    api.fx.drawWorld(ctx); api.fx.drawScreen(ctx);
  }
  function drawSky(ctx: Ctx, a: number, now: number) {
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(api.layer("sky", paintSky), 0, 0, W, H);
    for (const s of TWINKLE) { if (s.y > 470) continue; ctx.globalAlpha = a * (0.25 + 0.6 * s.z * (0.6 + 0.4 * Math.sin(now * 1.3 + s.tw))) * (1 - s.y / 520); ctx.fillStyle = "#E8ECFF"; const r = 0.7 + s.z * 1.5; ctx.fillRect(s.x, s.y, r, r); }
    ctx.globalAlpha = a;
    const E = V("skyMoon.E"), mx = 300, my = 190, mr = 50;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.35 * (0.3 + (0.7 * (1 - Math.cos(E * DEG))) / 2); ctx.drawImage(glow("#DDE6FF", 120, 0.1), mx - 180, my - 180, 360, 360); ctx.restore();
    moonPhaseDisc(ctx, mx, my, mr, E);
    ctx.drawImage(api.layer("skyline", paintSkyline), 0, 0, W, H);
    ctx.restore();
  }
  function drawSpace(ctx: Ctx, theta: number, a: number, now: number) {
    const zoom = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y"), toS = (x: number, y: number) => ({ x: (x - cx) * zoom + 500, y: (y - cy) * zoom + 300 });
    ctx.save(); ctx.globalAlpha = a;
    const sunA = V("sun.a");
    if (sunA < 0.995) ctx.drawImage(api.layer("space", paintSpace), 0, 0, W, H);
    if (sunA > 0.01) { ctx.globalAlpha = a * sunA; ctx.drawImage(api.layer("space-sun", paintSun), 0, 0, W, H); }
    for (const s of TWINKLE) { ctx.globalAlpha = a * (0.15 + 0.45 * s.z) * (0.75 + 0.25 * Math.sin(now + s.tw)); ctx.fillStyle = "#C9D2F2"; const r = 0.6 + s.z * 1.3; ctx.fillRect(s.x, s.y, r, r); }
    ctx.globalAlpha = a;
    const raysA = V("rays.a");
    if (raysA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * raysA * 0.5; ctx.strokeStyle = "#FFD27A"; ctx.lineWidth = 4; ctx.lineCap = "round";
      const off = api.reducedMotion ? 0 : (now * 160) % 260;
      for (let row = 0; row < 11; row++) { const y = 40 + row * 54 + (row % 2) * 10; for (let x = 60 - 260 + off + (row % 3) * 70; x < W; x += 260) { const x0 = Math.max(60, x); if (x + 110 > x0) { const gr = ctx.createLinearGradient(x, 0, x + 110, 0); gr.addColorStop(0, "rgba(255,210,122,0)"); gr.addColorStop(1, "rgba(255,210,122,.95)"); ctx.strokeStyle = gr; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x + 110, y); ctx.stroke(); } } }
      ctx.restore();
    }
    ctx.save(); ctx.translate(500, 300); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
    const lw = (w: number) => w / zoom;
    const shA = V("shadow.a");
    if (shA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * shA;
      const g = ctx.createLinearGradient(EARTH.x, 0, EARTH.x + 620, 0); g.addColorStop(0, "rgba(5,6,11,.97)"); g.addColorStop(0.75, "rgba(5,6,11,.9)"); g.addColorStop(1, "rgba(5,6,11,.35)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(EARTH.x, EARTH.y - RE); ctx.lineTo(EARTH.x + 620, EARTH.y - RE * 0.42); ctx.lineTo(EARTH.x + 620, EARTH.y + RE * 0.42); ctx.lineTo(EARTH.x, EARTH.y + RE); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(170,180,210,.6)"; ctx.lineWidth = lw(4); ctx.setLineDash([lw(10), lw(10)]);
      ctx.beginPath(); ctx.moveTo(EARTH.x, EARTH.y - RE); ctx.lineTo(EARTH.x + 620, EARTH.y - RE * 0.42); ctx.moveTo(EARTH.x, EARTH.y + RE); ctx.lineTo(EARTH.x + 620, EARTH.y + RE * 0.42); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    const oA = V("orbit.a");
    if (oA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * oA * 0.55; ctx.strokeStyle = C.ink3; ctx.lineWidth = lw(4); ctx.setLineDash([lw(6), lw(12)]);
      ctx.beginPath(); ctx.arc(EARTH.x, EARTH.y, R_ORB, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      const ah = 40 * DEG, p = { x: EARTH.x + R_ORB * Math.cos(ah), y: EARTH.y - R_ORB * Math.sin(ah) };
      ctx.translate(p.x, p.y); ctx.rotate(-ah - Math.PI / 2 + Math.PI);
      ctx.fillStyle = C.ink3; ctx.beginPath(); ctx.moveTo(0, -lw(10)); ctx.lineTo(lw(9), lw(8)); ctx.lineTo(-lw(9), lw(8)); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    const gn = V("ghosts.n"), gA = V("ghosts.a");
    if (gn > 0.01 && gA > 0.01) for (let i = 0; i < 8; i++) { const k = clamp(gn - i, 0, 1); if (k <= 0) continue; const p = moonWorld(i * 45); topMoon(ctx, p.x, p.y, RM * (0.6 + 0.4 * ease.outBack(k)), a * gA * k * 0.75, 0); }
    earthTop(ctx, EARTH.x, EARTH.y, RE, a * V("earth.a"));
    const mA = V("moon.a"), mp = moonWorld(theta);
    const inShadow = shA > 0.2 && Math.abs(mp.y - EARTH.y) < RE * 0.55 && mp.x > EARTH.x, ecl = inShadow ? V("eclipse.k") : 0;
    if (mA > 0.01) {
      const sA = V("sight.a");
      if (sA > 0.01) { const dx = mp.x - EARTH.x, dy = mp.y - EARTH.y, d = Math.hypot(dx, dy); ctx.save(); ctx.globalAlpha = a * sA * 0.8; ctx.strokeStyle = C.ion; ctx.lineWidth = lw(4); ctx.setLineDash([lw(8), lw(9)]); ctx.beginPath(); ctx.moveTo(EARTH.x + (dx / d) * (RE + 8), EARTH.y + (dy / d) * (RE + 8)); ctx.lineTo(mp.x - (dx / d) * (RM + 22), mp.y - (dy / d) * (RM + 22)); ctx.stroke(); ctx.restore(); }
      topMoon(ctx, mp.x, mp.y, RM, a * mA, ecl);
      const sunArc = V("arcSun.a"), nearArc = V("arcNear.a"), ov = V("overlap.a"), toEarth = Math.atan2(EARTH.y - mp.y, EARTH.x - mp.x);
      if (sunArc > 0.01) { ctx.save(); ctx.globalAlpha = a * sunArc; ctx.strokeStyle = "#FFC86B"; ctx.lineWidth = lw(5); ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(mp.x, mp.y, RM + 9, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); ctx.restore(); }
      if (nearArc > 0.01) { ctx.save(); ctx.globalAlpha = a * nearArc; ctx.strokeStyle = C.ion; ctx.lineWidth = lw(5); ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(mp.x, mp.y, RM + 18, toEarth - Math.PI / 2, toEarth + Math.PI / 2); ctx.stroke(); ctx.restore(); }
      if (ov > 0.01) {
        const TWO = Math.PI * 2, segs: XY[] = [];
        for (const k of [-1, 0, 1]) { const s = Math.max(Math.PI / 2, toEarth - Math.PI / 2 + k * TWO), e = Math.min(Math.PI * 1.5, toEarth + Math.PI / 2 + k * TWO); if (e > s + 1e-3) segs.push([s, e]); }
        ctx.save(); ctx.globalAlpha = a * ov * (0.7 + 0.3 * Math.sin(now * 5)); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = lw(7); ctx.lineCap = "round";
        for (const [s0, s1] of segs) { ctx.beginPath(); ctx.arc(mp.x, mp.y, RM + 27, s0, s1); ctx.stroke(); }
        ctx.restore();
      }
    }
    ctx.restore();
    const ep = toS(EARTH.x, EARTH.y), ms = toS(mp.x, mp.y), L = (k: string) => V("lbl." + k);
    if (L("sun") > 0.01) api.text(ctx, T.sun, 18, 316, { font: "mono", size: 40, weight: 700, color: "#3A2208", alpha: a * L("sun") });
    if (L("light") > 0.01) { ctx.save(); ctx.globalAlpha = a * L("light"); api.text(ctx, T.light, 150, 196, { font: "mono", size: 38, weight: 600, color: "#FFD27A" }); ctx.strokeStyle = "#FFD27A"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(346, 183); ctx.lineTo(392, 183); ctx.lineTo(380, 172); ctx.moveTo(392, 183); ctx.lineTo(380, 194); ctx.stroke(); ctx.restore(); }
    if (L("earth") > 0.01) api.text(ctx, T.earth, ep.x, ep.y + RE * zoom + 46, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", alpha: a * L("earth") });
    if (L("moon") > 0.01 && mA > 0.01) { const dx = ms.x - ep.x, dy = ms.y - ep.y, d = Math.hypot(dx, dy) || 1; api.text(ctx, T.moon, ms.x + (dx / d) * 70, ms.y + (dy / d) * 62 + 12, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", alpha: a * L("moon") }); }
    if (L("scale") > 0.01) api.text(ctx, T.scale, 200, 60, { font: "mono", size: 38, weight: 500, color: C.ink3, alpha: a * 0.75 * L("scale") });
    if (shA > 0.01) {
      const words = String(T.shadow).split(/\s+/), sx = ep.x + Math.max(150, RE * zoom + 40), sy = ep.y + RE * zoom + 46;
      const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : words;
      lines.forEach((ln, i) => api.text(ctx, ln, sx, sy + i * 42, { font: "mono", size: 38, weight: 600, color: "#9AA6C8", alpha: a * shA }));
    }
    if (L("eclipse") > 0.01 && inShadow) api.text(ctx, T.eclipse, ms.x, ms.y - 52, { font: "mono", size: 38, weight: 600, color: "#E8956A", align: "center", alpha: a * L("eclipse") });
    ctx.restore();
  }
  function drawInset(ctx: Ctx, theta: number, a: number) {
    const E = elong(theta), { x, y, r } = INSET;
    ctx.save(); ctx.globalAlpha = a;
    api.text(ctx, T.fromEarth, x, y - r - 26, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" });
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, "#0A1030"); g.addColorStop(0.75, "#1B2353"); g.addColorStop(1, "#3B2A55");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 26; i++) { const s = stars[i]; ctx.globalAlpha = a * (0.3 + 0.5 * s.z); ctx.fillStyle = "#E6EAFF"; ctx.fillRect(x - r + (s.x / W) * r * 2, y - r + (s.y / H) * r * 1.4, 1.6, 1.6); }
    ctx.globalAlpha = a;
    const mr = 64, my = y - 14, inShadow = V("shadow.a") > 0.2 && Math.abs(E - 180) < 8, ecl = inShadow ? V("eclipse.k") : 0;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.4 * ((1 - Math.cos(E * DEG)) / 2) * (1 - ecl * 0.7); ctx.drawImage(glow("#DDE6FF", 100, 0.1), x - 150, my - 150, 300, 300); ctx.restore();
    moonPhaseDisc(ctx, x, my, mr, E, ecl);
    ctx.fillStyle = "#06070D"; for (let i = 0; i < 12; i++) { const bw = 18 + ((i * 37) % 22), bh = 18 + ((i * 53) % 34); ctx.fillRect(x - r + i * 22, y + r - bh, bw, bh); }
    ctx.restore();
    ctx.strokeStyle = live.verdict === "good" && live.verdictT < 1.2 ? C.mint : C.ion; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    const pa = V("phase.a"); if (pa > 0.01) api.text(ctx, spec.phases[phaseIndex(E)], x, y + r + 48, { font: "mono", size: 38, weight: 600, align: "center", alpha: pa, maxWidth: 330 });
    ctx.restore();
  }
  function drawStrip(ctx: Ctx, theta: number, a: number) {
    const n = V("strip.n"), cur = phaseIndex(elong(theta)), x0 = 72, y = 512, gap = 58, r = 20;
    ctx.save();
    for (let i = 0; i < 8; i++) { const k = clamp(n - i, 0, 1); ctx.globalAlpha = a * (0.18 + 0.82 * k); moonPhaseDisc(ctx, x0 + i * gap, y, r * (0.85 + 0.15 * k), i * 45); if (i === cur && k > 0.5) { ctx.globalAlpha = a; ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x0 + i * gap, y, r + 8, 0, Math.PI * 2); ctx.stroke(); } }
    ctx.restore();
  }
  const screenOf = (theta: number) => { const zoom = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y"), mp = moonWorld(theta); return { x: (mp.x - cx) * zoom + 500, y: (mp.y - cy) * zoom + 300, ex: (EARTH.x - cx) * zoom + 500, ey: (EARTH.y - cy) * zoom + 300, zoom }; };
  function drawInteractiveCue(ctx: Ctx, theta: number, now: number) {
    const s = screenOf(theta);
    if (!live.done) {
      const p = 0.5 + 0.5 * Math.sin(now * 4);
      ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = live.dragging ? 1 : 0.55 + 0.45 * p;
      ctx.beginPath(); ctx.arc(s.x, s.y, RM * s.zoom + 14 + (live.dragging ? 0 : 6 * p), 0, Math.PI * 2); ctx.stroke();
      if (!live.dragging) { ctx.globalAlpha = 0.35; ctx.setLineDash([6, 12]); ctx.lineDashOffset = -now * 30; ctx.beginPath(); ctx.arc(s.ex, s.ey, R_ORB * s.zoom, -(theta + 6) * DEG, -(theta + 70) * DEG, true); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
    }
    if (live.verdict && live.verdictT < 2.4) {
      const k = live.verdictT < 0.2 ? live.verdictT / 0.2 : live.verdictT > 2 ? 1 - (live.verdictT - 2) / 0.4 : 1;
      ctx.save(); ctx.globalAlpha = k; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 6;
      const bx = s.x + (s.x > s.ex ? 54 : -54), by = s.y - 40;
      if (live.verdict === "good") { ctx.strokeStyle = C.mint; ctx.beginPath(); ctx.moveTo(bx - 12, by); ctx.lineTo(bx - 3, by + 10); ctx.lineTo(bx + 14, by - 10); ctx.stroke(); }
      else { ctx.strokeStyle = C.amber; ctx.beginPath(); ctx.arc(bx - 3, by - 3, 11, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + 5, by + 5); ctx.lineTo(bx + 15, by + 15); ctx.stroke(); }
      ctx.restore();
    }
  }
  function sayLive(id: string) {
    if (!spec.text[id] && !spec.narration[id]) return;
    const c = chunksOf(lineTiming(id, spec.text, spec.narration));
    live.chunks = c.chunks; live.sayT = 0; api.say(id);
  }
  api.onPointer({
    down(p) {
      if (head.mode === "timeline") { head.play(); return; }
      if (live.done || live.theta == null) return;
      const s = screenOf(live.theta);
      if (Math.hypot(p.x - s.x, p.y - s.y) < 90) { live.dragging = true; live.verdict = null; }
    },
    move(p) {
      if (!live.dragging || live.theta == null) return;
      const s = screenOf(live.theta), ang = Math.atan2(-(p.y - s.ey), p.x - s.ex) / DEG;
      let d = norm360(ang - live.theta); if (d > 180) d -= 360; live.theta += d;
    },
    up() {
      if (!live.dragging || live.theta == null) return;
      live.dragging = false;
      const E = elong(live.theta), item = live.task === 0 ? "evening_half_moon" : "full_moon";
      const near = (x: number, c: number) => Math.abs(((x - c + 540) % 360) - 180) <= 15;
      const g = api.answer(item, +E.toFixed(1), near(E, live.task === 0 ? 90 : 180) ? "right" : Math.abs(((E - (live.task === 0 ? 90 : 180) + 540) % 360) - 180) <= 30 ? "partial" : "wrong");
      if (g.verdict === "right") {
        live.verdict = "good"; live.verdictT = 0;
        const s = screenOf(live.theta); api.fx.ring(s.x, s.y, { color: C.mint, r0: 20, r1: 90, life: 0.6, width: 6 }); sfx.blip({ f: 660, f2: 990, dur: 0.18, type: "triangle", gain: 0.12 });
        if (live.task === 0) { sayLive("L18"); live.task = 1; live.timers.push(window.setTimeout(() => sayLive("L19"), 2400)); }
        else { sayLive("L20"); live.done = true; api.done({ task: "phases" }); }
      } else if (live.task === 0 && g.detail === "morning-half-moon") { live.verdict = "look"; live.verdictT = 0; sayLive("L21"); }
    },
  });
  api.onKey((k, down) => {
    if (!down) return;
    if (k === " ") { if (head.playing) head.pause(); else head.play(); }
    if (k === "ArrowRight") head.seek(head.t + 5);
    if (k === "ArrowLeft") head.seek(head.t - 5);
  });
  function update(dt: number) {
    live.bootT += dt;
    if (live.bootT > 0.6 && !head.playing && head.mode === "timeline" && live.bootT < 0.7) head.play();
    if (head.step(dt)) { live.theta = V("moon.theta"); live.task = 0; api.event("interactive", { task: "first_quarter" }); }
    let cap = "";
    if (head.mode === "timeline") cap = captionAt(tl, head.t);
    else if (live.chunks) { live.sayT += dt; for (const c of live.chunks) if (live.sayT >= c.t0 - 0.05 && live.sayT < c.t1 + 0.3) cap = c.text; }
    api.caption(cap);
    api.progress(head.frac, head.marks);
    if (live.verdict) live.verdictT += dt;
    const th = live.theta ?? V("moon.theta");
    api.facts({ t: +head.t.toFixed(1), mode: head.mode, phase: spec.phases[phaseIndex(elong(th))], elongation: +elong(th).toFixed(0) });
  }
  return {
    update, render,
    seam: () => {
      const theta = live.theta ?? V("moon.theta"), s = screenOf(theta);
      return { state: live.done ? "final" : head.mode, t: +head.t.toFixed(2), total: +tl.interactiveAt.toFixed(2), E: +elong(theta).toFixed(1), phase: spec.phases[phaseIndex(elong(theta))], moon: { x: s.x, y: s.y }, task: live.task,
        pixelCheck: (E: number) => { const c = document.createElement("canvas"); c.width = c.height = 220; const g = c.getContext("2d")!; g.fillStyle = "#000"; g.fillRect(0, 0, 220, 220); moonPhaseDisc(g, 110, 110, 100, E); return c.toDataURL().length; } };
    },
    bot() {
      if (head.mode === "timeline") { if (!head.playing) return { type: "tap", at: [500, 300] }; return head.t < 20 ? { type: "wait", ms: 500 } : { type: "key", key: "ArrowRight", after: 1500 }; }   // natural opening, then skim
      if (live.done || live.theta == null) return { type: "wait", ms: 500 };
      const theta = live.theta, E = elong(theta), want = live.task === 0 ? (live.verdict === "look" || E < 200 ? 90 : 270) : 180;
      const target = theta + (((want - E + 540) % 360) - 180);
      const pts: XY[] = [];
      const n = Math.max(6, Math.round(Math.abs(target - theta) / 8));
      for (let i = 0; i <= n; i++) { const q = screenOf(theta + ((target - theta) * i) / n); pts.push([q.x, q.y]); }
      return { type: "path", points: pts, ms: 900, after: 2600 };
    },
    knob(k) {
      if (k === "slower" || k === "faster") {
        const frac = head.t / Math.max(0.1, tl.interactiveAt);
        pace = clamp(pace * (k === "slower" ? 0.85 : 1.15), 0.6, 1.4);
        tl = compileTimeline(spec.beats, spec.text, spec.narration, CFG, pace);
        const mode = head.mode; head = new Playhead(tl, (id) => api.say(id), frac * tl.interactiveAt); head.mode = mode; head.play();
        return true;
      }
      if (k === "again") { live.theta = null; live.done = false; live.task = 0; live.verdict = null; live.chunks = null; head = new Playhead(tl, (id) => api.say(id)); head.play(); return true; }
      return false;
    },
    board: () => ({ title: "Half lit, always", lines: ["The Sun always lights half of the Moon.", "What we see depends on how much of that half faces us."], figure: { kind: "chain", items: ["new", "crescent", "half", "gibbous", "full"] }, accent: C.sci }),
    dispose: () => { for (const t of live.timers) clearTimeout(t); },
  };
}
export const moon: EngineDef<MoonSpec> = { archetype: "orbital-explainer@1", label: "Animation · Moon", accent: C.sci, create };
