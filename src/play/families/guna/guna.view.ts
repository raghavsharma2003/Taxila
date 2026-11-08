// Guna · the 2D view (round 7, multi-digit multiplication and division; classes 4-5). Nothing here runs on a clock: every
// cut, crate, deal and count moves on the child's touch, and the run (drive onto the weighbridge, send the trucks, run the
// story) only shows what the law has already answered.
//   field (area)   the field a × b with its sides labelled; drag along the top (or the left) edge to lay a cut there, drag
//                  onto a cut to lift it. A piece whose two sides are each one place (30 × 6) fills with its tiles in the
//                  place's colour (3 × 6 ten-tiles); any other piece stays bare. The truck below has one rack per place
//                  (crates of 1, 10, 100 …, nine at most to a rack): − / + load it. No readout of the load: the crates ARE it.
//   field (round)  the field a × b, dashed; drag its top / left edge to a round length (the side snaps to the round lengths
//                  either side of it); the round field fills with its tiles; load the truck with about that much.
//   pack           the godown's crates by place, each column with "share" (one crate into every truck) and "open" (one crate
//                  into ten of the next place); the trucks below fill as the rounds go; send them when the rest is on the dock.
//   story          the story's things and how many go in one; the vehicles / packets set out (or the jar's count) with the
//                  pads; the run fills them in turn and leaves on the dock what does not fit.
//   field (check)  as round, and three dockets on the board (a × b as someone wrote it): a tap marks one "could be right"
//                  (a tick), again "send back" (a cross); the bridge checks the estimate and every mark.
//   big trucks     (r7 guna2, class 7: 6 or 7 racks, crates up to 10^6) the racks stand as columns, + above and − below,
//                  so seven fit a phone's width with 44 px targets; places from 10^4 up are labelled as powers (10⁵).
//   pack (each)    one column of loose things and the friends' plates below: "share" gives one to every friend.
//   yard (build)   (r7 place2) the docket on the board names a number (its units in the child's language); the truck below
//                  has a rack per place as rows (biggest on top), − / + on each; on "drive" the bridge reads the load back
//                  as a numeral with Indian commas (what the child built, never the docket's answer before the run).
//   yard (commas)  the number's crates stand in columns, its digits under them; a tap in a gap sets (or lifts) a comma post;
//                  on "read" the bridge writes the number with the child's posts.
// After a missed run only magnifiers mark what is not as it should be (a rack, the dock, a vehicle, the jar); never the key.
import type { GunaAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { digits, dockets, FORMS, indianCommas, indianPosts, isRound, leadOf, partsOf, partsOfForm, placesOf, RACK, rightMarks, STORY_MAX, unitOf, valueOf, want, withPosts, YARD_BIG, type GunaParams, type GunaState } from "./guna.logic.ts";

const SWEEP = 1.4;   // s a weighbridge / send / story run takes on screen (cosmetic: the law has already answered)
/** the colour of a tile / crate of 10^e */
const PLACE_ROLE: readonly Role[] = ["q1", "q2", "q3", "q4", "ink2"];
const placeRole = (e: number): Role => PLACE_ROLE[clamp(e, 0, PLACE_ROLE.length - 1)];
/** the story's things and what holds them, per goal and context */
const STORY: Record<string, readonly [string, string][]> = {
  all: [["child", "bus"], ["child", "auto"], ["book", "box"]],
  full: [["sweet", "packet"], ["rice", "sack"], ["marble", "bag"]],
  left: [["sweet", "packet"], ["marble", "bag"], ["rice", "sack"]],
};
/** each: the things shared among the friends */
const EACH_ITEM = ["sweet", "marble", "book"];
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** a rack's label: 1, 10, 100, 1000, then 10⁴, 10⁵, 10⁶ (a column is too narrow for 1000000) */
const placeLabel = (e: number) => (e <= 3 ? String(10 ** e) : `10${[...String(e)].map((d) => SUP[Number(d)]).join("")}`);

export const makeGunaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<GunaParams, GunaState, GunaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, field = p.goal === "area" || p.goal === "round" || p.goal === "check", story = p.goal === "all" || p.goal === "full" || p.goal === "left";
  const rounding = p.goal === "round" || p.goal === "check", pack = p.goal === "share" || p.goal === "each";
  const build = p.goal === "build", commas = p.goal === "commas", yard = build || commas;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const racks = field || yard ? st().crates.length : 0, cols = field && racks > 5;
  // the round lengths either side of a side (round goal)
  const lo = (x: number) => Math.floor(x / unitOf(x)) * unitOf(x), hi = (x: number) => Math.ceil(x / unitOf(x)) * unitOf(x);
  const drawA = rounding ? hi(p.a) : p.a, drawB = rounding ? hi(p.b) : p.b;

  let w = 360, h = 480;
  let boardY = 8, boardH = 40;
  // field: origin and scale; the truck's racks
  let ox = 0, oy = 0, sx = 1, sy = 1, rowH = 46, rackX = 8, rackY = 0, rackW = 300, colK = 44;
  // a big truck's columns: + (44), nine crates, − (44), the label
  const CRATE_H = 10, COL_H = 44 + 6 + RACK * CRATE_H + 6 + 44 + 24;
  // pack: the godown's columns and the trucks
  let colW = 90, colX = 8, colY = 0, stackH = 120, btnY = 0, truckY = 0, truckW = 60, truckH = 64, perRow = 5;
  // story: the grid of vehicles / packets and the jar
  let gx = 8, gy = 0, cell = 48, gcols = 10, jarX = 8, jarY = 0, jarW = 120, jarH = 90, dockY = 0;
  const DOCK_H = 56;
  // yard: the commas strip (columns, the digits' baseline) and the bridge's reading
  let stripX = 8, stripY = 0, digitY = 0, bridgeY = 0, split = false;
  let drag: null | { side: 0 | 1; v: number } = null;
  let runAt = -1;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    boardY = 8; boardH = story || pack ? 64 : p.goal === "check" ? 60 : yard ? 52 : 40;
    if (build) {
      // the docket, the truck's rows (each at least 44 high), the bridge's reading under the wheels
      // (a short phone tray: the racks in two halves side by side, the big places on the left, so every row stays 44 high)
      const top = boardY + boardH + 14;
      split = top + racks * 44 + 72 > h;
      const rows = split ? Math.ceil(racks / 2) : racks;
      rowH = clamp((h - top - 72) / rows, 44, racks > 6 ? 46 : 50);
      rackW = Math.min(w - 16, split ? 460 : 380); rackX = (w - rackW) / 2; rackY = top;
      bridgeY = rackY + rows * rowH + 22;
    } else if (commas) {
      colK = Math.min(56, (w - 16) / racks); stripX = (w - colK * racks) / 2; stripY = boardY + boardH + 16;
      digitY = stripY + RACK * CRATE_H + 30; bridgeY = digitY + 66;
    } else if (field) {
      const wide = w > h * 1.15;
      rowH = 46;
      const truckH0 = cols ? COL_H + 18 : racks * rowH + 22;
      // portrait: field above, truck below; landscape: field left, truck right
      const fx = 8, fy = boardY + boardH + 8;
      const fw = wide ? w * 0.56 - 16 : w - 16;
      const fh = wide ? h - fy - 8 : h - fy - truckH0 - 16;
      rackW = Math.min(wide ? w - fw - 32 : w - 16, 380);
      if (cols) { colK = Math.min(56, Math.max(44, rackW / racks)); rackW = colK * racks; }
      rackX = wide ? fx + fw + 16 + (w - fw - 32 - rackW) / 2 : (w - rackW) / 2;
      rackY = wide ? Math.max(fy, (h - truckH0) / 2) : h - truckH0 - 8;
      const aw = fw - 56, ah = fh - 52;
      sx = aw / drawA; sy = ah / drawB;
      // each axis has its own scale (every piece keeps its share of the field), but never stretched more than 10 to 1, so
      // a 3-digit × 1-digit field stays a field, not a line, while a long thin 12 × 90 still fills a phone's width
      const STRETCH = 10;
      if (sy > STRETCH * sx) sy = STRETCH * sx;
      if (sx > STRETCH * sy) sx = STRETCH * sy;
      ox = fx + 52 + Math.max(0, (aw - drawA * sx) / 2);
      oy = fy + 48 + Math.max(0, (ah - drawB * sy) / 2);
    } else if (pack) {
      const n = st().dock.length;
      colW = Math.min(120, (w - 16 - 8 * (n - 1)) / n); colX = (w - (colW * n + 8 * (n - 1))) / 2; colY = boardY + boardH + 10;
      perRow = Math.min(p.b, Math.max(3, Math.floor((w - 16 + 8) / (64 + 8))));
      const rows = Math.ceil(p.b / perRow);
      truckW = Math.min(84, (w - 16 - 8 * (perRow - 1)) / perRow); truckH = clamp((h - colY - 26 - 2 * 52 - 140) / rows, 56, 92);
      truckY = h - rows * (truckH + 8) - 4;
      btnY = truckY - 12 - 2 * 52 + 4;
      stackH = Math.max(80, btnY - colY - 30);
    } else {
      dockY = boardY + boardH + 8;
      let y = dockY + DOCK_H + 8;
      if (p.goal === "left") { jarW = Math.min(w - 16, 300); jarH = 84; jarX = (w - jarW) / 2; jarY = y; y += jarH + 8; }
      gy = y + (p.goal === "left" ? 0 : 30);
      const n = Math.max(1, gridN(), p.goal === "left" ? Math.ceil(p.a / p.b) : 0);
      gcols = clamp(Math.ceil(Math.sqrt(n * 1.6)), 4, 10);
      const rows = Math.ceil(n / gcols);
      cell = Math.min(64, (w - 16) / gcols, (h - gy - 44) / Math.max(1, rows));
      gx = (w - cell * gcols) / 2;
    }
  }
  /** how many vehicles / packets the story grid shows now (left: the machine's packets appear only on the run, so the jar
   *  is never checked by a preview) */
  function gridN(): number {
    const s = st();
    if (p.goal === "left") return s.ended ? Math.min(STORY_MAX, Math.ceil(Math.max(0, p.a - s.n) / p.b)) : 0;
    return Math.max(0, s.n);
  }
  const act = (a: GunaAct) => { ctl.dispatch(a); if (story) layout(w, h); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as GunaAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "crate" || last.kind === "deal") api.sfx("land");
    else if (last.kind === "cut" || last.kind === "round" || last.kind === "open") api.sfx("tick");
    else api.sfx("tap");
    if (!st().ended) runAt = -1;
    void ms;
    if (story) layout(w, h);
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
  const busy = () => !!drag || (runAt >= 0 && runK() < 1);

  // ── field geometry ──
  const lenOf = (side: 0 | 1) => {
    const s = st();
    if (rounding) return side === 0 ? s.ra || p.a : s.rb || p.b;
    return side === 0 ? p.a : p.b;
  };
  /** a side can be cut (area: not one place already) / stretched (round) */
  const cuttable = (side: 0 | 1) => (rounding ? true : !isRound(side === 0 ? p.a : p.b));
  function snapCut(side: 0 | 1, pos: number): number {
    const len = side === 0 ? p.a : p.b, u = len >= 100 ? 10 : 1;
    return clamp(Math.round(pos / u) * u, u, len - 1 < u ? 1 : Math.floor((len - 1) / u) * u);
  }
  function snapRound(side: 0 | 1, pos: number): number {
    const len = side === 0 ? p.a : p.b, l = lo(len), u = hi(len);
    return Math.abs(pos - l) <= Math.abs(pos - u) ? l : u;
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done) return;
    if (field) {
      if (kind === "down") {
        const id = api.hit(x, y);
        if (id === "edge-a" || id === "edge-b") {
          const side: 0 | 1 = id === "edge-a" ? 0 : 1, pos = side === 0 ? (x - ox) / sx : (y - oy) / sy;
          drag = { side, v: rounding ? snapRound(side, pos) : snapCut(side, pos) };
          ctl.finger(true); api.sfx("select");
        } else if (id?.startsWith("docket-")) {
          const i = Number(id.slice(7));
          act({ kind: "stamp", i, to: s.marks[i] === 1 ? 2 : 1 });
        } else if (id?.startsWith("rack-")) {
          const [, pl, dir] = id.split("-");
          act({ kind: "crate", place: Number(pl), by: dir === "add" ? 1 : -1 });
        }
      } else if (kind === "move" && drag) {
        const pos = drag.side === 0 ? (x - ox) / sx : (y - oy) / sy;
        drag.v = rounding ? snapRound(drag.side, pos) : snapCut(drag.side, pos);
      } else if ((kind === "up" || kind === "cancel") && drag) {
        const d0 = drag; drag = null; ctl.finger(false);
        if (kind === "up") {
          if (rounding) { if (d0.v !== (d0.side === 0 ? s.ra : s.rb)) act({ kind: "round", side: d0.side, to: d0.v }); }
          else act({ kind: "cut", side: d0.side, at: d0.v });
        }
      }
      api.invalidate(); if (kind !== "move") deps.changed();
      return;
    }
    if (yard && kind === "down") {
      const id = api.hit(x, y);
      if (id?.startsWith("rack-")) { const [, pl, dir] = id.split("-"); act({ kind: "crate", place: Number(pl), by: dir === "add" ? 1 : -1 }); }
      else if (id?.startsWith("post-")) act({ kind: "post", at: Number(id.slice(5)) });
      return;
    }
    if (pack && kind === "down") {
      const id = api.hit(x, y);
      if (id?.startsWith("deal-")) act({ kind: "deal", place: Number(id.slice(5)) });
      else if (id?.startsWith("open-")) act({ kind: "open", place: Number(id.slice(5)) });
    }
  }

  // ── drawing helpers ──
  function boardRows(c: CanvasRenderingContext2D, lines: [string, string][]): void {
    const P = api.P, bw = Math.min(w - 16, 420), bx = (w - bw) / 2;
    P.body(c, bx, boardY, bw, boardH, { role: "panel", r: 10 });
    const lh = boardH / lines.length;
    lines.forEach(([k, v], i) => {
      const y = boardY + lh * (i + 0.5);
      P.textFit(c, k, bx + 10 + (bw * 0.56) / 2, y, bw * 0.56, lh, { size: 16, role: "ink2", weight: 600 });
      P.textFit(c, v, bx + bw * 0.6 + (bw * 0.38) / 2, y, bw * 0.38, lh, { size: clamp(lh * 0.55, 16, 24), role: "ink", weight: 700, font: "mono" });
    });
  }
  /** one piece of the field: its tiles when both its sides are one place each, else bare ground */
  function piece(c: CanvasRenderingContext2D, x: number, y: number, pw: number, ph: number, pa: number, pb: number): void {
    const P = api.P;
    if (!isRound(pa) || !isRound(pb)) { P.body(c, x + 1, y + 1, Math.max(1, pw - 2), Math.max(1, ph - 2), { role: "panel", r: 2 }); return; }
    const e = digits(unitOf(pa)) - 1 + digits(unitOf(pb)) - 1, nc = leadOf(pa), nr = leadOf(pb);
    c.save(); c.fillStyle = P.color(placeRole(e));
    const tw = pw / nc, th = ph / nr;
    if (p.face === 3 || tw < 3 || th < 3) c.fillRect(x + 1, y + 1, pw - 2, ph - 2);
    else for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) c.fillRect(x + i * tw + 1, y + j * th + 1, tw - 2, th - 2);
    c.restore();
  }
  /** labels of a side's parts, staggered when a neighbour would touch */
  function sideLabels(c: CanvasRenderingContext2D, side: 0 | 1, parts: number[], scale: number): void {
    const P = api.P;
    let at = 0, lastEnd = -Infinity, row = 0;
    for (const part of parts) {
      const mid = (at + part / 2) * scale, s = String(part), tw = s.length * 10 + 6;
      if (side === 0) {
        const cx0 = ox + mid;
        row = cx0 - tw / 2 < lastEnd ? 1 - row : 0;
        P.text(c, s, cx0, oy - (row ? 34 : 14), { size: 16, role: "ink", weight: 700, font: "mono" });
        lastEnd = cx0 + tw / 2;
      } else {
        const cy0 = oy + mid;
        row = cy0 - 10 < lastEnd ? 1 - row : 0;
        P.text(c, s, ox - (row ? 44 : 24) + (row ? 0 : 0), cy0, { size: 16, role: "ink", weight: 700, font: "mono", maxW: 40 });
        lastEnd = cy0 + 10;
      }
      at += part;
    }
  }

  function drawField(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    // the board: the field asked for (check: and the three dockets beside it)
    if (p.goal === "check") drawDockets(c, end);
    else P.text(c, `${p.goal === "round" ? "≈ " : ""}${p.a} × ${p.b}`, w / 2, boardY + boardH / 2, { size: 24, role: "ink", weight: 800, font: "mono" });
    // the sides as they stand (a drag shows its preview; the law is not asked until the finger lifts)
    let A = lenOf(0), B = lenOf(1), cx = [...s.cx], cy = [...s.cy];
    if (drag && rounding) { if (drag.side === 0) A = drag.v; else B = drag.v; }
    if (drag && p.goal === "area") {
      const list = drag.side === 0 ? cx : cy;
      if (!list.includes(drag.v)) list.push(drag.v);
      list.sort((x0, y0) => x0 - y0);
    }
    if (rounding) {
      // the field as asked, dashed; the child's field over it
      P.stroke(c, [[ox, oy], [ox + p.a * sx, oy], [ox + p.a * sx, oy + p.b * sy], [ox, oy + p.b * sy]], { role: "ink3", width: 2, dash: [6, 5], closed: true });
    }
    if (cuttable(0)) api.target("edge-a", ox - 6, oy - 48, Math.max(44, A * sx + 12), 46);
    if (cuttable(1)) api.target("edge-b", ox - 50, oy - 6, 48, Math.max(44, B * sy + 12));
    const pa = rounding ? [A] : partsOf(A, cx), pb = rounding ? [B] : partsOf(B, cy);
    const ready = p.goal === "area" || (!!(s.ra && s.rb) && !drag);
    let yy = oy;
    for (const b0 of pb) {
      let xx = ox;
      for (const a0 of pa) {
        if (ready) piece(c, xx, yy, a0 * sx, b0 * sy, a0, b0);
        else P.body(c, xx + 1, yy + 1, a0 * sx - 2, b0 * sy - 2, { role: "panel", r: 2 });
        xx += a0 * sx;
      }
      yy += b0 * sy;
    }
    P.stroke(c, [[ox, oy], [ox + A * sx, oy], [ox + A * sx, oy + B * sy], [ox, oy + B * sy]], { role: "ink", width: 2.5, closed: true });
    // the ruler along an edge that can be cut (fade 1: every ten marked long; fade 3: none)
    if (p.goal === "area" && p.face < 3) for (const side of [0, 1] as const) {
      if (!cuttable(side)) continue;
      const len = side === 0 ? A : B, sc = side === 0 ? sx : sy, unitPx = sc >= 4;
      for (let u = 1; u < len; u++) {
        const ten = u % 10 === 0;
        if (!ten && !unitPx) continue;
        const L = ten && p.face === 1 ? 9 : 4, at = (side === 0 ? ox : oy) + u * sc;
        P.stroke(c, side === 0 ? [[at, oy], [at, oy - L]] : [[ox, at], [ox - L, at]], { role: ten && p.face === 1 ? "ink2" : "ink3", width: ten && p.face === 1 ? 2 : 1 });
      }
    }
    // the cuts: a line across the field and a knife mark on the edge
    if (p.goal === "area") {
      for (const at of cx) { const x = ox + at * sx; P.stroke(c, [[x, oy - 6], [x, oy + B * sy]], { role: "you", width: 2.5, dash: drag?.side === 0 && drag.v === at ? [4, 3] : undefined }); }
      for (const at of cy) { const y = oy + at * sy; P.stroke(c, [[ox - 6, y], [ox + A * sx, y]], { role: "you", width: 2.5, dash: drag?.side === 1 && drag.v === at ? [4, 3] : undefined }); }
    }
    sideLabels(c, 0, pa, sx);
    sideLabels(c, 1, pb, sy);
    drawTruck(c, end);
  }
  /** check: a × b and the three dockets someone wrote; a tick = could be right, a cross = send back */
  function drawDockets(c: CanvasRenderingContext2D, end: boolean): void {
    const P = api.P, s = st(), ds = dockets(p), right = rightMarks(p);
    const bw = Math.min(w - 16, 460), bx = (w - bw) / 2, lw = Math.min(110, bw * 0.3), gap = 6;
    P.textFit(c, `${p.a} × ${p.b}`, bx + lw / 2, boardY + boardH / 2, lw - 4, boardH, { size: 20, role: "ink", weight: 800, font: "mono" });
    const dw = (bw - lw - gap * (ds.length - 1)) / ds.length;
    ds.forEach((d, i) => {
      const x = bx + lw + i * (dw + gap), m = s.marks[i], bad = end && !s.done && m !== right[i];
      if (!s.done) api.target(`docket-${i}`, x, boardY, dw, boardH);
      P.body(c, x, boardY, dw, boardH, { role: m === 1 ? "q2" : "panel", r: 8, state: bad ? "look" : "idle", seed: 90 + i });
      P.textFit(c, String(d.v), x + dw / 2, boardY + 18, dw - 8, 24, { size: 18, weight: 800, font: "mono", on: m === 1 ? "q2" : "panel" });
      const gy0 = boardY + boardH - 17;
      if (m === 1) P.tick(c, x + dw / 2, gy0, 14, 1);
      else if (m === 2) { P.stroke(c, [[x + dw / 2 - 7, gy0 - 7], [x + dw / 2 + 7, gy0 + 7]], { role: "ink", width: 3 }); P.stroke(c, [[x + dw / 2 + 7, gy0 - 7], [x + dw / 2 - 7, gy0 + 7]], { role: "ink", width: 3 }); }
      else P.stroke(c, [[x + dw / 2 - 8, gy0 + 6], [x + dw / 2 + 8, gy0 + 6]], { role: "ink3", width: 2 });
      if (bad) P.magnifier(c, x + dw - 12, boardY + boardH - 12, 12);
    });
  }
  /** a big truck (more than five racks): one column per place, biggest on the left as the number is written */
  function drawTruckCols(c: CanvasRenderingContext2D, end: boolean): void {
    const P = api.P, s = st(), wantDigits = placesOf(want(p), racks);
    P.body(c, rackX - 4, rackY - 4, rackW + 8, COL_H + 4, { role: "panel", r: 10, state: end && !s.done ? "look" : "idle" });
    for (const fx of [0.2, 0.8]) P.circle(c, rackX + rackW * fx, rackY + COL_H + 8, 8, { role: "ink2", fill: true });
    for (let k0 = 0; k0 < racks; k0++) {
      const place = racks - 1 - k0, x = rackX + k0 * colK, cx = x + colK / 2, n = s.crates[place];
      const addY = rackY, slotY = rackY + 44 + 6, takeY = slotY + RACK * CRATE_H + 6, labY = takeY + 44 + 12;
      if (!s.done) { api.target(`rack-${place}-add`, x, addY, colK, 44); api.target(`rack-${place}-take`, x, takeY, colK, 44); }
      P.body(c, x + 2, addY + 2, colK - 4, 40, { role: "panel", r: 8 });
      P.text(c, "+", cx, addY + 22, { size: 22, role: n < RACK ? "ink" : "ink3", weight: 800 });
      P.body(c, x + 2, takeY + 2, colK - 4, 40, { role: "panel", r: 8 });
      P.text(c, "−", cx, takeY + 22, { size: 22, role: n > 0 ? "ink" : "ink3", weight: 800 });
      // the crates stack up from the bottom of the column
      for (let k = 0; k < RACK; k++) {
        const y = slotY + (RACK - 1 - k) * CRATE_H;
        if (k < n) P.body(c, x + 6, y + 1, colK - 12, CRATE_H - 2, { role: placeRole(place), r: 2, seed: place * 10 + k });
        else if (k === 0) P.stroke(c, [[x + 6, y + CRATE_H - 1], [x + colK - 6, y + CRATE_H - 1]], { role: "ink3", width: 1.5 });
      }
      P.text(c, placeLabel(place), cx, labY, { size: 16, role: "ink2", weight: 700, font: "mono", maxW: colK - 2 });
      if (k0 > 0) P.stroke(c, [[x, slotY], [x, slotY + RACK * CRATE_H]], { role: "ink3", width: 1 });
      if (end && !s.done && n !== wantDigits[place]) P.magnifier(c, cx + colK / 2 - 10, slotY + 10, 12);
    }
    if (end && s.done) P.tick(c, rackX + rackW / 2, rackY - 18, 26, 1);
  }
  function drawTruck(c: CanvasRenderingContext2D, end: boolean): void {
    if (cols) { drawTruckCols(c, end); return; }
    const P = api.P, s = st(), wantDigits = placesOf(want(p), racks);
    const labW = 60, slotX = rackX + labW + 46, slotW = (rackW - labW - 92 - 8) / RACK;
    // the truck's bed and wheels
    P.body(c, rackX - 4, rackY - 4, rackW + 8, racks * rowH + 4, { role: "panel", r: 10, state: end && !s.done ? "look" : "idle" });
    for (const fx of [0.2, 0.8]) P.circle(c, rackX + rackW * fx, rackY + racks * rowH + 8, 8, { role: "ink2", fill: true });
    for (let r = 0; r < racks; r++) {
      const place = racks - 1 - r, y = rackY + r * rowH, cy = y + rowH / 2, n = s.crates[place];
      P.text(c, String(10 ** place), rackX + labW / 2, cy, { size: 16, role: "ink2", weight: 700, font: "mono", maxW: labW - 6 });
      if (!s.done) { api.target(`rack-${place}-take`, rackX + labW, y + 1, 44, 44); api.target(`rack-${place}-add`, rackX + rackW - 44, y + 1, 44, 44); }
      P.body(c, rackX + labW + 2, y + 4, 40, 38, { role: "panel", r: 8 });
      P.text(c, "−", rackX + labW + 22, cy, { size: 22, role: n > 0 ? "ink" : "ink3", weight: 800 });
      P.body(c, rackX + rackW - 42, y + 4, 40, 38, { role: "panel", r: 8 });
      P.text(c, "+", rackX + rackW - 22, cy, { size: 22, role: n < RACK ? "ink" : "ink3", weight: 800 });
      for (let k = 0; k < RACK; k++) {
        const x = slotX + k * slotW;
        if (k < n) P.body(c, x + 1, y + 9, slotW - 2, rowH - 18, { role: placeRole(place), r: 3, seed: place * 10 + k });
        else P.stroke(c, [[x + 1, y + rowH - 9], [x + slotW - 1, y + rowH - 9]], { role: "ink3", width: 1.5 });
      }
      if (end && !s.done && n !== wantDigits[place]) P.magnifier(c, slotX + RACK * slotW - 12, cy - 8, 16);
    }
    if (end && s.done) P.tick(c, rackX + rackW / 2, rackY - 18, 26, 1);
  }

  function drawPack(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), n = s.dock.length;
    const each = p.goal === "each";
    boardRows(c, each ? [[W(`guna.item.${EACH_ITEM[p.ctx] ?? EACH_ITEM[0]}`), String(p.a)], [W("guna.friends"), String(p.b)]] : [[W("guna.godown"), String(p.a)], [W("guna.trucks"), String(p.b)]]);
    for (let i = 0; i < n; i++) {
      const place = n - 1 - i, x = colX + i * (colW + 8), count = s.dock[place];
      if (!each) P.text(c, String(10 ** place), x + colW / 2, colY + 10, { size: 16, role: "ink2", weight: 700, font: "mono" });
      // the stack: crates in rows of five (the count beside it once it is more than fits)
      const per = 5, sz = Math.min(18, (colW - 12) / per), cap = Math.max(per, Math.floor((stackH - 26) / (sz + 2)) * per);
      P.body(c, x, colY + 22, colW, stackH, { role: "panel", r: 8, state: end && !s.done && count > 0 && (place > 0 || count >= p.b) ? "look" : "idle" });
      for (let k = 0; k < Math.min(count, cap); k++) {
        const cx = x + 6 + (k % per) * (sz + 2) + (colW - 12 - per * (sz + 2)) / 2, cy = colY + 22 + stackH - 8 - (Math.floor(k / per) + 1) * (sz + 2);
        P.body(c, cx, cy, sz, sz, { role: placeRole(place), r: 3, seed: place * 50 + k });
      }
      P.text(c, String(count), x + colW / 2, colY + 22 + 14, { size: 16, role: "ink", weight: 800, font: "mono" });
      if (end && !s.done && count > 0 && (place > 0 || count >= p.b)) P.magnifier(c, x + colW - 14, colY + 36, 14);
      // share one round of this place; open one crate into the place below
      if (!s.done) api.target(`deal-${place}`, x, btnY, colW, 46);
      P.body(c, x, btnY, colW, 46, { role: count >= p.b ? "q4" : "panel", r: 10 });
      P.textFit(c, W("guna.deal"), x + colW / 2, btnY + 23, colW - 8, 40, { size: 16, weight: 700, on: count >= p.b ? "q4" : "panel" });
      if (place > 0) {
        if (!s.done) api.target(`open-${place}`, x, btnY + 52, colW, 46);
        P.body(c, x, btnY + 52, colW, 46, { role: "panel", r: 10 });
        P.textFit(c, W("guna.open"), x + colW / 2, btnY + 75, colW - 8, 40, { size: 16, weight: 700, role: count > 0 ? "ink" : "ink3" });
      }
    }
    // the trucks: every truck holds the same crates (one per deal); on send they drive off to the right
    const k = runK(), off = runAt >= 0 && s.ended && s.done ? k * 24 : 0;
    for (let t = 0; t < p.b; t++) {
      const row = Math.floor(t / perRow), col = t % perRow, inRow = Math.min(perRow, p.b - row * perRow);
      const x = (w - (inRow * truckW + (inRow - 1) * 8)) / 2 + col * (truckW + 8) + off, y = truckY + row * (truckH + 8);
      P.body(c, x, y, truckW, truckH - 8, { role: "panel", r: each ? 14 : 6, seed: 70 + t });
      if (!each) {
        P.circle(c, x + truckW * 0.25, y + truckH - 6, 5, { role: "ink2", fill: true });
        P.circle(c, x + truckW * 0.75, y + truckH - 6, 5, { role: "ink2", fill: true });
      }
      // the crates inside: one row per place, biggest on top
      const ms = Math.max(3, Math.min(7, (truckW - 8) / 10 - 1));
      let ry = y + 5;
      for (let pl = n - 1; pl >= 0; pl--) {
        const m = s.truck[pl];
        for (let j = 0; j < m; j++) {
          const cx = x + 4 + (j % 10) * (ms + 1), cy = ry + Math.floor(j / 10) * (ms + 1);
          if (cy + ms < y + truckH - 10) { c.save(); c.fillStyle = api.P.color(placeRole(pl)); c.fillRect(cx, cy, ms, ms); c.restore(); }
        }
        ry += (Math.ceil(m / 10) || 1) * (ms + 1) + 2;
      }
    }
    if (end && s.done) P.tick(c, w / 2, truckY - 14, 24, 1);
  }

  /** the things on the dock in the family's place-value shapes: a hundred as a flat, a ten as a stick, a one as a dot
   *  (the count is never capped: every thing waiting is drawn, scaled down together when the dock is short) */
  function dockThings(c: CanvasRenderingContext2D, n: number, x: number, y: number, bw: number, bh: number): void {
    const P = api.P, H = Math.floor(n / 100), T = Math.floor((n % 100) / 10), O = n % 10;
    const FL = 36, ST = 7, GAP = 4, DOT = 9, oneCols = Math.ceil(O / 2);
    const natW = H * (FL + GAP) + (H && (T || O) ? GAP : 0) + T * (ST + GAP) + (T && O ? GAP : 0) + oneCols * DOT;
    const k = Math.min(1, bw / Math.max(1, natW), bh / FL);
    let cx = x;
    for (let i = 0; i < H; i++) {
      P.body(c, cx, y, FL * k, FL * k, { role: "q1", r: 2, seed: 300 + i });
      for (let g = 1; g < 10; g++) {
        const at = (FL * k * g) / 10;
        P.stroke(c, [[cx + at, y], [cx + at, y + FL * k]], { role: "ink3", width: 0.6 });
        P.stroke(c, [[cx, y + at], [cx + FL * k, y + at]], { role: "ink3", width: 0.6 });
      }
      cx += (FL + GAP) * k;
    }
    if (H && (T || O)) cx += GAP * k;
    for (let i = 0; i < T; i++) {
      P.body(c, cx, y, ST * k, FL * k, { role: "q1", r: 2, seed: 200 + i });
      for (let g = 1; g < 10; g++) P.stroke(c, [[cx, y + (FL * k * g) / 10], [cx + ST * k, y + (FL * k * g) / 10]], { role: "ink3", width: 0.6 });
      cx += (ST + GAP) * k;
    }
    if (T && O) cx += GAP * k;
    for (let i = 0; i < O; i++) P.circle(c, cx + (Math.floor(i / 2) + 0.5) * DOT * k, y + FL * k * (i % 2 ? 0.72 : 0.28), DOT * k * 0.38, { role: "q1", fill: true });
  }

  function drawStory(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd(), k = runK();
    const [item, holder] = STORY[p.goal][p.ctx] ?? STORY[p.goal][0];
    boardRows(c, [[W(`guna.item.${item}`), String(p.a)], [W(`guna.per.${holder}`), String(p.b)]]);
    const ran = runAt >= 0 && s.ended, after = ran && k >= 1;
    // the dock: the things waiting (before the run all of them; after it, what did not go)
    const waiting = !after ? (p.goal === "left" ? p.a - s.n : p.a) : p.goal === "left" ? 0 : Math.max(0, p.a - s.n * p.b);
    const dockBad = end && !s.done && waiting > 0;
    const dw = Math.min(w - 16, 300), dx = (w - dw) / 2;
    P.body(c, dx, dockY, dw, DOCK_H, { role: "panel", r: 10, state: dockBad ? "look" : "idle" });
    dockThings(c, waiting, dx + 10, dockY + 6, dw - 20 - (dockBad ? 30 : 0), DOCK_H - 12);
    if (dockBad) P.magnifier(c, dx + dw - 16, dockY + DOCK_H - 16, 14);
    // left: the jar (what the machine must not pack)
    if (p.goal === "left") {
      const bad = end && !s.done && s.n >= p.b;
      P.body(c, jarX, jarY, jarW, jarH, { role: "panel", r: 14, state: bad ? "look" : "idle" });
      P.text(c, W("guna.jar"), jarX + 12, jarY + 16, { size: 16, role: "ink2", weight: 700, align: "left" });
      P.text(c, String(s.n), jarX + jarW - 30, jarY + 18, { size: 22, role: "ink", weight: 800, font: "mono" });
      const jd = Math.min(s.n, 40), js = Math.min(12, (jarW - 24) / 20);
      for (let i = 0; i < jd; i++) P.circle(c, jarX + 12 + js / 2 + (i % 20) * js, jarY + 40 + Math.floor(i / 20) * js, js * 0.38, { role: "q1", fill: true });
      if (bad) P.magnifier(c, jarX + jarW - 18, jarY + jarH - 18, 16);
    }
    // the vehicles / packets: set out (all / full; their count above them) or made by the machine on the run (left)
    const n = gridN(), rows = Math.ceil(n / gcols), pool = p.goal === "left" ? p.a - s.n : p.a;
    if (p.goal !== "left") {
      const iy = gy - 16;
      P.body(c, w / 2 - 44, iy - 10, 30, 20, { role: "panel", r: 4 });
      P.circle(c, w / 2 - 36, iy + 11, 3, { role: "ink2", fill: true }); P.circle(c, w / 2 - 22, iy + 11, 3, { role: "ink2", fill: true });
      P.text(c, String(s.n), w / 2 + 10, iy, { size: 22, role: "ink", weight: 800, font: "mono", align: "left" });
    }
    for (let i = 0; i < n; i++) {
      const x = gx + (i % gcols) * cell, y = gy + Math.floor(i / gcols) * cell;
      const hold = clamp(pool - i * p.b, 0, p.b);
      const fillK = ran ? clamp(k * n - i, 0, 1) * (hold / p.b) : 0;
      const bad = end && !s.done && ((p.goal === "all" && hold === 0) || (p.goal !== "all" && hold < p.b));
      P.body(c, x + 3, y + 3, cell - 6, cell - 12, { role: "panel", r: 6, state: bad ? "look" : "idle", seed: i });
      if (fillK > 0) { c.save(); c.fillStyle = P.color("q2"); const fh = (cell - 16) * fillK; c.fillRect(x + 5, y + cell - 11 - fh, cell - 10, fh); c.restore(); }
      if (cell >= 30) { P.circle(c, x + cell * 0.3, y + cell - 7, 3, { role: "ink2", fill: true }); P.circle(c, x + cell * 0.7, y + cell - 7, 3, { role: "ink2", fill: true }); }
      if (bad && i === n - 1) P.magnifier(c, x + cell - 10, y + 10, 14);
    }
    if (end && s.done) P.tick(c, w / 2, Math.min(h - 20, gy + rows * cell + 16), 24, 1);
  }

  /** yard: the docket as the child's language names it (units in words, counts in digits) */
  function docket(): string {
    const form = FORMS[p.ctx] ?? "named";
    if (build && form === "numeral") return String(p.a);
    const parts = partsOfForm(p.a, commas ? "named" : form, commas || p.b === YARD_BIG);
    if (build && form === "expanded") return parts.map((x) => String(x.c * x.unit)).join(" + ");
    return parts.map((x) => (x.name ? `${x.c} ${W(`guna.unit.${x.name}`)}` : String(x.c))).join(" ");
  }
  function drawDocket(c: CanvasRenderingContext2D): void {
    const P = api.P, bw = Math.min(w - 16, 460), bx = (w - bw) / 2;
    P.body(c, bx, boardY, bw, boardH, { role: "panel", r: 10 });
    P.textFit(c, docket(), w / 2, boardY + boardH / 2, bw - 20, boardH - 8, { size: 24, role: "ink", weight: 800, font: build && FORMS[p.ctx] !== "named" && FORMS[p.ctx] !== "intl" ? "mono" : undefined });
  }
  /** the bridge's reading after a run: what the truck holds, written out (never shown before the child commits) */
  function drawBridge(c: CanvasRenderingContext2D, text: string, end: boolean): void {
    const P = api.P, s = st(), bw = Math.min(w - 16, 300), bx = (w - bw) / 2;
    P.body(c, bx, bridgeY, bw, 44, { role: "panel", r: 8, state: end && !s.done ? "look" : "idle" });
    if (end) P.textFit(c, text, w / 2, bridgeY + 22, bw - 56, 40, { size: 24, role: "ink", weight: 800, font: "mono" });
    else P.stroke(c, [[bx + 16, bridgeY + 30], [bx + bw - 16, bridgeY + 30]], { role: "ink3", width: 2, dash: [6, 6] });
    if (end && s.done) P.tick(c, bx + bw - 22, bridgeY + 22, 18, 1);
  }
  /** yard/build: one row per place, biggest on top (two halves side by side on a short tray); − / + and nine crate slots
   *  per row; places from 10^4 up as powers; at the third look only the ones rack is named (the places are counted from it) */
  function drawYardTruck(c: CanvasRenderingContext2D, end: boolean): void {
    const P = api.P, s = st(), wantDigits = placesOf(want(p), racks), half = Math.ceil(racks / 2), gap = 8;
    const rw = split ? (rackW - gap) / 2 : rackW, rows = split ? half : racks, labW = split ? 40 : 60;
    P.body(c, rackX - 4, rackY - 4, rackW + 8, rows * rowH + 4, { role: "panel", r: 10, state: end && !s.done ? "look" : "idle" });
    for (const fx of [0.2, 0.8]) P.circle(c, rackX + rackW * fx, rackY + rows * rowH + 8, 8, { role: "ink2", fill: true });
    if (split) P.stroke(c, [[rackX + rw + gap / 2, rackY + 2], [rackX + rw + gap / 2, rackY + rows * rowH - 6]], { role: "ink3", width: 1 });
    for (let k = 0; k < racks; k++) {
      const place = racks - 1 - k, col = split && k >= half ? 1 : 0, r = split ? k % half : k;
      const x = rackX + col * (rw + gap), y = rackY + r * rowH, cy = y + rowH / 2, n = s.crates[place];
      if (p.face < 3 || place === 0) P.text(c, placeLabel(place), x + labW / 2, cy, { size: 16, role: "ink2", weight: 700, font: "mono", maxW: labW - 2 });
      // a short tray (two halves side by side): no separate + button. The whole rack past "−" is the add target (a crate
      // goes onto the rack the finger lands on), so the crates get the width a + button took: two rows of five and four,
      // each crate about 16 x 17 at 360 px, where three by three gave 12 x 11. Every target stays at least 44 x 44.
      if (!s.done) {
        api.target(`rack-${place}-take`, x + labW, y + 1, 44, 44);
        if (split) api.target(`rack-${place}-add`, x + labW + 44, y + 1, rw - labW - 44, 44);
        else api.target(`rack-${place}-add`, x + rw - 44, y + 1, 44, 44);
      }
      P.body(c, x + labW + 2, y + 4, 40, 38, { role: "panel", r: 8 });
      P.text(c, "−", x + labW + 22, cy, { size: 22, role: n > 0 ? "ink" : "ink3", weight: 800 });
      if (split) P.body(c, x + labW + 46, y + 4, rw - labW - 48, 38, { role: "panel", r: 8, lift: 0 });
      else { P.body(c, x + rw - 42, y + 4, 40, 38, { role: "panel", r: 8 }); P.text(c, "+", x + rw - 22, cy, { size: 22, role: n < RACK ? "ink" : "ink3", weight: 800 }); }
      // the slots: nine in a line, or (a narrow half) five over four
      const sx0 = x + labW + (split ? 50 : 46), sw = split ? rw - labW - 56 : rw - labW - 92;
      const grid = split || sw / RACK < 9, cw = grid ? sw / 5 : sw / RACK, ch = grid ? (rowH - 10) / 2 : rowH - 18;
      for (let i = 0; i < RACK; i++) {
        const cx0 = sx0 + (grid ? (i % 5) * cw : i * cw), cy0 = grid ? y + 5 + (1 - Math.floor(i / 5)) * ch : y + 9;
        if (i < n) P.body(c, cx0 + 1, cy0 + 1, cw - 2, ch - 2, { role: placeRole(place), r: 2, seed: place * 10 + i });
        else if (!grid) P.stroke(c, [[cx0 + 1, y + rowH - 9], [cx0 + cw - 1, y + rowH - 9]], { role: "ink3", width: 1.5 });
      }
      if (grid && n === 0) P.stroke(c, [[sx0 + 1, y + rowH - 6], [sx0 + sw - 1, y + rowH - 6]], { role: "ink3", width: 1.5 });
      if (end && !s.done && n !== wantDigits[place]) P.magnifier(c, sx0 + sw - 8, y + 10, grid ? 10 : 16);
    }
  }
  function drawYard(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), end = shownEnd();
    drawDocket(c);
    if (build) { drawYardTruck(c, end); drawBridge(c, indianCommas(valueOf(s.crates)), end); return; }
    // commas: one column per place, biggest on the left as the number is written; the digits under the crates
    const right = indianPosts(racks);
    for (let k0 = 0; k0 < racks; k0++) {
      const place = racks - 1 - k0, x = stripX + k0 * colK, n = s.crates[place];
      P.body(c, x + 2, stripY, colK - 4, RACK * CRATE_H + 8, { role: "panel", r: 6 });
      for (let k = 0; k < n; k++) P.body(c, x + 6, stripY + 4 + (RACK - 1 - k) * CRATE_H, colK - 12, CRATE_H - 2, { role: placeRole(place), r: 2, seed: place * 10 + k });
      P.text(c, String(n), x + colK / 2, digitY, { size: 24, role: "ink", weight: 800, font: "mono" });
      if (p.face === 1) P.text(c, placeLabel(place), x + colK / 2, digitY + 28, { size: 16, role: "ink3", weight: 600, font: "mono", maxW: colK - 2 });
    }
    // the gaps: a post where the child set one, a faint slot elsewhere; after a missed reading a magnifier at a wrong gap
    for (let at = 1; at < racks; at++) {
      const gx0 = stripX + (racks - at) * colK, set = s.posts.includes(at), tw = Math.max(44, colK);
      if (!s.done) api.target(`post-${at}`, gx0 - tw / 2, digitY - 26, tw, 52);
      if (set) P.text(c, ",", gx0, digitY + 6, { size: 30, role: "you", weight: 900, font: "mono" });
      else P.circle(c, gx0, digitY + 14, 2.5, { role: "ink3", fill: true });
      if (end && !s.done && set !== right.includes(at)) P.magnifier(c, gx0, digitY + 16, 14);
    }
    drawBridge(c, withPosts(p.a, s.posts), end);
  }
  function draw(c: CanvasRenderingContext2D): void {
    if (yard) drawYard(c);
    else if (field) drawField(c);
    else if (pack) drawPack(c);
    else drawStory(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("guna.again");
    if (story || p.goal === "each") return W(`guna.goal.${p.goal}${p.ctx}`);
    if (yard) return W(build ? "guna.goal.build" : "guna.goal.commas");
    if (p.goal === "area" && cols) return W("guna.goal.big");
    return W(`guna.goal.${p.goal}`);
  }
  // no readout of the load, the shares or the answer: the crates and vehicles ARE them
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (story) {
      const top = p.goal === "left" ? p.a : STORY_MAX, set = (n: number) => { const v = clamp(n, 0, top); if (v !== s.n) act({ kind: "count", n: v }); };
      out.push({ id: "c-10", label: "− 10", aria: "ten less", kind: "pad", group: "count", disabled: s.n <= 0, onPress: () => set(s.n - 10) });
      out.push({ id: "c-1", label: "− 1", aria: "one less", kind: "pad", group: "count", disabled: s.n <= 0, onPress: () => set(s.n - 1) });
      out.push({ id: "c+1", label: "+ 1", aria: "one more", kind: "pad", group: "count", disabled: s.n >= top, onPress: () => set(s.n + 1) });
      out.push({ id: "c+10", label: "+ 10", aria: "ten more", kind: "pad", group: "count", disabled: s.n >= top, onPress: () => set(s.n + 10) });
      if (p.goal !== "left") ready = ready && s.n > 0;
    }
    if (p.goal === "area" || build) ready = ready && s.crates.some((x) => x > 0);
    if (commas) ready = ready && s.posts.length > 0;
    if (rounding) ready = ready && !!s.ra && !!s.rb && s.crates.some((x) => x > 0);
    if (p.goal === "check") ready = ready && s.marks.every((m) => m > 0);
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const runKey = field || build ? "guna.drive" : commas ? "guna.read" : p.goal === "share" ? "guna.send" : "guna.go";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
