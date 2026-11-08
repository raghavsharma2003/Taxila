# director12: script walk v6.3 on integration 14f (2026-11-08)

**Setup:**
- **Lessons:** the same 16 lessons as director5–11: 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Lane:** Director only. **Child:** Learning's reactive child. Since v6.3, the c4 child also plays "sawaal kya hai?" and "phir se bolo" on a live card.
- **Scripts:** the 4 pilots at v2.3, copied unchanged from the run tree into `scripts/`. They carry 112 `answerBoard`s.
- **Command:** `TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1500 --usd 1.00 --out evals/hybrid-side-by-side/results/2026-11-08-director12`
- **Env:** `CI=1`, every DB URL blank, no DB. The env was loaded only with `node --env-file`.
- **Judging is not done here.** Every count below is a **code proxy** from the per-turn `gate`, `gate.v6` and `segments` fields. Main's judges count by hand.

## Run tree

claude/r4-conversation **24fbd514**, which merges two lines:
- **int/r6 1a71ea86f (integration 14f):**
  - Studio S1–S3 and its new templates;
  - Learning D1–D5 with the answerBoards back, plus c8/c9 maths depth;
  - App's ofCard wiring;
  - Platform's device pairing (migration 041);
  - known-words regenerated.
- **Brain v6.3, through 35c1befa:**
  - T1′, H2′, H1′, P1, R7, W1, R1, R2;
  - the harness items. See the commit messages; the 47 predicates are in `tests/r7-brain-v63.test.mjs`.

**Gates on 24fbd514:**
- tsc and vite: clean.
- test:all: 5742/5758.
- Single-process `DATABASE_URL= npm test`: 5743/5758.
- Both runs fail the baseline 5 plus **lesson-safety-naming-db** and **r5-carried-checkin-db**:
  - The cause: the shared Neon test branch lacks migration 041 (`device_session`), which `server/auth.js` now joins. That is the same class as migrations-applied.
  - Main ruled both environmental and is applying 041 separately.

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count | 974 | – |
| **Live** | **1,380** (taxila-fast) | **about $0.936** |
| Against the approved 1,500 / $1.00 | 92% | 94% |

**Reply ready** (classify + reply, all 544 teacher turns):
- **p50 2.64 s, p90 4.27 s**;
- director11 was p50 2.80 s, p90 4.42 s, on the same proxy.

## Gate counts (code proxies)

The harness now uses the corrected `verdictMisplaced` (it accepts the answerBoard, and a bare verdict under 6 words with no digit). **This is the primary table.** The director11 column is director11 rechecked with the same checker (its README's corrected table).

| | director12 | director11 (corrected checker) |
|---|---|---|
| Teacher turns | 544 | 544 |
| Verdicts given / graded answers | **205 / 205** | 213 / 213 |
| Right called wrong / wrong called right | **0 / 0** | 0 / 0 |
| False keys | **0** | 0 |
| **Contradictions, all kinds** | **20** | 25 |
| … c4 / c5-t01 / c5-t02 / c6 | 2 / 4 / 10 / 4 | 3 / 4 / 13 / 5 |
| … `gate.v6` verdictSeg | **0** | 6 |
| … `gate.v6` unpaged | **4** (all c5-t02, see below) | 0 |
| … `gate.v6` nothingNew | 2 | 1 |
| … `gate.v6` picture line naming an undrawn thing (now read per page) | 8 | 13 (whole line) |
| … `gate.v6` borrowed why | 0 | 0 |
| Turns over 60 words | 78 | 75 |
| Longest turn | **93 words** | 105 |
| Turns ending on a check-in | 83 | 82 |
| Lessons leaving skill 1 | **10 of 16** | 12 of 16 |

### v6.3 proxies (text patterns over her lines)

| | director12 | director11 |
|---|---|---|
| Turns with two closes (verdict + why, "Toh poora jawab", a give-up, a carried close) | **9** | 26 |
| … a carried close ("Aur pehle wale sawaal ka jawab …") | **0** | 22 |
| Canned aside facts ("ek over mein chhe ball", "Virat Kohli India ke liye …") | **0** | 17 |
| A raw park template ("cricket: iski baat …") | **0** | 6 |
| "Ab agla kadam dekhte hain" | 11 | 18 |
| A turn word-for-word the same as her previous one (over 40 characters) | 9 | 16 |
| Returns said ("Aur X ki baat: …") | 22 | 20 |
| c4 child: "sawaal kya hai?" / "phir se bolo" played | 8 / 4 | 3 / 0 (from "which question") |

## What the counts point at

### The 9 two-close turns: one card, closed twice

All 9 are a right answer to the **worked example's own card**, said as two closes: the verdict with its why, then "Toh poora jawab: …". For example, offtopic c5-t01 row 44: "Haan, sahi hai, kyunki raasta 4 barabar gaps mein bata hai … Toh poora jawab: pehla khamba ghar se 1/4 km door hai."
- None of them closes a card other than the one just answered.
- They still break "zero turns with two closes" as main wrote it.
- Fix for v6.4 (Brain): on the worked card answered right, the verdict's why is the close and "Toh poora jawab" is not said again (or the other way round). One rule in say.js's T1 order.

### `unpaged` 0 → 4: P1's new remediation pages

All 4 are in c5-t02. The cases:
- **Steady row 78:** the worked close is followed by c0, whose board is `catalogue:L1`.
- **Steering row 38, stuck rows 26 and 46:** each is a 9-word remediation page, "Toh 8 bada number hai, par 1/8 chhota hissa hai.", on the bigger-denominator remediation's fraction-parts@1 board (8 parts, 2 shaded). The page before or after it is the card's own board.

These are the pages P1 now draws on the remediation's board; before, the same words were said over the card's board. The seam could not page them. Still to check with Studio: whether the short page fails W6 timing or W8 counts ("8" and "1/8" against a board of 8 parts, 2 shaded).

### Contradictions 25 → 20

- The remediation words on the follow-up card's board are gone (P1).
- The carried closes and their boards are gone (T1′).
- verdictSeg is 0.
- c5-t02 is still the highest (10 of 20): 4 unpaged, 6 per-segment.

### Skill progress 12 → 10 of 16

- Fewer turns now go past a card without closing it. A missed close is dropped, and a return waits for a boundary.
- The c4 child's two new requests each cost a turn on a live card.
- Not broken down further here.

### Teaching and grading

- Verdicts 205/205; misgrades 0/0; false keys 0.
- Every graded answer got a verdict.

## Files

- `<persona>-<topic>.json` / `.md`: per-turn rows (gate, `gate.v6`, segments, screen with the drawn `pages`, latency).
- `scripts/`: the four walked v2.3 scripts.
- `meter.json`.
