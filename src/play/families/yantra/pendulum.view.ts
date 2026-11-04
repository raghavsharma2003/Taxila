// Yantra · pendulum, the 2D view (round 7 E6). A thread hangs from a beam; the bob is held pulled aside at its release angle
// (a faint ghost marks the side it starts from). Beside it the target: the mela drum or the clock-tower bell. RUN lets the
// bob go and it swings in real time, θ(t) = θ0 cos(2πt / T) with the law's own T = 2π√(L/g), while the drum beats every
// T* (a pulse and a tick on each beat). Nothing is told before the eye has seen it: the verdict appears after two beats.
// After a miss the strip at the bottom lays the two rhythms side by side ("thaap har 1.40 s" over "pendulum lagbhag
// 1.12 s"), dots on one time line; a run after a bob change shows the same dots as before (that is the lesson).
// The thread's length is set with ± pads or by dragging the bob up / down (snapped to 5 cm on release); the bob and the pull
// with ± pads. Oscillation: "let go", then "one more" (or a tap anywhere on the world) each time the bob comes back to its
// start side; a stopwatch runs from the release (a measuring tool, never a limit). No timer ends or rushes anything.
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { BOBS, LEN, SWINGS, periodOf, type Knob, type PendulumParams, type PendulumState } from "./pendulum.logic.ts";

const RAD = Math.PI / 180;
const SIN20 = Math.sin(20 * RAD);

