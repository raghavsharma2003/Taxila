# director14: script walk v6.5 on integration 17 (2026-11-09)

Run by main. Brain's environment has no secrets.

## Run details

- **Tree:** int/r6 **c98ee3617** (integration 17).
  - Brain v6.5 (afc6b16c): P3 two-page picture turn, P2′, F1 frames, F2 persona, B1, K2, A1, the speed cap on the H2″ retry, and the harness fixes. It includes Studio patch 016.
  - Studio S7–S8 (efdc2608).
  - Learning D8 and the class 4–7 maths depth work (fd41acf9f).
  - Voice: the timing-test sweep.
  - Games science B–E plus the quiz fixes.
- **Command:**

  ```
  CI=1 DATABASE_URL= TEST_DATABASE_URL= TAXILA_R7_SCRIPT=on node --env-file=<main's env> evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1700 --usd 1.15 --out evals/hybrid-side-by-side/results/2026-11-09-director14
  ```

  The cap was raised from director13's 1,500 / $1.00 so all 16 lessons fit in one run.
- **Cost:** 1,428 calls, about $0.980, in one run. The dry count was 999.
- **Reply-ready p50 per lesson (ms, sorted):** 2351 2359 2445 2506 2519 2544 2564 2566 2649 2744 2823 2849 2851 2855 2873 3144.
  - The median of these per-lesson values is about 2.6 s.
  - director13 was about 3.06 s; director12's run p50 was 2.64 s.
- **scripts/:** the four v2.3 scripts as walked, copied from data/lesson-scripts at c98ee3617.

## Still to come

Brain's offline proxy tables (proxies-v64 plus the v6.5 proxies) will be added here. The hand judgement goes in docs/design/round7/judgements/.
