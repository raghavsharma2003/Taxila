# Round 2 · stream conversation: measured results

2026-10-07. Bar (V5.2): battery ≥ 85%, every intent family ≥ 70%, 0 confusing replies. **The bar is not met.** Below:
what the patches do, measured; then what is still short and why.

## Method

- **Harness:** `evals/conversation-v2/run.mjs` + `judge.mjs` + `rubric.mjs`, unchanged. Same two judges as the
  2026-10-05 baseline: J1 `taxila-gpt6` (gpt-6-sol) and J2 `taxila-mistral-m35`. Same scorer:
  `docs/design/ship5/p5-interaction/battery/score.mjs`.
- **Cases:** 357. The 10 distress cases are measured offline and never sent.
- **Scores:**
  - **strict**: both judges pass. A disputed case counts as a fail. No human adjudication was done.
  - **J1**: judge 1 only.
  - **lenient**: either judge passes.
- **Arms:** two local `server/serve.mjs` instances on the Neon TEST branch, with real Azure models, from the US sandbox.
  - HEAD 617df2b. For every touched file this is identical to prod ee97e9c.
  - HEAD + this stream's patches.
  - Both arms ran **at the same time**, concurrency 2 each, so they saw the same model load.
  - Results are paired by case id.
- **Runs** (the code changed between runs, because each run found something):
  - **A:** patches 01, 02, 04, 05. No key refusal, no drop refusal, no content-request exclusion. The held-out battery ran beside it.
  - **B:** adds the key refusal and the drop refusal.
  - **C:** the final patch set. Near the end of run C the Neon TEST branch began returning `NeonDbError` on both arms
    (HEAD 4 turn errors, patched 80, in the last slots). This coincided with the TEST branch password rotation logged in
    acdcdc3 (07:56 UTC); the local servers still held the old credential. Run C is therefore compared on the **296 cases that produced a
    reply in both arms**.
- **Discarded:** a first attempt ran at concurrency 4 per arm with the owner scripts in parallel. It hit `taxila-fast`
  429 on about 90% of reply calls (967 "reply unavailable" in about 1,070 turns in one arm) and was thrown away.
  Runs A, B and C had **0** reply-model 429s in either arm (server logs).
- **Code metrics:** `evals/conversation-r2/codemetrics.mjs`, over every turn.
  - *bare*: a turn where the child said a case line (probe or setup) and got the card question with fewer than 4 words of her own.
  - *repeat*: Jaccard ≥ 0.8 to an earlier teacher line of the same lesson.
- **Raw data:**
  - `battery/run{A,B,C}-*` (scored.json, score.txt, disputes)
  - `battery/codemetrics-2026-10-07.jsonl`
  - `battery/transcripts-2026-10-07.tgz` (every lesson)
  - `acceptance/`

## Battery

| run | n | arm | J1 | strict | lenient |
|---|---|---|---|---|---|
| A | 355 | HEAD | 65.6% | 56.1% | 71.5% |
| A | 355 | patched | **73.0%** | **59.7%** | **77.7%** |
| B | 355 | HEAD | 64.5% | 54.1% | 68.2% |
| B | 355 | patched | **68.7%** | **58.3%** | **73.8%** |
| C (final) | 296 paired | HEAD | 62.5% | 51.0% | 68.6% |
| C (final) | 296 paired | patched | **69.6%** | **56.8%** | **76.4%** |

Run C including the 10 offline distress cases (n = 306): **52.6% → 58.2%** strict.

**Paired flips.** Each cell is lost / gained, with McNemar χ² in brackets (continuity correction, 1 df; 3.84 = p 0.05).

| | strict | J1 | lenient |
|---|---|---|---|
| A | 34 / 47 (1.78) | 28 / 54 (7.62) | 24 / 46 (6.30) |
| B | 41 / 56 (2.02) | 34 / 49 (2.36) | 33 / 53 (4.20) |
| C | 32 / 49 (3.16) | 28 / 49 (5.19) | 22 / 45 (7.22) |
| pooled, 1,006 pairs | 107 / 152 (**7.47**, p < 0.01) | 90 / 152 (**15.4**) | 79 / 144 (**18.4**) |

