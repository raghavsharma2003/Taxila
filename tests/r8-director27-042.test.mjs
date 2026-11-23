// dc-r8-director27, Brain 042 (docs/patches/to-brain/042-child-does-something.md): where she asked "samajh aaya?", the child now does
// something. (1) The predicates written for it read non-zero on the director27 rows the work order lists (fd-predicate-must-fail-on-judges-rows;
// a row number is its 0-based index in `director`), and the ones with no director27 row read non-zero on a row built to break them. (2) The
// walk, on today's scripts, with the card's own reader (classifyFast against the active item, as the dry harness reads) and no model:
// a quick question where a card waits, read against its own key, answered with the short yes or its `say` and then the card, and no card
// evidence; a worked example in segments that end on a question, an asked step answered with `right` or told. (3) E2's length guard, E4's
// check-in forms.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { initLessonState, step, evidenceFrom } from "../server/director/state.js";
import { setScriptForTest, scriptFor } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { verdictFor } from "../server/director/say.js";
import { lengthGuard, beatAsk, FRAMES } from "../server/brain/say.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX } from "./fixtures/kit.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director27");
const FILE = { c4: "c4-ch05-t01", "c5-t01": "c5-ch02-t01", "c5-t02": "c5-ch02-t02", c6: "c6-ch06-t01" };
const lessons = new Map();
const lessonOf = (topic, child) => {
  const k = `${topic}|${child}`;
  if (!lessons.has(k)) {
    const j = JSON.parse(readFileSync(join(DIR, `${child}-${FILE[topic]}.json`), "utf8"));
    // (read against today's script: the run's own copy predates Learning 016, and the device these predicates hold is the script's — a point
    // with a quick question, a worked example that asks a step; the rows are the turns where today's script has one)
    // (d29 final: the scripts as director28 ran them — Learning 017 deleted the quick questions these predicates read)
    const script = PRE017(j.topicId);
    lessons.set(k, { rows: j.director, flags: lessonFlags({ rows: j.director, script }) });
  }
  return lessons.get(k);
};
const CHECKIN_END = /(?:Yahan tak (?:theek|saaf) hai|Ab tak samajh aaya|Yeh hissa saaf hua|Yeh kadam (?:saaf hai|samajh aaya))\?$/i;
/** Every named row is read by the predicate — the row itself, or (a judge who named the card said after it) the last teacher turn before it
 *  that ended on a check-in, since the card said before it. */
function readsOn(pred, rows) {
  assert.ok(PREDICATES[pred], `${pred} exists`);
  assert.ok(!PENDING.has(pred), `${pred} is gated`);
  const missed = rows.filter(([topic, child, row]) => {
    const L = lessonOf(topic, child);
    const at = L.flags.filter((f) => f.predicate === pred).map((f) => f.row);
    if (at.includes(row)) return false;
    // (the card's row: a flag on a check-in turn since the card before it — help said between them moves nothing on)
    if (!L.rows[row]?.card) return true;
    const prevCard = L.rows.slice(0, row).map((r, i) => [r, i]).reverse().find(([r]) => r.who === "teacher" && r.card)?.[1] ?? -1;
    return !at.some((x) => x > prevCard && x < row && CHECKIN_END.test(String(L.rows[x].text ?? "").trim()));
  });
  assert.deepEqual(missed.map((x) => x.join(" ")), [], `${pred} reads 0 on rows it is written for`);
}

