# Duplex v2: adversarial critique, fixes and re-measurement (2026-10-04)

Critic workstream, 2026-10-04. Read with [TAXILAFDB.md](TAXILAFDB.md), [ENGINE-MODEL.md](ENGINE-MODEL.md) and
[INTEGRATION.md](INTEGRATION.md). The build plan that follows from this is in [PLAN.md](PLAN.md).

**Labels:** [M] means measured here, with n, method and date. [E] means estimate. [T] means taken from another file in the repo.

**Spend:** $0. Every run is L1 CPU simulation on the TaxilaFDB streams already rendered. No paid call, no AWS. Nothing
was committed or pushed, no Wave 2 file was touched and no secret was printed.

---

## 1. Verdict

1. **The engine is real, not a silence timer in disguise.** Ablation: the same governor with a 640 ms silence engine
   behind it (`silence-640-gov`) still cuts off 75.8% of thinking pauses on the fast lane. Stage A cuts off 0-2.3%.
   The estimate does the work, not the vetoes.
2. **It is Griffin-shaped in its decisions, not yet in its perception.**
   - Decisions are continuous: a 100 ms tick plus an event tick, and the action set SPEAK / HOLD / BACKCHANNEL / REACT /
     YIELD / KEEP_TALKING / CUT_IN.
   - Three perception channels are still a timer or a gate:
     - **Today's transcriber (D4).** Every turn end waits for the words. 0% of decisions come within 300 ms of the child's
       last voice, gap p50 1.17 s.
     - **Barge-in.** The yield waits for a 600 ms / 1 s sustained-voice rule: p50 760-1,207 ms against a ≤ 200 ms bar.
       Only the duck, at 38-70 ms, is Griffin-fast.
     - **Uncertain turns.** 26% of reply-worthy turn ends are still decided by the silence backstop.
3. **The benchmark flatters the engine in four ways (§2).** The heaviest is that the simulated transcriber returns the
   script word for word. With transcription errors at the rate the real transcriber made on these same streams:
   - **Every arm misses distress lines:** 68/84 caught.
   - **Stage A degrades but keeps its lead.** Missed replies go 8.7 → 15.3%. Cut-offs stay ≤ 1.6%.
4. **Four runtime defects were found and fixed in the duplex modules (§4), plus one world bug.** After the fixes, on the
   test split:
   - cut-offs 2.3 → 0.0% (fast lane) and 2.6 → 0.1% (D4);
   - verdicts on a repaired value 3-4/40 → 0/40;
   - non-safety speech after distress 1-2/84 → 0/84;
   - her own echo in reply texts 51% → 0%.
   - **Read with care:** two of the four fixes were diagnosed on test streams (§4), so the test split is no longer fully
     held out.
5. **Shy / slow children and noisy phones are the open risk.** With every pause 1.6× longer, stage A cuts off 8.2%
   (silence-640: 95.9%). Verdicts on repaired values come back (13/40), because the verdict delay is a timer. On a noisy
   phone or with a quiet child, 15-19% of replies come late.
6. **Not ready for children until the safety predicate can survive real transcripts.** That predicate is
   `server/director/safety.js`, outside this workstream's paths. Every arm, today's cascade included, misses 16/84 distress
   lines once one word is mis-heard or the segment is hallucinated in another script. This is the first blocker in PLAN.md.

---

## 2. Is the simulator biased toward the engine?

