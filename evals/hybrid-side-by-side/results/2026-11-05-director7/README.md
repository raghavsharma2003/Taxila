# director7: script walk v4 with v2.2 scripts and the H1.2 child (2026-11-05)

Setup:
- **Same 16 lessons as director5 and director6:** 4 topics (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01) × 4 personas (steady, offtopic, stuck, steering).
- **Director lane only.**
- **Child:** Learning's reactive child, H1.2.
  - A card labelled "probe" that poses a keyed question is answered as a card.
  - Answered cards are not re-answered.
  - No model calls.
- **Scripts:** the live v2.2 scripts in `data/lesson-scripts` (no `TAXILA_R7_SCRIPT_DIR`).
- **Command:** `TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/hybrid-side-by-side.mjs --matrix --director-only --reactive --topics c4-maths-ch05-t01,c5-maths-ch02-t01,c5-maths-ch02-t02,c6-maths-ch06-t01 --cap 1300 --usd 0.85`.
- **Gate env:** `CI=1`, with every DB URL blanked. No DB was used, and the env was loaded only with `node --env-file`.
- **Judging is not done here.** The counts below are the harness's code counts (exact per-turn `gate` fields). Main's judges count by hand (dc-r7-script-walk-v4).

## Code and data (run tree)

The run used a clean worktree at Brain **32492218**, which is a fast-forward of int/r6 **8f461ae0b** (integration 9). Two shas:
- **int/r6 8f461ae0b** (integration 9). It carries:
  - Brain v4 (W1–W6) and the latency cuts;
  - Learning's v2.2 scripts and H1.2;
  - Studio, Voice, App and Platform as of integration 9.
- **Brain 32492218.** It adds:
  - WALK_VERSIONS 2.2 and the v2.2 validator rules (then-card ≤ 120 characters in hi; every check and then-card has its own board);
  - Voice patch 012 (child text to Studio, never blocking).

The preflight (`scriptWhyNot`) passed for all four topics before any spend.

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count on the run tree (`--dry`) | 968 | – |
| Projection (live ≈ 1.12 × dry) | about 1,085 | about $0.74 |
| **Live** | **1,161** (taxila-fast 1,161) | **about $0.794** |
| **Against the approved 1,300 / $0.85** | 89% of calls | 93% of spend |

Live came in at 1.20 × dry; director6 was 1.16 × dry.

**Reply ready p50:**
- the median of the 16 lesson p50s is **2.65 s** (range 2.44–3.62 s);
- director6 was 3.00 s.

## Gate counts (code, exact per-turn fields `gate`)

What each column means:
- **Delivered**: the beat's authored `point` was in what she said, on explain turns. V2 code-inserts the point when her line lacks it, so 100% is partly by construction.
- **Answered (keyed)**: a reply graded `correct`, `not_yet` or `misconception` against the keyed question asked in the previous turn (K1).
- **Verdict given**: an explicit affirmation for a right answer (H1.2: silence no longer counts); a not-right first sentence for a wrong one.
- **Contradictions (drawn screens)**: sentences that R4 `screenContradictions` flags against the board actually drawn on that turn. The board is the one Studio's `takePreselected` returned, else its preselect, with SC1 `screen.counts`.
- **Right called wrong**: a keyed right answer graded not_yet, or met with a not-right first sentence that does not affirm. This is the exact rule; the harness has applied it since director6.
- **Wrong called right**: a keyed wrong answer met with an affirmation. This count is new in H1.2.

