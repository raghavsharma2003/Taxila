// Gati · the 2D view (round 7, motion; classes 6 and 7). Nothing here runs on a clock: the scene moves one interval only
// when the child taps the clock, and that move is shown gliding (a beat inside busy(), never a race); the run only shows
// what the law has already answered.
//   drishti/sandarbh  a train past a platform (a bus past a bus stop; two trains, one still): the scene is drawn as seen
//              from the reference being watched from (it stays put on screen, everything else slides); the watched thing
//              leaves a dot at every tick of the clock: one dot (at rest compared with it) or a row (moving). Under it, a
//              card per reference: its eye (watch from it) and "at rest" / "moving"
//   drishti/prakaar   a window per thing; only its light (look 1: the thing too) and the path the light leaves; three bins,
//              linear, circular, oscillatory. The run plays the clock on to the end: a swing's light goes back over its arc,
//              a wheel's goes all the way round; the things are then shown
//   drishti/do-gati   a row per thing: its window (from the ground, or riding along with it) and three type buttons
//   raftaar/aage      two lanes on one marked track; each tick leaves a mark where each mover is; a lane tapped carries the
//              "faster" flag. The run draws the distance each covered in the first interval, side by side
//   raftaar/nikaalo   a lane on a marked track, the trip stepped to its end; the speedometer (a counter); the run drives a
//              ghost at that speed for the same time beside it
//   raftaar/badlo     a speedometer in km/h, a track in metres stepped a second at a time; an m/s counter; the run drives a
//              ghost at that many metres each second
//   nishaan/ek-saa    lanes: each tick drops a chalk mark at each mover (look 1: each interval's distance listed under it);
//              two bins, uniform and non-uniform
// After a missed run only magnifiers mark what is not as it should be; never the key.
import type { GatiAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import type { Role } from "../../core/styles.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  binsOf, bitsOf, counterMax, distOf, dogatiAt, fasterOf, lanesOf, msOf, posOf, prakaarAt, PRAKAAR, PRAKAAR_T, rightPlace, RIDES, speedOfThing, tMaxOf, tNeedOf, totalOf, uniform, UNITS, want,
  type AageParams, type BadloParams, type DoGatiParams, type EkSaaParams, type GatiParams, type GatiState, type NikaaloParams, type PrakaarParams, type SandarbhParams,
} from "./gati.logic.ts";

const SWEEP = 1.6;   // s a run takes on screen (cosmetic: the law has already answered)
const STEP = 0.5;    // s a tick glides on screen (the clock moved when the child tapped)
const HDR = 34;      // px of the header row (the clock)

