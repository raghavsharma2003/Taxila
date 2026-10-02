# Dialogue affect: detecting engagement, confusion, frustration, boredom and gaming from dialogue and logs

**Date:** 2026-10-02 · **Scope:** classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish teacher, server-side Director, Azure (gpt-realtime-2.1 for the call, gpt-5.6 for side classifiers), Neon Postgres.
**Builds on, does not repeat:** `learning-science.md` (LS) §1.10-1.11 (latency weak, affect dynamics, no acoustic SER, nothing affective stored), §7.1 probes P15-P22, §7.2 fusion rules. `learner/motivation-interest.md` (MI): the 11-state **moment filter** (`TurnFeatures`, emission LRs, `stepMoment`, `PICK_LR`, `M.CHOICE2`, move table §3). `learner/vibe-temperament.md` (VT): signal catalogue V1-V18, `moveOutcomeCoder`, `LogEwma`, `onChildTurn`. `learner/kt-algorithms.md` (KT): `EvidenceEvent.gaming`, the LR^0.25 gaming temper, `oppSinceStart`/`run` wheel-spin counters, the confusion-matrix folding of LLM labels (KT D7). `voice/indian-teacher-discourse.md` (DL4: *samjhe?* is phatic). `design/lesson-arc.md` (status from events; latency measured from the first *played* frame).
**What this file adds:** the **signal layer under MI's filter.** It covers how each behavioural feature is computed, normalised and gated; five rule detectors with thresholds; the **verify-before-act arbiter** with its base-rate arithmetic; the contract and reliability gate for the LLM dialogue-act labeller; teacher-response shapes per confirmed state; and the measurements that decide every number.

