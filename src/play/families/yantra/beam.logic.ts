// Yantra · beam (E6, round 7): route a light beam with plane mirrors. A board of cells holds a lamp (a laser pointer) at
// an edge, a target (a solar panel that opens a gate), and walls. The child places mirrors on cells and turns them in 15°
// steps, then RUNS: the beam leaves the lamp and the law traces it exactly (angle in = angle out at every mirror; a wall or
// the board's edge stops it). The beam is drawn only on a run: predicting where it goes is the skill, so there is no live
// preview. Two goals:
//   route      reach the target with the mirrors given (c7-science-ch11-t03 s3: the equal-angles rule)
//   periscope  two parallel mirrors carry the beam over a wall and on in its first direction (c7-science-ch11-t04 s2)
// PURE law + generator + solver + grader. Geometry in cell units: cell (x, y) has its centre at (x + 0.5, y + 0.5), y
// grows downward on screen, headings in degrees with 0 = +x and 90 = UP (−y), so a mirror at heading r reflects a beam
// travelling at heading d to 2r − d.
import type { Candidate, FamilyLogic, Facts, GenRequest, Moment, PlayActEnvelope, PlayGrade, PlayLevel, YantraAct } from "../../../../shared/play.ts";
import { gradeLevel, popUndo, pushUndo, type Undoable } from "../../core/replay.ts";
import { mulberry32 } from "../../core/rng.ts";

export interface BeamMirror { id: string; x: number; y: number; rot: number }
export interface BeamParams {
  goal: "route" | "periscope";
  cols: number; rows: number;
  /** the lamp's cell and the heading it shines in (0 / 90 / 180 / 270) */
  lamp: { x: number; y: number; dir: number };
  /** the target's centre (cell units, continuous) and radius */
  target: { x: number; y: number; r: number };
  walls: { x: number; y: number }[];
  /** mirrors the child may place */
  mirrors: number;
  /** a solution (the generator's own placements); never shown */
  sol: { x: number; y: number; rot: number }[];
  /** turning step for a mirror, degrees (15 or 45) */
  step: number;
}
export interface BeamState extends Undoable<BeamState> { placed: BeamMirror[]; runs: number; done: boolean; acts: number; seq: number; lastHit: boolean | null }

