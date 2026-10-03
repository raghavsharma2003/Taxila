# World-best: detecting real understanding in an always-voice tutor

**Date:** 2026-10-03 · **Area:** knowledge tracing (BKT/DKT/AKT/simpleKT/LLM-KT), dialogue-based assessment, teach-back and
self-explanation grading, misconception diagnosis, ICAP, process data, voice signals, open learner models, stealth
assessment and ECD, benchmark datasets. · **Status:** research extension. Nothing here has been run on children.

**What this file is NOT.** It does not repeat what Taxila has already researched and, in most cases, built:
`docs/research/learning-science.md` §1 (ICAP, ECD, P1-P24 probes), `learner/kt-algorithms.md` (BKT-R, FSRS-6, grid-ADF
θ, PFA challenger, grader-confusion folding), `learner/LEARNER-MODEL.md` (LM1-LM18), `learner/dialogue-affect.md`,
`comprehension/papers-2025-2026.md` (M1-M11 and 15 headline findings), `comprehension/products-live.md`,
`comprehension/game-stealth.md`, `comprehension/conversation-probes.md` (C01-C36) and
`comprehension/COMPREHENSION-ENGINE.md` (CE1-CE12). Read those first. This file adds **newer evidence (late 2025-2026),
corrections, a dataset licence matrix that nobody had compiled, the exact Microsoft Code of Conduct boundary for
voice signals, and a steal list mapped to the shipped modules** (`server/learner/kt/*`, `server/comprehension/*`,
`server/voice/features.js`, `server/learner/affect.js`).

**Tags.** **[V]** read in the primary source this session (abstract or full text; "abs" marks abstract only).
**[S]** secondary (a search summary, a blog, or a citation inside another source). **[U]** unverified, or a Taxila
design inference that has to be measured. **[T]** confirmed by reading Taxila's own code or docs this session.

---

## 0. The answer on one screen

1. **The field's frontier has moved from "better sequence models" to three things Taxila already has in some form:**
   item text in the model, explicit uncertainty or abstention, and delayed or transfer outcomes as ground truth. What
   it has *not* moved on is voice. No published system turns children's speech into calibrated evidence of
   understanding. That gap is still open in October 2026 (§1.4).
2. **Text-LLM knowledge tracing now clearly beats classic KT on rich-text data.** Next-Token KT (Norris, Gal &
   Bulathwela, Nov 2025, rev. Jan 2026) reaches AUC 89-90 on Eedi with LLaMA-3.2 1B/3B + LoRA, against DKT 73.2,
   AKT 72.4 and DTransformer 73.2. On cold-start questions it holds 0.843 while baselines fall 0.777 → 0.732 [V].
   Treat it as an **offline challenger and a cold-start prior**, never as the online ledger: the gain is unreplicated,
   the code is "published upon acceptance", and the Eedi features need a leakage audit (§3, A1).
3. **Abstaining is now a measured best practice.** Eedi's own KT team: deferring the 20% most uncertain predictions
   raises accuracy 2.3-3.0 pp and AUC 1.9-2.4 pp. Deferred predictions are wrong 1.45-1.60x as often as retained
   ones (Mitton et al., IRAISE 2026) [V abs]. Taxila's "observed, not yet certain" wording is the right instinct.
   It is not yet a **computed abstention state with a measured deferral error ratio** (steal S2).
4. **The best misconception classifiers in the world win by restricting the label space per item.** In the Kaggle
   MAP competition (Eedi data: 52k explanations, 15 questions, 1,850+ teams), the top MAP@3 scores were above 0.948.
   The organisers say plainly that the winners "could limit predictions to only the subset of misconceptions
   previously observed" per question, and that transfer to new questions is untested [V]. Taxila's kit-keyed
   closed sets (CE5) are the *deployable* version of the same trick. The lesson is to **harvest per-item misconception
   sets from real turns**, not to train a general classifier (S4).
5. **The Microsoft Code of Conduct (v4.0, 2026-05-01) bans inferring "emotional states" from "speech patterns"** [V].
   It says nothing about inferring *what the child knows* from timing. Taxila's 2026-10-02 rejection
   `ct-no-voice-emotion-inference` is correct, but its consequence, "prosody-based affect detection is rejected", is
   narrower than people read it. **Epistemic speech evidence** (P(correct), retrieval failure vs absence) is a
   different act from emotion inference. It needs a written confirmation from Microsoft. Until then it is research
   telemetry only (§1.5, S1, S3, the research advance in §4).
6. **LLMs cannot yet code ICAP reliably.** In-context LLM vs human κ = 0.59-0.66 on a 7-point extended ICAP, against
   human-human 0.97, with every disagreement in the middle levels (Do et al., Jul 2026) [V]. ICAP belongs in **move
   design** (what the teacher asks), not as a scored learner state (S8, A4).
7. **LLM item-difficulty estimation works; LLM item-discrimination estimation does not.** Simulated-classroom
   difficulty correlates r = 0.75-0.82 with real item p-values for grades 4/8/12 (2601.09953) [V abs]. But 42 LLMs
   reached only a stratified rank correlation of 0.231 for *discrimination* (Chen et al., Jun 2026) [V abs]. Use LLMs
   for **b priors with wide variance, never a**. This applies directly to Forge items (S7).