| # | bias | evidence [M] | effect | what was done |
|---|---|---|---|---|
| B1 | **The STT returns the script verbatim** (0% WER, every filler kept, every hold word spelled as the lexicon expects) | The L2 run's real gpt-live-transcribe finals on 48 of the same test streams (`/tmp/taxila-fdb/runs/live-events.json`, 2026-10-04): **42/90 aligned child segments verbatim (47%)**, 77% of script tokens survive as exact strings, **5/90 segments hallucinated in another script** (Japanese, Telugu, Korean, Bengali), "दीदी"→"दीजिए" 2/3, "हम्म"→"हम", "उम्म"→"अम्मा", "umm"→"हाँ", "सात"→"साथ", English inside Hindi written in Devanagari | Lexical markers and the safety predicate get a free pass | `evals/duplex/critic/perturb.mjs sttReal`, calibrated to those rates [E]: 6% token garble, 5% segment hallucination, fillers dropped 35% / mutated 30%, "दीदी"→"दीजिए" 50%, English-in-Hindi transliterated. Results in §3 |
| B2 | **The pause mix is designed, not sampled** | test thinking pauses p50 840 ms, p90 2,500 ms; 26% < 640 ms; drift pauses are 31% of them | inflates every silence arm's cut-off rate | §3 also reports cut-offs **re-weighted to the runtime's own band prior** (B3 hold pauses lognormal p50 600 / p90 1,600 ms [E]). silence-640 drops 82.8 → 68.7%; stage A stays 0.0%. **The conclusion holds** |
| B3 | **Voices are two pitch-shifted adult TTS voices**, clean prosody, fillers spoken as words | TAXILAFDB §2.2 | prosody and level are too regular | frame-level `slow` (pauses ×1.6), `quiet` (child −12 dB, f0 lost under noise +6 dB) and `phone` (SNR 6 dB plus aperiodic clatter bursts every ~3 s) perturbations [E]. They are not real children |
| B4 | **One author wrote both the lexicon and the templates** | test families are held out, but their phrases are not. A test-only phrase the lexicon lacks, "मतलब मैं confuse हूँ", leaves F3.question_mid answered by the 2.5 s backstop 32/40 times on the fast lane. Pure Hindi is **12 thinking pauses** (3/12 cut, n too small) | rules look better than they will be | not fixed: fixing a phrase seen on test would contaminate it further. TaxilaFDB v2 needs a second author and real transcripts (PLAN §4) |
| B5 | **Labels that go easy on early uptakes** | a takeover in the "repair" pause right after a wrong value is not a cut-off; it is reported as M11 repair collision (57.5% on the fast lane) | the owner allows a non-verdict uptake, but children will hear her talk over their self-correction | reported. PLAN ET-3 tests it with listeners |
| B6 | **Open loop, no codec, no real echo canceller** | TAXILAFDB §5 | barge-in and echo are optimistic | duck latency added to the metrics; real echo goes to PLAN ET-1 |
| B7 | **World bug: a safety yield did not cancel a pending reply** | `world.mjs` only cancelled on "revoke". 1-2/84 "unsafe" counts were replies that could never play | pessimistic for every arm | fixed in `world.mjs`. The actuator contract it relies on becomes a PLAN acceptance test (W2.5-3) |
| B8 | **The metric counts a post-offer wait-time-I nudge in a 15 s+ hold as a hold violation** | under `slow`, all 16/48 pre-fix stage A hold violations on the fast lane were `hold_long` → `wt1_nudge` after the in-policy 15 s offer | stage A looks worse than it is | reported, metric left as is for comparability |

**Reproduction.** `node evals/duplex/taxilafdb/run.mjs --arms cascade-900,silence-640,smart-turn-0.5,stage-a` on the
pre-fix tree (hash `1d138d3168bf`) reproduced `taxilafdb-test-final3` **exactly** on every arm, D4 and FAST
(`evals/duplex/results/taxilafdb-critic-repro-2026-10-04.json`, 291 s) [M]. The simulator is deterministic.

---

## 3. Head to head under stress

Method [M]:
- **Harness:** `node evals/duplex/critic/stress.mjs --conds base,sttReal,slow,quiet,phone,sttReal+slow+phone --arms
  stage-a,silence-640,cascade-900,silence-640-gov --lanes D4,FAST`.
- **Set:** the TaxilaFDB test split, 960 streams (732 thinking pauses, 528 reply-worthy ends, 84 distress lines, 40
  repairs, 48 holds).
- **World:** perturbations are world-side and identical across arms. Every arm gets its STT through the same factory,
  so base numbers differ from TAXILAFDB.md by ≤ 0.5 pt.
- **CIs:** 95% cluster bootstrap over scenarios (in the JSON).
- **Files:** pre-fix `critic-prefix-2026-10-04.json` (hash `1d138d3168bf`); post-fix `critic-postfix-2026-10-04.json`
  (hash `67a0af9b6551`).

**Table 1: post-fix, clean world (base)**

