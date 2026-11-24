# director9: script walk v6 on integration 11b (2026-11-06)

**Setup:**
- **Lessons:** the same 16 lessons as director5–8, 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Lane:** Director only.
- **Child:** the merged reactive child (Learning's pending queue plus Brain's topical reasons; stuck and offtopic leave after 32 turns).
- **Scripts:** the live v2.2 scripts of the run tree, copied unchanged into `scripts/`. Every keyed card carries an authored `why`.
- **Command:** `TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1500 --usd 1.00`.
- **Env:** `CI=1`, every DB URL blank, no DB. The env was loaded only with `node --env-file`.
- **Judging is not done here.** Every count below is a **code proxy** from the per-turn `gate`, `gate.v6` and `segments` fields. Main's judges count by hand.

## Run tree

A clean worktree at **3d6f7e7c** (claude/r4-conversation). It is int/r6 **4ebc45fe2** (integration 11) merged unchanged, plus one Brain commit:
- int/r6 4ebc45fe2 holds:
  - Brain v6 d955a41b + 9b2c3b4d;
  - Studio 1015c6ca4: S1′, S3′, confirm-reveal, bridge rows;
  - Learning 2cbe45a85: whys, bridgeBoards, data fixes, merged child;
  - Games deb85b1ac;
  - App afd8eab2b.
- The Brain commit: the picture ask's second view is read off Studio's preselected row (`altViewOfRow`), so her line names it ("Dekho, yahi 1/6 aur 1/3 ab patti par."). There is a cross-seam test.

**Not in the run tree:**
- **Learning's 45-word cap on remediation says.** Some c6 says are 55–70 words, so those turns still run 66–80 words even when split (see below).
- **Studio's #44 timings.**
- **Studio's `preselectedAltView` seam** (a6f34753). The row read covers it.

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count on the run tree | 995 | – |
| **Live** | **1,424** (taxila-fast 1,424) | **about $0.937** |
| Against the approved 1,500 / $1.00 | 95% | 94% |

Live came in at 1.43 × the dry count; director8 was 1.27 ×. The longer stuck and offtopic lessons and the split turns account for the difference.

**Reply ready** (classify + reply, all 528 teacher turns):
- **p50 2.33 s, p90 3.58 s**;
- director8 was p50 2.29 s, p90 3.76 s.

## Gate counts (code proxies)

| | director9 | director8 (code) |
|---|---|---|
| Teacher turns | 528 | 448 |
| Verdicts given / graded answers | **156 / 156** | 208 / 208 |
| Right called wrong / wrong called right | **0 / 0** | 0 / 0 |
| False keys (widened check, see note) | **0** | 0 (old check) |
| Contradictions, per-segment + v6 kinds | **10** | 2 (old checker; the hand judges counted 10 / 45 / 4 firm on three topics) |
| … `gate.v6` borrowed why | **0** | (9 / 8 / 10 / 9 per topic, offline) |
| … `gate.v6` verdict with content over another board | **0** | (8 / 10 / 11 / 2, offline) |
| … `gate.v6` picture line naming an undrawn thing | 1 | (2 / 0 / 1 / 2, offline) |
| … '?' board, value stated (per segment) | 6 | (c5-t02: 31 turns, offline) |
| Turns over 60 words | **21** | 96 |
| Longest turn | 128 words | 112 |
| Split turns (closures, or teaching then card) | 45 | – |
| Segments logged (rows with ≥ 2 parts) | 256 in 110 turns | 192 |
| Lessons leaving skill 1 | 6 of 16: offtopic c6, stuck c5-t01, stuck c6 now reach s2; steady c4 and steering c5-t02 / c6 no longer do (the split's extra turns) | 6 of 16 (all steady or steering) |

**Per topic** (contradictions / false keys / turns over 60 words):
- c4: 0 / 0 / 4
- c5-t01: 6 / 0 / 4
- c5-t02: 3 / 0 / 1
- c6: 1 / 0 / 12

**False keys.** The run's own column reads 17. They are checker false positives, recounted at 0 with the corrected rule:
- 15 were numbers inside an authored close, e.g. "kyunki … 6 + 4 + 6 + 4 = 20 cm".
- 2 came from the old "jawab X tha" regex: it crossed sentences, and it read "tumhara jawab sahi tha" as a key.
- The correction is in evals/hybrid-side-by-side.mjs: authored whys and the move's own closures count as given, and the regex works one sentence at a time.

**The 10 contradictions:**
- **6: a "?" mark whose value her verdict states.** For example, "Bilkul, Riya — pehla gap 1/8 km" spoken on the answered then-card's own board, which still shows "?" at that mark.
  - The verdict segment is on the right board (v6 R1).
  - The board does not reveal the confirmed value in the harness's take. That is Studio's S1′ confirm-reveal, raised with Studio.
- **3: authored step or point text against the board.** The c5-t02 worked step speaks of bars over the number-line board (×2), and a c6 rectangle line over the e2 hexagon board.
- **1: picture.** stuck c5-t02 T19: "Ab wahi patti dekho" over a "bar" board. That is a checker synonym (patti = bar), not a real mismatch.

## Long turns that remain (21)

- **Long authored remediation says** (c6 missing-sides 66 words, l-plus-b 79). Learning's 45-word cap fixes these; it is not in the run tree.
- **Two move kinds the split does not cover yet** (fixed in Brain after this run):
  - A request turn ("samajh nahi aaya", "picture dikhao") that also carried a missed card's close. The close is now kept for the next turn, never added to a request turn.
  - A `repair` move after a right answer that carried closures and a bridge (stuck c6 T65, 128 words). These were excluded from splitting; the split now checks its own flag instead.
- **Explain beats whose point and card are both long** (64 words, c4 e1).

## Files

- `<persona>-<topic>.json` / `.md`: per-turn rows (gate, `gate.v6`, segments, screen, latency).
- `segments.jsonl`: every logged segment: lesson, turn, from, atClause, estMs (about 380 ms a word), beat, board, template, contradictions, withheld.
- `scripts/`: the four walked scripts.
- `meter.json`.
