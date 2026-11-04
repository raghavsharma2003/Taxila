// Vakya-rail · the 2D view (round 7). The task (the kit item's prompt) is the goal line: real DOM text, so it wraps and
// Devanagari shapes. The world: a track (one, two or more rows on a narrow screen; the train wraps like a line of text)
// with the engine waiting at its start and a signal at its end, and a yard of loose word wagons below. Every wagon looks
// the same (a distractor is never marked); a form wagon carries a turntable mark and the count of its forms, never which
// one is right. Drag a wagon onto the track to couple it at that place (a caret shows where); drag a coupled wagon back
// to the yard to uncouple it. A tap turns a form wagon to its next form; a tap on a plain wagon couples it at the end (from
// the yard) or sends it back (from the track). RUN: the train rolls to the signal. Through: the lamp shows the tick.
// Stopped: the train halts with a jolt, the first wrong wagon sparks and keeps the "look" mark (never the fix), and the
// wagons behind it roll back to the yard. Wagon text is drawn through the painter (≥ 14 px; Devanagari through the
// direction's Devanagari face); every touch target is ≥ 44 px. All motion is a pure function of api.t.
import type { Moment, VakyaAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import type { VakyaParams, VakyaState, VakyaWagon } from "./vakya.logic.ts";

const WH = 48;            // wagon body height (a touch target ≥ 44 px)
const ROW_T = 74;         // a track row: wagon + wheels + rails + gap
const ROW_Y = 58;         // a yard row
const GAP = 8;            // between wagons (the coupler gap on the track)
const TWEEN = 0.26;       // s, a wagon gliding to its new place
const RUN_S = 0.9;        // s, the train rolling to the signal
const FONT = 16;
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
type Box = { x: number; y: number; w: number; h: number };

export const makeVakyaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<VakyaParams, VakyaState, VakyaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let w = 300, h = 440;
  // geometry of the last placement (pointer drops are computed against it)
  let trackTop = 0, trackBottom = 0, yardTop = 0, engineBox: Box = { x: 0, y: 0, w: 0, h: 0 }, signal = { x: 0, y: 0 };
  const target = new Map<string, Box>();          // where each wagon belongs now
  const glide = new Map<string, { x0: number; y0: number; t0: number }>();   // where it is coming from
  const shown = new Map<string, [number, number]>();
  let drag: { id: string; dx: number; dy: number; x0: number; y0: number; moved: boolean } | null = null;
  let finger: [number, number] = [0, 0];
  let ranAt = -1, ranOk = false, sparkAt = -1, sparked = true, sparkIdx: number | null = null;
  const widths = new Map<string, number>();
  const deva = (s: string) => /[ऀ-ॿ]/.test(s);

  const wagonOf = (id: string) => p.wagons.find((x) => x.id === id) as VakyaWagon;
  const faceOf = (id: string) => { const wg = wagonOf(id); return wg.forms[st().face[id] ?? 0] ?? wg.forms[0]; };
  function textW(c: CanvasRenderingContext2D, s: string): number {
    const k = `${s}|${api.art.id}`;
    let v = widths.get(k);
    if (v === undefined) { c.save(); c.font = `700 ${FONT}px ${deva(s) ? api.art.font.deva : api.art.font.ui}`; v = c.measureText(s).width; c.restore(); widths.set(k, v); }
    return v;
  }
  /** a wagon's width: its widest form (it never resizes when turned, so the turn tells nothing by its size) */
  const wagonW = (c: CanvasRenderingContext2D, wg: VakyaWagon) => clamp(Math.max(...wg.forms.map((f) => textW(c, f))) + (wg.forms.length > 1 ? 40 : 24), 56, w - 40);

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  /** places the engine, the coupled wagons (wrapping into rows) and the yard; records every target */
  function place(c: CanvasRenderingContext2D): void {
    const s = st(), pad = 12, sigW = 30, right = w - pad - sigW;
    const engW = p.engine ? clamp(textW(c, p.engine) + 44, 72, w * 0.5) : 64;
    trackTop = 10;
    let x = pad, row = 0;
    engineBox = { x, y: trackTop + 6, w: engW, h: WH };
    x += engW + GAP;
    const rowY = (r: number) => trackTop + r * ROW_T + 6;
    for (const id of s.train) {
      const ww = wagonW(c, wagonOf(id));
      if (x + ww > right && x > pad) { row++; x = pad; }
      setTarget(id, { x, y: rowY(row), w: ww, h: WH });
      x += ww + GAP;
    }
    // the free end of the track (where a dropped wagon couples last); it may sit at the start of a new row
    const endRoom = 60;
    if (x + endRoom > right) { row++; x = pad; }
    signal = { x: right + sigW / 2, y: rowY(row) + WH / 2 };
    trackBottom = rowY(row) + WH + 20;
    lastEnd = { x, y: rowY(row), row };
    rowsUsed = row + 1;
    // the yard
    yardTop = trackBottom + 18;
    let yx = pad, yr = 0;
    for (const wg of p.wagons) {
      if (s.train.includes(wg.id)) continue;
      const ww = wagonW(c, wg);
      if (yx + ww > w - pad && yx > pad) { yr++; yx = pad; }
      setTarget(wg.id, { x: yx, y: yardTop + 26 + yr * ROW_Y, w: ww, h: WH }, true);
      yx += ww + GAP;
    }
    yardRows = yr + 1;
  }
  let lastEnd = { x: 0, y: 0, row: 0 }, rowsUsed = 1, yardRows = 1;
  function setTarget(id: string, b: Box, toYard = false): void {
    const old = target.get(id);
    if (old && (Math.abs(old.x - b.x) > 0.5 || Math.abs(old.y - b.y) > 0.5)) {
      const cur = shown.get(id) ?? [old.x, old.y];
      // a wagon the stopped train drops rolls with it first, then glides back to the yard
      glide.set(id, { x0: cur[0], y0: cur[1], t0: toYard ? Math.max(api.t, holdUntil) : api.t });
    }
    target.set(id, b);
  }
  let holdUntil = -1;
  /** the train's roll on RUN (px to the right), a pure function of api.t */
  function roll(): number {
    if (ranAt < 0 || api.reduced) return 0;
    const u = (api.t - ranAt) / RUN_S;
    if (ranOk) return 26 * ease(u);
    // stopped: a short roll, the jolt, then the train eases back to its place on the track
    return u < 1 ? 18 * ease(u) : u < 1.5 ? 18 * (1 - ease((u - 1) / 0.5)) : 0;
  }
  function posOf(id: string): [number, number] {
    const b = target.get(id) as Box, g = glide.get(id);
    if (drag?.id === id && drag.moved) return [finger[0] - drag.dx, finger[1] - drag.dy];
    let x = b.x, y = b.y;
    if (g && !api.reduced) {
      const u = (api.t - g.t0) / TWEEN;
      if (u < 0) { x = g.x0; y = g.y0; } else if (u < 1) { x = g.x0 + (b.x - g.x0) * ease(u); y = g.y0 + (b.y - g.y0) * ease(u); } else glide.delete(id);
    }
    if (st().train.includes(id) && !(g && api.t < g.t0 + TWEEN)) x += roll();
    shown.set(id, [x, y]);
    return [x, y];
  }

  const act = (a: VakyaAct) => { ctl.dispatch(a); deps.changed(); };
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as VakyaAct | undefined;
    if (!last) return;
    if (last.kind === "couple") api.sfx(refused ? "refuse" : "land");
    if (last.kind === "uncouple") api.sfx(refused ? "refuse" : "slide");
    if (last.kind === "turn") api.sfx(refused ? "refuse" : "tick");
    if (last.kind === "undo") { ranAt = -1; sparkIdx = null; api.sfx("tap"); }
    if (last.kind === "run") {
      if (refused === "build_first") { api.sfx("refuse"); api.fx.shake(1.5); }
      else {
        ranAt = api.t; ranOk = ms.some((m) => m.kind === "solved"); sparkAt = api.t + (api.reduced ? 0 : RUN_S); sparked = false;
        sparkIdx = st().spark;
        api.sfx(ranOk ? "slide" : "tilt");
        // the wagons behind the spark roll with the train, then glide back to the yard (setTarget holds them until then)
        holdUntil = sparkAt;
      }
    }
    for (const m of ms) if (m.kind === "misconception_consequence" || m.kind === "law_refused") api.sfx("look");
    api.invalidate(); deps.changed();
  }
  function update(): void {
    if (!sparked && ranAt >= 0 && api.t >= sparkAt) {
      sparked = true;
      if (ranOk) { api.sfx("good"); api.fx.burst(signal.x, signal.y, { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" }); }
      else {
        api.fx.shake(2.5);
        const [x, y] = sparkPoint();
        api.fx.burst(x, y, { n: 12, color: api.P.color("look"), speed: 120, life: 0.45, size: 2.5, kind: "spark" });
      }
    }
  }
  /** the centre of the wagon that sparked (or the empty place after the last one, when the train was too short) */
  function sparkPoint(): [number, number] {
    const s = st(), i = sparkIdx ?? s.spark;
    if (i === null) return [signal.x, signal.y];
    const wi = i - (p.engine ? 1 : 0);
    if (wi < 0) return [engineBox.x + engineBox.w / 2, engineBox.y + WH / 2];
    const id = s.train[wi];
    if (!id) return [lastEnd.x + 24, lastEnd.y + WH / 2];
    const b = target.get(id) as Box;
    return [b.x + b.w / 2 + roll(), b.y + WH / 2];
  }

  // ── input
  function insertAt(x: number, y: number): number {
    const s = st(), rows = s.train.filter((id) => id !== drag?.id).map((id) => target.get(id) as Box);
    for (let i = 0; i < rows.length; i++) {
      const b = rows[i], rowOf = Math.floor((b.y - trackTop) / ROW_T), fr = Math.floor((y - trackTop) / ROW_T);
      if (fr < rowOf || (fr === rowOf && x < b.x + b.w / 2)) return i;
    }
    return rows.length;
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    if (kind === "down") {
      const id = api.hit(x, y);
      if (id?.startsWith("wg:")) {
        const wid = id.slice(3), [bx, by] = shown.get(wid) ?? [x, y];
        drag = { id: wid, dx: x - bx, dy: y - by, x0: x, y0: y, moved: false }; finger = [x, y]; ctl.finger(true);
        api.sfx("select"); api.invalidate();
      }
      return;
    }
    if (!drag) return;
    if (kind === "move") { finger = [x, y]; if (Math.hypot(x - drag.x0, y - drag.y0) > 8) drag.moved = true; api.invalidate(); return; }
    const d = drag; drag = null; ctl.finger(false);
    const onTrack = st().train.includes(d.id), wg = wagonOf(d.id);
    if (kind === "up" && !d.moved) {
      if (wg.forms.length > 1) act({ kind: "turn", wagon: d.id, form: ((st().face[d.id] ?? 0) + 1) % wg.forms.length });
      else if (onTrack) act({ kind: "uncouple", wagon: d.id });
      else act({ kind: "couple", wagon: d.id, at: st().train.length });
    } else if (kind === "up") {
      // the wagon is where the finger let go: no glide from its old place
      target.set(d.id, { ...(target.get(d.id) as Box), x: finger[0] - d.dx, y: finger[1] - d.dy });
      if (y < trackBottom + 8) {
        const at = insertAt(x, y);
        if (!(onTrack && st().train.indexOf(d.id) === at)) act({ kind: "couple", wagon: d.id, at });
      } else if (onTrack) act({ kind: "uncouple", wagon: d.id });
    }
    api.invalidate(); deps.changed();
  }

  // ── drawing
  function rails(c: CanvasRenderingContext2D): void {
    const P = api.P;
    for (let r = 0; r < rowsUsed; r++) {
      const y = trackTop + r * ROW_T + 6 + WH + 12;
      P.stroke(c, [[6, y], [w - 6, y]], { role: "ink3", width: 2 });
      P.stroke(c, [[6, y + 5], [w - 6, y + 5]], { role: "ink3", width: 2 });
      for (let x = 10; x < w - 6; x += 18) P.stroke(c, [[x, y - 2], [x + 6, y + 7]], { role: "ink3", width: 1.5, alpha: 0.5 });
    }
  }
  function wheels(c: CanvasRenderingContext2D, x: number, y: number, ww: number): void {
    const P = api.P, r = 6;
    P.circle(c, x + 13, y + WH + 5, r, { role: "ink2", fill: true });
    P.circle(c, x + ww - 13, y + WH + 5, r, { role: "ink2", fill: true });
  }
  function drawEngine(c: CanvasRenderingContext2D): void {
    const P = api.P, b = engineBox, rx = roll();
    const x = b.x + rx;
    P.body(c, x, b.y, b.w, WH, { role: "q3", r: 8, seed: 3 });
    P.body(c, x + 6, b.y - 12, 12, 14, { role: "q3", r: 3, seed: 4 });       // the chimney
    if (ranAt >= 0 && !api.reduced && api.t - ranAt < RUN_S) for (let k = 0; k < 3; k++) {
      const u = ((api.t - ranAt) * 1.6 + k / 3) % 1;
      P.circle(c, x + 12 - u * 18, b.y - 16 - u * 22, 4 + u * 6, { role: "ink3", fill: true, alpha: 0.4 * (1 - u) });
    }
    if (p.engine) P.text(c, p.engine, x + b.w / 2 + 6, b.y + WH / 2, { size: FONT, on: "q3", weight: 700, maxW: b.w - 20 });
    wheels(c, x, b.y, b.w);
  }
  function drawWagon(c: CanvasRenderingContext2D, id: string, onTrack: boolean, lifted: boolean): void {
    const P = api.P, wg = wagonOf(id), b = target.get(id) as Box, [x, y] = posOf(id);
    const s = st(), i = s.train.indexOf(id) + (p.engine ? 1 : 0);
    const sparkHere = onTrack && s.spark !== null && i === s.spark && (api.reduced || ranAt < 0 || api.t >= sparkAt);
    api.target(`wg:${id}`, x, y, b.w, WH);
    P.body(c, x, y, b.w, WH, { role: "q1", r: 7, lift: lifted ? 6 : 0, state: sparkHere ? "look" : lifted ? "selected" : "idle", seed: id.charCodeAt(1) * 13 });
    const face = faceOf(id), turn = wg.forms.length > 1;
    P.text(c, face, x + (turn ? (b.w - 16) / 2 : b.w / 2), y + WH / 2 - (lifted ? 2 : 0), { size: FONT, on: "q1", weight: 700, maxW: b.w - (turn ? 30 : 12) });
    if (turn) {
      // the turntable: a ring with one dot per form (which one is right is never shown)
      const cx = x + b.w - 14, cy = y + WH / 2;
      P.circle(c, cx, cy, 8, { role: "ink", width: 1.6 });
      P.stroke(c, [[cx + 5, cy - 9], [cx + 9, cy - 6], [cx + 5, cy - 3]], { role: "ink", width: 1.6 });
      wg.forms.forEach((_f, k) => P.circle(c, cx - 6 + (k * 12) / Math.max(1, wg.forms.length - 1), y + WH - 6, 1.8, { role: k === (s.face[id] ?? 0) ? "ink" : "ink3", fill: true }));
    }
    if (onTrack || lifted) wheels(c, x, y, b.w);
    if (sparkHere) P.magnifier(c, x + b.w - 4, y - 4, 16);
  }
  function drawSignal(c: CanvasRenderingContext2D): void {
    const P = api.P, done = st().done, stopped = st().spark !== null && ranAt >= 0 && api.t >= sparkAt;
    P.stroke(c, [[signal.x, signal.y - 22], [signal.x, signal.y + 30]], { role: "ink2", width: 3 });
    P.circle(c, signal.x, signal.y - 22, 9, { role: done ? "good" : stopped ? "look" : "ink3", fill: true });
    if (done) P.tick(c, signal.x, signal.y - 44, 16, clamp((api.t - sparkAt) / 0.3, 0, 1));
  }
  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    place(c);
    rails(c);
    // the yard: a panel under the track
    const yardH = Math.max(ROW_Y + 30, 30 + yardRows * ROW_Y);
    P.body(c, 6, yardTop, w - 12, Math.min(yardH, h - yardTop - 6), { role: "panel", r: 10 });
    P.text(c, W("vakya.yard"), 18, yardTop + 14, { size: 14, role: "ink3", align: "left", weight: 600 });
    drawEngine(c);
    drawSignal(c);
    for (const id of s.train) if (drag?.id !== id || !drag.moved) drawWagon(c, id, true, false);
    for (const wg of p.wagons) if (!s.train.includes(wg.id) && (drag?.id !== wg.id || !drag.moved)) drawWagon(c, wg.id, false, false);
    // where a dragged wagon would couple
    if (drag?.moved && finger[1] < trackBottom + 8) {
      const at = insertAt(finger[0], finger[1]), rest = s.train.filter((id) => id !== drag?.id);
      const b = rest[at] ? (target.get(rest[at]) as Box) : null;
      const cx = b ? b.x - GAP / 2 : rest.length ? (target.get(rest[rest.length - 1]) as Box).x + (target.get(rest[rest.length - 1]) as Box).w + GAP / 2 : engineBox.x + engineBox.w + GAP / 2;
      const cy = b ? b.y : rest.length ? (target.get(rest[rest.length - 1]) as Box).y : engineBox.y;
      P.stroke(c, [[cx, cy - 4], [cx, cy + WH + 4]], { role: "you", width: 4 });
    }
    if (drag?.moved) drawWagon(c, drag.id, s.train.includes(drag.id), true);
    // the first contact: how to play, in the lesson's language (only before the first act)
    if (!ctl.acts.length && yardTop + 30 + yardRows * ROW_Y + 20 < h) P.textFit(c, W("vakya.hint"), w / 2, Math.min(h - 22, yardTop + 30 + yardRows * ROW_Y + 10), w - 20, 44, { size: 14, role: "ink2" });
    if (s.done) P.text(c, W("vakya.arrived"), w / 2, Math.min(h - 16, trackBottom + 2), { size: 14, role: "ink2", weight: 700 });
    else if (s.spark !== null && ranAt >= 0 && api.t >= sparkAt) { const [x, y] = sparkPoint(); P.chip(c, W("vakya.stopped"), clamp(x, 70, w - 70), Math.max(14, y - WH / 2 - 14), { size: 14, role: "look", font: "ui" }); }
  }

  const busy = () => !!drag || glide.size > 0 || (ranAt >= 0 && api.t - ranAt < RUN_S * 1.5 + 0.2);
  const goal = () => (lang === "en" ? p.prompt.en : p.prompt.hi || p.prompt.en);
  // no live readout: a running "how many right" would be the answer the signal is there to give
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: !ctl.acts.length, onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("vakya.run"), kind: "primary", group: "go", you: s.train.length > 0, disabled: !s.train.length, onPress: () => act({ kind: "run" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
