// Taraazu · weigh and fill, the 2D view (round 7). Weigh: a pan balance on a post. The parcel (its label written on it) sits on
// the left pan; the weight box is a tray of real weights under the scale (how many of each are left on its tile). Tap a
// weight, or drag it onto the right pan, to load it; tap or drag a weight on the pan to take it back. While loading the beam is
// LOCKED level (two stops under it): nothing tells the child the total. "Tolo" pulls the stops and the beam swings to the
// heavier side as a damped pendulum in real time (api.t), or stays level. Fill: a vessel with the label on its tag and a
// counter of measuring jugs; a tap (or a drag onto the vessel) pours one full jug and the water rises; "Dekho" checks.
// Only at fade 1 a miss shows "lagbhag N kam / zyada" (and the fill line is drawn); at fade 2-3 only which way it is off.
import type { Moment, WeighAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { labelOf, modeOf, sizeLabel, sumOf, truthOf, type WeighParams, type WeighState } from "./weigh.logic.ts";

interface Box { x: number; y: number; w: number; h: number }
/** a line that opens with a filled-in word ("pyaaz ki bori …") still starts like a sentence */
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function rrect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  g.moveTo(x + k, y); g.arcTo(x + w, y, x + w, y + h, k); g.arcTo(x + w, y + h, x, y + h, k); g.arcTo(x, y + h, x, y, k); g.arcTo(x, y, x + w, y, k); g.closePath();
}
interface Item extends Box { size: number; i: number }
/** the drawn size of a weight (w, h) by its mass: a kg weight is the biggest iron block, a 10 g one a small brass slug */
const DIM: Record<number, [number, number]> = { 1000: [44, 32], 500: [38, 28], 200: [32, 24], 100: [29, 21], 50: [26, 19], 20: [23, 17], 10: [20, 15] };
const MAXA = 0.15;              // rad, the beam's full tilt
const OM = 8.5, ZETA = 0.3;     // the beam as a damped pendulum (rad/s, damping ratio): one clear overshoot, settled in ~2 s
const FLY = 0.32, POUR = 0.6;   // s

