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

## Code proxies (Brain, offline)

These were made with `node evals/hybrid-side-by-side/proxies-v64.mjs <director15> <director16>`. They read the recorded rows only and make no model calls. Both runs are one run of 16 lessons each, so read the deltas as signals.

### H4 drawn-pages counter, part by part

The counter reads `row.pageParts`, which the harness records from director16 on: each part of her line, and the beat it belongs on. It checks that part against the page actually drawn under it.

| Run | Total | Close off the answered card (incl. P4′) | Part on another beat's page | Card page drawn as the alt |
|---|---:|---:|---:|---:|
| director15 | 22 | 18 | 4 | 0 |
| **director16** | **0** | **0** | **0** | **0** |

- **Director15:** the 18 closes are the P4′ shape (a miss verdict naming a value, said as the remediation's page opens). The 4 parts are c4 offtopic 34, c6 offtopic 32, c5-t02 steering 8 and c6 steering 8.
- **Director16:** P4′ puts those verdicts on the answered card's page, and the part check finds no part off its beat.
- **Counter fix in this commit.** The harness had given a bare not-right verdict ("Nahi, yeh jawab nahi hai.", "Yeh jawab sahi nahi hai.") a beat of its own, and that raised 5 false flags. Such a verdict has no value, why or key, so it opens the page after it by design. A part under 5 words is also said over the page before it (the planner's short-page rule). Neither is counted now. Without those two cases the counter would have read 9.
- The in-run gate count (the harness's counter during the run) was also 0 on every turn.

### Gate and verdict counts

| Count | director15 | director16 |
|---|---:|---:|
| Her turns | 568 | 573 |
| Verdicts / graded | 260 / 263 | **263 / 263** |
| Right called wrong / wrong called right | 0 / 0 | 0 / 0 |
| False keys | 0 | 1 |
| Gate contradictions (in-run counter) | 23 | **0** |
| Picture mismatch / unpaged / droppedPages | 0 / 1 / 0 | 1 / 0 / 0 |

- **The one false key (steady c5-t01 52):** "Isliye 1/12, 1/6 se pehle aata hai, 0 ke paas." This is the script's own text (data/lesson-scripts/c5-maths-ch02-t01.json). The false-answer detector does not count a remediation or simpler's numbers as given, so it is a detector gap, not words of hers.
- **The picture row (steady c4 18):** "Dekho, yahi numbers ab patti par. Pizza ki baat karein…" The alt line is the generic "same numbers" frame, and the pizza card follows.

### Text proxies

| Proxy | director15 | director16 |
|---|---:|---:|
| Turns over 60 words / longest | 83 / 99 | **33 / 79** |
| Card posed and never closed (K1) | 6 | 3 |
| Returns said (row returnSaid) / on time | — / 7 | 11 / 8 |
| Hindi requests honoured / English after | 15/16 / 1 | 16/16 / 1 |
| Bare re-pose | 1 | 0 |
| frameRepeat / tasteClaim / remediationResaid / pichhleLive | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| cardlessQ | 1 | 5 |
| cannedAnyTurn | 3 | 1 |
| Skill left without a close | 11 | 11 |

- **cardlessQ 5:** these are the aside's own questions, by A3's design: the honest line's "Tumhe Virat ke baare mein sabse achha kya lagta hai?" (4 rows) and one return question ("Ab tumhari cricket wali baat: …?"). Each ends her turn. None is a lesson question.
- **cannedAnyTurn 1:** the repeated aside's one-line acknowledgement ("Cricket wali baat maine likh li hai."). The proxy flags it; it is code's line.
- **Never closed (3):** offtopic c5-t01 ask:e3@30, steering c5-t02 ask:e2@16, stuck c5-t02 c3@48. The same three were open in director15 too.
- **Returns:** the proxy's count is 8, and `returnSaid` is on 11 rows. The proxy counts only returns of parked asides that it can match back to their park.

### Latency

All figures are in ms. The first table is pooled over all turns; the per-lesson p50s follow it.

| Run | Reply-ready p50 / p90 | Reply call p50 / p90 | Read call p50 / p90 | Reply p50, no rewrite / rewrite | Rewrite rate | Calls per teacher turn |
|---|---:|---:|---:|---:|---:|---:|
| director14 | 2647 / 4207 | 1549 / 3017 | 1031 / 1632 | 1202 / 2563 | 37.4% | 2.64 |
| director15 | 2793 / 4758 | 1765 / 3604 | 1012 / 1586 | 1340 / 2783 | 36.6% | 2.76 |
| director16 | 2772 / 4709 | 1636 / 3471 | 1082 / 1721 | 1352 / 2871 | 34.5% | 2.64 |

- **Calls per turn are back to 2.64,** director14's level, with the H2″ retry gone. The reply call's p50 fell 129 ms (1765 → 1636), and fewer turns were rewritten (34.5%).
- **The same single-call path held at director15's level** (1340 → 1352): about 150 ms above director14 with no code on that path. That reads as the Azure level of the day.
- **The read call rose 70 ms** (1012 → 1082). That is classifier variance; the read path's code did not change.
- **Net:** reply-ready p50 went 2793 → 2772.

| Lesson | d15 reply-ready | d15 read | d16 reply-ready | d16 read | n (d16) |
|---|---:|---:|---:|---:|---:|
| offtopic c4 | 2205 | 935 | 2698 | 990 | 34 |
| offtopic c5-t01 | 2793 | 1084 | 2789 | 1051 | 34 |
| offtopic c5-t02 | 2662 | 1011 | 2723 | 1140 | 33 |
| offtopic c6 | 2931 | 987 | 2634 | 1078 | 33 |
| steady c4 | 2473 | 1099 | 2908 | 1229 | 42 |
| steady c5-t01 | 3011 | 1040 | 2935 | 1093 | 44 |
| steady c5-t02 | 2805 | 987 | 2588 | 1153 | 49 |
| steady c6 | 3286 | 1056 | 3316 | 995 | 43 |
| steering c4 | 3406 | 943 | 2871 | 1119 | 25 |
| steering c5-t01 | 3639 | 987 | 2423 | 1099 | 25 |
| steering c5-t02 | 2660 | 966 | 2471 | 1153 | 32 |
| steering c6 | 2549 | 1070 | 3033 | 1176 | 26 |
| stuck c4 | 2936 | 1040 | 3109 | 985 | 34 |
| stuck c5-t01 | 2677 | 1016 | 3235 | 1043 | 34 |
| stuck c5-t02 | 2430 | 937 | 2588 | 876 | 34 |
| stuck c6 | 3060 | 942 | 2558 | 897 | 35 |
| **Median of the lessons** | **2805** | **1011** | **2789** | **1093** | |