export const makePendulumView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<PendulumParams, PendulumState, YantraAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, match = p.goal === "match", beat = p.beat ?? 1, n = p.n ?? 5;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, `yantra.pendulum.${k}` as WordKey, v);
  const st = () => ctl.state;
  // the side the bob is held on: −1 left, +1 right
  const side = p.side === "right" ? 1 : -1;
  let w = 300, h = 440, px = 110, py = 50, k = 1.8, tx = 230, ty = 200, stripY = 360, worldBot = 350;
  // the run being animated (api.t at the release, its period, pull and length) and the clock of the target's beats
  let runAt = -1, runT = 1, runSwing = 10, runLen = p.length, runEnd = 0;
  let introAt = -1, lastBeat = -1, lastBack = -1, nextBeat = 1, nextBack = 1;
  // what the last run showed (revealed after two beats) and the oscillation verdict
  let revealAt = -1, shownT: number | null = null, outcome: "solved" | "miss" | "mal" | null = null, outFacts: Record<string, string | number> = {};
  let goodPending = false;
  let drag = false, dragLen: number | null = null;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    stripY = h - clamp(h * 0.2, 78, 110);
    worldBot = stripY - 10;
    py = 54;
    px = clamp(w * 0.4, 96, w * 0.5);
    // the longest thread fits the world's height and its widest swing the room left of the target
    k = Math.min((worldBot - py - 28) / LEN.max, (px - 24) / (LEN.max * SIN20 + 14), 4);
    tx = clamp(w * 0.8, px + LEN.max * k * SIN20 + 46, w - 40);
    ty = clamp(py + (worldBot - py) * 0.42, py + 50, worldBot - 60);
  }
  const act = (a: YantraAct) => { ctl.dispatch(a); deps.changed(); };
  const lenNow = () => (dragLen ?? st().k.length);
  /** the thread's angle now, degrees (0 = hanging straight down; the sign is the side) */
  function angle(): number {
    const s = st();
    if (runAt < 0) return side * s.k.swing;
    const t = api.t - runAt;
    let amp = runSwing;
    if (t > runEnd) amp *= Math.exp(-(t - runEnd) / 1.2);   // the run is over: the swing dies away (the period never changes)
    return side * amp * Math.cos((2 * Math.PI * t) / runT);
  }
  const bobR = (m: number) => 7 + 4.2 * Math.cbrt(m / 20);
  function bobAt(len: number, deg: number): [number, number] { const L = len * k; return [px + Math.sin(deg * RAD) * L, py + Math.cos(deg * RAD) * L]; }

  function startRun(): void {
    const s = st();
    runAt = api.t; runLen = match ? s.k.length : p.length; runT = periodOf(runLen); runSwing = s.k.swing;
    runEnd = match ? Math.max(4 * Math.max(runT, beat), 6) : (n + 2) * runT + 3;
    nextBeat = 1; nextBack = 1; lastBeat = match ? api.t : -1; lastBack = -1;
    revealAt = match ? runAt + 2 * Math.max(runT, beat) : -1;
    outcome = null; goodPending = false;
    if (match) api.sfx("tick");
  }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    if (last?.kind === "set") api.sfx(refused ? "refuse" : "slide");
    if (last?.kind === "run" && !refused) startRun();
    if (last?.kind === "count") api.sfx(refused ? "refuse" : "tap");
    if (last?.kind === "undo") { runAt = -1; revealAt = -1; outcome = null; shownT = null; api.sfx("tap"); }
    for (const m of ms) {
      if (m.kind === "solved") { outcome = "solved"; goodPending = true; }
      if (m.kind === "misconception_consequence") outcome = "mal";
      if (m.kind === "law_refused" || m.kind === "near_miss") outcome = "miss";
      if (m.kind !== "first_act") outFacts = m.facts;
    }
    if (!match && outcome) { revealAt = api.t; runEnd = Math.min(runEnd, api.t - runAt + 2 * runT); }
    api.invalidate(); deps.changed();
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done) return;
    if (!match) {
      if (kind === "down" && s.live && runAt >= 0 && api.hit(x, y) === "world") act({ kind: "count", at: Math.round((api.t - runAt) * 100) / 100 });
      return;
    }
    if (kind === "down" && api.hit(x, y) === "bob") { drag = true; ctl.finger(true); runAt = -1; dragLen = s.k.length; api.sfx("select"); }
    else if (kind === "move" && drag) dragLen = clamp(Math.round((y - py) / k / LEN.step) * LEN.step, LEN.min, LEN.max);
    else if ((kind === "up" || kind === "cancel") && drag) {
      drag = false; ctl.finger(false);
      const L = dragLen; dragLen = null;
      if (L !== null && L !== s.k.length) act({ kind: "set", knob: "length", value: L });
    }
    api.invalidate();
  }
  function update(): void {
    if (introAt < 0) { introAt = api.t; lastBeat = api.t; if (match) api.sfx("tick"); }
    // the target's beat: three beats when the level opens, then with every run
    const t0 = runAt >= 0 && match ? runAt : introAt;
    const span = runAt >= 0 && match ? runEnd : 3 * beat;
    if (match && api.t - t0 >= nextBeat * beat && nextBeat * beat <= span) { lastBeat = t0 + nextBeat * beat; nextBeat++; api.sfx("tick"); }
    // the bob back on its start side: a flash on the ghost
    if (runAt >= 0 && api.t - runAt >= nextBack * runT && nextBack * runT <= runEnd) { lastBack = runAt + nextBack * runT; nextBack++; }
    if (revealAt >= 0 && api.t >= revealAt && match && st().lastT !== null && shownT !== st().lastT) shownT = st().lastT;
    if (goodPending && revealAt >= 0 && api.t >= revealAt) {
      goodPending = false; api.sfx("good");
      const [bx, by] = bobAt(runLen, angle());
      api.fx.burst(bx, by, { n: 14, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
    }
    // a run rests after its swing dies; an oscillation release stays up while the law still takes presses
    if (runAt >= 0 && api.t - runAt > runEnd + 5 && (match || !st().live || api.t - runAt > (n + 3) * runT + 5)) runAt = -1;
  }
  const busy = () => drag || runAt >= 0 || (introAt >= 0 && api.t - introAt < 3 * beat + 0.4) || goodPending || (revealAt >= 0 && api.t < revealAt + 0.4);
  const revealed = () => revealAt >= 0 && api.t >= revealAt;

  function drawTarget(c: CanvasRenderingContext2D): void {
    const P = api.P, since = lastBeat >= 0 ? api.t - lastBeat : 9, pulse = Math.exp(-since / 0.14);
    if (p.ctx === "drum") {
      const rw = 34 * (1 + 0.08 * pulse), rh = 12;
      P.body(c, tx - 32, ty, 64, 52, { role: "q2", r: 6 });
      c.save(); c.fillStyle = P.color("panel"); c.strokeStyle = P.color("ink2"); c.lineWidth = 2;
      c.beginPath(); c.ellipse(tx, ty, rw, rh, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
      P.stroke(c, [[tx + 30, ty - 40 + 14 * pulse], [tx + 6, ty - 4]], { role: "ink2", width: 3 });
    } else {
      const swingB = 8 * pulse * Math.sin(since * 30);
      P.body(c, tx - 40, ty - 56, 80, 12, { role: "q3", r: 3 });
      c.save(); c.translate(tx, ty - 44); c.rotate(swingB * RAD);
      c.fillStyle = P.color("q2"); c.strokeStyle = P.color("ink2"); c.lineWidth = 2;
      c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-14, 30, -30, 50); c.lineTo(30, 50); c.quadraticCurveTo(14, 30, 10, 0); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    if (pulse > 0.05) P.circle(c, tx, ty + 6, 44 + 18 * (1 - pulse), { role: "q4", width: 2, alpha: pulse * 0.8 });
    P.text(c, W("every", { t: beat.toFixed(2) }), tx, ty + 76, { size: 16, role: "ink", weight: 700, font: "mono" });
  }
  function drawRuler(c: CanvasRenderingContext2D): void {
    if (p.marks === 3) return;
    const P = api.P, x = 18;
    P.stroke(c, [[x, py], [x, py + LEN.max * k]], { role: "ink3", width: 1.5, alpha: 0.7 });
    for (let cm = 0; cm <= LEN.max; cm += 10) {
      const y = py + cm * k, big = cm % 50 === 0;
      P.stroke(c, [[x, y], [x + (big ? 10 : 6), y]], { role: "ink3", width: big ? 2 : 1, alpha: 0.7 });
      if (p.marks === 1 && big && cm > 0) P.text(c, String(cm), x + 14, y, { size: 14, role: "ink2", font: "mono", align: "left" });
    }
  }
  function drawPendulum(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), len = runAt >= 0 ? runLen : lenNow(), mass = s.k.mass, sw = runAt >= 0 ? runSwing : s.k.swing;
    // the beam the thread hangs from
    P.body(c, px - 46, py - 14, 92, 12, { role: "q3", r: 3 });
    // the start side: a faint ghost of the held bob (it flashes when the bob comes back to it)
    const [gx, gy] = bobAt(len, side * sw), back = lastBack >= 0 ? Math.exp(-(api.t - lastBack) / 0.2) : 0;
    P.stroke(c, [[px, py], [gx, gy]], { role: "ink3", width: 1, dash: [4, 4], alpha: 0.5 });
    P.circle(c, gx, gy, bobR(mass) + 4, { role: back > 0.05 ? "q4" : "ink3", width: 2 + 2 * back, alpha: 0.45 + 0.5 * back });
    P.stroke(c, [[px, py], [px, py + len * k + 8]], { role: "ink3", width: 1, dash: [2, 6], alpha: 0.4 });
    const [bx, by] = bobAt(len, angle());
    P.stroke(c, [[px, py], [bx, by]], { role: "ink", width: 2 });
    P.circle(c, px, py, 4, { role: "ink", fill: true });
    P.circle(c, bx, by, bobR(mass), { role: "q1", fill: true, width: 2 });
    P.text(c, `${mass} g`, bx + bobR(mass) + 24, by, { size: 14, role: "ink2", font: "mono" });
    if (drag || dragLen !== null) P.chip(c, `${len} cm`, bx, by - bobR(mass) - 22, { size: 16, role: "you" });
    if (match && !s.done) api.target("bob", bx - 26, by - 26, 52, 52);
    if (match && revealed() && outcome === "solved") P.tick(c, bx, by - bobR(mass) - 22, 22, clamp((api.t - revealAt) / 0.3, 0, 1));
  }
  /** the two rhythms side by side: dots on one time line */
  function drawStrip(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), x0 = 104, x1 = w - 14, y1 = stripY + 20, y2 = stripY + 54;
    P.stroke(c, [[10, stripY], [w - 10, stripY]], { role: "ink3", width: 1, alpha: 0.4 });
    const rows: { label: string; v: string; dt: number; role: "q2" | "q1" | "look" }[] = [];
    let span = 0;
    if (match) {
      rows.push({ label: W("beat"), v: `${beat.toFixed(2)} s`, dt: beat, role: "q2" });
      if (shownT !== null) rows.push({ label: W("yours"), v: W("about", { t: shownT.toFixed(2) }), dt: shownT, role: outcome === "solved" ? "q1" : "look" });
      span = 4 * Math.max(beat, shownT ?? 0);
    } else {
      const T = periodOf(p.length), clock = runAt >= 0 && s.live ? api.t - runAt : s.taps.length ? s.taps[s.taps.length - 1] : 0;
      P.text(c, `${clock.toFixed(1)} s`, w - 16, py + 24, { size: 22, role: "ink", font: "mono", weight: 700, align: "right" });
      span = (n + 0.5) * T;
      if (revealed() && outcome) {
        rows.push({ label: W("yours"), v: `${n}`, dt: T, role: "q2" });
        const last = s.taps[s.taps.length - 1] ?? 0;
        const msg = outcome === "solved" ? W("counted", { n, s: last.toFixed(1), t: (last / n).toFixed(2) })
          : outcome === "mal" ? W("real", { r: String(outFacts.real ?? "") }) : "";
        if (msg) P.textFit(c, msg, w / 2, stripY + 58, w - 24, 40, { size: 15, role: outcome === "solved" ? "ink" : "look", weight: 700 });
      }
    }
    if (!span) return;
    const X = (t: number) => x0 + ((x1 - x0) * t) / span;
    rows.forEach((r, i) => {
      const y = i ? y2 : y1;
      P.text(c, r.label, 12, y - 8, { size: 14, role: "ink2", weight: 700, align: "left" });
      P.text(c, r.v, 12, y + 9, { size: 14, role: r.role === "look" ? "look" : "ink", font: "mono", weight: 700, align: "left" });
      P.stroke(c, [[x0, y], [x1, y]], { role: "ink3", width: 1, alpha: 0.5 });
      for (let t = 0; t <= span + 1e-6; t += r.dt) P.circle(c, X(t), y, 5, { role: r.role, fill: true, width: 1.5 });
    });
    if (!match && revealed() && outcome) {
      // the presses under the real returns
      for (const at of s.taps) if (at <= span) P.stroke(c, [[X(at), y1 + 12], [X(at), y1 + 26]], { role: outcome === "solved" ? "good" : "look", width: 3 });
    }
    if (match && shownT !== null && outcome !== "solved") P.magnifier(c, w - 24, y2 - 2, 20);
  }
  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P;
    P.textFit(c, W(`ctx.${p.ctx}`), w / 2, 16, w - 24, 24, { size: 16, role: "ink2", weight: 700 });
    const s = st();
    if (!match && s.live && !s.done && runAt >= 0) api.target("world", 0, py - 20, w, worldBot - py + 20);
    drawRuler(c);
    if (match) drawTarget(c);
    drawPendulum(c);
    drawStrip(c);
  }

  function goal(): string { return match ? W("goal.match", { t: beat.toFixed(2) }) : W("goal.oscillation", { n }); }
  const readouts = (): Readout[] => {
    const s = st();
    // two readouts: three squeezed the goal line on phones (forge3 Q2/Q3 at p360 / p412); the pull is seen on the bob itself
    return [{ k: W("length"), v: `${lenNow()} cm` }, { k: W("mass"), v: `${s.k.mass} g` }];
  };
  function step<T extends number>(xs: readonly T[], cur: number, d: number): number | null { const i = xs.indexOf(cur as T) + d; return i >= 0 && i < xs.length ? xs[i] : null; }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    if (!match) {
      return [
        { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
        { id: "run", label: W("release"), kind: s.live ? "secondary" : "primary", group: "go", you: !s.live, onPress: () => act({ kind: "run" }) },
        { id: "count", label: W("count", { k: s.taps.length + 1 }), aria: "count one oscillation", kind: "primary", group: "count", you: s.live && runAt >= 0, disabled: !s.live || runAt < 0, onPress: () => act({ kind: "count", at: Math.round((api.t - runAt) * 100) / 100 }) },
      ];
    }
    const lens = Array.from({ length: (LEN.max - LEN.min) / LEN.step + 1 }, (_, i) => LEN.min + i * LEN.step);
    const pad = (id: string, knob: Knob, label: string, aria: string, v: number | null): ControlSpec =>
      ({ id, label, aria, kind: "pad", group: knob, disabled: v === null, onPress: () => { if (v !== null) { runAt = -1; act({ kind: "set", knob, value: v }); } } });
    return [
      pad("len-down", "length", `${W("length")} −`, "shorter thread", step(lens, s.k.length, -1)),
      pad("len-up", "length", `${W("length")} +`, "longer thread", step(lens, s.k.length, 1)),
      pad("mass-down", "mass", `${W("mass")} −`, "lighter bob", step(BOBS, s.k.mass, -1)),
      pad("mass-up", "mass", `${W("mass")} +`, "heavier bob", step(BOBS, s.k.mass, 1)),
      pad("swing-down", "swing", `${W("swing")} −`, "smaller pull", step(SWINGS, s.k.swing, -1)),
      pad("swing-up", "swing", `${W("swing")} +`, "bigger pull", step(SWINGS, s.k.swing, 1)),
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("run"), kind: "primary", group: "go", you: true, onPress: () => act({ kind: "run" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => drag };
  return view;
};
