// Gate 2 for kon/place (night rulings 2026-11-11, dc-r8-game-gate-play-then-evidence): "nothing reaches the teacher from
// one join press, and give the tolerance that names vertex-off". Law 3's number: an act that a blind guess or one ordinary
// slip produces more than 1 time in 10 names nothing by itself.
//
// Every number in the packet's "Gate 2: evidence" section is computed here, over every generated measure and draw level
// (fades 1-3, eight seeds, the coverage's own kit map), from the board, the protractor, the pad as the view lays it out and
// the law's own predicates (isVertexOff / isCentreOnArm / placement), and asserted. With KON_GATE2_PRINT=<file> the tables
// are written to that file as JSON (the packet is printed from them).
//
//   vertex-off      a placement (constructed). Its band, the slips, a blind placement, a drop that misses.
//   centre-on-arm   a placement (constructed), where a level maps it. The same four.
//   wrong-scale     a typed number (measure) or a dot on the rim (draw), constructed. Blind, typing slips on the pad, tick
//                   slips, dot nudges.
//   join-wrong-end  a pick of one of two buttons: the server names it on the fourth sighting, four different asked sizes
//                   with both button orders among them (konLogic.chanceRepeat).
//   size            one pick among three; names no mix-up (the kit's tool-size is not claimed).
// Law 3 read per session (2026-11-16): each mix-up's chance a level (the worst of a blind act, one slip, a drop that
// misses) over the NAMING_LEVELS levels a session names from. Named from one level, vertex-off, wrong-scale and draw's
// wrong-scale were over 1 in 10 a session, so every kon/place mix-up is now a pick: one level names nothing (chanceMis),
// the server names it on a second level that differs (the join: on the fourth). The session table is computed and asserted.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { konLogic } from "../src/play/families/kon/kon.logic.ts";
import { BW, BH, PR, PD, ARM, TOL_PX, VO_BAND, BASE_TOL, READ_TOL, SCALE_SLIP_READS, typedSlips, PAD, PAD_COLS as LAW_PAD_COLS, arms, asPlaced, dir, drawSurface, farEnd, goodPose, initPlace, inward, isCentreOnArm, isVertexOff, joinAFirst, markFor, norm, placement, vertexOffPose } from "../src/play/families/kon/kon.place.ts";
import { env } from "../src/play/core/pick.ts";
import { coverage, entryKey, levelsFor, seedOf, nameOnRepeat, afterLevelBody, repeatMet, repeatSpec, surfaceOf, surfacesDiffer, CHANCE_MEMORY, NAMING_LEVELS } from "../server/play/levels.js";
import { atLeast, fromOne, oneIn } from "./_session-figure.mjs";
import { gradeActs, lessonEvidence, chancePick, withNaming } from "../server/play/grade.js";
import { signSession, verifySession } from "../server/play/session.js";
import { CHANCE_WEIGHT, GAME_WEIGHT, namingOn, playFactsRow } from "../shared/play.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const LAW3 = 0.1;
const PE = (goal) => coverage().entries.find((e) => e.family === "kon" && e.mode === "place" && e.goal === goal);
// the coverage's own kit map, centre-on-arm added with the id it takes at integration 49 (the kit's split)
const COA = "c6-maths-ch02-t03-m-centre-on-arm";
const req = (goal, seed, fade) => ({ family: "kon", mode: "place", goal, topicId: "c6-maths-ch02-t03", skillId: PE(goal).skillId, classLevel: 6, fade, mis: {},
  misMap: { ...PE(goal).misMap, "centre-on-arm": COA }, grammar: PE(goal).grammar, recent: [], seed });
const SEEDS = [1, 7, 42, 99, 123, 512, 777, 2024];
function all(goal) {
  const seen = new Set(), out = [];
  for (const fade of [1, 2, 3]) for (const sd of SEEDS) for (const c of konLogic.generate(req(goal, sd, fade))) {
    const lv = konLogic.validate(c.level), k = JSON.stringify(lv.params);
    if (!seen.has(k)) { seen.add(k); out.push(lv); }
  }
  return out;
}
const LEVELS = { measure: all("measure"), draw: all("draw") };
const at = ([x, y], h, r) => { const [c, s] = dir(h); return [x + r * c, y + r * s]; };
const pose = ([x, y], rot) => ({ x, y, rot: norm(rot) });

// ───────────────────────────── the placements: vertex-off and centre-on-arm ─────────────────────────────
// A pose is a centre (x, y) and a turn (whole degrees: the law's 1° snap). A blind placement: the centre anywhere on the
// board, evenly; the turn any of 360, evenly. Near the vertex: the centre anywhere within PR of O. The chance is bounded
// from above by (turns the band admits) × (its disc's area) / (all turns × the area): every band is a disc of the centre,
// for each admitted turn, so a sum of disc areas bounds their union and their part on the board.
/** the centres of the bands at turn r: vertex-off's (the bottom edge's middle on O), centre-on-arm's (the centre mark on
 *  an arm's end; the protractor's corner on O, either corner) */
