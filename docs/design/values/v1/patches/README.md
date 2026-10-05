# V1 patches: apply notes

Every patch was written against a **temp copy** of the working tree, taken on 2026-10-05 between 08:00 and 08:45Z while
Wave 2 was merging. Each one was then measured by running the V1 harnesses on that copy. None of them has been applied
to the main tree.

Apply from the repo root with `patch -p1 < <file>`, **in the order below**. If Wave 2 moved a hunk, rebase it by its
context lines. Then run the gates (`npx tsc -b && npx vite build && npm test`) and the two harnesses:
- `evals/grading-truth/run.mjs`, with `--model 420` for the model leg;
- `evals/mastery-calibration/sim.mjs` followed by `analyze.mjs`.

Report the numbers next to the ones in REPORT.md.

## Grading truth (V1.1)

**Base:** owner-truth patches 01-04 applied (`evals/owner-truth/patches/`).

| patch | files | what it changes | measured (evals/grading-truth, seed 7, 2026-10-05) |
|---|---|---|---|
| `V1-01-engine-recheck-real-shape.diff` | new `server/director/recheck.js`; `server/director/modules.js` | Re-grades a bound engine answer from the **nested act** (`data.value = { kind, … }`) on the server's params, using the engine's own `.logic.ts`. Kinds it cannot recompute give **no evidence**, never the claim. Supersedes owner-truth 01's `recheckValue`, which reads top-level fields that the frame protocol never sends. | Real frame-protocol events with honest and forged claims, n = 252. Wrong grades: 126 at baseline, 126 with owner-truth 01, **0** with V1-01. There are 8 abstentions: kinds whose event carries no raw act. |
| `V1-02-classify-numbers-negation-parts.diff` | new `server/grading/spoken-number.js`, new `server/content/parts.js`; `server/director/classify.js` | One number reader. A numeric key is graded **by value in code**: one number equal to the key is correct; a different number may never be "key"; two numbers with no correction are no evidence; a self-correction takes the last number. Exact matching keeps the sign and the decimal point. Acceptable entries follow the parts data: partial is partial and wrong is not credited. Multi-part comes from the parts data, never from commas: patch 04's `multiPartKey` is kept but no longer used. The model reports `parts_present` and code decides key or partial. A denial rule goes last in the rubric ("X nahi" is never the key). | Deterministic path, n = 25,385: 1,294 wrong grades at baseline, 1,294 with owner-truth 01-04, **0** with V1-02 (read the circularity note in V1-05). Model leg on deferred cases (real `classify()` on taxila-fast; final run, 6 buckets of up to 100; weak-truth rows excluded): baseline 145/517 (28.0%), owner-truth 01-04 91/517 (17.6%), V1 **18/336 (5.4%)**. 16 of V1's 18 are on rater-labelled partial answers (11 credited, 5 marked incorrect), down from 99/100 at baseline and 45/100 with 01-04. The numeric and negation buckets fall to 0, because V1 decides most of those in code before any model call. |
| `V1-03-placement-one-number-reader.diff` | `server/placement/grade.js` | Placement uses the same reader. The old word parser returned a **different number** for a phrase it half-understood. | n = 1,734: 34 wrong grades at baseline, **0** with V1-03. Uncredited right answers fall from 250 to 123. |
| `V1-04-studio-frame-stamps-item.diff` | `src/studio/kit/runtime.ts`, `src/studio/StudioFrame.tsx` | The frame runtime reads the seam's `data-item` and sends it with every answer, so the host grades against the item the child SAW. | studio.w2h, n = 853: all 5 wrong grades (a wrong try told "right") were answers with no item id. With the id stamped there were 0 in the same run. Removing the host's closed-item fallback instead would have cost 36 false fails on restarts that arrived without a mount key, so that alternative was rejected. |
| `V1-05-kits-parts-data.md` | `data/kits-parts.json` (data job, RS-6) | The required parts and acceptable labels per item: two raters plus human adjudication. | See the file. |
| `V1-06-comprehension-rkey-numbers-negation.diff` | `server/comprehension/grade/ops.js` | R-KEY uses the one reader and rejects a denied key. This path is dormant today (no live route calls `rKey`); fix it before anything does. | n = 399: 167 wrong grades at baseline (162 of them negated keys credited), **0** with V1-06. |

