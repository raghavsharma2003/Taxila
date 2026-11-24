// Kyun-Lab · chumbak, the 2D view (round 7, magnets; class 6 science). Nothing here runs on a clock: every change waits for
// the child's tap, and the animations only show what the law has already answered.
//   dhruv/sira   the cover (a pencil case, a noticeboard, a pencil box) standing up the stage, seven spots down it. Tap a spot:
//                the pin touches it and the pins that cling hang beside it. Tap the ring left of a touched spot to flag a
//                pole; "Lift" shows the magnet under it and the filings crowding its two ends.
//   dhruv/jodo   the toy train on its track: the engine and the carriages, a magnet across each (N at one end, S at the
//                other; look 3 hides the letters). Tap a carriage to turn it round; "Push" runs them together: a joint whose
//                poles differ couples, one whose poles match is pushed apart (arrows) and the magnifier sits on it.
//   dhruv/pakka  the marked magnet across the top (the pole she holds out is the lit one: "N end" / "S end" below); the bars
//                that look alike in rows. Tap a bar's end: her pole comes to it and the bar's end is pulled or pushed (the
//                answer stays written by that end). "Magnet: A" says which bar she thinks it is.
//   dhruv/todo   the whole magnet as it was (N … S) on top, the pieces it snapped into, one per row with a tag at each end.
//                "Label" mode: a tap on a tag steps it N → S → no pole; "Test N" / "Test S": the tap brings that pole of her
//                marked magnet to the end and writes pull or push by it.
//   dhruv/taakat the kit's two magnets over a tray of pins; tap one to dip it and lift: its pins hang from it, counted.
//   disha        the ground seen from above (turned by the level, so screen-up is not north), the landmarks at its four
//                sides. latkao: the hung bar magnet in the middle (held, or hanging free), the paper map in the corner with its
//                N arrow; the arrows below turn the magnet in her hand and the map. ghoomo / loha: she stands in the middle
//                holding the compass (her head is the way she faces); the arrows below turn HER (the box turns with her) or
//                the BOX in her hands; the letter in front of her is lit. loha: the steel almirah / iron table / magnet
//                beside her pulls the needle; "Walk away" takes her off it.
// After a wrong answer only magnifiers mark what to look at again (never the key, never a cross).
import type { ChumbakAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Material, Role } from "../../core/styles.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { DIRS, KIT_PINS, SPOTS, barPole, carPoles, chumbakHelpers, jointsOf, letterAhead, needleAt, piecePole, pinsAt, polesOf, printed, sizeAt, type ChumbakParams, type ChumbakState } from "./chumbak.logic.ts";

const HOLD = 1.6;   // s: the stage keeps drawing after an act (the last beat lands inside it)
/** a stable 0..1 hash (pin and filing places are the level's own, never random per frame) */
const hash = (n: number) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const TAU = Math.PI * 2;
interface Box { x: number; y: number; w: number; h: number }
/** a spring for an angle shown on screen (radians, unwrapped): it swings to its target and settles */
interface Spring { x: number; v: number; to: number }

