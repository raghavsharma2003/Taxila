// Round 7, stream G: the owner ops page. Who may see it, and the summary's shape (fake query: no DB).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { opsAllowed, opsSummary, routes } from "../server/ops/routes.js";

test("opsAllowed: TAXILA_OPS_FOR by email or its sha256, case-insensitive; empty list or no email → nobody", () => {
  const h = createHash("sha256").update("owner@example.test").digest("hex");
  assert.equal(opsAllowed("Owner@Example.test", { TAXILA_OPS_FOR: "owner@example.test" }), true);
  assert.equal(opsAllowed("owner@example.test", { TAXILA_OPS_FOR: ` x@y.z , ${h.toUpperCase()} ` }), true);
  assert.equal(opsAllowed("someone@example.test", { TAXILA_OPS_FOR: h }), false);
  assert.equal(opsAllowed("owner@example.test", {}), false);
  assert.equal(opsAllowed("", { TAXILA_OPS_FOR: "," }), false);
});

test("routes: the page and the summary answer 404 to anyone not signed in (no hint the page exists)", async () => {
  for (const key of ["GET /api/ops", "GET /api/ops/summary"]) {
    const req = { url: key.split(" ")[1], headers: {} };
    await assert.rejects(routes[key](req, {}), (e) => e.status === 404, key);
  }
});

test("opsSummary: live list carries an id prefix only; percentiles rounded; cost per minute from costed lessons", async () => {
  const now = Date.now();
  const q = async (text, params) => {
    if (/group by sid/.test(text)) return [{ sid: "77c54fb8-0000-4000-8000-000000000000", first: new Date(now - 180_000).toISOString(), last: new Date(now - 20_000).toISOString(), calls: 10 }];
    if (/percentile_cont/.test(text)) { assert.deepEqual(params, [24, "POST /api/lesson/turn"]); return [{ n: 10, p50: 1350.4, p90: 1709.6, errors: 1 }]; }
    if (/status'\)::int >= 500/.test(text) && /group by 1/.test(text)) return [{ route: "POST /api/lesson/turn", n: 1 }];
    if (/jsonb_each/.test(text)) return [{ meter: "stt", usd: 0.34 }, { meter: "chat", usd: 0.01 }];
    if (/from lesson where ended_at/.test(text)) return [{ lessons: 2, usd: 0.45, minutes: 20, uncosted: 1 }];
    throw new Error("unexpected " + text.slice(0, 40));
  };
  const s = await opsSummary(q, { hours: "24" });
  assert.deepEqual(s.live.list, [{ id: "77c54fb8", minutes: 2.7, calls: 10, lastSecAgo: 20 }]);
  assert.deepEqual(s.turn, { n: 10, p50: 1350, p90: 1710, errors: 1 });
  assert.equal(s.cost.usdPerMin, 0.0225);
  assert.deepEqual(s.cost.meters, { stt: 0.34, chat: 0.01 });
  assert.equal(JSON.stringify(s).includes("77c54fb8-"), false, "never the full lesson id");
  assert.equal((await opsSummary(async (t) => (/percentile/.test(t) ? [{ n: 0, p50: null, p90: null, errors: 0 }] : /from lesson where/.test(t) ? [{ lessons: 0, usd: 0, minutes: 0, uncosted: 0 }] : []), { hours: 9999 })).hours, 168);
});
