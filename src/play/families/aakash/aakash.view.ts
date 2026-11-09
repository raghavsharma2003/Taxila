// Aakash · the 2D view (round 7, the Earth's motions, seasons and eclipses; class 7 science). Nothing here runs on a clock:
// the Earth spins or moves round, the Moon moves on, only when the child taps a tool or drags the thing itself, and each
// step is shown gliding (a beat inside busy()); the animations only show what the law has already answered.
//   a strip on top: the card (the moments, the day and the year, the seasons, the ice blocks, the eclipses)
//   the scene: chakkar/din the Earth from above its North Pole, the Sun's light from the left (the half facing it has day),
//              the place(s) on it, and the sky over the card's place (east, west, where the Sun appears); chakkar/saal the
//              Sun in the middle, the Earth on its path, its spins and its way round counted as dots; ritu the path seen a
//              little from the side, the Earth with its leaning axis, the point closest to the Sun marked, and under it each
//              half's sunlight on graph paper (the same bundle of light: a small bright patch or a bigger dim one); grahan the
//              Sun's light from the left, the Earth, the Moon on its way round (where its path crosses the line marked), a
//              strip from the side (the Moon above, below or on the line) and the Moon as seen from the Earth
//   the tools below (tap one; or drag the Earth or the Moon along its way, or spin the Earth with a finger).
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross).
import type { AakashAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  FULL_AT, MOON, NEAR, NEW_AT, PATH, SPIN, cardOf, dhoopRow, dinRow, fallOf, grahanRow, heightOf, isDay, jhukRow, momentOf, onLine, saalRow, stepOf, toolsOf,
  type AakashParams, type AakashState, type AakashW, type Half,
} from "./aakash.logic.ts";

const HOLD = 1.6;   // s: the stage keeps drawing after an act (the last beat lands inside it)
const TAU = Math.PI * 2;

