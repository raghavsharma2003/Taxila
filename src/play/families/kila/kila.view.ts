// Kila · the 2D view (round 7 E4). The numbered path snakes across the box row by row (left to right, then right to left)
// and ends at the fort's gate. A tower stands ON its square (its period is its square): it fires on that square and every
// p-th square after. Flags (hit them), a shield (needs two towers at once) and flowers (spare them) sit on their squares.
// A tap on a square builds / takes down a tower (guard, common, all) or lays / lifts a net, or moves the trap (mark,
// meet). "Next" rolls the stone ball one square; "Run" rolls it to the gate; nothing moves on a clock. As the ball reaches
// a square, every tower whose period divides it fires (a shot line and one dot per tower on the square). Only when the ball
// reaches the gate does the law's answer show: a tick on the gate, or a magnifier on each square that is not as the goal
// needs (a net where no shot came, a flag no shot reached, a flower that was hit, a tower that misses the gate).
// Divisibility: each square holds a numbered foe (its number large, mono, never below 16 px); the fort's ÷d tower stands at
// the gate and, as the wave reaches a foe, shoots it if d divides it (the foe cracks); nets lie under the numbers. The
// squares carry no square numbers there (the foes' numbers are the only numbers on the path).
// HCF × LCM (balance, missing, three, coprime, mend): the wall is a brick wall on its square; as the wave passes, a brick
// lands on every square the wall's stride reaches (so on both towers' squares and, when the plan holds, on the trap). Under
// the path a scale lays wall × trap (coprime: the first meet) beside the towers' product (mend: the stones); its sums and
// its = / ≠ show only once the wave reaches the gate. Where the child sets both the wall and the trap a Wall / Trap pair of
// tool buttons says which a tap sets.
import type { KilaAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { allTowers, divBreaks, divGoal, divWant, gcd, hitsOn, hlBuilds, hlFiring, hlGoal, hlScale, hlTrap, hlTraps, hlWall, lcm, markWant, towerGoal, type KilaParams, type KilaState } from "./kila.logic.ts";

const RUN_SPEED = 6;     // squares / s while a whole wave runs (cosmetic; the law has already answered)
const STEP_SPEED = 4;    // squares / s for one "next"
const SHOT_LIFE = 0.35;  // s a shot line stays

export const makeKilaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<KilaParams, KilaState, KilaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, n = p.n, towersMode = towerGoal(p.goal), div = divGoal(p.goal), foes = p.foes ?? [], hl = hlGoal(p.goal);
  const both = hl && hlBuilds(p) && hlTraps(p);
  let tool: "wall" | "trap" = "wall";
  let scaleY = 0, scaleH = 0;
  const digits = Math.max(3, ...foes.map((x) => String(x).length));
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let w = 320, h = 420, cols = 6, cell = 48, gap = 4, x0 = 8, y0 = 8;
  let shown = 0, speed = STEP_SPEED;
  // a long path on a small phone: squares never shrink under a 44 px tap; the path scrolls by rows instead (two pan
  // buttons on a rail at the right; the camera follows the ball while the wave rolls)
  const MIN_CELL = 44, RAIL = 52;
  let scroll = false, rowsAll = 1, rowsSeen = 1, top = 0, topWant = 0, bandH = 0;
  const shots: { from: number; to: number; t0: number }[] = [];

  /** slot k (0-based; slot n is the gate) → its cell's top-left corner, snaking row by row */
  function slotXY(k: number): [number, number] {
    const r = Math.floor(k / cols), c = r % 2 === 0 ? k % cols : cols - 1 - (k % cols);
    return [x0 + c * (cell + gap), y0 + (r - top) * (cell + gap)];
  }
  const rowOf = (k: number) => Math.floor(k / cols);
  /** a slot's whole row is inside the scrolled window (only those squares take a tap) */
  const seen = (k: number) => !scroll || (rowOf(k) >= top - 0.02 && rowOf(k) <= top + rowsSeen - 1 + 0.02);
  const maxTop = () => Math.max(0, rowsAll - rowsSeen);
  const panTo = (r: number) => { topWant = clamp(Math.round(r), 0, maxTop()); if (api.reduced) top = topWant; api.invalidate(); };
  const centre = (sq: number): [number, number] => { const [x, y] = slotXY(sq - 1); return [x + cell / 2, y + cell / 2]; };

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    // HCF × LCM: the scale takes a band under the path
    scaleH = hl ? clamp(bh * 0.2, 84, 112) : 0;
    const ph = bh - scaleH;
    // the column count that gives the biggest square for n squares + the gate in this box
    let best = -1;
    // divisibility: fewer, bigger squares (a 5-digit foe must read at ≥ 16 px), so 2-6 columns and a larger cap
    const [cHi, cLo, cap] = div ? [6, 2, 104] : [12, 4, 86];
    for (let c = cHi; c >= cLo; c--) {   // on a tie the wider grid (fewer rows: the snake reads as a path)
      const rows = Math.ceil((n + 1) / c), g = 4;
      const s = Math.min((w - 16 - g * (c - 1)) / c, (ph - 16 - g * (rows - 1)) / rows, cap);
      if (s > best + 0.5) { best = s; cols = c; }
    }
    gap = 4;
    scroll = best < MIN_CELL;
    if (scroll) {
      const room = w - 16 - RAIL;
      cols = Math.max(2, Math.floor((room + gap) / (MIN_CELL + gap)));
      cell = Math.max(MIN_CELL, Math.min(cap, (room - gap * (cols - 1)) / cols));
      rowsAll = Math.ceil((n + 1) / cols);
      rowsSeen = Math.max(2, Math.floor((ph - 16 + gap) / (cell + gap)));
      if (rowsSeen >= rowsAll) { scroll = false; rowsSeen = rowsAll; }
    }
    if (!scroll) cell = Math.max(30, best);
    const rows = Math.ceil((n + 1) / cols);
    if (!scroll) { rowsAll = rowsSeen = rows; top = topWant = 0; }
    const seenRows = scroll ? rowsSeen : rows;
    x0 = scroll ? 8 + Math.max(0, (w - 16 - RAIL - (cols * cell + (cols - 1) * gap)) / 2) : Math.max(8, (w - (cols * cell + (cols - 1) * gap)) / 2);
    y0 = Math.max(8, (ph - (seenRows * cell + (seenRows - 1) * gap)) / 2);
    bandH = y0 + seenRows * cell + (seenRows - 1) * gap + 4;
    scaleY = bandH + 4;
    top = topWant = clamp(top, 0, maxTop());
  }
  const act = (a: KilaAct) => { ctl.dispatch(a); deps.changed(); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KilaAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "place") api.sfx("land");
    else if (last.kind === "remove" || last.kind === "mark") api.sfx("tap");
    else if (last.kind === "undo") api.sfx("tap");
    else if (last.kind === "next" || last.kind === "run") { speed = last.kind === "run" ? (hl ? Math.max(RUN_SPEED, n / 4) : RUN_SPEED) : STEP_SPEED; api.sfx("slide"); }
    if (st().beat === 0) { shown = 0; shots.length = 0; if (scroll && last.kind === "undo") panTo(0); }
    if (api.reduced) shown = st().beat;
    void ms;
    api.invalidate(); deps.changed();
  }
  /** the wave's end is shown only once the ball has rolled there (the law answered at once; the world catches up) */
  const atGate = () => st().ended && shown >= n;
  function landed(b: number): void {
    const all = hl ? hlFiring(p, st().towers) : allTowers(p, st());
    let fired = 0;
    if (div) { if (divBreaks(p, b)) { shots.push({ from: n + 1, to: b, t0: api.t }); fired++; } }
    else for (const q of all) if (b % q === 0) { shots.push({ from: q, to: b, t0: api.t }); fired++; }
    if (fired) {
      api.sfx("tick", fired);
      const [x, y] = centre(b);
      api.fx.burst(x, y, { n: 4 + 3 * fired, color: api.P.color("q1"), speed: 70, life: 0.4, size: 2.5, kind: "spark" });
    }
    if (hl) { const wl = hlWall(p, st().towers); if (wl && b % wl === 0 && !fired) api.sfx("tap"); }
    if (b === n) {
      const s = st();
      if (s.done) {
        api.sfx("good");
        const [gx, gy] = slotXY(n);
        api.fx.burst(gx + cell / 2, gy + cell / 2, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" });
      } else api.sfx("look");
    }
    deps.changed();   // the wave count on the rail, and at the gate the goal line and the controls
  }
  function update(dt: number): void {
    const target = st().beat;
    if (target < shown) { shown = target; shots.length = 0; }
    if (shown < target) {
      const before = Math.floor(shown);
      shown = api.reduced ? target : Math.min(target, shown + dt * speed);
      for (let b = before + 1; b <= Math.floor(shown); b++) landed(b);
      // the camera follows the ball: its row stays in the window (one row of the road behind it shows)
      if (scroll) {
        const br = rowOf(Math.max(0, Math.min(n, Math.ceil(shown)) - 1));
        if (br > topWant + rowsSeen - 1 || br < topWant) panTo(br - 1);
        if (Math.ceil(shown) >= n) panTo(Math.max(topWant, rowOf(n) - rowsSeen + 1));
      }
      api.invalidate();
    }
    if (top !== topWant) {
      const d = topWant - top;
      top = Math.abs(d) < 0.02 || api.reduced ? topWant : top + d * Math.min(1, dt * 9);
      api.invalidate();
    }
    while (shots.length && api.t - shots[0].t0 > SHOT_LIFE) shots.shift();
    if (shots.length) api.invalidate();
  }
  const busy = () => shown < st().beat || shots.length > 0 || top !== topWant;

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down") return;
    const id = api.hit(x, y);
    if (id === "pan-up") { panTo(topWant - (rowsSeen - 1)); return; }
    if (id === "pan-down") { panTo(topWant + (rowsSeen - 1)); return; }
    if (st().done) return;
    if (!id?.startsWith("sq-")) return;
    const at = Number(id.slice(3));
    if (hl) {
      const s = st(), use = both ? tool : hlBuilds(p) ? "wall" : "trap";
      if (use === "trap") act({ kind: "mark", at });
      else {
        act({ kind: s.towers.includes(at) ? "remove" : "place", at });
        // the wall is up: the next tap sets the trap (the child can switch back)
        if (both && st().towers.length && !st().marks.length) { tool = "trap"; deps.changed(); }
      }
      return;
    }
    if (towersMode) act({ kind: st().towers.includes(at) ? "remove" : "place", at });
    else act({ kind: "mark", at });
  }

  // ── drawings: a tower (crenellated block), a flag, a shield, a flower, a net, a trap, the gate ──
  /** the wall: two courses of bricks across the square's foot (a tower may stand on it) */
  function brickWall(c: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1): void {
    const P = api.P, bw = s * 0.84, bh = s * 0.12, x1 = x + s * 0.08, y1 = y + s - s * 0.08 - 2 * bh;
    c.save(); c.globalAlpha = alpha;
    for (let r = 0; r < 2; r++) {
      const k = r === 0 ? 4 : 3, off = r === 0 ? 0 : bw / 8, wd = (bw - (r === 0 ? 0 : bw / 4)) / k;
      for (let i = 0; i < k; i++) P.body(c, x1 + off + i * wd + 0.5, y1 + r * bh + 0.5, wd - 1, bh - 1, { role: "q2", r: 1 });
    }
    c.restore();
  }
  /** one brick the wall's stride laid on a square the wave passed (top-right corner) */
  function brick(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    api.P.body(c, x + s * 0.62, y + s * 0.1, s * 0.28, s * 0.14, { role: "q2", r: 1 });
  }
  function tower(c: CanvasRenderingContext2D, x: number, y: number, s: number, role: "q1" | "q3", aside = false): void {
    const P = api.P, tw = s * (aside ? 0.34 : 0.46), th = s * (aside ? 0.34 : 0.42), tx = aside ? x + s * 0.08 : x + (s - tw) / 2, ty = y + s - th - s * 0.08;
    P.body(c, tx, ty, tw, th, { role, r: 2 });
    const m = tw / 5;
    for (const k of [0, 2, 4]) P.body(c, tx + k * m, ty - m * 0.9, m, m, { role, r: 1 });
  }
  function flag(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.stroke(c, [[x, y + s], [x, y]], { role: "ink2", width: 2 });
    c.save(); c.fillStyle = P.color("q4"); c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * 0.7, y + s * 0.22); c.lineTo(x, y + s * 0.44); c.closePath(); c.fill(); c.restore();
  }
  function shield(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const pts: [number, number][] = [[x, y], [x + s, y], [x + s, y + s * 0.5], [x + s / 2, y + s], [x, y + s * 0.5]];
    api.P.stroke(c, pts, { role: "q4", width: 2.5, closed: true });
    api.P.stroke(c, [[x + s / 2, y + s * 0.15], [x + s / 2, y + s * 0.8]], { role: "q4", width: 2 });
  }
  function flower(c: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    const P = api.P;
    for (let k = 0; k < 5; k++) { const a = (k * 2 * Math.PI) / 5; P.circle(c, cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.42, { role: "q2", fill: true }); }
    P.circle(c, cx, cy, r * 0.3, { role: "q4", fill: true });
  }
  function net(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P, a = x + s * 0.48, b = x + s * 0.9, top = y + s * 0.5, bot = y + s * 0.9;   // the right half: a tower may stand left
    for (let k = 0; k <= 3; k++) {
      const u = a + ((b - a) * k) / 3;
      P.stroke(c, [[u, top], [u, bot]], { role: "you", width: 1.6 });
      const v = top + ((bot - top) * k) / 3;
      P.stroke(c, [[a, v], [b, v]], { role: "you", width: 1.6 });
    }
  }
  /** divisibility: the net lies under the foe's number, across the square's lower part */
  function divNet(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P, a = x + s * 0.24, b = x + s * 0.76, top = y + s * 0.6, bot = y + s * 0.92;
    for (let k = 0; k <= 4; k++) { const u = a + ((b - a) * k) / 4; P.stroke(c, [[u, top], [u, bot]], { role: "you", width: 1.8 }); }
    for (let k = 0; k <= 2; k++) { const v = top + ((bot - top) * k) / 2; P.stroke(c, [[a, v], [b, v]], { role: "you", width: 1.8 }); }
  }
  function trap(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const cx = x + s * 0.69, cy = y + s * 0.68, r = s * 0.2;   // the right half: a tower may stand left
    api.P.circle(c, cx, cy, r, { role: "you", width: 3 });
    for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; api.P.stroke(c, [[cx + Math.cos(a) * r, cy + Math.sin(a) * r], [cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55]], { role: "you", width: 2 }); }
  }
  function gate(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.body(c, x + s * 0.08, y + s * 0.28, s * 0.84, s * 0.64, { role: "q3", r: 3 });
    const m = (s * 0.84) / 7;
    for (const k of [0, 2, 4, 6]) P.body(c, x + s * 0.08 + k * m, y + s * 0.16, m, m, { role: "q3", r: 1 });
    c.save(); c.fillStyle = P.color("ink"); c.globalAlpha = 0.55; c.beginPath();
    c.moveTo(x + s * 0.36, y + s * 0.92); c.lineTo(x + s * 0.36, y + s * 0.62); c.arc(x + s / 2, y + s * 0.62, s * 0.14, Math.PI, 0); c.lineTo(x + s * 0.64, y + s * 0.92); c.closePath(); c.fill(); c.restore();
  }
  const labelled = (sq: number) => p.labels === 1 || sq === 1 || sq === n || (p.labels === 2 ? sq % 2 === 0 : sq % 5 === 0);

  /** the squares the law's answer marks with a magnifier after a missed wave (only what is on screen, never the key) */
  function lookSquares(): number[] {
    const s = st(), all = allTowers(p, s);
    if (hl) {
      const fire = hlFiring(p, s.towers), wl = hlWall(p, s.towers), t = hlTrap(p, s.marks), out: number[] = [];
      if (p.goal === "coprime") return s.towers.filter(() => fire.length === 2 && gcd(fire[0], fire[1]) > 1);
      if (p.goal === "mend") { if (wl && t && t % wl !== 0 && t <= n) out.push(t); else if (wl && t && wl * t !== p.stones && !p.wall) out.push(wl); return out; }
      if (p.goal === "three") return t && !p.trap ? [t] : [];
      if (fire.length === 2) {
        if (wl && wl !== gcd(fire[0], fire[1])) out.push(p.wall ? fire[fire.length - 1] : wl);
        if (t && t !== lcm(fire[0], fire[1]) && !out.includes(t)) out.push(p.trap ? fire[fire.length - 1] : t);
      }
      return [...new Set(out)].filter((q) => q >= 1 && q <= n);
    }
    if (div) { const want = divWant(p); return [...want.filter((q) => !s.marks.includes(q)), ...s.marks.filter((q) => !want.includes(q))]; }
    if (p.goal === "mark") { const want = markWant(p); return [...want.filter((q) => !s.marks.includes(q)), ...s.marks.filter((q) => !want.includes(q))]; }
    if (p.goal === "meet") return s.marks.filter((q) => hitsOn(p.fixed, q) < 2);
    if (p.goal === "all") return s.towers.filter((q) => !p.targets.every((t) => t % q === 0));
    return [...p.targets.filter((t) => hitsOn(all, t) < 1), ...p.armoured.filter((t) => hitsOn(all, t) < 2), ...p.decoys.filter((t) => hitsOn(all, t) > 0)];
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), all = allTowers(p, s), rolled = Math.floor(shown), end = atGate();
    const look = end && !s.done ? lookSquares() : [];
    if (scroll) { c.save(); c.beginPath(); c.rect(0, y0 - 3, w, bandH - y0 + 3); c.clip(); }
    // the path: a faint line through the squares' centres, from square 1 to the gate
    const line: [number, number][] = [];
    for (let k = 0; k <= n; k++) { const [x, y] = slotXY(k); line.push([x + cell / 2, y + cell / 2]); }
    P.stroke(c, line, { role: "ink3", width: Math.max(4, cell * 0.16), alpha: 0.25 });
    const small = clamp(cell * 0.3, 14, 18);
    // a foe's number: as big as the square allows for the longest foe, never below 16 px
    const big = clamp(Math.min(cell * 0.34, (cell - 8) / (digits * 0.62)), 16, 28);
    if (div) for (let sq = 1; sq <= n; sq++) {
      const [x, y] = slotXY(sq - 1), broke = sq <= rolled && divBreaks(p, sq);
      if (!s.done && seen(sq - 1)) api.target(`sq-${sq}`, x, y, cell, cell);
      P.body(c, x, y, cell, cell, { role: "panel", r: Math.min(8, cell * 0.16), state: look.includes(sq) ? "look" : "idle", seed: sq });
      P.text(c, String(foes[sq - 1]), x + cell / 2, y + cell * 0.36, { size: big, role: "ink", font: "mono", weight: 700, align: "center", baseline: "middle", maxW: cell - 6 });
      if (s.marks.includes(sq)) divNet(c, x, y, cell);
      // the shot came: the foe cracks (a slash across its number and a dot at the foot)
      if (broke) {
        P.stroke(c, [[x + cell * 0.12, y + cell * 0.52], [x + cell * 0.88, y + cell * 0.2]], { role: "q1", width: 3, alpha: 0.9 });
        P.circle(c, x + cell * 0.86, y + cell - cell * 0.12, cell * 0.06, { role: "q1", fill: true });
      }
    }
    else for (let sq = 1; sq <= n; sq++) {
      const [x, y] = slotXY(sq - 1);
      if (hl) { hlSquare(c, sq, x, y, rolled, look); continue; }
      if (!s.done && seen(sq - 1)) api.target(`sq-${sq}`, x, y, cell, cell);
      P.body(c, x, y, cell, cell, { role: "panel", r: Math.min(8, cell * 0.16), state: look.includes(sq) ? "look" : "idle", seed: sq });
      if (labelled(sq)) P.text(c, String(sq), x + cell * 0.08, y + small * 0.75, { size: small, role: "ink2", font: "mono", weight: 700, align: "left" });
      else P.circle(c, x + cell * 0.18, y + small * 0.75, 2, { role: "ink3", fill: true });
      // what stands on the square
      const ic = cell * 0.3;
      if (p.targets.includes(sq) && p.goal !== "all") flag(c, x + cell - ic - 2, y + 4, ic);
      if (p.armoured.includes(sq)) shield(c, x + cell - ic - 4, y + 4, ic);
      if (p.decoys.includes(sq)) flower(c, x + cell - ic / 2 - 4, y + ic / 2 + 4, ic / 2);
      if (all.includes(sq)) tower(c, x, y, cell, p.fixed.includes(sq) ? "q3" : "q1", s.marks.includes(sq));
      if (s.marks.includes(sq)) (p.goal === "meet" ? trap : net)(c, x, y, cell);
      // the shots that came: one dot per tower that fired here
      if (sq <= rolled) {
        const k = hitsOn(all, sq);
        for (let i = 0; i < k; i++) P.circle(c, x + cell * 0.2 + i * cell * 0.17, y + cell - cell * 0.12, cell * 0.06, { role: "q1", fill: true });
      }
    }
    // the gate (slot n): with "all", the gate squares are the gates (the last one is the fort)
    const [gx, gy] = slotXY(n);
    gate(c, gx, gy, cell);
    if (div) P.chip(c, `÷${p.d}`, gx + cell / 2, gy + cell * 0.2, { size: clamp(cell * 0.24, 16, 22), font: "mono" });
    if (p.goal === "all") for (const t of p.targets) { const [x, y] = slotXY(t - 1); P.stroke(c, [[x + 2, y + 2], [x + cell - 2, y + 2], [x + cell - 2, y + cell - 2], [x + 2, y + cell - 2]], { role: "q4", width: 3, closed: true }); }
    // shots in flight
    for (const sh of shots) {
      const k = clamp((api.t - sh.t0) / SHOT_LIFE, 0, 1), [ax, ay] = centre(sh.from), [bx, by] = centre(sh.to);
      P.stroke(c, [[ax, ay - cell * 0.2], [bx, by]], { role: "q1", width: 2.5, alpha: 1 - k });
    }
    // the ball: before square 1 while waiting, then on the square it reached (slides between squares)
    if (s.beat > 0 || shown > 0) {
      const f = Math.min(shown, n), a = Math.max(1, Math.floor(f)), b = Math.min(n, a + 1), u = f - Math.floor(f);
      const [ax, ay] = centre(a), [bx, by] = centre(b);
      const bx2 = f < 1 ? ax : ax + (bx - ax) * u, by2 = f < 1 ? ay : ay + (by - ay) * u;
      // divisibility: the ball rolls along the squares' lower-left corner, clear of the foes' numbers
      if (div) P.circle(c, bx2 - cell * 0.36, by2 + cell * 0.3, cell * 0.1, { role: "ink2", fill: true });
      else P.circle(c, bx2, by2 - cell * 0.05, cell * 0.16, { role: "ink2", fill: true });
    } else {
      const [ax, ay] = slotXY(0);
      P.circle(c, ax + cell * (div ? 0.14 : 0.16), ay + cell * (div ? 0.8 : 0.5), cell * (div ? 0.09 : 0.12), { role: "ink2", fill: true, alpha: 0.7 });
    }
    if (end && s.done) P.tick(c, gx + cell / 2, gy + cell * 0.1, Math.min(26, cell * 0.5), 1);
    if (end) for (const sq of look) { const [x, y] = slotXY(sq - 1); P.magnifier(c, x + cell * (div ? 0.84 : 0.78), y + cell * (div ? 0.76 : 0.5), Math.min(22, cell * (div ? 0.3 : 0.36))); }
    if (scroll) { c.restore(); drawRail(c, look); }
    if (hl) drawScale(c, end);
  }
  /** the pan rail: ▲ / ▼ (44 px), and between them a strip of the whole road with the window on it and the squares the
   *  wave's end marked (so a magnifier off screen is still seen) */
  function drawRail(c: CanvasRenderingContext2D, look: number[]): void {
    const P = api.P, bx = w - 8 - 44, yTop = y0, yBot = bandH - 4 - 44;
    const btn = (id: string, y: number, up: boolean, on: boolean) => {
      if (on) api.target(id, bx, y, 44, 44);
      P.body(c, bx, y, 44, 44, { role: "panel", r: 8, state: on ? "idle" : "dim" });
      const cx = bx + 22, cy = y + 22, d = up ? -1 : 1;
      P.stroke(c, [[cx - 9, cy - d * 5], [cx, cy + d * 5], [cx + 9, cy - d * 5]], { role: on ? "ink" : "ink3", width: 3 });
    };
    btn("pan-up", yTop, true, topWant > 0);
    btn("pan-down", yBot, false, topWant < maxTop());
    const sy = yTop + 52, sh = yBot - 8 - sy;
    if (sh < 24) return;
    const sx = bx + 18, rowH = sh / rowsAll;
    P.body(c, sx, sy, 8, sh, { role: "ink3", r: 4 });
    c.save(); c.globalAlpha = 0.9; P.body(c, sx - 2, sy + top * rowH, 12, Math.max(8, rowsSeen * rowH), { role: "you", r: 5 }); c.restore();
    for (const q of look) P.circle(c, sx + 4, sy + (rowOf(q - 1) + 0.5) * rowH, 4, { role: "q4", fill: true });
    const br = rowOf(Math.max(0, Math.min(n, Math.ceil(shown)) - 1));
    if (st().beat > 0) P.circle(c, sx + 4, sy + (br + 0.5) * rowH, 3, { role: "ink2", fill: true });
  }

  /** one square of an HCF × LCM path: its number, the wall (or mend's draft), the towers, the trap, the shots and bricks */
  function hlSquare(c: CanvasRenderingContext2D, sq: number, x: number, y: number, rolled: number, look: number[]): void {
    const P = api.P, s = st(), fire = hlFiring(p, s.towers), wl = hlWall(p, s.towers), t = hlTrap(p, s.marks), small = clamp(cell * 0.3, 14, 18);
    if (!s.done && seen(sq - 1)) api.target(`sq-${sq}`, x, y, cell, cell);
    P.body(c, x, y, cell, cell, { role: "panel", r: Math.min(8, cell * 0.16), state: look.includes(sq) ? "look" : "idle", seed: sq });
    if (labelled(sq)) P.text(c, String(sq), x + cell * 0.08, y + small * 0.75, { size: small, role: "ink2", font: "mono", weight: 700, align: "left" });
    else P.circle(c, x + cell * 0.18, y + small * 0.75, 2, { role: "ink3", fill: true });
    // coprime: the pads a partner may stand on (a plinth), while nothing stands there
    if (p.goal === "coprime" && p.menu.includes(sq) && !fire.includes(sq)) { c.save(); c.globalAlpha = 0.6; P.body(c, x + cell * 0.22, y + cell * 0.74, cell * 0.56, cell * 0.12, { role: "ink3", r: 3 }); c.restore(); }
    if (p.draft === sq && wl !== sq) brickWall(c, x, y, cell, 0.35);
    if (wl === sq) brickWall(c, x, y, cell);
    if (fire.includes(sq)) tower(c, x, y, cell, p.fixed.includes(sq) ? "q3" : "q1", t === sq);
    if (t === sq) trap(c, x, y, cell);
    if (sq <= rolled) {
      const k = hitsOn(fire, sq);
      for (let i = 0; i < k; i++) P.circle(c, x + cell * 0.2 + i * cell * 0.17, y + cell - cell * 0.12, cell * 0.06, { role: "q1", fill: true });
      if (wl && sq % wl === 0) brick(c, x, y, cell);
    }
  }
  /** the scale under the path: wall × trap beside the towers' product (sums and = / ≠ only at the gate) */
  function drawScale(c: CanvasRenderingContext2D, end: boolean): void {
    const P = api.P, s = st(), { left, right } = hlScale(p, s.towers, s.marks);
    const x = 12, wd = w - 24, y = Math.min(scaleY, h - scaleH + 4), hh = scaleH - 12;
    if (hh < 40) return;
    P.body(c, x, y, wd, hh, { role: "panel", r: 8 });
    const size = clamp(hh * 0.24, 15, 20), rowH = hh / 2;
    const prod = (xs: number[]) => (xs.every((v) => v > 0) ? xs.reduce((a, b) => a * b, 1) : 0);
    const L = prod(left), R = prod(right), show = end && L > 0 && R > 0;
    const term = (xs: number[]) => xs.map((v) => (v > 0 ? String(v) : "?")).join(" × ");
    const glyph = clamp(rowH * 0.62, 24, 34);
    const row = (k: number, xs: number[], kind: "left" | "right") => {
      const cy = y + rowH * k + rowH / 2, gx = x + 8;
      // what the row is made of, drawn (never a word): wall · trap, or the towers, or the stones
      if (kind === "left" && p.goal !== "coprime") { brickWall(c, gx - glyph * 0.08, cy - glyph * 0.55, glyph); trap(c, gx + glyph * 0.2, cy - glyph * 0.72, glyph); }
      else if (kind === "left") trap(c, gx - glyph * 0.2, cy - glyph * 0.72, glyph);
      else if (p.goal === "mend") for (let i = 0; i < 3; i++) P.circle(c, gx + 4 + i * 7, cy + (i === 1 ? -3 : 3), 4, { role: "ink3", fill: true });
      else tower(c, gx - glyph * 0.04, cy - glyph * 0.62, glyph, "q3");
      const txt = term(xs) + (show && xs.length > 1 ? ` = ${kind === "left" ? L : R}` : "");
      P.text(c, txt, gx + glyph + 14, cy, { size, role: "ink", font: "mono", weight: 700, align: "left", baseline: "middle", maxW: wd - glyph - 30 - (show ? 0 : 0) });
      // a bar as long as the row's product (both bars on one scale)
      if (show) { const mx = Math.max(L, R), bl = ((wd - 72) * (kind === "left" ? L : R)) / mx; P.body(c, x + 12, cy + rowH * 0.32, Math.max(4, bl), 5, { role: kind === "left" ? "q2" : "q3", r: 2 }); }
    };
    row(0, left, "left"); row(1, right, "right");
    if (show) P.chip(c, L === R ? "=" : "≠", x + wd - 22, y + rowH, { size: clamp(size, 16, 22), font: "mono" });
  }
  function goal(): string {
    const s = st();
    if (s.ended && !s.done && shown >= n) return W("kila.again");
    const [a, b, c3] = p.fixed;
    switch (p.goal) {
      case "balance": return W("kila.goal.balance", { a, b });
      case "missing": return p.hide === "b" ? W("kila.goal.missing.b", { a }) : p.hide === "wall" ? W("kila.goal.missing.wall", { a, b }) : W("kila.goal.missing.trap", { a, b });
      case "three": return W("kila.goal.three", { a, b, c: c3 });
      case "coprime": return W("kila.goal.coprime", { a });
      case "mend": return W("kila.goal.mend", { s: p.stones ?? 0, d: p.draft ?? 0 });
      case "mark": return W("kila.goal.mark", { p: p.fixed[0] });
      case "guard": return W("kila.goal.guard");
      case "common": return W("kila.goal.common", { p: p.fixed[0] });
      case "all": return p.targets.length > 1 ? W("kila.goal.all2", { g: p.targets[0], h: p.targets[1] }) : W("kila.goal.all", { g: p.targets[0] });
      case "meet": return W("kila.goal.meet", { a: p.fixed[0], b: p.fixed[1] });
      case "ones": case "tail": case "sum": return W("kila.goal.div", { d: p.d ?? 0 });
    }
  }
  // the wave's square count only: never a running total of hits, never the key
  const readouts = (): Readout[] => (st().beat > 0 ? [{ k: W("kila.wave"), v: `${Math.min(n, Math.floor(shown))}/${n}` }] : []);
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const rolling = s.beat > 0 && !s.ended;
    const ready = !s.ended && (hl ? (!hlBuilds(p) || s.towers.length > 0) && (!hlTraps(p) || s.marks.length > 0) : towersMode ? s.towers.length > 0 : s.marks.length > 0);
    const out: ControlSpec[] = [];
    if (both) for (const tl of ["wall", "trap"] as const) out.push({ id: `tool-${tl}`, label: W(`kila.tool.${tl}`), kind: "choice", group: "tools", pressed: tool === tl, disabled: rolling,
      aria: `${W(`kila.tool.${tl}`)}${tool === tl ? " (on)" : ""}`, onPress: () => { tool = tl; deps.changed(); } });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: rolling, onPress: () => act({ kind: "undo" }) });
    out.push({ id: "next", label: W("kila.next"), aria: "roll the ball one square", kind: "pad", group: "go", disabled: !ready, onPress: () => act({ kind: "next" }) });
    out.push({ id: "run", label: W("kila.run"), aria: "roll the wave to the gate", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react };
  return view;
};
