// d35 follow-up 1: three check cards whose `wrongIfMis` child was sent to a remediation about a different mistake now name that answer
// as a `wrongAnswers` entry (its reason the card's old whyAlt). On the walk with the real scripts: that answer gets its reason, then the
// card's simpler, then the key, never the remediation; another wrong answer gets what it got before.
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// (director35 clause 53, release 61: c4-maths-ch01-t02 staged again): a staged script is read from data/lesson-scripts-staged
const raw = (T) => { for (const d of ["lesson-scripts", "lesson-scripts-staged"]) { try { return JSON.parse(readFileSync(new URL(`../data/${d}/${T}.json`, import.meta.url), "utf8")); } catch { /* next */ } } throw new Error(`no script ${T}`); };

const CARDS = [
  { T: "c4-maths-ch05-t01", sid: "s1", cid: "c2", say: "12", n: 3, other: [["5", "incorrect", "simpler"], ["1", "misconception", "whyAltHelp"]] },
  { T: "c4-maths-ch01-t02", sid: "s3", cid: "c2", say: "No", n: 1, other: [["pata nahi", "no_evidence", "simpler"]] },
  { T: "c5-maths-ch02-t03", sid: "s1", cid: "c2", say: "bada", n: 2, other: [["barabar", "misconception", "whyAltHelp"]] },
];

const load = async () => ({
  ...(await import("../server/director/state.js")), ...(await import("../server/director/script.js")),
  ...(await import("../server/content/kits.js")), ...(await import("../server/content/curriculum.js")),
  ...(await import("../server/director/items.js")), ...(await import("../server/director/classify.js")),
});

// (a staged script is never served from data/lesson-scripts: the walk is given it as the eval's staged switch gives it)
const STAGED_HERE = new Set(["c4-maths-ch01-t02"]);
after(async () => { (await import("../server/director/script.js")).setScriptForTest(undefined); });
async function walkTo(m, { T, sid, cid }) {
  if (STAGED_HERE.has(T)) m.setScriptForTest(T, raw(T));
  const kit = m.kitFromFile(m.getTopic(T));
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "x" }, ageBand: "10-15", lang: "hinglish", interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: T, classLevel: Number(T[1]), sessionId: "s", lessonKey: "d35-fu-1", teacher: "director" };
  let r = m.step(m.initLessonState({ topicId: T, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  const want = `script:${T}-${sid}:${cid}`;
  for (let i = 0; i < 400 && r.state.activeItemId !== want; i++) {
    const it = r.state.activeItemId ? m.findItem(r.state, kit, r.state.activeItemId) : null;
    r = m.step(r.state, { event: "turn", kit, cls: { outcome: it ? "correct" : "no_evidence", confidence: 0.9, flags: {} }, text: it ? String(it.answer) : "haan", now: (r.state.turn + 1) * 20_000 });
  }
  assert.equal(r.state.activeItemId, want);
  const say = (text) => {
    const it = m.findItem(r.state, kit, r.state.activeItemId);
    const c = m.classifyFast({ target: { mode: "item", item: it, key: it.answer, also: it.acceptable }, childText: text, typed: false, asrConfidence: 0.95 })?.result;
    const cls = c ? { ...c, confidence: 1, flags: {}, source: "script_key" } : { outcome: "incorrect", confidence: 0.9, flags: {} };
    r = m.step(r.state, { event: "turn", kit, cls, text, now: (r.state.turn + 1) * 20_000 });
    return { cls, move: r.state.lastMove };
  };
  return { kit, say };
}

describe("d35 follow-up 1: a named wrong answer is not routed to a remediation about a different mistake", () => {
  test("the three cards: no wrongIfMis, no whyAlt; the answer is a wrongAnswers entry; targets kept; three named answers at most", async () => {
    const m = await load();
    for (const c of CARDS) {
      const card = raw(c.T).skills.find((k) => k.skillId === `${c.T}-${c.sid}`).checks.find((x) => x.id === c.cid);
      assert.equal(card.wrongIfMis, undefined, c.T); assert.equal(card.whyAlt, undefined, c.T); assert.equal(card.whyAltAsHelp, undefined, c.T);
      assert.ok(card.targets, c.T);
      assert.ok(card.wrongAnswers.length >= 1 && card.wrongAnswers.length <= 3, c.T);
    }
  });
  test("the loader: a check with targets and wrongAnswers needs no wrongIfMis; with neither it is still refused", async () => {
    const m = await load();
    for (const c of CARDS) {
      const kit = m.kitFromFile(m.getTopic(c.T));
      const sk = raw(c.T).skills.find((k) => k.skillId === `${c.T}-${c.sid}`);
      const errs = (s) => m.validateSkillScriptV2(s, kit, { classLevel: Number(c.T[1]) }).filter((e) => /wrongIfMis/.test(e));
      assert.deepEqual(errs(sk), [], c.T);
      const bare = structuredClone(sk); delete bare.checks[Number(c.cid.slice(1)) - 1].wrongAnswers;
      assert.ok(errs(bare).length, `${c.T}: no named answer at all is refused`);
    }
  });
  for (const c of CARDS) {
    test(`${c.T} ${c.sid} ${c.cid}: "${c.say}" gets its reason, then the card's simpler, then the key; never the remediation`, async () => {
      const m = await load();
      const { say } = await walkTo(m, c);
      const a = say(c.say);
      assert.equal(a.cls.outcome, "misconception"); assert.equal(a.cls.wrongNamed, c.n);
      assert.notEqual(a.move.scriptBeat?.kind, "remediation");
      assert.equal(a.move.help?.rung, "whyAltHelp"); assert.match(a.move.help.rungPath, new RegExp(`wrongAnswers\\[${c.n - 1}\\]\\.why$`));
      const b = say(c.say);
      assert.notEqual(b.move.scriptBeat?.kind, "remediation"); assert.equal(b.move.help?.rung, "simpler"); assert.match(b.move.help.rungPath, /checks\[\d\]\.simpler$/);
      const k = say(c.say);
      assert.notEqual(k.move.scriptBeat?.kind, "remediation"); assert.equal(k.move.help?.card, "close", "then the key");
    });
    test(`${c.T} ${c.sid} ${c.cid}: another wrong answer gets what it got before`, async () => {
      const m = await load();
      for (const [text, outcome, rung] of c.other) {
        const { say } = await walkTo(m, c);
        const a = say(text);
        assert.equal(a.cls.outcome, outcome, text); assert.equal(a.move.help?.rung, rung, text);
        assert.notEqual(a.move.scriptBeat?.kind, "remediation", text);
      }
    });
  }
});