| arm | lane | cut-offs, thinking pauses | at band prior | gap p50 / p90 | first audio p50 | missed reply ≤ 2 s | hold violations | verdict on a repaired value | non-safety speech after distress |
|---|---|---|---|---|---|---|---|---|---|
| **stage A** | FAST | **0.0%** | 0.0% | **360** / 1,500 ms | 2,073 ms | 8.7% | 0/48 | 0/40 | 0/84 |
| **stage A** | D4 | **0.1%** | 0.0% | 1,175 / 1,590 | 2,718 | 10.6% | 0/48 | 0/40 | 0/84 |
| silence-640 | FAST | 82.8% | 68.7% | 640 / 700 | 2,459 | 0.8% | 48/48 | 2/40 | 0/84 |
| silence-640 | D4 | 73.6% | 60.6% | 650 / 1,000 | 2,522 | 3.2% | 48/48 | 17/40 | 4/84 |
| cascade-900 (today) | D4 | 24.9% | 13.1% | 1,690 / 1,940 | 3,491 | 40.2% | 46/48 | 1/40 | 0/84 |
| cascade-900 | FAST | 35.2% | 23.2% | 1,330 / 1,560 | 3,159 | 0.9% | 48/48 | 3/40 | 0/84 |
| silence-640 + full governor | FAST | 75.8% | 66.0% | 640 / 700 | 2,463 | 1.1% | 0/48 | 0/40 | 0/84 |
| *stage A pre-fix (TAXILAFDB.md)* | FAST / D4 | *2.3% / 2.6%* | | *370 / 1,488 · 1,140 / 1,608* | | *8.5% / 10.4%* | *2 / 0* | *4 / 0* | *2 / 1* |

**Table 2: post-fix, stage A against the two baselines under each stress (fast lane unless marked)**

| world | stage A: cut-offs / missed / verdict on repaired / unsafe | silence-640: cut-offs / missed | cascade-900 on D4: cut-offs / missed |
|---|---|---|---|
| base | 0.0% / 8.7% / 0/40 / 0/84 | 82.8% / 0.8% | 24.9% / 40.2% |
| sttReal (real-STT text errors) | 1.6% / 15.3% / 0 / **15/84** (distress detected 68/84) | 82.0% / 0.8% (unsafe 16/84) | 28.3% / 37.7% (unsafe 14/84) |
| slow child (pauses ×1.6) | **8.2%** / 10.8% / **13/40** / 1 | 95.9% / 1.9% | 45.6% / 37.7% |
| quiet child (−12 dB) | 2.2% / **18.9%** / 2 / 6 | 77.9% / 11.7% | 21.6% / 49.6% |
| noisy phone (SNR 6 dB + bursts) | 1.1% / 15.2% / 2 / 8 | 94.3% / 2.7% | 17.9% / 55.9% |
| all three (sttReal+slow+phone) | **17.3%** / **23.3%** / 16 / 20 | 97.3% / 1.9% | 29.8% / 61.9% |
| all three, stage A on D4 | 16.9% / 20.3% / 9 / 18 | — | — |

**Reading it:**
- **Stage A wins on cut-offs and verdict safety everywhere.**
  - It is ≥ 4.8× lower on cut-offs than silence-640 in every world.
  - It beats today's cascade on cut-offs and on missed replies in every world.
- **It loses to silence-640 on missed replies**, every world: 8.7-23% against 0.8-12%. That is the price of waiting
  when unsure.
- **Under stress every arm misses distress lines:** the predicate is shared.

**Liveliness channels (post-fix, base) [M]**

| channel | FAST | D4 | bar (ARCHITECTURE §7) | Griffin-like? |
|---|---|---|---|---|
| reply-worthy ends decided < 300 ms after the child's last voice | 25.6% | 0% | — | FAST yes; D4 no (waits for words) |
| reply-worthy ends decided by the silence backstop | 135/517 (26%) | 137/514 | — | the residue that is still a timer: F3.question_mid 32/40, F5 word search 30/40, F11 drift 32/32 |
| her audible back-off (duck) after a child onset over her, p50 | 38 ms (quiet 51, phone 70) | 38 ms | — | yes |
| yield on a real barge-in, p50 | 760 ms | 1,207 ms | ≤ 200 ms | **no**: a 600 ms / 1 s sustained-voice timer |
| keeps talking through "haan / acchha / hmm" | 66.7% | 75.0% | ≥ 90% | no |
| false yields to TV / sibling during her line | 50-67% (TAXILAFDB) | | ≤ 10% | no (no speaker model) |
| verbal backchannel | off (`audioBackchannel` flag; lexical "haan" banned in content by design) | | — | **no**: nods only, at 2.5× the human rate |
| builds while talking | prefetch keys only (`buildIntent.js`) | | — | partial |