export const makeGatiView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<GatiParams, GatiState, GatiAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const lanes = lanesOf(p), bins = binsOf(p), top = counterMax(p), digits = top ? String(top).length : 0;
  const binGoal = p.goal === "prakaar" || p.goal === "ek-saa";
  let w = 360, h = 400;
  // the counter
  let wheelY = 300, wheelW = 50, wheelH = 90, cx0 = 0;
  // lanes / windows / bins
  let laneY = HDR, laneH = 60, binY = 300, binH = 64, binW = 110;
  // sandarbh: the scene box
  let sceneH = 170;
  let drag: null | { lane: number; x: number; y: number; moved: boolean } = null;
  let sel = -1;           // the lane picked up by a tap
  let runAt = -1;         // api.t when the last run started on screen
  let tickAt = -1, tFrom = 0, lastT = 0;
  let announced = -1;

  // ── layout ──
  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (top) { wheelH = clamp(h * 0.22, 88, 96); wheelW = 50; wheelY = h - wheelH - 8; }
    switch (p.goal) {
      case "sandarbh": {
        laneH = clamp((h - HDR - 150 - 10) / lanes, 50, 66);
        sceneH = clamp(h - HDR - lanes * laneH - 10, 140, 200);
        laneY = HDR + sceneH + 6;
        break;
      }
      case "prakaar": case "ek-saa": {
        binH = clamp(h * 0.18, 66, 80); binY = h - binH - 8;
        binW = Math.min(150, (w - 16 - 8 * (bins - 1)) / bins);
        laneY = HDR;
        laneH = p.goal === "prakaar" ? (binY - 8 - HDR) / Math.ceil(lanes / 2) : clamp((binY - 30 - HDR) / lanes, 56, 92);
        break;
      }
      case "do-gati": { laneY = HDR + 30; laneH = clamp((h - laneY - 6) / lanes, 76, 130); break; }
      case "aage": { laneY = HDR + 4; laneH = clamp((h - HDR - 12) / 2.6, 80, 120); break; }
      case "badlo": { laneY = HDR + 4; laneH = clamp(wheelY - HDR - 8 - 50 - 64, 76, 104); break; }
      default: { laneY = HDR + 4; laneH = clamp((wheelY - HDR - 16) / 2, 70, 120); break; }
    }
    if (top) {
      const gap = 6, total = digits * wheelW + (digits - 1) * gap;
      cx0 = (w - total - 64) / 2 + (p.goal === "badlo" ? 40 : 30);
    }
  }
  const act = (a: GatiAct) => { ctl.dispatch(a); deps.changed(); };
  const mark = (v: number) => { const at = clamp(Math.round(v), 1, top); if (at !== st().at) act({ kind: "mark", at }); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as GatiAct | undefined;
    if (!last) return;
    const s = st();
    if (s.t !== lastT) { tFrom = shownT(); lastT = s.t; tickAt = api.reduced ? api.t - 10 : api.t; }
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "tick") api.sfx("tick");
    else if (last.kind === "put" || last.kind === "pick") api.sfx("land");
    else api.sfx("tap");
    if (!s.ended) runAt = -1;
    void ms;
    api.invalidate(); deps.changed();
  }
  /** 0..1 of the run on screen; 1 once it has played (the law answered when the act landed) */
  const runK = () => (runAt < 0 ? 0 : clamp((api.t - runAt) / SWEEP, 0, 1));
  const shownEnd = () => st().ended && runK() >= 1;
  /** the clock as shown: gliding from the last value to the law's over a short beat */
  function shownT(): number {
    const s = st();
    if (tickAt < 0) return s.t;
    const k = ease.out(clamp((api.t - tickAt) / STEP, 0, 1));
    return lerp(tFrom, s.t, k);
  }
  function update(): void {
    if ((runAt >= 0 && runK() < 1) || (tickAt >= 0 && api.t - tickAt < STEP)) api.invalidate();
    if (runAt >= 0 && runK() >= 1 && announced !== runAt) {
      announced = runAt;
      if (st().done) { api.sfx("good"); api.fx.burst(w / 2, h / 2, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      // the run's last frame (its ticks and magnifiers) is drawn even when the previous frame fell just short of the end
      api.invalidate(); deps.changed();
    }
  }
  const busy = () => !!drag || (runAt >= 0 && runK() < 1) || (tickAt >= 0 && api.t - tickAt < STEP);

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
    if (kind === "down" && id?.startsWith("eye-")) { const r = Number(id.slice(4)); if (r !== s.view) act({ kind: "view", ref: r }); return; }
    if (kind === "down" && id?.startsWith("v-")) { const [i, b] = id.slice(2).split(":").map(Number); if (s.place[i] !== b) act({ kind: "put", lane: i, at: b }); return; }
    if (kind === "down" && id?.startsWith("tag-")) { const [i, b] = id.slice(4).split(":").map(Number); act({ kind: "tag", lane: i, at: b }); return; }
    if (kind === "down" && id?.startsWith("pick-")) { const i = Number(id.slice(5)); if (i !== s.pick) act({ kind: "pick", lane: i }); return; }
    if (!binGoal) return;
    if (kind === "down") {
      if (id?.startsWith("lane-")) { drag = { lane: Number(id.slice(5)), x, y, moved: false }; ctl.finger(true); api.sfx("select"); }
      else if (id?.startsWith("bin-") && sel >= 0) { const at = Number(id.slice(4)), lane = sel; sel = -1; if (s.place[lane] !== at) act({ kind: "put", lane, at }); }
    } else if (kind === "move" && drag) { if (Math.hypot(x - drag.x, y - drag.y) > 8) drag.moved = true; drag.x = x; drag.y = y; }
    else if ((kind === "up" || kind === "cancel") && drag) {
      const d0 = drag; drag = null; ctl.finger(false);
      if (kind === "up" && id?.startsWith("bin-")) { const at = Number(id.slice(4)); if (s.place[d0.lane] !== at) act({ kind: "put", lane: d0.lane, at }); sel = -1; }
      else if (kind === "up" && !d0.moved) sel = sel === d0.lane ? -1 : d0.lane;
    }
    api.invalidate(); deps.changed();
  }

  // ── shared pieces ──
  const unitT = p.goal === "aage" || p.goal === "nikaalo" ? UNITS[p.units].t : p.goal === "badlo" ? "s" : p.goal === "ek-saa" ? "s" : "";
  function header(c: CanvasRenderingContext2D, left: string): void {
    const P = api.P, s = st();
    const clock = unitT ? W("gati.clock", { t: p.goal === "ek-saa" ? s.t * p.dt : s.t, u: unitT }) : W("gati.clockpal", { t: s.t });
    const cw = clock.length * 9.6 + 22;
    P.chip(c, clock, w - 8 - cw / 2, HDR / 2, { size: 16, role: s.t >= tMaxOf(p) ? undefined : "q1" });
    // the context line only when it fits on one line beside the clock (the selected card or toggle says it too)
    if (left) {
      c.save(); c.font = `700 16px ${/[\u0900-\u097F]/.test(left) ? api.art.font.deva : api.art.font.ui}`; const lw = c.measureText(left).width; c.restore();
      if (lw <= w - 28 - cw) P.text(c, left, 8 + (w - 24 - cw) / 2, HDR / 2, { size: 16, role: "ink2", weight: 700 });
    }
  }
  /** the counter: one wheel per digit; a wheel's top half adds one of its place, the bottom half takes one away */
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
  function eyeIcon(c: CanvasRenderingContext2D, x: number, y: number, s: number, role: Role): void {
    const P = api.P, pts: [number, number][] = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); pts.push([x - s + 2 * s * (i / 16), y - Math.sin(a) * s * 0.55]); }
    for (let i = 16; i >= 0; i--) { const a = Math.PI * (i / 16); pts.push([x - s + 2 * s * (i / 16), y + Math.sin(a) * s * 0.55]); }
    P.stroke(c, pts, { role, width: 2, closed: true });
    P.circle(c, x, y, s * 0.3, { role, fill: true });
  }
  function bins3(c: CanvasRenderingContext2D, names: [string, string][], bad: (j: number) => boolean, labelOf: (lane: number) => string): void {
    const P = api.P, s = st(), nb = names.length, total = nb * binW + (nb - 1) * 8, bx = (w - total) / 2;
    for (let j = 0; j < nb; j++) {
      const x = bx + j * (binW + 8), here = s.place.map((b, i) => (b === j ? i : -1)).filter((i) => i >= 0);
      if (!s.done) api.target(`bin-${j}`, x, binY, binW, binH);
      P.body(c, x, binY, binW, binH, { role: "panel", r: 10, state: bad(j) ? "look" : "idle", seed: 10 + j });
      P.stroke(c, [[x + 8, binY + binH - 4], [x + binW - 8, binY + binH - 4]], { role: "q3", width: 4 });
      P.textFit(c, names[j][0], x + binW / 2, binY + 13, binW - 8, 20, { size: 16, role: "ink", weight: 800 });
      if (names[j][1]) P.textFit(c, names[j][1], x + binW / 2, binY + 31, binW - 8, 18, { size: 16, role: "ink2", weight: 600 });
      const r = 11, sp = here.length > 1 ? Math.min(2 * r + 4, (binW - 12 - 2 * r) / (here.length - 1)) : 0;
      here.forEach((lane, q) => {
        const tx = x + 6 + r + q * sp, ty = binY + binH - r - 7;
        P.circle(c, tx, ty, r, { role: "q2", fill: true }); P.text(c, labelOf(lane), tx, ty, { size: 16, weight: 800, on: "q2" });
      });
      if (!here.length && (sel >= 0 || drag)) P.circle(c, x + binW / 2, binY + binH - 18, 10, { role: "you", width: 2 });
      if (bad(j)) P.magnifier(c, x + binW - 14, binY + 14, 14);
    }
    if (drag?.moved) { P.circle(c, drag.x, drag.y, 16, { role: "q2", fill: true }); P.text(c, labelOf(drag.lane), drag.x, drag.y, { size: 16, weight: 800, on: "q2" }); }
  }
  /** a bin is looked at after a missed run when a lane on it belongs elsewhere */
  function badBins(): (j: number) => boolean {
    const s = st();
    if (!shownEnd() || s.done) return () => false;
    const r = rightPlace(p);
    return (j) => s.place.some((b, i) => b === j && r[i] !== j);
  }

  // ───────────────────────────── sandarbh ─────────────────────────────
  /** world x of a story thing at time τ (things on a vehicle ride with it) */
  const BASE: Record<string, number> = { passenger: -12, seat: -12, platform: 0, pole: 40, man: -45, rider: -12, boy: 12, aman: -30, tree: 50, stop: -48, mytrain: 0, other: 0 };
  function drawSandarbh(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), sp = p as SandarbhParams, tau = shownT();
    const xw = (id: string, t: number) => BASE[id] + speedOfThing(sp.story, sp.v, id) * t;
    const ref = sp.refs[s.view], x0 = 8, y0 = HDR, sw = w - 16, sh = sceneH, k = sw / 330, cx = x0 + sw / 2;
    const X = (wx: number, t = tau) => cx + (wx - xw(ref, t)) * k;
    P.body(c, x0, y0, sw, sh, { role: "panel", r: 10, seed: 2 });
    c.save(); c.beginPath(); c.rect(x0 + 2, y0 + 2, sw - 4, sh - 4); c.clip();
    const trackY = y0 + sh - 44, backY = trackY - 52, platY = trackY + 8;
    const lo = xw(ref, tau) - 180, hi = xw(ref, tau) + 180;
    // the ground: rails with sleepers (or a road with dashes), fixed to the ground; they slide when watched from a vehicle
    const rails = (yy: number) => {
      P.stroke(c, [[x0, yy], [x0 + sw, yy]], { role: "ink2", width: 2.5 });
      for (let g = Math.floor(lo / 16) * 16; g < hi; g += 16) P.stroke(c, [[X(g), yy + 1], [X(g), yy + 6]], { role: "ink3", width: 3 });
    };
    if (sp.story === "bus") {
      P.body(c, x0, trackY + 2, sw, 16, { role: "ink3", r: 0, fill: 0.35 });
      for (let g = Math.floor(lo / 30) * 30; g < hi; g += 30) P.stroke(c, [[X(g), trackY + 10], [X(g + 14), trackY + 10]], { role: "panel", width: 3 });
    } else { rails(trackY); if (sp.story === "twin") rails(backY); }
    // the vehicles
    const car = (xa: number, xb: number, yb: number, role: Role, seed: number) => {
      const ht = Math.min(40, sh * 0.24);
      P.body(c, X(xa), yb - ht, (xb - xa) * k, ht - 3, { role, r: 6, seed });
      for (let g = xa + 8; g < xb - 14; g += 20) P.body(c, X(g), yb - ht + 6, 14 * k, ht * 0.38, { role: "panel", r: 3, fill: 0.85 });
      for (const g of [xa + 12, xb - 12]) P.circle(c, X(g), yb - 2, 4, { role: "ink2", fill: true });
    };
    if (sp.story === "twin") {
      car(xw("other", tau) - 78, xw("other", tau), backY, "q3", 7); car(xw("other", tau), xw("other", tau) + 78, backY, "q3", 8);
      car(-78, 0, trackY, "q1", 5); car(0, 78, trackY, "q1", 6);
    } else if (sp.story === "train") { car(xw("seat", tau) - 68, xw("seat", tau) + 10, trackY, "q1", 5); car(xw("seat", tau) + 10, xw("seat", tau) + 88, trackY, "q1", 6); }
    else car(xw("rider", tau) - 58, xw("rider", tau) + 70, trackY - 2, "q3", 9);
    // people and fixed things
    const person = (id: string, feet: number, sc = 1, role: Role = "q2") => {
      const x = X(xw(id, tau));
      P.circle(c, x, feet - 26 * sc, 6 * sc, { role, fill: true });
      P.body(c, x - 5 * sc, feet - 19 * sc, 10 * sc, 19 * sc, { role, r: 3 });
    };
    const seated = (id: string, yb: number, role: Role = "q2") => { const x = X(xw(id, tau)), ht = Math.min(40, sh * 0.24); P.circle(c, x, yb - ht + 12, 6, { role, fill: true }); };
    if (sp.story !== "bus") {
      // the platform in front, its pillars fixed to the ground
      P.body(c, x0 - 4, platY, sw + 8, 26, { role: "ink3", r: 0, fill: 0.22 });
      for (let g = Math.floor(lo / 60) * 60; g < hi; g += 60) P.stroke(c, [[X(g), platY + 4], [X(g), platY + 26]], { role: "ink3", width: 2 });
      // the pole: a lamp post on the platform
      const px = X(xw("pole", tau));
      P.stroke(c, [[px, platY + 12], [px, platY - 46]], { role: "ink", width: 3 });
      P.circle(c, px, platY - 48, 5, { role: "q4", fill: true });
    }
    if (sp.story === "train") { const sx = X(xw("seat", tau)); P.body(c, sx - 8, trackY - 22, 16, 10, { role: "q4", r: 2 }); seated("passenger", trackY); person("man", platY + 14); }
    if (sp.story === "bus") {
      seated("rider", trackY - 2); seated("boy", trackY - 2, "q1");
      const tx = X(xw("tree", tau)); P.stroke(c, [[tx, trackY + 14], [tx, trackY - 30]], { role: "ink2", width: 4 }); P.circle(c, tx, trackY - 40, 14, { role: "good", fill: true, alpha: 0.6 });
      const bx = X(xw("stop", tau)); P.stroke(c, [[bx, trackY + 14], [bx, trackY - 46]], { role: "ink", width: 3 }); P.body(c, bx - 9, trackY - 58, 18, 14, { role: "q4", r: 3 });
      person("aman", trackY + 16);
    }
    // the watched thing: a ring now, a dot at every tick so far, as seen from the reference
    const tgt = sp.target, ty = sp.story === "twin" ? trackY - 22 : sp.story === "bus" ? (RIDES[tgt] >= 0 ? trackY - 2 - Math.min(40, sh * 0.24) + 12 : trackY - 10) : RIDES[tgt] >= 0 ? trackY - Math.min(40, sh * 0.24) + 12 : platY - 12;
    const done = Math.floor(tau + 1e-6);
    for (let j = 0; j <= done; j++) P.circle(c, X(xw(tgt, j), j), ty + 22, 4.5, { role: "q4", fill: true, alpha: 0.4 + (0.5 * j) / Math.max(1, done) });
    if (done >= 1) P.stroke(c, [[X(xw(tgt, 0), 0), ty + 22], [X(xw(tgt, done), done), ty + 22]], { role: "q4", width: 1.5, alpha: 0.5, dash: [3, 3] });
    P.circle(c, X(xw(tgt, tau)), ty, 11, { role: "q4", width: 2.5 });
    // the reference watched from: an eye above it (it stays put on screen)
    eyeIcon(c, cx, y0 + 14, 11, "ink");
    P.stroke(c, [[cx, y0 + 24], [cx, y0 + 34]], { role: "ink", width: 2 });
    c.restore();
    // the cards
    for (let i = 0; i < sp.refs.length; i++) {
      const y = laneY + i * laneH, cy = y + laneH / 2, on = s.view === i, bh = 44;
      P.body(c, 8, y + 2, w - 16, laneH - 4, { role: "panel", r: 8, seed: 20 + i, state: on ? "selected" : "idle" });
      if (!s.done) api.target(`eye-${i}`, 12, cy - 22, 48, 44);
      P.body(c, 14, cy - 19, 44, 38, { role: "panel", r: 8, seed: 30 + i, state: on ? "selected" : "idle" });
      eyeIcon(c, 36, cy, 12, on ? "ink" : "ink3");
      // the reference's name (the eye beside it says "from")
      const TB = clamp((w - 176) / 2 - 4, 64, 80), tw = Math.max(80, w - 16 - 52 - 2 * (TB + 4) - 8);
      P.textFit(c, W(`gati.thing.${sp.refs[i]}`), 62 + tw / 2, cy, tw, laneH - 6, { size: 16, role: "ink", weight: 700 });
      for (const b of [0, 1]) {
        const bx = w - 12 - (2 - b) * (TB + 4) + 4;
        if (!s.done) api.target(`v-${i}:${b}`, bx, cy - bh / 2, TB, bh);
        P.body(c, bx, cy - bh / 2 + 2, TB, bh - 4, { role: s.place[i] === b ? "q2" : "panel", r: 8, seed: 40 + 2 * i + b, state: s.place[i] === b ? "selected" : "idle" });
        P.textFit(c, W(b ? "gati.moving" : "gati.rest"), bx + TB / 2, cy, TB - 6, bh - 6, { size: 16, weight: 700, ...(s.place[i] === b ? { on: "q2" as Role } : { role: "ink" as Role }) });
      }
      const r = rightPlace(p);
      if (shownEnd() && !s.done && s.place[i] !== r[i]) P.magnifier(c, w - 12 - 2 * (TB + 4) - 6, cy - 12, 14);
    }
    if (shownEnd() && s.done) P.tick(c, w - 30, laneY - 14, 22, 1);
  }

  // ───────────────────────────── prakaar ─────────────────────────────
  function drawPrakaar(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), pp = p as PrakaarParams, end = shownEnd();
    const rows = Math.ceil(lanes / 2), ww = (w - 24) / 2, wh = laneH - 8;
    // the run plays the clock on to the end (the whole path), shown over the sweep
    const tShow = s.ended && runAt >= 0 ? lerp(s.t, PRAKAAR_T, runK()) : shownT();
    const reveal = pp.look === 1 || end;
    for (let i = 0; i < lanes; i++) {
      const col = i % 2, row = Math.floor(i / 2), x = 8 + col * (ww + 8), y = laneY + row * laneH + 2;
      if (!s.done) api.target(`lane-${i}`, x, y, ww, wh);
      P.body(c, x, y, ww, wh, { role: "panel", r: 10, seed: 50 + i, state: sel === i ? "look" : "idle" });
      // the name may take two lines at the window's top; the drawing sits below it
      const th = pp.things[i], ph = pp.phase[i], sc = Math.min((ww - 20) / 2.75, (wh - 44) / 2.05), ox = x + ww / 2, oy = y + 38 + (wh - 38) / 2;
      const S = (q: [number, number]): [number, number] => [ox + q[0] * sc, oy + q[1] * sc];
      if (reveal) thingSketch(c, th, ph, tShow, S, sc);
      // the light's path: sampled between ticks (the real path), a dot at every tick
      const path: [number, number][] = [];
      for (let q = 0; q <= Math.round(tShow * 6); q++) path.push(S(prakaarAt(th, ph, Math.min(tShow, q / 6))));
      path.push(S(prakaarAt(th, ph, tShow)));
      if (path.length > 1) P.stroke(c, path, { role: "q1", width: 2.5, alpha: 0.75 });
      for (let j = 0; j <= Math.floor(tShow + 1e-6); j++) { const [px, py] = S(prakaarAt(th, ph, j)); P.circle(c, px, py, 3, { role: "q1", fill: true }); }
      const [lx, ly] = S(prakaarAt(th, ph, tShow));
      P.circle(c, lx, ly, 8, { role: "q3", fill: true }); P.circle(c, lx, ly, 8, { role: "ink", width: 1.5 });
      // the lane's number (its token on the bins), and once shown, the thing's name
      P.circle(c, x + 15, y + 15, 12, { role: "q2", fill: true }); P.text(c, String(i + 1), x + 15, y + 15, { size: 16, weight: 800, on: "q2" });
      if (reveal) P.textFit(c, W(`gati.thing.${th}`), x + ww / 2 + 12, y + 19, ww - 36, 38, { size: 16, role: "ink2", weight: 700 });
      if (end && !s.done && s.place[i] >= 0 && s.place[i] !== PRAKAAR[th]) P.magnifier(c, x + ww - 16, y + wh - 16, 14);
    }
    void rows;
    bins3(c, [0, 1, 2].map((j) => [W(`gati.type.${j}`), W(`gati.type.${j}.sub`)] as [string, string]), badBins(), (lane) => String(lane + 1));
    if (end && s.done) P.tick(c, w - 26, binY - 14, 22, 1);
  }
  /** the thing itself, lightly (look 1, and every look once the run has played) */
  function thingSketch(c: CanvasRenderingContext2D, th: string, ph: number, t: number, S: (q: [number, number]) => [number, number], sc: number): void {
    const P = api.P, o = { role: "ink3" as Role, width: 2, alpha: 0.7 };
    if (th === "wheel" || th === "clock" || th === "fan") {
      const [cx, cy] = S([0, 0]), r = (th === "fan" ? 0.6 : th === "clock" ? 0.7 : 0.72) * sc;
      if (th !== "fan") P.circle(c, cx, cy, r, { role: "ink3", width: 2, alpha: 0.6 });
      const tip = S(prakaarAt(th as "wheel", ph, t));
      P.stroke(c, [[cx, cy], tip], { ...o, width: th === "fan" ? 6 : 2 });
      if (th === "wheel") for (let q = 1; q < 4; q++) { const a = Math.atan2(tip[1] - cy, tip[0] - cx) + (q * Math.PI) / 2; P.stroke(c, [[cx, cy], [cx + r * Math.cos(a), cy + r * Math.sin(a)]], o); }
      P.circle(c, cx, cy, 4, { role: "ink2", fill: true });
      if (th === "wheel") P.stroke(c, [[cx, cy], [cx - r * 0.5, cy + r * 1.25], [cx + r * 0.5, cy + r * 1.25], [cx, cy]], o);
      return;
    }
    if (th === "swing" || th === "pendulum" || th === "boat") {
      const piv = S([0, -0.85]), bob = S(prakaarAt(th as "swing", ph, t));
      P.stroke(c, [[piv[0] - 20, piv[1]], [piv[0] + 20, piv[1]]], { role: "ink2", width: 3, alpha: 0.7 });
      if (th === "swing") { P.stroke(c, [[piv[0] - 3, piv[1]], [bob[0] - 3, bob[1]]], o); P.stroke(c, [[piv[0] + 3, piv[1]], [bob[0] + 3, bob[1]]], o); P.stroke(c, [[bob[0] - 10, bob[1] + 2], [bob[0] + 10, bob[1] + 2]], { role: "ink2", width: 4, alpha: 0.7 }); }
      else if (th === "boat") { P.stroke(c, [[piv[0], piv[1]], [bob[0], bob[1]]], { ...o, width: 3 }); P.stroke(c, [[bob[0] - 16, bob[1] - 2], [bob[0] - 10, bob[1] + 6], [bob[0] + 10, bob[1] + 6], [bob[0] + 16, bob[1] - 2]], { role: "ink2", width: 3, alpha: 0.7 }); }
      else P.stroke(c, [[piv[0], piv[1]], [bob[0], bob[1]]], o);
      return;
    }
    if (th === "string") { const a = S([-1.2, 0]), b = S([1.2, 0]), m = S(prakaarAt("string", ph, t)); P.stroke(c, [a, m, b], o); P.circle(c, a[0], a[1], 3, { role: "ink2", fill: true }); P.circle(c, b[0], b[1], 3, { role: "ink2", fill: true }); return; }
    if (th === "train") { const a = S([-1.3, 0.47]), b = S([1.3, 0.47]); P.stroke(c, [a, b], o); const q = S(prakaarAt("train", ph, t)); P.body(c, q[0] - 16, q[1] - 12, 32, 16, { role: "q1", r: 4, fill: 0.35 }); return; }
    if (th === "slide") { P.stroke(c, [S([-0.95, -0.55]), S([0.95, 0.88])], o); P.stroke(c, [S([0.95, 0.88]), S([0.95, 1.0])], o); return; }
    if (th === "drop") { const q = S([0.1, -0.97]); P.stroke(c, [[q[0] - 16, q[1]], [q[0] + 16, q[1]]], { role: "ink2", width: 3, alpha: 0.7 }); P.stroke(c, [S([-1.2, 0.95]), S([1.2, 0.95])], o); }
    void sc;
  }

  // ───────────────────────────── do-gati ─────────────────────────────
  function typeIcon(c: CanvasRenderingContext2D, ty: number, x: number, y: number, role: Role): void {
    const P = api.P;
    if (ty === 0) { P.stroke(c, [[x - 13, y], [x + 11, y]], { role, width: 3 }); P.stroke(c, [[x + 5, y - 6], [x + 12, y], [x + 5, y + 6]], { role, width: 3 }); }
    else if (ty === 1) { P.circle(c, x, y, 10, { role, width: 3 }); P.stroke(c, [[x + 6, y - 12], [x + 10, y - 8], [x + 5, y - 5]], { role, width: 2.5 }); }
    else {
      // a swing's arc with an arrowhead at both ends: to and fro
      const at = (a: number): [number, number] => [x + 14 * Math.sin(a), y + 4 - 14 * (1 - Math.cos(a))];
      const pts: [number, number][] = []; for (let q = 0; q <= 12; q++) pts.push(at(-0.95 + 1.9 * (q / 12)));
      P.stroke(c, pts, { role, width: 3 });
      for (const sx of [-1, 1]) {
        // the outward tangent at the arc's end
        const T = at(sx * 0.95), ux = sx * Math.cos(0.95), uy = -Math.sin(0.95);
        P.stroke(c, [[T[0] - 6 * ux - 4 * uy, T[1] - 6 * uy + 4 * ux], T, [T[0] - 6 * ux + 4 * uy, T[1] - 6 * uy - 4 * ux]], { role, width: 2.5 });
      }
    }
  }
  function drawDoGati(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), dp = p as DoGatiParams, end = shownEnd(), tau = shownT(), frame = (s.view ? 1 : 0) as 0 | 1;
    // the legend: the three types
    const lw = (w - 16) / 3;
    for (let ty = 0; ty < 3; ty++) { const x = 8 + ty * lw; typeIcon(c, ty, x + 18, HDR + 14, "ink2"); P.textFit(c, W(`gati.type.${ty}`), x + 36 + (lw - 40) / 2, HDR + 14, lw - 40, 24, { size: 16, role: "ink2", weight: 700 }); }
    const r = rightPlace(p), bw = 44, gap = 4;
    for (let i = 0; i < lanes; i++) {
      const y = laneY + i * laneH + 2, wh = laneH - 6, ww = w - 16 - 3 * bw - 2 * gap - 8, x = 8;
      P.body(c, x, y, ww, wh, { role: "panel", r: 10, seed: 60 + i });
      // the thing's name sits on the window's top strip; the drawing below it
      const th = dp.things[i], ph = (dp.phase[i] * Math.PI) / 6, sc = Math.min((ww - 20) / 2.75, (wh - 30) / 1.9), ox = x + ww / 2, oy = y + 24 + (wh - 24) / 2;
      const S = (q: [number, number]): [number, number] => [ox + q[0] * sc, oy + q[1] * sc];
      c.save(); c.beginPath(); c.rect(x + 2, y + 2, ww - 4, wh - 4); c.clip();
      // the thing at the shown time
      const now = dogatiAt(th, ph, tau, frame);
      if (th === "bicycle") {
        const [bx, by] = S(now.base), R = 0.42 * sc;
        P.stroke(c, [S([-1.6, 0.6]), S([1.6, 0.6])], { role: "ink2", width: 2 });
        // the road's marks are fixed to the ground: riding along, they slide back
        const back = frame ? (1.24 * tau) / 10 - 0.62 : 0;
        for (let g = -2.5; g <= 2.5; g += 0.5) P.stroke(c, [S([g - back, 0.6]), S([g - back - 0.08, 0.7])], { role: "ink3", width: 1.5 });
        P.circle(c, bx, by, R, { role: "ink2", width: 3 });
        for (let q = 0; q < 4; q++) { const a = Math.atan2(S(now.pt)[1] - by, S(now.pt)[0] - bx) + (q * Math.PI) / 2; P.stroke(c, [[bx, by], [bx + R * Math.cos(a), by + R * Math.sin(a)]], { role: "ink3", width: 1.5 }); }
        P.stroke(c, [[bx, by], [bx + R * 1.3, by - R * 0.9], [bx + R * 1.9, by - R * 0.9]], { role: "ink3", width: 3 });
      } else if (th === "horse") {
        const [px, py] = S([0, 0.2]);
        const ell: [number, number][] = []; for (let q = 0; q <= 24; q++) { const a = (2 * Math.PI * q) / 24; ell.push(S([0.78 * Math.cos(a), 0.2 + 0.3 * Math.sin(a)])); }
        P.stroke(c, ell, { role: "ink3", width: 2, closed: true });
        P.stroke(c, [[px, py], [px, py - 0.95 * sc]], { role: "ink3", width: 3 });
        const hp = S(now.pt); P.stroke(c, [[hp[0], hp[1] - 0.25 * sc], [hp[0], hp[1] + 0.25 * sc]], { role: "ink3", width: 1.5 });
      } else if (th === "fan" || th === "wheel") {
        const [cx, cy] = S([0, 0]), tip = S(now.pt);
        if (th === "wheel") P.circle(c, cx, cy, 0.7 * sc, { role: "ink3", width: 2 });
        P.stroke(c, [[cx, cy], tip], { role: "ink3", width: th === "fan" ? 6 : 2 });
        P.circle(c, cx, cy, 4, { role: "ink2", fill: true });
      } else if (th === "swing") {
        const piv = S([0, -0.9]), bob = S(now.pt);
        P.stroke(c, [[piv[0] - 18, piv[1]], [piv[0] + 18, piv[1]]], { role: "ink2", width: 3 }); P.stroke(c, [piv, bob], { role: "ink3", width: 2 });
      } else {
        P.stroke(c, [S([-1.6, 0.42]), S([1.6, 0.42])], { role: "ink2", width: 2 });
        if (!frame) for (let g = -2; g <= 2; g += 0.3) P.stroke(c, [S([g, 0.42]), S([g, 0.5])], { role: "ink3", width: 2 });
        else for (let g = -2; g <= 2; g += 0.3) { const gx = g - ((1.56 * tau) / 10 % 0.3); P.stroke(c, [S([gx, 0.42]), S([gx, 0.5])], { role: "ink3", width: 2 }); }
        const q = S(now.pt); P.body(c, q[0] - 22, q[1] - 16, 44, 22, { role: "q1", r: 4, fill: 0.4 });
      }
      // the paths so far: the marked point (the light) and, faintly, its base
      const path: [number, number][] = [], base: [number, number][] = [];
      for (let q = 0; q <= Math.round(tau * 6); q++) { const at = dogatiAt(th, ph, Math.min(tau, q / 6), frame); path.push(S(at.pt)); base.push(S(at.base)); }
      path.push(S(now.pt)); base.push(S(now.base));
      if (path.length > 1) P.stroke(c, path, { role: "q1", width: 2.5, alpha: 0.75 });
      if ((th === "bicycle" || th === "train") && base.length > 1) P.stroke(c, base, { role: "q4", width: 2, alpha: 0.6, dash: [4, 3] });
      const [lx, ly] = S(now.pt);
      P.circle(c, lx, ly, 7, { role: "q3", fill: true }); P.circle(c, lx, ly, 7, { role: "ink", width: 1.5 });
      if (th === "bicycle") { const [ax, ay] = S(now.base); P.circle(c, ax, ay, 5, { role: "q4", fill: true }); }
      c.restore();
      P.textFit(c, W(`gati.thing.${th === "train" ? "toytrain" : th}`), x + ww / 2, y + 13, ww - 16, 20, { size: 16, role: "ink2", weight: 700 });
      // the type buttons
      for (let ty = 0; ty < 3; ty++) {
        const bx = x + ww + 8 + ty * (bw + gap), by = y + wh / 2 - bw / 2, on = !!(s.tags[i] & (1 << ty));
        if (!s.done) api.target(`tag-${i}:${ty}`, bx, by, bw, bw);
        P.body(c, bx, by + 1, bw, bw - 2, { role: on ? "q2" : "panel", r: 8, seed: 70 + 3 * i + ty, state: on ? "selected" : "idle" });
        typeIcon(c, ty, bx + bw / 2, by + bw / 2, on ? "panel" : "ink2");
      }
      if (end && !s.done && s.tags[i] !== r[i]) P.magnifier(c, x + ww - 14, y + wh - 14, 14);
      if (end && s.done) P.tick(c, x + ww - 16, y + wh - 16, 18, 1);
    }
    void bitsOf;
  }

  // ───────────────────────────── raftaar: the track ─────────────────────────────
  /** a step for the track's small marks and a step for its numbers (≥ 40 px apart) */
  function steps(maxD: number, pxPer: number, look: number): { step: number; every: number } {
    const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200];
    const step = nice.find((s0) => s0 * pxPer >= (look === 3 ? 22 : 14) && maxD / s0 <= 30) ?? 100;
    const every = nice.find((s0) => s0 % step === 0 && s0 * pxPer >= 40) ?? step * 4;
    return { step, every };
  }
  function track(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, maxD: number, look: number, unit: string): (d: number) => number {
    const P = api.P, px = (x1 - x0) / maxD, { step, every } = steps(maxD, px, look), X = (d: number) => x0 + d * px;
    P.stroke(c, [[x0, y], [x1, y]], { role: "ink", width: 2 });
    for (let d = 0; d <= maxD + 1e-9; d += step) {
      const big = Math.abs(d / every - Math.round(d / every)) < 1e-9;
      P.stroke(c, [[X(d), y], [X(d), y + (big ? 10 : 5)]], { role: big ? "ink" : "ink3", width: big ? 1.6 : 1 });
      if (big) P.text(c, String(d), X(d), y + 22, { size: 16, role: "ink", weight: 700, font: "mono" });
    }
    P.text(c, unit, x1 + 18, y + 22, { size: 16, role: "ink2", weight: 700, font: "mono", align: "left" });
    return X;
  }
  function moverIcon(c: CanvasRenderingContext2D, who: string, x: number, y: number, role: Role, alpha = 1): void {
    const P = api.P;
    c.save(); c.globalAlpha *= alpha;
    if (who === "runner") { P.circle(c, x, y - 22, 5, { role, fill: true }); P.stroke(c, [[x, y - 17], [x - 2, y - 8], [x - 7, y], [x - 2, y - 8], [x + 5, y]], { role, width: 2.5 }); P.stroke(c, [[x - 6, y - 14], [x + 6, y - 12]], { role, width: 2.5 }); }
    else if (who === "marble") P.circle(c, x, y - 8, 8, { role, fill: true });
    else if (who === "robot") { P.body(c, x - 9, y - 22, 18, 18, { role, r: 3 }); P.circle(c, x - 4, y - 15, 2, { role: "panel", fill: true }); P.circle(c, x + 4, y - 15, 2, { role: "panel", fill: true }); P.circle(c, x - 5, y - 2, 3, { role: "ink2", fill: true }); P.circle(c, x + 5, y - 2, 3, { role: "ink2", fill: true }); }
    else if (who === "cycle" || who === "scooter") { P.circle(c, x - 9, y - 6, 6, { role: "ink2", width: 2 }); P.circle(c, x + 9, y - 6, 6, { role: "ink2", width: 2 }); P.stroke(c, [[x - 9, y - 6], [x - 2, y - 16], [x + 9, y - 6]], { role, width: 3 }); P.circle(c, x - 2, y - 22, 4, { role, fill: true }); }
    else {
      const L = who === "train" || who === "metro" ? 40 : who === "bus" ? 34 : who === "toycar" ? 20 : 26, H = who === "toycar" ? 10 : 14;
      P.body(c, x - L / 2, y - H - 6, L, H, { role, r: 4 });
      if (who !== "toycar") for (let g = -L / 2 + 5; g < L / 2 - 6; g += 9) P.body(c, x + g, y - H - 3, 6, 5, { role: "panel", r: 1, fill: 0.85 });
      P.circle(c, x - L / 2 + 5, y - 4, 3.5, { role: "ink2", fill: true }); P.circle(c, x + L / 2 - 5, y - 4, 3.5, { role: "ink2", fill: true });
    }
    c.restore();
  }

  function drawAage(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), ap = p as AageParams, tau = shownT(), u = UNITS[ap.units], end = shownEnd();
    const maxD = Math.max(...ap.movers.map(distOf)), x0 = 26, x1 = w - 56;
    ap.movers.forEach((m, i) => {
      const y = laneY + i * laneH, ty = y + laneH - 34, on = s.pick === i;
      if (!s.done) api.target(`pick-${i}`, 8, y + 2, w - 16, laneH - 6);
      P.body(c, 8, y + 2, w - 16, laneH - 6, { role: "panel", r: 10, seed: 80 + i, state: on ? "selected" : "idle" });
      P.textFit(c, W(`gati.who.${m.who}`), 70, y + 16, 110, 20, { size: 16, role: "ink2", weight: 700 });
      const X = track(c, x0, x1, ty, maxD, ap.look, u.d);
      // where it was after each interval so far
      for (let j = 1; j <= Math.floor(tau + 1e-6); j++) {
        const d = posOf(m, j);
        P.stroke(c, [[X(d), ty - 26], [X(d), ty]], { role: "q4", width: 2, alpha: j <= m.T ? 0.8 : 0.3 });
        if (j <= m.T) P.text(c, `${j}`, X(d) + 7, ty - 21, { size: 16, role: "q4", weight: 800, font: "mono", align: "left" });
      }
      const d = m.v * Math.min(tau, m.T);
      moverIcon(c, m.who, X(d), ty - 1, i ? "q2" : "q1");
      // stopped: its trip
      if (s.t >= m.T) P.chip(c, `${distOf(m)} ${u.d} · ${m.T} ${u.t}`, Math.min(w - 90, Math.max(110, X(distOf(m)) - 10)), y + 16, { size: 16 });
      // the flag
      if (on) { P.stroke(c, [[20, y + 10], [20, y + 40]], { role: "ink", width: 2.5 }); P.fillPath(c, (g) => { g.beginPath(); g.moveTo(21, y + 10); g.lineTo(38, y + 16); g.lineTo(21, y + 22); g.closePath(); }, "red", { outline: "ink" }); }
      // the run: the distance each covered in the first interval, side by side
      if (s.ended && runAt >= 0) {
        const k = runK(), d1 = posOf(m, 1);
        P.body(c, x0, ty - 34, (X(d1) - x0) * k, 6, { role: i === fasterOf(ap) && end ? "good" : "q3", r: 3 });
        if (end && !s.done && i === fasterOf(ap)) P.magnifier(c, X(d1) + 14, ty - 36, 14);
      }
    });
    if (s.ended && runAt >= 0) P.textFit(c, W("gati.first", { u: u.t }), w / 2, laneY + 2 * laneH + 14, w - 32, 22, { size: 16, role: "ink2", weight: 700 });
    if (end && s.done) P.tick(c, w - 26, laneY + 2 * laneH + 14, 22, 1);
  }

  function drawNikaalo(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), np = p as NikaaloParams, tau = shownT(), u = UNITS[np.units], end = shownEnd();
    const D = totalOf(np), T = np.legs.length, x0 = 26, x1 = w - 56;
    const ghostD = s.ended ? s.at * T : 0, maxD = Math.max(D, Math.min(ghostD, D * 1.25));
    const y = laneY, ty = y + laneH - 34;
    P.body(c, 8, y + 2, w - 16, laneH - 6, { role: "panel", r: 10, seed: 90 });
    P.textFit(c, W(`gati.who.${np.who}`), 70, y + 16, 110, 20, { size: 16, role: "ink2", weight: 700 });
    const X = track(c, x0, x1, ty, maxD, np.look, u.d);
    const at = (t: number) => { let d = 0; for (let j = 0; j < T; j++) d += np.legs[j] * clamp(t - j, 0, 1); return d; };
    for (let j = 1; j <= Math.floor(tau + 1e-6); j++) { P.stroke(c, [[X(at(j)), ty - 26], [X(at(j)), ty]], { role: "q4", width: 2, alpha: 0.8 }); P.text(c, `${j}`, X(at(j)) + 7, ty - 21, { size: 16, role: "q4", weight: 800, font: "mono", align: "left" }); }
    moverIcon(c, np.who, X(at(tau)), ty - 1, "q1");
    if (s.t >= T) P.chip(c, `${D} ${u.d} · ${T} ${u.t}`, Math.min(w - 90, Math.max(120, X(D) - 10)), y + 16, { size: 16 });
    // the run: a ghost at the speedometer's speed for the same time, beside it
    const gy = y + laneH + 6;
    if (s.ended && runAt >= 0) {
      const k = runK(), gt = k * T, gd = s.at * gt, gx = Math.min(X(gd), x1 + 6);
      P.body(c, 8, gy, w - 16, laneH * 0.62, { role: "panel", r: 10, seed: 91, state: "dim" });
      const gty = gy + laneH * 0.62 - 14;
      P.stroke(c, [[x0, gty], [x1, gty]], { role: "ink3", width: 2 });
      for (let j = 1; j <= Math.floor(gt + 1e-6); j++) { const xd = X(s.at * j); if (xd <= x1) P.stroke(c, [[xd, gty - 18], [xd, gty]], { role: "q4", width: 2, alpha: 0.6 }); }
      moverIcon(c, np.who, gx, gty - 1, "q1", 0.5);
      P.textFit(c, W("gati.ghost", { v: s.at, u: u.v }), w / 2 + 30, gy + 14, w - 140, 20, { size: 16, role: "ink2", weight: 700 });
      if (end && !s.done) P.magnifier(c, Math.min(gx, x1) - 4, gty - 30, 14);
    }
    P.text(c, W(np.units === "kmh" ? "gati.speedometer" : "gati.speed"), cx0 - 14, wheelY - 12, { size: 16, role: "ink2", weight: 700, align: "left" });
    counter(c, u.v, true);
    if (end && s.done) P.tick(c, w - 26, wheelY - 14, 22, 1);
  }

  function drawBadlo(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), bp = p as BadloParams, tau = shownT(), end = shownEnd(), ms = msOf(bp.kmh), T = tMaxOf(p);
    const x0 = 26, x1 = w - 56, maxD = ms * T, y = laneY, ty = y + laneH - 34;
    P.body(c, 8, y + 2, w - 16, laneH - 6, { role: "panel", r: 10, seed: 92 });
    P.textFit(c, W(`gati.who.${bp.who}`), 70, y + 16, 110, 20, { size: 16, role: "ink2", weight: 700 });
    const X = track(c, x0, x1, ty, maxD, bp.look, "m");
    for (let j = 1; j <= Math.floor(tau + 1e-6); j++) { P.stroke(c, [[X(ms * j), ty - 26], [X(ms * j), ty]], { role: "q4", width: 2, alpha: 0.8 }); P.text(c, `${j}`, X(ms * j) + 7, ty - 21, { size: 16, role: "q4", weight: 800, font: "mono", align: "left" }); }
    moverIcon(c, bp.who, X(ms * tau), ty - 1, "q1");
    // the speedometer: a dial with its reading in km/h
    const dx = 54, dy = wheelY + wheelH / 2, R = Math.min(42, wheelH / 2);
    P.circle(c, dx, dy, R, { role: "ink2", width: 3 });
    const a = Math.PI * (0.8 + 1.4 * (bp.kmh / 160));
    P.stroke(c, [[dx, dy], [dx + R * 0.8 * Math.cos(a), dy + R * 0.8 * Math.sin(a)]], { role: "q4", width: 3 });
    P.text(c, `${bp.kmh}`, dx, dy + R * 0.42, { size: 18, role: "ink", weight: 800, font: "mono" });
    P.text(c, "km/h", dx, dy - R * 0.42, { size: 16, role: "ink2", weight: 700, font: "mono" });
    // the kit's own conversion (two lines when the box is narrow)
    P.body(c, 8, y + laneH, w - 16, 44, { role: "panel", r: 10, seed: 93, fill: 0.6 });
    P.textFit(c, W("gati.kit.convert"), w / 2, y + laneH + 22, w - 28, 42, { size: 16, role: "ink", weight: 700, font: "mono" });
    if (s.ended && runAt >= 0) {
      const gy = y + laneH + 50, gty = gy + 40, k = runK(), gt = k * T, gx = Math.min(X(s.at * gt), x1 + 6);
      P.stroke(c, [[x0, gty], [x1, gty]], { role: "ink3", width: 2 });
      for (let j = 1; j <= Math.floor(gt + 1e-6); j++) { const xd = X(s.at * j); if (xd <= x1) P.stroke(c, [[xd, gty - 18], [xd, gty]], { role: "q4", width: 2, alpha: 0.6 }); }
      moverIcon(c, bp.who, gx, gty - 1, "q1", 0.5);
      P.textFit(c, W("gati.ghost", { v: s.at, u: "m/s" }), w / 2, gy + 10, w - 40, 20, { size: 16, role: "ink2", weight: 700 });
      if (end && !s.done) P.magnifier(c, Math.min(gx, x1) - 4, gty - 30, 14);
    }
    counter(c, "m/s", true);
    if (end && s.done) P.tick(c, w - 26, wheelY - 14, 22, 1);
  }

  // ───────────────────────────── ek-saa ─────────────────────────────
  function drawEkSaa(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), ep = p as EkSaaParams, tau = shownT(), end = shownEnd();
    // the lane's token and name in a left column; the floor (its track) to their right
    const COL = 92, maxD = Math.max(...ep.movers.map((m) => m.gaps.reduce((a, b) => a + b, 0))), x0 = COL + 12, x1 = w - 20;
    const at = (m: { gaps: number[] }, t: number) => { let d = 0; for (let j = 0; j < m.gaps.length; j++) d += m.gaps[j] * clamp(t - j, 0, 1); return d; };
    const after = s.ended && runAt >= 0, showGaps = ep.look === 1 || after;
    ep.movers.forEach((m, i) => {
      const y = laneY + i * laneH, ty = y + laneH * 0.5 + 2;
      if (!s.done) api.target(`lane-${i}`, 8, y + 2, w - 16, laneH - 4);
      P.body(c, 8, y + 2, w - 16, laneH - 4, { role: "panel", r: 8, seed: 100 + i, state: sel === i ? "look" : "idle" });
      P.circle(c, 24, y + laneH / 2, 12, { role: "q2", fill: true }); P.text(c, String(i + 1), 24, y + laneH / 2, { size: 16, weight: 800, on: "q2" });
      P.textFit(c, W(`gati.who.${m.who}`), 40 + (COL - 40) / 2, y + laneH / 2, COL - 40, laneH - 8, { size: 16, role: "ink2", weight: 700 });
      const px = (x1 - x0) / maxD, X = (d: number) => x0 + d * px;
      P.stroke(c, [[x0, ty], [x1, ty]], { role: "ink3", width: 2 });
      // the floor's metre marks (looks 2 and 3: the gaps are read from them); after the run, each interval's distance instead
      if (ep.look > 1) { const every = maxD > 40 ? 10 : 5; for (let d = 0; d <= maxD; d += every) { P.stroke(c, [[X(d), ty], [X(d), ty + 6]], { role: "ink3", width: 1 }); if (!after && d % (every * 2) === 0) P.text(c, String(d), X(d), ty + 18, { size: 16, role: "ink3", weight: 600, font: "mono" }); } }
      // a chalk mark where it was at every tick so far
      for (let j = 0; j <= Math.floor(tau + 1e-6); j++) { const x = X(at(m, j)); P.stroke(c, [[x, ty - 9], [x, ty + 3]], { role: "q4", width: 3 }); }
      moverIcon(c, m.who, X(at(m, tau)), ty - 3, "q1");
      // each interval's distance (the kit's "distance in this interval" column)
      if (showGaps) {
        const upto = after ? m.gaps.length : Math.min(s.t, m.gaps.length);
        const list = m.gaps.slice(0, upto).join(" · ");
        if (upto) P.textFit(c, `${list} m`, (x0 + x1) / 2, ty + 19, x1 - x0, 20, { size: 16, role: "ink", weight: 700, font: "mono" });
      }
      if (end && !s.done && s.place[i] >= 0 && s.place[i] !== (uniform(m) ? 0 : 1)) P.magnifier(c, 24, y + 12, 12);
    });
    P.textFit(c, W("gati.every", { dt: ep.dt }), w / 2, binY - 12, w - 32, 20, { size: 16, role: "ink2", weight: 600 });
    bins3(c, [[W("gati.uniform"), W("gati.uniform.sub")], [W("gati.nonuniform"), W("gati.nonuniform.sub")]], badBins(), (lane) => String(lane + 1));
    if (end && s.done) P.tick(c, w - 26, binY - 14, 22, 1);
  }

  function draw(c: CanvasRenderingContext2D): void {
    const s = st();
    let left = "";
    if (p.goal === "sandarbh") left = W("gati.watching", { name: W(`gati.thing.${p.refs[s.view]}`) });
    else if (p.goal === "do-gati") left = W(`gati.view.${s.view ? 1 : 0}`);
    header(c, left);
    switch (p.goal) {
      case "sandarbh": drawSandarbh(c); break;
      case "prakaar": drawPrakaar(c); break;
      case "do-gati": drawDoGati(c); break;
      case "aage": drawAage(c); break;
      case "nikaalo": drawNikaalo(c); break;
      case "badlo": drawBadlo(c); break;
      case "ek-saa": drawEkSaa(c); break;
    }
  }

  function goal(): string {
    const s = st();
    if (s.done && shownEnd()) {
      if (p.goal === "nikaalo") return W(p.look === 3 ? "gati.solved.average" : "gati.solved.nikaalo", { v: want(p), u: UNITS[p.units].v });
      if (p.goal === "badlo") return W("gati.solved.badlo", { kmh: p.kmh, ms: msOf(p.kmh) });
      return W(`gati.solved.${p.goal}`);
    }
    if (s.ended && !s.done && runK() >= 1) return W("gati.again");
    if (s.t < tNeedOf(p) && s.t === 0) return W(`gati.goal.${p.goal}`, p.goal === "sandarbh" ? { thing: W(`gati.thing.${p.target}`) } : {});
    if (p.goal === "sandarbh") return W("gati.goal.sandarbh", { thing: W(`gati.thing.${p.target}`) });
    return W(`gati.goal.${p.goal}`);
  }
  // no readout beyond the scene: reading the track and the trails IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    if (p.goal === "do-gati") for (const f of [0, 1]) out.push({ id: `view-${f}`, label: W(`gati.view.${f}`), kind: "choice", group: "views", pressed: s.view === f, onPress: () => { if (s.view !== f) act({ kind: "view", ref: f }); } });
    const tick = unitT === "h" ? "gati.tick.h" : unitT === "s" ? "gati.tick.s" : unitT === "min" ? "gati.tick.min" : "gati.tick.pal";
    const atEnd = s.t >= tMaxOf(p);
    out.push({ id: "tick", label: W(tick, { dt: p.goal === "ek-saa" ? p.dt : 1 }), aria: "step the clock", kind: "secondary", group: "go", disabled: atEnd, you: !atEnd && s.t < tNeedOf(p), onPress: () => act({ kind: "tick" }) });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    let ready = !s.ended && s.t >= tNeedOf(p);
    if (p.goal === "sandarbh") ready = ready && p.refs.every((_, i) => s.seen & (1 << i));
    if (bins || p.goal === "sandarbh") ready = ready && s.place.every((x) => x >= 0);
    if (p.goal === "do-gati") ready = ready && s.tags.every((x) => x > 0);
    if (p.goal === "aage") ready = ready && s.pick >= 0;
    if (top) ready = ready && s.at > 0;
    out.push({ id: "run", label: W("gati.run"), aria: "check it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  void lanes;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
