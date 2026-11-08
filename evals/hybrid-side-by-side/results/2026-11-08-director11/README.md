# director11: script walk v6.2 on integration 14a (2026-11-08)

**Setup:**
- **Lessons:** the same 16 lessons as director5–10: 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Lane:** Director only. **Child:** Learning's reactive child.
- **Scripts:** the 4 pilots at v2.3, copied unchanged from the run tree into `scripts/`.
  - Every remediation has a `simpler`.
  - About 108 `answerBoard`s.
  - Every why is 22 words or fewer, and Brain's 2.3 validator now refuses a longer one.
- **Command:** `TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1500 --usd 1.00 --out evals/hybrid-side-by-side/results/2026-11-08-director11`
- **Env:** `CI=1`, every DB URL blank, no DB. The env was loaded only with `node --env-file`.
- **Judging is not done here.** Every count below is a **code proxy** from the per-turn `gate`, `gate.v6` and `segments` fields. Main's judges count by hand.

## Run tree

claude/r4-conversation **b14df7ad**:
- int/r6 **29be9fa4c** (integration 14a). It contains:
  - Studio a60979dc G1–G5;
  - Learning c4126f517 (the whys trimmed, simpler on every remediation);
  - App 2b3965822.
- Studio **42534c19**, the pager fix:
  - a page 0 that is already up is kept still;
  - an over-long page drops its motion.
- Brain v6.2, through f3cf4464:
  - T1–T3 and H1–H5;
  - G3 `reveal: true`;
  - G5 patch 014;
  - T46 worked close on its own board;
  - the 22-word why rule;
  - `ofCard`.

**Gates on that head:**
- tsc and vite: clean.
- test:all: 5397/5410.
- Single-process `DATABASE_URL= npm test`: 5398/5410.
- Both runs fail only the baseline 5 (two browser suites, migrations-applied, the DB-only trace and r5 suites, studio-stage-states).

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count | 972 | – |
| **Live** | **1,397** (taxila-fast) | **about $0.958** |
| Against the approved 1,500 / $1.00 | 93% | 96% |

**Reply ready** (classify + reply, all 544 teacher turns):
- **p50 2.80 s, p90 4.42 s**;
- director10 was p50 2.56 s, p90 4.04 s, on the same proxy.

## Gate counts (code proxies)

| | director11 | director10 (same proxies, recounted) |
|---|---|---|
| Teacher turns | 544 | 544 |
| Verdicts given / graded answers | **213 / 213** | 221 / 221 |
| Right called wrong / wrong called right | **0 / 0** | 0 / 0 |
| False keys | **0** | 0 |
| Contradictions, all kinds, as the harness sums them | 139 | 56 |
| … `gate.v6` **unpaged** | **0** | 31 |
| … `gate.v6` **nothingNew** | **1** | 8 |
| … `gate.v6` picture line naming an undrawn thing | 13 | 8 |
| … `gate.v6` borrowed why | 0 | 0 |
| … `gate.v6` **verdictSeg** (see below: 114 of 120 are by design) | 120 | 4 |
| … remaining per-segment screen contradictions | 5 | 5 |
| **Contradictions without the by-design verdictSeg** | **25** (19 if the 6 unclassified are also answer boards) | 52 |
| Turns over 60 words | **75** | 95 |
| Longest turn | 105 words | 132 |
| Turns ending on a check-in | 82 | 82 |
| Lessons leaving skill 1 | 12 of 16 | 13 of 16 |
| Parks said | 10 | 10 |
| Segments logged (rows with ≥ 2 parts) | 355 in 167 turns | 395 in 172 |

**Per topic** (contradictions as summed / turns over 60 words):
- c4: 39 / 18
- c5-t01: 32 / 17
- c5-t02: 39 / 15
- c6: 29 / 25

## What the counts point at

### `verdictSeg` (120): the checker predates answer boards and the first-page join

`verdictMisplaced` flags a verdict whose first page is not on the answered card's **live** board. It exempts a verdict of 4 words or fewer.

I sorted the 120 flags:
- **105: a right answer closed on the card's authored `answerBoard`.** This is v2.3's answer-state board, now on about 108 cards. It differs from the live board by design (it shows the answer).
- **9: a bare code verdict** ("Nahi, yeh jawab nahi hai.", 5 words). Since v6.2 it joins the next page, which is the fix for director10's 9 unpaged short verdicts. The checker's exemption is ≤ 4 words; the join is < 6 words with no digit.
- **6: unclassified.** These are single-page turns with no segment rows. All 6 are right answers with a why ("Haan, sahi hai, kyunki …"), which looks like the same answer-board case.

**Harness fix (proposed, not applied in this run):** `verdictMisplaced` should accept the card's `answerBoard` as the answered board, and use the same bare-verdict rule as Brain's join.

### `unpaged` 31 → 0

The cause was director10's first-page failures:
- the bare-verdict first page (Brain's join);
- W8 on a card's own board (Studio G2).

Studio's pager fix is in the tree too.

### `nothingNew` 8 → 1

Studio now draws a second view for a picture ask. The one left is in c6.

### Turns over 60 words: 95 → 75

The longest turn fell from 132 words to 105. T1 (one close) and T2 (a why once) cut most of it. The bridge split (T3) adds turns: c6 is still the longest topic.

### Teaching and grading

- Verdicts 213/213; misgrades 0/0; false keys 0.
- Skill progress holds at 12 of 16 leaving skill 1 (13 of 16 in director10).

## Files

- `<persona>-<topic>.json` / `.md`: per-turn rows (gate, `gate.v6`, segments, screen, latency).
- `scripts/`: the four walked v2.3 scripts.
- `meter.json`.
