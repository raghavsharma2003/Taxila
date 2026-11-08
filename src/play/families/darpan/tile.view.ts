// Darpan · tile, the 2D view (r7 tilings2). A floor seen from above with one point marked on it. The tray (the buttons) lays
// a copy of a tile round the point: its corner on the point, its first edge on the last copy's edge, so the copies go round
// one after another; a copy tapped on the floor is lifted. Tiles already round the point (close) are drawn plain. "Tile
// it" sweeps once round the point adding the corners: the gap that is left shows as an open wedge with its degrees, an
// overlap as the wedge the last copy runs over, a closed corner as a ring (and, for one kind of tile, the floor it repeats
// into fades in round it). Fade 1 writes each corner's degrees at the point and on the tray; fade 2 on the tray only; fade
// 3 the names alone. Nothing moves on a clock: the law answers at once on the go and the world catches up (reduced motion:
// no sweep).
import type { DarpanAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import type { Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import type { V } from "./darpan.logic.ts";
import { angleOf, cornersOf, edgeToEdge, floorOf, isReg, missOf, reachOf, rosette, shapeOf, sumOf, type TileP, type TileState } from "./tile.logic.ts";

const SWEEP = 1.4;        // s for the sweep round the point (cosmetic: the law has already answered)
const TRAY_ROLE: Role[] = ["q1", "q2", "q4"];
const LETTERS = "abcd";

export const makeTileView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<TileP, TileState, DarpanAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const fs = () => (api.young ? 16 : 14);
  const reach = reachOf(p);
  const uneven = p.tray.findIndex((t) => !isReg(t));
  let w = 320, h = 420, cx = 160, cy = 220, sc = 20, box = 150, bx = 160, by = 220;
  /** the floor the closed corner repeats into, worked out once per solve */
  let floor: { key: string; tiles: V[][] } | null = null;
  /** the last go's sweep */
  let anim: { t0: number; dur: number; sum: number; miss: number } | null = null;
  const act = (a: DarpanAct) => { ctl.dispatch(a); deps.changed(); };
  const animK = () => (anim ? (api.reduced ? 1 : clamp((api.t - anim.t0) / anim.dur, 0, 1)) : 1);
  const shown = () => st().ended && animK() >= 1;
  const busy = () => !!anim && animK() < 1;

  // ───────────────────────────── layout ─────────────────────────────
  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    const f = fs();
    box = Math.max(60, Math.min((w - 24) / 2, (h - 20) / 2));
    bx = w / 2; by = 10 + (h - 20) / 2;
    // the copies reach out `reach` from the point; a little room for the gap chip. With an uneven tile its picture takes the
    // floor's top-left corner, so the point moves a little down and right of the middle
    const off = uneven >= 0 ? box * 0.1 : 0;
    sc = Math.max(6, (box - off - f * 0.9 - 6) / reach);
    cx = bx + off; cy = by + off;
  }
  const XY = (q: V): [number, number] => [cx + q[0] * sc, cy - q[1] * sc];
  const ray = (deg: number, r: number): [number, number] => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];

  // ───────────────────────────── input: a copy tapped is lifted ─────────────────────────────
  const inside = (x: number, y: number, pts: [number, number][]) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  let downAt: [number, number] | null = null;
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done || busy()) { downAt = null; return; }
    if (kind === "down") { downAt = api.hit(x, y) === "floor" ? [x, y] : null; return; }
    if (kind !== "up" || !downAt) { if (kind === "cancel") downAt = null; return; }
    const moved = Math.hypot(x - downAt[0], y - downAt[1]);
    downAt = null;
    if (moved > 18) return;
    const ro = rosette(p, st().put).filter((r) => !r.laid);
    for (let j = ro.length - 1; j >= 0; j--) if (inside(x, y, ro[j].pts.map(XY))) { act({ kind: "lift", j }); return; }
  }

  // ───────────────────────────── the law answered ─────────────────────────────
  function react(_ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as DarpanAct | undefined;
    if (!last) return;
    const s = st();
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { api.sfx("slide"); anim = { t0: api.t, dur: SWEEP, sum: sumOf(p, s.put), miss: missOf(p, s.put) }; }
    else if (last.kind === "undo" || last.kind === "lift") { api.sfx("tap"); anim = null; }
    else { api.sfx("land"); anim = null; }
    api.invalidate(); deps.changed();
  }
  let landedOnce = false;
  function update(_dt: number): void {
    if (!anim) return;
    if (animK() < 1) { api.invalidate(); landedOnce = false; return; }
    if (!landedOnce && st().ended) {
      landedOnce = true;
      if (st().done) { api.sfx("good"); api.fx.burst(cx, cy, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed(); api.invalidate();
    }
  }

  // ───────────────────────────── drawings ─────────────────────────────
  function poly(c: CanvasRenderingContext2D, pts: [number, number][], role: Role, alpha: number): void {
    c.save(); c.globalAlpha = alpha; c.fillStyle = api.P.color(role); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); c.restore();
  }
  /** a wedge at the point from heading a0 to a1 (degrees, counter-clockwise), radius r */
  function wedge(c: CanvasRenderingContext2D, a0: number, a1: number, r: number, role: Role, alpha: number): void {
    c.save(); c.globalAlpha = alpha; c.fillStyle = api.P.color(role); c.beginPath(); c.moveTo(cx, cy);
    c.arc(cx, cy, r, -a0 * Math.PI / 180, -a1 * Math.PI / 180, true); c.closePath(); c.fill(); c.restore();
  }
  function arcLine(c: CanvasRenderingContext2D, a0: number, a1: number, r: number, role: Role, width: number): void {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 6)), pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) pts.push(ray(a0 + ((a1 - a0) * i) / n, r));
    api.P.stroke(c, pts, { role, width });
  }
  /** a copy's corner at the point: its letter (an uneven tile) and, on fade 1, its degrees, inside the wedge */
  function cornerLabel(c: CanvasRenderingContext2D, pts: V[], from: number, ang: number, letter: string | null, deg: number): void {
    // inside the copy: toward its middle, never past it (a small square's label stays on the square)
    const ctr = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length], [0, 0]);
    const f = fs(), mid = from + ang / 2, r = clamp(Math.hypot(ctr[0], ctr[1]) * sc * 0.8, f * 1.3, f * 2.6);
    const parts: string[] = [];
    if (letter) parts.push(letter);
    if (p.labels === 1) parts.push(`${deg}°`);
    if (!parts.length) return;
    const [x, y] = ray(mid, r);
    api.P.text(c, parts.join(" "), x, y, { size: f * 0.85, role: "ink", weight: 700, align: "center", baseline: "middle" });
  }
  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shown(), k = animK(), f = fs();
    P.body(c, bx - box, by - box, 2 * box, 2 * box, { role: "panel", r: 10 });
    if (!s.done && !busy()) api.target("floor", bx - box, by - box, 2 * box, 2 * box);
    const ro = rosette(p, s.put);
    // the floor one kind repeats into (alone / any, once the corner closed with its copies edge to edge)
    const floorK = s.done && anim ? clamp((k - 0.55) / 0.45, 0, 1) : s.done ? 1 : 0;
    if (floorK > 0 && p.goal !== "close" && ro.length && edgeToEdge(p, s.put)) {
      const key = JSON.stringify(ro[0].pts);
      if (floor?.key !== key) floor = { key, tiles: floorOf(ro[0].pts, (box * 1.5) / sc) };
      c.save(); c.beginPath(); c.rect(bx - box + 2, by - box + 2, 2 * box - 4, 2 * box - 4); c.clip();
      for (const t of floor.tiles) {
        const pts = t.map(XY);
        poly(c, pts, TRAY_ROLE[ro[0].t] ?? "q1", 0.22 * floorK);
        P.stroke(c, pts, { role: "ink2", width: 1, closed: true, alpha: 0.6 * floorK });
      }
      c.restore();
    }
    // the tiles round the point
    ro.forEach((r) => {
      const pts = r.pts.map(XY), role: Role = r.laid ? "ink3" : TRAY_ROLE[r.t] ?? "q1";
      poly(c, pts, role, r.laid ? 0.32 : 0.55);
      P.stroke(c, pts, { role: r.laid ? "ink2" : "ink", width: 2, closed: true });
    });
    ro.forEach((r) => cornerLabel(c, r.pts, r.from, r.ang, !r.laid && cornersOf(p.tray[r.t]) > 1 ? LETTERS[r.c] : null, r.ang));
    // the sweep of the last go, adding the corners round the point
    const total = anim ? anim.sum : 0, rr = Math.min(box * 0.9, sc * reach * 0.3 + f * 1.4);
    if (anim && s.ended && k < 1) {
      const a = p.tilt + total * k;
      arcLine(c, p.tilt, a, rr, "you", 3);
      P.stroke(c, [[cx, cy], ray(a, rr + 6)], { role: "you", width: 3 });
    }
    if (end && s.ended && anim) {
      const miss = anim.miss, rw = Math.min(box * 0.92, sc * reach * 0.75);
      if (miss > 0) {
        wedge(c, p.tilt + total, p.tilt + 360, rw, "look", 0.45);
        P.stroke(c, [ray(p.tilt + total, rw), [cx, cy], ray(p.tilt + 360, rw)], { role: "look", width: 2.5 });
      } else if (miss < 0) {
        wedge(c, p.tilt, p.tilt - miss, rw, "look", 0.5);
        arcLine(c, p.tilt, p.tilt - miss, rw, "look", 3);
      } else arcLine(c, p.tilt, p.tilt + 360, rr, "good", 3.5);
      // the law's answer: by the gap or the overlap it measures; a closed corner's at the floor's foot (the copies stay clear)
      const mid = miss > 0 ? p.tilt + total + miss / 2 : p.tilt - miss / 2;
      const [x, y] = miss ? ray(mid, Math.min(box - f * 1.6, rw * 0.62)) : [bx, by + box - f * 1.4];
      P.chip(c, miss > 0 ? W("darpan.tile.gap", { d: miss }) : miss < 0 ? W("darpan.tile.over", { d: -miss }) : W("darpan.tile.closed"), clamp(x, bx - box + f * 3.4, bx + box - f * 3.4), clamp(y, by - box + f, by + box - f), { size: f, role: miss ? "look" : "good" });
    }
    // the point
    P.circle(c, cx, cy, 5, { role: "ink", fill: true });
    P.circle(c, cx, cy, 2, { role: "panel", fill: true });
    // the uneven tile itself, its corners named (any)
    if (uneven >= 0) specimen(c);
    if (end && s.ended) {
      const m = Math.min(26, box * 0.16), x = bx + box - m * 0.8, y = by - box + m * 0.8;
      if (s.done) P.tick(c, x, y, m, 1); else P.magnifier(c, x, y, m);
    }
  }
  /** the uneven tile drawn small on a card in the floor's corner, its corners lettered (and, on fades 1-2, their degrees) */
  function specimen(c: CanvasRenderingContext2D): void {
    const P = api.P, t = p.tray[uneven], pts = shapeOf(t), f = fs(), fz = f * 0.8;
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const size = Math.min(box * 0.4, 96), k = size / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    // the picture at (0, 0) first, each label outside its corner; then the card is fitted round both
    const sp: [number, number][] = pts.map((q) => [(q[0] - Math.min(...xs)) * k, (Math.max(...ys) - q[1]) * k]);
    const ctr = sp.reduce((a, q) => [a[0] + q[0] / sp.length, a[1] + q[1] / sp.length], [0, 0]);
    c.save(); c.font = `700 ${fz}px ${api.art.font.ui}`;
    const labs = sp.map((q, i) => {
      const dx = q[0] - ctr[0], dy = q[1] - ctr[1], d = Math.hypot(dx, dy) || 1, s = p.labels <= 2 ? `${LETTERS[i]} ${angleOf(t, i)}°` : LETTERS[i];
      return { s, x: q[0] + (dx / d) * f * 1.7, y: q[1] + (dy / d) * f * 0.8, hw: c.measureText(s).width / 2 + 2 };
    });
    c.restore();
    const x0 = Math.min(0, ...labs.map((l) => l.x - l.hw)), x1 = Math.max(size, ...labs.map((l) => l.x + l.hw));
    const y0 = Math.min(0, ...labs.map((l) => l.y - fz * 0.7)), y1 = Math.max(...sp.map((q) => q[1]), ...labs.map((l) => l.y + fz * 0.7));
    const ox = bx - box + 10 - x0, oy = by - box + 10 - y0;
    // on a card of its own, so a floor or a copy under it never muddles it
    P.body(c, bx - box + 4, by - box + 4, x1 - x0 + 12, y1 - y0 + 12, { role: "panel", r: 8 });
    const at = sp.map(([x, y]) => [x + ox, y + oy] as [number, number]);
    poly(c, at, TRAY_ROLE[uneven] ?? "q1", 0.4);
    P.stroke(c, at, { role: "ink", width: 1.6, closed: true });
    for (const l of labs) P.text(c, l.s, l.x + ox, l.y + oy, { size: fz, role: "ink", weight: 700, align: "center", baseline: "middle" });
  }

  // ───────────────────────────── chrome ─────────────────────────────
  function goal(): string {
    const s = st();
    if (s.ended && !s.done && shown()) return W(missOf(p, s.put) > 0 ? "darpan.again.gap" : "darpan.again.overlap");
    return W(`darpan.goal.${p.goal}`);
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st();
    if (s.done) return [];
    const out: ControlSpec[] = [];
    const round = sumOf(p, s.put) >= 360;
    p.tray.forEach((t, ti) => {
      const kindLocked = p.goal !== "close" && s.put.length > 0 && s.put[0].t !== ti;
      const dis = busy() || round || kindLocked || s.put.length >= 12;
      if (isReg(t)) {
        const name = W(`darpan.tile.n${t.n}`);
        out.push({ id: `lay${ti}`, label: p.labels <= 2 ? `${name} ${angleOf(t, 0)}°` : name, aria: `lay a ${name} round the point`, kind: "secondary", group: "tray", disabled: dis, onPress: () => act({ kind: "lay", t: ti }) });
      } else for (let ci = 0; ci < cornersOf(t); ci++) {
        const name = W("darpan.tile.corner", { c: LETTERS[ci] });
        out.push({ id: `lay${ti}c${ci}`, label: p.labels <= 2 ? `${name} ${angleOf(t, ci)}°` : name, aria: `lay a copy with ${name} at the point`, kind: "secondary", group: "tray", disabled: dis, onPress: () => act({ kind: "lay", t: ti, c: ci }) });
      }
    });
    const ready = s.put.length > 0 && !s.ended && !busy();
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: busy() || s.depth === 0, onPress: () => act({ kind: "undo" }) });
    out.push({ id: "run", label: W("darpan.tile.run"), aria: "go: the corner's angles are added", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
