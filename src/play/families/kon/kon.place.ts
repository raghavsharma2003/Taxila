// Kon · place (r8, c6-maths-ch02-t03, docs/design/round8/games-engine-needs.md §1): the child PLACES the protractor. An angle
// is drawn; a loose protractor lies beside it. She drags it by its body (it translates), turns it by the handle under its
// centre (it rotates about its own centre point, 1° steps), locks it ("Rakh do"), and then:
//   measure  reads the angle off the scale (tapping a number band on the scale, ±1), "Yahi hai"
//   draw     only the first arm OA is drawn: she puts a dot on the scale's rim and joins it to O or to A with the ruler
//   size     the same kind of angle twice, each under a protractor of a different size: which angle is more (or the same)?
// PURE law + generator + solver, on a fixed board of BW × BH board px (y UP, angles anticlockwise from +x, as everywhere in
// kon); the view scales the board into its box. Acts carry board coordinates, so the server replays them on any device.
//
// The law (main's condition, 2026-11-11): placement passes when the centre point is within tolPx of the vertex and the base
// line is within ±3° of an arm (the other arm crossing the scale's half-disc). The reading is graded against the angle the
// protractor AS PLACED shows. A wrong placement read "correctly" is the placement mix-up (`vertex-off`), never right: a placed
// protractor that is off can never solve, whatever is read off it.
// Mal-rules (each with its own visible signature, `shown` in the moment's facts):
//   vertex-off      the bottom edge on the vertex: the centre sits the base-to-centre depth PD off it, along the normal. The
//                   law draws the arm the protractor measures FROM ITS CENTRE: it starts PD away from the corner and runs
//                   beside the true arm, never on it ("centre_off")
//   wrong-scale     the other scale's number: 180 − θ ("other_scale")
//   join-wrong-end  draw: the dot at the right mark, joined to A (the far end of OA): the law shows the angle made at A
//                   ("far_end")
//   tool-size       size: the angle under the bigger protractor picked as the bigger angle: both readings side by side
//                   ("both_readings")
import type { Facts, Moment } from "../../../../shared/play.ts";

export type PlaceGoal = "measure" | "draw" | "size";
export const PLACE_GOALS: readonly PlaceGoal[] = ["measure", "draw", "size"];
export const PLACE_MAL = ["vertex-off", "join-wrong-end", "tool-size"] as const;
export const isPlaceGoal = (g: string | undefined): g is PlaceGoal => PLACE_GOALS.includes(g as PlaceGoal);

/** the board (board px; at a 360 px phone the play canvas is about 324-360 × 350-420 px, so 1 board px ≥ 1 CSS px there and
 *  the protractor is ≥ 200 px wide) */
export const BW = 320, BH = 340;
/** protractor radius, the base-to-centre depth (the strip under the base line down to the bottom edge), arm length */
export const PR = 105, PD = 20, ARM = 130;
/** size: the two protractors' radii */
export const R_BIG = 108, R_SMALL = 78;
/** base within ±BASE_TOL° of an arm; a reading within READ_TOL of what the scale shows */
export const BASE_TOL = 3, READ_TOL = 2;
/** where the loose protractor rests at the start: low on the board, under the angle (its centre's y) */
export const REST_Y = PD + 8;
/** the angle's figure stays above this line (the resting protractor, with its numbers, stays under it) */
export const FIG_LO = 156;
/** the turning handle: on the protractor's body, half way up from the centre, at the scale's 90 */
export const KNOB_AT = 0.5;

export interface PlaceFields {
  /** the vertex O, the first arm's heading a1 (= start), the angle θ (theta), the second arm on the clockwise side (mirror) */
  vx?: number; vy?: number;
  /** the centre tolerance, board px */
  tolPx?: number;
  /** the loose protractor's start pose */
  x0?: number; y0?: number; r0?: number;
  /** size: the angle at P (top) and Q (bottom), each opening from a base at 0° (or from 180°, mirrored); P under the big one */
  thA?: number; thB?: number; bigA?: boolean; mirA?: boolean; mirB?: boolean;
}
export interface PlaceParamsLike extends PlaceFields { goal: string; start: number; theta?: number; mirror?: boolean; tol: number; scale: "10" | "30" | "landmarks" }
export interface Pose { x: number; y: number; rot: number }
export interface Placed { centreErrPx: number; baseErrDeg: number; ok: boolean; arm: number; zeroOnArm: boolean }
export interface PlaceState {
  pose: Pose; locked: boolean; mark: number | null;
  /** the placement at the first committed decision (the evidence's `placed`) */
  first: Placed | null; read: number | null; joined: "v" | "e" | null; pick: string | null; made: number | null;
}