function bandCentres(p, r) {
  const O = [p.vx, p.vy], [nx, ny] = inward({ rot: r }), [bx, by] = dir(r);
  const ends = arms(p).map((h) => at(O, h, ARM));
  return {
    vo: [[O[0] + PD * nx, O[1] + PD * ny]],
    coa: [...ends, ...[-1, 1].map((sd) => [O[0] - sd * PR * bx + PD * nx, O[1] - sd * PR * by + PD * ny])],
  };
}
function placementTable(p) {
  const g = goodPose(p), O = [p.vx, p.vy], tol = p.tolPx ?? TOL_PX;
  let kVo = 0, kCoa = 0;
  for (let r = 0; r < 360; r++) {
    const b = bandCentres(p, r);
    for (const c of b.vo) if (isVertexOff(p, pose(c, r)) && !placement(p, pose(c, r)).ok) kVo++;
    for (const c of b.coa) if (isCentreOnArm(p, pose(c, r)) && !placement(p, pose(c, r)).ok) kCoa++;
  }
  // the band IS the disc: at the solver's turn, 72 ways round the band's centre, just inside names it, just outside not
  const ring = (c, rad, rot, fn) => Array.from({ length: 72 }, (_, i) => fn(p, pose(at(c, i * 5, rad), rot)));
  const vc = bandCentres(p, g.rot).vo[0], A = farEnd(p);
  const voIn = ring(vc, VO_BAND - 0.05, g.rot, isVertexOff).every(Boolean), voOut = ring(vc, VO_BAND + 0.05, g.rot, isVertexOff).every((x) => !x);
  const coaIn = ring(A, tol - 0.05, g.rot, isCentreOnArm).every(Boolean), coaOut = ring(A, tol + 0.05, g.rot, isCentreOnArm).every((x) => !x);
  // and the turn: within ±BASE_TOL of an arm names it, one degree more does not
  const turnIn = [-BASE_TOL, BASE_TOL].every((d) => isVertexOff(p, pose(bandCentres(p, g.rot + d).vo[0], g.rot + d)));
  const turnOut = [-BASE_TOL - 1, BASE_TOL + 1].every((d) => !isVertexOff(p, pose(bandCentres(p, g.rot + d).vo[0], g.rot + d)));
  // one ordinary slip from ANY placement (the centre anywhere within the tolerance, the turn anywhere within ±3°): a nudge
  // (one board px, four ways) or a turn of one step (1°, about its own centre). Tested on the tolerance's edge, where a
  // slip goes furthest, 72 ways round, at every turn the placement takes
  let slipHits = 0, slipTries = 0;
  for (let d = -BASE_TOL; d <= BASE_TOL; d++) for (let i = 0; i < 72; i++) {
    const q = pose(at(O, i * 5, tol - 0.01), g.rot + d);
    if (!placement(p, q).ok) continue;
    for (const s of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const q2 = { x: q.x + s[0], y: q.y + s[1], rot: norm(q.rot + s[2]) };
      slipTries++;
      if (isVertexOff(p, q2) || isCentreOnArm(p, q2)) slipHits++;
    }
  }
  const rest = initPlace(p).pose;
  return {
    levelId: p.goal + ":" + p.theta + ":" + p.start + (p.mirror ? "m" : ""), goal: p.goal, kVo, kCoa,
    voBoard: (kVo * Math.PI * VO_BAND ** 2) / (BW * BH * 360), voNear: (kVo * VO_BAND ** 2) / (PR ** 2 * 360),
    coaBoard: (kCoa * Math.PI * tol ** 2) / (BW * BH * 360), coaNear: (kCoa * tol ** 2) / (PR ** 2 * 360),
    voIn, voOut, coaIn, coaOut, turnIn, turnOut, slipHits, slipTries,
    restNames: isVertexOff(p, rest) || isCentreOnArm(p, rest),
    // the served vertex-off pose (the bottom edge's middle exactly on O) is in the band
    voPose: isVertexOff(p, vertexOffPose(p)),
  };
}
/** a drop that misses: the right turn, the centre spread evenly over a disc of radius r round O (a finger off by up to r,
 *  any way). The share of that disc in each band, by the law's own predicates on a 0.25 px grid: r = 12 … 150 */
function dropCurve(p) {
  const g = goodPose(p), O = [p.vx, p.vy], st = 0.25, R = 150;
  const byR = new Map();   // ceil(distance) → [points, vertex-off, centre-on-arm]
  for (let dx = -R; dx <= R; dx += st) for (let dy = -R; dy <= R; dy += st) {
    const d = Math.hypot(dx, dy);
    if (d > R) continue;
    const k = Math.max(1, Math.ceil(d)), q = { x: O[0] + dx, y: O[1] + dy, rot: g.rot };
    const row = byR.get(k) ?? [0, 0, 0];
    row[0]++;
    // (the bands lie 14 … 34 and 96 … 141 px from O: outside them the predicates are not asked)
    if (d >= 12 && d <= 36 && isVertexOff(p, q)) row[1]++;
    if (d >= 90 && isCentreOnArm(p, q)) row[2]++;
    byR.set(k, row);
  }
  const out = [];
  let n = 0, vo = 0, coa = 0;
  for (let k = 1; k <= R; k++) {
    const row = byR.get(k) ?? [0, 0, 0];
    n += row[0]; vo += row[1]; coa += row[2];
    if (k >= 12) out.push({ r: k, vo: vo / n, coa: coa / n });
  }
  return out;
}

