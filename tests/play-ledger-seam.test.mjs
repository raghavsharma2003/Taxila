// Patch 02 (docs/design/round3/play/patches/02-ledger-game-never-the-check.diff): a game act moves pL at the game weight
// but is never the delayed check, never spends it and never sets "unaided" (DESIGN.md §8; in-game-success-as-mastery).
// On HEAD without the patch the first case fails: a correct play level 2 days later became the delayed check.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger } from "../server/learner/kt/ledger.js";

const SK = "c6-maths-ch05-t04-s1";
const H = 3600_000, DAY = 24 * H, D2 = 2 * DAY;
const T0 = Date.UTC(2026, 9, 1, 4, 30);   // 10:00 IST
let n = 0;
function session(sid, t, specs) {
  const startAt = new Date(t).toISOString();
  return specs.map((o) => ({ id: `${sid}-${++n}`, seq: n, sessionId: sid, sessionStartAt: startAt, at: startAt, episodeId: o.episodeId ?? `${sid}-ep${n}`,
    skillIds: [SK], itemKey: "k", cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T1", ...o }));
}
const C0 = {}, WHY = { cls: "probe.why", outcome: 0, grader: "llm" };
const L0 = () => newLedger({ childId: "c", classLevel: 6 });
const at = (L) => L.skills[SK];
const GAME = (key) => ({ via: "game", itemKey: `play:${key}`, episodeId: `play:${key}` });

describe("ledger: a game act is never the delayed check", () => {
  const L1 = fold(L0(), session("A", T0, [C0, C0, C0, C0, WHY, C0]));
  it("setup: learned today, anchored (sanity)", () => assert.equal(at(L1).display, "learned_today"));
  it("a correct play level 2 days later neither counts as the check nor spends it; the bare item after it counts", () => {
    const afterGame = fold(L1, session("B", T0 + D2, [GAME("L1")]));
    assert.equal(at(afterGame).flags.delayed, false, "a game act became the delayed check");
    assert.equal(at(afterGame).display, "learned_today");
    const afterItem = fold(afterGame, session("B", T0 + D2, [{ itemKey: "k-new" }]));
    assert.equal(at(afterItem).display, "mastered", "the bare item after the game act must still be the check");
    assert.equal(at(afterItem).flags.delayed, true);
  });
  it("a wrong play level 2 days later is not a delayed miss", () => {
    const g = fold(L1, session("C", T0 + D2, [{ ...GAME("L2"), outcome: 4 }]));
    assert.equal(at(g).delayedMisses, 0);
    assert.equal(at(g).refresh, false);
  });
  it("game acts alone never set unaided, so never reach learned_today", () => {
    const L = fold(L0(), session("G", T0, [GAME("a"), GAME("b"), GAME("c"), GAME("d"), WHY, GAME("e")]));
    assert.equal(at(L).flags.unaided, false);
    assert.equal(at(L).display, "practising");
  });
});
