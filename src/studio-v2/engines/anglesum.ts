// WHY A TRIANGLE MAKES 180° — `angle-sum@1` (STUDIO-V2 §6.2 A7, c7-maths-ch07-t03). A narration-locked explainer:
// the three corners tear off and slide onto a straight line (exact wedge geometry: each corner rotates so its edges
// abut), then the triangle is stretched with live angle readouts while the sum stays 180°, and scaled huge and tiny
// (c7-maths-ch07-t03-m-bigger-more). Hands-on ending: two corners sit on the line; drag the third corner's free arm
// to close the gap. The host grades the third angle against 180 − a − b from the spec.
import type { AngleSumSpec } from "../../../shared/studio-spec.ts";
import { C, W, H } from "../core/tokens.ts";
import { clamp, DEG, ease, lerp } from "../core/math.ts";
import { magnifier, tick, type Ctx } from "../core/draw.ts";
import { sfx } from "../core/sfx.ts";
import { ExplainerShell } from "../core/explainer.ts";
import type { TimelineConfig } from "../core/timeline.ts";
import type { EngineApi, EngineDef, EngineInstance, XY } from "../core/types.ts";
import { pill } from "../core/ui.ts";

const INIT: Record<string, number> = { "title.a": 0, "triangle.a": 0, "sum.a": 0, "tear": 0, "align": 0, "morph": 0, "cam.zoom": 1, "cam.x": 500, "cam.y": 360, "lbl.straight": 0 };
const CFG: TimelineConfig = { init: INIT, showable: ["title", "triangle", "sum"], labels: ["straight"], verbs: { tear: { prop: "tear", key: "to", min: 0, max: 1 }, align: { prop: "align", key: "to", min: 0, max: 1 }, morph: { prop: "morph", key: "to", min: 0, max: 1, ease: "inOutSine" } } };
const COLS = [C.ion, C.sci, C.sun], P: XY = [500, 530], WR = 74;
const ang = (a: XY, b: XY) => Math.atan2(-(b[1] - a[1]), b[0] - a[0]) / DEG;   // math angle (y up), degrees
const n360 = (a: number) => ((a % 360) + 360) % 360;

