// round 7 (C1 studio-board-timing): the board's sync telemetry is readable in production: GET /api/studio/timing returns
// this replica's lateness p50 / p90 and the board-first outcomes (numbers only), behind the operator key.
import { test } from "node:test";
import assert from "node:assert/strict";
import { noteWbTiming, wbTimingStats } from "../server/studio/seam.js";
import { routes } from "../server/routes/studio.js";

const res = () => { const r = { code: 0, body: null, headers: {} }; r.writeHead = (c, h) => { r.code = c; Object.assign(r.headers, h ?? {}); return r; }; r.setHeader = (k, v) => { r.headers[k] = v; }; r.end = (b) => { r.body = b; }; r.statusCode = 200; return r; };

test("wbTimingStats: lateness percentiles and board-first outcomes, numbers only", () => {
  for (const ms of [100, 300, 900]) noteWbTiming("L-t", { lateMs: ms, source: "exact" });
  const s = wbTimingStats();
  assert.ok(s.n >= 3); assert.equal(typeof s.p50, "number"); assert.equal(typeof s.p90, "number");
  assert.ok(s.boardFirst && typeof s.boardFirst.asks === "number" && typeof s.boardFirst.used === "number");
});

test("GET /api/studio/timing needs the operator key; with it, the stats", async () => {
  const prev = process.env.TAXILA_OPS_KEY;
  process.env.TAXILA_OPS_KEY = "k-test";
  try {
    const h = routes["GET /api/studio/timing"];
    assert.equal(typeof h, "function");
    const r1 = res(); await h({ headers: {} }, r1, {});
    assert.equal(r1.code || r1.statusCode, 403);
    const r2 = res(); await h({ headers: { "x-taxila-ops": "k-test" } }, r2, {});
    assert.equal(r2.code || r2.statusCode, 200);
    assert.ok(/"p50"/.test(String(r2.body)));
  } finally { if (prev === undefined) delete process.env.TAXILA_OPS_KEY; else process.env.TAXILA_OPS_KEY = prev; }
});