export const norm = (d: number) => ((d % 360) + 360) % 360;
export const diff = (a: number, b: number) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, 360 - d); };
const R = (d: number) => (d * Math.PI) / 180;
const D = (r: number) => (r * 180) / Math.PI;
export const dir = (h: number): [number, number] => [Math.cos(R(h)), Math.sin(R(h))];
const headingOf = (dx: number, dy: number) => norm(D(Math.atan2(dy, dx)));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** the arms' headings: measure has two (OA at a1, OB at a1 ± θ); draw only OA */
export function arms(p: PlaceParamsLike): number[] {
  return p.goal === "measure" ? [norm(p.start), norm(p.start + (p.mirror ? -1 : 1) * (p.theta ?? 0))] : [norm(p.start)];
}
const V = (p: PlaceParamsLike): [number, number] => [p.vx ?? 0, p.vy ?? 0];
/** the far end A of the first arm */
export const farEnd = (p: PlaceParamsLike): [number, number] => { const [x, y] = V(p), [c, s] = dir(p.start); return [x + ARM * c, y + ARM * s]; };
/** a point on the protractor's rim at rim angle r (0 … 180 from the outer scale's 0, anticlockwise) */
export const rimPoint = (pose: Pose, r: number, rad = PR): [number, number] => { const [c, s] = dir(pose.rot + r); return [pose.x + rad * c, pose.y + rad * s]; };
/** the rim angle of a point seen from the protractor's centre (−180 … 180 about the half-disc) */
export const rimAngleOf = (pose: Pose, x: number, y: number) => { const a = norm(headingOf(x - pose.x, y - pose.y) - pose.rot); return a > 270 ? a - 360 : a; };
/** the normal into the half-disc */
export const inward = (pose: Pose) => dir(pose.rot + 90);

/**
 * How the protractor sits on the angle: the centre's distance from the vertex, the base line's angle off the best arm, and
 * whether that is a placement (centre within tolPx, base within ±3°, and for measure the other arm crossing the half-disc).
 * `zeroOnArm`: the OUTER scale's 0 lies on that arm (else the inner scale's 0 does).
 */
export function placement(p: PlaceParamsLike, pose: Pose): Placed {
  const [vx, vy] = V(p), hs = arms(p);
  const centreErrPx = r1(Math.hypot(pose.x - vx, pose.y - vy));
  let best: { e: number; arm: number; zero: boolean; inside: boolean } | null = null;
  hs.forEach((h, k) => {
    const e0 = diff(pose.rot, h), e180 = diff(pose.rot + 180, h), e = Math.min(e0, e180);
    let inside = true;
    if (hs.length === 2) { const rel = norm(hs[1 - k] - pose.rot); inside = rel >= 2 && rel <= 178; }
    // a base that puts the other arm inside the half-disc wins over one that does not
    if (!best || (inside && !best.inside) || (inside === best.inside && e < best.e)) best = { e, arm: k, zero: e0 <= e180, inside };
  });
  const b = best as unknown as { e: number; arm: number; zero: boolean; inside: boolean };
  const tolPx = p.tolPx ?? 8;
  return { centreErrPx, baseErrDeg: r1(b.e), ok: centreErrPx <= tolPx && b.e <= BASE_TOL && b.inside, arm: b.arm, zeroOnArm: b.zero };
}
/** the number on the scale whose 0 sits on the placed arm, at rim angle r */
export const scaleValue = (pl: Pick<Placed, "zeroOnArm">, r: number) => (pl.zeroOnArm ? r : 180 - r);

/**
 * measure: what the protractor AS PLACED shows for the angle: where the other arm (from the true vertex) crosses the rim,
 * read on the scale whose 0 is on the placed arm. null when that arm never crosses the half-disc.
 */
