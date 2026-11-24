// to-brain 052, the engine builder's parts (docs/patches/to-brain/052-d34-merged-tree-one-count-ladder-after-own-reason.md): each rule pinned
// on the walk's pieces, with script copies under tests/fixtures/scripts-052e/ (taken from data/lesson-scripts/ on 2026-11-24).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const fixture = (t) => JSON.parse(readFileSync(join(ROOT, "tests/fixtures/scripts-052e", `${t}.json`), "utf8"));

describe("A1: the ladder after the card's own reason", () => {
  const named = { outcome: "misconception", misconceptionId: "c5-maths-ch02-t03-m-one-part-only", wrongListed: true };
  const other = { outcome: "incorrect", misconceptionId: null, wrongListed: false };
  const part = "c5-maths-ch02-t03-s2:check:c3";
  // (dry steady c5-ch02-t03 row 50: c1's own hint, written like c3's, was said before c3 was asked)
  const c1Hint = "Nahi, 1 theek nahi. Pehle dekho ki 1/3 ka neeche wala number kis number se guna hokar 12 banta hai. Phir upar wale number ko bhi usi se guna karo.";
  test("the named wrong answer first: the own reason; the next miss: the card's simpler; the miss after: the key", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = fixture("c5-maths-ch02-t03");
    let said = addSaid([], c1Hint, 50);
    const d1 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.equal(d1.rung?.field, "whyAltHelp", "the own reason first");
    said = addSaid(said, d1.rung.text, 56);
    const d2 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.equal(d2.rung?.field, "simpler", "the card's simpler — another card's hint written the same way is not it");
    said = addSaid(said, d2.rung.text, 58);
    const d3 = pickHelp({ script, part, request: "hint", said, last: other });
    assert.ok(d3.key && d3.card === "close", "then the key");
  });
  test("a miss that is not the named answer first: the simpler; then the named answer: the own reason; then the key", async () => {
    const { pickHelp, addSaid } = await import("../server/director/help.js");
    const script = fixture("c5-maths-ch02-t03");
    const d1 = pickHelp({ script, part, request: "hint", said: [], last: other });
    assert.equal(d1.rung?.field, "simpler");
    let said = addSaid([], d1.rung.text, 1);
    const d2 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.equal(d2.rung?.field, "whyAltHelp");
    said = addSaid(said, d2.rung.text, 3);
    const d3 = pickHelp({ script, part, request: "hint", said, last: named });
    assert.ok(d3.key, "the key");
  });
  test("a request after the named answer keeps 049 B3's order: the simpler first", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const d = pickHelp({ script: fixture("c5-maths-ch02-t03"), part, request: "clarify", said: [], last: named });
    assert.equal(d.rung?.field, "simpler");
  });
});

describe("A2: a told step's result board is drawn when its line is said", () => {
  test("heldOf: a told step's line that carries its resultBoard pages there from its first word; the card is on its own board", async () => {
    const { heldOf } = await import("../server/brain/propose.js");
    const posing = { template: "angle@1", params: { angles: [{ deg: 60, name: "P" }, { deg: 90, name: "Q", len: "short" }, { deg: 130, name: "R", len: "short" }] } };
    const result = { template: "angle@1", params: { angles: [{ deg: 60, name: "P" }, { deg: 90, name: "Q", len: "short" }], tester: true } };
    const sb = { scriptId: "c4-maths-ch01-t02", skillId: "c4-maths-ch01-t02-s2", beatId: "worked", kind: "worked", board: posing };
    // (dry steady c4-ch01-t02 row 66: step 1's verdict, step 2's told line, the child's own step)
    const list = [{ part: "body", kind: "stepConfirm", text: "Haan, kam: P ki bhujayein lambi hain, par uska khulna right angle se kam hai." },
      { part: "body", kind: "workedStep", text: "Q par tester rakho: tester bilkul fit hota hai, toh Q right angle ke barabar hai.", board: result },
      { part: "card", text: "Tumhari baari: teesre kone ko bhi tester se milao. Teeno mein sabse bada angle kaunsa hai?" }];
    const line = list.map((p) => p.text).join(" ");
    const h = heldOf({ move: { kind: "worked_example", scriptBeat: sb, cardBeat: sb }, list, line, kit: null, up: { board: posing, unit: "c4-maths-ch01-t02-s2:worked" } });
    assert.deepEqual(h.board, posing, "the page before it is whatever was up");
    assert.equal(h.switches?.length, 2);
    assert.deepEqual(h.switches[0].board, result);
    assert.equal(h.switches[0].atChar, line.indexOf("Q par tester"));
    assert.deepEqual(h.switches[1].board, posing, "the card on its own board");
    const plain = heldOf({ move: { kind: "worked_example", scriptBeat: sb, cardBeat: sb }, list: list.map(({ board: _b, ...p }) => p), line, kit: null, up: { board: posing, unit: "c4-maths-ch01-t02-s2:worked" } });
    assert.ok(!plain.switches && !plain.switchTo, "without the mark: one page, as before");
  });
});

