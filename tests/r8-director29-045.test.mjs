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

describe("P4: a second request at the greeting starts the lesson", () => {
  test("helpSpentCold reads row 4 where the \"nothing easier\" line came before anything was taught", () => {
    for (const [p, t] of [["stuck", "c4"], ["stuck", "c5t02"], ["stuck", "c6"], ["offtopic", "c4"], ["steering", "c4"], ["steering", "c5t02"], ["steering", "c6"]])
      assert.ok(flagged(p, t, "helpSpentCold").has(4), `${p} ${t}`);
  });
  test("startAnyway: code's three forms of six words or fewer, and a compile hole where a script has none", async () => {
    const { FALLBACK_JOINTS, helpJointHoles, helpJoint } = await import("../server/director/help.js");
    assert.equal(FALLBACK_JOINTS.startAnyway.length, 3);
    for (const f of FALLBACK_JOINTS.startAnyway) assert.ok(f.hi.split(/\s+/).length <= 6 && f.en.split(/\s+/).length <= 6, f.hi);
    assert.ok(helpJointHoles({ joints: {} }).some((h) => h.joint === "startAnyway"));
    assert.ok(!helpJointHoles({ joints: { startAnyway: [{ hi: "Chalo.", en: "Come on." }] } }).some((h) => h.joint === "startAnyway"));
    assert.equal(helpJoint({ joints: {} }, "startAnyway").by, "code");
  });
});

describe("P5-P7: a right answer goes on; seams; the record", () => {
  test("a park line takes joints.afterPark into the live part where the script writes one, and goes straight on where it has none", async () => {
    const { seamJoint } = await import("../server/brain/seams.js");
    for (const k of ["point", "card", "help"]) assert.equal(seamJoint("park", k), "afterPark");
    const { seamPass } = await import("../server/brain/seams.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const { setScriptForTest } = await import("../server/director/script.js");
    const T = TOPIC.c6, kit = kitFromFile(getTopic(T));
    const sc = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${T}.json`), "utf8"));
    const park = "Cricket ki baat bhi hogi, bas yeh kaam poora ho jaaye.";
    const list = [{ part: "aside", text: park }, { part: "card", text: "Is triangle ka parimap kitna hai?" }];
    const carriers = [{ kind: "asidePark", re: /cricket ki baat bhi hogi/ }];
    try {
      setScriptForTest(T, { ...sc, joints: { ...sc.joints, afterPark: [{ hi: "Ab apne sawaal par.", en: "Now, our question." }] } });
      const r1 = seamPass(list, { kit, state: { ctx: { lang: "hinglish" } }, lang: "hinglish", info: { carriers } });
      const s1 = (r1.seams ?? []).find((x) => x.right === "card");
      if (s1?.left === "park") assert.equal(s1.joint, "afterPark");
      const { afterPark: _a, ...joints } = sc.joints;
      setScriptForTest(T, { ...sc, joints });
      const r2 = seamPass(list, { kit, state: { ctx: { lang: "hinglish" } }, lang: "hinglish", info: { carriers } });
      assert.ok(!(r2.seams ?? []).some((x) => x.joint === "afterPark"), "no form: straight on");
    } finally { setScriptForTest(); }
  });
});

describe("P5-P7 (d30 completion): the rows the order names", () => {
  test("P6 reaskFigure reads the short ask after help drawn on another figure's board (c5-t01 stuck 64, offtopic 30), and 0 with the help on the card's board", async () => {
    assert.ok(flagged("stuck", "c5t01", "reaskFigure").has(64));
    assert.ok(flagged("offtopic", "c5t01", "reaskFigure").has(30));
    const { rows } = lesson("stuck", "c5t01");
    const r = structuredClone(rows[64]);
    const card = r.pageParts.find((p) => p.part === "card");
    for (const p of r.pageParts) if (p.part === "simpler") { p.own = card.own; p.boards = card.boards; }
    const { D30_PREDICATES } = await import("../evals/hybrid-side-by-side/d30-predicates.mjs");
    assert.equal(D30_PREDICATES.reaskFigure({ rows }, r, 64), null);
  });
  test("P6 replyCheckin reads her reply's turn ending on a check-in (c4 offtopic 46, c5-t02 offtopic 38)", () => {
    assert.ok(flagged("offtopic", "c4", "replyCheckin").has(46));
    assert.ok(flagged("offtopic", "c5t02", "replyCheckin").has(38));
  });
  test("P6: her reply into the next skill's bridge takes its joint back, as into a point", async () => {
    const { seamJoint } = await import("../server/brain/seams.js");
    assert.equal(seamJoint("aiReply", "bridge"), "afterAiLine");
    assert.equal(seamJoint("asideReply", "bridge"), "afterAside");
  });
  test("P6: reaskTwice does not read the card's own re-ask after help about another figure", async () => {
    const { D29_PREDICATES } = await import("../evals/hybrid-side-by-side/d29-predicates.mjs");
    const { rows } = lesson("stuck", "c5t01");
    const r = structuredClone(rows[64]);
    r.text = r.text.replace(/Ab phir se socho, jawab kya hoga\?$/, rows[62].text.split(/(?<=[.?!])\s+/).at(-1));
    r.seams = r.seams.map((x) => (x.right === "reaskShort" ? { ...x, right: "card" } : x));
    assert.equal(D29_PREDICATES.reaskTwice({ rows: [...rows.slice(0, 64), r] }, r, 64), null);
  });
});

describe("P7 (d30 completion): the record", () => {
  const run = async (list, info) => {
    const { seamPass } = await import("../server/brain/seams.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const kit = kitFromFile(getTopic(TOPIC.c4));
    return seamPass(list, { kit, state: { ctx: { lang: "hinglish" } }, lang: "hinglish", info }).seams;
  };
  test("the greeting's question after its simpler wording is not recorded as a point (row 2 in stuck and steering lessons, c4 steady 2)", async () => {
    const g = "Aaj hum barabar tukdon ki baat karenge.";
    const seams = await run([{ part: "body", text: g }, { part: "body", text: "Chalo, shuru karein?" }], { greetSimpler: g, greetTurn: true });
    assert.ok(!seams.some((x) => x.right === "point"), JSON.stringify(seams));
    assert.equal(seams.at(-1).right, "greetAsk");
  });
  test("one start seam a turn, no hook > hook: the start line after a second request, the Hindi switch (row 4; c4 steady 36, stuck 8, steering 8)", async () => {
    const form = "Chalo, main batati hoon.";
    const s1 = await run([{ part: "close", text: form }, { part: "close", text: "Kitchen mein Maa ne roti banayi." }, { part: "body", text: "Roti ke do barabar tukde hain." }, { part: "card", text: "Ek tukda kitna hai?" }],
      { greet: true, helpJoint: { kind: "startAnyway", form, by: "authored" } });
    assert.equal(s1.filter((x) => x.left === "start").length, 1, JSON.stringify(s1));
    assert.ok(!s1.some((x) => x.left === "hook" && x.right === "hook"), JSON.stringify(s1));
    const sw = "Achha, ise ek aasaan tareeke se kehti hoon.";
    const s2 = await run([{ part: "aside", text: sw }, { part: "simpler", text: "Board par saare tukde gino." }, { part: "card", text: "Kitne tukde hain?" }], { hindiSwitch: sw });
    assert.equal(s2.filter((x) => x.left === "start").length, 1, JSON.stringify(s2));
    assert.equal(s2[0].right, "hindiSwitch");
  });
});
