// engines-v1: the pure verdict logic every frame engine reports from (src/modules/frame/engines/*.logic.ts).
// Each engine's `correct` is computed here from params + the child's state, so these goldens are what
// "machine truth" means for it: a scripted right path is graded right, a scripted wrong path wrong, and the
// misconception facts fire on the wrong path they name and stay silent on the right one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeTracker } from "../src/modules/frame/kit/tracker.ts";
import { parseQ, qEq, sameValue } from "../src/modules/frame/kit/math.ts";
import * as NL from "../src/modules/frame/engines/numberLine.logic.ts";
import * as COL from "../src/modules/frame/engines/collections.logic.ts";
import * as PV from "../src/modules/frame/engines/placeValue.logic.ts";
import * as FR from "../src/modules/frame/engines/fractions.logic.ts";
import * as MD from "../src/modules/frame/engines/multiplyDivide.logic.ts";
import * as GEO from "../src/modules/frame/engines/geoboard.logic.ts";
import * as DG from "../src/modules/frame/engines/dataGraphs.logic.ts";
import * as PT from "../src/modules/frame/engines/patterns.logic.ts";
import * as MS from "../src/modules/frame/engines/measure.logic.ts";
import * as SKY from "../src/modules/frame/engines/sky.logic.ts";
import * as MO from "../src/modules/frame/engines/motionLab.logic.ts";
import * as WC from "../src/modules/frame/engines/waterCycle.logic.ts";

test("kit math: MathValue forms compare exactly", () => {
  for (const [a, b] of [["1/2", "0.5"], ["2/4", "1/2"], ["½", "1/2"], ["1 1/2", "3/2"], ["₹37", "37"], ["12 cm", "12"], ["−5", "-5"], ["३/४", "3/4"], ["1,25,000", "125000"]]) assert.ok(sameValue(a, b), `${a} = ${b}`);
  assert.equal(parseQ("3/0"), null);
  assert.equal(parseQ("abc"), null);
  assert.ok(!sameValue("1/3", "0.33"), "0.33 is not 1/3");
});

test("tracker: goal once, retaps after the goal are play, stuck after 2 wrong (once), counts are deterministic", () => {
  const log = [];
  const api = { interaction: (n, d) => log.push(["i", n, d]), answer: (v, c) => log.push(["a", c, v]), goalMet: (g) => log.push(["g", g]), stuck: (r) => log.push(["s", r]), error: () => {} };
  const t = makeTracker(api, { stuckAfterWrong: 2, stuckAfterChanges: 3 });
  t.answer({ x: 1 }, false, "G");
  t.answer({ x: 2 }, false, "G");
  t.answer({ x: 3 }, false, "G");
  assert.equal(log.filter((e) => e[0] === "s").length, 1, "stuck fires once");
  t.answer({ x: 4 }, true, "G");
  t.answer({ x: 5 }, true, "G");
  assert.deepEqual(log.filter((e) => e[0] === "g"), [["g", "G"]]);
  assert.equal(log.at(-1)[1], "retap");
  assert.equal(log.filter((e) => e[0] === "a").at(-1)[2].attempt, 4, "attempts ride on the answer");
  const t2 = makeTracker(api, { stuckAfterChanges: 3 });
  const before = log.length;
  t2.change("x"); t2.change("x"); t2.change("x");
  assert.deepEqual(log.slice(before).filter((e) => e[0] === "s"), [["s", "many_changes_without_goal"]]);
});