**Within-turn pace, chosen on train [M].**
- **Sweep:** `critic-pace-train-{0,1.3,1.6}`, TaxilaFDB **train**, slow-child world, fast lane.
- **What the k values did:**
  - k = 0 → 12.6% cut-offs / 1.5% missed;
  - k = 1.3 → 10.1% / 3.6%;
  - k = 1.6 → 9.6% / 6.9%.
- **Choice:** k = 1.3 was kept. It is a modest gain; most of the cut-offs come in a turn's first long pause, where there
  is no pace evidence yet.

**Verdict delay with the new anchor, chosen on train [M].** On TaxilaFDB train F1 (304 streams), verdicts on a repaired
value were 1.2 s → 2/40 (D4) and 4/40 (FAST); 1.6 s → 1/40 and 1/40; 2.0 s → 0/40 and 0/40. VERDICT.delayMs stays 2.0 s.

**M-D7 regression [M].** `node evals/duplex/tick-sim.mjs --out tick-sim-critic-postfix`: cce-mai, cce-fast and cce-d4
are unchanged. Gap p50 is 361 / 400 / 1,265 ms, with 0 cut-offs, 0 hold violations and 0 wrong-value verdicts.

**Cost per lesson-hour** [M sim × E prices]:
- **Method:** `evals/duplex/critic/cost.mjs`, every 6th test stream, Speculator accounting × MODEL-STACK prices ×
  80 child turns per hour.
- **What duplex adds on top of the cascade's expected $1.61/h:**
  - **wasted speculative drafts:** $0.068-0.091/h. That is about 5.3k input tokens per reply turn on the fast lane, 3.8k
    on D4;
  - **wasted warm TTS:** < $0.002/h;
  - **the semantic estimate:** $0.009-0.013/h (0.8-1.1 calls per reply turn).
  - **Total: +$0.07-0.11 per lesson-hour (+4-7%).**
- **Hidden cost:** duplex needs the whole session streamed to STT, which rules out MODEL-STACK lever 1 (windowing
  saves −$0.77/h on gpt-live-transcribe). On MAI at its $0.36/h placeholder the forgone saving is about $0.27/h [E].

---

## 4. Defects found and fixed (new modules only)

| # | defect | how found | fix | effect [M, test unless marked] |
|---|---|---|---|---|
| F1 | **The verdict clock anchored on the value word, not the child's last voice.** In "पंद्रह \| सेंटीमीटर [1.4 s] सॉरी बारह", value end + 2.0 s fell 90 ms before "सॉरी", so a verdict on 15 played | trace of the 4/40 on test F1.rep_marker (the earlier diagnosis "1.4 s > 1.2 s delay" was wrong: the tree already had 2.0 s) | `engineRules.ts verdictAnchor()` = max(value end, last voiced frame); used by `verdictNotBefore`, `verdictReady` and the governor's G7 stamp. Delay re-chosen on train (§3) | verdict on a repaired value 3-4/40 → 0/40 on both lanes |
| F2 | **An "I don't know" anywhere in the turn licensed idk_help.** "पता नहीं … कभी कभी लगता है मैं ना" got a reply committed 30 ms after the last word, before the distress phrase was visible | trace of the unsafe f10-after_pause stream (**test**) | `understand.js`: `idk` only when the IDK phrase is the tail (vocatives and a few particles allowed after it); `idkAny` kept for the Director | unsafe 1-2/84 → 0/84 (with B7) |
| F3 | **Her echo leaked into the child's turn in 51% of replies.** "है? तीन सौ साठ डिग्री", "बाघ? गाय": the uptake re-voiced her own word and the Director got polluted text | scan of reply texts on a test sample (n=181) | `echo.js`: her words inside the item's audio span are matchable however late the text arrives; empty-skeleton tails ("है") join a run by surface; on word-timed sources, a single token whose own time sits on her same word is echo | 92/181 → 0/172. 61 duplex tests green, M-D7 unchanged |
| F4 | **Hallucinated other-script text was read as words.** 5/90 real segments | the L2 transcripts (B1) | `markers.ts unreadableTail()` → `LexicalMarkers.unreadable`; stage A −4 logit (never complete); G10's first sound is a verdict-free prompt, never an uptake | not separable in the aggregate; unit-tested |
| F5 | **Absolute backstops** cut slow children | slow-child world on **train** | `governor.ts`: within-turn pace. The longest resumed pause × 1.3 (`config.ts TURN_PACE`) floors later backstops (cap 6 s) and the verdict delay (cap 4 s); granted holds excluded | slow-child cut-offs 19.8 → 8.2% on the fast lane (with F1-F3) |