export const makeChumbakView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<ChumbakParams, ChumbakState, ChumbakAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, g = p.goal;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const rot = p.rot ?? 0;
  let w = 360, h = 420;
  let actAt = -10, doneAt = -10, cheered = false;
  /** the last act as the view shows it */
  let last: { k: string; i: number; end: number } = { k: "", i: -1, end: -1 };
  let pole: "N" | "S" = "N";                     // pakka / todo: the pole she holds out
  let tool: "label" | "N" | "S" = "label";       // todo: what a tap on a tag does
  let down: { x: number; y: number } | null = null;
  // disha: the angles on screen (springs), in quarter turns of the WORLD (the ground's turn is added when drawn)
  const spring = (q: number): Spring => ({ x: q, v: 0, to: q });
  const s0 = st();
  const face = spring(s0.face), box = spring(s0.box), needle = spring(needleAt(p, s0.spot)), twist = spring(s0.twist), map = spring(s0.map);
  /** move a spring's target to the quarter `q` the short way round (the shown angle is unwrapped) */
  const aim = (sp: Spring, q: number) => { let d = ((q - sp.to) % 4 + 4) % 4; if (d > 2) d -= 4; sp.to += d; if (api.reduced) { sp.x = sp.to; sp.v = 0; } };

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: ChumbakAct) => {
    last = { k: a.kind, i: "i" in a ? a.i : "at" in a ? a.at : -1, end: "end" in a ? a.end : -1 };
    ctl.dispatch(a); deps.changed();
  };
  function react(ms: Moment[], refused: string | undefined): void {
    const s = st(), now = api.t;
    actAt = now;
    aim(face, s.face); aim(box, s.box); aim(needle, needleAt(p, s.spot)); aim(map, s.map);
    // let go: the magnet swings back to north-south from where her hand held it
    if (last.k === "let" && !refused) { twist.to = Math.round(twist.to / 4) * 4; aim(twist, 0); twist.v = api.reduced ? 0 : 2.4; }
    else aim(twist, s.twist);
    if (last.k === "undo") last = { k: "", i: -1, end: -1 };
    for (const m of ms) if (m.kind === "solved") { doneAt = now + 0.5; cheered = false; }
    if (refused === "probed" || refused === "printed" || refused === "dipped" || refused === "here" || refused === "free") api.sfx("refuse");
    else if (refused) { api.sfx("look"); if (!ms.some((m) => m.kind === "misconception_consequence")) api.fx.shake(2); }
    else api.sfx(last.k === "dip" ? "drop" : last.k === "run" ? "slide" : last.k === "near" ? "tilt" : "tap");
    api.invalidate(); deps.changed();
  }
  function update(dt: number): void {
    for (const sp of [face, box, needle, twist, map]) {
      if (api.reduced) { sp.x = sp.to; sp.v = 0; continue; }
      const k = 38, damp = Math.exp(-6.5 * dt);
      sp.v = (sp.v + (sp.to - sp.x) * k * dt) * damp; sp.x += sp.v * dt;
      if (Math.abs(sp.to - sp.x) < 0.002 && Math.abs(sp.v) < 0.01) { sp.x = sp.to; sp.v = 0; }
    }
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      api.fx.burst(w / 2, Math.min(h * 0.3, 140), { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const moving = () => [face, box, needle, twist, map].some((sp) => sp.x !== sp.to || sp.v !== 0);
  const busy = () => api.t - actAt < HOLD || (doneAt >= 0 && api.t - doneAt < 0.8) || moving();
  /** 0..1 along the last act's animation (reduced motion: at once) */
  const prog = (delay = 0, dur = 0.8) => (api.reduced ? 1 : ease.out(clamp((api.t - actAt - delay) / dur, 0, 1)));
  const fresh = (k: string, i = -2) => last.k === k && (i === -2 || last.i === i) && api.t - actAt < HOLD;

  // ── input: taps on release ──
  function tap(x: number, y: number): void {
    const id = api.hit(x, y);
    if (!id || st().done) return;
    const [kind, a, b] = id.split("-");
    const i = Number(a), e = Number(b);
    if (kind === "spot") act({ kind: "probe", at: i });
    else if (kind === "flag") act({ kind: "mark", at: i });
    else if (kind === "car") act({ kind: "flip", i });
    else if (kind === "end") {
      if (g === "todo" && tool === "label") {
        const cur = st().labels[i]?.[e] ?? "", next = cur === "N" ? "S" : cur === "S" ? "-" : "N";
        act({ kind: "label", i, end: e, v: next });
      } else act({ kind: "near", i, end: e, p: g === "todo" ? (tool === "S" ? "S" : "N") : pole });
    } else if (kind === "dip") act({ kind: "dip", i });
    else if (kind === "hold") { pole = a === "S" ? "S" : "N"; api.sfx("select"); api.invalidate(); deps.changed(); }
    else if (kind === "btn") {
      const by = b === "l" ? -1 : 1;
      if (a === "twist") act({ kind: "twist", by });
      else if (a === "spin") act({ kind: "spin", by });
      else if (a === "turn") act({ kind: "turn", by });
      else if (a === "dial") act({ kind: "dial", by });
    }
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind === "down") { down = { x, y }; return; }
    if (kind === "up" && down) { const d = down; down = null; if (Math.hypot(x - d.x, y - d.y) < 14) tap(d.x, d.y); return; }
    if (kind === "cancel") down = null;
  }
  const live = () => !st().done;
  const target = (id: string, b: Box) => { if (live()) api.target(id, b.x, b.y, b.w, b.h); };

  // ── shared drawing ──
  /** a bar magnet: its left half `left` pole, letters on chips when `letters` (a plain iron bar when `iron`) */
  function magnet(c: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, left: "N" | "S" | null, o: { letters?: boolean; iron?: boolean; alpha?: number; jag?: [boolean, boolean] } = {}): void {
    const P = api.P, a = o.alpha ?? 1;
    const jagPath = (gg: CanvasRenderingContext2D, x0: number, x1: number, jl: boolean, jr: boolean) => {
      gg.moveTo(x0, y); gg.lineTo(x1, y);
      if (jr) { gg.lineTo(x1 - 4, y + bh * 0.3); gg.lineTo(x1 + 3, y + bh * 0.55); gg.lineTo(x1 - 3, y + bh * 0.8); } gg.lineTo(x1, y + bh);
      gg.lineTo(x0, y + bh);
      if (jl) { gg.lineTo(x0 + 4, y + bh * 0.7); gg.lineTo(x0 - 3, y + bh * 0.45); gg.lineTo(x0 + 3, y + bh * 0.2); }
      gg.closePath();
    };
    const [jl, jr] = o.jag ?? [false, false];
    if (o.iron || !left) { P.fillPath(c, (gg) => jagPath(gg, x, x + bw, jl, jr), "iron", { outline: "ink2", width: 1.5, alpha: a }); return; }
    const right = left === "N" ? "S" : "N", mat = (q: "N" | "S"): Material => (q === "N" ? "magnetN" : "magnetS");
    P.fillPath(c, (gg) => jagPath(gg, x, x + bw / 2, jl, false), mat(left), { outline: "ink2", width: 1.5, alpha: a });
    P.fillPath(c, (gg) => jagPath(gg, x + bw / 2, x + bw, false, jr), mat(right), { outline: "ink2", width: 1.5, alpha: a });
    if (o.letters !== false) {
      const fs = clamp(bh * 0.55, 14, 16);
      if (bw >= 70) { P.chip(c, left, x + Math.min(18, bw * 0.2), y + bh / 2, { size: fs, font: "ui" }); P.chip(c, right, x + bw - Math.min(18, bw * 0.2), y + bh / 2, { size: fs, font: "ui" }); }
    }
  }
  function pin(c: CanvasRenderingContext2D, x: number, y: number, ang: number, len = 16): void {
    const ex = x + Math.sin(ang) * len, ey = y + Math.cos(ang) * len;
    api.P.stroke(c, [[x, y], [ex, ey]], { role: "ink2", width: 1.6 });
    api.P.circle(c, x, y, 2, { role: "ink2", fill: true, width: 1 });
  }
  /** a push (arrows apart) or a pull (arrows together) drawn about (x, y), horizontal */
  function force(c: CanvasRenderingContext2D, x: number, y: number, r: "push" | "pull", k = 1): void {
    const P = api.P, d = 9 + 6 * k, role: Role = r === "push" ? "look" : "good";
    for (const s of [-1, 1]) {
      const x0 = r === "push" ? x + s * 4 : x + s * (d + 10), x1 = r === "push" ? x + s * (d + 10) : x + s * 4;
      const dir = Math.sign(x1 - x0);
      P.stroke(c, [[x0, y], [x1, y]], { role, width: 2.5 });
      P.stroke(c, [[x1 - dir * 6, y - 5], [x1, y], [x1 - dir * 6, y + 5]], { role, width: 2.5 });
    }
  }
  /** a canvas arrow button (↺ / ↻): a round turn arrow drawn, never a glyph in a font */
  function turnBtn(c: CanvasRenderingContext2D, id: string, b: Box, dir: -1 | 1): void {
    const P = api.P;
    target(id, b);
    P.body(c, b.x, b.y, b.w, b.h, { role: "q2", r: 12, state: live() ? "idle" : "dim" });
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.min(b.w, b.h) * 0.26, a0 = -Math.PI * 0.85, a1 = Math.PI * 0.45;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 12; k++) { const t = lerp(a0, a1, k / 12) * dir; pts.push([cx + Math.sin(t) * r, cy - Math.cos(t) * r]); }
    P.stroke(c, pts, { role: "ink", width: 3 });
    const [ex, ey] = pts[pts.length - 1], t = a1 * dir, tx = Math.cos(t) * dir, ty = Math.sin(t) * dir;
    P.stroke(c, [[ex - tx * 7 + ty * 5, ey - ty * 7 - tx * 5], [ex, ey], [ex - tx * 7 - ty * 5, ey - ty * 7 + tx * 5]], { role: "ink", width: 3 });
  }
  /** a pair of turn buttons under a caption, centred in `b` */
  function turnPair(c: CanvasRenderingContext2D, name: string, caption: string, b: Box): void {
    const bw = Math.min(64, (b.w - 8) / 2), bh = 48, y = b.y + b.h - bh;
    api.P.textFit(c, caption, b.x + b.w / 2, b.y + 10, b.w - 4, 20, { size: 15, role: "ink2", weight: 700 });
    turnBtn(c, `btn-${name}-l`, { x: b.x + b.w / 2 - bw - 4, y, w: bw, h: bh }, -1);
    turnBtn(c, `btn-${name}-r`, { x: b.x + b.w / 2 + 4, y, w: bw, h: bh }, 1);
  }

  // ── dhruv/sira ──
  function drawSira(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), rows = SPOTS, capH = 26;
    const rh = clamp((h - 16 - capH) / rows, 44, 62), top = Math.max(8 + capH, (h - rh * rows + capH) / 2);
    const flagW = 54, coverW = clamp(w * 0.24, 76, 110), pinsW = clamp(w - 32 - flagW - coverW, 100, 240);
    const x0 = Math.max(8, (w - (flagW + 8 + coverW + pinsW)) / 2), cx0 = x0 + flagW + 8, px0 = cx0 + coverW;
    const lifted = s.done || s.why === "middle";
    const [a, b] = polesOf(p), mat: Material = p.ctx === "board" ? "wood" : p.ctx === "box" ? "paper" : "plastic";
    P.textFit(c, W(`chumbak.sira.${p.ctx}`), cx0 + coverW / 2, top - 14, coverW + pinsW * 0.6, 22, { size: 15, role: "ink2", weight: 700 });
    P.text(c, W("chumbak.sira.flag"), x0 + flagW / 2, top - 14, { size: 14, role: "ink3", weight: 700, maxW: flagW + 6 });
    // the magnet under the cover (seen once it is lifted) and the filings crowding its ends
    if (lifted) {
      const k = s.done ? clamp((api.t - doneAt + 0.5) / 0.6, 0, 1) : prog(0, 0.6);
      const my = top + a * rh + rh * 0.12, mh = (b - a + 1) * rh - rh * 0.24, mw = coverW * 0.46, mx = cx0 + (coverW - mw) / 2;
      const upper: Material = p.lay % 2 ? "magnetN" : "magnetS";
      P.fillPath(c, (gg) => gg.rect(mx, my, mw, mh / 2), upper, { outline: "ink2", width: 1.5 });
      P.fillPath(c, (gg) => gg.rect(mx, my + mh / 2, mw, mh / 2), upper === "magnetN" ? "magnetS" : "magnetN", { outline: "ink2", width: 1.5 });
      for (let q = 0; q < 76; q++) {
        // filings: most at the two ends, a few along the middle (scene places, no count claimed)
        const end = q < 34 ? 0 : q < 68 ? 1 : 2, u = hash(p.lay * 31 + q), v = hash(p.lay * 17 + q * 3);
        const fy = end === 0 ? my - 8 + v * rh * 0.75 : end === 1 ? my + mh + 8 - v * rh * 0.75 : my + rh * 0.7 + v * (mh - rh * 1.4);
        const fx = end === 2 ? (u < 0.5 ? mx - 6 - u * 8 : mx + mw + 2 + (u - 0.5) * 8) : mx - 12 + u * (mw + 24);
        P.stroke(c, [[fx, fy], [fx + 4 * Math.cos(u * 6), fy + 4 * Math.sin(u * 6)]], { role: "ink2", width: 1.4, alpha: k });
      }
    }
    // the cover itself
    const r0 = 14, coverPath = (gg: CanvasRenderingContext2D) => { gg.moveTo(cx0 + r0, top); gg.arcTo(cx0 + coverW, top, cx0 + coverW, top + rows * rh, r0); gg.arcTo(cx0 + coverW, top + rows * rh, cx0, top + rows * rh, r0); gg.arcTo(cx0, top + rows * rh, cx0, top, r0); gg.arcTo(cx0, top, cx0 + coverW, top, r0); gg.closePath(); };
    P.fillPath(c, coverPath, mat, { outline: "ink2", width: 2, alpha: lifted ? 0.25 : 1 });
    if (!lifted) {
      if (p.ctx === "case") P.stroke(c, [[cx0 + 12, top + 8], [cx0 + 12, top + rows * rh - 8]], { role: "ink3", width: 2, dash: [5, 4] });
      if (p.ctx === "box") P.stroke(c, [[cx0 + 6, top + rh * 0.5], [cx0 + coverW - 6, top + rh * 0.5]], { role: "ink3", width: 2 });
      if (p.ctx === "board") for (let q = 0; q < 14; q++) P.circle(c, cx0 + 10 + hash(q * 5 + 2) * (coverW - 20), top + 10 + hash(q * 3 + 1) * (rows * rh - 20), 1.5, { role: "ink3", fill: true, width: 1 });
    }
    for (let i = 0; i < rows; i++) {
      const y = top + i * rh, cy = y + rh / 2, n = s.probes[i], touched = n >= 0;
      // the spot: a dot on the cover where the pin touches
      P.circle(c, px0 - 12, cy, 4, { role: touched ? "ink" : "ink3", fill: touched, width: 1.5 });
      target(`spot-${i}`, { x: cx0, y: y + 1, w: coverW + pinsW, h: rh - 2 });
      if (touched) {
        // the pin she holds to the spot, and the pins that cling below it (more at a pole)
        const k = fresh("probe", i) ? prog(0.05, 0.5) : 1, tip = px0 - 10, head = px0 + 30;
        P.stroke(c, [[tip, cy], [head, cy]], { role: "ink2", width: 2 });
        P.circle(c, head + 3, cy, 3.5, { role: "ink2", fill: true, width: 1 });
        const shown = Math.round(n * k);
        for (let q = 0; q < shown; q++) pin(c, tip + 6 + q * 6, cy + 1, -0.55 + q * 0.27 + (hash(i * 7 + q) - 0.5) * 0.12, Math.min(16, rh * 0.36));
        if (n === 0 && k >= 1) P.text(c, W("chumbak.sira.none"), head + 12, cy, { size: 14, role: "ink3", align: "left", maxW: pinsW - 48 });
      }
      // the flag box: only a touched spot can be flagged
      const fb: Box = { x: x0, y: y + 1, w: flagW, h: rh - 2 }, flagged = s.marks.includes(i);
      if (touched) target(`flag-${i}`, fb);
      const look = (s.why === "middle" || s.why === "not_pole" || s.why === "both_ends") && s.on === i;
      P.body(c, fb.x + 4, fb.y + 4, fb.w - 8, fb.h - 8, { role: flagged ? "you" : "panel", r: 10, state: !touched ? "dim" : look ? "look" : flagged ? "selected" : "idle" });
      const fx = fb.x + fb.w / 2 - 6;
      if (touched) {
        P.stroke(c, [[fx, cy + 10], [fx, cy - 11]], { role: flagged ? "ink" : "ink3", width: 2.5 });
        if (flagged) P.fillPath(c, (gg) => { gg.moveTo(fx, cy - 11); gg.lineTo(fx + 15, cy - 6); gg.lineTo(fx, cy - 1); gg.closePath(); }, "magnetN", { outline: "ink2", width: 1 });
        else P.stroke(c, [[fx, cy - 11], [fx + 13, cy - 6], [fx, cy - 1]], { role: "ink3", width: 1.5 });
      }
      if (look) P.magnifier(c, px0 + 50, cy - 4, 22);
    }
    if (s.done) for (const i of [a, b]) P.tick(c, x0 + flagW + 2, top + i * rh + 10, 16, clamp((api.t - doneAt) / 0.3, 0, 1));
  }

  // ── dhruv/jodo ──
  function drawJodo(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), n = s.cars.length, gap = 14;
    const cw = Math.min(w - 32, 760), pw = Math.min(118, (cw - gap * n) / (n + 1)), ph = clamp(pw * 0.72, 50, 72);
    const total = pw * (n + 1) + gap * n, x0 = (w - total) / 2, ty = clamp(h * 0.58, 150, h - 60);
    P.stroke(c, [[8, ty + 14], [w - 8, ty + 14]], { role: "ink3", width: 3 });
    for (let k = 0; k < Math.floor((w - 16) / 22); k++) P.stroke(c, [[12 + k * 22, ty + 10], [12 + k * 22, ty + 18]], { role: "ink3", width: 2 });
    // a push slides everything together; coupled joints close, a repelling joint opens
    const pushed = s.joints.length > 0, kp = pushed && fresh("run") ? prog(0, 0.6) : pushed ? 1 : 0;
    const xs: number[] = [];
    let x = x0;
    for (let i = 0; i <= n; i++) { xs.push(x); x += pw + (i < n ? (pushed ? lerp(gap, s.joints[i] > 0 ? 2 : gap * 2.2, kp) : gap) : 0); }
    const drift = (x - x0 - total) / 2;
    for (let i = 0; i <= n; i++) {
      const px = xs[i] - drift, py = ty - ph, isEng = i === 0;
      const way = isEng ? 0 : s.cars[i - 1];
      // a carriage just turned round flips across its middle
      const fk = !isEng && fresh("flip", i - 1) ? prog(0, 0.35) : 1, sx = Math.abs(Math.cos(fk * Math.PI)) * 0.85 + 0.15;
      c.save(); c.translate(px + pw / 2, 0); c.scale(fk < 1 ? sx : 1, 1); c.translate(-(px + pw / 2), 0);
      P.body(c, px, py, pw, ph - 10, { role: isEng ? "q1" : "q3", r: 8, seed: 40 + i });
      if (isEng) P.fillPath(c, (gg) => gg.rect(px + pw * 0.15, py - 14, pw * 0.22, 16), "iron", { outline: "ink2", width: 1.2 });
      for (const wx of [px + pw * 0.25, px + pw * 0.75]) P.fillPath(c, (gg) => gg.arc(wx, ty + 4, 7, 0, TAU), "iron", { outline: "ink2", width: 1.2 });
      // the magnets at the ends: the engine has one at its back only
      const [l, r] = isEng ? [null, p.eng ? "S" : "N"] as const : carPoles(way);
      const em = 14, eh = ph - 22, shownQ = p.shown || s.done;
      for (const [q, ex] of [[l, px - 2], [r, px + pw - em + 2]] as const) if (q) P.fillPath(c, (gg) => gg.rect(ex, py + 6, em, eh), shownQ ? (q === "N" ? "magnetN" : "magnetS") : "steel", { outline: "ink2", width: 1.2 });
      c.restore();
      // the letters, upright (never mirrored by the flip)
      if (fk >= 1) for (const [q, ex] of [[l, px + 12], [r, px + pw - 12]] as const) if (q) P.chip(c, shownQ ? q : "?", ex, py - 16, { size: 14, font: "ui" });
      if (!isEng) target(`car-${i - 1}`, { x: px - 2, y: py - 32, w: pw + 4, h: ph + 40 });
      if (!isEng && pushed && kp >= 1) { const j = s.joints[i - 1]; force(c, px - (j > 0 ? 1 : gap * 1.1), py + (ph - 10) / 2, j > 0 ? "pull" : "push"); }
    }
    const at = s.why.startsWith("repel") ? s.on : -1;
    if (at >= 0 && kp >= 1) P.magnifier(c, xs[at + 1] - drift - gap, ty - ph - 44, 22);
    if (s.done) P.tick(c, w / 2, ty - ph - 48, 20, clamp((api.t - doneAt) / 0.3, 0, 1));
  }

  // ── dhruv/pakka and todo: the marked magnet she holds ──
  /** where the marked magnet visits after a test: it slides to the end it was brought to */
  function testFlash(c: CanvasRenderingContext2D, ex: number, ey: number, side: -1 | 1, r: "push" | "pull", q: "N" | "S"): void {
    const P = api.P, k = prog(0, 0.5);
    const tx = ex + side * lerp(70, r === "pull" ? 26 : 40, k);
    P.fillPath(c, (gg) => gg.rect(side > 0 ? tx : tx - 34, ey - 10, 34, 20), q === "N" ? "magnetN" : "magnetS", { outline: "ink2", width: 1.2 });
    P.chip(c, q, side > 0 ? tx + 17 : tx - 17, ey - 22, { size: 14, font: "ui" });
    if (k >= 1) force(c, ex + side * 14, ey + 22, r, 1);
  }
  function drawPakka(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), n = p.bars as number;
    const toolH = 84, rowH = clamp((h - toolH - 8) / n, 74, 130), top = toolH + Math.max(0, (h - toolH - 8 - rowH * n) / 2);
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2, endW = 56, labW = 28;
    // her marked magnet: a tap on an end holds that pole out
    P.textFit(c, W("chumbak.pakka.yours"), w / 2, 18, cw, 22, { size: 15, role: "ink2", weight: 700 });
    const mw = Math.min(cw * 0.66, 240), mh = 30, mx = (w - mw) / 2, my = 36;
    magnet(c, mx, my, mw, mh, "N");
    for (const q of ["N", "S"] as const) {
      const hb: Box = { x: q === "N" ? mx - 10 : mx + mw / 2, y: my - 9, w: mw / 2 + 10, h: mh + 18 };
      target(`hold-${q}`, hb);
      if (pole === q) P.circle(c, q === "N" ? mx + 2 : mx + mw - 2, my + mh / 2, mh * 0.72, { role: "you", width: 3 });
    }
    for (let i = 0; i < n; i++) {
      const y = top + i * rowH, by = y + 14, bh = 26, bx = x0 + labW + endW, bw = cw - labW - endW * 2;
      const claimed = s.done && s.on === i, look = s.why === "only_pull" && s.on === i;
      P.text(c, "ABC"[i], x0 + labW / 2, by + bh / 2, { size: 18, weight: 800, font: "display", role: "ink2" });
      // every bar is drawn the same (they look alike); the magnet shows its poles once it is found
      magnet(c, bx, by, bw, bh, claimed ? barPole(p, i, 0) : null, { iron: !claimed });
      if (look) P.magnifier(c, bx + bw / 2, by - 4, 22);
      if (claimed) P.tick(c, bx + bw / 2, by - 8, 18, clamp((api.t - doneAt) / 0.3, 0, 1));
      for (const end of [0, 1]) {
        const eb: Box = { x: end ? bx + bw : bx - endW, y: y + 2, w: endW, h: rowH - 4 };
        target(`end-${i}-${end}`, eb);
        P.body(c, eb.x + 4, by - 4, eb.w - 8, bh + 8, { role: "panel", r: 10, state: "hover" });
        P.circle(c, eb.x + eb.w / 2, by + bh / 2, 6, { role: "you", width: 2 });
        // what each pole did at this end, written by it
        const done = s.tests.filter((t) => t.i === i && t.end === end);
        done.forEach((t, k) => P.text(c, W(`chumbak.res.${t.p}.${t.r}`), end ? eb.x + eb.w - 2 : eb.x + 2, by + bh + 14 + k * 17, { size: 14, role: t.r === "push" ? "look" : "ink2", weight: 700, align: end ? "right" : "left", maxW: cw * 0.42 }));
        if (fresh("near", i) && last.end === end) { const t = done[done.length - 1]; if (t) testFlash(c, end ? bx + bw : bx, by + bh / 2, end ? 1 : -1, t.r, t.p); }
      }
    }
    // a plain iron nail is pulled too: the consequence of calling a bar a magnet for a pull
    if (s.why === "only_pull") {
      // the nail jumps up and clings to the pole she holds out
      const k = prog(0.1, 0.6), side = pole === "N" ? 1 : -1, hx = pole === "N" ? mx + 16 : mx + mw - 16, ny = my + mh + 2 + lerp(14, 0, k);
      P.stroke(c, [[hx, ny], [hx + side * 7, ny + 22]], { role: "ink", width: 3.5 });
      P.circle(c, hx, ny + 1, 4, { role: "ink", fill: true });
      P.chip(c, W("chumbak.pakka.nail"), hx + side * 76, my + mh + 16, { size: 14, role: "look", font: "ui" });
    }
  }
  function drawTodo(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), n = p.pieces as number;
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2, wholeH = 58, tagW = 52;
    const rowH = clamp((h - wholeH - 16) / n, 58, 100), top = wholeH + 8 + Math.max(0, (h - wholeH - 16 - rowH * n) / 2);
    // the whole magnet as it was
    const left = piecePole(p, 0, 0), bx0 = x0 + tagW + 6, wl = cw - tagW * 2 - 12;
    P.text(c, W("chumbak.todo.whole"), w / 2, 14, { size: 14, role: "ink3", maxW: cw });
    magnet(c, bx0, 28, wl, 26, left);
    // each piece lies where it was in the magnet; where the breaks fall is a scene layout (no fact claimed)
    const cut = p.cut ?? 0;
    const fr = n === 2 ? [[0.5, 0.5], [0.4, 0.6], [0.62, 0.38]][cut] : n === 3 ? [[0.3, 0.38, 0.32], [0.36, 0.3, 0.34], [0.28, 0.34, 0.38]][cut] : [[0.24, 0.26, 0.28, 0.22], [0.22, 0.3, 0.24, 0.24], [0.27, 0.23, 0.25, 0.25]][cut];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const y = top + i * rowH, bh = 24, by = y + (rowH - bh) / 2 - 6;
      const bx = bx0 + acc * wl + (i > 0 ? 3 : 0), bw = fr[i] * wl - (i > 0 ? 3 : 0) - (i < n - 1 ? 3 : 0);
      acc += fr[i];
      const look = (s.why === "one_pole" || s.why === "look_again" || s.why === "label_all") && s.on === i;
      magnet(c, bx, by, bw, bh, s.done ? piecePole(p, i, 0) : null, { iron: !s.done, jag: [i > 0, i < n - 1] });
      if (look) P.magnifier(c, bx + bw / 2, by - 8, 22);
      for (const end of [0, 1]) {
        const tb: Box = { x: end ? x0 + cw - tagW : x0, y: y + 2, w: tagW, h: rowH - 4 }, pr = printed(p, i, end), v = s.labels[i]?.[end] ?? "";
        if (!pr || tool !== "label") target(`end-${i}-${end}`, tb);
        P.body(c, tb.x + 3, by - 8, tb.w - 6, bh + 16, { role: "panel", r: 10, state: pr ? "dim" : v ? "selected" : "idle" });
        P.text(c, v === "-" ? W("chumbak.todo.nopole") : v || "?", tb.x + tb.w / 2, by + bh / 2, { size: 18, weight: 800, role: v ? "ink" : "ink3", maxW: tb.w - 10 });
        // the end and its tag joined by a thin line
        P.stroke(c, [[end ? tb.x : tb.x + tb.w, by + bh / 2], [end ? bx + bw : bx, by + bh / 2]], { role: "ink3", width: 1.5, dash: [3, 3] });
        const t = [...s.tests].reverse().find((x) => x.i === i && x.end === end);
        if (t) P.text(c, W(`chumbak.res.${t.p}.${t.r}`), end ? tb.x + tb.w : tb.x, by + bh + 20, { size: 14, role: t.r === "push" ? "look" : "ink2", weight: 700, align: end ? "right" : "left", maxW: cw * 0.45 });
      }
      // the consequence of a piece with one pole only: the end she called "no pole" pushes a pole away
      if (s.why === "one_pole" && s.on === i) {
        const lb = s.labels[i], e = lb[0] === "-" || (lb[0] === lb[1] && !printed(p, i, 0)) ? 0 : 1;
        testFlash(c, e ? bx + bw : bx, by + bh / 2, e ? 1 : -1, "push", piecePole(p, i, e));
      }
    }
  }
  function drawTaakat(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), cw = Math.min(w - 16, 640), x0 = (w - cw) / 2, colW = cw / 2;
    const trayY = h - 54, trayH = 42;
    P.fillPath(c, (gg) => gg.rect(x0 + 8, trayY, cw - 16, trayH), "paper", { outline: "ink2", width: 1.5 });
    for (let q = 0; q < 60; q++) { const u = hash(q * 13 + 1), v = hash(q * 7 + 5); pin(c, x0 + 16 + u * (cw - 32), trayY + 8 + v * (trayH - 20), u * 6, 10); }
    P.text(c, W("chumbak.taakat.tray"), x0 + cw / 2, trayY - 12, { size: 14, role: "ink3" });
    for (let i = 0; i < 2; i++) {
      const size = sizeAt(p, i), cx = x0 + colW * i + colW / 2, big = size === "big";
      const mw = big ? Math.min(colW * 0.7, 130) : Math.min(colW * 0.42, 70), mh = big ? 56 : 18;
      const dk = fresh("dip", i) ? prog(0, 0.9) : 1, dipped = s.dipped[i];
      // dipped: down into the pins and back up (a sine over the animation)
      const down2 = dipped && dk < 1 ? Math.sin(dk * Math.PI) : 0;
      const restY = 72, my = lerp(restY, trayY - mh + 6, down2);
      P.textFit(c, W(`chumbak.taakat.${size}`), cx, 18, colW - 12, 30, { size: 15, role: "ink", weight: 700 });
      P.stroke(c, [[cx, 38], [cx, my]], { role: "ink3", width: 2 });
      if (big) P.fillPath(c, (gg) => gg.rect(cx - mw / 2, my, mw, mh), "iron", { outline: "ink2", width: 1.5 });
      else magnet(c, cx - mw / 2, my, mw, mh, "N", { letters: false });
      target(`dip-${i}`, { x: cx - colW / 2 + 6, y: 4, w: colW - 12, h: trayY - 66 });
      if (dipped && dk > 0.5) {
        const n = KIT_PINS[size], k = clamp((dk - 0.5) * 2, 0, 1), per = Math.max(4, Math.round(mw / 9));
        for (let q = 0; q < n; q++) {
          const col = q % per, row = Math.floor(q / per);
          pin(c, cx - mw / 2 + 6 + col * 9 + (row % 2) * 4, my + mh + 2 + row * 13, -0.3 + hash(q * 3 + i) * 0.6, 12);
        }
        if (k >= 1) P.chip(c, W("chumbak.taakat.pins", { n }), cx, my + mh + 30 + Math.ceil(n / per) * 13, { size: 15, role: "ink", font: "ui" });
      }
      const look = s.why === "bigger" && s.on === i;
      if (look) P.magnifier(c, cx + mw / 2 + 18, my + mh / 2, 22);
      if (s.done && s.on === i) P.tick(c, cx + mw / 2 + 20, my, 18, clamp((api.t - doneAt) / 0.3, 0, 1));
    }
  }

  // ── disha ──
  /** a screen direction for a world quarter turn `q` (unwrapped allowed): the unit vector, clockwise from screen-up */
  const dirv = (q: number): [number, number] => { const t = ((q + rot) * Math.PI) / 2; return [Math.sin(t), -Math.cos(t)]; };
  const STRIP = 86;   // the turn buttons' strip under the ground
  function groundBox(): Box { const cw = Math.min(w - 16, 620); return { x: (w - cw) / 2, y: 6, w: cw, h: Math.max(200, h - STRIP - 10) }; }
  const LM = ["a", "b", "c", "d"];
  /** the landmark at world direction d (the context's four) */
  const lmName = (d: number) => W(`chumbak.lm.${p.ctx}.${LM[d]}`);
  const sideW = (gb: Box) => Math.min(84, gb.w * 0.25);
  function drawGround(c: CanvasRenderingContext2D, gb: Box): void {
    const P = api.P;
    P.body(c, gb.x, gb.y, gb.w, gb.h, { role: "panel", r: 16, seed: 5 });
    // a few tufts on the ground: places, never a direction
    for (let q = 0; q < 9; q++) { const u = hash(p.lay * 3 + q), v = hash(p.lay * 5 + q * 7), x = gb.x + 24 + u * (gb.w - 48), y = gb.y + 24 + v * (gb.h - 48); P.stroke(c, [[x - 4, y + 3], [x, y - 4], [x + 4, y + 3]], { role: "q4", width: 1.6, alpha: 0.6 }); }
  }
  /** the four landmarks at the ground's sides (drawn last, over her) */
  function drawLandmarks(c: CanvasRenderingContext2D, gb: Box): void {
    const P = api.P, sw = sideW(gb);
    for (let d = 0; d < 4; d++) {
      const [vx, vy] = dirv(d), isT = d === p.target, side = Math.abs(vx) > 0.5;
      const bw = side ? sw : Math.min(170, gb.w * 0.5), bh = side ? 46 : 32;
      const bx = side ? (vx < 0 ? gb.x + 4 : gb.x + gb.w - 4 - bw) : gb.x + (gb.w - bw) / 2, by = side ? gb.y + (gb.h - bh) / 2 : vy < 0 ? gb.y + 4 : gb.y + gb.h - 4 - bh;
      P.body(c, bx, by, bw, bh, { role: isT ? "q1" : "panel", r: 10, state: isT ? "selected" : "idle" });
      P.textFit(c, lmName(d), bx + bw / 2, by + bh / 2, bw - 8, bh - 4, { size: 14, weight: 700, ...(isT ? { on: "q1" as Role } : { role: "ink2" as Role }) });
    }
  }
  /** the compass at (cx, cy): the box (its dial N at the shown `boxQ`), the needle (its N end at the shown `needleQ`); the
   *  letter at `aheadQ` (the way she faces) is ringed */
  function compass(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, boxQ: number, needleQ: number, aheadQ: number | null, letters = true): void {
    const P = api.P, fs = r > 44 ? 16 : 14;
    P.fillPath(c, (gg) => gg.arc(cx, cy, r + 6, 0, TAU), "brass", { outline: "ink2", width: 2 });
    // the dial face is the theme's panel, so its letters read in every art direction
    P.circle(c, cx, cy, r, { role: "panel", fill: true, width: 1.5 });
    for (let k = 0; k < 4 && letters; k++) {
      const [vx, vy] = dirv(boxQ + k), lx = cx + vx * (r - 13), ly = cy + vy * (r - 13);
      const ahead = aheadQ !== null && ((Math.round(aheadQ - boxQ - k) % 4) + 4) % 4 === 0 && Math.abs(aheadQ - boxQ - Math.round(aheadQ - boxQ)) < 0.12;
      // the letters on chips (they read on every art direction's dial)
      P.chip(c, DIRS[k], lx, ly, { size: fs, role: k === 0 ? "ink" : "ink2", font: "ui" });
      if (ahead) P.circle(c, lx, ly, fs * 0.95, { role: "you", width: 3 });
      const [tx, ty] = dirv(boxQ + k + 0.5);
      P.stroke(c, [[cx + tx * (r - 5), cy + ty * (r - 5)], [cx + tx * (r - 11), cy + ty * (r - 11)]], { role: "ink3", width: 1.5 });
    }
    // the needle: its N end red, its S end pale
    const [nx, ny] = dirv(needleQ), L = r * 0.62, bw = Math.max(4, r * 0.09);
    P.fillPath(c, (gg) => { gg.moveTo(cx + nx * L, cy + ny * L); gg.lineTo(cx - ny * bw, cy + nx * bw); gg.lineTo(cx + ny * bw, cy - nx * bw); gg.closePath(); }, "magnetN", { outline: "ink2", width: 1 });
    P.fillPath(c, (gg) => { gg.moveTo(cx - nx * L, cy - ny * L); gg.lineTo(cx - ny * bw, cy + nx * bw); gg.lineTo(cx + ny * bw, cy - nx * bw); gg.closePath(); }, "white", { outline: "ink2", width: 1 });
    P.circle(c, cx, cy, 3.5, { role: "ink", fill: true, width: 1 });
  }
  /** her body seen from above, her head the way she faces (shown quarter turn `q`) */
  function child(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, q: number): void {
    const P = api.P, [vx, vy] = dirv(q);
    P.fillPath(c, (gg) => gg.arc(cx, cy, r * 1.14, 0, TAU), "cotton", { outline: "ink3", width: 1.5, alpha: 0.9 });
    P.fillPath(c, (gg) => gg.arc(cx + vx * r * 1.3, cy + vy * r * 1.3, r * 0.26, 0, TAU), "soil", { outline: "ink2", width: 1.5 });
    // her two hands on the rim
    for (const s of [-1, 1]) P.fillPath(c, (gg) => gg.arc(cx + vx * r * 0.5 - vy * s * r * 0.95, cy + vy * r * 0.5 + vx * s * r * 0.95, r * 0.14, 0, TAU), "roti", { outline: "ink3", width: 1 });
  }
  function strip(c: CanvasRenderingContext2D, gb: Box, a: [string, string], b: [string, string]): void {
    const bb: Box = { x: gb.x, y: gb.y + gb.h + 6, w: gb.w, h: h - gb.y - gb.h - 10 };
    turnPair(c, a[0], a[1], { x: bb.x, y: bb.y, w: bb.w / 2, h: bb.h });
    turnPair(c, b[0], b[1], { x: bb.x + bb.w / 2, y: bb.y, w: bb.w / 2, h: bb.h });
  }
  function drawLatkao(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), gb = groundBox();
    drawGround(c, gb);
    const S = Math.min(gb.w, gb.h), cx = gb.x + gb.w * 0.64, cy = gb.y + gb.h * 0.4, L = S * 0.5;
    // the hung magnet from above: a thread knot at its middle; N end marked
    const [vx, vy] = dirv(twist.x), bw = 12;
    const half = (sgn: number, m: Material) => P.fillPath(c, (gg) => { gg.moveTo(cx - vy * bw, cy + vx * bw); gg.lineTo(cx + sgn * vx * L / 2 - vy * bw, cy + sgn * vy * L / 2 + vx * bw); gg.lineTo(cx + sgn * vx * L / 2 + vy * bw, cy + sgn * vy * L / 2 - vx * bw); gg.lineTo(cx + vy * bw, cy - vx * bw); gg.closePath(); }, m, { outline: "ink2", width: 1.5 });
    half(1, "magnetN"); half(-1, "magnetS");
    P.chip(c, "N", cx + vx * L * 0.34, cy + vy * L * 0.34, { size: 14, font: "ui" });
    P.circle(c, cx, cy, 5, { role: "ink", fill: true, width: 1 });
    // her fingers on the S end while she holds it
    if (s.held) P.fillPath(c, (gg) => gg.arc(cx - vx * L * 0.4, cy - vy * L * 0.4, 13, 0, TAU), "roti", { outline: "ink2", width: 1.5, alpha: 0.95 });
    // the paper map in the corner, its N arrow at the map's own turn
    const mr = S * 0.17, mx = gb.x + mr * 1.45 + 6, my = gb.y + gb.h - mr * 1.45 - 6, [ax, ay] = dirv(map.x);
    c.save(); c.translate(mx, my); c.rotate(((map.x + rot) * Math.PI) / 2);
    P.fillPath(c, (gg) => gg.rect(-mr, -mr, mr * 2, mr * 2), "paper", { outline: "ink2", width: 1.5 });
    P.stroke(c, [[-mr * 0.7, mr * 0.5], [-mr * 0.1, mr * 0.1], [mr * 0.5, mr * 0.4]], { role: "q2", width: 2 });
    P.circle(c, mr * 0.5, mr * 0.4, 3, { role: "q2", fill: true });
    c.restore();
    const tipX = mx + ax * mr * 0.75, tipY = my + ay * mr * 0.75;
    P.stroke(c, [[mx - ax * mr * 0.6, my - ay * mr * 0.6], [tipX, tipY]], { role: "ink", width: 3 });
    P.stroke(c, [[tipX - ax * 8 - ay * 6, tipY - ay * 8 + ax * 6], [tipX, tipY], [tipX - ax * 8 + ay * 6, tipY - ay * 8 - ax * 6]], { role: "ink", width: 3 });
    P.chip(c, "N", mx + ax * (mr * 0.75 + 14), my + ay * (mr * 0.75 + 14), { size: 14, font: "ui" });
    P.text(c, W("chumbak.latkao.map"), mx, my - mr * 1.45 + 2, { size: 14, role: "ink3", weight: 700 });
    if (s.why === "held") P.magnifier(c, cx + 34, cy - 34, 22);
    if (s.why === "map_off") P.magnifier(c, mx + mr * 1.2, my - mr * 1.2, 22);
    if (s.done) P.tick(c, mx + mr * 1.3, my - mr * 1.3, 22, clamp((api.t - doneAt) / 0.3, 0, 1));
    strip(c, gb, ["twist", W("chumbak.latkao.twist")], ["spin", W("chumbak.latkao.spin")]);
  }
  function drawCompassScene(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), gb = groundBox(), loha = g === "loha";
    drawGround(c, gb);
    const cx = gb.x + gb.w / 2, cy = gb.y + gb.h / 2, sw = sideW(gb);
    // room for her head beside the compass (it must not hide under a landmark)
    const r = clamp(Math.min((gb.w - 2 * sw - 16) / 2 / 1.6, (gb.h - 2 * 38 - 12) / 2 / 1.6), 40, 84);
    // loha: the iron thing beside her (by it), or far off in a corner (away)
    if (loha) {
      const byIt = s.spot === 0, [ix, iy] = dirv(p.iron as number), [jx, jy] = dirv((p.iron as number) + 1);
      // by it: just off the line the needle takes (her head may be on that line), so both stay in view
      const ox = byIt ? cx + ix * r * 1.5 + jx * r * 0.95 : cx + (ix + jx) * (gb.w / 2 - 30) * 0.8, oy = byIt ? cy + iy * r * 1.5 + jy * r * 0.95 : cy + (iy + jy) * (gb.h / 2 - 30) * 0.8;
      const sz = byIt ? r * 0.42 : r * 0.24, a = byIt ? 1 : 0.55;
      if (p.ctx === "bar") {
        // the bar magnet lies with its S end towards the compass (the needle's N end turns to it)
        c.save(); c.translate(ox, oy); c.rotate(Math.atan2(oy - cy, ox - cx));
        magnet(c, -sz, -sz * 0.3, sz * 2, sz * 0.6, "S", { letters: false, alpha: a });
        c.restore();
      } else P.fillPath(c, (gg) => gg.rect(ox - sz * 0.75, oy - sz * 0.75, sz * 1.5, sz * 1.5), p.ctx === "almirah" ? "steel" : "iron", { outline: "ink2", width: 1.5, alpha: a });
      if (!byIt) P.fillPath(c, (gg) => gg.rect(cx - r * 1.35, cy - r * 1.35, r * 2.7, r * 2.7), "wood", { outline: "ink3", width: 1, alpha: 0.35 });
    }
    child(c, cx, cy, r, face.x);
    compass(c, cx, cy, r, box.x, needle.x, face.x);
    drawLandmarks(c, gb);
    if (s.why === "needle_stayed" || s.why === "set_n") { const [nx, ny] = dirv(needle.x); P.magnifier(c, cx + nx * (r + 16) - ny * 18, cy + ny * (r + 16) + nx * 18, 22); }
    if (s.why === "near_iron") {
      // away from the iron the needle swings back to north: a small compass in a corner shows it
      const k = prog(0.1, 1.2), ir = clamp(r * 0.55, 26, 40), [ix, iy] = dirv((p.iron as number) + 2), [jx, jy] = dirv((p.iron as number) + 3);
      const qx = cx + (ix + jx) * (gb.w / 2 - ir - 12), qy = cy + (iy + jy) * (gb.h / 2 - ir - 26);
      const swing = (p.iron as number) * (1 - k) + (api.reduced ? 0 : Math.sin(k * Math.PI * 3) * 0.25 * (1 - k));
      compass(c, qx, qy, ir, s.box, swing, null, false);
      P.textFit(c, W("chumbak.loha.away"), clamp(qx, gb.x + 62, gb.x + gb.w - 62), qy < cy ? qy - ir - 16 : qy + ir + 16, 116, 20, { size: 14, weight: 700, role: "ink2" });
      P.magnifier(c, qx + ir + 8, qy - ir, 20);
    }
    if (s.done) P.tick(c, cx + r + 22, cy - r - 8, 20, clamp((api.t - doneAt) / 0.3, 0, 1));
    strip(c, gb, ["turn", W("chumbak.disha.turn")], ["dial", W("chumbak.disha.dial")]);
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (g === "sira") drawSira(c);
    else if (g === "jodo") drawJodo(c);
    else if (g === "pakka") drawPakka(c);
    else if (g === "todo") drawTodo(c);
    else if (g === "taakat") drawTaakat(c);
    else if (g === "latkao") drawLatkao(c);
    else drawCompassScene(c);
  }

  function goal(): string {
    const s = st();
    const vals: Record<string, string | number> = { n: s.on + 1, bar: "ABC"[Math.max(0, s.on)] ?? "", lm: p.target !== undefined ? lmName(p.target) : "", thing: g === "loha" ? W(`chumbak.loha.${p.ctx}`) : "",
      small: KIT_PINS.small, big: KIT_PINS.big, dir: p.target !== undefined ? W(`chumbak.dir.${DIRS[p.target]}`) : "" };
    if (s.done) return W(`chumbak.done.${g}`, vals);
    if (s.why && W(`chumbak.why.${s.why}`)) return W(`chumbak.why.${s.why}`, vals);
    if (g === "jodo" && !p.shown) return W("chumbak.goal.jodo.hidden");
    if (g === "latkao" && !s.held) return W("chumbak.goal.latkao.free");
    return W(`chumbak.goal.${g}`, { lm: p.target !== undefined ? lmName(p.target) : "", thing: g === "loha" ? W(`chumbak.loha.${p.ctx}`) : "" });
  }
  const readouts = (): Readout[] => (g === "ghoomo" || g === "loha") && !st().done ? [{ k: W("chumbak.disha.ahead"), v: letterAhead(st().face, st().box) }] : [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const undo: ControlSpec = { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) };
    const runBtn = (key: string): ControlSpec => ({ id: "run", label: W(`chumbak.run.${key}`), aria: W(`chumbak.run.${key}`), kind: "primary", group: "go", onPress: () => act({ kind: "run" }) });
    if (g === "pakka") {
      for (let i = 0; i < (p.bars as number); i++) out.push({ id: `claim-${i}`, label: W("chumbak.pakka.claim", { bar: "ABC"[i] }), kind: "choice", group: "claim", onPress: () => act({ kind: "claim", i }) });
      out.push(undo);
      return out;
    }
    if (g === "todo") {
      for (const t of ["label", "N", "S"] as const) out.push({ id: `tool-${t}`, label: W(`chumbak.tool.${t}`), kind: "choice", group: "tool", pressed: tool === t, onPress: () => { tool = t; api.sfx("select"); api.invalidate(); deps.changed(); } });
      out.push(undo, runBtn("todo"));
      return out;
    }
    if (g === "taakat") {
      for (let i = 0; i < 2; i++) out.push({ id: `claim-${i}`, label: W(`chumbak.taakat.claim.${sizeAt(p, i)}`), kind: "choice", group: "claim", onPress: () => act({ kind: "claim", i }) });
      out.push(undo);
      return out;
    }
    if (g === "latkao" && s.held) out.push({ id: "let", label: W("chumbak.latkao.let"), kind: "secondary", group: "go", onPress: () => act({ kind: "let" }) });
    if (g === "loha") out.push({ id: "go", label: W(s.spot ? "chumbak.loha.back" : "chumbak.loha.walk"), kind: "secondary", group: "go", onPress: () => act({ kind: "go", to: s.spot ? 0 : 1 }) });
    out.push(undo, runBtn(g === "ghoomo" || g === "loha" ? "read" : g));
    return out;
  }
  void pinsAt; void jointsOf; void chumbakHelpers;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
