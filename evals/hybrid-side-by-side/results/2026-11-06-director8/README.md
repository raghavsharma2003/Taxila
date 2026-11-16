# director8: script walk v5 with v2.2 scripts and the H1.2 child (2026-11-06)

Setup:
- **Same 16 lessons as director5–7:** 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Director lane only.**
- **Child:** Learning's reactive child, H1.2.
- **Scripts:** the live v2.2 scripts of the run tree, copied unchanged into `scripts/` (all four at version 2.2).
- **Command:** `TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1300 --usd 0.85`.
- **Env:** `CI=1`, every DB URL blank. No DB; the env was loaded only with `node --env-file`.
- **Judging is not done here.** Every count below is a **code proxy** from the per-turn `gate` and `segments` fields. Main's four judges count by hand against the v5 gate (dc-r7-script-walk-v5, plus 0 false keys).

## Run tree

A clean worktree at **int/r6 7e2d7eea7** (integration 10). It holds:
- Brain df99473c2: the v5 block B1–B5, the language mode, name–fraction grading and Studio 013;
- Studio 526233e81: segments, the "?" guard and `counts.hops`;
- Learning eee7eed0e;
- Duplex PR #62 word timings;
- Games, Face and App.

One harness-only change was applied on top: **Brain fbaa0f4c** (evals/hybrid-side-by-side.mjs; no product code).
- The per-segment checker preselected each segment's board under an id that two lessons at the same row shared.
- Studio's preselect caches picks by intentId, so a segment could be checked against another lesson's board.
- On 7e2d7eea7 alone the dry run flagged 27 contradictions; with the fix, 4. That is the dry run of record below.

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count on the run tree (`--dry`, stubbed lines) | 921 | – |
| **Live** | **1,173** (taxila-fast 1,173) | **about $0.804** |
| Against the approved 1,300 / $0.85 | 90% | 95% |

Live came in at 1.27 × dry.

**Reply ready** (classify + reply, all 448 teacher turns):
- **p50 2.29 s, p90 3.76 s**;
- director7 was p50 2.68 s, p90 4.39 s.

## Gate counts (code proxies, exact per-turn `gate`)

What each column means:
- **Delivered**: the beat's authored point is in her line, on explain turns. Partly by construction: code inserts the point when her line lacks it.
- **Answered (keyed)**: a reply graded against the keyed question asked in the previous turn. Since v5, "sawaal kya hai" and "phir se bolo" are requests and are never graded.
- **Verdict given**:
  - for a right answer, an explicit affirmation;
  - for a wrong one, a not-right first sentence.
- **Contradictions (per segment)**: v5's checker. Her line is split into the parts the board ask names (`intent.segments`: closures, the missed card's close, the beat, the card). Each part is checked with R4 `screenContradictions` against the board drawn while it is said: that part's board, preselected and taken on that part's own words. A one-part line is checked against its one board, as before.
- **Right called wrong / wrong called right**: the exact H1.2 rules.
- **False keys**: a key spoken ("… jawab X tha", "the answer was X") that is not one of the topic's authored key or accept forms. New in v5.
- **Turns in segments**: teacher turns whose line spans more than one board.

| Lesson | Turns | Delivered | Answered (keyed) | Verdict given | Contradictions (per segment) | Right called wrong | Wrong called right | False keys | Turns in segments |
|---|---|---|---|---|---|---|---|---|---|
| offtopic-c4-ch05-t01 | 23 | 5/5 | 9 | 9/9 | 0 | 0 | 0 | 0 | 5 |
| offtopic-c5-ch02-t01 | 23 | 4/4 | 10 | 10/10 | 0 | 0 | 0 | 0 | 5 |
| offtopic-c5-ch02-t02 | 23 | 3/3 | 8 | 8/8 | 0 | 0 | 0 | 0 | 3 |
| offtopic-c6-ch06-t01 | 23 | 3/3 | 11 | 11/11 | 0 | 0 | 0 | 0 | 6 |
| steady-c4-ch05-t01 | 41 | 9/9 | 22 | 22/22 | 1 | 0 | 0 | 0 | 7 |
| steady-c5-ch02-t01 | 41 | 9/9 | 23 | 23/23 | 0 | 0 | 0 | 0 | 10 |
| steady-c5-ch02-t02 | 41 | 10/10 | 21 | 21/21 | 0 | 0 | 0 | 0 | 11 |
| steady-c6-ch06-t01 | 41 | 9/9 | 20 | 20/20 | 0 | 0 | 0 | 0 | 8 |
| steering-c4-ch05-t01 | 25 | 5/5 | 10 | 10/10 | 0 | 0 | 0 | 0 | 5 |
| steering-c5-ch02-t01 | 25 | 3/3 | 12 | 12/12 | 1 | 0 | 0 | 0 | 7 |
| steering-c5-ch02-t02 | 25 | 4/4 | 12 | 12/12 | 0 | 0 | 0 | 0 | 5 |
| steering-c6-ch06-t01 | 25 | 6/6 | 13 | 13/13 | 0 | 0 | 0 | 0 | 7 |
| stuck-c4-ch05-t01 | 23 | 5/5 | 9 | 9/9 | 0 | 0 | 0 | 0 | 4 |
| stuck-c5-ch02-t01 | 23 | 5/5 | 9 | 9/9 | 0 | 0 | 0 | 0 | 3 |
| stuck-c5-ch02-t02 | 23 | 4/4 | 10 | 10/10 | 0 | 0 | 0 | 0 | 4 |
| stuck-c6-ch06-t01 | 23 | 5/5 | 9 | 9/9 | 0 | 0 | 0 | 0 | 4 |
| **Total** | **448** | **89/89 (100%)** | **208** | **208/208 (100%)** | **2** | **0** | **0** | **0** | **94** |
| director7 (code) | 448 | 82/82 | 230 | 229/230 | 13 (one board per turn); 51 by hand | 0 | 0 | – (2 by hand) | – |