**Tags.** **[V]** checked this session against the primary abstract or full text. Full text was read for Baker et al. 2008, Baker et al. 2010, Paquette & Baker 2019 and Kai et al. 2018 (PDFs from the Penn Learning Analytics site); everything else was checked at abstract level, via ERIC, arXiv or Crossref/OpenAlex. **[S]** secondary only (a citing paper, title or TLDR). **[U]** unverified or a Taxila design default to be measured. Every threshold in §3-§6 is [U] by construction unless a source is named next to it.
**Method.** The session's WebSearch budget (200) was already spent. Discovery used the ERIC, arXiv, Crossref, OpenAlex (DOI lookups) and Semantic Scholar APIs (about 70 queries), plus direct PDF fetches. Springer, ACM and IEEE pages redirected to logins, so for D'Mello et al. 2008 (UMUAI) only the TLDR was seen. Its accuracies are **not** quoted.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| DA1 | **Detectors are knowledge-engineered rules over interpretable features**, not trained classifiers, until Taxila has its own labelled corpus | Moved to a new system, an expert-rule gaming model kept κ 0.23-0.26 while the ML model fell from 0.218 to **0.000-0.063** (Paquette & Baker 2019) [V]. Sensor-free affect models trained on < 1,500 students were unstable (Jensen et al. 2019) [V]. A plain decision tree survived 16 years of log drift, while newer algorithms did not (Levin et al. 2022) [V] | A model trained on Taxila children beats the rules by ≥ 0.10 κ on held-out children (not turns) in 2 consecutive quarterly refits (DA-M4) |
| DA2 | **No detector acts.** A detector emits a *suspicion*, and a suspicion buys at most one **verifying move**: a teaching move that is useful whichever hypothesis is true. Costly moves (difficulty change, prerequisite detour, break, ending the session) need a *confirmed* state | At realistic base rates (boredom and frustration 4-6% of observations each, confusion 13%; Baker et al. 2010 [V]) a decent detector is wrong most of the time (§6: PPV ≈ 0.20 for boredom). Log-only affect detection is modest: ρ 0.08-0.34 across 18 states at n = 69k (Hutt et al. 2019) [V]; mind-wandering κ 0.21 (Mills & D'Mello 2015) [V] | A detector reaches PPV ≥ 0.80 at Taxila base rates on held-out coded sessions. It may then trigger *cheap* moves directly, never costly ones |
| DA3 | **Every timing and length feature is normalised** per child × item class × modality (voice / tap), in the log domain, shrunk to an age-band prior, and read against a **session baseline** taken from the first engaged items | AutoTutor's disengagement tracker took the first 3-5 questions as the baseline and flagged deviations. Flagged items had 18.5% accuracy against 71.8% (Chen et al. 2021, n = 252) [V]. Children are about 1.5x slower than adults (LS §1.10). Shy children are slow but not disengaged (VT §1) | Raw thresholds match normalised ones within ±0.02 AUC (DA-M3) |
| DA4 | **Gaming is a pattern, not speed.** A fast action counts only *after an error on the same step*. Extremely fast actions (> 2 SD faster than normal) are noise. A fast *first-attempt* error is carelessness evidence, not gaming. **This splits MI's `fastWrong`** | Baker et al. 2008's harmful-gaming detector: fast actions are evidence only after ≥ 1 error on the step (GH5). Actions faster than −2 SD are *not* evidence (GH6-7: double-clicks). Errors on slip-prone UI are excluded (GH3). Help spam counts only after a couple of problems (GH4) [V]. Careless errors are *common among students in engaged concentration* (San Pedro et al. 2014) [V] | Coded sessions show `fastWrongFirst` predicting gaming at LR ≥ 2 (DA-M4) |
| DA5 | **Impasse before wheel-spin.** Count impasse turns on the current step. After **2 questioning moves without progress**, the next move must *address the error*, not ask again. Skill-level wheel-spin (≥ 10 opportunities, no 3 in a row) routes to the prerequisite | In 20,462 turns with an LLM chemistry tutor, each extra impasse turn cut next-turn recovery odds by 12.7% (AOR 0.873). After a failed scripted question, repeating it led to recovery in 28.1% of cases, against 39.8% when the tutor addressed the error. Questioning's benefit decayed with depth (Ahtisham et al. 2026) [V]. Wheel-spin hit 50% of the bottom-fifth prerequisite group against 10% of the top fifth (Wan & Beck 2015) [V] | DA-M6 A/B: re-questioning ≥ addressing the error on next-turn recovery in Indian children |
| DA6 | **Silence about confusion is not evidence of understanding.** Explicit affect words are rare-but-real positive evidence, and their *absence* carries no weight. Structural cues carry the load: whether the child's turn actually answers the question, clarification questions, hedges, echoes | Indian children learn that admitting not understanding gets punished (discourse doc §1.5) [V]. Pre-interview instructions raised 6-8-year-olds' appropriate "don't know" answers, so demand characteristics suppress them (Waterman & Blades 2011) [V]. In AutoTutor transcripts, *direct* affect expressions did **not** predict emotions, while psychological, linguistic and cohesion features did (R² = .38; D'Mello & Graesser 2012) [V]. Observers warn of "less demonstrative" cultures (Baker et al. 2010) [V] | MI MM1 finds lexicon recall ≥ 0.5 in band C (children do say it) → raise lexicon LRs, but absence stays weightless |
| DA7 | **The LLM dialogue-act labeller is a closed-set classifier with a measured confusion matrix**, gated per label × age band × language mix. Labels with κ < 0.60 against teacher raters are dropped. Labels at 0.60-0.80 are used with folded LRs (the KT D7 method). Confidence comes from **self-consistency** (2 samples must agree), never from the model's verbalised confidence | GPT-4 tutor dialogue acts: κ 0.74 (He & Xu 2025) [V]. An agent-tuned LLM engagement labeller reached cross-validated κ 0.78, equal to human inter-rater agreement, but 0.91-0.93 on the development set, so it overfits without held-out data (Chen et al. 2026) [V]. GPT-4 struggles on the same constructs humans struggle on (Liu et al. 2025) [V]. Validate per task (Pangakis et al. 2023) [V]. Verbalised LLM confidence is overconfident (Xiong et al. 2023) [V]. On code-mixed Hinglish sarcasm, a fine-tuned DistilBERT (84%) beat zero/few-shot LLMs (Majumder & Sen 2026) [V] | κ ≥ 0.80 on a label in every band and language mix → use it unfolded (still capped like any single turn) |
| DA8 | **Detectors are pure functions of the turn-event log, so their outputs are never stored.** They are recomputed on replay for evals and calibration | This keeps MI/VT's "nothing affective persisted" without losing the ability to measure (LS §4.3 minimisation; the compliance-deprioritised directive does not change it, because it costs nothing) | Never, while the DPDP 9(3) question is open |
| DA9 | **Session-position and time-of-day priors on drift.** The disengagement hazard rises after about 10 graded items or 12 minutes, and in late-evening sessions | In grades 2-8, the share of students with low response-time effort (RTE < 0.90) *tripled* across the school day in maths (Wise, Kuhfeld & Lindner 2024) [V]. Mind wandering began around question 11-15 of 20 (Chen et al. 2018) [V]. Rapid guessing rises with item text length and later position, and falls when an item has a graphic (Wise, Pastor & Kong 2009) [V] | DA-M5 shows no position or time effect in Taxila logs |
| DA10 | **Verifying moves are budgeted:** ≤ 1 per 4 child turns, ≤ 3 per 10 minutes, never two in a row, none in the first 3 turns | Each check-in costs time and, overused, reads as surveillance (LS §7.2 rule 5). Brief, well-timed human check-ins lifted engagement, with diminishing returns to length (Borchers et al. 2026, 191 middle schoolers) [V] | DA-M7: halving the budget loses no detection value, or doubling it costs no engagement |

---

## 1. Evidence, compressed to what changes a design

### 1.1 Ground truth is itself noisy, and culture-shaped
- **Base rates** (3 environments, Philippines and USA, field observation and self-report): engaged concentration 60%, confusion 13%, boredom, frustration, neutral and delight 4-6% each, surprise 1%. Boredom was the most persistent state and preceded gaming. **Frustration was less persistent and *not* an antecedent of gaming.** Observer κ was 0.71 for behaviour and **0.63 for affect** (Baker, D'Mello, Rodrigo & Graesser 2010) [V].
- **Different measures capture different things.** Self-report detectors tracked underlying motivation, while BROMP-observation detectors tracked in-the-moment experience (Zambrano et al. 2024) [V]. Judges disagreed on how *many* emotions a 20-s interval held (Conati & Gutica 2016) [V]. In D'Mello, Lehman & Person 2010 (n = 41, 14 states), curiosity, frustration, boredom, confusion, happiness and anxiety were the major emotions [V].
- **Coders have blind spots.** Human coders systematically counted *expressed confusion* as **engagement**, not disengagement, and the pattern surfaced only through LLM-assisted disagreement analysis (Chen et al. 2026) [V]. Taxila's coding manual must say which way confusion goes (§9 DA-M2).
- **Culture.** Help-seeking models transferred between the USA and the Philippines but not to Costa Rica, where help happened off-screen (Ogan et al. 2015) [V]. Rodrigo, Baker & Rossi 2013 compared off-task rates in Philippine and US tutor classrooms [V for the design; the result is not in the fetched abstract, U]. Indian children's silence about non-understanding (DA6) is the same kind of effect.
- **Reading:** ground truth = two trained Indian teachers coding *transcript + event replay*, with a written rule for confusion. Agreement target κ ≥ 0.6 per state. States that cannot reach it are merged.

### 1.2 Dialogue-based detection: what is known
- **Conversational cues work, but modestly.** AutoTutor's emote-aloud logs tied confusion, frustration and eureka to dialogue patterns (Graesser et al. 2008) [V]. D'Mello et al. 2008 (UMUAI) detected affect from conversational features above chance [S; accuracies not re-checked]. Text features explained 38% of variance in the proportion of each emotion (D'Mello & Graesser 2012) [V].
- **Disengagement has types.** In the ITSPOKE spoken physics tutor, the share of disengaged turns correlated negatively with learning and satisfaction. *Individual types* correlated differently, and an automatic detector reproduced the manual correlations (Forbes-Riley & Litman 2013) [V]. Uncertainty-adaptive spoken tutoring was built and evaluated in Forbes-Riley & Litman 2011 [S, titles only].
- **Responding helps when it targets the cause.** In Mindspark, an Indian maths ITS, a theory-driven frustration model built from log goal-blockage features was validated against human observers. It reported its *reasons* (Rajendran et al. 2013) [V]. Attribution-based messages by cause (praise effort, attribute the result to the identified cause, sympathise, ask the child) significantly reduced frustration instances across 188 students in 3 schools (Rajendran, Iyer & Murthy 2019) [V]. In iTalk2Learn (children, fractions, speech plus interaction), affect-aware feedback reduced boredom and *significantly* reduced off-task behaviour, with a non-significant learning advantage (Grawemeyer et al. 2016) [V]. Empathic agent messages correlated with confidence and interest; success/failure messages with more mistakes and more confusion (Karumbaiah et al. 2017) [V]. Affective AutoTutor helped low-knowledge learners (Nye, Graesser & Hu 2014 review) [V].
- **LLM-tutor era.** Ahtisham et al. 2026 (DA5) is the most directly transferable result. An ensemble of three LLMs labelled 16,986 undergraduate turns with PyTutor: confusion and curiosity were frequent, frustration rarer, and negative states often resolved quickly (Zhang, Alghowinem & Breazeal 2025) [V]. That abstract reports no human validation, so it is a description, not a detector.

### 1.3 Log-based detectors
- **Gaming.** Gaming correlated with post-test as strongly as prior knowledge did. Learned helplessness or performance orientation explained it better than lack of interest (Baker et al. 2004) [V]. GAMED-HURT students made up **8-27%** of students per lesson. The detector reached A′ 0.80 on new students (0.73 under leave-one-out) and transferred to unseen lessons at A′ 0.80 (Baker, Corbett, Roll & Koedinger 2008) [V]. Its features: many errors on a step across problems (GH1), errors on a step the student usually gets right first try (GH2), help on several steps in quick succession after a couple of problems (GH4), and fast actions after an error (GH5). Experts code gaming from **pauses before and after actions**, the same answer reused on different steps, and similar answers entered in sequence. 13 such patterns gave κ 0.33 held-out (Paquette & Baker 2019) [V].
- **Gaming is contextual.** A validated detector lost its link to learning under new conditions. Context-adjusted latent models (IRT-GD, LV-GD) restored it (Huang et al. 2022; 2023) [V]. Gaming does not mean no effort: in think-alouds, gaming students produced *longer* utterances and used reactive rather than planned regulation (Zhang et al. 2026) [V]. **So length is not engagement.** Boys gamed more during self-explanation steps in a decimals game, and this mediated the gender gap in learning (Baker et al. 2025) [V].
- **Responses to gaming.** Delaying hint and feedback access helped gamers' learning. Gamification did not do so consistently (Vanacore et al. 2024, two papers) [V]. Scooter the Tutor adapted to gaming (Baker et al. 2006) [S, title].
- **Wheel-spinning.** About 38% of students had not mastered a skill after 10 opportunities (Beck & Gong 2013, via Kai et al. 2018) [S]. Kai et al. 2018 found two profiles [V]:
  - children who skip hints on some problems but take ≥ 2 bottom-out hints within any 8 problems
  - children who take short delays between problems on the same skill, which points to spacing
  
  The two common wheel-spin criteria diverge substantially. A single-feature logistic regression detected it early with decent performance (Zhang et al. 2019) [V]. Stopout and wheel-spin detectors share features (Botelho et al. 2019) [V]. In ASSISTments, three clusters were lack of motivation, lack of knowledge and lack of metacognition (Park 2023) [V].
- **Rapid guessing.** Response-time effort (RTE) is the share of items answered slower than a rapid threshold (Wise & Kong 2005) [V]. The 10% normative threshold (NT10) is in common use (Michaelides et al. 2020, PISA) [V]. Large-scale prevalence was about 1% of responses (Setzer et al. 2013) [V]. Accuracy-informed thresholds exist (Guo et al. 2016) [V].
- **Help-seeking.** Asking for help on hard steps was productive and overusing help was not. **Avoiding help on low-prior-knowledge steps went with *better* learning** than seeking it (Roll et al. 2014, n = 38) [V]. So "just tell me" deserves a try-first response, not instant compliance and not refusal. Help-seeking feedback changed behaviour but not learning (Aleven et al. 2016) [V].
- **LLM labelling, generally.** ChatGPT beat crowd-workers on 4 of 5 tasks (Gilardi et al. 2023) [V]. Across 27 tasks, performance was highly task-dependent (Pangakis et al. 2023) [V]. Embedding classifiers for SRL codes in think-alouds: AUC 0.70-0.92, with poor cross-domain transfer (Zhang et al. 2024; Borchers et al. 2025) [V]. Simulated disengaged students: rule labels from log summaries matched human consensus at κ 0.75 (DAS2; Meng & Lin 2026) [V]. That paper is the template for the eval harness (§9 DA-M8).

### 1.4 What this changes
1. MI's `fastWrong` is split (DA4). MI's `elaborated` counts only when the turn *addresses the question* (Zhang 2026).
2. "Confusion" is timed, not detected. It is allowed to run (LS §1.11) on a clock (§5.3).
3. Each detector's job is to pick **one verifying move** (§6). The child's response is the evidence that MI's filter consumes through `PICK_LR`-style ratios.
4. Gaming responses make thinking pay (open response, try-first hints). They never moralise (VT §4.9).
5. Wheel-spin responses address the error, then the prerequisite, and never serve the 11th similar item (KT §2.6).

---

## 2. Where the layer sits

```
realtime events (speech_started, endpoint, first/last played frame, barge-in) ─┐
transcript turns (asrConf, words, lang mix)  ──────────────────────────────────┼─► TurnEvent (pure join)
module events (answer, hint, retry, option tapped, goal_met), KT outcome ───────┘
TurnEvent ─► normalise()        z_child, z_drift, length ratio            (§3)
          ─► labelActs()        closed-set acts + addressesQ  (gpt-5.6, async, 1-turn lag OK; regex fast path)  (§4)
          ─► detectors (pure)   GAME · IMPASSE/SPIN · CONFUSION clock · FRUSTRATION · DRIFT  → Suspicion[]   (§5)
          ─► features → MI.stepMoment()   (one state machine: MI §2.1)
Suspicion[] + MI posterior ─► arbiter()  → VerifyMove | (confirmed) CostlyMove | nothing        (§6)
child's reply to a VerifyMove ─► VERIFY_LR ─► MI.stepMoment() and arbiter.resolve()
```
Nothing to the right of `TurnEvent` is written to the database (DA8). `TurnEvent` fields already exist in the transcript and KT ledger (`latency_ms`, `asr_conf`, `gaming`).

---

## 3. Raw events and normalisation

### 3.1 Turn event
```ts
// src/learner/affect/types.ts — pure; no I/O
export type Modality = 'voice' | 'tap';
export type ItemClass = 'recall' | 'compute' | 'explain' | 'mcq' | 'manip' | 'none'; // none = social/meta turn
export interface TurnEvent {
  turnId: string; sessionId: string; idx: number;               // idx = child-turn ordinal in session
  modality: Modality; band: 'A'|'B'|'C';
  promptEndMs: number;            // teacher audio LAST PLAYED frame on device (lesson-arc), or prompt render for tap
  childStartMs?: number;          // speech_started (voice) or first tap; undefined = silence
  childEndMs?: number; words: number; asrConf?: number;
  bargeIn: boolean;               // child began during teacher audio
  netJitterMs?: number;           // client-measured; > JITTER_MAX freezes timing features
  multiSpeaker?: boolean;         // diarisation or parent/sibling flag; freezes everything but safety
  itemKey?: string; itemClass: ItemClass; stepId?: string;
  outcome?: 'C0'|'C1'|'C2'|'C3'|'C4'|'wrong'|'partial';  // KT categorical outcome when graded (KT §1.2)
  attemptOnStep: number;          // 1 = first attempt on this step
  hintRungBefore: number;         // ladder rung shown before this attempt (P15)
  dwellAfterHintMs?: number;      // time between hint end and next action
  answerText?: string;            // normalised answer string (for reuse detection), never stored beyond session
  pSuccessPrior?: number;         // KT predicted P(correct) before the attempt
  requested: 'yesno'|'choice'|'short'|'explain'|'open'|'none';  // what the teacher's last move asked for
}
```
**Gates (in order).**
1. `multiSpeaker` → no features at all (safety lexicon still runs).
2. `asrConf < ASR_MIN` → only `silence` and module events count (LS §7.2 rule 3).
3. `netJitterMs > 400` or `bargeIn` on a non-recall item → no timing features.
4. Band A tap-to-talk (lesson-arc D-ARC-4) has its own timing distribution, because the tap adds motor time.

### 3.2 Normaliser (log domain, shrunk, two references)
For a positive feature x (onset ms, words + 1, dwell ms), let y = ln x. The key is k = (band, itemClass, modality).
- **Band prior** (μ_b,k, σ_b,k): σ = 1.4826·MAD, so one outlier does not move it. Fitted from pilot logs and refit quarterly. Launch values come from MI/VT's age-band defaults [U].
- **Child mean.** VT's `LogEwma` (μ_c, n_c) is kept per k. In `explicit_only` mode it is session-scoped, so it starts at the band prior.
- **Shrunk child mean:** μ̂ = (n_c·μ_c + κ·μ_b)/(n_c + κ), with κ = 5 [U]. Five child observations pull halfway.
- **Single-turn z (between-session reference):** z_child = clip((y − μ̂)/σ_b, −4, 4).
- **Session baseline (DTS-style, Chen 2021 [V]):** β_s,k = mean y over the first **3** *engaged* items of class k in this session, meaning ASR-confident, on-task act, pSuccessPrior ≥ 0.6. Until 3 exist, β = μ̂.
- **Drift z (within-session reference):** z_drift = (mean of y over the last 4 turns of class k − β_s,k)/σ_b. Used only by the drift detector.
- **Accuracy residual:** r_t = o_t − pSuccessPrior_t, with o ∈ {1, 0.5, 0} from C0 / C1-C2 / rest. The drift indicator is mean(r over the last 4 graded) − mean(r over the baseline items) < −0.35 [U]. This separates *disengagement* (worse than the model expects on easy items) from *difficulty* (expected failures), which is why the DTS idea transfers.
- **Length ratio**, only when requested ∈ {explain, open}: ρ = (words + 1)/exp(μ̂_len,explain). `shortExplain` = ρ < 0.4 **and** addressesQ ≠ 'no'. An off-target turn is an act problem, not a length problem.

### 3.3 Rapid-response thresholds (NT10 adapted)
- For compute/explain/manip items: `rapid` if onset < max(FLOOR_k, 0.10 × the population mean onset for that `itemKey` among engaged children). FLOOR is 400 ms (voice) or 600 ms (tap). Wise's NT10 caps the threshold at 10 s [S]. Taxila caps it at 3 s.
- **Not rapid:** recall items (fast *is* fluency, KT G grade), and barge-in answers to recall items (eagerness, VT V17).
- `tooFast` (Baker GH6-7 analogue): onset < 150 ms after promptEnd, or a duplicate tap within 300 ms. Treat as noise and drop.
- Until an item has 30 engaged responses, the item-class mean stands in [U].

---

## 4. The dialogue-act labeller (LLM) contract

**Label set (closed).** One act per child turn, plus one cohesion field:
`ATTEMPT` · `HEDGED_ATTEMPT` (attempt + shayad / I think / rising "na?") · `DONT_KNOW` (pata nahi, nahi aata, silence-equivalent) · `ANSWER_REQUEST` (answer batao, just tell me) · `HINT_REQUEST` · `CLARIFY_Q` (matlab?, kaunsa wala?, phir se bolo) · `CURIOSITY_Q` (on-topic why/what-if, no question pending) · `ECHO` (repeats the teacher's words without adding) · `SELF_CORRECT` · `AFFECT_TASK` (task is boring/hard/easy) · `AFFECT_SELF` (mujhse nahi hoga, I'm bad at this) · `OFF_TASK` · `SOCIAL` · `META` (ruk jao, wait, slow) · `EXIT_INTENT` · `OTHER`.
`addressesQ ∈ {yes, partial, no, na}`: does the turn engage the content of the teacher's last ask? This is the cohesion feature that D'Mello & Graesser 2012 found predictive [V].

**Contract.**
- **Input:** the teacher's last turn text, plus the child's current turn and previous turn (transcripts only). No name, no history, no prior labels, no KT state, so no profile forms inside the model (VT `moveOutcomeCoder` rule).
- **Output:** strict JSON via Azure structured outputs, `{act, addressesQ, polarity?, target?: 'task'|'self'}`.
- **Self-consistency:** two independent calls (temperature 0.7, or two prompt paraphrases). If they agree, the label stands. If they disagree, the label is `UNCERTAIN` and fires no feature. Verbalised confidence is never read (Xiong 2023 [V]).
- **Fast path (deterministic, synchronous):** regex lexicons for `EXIT_INTENT`, the safety terms and `ANSWER_REQUEST` (VT V12), with the negation, hypothetical and quoted-speech guard of `learnerCommunication.ts`. Safety never waits for the LLM.
- **Latency:** the LLM path runs in parallel with the realtime response and may arrive one turn late. Detectors tolerate this because none acts on a single turn.
- **Not a grader.** Acts never update mastery ("a model never grades"). They are features for MI's filter, folded with their confusion matrix (KT §1.3).
- **Versioning:** `labellerVersion` = hash(prompt, model deployment, label set). Every change re-runs DA-M1 before rollout.

**Reliability gate (per label × band × language mix, from DA-M1).**

| κ vs teacher consensus | use |
|---|---|
| < 0.60, or < 30 positive examples | dropped: the feature never fires |
| 0.60-0.80 | fires, with each moment's LR folded through the labeller's sensitivity σ and specificity φ for that label (KT D7 applied to a binary feature). With p₀ = the feature's true rate in the reference state and p_m = min(1, LR_m·p₀): **LR′_m = [p_m·σ + (1−p_m)(1−φ)] / [p₀·σ + (1−p₀)(1−φ)]** |
| ≥ 0.80 | fires unfolded, still under MI's ±2.08 per-turn log-LR clamp |

Expected weak labels, to watch: `HEDGED_ATTEMPT` (Hinglish discourse markers are not uncertainty, LS P19), `ECHO` vs choral repetition, which Indian classrooms train (discourse §1.4), `AFFECT_TASK` sarcasm (Majumder 2026 [V]).

---

## 5. Detectors

Shared conventions: windows count *child turns*. "Fired" means a feature entered MI's `TurnFeatures` on that turn. Each detector returns `Suspicion {kind, strength: 1|2, evidence: string[], turn}`, where evidence lists feature ids for the Why log, and those ids are recomputable. A detector never names the child's state to the child (MI11).

### 5.1 GAME: gaming the system (P22, refined)
| id | pattern (voice and module) | weight | source |
|---|---|---|---|
| G1 | wrong, then a **re-attempt on the same step** with z_child(onset) < −1 and a different answer (option cycling: ≥ 2 MCQ options tried within 6 s) | 1.0 | Baker 2008 GH5 [V]; Paquette 2019 "similar answers in sequence" [V] |
| G2 | `HINT_REQUEST`/`ANSWER_REQUEST` with **no attempt** on the step, on a skill with ≥ 2 completed items and pSuccessPrior ≥ 0.6; or ≥ 3 hint requests within 20 s | 1.0 | GH4 [V]; Roll 2014 (help overuse) [V] |
| G3 | the **same answer string** given to ≥ 2 consecutive different items or steps | 1.5 | Paquette 2019 constituent [V] |
| G4 | reached bottom-out (C4) with dwellAfterHint < 2 s, twice within 8 items | 1.0 | Kai 2018 bottom-out profile [V]; Paquette "short pause after help" [V] |
| G5 | ≥ 2 `ANSWER_REQUEST` within 5 turns after ≥ 1 failed attempt | 0.75 | VT V12 [U] |
| G6 | `rapid` on compute/explain items, twice within 6 items | 0.75 | NT10 / RTE [V] |

**Exclusions:**
- `tooFast` actions (GH6-7).
- Manipulative or drag steps where slips are common (GH3).
- The first item of a new skill.
- Items whose ladder was already exhausted. A bottom-out after 2 genuine attempts is the system working, not gaming.

**Score and threshold.** S_game = Σ weights fired in the last 8 graded items, each pattern counted at most twice. S ≥ 2.0 gives a suspicion of strength 1. S ≥ 3.5 gives strength 2 [U]. Either way the next move is a verification (DA2).
**Confounds:** a fast expert (P22), a child who has stopped trying because the item is beyond reach (helplessness, Baker 2004), a younger sibling at the phone, ASR splitting turns.
**Verifying move VM-EXPLAIN:** the next item is open-response, or the child explains the last one (move shape EXPLAIN-HOW on the previous item; no scripted line). An on-target elaboration (`addressesQ = yes`, ρ ≥ 0.6) disconfirms. A minimal, off-target or `ANSWER_REQUEST` reply confirms.
**While suspected:** KT applies the gaming temper (LR^0.25, KT §1.4) to the window. Being suspected is enough, because the temper only *discounts* evidence and creates none.

### 5.2 IMPASSE and SPIN: being stuck at two time scales (P21, refined)
- **Step level.** `impasse` counts consecutive child turns on the same `stepId` whose act ∈ {wrong `ATTEMPT`, `DONT_KNOW`, `CLARIFY_Q`, `ANSWER_REQUEST`, silence}. It resets on any progress: a correct sub-step, rising expectation coverage, or a correct `SELF_CORRECT`.
  - impasse = 2 → suspicion IMPASSE.
  - **Rule:** if the teacher's last 2 moves on this impasse were questions or pumps, the next move is ADDRESS-ERROR: name the specific wrong step, show it on screen, and give the correct sub-step reasoning (Ahtisham 2026 [V]).
  - impasse = 4 → worked step (bottom-out), then an isomorphic item.
  - Band A uses 2 and 3.
- **Skill level** (KT counters). This is not an inference, so no verification is needed:
  - `oppSinceStart ≥ 6` with no run of 3 C0 → early warning. The arbiter may spend a verify slot on VM-PREREQ. This is the single-feature early detector (Zhang 2019 [V]).
  - `≥ 10` → wheel-spin confirmed (KT §2.6). Change approach.
- **Kai profiles as cause tags:** (a) ≥ 2 bottom-outs in 8 items plus skipped hints elsewhere → "skips help, then bottoms out": offer the hint earlier, as a worked example. (b) short inter-item gaps on the same skill → "massed": interleave and space (Kai 2018 [V]).
- **Verifying move VM-PREREQ:** one easy item on the lowest-pL prerequisite (KT graph). A failure confirms "prerequisite gap" and routes there (Wan & Beck 2015 [V]). A pass points to the current representation, so switch format (LS §8.4).

### 5.3 CONFUSION: a clock, not a detector
- **Start the clock** on a new-concept step when 2 of these fire within 3 turns: `CLARIFY_Q`, `HEDGED_ATTEMPT`, `partial` with z_child(onset) > +1 on a think item, a `SELF_CORRECT` that is still wrong, or `addressesQ = partial`.
- **Productive by default.** No intervention while the clock runs, except MI's cheap moves: wait, name the difficulty, hint ladder (D'Mello 2014 via LS §1.11).
- **Expiry** after 2 ladder steps without progress, or 90 s (band A: 60 s) → suspicion UNRESOLVED [U].
- **Verifying move VM-PARTCHOICE:** move shape CHOICE over *where the difficulty is*: 2 options pointing at on-screen parts of the problem (the step, or the representation). Tap-able in band A. The pick both localises the confusion and scaffolds. If the child picks a part, the confusion is confirmed and located → targeted explanation of that part. If the child answers correctly instead, the clock clears.

### 5.4 FRUSTRATION: goal blockage (Mindspark-style, interpretable)
Indicators within the last 4 child turns. Each is a goal-blockage operationalisation in the spirit of Rajendran 2013 [V]; the specific features are [U]:

| id | indicator |
|---|---|
| F1 | ≥ 2 consecutive wrong on a skill after an earlier run of ≥ 2 correct this session (expectation broken) |
| F2 | `deepFail` (MI: wrong after ≥ 2 ladder steps) |
| F3 | `AFFECT_SELF` with negative polarity, or `AFFECT_TASK` "hard" |
| F4 | `ANSWER_REQUEST` after ≥ 1 failure (shared with G5) |
| F5 | barge-in during the teacher's *correction* turn |
| F6 | G1 fast retry after an error (shared with gaming) |

**Threshold:** ≥ 2 indicators including at least one of F1-F3 → suspicion FRUS. F4-F6 alone are ambiguous between frustration and gaming, and the verify resolves that.
**Verifying move VM-SHRINK+CHOICE:** offer a smaller step and a different way (MI `M.SHRINK` + `M.CHOICE2`). Uptake of the smaller step with success confirms frustration and is also the right repair. "Harder" disconfirms (PICK_LR in MI).
**Confirmed response:** attribution by cause, adapted from Rajendran 2019 [V]: name the *step* as the hard thing, specific process praise on a part that was right, show what changed. Then MI's frustrated row (targetP .85-.95). Two deepFails on one skill → `M.PREREQ`.

### 5.5 DRIFT: disengagement and boredom (P20 generalised)
Indicators over the last 6 child turns:

| id | indicator |
|---|---|
| D1 | accuracy-residual drop < −0.35 vs baseline, on items with pSuccessPrior ≥ 0.7 (§3.2) |
| D2 | `shortExplain` on ≥ 2 of the last 3 explain or open requests |
| D3 | \|z_drift(onset)\| > 1 (slower = attention elsewhere; faster = rushing) |
| D4 | ≥ 2 `OFF_TASK`/`SOCIAL` turns not started by the teacher (VT `socialTurns` is allowed) |
| D5 | ≥ 2 `ECHO` or bare `DONT_KNOW` on items with pSuccessPrior ≥ 0.7 |
| D6 | silence after a *simple* question (pSuccessPrior ≥ 0.8), twice |
| D7 | `AFFECT_TASK` "boring" |

**Threshold:** ≥ 2 indicators, at least one of them not timing-based (D1, D2, D4, D5 or D7) → suspicion DRIFT.
**Strength 2** if D7 fires, or if position or time priors apply (DA9: ≥ 10 graded items, ≥ 12 min, or local time after 20:30) [U].
**Verifying move VM-CHOICE2:** MI's diagnostic choice (harder / a different way / a break / teacher's pick, in a randomised order). It splits boredUnder, boredOver and fatigue, which a drift score cannot (MI D3). Silence after the choice → VM-PRESENCE: a light re-entry with a tap-able CHOICE that never names the silence (discourse §4.1). A second silence → MI `fatigued`/`stopped` handling. The child may have walked away.

### 5.6 Summary
| detector | fires on | strength-1 threshold | verifying move | confirms if | costly move unlocked |
|---|---|---|---|---|---|
| GAME | G1-G6 in last 8 items | S ≥ 2.0 | VM-EXPLAIN | minimal or off-target explain | open-response mode, try-first hints, CHOICE2 (boredom vs helplessness) |
| IMPASSE | 2 stuck turns on a step | impasse = 2 | none (rule: ADDRESS-ERROR after 2 questions) | n/a | worked step at 4 |
| SPIN | KT opps ≥ 6, no run of 3 | early warning | VM-PREREQ | prerequisite item fails | prerequisite detour; format switch |
| CONF | clock expiry | 2 steps or 90 s | VM-PARTCHOICE | child picks a part | targeted re-explanation of that part |
| FRUS | ≥ 2 of F1-F6, ≥ 1 of F1-F3 | as stated | VM-SHRINK+CHOICE | takes the smaller step or a different way | targetP .85-.95; prerequisite after 2 deepFails |
| DRIFT | ≥ 2 of D1-D7, ≥ 1 non-timing | as stated | VM-CHOICE2 | pick (PICK_LR) | difficulty move by pick; break; close-win |

---

## 6. The arbiter: base rates, costs and verification

### 6.1 Why verification is mandatory (arithmetic)
PPV = sens·π / (sens·π + (1−spec)·(1−π)). Illustrative sens/spec [U] at the published base rates [V, Baker 2010]:

| state | π | detector sens / spec | PPV acting directly | after a verifying move (LR+ 4) | plus a 2nd independent indicator (LR+ 3) |
|---|---|---|---|---|---|
| boredom | .05 | .70 / .85 | **.20** | .50 | .75 |
| frustration | .05 | .70 / .85 | .20 | .50 | .75 |
| confusion (unresolved) | .13 | .70 / .80 | .34 | .68 | .86 |
| gaming (8-item window) | .08 | .70 / .90 | .38 | .71 | .88 |

Acting on a boredom flag directly would be wrong 4 times in 5. A verifying move whose outcome has LR+ ≈ 4 (sens .8, spec .8 on the child's reply) brings the decision to even odds. A second, *independent* indicator (different features, for example a pick plus a KT outcome) brings it to ≈ .75. **Hence the rule: a costly move needs P(state) ≥ τ_move after a verification or an explicit child pick.** That replaces MI's "2 consecutive confident turns" as the main route; MI's route stays as a fallback.

### 6.2 Which moves may verify (no-regret rule)
A move m is eligible as a verifying move iff its expected utility is non-negative under *every* live hypothesis: min over s ∈ H of U(m, s) ≥ −ε. All VM-* moves are ordinary good teaching (choice, explain-it, smaller step, prerequisite check). They also yield evidence, which is the LS §7 "covert probe" logic applied to affect.

A costly move m needs P(s) ≥ τ_m = C_FA/(C_FA + C_miss) [U]:

| costly move | τ_m | reasoning |
|---|---|---|
| change representation | .35 | cheap; a miss leaves the child stuck |
| lower difficulty | .50 | a false alarm patronises and slows learning (MI boredUnder) |
| prerequisite detour | .60 | costs minutes |
| offer a break or close-win | .70 | cuts learning, though always the child's choice |

### 6.3 Arbiter (pseudo-code)
```ts
// src/learner/affect/arbiter.ts — pure; called by Director step 3 after MI.stepMoment()
export type SuspicionKind = 'GAME'|'IMPASSE'|'SPIN'|'CONF'|'FRUS'|'DRIFT';
export type VerifyMove = 'VM-EXPLAIN'|'VM-PREREQ'|'VM-PARTCHOICE'|'VM-SHRINK+CHOICE'|'VM-CHOICE2'|'VM-PRESENCE';
export interface Suspicion { kind: SuspicionKind; strength: 1|2; evidence: string[]; turn: number }
export interface Pending { kind: SuspicionKind; move: VerifyMove; askedTurn: number }
export type VerifyOutcome = 'onTarget'|'minimal'|'prereqFail'|'prereqPass'|'pickedPart'|'correct'|'dontKnow'
                          |'tookSmaller'|'harder'|'teacherPick'|'reply'|'silence'|'unusable';
declare const VERIFY_LR: Record<VerifyMove, Partial<Record<VerifyOutcome, number>>>;   // §6.4; missing → 1
export interface ArbiterState {
  lastVerifyTurn: number; verifyTimes: number[];              // ms timestamps, for the 10-min budget
  cooldown: Partial<Record<SuspicionKind, number>>;           // turn until which the kind is muted
  pending?: Pending; confirmed: Partial<Record<SuspicionKind, number>>;  // turn confirmed; expires after 8 turns
}
const VM_FOR: Record<SuspicionKind, VerifyMove | null> = {
  GAME: 'VM-EXPLAIN', IMPASSE: null, SPIN: 'VM-PREREQ', CONF: 'VM-PARTCHOICE',
  FRUS: 'VM-SHRINK+CHOICE', DRIFT: 'VM-CHOICE2' };
const PRIORITY: SuspicionKind[] = ['FRUS', 'CONF', 'IMPASSE', 'DRIFT', 'GAME', 'SPIN'];  // relieve distress first

export function arbitrate(a: ArbiterState, sus: Suspicion[], turn: number, nowMs: number,
                          exitIntent: boolean): { a: ArbiterState; verify?: VerifyMove } {
  if (exitIntent || a.pending) return { a };                  // VT 'stopped' wins; one open question at a time
  const live = sus.filter(s => (a.cooldown[s.kind] ?? -1) < turn && !a.confirmed[s.kind]);
  if (!live.length || turn < 3) return { a };                  // DA10: no verify in the first 3 turns
  const recent = a.verifyTimes.filter(t => nowMs - t < 600_000);
  if (turn - a.lastVerifyTurn < 4 || recent.length >= 3) return { a };     // budget
  const s = PRIORITY.map(k => live.find(x => x.kind === k)).find(Boolean)!;
  const move = VM_FOR[s.kind];
  if (!move) return { a };                                     // IMPASSE is handled by the ADDRESS-ERROR rule
  return { verify: move, a: { ...a, lastVerifyTurn: turn, verifyTimes: [...recent, nowMs],
                              pending: { kind: s.kind, move, askedTurn: turn } } };
}

// Called with the child's reply to the verifying move (or after 2 turns with no usable reply).
export function resolve(a: ArbiterState, reply: VerifyOutcome, turn: number): ArbiterState {
  if (!a.pending) return a;
  const { kind } = a.pending;
  const lr = VERIFY_LR[a.pending.move][reply] ?? 1;            // table in §6.4; 'unusable' → 1
  const next = { ...a, pending: undefined, cooldown: { ...a.cooldown, [kind]: turn + 6 } };
  if (lr >= 2.5) next.confirmed = { ...a.confirmed, [kind]: turn };        // unlocks costly moves (§6.2)
  return next;                                                 // lr also enters MI.stepMoment via PICK_LR-style ratios
}
```

### 6.4 Verification outcome likelihood ratios [U: launch priors; fitted in DA-M4]
| move | reply class | LR for the suspected state |
|---|---|---|
| VM-EXPLAIN | on-target elaboration | 0.25 (disconfirm) |
| | minimal / off-target / `ANSWER_REQUEST` | 3.0 |
| VM-PREREQ | prerequisite fails (C3-C4) | 4.0 (gap) |
| | passes C0 | 0.3 |
| VM-PARTCHOICE | picks a part | 4.0 (located) |
| | answers correctly | 0.2 |
| | `DONT_KNOW` | 2.0 |
| VM-SHRINK+CHOICE | takes smaller / different way | 3.0 |
| | "harder" | 0.3 |
| | teacher's pick | 1.0 |
| VM-CHOICE2 | MI `PICK_LR` | (as MI) |
| VM-PRESENCE | reply | 0.5 (present) |
| | second silence | 4.0 (absent / fatigued) |

A no-usable-reply (ASR fail, multi-speaker) has LR 1. The suspicion lapses with cooldown, and nothing is concluded.

### 6.5 New features for MI's `TurnFeatures` (proposal)
MI's emission table is extended, not duplicated. These rows replace `fastWrong` and qualify `elaborated` [U]. Columns are warm, flow, cur, strug, frus, bUnder, bOver, bMean, anx, gam, fat; blank = 1.

| feature | warm | flow | cur | strug | frus | bUnder | bOver | bMean | anx | gam | fat |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fastWrongFirst (first attempt, rapid, wrong) | | 1.2 | | | | 1.5 | | | | 1.3 | 1.2 |
| fastRetryAfterError (G1) | | .4 | | | 1.8 | 1.3 | | | | 3 | |
| gamingPattern (S_game ≥ 2) | | .3 | | | 1.3 | 1.5 | | 1.3 | | 4 | |
| impasse2 | | .4 | | 2 | 1.8 | | 1.5 | | 1.3 | | |
| clarifyQ | | .8 | 1.5 | 2 | 1.2 | .5 | 1.3 | | | | |
| hedged | | .9 | | 1.5 | | .6 | 1.2 | | 1.5 | | |
| shortExplain | | .5 | | | 1.3 | 1.8 | 1.5 | 1.8 | 1.3 | 1.5 | 1.8 |
| driftResidual (D1) | | .4 | | | | 1.8 | 1.3 | 1.5 | | 1.5 | 2 |
| echo | 1.3 | .6 | | | | 1.5 | 1.5 | 1.3 | 1.3 | 1.3 | |
| elaborated ∧ addressesQ=yes (replaces `elaborated`) | | 2 | 1.5 | 1.3 | .6 | .7 | | | | .5 | .4 |
| verify reply | from §6.4, applied to the suspected moments | | | | | | | | | | |

MI's per-turn clamp (|Σ log LR| ≤ 2.08) still applies. Correlated features fired by the *same* event (G1 also fires F6) count once: the extractor dedups by source event id.

---

## 7. Teacher responses (shapes, not lines)
The Director passes a move *shape* to the realtime model in the appended-last slot (VT §4.7 format). No sentence is written for her to say (harvest law: sentence-shaped prompt text gets recited).

| confirmed | first move shape | if not resolved | never |
|---|---|---|---|
| unresolved confusion | EXPLAIN-PART: the located part only, with a new representation on screen (LS §8.4 format bandit), then a TRY-THIS on that part | worked step → isomorphic item; P2 "why" on success | re-explaining the whole thing louder; asking *samjhe?* as the check (DL4) |
| impasse (after 2 questions) | ADDRESS-ERROR: point at the wrong step, state what the step needs, child redoes only that step | WORKED-STEP + similar item; impasse 4 → bottom-out without shame | a third Socratic question on the same impasse (Ahtisham 2026) |
| wheel-spin | PREREQ probe → teach the prerequisite in a different format; return with an easier isomorph | park the skill for spaced return (Kai: massed practice); tell the parent report "being rebuilt", not "weak" | the 11th similar item (KT §2.6) |
| frustration | NAME-DIFF (the step is hard, not the child) + SHRINK + process praise on a correct part (Rajendran 2019 attribution) | CHOICE2 incl. break; two deepFails → PREREQ | humour, dares, slang (VT suppressions); "it's easy"; comparison |
| gaming | MAKE-THINKING-PAY: open-response or explain items; hints after one genuine try; short hint delay (Vanacore 2024) | CHOICE2 to split boredom from helplessness (Baker 2004/2010); M.OFFER of a different activity | moral labels ("cheating", "lazy"); removing help entirely; revealing the detector |
| drift / boredom | CHOICE2 → by pick: LIFT/TEST-OUT, SWITCH format or context to an interest tag, or BREAK | CLOSE-WIN; the child-chosen open thread for next time (MI D4) | streaks, points, guilt (MI D4); naming the boredom (MI11) |
| "just tell me" without gaming | TRY-FIRST: one cued attempt with a hint ladder rung (Roll 2014: attempts before help can be productive) | after 2 genuine attempts, tell, then an isomorphic item for the child | refusing indefinitely; complying instantly on every request |

**Hard invariants (eval-gated, added to the battery; "if your change trips them, your change is wrong"):**

| id | predicate |
|---|---|
| DA-I1 | no costly move (difficulty, prerequisite, break offer, session end) without `confirmed[kind]` or an explicit child pick, except EXIT_INTENT and safety |
| DA-I2 | no teacher turn names the child's inferred state (lexicon over teacher output: *bore ho, frustrated, confused ho, tension*, plus English) (MI11) |
| DA-I3 | no third consecutive question/pump on one impasse; the third move must be ADDRESS-ERROR or WORKED-STEP |
| DA-I4 | verify budget respected (≤ 1 per 4 turns, ≤ 3 per 10 min, none in turns 1-3) |
| DA-I5 | gaming never appears in teacher output or the parent report as a word about the child; the parent report shows *what changed* (e.g. "switched to explain-it questions") |
| DA-I6 | a `multiSpeaker` or low-ASR window fires no detector except safety |

---

## 8. Detector code skeleton
```ts
// src/learner/affect/detect.ts — pure; O(window) per turn; recomputable from the turn log (DA8)
import type { TurnEvent } from './types';
export interface Acts { act: ChildAct | 'UNCERTAIN'; addressesQ: 'yes'|'partial'|'no'|'na'; polarity?: -1|0|1; target?: 'task'|'self' }
export interface Norm { zChild?: number; zDrift?: number; rho?: number; rapid: boolean; tooFast: boolean;
  resid?: number }                                                 // resid = (o − pSuccessPrior) − session-baseline mean resid (§3.2)
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
export interface Win { ev: TurnEvent; acts: Acts; n: Norm }         // last 12 child turns, newest last
export interface AffectSession { win: Win[]; base: Record<string, number[]>; clock?: { startTurn: number; startMs: number; ladderAtStart: number };
  impasse: { stepId?: string; turns: number; teacherQuestionsInRow: number } }

export function gameScore(w: Win[]): { s: number; fired: string[] } {
  const last8 = w.filter(x => x.ev.outcome).slice(-8); const cnt: Record<string, number> = {}; let s = 0;
  const add = (id: string, wt: number) => { if ((cnt[id] = (cnt[id] ?? 0) + 1) <= 2) s += wt; };
  for (let i = 0; i < last8.length; i++) {
    const x = last8[i], prev = last8[i - 1];
    if (x.n.tooFast || x.ev.itemClass === 'manip') continue;                      // GH3, GH6-7
    if (prev && prev.ev.stepId === x.ev.stepId && prev.ev.outcome === 'wrong' &&
        (x.n.zChild ?? 0) < -1 && x.ev.answerText !== prev.ev.answerText) add('G1', 1.0);
    if ((x.acts.act === 'HINT_REQUEST' || x.acts.act === 'ANSWER_REQUEST') && x.ev.attemptOnStep === 1 &&
        (x.ev.pSuccessPrior ?? 0) >= 0.6) add('G2', 1.0);
    if (prev && x.ev.answerText && x.ev.answerText === prev.ev.answerText && x.ev.itemKey !== prev.ev.itemKey) add('G3', 1.5);
    if (x.ev.outcome === 'C4' && (x.ev.dwellAfterHintMs ?? 1e9) < 2000) add('G4', 0.5);   // two of these = 1.0
    if (x.n.rapid && (x.ev.itemClass === 'compute' || x.ev.itemClass === 'explain')) add('G6', 0.375);
  }
  const reqs = w.slice(-5).filter(x => x.acts.act === 'ANSWER_REQUEST').length;
  if (reqs >= 2 && w.slice(-5).some(x => x.ev.outcome === 'wrong')) add('G5', 0.75);
  return { s, fired: Object.keys(cnt) };
}

export function driftIndicators(w: Win[], minutes: number, items: number, localHour: number) {
  const six = w.slice(-6); const ind: string[] = [];
  const easy = six.filter(x => (x.ev.pSuccessPrior ?? 0) >= 0.7 && x.n.resid !== undefined);
  if (easy.length >= 3 && mean(easy.slice(-4).map(x => x.n.resid!)) < -0.35) ind.push('D1'); // resid already baseline-adjusted
  const ex = w.filter(x => x.ev.requested === 'explain' || x.ev.requested === 'open').slice(-3);
  if (ex.filter(x => (x.n.rho ?? 1) < 0.4 && x.acts.addressesQ !== 'no').length >= 2) ind.push('D2');
  if (six.some(x => Math.abs(x.n.zDrift ?? 0) > 1)) ind.push('D3');
  if (six.filter(x => x.acts.act === 'OFF_TASK' || x.acts.act === 'SOCIAL').length >= 2) ind.push('D4');
  if (six.filter(x => (x.acts.act === 'ECHO' || x.acts.act === 'DONT_KNOW') && (x.ev.pSuccessPrior ?? 0) >= 0.7).length >= 2) ind.push('D5');
  if (six.filter(x => x.ev.childStartMs === undefined && (x.ev.pSuccessPrior ?? 0) >= 0.8).length >= 2) ind.push('D6');
  if (six.some(x => x.acts.act === 'AFFECT_TASK' && x.acts.polarity === -1 && /bor/i.test(x.ev.answerText ?? ''))) ind.push('D7');
  const nonTiming = ind.some(i => ['D1','D2','D4','D5','D7'].includes(i));
  const strength: 1|2 = (ind.includes('D7') || items >= 10 || minutes >= 12 || localHour >= 20.5) ? 2 : 1;
  return ind.length >= 2 && nonTiming ? { ind, strength } : null;
}
// frustration(), confusionClock(), impasseStep() follow §5.2-5.4 with the same shape; wheel-spin reads KT SkillState.
```
(`D7` in practice keys off the labeller's `target='task'` with the boredom sub-lexicon from MI §2.4, not a regex on the answer field. It is shown inline here for brevity.)

---

## 9. Measurements that decide the numbers
| id | question | method (n, date to run) | decides | pass rule |
|---|---|---|---|---|
| DA-M1 | labeller reliability per label × band × language mix | 300 child turns per band (900 total) from the pilot, stratified to oversample rare acts; 2 Indian teachers + consensus; gpt-5.6 two-sample labels; κ and confusion matrix; repeat per `labellerVersion` | §4 gate | per-label κ ≥ 0.60 to fire; ≥ 0.80 unfolded |
| DA-M2 | ground-truth coding protocol | transcript + event-replay coding of 100 sessions (60-s windows) by 2 trained teachers; the manual states that confusion is *engaged* unless unresolved past the clock (Chen 2026 [V]) | which states are separable | κ ≥ 0.6 per state; else merge (e.g. boredOver into frustrated) |
| DA-M3 | value of normalisation | AUC of raw vs normalised onset/length features against DA-M2 labels, by band | DA3 | normalised ≥ raw + 0.02 AUC, else simplify |
| DA-M4 | detector PPV and verify-move LRs | replay all pilot sessions through the detectors; compare suspicions and verify replies with DA-M2 labels; fit §6.4 LRs and §6.5 rows (MI MM2 shares the data) | thresholds, LRs, DA1 | PPV after verify ≥ 0.6 for each kind; drop a detector whose verified PPV < 0.4 |
| DA-M5 | position / time-of-day hazard | survival model of first DRIFT confirmation vs items, minutes and local hour (Wise 2024 analogue) | DA9 prior | keep the prior only if HR ≥ 1.3 |
| DA-M6 | impasse policy | A/B after 2 failed questions: ADDRESS-ERROR vs a 3rd question; outcome next-turn recovery and same-skill delayed C0 at 1 week | DA5, DA-I3 | replicate the direction of Ahtisham 2026 (≥ +5 pp recovery) |
| DA-M7 | verify budget | A/B: 1 per 4 turns vs 1 per 8; outcomes voluntary continuation, session completion, confirmed-state latency | DA10 | choose the smaller budget unless detection latency doubles |
| DA-M8 | simulated-student gate | DAS2-style simulators (engaged, gaming, wheel-spinning, off-task, frustrated; Hinglish, 3 bands) driving the full Director in `evals/`; score correct verify choice and DA-I1..I6 | regression gate | 0 invariant violations; verify choice matches the simulated state ≥ 80% |
| DA-M9 | gaming response | among children with confirmed GAME: try-first + open response vs control (immediate hints); outcome delayed retention (P10) | §7 gaming row | adopt if delayed retention ≥ control |

All of DA-M1..M7 reuse pilot transcripts that are already parent-visible (LS §4.5). Nothing new is stored beyond what the turn log holds (DA8). During the consented calibration pilot only, the labeller cache (`turnId → acts`) is kept for 30 days, so that M1/M4 do not pay for relabelling.

---

## 10. Open questions
1. **Labeller latency on Azure.** Two gpt-5.6 calls per child turn: is p90 under 600 ms from India? If not, does a one-turn lag measurably delay verification? A fine-tuned small classifier (Majumder 2026's finding) must still be an Azure first-party model under the owner's directive. *Measure before choosing.*
2. **Band A acts.** Six- to eight-year-olds on tap-to-talk produce one-word turns. `addressesQ`, `ECHO` and `HEDGED` may be unlabelable, and band A may need module events only (taps, retries, dwell).
3. **Choral echo.** Indian classrooms train choral repetition (discourse §1.4). Is `ECHO` disengagement or compliance in band A/B? DA-M2 must code it separately.
4. **Who is at the phone.** `multiSpeaker` diarisation on a shared family phone is not designed anywhere yet. Until it is, a sibling's turn will look like drift or gaming.
5. **Productive confusion clock length** (90 s / 2 steps) has no Indian-children evidence. D'Mello's work is with undergraduates.
6. **The 12.7% impasse result** is from an undergraduate chemistry LLM tutor. DA-M6 decides whether it holds for children.

## 11. Proposed context entries (for `context/inbox/`)
- **decision** `affect-verify-before-act` (DA2), `affect-rules-before-ml` (DA1), `affect-normalise-session-baseline` (DA3), `gaming-is-pattern-not-speed` (DA4, splits MI `fastWrong`), `impasse-address-error-after-two` (DA5), `affect-absence-weightless` (DA6), `dialogue-act-labeller-gated` (DA7), `affect-recompute-not-store` (DA8), `verify-budget` (DA10). Each carries its reversal condition from §0.
- **rejected (by evidence, before building):** "act on a single affect classifier output" (PPV ≈ .20 at boredom base rates, §6.1); "train an ML affect detector on day one" (Paquette 2019 transfer collapse; Jensen 2019 n < 1,500 instability); "use LLM verbalised confidence as label confidence" (Xiong 2023); "treat longer answers as more engaged" (Zhang 2026 gaming utterances); "repeat the Socratic question when stuck" (Ahtisham 2026).
- **measurement placeholders:** DA-M1..M9 with n and method as above.

---

## Sources
**Affect incidence, dynamics, ground truth**
- Baker, R. S., D'Mello, S. K., Rodrigo, M. M. T., & Graesser, A. C. (2010). Better to be frustrated than bored. *IJHCS* 68:223-241. Full text: https://learninganalytics.upenn.edu/ryanbaker/BDRG-IJHCS-Final.pdf [V]
- D'Mello, S. K., Lehman, B., & Person, N. (2010). Monitoring affect states during effortful problem solving activities. *IJAIED*. ERIC EJ943860 [V]
- Zambrano, A. F., Nasiar, N., Ocumpaugh, J., Goslen, A., et al. (2024). Says who? How different ground truth measures of emotion impact student affective modeling. EDM. ERIC ED675677 [V]
- Conati, C., & Gutica, M. (2016). Interaction with an edu-game: emotions and judges' perceptions. *IJAIED*. ERIC EJ1114531 [V]
- Rebolledo-Mendez, G., et al. (2022). Meta-affective behaviour within an ITS for mathematics. *IJAIED*. ERIC EJ1328317 [V]
- Ogan, A., Walker, E., Baker, R., Rodrigo, M. M. T., et al. (2015). Towards understanding how to assess help-seeking behavior across cultures. *IJAIED*. ERIC EJ1057791 [V]
- Rodrigo, M. M. T., Baker, R. S., & Rossi, L. (2013). Student off-task behavior in computer-based learning in the Philippines. *TCR*. ERIC EJ1020008 [V design; result U]
- Waterman, A. H., & Blades, M. (2011). Helping children correctly say "I don't know" to unanswerable questions. *J Exp Psych: Applied*. ERIC EJ956132 [V]

**Dialogue-based detection and response**
- D'Mello, S., Craig, S., Witherspoon, A., McDaniel, B., & Graesser, A. (2008). Automatic detection of learner's affect from conversational cues. *UMUAI* 18:45-80. https://doi.org/10.1007/s11257-007-9037-6 [S: TLDR only]
- Graesser, A. C., D'Mello, S. K., Craig, S. D., Witherspoon, A., et al. (2008). The relationship between affective states and dialog patterns during interactions with AutoTutor. *JILR*. ERIC EJ789087 [V]
- D'Mello, S. K., & Graesser, A. (2012). Language and discourse are powerful signals of student emotions during tutoring. *IEEE TLT*. ERIC EJ993174 [V]
- Forbes-Riley, K., & Litman, D. (2013). When does disengagement correlate with performance in spoken dialog computer tutoring? *IJAIED*. ERIC EJ1189987 [V]
- Forbes-Riley, K., & Litman, D. (2011). Benefits and challenges of real-time uncertainty detection and adaptation in a spoken dialogue computer tutor. *Speech Communication*. https://doi.org/10.1016/j.specom.2011.02.006 [S]
- Rajendran, R., Iyer, S., Murthy, S., Wilson, C., & Sheard, J. (2013). A theory-driven approach to predict frustration in an ITS. *IEEE TLT*. https://doi.org/10.1109/tlt.2013.31 [V]
- Rajendran, R., Iyer, S., & Murthy, S. (2019). Personalized affective feedback to address students' frustration in ITS. *IEEE TLT*. ERIC EJ1212498 [V]
- Grawemeyer, B., Mavrikis, M., Holmes, W., Gutiérrez-Santos, S., et al. (2016). Affecting off-task behaviour (iTalk2Learn). LAK '16. https://doi.org/10.1145/2883851.2883936 [V]; UMUAI 2017 follow-up https://doi.org/10.1007/s11257-017-9188-z [S]
- Karumbaiah, S., Lizarralde, R., Allessio, D., Woolf, B., et al. (2017). Addressing student behavior and affect with empathy and growth mindset. EDM. ERIC ED596572 [V]
- Nye, B. D., Graesser, A. C., & Hu, X. (2014). AutoTutor and family: a review of 17 years. *IJAIED*. ERIC EJ1042132 [V]
- Ahtisham, B., Vanacore, K., Napoli, A., Arens, J., et al. (2026). Examining variation in how guided AI tutors resolve student impasses. arXiv:2609.38346 [V]
- Zhang, C., Alghowinem, S., & Breazeal, C. (2025). Ensembling LLMs to characterize affective dynamics in student-AI tutor dialogues. arXiv:2510.13862 [V]
- Borchers, C., Gurung, A., Liu, Q., Thomas, D. R., et al. (2026). Brief but impactful: human tutoring interactions and engagement. arXiv:2601.09994 [V]

**Log-based detectors: affect, gaming, wheel-spin, rapid guessing, help**
- Baker, R. S., Gowda, S. M., Wixon, M., Kalka, J., et al. (2012). Towards sensor-free affect detection in Cognitive Tutor Algebra. EDM. ERIC ED537205 [V]
- Hutt, S., Grafsgaard, J. F., & D'Mello, S. K. (2019). Time to scale: generalizable affect detection for tens of thousands of students. CHI. ERIC ED593885 [V]
- Jensen, E., Hutt, S., & D'Mello, S. K. (2019). Generalizability of sensor-free affect detection models. EDM. ERIC ED599213 [V]
- de Morais, F., & Jaques, P. A. (2024). Improving sensor-free affect detection by considering personality traits. *IEEE TLT*. ERIC EJ1405383 [V]
- Botelho, A. F., Baker, R. S., Ocumpaugh, J., & Heffernan, N. T. (2018). Studying affect dynamics and chronometry using sensor-free detectors. EDM. ERIC ED593106 [V]
- Yang, T.-Y., Baker, R. S., Studer, C., Heffernan, N., et al. (2019). Active learning for student affect detection. EDM. ERIC ED599173 [V]
- Mills, C., & D'Mello, S. (2015). Sensor-free detection of mind wandering during online reading. EDM. ERIC ED560533 [V]
- Chen, S., Lippert, A., Shi, G., Fang, Y., et al. (2018). Disengagement detection within an ITS. ITS 2018. ERIC ED588054 [V]; Chen, S., Fang, Y., Shi, G., Sabatini, J., et al. (2021). Automated disengagement tracking within an ITS. ERIC ED610656 [V]
- Baker, R. S., Corbett, A. T., Koedinger, K. R., & Wagner, A. Z. (2004). Off-task behavior in the cognitive tutor classroom: when students "game the system". CHI. https://doi.org/10.1145/985692.985741 [V]
- Baker, R. S., Corbett, A. T., Roll, I., & Koedinger, K. R. (2008). Developing a generalizable detector of when students game the system. *UMUAI* 18:287-314. Full text: https://learninganalytics.upenn.edu/ryanbaker/USER475.pdf [V]
- Baker, R. S., Corbett, A. T., Koedinger, K. R., Evenson, S., et al. (2006). Adapting to when students game an ITS. ITS 2006. https://doi.org/10.1007/11774303_39 [S]
- Paquette, L., & Baker, R. S. (2019). Comparing machine learning to knowledge engineering for student behavior modeling: gaming the system. *Interactive Learning Environments*. Full text: https://learninganalytics.upenn.edu/ryanbaker/Paquette-Baker-Interactive-Learning-Environment-2.pdf [V]
- Huang, Y., Dang, S., Richey, J. E., Asher, M., et al. (2022). Item response theory-based gaming detection. EDM. ERIC ED624075 [V]; LV-GD, *UMUAI* 2023. https://doi.org/10.1007/s11257-023-09362-1 [V]
- Levin, N., Baker, R. S., Nasiar, N., Fancsali, S., et al. (2022). Evaluating gaming detector model robustness over time. EDM. ERIC ED624076 [V]
- Pinto, J. D., & Paquette, L. (2025). A constraints-based approach to fully interpretable neural networks for detecting learner behaviors. arXiv:2504.20055 [V]
- Zhang, J., Borchers, C., Wang, C., Kumar, V., et al. (2026). Understanding gaming the system by analyzing SRL in think-aloud protocols. arXiv:2601.04487 [V]
- Baker, R. S., Richey, J. E., Zhang, J., Karumbaiah, S., et al. (2025). Gaming the system mediates the relationship between gender and learning outcomes. *Instructional Science*. ERIC EJ1487791 [V]
- Vanacore, K., Gurung, A., Sales, A. C., & Heffernan, N. T. (2024). The effect of assistance on gamers (LAK) ERIC ED662901; Effect of gamification on gamers (*JEDM*) ERIC EJ1430518 [V]
- San Pedro, M. O. Z., Baker, R. S., & Rodrigo, M. M. T. (2014). Carelessness and affect in an ITS for mathematics. *IJAIED*. ERIC EJ1036906 [V]
- Kai, S., Almeda, M. V., Baker, R. S., Heffernan, C., et al. (2018). Decision tree modeling of wheel-spinning and productive persistence in skill builders. *JEDM*. ERIC EJ1183799; full text via learninganalytics.upenn.edu [V]; Beck & Gong 2013 figures via Kai [S]
- Wan, H., & Beck, J. E. (2015). Considering the influence of prerequisite performance on wheel spinning. EDM. ERIC ED560558 [V]
- Zhang, C., Huang, Y., Wang, J., Lu, D., et al. (2019). Early detection of wheel spinning. EDM. ERIC ED599222 [V]
- Botelho, A. F., Varatharaj, A., Patikorn, T., Doherty, D., et al. (2019). Developing early detectors of student attrition and wheel spinning using deep learning. *IEEE TLT*. ERIC EJ1219239 [V]
- Park, S. (2023). Discovering unproductive learning patterns of wheel-spinning students. *TechTrends*. ERIC EJ1377740 [V]; Flores & Rodrigo (2020) wheel-spinning in novice programming, ERIC EJ1262069 [V]
- Wise, S. L., & Kong, X. (2005). Response time effort. *Applied Measurement in Education* 18(2). https://doi.org/10.1207/s15324818ame1802_2 [V]
- Wise, S. L., Pastor, D. A., & Kong, X. J. (2009). Correlates of rapid-guessing behavior in low-stakes testing. ERIC EJ834164 [V]; Setzer, Wise et al. (2013) ERIC EJ994826 [V]; Guo et al. (2016) ERIC EJ1101442 [V]; Michaelides et al. (2020) ERIC EJ1262769 [V]
- Wise, S. L., Kuhfeld, M. R., & Lindner, M. A. (2024). Don't test after lunch. *Applied Measurement in Education*. ERIC EJ1413503 [V]
- Roll, I., Baker, R. S., Aleven, V., & Koedinger, K. R. (2014). On the benefits of seeking (and avoiding) help. *JLS*. ERIC EJ1044739 [V]; Aleven, V., et al. (2016). Help helps, but only so much. *IJAIED*. ERIC EJ1091255 [V]

**LLM labelling reliability**
- He, L., & Xu, J. (2025). Automated classification of tutors' dialogue acts using generative AI (CIMA). arXiv:2509.09125 [V]
- Chen, E., Wang, I., Yuan, N., et al. (2026). LLM coding agents as collaborative partners for behavioral labeling in educational dialogue analysis. arXiv:2603.27440 [V]
- Liu, X., Zambrano, A. F., Baker, R. S., Barany, A., et al. (2025). Qualitative coding with GPT-4: where it works better. *JLA*. ERIC EJ1465623 [V]
- Pangakis, N., Wolken, S., & Fasching, N. (2023). Automated annotation with generative AI requires validation. arXiv:2306.00176 [V]
- Gilardi, F., Alizadeh, M., & Kubli, M. (2023). ChatGPT outperforms crowd-workers for text-annotation tasks. arXiv:2303.15056 [V]
- Xiong, M., Hu, Z., Lu, X., Li, Y., et al. (2023). Can LLMs express their uncertainty? arXiv:2306.13063 [V]
- Majumder, B., & Sen, A. (2026). LLMs vs fine-tuned models for sarcasm in code-mixed Hinglish. arXiv:2602.21933 [V]
- Zhang, J., Borchers, C., Aleven, V., & Baker, R. S. (2024). Using LLMs to detect SRL in think-aloud protocols. EDM. ERIC ED675562 [V]; Borchers, C., et al. (2025). LLMs generalize SRL prediction to new languages within but not between domains. *JEDM*. ERIC EJ1483240 [V]
- Meng, X., & Lin, J. (2026). Simulating disengaged students to evaluate LLM-based tutors (DAS2). arXiv:2609.12331 [V]

---

## Review

**Reviewer stance:** skeptical learning scientist plus engineer, 2026-10-02. This review checked the file against its own text, its cited numbers and the stated stack (Azure Container Apps, gpt-realtime-2.1, Neon). No new literature search was run. Legal points are tagged [S] (from memory of the DPDP Act 2023 and Rules 2025, **not re-fetched**) and need counsel. The file's strongest idea, verify-before-act with a no-regret move, survives. Its numbers, its legal posture (DA8), several rules promoted to hard invariants, and the arbiter code do not survive as written. Corrections are numbered R1-R34 and each says what to change.

### A. Child safety and DPDP 9(3): blocking

**R1. DA8 ("never stored, recomputed on replay") is neither legally protective nor technically true.**
- [S] DPDP s.9(3) bars "tracking or behavioural monitoring" of children. The act is the *processing*, and in-memory inference of boredom, frustration or "gaming" per turn is processing whether or not a row is written. s.9(3) is not lifted by parental consent. Only a Rules exemption lifts it. The Fourth Schedule exemption I recall is for *educational institutions* and only to the extent needed for educational activity or safety. Whether a private edtech app qualifies is **unresolved**.
- Technically, the LLM labeller is not a pure function. It uses temperature 0.7 and two samples. Replay therefore cannot reproduce acts unless the labels are cached. §9 then keeps a `turnId → acts` cache (including `AFFECT_SELF`) for 30 days. So affect labels ARE stored, which contradicts DA8 and the §2 line "nothing to the right of TurnEvent is written".
- Fix:
  - Reword DA8 to: "affect inference is ephemeral in production; a consented, time-boxed calibration store exists and is deleted at day 30".
  - Remove the claim that non-storage resolves 9(3).
  - Add an **`affect_layer` kill switch** per cohort and a parent-visible toggle. Reuse VT's `explicit_only` mode as the fallback: the child's explicit acts and KT outcomes only, with no timing, `ECHO` or `shortExplain` inference.
  - Add a one-page counsel question to the file: "is adaptive pedagogy from turn-level engagement inference 'behavioural monitoring' for a non-institution?"

**R2. The affect state has to live somewhere between turns.** `AffectSession` (window, baselines, clock, arbiter) is per-session mutable state. On Azure Container Apps with scale-out and restarts, in-memory state is lost or split across replicas. Persisting it in Neon contradicts DA8. Decide explicitly: either sticky-session in-memory with a defined "cold-restart means explicit-only for 3 turns" behaviour, or an encrypted session-TTL store (for example 1 hour) described as such. The doc currently assumes both.

**R3. No distress or safeguarding path from the affect layer.**
- `AFFECT_SELF` ("mujhse nahi hoga", "main bekaar hoon"), repeated negative self-talk, fear of punishment after a wrong answer ("mummy maarengi", "papa daantenge") and crying or shouting all appear only as frustration indicators.
- CLAUDE.md makes the child-safety floor (1098, 14416, safeguarding hand-off) product, not compliance. Safety is covered only by a regex "safety terms" fast path with no listed contents.
- Add:
  - A **DISTRESS** suspicion: `AFFECT_SELF` negative ≥ 2 in 6 turns, or any fear-of-adult or harm-to-self lexicon hit.
  - It routes to the safeguarding module and **bypasses the arbiter**: no budget, no verification, no cooldown.
  - Eval invariant **DA-I7**: any distress hit produces a supportive, non-instructional move that same turn, and no menu or choice move.

**R4. The verify budget throttles relief for a distressed child.** `turn < 3`, "1 per 4 turns", "never two in a row" and `cooldown 6` all apply to FRUS, so a child who is upset in turn 2 gets nothing. Cheap, non-costly soothing moves (NAME-DIFF, SHRINK) must be unbudgeted. Only *questions* (menus, explain-it) count against the budget. The code in `arbitrate()` makes no such distinction.

**R5. Child requests are not all honoured same-turn.** DA-I1 exempts only `EXIT_INTENT` and an "explicit child pick". `META` ("ruk jao", "wait", "slow") and a break request are not named, and §6.2 puts a break at τ = .70 "needs confirmed". Add: any child-initiated break, stop, slow or repeat request is honoured in the same turn with no confirmation. A request is never a suspicion.

**R6. DA-I2 is overbroad and untestable.** A lexicon ban on teacher output (*bore ho, frustrated*) also blocks acknowledging a feeling the child **stated** ("boring hai" gets a ban on any boredom word). It also fails on Devanagari, Roman and code-mixed variants. Replace with the predicate: the teacher may not assert an *inferred, unstated* state about the child. Reflecting the child's own words is allowed and in fact required. Test with paired fixtures (stated vs inferred), using an LLM judge validated on ≥ 100 Hinglish fixtures, not a lexicon.

**R7. Engagement-maximisation risk (DPDP 9(2) "detrimental effect on well-being") [S].**
- VM-PRESENCE (a light re-entry that "never names the silence"), the close-win "open thread for next time", and DA-M7's outcome "voluntary continuation / session completion" optimise *retention*, not learning.
- For a tired or distressed child, this is a dark-pattern shape and conflicts with the sister product's NEVER MANIPULATE invariant.
- Changes:
  - Change DA-M7's primary outcome to delayed retention and child-reported ease (end-of-session sticker choice), with continuation as a guardrail only.
  - A second silence in VM-PRESENCE ends the session gracefully. It does not re-engage again.

**R8. The gaming response can be harmful to the helpless child.**
- §7 "MAKE-THINKING-PAY" includes a *short hint delay* (Vanacore 2024, a study of children aged ~11-14 in a maths app).
- The file's own Baker 2004 evidence says helplessness explains gaming. DA-M9 tests this only after the fact.
- Rule: no hint delay or try-first on any child with `AFFECT_SELF`, F1-F3 or `deepFail` in the last 6 turns, and never in band A until DA-M9 reports. Use open-response items first (no withholding).

**R9. Roll 2014 (n = 38) cannot carry TRY-FIRST for a 6-year-old.** It is correlational, from a secondary-school/college tutor, and shows avoiding help on *low-prior* steps went with better learning. Downgrade the "just tell me" row to [U] and gate it to bands B-C. In band A, give a rung-1 hint on the first request.

### B. Evidence overreach

**R10. The detector accuracy assumed in §6.1 contradicts DA2's own evidence.**
- DA2 cites Hutt 2019 (ρ 0.08-0.34, n = 69k) and Mills 2015 (κ 0.21). §6.1 then assumes sens/spec = .70/.85 for boredom and frustration, which implies AUC ≈ .85.
- Paquette 2019 transfer κ of 0.23-0.26 is "better than ML" only in relative terms and is near-chance in absolute terms.
- Recompute §6.1 with sens/spec of .60/.70 (AUC ≈ .65-.70). At π = .05, boredom PPV is ≈ .10, and after a verify with LR+ 4 it is ≈ .31, below every τ in §6.2.
- State plainly: **verification alone does not unlock a costly move for boredom or frustration.** It needs a child pick AND a second indicator, or no costly move at all.

**R11. The LR+ 4 for "child's reply to a verifying move" is assumed, not argued.**
- Child replies are confounded by deference. Indian children often pick the "teacher's pick" or the first option because the teacher offered it, and `teacherPick` is already given LR 1.0.
- Randomised order only fixes position bias, not authority deference or demand characteristics (the doc invokes Waterman & Blades for exactly this in DA6).
- Treat every VM LR as ≤ 2 until DA-M4. Log reply class by option position for the position-bias check.

**R12. VM-EXPLAIN confounds gaming with explanation ability and language.**
- "Minimal / off-target" gets LR 3.0 for gaming. But rote-trained children (discourse doc §1.5) rarely practise explaining. ASR on a 6-year-old's Hinglish explanation frequently fails. A shy child answers minimally.
- Condition on band, item language and ASR confidence: a minimal reply when `asrConf` is low or `unusable` is LR 1 (the doc does this only for outright ASR failure). Never use VM-EXPLAIN in band A.
- Allow a non-verbal explain path (tap the step that is wrong, or choose the explanation card) so non-verbal children can disconfirm.

**R13. The "no-regret" rule (§6.2) is undefined.** `U(m, s)` and ε are never specified, so "min over hypotheses of U ≥ −ε" cannot be checked or tested. Either define U as expected next-turn recovery and engagement with a table of values per (move, state), fitted from DA-M4, or delete the formalism and keep the list of allowed moves with a written justification per move. Note that a prerequisite item (VM-PREREQ) is *not* no-regret for a frustrated child.

**R14. DA5 and DA-I3 promote undergraduate observational evidence to a hard invariant.**
- The Ahtisham figures (AOR 0.873; 28.1% vs 39.8% recovery) are from undergraduate chemistry and are correlational. The tutor chose when to address the error, so item difficulty and selection confound it.
- OQ6 admits this, yet DA-I3 is gated as "your change is wrong".
- Demote DA-I3 to a configurable default (`maxQuestionsOnImpasse = 2`) with a "directional" tag until DA-M6 reports on children. Generation-effect literature also says telling too early costs retention on conceptual items. Keep Socratic depth 3 for conceptual items where the child is progressing (rising coverage).

**R15. The productive-confusion clock has no child evidence.** D'Mello's confusion benefit comes from adult *induced* confusion (contradictory information), not naturally arising confusion. "No intervention while the clock runs", 60 s in band A, can leave a 6-year-old stuck and silent. Set a maximum of 30 s for band A, and make the cheap moves (wait, name the difficulty, hint ladder) active from the start rather than "except MI's cheap moves". Mark DA-M6-like measurement for the clock.

**R16. Citations tagged [V] at abstract level carry design thresholds.** Only four papers were read in full text. Everything else is [V] from abstracts or APIs. Re-tag the rest as [V-abs] and do not use any effect size seen only in an abstract (the 12.7%, 18.5% vs 71.8%, 38%, 8-27% figures) as a threshold. Also note where a cited study is an assessment (Wise 2024 RTE across the school day, grades 2-8) and not tutoring.

**R17. DA3's Chen 2021 validation is partly circular.** If the AutoTutor disengagement tracker flags items using an accuracy residual, "flagged items had 18.5% accuracy" is built into the detector. Taxila's D1 copies the same construct, so DA-M2 ground truth **must not** use accuracy as a coding cue (see R22).

### C. Code and spec defects (implementation)

**R18. Spec and code disagree on gaming weights.**

| item | §5.1 table | §8 code |
|---|---|---|
| G4 | 1.0 per fire | 0.5 |
| G6 | 0.75 | 0.375 |
| G2 | needs ≥ 2 completed items on the skill, or ≥ 3 hint requests within 20 s | neither condition implemented; uses `attemptOnStep === 1` and `pSuccessPrior ≥ 0.6` only |
| G1 | includes MCQ option cycling (≥ 2 options within 6 s) | not implemented |

Make the table the single source of truth and generate the code constants from it, or fix one side. A unit test must assert table and code parity.

**R19. The gaming threshold is too low.** "Each pattern counted at most twice" and S ≥ 2.0 means G1 twice (2.0) or G3 twice (3.0) alone raises a suspicion. G3 (same answer string on different items) has the highest weight, 1.5, but the weakest evidence. For a 4-option MCQ the chance of the same letter twice is 25%, and "haan", "2", "0" and "10" repeat often. Make G3 item-key aware, with expected-repeat probability taken from the option count and answer-space size, and cap each pattern at once. Calibrate S on simulated sessions plus the pilot, targeting ≤ 1 false suspicion per 3 sessions.

**R20. Arbiter bugs (`arbitrate` / `resolve`).**
1. `pending` is never cleared on timeout. `arbitrate` returns early while `a.pending` is set, and `resolve` is only called on a usable reply. The text says "or after 2 turns with no usable reply", but nothing implements it. One ignored question disables verification for the rest of the session.
2. `confirmed[kind]` is "expires after 8 turns" in a comment only. The `live` filter `!a.confirmed[s.kind]` mutes that kind **forever**.
3. `find` over `PRIORITY` can pick `IMPASSE` (move is null) and return, starving every lower-priority suspicion for as long as the impasse lasts. Filter out null-move kinds before the priority pick.
4. `Suspicion.strength` is computed (and DRIFT strength 2 uses time-of-day) but the arbiter never reads it. Either use it (strength 2 may shorten the cooldown) or drop it. Time-of-day must not escalate on its own.
5. `lastVerifyTurn` has no initial value; `resolve` records no disconfirmation (LR < 0.5 should clear the suspicion and lengthen the cooldown).

Patch sketch:
```ts
const expired = (t?: number, turn = 0) => t !== undefined && turn - t > 8;
const live = sus.filter(s => VM_FOR[s.kind] && (a.cooldown[s.kind] ?? -1) < turn
                          && !(a.confirmed[s.kind] !== undefined && !expired(a.confirmed[s.kind], turn)));
if (a.pending && turn - a.pending.askedTurn >= 2) a = resolve(a, 'unusable', turn);   // timeout
```

**R21. Two decision systems disagree.** The arbiter's `confirmed` flag (LR ≥ 2.5, prior ignored) and MI's posterior both consume the same verify evidence. DA-I1 forbids a costly move without `confirmed`, but §6.1 keeps "MI's route as fallback" ("2 consecutive confident turns"), which can act without it. Pick one authority. Recommended: `confirmed` = posterior odds (detector-PPV prior odds × product of independent LRs) ≥ τ_move odds, computed in MI's own units, and delete the fallback. At the §6.1 numbers (even odds after one verify), a single verify can never reach τ .60 or .70, and the code must reflect that (R10).

**R22. DA-M2 ground truth leaks the detector's inputs.** Coders see "transcript + event replay" (latency, outcomes, hint use), the same signals the detectors use, so agreement is inflated. Baker's BROMP used field observation independent of logs. Use at least one independent channel: live or video observer for a subsample, or end-of-session child self-report (emoji or sticker), or delayed retention. Report detector-vs-coder κ separately for each channel.

**R23. Voice timing is far noisier than the ITS logs it borrows thresholds from.**
- Baker's GH5 thresholds are keyboard-click seconds. In voice, `speech_started` comes from server VAD, which is affected by TV or family noise, speakerphone echo (the teacher's own audio can trigger it), Bluetooth latency, and `semantic_vad` hysteresis.
- The `rapid` floor of 400 ms is inside that error (VAD onset error is commonly 100-300 ms), so it will almost always equal the floor.
- Reduce the weight of **all voice-timing features** (G1 `zChild < -1`, G6, D3) by half until DA-M3 shows they beat noise. Gaming evidence in voice should come from act and outcome patterns, not onset. Specify the client-to-server field for "last played frame" with clock-sync error, because it is currently assumed.

**R24. `asrConf` may not exist.** Gate 2 (`asrConf < ASR_MIN`) depends on a per-turn ASR confidence that the realtime transcription path may not expose (logprobs depend on the transcription model chosen). Tag [U]. Fall back: transcript length vs audio duration (words per second), repeated-token ratio and a script-mix check as a proxy for a bad transcript.

**R25. The labeller cannot run "in parallel" with the realtime response.** With server VAD auto-response the model begins answering at end of turn, before the labeller returns. The Director's appended-last move shape then reaches turn t+2, after the child's state changed. Design it: set `create_response: false`, wait for a **fast path** (regex plus a single cheap labeller call with a hard 250-300 ms timeout), then `response.create` with the move shape; on timeout, respond with the previous move shape (no new inference) and apply the late label for the next turn. Two gpt-5.6 calls per child turn also doubles the data sent to the processor and the cost: add a cost and p90 budget per child-hour and a DPA/no-training/India-region note.

**R26. D7 in the skeleton is a regex on `answerText`** (`/bor/i`), which misses Devanagari, "बोर" and "bore ho gaya", and fires on "border" and "before". The note says it is "for brevity", but §8 is the code that will be copied. Replace with the labeller's `AFFECT_TASK` plus `polarity` and a sub-label field `taskValence ∈ boring|hard|easy|fine`, which the label set (§4) does not currently contain.

### D. Testability and measurement

**R27. DA-M1 is underpowered by an order of magnitude.** The label set has 16 acts across 3 bands and several language mixes. The gate asks for ≥ 30 positives per label × band × mix: 16 × 3 × ≥ 3 = 144 cells × 30 = **≥ 4,300 positive turns**, versus 900 turns total. Rare acts (`EXIT_INTENT`, `SELF_CORRECT`, `AFFECT_SELF`) will be dropped by the rule, so the detectors that need them never fire. A point κ with 30 positives has a CI of roughly ±0.2. Changes:
- Gate on the **lower 95% bound** of κ (or per-label F1 with a bootstrap CI), not the point estimate.
- κ is prevalence-sensitive: also report per-label precision, recall and a confusion matrix.
- Merge to ≤ 8 acts for launch and give a minimum-n for each cell.
- The two raters' "consensus" is not an independent gold standard. Use a third adjudicator on disagreements.

**R28. DA-M4 and DA-M2 cannot identify the parameter count.** 100 sessions × ~10 windows at 4-6% base rates gives about 50 positive boredom/frustration windows. The proposal fits 6 detector thresholds, ~25 LRs in §6.4 and a 11 × 11 emission matrix (§6.5). That is unidentifiable. Fit only 2-3 shared parameters (a global gain per detector), fix the rest at literature or neutral values, and run a power calculation. "PPV after verify ≥ 0.6" with 50 positives has a CI of ±0.14 and cannot be asserted.

**R29. DA-M8 (simulated students) is circular for validity.** Simulators are written by the same team and LLM with the same assumptions about what gaming or boredom looks like in Hinglish, so "verify choice matches simulated state ≥ 80%" tests self-consistency. Use it **only** as a regression and invariant gate (DA-I1..I7), and say so. DAS2's κ 0.75 is rule labels vs human consensus on *simulated* students, not evidence for real children.

**R30. A/B tests (M6, M7, M9) lack n, margins, ethics and interaction control.**
- "Adopt if delayed retention ≥ control" (M9) is not a non-inferiority test (no margin, no n).
- Several A/Bs run on the same children interact.
- The arms deliberately delay help (M9, M6's third question) for minors. They need an ethics review and parental notice, and a stop rule.
- Specify: n per arm from a pilot SD, a pre-registered primary outcome (delayed retention), one concurrent experiment per child, and a margin (for example −0.1 SD) for "no worse".

### E. What is missing

**R31. Fairness and subgroup audit (new DA-M10).** ASR error, accent and dialect (Bhojpuri, Tamil-accented Hindi, regional English), device quality, gender (Baker 2025 found boys game more on some steps, and the doc cites it but does not audit for it) and board all shift `ECHO`, `DONT_KNOW`, off-target and timing features. Require equal-opportunity gaps (false-suspicion rate by subgroup) ≤ a bound before enabling any costly move for that subgroup, and fall back to explicit-only mode where ASR quality is poor.

**R32. Confounds the doc names but does not design for.**
- *Who is at the phone* is flagged (OQ4) but is the dominant Indian confound: a parent coaching or shouting "jaldi bolo", siblings, tuition-style prompting. Until diarisation exists, treat any turn with a second voice or sustained background speech as `multiSpeaker` and freeze detectors. Add a cheap heuristic (overlapping speech or a sudden speaker-embedding change) as a first pass.
- Neurodivergence, stammering, selective mutism, hearing loss, and a child tired after school all look like drift or `DONT_KNOW`. The detectors must never produce a parent-visible label or a persistent trait, and the parent report must stay at "what changed in the lesson".
- Choral echo (OQ3) must be decided before `ECHO` weights ship in band A/B. Default `ECHO` weight to 1.0 (neutral) in A/B until coded.

**R33. Missing detectors and outcomes.**
- No anxiety or shame detector (MI has an `anx` state with no detector), no positive-affect or flow detector, and no detection of parent-induced pressure. At least `anx` needs a minimal rule: hedging plus long pre-answer latency plus `AFFECT_SELF`.
- No measurement that the **affect layer improves learning**. M6 and M9 test two responses only. Add a holdout arm (affect layer off, explicit-only) on delayed retention (P10), which is the one number that justifies the layer's existence and its legal risk.
- No definition of ownership between the arbiter and MI's move table, which both choose moves.

**R34. Gaming may not exist in a voice-with-a-person-like-teacher the way it does in a GUI.** The detectors were validated on keyboard ITSs (Cognitive Tutor, ASSISTments). A social teacher voice changes the base rate. In the pilot, measure the gaming base rate first (DA-M2), and if it is below about 3% of items, ship GAME as **log-only** (no responses) instead of tuning for it.

### F. Verdicts per decision

| id | verdict | change |
|---|---|---|
| DA1 | keep | but state absolute performance is weak (κ .23-.26), so rules are a floor, not a success |
| DA2 | keep, strengthen | verification alone does not unlock costly moves for boredom/frustration (R10, R21) |
| DA3 | keep with test | DA-M3 must use accuracy-independent ground truth (R17, R22) |
| DA4 | keep | G3 item-aware, caps (R19) |
| DA5 | **demote** | configurable default, not an invariant, until DA-M6 on children (R14) |
| DA6 | keep | absence is weightless; add stated-vs-inferred rule (R6) |
| DA7 | keep with fixes | power, CI-bound gate, ≤ 8 acts at launch (R27); latency design (R25) |
| DA8 | **rewrite** | not a legal shield; labels not replayable; state has to live somewhere (R1, R2) |
| DA9 | keep as [U] prior | time-of-day must not escalate on its own (R20) |
| DA10 | keep, exempt distress | soothing moves unbudgeted (R4); evidence is not Borchers 2026 |
| DA-I1 | amend | honour child requests and distress at once (R3, R5) |
| DA-I2 | **replace** | stated vs inferred predicate (R6) |
| DA-I3 | demote | configurable until M6 (R14) |
| new | add | DA-I7 distress path; DA-M10 fairness; holdout arm (R3, R31, R33) |

**Corrections to apply before this file feeds `context/inbox/`:** do not file `affect-recompute-not-store` (DA8) as a decision until R1/R2 are resolved. File it as *rejected-by-review*: "affect inference not being stored does not avoid DPDP 9(3), and replay needs stored labels". Do file the arbiter bug list (R20) as a fix to §6.3 and the "no-regret needs a defined utility" note (R13).
