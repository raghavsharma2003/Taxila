// The passage beat is decided from the kit alone: read aloud in classes 1-3, on the board from class 4, once per passage per lesson.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getTopic } from "../server/content/curriculum.js";
import { kitFromFile } from "../server/content/kits.js";
import { passageBeat, passageMode, shownAfter, aloudText, passageOf } from "../server/director/passage.js";

test("mode: classes 1-3 read aloud, class 4 and up on the board", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(passageMode), ["aloud", "aloud", "aloud", "board", "board", "board"]);
});

test("a story item gets the passage beat once; a held item's kit has the passage", () => {
  const kit = kitFromFile(getTopic("c3-english-ch09-t01"));
  const item = kit.heldItems.find((i) => i.id === "c3-english-ch09-t01-i01");
  assert.ok(item && passageOf(kit, item));
  const beat = passageBeat({ kit, item, classLevel: 3 });
  assert.equal(beat.mode, "aloud");
  assert.match(aloudText(beat), /^Pihu had a wish\./m);
  const shown = shownAfter([], beat);
  assert.equal(passageBeat({ kit, item, classLevel: 3, shown }), null, "already met: no second reading");
  const another = kit.heldItems.find((i) => i.id === "c3-english-ch09-t01-i02");
  assert.equal(passageBeat({ kit, item: another, classLevel: 3, shown }), null, "same passage, same lesson");
});

test("an item with no passage has no beat; a class 8 passage goes to the board", () => {
  const kit = kitFromFile(getTopic("c3-english-ch09-t01"));
  assert.equal(passageBeat({ kit, item: kit.items[0], classLevel: 3 }), null);
  const k8 = kitFromFile(getTopic("c8-english-ch10-t01"));
  const it = k8.heldItems[0];
  const beat = passageBeat({ kit: k8, item: it, classLevel: 8 });
  assert.equal(beat.mode, "board");
  assert.ok(beat.lines.length >= 1 && beat.text.length > 100);
});