function create(api: EngineApi, spec: AngleSumSpec): EngineInstance {
  const T = spec.strings, sh = new ExplainerShell(api, spec, CFG), V = sh.V;
  const live = { theta: spec.task[1] + 20, dragging: false, answered: null as null | { angle: number; verdict: string }, t: 0, done: false };
  function tri(a: number, b: number, scale = 1): XY[] {
    const base = 400 * scale, A: XY = [500 - base / 2, 430], B: XY = [500 + base / 2, 430];
    const ta = Math.tan(a * DEG), tb = Math.tan(b * DEG), x = (tb * base) / (ta + tb), h = x * ta;
    return [A, B, [A[0] + x, A[1] - h]];
  }
  function corners(pts: XY[]) {
    const [A, B, Cc] = pts;
    // each wedge: vertex, start direction, sweep (anticlockwise)
    const a0 = ang(A, B), a1 = ang(A, Cc), b0 = ang(B, Cc), b1 = ang(B, A), c0 = ang(Cc, A), c1 = ang(Cc, B);
    return [{ v: A, d: a0, s: n360(a1 - a0) }, { v: B, d: b0, s: n360(b1 - b0) }, { v: Cc, d: c0, s: n360(c1 - c0) }];
  }
  function wedge(ctx: Ctx, v: XY, d: number, s: number, col: string, r = WR, label?: string) {
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha *= 0.85;
    ctx.beginPath(); ctx.moveTo(v[0], v[1]); ctx.arc(v[0], v[1], r, -d * DEG, -(d + s) * DEG, true); ctx.closePath(); ctx.fill();
    ctx.globalAlpha /= 0.85; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; ctx.stroke();
    if (label) { const m = (d + s / 2) * DEG; api.text(ctx, label, v[0] + Math.cos(m) * (r + 34), v[1] - Math.sin(m) * (r + 34), { font: "mono", size: 38, weight: 700, color: col, align: "center", baseline: "middle" }); }
    ctx.restore();
  }
  function render(ctx: Ctx, now: number) {
    ctx.fillStyle = "#0B0D14"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1; for (let x = 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (sh.interactive) { drawInteractive(ctx, now); return; }
    const z = V("cam.zoom"), tA = V("triangle.a"), tear = V("tear"), al = V("align"), mo = V("morph");
    const k = Math.sin(mo * Math.PI), a = lerp(spec.triangle[0], 28, k), b = lerp(spec.triangle[1], 74, k);
    const pts = tri(clamp(a, 15, 120), clamp(b, 15, 120), 1);
    ctx.save(); ctx.translate(500, 360); ctx.scale(z, z); ctx.translate(-500, -360);
    if (tA > 0.01) {
      ctx.save(); ctx.globalAlpha = tA * (1 - 0.65 * Math.max(tear, al));
      ctx.fillStyle = "rgba(139,152,255,.08)"; ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      const cs = corners(pts), cen: XY = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];
      // aligned targets on the straight line through P: B-wedge [0, b], C-wedge [b, b + c], A-wedge [b + c, 180]
      const targ = [180 - cs[0].s, 0, cs[1].s];
      cs.forEach((cw, i) => {
        const out: XY = [cw.v[0] + (cw.v[0] - cen[0]) * 0.18 * tear, cw.v[1] + (cw.v[1] - cen[1]) * 0.18 * tear];
        const e = ease.inOutCubic(al), pos: XY = [lerp(out[0], P[0], e), lerp(out[1], P[1], e)], d = lerp(cw.d, cw.d + (n360(targ[i] - cw.d + 180) - 180), e);
        ctx.save(); ctx.globalAlpha = tA; wedge(ctx, pos, d, cw.s, COLS[i], WR, mo > 0.02 || V("sum.a") > 0.01 ? `${Math.round(cw.s)}°` : undefined); ctx.restore();
      });
      if (al > 0.5) { ctx.save(); ctx.globalAlpha = (al - 0.5) * 2 * tA; ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(P[0] - 260, P[1]); ctx.lineTo(P[0] + 260, P[1]); ctx.stroke(); ctx.restore(); }
    }
    ctx.restore();
    // the running sum lives in screen space (outside the camera), clear of the safe zones
    if (tA > 0.01 && V("sum.a") > 0.01) { const cs = corners(pts), sum = cs.reduce((x, c) => x + c.s, 0); ctx.save(); ctx.globalAlpha = V("sum.a"); pill(api, ctx, `${cs.map((c) => Math.round(c.s)).join("° + ")}° = ${Math.round(sum)}°`, 500, 190, { color: C.mint }); ctx.restore(); }
    if (V("lbl.straight") > 0.01) { ctx.save(); ctx.globalAlpha = V("lbl.straight"); ctx.strokeStyle = C.mint; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(P[0], P[1], WR + 20, Math.PI, 0); ctx.stroke(); api.text(ctx, T.straight, 500, 380, { font: "mono", size: 40, weight: 700, color: C.mint, align: "center" }); ctx.restore(); }
    const ti = V("title.a"); if (ti > 0.01) { ctx.save(); ctx.globalAlpha = ti; api.text(ctx, T.title, 500, 200, { font: "display", size: 96, weight: 800, align: "center", baseline: "middle" }); ctx.restore(); }
    api.fx.drawWorld(ctx);
  }
  function drawInteractive(ctx: Ctx, now: number) {
    const a = spec.task[0], b = spec.task[1], key = 180 - a - b;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(P[0] - 300, P[1]); ctx.lineTo(P[0] + 300, P[1]); ctx.stroke();
    wedge(ctx, P, 0, b, COLS[1], WR + 30, `${b}°`);
    wedge(ctx, P, 180 - a, a, COLS[0], WR + 30, `${a}°`);
    const th = clamp(live.theta, b + 2, 178), cAng = th - b;
    wedge(ctx, P, b, cAng, COLS[2], WR + 30);
    const ex: XY = [P[0] + Math.cos(th * DEG) * 250, P[1] - Math.sin(th * DEG) * 250];
    ctx.strokeStyle = live.answered ? (live.answered.verdict === "right" ? C.mint : C.amber) : C.volt; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(ex[0], ex[1]); ctx.stroke();
    if (!live.answered) { ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = live.dragging ? 1 : 0.6 + 0.4 * Math.sin(now * 4); ctx.beginPath(); ctx.arc(ex[0], ex[1], 30, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    pill(api, ctx, `${b}° + ${Math.round(cAng)}° + ${a}° = ${Math.round(b + cAng + a)}°`, 500, 190, { color: Math.round(b + cAng + a) === 180 ? C.mint : C.ink });
    if (live.answered) {
      const ok = live.answered.verdict === "right", k = clamp(live.t / 0.4, 0, 1);
      ctx.save(); ctx.globalAlpha = k;
      if (!ok) { ctx.strokeStyle = C.mint; ctx.setLineDash([10, 8]); ctx.lineWidth = 4; const tx: XY = [P[0] + Math.cos((180 - a) * DEG) * 250, P[1] - Math.sin((180 - a) * DEG) * 250]; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(tx[0], tx[1]); ctx.stroke(); ctx.setLineDash([]); magnifier(ctx, ex[0] + 40, ex[1] - 30); }
      else tick(ctx, ex[0] + 40, ex[1] - 30);
      pill(api, ctx, `180 − ${a} − ${b} = ${key}°`, 500, 610 - 40, { color: C.mint });
      ctx.restore();
    }
  }
  api.onPointer({
    down(p) {
      if (sh.tapToPlay()) return;
      if (!sh.interactive || live.answered) return;
      live.dragging = true; live.theta = clamp(ang(P, [p.x, p.y]), spec.task[1] + 2, 178);
    },
    move(p) { if (live.dragging) live.theta = clamp(ang(P, [p.x, Math.min(p.y, P[1] - 1)]), spec.task[1] + 2, 178); },
    up() {
      if (!live.dragging) return; live.dragging = false;
      const c = live.theta - spec.task[1], key = 180 - spec.task[0] - spec.task[1];
      const g = api.answer("third_angle", { angle: +c.toFixed(1) }, Math.abs(c - key) <= 4 ? "right" : Math.abs(c - key) <= 10 ? "partial" : "wrong");
      live.answered = { angle: c, verdict: g.verdict }; live.t = 0; live.done = true;
      if (g.verdict === "right") sfx.blip({ f: 660, f2: 990, dur: 0.18, type: "triangle", gain: 0.12 }); else sfx.blip({ f: 260, f2: 160, dur: 0.2, gain: 0.12 });
      sh.say("T08", g.verdict === "right" ? `Closed. ${Math.round(c)} degrees, and the three make a straight line.` : `The gap was ${key} degrees: 180 take away the other two.`);
      api.done({ angle: +c.toFixed(1), truth: key, verdict: g.verdict });
      api.facts({ task: "third_angle", angle: +c.toFixed(1), truth: key, verdict: g.verdict });
    },
  });
  api.onKey((k, d) => { if (d) sh.key(k); });
  return {
    update(dt) { if (sh.step(dt)) { api.task("", T.task); api.event("interactive", { task: "third_angle" }); } live.t += dt; api.facts({ t: +sh.head.t.toFixed(1), mode: sh.head.mode }); },
    render,
    seam: () => ({ state: live.done ? "final" : sh.head.mode, t: +sh.head.t.toFixed(2), total: +sh.tl.interactiveAt.toFixed(2), theta: +live.theta.toFixed(1) }),
    bot() {
      if (!sh.interactive) return sh.skim();
      if (live.answered) return { type: "wait", ms: 500 };
      const th = live.theta, target = 180 - spec.task[0] + 1.5, pts: XY[] = [];
      for (let i = 0; i <= 10; i++) { const t = lerp(th, target, i / 10) * DEG; pts.push([P[0] + Math.cos(t) * 250, P[1] - Math.sin(t) * 250]); }
      return { type: "path", points: pts, ms: 900, after: 900 };
    },
    knob: (k) => sh.knob(k, () => { live.answered = null; live.done = false; live.theta = spec.task[1] + 20; }),
    board: () => ({ title: "Angles in a triangle: 180°", lines: ["Tear off the three corners: they make a straight line.", "Big or small, the sum is always 180°."], figure: { kind: "angle", deg: 180 }, accent: C.sun }),
    dispose: () => sh.dispose(),
  };
}
export const anglesum: EngineDef<AngleSumSpec> = { archetype: "angle-sum@1", label: "Animation · Triangles", accent: C.ion, create };
