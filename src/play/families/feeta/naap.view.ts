// Feeta · naap, the 2D view (round 7, science measuring, class 6). Nothing here runs on a clock: points are pressed, things
// are slid, dipped and put on shelves by the child's touch, and a column that rises or falls is shown settling (a beat
// inside busy(), never a race); the run only shows what the law has already answered.
//   thread/curve · map   the paper (or the map) with the curve and its points; the tool laid on the points pressed (it runs
//              straight across a point it skips; a ruler is one straight bar); straightened, it lies on the scale from 0
//              (the band shrunk back); the counter takes the reading (cm, or the road's km beside the map's scale)
//   thermo/jobs   job lanes; two benches, the clinical and the lab thermometer; the run draws each job's thermometer with
//              its column: on the scale it shows the job, off the scale it stops at the end and a magnifier looks there
//   thermo/read   a lab thermometer (a window of its scale numbered every 10, 1 °C a small division) over a beaker of warm
//              water: dip it and the column rises and settles; take it out and it moves away; the counter takes the reading
//   thermo/fever  children's clinical thermometers (36-39 °C, 0.1 °C a small division); benches "normal" and "fever"; the run
//              shades the healthy children's band (about 37 °C) on every thermometer
//   scale/ruler   a ruler (a blank edge before its 0, or broken) with an eraser that stands up off it: drag it (or ◀ ▶) to a
//              start; three eye spots over its far end, each with its sightline down to the scale; the counter takes the
//              length
//   scale/foot    a cloth of whole or half metres, a 30 cm foot-ruler; the counter takes how many; the run lays them
//   touch/feel    things in lanes, each with a hand that can feel it (it says what it feels); a shelf of steps, colder to
//              warmer; the run puts a thermometer on each (columns by the law's order, no number claimed)
// After a missed run only magnifiers mark what is not as it should be; never the key.
import type { FeetaAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  binsOf, CLINICAL, counterMax, CURVE_MAX, edgeOf, FOOT, isFever, ITEMS, JOBS, LAB, laidLen, OFF, outOf, piecePts, rightPlace, RULER_TOP, shownMm, sightShift,
  type CurveParams, type FeelParams, type FeverParams, type FootParams, type JobsParams, type NaapParams, type NaapState, type ReadParams, type RulerParams,
} from "./naap.logic.ts";

const SWEEP = 1.6;   // s a run takes on screen (cosmetic: the law has already answered)
const CHIP = 136;     // px the map-scale chip takes ("1 cm = 10 km" at 16 px)
const LEGEND = 36;    // px above the map for its scale
const SETTLE = 1.2;  // s a thermometer's column takes to settle after a dip (shown, never raced)

