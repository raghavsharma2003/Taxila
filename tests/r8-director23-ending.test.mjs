// dc-r8-director23 T2, the ending: the sentence about the child is said to her (second person) and names the hardest thing she got right
// (the closing question first when she got it right); a miss on the closing question gets a miss verdict before the key.
import { test } from "node:test";
import assert from "node:assert/strict";
import { childSentenceAddressed, hardestRight } from "../server/brain/say.js";

test("a sentence that names her in the third person is not said; one said to her is", () => {
  assert.equal(childSentenceAddressed("Bachche ne 1/3 wale tukde ke neeche 1/6 ke do tukde gin kar sahi jawab diya."), null);
  assert.equal(childSentenceAddressed("Riya ne do tukde gine, aur tumne sahi kiya.", "Riya"), null);
  assert.equal(childSentenceAddressed("Do tukde gine."), null);
  assert.equal(childSentenceAddressed("Tumne 1/3 ke neeche 1/6 ke do tukde gin kar sahi jawab diya."), "Tumne 1/3 ke neeche 1/6 ke do tukde gin kar sahi jawab diya.");
});

test("the hardest thing she got right: the closing question when she got it right, else the card right after the most misses", () => {
  const kit = { topicId: "t", items: [{ id: "a", prompt_hi: "Pehla sawaal?" }, { id: "b", prompt_hi: "Mushkil sawaal?" }] };
  const st = { ctx: { lang: "hinglish" }, rightLog: [{ id: "a", misses: 0, turn: 3 }, { id: "b", misses: 2, turn: 9 }] };
  assert.deepEqual(hardestRight(st, kit), { card: "Mushkil sawaal?", closing: false });
  assert.equal(hardestRight({ ctx: {}, rightLog: [] }, kit), null);
});

// (dc-r8-director23 C: Learning's caption for a board's view — `viewCaption` beside the board in the script — is said in place of
// code's line on a picture turn; with none authored, code's line and then the quiet line stay the fallbacks)
test("C: the authored viewCaption of the board up is found by its board", async () => {
  const { viewCaptionOf } = await import("../server/brain/say.js");
  const fs = await import("node:fs");
  const script = JSON.parse(fs.readFileSync(new URL("../data/lesson-scripts/c6-maths-ch06-t01.json", import.meta.url)));
  const beat = script.skills[0].explain[0];
  const { setScriptForTest } = await import("../server/director/script.js");
  const sc = { ...script, skills: [{ ...script.skills[0], explain: [{ ...beat, viewCaption: { hi: "Dhaage ki seedhi line dekho.", en: "Look at the straight thread." } }, ...script.skills[0].explain.slice(1)] }, ...script.skills.slice(1)] };
  setScriptForTest("c6-maths-ch06-t01", sc);
  try {
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
    const st = { heldUp: { board: beat.board }, lastMove: {} };
    assert.equal(viewCaptionOf(kit, st, "hinglish"), "Dhaage ki seedhi line dekho.");
    assert.equal(viewCaptionOf(kit, { heldUp: { board: { template: "none@1" } }, lastMove: {} }, "hinglish"), null);
  } finally { setScriptForTest(undefined); }
});