| Lesson | Turns | Delivered (point said / explain turns) | Answered (keyed) | Verdict given | Contradictions (drawn screens) | Right called wrong | Wrong called right |
|---|---|---|---|---|---|---|---|
| offtopic-c4-ch05-t01 | 23 | 5/5 | 9 | 9/9 | 0 | 0 | 0 |
| offtopic-c5-ch02-t01 | 23 | 3/3 | 11 | 11/11 | 2 | 0 | 0 |
| offtopic-c5-ch02-t02 | 23 | 3/3 | 10 | 10/10 | 0 | 0 | 0 |
| offtopic-c6-ch06-t01 | 23 | 4/4 | 10 | 10/10 | 0 | 0 | 0 |
| steady-c4-ch05-t01 | 41 | 9/9 | 26 | 26/26 | 0 | 0 | 0 |
| steady-c5-ch02-t01 | 41 | 9/9 | 24 | 24/24 | 4 | 0 | 0 |
| steady-c5-ch02-t02 | 41 | 9/9 | 24 | 24/24 | 0 | 0 | 0 |
| steady-c6-ch06-t01 | 41 | 9/9 | 26 | 26/26 | 5 | 0 | 0 |
| steering-c4-ch05-t01 | 25 | 5/5 | 11 | 10/11 | 0 | 0 | 0 |
| steering-c5-ch02-t01 | 25 | 4/4 | 11 | 11/11 | 1 | 0 | 0 |
| steering-c5-ch02-t02 | 25 | 4/4 | 12 | 12/12 | 0 | 0 | 0 |
| steering-c6-ch06-t01 | 25 | 4/4 | 14 | 14/14 | 0 | 0 | 0 |
| stuck-c4-ch05-t01 | 23 | 4/4 | 11 | 11/11 | 0 | 0 | 0 |
| stuck-c5-ch02-t01 | 23 | 3/3 | 11 | 11/11 | 1 | 0 | 0 |
| stuck-c5-ch02-t02 | 23 | 3/3 | 9 | 9/9 | 0 | 0 | 0 |
| stuck-c6-ch06-t01 | 23 | 4/4 | 11 | 11/11 | 0 | 0 | 0 |
| **Total** | **448** | **82/82 (100%)** | **230** | **229/230 (99.6%)** | **13** | **0** | **0** |
| director6 total (code) | 448 | 69/69 (100%) | 228 | 212/228 (93%) | 14 flagged, 0 real | 1 | – |

Scale-gate lines, as far as code can count them:

| Line | director7 | Gate |
|---|---|---|
| Verdicts | 99.6% | ≥ 90% |
| Right called wrong | 0 | 0 |
| Wrong called right | 0 | 0 |
| Contradictions | 13 flags in 11 turns, read below | 0 |

Beats taught (≥ 80%) and the judge axes are for the hand count.

### The one keyed answer without a verdict

steering-c4-ch05-t01: the child answered "3/1", graded `misconception`. Her reply opens "Pichhle sawaal ka jawab 3/4 tha. Aur pehle wale sawaal ka jawab nahi tha." These are give-up reveals of two earlier cards, and the remediation follows them. The not-right verdict for the card just answered was never spoken. This is the director6 "verdict comes second" case surviving when two cards were left at once. Layer: Brain (say.js ordering).

### The 13 contradiction flags (11 turns): read against the drawn board

Unlike director6, whose 14 flags were all checker misreads, these are **real**: a line describes a board that is not the one drawn. There are two causes, both runtime (Brain, with Studio for cause 2).

| Cause | Turns (flags) | Where | What happens |
|---|---|---|---|
| **1. "Yaad karo" recap over a card's own board** | 5 (7) | c5-t01 offtopic T19, steady T23, T65; c6 steady T61 (2), T63 (2) | A check or follow-up card that shows its OWN board (v4 / v2.2) is preceded by an authored recap of a different board: the card's W1 `cardPoint` (a check gets the last explain point; a follow-up gets its remediation say). Examples: "Yaad karo: … 0 se 1 ki ek hi line par teen mark hain: 1/2, 1/4 aur 1/8" over the 1/3 then-card board, and "Yaad karo: Yeh square hai… 6 cm" over a 25 m board and a 9 cm × 5 cm board. |
| **2. Remediation and its then-card in one turn, one board drawn** | 5 (5) | c5-t01 offtopic T17, steering T49, stuck T41, steady T77; c6 steady T49 | The remediation `say` is spoken over its own board (the 1/8, 1/4, 1/2 line; the 7 cm × 3 cm rectangle). The then-card that follows in the same turn describes its own board ("0 se 1 ki line par 1/3 ka mark hai"; the 8 cm × 2 cm bookmark), which is never drawn. |
| (borderline) an explain ask about an imagined line | 1 (1) | c5-t01 steady T73 | The point matches the drawn 6/4 board, but the ask then says "Ab ek alag line socho, jis par har hop 1/2 ka hai". This is a line the child is asked to imagine. Whether this counts is for the judges. |