export function asPlaced(p: PlaceParamsLike, pose: Pose, pl = placement(p, pose)): { r: number; value: number; at: [number, number] } | null {
  const hs = arms(p);
  if (hs.length < 2) return null;
  const [vx, vy] = V(p), [ux, uy] = dir(hs[1 - pl.arm]);
  const dx = vx - pose.x, dy = vy - pose.y, b = dx * ux + dy * uy, c = dx * dx + dy * dy - PR * PR, disc = b * b - c;
  if (disc < 0) return null;
  for (const t of [-b + Math.sqrt(disc), -b - Math.sqrt(disc)]) {
    if (t < 0 || t > ARM) continue;
    const x = vx + t * ux, y = vy + t * uy, r = rimAngleOf(pose, x, y);
    if (r < -0.5 || r > 180.5) continue;
    return { r: r1(r), value: r1(scaleValue(pl, r)), at: [x, y] };
  }
  return null;
}
/** draw: the angle the drawn arm makes: at O (joined to O) or at A (joined to A, the far end), degrees 0 … 180 */
export function madeAngle(p: PlaceParamsLike, pose: Pose, mark: number, end: "v" | "e"): number {
  const [dx, dy] = rimPoint(pose, mark), [vx, vy] = V(p);
  if (end === "v") return r1(diff(p.start, headingOf(dx - vx, dy - vy)));
  const [ex, ey] = farEnd(p);
  return r1(diff(p.start + 180, headingOf(dx - ex, dy - ey)));
}
/** the pose of the solver: centre on O, the base on OA, the outer 0 on OA (or the inner 0, when the angle opens clockwise:
 *  measure's OB, or the side draw's figure leaves room on; draw accepts either side) */
export function goodPose(p: PlaceParamsLike): Pose {
  const [vx, vy] = V(p);
  return { x: vx, y: vy, rot: p.mirror ? norm(p.start + 180) : norm(p.start) };
}
/** the rim angle where the scale whose 0 is on the placed arm reads v */
export const markFor = (p: PlaceParamsLike, pose: Pose, v: number) => (placement(p, pose).zeroOnArm ? v : 180 - v);
/** vertex-off: the same base, but the bottom edge on O, so the centre sits PD off it, into the half-disc */
export function vertexOffPose(p: PlaceParamsLike): Pose {
  const g = goodPose(p), [nx, ny] = inward(g);
  return { x: r1(g.x + PD * nx), y: r1(g.y + PD * ny), rot: g.rot };
}
/** does this pose sit on the angle the vertex-off way (the base along an arm, the bottom edge at O)? */
export function isVertexOff(p: PlaceParamsLike, pose: Pose): boolean {
  const pl = placement(p, pose);
  if (pl.baseErrDeg > BASE_TOL) return false;
  if (p.goal === "measure") { const hs = arms(p), rel = norm(hs[1 - pl.arm] - pose.rot); if (rel < 2 || rel > 178) return false; }
  const [nx, ny] = inward(pose), [vx, vy] = V(p);
  return Math.hypot(pose.x - (vx + PD * nx), pose.y - (vy + PD * ny)) <= (p.tolPx ?? 8);
}
/** size: the right answer: "a" (P is more), "b" (Q is more) or "same"; and the bigger tool's angle */
export const sizeAnswer = (p: PlaceFields) => (p.thA === p.thB ? "same" : (p.thA ?? 0) > (p.thB ?? 0) ? "a" : "b");
export const bigOne = (p: PlaceFields) => (p.bigA ? "a" : "b");
/** size: each angle's vertex and protractor radius (P on top: its numbers stay 10 px under the board's top; Q's strip and
 *  name stay above the bottom) */
export function sizeFigs(p: PlaceFields): { v: [number, number]; rad: number; th: number; mirror: boolean }[] {
  const ra = p.bigA ? R_BIG : R_SMALL, rb = p.bigA ? R_SMALL : R_BIG;
  return [
    { v: [BW / 2, BH - 10 - ra - 18], rad: ra, th: p.thA ?? 0, mirror: !!p.mirA },
    { v: [BW / 2, Math.round(PD * (rb / PR)) + 30], rad: rb, th: p.thB ?? 0, mirror: !!p.mirB },
  ];
}

// ───────────────────────────── acts and the law ─────────────────────────────

