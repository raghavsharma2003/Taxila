# Round 2 · stream conversation: measured results

2026-10-07. Bar (V5.2): battery ≥ 85%, every intent family ≥ 70%, 0 confusing replies. **The bar is not met.** What the
patches do, measured, is below; what is still short and why is at the end.

## Method

- **Harness:** `evals/conversation-v2/run.mjs` + `judge.mjs` + `rubric.mjs`, unchanged, the same two judges as the
  2026-10-05 baseline (J1 `taxila-gpt6` gpt-6-sol, J2 `taxila-mistral-m35`), the same scorer
  (`docs/design/ship5/p5-interaction/battery/score.mjs`). 357 cases; 10 distress cases are measured offline (never sent).
  **strict** = both judges pass (a disputed case counts as a fail; no human adjudication was done), **J1** = judge 1 only,
  **lenient** = either.
- **Arms:** two local servers (`server/serve.mjs`) on the Neon TEST branch with real Azure models, from the US sandbox:
  HEAD 617df2b (= ee97e9c for every touched file) vs HEAD + this stream's patches. Both arms ran **at the same time**,
  concurrency 2 each, so both saw the same model load. Paired by case id.
- **Runs:** run A (patches 01, 02, 04, 05; without the key and drop guards in `compose.js`), run B (the final patch set).
  The held-out battery ran beside run A.
- **Discarded:** a first attempt at concurrency 4 per arm with the owner scripts in parallel hit `taxila-fast` 429 on
  ~90% of reply calls (967 "reply unavailable" in ~1,070 turns in one arm) and was thrown away. Runs A and B had **0**
  reply-model 429s in either arm (server logs).
- **Code metrics** (`evals/conversation-r2/codemetrics.mjs`, over every turn): *bare* = a turn where the child said a
  case line (probe or setup) answered with the card question and < 4 words of her own; *repeat* = Jaccard ≥ 0.8 to an
  earlier teacher line of the lesson.

## Battery (n = 355 cases per arm per run)

| run | arm | J1 | strict | lenient |
|---|---|---|---|---|
| A | HEAD | 65.6% | 56.1% | 71.5% |
| A | patched | **73.0%** | **59.7%** | **77.7%** |
| B | HEAD | 64.5% | 54.1% | 68.2% |
| B | patched (final) | **68.7%** | **58.3%** | **73.8%** |

Paired flips (lost / gained, McNemar χ² with continuity correction, 1 df; 3.84 = p 0.05):

| | strict | J1 | lenient |
|---|---|---|---|
| run A | 34 / 47 (1.78, n.s.) | 28 / 54 (7.62) | 24 / 46 (6.30) |
| run B | 41 / 56 (2.02, n.s.) | 34 / 49 (2.36, n.s.) | 33 / 53 (4.20) |
| pooled A+B (710 pairs) | 75 / 103 (4.10) | 62 / 103 (9.70) | 57 / 99 (10.8) |

The same HEAD code scored 56.1% and 54.1% strict on two runs an hour apart: **run-to-run noise is about ±2 points**,
which is why each single run's strict gain is not significant and the pooled one is (p ≈ 0.04).

Families, strict, run B HEAD → patched: A work 50.0 → 56.3 · B questions 62.9 → 62.9 · C steering 60.2 → 60.2 ·
D attention 48.6 → 55.6 · E energy 56.3 → 65.6 · F session 58.8 → 58.8 · G low-signal 31.8 → 45.5.
Run A: A 53.1 → 59.4 · B 57.1 → 54.3 · C 62.8 → 62.8 · D 52.8 → 59.7 · E 50.0 → 65.6 · F 76.5 → 64.7 · G 31.8 → 40.9.

Targeted intents (strict, HEAD → patched; run A | run B): noise 3/5 → 5/5 | 3/5 → 4/5 · frustration 0/8 → 3/8 | 0/8 → 3/8
· out_of_bounds 3/12 → 5/12 | 2/12 → 4/12 · adult_voice 0/4 → 1/4 | 0/4 → 2/4 · insistence 3/10 → 6/10 | 1/10 → 3/10
· boredom 0/8 → 2/8 | 2/8 → 2/8 · animation_request 2/5 → 1/5 | 2/5 → 2/5 · multi_intent 0/8 → 0/8 | 0/8 → 1/8 ·
answer_partial 1/5 → 1/5 | 1/5 → 1/5 (grading: truth stream).

Code metrics (the defect the lead slot targets):

| | bare (of 365 child case lines) | repeat J ≥ 0.8 (of ~1,110 turns) |
|---|---|---|
| run A HEAD → patched | 18 → **6** | 21 → **9** |
| run B HEAD → patched | 15 → **8** | 30 → **12** |

