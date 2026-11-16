// dc-r8-director24 T3 (main's 035, 036): the sentence about the child is code's — the check card of the last skill she reached that she
// answered right at the first try, the latest in script order, never the closing question; Learning's `did` clause for it in one of
// `wrap.didFrames`. No such card: no sentence.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { didSentence } from "../server/brain/say.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";

test("T3: the latest first-try card of the last skill reached, its did in a frame; none, no sentence", () => {
  const sc = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c4-maths-ch05-t01.json", import.meta.url)));
  const s3 = sc.skills[2], s2 = sc.skills[1];
  s3.checks[0].did = { hi: "1/10, 1/7 aur 1/4 ko chhote se bade tak lagaya", en: "put 1/10, 1/7 and 1/4 in order" };
  if (s3.checks[1]) s3.checks[1].did = { hi: "do pizza ke tukde milaye", en: "compared two pizzas' pieces" };
  s2.checks[0].did = { hi: "barabar group banaye", en: "made equal groups" };
  sc.wrap = { ...(sc.wrap ?? {}), didFrames: [{ hi: "Aaj tumne {did}, bahut dhyan se.", en: "Today you {did}, carefully." }] };
  setScriptForTest("c4-maths-ch05-t01", sc);
  try {
    const kit = kitFromFile(getTopic("c4-maths-ch05-t01"));
    const id = (sk, c) => `script:${sk.skillId}:${c.id}`;
    const st = (log) => ({ ctx: { lessonKey: "L" }, introduced: [s2.skillId, s3.skillId], rightLog: log });
    // (the first check of skill 3 right at the first try, the second after a miss: the first is the one)
    const t = didSentence(st([{ id: id(s3, s3.checks[0]), misses: 0 }, ...(s3.checks[1] ? [{ id: id(s3, s3.checks[1]), misses: 1 }] : [])]), kit);
    assert.equal(t, "Aaj tumne 1/10, 1/7 aur 1/4 ko chhote se bade tak lagaya, bahut dhyan se.");
    // (nothing right at the first try in the last skill: the skill before it)
    assert.equal(didSentence(st([{ id: id(s2, s2.checks[0]), misses: 0 }]), kit), "Aaj tumne barabar group banaye, bahut dhyan se.");
    // (nothing right at the first try anywhere: no sentence)
    assert.equal(didSentence(st([{ id: id(s3, s3.checks[0]), misses: 2 }]), kit), null);
  } finally { setScriptForTest(undefined); }
});
