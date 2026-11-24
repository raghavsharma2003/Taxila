# director6: script walk v3 with v2.1 scripts and the H1.1 child (2026-11-05)

Setup:
- **Same 16 lessons as director5:** 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Director lane only.**
- **Child:** Learning's reactive child with H1.1.
  - Steady leaves at turn 40.
  - Probes get reasons.
  - Verbs agree with "Riya".
  - No model calls.
- **Command:** `TAXILA_R7_SCRIPT=on TAXILA_R7_SCRIPT_DIR=data/lesson-scripts-v2 node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1273 --usd 0.833`.
- No DB was used, and the env was loaded only with `node --env-file`.
- **Judging is not done here.** The counts below are the harness's code counts. Main's judges count by hand (dc-r7-script-walk-v3).

## Code and data (run tree)

The run used a clean worktree with three commits merged:
- **int/r6 93b0e20c0** (integration 8). It carries:
  - Brain d74778e4 (v3 plus the SC1/SC2 wiring);
  - Learning 31b818f9c (v2.1 scripts in data/lesson-scripts-v2, all four topics at version 2.1, and H1.1);
  - Studio 9e88da21, Platform 14a80397 and App df337421.
- **Brain ea705f9d.** It adds version 2.1 to the walkable versions (WALK_VERSIONS) and makes the script-run preflight refuse a topic with no walkable script.
- **Studio 190c77f1.** A scripted card's board draws its own mark labels.

**First start, aborted.** The first start on 93b0e20c0 alone walked no script beat, because WALK_VERSIONS lacked 2.1. It was stopped at 27 calls (about 24k input tokens, about $0.017), wrote no lesson, and is counted against the cap.

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count on the run tree (`--dry`: stubbed chat counts one reply call, a classifyFast miss one classify call) | 1,005 (869 reply, 136 classify) | – |
| Projection (live ≈ 1.12 × dry, calibrated on director5: 941 dry against 1,056 live) | about 1,125 | about $0.70 |
| **Live** | **1,163** (taxila-fast 1,161; grok-4-1-fast-non-reasoning 2) | **about $0.790** |
| First start (aborted) | 27 | about $0.017 |
| **Total against the approved 1,300 / $0.85** | **1,190** | **about $0.807** |

**Reply ready p50:** the median of the 16 lesson p50s is 3.00 s (range 2.66–3.54 s). director5 was 2.86 s.

## Gate counts (code, exact per-turn fields `gate`)

What each column means:
- **Delivered**: the beat's authored `point` was in what she said (pointSaid: every number and at least 70% of the content words). This counts explain turns only. V2 code-inserts the point when her line lacks it, so 100% is partly by construction. The harness did not record which points were inserted by code.
- **Keyed answers**: a reply graded `correct` or `not_yet` against the keyed question asked in the previous turn (K1).
- **Verdict given**:
  - for a right answer, an affirmation, or no not-right first sentence;
  - for a wrong answer, a not-right first sentence.
- **Contradictions**: sentences that R4 `screenContradictions` flags against the board on screen, with Studio's SC1 `screen.counts` when present.
- **Right called wrong**: a keyed right answer graded not_yet, or met with a not-right first sentence that does not affirm.
  - The raw harness flag counted any NOT_RIGHT match in the first sentence. It fired on "Sahi, … barabar nahi hain" to the key "nahi" four times.
  - The exact rule is applied below, and the harness is fixed to it.

