// B1-A8 (PRODUCT-DESIGN-V2 §14): scripts/lint-ui.mjs finds 0 lamp tokens outside the dock, 0 raw hex outside
// tokens.css, 0 Devanagari in chrome strings and 0 placeholder strings in the B1-owned paths; every rule's negative
// control trips. (A bare `node scripts/lint-ui.mjs` reports the whole of src/, including other owners' files.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { B1_PATHS, lint, lintSource } from "../scripts/lint-ui.mjs";

test("lint-ui: 0 findings in the B1 paths (shell, tokens, the Desk, the lesson runtime, the picker copy)", () => {
  const f = lint({ paths: B1_PATHS });
  assert.deepEqual(f.map((x) => `${x.rule} ${x.file}:${x.line} ${x.text}`), []);
});

test("lint-ui negative controls: each rule trips on its own violation, and the dock is allowed the lamp", () => {
  const rules = (file, text) => lintSource(file, text).map((x) => x.rule);
  assert.deepEqual(rules("src/child/lesson/x.css", ".dk-tiles[data-lamp] { background: var(--lamp-wash); }"), ["L-LAMP"]);
  assert.deepEqual(rules("src/child/lesson/x.css", ".dk-dock[data-lamp] { background: var(--lamp-wash); }"), []);
  assert.deepEqual(rules("src/child/lesson/x.css", ".dk-card { color: #ffb21e; }"), ["L-HEX"]);
  assert.deepEqual(rules("src/styles/tokens.css", ":root { --nib: #1f3a8a; }"), []);
  assert.deepEqual(rules("src/child/lesson/X.tsx", 'const label = "अभ्यास";'), ["L-DEVA"]);
  // the speech marker exempts ONE string literal on its own line (b4 fixer: a marker on the line above, or on a line
  // with several literals, let chrome through)
  assert.deepEqual(rules("src/child/lesson/X.tsx", 'const said = "अभ्यास"; // lint-ui: speech'), []);
  assert.deepEqual(rules("src/child/lesson/X.tsx", '// lint-ui: speech\nconst said = "अभ्यास";'), ["L-DEVA"]);
  assert.deepEqual(rules("src/child/lesson/X.tsx", "<p>This activity is coming soon</p>"), ["L-HOLD"]);
  assert.deepEqual(rules("src/child/lesson/X.tsx", 'const t = "TODO";'), ["L-HOLD"]);
});