"Answered" fell from 230 to 208. Most of the difference is turns that director7 graded and v5 now treats as requests: "sawaal kya hai", "phir se bolo" and "pehle main try karun".

### The per-segment checker's output

- 94 of 448 teacher turns spoke over more than one board: 192 segments in all.
- The 2 flags (each turn's `segments` field has the part-by-part counts):

| Turn | Segment, board | The line | Reading |
|---|---|---|---|
| steady-c4 T75 (s3 e1) | segment 0, on c2's compare board | "Wahi 8 laddoo dekho: 8 ka 1/2 = 4, aur 8 ka 1/4 = 2." | Skill 2→3's authored **bridge**, said on the board the last turn ended on (check c2's compare board), names 8 laddoo that board doesn't draw. The bridge describes skill 2's explain board, not its last check's. Data or Brain: a bridge either needs its own board, or should be said on skill 2's explain board. |
| steering-c5-t01 T27 (s1 e3) | segment 0, on e2's line board | "Aur pehle wale sawaal ka jawab 8 tha, kyunki marks nahi, gaps dekho: 4 barabar gaps hain, …" | The missed card's **close** is said on that card's own board (8 gaps), but its "why" (`scriptWhyOf`: the rule its misconception's remediation ends on) describes the remediation's board (4 gaps). Brain: the why must be the card's own or count-free, or be said on the remediation's board. |

- **The 2 false keys of director7** ("jawab 0 tha", "jawab 2 tha"): 0 in this run. Closes said "0 aur 1 ke beech", "2 aur 3 ke beech", and so on.

## Latency: director7 → director8, by category

Each cell gives: turns · sequential (classify + reply) p50 / p90 · parallel bound (max of the two on a model-classified turn) p50 / p90, in ms. Both runs record the harness `latency` fields.

| Category | director7 | director8 |
|---|---|---|
| All turns | 448 · 2681 / 4392 · 2392 / 3812 | 448 · **2287 / 3763** · **2060 / 3210** |
| Classify on the fast path | 289 · 2459 / 4035 | 292 · 2093 / 3349 |
| Classify by the model | 159 · 3242 / 4790 · 1835 / 3324 | 156 · 3064 / 4415 · 1953 / 2807 |
| Draft rewritten | 182 · 3816 / 4835 · 3367 / 4373 | 191 · 3229 / 4246 · 2607 / 3609 |
| Rewrite skipped (cut 1) | 40 · 1770 / 3417 · 1649 / 2460 | 43 · 1892 / 2591 · 1323 / 2245 |
| No rewrite caught | 226 · 2358 / 2868 · 1689 / 2510 | 214 · 2034 / 2501 · 1628 / 2293 |

These are the harness's numbers. The production figure (first-audio-ready through turn.js speculation) is in `evals/turn-replay/results/2026-11-06-int10/`, measured on the same tree.

## Files

- `<persona>-<topic>.md` and `.json` for each of the 16 lessons. Each turn carries `gate` (including `falseKeys`) and, when its line spans boards, `segments` [{ from, beat, template, contradictions }].
- `meter.json`.
- `scripts/`: the four v2.2 script files the run walked, from the run tree.
- Run log notes: `[brief] v2 view not renderable … legacy brief used` and `[trace] write failed: DATABASE_URL not set` repeat throughout. Both are expected with the DB blanked, and neither touched a lesson. No `NO COUNTS` was raised.
