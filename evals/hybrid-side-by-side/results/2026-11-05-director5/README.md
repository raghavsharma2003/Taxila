# director5: the v2 script walk with the reactive child, 2026-11-05 (stream A Brain; main's GO, dc-r7-script-walk-v2)

The Director lane alone: 4 topics × 4 personas = 16 lessons.
- Topics: c4-maths-ch05-t01, c5-maths-ch02-t01, c6-maths-ch06-t01, c5-maths-ch02-t02.
- Personas: steady, offtopic, stuck, steering.
- Learning's H1 reactive child (`evals/child-sim/reactive.mjs`, rule-based, no model calls), 21–25 teacher turns each.
- Command: `TAXILA_R7_SCRIPT=on TAXILA_R7_SCRIPT_DIR=data/lesson-scripts-v2 node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics … `.
- No DB was used, and the env was loaded only with `node --env-file`.

## Code and data

- **Code:** int/r6 **f55de86f**, which is integration 7 (3e3f9df86) plus a context-only commit. It contains:
  - my R1–R4 (73e6d920), the R4 card-question fix (d52feb49) and the explicit script switch (f7b412e5);
  - Studio 09dc4285a: artifact.screen, S1/S2 and W10;
  - Learning 28778c11d: data/lesson-scripts-v2 and reactive.mjs.
- **Part 2** ran from a clean worktree at 05ceffdb: f55de86f plus a test-only commit, and `--skip` in the harness so the lessons already written were left out. Same settings.
- **Scripts:** `data/lesson-scripts-v2/` as in f55de86f (v2; 3/3 skills walkable per topic).

## Run

- 16 of 16 lessons. Model calls (all taxila-fast):
  - part 1: 600 calls, ~$0.373 (stopped at the original 600-call cap after 9 lessons);
  - part 2: 456 calls, ~$0.281 (main raised the cap to 1,100 / $0.70).
  - Total: **1,056 calls, ~$0.654** (meter-part1.json, meter-part2.json).
- No 401/403.
- Reply-ready p50 over all teacher turns: **2.86 s**. Per lesson it was 2.53–3.37 s.

## Gate counts (code-checked per teacher turn; the .json `gate` field)

- **delivered / beat turns:** on a turn that rendered a v2 explain beat, whether her line contained all its `mustSay` words (script.js `saidMust`, either language's form).
- **verdicts / keyed answers:** on a turn after the child answered a keyed card, check or ask, which the classifier graded correct, incorrect or misconception:
  - a right answer counts when her line affirms it (say.js `affirmsAnswer`);
  - a wrong one counts when her first sentence says it is not right (say.js `NOT_RIGHT`).
- **contradictions:** sentences of her line that name another shape than the board's, or point at the screen with a number the board does not show (say.js `screenContradictions`, against Studio's artifact.screen or the beat's board ref). This is counted after the R4 repair, so these 4 shipped.

| lesson | teacher turns | delivered / beat turns | verdicts / keyed answers | contradictions | ready p50 ms |
|---|---|---|---|---|---|
| offtopic-c4-ch05-t01 | 23 | 0/5 | 4/9 | 0 | 2967 |
| offtopic-c5-ch02-t01 | 23 | 2/3 | 5/11 | 1 | 3090 |
| offtopic-c5-ch02-t02 | 23 | 2/3 | 8/12 | 0 | 2806 |
| offtopic-c6-ch06-t01 | 23 | 3/3 | 5/11 | 0 | 3022 |
| steady-c4-ch05-t01 | 22 | 3/4 | 7/11 | 0 | 2768 |
| steady-c5-ch02-t01 | 24 | 0/3 | 4/12 | 1 | 2882 |
| steady-c5-ch02-t02 | 21 | 3/3 | 6/11 | 0 | 2735 |
| steady-c6-ch06-t01 | 23 | 3/3 | 9/11 | 0 | 2779 |
| steering-c4-ch05-t01 | 24 | 2/6 | 8/14 | 0 | 3028 |
| steering-c5-ch02-t01 | 25 | 2/4 | 9/13 | 1 | 2532 |
| steering-c5-ch02-t02 | 25 | 2/3 | 6/11 | 0 | 2626 |
| steering-c6-ch06-t01 | 25 | 2/3 | 8/14 | 0 | 2613 |
| stuck-c4-ch05-t01 | 23 | 2/6 | 2/8 | 0 | 3371 |
| stuck-c5-ch02-t01 | 23 | 1/3 | 8/9 | 1 | 3036 |
| stuck-c5-ch02-t02 | 23 | 4/4 | 9/13 | 0 | 2699 |
| stuck-c6-ch06-t01 | 23 | 5/6 | 8/12 | 0 | 3054 |
| **total** | 373 | 36/62 (58%) | 106/182 (58%) | 4 | 2858 |

**Against the scale gate (≥ 80% delivered, ≥ 90% verdicts, 0 contradictions):**
- delivered: 58%, not met;
- verdicts: 58%, not met;
- contradictions: 4, not met.

Both percentages are code proxies. An affirmation in words the predicate does not know (e.g. "haan, 12 cm") is missed. The judges' read of the transcripts decides. Unscored here.
