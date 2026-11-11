// 2026-11-11 (Learning's reader pass over the staged lesson scripts, via main):
//   1. angle@1 draws REFLEX / outside angles (deg 181-350; `inside` draws the corner too): the arc the long way round, its
//      degrees outside along it, never on an arm or the inside arc; an answer `mark` on the outside arc. Fit: W1/W2 and
//      the tray at p360, p412 and l1366 (digits at the serving floor), on the board as it starts and as it settles.
//   2. lines@1 names and marks two angles at a crossing (vertically opposite: at 1 and 3; adjacent: at 1 and 2), the
//      given degrees written, "?" for the asked one, an answer `mark` { at, show } on either.
//   3. expand() refuses a mark naming what the board does not draw (mark_target_missing), in every template that takes
//      one and on templates that take none; good marks unchanged; no shipped board errors.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { settledScript, opGeometry } from "../shared/whiteboard.js";
import { expand } from "../server/forge/explainer/templates.js";
import { resolveBoardRef, refNumbersOf, certifyBoardRef, BOARD_REFS } from "../server/forge/explainer/board-ref.js";
import { gateWhiteboard, segmentsOf, segHitsBox, innerBox } from "../server/studio/qa/whiteboard.js";
import { boardAt, contractBox, VP_CLASSES, SERVE_FLOOR_PX } from "../server/forge3/tray-gate.js";

const ok = (call) => { const x = expand(call); assert.ok(x.ok, `${JSON.stringify(call)}: ${x.errors}`); return x.script; };
const FIT = ["W1.fits_stage", "W2.no_text_overlap", "W2.text_clear_of_lines"];
const texts = (s) => s.ops.filter((o) => o.op === "text").map((o) => o.text);

/** The fit checks at the board as it starts and as it settles, the tray at the three judged boxes, and every word clear of
 *  every stroke (arcs included: W2 judges straight lines only) and of every other word. */
function assertFits(script, reply) {
  for (const s of [script, settledScript(script)]) {
    const g = gateWhiteboard(s, { reply, speechMs: 15000, authoredRef: true });
    for (const id of FIT) assert.ok(g.checks.find((c) => c.id === id)?.pass, `${id}: ${JSON.stringify(g.checks.find((c) => c.id === id)?.detail)}`);
  }
  for (const vp of VP_CLASSES) {
    const r = boardAt(script, contractBox(vp));
    assert.ok(r.ok && r.minPx >= SERVE_FLOOR_PX, `${vp}: ${r.why}`);
  }
  const s = settledScript(script), byId = new Map(s.ops.map((o) => [o.id, o]));
  const words = s.ops.filter((o) => o.op === "text").map((o) => ({ o, b: innerBox(opGeometry(o, byId).box) }));
  const segs = [...segmentsOf(s.ops), ...s.ops.filter((o) => o.op === "stroke").flatMap((o) => o.points.slice(1).map((p, k) => ({ id: o.id, a: o.points[k], b: p })))];
  for (const w of words) {
    for (const g of segs) assert.ok(!segHitsBox(g.a, g.b, w.b), `"${w.o.text}" crossed by ${g.id}`);
    for (const v of words) if (v !== w) assert.ok(!(w.b.x < v.b.x + v.b.w && v.b.x < w.b.x + w.b.w && w.b.y < v.b.y + v.b.h && v.b.y < w.b.y + w.b.h), `"${w.o.text}" on "${v.o.text}"`);
  }
}
/** The direction (degrees, counter-clockwise, screen y down) of p seen from v. */
const dirOf = (v, p) => ((Math.atan2(v[1] - p[1], p[0] - v[0]) * 180) / Math.PI + 360) % 360;
const centre = (o) => { const b = opGeometry(o).box; return [b.x + b.w / 2, b.y + b.h / 2]; };

