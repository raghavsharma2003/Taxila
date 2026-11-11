// Kaal · the 2D view (round 7). Kaal-nadi: the river of time runs across the box, BCE on the left, CE on the right, a post
// standing where 1 BCE flows into 1 CE (there is no year 0). Ticks stand on the near bank with their years under them
// ("500 / BCE", "1857 / CE"; Hindi "ई.पू." / "ई."), labelled every tick at fade 1 (the bands shaded), every other tick at
// fade 2, only the ends at fade 3; a century goal shades the river into century bands named only by their ordinals.
// The stone to place is shown on the card above (its event and year); the child drags the boat along the river (a loupe
// magnifies the ticks under the finger; no year readout: a live year under the boat would make it a reading task) and
// presses Drop (id "run"); ◀ ▶ (ids "nudge-left" / "nudge-right") move the boat one small step. A miss: the stone floats
// to its true place and the exact gap is drawn between the boat and it. Landed stones stay on the river as flags.
import type { KaalAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, lerp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { ease } from "../../core/juice.ts";
import { withAlpha } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { kaalHelpers as HL, type KaalParams, type KaalState, type KaalStone } from "./kaal.logic.ts";
import type { Lang } from "../../../../shared/play.ts";

/** the lesson-language year words (the law keeps English; Hindi comes from data/play/engine-words.json) */
const eraWord = (bce: boolean, lang: Lang) => word(lang, bce ? "kaal.era.bce" : "kaal.era.ce");
function yearText(y: number, lang: Lang, o: { circa?: boolean; decade?: boolean } = {}): string {
  if (lang !== "hi") return HL.yearText(y, lang, o);
  if (o.decade) return word(lang, "kaal.decade", { y: y - 5 });
  const t = `${Math.abs(y)} ${eraWord(y < 0, lang)}`;
  return o.circa ? `${word(lang, "kaal.circa")} ${t}` : t;
}
function ordinal(n: number, lang: Lang): string {
  if (lang !== "hi") return HL.ordinal(n, lang);
  const k = `kaal.ord.${n}`;
  return [1, 2, 3, 4, 6].includes(n) ? word(lang, k as WordKey) : word(lang, "kaal.ord.n", { n });
}
const H = { ...HL, eraWord, yearText, ordinal, stoneYear: (st: KaalStone, lang: Lang) => yearText(st.year, lang, st) };

const RH = 34;   // the river's height, px

export const makeKaalView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<KaalParams, KaalState, KaalAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, n = p.stones.length, century = p.goal === "century", order = p.goal === "order";
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const span = p.hi - p.lo, nT = Math.round(span / p.step), cross = p.lo < 0 && p.hi > 0;
  let w = 300, h = 440, x0 = 24, x1 = 276, ry = 250, cardH = 100, pxPer = 30, widest = 40, labelStride = 1;
  let drag: { x: number } | null = null;
  let shown: number | null = null;                 // the boat's drawn position (river x), springing to the mark
  let miss: { k: number; y: number; truth: number; at: number } | null = null;
  let landAt = -1, solvedAt = -1;
  const st = () => ctl.state;
  const cur = () => H.currentStone(p, st());
  const toPx = (x: number) => x0 + ((x - p.lo) / span) * (x1 - x0);
  const toX = (px: number) => p.lo + ((px - x0) / (x1 - x0)) * span;
  const yearOfX = (x: number) => H.yearAt(clamp(x, p.lo + 1e-6, p.hi - 1e-6));
  /** the boat's river x: under the finger while dragging, else at the current stone's mark (null = still docked) */
  const boatX = (): number | null => {
    if (drag) return drag.x;
    const k = cur(); if (k >= n) return null;
    const m = st().marks[k];
    return m === null || m === undefined ? null : H.xOf(m);
  };

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    // tick labels at one uniform stride wide enough that no two touch at this box (the ends are always written, so the
    // margin holds half the widest label)
    widest = 44;
    for (let i = 0; i <= nT; i++) widest = Math.max(widest, String(Math.abs(p.lo + i * p.step)).length * 15 * 0.62 + 12);
    const m = Math.max(clamp(w * 0.07, 24, 56), widest / 2 + 4);
    x0 = m; x1 = w - m;
    // a short box (a landscape phone, the lesson's side pane) keeps the river and its labels on screen: the card shrinks
    // and the river sits nearer the bottom
    cardH = h < 380 ? clamp(h * 0.26, 64, 92) : clamp(h * 0.24, 92, 132);
    ry = clamp(h * 0.56, cardH + 120, h - 112);
    if (ry > h - 70) ry = Math.max(cardH + 60, h - 70);
    pxPer = (x1 - x0) / nT;
    labelStride = [1, 2, 3, 4, 5, 6, 12].find((k) => k * pxPer >= widest) ?? nT;
  }
  const tickShown = (i: number) => {
    if (century || !H.labelled(p, i) || p.lo + i * p.step === 0) return false;
    if (i === 0 || i === nT) return true;
    return i % labelStride === 0 && i * pxPer >= widest && (nT - i) * pxPer >= widest;
  };

  function act(a: KaalAct): void { ctl.dispatch(a); deps.changed(); }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KaalAct | undefined;
    const now = api.t, P = api.P;
    if (last?.kind === "place") api.sfx(refused ? "refuse" : "slide");
    if (last?.kind === "undo") { miss = null; api.sfx("tap"); }
    for (const m of ms) {
      if (m.kind === "progress" || m.kind === "solved") {
        landAt = now; miss = null; api.sfx("land");
        const s = st(), k = s.landed.lastIndexOf(true), y = k >= 0 ? s.marks[k] : null;
        if (y !== null && y !== undefined) api.fx.burst(toPx(H.xOf(y)), ry, { n: 12, color: P.color("good"), speed: 100, life: 0.6, size: 3, kind: "spark" });
        setTimeout(() => api.sfx("good", m.kind === "solved" ? 0 : 1), 220);
        if (m.kind === "solved") { solvedAt = now; api.fx.flash(P.color("good"), 0.06); }
      }
      if (m.kind === "misconception_consequence" || m.kind === "near_miss" || (m.kind === "law_refused" && m.facts.why === "landed_off")) {
        const k = cur(), y = st().marks[k];
        if (k < n && y !== null && y !== undefined) miss = { k, y, truth: p.stones[k].year, at: now };
        api.fx.shake(2); setTimeout(() => api.sfx("look"), 200);
      }
    }
    api.invalidate(); deps.changed();
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done || cur() >= n) return;
    if (kind === "down") {
      const id = api.hit(x, y);
      if (id !== "boat" && id !== "river") return;
      drag = { x: clamp(toX(x), p.lo, p.hi) }; ctl.finger(true); api.sfx("select");
    } else if (kind === "move" && drag) drag.x = clamp(toX(x), p.lo, p.hi);
    else if ((kind === "up" || kind === "cancel") && drag) {
      const d = drag; drag = null; ctl.finger(false);
      act({ kind: "place", which: cur(), year: yearOfX(d.x) });
    }
    api.invalidate(); if (kind !== "move") deps.changed();
  }

  function update(dt: number): void {
    const b = boatX();
    if (b === null) { shown = null; return; }
    shown = shown === null || drag ? b : lerp(shown, b, 1 - Math.pow(0.0004, dt));
  }
  const busy = () => {
    const b = boatX(), t = api.t;
    return !!drag || (b !== null && shown !== null && Math.abs(shown - b) > span * 0.0005) || (miss !== null && t - miss.at < 1) || (landAt >= 0 && t - landAt < 0.8) || (solvedAt >= 0 && t - solvedAt < 0.8);
  };
  /** the miss drawing holds only while the boat still sits where the stone was dropped */
  const missShown = () => miss !== null && !drag && cur() === miss.k && st().marks[miss.k] === miss.y;

  // ── drawing ──
  function river(c: CanvasRenderingContext2D): void {
    const P = api.P, top = ry - RH / 2, bot = ry + RH / 2, xa = x0 - 16, xb = x1 + 16;
    P.fillPath(c, (g) => {
      g.moveTo(xa, top);
      for (let x = xa; x <= xb; x += 12) g.lineTo(x, top + Math.sin(x * 0.09) * 2);
      g.lineTo(xb, bot);
      for (let x = xb; x >= xa; x -= 12) g.lineTo(x, bot + Math.sin(x * 0.07 + 1) * 2);
      g.closePath();
    }, "water", { outline: "ink3", width: 1.5 });
    // bands: fade 1 shades every other interval; a century goal shades its centuries
    if (century || p.labels === 1) {
      c.save(); c.fillStyle = withAlpha(P.color("ink"), api.art.dark ? 0.12 : 0.08);
      for (let i = 0; i < nT; i++) if (i % 2 === 0) c.fillRect(toPx(p.lo + i * p.step), top, pxPer, RH);
      c.restore();
    }
  }
  function ticks(c: CanvasRenderingContext2D, labels: boolean): void {
    const P = api.P, bot = ry + RH / 2;
    if (p.minor > 0) for (let x = p.lo; x <= p.hi + 1e-9; x += p.minor) P.stroke(c, [[toPx(x), bot - 5], [toPx(x), bot + 4]], { role: "ink3", width: 1.2, seed: Math.round(x) });
    for (let i = 0; i <= nT; i++) {
      const t = p.lo + i * p.step, X = toPx(t);
      P.stroke(c, [[X, bot - 9], [X, bot + 9]], { role: "ink", width: 2.2, seed: i });
      if (labels && tickShown(i)) {
        P.text(c, String(Math.abs(t)), X, bot + 22, { size: 15, weight: 700, font: "mono", role: "ink2" });
        P.text(c, H.eraWord(t < 0, lang), X, bot + 40, { size: 14, role: "ink3" });
      }
    }
  }
  function divider(c: CanvasRenderingContext2D): void {
    if (!cross) return;
    const P = api.P, X = toPx(0), top = ry - RH / 2;
    P.stroke(c, [[X, top - 22], [X, ry + RH / 2 + 8]], { role: "q3", width: 3 });
    const ly = top - 32;
    P.text(c, `${H.eraWord(true, lang)} ◀`, X - 6, ly, { size: 14, weight: 700, role: "ink2", align: "right" });
    P.text(c, `▶ ${H.eraWord(false, lang)}`, X + 6, ly, { size: 14, weight: 700, role: "ink2", align: "left" });
    if (p.labels === 1 && !century) P.chip(c, W("kaal.noZero"), clamp(X, 70, w - 70), ry + RH / 2 + 66, { size: 14, role: "ink2" });
  }
  function centuryNames(c: CanvasRenderingContext2D): void {
    if (!century) return;
    const P = api.P, bot = ry + RH / 2, narrow = pxPer < 60;
    for (let i = 0; i < nT; i++) {
      const xa = p.lo + i * p.step, cc = H.centuryOf(H.yearAt(xa + 50)), X = toPx(xa + 50);
      // wide bands: "6th BCE" over "century"; narrow bands: "6th" over "BCE", and the word "century" once under the row
      const name = `${H.ordinal(Math.abs(cc), lang)}${cc < 0 && !narrow ? ` ${H.eraWord(true, lang)}` : ""}`;
      P.textFit(c, name, X, bot + 22, pxPer - 4, 20, { size: 15, weight: 700, role: "ink2" });
      if (!narrow) P.textFit(c, W("kaal.century"), X, bot + 41, pxPer - 6, 18, { size: 14, role: "ink3" });
      else if (cc < 0) P.text(c, H.eraWord(true, lang), X, bot + 40, { size: 14, role: "ink3" });
    }
    if (narrow) P.text(c, W("kaal.century"), (x0 + x1) / 2, bot + (p.lo < 0 ? 60 : 42), { size: 14, role: "ink3" });
  }
  function card(c: CanvasRenderingContext2D): void {
    const P = api.P, k = cur(), s = st();
    P.body(c, 12, 8, w - 24, cardH - 14, { role: "panel", r: 14 });
    if (k >= n) { P.textFit(c, W("kaal.title"), w / 2, 8 + (cardH - 14) / 2, w - 48, 30, { size: 18, weight: 800, role: "ink" }); return; }
    const stn = p.stones[k], gx = 40, gy = 8 + (cardH - 14) / 2;
    P.body(c, gx - 16, gy - 16, 32, 32, { role: "q1", r: 16, state: s.done ? "good" : "idle" });
    const tx = gx + 26, tw = w - 24 - (tx - 12) - 12, cx = tx + tw / 2;
    const yt = H.stoneYear(stn, lang);
    if (cardH < 90) P.textFit(c, p.text === "event" && stn.label ? `${stn.label[lang]} · ${yt}` : yt, cx, gy, tw, cardH - 20, { size: 15, weight: 800, role: "ink" });
    else if (p.text === "event" && stn.label) {
      P.textFit(c, stn.label[lang], cx, gy - 14, tw, 40, { size: 16, weight: 700, role: "ink" });
      P.text(c, yt, cx, gy + 22, { size: 18, weight: 800, font: "mono", role: "ink" });
    } else P.textFit(c, yt, cx, gy, tw, 34, { size: 22, weight: 800, font: "mono", role: "ink" });
    if (order) P.chip(c, `${k + 1}/${n}`, w - 38, 26, { size: 14, role: "ink2", font: "mono" });
  }
  function flags(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    let lvl = 0;
    p.stones.forEach((stn, i) => {
      if (!s.landed[i]) return;
      const X = toPx(H.xOf(stn.year)), top = ry - RH / 2 - 18 - (lvl++ % 2) * 24;
      P.stroke(c, [[X, ry], [X, top]], { role: "good", width: 2.5 });
      P.circle(c, X, ry, 7, { role: "q2", fill: true });
      P.chip(c, H.stoneYear(stn, lang), clamp(X, 48, w - 48), top - 10, { size: 14, role: "good", font: "mono" });
      if (s.done && solvedAt >= 0) P.tick(c, clamp(X + 30, 16, w - 16), ry + RH / 2 + 2, 16, clamp((api.t - solvedAt - 0.2) / 0.3, 0, 1));
    });
  }
  function truth(c: CanvasRenderingContext2D): void {
    if (!missShown() || !miss) return;
    const P = api.P, t = api.t, k = clamp((t - miss.at) / 0.7, 0, 1), bx = toPx(H.xOf(miss.y)), stn = p.stones[miss.k];
    if (century) {
      const cb = H.bandLo(H.centuryOf(miss.truth)), xa = toPx(cb), xb = toPx(cb + 100);
      P.stroke(c, [[xa, ry - RH / 2 - 4], [xb, ry - RH / 2 - 4], [xb, ry + RH / 2 + 4], [xa, ry + RH / 2 + 4]], { role: "look", width: 2.5, dash: [5, 4], closed: true });
      const g = Math.abs(Math.round((H.bandLo(H.centuryOf(miss.y)) - cb) / 100));
      if (k >= 1) P.chip(c, g === 1 ? W("kaal.gapC1") : W("kaal.gapC", { g }), clamp((xa + xb) / 2, 80, w - 80), ry - RH / 2 - 26, { size: 14, role: "look" });
      if (k < 1) api.invalidate();
      return;
    }
    const tx = toPx(H.xOf(miss.truth)), fx = lerp(bx, tx, ease.out(k)), fy = ry - Math.sin(Math.PI * k) * 26;
    // the stone floats from the boat to its true place
    P.body(c, fx - 9, fy - 9, 18, 18, { role: "q1", r: 9, state: "look" });
    if (k >= 1) {
      const gy = ry - RH / 2 - 50, g = H.yearsApart(miss.y, miss.truth);
      P.stroke(c, [[tx, ry], [tx, gy + 8]], { role: "look", width: 2 });
      P.stroke(c, [[bx, gy - 7], [bx, gy + 7]], { role: "look", width: 2 }); P.stroke(c, [[tx, gy - 7], [tx, gy + 7]], { role: "look", width: 2 });
      P.stroke(c, [[bx, gy], [tx, gy]], { role: "look", width: 2, dash: [5, 4] });
      P.chip(c, g === 1 ? W("kaal.gap1") : W("kaal.gap", { g }), clamp((bx + tx) / 2, 80, w - 80), gy - 18, { size: 14, role: "look" });
      P.chip(c, H.stoneYear(stn, lang), clamp(tx, 52, w - 52), ry + RH / 2 + 66, { size: 14, role: "look", font: "mono" });
    } else api.invalidate();
  }
  function boat(c: CanvasRenderingContext2D, X: number, Y: number, docked: boolean): void {
    const P = api.P;
    P.fillPath(c, (g) => { g.moveTo(X - 25, Y - 8); g.lineTo(X + 25, Y - 8); g.lineTo(X + 16, Y + 6); g.lineTo(X - 16, Y + 6); g.closePath(); }, "wood", { outline: "ink2", width: 1.5 });
    if (!docked) P.stroke(c, [[X, Y + 6], [X, ry + RH / 2 + 2]], { role: "q1", width: 2 });   // the keel: the exact landing point
    P.body(c, X - 11, Y - 30, 22, 22, { role: "q1", r: 11, state: drag ? "selected" : "idle", lift: drag ? 4 : 0 });
    api.target("boat", X - 28, Y - 40, 56, 58);
  }
  function loupe(c: CanvasRenderingContext2D): void {
    if (!drag || api.reduced) return;
    const P = api.P, X = toPx(drag.x), R = 46, cx = clamp(X, R + 4, w - R - 4), cy = Math.max(R + 4, ry - 132);
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
    P.veil(c, cx - R, cy - R, R * 2, R * 2, api.art.dark ? 0.94 : 0.97);
    c.translate(cx, cy); c.scale(2.5, 2.5); c.translate(-X, -(ry + RH / 2));
    ticks(c, false);
    P.stroke(c, [[X, ry + RH / 2 - 14], [X, ry + RH / 2 + 12]], { role: "q1", width: 1.4 });
    c.restore();
    P.circle(c, cx, cy, R, { role: "ink3", width: 2 });
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    card(c);
    river(c);
    api.target("river", x0 - 20, ry - RH / 2 - 44, x1 - x0 + 40, RH + 70);
    ticks(c, true);
    centuryNames(c);
    divider(c);
    flags(c);
    truth(c);
    if (!s.done && cur() < n) {
      if (shown === null) {
        const X = x0 + 30, Y = Math.max(cardH + 34, ry - RH / 2 - 52);
        boat(c, X, Y, true);
        P.text(c, W("kaal.drag"), X + 34, Y - 10, { size: 14, weight: 700, role: "ink2", align: "left" });
      } else boat(c, toPx(shown), ry - 2, false);
    }
    loupe(c);
  }

  function goal(): string {
    const k = cur(); if (k >= n) return W("kaal.title");
    const v = H.stoneYear(p.stones[k], lang);
    return century ? W("kaal.goal.century", { v }) : order ? W("kaal.goal.order", { i: k + 1, n, v }) : W("kaal.goal.place", { v });
  }
  // no readout: the year under the boat IS the answer the river is there to give
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const k = cur(); if (k >= n) return [];
    const m = s.marks[k] ?? null;
    const d = p.tol === 0 ? 1 : Math.max(1, p.minor || p.tol);   // a nudge: one year on a short river, else one small tick
    const nudge = (dir: number) => m !== null && act({ kind: "place", which: k, year: yearOfX(H.xOf(m) + dir * d) });
    return [
      { id: "nudge-left", label: "◀", aria: "move the boat a little earlier", kind: "pad", group: "nudge", disabled: m === null, onPress: () => nudge(-1) },
      { id: "nudge-right", label: "▶", aria: "move the boat a little later", kind: "pad", group: "nudge", disabled: m === null, onPress: () => nudge(1) },
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("kaal.run"), kind: "primary", group: "go", you: m !== null, disabled: m === null, onPress: () => act({ kind: "check" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
