// to-brain 049 B6 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, carried from 047): each bullet's predicate pinned on
// the director32 rows (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director32, 0-based rows into `director`),
// replayed with that run's own script snapshot, and the walk's rule pinned where it can be in a unit.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { flagged } from "./r8-director32-049.test.mjs";
import { VPC_MAX, L2_CAP } from "../server/director/state.js";

describe("B6.1: a turn of verdict, reason, point and card over 65 words is split at the point", () => {
  test("vpcUnlisted is gated, and the walk's limit is 65 under the 75 of a turn of parts", () => {
    assert.ok(PREDICATES.vpcUnlisted && !PENDING.has("vpcUnlisted"));
    assert.equal(VPC_MAX, 65); assert.equal(L2_CAP, 75);
  });
  test("vpcUnlisted reads director32 c4 steady 86; c5-t01 steady 14, offtopic 12, steering 26; c5-t03 steady 6, stuck 10, offtopic 8", () => {
    assert.ok(flagged("steady", "c4", "vpcUnlisted").has(86));
    for (const [p, n] of [["steady", 14], ["offtopic", 12], ["steering", 26]]) assert.ok(flagged(p, "c5t01", "vpcUnlisted").has(n), `${p} ${n}`);
    for (const [p, n] of [["steady", 6], ["stuck", 10], ["offtopic", 8]]) assert.ok(flagged(p, "c5t03", "vpcUnlisted").has(n), `${p} ${n}`);
  });
});

describe("B6.2: \"Dekho,\" at most three times a lesson, never within four of her turns", () => {
  test("dekhoOver is gated", () => { assert.ok(PREDICATES.dekhoOver && !PENDING.has("dekhoOver")); });
  test("dekhoOver reads every director32 steady lesson (8 to 10 there)", () => {
    for (const t of ["c4", "c5t01", "c5t02", "c5t03", "c6", "c6ch07", "c4ch01"]) assert.ok(flagged("steady", t, "dekhoOver").size >= 5, t);
  });
  test("the lead-in rotates its opener and says \"Dekho,\" only under the cap and four turns from the last", async () => {
    const { rightWhyLead, DEKHO_MAX } = await import("../server/brain/say.js");
    assert.equal(DEKHO_MAX, 3);
    // ("Sahi jawab" never takes the colon, and the last form was ", kyunki": the second form is the one left)
    const lead = (st) => rightWhyLead("Sahi jawab", "4 gap hain", st).text;
    assert.match(lead({ whyJoint: { n: 0, last: 0 }, dekhoN: 0 }), /\. Dekho, 4 gap/);
    assert.doesNotMatch(lead({ whyJoint: { n: 0, last: 0 }, dekhoN: 3 }), /Dekho/);
    assert.doesNotMatch(lead({ whyJoint: { n: 0, last: 0 }, dekhoN: 0, recent: [{ who: "teacher", text: "Achha. Dekho, yeh." }, { who: "child", text: "haan" }] }), /Dekho/);
  });
});

describe("B6.3: the return uses what the child said", () => {
  // (counted, not gated: the return's question and the "yeh tumne bataya tha" line are chosen in brain/say.js — returnQuestion,
  // againInHerWords — which this build does not touch; main's)
  test("returnAsksAgain is counted", () => { assert.ok(PREDICATES.returnAsksAgain && PENDING.has("returnAsksAgain")); });
  test("returnAsksAgain reads director32 c4 offtopic 56; c5-t01 steady 42, steering 38; c5-t03 offtopic 48; c6 steering 38; c4-ch01 offtopic 50", () => {
    assert.ok(flagged("offtopic", "c4", "returnAsksAgain").has(56));
    assert.ok(flagged("steady", "c5t01", "returnAsksAgain").has(42));
    assert.ok(flagged("steering", "c5t01", "returnAsksAgain").has(38));
    assert.ok(flagged("offtopic", "c5t03", "returnAsksAgain").has(48));
    assert.ok(flagged("steering", "c6", "returnAsksAgain").has(38));
    assert.ok(flagged("offtopic", "c4ch01", "returnAsksAgain").has(50));
  });
});

describe("B6.4: the greeting's start line is said only at the greeting", () => {
  test("startLineNotGreeting is gated and reads director32 c4 stuck 62, c5-t01 stuck 64, c6-ch07 stuck 64", () => {
    assert.ok(PREDICATES.startLineNotGreeting && !PENDING.has("startLineNotGreeting"));
    assert.ok(flagged("stuck", "c4", "startLineNotGreeting").has(62));
    assert.ok(flagged("stuck", "c5t01", "startLineNotGreeting").has(64));
    assert.ok(flagged("stuck", "c6ch07", "startLineNotGreeting").has(64));
    // (the start line after the greeting is its place: row 4 of stuck and steering)
    assert.ok(!flagged("stuck", "c4", "startLineNotGreeting").has(4));
  });
  test("a give-up at a bridge's check-in goes on led by the go-on joint (afterKeyGoOn)", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const { readFileSync } = await import("node:fs");
    const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c5-maths-ch02-t03.json", import.meta.url), "utf8"));
    const d = pickHelp({ script, part: `${script.skills[0].skillId}:bridge`, request: "give_up", said: [] });
    assert.equal(d?.card, "goOn");
    assert.equal(d?.joint?.kind, "afterKeyGoOn");
  });
});

describe("B6.5: a reason is not said in two turns running at a worked close", () => {
  test("reasonTwice is gated, reasonTwiceAuthored counted", () => {
    assert.ok(PREDICATES.reasonTwice && !PENDING.has("reasonTwice"));
    assert.ok(PREDICATES.reasonTwiceAuthored && PENDING.has("reasonTwiceAuthored"));
  });
  test("reasonTwice reads director32 c5-t03 steady 76, c6 steady 26, c6-ch07 steering 28; reasonTwiceAuthored c4 steady 90", () => {
    assert.ok(flagged("steady", "c5t03", "reasonTwice").has(76));
    assert.ok(flagged("steady", "c6", "reasonTwice").has(26));
    assert.ok(flagged("steering", "c6ch07", "reasonTwice").has(28));
    assert.ok(flagged("steady", "c4", "reasonTwiceAuthored").has(90));
  });
});

describe("B6.6 and B6.7: a key's check-in and the next card; nothing easier and a return", () => {
  test("keyCheckinBareCard is gated and reads director32 c5-t01 stuck 50, c6-ch07 offtopic 66", () => {
    assert.ok(PREDICATES.keyCheckinBareCard && !PENDING.has("keyCheckinBareCard"));
    assert.ok(flagged("stuck", "c5t01", "keyCheckinBareCard").has(50));
    assert.ok(flagged("offtopic", "c6ch07", "keyCheckinBareCard").has(66));
  });
  test("spentThenReturn is gated and reads director31 c4-ch01-t02 stuck 68 (047 R5's third bullet)", async () => {
    assert.ok(PREDICATES.spentThenReturn && !PENDING.has("spentThenReturn"));
    const { checkRun } = await import("../evals/hybrid-side-by-side/check-run.mjs");
    const run = new URL("./fixtures/eval-results/hybrid-side-by-side/results/2026-11-18-director31", import.meta.url).pathname;
    const rows = checkRun(run).filter((f) => f.predicate === "spentThenReturn").map((f) => `${f.lesson} ${f.row}`);
    assert.ok(rows.includes("stuck-c4-ch01-t02 68"), rows.join(", "));
  });
});