export const makeNaapView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<NaapParams, NaapState, FeetaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const thread = p.goal === "curve" || p.goal === "map";
  const lanes = p.goal === "jobs" || p.goal === "fever" || p.goal === "feel";
  const top = counterMax(p), digits = top ? String(top).length : 0;
  let w = 360, h = 400;
  // the counter
  let wheelY = 300, wheelW = 50, wheelH = 90, cx0 = 0;
  // thread: mm → px, the paper's origin, the scale strip
  let k = 1.4, ox = 20, oy = 8, scaleY = 160;
  // lanes and bins
  let laneY = 8, laneH = 56, binY = 300, binH = 64, binW = 160;
  // read: the thermometer
  let thX = 90, thTop = 16, thBot = 300, beakerY = 320;
  // ruler: cm size, origin, the ruler's top
  let pc = 19, rx0 = 20, rTop = 190;
  // ruler: the eye spots' height and the eraser's (it stands up off the marks): a sightline from a side spot through its top
  // corner meets the scale exactly one mark away, and the spots stay ≥ 48 px apart
  let eyeY = 40, HB = 44;
  // foot: cm size
  let fc = 2, fx0 = 20, clothY = 120;
  let drag: null | { kind: "lane"; lane: number; x: number; y: number; moved: boolean } | { kind: "slide"; at: number } = null;
  let sel = -1;           // the lane picked up by a tap
  let runAt = -1;         // api.t when the last run started on screen
  let colAt = -1, colFrom = 0;   // read: when the column started to move, and from where
  let felt = -1;          // feel: the lane whose hand last felt
  let announced = -1;

  // ── layout ──
  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (top) { wheelH = 90; wheelW = 50; wheelY = h - wheelH - 8; }
    if (thread) {
      const legend = p.goal === "map" ? LEGEND : 0;   // the map's scale sits above the map, as a legend
      const room = wheelY - 8 - 8 - 58 - legend;   // the paper above the scale strip
      k = Math.min((w - 40) / (CURVE_MAX * 10 + 10), room / 92);
      ox = (w - k * CURVE_MAX * 10) / 2; oy = 8 + legend + Math.max(0, (room - 92 * k) / 2);
      scaleY = oy + 92 * k + 22;
    } else if (lanes) {
      const n = p.goal === "jobs" ? p.jobs.length : p.goal === "fever" ? p.temps.length : p.items.length;
      binH = clamp(h * 0.17, 56, 76); binY = h - binH - 8;
      laneH = clamp((binY - 30 - 8) / n, 48, 72); laneY = Math.max(6, (binY - 26 - laneH * n) / 2);
      const nb = binsOf(p);
      binW = Math.min(p.goal === "feel" ? 110 : 220, (w - 16 - 8 * (nb - 1)) / nb);
    } else if (p.goal === "read") {
      thX = Math.min(w * 0.3, 150); thTop = 14; beakerY = h - 70; thBot = beakerY - 46;
    } else if (p.goal === "ruler") {
      // room on both sides for the side eye spots (about max(50, 2.4 cm) beyond the far end, which may sit anywhere from 2 to
      // 15 cm); rx0 = x of the mark 0
      pc = Math.min((w - 120) / 15.5, 46);
      const side = Math.max(50, 2.42 * pc) + 24, lo = side - 2 * pc, hi = w - 15 * pc - side;
      rx0 = lo > hi ? lo : (lo + hi) / 2;
      rTop = Math.min(wheelY - 34 - 52, 44 + 150 + 22);
      eyeY = Math.max(26, rTop - 150);
      HB = clamp(Math.floor((pc * (rTop - eyeY)) / (pc + 48)), 26, 44);
    } else if (p.goal === "foot") {
      const fp = p as FootParams;
      fc = Math.min((w - 48) / (fp.L + 40), 3.2); fx0 = 24;
      clothY = Math.max(70, (wheelY - 40) * 0.55);
    }
    if (top) {
      const gap = 6, total = digits * wheelW + (digits - 1) * gap;
      // read: right of the thermometer; else centred under the scene
      cx0 = p.goal === "read" ? Math.max(thX + 60, (w + thX + 40 - total - 50) / 2) : (w - total - 56) / 2;
    }
  }
  const act = (a: FeetaAct) => { ctl.dispatch(a); deps.changed(); };
  const mark = (v: number) => { const at = clamp(Math.round(v), 1, top); if (at !== st().at) act({ kind: "mark", at }); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as FeetaAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "dip") { colFrom = colShown(); colAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "mark") api.sfx("tick");
    else if (last.kind === "put" || last.kind === "slide") api.sfx("land");
    else api.sfx("tap");
    if (last.kind === "undo") colAt = -1;
    if (!st().ended) runAt = -1;
    void ms;
    api.invalidate(); deps.changed();
  }
  /** 0..1 of the run on screen; 1 once it has played (the law answered when the act landed) */
  const runK = () => (runAt < 0 ? 0 : clamp((api.t - runAt) / SWEEP, 0, 1));
  const shownEnd = () => st().ended && runK() >= 1;
  function update(): void {
    if ((runAt >= 0 && runK() < 1) || (colAt >= 0 && api.t - colAt < SETTLE)) api.invalidate();
    if (runAt >= 0 && runK() >= 1 && announced !== runAt) {
      announced = runAt;
      if (st().done) { api.sfx("good"); api.fx.burst(w / 2, h / 2, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed();
    }
  }
  const busy = () => !!drag || (runAt >= 0 && runK() < 1) || (colAt >= 0 && api.t - colAt < SETTLE);

  // ── read: where the column stands (°C); below the window (unreadable) before the first dip ──
  function colTarget(): number { const s = st(), rp = p as ReadParams; return !s.ever ? rp.lo - 4 : s.dipped ? rp.T : outOf(rp); }
  function colShown(): number {
    if (colAt < 0) return colTarget();
    const t = clamp((api.t - colAt) / SETTLE, 0, 1), e = 1 - (1 - t) * (1 - t);
    return colFrom + (colTarget() - colFrom) * e;
  }

  // ── pointer ──
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done) return;
    const id = kind === "move" ? null : api.hit(x, y);
    if (kind === "down" && id?.startsWith("wheel-")) {
      const [kk, dir] = id.slice(6).split(":"), step = 10 ** Number(kk), v = s.at + (dir === "up" ? step : -step);
      if (v >= 1 && v <= top) mark(v); else api.sfx("refuse");
      return;
    }
    if (thread) {
      if (kind === "down" && id?.startsWith("pin-")) act({ kind: "pin", i: Number(id.slice(4)) });
      return;
    }
    if (p.goal === "ruler") {
      const rp = p as RulerParams;
      if (kind === "down" && id?.startsWith("eye")) { const e = Number(id.slice(4)); if (e !== s.eye) act({ kind: "eye", at: e }); return; }
      const posAt = (xx: number) => clamp(Math.round((xx - rx0) / pc - rp.len / 2), edgeOf(rp), RULER_TOP - rp.len);
      if (kind === "down" && id === "eraser") { drag = { kind: "slide", at: posAt(x) }; ctl.finger(true); api.sfx("select"); }
      else if (kind === "move" && drag?.kind === "slide") drag.at = posAt(x);
      else if ((kind === "up" || kind === "cancel") && drag?.kind === "slide") {
        const d0 = drag; drag = null; ctl.finger(false);
        if (kind === "up" && d0.at !== s.start) act({ kind: "slide", at: d0.at });
      }
      api.invalidate(); if (kind !== "move") deps.changed();
      return;
    }
    if (!lanes) return;
    // a hand feels first (feel): it says what it feels, the shelf is not touched
    if (kind === "down" && id?.startsWith("feel-")) { felt = Number(id.slice(5)); api.sfx("tap"); api.invalidate(); deps.changed(); return; }
    if (kind === "down") {
      if (id?.startsWith("lane-")) { drag = { kind: "lane", lane: Number(id.slice(5)), x, y, moved: false }; ctl.finger(true); api.sfx("select"); }
      else if (id?.startsWith("bin-") && sel >= 0) { const at = Number(id.slice(4)), lane = sel; sel = -1; if (s.place[lane] !== at) act({ kind: "put", lane, at }); }
    } else if (kind === "move" && drag?.kind === "lane") { if (Math.hypot(x - drag.x, y - drag.y) > 8) drag.moved = true; drag.x = x; drag.y = y; }
    else if ((kind === "up" || kind === "cancel") && drag?.kind === "lane") {
      const d0 = drag; drag = null; ctl.finger(false);
      if (kind === "up" && id?.startsWith("bin-")) { const at = Number(id.slice(4)); if (s.place[d0.lane] !== at) act({ kind: "put", lane: d0.lane, at }); sel = -1; }
      else if (kind === "up" && !d0.moved) sel = sel === d0.lane ? -1 : d0.lane;
    }
    api.invalidate(); deps.changed();
  }

  // ── the counter: one wheel per digit; a wheel's top half adds one of its place, the bottom half takes one away ──
  function counter(c: CanvasRenderingContext2D, unit: string, live: boolean): void {
    const P = api.P, s = st(), gap = 6, total = digits * wheelW + (digits - 1) * gap;
    for (let i = 0; i < digits; i++) {
      const place = digits - 1 - i, x = cx0 + i * (wheelW + gap), d = Math.floor(s.at / 10 ** place) % 10;
      P.body(c, x, wheelY, wheelW, wheelH, { role: "panel", r: 8, seed: i, state: live ? "idle" : "dim" });
      if (!s.done && live) { api.target(`wheel-${place}:up`, x, wheelY, wheelW, wheelH / 2); api.target(`wheel-${place}:down`, x, wheelY + wheelH / 2, wheelW, wheelH / 2); }
      P.text(c, String(d), x + wheelW / 2, wheelY + wheelH / 2, { size: 30, role: live ? "ink" : "ink3", weight: 800, font: "mono" });
      P.stroke(c, [[x + wheelW / 2 - 6, wheelY + 9], [x + wheelW / 2, wheelY + 4], [x + wheelW / 2 + 6, wheelY + 9]], { role: "ink3", width: 2 });
      P.stroke(c, [[x + wheelW / 2 - 6, wheelY + wheelH - 9], [x + wheelW / 2, wheelY + wheelH - 4], [x + wheelW / 2 + 6, wheelY + wheelH - 9]], { role: "ink3", width: 2 });
    }
    P.text(c, unit, cx0 + total + 8, wheelY + wheelH / 2, { size: 20, role: "ink2", weight: 700, font: "mono", align: "left" });
    if (shownEnd() && !s.done && cx0 >= 30) P.magnifier(c, cx0 - 18, wheelY + wheelH / 2, 18);
  }

  // ───────────────────────────── thread ─────────────────────────────
  function drawThread(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), cp = p as CurveParams, n = cp.pts.length - 1;
    const X = (mm: number) => ox + mm * k, Y = (mm: number) => oy + mm * k;
    const S = (q: [number, number]): [number, number] => [X(q[0]), Y(q[1])];
    // the paper (or the map)
    P.body(c, ox - 6, oy - 4, CURVE_MAX * 10 * k + 12, 92 * k + 8, { role: "panel", r: 6, seed: 3 });
    for (let i = 0; i < n; i++) P.stroke(c, piecePts(cp, i, 20).map(S), { role: cp.goal === "map" ? "q3" : "ink", width: cp.goal === "map" ? 6 : 2.5 });
    // the tool laid on the points pressed (before it is straightened)
    if (s.tool >= 0 && s.pins.length >= 2 && !s.lifted) {
      const path: [number, number][] = [];
      if (s.tool === 2) path.push(S(cp.pts[s.pins[0]]), S(cp.pts[s.pins[s.pins.length - 1]]));
      else for (let j = 1; j < s.pins.length; j++) { const a = s.pins[j - 1], b = s.pins[j]; const seg = b === a + 1 ? piecePts(cp, a, 20).map(S) : [S(cp.pts[a]), S(cp.pts[b])]; path.push(...(j > 1 ? seg.slice(1) : seg)); }
      P.stroke(c, path, { role: s.tool === 1 ? "q2" : s.tool === 2 ? "ink2" : "q1", width: s.tool === 2 ? 7 : 3.5 });
    }
    // the points: start and end dots, the bends; pressed ones are knotted
    cp.pts.forEach((q, i) => {
      const [x, y] = S(q), on = s.pins.includes(i), endDot = i === 0 || i === n;
      if (!s.done && !s.lifted && s.tool >= 0) api.target(`pin-${i}`, x - 22, y - 22, 44, 44);
      P.circle(c, x, y, endDot ? 9 : 7, { role: on ? "you" : endDot ? "ink" : "ink3", fill: on || endDot, width: 2 });
      if (on) P.circle(c, x, y, 13, { role: "you", width: 2 });
    });
    // an end's label sits on the side the curve does not leave it by (above when the curve heads down from it, else below;
    // the ends are generated in the paper's middle band, so either side has room)
    const lab = (i: number, key: string) => {
      const pp = piecePts(cp, i ? n - 1 : 0, 20), near = i ? pp[Math.max(0, pp.length - 3)] : pp[Math.min(2, pp.length - 1)];
      const [x, y] = S(cp.pts[i]), down = Y(near[1]) > y;
      P.text(c, cp.goal === "map" ? (i ? "B" : "A") : W(key), x, y + (down ? -22 : 22), { size: 16, role: "ink2", weight: 700 });
    };
    lab(0, "feeta.start"); lab(n, "feeta.end");
    // the scale from 0, marked every cm; numbers as the look allows
    const sx = (cm: number) => ox + cm * 10 * k, every = cp.look === 1 ? 2 : cp.look === 2 ? 5 : 10;
    P.body(c, ox - 8, scaleY, CURVE_MAX * 10 * k + 16, 38, { role: "panel", r: 4 });
    for (let cm = 0; cm <= CURVE_MAX; cm++) {
      P.stroke(c, [[sx(cm), scaleY], [sx(cm), scaleY + (cm % 5 === 0 ? 12 : 8)]], { role: "ink", width: cm % 5 === 0 ? 1.6 : 1 });
      if (cm < CURVE_MAX) P.stroke(c, [[sx(cm + 0.5), scaleY], [sx(cm + 0.5), scaleY + 5]], { role: "ink3", width: 1 });
      if (cm % every === 0) P.text(c, String(cm), sx(cm), scaleY + 26, { size: 16, role: "ink", weight: 700, font: "mono" });
    }
    P.text(c, "cm", ox + CURVE_MAX * 10 * k + 4, scaleY - 10, { size: 16, role: "ink2", weight: 700, font: "mono", align: "right" });
    // straightened: the tool on the scale from 0 (the band shrunk back), its end mark
    if (s.lifted) {
      const len = shownMm(cp, s), y = scaleY - 7, xe = X(len);
      P.stroke(c, [[X(0), y], [xe, y]], { role: s.tool === 1 ? "q2" : s.tool === 2 ? "ink2" : "q1", width: s.tool === 2 ? 7 : 4 });
      P.circle(c, X(0), y, 5, { role: "you", fill: true }); P.stroke(c, [[xe, y - 9], [xe, y + 7]], { role: "you", width: 3 });
    }
    counter(c, cp.goal === "map" ? "km" : "cm", s.lifted);
    if (cp.goal === "map") P.chip(c, W("feeta.mapscale", { km: cp.perCm }), ox + CURVE_MAX * 10 * k + 6 - CHIP / 2, oy - LEGEND / 2 - 2, { size: 16 });
    if (shownEnd() && !s.done && s.lifted) P.magnifier(c, X(shownMm(cp, s)), scaleY - 26, 18);
    if (shownEnd() && s.done) P.tick(c, X(shownMm(cp, s)) + 14, scaleY - 26, 24, 1);
  }

  // ───────────────────────────── lanes and benches ─────────────────────────────
  function laneBox(c: CanvasRenderingContext2D, i: number): { y: number; mid: number } {
    const P = api.P, s = st(), y = laneY + i * laneH, placed = s.place[i] >= 0;
    if (!s.done) api.target(`lane-${i}`, 8, y + 2, w - 16, laneH - 4);
    P.body(c, 8, y + 2, w - 16, laneH - 4, { role: "panel", r: 8, state: sel === i ? "look" : "idle", seed: i });
    P.circle(c, 28, y + laneH / 2, 14, { role: placed ? "ink3" : "q2", fill: true });
    P.text(c, String(i + 1), 28, y + laneH / 2, { size: 16, weight: 800, on: placed ? "ink3" : "q2" });
    return { y, mid: y + laneH / 2 };
  }
  function bins(c: CanvasRenderingContext2D, names: string[], bad: (j: number) => boolean): void {
    const P = api.P, s = st(), nb = names.length, total = nb * binW + (nb - 1) * 8, bx = (w - total) / 2;
    for (let j = 0; j < nb; j++) {
      const x = bx + j * (binW + 8), here = s.place.map((b, i) => (b === j ? i : -1)).filter((i) => i >= 0);
      const hh = p.goal === "feel" ? Math.max(46, binH * (0.62 + (0.38 * j) / Math.max(1, nb - 1))) : binH, yy = binY + binH - hh;
      if (!s.done) api.target(`bin-${j}`, x, yy, binW, hh);
      P.body(c, x, yy, binW, hh, { role: "q3", r: 8, state: bad(j) ? "look" : "idle", seed: 10 + j, fill: p.goal === "feel" ? 0.3 + (0.5 * (j + 1)) / nb : 0.5 });
      if (names[j]) P.textFit(c, names[j], x + binW / 2, yy + 14, binW - 8, 20, { size: 16, role: "ink", weight: 700 });
      // the lanes on this bench, as numbered tokens
      const r = 13, sp = here.length > 1 ? Math.min(2 * r + 4, (binW - 12 - 2 * r) / (here.length - 1)) : 0;
      here.forEach((lane, q) => {
        const tx = x + 6 + r + q * sp, ty = yy + hh - r - 6;
        P.circle(c, tx, ty, r, { role: "q2", fill: true }); P.text(c, String(lane + 1), tx, ty, { size: 16, weight: 800, on: "q2" });
      });
      if (!here.length && (sel >= 0 || drag?.kind === "lane")) P.circle(c, x + binW / 2, yy + hh / 2 + 6, 15, { role: "you", width: 2 });
      if (bad(j)) P.magnifier(c, x + binW - 14, yy + hh - 14, 16);
    }
    if (drag?.kind === "lane" && drag.moved) { P.circle(c, drag.x, drag.y, 16, { role: "q2", fill: true }); P.text(c, String(drag.lane + 1), drag.x, drag.y, { size: 16, weight: 800, on: "q2" }); }
  }
  /** a bench is looked at after a missed run when a lane on it belongs elsewhere (feel: a step out of the thermometers' order) */
  function badBins(): (j: number) => boolean {
    const s = st();
    if (!shownEnd() || s.done) return () => false;
    const r = rightPlace(p as JobsParams | FeverParams | FeelParams);
    if (p.goal !== "feel") return (j) => s.place.some((b, i) => b === j && r[i] !== j);
    const fp = p as FeelParams;
    const wrong = fp.items.map((_, i) => fp.items.some((__, j) => j !== i && Math.sign(s.place[i] - s.place[j]) !== Math.sign(r[i] - r[j])));
    return (j) => s.place.some((b, i) => b === j && wrong[i]);
  }
  /** a horizontal thermometer from lo to hi °C in [x0, x1] at y, its column to `t` (stopped at the scale's ends) */
  function hThermo(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, lo: number, hi: number, t: number | null, o: { labels: number[]; minor: number; major: number; k: number }): void {
    const P = api.P, X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    P.body(c, x0 - 14, y - 6, x1 - x0 + 22, 12, { role: "panel", r: 6 });
    P.circle(c, x0 - 14, y, 8, { role: "q1", fill: true });
    for (let v = lo, q = 0; v <= hi + 1e-9; v = lo + (++q) * o.minor) {
      const big = Math.abs(v / o.major - Math.round(v / o.major)) < 1e-6;
      P.stroke(c, [[X(v), y - 6], [X(v), y - 6 - (big ? 8 : 4)]], { role: big ? "ink" : "ink3", width: big ? 1.5 : 1 });
    }
    for (const v of o.labels) P.text(c, String(v).replace("-", "−"), X(v), y + 16, { size: 16, role: "ink", weight: 700, font: "mono" });
    if (t !== null) {
      const tt = clamp(t, lo, hi), xe = x0 + (X(tt) - x0) * o.k;
      P.stroke(c, [[x0 - 14, y], [xe, y]], { role: "q1", width: 5 });
    }
  }

  function drawJobs(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), jp = p as JobsParams, k2 = runK(), end = shownEnd();
    jp.jobs.forEach((j, i) => {
      const { y, mid } = laneBox(c, i), nameW = Math.min(150, w * 0.42);
      jobIcon(c, j, 58, mid);
      const name = W(`feeta.job.${j}`);
      if (jp.look === 1) { P.textFit(c, name, 80 + nameW / 2, mid - 9, nameW, 18, { size: 16, role: "ink", weight: 700, align: "center" }); P.textFit(c, W("feeta.about", { t: JOBS[j] }), 80 + nameW / 2, mid + 11, nameW, 18, { size: 16, role: "ink2", weight: 600 }); }
      else P.textFit(c, name, 80 + nameW / 2, mid, nameW, laneH - 8, { size: 16, role: "ink", weight: 700 });
      // after the run: this job's thermometer, dipped
      const b = s.place[i];
      if (b >= 0 && runAt >= 0 && s.ended) {
        const x0 = 80 + nameW + 26, x1 = w - 30, R = b === 0 ? CLINICAL : LAB;
        hThermo(c, x0, x1, mid - 4, R.lo, R.hi, JOBS[j], { labels: [R.lo, R.hi], minor: b === 0 ? 1 : 10, major: b === 0 ? 1 : 50, k: k2 });
        const off = JOBS[j] < R.lo || JOBS[j] > R.hi;
        if (end && (off || (j === "body") !== (b === 0)) && !s.done) P.magnifier(c, JOBS[j] > R.hi ? x1 + 6 : x0 - 4, y + 12, 16);
      } else if (b >= 0) P.text(c, b === 0 ? W("feeta.clinical") : W("feeta.lab"), w - 20, mid, { size: 16, role: "ink2", weight: 700, align: "right" });
    });
    bins(c, [`${W("feeta.clinical")} ${CLINICAL.lo}–${CLINICAL.hi} °C`, `${W("feeta.lab")} ${String(LAB.lo).replace("-", "−")}–${LAB.hi} °C`], badBins());
    if (end && s.done) P.tick(c, w - 26, binY - 14, 22, 1);
  }
  function jobIcon(c: CanvasRenderingContext2D, j: string, x: number, y: number): void {
    const P = api.P;
    if (j === "body") { P.circle(c, x, y - 4, 9, { role: "q2", fill: true }); P.body(c, x - 9, y + 6, 18, 9, { role: "q2", r: 4 }); return; }
    if (j === "chai") { P.fillPath(c, (g) => { g.beginPath(); g.moveTo(x - 9, y - 6); g.lineTo(x + 9, y - 6); g.lineTo(x + 6, y + 10); g.lineTo(x - 6, y + 10); g.closePath(); }, "clay", { outline: "ink2", width: 1.2 }); }
    else P.fillPath(c, (g) => { g.beginPath(); g.moveTo(x - 9, y - 4); g.lineTo(x + 9, y - 4); g.lineTo(x + 8, y + 11); g.lineTo(x - 8, y + 11); g.closePath(); }, j === "fridge" ? "ice" : "water", { outline: "ink2", width: 1.2 });
    if (j === "boil" || j === "chai") for (const dx of [-4, 3]) P.stroke(c, [[x + dx, y - 9], [x + dx + 2, y - 13], [x + dx, y - 17]], { role: "ink3", width: 1.5 });
  }

  function drawFever(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), fp = p as FeverParams, end = shownEnd();
    fp.temps.forEach((t, i) => {
      const { mid } = laneBox(c, i), x0 = 66, x1 = w - 26;
      const X = (v: number) => x0 + ((v - 36) / 3) * (x1 - x0);
      // after the run: the healthy children's band (the kit's 36.8 to 37.2, about 37 °C) on every thermometer
      if (runAt >= 0 && s.ended) P.body(c, X(36.8), mid - 22, X(37.2) - X(36.8), 18, { role: "q2", r: 3, fill: 0.35 * runK() });   // round 8 law 1: a reference band, never the "right" green
      hThermo(c, x0, x1, mid - 4, 36, 39, t / 10, { labels: fp.look === 1 ? [36, 37, 38, 39] : [36, 38], minor: 0.1, major: fp.look === 1 ? 0.5 : 1, k: 1 });
      const b = s.place[i];
      if (end && !s.done && b >= 0 && b !== (isFever(t) ? 1 : 0)) P.magnifier(c, X(t / 10), mid - 26, 16);
    });
    bins(c, [W("feeta.normal"), W("feeta.fever")], badBins());
    if (end && s.done) P.tick(c, w - 26, binY - 14, 22, 1);
  }

  function drawFeel(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), fp = p as FeelParams, end = shownEnd(), ranks = rightPlace(fp), maxR = Math.max(1, ...ranks);
    fp.items.forEach((it, i) => {
      const { y, mid } = laneBox(c, i);
      itemIcon(c, it, 58, mid);
      const showFeel = felt === i;
      P.textFit(c, W(`feeta.item.${it}`), 80 + (w - 80 - 130) / 2, mid - (showFeel ? 9 : 0), w - 80 - 130, showFeel ? 20 : laneH - 8, { size: 16, role: "ink", weight: 700 });
      if (showFeel) P.textFit(c, feeling(it), 80 + (w - 80 - 130) / 2, mid + 11, w - 80 - 130, 20, { size: 16, role: "q4", weight: 700 });
      // the hand that feels it (registered after the lane, so a tap on the hand is the hand's)
      const hx = w - 112, hy = y + 4;
      if (!s.done) api.target(`feel-${i}`, hx, hy, 46, laneH - 8);
      P.body(c, hx, hy, 46, laneH - 8, { role: "panel", r: 10, state: showFeel ? "selected" : "idle" });
      hand(c, hx + 23, hy + (laneH - 8) / 2);
      // after the run: a thermometer on it, its column by the law's order (no number claimed)
      if (runAt >= 0 && s.ended) {
        const tx = w - 36, tb = y + laneH - 10, tt = y + 8, f = (0.25 + (0.6 * ranks[i]) / maxR) * runK();
        P.body(c, tx - 5, tt, 10, tb - tt, { role: "panel", r: 5 });
        P.stroke(c, [[tx, tb - 2], [tx, tb - 2 - (tb - tt - 4) * f]], { role: "q1", width: 5 });
        P.circle(c, tx, tb, 6, { role: "q1", fill: true });
        if (fp.kind === "chai" && it === "bucket") P.body(c, 80, y + laneH - 12, (w - 230) * runK(), 6, { role: "q2", r: 3 });
        if (fp.kind === "chai" && it === "chai") P.body(c, 80, y + laneH - 12, (w - 230) * 0.15 * runK(), 6, { role: "q2", r: 3 });
      }
    });
    if (fp.kind === "chai" && runAt >= 0 && s.ended && runK() >= 1) P.text(c, W("feeta.heat"), 80, laneY + fp.items.length * laneH + 10, { size: 16, role: "ink2", weight: 600, align: "left" });
    P.text(c, `${W("feeta.colder")}  →  ${W("feeta.warmer")}`, w / 2, binY - 14, { size: 16, role: "ink2", weight: 700 });
    bins(c, fp.items.map(() => ""), badBins());
    if (end && s.done) P.tick(c, w - 26, binY - 14, 22, 1);
  }
  function feeling(it: string): string {
    switch (it) {
      case "steelSpoon": case "handle": case "cold": return W("feeta.feels.cold");
      case "woodSpoon": case "door": return W("feeta.feels.lesscold");
      case "chai": return W("feeta.feels.hot");
      case "bucket": case "warm": return W("feeta.feels.warm");
      default: return W("feeta.feels.both");
    }
  }
  function hand(c: CanvasRenderingContext2D, x: number, y: number): void {
    const P = api.P;
    P.body(c, x - 8, y - 3, 16, 14, { role: "q2", r: 5 });
    for (let f = 0; f < 4; f++) P.body(c, x - 8 + f * 4.2, y - 12, 3.4, 10, { role: "q2", r: 2 });
    P.body(c, x + 7, y - 2, 6, 3.4, { role: "q2", r: 2 });
  }
  function itemIcon(c: CanvasRenderingContext2D, it: string, x: number, y: number): void {
    const P = api.P;
    if (it === "steelSpoon" || it === "woodSpoon") {
      const m = it === "steelSpoon" ? "steel" : "wood";
      P.fillPath(c, (g) => { g.beginPath(); g.ellipse(x - 8, y, 7, 5, 0, 0, Math.PI * 2); g.rect(x - 2, y - 1.5, 16, 3); }, m, { outline: "ink2", width: 1 });
    } else if (it === "handle") P.fillPath(c, (g) => { g.beginPath(); g.rect(x - 11, y - 3, 22, 6); g.rect(x - 11, y - 3, 4, 12); g.rect(x + 7, y - 3, 4, 12); }, "steel", { outline: "ink2", width: 1 });
    else if (it === "door") P.fillPath(c, (g) => { g.beginPath(); g.rect(x - 9, y - 14, 18, 28); }, "wood", { outline: "ink2", width: 1 });
    else if (it === "chai") P.fillPath(c, (g) => { g.beginPath(); g.moveTo(x - 8, y - 6); g.lineTo(x + 8, y - 6); g.lineTo(x + 6, y + 9); g.lineTo(x - 6, y + 9); g.closePath(); }, "clay", { outline: "ink2", width: 1 });
    else if (it === "bucket") P.fillPath(c, (g) => { g.beginPath(); g.moveTo(x - 13, y - 10); g.lineTo(x + 13, y - 10); g.lineTo(x + 10, y + 12); g.lineTo(x - 10, y + 12); g.closePath(); }, "water", { outline: "ink2", width: 1.2 });
    else P.fillPath(c, (g) => { g.beginPath(); g.ellipse(x, y + 2, 13, 8, 0, 0, Math.PI * 2); }, it === "cold" ? "ice" : "water", { outline: "ink2", width: 1.2 });
  }

  // ───────────────────────────── read ─────────────────────────────
  function drawRead(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), rp = p as ReadParams;
    const lo = rp.lo - 2, hi = rp.lo + 22, dipDy = 30;
    const dy = s.dipped ? dipDy : 0;
    const winTop = thTop + 6 + dy, winBot = thBot - 40 + dy;
    const Yv = (v: number) => winBot - ((v - lo) / (hi - lo)) * (winBot - winTop);
    // the beaker of warm water
    const bx = thX - 46, bw2 = 92;
    P.fillPath(c, (g) => { g.beginPath(); g.rect(bx, beakerY - 30, bw2, 58); }, "water", { alpha: 0.55, outline: null });
    P.stroke(c, [[bx, beakerY - 52], [bx, beakerY + 28], [bx + bw2, beakerY + 28], [bx + bw2, beakerY - 52]], { role: "ink2", width: 2.5 });
    P.text(c, W("feeta.water"), bx + bw2 / 2, beakerY + 46 > h - 10 ? beakerY + 16 : beakerY + 46, { size: 16, role: "ink2", weight: 600 });
    // the thermometer: its tube, a break below the window (the part of the scale not shown), the bulb
    const bulbY = thBot + dy;
    P.body(c, thX - 9, winTop - 8, 18, bulbY - winTop + 4, { role: "panel", r: 9 });
    P.stroke(c, [[thX - 12, winBot + 12], [thX + 12, winBot + 6]], { role: "ink3", width: 2 });
    P.stroke(c, [[thX - 12, winBot + 18], [thX + 12, winBot + 12]], { role: "ink3", width: 2 });
    for (let v = Math.ceil(lo); v <= hi; v++) {
      const big = v % 10 === 0, half = v % 5 === 0;
      P.stroke(c, [[thX + 9, Yv(v)], [thX + 9 + (big ? 16 : half && rp.look === 1 ? 11 : 7), Yv(v)]], { role: big ? "ink" : "ink2", width: big ? 1.8 : 1 });
      if (big) P.text(c, String(v), thX + 30, Yv(v), { size: 16, role: "ink", weight: 700, font: "mono", align: "left" });
    }
    P.text(c, "°C", thX + 30, winTop - 4, { size: 16, role: "ink2", weight: 700, font: "mono", align: "left" });
    const col = colShown(), ycol = col < lo ? winBot + 30 : Yv(col);
    P.stroke(c, [[thX, bulbY], [thX, ycol]], { role: "q1", width: 5 });
    P.circle(c, thX, bulbY, 11, { role: "q1", fill: true });
    counter(c, "°C", true);
    const end = shownEnd();
    if (end && !s.done) P.magnifier(c, thX - 26, s.dipped ? Yv(col) : bulbY, 18);
    if (end && s.done) P.tick(c, thX - 30, Yv(rp.T), 24, 1);
  }

  // ───────────────────────────── ruler ─────────────────────────────
  function drawRuler(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), rp = p as RulerParams, rh = 44, edge = edgeOf(rp);
    const X = (cm: number) => rx0 + cm * pc;
    // the ruler: a blank edge before its 0, or a broken, worn start
    P.body(c, X(edge), rTop, X(RULER_TOP + 0.5) - X(edge), rh, { role: "panel", r: rp.first ? 0 : 4 });
    if (rp.first) P.stroke(c, [0, 1, 2, 3, 4, 5, 6].map((q) => [X(edge) + (q % 2 ? 6 : 0), rTop + (rh * q) / 6] as [number, number]), { role: "ink", width: 2.5 });
    const every = pc >= 34 ? 1 : 2;
    for (let cm = Math.max(0, edge); cm <= RULER_TOP; cm++) {
      const worn = cm < rp.first;
      P.stroke(c, [[X(cm), rTop], [X(cm), rTop + rh * 0.36]], { role: worn ? "ink3" : "ink", width: worn ? 1 : 1.6 });
      if (cm < RULER_TOP) P.stroke(c, [[X(cm + 0.5), rTop], [X(cm + 0.5), rTop + rh * 0.2]], { role: "ink3", width: 1 });
      if (!worn && (cm - rp.first) % every === 0) P.text(c, String(cm), X(cm), rTop + rh * 0.68, { size: 16, role: "ink", weight: 700, font: "mono" });
    }
    // the eraser: on the ruler at its start (or floating above it until it is placed)
    const at = drag?.kind === "slide" ? drag.at : s.start, placed = at !== OFF;
    const ex0 = placed ? X(at) : X(Math.max(edge, 1)) + pc * 0.4, ey = placed ? rTop - HB : rTop - HB - 26;
    P.body(c, ex0, ey, rp.len * pc, HB, { role: "q2", r: 5, lift: placed ? 0 : 3 });
    P.body(c, ex0 + 4, ey + 6, rp.len * pc * 0.35, HB - 12, { role: "panel", r: 3, fill: 0.5 });
    if (!s.done) { const th = Math.max(44, HB + 4); api.target("eraser", ex0, ey + HB / 2 - th / 2, Math.max(44, rp.len * pc), th); }
    // the eye spots over the far end, each with its sightline through the eraser's top corner down to the scale
    if (placed) {
      const endX = ex0 + rp.len * pc, cy = rTop - HB, dx = (pc * (rTop - eyeY - HB)) / HB;
      for (const e of [-1, 0, 1]) {
        const exX = endX + e * dx, on = s.eye === e;
        if (!s.done) api.target(`eye:${e}`, exX - 22, eyeY - 22, 44, 44);
        P.body(c, exX - 16, eyeY - 10, 32, 20, { role: "panel", r: 10, state: on ? "selected" : "dim" });
        P.circle(c, exX, eyeY, 6, { role: on ? "ink" : "ink3", fill: true });
        if (on) {
          const hitX = endX + sightShift(e) * pc;
          P.stroke(c, [[exX, eyeY], [endX, cy], [hitX, rTop]], { role: "you", width: 2, dash: [5, 4] });
        }
      }
    }
    counter(c, "cm", true);
    const end = shownEnd();
    if (end && !s.done) P.magnifier(c, placed ? ex0 - 10 : 30, rTop - HB - 10, 18);
    if (end && s.done) P.tick(c, ex0 + rp.len * pc + 18, rTop - HB - 12, 24, 1);
    void sightShift;
  }

  // ───────────────────────────── foot ─────────────────────────────
  function drawFoot(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), fp = p as FootParams, X = (cm: number) => fx0 + cm * fc, ch = 34;
    // the cloth with its length; at look 1 its metres marked
    P.fillPath(c, (g) => { g.beginPath(); g.rect(X(0), clothY, fp.L * fc, ch); }, "cotton", { outline: "ink2", width: 1.5 });
    P.chip(c, `${fp.L / 100} m`, X(fp.L / 2), clothY - 22, { size: 16 });
    if (fp.look === 1) for (let m = 0; m <= fp.L; m += 10) P.stroke(c, [[X(m), clothY + ch], [X(m), clothY + ch - (m % 100 === 0 ? 14 : 6)]], { role: "ink3", width: 1 });
    // a foot-ruler, as it is: 30 cm
    const ry = clothY + ch + 22, rw = FOOT * fc;
    P.body(c, X(0), ry, rw, 26, { role: "q3", r: 3 });
    for (let q = 0; q <= FOOT; q += 5) P.stroke(c, [[X(q), ry], [X(q), ry + (q % 10 ? 5 : 9)]], { role: "ink", width: 1 });
    P.text(c, `= ${FOOT} cm`, X(FOOT) + 8, ry + 13, { size: 16, role: "ink2", weight: 700, font: "mono", align: "left" });
    // the run: the foot-rulers laid end to end along the cloth, one after another
    if (runAt >= 0 && s.ended) {
      const nShown = Math.min(s.at, Math.ceil(runK() * s.at));
      for (let i = 0; i < nShown; i++) P.body(c, X(i * FOOT) + 1, clothY + 5, rw - 2, ch - 10, { role: "q3", r: 3, seed: i });
      if (shownEnd() && !s.done) P.magnifier(c, X(Math.min(s.at * FOOT, fp.L + 10)), clothY - 4, 18);
    }
    counter(c, W("feeta.rulers"), true);
    if (shownEnd() && s.done) P.tick(c, X(fp.L) + 4, clothY - 20, 24, 1);
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (thread) drawThread(c);
    else if (p.goal === "jobs") drawJobs(c);
    else if (p.goal === "fever") drawFever(c);
    else if (p.goal === "feel") drawFeel(c);
    else if (p.goal === "read") drawRead(c);
    else if (p.goal === "ruler") drawRuler(c);
    else drawFoot(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("feeta.again");
    return W(`feeta.goal.${p.goal}`);
  }
  // no readout beyond the instruments: reading them IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (thread) {
      (["thread", "band", "ruler"] as const).forEach((t, i) => out.push({ id: `tool-${t}`, label: W(`feeta.tool.${t}`), kind: "choice", group: "tools", pressed: s.tool === i, disabled: s.lifted, onPress: () => { if (s.tool !== i) act({ kind: "tool", t: i }); } }));
      out.push({ id: "lift", label: s.lifted ? W("feeta.relay") : W("feeta.straighten"), kind: "secondary", group: "go", disabled: !s.lifted && s.pins.length < 2, onPress: () => act({ kind: "lift" }) });
      ready = ready && s.lifted && s.at > 0;
    }
    if (p.goal === "read") { out.push({ id: "dip", label: s.dipped ? W("feeta.liftout") : W("feeta.dip"), kind: "secondary", group: "go", onPress: () => act({ kind: "dip" }) }); ready = ready && s.ever && s.at > 0; }
    if (p.goal === "ruler") {
      const rp = p as RulerParams, mid = Math.floor((edgeOf(rp) + RULER_TOP - rp.len) / 2);
      const slide = (d: number) => { const to = s.start === OFF ? mid : clamp(s.start + d, edgeOf(rp), RULER_TOP - rp.len); if (to !== s.start) act({ kind: "slide", at: to }); };
      out.push({ id: "left", label: "◀", aria: "slide the eraser left", kind: "pad", group: "slide", disabled: s.start !== OFF && s.start <= edgeOf(rp), onPress: () => slide(-1) });
      out.push({ id: "right", label: "▶", aria: "slide the eraser right", kind: "pad", group: "slide", disabled: s.start !== OFF && s.start >= RULER_TOP - rp.len, onPress: () => slide(1) });
      ready = ready && s.start !== OFF && s.at > 0;
    }
    if (p.goal === "foot") ready = ready && s.at > 0;
    if (lanes) ready = ready && s.place.every((x) => x >= 0);
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const runKey = thread ? "feeta.done" : p.goal === "read" ? "feeta.write" : p.goal === "jobs" ? "feeta.dipall" : p.goal === "fever" ? "feeta.check" : p.goal === "foot" ? "feeta.lay" : p.goal === "feel" ? "feeta.thermo" : "feeta.done";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  void laidLen; void ITEMS;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
