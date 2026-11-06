// Koshtak · the 2D view (round 7, expressions; class 7). Nothing here runs on a clock: every wall, lid, jump and card moves on
// the child's touch, and the run (the counter, the two walks, the bins closing) only shows what the law has already answered.
//   tray (terms)  the row's numbers stand on trays; tap a gap to snap a tray wall into it (again lifts it). On the run each
//                 tray is worked out on its own (its value under it), then the trays' values are joined by the signs at
//                 the walls; the counter's total shows. After a miss a magnifier marks a tray that is not one term
//   tray (lid)    the value to make stands above the row; tap a number, then another: one lid (a bracket) covers them (the
//                 same lid again lifts it). On the run the lid's inside is worked out first, then the row
//   tray (open)   the bracketed row stands above; below it the bracket is opened and its numbers lie as jumps (back −,
//                 forward +); tap a jump to turn it. On the run two walks go along one number line: the bracket as one big
//                 jump back (above the line) and the opened jumps (below); they must land on the same number
//   bin (like)    term cards (their signs printed) on the belt; tap a card, then a bin, to put it in (tap the belt to put a
//                 card back). On the run each bin closes into one term where its cards stack (same letter part), and the
//                 shelf is tried against the belt's expression with numbers for the letters
// After a missed run only magnifiers mark what is not as it should be (a tray, a wall, the total, a jump, a bin, a card).
import type { KoshtakAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  binsOf, binTerm, innerGaps, leftToRight, lidValue, openedOps, termGaps, termsValue, termText, traysOf, triesOf, worth,
  type KoshtakParams, type KoshtakState, type Op,
} from "./koshtak.logic.ts";

const SWEEP = 1.4;
const STRIP = 60;    // px the portrait check strip takes (three tries side by side)   // s a run takes on screen (cosmetic: the law has already answered)
/** what a sign does, coloured at the first fade: × binds two numbers into one term; + and − join terms */
const opRole = (o: Op, face: number): Role => (face === 1 ? (o === "×" ? "q2" : "q3") : "ink");

