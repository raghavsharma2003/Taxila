# World-best STEAL LIST: the 25 items Taxila adopts, ranked (chief-scientist synthesis, 2026-10-03)

**What this is.** It combines the six world-best sweeps into one ranked list with duplicates merged:

| sweep | file | short tag |
|---|---|---|
| tutoring products and pedagogy | `tutoring-products-pedagogy.md` | T |
| understanding detection | `understanding-detection.md` | U |
| hyper-personalisation | `hyper-personalisation.md` | H |
| generated learning content | `generated-learning-content.md` | G |
| talking avatars | `talking-avatars.md` | A |
| voice UX smoothness | `voice-ux-smoothness.md` | V |

A reference such as "T-S1" means steal S1 in the tutoring sweep. Full evidence, anti-patterns and corrections live in those six files and are not repeated here. Proposed graph entries are in `context/inbox/world-best.json`, alongside the sweeps' own inbox files.

**Status, stated plainly.** Nothing on this list has been built or run on a child. Every "expected impact" is a literature-derived prediction, not a Taxila measurement. Each item therefore names the measurement that would confirm or kill it.

**Evidence tags, inherited from the sweeps:**
- [V]: read at the primary source.
- [S]: secondary source.
- [U]: unverified.
- [M]: measured in this repo.
- [T]: read from Taxila's own code or docs.

**Cost and effort** are the chief scientist's estimates, not measurements:
- S: 2 engineer-days or less.
- M: 2 weeks or less.
- L: more than 2 weeks.

The Azure-only constraint applies throughout: any paid model at runtime is an Azure Foundry Direct model. Every code or weight dependency below is MIT, Apache-2.0, BSD or CC-BY unless stated otherwise.

**How the list is ranked.** Expected learning or experience impact, times confidence in the evidence, divided by effort. Two overrides apply:
1. Items that guard against a **measured harm** move up regardless of effort: answer-mode displacement and the equity gradient.
2. Items that need an owner decision, consent work or a Microsoft answer move down, even when their impact is high.

---

## Rank at a glance

| # | item | areas merged | effort | first measurement |
|---|---|---|---|---|
| 1 | Diagnose the error type before choosing help | T-S1 | M | Bridge-style blind preference + y_delay MRT |
| 2 | Graded guidance ladder with adaptive backward fading | H-S1, H-S2, H-S10 | M | F-FADE MRT on y_delay |
| 3 | Predictive end-of-turn on our own children | V-S1, V-S2, V-S9, A-S7 | L | SHIFT/HOLD AUC on E1, cut-off rate |
| 4 | Equity floor: tercile gate + low-baseline profile | T-S2, H-S4 | M | bottom/top tercile gain ratio ≥ 0.8 |
| 5 | Never an answer mode: a "just tell me" floor test | T-S4 | S | 30-variant battery, 0 reveals before rung 4 |
| 6 | Dose by schedule, reported in LAYS per $100 | T-S3 | M | minutes/week vs plan; LAYS per $100 |
| 7 | "Still checking": a computed abstention state | U-S2 | M | deferral error ratio ≥ 1.4 |
| 8 | Split "I don't know" into not-known vs can't-recall | U-S1 | S | WB-M1: recognition-probe success by class |
| 9 | Skeleton-first live fills, a code value in every slot | G-S1, G-S2 | M | first paint p90 ≤ 300 ms |
| 10 | Conversation-mix and child-talk-share metrics | T-S6, T-S7 | S | weekly mix trend; talk share −10% blocks |
| 11 | Fix the TTS pace recipe (DragonHD ignores `<prosody>`) | V-S6 | S | chars/s per voice per mechanism |
| 12 | Body-first wait, then an echo of the child's words built in code | V-S3 | M | re-speaking during THINKING; blind verdict-guess |
| 13 | Per-item misconception lists harvested from real turns | U-S4 | M | share of `other`/`partial` grades falls week on week |
| 14 | Fractional review credit (FIRe) + retrieval until correct in classes 1-3 | H-S3, H-S5 | M | delayed retrieval non-inferiority; reviews/week |
| 15 | A contingent listener: model-timed nods, visual backchannels, rate matching, idle variety | A-S6, A-S8, V-S4, V-S5 | M | E-NOD1; child utterance length; rate-gap |
| 16 | GNM Head as the face base, ARKit keys solved through its expression space | A-S1, A-S2, A-S5, A-S10 | L | E-GNM1; G6 teeth/tongue gate; Hindi lip bench |
| 17 | Read-aloud scoring on Azure Pronunciation Assessment | T-S5 | M | miscue agreement vs human on E1 children |
| 18 | Off-plan latency: token diet, service overhead, speculative launch | G-S3, G-S4, G-S5 | M | T1 p50 1.88 s → ≤ 1.0 s |
| 19 | Forge behaviour gates scored strictly, as interaction graphs and checklists | G-S6, G-S7, G-S9, H-S11 | M | all-checks pass rate per archetype; judge κ |
| 20 | Negative memory: failure patterns go last in the builder brief | G-S8 | S | repair rounds per build |
| 21 | Interest re-skins in the child's own words, plus a corpus cultural audit | H-S6, H-S7 | M | isomorphism 100%; corpus entropy; F-INT |
| 22 | A difficulty bandit inside one admissibility predicate | T-S10, H-S8 | M | within-child randomised; unassisted next-item |
| 23 | Kit schema v-next: aha, progression, representation order | T-S9, H-S9 | S+authoring | Forge first-pass validity; transfer on rep-switch |
| 24 | Grader hygiene: pinned version, idea units first, timing lint, self-repair split | U-S5, U-S6, U-S9, U-S11 | S | M-GRADE κ per graderVersion |
| 25 | The parent loop: Parent CoPilot card + the child's own explanation | T-S8, V-S10 | M | randomised card vs none on the delayed check |

Further down, outside the 25 but worth keeping, are the lane-B Voice Live probes, the splat HD face tier, a text-LLM KT challenger, LLM-estimated difficulty priors, constraint-solved figures, PromptWizard and speak-while-you-sketch.

---

## The 25

### 1. Diagnose the error type before choosing help

- **Source.** Bridge (Wang et al., NAACL 2024) [V]:
  - Expert decisions follow error type → strategy → intention.
  - GPT-4 replies conditioned on expert decisions were **+76% more preferred**. Random decisions made them **−67% worse**.
  - https://arxiv.org/html/2310.10648

  Tutor CoPilot v2 [V]: **>700 tutors, 1,000 students, +4 pp mastery, +9 pp with the weakest tutors**.
  - https://edworkingpapers.com/sites/default/files/ai24_1054_v2.pdf
  - Full analysis: T §0.6, T-S1.
