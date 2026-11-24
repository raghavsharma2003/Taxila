// Aankde · the 2D view (round 7, data and statistics; classes 6-7). Nothing here runs on a clock: every slip, stroke, block,
// line, card and peg moves on the child's touch, and the run (the table read, the towers checked, the pour, the fold) only
// shows what the law has already answered.
//   tally (sort, mode)  the pile's top slip waits above the rows. Tap a row to take the slip into it as an upright stroke, or
//                       the row's ⟋ button to take it in as a stroke across the four before it. Mode: tap a size's label to
//                       put the stock crate on it. On "count" each row is read (a stroke across closes a bundle of five) into
//                       the count column, then the total row is added against the slips the survey had
//   tally (missing)     the children asked stand above; every row but the lost one stands tallied; stroke the lost row
//   stack (even)        towers of blocks; tap a tower to lift its top block, then another to drop it there. On "level" the
//                       law checks every tower stands at one height
//   stack (pour)        tap a height to set the level line. On "pour" the blocks above the line drop one by one into the
//                       gaps below it; what is left over, or still empty, shows
//   line (middle)       value cards as written; tap a card, then another, to swap them; tap under a card or a gap to set
//                       the peg. On "fold" the line folds from both ends, pair by pair, to its middle
// After a missed run only magnifiers mark what is not as it should be (a row, the pile, the crate, a tower, a gap, a card).
import type { AankdeAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  aboveOf, bundled, CAP, countsOf, gapsOf, inOrder, lineValues, meanOf, medianOf, middleSlot, modeRow, numText, readRow, slotValue,
  type AankdeParams, type AankdeState,
} from "./aankde.logic.ts";

const SWEEP = 1.6;   // s a run takes on screen (cosmetic: the law has already answered)
const ROLES: Role[] = ["q1", "q2", "q3", "q4"];
const rowRole = (r: number): Role => ROLES[r % ROLES.length];

