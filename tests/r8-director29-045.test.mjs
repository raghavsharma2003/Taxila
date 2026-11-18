// Brain 045 (docs/patches/to-brain/045-director29-picture-rungs-start.md, dc-r8-director29): each rule pinned from the order's sentences on
// small fragments or today's scripts, and each new or changed predicate on the director29 rows the order lists
// (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director29; rows are 0-based indexes into a lesson's `director`). Learning
// 018 rewrites the pilot scripts at the same time: nothing here pins a sentence of today's script.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { heldOf, pictureBoardOf } from "../server/brain/propose.js";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director29");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const FILE = { c4: "c4-ch05-t01", c5t01: "c5-ch02-t01", c5t02: "c5-ch02-t02", c6: "c6-ch06-t01" };
const cache = new Map();
const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(RUN, `${persona}-${FILE[t]}.json`), "utf8"));
    cache.set(k, { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) });
  }
  return cache.get(k);
};
export const flagged = (persona, t, name) => new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row));

describe("P1: a picture turn draws the board the walk named", () => {
  test("pictureDrawn reads steering row 14 in all four pilots (the held panel was the lesson's held unit, not the keyed card's answer board)", () => {
    for (const t of ["c4", "c5t01", "c5t02", "c6"]) assert.ok(flagged("steering", t, "pictureDrawn").has(14), t);
  });
  test("pictureDrawn reads 0 on a picture turn whose held panel is the board the plan named", () => {
    const { rows } = lesson("steering", "c5t01");
    const r = structuredClone(rows[14]);
    r.held.layout.panels[0].unit = r.held.intent.unit;
    const flags = lessonFlags({ rows: [...rows.slice(0, 14), r], script: lesson("steering", "c5t01").script }).filter((f) => f.predicate === "pictureDrawn" && f.row === 14);
    assert.deepEqual(flags, []);
  });
  test("one function names a picture turn's board, and it is the held board from the first word", () => {
    const board = { template: "fraction-bars@1", params: { bars: [{ parts: 4, shade: 2, label: "2/4" }] } };
    const up = { board: { template: "fraction-parts@1", params: { parts: 2, shade: 1, whole: "bar" } }, unit: "x-s1:e1" };
    const move = { kind: "reteach", request: "visual", keyedPicture: true, scriptBeat: { scriptId: "x", skillId: "x-s1", beatId: "then:m", kind: "check", board } };
    assert.deepEqual(pictureBoardOf(move)?.board, board);
    const h = heldOf({ move, list: null, line: "", kit: null, up });
    assert.deepEqual(h.board, board, "the board the walk named, never the board up");
    assert.equal(pictureBoardOf({ ...move, request: "repeat" }), null, "no picture asked: none named");
    // (no caption for the board: it is redrawn alone)
    assert.equal(heldOf({ move: { ...move, pictureAlone: true }, list: null, line: "", kit: null, up }).noView, true);
  });
});

describe("P2: the page's start, one function", () => {
  test("pageStart reads c5-t01 stuck 8: the easier-words line folded into the help's part, its page drawn at the line", () => {
    assert.ok(flagged("stuck", "c5t01", "pageStart").has(8));
  });
  test("partStartOf skips a seam's joint form at the head of a part, and nothing else", async () => {
    const { partStartOf } = await import("../evals/hybrid-side-by-side/d30-predicates.mjs");
    const r = { text: "Haan, aasaan shabdon mein. Ek roti ko beech se kaato.", seams: [{ joint: "hindiSwitch", form: "Haan, aasaan shabdon mein." }] };
    assert.equal(partStartOf(r, { from: 0 }), r.text.indexOf("Ek"));
    assert.equal(partStartOf({ ...r, seams: [] }, { from: 0 }), 0);
  });
});

describe("P3: two rungs and two cues", () => {
  test("stepToldEarly reads every asked step told with its simpler unsaid", () => {
    for (const [p, t, i] of [["stuck", "c4", 36], ["stuck", "c5t01", 20], ["stuck", "c5t02", 20], ["offtopic", "c5t02", 16], ["steering", "c5t02", 28],
      ["stuck", "c6", 20], ["offtopic", "c6", 16], ["steering", "c6", 28]]) assert.ok(flagged(p, t, "stepToldEarly").has(i), `${p} ${t} row ${i}`);
  });
  test("keyEarly reads a follow-up card keyed with its remediation's wordings unsaid", () => {
    for (const [p, t, i] of [["steady", "c5t01", 88], ["stuck", "c5t01", 42], ["offtopic", "c5t01", 22], ["steering", "c5t01", 10],
      ["steady", "c6", 8], ["steady", "c6", 90], ["stuck", "c6", 42], ["stuck", "c6", 76], ["steering", "c6", 10]]) assert.ok(flagged(p, t, "keyEarly").has(i), `${p} ${t} row ${i}`);
  });
  test("requestHelped reads the \"nothing easier\" line said for a follow-up card while its remediation's wordings are unsaid", () => {
    for (const [p, t, i] of [["stuck", "c6", 46], ["steering", "c6", 16], ["steering", "c5t02", 16]]) assert.ok(flagged(p, t, "requestHelped").has(i), `${p} ${t} row ${i}`);
  });
  test("pickHelp: an asked step's simpler first, the step asked again; none at the second request; a follow-up card's ladder runs on into its remediation", async () => {
    const { pickHelp, ladderOf, helpPart } = await import("../server/director/help.js");
    const script = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${TOPIC.c4}.json`), "utf8"));
    const S = script.skills[0].skillId;
    const d = pickHelp({ script, part: `${S}:worked:step1`, request: "give_up", said: [] });
    assert.equal(d.card, "keep"); assert.equal(d.rung.field, "simpler"); assert.equal(d.stepAsked, true);
    const k = d.rung.text.toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, "").trim();
    assert.equal(pickHelp({ script, part: `${S}:worked:step1`, request: "clarify", said: [{ k }] }), null, "the second request: the walk tells the step");
    const then = `${S}:rem:0:then`;
    const fields = ladderOf(script, helpPart(script, then)).map((r) => r.path);
    assert.ok(fields.some((f) => /remediation\[0\]\.(?:sayAlt|simpler)$/.test(f)), `the remediation's wordings are on the then-card's ladder: ${fields}`);
  });
});
