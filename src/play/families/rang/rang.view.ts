// Rang · the 2D view (round 7, acids, bases, indicators and neutralisation; class 7 science). Nothing here runs on a clock: a
// drop lands, a cup is sorted or a base goes into the glass only when the child taps, and each drop is shown falling (a beat
// inside busy()); the animations only show what the law has already answered.
//   pehchaan: a row per cup of the kit's liquids (its name, its indicator strips or wells with the colour each drop gave, and
//             the kind it was sorted into); under them the indicators (tap one: a drop from the chosen cup lands on it) and
//             the three bins (tap one: the chosen cup is sorted). Tap a row to choose that cup. Litmus strips and haldi paper
//             keep their own colour where no drop has landed; a drop leaves a spot of the colour it gives.
//   milao:    the card on top (the glasses, or the uses); a glass of hibiscus water with the acid in it (pink, fading as the
//             base goes in, its own colour at the right amount, green past it), the dropper over it, the drops that went in,
//             and once a base is in, the label of what forms (a salt and water, heat given out); the droppers below.
// After a wrong move only magnifiers mark what to look at again (never the key, never a cross). Nothing is tasted, touched or
// drunk: the only way a liquid moves is the dropper.
import type { Moment, RangAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Material } from "../../core/styles.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  KINDS, LIQUIDS, OWN, cardOf, colourOf, cupsOf, glassOf, gudOf, indsOf, isCups, shade, tested, toolsOf,
  type Colour, type Ind, type Kind, type RangParams, type RangState, type RangW,
} from "./rang.logic.ts";

const HOLD = 1.4;   // s: the stage keeps drawing after an act (the last beat lands inside it)
const TAU = Math.PI * 2;
/** the material each colour the kit names is painted in */
const MAT: Record<Colour, Material> = { red: "red", blue: "blue", yellow: "turmeric", pink: "pink", green: "leaf", own: "hibiscus" };

