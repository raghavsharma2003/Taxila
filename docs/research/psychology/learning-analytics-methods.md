# Learning-analytics methods for a publishable longitudinal study on Taxila data

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish AI tutor. It logs dialogue, probes, games, timing, choices and session habits over months.
**Question:** Which methods let Taxila's logs support claims a peer reviewer would accept about how children learn, how learning and habits change, and what works for whom? How should the flagship study, *"How Indian children learn with an AI tutor: a longitudinal study of N children"*, be designed, pre-registered and ethically approved?
**Builds on, does not repeat:** `learning-science.md` (**LS**: rules 36-38, §2.7 bandit traps, §8.4 format-efficacy layer, §8.7 E-PROFILE, §9 E1-E8); `psychology/learning-over-time.md` (**LOT**: joint model §5.5, identifiability §5.8, H1-H8); `psychology/motivation-habits.md` (**MH**: policy dependence §3.3, `started_by` MH-D4, RI-CLPM, HMM, hazards, H1-H8); `psychology/cognitive-development.md` (**CD**: reliability arithmetic, S1-S9); `psychology/temperament-vibe.md` (**TV**: latent state-trait (LST) gate, multitrait-multimethod (MTMM) validity, S-TV1-6); `learner/kt-algorithms.md` (**KT**: `EvidenceEvent` ledger, θ on the grade-equivalent (GE) scale); `safety/dpdp-deep.md` (**DPDP**: §7.10 research exemption, questions for counsel). This file is the **methods layer** under all of their research programmes, and proposes the umbrella study that runs their hypotheses as one pre-registered protocol.

**Evidence tags.** **[V]** checked this session against the primary abstract, full text or official text (Europe PMC REST API, Crossref abstracts, arXiv API, and the ICMR 2017 guidelines PDF, extracted and read). **[V, sib]** verified on the same date by the named sibling file, not re-fetched. **[S]** existence and bibliographic details confirmed (Crossref record) but content not read, or secondary only. **[U]** unverified, from memory, or a Taxila design default that must be measured. A number marked *computed* comes from `learning-analytics-methods-sim.py` in this folder (numpy only, fixed seeds, ~5 min); its assumptions are [U], its arithmetic reproducible.

**Method.** The shared WebSearch budget was exhausted (200/200) before this review began. Verification used about 110 structured API lookups (Europe PMC ~45, Crossref ~60, arXiv 15) plus one direct fetch: the ICMR National Ethical Guidelines 2017 PDF, whose assent, risk and review clauses were read in full via `pdftotext`. OpenAlex returned HTTP 429 and was not used. Many Crossref records carry no abstract; those items are [S] for content even when title, venue and year are confirmed. **No study found here runs micro-randomised trials inside an AI tutor for children aged 6-15 in India.** Everything about that population is design, not evidence.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| LAM-D1 | **Every Director decision that could be randomised is logged as a decision record**: `decision_id`, decision point type, availability flag, candidate set, chosen action, **propensity**, policy version, random draw, and context features. No research analysis may use an adaptive decision whose propensity was not logged. | Logs from an adaptive tutor are policy-dependent (MH §3.3). Without propensities, neither inverse-propensity weighting (IPW) nor off-policy evaluation is possible (Dudík et al. 2014 [S]). MRT estimators need p_t (Boruvka 2018 [V]). | None. This is the precondition for every causal claim. |
| LAM-D2 | **Within-product questions about teaching moves use micro-randomised trials (MRTs)**, analysed as causal excursion effects with weighted-centred least squares (WCLS) or its binary-outcome analogue. Proximal outcomes are *delayed*, never immediate correctness. | The MRT is the design built for many decision points per person (Klasnja 2015 [V]; Qian 2022 [V]). Immediate correctness rewards "easy and fluent" (LS §2.6). | — |
| LAM-D3 | **Bandit allocation is allowed only with an exploration floor ≥ 0.10 per arm, logged propensities, and a pre-registered adaptive-data estimator** (batched OLS, AIPW with adaptive weights, or confidence sequences). Naive t-tests on bandit data are banned. | *Computed* (§4.2): without a floor, the naive Wald test's type-I error was .111. With a .10 floor it was .048, but power was .43 versus .63 under uniform allocation. OLS is non-normal under bandits when no arm is uniquely optimal (Zhang, Janson & Murphy 2020 [V]). | A pre-registered simulation at the real data shape shows a floor < .10 keeps type-I ≤ .055 and power within 10% of uniform. |
| LAM-D4 | **The umbrella study is an accelerated (cohort-sequential) longitudinal design.** Classes 1-9 enrol at once and are followed for 18 months, with embedded MRTs, one between-child RCT (E-PROFILE) and a delayed-start efficacy sub-cohort. | It spans ages 6-16 in 18 months instead of 9 years (Galbraith 2017 [V]). Overlapping cohorts let cohort and age effects be separated and tested. | Cohort × age non-convergence (§6.1) above a pre-set bound. If that happens, report per-cohort curves only. |
| LAM-D5 | **Age, schooling and Taxila exposure are modelled as three separate clocks.** School-entry cutoffs give a regression-discontinuity estimate of one extra year of schooling at fixed age. | Schooling raises cognitive scores independently of age (Cahan & Cohen 1989 [S]; Ritchie & Tucker-Drob 2018 [V, CD]). Without this, Taxila would claim credit for development and school. | — |
| LAM-D6 | **Growth-mixture "types of learners" are exploratory only.** They must beat a continuous model on held-out prediction, survive skew-robust refits, and are never shown to parents. | *Computed* (§6.4): ONE population with right-skewed slopes yielded k ≥ 2 classes by BIC in **100/100** replications, versus 0/100 with normal slopes. This is Bauer & Curran 2003 [V] at Taxila's data shape. The "cat's cradle" four classes recur regardless of data (Sher 2011 [V]). | Never for parents. For papers: classes replicate across random halves and cohorts, with GRoLTS reporting. |
| LAM-D7 | **No per-child causal claim ("format X works better for your child") in v1.** | *Computed* (§5.4): empirical-Bayes reliability .70 needs **78 delayed comparisons per arm** at a between-child effect SD τ = 0.5 logit, **217 at τ = 0.3** and 487 at τ = 0.2. LS §8.4 guessed "≥ 8-10". Group results do not transfer to individuals in non-ergodic processes (Fisher 2018 [V]). | A pilot shows τ ≥ 0.5 logit for some format × topic-type pair, *and* the child accumulates the comparisons. |
| LAM-D8 | **Every cross-age or cross-language comparison is preceded by an invariance or DIF analysis.** Response modality (voice vs tap) and ASR confidence are treated as moderators. | Construct meaning shifts with age (Frenzel 2012 [V, MH]). ASR error differs by age and code-mixing (LS §1.10). Non-invariance makes mean differences uninterpretable (Putnick & Bornstein 2016 [V]). | — |
| LAM-D9 | **Pre-registration for continuously accruing data uses a sealed confirmatory holdout.** A random 70% of research-consented children is locked, with a data-access log, until each analysis plan is timestamped on OSF. Exploration runs on the other 30%. | Pre-registration only helps if the data were not seen first (Nosek 2018 [V]; Weston 2019 [V]; Van den Akker 2021 [V]). Analytic flexibility manufactures significance (Simmons 2011 [V]). | — |
| LAM-D10 | **Two-tier consent.** Service consent (DPDP P1) covers equipoise-bounded variation of teaching moves. Research consent (P4), plus child assent from age 7 (ICMR Box 6.6 [V]), covers analysis and publication. Children without P4 get the deterministic default policy and are excluded from research extracts. | ICMR: dissent must be respected and research refusal must not compromise service [V]. DPDP s.17(2)(b) exempts research only where no decision about the specific child follows ([V, DPDP]). | Counsel's answer to DPDP Q1/Q2 (dpdp-deep §8). |
| LAM-D11 | **Assent is never solicited by the tutor persona.** A neutral screen or voice explains participation, with a parent present for ages 7-12 (verbal, recorded) and in writing at 12+, co-signed. | The tutor's relational bond (LS §4) is a source of undue influence. ICMR requires assent in language matched to developmental level, and that failure to object is not assent [V]. | An ethics committee rules otherwise after reviewing the script. |
| LAM-D12 | **Harm outcomes are co-primary in every experiment.** Compulsion markers (MH-D10), parent-pressure indicators, distress signals and opt-outs have pre-registered stopping thresholds and a small independent monitoring group. | Engagement products for children can fail by succeeding (MH-D10). The emotional-contagion experiment (Kramer 2014 [V]) is the cautionary precedent for in-product manipulation without review. | — |

---

## 1. Executive summary

1. **Taxila's logs are outputs of a policy, not observational data.** The Director, scheduler and bandit choose every observation in response to the child's state, so "children who got teach-back retained more" is confounded by why teach-back was chosen. The cheap fix must exist before launch: **log propensities and randomise a bounded share of decisions** (LAM-D1). This one engineering choice decides whether the dataset is publishable.
2. **The micro-randomised trial (MRT) fits Taxila's pedagogical questions.** It randomises at each of hundreds of decision points per person and estimates *causal excursion effects* and their time-varying moderation (Klasnja 2015; Boruvka 2018; Qian 2022 [V]). HeartSteps found a 14% proximal step-count effect that decayed over days in 44 adults (Klasnja 2019 [V]); Bidargaddi 2018 [V] ran an MRT in 1,255 users of a commercial app. No MRT inside an AI tutor for children has been published [U].
3. **Power is good for proximal effects and poor for per-child effects.** *Computed:* 400 children × 30 decision points detect a 3-pp effect on next-session delayed retrieval with power .83; 200 × 30 detect 5 pp with .94; type-I .060 (§3.4). The same arithmetic says child-level effects are not estimable at realistic dose (LAM-D7).
4. **Bandits and inference fight each other.** *Computed:* at equal n, Thompson sampling without a floor inflated naive type-I error to .111 and cut power from .63 to .41; a .10 floor restored type-I (.048) but power stayed .43 (§4.2). This replicates Rafferty 2019's "≥ 2× participants" [S]. Fixes exist: batched OLS (Zhang 2020 [V]), adaptively weighted AIPW (Hadad 2021 [V]), confidence sequences (Howard 2021 [S]), always-valid p-values (Johari 2022 [V]). In a 1-million-student system, contextual bandits rarely beat a well-tuned uniform policy (Schmucker 2025 [V]).
5. **Hierarchical Bayesian models are the backbone, with a fixed workflow**: prior predictive checks, simulation-based calibration (Talts 2018 [V]), rank-normalised R̂ (Vehtari 2021 [V]), PSIS-LOO (Vehtari 2017 [V]) and posterior predictive checks on *held-out delayed* observations (Gelman 2020 [V]). Partial pooling makes per-child numbers honest and shows how little one child's data says.
6. **Development must be separated from schooling and from Taxila.** An accelerated longitudinal design covers ages 6-16 in 18 months (Galbraith 2017 [V]); the school-entry cutoff gives a regression-discontinuity estimate of schooling at fixed age (Cahan & Cohen 1989 [S]). Vertical-scaling choices change growth conclusions (Briggs & Weeks 2009 [V]) and ordinal scales make growth comparisons fragile (Bond & Lang [S]), so scale-robust results are reported alongside.
7. **Growth mixture modelling (GMM) is the most dangerous popular method here.** Non-normality alone produces "classes" (Bauer & Curran 2003 [V]; *computed* 100/100); four prototype trajectories recur across arbitrary designs (Sher 2011 [V]); class counts swing with variance constraints (Infurna & Grimm 2017 [V]). Continuous latent growth is primary; GMM is exploratory with GRoLTS reporting.
8. **Reciprocal and dynamic questions need within-person models**: RI-CLPM, not CLPM (Hamaker 2015 [V]), or dynamic SEM (McNeish & Hamaker 2020 [V]), with within/between disaggregation (Curran & Bauer 2011 [V]).
9. **Observational causal questions use target-trial emulation** (Hernán & Robins 2016 [V]): IPW marginal structural models, debiased ML, negative controls, and E-values or omitted-variable bounds (VanderWeele & Ding 2017; Cinelli & Hazlett 2020 [V]). Historical logs can also *sharpen* Taxila's RCTs: the non-participant "remnant" trains an outcome predictor that cuts variance without bias (Sales 2018; Gagnon-Bartsch 2023 [V]).
10. **Ethics in India is well specified for health research and silent for EdTech.** ICMR 2017 covers "social and behavioural science research *for health*" [V]; education has no statutory analogue [U], but journals will demand approval by an institutional ethics committee (IEC). ICMR is the defensible standard:
    - "Routine research on children and adolescents" is a *minor increase over minimal risk*, so expect full-committee review [V].
    - Assent: none documented under 7; verbal, recorded and in the parent's presence at 7-12; written and co-signed at 12-18. Dissent must be respected [V].
    - The exemption for "comparison of instructional techniques" requires **no linked identifiers** [V], so it does not cover Taxila.
