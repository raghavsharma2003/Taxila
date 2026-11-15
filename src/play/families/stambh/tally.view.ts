// Stambh · tally, the 2D view (round 8). Nothing here runs on a clock: the scene moves on only when the child marks.
//   keep  the scene strip on top: the thing passing now stands in the middle (alone: nothing waits beside it), and the
//         two big buttons sit at the strip's right: "|" a standing line, "╱" the line across. Below, one row per kind (a
//         card: the picked one outlined): its picture and name, its tally, its total cell. Tap a row to pick it, then a
//         button: one stroke there for the thing passing, which then moves on. When the scene has passed, the buttons go;
//         tap a row or its total cell and write the number on the pad. "Phir se rakho" lets the scene pass again (her
//         strokes clear; "Wapas" brings them back). Strokes lie as she makes them (a gap only after her own line across).
//   read  one row of tallies, big; the answer cell under it; the pad.
// At a check a total cell gets a tick only when its row is right, marks AND total (round 2, ruling 1); a total that is
// not the row's count gets a dashed box in the mix-up colour; a right total over wrong marks gets neither (the row's
// play-out shows what is wrong). In a row that is not right the law's groups play out what they are worth: a count runs
// over each closed group's strokes, one digit at a time, its last number holds a moment, and then the whole play-out
// fades (evening ruling 2: nothing stays over the tally while a try remains); a group of five standing lines has its
// fifth line tip across the four as the count reaches it, and stand again as it fades. Never words. A read answer off the
// tally plays out the same way on the tally itself (the count over each bundle); her number stands on a plain line, with
// an arrow the way to go after her FIRST miss only (evening ruling 3; later, her dot alone): no unit ticks, no place for
// the answer, no hops to count (law 2). After a check the line
// under the world says what to change (the tally, a total, or either) and Jaancho waits until something changes. A level
// solved after a retry ends with pale ticks, a first-try solve with full ones. Green is only a right row's tick; the
// picked row and cell are outlined in the focus colour; her wrong total is the mix-up colour (law 1). No live total, no
// count of strokes before a check: what a row holds is hers to count.
import type { Moment, StambhAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import type { Role } from "../../core/styles.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { groupsOf, tallyFlow, TALLY_CONTEXTS, type TallyParams, type TallyState } from "./tally.logic.ts";

/** each kind's hue is its place in its scene (Kada is the same colour in keep and read; round 2, ruling 5) */
const ROLES: Role[] = ["q1", "q2", "q3", "q4"];

export const makeTallyView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<TallyParams, TallyState, StambhAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, keep = p.goal === "keep", n = p.cats.length;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const catName = (r: number) => W(`stambh.cat.${p.cats[r]}`);
  const roleOf = (cat: string): Role => ROLES[Math.max(0, (TALLY_CONTEXTS[p.ctx] ?? []).indexOf(cat))] ?? "q1";
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
      // the tally, the answer cell (60), room for her chip over the number line (46), the line and its 0 (34)
      readH = Math.max(72, Math.min(clamp(h * 0.4, 96, 260), h - readTop - 12 - 60 - 46 - 34));
      cellY = readTop + readH + 12;
      lineY = cellY + 60 + 46;
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
    if (last?.kind === "again") { checkedAt = -1; checkedSnap = null; sel = -1; api.sfx(refused ? "refuse" : "slide"); }
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
    // a row picks itself for strokes while the scene passes, and its total cell once it has passed
    if (id.startsWith("row-") || (id.startsWith("tot-") && (!keep || sceneOver()))) { sel = r; api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if ((id === "btn-stand" || id === "btn-across") && sel >= 0 && !sceneOver()) act({ kind: "mark", row: sel, across: id === "btn-across" });
  }
  // the play-out's beats (seconds after the check): the count starts, one digit per stroke, the fifth line tips across; the
  // last numbers hold, then the whole play-out fades and the tally is hers again (evening ruling 2: nothing stays over the
  // tally while a try remains, or the 5s over the bundles add up to the key)
  const COUNT0 = 0.25, STEP = 0.26, TIP = 0.35, FADE0 = COUNT0 + 5 * STEP + TIP + 1.0, FADE = 0.6;
  const busy = () => (api.t - movedAt < 0.5) || (checkedAt >= 0 && api.t - checkedAt < FADE0 + FADE + 0.1);
  const showCheck = () => checkedSnap !== null && checkedSnap === snap(st());
  /** the row's marks are a true tally of its count (read: the given row always is) */
  const marksRight = (r: number) => !keep || (st().marks[r].length === p.counts[r] && st().marks[r].every((m, i) => m === (i % 5 === 4)));

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

  /**
   * A row's strokes in the box (x, y, bw, bh). grouped = the law's commit pass (a gap after every group); playOut = the
   * row is not right, so its closed groups play out what they are worth: a count over the strokes, one digit at a time
   * (1, 2, 3, 4 on the standing lines and the last on the line across, or on a fifth standing line, which then tips across
   * the four), the last number staying over the group. A group closed early (a line across after fewer than four) is
   * counted the same way, to what it holds.
   */
  function drawTally(c: CanvasRenderingContext2D, marks: readonly boolean[], x: number, y: number, bw: number, bh: number, role: Role, grouped: boolean, playOut: boolean): void {
    // (read: two lines keep a band between them for the count's digits over the second line)
    const P = api.P, f = tallyFlow(marks, bw, bh, grouped, keep ? clamp(rowH * 0.42, 30, 56) : 56, keep ? 0 : 21);
    // lineH is the pitch from one line to the next (one line: the box); the lines are centred in the box
    const span = f.lines > 1 ? f.sh + f.lineH * (f.lines - 1) : f.lineH, top = y + (bh - span) / 2;
    const ly = (line: number) => (f.lines > 1 ? top + f.sh / 2 + f.lineH * line : top + f.lineH / 2);
    const width = clamp(f.sp * 0.32, 1.8, 4.5);
    // how much of the play-out is left (1 while it runs and holds, down to 0 as it fades; reduced motion: all, then none)
    const raw = api.t - checkedAt, left = !playOut ? 0 : api.reduced ? (raw < FADE0 + FADE ? 1 : 0) : 1 - clamp((raw - FADE0) / FADE, 0, 1);
    if (left <= 0) playOut = false;
    const age = playOut ? (api.reduced ? 99 : raw) : -1;
    const groups = playOut ? groupsOf(marks).filter((g) => g.kind !== "open") : [];
    // the fifth standing line of a group of five, once the count reaches it, tips across (drawn by the play-out below); as
    // the play-out fades it stands again
    const tipping = new Set<number>();
    if (age >= COUNT0 + 4 * STEP) for (const g of groups) if (g.kind === "five") tipping.add(g.from + 4);
    for (const s of f.stand) P.stroke(c, [[x + s.x, ly(s.line) - f.sh / 2], [x + s.x, ly(s.line) + f.sh / 2]], { role, width, ...(tipping.has(s.i) ? { alpha: 1 - left } : {}) });
    for (const a of f.across) P.stroke(c, [[x + a.x0, ly(a.line) + f.sh * 0.42], [x + a.x1, ly(a.line) - f.sh * 0.42]], { role, width: width + 0.5 });
    if (!playOut || age < COUNT0) return;
    c.save(); c.globalAlpha *= left;
    drawCount(c, f, x, ly, width, age, groups);
    c.restore();
  }
  /** the count over each closed group (and a group of five's fifth line tipping across), at `age` seconds into the play-out */
  function drawCount(c: CanvasRenderingContext2D, f: ReturnType<typeof tallyFlow>, x: number, ly: (line: number) => number, width: number, age: number, groups: ReturnType<typeof groupsOf>): void {
    const P = api.P, digit = clamp(f.sh * 0.5, 16, 20);
    for (const g of groups) {
      // each stroke's place: a standing line at its x, a line across at its right end (where the hand finishes it)
      const at: { x: number; line: number }[] = [];
      for (let i = g.from; i < g.from + g.len; i++) {
        const s = f.stand.find((q) => q.i === i), a = f.across.find((q) => q.i === i);
        if (s) at.push({ x: s.x, line: s.line }); else if (a) at.push({ x: a.x1 - f.sp * 0.5, line: a.line });
      }
      if (!at.length) continue;
      const k = Math.min(g.len, Math.floor((age - COUNT0) / STEP) + 1);
      const last = at[at.length - 1], first = at[0];
      if (g.kind === "five" && k >= 5) {
        // the fifth line tips across the four standing before it
        const s5 = f.stand.find((q) => q.i === g.from + 4)!, s1 = at[0], s4 = at[3];
        const t = api.reduced ? 1 : clamp((age - COUNT0 - 4 * STEP) / TIP, 0, 1), e = t * t * (3 - 2 * t);
        const yy = ly(s5.line), sameLine = s1.line === s5.line;
        const from: [[number, number], [number, number]] = [[s5.x, yy + f.sh / 2], [s5.x, yy - f.sh / 2]];
        const to: [[number, number], [number, number]] = sameLine ? [[s1.x - f.sp * 0.5, yy + f.sh * 0.42], [s4.x + f.sp * 0.5, yy - f.sh * 0.42]] : [[s5.x - f.sp * 0.5, yy + f.sh * 0.42], [s5.x + f.sp * 0.5, yy - f.sh * 0.42]];
        const pt = (j: 0 | 1): [number, number] => [x + from[j][0] + (to[j][0] - from[j][0]) * e, from[j][1] + (to[j][1] - from[j][1]) * e];
        P.stroke(c, [pt(0), pt(1)], { role: "look", width: width + 0.5 });
      }
      // the count: the digit of the stroke reached now; once the group is counted, its last number over the group's middle
      const done = age >= COUNT0 + g.len * STEP;
      const cx = done ? x + (first.x + last.x) / 2 : x + at[k - 1].x, line = done ? first.line : at[k - 1].line;
      P.text(c, String(k), cx, ly(line) - f.sh / 2 - digit * 0.7, { size: digit, role: "look", font: "mono", weight: 700 });
    }
  }
  /** a total cell: her number (or empty); picked = the pad writes here; marksOk = the row's marks are right */
  function drawCell(c: CanvasRenderingContext2D, r: number, cx: number, cy: number, cw: number, ch: number, open: boolean, checked: boolean, marksOk = true): void {
    const P = api.P, s = st(), v = s.totals[r];
    api.target(`tot-${r}`, cx - cw / 2, cy - ch / 2, cw, ch);
    const picked = open && !s.done && !checked && r === sel;
    P.body(c, cx - cw / 2, cy - ch / 2, cw, ch, { role: "panel", r: 10, state: open ? "idle" : "dim" });
    if (picked) P.stroke(c, [[cx - cw / 2 - 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy + ch / 2 + 3], [cx - cw / 2 - 3, cy + ch / 2 + 3]], { role: "you", width: 3, closed: true });
    if (v !== null) P.text(c, String(v), cx, cy + 1, { size: keep ? 22 : 30, role: "ink", font: "mono", weight: 700 });
    if (checked) {
      // a tick says the row is right, its marks AND its total (a right total over wrong marks gets no tick: its strokes
      // play out on the row itself); a solve after a retry ends with pale ticks, a first-try solve with full ones (the
      // end screen tells the two apart truthfully, no words); a total that is not the row's count gets the dashed box
      const ok = v === p.counts[r] && marksOk;
      const k = clamp((api.t - checkedAt) / 0.4, 0, 1);
      if (ok && s.done && s.checks > 1) { c.save(); c.globalAlpha *= 0.42; P.tick(c, cx + cw / 2 - 2, cy - ch / 2 - 2, 18, k); c.restore(); }
      else if (ok) P.tick(c, cx + cw / 2 - 2, cy - ch / 2 - 2, 18, k);
      else if (v !== p.counts[r]) P.stroke(c, [[cx - cw / 2 - 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy + ch / 2 + 3], [cx - cw / 2 - 3, cy + ch / 2 + 3]], { role: "look", width: 2.5, dash: [5, 4], closed: true });
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
      // the one passing now (the last one slides out); nothing waits beside it, so nothing reads as passed and unmarked
      if (s.at > 0 && k < 1) { const r = p.seq[s.at - 1]; thing(c, p.cats[r], mid + (sceneW * 0.5) * k, cy, size, roleOf(p.cats[r]), 1 - k); }
      const r = p.seq[s.at];
      thing(c, p.cats[r], mid - size * 1.4 * (1 - k), cy, size, roleOf(p.cats[r]), 0.3 + 0.7 * k);
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
      if (!s.done) api.target(`row-${r}`, 0, y0, w - cellW - 20, rowH);
      // each row a card while the scene passes (tap it to pick it); the picked row outlined, in either phase
      if (!s.done && (!over || r === sel)) P.body(c, 4, y0 + 4, w - cellW - 28, rowH - 8, { role: "panel", r: 12, state: r === sel ? "selected" : "idle" });
      // its picture and its name side by side, as the scene shows it
      const is = w < 600 ? 28 : clamp(rowH * 0.36, 28, 44);
      thing(c, p.cats[r], 14 + is / 2, cy2, is, roleOf(p.cats[r]));
      P.textFit(c, catName(r), (14 + is + 6 + gut) / 2, cy2, gut - is - 22, 22, { size: 17, role: "ink", weight: 700 });
      const marksOk = marksRight(r), rowOk = marksOk && s.totals[r] === p.counts[r];
      drawTally(c, s.marks[r], tallyX, y0 + 6, tallyW, rowH - 12, "ink", checked, checked && !rowOk);
      drawCell(c, r, w - 12 - cellW / 2, cy2, cellW, clamp(rowH - 22, 34, 56), over, checked, marksOk);
    }
  }
  function drawRead(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), checked = showCheck();
    const is = 30;
    thing(c, p.cats[0], 16 + is / 2, 46, is, roleOf(p.cats[0]));
    P.text(c, catName(0), 16 + is + 10, 46, { size: 18, role: "ink", weight: 700, align: "left", maxW: w - is - 48 });
    // a miss plays out on the tally itself, as keep does: the count over each bundle (round 2, ruling 3)
    // (the top 22 px of the box are kept for the count's digits, clear of the kind's name and picture)
    drawTally(c, s.marks[0], tallyX, readTop + 22, tallyW, readH - 22, "ink", false, checked && !s.done);
    P.text(c, "=", w / 2 - cellW / 2 - 18, cellY + 32, { size: 26, role: "ink2", weight: 700 });
    drawCell(c, 0, w / 2, cellY + 32, cellW, 60, true, checked);
    // her number and the way to go, after the first miss only (evening ruling 3: an arrow on every miss walks her to the key)
    // (from the second miss her dot and nothing else: unlimited tries with an arrow are a higher-or-lower search)
    if (checked && !s.done) numberLine(c, s.totals[0] ?? 0, p.counts[0], s.checks === 1);
  }
  /**
   * A read off the tally, played out below it (the count over each bundle runs on the tally itself). Her number is drawn
   * in the "look" colour of her dashed answer box (never the colour of a tick) on a plain line from 0, with an arrow the
   * way to go: no unit ticks, no place for the answer and no hops, so the answer is never counted off the line (law 2).
   */
  function numberLine(c: CanvasRenderingContext2D, hers: number, truth: number, arrow: boolean): void {
    const P = api.P, x0 = 24, x1 = w - 24, y = Math.min(lineY, h - 30);
    const R = Math.max(10, Math.ceil((hers * 1.6 + 4) / 5) * 5);
    const X = (v: number) => x0 + ((x1 - x0) * v) / R;
    P.stroke(c, [[x0, y], [x1, y]], { role: "ink2", width: 2 });
    P.stroke(c, [[X(0), y - 8], [X(0), y + 8]], { role: "ink3", width: 2 });
    P.text(c, "0", X(0), y + 20, { size: 16, role: "ink2", font: "mono" });
    // her number first
    P.circle(c, X(hers), y, 7, { role: "look", fill: true });
    P.chip(c, String(hers), X(hers), y - 26, { size: 16, role: "look" });
    const age = api.t - checkedAt;
    if (!arrow || !(age >= 0.6 || api.reduced)) return;
    const k = api.reduced ? 1 : clamp((age - 0.6) / 0.6, 0, 1), dir = Math.sign(truth - hers);
    // the way to go from her number: an arrow of a fixed length, no ticks to count along
    const ax = X(hers) + dir * 12, bx = ax + dir * 44 * k;
    if (dir) { P.stroke(c, [[ax, y + 18], [bx, y + 18]], { role: "ink2", width: 3 }); P.stroke(c, [[bx - dir * 8, y + 11], [bx, y + 18], [bx - dir * 8, y + 25]], { role: "ink2", width: 3 }); }
  }
  function draw(c: CanvasRenderingContext2D): void {
    api.P.textFit(c, W(`stambh.ctx.${p.ctx}`), w / 2, 16, w - 24, 24, { size: 16, role: "ink2", weight: 700 });
    if (keep) drawKeep(c); else drawRead(c);
  }
  function update(): void { /* positions follow api.t; nothing to integrate */ }

  // the line under the world says what she does now (never the rule, never where a stroke goes); at the end, a neutral
  // line of what she did, in digits (no praise, no rule)
  const goal = (): string => {
    const s = st();
    if (s.done) return keep ? W("stambh.end.keep", { n: p.seq.length, k: s.checks }) : W("stambh.end.read", { n: s.totals[0] ?? 0, k: s.checks });
    if (!keep) return W("stambh.goal.read");
    if (!sceneOver()) return W("stambh.goal.keep");
    // after a check, while nothing has changed: what to change. Marks wrong, totals right (the "five" state among them):
    // keep the tally again, the only way to mend marks once the strip has folded; totals wrong, marks right: a total;
    // both: either (round 2, ruling 1)
    if (showCheck()) {
      const marksOff = p.cats.some((_, r) => !marksRight(r)), totalsOff = p.counts.some((c, r) => s.totals[r] !== c);
      return W(marksOff && !totalsOff ? "stambh.goal.again" : !marksOff && totalsOff ? "stambh.goal.totals" : "stambh.goal.fix");
    }
    return W("stambh.goal.table");
  };
  // no live readout: a running count of a row IS the answer the tally is there to give
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    const writing = !keep || sceneOver();
    if (writing && sel >= 0) {
      const cur = s.totals[sel], txt = cur === null ? "" : String(cur);
      // a digit typed into a full box (two digits, or a lone 0) starts it again: the keys never look off while the line
      // asks her to change a total (round 2, ruling 5)
      const full = txt.length >= 2 || txt === "0";
      for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) out.push({ id: `k${d}`, label: d, kind: "pad", group: "pad", onPress: () => act({ kind: "total", row: sel, n: Number(full ? d : txt + d) }) });
      out.push({ id: "kdel", label: "⌫", aria: "delete", kind: "pad", group: "pad", disabled: !txt, onPress: () => act({ kind: "total", row: sel, n: txt.length > 1 ? Number(txt.slice(0, -1)) : null }) });
    }
    // Jaancho waits after a check until something changes (a second check of the same tally tells her nothing new)
    const ready = writing && s.totals.every((t) => t !== null) && !showCheck();
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: s.acts === 0, onPress: () => act({ kind: "undo" }) });
    // keep: the strip has folded away, so the tally is repaired by keeping the scene again (undo brings the old one back);
    // after a check that found marks to mend it is her move
    const mend = keep && showCheck() && p.cats.some((_, r) => !marksRight(r));
    if (keep && sceneOver()) out.push({ id: "again", label: W("stambh.again"), kind: "secondary", group: "go", you: mend, onPress: () => act({ kind: "again" }) });
    out.push({ id: "done", label: W("stambh.check"), kind: "primary", group: "go", you: ready && !mend, disabled: !ready, onPress: () => act({ kind: "check" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
