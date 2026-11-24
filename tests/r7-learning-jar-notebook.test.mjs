// Round 7 F (App app-notebook-log): GET /api/child/jar's read. Waiting items oldest first, then up to 10 answered ones
// newest first with their answered date; a missing table or read error is an empty page, never a 500.
import { test } from "node:test";
import assert from "node:assert/strict";
import { jarNotebook } from "../server/learner/jar.js";
import { routes } from "../server/routes/child.js";

const rows = [
  { id: "a", topic: "Why is the sky blue", share: false, subject: "science", created_at: "2026-11-01T10:00:00Z", answered_at: null },
  { id: "b", topic: "My dog Tommy", share: true, subject: null, created_at: "2026-11-02T10:00:00Z", answered_at: null },
  { id: "c", topic: "Do fractions go below zero", share: false, subject: "maths", created_at: "2026-10-20T10:00:00Z", answered_at: "2026-10-22T10:00:00Z" },
];

test("jarNotebook: waiting first (oldest first), then answered (newest first) with the answered date", async () => {
  const seen = [];
  const q = async (t, p) => {
    seen.push(p);
    return /answered_at is null/.test(t) ? rows.filter((r) => !r.answered_at) : rows.filter((r) => r.answered_at);
  };
  const items = await jarNotebook("kid", { q });
  assert.deepEqual(items.map((i) => [i.id, i.state]), [["a", "waiting"], ["b", "waiting"], ["c", "answered"]]);
  assert.equal(items[2].answeredAt, "2026-10-22T10:00:00.000Z");
  assert.equal(items[1].share, true);
  assert.equal(items[0].subject, "science");
  assert.ok(!("learning" in items[0]) && !("count" in items[0]));
  assert.equal(seen[1][1], 10, "at most 10 answered");
});

test("jarNotebook: no table → an empty page; the route is registered", async () => {
  assert.deepEqual(await jarNotebook("kid", { q: async () => { throw new Error("relation does not exist"); } }), []);
  assert.equal(typeof routes["GET /api/child/jar"], "function");
});