11. **Comparable programmes show the path and the traps.**
    - ASSISTments/E-TRIALS: embedded RCTs as infrastructure (Maine RCT: 2,850 students, 43 schools).
    - Eedi: misconception-coded diagnostics and a supervised LLM-tutor RCT.
    - Duolingo: half-life regression and a notification bandit, with almost no external-outcome trials.
    - Mindspark: +0.37 SD maths in 4.5 months.
    - Math Garden: over a billion children's responses used for developmental science.
    - Scale shrinks effects (Kizilcec 2020, 250k students [V]); large education RCTs average 0.06 SD (Lortie-Forgues & Inglis 2019 [V]). **Plan for small effects; pre-register for nulls.**
12. **The umbrella study (§13).** N = 4,000 research-consented children enrolled (≈ 450 per class, stratified by Hindi/English medium); an 18-month accelerated cohort; ≈ 1,600 analysable at month 18 [U]. Eight pre-registered hypotheses: efficacy (delayed-start RCT), learning-rate regularity, age and forgetting, MRT probe effects, expertise reversal, the per-child-format null (E-PROFILE), competence→motivation reciprocity, and habit as context. Four measurement gates (invariance, reliability, external validity, ASR) come first.

---

## 2. Why Taxila's logs need design, not just analysis

### 2.1 Seven ways the data lie

| # | threat | mechanism in Taxila | consequence | remedy (section) |
|---|---|---|---|---|
| T1 | **Policy dependence** | the Director chooses moves from child state (MH §3.3) | move × outcome correlations are confounded by indication | randomised share + propensities (§3, §4); OPE (§4.4) |
| T2 | **Mastery-exit MNAR** | practice stops when mastery is declared | slope variance inflated +118% median (Lee et al. 2026 [V, LOT]) | fixed-length calibration sequences (LOT §5.8) |
| T3 | **Engagement-dependent missingness** | disengaged children produce fewer observations, exactly when things go wrong | growth looks better than it is; attrition is informative (law of attrition, Eysenbach 2005 [V, MH]) | joint models of dropout; pattern-mixture sensitivity (§13.8) |
| T4 | **Three clocks confounded** | age, class/grade, and months of Taxila exposure all rise together | "development" claims absorb schooling and practice | ALD + RD at school-entry cutoff + exposure term (§6.1-6.2) |
| T5 | **Measurement non-invariance** | ASR error, voice vs tap, Hindi vs English item versions, construct drift with age | spurious group and age differences | DIF/MNLFA/alignment (§8) |
| T6 | **Who is the unit?** | shared phones, parent-started sessions (MH-D4) | behaviour attributed to the wrong child or motive | `started_by`, profile check at start (MH1) |
| T7 | **The product changes under the study** | prompts, models and ASR versions change weekly | time trends are partly software trends | `policy_version` on every record; version as a covariate; frozen research policy windows (§13.6) |

### 2.2 The decision-record contract (LAM-D1)

```
DecisionRecord {
  decision_id, child_pseudo_id, session_id, ts_date, session_index, policy_version,
  point_type: 'post_learned_probe' | 'review_lag' | 'format_choice' | 'feedback_type' |
              'chunk_size' | 're_anchor_offer' | 'lapse_action' | ...,
  available: bool,             // MRT availability (e.g. not mid-distress, not past session cap)
  candidates: ActionId[],      // eligible after hard constraints (LS §8.4 step 1)
  p: number[],                 // propensity of each candidate, sums to 1
  draw: number,                // the uniform random number used
  chosen: ActionId,
  context: {band, theta_bucket, topicType, lang_mix_bucket, started_by, minutes_in_session, ...},
  exclusion_reason?: string    // why not randomised (safety, consent tier, research holdout)
}
```

Proximal outcomes are joined later from the `EvidenceEvent` ledger (KT §1.1) by `decision_id`. Examples: next-session delayed retrieval, retry after error, voluntary continuation. Without `p` and `available`, the record is unusable for MRT or OPE. **Clock time-of-day is not stored in `context`**, which keeps MHI3 and LOT invariant 4. `session_index` and `ts_date` suffice for every estimand in this file.

---

## 3. Within-product micro-randomised trials

### 3.1 What an MRT is

At each decision point t for child i, an intervention component A_it ∈ {0,1} (or multi-level) is randomised with known probability p_t(H_it), but only if the child is *available*, I_it = 1. Each child contributes many randomisations, so effects are estimated **within-person**. Time-varying moderation, such as "is the probe more useful late in a session?", is identifiable (Klasnja 2015 [V]; Liao 2016 [V]).

**Estimand: the causal excursion effect** (Boruvka 2018 [V]; Qian 2022 [V]):

```
β(t; s) = E[ Y_{i,t+Δ}(Ā_{i,t−1}, 1) − Y_{i,t+Δ}(Ā_{i,t−1}, 0) | I_it = 1, S_it = s ]
```

This is the effect of delivering versus not delivering the component at t, *averaged over the randomised history that came before*. It answers "what happens if we deviate from the current policy at this moment", not "the effect of a fixed regimen". **Every MRT paper must state this in plain words.** Excursion effects depend on the background policy, so they shift when the policy changes.

For a binary proximal outcome the log relative risk is often used: log{E[Y(1)|·] / E[Y(0)|·]} = s′β (Qian, Yoo, Klasnja, Almirall & Murphy 2021, *Biometrika* [S; rejoinder V]).

**Estimator (WCLS).** Solve, over children i and points t:

```
Σ_i Σ_t I_it · W_it · ( Y_{i,t+Δ} − g_t(H_it)′α − (A_it − p̃_t(S_it)) · S_it′β ) · [ g_t(H_it) ; (A_it − p̃_t(S_it)) S_it ] = 0
W_it = p̃_t(S_it)^{A_it} (1 − p̃_t(S_it))^{1−A_it} / [ p_t(H_it)^{A_it} (1 − p_t(H_it))^{1−A_it} ]
```

- g_t(H)′α is a working model for the outcome under the background policy. It only improves precision: β stays consistent even if g is wrong, provided p_t is known.
- p̃_t(S) is a chosen numerator probability that makes the estimand marginal over variables not in S.
- Standard errors are sandwich estimates clustered on child, with a small-sample correction.

### 3.2 Taxila MRT catalogue (candidates; each needs pre-registration)