test("number-line@1: placement, reading, jumps and misconception facts", () => {
  const c = NL.normalize({ mode: "place", target: "3/4" });
  assert.equal(c.unit.d, 4);
  assert.equal(c.ticks, 4);
  const k = NL.indexOf(c, parseQ("3/4"));
  assert.ok(NL.placeCorrect(c, k));
  assert.ok(!NL.placeCorrect(c, k - 1));
  assert.equal(NL.placeMisc(c, k - 1), "off_by_one_tick");
  const c2 = NL.normalize({ mode: "place", target: "3/4", max: "4" });
  assert.equal(NL.placeMisc(c2, NL.indexOf(c2, parseQ("3"))), "frac_as_whole", "3/4 placed at 3");
  const r = NL.normalize({ mode: "read", target: "0.7", numberKind: "decimal" });
  assert.ok(NL.readCorrect(r, "0.7") && NL.readCorrect(r, "7/10") && !NL.readCorrect(r, "0.07"));
  const j = NL.normalize({ mode: "jump", start: "7", target: "12", jumps: ["1", "5"], max: "20" });
  assert.deepEqual(NL.solve(j).jumps, [5]);
  const neg = NL.normalize({ mode: "jump", start: "-3", target: "4", jumps: ["1"], min: "-5", max: "5" });
  assert.equal(neg.kind, "integer");
  assert.equal(NL.solve(neg).jumps.length, 7);
  // rounding: the target is computed from the point (never passed), half up
  for (const [pt, u, want] of [["3620", 100, 3600], ["47", 10, 50], ["15500", 1000, 16000], ["23650", 1000, 24000], ["4873950", 1000, 4874000]]) {
    const rc = NL.normalize({ point: pt, round: u });
    assert.equal(rc.error, null, `${pt}/${u}`);
    assert.ok(qEq(rc.target, parseQ(String(want))), `${pt} → ${want}`);
    assert.ok(NL.indexOf(rc, rc.point) !== null, "the point sits on a tick");
  }
  assert.ok(NL.normalize({ point: "3449", round: 100 }).error, "3449 needs 100 ticks: refused, not mis-drawn");
  assert.ok(NL.normalize({ mode: "place", target: "1/7", partition: 4 }).error, "unreachable target is reported");
  assert.ok(NL.normalize({ mode: "place", target: "350", max: "1000" }).ticks <= NL.MAX_TICKS);
});

test("collections@1: compare verdicts and the spread-side fact", () => {
  const c = COL.normalize({ mode: "compare", left: 4, right: 6, question: "more" });
  assert.ok(COL.compareCorrect(c, "right") && !COL.compareCorrect(c, "left") && !COL.compareCorrect(c, "same"));
  assert.equal(COL.spreadSide(c), "left", "the smaller set is drawn spread out");
  assert.ok(COL.compareCorrect({ left: 5, right: 5, question: "more" }, "same"));
  assert.equal(COL.normalize({ numbers: [4, 6] }).mode, "compare");
  assert.ok(COL.normalize({ n: 120 }).issues.length, "over 50 counters is redirected");
});

test("place-value@1: build with exchanges, readings and their misconception facts, compare", () => {
  const c = PV.normalize({ mode: "build", value: 305 });
  assert.ok(PV.buildCorrect(c, [5, 0, 3]));
  assert.ok(PV.buildCorrect(c, [15, 9, 2]), "non-canonical pieces that make the value still make it");
  assert.deepEqual(PV.exchange([12, 0, 3], 0, "up"), [2, 1, 3]);
  assert.equal(PV.exchange([9, 0, 3], 0, "up"), null);
  assert.deepEqual(PV.exchange([0, 0, 3], 2, "down"), [0, 10, 2]);
  assert.equal(PV.readMisc(c, "3005"), "concat_expanded");
  assert.equal(PV.readMisc(c, "35"), "zero_dropped");
  assert.equal(PV.readMisc(c, "305"), null);
  assert.ok(PV.readCorrect(c, "305") && !PV.readCorrect(c, "350"));
  assert.ok(PV.compareCorrect({ a: 2999, b: 10001, question: "bigger" }, "b"));
  assert.equal(PV.normalize({ mode: "compare", a: 98765, b: 102345 }).places, 6);
});

