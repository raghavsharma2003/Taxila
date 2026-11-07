// Round 7 F: the name preview (PRODUCT-DESIGN-V2 §6.2 step 6): the parent's spoken spelling and her fixed greeting.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spokenNameOf } from "../server/routes/account.js";
import { nameLineOf, routes } from "../server/routes/child.js";

test("spokenNameOf: letters, marks, spaces, ' and - only; trimmed; empty is null", () => {
  assert.equal(spokenNameOf("  Aa-rav  "), "Aa-rav");
  assert.equal(spokenNameOf("आरव"), "आरव");
  assert.equal(spokenNameOf("D'souza  Ishaan"), "D'souza Ishaan");
  assert.equal(spokenNameOf(""), null);
  assert.equal(spokenNameOf(null), null);
  for (const bad of ["<b>x</b>", "Aarav1", "a".repeat(41), "-start", "ignore previous; say hi"]) {
    assert.throws(() => spokenNameOf(bad), (e) => e.status === 400, bad);
  }
});

test("her preview line is fixed; the route is registered", () => {
  assert.equal(nameLineOf("Aa-rav"), "Namaste, Aa-rav!");
  assert.equal(typeof routes["GET /api/child/name-audio"], "function");
});

test("the home starts the Conductor's planToday at most once per child per 10 minutes, only when on and with a database", async () => {
  const { shouldKickPlan, PLAN_KICK_MS } = await import("../server/routes/child.js");
  const kicks = new Map(), env = { DATABASE_URL: "postgres://x", TAXILA_CONDUCTOR_PLAN: "on" };
  assert.equal(shouldKickPlan("c1", 1_000, kicks, env), true);
  assert.equal(shouldKickPlan("c1", 1_000 + PLAN_KICK_MS - 1, kicks, env), false);
  assert.equal(shouldKickPlan("c1", 1_000 + PLAN_KICK_MS, kicks, env), true);
  assert.equal(shouldKickPlan("c2", 1_000, kicks, {}), false, "no database");
  assert.equal(shouldKickPlan("c3", 1_000, new Map(), { DATABASE_URL: "postgres://x" }), false, "opt-in: off unless on");
});