| MRT | decision point | component | proximal outcome (delayed) | moderators | sibling link |
|---|---|---|---|---|---|
| M-PROBE | skill reaches `learned-today` | "why?" probe / teach-back prompt vs none | success on that skill at first next-session check | band, θ, topicType | LS rule 4, E5 |
| M-PRED | new concept with a predictable outcome | predict-before-reveal vs tell-first | delayed transfer item | band, inhibition proxy ζ (CD) | CD S4 |
| M-CHUNK | instruction turn | 1 vs 2 vs 3 steps per turn | hints used on next item; delayed success | WM proxy κ (CD), band | CD S3 |
| M-LAG | review scheduling | lag multiplier U(0.6, 1.6) (LOT §5.8) | retrieval success at the check | band, topicType, S_ck | LOT H4 |
| M-FB | after an error | process feedback vs neutral correction | retry after next error; harder-option choice | band (C) | MH H7 |
| M-WE | new procedure | worked example first vs attempt first | delayed success, matched items | **θ (prior knowledge)** | LS F2/F8; §13 H5 |
| M-ANCHOR | eligible reminder slot | re-anchor offer vs none (within the parent's allowed windows) | self-started session within 48 h | weeks enrolled, context change | MH H2, H6 |

Hard constraints come before randomisation and are never relaxed by it:
- the expertise-reversal gate (except inside M-WE, which tests it within equipoise bounds);
- LOT §5.8.4 retention ≥ 0.6;
- no randomisation during detected distress;
- the session caps.

### 3.3 Design choices that decide validity

1. **Randomisation probability.** p = 0.5 maximises power for a single component. Use p = 0.3-0.4 when the component is costly or intrusive (a teach-back takes about 60 seconds). The power loss is p(1−p): 0.21 vs 0.25.
2. **Availability.** Pre-define it (not in distress, not in the last 2 minutes before the cap, consent tier P4). Availability is *not* randomised and acts as a moderator. Effects are defined only on I = 1.
3. **Carry-over and burden.** Probes delivered often may fatigue. Include "number of deliveries in the last session" as a pre-specified moderator, and cap deliveries per session. HeartSteps saw effects decay over study days (Klasnja 2019 [V]).
4. **Distal outcomes.** MRTs are powered for proximal effects. The distal effect, such as month-6 external score, belongs to the between-child RCT (E-PROFILE, H1). Do not claim distal effects from MRT excursion estimates.
5. **Interference between components.** Run several MRTs at once on *different decision points*. Where two components touch the same outcome, randomise them factorially and test the interaction. This follows the logic of the multiphase optimisation strategy (MOST) (Collins, Murphy & Strecher 2007 [S]).
6. **Hybrid designs.** Combining a SMART with an embedded MRT (Murphy 2005 [S]; Nahum-Shani et al. 2022 [S]) fits Taxila: the between-child stage randomises the profile policy, and the within-child stage randomises moves.

### 3.4 Power (*computed*, §A of the sim)

Assumptions [U]:
- base delayed success .60, child SD on the logit scale .8;
- availability .8, p = .5;
- mild drift;
- α = .05 two-sided, 400 replications per cell;
- effect expressed as a risk difference.

| effect | N children | T = 10 points | T = 30 | T = 60 |
|---|---|---|---|---|
| 3 pp | 100 | .13 | .32 | .57 |
| 3 pp | 200 | .21 | .58 | .87 |
| 3 pp | 400 | .38 | **.83** | 1.00 |
| 3 pp | 800 | .69 | .99 | 1.00 |
| 5 pp | 100 | .29 | .76 | .93 |
| 5 pp | 200 | .52 | **.94** | 1.00 |
| 5 pp | 400 | .83 | 1.00 | 1.00 |

A child-varying effect (τ = 0.05 on the probability scale) cost little (3 pp, N = 400, T = 30: .81). Type-I error at β = 0 (N = 200, T = 30, 1,000 replications) was **.060**: the sandwich is slightly liberal at 200 clusters, so pre-register a small-sample correction (CR2, or t with N−p df) [U]. **Moderation by four age bands needs about 4× the children** for the same per-band precision, which is the main driver of N in §13.4. Cross-check this simulation against Liao 2016's analytic formula [V] at the real event-time distribution.

### 3.5 Ethics specific to MRTs

- **Equipoise.** Every randomised arm must be a move the team would ship to everyone. People often object to A/B tests even when they would accept either A or B rolled out to everyone untested (the "A/B effect", 16 studies, 5,873 participants; Meyer et al. 2019 [V]). Explain this to the ethics committee and to parents: the alternative is rolling out an untested choice.
- **Incomplete disclosure.** Children and parents know that "Taxila tries different ways of teaching and checks what helps", but not which arm a given turn used. ICMR treats incomplete disclosure as a deception category that needs committee approval and debriefing (ICMR §5.11, §9.2.9, Box 9.5 [V]). Plan an annual parent debrief in the Parent corner.
- **Never randomise away learning** (LOT §5.8.4). This also caps the cost of any arm.

---

## 4. Bandits and other adaptive experiments with valid inference

### 4.1 The tension

A bandit moves allocation toward the apparently better arm, which helps children *during* the experiment. It also:
- (a) biases per-arm sample means (Shin, Ramdas & Rinaldo 2021 [V]);
- (b) makes OLS non-normal when no arm is uniquely optimal, so standard CIs under-cover (Zhang, Janson & Murphy 2020 [V]);
- (c) starves the inferior arm, so the difference is estimated badly (Rafferty, Ying & Williams 2019 [S]).

Kasy & Sautmann (2019/2021 [S]) show that the *objective* matters: an experiment whose goal is choosing a policy should allocate differently from one that maximises in-experiment welfare.

### 4.2 What it costs at Taxila's scale (*computed*, §B of the sim)

Setup: two formats, delayed success .60 under H0 and .65 vs .60 under H1, 2,000 allocations in 20 batches, 1,000 replications.

| design | H0 type-I, naive Wald | H0 type-I, IPW | H1 power, naive | H1 share of allocations to the better arm |
|---|---|---|---|---|
| uniform 50/50 | .052 | .050 | **.63** | .50 |
| Thompson, floor .20 | .053 | .052 | .54 | .73 |
| Thompson, floor .10 | .048 | .043 | .43 | .79 |
| Thompson, floor .05 | .066 | .044 | .41 | .81 |
| Thompson, no floor | **.111** | .057* | .41 | .80 |

\*IPW excludes replications where the propensity hit exactly 0 or 1; avoiding that is what the floor is for.

Reading:
- A floor of .10-.20 keeps naive tests near nominal at this size.
- Every adaptive design pays 14-35% of the power for 23-31 more points of allocation to the better arm.
- That trade is worth making only when in-experiment welfare differences are real. Most format differences are small (LS §2.3).

### 4.3 Estimators that restore inference

| method | idea | use in Taxila |
|---|---|---|
| **Batched OLS / batched Z-test** (Zhang et al. 2020 [V]) | estimate within each batch, where allocation is fixed, then combine; asymptotically normal | default for E-PROFILE arm A and for any bandit-allocated format |
| **Adaptively weighted AIPW** (Hadad et al. 2021 [V]) | Γ̂_a = Σ_t h_t [μ̂_a(H_t) + 1{A_t = a}(Y_t − μ̂_a(H_t))/π_t(a)] / Σ_t h_t, with variance-stabilising weights h_t ∝ √π_t(a) | policy-value CIs for contextual policies |
| **Confidence sequences / always-valid p** (Howard et al. 2021 [S]; Johari et al. 2022 [V]) | time-uniform coverage: inference stays valid under continuous monitoring and optional stopping | dashboards that people *will* peek at; kill criteria |
| **Power-constrained bandits** (Yao et al. 2020 [V]) | personalise while guaranteeing the power to detect the treatment effect | if Taxila ever runs per-child bandits for research |
| **Thompson with clipping + pre-registered floor** (LS §8.4) | allocation rule, not an estimator | always paired with one of the rows above |

**Design guidance for RL in digital interventions.** Use PCS, a framework from Trella et al. 2022 [V] that checks an algorithm's predictability, computability and stability before deployment, plus the Oralytics and HeartSteps practice (Liao 2020 [S]): simulate the algorithm on a test bed built from pilot data before deployment, pre-specify its update cadence, and log everything needed for after-study inference.

### 4.4 Off-policy evaluation (OPE) from logged propensities

Once propensities are logged, *new* policies can be evaluated offline:
- inverse propensity scoring (IPS): V̂(π) = (1/n) Σ π(A_t | H_t)/p_t(A_t | H_t) · Y_t;
- doubly robust estimators (Dudík, Erhan & Langford 2014 [S]).

Educational precedents: offline policy evaluation for educational games (Mandel et al. 2014 [U]), and reinforcement learning for instructional sequencing, where many "wins" did not survive evaluation because the reward or the simulated student was wrong (Doroudi, Aleven & Brunskill 2019 [S]). OPE variance explodes when the new policy differs from the logging policy, so it is a filter for which policy to test online, not a substitute for the online test [U].

### 4.5 "Interleaved", crossover and switchback designs within a child

- **Within-child crossover by item.** For a format comparison, alternate formats across *matched* skills within a child. Each child serves as their own control and difficulty is balanced by design. This is the right design for E-PROFILE's population-level β[format, topicType].
- **Switchback in time.** Randomise the policy per *week* (e.g. lighter vs standard plan) and estimate effects with carry-over windows. The optimal design depends on how long effects persist (Bojinov, Simchi-Levi & Zhao 2023 [V]). Use it for Conductor-level policies (MH-D7 lapse actions) where within-session randomisation is meaningless.
- **Interleaving** in the information-retrieval sense, where two rankers are blended in one list, does not transfer. Taxila shows one teaching move per turn [U].

---

## 5. Hierarchical Bayesian models: the backbone

### 5.1 The master measurement-and-growth model

The flagship analyses share one structure. It is an explanatory item response model with time-varying ability, extending LOT §5.5 and KT §3:

```
for response y_ijt (child i, item j, occasion t):
  logit P(y_ijt = 1) = θ_i(t) − b_j + x_ijt′γ                          // x: modality (voice/tap), ASR conf., hints, lang
  b_j = w_j′δ + ε_j,  ε_j ~ N(0, σ_b²)                                   // item features → difficulty (LLTM-style)
  θ_i(t) = μ(age_it) + ψ·grade_it + h(expo_it) + c_cohort(i)
           + u_0i + u_1i·(age_it − 10) + e_it                             // three clocks (§6.2)
  (u_0i, u_1i) ~ MVN(0, Σ_u),   Σ_u = diag(σ_u)·Ω·diag(σ_u),  Ω ~ LKJ(2)
  e_it ~ AR(1) state noise, φ ∈ (0,1)                                     // short-term "weather" (CD §2.7)
  μ(·): natural cubic spline in age (4-5 knots);  h(·): monotone spline in cumulative active hours
  priors [U]: σ_u ~ half-N(0, 0.5²) GE; ψ ~ N(0.5, 0.5²) GE/year; γ ~ N(0, 0.5²); σ_b ~ half-N(0, 1)
  DIF terms (§8): b_j → b_j + d_j,g with d_j,g ~ N(0, σ_DIF²) (regularised) for groups g
```

Learning- and forgetting-specific questions (H2, H3) use LOT §5.5's joint model on the same ledger. Motivation and habit questions (H7, H8) use MH §5's models. This file prescribes how *all* of them are fitted, checked and reported (§5.2).

### 5.2 Workflow that every paper follows (Gelman et al. 2020 [V])

1. **Before fitting:** prior predictive checks (simulated children look like children: plausible GE trajectories, success rates 0.3-0.95), then parameter recovery and simulation-based calibration (SBC) at Taxila's real data shape (Talts et al. 2018 [V]; = LOT6). A model that cannot recover known parameters cannot support claims about real ones.
2. **Fitting:** Stan via `brms`/`cmdstanr` (Bürkner 2017 [S]) or NumPyro for event-level models, on a stratified 2-5 k children per fit [U]. Nightly child posteriors use Laplace or grid approximations with hyperparameters fixed (LOT §5.5). Require rank-normalised R̂ < 1.01, bulk/tail ESS > 400 (Vehtari et al. 2021 [V]) and no divergences after reparameterisation.
3. **Checking:** PSIS-LOO with Pareto-k inspection (Vehtari, Gelman & Gabry 2017 [V]), but **leave-future-out** for time series, never random-split LOO. Posterior predictive checks on held-out delayed observations by age band, language and lag bin.
4. **Reporting:** posterior medians, 90% intervals and the posterior probability of the pre-registered direction. Bayes factors or frequentist tests only where the pre-registration names them.

### 5.3 Partial pooling is what makes per-child numbers honest

The empirical-Bayes child estimate is a weighted average:

```
û_i = ρ_i · (child's own estimate) + (1 − ρ_i) · (population/band mean),
ρ_i = τ² / (τ² + V_i)
```

Here V_i is the sampling variance of the child's own estimate. When ρ_i is small, the "child-level" number is mostly the population mean, and **must be presented as such** (CD §8.2, LOT §6.3, TV TV4).

### 5.4 How many comparisons before a child-level causal claim? (*computed*, §D)

Setup: a within-child log-odds contrast A vs B with n delayed comparisons per arm and p ≈ .6, so V = 2/(n·p(1−p)).

| τ (true between-child SD of the format effect, logit) | n per arm for ρ ≥ .70 |
|---|---|
| 0.1 | 1,945 |
| 0.2 | 487 |
| 0.3 | 217 |
| 0.5 | 78 |

Literature priors put τ small (Schmucker 2025 [V]; LS §2.3: matching d ≈ 0.04). Taxila produces about 2-6 delayed format comparisons per child × topic type per month [U], so **per-child format claims are not reachable within a school year.** This replaces LS §8.4's "likely ≥ 8-10" (see §17).

It is also why the group-to-individual problem matters. Within-person variance was 2-4× larger than group-level variance across six repeated-measures samples (Fisher, Medaglia & Jeronimus 2018 [V]). Population findings ("teach-back helps 10-15-year-olds on average") cannot be told to a parent as "teach-back helps *your* child".

---

## 6. Longitudinal change: development, schooling, exposure

### 6.1 Accelerated longitudinal design (ALD)

Nine class cohorts (1-9) enrol at once and are followed for 18 months, which crosses one academic-year boundary (April for CBSE and most state boards [U]). Adjacent cohorts overlap by about 6-12 months of age, which allows linking. The model is §5.1 with the age spline μ(age) shared across cohorts plus cohort effects c_cohort.

**The convergence test:** do cohort-specific curves join into one developmental curve?

```
H_conv:  c_cohort = 0 for all cohorts;   test via LOO(shared μ + c) vs LOO(cohort-specific μ_c)
         and posterior of max_c |c_c| < 0.25 GE  [U bound]
```

Galbraith, Bowden & Mander 2017 [V] treat cost, power and dropout. Duration-related costs push optimal designs toward shorter follow-up with more cohorts. That suits Taxila, because recruitment is nearly free and follow-up is the scarce resource.

**Power for slope differences.** Raudenbush & Liu 2001 [S] show that study duration and observation frequency trade off against N. Taxila's density, with hundreds of observations per child, makes *frequency* nearly free. Duration and N then dominate.

### 6.2 Three clocks

| clock | variable | identifying variation |
|---|---|---|
| age (maturation) | age in months | spline μ(age); within-cohort spread of birthdates |
| schooling | grade (class) | **regression discontinuity at the school-entry cutoff**: children born just after the cutoff date are a year behind in school at the same age (Cahan & Cohen 1989 [S]; the RD family in Ritchie & Tucker-Drob 2018 [V, CD]) |
| Taxila exposure | cumulative active hours, sessions | within-child timing of use; the delayed-start RCT (H1) for the causal part |

India has state-varying and changing cutoffs; national guidance moved toward age 6 for Class 1 [U]. Compliance is imperfect, so this is a **fuzzy RD**: the birthdate threshold is the instrument for grade. Collect the child's month of birth (not the full date of birth; data minimisation) and the state of schooling. If compliance is too weak (first-stage F < 10), drop the RD and report age and grade as confounded.

### 6.3 Scale, linking and the fragility of growth

- **Vertical scaling.** θ must be on one scale from class 1 to class 9. KT uses a GE-scale θ. The anchor-item design must include common items between adjacent classes. Briggs & Weeks 2009 [V] show that empirical growth patterns differ by vertical-scaling choice. Pre-register the linking method and report a sensitivity analysis with an alternative (e.g. concurrent vs separate calibration).
- **Ordinal fragility.** Bond & Lang [S] show that gap and growth conclusions can reverse under monotone rescalings of a test score. For any claim of the form "group A grows faster than B", also report a scale-free version, such as the share of children in A whose month-12 θ exceeds the median of B's, or quantile treatment effects [U method choice].
- **Practice versus development.** Repeated items improve through item memory. Measure growth on **fresh linking forms** drawn from an item pool never used in teaching (§13.5). This is CD-D10's practice adjustment made operational.

### 6.4 Growth mixture modelling: use with guards

Model:

```
y_it = Λ_t η_i + ε_it;   η_i | (C_i = k) ~ N(α_k, Ψ_k);   P(C_i = k) = π_k (or softmax(z_i′ζ_k))
```

**What goes wrong.** Finite normal mixtures approximate *non-normal* single populations, so BIC recovers "classes" that do not exist, and their parameters are "largely uninterpretable" (Bauer & Curran 2003 [V]). Four prototypes (low, increasing, decreasing, high) recur across very different sampling designs (Sher, Jackson & Steinley 2011 [V]). Class number and size change drastically with whether variances are held equal across classes (Infurna & Grimm 2017 [V]). BLRT and BIC beat AIC for enumeration (Nylund, Asparouhov & Muthén 2007 [S]), but none of them detects non-normality masquerading as classes.

***Computed* at Taxila's shape (§C of the sim).** Setup: 1,000 children, 12 monthly θ estimates with SE .25 GE, one population.

| true slope distribution | BIC picks k=1 | k=2 | k=3 | k=4 |
|---|---|---|---|---|
| normal | **1.00** | 0 | 0 | 0 |
| right-skewed (gamma, k = 2) | **0.00** | 0.37 | 0.62 | 0.01 |

Practice dose is skewed in every EdTech product [U], so slopes will be skewed too. **A GMM on Taxila data will find "learner types" whether or not they exist.**

**Rules (LAM-D6).**
1. The primary analysis is continuous latent growth (§5.1). GMM is exploratory and labelled so in the pre-registration.
2. Enumerate with skew-t or skew-normal mixtures as well as normal ones. A class that disappears under skew-robust models is reported as a distributional feature, not a group.
3. Replicate on the sealed holdout and across cohorts. Report class-assignment entropy and the posterior probability of assignment for each child.
4. Report everything on the GRoLTS checklist (van de Schoot et al. 2016 [S]); Nagin & Odgers 2010 [V] give reporting guidance for group-based trajectory models.
5. **Classes never reach a parent, a teacher prompt or a product decision** (TV2, MH-D1).

### 6.5 Within-person dynamics

- **Disaggregate.** Every time-varying predictor is split into the child mean and the within-child deviation (Curran & Bauer 2011 [V]). "Children who practise more learn more" (between) is a different claim from "when a child practises more than usual, they learn more" (within).
- **Reciprocal effects.** Use the RI-CLPM (Hamaker, Kuiper & Grasman 2015 [V]):

  ```
  x_it = μ_t + κ_i + x*_it,   y_it = π_t + ω_i + y*_it
  x*_it = α_x x*_i,t−1 + β_xy y*_i,t−1 + u_it;   y*_it = α_y y*_i,t−1 + β_yx x*_i,t−1 + v_it
  ```

  Alternatively use two-level dynamic SEM (DSEM) with random autoregressive and cross-lagged effects (Asparouhov, Hamaker & Muthén 2018 [S]; McNeish & Hamaker 2020 [V]). DSEM needs enough time points per child: Schultzberg & Muthén 2017 [S] give N × T trade-offs. Taxila's monthly or weekly aggregates over 18 months (T = 18-78) are in the workable range [U].
- **State-trait.** TV's LST decomposition decides whether an interaction signature is trait-like enough to persist (TV3). It runs on the same panel.

---

## 7. Causal inference on observational learning logs

### 7.1 Target-trial emulation: the template

For each observational causal question, write the protocol of the trial you would run (Hernán & Robins 2016 [V]), then emulate it:

| component | example: "does regular practice cause better durability?" |
|---|---|
| eligibility | research-consented children, ≥ 4 weeks enrolled, ≥ 10 mastered skills |
| strategies | (a) sessions on ≥ 4 of 7 days for 8 weeks vs (b) ≤ 2 of 7 |
| assignment | emulated by IPW on baseline and time-varying confounders (θ, prior regularity, `started_by` share, band, exam season, device) |
| time zero | the week eligibility is met (avoids immortal-time bias) |
| outcome | HLR-C durability u_c on randomised-lag checks (LOT §5.4) at week 12 |
| causal contrast | per-protocol effect with IPW for adherence |
| analysis | marginal structural model: E[Y^ā] = β_0 + β_1·g(ā), with stabilised weights SW_i = Π_t P(A_t | Ā_{t−1}) / P(A_t | Ā_{t−1}, L̄_t), truncated at the 1st/99th percentile (Robins, Hernán & Brumback 2000 [S]) |

### 7.2 Tools and when to use them

| tool | use | caution |
|---|---|---|
| IPW/MSM, g-formula | time-varying exposure with time-varying confounders that are affected by past exposure (θ, motivation) | positivity: every child must have had a real chance of each strategy |
| Double/debiased ML (Chernozhukov et al. 2018 [S]) | high-dimensional confounders (session features) without overfitting bias | cross-fitting by child, never by event |
| Causal forests (Wager & Athey 2018 [S]) | *exploring* effect heterogeneity in randomised data (MRT, E-PROFILE) | heterogeneity claims become confirmatory only after holdout replication (Bryan, Tipton & Yeager 2021 [V]) |
| Rebar / remnant-based adjustment (Sales, Hansen & Rowan 2018 [V]; Gagnon-Bartsch et al. 2023 [V]) | use non-participants' logs to train an outcome predictor, then adjust the RCT estimate: design-based and unbiased | the remnant must be disjoint from trial participants |
| Principal stratification (Sales & Pane 2019 [S]) | effects among children who *would* reach mastery or *would* engage | latent strata need strong modelling assumptions; state them |
| Natural experiments | server outages, staged ASR or model rollouts, school-calendar breaks (LOT H7), state-specific exam dates | record rollout timing *before* analysis; rollouts are rarely random |
| Negative controls (Lipsitch et al. 2010 [S]) | outcome that the exposure cannot affect (e.g. performance on topics not yet taught) | a non-null negative-control effect means residual confounding |
| Sensitivity: E-value (VanderWeele & Ding 2017 [V]) | E = RR + √(RR(RR − 1)) for the point estimate and the CI limit | report for every observational causal estimate |
| Sensitivity: omitted-variable-bias bounds (Cinelli & Hazlett 2020 [V]) | "how strong would an unobserved confounder (say, home support) have to be, relative to θ_baseline, to erase the effect?" | benchmark against observed covariates |

### 7.3 What must never be claimed from observational logs alone

- "Taxila improved your child's X." This needs H1's randomised contrast plus external outcomes.
- "Children who use feature F learn more, so F works." Use of a feature is chosen by children who differ (T1).
- Any developmental trajectory claim that has not separated the three clocks (§6.2).

---

## 8. Measurement invariance across age, language and modality

### 8.1 Why it is unavoidable here

- **Construct drift.** The same motivational items measure different things in grade 5 and grade 9 (Frenzel 2012 [V, MH]). EF structure differentiates around age 10 (CD-D3).
- **Language.** An item in Hindi and its English translation can differ in difficulty for reasons unrelated to the skill: vocabulary frequency, script and numeral forms.
- **Modality.** A voice answer depends on ASR. A tap answer is recognition. For a 6-year-old the same item is easier to tap than to say.
- **ASR as a biased instrument.** If WER is higher for Hinglish or for younger children (LS §1.10; E1), spoken items will show DIF that is really instrument bias.

Without invariance, mean comparisons and growth comparisons are uninterpretable (Putnick & Bornstein 2016 [V]).

### 8.2 Methods

| method | when | specification |
|---|---|---|
| **Logistic-regression DIF** (Swaminathan & Rogers 1990 [V]) | item-level screen, two groups | logit P(y = 1) = β_0 + β_1 θ + β_2 g + β_3 θ·g. β_2 is uniform DIF, β_3 non-uniform. Use effect-size flags (Δ pseudo-R² or Δ log-odds > 0.4 [U]), not p-values alone, at Taxila's N |
| **Explanatory IRT with regularised DIF** (§5.1) | many groups at once (language × band × modality) | b_j + d_j,g, with a shrinkage prior on d. Anchors are chosen from items with posterior d ≈ 0 |
| **Multigroup CFA: configural → metric → scalar** | questionnaire scales (research sub-studies: TMCQ, EATQ-R, motivation) | report ΔCFI and ΔRMSEA. Chen 2007 [S] proposes ΔCFI ≤ −.010 with ΔRMSEA ≥ .015 as the non-invariance flag (cutoffs from secondary summary; check the paper) |
| **Moderated nonlinear factor analysis (MNLFA)** (Bauer 2017 [S]; longitudinal MNLFA, Chen & Bauer 2026 [V]) | continuous moderators such as **age in months** and language-mix proportion | λ_j(x) = λ_0j + λ_1j′x; ν_j(x) = ν_0j + ν_1j′x; also the factor mean and variance as functions of x. This is the natural model for age-graded data |
| **Alignment** (Asparouhov & Muthén 2014 [S]) | many groups (states × medium × band) where exact scalar invariance will fail | approximate invariance; report the share of non-invariant parameters |
| **Longitudinal invariance** | the same scale over the 18 months | invariance across waves *within* child, before any growth claim (the Frenzel lesson) |

### 8.3 Translation and adaptation

- Follow the ITC Guidelines for Translating and Adapting Tests (2nd ed., 2017 [S]): forward and back translation, cognitive interviews with children in each language, then DIF statistics.
- Item versions for Hindi, English and Hinglish are separate items linked through the explanatory model, never assumed equal.

### 8.4 When invariance fails

1. Partial invariance: free the offending parameters, keep at least two anchors per factor, and report which items moved.
2. If a construct is not even configurally invariant across bands, **report it within band only**. Do not draw a 6-to-15 trajectory for it. This is MH-D1's logic applied to measurement.
3. For modality, report voice and tap separately, or model modality as a person-by-item covariate. Never pool raw accuracy.

---

## 9. Reliability and validity programme (summary; detail lives in siblings)

- **Reliability cards** (CD-D9) for every measure: ρ, SEM, n, method, date, band, device class.
- Use the hierarchical split-half or test-retest reliability of trial-level measures, not difference scores (CD §2.3).
- **External criterion sub-study (G3).** A stratified n ≈ 600 at months 0, 6, 12 and 18 takes:
  - an assessor-administered oral reading and arithmetic tool (ASER-style [S, LS]);
  - a fixed paper-equivalent maths and reading form aligned to the national assessment framework [U instrument choice];
  - brief validated motivation and self-efficacy scales from age 10 (MH5-MH6);
  - parent questionnaires per TV S-TV2.
- **Convergent targets** [U]: r(θ_Taxila, external maths) ≥ .60; r(reading θ, oral reading fluency) ≥ .60.
- **Discriminant targets:** TV §5.7, e.g. |r| < .10 between quietness and mastery.
- **Predictive validity:** θ at month 0 predicts the external score at month 12 beyond the external score at month 0 (incremental ΔR²).

---

## 10. Pre-registration and open science

### 10.1 Pre-registering on data that never stops arriving

Taxila's data accrue daily, and the team can see dashboards. Classic pre-registration ("before data collection") is impossible. Use the secondary-data templates (Van den Akker et al. 2021 [V]; Weston et al. 2019 [V]) plus three mechanisms:

1. **Sealed holdout (LAM-D9).** At enrolment, 70% of research-consented children are randomly marked confirmatory. Their research extract is readable only by a pipeline that writes an access log. Analysts explore on the 30%.
2. **Timestamped plans.** Each hypothesis gets an OSF pre-registration specifying:
   - estimand, model, priors, exclusions and stopping rule;
   - the smallest effect size of interest (SESOI);
   - the inference criterion;
   - analysis code tested on *simulated* data.

   The plan is registered **before** the holdout is unsealed for that question.
3. **Data-access declaration.** Each pre-registration states what the authors have already seen (aggregate dashboards, exploratory-split results), as Weston 2019 recommends.

**Registered Reports.** Submit H1, H4 and H6 as Stage 1 Registered Reports. Acceptance in principle before results protects null findings, which this programme expects for H6 (Chambers & Tzavella 2020/2022 [V preprint]).

### 10.2 Analytic robustness

- **Multiverse or specification curve** for the main observational claims (Steegen et al. 2016 [V]; Simonsohn, Simmons & Nelson 2020 [S]). Pre-specify the set of defensible choices (exclusions, ASR-confidence thresholds, KC mapping, linking method) and report the whole distribution.
- **Multiplicity.** The confirmatory family is H1-H8, using Holm, or Bayesian decision rules stated in advance. Exploratory analyses use Benjamini-Hochberg FDR (1995 [V]) and are labelled exploratory. Many MRT moderators: shrink them hierarchically rather than testing each.
- **Effect-size interpretation.** Use education benchmarks (Kraft 2020 [V]), not Cohen's. Large-scale RCTs average 0.06 SD with CI widths of about 0.30 (Lortie-Forgues & Inglis 2019 [V]). Power for a SESOI of 0.10 SD on external outcomes, and say in advance what a null means.

### 10.3 Sharing within child-data constraints

- **Code:** all analysis code, simulation code and model files are public.
- **Data:** no raw transcripts or audio, ever.
  - De-identified, event-level extracts (`EvidenceEvent` and `DecisionRecord` with pseudonymous IDs, month-level dates and coarsened age) go to controlled-access release under a data-use agreement, in the spirit of PSLC DataShop [S] and the ASSISTments experiment datasets (Selent et al. 2016 [S]).
  - Apply FAIR principles (Wilkinson et al. 2016 [V]).
  - Suppress small cells (k < 10 per stratum) [U threshold].
  - A synthetic dataset matching the marginals ships for reproducibility checks [U method].
  - **Gated by DPDP counsel** (dpdp-deep §7.10, s.17(2)(b)): research extracts are separate, de-identified at export and never joined back.
- **Open education science** framing: transparency at each stage (van der Zee & Reich 2018 [V]). Education-specific pre-registration guidance: Gehlbach & Robinson 2018 [S].
- **Negative results are published and change the product** (LOT, MH and TV kill criteria).

---

## 11. Ethics: approval, consent, assent, wellbeing

### 11.1 Which committee and which rules

- **ICMR National Ethical Guidelines (2017)** cover "all biomedical, social and behavioural science research *for health*" in India [V]. Learning research is not health research. **There is no statutory national IRB requirement for educational research** [U], but journals, OSF Registered Reports and any university co-investigator will require approval by an institutional ethics committee (IEC). **Use ICMR 2017 as the standard** and obtain approval from a registered university IEC with a child-development member and a lay member [U: whether that committee should be registered with the Department of Health Research].
- **Risk classification under ICMR Table 2.1** [V]:
  - "Minimal risk" is harm no greater than ordinary daily life.
  - "Routine research on children and adolescents" and "use of personal identifiable data in research" are listed as **minor increase over minimal risk**.
  - So expect **full-committee review**, not expedited review.
- **Exemption does not apply.** Table 4.2 exempts "comparison of instructional techniques, curricula, or classroom management methods" only for proposals "with less than minimal risk where there are **no linked identifiers**" [V]. Taxila's longitudinal design is identifier-linked by construction.
- **Consent waiver** (Box 5.2 [V]) covers retrospective de-identified data. That might cover analyses of *historical* pre-study logs, but not the prospective study.

### 11.2 Consent and assent (verified clauses, applied)

| ICMR requirement [V] | Taxila implementation [U] |
|---|---|
| One parent's consent "may be considered sufficient" for ≤ minimal risk or direct benefit; both parents may be needed for more than minimal risk with no benefit (Box 6.5) | one verified parent (DPDP Rule 10 route) for the main study; the committee decides for sub-studies with questionnaires |
| Assent from children aged 7-18 (§6.5.4) | in-app assent at enrolment, at age birthdays (7, 12) and annually |
| < 7: "no need to document assent" (Box 6.6) | still explained, and dissent still honoured (behavioural refusal ends research tasks) |
| 7-12: verbal/oral assent "in the presence of the parents/LAR and should be recorded" | a neutral narrator, never the tutor persona (LAM-D11), with the parent present; the recorded "yes" is stored in the consent record |
| 12-18: written assent, also signed by the parent | in-app signature by child plus parent |
| "If the child objects, this wish has to be respected … mere failure to object should not be construed as assent" | **in-session dissent signals** ("I don't want to", repeated skips of a research-only task) stop that task, are logged, and trigger an assent re-check |
| Refusal must not compromise the "treatment at the centre" | declining research leaves the product unchanged except that the child gets the deterministic default policy (LAM-D10) |
| Assent form language matches developmental level | three age-band scripts, cognitively pre-tested with children in Hindi and English |
| Incomplete disclosure needs committee approval and debriefing (§5.11; §9.2.9) | the MRT disclosure ("we try different good ways and see what helps") plus an annual debrief |

### 11.3 Law and safeguarding

- **DPDP.** Service processing, including equipoise-bounded randomisation, rests on verified parental consent for P1. Research analysis rests on P4 *and* possibly the s.17(2)(b) exemption ([V, DPDP]). That exemption fails if results feed decisions about a specific child, so **research extracts never write back to a child's profile**. The s.9(3) behavioural-monitoring question (dpdp-deep Q1) must be answered before launch.
- **Safeguarding.** Transcripts can contain disclosures. The protocol needs a safeguarding SOP: the flagging path (NM-11), a designated lead, and the reporting route. POCSO reporting duties (ss.19-21) are unreviewed (dpdp-deep Q7 [U]) and must be resolved before ethics submission.
- **Independent monitoring.** A three-person group (a child psychologist, an independent biostatistician, a parent representative) reviews harm markers (LAM-D12), complaint and opt-out rates and subgroup imbalances quarterly. It can pause any experiment.

### 11.4 Learning-analytics ethics beyond the committee

Learning analytics presumes that knowing a learner's behaviour is advantageous. That assumption must be justified, and students treated as agents rather than data subjects (Slade & Prinsloo 2013 [V]). The DELICATE checklist (Drachsler & Greller 2016 [S]) gives operational checks. Taxila adds three:
- **benefit return:** families receive the aggregate findings in plain Hindi and English;
- **equity audit:** effects and harms by language, region, gender and device class;
- **no commercial use** of research-only data.

---

## 12. Comparable studies and what each teaches Taxila

| programme | what it did | what to copy | what to avoid | tag |
|---|---|---|---|---|
| **ASSISTments / E-TRIALS** | a platform that lets external researchers run RCTs inside homework (Heffernan & Heffernan 2014 [S]; Ostrow et al. 2016 "ALI" [S]); public multi-experiment datasets (Selent et al. 2016 [S]); a school-level RCT with 2,850 7th graders in 43 Maine schools that raised end-of-year maths scores (Roschelle et al. 2016 [V]); remnant-based precision (Gagnon-Bartsch 2023 [V]); principal stratification on mastery (Sales & Pane 2019 [S]). The E-TRIALS name for the testbed is [S] | **embedded experiments as infrastructure**; remnant adjustment; public datasets; teacher-facing value | many small experiments with immediate outcomes are underpowered and rarely replicate [U] | mixed |
| **Eedi** | a large dataset of answers to diagnostic MCQs whose distractors encode misconceptions; NeurIPS 2020 challenge (Wang et al. 2020/2021 [V]); LearnLM × Eedi supervised tutoring RCT, 165 students (+5.5 pp on novel problems) ([V, LS]); larger 4-arm RCT results pending | misconception-coded distractors as measurement; a human-in-loop RCT | MCQ-only evidence; immediate outcomes | V |
| **Duolingo** | half-life regression (HLR) for forgetting (Settles & Meeder 2016 [S]); a "sleeping, recovering" bandit for notifications (Yancey & Settles 2020 [S]); an outcomes study of 225 adult beginners reaching ACTFL Intermediate Low in reading, **without a control group** (Jiang et al. 2021 [V]) | HLR-C (LOT §5.4); notification experiments with recovery dynamics | **no external RCT**; optimisation for engagement metrics; streak mechanics (MH-D6) | V/S |
| **Mindspark (India)** | lottery RCT in Delhi: +0.37 SD maths, +0.23 SD Hindi in 4.5 months; IV for 90 days: 0.6/0.39 SD; similar absolute gains across baseline levels (Muralidharan, Singh & Ganimian 2019, *AER* [V]); a Rajasthan government-school evaluation registered (AEARCTR-0002546 [S]) | **lottery or delayed-start design; IV for dose; external tests; level-targeting** | after-school centre setting, not D2C home voice; generalising from it to Taxila is [U] | V |
| **Math Garden (Rekentuin, NL)** | adaptive practice for children with on-the-fly ability and difficulty ratings (Klinkenberg, Straatemeier & van der Maas 2011 [S]); a decade and over a billion responses used to both steer and study learning (Brinkhuis et al. 2018 [V]); fast vs slow strategy decomposition from response times in children's multiplication (Hofman et al. 2017 [V]) | **the closest precedent for developmental science from a children's learning product**; response-time models | rating systems drift; publication on log data without randomisation | V |
| **Cognitive Tutor / MATHia** | matched-pair school RCT in seven states: no year-1 effect, evidence of a positive year-2 effect (Pane et al. 2014 [V]); learning-rate regularity in 1.3 M observations (Koedinger et al. 2023 [V]) | expect implementation lag; learning-curve methods | mastery-exit MNAR (T2) | V |
| **HeartSteps** (health, as the MRT template) | 6-week MRT with 44 adults; suggestions +14% 30-min steps (p = .06), effect decaying over days (Klasnja 2019 [V]); then an RL-personalised version (Liao et al. 2020 [S]) | **the MRT protocol, analysis and reporting template** | adult health context | V |
| **Kizilcec et al. 2020 (PNAS)** | 250k students, 247 courses; established behavioural interventions produced much smaller effects than prior studies; cyclic pre-registration across waves [V] | **iterative pre-registration across waves**; heterogeneity by context | assuming published effect sizes | V |
| **Schmucker et al. 2025** | 1 M students, 43,000 assistance actions, MAB and contextual bandits with OPE; personalised policies rarely beat good uniform ones [V] | OPE before online tests; expect small heterogeneity | over-investing in per-child personalisation | V |
| **ZPDES** (Clément et al. 2013/2015) | learning-progress bandit sequencing for 7-8-year-olds [V arXiv] | progress-based exploration for young children | — | V |
| **Khanmigo two-year RCT** | 0.06-0.08 SD/year; engagement was the bottleneck ([V, LS]) | power for small effects; measure initiative | passive tutor designs | V |

---

## 13. Study design draft: "How Indian children learn with an AI tutor: a longitudinal study of N children"

### 13.1 Aims

1. **Describe** how learning, forgetting, motivation, habits and interaction style develop from 6 to 15 in Indian children using an AI tutor, with measurement invariance established.
2. **Test mechanisms** (which teaching moves cause durable learning, for whom) with embedded MRTs.
3. **Test the personalisation claim:** does per-child format adaptation beat population-best formats?
4. **Estimate efficacy** on external, delayed outcomes.
5. **Publish the measurement:** reliability, validity and invariance of embedded measures, as a public good.

### 13.2 Design overview

```
             month 0      3        6        9        12       15       18
cohorts C1..C9 (classes 1-9 at enrolment; accelerated, overlapping in age)
all:        [enrol+assent][================ continuous logs + embedded MRTs ===============]
linking forms (fresh items, all):  F0        F3       F6       F9       F12      F15      F18
external sub-study (n≈600):        X0                 X6                X12               X18
E-PROFILE (between-child RCT):              [==== 12 wk ====][1- and 4-wk delayed tests]
delayed-start efficacy sub-cohort (n≈600): randomise start now vs +3 months; X0, X3 (both arms)
gates G1-G4 (pilot n≈300, months −3..0): ASR WER (LS E1), grader κ (E2), reliability (CD S1), DIF screen
```

### 13.3 Population and sampling

- **Frame:** families who install Taxila and pass verified parental consent, plus partner schools for the delayed-start sub-cohort. The latter recruits from waitlists or partner schools so that "no Taxila for 3 months" means usual schooling, not denial of a product the family already uses.
- **Strata:** class (1-9) × medium (Hindi / English) × region (4 zones) [U]. Oversample Hindi-medium and government-school children, who are under-represented among app users [U]. Cap any one city at ≤ 25%.
- **Eligibility:** age 6-15, class 1-9, a device meeting minimum spec, P4 consent and age-appropriate assent.
- **Exclusions:** none on ability. Children with disabilities are included with accommodation, and analyses report how many.

### 13.4 Sample size (why N ≈ 4,000 enrolled)

| requirement | basis | children needed (analysable) |
|---|---|---|
| MRT 3 pp effect, power ≥ .80, **per age band** (4 bands) | *computed* §3.4: 400 × 30 points → .83 | 4 × 400 = **1,600** |
| E-PROFILE: superiority SESOI 0.10 SD on delayed matched items, power .80, covariate R² ≈ .5 [U], bandit-arm inefficiency ×1.5 (§4.2) | n/arm ≈ 2·(2.8)²·(1−.5)/0.10² ≈ 784, × 1.5 ≈ 1,180 | ≈ 2,350 (both arms) |
| DIF / invariance by medium × band (8 groups) | ≈ 300 per group for stable IRT DIF [U] | 2,400 |
| GMM exploration | §6.4 sim shape | 1,000+ |
| Delayed-start efficacy, MDES at R² = .5 | 2.8·√(2·0.5/300) ≈ **0.16 SD** with 300 per arm | 600 (separate sub-cohort) |

- **Attrition:** assume 50% active at 12 months and 40% at 18 months [U]. The law of attrition applies (MH).
- **Target:** **N = 4,000 enrolled** in the main cohort, plus 600 in the efficacy sub-cohort. Expect about 2,000 analysable at month 12 and about 1,600 at month 18.
- **If attrition is worse:** MRT and invariance aims survive, because they use within-child data from whoever is active. E-PROFILE is the first aim to lose power. The pre-registration says so.

### 13.5 Measures

- **Continuous logs:** `EvidenceEvent` (KT §1.1), `DecisionRecord` (§2.2), session records with `started_by` (MH-D4), interaction-signature features (TV/VT), language-mix estimates and ASR confidence.
- **Linking forms:** 12-minute, game-framed forms every 3 months, drawn from a reserved pool never used in teaching, with common items across adjacent classes for vertical linking (§6.3).
- **External** (sub-study, §9): oral reading and arithmetic tool, a curriculum-aligned form, questionnaires (TV §5.7, MH5-MH6).
- **Harm and wellbeing:** compulsion markers (MH §7), parent-pressure items (LOT10, MH10), distress flags, opt-outs.
- **Covariates (minimised):** month and year of birth, state, school type, medium, class, device class, household language(s). **No caste, religion or income items** (LS §8.5). SES is proxied, if at all, by school type plus an optional asset index in the consented sub-study only [U].

### 13.6 Frozen research policy windows

The product changes weekly (T7). Confirmatory estimands are defined on **policy windows**: 6-week periods in which the MRT components, randomisation probabilities and the prompts that implement them are frozen and versioned. Changes outside the studied components are allowed but logged. Analyses include `policy_version` fixed effects.

### 13.7 Hypotheses (confirmatory, pre-registered; each with estimand, prediction and falsification)

| H | hypothesis | estimand / model | design | prediction [U] | falsified if | builds on |
|---|---|---|---|---|---|---|
| **H1** | Access to Taxila improves **external, delayed** maths and reading outcomes | ITT difference at month 3 on external tests, ANCOVA on X0 with remnant adjustment (§7.2); IV dose-response (Mindspark design) | delayed-start RCT, n = 600 | +0.10 to +0.25 SD maths (Mindspark 0.37 in 4.5 months [V] is the ceiling; Kraft shrinkage [S, LS]) | upper bound of the 90% CI < 0.10 SD; reported as a null with its CI | LS rule 36 |
| **H2** | Children 6-15 differ far more in prior knowledge than in learning rate per opportunity, *under MNAR-robust data* | σ_intercept vs σ_slope in iAFM on fixed-length calibration sequences, by band | observational + calibration sequences (LOT §5.8.3) | slope SD < 0.04 logit/opportunity in every band; ratio > 5 | slope SD ≥ 0.04 with test-retest r ≥ .6 | LOT H1; Koedinger 2023 [V] |
| **H3** | Once degree of original learning is equated, forgetting slows with age | φ_0 by band in the joint model (LOT §5.5) with S_ck conditioning; within-child drift of φ_c | M-LAG MRT jitter + ALD | monotone decline in φ_0 across bands, posterior P > .9 | slope of φ_0 on band has P(decline) < .5 | LOT H3 (Brainerd) |
| **H4** | Retrieval-and-explanation probes cause better next-session retrieval, with larger effects at 10-15 for teach-back | causal excursion effect β(band) on delayed success, WCLS (§3.1) | M-PROBE MRT | +3 to +6 pp overall; band interaction > 0 for teach-back | upper bound of the overall β 95% CI < 2 pp | LS E5, rule 4 |
| **H5** | **Expertise reversal in children:** worked-example-first beats attempt-first for low prior knowledge, and the advantage shrinks or reverses as θ rises | excursion effect moderated by θ_it (centred); slope of β on θ < 0 | M-WE MRT (within equipoise bounds) | negative moderation; crossover near median θ for the band | moderation slope ≥ 0 with P > .9 | LS §2.5, F2/F8 (Tetzlaff 2025 [S, LS]) |
| **H6** | **Per-child format personalisation does not beat population-best formats** on delayed learning (pre-registered as an equivalence test) | E-PROFILE ITT on matched delayed items at 1 and 4 weeks; TOST with ±0.10 SD bounds; plus posterior τ of child × format effects | between-child RCT (LS §8.7), batched-OLS inference in the profile arm (§4.3) | equivalence within ±0.10 SD; τ < 0.2 logit | profile arm superior by > 0.10 SD (then the LS kill criterion reverses) | LS §8.7 E6; Schmucker 2025 [V] |
| **H7** | Within children, competence gains predict later autonomous engagement more than engagement predicts later competence | RI-CLPM / DSEM cross-lags: β(mastery → self-start share) > β(self-start → mastery), monthly | observational panel, disaggregated (§6.5) | β_c→m > β_m→c, P > .9 | reverse ordering, or both ≈ 0 | MH H4 (Talsma 2018 [V, MH]) |
| **H8** | Learning habits are context-bound: **anchored** repetition predicts future self-started sessions beyond total repetition, and re-anchor offers raise self-starts | recurrent-event model β_H (MH §5.4); M-ANCHOR excursion effect on 48-h self-start | observational + M-ANCHOR MRT | β_H > 0; offer effect +2-5 pp | β_H ≤ 0 after adjusting for α_c and total sessions | MH H1-H2, H6 |

**Measurement gates** must pass before the relevant hypothesis is tested; all are reported in the measurement paper:
- **G1 invariance:** scalar or partial invariance of θ across medium and modality (§8).
- **G2 reliability:** CD S1 and TV TM2 thresholds for any measure used as a moderator.
- **G3 external validity:** r ≥ .60 for θ against external maths and reading (§9).
- **G4 ASR:** WER and endpointing by band and language within LS E1 limits; otherwise spoken-only items are excluded from confirmatory models.

**Exploratory** analyses are labelled and replicated on the holdout before any claim: growth-mixture trajectories (§6.4), EF structure differentiation (CD S2), LST of interaction signatures (TV S-TV1), affect-transition structure (MH H5), the spacing ridgeline (LOT H4), break effects (LOT H7), and cognitive "weather" (CD S6), the last under research-only consent because it uses time of day (§17).

### 13.8 Analysis plan essentials

- **Estimation:** §5 workflow for every model. MRT estimands via WCLS with CR2 standard errors; a Bayesian hierarchical analogue as sensitivity.
- **Missing data:** within-child missingness is modelled (MAR given the ledger). Dropout uses shared-parameter joint models of θ trajectory and dropout hazard (MH §5.7), plus δ-adjusted pattern-mixture sensitivity (dropouts' θ shifted by δ ∈ {−0.25, −0.5} GE [U]). ITT and "active" populations are reported separately.
- **Multiplicity:** Holm across H1-H8 primary estimands. Secondary estimands use FDR.
- **Heterogeneity:** pre-specified moderators only (band, medium, θ, gender, device class). Causal forests are exploratory (§7.2).
- **Deviations:** a public log of every deviation from the pre-registration, with dates.

### 13.9 Outputs (papers)

1. **Measurement paper (G1-G4):** "Reliability and invariance of embedded learning measures in Indian children using a voice AI tutor". Data descriptor plus controlled-access dataset.
2. **H1:** efficacy Registered Report.
3. **H4 + H5:** "Micro-randomised trials of teaching moves in an AI tutor: retrieval, explanation and expertise reversal in children 6-15".
4. **H6:** "Personalising teaching formats per child does not beat population-best formats", as a Registered Report. It is publishable either way, and the null is the expected and more valuable result.
5. **H2 + H3:** learning rate and forgetting across ages 6-15 under MNAR-robust design.
6. **H7 + H8:** competence, motivation and habit formation in children's learning.

---

## 14. What can be said to parents (from this study)

- **About the study:** "Taxila is part of a research study on how children learn. We sometimes try two good ways of teaching and check which helps children remember a week later. Your child always gets the core lessons. You can stop research participation at any time without changing Taxila."
- **About findings (aggregate, after publication):** "Across 2,000 children, asking a child to explain an idea back helped them remember it a week later, more so for older children." Always framed as *on average*, never as a finding about their child (Fisher 2018).
- **About their child:** only what sibling contracts allow (LOT §7, MH §6, CD §8.2, TV §9). This study adds no new per-child labels, scores or classes (LAM-D6, LAM-D7).
- **Never:** trajectory "types", risk scores, cross-child ranks, or "your child is in the slow-forgetting group".

---

## 15. Measurements this design depends on

| id | question | method | decides | bar [U] |
|---|---|---|---|---|
| LAM1 | Are propensities and availability logged correctly? | replay audit: re-draw from logged p and seed; compare chosen actions | every causal analysis | 100% reproducible |
| LAM2 | Real decision-point counts per child per policy window | pilot logs | MRT T in §3.4 | ≥ 30 eligible M-PROBE points per child per 6 weeks |
| LAM3 | τ of child × format effects | E-PROFILE pilot, hierarchical | LAM-D7 reversal; H6 | τ ≥ 0.5 reverses D7 |
| LAM4 | Bandit-floor simulation at the real event distribution | sim §B with pilot rates | LAM-D3 floor | type-I ≤ .055 |
| LAM5 | First-stage strength of the school-entry RD | month of birth × state vs class | §6.2 RD | F ≥ 10 |
| LAM6 | Vertical-linking stability | concurrent vs separate calibration | §6.3 growth claims | GE growth estimates differ < 0.2 GE |
| LAM7 | Attrition by stratum | months 3, 6, 12 | §13.4 power | ≥ 50% active at 12 months |
| LAM8 | Assent comprehension | cognitive interviews: 30 children per band × 2 languages | the §11.2 scripts | ≥ 80% correctly say they can stop |
| LAM9 | Harm-marker baseline rates | first 3 months | LAM-D12 stopping thresholds | thresholds set at baseline + pre-registered margin |

---

## 16. Invariants (eval-gated; "if your change trips them, your change is wrong")

| id | predicate | method |
|---|---|---|
| LAMI1 | Every randomised or adaptive Director decision writes a `DecisionRecord` with `p`, `available`, `draw` and `policy_version` | schema test plus replay audit (LAM1) |
| LAMI2 | No randomised arm violates hard constraints (expertise-reversal gate except in M-WE, retention ≥ 0.6, session caps, distress) | unit tests on the allocation function with adversarial contexts |
| LAMI3 | Bandit allocations respect the floor: min_a p(a) ≥ 0.10 for every research-allocated decision | log check |
| LAMI4 | Children without P4 consent receive deterministic default actions and are absent from research extracts | extract builder test |
| LAMI5 | Research extracts never write to any child-facing or parent-facing table | dataflow audit (DPDP s.17(2)(b)) |
| LAMI6 | No trajectory class, MRT moderator estimate or per-child causal effect appears in parent or child text | lexicon and schema gate (extends MHI1, TVI1) |
| LAMI7 | Confirmatory-holdout reads are logged and blocked unless an OSF registration ID is attached to the job | pipeline guard |
| LAMI8 | Assent is presented by the neutral narrator, never the tutor persona voice or name | UI string and voice-asset audit |

---

## 17. Conflicts with sibling documents, and the proposed resolution

1. **LS §8.4 "≥ N delayed comparisons (likely ≥ 8-10)".** *Computed* §5.4: ρ = .70 needs 78-217 per arm at τ = 0.5-0.3. **Proposal:** replace the line with "no per-child format claim in v1 (LAM-D7); revisit after LAM3". This is consistent with TV TV4 (37-150 contrast trials, computed there under different τ).
2. **CD S6 (cognitive weather, which uses time of day)** versus LOT invariant 4 and MHI3 (no clock time-of-day features). Both invariants are scoped to *their own* models, so this is not strictly a contradiction. **Proposal:** time-of-day stays out of `DecisionRecord.context` and every product model. CD S6 runs only under research consent on a separate extract, never feeding back (LAMI5).
3. **LS §8.7 "power with ≥ 2× bandit inflation".** Consistent with §4.2 (×1.5-2 depending on floor). **Proposal:** cite the computed table and require batched-OLS inference (LAM-D3).
4. **LS §8.4 allocation step 2 (floor "e.g., ≥ 10-20%").** Consistent; LAM-D3 fixes it at ≥ .10.
5. **TV S-TV3 and MH H7 both propose an MRT on feedback type.** Merge them into one M-FB component with both proximal outcomes, so the same children are not randomised twice on overlapping moves.

---

## 18. Open questions

1. **IEC home.** Which university committee will review a D2C EdTech study? Does it need to be registered with the Department of Health Research? Are there education-research norms beyond ICMR (e.g. a university's own code) [U]?
2. **Delayed-start ethics in D2C.** Is a 3-month delayed start acceptable to families who sought the product? Partner schools or waitlists are cleaner, but less representative.
3. **School-entry cutoffs.** Are state-by-year cutoff tables available and reliable enough for a fuzzy RD [U]?
4. **ASR non-invariance.** If G4 fails for Hinglish in band A (ages 6-7), can tap-only measurement carry those children's confirmatory outcomes without biasing comparisons?
5. **Excursion effects under a changing background policy.** How should MRT results from successive policy windows be pooled? A random effect per window is the default proposal [U].
6. **Data sharing under DPDP.** Is a de-identified event-level release possible at all for children, or only a synthetic dataset plus secure enclave access?
7. **Sibling contamination.** Siblings sharing a device and a family routine violate independence. Cluster on household when `household_id` exists [U].

---

## 19. Proposed `context/` entries (for the main loop to merge)

- **decision** `decision-records-with-propensities` (LAM-D1), `mrt-for-teaching-moves` (D2), `bandit-floor-and-adaptive-inference` (D3), `accelerated-longitudinal-umbrella-study` (D4), `three-clocks-model` (D5), `gmm-exploratory-only` (D6), `no-per-child-causal-claims-v1` (D7), `invariance-before-comparison` (D8), `sealed-holdout-preregistration` (D9), `two-tier-consent-research` (D10), `neutral-narrator-assent` (D11), `harm-outcomes-co-primary` (D12). Each carries its §0 reversal condition.
- **measurement** `lam-design-sim-2026-10-02`. Method: `learning-analytics-methods-sim.py`, numpy, fixed seeds. Results:
  - MRT power .83 for 3 pp at N = 400, T = 30; type-I .060 at N = 200 (400-1,000 reps per cell).
  - Thompson sampling with no floor: naive type-I .111; uniform-allocation power .63 vs .41-.54 adaptive (1,000 reps).
  - GMM on one skewed population: k ≥ 2 by BIC in 100/100 (1,000 children × 12 waves).
  - Per-child ρ = .70 needs 78/217/487 comparisons per arm at τ = .5/.3/.2.
  - All assumptions [U].
- **rejected (literature-based, not tried in-house)**:
  - `naive-tests-on-bandit-data`: Zhang 2020; sim §B.
  - `gmm-learner-types-for-parents`: Bauer & Curran 2003; Sher 2011; sim §C.
  - `clpm-for-reciprocal-claims`: = MH, adds Hamaker 2015 [V].
  - `icmr-exemption-for-instructional-comparison`: requires no linked identifiers [V].
  - `per-child-format-claim-at-8-10-comparisons`: supersedes LS §8.4's guess; sim §D.

---

## 20. References

Tags as in the header.

**Micro-randomised trials and adaptive interventions**
- Klasnja, P., Hekler, E. B., Shiffman, S., Boruvka, A., Almirall, D., Tewari, A., & Murphy, S. A. (2015). Microrandomized trials: an experimental design for developing just-in-time adaptive interventions. *Health Psychol*. doi:10.1037/hea0000305 [V]
- Liao, P., Klasnja, P., Tewari, A., & Murphy, S. A. (2016). Sample size calculations for micro-randomized trials in mHealth. *Stat Med*. doi:10.1002/sim.6847 [V]
- Boruvka, A., Almirall, D., Witkiewitz, K., & Murphy, S. A. (2018). Assessing time-varying causal effect moderation in mobile health. *JASA*. doi:10.1080/01621459.2017.1305274 [V]
- Qian, T., Walton, A. E., Collins, L. M., Klasnja, P., Lanza, S. T., Nahum-Shani, I., et al. (2022). The microrandomized trial for developing digital interventions: experimental design and data analysis considerations. *Psychol Methods*. doi:10.1037/met0000283 [V]
- Qian, T., Yoo, H., Klasnja, P., Almirall, D., & Murphy, S. A. (2021). Estimating time-varying causal excursion effects in mobile health with binary outcomes (with discussion and rejoinder). *Biometrika*. Rejoinder doi:10.1093/biomet/asab033 [S main paper; V rejoinder record]
- Klasnja, P., Smith, S., Seewald, N. J., et al. (2019). Efficacy of contextually tailored suggestions for physical activity: a micro-randomized optimization trial of HeartSteps. *Ann Behav Med*. doi:10.1093/abm/kay067 [V]
- Nahum-Shani, I., Smith, S. N., Spring, B. J., et al. (2018). Just-in-time adaptive interventions (JITAIs) in mobile health. *Ann Behav Med*. doi:10.1007/s12160-016-9830-8 [V]
- Bidargaddi, N., Almirall, D., Murphy, S., et al. (2018). To prompt or not to prompt? A microrandomized trial of time-varying push notifications. *JMIR mHealth uHealth*. doi:10.2196/10123 [V]
- Murphy, S. A. (2005). An experimental design for the development of adaptive treatment strategies. *Stat Med*. doi:10.1002/sim.2022 [S]
- Collins, L. M., Murphy, S. A., & Strecher, V. (2007). The multiphase optimization strategy (MOST) and the sequential multiple assignment randomized trial (SMART). *Am J Prev Med*. doi:10.1016/j.amepre.2007.01.022 [S]
- Nahum-Shani, I., Dziak, J. J., Walton, M. A., & Dempsey, W. (2022). Hybrid experimental designs for intervention development: what, why, and how. *AMPPS*. doi:10.1177/25152459221114279 [S]
- Liao, P., Greenewald, K., Klasnja, P., & Murphy, S. (2020). Personalized HeartSteps: a reinforcement learning algorithm for optimizing physical activity. *Proc ACM IMWUT*. doi:10.1145/3381007 [S]
- Trella, A. L., Zhang, K. W., Nahum-Shani, I., Shetty, V., Doshi-Velez, F., & Murphy, S. A. (2022). Designing reinforcement learning algorithms for digital interventions: pre-implementation guidelines. arXiv:2206.03944 [V]

**Bandits, adaptive inference, off-policy evaluation, switchbacks**
- Rafferty, A., Ying, H., & Williams, J. J. (2019). Statistical consequences of using multi-armed bandits to conduct adaptive educational experiments. *J Educ Data Mining* 11. [S, LS]
- Zhang, K. W., Janson, L., & Murphy, S. A. (2020). Inference for batched bandits. *NeurIPS*. arXiv:2002.03217 [V]
- Hadad, V., Hirshberg, D. A., Zhan, R., Wager, S., & Athey, S. (2021). Confidence intervals for policy evaluation in adaptive experiments. *PNAS*. doi:10.1073/pnas.2014602118 [V]
- Shin, J., Ramdas, A., & Rinaldo, A. (2021). On the bias, risk, and consistency of sample means in multi-armed bandits. *SIAM J Math Data Sci*. doi:10.1137/20M1361249 [V]
- Kasy, M., & Sautmann, A. (2021). Adaptive treatment assignment in experiments for policy choice. *Econometrica* (SSRN 2019 doi:10.2139/ssrn.3434834) [S]
- Howard, S. R., Ramdas, A., McAuliffe, J., & Sekhon, J. (2021). Time-uniform, nonparametric, nonasymptotic confidence sequences. *Ann Stat*. doi:10.1214/20-AOS1991 [S]
- Johari, R., Koomen, P., Pekelis, L., & Walsh, D. (2022). Always valid inference: continuous monitoring of A/B tests. *Oper Res*. doi:10.1287/opre.2021.2135 [V]
- Yao, J., Brunskill, E., Pan, W., Murphy, S., & Doshi-Velez, F. (2020). Power constrained bandits. arXiv:2004.06230 [V]
- Dudík, M., Erhan, D., Langford, J., & Li, L. (2014). Doubly robust policy evaluation and optimization. *Stat Sci*. doi:10.1214/14-STS500 [S]
- Doroudi, S., Aleven, V., & Brunskill, E. (2019). Where's the reward? A review of reinforcement learning for instructional sequencing. *IJAIED*. doi:10.1007/s40593-019-00187-x [S]
- Mandel, T., Liu, Y.-E., Levine, S., Brunskill, E., & Popović, Z. (2014). Offline policy evaluation across representations with applications to educational games. *AAMAS*. [U]
- Bojinov, I., Simchi-Levi, D., & Zhao, J. (2023). Design and analysis of switchback experiments. *Manage Sci*. doi:10.1287/mnsc.2022.4583 [V]
- Schmucker, R., Pachapurkar, N., Bala, S., Shah, M., & Mitchell, T. (2025). Learning to optimize feedback for one million students. arXiv:2508.00270 [V]
- Clément, B., Roy, D., Oudeyer, P.-Y., & Lopes, M. (2013/2015). Multi-armed bandits for intelligent tutoring systems. arXiv:1310.3174; *JEDM* 2015 [V arXiv]

**Bayesian workflow and hierarchical models**
- Gelman, A., Vehtari, A., Simpson, D., Margossian, C. C., Carpenter, B., et al. (2020). Bayesian workflow. arXiv:2011.01808 [V]
- Talts, S., Betancourt, M., Simpson, D., Vehtari, A., & Gelman, A. (2018). Validating Bayesian inference algorithms with simulation-based calibration. arXiv:1804.06788 [V]
- Vehtari, A., Gelman, A., & Gabry, J. (2017). Practical Bayesian model evaluation using leave-one-out cross-validation and WAIC. *Stat Comput*. arXiv:1507.04544 [V]
- Vehtari, A., Gelman, A., Simpson, D., Carpenter, B., & Bürkner, P.-C. (2021). Rank-normalization, folding, and localization: an improved R̂. *Bayesian Anal*. arXiv:1903.08008 [V]
- Bürkner, P.-C. (2017). brms: an R package for Bayesian multilevel models using Stan. *J Stat Softw* 80(1). doi:10.18637/jss.v080.i01 [S]
- Fisher, A. J., Medaglia, J. D., & Jeronimus, B. F. (2018). Lack of group-to-individual generalizability is a threat to human subjects research. *PNAS*. doi:10.1073/pnas.1711978115 [V]

**Longitudinal design, growth, mixtures, dynamics**
- Galbraith, S., Bowden, J., & Mander, A. (2017). Accelerated longitudinal designs: an overview of modelling, power, costs and handling missing data. *Stat Methods Med Res*. doi:10.1177/0962280214547150 [V]
- Raudenbush, S. W., & Liu, X.-F. (2001). Effects of study duration, frequency of observation, and sample size on power in studies of group differences in polynomial change. *Psychol Methods* 6:387. doi:10.1037/1082-989X.6.4.387 [S]
- Cahan, S., & Cohen, N. (1989). Age versus schooling effects on intelligence development. *Child Dev*. doi:10.2307/1130797 [S]
- Ritchie, S. J., & Tucker-Drob, E. M. (2018). How much does education improve intelligence? A meta-analysis. *Psychol Sci* (preprint doi:10.31234/osf.io/kymhp) [V, CD]
- Briggs, D. C., & Weeks, J. P. (2009). The impact of vertical scaling decisions on growth interpretations. *Educ Meas Issues Pract*. doi:10.1111/j.1745-3992.2009.00158.x [V]
- Bond, T. N., & Lang, K. (2013). The evolution of the Black-White test score gap in grades K-3: the fragility of results. *Rev Econ Stat* (NBER w17960, 2012) [S]
- Muthén, B., & Shedden, K. (1999). Finite mixture modeling with mixture outcomes using the EM algorithm. *Biometrics*. doi:10.1111/j.0006-341X.1999.00463.x [V]
- Bauer, D. J., & Curran, P. J. (2003). Distributional assumptions of growth mixture models: implications for overextraction of latent trajectory classes. *Psychol Methods* 8:338. doi:10.1037/1082-989X.8.3.338 [V]
- Sher, K. J., Jackson, K. M., & Steinley, D. (2011). Alcohol use trajectories and the ubiquitous cat's cradle: cause for concern? *J Abnorm Psychol*. doi:10.1037/a0021813 [V]
- Infurna, F. J., & Grimm, K. J. (2017). The use of growth mixture modeling for studying resilience to major life stressors in adulthood and old age. *J Gerontol B*. doi:10.1093/geronb/gbx019 [V]
- Nylund, K. L., Asparouhov, T., & Muthén, B. O. (2007). Deciding on the number of classes in latent class analysis and growth mixture modeling: a Monte Carlo simulation study. *Struct Equ Modeling*. doi:10.1080/10705510701575396 [S]
- van de Schoot, R., Sijbrandij, M., Winter, S. D., Depaoli, S., & Vermunt, J. K. (2016/2017). The GRoLTS-checklist: guidelines for reporting on latent trajectory studies. *Struct Equ Modeling*. doi:10.1080/10705511.2016.1247646 [S]
- Nagin, D. S., & Odgers, C. L. (2010). Group-based trajectory modeling in clinical research. *Annu Rev Clin Psychol*. doi:10.1146/annurev.clinpsy.121208.131413 [V]
- Hamaker, E. L., Kuiper, R. M., & Grasman, R. P. P. P. (2015). A critique of the cross-lagged panel model. *Psychol Methods*. doi:10.1037/a0038889 [V]
- Curran, P. J., & Bauer, D. J. (2011). The disaggregation of within-person and between-person effects in longitudinal models of change. *Annu Rev Psychol*. doi:10.1146/annurev.psych.093008.100356 [V]
- Asparouhov, T., Hamaker, E. L., & Muthén, B. (2018). Dynamic structural equation models. *Struct Equ Modeling*. doi:10.1080/10705511.2017.1406803 [S]
- McNeish, D., & Hamaker, E. L. (2020). A primer on two-level dynamic structural equation models for intensive longitudinal data in Mplus. *Psychol Methods*. doi:10.1037/met0000250 [V]
- Schultzberg, M., & Muthén, B. (2018). Number of subjects and time points needed for multilevel time-series analysis. *Struct Equ Modeling*. doi:10.1080/10705511.2017.1392862 [S]

**Causal inference on observational data**
- Hernán, M. A., & Robins, J. M. (2016). Using big data to emulate a target trial when a randomized trial is not available. *Am J Epidemiol*. doi:10.1093/aje/kwv254 [V]
- Robins, J. M., Hernán, M. A., & Brumback, B. (2000). Marginal structural models and causal inference in epidemiology. *Epidemiology*. doi:10.1097/00001648-200009000-00011 [S]
- Rosenbaum, P. R., & Rubin, D. B. (1983). The central role of the propensity score in observational studies for causal effects. *Biometrika* 70:41. doi:10.1093/biomet/70.1.41 [S]
- Chernozhukov, V., Chetverikov, D., Demirer, M., Duflo, E., Hansen, C., Newey, W., & Robins, J. (2018). Double/debiased machine learning for treatment and structural parameters. *Econom J*. doi:10.1111/ectj.12097 [S]
- Wager, S., & Athey, S. (2018). Estimation and inference of heterogeneous treatment effects using random forests. *JASA*. doi:10.1080/01621459.2017.1319839 [S]
- Sales, A. C., Hansen, B. B., & Rowan, B. (2018). Rebar: reinforcing a matching estimator with predictions from high-dimensional covariates. *J Educ Behav Stat*. doi:10.3102/1076998617731518 [V]
- Gagnon-Bartsch, J. A., Sales, A. C., Wu, E., Botelho, A. F., et al. (2023). Precise unbiased estimation in randomized experiments using auxiliary observational data. *J Causal Inference*. doi:10.1515/jci-2022-0011 [V]
- Sales, A. C., & Pane, J. F. (2019). The role of mastery learning in an intelligent tutoring system: principal stratification on a latent variable. *Ann Appl Stat*. doi:10.1214/18-AOAS1196 [S]
- Lipsitch, M., Tchetgen Tchetgen, E., & Cohen, T. (2010). Negative controls: a tool for detecting confounding and bias in observational studies. *Epidemiology*. doi:10.1097/EDE.0b013e3181d61eeb [S]
- VanderWeele, T. J., & Ding, P. (2017). Sensitivity analysis in observational research: introducing the E-value. *Ann Intern Med*. doi:10.7326/M16-2607 [V]
- Cinelli, C., & Hazlett, C. (2020). Making sense of sensitivity: extending omitted variable bias. *JRSS B*. doi:10.1111/rssb.12348 [V]
- Bryan, C. J., Tipton, E., & Yeager, D. S. (2021). Behavioural science is unlikely to change the world without a heterogeneity revolution. *Nat Hum Behav*. doi:10.1038/s41562-021-01143-3 [V]

**Measurement invariance and DIF**
- Putnick, D. L., & Bornstein, M. H. (2016). Measurement invariance conventions and reporting. *Dev Rev*. doi:10.1016/j.dr.2016.06.004 [V]
- Chen, F. F. (2007). Sensitivity of goodness of fit indexes to lack of measurement invariance. *Struct Equ Modeling*. doi:10.1080/10705510701301834 [S]
- Asparouhov, T., & Muthén, B. (2014). Multiple-group factor analysis alignment. *Struct Equ Modeling*. doi:10.1080/10705511.2014.919210 [S]
- Bauer, D. J. (2017). A more general model for testing measurement invariance and differential item functioning. *Psychol Methods*. doi:10.1037/met0000077 [S]
- Chen, S. M., & Bauer, D. J. (2026). Improving the evaluation of construct change over time: longitudinal moderated nonlinear factor analysis. *Multivariate Behav Res*. doi:10.1080/00273171.2026.2640576 [V]
- Swaminathan, H., & Rogers, H. J. (1990). Detecting differential item functioning using logistic regression procedures. *J Educ Meas*. doi:10.1111/j.1745-3984.1990.tb00754.x [V]
- International Test Commission (2017). ITC guidelines for translating and adapting tests (2nd ed.). *Int J Test*. doi:10.1080/15305058.2017.1398166 [S]
- Frenzel, A. C., et al. (2012). Measurement invariance of maths interest across grades. [V, MH]

**Pre-registration, robustness, open science, effect sizes**
- Nosek, B. A., Ebersole, C. R., DeHaven, A. C., & Mellor, D. T. (2018). The preregistration revolution. *PNAS*. doi:10.1073/pnas.1708274114 [V]
- Simmons, J. P., Nelson, L. D., & Simonsohn, U. (2011). False-positive psychology. *Psychol Sci*. doi:10.1177/0956797611417632 [V]
- Weston, S. J., Ritchie, S. J., Rohrer, J. M., & Przybylski, A. K. (2019). Recommendations for increasing the transparency of analysis of preexisting data sets. *AMPPS*. doi:10.1177/2515245919848684 [V]
- Van den Akker, O. R., Weston, S., Campbell, L., Chopik, B., et al. (2021). Preregistration of secondary data analysis: a template and tutorial. *Meta-Psychology*. doi:10.15626/MP.2020.2625 [V]
- Chambers, C. D., & Tzavella, L. (2020/2022). The past, present and future of Registered Reports. MetaArXiv doi:10.31222/osf.io/43298; *Nat Hum Behav* 2022 [V preprint]
- Gehlbach, H., & Robinson, C. D. (2018). Mitigating illusory results through preregistration in education. *J Res Educ Eff* (SSRN 2017 doi:10.2139/ssrn.3025214) [S]
- van der Zee, T., & Reich, J. (2018). Open education science. *AERA Open*. doi:10.1177/2332858418787466 [V]
- Steegen, S., Tuerlinckx, F., Gelman, A., & Vanpaemel, W. (2016). Increasing transparency through a multiverse analysis. *Perspect Psychol Sci*. doi:10.1177/1745691616658637 [V]
- Simonsohn, U., Simmons, J. P., & Nelson, L. D. (2020). Specification curve analysis. *Nat Hum Behav*. doi:10.1038/s41562-020-0912-z [S]
- Benjamini, Y., & Hochberg, Y. (1995). Controlling the false discovery rate. *JRSS B*. doi:10.1111/j.2517-6161.1995.tb02031.x [V]
- Kraft, M. A. (2020). Interpreting effect sizes of education interventions. *Educ Res*. doi:10.3102/0013189X20912798 [V]
- Lortie-Forgues, H., & Inglis, M. (2019). Rigorous large-scale educational RCTs are often uninformative: should we be concerned? *Educ Res*. doi:10.3102/0013189X19832850 [V]
- Wilkinson, M. D., Dumontier, M., Aalbersberg, I. J., et al. (2016). The FAIR guiding principles for scientific data management and stewardship. *Sci Data*. doi:10.1038/sdata.2016.18 [V]
- Milkman, K. L., Gromet, D., Ho, H., et al. (2021). Megastudies improve the impact of applied behavioural science. *Nature*. doi:10.1038/s41586-021-04128-4 [S]
- Kizilcec, R. F., Reich, J., Yeomans, M., Dann, C., Brunskill, E., Lopez, G., et al. (2020). Scaling up behavioral science interventions in online education. *PNAS*. doi:10.1073/pnas.1921417117 [V]

**Ethics**
- Indian Council of Medical Research (2017). *National Ethical Guidelines for Biomedical and Health Research Involving Human Participants*. New Delhi: ICMR. Scope statement; Table 2.1 (risk); Table 4.2 (review types); Box 5.2 (waiver); §5.11 and §9.2.9 (deception and incomplete disclosure); §6.5.4 and Boxes 6.4-6.6 (children, parental consent, assent) [V, full text read]
- Meyer, M. N., Heck, P. R., Holtzman, G. S., et al. (2019). Objecting to experiments that compare two unobjectionable policies or treatments. *PNAS*. doi:10.1073/pnas.1820701116 [V]
- Kramer, A. D. I., Guillory, J. E., & Hancock, J. T. (2014). Experimental evidence of massive-scale emotional contagion through social networks. *PNAS*. doi:10.1073/pnas.1320040111 [V] (cautionary; see the journal's editorial expression of concern [U])
- Slade, S., & Prinsloo, P. (2013). Learning analytics: ethical issues and dilemmas. *Am Behav Sci*. doi:10.1177/0002764213479366 [V]
- Drachsler, H., & Greller, W. (2016). Privacy and analytics: it's a DELICATE issue. *LAK '16*. doi:10.1145/2883851.2883893 [S]
- Digital Personal Data Protection Act 2023, s.17(2)(b); DPDP Rules 2025, Rule 16 and Second Schedule. [V, DPDP]

**Comparable programmes**
- Heffernan, N. T., & Heffernan, C. L. (2014). The ASSISTments ecosystem. *IJAIED*. doi:10.1007/s40593-014-0024-x [S]
- Ostrow, K. S., Selent, D., Wang, Y., Van Inwegen, E. G., Heffernan, N. T., & Williams, J. J. (2016). The assessment of learning infrastructure (ALI). *LAK '16*. doi:10.1145/2883851.2883872 [S]
- Selent, D., Patikorn, T., & Heffernan, N. (2016). ASSISTments dataset from multiple randomized controlled experiments. *L@S '16*. doi:10.1145/2876034.2893409 [S]
- Roschelle, J., Feng, M., Murphy, R. F., & Mason, C. A. (2016). Online mathematics homework increases student achievement. *AERA Open*. doi:10.1177/2332858416673968 [V]
- Wang, Z., Lamb, A., Saveliev, E., Cameron, P., Zaykov, Y., et al. (2020). Instructions and guide for diagnostic questions: the NeurIPS 2020 Education Challenge. arXiv:2007.12061; results arXiv:2104.04034 [V]
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL*. doi:10.18653/v1/P16-1174 [S]
- Yancey, K. P., & Settles, B. (2020). A sleeping, recovering bandit algorithm for optimizing recurring notifications. *KDD*. doi:10.1145/3394486.3403351 [S]
- Jiang, X., Rollinson, J., Plonsky, L., Gustafson, E., & Pajak, B. (2021). Evaluating the reading and listening outcomes of beginning-level Duolingo courses. *Foreign Lang Ann*. doi:10.1111/flan.12600 [V]
- Muralidharan, K., Singh, A., & Ganimian, A. J. (2019). Disrupting education? Experimental evidence on technology-aided instruction in India. *Am Econ Rev*. doi:10.1257/aer.20171112 [V]
- Muralidharan, K., & Singh, A. Evaluation of a technology-aided instruction platform (Mindspark) in government schools in Rajasthan. AEA RCT Registry AEARCTR-0002546. doi:10.1257/rct.2546-1.2000000000000002 [S]
- Klinkenberg, S., Straatemeier, M., & van der Maas, H. L. J. (2011). Computer adaptive practice of maths ability using a new item response model for on the fly ability and difficulty estimation. *Comput Educ*. doi:10.1016/j.compedu.2011.02.003 [S]
- Brinkhuis, M. J. S., Savi, A. O., Hofman, A. D., Coomans, F., van der Maas, H. L. J., & Maris, G. (2018). Learning as it happens: a decade of analyzing and shaping a large-scale online learning system. *J Learn Anal* (preprint doi:10.31234/osf.io/g4z85) [V]
- Hofman, A. D., Visser, I., Jansen, B. R. J., Marsman, M., & van der Maas, H. L. J. (2017). Fast and slow strategies in multiplication. Preprint doi:10.31234/osf.io/aw3qq [V]
- Pane, J. F., Griffin, B. A., McCaffrey, D. F., & Karam, R. (2014). Effectiveness of Cognitive Tutor Algebra I at scale. *Educ Eval Policy Anal*. doi:10.3102/0162373713507480 [V]
- Koedinger, K. R., Carvalho, P. F., Liu, R., & McLaughlin, E. A. (2023). An astonishing regularity in student learning rate. *PNAS*. doi:10.1073/pnas.2221311120 [V]
- Koedinger, K. R., et al. (2010). A data repository for the EDM community: the PSLC DataShop. In *Handbook of Educational Data Mining*. doi:10.1201/b10274-10 [S]
- Motz, B. A., Carvalho, P. F., de Leeuw, J. R., & Goldstone, R. L. (2018). Embedding experiments: staking causal inference in authentic educational contexts. *J Learn Anal*. doi:10.18608/jla.2018.52.4 [V]
- Sibling-verified trials cited here (LearnLM × Eedi 2025; Khanmigo two-year RCT, Oreopoulos & Low 2026; Medly micro-RCTs; Kraft et al. tutoring at scale): see `learning-science.md` §10 [V/S, LS].
