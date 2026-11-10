// CD-17: the Hindi kits named the friend रिया as plain text, so the English prompt said one girl and the Hindi prompt another,
// and the slot never reached Devanagari. The slot now fills in Devanagari inside a Hindi string.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fillFriend, fillFriendDeep, DEVANAGARI } from "../server/director/friend.js";

test("a Hindi string gets the friend's name in Devanagari; English and Hinglish keep Latin letters; one friend for all of them", () => {
  assert.equal(fillFriend("{friendF} ने सारा को पत्र लिखा।"), `${DEVANAGARI.Zoya} ने सारा को पत्र लिखा।`);
  assert.equal(fillFriend("{friendF} wrote a letter to Sara."), "Zoya wrote a letter to Sara.");
  assert.equal(fillFriend("{friendF} ne Sara ko patr likha."), "Zoya ne Sara ko patr likha.");
  const item = fillFriendDeep({ prompt_en: "Who wrote it? {friendF}.", prompt_hi: "किसने लिखा? {friendF}।", answer: "{friendF}" });
  assert.equal(item.prompt_en, "Who wrote it? Zoya.");
  assert.equal(item.prompt_hi, `किसने लिखा? ${DEVANAGARI.Zoya}।`);
});

test("the child's own name, in either script, is never the friend", () => {
  assert.equal(fillFriend("{friendF}", "Zoya"), "Meera");
  assert.equal(fillFriend("{friendF} ने कहा", "ज़ोया"), `${DEVANAGARI.Meera} ने कहा`);
  assert.equal(fillFriend("{friendM} ने कहा", "कबीर"), `${DEVANAGARI.Arjun} ने कहा`);
});

test("no Hindi kit names रिया as a plain word any more, and every slot fills", () => {
  const RE = /(?<![ऀ-ॿ])रिया(?![ऀ-ॿ])/;
  const dir = new URL("../data/kits/", import.meta.url);
  let slots = 0;
  for (const f of readdirSync(dir).filter((x) => /^c\d+-[a-z]+\.json$/.test(x))) {
    const walk = (x) => {
      if (typeof x === "string") { assert.ok(!RE.test(x), `${f}: ${x.slice(0, 60)}`); if (x.includes("{friend")) { slots++; assert.ok(!/\{friend[FM]?\}/.test(fillFriend(x))); } }
      else if (Array.isArray(x)) x.forEach(walk);
      else if (x && typeof x === "object") Object.values(x).forEach(walk);
    };
    walk(JSON.parse(readFileSync(new URL(f, dir), "utf8")));
  }
  assert.ok(slots > 700, `slots seen: ${slots}`);
});

test("an item whose English prompt uses the slot has the same slot in its Hindi prompt (c3-hindi-ch07-t01-i02)", () => {
  const t = JSON.parse(readFileSync(new URL("../data/kits/c3-hindi.json", import.meta.url), "utf8")).topics.find((x) => x.topicId === "c3-hindi-ch07-t01");
  const it = t.items.find((x) => x.id === "c3-hindi-ch07-t01-i02");
  assert.match(it.prompt_en, /\{friendF\}/);
  assert.match(it.prompt_hi, /\{friendF\}/);
});
