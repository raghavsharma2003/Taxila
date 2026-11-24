// Kram · the 2D view (round 7, growing patterns and number sequences; classes 4-7). Nothing here runs on a clock: every
// tile, bag piece, dial, rhythm and tray piece moves on the child's touch, and the run (grow the figure, run the machine,
// play the rhythms, nest the pieces) only shows what the law has already answered.
//   grow (next)   the stages shown stand in a row above; the build board below holds a copy of the last one. A touch on a
//                 square lays a tile (or lifts one); a drag paints the same way along its path.
//   grow (far)    the first stages stand above (sticks, dots, points joined, a snowflake), the far stage asked beside them;
//                 the bag below has a rack per place (pieces of 1, 10, 100 …, nine to a rack) with − / +. The run grows the
//                 figure stage by stage out of the bag: short, left over, or exact.
//   machine       the number cards (the blanks after them) and the machine: four sign keys and a number with − / + (step),
//                 or "a × n + b" with − / + on a and b (rule, fed the stage number). The run walks the machine card by card.
//   beats         the shelves of rhythms (S a short block, L a long one). Lay: a touch on a rhythm one shelf up lays it with S
//                 in front, two shelves up with L in front; the pads compose one by hand; a touch on the new shelf lifts
//                 one. Count: the bag, as in far.
//   nest          the empty square frame and the tray of L-pieces or staircases; a touch picks / puts back; the run nests
//                 the picked pieces into the frame from its corner.
// After a missed run only magnifiers mark what is not as it should be; never the key.
import type { KramAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { beatsOf, boardOf, boardTiles, countOf, listOf, loadOf, OPS, RACK, rhythms, RULE_SHOWN, ruleOut, stepOf, tilesOf, trayOf, want,
  type KramParams, type KramState } from "./kram.logic.ts";

const SWEEP = 1.6;   // s a run takes on screen (cosmetic: the law has already answered)
const PLACE_ROLE: readonly Role[] = ["q1", "q2", "q3", "q4", "ink2"];
const placeRole = (e: number): Role => PLACE_ROLE[clamp(e, 0, PLACE_ROLE.length - 1)];
const SIGN: Record<string, string> = { "+": "+", "-": "−", x: "×", "/": "÷" };
const CAL_DAYS = 7;
/** a stick figure's list (first count : step) → the figure it counts */
const FIG_OF: Record<string, string> = { "5:4": "houses", "4:3": "sqrow", "3:2": "trirow" };

type Box = { x: number; y: number; w: number; h: number };

export const makeKramView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<KramParams, KramState, KramAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal;
  const bagGoal = goal === "far" || goal === "count";
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const racks = bagGoal ? st().bag.length : 0;
  const tray = goal === "odd" || goal === "pair" ? trayOf(p) : [];

  let w = 360, h = 480;
  let top: Box = { x: 0, y: 0, w: 0, h: 0 }, mid: Box = { x: 0, y: 0, w: 0, h: 0 }, bot: Box = { x: 0, y: 0, w: 0, h: 0 };
  // next: the board
  let G = 1, cell = 30, bx = 0, by = 0;
  let paint: null | { on: boolean; seen: Set<number> } = null;
  // bag racks
  const rowH = 46;
  // beats: the composer's draft
  let draft = "";
  let runAt = -1;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    const wide = w > h * 1.15;
    if (goal === "next") {
      G = boardOf(p).grid;
      const topH = wide ? h - 16 : clamp(h * 0.3, 110, 190);
      top = wide ? { x: 8, y: 8, w: w * 0.42 - 12, h: topH } : { x: 8, y: 8, w: w - 16, h: topH };
      const area = wide ? { x: w * 0.42 + 4, y: 8, w: w * 0.58 - 12, h: h - 16 } : { x: 8, y: top.y + top.h + 8, w: w - 16, h: h - top.h - 24 };
      // the board's label sits above it, inside the area
      cell = Math.floor(Math.min(56, (area.w - 12) / G, (area.h - 40) / G));
      bx = area.x + (area.w - cell * G) / 2; by = area.y + 30 + (area.h - 40 - cell * G) / 2;
      mid = area;
    } else if (bagGoal) {
      const bagH = racks * rowH + 8;
      if (wide) {
        top = { x: 8, y: 8, w: w * 0.55 - 12, h: h * 0.42 };
        mid = { x: 8, y: top.y + top.h + 8, w: top.w, h: h - top.h - 24 };
        bot = { x: w * 0.55 + 8, y: Math.max(8, (h - bagH) / 2), w: Math.min(380, w * 0.45 - 16), h: bagH };
      } else {
        bot = { x: (w - Math.min(w - 16, 380)) / 2, y: h - bagH - 4, w: Math.min(w - 16, 380), h: bagH };
        const free = bot.y - 16;
        top = { x: 8, y: 8, w: w - 16, h: free * 0.42 };
        mid = { x: 8, y: top.y + top.h + 8, w: w - 16, h: free - top.h - 8 };
      }
    } else if (goal === "step" || goal === "rule") {
      const mh = clamp(h * 0.42, 150, 230);
      top = { x: 8, y: 8, w: w - 16, h: h - mh - 24 };
      bot = { x: (w - Math.min(w - 16, 460)) / 2, y: h - mh - 8, w: Math.min(w - 16, 460), h: mh };
    } else if (goal === "lay") {
      const padH = 52;
      bot = { x: 8, y: h - padH - 4, w: w - 16, h: padH };
      top = { x: 8, y: 8, w: w - 16, h: bot.y - 16 };
    } else {
      const trayRows = 2, cols = Math.ceil(tray.length / trayRows);
      const s = Math.min(96, (w - 16 - 8 * (cols - 1)) / cols);
      const trayH = trayRows * (s + 8);
      bot = { x: (w - (cols * s + 8 * (cols - 1))) / 2, y: h - trayH - 4, w: cols * s + 8 * (cols - 1), h: trayH };
      top = { x: 8, y: 8, w: w - 16, h: bot.y - 16 };
    }
  }
  const act = (a: KramAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KramAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "bag" || last.kind === "cell" || last.kind === "pick") api.sfx("land");
    else if (last.kind === "dial" || last.kind === "lay") api.sfx("tick");
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
      deps.changed();
    }
  }
  const busy = () => !!paint || (runAt >= 0 && runK() < 1);

  // ── pointer ──
  function cellAt(x: number, y: number): number | null {
    const cx = Math.floor((x - bx) / cell), cy = Math.floor((y - by) / cell);
    return cx >= 0 && cy >= 0 && cx < G && cy < G ? cy * G + cx : null;
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done) return;
    if (goal === "next") {
      if (kind === "down" && api.hit(x, y) === "board") {
        const i = cellAt(x, y);
        if (i === null) return;
        paint = { on: !s.cells.includes(i), seen: new Set([i]) };
        ctl.finger(true);
        act({ kind: "cell", x: i % G, y: Math.floor(i / G) });
      } else if (kind === "move" && paint) {
        const i = cellAt(x, y);
        if (i !== null && !paint.seen.has(i)) {
          paint.seen.add(i);
          if (st().cells.includes(i) !== paint.on) act({ kind: "cell", x: i % G, y: Math.floor(i / G) });
        }
      } else if ((kind === "up" || kind === "cancel") && paint) { paint = null; ctl.finger(false); }
      api.invalidate();
      return;
    }
    if (kind !== "down") return;
    const id = api.hit(x, y);
    if (!id) return;
    const [k0, a1, a2] = id.split(":");
    if (k0 === "rack") act({ kind: "bag", place: Number(a1), by: a2 === "add" ? 1 : -1 });
    else if (k0 === "sign") act({ kind: "dial", which: 0, to: Number(a1) });
    else if (k0 === "num") {
      const which = Number(a1), cur = which === 0 ? s.d0 : s.d1, to = cur + Number(a2);
      act({ kind: "dial", which, to });
    } else if (k0 === "rh") {
      const shelf = Number(a1), r = shelf === p.n - 1 ? rhythms(shelf)[Number(a2)] : shelf === p.n - 2 ? rhythms(shelf)[Number(a2)] : null;
      if (r !== null && r !== undefined) act({ kind: "lay", r: (shelf === p.n - 1 ? "S" : "L") + r });
    } else if (k0 === "laid") { const r = s.laid[Number(a1)]; if (r) act({ kind: "lay", r }); }
    else if (k0 === "pad") {
      if (a1 === "S" || a1 === "L") { if (beatsOf(draft + a1) <= p.n) draft += a1; else { api.sfx("refuse"); api.fx.shake(2); } }
      else if (a1 === "back") draft = draft.slice(0, -1);
      else if (a1 === "put" && draft) { const r = draft; draft = ""; act({ kind: "lay", r }); }
      api.invalidate(); deps.changed();
    } else if (k0 === "piece") act({ kind: "pick", i: Number(a1) });
  }

  // ── drawing helpers ──
  /** a tile figure's cells drawn in a box (centred), from a list of [x, y] */
  function drawTiles(c: CanvasRenderingContext2D, pts: [number, number][], b: Box, role: Role, maxS = 26, dots = false): number {
    if (!pts.length) return 0;
    const mx = Math.min(...pts.map((q) => q[0])), my = Math.min(...pts.map((q) => q[1]));
    const cw = Math.max(...pts.map((q) => q[0])) - mx + 1, ch = Math.max(...pts.map((q) => q[1])) - my + 1;
    const s = Math.max(2, Math.min(maxS, b.w / cw, b.h / ch));
    const ox = b.x + (b.w - s * cw) / 2, oy = b.y + (b.h - s * ch) / 2;
    c.save(); c.fillStyle = api.P.color(role);
    for (const [x, y] of pts) {
      const px = ox + (x - mx) * s, py = oy + (y - my) * s;
      if (dots) { c.beginPath(); c.arc(px + s / 2, py + s / 2, Math.max(1, s * 0.36), 0, Math.PI * 2); c.fill(); }
      else c.fillRect(px + 1, py + 1, s - 2, s - 2);
    }
    c.restore();
    return s;
  }
  /** a stick figure (houses / a row of squares / a row of triangles) of stage m, scaled into a box; `upto` sticks drawn */
  function drawSticks(c: CanvasRenderingContext2D, seq: string, m: number, b: Box, upto = Infinity): void {
    const segs: [number, number, number, number][] = [];
    if (seq === "sqrow" || seq === "houses") {
      segs.push([0, 0, 0, 1]);
      for (let i = 0; i < m; i++) {
        segs.push([i, 0, i + 1, 0], [i, 1, i + 1, 1], [i + 1, 0, i + 1, 1]);
        if (seq === "houses") segs.push([i, 0, i + 0.5, -0.7], [i + 0.5, -0.7, i + 1, 0]);
      }
      if (seq === "houses") { // the first house's walls and roof; each next house: roof (2) + top/bottom… 4 sticks per house after the first
        // reorder so the count per stage is 5, 9, 13: drop the top bar of every house (the roof stands on the walls)
        for (let i = segs.length - 1; i >= 0; i--) { const q = segs[i]; if (q[1] === 0 && q[3] === 0) segs.splice(i, 1); }
      }
    } else if (seq === "trirow") {
      // triangles alternately up and down along a strip: 3, 5, 7 sticks
      segs.push([0, 1, 0.5, 0]);
      for (let i = 0; i < m; i++) {
        const x = i * 0.5;
        if (i % 2 === 0) segs.push([x, 1, x + 1, 1], [x + 0.5, 0, x + 1, 1]);
        else segs.push([x, 0, x + 1, 0], [x + 1, 0, x + 0.5, 1]);
      }
    }
    const xs = segs.flatMap((q) => [q[0], q[2]]), ys = segs.flatMap((q) => [q[1], q[3]]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const s = Math.min(46, b.w / Math.max(0.5, x1 - x0), b.h / Math.max(0.5, y1 - y0));
    const ox = b.x + (b.w - s * (x1 - x0)) / 2 - x0 * s, oy = b.y + (b.h - s * (y1 - y0)) / 2 - y0 * s;
    segs.forEach((q, k) => {
      if (k >= upto) return;
      api.P.stroke(c, [[ox + q[0] * s, oy + q[1] * s], [ox + q[2] * s, oy + q[3] * s]], { role: "q2", width: Math.max(1.5, Math.min(4, s / 9)) });
    });
  }
  /** n points on a ring, every pair joined (`upto` lines drawn) */
  function drawLines(c: CanvasRenderingContext2D, pts: number, b: Box, upto = Infinity): void {
    const r = Math.min(b.w, b.h) / 2 - 6, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const at = (i: number): [number, number] => [cx + r * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / pts), cy + r * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / pts)];
    let k = 0;
    for (let i = 0; i < pts; i++) for (let j = i + 1; j < pts; j++) { if (k++ < upto) api.P.stroke(c, [at(i), at(j)], { role: "q2", width: 1.5 }); }
    for (let i = 0; i < pts; i++) { const [x, y] = at(i); api.P.circle(c, x, y, Math.max(2.5, Math.min(5, r / 10)), { role: "ink", fill: true }); }
  }
  /** the snowflake after m − 1 splits (stage 1: a triangle) */
  function drawKoch(c: CanvasRenderingContext2D, m: number, b: Box): void {
    const r = Math.min(b.w, b.h * 1.1) / 2 - 4, cx = b.x + b.w / 2, cy = b.y + b.h / 2 + r * 0.12;
    let pts: [number, number][] = [0, 1, 2].map((i) => [cx + r * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / 3), cy + r * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / 3)]);
    for (let k = 1; k < Math.min(m, 5); k++) {
      const nx: [number, number][] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx2, by2] = pts[(i + 1) % pts.length], dx = (bx2 - ax) / 3, dy = (by2 - ay) / 3;
        const p1: [number, number] = [ax + dx, ay + dy], p3: [number, number] = [ax + 2 * dx, ay + 2 * dy];
        const p2: [number, number] = [p1[0] + dx * 0.5 + dy * 0.866, p1[1] + dy * 0.5 - dx * 0.866];
        nx.push([ax, ay], p1, p2, p3);
      }
      pts = nx;
    }
    api.P.stroke(c, pts, { role: "q2", width: 1.6, closed: true });
  }
  /** one rhythm as blocks (S short, L long) from (x, y), unit u; returns its width */
  function drawRhythm(c: CanvasRenderingContext2D, r: string, x: number, y: number, u: number, hh: number, role: Role = "q1"): number {
    let at = x;
    for (const ch of r) {
      const bw = ch === "L" ? 2 * u : u;
      api.P.body(c, at + 1, y, bw - 2, hh, { role: ch === "L" ? "q3" : role, r: 3 });
      at += bw;
    }
    return at - x;
  }
  /** a stage's picture of any figure into a box */
  function drawStage(c: CanvasRenderingContext2D, seq: string, m: number, b: Box): void {
    if (seq === "houses" || seq === "sqrow" || seq === "trirow") drawSticks(c, seq, m, b);
    else if (seq === "lines") drawLines(c, m + 1, b);
    else if (seq === "koch") drawKoch(c, m, b);
    else if (seq === "virahanka") {
      const rs = rhythms(m), u = Math.min(14, (b.w - 4) / m), hh = Math.min(10, (b.h - 4) / rs.length - 2);
      rs.forEach((r, i) => drawRhythm(c, r, b.x + (b.w - m * u) / 2, b.y + 2 + i * (hh + 2), u, Math.max(3, hh)));
    } else drawTiles(c, tilesOf(seq, m), b, "q1", 18, true);
  }
  function stageCards(c: CanvasRenderingContext2D, stages: number[], b: Box, pics: boolean, counts: boolean, extra?: { n: number; label: string }): void {
    const P = api.P, n = stages.length + (extra ? 1 : 0), gap = 8, cw = (b.w - gap * (n - 1)) / n;
    stages.forEach((m, i) => {
      const x = b.x + i * (cw + gap);
      P.body(c, x, b.y, cw, b.h, { role: "panel", r: 10 });
      P.textFit(c, `${W("kram.stage")} ${m}`, x + cw / 2, b.y + 13, cw - 8, 20, { size: 16, role: "ink2", weight: 700 });
      if (pics) drawStage(c, p.seq, m, { x: x + 6, y: b.y + 26, w: cw - 12, h: b.h - (counts ? 52 : 32) });
      if (counts) P.text(c, String(countOf(p.seq, m)), x + cw / 2, b.y + b.h - (pics ? 14 : b.h / 2 - 8), { size: pics ? 18 : 24, role: "ink", weight: 800, font: "mono" });
    });
    if (extra) {
      const x = b.x + stages.length * (cw + gap);
      P.body(c, x, b.y, cw, b.h, { role: "panel", r: 10, state: "look" });
      P.textFit(c, extra.label, x + cw / 2, b.y + 13, cw - 8, 20, { size: 16, role: "ink", weight: 800 });
      P.text(c, "?", x + cw / 2, b.y + b.h / 2 + 8, { size: 30, role: "you", weight: 800, font: "mono" });
    }
  }
  function bagRacks(c: CanvasRenderingContext2D, end: boolean): void {
    const P = api.P, s = st(), b = bot, labW = 60, slotX = b.x + labW + 46, slotW = (b.w - labW - 92 - 8) / RACK;
    const wantD = Array.from({ length: racks }, (_, i) => Math.floor(want(p) / 10 ** i) % 10);
    P.body(c, b.x - 4, b.y - 4, b.w + 8, racks * rowH + 4, { role: "panel", r: 10, state: end && !s.done ? "look" : "idle" });
    for (let r = 0; r < racks; r++) {
      const place = racks - 1 - r, y = b.y + r * rowH, cy = y + rowH / 2, n = s.bag[place];
      P.text(c, String(10 ** place), b.x + labW / 2, cy, { size: 16, role: "ink2", weight: 700, font: "mono", maxW: labW - 6 });
      if (!s.done) { api.target(`rack:${place}:take`, b.x + labW, y + 1, 44, 44); api.target(`rack:${place}:add`, b.x + b.w - 44, y + 1, 44, 44); }
      P.body(c, b.x + labW + 2, y + 4, 40, 38, { role: "panel", r: 8 });
      P.text(c, "−", b.x + labW + 22, cy, { size: 22, role: n > 0 ? "ink" : "ink3", weight: 800 });
      P.body(c, b.x + b.w - 42, y + 4, 40, 38, { role: "panel", r: 8 });
      P.text(c, "+", b.x + b.w - 22, cy, { size: 22, role: n < RACK ? "ink" : "ink3", weight: 800 });
      for (let k = 0; k < RACK; k++) {
        const x = slotX + k * slotW;
        if (k < n) P.body(c, x + 1, y + 9, slotW - 2, rowH - 18, { role: placeRole(place), r: 3, seed: place * 10 + k });
        else P.stroke(c, [[x + 1, y + rowH - 9], [x + slotW - 1, y + rowH - 9]], { role: "ink3", width: 1.5 });
      }
      if (end && !s.done && n !== wantD[place]) P.magnifier(c, slotX + RACK * slotW - 12, cy - 8, 16);
    }
  }

  // ── the goals ──
  function drawNext(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    const wide = top.w < top.h;
    const stages = [p.n - 3, p.n - 2, p.n - 1];
    if (wide) {
      const ch = (top.h - 16) / 3;
      stages.forEach((m, i) => {
        const y = top.y + i * (ch + 8);
        P.body(c, top.x, y, top.w, ch, { role: "panel", r: 10 });
        P.textFit(c, `${W("kram.stage")} ${m}`, top.x + 50, y + 16, 92, 22, { size: 16, role: "ink2", weight: 700 });
        if (p.face < 3) P.text(c, String(countOf(p.seq, m)), top.x + 50, y + ch / 2 + 14, { size: 20, role: "ink", weight: 800, font: "mono" });
        drawTiles(c, tilesOf(p.seq, m), { x: top.x + 100, y: y + 6, w: top.w - 108, h: ch - 12 }, "q1", 22, p.face === 2);
      });
    } else stageCards(c, stages, top, true, p.face < 3);
    // the board
    const all = new Set(s.cells);
    P.body(c, bx - 6, by - 6, cell * G + 12, cell * G + 12, { role: "panel", r: 10, state: end && !s.done ? "look" : "idle" });
    if (!s.done) api.target("board", bx, by, cell * G, cell * G);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
      const i = y * G + x, px = bx + x * cell, py = by + y * cell;
      if (all.has(i)) P.body(c, px + 2, py + 2, cell - 4, cell - 4, { role: "q1", r: 4, seed: i });
      else P.circle(c, px + cell / 2, py + cell / 2, 2, { role: "ink3", fill: true });
    }
    P.textFit(c, `${W("kram.stage")} ${p.n}`, bx + (cell * G) / 2, by - 19, cell * G, 22, { size: 16, role: "ink", weight: 800 });
    if (end && s.done) P.tick(c, bx + cell * G - 14, by + 14, 24, 1);
    if (end && !s.done) P.magnifier(c, bx + cell * G - 14, by + 14, 16);
  }
  function drawFar(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    const stages = Array.from({ length: p.shown }, (_, i) => i + 1);
    const label = goal === "count" ? `${p.n} ${W("kram.beats")}` : p.seq === "lines" ? `${p.n + 1} ${W("kram.points")}` : `${W("kram.stage")} ${p.n}`;
    stageCards(c, stages, top, p.face < 3, true, { n: p.n, label });
    // the builder: the figure grows from the last stage shown to the far stage out of the bag
    const load = loadOf(s.bag), need = (m: number) => countOf(p.seq, m);
    let m = p.shown;
    if (ran) { const target = p.shown + Math.round(k * (p.n - p.shown)); while (m < target && need(m + 1) <= load) m++; }
    const short = ran && k >= 1 && load < need(p.n), left = ran ? load - need(m) : load;
    P.body(c, mid.x, mid.y, mid.w, mid.h, { role: "panel", r: 12, state: end && !s.done ? "look" : "idle" });
    const pic = { x: mid.x + 8, y: mid.y + 30, w: mid.w - 16, h: mid.h - 40 };
    P.textFit(c, goal === "count" ? `${m} ${W("kram.beats")}` : p.seq === "lines" ? `${m + 1} ${W("kram.points")}` : `${W("kram.stage")} ${m}`, mid.x + mid.w * 0.3, mid.y + 15, mid.w * 0.55, 22, { size: 16, role: "ink", weight: 800 });
    P.textFit(c, `${W("kram.bag")} ${ran ? Math.max(0, left) : load}`, mid.x + mid.w * 0.78, mid.y + 15, mid.w * 0.4, 22, { size: 16, role: "ink2", weight: 700, font: "mono" });
    if (goal === "count") {
      // the far shelf: one tiny block per rhythm laid so far
      const n = need(m), per = Math.max(1, Math.ceil(Math.sqrt(n * (pic.w / pic.h)))), sz = Math.min(14, pic.w / per - 2, pic.h / Math.ceil(n / per) - 2);
      for (let i = 0; i < n; i++) P.body(c, pic.x + (i % per) * (sz + 2), pic.y + Math.floor(i / per) * (sz + 2), sz, sz, { role: "q1", r: 2, seed: i });
    } else if (p.seq === "square" || p.seq === "stair") drawTiles(c, tilesOf(p.seq, m), pic, "q1", 14, true);
    else drawStage(c, p.seq, m, pic);
    if (end && s.done) P.tick(c, mid.x + mid.w - 18, mid.y + mid.h - 18, 24, 1);
    if (end && !s.done) P.magnifier(c, mid.x + mid.w - 18, mid.y + mid.h - 18, 16);
    void short;
    bagRacks(c, end);
  }
  function knob(c: CanvasRenderingContext2D, id: string, label: string, x: number, y: number, on = false): void {
    const P = api.P;
    if (!st().done) api.target(id, x, y, 46, 46);
    P.body(c, x, y, 46, 46, { role: on ? "you" : "panel", r: 10 });
    P.text(c, label, x + 23, y + 23, { size: 22, weight: 800, ...(on ? { on: "you" as Role } : { role: "ink" as Role }) });
  }
  function drawMachine(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    const step = goal === "step";
    // the cards: the given numbers then the blanks (step) / the stage table then the far stage (rule)
    const given = step ? listOf(p, 0) : Array.from({ length: RULE_SHOWN }, (_, i) => ruleOut(p.a, p.b, i + 1));
    const made = step ? listOf({ a: p.a, op: OPS[s.d0], v: s.d1, n: p.n }) : [...Array.from({ length: RULE_SHOWN }, (_, i) => ruleOut(s.d0, s.d1, i + 1)), ruleOut(s.d0, s.d1, p.n)];
    const slots = step ? p.n + 2 : RULE_SHOWN + 1;
    const lit = ran ? Math.floor(k * slots + 0.001) : -1;
    if (step && p.seq === "cal") drawCalendar(c, given, made, lit);
    else {
      const perRow = top.w < 420 ? Math.min(slots, 4) : slots, rows = Math.ceil(slots / perRow), gap = 8;
      const cwRow = (top.w - gap * (perRow - 1)) / perRow, ch = Math.min(120, (top.h - gap * (rows - 1)) / rows);
      const pic = !step && p.face < 3 && ch >= 90;
      for (let i = 0; i < slots; i++) {
        // the rule's far stage, alone on its row, takes the whole row
        const lone = !step && i === RULE_SHOWN && perRow < slots;
        const x = lone ? top.x : top.x + (i % perRow) * (cwRow + gap), y = top.y + Math.floor(i / perRow) * (ch + gap);
        const cw = lone ? top.w : cwRow;
        const blank = step ? i >= p.n : i >= RULE_SHOWN, out = made[i], shown = !blank ? given[i] : null;
        const bad = ran && i < lit && !blank && out !== given[i];
        P.body(c, x, y, cw, ch, { role: "panel", r: 10, state: blank ? "look" : "idle" });
        if (!step) P.textFit(c, i < RULE_SHOWN ? `${W("kram.stage")} ${i + 1}` : `${W("kram.stage")} ${p.n}`, x + cw / 2, y + 13, cw - 6, 20, { size: 16, role: "ink2", weight: 700 });
        if (pic && i < RULE_SHOWN) drawRuleDots(c, i + 1, { x: x + 4, y: y + 26, w: cw - 8, h: ch - 54 });
        // a stick figure's counts (fig lists) show their figure above each given number
        const fig = step && p.seq === "fig" ? FIG_OF[`${p.a}:${p.v}`] : undefined;
        if (fig && !blank && p.face < 3) drawSticks(c, fig, i + 1, { x: x + 6, y: y + 6, w: cw - 12, h: ch * 0.44 });
        const vy = fig ? y + ch * 0.66 : step ? y + ch * 0.4 : y + ch - 16;
        P.textFit(c, shown !== null ? String(shown) : "?", x + cw / 2, vy, cw - 8, 30, { size: 22, role: blank ? "you" : "ink", weight: 800, font: "mono" });
        if (ran && i < lit) {
          const o = Number.isInteger(out) ? String(out) : "…";
          P.textFit(c, o, x + cw / 2, fig ? y + ch * 0.88 : step ? y + ch * 0.78 : y + ch - 40, cw - 8, 24, { size: 18, role: bad ? "look" : "good", weight: 800, font: "mono" });
          if (bad && end) P.magnifier(c, x + cw - 14, y + 14, 12);
        }
      }
    }
    // the machine
    const b = bot, P2 = api.P;
    P2.body(c, b.x, b.y, b.w, b.h, { role: "panel", r: 14, state: end && !s.done ? "look" : "idle" });
    if (step) {
      P.textFit(c, W("kram.machine.step"), b.x + b.w / 2, b.y + 16, b.w - 16, 22, { size: 16, role: "ink2", weight: 700 });
      const kx = b.x + (b.w - (4 * 46 + 3 * 8)) / 2, ky = b.y + 32;
      OPS.forEach((op, i) => knob(c, `sign:${i}`, SIGN[op], kx + i * 54, ky, s.d0 === i));
      const ny = ky + 58, cx = b.x + b.w / 2;
      knob(c, "num:1:-1", "−", cx - 110, ny); knob(c, "num:1:1", "+", cx + 64, ny);
      P.text(c, `${SIGN[OPS[s.d0]]} ${s.d1}`, cx, ny + 23, { size: 28, role: "ink", weight: 800, font: "mono" });
    } else {
      P.textFit(c, W("kram.machine.rule"), b.x + b.w / 2, b.y + 16, b.w - 16, 22, { size: 16, role: "ink2", weight: 700 });
      const y = b.y + 40, cx = b.x + b.w / 2, half = Math.min(110, b.w / 4);
      knob(c, "num:0:-1", "−", cx - half - 70, y); knob(c, "num:0:1", "+", cx - half - 70, y + 54);
      knob(c, "num:1:-1", "−", cx + half + 24, y); knob(c, "num:1:1", "+", cx + half + 24, y + 54);
      P.textFit(c, `${s.d0} × n`, cx - half / 2 - 4, y + 50, half + 10, 36, { size: 26, role: "ink", weight: 800, font: "mono" });
      P.textFit(c, `${s.d1 < 0 ? "−" : "+"} ${Math.abs(s.d1)}`, cx + half / 2 + 4, y + 50, half - 10, 36, { size: 26, role: "ink", weight: 800, font: "mono" });
    }
    if (end && s.done) P.tick(c, b.x + b.w - 18, b.y + 18, 24, 1);
  }
  /** stage k of a rule level: b loose dots, then k columns of a */
  function drawRuleDots(c: CanvasRenderingContext2D, kk: number, b: Box): void {
    const cols = kk + 1, s = Math.max(3, Math.min(10, b.w / cols, b.h / Math.max(p.a, p.b)));
    const ox = b.x + (b.w - s * cols) / 2, oy = b.y + (b.h - s * Math.max(p.a, p.b)) / 2;
    for (let j = 0; j < p.b; j++) api.P.circle(c, ox + s / 2, oy + j * s + s / 2, s * 0.36, { role: "q3", fill: true });
    for (let i = 0; i < kk; i++) for (let j = 0; j < p.a; j++) api.P.circle(c, ox + (i + 1) * s + s / 2, oy + j * s + s / 2, s * 0.36, { role: "q1", fill: true });
  }
  /** a month page: the column's given dates printed, the blanks below them; the machine's dates drop in on the run */
  function drawCalendar(c: CanvasRenderingContext2D, given: number[], made: number[], lit: number): void {
    const P = api.P, rows = 5, col = (p.a - 1) % CAL_DAYS;
    const cw = Math.min(56, top.w / CAL_DAYS), ch = Math.min(46, (top.h - 26) / rows), ox = top.x + (top.w - cw * CAL_DAYS) / 2, oy = top.y + 22;
    P.textFit(c, W("kram.calendar"), top.x + top.w / 2, top.y + 10, top.w, 20, { size: 16, role: "ink2", weight: 700 });
    for (let r = 0; r < rows; r++) for (let d = 0; d < CAL_DAYS; d++) {
      const x = ox + d * cw, y = oy + r * ch, i = r;
      P.body(c, x + 1, y + 1, cw - 2, ch - 2, { role: "panel", r: 4, state: d === col && i >= p.n ? "look" : "idle" });
      if (d !== col) continue;
      if (i < p.n) P.text(c, String(given[i]), x + cw / 2, y + ch / 2, { size: 18, role: "ink", weight: 800, font: "mono" });
      else if (lit > i) P.text(c, String(made[i]), x + cw / 2, y + ch / 2, { size: 18, role: made[i] === listOf(p)[i] ? "good" : "look", weight: 800, font: "mono" });
      else P.text(c, "?", x + cw / 2, y + ch / 2, { size: 18, role: "you", weight: 800 });
    }
  }
  function drawLay(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    const shelves = Array.from({ length: p.n }, (_, i) => i + 1);
    const all = rhythms(p.n);
    const u = clamp(Math.floor((top.w - 16) / (p.n * 3.4)), 10, 22);
    // rows: shelves far up are small and not touchable; n − 2, n − 1 and the new shelf are touch rows
    let y = top.y;
    const lineH = (sh: number) => (sh >= p.n - 2 ? 46 : 22);
    for (const sh of shelves) {
      const items = sh === p.n ? s.laid : rhythms(sh), touch = sh >= p.n - 2;
      const iw = sh * u + (touch ? 12 : 6), per = Math.max(1, Math.floor((top.w - 70) / (iw + 6)));
      const rows = Math.max(1, Math.ceil(items.length / per)), hh = lineH(sh);
      P.textFit(c, `${sh}`, top.x + 16, y + hh / 2, 30, hh, { size: 16, role: sh === p.n ? "you" : "ink2", weight: 800, font: "mono" });
      if (sh === p.n) P.body(c, top.x + 34, y - 2, top.w - 34, rows * (hh + 4) + 2, { role: "panel", r: 8, state: end && !s.done ? "look" : "idle" });
      items.forEach((r, i) => {
        const x = top.x + 40 + (i % per) * (iw + 6), yy = y + Math.floor(i / per) * (hh + 4);
        if (touch && !s.done) api.target(sh === p.n ? `laid:${i}` : `rh:${sh}:${i}`, x, yy, Math.max(44, iw), Math.max(44, hh));
        if (touch && sh < p.n) P.body(c, x, yy, iw, hh, { role: "panel", r: 8 });
        if (touch && sh < p.n) P.text(c, sh === p.n - 1 ? "S+" : "L+", x + 2, yy + 9, { size: 16, role: "ink3", weight: 700, align: "left" });
        drawRhythm(c, r, x + (touch ? 6 : 2), yy + (touch ? hh * 0.45 : 4), u, touch ? hh * 0.45 : hh - 8, sh === p.n ? "q2" : "q1");
        if (sh === p.n && end && !s.done && !all.includes(r)) P.magnifier(c, x + iw - 6, yy + 8, 10);
      });
      y += rows * (hh + 4) + 6;
    }
    if (end && !s.done && s.laid.length < all.length) P.magnifier(c, top.x + top.w - 16, y - 18, 14);
    if (end && s.done) P.tick(c, top.x + top.w - 18, y - 18, 22, 1);
    // the composer: S, L, back, the draft, lay
    const b = bot, kx = b.x;
    knob(c, "pad:S", "S", kx, b.y + 3); knob(c, "pad:L", "L", kx + 54, b.y + 3); knob(c, "pad:back", "⌫", kx + 108, b.y + 3);
    const dx = kx + 162, dw = b.w - 162 - 62;
    P.body(c, dx, b.y + 3, dw, 46, { role: "panel", r: 10 });
    if (draft) drawRhythm(c, draft, dx + 6, b.y + 15, Math.min(u, (dw - 12) / p.n), 22, "q2");
    P.textFit(c, `${beatsOf(draft)} / ${p.n}`, dx + dw - 30, b.y + 26, 54, 20, { size: 16, role: "ink2", weight: 700, font: "mono" });
    if (!s.done) api.target("pad:put", b.x + b.w - 56, b.y + 3, 56, 46);
    P.body(c, b.x + b.w - 56, b.y + 3, 56, 46, { role: beatsOf(draft) === p.n ? "q4" : "panel", r: 10 });
    P.textFit(c, W("kram.put"), b.x + b.w - 28, b.y + 26, 50, 40, { size: 16, weight: 800, on: beatsOf(draft) === p.n ? "q4" : "panel" });
  }
  function drawNest(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK(), ran = runAt >= 0 && s.ended;
    const n = p.n, big = n + 2;
    // the frame: n × n dots; the run nests the picked pieces from the corner
    const fs = Math.min(36, (top.w - 16) / (big + 1), (top.h - 30) / (big + 1));
    const fx = top.x + (top.w - fs * n) / 2, fy = top.y + 26 + (top.h - 26 - fs * big) / 2;
    P.textFit(c, `${n} × ${n}`, top.x + top.w / 2, top.y + 12, top.w, 22, { size: 18, role: "ink", weight: 800, font: "mono" });
    P.stroke(c, [[fx, fy], [fx + n * fs, fy], [fx + n * fs, fy + n * fs], [fx, fy + n * fs]], { role: "ink", width: 2.5, closed: true, dash: [6, 4] });
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) P.circle(c, fx + x * fs + fs / 2, fy + y * fs + fs / 2, 2, { role: "ink3", fill: true });
    const placed: [number, number, number][] = [];
    if (ran) {
      const show = Math.ceil(k * s.picked.length);
      if (goal === "odd") {
        // piece i (2i + 1 dots, arm i + 1): placed by size, the j-th smallest as ring j round the corner
        s.picked.slice(0, show).forEach((i) => { const arm = i + 1; for (let t = 0; t < arm; t++) { placed.push([t, arm - 1, i]); if (t < arm - 1) placed.push([arm - 1, t, i]); } });
      } else {
        // the bigger staircase from the top-left corner, the other turned round into the top-right
        [...s.picked].reverse().slice(0, show).forEach((i, j) => {
          const rows = i + 1;
          for (let r = 0; r < rows; r++) for (let t = 0; t <= r; t++) placed.push(j === 0 ? [t, r, i] : [n - 1 - t, rows - 1 - r, i]);
        });
      }
    }
    for (const [x, y, i] of placed) {
      const over = x >= n || y >= n;
      P.body(c, fx + x * fs + 2, fy + y * fs + 2, fs - 4, fs - 4, { role: over ? "look" : placeRole(i % 4), r: 4, seed: i * 31 + x * 7 + y });
    }
    if (end && !s.done) P.magnifier(c, fx + n * fs + 4, fy - 4, 16);
    if (end && s.done) P.tick(c, fx + n * fs + 4, fy - 4, 22, 1);
    // the tray
    const cols = Math.ceil(tray.length / 2), ts = (bot.w - 8 * (cols - 1)) / cols;
    tray.forEach((dots, i) => {
      const x = bot.x + (i % cols) * (ts + 8), y = bot.y + Math.floor(i / cols) * (ts + 8), on = s.picked.includes(i);
      if (!s.done) api.target(`piece:${i}`, x, y, ts, ts);
      P.body(c, x, y, ts, ts, { role: "panel", r: 10, state: on ? "selected" : "idle" });
      if (on) P.stroke(c, [[x + 2, y + 2], [x + ts - 2, y + 2], [x + ts - 2, y + ts - 2], [x + 2, y + ts - 2]], { role: "you", width: 3, closed: true });
      const pts: [number, number][] = [];
      if (goal === "odd") { const arm = i + 1; for (let t = 0; t < arm; t++) { pts.push([t, arm - 1]); if (t < arm - 1) pts.push([arm - 1, t]); } }
      else for (let r = 0; r <= i; r++) for (let t = 0; t <= r; t++) pts.push([t, r]);
      drawTiles(c, pts, { x: x + 6, y: y + 6, w: ts - 12, h: ts - 30 }, placeRole(i % 4), 12, true);
      P.text(c, String(dots), x + ts / 2, y + ts - 12, { size: 16, role: "ink", weight: 800, font: "mono" });
    });
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (goal === "next") drawNext(c);
    else if (bagGoal) drawFar(c);
    else if (goal === "step" || goal === "rule") drawMachine(c);
    else if (goal === "lay") drawLay(c);
    else drawNest(c);
  }

  function goalLine(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("kram.again");
    return W(`kram.goal.${goal}`, { n: goal === "far" && p.seq === "lines" ? p.n + 1 : p.n });
  }
  // no readout of the count, the step or the rule: the tiles, the bag and the dials ARE them
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (bagGoal) ready = ready && s.bag.some((x) => x > 0);
    if (goal === "next") ready = ready && s.cells.length > 0;
    if (goal === "lay") ready = ready && s.laid.length > 0;
    if (goal === "odd") ready = ready && s.picked.length > 0;
    if (goal === "pair") ready = ready && s.picked.length === 2;
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const runKey = goal === "next" || bagGoal ? "kram.grow" : goal === "step" || goal === "rule" ? "kram.run" : goal === "lay" ? "kram.play" : "kram.fill";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  void stepOf; void boardTiles;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal: goalLine, readouts, controls, react, dragging: () => !!paint };
  return view;
};