export type PlaceAct =
  | { kind: "move"; x: number; y: number } | { kind: "spin"; deg: number } | { kind: "lock" } | { kind: "free" }
  | { kind: "read"; n: number } | { kind: "mark"; r: number } | { kind: "join"; end: "v" | "e" } | { kind: "pick"; which: "a" | "b" | "same" };
export const PLACE_ACTS = ["move", "spin", "lock", "free", "read", "mark", "join", "pick"];
export const initPlace = (p: PlaceParamsLike): PlaceState => ({ pose: { x: p.x0 ?? BW / 2, y: p.y0 ?? REST_Y, rot: norm(p.r0 ?? 0) }, locked: false, mark: null, first: null, read: null, joined: null, pick: null, made: null });

export type StepOut = { pl?: PlaceState; refused?: string; commit?: { kind: Moment["kind"]; facts: Facts; mis?: string; done?: boolean } };
const isInt = (v: unknown, lo: number, hi: number) => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const half = (v: number) => Math.round(v * 2) / 2;

/** one act on the place state (the caller wraps it in undo, counts and moments) */
export function stepPlace(p: PlaceParamsLike, s: PlaceState, a: PlaceAct, mal: Record<string, string>): StepOut {
  const k = a.kind;
  if (p.goal === "size") {
    if (k !== "pick") return { refused: "unknown_act" };
    if (a.which !== "a" && a.which !== "b" && a.which !== "same") return { refused: "bad_pick" };
    return commitSize(p, { ...s, pick: a.which }, mal);
  }
  if (k === "move") {
    if (s.locked) return { refused: "locked" };
    const x = Number(a.x), y = Number(a.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < -40 || x > BW + 40 || y < -40 || y > BH + 40) return { refused: "bad_move" };
    return { pl: { ...s, pose: { ...s.pose, x: half(x), y: half(y) } } };
  }
  if (k === "spin") {
    if (s.locked) return { refused: "locked" };
    const d = Number(a.deg);
    if (!Number.isFinite(d)) return { refused: "bad_turn" };
    return { pl: { ...s, pose: { ...s.pose, rot: norm(Math.round(d)) } } };   // the 1° snap is the law's, not the view's
  }
  if (k === "lock") return s.locked ? { refused: "locked" } : { pl: { ...s, locked: true, mark: null } };
  if (k === "free") return s.locked ? { pl: { ...s, locked: false, mark: null } } : { refused: "not_locked" };
  if (k === "read") {
    if (p.goal !== "measure") return { refused: "unknown_act" };
    if (!s.locked) return { refused: "lock_first" };
    const n = Number(a.n);
    if (!isInt(n, 0, 180)) return { refused: "bad_read" };
    return commitMeasure(p, { ...s, read: n }, mal);
  }
  if (k === "mark") {
    if (p.goal !== "draw") return { refused: "unknown_act" };
    if (!s.locked) return { refused: "lock_first" };
    const r = Number(a.r);
    if (!isInt(r, 0, 180)) return { refused: "bad_mark" };
    return { pl: { ...s, mark: r } };
  }
  if (k === "join") {
    if (p.goal !== "draw") return { refused: "unknown_act" };
    if (!s.locked) return { refused: "lock_first" };
    if (s.mark === null) return { refused: "mark_first" };
    if (a.end !== "v" && a.end !== "e") return { refused: "bad_join" };
    return commitDraw(p, { ...s, joined: a.end }, mal);
  }
  return { refused: "unknown_act" };
}
const placedFacts = (pl: Placed): Facts => ({ placed: pl.ok ? "ok" : "off", centre_px: Math.round(pl.centreErrPx), base_deg: Math.round(pl.baseErrDeg) });

