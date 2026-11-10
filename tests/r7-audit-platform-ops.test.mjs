// Whole-project audit 2026-11-09, platform (PLAT-14, PLAT-42): the owner's ops page.
// PLAT-14: POST /api/trace/batch is open to anonymous pages and keeps any client `kind` (only `src` is forced to
// "client"), while the ops queries read `kind = 'srv.res'` with no `src`: one anonymous batch could add a fake live
// lesson, a 5xx and a latency sample. PLAT-42: cost per lesson-minute divided the costed lessons' $ by the minutes of
// every lesson, costed or not.
import { test } from "node:test";
import assert from "node:assert/strict";
import { opsSummary } from "../server/ops/routes.js";
import { clientRow } from "../server/trace/routes.js";

test("PLAT-14: every trace_event query on the ops page reads server rows only, and a client srv.res row is src client", async () => {
  const seen = [];
  await opsSummary(async (text) => {
    seen.push(text);
    if (/percentile/.test(text)) return [{ n: 0, p50: null, p90: null, errors: 0 }];
    if (/from lesson where/.test(text)) return [{ lessons: 0, usd: 0, minutes: 0, uncosted: 0, costed_minutes: 0 }];
    return [];
  });
  const traceQs = seen.filter((t) => /from trace_event/.test(t));
  assert.equal(traceQs.length, 3);
  for (const t of traceQs) assert.match(t, /src = 'server'/, t.slice(0, 80));
  const forged = clientRow({ kind: "srv.res", t: Date.now(), sid: "77c54fb8-0000-4000-8000-000000000000", data: { route: "POST /api/lesson/turn", status: 500, ms: 1 } }, { pid: "page-123456" });
  assert.equal(forged.src, "client", "a client row can never pass the src = 'server' filter");
});

test("PLAT-42: cost per lesson-minute divides by the costed lessons' minutes only", async () => {
  const s = await opsSummary(async (text) => {
    if (/percentile/.test(text)) return [{ n: 0, p50: null, p90: null, errors: 0 }];
    // 2 lessons: one costed (10 min, $0.30), one not (30 min)
    if (/from lesson where/.test(text)) return [{ lessons: 2, usd: 0.3, minutes: 40, uncosted: 1, costed_minutes: 10 }];
    return [];
  });
  assert.equal(s.cost.usdPerMin, 0.03);
  const none = await opsSummary(async (text) => (/percentile/.test(text) ? [{ n: 0, p50: null, p90: null, errors: 0 }]
    : /from lesson where/.test(text) ? [{ lessons: 1, usd: 0, minutes: 5, uncosted: 1, costed_minutes: 0 }] : []));
  assert.equal(none.cost.usdPerMin, null);
});