| Lesson | Turns | Delivered (point said / explain turns) | Keyed answers | Verdict given | Contradictions (as flagged in the run) | Right called wrong (exact; raw flag) |
|---|---|---|---|---|---|---|
| offtopic-c4-ch05-t01 | 23 | 5/5 | 11 | 11/11 | 0 | 0 (1) |
| offtopic-c5-ch02-t01 | 23 | 3/3 | 9 | 9/9 | 2 | 0 (0) |
| offtopic-c5-ch02-t02 | 23 | 3/3 | 13 | 12/13 | 1 | 0 (0) |
| offtopic-c6-ch06-t01 | 23 | 3/3 | 9 | 8/9 | 0 | 0 (0) |
| steady-c4-ch05-t01 | 41 | 8/8 | 25 | 22/25 | 0 | 0 (1) |
| steady-c5-ch02-t01 | 41 | 6/6 | 19 | 18/19 | 3 | 1 (1) |
| steady-c5-ch02-t02 | 41 | 7/7 | 23 | 23/23 | 2 | 0 (1) |
| steady-c6-ch06-t01 | 41 | 6/6 | 20 | 19/20 | 1 | 0 (0) |
| steering-c4-ch05-t01 | 25 | 4/4 | 12 | 11/12 | 0 | 0 (1) |
| steering-c5-ch02-t01 | 25 | 3/3 | 14 | 14/14 | 1 | 0 (0) |
| steering-c5-ch02-t02 | 25 | 3/3 | 12 | 11/12 | 1 | 0 (0) |
| steering-c6-ch06-t01 | 25 | 3/3 | 14 | 12/14 | 0 | 0 (0) |
| stuck-c4-ch05-t01 | 23 | 6/6 | 12 | 10/12 | 0 | 0 (0) |
| stuck-c5-ch02-t01 | 23 | 3/3 | 11 | 11/11 | 2 | 0 (0) |
| stuck-c5-ch02-t02 | 23 | 3/3 | 12 | 11/12 | 1 | 0 (0) |
| stuck-c6-ch06-t01 | 23 | 3/3 | 12 | 10/12 | 0 | 0 (0) |
| **Total** | **448** | **69/69 (100%)** | **228** | **212/228 (93%)** | **14** | **1** (5) |

Scale-gate lines, as far as code can count them:
- verdicts are 93% against a gate of ≥ 90%;
- contradictions: see below;
- right called wrong: 1, against a gate of 0;
- beats taught (≥ 80%) and the judge axes are for the hand count.

### The 14 flagged contradictions: all false flags (checker), 0 after the fix

Each was read against its board. All 14 are authored lines, mostly code-spoken remediation say, that match the board they stand on. The flags came from the checker misreading counts:
- "teen mark hain: 1/2, 1/4 aur 1/8" (the labelled marks) was checked against the tick counts.
- "rang wale 2 hisse" (the shaded parts) was checked against the parts.
- "ek gap" and "ek kone se" ("one gap", "from a corner") were taken as count claims.
- "1/8 wale 3 tukde … 3/8 tak" (a stretch of the line) was taken as the division.
- "beech mein 3 chalk ke nishaan" (filler words) escaped the inner-marks rule and fell to the pointed-number check.
- "1/2" over a roti in 2 parts and "1/4" over a line in eighths are fractions on a drawn tick that the board does not write.

The fix is in server/brain/say.js `countContradicts` and `screenContradictions`, with tests in tests/r7-brain-v3.test.mjs. Re-checking every turn of this run that had a board (176 turns) with the fixed checker gives **0** flags. Real miscounts are still flagged in the tests: a wrong inner-mark count, a wrong division, and a fraction off every tick. These lines were code-composed after the R4 check, so the misreads changed the gate count only, not what was said.

### The 16 keyed answers without a code-counted verdict

| Count | What happened | Layer |
|---|---|---|
| 7 | The verdict comes second: "Pichhle sawaal ka jawab X tha. Y sahi nahi hai." The give-up reveal of the previous card (the K2 `gave` line) is placed before the not-right lead, so the first sentence is not the verdict. | b/c, Brain: ordering in say.js |
| 7 | A graded wrong answer ("Yes" to a yes/no card whose key is "nahi", "40 cm", "24 cm", "2/1") gets a reply that only poses the card or the next card, with no verdict. | b/c, Brain |
| 1 | "No hai na" was graded correct and got "Haan, Riya—tumne sahi pehchaana: … nahi hoga". This is an affirmation, so it is a counter miss, not a defect. | d |
| 1 | "1/8" was graded correct, and her line said "Riya, 1/8 nahi; …". The model negated a graded right answer. This is the one right answer called wrong. | c, Brain |

## Files

- `<persona>-<topic>.md` and `.json` for each of the 16 lessons.
- `meter.json`.
- Lesson turns: steady 41; offtopic and stuck 23; steering 25.
- Skills reached, by the script beats in the transcripts: steady reaches skill 2 or 3 in every topic.