## Moving on and mastery (V1.3, V1.4)

**Base:** the working tree, with no owner-truth patches needed.

| patch | files | what it changes |
|---|---|---|
| `V1-10-ledger-secure-needs-2-days-and-new-item.diff` | `server/learner/kt/ledger.js`, `server/learner/live.js` | A delayed check counts only if it is at least **2 learning days** after the anchor (it was 20 h) and on an item the skill **was never answered on**. The ledger keeps `skill.items`, at most 40, so `ledgerDigest` changes: replay `kt_evidence` once after deploy. The 20 h `DELAY_MS` stays as the earliest FSRS review. |
| `V1-11-check-item-new-form.diff` | new `server/learner/checks.js`; `server/director/items.js` | Each skill with 2 or more check-kind items holds one **check reserve** out of practice; a near transfer is preferred. The session opener picks an unseen item at or above the difficulty the child has already met, reserve first. No unseen item means no check that session. |
| `V1-11b-lesson-start-uses-checks.diff` | `server/routes/lesson.js` | The lesson start uses `checks.js` (the old `warmupItemsFor` always took the easiest retrieval item). |
| `V1-12-pace-advance-and-park.diff` | `server/director/state.js`, `server/director/items.js` | Per-skill pace in the lesson. After an unaided first-try right answer with pKnown ≥ 0.85, the hardest remaining item comes next. 2 in a row with pKnown ≥ 0.9 settles the skill for the lesson. 2 misses in a row give the gentlest item. 7 answers with no run of 3 **park** the skill, and the engine re-teaches it next lesson. When every skill is settled or parked, practice is done. |

What these do in the simulator is in REPORT.md. One of the findings there is that V1-10/11 alone do NOT bring false
mastery under 2%. V1.3 also needs content (new-form items per skill) and a stronger certification rule; both are listed
as open.

## Tests to add with the patches (not written: `tests/` is outside this stream's paths)

- `tests/grading-truth.test.mjs`: run `evals/grading-truth/run.mjs --scale 0.2` and assert 0 wrong grades on every
  deterministic grader. Use `--model 0`; the model leg stays an eval, not a unit test.
- `tests/recheck.test.mjs`: for every `RECHECKABLE` engine and kind, a real `parseModuleToHost → toModuleEvent` event,
  with honest and forged claims.
- `tests/spoken-number.test.mjs`: the 59 reader cases listed in REPORT.md §3.2.
- `tests/learner-check-novel.test.mjs`: a repeated item on day +2 is not a check; a new item on day +1 is not a check; a
  new item on day +2 is.

## Existing tests these patches break on purpose (update them in the same change)

The node test suite ran on temp copies before and after the patches. These copies were partial, so failures caused by
missing `db/`, `vite.config` or the browser happen in both, and they are ignored here.

V1-10/11/12 newly fail 6 tests that encode the old rule:
- `tests/learner-kt.test.mjs` 146-150: "mastered needs a produce-form success ≥ 20 h after the anchor…", the C1/C2
  re-anchor, the delayed-miss demotion and durable. Each builds its delayed check 20 h later, often on the same item;
  re-target them to day +2 on a new item.
- `tests/comprehension-*.test.mjs` 18: "the understander reaches understood only after a delayed check + far transfer"
  uses a 20 h check.

That these fail is the point of the change. The tests must be rewritten to the V1.3 rule, never the rule rolled back.

---

## Review v1 (2026-10-05, ~10:20-11:15Z): apply THIS order on the integrated tree

The table above was measured on 08:00-08:45Z copies. On the tree as it stood at ~10:20Z (Wave 2 + Day-0 owner-truth
01-10 merged), three of the patches above do not apply, and V1-02 as written breaks the model leg. Use this series
instead (verified: applied in this order to a fresh copy of the integrated tree, it reproduces the reviewed tree byte for
byte):

