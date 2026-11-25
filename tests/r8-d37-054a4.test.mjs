// to-brain 054 A, main's fifth ruling on cause A (round d37, after the paid pair run: A(i) is design D2): the predicates it names, each on
// made rows — one that trips it and one that does not. replyCheckin and asideCheckin relaxed (item 3), replyIntoPoint strict and
// endsOnQuestion without noFit "aside" (item 2), goOnNoTeach widened (item 2), replyPointCardNext new and gated (item 4).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const seams = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
const T = (o) => ({ who: "teacher", text: "Ek do teen.", ...o });
const C = (text = "haan") => ({ who: "child", text });
const POINT = "Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, aur hum 2/3 par aa gaye.";
/** Her reply's turn: a reply line (seam `kind`), then — when `point` — a point (a body page part) and her check-in. */
function replyTurn(kind, point = POINT, extra = {}) {
  const reply = "Oho, batting! Isi mein tumhe maza aata hai.";
  const text = point ? `${reply} ${point} Yahan tak theek hai?` : `${reply} Yahan tak theek hai?`;
  return T({ text, beat: "s2:explain:e1", seams: point ? seams(kind, "point", "checkin") : seams(kind, "checkin"),
    pageParts: point ? [{ part: "body", from: reply.length + 1, beat: "e1" }] : [], ...extra });
}

describe("item 3: replyCheckin and asideCheckin allow a check-in after a reply only when a new point stands between", () => {
  test("replyCheckin: a reply and its check-in, or a reply and a point said before, trips it; a reply, a new point and its check-in does not", () => {
    const rp = replyTurn("asideReply");
    assert.equal(PREDICATES.replyCheckin({ rows: [rp] }, rp, 0, {}), null);
    const ai = replyTurn("aiReply");
    assert.equal(PREDICATES.replyCheckin({ rows: [ai] }, ai, 0, {}), null);
    const bare = replyTurn("asideReply", null);
    assert.ok(PREDICATES.replyCheckin({ rows: [bare] }, bare, 0, {}));
    // (the same point told before: not new — a check-in after it checks what was already checked)
    const before = T({ text: `${POINT} Yahan tak theek hai?`, seams: seams("point", "checkin") });
    assert.ok(PREDICATES.replyCheckin({ rows: [before, C(), rp] }, rp, 2, {}));
    // (a reply and a help line, then a check-in: no new point, still flagged)
    const help = T({ text: "Oho! Socho phir se. Yahan tak theek hai?", seams: seams("asideReply", "help", "checkin") });
    assert.ok(PREDICATES.replyCheckin({ rows: [help] }, help, 0, {}));
  });
  test("asideCheckin: a park, a return or a reply straight into a check-in trips it; a park, a new point and its check-in does not", () => {
    for (const k of ["park", "return", "asideReply", "aiReply"]) {
      const bare = replyTurn(k, null);
      assert.ok(PREDICATES.asideCheckin({ rows: [bare] }, bare, 0, {}), k);
      const rp = replyTurn(k);
      assert.equal(PREDICATES.asideCheckin({ rows: [rp] }, rp, 0, {}), null, k);
    }
  });
});

