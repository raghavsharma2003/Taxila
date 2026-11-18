// Brain 044 (docs/patches/to-brain/044-fewer-kinds-of-turn.md, dc-r8-director28): fewer kinds of turn, help as a hard precondition, a joint
// keeps what is up. Each rule is pinned from the order's sentences on small inline fragments or today's scripts, and each new or changed
// predicate on the director28 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28; rows are
// 0-based indexes into a lesson's `director`). Learning 017 rewrites the four pilot scripts at the same time: nothing here pins a sentence
// of today's script.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { heldOf, heldPagesOf, pagePredicates } from "../server/brain/propose.js";
import { heldBoard } from "../server/stagecraft/board-first.js";
import { lessonFlags } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { D29_PREDICATES } from "../evals/hybrid-side-by-side/d29-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28");
const TOPIC = { c4: "c4-maths-ch05-t01", c5t01: "c5-maths-ch02-t01", c5t02: "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const FILE = { c4: "c4-ch05-t01", c5t01: "c5-ch02-t01", c5t02: "c5-ch02-t02", c6: "c6-ch06-t01" };
const lesson = (persona, t) => {
  const j = JSON.parse(readFileSync(join(RUN, `${persona}-${FILE[t]}.json`), "utf8"));
  return { rows: j.director, script: JSON.parse(readFileSync(join(RUN, "scripts", `${TOPIC[t]}.json`), "utf8")) };
};
/** The rows of a lesson a predicate flags. */
const flagged = (persona, t, name) => new Set(lessonFlags(lesson(persona, t)).filter((f) => f.predicate === name).map((f) => f.row));
/** Run a test body with strict pages on (the paging law throws), restoring the flag after. */
const strict = (fn) => { const was = process.env.TAXILA_STRICT_PAGES; process.env.TAXILA_STRICT_PAGES = "1"; try { return fn(); } finally { if (was === undefined) delete process.env.TAXILA_STRICT_PAGES; else process.env.TAXILA_STRICT_PAGES = was; } };

const B = (n) => ({ template: "fraction-parts@1", params: { parts: n, shade: 1, whole: "bar" } });
const beat = (beatId, board, kind = "explain") => ({ scriptId: "t", skillId: "sk1", beatId, kind, ...(board ? { board } : {}) });

describe("T4: a joint keeps what is up", () => {
  test("pageStart reads every T4 row of director28 (the try-first joint, the closing lead-in, the switch line, a board at its bridge's or hook's first word)", () => {
    const rows = [
      ["stuck", "c4", 28], ["steady", "c5t02", 32], ["offtopic", "c5t02", 38],
      ["steady", "c5t02", 132], ["steady", "c6", 112],
      ["steady", "c6", 4], ["stuck", "c6", 4], ["offtopic", "c6", 4], ["steering", "c6", 4],
      ["steady", "c5t02", 2], ["steady", "c5t02", 44], ["steady", "c5t02", 84], ["stuck", "c5t02", 56], ["offtopic", "c5t02", 2], ["offtopic", "c5t02", 50], ["steering", "c5t02", 60],
    ];
    for (const [p, t, i] of rows) assert.ok(flagged(p, t, "pageStart").has(i), `${p} ${t} row ${i}`);
  });
  test("pageStart reads 0 on a turn whose page starts at its part, after a joint that kept the board up", () => {
    const up = B(3), rem = B(4);
    const text = "Nahi, 2 sahi nahi hai. Ise ek alag tareeke se dekhte hain. Ek roti ke chaar barabar tukde socho aur unme se ek uthao. Yahan tak theek hai?";
    const at = (x) => text.indexOf(x);
    const r = { who: "teacher", text, seams: [{ left: "missVerdict", right: "remediation", joint: "beforeRemediation", form: "Ise ek alag tareeke se dekhte hain." }],
      pageParts: [{ part: "close", from: 0, beat: "e1", boards: [up] }, { part: "body", from: at("Ise"), beat: "rem:x", boards: [], lead: "beforeRemediation" }, { part: "body", from: at("Ek roti"), beat: "rem:x", boards: [rem] }],
      held: { pages: [{ from: 0, template: up.template }, { from: at("Ek roti"), template: rem.template }] }, segments: [{ from: 0, board: up }, { from: at("Ek roti"), board: rem }] };
    const prev = { who: "teacher", text: "Is patti mein kitne hisse hain?", boardRef: up, held: { pages: [{ from: 0, template: up.template }] } };
    const ctx = { o: {}, script: { joints: {} } };
    assert.equal(D29_PREDICATES.pageStart({ rows: [prev, r] }, prev, 0, ctx), null);
    assert.equal(D29_PREDICATES.pageStart({ rows: [prev, r] }, r, 1, ctx), null);
    // (the same turn with the remediation's page drawn at the joint's first word)
    const early = { ...r, held: { pages: [{ from: 0, template: up.template }, { from: at("Ise"), template: rem.template }] }, segments: [{ from: 0, board: up }, { from: at("Ise"), board: rem }] };
    const ctx2 = { o: {}, script: { joints: {} } };
    D29_PREDICATES.pageStart({ rows: [prev, early] }, prev, 0, ctx2);
    assert.match(String(D29_PREDICATES.pageStart({ rows: [prev, early] }, early, 1, ctx2)), /not at its body@rem:x's first word/);
  });

  test("heldOf: a seam's joint is said over the board up; the part it leads into pages at its own first word", () => strict(() => {
    const up = { board: B(3), unit: "sk1:e1" };
    const move = { kind: "reteach", scriptBeat: beat("rem:x", B(4), "remediation"), closeBeat: beat("e1", B(3)) };
    const list = [{ part: "close", text: "Nahi, yeh jawab nahi hai." }, { part: "body", text: "Ise ek alag tareeke se dekhte hain.", joint: "beforeRemediation" }, { part: "body", text: "Ek roti ke chaar barabar tukde socho." }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move, list, line, kit: null, up, graded: true });
    const pages = heldPagesOf(h);
    assert.equal(pages.length, 2);
    assert.equal(pages[1].atChar, line.indexOf("Ek roti"), "the remediation's page at its own first word, not at the joint's");
    assert.deepEqual(pages[0].board, B(3), "the joint is said over the board that was up");
  }));
  test("heldOf: with nothing up, the screen stays empty under a switch line or a hook until the first part that owns a board (`from`)", () => strict(() => {
    const move = { kind: "explain", scriptBeat: beat("e1", B(5)) };
    for (const lead of [{ part: "aside", text: "Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon.", kind: "opener" }, { part: "close", text: "Socho, do roti hain aur dono barabar hain.", kind: "hook" }, { part: "body", text: "Chalo, ab ek aakhri sawaal.", kind: "leadIn" }]) {
      const list = [lead, { part: "body", text: "Yeh patti ek poora hai: 5 barabar hisse." }, { part: "card", text: "Kitne hisse hain?" }];
      const line = list.map((p) => p.text).join(" ");
      const h = heldOf({ move: { ...move, cardBeat: beat("e1", B(5)) }, list, line, kit: null, up: null });
      assert.equal(h.from, line.indexOf("Yeh patti"), `${lead.kind}: the board comes at the point's first word`);
      assert.equal(heldPagesOf(h)[0].atChar, h.from);
    }
  }));
  test("heldOf: with a board up, a hook keeps it until the point's first word", () => strict(() => {
    const up = { board: B(2), unit: "sk0:c3" };
    const list = [{ part: "close", text: "Socho, do roti hain aur dono barabar hain.", kind: "hook" }, { part: "body", text: "Yeh patti ek poora hai: 5 barabar hisse." }, { part: "card", text: "Kitne hisse hain?" }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move: { kind: "explain", scriptBeat: beat("e1", B(5)), cardBeat: beat("e1", B(5)) }, list, line, kit: null, up });
    assert.deepEqual(h.board, B(2));
    assert.equal(h.switchTo.atChar, line.indexOf("Yeh patti"));
    assert.equal(h.from, undefined);
  }));
  test("the paging law throws on a page that starts before its part (pagePredicates)", () => {
    const text = "Chalo, ab ek aakhri sawaal. Taar kitni lambi hai?";
    const own = { board: B(7), unit: "end" };
    assert.throws(() => pagePredicates({ board: B(1), unit: "x", switchTo: { board: B(7), unit: "end", atChar: 0 + 1 } }, [{ part: "body", start: 0, own: null }, { part: "card", start: text.indexOf("Taar"), own }], text, { up: { board: B(1) } }), /P1/);
  });
  test("Studio's heldBoard draws an empty first page until `from` when nothing is up, and the held board from there", () => {
    const text = "Koi baat nahi, ise doosre, aasaan shabdon mein bolti hoon. Yeh patti ek poora hai: 5 barabar hisse, ek mein rang. Kitne hisse hain?";
    const from = text.indexOf("Yeh patti");
    const ask = { intent: { kind: "whiteboard", held: { board: { template: "fraction-parts@1", params: { parts: 5, shade: 1, whole: "bar" } }, unit: "sk1:e1", from }, style: { band: "B3", lang: "hinglish" } }, line: { text } };
    const r = heldBoard(ask, {});
    assert.ok(r?.ok, "drawn");
    assert.equal(r.screens.length, 2);
    assert.equal(r.screens[0].template, null, "nothing on screen under the switch line");
    assert.equal(r.screens[1].from, from);
    assert.equal(r.screens[1].template, "fraction-parts@1");
    // (with a board up, `from` changes nothing: the board up stays until the held board's switch, as before)
    const r2 = heldBoard({ ...ask, intent: { ...ask.intent, held: { ...ask.intent.held, from: undefined } } }, {});
    assert.equal(r2.screens.length, 1);
  });
});

