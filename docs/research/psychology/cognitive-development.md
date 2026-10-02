# Cognitive development 6-15: what Taxila can validly estimate, how, and what it may say

**Date:** 2026-10-02 · **Scope:** classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish tutor with lesson games, logged over months.
**Builds on, does not repeat:** `docs/research/learning-science.md` §1.10 (speech-signal noise), §2 (learning styles rejected), §7 (probes P1-P24), §8 (LearningProfile) and §9 (backlog E1-E8); `learner/kt-algorithms.md` (the `EvidenceEvent` ledger, θ on a grade-equivalent scale, BKT-R); `learner/vibe-temperament.md` (no trait typing, the L1-L5 legitimacy test).
**Question:** Which parts of cognitive development that matter for learning (executive functions, processing speed, attention, reasoning, language and bilingualism, numeracy, reading) can be *estimated* from Taxila's telemetry? How reliably? With which measurement models? What may be said to parents? And where must the product stop and refer to a professional?

**Evidence tags.**
- **[V]**: checked this session against the primary abstract or full text, mostly via Europe PMC.
- **[S]**: checked only against a secondary summary, such as a search snippet or a citing paper.
- **[U]**: unverified this session (prior knowledge), or a Taxila design default that must be measured.

Numbers tagged [U] must not enter `context/` or any parent-facing text until measured.

**Method.** About 30 web searches. About 60 primary abstracts were pulled from the Europe PMC REST API, plus three full texts:
- the NIH-Toolbox 3-year reliability study (Taylor et al. 2022)
- the ACE-C methods paper (Younger et al. 2023)
- the Skill Lab validation preprint (Pedersen et al. 2023, Table 3 read directly)

PubMed and Nature pages blocked fetching. Their abstracts were reached through Europe PMC instead.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| CD1 | **A separate CognitiveLayer.** It never writes to the mastery ledger. It is used for three things only: (a) instructional knobs (instruction chunk length, steps per turn, wait time, break timing), (b) research, (c) *descriptive* parent notes. | Cognitive estimates from telemetry are noisy and practice-contaminated (§2). Mastery must come only from evidence of knowledge (kt-algorithms D6/D7). | Adding a validated cognitive covariate to BKT-R improves AUC on delayed items by ≥ 0.02 in two monthly refits. It may then enter as a *prior covariate*, never as evidence. |
| CD2 | **No individual-level claims from difference scores**: Stroop/flanker interference, switch costs, numerical ratio effects. | Robust group effects have low between-person variance ("reliability paradox", Hedge 2018 [V]). Behavioural self-regulation DVs have poor test-retest reliability (Enkavi 2019 [V]). The ratio effect is unreliable (Inglis & Gilmore 2014 [V]). | A Taxila test-retest study (§9 S1) shows ρ ≥ 0.70 for that metric, estimated hierarchically, in that age band. |
| CD3 | **Ages 6-9 get one EF composite at most** ("focus and self-control in games"). Components (working memory, inhibition, flexibility) are reported only from ~10. | EF is more unitary in childhood (Karr 2018 [S]; Karr 2022 [V]). ACE-C found an unstable 2-community structure in grades 3-4 and a stable 3-community structure only from grade 5 (Younger 2023 [V]). | Taxila invariance analysis (S2) shows a stable 3-factor or 3-community structure at 6-9. |
| CD4 | **Within-child, same-device comparisons only. No cognitive percentiles or "vs other children" claims to parents, ever, in v1.** | Device latency, SES and familiarity with games confound between-child comparisons (§2.4). Cognitive percentiles function as IQ claims. | An external ethics review plus Taxila norms (n ≥ 500 per age × language band, device-invariant), plus a parent study showing benefit without labelling harm. |
| CD5 | **The flagship "cognitive development" constructs are domain-cognitive**: symbolic number sense, number-line estimation, fraction magnitude, akshara knowledge, decoding fluency, vocabulary across both languages, relational reasoning on items. | They are measurable as *items* (IRT), are valid predictors (number line r = .44, Schneider 2018 [V]; fractions predict high-school maths, Siegler 2012 [V]; phonemic awareness, Melby-Lervåg 2012 [V]), and parents can act on them. | — (this is a scoping decision; revisit after S1) |
| CD6 | **No "brain training", "EF training" or "IQ boost" module or claim.** | Children's EF training gives near transfer g = 0.44, but no transfer to untrained EF components (Kassai 2019 [V]). WM training shows no far transfer against treated controls (Melby-Lervåg 2016 [V]). | A preregistered Taxila RCT showing far transfer to delayed curricular outcomes. |
| CD7 | **No bilingual-advantage claims. Vocabulary is scored across both languages (conceptual vocabulary).** | No EF advantage after bias correction (Lehtonen 2018 [V]) or in ABCD, n = 4,524 (Dick 2019 [V]). Single-language vocabulary under-counts bilinguals (Bialystok 2010 [V]). | — |
| CD8 | **"Consider an evaluation" flags exist only for reading and maths**, are base-rate aware (§7.3), and pass a qualified human reviewer before reaching a parent. **There is no ADHD flag.** | Even CPTs, the best-studied objective ADHD tool, reach only AUC 0.7-0.8, sensitivity .75, specificity .71 (Arrondo 2024 [V]). RT variability is not specific to ADHD (Kofler 2013 [V]). The relative-age effect inflates diagnosis of the youngest in a class (Morrow 2012 [V]). | Never automated. Policy is reviewed with a child psychologist yearly. |
| CD9 | **Every cognitive metric carries a reliability card** (ρ, SEM, n, method, date, age band, device class) before anyone sees it, including the tutor's own prompt. | "A number without n and method cannot be compared" (CLAUDE.md). Attenuation makes unreliable metrics mislead silently (§2.2). | — |
| CD10 | **"Growth" is reported only when it is beyond the reliable-change threshold *and* practice-adjusted.** | Repeated games improve through familiarity. Schooling itself raises cognitive scores by 1-5 IQ points per year (Ritchie & Tucker-Drob 2018 [V]), so Taxila cannot claim credit for development. | — |

---

## 1. Executive summary

1. **Taxila's observations are dense, but most cognitive constructs are trait-like quantities measured through very noisy, state-dependent behaviour.** Even the NIH Toolbox, a purpose-built battery, had **1- to 3-year test-retest ICCs of 0.32-0.77 in 9-15-year-olds**. Flanker was 0.32-0.52, DCCS 0.42-0.60 and List Sorting WM 0.49-0.56. *"None of the tests met criteria for clinical use"* (Taylor et al. 2022, n = 192) [V]. A game in a noisy home on a shared phone will do worse unless it is designed as a measurement instrument.
2. **Game-based cognitive measures can be valid when engineered for it.** In Skill Lab (adults 16+, n = 10,725), cross-validated correlations between game-predicted and task-measured abilities were:
   - choice RT .60
   - "central executive" .55
   - simple RT .54
   - response inhibition .45
   - visual WM .39
   - cognitive flexibility .28
   - visual processing .21
   - colour perception .11, n.s.

   Games were about 5x faster than the task battery (Pedersen et al. 2023) [V]. In 3rd-4th graders, game-framed and standard EF tasks correlated and gave equal performance, with higher motivation for the game version (Johann & Karbach 2018, n = 60) [V]. **The ordering matters: speed is easiest, inhibition middling, flexibility hardest.**