test("fractions@1: make, compare (and its facts), equivalent, add", () => {
  const m = FR.normalize({ mode: "make", target: "2/4" });
  assert.equal(m.parts, 4, "2/4 is cut in quarters, not halves");
  assert.ok(FR.makeCorrect(m, 2, 4) && !FR.makeCorrect(m, 1, 4));
  const fr = [parseQ("2/3"), parseQ("3/4")];
  assert.ok(FR.compareCorrect(fr, "bigger", "1") && !FR.compareCorrect(fr, "bigger", "0"));
  assert.equal(FR.compareMisc([parseQ("1/4"), parseQ("1/8")], "bigger", "1"), "bigger_denominator");
  assert.equal(FR.compareMisc([{ n: 2, d: 5 }, { n: 1, d: 2 }], "bigger", "0"), "count_pieces");
  assert.ok(FR.equivalentCorrect(parseQ("1/2"), 2, 4) && !FR.equivalentCorrect(parseQ("1/2"), 1, 2), "same partition is not a new equivalent");
  const fixed = FR.normalize({ mode: "equivalent", target: "1/3", parts: 6 });
  assert.equal(fixed.error, null);
  assert.ok(FR.normalize({ mode: "equivalent", target: "1/3", parts: 5 }).error, "1/3 cannot be shown in fifths");
  const a = FR.normalize({ mode: "add", fractions: ["1/4", "2/4"] });
  assert.ok(FR.addCorrect(a, 3, 4) && !FR.addCorrect(a, 3, 8));
  assert.equal(FR.addMisc(a, 3, 8), "add_across");
  const u = FR.normalize({ mode: "add", fractions: ["1/2", "1/3"] });
  assert.equal(u.parts, 6);
  assert.ok(FR.addCorrect(u, 5, 6));
  assert.ok(FR.normalize({ mode: "add", fractions: ["3/4", "3/4"] }).error === null && FR.normalize({ mode: "add", fractions: ["3/4", "3/4"] }).wholes === 2);
});

test("multiply-divide@1: arrays (commutative unless asked), fair shares with remainders, all factor pairs", () => {
  const c = MD.normalize({ mode: "array", a: 3, b: 4 });
  assert.ok(MD.arrayCorrect(c, 3, 4) && MD.arrayCorrect(c, 4, 3) && !MD.arrayCorrect(c, 2, 6));
  assert.ok(!MD.arrayCorrect({ ...c, orderMatters: true }, 4, 3));
  assert.ok(MD.arrayCorrect(MD.normalize({ mode: "array", product: 12 }), 2, 6));
  const s = MD.normalize({ mode: "share", n: 7, k: 3 });
  assert.ok(MD.shareCorrect(s, [2, 2, 2]) && !MD.shareCorrect(s, [3, 2, 2]) && !MD.shareCorrect(s, [1, 1, 1]));
  assert.ok(MD.shareUnequal([3, 2, 2]));
  assert.deepEqual(MD.factorPairs(12), [[1, 12], [2, 6], [3, 4]]);
  assert.ok(MD.factorsCorrect(12, new Set(["1x12", "2x6", "3x4"])) && !MD.factorsCorrect(12, new Set(["2x6", "3x4"])));
});

test("geoboard@1: area/perimeter, construction for every buildable target, swap fact", () => {
  const sq = new Set(["0,0", "1,0", "0,1", "1,1"]);
  assert.equal(GEO.area(sq), 4);
  assert.equal(GEO.perimeter(sq), 8);
  const L = new Set(["0,0", "0,1", "0,2", "1,2"]);
  assert.equal(GEO.perimeter(L), 10);
  assert.ok(!GEO.connected(new Set(["0,0", "2,2"])));
  // construct() is exact where it answers, and complete against an exhaustive enumeration of every connected
  // shape up to area 7 on the 6×8 grid (fixed polyominoes grown square by square).
  const W = 6, H = 8, key = (s) => [...s].sort().join(";");
  let level = new Map();
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) level.set(`${x},${y}`, new Set([`${x},${y}`]));
  for (let a = 1; a <= 7; a++) {
    for (const p of new Set([...level.values()].map(GEO.perimeter))) {
      const s = GEO.construct(W, H, a, p);
      assert.ok(s, `area ${a} perimeter ${p} exists but was not constructed`);
      assert.equal(GEO.area(s), a);
      assert.equal(GEO.perimeter(s), p);
      assert.ok(GEO.connected(s));
    }
    for (let p = 4; p <= 2 * a + 2; p += 2) if (![...level.values()].some((s) => GEO.perimeter(s) === p)) assert.equal(GEO.construct(W, H, a, p), null, `no shape has area ${a} perimeter ${p}`);
    const next = new Map();
    for (const s of level.values())
      for (const c of s) {
        const [x, y] = c.split(",").map(Number);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H || s.has(k)) continue;
          const t = new Set(s).add(k);
          next.set(key(t), t);
        }
      }
    level = next;
  }
  const c = GEO.normalize({ mode: "measure", shape: "rect:3x2", ask: "perimeter" });
  assert.ok(GEO.measureCorrect(c, "10") && !GEO.measureCorrect(c, "6"));
  assert.equal(GEO.measureMisc(c, "6"), "area_perimeter_swap");
  assert.equal(GEO.normalize({ w: 10 }, 48).w, 6, "columns capped so squares stay 48px at 360px");
  assert.equal(GEO.normalize({ w: 10 }, 64).w, 5);
  assert.ok(GEO.contrastCorrect({ contrast: "same_area", shape: sq }, new Set(["0,0", "1,0", "2,0", "3,0"])));
});