export const makeKoshtakView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<KoshtakParams, KoshtakState, KoshtakAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, tray = p.goal !== "like";
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const len = p.n.length, B = tray ? 0 : binsOf(p);

  let w = 360, h = 480;
  // tray: the row's cards
  let cw = 56, gw = 32, ch = 56, rowX = 8, rowY = 80, topY = 8, topH = 56, lineY = 0, workY = 0;
  // bin: the belt's grid and the bins
  let bcw = 80, bch = 46, bcols = 4, beltX = 8, beltY = 8, beltH = 100, binW = 70, binX = 8, binY = 0, binH = 200, chkX = 8, chkY = 0, chkW = 300;
  let sel = -1;           // lid: the first number tapped · bin: the card picked up
  let runAt = -1;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (tray) {
      topY = 8; topH = p.goal === "terms" ? 0 : 56;
      const avail = Math.min(w - 24, 640);
      cw = Math.min(76, avail / (len + (len - 1) * 0.62)); gw = cw * 0.62; ch = clamp(cw, 48, 64);
      rowX = (w - (len * cw + (len - 1) * gw)) / 2;
      rowY = topY + topH + Math.max(p.goal === "terms" ? 26 : 30, Math.round(h * (p.goal === "terms" ? 0.12 : 0.05)));
      workY = rowY + ch + 30;
      lineY = Math.min(h - 70, workY + 60);
    } else {
      const wide = w > h * 1.15;
      const leftW = wide ? w * 0.62 : w;
      bcols = Math.min(p.cards.length, leftW >= 520 ? 6 : 4);
      bcw = Math.min(96, (leftW - 16 - 8 * (bcols - 1)) / bcols); bch = 46;
      const rows = Math.ceil(p.cards.length / bcols);
      beltX = (leftW - (bcols * bcw + (bcols - 1) * 8)) / 2; beltY = 8; beltH = rows * (bch + 8) + 8;
      binY = beltY + beltH + 14;
      binW = Math.min(110, (leftW - 16 - 8 * (B - 1)) / B); binX = (leftW - (B * binW + (B - 1) * 8)) / 2;
      chkW = Math.min(wide ? w - leftW - 24 : w - 16, 420);
      // the check: a table beside the bins (wide), or a strip of three tries under them (portrait)
      const chkH = wide ? 4 * 30 + 16 : STRIP;
      if (wide) { binH = h - binY - 8; chkX = leftW + (w - leftW - chkW) / 2; chkY = Math.max(8, (h - chkH) / 2); }
      else { binH = Math.max(150, h - binY - chkH - 14); chkX = (w - chkW) / 2; chkY = binY + binH + 8; }
    }
  }
  const act = (a: KoshtakAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KoshtakAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "wall" || last.kind === "lid") api.sfx("land");
    else if (last.kind === "flip") api.sfx("tick");
    else api.sfx("tap");
    if (!st().ended) runAt = -1;
    void ms;
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
      api.invalidate(); deps.changed();
    }
  }
  const busy = () => runAt >= 0 && runK() < 1;

  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done || kind !== "down") return;
    const id = api.hit(x, y);
    if (!id) return;
    if (id.startsWith("gap-")) act({ kind: "wall", at: Number(id.slice(4)) });
    else if (id.startsWith("jump-")) act({ kind: "flip", at: Number(id.slice(5)) });
    else if (id.startsWith("num-")) {
      const i = Number(id.slice(4));
      if (sel < 0) { sel = i; api.sfx("select"); }
      else if (sel === i) sel = -1;
      else { const a = sel; sel = -1; act({ kind: "lid", from: a, to: i }); }
    } else if (id.startsWith("card-")) {
      const i = Number(id.slice(5));
      sel = sel === i ? -1 : i; api.sfx("select");
    } else if (id.startsWith("bin-") && sel >= 0) {
      const b = Number(id.slice(4)), i = sel; sel = -1;
      if (s.where[i] !== b) act({ kind: "bin", card: i, to: b });
    } else if (id === "belt" && sel >= 0) {
      const i = sel; sel = -1;
      if (s.where[i] >= 0) act({ kind: "bin", card: i, to: -1 });
    }
    api.invalidate(); deps.changed();
  }

  // ── tray drawing ──
  const cardX = (i: number) => rowX + i * (cw + gw);
  const gapX = (g: number) => cardX(g) + cw + gw / 2;
  const numSize = () => clamp(cw * 0.42, 18, 30);
  function numCard(c: CanvasRenderingContext2D, i: number, label: string, role: Role, state: "idle" | "selected" | "look" = "idle"): void {
    const P = api.P;
    P.body(c, cardX(i), rowY, cw, ch, { role, r: 10, state, seed: 11 + i });
    P.textFit(c, label, cardX(i) + cw / 2, rowY + ch / 2, cw - 6, ch - 6, { size: numSize(), weight: 800, font: "mono", on: role });
  }
  function signAt(c: CanvasRenderingContext2D, g: number, o: Op, y = rowY + ch / 2, role?: Role): void {
    api.P.text(c, o, gapX(g), y, { size: clamp(gw * 0.7, 18, 28), role: role ?? opRole(o, p.face), weight: 800, font: "mono" });
  }
  /** the result line under the row: the made value, and the goal mark on it */
  function resultLine(c: CanvasRenderingContext2D, text: string, ok: boolean, end: boolean, y: number): void {
    const P = api.P, bw = Math.min(w - 16, 460);
    P.body(c, (w - bw) / 2, y - 22, bw, 44, { role: "panel", r: 10, state: end && !ok ? "look" : "idle" });
    P.textFit(c, text, w / 2, y, bw - 70, 40, { size: 20, role: "ink", weight: 700, font: "mono" });
    if (end && ok) P.tick(c, (w + bw) / 2 - 24, y, 22, 1);
    if (end && !ok) P.magnifier(c, (w + bw) / 2 - 22, y, 15);
  }

  function drawTerms(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    const trays = traysOf(len, s.walls), right = termGaps(p.ops);
    // the trays under the cards
    trays.forEach(([a, b], t) => {
      const x0 = cardX(a) - 6, x1 = cardX(b) + cw + 6;
      const bad = end && !s.done && (p.ops.slice(a, b).some((o) => o !== "×") || (a > 0 && p.ops[a - 1] === "×"));
      P.body(c, x0, rowY - 10, x1 - x0, ch + 20, { role: "panel", r: 12, state: bad ? "look" : "idle", seed: 40 + t });
      if (bad) P.magnifier(c, x1 - 12, rowY - 12, 13);
    });
    for (let i = 0; i < len; i++) numCard(c, i, String(p.n[i]), "q1");
    for (let g = 0; g < len - 1; g++) {
      const wall = s.walls.includes(g), x = gapX(g);
      if (!s.done) api.target(`gap-${g}`, x - Math.max(22, gw / 2), rowY - 14, Math.max(44, gw), ch + 28);
      if (wall) {
        P.stroke(c, [[x, rowY - 16], [x, rowY + 6]], { role: "you", width: 4 });
        P.stroke(c, [[x, rowY + ch - 6], [x, rowY + ch + 16]], { role: "you", width: 4 });
      } else if (p.face < 3) {
        // an empty wall slot: where a wall can snap in
        P.stroke(c, [[x, rowY - 14], [x, rowY + 4]], { role: "ink3", width: 2, dash: [3, 3] });
        P.stroke(c, [[x, rowY + ch - 4], [x, rowY + ch + 14]], { role: "ink3", width: 2, dash: [3, 3] });
      } else P.stroke(c, [[x, rowY + ch + 6], [x, rowY + ch + 12]], { role: "ink3", width: 1.5 });
      signAt(c, g, p.ops[g]);
      void right;
    }
    // the run: each tray's value under it, then the trays joined
    if (ran) {
      const vals = trays.map(([a, b]) => leftToRight(p.n.slice(a, b + 1), p.ops.slice(a, b)));
      trays.forEach(([a, b], t) => {
        if (k * trays.length < t + 0.3) return;
        const cx = (cardX(a) + cardX(b) + cw) / 2;
        P.stroke(c, [[cx, rowY + ch + 12], [cx, workY - 18]], { role: "ink3", width: 1.5 });
        P.chip(c, String(vals[t]), cx, workY, { size: 18, role: "q1" });
      });
      if (k >= 0.6) {
        let line = String(vals[0]), total = vals[0];
        for (let t = 1; t < trays.length; t++) { const o = p.ops[trays[t][0] - 1]; line += ` ${o} ${vals[t]}`; total = o === "+" ? total + vals[t] : o === "−" ? total - vals[t] : total * vals[t]; }
        resultLine(c, trays.length > 1 ? `${line} = ${total}` : `= ${total}`, s.done, end, workY + 58);
      }
    }
  }

  function drawLid(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    // the value to make
    const bw = Math.min(w - 16, 300);
    P.body(c, (w - bw) / 2, topY, bw, topH, { role: "panel", r: 10 });
    P.textFit(c, W("koshtak.make"), (w - bw) / 2 + bw * 0.32, topY + topH / 2, bw * 0.56, topH - 8, { size: 18, role: "ink2", weight: 700 });
    P.text(c, String(p.target), (w - bw) / 2 + bw * 0.78, topY + topH / 2, { size: 28, role: "ink", weight: 800, font: "mono" });
    // the lid (above the row) and its brackets
    const lid = s.lid;
    if (lid) {
      const x0 = cardX(lid[0]) - 4, x1 = cardX(lid[1]) + cw + 4;
      P.body(c, x0, rowY - 20, x1 - x0, 12, { role: "q2", r: 6 });
      P.text(c, "(", x0 - 2, rowY + ch / 2, { size: clamp(ch * 0.8, 26, 44), role: "q2", weight: 500, font: "mono" });
      P.text(c, ")", x1 + 2, rowY + ch / 2, { size: clamp(ch * 0.8, 26, 44), role: "q2", weight: 500, font: "mono" });
    }
    for (let i = 0; i < len; i++) {
      const inLid = !!lid && i >= lid[0] && i <= lid[1];
      numCard(c, i, String(p.n[i]), inLid ? "q2" : "q1", sel === i ? "selected" : "idle");
      if (!s.done) api.target(`num-${i}`, cardX(i) - 2, rowY - 2, cw + 4, ch + 4);
    }
    for (let g = 0; g < len - 1; g++) signAt(c, g, p.ops[g]);
    if (ran) {
      const made = lidValue(p.n, p.ops, lid);
      let y = workY + 8;
      if (lid && k >= 0.2) {
        const inner = worth(p.n.slice(lid[0], lid[1] + 1), p.ops.slice(lid[0], lid[1]));
        P.chip(c, `( ) = ${inner}`, (cardX(lid[0]) + cardX(lid[1]) + cw) / 2, y, { size: 18, role: "q2" });
        y += 48;
      }
      if (k >= 0.6) resultLine(c, `= ${made}`, s.done, end, y + 14);
    }
  }

  function drawOpen(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended, br = p.br!;
    // the bracketed row as written
    const parts: string[] = [];
    for (let i = 0; i < len; i++) {
      const pre = i === 0 ? "" : `${p.ops[i - 1]} `;
      parts.push(`${pre}${i === br[0] ? "(" : ""}${p.n[i]}${i === br[1] ? ")" : ""}`);
    }
    const bw = Math.min(w - 16, 460);
    P.body(c, (w - bw) / 2, topY, bw, topH, { role: "panel", r: 10 });
    P.textFit(c, parts.join(" "), w / 2, topY + topH / 2, bw - 16, topH - 6, { size: 24, role: "ink", weight: 800, font: "mono" });
    // the opened row: the first number, then a jump card for every gap (its sign IS its direction)
    const ops = openedOps(p.ops, s.flips), right = openedOps(p.ops, innerGaps(br));
    if (p.face === 1) {
      const x0 = cardX(br[0]) - gw * 0.8, x1 = cardX(br[1]) + cw + 4;
      P.stroke(c, [[x0, rowY - 8], [x1, rowY - 8]], { role: "ink3", width: 2, dash: [5, 4] });
    }
    numCard(c, 0, String(p.n[0]), "q1");
    for (let g = 0; g < len - 1; g++) {
      const i = g + 1, back = ops[g] === "−", x = cardX(i) - gw * 0.8, jw = cw + gw * 0.8;
      const bad = end && !s.done && ops[g] !== right[g];
      P.body(c, x, rowY, jw, ch, { role: back ? "q3" : "q4", r: 10, state: bad ? "look" : "idle", seed: 60 + g });
      P.textFit(c, `${ops[g]} ${p.n[i]}`, x + jw / 2, rowY + ch / 2 + (p.face < 3 ? 6 : 0), jw - 6, ch - 14, { size: numSize(), weight: 800, font: "mono", on: back ? "q3" : "q4" });
      if (p.face < 3) P.text(c, back ? "←" : "→", x + jw / 2, rowY + 12, { size: 16, on: back ? "q3" : "q4", weight: 800 });
      if (bad) P.magnifier(c, x + jw - 10, rowY + ch - 8, 12);
      if (!s.done) api.target(`jump-${g}`, x, rowY, jw, ch);
    }
    if (!ran) return;
    // the walks: above the line the bracketed row (the bracket as one jump), below it the opened jumps
    const inner = worth(p.n.slice(br[0], br[1] + 1), p.ops.slice(br[0], br[1]));
    const bn = [...p.n.slice(0, br[0]), inner, ...p.n.slice(br[1] + 1)], bo = [...p.ops.slice(0, br[0]), ...p.ops.slice(br[1])];
    const walk = (n: number[], o: Op[]) => n.map((_, i) => leftToRight(n.slice(0, i + 1), o.slice(0, i)));
    const top = walk(bn, bo), bot = walk(p.n, ops);
    const lo = Math.min(0, ...top, ...bot), hi = Math.max(...top, ...bot);
    const lx = 24, rx = w - 24, X = (v: number) => lx + ((v - lo) / Math.max(1, hi - lo)) * (rx - lx);
    const y = lineY;
    P.stroke(c, [[lx, y], [rx, y]], { role: "ink2", width: 2 });
    for (const v of [lo, hi]) { P.stroke(c, [[X(v), y - 6], [X(v), y + 6]], { role: "ink3", width: 1.5 }); }
    const hop = (path: number[], up: boolean, role: Role, upto: number) => {
      for (let i = 1; i < path.length && i <= upto; i++) {
        const a = X(path[i - 1]), b = X(path[i]), mid = (a + b) / 2, hgt = up ? -26 : 26;
        const pts: [number, number][] = [];
        for (let t = 0; t <= 12; t++) { const u = t / 12; pts.push([a + (b - a) * u, y + hgt * 4 * u * (1 - u)]); }
        P.stroke(c, pts, { role, width: 3 });
        void mid;
      }
    };
    const steps = Math.ceil(k * Math.max(top.length, bot.length));
    hop(top, true, "q2", steps); hop(bot, false, "q4", steps);
    P.circle(c, X(top[0]), y, 5, { role: "ink", fill: true });
    P.text(c, String(top[0]), X(top[0]), y + 44, { size: 16, role: "ink2", weight: 700, font: "mono", maxW: 60 });
    if (k >= 1) {
      const tEnd = top[top.length - 1], bEnd = bot[bot.length - 1];
      P.circle(c, X(tEnd), y - 10, 6, { role: "q2", fill: true });
      P.circle(c, X(bEnd), y + 10, 6, { role: "q4", fill: true });
      P.text(c, String(tEnd), X(tEnd), y - 44, { size: 18, role: "ink", weight: 800, font: "mono", maxW: 60 });
      if (bEnd !== tEnd) P.text(c, String(bEnd), X(bEnd), y + 44, { size: 18, role: "ink", weight: 800, font: "mono", maxW: 60 });
      if (s.done) P.tick(c, X(tEnd) + 28, y - 30, 22, 1);
      else P.magnifier(c, X(bEnd) + 20, y + 26, 13);
    }
  }

  // ── bin drawing ──
  const beltCell = (i: number): [number, number] => [beltX + (i % bcols) * (bcw + 8), beltY + 8 + Math.floor(i / bcols) * (bch + 8)];
  function termCard(c: CanvasRenderingContext2D, i: number, x: number, y: number, cwid: number, chgt: number): void {
    const P = api.P, t = p.cards[i], role: Role = t.v === "" ? "q3" : t.v.length > 1 ? "q4" : "q1";
    P.body(c, x, y, cwid, chgt, { role, r: 8, state: sel === i ? "selected" : "idle", seed: 90 + i });
    P.textFit(c, termText(t, true), x + cwid / 2, y + chgt / 2, cwid - 6, chgt - 4, { size: 20, weight: 800, font: "mono", on: role });
    if (!st().done) api.target(`card-${i}`, x, y, cwid, Math.max(chgt, 30));
  }
  function drawLike(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    const leftW = w > h * 1.15 ? w * 0.62 : w;
    // the belt
    const bx = Math.max(8, beltX - 8), bwid = Math.min(leftW - 16, bcols * bcw + (bcols - 1) * 8 + 16);
    P.body(c, bx, beltY, bwid, beltH, { role: "panel", r: 12, state: end && !s.done && s.where.some((b) => b < 0) ? "look" : "idle" });
    if (!s.done) api.target("belt", bx, beltY, bwid, beltH);
    p.cards.forEach((_, i) => {
      const [x, y] = beltCell(i);
      if (s.where[i] < 0) { termCard(c, i, x, y, bcw, bch); if (end && !s.done) P.magnifier(c, x + bcw - 8, y + 8, 10); }
      else P.stroke(c, [[x + 6, y + bch - 4], [x + bcw - 6, y + bch - 4]], { role: "ink3", width: 1.5, dash: [4, 4] });
    });
    // the bins
    for (let b = 0; b < B; b++) {
      const x = binX + b * (binW + 8), inIt = p.cards.map((_, i) => i).filter((i) => s.where[i] === b);
      const term = binTerm(p.cards, s.where, b), shut = ran && k >= 0.5 && inIt.length > 0;
      const bad = end && !s.done && inIt.length > 0 && (!term || inIt.length > 0 && p.cards.filter((_, i) => s.where[i] >= 0 && s.where[i] !== b).some((t) => term && t.v === term.v));
      P.body(c, x, binY + 44, binW, binH - 44, { role: "panel", r: 10, state: bad ? "look" : "idle", seed: 120 + b });
      if (!s.done) api.target(`bin-${b}`, x, binY, binW, binH);
      const sh = Math.min(40, (binH - 56) / Math.max(2, inIt.length) - 4);
      inIt.forEach((i, j) => termCard(c, i, x + 4, binY + 50 + j * (sh + 4), binW - 8, sh));
      // the lid: closed with the one term the cards stack into, or left open (cards of different kinds do not stack)
      if (shut && term) {
        P.body(c, x - 2, binY + 6, binW + 4, 34, { role: "q2", r: 8 });
        P.textFit(c, termText(term), x + binW / 2, binY + 23, binW - 8, 30, { size: 20, weight: 800, font: "mono", on: "q2" });
      } else {
        P.stroke(c, [[x + 4, binY + 40], [x + binW - 10, binY + (shut ? 14 : 36)]], { role: shut ? "look" : "ink3", width: 4 });
      }
      if (bad) P.magnifier(c, x + binW - 12, binY + 54, 12);
    }
    // the check: the belt's expression and the shelf, tried with numbers for the letters
    if (ran && k >= 0.8) {
      const tries = triesOf(p.cards), shelf: { c: number; v: string }[] = [];
      for (let b = 0; b < B; b++) { const inIt = p.cards.filter((_, i) => s.where[i] === b); shelf.push(...inIt); }
      const wide = w > h * 1.15;
      if (wide) {
        P.body(c, chkX, chkY, chkW, 4 * 30 + 16, { role: "panel", r: 10 });
        P.textFit(c, W("koshtak.try"), chkX + chkW * 0.3, chkY + 22, chkW * 0.56, 28, { size: 16, role: "ink2", weight: 700 });
        P.text(c, W("koshtak.belt"), chkX + chkW * 0.68, chkY + 22, { size: 16, role: "ink2", weight: 700, maxW: chkW * 0.16 });
        P.text(c, W("koshtak.shelf"), chkX + chkW * 0.88, chkY + 22, { size: 16, role: "ink2", weight: 700, maxW: chkW * 0.2 });
      } else P.body(c, chkX, chkY, chkW, STRIP, { role: "panel", r: 10 });
      tries.forEach((vals, r) => {
        const a = termsValue(p.cards, vals), b = termsValue(shelf, vals);
        const label = Object.entries(vals).map(([ch0, v]) => `${ch0}=${v}`).join(" ");
        if (wide) {
          const y = chkY + 22 + (r + 1) * 30;
          P.textFit(c, label, chkX + chkW * 0.3, y, chkW * 0.56, 28, { size: 16, role: "ink", weight: 700, font: "mono" });
          P.text(c, String(a), chkX + chkW * 0.68, y, { size: 18, role: "ink", weight: 800, font: "mono", maxW: chkW * 0.16 });
          P.text(c, String(b), chkX + chkW * 0.88, y, { size: 18, role: a === b ? "ink" : "look", weight: 800, font: "mono", maxW: chkW * 0.2 });
        } else {
          // one try per column: the letters' values, then the belt's value and the bins' value (= when they agree)
          const cx = chkX + (chkW / 3) * (r + 0.5), colW = chkW / 3 - 8;
          P.textFit(c, label, cx, chkY + 17, colW, 24, { size: 16, role: "ink2", weight: 700, font: "mono" });
          P.textFit(c, `${a} ${a === b ? "=" : "≠"} ${b}`, cx, chkY + 42, colW, 26, { size: 18, role: a === b ? "ink" : "look", weight: 800, font: "mono" });
        }
      });
      if (end && s.done) { if (wide) P.tick(c, chkX + chkW - 16, chkY - 14, 18, 1); else P.tick(c, binX + B * (binW + 8) - 22, binY + 22, 18, 1); }
    }
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (p.goal === "terms") drawTerms(c);
    else if (p.goal === "lid") drawLid(c);
    else if (p.goal === "open") drawOpen(c);
    else drawLike(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("koshtak.again");
    return W(`koshtak.goal.${p.goal}`);
  }
  // no readout of the value or the simplest form: the trays, the walks and the bins ARE them
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (p.goal === "like") ready = ready && s.where.some((b) => b >= 0);
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => { sel = -1; act({ kind: "undo" }); } });
    const runKey = p.goal === "open" ? "koshtak.walk" : p.goal === "like" ? "koshtak.close" : "koshtak.count";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => { sel = -1; act({ kind: "run" }); } });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => false };
  return view;
};