describe("Brain 042: the predicates read director27's rows", () => {
  test("quickBeforeCard: a check-in where the same beat's card waits", () => {
    readsOn("quickBeforeCard", [["c4", "steady", 72], ["c4", "steady", 78], ["c5-t01", "steady", 62], ["c5-t01", "steady", 84], ["c5-t01", "steady", 96], ["c5-t01", "steady", 100],
      ["c5-t02", "steady", 6], ["c5-t02", "steady", 42], ["c5-t02", "steady", 52], ["c5-t02", "steady", 58], ["c5-t02", "steady", 72], ["c5-t02", "steady", 96],
      ["c6", "steady", 6], ["c6", "steady", 12], ["c6", "steady", 42], ["c6", "steady", 52], ["c6", "steady", 74], ["c6", "steady", 78]]);
  });
  test("workedCheckin: a worked example's turn ending on a check-in with no told step's simpler", () => {
    readsOn("workedCheckin", [["c6", "steady", 16], ["c6", "steady", 60], ["c6", "steady", 82], ["c5-t01", "steady", 16], ["c5-t01", "steering", 40], ["c5-t02", "steady", 16],
      ["c5-t02", "steady", 62], ["c5-t02", "steering", 38], ["c4", "steady", 46], ["c4", "stuck", 66], ["c4", "steering", 50]]);
  });
  test("pictureCaption (E3): a picture after a key in code's words", () => {
    readsOn("pictureCaption", [["c5-t01", "steering", 14], ["c6", "steering", 14], ["c5-t02", "steady", 18]]);
  });
  test("quickGraded and quickGiveaway read the rows built to break them", () => {
    // (d29 final: a beat with a quick question — the c6 pilot as director28 ran it; Learning 017 deleted them)
    const script = PRE017("c6-maths-ch06-t01");
    const e2 = script.skills[0].explain[1];
    const S = script.skills[0].skillId;
    const ask = { who: "teacher", text: `Point. ${e2.quick.prompt.hi}`, pageParts: [{ part: "body", from: 0, beat: "e2" }, { part: "quick", from: 7, beat: "e2" }] };
    const card = e2.ask.prompt.hi;
    const flagsOf = (child, read, intent, t) => lessonFlags({ rows: [ask, { who: "child", text: child, read, intent }, t], script }).filter((f) => ["quickGraded", "quickGiveaway"].includes(f.predicate)).map((f) => f.predicate);
    // (a miss answered with a verdict naming it and a hint, no say)
    assert.deepEqual(flagsOf("3", "incorrect", "miss", { who: "teacher", text: `3 sahi nahi hai. ${card}`, pageParts: [{ part: "close", from: 0, beat: "e2" }, { part: "card", from: 15, beat: "e2" }] }), ["quickGraded"]);
    // (a right answer with something other than the short yes)
    const say = e2.quick.say.hi;
    assert.deepEqual(flagsOf(e2.quick.key, "correct", "right", { who: "teacher", text: `${say} ${card}`, cell: { part: `${S}:e2:quick` }, pageParts: [{ part: "quickReply", from: 0, beat: "e2" }, { part: "card", from: say.length + 1, beat: "e2" }] }), ["quickGraded"]);
    // (as built: the authored say, then the card — and the short yes on a right answer)
    assert.deepEqual(flagsOf("3", "incorrect", "miss", { who: "teacher", text: `${say} ${card}`, cell: { part: `${S}:e2:quick` }, pageParts: [{ part: "quickReply", from: 0, beat: "e2" }, { part: "card", from: say.length + 1, beat: "e2" }] }), []);
    const yes = `${FRAMES.right.hinglish[1]}.`;
    assert.deepEqual(flagsOf(e2.quick.key, "correct", "right", { who: "teacher", text: `${yes} ${card}`, cell: { part: `${S}:e2:quick` }, pageParts: [{ part: "quickReply", from: 0, beat: "e2" }, { part: "card", from: yes.length + 1, beat: "e2" }] }), []);
    // (a say that gives the card's key)
    const bad = `Hexagon ka parimap ${e2.ask.key} hai.`;
    assert.deepEqual(flagsOf("3", "incorrect", "miss", { who: "teacher", text: `${bad} ${card}`, cell: { part: `${S}:e2:quick` }, pageParts: [{ part: "quickReply", from: 0, beat: "e2" }, { part: "card", from: bad.length + 1, beat: "e2" }] }).sort(), ["quickGiveaway", "quickGraded"]);
  });
});

// ───────────── the walk ─────────────
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_SPLIT", "TAXILA_R7_SPLIT_CLOSE", "TAXILA_L2", "TAXILA_VPC_SPLIT"];
const KEEP = {};
/** A lesson walked with the card's own reader: each line is classified against the item on the table, as the dry harness reads it. */
/** d29 final: Learning 017 deleted every explain beat's quick question (a point and its card share a turn) and reshaped the worked examples;
 *  the devices these walks test stay in code for a beat that keeps them (017 B.2), so they walk the four pilots as director28 ran them. */
