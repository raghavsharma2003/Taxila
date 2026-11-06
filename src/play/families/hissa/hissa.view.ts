// Hissa · the 2D view (round 7, multiplying and dividing fractions and decimals; class 7). Nothing here runs on a clock:
// every fold, shade, pour, slide and tag moves on the child's touch, and the run only shows what the law has already
// answered.
//   fold (of)     the unit sheet; − / + fold it across and down; tap the band above it to shade strips across, the band to
//                 its left to take strips down (only the shaded part darkens twice); the tag card counts the overlap
//   fold (times)  one rope piece (a/b m) above a metre track marked in b parts; − / + lay pieces end to end; tag the length
//   pour          the jug, marked in cups (and litres at fade 1); "pour a cup" fills one more cup (the jug refuses a cup it
//                 cannot fill); the last cup carries the tag's marks: on the run the rest goes into it and shows its level
//   grid (mul)    units of 10 × 10; tap the band above to shade tenths across, the band left for tenths down; the label below
//                 holds the overlap's count of small squares, and ‹ / › move its decimal point
//   grid (shift)  a place-value chart with the point fixed; the digits slide one place per push; "0" writes a zero at the end
//   story (rest)  the whole bar: fold and shade the first spend; pick the bar the second fold lies on (the piece left or the
//                 whole bar); fold and shade the second spend; the run names the amounts
//   story (scale) the recipe's amount as a bar against a cup; fold it into shares; lay shares into the pot
// After a missed run only magnifiers mark what is not as it should be; never the key.
import type { HissaAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { CHART_HI, CHART_LO, cupOf, decStr, gridMax, jugLeft, jugOf, MAX_FOLD, MAX_LAY, MAX_TAG, q, qFloor, qLt, qStr, qSub, shiftSpan, shiftVal, shiftX, tagVal, unitsOf, want,
  type HissaParams, type HissaState, type Q } from "./hissa.logic.ts";

const SWEEP = 1.2;   // s a run takes on screen (cosmetic: the law has already answered)
const BTN = 44;

export const makeHissaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<HissaParams, HissaState, HissaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, g = p.goal;
  const pour = g === "fit" || g === "part" || g === "deci", dec = g === "deci" || g === "mul" || g === "shift";
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const fr = (n: number, d: number) => `${n}/${d}`;
  /** a quantity as the level writes it */
  const qty = (x: Q) => (dec ? decStr(x) ?? qStr(x) : qStr(x));

  let w = 360, h = 480, wide = false;
  const boardY = 6;
  let boardH = 40;
  // the main object's box (sheet / track / jug / grid / chart / bars) and the side box (tag card, cups, label)
  let mx = 8, my = 60, mw = 200, mh = 200, sx = 8, sy = 300, sw = 200, sh = 120;
  let runAt = -1;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh; wide = w > h * 1.15;
    boardH = g === "rest" || g === "scale" ? 78 : 40;
    const top = boardY + boardH + 8;
    // the side box: the tag card / the cups / the label (fixed sizes) beside the main object (landscape) or below it
    const sideW = g === "mul" || g === "shift" ? 0 : pour ? (wide ? Math.min(340, w * 0.45) : w - 16) : 150;
    const sideH = g === "mul" || g === "shift" ? 0 : pour ? (wide ? h - top - 8 : 190) : 104;
    if (wide && sideW) {
      sw = sideW; sh = sideH; mw = w - sw - 40; mh = h - top - 8; mx = 12; my = top;
      sx = mx + mw + 16; sy = pour ? top : top + Math.max(0, (mh - sh) / 2);
    } else {
      mw = w - 16; mh = h - top - (sideH ? sideH + 12 : 0) - 8; mx = 8; my = top;
      sw = sideW || mw; sh = sideH; sx = pour ? 8 : (w - sw) / 2; sy = my + mh + 12;
    }
  }
  const act = (a: HissaAct) => { ctl.dispatch(a); deps.changed(); api.invalidate(); };

  function react(_ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as HissaAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "pour" || last.kind === "lay") api.sfx("land");
    else if (last.kind === "fold" || last.kind === "slide" || last.kind === "point") api.sfx("tick");
    else api.sfx("tap");
    if (!st().ended) runAt = -1;
    api.invalidate(); deps.changed();
  }
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
  const busy = () => runAt >= 0 && runK() < 1;

  // ── geometry the pointer reads (set while drawing) ──
  const bands: Record<string, { x: number; y: number; w: number; h: number; n: number; across: boolean; side: number }> = {};

  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done || kind !== "down") return;
    const id = api.hit(x, y);
    if (!id) return;
    const step = (cur: number, by: number, hi: number) => clamp(cur + by, 0, hi);
    if (id.startsWith("band-")) {
      const b = bands[id];
      if (!b || b.n < 1) return;
      const i = clamp(Math.floor(b.across ? ((x - b.x) / b.w) * b.n : ((y - b.y) / b.h) * b.n), 0, b.n - 1);
      const cur = s.k[b.side], next = cur === i + 1 ? i : i + 1;
      act({ kind: "shade", side: b.side, k: next });
      return;
    }
    const [what, a1, a2] = id.split("-");
    if (what === "fold") { const side = Number(a1), n = step(s.f[side], a2 === "up" ? 1 : -1, MAX_FOLD); if (n >= 1 && n !== s.f[side]) act({ kind: "fold", side, n }); }
    else if (what === "tag") { const part = Number(a1), v = step(s.tag[part], a2 === "up" ? 1 : -1, MAX_TAG); if (v !== s.tag[part]) act({ kind: "tag", part, v }); }
    else if (what === "lay") { const n = step(s.lay, a1 === "up" ? 1 : -1, MAX_LAY); if (n !== s.lay) act({ kind: "lay", n }); }
    else if (what === "base") act({ kind: "base", on: Number(a1) });
    else if (what === "pt") { const at = clamp(s.pt + (a1 === "l" ? 1 : -1), 0, 3); if (at !== s.pt) act({ kind: "point", at }); }
  }

  // ── drawing helpers ──
  function boardRows(c: CanvasRenderingContext2D, lines: [string, string][]): void {
    const P = api.P, bw = Math.min(w - 16, 440), bx = (w - bw) / 2;
    P.body(c, bx, boardY, bw, boardH, { role: "panel", r: 10 });
    const lh = boardH / lines.length;
    lines.forEach(([k, v], i) => {
      const y = boardY + lh * (i + 0.5);
      P.textFit(c, k, bx + 8 + (bw * 0.6) / 2, y, bw * 0.6, lh, { size: 16, role: "ink2", weight: 600 });
      P.textFit(c, v, bx + bw * 0.64 + (bw * 0.34) / 2, y, bw * 0.34, lh, { size: 18, role: "ink", weight: 700, font: "mono" });
    });
  }
  function title(c: CanvasRenderingContext2D, s: string): void {
    api.P.body(c, 8, boardY, w - 16, boardH, { role: "panel", r: 10 });
    api.P.textFit(c, s, w / 2, boardY + boardH / 2, w - 28, boardH - 4, { size: 24, role: "ink", weight: 800, font: "mono" });
  }
  /** [−] value [+] with a label above; returns its height */
  function stepper(c: CanvasRenderingContext2D, id: string, cx: number, y: number, label: string, value: string, canDn: boolean, canUp: boolean, look = false): number {
    const P = api.P, s = st(), x = cx - 70;
    if (label) P.textFit(c, label, cx, y + 9, 150, 18, { size: 16, role: "ink2", weight: 700 });
    const by = y + (label ? 20 : 0);
    if (!s.done) { api.target(`${id}-dn`, x, by, BTN, BTN); api.target(`${id}-up`, x + 96, by, BTN, BTN); }
    P.body(c, x + 2, by + 2, BTN - 4, BTN - 4, { role: "panel", r: 8 });
    P.text(c, "−", x + BTN / 2, by + BTN / 2, { size: 22, role: canDn ? "ink" : "ink3", weight: 800 });
    P.body(c, x + 98, by + 2, BTN - 4, BTN - 4, { role: "panel", r: 8 });
    P.text(c, "+", x + 96 + BTN / 2, by + BTN / 2, { size: 22, role: canUp ? "ink" : "ink3", weight: 800 });
    P.text(c, value, cx, by + BTN / 2, { size: 22, role: "ink", weight: 800, font: "mono", maxW: 50 });
    if (look) P.magnifier(c, x + 140, by + 6, 14);
    return (label ? 20 : 0) + BTN;
  }
  /** the tag card: top over bottom, each with − / + */
  function tagCard(c: CanvasRenderingContext2D, cx: number, y: number, look: boolean): void {
    const s = st(), P = api.P;
    P.body(c, cx - 76, y - 4, 152, 2 * BTN + 20, { role: "panel", r: 10, state: look ? "look" : "idle" });
    stepper(c, "tag-0", cx, y, "", String(s.tag[0]), s.tag[0] > 0, s.tag[0] < MAX_TAG);
    P.stroke(c, [[cx - 24, y + BTN + 6], [cx + 24, y + BTN + 6]], { role: "ink", width: 3 });
    stepper(c, "tag-1", cx, y + BTN + 12, "", s.tag[1] ? String(s.tag[1]) : "–", s.tag[1] > 0, s.tag[1] < MAX_TAG);
    if (look) P.magnifier(c, cx + 70, y + BTN + 6, 14);
  }
  const fillRect = (c: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, role: Role, alpha = 1) => {
    c.save(); c.globalAlpha = alpha; c.fillStyle = api.P.color(role); c.fillRect(x, y, rw, rh); c.restore();
  };

  // ── fold (of): the sheet ──
  function drawOf(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    title(c, `${fr(p.a, p.b)} × ${fr(p.c, p.d)}`);
    const stepH = 64, colW = Math.min(mw / 2, 170);
    stepper(c, "fold-0", mx + mw / 2 - colW / 2, my, W("hissa.across"), String(s.f[0]), s.f[0] > 1, s.f[0] < MAX_FOLD);
    stepper(c, "fold-1", mx + mw / 2 + colW / 2, my, W("hissa.down"), String(s.f[1]), s.f[1] > 1, s.f[1] < MAX_FOLD);
    const S = Math.max(80, Math.min(mw - BTN - 12, mh - stepH - BTN - 16));
    const x0 = mx + (mw - S + BTN + 4) / 2, y0 = my + stepH + BTN + 10;
    // the bands the child taps: above (strips across) and to the left (strips down)
    bands["band-0"] = { x: x0, y: y0 - BTN - 4, w: S, h: BTN, n: s.f[0] > 1 ? s.f[0] : 0, across: true, side: 0 };
    bands["band-1"] = { x: x0 - BTN - 4, y: y0, w: BTN, h: S, n: s.f[1] > 1 ? s.f[1] : 0, across: false, side: 1 };
    if (!s.done) { if (s.f[0] > 1) api.target("band-0", x0, y0 - BTN - 4, S, BTN); if (s.f[1] > 1) api.target("band-1", x0 - BTN - 4, y0, BTN, S); }
    for (const [side, b] of [[0, bands["band-0"]], [1, bands["band-1"]]] as const) {
      P.body(c, b.x, b.y, b.w, b.h, { role: "panel", r: 6 });
      const n = s.f[side];
      if (n > 1) for (let i = 0; i < n; i++) {
        const on = i < s.k[side];
        if (b.across) fillRect(c, b.x + (i * b.w) / n + 2, b.y + 4, b.w / n - 4, b.h - 8, side === 0 ? "q1" : "q2", on ? 0.9 : 0.15);
        else fillRect(c, b.x + 4, b.y + (i * b.h) / n + 2, b.w - 8, b.h / n - 4, side === 0 ? "q1" : "q2", on ? 0.9 : 0.15);
      }
    }
    // the sheet: shaded strips across (light), the taken rows of the shaded part (dark): the overlap IS the product
    P.body(c, x0, y0, S, S, { role: "panel", r: 2 });
    const cw = S / s.f[0], rh = S / s.f[1];
    if (s.k[0]) fillRect(c, x0, y0, cw * s.k[0], S, "q1", 0.35);
    if (s.k[0] && s.k[1]) fillRect(c, x0, y0, cw * s.k[0], rh * s.k[1], "q3", 0.85);
    for (let i = 1; i < s.f[0]; i++) P.stroke(c, [[x0 + i * cw, y0], [x0 + i * cw, y0 + S]], { role: "ink2", width: 1.5, dash: [5, 4] });
    for (let j = 1; j < s.f[1]; j++) P.stroke(c, [[x0, y0 + j * rh], [x0 + S, y0 + j * rh]], { role: "ink2", width: 1.5, dash: [5, 4] });
    P.stroke(c, [[x0, y0], [x0 + S, y0], [x0 + S, y0 + S], [x0, y0 + S]], { role: "ink", width: 2.5, closed: true });
    const look = end && !s.done;
    if (look && (s.k[0] * p.b !== p.a * s.f[0])) P.magnifier(c, x0 + S - 12, y0 - BTN / 2 - 4, 14);
    if (look && (s.k[1] * p.d !== p.c * s.f[1])) P.magnifier(c, x0 - BTN / 2 - 4, y0 + S - 12, 14);
    const t = tagVal(s.tag);
    tagCard(c, sx + sw / 2, sy + 4, look && !(t && t.n * want(p).d === want(p).n * t.d));
    if (end && s.done) P.tick(c, x0 + S / 2, y0 + S / 2, 30, 1);
  }

  // ── fold (times): rope pieces on a metre track ──
  function drawTimes(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    title(c, `${p.w} × ${fr(p.a, p.b)} m`);
    const M = Math.max(Math.ceil((p.w * p.a) / p.b), Math.ceil((MAX_LAY * p.a) / p.b) > 0 ? Math.ceil((p.w * p.a) / p.b) + 1 : 1);
    const tx = mx + 8, tw = mw - 16, mpx = tw / M;
    // one piece (given): a/b of a metre
    let y = my + 6;
    P.text(c, W("hissa.piece"), tx, y + 10, { size: 16, role: "ink2", weight: 700, align: "left" });
    fillRect(c, tx, y + 24, (mpx * p.a) / p.b, 12, "q2");
    P.text(c, `${fr(p.a, p.b)} m`, tx + (mpx * p.a) / p.b + 8, y + 30, { size: 16, role: "ink", weight: 700, font: "mono", align: "left" });
    // the track: metres, each in b parts
    y += 64;
    const ty = y + 20;
    P.body(c, tx - 4, y, tw + 8, 52, { role: "panel", r: 8 });
    const shownLay = Math.min(s.lay, Math.floor((M * p.b) / p.a));
    for (let i = 0; i < shownLay; i++) fillRect(c, tx + (i * mpx * p.a) / p.b + 1, ty - 7, (mpx * p.a) / p.b - 2, 14, i % 2 ? "q4" : "q2");
    for (let u = 0; u <= M * p.b; u++) {
      const at = tx + (u * mpx) / p.b, metre = u % p.b === 0;
      if (!metre && p.face === 3) continue;
      P.stroke(c, [[at, ty + 10], [at, ty + (metre ? 24 : 16)]], { role: metre ? "ink" : "ink3", width: metre ? 2 : 1 });
      if (metre && u === 0) P.text(c, "0 m", at - 4, ty + 38, { size: 16, role: "ink2", weight: 700, font: "mono", align: "left" });
      else if (metre && p.face === 1) P.text(c, `${u / p.b}`, at, ty + 38, { size: 16, role: "ink2", weight: 700, font: "mono" });
    }
    // the rope's length on the run: it lights to the end
    if (st().ended && runK() > 0) { const len = (p.w * p.a) / p.b; P.stroke(c, [[tx, ty - 12], [tx + len * mpx * runK(), ty - 12]], { role: "you", width: 3 }); }
    y += 72;
    const look = end && !s.done;
    stepper(c, "lay", mx + mw / 2, y, W("hissa.pieces"), String(s.lay), s.lay > 0, s.lay < MAX_LAY, look && s.lay !== p.w);
    const t = tagVal(s.tag);
    tagCard(c, sx + sw / 2, sy + 4, look && !(t && t.n * want(p).d === want(p).n * t.d));
    if (end && s.done) P.tick(c, w / 2, ty - 26, 24, 1);
  }

  // ── pour: the jug and the cups ──
  function drawPour(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), ran = s.ended && runK() > 0, k = runK(), look = end && !s.done;
    const J = jugOf(p), C = cupOf(p), whole = qFloor(want(p)), total = whole + 1;
    title(c, `${qty(J)} L ÷ ${qty(C)} L`);
    const top = boardY + boardH + 10;
    // the jug: a tall column down the left, scaled in cups (a dashed line at each cup, fades 1-2); litres at fade 1
    const jw = wide ? Math.min(140, w * 0.18) : Math.min(96, w * 0.27), jx = 8, jy = top + 8, jh = h - jy - 8;
    const perCup = (jh - 8) / Math.max(2, total), left = jugLeft(p, s.cups);
    const shownLeft = ran ? (left.n / left.d) * (1 - k) : left.n / left.d, cupL = C.n / C.d;
    P.body(c, jx, jy, jw, jh, { role: "panel", r: 10, state: look && left.n > 0 && s.cups < whole ? "look" : "idle" });
    const lh = (shownLeft / cupL) * perCup;
    fillRect(c, jx + 4, jy + jh - 4 - lh, jw - 8, lh, "q2", 0.85);
    if (p.face < 3) for (let i = 1; i < total; i++) { const yy = jy + jh - 4 - i * perCup; if (yy > jy + 6) P.stroke(c, [[jx + 4, yy], [jx + jw * 0.4, yy]], { role: "ink3", width: 1.5, dash: [4, 4] }); }
    if (p.face === 1) {
      const perL = perCup / cupL;
      for (let l = 1; jy + jh - 4 - l * perL > jy + 14; l++) {
        const yy = jy + jh - 4 - l * perL;
        P.stroke(c, [[jx + jw - 14, yy], [jx + jw - 4, yy]], { role: "ink", width: 2 });
        P.text(c, `${l} L`, jx + jw - 18, yy, { size: 16, role: "ink2", weight: 700, align: "right" });
      }
    }
    if (look && left.n > 0 && s.cups < whole) P.magnifier(c, jx + jw - 16, jy + 16, 14);
    // the right column: the cups poured (small, full) above; the last cup and its tag below
    const rx = jx + jw + 12, rw = w - rx - 8;
    const cardW = 152, lastW = Math.min(56, rw - cardW - 8), lastH = 2 * BTN + 8, by = h - lastH - 12;
    const cupW = 28, cupH = 34, per = Math.max(1, Math.floor((rw + 6) / (cupW + 6)));
    for (let i = 0; i < s.cups; i++) {
      const x = rx + (i % per) * (cupW + 6), y = top + 8 + Math.floor(i / per) * (cupH + 6);
      if (y + cupH > by - 30) break;
      P.body(c, x, y, cupW, cupH, { role: "panel", r: 4, seed: i });
      fillRect(c, x + 3, y + 6, cupW - 6, cupH - 9, "q2", 0.85);
    }
    if (s.cups) P.chip(c, String(s.cups), rx + rw - 22, by - 22, { size: 18 });
    // the last cup carries the tag's marks; on the run the rest pours into it and shows its level
    const lx = rx, ly = by;
    P.body(c, lx, ly, lastW, lastH, { role: "panel", r: 6, state: look ? "look" : "idle" });
    if (ran) { const r = qSub(want(p), q(whole)), fh = Math.min(1.1, r.n / r.d) * (lastH - 8) * k; fillRect(c, lx + 3, ly + lastH - 4 - fh, lastW - 6, fh, "q2", 0.85); }
    if (s.tag[1] > 0 && s.tag[1] <= 24) for (let i = 1; i < s.tag[1]; i++) { const yy = ly + lastH - 4 - (i * (lastH - 8)) / s.tag[1]; P.stroke(c, [[lx + 3, yy], [lx + 14, yy]], { role: "ink2", width: 1.5 }); }
    if (s.tag[1] > 0 && s.tag[0] > 0) { const yy = ly + lastH - 4 - (Math.min(s.tag[0], s.tag[1] * 1.1) * (lastH - 8)) / s.tag[1]; P.stroke(c, [[lx - 4, yy], [lx + lastW + 4, yy]], { role: "you", width: 2.5 }); }
    const t = tagVal(s.tag), r0 = qSub(want(p), q(whole));
    tagCard(c, lx + lastW + 8 + cardW / 2, ly + 4, look && !(t && t.n * r0.d === r0.n * t.d));
    if (end && s.done) P.tick(c, lx + lastW / 2, ly + lastH / 2, 22, 1);
  }

  // ── grid (mul): tenths × tenths ──
  function drawMul(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    title(c, `${decStr(q(p.a, 10))} × ${decStr(q(p.c, 10))}`);
    const ua = unitsOf(p.a), ub = unitsOf(p.c), labH = 70;
    const G = Math.max(40, Math.min((mw - BTN - 12) / ua, (mh - BTN - 12 - labH) / ub));
    const gw = G * ua, gh = G * ub, x0 = mx + (mw - gw + BTN + 4) / 2, y0 = my + BTN + 6;
    const t0 = gw / (10 * ua), t1 = gh / (10 * ub);
    bands["band-0"] = { x: x0, y: y0 - BTN - 4, w: gw, h: BTN, n: gridMax(p, 0), across: true, side: 0 };
    bands["band-1"] = { x: x0 - BTN - 4, y: y0, w: BTN, h: gh, n: gridMax(p, 1), across: false, side: 1 };
    if (!s.done) { api.target("band-0", x0, y0 - BTN - 4, gw, BTN); api.target("band-1", x0 - BTN - 4, y0, BTN, gh); }
    P.body(c, x0, y0 - BTN - 4, gw, BTN, { role: "panel", r: 6 });
    P.body(c, x0 - BTN - 4, y0, BTN, gh, { role: "panel", r: 6 });
    fillRect(c, x0, y0 - BTN, s.k[0] * t0, BTN - 8, "q1", 0.9);
    fillRect(c, x0 - BTN, y0, BTN - 8, s.k[1] * t1, "q2", 0.9);
    P.body(c, x0, y0, gw, gh, { role: "panel", r: 2 });
    fillRect(c, x0, y0, s.k[0] * t0, gh, "q1", 0.3);
    fillRect(c, x0, y0, gw, s.k[1] * t1, "q2", 0.3);
    fillRect(c, x0, y0, s.k[0] * t0, s.k[1] * t1, "q3", 0.85);
    // the hundredths' lines (fade 1-2; tenths lines always), the units bold
    for (let i = 1; i < 10 * ua; i++) if (i % 10 === 0 || p.face < 3) P.stroke(c, [[x0 + i * t0, y0], [x0 + i * t0, y0 + gh]], { role: i % 10 === 0 ? "ink" : "ink3", width: i % 10 === 0 ? 2.5 : 0.75 });
    for (let j = 1; j < 10 * ub; j++) if (j % 10 === 0 || p.face < 3) P.stroke(c, [[x0, y0 + j * t1], [x0 + gw, y0 + j * t1]], { role: j % 10 === 0 ? "ink" : "ink3", width: j % 10 === 0 ? 2.5 : 0.75 });
    P.stroke(c, [[x0, y0], [x0 + gw, y0], [x0 + gw, y0 + gh], [x0, y0 + gh]], { role: "ink", width: 2.5, closed: true });
    // the label: the overlap's small squares counted, the point placed by the child
    const look = end && !s.done;
    const ly = y0 + gh + 26, digits = String(s.k[0] * s.k[1]), padded = digits.padStart(s.pt + 1, "0");
    const shown = s.pt ? `${padded.slice(0, padded.length - s.pt)}.${padded.slice(padded.length - s.pt)}` : padded;
    const lw = Math.min(mw - 2 * BTN - 24, 180), lx = mx + (mw - lw) / 2;
    P.body(c, lx, ly, lw, BTN, { role: "panel", r: 8, state: look ? "look" : "idle" });
    P.text(c, shown, lx + lw / 2, ly + BTN / 2, { size: 26, role: "ink", weight: 800, font: "mono", maxW: lw - 10 });
    if (!s.done) { api.target("pt-l", lx - BTN - 8, ly, BTN, BTN); api.target("pt-r", lx + lw + 8, ly, BTN, BTN); }
    P.body(c, lx - BTN - 6, ly + 2, BTN - 4, BTN - 4, { role: "panel", r: 8 });
    P.text(c, "‹ .", lx - BTN / 2 - 8, ly + BTN / 2, { size: 18, role: s.pt < 3 ? "ink" : "ink3", weight: 800 });
    P.body(c, lx + lw + 10, ly + 2, BTN - 4, BTN - 4, { role: "panel", r: 8 });
    P.text(c, ". ›", lx + lw + 8 + BTN / 2, ly + BTN / 2, { size: 18, role: s.pt > 0 ? "ink" : "ink3", weight: 800 });
    if (look) P.magnifier(c, lx + lw - 14, ly + 12, 14);
    if (end && s.done) P.tick(c, x0 + gw / 2, y0 + gh / 2, 30, 1);
  }

  // ── grid (shift): the place-value chart ──
  function drawShift(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    const op = p.c > 0 ? `× ${10 ** p.c}` : p.d === 1 ? `× ${decStr(q(1, 10 ** -p.c))}` : `÷ ${10 ** -p.c}`;
    title(c, `${decStr(shiftX(p))} ${op}`);
    const cols = CHART_HI - CHART_LO + 1, cw = Math.min(90, (mw - 8) / cols), x0 = mx + (mw - cw * cols) / 2, y0 = my + 20, ch = Math.min(150, mh * 0.5);
    const xOf = (place: number) => x0 + (CHART_HI - place) * cw;
    for (let pl = CHART_HI; pl >= CHART_LO; pl--) {
      const x = xOf(pl);
      P.body(c, x + 2, y0, cw - 4, ch, { role: pl >= 0 ? "panel" : "ground2", r: 6 });
      if (p.face < 3 || pl === 0) P.textFit(c, pl >= 0 ? String(10 ** pl) : decStr(q(1, 10 ** -pl)) ?? "", x + cw / 2, y0 + 16, cw - 4, 22, { size: 16, role: "ink2", weight: 700, font: "ui" });
    }
    // the point, fixed between the ones and the tenths
    P.circle(c, xOf(0) + cw, y0 + ch - 30, 6, { role: "ink", fill: true });
    // the digits where they sit now (a written zero lighter), sliding on the run never: the slide IS the act
    const ds = String(p.a), [, lo] = shiftSpan(p, s.sh, s.zero);
    const all = s.zero ? `${ds}0` : ds;
    for (let i = 0; i < all.length; i++) {
      const place = lo + all.length - 1 - i, x = xOf(place) + cw / 2;
      const isZero = s.zero && i === all.length - 1;
      P.text(c, all[i], x, y0 + ch / 2 + 10, { size: 30, role: isZero ? "ink3" : "ink", weight: 800, font: "mono" });
    }
    // the number the chart reads
    const v = shiftVal(p, s.sh), read = decStr(v) ?? qStr(v);
    const ry = y0 + ch + 18, look = end && !s.done;
    P.body(c, w / 2 - 90, ry, 180, BTN, { role: "panel", r: 8, state: look ? "look" : "idle" });
    P.text(c, s.zero && read.includes(".") ? `${read}0` : s.zero ? `${read}` : read, w / 2, ry + BTN / 2, { size: 24, role: "ink", weight: 800, font: "mono" });
    if (look) P.magnifier(c, w / 2 + 80, ry + 10, 14);
    if (end && s.done) P.tick(c, w / 2, ry + BTN + 26, 24, 1);
  }

  // ── story (rest): a bar spent twice ──
  function drawRest(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), ran = s.ended && runK() >= 1;
    const unit = (n: number) => (p.ctx === 0 ? `₹${n}` : `${n} cm`);
    boardRows(c, [[W(`hissa.rest.has${p.ctx}`), unit(p.w)], [W(`hissa.rest.first${p.ctx}`), fr(p.a, p.b)], [W("hissa.rest.then"), fr(p.c, p.d)]]);
    const bx = mx + 8, bw = mw - 16, bh = 40, look = end && !s.done;
    let y = my;
    // the whole bar, folded and shaded (the first spend)
    stepper(c, "fold-0", mx + mw / 2, y, W("hissa.fold"), String(s.f[0]), s.f[0] > 1, s.f[0] < MAX_FOLD, look && s.k[0] * p.b !== p.a * s.f[0]);
    y += 70;
    const bar = (id: string, x: number, yy: number, len: number, n: number, kk: number, role: Role, side: number) => {
      P.body(c, x, yy, len, bh, { role: "panel", r: 4 });
      if (n > 1) {
        fillRect(c, x, yy, (len * kk) / n, bh, role, 0.85);
        for (let i = 1; i < n; i++) P.stroke(c, [[x + (i * len) / n, yy], [x + (i * len) / n, yy + bh]], { role: "ink2", width: 1.5, dash: [5, 4] });
        bands[id] = { x, y: yy, w: len, h: bh, n, across: true, side };
        if (!s.done) api.target(id, x, yy, Math.max(len, BTN), Math.max(bh, BTN));
      }
      P.stroke(c, [[x, yy], [x + len, yy], [x + len, yy + bh], [x, yy + bh]], { role: "ink", width: 2.5, closed: true });
    };
    bar("band-0", bx, y, bw, s.f[0], s.k[0], "q4", 0);
    if (ran && s.f[0] > 1) P.text(c, unit((p.w * s.k[0]) / s.f[0]), bx + (bw * s.k[0]) / s.f[0] / 2, y + bh / 2, { size: 16, role: "ink", weight: 800, font: "mono" });
    y += bh + 12;
    // which bar the second fold lies on: the piece left, or the whole bar again
    const leftLen = bw * (s.f[0] > 1 ? (s.f[0] - s.k[0]) / s.f[0] : 1);
    const chipW = Math.min(150, (mw - 24) / 2);
    for (const [on, key] of [[1, "hissa.left"], [2, "hissa.whole"]] as const) {
      const x = mx + mw / 2 + (on === 1 ? -chipW - 4 : 4);
      if (!s.done) api.target(`base-${on}`, x, y, chipW, BTN);
      P.body(c, x, y, chipW, BTN, { role: s.on === on ? "q2" : "panel", r: 10 });
      P.textFit(c, W(key), x + chipW / 2, y + BTN / 2, chipW - 8, BTN - 4, { size: 16, weight: 700, on: s.on === on ? "q2" : "panel" });
    }
    if (look && s.on !== 1) P.magnifier(c, mx + mw / 2 + chipW - 10, y + 10, 14);
    y += BTN + 10;
    if (s.on) {
      stepper(c, "fold-1", mx + mw / 2, y, W("hissa.fold"), String(s.f[1]), s.f[1] > 1, s.f[1] < MAX_FOLD, look && s.k[1] * p.d !== p.c * s.f[1]);
      y += 70;
      const len = s.on === 1 ? leftLen : bw;
      bar("band-1", bx, y, len, s.f[1], s.k[1], "q3", 1);
      if (ran && s.f[1] > 1) {
        const base = s.on === 1 ? (p.w * (s.f[0] - s.k[0])) / s.f[0] : p.w, amt = (base * s.k[1]) / s.f[1];
        P.text(c, Number.isInteger(amt) ? unit(amt) : "?", bx + (len * s.k[1]) / s.f[1] / 2, y + bh / 2, { size: 16, role: "ink", weight: 800, font: "mono" });
      }
      if (end && s.done) P.tick(c, bx + len + 20 > w - 20 ? w - 24 : bx + len + 20, y + bh / 2, 22, 1);
    }
  }

  // ── story (scale): a recipe's cup folded into shares and laid per person ──
  function drawScale(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), look = end && !s.done;
    boardRows(c, [[W(`hissa.scale.item${p.ctx}`, { n: p.c }), `${fr(p.a, p.b)} ${W("hissa.cup")}`], [W("hissa.scale.cook"), String(p.d)]]);
    // scale: one cup is L px; the pot holds up to 4 cups
    const bx = mx + 8, bw = mw - 16, L = Math.min(bw / 2.2, bw / Math.max(1.2, Math.ceil(((p.a / p.b) * p.d) / p.c) + 0.5)), bh = 36;
    let y = my;
    const half = Math.min(mw / 2, 160);
    stepper(c, "fold-0", mx + mw / 2 - half / 2 - 4, y, W("hissa.shares"), String(s.f[0]), s.f[0] > 1, s.f[0] < MAX_FOLD, look && s.lay * p.c !== p.d * s.f[0]);
    stepper(c, "lay", mx + mw / 2 + half / 2 + 4, y, W("hissa.laid"), String(s.lay), s.lay > 0, s.lay < MAX_LAY);
    y += 76;
    // the recipe's amount, split into the shares
    const amt = (L * p.a) / p.b, sharePx = amt / s.f[0];
    P.text(c, W("hissa.recipe"), bx, y + 2, { size: 16, role: "ink2", weight: 700, align: "left" });
    y += 14;
    P.stroke(c, [[bx, y], [bx + L, y], [bx + L, y + bh], [bx, y + bh]], { role: "ink3", width: 2, dash: [6, 4], closed: true });
    for (let i = 0; i < s.f[0]; i++) fillRect(c, bx + i * sharePx + 1, y + 3, sharePx - 2, bh - 6, i % 2 ? "q1" : "q2", 0.85);
    P.text(c, `1 ${W("hissa.cup")}`, bx + L + 8, y + bh / 2, { size: 16, role: "ink2", weight: 700, align: "left" });
    y += bh + 26;
    // the pot: the shares laid end to end against cup marks
    P.text(c, W("hissa.pot"), bx, y, { size: 16, role: "ink2", weight: 700, align: "left" });
    y += 14;
    const potW = bw;
    P.body(c, bx, y, potW, bh, { role: "panel", r: 6, state: look ? "look" : "idle" });
    const shown = Math.min(s.lay, Math.floor(potW / Math.max(1, sharePx)));
    for (let i = 0; i < shown; i++) fillRect(c, bx + i * sharePx + 1, y + 3, sharePx - 2, bh - 6, i % 2 ? "q1" : "q2", 0.85);
    for (let m = 1; m * L < potW; m++) { P.stroke(c, [[bx + m * L, y - 4], [bx + m * L, y + bh + 4]], { role: "ink", width: 2 }); if (p.face === 1) P.text(c, String(m), bx + m * L, y + bh + 16, { size: 16, role: "ink2", weight: 700, font: "mono" }); }
    if (look) P.magnifier(c, bx + potW - 14, y + 12, 14);
    if (end && s.done) P.tick(c, w / 2, y + bh + 36, 24, 1);
  }

  function draw(c: CanvasRenderingContext2D): void {
    for (const k of Object.keys(bands)) delete bands[k];
    if (g === "of") drawOf(c);
    else if (g === "times") drawTimes(c);
    else if (pour) drawPour(c);
    else if (g === "mul") drawMul(c);
    else if (g === "shift") drawShift(c);
    else if (g === "rest") drawRest(c);
    else drawScale(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("hissa.again");
    if (g === "scale") return W("hissa.goal.scale", { n: p.d });
    if (g === "rest") return W(`hissa.goal.rest${p.ctx}`);
    return W(`hissa.goal.${g}`);
  }
  // no readout of the answer: the sheet, the rope, the cups, the grid and the chart ARE it
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    if (g === "shift") {
      const [hi, lo] = shiftSpan(p, s.sh, s.zero);
      out.push({ id: "sl", label: "← × 10", aria: "digits one place left", kind: "pad", group: "act", disabled: hi + 1 > CHART_HI, onPress: () => act({ kind: "slide", by: 1 }) });
      out.push({ id: "sr", label: "÷ 10 →", aria: "digits one place right", kind: "pad", group: "act", disabled: lo - 1 < CHART_LO, onPress: () => act({ kind: "slide", by: -1 }) });
      out.push({ id: "zero", label: "…0", aria: "write a zero at the end", kind: "pad", group: "act", pressed: s.zero, onPress: () => act({ kind: "zero" }) });
    }
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    if (pour) out.push({ id: "pour", label: W(g === "deci" ? "hissa.pourglass" : "hissa.pour"), aria: "pour one cup", kind: "secondary", group: "go", disabled: qLt(jugLeft(p, s.cups), cupOf(p)) || s.cups >= 20, onPress: () => act({ kind: "pour" }) });
    const ready = !s.ended;
    const runKey = g === "of" || g === "rest" ? "hissa.cut" : pour ? "hissa.serve" : g === "times" || g === "scale" ? "hissa.go" : "hissa.read";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => false };
  return view;
};
