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
  // (re-pinned by name, to-brain 054 C5 — main's ruling on question 4 and RULING-C2 item 4: at a follow-up card help is the card's own
  // simpler, then the key; a remediation's sayAlt and simpler are no rungs of the then-card's ladder. The old pin guarded P3's "a follow-up
  // card's ladder runs on into its remediation": these nine rows were keyed with the remediation's wordings unsaid and nothing of the
  // card's own ladder unsaid, which C5 makes the right moment for the key. keyEarly still guards a key given with the card's own simpler unsaid, and
  // d37c's thenHelpOtherBoard now guards the remediation's wordings said at the card)
  test("keyEarly (C5): a follow-up card keyed with its own simpler said is not early; keyed with its own simpler unsaid it is", () => {
    for (const [p, t, i] of [["steady", "c5t01", 88], ["stuck", "c5t01", 42], ["offtopic", "c5t01", 22], ["steering", "c5t01", 10],
      ["steady", "c6", 8], ["steady", "c6", 90], ["stuck", "c6", 42], ["stuck", "c6", 76], ["steering", "c6", 10]]) assert.ok(!flagged(p, t, "keyEarly").has(i), `${p} ${t} row ${i}`);
    // (stuck c5-t01: row 40 said the follow-up card's own simpler as help; with it unsaid, the key at 42 is early)
    const L = lesson("stuck", "c5t01");
    const rows = L.rows.map((r, n) => (n !== 40 ? r : { ...r, text: "Yeh jawab sahi nahi hai. Ab phir se socho, jawab kya hoga?", seams: r.seams.filter((x) => x.right !== "help"), pageParts: (r.pageParts ?? []).filter((x) => x.part !== "simpler") }));
    assert.ok(lessonFlags({ rows, script: L.script }).some((f) => f.predicate === "keyEarly" && f.row === 42));
  });
  test("requestHelped reads the \"nothing easier\" line said for a follow-up card while its remediation's wordings are unsaid", () => {
    for (const [p, t, i] of [["stuck", "c6", 46], ["steering", "c6", 16], ["steering", "c5t02", 16]]) assert.ok(flagged(p, t, "requestHelped").has(i), `${p} ${t} row ${i}`);
  });
  // (the last assertion re-pinned by name, to-brain 054 C5 / RULING-C2 item 4: the old pin guarded P3's ladder running on into the
  // remediation's wordings; C5 drops them — the then-card's ladder is its own simpler only; thenHelpOtherBoard guards it in the walk)
  test("pickHelp: an asked step's simpler first, the step asked again; none at the second request; a follow-up card's ladder is its own simpler (C5)", async () => {
    const { pickHelp, ladderOf, helpPart, addSaid } = await import("../server/director/help.js");
    const script = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${TOPIC.c4}.json`), "utf8"));
    const S = script.skills[0].skillId;
    const d = pickHelp({ script, part: `${S}:worked:step1`, request: "give_up", said: [] });
    assert.equal(d.card, "keep"); assert.equal(d.rung.field, "simpler"); assert.equal(d.stepAsked, true);
    // (repinned d31: Learning 019 rewrote this step's simpler in two sentences — the said set holds it as the walk does, sentence by sentence)
    assert.equal(pickHelp({ script, part: `${S}:worked:step1`, request: "clarify", said: addSaid([], d.rung.text, 1) }), null, "the second request: the walk tells the step");
    const then = `${S}:rem:0:then`;
    const fields = ladderOf(script, helpPart(script, then)).map((r) => r.path);
    assert.ok(!fields.some((f) => /remediation\[0\]\.(?:sayAlt|simpler)$/.test(f)), `the remediation's wordings are off the then-card's ladder: ${fields}`);
    assert.ok(fields.length >= 1 && fields.every((f) => /remediation\[0\]\.then\.simpler$/.test(f)), `the then-card's own simpler: ${fields}`);
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
  test("P6 reaskFigure reads the short ask after help about another figure (c5-t01 stuck 64, 70, offtopic 30), and 0 after help on the card's own numbers", async () => {
    for (const n of [64, 70]) assert.ok(flagged("stuck", "c5t01", "reaskFigure").has(n), `stuck ${n}`);
    assert.ok(flagged("offtopic", "c5t01", "reaskFigure").has(30));
    const { otherFigureOf } = await import("../server/brain/seams.js");
    // (director28 c4 steady 86: help on the card's own 15 pencils in 3 groups is about the card)
    assert.equal(otherFigureOf("Board ke baayein taraf likha hai ki 15 pencil ke 3 barabar group banane hain. Pehle 1/3 ka matlab dekhenge.", "15 pencil 3 barabar group mein baanto, toh ek group mein kitni pencil aayengi?"), false);
    assert.equal(otherFigureOf("Pizza ke 3 barabar hisse hon aur teeno le lo: 3/3 ek poora hai.", "1/5 wale gaps dekho. 0 se theek 1 tak pahunchne ke liye aise kitne gap chalne honge?"), true);
  });
  // (to-brain 054 A, main's sixth ruling items 2 and 6 — A(i) is design D2: her reply, its joint, ONE new point and its check-in is allowed;
  // anything else between the reply and the check-in, or nothing, is still read)
  test("P6 replyCheckin reads c4 offtopic 46 (reply, bridge, point, check-in) and a bare reply and check-in; not c5-t02 offtopic 38 (reply, joint, point, check-in: D2)", () => {
    assert.ok(flagged("offtopic", "c4", "replyCheckin").has(46));
    assert.ok(!flagged("offtopic", "c5t02", "replyCheckin").has(38));
    const { rows, script } = lesson("offtopic", "c5t02");
    const r = rows[38], cut = (r.pageParts ?? []).find((p) => p.part === "body")?.from;
    assert.ok(cut > 0);
    const bare = { ...r, text: `${r.text.slice(0, cut).trim()} Yahan tak theek hai?`, pageParts: [], seams: r.seams.filter((x) => x.right !== "point") };
    assert.ok(lessonFlags({ rows: [...rows.slice(0, 38), bare], script }).some((f) => f.predicate === "replyCheckin" && f.row === 38));
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
    const q = rows[62].text.split(/(?<=[.?!])\s+/).at(-1);
    r.text = r.text.replace(/Ab phir se socho, jawab kya hoga\?$/, q);
    r.seams = r.seams.map((x) => (x.right === "reaskShort" ? { ...x, right: "card" } : x));
    const rows2 = [...rows.slice(0, 64), r];
    assert.equal(D29_PREDICATES.reaskTwice({ rows: rows2 }, r, 64), null);
    // (the same re-ask after help on the card's own numbers is still read)
    const r2 = { ...r, text: `Nahi, yeh theek nahi hai. 1/5 wale gaps gino. ${q}` };
    assert.ok(D29_PREDICATES.reaskTwice({ rows: [...rows.slice(0, 64), r2] }, r2, 64));
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