export const makeAankdeView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<AankdeParams, AankdeState, AankdeAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const tally = p.goal === "sort" || p.goal === "missing" || p.goal === "mode";
  const stack = p.goal === "even" || p.goal === "pour";
  const K = p.cats.length, N = p.h.length;
  const catText = (r: number) => (p.goal === "mode" ? W("aankde.size", { n: p.cats[r] }) : W(`aankde.cat.${p.cats[r]}`));

  let w = 360, h = 480;
  // tally
  let topH = 60, rowsY = 80, rowH = 52, labW = 96, gateW = 46, cntW = 50, markX = 110, markW = 160, totY = 0, colX = 0, colW = 360;
  // stack
  let axisX = 28, baseY = 400, bh = 22, towW = 56, towGap = 10, towX0 = 40, capY = 8;
  // the levels the axis shows: pour a few above the tallest tower; even every height a tower can reach (all the blocks)
  const R = p.goal === "pour" ? Math.min(CAP, Math.max(...p.h, 0) + 3) : Math.min(CAP, Math.max(4, p.h.reduce((x, y) => x + y, 0)));
  // line
  let cw = 56, cgap = 12, cardY = 70, cardH = 64, lineX0 = 12, pegY = 150;
  let sel = -1;           // even: the tower whose top block is lifted · middle: the card picked up
  let runAt = -1;

  function layout(bw: number, bh0: number): void {
    w = bw; h = bh0;
    colW = Math.min(w - 16, 640); colX = (w - colW) / 2;
    if (tally) {
      topH = 60;
      const avail = h - topH - 16 - 56;
      rowH = clamp(Math.floor(avail / K), 44, 76);
      rowsY = topH + 12;
      totY = rowsY + K * rowH + 6;
      labW = clamp(Math.round(colW * 0.27), 80, 150);
      gateW = 46; cntW = 52;
      markX = colX + labW + 10;
      markW = colW - labW - 10 - gateW - 8 - cntW - 6;
    } else if (stack) {
      capY = p.goal === "pour" && p.face === 1 ? 52 : 34;
      baseY = h - 24;
      bh = clamp(Math.floor((baseY - capY - 8) / R), 12, 34);
      axisX = colX + 26;
      towGap = 10;
      towW = Math.min(72, (colW - 34 - towGap * (N - 1)) / N);
      towX0 = axisX + 8 + (colW - 34 - (N * towW + (N - 1) * towGap)) / 2;
    } else {
      cgap = 12;
      cw = Math.min(70, (colW - cgap * (N - 1)) / N);
      lineX0 = colX + (colW - (N * cw + (N - 1) * cgap)) / 2;
      cardY = 70; cardH = clamp(cw * 1.1, 56, 72);
      pegY = cardY + cardH + 12;
    }
  }
  const act = (a: AankdeAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as AankdeAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "mark") api.sfx(last.across ? "land" : "tick");
    else if (last.kind === "move" || last.kind === "crown") api.sfx("drop");
    else if (last.kind === "swap" || last.kind === "peg" || last.kind === "line") api.sfx("land");
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
    if (id.startsWith("row-")) act({ kind: "mark", row: Number(id.slice(4)), across: false });
    else if (id.startsWith("x-")) act({ kind: "mark", row: Number(id.slice(2)), across: true });
    else if (id.startsWith("lab-")) act({ kind: "crown", row: Number(id.slice(4)) });
    else if (id.startsWith("tw-")) {
      const i = Number(id.slice(3));
      if (sel < 0) { if (s.h[i] > 0) { sel = i; api.sfx("select"); } }
      else if (sel === i) sel = -1;
      else { const a = sel; sel = -1; act({ kind: "move", from: a, to: i }); }
    } else if (id.startsWith("lv-")) act({ kind: "line", at: Number(id.slice(3)) });
    else if (id.startsWith("card-")) {
      const i = Number(id.slice(5));
      if (sel < 0) { sel = i; api.sfx("select"); }
      else if (sel === i) sel = -1;
      else { const a = sel; sel = -1; act({ kind: "swap", i: a, j: i }); }
    } else if (id.startsWith("slot-")) { sel = -1; const v = Number(id.slice(5)); if (v !== s.peg) act({ kind: "peg", at: v }); }
    api.invalidate(); deps.changed();
  }

  // ───────────── tally ─────────────
  /** the strokes of a row, drawn as a reader sees them: uprights, and each across laid over the uprights before it */
  function drawMarks(c: CanvasRenderingContext2D, marks: readonly boolean[], x0: number, cy: number, maxW: number, role: Role, faint = false): number {
    const P = api.P, groups = marks.reduce((g, m) => g + (m ? 1 : 0), 0) + 1;
    const sp = clamp(maxW / (marks.length + groups * 1.4 + 1), 4, 11), mh = clamp(rowH * 0.56, 22, 34);
    let x = x0 + sp * 0.5, start = x;
    const width = sp > 7 ? 3 : 2.2;
    marks.forEach((m) => {
      if (!m) { P.stroke(c, [[x, cy - mh / 2], [x, cy + mh / 2]], { role, width, alpha: faint ? 0.75 : 1 }); x += sp; }
      else {
        const a = start - sp * 0.45, b = Math.max(x - sp * 0.55, start + sp * 0.6);
        P.stroke(c, [[a, cy + mh / 2 - 2], [b, cy - mh / 2 + 2]], { role, width: width + 0.4, alpha: faint ? 0.75 : 1 });
        x += sp * 1.4; start = x;
      }
    });
    return x;
  }
  function drawTally(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended, lost = K - 1;
    // the pile / the children asked
    if (p.goal === "missing") {
      const bw = Math.min(colW, 420);
      P.body(c, (w - bw) / 2, 6, bw, topH - 12, { role: "panel", r: 10 });
      P.textFit(c, W("aankde.asked", { n: p.total }), w / 2, 6 + (topH - 12) / 2, bw - 16, topH - 16, { size: 20, role: "ink", weight: 800 });
    } else {
      const left = p.slips.length - s.put.length, sw = Math.min(190, colW * 0.52), sx = colX + 4;
      for (let d = Math.min(3, left - 1); d >= 1; d--) P.body(c, sx + d * 4, 6 + d * 3, sw, topH - 14, { role: "panel", r: 8, seed: 7 + d });
      if (left > 0) {
        const r = p.slips[s.put.length];
        P.body(c, sx, 6, sw, topH - 14, { role: rowRole(r), r: 8, seed: 3, state: end && !s.done && left > 0 ? "look" : "idle" });
        P.textFit(c, catText(r), sx + sw / 2, 6 + (topH - 14) / 2, sw - 14, topH - 18, { size: 20, weight: 800, on: rowRole(r) });
        if (end && !s.done) P.magnifier(c, sx + sw - 6, 10, 12);
      } else P.stroke(c, [[sx + 8, topH - 10], [sx + sw - 8, topH - 10]], { role: "ink3", width: 1.5, dash: [4, 4] });
      P.textFit(c, W("aankde.left", { n: left }), sx + sw + (colX + colW - sx - sw) / 2 + 6, 6 + (topH - 14) / 2, colX + colW - sx - sw - 20, topH - 18, { size: 18, role: "ink2", weight: 700 });
    }
    // the rows
    const counts = p.goal === "missing" ? null : countsOf(p);
    const read = s.rows.map(readRow);
    for (let r = 0; r < K; r++) {
      const y = rowsY + r * rowH, cy = y + rowH / 2, role = rowRole(r), marks = s.rows[r];
      const standing = p.goal === "missing" && r !== lost;
      const wrong = end && !s.done && (p.goal === "missing" ? r === lost : (marks.length !== counts![r] || !bundled(marks)));
      P.body(c, colX, y + 3, colW, rowH - 6, { role: "panel", r: 10, state: wrong ? "look" : "idle", seed: 30 + r });
      // the label (mode: tap it to put the stock crate there)
      const crown = p.goal === "mode" && s.crown === r;
      P.body(c, colX + 4, y + 7, labW, rowH - 14, { role, r: 8, seed: 50 + r, state: crown ? "selected" : "idle" });
      P.textFit(c, catText(r), colX + 4 + labW / 2 + (crown ? 9 : 0), cy, labW - (crown ? 26 : 10), rowH - 18, { size: 18, weight: 800, on: role });
      if (crown) {
        const bx = colX + 9, by = cy - 9;
        P.body(c, bx, by, 18, 18, { role: "you", r: 3 });
        P.stroke(c, [[bx + 2, by + 2], [bx + 16, by + 16]], { role: "ink", width: 1.5 });
        P.stroke(c, [[bx + 16, by + 2], [bx + 2, by + 16]], { role: "ink", width: 1.5 });
        if (end && !s.done && s.crown !== modeRow(p)) P.magnifier(c, colX + labW, y + 10, 11);
      }
      if (p.goal === "mode" && !s.done) api.target(`lab-${r}`, colX + 4, y + 4, labW, rowH - 8);
      // the strokes, and where the next one goes
      const x = drawMarks(c, marks, markX, cy, markW, standing ? "ink2" : "ink", standing);
      const canMark = !s.done && !standing && (p.goal === "missing" || s.put.length < p.slips.length);
      if (canMark && p.face < 3) {
        const ghostAcross = p.face === 1 && marks.length % 5 === 4;
        if (ghostAcross) P.stroke(c, [[x - 4 * 9 - 6, cy + 12], [x - 6, cy - 12]], { role: "ink3", width: 2, dash: [3, 3] });
        else P.stroke(c, [[x + 2, cy - 11], [x + 2, cy + 11]], { role: "ink3", width: 2, dash: [3, 3] });
      }
      if (canMark) {
        api.target(`row-${r}`, markX - 4, y + 3, markW + 8, rowH - 6);
        // the across button: the next slip as a stroke across the four before it
        const gx = markX + markW + 8;
        P.body(c, gx, y + 7, gateW, rowH - 14, { role: "panel", r: 8, seed: 70 + r });
        for (let i = 0; i < 4; i++) P.stroke(c, [[gx + 10 + i * 6, cy - 9], [gx + 10 + i * 6, cy + 9]], { role: "ink3", width: 1.6 });
        P.stroke(c, [[gx + 6, cy + 9], [gx + gateW - 8, cy - 9]], { role: "you", width: 3 });
        api.target(`x-${r}`, gx - 2, y + 3, gateW + 4, rowH - 6);
      }
      // the count column: each row read on the run
      if (ran && k * (K + 1) >= r + 0.5) P.textFit(c, String(read[r]), colX + colW - cntW / 2 - 4, cy, cntW - 4, rowH - 12, { size: 22, role: wrong ? "look" : "ink", weight: 800, font: "mono" });
      if (wrong) P.magnifier(c, colX + colW - 10, y + 10, 11);
    }
    // the total row
    const sumRead = read.reduce((a, b) => a + b, 0);
    P.body(c, colX, totY, colW, 44, { role: "panel", r: 10, state: end && !s.done && sumRead !== p.total ? "look" : "idle" });
    P.textFit(c, W("aankde.total"), colX + 4 + labW / 2, totY + 22, labW - 8, 40, { size: 18, role: "ink2", weight: 800 });
    const want = p.total;
    P.textFit(c, W("aankde.of", { n: want }), markX + markW / 2, totY + 22, markW + gateW, 40, { size: 18, role: "ink2", weight: 700 });
    if (ran && k >= 0.85) {
      const t = sumRead;
      P.textFit(c, String(t), colX + colW - cntW / 2 - 4, totY + 22, cntW - 4, 40, { size: 22, role: t === want ? "ink" : "look", weight: 800, font: "mono" });
      if (end && s.done) P.tick(c, colX + colW - cntW - 14, totY + 22, 18, 1);
    }
  }

  // ───────────── stack ─────────────
  const towX = (i: number) => towX0 + i * (towW + towGap);
  const lvY = (v: number) => baseY - v * bh;
  function block(c: CanvasRenderingContext2D, i: number, j: number, role: Role, state: "idle" | "selected" | "look" = "idle", dy = 0): void {
    api.P.body(c, towX(i) + 2, lvY(j + 1) + 1 + dy, towW - 4, bh - 2, { role, r: 3, state, seed: i * 31 + j });
  }
  function drawAxis(c: CanvasRenderingContext2D): void {
    const P = api.P;
    for (let v = 0; v <= R; v++) {
      const y = lvY(v), major = v % 5 === 0;
      if (p.face < 3 || major) P.stroke(c, [[axisX, y], [colX + colW, y]], { role: "ink3", width: major ? 1.2 : 0.7, alpha: major ? 0.7 : 0.4 });
      if (((p.face === 1 && bh >= 18) || major) && v > 0) P.text(c, String(v), axisX - 12, y, { size: 16, role: "ink2", weight: 700, font: "mono" });
    }
    P.stroke(c, [[axisX, baseY], [axisX, lvY(R)]], { role: "ink2", width: 1.5 });
  }
  function drawEven(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    P.textFit(c, W(`aankde.ctx.${p.ctx}`), w / 2, 16, colW - 16, 28, { size: 18, role: "ink2", weight: 700 });
    drawAxis(c);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < s.h[i]; j++) block(c, i, j, "q1", sel === i && j === s.h[i] - 1 ? "selected" : "idle", sel === i && j === s.h[i] - 1 ? -6 : 0);
      if (p.face < 3) P.text(c, String(s.h[i]), towX(i) + towW / 2, lvY(s.h[i]) - 12 - (sel === i ? 6 : 0), { size: 16, role: "ink", weight: 800, font: "mono" });
      if (!s.done) api.target(`tw-${i}`, towX(i) - towGap / 2, capY, towW + towGap, baseY - capY + 16);
    }
    if (ran && k >= 0.5) {
      const level = s.h.every((x) => x === s.h[0]);
      if (level) {
        P.stroke(c, [[axisX, lvY(s.h[0])], [colX + colW, lvY(s.h[0])]], { role: "good", width: 3 });
        if (end) { P.chip(c, W("aankde.each", { n: s.h[0] }), w / 2, Math.max(capY + 14, lvY(s.h[0]) - 56), { size: 18, role: "good" }); P.tick(c, colX + colW - 16, lvY(s.h[0]) - 16, 18, 1); }
      } else if (end) {
        const hi = Math.max(...s.h), lo = Math.min(...s.h);
        s.h.forEach((x, i) => { if (x === hi || x === lo) P.magnifier(c, towX(i) + towW - 6, lvY(x) - 8, 11); });
      }
    }
  }
  function drawPour(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended, L = s.line;
    P.textFit(c, W(`aankde.ctx.${p.ctx}`), w / 2, 16, colW - 16, 28, { size: 18, role: "ink2", weight: 700 });
    if (L >= 0 && p.face === 1 && !ran) {
      P.textFit(c, `${W("aankde.above", { n: aboveOf(p.h, L) })}   ${W("aankde.gaps", { n: gapsOf(p.h, L) })}`, w / 2, 40, colW - 16, 24, { size: 17, role: "ink", weight: 700 });
    }
    drawAxis(c);
    // the blocks above the line and the gaps below it; on the run each block above drops into a gap, one by one
    const above: [number, number][] = [], gaps: [number, number][] = [];
    if (L >= 0) p.h.forEach((x, i) => { for (let j = L; j < x; j++) above.push([i, j]); for (let j = x; j < L; j++) gaps.push([i, j]); });
    const fit = Math.min(above.length, gaps.length), moved = ran ? Math.min(fit, Math.floor(clamp((k - 0.2) / 0.65, 0, 1) * fit + 1e-9)) : 0;
    const movedSet = new Set(above.slice(0, moved).map(([i, j]) => `${i}:${j}`));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < p.h[i]; j++) {
        if (movedSet.has(`${i}:${j}`)) continue;
        const up = L >= 0 && j >= L, left = end && up;
        block(c, i, j, up && p.face < 3 ? "q2" : "q1", left && !s.done ? "look" : "idle", ran && up && k < 0.2 ? -k * 30 : 0);
      }
      if (p.face < 3) P.text(c, String(p.h[i]), towX(i) + towW / 2, baseY + 10, { size: 16, role: "ink2", weight: 800, font: "mono" });
    }
    gaps.forEach(([i, j], g) => {
      if (g < moved) block(c, i, j, "q2");
      else if (p.face < 3 || end) P.stroke(c, [[towX(i) + 3, lvY(j + 1) + 2], [towX(i) + towW - 3, lvY(j + 1) + 2], [towX(i) + towW - 3, lvY(j) - 1], [towX(i) + 3, lvY(j) - 1]], { role: end && !s.done ? "look" : "ink3", width: 1.5, dash: [3, 3], closed: true });
    });
    if (L >= 0) {
      P.stroke(c, [[axisX - 4, lvY(L)], [colX + colW, lvY(L)]], { role: ran && end && s.done ? "good" : "you", width: 3 });
      P.circle(c, colX + colW - 6, lvY(L), 6, { role: "you", fill: true });
    }
    if (!s.done) for (let v = 0; v <= R; v++) api.target(`lv-${v}`, axisX - 22, lvY(v) - bh / 2, colX + colW - axisX + 22, bh);
    if (end) {
      const msg = s.done ? W("aankde.each", { n: L }) : above.length > gaps.length ? W("aankde.over", { n: above.length - gaps.length }) : W("aankde.empty", { n: gaps.length - above.length });
      P.chip(c, msg, w / 2, Math.max(capY + 16, lvY(Math.max(...p.h)) - 22), { size: 18, role: s.done ? "good" : "look" });
      if (s.done) P.tick(c, colX + colW - 18, lvY(L) - 18, 18, 1);
    }
  }

  // ───────────── line ─────────────
  const cardX = (i: number) => lineX0 + i * (cw + cgap);
  function drawMiddle(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    P.textFit(c, W(`aankde.ctx.${p.ctx}`), w / 2, 22, colW - 16, 30, { size: 18, role: "ink2", weight: 700 });
    const vals = lineValues(p, s.order), sorted = inOrder(vals), up = vals[N - 1] >= vals[0];
    // the fold: pairs from both ends dim, one pair per beat, until the middle is left
    const pairs = Math.floor((N - 1) / 2), folded = ran ? Math.min(pairs, Math.floor(clamp(k / 0.8, 0, 1) * pairs + 1e-9)) : 0;
    for (let i = 0; i < N; i++) {
      const out = i < folded || i >= N - folded, picked = sel === i;
      const descent = end && !s.done && !sorted && i > 0 && (up ? vals[i] < vals[i - 1] : vals[i] > vals[i - 1]);
      P.body(c, cardX(i), cardY - (picked ? 8 : 0), cw, cardH, { role: out ? "panel" : "q1", r: 10, state: picked ? "selected" : descent ? "look" : "idle", seed: 11 + s.order[i] });
      P.textFit(c, String(vals[i]), cardX(i) + cw / 2, cardY + cardH / 2 - (picked ? 8 : 0), cw - 6, cardH - 8, { size: clamp(cw * 0.42, 18, 30), weight: 800, font: "mono", on: out ? "panel" : "q1", role: out ? "ink3" : undefined });
      if (descent) P.magnifier(c, cardX(i) + 4, cardY + 6, 11);
      if (!s.done) api.target(`card-${i}`, cardX(i) - 2, cardY - 4, cw + 4, cardH + 8);
    }
    // the peg's slots: under each card, and in each gap (drawn faint at the first fades)
    const slotX = (v: number) => (v % 2 === 0 ? cardX(v / 2) + cw / 2 : cardX((v - 1) / 2) + cw + cgap / 2);
    for (let v = 0; v <= 2 * N - 2; v++) {
      if (p.face < 3) P.circle(c, slotX(v), pegY + 6, v % 2 ? 3 : 4, { role: "ink3", fill: true });
      if (!s.done) {
        if (v % 2 === 0) api.target(`slot-${v}`, cardX(v / 2) + 6, pegY - 8, cw - 12, 52);
      }
    }
    if (!s.done) for (let v = 1; v <= 2 * N - 2; v += 2) api.target(`slot-${v}`, slotX(v) - 11, pegY - 8, 22, 52);
    if (s.peg >= 0) {
      const x = slotX(s.peg), bad = end && !s.done && sorted;
      P.stroke(c, [[x, pegY + 34], [x, cardY + cardH + 2]], { role: "you", width: 4 });
      P.circle(c, x, pegY + 36, 8, { role: "you", fill: true });
      if (bad) P.magnifier(c, x + 16, pegY + 30, 12);
    }
    if (ran && k >= 0.85) {
      const at = middleSlot(N), x = slotX(at);
      P.stroke(c, [[x, cardY - 14], [x, cardY - 4]], { role: s.done ? "good" : "look", width: 3 });
      if (end && s.done) { P.chip(c, W("aankde.middle", { v: numText(slotValue(vals, at)) }), w / 2, pegY + 80, { size: 20, role: "good" }); P.tick(c, x + 22, cardY - 18, 16, 1); }
      void medianOf;
    }
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (tally) drawTally(c);
    else if (p.goal === "even") drawEven(c);
    else if (p.goal === "pour") drawPour(c);
    else drawMiddle(c);
    void meanOf;
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("aankde.again");
    return W(`aankde.goal.${p.goal}`, { n: p.total, cat: p.cats.length ? catText(K - 1) : "" });
  }
  // no readout of a count, the mean, the median or the mode: the rows, the towers and the line ARE them
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (p.goal === "sort" || p.goal === "mode") ready = ready && s.put.length > 0;
    if (p.goal === "mode") ready = ready && s.crown >= 0;
    if (p.goal === "missing") ready = ready && s.rows[K - 1].length > 0;
    if (p.goal === "even") ready = ready && s.h.some((x, i) => x !== p.h[i]);
    if (p.goal === "pour") ready = ready && s.line >= 0;
    if (p.goal === "middle") ready = ready && s.peg >= 0;
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => { sel = -1; act({ kind: "undo" }); } });
    const runKey = tally ? "aankde.count" : p.goal === "even" ? "aankde.level" : p.goal === "pour" ? "aankde.pour" : "aankde.fold";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => { sel = -1; act({ kind: "run" }); } });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => false };
  return view;
};