3. **ACE is the closest precedent**: adaptive, mobile, in-school EF assessment of 1,280 students in grades 3-8, eight timepoints over two years. Only 1.9% of task-level data was excluded. Trial-wise adaptive difficulty held about 72% accuracy across ages (Younger 2023) [V]. ACE-X reported ICC 0.45-0.79 (in adults), but concurrent validity against Inquisit tasks was **mixed (r = -.05 to .62)** (O'Laughlin 2025) [V]. Adaptive staircases are the right design. Good reliability still is not guaranteed.
4. **EF develops through the whole 6-15 range, unevenly.**
   - WM's three-factor structure is present from 6 and grows linearly to 15 (Gathercole 2004) [V].
   - Adult levels on oculomotor tasks: processing speed ~15, response inhibition ~14, spatial WM ~19 (Luna 2004) [V].
   - Flexibility is still not adult at 13 (Davidson 2006) [V].
   - EF differentiates into components around age 10 (Younger 2023 [V]; Karr 2022 [V]).

   A 7-year-old and a 14-year-old are not measured on the same construct in the same way.
5. **Correlation with achievement is real; causation is not established.**
   - EF relates to reading, maths and language throughout elementary school, but more weakly once general EF is modelled (Spiegel 2021, 299 studies, n = 65,605) [V].
   - Effects drop by more than half after controlling for IQ and background (Jacob & Parkinson 2015) [S].
   - Childhood self-control predicts adult outcomes (Moffitt 2011) [V], which is why parents care. It is also why mislabelling is costly.
6. **Numeracy is Taxila's strongest scientific opportunity.**
   - Symbolic magnitude comparison correlates with maths at r = .30, non-symbolic at r = .24 (Schneider 2017, 17,201 participants) [V].
   - Number-line estimation correlates at r = .44, and more strongly for fractions (Schneider 2018) [V].
   - Dot-comparison (approximate number system) links may be an inhibition artefact (Gilmore 2013) [V], and Weber fractions are unreliable (Inglis & Gilmore 2014) [V]. **Measure symbolic and number-line skills, not dots.**
   - **The India-specific finding:** working children in Kolkata and Delhi markets solved market maths but failed equivalent abstract problems. Non-working schoolchildren showed the reverse: only 1% solved an applied problem that over a third of working children solved (Banerjee et al. 2025, *Nature*) [V]. Transfer between contexts is a measurable construct in itself.
7. **Reading in Devanagari is not English reading with different letters.**
   - Akshara knowledge takes years. In Kannada, akshara accuracy rises to Grade V and plateaus at VI, with RT stabilising by IV (Usha 2020, n = 315) [V].
   - Alphasyllabary readers build syllable awareness first and phoneme awareness with literacy (Nag & Snowling 2012) [S].
   - Phonemic awareness is the strongest correlate of word reading in alphabetic scripts. Dyslexic children show a −1.37 SD deficit (Melby-Lervåg 2012) [V].
   - Rapid automatised naming (RAN) predicts reading at r ≈ −.38 (McWeeny 2021, preprint) [S].
   - An Indian standardised battery exists: DALI-DAB, n = 1,013, English/Hindi/Marathi, α > 0.8 (Rao 2021) [S].
8. **Bilingual Hindi-English children should not be scored as two half-monolinguals.** Vocabulary in either language alone under-states their lexicon, and the gap is concentrated in home-context words (Bialystok 2010) [V]. The bilingual EF advantage does not survive bias correction or large samples [V]. Code-switching is a resource for teaching, not a deficit signal.
9. **Base rates make automated "detection" mostly wrong.** Indian prevalence of specific learning disorder (SLD) is ~8% (Scaria 2023, six studies, n = 8,133) [V]. With CPT-level accuracy at 7% prevalence, about **84% of flags would be false** (§7.3). The ethical design is *observe, accumulate, rule out confounds, human-review, then gently suggest an evaluation*. Never "your child may have dyslexia/ADHD".
10. **What parents get.** A truthful, specific, longitudinal description of *how their child learns in Taxila*: speed and accuracy patterns, how many steps they can hold, what kinds of reasoning they do, number and reading foundations, and how these change. Each item comes with its evidence and its uncertainty. No IQ, no brain age, no labels, no ranking against other children.

---

## 2. Measurement foundations: why telemetry is hard, and the models that make it usable

### 2.1 Sources of Taxila evidence about cognition

| source | examples | what it can reflect | main contaminants |
|---|---|---|---|
| **G: game trials** (designed micro-tasks inside lesson games) | tap RT, accuracy, errors after a rule change, commission errors on "don't tap" items, span length reached, number-line placements | speed, WM span, response inhibition, flexibility, magnitude representation | device touch/audio latency; motor skill (6-7-year-olds); motivation; strategy; sibling or parent playing; distraction at home |
| **I: lesson items** (kt-algorithms `EvidenceEvent`) | correctness by hint rung, item difficulty b, response latency | domain knowledge, relational reasoning, strategy use | knowledge itself (the main signal); ASR errors |
| **V: voice turns** | speech-onset latency, utterance length, self-repair, language-mix ratio, ASR confidence | language production, lexical access, bilingual repertoire | ASR/VAD errors, network lag, language switching (learning-science §1.10), shyness (vibe §3.2) |
| **S: session habits** | time of day, session length, breaks, drop-off, within-session accuracy decline | fatigue, sustained engagement, routines (handled in the habits review, not here) | who holds the phone, household schedule |

**Rule:** a cognitive estimate may combine G and I. V enters only as a capped feature after ASR filtering. S is a *covariate* (time of day, minutes into session), never an indicator of ability.

### 2.2 Classical reliability: the arithmetic that decides what is estimable

- **Observed correlations are attenuated:** r_obs = r_true · √(ρ_xx · ρ_yy). A true ability-achievement correlation of .5, measured with ρ = .4 on both, appears as .2.
- **Aggregating sessions (Spearman-Brown):** ρ_k = k·ρ₁ / (1 + (k−1)·ρ₁). If one 3-minute game block gives ρ₁ = .35 [U], then 4 blocks give .68 and 8 blocks give .81. Density is Taxila's advantage, *if* the construct is stable over the aggregation window.
- **Standard error of measurement:** SEM = SD·√(1−ρ). A 95% band on an individual score is ±1.96·SEM. At ρ = .6 the band covers ±1.24 SD, which is useless for a parent-facing statement about one child.
- **Reliable change index:** RCI = (x₂ − x₁) / (SD·√2·√(1−ρ)). Report change only if |RCI| > 1.96 *after* removing the expected practice gain (§2.6).

### 2.3 Difference scores and the reliability paradox: use trial-level hierarchical models

Interference and switch-cost scores (incongruent minus congruent RT) are the textbook EF measures. They are robust at group level because people barely differ on them. Hedge et al. (2018) found most such tasks below ρ = .7 and some below .4 [V]. Rouder & Haaf (2019) show that aggregation attenuates them further, and they recover reliability with hierarchical models [V]:

```
y_ijk = α_i + x_k · θ_i + ε_ijk,      ε ~ N(0, σ²)      (child i, trial j, condition x_k ∈ {−½, +½})
θ_i ~ N(μ_θ, σ_θ²)                                        (true individual effect)
reliability of a child's estimate with L trials per condition:
ρ(L) = σ_θ² / (σ_θ² + 2σ²/L)        → trials needed:  L = 2ρ / ((1−ρ) · γ²),   γ = σ_θ/σ
```

**Illustration [U]:** with true individual spread σ_θ = 25 ms and trial noise σ = 200 ms (γ = .125), reaching ρ = .8 needs **L ≈ 512 trials per condition**. A child gives perhaps 20-40 such trials in a game session. Interference scores therefore need many sessions *and* a stable construct. This is why CD2 forbids individual claims from difference scores unless measured reliability says otherwise. Rouder & Haaf's own reanalysis found Bayes-factor evidence that Stroop and flanker effects are *uncorrelated* [V]. "Inhibition" in one game may not be "inhibition" in another.

**What Taxila uses instead:**
- (a) **Accuracy-based and threshold-based** metrics, which have more between-person variance: span reached; commission rate on rare no-go trials; staircase threshold.
- (b) **Model parameters**. Enkavi 2019 found some model parameters as stable as raw DVs [V].
- (c) **Composites** across tasks.

### 2.4 Speed-accuracy trade-off: decompose before interpreting (diffusion models)

Children slow down and speed up for strategic reasons. Raw RT conflates ability, caution and motor time. Ratcliff et al. (2012) found that children aged 8-16 are slower than adults on *all* diffusion components, including "lower quality evidence" [V]. Davidson 2006 found young children keep RT constant and lose accuracy on hard trials, while adults slow down to stay accurate [V]. For two-choice game trials, the **EZ-diffusion** model (Wagenmakers et al. 2007) [V] gives per-child parameters from three summary statistics: accuracy Pc, RT variance VRT, and mean RT MRT (with s = 0.1):

```
L   = logit(Pc)                                    (edge-correct Pc = 1 or 0.5 before use)
v   = sign(Pc − ½) · s · [ L·(L·Pc² − L·Pc + Pc − ½) / VRT ]^(1/4)     drift rate: quality of processing
a   = s² · L / v                                   boundary separation: caution
y   = −v·a / s²
MDT = (a / 2v) · (1 − e^y) / (1 + e^y)
Ter = MRT − MDT                                    non-decision time: encoding + motor + DEVICE latency
```

**Why this matters for Taxila:** *device latency lands in Ter*, not in v. Drift rate v is therefore the device-robust speed-of-processing indicator. Ter changes are uninterpretable across phones. Caution a can be a vibe-like style variable (vibe-temperament's knobs), not ability. This is a design hypothesis [U] to be checked in S1.

### 2.5 Speed as a latent trait (lognormal RT model)

For lesson items, where RTs come from many different items, use van der Linden's hierarchical lognormal model [U, from memory]:

```
log T_ij ~ N( β_j − τ_i , 1/α_j² )      τ_i: child speed;  β_j: item time intensity;  α_j: item discrimination
(θ_i, τ_i) ~ BVN(μ, Σ)                  joint with IRT ability θ_i (kt-algorithms §3)
```

τ_i is "how quickly this child works on items *like these*, after adjusting for how long the items take". It is *not* processing speed in the psychometric sense. It mixes fluency, caution and engagement. It is reported only as fluency on a skill ("solves 2-digit subtraction faster than in July"), which is legitimate and actionable.

### 2.6 Development, learning and practice are confounded: model them explicitly

Every repeated game score is a mix of four things: (1) development, (2) practice and familiarity with *this game*, (3) state (sleep, time of day, mood, noise), (4) device or setting. Model:

```
score_it = (β0 + u0_i) + (β1 + u1_i)·age_it + (γ + g_i)·log(1 + n_it) + δ·state_it + ε_it
n_it  = prior exposures to this game; state_it = time of day, minutes into session, device id, assisted flag
growth claim for child i requires: β1 + u1_i credibly > 0 over ≥ 3 months, beyond the practice term
```

Development rates are slow relative to practice gains. Processing-speed growth is best fitted by exponential or quadratic curves (Kail & Ferrer 2007, n = 503 and 277) [V]:
RT(age) = a + b·e^(−c·age).
**Alternate forms** (new stimuli, same structure) and **adaptive staircases** (ACE design [V]) reduce practice confounding. Neither removes it.

### 2.7 Cognitive "weather" vs "climate"

Children's WM performance fluctuates substantially within days and from day to day. In 110 Grade 3-4 students tested three times a day on smartphones for four weeks, within-person variability in spatial WM precision appeared at every timescale. Higher item-to-item variability went with lower fluid intelligence (Galeano Weber, Dirk & Schmiedek 2018) [V]. In a 20-day ambulatory study of ~10-year-olds, daily *self-regulation*, not daily WM, predicted daily perceived academic success (Blume 2022) [V]. Sleep duration has small positive links with children's EF and school performance (r ≈ .07-.09), but not with intelligence (Astill 2012, 86 studies, n = 35,936) [V].

**Design consequence:** Taxila separates **weather** (today's state, used immediately to adjust the lesson: shorter steps, a break) from **climate** (a smoothed, months-long trend, used for parent description). It never reports weather as climate.

```
latent ability:  η_t = η_{t−1} + w_t,   w_t ~ N(0, q)            q small: climate drifts slowly
observation:     y_t = η_t + s_t + e_t,  s_t ~ N(δ·state_t, r_s)  weather = state effects + session noise
(local-level Kalman filter per child × metric; q, r_s fitted hierarchically across children)
```

### 2.8 Validity threats specific to Taxila

- **Measurement invariance across language, age and device.** A WM game with spoken Hindi instructions vs English instructions may not measure the same thing. Test configural, metric and scalar invariance (and item DIF for IRT items) before comparing groups or ages [U: standard practice].
- **Assisted sessions.** A parent whispering answers or a sibling playing contaminates everything. Detect sudden ability jumps, multiple voices, and out-of-character RT distributions, then mark a session `assisted` and exclude it from cognitive estimates. Identity must be the authenticated child (CLAUDE.md law).
- **SES and familiarity with phones and games.** The SES gradient in EF is real but not destiny. The most disadvantaged South African preschoolers outperformed middle- and high-SES Australians on two of three EFs (Howard 2020, n = 1,092) [V]. Telemetry also measures *experience with screens*.
- **Motor and reading demands.** For 6-7-year-olds, tap precision and reading instructions confound every task. Use large targets and spoken instructions, and measure a simple-tap baseline.
- **Motivation and strategy.** A child who games the system (learning-science P22) produces fast, inaccurate data. Discount gaming windows (learning-science §7.2 rule 4).

---

## 3. Executive functions (Diamond 2013 framework)

**Framework.** Diamond's core EFs are **inhibitory control** (response inhibition/self-control and interference control/selective attention), **working memory**, and **cognitive flexibility**. Higher-order EFs (reasoning, problem solving, planning) are built from them (Diamond 2013, *Annu Rev Psychol* 64:135) [S]. Miyake-style "unity and diversity" applies: a common EF factor plus specific components. In childhood the unity dominates (Karr 2018: unidimensional models most often accepted in child and adolescent samples [S]). Components differentiate from childhood to adolescence, and shifting becomes more central in adolescence (Karr 2022, n = 3,944, ages 3-85) [V].

**Relational thinking** predicts unique variance in maths fluency and fraction comparison beyond three EF composites (Starr 2023, n = 942, ACE/iLEAD) [V]. Starr proposes treating it as an EF. Taxila treats it under reasoning (§5) but measures it the same way.

### 3.1 Working memory (WM)

**Definition.** Holding information in mind and working with it: updating, manipulating and ordering. It is distinct from short-term storage (forward span), which is storage only.

**Trajectory 6-15.**
- Baddeley-Hitch structure (phonological loop, visuospatial sketchpad, central executive) is present from 6, with roughly linear capacity growth from 4 to 15 (Gathercole 2004) [V].
- Adult-level spatial WM is not reached until ~19 on oculomotor tasks (Luna 2004, n = 245, ages 8-30) [V].
- WM is moderately associated with reading, maths and language throughout elementary school, more consistently than the other EF components (Spiegel 2021) [V].
- In Taxila terms, a 6-year-old reliably holds about one instruction step with one condition, and a 14-year-old several [U: Halford's relational complexity, §5.1, is the better formal account].

**Valid Taxila indicators.**
- *G (primary):* adaptive **forward and backward spatial span** embedded in a game, e.g., "remember which lamps lit up, in order (or reverse)", as in ACE [V]. Also **N-back-style updating** in a "who came last?" game for ages 10+.
- *I (secondary):* **failures that scale with step count** on multi-step items whose knowledge components are mastered, i.e. a child who can do each step but fails the 3-step chain. This is the *instructionally useful* WM signal.
- *V:* **instruction-paraphrase failures** (learning-science P23) on long spoken instructions, compared with short ones (an in-product A/B).
- *Not valid:* recall of lesson content (that is learning), and long voice monologues.

**Measurement model.** Span as a logistic item-response function of load:

```
P(correct_ij) = σ( κ_i − λ · load_j − δ_type(j) )         per-child capacity κ_i ~ N(μ_age, σ_κ²)
span_i (50% point) = (κ_i − δ_type) / λ                   δ_type: spatial vs verbal, forward vs backward
adaptive staircase: load +1 after 2 correct, −1 after 1 error  (≈ 70.7% target)
```

Two kinds of failure are evidence about different things:
- *instructional load* in lessons: κ_i enters as a covariate in the probability that a multi-step item is solved given component mastery.
- *game failure*: evidence about κ_i.

**Reliability and validity concerns.**
- NIH-TB List Sorting WM 1-3-year ICC was 0.49-0.56 in 9-15-year-olds [V].
- Skill Lab visual WM game r_cv = .39 against tasks [V].
- Adaptive spans are better than fixed-length ones (ACE) [V].
- WM training does not transfer (Melby-Lervåg 2016) [V], so a rising game span is mostly *practice*, unless shown on alternate-form transfer tasks.

**What can be said to parents.** *Shape:* "In the lamp game, [child] now remembers about [k] positions in order (range across [n] sessions in [month]). We use this to keep multi-step explanations to [k−1] steps at a time, which helps her finish problems on her own." *Never:* "her working memory is weak/below average", "memory score", or any percentile.

### 3.2 Inhibitory control

**Definition.** Response inhibition (withholding a prepotent action) and interference control (resisting distraction or conflicting information). Diamond 2013 includes self-control (resisting temptation) [S]. Self-control as a *life* trait (Moffitt 2011) [V] is measured by multi-informant ratings over years. Taxila must not equate game impulsivity with it.

**Trajectory.**
- Flanker conflict scores on the child Attention Network Test were already stable from age 7 (Rueda 2004) [V].
- Antisaccade response suppression reaches adult level around 14 (Luna 2004) [V].
- Young children can inhibit in steady state, at a cost adults do not pay (Davidson 2006) [V].
- So "inhibition" develops on different timetables depending on the task. That is one more reason not to treat any one game as *the* inhibition measure.

**Valid Taxila indicators.**
- *G:* **go/no-go "don't tap the X"** rare trials. Metrics: commission rate and the RT on hits that precede commissions. **Stroop-like** congruent/incongruent trials: use accuracy and the hierarchical θ_i (§2.3), never a raw RT difference.
- *I:* **premature answers**: answering before the question is complete (requires turn timing), and the "blurt then self-correct" pattern. The latter is *positive* monitoring (learning-science P16).
- *Learning-relevant:* Brod et al. 2020 found that only 9-12-year-olds with higher inhibitory control learned from *wrong predictions* [V, via learning-science §1.6]. A child's response to predict-before-reveal (P5) is the most product-relevant inhibition-related behaviour. **Replicating this in-product is a strong paper (§9 S4).**

**Measurement model.** No-go commission as a binomial with a hierarchical child effect and covariates:

```
logit P(commit_it) = ζ_i + β_age·age + β_rate·goRate_t + β_min·minutesIntoSession + β_dev·device
ζ_i ~ N(0, σ_ζ²);  report posterior of ζ_i only if ρ (from S1) ≥ .7
```

**Concerns.** Skill Lab's inhibition game reached r_cv = .45 [V]; NIH-TB Flanker 1-3-year ICC 0.32-0.52 [V]. Gamification invites strategic slowing, which a diffusion decomposition can separate (a vs v).

**What can be said to parents.** Only situational, positive-framed descriptions tied to teaching moves. *Shape:* "When she predicts before we reveal an answer, she's getting better at pausing to check, and we always walk through why the answer differed." *Never:* "impulsive", "can't control herself", "attention problem".

### 3.3 Cognitive flexibility

**Definition.** Switching between rules, tasks or perspectives; adjusting when the rule changes; seeing a problem another way. It builds on WM and inhibition (Diamond 2013) [S].

**Trajectory.** The longest developmental progression of the three: 13-year-olds were not at adult levels on rule switching even with memory demands minimised (Davidson 2006) [V]. Shifting grows more central in the EF network in adolescence (Karr 2022) [V].

**Valid Taxila indicators.**
- *G:* **DCCS-like "now sort by shape"** rule switches. Metrics: perseverative errors after the switch (accuracy-based, so more reliable than switch-cost RT); trials to criterion after an unannounced rule change.
- *I (stronger, domain-specific):* **strategy flexibility in maths**: using a different strategy when the numbers invite it (e.g., 99 + 47 as 100 + 46). Choosing the right method in interleaved sets (learning-science P9). This is a *learning outcome*, measurable with items, and arguably what parents care about.

**Measurement model.** Perseveration count after a switch as negative-binomial, or trials-to-criterion as a discrete-time survival model with a hierarchical child frailty term. Switch-cost RT only via §2.3.

**Concerns.** Skill Lab flexibility r_cv = .28, the weakest accepted ability [V]. NIH-TB DCCS 1-3-year ICC 0.42-0.60 [V]. ACE excluded its flexibility task for technical reasons (Younger 2023) [V]. **Status: research-only in v1.** Parents see only the domain-specific version (strategy flexibility on maths items).

### 3.4 Processing speed

**Definition.** The rate of executing elementary cognitive operations. Kail argues for a largely *global* mechanism that changes rapidly in childhood and slowly in adolescence [S]. Exponential and quadratic models fit longitudinal data best (Kail & Ferrer 2007) [V].

**Trajectory.** Steep improvement, adult-like around 15 (Luna 2004) [V]. A processing-speed → WM → reasoning developmental cascade is a classic hypothesis (Fry & Hale 1996) [U]. Luna found speed influenced the development of WM [V].

**Valid Taxila indicators.**
- *G:* simple and choice RT trials. Skill Lab: choice RT r_cv = .60, simple RT .54 [V]. These are the *most* estimable cognitive quantities in a game.
- *Decomposition:* use **drift rate v** (EZ, §2.4), not raw RT.
- *I:* τ_i fluency (§2.5) per skill. This is *learning*, not processing speed.

**Concerns.**
- **Device latency** on low-end Android touch and audio paths is large and variable [U: measure in E1-like device study]. Calibrate per device with a tap baseline, and break the time series on a device change.
- Speed is the metric most easily misread as "smartness". It must never be framed that way.
- RT *variability* is elevated in ADHD (g = 0.76 in children) but also in other clinical groups. Against clinical controls it is only g = 0.25 (Kofler 2013) [V]. It is not a screening marker for Taxila.

**What can be said to parents.** Only skill fluency. *Shape:* "Times-tables 6-9: answers now come in about [x] s instead of [y] s, with the same accuracy. Fluency like this frees attention for harder problems." Do not report raw cognitive speed to parents in v1.

### 3.5 Attention control and sustained attention

**Definition.** Posner's networks: alerting, orienting, executive attention (the child ANT, Rueda 2004 [V]); plus sustained attention (vigilance) and mind-wandering.

**Trajectory.** Alerting changes up to and beyond 10; conflict scores stable after 7; orienting unchanged from 6 to 10 (Rueda 2004) [V]. In 10,430 people aged 10+, sustained-attention ability rose through adolescence and peaked in the early 40s. Strategy (caution) diverged from ability after 15 (Fortenbaugh 2015) [V]. Ability vs strategy is the same a-vs-v split as §2.4.

**Valid Taxila indicators.** *Within-session* trends:
- accuracy decline and rising RT variability as a function of minutes into the session
- lapses (omissions, very slow responses), using an ex-Gaussian τ tail on RT [U]
- recovery after a break

These are **weather and session-design signals**: they decide *when* to offer a break or switch activity. They are not trait estimates.

**Measurement model.** Per-session vigilance slope:

```
logit P(correct_t) = π_i + (ψ + ψ_i)·minutes_t + δ·itemDifficulty_t      ψ_i: child's decrement
lapse model: RT ~ exGaussian(μ, σ, τ_i) on choice trials;  τ_i ↑ within session ⇒ break trigger
```

**Concerns.** Home distraction, siblings and notifications dominate. Attention measured in an app is not attention in a classroom. A child bored by a poorly matched lesson "looks inattentive": the affect dynamics in learning-science §1.11 explain the same data. **Any attention signal is first a statement about the lesson fit.**

**What can be said to parents.** *Shape:* "Sessions go best when they're about [m] minutes with a movement break; after that, accuracy dips. Mornings were stronger than late evenings this month." Never "attention span is short", never "ADHD", never "focus score".

---

## 4. Language and bilingual (Hindi-English) development

**Definition.** Vocabulary (breadth and depth), morphosyntax, discourse and narrative, metalinguistic awareness (phonological awareness: §7), and the bilingual repertoire (two lexicons, code-switching).

**Trajectory.**
- Vocabulary and reasoning develop in **mutualistic coupling**: each predicts growth in the other, more strongly in younger children (Kievit 2019, n = 227, ages 6-8, a replication) [V].
- Bilingual children score lower on single-language receptive vocabulary, concentrated in home-context words. The difference was stable across language pairs (Bialystok 2010, n = 1,738, ages 3-10) [V]. In ABCD, the English vocabulary gap was substantially mitigated by controlling for SES or intelligence (Dick 2019) [V].
- The bilingual EF advantage claim does not survive: no advantage after publication-bias correction (Lehtonen 2018, 152 studies) [V]; none in ABCD (Dick 2019) [V]; none in Paap & Greenberg 2013 [V]. Lehtonen also found a small bilingual *disadvantage* in verbal fluency, consistent with divided exposure [V].
- **India.** Most Taxila children are bilingual or emergent bilinguals, schooled in Hindi, English or a regional medium, with English often a school-only language [S: learning-science §5.4]. Systematic review evidence from LMICs on language of instruction exists (Nakamura et al. 2023, Campbell) [S]. Taxila did not re-verify its conclusions this session.

**Valid Taxila indicators.**
- *I:* **conceptual vocabulary items**. A word counts as known if the child shows the concept in *either* language: receptive picture choice, or a spoken definition graded against an expectation list. Score with IRT on a joint lexicon. Separately track **English academic vocabulary** for school-language readiness.
- *V:* language-mix ratio per turn (`computeCsRatio` from vibe-temperament). Utterance length and complexity in each language. Narrative retell structure (who/what/why) graded by rubric.
- *Not valid:* ASR confidence as a "language ability" score (it measures the ASR); accent; switching as "confusion".

**Measurement model.** A bifactor IRT model for words with a general lexical factor plus language-specific factors:

```
logit P(knows_iw | lang) = a_w·θ_i^gen + a_w^L·θ_i^L − b_w      L ∈ {Hindi, English}
conceptual vocabulary = θ^gen;  language-specific gaps = θ^L  (instructional targets, e.g., English labels for known concepts)
```

**Concerns.**
- ASR WER on code-switched child speech is high (HiACC; learning-science §1.10) [V via learning-science]. Every V-indicator needs the ASR-confidence gate.
- Dialect and class markers in Hinglish carry LLM bias risk (vibe-temperament §1 point 9). LLM graders must be audited for dialect fairness before scoring any language production.

**What can be said to parents.** *Shape:* "[Child] understands about [n] of the [m] science words we've met: [p] she can explain in Hindi, [q] also in English. This month we're adding English labels for words she already knows in Hindi." Frame bilingualism as an asset, without claiming cognitive advantages.

---

## 5. Reasoning: Piaget, neo-Piagetian complexity, relational and analogical reasoning

### 5.1 What survives of Piaget, and what replaces it

- **Stage theory as a timetable is not usable.**
  - Children succeed on many "concrete operational" tasks earlier when task demands are reduced [U: e.g., McGarrigle & Donaldson 1974].
  - Formal operations are not universal and are culturally and educationally variable. UK norms on a Piagetian volume and heaviness test *fell* between 1976 and 2003 (boys −1.04 SD, girls −0.55 SD; Shayer, Ginsburg & Coe 2007, 10,023 Y7 students) [S].

  Taxila must never tell a parent their child is "pre-operational" or "not yet formal operational".
- **What survives is the developmental phenomena.** Conservation, class inclusion, proportionality, control of variables and hypothetical reasoning all develop through 6-15 and are good *probe content* for maths and science. The neo-Piagetian account explains why: **relational complexity**. Processing capacity is limited by the number of related dimensions that must be held at once, with a soft adult limit of one quaternary relation. Complex tasks are handled by segmentation or conceptual chunking (Halford, Wilson & Phillips 1998) [V]. The complexity of relations children can process increases with age [V].
- **Analogical reasoning.** Young children (3-7) are easily drawn to surface-similar distractors in scene analogies; 9-11-year-olds much less so. Both relational complexity and distraction constrain performance even when relational knowledge is controlled (Richland, Morrison & Holyoak 2006) [S].
- **Strategy variability.** Children use several strategies at once, and the mix shifts gradually: Siegler's overlapping-waves model, studied with the microgenetic method [U]. *Dense trial-by-trial logs are exactly what microgenetic research needs.* This is a major scientific opportunity for Taxila (§9 S7).

### 5.2 Indicators, model, concerns

**Valid Taxila indicators.**
- *I:* items tagged by **relational complexity** (unary/binary/ternary/quaternary relations) and by the presence of a **surface distractor**. Include proportional-reasoning items, control-of-variables items in science, and relational-match puzzles (Starr 2023's simplified task [V]).
- *Strategy codes* from voice explanations and item traces: e.g., counting-on vs retrieval vs decomposition, labelled by a closed-set LLM labeller audited against humans, like turn labels in kt-algorithms §4.

**Measurement model.** Linear logistic test model (LLTM): item difficulty decomposed into complexity features, which turns "what makes reasoning hard for this child" into estimable parameters:

```
logit P(correct_ij) = θ_i − Σ_k q_jk·η_k          q_jk: item j has feature k (e.g., ternary relation, surface lure, unfamiliar context)
child-specific feature effects (random slopes): logit P = θ_i − Σ_k q_jk·(η_k + ν_ik)
strategy mix over time: multinomial logistic with child random effects, p_is(t) = softmax(ω_is + ϖ_s·t)
```

**Concerns.**
- Reasoning items load heavily on knowledge and language.
- An "abstract reasoning score" is an IQ proxy, so CD4 applies with extra force.
- Use reasoning parameters *instructionally*: "lures trip her up → teach contrasting cases (learning-science P8)". Never as a general-ability ranking.

**What can be said to parents.** *Shape:* "She solves two-condition problems reliably; with three conditions she now succeeds when we break the problem into parts. This month she started using 'make a ten' instead of counting on." That is a description of reasoning *in action*. No stage labels, no "logical thinking score".

---

## 6. Numeracy development

### 6.1 What develops

- **Approximate number system (ANS).** Non-symbolic acuity improves through the school years and peaks late, around 30, with very large individual differences at every age (Halberda et al. 2012, >10,000 participants aged 11-85) [V]. However:
  - its link to maths (r = .24) is weaker than the symbolic link (r = .30) (Schneider 2017) [V]
  - dot-comparison correlations with maths may be an artefact of the *inhibitory* demands of incongruent trials (Gilmore 2013) [V]
  - Weber fractions are skewed and less reliable than plain accuracy (Inglis & Gilmore 2014) [V]

  **Taxila does not use dot comparison as a child-level indicator.**
- **Symbolic magnitude and the mental number line.**
  - Children's estimates on 0-100 and 0-1,000 lines become more linear with age and experience, consistently across estimation types, and relate to achievement (Booth & Siegler 2006) [V].
  - Whether this is a log-to-linear *representational shift* or improving *proportion judgement* is contested (Barth & Paladino 2011) [V]. For Taxila it does not matter: the task is a valid predictor either way, r = .44 across 263 effect sizes, ages 4-14, stronger for fractions (Schneider 2018) [V].
  - Playing a linear number board game for four 15-minute sessions eliminated the SES gap in preschoolers' estimation (Siegler & Ramani 2008) [S]. This is an existence proof that a *game* can move this construct.
- **Fractions and division.** Elementary-school fraction and division knowledge uniquely predicts high-school algebra and overall maths 5-6 years later, after controlling for general ability, WM and family background (Siegler et al. 2012, US + UK cohorts) [V]. Fraction magnitude comparison is thus a key Class 4-7 marker.
- **Arithmetic strategies.** Children move from counting to decomposition to retrieval in overlapping waves [U]. Fluency (retrieval speed with accuracy) frees WM for harder work [U].
- **Applied vs academic maths in India (Banerjee et al. 2025)** [V]:
  - 1,436 working children in Kolkata and Delhi markets solved complex market maths but failed abstract problems of equal or lesser complexity.
  - 471 non-working schoolchildren nearby did better on abstract problems, but **only 1%** solved an applied market problem that more than a third of working children solved.
  - Schoolchildren used "highly inefficient written calculations" and could not combine operations.

  For Taxila: (a) **transfer across representations and contexts is itself a construct to measure** (learning-science P4/P14); (b) a child's strong market or cricket maths is real competence the abstract curriculum should build on, not a sign that "they're bad at maths".
- **Dyscalculia.** A core deficit in understanding sets and their numerosities, with intervention promise from adaptive software (Butterworth, Varma & Laurillard 2011) [V]. Indian prevalence estimates are ~4.9% in one meta-analysis [S]. The pooled SLD figure is 8% (Scaria 2023) [V].

### 6.2 Indicators and models

**Valid Taxila indicators (all I/G items, all curriculum-native).**
- **Symbolic magnitude comparison** (which is bigger: 47 or 74; 3/8 or 1/2): accuracy plus a speed-accuracy decomposition (§2.4).
- **Number-line estimation** (drag a marker to place 37 on 0-100; 3/4 on 0-1).
- **Strategy traces** on arithmetic: spoken "how did you get it?" (P2) plus latency signature. Retrieval is fast and flat; counting latency grows with addend size [U].
- **Representation-translation** items (P14) and **context-transfer** pairs: the same structure posed as market, story and abstract (the Banerjee contrast).

**Measurement models.**

```
Number line (proportion-judgement / cyclic power model, after Barth & Paladino):
  p = target/scale;   E[estimate/scale] = p^β / (p^β + (1−p)^β)          β_i: child's compression; β=1 is linear
  PAE_i = mean |estimate − target| / scale                               (simple, reliable summary; report this)
Symbolic comparison (distance effect via drift):
  v_ij = v_i · g(|n1 − n2| / max(n1, n2))                                 child drift v_i (EZ per block)
Context transfer:
  logit P(correct_ijc) = θ_i + φ_ic − b_j       c ∈ {abstract, verbal-context, market/real}; φ_ic: child's context gap
```

**Concerns.**
- Drag precision on small phones and motor skill at 6-7. Use a large line, and calibrate with "place the marker at the end" trials.
- Number-line items are teachable, so improvement is learning (good), not maturation.
- Watch measurement invariance between Hindi and English number words. Hindi number names 1-100 are irregular, so 6-8-year-olds may master Hindi number words later than counting would suggest [U]. Score digit-based items separately from spoken number-word items.

**What can be said to parents.** *Shape:* "Number sense: she places numbers up to 100 on a line within about [x] of the right spot (was [y] in July). Fractions: she now knows 3/4 is bigger than 2/3, which most children find hard. Real-life maths: she's quick with money problems, so we're using shop examples to bridge to written sums." All of this is evidence-backed and actionable. None of it is a label.

---

## 7. Reading development, and the flag-for-professional pathway

### 7.1 What develops

- **Alphabetic scripts (English).**
  - Phonemic awareness is the strongest correlate of word reading. Children with dyslexia show large deficits relative to age-matched controls (−1.37 SD) and even relative to reading-level-matched controls (−0.57) (Melby-Lervåg, Lyster & Hulme 2012, 235 studies) [V].
  - RAN (rapid automatised naming) predicts later reading at r ≈ −.38, more strongly for alphanumeric RAN (McWeeny et al. 2021, preprint) [S].
  - Dyslexia is multifactorial: phonological deficits plus weaker oral language and processing speed (Peterson & Pennington 2015) [V].
- **Akshara scripts (Devanagari, Kannada and others).**
  - Each akshara is a syllable-level unit with visible sub-syllabic marks (matras, conjuncts).
  - Akshara knowledge accrues over years. In Kannada, identification accuracy improved from Grade I to V and plateaued at VI, and RT stabilised by Grade IV. Difficulty rises from primary vowels → consonant with inherent vowel → consonant + matra → conjunct clusters (Usha et al. 2020, n = 315) [V].
  - Kannada readers develop syllable awareness before phoneme awareness. Better readers are also better at phoneme tasks, suggesting dual syllable/phoneme representation grows with literacy (Nag & Snowling 2012) [S].
  - In Hindi, reading errors concentrate on vowel placement (matras) and conjuncts [S].
  - **Implication:** for Hindi readers, the right early indicators are *akshara knowledge by complexity class* and *syllable-level awareness*, with phoneme awareness emerging later. English phonics norms do not transfer.
- **Fluency and comprehension.** India's foundational targets are around 30-35 correct words per minute (cwpm) in Grade 3, and only about 23% of children met Hindi global minimum levels in NCERT's 2022 Foundational Learning Study [S]. ASR-based oral reading fluency assessment already works at state scale in India (Vachan Samiksha; learning-science §5.6) [S].
- **Biliteracy.** Many Taxila children learn Devanagari and Latin scripts at once. Cross-script phonological skills correlate in multilingual children (e.g., the Hong Kong pinyin/English work) [S]. Hindi-English specific transfer evidence was not found this session [U]. DALI-DAB is standardised across English, Hindi and Marathi (Rao et al. 2021, *Annals of Dyslexia*) [S] and is the natural Indian external criterion for a validation study.

### 7.2 Indicators and models

**Valid Taxila indicators.**
- *I/G:* **akshara identification** (hear-and-tap or see-and-say) sampled across complexity classes; **syllable and phoneme tasks** via voice (blend, delete, rhyme), with tap fallback; **word and pseudoword decoding** (say-aloud, ASR-scored, human-audited); **ORF** (cwpm) on graded passages; **listening comprehension vs reading comprehension** on matched passages (the simple view of reading: decoding × language comprehension [U]).
- *RAN-like* naming speed from voice timing **only after** ASR word-timestamp validation against hand-timed audio on Indian children (an E1 extension). Until then it is research-only.

**Measurement model.** An explanatory IRT model for akshara, plus a growth model for fluency:

```
logit P(correct_ia) = θ_i − (b_class(a) + b_a)            class ∈ {V, CV, CV+matra, CCV/conjunct}; b_a: frequency residual
child profile = θ_i plus random slopes on class (e.g., matra-specific gap ν_i,matra)
ORF growth: cwpm_it = (β0 + u0_i) + (β1 + u1_i)·weeks_it + ε_it,  measured on equated passages (passage effects removed)
decoding–comprehension gap_i = z(listening comprehension) − z(reading comprehension)
```

**Concerns.**
- **ASR on child read speech is the binding constraint.** A misrecognised correct read is a false error. All V-scored reading events need ASR confidence plus periodic human audit, and **no flag may rest on ASR-scored evidence that has not been audited.**
- Dialect pronunciation is not a decoding error.
- Low reading may reflect *instruction* (ASER: most Std III children cannot read Std II text; learning-science §5.2) [S], not a learner-internal difficulty. In India, poor reading is the population base case, not an anomaly. This alone makes automated dyslexia "detection" in Indian children deeply hazardous.

### 7.3 Flag-for-professional pathway (reading, maths; never ADHD)

**Why base rates dominate.** PPV = sens·prev / (sens·prev + (1−spec)·(1−prev)).
- At SLD-like prevalence of 7%, with CPT-level accuracy (sens .75, spec .71; Arrondo 2024 [V]): PPV = .0525 / (.0525 + .27) ≈ **.16**. Five of six flags are false.
- Even a strong screener (sens .80, spec .90 [U]) gives PPV ≈ **.38**.
- Where poor reading is common because of instruction, specificity of any "low reading" rule collapses further.

**Diagnostic criteria point the same way.** DSM-5 SLD requires difficulties persisting for at least 6 months despite interventions that target them. The APA has clarified that this means quality instruction addressing the difficulty, not 6 months of specialist intervention [S]. A Taxila flag can therefore only follow **sustained, well-delivered, targeted Taxila instruction that did not work**. This is a response-to-intervention logic that Taxila is unusually well placed to document.

**Pathway (all conditions required):**
1. **Domain:** foundational reading (akshara/decoding/fluency) or foundational number (symbolic magnitude/number line/basic facts). No flags for EF, attention, speed or "general ability".
2. **Persistence despite targeted teaching:** ≥ 12 weeks [U] of Taxila instruction on that foundation, at the right level (TaRL logic), with logged fidelity (enough sessions; the hint ladder used; varied representations tried; the wheel-spinning detector fired and approach changes were made).
3. **Disproportion:** the gap in this foundation is large relative to the child's *own* progress elsewhere, e.g. listening comprehension and maths reasoning progressing while decoding is flat. Unexpectedness is not a DSM-5 criterion, but it protects against flagging poor schooling.
4. **Confounds ruled out in the data:** ASR-audited evidence only; not mostly `assisted` sessions; device and noise checks; the language of instruction matches the language tested.
5. **Hearing and vision first.** The message always suggests basic eye and hearing checks [U: standard paediatric practice].
6. **Human review:** a qualified reviewer (a child or educational psychologist contracted by Taxila) reviews the evidence summary before anything is sent. The algorithm proposes; a person disposes.
7. **Message design:**
   - The message goes to the parent only, never to the child.
   - It is non-diagnostic and names *observations, not conditions*.
   - It suggests a conversation with the class teacher and an evaluation by a qualified professional. In India these are clinical psychologists or special educators and paediatric or child-guidance services; standard Indian instruments include the NIMHANS SLD index [S] and DALI [S].
   - It includes what Taxila will keep doing meanwhile.
   - It states the uncertainty plainly ("this does not mean she has a learning disorder; many children who struggle with this catch up with time and teaching").
8. **Rate and reversibility:** at most one such message per domain per 6 months [U]. The parent can ask for the evidence pack (PDF) to share with professionals. The flag is withdrawn if progress resumes.

**ADHD: no flag.** ADHD requires symptoms across settings plus impairment, judged by clinicians using multiple informants. Objective tests are only adjuncts (Arrondo 2024) [V]. RT variability is non-specific (Kofler 2013) [V]. The youngest children in a class are diagnosed 30-70% more often (Morrow 2012, n = 937,943) [V], and Taxila's class-based context would import that bias. Worldwide prevalence is ~5.3% and heavily method-dependent (Polanczyk 2007) [V]. **If a parent raises attention concerns**, Taxila may share descriptive session observations (§3.5) and suggest discussing concerns with a paediatrician. It never proposes ADHD.

**Wellbeing guardrails around flags.** No change in how the tutor treats the child after a flag, and no lowered expectations: expectancy effects are a known risk [U: Jussim & Harber 2005]. A flag never appears in child-visible UI, prompt text or the tutor's persona context. It lives in the parent channel and the reviewer queue only.

---

## 8. Estimability matrix and the parent contract

### 8.1 Construct × estimability (v1 status)

| construct | primary Taxila source | expected reliability (literature anchor) | v1 status | parent-facing? |
|---|---|---|---|---|
| Skill fluency (τ per skill) | I | high (learning-domain; [U]) | **estimate** | yes: per skill |
| Choice/simple speed (drift v) | G | moderate (Skill Lab r_cv .54-.60 [V]; NIH-TB pattern comparison ICC .51-.77 [V]) | estimate, research + knobs | no (v1) |
| WM span (spatial/verbal) | G (+ I step-scaling) | moderate (NIH-TB List Sorting .49-.56 [V]; Skill Lab visual WM .39 [V]) | estimate, aggregated ≥ 4 blocks | yes: descriptive, own trend only, with teaching implication |
| Response inhibition (no-go commission) | G | low-moderate (Skill Lab .45 [V]; Flanker ICC .32-.52 [V]) | research; knob only | no |
| Interference/switch-cost RT | G | low (Hedge 2018 [V]) | **do not estimate individually** | no |
| Flexibility (perseveration) | G | low (Skill Lab .28 [V]; DCCS .42-.60 [V]) | research | domain version only (maths strategy flexibility) |
| Sustained attention (within-session) | G + I | weather, not trait | knobs (breaks, length) | yes: session-design notes only |
| Relational reasoning (LLTM features) | I | moderate-high once items are calibrated [U] | estimate | yes: as reasoning-in-action description |
| Conceptual vocabulary (bifactor IRT) | I + V | moderate-high with calibrated items [U] | estimate | yes |
| Number line (PAE, β) | G/I | good predictor (r = .44 [V]); reliability to measure | **estimate** (flagship) | yes |
| Symbolic magnitude comparison | G/I | r = .30 with maths [V] | estimate | yes |
| ANS dot comparison | G | unreliable index (Inglis & Gilmore [V]); inhibition artefact (Gilmore [V]) | **do not use** | no |
| Fraction magnitude | I | strong predictor (Siegler 2012 [V]) | **estimate** (flagship) | yes |
| Context transfer (abstract vs applied) | I | novel; Banerjee 2025 shows large effects [V] | estimate + research | yes |
| Akshara knowledge by class | I/G (+ V audited) | strong developmental signal (Usha 2020 [V]) | **estimate** (flagship) | yes |
| Phonological awareness (syllable/phoneme) | V (+ tap) | strongest reading correlate in alphabetic scripts [V]; ASR-limited | estimate with audit | yes |
| ORF (cwpm) | V | state-scale precedent [S]; ASR-limited | estimate with audit | yes |
| RAN-like naming speed | V | r ≈ −.38 [S]; timing validity unknown | research only | no |
| "General ability"/IQ/brain age | — | — | **banned** | **never** |

### 8.2 The parent contract (what every cognitive statement must satisfy)

A cognitive statement reaches a parent only if it passes all of the following. These extend vibe-temperament L1-L5.
1. **Specific and situated:** it names the game or skill and the period.
2. **Own-trend only:** it compares the child with her own past, never with other children (CD4). Curricular level vs class expectation is allowed: it is a learning statement, governed by learning-science §6 rule 28.
3. **Evidence and uncertainty attached:** the number of sessions, a range or interval, and "still learning" when the reliability card says ρ < .7 or n is small.
4. **Paired with a teaching action:** what Taxila does about it, and optionally what the parent can do. A cognitive description without an action is curiosity at the child's expense.
5. **No banned vocabulary**, enforced as an eval predicate, not an instruction (CLAUDE.md: safety by predicate):

   > IQ, intelligence score, smart, gifted, genius, slow learner, weak, below average, brain age, left/right-brained, learning style (visual/auditory/kinaesthetic), attention span score, ADHD, dyslexic, dyscalculic, disorder, deficit, impulsive, lazy

   Plus Hindi equivalents (e.g., कमज़ोर दिमाग, "weak brain") [U: list to be built with a native-speaking reviewer].
6. **Strength-first ordering:** each report leads with a real, evidenced strength. This is not inflation: if no strength is evidenced yet, say what is being learned.
7. **Development framing:** abilities are described as developing and responsive to teaching and practice. This is true: schooling raises measured ability (Ritchie & Tucker-Drob 2018) [V]. It is not a growth-mindset slogan.

---

## 9. Research programme ("so good we can publish")

All studies use consented subsamples with a separate research opt-in from the parent and, at 10+, assent from the child. Preregister on OSF. Hierarchical models throughout. Data minimisation as in learning-science §8.6.

| id | question | design | outcome / what would be publishable |
|---|---|---|---|
| **S1** | Are Taxila's embedded game measures reliable and valid in Indian children? | n ≥ 300 across ages 6-15 × Hindi/English medium. Taxila games vs standard tasks (open-source equivalents of span, flanker, go/no-go, DCCS, pattern comparison) in a supervised session. 2-week test-retest. Device logged | ICC per metric per age band (fills CD2/CD9 cards); r with standard tasks, disattenuated; device-invariance. **First validated game-based EF battery for Indian children in Hindi and English** |
| **S2** | Does EF structure differentiate with age in Indian children as in US samples? | Longitudinal network and CFA models across 6-15 (Younger 2023 / Karr 2022 methods) | Tests CD3. Cross-cultural replication of EF differentiation (ACE found it ~grade 5) |
| **S3** | Is lesson step-load × child WM the real driver of hint consumption? | Within-child micro-randomisation of instruction chunking (1 vs 2 vs 3 steps per turn); outcome = hints and delayed success, moderated by κ_i | An aptitude-treatment interaction on a *cognitive* dimension, the WM analogue of expertise reversal. If null, a useful negative |
| **S4** | Does inhibitory control moderate learning from wrong predictions (Brod 2020) at scale? | Predict-before-reveal (P5) randomised vs tell-first, across ages; moderator ζ_i from no-go games | Large-n, in-the-wild replication or extension of Brod et al. |
| **S5** | Abstract vs applied maths transfer in Taxila children | Context-transfer item triads (abstract/verbal/market) over months; test whether bridging lessons close φ_ic | Extends Banerjee 2025 from cross-section to within-child longitudinal and intervention |
| **S6** | Cognitive weather: how much do time of day, session minute, and (parent-reported, optional) sleep move performance? | Intensive longitudinal, dynamic structural equation models (as in Neubauer 2021 [V]) | Ecological within-child dynamics at scale in an LMIC; informs scheduling |
| **S7** | Microgenetics of strategy change in arithmetic and akshara decoding | Trial-level strategy codes over months; overlapping-waves models | Large-scale microgenetic dataset: rare in the literature, nonexistent for Devanagari [U] |
| **S8** | Akshara acquisition curves in Devanagari | Explanatory IRT by complexity class, Classes 1-5, Hindi medium | Hindi equivalent of Usha 2020, at much larger n and longitudinal |
| **S9** | Validity of the reading/maths flag rule | Flagged vs matched unflagged children offered external evaluation (DALI / NIMHANS-style) with consent | Real PPV/NPV of the pathway; decides whether it continues. **Kill criterion: PPV < .4 after n ≥ 50 evaluations** [U] |

**Publication hygiene.**
- Report reliability for every measure (Parsons et al. 2019 argue for this as standard practice [S]).
- Separate confirmatory from exploratory analyses.
- Correct for multiplicity across the many possible telemetry features.
- No "AI discovers your child's mind" framing. The honest headline is *dense, longitudinal, ecologically valid measurement of learning-relevant cognition in Indian children, with its limits quantified.*

---

## 10. Interfaces into Taxila (proposed, for the spec workstream)

```ts
// proposed: shared/contracts.ts (CognitiveLayer; separate store from the KT ledger, CD1)
export type CogMetricId =
  | 'speed.drift' | 'wm.span.spatial.fwd' | 'wm.span.spatial.bwd' | 'inhib.nogo.commit'
  | 'attn.vigilance.slope' | 'num.line.pae' | 'num.line.beta' | 'num.symcmp.drift'
  | 'num.frac.cmp' | 'num.context.gap' | 'read.akshara.theta' | 'read.akshara.classGap'
  | 'read.orf.cwpm' | 'lang.vocab.gen' | 'lang.vocab.L' | 'reason.lltm.feature';
export interface GameTrial {                    // one trial of an embedded measurement micro-task
  childId: string; sessionId: string; at: string; game: string; formId: string;   // alternate form
  condition: string; load?: number; stimulus: string; response?: string;
  correct?: boolean; rtMs?: number; omitted?: boolean;
  deviceId: string; tapBaselineMs?: number;    // per-session device calibration (Ter, §2.4)
  minutesIntoSession: number; assisted?: boolean; gaming?: boolean;
}
export interface ReliabilityCard {              // CD9: required before any display or prompt use
  metric: CogMetricId; ageBand: '6-9' | '10-12' | '13-15'; deviceClass: string;
  rho: number; sem: number; n: number; method: 'test-retest' | 'split-half' | 'hierarchical';
  measuredAt: string; studyId: string;          // e.g., 'S1'
}
export interface CogEstimate {
  metric: CogMetricId; childId: string; climate: { mean: number; sd: number };   // §2.7 smoothed
  weather?: { mean: number; sd: number; sessionId: string };                     // today only
  practiceAdjusted: boolean; nBlocks: number; card: ReliabilityCard | null;      // null ⇒ research-only
}
```

**Invariants (eval-gated; "if your change trips them, your change is wrong"):**
- (i) no `CogEstimate` is readable by the mastery ledger;
- (ii) parent text containing a cognitive metric requires `card.rho ≥ 0.7` and passes the banned-vocabulary predicate;
- (iii) no cognitive comparison across children in any parent or child surface;
- (iv) flags exist only for `read.*` and `num.*` metrics and require a reviewer id;
- (v) nothing from this layer enters the tutor's persona or prompt context except the knob values (chunk length, wait time, break timing).

**Proposed context entries** (for the main loop to merge; this workstream writes only here):
- decisions CD1-CD10 with their reversal conditions
- rejection candidates:
  - "ANS dot-comparison as child indicator" (Gilmore 2013; Inglis & Gilmore 2014)
  - "interference RT difference scores for individual claims" (Hedge 2018; Rouder & Haaf 2019)
  - "EF/brain-training module" (Kassai 2019; Melby-Lervåg 2016)
  - "ADHD flag" (Arrondo 2024; Kofler 2013; Morrow 2012)

---

## 11. Open questions

1. What is the real device-latency distribution on target low-end Android phones, and does drift rate v actually absorb it (§2.4)? This is measurable cheaply: a robot-tap rig or high-speed video [U].
2. Which Hindi number-word and akshara-complexity effects are script and language properties, and which are instruction effects? This needs S8 with Hindi- vs English-medium contrasts.
3. Can relational-complexity tagging of NCERT items be done reliably by content authors (inter-rater κ)? This is a prerequisite for the LLTM in §5.2.
4. What is the minimum game time per month that sustains ρ ≥ .7 for WM span without stealing learning time? Set the measurement budget the way learning-science §7.2 sets the probe budget.
5. How should the research opt-in be presented so families do not feel that declining degrades the teaching? Declining must not change the teaching, and this is checked in evals.
6. Who are the qualified human reviewers for §7.3 in India, and what is their turnaround time? The flag pathway must not ship without them.

---

## 12. References

Tags as in the header. "EPMC" = abstract read via Europe PMC this session.

**Executive functions, structure, development**
- Diamond, A. (2013). Executive functions. *Annu Rev Psychol* 64:135-168. doi:10.1146/annurev-psych-113011-143750 [S]
- Best, J. R., & Miller, P. H. (2010). A developmental perspective on executive function. *Child Dev* 81:1641. doi:10.1111/j.1467-8624.2010.01499.x [V, EPMC]
- Davidson, M. C., Amso, D., Anderson, L. C., & Diamond, A. (2006). Development of cognitive control and executive functions from 4 to 13 years. *Neuropsychologia*. doi:10.1016/j.neuropsychologia.2006.02.006 [V, EPMC]
- Gathercole, S. E., Pickering, S. J., Ambridge, B., & Wearing, H. (2004). The structure of working memory from 4 to 15 years of age. *Dev Psychol* 40:177. doi:10.1037/0012-1649.40.2.177 [V, EPMC]
- Luna, B., Garver, K. E., Urban, T. A., Lazar, N. A., & Sweeney, J. A. (2004). Maturation of cognitive processes from late childhood to adulthood. *Child Dev*. doi:10.1111/j.1467-8624.2004.00745.x [V, EPMC]
- Karr, J. E., et al. (2018). The unity and diversity of executive functions: systematic review and re-analysis of latent variable studies. *Psychol Bull* 144:1147. [S]
- Karr, J. E., Rodriguez, J. E., Goh, P. K., Martel, M. M., & Rast, P. (2022). The unity and diversity of executive functions: a network approach to life span development. *Dev Psychol*. doi:10.1037/dev0001313 [V, EPMC]
- Younger, J. W., et al. (2023). Better together: novel methods for measuring and modeling development of executive function diversity while accounting for unity. *Front Hum Neurosci*. doi:10.3389/fnhum.2023.1195013 [V, full text]
- O'Laughlin, K. D., et al. (2025). Validation of an adaptive assessment of executive functions (ACE-X). *J Med Internet Res*. doi:10.2196/60041 [V, EPMC]
- Starr, A., Leib, E. R., Younger, J. W., et al. (2023). Relational thinking: an overlooked component of executive functioning. *Dev Sci*. doi:10.1111/desc.13320 [V, EPMC]
- Spiegel, J. A., Goodrich, J. M., Morris, B. M., Osborne, C. M., & Lonigan, C. J. (2021). Relations between executive functions and academic outcomes in elementary school children: a meta-analysis. *Psychol Bull*. doi:10.1037/bul0000322 [V, EPMC]
- Jacob, R., & Parkinson, J. (2015). The potential for school-based interventions that target executive function to improve academic achievement. *Rev Educ Res* 85:512-552. [S]
- Moffitt, T. E., et al. (2011). A gradient of childhood self-control predicts health, wealth, and public safety. *PNAS*. doi:10.1073/pnas.1010076108 [V, EPMC]
- Kassai, R., Futo, J., Demetrovics, Z., & Takacs, Z. K. (2019). A meta-analysis of the experimental evidence on the near- and far-transfer effects among children's executive function skills. *Psychol Bull* 145:165. doi:10.1037/bul0000180 [V, EPMC]
- Melby-Lervåg, M., Redick, T. S., & Hulme, C. (2016). Working memory training does not improve performance on measures of intelligence or other measures of "far transfer". *Perspect Psychol Sci*. doi:10.1177/1745691616635612 [V, EPMC]
- Howard, S. J., et al. (2020). Challenging socioeconomic status: a cross-cultural comparison of early executive function. *Dev Sci*. doi:10.1111/desc.12854 [V, EPMC]

**Measurement, reliability, models**
- Hedge, C., Powell, G., & Sumner, P. (2018). The reliability paradox. *Behav Res Methods* 50:1166. https://link.springer.com/article/10.3758/s13428-017-0935-1 [V, abstract]
- Rouder, J. N., & Haaf, J. M. (2019). A psychometrics of individual differences in experimental tasks. *Psychon Bull Rev*. doi:10.3758/s13423-018-1558-y [V, EPMC]
- Enkavi, A. Z., et al. (2019). Large-scale analysis of test-retest reliabilities of self-regulation measures. *PNAS*. doi:10.1073/pnas.1818430116 [V, EPMC]
- Taylor, B. K., et al. (2022). Reliability of the NIH toolbox cognitive battery in children and adolescents: a 3-year longitudinal examination. *Psychol Med*. doi:10.1017/s0033291720003487 (PMC8589010) [V, full text]
- Pedersen, M. K., et al. (2023). Measuring cognitive abilities in the wild: validating a population-scale game-based cognitive assessment. *Cogn Sci* 47:e13308. https://arxiv.org/abs/2009.05274 [V, full text, Table 3]
- Johann, V. E., & Karbach, J. (2018). Validation of new online game-based executive function tasks for children. *J Exp Child Psychol*. doi:10.1016/j.jecp.2018.07.009 [V, EPMC]
- Lumsden, J., Edwards, E. A., Lawrence, N. S., Coyle, D., & Munafò, M. R. (2016). Gamification of cognitive assessment and cognitive training: a systematic review. *JMIR Serious Games* 4(2):e11. [S]
- Wagenmakers, E.-J., van der Maas, H. L. J., & Grasman, R. P. P. P. (2007). An EZ-diffusion model for response time and accuracy. *Psychon Bull Rev*. doi:10.3758/bf03194023 [V, EPMC; equations from memory, U, check against the paper before coding]
- Ratcliff, R., Love, J., Thompson, C. A., & Opfer, J. E. (2012). Children are not like older adults: a diffusion model analysis of developmental changes in speeded responses. *Child Dev*. doi:10.1111/j.1467-8624.2011.01683.x [V, EPMC]
- Kail, R. V., & Ferrer, E. (2007). Processing speed in childhood and adolescence: longitudinal models. *Child Dev*. doi:10.1111/j.1467-8624.2007.01088.x [V, EPMC]; Kail, R. (1991). Developmental change in speed of processing. *Psychol Bull* [S]
- van der Linden, W. J. (2007). A hierarchical framework for modeling speed and accuracy on test items. *Psychometrika* [U]
- Parsons, S., Kruijt, A.-W., & Fox, E. (2019). Psychological science needs a standard practice of reporting the reliability of cognitive-behavioral measurements. *AMPPS*. [S]
- Galeano Weber, E. M., Dirk, J., & Schmiedek, F. (2018). Variability in the precision of children's spatial working memory. *J Intell*. doi:10.3390/jintelligence6010008 [V, EPMC]
- Blume, F., Irmer, A., Dirk, J., & Schmiedek, F. (2022). Day-to-day variation in students' academic success. *Dev Sci*. doi:10.1111/desc.13301 [V, EPMC]
- Neubauer, A. B., et al. (2021). Reciprocal relations of subjective sleep quality and affective well-being in late childhood. *Dev Psychol*. doi:10.1037/dev0001209 [V, EPMC]
- Astill, R. G., et al. (2012). Sleep, cognition, and behavioral problems in school-age children: a century of research meta-analyzed. *Psychol Bull*. doi:10.1037/a0028204 [V, EPMC]
- Ritchie, S. J., & Tucker-Drob, E. M. (2018). How much does education improve intelligence? A meta-analysis. *Psychol Sci*. doi:10.1177/0956797618774253 [V, EPMC]

**Attention, ADHD, base rates**
- Rueda, M. R., et al. (2004). Development of attentional networks in childhood. *Neuropsychologia*. doi:10.1016/j.neuropsychologia.2003.12.012 [V, EPMC]
- Fortenbaugh, F. C., et al. (2015). Sustained attention across the life span in a sample of 10,000. *Psychol Sci*. doi:10.1177/0956797615594896 [V, EPMC]
- Arrondo, G., et al. (2024). Systematic review and meta-analysis: clinical utility of continuous performance tests for the identification of ADHD. *JAACAP* 63:154-171. doi:10.1016/j.jaac.2023.03.011 [V, EPMC]
- Kofler, M. J., et al. (2013). Reaction time variability in ADHD: a meta-analytic review of 319 studies. *Clin Psychol Rev* 33:795. doi:10.1016/j.cpr.2013.06.001 [V, EPMC]
- Morrow, R. L., et al. (2012). Influence of relative age on diagnosis and treatment of ADHD in children. *CMAJ*. doi:10.1503/cmaj.111619 [V, EPMC]
- Polanczyk, G., et al. (2007). The worldwide prevalence of ADHD. *Am J Psychiatry*. doi:10.1176/ajp.2007.164.6.942 [V, EPMC]
- DSM-5 SLD criterion A and the APA clarification (2025): https://codereadnetwork.org/advocacy/apa-clarifies-dsm-5-diagnosis-for-slds/ [S]

**Language and bilingualism**
- Lehtonen, M., et al. (2018). Is bilingualism associated with enhanced executive functioning in adults? *Psychol Bull*. doi:10.1037/bul0000142 [V, EPMC]
- Dick, A. S., et al. (2019). No evidence for a bilingual executive function advantage in the ABCD study. *Nat Hum Behav*. doi:10.1038/s41562-019-0609-3 [V, EPMC]
- Paap, K. R., & Greenberg, Z. I. (2013). There is no coherent evidence for a bilingual advantage in executive processing. *Cogn Psychol*. doi:10.1016/j.cogpsych.2012.12.002 [V, EPMC]
- Bialystok, E., Luk, G., Peets, K. F., & Yang, S. (2010). Receptive vocabulary differences in monolingual and bilingual children. *Biling Lang Cogn*. doi:10.1017/s1366728909990423 [V, EPMC]
- Kievit, R. A., Hofman, A. D., & Nation, K. (2019). Mutualistic coupling between vocabulary and reasoning in young children. *Psychol Sci*. doi:10.1177/0956797619841265 [V, EPMC]
- Nakamura, P., et al. (2023). Language of instruction in schools in low- and middle-income countries: a systematic review. *Campbell Syst Rev*. [S]

**Reasoning**
- Halford, G. S., Wilson, W. H., & Phillips, S. (1998). Processing capacity defined by relational complexity. *Behav Brain Sci*. doi:10.1017/s0140525x98001769 [V, EPMC]
- Richland, L. E., Morrison, R. G., & Holyoak, K. J. (2006). Children's development of analogical reasoning: insights from scene analogy problems. *J Exp Child Psychol* 94:249-273. [S]
- Shayer, M., Ginsburg, D., & Coe, R. (2007). Thirty years on: a large anti-Flynn effect? The Piagetian test Volume & Heaviness norms 1975-2003. *Br J Educ Psychol*. [S]
- Siegler, R. S. (1996). *Emerging Minds* (overlapping waves; microgenetic method). [U]

**Numeracy**
- Halberda, J., Ly, R., Wilmer, J. B., Naiman, D. Q., & Germine, L. (2012). Number sense across the lifespan as revealed by a massive Internet-based sample. *PNAS* 109:11116. [V, EPMC abstract]
- Schneider, M., et al. (2017). Associations of non-symbolic and symbolic numerical magnitude processing with mathematical competence: a meta-analysis. *Dev Sci*. doi:10.1111/desc.12372 [V, EPMC]
- Schneider, M., et al. (2018). Associations of number line estimation with mathematical competence: a meta-analysis. *Child Dev* 89:1467. doi:10.1111/cdev.13068 [V, EPMC]
- Booth, J. L., & Siegler, R. S. (2006). Developmental and individual differences in pure numerical estimation. *Dev Psychol*. [V, EPMC]
- Barth, H. C., & Paladino, A. M. (2011). The development of numerical estimation: evidence against a representational shift. *Dev Sci*. doi:10.1111/j.1467-7687.2010.00962.x [V, EPMC]
- Siegler, R. S., & Ramani, G. B. (2008). Playing linear numerical board games promotes low-income children's numerical development. *Dev Sci* 11:655. [S]
- Siegler, R. S., et al. (2012). Early predictors of high school mathematics achievement. *Psychol Sci*. doi:10.1177/0956797612440101 [V, EPMC]
- Inglis, M., & Gilmore, C. (2014). Indexing the approximate number system. *Acta Psychol*. doi:10.1016/j.actpsy.2013.11.009 [V, EPMC]
- Gilmore, C., et al. (2013). Individual differences in inhibitory control, not non-verbal number acuity, correlate with mathematics achievement. *PLoS One*. doi:10.1371/journal.pone.0067374 [V, EPMC]
- Banerjee, A. V., Bhattacharjee, S., Chattopadhyay, R., Duflo, E., et al. (2025). Children's arithmetic skills do not transfer between applied and academic mathematics. *Nature*. doi:10.1038/s41586-024-08502-w [V, EPMC abstract]
- Butterworth, B., Varma, S., & Laurillard, D. (2011). Dyscalculia: from brain to education. *Science*. doi:10.1126/science.1201536 [V, EPMC]

**Reading and learning disorders**
- Melby-Lervåg, M., Lyster, S. A., & Hulme, C. (2012). Phonological skills and their role in learning to read: a meta-analytic review. *Psychol Bull*. doi:10.1037/a0026744 [V, EPMC]
- McWeeny, S., et al. (2021). Rapid automatized naming as a kindergarten predictor of future reading: a systematic review and meta-analysis. PsyArXiv. [S]
- Peterson, R. L., & Pennington, B. F. (2015). Developmental dyslexia. *Annu Rev Clin Psychol*. doi:10.1146/annurev-clinpsy-032814-112842 [V, EPMC]
- Usha, M. N. K., et al. (2020). Kannada akshara knowledge in primary school children. *F1000Research* 9:978. doi:10.12688/f1000research.23653.1 [V, EPMC]
- Nag, S., & Snowling, M. J. (2012). Reading in an alphasyllabary: implications for a language universal theory of learning to read. *Sci Stud Read* 16(5). [S]
- Nag, S. (2007). Early reading in Kannada: the pace of acquisition of orthographic knowledge and phonemic awareness. *J Res Read* 30:7-22. [S]
- Rao, C., et al. (2021). Development and standardization of the DALI-DAB (Dyslexia Assessment for Languages of India). *Ann Dyslexia*. [S, via EPMC summary]
- Scaria, L. M., Bhaskaran, D., & George, B. (2023). Prevalence of specific learning disorders among children in India: systematic review and meta-analysis. *Indian J Psychol Med*. doi:10.1177/02537176221100128 [V, EPMC]
- Yang, L., et al. (2022). Prevalence of developmental dyslexia in primary school children: a systematic review and meta-analysis. *Brain Sci*. doi:10.3390/brainsci12020240 [V, EPMC]
- India ORF benchmarks and the NCERT Foundational Learning Study figures: https://www.centralsquarefoundation.org/articles/fluency-and-its-role-in-foundational-literacy [S]

---

## Methodologist review

**Reviewer stance:** an adversarial developmental psychologist and psychometrician. **Date:** 2026-10-02.

**Method.**
- Re-pulled 30 primary abstracts from the Europe PMC REST API this session: Taylor 2022, Rouder & Haaf 2019, Rouder, Kumar & Haaf 2023, Enkavi 2019, Arrondo 2024, Kofler 2013, Brod 2020, Kievit 2019, Lehtonen 2018, Lowe 2021, Gunnerud 2020, Scaria 2023, Howard 2020, Ratcliff 2012, Karr 2018, Karr 2022, Lee, Bull & Ho 2013, Younger 2023, Dick 2019, Galeano Weber 2018, Spiegel 2021, Johann & Karbach 2018, Banerjee 2025, Schneider 2018, Melby-Lervåg 2012, Rueda 2004, Morrow 2012, Astill 2012, Davidson 2006, Gathercole 2004, Luna 2004, Kail & Ferrer 2007, Usha 2020, Pedersen 2023 and Bhavnani 2025.
- Ran one small simulation of EZ-diffusion robustness: 20,000 simulated diffusion trials with child-like parameters v = .20, a = .14, Ter = .45 s. The script is `scratchpad/ezsim.py`. It is not committed.
- Web search was not available (session budget exhausted). Items I could not check are tagged [U].

**Overall verdict.** The document is better than most of the literature it summarises. It already bans the worst ideas: IQ, ADHD flags, brain training, bilingual-advantage claims, cross-child ranking. Most citations are read correctly. Its remaining problems are of three kinds:
- (a) a few **misapplied citations**, where adult evidence is used for children or a sample is described wrongly;
- (b) **psychometric gaps that matter most exactly where the document feels safest**: "own-trend only" change statements, shrinkage, and separating practice from development;
- (c) **parent-facing example sentences that break the document's own contract**.

None of these needs a redesign. Several need a rule change before the spec workstream copies the examples.

### R1. Citation checks

| claim in doc | what the source actually says | verdict |
|---|---|---|
| NIH-TB ICC "0.32-0.77"; quoted *"None of the tests met criteria for clinical use"* (Taylor 2022) | The abstract gives ICC **0.31-0.76** for the full sample, with marked **site differences**. Its wording is "none of the tests exhibited adequate reliability for use in clinical applications". | Substance is right. The quotation marks are wrong (it is a paraphrase), and the range is off by .01. Add the site-difference finding: it is directly relevant to Taxila's device and home heterogeneity. |
| Rouder & Haaf 2019: hierarchical models "recover reliability"; CD2 reversal says "estimated hierarchically" | The 2019 abstract says hierarchical models "rescue classical concepts" of reliability and correlation. **The follow-up (Rouder, Kumar & Haaf 2023, PBR [V])** found trial noise in 24 tasks was **~8x true individual variability**, and that hierarchical models "also perform poorly in localizing correlations. The advantage of these models is not in estimation efficiency, but in providing a sense of uncertainty." | **Misleading as written.** Hierarchical models correct the attenuation *bias*. They do not create *information*. Fix §2.3 and CD2: a hierarchical model tells you honestly that you cannot know a child's interference effect. It does not let you know it. The doc's own [U] illustration (γ = .125) can now be tagged [V]: 1/8 is Rouder 2023's empirical ratio. |
| Enkavi 2019: model parameters "as stable as raw DVs", given as a reason to prefer them (§2.3 b) | The abstract says "certain model parameters are as stable as raw DVs", and raw task DVs are the unreliable ones. | **Misread direction.** "As stable as an unreliable DV" is not a reason to use model parameters for reliability. Their case rests on *interpretability* (separating caution from quality), not reliability. Reword §2.3(b). |
| Bilingual EF advantage absent: Lehtonen 2018, Paap & Greenberg 2013 | **Both are adult samples.** Lehtonen's title is "...in adults?" (152 studies on adults). | **Wrong population for a child product.** Replace with child meta-analyses. **Lowe et al. 2021, *Psych Sci*** [V]: ages 3-17, 1,194 effect sizes, g = .08, which became −.04 after bias correction. **Gunnerud et al. 2020, *Psych Bull*** [V]: ≤ 18 years, g = .06, small-study effects. Note that Gunnerud found a **switching advantage that survived bias correction**, plus large unexplained heterogeneity. "No advantage" is right for overall EF. It is slightly overstated for switching. CD7's *decision* stands, because Taxila makes no advantage claims either way. Dick 2019 (children aged 9-10, n = 4,524) is correctly cited. |
| Bialystok 2010 supports "vocabulary in either language alone under-states their lexicon" and conceptual scoring | Bialystok measured **English receptive vocabulary only**. It shows the deficit is concentrated in home-context words. It does not test conceptual (cross-language) scoring. | **Over-attributed.** The conceptual-vocabulary rationale comes from the Pearson, Fernández & Oller (1993) tradition [U: not re-verified]. Cite that, or mark the claim [U]. |
| EF differentiates "around age 10" (CD3, §1.4); Younger 2023 shows a "3-community structure" of WM/inhibition/flexibility | Younger 2023 [V]: **N = 1,286, ages 8-14**, three components "by age 10", "refinement continues through at least age 14". The components are **WM, context monitoring and interference resolution**, not Diamond's WM/inhibition/flexibility. **Lee, Bull & Ho 2013 (*Child Dev*, N = 688, ages 6-15, cohort-sequential, Singapore) [V]: a two-factor structure from 5-13, and a separated three-factor structure only at 15.** Karr 2018 [V]: individual school-age CFAs most often *accepted* three factors, but the bootstrap re-analysis *selected* unidimensional models for children and adolescents, with low acceptance rates overall (publication bias). | **Developmental claim stated too precisely.** The age of differentiation is method-dependent, ranging from ~10 (ACE network models) to ~15 (Lee 2013 CFA). ACE has **no data below age 8**, so it cannot support anything about 6-7. Apparent unity in children is partly a *measurement artefact*: unreliable child tasks correlate weakly with everything, and that flattens factor structure. Fix: "components are research-only at every age until S2". The CD3 cut at 10 should become a hypothesis, not a reporting rule. Lee 2013 must be cited. It is the only one of these studies that spans Taxila's exact age range. |
| Brod 2020: "only 9-12-year-olds with higher inhibitory control learned from wrong predictions" | [V]: **n = 51**, ages 9-12, Experiment 2. The title says "executive function skills"; the abstract says inhibitory control. | The reading is right, but the evidence is thin. A single n = 51 moderation finding is fragile. State the n. S4 is correctly framed as a replication, not as established mechanism. |
| Arrondo 2024; Kofler 2013; Morrow 2012; Scaria 2023; Polanczyk 2007 | All [V] and correctly reported: sens .75 / spec .71; g = .76 vs typically developing, .25 vs clinical controls; RR 1.30 boys and 1.70 girls; 8% (95% CI 4-11), 6 studies, n = 8,133. | Correct. Two caveats should be stated. First, Scaria's six studies all used **Indian screening instruments** (NIMHANS SLD index, GLAD), and the 95% CI is 4-11%, so PPV must be computed across that range, not at one point. Second, using **ADHD CPT accuracy as a stand-in for an SLD flag** (§7.3) is an *analogy*, not evidence about reading or maths screeners. Label it as such. |
| Usha 2020 = "strong developmental signal" (matrix §8.1) | [V]: **cross-sectional**, 45 children per grade, one Kannada-medium sample, 67 akshara. The "plateau" is defined by a non-significant post-hoc Bonferroni contrast. | **Overclaimed.** It is a useful descriptive anchor and weak developmental evidence. Kannada's orthography is larger and denser in conjuncts than Hindi's, so the timetable does not transfer [U]. Downgrade the matrix cell to "descriptive anchor, other script; S8 needed". |
| Banerjee 2025 | [V]: correct (n = 1,436 working children, 471 schoolchildren, 1% vs > ⅓). | The numbers are correct. Two inferential limits should be stated. (a) It is a **between-population** contrast: working and non-working children differ in selection, schooling and age. (b) It shows lack of transfer. It does not show a child-level "context gap" trait. S5 is the right way to test that. |
| Ratcliff 2012; Davidson 2006; Gathercole 2004; Luna 2004; Kail & Ferrer 2007; Rueda 2004; Galeano Weber 2018; Spiegel 2021; Karr 2022; Howard 2020; Kievit 2019; Schneider 2018; Melby-Lervåg 2012; Astill 2012; Johann & Karbach 2018; Pedersen 2023 | All checked [V] and read correctly. | One nuance. Rueda's "conflict stable after 7" is a *flanker RT difference score*, exactly the unreliable kind the doc rejects. It must not be read as "interference control matures at 7". NIH-TB Flanker scores keep improving through adolescence [U]. |
| S1 "First validated game-based EF battery for Indian children in Hindi and English" | **DEEP** (Bhavnani et al. 2025, *PLOS Digit Health*) [V] is a gamified, IRT-scored, longitudinally validated cognitive assessment of Hindi-speaking children in rural Haryana at 39, 60 and 95 months (n = 1,359 → 600), with r = .37 with Raven's CPM and r = .32 predicting school outcomes at 8. | **"First" is unsafe.** Cite DEEP and narrow the claim: *first in-the-wild, embedded, 6-15, Hindi/English EF measures with in-deployment reliability*. Any "first" needs a systematic search before submission. |

### R2. Psychometric problems (ranked by consequence)

**P1. "Own-trend only" is the ethically safest framing and the psychometrically weakest one.** Difference scores inherit the reliability paradox at the individual level:

```
ρ_D = (ρ_xx − r_12) / (1 − r_12)      reliability of a child's change score (equal variances)
ρ_xx = .70, r_12 = .60  →  ρ_D = .25      (a trait that is stable month to month makes change nearly unmeasurable)
RCI threshold at ρ = .70:  |Δ| > 1.96·√2·√(1−.70)·SD = 1.52 SD
```

Developmental change in WM or speed over 3 months is perhaps 0.1 SD [U: back-calculated from roughly linear growth across 6-15]. So **individual "development" will almost never pass CD10 in a 3-month window.** Anything that does pass is mostly practice or state. Consequences:
- (a) The §2.6 growth rule (β1 + u1_i > 0 over ≥ 3 months) should be **≥ 12 months for cognitive-process metrics**. Development claims belong to *group* papers, not to individual parent reports.
- (b) Within-child change statements on cognitive-process metrics (span, drift) should be **suppressed** by default. Change statements are allowed on *learning* metrics (fluency per skill, number-line PAE, akshara θ), where change is large and is the point.
- (c) The `card.rho ≥ .7` gate in invariant (ii) gates *level*. **Add a separate gate for change**: an RCI pass computed with the reliability of the *change score*, at matched information (see P2).

**P2. Shrinkage manufactures spurious own-trend change.** Every child-level model in the doc uses partial pooling. Examples: κ_i ~ N(μ_age, σ²), ζ_i ~ N(0, σ²) with an age covariate, and the Kalman filter. Early in a child's history the posterior sits near the age mean. As data accrue it moves toward the child's true value. For a child truly 1 SD below the mean, with shrinkage weight w = n/(n + σ²_e/σ²_θ) moving from .3 to .8, the estimate moves from −0.3 to −0.8 SD. That is **a 0.5 SD "decline" that never happened.** A child above the mean shows a fake "improvement".

Two further consequences:
- An age-centred prior **is a normative comparison** smuggled in under CD4. The child's estimate is literally "deviation from same-age children".
- Rules:
  - (i) Compute change statements only between windows of **matched information**, or from the likelihood (unpooled) contrast.
  - (ii) Never display the trajectory of a pooled posterior mean as development.
  - (iii) Document in each reliability card what the prior pools over (age band, language, device class). That pooling group defines a norm group, with all of CD4's caveats.

**P3. Practice and development are not separately identifiable within a child.** In §2.6, `age_it` and `log(1 + n_it)` both rise monotonically over a child's months. Within one child they are nearly collinear. Separation comes only from (a) between-child variation in age at entry, which reintroduces SES and device confounds, and (b) variation in exposure density, which is endogenous: engaged children play more and also differ in other ways. The log-practice form is also an assumption. Retest gains partly reset after gaps, and they differ by form.

**Fix:**
- an **accelerated (cohort-sequential) design** for development
- **planned measurement bursts** with fresh alternate forms at fixed calendar intervals, and exposure held constant across children at each burst
- practice estimated from **within-burst** trials

Also, the Kalman filter in §2.7 has no practice term, so its "climate" absorbs practice gains. Merge §2.6 into the observation equation (y_t = η_t + γ·log(1 + n_t) + s_t + e_t), or the parent-facing climate is a practice curve.

**P4. Reliability measured in the wrong conditions.** S1 runs in a *supervised session* with a 2-week retest. Taylor 2022 found reliability **lower than shorter-interval work and different between sites**. Supervised short-interval ICCs will overstate home, month-scale reliability. Reliability cards used for gating must come from **in-deployment** data: split-half across home sessions, or hierarchical trial-level reliability (Rouder-Haaf) per age band × device class × language. The interval must match the interval of the claim being made. S1's supervised data are for *validity* against standard tasks.

**P5. EZ-diffusion is not "device-robust" in practice; it is lapse-fragile.** The simulation (20k diffusion trials, v = .20, a = .14, Ter = .45, accuracy 95%):

| condition | v | a | Ter |
|---|---|---|---|
| clean | .203 | .146 | .447 |
| touch latency +80 ms, jitter SD 30 ms | .202 | .146 | .524 |
| audio latency +200 ms, jitter SD 100 ms | .194 (−4%) | .152 | .618 |
| 5% fast guesses | .183 (−10%) | .139 | .432 |
| **3% slow lapses (2-5 s)** | **.133 (−34%)** | **.221 (+51%)** | **.102** |
| sampling noise, 30-trial block | CV 18% | | |

So the doc's claim holds for **touch** latency, which mostly lands in Ter as stated. It weakens for **audio-onset** stimuli. It **fails badly for lapses**. Children at home lapse often, and lapse rates differ by household and device, so lapses reintroduce exactly the confounds v was meant to escape. EZ assumes no contaminant RTs. **Fix:**
- trim (e.g., RT < 200 ms or > the child's 99th percentile or > 2.5 s), or better, fit a **hierarchical diffusion model with a contaminant mixture** (HDDM-style)
- report lapse rate as a separate weather variable
- avoid EZ when accuracy > ~97%, where the edge correction dominates the estimate
- treat "v absorbs device latency" as a hypothesis for Open Question 1, now partly supported for touch only

The EZ equations as written match Wagenmakers et al. 2007 to my knowledge [U], and the doc already says to check them before coding.

**P6. Staircase threshold vs model parameter.** §3.1 defines span as the 50% point, (κ_i − δ)/λ. The 2-up/1-down staircase converges near **70.7%**, i.e. load = (κ_i − δ − 0.88)/λ. Report one quantity consistently. Span loads are small integers (2-9), so a 3-minute block gives few reversals and a coarse threshold. Estimate κ_i from all trials with the IRT model, not from reversal averages.

**P7. Adaptive item selection hides decline in accuracy.** Lessons that hold accuracy at ~70% by design (ACE-style) flatten the accuracy-over-minutes slope. The §3.5 vigilance model includes item difficulty, which is good. The decrement must then be read off the **difficulty-adjusted** (IRT) scale, not raw accuracy. Session length is also **informative censoring**: tired children stop early. Model drop-off jointly, or restrict to fixed-length blocks.

**P8. The vocabulary model's general factor is not conceptual vocabulary.** In a bifactor model, θ^gen is the *shared* variance across languages. A child who knows many concepts *only in Hindi* gets a high θ^Hindi and a modest θ^gen. Conceptual vocabulary is a **disjunctive** construct (known in Hindi *or* English). Use a concept-level model:

```
P(knows concept c) = σ(θ_i^concept − b_c)
P(correct on item (c, L) | knows c) = σ(θ_i^L − b_cL)        (label access in language L)
P(correct | not known) = g_item                               (4-AFC picture choice: g ≈ .25; add 3PL guessing)
```

Translation-equivalent pairs link the scales. Report concepts known and labels per language. Do not report θ^gen.

**P9. LLTM fit.** A pure LLTM assumes features explain item difficulty completely. They rarely do, and misfit biases η_k. Use an LLTM with a **random item residual** (b_j = Σ q_jk η_k + ε_j, the "LLTM+ε"/explanatory IRT of De Boeck & Wilson 2004 [U]). Child-specific feature slopes ν_ik need many items per feature per child. Gate them by reliability like everything else.

**P10. PPV framing for a multi-stage pathway.** The single-test PPV arithmetic in §7.3 is correct. The *pathway* is sequential, though, and its stages are correlated: they share the same instructional context and the same ASR. The true PPV is therefore not the product of independent likelihood ratios, and is unknown until S9. Also:
- At n = 50 evaluations, the 95% CI on a PPV of .40 is about ±.14. The kill criterion needs an interval rule, e.g. "upper 95% bound < .5".
- PPV depends on the reference standard. Indian instruments (NIMHANS index, DALI) carry their own error. Report verification bias.

### R3. Developmental inaccuracies and gaps

1. **EF differentiation timing.** See R1 (Lee 2013 vs Younger 2023). State it as a range of ~10-15 that depends on method.
2. **"A 6-year-old reliably holds about one instruction step with one condition"** [U] is an invented, product-relevant norm. Typical forward spans at 6 are several items [U], and classroom instruction-following studies show multi-step recall in 7-9-year-olds (the Gathercole "following instructions" line [U]). Delete it, or make it the S3 hypothesis. Do not let it set chunk length by default for all 6-year-olds.
3. **Number line ceilings.** 0-100 estimates become near-linear in early primary school in US samples, and 0-1,000 later (Siegler & Booth/Opfer [U]). So 0-100 PAE goes to ceiling for most Class 3+ children. Plan scale progression: 0-100 → 0-1,000 → fractions 0-1 → 0-5 improper fractions. Expect Indian timetables to differ with instruction (ASER).
4. **Akshara timetable** taken from Kannada: see R1. The Hindi orthography's size and conjunct density differ [U].
5. **Adolescent sleep phase.** Parent statements such as "mornings were stronger than late evenings" ignore the pubertal shift toward eveningness from ~12-13 [U: Carskadon/Crowley line]. They are also confounded by who uses the phone when, weekday vs weekend, and lesson content. Time-of-day effects are between-session comparisons with selection. Report them only from within-child, content-matched, randomised scheduling (S6). Until then, do not report them to parents.
6. **Spatial reasoning is missing.** Mental rotation and spatial visualisation are malleable and predict STEM outcomes (the Uttal 2013 training meta-analysis line [U]), and they are game-native. They belong with the domain-cognitive flagships (CD5) as a candidate construct for S-series validation.
7. **Processing speed "adult-like ~15"** comes from Luna's oculomotor latency. Psychometric speed tasks keep improving into the late teens or early 20s (Kail's curves [U]). Say "task-dependent".

### R4. Ethically risky inferences and contract violations in the doc's own examples

The parent-facing *Shape* examples will be copied into templates, so they must pass the doc's own contract (§8.2). Several fail:

| section | example text | problem | fix |
|---|---|---|---|
| §6.2 | "she now knows 3/4 is bigger than 2/3, **which most children find hard**" | A **comparison with other children**. This breaks CD4 and contract rule 2. It is also a claim from a single item. | Drop the comparison. Base the statement on a calibrated set of fraction comparisons, not one pair. |
| §3.1 | "now remembers about **[k] positions**... which **helps her finish problems on her own**" | (a) A **raw span number** works as a normed score. Parents can look up digit-span norms online, and siblings will be compared. (b) "Helps her finish on her own" asserts the effect that **S3 has not yet tested**. | Give the teaching adjustment only ("we're giving instructions in shorter chunks in the lamp game and in lessons"). No span number. No efficacy claim until S3. |
| §3.4 | "Fluency like this **frees attention** for harder problems" | The doc itself tags this mechanism [U] in §6.1. | Remove it, or phrase it as Taxila's teaching rationale ("we practise this so that...") rather than as fact about the child's mind. |
| §3.5 | "**after that, accuracy dips**"; "mornings were stronger" | Weather presented as a stable pattern without the confound handling in R3.5. | Allowed only with a within-child, content-matched estimate and its n. |
| §7.3 | the flag message must say "does not mean she has a **learning disorder**" | It contains a word from the banned list in §8.2. The predicate will block it, or someone will add an exemption ad hoc. | Make an explicit, reviewer-signed exemption channel for flag messages. Better, rephrase without the term ("this is not a diagnosis"). |
| §8.2 rule 5 | a banned-word list as the safety predicate | LLM-written text paraphrases freely ("finds it hard to sit still", "struggles to focus", "a bit slow with numbers"). A word list catches almost none of this. | Template-constrained generation, with slot values from the CognitiveLayer. Add a **semantic** classifier predicate (trait-attribution / deficit-framing / cross-child comparison), audited on a labelled set, alongside the word list. |

Other ethical points:
- **Disproportion rule (§7.3 condition 3) has an equity problem.** Requiring a large gap relative to the child's *own* progress elsewhere is a discrepancy criterion. Discrepancy models were discredited in the SLD literature (the IQ-achievement discrepancy debate [U]). Dyslexia commonly co-occurs with weaker oral language (Peterson & Pennington 2015 [V]). The rule therefore systematically **under-refers children with broad difficulties**, who are disproportionately the most disadvantaged. Make it a *confidence modifier* (a "protects against flagging poor schooling" note for the reviewer), not a required condition.
- **Assent at 10+ only (§9).** Research ethics boards and journals expect age-appropriate assent from younger children too. Indian research guidance commonly expects assent from about age 7 [U: verify against the ICMR 2017 National Ethical Guidelines]. This concerns publishability and the child's dignity, not compliance theatre. Build a spoken, child-language assent for 6-9-year-olds. A child's refusal is honoured even when the parent consents.
- **Pooled priors as hidden norms.** See P2. Every child-level estimate built on an age-centred prior is a comparison with other children. CD4's "no cross-child comparison" holds only if no *display* contrasts the child with the prior mean, *and* if change claims avoid shrinkage artefacts.
- **Knob decisions from unreliable estimates.** CD1(a) lets cognitive estimates set instruction chunk length, wait time and break timing. That is a low-stakes use. But persistent mis-set knobs, such as permanently short chunks for a child mis-estimated as low-WM, are a quiet form of **lowered expectations**: the same expectancy risk §7.3 guards against after a flag. Fix: knobs default to population values; individualise only within bounded ranges; re-randomise periodically (micro-randomised, as in S3) so a wrong setting cannot become permanent.

### R5. Constructs that cannot be validly measured from these logs (confirm or extend the doc's bans)

- **Confirmed bans:**
  - individual interference and switch costs (now stronger, given Rouder 2023)
  - ANS Weber fractions
  - an ADHD or attention trait
  - general ability
  - RAN from unvalidated ASR timestamps
- **Should be added to the research-only list:**
  - **cognitive flexibility from games**, at all ages (already done)
  - **component EF profiles at any age** until S2 (R1)
  - **per-child "context-transfer gap" φ_ic** until S5 shows it is stable within a child. At present it is a population finding (R1, Banerjee)
  - **per-child time-of-day effects** (R3.5)
- **Should be removed from "estimate" status until S1 reports in-deployment reliability:** relational-reasoning random slopes ν_ik, and the number-line β (compression). β is notoriously unstable at the individual level, and the doc rightly prefers PAE [U].

### R6. Corrections required before this document feeds the spec or `context/`

1. Replace the adult bilingual meta-analyses with Lowe 2021 and Gunnerud 2020, and note Gunnerud's switching result.
2. Rewrite §2.3 and CD2 using Rouder, Kumar & Haaf 2023: hierarchical models quantify uncertainty; they do not rescue individual precision.
3. Reword §2.3(b) on Enkavi: model parameters are preferred for interpretability, not reliability.
4. Add Lee, Bull & Ho 2013. Restate the timing of EF differentiation as a method-dependent range (~10-15). ACE has no data below age 8. Make EF components research-only until S2.
5. Add a **change-score reliability gate**, distinct from the level gate. Raise the window for cognitive-process growth claims to ≥ 12 months. Default to suppressing within-child change on process metrics.
6. Add a **shrinkage-artefact rule**: change only between matched-information windows or unpooled contrasts. Document the prior pooling group on each card.
7. Put the practice term into the §2.7 state-space model, and use a burst or alternate-form design to separate practice from development.
8. Reliability cards must come from in-deployment data at the claim's interval. S1's supervised retest is used for validity.
9. EZ: add lapse and fast-guess handling, or use a hierarchical DDM with a contaminant mixture. "Device-robust" holds for touch latency only.
10. Make the staircase threshold and the 50% span point consistent (P6).
11. Replace the bifactor vocabulary model with a disjunctive concept × label model with a guessing term.
12. Use LLTM with a random item residual.
13. Fix the five parent example sentences in R4, and add a semantic deficit/comparison predicate alongside the banned-word list.
14. Make §7.3's disproportion condition a reviewer note, not a gate. Use an interval-based kill criterion for S9. Compute PPV across Scaria's CI (4-11%). Label the CPT analogy as an analogy.
15. Downgrade Usha 2020 to "descriptive, other script". Fix the Taylor quote and ICC range, and add the site-difference finding.
16. Cite DEEP (Bhavnani 2025) and drop the "first validated" claim for S1.
17. Add spatial reasoning as a candidate domain construct. Make time-of-day parent statements research-only until S6.
18. Add spoken assent for ages 6-9 in §9.

### R7. References added by this review

- Rouder, J. N., Kumar, A., & Haaf, J. M. (2023). Why many studies of individual differences with inhibition tasks may not localize correlations. *Psychon Bull Rev*. doi:10.3758/s13423-023-02293-3 [V, EPMC]
- Lee, K., Bull, R., & Ho, R. M. H. (2013). Developmental changes in executive functioning. *Child Dev*. doi:10.1111/cdev.12096 [V, EPMC]
- Lowe, C. J., Cho, I., Goldsmith, S. F., & Morton, J. B. (2021). The bilingual advantage in children's executive functioning is not related to language status: a meta-analytic review. *Psychol Sci*. doi:10.1177/0956797621993108 [V, EPMC]
- Gunnerud, H. L., ten Braak, D., Reikerås, E. K. L., Donolato, E., & Melby-Lervåg, M. (2020). Is bilingualism related to a cognitive advantage in children? *Psychol Bull*. doi:10.1037/bul0000301 [V, EPMC]
- Bhavnani, S., et al. (2025). A non-specialist worker delivered digital assessment of cognitive development (DEEP) in young children: a longitudinal validation study in rural India. *PLOS Digit Health*. doi:10.1371/journal.pdig.0000824 [V, EPMC]
- McHenry, M. S., Mukherjee, D., Bhavnani, S., et al. (2023). The current landscape and future of tablet-based cognitive assessments for children in low-resourced settings. *PLOS Digit Health*. doi:10.1371/journal.pdig.0000196 [V, EPMC]
- De Boeck, P., & Wilson, M. (2004). *Explanatory Item Response Models*. Springer. [U]
- Pearson, B. Z., Fernández, S. C., & Oller, D. K. (1993). Lexical development in bilingual infants and toddlers: comparison to monolingual norms. *Lang Learn* 43:93-120. [U]

### R8. Second pass, same day, with web access: [U] items resolved, and new findings

The first pass ran without web search. This pass re-checked its [U] items against primary sources and extended the EZ simulation. The script is now committed beside this file: `cognitive-development-reviewsim.py` (vectorised Euler diffusion, s = 0.1, dt = 1 ms, seed 7). It replaces the uncommitted `scratchpad/ezsim.py`.

**Verified this pass (upgrade from [U]):**

| item | source checked | result |
|---|---|---|
| EZ equations in §2.4 | Wagenmakers, van der Maas & Grasman 2007, PBR 14:3-22: eqs 5-9 and the appendix R code, read from the PDF | **The equations are transcribed correctly [V].** Two omissions in the doc matter. (a) MRT and VRT are computed from **correct responses only** (their note 7). The doc says "mean RT" without that qualifier. (b) The paper's edge correction is **Pc = 1 → 1 − 1/(2n)**, and EZ assumes **no contaminant RTs** (their note 1). Pc < .5 gives a negative v, so the block must be excluded rather than fitted. |
| Rouder, Kumar & Haaf 2023 "~8x" | Europe PMC abstract | Verified [V]: "trial noise in 24 extant tasks is about 8 times greater than individual variability". **Caveat:** those are adult datasets. Using γ = 1/8 for children is an extrapolation. Child trial noise is larger, and so is child between-person spread, so the direction of the bias is unknown. Keep γ = .125 as [S, adult], not [V, child]. |
| Lee, Bull & Ho 2013 | Europe PMC abstract | Verified [V]: N = 688, ages 6-15, cohort-sequential, annual testing. Two factors at 5-13; a well-separated three-factor structure at 15; "substantial task-based variation in developmental patterns". |
| ICMR assent age (R4) | ICMR 2017 *National Ethical Guidelines for Biomedical Research Involving Children* (via THSTI/ICMR copies and secondary summaries) [S] | **Oral assent is mandatory from 7 to 12 years** (from 84 months), given in the parent's presence. **Written assent is required from 13 to 18.** Failure to object is not assent. So §9's "assent at 10+" falls short of the Indian national standard, not just of best practice. Fix: spoken assent from 7, written or recorded explicit assent from 13. For 6-year-olds, a child-language "do you want to play this?" with dissent honoured. |
| Number-line ceilings (R3.3) | Siegler & Booth 2004, *Child Dev* [V]; Opfer & Siegler 2007, *Cogn Psychol* 55:169 [V] | **0-100 is mostly linear by 2nd grade (~8 y), and 0-1,000 by 4th grade**, in US samples. The scale-progression rule stands. I found no Indian timetable [U], so ASER-style data must set the Indian cut points. |
| Conceptual vocabulary (R1) | Pearson, Fernández & Oller 1993, *Lang Learn* [V] | The source is correct, but **the sample is 25 bilingual infants and toddlers aged 8-30 months**, measured by parent CDI. It is a *methodological* precedent for counting known concepts without double-counting translation pairs. It is not evidence about 6-15-year-olds. Cite it as method only. |
| Adolescent phase delay (R3.5) | Carskadon et al. (puberty and delayed phase preference); Crowley et al. 2018 review [S] | Confirmed in direction: later melatonin onset with later Tanner stage, clearest in girls. It is tied to **pubertal stage, not age**, so a fixed "12-13" cut is wrong. The variation in pubertal timing within Class 6-9 is itself a confound for any time-of-day statement. |
| Spatial skills (R3.6) | Uttal et al. 2013, *Psych Bull* 139:352, 217 studies [V] | Training g = .47, durable, with transfer to untrained spatial tasks. **Correction to R3.6:** "spatial skill predicts STEM outcomes" is *not* Uttal's finding. Uttal only argues the implication. The prediction evidence is the longitudinal Wai, Lubinski & Benbow 2009 line [S, not re-pulled]. |
| Processing speed to ~15 (R3.7) | Kail 1991, *Psych Bull* (72 studies, 1,826 RT pairs) [V, abstract] | Age differences shrink exponentially, rapidly in childhood and slowly through adolescence. That supports "task-dependent, still improving in adolescence" over "adult-like ~15". |
| Following instructions (R3.2) | Gathercole et al. 2008 [S, secondary] | Children with low WM do poorly on multi-action spoken instructions ("touch the green pencil and put it in the blue folder"). That supports making instruction length an S3 *experimental* knob. It gives **no** norm like "one step at 6". Delete the §3.1 sentence. |

**New findings from the extended EZ simulation** (child-like parameters v = .20, a = .14, Ter = .45, accuracy .947; 20,000 trials):

| condition | v | a | Ter |
|---|---|---|---|
| clean | .200 | .144 | .452 |
| 1% slow lapses (2-5 s), raw | .160 (−20%) | .180 | .296 |
| 3% slow lapses, raw | .131 (−35%) | .219 | .110 |
| 5% slow lapses, raw | .118 (−41%) | .243 | −.007 (impossible) |
| 3% slow lapses, trimmed to 0.2-2.5 s | .192 (−4%) | .150 | .429 |
| 5% slow lapses, trimmed | .186 (−7%) | .155 | .413 |
| **5% mid lapses (1-2.5 s), trimmed** | **.170 (−15%)** | **.169** | **.374** |

| block size | blocks hitting the Pc = 1 edge correction | mean v (true .200) | CV of v |
|---|---|---|---|
| 30 trials | **20%** | .211 (+5%) | .18 |
| 60 trials | 3% | .208 | .14 |

Parallel-forms r of v between two 30-trial blocks, with an **assumed** between-child SD of v [U: no child data]: **.36 when SD = .03, .59 when SD = .05.** Reaching ρ = .70 needs about **2-4 blocks** (Spearman-Brown).

Consequences:
- **N1.** Fixed trimming repairs only *extreme* lapses. A distracted child's 1-2.5 s responses survive a 2.5 s cut and still bias v by about −15%. Distraction at home is common and differs by household, so that bias is a household confound. The contaminant-mixture hierarchical DDM (P5) is **required, not optional**, for any reported v. Mid-range lapses are invisible to a fixed trim.
- **N2.** At child-like accuracy, **one 30-trial block hits the edge correction one time in five**, and the correction itself biases v upward. Minimum unit for an EZ estimate: ≥ 60 trials pooled across blocks of the same game and difficulty. Better, fit hierarchically with no edge correction.
- **N3.** The doc's "processing speed is the *most* estimable cognitive quantity" (§3.4) applies to raw choice RT (Skill Lab r_cv .60). It does **not** automatically apply to drift rate. Single-block v reliability is plausibly .35-.6. v therefore needs its own in-deployment reliability card before it replaces RT anywhere, including as a lesson knob.
- **N4.** Ter can go *negative* under lapse contamination (5% row). Add a sanity predicate: reject any fit with Ter < 0.15 s or Ter > MRT.

**Corrections added by this pass (continue R6 numbering):**

19. §2.4: state that MRT and VRT are correct-trial statistics. Use the paper's edge correction 1 − 1/(2n). Exclude blocks with Pc ≤ .5. Add a Ter sanity predicate.
20. §2.4 / §3.4: EZ v needs a mid-lapse-aware model (contaminant mixture), ≥ 60 trials per estimate, and its own reliability card. Do not assume Skill Lab's raw-RT reliability carries over to v.
21. §2.3: tag the γ = 1/8 illustration [S, adult data, Rouder 2023]. Do not tag it [V] for children (this amends R1).
22. §9: assent follows ICMR 2017. Oral assent from 7 (in the parent's presence), written from 13, dissent always honoured, plus a simple spoken check-in at age 6.
23. §3.1: delete "a 6-year-old reliably holds about one instruction step"; cite Gathercole 2008 only as motivation for the S3 instruction-length experiment.
24. §4: cite Pearson 1993 as the counting method only (infant sample). The disjunctive concept × label model (P8) is Taxila's own and needs S-series validation.
25. R3.5 / §3.5: time-of-day caveats are keyed to pubertal stage, which Taxila does not know and must not infer. That is one more reason time-of-day parent statements stay research-only.
26. R3.6: attribute "spatial predicts STEM" to Wai et al. 2009, not Uttal 2013.

**References added by this pass:**
- Wagenmakers, E.-J., van der Maas, H. L. J., & Grasman, R. P. P. P. (2007). An EZ-diffusion model for response time and accuracy. *Psychon Bull Rev* 14(1):3-22. [V, PDF read]
- Siegler, R. S., & Booth, J. L. (2004). Development of numerical estimation in young children. *Child Dev* 75(2):428-444. doi:10.1111/j.1467-8624.2004.00684.x [V]
- Opfer, J. E., & Siegler, R. S. (2007). Representational change and children's numerical estimation. *Cogn Psychol* 55:169-195. [V]
- Uttal, D. H., Meadow, N. G., Tipton, E., Hand, L. L., Alden, A. R., Warren, C., & Newcombe, N. S. (2013). The malleability of spatial skills: a meta-analysis of training studies. *Psychol Bull* 139(2):352-402. doi:10.1037/a0028446 [V]
- Kail, R. (1991). Developmental change in speed of processing during childhood and adolescence. *Psychol Bull* 109(3):490-501. [V, abstract]
- Gathercole, S. E., Durling, E., Evans, M., Jeffcock, S., & Stone, S. (2008). Working memory abilities and children's performance in laboratory analogues of classroom activities. *Appl Cogn Psychol* 22:1019-1037. [S]
- Carskadon, M. A., Vieira, C., & Acebo, C. (1993). Association between puberty and delayed phase preference. *Sleep* 16:258-262. [S]; Crowley, S. J., et al. (2018). An update on adolescent sleep: new evidence informing the perfect storm model. *J Adolesc* 67:55-65. [S]
- Wai, J., Lubinski, D., & Benbow, C. P. (2009). Spatial ability for STEM domains. *J Educ Psychol* 101(4):817-835. [S, not re-pulled]
- Indian Council of Medical Research (2017). *National Ethical Guidelines for Biomedical Research Involving Children*. New Delhi: ICMR. [S]
- Pearson 1993 (R7): upgrade [U] → [V]. Sample: 25 bilingual and 35 monolingual children aged 8-30 months.
