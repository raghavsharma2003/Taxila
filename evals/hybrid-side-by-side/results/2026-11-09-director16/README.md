# director16: script walk v6.7 on integration 20 (2026-11-09)

Run by main.

## Run details

- **Tree:** int/r6 **d955a9c7c** (integration 20). It contains:
  - Brain v6.7 (8b559e6a): A3 asides, P5, P4′, B1″, V1′, R4, K4 and the H4 per-part counter;
  - Studio's patch 018 applied to the harness (shownKind → avoidKind), plus S9b's root cause (2a8c7ffed);
  - Learning D10 (ceec9b743): the register rewrite of the four pilots, the re-numbered remediations and the new lints;
  - Games badlaav.

  tsc, vite and test:all are clean (6293/6306 pass, 0 fail).
- **Command:**

  ```
  CI=1 DATABASE_URL= TEST_DATABASE_URL= TAXILA_R7_SCRIPT=on node --env-file=<main's env> evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1900 --usd 1.25 --out <dir>
  ```

  It was written to main's scratchpad and copied here.
- **Cost:** 1,472 calls, about $1.001, in one run. The dry count was 1,002. director15 had 1,080 dry and 1,522 live.
- **Reply-ready p50 per lesson (ms, sorted):** 2423 2542 2558 2588 2595 2634 2723 2868 2871 2871 2925 3042 3316 3377 3455 3486.
  - The median of these is about 2.87 s; director15's was 2.81 s by Brain's count.
- **scripts/:** the four scripts as walked, copied from data/lesson-scripts at d955a9c7c.

## Still to come

Brain's offline proxy tables will be added here. The hand judgement goes in docs/design/round7/judgements/.
