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

## Code proxies (Brain, offline)

These were made with `node evals/hybrid-side-by-side/proxies-v64.mjs <director14> <director15>`. They read the recorded rows only and make no model calls. Both runs are one run of 16 lessons each, so read the deltas as signals.

### H3 drawn-pages counter (evals/hybrid-side-by-side/drawn-pages.mjs)

**Counter fix in this commit.** Re-run on director15, the counter flagged 22 turns. 17 of them were one shape: a bare not-right verdict that only names their answer ("16 m sahi nahi hai."), followed by a remediation on the remediation's own board. That is P4 by design: a close that says nothing goes on the page it opens. Director14 never hit this shape, because its pages carried a `rem:` beat that the counter already exempted.

The counter now counts a not-right close only when it states a why or a key, or when it leaves the card without one. On director14 this still gives 20/22 of main's hand rows with 1 false flag (the test is unchanged and passes). The in-run gate figure for director15 (23) was made by the harness before this fix, so it includes those 17.

| Run | Total | Close off the answered card | Card page drawn as the alt | Stated fraction off the board |
|---|---:|---:|---:|---:|
| director13 | 11 | 0 | 7 | 4 |
| director14 | 21 | 18 | 2 | 1 |
| **director15** | **5** | **2** | **0** | **3** |

The director15 rows:

- **offtopic c5-t02 44:** "Is sawaal ka jawab 1/5 tha." is said on the next card's page (one page). This is a real one to look at.
- **steady c5-t01 86:** a right answer ("3/4 hai na") got no verdict. Her line is only the next card. The proxies also show 3 graded turns without a verdict (260 verdicts of 263 graded), so this needs a look.
- **offtopic c5-t02 50, steady c5-t02 48, steering c5-t02 46:** "… 1/4 do 1/8 ke barabar hai" over a 4-part line. These are probably counter false flags, because the authored why compares with eighths.
  - All three say "question nishaan wala nishaan". Learning D9's script now reads "question mark wala nishaan", and the Hindi-words pass turns "mark" into "nishaan". This should go back to Learning.

### Gate and verdict counts

| Count | director14 | director15 |
|---|---:|---:|
| Her turns | 556 | 568 |
| Verdicts / graded | 247 / 248 | 260 / 263 |
| Right called wrong / wrong called right / false keys | 0 / 0 / 0 | 0 / 0 / 0 |
| Gate contradictions (in-run counter) | 9 (v6 word checks) | 23 (drawn-pages counter, before the fix above) |
| droppedPages / unpaged | 0 / 0 | 0 / 1 |

### Text proxies

| Proxy | director14 | director15 |
|---|---:|---:|
| Turns over 60 words / longest | 87 / 97 | 83 / 99 |
| Card posed and never closed (K1) | 2 | 6 |
| Returns (on time / in their word) | 12 (12 / 12) | 7 (7 / 7) |
| Hindi requests honoured / English after | 16/16 / 1 | 15/16 / 1 |
| Bare re-pose | 1 | 1 |
| frameRepeat / tasteClaim / deniesAi | 0 / 0 / 0 | 0 / 0 / 0 |
| cardlessQ | 2 | 1 |
| remediationResaid / pichhleLive | 0 / 0 | 0 / 0 |
| cannedAnyTurn | 0 | 3 |
| Skill left without a close | 9 | 11 |

What the director15 rows show:

- **Returns 12 → 7:** under A2, a question about her own taste is now answered on the turn it is asked. The honest line ends "Tumhe Virat ke baare mein sabse achha kya lagta hai?" (5 lessons), so these are no longer counted as returns.
  - The one cardlessQ is that same line (stuck c6 54). It is the aside's own question, as A2 intends.
- **cannedAnyTurn 3:** two are her park promises and one is a return line ("Sixer maarna mazedaar laga hoga."). These are proxy false flags, not canned facts.
- **Never closed (6):** offtopic c5-t01 ask:e3@30, steady c5-t01 c2@82, steady c6 ask:e1@4, steering c5-t02 ask:e2@16, steering c6 ask:e2@16, stuck c5-t02 c3@48. These need the hand read.
- **Hindi miss:** stuck c5-t01 10. The same row is also the bare re-pose.

### Latency: where it went

| Run | Reply-ready p50 / p90 | Reply p50 / p90 | Read p50 / p90 | Reply p50, no rewrite / rewrite | Rewrite rate | Calls per teacher turn |
|---|---:|---:|---:|---:|---:|---:|
| director13 | 2974 / 5075 | 1729 / 3539 | 1224 / 1809 | 1398 / 2883 | 36.7% | — |
| director14 | 2647 / 4207 | 1549 / 3017 | 1031 / 1632 | 1202 / 2563 | 37.4% | 2.64 |
| director15 | 2793 / 4758 | 1765 / 3604 | 1012 / 1586 | 1340 / 2783 | 36.6% | 2.76 |

All figures are in ms and pooled over all turns. The median of the per-lesson p50s is in the table that follows.

- **The read call did not cause it.** The read p50 fell slightly (1031 → 1012).
- **The reply call did.** Its p50 rose 216 ms (1549 → 1765), on both paths: a turn with one model call and no rewrite rose 138 ms (1202 → 1340), and a rewritten turn rose 220 ms.
- The rewrite rate is unchanged (37%), so v6.6 did not add rewrites.
- V1 and B1′ add no model call; they are code only.
- The same single-call path got about 11% slower on the same deployment (taxila-fast). That reads as per-call model latency, which is Azure's, not our work.
- **What v6.6 did add:** calls per teacher turn rose 2.64 → 2.76 (about 65 more calls than the turn count explains).
  - The likely source is A2. A return her line misses is now re-queued, so the H2″ retry (one call, 40 tokens, capped at 1.5 s) can run again at the next boundary.
  - That lifts the tail (p90 4207 → 4758) more than the median.
  - The rows don't record the retry, so this is inferred, not counted. Adding `returnRetry` to the row would settle it.

| Lesson | d14 reply-ready | d14 read | d15 reply-ready | d15 read | n (d15) |
|---|---:|---:|---:|---:|---:|
| offtopic c4 | 2649 | 1093 | 2205 | 935 | 33 |
| offtopic c5-t01 | 2564 | 1070 | 2793 | 1084 | 33 |
| offtopic c5-t02 | 2434 | 910 | 2662 | 1011 | 34 |
| offtopic c6 | 2278 | 951 | 2931 | 987 | 33 |
| steady c4 | 2823 | 1140 | 2473 | 1099 | 41 |
| steady c5-t01 | 2873 | 1253 | 3011 | 1040 | 46 |
| steady c5-t02 | 2566 | 1120 | 2805 | 987 | 44 |
| steady c6 | 3144 | 1060 | 3286 | 1056 | 41 |
| steering c4 | 2640 | 1085 | 3406 | 943 | 25 |
| steering c5-t01 | 2506 | 1014 | 3639 | 987 | 25 |
| steering c5-t02 | 2359 | 979 | 2660 | 966 | 26 |
| steering c6 | 2744 | 1088 | 2549 | 1070 | 26 |
| stuck c4 | 2844 | 1039 | 2936 | 1040 | 34 |
| stuck c5-t01 | 2677 | 1123 | 2677 | 1016 | 38 |
| stuck c5-t02 | 2311 | 870 | 2430 | 937 | 34 |
| stuck c6 | 2519 | 883 | 3060 | 942 | 39 |
| **Median of the lessons** | **2640** | **1070** | **2805** | **1011** | |