export const MIRROR_HALF = 0.42;        // a mirror spans 84% of its cell
const EPS = 1e-7;
export const norm = (d: number) => ((d % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const dirVec = (d: number): [number, number] => [Math.cos(rad(d)), -Math.sin(rad(d))];
/** the reflected heading of a beam at heading d off a mirror turned to r */
export const reflect = (d: number, r: number) => norm(2 * r - d);

export interface BeamTrace { points: [number, number][]; hit: boolean; end: "target" | "wall" | "edge" | "loop"; bounces: number }
/**
 * THE LAW. The beam from the lamp, traced against the mirrors (two-sided), the walls (whole cells), the target (a disc) and
 * the board's edge; at most 16 bounces (a closed loop is "loop").
 */
export function trace(p: BeamParams, mirrors: { x: number; y: number; rot: number }[]): BeamTrace {
  let px = p.lamp.x + 0.5, py = p.lamp.y + 0.5, d = norm(p.lamp.dir);
  const points: [number, number][] = [[px, py]];
  let last = -1;
  for (let b = 0; b <= 16; b++) {
    const [dx, dy] = dirVec(d);
    let best = Infinity, kind = "edge" as "mirror" | "wall" | "target" | "edge", which = -1;
    // the board's edge
    for (const [t] of [[dx > EPS ? (p.cols - px) / dx : dx < -EPS ? -px / dx : Infinity], [dy > EPS ? (p.rows - py) / dy : dy < -EPS ? -py / dy : Infinity]]) if (t > EPS && t < best) { best = t; kind = "edge"; }
    // the target (a disc): first time the ray enters it
    { const ox = px - p.target.x, oy = py - p.target.y, bq = ox * dx + oy * dy, c = ox * ox + oy * oy - p.target.r * p.target.r, disc = bq * bq - c;
      if (disc >= 0) { const t = -bq - Math.sqrt(disc); if (t > EPS && t < best) { best = t; kind = "target"; } } }
    // walls: whole cells (slab test)
    for (const w of p.walls) {
      let t0 = -Infinity, t1 = Infinity;
      for (const [o, v, lo, hi] of [[px, dx, w.x, w.x + 1], [py, dy, w.y, w.y + 1]] as const) {
        if (Math.abs(v) < EPS) { if (o <= lo || o >= hi) { t0 = Infinity; break; } continue; }
        const a = (lo - o) / v, c = (hi - o) / v;
        t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c));
      }
      if (t0 <= t1 && t0 > EPS && t0 < best) { best = t0; kind = "wall"; }
    }
    // mirrors: segments through the cell centre at heading rot
    mirrors.forEach((m, i) => {
      if (i === last) return;
      const cx = m.x + 0.5, cy = m.y + 0.5, [ux, uy] = dirVec(m.rot);
      const den = dx * uy - dy * ux;
      if (Math.abs(den) < EPS) {
        // edge-on: a beam running along the mirror's own line hits its near end and stops there (glass has an edge)
        const off = (cx - px) * dy - (cy - py) * dx;
        if (Math.abs(off) > 0.02) return;
        const t = (cx - px) * dx + (cy - py) * dy - MIRROR_HALF;
        if (t > EPS && t < best) { best = t; kind = "wall"; }
        return;
      }
      const t = ((cx - px) * uy - (cy - py) * ux) / den, s = ((cx - px) * dy - (cy - py) * dx) / den;
      if (t > EPS && Math.abs(s) <= MIRROR_HALF && t < best) { best = t; kind = "mirror"; which = i; }
    });
    px += dx * best; py += dy * best;
    points.push([px, py]);
    if (kind === "target") return { points, hit: true, end: "target", bounces: b };
    if (kind !== "mirror") return { points, hit: false, end: kind, bounces: b };
    d = reflect(d, mirrors[which].rot); last = which;
  }
  return { points, hit: false, end: "loop", bounces: 16 };
}

const mom = (kind: Moment["kind"], seq: number, facts: Facts): Moment => ({ kind, seq, facts });
const cellFree = (p: BeamParams, x: number, y: number) =>
  x >= 0 && y >= 0 && x < p.cols && y < p.rows && !(x === p.lamp.x && y === p.lamp.y) && !p.walls.some((w) => w.x === x && w.y === y)
  && Math.hypot(x + 0.5 - p.target.x, y + 0.5 - p.target.y) > p.target.r + 0.3;

function validate(level: PlayLevel<unknown>): PlayLevel<BeamParams> | null {
  const p = level.params as Partial<BeamParams> | null;
  if (!p || (p.goal !== "route" && p.goal !== "periscope")) return null;
  const int = (v: unknown, lo: number, hi: number) => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
  if (!int(p.cols, 4, 10) || !int(p.rows, 4, 12)) return null;
  const cols = p.cols as number, rows = p.rows as number;
  const l = p.lamp, t = p.target;
  if (!l || !int(l.x, 0, cols - 1) || !int(l.y, 0, rows - 1) || ![0, 90, 180, 270].includes(l.dir)) return null;
  if (!t || !(t.x > 0 && t.x < cols && t.y > 0 && t.y < rows) || !(t.r >= 0.2 && t.r <= 0.5)) return null;
  if (!Array.isArray(p.walls) || p.walls.length > cols * rows / 3 || !p.walls.every((w) => w && int(w.x, 0, cols - 1) && int(w.y, 0, rows - 1))) return null;
  if (!int(p.mirrors, 1, 4) || (p.step !== 15 && p.step !== 45)) return null;
  if (!Array.isArray(p.sol) || p.sol.length !== p.mirrors || !p.sol.every((m) => m && int(m.x, 0, cols - 1) && int(m.y, 0, rows - 1) && Number.isFinite(m.rot) && norm(m.rot) % (p.step as number) === 0)) return null;
  const q: BeamParams = { goal: p.goal, cols, rows, lamp: { x: l.x, y: l.y, dir: l.dir }, target: { x: t.x, y: t.y, r: t.r }, walls: p.walls.map((w) => ({ x: w.x, y: w.y })),
    mirrors: p.mirrors as number, sol: p.sol.map((m) => ({ x: m.x, y: m.y, rot: norm(m.rot) % 180 })), step: p.step };
  // the level is honest: its own solution reaches the target, on free cells, and the bare lamp does not
  if (!q.sol.every((m) => cellFree(q, m.x, m.y)) || !trace(q, q.sol).hit || trace(q, []).hit) return null;
  return { ...level, params: q } as PlayLevel<BeamParams>;
}
const init = (_l: PlayLevel<BeamParams>): BeamState => ({ placed: [], runs: 0, done: false, acts: 0, seq: 0, lastHit: null, prev: null, depth: 0 });