function commitMeasure(p: PlaceParamsLike, s: PlaceState, mal: Record<string, string>): StepOut {
  const pl = placement(p, s.pose), n = s.read as number, next = { ...s, first: s.first ?? pl };
  const f: Facts = { ...placedFacts(pl), read: n };
  if (!pl.ok) {
    // a placement that is off never solves, whatever is read off it (main's condition): the bottom edge on O is vertex-off
    if ("vertex-off" in mal && isVertexOff(p, s.pose)) {
      const ap = asPlaced(p, s.pose, pl);
      return { pl: next, commit: { kind: "misconception_consequence", mis: "vertex-off", facts: { ...f, shown: "centre_off", ...(ap ? { scale: Math.round(ap.value) } : {}) } } };
    }
    return { pl: next, commit: { kind: "law_refused", facts: { ...f, why: "placed_off" } } };
  }
  const ap = asPlaced(p, s.pose, pl);
  if (!ap) return { pl: next, commit: { kind: "law_refused", facts: { ...f, why: "placed_off" } } };
  const e = Math.abs(n - ap.value);
  if (e <= READ_TOL) return { pl: next, commit: { kind: "solved", done: true, facts: f } };
  if ("wrong-scale" in mal && Math.abs(n - (180 - ap.value)) <= READ_TOL && Math.abs(180 - 2 * ap.value) > 2 * READ_TOL)
    return { pl: next, commit: { kind: "misconception_consequence", mis: "wrong-scale", facts: { ...f, shown: "other_scale" } } };
  return { pl: next, commit: { kind: e <= 2 * READ_TOL + 1 ? "near_miss" : "law_refused", facts: { ...f, gap: `${Math.round(e)}°`, why: "read_off" } } };
}
function commitDraw(p: PlaceParamsLike, s: PlaceState, mal: Record<string, string>): StepOut {
  const pl = placement(p, s.pose), mark = s.mark as number, end = s.joined as "v" | "e";
  const made = madeAngle(p, s.pose, mark, end), next = { ...s, first: s.first ?? pl, made };
  const f: Facts = { ...placedFacts(pl), made: `${Math.round(made)}°`, at: end === "v" ? "O" : "A" };
  const th = p.theta ?? 0, mv = scaleValue(pl, mark);
  if (!pl.ok) {
    if ("vertex-off" in mal && isVertexOff(p, s.pose)) return { pl: next, commit: { kind: "misconception_consequence", mis: "vertex-off", facts: { ...f, shown: "centre_off" } } };
    return { pl: next, commit: { kind: "law_refused", facts: { ...f, why: "placed_off" } } };
  }
  // placed: the mark is graded on the protractor as placed (the scale whose 0 is on OA), and the arm must start at O
  if (end === "v" && Math.abs(mv - th) <= READ_TOL) return { pl: next, commit: { kind: "solved", done: true, facts: f } };
  if (end === "e") {
    if ("join-wrong-end" in mal && Math.abs(mv - th) <= READ_TOL) return { pl: next, commit: { kind: "misconception_consequence", mis: "join-wrong-end", facts: { ...f, shown: "far_end" } } };
    return { pl: next, commit: { kind: "law_refused", facts: { ...f, why: "far_end" } } };
  }
  if ("wrong-scale" in mal && Math.abs(mv - (180 - th)) <= READ_TOL && Math.abs(180 - 2 * th) > 2 * READ_TOL)
    return { pl: next, commit: { kind: "misconception_consequence", mis: "wrong-scale", facts: { ...f, shown: "other_scale" } } };
  const e = Math.abs(mv - th);
  return { pl: next, commit: { kind: e <= 2 * READ_TOL + 1 ? "near_miss" : "law_refused", facts: { ...f, gap: `${Math.round(e)}°`, why: "landed_off" } } };
}
function commitSize(p: PlaceParamsLike, s: PlaceState, mal: Record<string, string>): StepOut {
  const f: Facts = { pick: s.pick as string };
  if (s.pick === sizeAnswer(p)) return { pl: s, commit: { kind: "solved", done: true, facts: f } };
  if ("tool-size" in mal && s.pick === bigOne(p)) return { pl: s, commit: { kind: "misconception_consequence", mis: "tool-size", facts: { ...f, shown: "both_readings" } } };
  return { pl: s, commit: { kind: "law_refused", facts: { ...f, why: "other_angle" } } };
}

