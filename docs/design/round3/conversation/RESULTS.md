# Round 3 · stream conversation: measured results

2026-10-09. The bar (V5.2): battery ≥ 85 %, every intent family ≥ 70 %, 0 confusing replies. The brief also asks for the
guard-rewrite rate to come down toward 10 %. **None of these numbers is the owner's ear.** Every number below is two model
judges, or code reading the server's own debug, run on a local server with simulated children. The labels say so each time.

**Short verdict.**
- The reply path now gets the turn right the first time far more often. On the full battery (local), the guard-rewrite
  rate fell 37.8 % → 20.5 % (1,051 / 1,032 model turns). On the held-out set it fell 26.7 % → 13.5 %. Turns that still
  carry a problem when they ship fell 16.0 % → 7.0 %. Reply model calls per turn fell 1.56 → 1.33, and the reply stage's
  p90 fell 3.76 s → 3.07 s.
- The judged battery moved from **57.5 % to 60.1 % strict** (n = 353 paired; McNemar 0.7, not significant). The
  held-out set moved from **54.8 % to 68.5 % strict** (n = 73; McNemar 3.12, p ≈ 0.08, not significant). Both are far
  below the 85 % bar. Six of seven families are still below 70 % strict.
- The bar is not met. The section "Still short" at the end gives the reasons.

## Method

- **Harness:** `evals/conversation-r3/run.mjs`. It is the conversation-v2 runner byte for byte (schedule, case filling,
  fillers, recovery turns, safety gate) plus the server's debug read of every turn: guard codes on the first draft,
  rewrite or repair, verdict, note and model-call timings. Only a LOCAL server serves that debug read. Judges:
  `evals/conversation-r3/judge.mjs`, which is v2's judge with v2's rubric unchanged. J1 is `taxila-gpt6` (gpt-6-sol, low
  effort) and J2 is `taxila-mistral-m35`. Scoring is as in round 2:
  - **strict:** both judges pass the case. A judge that failed to answer falls back to the other.
  - **J1:** J1 alone.
  - **lenient:** either judge passes it.

  There was no human adjudication. Paired comparison is `evals/conversation-r3/compare.mjs`: pairs by case id, McNemar
  with continuity correction, 3.84 = p 0.05. Code metrics are `evals/conversation-r3/codemetrics.mjs`, over every turn.
- **Cases:** the v2 battery, 357 cases. 10 distress cases are offline (from the prescreen on the HEAD tree; 0 non-offline
  cases withheld). Plus the round-2 held-out set, 78 cases (`evals/conversation-r2/heldout-cases.mjs`, same harness).
- **Arms:** run at the same time, concurrency 2 each, seed 7, the same lesson plan. Two local servers (`server/serve.mjs`)
  with `NODE_ENV=production`, the Neon TEST branch and prod model routing: classify `grok-4-1-fast-non-reasoning` with
  the 1.5 s hedge, reply `taxila-fast`, note `taxila-gpt6`, prefetch off. Traffic went from the US sandbox through the
  agent proxy.
  - **HEAD** = `git archive` of cadf527. Every `server/` file is identical to prod 145996f, and to today's HEAD 566b28b
    for every file the patches touch.
  - **patched** = HEAD + patches 01-04. Pair 1 measured scratch freeze `1af2a6c`, pair 2 measured freeze `b78808e`. The
    shipped patches are `b78808e`.
- **Differences from prod:** the Neon HTTP driver instead of pg over TCP (the sandbox proxy carries HTTPS only), one
  process, and a CPU-starved host: load average 15-25 on 4 cores from other streams' jobs during the runs. **Absolute
  latencies are inflated; both arms shared the same load.**
- **Run-to-run noise:** the same HEAD code scored 56.1 / 54.1 / 51.0 % strict on three round-2 runs (±3 points). In pair
  1, 41 cases flipped one way and 50 the other, for a net gain of +9.

## Diagnosis (before any change)

`evals/conversation-r3/results/base-head-1`: HEAD, local, 687 turns with debug (partial run, unjudged).

- **35.2 % of turns were rewritten by the guards, and only 51.2 % of first drafts were clean.** 123 of 234 probe turns
  were rewritten. Codes caught on first drafts: ask 186, drift 158, flat 94, noconfirm 40, wrap 33, parts 32, leak 22,
  nowhy 17.
