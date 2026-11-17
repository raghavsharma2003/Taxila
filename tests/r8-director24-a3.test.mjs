// dc-r8-director24 A3 (main's 035): a second or third aside, its return already had, gets a reply in the child's words (c6 offtopic 24,
// 32; c5-t02 offtopic 32 got a bare "Achha." / "Theek hai."); the AI line never re-asks what she answered (c5-t01 offtopic 28 asked
// "Tumhe Virat ke baare mein kya achha lagta hai?" after "batting" had answered it at 9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { againInHerWords, honestTasteLine } from "../server/brain/say.js";

const st = (n) => ({ recent: Array.from({ length: n }, () => ({ who: "teacher", text: "x" })) });

// (dc-r8-director26 A4 moves this pin: what the child said is said back in a phrase form first — its last clause whole, "Achha, pichhli baar
// sixer maara." — where a phrase of theirs fits; a word form, when it is the reply, still names a noun and never a verb alone)
test("an aside said again: her reply says their clause back in a phrase form, or names a noun of their line — never a verb alone", () => {
  const a = againInHerWords("kal maine cricket khela, sixer maara", "cricket", "hinglish", st(3));
  assert.match(a, /sixer/);
  assert.doesNotMatch(a, /khela/);
  // (dc-r8-director27 P6.3: Learning 016's said-again form says their clause back too — "Haan, sixer maara, yeh tumne bataya tha.")
  assert.ok(/pichhli baar sixer maara|sixer maara, yeh tumne bataya/i.test(a) || !/maara/.test(a), a);
  assert.match(againInHerWords("mujhe cricket pasand hai", "cricket", "hinglish", st(4)), /cricket/);
  // (no word of theirs: none — the plain ack stands)
  assert.equal(againInHerWords("haan", "cricket", "hinglish", st(1)), null);
});

test("the AI line asks each question once: a later ask asks one the lesson has not asked; with all asked, the honest line alone", () => {
  const said = [honestTasteLine("Virat", "hinglish", 1)];
  const lines = [];
  for (let n = 2; n <= 5; n++) { const l = honestTasteLine("Virat", "hinglish", n, said); lines.push(l); said.push(l); }
  const qs = [said[0], ...lines].map((l) => l.split(/(?<=[.!?])\s+/).at(-1)).filter((q) => /\?$/.test(q));
  assert.equal(new Set(qs).size, qs.length);
  assert.ok(!/\?/.test(lines.at(-1)));
  assert.match(lines.at(-1), /AI/);
  // (the c5-t01 offtopic 28 row: the first and the favourite question asked — the third ask asks neither)
  const third = honestTasteLine("Virat", "hinglish", 3, ["Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?", "Main AI hoon, meri koi pasand nahi hoti. Tumhara favourite kaun hai?"]);
  assert.doesNotMatch(third, /achha (?:kya )?lagta|favourite/);
  assert.match(third, /\?$/);
});