8. **Correction for our own docs (A6).** A Hugging Face card summary can say MathDial's "students appear to be human".
   They are not. MathDial pairs human teachers with **LLM-simulated** students, which is why LLMKT scores 76.7 there
   and 65.8 on real CoMTA (already in papers-2025-2026 #1) [V]. Any benchmark row must be labelled
   "simulated student" or "real student" (S12).

---

## 1. Landscape: who does what better than anyone (2024-2026)

### 1.1 Knowledge tracing models

| system / paper | what it does better than anyone | number | tag |
|---|---|---|---|
| **NTKT, Next-Token KT** (Norris, Gal, Bulathwela; arXiv 2511.02599, rev. 2026-01) | Puts the whole history *and the question text* into a small LLM as tokens, then predicts the next response token. Best cold start on new questions and new users | Eedi AUC: NTKT-3B 90.32, NTKT-1B 89.10, No-FT LLaMA 75.60, DKT 73.23, DTransformer 73.23, AKT 72.37. Question cold start: NTKT 0.843 flat, baselines 0.777 → 0.732 | [V] html |
| **Selective-prediction KT** (Mitton, Bhattacharyya, Abboud, Woodhead / Eedi; arXiv 2509.21514, IRAISE 2026) | Uses MC-dropout epistemic variance to defer uncertain predictions. The first deployment-framed "know when you don't know" KT | 20% abstention: +2.3-3.0 pp accuracy, +1.9-2.4 pp AUC. Deferred cases have 1.45-1.60x the error. The MC-dropout lift is about 5x the IRT-baseline lift | [V abs] |
| **Difficulty-aware dialogue KT** (Huang, Scarlatos, Lee, Lan; BEA 2026, arXiv 2605.01097) | Maps LLM outputs onto IRT ability and difficulty *per dialogue turn*, with the next tutor-posed task as input | "outperforms existing KT baselines" on CoMTA and MathDial; numbers not in the abstract | [V abs] |
| **ConceptKT** (LREC 2026, arXiv 2603.24073) | Predicts *which concept* will fail next, not just right/wrong; annotates the missing concepts behind wrong answers | Retrieving history by conceptual alignment improves both tasks; no headline number in the abstract | [V abs] |
| **Duolingo Birdbrain** V1 → V2 | V1 is Elo-generalised logistic IRT with one SGD step per exercise. V2 is an LSTM with a 40-d state, updated within minutes. It runs at the largest scale of any KT | "consistently caused engagement and learning measures to increase" in controlled tests; no numbers | [S] IEEE Spectrum |
| **pyKT / simpleKT** (NeurIPS 2022; 2302.06881) | The honest benchmark: shows many DLKT gains are minimal or come from leakage, and gives the tough-to-beat simple baseline | (carried in market/china-asia.md) | [V via sibling] |
| **Label-leakage fixes** (arXiv 2403.15304; KTbench) and **temporal-order bugs** (the Code-DKT re-evaluation, 2605.04727) | Multi-KC questions leak labels across expanded KCs. Some official code does not sort by timestamp | qualitative | [S] |
| **LKT automated search** (JEDM; Pavlik line) | Feature-searched logistic KT beats DKT with orders of magnitude fewer parameters | (search summary) | [S] |

**Read across.** On real children, the best online ledger is still an interpretable Bayesian or logistic model with
good features. Text-aware LLM-KT wins offline on rich-text MCQ logs. Neither has been shown on spoken dialogue with
children. Taxila's BKT-R ledger plus PFA challenger (K6) stays right. The challenger family should **add an
NTKT-style text model** (S3).

### 1.2 Dialogue-based assessment, teach-back and self-explanation

| system / paper | best at | evidence | tag |
|---|---|---|---|
| **ETS conversation-based assessment (CBA)** (Zapata-Rivera, Forsyth, Graf, Jiang; ECD-based conversations with LLMs, 2024-2025; Hou et al. AIED 2025, multi-agent CBA) | ECD-designed follow-up questions that elicit *missing* evidence. The longest-running assessment-grade dialogue programme | Earlier knowledge-engineered CBA interpreted 439/480 (91.5%) follow-up responses of English learners correctly (Lopez et al. 2021, ETS RR) | [S] |
| **Model-swap instability** (Hao, AIME-Con 2026, arXiv 2608.24920) | Shows that the *same* conversation context gives semantically different replies across LLMs; "prompting and conversational context alone may not be sufficient to preserve response consistency" | qualitative | [V abs] |
| **LLM Protégés** (Kucharavy et al., BEA 2025) | An LLM tutee prompted to err; students who diagnosed it gained | +0.72 on a 1-6 grade scale for "LLM Solved" vs base (p < 0.016, CI 0.11-1.09). Self-selection risk: the gain is in those who *succeeded*. On-prem code: github.com/Reliable-Information-Lab-HEVS/LLM_Proteges | [V full] |
| **Unlearned novice tutees** (arXiv 2603.26142) | Machine unlearning keeps the tutee novice better than prompting does, and it relearns along realistic trajectories | qualitative | [V abs] |
| **Oral narrative / retell scoring, children** (Louw et al., SLaTE 2025, Afrikaans and isiXhosa) | ASR → (linear features or LLM) → comprehension and narrative scores in low-resource languages | LLM beat linear in most cases. **Translating the ASR text to English before the LLM improved scoring.** Intervention-need accuracy > 80% (Afrikaans) and 64% (isiXhosa), vs a speech therapist's re-assessment of 80% and 70% | [V full] |
| **TNL retell pipeline, grades 3-8** (Shankar et al., SLaTE 2025) | Reranked ASR hypotheses → LLM rubric scoring → feedback; "LLMs can reliably replicate expert annotations" | (abstract) | [S] |
| **Self-explanation grading in programming** (arXiv 2605.21614) | LLM classifies the correctness of self-explanations | accuracy 0.96 / F1 0.98 vs semantic similarity 0.65 / 0.72 (adult CS; carried in papers-2025-2026) | [S] |
| **Speech timing vs LLM pause text** (Uehara, arXiv 2608.26137, Jun 2026) | Shows that fluency information lives in **measured timing features**: writing pauses inline into the LLM prompt does not beat aggregate pause statistics (Δ −0.069, CI −0.15 to +0.08). The hybrid reached ρ 0.818 vs the median human rater's 0.73 | adult L2 | [V abs] |

### 1.3 Misconception diagnosis

| system / paper | best at | evidence | tag |
|---|---|---|---|
| **Kaggle MAP: Charting Student Math Misunderstandings** (Vanderbilt + The Learning Agency + Eedi, Jul-Oct 2025) | The largest public benchmark of *explanation-level* misconception labels | 52k explanations, 15 questions, 3-step labels (correct? → target error present? → which error). Over 1,850 teams; top MAP@3 above 0.948. 1st place: shared-prefix "suffix classification" with FlexAttention masks. 2nd: soft labels from model averaging plus 80k synthetic examples. 3rd: auxiliary tasks (correctness, error type). Multi-seed validation was "the most critical aspect". Inference took up to 190 min per component on A100s. **Not shown to generalise to new questions** | [V] case study; [V] dataset paper (Rittle-Johnson et al., AIME-Con 2025) |
| **Eedi Mining Misconceptions (Kaggle 2024)** | Retrieve-and-rerank of distractor → misconception over 2,586 labels | (carried in learning-science.md) | [S] |
| **"Correct answer trap" detectors** (2606.23205, 2605.23925) | Hidden misconceptions behind correct answers | 4-8 false alarms per hit (carried in papers-2025-2026 #3) | [V via sibling] |

### 1.4 Voice, prosody and process signals

| source | finding that matters | tag |
|---|---|---|
| **Smith & Clark 1993**, *J. Memory & Language* 32:25-38 (n = 25, 40 questions each, feeling-of-knowing (FOK) ratings, then a recognition test) | The weaker the FOK, the more often answers carried rising intonation, hedges ("I guess") and "uh/um", and **"I don't know" rather than "I can't remember"**. "uh" signals a short delay and "um" a long one. The *lexical choice between not knowing and not recalling tracks FOK* | [V abs via ScienceDirect/ProQuest summary] |
| **Brennan & Williams 1995** (feeling of another's knowing) | Listeners use these cues to judge a speaker's knowledge, so a human tutor reads them | [S] |
| **West, Baer, Yu & Odic 2025**, *Dev Sci* (5-8 years) | Children's disfluency tracks *accuracy*, not confidence (carried: papers-2025-2026 #11) | [S] |
| **Nguyen, Del Tufo & Cutting 2020**, *Sci Stud Reading* (n = 82, age ≈ 7.5) | Making miscues tracks weaker reading. **Self-correcting a miscue is predicted by better executive function beyond reading skill** (working memory +9%, shifting +7% of variance; basic reading 18%) | [V full] |
| **Audio LLMs lose paralinguistics before the output** (2609.00727) | Do not ask the realtime model "did she sound unsure?" (carried: papers-2025-2026 #12) | [V via sibling] |
| **Uehara 2026** (above) | The timing signal has to be *measured*, not narrated to an LLM | [V abs] |
| **Cheng et al., SIGDIAL 2023** (2410.14050) | Multimodal (video) cues of children's uncertainty; beats a multimodal-transformer baseline. Video only, so not usable by Taxila | [V abs] |

**Gap confirmed.** Searches on 2026-10-03 found no paper or product that turns *children's spoken answers in a
tutoring dialogue* into a calibrated update of a knowledge state. Reading-fluency products (Amira: matched-comparison
effect +0.26 K, +0.06 G1 on DIBELS, n = 15,424 [S, vendor]) score *reading*, not understanding.

### 1.5 The compliance boundary for voice signals (Microsoft Code of Conduct v4.0, 2026-05-01) [V]

The binding text, usage restriction 12: customers must not use Microsoft AI Services "to attempt to infer people's
emotional states from their physical, physiological, or behavioral characteristics (e.g., facial expressions, facial
movements, or speech patterns), including inferring emotions such as anger, disgust, happiness, sadness, surprise,
fear, or other terms commonly used to describe a person's emotional state." Restriction 7 bars exploiting
vulnerabilities due to age. Restriction 17 bars "persistent tracking of the individual ... without the individual's
valid consent."

What follows for Taxila [U, needs Microsoft's written answer, extending the open item in `ct-no-voice-emotion-inference`]:
- **Banned, whatever the model:** labelling a child "confused", "frustrated", "bored", "anxious" or "unsure-feeling"
  from voice timing or pitch. Confusion is a "term commonly used to describe a person's emotional state" (it is an
  "academic emotion" in D'Mello's work), so DA's CONFUSION detector must stay **text and task only**. It already does.
- **Plausibly outside restriction 12, to confirm in writing:** estimating *P(this answer is a reliable sign of
  knowledge)* from response onset latency, self-repair and the lexical "don't know" vs "can't remember" split. That
  is an inference about **knowledge and memory**, the same act as using response time in IRT. The
  `server/voice/features.js` header already constrains outputs to "capped tie-breakers, never an emotion or ability
  label" [T].
- **The scope question.** The Code applies to "applications built with Microsoft AI Services". Taxila is one. A
  homemade DSP feature extractor does not escape the Code just because it is not an Azure API.

---

## 2. STEAL LIST (ranked by expected impact per unit of work)

Each item gives: the mechanism and its source · the adaptation to Taxila's files · the expected impact · how we
measure it · licence and compliance. "Measured as" names a new measurement ID in the WB-* series. They complement
CE-M*, K*, DA-M*.

### S1. Split `IDK` into "not known" and "not recalled": a text-only feeling-of-knowing channel

- **Mechanism.** Smith & Clark 1993: speakers choose "I don't know" vs "I can't remember" according to their FOK.
  Hindi and Hinglish make the split explicitly: *pata nahi / nahi aata / maloom nahi* (absent) vs *yaad nahi aa
  raha / bhool gaya / ruko, wo kya tha / zubaan pe hai* (retrieval failure, tip of the tongue).
- **Adaptation.** `server/learner/kt/outcomes.js`: `item.open` gains `IDK_R` (recall) next to `IDK` (absent). Its
  emission sits closer to C3 for pL but counts as a **failed retrieval for FSRS only**: R drops, pL barely moves.
  `server/learner/kt/adapter.js` `openOutcome()` takes `idkKind`. `server/learner/affect.js` already holds the
  `DONT_KNOW` regex [T]; add a `CANT_RECALL` lexicon in Hindi, Devanagari, Hinglish and English. The Director
  (`server/comprehension/schedule.js`) answers `IDK_R` with a **recognition probe** (an mcq2 or a cue) inside the
  same item episode. The recognition result is the FOK validation that Smith & Clark's design used.
- **Expected impact.** Children who learned a skill and blank on recall no longer lose pL (fairer, fewer false
  re-teaches). FSRS schedules them sooner. The child also hears that forgetting is normal and recoverable [U].
- **Measure (WB-M1).** On pilot lessons: P(recognition correct | IDK_R) vs P(recognition correct | IDK). Smith &
  Clark predict IDK_R > IDK. The split ships only if the gap is ≥ 0.15 with n ≥ 200 IDK events per class, and if
  delayed accuracy for IDK_R skills is ≥ that for IDK skills.
- **Constraints.** Text only, from the transcript the grader already sees, so restriction 12 is not engaged. Persisted
  as an outcome class (academic record, M1 legal). No new data category.

### S2. A computed abstention state, with a measured deferral error ratio

- **Mechanism.** Eedi selective prediction (S-pred): defer the most uncertain 20%; deferred cases err 1.45-1.60x.
- **Adaptation.** BKT-R has no dropout, so use **parameter uncertainty**. In the offline EM refit
  (kt-algorithms §2.5), bootstrap the per-topic-type parameters (B = 50) and store the 10th-90th percentile band of
  pL for each (child, skill) at fold time. Add it to `server/comprehension/state.js` as `uncertain` when the band
  straddles a ladder threshold (`fragile`/`understood`/`durable`). `server/comprehension/report/*` and the parent
  evidence rows then say "still checking" for `uncertain`. The scheduler (`schedule.js`) gives an `uncertain` skill
  one mandatory probe before it can rise a rung.
- **Expected impact.** Fewer false "understood" claims to parents at the same probe budget [U]. It also gives the
  K7 calibration gate a principled coverage knob: ship at 80% coverage if the retained ECE ≤ 0.05.
- **Measure (WB-M2).** Delayed-probe accuracy for `uncertain` vs non-`uncertain` claims (target ratio ≥ 1.4, as Eedi
  found). Coverage-accuracy curves in `comp-engine-calc.mjs` under both truth families.
- **Constraints.** Pure code, Neon only.

### S3. An NTKT-style text-LLM challenger, offline only, on Azure

- **Mechanism.** NTKT: history plus item text as tokens, LoRA on a 1-3B LLM. AUC 89-90 on Eedi with a stable
  question cold start.
- **Adaptation.** `evals/kt-challenger/` (new): serialise the ledger's `EvidenceEvent`s plus kit item text into the
  NTKT format. Fine-tune **Phi-4-mini-instruct** (MIT licence, a Microsoft model; fine-tuning listed in Foundry
  [S]) or self-host LLaMA-3.2-3B on Azure compute (Llama 3.2 Community Licence: commercial use allowed under 700M
  MAU; check the "Direct from Azure" list before any Foundry deployment). Use it for three things: (a) **K6 challenger
  on delayed items**, (b) **cold-start priors** for new Forge items (feeding `server/learner/kt/priors.js`),
  (c) an offline audit of which (child, skill) beliefs the two models disagree on most. That third list is the
  probe-queue priority for the next session.
- **Never** let it write mastery online (LM3/D7 stay). The ledger must stay explainable to parents ("Kaise pata?").
- **Expected impact.** Cold-start AUC on new items +5-10 points if Eedi's result transfers; **unknown on voice data**
  [U].
- **Measure (WB-M3).** K6 protocol unchanged: ≥ 0.02 AUC on delayed items for 2 consecutive monthly refits, *after*
  the leakage audit A1 (time-sorted splits, no multi-KC expansion leakage, no same-item-episode leakage).
- **Constraints.** Azure-only compute. Training uses only Taxila's own consented data plus commercially licensed
  public data (§2.12). Not Eedi 2020 until its terms are verified, not EdNet, not CoMTA.

### S4. Harvest per-item misconception sets from real turns (the MAP lesson, made deployable)

- **Mechanism.** MAP winners restricted labels per question. Teams 2 and 3 added soft labels and auxiliary tasks
  (correctness first, then error type). That is exactly the three-step label ladder.
- **Adaptation.** Kits already key misconceptions per item (`data/kits/`). Add an **offline harvesting loop**. Turns
  graded `other` by `rOpt`, or `absent`/`partial` by the closed-label grader (`server/comprehension/grade/closed.js`),
  go to a weekly cluster-and-review queue. A human reviewer names new per-item misconceptions, and these become kit
  entries with verified keys. Then train a **small encoder classifier per subject** with the MAP three-step heads
  (correct? → known error? → which), for use as a *second operator* behind the LLM grader. Gurin Schleifer 2026
  showed encoders beat few-shot frontier LLMs on mid-range answers [V via papers-2025-2026 #4].
- **Expected impact.** Misconception coverage grows from authors' guesses to observed child errors. Mid-range
  ("partial") grading improves where LLMs degrade [U].
- **Measure (WB-M4).** M-GRADE κ on the "partial" stratum, encoder vs LLM; the share of `other` verdicts per item
  over time (should fall).
- **Constraints.** MAP data: check the Kaggle competition rules before training on it [U]. It is US middle school and
  English, so use it for method development, not for weights we ship, until the rules are confirmed. The encoder
  runs on Azure ML or Container Apps.

### S5. Timing is measured, never narrated: a prompt lint

- **Mechanism.** Uehara 2026: pause markers written into the LLM prompt add nothing; measured features carry the
  signal.
- **Adaptation.** A test in `evals/` (and a `compile()` assertion) that **no grader or Director prompt contains
  pause or timing annotations** (`[pause 2.1s]`, "…", "(long silence)"). Timing reaches decisions only through
  `features.js` `signalsFrom(z)` [T]. This protects graders from becoming covert emotion inferers (restriction 12)
  and from a feature that does nothing.
- **Impact.** Prevents a likely regression. **Measure:** the lint itself. **Constraints:** none.

### S6. Self-repair as monitoring evidence, separated from disfluency

- **Mechanism.** Nguyen et al. 2020: self-correcting a miscue reflects executive function *beyond* reading skill.
  Miscues themselves reflect weaker skill. The two must not be pooled.
- **Adaptation.** `features.js` already has `selfCorrectionCount`, `repetitionCount` and `fillerCount` pooled into
  `disfluencyPer100Words` [T]. Split the pooled rate. Add an ASR-side `selfRepairToCorrect` flag: the final span
  matches the key, an earlier span did not, and no tutor turn sits between them. Map it to the X13 F0 observable
  ("an unprompted correction before commit", LEARNER-MODEL §1) and to read-aloud monitoring in English and Hindi
  reading lessons. It must **never** enter pL (CE8 stays). It feeds only the metacognition layer (SR) and the
  "`selfCheckedBeforeCommit`" gate.
- **Measure (WB-M5).** Within child: does P(selfRepairToCorrect) predict delayed accuracy over pL alone (Δ AUC)? The
  CE8 entry bar still applies (≥ 0.03 AUC on delayed items within skill).
- **Constraints.** It is a behaviour-of-answer feature, not an emotion. M1 session-scoped unless counsel permits.

### S7. LLM-estimated item difficulty for Forge cold start: b only, never a

- **Mechanism.** Simulated classrooms predict p-values (r 0.75-0.82, grades 4/8/12) [V abs]. SMART (EMNLP 2025, CC
  BY 4.0 paper) aligns simulated students to IRT by DPO [V abs]. Discrimination from LLMs is poor (0.231) [V abs].
- **Adaptation.** Forge emits `b_prior` with `sd_b = 1.0` (wide) for every new generated item, from a 30-persona
  simulated class on a Foundry model. The `a` parameter stays at the population default.
  `server/learner/kt/priors.js` reads `b_prior`, and grid-ADF item updates take over from n ≥ 30 real responses.
  This is *not* the student simulator used to gate mechanics (STUDENT-SIM). It is a prior generator only, so SIM2's
  inverse-crime rule is not breached as long as reported accuracy never uses it.
- **Impact.** New items start nearer the right difficulty: fewer "too hard" first items, better success-first CAT
  (LM6) [U].
- **Measure (WB-M6).** Rank correlation between LLM `b_prior` and the fitted `b` after 30 responses, per subject and
  class band. Drop it for any band where ρ < 0.4.
- **Constraints.** Foundry Direct models only. Never a persona with a real child's attributes.

### S8. ICAP as a tagged *teacher move* and a code proxy, not a learner score

- **Mechanism.** In an ICAP-coded LLM tutor, explaining prompts drew the most Constructive and Interactive responses;
  feedback and instructing moves drew lower ones (ScienceDirect 2025, novice programmers) [S]. LLM ICAP coding is
  only κ ≈ 0.6 vs humans [V].
- **Adaptation.** Tag every shape in `server/comprehension/probes/shapes.json` and every Director move with its
  *intended* ICAP level (code metadata, no model). Report per lesson the share of child turns that a **code proxy**
  marks Constructive: ≥ N content words, not a repeat of the tutor's words (span overlap < 0.5), and either a reason
  connective (*kyunki, isliye, because, so*) or an own example (C24). Use this as a **lesson-quality metric** in
  `docs/research/conductor/observability-evals.md`, never as a per-child state.
- **Impact.** Gives the Director an engagement-depth number without behavioural profiling of the child (it is a
  property of the lesson design) [U].
- **Measure (WB-M7).** Proxy vs 2-coder human ICAP on 300 pilot turns (κ ≥ 0.6 to use it). Then: does the
  lesson-level Constructive share predict the lesson's y_delay?
- **Constraints.** Aggregate-only metric. DPDP-friendly.

### S9. Teach-back scoring by idea units first, LLM second (the retell-assessment pattern)

- **Mechanism.** Retell assessment scores *idea units / keywords* from a rubric. In Louw 2025, linear features were
  competitive and the LLM was better; translating the transcript to English before the LLM improved scoring [V].
- **Adaptation.** For C01/C02/C33/C34 teach-back probes, kits carry 3-6 **idea units** per concept, each with
  Hindi/Hinglish/English surface forms. A pure-code operator R-IDEA (new, `server/comprehension/grade/ops.js`)
  counts idea units hit. The closed-label LLM grader runs only on the units code could not match (paraphrase),
  with the quoted-span check (`span.js`) [T]. Add an **A/B arm in M-GRADE: grade the English-normalised transcript vs
  the raw Hinglish**. Gupta 2025's 9-10 pp Hindi drop [via PZ] suggests translate-then-grade may win for Hindi-medium
  children.
- **Impact.** Cheaper and more stable teach-back grades, robust to grader-model swaps (S11) [U].
- **Measure (WB-M8).** κ vs two human raters on 200 teach-backs per band: R-IDEA alone, R-IDEA+LLM, and
  translate-then-grade.
- **Constraints.** Translation runs on Azure (Azure Translator or a Foundry model). The transcript stays inside the
  session pipeline.

### S10. Keep the protégé in code (confirmation, no change)

- **Evidence.** A prompt-only LLM tutee "drifts beyond the intended knowledge level"; unlearning keeps it novice
  (2603.26142) [V abs]. LLM Protégés: only students who *successfully diagnosed* the error gained (BEA 2025) [V].
- **Taxila status.** `server/comprehension/probes/protege.js` already freezes the misconception in code until a
  `caught_fixed` with a `present` reason [T]. That is stronger than unlearning. **Add:** log "diagnosis succeeded"
  vs "teacher resolved" per protégé episode, and analyse learning gains *conditional on success*, because the
  BEA 2025 effect is in the successes.
- **Measure (WB-M9).** Delayed accuracy after a child-corrected vs a teacher-resolved protégé episode, matched on
  prior pL.

### S11. Pin the grader model, and re-run M-GRADE on every model swap

- **Mechanism.** Hao 2026: replies differ semantically across LLMs in the same context. ETS's ECD conversations
  treat the conversation script as an assessment instrument.
- **Adaptation.** Every evidence event already carries `graderVersion` [T: adapter.js signature]. Make it part of
  the grader-confusion key: confusion matrices are **per graderVersion**, and a new model version starts from its
  own M-GRADE run, never from the old matrix. Add a router rule in `docs/research/models/MODEL-ROUTER.md`: a grader
  route change is a measurement event, not a config change.
- **Measure.** Run M-GRADE per version. Block the swap if κ drops by > 0.05 on any family.

### S12. A benchmark and dataset licence matrix (use only what we may ship)

| dataset | what it is | students | licence (as found 2026-10-03) | may Taxila train shipped weights? | tag |
|---|---|---|---|---|---|
| **XES3G5M** (NeurIPS 2023 D&B) | 5M+ interactions, 18k Chinese **3rd graders**, about 8k maths questions *with text*, KC routes (hierarchy) | real | **MIT** | **yes** (closest age match, text-rich) | [V] GitHub |
| **MathDial** (EMNLP Findings 2023) | 2.86k teacher-student dialogues on GSM8k | **LLM-simulated students**, human teachers | **CC BY 4.0** | yes, for tutor-move models; **never** as evidence about real learners | [V] HF card + paper |
| **CIMA** (Stasaski et al. 2020) | Crowdworkers role-playing Italian-lesson tutoring | role-play | Creative Commons 2.5 (variant unstated in the README) | check the variant first | [V] GitHub, variant [U] |
| **CoMTA** (Khan Academy) | 188 real student-Khanmigo maths dialogues | real | Khan Evaluation Dataset Licence: **internal, non-commercial evaluation only; no training; no redistribution** | **no**; internal evaluation of our dialogue-KT only | [V] GitHub |
| **EdNet** (Riiid) | 784k students, 131M interactions, TOEIC | real | **CC BY-NC 4.0** | **no** (non-commercial) | [V] GitHub |
| **Eedi NeurIPS 2020** | 20M+ MCQ answers, ages about 7-18 | real | not found in the challenge guide this session | not until the terms are read | [U] |
| **MAP 2025** (Kaggle) | 52k explanations, 15 questions | real | Kaggle competition rules (not retrieved) | not until the rules are read | [U] |
| **ASSISTments** 2009/2012/2017 | US middle-school maths logs | real | per-release terms (not checked this session) | check per release | [U] |
| **ConceptKT** | concept-deficiency annotations | real | paper CC BY 4.0; data licence not checked | check | [U] |

**Rule (proposed).** Every eval report row names its dataset's *student type* (real / simulated / role-play) and its
licence class (ship / eval-only / research-only). Public numbers come only from "real" rows.

---

## 3. Anti-patterns the field learned the hard way

| # | anti-pattern | who learned it | what it does to Taxila if repeated |
|---|---|---|---|
| A1 | **Leaky KT evaluation**: multi-KC label leakage, unsorted timestamps, truncation leakage | 2403.15304; KTbench; Code-DKT re-evaluation 2605.04727 | A challenger "wins" K6 on a leak. Fix: time-sorted, child-held-out splits; one row per item episode, not per KC |
| A2 | **Benchmarks built on simulated students quoted as learner evidence** | LLMKT 76.7 (MathDial, simulated) vs 65.8 (CoMTA, real); Scarlatos et al. 2026 "Substance or Illusion?": prompting-based simulators "perform poorly", SFT/DPO "much better but still limited" (2601.04025) [V abs] | Inflated detector accuracy. STUDENT-SIM SIM2 already bans it; S12's student-type column enforces it in reports |
| A3 | **Competition-tuned misconception models deployed to new items** | MAP organisers: winners restricted per-question label sets; generalisation untested [V] | A general "misconception detector" fails silently on NCERT items. Keep per-item sets (S4) |
| A4 | **LLM-coded engagement or ICAP used as a learner state** | κ 0.59-0.66 vs humans, all errors in the middle levels (2607.28651) [V] | Mislabels children in the band that matters. S8 keeps ICAP as move design and lesson metric |
| A5 | **LLM-estimated discrimination** | 42 LLMs, ρ = 0.231 (2606.18709) [V abs] | Wrong item information → a mis-stopping CAT (LM6). S7: b only |
| A6 | **Trusting a dataset card summary** | this session: a card summary called MathDial's students "human" | A wrong "real student" label on a simulated benchmark. Read the paper |
| A7 | **Inline pause annotation for LLM judges** | Uehara 2026 [V abs] | A useless and compliance-adjacent feature path. S5 lint |
| A8 | **Acting on uncertain predictions with full confidence** | Eedi selective prediction: deferred cases err 1.45-1.6x [V abs] | False "understood" in parent reports. S2 |
| A9 | **Grader confusion carried across model versions** | Hao 2026 [V abs] | The folded emissions (D7) become wrong after a router change. S11 |
| A10 | **Reading a protégé gain as universal** | LLM Protégés: the gain is in students who succeeded (self-selection) [V] | Overclaiming teach-back's effect. S10 conditional analysis |
| A11 | **Treating "confusion from voice" as allowed because it is "cognitive"** | Microsoft CoC v4.0 restriction 12 lists "other terms commonly used to describe a person's emotional state" [V] | A compliance breach that ends Azure access. §1.5 |

---

## 4. The research advance: what would genuinely go beyond the state of the art

**Claim.** No system anywhere produces a *calibrated, per-child, voice-native* estimate of understanding. The
pieces exist separately: delayed and transfer ground truth (Eedi×LearnLM, used only as a trial outcome), abstention
(Eedi KT), timing-as-evidence (IRT response-time models, Math Garden), FOK speech markers (Smith & Clark, adults), and
children's self-repair (Nguyen 2020). Taxila is the only product that has all the inputs at once: an always-voice
lesson, code-graded closed-set evidence, an FSRS retrievability model and a scheduler that already places delayed
and woven transfer checks (CE7). That is the advance:

### "Epistemic Speech Evidence (ESE): self-supervised, per-child calibration of spoken-answer reliability against the child's own delayed transfer outcomes"

1. **Labels for free, from the future.** Every graded answer at time t is later followed (CE7, C31/C32) by a delayed
   or woven check on the same skill. The pair (answer at t, delayed result at t + 2-3 topics) is a training example
   for **P(delayed success | correct now, speech features now, pL now)**. No human labelling and no emotion label:
   the target is a future knowledge outcome. This is ECD's evidence model learned from the system's own
   delayed-probe schedule, which no published system does.
2. **Features, all epistemic and measured in code:** onset latency z (within child, within item difficulty band),
   `selfRepairToCorrect` (S6), IDK vs IDK_R (S1), lexical hedges ("shayad", "I think") on *correct* answers (the
   UNC-ITSPOKE "unsure-correct" cell, already in emotion-attunement.md), and ASR confidence (low = no evidence,
   kept). **Never pitch or energy** at launch: those are the closest to "speech patterns → emotion" in the
   regulator's reading.
3. **Model.** A hierarchical logistic model (population fixed effects, per-child random intercept and slope on
   latency), fitted offline monthly on Neon exports. Its only output is a **likelihood-ratio multiplier on the
   existing C0 emission, clamped to [0.9, 1.1]**. That is exactly CE8's re-entry gate ("LR ≤ 1.1 event once VF-M1
   shows ≥ 0.03 AUC on delayed items within skill"). The ESE result *is* the VF-M1 measurement, run as a research
   protocol.
4. **Abstention on top (S2).** When the ESE multiplier and the ledger disagree, the skill becomes `uncertain` and
   gets one probe. Voice therefore buys *a better-placed probe*, never a mastery jump.
5. **The publishable number.** The first published calibration curve (ECE, deferral error ratio, Δ AUC on delayed
   transfer) for a voice tutor's understanding detector, in Hindi, English and Hinglish, ages 6-15. It would also
   seed the first **consented, CC-BY-licensable Hinglish child tutoring KT dataset** (features and closed-set
   outcomes only, no audio and no transcript), filling the gap that CoMTA (eval-only, English, text) leaves.

**Why it is safe to try.** The target is knowledge, not feeling. The output is clamped and code-applied. The
features are within-child z-scores that are never shown to anyone. The DPDP M1 ratchet (LM1/LM8) keeps it
session-scoped until counsel says otherwise. The research telemetry rides on P4 with the 30-day TTL that
`affect-not-stored-as-legal-shield` already defines.

**What would kill it (reversal conditions).** (a) Microsoft says in writing that restriction 12 covers latency-based
knowledge inference: drop features 2(a) and 2(b) and keep only the text features (S1, hedges). (b) VF-M1/ESE
Δ AUC < 0.03 on delayed items after 2 monthly fits: archive it. Its log entry then becomes the first rigorous null
result for spoken-answer reliability. (c) A fairness check finds the multiplier's effect differs by home language or
speech-difference flag (PRODUCT-DESIGN A17) by > 0.02 AUC: remove those features for everyone.

### Smaller advances that are genuinely new

- **Feeling-of-knowing in a child tutor (S1):** the "pata nahi / yaad nahi" split, validated by an in-episode
  recognition probe, is an unpublished, testable replication of Smith & Clark with children in Hindi. It would make
  a short paper on its own.
- **Abstention as a parent-facing honesty feature (S2):** "still checking" as a computed state with a published
  deferral error ratio. No consumer tutor tells parents when its model is unsure.
- **Per-item misconception harvesting (S4):** NCERT-aligned, child-observed misconception sets. This is the
  deployable answer to MAP's generalisation gap.

---

## 5. Measurement backlog this file adds

| id | what | n / method | unblocks |
|---|---|---|---|
| WB-M1 | Recognition success after IDK_R vs IDK | ≥ 200 IDK events per class band; same-episode mcq2 | S1 ship |
| WB-M2 | Delayed-probe error ratio, `uncertain` vs retained claims | comp-engine sim (both truth families), then pilot | S2, K7 coverage |
| WB-M3 | NTKT challenger vs BKT-R on delayed items, after the leakage audit | K6 protocol | S3 |
| WB-M4 | Encoder vs LLM κ on the "partial" stratum; trend in `other` share | M-GRADE + weekly harvest | S4 |
| WB-M5 | selfRepairToCorrect Δ AUC on delayed accuracy within child | pilot telemetry under P4 | S6, ESE |
| WB-M6 | LLM b_prior vs fitted b, ρ per band | n ≥ 30 responses per item | S7 |
| WB-M7 | Code ICAP proxy vs 2-coder human, κ; lesson Constructive share vs y_delay | 300 turns | S8 |
| WB-M8 | R-IDEA, R-IDEA+LLM, translate-then-grade vs human κ | 200 teach-backs per band | S9 |
| WB-M9 | Delayed gain, child-corrected vs teacher-resolved protégé | matched on prior pL | S10 |
| WB-Q1 | **Microsoft written answer**: is latency/self-repair → knowledge inference within restriction 12? | email via the Azure account team | ESE features 2(a)/(b) |

---

## 6. Sources

Knowledge tracing
- Norris, Gal, Bulathwela. Next Token Knowledge Tracing (arXiv 2511.02599, rev. 2026-01). https://arxiv.org/abs/2511.02599 ; tables https://arxiv.org/html/2511.02599 [V]
- Mitton, Bhattacharyya, Abboud, Woodhead. Knowing When to Defer: Selective Prediction for Responsible KT (IRAISE 2026). https://arxiv.org/abs/2509.21514 [V abs]
- Huang, Scarlatos, Lee, Lan. Interpretable Difficulty-Aware KT in Tutor-Student Dialogues (BEA 2026). https://arxiv.org/abs/2605.01097 ; https://aclanthology.org/2026.bea-1.43/ [V abs]
- ConceptKT (LREC 2026). https://arxiv.org/abs/2603.24073 [V abs]
- LLM-KT plug-and-play instruction (2025). https://arxiv.org/abs/2502.02945 [S]
- pyKT. https://arxiv.org/html/2206.11460v5 [S] · simpleKT. https://arxiv.org/pdf/2302.06881 [S]
- Label leakage in KT. https://arxiv.org/html/2403.15304 [S] · Code-DKT re-evaluation. https://arxiv.org/html/2605.04727 [S] · LKT automated search (JEDM). https://jedm.educationaldatamining.org/index.php/JEDM/article/view/722/177 [S]
- Duolingo Birdbrain. https://spectrum.ieee.org/duolingo [S]
- Scarlatos, Baker, Lan. LLMKT (LAK 2025). https://arxiv.org/abs/2409.16490 [V via sibling]
- Scarlatos, Lee, Woodhead, Lan. Simulated Students in Tutoring Dialogues: Substance or Illusion? https://arxiv.org/abs/2601.04025 [V abs]

Dialogue assessment, teach-back, retell
- Hao. Semantic Variability of Replies Across LLMs (AIME-Con 2026). https://arxiv.org/abs/2608.24920 [V abs]
- Hou et al. LLM-Enhanced Multi-agent Architecture for CBA (AIED 2025). https://link.springer.com/chapter/10.1007/978-3-031-98417-4_9 [S]
- Lopez et al. 2021, accuracy of a CBA with English learners (ETS RR). https://onlinelibrary.wiley.com/doi/full/10.1002/ets2.12315 [S]
- Zapata-Rivera publications list. https://sites.google.com/site/dzapatarivera/resume [S]
- Kucharavy, Vallez, Percia David. LLM Protégés (BEA 2025). https://aclanthology.org/2025.bea-1.19.pdf [V full] ; code https://github.com/Reliable-Information-Lab-HEVS/LLM_Proteges [S]
- Simulating Novice Students via Machine Unlearning. https://arxiv.org/abs/2603.26142 [V abs]
- Louw et al. Automatically assessing oral narratives of Afrikaans and isiXhosa children (SLaTE 2025). https://www.isca-archive.org/slate_2025/louw25_slate.pdf [V full]
- Shankar et al. ASR + LLM scoring of TNL retells (SLaTE 2025). https://www.isca-archive.org/slate_2025/shankar25_slate.pdf [S]
- Uehara. Interpretable automated L2 speaking assessment; pause encoding (2026). https://arxiv.org/abs/2608.26137 [V abs]
- Self-explanation grading, programming. https://arxiv.org/abs/2605.21614 [S]

Misconceptions
- The Learning Agency, MAP case study. https://the-learning-agency.com/the-cutting-ed/article/case-study-math-misconceptions-competition/ [V]
- Rittle-Johnson et al. Detecting Math Misconceptions: An AI Benchmark Dataset (AIME-Con 2025 WIP). https://aclanthology.org/2025.aimecon-wip.3.pdf [V]
- MAP competition. https://www.kaggle.com/competitions/map-charting-student-math-misunderstandings ; 1st place write-up https://www.kaggle.com/competitions/map-charting-student-math-misunderstandings/writeups/1st-place-solution [S]
- Eedi blog on MAP. https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions [S]

ICAP and item parameters
- Do, Jiang, Aeron, Thomas. Extended ICAP: humans vs ICL vs reflective agents (2026). https://arxiv.org/html/2607.28651 [V]
- Prompting for Engagement: ICAP-guided prompt design (Procedia CS 2025). https://www.sciencedirect.com/science/article/pii/S1877050925035331 [S]
- Cognitive Engagement in GenAI Tutor Conversations (AIME-Con 2025). https://aclanthology.org/2025.aimecon-wip.6.pdf [S]
- Take Out Your Calculators: item difficulty via LLM simulated students. https://arxiv.org/abs/2601.09953 [V abs]
- SMART (EMNLP 2025). https://arxiv.org/abs/2507.05129 [V abs]
- Chen et al. LLMs struggle with item discrimination (2026). https://arxiv.org/abs/2606.18709 [V abs]

Voice, prosody, process
- Smith & Clark 1993, On the course of answering questions. https://www.sciencedirect.com/science/article/abs/pii/S0749596X83710028 [V abs via summary]
- Clark & Fox Tree 2002, Using uh and um. http://www.columbia.edu/~rmk7/HC/HC_Readings/Clark_Fox.pdf [S]
- Nguyen, Del Tufo, Cutting 2020. Readers recruit executive functions to self-correct miscues. https://pmc.ncbi.nlm.nih.gov/articles/PMC7954224/ [V full]
- Cheng et al. Learning Multimodal Cues of Children's Uncertainty (SIGDIAL 2023). https://arxiv.org/abs/2410.14050 [V abs]
- Amira evidence (vendor). https://www.evidenceforessa.org/program/amira/ ; https://amiralearning.com/research [S]

Compliance
- Microsoft Enterprise AI Services Code of Conduct v4.0 (2026-05-01). https://learn.microsoft.com/en-us/legal/ai-code-of-conduct [V full]

Stealth assessment
- Shute & Almond 2026, special issue preface (JRTE 58). https://myweb.fsu.edu/vshute/pdf/preface_SI.pdf ; https://www.tandfonline.com/doi/full/10.1080/15391523.2025.2587551 (403 this session) [S]

Datasets
- XES3G5M. https://github.com/ai4ed/XES3G5M [V] · MathDial. https://huggingface.co/datasets/eth-nlped/mathdial ; https://aclanthology.org/2023.findings-emnlp.372.pdf [V] · CIMA. https://github.com/kstats/CIMA [V] · CoMTA. https://github.com/Khan/tutoring-accuracy-dataset [V] · EdNet. https://github.com/riiid/ednet [V] · Eedi NeurIPS 2020. https://arxiv.org/abs/2007.12061 [S]

Azure
- Phi-4-mini on Foundry, fine-tuning. https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/fine-tuning-overview?view=foundry-classic ; https://azure.microsoft.com/en-us/products/phi/ [S]