/** the solver's acts */
export function solvePlace(p: PlaceParamsLike): PlaceAct[] {
  if (p.goal === "size") return [{ kind: "pick", which: sizeAnswer(p) as "a" | "b" | "same" }];
  const g = goodPose(p), head: PlaceAct[] = [{ kind: "move", x: g.x, y: g.y }, { kind: "spin", deg: g.rot }, { kind: "lock" }];
  return p.goal === "measure" ? [...head, { kind: "read", n: p.theta ?? 0 }] : [...head, { kind: "mark", r: markFor(p, g, p.theta ?? 0) }, { kind: "join", end: "v" }];
}
/** a mal-rule's acts (null when the belief makes no different move here) */
export function malPlace(p: PlaceParamsLike, mal: string): PlaceAct[] | null {
  const th = p.theta ?? 0;
  if (p.goal === "size") return mal === "tool-size" && bigOne(p) !== sizeAnswer(p) ? [{ kind: "pick", which: bigOne(p) }] : null;
  const g = goodPose(p), at = (q: Pose): PlaceAct[] => [{ kind: "move", x: q.x, y: q.y }, { kind: "spin", deg: q.rot }, { kind: "lock" }];
  if (mal === "vertex-off") {
    const q = vertexOffPose(p);
    if (p.goal === "measure") {
      // she reads the misplaced protractor CORRECTLY: the number it shows as placed (main's condition)
      const ap = asPlaced(p, q);
      return ap ? [...at(q), { kind: "read", n: Math.round(ap.value) }] : null;
    }
    return [...at(q), { kind: "mark", r: markFor(p, q, th) }, { kind: "join", end: "v" }];
  }
  if (mal === "wrong-scale" && Math.abs(180 - 2 * th) > 2 * READ_TOL) return p.goal === "measure" ? [...at(g), { kind: "read", n: 180 - th }] : [...at(g), { kind: "mark", r: markFor(p, g, 180 - th) }, { kind: "join", end: "v" }];
  if (mal === "join-wrong-end" && p.goal === "draw") return [...at(g), { kind: "mark", r: markFor(p, g, th) }, { kind: "join", end: "e" }];
  return null;
}
/**
 * Without the concept a child can: point at a landmark (0 / 90 / 180 on the scale), lock the protractor where it lies, or
 * (size) take the angle under the bigger tool. A level any of these passes is never served.
 */
export function shortcutPlace(p: PlaceParamsLike, mal: Record<string, string>): PlaceAct[] | null {
  if (p.goal === "size") return bigOne(p) === sizeAnswer(p) ? [{ kind: "pick", which: bigOne(p) }] : null;
  const th = p.theta ?? 0;
  if ([0, 90, 180].some((l) => Math.abs(th - l) <= Math.max(10, 2 * p.tol))) {
    const l = [0, 90, 180].find((x) => Math.abs(th - x) <= Math.max(10, 2 * p.tol)) as number, g = goodPose(p);
    const head: PlaceAct[] = [{ kind: "move", x: g.x, y: g.y }, { kind: "spin", deg: g.rot }, { kind: "lock" }];
    return p.goal === "measure" ? [...head, { kind: "read", n: l }] : [...head, { kind: "mark", r: markFor(p, g, l) }, { kind: "join", end: "v" }];
  }
  // the protractor as it lies: locked where it rests, any landmark read / marked there
  const rest = initPlace(p);
  if (placement(p, rest.pose).ok) return [{ kind: "lock" }];
  void mal;
  return null;
}

// ───────────────────────────── facts, validation, generation ─────────────────────────────