describe("1. angle@1: reflex and outside angles", () => {
  const cases = [
    [{ angles: [{ deg: 260 }] }, "Yeh kona 260° ka hai."],
    [{ angles: [{ deg: 240 }] }, "Yeh kona 240° ka hai."],
    [{ angles: [{ deg: 300, inside: true }] }, "Andar ka kona 60° hai, bahar wala 300°."],
    [{ angles: [{ deg: 300, name: "?", inside: true }] }, "Andar ka kona 60° hai. Bahar wala kona kitna hai?"],
    [{ angles: [{ deg: 260 }], mark: { index: 0, show: "deg" } }, "Haan, yeh kona 260° hai."],
    [{ angles: [{ deg: 240, name: "x" }], mark: { index: 0, show: "deg" } }, "Haan, x = 240°."],
    [{ angles: [{ deg: 300, inside: true }], mark: { index: 0, show: "bigger" } }, "Bahar wala kona 300° hai, andar wala 60°."],
    [{ angles: [{ deg: 60 }, { deg: 300, inside: true }] }, "60° ka kona, aur uske bahar 300°."],
    [{ angles: [{ deg: 260 }, { deg: 100 }], mark: { index: 0, show: "deg" } }, "260° aur 100°: dono milkar 360°."],
    [{ angles: [{ deg: 200 }, { deg: 270, inside: true }, { deg: 350 }] }, "200°, 270° aur 350° ke kone; 90° andar."],
  ];
  it("each fits: W1/W2 at start and settled, the three tray boxes at the floor, no word on an arm, an arc or a word", () => {
    for (const [p, line] of cases) assertFits(ok({ template: "angle@1", ...p }), line);
  });
  it("260° and 240°: the arms open at 100° and 120°, the arc runs the long way round, the degrees beyond it, away from both arms", () => {
    for (const deg of [260, 240]) {
      const s = settledScript(ok({ template: "angle@1", angles: [{ deg }] }));
      const h = s.ops.find((o) => o.id === "h0"), r = s.ops.find((o) => o.id === "r0"), v = h.from;
      assert.ok(Math.abs(dirOf(v, r.to) - (360 - deg)) < 1, `the second arm at ${360 - deg}°`);
      const arc = s.ops.find((o) => o.id === "m0");
      const span = arc.points.map((p) => dirOf(v, p));
      assert.ok(Math.abs(span[0] - (360 - deg)) < 2 && Math.abs((span.at(-1) % 360)) < 2, "from the second arm round to the first");
      assert.ok(span.some((a) => a > 180 && a < 360), "through the outside (below the first arm)");
      const lab = s.ops.find((o) => o.op === "text" && o.text === `${deg}°`);
      const a = dirOf(v, centre(lab)), opening = (360 - deg) / 2;
      const off = Math.abs(((a - opening - 180 + 540) % 360) - 180);
      assert.ok(off < 30, `the degrees face away from the opening (${Math.round(a)}°)`);
      assert.deepEqual(texts(s), [`${deg}°`], "one label: the reflex angle's degrees, never the inside angle's");
    }
  });
  it("the 300° outside a 60° corner: both arcs, both labels, the asked one '?'", () => {
    const s = ok({ template: "angle@1", angles: [{ deg: 300, name: "?", inside: true }] });
    assert.deepEqual(texts(s).sort(), ["60°", "?"]);
    assert.equal(s.facts.onScreen.angle1, "?, inside 60°");
    assert.ok(refNumbersOf(resolveBoardRef({ template: "angle@1", angles: [{ deg: 300, inside: true }] }).call).includes("60"));
  });
  it("the answer mark is on the OUTSIDE arc, its degrees outside it", () => {
    const s = settledScript(ok({ template: "angle@1", angles: [{ deg: 300, inside: true }], mark: { index: 0, show: "deg" } }));
    const v = s.ops.find((o) => o.id === "h0").from;
    const ans = s.ops.filter((o) => o.role === "answer");
    const arc = ans.find((o) => o.op === "stroke");
    assert.ok(arc.points.map((p) => dirOf(v, p)).some((a) => a > 200 && a < 340), "the thick arc goes round the outside");
    assert.equal(ans.find((o) => o.id === "mark").text, "300°");
    assert.equal(s.facts.onScreen.marked, "angle 1: 300°");
  });
  it("certified as a card's board (the full gate against her line)", async () => {
    for (const [p, line] of cases.slice(0, 6)) {
      const r = await certifyBoardRef({ template: "angle@1", params: p }, { line, withhold: { values: [] } });
      assert.equal(r.ok, true, `${JSON.stringify(p)}: ${JSON.stringify(r.failed)}`);
    }
  });
  it("refused: past 350°, inside on an angle up to 180, a corner name on a reflex board", () => {
    assert.deepEqual(expand({ template: "angle@1", angles: [{ deg: 355 }] }).errors, ["angles"]);
    assert.deepEqual(expand({ template: "angle@1", angles: [{ deg: 60, inside: true }] }).errors, ["angles"]);
    assert.deepEqual(expand({ template: "angle@1", angles: [{ deg: 260 }], vertex: "kona" }).errors, ["angle_reflex_parts"]);
  });
  it("BOARD_REFS documents it", () => assert.match(BOARD_REFS["angle@1"].params, /181-350.*inside\?/s));
});

