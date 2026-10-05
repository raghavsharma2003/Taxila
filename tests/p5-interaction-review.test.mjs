// p5-interaction (w1c-three-day: "+1 day: the delayed check leads the next lesson", reconciled with VALUES-100 V1.3 / V1-10):
// a learned skill's opener is due 20 h after its anchor; before 2 learning days it is a REVIEW of an item the child met
// (never the check reserve, never certifying), from 2 days on it is the certifying check on an item never met (reserve
// first). Needs the V1 series and docs/design/ship5/p5-interaction/patches (APPLY.md). Real kit, no network, no DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, newLedger } from "../server/learner/kt/ledger.js";
import { dueForChecks } from "../server/learner/live.js";
import { warmupItemsFor } from "../server/learner/checks.js";
import { checkReserveIds } from "../server/director/items.js";
import { getKit } from "../server/content/index.js";

const SK = "c5-maths-ch01-t01-s1";
const H = 3600_000, DAY = 24 * H;
const T0 = Date.UTC(2026, 9, 1, 4, 30);   // 10:00 IST
let n = 0;
const session = (sid, t, specs) => specs.map((o) => ({ id: `${sid}-${++n}`, seq: n, sessionId: sid, sessionStartAt: new Date(t).toISOString(), at: new Date(t).toISOString(),
  episodeId: `${sid}-ep${n}`, skillIds: [SK], itemKey: "c5-maths-ch01-t01-i01", cls: "item.open", outcome: 0, grader: "code", graderVersion: "g", topicType: "T3", ...o }));
const C = (itemKey) => ({ itemKey }), WHY = { cls: "probe.why", outcome: 0, grader: "llm", itemKey: "c5-maths-ch01-t01-i04" };
const learned = () => fold(newLedger({ childId: "c", classLevel: 5 }),
  session("A", T0, [C("c5-maths-ch01-t01-i01"), C("c5-maths-ch01-t01-i02"), C("c5-maths-ch01-t01-i04"), C("c5-maths-ch01-t01-i01"), WHY, C("c5-maths-ch01-t01-i02")]));

test("a learned skill is due for its opener 20 h after the anchor (the next day), not before", () => {
  const L = learned();
  assert.equal(L.skills[SK].display, "learned_today");
  assert.ok(!dueForChecks(L, T0 + 10 * H).some((d) => d.skillId === SK), "10 h: not yet");
  assert.ok(dueForChecks(L, T0 + 21 * H).some((d) => d.skillId === SK), "the next day: due");
});

test("the +1 day opener is a review of an item the child met (never the reserve); from 2 learning days, the reserve / a new item", async () => {
  const L = learned();
  const kit = await getKit("c5-maths-ch01-t01", { generate: false });
  const reserve = checkReserveIds(kit);
  const [r1] = await warmupItemsFor([SK], { ledger: L, now: T0 + 21 * H });
  assert.ok(r1, "an opener item the next day");
  assert.equal(r1.review, true);
  assert.ok(L.skills[SK].items.includes(r1.id), `a met item (${r1.id})`);
  assert.ok(!reserve.has(r1.id), "never the check reserve");
  const [r2] = await warmupItemsFor([SK], { ledger: L, now: T0 + 2 * DAY });
  assert.ok(r2 && !r2.review, "2 learning days: the certifying check");
  assert.ok(!L.skills[SK].items.includes(r2.id), `an item never met (${r2.id})`);
  // and the ledger agrees: a right answer on the review item the next day does not certify; on the new item at +2 days it does
  const reviewed = fold(L, session("B", T0 + 21 * H, [C(r1.id)]));
  assert.equal(reviewed.skills[SK].display, "learned_today");
  const checked = fold(L, session("C", T0 + 2 * DAY, [C(r2.id)]));
  assert.equal(checked.skills[SK].display, "mastered");
});