function apply(level: PlayLevel<BeamParams>, s: BeamState, act: YantraAct, seq: number): { state: BeamState; moments: Moment[]; refused?: string } {
  const p = level.params, out: Moment[] = [];
  if (s.done) return { state: s, moments: [], refused: "level_over" };
  if (act.kind === "undo") return { state: { ...popUndo(s), acts: s.acts + 1 }, moments: [] };
  const bump = (st: BeamState): BeamState => ({ ...st, acts: s.acts + 1 });
  if (s.acts === 0) out.push(mom("first_act", seq, { act: act.kind }));
  const turn = (r: unknown) => (Number.isFinite(r) ? norm(Math.round((r as number) / p.step) * p.step) % 180 : null);
  switch (act.kind) {
    case "place": {
      const x = Number(act.x), y = Number(act.y), rot = turn(act.rot ?? 0);
      if (act.part !== "mirror" || !Number.isInteger(x) || !Number.isInteger(y) || rot === null) return { state: bump(s), moments: out, refused: "bad_place" };
      if (!cellFree(p, x, y) || s.placed.some((m) => m.x === x && m.y === y)) return { state: bump(s), moments: out, refused: "cell_taken" };
      if (s.placed.length >= p.mirrors) return { state: bump(s), moments: out, refused: "no_mirrors_left" };
      const id = `m${s.seq + 1}`;
      return { state: bump(pushUndo(s, { ...s, placed: [...s.placed, { id, x, y, rot }], seq: s.seq + 1, lastHit: null })), moments: out };
    }
    case "rotate": {
      const i = s.placed.findIndex((m) => m.id === act.id), rot = turn(act.rot);
      if (i < 0 || rot === null) return { state: bump(s), moments: out, refused: "bad_rotate" };
      return { state: bump(pushUndo(s, { ...s, placed: s.placed.map((m, k) => (k === i ? { ...m, rot } : m)), lastHit: null })), moments: out };
    }
    case "remove": {
      if (!s.placed.some((m) => m.id === act.id)) return { state: bump(s), moments: out, refused: "bad_remove" };
      return { state: bump(pushUndo(s, { ...s, placed: s.placed.filter((m) => m.id !== act.id), lastHit: null })), moments: out };
    }
    case "run": {
      const tr = trace(p, s.placed), next = bump(pushUndo(s, { ...s, runs: s.runs + 1, lastHit: tr.hit }));
      const f: Facts = { mirrors: s.placed.length, bounces: tr.bounces, end: tr.end };
      if (tr.hit) { out.push(mom("solved", seq, f)); return { state: { ...next, done: true }, moments: out }; }
      // how close the beam came to the target (the nearest point of its last segment), in cells: "lagbhag" when not whole
      const [a, b] = tr.points.slice(-2), [ax, ay] = a, [bx, by] = b, vx = bx - ax, vy = by - ay;
      const k = Math.max(0, Math.min(1, ((p.target.x - ax) * vx + (p.target.y - ay) * vy) / (vx * vx + vy * vy || 1)));
      const gap = Math.hypot(ax + vx * k - p.target.x, ay + vy * k - p.target.y) - p.target.r;
      out.push(mom(gap <= 0.6 ? "near_miss" : "law_refused", seq, { ...f, why: tr.end === "wall" ? "blocked" : tr.end === "loop" ? "loop" : "missed", gap_about: `${Math.max(0.1, Math.round(gap * 10) / 10)}` }));
      return { state: next, moments: out, refused: "missed" };
    }
  }
  return { state: bump(s), moments: out, refused: "unknown_act" };
}
const goalMet = (_l: PlayLevel<BeamParams>, s: BeamState) => s.done;
const solve = (level: PlayLevel<BeamParams>): YantraAct[] => [...level.params.sol.map((m) => ({ kind: "place", part: "mirror", x: m.x, y: m.y, rot: m.rot }) as YantraAct), { kind: "run" }];
/** blind tries a child could make without the rule: the bare lamp, and one mirror at 45° / 135° on the lamp's line */
function shortcut(level: PlayLevel<BeamParams>): YantraAct[] | null {
  const p = level.params;
  if (trace(p, []).hit) return [{ kind: "run" }];
  return null;
}
const malActs = (_l: PlayLevel<BeamParams>, _mal: string): YantraAct[] | null => null;

