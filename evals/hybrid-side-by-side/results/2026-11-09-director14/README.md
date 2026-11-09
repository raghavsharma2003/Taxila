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

## Code proxies (Brain, offline)

These were made with `node evals/hybrid-side-by-side/proxies-v64.mjs <director13> <director14>`. They read the recorded rows only and make no model calls. Both runs are 16 lessons, one run each, so read the deltas as signals rather than measured rates.

### Gate and verdict counts

| Count | director13 | director14 |
|---|---:|---:|
| Her turns | 544 | 556 |
| Verdicts / graded | 212 / 213 | 247 / 248 |
| Right called wrong / wrong called right / false keys | 0 / 0 / 0 | 0 / 0 / 0 |
| Contradictions (gate, with the corrected verdictSeg) | 17 | **9** |
| ↳ c4-ch05-t01 / c5-ch02-t01 / c5-ch02-t02 / c6-ch06-t01 | 6 / 3 / 5 / 3 | 1 / 0 / 5 / 3 |
| verdictSeg (after the correction / raw) | 0 / 0 | 1 / 1 |
| picture | 7 | 2 |
| unpaged / nothingNew / borrowedWhy | 0 / 0 / 0 | 0 / 0 / 0 |
| droppedPages (turns) | 3 (3) | **0 (0)** |

### v6.4 text proxies

| Proxy | director13 | director14 |
|---|---:|---:|
| Turns over 60 words / longest | 73 / 98 | 87 / 97 |
| Orphan fragment | 0 | 0 |
| Card posed and never closed (K1) | 1 | 2 |
| "Yaad karo" on a live card | 0 | 0 |
| Two closes / carried after a probe | 0 / 0 | 0 / 0 |
| "Pichhle sawaal" said at all | 11 | 0 |
| Returns: on time / in their word / template | 9: 9 / 9 / 0 | 12: 12 / 12 / 0 |
| Canned aside facts (aside turns) | 4 | 0 |
| Hindi requests: honoured / English after | 16: 16 / 0 | 16: 16 / 1 |
| Bare re-pose / same as previous | 0 / 1 | 1 / 0 |
| "Agla kadam" | 18 | 19 |
| Skill left without a close | 11 | 9 |
| Aside talk | 10 | 5 |

The two cards never closed in director14 are both in stuck c5-t02: c3 at turn 50 and ask:e2 at turn 60.

### v6.5 text proxies

| Proxy | director12 | director13 | director14 |
|---|---:|---:|---:|
| frameRepeat: same code frame opening within her last 4 turns | 34 | 49 | **0** |
| tasteClaim / deniesAi | 0 / 0 | 9 / 0 | **0** / 0 |
| cardlessQ: her "?" on a scripted turn with no card | 0 | 3 | 2 |
| remediationResaid: an authored remediation said twice | 9 | 7 | **0** |
| cannedAnyTurn: a canned fact on any turn | 3 | 5 | **0** |
| pichhleLive: "Pichhle sawaal" on the turn that graded the card or gave it up | 7 | 11 | **0** |

On cardlessQ, the proxy now ignores a quoted board mark. Two director14 turns read "kyunki '?' wala nishaan …", which names the mark and asks nothing. That lowered director14 from 4 to 2 and left director12 and director13 unchanged. The two real cases are:

- offtopic c5-t01, turn 32: "Ab batao, 7 marks se 8 gaps kaise pata chala?" This is a why-question on a practice turn with no card.
- stuck c6, turn 36: "Ab batao, Virat tumhe kyun pasand hai?" She asks about the aside on a practice turn.

A note for the hand judgement: the spoken line "'?' wala nishaan" makes the voice read a "?" mark aloud (steady and steering c5-t02, turn 48).

### Latency per lesson (ms, p50; n = her turns)

Reply-ready is the time to the reply being ready. Read is the child-read (classify) call alone.

| Lesson | d13 reply-ready | d13 read | d14 reply-ready | d14 read | n (d14) |
|---|---:|---:|---:|---:|---:|
| offtopic c4 | 3197 | 1215 | 2649 | 1093 | 33 |
| offtopic c5-t01 | 2814 | 1222 | 2564 | 1070 | 33 |
| offtopic c5-t02 | 3091 | 1115 | 2434 | 910 | 34 |
| offtopic c6 | 2863 | 1222 | 2278 | 951 | 34 |
| steady c4 | 3120 | 1368 | 2823 | 1140 | 43 |
| steady c5-t01 | 3405 | 1336 | 2873 | 1253 | 41 |
| steady c5-t02 | 3171 | 1206 | 2566 | 1120 | 41 |
| steady c6 | 3165 | 1155 | 3144 | 1060 | 41 |
| steering c4 | 2734 | 1196 | 2640 | 1085 | 26 |
| steering c5-t01 | 3886 | 1486 | 2506 | 1014 | 25 |
| steering c5-t02 | 2433 | 1132 | 2359 | 979 | 25 |
| steering c6 | 3145 | 1161 | 2744 | 1088 | 25 |
| stuck c4 | 2728 | 1110 | 2844 | 1039 | 36 |
| stuck c5-t01 | 2938 | 1245 | 2677 | 1123 | 36 |
| stuck c5-t02 | 2674 | 1238 | 2311 | 870 | 34 |
| stuck c6 | 3023 | 1122 | 2519 | 883 | 33 |
| **Median of the lessons** | **3091** | **1215** | **2640** | **1070** | |

- Reply-ready fell 451 ms (3091 → 2640). The read call fell 145 ms (1215 → 1070).
- The other ~300 ms is the rest of the turn's work, model and code together. v6.5 capped the H2″ retry (40 tokens, 1.5 s), and the retry is the likeliest source of that share.
- The read p50 still varies between runs (director12 had 893 ms), so a second run would be needed to separate Azure variance from our own work.
