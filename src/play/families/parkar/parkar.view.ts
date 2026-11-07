// Parkar · the 2D view (round 7, ruler-and-compass constructions; classes 6-7). Nothing here runs on a clock and nothing is
// dragged into place: a spot exists only where tool marks cross. The board is a page in cm (y up); the tools act on it:
//   compass     open it on its ruler (drag the pencil leg along the ruler, it clicks to the cm marks, or ± 1 cm), then tap a
//               spot: an arc is swung round it at that opening
//   protractor  tap a vertex: the protractor sits on it, its zero on the vertex's arm; turn its pointer (drag round it or
//               ± 1° / ± 10°), then draw the ray
//   set-square  tap the spot its edge must pass through, then tap the line to lay it along (or the page's edge)
//   ruler       tap two spots: the ruler joins them
// Every crossing of two marks shows a small ring: tap it to pin a spot there. The run only shows what the law has
// already answered: a tracing laid over the triangle, the sticks hinged, a spot walked along the line with a string to each
// end, the halves of the angle measured, the corner of a square at the foot. After a missed run only a magnifier marks
// what is not as it should be; never the key.
import type { Moment, ParkarAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { boardOf, crossings, geoms, spot, TOOLS, TRI_GOALS, type Geo, type LineG, type ParkarParams, type ParkarState, type Tool, type XY } from "./parkar.logic.ts";

const SWEEP = 1.4;   // s a run takes on screen (cosmetic: the law has already answered)

export const makeParkarView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<ParkarParams, ParkarState, ParkarAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, B = boardOf(p), tools = TOOLS[p.goal], n = p.n;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let w = 360, h = 480;
  // the board's frame (px per cm, the origin) and the compass's ruler
  let s = 30, ox = 0, oy = 0, cardY = 6, cardH = 0, bx0 = 0, by0 = 0, bx1 = 0, by1 = 0;
  let rx0 = 20, rpc = 24, ry = 0, rh = 40;
  let tool: Tool = tools[0];
  let sel: string | null = null;            // the spot picked first (set-square / ruler)
  let pv: string | null = null;             // the vertex the protractor sits on
  let pd = 60;                              // the protractor's pointer (degrees from the arm)
  let drag: null | { kind: "open"; r: number } | { kind: "turn" } = null;
  let runAt: number | null = null;   // api.t when the last run started on screen (null: no run shown)
  const hasCompass = tools.includes("compass");

  const X = (x: number) => ox + x * s, Y = (y: number) => oy - y * s;
  const toPx = (q: XY): XY => [X(q[0]), Y(q[1])];
  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    cardH = 30; cardY = 6;
    rh = hasCompass ? 52 : 0;
    ry = h - rh - 10;
    rpc = Math.min((w - 48) / (p.max + 0.6), 40); rx0 = (w - rpc * p.max) / 2;
    bx0 = 8; bx1 = w - 8; by0 = cardY + cardH + 8; by1 = (hasCompass ? ry - 18 : h - 8);
    const pts = [...Object.values(B.pts), ...B.want, ...B.extent];
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = 34, padY = 30;
    s = Math.min((bx1 - bx0 - 2 * padX) / Math.max(1, maxX - minX), (by1 - by0 - 2 * padY) / Math.max(1, maxY - minY), 60);
    ox = (bx0 + bx1) / 2 - ((minX + maxX) / 2) * s;
    oy = (by0 + by1) / 2 + ((minY + maxY) / 2) * s;
  }
  const act = (a: ParkarAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as ParkarAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "pin") api.sfx("land");
    else if (last.kind === "open") api.sfx("tick");
    else api.sfx("tap");
    if (!st().ended) runAt = null;
    void ms;
    api.invalidate(); deps.changed();
  }
  const runK = () => (runAt === null ? 0 : clamp((api.t - runAt) / SWEEP, 0, 1));
  const shownEnd = () => st().ended && runK() >= 1;
  let announced: number | null = null;
  function update(): void {
    if (runAt !== null && runK() < 1) api.invalidate();
    if (runAt !== null && runK() >= 1 && announced !== runAt) {
      announced = runAt;
      if (st().done) { api.sfx("good"); api.fx.burst(w / 2, h / 2, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed();
    }
  }
  const busy = () => !!drag || (runAt !== null && runK() < 1);
  const opening = () => (drag?.kind === "open" ? drag.r : st().r);

  // ── what can be touched ──
  const allSpots = (): [string, XY][] => [...B.ids.map((id) => [id, B.pts[id]] as [string, XY]), ...st().pins.map((q) => [q.id, [q.x, q.y]] as [string, XY])];
  const inBoard = (x: number, y: number) => x >= bx0 + 4 && x <= bx1 - 4 && y >= by0 + 4 && y <= by1 - 4;
  /** every crossing of two marks not already a spot, on the board: [a, b, k, px] */
  function rings(): [number, number, number, XY][] {
    const G = geoms(p, st()), out: [number, number, number, XY][] = [], spots = allSpots();
    for (let a = 0; a < G.length; a++) for (let b = a + 1; b < G.length; b++) crossings(G[a], G[b]).forEach((q, k) => {
      if (spots.some(([, xy]) => Math.hypot(xy[0] - q[0], xy[1] - q[1]) < 1e-4)) return;
      const px = toPx(q);
      if (inBoard(px[0], px[1])) out.push([a, b, k, px]);
    });
    return out;
  }
  /** the straight mark nearest (x, y) within 18 px (the set-square is laid along it) */
  function lineNear(x: number, y: number): number {
    const G = geoms(p, st());
    let best = -1, bd = 18;
    G.forEach((g, i) => {
      if (g.k !== "line") return;
      const px = toPx(g.p), t = (x - px[0]) * g.d[0] - (y - px[1]) * g.d[1];
      const tc = clamp(t / s, Math.max(g.lo, -40), Math.min(g.hi, 40)) * s;
      const qx = px[0] + g.d[0] * tc, qy = px[1] - g.d[1] * tc, d = Math.hypot(x - qx, y - qy);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  const armDir = (v: string) => B.arms[v];
  const degAt = (v: string, x: number, y: number) => {
    const a = armDir(v), q = toPx(spot(p, st(), v)!), ang = (Math.atan2(-(y - q[1]), x - q[0]) * 180) / Math.PI;
    let d = (ang - a.zero) * a.sense; d = ((d % 360) + 360) % 360;
    return clamp(Math.round(d > 270 ? 0 : d), 1, 179);
  };

  function pointer(kind: PointerKind, x: number, y: number): void {
    const S = st();
    if (S.done) return;
    if (kind === "down") {
      if (hasCompass && y > ry - 26 && y < ry + rh + 8 && x > rx0 - 20 && x < rx0 + rpc * p.max + 24) {
        drag = { kind: "open", r: clamp(Math.round((x - rx0) / rpc), 1, p.max) }; ctl.finger(true); api.sfx("select"); api.invalidate(); return;
      }
      const id = api.hit(x, y);
      if (id?.startsWith("x:")) { const [a, b, k] = id.slice(2).split(",").map(Number); act({ kind: "pin", a, b, k }); return; }
      if (id === "protractor" && pv) { drag = { kind: "turn" }; pd = degAt(pv, x, y); ctl.finger(true); api.invalidate(); return; }
      // the set-square, a spot picked: a tap on a line lays it along that line (unless the tap is right on a spot)
      if (tool === "square" && sel) {
        const on = lineNear(x, y), q = id?.startsWith("s:") ? toPx(spot(p, S, id.slice(2))!) : null;
        if (on >= 0 && (!q || Math.hypot(q[0] - x, q[1] - y) > 12)) { const at = sel; sel = null; act({ kind: "square", at, on }); return; }
      }
      if (id?.startsWith("s:")) {
        const sp = id.slice(2);
        if (tool === "compass") { if (!S.r) api.sfx("refuse"); else act({ kind: "arc", at: sp }); }
        else if (tool === "protractor") { if (armDir(sp)) { pv = pv === sp ? null : sp; api.sfx("select"); } else api.sfx("refuse"); }
        else if (tool === "ruler") { if (sel && sel !== sp) { const a = sel; sel = null; act({ kind: "join", p: a, q: sp }); } else { sel = sel === sp ? null : sp; api.sfx("select"); } }
        else if (tool === "square") { sel = sel === sp ? null : sp; api.sfx("select"); }
        api.invalidate(); deps.changed(); return;
      }
    } else if (kind === "move" && drag) {
      if (drag.kind === "open") drag.r = clamp(Math.round((x - rx0) / rpc), 1, p.max);
      else if (pv) pd = degAt(pv, x, y);
      api.invalidate(); return;
    } else if ((kind === "up" || kind === "cancel") && drag) {
      const d0 = drag; drag = null; ctl.finger(false);
      if (kind === "up" && d0.kind === "open" && d0.r !== S.r) act({ kind: "open", r: d0.r });
      api.invalidate(); deps.changed(); return;
    }
  }

  // ── drawing ──
  function lineEnds(g: LineG): [XY, XY] {
    const lo = Number.isFinite(g.lo) ? g.lo : -60, hi = Number.isFinite(g.hi) ? g.hi : 60;
    return [toPx([g.p[0] + g.d[0] * lo, g.p[1] + g.d[1] * lo]), toPx([g.p[0] + g.d[0] * hi, g.p[1] + g.d[1] * hi])];
  }
  function drawGeo(c: CanvasRenderingContext2D, g: Geo, role: "q1" | "q2" | "q3" | "q4" | "ink" | "ink2" | "ink3", width: number, dash?: number[]): void {
    if (g.k === "circle") api.P.circle(c, X(g.c[0]), Y(g.c[1]), g.r * s, { role, width });
    else api.P.stroke(c, lineEnds(g), { role, width, dash });
  }
  function label(c: CanvasRenderingContext2D, id: string, q: XY): void {
    // the label sits away from the board's middle
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2, px = toPx(q), dx = px[0] - cx, dy = px[1] - cy, L = Math.hypot(dx, dy) || 1;
    api.P.text(c, id, clamp(px[0] + (dx / L) * 18, bx0 + 10, bx1 - 10), clamp(px[1] + (dy / L) * 18, by0 + 10, by1 - 10), { size: 18, role: "ink", weight: 800 });
  }
  function house(c: CanvasRenderingContext2D, x: number, y: number): void {
    const P = api.P;
    P.body(c, x - 11, y - 8, 22, 16, { role: "q2", r: 2 });
    P.fillPath(c, (g) => { g.beginPath(); g.moveTo(x - 15, y - 8); g.lineTo(x, y - 22); g.lineTo(x + 15, y - 8); g.closePath(); }, "clay", { outline: "ink2", width: 1.2 });
  }
  function card(c: CanvasRenderingContext2D): void {
    const P = api.P, parts: string[] = [];
    const L = (k: string, v: number) => parts.push(`${k} = ${v} cm`), D = (k: string, v: number) => parts.push(`∠${k} = ${v}°`);
    switch (p.goal) {
      case "sss": L("AB", n[2]); L("BC", n[0]); L("CA", n[1]); break;
      case "sas": L("AB", n[1]); L("CA", n[0]); D("A", n[2]); break;
      case "asa": L("AB", n[0]); D("A", n[1]); D("B", n[2]); break;
      case "rhs": L("AB", n[1]); D("B", 90); L("CA", n[0]); break;
      case "long": case "short": L("AB", n[1]); L("CA", n[0]); parts.push(`BC = ?`); break;
      case "ssa": L("AB", n[1]); D("A", n[2]); L("BC", n[0]); break;
      case "perp": L("AB", n[0]); break;
      case "equi": L("AB", n[0]); break;
      case "angle": break;
      case "sixty": D("O", 60); break;
      case "alt": break;
    }
    if (!parts.length) return;
    const bw = Math.min(w - 16, 460), x = (w - bw) / 2;
    P.body(c, x, cardY, bw, cardH, { role: "panel", r: 8 });
    P.textFit(c, parts.join("   "), w / 2, cardY + cardH / 2, bw - 16, cardH, { size: 17, role: "ink", weight: 700, font: "mono" });
  }

  function drawRuler(c: CanvasRenderingContext2D): void {
    const P = api.P, r = opening();
    P.body(c, rx0 - 12, ry, rpc * p.max + 24, rh, { role: "panel", r: 4 });
    const every = rpc >= 30 ? 1 : 2;
    for (let k = 0; k <= p.max; k++) {
      const xx = rx0 + k * rpc;
      P.stroke(c, [[xx, ry], [xx, ry + rh * 0.34]], { role: "ink", width: 1.6 });
      if (k % every === 0) P.text(c, String(k), xx, ry + rh * 0.66, { size: 16, role: "ink", weight: 700, font: "mono" });
    }
    P.text(c, "cm", rx0 + rpc * p.max + 4, ry - 10, { size: 16, role: "ink2", weight: 700, font: "mono", align: "left" });
    // the compass: the needle at 0, the pencil at the opening, the hinge above
    const xn = rx0, xp = rx0 + r * rpc, top: XY = [(xn + xp) / 2, ry - 22 - Math.min(18, r * 2)];
    P.stroke(c, [[xn, ry], top, [xp, ry]], { role: drag?.kind === "open" ? "you" : "q4", width: 3 });
    P.circle(c, top[0], top[1], 5, { role: "q4", fill: true });
    if (!st().done) api.target("pencil", xp - 22, ry - 30, 44, 44);
    P.circle(c, xp, ry, 6, { role: drag?.kind === "open" ? "you" : "q4", fill: true });
  }

  function drawProtractor(c: CanvasRenderingContext2D): void {
    if (!pv || tool !== "protractor") return;
    const P = api.P, q = toPx(spot(p, st(), pv)!), a = armDir(pv), R = clamp(s * 2.6, 72, 100);
    const dir = (d: number): XY => { const t = ((a.zero + a.sense * d) * Math.PI) / 180; return [Math.cos(t), -Math.sin(t)]; };
    const arc: XY[] = []; for (let d = 0; d <= 180; d += 6) { const u = dir(d); arc.push([q[0] + u[0] * R, q[1] + u[1] * R]); }
    P.stroke(c, [...arc, arc[0]], { role: "q3", width: 2, alpha: 0.9 });
    for (let d = 0; d <= 180; d += 10) { const u = dir(d), k = d % 30 === 0 ? 12 : 6; P.stroke(c, [[q[0] + u[0] * R, q[1] + u[1] * R], [q[0] + u[0] * (R - k), q[1] + u[1] * (R - k)]], { role: "ink2", width: 1.2 }); }
    for (let d = 0; d <= 180; d += 30) { const u = dir(d); P.text(c, String(d), q[0] + u[0] * (R + 16), q[1] + u[1] * (R + 16) - (d % 180 === 0 ? 10 : 0), { size: 16, role: "ink2", weight: 700, font: "mono" }); }
    const u = dir(pd);
    P.stroke(c, [q, [q[0] + u[0] * (R + 18), q[1] + u[1] * (R + 18)]], { role: "you", width: 2.5 });
    P.chip(c, `${pd}°`, q[0] + u[0] * R * 0.55, q[1] + u[1] * R * 0.55, { size: 16, role: "ink" });
    if (!st().done) api.target("protractor", q[0] - R - 10, q[1] - R - 10, 2 * R + 20, 2 * R + 20);
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, S = st(), G = geoms(p, S), nG = B.lines.length + B.arcs.length, k = runK(), end = shownEnd();
    card(c);
    c.save(); c.beginPath(); c.rect(bx0, by0, bx1 - bx0, by1 - by0); c.clip();
    // given lines, given arcs, then the child's marks
    B.lines.forEach((l, i) => {
      if (l.role === "road") { P.stroke(c, lineEnds(l.g), { role: "q3", width: 16, alpha: 0.55 }); P.stroke(c, lineEnds(l.g), { role: "ink3", width: 1.5, dash: [10, 8] }); }
      else drawGeo(c, l.g, "ink", l.role === "side" ? 2.6 : 2);
      void i;
    });
    B.arcs.forEach((_, i) => drawGeo(c, G[B.lines.length + i], "q1", 1.6));
    S.marks.forEach((m, i) => {
      const g = G[nG + i];
      if (m.t === "arc") drawGeo(c, g, "q1", 1.6);
      else if (m.t === "ray") drawGeo(c, g, "q2", 2);
      else if (m.t === "sq") drawGeo(c, g, "q3", 2.4);
      else drawGeo(c, g, "ink2", 2, [8, 5]);
    });
    // the ruler joins a built triangle's vertex to A and B
    const last = S.pins[S.pins.length - 1];
    if (TRI_GOALS.includes(p.goal) && last) P.stroke(c, [toPx(B.pts.A), toPx([last.x, last.y]), toPx(B.pts.B)], { role: "ink", width: 2.6 });
    if (p.goal === "ssa") for (const q of S.pins) P.stroke(c, [toPx(B.pts.B), toPx([q.x, q.y])], { role: "ink", width: 2.2 });
    if (p.goal === "equi") { house(c, X(B.pts.A[0]), Y(B.pts.A[1])); house(c, X(B.pts.B[0]), Y(B.pts.B[1])); }
    // the run's showing
    if (S.ended && runAt !== null) drawRun(c, k, end);
    c.restore();
    // spots and their labels, the crossings to pin
    for (const [id, q] of allSpots()) {
      const px = toPx(q), given = B.ids.includes(id);
      P.circle(c, px[0], px[1], given ? 5 : 4.5, { role: sel === id || pv === id ? "you" : "ink", fill: true });
      if (given && !(p.goal === "equi" && (id === "A" || id === "B"))) label(c, id, q);
      if (given && p.goal === "equi") label(c, id, [q[0], q[1] - 0.9]);
      if (!S.done && inBoard(px[0], px[1])) api.target(`s:${id}`, px[0] - 22, px[1] - 22, 44, 44);
    }
    if (TRI_GOALS.includes(p.goal) && last) label(c, "C", [last.x, last.y]);
    if (!S.done) for (const [a, b, kk, px] of rings()) {
      P.circle(c, px[0], px[1], 7, { role: "q4", width: 2.2 });
      api.target(`x:${a},${b},${kk}`, clamp(px[0] - 22, bx0, bx1 - 44), clamp(px[1] - 22, by0, by1 - 44), 44, 44);
    }
    drawProtractor(c);
    if (hasCompass) drawRuler(c);
  }

  function drawRun(c: CanvasRenderingContext2D, k: number, end: boolean): void {
    const P = api.P, S = st(), last = S.pins[S.pins.length - 1];
    const tri = (C: XY, role: "q2" | "good") => P.stroke(c, [toPx(B.pts.A), toPx(C), toPx(B.pts.B)], { role, width: 4, alpha: 0.75, closed: true, dash: [10, 6] });
    if (TRI_GOALS.includes(p.goal)) {
      // the tracing slides in from above and settles on the triangle the card describes
      // a vertex pinned below AB: the tracing is turned over
      const C: XY = last && last.y < 0 ? [B.want[0][0], -B.want[0][1]] : B.want[0], dy = (1 - k) * 2.5 * Math.sign(C[1] || 1);
      P.stroke(c, [toPx([0, dy]), toPx([C[0], C[1] + dy]), toPx([B.pts.B[0], dy])], { role: "q2", width: 4, alpha: 0.7, closed: true, dash: [10, 6] });
      if (end && !S.done && last) P.magnifier(c, X(last.x), Y(last.y), 20);
      if (end && S.done) P.tick(c, X(C[0]) + 22, Y(C[1]) - 18, 24, 1);
      return;
    }
    if (p.goal === "ssa") {
      if (k > 0.3) for (const C of B.want) tri(C, "q2");
      if (end && !S.done) for (const C of B.want) if (!S.pins.some((q) => Math.hypot(q.x - C[0], q.y - C[1]) < 1e-4)) P.magnifier(c, X(C[0]), Y(C[1]), 20);
      if (end && S.done) P.tick(c, X(B.want[1][0]) + 22, Y(B.want[1][1]) - 18, 24, 1);
      return;
    }
    if (p.goal === "long" || p.goal === "short") {
      // the sticks hinged at A and B: where the two arcs cross they close; touching, they lie flat; else a gap
      let r = 0; for (const m of S.marks) if (m.t === "arc" && m.c === "B") r = m.r;
      const bb = n[0], c0 = n[1];
      const xs = crossings({ k: "circle", c: [0, 0], r: bb }, { k: "circle", c: [c0, 0], r });
      const C = xs.length ? xs[xs.length - 1] : null;
      if (C && k > 0.2) P.stroke(c, [toPx(B.pts.A), toPx(C), toPx(B.pts.B)], { role: "q2", width: 5, alpha: 0.85 });
      else if (k > 0.2) {
        // no crossing: each stick pointing at the other end, the gap between them
        const ea: XY = r > bb + c0 ? [-bb, 0] : [bb, 0], eb: XY = r > bb + c0 ? [c0 - r, 0] : [c0 - r, 0];
        P.stroke(c, [toPx(B.pts.A), toPx(ea)], { role: "q2", width: 5, alpha: 0.85 });
        P.stroke(c, [toPx(B.pts.B), toPx(eb)], { role: "q2", width: 5, alpha: 0.85 });
      }
      if (end && !S.done) P.magnifier(c, C ? X(C[0]) : X((B.pts.A[0] + B.pts.B[0]) / 2), C ? Y(C[1]) - 6 : Y(0) - 26, 20);
      if (end && S.done && C) P.tick(c, X(C[0]) + 22, Y(C[1]) - 18, 24, 1);
      return;
    }
    const G = geoms(p, S), nG = B.lines.length + B.arcs.length;
    const lastLine = (() => { for (let i = S.marks.length - 1; i >= 0; i--) { const t = S.marks[i].t; if (t === "join" || (p.goal === "alt" && t === "sq")) return G[nG + i] as LineG; } return null; })();
    if (p.goal === "perp" || p.goal === "equi") {
      // a spot walks along the line (perp) or sits at the tank (equi) with a string to each house / end
      let T: XY | null = null;
      if (p.goal === "equi" && last) T = [last.x, last.y];
      // perp: the spot walks along the line from below AB to the far crossing's side, and stops past the middle
      if (p.goal === "perp" && lastLine) {
        const mid: XY = [(B.pts.A[0] + B.pts.B[0]) / 2, (B.pts.A[1] + B.pts.B[1]) / 2], t0 = (mid[0] - lastLine.p[0]) * lastLine.d[0] + (mid[1] - lastLine.p[1]) * lastLine.d[1];
        const t = t0 + (k - 0.35) * 0.55 * n[0] * 2;
        T = [lastLine.p[0] + lastLine.d[0] * t, lastLine.p[1] + lastLine.d[1] * t];
      }
      if (!T) return;
      for (const id of ["A", "B"]) {
        const q = B.pts[id], d = Math.hypot(q[0] - T[0], q[1] - T[1]);
        P.stroke(c, [toPx(T), toPx(q)], { role: "q2", width: 2.5 });
        // perp: the length on its string; equi: above each house's roof (the two pipes can run close together)
        const m = p.goal === "equi" ? [X(q[0]), Y(q[1]) - 40] : toPx([T[0] + (q[0] - T[0]) * 0.62, T[1] + (q[1] - T[1]) * 0.62]);
        if (k > 0.1) P.chip(c, `${d.toFixed(1)} cm`, m[0], m[1], { size: 16, role: "ink" });
      }
      P.circle(c, X(T[0]), Y(T[1]), 7, { role: "q2", fill: true });
      if (end && !S.done) P.magnifier(c, X(T[0]) + 24, Y(T[1]) - 20, 18);
      if (end && S.done) P.tick(c, X(T[0]) + 26, Y(T[1]) - 22, 24, 1);
      return;
    }
    if (!lastLine) return;
    if (p.goal === "angle" || p.goal === "sixty") {
      // measure: the angle from the arm (OA) to the line, and (angle) from the line to OB
      const O = B.pts.O, d0 = (n[p.goal === "angle" ? 1 : 0] * Math.PI) / 180;
      let t = Math.atan2(lastLine.d[1], lastLine.d[0]);
      if (Math.cos(t - d0 - (p.goal === "angle" ? (n[0] * Math.PI) / 360 : Math.PI / 3)) < 0) t += Math.PI;
      const a1 = (((t - d0) * 180) / Math.PI + 720) % 360, r = Math.min(2.2, 6);
      const mid = (ang: number, rr: number): XY => [O[0] + Math.cos(ang) * rr, O[1] + Math.sin(ang) * rr];
      const arcPts = (from: number, to: number, rr: number) => { const out: XY[] = []; for (let i = 0; i <= 20; i++) out.push(toPx(mid(from + ((to - from) * i) / 20, rr))); return out; };
      if (k > 0.2) {
        P.stroke(c, arcPts(d0, t, r), { role: "q2", width: 3 });
        const lp = toPx(mid((d0 + t) / 2, r + 1.1));
        P.chip(c, `${Math.round(a1)}°`, lp[0], lp[1], { size: 16, role: "ink" });
        if (p.goal === "angle") {
          const t2 = d0 + (n[0] * Math.PI) / 180, a2 = n[0] - a1;
          P.stroke(c, arcPts(t, t2, r + 0.4), { role: "q4", width: 3 });
          const lq = toPx(mid((t + t2) / 2, r + 1.6));
          P.chip(c, `${Math.round(a2)}°`, lq[0], lq[1], { size: 16, role: "ink" });
        }
      }
      if (end && !S.done) P.magnifier(c, X(O[0]) + 30, Y(O[1]) - 30, 18);
      if (end && S.done) P.tick(c, X(O[0]) + 34, Y(O[1]) - 40, 24, 1);
      return;
    }
    // alt: where the line meets BC (extended), the angle there, a square's corner when it is 90°
    const BC: LineG = { k: "line", p: B.pts.B, d: [(B.pts.C[0] - B.pts.B[0]) / n[0], (B.pts.C[1] - B.pts.B[1]) / n[0]], lo: -Infinity, hi: Infinity };
    const F = crossings(lastLine, BC)[0];
    if (!F) return;
    const tF = (F[0] - B.pts.B[0]) * BC.d[0] + (F[1] - B.pts.B[1]) * BC.d[1];
    if (tF < 0 || tF > n[0]) P.stroke(c, [toPx(tF < 0 ? B.pts.B : B.pts.C), toPx(F)], { role: "ink3", width: 2, dash: [5, 5] });
    P.stroke(c, [toPx(B.pts.A), toPx(F)], { role: "q2", width: 3.5 });
    const cos = Math.abs(lastLine.d[0] * BC.d[0] + lastLine.d[1] * BC.d[1]), ang = Math.round((Math.acos(Math.min(1, cos)) * 180) / Math.PI);
    if (k > 0.2) {
      const u = BC.d, v: XY = lastLine.d[0] * (B.pts.A[0] - F[0]) + lastLine.d[1] * (B.pts.A[1] - F[1]) > 0 ? lastLine.d : [-lastLine.d[0], -lastLine.d[1]], e = 0.45;
      if (ang === 90) P.stroke(c, [toPx([F[0] + u[0] * e, F[1] + u[1] * e]), toPx([F[0] + u[0] * e + v[0] * e, F[1] + u[1] * e + v[1] * e]), toPx([F[0] + v[0] * e, F[1] + v[1] * e])], { role: "q2", width: 2.5 });
      const lp = toPx([F[0] + v[0] * 1.1 + u[0] * 1.1, F[1] + v[1] * 1.1 + u[1] * 1.1]);
      P.chip(c, `${ang}°`, lp[0], lp[1], { size: 16, role: "ink" });
    }
    if (end && !S.done) P.magnifier(c, X(F[0]) - 24, Y(F[1]) + 20, 18);
    if (end && S.done) P.tick(c, X(F[0]) + 26, Y(F[1]) - 22, 24, 1);
  }

  function goal(): string {
    const S = st();
    if (S.ended && !S.done && runK() >= 1) return W("parkar.again");
    return W(`parkar.goal.${p.goal}`);
  }
  // no readout beyond the instruments themselves: reading them IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const S = st(); if (S.done) return [];
    const out: ControlSpec[] = [];
    if (tools.length > 1) for (const t of tools) out.push({ id: `tool-${t}`, label: W(`parkar.${t}`), kind: "choice", group: "tools", pressed: tool === t, onPress: () => { tool = t; sel = null; if (t !== "protractor") pv = null; api.invalidate(); deps.changed(); } });
    if (hasCompass && tool === "compass") {
      out.push({ id: "less", label: "− 1 cm", aria: "close the compass by one centimetre", kind: "pad", group: "set", disabled: S.r <= 1, onPress: () => act({ kind: "open", r: Math.max(1, S.r - 1) }) });
      out.push({ id: "more", label: "+ 1 cm", aria: "open the compass by one centimetre", kind: "pad", group: "set", disabled: S.r >= p.max, onPress: () => act({ kind: "open", r: S.r + 1 }) });
    }
    if (tool === "protractor" && pv) {
      const turn = (d: number) => { pd = clamp(pd + d, 1, 179); api.invalidate(); deps.changed(); };
      out.push({ id: "deg-10", label: "− 10°", kind: "pad", group: "set", onPress: () => turn(-10) });
      out.push({ id: "deg-1", label: "− 1°", kind: "pad", group: "set", onPress: () => turn(-1) });
      out.push({ id: "deg+1", label: "+ 1°", kind: "pad", group: "set", onPress: () => turn(1) });
      out.push({ id: "deg+10", label: "+ 10°", kind: "pad", group: "set", onPress: () => turn(10) });
      out.push({ id: "ray", label: W("parkar.ray"), kind: "secondary", group: "draw", onPress: () => { const at = pv!; act({ kind: "ray", at, deg: pd }); } });
    }
    if (tool === "square" && sel && p.goal === "alt") out.push({ id: "page", label: W("parkar.page"), kind: "secondary", group: "draw", onPress: () => { const at = sel!; sel = null; act({ kind: "square", at, on: -1 }); } });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const g = p.goal, ready = !S.ended && (TRI_GOALS.includes(g) || g === "ssa" || g === "equi" ? S.pins.length > 0
      : g === "long" || g === "short" ? S.marks.some((m) => m.t === "arc" && m.c === "B")
      : g === "alt" ? S.marks.some((m) => m.t === "join" || m.t === "sq") : S.marks.some((m) => m.t === "join"));
    const runKey = TRI_GOALS.includes(g) || g === "ssa" ? "parkar.trace" : g === "long" || g === "short" ? "parkar.hinge" : g === "perp" || g === "equi" ? "parkar.walk" : "parkar.measure";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