- **Causes, in order:**
  1. **The first pose of a question was a two-job turn.** One call had to bridge from what the child said AND pose the
     kit question as written. The model re-worded the question (drift), asked its own follow-up (ask, twoq) or said
     goodbye mid-lesson (wrap).
  2. **Two guards disagreed with each other.** `drift` demanded half the full prompt's content words on a re-pose that
     ended on the card's own form.
  3. **The repair ladder could end bare.** The lead repair was barred after any leak catch, so a leak on a re-pose ended
     in the bare question. 4 of 14 identifiable leaks were the key number used as a group count ("3 drumsticks").
  4. **Guards read the wrong thing.** Agreeing to a request ("Sure, …") was counted as praise of an answer. A kit
     question in instruction form ("…lagao.") was "flat". An answered item's own parts were "parts" contradictions.
  5. **Recited notes:** "sensible" 5 replies, the park's "different thing", the frustration line.
  6. **Thin moves for some intents:** a share was dropped, questions about her were parked, the stop check-in offered no
     choice.

## Pair 1: full battery, freeze 2 (patches 01-04 as of 1af2a6c)

`evals/conversation-r3/results/final-head`, `final-after`; `compare-final.json` / `.md`.

| score | HEAD | patched | lost / gained | McNemar |
|---|---|---|---|---|
| strict | 203/353 (57.5 %) | 212/353 (60.1 %) | 41 / 50 | 0.70 |
| J1 | 254/353 (72.0 %) | 251/353 (71.1 %) | 37 / 34 | 0.06 |
| lenient | 281/353 (79.6 %) | 273/353 (77.3 %) | 36 / 28 | 0.77 |

| family | n | HEAD strict | patched strict | HEAD J1 | patched J1 |
|---|---|---|---|---|---|
| A work | 64 | 46.9 | 53.1 | 62.5 | 62.5 |
| B questions | 34 | 64.7 | 58.8 | 79.4 | 79.4 |
| C steering | 113 | 61.9 | 55.8 | 78.8 | 67.3 |
| D attention | 71 | 54.9 | 69.0 | 62.0 | 77.5 |
| E energy | 32 | 62.5 | 62.5 | 75.0 | 65.6 |
| F session | 17 | 70.6 | 94.1 | 88.2 | 94.1 |
| G low-signal | 22 | 45.5 | 45.5 | 68.2 | 72.7 |

Largest intent moves, strict: end_request 7→11/12, change_topic 4→7/8, joke 4→7/8, out_of_bounds 2→5/11,
method_instruction 5→8/12, curiosity_offlesson 7→9/9, insist_wrong 2→4/6; slower 4→1/6, example 5→3/8, clarify 5→3/11,
answer_hedged 4→2/6.

**What the C-steering J1 drop (−13 cases) was.** Every lost case was read, and they are traced in
`evals/conversation-r3/results/final-*/probes.json` (dbg).
- **2 caused by this stream, fixed in freeze 5:** "ye wala skip karo" and "isko chhodo dusra do" had no code reading.
  The classifier's stop flag turned the skip into the stop check-in ("you want to stop"). HEAD did the same to "next
  question please" in its own run.
- **3 caused by HEAD rules that also fire on HEAD, fixed in freeze 5:**
  - The card cap overrode "can you repeat the question?" and "explain it another way" with "leave it for later; then
    the next question". This happened on 15 probes per arm.
  - `lastQuestionOnly` cut "…tareeka badlein: game, picture, ya quick challenge? Kaunsa chunogi?" to "Kaunsa chunogi?"
    (2 boredom turns).
- **1 model call failed:** "Ek second, meri baat atak gayi".
- **1 rewrite after a `stage` catch left only the question.**
- **The rest are model variance in the same direction as the gains elsewhere.** For example, "itna fast mat bolo" got a
  promise to slow down with no smaller step on one arm and a smaller step on the other, on the same code path.

## Held-out (round 2's 78 unseen cases), freeze 2

`evals/conversation-r3/results/heldout-head`, `heldout-after`; `compare-heldout.json` / `.md`. Disclosure: before the
run, 3 of its multi_intent lines were seen (by grep). No change was made for them.

| score | HEAD | patched | lost / gained | McNemar |
|---|---|---|---|---|
| strict | 40/73 (54.8 %) | 50/73 (68.5 %) | 8 / 18 | 3.12 |
| J1 | 54/73 (74.0 %) | 56/73 (76.7 %) | 7 / 9 | 0.06 |
| lenient | 56/73 (76.7 %) | 60/73 (82.2 %) | 4 / 8 | 0.75 |

Families, strict (n): A 41.7 → 41.7 (12), B 33.3 → 33.3 (6), C 55.6 → 66.7 (18), D 68.4 → 94.7 (19), E 50 → 50 (6),
F 0 → 50 (2), G 70 → 90 (10). The families are too small here to read one by one.

## Code metrics (every turn; local; the server's own debug)