Proposed fixes, not in this run (the run tree is fixed):
- **Cause 1 (Brain):** a recap (`cardPoint`) is spoken only when the board it describes is the board on screen. When the card shows its own board, only the card is said.
- **Cause 2 (Brain + Studio):** either
  - (a) Studio draws the then-card's board once the remediation line ends (two boards in one turn); or
  - (b) the then-card is posed in its own turn, which costs one turn per miss.

  This is main's call.

## Latency: director6 → director7, by category

Each cell gives: teacher turns · **sequential** (classify + reply, `replyReadyMs`) p50 / p90 · **parallel bound** p50 / p90, in ms. The parallel bound is max(classify, reply) on a turn the model classified (production speculation runs the two together), else their sum.

**How the categories were drawn:**
- director7: the harness `latency` fields (`classifyPath`, `parallelBoundMs`, `rewrite`, `rewriteSkipped`).
- director6 recorded none of these, so its categories are rebuilt from what it did record:
  - a classify call of ≥ 50 ms counts as the model path, since the fast path is in-process (this gives the 324 model turns used in the latency profile);
  - "rewritten" means a guard fired and recorded `afterRewrite`;
  - there was no cut 1, so "skipped" does not apply.

| Category | director6 | director7 |
|---|---|---|
| All turns | 448 · 2990 / 4763 · 1954 / 3508 | 448 · **2681 / 4392** · 2392 / 3812 |
| Classify on the fast path | 124 · 1784 / 3476 · 1784 / 3476 | 289 · 2459 / 4035 · 2459 / 4035 |
| Classify by the model | 324 · 3445 / 5028 · 2080 / 3526 | 159 · 3242 / 4790 · 1835 / 3324 |
| Draft rewritten | 196 · 4045 / 5502 · 3051 / 4101 | 182 · 3816 / 4835 · 3367 / 4373 |
| Rewrite skipped (cut 1) | – | **40** · 1770 / 3417 · 1649 / 2460 |
| No rewrite caught | 252 · 2456 / 3274 · 1525 / 1956 | 226 · 2358 / 2868 · 1689 / 2510 |

Reading:
- **Sequential p50 fell 0.31 s** (2.99 → 2.68 s), and **p90 fell 0.37 s**.
- **Cut 1 fired on 40 turns.** Without it, each of those would have carried a rewrite (director7's rewritten turns: p50 3.82 s); skipped, they ran at a p50 of 1.77 s.
- **The fast path took 289 turns, against 124 in director6.** The H1.2 child answers script cards with keyed forms that classify in-process. That moves turns out of the model path, which is why the whole-run parallel bound is *higher* (2.39 vs 1.95 s): the fast-path turns have nothing to overlap.
  - The fast-path p50 rose (1.78 → 2.46 s) because its mix changed: it now holds the long scripted turns (verdict + close + recap + card) that director6 classified by model.
- **The parallel bound is not the production figure.** Production overlaps classify and reply through speculation, but also adds the distress read and TTS start. The next step is a turn.js replay of these turns (first-audio-ready per turn) to pin it.

## Files

- `<persona>-<topic>.md` and `.json` for each of the 16 lessons, plus `meter.json`.
- Lesson turns: steady 41; offtopic and stuck 23; steering 25.
- Run log notes:
  - `[trace] write failed: DATABASE_URL not set` and `[brief] v2 view not renderable … legacy brief used` repeat throughout. Both are expected with the DB blanked.
  - Neither touched a lesson.