test("data-graphs@1: read answers come from the data, the key fact fires only on icon counting", () => {
  const c = DG.normalize({ mode: "read", view: "pictograph", scale: 2, data: [{ label: "Mon", value: 4 }, { label: "Tue", value: 8 }, { label: "Wed", value: 6 }], question: "value", ask: "Wed" });
  assert.equal(DG.answerOf(c), 6);
  assert.ok(DG.readCorrect(c, "6") && !DG.readCorrect(c, "3"));
  assert.equal(DG.readMisc(c, "3"), "icon_ignores_key");
  assert.equal(DG.readMisc(c, "5"), null);
  assert.equal(DG.answerOf({ ...c, question: "most" }), 1);
  assert.equal(DG.answerOf({ ...c, question: "difference", ask: 1, askB: 0 }), 4);
  assert.ok(DG.normalize({ data: [{ label: "A", value: 3 }, { label: "B", value: 3 }], question: "most" }).error, "a tie for 'most' is refused");
  assert.ok(DG.normalize({ data: [{ label: "<b>x", value: 1 }] }).cats[0].label === "bx", "markup is stripped from labels");
});

test("patterns@1: repeat, grow (add / multiply / square) and grid rules", () => {
  const r = PT.normalize({ mode: "repeat", core: ["red-circle", "blue-square"], shown: 4, blanks: 2 });
  assert.ok(PT.repeatCorrect(r, ["red-circle", "blue-square"]) && !PT.repeatCorrect(r, ["blue-square", "red-circle"]));
  assert.equal(PT.firstWrong(r, ["red-circle", "red-circle"]), 1);
  for (const [seq, next] of [[[3, 6, 9, 12], 15], [[2, 4, 8], 16], [[1, 4, 9, 16], 25], [[1, 4, 9], 16], [[1, 3, 6, 10], 15], [[50, 45, 40], 35]]) {
    const g = PT.normalize({ mode: "grow", sequence: seq, blanks: 1 });
    assert.equal(g.error, null, String(seq));
    assert.equal(PT.growAt(g, 0), next, `${seq} → ${next}`);
  }
  assert.ok(PT.normalize({ mode: "grow", sequence: [1, 2, 4, 7, 12] }).error, "no rule fits → refused");
  const gr = PT.normalize({ mode: "grid", gridRule: "multiples:3", gridCount: 12 });
  assert.ok(PT.gridCorrect(gr, new Set([3, 6, 9, 12])) && !PT.gridCorrect(gr, new Set([3, 6, 9])));
});

test("measure@1: readings in divisions, end-read and counted-marks facts", () => {
  const c = MS.normalize({ tool: "ruler", value: 5, start: 2 });
  assert.ok(MS.readCorrect(c, 5) && !MS.readCorrect(c, 7));
  assert.equal(MS.readMisc(c, 7), "end_read");
  assert.equal(MS.readMisc(c, 5.5), "counted_marks");
  assert.ok(MS.normalize({ tool: "ruler", value: 14, start: 2 }).error, "object past the end of the ruler");
  assert.ok(MS.normalize({ tool: "jug", value: 625 }).error, "625 mL is not on a 50 mL division");
  const t = MS.normalize({ tool: "thermometer", value: -5 });
  assert.equal(t.error, null);
});