| metric | battery HEAD | battery patched | held-out HEAD | held-out patched |
|---|---|---|---|---|
| model turns with a reply | 1,051 | 1,032 | 475 | 459 |
| **rewritten by the guards** | **37.8 %** | **20.5 %** | **26.7 %** | **13.5 %** |
| first draft clean | 47.4 % | 73.6 % | 66.3 % | 83.9 % |
| repaired in code only | 14.8 % | 5.7 % | 6.7 % | 2.6 % |
| lead-slot turns | 24.1 % | 45.9 % | 28.2 % | 50.8 % |
| a guard code still on the shipped turn | 16.0 % | 7.0 % | 11.2 % | 4.8 % |
| bare re-pose (only the question) | 7/365 | 4/364 | 1/79 | 0/76 |
| a line she already said (J08) | 9 | 3 | 2 | 0 |
| fixed fallback line shipped | 5 | 4 | 6 | 0 |
| "sensible" recited | 13 | 0 | 2 | 0 |
| praise words on a not-correct verdict | 4 | 0 | 0 | 0 |
| same two opening words as her previous turn | 3.5 % | 2.8 % | 2.5 % | 1.1 % |
| opens "Theek hai" | 13.1 % | 10.8 % | 4.8 % | 5.4 % |
| her own words per turn, p50 / p90 | 19 / 28 | 19 / 26 | 19 / 27 | 19 / 26 |
| reply model calls per turn | 1.56 | 1.33 | 1.45 | 1.24 |
| reply stage p50 / p90 (s) | 1.62 / 3.76 | 1.43 / 3.07 | 1.33 / 3.67 | 1.33 / 2.83 |
| server turn p50 / p90 (s) | 3.07 / 5.00 | 2.77 / 4.55 | 2.82 / 5.07 | 2.75 / 4.32 |

Guard codes still caught on patched first drafts (battery): ask 62, praise 44, flat 42, twoq 37, nowhy 33, leak 29,
parts 27, drift 27, noconfirm 18. 44 praise catches were mostly the wider praise pattern firing on filler bridges
("Haan, bilkul sahi socha…" after "hmm"). Freezes 3-4 answered that with a no-answer bridge note and a rewrite reason
that is not recited. Freeze 5b then dropped this stream's own praise pattern in favour of truth patch 04 (APPLY.md).

## Pair 2: full battery, freeze 5b (the shipped patches) with a second HEAD sample

PENDING

## Owner scripts and acceptance (local, one lane per arm)

PENDING

## Prod (taxila.dev = HEAD 145996f) before

`tests/prod/round3-conversation.mjs` on taxila.dev: **22 / 26** checks
(`docs/design/round3/conversation/acceptance/prod-taxila.dev-round3-conversation-before.txt`). The 4 failures:
- B: a question about her was deferred (owner-2 R7.defer).
- C: the share was not kept for later.
- F: a give-up was read as "another way", not frustration.
- H: "sensible" was recited: "Zoya, paani peena sensible break hai".

The patched tree is not deployed, so there is no prod "after".

## Unit and gate runs

PENDING

## Safety

- scanSafety and the model distress read are unchanged and run on every committed turn. Distress 10/10 offline cases
  were withheld in both arms by the prescreen, as designed.
- **False safeguards in both arms, caused by the content filter or distress read, not by this stream:**
  end_request-03 "i'm done" took the safeguard move on HEAD and on patched. In earlier runs HEAD also safeguarded
  "चित्र बनाकर दिखाइए", and the floor caught a plain "ठीक है". These are reported for the safety owner. Nothing here
  changes that path.
- Persona invariants: 70/70 on HEAD, on HEAD + patches, and on HEAD 566b28b + truth 01-07 + these patches (the copied
  script imports the scratch tree's server).
- NEVER MANIPULATE:
  - The stop check-in must now offer a choice.
  - A "haan" after "you want to stop" may end the lesson (letting them go is allowed).
  - No streaks, guilt or come-back hooks were added.
  - The share uptake never names a feeling (MS CoC restriction 12).
- TEST accounts: one patched TEST account could not be erased (409 erase_review), and runs stopped mid-way left some
  `@taxila.test` guardians on the Neon TEST branch (the leftover check reads 73-78). Nothing touched prod.

## Still short of the bar, and why

PENDING

## Incident during this stream

At about 13:27 UTC, a chained command meant for a throwaway scratch copy ran `git stash; git reset --hard;
git clean -fd` in `/home/user/Taxila`. An earlier step in the chain had failed, so the `cd` into the scratch dir never
happened. `git stash pop` restored all 53 tracked modifications, with no conflict. Untracked files written before then
were deleted: this stream's own `compare-heldout.*` (regenerated) and `evals/duplex-r3/results/fdb-r3-abl-hs600.json`.
The main loop and the duplex, voicesig and play agents were told at once. Play confirmed nothing of theirs was lost, but
one of their harness builds ran during the stash window and had to be rebuilt. The lesson is logged as a rejection in
the inbox: never chain a `cd` into a destructive git command; use `git -C <dir>` with an absolute path.