describe("2. lines@1: two angles at a crossing, named and marked", () => {
  const X = { template: "lines@1", kind: "cross", deg: 60, ends: ["A", "B", "C", "D"], point: "O" };
  it("vertically opposite (saamne wala: at 1 and 3) and adjacent (bagal wala: at 1 and 2): the given degrees, '?' asked", () => {
    const opp = ok({ ...X, angles: [{ at: 1, value: 60 }, { at: 3, value: "?" }] });
    assert.deepEqual(opp.facts.counts.marks, [{ at: "angle 1", label: "60°" }, { at: "angle 3", label: "?" }]);
    const adj = ok({ ...X, angles: [{ at: 1, value: 60 }, { at: 2, value: "?" }] });
    assert.deepEqual(adj.facts.counts.marks, [{ at: "angle 1", label: "60°" }, { at: "angle 2", label: "?" }]);
  });
  it("an answer mark on either angle: its arc thickened and its degrees written, in the answer role", () => {
    for (const [angles, at, want, line] of [
      [[{ at: 1, value: 60 }, { at: 3, value: "?" }], 3, "60°", "Haan, saamne wala kona bhi 60° hai."],
      [[{ at: 1, value: 60 }, { at: 2, value: "?" }], 2, "120°", "Bagal wala kona 180 − 60 = 120° hai."],
      [[{ at: 1, value: 60 }, { at: 3, value: "?" }], 1, "60°", "Yeh kona 60° hai."],
      [[{ at: 1, value: 90 }, { at: 2, value: "?" }], 2, "90°", "Dono kone 90° ke hain."],
    ]) {
      const call = { ...X, ...(want === "90°" ? { deg: 90 } : {}), angles, mark: { at } };
      const s = ok(call);
      const ans = s.ops.filter((o) => o.role === "answer");
      assert.equal(ans.find((o) => o.id === "mark").text, want);
      assert.ok(ans.some((o) => o.op === "stroke" && o.weight === 3), "the arc thickened");
      assert.ok(!texts(s).includes("?") || angles.filter((a) => a.value === "?").length > (angles.find((a) => a.at === at).value === "?" ? 1 : 0), "the marked '?' is answered");
      assert.equal(s.facts.onScreen.marked, `angle ${at}: ${want}`);
      assert.ok(refNumbersOf(resolveBoardRef(call).call).includes(want.replace("°", "")));
      assertFits(s, line);
    }
    const ring = ok({ ...X, angles: [{ at: 1, name: "∠1" }, { at: 3, name: "∠3" }], mark: { at: 3, show: "ring" } });
    assert.equal(ring.ops.find((o) => o.id === "mark").op, "highlight");
  });
  it("certified as a card's answer board", async () => {
    const r = await certifyBoardRef({ template: "lines@1", params: { kind: "cross", deg: 60, ends: ["A", "B", "C", "D"], point: "O", angles: [{ at: 1, value: 60 }, { at: 3, value: "?" }], mark: { at: 3 } } }, { line: "Haan, saamne wala kona bhi 60° hai.", withhold: { values: [] } });
    assert.equal(r.ok, true, JSON.stringify(r.failed));
  });
  it("BOARD_REFS documents the mark", () => assert.match(BOARD_REFS["lines@1"].params, /mark\? .*at k/));
});