export const makeRangView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<RangParams, RangState, RangAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal, cupsMode = isCups(p);
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const cups = cupsMode ? cupsOf(p) : [];
  let w = 360, h = 400;
  let actAt = -10, doneAt = -10, cheered = false;
  let last: { kind: string; m: string; at: number; ok: boolean; before: RangW | null } = { kind: "", m: "", at: -1, ok: false, before: null };
  /** pehchaan: the cup chosen (the next drop or sort is about it) */
  let sel = 0;
  let down: { x: number; y: number } | null = null;
  const firstOpen = () => { const b = st().w.bins; const i = b.findIndex((x) => !x); return i < 0 ? 0 : i; };

  function layout(bw: number, bh: number): void { w = bw; h = bh; }
  const act = (a: RangAct) => {
    last = { kind: a.kind, m: a.kind === "use" ? a.m : a.kind === "drop" ? a.ind : a.kind === "sort" ? a.bin : a.kind, at: a.kind === "drop" || a.kind === "sort" ? a.at : -1, ok: false, before: { ...st().w } };
    ctl.dispatch(a); deps.changed();
  };
  function react(ms: Moment[], refused: string | undefined): void {
    const now = api.t;
    actAt = now;
    last.ok = !refused;
    if (last.kind === "undo") { last = { kind: "", m: "", at: -1, ok: false, before: null }; if (cupsMode && st().w.bins[sel]) sel = firstOpen(); }
    for (const m of ms) if (m.kind === "solved") { doneAt = now + 0.5; cheered = false; }
    // a cup sorted: the next open cup is chosen for the child
    if (cupsMode && !refused && last.kind === "sort") sel = firstOpen();
    const mc = ms.some((m) => m.kind === "misconception_consequence");
    if (refused === "level_over" || refused === "full" || refused === "again" || refused === "no_gud") api.sfx("refuse");
    else if (refused || mc) { api.sfx("look"); if (!mc) api.fx.shake(2); }
    else api.sfx(last.kind === "drop" || last.kind === "use" ? "drop" : last.kind === "sort" ? "land" : "tap");
    api.invalidate(); deps.changed();
  }
  function update(_dt: number): void {
    if (doneAt >= 0 && !cheered && api.t >= doneAt) {
      cheered = true; api.sfx("good");
      api.fx.burst(w / 2, Math.min(h * 0.3, 120), { n: 16, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" });
      deps.changed();
    }
  }
  const busy = () => api.t - actAt < HOLD || (doneAt >= 0 && api.t - doneAt < 0.8);
  /** 0..1 along the last act's beat (reduced motion: at once) */
  const prog = (delay = 0) => (api.reduced ? 1 : ease.out(clamp((api.t - actAt - delay) / 0.7, 0, 1)));

  // ── input ──
  function tap(id: string): void {
    const i = id.indexOf("-"), kind = id.slice(0, i), rest = id.slice(i + 1);
    if (kind === "cup") { sel = Number(rest); api.sfx("select"); api.invalidate(); deps.changed(); }
    else if (kind === "ind") act({ kind: "drop", at: sel, ind: rest });
    else if (kind === "bin") act({ kind: "sort", at: sel, bin: rest });
    else if (kind === "tool") act({ kind: "use", m: rest });
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) { down = null; return; }
    if (kind === "down") { down = { x, y }; return; }
    if (kind === "up" && down) { const d0 = down; down = null; if (Math.hypot(x - d0.x, y - d0.y) < 14) { const id = api.hit(d0.x, d0.y); if (id) tap(id); } return; }
    if (kind === "cancel") down = null;
  }
  const dragging = () => false;

  // ── geometry ──
  function geo() {
    const cw = Math.min(w - 16, 620), x0 = (w - cw) / 2, gap = 8, btnH = 48;
    const binY = h - 8 - btnH, toolY = cupsMode ? binY - gap - btnH : binY;
    const stripH = cupsMode ? 0 : 40, stripY = 8;
    const sy = cupsMode ? 8 : stripY + stripH + gap, sh = toolY - gap - sy;
    return { cw, x0, gap, btnH, binY, toolY, stripH, stripY, sy, sh };
  }
  type G = ReturnType<typeof geo>;

  // ── shared drawing ──
  /** a strip of litmus or haldi paper (its own colour), with the spot a drop left on it */
  function strip(c: CanvasRenderingContext2D, x: number, y: number, sw: number, sh: number, ind: Ind, spot: Colour | null, grow: number, look: boolean): void {
    const P = api.P;
    if (ind === "gudhal") {
      // a little well of gudhal water: its own colour, or what the drop turned it
      P.fillPath(c, (q) => q.ellipse(x + sw / 2, y + sh * 0.62, sw / 2, sh * 0.32, 0, 0, TAU), "white", { outline: "ink2", width: 1.5 });
      P.fillPath(c, (q) => q.ellipse(x + sw / 2, y + sh * 0.6, sw / 2 - 3, sh * 0.24, 0, 0, TAU), MAT.own, { outline: null, alpha: 0.85 });
      // the drop's ring marks a tested well even when it keeps its own colour (a neutral liquid)
      if (spot) P.fillPath(c, (q) => q.ellipse(x + sw / 2, y + sh * 0.6, (sw / 2 - 5) * grow, sh * 0.2 * grow, 0, 0, TAU), MAT[spot], { outline: "ink", width: 1.2, alpha: 0.95 });
    } else {
      P.fillPath(c, (q) => q.rect(x + sw * 0.18, y + 2, sw * 0.64, sh - 4), MAT[OWN[ind]], { outline: "ink2", width: 1.2, alpha: 0.95 });
      if (spot) P.fillPath(c, (q) => q.arc(x + sw / 2, y + sh / 2, sw * 0.26 * grow, 0, TAU), MAT[spot], { outline: "ink", width: 1.2 });
    }
    if (look) { P.stroke(c, [[x - 2, y - 2], [x + sw + 2, y - 2], [x + sw + 2, y + sh + 2], [x - 2, y + sh + 2]], { role: "look", width: 2, dash: [4, 3], closed: true }); }
  }
  /** a small glass of a liquid on the bench (drawn clear: no colour is claimed for any liquid) */
  function cupIcon(c: CanvasRenderingContext2D, x: number, y: number, cw: number, ch: number): void {
    const P = api.P;
    P.fillPath(c, (q) => { q.moveTo(x, y); q.lineTo(x + cw, y); q.lineTo(x + cw * 0.86, y + ch); q.lineTo(x + cw * 0.14, y + ch); q.closePath(); }, "white", { outline: "ink2", width: 1.5, alpha: 0.9 });
    P.fillPath(c, (q) => { q.moveTo(x + cw * 0.06, y + ch * 0.4); q.lineTo(x + cw * 0.94, y + ch * 0.4); q.lineTo(x + cw * 0.86, y + ch - 1); q.lineTo(x + cw * 0.14, y + ch - 1); q.closePath(); }, "ice", { outline: null, alpha: 0.75 });
  }
  /** a dropper (a glass tube and a rubber bulb), its tip at (x, y) */
  function dropper(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.fillPath(c, (q) => q.rect(x - s * 0.12, y - s * 0.9, s * 0.24, s * 0.82), "ice", { outline: "ink2", width: 1.2 });
    P.fillPath(c, (q) => { q.moveTo(x - s * 0.12, y - s * 0.08); q.lineTo(x + s * 0.12, y - s * 0.08); q.lineTo(x, y); q.closePath(); }, "ice", { outline: "ink2", width: 1.2 });
    P.fillPath(c, (q) => q.ellipse(x, y - s * 1.05, s * 0.2, s * 0.24, 0, 0, TAU), "rubber", { outline: "ink2", width: 1.2 });
  }

  // ── pehchaan: the cups, the indicators, the bins ──
  function drawCups(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), n = cups.length, inds = indsOf(p);
    const rh = Math.min(64, g.sh / n), X = g.x0, CW = g.cw;
    const sw = 26, binW = Math.min(96, CW * 0.24), spotsX = X + CW - binW - 12 - inds.length * (sw + 10);
    cups.forEach((liq, i) => {
      const y = g.sy + i * rh, bh = rh - 4, sorted = s.w.bins[i], mine = i === sel && !s.done;
      const looked = !!s.why && s.at === i;
      P.body(c, X, y, CW, bh, { role: "panel", r: 10, seed: 20 + i, state: sorted ? "good" : looked ? "look" : mine ? "selected" : "idle" });
      if (!s.done) api.target(`cup-${i}`, X, y, CW, bh);
      cupIcon(c, X + 10, y + bh / 2 - 13, 22, 26);
      P.textFit(c, W(`rang.liq.${liq}`), (X + 40 + spotsX - 6) / 2, y + bh / 2 + 1, spotsX - X - 50, bh - 4, { size: 15, role: "ink", weight: 700 });
      inds.forEach((ind, j) => {
        const sx = spotsX + j * (sw + 10), sy = y + (bh - 34) / 2;
        const has = tested(s.w.tested[i], ind), fresh = last.ok && last.kind === "drop" && last.at === i && last.m === ind && api.t - actAt < HOLD;
        // m3's consequence: the other indicator shows the same liquid's colour (the same kind), dashed
        const other = looked && ((s.why === "made_red" && ind === "gudhal") || (s.why === "own_red" && ind === "blue"));
        const spot = has || other ? colourOf(ind, LIQUIDS[liq] as Kind) : null;
        strip(c, sx, sy, sw, 34, ind, spot, fresh ? prog(0.25) : 1, other);
        if (other) P.magnifier(c, sx + sw + 4, sy + 2, 14);
        if (fresh && prog() < 1) { const fy = lerp(sy - 30, sy + 14, prog()); P.fillPath(c, (q) => q.arc(sx + sw / 2, fy, 3.5, 0, TAU), "ice", { outline: "ink2", width: 1 }); }
        if (looked && (s.why === "not_sure" ? !has : s.why === "wrong_bin" ? has : s.why === "own_red" ? ind === "red" : s.why === "made_red" ? ind === "haldi" : false)) P.magnifier(c, sx + sw / 2 + 6, sy - 2, 12);
      });
      // the kind it was sorted into
      const bx = X + CW - binW - 6;
      if (sorted) {
        P.body(c, bx, y + 6, binW, bh - 12, { role: "q4", r: 8, seed: 40 + i });
        P.textFit(c, W(`rang.bin.${sorted}`), bx + binW / 2, y + bh / 2, binW - 8, bh - 14, { size: 14, on: "q4", weight: 800 });
      } else P.stroke(c, [[bx, y + 8], [bx + binW, y + 8], [bx + binW, y + bh - 8], [bx, y + bh - 8]], { role: "ink3", width: 1.2, dash: [4, 4], closed: true });
    });
    // the indicators
    const ni = inds.length, iw = (CW - (ni - 1) * g.gap) / ni;
    inds.forEach((ind, j) => {
      const x = X + j * (iw + g.gap), y = g.toolY, on = last.kind === "drop" && last.m === ind && api.t - actAt < HOLD;
      if (!s.done) api.target(`ind-${ind}`, x, y, iw, g.btnH);
      P.body(c, x, y, iw, g.btnH, { role: "q2", r: 12, seed: 80 + j, state: on ? "selected" : s.done ? "dim" : "idle" });
      strip(c, x + 8, y + 7, 18, g.btnH - 14, ind, null, 1, false);
      const left = ind === "gudhal" && p.look > 1 ? gudOf(p) - s.w.gud : -1;
      const tw = iw - 40 - (left >= 0 ? 8 * gudOf(p) + 6 : 0);
      P.textFit(c, W(`rang.ind.${ind}`), x + 32 + tw / 2, y + g.btnH / 2, tw, g.btnH - 6, { size: 15, on: "q2", weight: 800 });
      // the gudhal water left (looks 2 and 3: a drop for each cup that is not a base), as dots
      if (left >= 0) for (let k = 0; k < gudOf(p); k++) P.circle(c, x + iw - 10 - k * 8, y + g.btnH / 2, 3, { role: "ink", fill: k < left, width: 1.2 });
    });
    // the bins
    const bw = (CW - 2 * g.gap) / 3;
    KINDS.forEach((k, j) => {
      const x = X + j * (bw + g.gap), y = g.binY, on = last.kind === "sort" && last.m === k && api.t - actAt < HOLD;
      if (!s.done) api.target(`bin-${k}`, x, y, bw, g.btnH);
      P.body(c, x, y, bw, g.btnH, { role: "q1", r: 12, seed: 90 + j, state: on ? "selected" : s.done ? "dim" : "idle" });
      P.textFit(c, W(`rang.bin.${k}`), x + bw / 2, y + g.btnH / 2, bw - 10, g.btnH - 6, { size: 15, on: "q1", weight: 800 });
    });
  }

  // ── milao: the card, the glass, the droppers ──
  function drawStrip(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), card = cardOf(p), n = Math.max(1, card.length), cw = (g.cw - (n - 1) * 6) / n;
    const lookAt = s.why && !s.done ? s.w.next : -1;
    card.forEach((_, i) => {
      const x = g.x0 + i * (cw + 6), state = i < s.w.next ? "good" : i === lookAt ? "look" : i === s.w.next && !s.done ? "selected" : "idle";
      P.body(c, x, g.stripY, cw, g.stripH, { role: "panel", r: 10, seed: 60 + i, state });
      P.textFit(c, chipLabel(i), x + cw / 2, g.stripY + g.stripH / 2 + 1, cw - 14, g.stripH - 4, { size: 14, role: "ink", weight: 700 });
      if (state === "good") P.tick(c, x + cw - 7, g.stripY + 5, 11);
      if (state === "look") P.magnifier(c, x + cw - 7, g.stripY + 7, 12);
    });
  }
  function chipLabel(i: number): string {
    const g = glassOf(p, { ...st().w, next: i });
    if (goal === "boond") return W(`rang.chip.${g.want}`, { acid: W(`rang.liq.${g.acid}`) });
    return W(`rang.case.${g.cse}`);
  }
  function drawGlass(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), X = g.x0, Y = g.sy, CW = g.cw, H = g.sh;
    P.body(c, X, Y, CW, H, { role: "panel", r: 12, seed: 3 });
    if (s.done) {
      // the card's glasses as they ended (no pink; green where the card asked for it), and what formed in them
      const card = cardOf(p), n = card.length, sw2 = Math.min(84, (CW - 32) / n - 12), sh2 = clamp(H * 0.36, 56, 110), y2 = Y + 26;
      card.forEach((_, i) => {
        const g = glassOf(p, { ...s.w, next: i }), cx = X + CW / 2 + (i - (n - 1) / 2) * (sw2 + 16), gx2 = cx - sw2 / 2;
        const m: Material = g.want === "green" ? MAT.green : MAT.own;
        P.fillPath(c, (q) => { q.moveTo(gx2 + sw2 * 0.03, y2 + sh2 * 0.35); q.lineTo(gx2 + sw2 * 0.97, y2 + sh2 * 0.35); q.lineTo(gx2 + sw2 * 0.9, y2 + sh2); q.lineTo(gx2 + sw2 * 0.1, y2 + sh2); q.closePath(); }, m, { outline: null, alpha: 0.85 });
        P.fillPath(c, (q) => { q.moveTo(gx2, y2); q.lineTo(gx2 + sw2, y2); q.lineTo(gx2 + sw2 * 0.9, y2 + sh2); q.lineTo(gx2 + sw2 * 0.1, y2 + sh2); q.closePath(); }, "white", { outline: "ink", width: 2, alpha: 0.12 });
        P.tick(c, cx + sw2 / 2 - 4, y2 + 4, 12);
      });
      const ly2 = y2 + sh2 + 18, lh = Math.min(96, Y + H - ly2 - 10), lw = Math.min(CW - 40, 300);
      P.body(c, X + (CW - lw) / 2, ly2, lw, lh, { role: "panel", r: 8, seed: 11 });
      P.textFit(c, W("rang.salt"), X + CW / 2, ly2 + lh * 0.32, lw - 16, lh * 0.42, { size: 15, role: "ink", weight: 700 });
      P.textFit(c, W("rang.heat"), X + CW / 2, ly2 + lh * 0.72, lw - 16, lh * 0.42, { size: 14, role: "ink2", weight: 700 });
      return;
    }
    const gl = glassOf(p, s.w), need = gl.n + s.w.a;
    // the label over the glass: the acid with hibiscus water (boond), or the use's sample (ilaaj)
    P.textFit(c, goal === "boond" ? W("rang.glass", { acid: W(`rang.liq.${gl.acid}`) }) : W("rang.sample"), X + CW / 2, Y + 16, CW - 20, 22, { size: 14, role: "ink2", weight: 700 });
    const gw = clamp(CW * 0.34, 90, 150), gh = clamp(H * 0.52, 90, 170), gx = X + Math.max(16, CW * 0.12), gy = Y + H - gh - 14;
    // the dropper over the glass (the last dropper used), and the drop it lets fall
    const used = last.kind === "use" && last.m !== "danger" ? last.m : "";
    dropper(c, gx + gw / 2, gy - 12, 26);
    if (used && last.ok && api.t - actAt < HOLD && prog() < 1) { const fy = lerp(gy - 8, gy + gh * 0.45, prog()); P.fillPath(c, (q) => q.arc(gx + gw / 2, fy, 4, 0, TAU), "ice", { outline: "ink2", width: 1 }); }
    // the liquid: its level rises a little with every drop; its colour is what the hibiscus water shows
    const now = shade(p, s.w), b4 = last.before, fresh = !!b4 && last.ok && api.t - actAt < HOLD;
    const drops = s.w.k + s.w.wd + s.w.a, fill = clamp(0.42 + 0.04 * drops, 0.42, 0.85);
    const ly = gy + gh * (1 - fill);
    const left = (yy: number) => gx + lerp(0, gw * 0.1, (yy - gy) / gh), right = (yy: number) => gx + gw - lerp(0, gw * 0.1, (yy - gy) / gh);
    const body = (q: CanvasRenderingContext2D) => { q.moveTo(left(ly), ly); q.lineTo(right(ly), ly); q.lineTo(right(gy + gh), gy + gh); q.lineTo(left(gy + gh), gy + gh); q.closePath(); };
    // pink fades as the base goes in ("loses its pink"); plain water only thins it a little (it stays pink)
    const pinkA = clamp(0.32 + 0.6 * (need - s.w.k) / Math.max(1, need) - 0.06 * s.w.wd, 0.32, 0.92);
    const prevShade = b4 ? shade(p, b4) : now, k = fresh ? prog(0.35) : 1;
    if (fresh && prevShade !== now) {
      P.fillPath(c, body, prevShade === "pink" ? "pink" : MAT[prevShade], { outline: null, alpha: (prevShade === "pink" ? pinkA : 0.85) * (1 - k) });
      P.fillPath(c, body, now === "pink" ? "pink" : MAT[now], { outline: null, alpha: (now === "pink" ? pinkA : 0.85) * k });
    } else P.fillPath(c, body, now === "pink" ? "pink" : MAT[now], { outline: null, alpha: now === "pink" ? pinkA : 0.85 });
    P.fillPath(c, (q) => { q.moveTo(gx, gy); q.lineTo(gx + gw, gy); q.lineTo(gx + gw * 0.9, gy + gh); q.lineTo(gx + gw * 0.1, gy + gh); q.closePath(); }, "white", { outline: "ink", width: 2, alpha: 0.12 });
    if (["still_pink", "diluted", "too_much", "no_green"].includes(s.why)) P.magnifier(c, gx + gw + 4, ly + 6, 16);
    // once a base is in: what neutralisation forms (a salt and water, heat given out), with the warmth drawn over the glass.
    // (No drop count is shown: the colour is what the child watches.)
    const tx = gx + gw + 18, tw = X + CW - tx - 12;
    if (s.w.k > 0) {
      const lh = clamp(gh * 0.8, 96, 132), ly2 = gy + (gh - lh) / 2;
      P.body(c, tx, ly2, tw, lh, { role: "panel", r: 8, seed: 11, state: s.why === "salt_water" ? "look" : "idle" });
      P.textFit(c, W("rang.salt"), tx + tw / 2, ly2 + lh * 0.3, tw - 10, lh * 0.42, { size: 14, role: "ink", weight: 700 });
      P.textFit(c, W("rang.heat"), tx + tw / 2, ly2 + lh * 0.72, tw - 10, lh * 0.42, { size: 14, role: "ink2", weight: 700 });
      for (let i = 0; i < 3; i++) {
        const wx = gx + gw * (0.3 + i * 0.2);
        P.stroke(c, Array.from({ length: 7 }, (_, j): [number, number] => [wx + Math.sin(j * 1.2 + i) * 3, ly - 6 - j * 3]), { role: "q1", width: 2, alpha: 0.8 });
      }
      if (s.why === "salt_water") P.magnifier(c, tx + tw - 8, ly2 + 8, 14);
    }
  }
  function drawDroppers(c: CanvasRenderingContext2D, g: G): void {
    const P = api.P, s = st(), tools = toolsOf(p, s.w), n = tools.length, tw = (g.cw - (n - 1) * g.gap) / n;
    tools.forEach((m, i) => {
      const x = g.x0 + i * (tw + g.gap), y = g.toolY, on = last.kind === "use" && last.m === m && api.t - actAt < HOLD;
      if (!s.done) api.target(`tool-${m}`, x, y, tw, g.btnH);
      P.body(c, x, y, tw, g.btnH, { role: "q2", r: 12, seed: 80 + i, state: on ? "selected" : s.done ? "dim" : "idle" });
      P.textFit(c, W(`rang.tool.${m}`), x + tw / 2, y + g.btnH / 2, tw - 10, g.btnH - 6, { size: 15, on: "q2", weight: 800 });
    });
  }

  function draw(c: CanvasRenderingContext2D): void {
    const g = geo();
    if (cupsMode) { drawCups(c, g); return; }
    drawStrip(c, g);
    drawGlass(c, g);
    drawDroppers(c, g);
  }

  function goalLine(): string {
    const s = st();
    if (s.done) return W(`rang.done.${goal}`);
    if (s.why) return W(`rang.why.${s.why}`, whyVals());
    if (cupsMode) return W(`rang.goal.${goal}`, { liquid: W(`rang.liq.${cups[sel]}`) });
    // ilaaj: lemon juice went in (an acid itself: it stays pink)
    if (last.ok && last.kind === "use" && last.m === "lemon") return W("rang.note.lemon");
    const g = glassOf(p, s.w);
    if (goal === "boond") return W(`rang.goal.boond.${g.want}`, { acid: mid(W(`rang.liq.${g.acid}`)) });
    return W("rang.goal.ilaaj", { case: W(`rang.case.${g.cse}`) });
  }
  function whyVals(): Record<string, string | number> {
    const s = st(), at = s.at >= 0 ? s.at : sel;
    return cupsMode ? { liquid: mid(W(`rang.liq.${cups[at]}`)) } : {};
  }
  /** a name filled into the middle of an English sentence is lower case ("into the vinegar") */
  const mid = (s: string) => (lang === "en" ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [{ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) }];
    if (!cupsMode) {
      out.push({ id: "danger", label: W("rang.danger"), aria: W("rang.danger"), kind: "secondary", group: "go", onPress: () => act({ kind: "use", m: "danger" }) });
      // never "your move": the button must not hint when the colour is right (the child decides it is)
      out.push({ id: "done", label: W("rang.claim"), aria: W("rang.claim"), kind: "primary", group: "go", onPress: () => act({ kind: "done" }) });
    }
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal: goalLine, readouts, controls, react };
  return view;
};
