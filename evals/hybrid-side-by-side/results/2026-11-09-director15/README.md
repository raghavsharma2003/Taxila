# director15: script walk v6.6 on integration 19 (2026-11-09)

Run by main.

## Run details

- **Tree:** int/r6 **2e9664b34** (integration 19). It contains:
  - Brain v6.6 (f7548eb31): P4 pages by construction, V1 no model words on a graded turn, B1′, A2, F1′, K3, and the H3 drawn-pages counter;
  - Studio S9/S9b (ed20738e6);
  - Learning D9 (21c9ceed3);
  - Games rang harm-mix (91a6a0d11).

  tsc, vite and test:all are clean (6244/6257 pass, 0 fail).
- **Command:**

  ```
  CI=1 DATABASE_URL= TEST_DATABASE_URL= TAXILA_R7_SCRIPT=on node --env-file=<main's env> evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1900 --usd 1.25 --out <dir>
  ```

  It was written to main's scratchpad while the single-process gate ran, then copied here.
- **Cost:** 1,522 calls, about $1.035, in one run. The dry count was 1,080; director14 had 999 dry and 1,428 live.
- **Reply-ready p50 per lesson (ms, sorted):** 2205 2473 2516 2593 2697 2701 2702 2793 2920 2931 2984 3052 3060 3286 3406 3639.
  - The median of these is about 2.86 s; director14's was 2.64 s.
- **scripts/:** the four scripts as walked, copied from data/lesson-scripts at 2e9664b34.

## Still to come

Brain's offline proxy tables will be added here. The hand judgement goes in docs/design/round7/judgements/.
