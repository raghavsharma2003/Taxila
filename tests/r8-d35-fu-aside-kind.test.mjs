// d35 follow-up 5: "uski sabse achhi baat kya hai?" asks for a liking: the aside-reply reader gives it a kind (it gave none).
import { test } from "node:test";
import assert from "node:assert/strict";
import { replyKindOf } from "../server/brain/asideReplies.js";

test("replyKindOf: an 'achhi baat' question is a liking question", () => {
  assert.equal(replyKindOf("Uski sabse achhi baat kya hai?", "uski batting"), "liking");
  assert.equal(replyKindOf("Cricket mein sabse achha kya lagta hai?", "batting"), "liking", "as before");
  assert.equal(replyKindOf("Uski sabse achhi baat kya hai?", "Virat ke saath"), "person", "a person said is still a person");
  assert.equal(replyKindOf("Kal kahan khele?", "park mein"), "whenWhere", "as before");
});