**Run-to-run noise.** The same HEAD code scored 56.1%, 54.1% and 51.0% strict on three runs. Run-to-run noise is about
±3 points, so no single run's strict gain is significant on its own; the pooled gain is.

**Families, run C, strict, HEAD → patched** (n per family in brackets):

| family | n | HEAD | patched |
|---|---|---|---|
| A work | 54 | 44.4 | 55.6 |
| B questions | 33 | 51.5 | 69.7 |
| C steering | 92 | 63.0 | 59.8 |
| D attention | 63 | 44.4 | 47.6 |
| E energy | 30 | 66.7 | 66.7 |
| F session | 15 | 60.0 | 73.3 |
| G low-signal | 19 | 26.3 | 47.4 |

**Targeted intents, strict, HEAD → patched, runs A and B (n = 355 each):**

| intent | run A | run B |
|---|---|---|
| noise | 3/5 → 5/5 | 3/5 → 4/5 |
| frustration | 0/8 → 3/8 | 0/8 → 3/8 |
| out_of_bounds | 3/12 → 5/12 | 2/12 → 4/12 |
| adult_voice | 0/4 → 1/4 | 0/4 → 2/4 |
| insistence | 3/10 → 6/10 | 1/10 → 3/10 |
| boredom | 0/8 → 2/8 | 2/8 → 2/8 |
| animation_request | 2/5 → 1/5 | 2/5 → 2/5 |
| multi_intent | 0/8 → 0/8 | 0/8 → 1/8 |
| answer_partial (grading: truth stream) | 1/5 → 1/5 | 1/5 → 1/5 |

**Code metrics.** Bare is the defect the lead slot targets.

| run | bare (child case lines) | repeat J ≥ 0.8 (all turns) |
|---|---|---|
| A, HEAD → patched | 18/365 → **6/365** | 21/1,108 → **9/1,110** |
| B, HEAD → patched | 15/365 → **8/365** | 30/1,108 → **12/1,113** |
| C, HEAD → patched | 14/320 → **11/313** | 24/966 → **7/954** |

## Held-out battery (n = 77, beside run A)

- 78 new utterances in `evals/conversation-r2/heldout-cases.mjs`.
- Checked to share no text with the battery, and weighted to the weakest families.
- Same harness and judges.
- Honest limit: the same agent wrote them, after the code but before any run.

| arm | J1 | strict | lenient |
|---|---|---|---|
| HEAD | 53.2% | 35.1% | 61.0% |
| patched (run A code) | 70.1% | **57.1%** | 74.0% |

Paired strict: 6 lost / 23 gained, McNemar 8.83 (p ≈ 0.003).

## Owner scripts and acceptance

All local runs are n = 1 per arm, with both arms running at the same time. Patch 04's corrected owner-4 checker scored
both arms.

| script | run A HEAD | run A patched | run B HEAD | run B patched |
|---|---|---|---|---|
| owner-2, seed 157001, 90 turns: defects (turns) | 9 (7) | 7 (7) | 5 (4) | 8 (6) |
| owner-4 steering | 14/16 | **15/16** | 16/16 | 16/16 |
| p5-interaction-acceptance | 41/42 (3/37 card-only) | **42/42** | 41/42 (4/37) | 41/42 (2/37) |
| round2-conversation (held-out phrases) | 26/31 | (cut by a server restart) | 28/31 | **31/31** |

**owner-2:** 14 defects in total on HEAD vs 15 patched over two runs. **No improvement is shown on owner-2.** The defects
left in the patched arm:

- **R3 bare after a wrong answer, "pata nahi", "i don't know" or "nahi samjha" (4-5 per run).** These turns carry no
  request. Either the bare guard did not fire or its repairs failed; the owner transcript does not record which (see
  "Still short" 4).