- **Mechanism.** Before any words are written, label the wrong answer in code with one of: careless, misread, right-idea, imprecise, guess, misconception, not-sure. That label picks a strategy, and the strategy picks an intention. The model only writes the words for the chosen intention.
- **Taxila adaptation.**
  - `server/director/classify.js` emits an `errType` from the closed-label grade, together with the R-CATCH/R-MIS evidence that `comprehension-grading-closed-label` already produces.
  - `server/director/state.js` routes on it:
    - `careless` → "check that step". No hint rung is spent.
    - `misread` → re-pose the question.
    - `right-idea` / `imprecise` → a precision prompt.
    - `misconception` → the kit re-teach arm (`reteach-randomise-from-second`).
    - `guess` / `not-sure` → a probe.
  - Strategy and intention reach the realtime voice as **shape notes** in `server/director/shapes.js`, never as sentences, under the inherited "sentence-shaped text gets recited" law.
- **Expected impact.** Fewer wasted hint rungs. Correct help on the roughly one third of wrong answers that are slips or misreads (proportion unmeasured for Taxila). The weakest-tutor effect (+9 pp) suggests the gain is largest wherever teaching is currently weakest.
- **Measurement.**
  1. Offline: a blind pairwise preference test with an expert on 60 recorded wrong-answer turns, decision-conditioned vs current.
  2. Live: an MRT factor on `y_delay`, and the hint-rung count per resolved error.
  3. Classifier accuracy: confusion matrix of `errType` against 200 human labels, with κ ≥ 0.6 before it routes.
- **Cost and effort.** M. One classifier field, one routing table, shape notes. No new model.
- **Licence.** Bridge code is MIT. **The Bridge dataset is CC-BY-NC**, so we use the taxonomy only and never train on it.

### 2. A graded guidance ladder with adaptive backward fading