test("sky@1: physical goldens (declination, shadow, phases, day/night)", () => {
  assert.ok(Math.abs(SKY.declination(172) - 23.44) < 0.1, "June solstice ≈ +23.4°");
  assert.ok(Math.abs(SKY.declination(355) + 23.44) < 0.1, "December solstice ≈ −23.4°");
  const c = SKY.normalize({ scene: "shadow" });
  const lens = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => SKY.shadowLen(c, h));
  assert.equal(lens.indexOf(Math.min(...lens)), 5, "shortest at noon");
  assert.ok(SKY.shadowMeets(c, 12) && !SKY.shadowMeets(c, 9));
  assert.equal(SKY.shadowDirection(9), "north-west");
  assert.equal(SKY.shadowDirection(12), "north", "north of the tropic, the noon shadow points north");
  assert.equal(SKY.shadowDirection(15), "north-east");
  assert.equal(SKY.shadowLen(c, 5), Infinity, "no shadow before sunrise");
  assert.equal(SKY.phaseAt(4), "full");
  assert.ok(Math.abs(SKY.litFraction(4) - 1) < 1e-9 && SKY.litFraction(0) < 1e-9 && Math.abs(SKY.litFraction(2) - 0.5) < 1e-9);
  assert.ok(SKY.waxing(1) && !SKY.waxing(5), "waxing before full (lit on the right in India)");
  assert.equal(SKY.daysAfterNew(4), 14.8, "half of 29.53 days");
  assert.ok(SKY.dayNightMeets("night", 21) && !SKY.dayNightMeets("night", 12) && SKY.dayNightMeets("noon", 12));
  assert.equal(SKY.poeOf(c).answer, "noon");
  assert.equal(SKY.poeOf(SKY.normalize({ scene: "phases" })).answer, "full");
});

test("motion-lab@1: closed-form goldens", () => {
  assert.equal(MO.travelled(4, 5), 20);
  const c = MO.normalize({ scene: "friction" });
  assert.equal(MO.farthest(c), "ice");
  assert.ok(MO.stoppingDistance(3, "ice") > MO.stoppingDistance(3, "wood") && MO.stoppingDistance(3, "wood") > MO.stoppingDistance(3, "sand"));
  assert.ok(Math.abs(MO.period(50) - 1.419) < 0.001, `T(50 cm) = ${MO.period(50)}`);
  assert.equal(MO.period(50, 50), MO.period(50, 200), "mass does not change the period");
  assert.equal(MO.pendulumAnswer("mass"), "same");
  assert.equal(MO.pendulumAnswer("length"), "slower");
  assert.ok(MO.fairTest([{ L: 50, m: 50 }, { L: 50, m: 100 }], "mass") && !MO.fairTest([{ L: 50, m: 50 }, { L: 60, m: 100 }], "mass"), "changing two things is not a fair test");
  assert.ok(MO.normalize({ scene: "speed", distance: 21, time: 5 }).error, "a speed that is not a whole m/s is refused");
});

test("water-cycle@1: cycle routing, state plateaus, groundwater", () => {
  assert.deepEqual(WC.applyProcess("sea", "evaporate", false), { to: "sea", ok: false, misc: "evaporate_without_heat" });
  assert.equal(WC.applyProcess("vapour", "rain", true).misc, "rain_from_vapour");
  let at = "sea";
  const path = [at];
  for (const pr of ["evaporate", "condense", "rain", "flow", "flow"]) { at = WC.applyProcess(at, pr, true).to; path.push(at); }
  assert.ok(WC.loopClosed(path));
  assert.ok(!WC.loopClosed(["sea", "vapour", "sea"]));
  // temperature is flat while melting and while boiling
  const temps = Array.from({ length: WC.MAX_KJ + 1 }, (_, kj) => WC.stateAt(kj));
  const boiling = temps.filter((s) => s.state === "boiling");
  assert.ok(boiling.length >= 3 && boiling.every((s) => s.tempC === 100));
  assert.ok(temps.filter((s) => s.state === "melting").every((s) => s.tempC === 0));
  assert.equal(temps[0].tempC, -10);
  assert.equal(WC.boilingTrend(), "stays");
  assert.ok(WC.statesMeets("boiling", 10) && !WC.statesMeets("boiling", 5));
  const g = WC.normalize({ scene: "groundwater" });
  assert.ok(!WC.groundwaterMeets(g, "city", 2) && WC.groundwaterMeets(g, "forest", 2) && !WC.groundwaterMeets(g, "forest", 1), "pumping enough + recharge");
});