describe("A3: the boards asked of Studio start at the close's own board", () => {
  // (staged c6-ch07-t03 s2: e2's answer board, then e3's point and card — two 12-part pairs of bars)
  const answer = { template: "fraction-bars@1", params: { bars: [{ parts: 5, shade: 2, label: "2/5" }] } };
  const e2card = { template: "fraction-bars@1", params: { bars: [{ parts: 5, shade: 0, label: "" }] } };
  const point = { template: "fraction-bars@1", params: { bars: [{ parts: 12, shade: 4, label: "1/3" }, { parts: 12, shade: 6, label: "2/4" }] } };
  const card = { template: "fraction-bars@1", params: { bars: [{ parts: 12, shade: 8, label: "2/3" }, { parts: 12, shade: 0, label: "" }] } };
  test("switchesFit: the close's board drawn fresh, the point's and the card's do not fit one turn; the point's and the card's alone do", async () => {
    const { switchesFit } = await import("../server/director/state.js");
    assert.equal(switchesFit([answer, point, card], { freshFirst: true }), false);
    assert.equal(switchesFit([null, point, card]), true);
    // (what the walk asked before: the board up — e2's card, held still — then the point's and the card's; it fits, so the turn was not split,
    // and Studio, drawing the answer board fresh first, drew one page)
    assert.equal(switchesFit([e2card, point, card]), true);
  });
});

describe("B1: a remediation listed whole is said in one turn with its card", () => {
  test("remWholeListed reads the checker's REM_WHOLE (not a copy)", async () => {
    const { remWholeListed } = await import("../server/director/state.js");
    const { REM_WHOLE } = await import("../scripts/lesson-scripts/check.mjs");
    assert.ok(REM_WHOLE.length > 0);
    for (const w of REM_WHOLE) assert.ok(remWholeListed(w.topicId, w.skillId, w.targets), w.targets);
    assert.equal(remWholeListed("c5-maths-ch02-t02", "c5-maths-ch02-t02-s1", "c5-maths-ch02-t02-m-bigger-denominator"), false);
  });
  test("unitTurn: a listed remediation and its card share the turn up to 65 words of the two; an unlisted one keeps 60 with its margin", async () => {
    const { unitTurn, REM_WHOLE_CAP, REM_CARD_CAP } = await import("../server/director/state.js");
    assert.equal(REM_WHOLE_CAP, 65);
    const out = (targets, skillId) => ({ state: { ctx: {} }, ui: { ask: { itemId: `script:${skillId}:then:${targets}` } },
      move: { kind: "reteach", skillId, scriptBeat: { kind: "remediation", skillId, beatId: `rem:${targets}` }, rendered: ["Ek badi chocolate aur do chhoti toffee socho."] } });
    const input = { kit: { topicId: "c5-maths-ch02-t02" }, text: "3/10" };
    assert.deepEqual(unitTurn(out("c5-maths-ch02-t02-m-tops-only", "c5-maths-ch02-t02-s2"), input), { margin: 0, cap: REM_WHOLE_CAP });
    const u = unitTurn(out("c5-maths-ch02-t02-m-bigger-denominator", "c5-maths-ch02-t02-s1"), input);
    assert.equal(u.cap, REM_CARD_CAP); assert.ok(u.margin > 0);
  });
});