- **Source.**
  - Salden et al. 2010: adaptive fading driven by the learner's own explanations gave the best delayed transfer, 6.67 vs 4.50 fixed fading vs 4.66 problem solving [S] (https://www.researchgate.net/publication/226748784).
  - Tetzlaff et al. 2025, expertise-reversal meta-analysis [S] (https://doi.org/10.1016/j.learninstruc.2025.102142).
  - Kalyuga & Sweller, rapid first-step diagnosis [S].
  - McGinn 2025, 58 classrooms: extra worked material hurt high-prior children [V abs] (https://doi.org/10.1016/j.jecp.2025.106348).
  - Full analysis: H-S1, H-S2, H-S10.
- **Mechanism.** Each skill gets one of three guidance levels:
  1. full worked example;
  2. backward-faded example, where a step is blanked only after the child has explained it;
  3. attempt first.

  The level comes from the ledger plus a one-turn "what would you do first?" probe. Low-prior children get completion items. High-prior children get "find the teacher's deliberate mistake". For classes 1-2, ask about the process, not the answer.
- **Taxila adaptation.**
  - Today `server/director/state.js isNovice()` is one on/off switch for a whole topic [T]. Every kit already carries `workedExample.fadedVersion`, loaded by `server/content/kits.js`, and **nothing reads it** [T].
  - Add a pure `server/director/fading.js` with signature `(ledgerView, kit.workedExample, stepExplained[]) → nextStepVisibility`.
  - Replace `isNovice` with `guidanceLevel(skill)`.
  - The example-type rule lives in the same module.
- **Expected impact.** The cheapest high-value learning steal in the whole corpus: the asset already exists and is unused. The predicted gain is on delayed transfer, not on immediate correctness.
- **Measurement.**
  - MRT factor F-FADE (adaptive fade vs current one-shot) on `y_delay` and `y_transfer`.
  - Check by baseline tercile (item 4).
  - Kill it if the high tercile is worse on `y_delay` by more than 0.05.
- **Cost and effort.** M. One pure module, Director wiring, and sim tests in `director-sim`.
- **Licence.** No dependency.

### 3. Predictive end-of-turn trained on our own children

- **Source.**
  - Silence length separates a child's turn-end from a pause at **AUC 0.62**. A model that hears the audio before the silence reached **94% balanced accuracy on child-initiated turns** (Brahimi et al., IWSDS 2026, children aged 4-9, English) [V] (https://aclanthology.org/2026.iwsds-1.34.pdf).
  - Pipecat Smart Turn v3.2 [V]:
    - **BSD-2 code and weights**, int8 ONNX 8 MB, CPU 10-100 ms.
    - **Hindi 93.4% (n = 1,295)**.
    - https://github.com/pipecat-ai/smart-turn, https://huggingface.co/pipecat-ai/smart-turn-v3
  - Next-Turn: time-to-next-speech targets need only timestamps, no labels [V] (https://arxiv.org/abs/2606.18094).
  - Prosody alone beat prosody plus text for end-of-utterance; text added false alarms (Sharon et al. 2026) [V] (https://arxiv.org/abs/2609.11066).
  - Auto-labelling ASR by prompt match accepted 18-42% of utterances at ≥98.3% precision on Dutch children [V].
  - Full analysis: V-S1, V-S2, V-S9, A-S7.
- **Mechanism.** Commit early, decide late:
  - Silence of about 450 ms is only a *candidate* endpoint.
  - An audio turn model scores the last 8 s.
  - The Director sets the hold threshold per item type and per child, for example a longer hold on "explain why" than on "what is 7 × 8".
  - "Not finished" keeps listening and merges the next fragment into the same turn.
- **Taxila adaptation.**
  - New `src/lesson/turnModel.ts` running Smart Turn ONNX on-device in a worker.
  - A candidate-endpoint event in `src/lesson/vad.ts`.
  - A HOLDING sub-state in `src/lesson/floor.ts`.
  - Fragment merge in `src/lesson/cascadeLink.ts` and `server/voice/stt.js`.
  - Think-time thresholds come from the Director (`voice-floor-states-hybrid`).
  - The data engine:
    - The E1 consent gains a turn-model clause.
    - Timestamps alone train a Next-Turn-style child fine-tune on Azure ML or the build GPU.
    - Prompt-match auto-labelling, where both ASR lanes match the expected answer exactly, plus a 5% human audit, produces Custom Speech `hi-IN` ground truth from the same rows.
- **Expected impact.** This is the largest single "feels human" lever.
  - Today's fixed 900 ms either cuts off thinking children or makes every complete answer wait.
  - Predicted: p50 response gap at least 300 ms better, with no more cut-offs than today.
- **Measurement.**
  - SHIFT/HOLD AUC on E1 recordings (target ≥ 0.85 vs silence's ~0.62).
  - Cut-off rate, the share of child turns that continue within 2 s of her starting.
  - p50 and p90 gap.
  - Report by class band and home language.
- **Cost and effort.** L. On-device ONNX, the floor state, the E1 consent clause and a fine-tune.
- **Licence.**
  - Smart Turn is BSD-2, and its training data is CC-BY 4.0 with a synthetic flag.
  - **Excluded:** HiACC (non-commercial), the Ohio child corpus (licence unread), VAP pretrained weights (academic only), the LiveKit turn detector (LiveKit Model License).
  - Runs on-device, so it is Azure-neutral.

### 4. Equity floor: a tercile release gate plus a low-baseline structure profile

- **Source.** Every recent trial skews gains toward stronger students:
  - Sierra Leone Gemini RCT: stronger baseline gained most [V] (https://deepmind.google/blog/measuring-the-impact-of-learning-with-ai-in-sierra-leone-and-beyond/).
  - Maryland: first-generation students −0.50 vs −0.22 SD [V] (https://edworkingpapers.com/sites/default/files/ai26-1598.pdf).
  - Kenya mentor: low performers about −10% [S].
  - Nigeria interleaving, 62 classrooms: bottom gained, top lost, year-end null [V].
  - Full analysis: T-S2, H-S4. `open-equity-tercile-gate` is already in the graph.
- **Mechanism.**
  - A release metric: the bottom-baseline tercile's gain must be at least **0.8 ×** the top tercile's, on the same outcome, before any pedagogy change ships.
  - Low-baseline children always get a worked example first on a new skill and **one next step, never a menu** (`rj-advice-menu-for-weak-learners`).
  - Interleaving is gated by prior knowledge, never applied blanket.
- **Taxila adaptation.**
  - The baseline tercile comes from the onboarding CAT (`learner-ge-scale-one-cat`).
  - The profile is applied in `server/learner/bands.js` and `server/director/state.js`.
  - The Conductor's `server/conductor/planner.js` never offers a choice list to the low tercile.
  - The "3 blocked then interleave" rule in `docs/research/design/lesson-arc.md` splits into problem-type interleaving (gated by prior) and representation sequencing (item 23).
  - Every MRT and sim report gains a tercile table (`sim-code-truth-two-families` already reports gain tables, so add one cut).
- **Expected impact.** Protects Taxila's actual wedge, tier-2 Hinglish families. Without it the literature predicts Taxila widens gaps.
- **Measurement.** The tercile gain ratio on `y_delay`, reported for every experiment. A ratio below 0.8 blocks release.
- **Cost and effort.** M. Mostly reporting plus two routing rules.
- **Licence.** No dependency.

### 5. Never an answer mode: a "just tell me" floor test

- **Source.**
  - Maryland: a default direct-answer tutor gave **−0.27 to −0.37 SD**, with 73.8% of requests answer-seeking [V].
  - China panel: closed-book exams about **−20% within six months** of general AI use [S].
  - Fischer, Rau & Rilke: unrestricted help beat a timed lockout by +0.21 SD [V] (https://docs.iza.org/dp18338.pdf).
  - ChatGPT Study Mode, Claude learning mode and Gemini Guided Learning are all user toggles.
  - Full analysis: T-S4. Already merged: `rj-default-answer-mode`, `rj-timed-help-lockout`.
- **Mechanism.**
  - No answer mode, no toggle, no parent setting, no timers.
  - The key is never spoken before rung 4 of the hint ladder, whatever the phrasing.
  - Help is always reachable. The struggle lives in the ladder, not in a lockout.
- **Taxila adaptation.** In `evals/never-rules.mjs`, add a battery of 30 "just tell me" variants in Hindi, English and Hinglish, including emotional pressure, parent-impersonation and "my teacher said you can". Score them with the existing `revealsAnswer()` predicate, through `director-sim` at each rung.
- **Expected impact.** Guards the single largest measured *negative* effect in the field. Cheap insurance against prompt or model drift.
- **Measurement.** 0/30 reveals before rung 4. The battery runs in `npm test`.
- **Cost and effort.** S.
- **Licence.** None.

### 6. Dose by schedule, reported in LAYS per $100

- **Source.**
  - Sierra Leone: classrooms meeting the 12-hour target gained 1.8-2.5 years vs 1.2-1.7 overall [V].
  - Nigeria: gains with every extra day attended [S].
  - Kenya (F1000Research 15-925): classroom-integrated EIDU reached **4.6-5.5 LAYS per $100**, against 1.4-1.7 for standalone apps [V] (https://f1000research.com/articles/15-925).
  - Full analysis: T-S3.
- **Mechanism.** An adult fixes the dose: parents pick weekly slots. The Conductor plans and nudges against those slots, not against mood. Cost-effectiveness is reported in the same unit as the field.
- **Taxila adaptation.**
  - Weekly slots in the parent corner, as a migration on the child row.
  - `server/conductor/planner.js` plans the lesson day to the slot.
  - A nudge outbox through the existing `conductor-substrate-neon` outbox.
  - The parent report shows minutes against plan, never streaks (the reward-pattern rejections stand).
  - LAYS per $100 is computed from the cost governor (`mk-tiers-as-voice-budgets`) and measured `y_delay`.
- **Expected impact.** In this literature, dose explains more of the variance than model quality does.
- **Measurement.** The share of planned minutes delivered. The dose-response slope of `y_delay` against minutes. LAYS per $100 at the first cohort.
- **Cost and effort.** M.
- **Licence.** None.

### 7. "Still checking": a computed abstention state

- **Source.** Mitton et al., IRAISE 2026 (Eedi KT team) [V abs] (https://arxiv.org/abs/2509.21514):
  - Deferring the 20% most uncertain predictions gives +2.3-3.0 pp accuracy.
  - Deferred predictions are wrong 1.45-1.6× as often.
  - Full analysis: U-S2.
- **Mechanism.** Uncertainty becomes a state, not a wording. A skill whose bootstrap error band crosses a ladder boundary is `uncertain`. It gets one mandatory probe before it can move up, and parents see "still checking".
- **Taxila adaptation.**
  - Bootstrap bands come from the offline BKT-R refit (`learner-bktr-ledger`).
  - Add an `uncertain` flag in `server/comprehension/state.js` (5-state ladder, `comprehension-facet-belief`) that can never display above the ledger.
  - `server/comprehension/schedule.js` adds it to the mandatory probe set (`comprehension-probe-budget-scheduler`).
  - The parent claim gate words it as "still checking".
- **Expected impact.** More honest parent reports, and better-placed probes. No consumer tutor tells parents when its model is unsure.
- **Measurement.** The deferral error ratio, abstained vs retained, against delayed checks. Target ≥ 1.4. Abstention rate ≤ 20%.
- **Cost and effort.** M.
- **Licence.** None.

### 8. Split "I don't know" into not-known and can't-recall

- **Source.** Smith & Clark 1993: the wording a speaker picks tracks their feeling of knowing [V abs]. Full analysis: U-S1.
- **Mechanism.**
  - "pata nahi / nahi aata" → `IDK` (not known).
  - "yaad nahi aa raha / bhool gaya / zubaan pe hai" → `IDK_R` (can't recall).
  - `IDK_R` counts as a failed recall for spaced repetition but barely moves pL. It triggers a same-episode **recognition** probe.
- **Taxila adaptation.**
  - The outcome goes in `server/learner/kt/outcomes.js` and `server/learner/kt/adapter.js`.
  - The lexicon goes in `server/learner/affect.js`.
  - The probe goes in `server/comprehension/schedule.js`.
  - It is text-only, so it stays outside the Microsoft Code of Conduct's voice-emotion restriction.
- **Expected impact.** Keeps genuinely-learned-but-rusty skills from being re-taught from scratch, and gives a free retrieval cue. The impact size is unmeasured.
- **Measurement.** WB-M1: recognition-probe success after `IDK_R` vs after `IDK`. The split is real if the gap is ≥ 20 pp, by class band.
- **Cost and effort.** S.
- **Licence.** None.

### 9. Skeleton-first live fills, with a code value in every slot

- **Source.**
  - A2UI (Google, Apache-2.0, v0.9.1): UI as pure data [V] (https://github.com/google/A2UI).
  - MCP Apps: sandboxed, deny-by-default [V].
  - Taxila's own numbers [T]: off-plan T1 fill 1.88 s p50, T2a 3.08 s p50.
  - Full analysis: G-S1, G-S2.
- **Mechanism.**
  - Truth fields and layout are computed in code and mount at once, frozen.
  - Language slots stream in, and each is painted only after it passes the per-string safety gate.
  - Every slot has a templated code value. The model only *upgrades* the wording.
- **Taxila adaptation.**
  - `server/forge/index.js` emits the skeleton first.
  - Add a streaming-slot message to `src/modules/frame/protocol.ts` (bridge v2.1), painted by `src/modules/frame/scene/runtime.ts`.
  - Templated `ask` lines per probe kind and language go in `server/forge/strings.js` and `server/forge/templates.js`.
- **Expected impact.** Off-plan visuals feel instant. The child never sees a spinner where the teacher's words point to a picture.
- **Measurement.** First paint p90 ≤ 300 ms. Slot-upgrade completion ≤ 2 s p90. 0 unsafe strings painted (Q8 log).
- **Cost and effort.** M.
- **Licence.** A2UI is an Apache-2.0 *pattern*. We adopt the idea, not the library.

### 10. Conversation-mix and child-talk-share metrics

- **Source.**
  - Sierra Leone: solution-seeking fell from 25% to 10% [V].
  - Maryland: only 0.7% of requests asked for feedback on the student's own work [V].
  - TeachLM: doubled student talk time [V abs].
  - Full analysis: T-S6, T-S7.
- **Mechanism.**
  - Each child turn is labelled in code: attempt, explain, ask-answer, ask-check, IDK, off-task.
  - The weekly trend is watched.
  - Child words as a share of all words, plus reasoning turns, is a regression metric.
- **Taxila adaptation.** The labels are derived in `server/director/classify.js`, which already sees every turn. Aggregate per lesson. Add `childTalkShare` to `director-sim` reports and to live telemetry. A persona or model upgrade that cuts it by more than 10% is blocked.
- **Expected impact.** A cheap leading indicator for item 5's harm and for constructive engagement. It catches a teacher who talks too much.
- **Measurement.** The metrics themselves, plus correlation with `y_delay` once the cohort exists.
- **Cost and effort.** S.
- **Licence.** None.

### 11. Fix the TTS pace recipe: DragonHD ignores `<prosody>`

- **Source.**
  - Microsoft's HD voices page marks `<prosody>`, including rate, as unsupported on DragonHD and Omni [V] (https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices).
  - Our measured 15.2-15.9 chars/s at rate 0.95 fits "ignored" [M].
  - Full analysis: V-S6. Already in the inbox as `open-dragonhd-prosody-unsupported`.
- **Mechanism.** Set pace with voice choice, clause `<break>`, Voice Live `voice.rate` (needs a probe on HD voices) or gpt-4o-mini-tts `speed`, never with `<prosody rate>`. Also probe `enhancePronunciation=true` on the NCERT term set.
- **Taxila adaptation.** The `voice-choice-v2` recipe and VOICE-CHOICE.md §3 are replaced by a measured per-voice pace table, generated by a probe script under `evals/`.
- **Expected impact.** Pace is the most audible "adult reading at a child" tell. The fix costs an afternoon.
- **Measurement.** chars/s per voice per mechanism, against the target of about 11-13 chars/s. Plus an ear test.
- **Cost and effort.** S.
- **Licence.** Azure Speech, which is in policy.

### 12. Body-first wait, then an echo of the child's words built in code

- **Source.**
  - Gonzales et al. 2025: a gesture filler beat thinking bubbles and progress bars, which pulled gaze off the face; 87.5% preferred the gesture (n = 24) [V] (https://arxiv.org/abs/2508.11781).
  - Voice Live interim responses default to a 2 s trigger and random canned texts [V].
  - Full analysis: V-S3. Inbox: `rj-symbolic-wait-indicator`, `rj-static-filler-list`.
- **Mechanism.**
  - Under about 1.2 s: her body covers the wait (a think pose and a gaze shift).
  - Beyond about 1.2-1.5 s: she speaks a short uptake fragment built in code from the child's own words ("seven times eight… hmm"), with **identical prosody for right and wrong**.
  - Never a random canned filler.
- **Taxila adaptation.**
  - Fragment generation goes in `server/voice/prewarm.js`.
  - Think poses go in `src/avatar/behaviour.ts`.
  - The dots pictogram and the Older band's elapsed-time phase move to the status strip, off her face.
- **Expected impact.** Fewer "hello?" re-speaks during THINKING. Waits feel attentive rather than broken.
- **Measurement.**
  - Child re-speaking during THINKING, which should go down.
  - A blind check: listeners must guess right/wrong from the fragment at chance (≤ 55%).
- **Cost and effort.** M.
- **Licence.** None.

### 13. Per-item misconception lists harvested from real turns

- **Source.** The Kaggle MAP competition on Eedi data [V] (https://www.kaggle.com/competitions/map-charting-student-math-misunderstandings):
  - Winners scored MAP@3 above 0.948 by restricting labels to each question's observed misconceptions.
  - Nobody has tested them on new questions.

  Full analysis: U-S4.
- **Mechanism.** Closed per-item label sets are the deployable version of that trick. The sets grow from real children's turns, not from a general classifier.
- **Taxila adaptation.**
  - `other` and `partial` grades from `comprehension-grading-closed-label` go to a weekly human review queue (a Neon table plus a reviewer screen).
  - Accepted misconceptions are appended to `data/kits/**` through the existing kit verification path.
  - Later, a small 3-step classifier (correct? → known error? → which one) runs as a second grader for partials, on a Foundry open model.
- **Expected impact.** Grows the NCERT misconception atlas, one of the bets below. Each accepted entry makes item 1's routing and the re-teach bandit better.
- **Measurement.** The share of `other`/`partial` falls week over week. Reviewer acceptance rate. Second-grader κ against humans ≥ 0.7.
- **Cost and effort.** M.
- **Licence.**
  - Training on MAP or Eedi data waits on unverified terms [U]. We train only on our own consented rows.
  - XES3G5M (MIT) is usable for pretraining.

### 14. Fractional review credit (FIRe), and retrieval until correct for classes 1-3

- **Source.**
  - Math Academy's FIRe, with repetition compression and implicit credit switched off for slow topics [V vendor] (https://www.justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures/).
  - Benefit from testing grows from age 7 to 14 (Rodríguez-Gonzalo 2024) [V abs].
  - Spacing changes were null in real Grade 5 classrooms (Franzoi 2025) [V abs] (https://doi.org/10.3389/fpsyg.2025.1632206).
  - Full analysis: H-S3, H-S5.
- **Mechanism.**
  - When a later topic uses an earlier skill as a necessary sub-step, post a *fractional* review to that skill's schedule. It never counts toward mastery, and it is off for fragile skills.
  - The Conductor prefers reviews that clear the most due skills.
  - Classes 1-3: retrieval with corrective feedback until correct.
  - Stop tuning schedule shape.
- **Taxila adaptation.**
  - `server/comprehension/weave.js` already hosts the sub-step [T]. It posts a fractional review to `server/learner/kt/fsrs.js`.
  - Compression goes in `server/conductor/planner.js`.
  - The retry-until-correct loop is a band rule in `server/learner/bands.js`.
- **Expected impact.** Fewer explicit reviews for the same retention, which frees lesson minutes for new learning. Better retention for young children.
- **Measurement.** Simulator first. Then a non-inferiority check on delayed retrieval (margin 3 pp), with explicit reviews per week as the gain.
- **Cost and effort.** M.
- **Licence.** A published method. No code is taken.

### 15. A contingent listener: model-timed nods, visual backchannels, rate matching, idle variety

- **Source.**
  - Kyoto MaAI [V] (https://github.com/MaAI-Kyoto/MaAI):
    - MIT code, real time on a CPU.
    - VAP nod kinematics: model-timed nods beat random timing on all 7 measures (n = 60).
  - Park HRI 2017: children aged 4-6 told more energetic stories to a listener with prosody-timed backchannels [S].
  - Kory-Westlund 2019, n = 86: matching the child's speaking rate raised target-word use [V] (https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2019.00054/full).
  - Duolingo Lily: 8 × 8 idle layers [V] (https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life).
  - Full analysis: A-S6, A-S8, V-S4, V-S5.
- **Mechanism.**
  - While the child talks: visual nods only, never an audio "hmm" while the mic is open, timed by a prosodic backchannel-opportunity event.
  - Her speaking pace tracks the child's own rate, within band bounds.
  - Idle clips recombine so a 45-minute lesson never shows a loop.
- **Taxila adaptation.**
  - A `bcOpportunity` event in `src/lesson/vad.ts` drives the nod scheduler in `src/avatar/behaviour.ts` (`avatar-behaviour-controller`; nods only in open turns).
  - MaAI runs server-side beside `server/voice/features.js` once E-NOD1 shows it transfers to Hindi. Until then the rule is a prosody heuristic of our own.
  - Rate matching runs from the per-child speaking-rate z already stored, through `styleForChild()`, and is bounded by `vibe-adapter-compiled-row`.
  - Idle layering in `behaviour.ts`.
- **Expected impact.** The difference between being watched and being listened to.
- **Measurement.** E-NOD1 (model vs heuristic timing, rated blind). Child utterance length per open turn. Teacher-child rate gap.
- **Cost and effort.** M.
- **Licence.**
  - MaAI is MIT. Rate matching is pace, not emotion inference, so it is inside the Code of Conduct.
  - **Excluded:** VAP pretrained weights (academic only).

### 16. GNM Head as the face base, with ARKit keys solved through its expression space

- **Source.**
  - Google GNM Head v3.0 [V] (https://github.com/google/GNM, https://huggingface.co/google/gnm-v3):
    - July 2026, **Apache-2.0 code and weights**.
    - **17,821 vertices** [M], with eyes, teeth, gums and tongue in one mesh.
    - 253 identity and 383 expression components [M].
  - A MediaPipe↔GNM correspondence exists in XR Blocks (Apache-2.0) [S] (https://xrblocks.github.io/docs/samples/GNM-Head/).
  - NVIDIA Audio2Face-3D multi v3.2 on NGC [V] (https://catalog.ngc.nvidia.com/orgs/nim/nvidia/models/audio2face_3d_model).
  - Full analysis: A-S1, A-S2, A-S5, A-S10.
- **Mechanism.**
  - Swap the MPFB head (about 3.9k vertices [T]) for GNM.
  - The 52 ARKit keys plus the Hindi tongue keys are *fitted mathematically* inside GNM's statistical expression space, not sculpted by eye.
  - The offline lip teacher is upgraded to A2F-3D v3.2. Emotion comes from the Director's known intent, never from Audio2Emotion.
- **Taxila adaptation.** The character pipeline (`avatar-cast-shared-mpfb-s2` would be superseded) bakes keys into the same `HeadRig.apply` contract, so `src/avatar/**` runtime code is unchanged. MediaPipe stays the single face-measurement tool.
- **Expected impact.** This is the likely fix for the bake-off faults: grimaces, gappy teeth, tongue poking through lips, and "one MakeHuman face with three finishes" [T `teacher-bakeoff-verdict`]. It overturns `face3d-nc-deps-rejected`'s premise that no face model was commercially usable.
- **Measurement.** E-GNM1 against the bake-off bars. The G6 teeth/tongue gate. The Hindi lip bench (r vs current 0.537 hi [M]). Emotion-judge pass rate. Asset size within the 1.5-2.2 MB B-tier budget.
- **Cost and effort.** L. The work is offline pipeline only.
- **Licence.**
  - GNM is Apache-2.0. A2F-3D is under the NVIDIA Open Model License and runs at build time only, so the Azure-only rule is untouched.
  - **Excluded:** LAM renderer, FLAME assets, MetaHuman (not usable for training; look reference only).

### 17. Read-aloud scoring on Azure Pronunciation Assessment

- **Source.**
  - Azure Pronunciation Assessment supports `hi-IN` and `en-IN`; scripted mode with miscue flags omissions and insertions [V] (https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/main/articles/ai-services/speech-service/includes/language-support/pronunciation-assessment.md).
  - Limits: 30 s or less per utterance, and prosody scoring is en-US only.
  - Reading Coach, Amira and Ello all score against the reference text.
  - Full analysis: T-S5.
- **Mechanism.** The child reads a real NCERT passage. Per-word miscues are scored against the text, challenge words go to the ledger, and challenge-word practice follows.
- **Taxila adaptation.**
  - New `server/voice/readaloud.js` (≤ 30 s chunks, with continuous-mode diffing in code).
  - Challenge words become evidence through an existing class (low LR) in `server/learner/kt/adapter.js`.
  - The read-along speech window that already exists host-side (`engines-in-sandbox-frame-v1`).
  - Offline practice stories go behind the Forge gates.
  - Grep finds no `pronunciation` in `server/`, `src/` or `shared/` today [T].
- **Expected impact.** Opens Hindi and English reading for classes 1-5, the largest content gap against the world-best products.
- **Measurement.** Miscue agreement with human annotators on E1 children (κ ≥ 0.7) **before** it touches the ledger. Accuracy on Indian children's voices is unknown.
- **Cost and effort.** M.
- **Licence.** Azure Speech, which is in policy.

### 18. Off-plan latency: token diet, service overhead, speculative launch

- **Source.**
  - Taxila's own measurements [T]: 1.29 s of the T1 fill is service overhead, and 24.5% of the payload is `null`.
  - Azure priority processing excludes gpt-5.6-luna [V].
  - Speculative Actions / SPORK / PASTE.
  - Full analysis: G-S3, G-S4, G-S5.
- **Mechanism.**
  - Write only the active language.
  - Drop nulls.
  - Trial a Lark line DSL (about 380 → 150-200 tokens).
  - Test an India region, keep-alive and the asynchronous content filter. The filter is safe only because Taxila's own gate precedes paint.
  - Start fills speculatively from partial tool arguments or misconception signals, and **mount only on match**.
- **Taxila adaptation.** `server/forge/index.js`, `server/forge/planner.js`, `server/forge/cache.js` and `server/director/modules.js`. Priority processing applies only on the sol/brain lanes, with downgrades logged.
- **Expected impact.** About 0.7-0.9 s saved from tokens, plus whatever of the 1.29 s overhead the region and keep-alive tests recover. Unmeasured.
- **Measurement.** T1 p50 from 1.88 s to ≤ 1.0 s, T2a p50 from 3.08 s to ≤ 2.0 s. Speculation waste (unmounted fills / launched) ≤ 60% under the capacity governor.
- **Cost and effort.** M.
- **Licence.** None. All Azure.

### 19. Forge behaviour gates scored strictly, as interaction graphs and checklists

- **Source.**
  - EE-Eval, FSM vs ideal graph [V] (https://arxiv.org/abs/2606.31012): r 0.728 with humans; unit tests −0.60; VLM judge 0.53.
  - GameASG [V]: a 93.2% mean check pass, but only 55.3% of tasks pass every check.
  - KVBench checklist judging [V] (https://arxiv.org/abs/2604.22302): κ 0.745.
  - ManimAgent holistic VLM vs human [V]: r −0.17.
  - Full analysis: G-S6, G-S7, G-S9, H-S11.
- **Mechanism.**
  - Each template and archetype gets an ideal state graph, compared with the solver's reachable graph.
  - Only *all-checks* pass rates are reported, never means.
  - Judges are yes/no checklists with a code verdict, plus a second judge from a different model family.
  - A browser-agent playtester advises on offline builds only.
- **Taxila adaptation.** `server/forge/g2/qa.js` and `server/forge/g2/critic.js` sit under `forge-qa-ladder` (code oracles block, models advise) and `forge-dumb-policy-gate`.
- **Expected impact.** Catches the dominant failure in generated interactives: they look right but behave wrong (InteractScience: 53% of failures are logic or science errors [V]).
- **Measurement.** All-checks pass rate per archetype. Judge κ against human ≥ 0.7 before any judge gates anything.
- **Cost and effort.** M.
- **Licence.** Methods only.

### 20. Negative memory: failure patterns go last in the builder brief

- **Source.** ManimAgent's negative channel halved reflection rounds (12.2 → 6.5) and raised human pass@1 from 62.0% to 84.9% [V] (https://arxiv.org/html/2606.30296v1). Full analysis: G-S8.
- **Mechanism.** Human-approved failure patterns from QA rejects become hard constraints, **placed last** in the brief (the inherited "position is mechanism" law), written as shapes, not sentences.
- **Taxila adaptation.** `server/forge/g2/brief.js`, `design.js` and `review.js`. Patterns are kept in a versioned file with a budget gate, so truncation throws.
- **Expected impact.** Fewer repair rounds means lower Forge cost and faster catalogue growth.
- **Measurement.** Repair rounds per build, and first-pass validity per mechanic, before and after.
- **Cost and effort.** S.
- **Licence.** None.

### 21. Interest re-skins in the child's own words, plus a corpus cultural audit

- **Source.**
  - Lin et al. 2024 meta-analysis: interest g = 0.55, but only k = 6 transfer effects [V abs].
  - Leong CHI 2024 (n = 272): no learning difference, higher motivation [V abs].
  - LLM localisation into Hindi and six other languages: 33.5% agreement on substitutions, entropy collapse in all 21 model-language pairs, wrong currencies and festivals [V abs] (https://arxiv.org/abs/2606.11009).
  - Full analysis: H-S6, H-S7.
- **Mechanism.**
  - Take the interest in the child's own words.
  - Run four validators plus a locale check, with one revise round.
  - Code checks that the re-skinned item solves to the same key.
  - A corpus-level audit checks diversity and locale across *everything* generated, not item by item.
- **Taxila adaptation.** The isomorphism check goes in `server/forge/kitmath.js`. Add a new `evals/interest-corpus-audit.mjs` (entity entropy, region and currency consistency). It stays an engagement knob (PZ11 F knob) until F-INT shows a learning effect.
- **Expected impact.** Engagement, and protection from the cultural-flattening failure no item-level gate can see. **It is not a learning claim.**
- **Measurement.** Isomorphism 100% (blocking). Corpus entity entropy vs a human-authored baseline. F-INT on time-on-task and `y_delay`.
- **Cost and effort.** M.
- **Licence.** None.

### 22. A difficulty bandit inside one admissibility predicate

- **Source.**
  - Chung et al. 2026: RL-chosen difficulty gave **+0.15 SD on an unassisted exam** over 5 months in 10 Taipei schools [V abs] (https://arxiv.org/abs/2608.16907).
  - MC-CPO: 26.5% of Junyi interactions were engagement with no mastery gain; constraining actions up front by mastery beat filtering afterwards [V abs, offline] (https://arxiv.org/abs/2604.04251).
  - Full analysis: T-S10, H-S8. Merged as `open-adaptive-difficulty-reopened`.
- **Mechanism.**
  - A single `admissible(view, action)` predicate gates every adaptive chooser: the re-teach bandit, difficulty and Conductor picks.
  - Within that set, a within-child randomised bandit picks difficulty.
  - Reward = next item correct **without help**, never engagement.
  - An engagement-without-mastery rate is monitored.
- **Taxila adaptation.** `selectNext()` in `server/director/items.js`. The predicate lives in a new pure `server/director/admissible.js` shared with `reteach-randomise-from-second`.
- **Expected impact.** Either reopens adaptive sequencing as a lever or closes it with Taxila's own null.
- **Measurement.** Within-child micro-randomisation. Unassisted next-item success. Tercile check (item 4). Engagement-without-mastery ≤ 10%.
- **Cost and effort.** M.
- **Licence.** None.

### 23. Kit schema v-next: aha, progression, representation order, example type

- **Source.**
  - Brilliant: a generator went from 0% to 93% correct in 48 hours by changing the representation, not the model [V] (https://blog.brilliant.org/hand-crafted-machine-made/).
  - Rau, Aleven & Rummel 2010: blocked-then-mixed *representations* help low-prior children [V].
  - Full analysis: T-S9, H-S9.
- **Mechanism.** Each skill declares:
  - its `aha`, the one insight;
  - a `progression`;
  - a representation sequence: one representation, then a `translate_rep` turn where the child says how the two map, then mixed.

  A re-teach that switches picture must include the mapping turn.
- **Taxila adaptation.** Add fields to `data/kits/SCHEMA.md`, `server/content/kits.js` validation, and a Director rule. Forge tracks first-pass validity per mechanic.
- **Expected impact.** Better generators (Forge) and better transfer on representation switches.
- **Measurement.** Forge first-pass validity before and after. Transfer items after a representation switch, with vs without the mapping turn.
- **Cost and effort.** S for code. The real cost is authoring across the kit library, which is M-L.
- **Licence.** None.

### 24. Grader hygiene: pinned version, idea units first, timing lint, self-repair split

- **Source.**
  - Hao 2026: different LLMs reply differently in the same context [V abs].
  - Louw, SLaTE 2025: translating first improved child retell scoring [V] (https://www.isca-archive.org/slate_2025/louw25_slate.pdf).
  - Uehara 2026: writing pauses into the prompt adds nothing [V abs] (https://arxiv.org/abs/2608.26137).
  - Nguyen 2020: self-repair in 7-year-olds predicts executive function [V].
  - Full analysis: U-S5, U-S6, U-S9, U-S11.
- **Mechanism.**
  - Error tables are kept per `graderVersion`, and any model swap reruns M-GRADE.
  - Teach-backs are scored first by counting the kit's idea units in code (R-IDEA), with the LLM handling paraphrases only.
  - A prompt lint bans pause or timing annotations in grader and Director prompts.
  - `selfRepairToCorrect` is split from `disfluencyPer100Words`, for metacognition only. It never feeds pL.
- **Taxila adaptation.**
  - The grader lane of `comprehension-grading-closed-label`.
  - `server/voice/features.js`.
  - A lint in `evals/`.
- **Expected impact.** Prevents silent grading drift, the failure that would quietly corrupt every downstream claim.
- **Measurement.** M-GRADE κ per graderVersion ≥ 0.7. R-IDEA vs human agreement. A/B of translate-then-grade.
- **Cost and effort.** S.
- **Licence.**
  - **Can train on:** XES3G5M (MIT), MathDial (CC-BY 4.0, but its students are LLM-simulated).
  - **Evaluation only:** CoMTA.
  - **Non-commercial:** EdNet.

### 25. The parent loop: Parent CoPilot card, plus the child's own explanation

- **Source.**
  - Tutor CoPilot: probing questions over generic praise, about $20 per tutor per year [V].
  - Seesaw: families see teacher-approved work [S] (https://help.seesaw.me/hc/en-us/articles/203729445-Navigating-Seesaw-as-a-family-member).
  - Full analysis: T-S8, V-S10.
- **Mechanism.**
  - At day end, three probing-question suggestions built from the child's *actual* error, with no praise lines.
  - Optionally, a weekly teach-back transcript or clip attached to a claim that has already passed the claim gate.
- **Taxila adaptation.**
  - Generated behind the report gates in the Conductor day-end job, building on `b3-parent-try-at-home-from-letter`.
  - The clip needs an owner decision (no raw child audio is stored today), its own consent, and the child's assent. Ship the transcript first.
- **Expected impact.** Turns the parent into the dose enforcer (item 6) and a second tutor.
- **Measurement.** Randomise card vs no card, with the delayed check on the carded skill as outcome. Parent open rate.
- **Cost and effort.** M.
- **Licence.** None. The clip is gated on consent.

---

## Kept but outside the 25 (ranked lower on effort, evidence or a pending decision)

- **Lane B Voice Live probes** (V-S7, V-S8; inbox `open-live-reference-aec`, `open-voicelive-word-timestamps`):
  - Live-Reference AEC, because our pause-then-decide barge-in creates the more-than-2 s delayed-playback case.
  - `smart_end_of_turn_detection`, whose API is preview. The owner must decide on preview capabilities for minors.
  - Word timestamps for en-IN DragonHD, which could reopen karaoke for lane B.
- **Splat HD face tier** (A-S3, A-S4, A-S9):
  - One splat per GNM vertex, trained offline with `gsplat` (Apache-2.0) and rendered by Spark (MIT).
  - Distilled to linear blendshapes. Ships only to phones passing E-GS1 at 30 fps, and is governed by `src/avatar/tier.ts`.
  - It comes after item 16.
- **Text-LLM KT challenger** (U-S3): Next-Token KT reaches AUC 89-90 on Eedi [V] (https://arxiv.org/abs/2511.02599). Offline only, as a K6 challenger and a cold-start prior source for `server/learner/kt/priors.js`. A leakage audit comes first.
- **LLM-estimated item difficulty for Forge cold start** (U-S7): `b_prior` with sd 1.0, and never discrimination (ρ 0.231 [V abs]).
- **Constraint-solved figures** (G-S10): the model writes declarative constraints, a solver places points, a headless browser verifies. Built on JSXGraph (MIT). GeoGebra is excluded (commercial licence).
- **PromptWizard** (T-S11, MIT): optimise prompt *shapes* offline against our evals on Azure OpenAI.
- **Speak while you sketch** (T-S12) for classes 4-9 maths.
- **Show the child the evidence that hard practice works** (H-S12).

---

## What would make Taxila the best in the world: the five bets where we can lead

Matching the field is items 1-25. Leading means doing something nobody has published or shipped, on a base only Taxila has: always-voice lessons in Hindi, English and Hinglish, code-graded closed-set evidence, a scheduler that already places delayed and woven checks, and a parent who is in the loop every day. Each bet has a kill condition.

### Bet 1: the first calibrated, voice-native understanding detector (Epistemic Speech Evidence)

- **Why it is a lead.** No system turns children's speech into *calibrated* evidence of understanding (U §0.1, §4).
- **What it would produce:** the first published calibration curve (ECE, deferral error ratio, Δ AUC on delayed transfer) for a voice tutor, in three languages, for ages 6-15.
- **How it works.** Every graded answer is later followed by the delayed or woven check the scheduler already places, and that pair is a free training label. The model is per-child and hierarchical, on epistemic features only:
  - latency z;
  - `selfRepairToCorrect`;
  - IDK vs IDK_R;
  - hedges on correct answers.

  Pitch and energy are excluded.
- **What it outputs.** Only an evidence multiplier clamped to [0.9, 1.1], exactly the re-entry bar `comprehension-voice-zero-weight` already sets. When it disagrees with the ledger, it triggers "still checking" (item 7).
- **What it builds on:** items 7, 8 and 24.
- **Kill conditions.** Microsoft says in writing that restriction 12 covers latency-based knowledge inference (keep the text features only). Δ AUC < 0.03 after two monthly fits (then publish the null). The effect differs by home language by more than 0.02 AUC.

### Bet 2: the tutor that closes gaps instead of widening them

- **Why it is a lead.** Every 2025-26 trial (Sierra Leone, Nigeria, Kenya, Maryland) skews gains toward the stronger students. Nobody has published an AI tutor whose bottom tercile gains as much as its top.
- **The design.**
  - The equity floor (item 4) is a *release gate*, not a report.
  - Low-baseline structure: worked example first, one next step, no menus.
  - The adult-enforced dose (item 6, parent slots).
  - The parent loop (item 25).
  - Cost in LAYS per $100, so the claim is comparable with EIDU's 4.6-5.5.
- **The claim to earn:** bottom/top tercile gain ratio ≥ 0.8 at a cohort scale, reported with the first efficacy number.
- **Kill condition.** If the gate blocks every pedagogy change for two quarters, the profile is wrong. Revisit with Taxila's own tercile data, not the literature's.

### Bet 3: child-native Hinglish turn-taking

- **Why it is a lead.** No turn model exists for children speaking Hindi or Hinglish. The open full-duplex models are English and French only, and they backchannel badly.
- **The design.** Item 3's predictive endpoint and item 15's contingent listener, trained label-free on our own consented children. Next-Turn targets come from timestamps, ASR ground truth from prompt-match, and both are licence-clean.
- **The claim to earn:** the first child Hinglish SHIFT/HOLD benchmark, and a teacher who neither interrupts a thinking 7-year-old nor makes a finished one wait.
- **The asset left behind:** a consented child turn-taking dataset of features and timestamps, which nobody else can legally collect quickly.
- **Kill condition.** The fine-tune adds less than 0.03 AUC over Smart Turn v3.2 off the shelf. Then ship the stock model and drop the training programme.

### Bet 4: verified-instant generated content, with a published correctness rate

- **Why it is a lead.** ChatGPT, Claude and Gemini all ship generated learning visuals, and **none publishes a correctness rate**. Their free-code paths take seconds to minutes.
- **The design.** Taxila already has the converged architecture: models fill data, tested code renders, grades and animates, with 0 ms on the planned path [T].
- **What leading means:**
  - off-plan first paint p90 ≤ 300 ms (items 9, 18);
  - plus a *published* strict all-checks pass rate per archetype (item 19);
  - plus code-verified isomorphism for every personalised item (item 21).
- **Kill condition.** The all-checks rate on off-plan fills stays below 95% after the gates land. Then off-plan requests fall back to curated modules only, and the claim is not made.

### Bet 5: the NCERT misconception atlas, harvested from real children

- **Why it is a lead.** The best misconception classifiers in the world (Kaggle MAP) win by restricting labels per item, and nobody has the item sets for Indian curricula.
- **What it combines:**
  - Taxila's verified kits (blind-solved keys);
  - per-item harvesting from real turns (item 13);
  - error-type routing (item 1);
  - per-child calibrated evidence (bet 1).
- **The claim to earn:** child-observed misconception sets with prevalence by class, board and medium.
- **What it compounds into:**
  - better grading;
  - better re-teach arms;
  - better generated traps (`forge-live-is-g1-fill` uses "this child's errors as traps");
  - a publishable, CC-BY-licensable dataset of closed-set outcomes, with no audio and no transcripts.
- **Kill condition.** Reviewer acceptance stays below 30% after 8 weekly cycles. Then the closed sets are already near-complete, the harvest becomes a monitor, and the atlas claim rests on the kits alone.

**A deliberate non-bet: the photoreal face.**
- Items 16 and the splat tier will make the face commercially clean and much better.
- But Duolingo's best-loved tutor is a 2D puppet under 1 MB, and Microsoft chose 40 stylised faces for Copilot Portraits. Realism should be measured per age band (A §0.7), not assumed to win.
- We match the world here. We do not stake the lead on it.

---

## Sources

Each item names its primary sources inline, and the six sweep files hold the complete, tagged source lists, all accessed 2026-10-03:

- `tutoring-products-pedagogy.md` §6
- `understanding-detection.md` §6
- `hyper-personalisation.md` §6
- `generated-learning-content.md` §7
- `talking-avatars.md` (Sources)
- `voice-ux-smoothness.md` §6

Where a sweep marked a source as 403 or behind a login, the claim keeps its [S] or [U] tag here. Examples: OpenAI's Study Mode page, the World Bank Nigeria paper, Epic's MetaHuman licence page and the Desmos ToS.
