// Paheli · the 2D view (round 7, number puzzles; classes 6-7). Nothing here runs on a clock: bags, tiles, digit keys and
// wheels move on the child's touch, and the run (sail the boat, add the lines, add the columns, reverse and add) only shows
// what the law has already answered.
//   pairs/load · trays   the boat (k seats, the count it must carry on its flag) above a dock of bag cards (look 1: the
//              counters drawn in pairs, an odd bag's lone counter apart; a tray as its rows × columns). Tap a card to load
//              it, again to take it off. The sail: each seat shows its lone counter (if any), the lone counters slide to
//              the middle and pair up, then the boat's total is laid against its flag
//   magic/square · shift   the 3 × 3 grid (given cells printed) above a tray of number tiles: tap a tile then a cell (a
//              filled cell swaps; tap a placed tile then the tray to take it back). The run adds the 8 lines one by one and
//              writes each sum at its end: a row's on the right, a column's below, the diagonals at the bottom corners
//   cipher/letters   the letter sum as column addition with a carry box over every column; a key per letter and a 0-9
//              pad: tap a letter, then a digit (a digit tile already on another letter moves). The run adds from the ones
//              column: the carry goes up into the box, the digit written goes under the line, and it stops at the first
//              column whose digit is not its letter's
//   mirror/reach   the target palindrome on a card; two digit wheels set the start (tap a wheel's top half: one more,
//              bottom half: one less). The run writes each reverse-and-add line until the first palindrome
// After a missed run only magnifiers mark what is not as it should be (the lone counter left, a line's sum, a column, the
// first palindrome); never the key.
import type { Moment, PaheliAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { chainOf, columnRun, digMap, isPal, itemText, lettersOf, LINES, lineSums, magicSum, reverseNum, valueOfItem, type PaheliParams, type PaheliState } from "./paheli.logic.ts";

const SWEEP = 2.4;   // s a run takes on screen (cosmetic: the law has already answered)

export const makePaheliView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<PaheliParams, PaheliState, PaheliAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goalId = p.goal;
  const pairs = goalId === "load" || goalId === "trays", magic = goalId === "square" || goalId === "shift";
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let w = 360, h = 480;
  // pairs: the boat and the dock; magic: the grid and the tray; cipher: the sum, the keys, the pad; mirror: card, lines, wheels
  let boatY = 10, boatH = 120, dockY = 150, cardW = 80, cardH = 90, cols = 4;
  let gx = 0, gy = 0, G = 90, trayY = 0, tile = 52, trayCols = 4;
  let cs = 52, sumX = 0, sumY = 0, keyY = 0, keyW = 44, padY = 0, padW = 60, padH = 48;
  let cardY = 8, linesY = 80, lineH = 30, wheelY = 380, wheelW = 64, wheelH = 96;
  let sel: number | string | null = null;   // a picked tile (magic) or letter (cipher)
  let runAt = -1;                           // api.t when the last run started on screen
  const letters = lettersOf(p.rows);

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (pairs) {
      const n = p.items.length;
      cols = n <= 4 ? n : Math.ceil(n / 2);
      const rowsN = Math.ceil(n / cols);
      cardW = Math.min(120, (w - 16 - 8 * (cols - 1)) / cols);
      boatH = clamp(h * 0.34, 120, 190); boatY = 8;
      dockY = boatY + boatH + 18;
      cardH = clamp((h - dockY - 8 - 8 * (rowsN - 1)) / rowsN, 64, p.look === 1 ? 120 : 92);
    } else if (magic) {
      const free = 9 - p.given.filter((v) => v).length;
      trayCols = Math.min(free, 4);
      const trayRows = Math.ceil(free / trayCols);
      tile = clamp(Math.min((w - 16 - 8 * (trayCols - 1)) / trayCols, h * 0.1), 48, 60);
      const trayH = trayRows * tile + (trayRows - 1) * 8;
      G = Math.max(52, Math.min((w - 2 * 52) / 3, (h - trayH - 16 - 40 - 16) / 3, 110));
      gx = (w - 3 * G) / 2; gy = Math.max(8, (h - trayH - 16 - 40 - 3 * G) / 2);
      trayY = gy + 3 * G + 40 + 12;
    } else if (goalId === "letters") {
      const n = p.rows[2].length;
      padH = 48; padW = Math.min(72, (w - 16 - 4 * 8) / 5);
      padY = h - 2 * padH - 8 - 8;
      keyW = Math.min(56, (w - 16 - 6 * (letters.length - 1)) / letters.length);
      keyY = padY - 64 - 14;
      cs = clamp(Math.min((w - 70) / n, (keyY - 12 - 30 - 18) / 3), 40, 60);
      sumX = (w + 28 - n * cs) / 2; sumY = Math.max(8, (keyY - 14 - 30 - 3 * cs - 10) / 2) + 30;
    } else {
      cardY = 8;
      wheelH = 96; wheelW = 64; wheelY = h - wheelH - 10;
      linesY = cardY + 70 + 12;
      lineH = clamp((wheelY - 12 - linesY) / 9, 24, 34);
    }
  }
  const act = (a: PaheliAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as PaheliAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "load" || last.kind === "put") api.sfx("land");
    else if (last.kind === "digit" || last.kind === "start") api.sfx("tick");
    else api.sfx("tap");
    if (!st().ended) runAt = -1;
    void ms;
    api.invalidate(); deps.changed();
  }
  /** 0..1 of the run on screen; 1 once it has played (the law answered when the act landed) */
  const runK = () => (runAt < 0 ? 0 : clamp((api.t - runAt) / SWEEP, 0, 1));
  const shownEnd = () => st().ended && runK() >= 1;
  const running = () => st().ended && runAt >= 0;
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

  // ── pointer: taps only (a tap picks, a second tap places) ──
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done || kind !== "down") return;
    const id = api.hit(x, y);
    if (!id) { if (sel !== null) { sel = null; api.invalidate(); deps.changed(); } return; }
    if (id.startsWith("bag-")) act({ kind: "load", i: Number(id.slice(4)) });
    else if (id.startsWith("tile-")) { const v = Number(id.slice(5)); sel = sel === v ? null : v; api.sfx("select"); }
    else if (id.startsWith("cell-")) {
      const cell = Number(id.slice(5)), there = s.cells[cell];
      if (typeof sel === "number") { const v = sel; sel = null; if (there !== v) act({ kind: "put", v, cell }); }
      else if (there) { sel = there; api.sfx("select"); }
    } else if (id === "tray") { if (typeof sel === "number" && s.cells.includes(sel)) { const v = sel; sel = null; act({ kind: "put", v, cell: -1 }); } else sel = null; }
    else if (id.startsWith("key-")) { sel = id.slice(4); api.sfx("select"); }
    else if (id.startsWith("pad-")) {
      const d = Number(id.slice(4));
      if (typeof sel === "string") {
        const li = letters.indexOf(sel), l = sel;
        act({ kind: "digit", l, d: s.dig[li] === d ? -1 : d });
        // the next letter still without a digit is picked up, so a puzzle is set in a run of taps
        const next = letters.find((x, i) => i !== li && st().dig[i] < 0 && !p.known.some((k) => k.l === x));
        sel = next ?? null;
      } else api.sfx("refuse");
    } else if (id.startsWith("wheel-")) {
      const [k, dir] = id.slice(6).split(":"), step = 10 ** Number(k);
      const cur = s.start || 10, v = cur + (dir === "up" ? step : -step);
      // the wheels start at 10 on the first tap
      if (s.start === 0) act({ kind: "start", n: 10 });
      else if (v >= 10 && v <= 99) act({ kind: "start", n: v }); else api.sfx("refuse");
    }
    api.invalidate(); deps.changed();
  }

  // ── pairs ──
  /** counters in pairs: two rows, a pair a column; an odd count's lone counter a little apart, on the right */
  function counters(c: CanvasRenderingContext2D, n: number, x: number, y: number, bw: number, bh: number): void {
    const P = api.P, pr = Math.floor(n / 2), lone = n % 2;
    const step = Math.min(14, (bw - 16) / (pr + lone * 1.6)), r = clamp(step * 0.32, 2.4, 4.5);
    for (let i = 0; i < pr; i++) {
      const cx = x + 6 + step * (i + 0.5);
      P.circle(c, cx, y + bh * 0.3, r, { role: "q1", fill: true }); P.circle(c, cx, y + bh * 0.7, r, { role: "q1", fill: true });
    }
    if (lone) P.circle(c, x + 6 + step * (pr + 1.1), y + bh * 0.5, r, { role: "q4", fill: true });
  }
  /** a tray: a rows × b columns of counters */
  function grid(c: CanvasRenderingContext2D, a: number, b: number, x: number, y: number, bw: number, bh: number): void {
    const P = api.P, step = Math.min(bw / b, bh / a, 10), r = clamp(step * 0.3, 1.6, 3.2), x0 = x + (bw - step * b) / 2, y0 = y + (bh - step * a) / 2;
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) P.circle(c, x0 + step * (j + 0.5), y0 + step * (i + 0.5), r, { role: "q1", fill: true });
  }
  function drawPairs(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), run = running(), end = shownEnd();
    // the boat: a hull with k seats; its flag carries the count it must take
    const bx = 12, bw = w - 24, hullY = boatY + boatH * 0.42, hullH = boatH * 0.5;
    P.fillPath(c, (g) => { g.beginPath(); g.moveTo(bx, hullY); g.lineTo(bx + bw, hullY); g.lineTo(bx + bw - hullH * 0.8, hullY + hullH); g.lineTo(bx + hullH * 0.8, hullY + hullH); g.closePath(); }, "wood", { outline: "ink2", width: 1.5 });
    const mastX = bx + 26;
    P.stroke(c, [[mastX, hullY], [mastX, boatY + 2]], { role: "ink2", width: 2.5 });
    const flagW = clamp(bw * 0.42, 130, 200);
    P.body(c, mastX + 2, boatY, flagW, boatH * 0.36, { role: "q2", r: 4 });
    P.textFit(c, `${W("paheli.carry")} ${p.T}`, mastX + 2 + flagW / 2, boatY + boatH * 0.18, flagW - 12, boatH * 0.34, { size: 18, on: "q2", weight: 800, font: "mono" });
    const seatW = Math.min(76, (bw - 2 * hullH * 0.8 - 6 * (p.k - 1)) / p.k), sx0 = bx + bw / 2 - (p.k * seatW + 6 * (p.k - 1)) / 2, seatY = hullY + 6, seatH = hullH - 12;
    const lones: [number, number][] = [];
    for (let j = 0; j < p.k; j++) {
      const x = sx0 + j * (seatW + 6), i = s.on[j];
      P.body(c, x, seatY, seatW, seatH, { role: "panel", r: 6, seed: 30 + j, state: i === undefined ? "dim" : "idle" });
      if (i === undefined) continue;
      const it = p.items[i];
      P.textFit(c, itemText(it), x + seatW / 2, seatY + seatH * 0.36, seatW - 6, seatH * 0.6, { size: 18, role: "ink", weight: 800, font: "mono" });
      if (run && valueOfItem(it) % 2 === 1) lones.push([x + seatW / 2, seatY + seatH * 0.78]);
    }
    // the sail: each odd load's lone counter shows, they slide to the middle and pair up; the total against the flag
    if (run) {
      const mid = bx + bw - hullH * 0.8 - 30, my = boatY + boatH * 0.2;
      const slide = clamp((k - 0.25) / 0.35, 0, 1);
      lones.forEach(([lx, ly], j) => {
        const tx = mid - 12 * (j % 2 ? -1 : 1) * 0.6, ty = my + 12 * Math.floor(j / 2);
        P.circle(c, lx + (tx - lx) * slide, ly + (ty - ly) * slide, 5, { role: "q4", fill: true });
      });
      if (slide >= 1) for (let j = 0; j + 1 < lones.length; j += 2) P.stroke(c, [[mid - 7, my + 12 * (j / 2)], [mid + 7, my + 12 * (j / 2)]], { role: "ink", width: 2 });
      if (k >= 0.75) {
        const tot = s.on.reduce((t, i) => t + valueOfItem(p.items[i]), 0);
        P.chip(c, `= ${tot}`, bx + bw - 54, hullY + hullH + 2, { size: 18, role: s.done ? "good" : "look", font: "mono" });
        // an odd count of lone counters leaves one unpaired: the magnifier sits by it; else by the total
        if (end && !s.done) P.magnifier(c, lones.length % 2 ? mid - 24 : bx + bw - 108, lones.length % 2 ? my + 12 * Math.floor((lones.length - 1) / 2) : hullY + hullH + 2, 18);
        if (end && s.done) P.tick(c, mastX + flagW + 18, boatY + boatH * 0.18, 24, 1);
      }
    }
    // the dock
    p.items.forEach((it, i) => {
      const r = Math.floor(i / cols), cI = i % cols, rowN = Math.min(cols, p.items.length - r * cols);
      const x = (w - (rowN * cardW + 8 * (rowN - 1))) / 2 + cI * (cardW + 8), y = dockY + r * (cardH + 8), onB = s.on.includes(i);
      if (!s.done) api.target(`bag-${i}`, x, y, cardW, cardH);
      P.body(c, x, y, cardW, cardH, { role: onB ? "panel" : "q3", r: 10, seed: i, state: onB ? "dim" : "idle", fill: onB ? 0.5 : 0.85 });
      const numH = p.look === 1 ? cardH * 0.42 : cardH * 0.7;
      P.textFit(c, itemText(it), x + cardW / 2, y + numH / 2 + 4, cardW - 10, numH, { size: clamp(cardH * 0.3, 18, 26), role: "ink", weight: 800, font: "mono" });
      if (p.look === 1) {
        if (it.b === 1) counters(c, it.a, x, y + numH + 2, cardW, cardH - numH - 6);
        else grid(c, it.a, it.b, x + 4, y + numH + 2, cardW - 8, cardH - numH - 8);
      }
    });
  }

  // ── magic ──
  const cellXY = (i: number): [number, number] => [gx + (i % 3) * G + G / 2, gy + Math.floor(i / 3) * G + G / 2];
  /** where line l's sum is written: rows on the right, columns below, the diagonals at the bottom corners */
  function sumAt(l: number): [number, number] {
    if (l < 3) return [gx + 3 * G + 26, gy + l * G + G / 2];
    if (l < 6) return [gx + (l - 3) * G + G / 2, gy + 3 * G + 22];
    return l === 6 ? [gx + 3 * G + 26, gy + 3 * G + 22] : [gx - 26, gy + 3 * G + 22];
  }
  function drawMagic(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), run = running(), end = shownEnd(), S = magicSum(p.set);
    for (let i = 0; i < 9; i++) {
      const x = gx + (i % 3) * G, y = gy + Math.floor(i / 3) * G, v = s.cells[i], given = !!p.given[i];
      if (!s.done && !given) api.target(`cell-${i}`, x + 2, y + 2, G - 4, G - 4);
      P.body(c, x + 2, y + 2, G - 4, G - 4, { role: given ? "q3" : "panel", r: 8, seed: i, state: sel !== null && sel === v && !given ? "selected" : "idle", fill: given ? 0.6 : 1 });
      if (v) P.text(c, String(v), x + G / 2, y + G / 2, { size: clamp(G * 0.36, 20, 34), role: "ink", weight: given ? 800 : 700, font: "mono" });
      else if (typeof sel === "number") P.circle(c, x + G / 2, y + G / 2, 10, { role: "you", width: 2 });
    }
    // the run: the 8 lines lit one by one, each sum at its end
    if (run) {
      const sums = lineSums(s.cells), lit = Math.min(8, Math.floor(k * 8.5));
      for (let l = 0; l < lit; l++) {
        const [a, , b] = LINES[l], ok = sums[l] === S, [x1, y1] = cellXY(a), [x2, y2] = cellXY(b);
        if (l === lit - 1 && k < 1) P.stroke(c, [[x1, y1], [x2, y2]], { role: ok ? "good" : "look", width: 4, alpha: 0.7 });
        const [sx, sy] = sumAt(l);
        P.chip(c, String(sums[l]), sx, sy, { size: 18, role: ok ? "good" : "look", font: "mono" });
        if (end && !ok) P.magnifier(c, sx + 14, sy - 14, 14);
      }
      if (end && s.done) P.tick(c, gx + 3 * G + 26, Math.max(14, gy - 8), 24, 1);
    }
    // the tray of number tiles
    const free = p.set.filter((v) => !p.given.includes(v));
    const rowsN = Math.ceil(free.length / trayCols);
    if (!s.done) api.target("tray", 8, trayY - 6, w - 16, rowsN * (tile + 8) + 4);
    free.forEach((v, j) => {
      const r = Math.floor(j / trayCols), cI = j % trayCols, rowN = Math.min(trayCols, free.length - r * trayCols);
      const x = (w - (rowN * tile + 8 * (rowN - 1))) / 2 + cI * (tile + 8), y = trayY + r * (tile + 8), placed = s.cells.includes(v);
      if (placed) { P.body(c, x, y, tile, tile, { role: "panel", r: 8, state: "dim", fill: 0.35, seed: 50 + j }); return; }
      if (!s.done) api.target(`tile-${v}`, x, y, tile, tile);
      P.body(c, x, y, tile, tile, { role: "q2", r: 8, seed: 50 + j, state: sel === v ? "selected" : "idle" });
      P.text(c, String(v), x + tile / 2, y + tile / 2, { size: clamp(tile * 0.42, 20, 26), on: "q2", weight: 800, font: "mono" });
    });
  }

  // ── cipher ──
  function drawCipher(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), run = running(), end = shownEnd(), n = p.rows[2].length, m = digMap(p, s);
    const colX = (col: number) => sumX + (n - 1 - col) * cs;   // col 0 = ones (rightmost)
    const known = (l: string) => p.known.some((q) => q.l === l);
    const rowY = (r: number) => sumY + r * cs + (r === 2 ? 14 : 0);
    // carry boxes over the columns
    const runCols = run ? columnRun(p.rows, m) : [];
    const shownCols = run ? Math.min(runCols.length, Math.floor(k * (runCols.length + 0.6))) : 0;
    let stopAt = runCols.findIndex((q) => !q.ok);
    if (stopAt < 0) stopAt = runCols.length;
    for (let col = 0; col < n; col++) {
      const x = colX(col);
      P.body(c, x + cs * 0.22, sumY - 30, cs * 0.56, 26, { role: "panel", r: 4, state: "dim", fill: 0.5, seed: 70 + col });
      if (run && col < shownCols && col <= stopAt && runCols[col].cin) P.text(c, String(runCols[col].cin), x + cs / 2, sumY - 17, { size: 16, role: "q4", weight: 800, font: "mono" });
    }
    // the plus sign and the line
    P.text(c, "+", sumX - 22, rowY(1) + cs / 2, { size: 24, role: "ink2", weight: 800, font: "mono" });
    P.stroke(c, [[sumX - 30, rowY(2) - 7], [sumX + n * cs, rowY(2) - 7]], { role: "ink", width: 2.5 });
    p.rows.forEach((row, r) => {
      for (let j = 0; j < row.length; j++) {
        const l = row[j], col = row.length - 1 - j, x = colX(col), y = rowY(r), d = m[l];
        const hot = run && col < shownCols && col <= stopAt;
        P.body(c, x + 3, y + 3, cs - 6, cs - 6, { role: known(l) ? "q3" : "panel", r: 6, seed: r * 10 + j, state: sel === l ? "selected" : hot && col === stopAt ? "look" : "idle", fill: known(l) ? 0.6 : 1 });
        if (d >= 0) {
          P.text(c, String(d), x + cs / 2, y + cs / 2 + (known(l) ? 0 : 4), { size: clamp(cs * 0.42, 18, 26), role: "ink", weight: 800, font: "mono" });
          if (!known(l)) P.text(c, l, x + 11, y + 14, { size: 16, role: "ink2", weight: 700 });
        } else P.text(c, l, x + cs / 2, y + cs / 2, { size: clamp(cs * 0.42, 18, 26), role: "q1", weight: 800 });
      }
    });
    // the run: each column's digit written under the line, carries up into the boxes; it stops at a column that fails
    if (run) {
      for (let col = 0; col < shownCols && col <= stopAt; col++) {
        const q = runCols[col], x = colX(Math.min(col, n - 1));
        P.chip(c, String(q.write), x + cs / 2, rowY(2) + cs + 16, { size: 18, role: q.ok ? "good" : "look", font: "mono" });
        if (end && !q.ok) P.magnifier(c, x + cs - 8, rowY(2) + cs + 6, 14);
      }
      if (end && s.done) P.tick(c, sumX + n * cs + 18, rowY(2) + cs / 2, 24, 1);
    }
    // the letter keys and the digit pad
    const kx0 = (w - (letters.length * keyW + 6 * (letters.length - 1))) / 2;
    letters.forEach((l, i) => {
      const x = kx0 + i * (keyW + 6), d = s.dig[i], kn = known(l);
      if (!s.done && !kn) api.target(`key-${l}`, x, keyY, keyW, 64);
      P.body(c, x, keyY, keyW, 64, { role: kn ? "q3" : "q1", r: 8, seed: 90 + i, state: sel === l ? "selected" : kn ? "dim" : "idle", fill: kn ? 0.5 : 0.9 });
      P.text(c, l, x + keyW / 2, keyY + 18, { size: 18, on: kn ? "q3" : "q1", weight: 800 });
      P.text(c, d >= 0 ? String(d) : "?", x + keyW / 2, keyY + 45, { size: 20, on: kn ? "q3" : "q1", weight: 800, font: "mono" });
      if (sel === l) P.circle(c, x + keyW / 2, keyY - 6, 4, { role: "you", fill: true });
    });
    const px0 = (w - (5 * padW + 4 * 8)) / 2;
    for (let d = 0; d <= 9; d++) {
      const x = px0 + (d % 5) * (padW + 8), y = padY + Math.floor(d / 5) * (padH + 8);
      const taken = p.known.some((q) => q.d === d), on = letters.find((l, i) => s.dig[i] === d && !known(l));
      if (!s.done && !taken) api.target(`pad-${d}`, x, y, padW, padH);
      P.body(c, x, y, padW, padH, { role: "panel", r: 8, seed: 110 + d, state: taken ? "dim" : on ? "selected" : "idle" });
      P.text(c, String(d), x + padW / 2, y + padH / 2, { size: 22, role: taken ? "ink3" : "ink", weight: 800, font: "mono" });
      if (on) P.text(c, on, x + padW - 10, y + 13, { size: 16, role: "q1", weight: 800 });
    }
  }

  // ── mirror ──
  function drawMirror(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), run = running(), end = shownEnd();
    const cw = Math.min(w - 16, 360), cx = (w - cw) / 2;
    P.body(c, cx, cardY, cw, 70, { role: "panel", r: 10 });
    P.textFit(c, W("paheli.reach"), cx + cw * 0.3, cardY + 35, cw * 0.55, 60, { size: 16, role: "ink2", weight: 700 });
    P.textFit(c, String(p.P), cx + cw * 0.78, cardY + 35, cw * 0.4, 60, { size: 30, role: "ink", weight: 800, font: "mono" });
    // the lines of the run
    if (run && s.start) {
      const ch = chainOf(s.start), steps = ch.length - 1, shown = Math.min(steps, Math.floor(k * (steps + 0.5)) + 1);
      const fs = clamp(lineH * 0.62, 16, 20);
      for (let j = 0; j < shown; j++) {
        const a = ch[j], b = reverseNum(a), sum = ch[j + 1], y = linesY + j * lineH + lineH / 2, last = j === steps - 1;
        P.text(c, `${a} + ${String(a).split("").reverse().join("")} =`, w / 2 + 8, y, { size: fs, role: "ink2", weight: 700, font: "mono", align: "right" });
        void b;
        P.text(c, String(sum), w / 2 + 18, y, { size: fs, role: last && isPal(sum) ? (sum === p.P ? "good" : "look") : "ink", weight: 800, font: "mono", align: "left" });
        if (end && last) {
          if (s.done) P.tick(c, w / 2 + 30 + String(sum).length * fs * 0.62, y, 22, 1);
          else P.magnifier(c, w / 2 + 34 + String(sum).length * fs * 0.62, y, 16);
        }
      }
    }
    // the two wheels: tens and ones
    const gap = 10, total = 2 * wheelW + gap, x0 = (w - total) / 2, v = s.start;
    for (let i = 0; i < 2; i++) {
      const place = 1 - i, x = x0 + i * (wheelW + gap), d = v ? Math.floor(v / 10 ** place) % 10 : -1;
      P.body(c, x, wheelY, wheelW, wheelH, { role: "panel", r: 8, seed: i });
      if (!s.done) { api.target(`wheel-${place}:up`, x, wheelY, wheelW, wheelH / 2); api.target(`wheel-${place}:down`, x, wheelY + wheelH / 2, wheelW, wheelH / 2); }
      P.text(c, d >= 0 ? String(d) : "–", x + wheelW / 2, wheelY + wheelH / 2, { size: 32, role: "ink", weight: 800, font: "mono" });
      P.stroke(c, [[x + wheelW / 2 - 7, wheelY + 12], [x + wheelW / 2, wheelY + 5], [x + wheelW / 2 + 7, wheelY + 12]], { role: "ink3", width: 2 });
      P.stroke(c, [[x + wheelW / 2 - 7, wheelY + wheelH - 12], [x + wheelW / 2, wheelY + wheelH - 5], [x + wheelW / 2 + 7, wheelY + wheelH - 12]], { role: "ink3", width: 2 });
    }
    if (v && isPal(v)) P.magnifier(c, x0 + total + 22, wheelY + wheelH / 2, 16);
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (pairs) drawPairs(c);
    else if (magic) drawMagic(c);
    else if (goalId === "letters") drawCipher(c);
    else drawMirror(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("paheli.again");
    return W(`paheli.goal.${goalId}`, { k: p.k });
  }
  // no readout beyond the board itself: the arithmetic IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const ready = !s.ended && (pairs ? s.on.length === p.k : magic ? s.cells.every((v) => v > 0) : goalId === "letters" ? s.dig.every((d) => d >= 0) : s.start > 0 && !isPal(s.start));
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const runKey = pairs ? "paheli.sail" : magic ? "paheli.addlines" : goalId === "letters" ? "paheli.addup" : "paheli.flip";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