describe("B2: the closing question is graded like a card", () => {
  const gradeOf = (t) => { const tb = fixture(t).teachback; return { key: String(tb.key), accept: tb.accept ?? [], wrongIfMis: tb.wrongIfMis ?? null, targets: tb.targets ?? null, prompt_hi: tb.prompt.hi, prompt_en: tb.prompt.en }; };
  const read = async (t, text) => {
    const { targetFor, classifyFast } = await import("../server/director/classify.js");
    const s = { phase: "teachback", teachbackAsked: true, teachbackScript: true, teachbackGrade: gradeOf(t) };
    const target = targetFor(s, { items: [], expectations: [], misconceptions: [] }, null);
    assert.equal(target.mode, "item", "the cards' grader, not the teach-back's own reader");
    return classifyFast({ target, childText: text, typed: true, lang: "hinglish" });
  };
  test("its key and its spoken fraction forms are right; another fraction is wrong", async () => {
    assert.equal((await read("c5-maths-ch02-t03", "8/12")).result?.outcome, "correct");
    assert.equal((await read("c5-maths-ch02-t03", "8 bata 12")).result?.outcome, "correct");
    assert.equal((await read("c5-maths-ch02-t03", "6/12")).result?.outcome, "incorrect");
  });
  test("a denial or pata nahi is never correct", async () => {
    for (const t of ["nahi, 8/12 nahi", "pata nahi"]) assert.notEqual((await read("c5-maths-ch02-t03", t)).result?.outcome ?? null, "correct", t);
  });
  test("its named wrong answer is read as the mix-up, listed", async () => {
    const r = (await read("c5-maths-ch02-t02", "7/10")).result;
    assert.equal(r?.outcome, "misconception");
    assert.equal(r?.wrongListed, true);
  });
});
describe("B2: after the closing question's named wrong answer, its own reason", () => {
  test("pickHelp at the teach-back: the own reason first after the named answer; never before it", async () => {
    const { pickHelp, TEACHBACK_PART } = await import("../server/director/help.js");
    const script = fixture("c4-maths-ch05-t01");
    assert.equal(script.teachback.whyAltAsHelp, true);
    const d = pickHelp({ script, part: TEACHBACK_PART, request: "hint", said: [], last: { outcome: "misconception", misconceptionId: script.teachback.targets ?? null, wrongListed: true } });
    assert.equal(d.rung?.field, "whyAltHelp");
    const d0 = pickHelp({ script, part: TEACHBACK_PART, request: "hint", said: [], last: { outcome: "incorrect", wrongListed: false } });
    assert.notEqual(d0.rung?.field, "whyAltHelp");
  });
});
describe("B2: the wrap's closing question is not graded", () => {
  test("targetFor: after a right answer or with the wrap's second turn due, the closing question's grader is off", async () => {
    const { targetFor } = await import("../server/director/classify.js");
    const kit = { items: [], expectations: [], misconceptions: [] };
    const g = { key: "8/12", accept: [] };
    for (const extra of [{ teachbackPassed: true }, { wrapTwo: { ack: null } }, { teachbackKeyed: true }])
      assert.notEqual(targetFor({ phase: "teachback", teachbackAsked: true, teachbackGrade: g, ...extra }, kit, null).mode, "item", JSON.stringify(extra));
  });
});
describe("B5: the goodbye reply reads what the child said", () => {
  test("ackFits: a liking is not met with a form that only notes it; 'mushkil tha' is not thanked", async () => {
    const { ackFits } = await import("../server/director/state.js");
    assert.equal(ackFits("Hmm, theek hai, samajh gayi.", "maza aaya"), false);
    assert.equal(ackFits("Achha, theek hai, maine sun liya.", "sawaal achhe the"), false);
    assert.equal(ackFits("Achha, batane ke liye shukriya.", "maza aaya"), true);
    assert.equal(ackFits("Achha, batane ke liye shukriya.", "thoda mushkil tha"), false);
    assert.equal(ackFits("Hmm, theek hai, samajh gayi.", "thoda mushkil tha"), true);
    assert.equal(ackFits("Hmm, theek hai, samajh gayi.", "pata nahi"), true);
  });
});
describe("B5: aside replies of one frame are rotated", () => {
  test("asideReplyLine: the frame her last aside reply was said in is not said next; another form of that shape is", async () => {
    const { asideReplyLine, replyFrameOf } = await import("../server/brain/asideReplies.js");
    const a = { said: "chauka", topic: "cricket", n: 3, words: ["chauka"], asked: "Usmein sabse mazedaar kya hai?", avoid: [{ k: "x" }] };
    const prev = "Wah, batting! Toh yeh tumhe achhi lagti hai. Toh ab wahin se shuru karte hain.";
    const f0 = replyFrameOf(prev);
    assert.ok(f0);
    const r = asideReplyLine({ ...a, recent: [prev] });
    assert.ok(r.line && replyFrameOf(r.line) !== f0, r.line);
    assert.ok(!/unke/.test(r.line), "never a people form about a game");
    assert.equal(replyFrameOf(asideReplyLine(a).line), f0, "with no reply before it, as before");
  });
  test("againInHerWords: an again form of any wording is said only of what the child told before (toldOk by form type)", async () => {
    const { againInHerWords } = await import("../server/brain/say.js");
    const state = { recent: [{ who: "child", text: "kal maine football khela" }, { who: "teacher", text: "Achha." }, { who: "child", text: "mujhe cricket pasand hai" }], said: [] };
    const line = againInHerWords("mujhe cricket pasand hai", "cricket", "hinglish", state);
    assert.ok(!line || !/(?:do baar aa gayi|pehle bhi suna|yeh tumne bataya tha)/.test(line), String(line));
  });
});
describe("B4: the third turn running at one question ends on a pointed invitation (ruling)", () => {
  test("yourTurnPass: an aside turn after two at the asked step's question is marked answerFirst, code's forms rotated; the second is not", async () => {
    const { yourTurnPass, ANSWER_FIRST_FORMS } = await import("../server/director/question-run.js");
    const script = fixture("c4-maths-ch01-t02");
    assert.ok(!script.joints?.answerFirst, "this script has no joints.answerFirst: code's forms");
    const q = script.skills[0].workedExample.steps[0].ask.prompt.hi;
    const turn = (recent, n = 0) => { const lm = { kind: "worked_example", cell: { column: "aside" }, stepAsk: { skillId: script.skills[0].skillId, step: 0, prompt: q } };
      const out = { state: { lastMove: lm, ctx: {}, answerFirstN: n }, move: { ...lm }, ui: {} };
      return yourTurnPass({ recent, lastMove: {} }, out, script, "kal maine cricket khela").state; };
    const s3 = turn([{ who: "teacher", text: `Sahi jawab. ${q}` }, { who: "child", text: "pata nahi" }, { who: "teacher", text: `Tile tirchi lagi hai. ${q}` }]);
    assert.equal(s3.lastMove.answerFirst, ANSWER_FIRST_FORMS[0].hi);
    const s4 = turn([{ who: "teacher", text: q }, { who: "teacher", text: `Cricket ki baat bhi hogi. ${ANSWER_FIRST_FORMS[0].hi}` }], 1);
    assert.equal(s4.lastMove.answerFirst, ANSWER_FIRST_FORMS[1].hi, "the fourth too, the next form");
    const s2 = turn([{ who: "teacher", text: "Board par dekho." }, { who: "teacher", text: `Sahi jawab. ${q}` }]);
    assert.ok(!s2.lastMove.answerFirst, "the second turn at it ends on the question");
  });
  test("answerFirstThird is gated and reads the pre-merge staged offtopic c4-ch01-t02 rows", async () => {
    const { PREDICATES, PENDING } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    assert.ok(PREDICATES.answerFirstThird); assert.ok(!PENDING.has("answerFirstThird"));
    assert.ok(PREDICATES.asideFrameTwice); assert.ok(!PENDING.has("asideFrameTwice"));
  });
});
describe("A1 follow-up: code's lead-in opener leaves room for an authored one ahead", () => {
  test("openerAhead: the card posed now or the next of its skill holds an authored opener in its help (dry steady c5-ch02-t02 44, 52)", async () => {
    const { openerAhead } = await import("../server/brain/say.js");
    const script = fixture("c5-maths-ch02-t02");
    assert.equal(openerAhead({ activeItemId: "script:c5-maths-ch02-t02-s2:ask:e2" }, null, script), true, "e3's own reason says \"Dekho,\"");
    assert.equal(openerAhead({ activeItemId: "script:c5-maths-ch02-t02-s2:ask:e1" }, null, script), false);
    assert.equal(openerAhead({ activeItemId: null }, null, script), false);
  });
});
