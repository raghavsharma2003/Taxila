// Round 8 Play (docs/patches/to-learning/011): the parent page says why each game, level and help level was chosen, and
// how levels went, from the play routes' flight-recorder rows, through server/director/knows-words.js. Pure; no DB.
import test from "node:test";
import assert from "node:assert/strict";
import { becauseLines, playLine, trailLine } from "../server/director/knows-words.js";
import { playLinesOf } from "../server/reports/teaching.js";

const KINDS = ["play.pick_mixup", "play.pick_novelty", "play.pick_fit", "play.fade_history", "play.fade_director", "play.mixup_focus", "play.step_up", "play.step_down", "play.switch", "play.studio_gate"];
const rec = (kind, o = {}) => ({ choice: "kila/lcm first", fact: "Confuses factors with multiples", source: "x", kind, mis: "c6-m-fm", when: "earlier", ...o });

test("every play because kind has a line in both languages; the record's fact text is never shown", () => {
  for (const lang of ["english", "hinglish"]) for (const kind of KINDS) for (let seed = 0; seed < 4; seed++) {
    const t = playLine(rec(kind), { lang, name: "Riya", seed, games: { "kila/lcm": "Kila" }, mixups: { "c6-m-fm": "factors and multiples" } });
    assert.ok(t && t.length > 10, `${kind} ${lang}`);
    assert.ok(!t.includes("Confuses factors with multiples"), t);
    assert.ok(!/c6-|play\.|kila\/lcm/.test(t), `no internal id: ${t}`);
  }
  assert.equal(playLine({ kind: "play.unknown" }), null);
});

test("becauseLines takes play records beside lesson records and says each once", () => {
  const lines = becauseLines([rec("play.step_up"), rec("play.step_up"), rec("play.switch", { choice: "switch to todo-jodo/atoms" })], { lang: "english", name: "Riya" });
  assert.equal(lines.length, 2);
});

test("the trail line: how a level went, never a verdict on the child", () => {
  const t = { v: 1, game: "kila/lcm", solved: true, firstTry: false, misses: 2, extra: 1 };
  assert.match(trailLine(t, { lang: "english", games: { "kila/lcm": "Kila" } }), /^Kila: solved after a few tries, 1 move more/);
  assert.match(trailLine({ ...t, firstTry: true, extra: 0 }, { lang: "hinglish" }), /pehli koshish mein hal\.$/);
  assert.match(trailLine({ ...t, solved: false }, { lang: "english" }), /not finished this time/);
  assert.equal(trailLine(null), null);
});

test("playLinesOf: the play routes' trace rows (mount / next because, outcome trail) → lines", () => {
  const rows = [
    { kind: "play.outcome", data: { trail: { v: 1, game: "kila/lcm", solved: true, firstTry: true, misses: 0, extra: 0 } } },
    { kind: "play.next", data: JSON.stringify({ because: [{ choice: "next level a step harder", fact: "x", source: "play_grade", kind: "play.step_up" }] }) },
    { kind: "play.mount", data: { because: [rec("play.pick_mixup")] } },
  ];
  const out = playLinesOf(rows, { name: "Riya", lang: "english", mixups: { "c6-m-fm": { en: "factors and multiples" } } });
  assert.equal(out.because.length, 2); assert.equal(out.trail.length, 1);
  assert.match(out.trail[0], /^Kila: solved on the first try/);
  assert.ok(out.because.some((l) => l.includes("factors and multiples")));
  assert.deepEqual(playLinesOf([], {}), { because: [], trail: [] });
});