/** a stable 0..1 hash (star places are the level's own, never random per frame) */
const hash = (n: number) => { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const PLACE_KEY: Record<string, string> = { A: "arunachal", G: "gujarat", H: "ghar" };

export const makeAakashView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<AakashParams, AakashState, AakashAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const tools = toolsOf(p);
  const lamp = p.scene === "lamp";
  let w = 360, h = 400;
  let actAt = -10, doneAt = -10, cheered = false;
  let last: { m: string; before: AakashW | null } = { m: "", before: null };
  /** a finger on the Earth or the Moon (a drag along its way) or on the Sun */
  let drag: null | { id: string; x: number; y: number; a0: number; moved: boolean } = null;
  let down: { x: number; y: number } | null = null;
  /** where the things are this frame (for the drags) */
  let pivot = { x: 0, y: 0 };

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: AakashAct) => {
    last = { m: a.kind === "use" ? a.m : a.kind, before: { ...st().w } };
    ctl.dispatch(a); deps.changed();
  };
  function react(ms: Moment[], refused: string | undefined): void {
    const now = api.t;
    actAt = now;
    if (last.m === "undo") last = { m: "", before: null };
    if (refused) last.before = null;
    for (const m of ms) if (m.kind === "solved") { doneAt = now + 0.5; cheered = false; }
    const mc = ms.some((m) => m.kind === "misconception_consequence");
    if (refused === "level_over" || refused === "dizzy" || refused === "round_done") api.sfx("refuse");
    else if (refused || mc) { api.sfx("look"); if (!mc) api.fx.shake(2); }
    else api.sfx(last.m === "spin" ? "tick" : last.m === "round" || last.m === "moon" || last.m === "months" ? "slide" : last.m === "shine" ? "pour" : "tap");
    api.invalidate(); deps.changed();
  }
  function update(_dt: number): void {
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      api.fx.burst(w / 2, Math.min(h * 0.25, 110), { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const busy = () => !!drag || api.t - actAt < HOLD || (doneAt >= 0 && api.t - doneAt < 0.8);
  /** 0..1 along the last act's glide (reduced motion: at once) */
  const prog = (delay = 0) => (api.reduced ? 1 : ease.out(clamp((api.t - actAt - delay) / 0.9, 0, 1)));
  /** a value glided from the act's before-state to now (wrapping forward on a ring of `n`) */
  const glide = (key: "r" | "pos" | "k", n: number): number => {
    const now = st().w[key], b = last.before;
    if (!b || b[key] === now || api.t - actAt >= HOLD) return now;
    const d = (((now - b[key]) % n) + n) % n;
    return b[key] + d * prog();
  };

  // ── input ──
  function tap(id: string): void {
    const i = id.indexOf("-"), kind = id.slice(0, i), rest = id.slice(i + 1);
    if (kind === "tool") act({ kind: "use", m: rest });
    else if (kind === "sun") act({ kind: "use", m: "sun" });
  }
  /** the angle of (x, y) round the pivot (math sense: counterclockwise positive, screen y down) */
  const angAt = (x: number, y: number) => Math.atan2(-(y - pivot.y), x - pivot.x);
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) { drag = null; down = null; return; }
    if (kind === "down") {
      const id = api.hit(x, y);
      if (id === "earth" || id === "moon" || id === "spin") { drag = { id, x, y, a0: angAt(x, y), moved: false }; ctl.finger(true); api.sfx("select"); }
      else down = { x, y };
      return;
    }
    if (kind === "move" && drag) { if (Math.hypot(x - drag.x, y - drag.y) > 8) drag.moved = true; api.invalidate(); return; }
    if ((kind === "up" || kind === "cancel") && drag) {
      const d = drag; drag = null; ctl.finger(false);
      if (kind === "cancel" || !d.moved) { api.invalidate(); deps.changed(); return; }
      // the way it was dragged round its pivot: forward (counterclockwise, the only way it goes) moves it one step
      let da = angAt(x, y) - d.a0; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (da > 0.25) act({ kind: "use", m: d.id === "earth" ? "round" : d.id === "moon" ? "moon" : "spin" });
      else { api.sfx("refuse"); api.invalidate(); deps.changed(); }
      return;
    }
    if (kind === "up" && down) { const d0 = down; down = null; if (Math.hypot(x - d0.x, y - d0.y) < 14) { const id = api.hit(d0.x, d0.y); if (id) tap(id); } return; }
    if (kind === "cancel") down = null;
  }
  const dragging = () => !!drag;

  // ── geometry ──
  function geo() {
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2, gap = 8;
    const toolH = 50, toolY = h - 8 - toolH;
    const stripH = 40, stripY = 8;
    const sy = stripY + stripH + gap, sh = toolY - gap - sy;
    return { cw, x0, gap, toolH, toolY, stripH, stripY, sy, sh };
  }
  type G = ReturnType<typeof geo>;

  // ── the strip: the card ──
  function drawStrip(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), card = cardOf(p), n = Math.max(1, card.length), cw = (g.cw - (n - 1) * 6) / n;
    const lookAt = s.why && !s.done ? s.w.next : -1;
    card.forEach((_, i) => {
      const x = g.x0 + i * (cw + 6), state = i < s.w.next ? "good" : i === lookAt ? "look" : i === s.w.next && !s.done ? "selected" : "idle";
      P.body(c, x, g.stripY, cw, g.stripH, { role: "panel", r: 10, seed: 60 + i, state });
      P.textFit(c, chipLabel(i), x + cw / 2, g.stripY + g.stripH / 2 + 1, cw - 10, g.stripH - 4, { size: 14, role: "ink", weight: 700 });
      if (state === "good") P.tick(c, x + cw - 7, g.stripY + 5, 11);
      if (state === "look") P.magnifier(c, x + cw - 7, g.stripY + 7, 12);
    });
  }
  function chipLabel(i: number): string {
    switch (goal) {
      case "din": { const r = dinRow(p), it = r.card[i]; return r.places.length > 1 ? W("aakash.chip.at", { when: W(`aakash.when.${it.when}`), place: W(`aakash.place.${PLACE_KEY[r.places[it.at]]}`) }) : W(`aakash.when.${it.when}`); }
      case "saal": return W(`aakash.span.${saalRow(p).card[i]}`);
      case "jhuk": { const it = jhukRow(p).card[i]; return W(`aakash.chip.${it.half}.${it.season}`); }
      case "dhoop": return W(`aakash.ice.${dhoopRow(p).card[i]}`);
      default: return W(`aakash.eclipse.${grahanRow(p).card[i]}`);
    }
  }

  // ── shared drawing ──
  function sunAt(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    const P = api.P;
    if (lamp) {
      // the classroom model: a lamp on a stand
      P.fillPath(c, (q) => q.arc(x, y, r * 0.7, 0, TAU), "glow", { outline: "ink2", width: 1.5 });
      P.fillPath(c, (q) => q.rect(x - 3, y + r * 0.7, 6, r * 0.6), "steel", { outline: "ink2", width: 1 });
      return;
    }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; P.stroke(c, [[x + Math.cos(a) * r * 1.08, y + Math.sin(a) * r * 1.08], [x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3]], { role: "ink3", width: 2 }); }
    P.fillPath(c, (q) => q.arc(x, y, r, 0, TAU), "sun", { outline: "ink3", width: 1 });
  }
  /** a ball lit from the direction `toSun` (radians, math sense): the far half in shadow */
  function ball(c: CanvasRenderingContext2D, x: number, y: number, r: number, toSun: number, mat: "water" | "steel" | "white"): void {
    const P = api.P, a = -toSun;   // screen angle of the sun direction
    P.fillPath(c, (q) => q.arc(x, y, r, 0, TAU), mat, { outline: "ink2", width: 1.5 });
    P.fillPath(c, (q) => { q.arc(x, y, r, a + Math.PI / 2, a + (3 * Math.PI) / 2); q.closePath(); }, "shadow", { outline: null, alpha: 0.55 });
  }
  function stars(c: CanvasRenderingContext2D, x: number, y: number, ww: number, hh: number, n: number): void {
    for (let i = 0; i < n; i++) api.P.circle(c, x + hash(i * 7 + p.lay) * ww, y + hash(i * 13 + p.lay + 3) * hh, 1.2, { role: "ink3", fill: true, alpha: 0.7 });
  }
  function arrowHead(c: CanvasRenderingContext2D, x: number, y: number, ang: number, role: "ink2" | "q2" | "look"): void {
    const L = 8;
    api.P.stroke(c, [[x - L * Math.cos(ang - 0.5), y - L * Math.sin(ang - 0.5)], [x, y], [x - L * Math.cos(ang + 0.5), y - L * Math.sin(ang + 0.5)]], { role, width: 2.5 });
  }

  // ── chakkar/din: the Earth from above its North Pole ──
  function drawDin(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), r = dinRow(p), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 3 });
    const wide = CW >= 480;
    // narrow: the sky across the bottom, the Earth above it towards the right (the Sun at the left edge)
    const skyN = clamp(H * 0.26, 64, 110), area = wide ? H : H - skyN - 16;
    const R = clamp(Math.min(CW * (wide ? 0.2 : 0.22), (area - 28) / 2), 40, 120), ex = wide ? X + CW * 0.36 : X + CW - R - 30, ey = wide ? Y + Math.max(R + 34, H * 0.42) : Y + 8 + area / 2;
    // the Sun at the left edge, its light across to the Earth
    const sr = Math.min(30, R * 0.45), sx = X + 24, sy = ey;
    for (let i = -2; i <= 2; i++) P.stroke(c, [[sx + sr + 6, ey + i * R * 0.38], [ex - R - 6, ey + i * R * 0.38]], { role: "ink3", width: 1.5, dash: [5, 6] });
    sunAt(c, sx, sy, sr);
    if (!s.done) api.target("sun-0", sx - 22, sy - 30, 48, 60);
    if (s.why === "sun_still") P.magnifier(c, sx + sr, sy - sr, 18);
    // the Earth: the half facing the Sun has day; the spin arrow (west to east, counterclockwise from above the North Pole)
    pivot = { x: ex, y: ey };
    ball(c, ex, ey, R, Math.PI, "water");
    P.circle(c, ex, ey, 3, { role: "ink", fill: true });
    P.text(c, W("aakash.pole"), ex, ey + 14, { size: 14, role: "ink", weight: 700 });
    const ar = R + 12;
    P.stroke(c, Array.from({ length: 13 }, (_, i): [number, number] => { const a = -0.15 - (i / 12) * 1.1; return [ex + ar * Math.cos(a), ey + ar * Math.sin(a)]; }), { role: "q2", width: 3 });
    { const a = -1.25; arrowHead(c, ex + ar * Math.cos(a), ey + ar * Math.sin(a), a - Math.PI / 2, "q2"); }
    if (!s.done) api.target("spin", ex - R, ey - R, 2 * R, 2 * R);
    // the places on it (look 3: the eastern one EAST steps ahead in the spin)
    const rr = glide("r", SPIN), it = r.card[Math.min(s.w.next, r.card.length - 1)];
    r.places.forEach((pl, i) => {
      const step = r.places.length === 2 ? rr + (i === 0 ? 1 : 0) : rr, a = Math.PI + (step * TAU) / SPIN;
      const px = ex + R * 0.72 * Math.cos(a), py = ey - R * 0.72 * Math.sin(a), mine = i === it.at;
      P.circle(c, px, py, mine ? 7 : 6, { role: mine ? "q1" : "q3", fill: true });
      P.circle(c, px, py, mine ? 9 : 8, { role: "ink", width: 1.5 });
      // its name on a chip just outside the rim (readable over the night half too)
      const lx = ex + (R + 20) * Math.cos(a), ly = ey - (R + 14) * Math.sin(a);
      P.chip(c, W(`aakash.place.${PLACE_KEY[pl]}`), clamp(lx, X + 48, X + CW - 48), clamp(ly, Y + 14, Y + area - 4), { size: 14, role: mine ? "q1" : "ink3", font: "ui" });
      if (s.why === "not_now" && mine) P.magnifier(c, px + 12, py - 12, 16);
    });
    // the sky over the card's place: where the Sun appears (east, overhead, west) or night
    const skW = wide ? Math.min(220, CW * 0.34) : CW - 16, skH = wide ? 120 : skyN;
    const skX = wide ? X + CW - skW - 12 : X + 8, skY = wide ? Y + 40 : Y + H - skH - 8;
    {
      const step = Math.round(stepOf(p, s.w, it.at)), day = isDay(step) || step === 6 || step === 2;
      P.body(c, skX, skY, skW, skH, { role: "panel", r: 10, seed: 9, state: "idle" });
      P.fillPath(c, (q) => q.rect(skX + 4, skY + 4, skW - 8, skH - 30), day ? "ice" : "shadow", { outline: null, alpha: day ? 0.7 : 0.75 });
      if (!day) stars(c, skX + 8, skY + 8, skW - 16, skH - 40, 14);
      const hy = skY + skH - 26;
      P.stroke(c, [[skX + 6, hy], [skX + skW - 6, hy]], { role: "ink", width: 2 });
      P.text(c, W("aakash.east"), skX + 10, hy + 12, { size: 14, role: "ink", weight: 800, align: "left" });
      P.text(c, W("aakash.west"), skX + skW - 10, hy + 12, { size: 14, role: "ink", weight: 800, align: "right" });
      P.textFit(c, W("aakash.sky", { place: W(`aakash.place.${PLACE_KEY[r.places[it.at]]}`) }), skX + skW / 2, hy + 12, skW * 0.46, 20, { size: 14, role: "ink2", weight: 700 });
      // the Sun's place in that sky: step 6 on the east horizon, 0 overhead, 2 on the west horizon
      const sa = ({ 6: 0, 7: 0.25, 0: 0.5, 1: 0.75, 2: 1 } as Record<number, number>)[step];
      if (sa !== undefined) { const ax = lerp(skX + 22, skX + skW - 22, sa), ay = hy - Math.sin(sa * Math.PI) * (skH - 46) - 2; P.fillPath(c, (q) => q.arc(ax, ay, 9, 0, TAU), lamp ? "glow" : "sun", { outline: "ink3", width: 1 }); }
      else P.chip(c, W("aakash.night"), skX + skW / 2, skY + 4 + (skH - 30) / 2, { size: 14, role: "ink3", font: "ui" });
    }
  }

  // ── chakkar/saal: the Earth on its path round the Sun ──
  function drawSaal(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 4 });
    const cntH = 52, cx = X + CW / 2, cy = Y + (H - cntH) / 2, Ro = Math.min(CW * 0.36, (H - cntH) / 2 - 30);
    pivot = { x: cx, y: cy };
    P.stroke(c, Array.from({ length: 49 }, (_, i): [number, number] => [cx + Ro * Math.cos((i / 48) * TAU), cy + Ro * Math.sin((i / 48) * TAU)]), { role: "ink3", width: 1.5, dash: [4, 5] });
    // the way round this item has gone so far (from where the item began)
    const pos = glide("pos", PATH), startPos = s.w.pos - s.w.mv;
    if (s.w.mv > 0 || (last.m === "round" && api.t - actAt < HOLD)) {
      const a0 = (startPos * TAU) / PATH, a1 = (pos * TAU) / PATH, n = 24;
      P.stroke(c, Array.from({ length: n + 1 }, (_, i): [number, number] => { const a = lerp(a0, a1, i / n); return [cx + Ro * Math.cos(a), cy - Ro * Math.sin(a)]; }), { role: "q1", width: 4 });
    }
    sunAt(c, cx, cy, 24);
    if (!s.done) api.target("sun-0", cx - 26, cy - 26, 52, 52);
    if (s.why === "sun_still") P.magnifier(c, cx + 26, cy - 26, 16);
    const ea = (pos * TAU) / PATH, ex = cx + Ro * Math.cos(ea), ey = cy - Ro * Math.sin(ea), er = 20;
    ball(c, ex, ey, er, ea + Math.PI, "water");
    // the place on it: the spin turns it (glided)
    const rr = glide("r", SPIN), pa = ea + Math.PI + (rr * TAU) / SPIN;
    P.circle(c, ex + er * 0.7 * Math.cos(pa), ey - er * 0.7 * Math.sin(pa), 4, { role: "q1", fill: true });
    P.stroke(c, Array.from({ length: 9 }, (_, i): [number, number] => { const a = -0.2 - (i / 8) * 1.2; return [ex + (er + 7) * Math.cos(a), ey + (er + 7) * Math.sin(a)]; }), { role: "q2", width: 2 });
    if (!s.done) api.target("earth", ex - 24, ey - 24, 48, 48);
    if (s.why === "spun_not_round" || s.why === "short_year" || s.why === "not_day_move") P.magnifier(c, ex + er + 4, ey - er - 2, 16);
    // the counts: the spins (a ring of dots, extra spins marked) and the way round (four dots)
    const y0 = Y + H - cntH + 4, lw = 110, dx0 = X + 12 + lw + 10, dd = Math.min(18, (CW - lw - 40) / SPIN);
    P.textFit(c, W("aakash.count.spins"), X + 12 + lw / 2, y0 + 12, lw, 22, { size: 14, role: "ink2", weight: 700 });
    for (let i = 0; i < SPIN; i++) P.circle(c, dx0 + i * dd, y0 + 12, 5, { role: i < s.w.sp ? (s.w.sp > SPIN ? "look" : "q2") : "ink3", fill: i < s.w.sp, width: 1.5 });
    P.textFit(c, W("aakash.count.round"), X + 12 + lw / 2, y0 + 36, lw, 22, { size: 14, role: "ink2", weight: 700 });
    for (let i = 0; i < PATH; i++) P.circle(c, dx0 + i * dd * 2, y0 + 36, 5.5, { role: i < s.w.mv ? "q1" : "ink3", fill: i < s.w.mv, width: 1.5 });
  }

  // ── ritu: the path seen a little from the side, the leaning axis, and each half's sunlight ──
  function drawRitu(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 5 });
    const patchH = clamp(H * 0.38, 112, 160), oh = H - patchH - 8;
    const cx = X + CW / 2, cy = Y + oh / 2 + 6, rx = Math.min(CW * 0.36, 230), ry = Math.min(rx * 0.45, oh / 2 - 44);
    // the Sun a little to the left: the left of the path (NEAR) is closest to it
    const sunX = cx - rx * 0.14;
    P.stroke(c, Array.from({ length: 49 }, (_, i): [number, number] => [cx + rx * Math.cos((i / 48) * TAU), cy + ry * Math.sin((i / 48) * TAU)]), { role: "ink3", width: 1.5, dash: [4, 5] });
    sunAt(c, sunX, cy, clamp(ry - 30, 10, 18));
    const at = (q: number): [number, number] => { const a = (q * TAU) / PATH; return [cx + rx * Math.cos(a), cy - ry * Math.sin(a)]; };
    // the closest point (the kit: early January, the northern winter)
    const [nx, ny] = at(NEAR);
    P.circle(c, nx, ny, 4, { role: "ink2", fill: true });
    P.stroke(c, [[nx, ny + 6], [nx + 8, cy + ry + 2]], { role: "ink3", width: 1 });
    P.textFit(c, W("aakash.closest"), nx + 40, cy + ry + 22, 96, 36, { size: 14, role: s.why === "near_winter" ? "look" : "ink2", weight: 700 });
    // the Earth: its axis leans the same way on screen all the way round (it keeps pointing the same way in space)
    pivot = { x: cx, y: cy };
    const pos = glide("pos", PATH), ea = (pos * TAU) / PATH, ex = cx + rx * Math.cos(ea), ey = cy - ry * Math.sin(ea), er = 19;
    ball(c, ex, ey, er, Math.atan2(-(cy - ey), sunX - ex), "water");
    const lean = -0.4, ax = Math.sin(lean), ay = -Math.cos(lean);   // the axis on screen: up and to the left
    P.stroke(c, [[ex - ax * (er + 10), ey - ay * (er + 10)], [ex + ax * (er + 12), ey + ay * (er + 12)]], { role: "ink", width: 2.5 });
    P.stroke(c, [[ex - ay * er, ey + ax * er], [ex + ay * er, ey - ax * er]], { role: "ink3", width: 1.2, dash: [3, 3] });
    P.text(c, W("aakash.n"), ex + ax * (er + 22), ey + ay * (er + 18), { size: 14, role: "ink", weight: 800 });
    if (s.why === "axis_same") {
      // the axis the child tried: towards the Sun, dashed; the real one stays
      const ta = Math.atan2(cy - ey, sunX - ex), tx = Math.cos(ta) * 0.5 + ax * 0.5, ty = Math.sin(ta) * 0.5 + ay * 0.5, tl = Math.hypot(tx, ty) || 1;
      P.stroke(c, [[ex, ey], [ex + (tx / tl) * (er + 14), ey + (ty / tl) * (er + 14)]], { role: "look", width: 2, dash: [3, 3] });
      P.magnifier(c, ex + ax * (er + 12) + 12, ey + ay * (er + 12), 16);
    }
    if (!s.done) api.target("earth", ex - 24, ey - 24, 48, 48);
    if (s.why === "near_winter" || s.why === "not_here") P.magnifier(c, ex + er + 6, ey + er, 16);
    // the patches: each half's share of the same bundle of light on graph paper
    const py = Y + H - patchH - 6, pw = (CW - 24) / 2;
    (["N", "S"] as Half[]).forEach((half, i) => patch(c, X + 8 + i * (pw + 8), py, pw, patchH, half));
  }
  /** one half's light on graph paper: the same bundle of rays; straight lights fewer squares brightly, slant more squares dimly */
  function patch(c: CanvasRenderingContext2D, x: number, y: number, pw: number, ph: number, half: Half): void {
    const P = api.P, s = st(), fall = fallOf(half, s.w.pos), lit = fall === "straight" ? 2 : fall === "middle" ? 3 : 4;
    const target = goal === "dhoop" && dhoopRow(p).card[s.w.next] === half && !s.done;
    const looked = (s.why === "spread" || s.why === "spread_some") && target;
    P.body(c, x, y, pw, ph, { role: "panel", r: 10, seed: half === "N" ? 31 : 32, state: looked ? "look" : target ? "selected" : "idle" });
    P.textFit(c, W(`aakash.half.${half}`), x + pw / 2, y + 14, pw - 10, 22, { size: 14, role: "ink", weight: 800 });
    const cols = 6, sq = Math.min(22, (pw - 16) / cols), gx = x + (pw - cols * sq) / 2, gy = y + ph - sq - 30;
    const first = Math.floor((cols - lit) / 2), k = 1 / lit;
    for (let i = 0; i < cols; i++) {
      const on = i >= first && i < first + lit;
      P.fillPath(c, (q) => q.rect(gx + i * sq, gy, sq, sq), on ? "glow" : "paper", { outline: "ink3", width: 1, alpha: on ? 0.25 + 1.3 * k : 0.6 });
    }
    // the bundle of rays: four parallel lines, as wide as the straight patch; tilted by the fall
    const tilt = fall === "straight" ? 0 : fall === "middle" ? 0.84 : 1.15, x0 = gx + first * sq, x1 = x0 + lit * sq;
    for (let j = 0; j < 4; j++) {
      const bx = lerp(x0, x1, (j + 0.5) / 4), top = y + 30, len = gy - top;
      P.stroke(c, [[bx - Math.tan(tilt) * len * 0.6, top], [bx, gy]], { role: "q4", width: 2 });
    }
    P.textFit(c, W(`aakash.fall.${fall}`), x + pw / 2, y + ph - 13, pw - 10, 22, { size: 14, role: "ink2", weight: 700 });
    // dhoop: the ice block on the patch (melted once its item is done)
    if (goal === "dhoop") {
      const card = dhoopRow(p).card, mine = card.map((hh, j) => (hh === half ? j : -1)).filter((j) => j >= 0);
      if (mine.length) {
        const left = mine.filter((j) => j >= s.w.next).length, ix = gx + (cols / 2) * sq, iy = gy - 4;
        if (left) P.fillPath(c, (q) => q.rect(ix - 12, iy - 18, 24, 18), "ice", { outline: "ink2", width: 1.5 });
        else P.fillPath(c, (q) => q.ellipse(ix, iy - 2, 18, 4, 0, 0, TAU), "water", { outline: null, alpha: 0.8 });
        if (looked) P.magnifier(c, ix + 22, iy - 20, 16);
      }
    }
  }

  // ── grahan: the Sun's light, the Earth, the Moon on its way; the strip from the side; the Moon from the Earth ──
  function drawGrahan(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 6 });
    const sideH = clamp(H * 0.28, 90, 130), topH = H - sideH - 8;
    // the top row (the Moon from the Earth) stays clear of the Moon's path and the Sun
    const ex = X + CW * 0.56, ey = Y + topH / 2 + 4, Rm = Math.min(CW * 0.3, topH / 2 - 32), er = 16, mr = 9;
    const b4 = last.before, k = glide("k", MOON), on = onLine(s.w.k, s.w.pos), moving = !!b4 && (b4.k !== s.w.k || b4.pos !== s.w.pos) && prog() < 1;
    // the Sun's light from the left
    const sr = clamp((topH / 2 - 38) / 1.3, 10, 26);
    sunAt(c, X + 22, ey, sr);
    P.stroke(c, [[X + 22 + sr + 8, ey], [ex - Rm - 14, ey]], { role: "ink3", width: 1.5, dash: [5, 6] });
    // the Earth's shadow, away from the Sun
    P.fillPath(c, (q) => { q.moveTo(ex, ey - er); q.lineTo(X + CW - 8, ey - er * 0.7); q.lineTo(X + CW - 8, ey + er * 0.7); q.lineTo(ex, ey + er); q.closePath(); }, "shadow", { outline: null, alpha: 0.35 });
    // the Moon's path, and where it crosses the line this month (two places; they turn as the months pass)
    pivot = { x: ex, y: ey };
    P.circle(c, ex, ey, Rm, { role: "ink3", width: 1.5 });
    for (const q of [2 * s.w.pos, 2 * s.w.pos + 4]) { const a = Math.PI + (q * TAU) / MOON; P.fillPath(c, (qq) => qq.rect(ex + Rm * Math.cos(a) - 4, ey - Rm * Math.sin(a) - 4, 8, 8), "red", { outline: "ink3", width: 1 }); }
    ball(c, ex, ey, er, Math.PI, "water");
    const ma = Math.PI + (k * TAU) / MOON, mx = ex + Rm * Math.cos(ma), my = ey - Rm * Math.sin(ma);
    // the Moon's shadow towards the Earth at new moon (faint when it passes above or below the line)
    if (s.w.k === NEW_AT && !moving) P.fillPath(c, (q) => { q.moveTo(mx, my - mr); q.lineTo(ex - er, ey - 3); q.lineTo(ex - er, ey + 3); q.lineTo(mx, my + mr); q.closePath(); }, "shadow", { outline: null, alpha: on ? 0.7 : 0.18 });
    const eclLunar = s.w.k === FULL_AT && on && !moving;
    P.fillPath(c, (q) => q.arc(mx, my, mr, 0, TAU), eclLunar ? "rust" : "white", { outline: "ink2", width: 1.5 });
    if (!eclLunar) P.fillPath(c, (q) => { q.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2); q.closePath(); }, "shadow", { outline: null, alpha: 0.55 });
    if (s.w.k === NEW_AT && on && !moving) P.fillPath(c, (q) => q.arc(ex - er + 3, ey, 5, 0, TAU), "black", { outline: null, alpha: 0.85 });
    if (!s.done) api.target("moon", mx - 24, my - 24, 48, 48);
    if (["off_line", "phase", "wrong_side"].includes(s.why)) P.magnifier(c, mx + mr + 6, my - mr - 4, 16);
    P.text(c, W("aakash.earth"), ex, ey + er + 14, { size: 14, role: "ink", weight: 700 });
    // the Moon from the Earth (its phase: how much of its sunlit half faces us)
    const fx = X + 22, fy = Y + 20, fw = Math.min(CW * 0.6, 220);
    phase(c, fx, fy, 11, s.w.k, eclLunar);
    P.textFit(c, W("aakash.seen"), fx + 18 + fw / 2, fy, fw, 20, { size: 14, role: "ink2", weight: 700 });
    // from the side: the Sun-Earth line, the Moon above, below or on it
    const sy = Y + topH + 4, lx0 = X + 16, lx1 = X + CW - 16, ly = sy + sideH / 2 + 8, hs = sideH * 0.2;
    P.body(c, X + 6, sy, CW - 12, sideH - 4, { role: "panel", r: 10, seed: 7, state: s.why === "off_line" ? "look" : "idle" });
    P.textFit(c, W("aakash.side"), X + CW / 2, sy + 12, CW - 30, 20, { size: 14, role: "ink2", weight: 700 });
    P.stroke(c, [[lx0 + 20, ly], [lx1, ly]], { role: "ink3", width: 1.5, dash: [6, 4] });
    P.fillPath(c, (q) => q.arc(lx0 + 10, ly, 9, 0, TAU), lamp ? "glow" : "sun", { outline: "ink3", width: 1 });
    const sex = lerp(lx0, lx1, 0.62), sRm = (lx1 - lx0) * 0.24;
    P.fillPath(c, (q) => q.rect(sex, ly - 6, lx1 - sex, 12), "shadow", { outline: null, alpha: 0.3 });
    P.fillPath(c, (q) => q.arc(sex, ly, 9, 0, TAU), "water", { outline: "ink2", width: 1.2 });
    const hgt = moving && b4 ? lerp(heightOf(b4.k, b4.pos), heightOf(s.w.k, s.w.pos), prog()) : heightOf(s.w.k, s.w.pos);
    const smx = sex + sRm * Math.cos(ma), smy = ly - hgt * hs;
    P.fillPath(c, (q) => q.arc(smx, smy, 6, 0, TAU), eclLunar ? "rust" : "white", { outline: "ink2", width: 1.2 });
    if (s.w.k === NEW_AT && !moving) P.stroke(c, [[smx + 6, smy], [sex - 9, smy]], { role: on ? "ink" : "ink3", width: on ? 3 : 1.5, dash: on ? undefined : [3, 3] });
    if (s.why === "off_line") P.textFit(c, W(hgt > 0 ? "aakash.above" : "aakash.below"), smx - 76, smy, 120, 20, { size: 14, role: "look", weight: 800 });
  }
  /** the Moon as seen from the Earth: its place k round the Earth decides how much of its lit half faces us */
  function phase(c: CanvasRenderingContext2D, x: number, y: number, r: number, k: number, ecl: boolean): void {
    const P = api.P;
    P.fillPath(c, (q) => q.arc(x, y, r, 0, TAU), ecl ? "rust" : "shadow", { outline: "ink2", width: 1.5, alpha: ecl ? 1 : 0.8 });
    if (ecl) return;
    // lit fraction: 0 at new moon (k 0), 1 at full (k 4); waxing lit on the right
    const f = (1 - Math.cos((k * TAU) / MOON)) / 2, waxing = k > 0 && k < MOON / 2, side = waxing ? 1 : -1;
    if (f <= 0.01) return;
    P.fillPath(c, (q) => {
      q.arc(x, y, r, -Math.PI / 2, Math.PI / 2, side < 0);
      q.ellipse(x, y, Math.abs(1 - 2 * f) * r, r, 0, Math.PI / 2, -Math.PI / 2, f > 0.5 ? side < 0 : side > 0);
      q.closePath();
    }, "white", { outline: null });
  }

  // ── the tool strip ──
  function drawTools(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), n = tools.length, tw = (g.cw - (n - 1) * g.gap) / n;
    tools.forEach((m, i) => {
      const x = g.x0 + i * (tw + g.gap), y = g.toolY, on = last.m === m && api.t - actAt < HOLD;
      if (!s.done) api.target(`tool-${m}`, x, y, tw, g.toolH);
      P.body(c, x, y, tw, g.toolH, { role: "q2", r: 12, seed: 80 + i, state: on ? "selected" : s.done ? "dim" : "idle" });
      P.textFit(c, W(`aakash.tool.${m}`), x + tw / 2, y + g.toolH / 2, tw - 8, g.toolH - 6, { size: 15, on: "q2", weight: 800 });
    });
  }

  function draw(c: CanvasRenderingContext2D): void {
    const g = geo();
    drawStrip(c, g);
    switch (goal) {
      case "din": drawDin(c, g); break;
      case "saal": drawSaal(c, g); break;
      case "jhuk": case "dhoop": drawRitu(c, g); break;
      case "chaaya": case "kab": drawGrahan(c, g); break;
    }
    drawTools(c, g);
  }

  function goalLine(): string {
    const s = st();
    if (s.done) return W(`aakash.done.${goal}`);
    if (s.why) return W(`aakash.why.${s.why}`, whyVals());
    const i = s.w.next;
    switch (goal) {
      case "din": { const r = dinRow(p), it = r.card[i]; return W("aakash.goal.din", { when: W(`aakash.when.${it.when}`), place: W(`aakash.place.${PLACE_KEY[r.places[it.at]]}`) }); }
      case "saal": return W(`aakash.goal.saal.${saalRow(p).card[i]}`);
      case "jhuk": { const it = jhukRow(p).card[i]; return W(`aakash.goal.jhuk.${it.half}.${it.season}`); }
      case "dhoop": return W(`aakash.goal.dhoop.${dhoopRow(p).card[i]}`);
      default: return W(`aakash.goal.${goal}.${grahanRow(p).card[i]}`);
    }
  }
  function whyVals(): Record<string, string | number> {
    const s = st();
    if (goal === "din") { const r = dinRow(p), it = r.card[Math.min(s.w.next, r.card.length - 1)]; return { when: W(`aakash.when.${it.when}`), place: W(`aakash.place.${PLACE_KEY[r.places[it.at]]}`) }; }
    if (goal === "chaaya" || goal === "kab") return { way: W(heightOf(s.w.k, s.w.pos) > 0 ? "aakash.above" : "aakash.below") };
    return {};
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [{ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) }];
    // never "your move": the button must not hint when the moment has come (the child decides it has)
    if (goal !== "dhoop") out.push({ id: "done", label: W(`aakash.claim.${goal}`), aria: W(`aakash.claim.${goal}`), kind: "primary", group: "go", onPress: () => act({ kind: "done" }) });
    return out;
  }
  void momentOf;
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal: goalLine, readouts, controls, react };
  return view;
};
