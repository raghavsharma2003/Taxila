# director10: script walk v6.1 on integration 12d (2026-11-07)

**Setup:**
- **Lessons:** the same 16 lessons as director5–9: 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Lane:** Director only.
- **Child:** Learning's reactive child (ab7beed6c). It treats an imperative card as posed, and allows at most 2 "which question?" per card.
- **Scripts:** the 4 pilots at **v2.3**, copied unchanged from the run tree into `scripts/`. Every explain beat, worked step, yourStep, check and then-card carries an authored `simpler`. c4 e3 has an `answerBoard`. c5-t02's worked example is on fraction-bars@1, and c4 e2 is on wholes@1.
- **Command:** `TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1500 --usd 1.00 --out evals/hybrid-side-by-side/results/2026-11-07-director10`
- **Env:** `CI=1`, every DB URL blank, no DB. The env was loaded only with `node --env-file`.
- **Judging is not done here.** Every count below is a **code proxy** from the per-turn `gate`, `gate.v6` and `segments` fields. Main's judges count by hand.

## Run tree

A clean worktree at **ca6f25ca**:
- int/r6 **2ede8a434** (integration 12d);
- plus one Brain commit, **de86cad2** on claude/r4-conversation: `boardWords` and the picture checker read Studio's fraction-bars@1 and wholes@1.

What 12d contains:
- Brain v6.1 (80b5dea7 → c3c63dc9: R7–R11, split policy B, P1, answerBoard);
- Studio fdf0c0ee (fraction-bars@1, wholes@1, the confirm-reveal screen, a later page that fails is dropped);
- Learning db128cebb + 0fc75d9c8 (v2.3 pilots) and ab7beed6c (child);
- Games and App.

**Split policy B (main):**
- Closures stay in the beat's turn.
- Her own words are trimmed first.
- Only authored teaching plus its card is split.
- The closing split is off (TAXILA_R7_SPLIT_CLOSE unset).

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count (12 + db128cebb) | 973 | – |
| **Live** | **1,380** (taxila-fast 1,380) | **about $0.950** |
| Against the approved 1,500 / $1.00 | 92% | 95% |

**Reply ready** (classify + reply, all 528 teacher turns):
- **p50 2.56 s, p90 4.04 s**;
- director9 was p50 2.33 s, p90 3.58 s.

## Gate counts (code proxies)

| | director10 | director9 (same proxies, recounted) |
|---|---|---|
| Teacher turns | 528 | 528 |
| Verdicts given / graded answers | **221 / 221** | 156 / 156 |
| Right called wrong / wrong called right | **0 / 0** | 0 / 0 |
| False keys (widened check) | **0** | 0 (17 with the old regex) |
| Contradictions, all kinds | **56** | 10 |
| … `gate.v6` **unpaged** (new: the turn's pages as the seam pages them) | **31** | not counted |
| … `gate.v6` **nothingNew** (new: a picture ask that re-draws the board up) | **8** of 15 picture asks | not counted |
| … `gate.v6` picture line naming an undrawn thing | 8 | 1 |
| … `gate.v6` verdict with content over another board | 4 | 0 |
| … `gate.v6` borrowed why | 0 | 0 |
| … '?' board, value stated (per segment) | **0** | 3 |
| … remaining per-segment screen contradictions | 5 | 6 |
| Turns over 60 words | **95** | 21 |
| Longest turn | 132 words | 128 |
| Turns ending on a check-in ("Yahan tak theek hai?" …) | **82** | 132 |
| Lessons leaving skill 1 | **13 of 16** (steady c6 reaches skill 3) | 6 of 16 |
| Parks said ("… iski baat is part ke baad …") | 10 | 0 by hand |
| Segments logged (rows with ≥ 2 parts) | 395 in 172 turns | 256 in 110 |

**Per topic** (contradictions / unpaged / nothingNew / turns over 60 words):
- c4: 24 / 16 / 2 / 21
- c5-t01: 4 / 0 / 0 / 23
- c5-t02: 22 / 14 / 2 / 21
- c6: 6 / 1 / 4 / 30

## What the new counts point at

### `unpaged` (31): the first page fails

Every one of the 31 paged turns fails on **its first page**: the closing part (verdict, give-up or worked close) said over the answered card's board. Studio drops a failing *later* page, but a failing first page fails the whole turn.

How I found the cause:
- I re-took each failing turn's pages offline. The re-take approximates each page's scriptBeat (its kind is guessed, and no `answers` are passed), so these are leads, not judgements.
- Failing check, by page:
  - **15 × W8.counts_match_line** on fraction-parts, fraction-bars, wholes, equal-groups and shade-grid. Her close states counts that the answered card's board does not draw. For example, "Toh poora jawab: barfi ka 2/3 …" is said over a shade grid.
  - **15 × W5.words_from_line_or_kit** on compare@1, 4 of them also **W9.no_reveal**. A word board's columns are not in the close's words.
  - **1 × W6.timing**.
- Separately, **9 of the 31** open on a code not-right verdict of under 8 words ("Nahi, yeh jawab nahi hai."). That is a page too short to draw, the same shape as director9's T21 tail but on the first page.

Fix for the short verdict, in Brain: a first page under 5 words with no card joins the next page. A bare verdict says nothing a board can contradict. The other cases are Studio's to look at.

### `nothingNew` (8 of 15 picture asks)

The board drawn is the one already up, with no second view.
- c6 accounts for 4 (measured@1). c4 and c5-t02 account for 2 each.
- Not yet broken down by template.

### Turns over 60 words (95)

This is the cost of policy B: closures no longer split. The trim of her own words runs, but the authored parts are long:
- close + why;
- the closed card's close;
- the next beat's point;
- the card.

It is up from 21. Skill progress goes the other way: 13 of 16 lessons now leave skill 1 (director9: 6 of 16).

### Teaching and grading

- Verdicts 221/221; misgrades 0/0; false keys 0.
- '?' stated over a value: 0. Confirm-reveal works on the run path.

## Files

- `<persona>-<topic>.json` / `.md`: per-turn rows (gate, `gate.v6` with `unpaged` and `nothingNew`, segments, screen, latency).
- `segments.jsonl`: 395 logged segments (lesson, turn, from, atClause, estMs, beat, board, template, contradictions, withheld).
- `scripts/`: the four walked v2.3 scripts.
- `meter.json`.
