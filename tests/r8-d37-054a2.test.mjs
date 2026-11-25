// to-brain 054 A, main's second ruling on cause A (round d37, after the as-heard read): five fixes, each pinned here — the walk's turn on the
// offline walk (state.js step, no reply) and, where the ruling names one, the predicate on made rows.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { findItem } from "../server/director/items.js";
import { dryReading } from "../evals/hybrid-side-by-side/dry-reader.mjs";

const live = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));
/** The walk alone (state.js step, no reply): each child line read as the dry matrix reads it — code's reader, else the dry stub. */
function walkLines(topicId, lines) {
  const kit = kitFromFile(getTopic(topicId));
  const ctx = { firstName: "Riya", teacherName: "Asha", lang: "hinglish", interests: ["cricket"], classLevel: Number(/^c(\d)/.exec(topicId)[1]), sessionId: "s-054a2", teacher: "director" };
  let s = step(initLessonState({ topicId, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 }).state;
  const out = [];
  for (const text of lines) {
    const item = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    const target = targetFor(s, kit, item);
    const fast = classifyFast({ target, childText: text, lang: "hinglish", classLevel: ctx.classLevel, typed: true });
    const r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: fast.result ?? dryReading(target), now: out.length + 1 });
    out.push(r); s = r.state;
  }
  return out;
}

describe("fix 1: a request made in reply to a go-on turn is honoured", () => {
  // (the steady child of the dry matrix, c5-maths-ch02-t01, up to row 37: a park at the bridge's check-in, its go-on line, "Hindi mein bolo")
  const LINES = ["haan, samajh aaya", "3", "6 kilometre", "pata nahi", "one sixth", "1 upon 3", "eight", "1/8", "picture dikhao", "between 0 and 1/5 hai na",
    "1/10 wala", "chaar gap", "dhai sau metre", "pehle main try karun?", "1 upon 11", "1/12", "pehle mark par", "kal maine cricket khela, sixer maara", "Hindi mein bolo"];
  test("Hindi after her reply's go-on line: the held point, and the card asked in its own Hindi form, after the easier-words line", () => {
    const rs = walkLines("c5-maths-ch02-t01", LINES);
    const go = rs.at(-2).state.lastMove, t = rs.at(-1);
    assert.equal(go.noFit, "aside"); assert.ok(go.replyApart);
    const m = t.state.lastMove;
    assert.ok(m.point, "the held point is said");
    const script = live("c5-maths-ch02-t01");
    const form = String(m.hindiForm ?? "");
    assert.ok(form && t.ui.ask.text === form, "the card's Hindi form is the turn's question");
    assert.equal(m.request, "language"); assert.ok(m.noLangAck, "no switch line before a first telling (T1)");
    assert.ok(script.joints.easierWords.some((f) => f.hi === m.sayFirst?.[0]), "the easier-words line leads");
    assert.equal(m.help?.request, "hindi"); assert.ok(m.help.hindiForm);
    assert.equal(t.state.ctx.lang, "hindi");
    // (the walk keeps the card's own text: the form is this turn's words for it)
    assert.notEqual(t.state.lastUi.ask.text, form);
  });
  test("hindiNoFormNoLine reads the turn after a go-on line like any other: no exemption", async () => {
    const { PREDICATES } = await import("../evals/hybrid-side-by-side/dry-predicates.mjs");
    const script = live("c5-maths-ch02-t01");
    const goOn = { who: "teacher", text: "Cricket ki baat bhi hogi. Abhi apne kaam par wapas chalte hain.", noFit: "aside", noFitGoOn: true };
    const child = { who: "child", text: "Hindi mein bolo", intent: "hindi" };
    const bare = { who: "teacher", text: "Is baar line 3 barabar gaps mein kati hai. 0 se 5 gap chalo. Kis fraction par pahunchoge?", seams: [{ right: "point" }, { right: "card" }] };
    const rows = [goOn, child, bare];
    assert.ok(PREDICATES.hindiNoFormNoLine({ rows }, bare, 2, { script, o: {}, prevT: goOn }));
    const ew = { ...bare, text: `${script.joints.easierWords[1].hi} ${bare.text}` };
    assert.equal(PREDICATES.hindiNoFormNoLine({ rows: [goOn, child, ew] }, ew, 2, { script, o: {}, prevT: goOn }), null);
  });
});