const PRE017 = (T) => JSON.parse(readFileSync(new URL(`./fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director28/scripts/${T}.json`, import.meta.url), "utf8"));
function walk(T) {
  { const sc = PRE017(T); delete sc.recordedRun; setScriptForTest(T, sc); }
  const K = kitFromFile(getTopic(T));
  let r = step(initLessonState({ topicId: T, kit: K, ctx: { ...CTX, classLevel: Number(/^c(\d)/.exec(T)[1]), lang: "hinglish", interests: ["cricket"] }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
  const say = (text) => {
    const s0 = { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] };
    const item = s0.activeItemId ? findItem(s0, K, s0.activeItemId) : null;
    const target = targetFor(s0, K, item);
    const c = classifyFast({ target, childText: text, lang: "hinglish", typed: true }).result ?? { outcome: "no_evidence", confidence: 1, flags: {} };
    r = step(s0, { event: "turn", kit: K, cls: c, text, now: (s0.turn + 1) * 20_000 });
    return { r, c, item, target, before: s0 };
  };
  /** The key of what is on the table now: the live card, the quick question, the asked step. */
  const key = () => { const it = r.state.activeItemId ? findItem(r.state, K, r.state.activeItemId) : null; return it ? String(it.answer) : "haan"; };
  return { K, say, key, get r() { return r; } };
}

describe("Brain 042: the walk", () => {
  // (re-pinned to to-brain 049 B6: a right verdict, its reason, a point and its card over 65 words now split at the point, so the walk
  // reaches the point's quick question — Brain 042 Q1, the shape these tests pin — only with that split off)
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } process.env.TAXILA_VPC_SPLIT = "off"; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  test("Q1: a point whose card waits ends on its quick question, over the point's board; read by the card's reader; no verdict, no card evidence", () => {
    const W = walk("c6-maths-ch06-t01");
    let quick = null;
    for (let n = 0; n < 12 && !quick; n++) { W.say(W.key()); if (W.r.state.lastMove?.quick) quick = W.r.state.lastMove; }
    assert.ok(quick, "a turn ending on a quick question");
    assert.equal(quick.splitTeach, true, "the card waits");
    assert.equal(W.r.ui?.ask, undefined, "no card is posed with it");
    const sk = scriptFor(W.K).script.skills.find((k) => k.skillId === quick.quick.skillId);
    const beat = sk.explain.find((b) => b.id === quick.quick.beatId);
    assert.equal(quick.quick.prompt, beat.quick.prompt.hi);
    assert.equal(quick.scriptBeat.beatId, beat.id, "said over the point's own beat (its board)");
    assert.equal(W.r.state.activeItemId, `quick:${sk.skillId}:${beat.id}`, "the child's next line is read against the quick question's key");
    // (a right answer: read by the card's reader, no verdict, no learner evidence; the short yes and the card)
    const { c, item, target } = W.say(beat.quick.key);
    assert.equal(c.outcome, "correct");
    assert.ok(item.quick, "the item read is the quick question");
    assert.equal(verdictFor(c, target), "ungraded", "no verdict");
    const s1 = { ...W.r.state, activeItemId: item.id, quickItem: item };
    assert.deepEqual(evidenceFrom(s1, c, W.K), [], "no card evidence on the learner model");
    const m = W.r.state.lastMove;
    assert.equal(m.quickReply?.right, true);
    assert.equal(W.r.ui?.ask?.itemId, `script:${sk.skillId}:ask:${beat.id}`, "then the card");
    assert.equal(m.cell?.part, `${sk.skillId}:${beat.id}:quick`, "the record: the child answered the quick question");
    assert.ok((W.r.state.beatEvidence ?? []).some((e) => e.kind === "quick" && e.beatId === beat.id && e.right), "its own kind of evidence, on the beat");
  });

  test("Q1: anything else — a wrong answer or a give-up — gets the quick question's say, then the card; no hint, no second try", () => {
    const W = walk("c6-maths-ch06-t01");
    for (let n = 0; n < 12 && !W.r.state.lastMove?.quick; n++) W.say(W.key());
    const q = W.r.state.lastMove.quick;
    W.say("pata nahi");
    const m = W.r.state.lastMove;
    const beat = scriptFor(W.K).script.skills.find((k) => k.skillId === q.skillId).explain.find((b) => b.id === q.beatId);
    assert.deepEqual(m.quickReply, { skillId: q.skillId, beatId: q.beatId, right: false, say: beat.quick.say.hi });
    assert.ok(!m.help && !m.simpler, "no help on it");
    assert.equal(W.r.ui?.ask?.itemId, `script:${q.skillId}:ask:${q.beatId}`, "the card");
  });

  test("Q2: a worked example ends each segment on a question — the problem with its told step and the asked step; ask.right, then on", () => {
    const W = walk("c6-maths-ch06-t01");
    let seg = null;
    for (let n = 0; n < 30 && !seg; n++) { W.say(W.key()); const m = W.r.state.lastMove; if (m?.stepAsk) seg = m; else if (W.r.state.splitHold?.move?.stepAsk) { W.say("haan"); if (W.r.state.lastMove?.stepAsk) seg = W.r.state.lastMove; } }
    assert.ok(seg, "a segment ending on an asked step");
    const we = scriptFor(W.K).script.skills.find((k) => k.skillId === seg.skillId).workedExample;
    const a = we.steps[seg.stepAsk.step].ask;
    assert.equal(seg.stepAsk.prompt, a.prompt.hi);
    assert.equal(seg.problemLines, 1, "the problem is said with it, never alone");
    assert.equal(seg.rendered.length, 1 + seg.stepAsk.step, "the told steps before the asked one, with the problem");
    assert.ok(!seg.splitTeach, "the segment is not split from its question");
    W.say(a.key);
    const m = W.r.state.lastMove;
    assert.equal(m.stepReply?.right, true);
    assert.equal(m.rendered?.[0], a.right.hi, "ask.right first");
    assert.ok(W.r.ui?.ask?.itemId?.endsWith(":ask:worked") || m.stepAsk, "then the next question: the child's own step, or the next asked step");
  });

  // (dc-r8-director29 Brain 045 P3 changes the first request: a give-up at an asked step gets the step's simpler, then the step's question again;
  // the step is told at the second request, as before, and then the walk goes on — director29 c6 stuck 20, offtopic 16, steering 28)
  test("Q2: an asked step not answered right is told as today, then on (Brain 045 P3: at the second request; the first gets its simpler)", () => {
    const W = walk("c6-maths-ch06-t01");
    for (let n = 0; n < 30 && !W.r.state.lastMove?.stepAsk; n++) { W.say(W.key()); if (W.r.state.splitHold?.move?.stepAsk) W.say("haan"); }
    const sa = W.r.state.lastMove.stepAsk;
    assert.ok(sa);
    W.say("pata nahi");
    const m1 = W.r.state.lastMove;
    assert.ok(!m1.stepReply?.told, "the first request: the step is not told");
    assert.ok(m1.stepAsk, "the step's question again, the step still asked");
    assert.equal(m1.stepAsk.step, sa.step, "the same step");
    assert.equal(m1.help?.rung, "simpler", "the step's simpler wording first");
    assert.ok(m1.simpler, "said");
    W.say("pata nahi");
    const m = W.r.state.lastMove;
    assert.equal(m.stepReply?.right, false);
    assert.equal(m.stepReply?.told, true);
    assert.match(String(m.rendered?.[0]), /kyunki/, "the step told: its do, result and why");
    assert.ok(!m.help, "no hint ladder on an asked step");
  });
});

describe("Brain 042: E2 and E4", () => {
  test("E2: the length guard on a scripted turn drops only her sentences — never the hook or the point (director27 c5-t02 offtopic 2 to 4)", () => {
    const sc = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts/c5-maths-ch02-t02.json"), "utf8"));
    const hook = sc.skills[0].hook.interestSlots[0].use.hi, point = sc.skills[0].explain[0].point.hi;
    const turn = `Achha, chalo shuru karte hain. ${hook} ${point} Ab tak samajh aaya?`;
    const out = lengthGuard(turn, { authored: [hook, point], max: 40 });
    assert.ok(out.includes(point), "the first point is said");
    assert.ok(out.includes(hook), "the hook is said");
    assert.ok(!out.includes("Achha, chalo shuru karte hain."), "her own sentence goes first");
    assert.equal(lengthGuard(`${hook} ${point}`, { authored: [hook, point], max: 10 }), `${hook} ${point}`.replace(/\s+/g, " ").trim(), "authored parts alone are never cut, whatever the cap");
  });
  test("E4: a check-in form whose word the script teaches as a term is not said (c5-t02 teaches hissa)", () => {
    const K = kitFromFile(getTopic("c5-maths-ch02-t02"));
    assert.ok(!beatAsk(K).hinglish.includes("Yeh hissa saaf hua?"));
    assert.ok(beatAsk(K).hinglish.length >= 2);
    assert.ok(beatAsk(kitFromFile(getTopic("c6-maths-ch06-t01"))).hinglish.includes("Ab tak samajh aaya?"), "aaya is no term's word in c6 (aayat is another)");
  });
});