describe("3. a mark naming what the board does not draw is refused (mark_target_missing), never moved", () => {
  const cmp = { template: "compare@1", left: { title: "Anil", items: ["₹60", "₹20"] }, right: { title: "Bina", items: ["₹70"] } };
  const bad = [
    [{ ...cmp, mark: { side: "middle" } }, /side "middle"/],
    [{ ...cmp, mark: { side: "right", item: 1 } }, /right item 1/],
    [{ ...cmp, mark: { side: "left", item: 0, add: "₹80" } }, /item and add/],
    [{ template: "angle@1", angles: [{ deg: 60 }, { deg: 110 }], mark: { index: 2, show: "deg" } }, /angle 2 /],
    [{ template: "angle@1", angles: [{ deg: 60 }], mark: { show: "deg" } }, /angle null/],
    [{ template: "number-line-hop@1", start: 2, hops: [3, 3], mark: { hop: 2 } }, /hop 2/],
    [{ template: "number-line-hop@1", start: 2, hops: [3, 3], mark: { land: true, hop: 0 } }, /land and hop/],
    [{ template: "number-line-hop@1", start: 2, hops: [3, 3], mark: {} }, /no land or hop/],
    [{ template: "place-value@1", value: 2864, mark: { place: "lakhs" } }, /place "lakhs"/],
    [{ template: "fraction-line@1", den: 4, to: 1, mark: 5 }, /mark 5 \(the line has marks 1-4\)/],
    [{ template: "fraction-line@1", den: 4, to: 1, mark: 0 }, /mark 0/],
    [{ template: "fraction-line@1", den: 4, to: 1, mark: 1, marks: [{ num: 2 }] }, /never drawn/],
    [{ template: "fraction-line@1", den: 4, to: 1, target: [1, 3] }, /target \[1,3\]/],
    [{ template: "fraction-line@1", dens: [4, 8], to: 1, mark: 1 }, /two-denominator/],
    [{ template: "lines@1", kind: "cross", deg: 60, angles: [{ at: 1, value: 60 }, { at: 3, value: "?" }], mark: { at: 4 } }, /angle 4 \(the board labels angles 1, 3\)/],
    [{ template: "lines@1", kind: "parallel", names: ["AB", "CD"], mark: { at: 1 } }, /labels angles none/],
    [{ template: "shape@1", shape: "circle", radius: "radius", mark: { index: 0 } }, /shape@1 draws no mark/],
    [{ template: "measured@1", shape: "rect", w: 6, h: 4, unit: "cm", mark: { side: 0 } }, /measured@1 draws no mark/],
    [{ template: "fraction-bars@1", bars: [{ parts: 4, shade: 1 }], marks: [{ num: 1 }] }, /draws no marks/],
  ];
  it("one bad mark per template, refused with its reason", () => {
    for (const [call, why] of bad) {
      const x = expand(call);
      assert.equal(x.ok, false, JSON.stringify(call));
      assert.ok(x.errors.length === 1 && x.errors[0].startsWith("mark_target_missing:") && why.test(x.errors[0]), `${JSON.stringify(call)} → ${x.errors}`);
    }
  });
  it("good marks unchanged", () => {
    for (const call of [
      { ...cmp, mark: { side: "right" } }, { ...cmp, mark: { side: "left", item: 1 } }, { ...cmp, mark: { side: "right", add: "₹85" } },
      { template: "angle@1", angles: [{ deg: 60 }, { deg: 110 }], mark: { index: 1 } },
      { template: "number-line-hop@1", start: 2, hops: [3, 3], mark: { land: true } }, { template: "number-line-hop@1", start: 2, hops: [3, 3], mark: { hop: 1 } },
      { template: "place-value@1", value: 2864, mark: { place: "thousands", value: true } },
      { template: "fraction-line@1", den: 4, to: 2, mark: 8 }, { template: "fraction-line@1", den: 4, to: 1, target: [3, 4] },
      { template: "fraction-line@1", den: 4, to: 1, marks: [{ num: 2, label: "2/4 = 1/2" }], hop: { num: 2 } },
      { template: "number-line-scale@1", from: 0, to: 10000, step: 1000, marks: [{ value: 4815 }] },
    ]) ok(call);
  });
  it("no shipped board errors: every board in data/lesson-scripts and data/lesson-scripts-staged still resolves", () => {
    let n = 0, marked = 0;
    const fails = [];
    for (const dir of ["data/lesson-scripts", "data/lesson-scripts-staged"]) {
      for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
        const walk = (v, path) => {
          if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
          if (!v || typeof v !== "object") return;
          if (typeof v.template === "string" && v.template.includes("@")) {
            n++;
            if ((v.params ?? v).mark !== undefined) marked++;
            const r = resolveBoardRef(v);
            if (!r.ok) fails.push(`${dir}/${f} ${path} ${v.template} ${JSON.stringify((v.params ?? v).mark ?? null)}: ${r.why}`);
          }
          for (const [k, x] of Object.entries(v)) if (k !== "params") walk(x, `${path}.${k}`);
        };
        walk(JSON.parse(readFileSync(`${dir}/${f}`, "utf8")), "");
      }
    }
    assert.ok(n > 1000 && marked > 100, `${n} boards, ${marked} marked`);
    assert.deepEqual(fails, []);
  });
});