import { pickHelp, helpPart, ladderOf, addSaid, FALLBACK_JOINTS } from "../server/director/help.js";
import { requestUnhelped } from "../server/director/state.js";
import { saidIn } from "../server/director/script.js";
const pilot = (t) => JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${TOPIC[t]}.json`), "utf8"));

describe("T5: help is a hard precondition", () => {
  test("requestHelped reads every T5 row of director28: the after-key return or the go-on line alone, and the worked problem after an aside reply", () => {
    const rows = [["stuck", "c5t01", 30], ["steering", "c5t01", 18], ["offtopic", "c5t01", 62], ["stuck", "c5t02", 30], ["steering", "c5t02", 58],
      ["stuck", "c5t01", 44], ["steering", "c5t01", 40], ["stuck", "c5t02", 44], ["stuck", "c6", 46], ["offtopic", "c6", 36]];
    for (const [p, t, i] of rows) assert.ok(flagged(p, t, "requestHelped").has(i), `${p} ${t} row ${i}`);
  });
  test("quickHelpCard reads the request at a quick question answered with a check-in, the card waiting (c5-t01 steady 8; c6 steady 8)", () => {
    assert.ok(flagged("steady", "c5t01", "quickHelpCard").has(8));
    assert.ok(flagged("steady", "c6", "quickHelpCard").has(8));
  });
  test("pickHelp after a key with nothing unsaid: the \"nothing easier\" line, then the go-on line — never the go-on line alone", () => {
    const script = pilot("c4");
    const id = "c4-maths-ch05-t01-s1:check:c1";
    const part = helpPart(script, id);
    let said = [];
    for (const r of ladderOf(script, part, { keyed: true })) said = addSaid(said, saidIn(r.value, "hinglish"), 1);
    const d = pickHelp({ script, part: id, keyed: true, request: "give_up", said });
    assert.equal(d.joint.kind, "helpSpent");
    assert.equal(d.then?.kind, "afterKeyGoOn");
    assert.equal(d.card, "goOn");
    // (with the why's other wording unsaid, it is said first, as before)
    const d2 = pickHelp({ script, part: id, keyed: true, request: "give_up", said: [] });
    assert.equal(d2.rung?.field, "whyAlt");
  });
  test("pickHelp on a point with nothing unsaid: the \"nothing easier\" line, then helpToCard and the card", () => {
    const script = pilot("c4");
    const id = "c4-maths-ch05-t01-s1:e1:point";
    const part = helpPart(script, id);
    let said = [];
    for (const r of ladderOf(script, part)) said = addSaid(said, saidIn(r.value, "hinglish"), 1);
    const d = pickHelp({ script, part: id, request: "give_up", said });
    assert.equal(d.card, "ask");
    assert.equal(d.joint.kind, "helpSpent");
    assert.equal(d.then?.kind, "helpToCard");
  });
  test("the walk's precondition: a request's turn with no unsaid wording, key or \"nothing easier\" line is unhelped (thrown under tests)", () => {
    const prev = { turn: 4, phase: "practice", ctx: { lang: "hinglish" }, lastMove: { kind: "explain", scriptBeat: beat("e1", B(5)) }, lastUi: { status: "your_turn" } };
    const input = { event: "turn", text: "pata nahi, aap batao", cls: { outcome: "no_evidence", flags: { dontKnow: true } } };
    assert.match(String(requestUnhelped(prev, input, { state: { lastMove: { kind: "worked_example", scriptBeat: beat("worked:problem", B(5)) } } })), /give_up answered with worked_example/);
    assert.equal(requestUnhelped(prev, input, { state: { lastMove: { kind: "reteach", help: { rung: "pointAlt", card: "wait" } } } }), null, "an unsaid wording");
    assert.equal(requestUnhelped(prev, input, { state: { lastMove: { kind: "practice", help: { rung: null, card: "goOn", joint: "helpSpent", then: "afterKeyGoOn" } } } }), null, "the nothing-easier line");
    assert.match(String(requestUnhelped(prev, input, { state: { lastMove: { kind: "practice", help: { rung: null, card: "goOn", joint: "afterKeyGoOn" } } } })), /give_up/, "the go-on line alone is no help");
    assert.equal(requestUnhelped(prev, { ...input, text: "haan", cls: { outcome: "no_evidence" } }, { state: { lastMove: { kind: "explain" } } }), null, "no request");
    void FALLBACK_JOINTS;
  });
});

describe("T6: an aside reply or a park never ends on a check-in", () => {
  test("asideCheckin reads every T6 aside row of director28", () => {
    const rows = [["stuck", "c5t01", 42], ["steering", "c5t01", 34], ["steering", "c5t01", 38], ["stuck", "c5t02", 42], ["stuck", "c6", 44],
      ["offtopic", "c6", 30], ["offtopic", "c6", 34], ["steering", "c6", 34], ["steering", "c6", 38]];
    for (const [p, t, i] of rows) assert.ok(flagged(p, t, "asideCheckin").has(i), `${p} ${t} row ${i}`);
  });
  test("asideCheckin reads 0 on her reply that goes on into the live part with its joint", () => {
    const r = { who: "teacher", text: "Achha, toh tumhe batting pasand hai. Ab apne sawaal par. Is patti mein kitne hisse hain?", seams: [{ right: "asideReply" }, { right: "card", joint: "afterAside", form: "Ab apne sawaal par." }] };
    assert.equal(D29_PREDICATES.asideCheckin({ rows: [r] }, r), null);
    const r2 = { ...r, text: "Achha, toh tumhe batting pasand hai. Yahan tak theek hai?", seams: [{ right: "asideReply" }, { right: "checkin" }] };
    assert.ok(D29_PREDICATES.asideCheckin({ rows: [r2] }, r2));
  });
  test("the turn's word limit does not count her reply and its joint (15 words at most): longTwoPart", async () => {
    const { PREDICATES } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    const reply = "Achha, toh tumhe batting sabse achha lagta hai. Aao, agla sawaal hum dono mil ke hal karenge.";
    const problem = Array.from({ length: 40 }, (_, k) => `w${k}`).join(" ") + ".";
    const step = Array.from({ length: 28 }, (_, k) => `s${k}`).join(" ") + "?";
    const text = `${reply} ${problem} ${step}`;
    const at = (x) => text.indexOf(x);
    const r = { who: "teacher", move: "worked_example", text, seams: [{ right: "aiReply" }, { right: "workedProblem", joint: "beforeWorked" }, { right: "point" }],
      pageParts: [{ part: "body", from: at("Aao"), beat: "worked:problem", lead: "beforeWorked" }, { part: "body", from: at("w0"), beat: "worked:problem" }, { part: "body", from: at("s0"), beat: "worked:step1" }] };
    assert.equal(PREDICATES.longTwoPart({ rows: [r] }, r), null, "85 words with a 17-word reply and joint: 70 counted");
  });
});

describe("T7: \"let me try\" at an asked step", () => {
  test("stepTryFirst reads every T7 row of director28 (c4 stuck 28; c6 offtopic 38; c5-t02 steady 32, offtopic 38)", () => {
    for (const [p, t, i] of [["stuck", "c4", 28], ["offtopic", "c6", 38], ["steady", "c5t02", 32], ["offtopic", "c5t02", 38]]) assert.ok(flagged(p, t, "stepTryFirst").has(i), `${p} ${t} row ${i}`);
  });
  test("a wrong answer to an asked step hears a stepMiss form first: the script's, else code's (three forms, four words or fewer, no answer named); a missing joint is a compile hole", async () => {
    const { helpJoint, helpJointHoles, FALLBACK_JOINTS: FJ } = await import("../server/director/help.js");
    assert.equal(FJ.stepMiss.length, 3);
    for (const f of FJ.stepMiss) for (const t of [f.hi, f.en]) { assert.ok(t.split(/\s+/).length <= 4, t); assert.ok(!/\d/.test(t), t); }
    const bare = { joints: {} };
    assert.equal(helpJoint(bare, "stepMiss").by, "code");
    assert.ok(helpJointHoles(bare).some((h) => h.joint === "stepMiss"));
    const own = { joints: { stepMiss: [{ hi: "Woh nahi.", en: "Not that." }] } };
    assert.deepEqual([helpJoint(own, "stepMiss").text, helpJoint(own, "stepMiss").by], ["Woh nahi.", "authored"]);
  });
});

import { pointCardCap, L2_CAP } from "../server/director/state.js";
describe("T1: a point and its card share a turn", () => {
  test("the 60-word cap on a point after a verdict goes: a point and its card share a turn to 75 (45 where the child's words are plain)", () => {
    assert.equal(pointCardCap({ ctx: {} }), L2_CAP);
    assert.equal(L2_CAP, 75);
    assert.equal(pointCardCap({ ctx: { plainWords: true } }), 45);
  });
  test("hookAlone reads the hook said alone on a check-in (row 2 in 14 of the 16 director28 lessons)", () => {
    for (const p of ["steady", "stuck", "offtopic", "steering"]) assert.ok(flagged(p, "c6", "hookAlone").has(2), `c6 ${p}`);
  });
  test("switchFirst reads the switch line said before a first telling (row 4)", () => {
    for (const [p, t] of [["stuck", "c6"], ["offtopic", "c6"], ["steering", "c6"], ["steady", "c6"], ["stuck", "c4"], ["steering", "c5t02"]]) assert.ok(flagged(p, t, "switchFirst").has(4), `${p} ${t}`);
  });
  test("pointNoFit counts a point that ends on its check-in because it and its card do not fit (pending until Learning 017; noFit on the row)", () => {
    const r = { who: "teacher", text: "Point. Yahan tak theek hai?", noFit: "point" };
    assert.ok(D29_PREDICATES.pointNoFit({ rows: [r] }, r));
    assert.equal(D29_PREDICATES.pointNoFit({ rows: [r] }, { ...r, noFit: undefined }), null);
  });
});

describe("T2: a remediation and its follow-up card: one turn at 60", () => {
  test("remCardLong reads the help-path rows of director28 (c6 steady 52, stuck 66, steering 8; c4 steering 12)", () => {
    for (const [p, t, i] of [["steady", "c6", 52], ["stuck", "c6", 66], ["steering", "c6", 8], ["steering", "c4", 12]]) assert.ok(flagged(p, t, "remCardLong").has(i), `${p} ${t} row ${i}`);
  });
  test("remCardLong reads 0 on a remediation and its card within 60, and on one over 60 said apart", () => {
    const r = (n, card) => ({ who: "teacher", text: Array.from({ length: n }, () => "w").join(" "), pageParts: [{ part: "simpler", beat: "rem:x", from: 0 }, ...(card ? [{ part: "card", beat: "then:x", from: 10 }] : [])] });
    assert.equal(D29_PREDICATES.remCardLong({ rows: [] }, r(58, true)), null);
    assert.ok(D29_PREDICATES.remCardLong({ rows: [] }, r(61, true)));
    assert.equal(D29_PREDICATES.remCardLong({ rows: [] }, r(61, false)), null);
  });
});

describe("T3: the verdict's turn runs into the worked example", () => {
  test("workedInvite reads the invitations of director28 (18 said) and the walk says none: joints.workedInvite is no hole", async () => {
    let n = 0;
    for (const p of ["steady", "stuck", "offtopic", "steering"]) for (const t of Object.keys(FILE)) n += flagged(p, t, "workedInvite").size;
    assert.equal(n, 18);
    const { helpJointHoles } = await import("../server/director/help.js");
    assert.ok(!helpJointHoles({ joints: {} }).some((h) => h.joint === "workedInvite"));
  });
  test("workedNoFit counts the verdict that ends on its check-in because the worked opening does not fit (pending until Learning 017)", async () => {
    const { PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(PENDING.has("workedNoFit") && PENDING.has("pointNoFit"));
    const r = { who: "teacher", text: "Haan, sahi hai. Yahan tak theek hai?", noFit: "worked" };
    assert.ok(D29_PREDICATES.workedNoFit({ rows: [r] }, r));
  });
});

describe("T8: the record says what was heard", () => {
  const reads = (name, rows) => { for (const [p, t, i] of rows) assert.ok(flagged(p, t, name).has(i), `${name}: ${p} ${t} row ${i}`); };
  test("reaskReturn: a re-ask after a hint or help, or asked for by the child, is no return (director28 rows)", () => {
    reads("reaskReturn", [["steady", "c5t02", 98], ["offtopic", "c5t02", 18], ["offtopic", "c5t02", 20], ["offtopic", "c5t02", 42], ["offtopic", "c5t02", 56],
      ["offtopic", "c4", 26], ["offtopic", "c4", 42], ["steering", "c4", 16], ["steering", "c4", 22], ["stuck", "c6", 8]]);
  });
  test("stepConfirm: a step's confirmation is not a point (c4 steady 46, steering 38; c5-t02 steady 74, 120)", () => {
    reads("stepConfirm", [["steady", "c4", 46], ["steady", "c5t02", 74], ["steady", "c5t02", 120]]);
  });
  test("openerSeam: row 4's empty opener seam (c5-t01 all four; c6 steady 4)", () => {
    reads("openerSeam", [["steady", "c5t01", 4], ["stuck", "c5t01", 4], ["offtopic", "c5t01", 4], ["steering", "c5t01", 4], ["steady", "c6", 4]]);
  });
  test("quickAddress: a quick question's row addressed as a check-in (c5-t01 steady 8, offtopic 32; c6 steady 8)", () => {
    reads("quickAddress", [["steady", "c5t01", 8], ["offtopic", "c5t01", 32], ["steady", "c6", 8]]);
  });
  test("whyShortFlag: c5-t01 steady 118 said the short reason with no flag", () => {
    reads("whyShortFlag", [["steady", "c5t01", 118]]);
  });
  test("pageParts: a bridge or a remediation that owns no board in the script lists none (the harness record; partOffBeat 0 on the dry matrix)", () => {
    const src = readFileSync(join(ROOT, "evals/hybrid-side-by-side.mjs"), "utf8");
    assert.match(src, /bridge: lmB\.bridgeBeat\?\.scriptBoard \? bOf\(lmB\.bridgeBeat\) : \[\]/);
    assert.match(src, /body: bOf\(lmB\.scriptBeat\),/);
  });
});

describe("Small: a second miss, five misses", () => {
  test("reaskTwice reads the question said word for word after a second miss in a row (c4 steady 86, offtopic 52; c5-t01 steering 54)", () => {
    for (const [p, t, i] of [["steady", "c4", 86], ["offtopic", "c4", 52], ["steering", "c5t01", 54]]) assert.ok(flagged(p, t, "reaskTwice").has(i), `${p} ${t} row ${i}`);
    // (the first miss's turn is not a second miss)
    assert.ok(!flagged("steady", "c4", "reaskTwice").has(84));
  });
  test("keyAfterFive reads the fifth wrong answer to one question met with a hint (c5-t02 offtopic 20; row 18 is the fourth)", () => {
    const f = flagged("offtopic", "c5t02", "keyAfterFive");
    assert.ok(f.has(20)); assert.ok(!f.has(18));
  });
  test("pickHelp: a hint on a card answered wrong five times is its key, whatever the ladder still has; four times, a rung", async () => {
    const { pickHelp, KEY_AFTER_MISSES } = await import("../server/director/help.js");
    const script = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${TOPIC.c5t02}.json`), "utf8"));
    const part = `${script.skills[0].skillId}:e1:card`;
    const four = pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES - 1 });
    assert.ok(four, "the card has a ladder");
    assert.equal(four.card, "keep"); assert.ok(four.rung);
    const five = pickHelp({ script, part, request: "hint", said: [], misses: KEY_AFTER_MISSES });
    assert.equal(five.card, "close"); assert.equal(five.rung, null); assert.ok(five.key?.text);
    assert.equal(KEY_AFTER_MISSES, 5);
  });
});
