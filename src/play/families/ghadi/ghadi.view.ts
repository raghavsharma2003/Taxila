// Ghadi · the 2D view (round 7, time and clocks; classes 4-5). Nothing here runs on a clock: every hand, ticket, runner and
// flag moves on the child's touch, and the run (ring the bell, run the bus, run the race, hop the days) only shows what the
// law has already answered.
//   set / run (arrive, leave)  a station board with what is given, one big GEARED clock: drag the long minute hand round
//              (the short hour hand creeps with it, and a full turn moves the hour on), drop the short hour hand in its
//              hour, tap a.m. (moon) or p.m. (sun) on the day strip. No digital readout of the child's clock: reading the
//              clock IS the skill. A bus run sweeps a second pair of hands through the trip and stops where the law says.
//   run (trip)  the departure and arrival clocks side by side (their board times under them) and a ticket the child makes
//              with + / − hour and minute pads; the run sweeps the departure clock by the ticket.
//   race        lanes with each runner's time as written; tap a runner, then a podium step (or drag it there); the race
//              runs each runner over the track in exactly their time, so the finish order is the law's.
//   calendar    a month grid; today ringed; tap a date to plant the flag; the hops go one date at a time from today.
// After a missed run only magnifiers mark what is not as it should be (a hand, the day strip, a step, the flag); never the key.
import type { GhadiAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { clockGoal, clockText, DAY, hourAngle, isPm, minuteAngle, raceOrder, runText, TICKET_H, TICKET_M, want, type GhadiParams, type GhadiState } from "./ghadi.logic.ts";

const SWEEP = 1.6;   // s a bus sweep / race / hop run takes on screen (cosmetic: the law has already answered)
const mod = (x: number, m: number) => ((x % m) + m) % m;

export const makeGhadiView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<GhadiParams, GhadiState, GhadiAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, clock = clockGoal(p.goal);
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const half = (t: number) => W(isPm(t) ? "ghadi.pm" : "ghadi.am");
  const timeText = (t: number) => `${clockText(t)} ${half(t)}`;
  function durText(): string {
    if (p.say === "dec") return W("ghadi.dur.dec", { x: String(p.dur / 60) });
    if (p.say === "quarter") return W("ghadi.dur.quarter");
    if (p.say === "threeq") return W("ghadi.dur.threeq");
    if (p.say === "min") return W("ghadi.dur.min", { m: p.dur });
    return W("ghadi.dur.hm", { h: Math.floor(p.dur / 60), m: p.dur % 60 });
  }
  let w = 360, h = 480;
  // the clock (and for trip, the second clock), the board, the day strip
  let cx = 180, cy = 260, R = 120, cx2 = 0, boardY = 8, boardH = 64, stripY = 0, stripH = 48;
  // race: lanes and steps; calendar: the grid
  let laneY = 0, laneH = 48, stepY = 0, stepW = 60, stepH = 64, cell = 44, gx = 8, gy = 8;
  let drag: null | { kind: "min" | "hour"; last: number; acc: number; t0: number; hour: number } | { kind: "runner"; lane: number; x: number; y: number; moved: boolean } = null;
  let sel = -1;           // race: the runner picked up by a tap
  let runAt = -1;         // api.t when the last run started on screen
  const ang = (x: number, y: number, ox = cx, oy = cy) => mod((Math.atan2(x - ox, oy - y) * 180) / Math.PI, 360);   // clockwise from 12

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (clock) {
      boardH = clamp(h * 0.16, 64, 92); boardY = 8;
      stripH = 48; stripY = h - stripH - 10;
      const ring = p.face === 1 ? 26 : 8;
      R = Math.max(70, Math.min(w / 2 - 12 - ring, (stripY - boardY - boardH - 16) / 2 - ring));
      cx = w / 2; cy = boardY + boardH + 8 + ring + R + Math.max(0, (stripY - boardY - boardH - 16 - 2 * (R + ring)) / 2);
    } else if (p.goal === "trip") {
      boardH = 0; R = Math.max(56, Math.min((w - 48) / 4, h * 0.2));
      cx = w / 2 - R - 12; cx2 = w / 2 + R + 12; cy = 8 + 22 + R + 4;
      stripY = cy + R + 44;            // the ticket card
    } else if (p.goal === "podium") {
      const n = p.runners.length;
      stepH = clamp(h * 0.18, 64, 96); stepY = h - stepH - 10;
      laneH = clamp((stepY - 24) / n, 48, 84); laneY = Math.max(8, (stepY - 16 - laneH * n) / 2);
      stepW = Math.min(110, (w - 16 - 8 * (n - 1)) / n);
    } else {
      const rows = Math.ceil((p.first + p.days) / 7);
      cell = Math.max(44, Math.min((w - 16) / 7, (h - 16 - 64) / rows, 72));
      gx = (w - cell * 7) / 2; gy = Math.max(8, (h - 64 - cell * rows) / 2) + 64;
    }
  }
  const act = (a: GhadiAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as GhadiAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx(p.goal === "hands" ? "tick" : "slide"); }
    else if (last.kind === "wind") api.sfx("tick");
    else if (last.kind === "put" || last.kind === "pick") api.sfx("land");
    else api.sfx("tap");
    if (!st().ended) runAt = -1;
    void ms;
    api.invalidate(); deps.changed();
  }
  /** 0..1 of the run on screen; 1 once it has played (the law answered when the act landed) */
  const runK = () => (runAt < 0 ? 0 : clamp((api.t - runAt) / SWEEP, 0, 1));
  const shownEnd = () => st().ended && runK() >= 1;
  let announced = -1;
  function update(): void {
    if (runAt >= 0 && runK() < 1) api.invalidate();
    if (runAt >= 0 && runK() >= 1 && announced !== runAt) {
      announced = runAt;
      if (st().done) { api.sfx("good"); api.fx.burst(w / 2, h / 2, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed();
    }
  }
  const busy = () => !!drag || (runAt >= 0 && runK() < 1);

  // ── pointer ──
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done) return;
    if (clock) {
      if (kind === "down") {
        const id = api.hit(x, y);
        if (id === "half-am" || id === "half-pm") { const pm = id === "half-pm"; if (pm !== isPm(s.t)) act({ kind: "half", pm }); return; }
        const d = Math.hypot(x - cx, y - cy);
        if (d > R * 1.2) return;
        const a = ang(x, y);
        drag = d < R * 0.52 ? { kind: "hour", last: a, acc: 0, t0: s.t, hour: Math.floor(a / 30) } : { kind: "min", last: a, acc: 0, t0: s.t, hour: 0 };
        ctl.finger(true); api.sfx("select");
      } else if (kind === "move" && drag && (drag.kind === "min" || drag.kind === "hour")) {
        const a = ang(x, y);
        if (drag.kind === "min") { let da = a - drag.last; if (da > 180) da -= 360; if (da < -180) da += 360; drag.acc += da / 6; drag.last = a; }
        else drag.hour = Math.floor(a / 30);
      } else if ((kind === "up" || kind === "cancel") && drag && (drag.kind === "min" || drag.kind === "hour")) {
        const d0 = drag; drag = null; ctl.finger(false);
        if (kind === "up") {
          if (d0.kind === "min") { const by = Math.round(d0.acc); if (by) act({ kind: "wind", by }); }
          else if (d0.hour !== Math.floor(mod(s.t, 720) / 60)) act({ kind: "hour", h: d0.hour });
        }
      }
      api.invalidate(); if (kind !== "move") deps.changed();
      return;
    }
    if (p.goal === "trip") return;   // the ticket is made with the pads
    if (p.goal === "days") {
      if (kind !== "down") return;
      const id = api.hit(x, y);
      if (id?.startsWith("day-")) act({ kind: "pick", day: Number(id.slice(4)) });
      return;
    }
    // race: tap a runner then a step, or drag a runner onto a step
    const id = kind === "move" ? null : api.hit(x, y);
    if (kind === "down") {
      if (id?.startsWith("lane-")) { drag = { kind: "runner", lane: Number(id.slice(5)), x, y, moved: false }; ctl.finger(true); api.sfx("select"); }
      else if (id?.startsWith("step-") && sel >= 0) { const at = Number(id.slice(5)); const lane = sel; sel = -1; if (s.order[at] !== lane) act({ kind: "put", lane, at }); }
      else if (id?.startsWith("step-") && s.order[Number(id.slice(5))] >= 0) { drag = { kind: "runner", lane: s.order[Number(id.slice(5))], x, y, moved: false }; ctl.finger(true); }
    } else if (kind === "move" && drag?.kind === "runner") { if (Math.hypot(x - drag.x, y - drag.y) > 8) drag.moved = true; drag.x = x; drag.y = y; }
    else if ((kind === "up" || kind === "cancel") && drag?.kind === "runner") {
      const d0 = drag; drag = null; ctl.finger(false);
      if (kind === "up" && id?.startsWith("step-")) { const at = Number(id.slice(5)); if (s.order[at] !== d0.lane) act({ kind: "put", lane: d0.lane, at }); sel = -1; }
      else if (kind === "up" && !d0.moved) sel = sel === d0.lane ? -1 : d0.lane;
    }
    api.invalidate(); deps.changed();
  }

  // ── the clock face ──
  function face(c: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, o: { ghost?: number | null; look?: { min: boolean; hour: boolean } } = {}): void {
    const P = api.P;
    P.circle(c, x, y, r, { role: "panel", fill: true });
    P.circle(c, x, y, r, { role: "ink2", width: 3 });
    const at = (deg: number, rr: number): [number, number] => [x + Math.sin((deg * Math.PI) / 180) * rr, y - Math.cos((deg * Math.PI) / 180) * rr];
    for (let k = 0; k < 60; k++) {
      const big = k % 5 === 0, a = k * 6;
      P.stroke(c, [at(a, r - 3), at(a, r - (big ? r * 0.1 : r * 0.05))], { role: big ? "ink2" : "ink3", width: big ? 2.5 : 1.2 });
    }
    const num = clamp(r * 0.17, 16, 30);
    for (let k = 1; k <= 12; k++) {
      if (p.face === 3 && k % 3) continue;
      P.text(c, String(k), ...at(k * 30, r * 0.72), { size: num, role: "ink", weight: 700, font: "ui" });
    }
    // fade 1: the minute ring outside the face (5, 10, 15 …: the kit's own scaffold)
    if (p.face === 1 && clock) for (let k = 1; k <= 12; k++) P.text(c, String((k * 5) % 60 === 0 ? 60 : k * 5), ...at(k * 30, r + 15), { size: 14, role: "ink3", weight: 600, font: "mono" });
    const hand = (deg: number, len: number, width: number, role: "ink" | "q1" | "ink3", alpha = 1) => {
      P.stroke(c, [at(deg + 180, len * 0.14), at(deg, len)], { role, width, alpha });
    };
    if (o.ghost !== null && o.ghost !== undefined) {
      hand(hourAngle(o.ghost), r * 0.5, 8, "ink3", 0.85);
      hand(minuteAngle(o.ghost), r * 0.9, 4, "ink3", 0.85);
    }
    // the hour hand: short and thick, dark; the minute hand: long and thin, coloured, with a knob at its tip
    hand(hourAngle(t), r * 0.5, 9, "ink");
    P.circle(c, ...at(hourAngle(t), r * 0.5), 6, { role: "ink", fill: true });
    hand(minuteAngle(t), r * 0.93, 4.5, "q1");
    P.circle(c, ...at(minuteAngle(t), r * 0.93), 7, { role: "q1", fill: true });
    P.circle(c, x, y, 7, { role: "ink", fill: true });
    if (o.look?.hour) P.magnifier(c, ...at(hourAngle(t), r * 0.32), 22);
    if (o.look?.min) P.magnifier(c, ...at(minuteAngle(t), r * 0.62), 22);
  }
  /** the reading the child's clock shows right now (a drag shows its preview; the law is not asked until the finger lifts) */
  function shownT(): number {
    const s = st();
    if (drag?.kind === "min") return mod(drag.t0 + Math.round(drag.acc), DAY);
    if (drag?.kind === "hour") return (isPm(drag.t0) ? 720 : 0) + drag.hour * 60 + mod(drag.t0, 60);
    return s.t;
  }
  function board(c: CanvasRenderingContext2D, lines: [string, string][]): void {
    const P = api.P, bw = Math.min(w - 16, 420), bx = (w - bw) / 2;
    P.body(c, bx, boardY, bw, boardH, { role: "panel", r: 10 });
    const lh = boardH / lines.length;
    lines.forEach(([k, v], i) => {
      const y = boardY + lh * (i + 0.5);
      P.textFit(c, k, bx + 12 + (bw * 0.36) / 2, y, bw * 0.36, lh, { size: 16, role: "ink2", weight: 600 });
      P.textFit(c, v, bx + bw * 0.38 + (bw * 0.6) / 2, y, bw * 0.6, lh, { size: clamp(lh * 0.5, 16, 26), role: "ink", weight: 700, font: "mono" });
    });
  }

  function drawClockGoal(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    if (p.goal === "hands") board(c, [[W("ghadi.bell"), timeText(p.at)]]);
    else board(c, [[W(p.goal === "arrive" ? "ghadi.leaves" : "ghadi.arrives"), timeText(p.at)], [W("ghadi.trip"), durText()]]);
    // the sweep: the bus's hands run the trip (arrive: from the departure; leave: from the child's departure)
    // once the sweep has stopped it is gone: only the child's hands (and a magnifier on a miss) stay
    const k = runK();
    const ghost = runAt >= 0 && s.ended && p.goal !== "hands" && k < 1 ? (p.goal === "arrive" ? p.at : s.t) + Math.round(p.dur * k) : null;
    const t = shownT();
    const wrong = end && !s.done ? lookOf(s.t) : { min: false, hour: false, half: false };
    api.target("clock", cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
    face(c, cx, cy, R, t, { ghost, look: wrong });
    // the day strip: moon half (a.m.) and sun half (p.m.); the clock's half is lit
    const sw = Math.min(w - 16, 320), sx = (w - sw) / 2;
    for (const pm of [false, true]) {
      const x = sx + (pm ? sw / 2 + 4 : 0), bw = sw / 2 - 4, on = isPm(t) === pm;
      if (!s.done) api.target(pm ? "half-pm" : "half-am", x, stripY, bw, stripH);
      P.body(c, x, stripY, bw, stripH, { role: on ? "q4" : "panel", r: 10, });
      const ix = x + 26, iy = stripY + stripH / 2;
      if (pm) { P.circle(c, ix, iy, 9, { role: on ? "ink" : "q4", fill: true }); for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; P.stroke(c, [[ix + Math.cos(a) * 12, iy + Math.sin(a) * 12], [ix + Math.cos(a) * 16, iy + Math.sin(a) * 16]], { role: on ? "ink" : "q4", width: 2 }); } }
      else {
        // a crescent moon: the outer disc less an offset disc (even-odd), so it reads on every ground
        c.save(); c.fillStyle = P.color(on ? "ink" : "ink2"); c.beginPath(); c.arc(ix, iy, 12, 0, Math.PI * 2); c.arc(ix + 6, iy - 4, 10, 0, Math.PI * 2); c.fill("evenodd"); c.restore();
      }
      P.text(c, W(pm ? "ghadi.pm" : "ghadi.am"), x + bw / 2 + 14, iy, { size: 18, role: on ? "ink" : "ink2", weight: 700, on: on ? "q4" : undefined });
      if (wrong.half && on) P.magnifier(c, x + bw - 18, iy, 20);
    }
    if (end && s.done) P.tick(c, cx + R * 0.7, cy - R * 0.75, 28, 1);
  }
  /** after a missed run: which part of the child's clock is not as the law needs (never where it should be) */
  function lookOf(t: number): { min: boolean; hour: boolean; half: boolean } {
    const wt = want(p);
    return { min: mod(t, 60) !== mod(wt, 60), hour: Math.floor(mod(t, 720) / 60) !== Math.floor(mod(wt, 720) / 60), half: isPm(t) !== isPm(wt) };
  }

  function drawTrip(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), end = shownEnd();
    const tick = s.th * 60 + s.tm;
    const ghost = runAt >= 0 && s.ended && (k < 1 || s.done) ? p.at + Math.round(tick * k) : null;
    for (const [x, t, key] of [[cx, p.at, "ghadi.leaves"], [cx2, p.to, "ghadi.arrives"]] as [number, number, string][]) {
      P.text(c, W(key), x, 8 + 11, { size: 16, role: "ink2", weight: 700 });
      face(c, x, cy, R, x === cx && ghost !== null ? ghost : t, {});
      P.text(c, timeText(t), x, cy + R + 20, { size: 17, role: "ink", weight: 700, font: "mono", maxW: R * 2 + 16 });
    }
    // the ticket the child makes
    const tw = Math.min(w - 32, 300), tx = (w - tw) / 2, th = 72;
    P.body(c, tx, stripY, tw, th, { role: "panel", r: 12, state: end && !s.done ? "look" : "idle" });
    P.text(c, W("ghadi.ticket"), tx + 14, stripY + 18, { size: 15, role: "ink2", weight: 700, align: "left" });
    P.text(c, W("ghadi.dur.hm", { h: s.th, m: s.tm }), tx + tw / 2, stripY + 46, { size: 26, role: tick ? "ink" : "ink3", weight: 700, font: "mono", maxW: tw - 20 });
    if (end && !s.done) P.magnifier(c, tx + tw - 22, stripY + 22, 20);
    if (end && s.done) P.tick(c, cx2 + R * 0.7, cy - R * 0.75, 26, 1);
  }

  function drawRace(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), n = p.runners.length, k = runK(), end = shownEnd();
    const order = raceOrder(p), slowest = Math.max(...p.runners.map((r) => r.cs));
    // the track starts after the longest time as written, so a runner never sits on a label
    const lab = clamp(laneH * 0.36, 16, 22), longest = Math.max(...p.runners.map((r) => runText(r).length));
    const tx0 = Math.min(w - 90, 54 + longest * lab * 0.62 + 20), tx1 = w - 24;
    for (let i = 0; i < n; i++) {
      const y = laneY + i * laneH, r = p.runners[i], placed = s.order.includes(i);
      if (!s.done) api.target(`lane-${i}`, 8, y + 2, w - 16, laneH - 4);
      P.body(c, 8, y + 2, w - 16, laneH - 4, { role: "panel", r: 8, state: sel === i ? "look" : "idle", seed: i });
      // bib and the time as written
      P.circle(c, 30, y + laneH / 2, 15, { role: placed ? "ink3" : "q2", fill: true });
      P.text(c, String(i + 1), 30, y + laneH / 2, { size: 16, weight: 800, on: placed ? "ink3" : "q2" });
      P.text(c, runText(r), 54, y + laneH / 2, { size: lab, role: "ink", weight: 700, font: "mono", align: "left", maxW: tx0 - 54 - 14 });
      // the track and the runner: during the race each covers it in exactly their own time
      P.stroke(c, [[tx0, y + laneH / 2], [tx1, y + laneH / 2]], { role: "ink3", width: 2, dash: [6, 5] });
      P.stroke(c, [[tx1, y + 8], [tx1, y + laneH - 8]], { role: "ink2", width: 3 });
      const f = runAt >= 0 && s.ended ? clamp((k * slowest * 1.05) / r.cs, 0, 1) : 0;
      P.circle(c, tx0 + 10 + (tx1 - tx0 - 20) * f, y + laneH / 2, 9, { role: "q1", fill: true });
      if (f >= 1 && runAt >= 0) P.text(c, String(order.indexOf(i) + 1), tx1 - 14, y + 12, { size: 14, role: "ink2", weight: 800 });
    }
    // the podium: steps 1st … nth, the runner's bib on its step
    const total = n * stepW + (n - 1) * 8, sx = (w - total) / 2;
    for (let j = 0; j < n; j++) {
      const x = sx + j * (stepW + 8), hh = stepH - j * Math.min(8, stepH * 0.08), y = stepY + (stepH - hh);
      const lane = s.order[j], bad = end && !s.done && lane !== order[j];
      if (!s.done) api.target(`step-${j}`, x, stepY, stepW, stepH);
      P.body(c, x, y, stepW, hh, { role: "q3", r: 8, state: bad ? "look" : "idle", seed: 10 + j });
      P.text(c, String(j + 1), x + 14, y + 14, { size: 15, weight: 800, on: "q3" });
      if (lane >= 0) { P.circle(c, x + stepW / 2, y + hh / 2 + 6, 17, { role: "q2", fill: true }); P.text(c, String(lane + 1), x + stepW / 2, y + hh / 2 + 6, { size: 18, weight: 800, on: "q2" }); }
      else if (sel >= 0 || drag?.kind === "runner") P.circle(c, x + stepW / 2, y + hh / 2 + 6, 17, { role: "you", width: 2 });
      if (bad) P.magnifier(c, x + stepW - 16, y + 16, 18);
    }
    if (drag?.kind === "runner" && drag.moved) { P.circle(c, drag.x, drag.y, 17, { role: "q2", fill: true }); P.text(c, String(drag.lane + 1), drag.x, drag.y, { size: 18, weight: 800, on: "q2" }); }
    if (end && s.done) P.tick(c, w / 2, stepY - 18, 26, 1);
  }

  function drawDays(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), end = shownEnd();
    // the legend: the ring is today
    P.circle(c, gx + 18, gy - 48, 13, { role: "q4", width: 3 });
    P.text(c, `${W("ghadi.today")} ${p.today}`, gx + 40, gy - 48, { size: 17, role: "ink", weight: 700, align: "left" });
    for (let d = 0; d < 7; d++) P.text(c, W(`ghadi.wd${d}`), gx + cell * (d + 0.5), gy - 15, { size: 15, role: "ink2", weight: 700 });
    const xy = (day: number): [number, number] => { const i = p.first + day - 1; return [gx + (i % 7) * cell, gy + Math.floor(i / 7) * cell]; };
    const hops = runAt >= 0 && s.ended ? Math.floor(k * p.ahead) : 0;
    for (let day = 1; day <= p.days; day++) {
      const [x, y] = xy(day), bad = end && !s.done && day === s.pick;
      if (!s.done) api.target(`day-${day}`, x + 1, y + 1, cell - 2, cell - 2);
      P.body(c, x + 2, y + 2, cell - 4, cell - 4, { role: "panel", r: 6, state: bad ? "look" : "idle", seed: day });
      P.text(c, String(day), x + cell / 2, y + cell / 2, { size: clamp(cell * 0.34, 16, 22), role: day === p.today ? "ink" : "ink2", weight: day === p.today ? 800 : 600, font: "mono" });
      if (day === p.today) P.circle(c, x + cell / 2, y + cell / 2, cell * 0.4, { role: "q4", width: 3 });
      if (day === s.pick) {
        // the flag: a pole and a pennant at the cell's top right
        const fx = x + cell * 0.72, fy = y + cell * 0.12;
        P.stroke(c, [[fx, fy], [fx, fy + cell * 0.42]], { role: "ink", width: 2 });
        c.save(); c.fillStyle = P.color("you"); c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + cell * 0.22, fy + cell * 0.09); c.lineTo(fx, fy + cell * 0.18); c.closePath(); c.fill(); c.restore();
      }
      if (bad) P.magnifier(c, x + cell * 0.25, y + cell * 0.75, 16);
    }
    // the hops so far: one arc per day, from today
    for (let j = 0; j < hops; j++) {
      const [ax, ay] = xy(p.today + j), [bx, by] = xy(p.today + j + 1);
      P.stroke(c, [[ax + cell / 2, ay + cell * 0.2], [(ax + bx) / 2 + cell / 2, Math.min(ay, by) + 2], [bx + cell / 2, by + cell * 0.2]], { role: "q1", width: 2.5 });
    }
    if (end && s.done) { const [x, y] = xy(s.pick); P.tick(c, x + cell / 2, y + cell * 0.82, 20, 1); }
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (clock) drawClockGoal(c);
    else if (p.goal === "trip") drawTrip(c);
    else if (p.goal === "podium") drawRace(c);
    else drawDays(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("ghadi.again");
    switch (p.goal) {
      case "hands": return W("ghadi.goal.hands");
      case "arrive": return W("ghadi.goal.arrive");
      case "leave": return W("ghadi.goal.leave");
      case "trip": return W("ghadi.goal.trip");
      case "podium": return W("ghadi.goal.podium");
      case "days": return p.weeks ? W(p.ahead >= 14 ? "ghadi.goal.week2" : "ghadi.goal.week1", { d: p.ahead % 7 }) : W("ghadi.goal.days", { n: p.ahead });
    }
  }
  // no readout of the child's clock, the trip or the order: reading them IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (clock) {
      out.push({ id: "back5", label: "↺ 5", aria: "turn the minute hand back 5 minutes", kind: "pad", group: "turn", onPress: () => act({ kind: "wind", by: -5 }) });
      out.push({ id: "on5", label: "↻ 5", aria: "turn the minute hand on 5 minutes", kind: "pad", group: "turn", onPress: () => act({ kind: "wind", by: 5 }) });
    }
    if (p.goal === "trip") {
      const tk = (h0: number, m0: number) => act({ kind: "ticket", h: clamp(h0, 0, TICKET_H), m: clamp(m0, 0, TICKET_M) });
      out.push({ id: "h-", label: `− ${W("ghadi.h")}`, aria: "one hour less", kind: "pad", group: "ticket", disabled: s.th <= 0, onPress: () => tk(s.th - 1, s.tm) });
      out.push({ id: "h+", label: `+ ${W("ghadi.h")}`, aria: "one hour more", kind: "pad", group: "ticket", disabled: s.th >= TICKET_H, onPress: () => tk(s.th + 1, s.tm) });
      out.push({ id: "m-", label: `− 5 ${W("ghadi.min")}`, aria: "five minutes less", kind: "pad", group: "ticket", disabled: s.tm < 5, onPress: () => tk(s.th, s.tm - 5) });
      out.push({ id: "m+", label: `+ 5 ${W("ghadi.min")}`, aria: "five minutes more", kind: "pad", group: "ticket", disabled: s.tm + 5 > TICKET_M, onPress: () => tk(s.th, s.tm + 5) });
      ready = ready && s.th * 60 + s.tm > 0;
    }
    if (p.goal === "podium") ready = ready && s.order.every((l) => l >= 0);
    if (p.goal === "days") ready = ready && s.pick > 0;
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const runKey = p.goal === "hands" ? "ghadi.ring" : p.goal === "days" ? "ghadi.hop" : "ghadi.go";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
