// Round d37's closing builder (BRIEF-close): nine small items, each pinned here on both sides.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { initLessonState, step } = await import("../server/director/state.js");
const { kitFromFile } = await import("../server/content/kits.js");
const { getTopic } = await import("../server/content/curriculum.js");
const { textReply, replyDeps, beatAsk, rotateOf, notAskingUnderstood, ASKS_UNDERSTOOD } = await import("../server/brain/say.js");

const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();

/** A lesson walked with step() and textReply (the reply stubbed: every line is the script's or code's): `lines` are [text, cls]. */
async function walk(TOPIC, lines, seed = 7) {
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  try {
    const kit = kitFromFile(getTopic(TOPIC));
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 5, sessionId: `d37-close-${seed}`, lessonKey: `d37-close-${seed}`, teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed, now: 0 }), { event: "start", kit, now: 0 });
    const say = async (text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: (await say("")).reply }];
    const out = [];
    for (const [text, cls] of lines) {
      const s = r.state;
      r = step({ ...s, recent: [...(s.recent ?? []), { who: "child", text }] }, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
      const t = await say(text);
      r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
      out.push({ text: norm(t.reply), lm: r.state.lastMove ?? {}, state: r.state, kit });
    }
    return out;
  } finally { replyDeps.chat = chat0; replyDeps.chatStream = stream0; }
}

describe("item 1: A(ii)'s first turn after two requests at the greeting never ends on a 'samajh aaya' check-in", () => {
  const XS = ["Yahan tak theek hai?", "Ab tak samajh aaya?", "Yahan tak saaf hai?", "Yeh hissa saaf hua?"];
  test("the helper: a 'samajh aaya' form gives way to the next form of the same list; any other form stands", () => {
    assert.equal(notAskingUnderstood("Ab tak samajh aaya?", XS), "Yahan tak saaf hai?");
    assert.equal(notAskingUnderstood("Yahan tak theek hai?", XS), "Yahan tak theek hai?");
    assert.equal(notAskingUnderstood("Yeh kadam samajh aaya?", ["Yahan tak theek hai?", "Ab tak samajh aaya?", "Yeh kadam saaf hai?", "Yeh kadam samajh aaya?"]), "Yahan tak theek hai?");
    assert.equal(notAskingUnderstood("Does that make sense so far?", ["Does that make sense so far?", "Clear so far?"]), "Clear so far?");
  });
  test("c5-t01 (both judges of cause A: stuck 4, steering 4): over twelve seeds the turn is the start line, the hook and the point, and its check-in is never a 'samajh aaya' form", async () => {
    const GIVE = ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }];
    let rotated = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const [, t] = await walk("c5-maths-ch02-t01", [["samajh nahi aaya", { outcome: "no_evidence", request: { type: "another" } }], GIVE], seed);
      assert.ok(t.lm.startApart, `seed ${seed}: A(ii)'s split first turn`);
      const end = t.text.split(/(?<=[.?!])\s+/).at(-1);
      const xs = beatAsk(t.kit).hinglish;
      assert.ok(xs.includes(end), `seed ${seed}: ends on one of the list's own forms: ${end}`);
      assert.ok(!ASKS_UNDERSTOOD.test(end), `seed ${seed}: ${end}`);
      // (the other side: the rotation alone, at that same state, would have said a "samajh aaya" form on some seeds)
      if (ASKS_UNDERSTOOD.test(rotateOf(xs, { ...t.state, recent: t.state.recent.slice(0, -1) }))) rotated++;
    }
    assert.ok(rotated > 0, "the rotation alone picks a 'samajh aaya' form on some seed: the rule is what keeps it out");
  });
});
