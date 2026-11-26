// d38 RULING-A9 R2: no back-to-work joint twice running — where her turn before said a go-on joint (afterAside, afterAiLine, afterPark,
// afterKeyGoOn), her line to the side-topic in this turn leads into the lesson with none (brain/say.js seamsOf goOnBefore, brain/seams.js
// applySeams: the seam's left is replyAgain, which the table gives no joint). offtopic c4-maths-ch01-t02 54 of builder Q's matrix:
// "Main AI hoon, meri koi pasand nahi hoti. Ab phir se apni baat par aate hain. Yeh cake ke tukde ki nok hai. …" after 52's
// "Chalo, ab padhai aage badhate hain.".
import { test } from "node:test";
import assert from "node:assert/strict";
import { applySeams } from "../server/brain/seams.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

const KIT = kitFromFile(getTopic("c4-maths-ch05-t01"));
const list = [{ part: "aside", text: "Main AI hoon, meri koi pasand nahi hoti." }, { part: "card", text: "Kya pizza ka ek chhota tukda poore pizza ka ek-tihaai hai?" }];
const state = { turn: 9, ctx: { lang: "hinglish" }, lastMove: {} };
const go = (info) => applySeams(list.map((p) => p.text).join(" "), list, { kit: KIT, state, lang: "hinglish", info });

test("R2: her turn before said a go-on joint — the AI line said again goes into the card with no joint", () => {
  const r = go({ goOnBefore: true });
  const s = r.seams.find((x) => x.right === "card");
  assert.equal(s?.left, "replyAgain"); assert.equal(s.joint, null);
  assert.doesNotMatch(r.reply, /Ab seekhne par wapas aate hain|Chalo, ab padhai aage badhate hain|Ab phir se apni baat par aate hain/);
});
test("R2, the other side: where her turn before said none, the AI line's joint is said as built", () => {
  const r = go({});
  assert.equal(r.seams.find((x) => x.right === "card")?.joint, "afterAiLine");
});
