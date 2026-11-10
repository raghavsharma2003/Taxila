# knows-her: does she teach the child in front of her?

Round 8's aim as a test (`docs/design/round8/PLAN.md`): a child's lesson differs from another child's because of what is
known about each, and every difference names the fact that caused it.

**Date:** 2026-11-10. **n:** 4 pilot topics × 5 simulated children = 20 planned and walked lessons.
**Method:** deterministic. No model, no network, no database, a fixed clock (2026-11-10 10:00 IST). For each topic the eval
reads the lesson script (`data/lesson-scripts/`) and the kit (`data/kits/`), builds each child's plan with
`server/director/knows.js` `planFor`, and walks it with `walk.mjs`, a small pure model of the script walk in
`server/director/state.js` (warm-up, hook, beats, keyed cards, remediation, the last skill's ladder). The children are rules
over the topic, the same rule on every topic (`children.mjs`); all are invented.

Run: `node evals/knows-her/run.mjs` (prints the table; `--write` saves `results/<date>.json`). In the gate:
`tests/knows-her-eval.test.mjs`.

## The children

| child | record (simulated) | answers |
|---|---|---|
| new | nothing: no ledger, no brief, no interests | all right |
| meera | skill 1 mastered with a passed delayed check, its easy items answered; skill 2 practising; likes cricket; last came 12 days ago | all right |
| meeraForgot | Meera's record | misses skill 1's opening check |
| kabir | skill 1 practising; last lesson closed badly (brief, R1); a wheel-spinning skill with a prerequisite in an earlier topic (brief, R5), where the topic has one; one open mix-up (p 0.82), the target of a skill's later check; likes trains and drawing; came yesterday | misses that check (unclassified: its own remediation), and one other check where the classifier names another mix-up |
| player | never had a lesson; everything known came from games (`play:` evidence): skill 1 practising, skill 2 met, one mix-up the games showed (p 0.74); first week (brief, R15) | all right |

## What it checks (each must hold on every topic)

1. **The new child gets exactly the script's default**: an empty `because`, no choice changed, and the walked cards equal
   `defaultWalk` in order.
2. **At least four named differences between meera and kabir.** One difference per lesson slot whose applied records differ
   (K2's success-first and K7's gap opener fill the same slot, the warm-up's first card, so they count once). Each carries
   the learner fact and where it came from.
3. **Every walk is explained**: `assertWalkExplained` passes with the child's records.
4. **The predicate bites**: removing any applied record that changed the walk makes the same walk fail.
5. **K1's fallback is recorded**: meeraForgot gets a `compress_fallback` record and the full unit.
6. **The lesson reads what play taught**: the games-only child's lesson differs from the new child's in at least two named
   ways (it does: first card, and her mix-up's check asked first). Play alone never certifies a delayed check (the ledger
   rule), so it can never compress a skill.

## Result (2026-11-10)

PASS on all four topics.

| topic | named differences | which |
|---|---|---|
| c4-maths-ch05-t01 | 5 | compress (meera: skill 1 learned + delayed check) · first card (meera: 12-day gap; kabir: last lesson closed badly) · her mix-up's check first (kabir: open ledger mix-up) · remediation (kabir: the classifier's mix-up) · hook (kabir: drawing) |
| c5-maths-ch02-t01 | 6 | the same five · prerequisite check (kabir: wheel-spin, c4-maths-ch05-t01); hook is trains → vehicles |
| c5-maths-ch02-t02 | 6 | the same five · prerequisite check (kabir: c5-maths-ch02-t01) |
| c6-maths-ch06-t01 | 5 | the same five |

K3 as ruled by main (2026-11-10): the ledger changes what is ASKED (her open mix-up's check comes first among the skill's
checks), never what is remediated; remediation answers only the mix-up the classifier named on that answer, else the card's
authored target.

## What this does not show

- **The real walk.** `walk.mjs` models the walk; it is not `state.js`. Until the call sites land (round 8 part D), this
  shows what `planFor` decides and that a walk following it is explained, not that the product walks it. Part D adds a test
  that runs `step()` with a plan and applies the same predicate to the real moves.
- **The learner facts' inputs.** The records are given as fixtures in the shape `knows.js`'s header names. That the ledger
  produces them (the `delayedPassed` flag, the brief without a day plan) is the Evidence stream's work.
- **K4 and K2's ladder reorder do not show on c4 and c6.** No cross-topic prerequisite exists for their first skills, and
  the last skills' ladders are already easiest first, so the reorder changes nothing that is walked.
- **Learning.** Nothing here measures a child or a learning gain.
