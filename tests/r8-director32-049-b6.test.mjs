// to-brain 049 B6 (docs/patches/to-brain/049-director32-hindi-pictures-own-reason.md, carried from 047): each bullet's predicate pinned on
// the director32 rows (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-23-director32, 0-based rows into `director`),
// replayed with that run's own script snapshot, and the walk's rule pinned where it can be in a unit.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { flagged } from "./r8-director32-049.test.mjs";
import { VPC_MAX, L2_CAP } from "../server/director/state.js";

// (re-pinned for to-brain 049 and main's ruling of 2026-11-23: as built at 65 the split ended its first part on a check-in straight after a
// right answer — 39 split turns in the 24 dry lessons. Such a turn is said whole up to 70; above 70 it splits at the point and its first
// part ends on a go-on statement, never a check-in)
describe("B6.1: a turn of verdict, reason, point and card is said whole up to 70 words; over it, split at the point on a go-on statement", () => {
  test("vpcUnlisted is gated above 70, vpcWhole (66 to 70 said whole) counted, splitEndsOnCheckin gated; the walk's limit is 70", () => {
    assert.ok(PREDICATES.vpcUnlisted && !PENDING.has("vpcUnlisted"));
    assert.ok(PREDICATES.vpcWhole && PENDING.has("vpcWhole"));
    assert.ok(PREDICATES.splitEndsOnCheckin && !PENDING.has("splitEndsOnCheckin"));
    assert.equal(VPC_MAX, 70); assert.equal(L2_CAP, 75);
  });
  // (the order's director32 rows are all 66 to 70 words: under the ruling each is said whole — vpcWhole counts them, vpcUnlisted no more)
  test("the director32 rows (c4 steady 86; c5-t01 steady 14, offtopic 12, steering 26; c5-t03 steady 6, stuck 10, offtopic 8) are vpcWhole's", () => {
    const rows = [["steady", "c4", 86], ["steady", "c5t01", 14], ["offtopic", "c5t01", 12], ["steering", "c5t01", 26], ["steady", "c5t03", 6], ["stuck", "c5t03", 10], ["offtopic", "c5t03", 8]];
    for (const [p, t, n] of rows) assert.ok(flagged(p, t, "vpcWhole").has(n) && !flagged(p, t, "vpcUnlisted").has(n), `${p} ${t} ${n}`);
  });
  test("splitEndsOnCheckin reads a vpc split ending on a question, and not one ending on a statement", () => {
    const L = { rows: [] };
    assert.ok(PREDICATES.splitEndsOnCheckin(L, { who: "teacher", noFit: "vpc", text: "Haan, sahi hai, kyunki 4 gap hain. Yahan tak theek hai?" }));
    assert.equal(PREDICATES.splitEndsOnCheckin(L, { who: "teacher", noFit: "vpc", text: "Haan, sahi hai, kyunki 4 gap hain. Theek hai, ab agli baat dekhte hain." }), null);
  });
  test("the go-on joint after a right answer is a statement: no consolation, no question named, no promise; none, no split", async () => {
    const { goOnPlain } = await import("../server/director/help.js");
    const { readFileSync } = await import("node:fs");
    const sc = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));
    for (let n = 0; n < 4; n++) {
      const j = goOnPlain(sc("c4-maths-ch05-t01"), { n });
      assert.ok(j?.text && !/koi baat nahi|sawaal|dobara|phir aayenge/i.test(j.text), j?.text);
    }
    // (c6-ch07's every form promises — "phir aayenge", "dobara", "phir milegi": the turn is not split)
    assert.equal(goOnPlain(sc("c6-maths-ch07-t01")), null);
    // (at a give-up a consolation is fine; a question named or a promise is not)
    const g = goOnPlain(sc("c6-maths-ch06-t01"), { consolation: true, n: 0 });
    assert.ok(g && !/sawaal|yahin rakh/i.test(g.text));
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
  // (main's ruling of 2026-11-23: "Suno," took "Dekho,"'s place — the lead-in openers together at most four, none more than three, never two
  // within four of her turns)
  test("the lead-in openers together: at most four a lesson, none within four turns of any other", async () => {
    const { rightWhyLead, LEAD_MAX } = await import("../server/brain/say.js");
    assert.equal(LEAD_MAX, 4);
    const lead = (st) => rightWhyLead("Sahi jawab", "4 gap hain", st).text;
    assert.doesNotMatch(lead({ whyJoint: { n: 0, last: 0 }, dekhoN: 2, jointN: { leadSuno: 2 } }), /Dekho,|Suno,/);
    assert.doesNotMatch(lead({ whyJoint: { n: 0, last: 0 }, dekhoN: 0, recent: [{ who: "teacher", text: "Achha. Suno, yeh." }, { who: "child", text: "haan" }] }), /Dekho,|Suno,/);
    assert.match(lead({ whyJoint: { n: 0, last: 0 }, dekhoN: 3, jointN: { leadSuno: 0 } }), /\. Suno, 4 gap/);
    const L = { rows: [{ who: "teacher", text: "Haan. Suno, a." }, { who: "teacher", text: "b" }, { who: "teacher", text: "Haan. Dekho, c." }] };
    assert.ok(PREDICATES.dekhoOver(L, L.rows[2], 2));
  });
});

describe("B6.3: the return uses what the child said", () => {
  // (re-pinned for to-brain 049 and main's ruling of 2026-11-23: built in brain/say.js — returnQuestion, honestTasteLine, againInHerWords —
  // and gated; it still reads its director32 rows)
  test("returnAsksAgain is gated", () => { assert.ok(PREDICATES.returnAsksAgain && !PENDING.has("returnAsksAgain")); });
  test("the return does not ask what the aside told; \"yeh tumne bataya tha\" only of what was told before", async () => {
    const { returnQuestion, againInHerWords, honestTasteLine, toldOf } = await import("../server/brain/say.js");
    assert.equal(toldOf("cricket", "kal maine cricket khela, sixer maara"), "sixer");
    const q = returnQuestion("cricket", "hinglish", null, { said: "kal maine cricket khela, sixer maara" });
    assert.doesNotMatch(q, /sabse achha|kyun pasand|kya cheez|thoda aur batao|kya bata rahe the|baare mein batao|favourite/i);
    assert.doesNotMatch(honestTasteLine("Virat", "hinglish", 1, [], true), /sabse achha|favourite/i);
    // (heard first on the child's turn just before: no "yeh tumne bataya tha")
    const st = { recent: [{ who: "child", text: "mujhe cricket pasand hai" }, { who: "teacher", text: "Achha." }, { who: "child", text: "kal sixer maara" }] };
    assert.doesNotMatch(String(againInHerWords("kal sixer maara", "cricket", "hinglish", st) ?? ""), /tumne bataya tha/);
  });
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
  // (to-brain 053 B1: the FIRST give-up there gets help and the check-in again; the second goes on — this reads the second)
  test("a second give-up at a bridge's check-in goes on led by the go-on joint (afterKeyGoOn)", async () => {
    const { pickHelp } = await import("../server/director/help.js");
    const { readFileSync } = await import("node:fs");
    const script = JSON.parse(readFileSync(new URL("../data/lesson-scripts/c5-maths-ch02-t03.json", import.meta.url), "utf8"));
    const d = pickHelp({ script, part: `${script.skills[0].skillId}:bridge`, request: "give_up", said: [], bridgeAgain: true });
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