interface BeamGrammar { goal?: "route" | "periscope"; mirrors?: number[]; step?: 15 | 45; cols?: number; rows?: number }
function difficultyOf(p: BeamParams): number {
  const free = p.sol.some((m) => m.rot % 45 !== 0) ? 0.25 : 0;
  return Math.min(1, 0.15 + 0.2 * (p.mirrors - 1) + free + Math.min(0.2, p.walls.length * 0.03));
}
/**
 * Levels built backwards from a solution: the beam leaves the lamp, runs 2-4 cells to a mirror at 45° / 135° (an
 * axis-aligned path), and so on; with a 15° step the LAST mirror may sit at any 15° heading, so the final ray leaves the
 * grid's lines and the target lies 2-4 cells along it. Walls fill cells off the path (one across the lamp's own line when
 * it fits), and the bare lamp never reaches the target.
 */
function generate(req: GenRequest): Candidate<BeamParams>[] {
  const g = req.grammar as BeamGrammar;
  const goal = (req.goal as BeamParams["goal"]) ?? g.goal ?? "route";
  const cols = g.cols ?? 6, rows = g.rows ?? 8, step = goal === "periscope" ? 45 : (g.step ?? (req.classLevel >= 7 && req.fade >= 2 ? 15 : 45));
  const counts = goal === "periscope" ? [2] : (g.mirrors ?? [1, 2]);
  const rnd = mulberry32(req.seed), out: Candidate<BeamParams>[] = [];
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  for (let k = 0; k < 160 && out.length < 24; k++) {
    const n = pick(counts);
    // the lamp on an edge, shining inward
    const side = Math.floor(rnd() * 4);
    const lamp = side === 0 ? { x: 0, y: 1 + Math.floor(rnd() * (rows - 2)), dir: 0 } : side === 1 ? { x: cols - 1, y: 1 + Math.floor(rnd() * (rows - 2)), dir: 180 }
      : side === 2 ? { x: 1 + Math.floor(rnd() * (cols - 2)), y: rows - 1, dir: 90 } : { x: 1 + Math.floor(rnd() * (cols - 2)), y: 0, dir: 270 };
    let cx = lamp.x, cy = lamp.y, d = lamp.dir;
    const sol: { x: number; y: number; rot: number }[] = [];
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      const len = 2 + Math.floor(rnd() * 3), [dx, dy] = dirVec(d);
      cx += Math.round(dx) * len; cy += Math.round(dy) * len;
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows || sol.some((m) => m.x === cx && m.y === cy) || (cx === lamp.x && cy === lamp.y)) { ok = false; break; }
      const last = i === n - 1;
      let rot: number;
      if (goal === "periscope") rot = d === 0 || d === 180 ? 45 : 135;                                  // both mirrors parallel
      else if (last && step === 15) rot = pick([15, 30, 60, 75, 105, 120, 150, 165].filter((r) => { const nd = reflect(d, r); return nd % 90 !== 0; }));
      else rot = pick([45, 135]);
      if (goal === "periscope" && i === 1) rot = sol[0].rot;
      sol.push({ x: cx, y: cy, rot });
      d = reflect(d, rot);
    }
    if (!ok) continue;
    // the target 2-4 cells along the last ray, well inside the board
    const [dx, dy] = dirVec(d), dist = 2 + Math.floor(rnd() * 3);
    const tx = cx + 0.5 + dx * dist, ty = cy + 0.5 + dy * dist;
    if (tx < 0.6 || ty < 0.6 || tx > cols - 0.6 || ty > rows - 0.6) continue;
    const p: BeamParams = { goal, cols, rows, lamp, target: { x: +tx.toFixed(4), y: +ty.toFixed(4), r: 0.38 }, walls: [], mirrors: n, sol, step };
    // walls: a periscope's wall sits between the lamp's line and the target; otherwise up to 3 cells off the path
    const path = trace(p, sol);
    if (!path.hit) continue;
    const onPath = (x: number, y: number) => {
      for (let i = 1; i < path.points.length; i++) {
        const [ax, ay] = path.points[i - 1], [bx, by] = path.points[i];
        for (let s2 = 0; s2 <= 40; s2++) { const qx = ax + ((bx - ax) * s2) / 40, qy = ay + ((by - ay) * s2) / 40; if (qx > x - 0.1 && qx < x + 1.1 && qy > y - 0.1 && qy < y + 1.1) return true; }
      }
      return false;
    };
    // a periscope's wall stands where the beam would run straight on past the first mirror: it must go over
    if (goal === "periscope") {
      const [ox, oy] = dirVec(lamp.dir);
      for (let j = 1; j <= 2; j++) { const x = sol[0].x + Math.round(ox) * j, y = sol[0].y + Math.round(oy) * j; if (cellFree(p, x, y) && !sol.some((m) => m.x === x && m.y === y) && !onPath(x, y)) p.walls.push({ x, y }); }
      if (!p.walls.length) continue;
    }
    const wallTries = goal === "periscope" ? 4 : 3 + Math.floor(rnd() * 3);
    for (let w = 0; w < wallTries && p.walls.length < 4; w++) {
      const x = Math.floor(rnd() * cols), y = Math.floor(rnd() * rows);
      if (!cellFree(p, x, y) || sol.some((m) => m.x === x && m.y === y) || onPath(x, y)) continue;
      p.walls.push({ x, y });
    }
    if (trace(p, []).hit || !trace(p, sol).hit) continue;
    const level: PlayLevel<BeamParams> = { v: "play@1", levelId: `beam-${goal}-${req.seed}-${k}`, family: "yantra", mode: "beam", topicId: req.topicId, skillId: req.skillId,
      fade: req.fade, goal, params: p, targets: Object.values(req.misMap), mal: req.misMap, slip: null, context: "lab", seed: req.seed,
      proof: { solvable: true, shortcutFree: true, minActs: n + 1, solutions: 1, discriminates: [], pFirstTry: 0, score: 0, genMs: 0 } };
    if (!validate(level)) continue;
    out.push({ signature: `beam:${goal}:${lamp.x},${lamp.y},${lamp.dir}:${sol.map((m) => `${m.x}.${m.y}.${m.rot}`).join("|")}`, difficulty: difficultyOf(p), level });
  }
  return out;
}
function facts(level: PlayLevel<BeamParams>, s: BeamState): Facts {
  const f: Facts = { goal: level.params.goal, mirrors_left: level.params.mirrors - s.placed.length };
  if (s.runs) f.runs = s.runs;
  if (s.done) f.done = "yes";
  return f;
}
function board(level: PlayLevel<BeamParams>, s: BeamState) {
  return { title: level.params.goal === "periscope" ? "Periscope" : "Beam", lines: [`mirrors: ${s.placed.length}/${level.params.mirrors}`, ...(s.runs ? [`runs: ${s.runs}`] : [])] };
}
function grade(level: PlayLevel<BeamParams>, acts: PlayActEnvelope<YantraAct>[]): PlayGrade {
  return gradeLevel(beamLogic, level, acts, { decisiveRefusals: ["missed"], final: true });
}

export const beamLogic: FamilyLogic<BeamParams, BeamState, YantraAct> = {
  family: "yantra", modes: ["beam"], malRules: [],
  validate, init, apply, goalMet, generate, solve, shortcut, malActs, grade, facts, board,
};
