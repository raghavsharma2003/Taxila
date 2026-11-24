// Stambh · tally, the 2D view (round 8). Nothing here runs on a clock: the scene moves on only when the child marks.
//   keep  the scene strip on top: the thing passing now stands in the middle (the next one waits faint behind it), and the
//         two big buttons sit at the strip's right: "|" a standing line, "╱" the line across. Below, one row per kind: its
//         picture and name, its tally, its total cell. Tap a row to pick it, then a button: one stroke there for the thing
//         passing, which then moves on. When the scene has passed, the buttons go; tap a total cell and write its number
//         on the pad. Strokes lie as she makes them (a gap only after her own line across).
//   read  one row of tallies, big; the answer cell under it; the pad.
// At a check the law regroups every row by fives and shows it: each group of five standing lines (or a line across that
// closes no four) gets a dashed ring and a cross mark, never words. A read answer off the tally plays out on a number
// line: her number first, then (later) the tally's own place, unlabelled, with one hop per unit between. No live total, no
// count of strokes on screen: what a row holds is hers to count.
import type { Moment, StambhAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { groupsOf, tallyFlow, type TallyParams, type TallyState } from "./tally.logic.ts";

const ROLES: Role[] = ["q1", "q2", "q3"];

export const makeTallyView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<TallyParams, TallyState, StambhAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, keep = p.goal === "keep", n = p.cats.length;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const catName = (r: number) => W(`stambh.cat.${p.cats[r]}`);
  let w = 300, h = 440;
  // geometry
  let stripY = 34, stripH = 96, btn = 64, btnX = 0, sceneW = 160, headY = 140, rowsY = 160, rowH = 80, gut = 90, cellW = 64, tallyX = 100, tallyW = 120;
  let readTop = 60, readH = 160, cellY = 240, lineY = 330;
  let sel = keep ? -1 : 0;            // keep: the row picked for strokes (-1: none yet); the total cell picked
  let movedAt = -9, checkedAt = -1, checkedSnap: string | null = null;
  const st = () => ctl.state;
  const snap = (s: TallyState) => JSON.stringify([s.marks, s.totals]);

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (keep) {
      btn = api.young ? clamp(bh * 0.13, 64, 84) : clamp(bh * 0.11, 48, 72);
      stripY = 32; stripH = Math.max(btn + 16, clamp(bh * 0.2, 80, 132));
      btnX = w - 12 - 2 * btn - 10;
      sceneW = btnX - 16;
      gut = clamp(w * 0.3, 112, 200); cellW = clamp(w * 0.15, 58, 96);
      tallyX = gut + 8; tallyW = w - gut - cellW - 28;
      rows();
    } else {
      readTop = 64;
      cellW = clamp(w * 0.28, 96, 150);
      // the tally, the answer cell (60), room for her chip over the number line (56), the line and its 0 (34)
      readH = Math.max(72, Math.min(clamp(h * 0.4, 96, 260), h - readTop - 12 - 60 - 56 - 34));
      cellY = readTop + readH + 12;
      lineY = cellY + 60 + 56;
      tallyX = 16; tallyW = w - 32;
    }
  }
  /** keep: the table's rows under the strip; once the scene has passed the strip folds away and the rows take its room */
  function rows(): void {
    const top = sceneOver() ? stripY : stripY + stripH;
    headY = top + 14;
    rowsY = headY + 14;
    rowH = clamp((h - rowsY - 8) / n, 52, 160);
  }
  const act = (a: StambhAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as StambhAct | undefined;
    if (last?.kind === "mark") { if (refused) api.sfx("refuse"); else { api.sfx("drop"); movedAt = api.reduced ? -9 : api.t; } }
    if (last?.kind === "total") api.sfx(refused ? "refuse" : "tap");
    if (last?.kind === "undo") { checkedAt = -1; checkedSnap = null; api.sfx("tap"); }
    if (last?.kind === "check" && refused !== "scene_first" && refused !== "fill_first") { checkedAt = api.t; checkedSnap = snap(st()); }
    else if (last?.kind === "check") api.sfx("refuse");
    // the scene has passed: the first empty total cell is picked for the pad
    if (keep && st().at >= p.seq.length && (sel < 0 || st().totals[sel] !== null) && last?.kind === "mark") sel = Math.max(0, st().totals.findIndex((t) => t === null));
    for (const m of ms) {
      if (m.kind === "solved") {
        api.sfx("good");
        for (let r = 0; r < n; r++) { const [x, y] = cellCentre(r); api.fx.burst(x, y, { n: 10, color: api.P.color("good"), speed: 100, life: 0.6, size: 3, kind: "spark" }); }
      }
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") api.sfx("look");
    }
    api.invalidate(); deps.changed();
  }
  const cellCentre = (r: number): [number, number] => (keep ? [w - 12 - cellW / 2, rowsY + rowH * r + rowH / 2] : [w / 2, cellY + 32]);
  const sceneOver = () => keep && st().at >= p.seq.length;
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down" || st().done) return;
    const id = api.hit(x, y);
    if (!id) return;
    const r = Number(id.split("-")[1]);
    if (id.startsWith("row-") && !sceneOver()) { sel = r; api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if (id.startsWith("tot-") && (!keep || sceneOver())) { sel = r; api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if ((id === "btn-stand" || id === "btn-across") && sel >= 0 && !sceneOver()) act({ kind: "mark", row: sel, across: id === "btn-across" });
  }
  const busy = () => (api.t - movedAt < 0.5) || (checkedAt >= 0 && api.t - checkedAt < 1.6);
  const showCheck = () => checkedSnap !== null && checkedSnap === snap(st());

  // ── the things that pass: one simple shape per kind, in the row's hue ──
  function thing(c: CanvasRenderingContext2D, cat: string, cx: number, cy: number, s: number, role: Role, alpha = 1): void {
    const P = api.P, col = P.color(role);
    c.save(); c.globalAlpha *= alpha;
    c.fillStyle = col; c.strokeStyle = col; c.lineCap = "round"; c.lineJoin = "round";
    const r = s / 2;
    if (cat === "kaanch") { c.lineWidth = Math.max(2, s * 0.07); c.beginPath(); c.arc(cx, cy, r * 0.8, 0, Math.PI * 2); c.stroke(); }
    else if (cat === "kada") { c.lineWidth = Math.max(4, s * 0.2); c.beginPath(); c.arc(cx, cy, r * 0.68, 0, Math.PI * 2); c.stroke(); }
    else if (cat === "moti") { for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.beginPath(); c.arc(cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74, Math.max(1.6, s * 0.07), 0, Math.PI * 2); c.fill(); } }
    else if (cat === "car") {
      c.beginPath(); c.roundRect(cx - r * 0.95, cy - r * 0.15, r * 1.9, r * 0.55, r * 0.15); c.fill();
      c.beginPath(); c.moveTo(cx - r * 0.55, cy - r * 0.15); c.lineTo(cx - r * 0.3, cy - r * 0.55); c.lineTo(cx + r * 0.35, cy - r * 0.55); c.lineTo(cx + r * 0.6, cy - r * 0.15); c.closePath(); c.fill();
      wheels(c, cx, cy + r * 0.42, [-0.55, 0.55], r);
    } else if (cat === "bus") {
      c.beginPath(); c.roundRect(cx - r, cy - r * 0.6, r * 2, r * 1.0, r * 0.12); c.fill();
      c.fillStyle = P.color("panel"); for (let k = 0; k < 4; k++) c.fillRect(cx - r * 0.85 + k * r * 0.45, cy - r * 0.45, r * 0.32, r * 0.3);
      c.fillStyle = col; wheels(c, cx, cy + r * 0.44, [-0.6, 0.6], r);
    } else if (cat === "auto") {
      // the three-wheeler: a rounded nose, the open side, the canopy over it
      c.beginPath(); c.moveTo(cx - r * 0.8, cy + r * 0.3); c.lineTo(cx - r * 0.8, cy - r * 0.15); c.lineTo(cx + r * 0.35, cy - r * 0.15); c.quadraticCurveTo(cx + r * 0.8, cy - r * 0.1, cx + r * 0.8, cy + r * 0.3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(cx - r * 0.85, cy - r * 0.15); c.lineTo(cx - r * 0.8, cy - r * 0.7); c.quadraticCurveTo(cx - r * 0.1, cy - r * 0.85, cx + r * 0.35, cy - r * 0.7); c.lineTo(cx + r * 0.35, cy - r * 0.15); c.lineTo(cx + r * 0.2, cy - r * 0.15); c.lineTo(cx + r * 0.2, cy - r * 0.55); c.lineTo(cx - r * 0.65, cy - r * 0.55); c.lineTo(cx - r * 0.65, cy - r * 0.15); c.closePath(); c.fill();
      wheels(c, cx, cy + r * 0.42, [-0.5, 0.6], r);
    } else {
      // cycle: two wheels and the frame
      c.lineWidth = Math.max(2, s * 0.06);
      for (const dx of [-0.5, 0.5]) { c.beginPath(); c.arc(cx + dx * r, cy + r * 0.25, r * 0.38, 0, Math.PI * 2); c.stroke(); }
      c.beginPath(); c.moveTo(cx - r * 0.5, cy + r * 0.25); c.lineTo(cx - r * 0.05, cy - r * 0.3); c.lineTo(cx + r * 0.35, cy - r * 0.3); c.lineTo(cx + r * 0.5, cy + r * 0.25);
      c.moveTo(cx - r * 0.05, cy - r * 0.3); c.lineTo(cx, cy + r * 0.25); c.lineTo(cx + r * 0.35, cy - r * 0.3); c.moveTo(cx - r * 0.12, cy - r * 0.45); c.lineTo(cx + r * 0.05, cy - r * 0.45); c.stroke();
    }
    c.restore();
  }
  function wheels(c: CanvasRenderingContext2D, cx: number, cy: number, at: number[], r: number): void {
    c.save(); c.fillStyle = api.P.color("ink");
    for (const dx of at) { c.beginPath(); c.arc(cx + dx * r, cy, r * 0.2, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }

  /** a row's strokes in the box (x, y, bw, bh); grouped = the law's commit pass (rings on groups that are no bundle) */
  function drawTally(c: CanvasRenderingContext2D, marks: readonly boolean[], x: number, y: number, bw: number, bh: number, role: Role, grouped: boolean, ringK: number): void {
    const P = api.P, f = tallyFlow(marks, bw, bh, grouped, keep ? clamp(rowH * 0.42, 30, 56) : 56);
    const top = y + (bh - f.lineH * f.lines) / 2;
    const ly = (line: number) => top + f.lineH * line + f.lineH / 2;
    const width = clamp(f.sp * 0.32, 1.8, 4.5);
    for (const s of f.stand) P.stroke(c, [[x + s.x, ly(s.line) - f.sh / 2], [x + s.x, ly(s.line) + f.sh / 2]], { role, width });
    for (const a of f.across) P.stroke(c, [[x + a.x0, ly(a.line) + f.sh * 0.42], [x + a.x1, ly(a.line) - f.sh * 0.42]], { role, width: width + 0.5 });
    if (!grouped || ringK <= 0) return;
    // the commit pass: a dashed ring and a cross mark on every group that is no bundle (five standing, or a short close)
    for (const g of groupsOf(marks)) {
      if (g.kind !== "five" && g.kind !== "short") continue;
      const xs: number[] = [], lines = new Set<number>();
      for (const s of f.stand) if (s.i >= g.from && s.i < g.from + g.len) { xs.push(s.x); lines.add(s.line); }
      for (const a of f.across) if (a.i >= g.from && a.i < g.from + g.len) { xs.push(a.x0 + f.sp * 0.5, a.x1 - f.sp * 0.5); lines.add(a.line); }
      for (const line of lines) {
        const lx = xs.length ? Math.min(...xs) : 0, rx = xs.length ? Math.max(...xs) : 0;
        const cx = x + (lx + rx) / 2, cy = ly(line), rx2 = (rx - lx) / 2 + f.sp * 0.9, ry = f.sh / 2 + 5;
        const pts: [number, number][] = [];
        for (let k = 0; k <= 28; k++) { const a = (k / 28) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx2, cy + Math.sin(a) * ry]); }
        c.save(); c.globalAlpha = clamp(ringK, 0, 1);
        P.stroke(c, pts, { role: "look", width: 2, dash: [4, 3] });
        const mx = cx + rx2 - 2, my = cy - ry + 2, m = 5;
        P.stroke(c, [[mx - m, my - m], [mx + m, my + m]], { role: "look", width: 2.5 });
        P.stroke(c, [[mx + m, my - m], [mx - m, my + m]], { role: "look", width: 2.5 });
        c.restore();
      }
    }
  }
  /** a total cell: her number (or empty); picked = the pad writes here */
  function drawCell(c: CanvasRenderingContext2D, r: number, cx: number, cy: number, cw: number, ch: number, open: boolean, checked: boolean): void {
    const P = api.P, s = st(), v = s.totals[r];
    api.target(`tot-${r}`, cx - cw / 2, cy - ch / 2, cw, ch);
    const picked = open && !s.done && !checked && r === sel;
    P.body(c, cx - cw / 2, cy - ch / 2, cw, ch, { role: "panel", r: 10, state: open ? "idle" : "dim" });
    if (picked) P.stroke(c, [[cx - cw / 2 - 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy + ch / 2 + 3], [cx - cw / 2 - 3, cy + ch / 2 + 3]], { role: "you", width: 3, closed: true });
    if (v !== null) P.text(c, String(v), cx, cy + 1, { size: keep ? 22 : 30, role: "ink", font: "mono", weight: 700 });
    if (checked) {
      const ok = v === p.counts[r] && (!keep || (s.marks[r].length === p.counts[r] && s.marks[r].every((m, i) => m === (i % 5 === 4))));
      const k = clamp((api.t - checkedAt) / 0.4, 0, 1);
      if (ok) P.tick(c, cx + cw / 2 - 2, cy - ch / 2 - 2, 18, k);
      else P.stroke(c, [[cx - cw / 2 - 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy + ch / 2 + 3], [cx - cw / 2 - 3, cy + ch / 2 + 3]], { role: "look", width: 2.5, dash: [5, 4], closed: true });
    }
  }

  function drawKeep(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), checked = showCheck(), over = sceneOver();
    rows();
    // the scene strip: a counter (bangles) or a road (traffic); the thing passing now in the middle, the next one faint
    const groundY = stripY + stripH - 14;
    const size = clamp(stripH * 0.62, 44, 84), cy = groundY - size * 0.55, mid = sceneW / 2 + 6;
    const k = api.reduced ? 1 : clamp((api.t - movedAt) / 0.45, 0, 1);
    if (!over) {
      P.stroke(c, [[10, groundY], [sceneW, groundY]], { role: "ink3", width: 2 });
      if (p.ctx === "traffic") P.stroke(c, [[16, groundY - stripH * 0.42], [sceneW - 6, groundY - stripH * 0.42]], { role: "ink3", width: 1.5, dash: [10, 8], alpha: 0.5 });
      if (s.at > 0 && k < 1) { const r = p.seq[s.at - 1]; thing(c, p.cats[r], mid + (sceneW * 0.5) * k, cy, size, ROLES[r], 1 - k); }
      const r = p.seq[s.at];
      thing(c, p.cats[r], mid - size * 1.4 * (1 - k), cy, size, ROLES[r], 0.3 + 0.7 * k);
      if (s.at + 1 < p.seq.length) { const r2 = p.seq[s.at + 1]; thing(c, p.cats[r2], Math.max(size * 0.45, mid - size * 1.4), cy + size * 0.12, size * 0.7, ROLES[r2], 0.25 * k); }
      // the two buttons: a standing line, the line across
      const by = stripY + (stripH - btn) / 2 - 4, on = sel >= 0 && !s.done;
      for (const [id, x] of [["btn-stand", btnX], ["btn-across", btnX + btn + 10]] as const) {
        api.target(id, x, by, btn, btn);
        P.body(c, x, by, btn, btn, { role: "panel", r: 14, state: on ? "idle" : "dim" });
        const gx = x + btn / 2, gy = by + btn / 2, gh = btn * 0.27;
        if (id === "btn-stand") P.stroke(c, [[gx, gy - gh], [gx, gy + gh]], { role: "ink", width: 5 });
        else P.stroke(c, [[gx - gh * 0.85, gy + gh * 0.75], [gx + gh * 0.85, gy - gh * 0.75]], { role: "ink", width: 5 });
      }
    }
    // the table: the total column's name, then one row per kind
    P.text(c, W("stambh.total"), w - 12 - cellW / 2, headY, { size: 16, role: "ink2", weight: 700 });
    for (let r = 0; r < n; r++) {
      const y0 = rowsY + rowH * r, cy2 = y0 + rowH / 2;
      if (r > 0) P.stroke(c, [[10, y0], [w - 10, y0]], { role: "ink3", width: 1, alpha: 0.35 });
      if (!over) api.target(`row-${r}`, 0, y0, w - cellW - 20, rowH);
      if (!over && !s.done && r === sel) P.stroke(c, [[5, y0 + 6], [5, y0 + rowH - 6]], { role: "you", width: 5 });
      // its picture and its name side by side, as the scene shows it
      const is = w < 600 ? 28 : clamp(rowH * 0.36, 28, 44);
      thing(c, p.cats[r], 14 + is / 2, cy2, is, ROLES[r]);
      P.textFit(c, catName(r), (14 + is + 6 + gut) / 2, cy2, gut - is - 22, 22, { size: 17, role: "ink", weight: 700 });
      drawTally(c, s.marks[r], tallyX, y0 + 6, tallyW, rowH - 12, "ink", checked, checked ? (api.t - checkedAt) / 0.4 : 0);
      drawCell(c, r, w - 12 - cellW / 2, cy2, cellW, clamp(rowH - 22, 34, 56), over, checked);
    }
  }
  function drawRead(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), checked = showCheck();
    const is = 30;
    thing(c, p.cats[0], 16 + is / 2, 46, is, "q1");
    P.text(c, catName(0), 16 + is + 10, 46, { size: 18, role: "ink", weight: 700, align: "left", maxW: w - is - 48 });
    drawTally(c, s.marks[0], tallyX, readTop, tallyW, readH, "ink", false, 0);
    P.text(c, "=", w / 2 - cellW / 2 - 18, cellY + 32, { size: 26, role: "ink2", weight: 700 });
    drawCell(c, 0, w / 2, cellY + 32, cellW, 60, true, checked);
    if (checked && !s.done) numberLine(c, s.totals[0] ?? 0, p.counts[0]);
  }
  /** a read off the tally, played out: her number on a line, then the tally's own place (unlabelled), one hop per unit */
  function numberLine(c: CanvasRenderingContext2D, hers: number, truth: number): void {
    const P = api.P, x0 = 24, x1 = w - 24, top = Math.max(hers, truth), R = Math.ceil((top + 3) / 5) * 5, y = Math.min(lineY, h - 30);
    const X = (v: number) => x0 + ((x1 - x0) * v) / R;
    P.stroke(c, [[x0, y], [x1, y]], { role: "ink2", width: 2 });
    for (let v = 0; v <= R; v++) {
      const big = v % 5 === 0;
      if (big || (x1 - x0) / R >= 5) P.stroke(c, [[X(v), y - (big ? 8 : 4)], [X(v), y + (big ? 8 : 4)]], { role: "ink3", width: big ? 2 : 1 });
    }
    P.text(c, "0", X(0), y + 20, { size: 16, role: "ink2", font: "mono" });
    // her number first
    P.circle(c, X(hers), y, 7, { role: "you", fill: true });
    P.chip(c, String(hers), X(hers), y - 26, { size: 16, role: "you" });
    // then the tally's own place, and the hops between
    const age = api.t - checkedAt;
    if (age >= 0.6 || api.reduced) {
      const k = api.reduced ? 1 : clamp((api.t - checkedAt - 0.6) / 0.6, 0, 1);
      P.stroke(c, [[X(truth), y + 6], [X(truth) - 7, y + 18], [X(truth) + 7, y + 18]], { role: "look", width: 3, closed: true });
      const gap = truth - hers, step = Math.sign(gap), hops = Math.abs(gap);
      if (hops > 0 && hops <= 15) for (let i = 0; i < hops * k; i++) {
        const a = X(hers + step * i), b = X(hers + step * (i + 1)), m = (a + b) / 2, hh = Math.min(14, Math.abs(b - a) * 0.8 + 4);
        P.stroke(c, [[a, y - 2], [m - (b - a) * 0.25, y - hh], [m + (b - a) * 0.25, y - hh], [b, y - 2]], { role: "look", width: 2 });
      }
      else if (hops > 15) P.stroke(c, [[X(hers), y - 3], [(X(hers) + X(truth)) / 2, y - 22], [X(truth), y - 3]], { role: "look", width: 2, alpha: k });
    }
  }
  function draw(c: CanvasRenderingContext2D): void {
    api.P.textFit(c, W(`stambh.ctx.${p.ctx}`), w / 2, 16, w - 24, 24, { size: 16, role: "ink2", weight: 700 });
    if (keep) drawKeep(c); else drawRead(c);
  }
  function update(): void { /* positions follow api.t; nothing to integrate */ }

  const goal = (): string => W(keep ? "stambh.goal.keep" : "stambh.goal.read");
  // no live readout: a running count of a row IS the answer the tally is there to give
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const writing = !keep || sceneOver();
    if (writing && sel >= 0) {
      const cur = s.totals[sel], txt = cur === null ? "" : String(cur);
      for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) out.push({ id: `k${d}`, label: d, kind: "pad", group: "pad", disabled: txt.length >= 2 || (txt === "0"), onPress: () => act({ kind: "total", row: sel, n: Number(txt + d) }) });
      out.push({ id: "kdel", label: "⌫", aria: "delete", kind: "pad", group: "pad", disabled: !txt, onPress: () => act({ kind: "total", row: sel, n: txt.length > 1 ? Number(txt.slice(0, -1)) : null }) });
    }
    const ready = writing && s.totals.every((t) => t !== null);
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: s.acts === 0, onPress: () => act({ kind: "undo" }) });
    out.push({ id: "done", label: W("stambh.check"), kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "check" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
