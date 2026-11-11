// Audit studio-01 (2026-11-10): shade-grid@1 with its row / column labels and a written fraction (her line names the grid
// and does not ask for the fraction) failed its own text-overlap lint for every grid of 2+ rows: the fraction's box starts
// ~35 units above its `at` row, so at y0 + H + 34 it sat on the "N rows" label. The claims board (claims-board.js) uses
// exactly this call (labels: true), so the board was refused and her line pointed at an empty screen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { expand } from "../server/forge/explainer/templates.js";

test("shade-grid@1: every rows x cols x block, labelled, fraction shown, expands and lints clean", () => {
  const bad = [];
  for (let rows = 1; rows <= 6; rows++) for (let cols = 1; cols <= 10; cols++) {
    if (rows * cols < 2) continue;
    for (let sr = 1; sr <= rows; sr++) for (let sc = 1; sc <= cols; sc++) for (const hideResult of [false, true]) {
      const r = expand({ template: "shade-grid@1", rows, cols, block: [sr, sc], labels: true, hideResult });
      if (!r.ok) bad.push(`${rows}x${cols} block ${sr}x${sc} hide=${hideResult}: ${r.errors[0]}`);
    }
  }
  assert.deepEqual(bad.slice(0, 5), [], `${bad.length} grids refused`);
});

test("shade-grid@1: the claims board's own call for '5 columns aur 3 rows, shaded hissa 2 columns aur 3 rows' draws", () => {
  const r = expand({ template: "shade-grid@1", rows: 3, cols: 5, block: [3, 2], labels: true, hideResult: false });
  assert.equal(r.ok, true, String(r.errors));
  const frac = r.script.ops.find((o) => o.id === "frac");
  assert.deepEqual(frac.rows, [["6"], ["15"]]);
});