1. `V1-01-engine-recheck-real-shape.diff` (unchanged)
2. `V1-02r-classify-rebased-on-integrated-tree.diff` (replaces V1-02: the import hunk failed against W2-E's `requestOf` import)
3. `V1-03-placement-one-number-reader.diff`, `V1-04-studio-frame-stamps-item.diff`, `V1-06-comprehension-rkey-numbers-negation.diff` (unchanged)
4. `V1-10-ledger-secure-needs-2-days-and-new-item.diff` (unchanged)
5. `src/server/learner/checks.js` → `server/learner/checks.js` (the new-file part of V1-11), then
   `V1-11r-12r-items-rebased-on-integrated-tree.diff` (replaces the items.js hunks of BOTH V1-11 and V1-12: RS-6's
   `buildF0Queue` must skip the reserve too)
6. `V1-11b-lesson-start-uses-checks.diff` (unchanged), `V1-12r-state-only.diff` (the state.js part of V1-12)
7. `V1-02c-review-units-words-apostrophe-model-scope.diff` (review fixes, below)
8. `V1-04b-review-sequence-honours-item.diff` and `V1-04c-review-sequence-seam-data-item.diff` (below)

What the review patches fix (all measured with `evals/grading-truth/run.mjs`, seeds 7/13/29, SYNTHETIC answers):

| defect in V1 as built | evidence | fix |
|---|---|---|
| **V1-02 crashes every model call on the integrated tree.** W2-E moved the model call into `classifyModel()`; V1-02's `fast.numericMismatch` became a free variable, so each call threw `fast is not defined`, the answer earned `no_evidence`, and the model's `wants_to_stop` flag was lost ("didi ab mera mann nahi hai" → stop flag false). | tests/classify.test.mjs "calls taxila-fast…" (2 calls, not 1) and "model flags merge in…" fail on the V1 tree; pass after V1-02c | `fast` is passed into `classifyModel` |
| **By-value grading credits the right number in the wrong unit.** "5 dm" for "5 cm", "24 sq m" for "24 m", "500 kg" for "500 g" | 183/183 unit-swap cases credited on the V1 tree | unit read after a number; a different unit defers to the model and the model may not call it the key (`unit_mismatch`) |
| **By-value grading credits a different counted thing or a different meaning.** "8 p.m." for "8 a.m." (the question asks a.m. or p.m.), "320 CE" for "320 BCE coin", "3 faces" for "3 edges", "3 tens" for "3 hundreds", "21 December" for "21 June", "24 °F" for "24 °C", bare "4" for "4 lakh". Today's tree sends all of these to the model; V1-02 made them code-credited. The battery could not see this: its oracle reads no key with words after the number, so 446 such keys were only probed as text. | new battery family `numnoun:*` (oracle-side word lists): V1 as built 13+ false credits per seed; 0 after | keys whose words decide what the number is are not plain numbers (`DISCRIM`); for count keys every word after the number must be a filler or the key's own word (`tailAgrees`); a sign the key does not have is never the key (`signConflict`); a bare leading number of such a key is at most partial (`bareOfDecisive`) |
| **Apostrophe placement credited.** `norm()` drops apostrophes, so "soldiers'" matched "soldier's" | `text-wrong:apostrophe-moved` | exact match must put apostrophes in the same place |
| **Studio sequence ignores the item the frame names.** | `--studio-stamp all`: sequence wrong tries still told right | V1-04b |
| **V1-04 cannot stamp sequence_steps at all.** The runtime stamps the first `[data-item]`; only shade_fraction and number_line_jump declare that seam. | `--studio-stamp seam` (what V1-04 really delivers): 2-6 wrong tries told "right" per seed, all sequence_steps | V1-04c adds the seam line. NOT measured end to end: needs regenerated builds and the QA player to check it |

Tests these patches break and that the build report did not list (beyond learner-kt 146-150 and comprehension 18):
- `tests/owner-truth-guards.test.mjs` F1 (asserts patch 01's flat-shape recheck; superseded by V1-01: rewrite on `parseModuleToHost → toModuleEvent` events) and F5 (asserts `multiPartKey`; superseded by the parts data);
- `tests/lesson-truth.test.mjs` G-SAY-1 fails once V1-11's items.js holds the reserve item out of practice: the fixture
  reaches a different practice item and the "screen" guard is not triggered. Not diagnosed further: re-target the
  fixture to an item with no chips and no module, then confirm the guard still fires.