- **R6 gutted explain turns** (not this stream's guard).
- **One R2 fixed line.**

**round2-conversation on taxila.dev (prod = HEAD):** 28/30.

- B, "uh the the second one with the": the regex missed prod's "ek baar phir kahiye". That was a checker false negative,
  and the regex is now widened.
- D: the second turn after "Hindi mein samjhaiye" is mixed English.

For comparison, prod on 2026-10-06 (`ms-ship5-prod-2026-10-06`): owner-2 had 11 defects in 90 turns, owner-4 14/16 and
p5 41/42. Nothing here is deployed.

## Safety

- Persona invariants: 70/70 on the patched copy.
- Distress: 10/10 offline in every run. The predicate is unchanged.
- **Answer reveals** (both judges say the reply gives the answer, over the reveals and gives checks):

  | run | HEAD | patched | note |
  |---|---|---|---|
  | A | 1 | 2 | |
  | B | 1 | **4** | |
  | C (final) | 1 | 1 | the same kit "example" case in both arms |
  | held-out | 0 | 0 | |

  Run B's excess came from the lead slot: "Nimbu ka ras, dahi aur imli mein acid hota hai"; an example whose result was
  the key; and run A's "36 even hai". Three fixes followed: the key refusal, keeping content requests out of the slot,
  and removing "fully / what they asked for" from the note. Run C with the final code is back to HEAD's level.
  **n is small:** this needs watching on prod (see the reversal condition in `context/inbox/conversation.json`).
- Two battery utterances get the helpline line in both arms: "i can't do this" and "prank so he cries". That is the
  safety predicate, which this stream does not touch.

## Related test suites

- 37 related suites ran in one process on the HEAD copy and on the final patched copy: director, brain, compile, p5,
  persona, safety, lesson, owner, request, trace and budget. Both copies show the same 13 failures, which are
  pre-existing in a scratch copy without `public/`, `art/` and parts of `evals/`. There are **0 new failures**.
- The stream adds 17 unit tests.

## Still short of the bar, and exactly why

1. **Overall strict is 57-60%, not 85%; lenient is 74-78%.** The lead slot fixed the defect it targets: bare dropped from
   14-18 to 6-11 and repeats roughly halved. Most remaining failures are what she chooses to say, not that defect:

   | intent | strict | why it fails |
   |---|---|---|
   | multi_intent | 0-1/8 | Two asks in one line. The Director reads one request per turn; this needs a multi-request move, not wording. |
   | dont_know, frustration | 1/6, 3/8 | The judges want a smaller step. The hint ladder's first rung is often the same question reworded. |
   | out_of_bounds, boredom | 4-5/12, 2/8 | The decline / re-engage move re-poses the same card question; the rubric wants a new hook. |
   | end_request | 5/12 | The check-in vs end rule is owner policy (F7). |
   | animation | 1-2/5 | Nothing that moves is mounted for most topics. Words cannot fix a missing engine. |

2. **Strict is bounded by judge disagreement.** κ is 0.72-0.74, and 50-55 disputed cases per run were left unadjudicated
   (counted as fails). A human pass over the disputes would move strict. It was not done.
3. **No family is at 70% strict in every run.**
   - Run C patched: B questions reached 69.7% and F session 73.3%, on n = 33 and n = 15.
   - D attention (48%) and G low-signal (47%) are the furthest from the bar.
4. **"0 confusing replies" is not met.**
   - owner-2 still has R3 bare questions after a wrong answer or "pata nahi". On those turns the move carries no request,
     so they reach the slot only through the re-pose path. The owner transcript has no guard field, so it cannot show
     whether the bare check fired or its repairs failed. Not isolated.
   - One R2 fixed line on "bhai kuch samajh nahi aaya haha" reproduces on prod and locally with **no** 429. It is a
     floor, stage or units replacement on an item-less explain turn. The cause was not isolated.
5. **429 resilience.** The reply lane has no failover deployment in code: MODEL-STACK §1.2 lists `taxila-mistral-m35` as
   "routed, no code path".
   - Patch 05 makes an outage turn that has a card question say something true instead of a bare re-ask.
   - An item-less turn still ships the fixed "say that again" line.
   - A real failover belongs in `server/azure.js`, which is not this stream's path.
6. **Measured locally, not on taxila.dev.** Nothing is deployed. The acceptance file runs against both, and the prod
   baseline is above.
