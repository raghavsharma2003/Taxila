// Audit STUDIO-09 (2026-11-10): number-line-hop@1 was advertised (board-ref.js) for ranges it could not lay out — 897 of a
// random 2,000 inside "start -20..100, hops 1-4 non-zero -20..20" were refused (hop labels on one spot, landing numbers
// touching, the equation off the board). The template now refuses what does not lay out up front ("hops_layout") and
// board-ref advertises only the rest; the equation row is centred so negatives fit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { expand } from "../server/forge/explainer/templates.js";
import { BOARD_REFS } from "../server/forge/explainer/board-ref.js";

const hop = (start, hops) => expand({ template: "number-line-hop@1", start, hops });

test("number-line-hop@1: a sample of the advertised range lays out (≤ 0.5% refused by the lint), the rest is refused up front", () => {
  let seed = 11; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  let n = 0, bad = [];
  while (n < 3000) {
    const start = ri(-20, 100), len = ri(1, 4), dir = rnd() < 0.5 ? -1 : 1;
    let hops = Array.from({ length: len }, () => dir * ri(len > 1 ? 2 : 1, 20));
    if (len === 2 && rnd() < 0.3) hops = [hops[0], -Math.sign(hops[0]) * ri(2, Math.max(2, Math.floor(Math.abs(hops[0]) / 2)))];
    const land = hops.reduce((a, h) => [...a, a.at(-1) + h], [start]);
    const spread = Math.max(...land) - Math.min(...land);
    if (spread > 30 || (len > 1 && hops.some((h) => Math.abs(h) * (land.some((v) => String(v).length >= 3) ? 5 : 8) < spread)) || (len === 2 && hops[0] * hops[1] < 0 && Math.abs(hops[1]) * 2 > Math.abs(hops[0]))) continue;
    n++;
    const r = hop(start, hops);
    if (!r.ok) bad.push([start, hops, r.errors ?? r.error]);
  }
  assert.ok(bad.length <= n * 0.005, `${bad.length} of ${n} refused: ${JSON.stringify(bad.slice(0, 5))}`);
  for (const [s, h] of [[0, [1, -1]], [5, [6, -6]], [0, [12, 1]], [-20, [20, 20]], [3, [4, -2, 1]]]) assert.equal(hop(s, h).error ?? hop(s, h).errors?.[0], "hops_layout", JSON.stringify([s, h]));
  for (const [s, h] of [[3, [4, -2]], [2, [2, 4, 8]], [-20, [-2, -2, -2, -2]], [-2, [5]]]) assert.ok(hop(s, h).ok, JSON.stringify([s, h, hop(s, h).errors]));
  assert.match(BOARD_REFS["number-line-hop@1"].params, /within 30/);
});