## Held-out battery (n = 77, beside run A)

78 new utterances (`evals/conversation-r2/heldout-cases.mjs`), checked to share no text with the battery, weighted to the
weakest families. Same harness and judges. Honest limit: written by the same agent, after the code, before any run.

| arm | J1 | strict | lenient |
|---|---|---|---|
| HEAD | 53.2% | 35.1% | 61.0% |
| patched (run A code) | 70.1% | **57.1%** | 74.0% |

Paired strict: 6 lost / 23 gained, McNemar 8.83 (p ≈ 0.003).

## Owner scripts and acceptance, local (n = 1 run each, both arms at the same time)

Run A (patched = run A code; owner-4 scored with patch 04's corrected checker on both arms):

| script | HEAD | patched |
|---|---|---|
| owner-2 seed 157001, 90 turns | 9 defects on 7 turns (R3 ×5, R7 ×2, R4, R6) | 7 on 7 (R3 ×4, R6 ×2, R2) |
| owner-4 steering | 14/16 (S.hindi ×2: not Hindi; Hindi one turn only) | **15/16** (S.example ×1) |
| p5-interaction-acceptance | 41/42 (3/37 card-question-only) | **42/42** |
| round2-conversation (held-out phrases) | 26/31 (B unclear ×3, E bare 1/40, leftover-guardians) | cut by a server restart, rerun in run B |

Run B (final code): see the table appended below when it completes.

For comparison, prod (taxila.dev, 2026-10-06, `ms-ship5-prod-2026-10-06`): owner-2 11 defects / 90 turns, owner-4 14/16,
p5 41/42. Prod was not re-run: nothing here is deployed.

## Safety

- Persona invariants 70/70 on the patched copy. Distress 10/10 offline in every run (the predicate is unchanged).
- Answer reveals (both judges say the reply gives the answer): run A 1 → 1 (the same "example" case in both arms);
  held-out 0 → 0. One real leak was found in run A's patched arm (ask_for_answer-05: "36 even hai, kyunki ...") and
  closed by the key refusal (`rj-conv-fixed-lead-without-key-check`); run B (with the refusal) is the arm to check.
- Two battery utterances still get the helpline line in both arms ("i can't do this", "prank so he cries"): that is the
  safety predicate, which this stream does not touch.

## Related test suites

37 related suites (director, brain, compile, p5, persona, safety, lesson, owner, request, trace, budget), one process, on
the HEAD copy and the final patched copy: the same 13 failures on both (pre-existing in a scratch copy without `public/`,
`art/` and parts of `evals/`), **0 new failures**, plus the stream's 16 unit tests.

## Still short of the bar, and exactly why

1. **Overall 58-60% strict, not 85%.** The lead slot fixed the defect it targets (bare 15-18 → 6-8, repeats roughly
   halved), but most remaining failures are not that defect: they are what she chooses to say. Biggest remaining
   intents: multi_intent 0-1/8 (two asks in one line — the Director reads one request per turn; this needs a
   multi-request move, not wording), dont_know 1/6 and frustration 3/8 (the judge wants a smaller step; the hint ladder's
   first rung is often the same question reworded), out_of_bounds 4-5/12 and boredom 2/8 (the decline-and-re-engage move
   re-poses the same card question; the rubric wants a new hook), end_request 5/12 (the check-in vs end rule is owner
   policy, F7), animation 1-2/5 (nothing moving is mounted for most topics; the words cannot fix a missing engine).
2. **Strict is bounded by judge disagreement.** κ 0.72-0.74, 50-55 disputed cases per run left unadjudicated (counted
   as fails). Lenient is 74-78%. A human pass over the disputes would move strict; it was not done.
3. **No family is at 70% strict.** Best: E energy 65.6%. Worst: G low-signal 41-46% (noise is fixed, the rest of G is
   dont_know / thinking_aloud / backchannel, see 1).
4. **"0 confusing replies" is not met.** owner-2 still has R3 bare questions after a wrong answer or "pata nahi" (turns
   with no request and no re-pose, so the slot is not used) and one R2 fixed line on "bhai kuch samajh nahi aaya haha"
   that reproduces on prod and locally with **no** 429: a floor/stage replacement on an item-less explain turn; the cause
   was not isolated (no guard in the owner transcript).
5. **429 resilience.** The reply lane has no failover deployment in code (MODEL-STACK §1.2 lists `taxila-mistral-m35` as
   "routed, no code path"). Patch 05 makes an outage turn with a card question say something true instead of a bare
   re-ask, but an item-less turn still ships the fixed "say that again" line. A real failover belongs in `server/azure.js`
   (not this stream's path).
6. **Measured locally, not on taxila.dev.** Nothing is deployed; the acceptance file runs against both.