/** the value the child is working towards, as on-screen facts (measure: nothing; the angle's size IS the answer) */
export function placeValueFacts(p: PlaceParamsLike): Facts {
  if (p.goal === "draw") return { angle: `${p.theta}°` };
  if (p.goal === "size") return { compare: "P,Q" };
  return { measure: "AOB" };
}
/** the evidence beyond the trail: the placement at the first committed decision, and what was read */
export function placeEvidence(s: PlaceState | undefined): { placed: { centreErrPx: number; baseErrDeg: number; ok: boolean } | null; read: number | null } {
  const f = s?.first ?? null;
  return { placed: f ? { centreErrPx: f.centreErrPx, baseErrDeg: f.baseErrDeg, ok: f.ok } : null, read: s?.read ?? null };
}
export function placeFacts(p: PlaceParamsLike, s: PlaceState | undefined, p0: Facts): Facts {
  const f: Facts = { ...p0 };
  if (!s || p.goal === "size") { if (s?.pick) f.pick = s.pick; return f; }
  const pl = s.first ?? (s.locked ? placement(p, s.pose) : null);
  if (pl) Object.assign(f, placedFacts(pl));
  if (s.read !== null) f.read = s.read;
  if (s.made !== null) f.made = `${Math.round(s.made)}°`;
  if (s.locked) f.locked = "yes";
  return f;
}
const fin = (v: unknown, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
export function validatePlace<P extends PlaceParamsLike>(q: Partial<P>): P | null {
  const tol = Number(q.tol), scale = q.scale === "30" || q.scale === "landmarks" ? q.scale : "10";
  if (!(tol >= 1 && tol <= 15)) return null;
  if (q.goal === "size") {
    const thA = fin(q.thA, 10, 170), thB = fin(q.thB, 10, 170);
    if (thA === null || thB === null || !Number.isInteger(thA) || !Number.isInteger(thB)) return null;
    return { goal: "size", start: 0, tol, scale, thA, thB, bigA: !!q.bigA, mirA: !!q.mirA, mirB: !!q.mirB } as unknown as P;
  }
  const theta = Number(q.theta), vx = fin(q.vx, 0, BW), vy = fin(q.vy, 0, BH), tolPx = fin(q.tolPx ?? 8, 3, 15);
  const x0 = fin(q.x0, 0, BW), y0 = fin(q.y0, 0, BH), r0 = Number(q.r0), start = Number(q.start);
  if (!Number.isInteger(theta) || theta < 10 || theta > 170 || vx === null || vy === null || tolPx === null || x0 === null || y0 === null) return null;
  if (!Number.isFinite(r0) || !Number.isFinite(start)) return null;
  // the base-to-centre depth must stay outside the centre tolerance, or vertex-off would be a placement
  if (tolPx >= PD / 2) return null;
  return { goal: q.goal, start: norm(start), theta, mirror: !!q.mirror, tol, scale, vx, vy, tolPx, x0, y0, r0: norm(r0) } as unknown as P;
}

/** every point a placed protractor (rim, labels, strip) covers, for the board fit */
function poseFits(pose: Pose, rad = PR): boolean {
  const pts: [number, number][] = [];
  for (let r = 0; r <= 180; r += 10) pts.push(rimPoint(pose, r, rad + 18));
  // the outer 0 and 180 sit off the base line, and their numbers run wider than the rim
  pts.push(rimPoint(pose, 5, rad + 28), rimPoint(pose, 175, rad + 28));
  const [nx, ny] = inward(pose), [bx, by] = dir(pose.rot);
  for (const s of [-1, 1]) pts.push([pose.x + s * bx * (rad + 4) - nx * PD, pose.y + s * by * (rad + 4) - ny * PD]);
  return pts.every(([x, y]) => x >= 2 && x <= BW - 2 && y >= 2 && y <= BH - 2);
}
/** an arm's end with its letter (16 px, 24 board px beyond the end) on the board and above the resting protractor */
const inBoard = ([x, y]: [number, number], lo = FIG_LO) => x >= 32 && x <= BW - 32 && y >= lo && y <= BH - 32;

/** the generator's grid: θ every 5° (readable off 5° ticks), away from the landmarks; the figure fits the board */
export function generatePlace(goal: PlaceGoal, g: { tol?: number; tolPx?: number }, rnd: () => number, fade: number): { params: PlaceParamsLike; sig: string }[] {
  const out: { params: PlaceParamsLike; sig: string }[] = [], seen = new Set<string>();
  const scale: PlaceParamsLike["scale"] = fade === 1 ? "10" : fade === 2 ? "30" : "landmarks";
  const tol = g.tol ?? 3, tolPx = g.tolPx ?? 8;
  if (goal === "size") {
    for (let k = 0; k < 40 && out.length < 16; k++) {
      const equal = rnd() < 0.5, small = 30 + 5 * Math.floor(rnd() * 25);   // 30 … 150
      const big = equal ? small : small - (15 + 5 * Math.floor(rnd() * 6));
      if (big < 20 || [small, big].some((t) => Math.abs(t - 90) < 10)) continue;
      const bigA = rnd() < 0.5, mirA = rnd() < 0.4, mirB = rnd() < 0.4;
      const params: PlaceParamsLike = { goal, start: 0, tol, scale, thA: bigA ? big : small, thB: bigA ? small : big, bigA, mirA, mirB };
      const sig = `size:${params.thA}:${params.thB}:${bigA ? "A" : "B"}${mirA ? "m" : ""}${mirB ? "m" : ""}`;
      if (seen.has(sig)) continue;
      seen.add(sig); out.push({ params, sig });
    }
    return out;
  }
  for (let k = 0; k < 200 && out.length < 24; k++) {
    const theta = 20 + 5 * Math.floor(rnd() * 29);                          // 20° … 160°
    if ([0, 90, 180].some((l) => Math.abs(theta - l) <= Math.max(10, 2 * tol))) continue;
    // the angle opens upward (its bisector 40° … 140°; the protractor rests below it). fade 1: the first arm lies flat or near
    // it; then any tilt (turning the protractor is part of the skill). mirror: the angle opens clockwise from OA
    const mirror = rnd() < 0.45;
    const tilt = fade === 1 ? (rnd() < 0.5 ? 0 : 5 * Math.floor(rnd() * 5) - 10) : 5 * Math.floor(rnd() * 21) - 50;
    const a1 = norm(5 * Math.round(((mirror ? 180 : 0) + tilt) / 5));
    // the figure (O and the ends of both arms: draw's OA and the arm the solver draws) centred across the board, as low as
    // the resting protractor lets it sit, then nudged a little
    const hs = [a1, norm(a1 + (mirror ? -1 : 1) * theta)], ends = [[0, 0], ...hs.map((h) => dir(h).map((v) => v * ARM))];
    const xs = ends.map((e) => e[0]), ys = ends.map((e) => e[1]);
    const vx = Math.round(BW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 + (rnd() - 0.5) * 24);
    const vy = Math.round(Math.max(FIG_LO + 16, FIG_LO + 4 - Math.min(...ys)) + rnd() * 24);
    const x0 = 140 + Math.floor(rnd() * 41), r0 = norm(Math.floor(rnd() * 21) - 10);
    const params: PlaceParamsLike = { goal, start: a1, theta, mirror, tol, scale, vx, vy, tolPx, x0, y0: REST_Y, r0 };
    const sig = `place:${goal}:${theta}:${a1}${mirror ? "m" : ""}`;
    if (seen.has(sig)) continue;
    // the figure fits: both arms and O's letter stay on the board, above the resting protractor; the placed protractor (and
    // the vertex-off one) and the resting one fit the board too
    if (!hs.every((h) => { const [c, s] = dir(h); return inBoard([vx + ARM * c, vy + ARM * s]); }) || !inBoard([vx, vy - 16])) continue;
    const good = goodPose(params), vo = vertexOffPose(params), rest = initPlace(params).pose;
    if (!poseFits(good) || !poseFits(vo) || !poseFits(rest) || rest.y + PR + 18 > FIG_LO) continue;
    // the rest pose is no placement, and the mal-rules show: vertex-off moves the reading (measure) or the made angle (draw)
    if (placement(params, initPlace(params).pose).ok) continue;
    if (goal === "measure") {
      const ap = asPlaced(params, vo);
      if (!ap || Math.abs(ap.value - theta) < 3) continue;
    } else {
      if (Math.abs(madeAngle(params, vo, markFor(params, vo, theta), "v") - theta) < 4) continue;
      if (Math.abs(madeAngle(params, good, markFor(params, good, theta), "e") - theta) < 3 * tol) continue;
    }
    seen.add(sig); out.push({ params, sig });
  }
  return out;
}
export function placeDifficulty(p: PlaceParamsLike): number {
  if (p.goal === "size") return Math.min(1, 0.35 + (p.thA === p.thB ? 0.1 : 0) + (p.mirA || p.mirB ? 0.1 : 0) + (p.scale === "landmarks" ? 0.2 : p.scale === "30" ? 0.1 : 0));
  return Math.min(1, (p.goal === "draw" ? 0.45 : 0.4) + (p.start % 180 ? 0.15 : 0) + (p.mirror ? 0.1 : 0) + (p.scale === "landmarks" ? 0.2 : p.scale === "30" ? 0.1 : 0));
}
/** what the teacher may not say first: measure's reading (the angle's size); draw gives its angle; size's numbers are on screen */
export const placeHidden = (p: PlaceParamsLike): number[] => (p.goal === "measure" ? [p.theta ?? 0] : []);
