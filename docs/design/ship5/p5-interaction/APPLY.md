# p5-interaction — apply order

Base: HEAD 8006902. Nothing here is committed. The series was verified by `mkpatches.sh` (in the session scratchpad).
That script applies everything below to a fresh `git archive 8006902` copy and checks that the result matches the
tested work tree byte for byte. It does.

## 0. Prerequisite: the V1 series (docs/design/values/v1/patches), minus V1-01

Apply these in this order:

1. V1-02r-classify-rebased-on-integrated-tree
2. V1-03-placement-one-number-reader
3. V1-04-studio-frame-stamps-item
4. V1-06-comprehension-rkey-numbers-negation
5. V1-10-ledger-secure-needs-2-days-and-new-item
6. `cp docs/design/values/v1/patches/src/server/learner/checks.js server/learner/checks.js`
7. V1-11r-12r-items-rebased-on-integrated-tree
8. V1-11b-lesson-start-uses-checks
9. V1-12r-state-only
10. V1-02c-review-units-words-apostrophe-model-scope
11. V1-04b-review-sequence-honours-item
12. V1-04c-review-sequence-seam-data-item

Patch 01 below replaces V1-01. Do not apply V1-01 itself.

## 1. New files (already in the tree, not patches)

- `server/conversation/flags.js`: the kill switches
- `server/conversation/lexicon.js`: whole-turn readings and answer modifiers
- `server/conversation/understand.js`: the CONVERSATION-V2 note model (Azure, hot lane; a 429 trips a 30 s breaker and returns null)
- `server/conversation/policy.js`: note → request mapping, plus the Later list (park, detour, return)
- `server/conversation/guards.js`: reply-shape helpers (bare, same, tidy, lead)
- `tests/p5-interaction-{director,conversation,recheck,reply,review}.test.mjs`: 41 tests
- `tests/prod/p5-interaction-acceptance.mjs`: live acceptance against a local server or prod

## 2. The patches, in order (each one passes `git apply --check` on top of the previous)

The series as a whole was verified. Patches 03 and 04 depend on 02, so do not apply a single patch from the middle on its own.

| # | patch | touches | proved by |
|---|---|---|---|
| 01 | 01-v1-01r-recheck-value | director/recheck.js (new), director/modules.js | tests/p5-interaction-recheck.test.mjs; owner-truth-guards F1 (rewritten in 07) |
| 02 | 02-classify-readings | director/classify.js | tests/p5-interaction-conversation.test.mjs; owner-requests |
| 03 | 03-director-steering-cardcap | director/state.js, director/shapes.js | tests/p5-interaction-director.test.mjs; state, compiler, kit-budget |
| 04 | 04-reply-guards | brain/say.js, director/say.js | tests/p5-interaction-reply.test.mjs; lesson-truth; persona-invariants |
| 05 | 05-turn-understand | brain/turn.js | tests/p5-interaction-conversation.test.mjs (settleWithin, applyNote) |
| 06 | 06-engine-catalog-patterns | shared/engine-catalog.js | tests/p5-interaction-recheck.test.mjs (growFits) |
| 07 | 07-tests-reconcile | existing tests and prod scripts | the full suite; see the reasons below |
| 08 | 08-review-opener-v1-3 | learner/live.js, learner/checks.js | tests/p5-interaction-review.test.mjs |
| 09 | 09-trace-reason-codes | brain/reasons.js | tests/p5-interaction-conversation.test.mjs (closed vocabulary); without it brain_trace silently dropped every request.* / conv2.* / p5.* / module.* code |

Why patch 07 changes existing tests:

- **owner-requests F8**: "can we talk about something else" is steering (owner rule), not a break. The test is
  reconciled to that rule and gains a kill-switch test.
- **state, compiler, learner-live**: the rung-4 ladder tests run with `TAXILA_P5_CARDCAP=off`, because the card cap
  now ends a question at its 4th pin. New capped-path tests are added.
- **lesson-truth G-PRAISE-1 and G-SAY-1**: the fixtures walk to a plain item.
- **owner-truth-guards F1**: rewritten for V1-01r, where a forged claim is rechecked by value.
- **learner-mastery and comprehension-engine**: updated for V1-10's 2-day / new-item rule.
- **Prod scripts**: owner-4 checks talk_else as steering; owner-1 reads the committed answer from `given[]`; w1c
  answers the teach-back and asserts the certifying check on a never-met item at +2 days.

## 3. Kill switches (default ON; `off`, `0`, `false` or `no` restores the HEAD path)

| env | what it turns off |
|---|---|
| TAXILA_P5 | everything below at once |
| TAXILA_P5_STEER | readings, teaching-phase steering, change_topic offering ways in, Later list |
| TAXILA_P5_CARDCAP | the 3-turn card cap |
| TAXILA_P5_GUARDS | the bare, same, thinkq and noconfirm reply guards, and the gutted-turn retry |
| TAXILA_P5_RECHECK | the value recheck of module answers (falls back to V1-02's claim path) |
| TAXILA_CONV2 | `on` (default): the note model routes non-answer turns; `shadow`: it only records; `off`: it never calls |

The note model never grades. Distress is OR-ed in and never subtracted. scanSafety and the distress read run on every
committed turn exactly as before. A note that times out (2.2 s), hits a 429 or comes back unusable falls through to
today's path without any visible change.

## 4. Measured results

The battery run directories (scored.json, disputes, score.txt and the scorer) are in `battery/`.

## 5. Gates after applying

`npx tsc -b && npx vite build && npm test`, plus `node evals/persona-invariants.mjs` (70/70). The kit-budget test must
stay green: patch 03's BRANCH_ASK_MAX keeps V1-12's long passages out of voice branches.
