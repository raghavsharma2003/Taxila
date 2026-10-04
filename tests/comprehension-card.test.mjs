// The parent "how we know" card (comprehension audit G1; BUILD-PLAN W1-C #1). The card used to throw — and the parent
// corner to show nothing — for every English child in `shallow` ("the idea behind them": "behind" is banned), the state
// a child is in after a typical first lesson. Every state × language × refresh must now render, pass the lexicon gate,
// name no state or label, and count days in good English.
import { test } from "node:test";
import assert from "node:assert/strict";
import { conceptCard, parentLexiconHit } from "../server/comprehension/report/howweknow.js";
import { STATES } from "../server/comprehension/params.js";

const reasons = (delay) => [
  { at: "2026-10-01T05:00:00Z", shapeId: "C03", cls: "probe.why", outcome: 0, grader: "llm", help: 0, delayDays: 0, moved: ["U"] },
  { at: "2026-10-02T05:00:00Z", shapeId: null, cls: "item.open", outcome: 0, grader: "code", help: 1, via: "callback", delayDays: delay, moved: ["K", "D"] },
  { at: "2026-10-02T05:01:00Z", shapeId: "C13", cls: "probe.transfer.near", outcome: 2, grader: "code", help: 2, delayDays: delay, moved: ["T"] },
  { at: "2026-10-02T05:02:00Z", shapeId: null, cls: "item.open", outcome: 4, grader: "code", help: 4, delayDays: delay, moved: ["K"] },
];
const STATE_WORDS = /\b(not_yet|shallow|fragile|understood|durable)\b/i;

test("every state × language × refresh × k7 renders a non-empty card that passes the lexicon gate", () => {
  let n = 0;
  for (const state of STATES) for (const lang of ["en", "hinglish", "hi"]) for (const refresh of [false, true]) for (const k7 of [false, true]) {
    for (const reason of [undefined, "wrong_idea_confirmed"]) {
      const b = { skillId: "k", state, refresh, reason, reasons: reasons(3) };
      const card = conceptCard(b, { concept: "place value", belief: "a bigger number of digits is always bigger", lang, k7, now: "2026-10-03T00:00:00Z" });
      assert.ok(card && card.rows.length >= 1 && card.rows.every((r) => r.trim().length > 0), `${state}/${lang}`);
      assert.equal(card.rows.length, refresh ? 2 : 1);
      assert.equal(card.chips.length, 4);
      for (const s of [...card.rows, ...card.chips]) {
        assert.equal(parentLexiconHit(s), null, `${state}/${lang}: ${s}`);
        assert.ok(!STATE_WORDS.test(s), `${state}/${lang}: ${s}`);
        assert.ok(!/\{\w+\}/.test(s), `unfilled slot: ${s}`);
        assert.ok(!/ {2}/.test(s), `double space: ${s}`);
      }
      if (lang === "hi") for (const c of card.chips) assert.match(c, /[ऀ-ॿ]/, `a Hindi card's chips are in Hindi: ${c}`);
      n++;
    }
  }
  assert.equal(n, STATES.length * 3 * 2 * 2 * 2);
});

test("the English shallow row (the state after a first lesson) renders", () => {
  const card = conceptCard({ skillId: "k", state: "shallow", reasons: [] }, { concept: "x", lang: "en" });
  assert.match(card.rows[0], /Gets the answers on their own/);
});

test("days are counted in good English: 1 day, 3 days (the old card said '1 days')", () => {
  const one = conceptCard({ skillId: "k", state: "understood", reasons: reasons(1) }, { concept: "x", lang: "en" });
  assert.match(one.rows[0], /Still had it 1 day later/);
  const three = conceptCard({ skillId: "k", state: "understood", reasons: reasons(3.4) }, { concept: "x", lang: "en" });
  assert.match(three.rows[0], /Still had it 3 days later/);
  const hl = conceptCard({ skillId: "k", state: "understood", reasons: reasons(1) }, { concept: "x", lang: "hinglish" });
  assert.match(hl.rows[0], /^1 din baad/);
});

test("the card wording changes as the state rises (what w1c-three-day asserts on production)", () => {
  const rows = STATES.map((state) => conceptCard({ skillId: "k", state, reasons: reasons(3) }, { concept: "x", lang: "en" }).rows[0]);
  assert.equal(new Set(rows.slice(1, 4)).size, 3, "shallow, fragile and understood read differently");
});
