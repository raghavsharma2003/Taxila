# director13: script walk v6.4 on integration 16 (2026-11-09)

**Run by main** (Brain's container lost its .env.local overnight).

## Run details

- **Tree:** int/r6 **0dd31feb1** (integration 16), which contains:
  - Brain v6.4 (716635a9: P2, K1, Q1, H2″, T1″, L1, R3, harness);
  - Studio S4–S6 (04cf99ac) with patch 015;
  - Learning D6–D7 (e3ba1d7fc);
  - Games naap.

  Its runtime is identical to Brain's 82244526, which only drops a test exemption.
- **Command:**

  ```
  CI=1 DATABASE_URL= TEST_DATABASE_URL= TAXILA_R7_SCRIPT=on node --env-file=<main's env> evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1500 --usd 1.00 --out evals/hybrid-side-by-side/results/2026-11-09-director13
  ```
- **The run happened in two parts:**
  - Part 1 stopped at the USD cap after 15 of 16 lessons (1,470 calls, ~$1.001; `meter-part1.json`).
  - Part 2 ran only `steering-c6-ch06-t01`, using `--skip` for the other three c6 lessons, `--cap 160 --usd 0.12` (72 calls, ~$0.046; `meter-part2.json`).
- **Total:** 1,542 calls, ~$1.047, which is $0.047 over the nominal $1.00 cap. That spend was a deliberate choice, so the judges see all 16 lessons.
- **Dry count:** 998 calls. director12 was 974 dry and 1,380 live.
- **Reply ready, p50 per lesson (ms, sorted):** 2433 2674 2728 2734 2814 2863 2938 3023 3091 3120 3145 3165 3171 3197 3405 3886. The median of the per-lesson p50s is ~3.06 s (director12 run p50: 2.64 s).
- **scripts/:** the four v2.3 scripts as walked, copied from data/lesson-scripts at 0dd31feb1.

## Still to come

The code-proxy tables (corrected verdictSeg, droppedPages, the v6.4 text proxies) will be added by Brain's checker, offline. The hand judgement is in docs/design/round7/judgements/.
