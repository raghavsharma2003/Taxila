// shared/learner.ts constants equal the server's runtime twins (one table each, LEARNER-MODEL §3, LM18).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../shared/learner.ts";
import { BANDS, bandsFor } from "../server/learner/bands.js";
import { OUTCOMES } from "../server/learner/kt/outcomes.js";
import { LEGAL_MODES } from "../server/learner/mode.js";
import { ageBandFor } from "../server/learner/model.js";

test("BANDS: one table, every class maps to exactly one value per view; ageBandFor = BANDS[c].contract", () => {
  assert.deepEqual(S.BANDS, BANDS);
  for (let c = 1; c <= 9; c++) {
    const b = bandsFor(c);
    assert.ok(["B1", "B2", "B3", "B4"].includes(b.b4) && ["A", "B", "C"].includes(b.b3));
    assert.equal(ageBandFor(c), b.contract);
  }
  assert.throws(() => bandsFor(10));
});

test("OUTCOMES and LEGAL_MODES match", () => {
  assert.deepEqual(S.OUTCOMES, OUTCOMES);
  assert.deepEqual([...S.LEGAL_MODES], [...LEGAL_MODES]);
});