// ───────────────────────────── wrong-scale: the typed number, the dot ─────────────────────────────
// The pad: the keys in the order the view gives them (kon.place.view.ts), in the grid play.css lays them out in, and the
// view's own rule for a key (a fourth digit, a digit after a lone 0, a number over 180 are not taken).
const VIEW = readFileSync(`${ROOT}src/play/families/kon/kon.place.view.ts`, "utf8");
const PAD_KEYS = [...JSON.parse(/\.\.\.(\["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"\])\.map\(key\)/.exec(VIEW)[1]), "⌫"];
const PAD_COLS = Number(/\.pl-row--pad\s*\{[^}]*repeat\((\d+)/.exec(readFileSync(`${ROOT}src/play/play.css`, "utf8"))[1]);
const PAD_RULE = /disabled: typed\.length >= 3 \|\| typed === "0" \|\| Number\(typed \+ d\) > 180/.test(VIEW);
const padAt = (k) => { const i = PAD_KEYS.indexOf(k); return [Math.floor(i / PAD_COLS), i % PAD_COLS]; };
/** the digit keys touching a key (side or corner): a finger that lands one key off */
const padNear = (d) => PAD_KEYS.filter((k) => /^\d$/.test(k) && k !== d && Math.max(Math.abs(padAt(k)[0] - padAt(d)[0]), Math.abs(padAt(k)[1] - padAt(d)[1])) === 1);
/** what the pad holds after these presses (the view's rule), or null when it holds nothing */
const typeKeys = (keys) => { let t = ""; for (const d of keys) { if (t.length >= 3 || t === "0" || Number(t + d) > 180) continue; t += d; } return t === "" ? null : Number(t); };
/** one typing slip on the number she means to type: one key one off, two neighbouring presses swapped, one press not
 *  registered, one press registered twice. Each listed way, as the pad takes it; the ones that change nothing left out */
function typos(v) {
  const k = [...String(v)], out = [];
  for (let i = 0; i < k.length; i++) for (const n of padNear(k[i])) out.push(typeKeys([...k.slice(0, i), n, ...k.slice(i + 1)]));
  for (let i = 0; i + 1 < k.length; i++) if (k[i] !== k[i + 1]) out.push(typeKeys([...k.slice(0, i), k[i + 1], k[i], ...k.slice(i + 2)]));
  for (let i = 0; i < k.length; i++) out.push(typeKeys([...k.slice(0, i), ...k.slice(i + 1)]));
  for (let i = 0; i < k.length; i++) out.push(typeKeys([...k.slice(0, i + 1), k[i], ...k.slice(i + 1)]));
  return out.filter((x) => x !== null && x !== v);
}
const share = (xs, inT) => (xs.length ? xs.filter(inT).length / xs.length : 0);
function scaleTable(p) {
  const th = p.theta, M = 180 - th, inT = (x) => Math.abs(x - M) <= READ_TOL;
  const T = Array.from({ length: 181 }, (_, x) => x).filter(inT);
  // what the placed protractor shows on the solver's pose (the key), and that the mix-up's numbers are told from it
  const g = goodPose(p), shown = p.goal === "measure" ? asPlaced(p, g)?.value : th;
  // (a placement within the tolerance shows a reading a few degrees off the key; every reading the law names at is covered
  // by the test "every reading" below)
  const typing = p.goal === "measure" ? share(typos(th), inT) : 0;   // (draw types nothing: she marks a dot)
  // a reading slip: one small tick (5°) or one long tick (10°) off, either way
  const ticks = share([th - 5, th + 5, th - 10, th + 10], inT);
  // draw: the dot's nudges (1° along the rim) from the right mark
  const nudge = share([th - 1, th + 1], inT);
  return { levelId: p.goal + ":" + th + ":" + p.start + (p.mirror ? "m" : ""), goal: p.goal, fade: p.scale, theta: th, M, T, shown,
    blind: T.length / 181, typing, slips: typos(th).length, landing: typos(th).filter(inT), ticks, nudge,
    gap: Math.abs(M - th), told: Math.abs(180 - 2 * th) > 2 * READ_TOL };
}

// ───────────────────────────── join-wrong-end: one of two buttons ─────────────────────────────
const SPEC = konLogic.chanceRepeat?.["draw:join-wrong-end"];
function joinTable() {
  const draws = LEVELS.draw;
  const aFirst = draws.filter((l) => joinAFirst(l.seed)).length;
  const k = SPEC.sightings;
  return {
    levels: draws.length, aFirst, oneBlind: 1 / 2, pairBlind: 1 / 4, sightings: k, kBlind: 0.5 ** k,
    // a habit of pressing one place (the first button, the left one): A on the levels where A comes first, never on the
    // others, so never four sightings with both orders among them
    habitOne: aFirst / draws.length, habitK: 0,
  };
}

// ───────────────────────────── per session (law 3 read per session, 2026-11-16) ─────────────────────────────
// Each mix-up's chance on one level, for a child who does not hold it: the worst of a blind act, one ordinary slip and a
// drop that misses, over every generated level (and, for wrong-scale in measure, over every reading the law names at: a
// placement within the tolerance shows a few degrees off the key). Over the n = NAMING_LEVELS levels a session names
// from: named from one level, 1 - (1 - p)^n; named on the k-th, P(k or more of n).
function sessionTable(place, scale, curve) {
  const max = (xs) => Math.max(0, ...xs);
  const n = NAMING_LEVELS;
  const drop = (k) => max(Object.values(curve).flatMap((c) => c.map((x) => x[k])));
  const inT = (v) => (x) => Math.abs(x - (180 - v)) <= READ_TOL;
  const namedReadings = Array.from({ length: 181 }, (_, v) => v).filter((v) => !SCALE_SLIP_READS.has(v) && Math.abs(180 - 2 * v) > 2 * READ_TOL);
  const of = (goal) => scale.filter((t) => t.goal === goal);
  const per = {
    "vertex-off": { blind: max(place.flatMap((t) => [t.voBoard, t.voNear])), slip: max(place.map((t) => t.slipHits / t.slipTries)), drop: drop("vo") },
    "centre-on-arm": { blind: max(place.flatMap((t) => [t.coaBoard, t.coaNear])), slip: max(place.map((t) => t.slipHits / t.slipTries)), drop: drop("coa") },
    "wrong-scale, measure": { blind: max(of("measure").map((t) => t.blind)), slip: max([...of("measure").flatMap((t) => [t.typing, t.ticks]), ...namedReadings.map((v) => share(typos(v), inT(v)))]), drop: 0 },
    "wrong-scale, draw": { blind: max(of("draw").map((t) => t.blind)), slip: max(of("draw").flatMap((t) => [t.nudge, t.ticks])), drop: 0 },
    "join-wrong-end": { blind: 0.5, slip: 0, drop: 0 },
  };
  const spec = { "vertex-off": ["measure:vertex-off", "draw:vertex-off"], "centre-on-arm": ["measure:centre-on-arm", "draw:centre-on-arm"],
    "wrong-scale, measure": ["measure:wrong-scale"], "wrong-scale, draw": ["draw:wrong-scale"], "join-wrong-end": ["draw:join-wrong-end"] };
  const rows = Object.entries(per).map(([mix, c]) => {
    const p = Math.max(c.blind, c.slip, c.drop), ks = spec[mix].map((k) => konLogic.chanceRepeat[k]?.sightings ?? 1), k = Math.min(...ks);
    return { mix, ...c, p, k, before: mix === "join-wrong-end" ? atLeast(n, p, 4) : fromOne(n, p), after: atLeast(n, p, k),
      // the join before the cap: four of six levels (the session kept six picks and had no level count)
      ...(mix === "join-wrong-end" ? { beforeSix: atLeast(6, p, 4) } : {}) };
  });
  return { n, rows };
}

export function gate2Tables() {
  const place = [...LEVELS.measure, ...LEVELS.draw].map((l) => placementTable(l.params));
  const scale = [...LEVELS.measure, ...LEVELS.draw].map((l) => scaleTable(l.params));
  const curve = { measure: dropCurve(LEVELS.measure.find((l) => l.params.mirror).params), draw: dropCurve(LEVELS.draw.find((l) => !l.params.mirror).params) };
  return { place, scale, curve, join: joinTable(), session: sessionTable(place, scale, curve) };
}
let TABLES = null;
const tables = () => (TABLES ??= gate2Tables());

test("gate 2, the pieces the proof stands on: the pad as the view lays it out; the bands' sizes", () => {
  assert.deepEqual(PAD_KEYS, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"]); assert.equal(PAD_COLS, 6); assert.ok(PAD_RULE, "the view's key rule");
  assert.deepEqual(padNear("5"), ["4", "6", "0"]); assert.deepEqual(padNear("9"), ["2", "3", "4", "8", "0"]);
  // worked by hand: 150 → 25, 75, 85 (the 1 one off: 250 is over 180, so the pad drops the 0), 140, 160, 100, 159, 153, 154,
  // 155 (one key off), 51, 105 (swapped: 510 → 51), 50, 10, 15 (missed), 115, 155 (twice: the fourth key is not taken)
  assert.deepEqual(typos(150), [25, 75, 85, 140, 160, 100, 153, 154, 155, 159, 51, 105, 50, 10, 15, 115, 155]);
  // the law's own copy of the pad (kon.place.ts, which keeps the generator off the readings below) is this one
  assert.deepEqual([...PAD], PAD_KEYS); assert.equal(LAW_PAD_COLS, PAD_COLS);
  for (let v = 0; v <= 180; v++) assert.deepEqual(typedSlips(v), typos(v), String(v));
  // the vertex-off band: a disc of VO_BAND round the point PD along the inward normal: 14 … 34 px from O, within
  // asin(10/24) = 24.6° of the normal; the tolerance (11) plus one nudge (1) stays short of it
  assert.equal(VO_BAND, 10); assert.equal(PD, 24); assert.equal(TOL_PX, 11);
  assert.ok(PD - VO_BAND > TOL_PX + 1, "one nudge from a placement never reaches the band");
  // centre-on-arm's nearest band (the corner on O) is √(PR² + PD²) − tol = 96.7 px from O
  assert.ok(Math.hypot(PR, PD) - TOL_PX > TOL_PX + 1);
});

test("gate 2, vertex-off and centre-on-arm (placements): on EVERY generated level the band is the disc it is said to be; no single slip from a placement lands in it; a blind placement lands in it far under 1 in 10", () => {
  const { place } = tables();
  assert.ok(place.length >= 300, `${place.length} levels`);
  for (const t of place) {
    assert.ok(t.voIn && t.voOut, `${t.levelId}: vertex-off's band is the disc of ${VO_BAND}`);
    assert.ok(t.coaIn && t.coaOut, `${t.levelId}: centre-on-arm's band at A is the disc of ${TOL_PX}`);
    assert.ok(t.turnIn && t.turnOut, `${t.levelId}: vertex-off's turn band is ±${BASE_TOL}°`);
    assert.ok(t.voPose, `${t.levelId}: the bottom edge exactly on O is vertex-off`);
    assert.equal(t.slipHits, 0, `${t.levelId}: one slip from a placement lands in a band (${t.slipHits} of ${t.slipTries})`);
    assert.ok(t.slipTries >= 3000);
    assert.equal(t.restNames, false, `${t.levelId}: locked where it rests, it names a mix-up`);
    assert.ok(t.kVo >= 7 && t.kVo <= 4 * (2 * BASE_TOL + 1), `${t.levelId}: ${t.kVo} turns`);
    for (const k of ["voBoard", "voNear", "coaBoard", "coaNear"]) assert.ok(t[k] <= LAW3 / 10, `${t.levelId}: ${k} ${t[k]}`);
  }
  // the worst levels, as the packet prints them
  const worst = (k) => Math.max(...place.map((t) => t[k]));
  assert.ok(worst("voNear") < 0.002 && worst("coaNear") < 0.01, `${worst("voNear")} ${worst("coaNear")}`);
});

test("gate 2, a drop that misses (the right turn, the centre off by up to r any way): the share in vertex-off's band stays under 1 in 10 for every r; at the old 11 it did not", () => {
  const { curve } = tables();
  for (const [goal, c] of Object.entries(curve)) {
    const vo = Math.max(...c.map((x) => x.vo)), coa = Math.max(...c.map((x) => x.coa));
    assert.ok(vo <= LAW3, `${goal}: vertex-off ${vo}`); assert.ok(coa <= LAW3, `${goal}: centre-on-arm ${coa}`);
    // a drop within the tolerance (and one px more) never lands in either band
    assert.ok(c.filter((x) => x.r <= TOL_PX + 2).every((x) => x.vo === 0 && x.coa === 0));
  }
  // why 10 and not 11: the same disc model, the band 11 round the same point: over 1 in 10 at r = 30
  const disc = (band, r) => { let n = 0, k = 0; for (let x = -r; x <= r; x += 0.1) for (let y = -r; y <= r; y += 0.1) { if (x * x + y * y > r * r) continue; n++; if (Math.hypot(x, y - PD) <= band) k++; } return k / n; };
  assert.ok(disc(11, 30) > LAW3 && disc(10, 30) <= LAW3, `${disc(11, 30)} ${disc(10, 30)}`);
});

test("gate 2, wrong-scale (a typed number in measure, a dot in draw): a blind number or dot, one typing slip on the pad, one tick off, one dot nudge each land on the other scale's number at most 1 in 10, on EVERY generated level", () => {
  const { scale } = tables();
  assert.ok(scale.length >= 300);
  for (const t of scale) {
    assert.ok(t.told, `${t.levelId}: the two scales agree here`);
    if (t.goal === "measure") assert.ok(Math.abs(t.shown - t.theta) < 0.5, `${t.levelId}: the solver's pose shows ${t.shown}`);
    assert.ok(t.gap >= 30, `${t.levelId}: the mix-up's number is ${t.gap} from the key`);
    assert.ok(t.blind <= LAW3 && t.blind <= 5 / 181 + 1e-9, `${t.levelId}: blind ${t.blind}`);
    assert.ok(t.typing <= LAW3, `${t.levelId}: one typing slip ${t.typing} (${t.landing} of ${t.slips})`);
    assert.equal(t.ticks, 0, `${t.levelId}: a tick off`); assert.equal(t.nudge, 0, `${t.levelId}: a dot nudge`);
  }
  // the worst typing level, as the packet prints it
  const w = scale.filter((t) => t.goal === "measure").sort((a, b) => b.typing - a.typing)[0];
  assert.ok(w.typing > 0 && w.typing <= LAW3, `${w.levelId} ${w.typing}`);
  assert.ok(!scale.some((t) => t.goal === "measure" && SCALE_SLIP_READS.has(t.theta)), "no measure level is built on a reading over the line");
});

test("gate 2, wrong-scale, every reading: a placement within the tolerance shows a reading off the key; the law names wrong-scale at a reading only where one typing slip lands on the other scale's number at most 1 in 10", () => {
  const inT = (v) => (x) => Math.abs(x - (180 - v)) <= READ_TOL;
  const over = Array.from({ length: 181 }, (_, v) => v).filter((v) => share(typos(v), inT(v)) > LAW3);
  assert.deepEqual(over, [16, 140, 141, 159, 164, 165, 166]);
  assert.deepEqual([...SCALE_SLIP_READS], over, "the law's set is the one worked out here");
  // the law: a placed protractor that shows one of them names no wrong-scale (her number is an ordinary miss), and the
  // generator builds no measure level on one (140 is the only key among them it could serve: fades 2 and 3)
  let found = 0;
  for (const lv of LEVELS.measure.filter((l) => l.params.mirror)) {
    const p = lv.params, g = goodPose(p);
    for (let dx = -10; dx <= 10 && !found; dx += 0.5) for (let dy = -10; dy <= 10; dy += 0.5) {
      const q = { x: g.x + dx, y: g.y + dy, rot: g.rot }, pl = placement(p, q), ap = asPlaced(p, q, pl);
      if (!pl.ok || !ap || !SCALE_SLIP_READS.has(Math.round(ap.value))) continue;
      const acts = [{ kind: "move", x: q.x, y: q.y }, { kind: "spin", deg: q.rot }, { kind: "lock" }, { kind: "read", n: Math.round(180 - ap.value) }];
      let st = konLogic.init(lv), m = null;
      for (const [i, a] of acts.entries()) { const r = konLogic.apply(lv, st, a, i + 1); st = r.state; m = r.moments.at(-1) ?? m; }
      assert.notEqual(m.misconceptionId, "wrong-scale", `${lv.levelId} at ${ap.value}`);
      found++; break;
    }
  }
  assert.ok(found >= 1, "a placement showing such a reading was tried");
  const m140 = konLogic.generate(req("measure", 3, 2)).map((c) => c.level.params.theta);
  for (const sd of SEEDS) for (const f of [2, 3]) m140.push(...konLogic.generate(req("measure", sd, f)).map((c) => c.level.params.theta));
  assert.ok(!m140.includes(140) && m140.includes(145) && m140.includes(135), "measure never serves 140; its neighbours still");
});

test("gate 2, join-wrong-end (one of two buttons): one press names nothing; two are still 1 in 4; four sightings on four asked sizes with both button orders: 1 in 16, and never from a habit of pressing one place", () => {
  const j = tables().join;
  assert.deepEqual(SPEC, { sightings: 4, apart: [0], cover: 1 });
  assert.ok(j.pairBlind > LAW3, "a pair is not enough");
  assert.ok(0.5 ** (SPEC.sightings - 1) > LAW3 && j.kBlind <= LAW3, "four is the fewest under law 3's line");
  assert.ok(j.aFirst > 0.3 * j.levels && j.aFirst < 0.7 * j.levels, `A first on ${j.aFirst} of ${j.levels}`);
  assert.ok(chancePick({ goal: "draw", family: "kon", mode: "place" }, "join-wrong-end"));
  // the surface: the asked size and the join order
  const a = LEVELS.draw.find((l) => joinAFirst(l.seed)), b = LEVELS.draw.find((l) => !joinAFirst(l.seed) && l.params.theta !== a.params.theta);
  assert.deepEqual(drawSurface(a.params, a.seed), [`theta:${a.params.theta}`, "join:A"]);
  const sa = surfaceOf(a), sb = surfaceOf(b);
  assert.ok(Array.isArray(sa) && sa.length === 2 && surfacesDiffer(sa, sb));
  // the rule (repeatMet): the shared law-3 rule unchanged with no spec; with the spec four, sizes apart, both orders
  const S = (th, o) => surfaceOf({ ...a, seed: o === "A" ? a.seed : b.seed, params: { ...a.params, theta: th } });
  assert.ok(repeatMet([S(25, "A")], S(35, "O")) && !repeatMet([S(25, "A")], S(25, "A")));
  assert.ok(!repeatMet([S(25, "A")], S(35, "O"), SPEC), "two sightings name nothing");
  assert.ok(!repeatMet([S(25, "A"), S(35, "O")], S(45, "A"), SPEC), "three name nothing");
  assert.ok(repeatMet([S(25, "A"), S(35, "O"), S(55, "A")], S(65, "A"), SPEC), "four, four sizes, both orders: named");
  assert.ok(!repeatMet([S(25, "A"), S(35, "A"), S(55, "A")], S(65, "A"), SPEC), "one order only (a habit of pressing one place): not named");
  assert.ok(!repeatMet([S(25, "A"), S(35, "O"), S(25, "O")], S(65, "A"), SPEC), "a size twice: not named");
  assert.ok(repeatMet([S(25, "A"), S(25, "O"), S(35, "O"), S(55, "A")], S(65, "A"), SPEC), "a fourth from any three that qualify");
  assert.ok(CHANCE_MEMORY >= SPEC.sightings - 1);
});

test("gate 2, per session: named from one level, vertex-off, wrong-scale (measure and draw) were over 1 in 10 a session; as picks named on a second level that differs, every kon/place mix-up is under it over the session's NAMING_LEVELS levels", () => {
  const { session } = tables(), by = Object.fromEntries(session.rows.map((r) => [r.mix, r]));
  assert.equal(session.n, 4);
  for (const r of session.rows) assert.ok(r.after <= LAW3, `${r.mix}: ${oneIn(r.after)} a session (p ${r.p}, named on the ${r.k}th of ${session.n})`);
  // why the rule changed: from one level they were over the line (centre-on-arm was under it at four levels, but a
  // from-one-level rule is not held to the session's first four, and it passes 1 in 10 at six: 1 - (53/54)^6)
  for (const m of ["vertex-off", "wrong-scale, measure", "wrong-scale, draw"]) assert.ok(by[m].before > LAW3, `${m}: ${by[m].before}`);
  assert.ok(by["centre-on-arm"].before <= LAW3 && fromOne(6, by["centre-on-arm"].p) > LAW3);
  // each mix-up's worst act on one level, as the packet prints it
  assert.ok(by["vertex-off"].p === by["vertex-off"].drop && by["vertex-off"].p > 0.09 && by["vertex-off"].p < 0.1);
  assert.equal(by["vertex-off"].slip, 0); assert.equal(by["centre-on-arm"].slip, 0);
  assert.ok(by["wrong-scale, measure"].p <= LAW3 && by["wrong-scale, measure"].p > 1 / 14);
  assert.ok(Math.abs(by["wrong-scale, draw"].p - 5 / 181) < 1e-12);
  // the join: four of four, 1 in 16 (as before, now held to four levels; before, four of six was 11 in 32)
  assert.equal(by["join-wrong-end"].k, 4); assert.ok(Math.abs(by["join-wrong-end"].after - 1 / 16) < 1e-12 && by["join-wrong-end"].beforeSix > LAW3);
  // the rule as the law and the server hold it
  for (const g of ["measure", "draw"]) for (const m of ["vertex-off", "centre-on-arm", "wrong-scale"]) {
    assert.ok(chancePick({ goal: g, family: "kon", mode: "place" }, m), `${g}:${m} is a pick`);
    assert.equal(konLogic.chanceRepeat[`${g}:${m}`].sightings, 2);
    assert.deepEqual(konLogic.chanceRepeat[`${g}:${m}`].apart, g === "draw" ? [0] : undefined);
  }
  assert.ok(CHANCE_MEMORY >= session.n - 1);
});

const sessionOf = (entry, over = {}) => ({ childId: "c1", key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish", childArt: null, lastArt: null,
  mis: {}, pL: undefined, n: 0, seed: seedOf("c1", entryKey(entry), 0), door: "garam", recent: [], hist: null, ...over });

test("gate 2, the server's rule with naming ON (levels.js / grade.js directly): one join press reaches nothing (rows, trail, facts, facts row, the moment); the fourth sighting on four sizes with both orders names it; as served (naming off) nothing", () => {
  const entry = PE("draw"), KIT = entry.misMap["join-wrong-end"];
  // served draw levels (the server's own generator and kit map), with join-wrong-end's acts
  const served = [];
  for (const fade of [1, 2, 3]) for (const child of ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]) for (let k = 0; k < 3; k++) {
    const lv = levelsFor(sessionOf(entry, { fade, childId: child, seed: seedOf(child, entryKey(entry), k) }), entry)?.garam;
    if (lv && konLogic.malActs(lv, "join-wrong-end")) served.push(lv);
  }
  const order = (lv) => (joinAFirst(lv.seed) ? "A" : "O");
  const pickFour = (want) => {
    const out = [];
    for (const o of want) { const lv = served.find((l) => order(l) === o && !out.some((x) => x.params.theta === l.params.theta)); if (lv) out.push(lv); }
    return out;
  };
  const four = pickFour(["A", "O", "A", "O"]);
  assert.equal(four.length, 4, `served: ${served.map((l) => `${l.params.theta}${order(l)}`)}`);
  const about = /sign=|mal=|misconception=|chance|join-wrong-end|far_end/;
  const press = (lv) => gradeActs(lv, env(konLogic.malActs(lv, "join-wrong-end")), { final: true });
  let s = sessionOf(entry);
  four.forEach((lv, i) => {
    const g = press(lv), rows = nameOnRepeat(lessonEvidence(g.grade, lv), s, lv);
    const m = g.moments.at(-1);
    assert.equal(m.kind, "misconception_consequence"); assert.equal(m.facts.sign, undefined, "no sign fact in the moment");
    assert.equal(g.grade.evidence[0].chanceMis, KIT); assert.equal(g.grade.evidence[0].weight, CHANCE_WEIGHT);
    assert.deepEqual(g.trail.mal, [], "never in the level's trail");
    assert.doesNotMatch(JSON.stringify(g.grade.facts), about); assert.doesNotMatch(playFactsRow(g.grade.facts), about);
    assert.doesNotMatch(playFactsRow(g.facts), about);
    if (i < 3) {
      assert.equal(rows[0].misconceptionId, undefined, `sighting ${i + 1} names nothing`); assert.equal(rows[0].chanceMis, undefined, "nor carries the pick");
    } else {
      assert.equal(rows[0].misconceptionId, KIT, "the fourth sighting names it"); assert.equal(rows[0].named, "repeat"); assert.equal(rows[0].weight, GAME_WEIGHT);
    }
    s = afterLevelBody(s, { grade: g.grade, level: lv });
    // the session token carries what it remembers
    const key = Buffer.alloc(32, 7);
    s = verifySession(signSession(s, { key }), { key });
  });
  assert.equal(s.chance.length, 4); assert.ok(s.chance.every((c) => c.mis === KIT && Array.isArray(c.surface)));
  // one order only, or a size twice: the fourth names nothing
  for (const set of [pickFour(["A", "A", "A", "A"]), [...four.slice(0, 3), served.find((l) => l.params.theta === four[0].params.theta && order(l) === "A") ?? four[0]]]) {
    if (set.length < 4) continue;
    let t = sessionOf(entry);
    set.forEach((lv, i) => {
      const g = press(lv), rows = nameOnRepeat(lessonEvidence(g.grade, lv), t, lv);
      if (i === 3) assert.equal(rows[0].misconceptionId, undefined, `${set.map((l) => `${l.params.theta}${order(l)}`)}: not named`);
      t = afterLevelBody(t, { grade: g.grade, level: lv });
    });
  }
  // gate 2 per session: the placements and the scale are picks too. One vertex-off names nothing; a second on a draw level
  // with another asked size names it; the same size again does not; past the session's fourth level nothing does
  const voOf = (lv) => gradeActs(lv, env(konLogic.malActs(lv, "vertex-off")), { final: true });
  const [v1, v2] = [four[0], four.find((l) => l.params.theta !== four[0].params.theta)];
  const g1 = voOf(v1), r1 = nameOnRepeat(lessonEvidence(g1.grade, v1), sessionOf(entry), v1);
  assert.equal(r1[0].misconceptionId, undefined, "one vertex-off names nothing"); assert.equal(g1.grade.evidence[0].chanceMis, entry.misMap["vertex-off"]);
  assert.deepEqual(g1.trail.mal, []); assert.doesNotMatch(playFactsRow(g1.grade.facts), /mal=|misconception=|vertex|centre_off|sign=/);
  const sv = { ...afterLevelBody(sessionOf(entry), { grade: g1.grade, level: v1 }), n: 1 };
  const r2 = nameOnRepeat(lessonEvidence(voOf(v2).grade, v2), sv, v2);
  assert.equal(r2[0].misconceptionId, entry.misMap["vertex-off"], "the second, another size: named"); assert.equal(r2[0].named, "repeat");
  assert.equal(nameOnRepeat(lessonEvidence(voOf(v1).grade, v1), sv, v1)[0].misconceptionId, undefined, "the same size again: not named");
  assert.equal(nameOnRepeat(lessonEvidence(voOf(v2).grade, v2), { ...sv, n: NAMING_LEVELS }, v2)[0].misconceptionId, undefined, "past the fourth level: not named");
  assert.ok(repeatSpec(v2, entry.misMap["vertex-off"]) && repeatSpec(v2, entry.misMap["wrong-scale"]));
  // as served today: the flag main switches (shared/play.ts NAMING_OFF)
  let u = sessionOf(entry), last = null;
  for (const lv of four) { const g = withNaming(lv, press(lv)); last = nameOnRepeat(lessonEvidence(g.grade, lv), u, lv); u = afterLevelBody(u, { grade: g.grade, level: lv }); }
  if (namingOn("kon", "place")) assert.equal(last[0].misconceptionId, KIT);
  else { assert.equal(u.chance, undefined, "naming off: nothing remembered"); assert.equal(last[0].misconceptionId, undefined); assert.equal(last[0].chanceMis, undefined); }
  if (process.env.KON_GATE2_PRINT) writeFileSync(process.env.KON_GATE2_PRINT, JSON.stringify(tables()));
});