export const makeWeighView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<WeighParams, WeighState, WeighAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, mode = modeOf(p), fill = mode === "fill", fade = level.fade;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const item = W(`taraazu.${mode}.item.${p.ctx}`), label = labelOf(p), truth = truthOf(p);
  const sizes = p.box.map((b) => b.size);
  const st = () => ctl.state;
  let w = 300, h = 440;
  // the tray (weight box / jug counter)
  let trayTop = 286, tileW = 65, tileH = 56, cols = 4;
  // the balance
  let pivot = { x: 150, y: 90 }, half = 86, hang = 116, panW = 108;
  // the vessel
  let vx = 50, vy = 64, vw = 150, vh = 212;
  // motion
  let swing = { from: 0, to: 0, t0: -1 };
  let fly: { x: number; y: number; t0: number; idx: number } | null = null;
  let water = { from: 0, to: 0, t0: -1 };
  let pourAt = -1, pourJug = 0, solvedAt = -1, lastAnim = -1;
  let drag: { size: number; from: "box" | "pan"; x: number; y: number; x0: number; y0: number; moved: boolean } | null = null;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    const n = sizes.length;
    cols = clamp(Math.floor((w - 8) / 73), 3, n);
    const rows = Math.ceil(n / cols);
    tileW = Math.min(120, (w - 16 - 8 * (cols - 1)) / cols); tileH = 56;
    trayTop = h - 8 - rows * tileH - (rows - 1) * 8 - 26;
    const top = 34, bottom = trayTop - 10;
    if (fill) {
      vw = clamp(w * 0.5, 130, 260);
      vx = Math.max(12, w * 0.42 - vw / 2);
      vy = top + 30;
      vh = Math.max(110, bottom - vy - 4);
    } else {
      panW = clamp(w * 0.36, 108, 240);
      half = Math.min(w * 0.34, w / 2 - panW / 2 - 10);
      pivot = { x: w / 2, y: top + clamp((bottom - top) * 0.22, 44, 120) };
      hang = clamp((bottom - pivot.y) * 0.62, 56, 170);
    }
  }
  const tileOf = (k: number): Box => {
    const r = Math.floor(k / cols), c = k % cols, inRow = Math.min(cols, sizes.length - r * cols);
    const rowW = inRow * tileW + (inRow - 1) * 8, x0 = (w - rowW) / 2;
    return { x: x0 + c * (tileW + 8), y: trayTop + 26 + r * (tileH + 8), w: tileW, h: tileH };
  };
  const leftOf = (size: number) => (p.box.find((b) => b.size === size)?.n ?? 0) - st().pan.filter((x) => x === size).length;

  // ── the balance's geometry ──
  function angNow(): number {
    if (swing.t0 < 0 || api.reduced) return swing.to;
    const t = api.t - swing.t0, wd = OM * Math.sqrt(1 - ZETA * ZETA), e = Math.exp(-ZETA * OM * t);
    return swing.to + (swing.from - swing.to) * e * (Math.cos(wd * t) + ((ZETA * OM) / wd) * Math.sin(wd * t));
  }
  /** where the beam is going: level while locked, else toward the heavier side (+ = the weights' pan goes down) */
  const targetAng = () => { const s = st(); return s.locked ? 0 : Math.sign(sumOf(s.pan) - truth) * MAXA; };
  const endOf = (side: -1 | 1, a: number) => ({ x: pivot.x + side * half * Math.cos(a), y: pivot.y + side * half * Math.sin(a) });
  const plateY = (side: -1 | 1, a: number) => endOf(side, a).y + hang;
  const panZone = (): Box => { const e = endOf(1, angNow()); return { x: e.x - panW / 2 - 6, y: e.y + 14, w: panW + 12, h: hang + 14 }; };
  const inBox = (b: Box, x: number, y: number) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  /** the right pan's weights, heaviest at the bottom, packed in rows; shrunk until the pile fits under the beam */
  function pile(pan: number[], cx: number, base: number): Item[] {
    const its = pan.map((size, i) => ({ size, i })).sort((a, b) => b.size - a.size || a.i - b.i);
    const maxW = panW - 10, maxH = hang - 22;
    let out: Item[] = [];
    for (let k = 1; k >= 0.4; k -= 0.06) {
      out = [];
      let row: Item[] = [], rowW = 0, rowH = 0, y = base;
      const flush = () => { let x = cx - rowW / 2; for (const r of row) { r.x = x; r.y = y - r.h; x += r.w + 2; out.push(r); } y -= rowH + 2; row = []; rowW = 0; rowH = 0; };
      for (const it of its) {
        const [dw, dh] = DIM[it.size] ?? [24, 18], ws = clamp(panW / 130, 1, 1.5), iw = dw * k * ws, ih = dh * k * ws;
        if (row.length && rowW + 2 + iw > maxW) flush();
        row.push({ ...it, x: 0, y: 0, w: iw, h: ih }); rowW += (row.length > 1 ? 2 : 0) + iw; rowH = Math.max(rowH, ih);
      }
      if (row.length) flush();
      if (base - y <= maxH) break;
    }
    return out;
  }
  // ── the vessel ──
  function waterNow(): number {
    if (water.t0 < 0 || api.reduced) return water.to;
    const u = clamp((api.t - water.t0 - 0.12) / (POUR - 0.12), 0, 1);
    return lerp(water.from, water.to, ease.inOut(u));
  }
  const levelY = (ml: number) => vy + vh - 5 - (ml / p.cap) * (vh - 10);

  function act(a: WeighAct, from: { x: number; y: number } | null = null): void {
    if (a.kind === "load") {
      const k = sizes.indexOf(a.weight), t = tileOf(Math.max(0, k));
      fly = { x: from?.x ?? t.x + t.w / 2, y: from?.y ?? t.y + 18, t0: api.t, idx: st().pan.length };
    }
    ctl.dispatch(a); deps.changed();
  }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as WeighAct | undefined, s = st();
    lastAnim = api.t;
    if (last) {
      if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); fly = null; }
      else if (last.kind === "load") api.sfx("drop");
      else if (last.kind === "unload") api.sfx("tap");
      else if (last.kind === "pour") { api.sfx("pour"); pourAt = api.t; pourJug = last.jug; water = { from: waterNow(), to: sumOf(s.pan), t0: api.t }; }
      else if (last.kind === "undo") { api.sfx("tap"); fly = null; if (fill) water = { from: waterNow(), to: sumOf(s.pan), t0: api.t - 0.12 }; }
      else if (last.kind === "weigh" && refused === "missed" && !fill) api.sfx("tilt");
    }
    if (!fill) { const to = targetAng(); if (to !== swing.to) swing = { from: angNow(), to, t0: api.t }; }
    for (const m of ms) {
      if (m.kind === "solved") {
        solvedAt = api.t; api.sfx("good"); api.fx.flash(api.P.color("good"), 0.08);
        const [bx, by] = fill ? [vx + vw / 2, levelY(truth)] : [pivot.x, pivot.y];
        api.fx.burst(bx, by, { n: 16, color: api.P.color("good"), speed: 120, life: 0.6, size: 3, kind: "spark" });
      }
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") api.sfx("look");
    }
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (kind === "down") {
      if (s.done) return;
      const id = api.hit(x, y);
      if (!id) return;
      if (/^[wj]\d+$/.test(id)) {
        const size = Number(id.slice(1));
        if (!fill && leftOf(size) <= 0) { api.sfx("refuse"); return; }
        drag = { size, from: "box", x, y, x0: x, y0: y, moved: false }; ctl.finger(true); api.sfx("select");
      } else if (id === "pan" && !fill) {
        const a = angNow(), e = endOf(1, a), its = pile(s.pan, e.x, plateY(1, a));
        let best: Item | null = null, bd = Infinity;
        for (const it of its) { const d = Math.hypot(it.x + it.w / 2 - x, it.y + it.h / 2 - y); if (d < bd) { bd = d; best = it; } }
        if (best) { drag = { size: best.size, from: "pan", x, y, x0: x, y0: y, moved: false }; ctl.finger(true); api.sfx("select"); }
      }
      api.invalidate();
      return;
    }
    if (!drag) return;
    if (kind === "move") { drag.x = x; drag.y = y; if (Math.hypot(x - drag.x0, y - drag.y0) > 10) drag.moved = true; api.invalidate(); return; }
    const d = drag; drag = null; ctl.finger(false);
    if (kind === "up") {
      const over = fill ? inBox({ x: vx - 10, y: vy - 30, w: vw + 70, h: vh + 30 }, x, y) : inBox(panZone(), x, y);
      if (d.from === "box") { if (!d.moved || over) act(fill ? { kind: "pour", jug: d.size } : { kind: "load", weight: d.size }, d.moved ? { x, y } : null); }
      else if (!d.moved || !over) act({ kind: "unload", weight: d.size });
    }
    api.invalidate();
  }
  function update(): void { if (fly && api.t - fly.t0 > FLY) fly = null; }
  const busy = () => drag !== null || fly !== null || (lastAnim >= 0 && api.t - lastAnim < 2.2) || (solvedAt >= 0 && api.t - solvedAt < 0.8);

  // ── drawing ──
  function drawWeight(c: CanvasRenderingContext2D, b: Box, size: number, alpha = 1): void {
    const P = api.P, iron = size >= 500, role = iron ? "q2" : "q1";
    c.save(); c.globalAlpha *= alpha;
    // a knob on top (the handle every shop weight has), then the body
    P.body(c, b.x + b.w * 0.36, b.y, b.w * 0.28, b.h * 0.24, { role, r: 3, seed: size });
    P.body(c, b.x, b.y + b.h * 0.18, b.w, b.h * 0.82, { role, r: iron ? 4 : b.w * 0.2, seed: size + 1 });
    c.restore();
    if (alpha > 0.5 && ((size === 1000 && b.w >= 38) || (size === 500 && b.w >= 32))) P.text(c, size === 1000 ? "1 kg" : "500", b.x + b.w / 2, b.y + b.h * 0.6, { size: 14, weight: 800, on: role, font: "mono" });
  }
  function drawJug(c: CanvasRenderingContext2D, x: number, y: number, s: number, size: number, tilt = 0): void {
    const P = api.P, k = 0.55 + 0.45 * Math.sqrt(size / 1000), jw = s * 0.62 * k, jh = s * k;
    c.save(); c.translate(x, y); c.rotate(tilt);
    P.stroke(c, [[jw / 2, -jh * 0.7], [jw / 2 + jw * 0.32, -jh * 0.55], [jw / 2 + jw * 0.32, -jh * 0.2], [jw / 2, -jh * 0.1]], { role: "ink2", width: 2.5 });
    P.body(c, -jw / 2, -jh, jw, jh, { role: "panel", r: 4 });
    P.fillPath(c, (g) => rrect(g, -jw / 2 + 3, -jh * 0.82, jw - 6, jh * 0.78, 3), "water", { alpha: 0.9, outline: null });
    P.stroke(c, [[-jw / 2 - 3, -jh], [-jw / 2 + 4, -jh - 4]], { role: "ink2", width: 2 });
    c.restore();
  }
  function drawSack(c: CanvasRenderingContext2D, b: Box): void {
    const P = api.P;
    if (p.ctx === "courier") {
      P.body(c, b.x, b.y, b.w, b.h, { role: "q3", r: 4, seed: 3 });
      P.stroke(c, [[b.x + b.w / 2, b.y + 2], [b.x + b.w / 2, b.y + 10]], { role: "ink2", width: 3 });
    } else {
      P.body(c, b.x, b.y + b.h * 0.14, b.w, b.h * 0.86, { role: "q3", r: b.w * 0.22, seed: 5 });
      P.body(c, b.x + b.w * 0.36, b.y, b.w * 0.28, b.h * 0.2, { role: "q3", r: 4, seed: 6 });
    }
    P.textFit(c, label, b.x + b.w / 2, b.y + b.h * 0.6, b.w - 8, b.h * 0.7, { size: 16, weight: 800, on: "q3" });
  }
  function drawTray(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    P.text(c, W(fill ? "taraazu.fill.jugs" : "taraazu.weigh.box"), 12, trayTop + 12, { size: 14, role: "ink2", weight: 700, align: "left" });
    sizes.forEach((size, k) => {
      const t = tileOf(k), left = fill ? 1 : leftOf(size), off = s.done || left <= 0;
      P.body(c, t.x, t.y, t.w, t.h, { role: "panel", r: 8, state: drag?.from === "box" && drag.size === size ? "selected" : "idle" });
      const al = off ? 0.42 : 1;
      if (fill) { c.save(); c.globalAlpha *= al; drawJug(c, t.x + t.w / 2, t.y + 28, 30, size); c.restore(); }
      // the weight sits left of centre so the "×n left" count in the corner never covers it
      else { const [dw, dh] = DIM[size], k2 = Math.min(1, 26 / dh); drawWeight(c, { x: t.x + t.w * 0.36 - (dw * k2) / 2, y: t.y + 4, w: dw * k2, h: dh * k2 }, size, al); }
      P.text(c, sizeLabel(size, mode), t.x + t.w / 2, t.y + t.h - 12, { size: 15, role: off ? "ink3" : "ink", weight: 700, maxW: t.w - 6 });
      if (!fill) P.text(c, `×${left}`, t.x + t.w - 5, t.y + 11, { size: 14, role: "ink2", weight: 700, font: "mono", align: "right" });
      if (!s.done) api.target(`${fill ? "j" : "w"}${size}`, t.x, t.y, t.w, t.h);
    });
  }
  /** a chip centred near x, kept inside the box */
  function chipAt(c: CanvasRenderingContext2D, s: string, x: number, y: number, role: "look" | "good" | "ink2"): void {
    const est = 0.62 * 16 * s.length + 22;
    api.P.chip(c, s, clamp(x, est / 2 + 4, w - est / 2 - 4), y, { size: 16, role: role === "ink2" ? undefined : role, font: "ui" });
  }
  function drawBalance(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), a = angNow(), now = api.t;
    const footY = trayTop - 16;
    P.stroke(c, [[pivot.x, pivot.y], [pivot.x, footY]], { role: "ink3", width: 6 });
    P.body(c, pivot.x - 54, footY, 108, 12, { role: "panel", r: 6 });
    // the stops: while locked two pegs hold the beam level (they drop away on "Tolo")
    if (s.locked) for (const sd of [-1, 1]) P.body(c, pivot.x + sd * 34 - 6, pivot.y + 5, 12, 16, { role: "q4", r: 3 });
    const L = endOf(-1, a), R = endOf(1, a);
    // the needle (status by shape: upright = level)
    P.stroke(c, [[pivot.x - 24, pivot.y - 28], [pivot.x, pivot.y - 36], [pivot.x + 24, pivot.y - 28]], { role: "ink3", width: 2, alpha: 0.7 });
    const settled = !s.locked && Math.abs(a) < 0.01 && Math.abs(targetAng()) < 0.001;
    P.stroke(c, [[pivot.x, pivot.y], [pivot.x + Math.sin(a) * 38, pivot.y - Math.cos(a) * 38]], { role: s.locked ? "ink2" : settled ? "good" : "look", width: 3 });
    P.stroke(c, [[L.x, L.y], [R.x, R.y]], { role: "ink", width: 7 });
    P.circle(c, pivot.x, pivot.y, 8, { role: "ink", fill: true });
    for (const sd of [-1, 1] as const) {
      const e = sd === -1 ? L : R, py = plateY(sd, a);
      P.stroke(c, [[e.x, e.y], [e.x - panW / 2 + 8, py]], { role: "ink3", width: 1.5, alpha: 0.6 });
      P.stroke(c, [[e.x, e.y], [e.x + panW / 2 - 8, py]], { role: "ink3", width: 1.5, alpha: 0.6 });
      P.body(c, e.x - panW / 2, py, panW, 10, { role: "panel", r: 5 });
    }
    // the parcel on the left pan, its label written on it
    const bw = Math.min(panW - 12, 100), bh = clamp(hang * 0.5, 44, 64);
    drawSack(c, { x: L.x - bw / 2, y: plateY(-1, a) - bh, w: bw, h: bh });
    // the weights on the right pan (one lifted by the finger is drawn at the finger)
    const pan = [...s.pan];
    if (drag?.from === "pan") { const i = pan.lastIndexOf(drag.size); if (i >= 0) pan.splice(i, 1); }
    const its = pile(pan, R.x, plateY(1, a));
    for (const it of its) {
      if (fly && it.i === fly.idx && drag?.from !== "pan") {
        const u = ease.out(clamp((now - fly.t0) / FLY, 0, 1));
        drawWeight(c, { ...it, x: lerp(fly.x - it.w / 2, it.x, u), y: lerp(fly.y - it.h / 2, it.y, u) }, it.size);
      } else drawWeight(c, it, it.size);
    }
    if (s.pan.length && !s.done) { const z = panZone(); api.target("pan", z.x, z.y, z.w, Math.max(44, z.h)); }
    // after "Tolo": the consequence (fade 1: how far off; fade 2-3: the tilt says which way, nothing else)
    const cy = Math.min(trayTop - 30, Math.max(plateY(-1, a), plateY(1, a)) + 30);
    if (!s.locked && !s.done && fade === 1) {
      const d = sumOf(s.pan) - truth;
      chipAt(c, W(d < 0 ? "taraazu.weigh.less" : "taraazu.weigh.more", { n: `${Math.abs(d)} g` }), R.x, cy, "look");
    }
    if (s.done && solvedAt >= 0) P.tick(c, pivot.x + 42, pivot.y - 40, 22, clamp((now - solvedAt) / 0.3, 0, 1));
  }
  function drawVessel(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), now = api.t, ml = waterNow();
    // the tag with the label hangs from the rim
    chipAt(c, label, vx + vw / 2, vy - 16, "ink2");
    P.body(c, vx, vy, vw, vh, { role: "panel", r: Math.min(22, vw * 0.12) });
    const wy = levelY(ml);
    if (ml > 0) {
      const wh = vy + vh - 5 - wy;
      P.fillPath(c, (g) => rrect(g, vx + 5, wy, vw - 10, wh, Math.min(16, wh / 2)), "water", { alpha: 0.9, outline: "q2", width: 1.5 });
      const wob = api.reduced ? 0 : Math.sin(now * 6) * clamp(1.4 - (now - pourAt), 0, 1) * 3;
      P.stroke(c, [[vx + 8, wy + wob], [vx + vw / 2, wy - wob], [vx + vw - 8, wy + wob]], { role: "q2", width: 2, alpha: 0.8 });
    }
    // the fill line: fade 1 only (and once the vessel is filled right)
    if (fade === 1 || s.done) {
      const ly = levelY(truth);
      P.stroke(c, [[vx - 6, ly], [vx + vw + 6, ly]], { role: "q4", width: 2.5, dash: [7, 5] });
      P.stroke(c, [[vx - 14, ly - 7], [vx - 4, ly], [vx - 14, ly + 7]], { role: "q4", width: 2.5 });
    }
    // the jug being poured, tipped over the rim, and its stream
    const pt = now - pourAt;
    if (pourAt >= 0 && pt < POUR && !api.reduced) {
      const jx = vx + vw - 8, jy = vy - 8, tip = -1.9 * Math.sin(Math.PI * clamp(pt / POUR, 0, 1));
      drawJug(c, jx + 26, jy, 40, pourJug, tip);
      if (pt > 0.1 && pt < POUR - 0.08) P.stroke(c, [[jx, jy + 2], [jx - 4, (jy + wy) / 2], [jx - 6, wy]], { role: "q2", width: 4 });
    }
    // after "Dekho": fade 1 how far off; fade 2-3 only which way
    if (!s.locked && !s.done) {
      const d = sumOf(s.pan) - truth, k = d < 0 ? "less" : "more";
      const txt = fade === 1 ? W(`taraazu.fill.${k}`, { n: `${Math.abs(d)} ml` }) : W(d < 0 ? "taraazu.fill.below" : "taraazu.fill.above");
      // inside the water near the bottom, so it never covers the surface or the fill line
      chipAt(c, txt, vx + vw / 2, vy + vh - 26, "look");
    }
    if (s.done && solvedAt >= 0) P.tick(c, vx + vw / 2, levelY(truth) - 26, 24, clamp((now - solvedAt) / 0.3, 0, 1));
  }
  function draw(c: CanvasRenderingContext2D): void {
    api.P.textFit(c, W(`taraazu.${mode}.ctx.${p.ctx}`), w / 2, 16, w - 24, 24, { size: 16, role: "ink2", weight: 700 });
    if (fill) drawVessel(c); else drawBalance(c);
    drawTray(c);
    if (drag?.moved) {
      if (fill) drawJug(c, drag.x, drag.y + 14, 36, drag.size);
      else { const [dw, dh] = DIM[drag.size]; drawWeight(c, { x: drag.x - dw / 2, y: drag.y - dh / 2, w: dw, h: dh }, drag.size); }
    }
  }

  function goal(): string {
    const g = fill ? W("taraazu.fill.goal", { item, label }) : W("taraazu.weigh.goal", { item });
    return upper(g);
  }
  /** what is on the pan / what was poured, as a list (never its total: adding it up is the child's job) */
  function listOf(pan: number[]): string {
    const out: string[] = [];
    for (const size of sizes) { const n = pan.filter((x) => x === size).length; if (n) out.push(n > 1 ? `${sizeLabel(size, mode)} ×${n}` : sizeLabel(size, mode)); }
    return out.join(" · ");
  }
  function readouts(): Readout[] {
    const s = st(), out: Readout[] = [];
    out.push({ k: W(fill ? "taraazu.fill.poured" : "taraazu.weigh.onpan"), v: s.pan.length ? listOf(s.pan) : W("taraazu.weigh.empty") });
    if (s.done) out.push({ k: "", v: W(fill ? "taraazu.fill.exact" : "taraazu.weigh.level"), role: "good" });
    else if (!s.locked) {
      const d = sumOf(s.pan) - truth;
      out.push({ k: "", v: fill ? W(d < 0 ? "taraazu.fill.below" : "taraazu.fill.above") : d < 0 ? upper(W("taraazu.weigh.heavy.parcel", { item })) : W("taraazu.weigh.heavy.weights"), role: "look" });
    } else if (!fill && s.pan.length) out.push({ k: "", v: W("taraazu.weigh.locked"), role: "ink2" });
    return out;
  }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    return [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: !s.prev, onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W(`taraazu.${mode}.run`), kind: "primary", group: "go", you: s.pan.length > 0 && s.locked, disabled: !s.pan.length, onPress: () => act({ kind: "weigh" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => drag !== null };
  return view;
};