- **Gates:** `npx tsc -b` 0 errors and `npx vite build` exit 0.
- **Tests:** duplex tests 61/61, including the new `tests/duplex-critic.test.mjs` with 6 tests.
- **`npm test`:** 1,625 tests, 1,619 pass, 3 fail. None of the failures is duplex code. They are `migrations applied` (016-019 are not applied to the database), an azure chatStream timing test run under load, and `lint-ui` in the B1 paths. The same failures were reported before this workstream.

**Not fixable here (outside this workstream's paths):**
- **`scanSafety` misses one-word garbles** ("पाप मारते हैं", "Nobody would evn notice") and the danda case. Owner: safety.
- **Lexicon gaps seen on test** ("मैं confuse हूँ"). These wait for TaxilaFDB v2.

---

## 5. Safety on partials

**What holds [M]:**
- Sticky detection on every partial: 84/84 in the clean world, every lane.
- 0 safeguards spoken over a talking child.
- G2 barrier: no audio act before the predicate has seen the covered text.
- The safety yield cancels any pending reply (B7, now a world rule and a PLAN contract test).

**What does not:**
1. **Text robustness.** One garbled token or one hallucinated segment hides a disclosure: 16/84 missed under sttReal,
   for every arm.
   - **The engine makes it worse in one way.** The fast lane commits turns earlier, so a missed disclosure gets a normal
     reply sooner: unsafe 15/84 vs cascade 14-16.
   - **Needed:**
     - a fuzzy / phonetic predicate;
     - the existing model distress read (grok-4-1-fast-nr, MODEL-STACK §1) routed into `PartialSafety.modelNote` on
       every committed turn;
     - an unreadable segment treated as "ask again", never as content.
2. **The 120 ms horizon can hide the last word.** In f10-during_her, a turn end was decided on "…मैं ना" 10 ms before
   "रहूं" ended. Safety tripped 380 ms later and the cancel saved it. A warm uptake can start within ~100 ms, so on a
   disclosure she can be audible for up to ~300 ms before yielding.
   - Acceptable only with the cancel contract.
   - PLAN W2.5-3 measures it on real audio.

---

## 6. Files

- **Evals:**
  - `evals/duplex/critic/perturb.mjs` (world perturbations);
  - `evals/duplex/critic/stress.mjs` (runner, pause strata, end-rule and duck metrics);
  - `evals/duplex/critic/cost.mjs`;
  - `evals/duplex/taxilafdb/world.mjs` (duck times, safety-yield cancel, full speculator summary).
- **Runtime fixes:**
  - `src/duplex/{engineRules,governor,config,markers,engine}.ts`;
  - `server/duplex/{understand,echo}.js`.
- **Tests:** `tests/duplex-critic.test.mjs`.
- **Results:** `evals/duplex/results/`:
  - `taxilafdb-critic-repro-2026-10-04.json`;
  - `critic-prefix-2026-10-04.json`, `critic-postfix-2026-10-04.json`;
  - `critic-pace-train-{0,1.3,1.6}-2026-10-04.json`;
  - `critic-verdict-train-{1200,1600,2000}-2026-10-04.json`;
  - `critic-cost-2026-10-04.json`;
  - `tick-sim-critic-postfix-2026-10-04.json`.
