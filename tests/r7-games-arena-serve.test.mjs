// r7 Games: ITEM-ARENA revived as the broad net. Its coverage entries come after every law family, its challenges ride the
// level request from data/arena (the client never loads the bank), and a served level is one verified item of the
// entry's own skill, solvable only by hitting the verified key.
import { test } from "node:test";
import assert from "node:assert/strict";
import { coverage, currentLevel, entryKey, seedOf, entryFor, arenaItems } from "../server/play/levels.js";
import { logicFor } from "../src/play/families/index.ts";

const body = (entry, n) => ({ childId: `a-${n}`, key: entryKey(entry), skillId: entry.skillId, lessonId: null, classLevel: entry.classLevel, fade: 1, lang: "hinglish",
  childArt: null, lastArt: null, mis: {}, pL: undefined, n: 0, seed: seedOf(`a-${n}`, entryKey(entry), 0), door: "garam", recent: [], hist: null });

test("arena entries sit after every law entry, and a law family keeps every skill it admits", () => {
  const es = coverage().entries, firstArena = es.findIndex((e) => e.family === "arena");
  assert.ok(firstArena > 0);
  assert.ok(es.slice(firstArena).every((e) => e.family === "arena"));
  for (const e of es.slice(0, firstArena)) for (const sk of e.skillIds) assert.notEqual(entryFor({ skillId: sk }).family, "arena", sk);
});

test("every class 4-7 arena entry serves a valid level of its own skill, solved by the verified key", () => {
  const arena = coverage().entries.filter((e) => e.family === "arena" && e.classLevel >= 4 && e.classLevel <= 7);
  assert.ok(arena.length >= 100, `${arena.length}`);
  const logic = logicFor("arena", "pick");
  for (const entry of arena) {
    assert.ok(arenaItems(entry.grammar.bank, entry.topicId).length >= 6, entry.topicId);
    const lv = currentLevel(body(entry, 0), entry);
    assert.ok(lv, `${entry.topicId} served nothing`);
    assert.equal(lv.family, "arena");
    assert.ok(entry.skillIds.includes(lv.skillId), `${entry.topicId}: ${lv.skillId}`);
    const v = logic.validate(lv);
    assert.ok(v);
    let s = logic.init(v);
    for (const [i, a] of logic.solve(v).entries()) s = logic.apply(v, s, a, i + 1).state;
    assert.ok(s.done);
  }
});

test("the bank never leaves the server through the request grammar of a non-arena entry", () => {
  const law = coverage().entries.find((e) => e.family !== "arena");
  assert.equal(currentLevel(body(law, 1), law).params.items, undefined);
  assert.deepEqual(arenaItems("../secrets", "x"), []);
});