describe("item 2: what goes with the go-on turn", () => {
  const goOn = T({ noFit: "aside", noFitGoOn: true, seams: seams("asideReply", "goOn") });
  test("replyIntoPoint reads strictly: a reply seam, a new point and its card in one turn is flagged, after a go-on turn or the AI line too", () => {
    const row = T({ text: "Cricket wali baat. Ab 1/3 wale 3 gap. Kitne gap?", seams: seams("aside", "point", "card") });
    assert.ok(PREDICATES.replyIntoPoint({ rows: [] }, row, 2, { prevT: goOn }), "the said-again exemption is gone");
    const ai = T({ seams: seams("aiQuestion") });
    const rep = T({ text: "Wah, chauka! Ab 1/3 wale 3 gap. Kitne gap?", seams: seams("aiReply", "point", "card") });
    assert.ok(PREDICATES.replyIntoPoint({ rows: [] }, rep, 4, { prevT: ai, prevPrevT: goOn }), "the reply-after-go-on-and-AI-line exemption is gone");
    // (D2's turn — a reply, a point and its check-in — and a reply into a card with no new point are not this rule's)
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, replyTurn("park"), 0, {}), null);
    assert.equal(PREDICATES.replyIntoPoint({ rows: [] }, T({ seams: seams("park", "card") }), 0, {}), null);
  });
  test("endsOnQuestion no longer accepts noFit \"aside\": her reply's go-on line is flagged; a right verdict's go-on line is not", () => {
    const end = (r) => PREDICATES.endsOnQuestion({ rows: [r, C()] }, r, 0, {});
    assert.ok(end(T({ text: "Oho, batting! Theek hai, ab phir se dhyaan idhar lagate hain.", move: "repair", noFit: "aside", noFitGoOn: true })));
    assert.equal(end(T({ text: "Bilkul sahi. Chalo, aage badhte hain.", move: "repair", noFit: "vpc" })), null);
  });
  test("goOnNoTeach reads ANY three of her turns running with no teaching part; two, or a third that teaches, do not", () => {
    const quiet = (s) => T({ seams: seams(s) });
    const rows = [quiet("tryFirst"), C(), quiet("aiQuestion"), C(), quiet("return")];
    assert.ok(PREDICATES.goOnNoTeach({ rows }, rows[4], 4, {}));
    assert.equal(PREDICATES.goOnNoTeach({ rows: rows.slice(2) }, rows[4], 2, {}), null);
    const taught = [quiet("tryFirst"), C(), quiet("aiQuestion"), C(), T({ seams: seams("aiReply", "card") })];
    assert.equal(PREDICATES.goOnNoTeach({ rows: taught }, taught[4], 4, {}), null);
    // (a stop between is no stall)
    const stop = [quiet("tryFirst"), C(), T({ move: "break", seams: seams("break") }), C(), quiet("aiQuestion"), C(), quiet("return")];
    assert.equal(PREDICATES.goOnNoTeach({ rows: stop }, stop[6], 6, {}), null);
  });
  test("asideGoOnNext, goOnNoTeach and goOnJointTwice stay gated", () => {
    for (const k of ["asideGoOnNext", "goOnNoTeach", "goOnJointTwice", "replyIntoPoint", "replyCheckin", "asideCheckin", "endsOnQuestion"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
});

describe("item 4: replyPointCardNext, gated — after her reply's point turn the next turn that teaches says that point's card and no new point", () => {
  const rp = replyTurn("park");
  const card = (o = {}) => T({ beat: "s2:explain:e1", seams: seams("card"), pageParts: [{ part: "card", from: 0, beat: "e1" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e1" }, ...o });
  const run = (...after) => { const rows = [rp, ...after.flatMap((x) => [C(), x])]; return PREDICATES.replyPointCardNext({ rows }, rp, 0, {}); };
  test("registered and gated", () => { assert.ok(PREDICATES.replyPointCardNext); assert.ok(!PENDING.has("replyPointCardNext")); });
  test("its card next, or after a turn that teaches nothing, or after help on the point alone: not flagged", () => {
    assert.equal(run(card()), null);
    assert.equal(run(T({ seams: seams("aiQuestion") }), card({ seams: seams("aiReply", "card") })), null);
    assert.equal(run(T({ seams: seams("help", "help", "checkin") }), card({ seams: seams("help", "card") })), null);
    assert.equal(run(card({ seams: seams("aside", "card") })), null);
  });
  test("a new point, or another card, as the next teaching turn: flagged; a stop or a safety turn first: not", () => {
    assert.ok(run(T({ beat: "s2:explain:e2", seams: seams("aside", "point", "card"), pageParts: [{ part: "body", from: 0, beat: "e2" }, { part: "card", from: 9, beat: "e2" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e2" } })));
    assert.ok(run(card({ beat: "s2:explain:e2", pageParts: [{ part: "card", from: 0, beat: "e2" }], check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e2" } })));
    assert.equal(run(T({ move: "safeguard", seams: seams("safeguard") }), T({ seams: seams("point", "card") })), null);
    assert.equal(run(T({ move: "wrap", seams: seams("covered") })), null);
  });
  test("not read after a turn that is no reply's point turn: a bare point and its check-in, or a point said before", () => {
    const plain = T({ text: `${POINT} Yahan tak theek hai?`, beat: "s2:explain:e1", seams: seams("point", "checkin"), pageParts: [{ part: "body", from: 0, beat: "e1" }] });
    const rows = [plain, C(), T({ seams: seams("point", "card") })];
    assert.equal(PREDICATES.replyPointCardNext({ rows }, plain, 0, {}), null);
    const again = [plain, C(), rp, C(), T({ seams: seams("point", "card") })];
    assert.equal(PREDICATES.replyPointCardNext({ rows: again }, rp, 2, {}), null);
  });
});

describe("the walk, where D2 put a third clarify at a point's check-in (dry5 stuck c4-ch06-t01 62): the help's two lines are recorded as said", () => {
  // (the sixth ruling's item 1 sends a clarify at D2's check-in down the give-up path, so a walk no longer reaches the spent ladder there; the
  // record is pinned on pickHelp's own decision for a point with nothing unsaid)
  test("nothing easier, then helpToCard, then the card: the help joint is helpToCard with the helpSpent line spent before it; the seam pass marks both", async () => {
    const { _helpJointOfForTest: helpJointOf } = await import("../server/director/state.js");
    const { pickHelp } = await import("../server/director/help.js");
    const { applySeams } = await import("../server/brain/seams.js");
    const { readFileSync } = await import("node:fs");
    const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c5-maths-ch02-t01.json", import.meta.url), "utf8"));
    const part = "c5-maths-ch02-t01-s2:e1:checkin";
    // (every wording of the point said: its ladder is spent)
    let said = [], d = pickHelp({ script, part, request: "clarify", said });
    for (let n = 0; n < 8 && d?.rung; n++) { said = [...said, ...String(d.rung.text).split(/(?<=[.!?\u0964])\s+/).map((k) => ({ k: k.toLowerCase().replace(/[^\p{L}\p{N}/]+/gu, " ").trim(), row: n }))]; d = pickHelp({ script, part, request: "clarify", said }); }
    assert.equal(d?.card, "ask"); assert.equal(d.joint?.kind, "helpSpent"); assert.equal(d.then?.kind, "helpToCard");
    const hj = helpJointOf(d);
    assert.equal(hj.kind, "helpToCard"); assert.equal(hj.spent?.kind, "helpSpent");
    const list = [{ part: "simpler", text: hj.spent.form }, { part: "simpler", text: hj.form }, { part: "card", text: "Kis fraction par pahunchoge?" }];
    const sp = applySeams(list.map((p) => p.text).join(" "), list, { kit: { topicId: "t", __joints: {} }, state: { turn: 9 }, lang: "hinglish", info: { helpJoint: hj } });
    assert.deepEqual(sp.seams.map((x) => [x.right, x.joint ?? null]).slice(0, 2), [["helpSpent", "helpSpent"], ["helpToCard", "helpToCard"]]);
  });
});

describe("sixth ruling item 1: a clarify at a held-card check-in takes the give-up path — the point's help and its card in the same turn", () => {
  const walk = async (topicId, lines) => {
    const { initLessonState, step } = await import("../server/director/state.js");
    const { classifyFast, targetFor } = await import("../server/director/classify.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const { findItem } = await import("../server/director/items.js");
    const { dryReading } = await import("../evals/hybrid-side-by-side/dry-reader.mjs");
    const kit = kitFromFile(getTopic(topicId)), cl = Number(/^c(\d)/.exec(topicId)[1]);
    const ctx = { firstName: "Riya", teacherName: "Asha", lang: "hinglish", interests: ["cricket"], classLevel: cl, sessionId: "s-054a4", teacher: "director" };
    let s = step(initLessonState({ topicId, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 }).state;
    const out = [];
    lines.forEach((text, n) => {
      const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      const target = targetFor(s, kit, item);
      const fast = classifyFast({ target, childText: text, lang: "hinglish", classLevel: cl, typed: true });
      const r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: fast.result ?? dryReading(target), now: n + 1 }); out.push(r); s = r.state;
    });
    return out;
  };
  const LINES = ["haan, samajh aaya", "3", "6 kilometre", "pata nahi", "one sixth", "1 upon 3", "eight", "1/8", "picture dikhao", "between 0 and 1/5 hai na", "1/10 wala", "chaar gap", "dhai sau metre", "pehle main try karun?", "1 upon 11", "1/12", "pehle mark par", "kal maine cricket khela, sixer maara"];
  test("D2 (c5-t01, the dry's stuck 60 to 64): 'samajh nahi aaya' at her park's point check-in — the point's other wording, then its card", async () => {
    const t = (await walk("c5-maths-ch02-t01", [...LINES, "samajh nahi aaya"])).at(-1);
    assert.equal(t.state.lastMove.help?.request, "clarify"); assert.equal(t.state.lastMove.help?.rung, "pointAlt");
    assert.equal(t.ui.ask?.itemId, "script:c5-maths-ch02-t01-s2:ask:e1", "the card in the same turn, never another check-in");
  });
  test("A(ii) (c5-t02): a clarify at the split first turn's check-in — help on the point and the card", async () => {
    const t = (await walk("c5-maths-ch02-t02", ["pata nahi", "pata nahi", "samajh nahi aaya"])).at(-1);
    assert.equal(t.state.lastMove.help?.request, "clarify"); assert.equal(t.ui.ask?.itemId, "script:c5-maths-ch02-t02-s1:ask:e1");
  });
  test("elsewhere a clarify is as built: at a point's check-in with no card held for it, the wording and the check-in again", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const { readFileSync } = await import("node:fs");
    const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c5-maths-ch02-t01.json", import.meta.url), "utf8"));
    const part = "c5-maths-ch02-t01-s2:e1:checkin";
    assert.equal(pickHelp({ script, part, request: "clarify", said: [] })?.card, "wait");
    assert.equal(pickHelp({ script, part, request: "clarify", said: [], heldCard: true })?.card, "ask");
    assert.equal(pickHelp({ script, part, request: "give_up", said: [] })?.card, "ask");
  });
});

describe("sixth ruling item 1, the check that reads it: clarifyCard accepts the point's help and its card after a held-card check-in, and only there", () => {
  test("after D2's check-in or A(ii)'s, help and the card: not flagged; after any other check-in, or a card with no help: flagged as before", () => {
    const sm = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
    const d2 = T({ text: "Cricket ki baat bhi hogi. Is baar line 3 gaps mein kati hai. Yahan tak theek hai?", noFit: "point", seams: sm("park", "point", "checkin") });
    const start = T({ text: "Theek hai, main shuru karti hoon. Roti ke 4 hisse. Yahan tak theek hai?", noFit: "point", seams: [{ left: "start", right: "startAnyway", joint: "startAnyway" }, ...sm("hook", "point", "checkin").slice(1)] });
    const plain = T({ text: "Haan, sahi hai. Ab aage dekhenge. Yahan tak theek hai?", seams: sm("verdict", "bridge", "checkin") });
    const help = T({ text: "Chocolate se socho. Kis fraction par pahunchoge?", card: "Kis fraction par pahunchoge?", seams: sm("help", "card"), pageParts: [{ part: "simpler", from: 0 }, { part: "card", from: 20 }] });
    const bare = T({ text: "Kis fraction par pahunchoge?", card: "Kis fraction par pahunchoge?", seams: sm("card"), pageParts: [{ part: "card", from: 0 }] });
    const read = (prevT, r) => PREDICATES.clarifyCard({ rows: [prevT, C("samajh nahi aaya"), r] }, r, 2, { prevT, prevChild: "samajh nahi aaya", script: null });
    assert.equal(read(d2, help), null); assert.equal(read(start, help), null);
    assert.ok(read(plain, help)); assert.ok(read(d2, bare));
  });
});

describe("sixth ruling item 2: replyCheckin and asideCheckin — the exemption is exactly D2, and every reply seam is read", () => {
  const sm = (...k) => k.map((right, n) => ({ left: n ? k[n - 1] : "start", right, joint: null }));
  const reply = "Oho, batting! Isi mein tumhe maza aata hai.";
  const turn = (...k) => T({ text: k.includes("point") ? `${reply} ${POINT} Yahan tak theek hai?` : `${reply} Yahan tak theek hai?`, seams: sm(...k),
    pageParts: k.includes("point") ? [{ part: "body", from: reply.length + 1, beat: "e1" }] : [] });
  const both = (r) => [PREDICATES.replyCheckin({ rows: [r] }, r, 0, {}), PREDICATES.asideCheckin({ rows: [r] }, r, 0, {})];
  test("her reply (any reply seam), her joint and ONE new point, then the check-in: neither flags it", () => {
    for (const k of ["asideReply", "aiReply", "park", "aside"]) assert.deepEqual(both(turn(k, "point", "checkin")), [null, null], k);
  });
  test("a reply, a bridge, a point and a check-in is two new things: replyCheckin flags it (director29's c4 offtopic 46)", () => {
    assert.ok(PREDICATES.replyCheckin({ rows: [] }, turn("aiReply", "bridge", "point", "checkin"), 0, {}));
    assert.ok(PREDICATES.replyCheckin({ rows: [] }, turn("park", "bridge", "point", "checkin"), 0, {}));
  });
  test("a bare reply, park or aside and a check-in: both flag it; an aside inside a turn, not its first seam, is no reply", () => {
    for (const k of ["asideReply", "aiReply", "park", "aside"]) { const [a, b] = both(turn(k, "checkin")); assert.ok(a, `replyCheckin ${k}`); assert.ok(b, `asideCheckin ${k}`); }
    assert.deepEqual(both(turn("verdict", "aside", "checkin")), [null, null]);
  });
});
