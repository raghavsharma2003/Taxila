// to-brain 054 A, main's fourth ruling on cause A (round d37, after the second as-heard read): two items, each pinned here — the walk's turn on
// the offline walk (state.js step, no reply), the seam pass on made parts, and the predicate on made rows.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { applySeams, SEAM_TABLE } from "../server/brain/seams.js";
import { D29_PREDICATES } from "../evals/hybrid-side-by-side/d29-predicates.mjs";
import { classifyFast, targetFor } from "../server/director/classify.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { findItem } from "../server/director/items.js";
import { dryReading } from "../evals/hybrid-side-by-side/dry-reader.mjs";

const live = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));
/** The walk alone (state.js step, no reply): each child line read as the dry matrix reads it — code's reader, else the dry stub. */
function walkLines(topicId, lines) {
  const kit = kitFromFile(getTopic(topicId));
  const ctx = { firstName: "Riya", teacherName: "Asha", lang: "hinglish", interests: ["cricket"], classLevel: Number(/^c(\d)/.exec(topicId)[1]), sessionId: "s-054a3", teacher: "director" };
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

describe("item 1: a Hindi request after a go-on turn — the point first, then the switch line and the card's Hindi form", () => {
  // (the steady child of the dry matrix, c5-maths-ch02-t01, up to row 37: a park at the bridge's check-in, its go-on line, "Hindi mein bolo")
  const LINES = ["haan, samajh aaya", "3", "6 kilometre", "pata nahi", "one sixth", "1 upon 3", "eight", "1/8", "picture dikhao", "between 0 and 1/5 hai na",
    "1/10 wala", "chaar gap", "dhai sau metre", "pehle main try karun?", "1 upon 11", "1/12", "pehle mark par", "kal maine cricket khela, sixer maara", "Hindi mein bolo"];
  test("the walk: the held point, no line before it, the switch line held for the seam before the card's Hindi form", () => {
    const rs = walkLines("c5-maths-ch02-t01", LINES);
    const go = rs.at(-2).state.lastMove, t = rs.at(-1);
    assert.equal(go.noFit, "aside"); assert.ok(go.replyApart);
    const m = t.state.lastMove;
    assert.ok(m.point, "the held point is said");
    assert.ok(m.hindiForm && t.ui.ask.text === m.hindiForm, "the card's Hindi form is the turn's question");
    assert.deepEqual(m.lineBeforeCard, { kind: "hindiSwitch" });
    assert.ok(!(m.sayFirst ?? []).some((x) => live("c5-maths-ch02-t01").joints.easierWords.some((f) => f.hi === x)), "no easier-words line before the point");
    assert.ok(!m.helpJoint, "no help joint leads the turn");
    assert.equal(t.state.ctx.lang, "hindi");
  });
  test("the seam pass: point > hindiSwitch takes the switch line (said once, as its own part), hindiSwitch > card none", () => {
    assert.ok(SEAM_TABLE.some(([a, b, j]) => a === "point" && b === "hindiSwitch" && j === "hindiSwitch"));
    assert.ok(SEAM_TABLE.some(([a, b, j]) => a === "point" && b === "easierWords" && j === "easierWords"));
    const KIT = { topicId: "t-test", __joints: { hindiSwitch: [{ hi: "Achha, ab Hindi mein bolti hoon.", en: "Okay, in Hindi now." }] } };
    const list = [{ part: "body", text: "Is baar line 3 barabar gaps mein kati hai." }, { part: "aside", text: "Achha, ab Hindi mein bolti hoon.", kind: "hindiSwitch" },
      { part: "card", text: "0 se 5 gap aage jao, toh kaunsa fraction aata hai?" }];
    const r = applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state: { turn: 9 }, lang: "hinglish", info: { lineBeforeCardBy: "authored" } });
    assert.deepEqual(r.seams.map((x) => [x.left, x.right, x.joint]), [["start", "point", null], ["point", "hindiSwitch", "hindiSwitch"], ["hindiSwitch", "card", null]]);
    assert.equal(r.seams[1].form, "Achha, ab Hindi mein bolti hoon.");
    assert.equal(r.reply.split("Hindi mein bolti hoon").length - 1, 1, "the switch line is said once");
    assert.ok(r.reply.indexOf("Is baar") < r.reply.indexOf("Achha, ab Hindi") && r.reply.indexOf("Achha, ab Hindi") < r.reply.indexOf("0 se 5"));
  });
  test("switchFirst: allowed — point, switch line, Hindi-form card; still flagged — the switch line before the point, or with no Hindi form after it", () => {
    const script = live("c5-maths-ch02-t01");
    const card = script.skills.find((k) => k.skillId === "c5-maths-ch02-t01-s2").explain.find((b) => b.id === "e1").ask;
    const hf = String(card.hindi?.hi ?? card.hindi);
    const asWritten = String(card.prompt?.hi ?? card.prompt);
    assert.ok(hf && asWritten && hf !== asWritten);
    const point = "Is baar line 3 barabar gaps mein kati hai, har gap 1/3. 0 se 2 gap chalo, ek, do, aur hum 2/3 par aa gaye.";
    const sw = "Achha, ab Hindi mein bolti hoon.";
    const row = (parts) => {
      let text = "", from = {}; const seams = []; let left = "start";
      for (const [k, t] of parts) { from[k] = text ? text.length + 1 : 0; text = text ? `${text} ${t}` : t;
        seams.push({ left, right: k, joint: k === "hindiSwitch" ? "hindiSwitch" : null, ...(k === "hindiSwitch" ? { form: t } : {}) }); left = k; }
      return { who: "teacher", text, seams, check: { itemId: "script:c5-maths-ch02-t01-s2:ask:e1" },
        pageParts: [{ part: "body", beat: "e1", from: from.point }, { part: "card", beat: "e1", from: from.card }].sort((a, b) => a.from - b.from) };
    };
    const at = (r) => D29_PREDICATES.switchFirst({ rows: [r] }, r, 0, { o: { teacherTexts: [] }, script });
    assert.equal(at(row([["point", point], ["hindiSwitch", sw], ["card", hf]])), null, "point, switch line, the card's Hindi form");
    assert.ok(at(row([["hindiSwitch", sw], ["point", point], ["card", hf]])), "the switch line before the point");
    assert.ok(at(row([["point", point], ["hindiSwitch", sw], ["card", asWritten]])), "the switch line with the card as written after it");
    // (and the switch line after the point with something else between it and the Hindi form)
    const mid = row([["point", point], ["hindiSwitch", sw], ["point2", "Dhyan se dekho."], ["card", hf]]);
    assert.ok(at(mid), "the switch line not straight before the card");
  });
});
