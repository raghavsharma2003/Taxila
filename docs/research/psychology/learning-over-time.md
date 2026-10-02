# Learning over time: acquisition, forgetting, consolidation and transfer in children

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish tutor.
**Question:** How do children's skills grow with practice and decay without it? What do spacing, interference, sleep and delay do to that? Which models can Taxila fit *per child* from its logs, what can those models honestly reveal (for example "learns quickly but forgets fast" or "slow start, durable"), and how should that be told to parents?
**Builds on, does not repeat:** `docs/research/learning-science.md` §3.5 (spacing, retrieval, interleaving), §6A (three-evidence mastery), §8.3-8.4 (knowledge layer; delayed success is the format reward), §8.7 (falsification plan). `docs/research/learner/kt-algorithms.md` D2 (FSRS for T1/T2), §2.2 (retrievability gate R), §2.3 (FSRS-6), §3.2 (Glicko time inflation), §3.6 (PFA/LKT challenger), K3/K6/K7. `docs/research/learner/vibe-temperament.md` §2 legitimacy tests L1-L5 (no labels) and §4.9 (banned inferences).

**Evidence tags.** **[V]** checked this session against the primary source: abstract, full text, or code/benchmark repository. **[S]** checked only against a secondary source: a search summary, or a citation inside a [V] source. **[U]** unverified: from memory, or a Taxila design default or simulation assumption that must be measured. A number marked *computed* was produced in this session by the simulation in §5.6. Its assumptions are [U], but its arithmetic is reproducible.

**Method.** About 35 web searches and 20 primary-source fetches, covering PNAS (via Europe PMC), arXiv HTML and PDF, EDM proceedings, Psychological Science (via ERIC PDF), the ACL Anthology, Europe PMC full text, Sociological Science and the srs-benchmark repository. PNAS, PMC (CAPTCHA), Springer and ScienceDirect blocked direct fetches, so several items rest on [S]. The reliability simulation (§5.6) ran in Python/numpy: 300-400 simulated children per cell.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| LT-D1 | The **first child-level construct reported to parents is durability** (per topic type), not learning rate | Initial knowledge is reliable after about 35-70 observations (*computed* reliability 0.68-0.80). With the slope variance Koedinger et al. 2023 report, the per-child learning rate is close to **unmeasurable** (reliability 0.01-0.04 at 35-210 observations; 0.61 only at 900 observations in long sequences, *computed*). Durability reaches reliability about 0.7 at roughly 40 delayed checks (*computed*, under [U] variance assumptions) | Taxila's own data show child slope SD ≥ 0.04 logit/opportunity under an MNAR-robust design (LT1), *and* slope test-retest r ≥ 0.6 |
| LT-D2 | Every per-child memory/learning parameter is a **hierarchical (partially pooled) estimate** with an explicit posterior, scoped to *topic type × class band*, and decays toward the population over months | Children change quickly between 6 and 15. Unpooled per-child fits on short sequences are noise (§5.6). Pooling is the standard remedy, and the literature's per-person models are hierarchical (Averell & Heathcote 2011 [V]) | Never removed. The decay half-life is tuned from LT8 |
| LT-D3 | **Delayed checks are scheduled with a randomised component** (lag jitter, plus a small share of fixed-length calibration sequences), not only by the scheduler's own optimum | A scheduler that probes only when it predicts R ≈ 0.9 produces range-restricted data. A mastery-exit design under-estimates learning-rate heterogeneity: truncation inflated slope variance +118% median, and short-sequence fits +233% (Lee et al. 2026 [V]). Without randomisation, neither durability nor learning rate is identifiable | Randomised and model-scheduled checks give the same child-level estimates (LT1, LT3) |
| LT-D4 | Forgetting is always estimated **conditional on the degree of original learning** | Fast and slow learners forget at the same rate when original learning is equated (Underwood 1954 [S]). Developmental forgetting differences are confounded with learning differences (Brainerd et al. 1990 [V abstract]). "Forgets fast" can be an artefact of "learned less" | n/a: this is a modelling invariant |
| LT-D5 | A "**fast but fragile**" pattern is first attributed to the **schedule** (massing, cramming, hint use, immediate-only evidence), and only then to the child | Massed practice raises immediate performance and lowers retention (Soderstrom & Bjork 2015 [S]; Cepeda et al. 2008: optimal gap vs zero gap +64% recall [V]). The "child" pattern is often a "schedule" pattern | A within-child comparison shows the pattern persists under spaced schedules |
| LT-D6 | **Sleep and consolidation are designed for, never inferred.** The first delayed check for a newly learned skill is placed after at least one night where possible. Taxila never estimates a child's sleep | Sleep benefits children's declarative consolidation (Weighall & Kellar 2023 umbrella review [V]; Henderson et al. 2012, ages 7-12 [S]). Inferring sleep from session times is behavioural monitoring with no validity evidence (vibe-temperament L1, L3) | n/a: the inference is banned. The design rule is reversed if LT5 shows no overnight effect |
| LT-D7 | The **vacation/absence model** is Glicko-style uncertainty inflation plus a re-probe, not an assumed "loss" | Summer loss magnitudes fail to replicate across tests (Workman, von Hippel & Merry 2023 [V]). Indian pandemic closures *did* produce large regression (Azim Premji Foundation 2021: 92% lost at least one language ability [S]). Absence makes Taxila **uncertain**; it is not evidence of loss | n/a. Durations and inflation constants are tuned on LT7 |

---

## 1. Executive summary

1. **Learning curves are regular, but what is regular is contested.** Across 27 datasets and 1.3 M observations, students started at about 65% accuracy (about 55% in the lower half and 75% in the upper half) and gained about **0.1 logit (about 2.5 points) per practice opportunity**, needing about 7 opportunities per knowledge component (Koedinger et al. 2023, PNAS [V abstract; 7-opportunity figure S]). The regularity replicated in MATHia, 15,570 students (Simpson et al. EDM 2024 [V]), and across demographic and motivation subgroups (Gold et al. LAK 2024 [S]). But the *smallness of between-student slope variation* is sensitive to which observations are included, because mastery-based exit makes sequence length depend on learning (Lee et al. 2026 [V]). **Taxila must not promise parents a learning-rate measurement.**
2. **The power law of practice is mostly an averaging artefact.** Individual curves are usually better fit by exponentials, and averaging exponentials with varied rates yields a power law (Heathcote, Brown & Mewhort 2000 [S]). The same holds for forgetting: an exponential fit individuals best, while Bayesian model selection favoured a power function, and all analyses supported a **non-zero asymptote**, meaning some memories are effectively permanent (Averell & Heathcote 2011 [V]). Model per child-item; do not fit population curves and read them as individual ones.
3. **Forgetting is fast early and slow later.** Ebbinghaus's curve replicates, including an upward bump at 24 h that the authors attribute to sleep (Murre & Dros 2015 [S]).
4. **Children forget at rates similar to adults once learning is equated. Age effects in forgetting are small and easily confounded** (Brainerd et al. 1990 monograph, ages 7-70 [V abstract]). For the same reason, a child who "forgets more" usually "learned less" in the first place (Underwood 1954 [S]). In adults, faster learners were also *more* durable, and this "learning efficiency" was reliable across 30 h and 3 years (Zerr et al. 2018, N = 281 and 92 [V]). Whether children show the same positive coupling is **unknown** (study LT2).
5. **Spacing is the largest, most reliable lever.** For a fixed study time, the optimal gap gave **+64% recall (d = 1.1)** over a zero gap. The optimal gap was about 20% of the retention interval at a few weeks and about 5-7% at one year (Cepeda et al. 2008, N = 1,354 [V]). Spaced vs massed *retrieval* practice: g = 0.74, with no overall difference between expanding and uniform schedules, g = 0.034 (Latimier et al. 2021 [S]). Classroom quizzing: g = 0.499 across 222 studies and 48,478 students (Yang et al. 2021 [V]). **Children's evidence is thinner.** Spacing improved generalization in 5-7-year-olds (Vlach & Sandhofer 2012, N = 36 [S]). Spacing helped grade 3 and 7 maths procedures at 1 week, but the grade-3 benefit was gone at 6 weeks (Barzagar Nazari & Ebersbach 2019 [S]). Maths spacing meta-analysis: g = 0.28 (Murray et al. 2025 [S]).
6. **Interference is a developmental vulnerability.** Preschoolers showed "catastrophic-like" retroactive interference that adults did not (Darby & Sloutsky 2015a [V]). A **48-h delay** before new learning improved memory and eliminated the interference (Darby & Sloutsky 2015b [V]). For Taxila: separate confusable skills in time, and consolidate before introducing a near-neighbour. Evidence for ages 6-15 is sparse: 4- and 7-year-olds did not differ in susceptibility (Lee & Bussey 2001 [S]).
7. **Sleep consolidates declarative learning in school-age children.** Procedural benefits are "less robust" in children (Weighall & Kellar 2023, umbrella review of 19 reviews [V]). In 7-12-year-olds, new words improved and integrated into the lexicon only after sleep (Henderson et al. 2012 [S]). After sleep, children converted implicit sequence knowledge into explicit knowledge better than adults (Wilhelm et al. 2013 [S]).
8. **Models Taxila can fit, from cheapest to richest:**
   - AFM/iAFM (learning curves; KC audit)
   - PFA (success/failure asymmetry)
   - half-life regression (HLR; durability per item)
   - FSRS (already the scheduler)
   - DAS3H/DASH-style time-window logistic models (learning *and* forgetting across multiple skills; DAS3H AUC 0.826 vs AFM 0.707 on Algebra 2005-06 [V])
   - the PPE (spacing-sensitive decay; Walsh et al. 2018 [S])
   - a **joint hierarchical Bayesian learning-forgetting model** (§5.5): the research model, and the only one that separates acquisition, durability, consolidation and interference per child.
9. **What can honestly be said to parents** (§7) is: *what* your child has learned, *how well it is holding up* after days and weeks, *what Taxila is doing about it* (review timing), and *how this is changing over months*. Patterns are described as properties of **this topic type, this period, and this schedule**, with evidence counts and uncertainty. They are never traits of the child. "Slow learner", "weak memory", "forgets everything" and their Hindi equivalents are banned at every layer.
10. **Publishable contributions** (§8) that Taxila's data could uniquely support:
    - (a) the first MNAR-robust test of learning-rate regularity in Indian children aged 6-15
    - (b) whether learning efficiency (acquisition coupled with durability) exists in children and how it develops
    - (c) the developmental trajectory of forgetting with degree of learning equated
    - (d) micro-randomised estimates of optimal spacing ratios by age band
    - (e) overnight consolidation measured in the wild.

---

## 2. Constructs at a glance

| id | construct | definition | Taxila observable | model (§5) | per-child reliability | parent-reportable? |
|---|---|---|---|---|---|---|
| C1 | Prior knowledge | performance before practice on a skill | diagnostic CAT θ; first-attempt success on new skills | IRT/Glicko θ (kt-algorithms §3); iAFM intercept | **high** (0.68 at 35 obs, 0.80 at 70, *computed*) | yes: as "where we started", never as a score vs peers |
| C2 | Acquisition rate | log-odds gain per practice opportunity | first-attempt correctness by opportunity index | AFM/iAFM slope; BKT T + η (kt-algorithms §2.5) | **very low** (≤ 0.04 below 210 obs; 0.61 at 900, *computed*) | **no** at launch (LT-D1) |
| C3 | Durability | how slowly recall probability decays with time since last successful retrieval, given degree of learning | delayed-check outcomes vs lag | HLR / FSRS stability S / joint model φ_c | moderate after ~40 delayed checks (0.69, *computed*, [U] variance) | yes, per topic type, after thresholds (§6.3) |
| C4 | Spacing responsiveness | how much a given child's retention depends on gap/RI ratio | delayed outcomes under randomised lags | joint model, interaction term | not identifiable per child at realistic volumes [U] | no; population-level finding only |
| C5 | Consolidation gain | change in retrievability across an offline interval (especially a night) beyond what the decay curve predicts | first attempt of next-day session vs same-day delay at matched lag | joint model κ term | low per child; good at population level [U] | no (population design rule only) |
| C6 | Interference | loss on skill k attributable to learning a confusable skill j in between | delayed outcomes on k vs number of confusable intervening items | joint model ι term; curriculum confusability graph | low per child [U] | no; it drives sequencing |
| C7 | Relearning savings | faster recovery after a lapse than original learning | opportunities to re-reach criterion after a lapse | PPE; FSRS post-lapse stability | moderate [U] | yes, as reassurance ("comes back quickly") |
| C8 | Transfer durability | near/far transfer success as a function of delay | delayed transfer probes P3/P4 (learning-science §7) | joint model with probe-class emissions | low-moderate [U] | yes, qualitatively, with examples |
| C9 | Long-horizon growth | change in subject ability θ over weeks and months | Glicko/IRT θ trajectory | state-space growth model (§5.7) | depends on span and occasions: GRR (§5.7) | yes, the main "progress" story |
| C10 | Learning efficiency | the joint pattern of C2 and C3 | as C2, C3 | correlation ρ(β_c, φ_c) | population-level estimand | no (research) |

---

## 3. Evidence, construct by construct

### 3.1 The shape of skill acquisition (C1, C2)

**Definition.** A learning curve plots performance (error rate, log-odds of correct, latency) against the number of practice *opportunities* on a knowledge component (KC). Learning-curve analysis treats each KC's curve as a test of the cognitive model: a smooth, declining error curve says the KC is real, and a flat or jagged one says the KC is mis-specified and should be split or merged (Learning Factors Analysis; Cen, Koedinger & Junker 2006 [S]).

**The power law of practice and its repeal.** Group-averaged practice curves follow a power function of trials (Newell & Rosenbloom 1981 [S via Heathcote 2000]). Heathcote, Brown & Mewhort 2000 showed that individual curves are better fit by exponentials. If rates are gamma-, uniform- or half-normal-distributed across people, averaging exponentials produces a spuriously good power fit [S]. The two forms imply different psychology. An exponential means a constant fraction of what remains is learned per trial. A power function means learning itself decelerates. Consequence for Taxila: **fit the functional form at the child-KC level, inside a hierarchical model, never by eye on dashboards of averages.**

**The "astonishing regularity".** Koedinger, Carvalho, Liu & McLaughlin 2023 fitted iAFM to 27 datasets (1.3 M observations; mathematics, science and language; mostly middle school to college [U on exact ages]) [V abstract]:

```
logit P(Y_ij = 1) = β0 + b0_i + Σ_k q_jk·c0_k + Σ_k q_jk·(β1 + b1_i + c1_k)·T_ik          (iAFM)
   b_i = (b0_i, b1_i) ~ N(0, Σ_student),   c_k = (c0_k, c1_k) ~ N(0, Σ_KC)
   T_ik = prior opportunities of student i on KC k;  q_jk = 1 if item j exercises KC k
```

(equation as restated in Lee et al. 2026 [V]). The reported student-intercept IQR had median 0.797 logits, and the student-slope IQR had median **0.020** logits per opportunity [V via Lee et al.]. Initial knowledge varies widely; learning rate barely varies. The authors' reading is that gaps come from **opportunities**, not from rate.

**Replications and challenge.**
- MATHia, 6 workspaces, 15,570 students, 821,890 observations: slope variance "extremely small". The largest slope IQR was 0.118, against Koedinger's maximum of 0.102. The authors caution that iAFM is "very new" and that the fixed-effect CIs are wide (Simpson, Norberg & Fancsali, EDM 2024 [V]).
- 426 students, one school year: regularity held across sex, SES, proficiency and motivation. Learning rate had **no** significant correlation with demographic or motivational measures. Initial knowledge did correlate with performance and goal orientation (Gold, Borchers & Carvalho, LAK 2024 [S]).
- **Lee, Lichand, Barnard, Klotz, Thille, Kim & Domingue 2026** (arXiv 2605.01690 [V]) re-fitted the same 27 datasets. Student-intercept variation was stable across specifications (median change −1.5%). Student-slope variation inflated by a **median +118%** when sequences were truncated at 10 attempts, and by **+233%** in short-practice-only fits. Short (student, skill) pairs showed 2-6× the slope variability of long pairs. Long pairs (> 10 attempts) were 4-89% of pairs but **70-97% of observations**, so the estimate is dominated by students who needed many attempts. Mechanism: mastery-based exit is **missing-not-at-random**. Fast learners leave early, and wheel-spinners generate long flat sequences. Their conclusion is careful: the refits "do not establish that students learn at substantially different rates", but the published small-variation estimate "warrants checking sensitivity". **Status: open.**

**Developmental trajectory, 6-15.** No learning-rate dataset spans classes 1-9 with an MNAR-robust design [U: this gap is the publishable opportunity, LT1]. What is known:
- **General processing speed** rises steeply in childhood and more slowly in adolescence, following an exponential function of age, consistently across domains (Kail 1991; 72 studies, 1,826 RT pairs [S]). **Latency-based indicators must therefore be age-normed and child-normed.** A 7-year-old's "slow" answer is not a 13-year-old's.
- **Strategy change is gradual and overlapping.** In arithmetic, children use several strategies at once, and the mix shifts toward retrieval with practice ("overlapping waves", Siegler 1996 [S]). For fact skills (T1), "learning" across months is partly a shift from counting to retrieval. It shows up first in latency, not accuracy (§4).

**Validity concerns.**
- (a) KC granularity: a mis-specified KC flattens the curve and makes a child look like a slow learner. Run learning-curve audits per KC before any child-level claim (kt-algorithms §3.6b).
- (b) Item difficulty drift in LLM-generated variants confounds opportunity with difficulty. Include template difficulty (kt-algorithms §3.2) and randomise order within blocks.
- (c) Hints and scaffolding change what an "opportunity" is: count only unaided first attempts as observations, but count all instructional events as opportunities.
- (d) **MNAR exit** (above): Taxila's own mastery rule (kt-algorithms D6) creates exactly this bias. LT-D3 is the remedy.

**What parents can be told.** "Where your child started on [topic], and how many practice turns it has taken so far." **Not** "your child learns faster/slower than others." Opportunity counts are honest and actionable: the literature's strongest message is that **more good practice opportunities close gaps**. That is a hopeful, evidence-based message for parents of children who start behind, and Indian children often start behind grade (learning-science §5.2).

### 3.2 Forgetting curves (C3)

**Definition.** The retention function R(t) is the probability of successful retrieval t after the last successful study or retrieval. *Durability* is a child's (or item's) position on a family of such curves, at a given degree of original learning.

**Shape.**
- Ebbinghaus's savings curve was replicated by Murre & Dros 2015: one subject, 70 h, lags of 20 min to 31 days. It is "not completely smooth": there is an upward jump at 24 h, attributed to sleep [S].
- Rubin & Wenzel 1996 fitted 105 two-parameter functions to 210 published datasets [S via Averell & Heathcote].
- Averell & Heathcote 2011 used hierarchical Bayesian models on 1 min-28 day data [V]. The **exponential fit individuals best, Bayesian selection favoured a power function, and all analyses supported a non-zero asymptote.** Taxila's memory models must allow an **asymptote** (a floor of permanent retention) and **item heterogeneity**. A single exponential per child-skill will overstate long-run forgetting.

Common forms (t in days):

```
exponential:            R(t) = 2^(−t/h)                         (HLR; h = half-life)
exponential + floor:    R(t) = a + (1 − a)·e^(−t/τ)              (Averell & Heathcote: a > 0)
power (FSRS-6):         R(t) = (1 + f·t/S)^(−w20),  f = 0.9^(−1/w20) − 1   (R(S) = 0.9)
ACT-R/PPE activation:   M = N^c · T^(−d),  d = b + m·stability,  P = 1/(1 + e^((τ − M)/s))
```

**Development and the degree-of-learning confound.**
- Brainerd, Reyna, Howe & Kingma 1990 (SRCD Monograph, ages 7-70, 1-2 week intervals) argue that apparent age-invariance in forgetting is a measurement artefact. With measurement sensitivity and learning-stage confounds controlled, **forgetting rates do vary with age**. Their trace-integrity model separates storage failure from retrieval failure [V abstract]. Brainerd, Kingma & Howe 1985 found developmental differences in forgetting between grades 1-2 and 5-6 once learning ability was controlled [S].
- Underwood 1954 showed that the fast-learner retention advantage disappears when original learning is equated [S]. In adults, Zerr et al. 2018 found that quicker learners were *more durable* despite less study time, and that the efficiency measure was reliable across 30 h (N = 281) and 3 years (N = 92, follow-up n = 46) [V].
- Reconciling these: whether acquisition and durability are coupled depends on what is held constant (study time vs degree of learning). **Taxila must state which in any claim.**

**What it means for "learns quickly but forgets fast".**
- Under Underwood, a child who reaches criterion fast may simply stop practising at a lower *degree* of learning. This is exactly what mastery-exit produces, and they then forget faster.
- Under Zerr, true efficiency differences would make fast learners *more* durable. The pattern "fast but fragile" is then either (i) a degree-of-learning artefact, (ii) a schedule artefact (massed acquisition, §3.3), or (iii) a real but uncommon dissociation.
- The joint model (§5.5) conditions on end-of-learning strength. Only then may (iii) be considered, and it still must pass §6.3.

**Validity concerns.**
- (a) **Range restriction.** HLR on Duolingo had AUC only **0.538**, because mean recall was 0.859 and the scheduler probed mostly when recall was likely (Settles & Meeder 2016 [V]). A scheduler-driven log cannot see the tail of the curve. Hence LT-D3.
- (b) **Delayed checks are themselves learning events** (the testing effect, g = 0.499, Yang et al. 2021 [V]). Each measurement changes the thing measured, so the model must update strength after every check.
- (c) **Recall vs recognition.** Cepeda et al. 2008's optimal-gap benefit was larger for recall than recognition at short RIs: +10% recall vs +1% recognition at 7 days [V]. MCQ delayed checks under-detect forgetting. Prefer open, code-graded answers (kt-algorithms §1.3).
- (d) ASR errors masquerade as forgetting for young children. Drop low-confidence events (kt-algorithms §1.3).

**What parents can be told.** "How well [topic] is holding up: of the N times Taxila checked it after a gap of a week or more, your child got it right M times." Once the model is confident (§6.3): "For [topic type], what your child learns tends to hold well over a week" or "tends to need a quick review after 3-4 days; Taxila schedules those automatically."

### 3.3 Spacing, retrieval, and the learning-vs-performance trap (C3, C4)

**Evidence.**
- **Cepeda, Pashler, Vul, Wixted & Rohrer 2006** (Psych Bull 132:354): 839 assessments in 317 experiments from 184 articles. The inter-study interval (ISI) and the retention interval (RI) jointly determine retention, and **the optimal ISI grows with RI** [S].
- **Cepeda, Vul, Rohrer, Wixted & Pashler 2008** (Psych Sci 19:1095): N = 1,354 online participants (mean age 34; so adults), 32 trivia facts, 26 gap × RI conditions [V].
  - Optimal gaps for recall: 1, 11, 21 and 21 days at RIs of 7, 35, 70 and 350 days. Improvements over a zero gap: +10, +59, +111 and +77%.
  - Overall: **+64% recall (d = 1.1)** and +26% recognition.
  - The optimal gap/RI ratio falls from about 20% at a few weeks to about 5-7% at one year. Performance falls off **more gently** for too-long gaps than for too-short ones, so **when unsure, err long**.
- **Latimier, Peyre & Ramus 2021:** spaced vs massed retrieval g = 0.74 (29 studies). Expanding vs uniform schedules: g = 0.034, with expanding schedules favoured as the number of tests grows [S].
- **Yang et al. 2021:** 222 classroom studies, 48,478 students. Quizzing g = 0.499, moderated by feedback, format match and repetitions [V].
- **Children:**
  - Vlach & Sandhofer 2012: 5-7-year-olds, N = 36. Four food-chain lessons on 4 consecutive days, rather than all on one day, improved *generalization* to a new biome [S]. Vlach 2014 frames this as "allowing children time to forget promotes their ability to learn" [S].
  - Barzagar Nazari & Ebersbach 2019: grades 3 and 7. Spaced (3 × 15 min) beat massed (1 × 45 min) at 1 and 6 weeks, **except grade 3 at 6 weeks** [S].
  - Ebersbach & Barzagar Nazari 2020, adults (N = 235), permutation procedures: **no robust ISI effect** [V].
  - Murray et al. 2025, maths meta-analysis: spacing g = 0.28 (27 studies, 53 effects), smaller than for verbal material [S].
  - **Reading:** spacing is robust for facts and vocabulary (T1/T2). It is smaller and less certain for procedures (T4) and young children. Its long-RI benefits in children aged 6-9 have little direct evidence [U].
- **Personalised review in school:** in a semester-long middle-school foreign-language course, a DASH-model-driven review scheduler beat massed study by **16.5%** and one-size spaced review by **10.0%** on a cumulative exam (Lindsey, Shroyer, Pashler & Mozer 2014 [S]). This is the closest evidence that per-learner memory models help children (ages ~13-14).
- **Learning vs performance.** Distributing practice impairs short-term performance growth but improves long-term learning. Learning can occur without performance gains, and performance gains can fail to become learning (Soderstrom & Bjork 2015 [S]). PPE was the only one of three models to capture spacing that slows acquisition yet raises retention and accelerates relearning (Walsh et al. 2018 [S]).

**Implication.** Within-session accuracy is the **wrong** reward for every adaptive decision. learning-science §8.4 already set delayed success as the reward for format choice, and this section extends the rule to *schedule* choice. A child whose immediate accuracy is lower under spacing is usually learning *more*. **Parent reports must never show within-session accuracy as "learning".**

**Spacing responsiveness per child (C4).** Estimating a per-child gap × RI interaction needs many randomised delayed checks per child at several lags *and* several RIs. That is far beyond what a child generates in a term (§5.6 shows that even a main durability effect needs about 40 checks). Treat C4 as a **population-by-age-band** estimand (LT4). Apply it to children through the scheduler, never as a parent claim.

### 3.4 Interference (C6)

**Definition.**
- *Retroactive* interference (RI): new learning impairs memory for older learning.
- *Proactive* interference (PI): older learning impairs new learning.
- Both are strongest when stimuli or responses overlap. Examples: 6×7 vs 6×8; b/d; ि/ी matras; *their/there*; "denominator/numerator".

**Evidence.**
- Preschoolers and adults in a 3-phase associative paradigm: interference only for repeated items. **PI was comparable across ages; RI reached "catastrophic-like" levels in children.** In adults, RI increased when contexts were similar and decreased with better encoding (Darby & Sloutsky 2015a, JEP:G [V]).
- A **48-h delay** between learning and test improved children's memory and eliminated interference, but only when children had enough information to form complex memory structures (Darby & Sloutsky 2015b, Psych Sci [V]).
- 4- and 7-year-olds: equally susceptible to RI, regardless of degree of learning (Lee & Bussey 2001, JECP [S]).
- The age range 6-15 has little direct evidence [U]. The adult result that RI shrinks with stronger encoding (Darby & Sloutsky Exp. 3 [V]) gives the design rule.

**Design rules (Medium confidence).**
- (a) Tag curriculum skill pairs with a **confusability** edge (curriculum JSON). An LLM may propose edges; misconception data and teachers confirm them.
- (b) Do not introduce skill j within 1-2 days of first learning a confusable skill k, unless k has had a successful delayed check.
- (c) Once both are individually stable, *interleave* them deliberately. Interleaving trains discrimination: Rohrer et al. 2020 found 61% vs 38% at 1 month in grade 7 (learning-science §3.5 [S]).
- (d) In the joint model, the interference term ι (§5.5) is estimated **at the population level per edge type**. A per-child ι is not reportable.

**What parents can be told.** Only design facts, for example: "Taxila teaches 6×7 and 6×8 a few days apart, then mixes them, because similar facts learned together get confused." That is an explanation of method, not a claim about the child.

### 3.5 Consolidation and sleep (C5)

**Evidence.**
- **Weighall & Kellar 2023** (Emerging Topics in Life Sciences 7:513; 19 systematic reviews and meta-analyses) [V]: "Sleep enhances memory consolidation, especially for complex declarative information." In children, the procedural benefit "remains less robust compared to declarative memory, findings suggest potential but inconsistent benefits." Kopasz et al. 2010 found sleep helps encoding and working memory, moderated by sleep duration and restriction. Effects for school-age vocabulary are similar to adults', but "a comprehensive systematic review is required."
- **Henderson, Weighall, Brown & Gaskell 2012** (Dev Sci 15:674): in 7-12-year-olds, recognition and recall of novel words improved only after sleep, and lexical competition (integration with known words) appeared only after sleep [S].
- **Wilhelm et al. 2013** (Nat Neurosci): after sleep, children gained more explicit knowledge of an implicitly trained sequence than adults. The gain was linked to slow-wave activity [S].
- **Naps** (early childhood meta-analysis): declarative g = 0.35 overall, preschoolers g = 0.60 [S]. This is outside Taxila's age range, but shows the developmental direction.
- **Sleep and school performance**: sleepiness, short sleep and poor sleep quality are all negatively related to school achievement in 6-15-year-olds, with somewhat larger associations in younger children (Dewald et al. 2010 [S]). These are correlational.
- **Delay as consolidation without sleep claims**: Darby & Sloutsky's 48-h delay (§3.4) and the Murre & Dros 24-h bump (§3.2).

**How Taxila can measure consolidation without inferring sleep (population level).** Compare the first attempt on skill k at the *start of the next day's session* with checks at a matched lag within the same day (for example, a 10-14 h same-day gap vs a 10-14 h overnight gap). Only children with naturally occurring same-day sessions contribute the comparison. The contrast is an **overnight term κ** in the joint model (§5.5). It is estimated per age band, never per child, and never using clock time as a proxy for bedtime. Taxila records only whether a calendar night (local date change) occurred between events: a schedule fact, not a behaviour [U: legal posture per learning-science §4.3].

**Design rule (Medium).** Place the first delayed check of a newly acquired declarative skill (T1/T2/T3) in the **next-day session**. This matches kt-algorithms §2.6: "mastered" requires a success ≥ 20 h later in a different session. If LT5 finds no overnight effect, the rule reverts to a pure lag optimum.

**What parents can be told.** Only general, evidence-backed guidance, offered once and not targeted at any child's data: "Children consolidate new words and facts during sleep, so a short session in the evening followed by a quick check next day works well." **Never**: "your child seems to sleep badly", "late sessions are hurting her memory", or any inference from timestamps. Session-time patterns are not sleep measures, and the inference fails L1 and L3 in vibe-temperament §2.

### 3.6 Transfer over time and fade-out (C8)

**Evidence.**
- **Fade-out** is the norm for interventions targeting cognitive skills: initially promising impacts "quickly disappear". Persistence is likelier for "trifecta" skills, meaning skills that are malleable, fundamental, and would not have developed anyway, and when environments sustain them (Bailey, Duncan, Odgers & Yu 2017 [S]; Bailey et al. 2020 PSPI [S]). For early maths, fade-out reflects both forgetting and *catch-up* by control children [S].
- **Transfer** is multidimensional. Temporal distance (same session vs days vs years) is one of the context dimensions on which transfer degrades (Barnett & Ceci 2002 [U]).
- **Spacing improves generalization in children** (Vlach & Sandhofer 2012 [S]). Interleaving produced durable discrimination at 1 month (Rohrer et al. 2020 [S]).

**Taxila measurement.** The delayed probes P3 (near transfer) and P4 (far transfer) of learning-science §7 enter the joint model as separate evidence classes, with their own lag curves. The estimand is "transfer success at lag Δ given immediate transfer success". Most children will have few such events, so report it qualitatively, with examples ("three weeks after fractions, she used them correctly in a recipe problem").

**What parents can be told.** Examples of delayed transfer, which are the most convincing evidence of real learning. Also the honest framing that practice gains in *any* program partly fade unless used, so periodic review is part of the design, not a sign of failure.

### 3.7 Long-horizon growth and breaks (C9)

**Evidence.**
- **Math Garden** (Netherlands; children practising arithmetic; over a billion responses): Elo-type ratings for children and items allow real-time tracking. Pitfalls include "violations of unidimensionality and unforeseen dynamics" (Brinkhuis et al. 2018, JLA [V abstract]).
- A control-theory (state-space) model on 784 Math Garden children found that **person- and time-specific training dosages** beat fixed schedules at lower cost (Chow et al. 2025, Psychometrika [S]).
- **Summer learning loss:** across ECLS-K:2011, NWEA and Renaissance, "summer losses looked substantial on some tests but not on others". Gaps and variance grew on some tests but not others, and not consistently faster in summer (Workman, von Hippel & Merry 2023, Sociological Science [V]). Kuhfeld 2019 (NWEA, 3.4 M students): the largest losses were among students who had gained most during the school year [S].
- **India:** after COVID school closures, 92% of children had lost at least one foundational language ability and 82% at least one maths ability (Azim Premji Foundation 2021; 16,067 children in 1,137 schools, 5 states [S]). Long closures produce real regression. Ordinary vacations (summer, Diwali/Dussehra, Pooja) are **unknown** in size for Taxila's population [U].

**Taxila measurement.**
- Subject θ via Glicko with time inflation (kt-algorithms §3.2). Absence widens σ; it does not move μ. The first session after a break re-probes.
- The research-grade estimand is a **state-space growth model** (§5.7), with a break indicator whose coefficient is estimated per age band from re-probe outcomes (LT7).
- Reliability of individual growth slopes depends on span and occasions, not just counts (GRR, §5.7).

**What parents can be told.** The month-over-month θ trajectory, as a grade-equivalent *band* with an uncertainty ribbon (e.g. "working at early Class 5 level in fractions, up from late Class 4 in July"). After a break: "Taxila is re-checking where things stand after the holidays; some dip is normal and usually comes back quickly." Relearning savings (C7) is the evidence for that last clause, and it is shown when measured.

---

## 4. Behavioural indicators in Taxila logs

Only signals already permitted by kt-algorithms (answers, outcome classes, timestamps, item keys, hint-ladder depth) are used. `para` (latency/disfluency) stays off until the DPDP opinion (kt-algorithms §7.1). The latency indicators below are therefore **feature-flagged**, and only computed for code-graded fact items (T1/T2).

| indicator | definition | construct | validity notes |
|---|---|---|---|
| I1 opportunity index T_ik | count of prior unaided attempts *and* instruction events on KC k | C2 | must count teach events as opportunities (AFM convention) [U] |
| I2 first-attempt correctness | C0 vs other outcome classes (kt-algorithms §1.2) | C1, C2, C3 | hinted successes are weak evidence (Beck et al. 2008, via kt-algorithms [V]) |
| I3 lag Δ since last successful retrieval | days, continuous | C3 | the scheduler sets it, so randomised jitter is needed (LT-D3) |
| I4 degree of original learning | end-of-acquisition strength: successes in acquisition session, pL at exit, FSRS S0 | C3 (conditioning) | required covariate (LT-D4) |
| I5 overnight flag | local calendar date changed between events | C5 | a schedule fact; no clock-time features |
| I6 intervening confusable load | count of items on confusable-edge KCs between two checks of k | C6 | needs curated edges |
| I7 relearning opportunities | attempts to regain C0 after a lapse, vs original acquisition | C7 | small n per child |
| I8 delayed transfer outcome | P3/P4 probe class at lag Δ | C8 | LLM-graded, so fold grader noise (kt-algorithms §1.3) |
| I9 θ trajectory | Glicko μ, σ per subject over time | C9 | vertical scale needs calibration (kt-algorithms K4) |
| I10 retrieval latency (flagged) | correct-answer latency on fact items, normalised to child × item-class median | C2 for T1 (strategy shift to retrieval) | age-normed (Kail 1991 [S]); ASR endpointing noise (learning-science §1.10) |
| I11 session distribution | gaps between sessions, chosen by the child or family | *confound* for C3/C4 | a habit, not a memory trait. It is used only as a covariate and never as a reportable trait in this document; habits are covered in a separate review |

---

## 5. Measurement models Taxila can fit per child

### 5.1 Data contract

Unit of analysis: one **observation** o = (child c, KC set K(j), item j, time t, outcome y ∈ {0,1} or categorical class, grader, lag Δ_k for each k ∈ K(j), opportunity counts, overnight flag, intervening-confusable counts, end-of-acquisition strength). All features are derived deterministically from the `EvidenceEvent` ledger (kt-algorithms §1.1). The models are fitted **offline, nightly or weekly**. The online ledger (BKT-R + FSRS) stays the source of truth for teaching decisions. The models here are the source for **research and parent-facing durability statements**, and they are the **challengers** in K6.

### 5.2 AFM / iAFM: learning curves and KC audit

```
AFM:   logit P(y_cj = 1) = θ_c + Σ_k q_jk·(β_k + γ_k·T_ck)                 (Cen et al. 2006 [S])
iAFM:  as §3.1, adding b1_c (a child slope) with (b0_c, b1_c) ~ N(0, Σ)
```

- **Use 1: KC audit** (monthly). For each KC, plot error vs T pooled across children. Flag a KC if γ_k ≤ 0, or if the curve is non-monotone at n ≥ 30 children × 7 opportunities. Flagged KCs get split or merged by a curriculum author.
- **Use 2: research (LT1).** Fit iAFM on MNAR-robust subsets: (a) fixed-length calibration sequences (§5.8), and (b) truncation sensitivity in the style of Lee et al. 2026, reporting sequence-length distributions alongside the fit.
- **Not a use:** per-child learning-rate reporting (LT-D1; §5.6).
- **Fitting:** `lme4::glmer` or Stan `brms` with logit link; KCs and children as crossed random effects. At Taxila scale, sample children, or use variational inference (NumPyro) [U].

### 5.3 PFA: success/failure asymmetry

```
logit P(y_cj = 1) = Σ_k q_jk·(β_k + γ_k·s_ck + ρ_k·f_ck)        (Pavlik, Cen & Koedinger 2009, via kt-algorithms §3.6 [V])
```

PFA separates learning from successes (γ) and from failures (ρ). The LKT extensions add recency and spacing features. It is useful for the challenger slot, and as a sanity check that "practice after an error" produces learning. For children with frequent bottom-out hints, ρ ≈ 0 means the error-recovery loop isn't teaching (a product signal, not a child trait).

### 5.4 Half-life regression with a child offset (durability, item level)

Original HLR (Settles & Meeder 2016 [V]):

```
p̂ = 2^(−Δ/ĥ),   ĥ = 2^(Θ·x)
x = (√n_seen, √n_correct, √n_wrong, lexeme indicators)             // √ counts worked better than raw counts
loss = (p − p̂)² + α·(h − ĥ)² + λ‖Θ‖²,   h = −Δ / log2(p),   λ = 0.1, α = 0.01
```

Results [V]:
- MAE 0.128 vs Leitner 0.235 (−45%) and Pimsleur 0.445. AUC 0.538 (range-restricted; mean recall 0.859). Dropping the half-life term more than doubled MAE.
- In a ~1 M-student, 6-week experiment, the change raised overall activity but cut practice sessions.
- Lexeme (item-identity) features overfit and made some words "decay rapidly regardless of practice". A 3.3 M-student follow-up without them (HLR −lex) improved all retention metrics. **Lesson: per-item identity weights overfit; use per-template difficulty with shrinkage instead.**

**Taxila variant (HLR-C)**, binary likelihood, hierarchical:

```
log2 h_cjk = μ_tt + u_c,tt + v_template + ω1·√s_ck + ω2·√f_ck + ω3·log2(1 + S0_ck) + ω4·night_ck
P(y = 1)   = a_tt + (1 − a_tt) · 2^(−Δ/h)                     // a = asymptotic floor (Averell & Heathcote [V])
u_c,tt ~ N(0, σ_u,tt²)   (child durability offset, per topic type tt)
v      ~ N(0, σ_v²)      (template difficulty; ≥ 30 observations before departing from prior)
fit:  Bernoulli log-likelihood + priors (MAP or full posterior), not squared loss on p
```

- **u_c,tt is the durability construct C3.** One unit = a doubling of half-life.
- Conditioning on S0 (initial stability) implements LT-D4.
- `night` is the consolidation contrast, estimated at population level. When fitting u_c, fix it to the age-band value.
- **Benchmark reality check.** On 10 k Anki users and about 350 M reviews (adult flashcards), HLR is a weak memory model: log-loss 0.469, AUC 0.637. FSRS-6 scores 0.346 and 0.703; DASH 0.368 and 0.631; GRU/LSTM about 0.333 and 0.733 (srs-benchmark [V]). Taxila's **scheduler stays FSRS** (kt-algorithms D2). HLR-C's role is **interpretability**: one child parameter, in "half-life doubling" units, is something a parent sentence can rest on.

### 5.5 Joint hierarchical Bayesian learning-forgetting model (the research model)

This model separates acquisition, durability, consolidation and interference per child (with shrinkage), using all T1-T5 evidence. It is a DASH/DAS3H-style logistic model with child random slopes, an explicit decay term, and a guess floor:

```
for observation o = (c, j, t), with KCs K(j):
  strength   m_o = α_c + δ_j + Σ_{k∈K(j)} [ (β0 + β_c + β_k)·log(1 + N_ck(t))              // acquisition
                                         − (φ0 + φ_c + φ_k)·log(1 + Δ_ck(t)/τ)·e^(−λ·log(1+S_ck(t)))   // durability, stronger memories decay slower
                                         + κ·night_ck(t)                                    // consolidation (population)
                                         − ι_e·log(1 + I_ck(t)) ]                           // interference via confusable edges e
  P(y_o = 1) = g_j + (1 − g_j)·σ(m_o)                                                       // g_j = 1/K for MCQ, else ≈ 0
  N_ck = weighted count of prior opportunities (successes weight 1, hinted 0.5, instruction 0.3)  [U weights]
  Δ_ck = days since last successful retrieval of k;   S_ck = successes on k (degree of learning, LT-D4)
  child effects (α_c, β_c, φ_c) ~ MVN(0, Σ_child),  Σ = diag(σ)·Ω·diag(σ),  Ω ~ LKJ(2)
  KC effects (β_k, φ_k) ~ MVN(0, Σ_KC); δ_j ~ N(δ_template, 0.5²)
  priors: β0 ~ N(0.3, 0.2²) on log-count scale; φ0 ~ N(0.5, 0.3²); σ_β, σ_φ ~ half-N(0, 0.3²);
          κ ~ N(0, 0.5²); ι_e ~ half-N(0, 0.5²); τ = 1 day; λ ~ half-N(0, 1)          [all U]
  child parameters scoped per (subject × topic type); Σ_child differs by class band (1-2 / 3-5 / 6-8 / 9)
```

**What the parameters mean.**
- α_c: prior knowledge (C1).
- β_c: acquisition (C2).
- φ_c: forgetting, where positive means faster decay (C3; durability = −φ_c).
- κ: consolidation (C5).
- ι_e: interference (C6).
- **ρ(β_c, φ_c) = Ω[2,3] is the learning-efficiency estimand (C10).** Zerr et al. 2018 predicts ρ < 0: faster acquisition goes with slower forgetting.

**Fitting.** Stan (`brms` with custom non-linear formula) or NumPyro with NUTS, on a stratified sample of about 2-5 k children per refit [U]. A Laplace approximation per child, with population hyperparameters fixed, gives nightly child posteriors in milliseconds. The child-level computation has the same structure as the grid ADF in kt-algorithms §3.2.

**Validation.**
- (a) Posterior predictive checks on **held-out delayed observations** by lag bin.
- (b) Calibration on randomised-lag checks only (LT-D3).
- (c) Parameter recovery on simulated data at Taxila's real data shape before any real-data claim (LT6).
- (d) Compare out-of-sample log-loss and AUC against FSRS, HLR-C and BKT-R (K6).

### 5.6 How reliable are per-child parameters? (*computed* this session)

Simulation (`docs/research/psychology/learning-over-time-relsim.py`, numpy, seed 7, about 2 min; 300-400 children per cell; EB/MAP estimates with the true population prior; reliability = corr(estimate, truth)²):

**iAFM**, child intercept SD 0.59 logit (from Koedinger's median IQR 0.797/1.349) and slope SD 0.0148 logit/opportunity (IQR 0.020/1.349); population slope 0.1; KC difficulty SD 0.8:

| observations (skills × opportunities) | intercept reliability | slope reliability (SD 0.015) | slope reliability if SD 2.5× larger (0.037) |
|---|---|---|---|
| 35 (5 × 7) | 0.68 | 0.01 | n/a |
| 70 (10 × 7) | 0.80 | 0.00-0.03 | 0.03 |
| 210 (30 × 7) | n/a | 0.04 | 0.15 |
| 450 (30 × 15) | n/a | 0.25 | 0.64 |
| 900 (30 × 30) | 0.95 | 0.61 | n/a |

**HLR-C durability offset**, child SD 0.5 log2-units [U], item SD 0.5, lags U(1, 30) days, base half-life 8 days:

| delayed checks per child × topic type | 5 | 10 | 20 | 40 | 80 | 160 |
|---|---|---|---|---|---|---|
| reliability (child SD 0.5) | 0.18 | 0.28 | 0.52 | **0.69** | 0.82 | 0.88 |
| reliability (child SD 0.25) | n/a | 0.07 | n/a | 0.37 | n/a | 0.77 |
| reliability (item SD 1.0, poorly calibrated generated items) | n/a | 0.30 | n/a | 0.63 | n/a | 0.88 |

**Reading.**
1. Prior knowledge is measurable early.
2. If the Koedinger slope variance is right, a child's *learning rate* stays unreliable until hundreds of observations in **long** per-skill sequences. Long sequences are what struggling children generate, which is the MNAR problem.
3. Durability is measurable at about 40 randomised delayed checks per topic type **if** children truly differ by about 1.4× in half-life per SD. If they differ less, it needs 100+.
4. **Before any parent claim, LT3 must estimate σ_u on real data.** If σ_u is small, the honest report is that most children's retention looks typical, which is itself useful, reassuring information.

### 5.7 Long-horizon growth (C9): state-space model and slope reliability

```
θ_c(t+1) = θ_c(t) + μ_c·Δt + ψ·break_c(t) + w,   w ~ N(0, q·Δt)        (local linear trend; break = gap ≥ 21 days [U])
y | θ    ~ IRT/Glicko observation model (kt-algorithms §3.1-3.2)
μ_c      ~ N(μ_band, σ_μ²)                                              // growth rate per child, pooled by class band
```

**Reliability of an individual growth rate** follows Willett's growth rate reliability (Brandmaier et al. 2018 [V]):

```
GRR = σ_S² / (σ_S² + σ_ε²/SST),   SST = Σ_j (t_j − t̄)²
```

Here σ_S² is the true variance of slopes, σ_ε² the measurement error variance at each occasion, and t_j the measurement times. It rises with the **spread** of measurement times, not just their number. Brandmaier et al.'s effective curve reliability (ECR) generalises this when intercept variance and covariance matter, and they give a worked example: 3 occasions over 5 years gave ECR 0.64 and GRR 0.63 [V]. For Taxila: monthly θ snapshots with σ_ε ≈ 0.3 GE (the Glicko floor region) over a 6-month span reach useful GRR only if true growth-rate SD is ≳ 0.5 GE/year [U: compute with real σ_S from LT7]. **Show parents the trajectory with its ribbon, not a "growth-rate score".**

### 5.8 Design for identifiability (what the scheduler must do)

1. **Lag jitter:** each scheduled delayed check is drawn from the scheduler's optimum × U(0.6, 1.6) [U]. Per Cepeda 2008, too-long gaps cost little.
2. **Calibration probes:** ≤ 5% of review slots go to a fixed-lag check (1, 3, 7, 14, 30 days) on a randomly chosen mastered skill [U]. These double as K7 audits and as post-mastery maintenance (kt-algorithms §2.5b).
3. **Fixed-length calibration sequences:** at most once per child per month, one new skill gets a full 8-opportunity sequence regardless of mastery. This yields MNAR-free learning-curve data for LT1. It costs about 2-3 minutes of over-practice, which is ethically trivial, and fast-forward is suspended for that skill only.
4. **Never randomise away learning.** Jitter stays within the window where expected retention ≥ 0.6, so no child is left without review because of an experiment [U]. This is a binding child-wellbeing constraint.
5. **Log every scheduling decision** with its random draw and propensity, so causal estimands (spacing effects) can be inverse-propensity-weighted (Rafferty 2019 style; learning-science §8.4).

---

## 6. What the models can reveal: patterns, not types

### 6.1 The acquisition × durability grid

Durability (C3) can be estimated per child. Acquisition (C2) can at best be *described* (opportunities used to reach criterion), but not reliably estimated as a rate (§5.6). The grid below is therefore a **descriptive** frame for topic-type-scoped patterns. It is a research and teaching tool; it is not a typology and is never shown as a 2×2 to anyone.

| pattern (per topic type, this term) | what the data look like | first explanations to rule out (in order) | Taxila's response |
|---|---|---|---|
| quick to reach criterion, holds well | few opportunities to criterion; delayed checks succeed at long lags | items too easy or mis-levelled (check θ vs item b) | extend intervals; move on; offer challenge |
| quick to reach criterion, fades faster than typical | few opportunities; delayed successes drop at short lags | (1) massed acquisition, so check the schedule; (2) low degree of learning at exit (LT-D4); (3) recognition-only checks; (4) hint-assisted "successes"; (5) ASR noise | add one generative probe before exit; shorten first review interval; retrieval over re-teaching |
| slow start, durable | many opportunities, but what is learned holds | prerequisite gaps inflate opportunities (check prerequisite pL); KC mis-specified (curve audit) | address prerequisites; reassure; keep intervals long |
| slow start, fades | many opportunities and short half-lives | KC/prerequisite problems; ASR; wrong format; low engagement; **wheel-spinning** (kt-algorithms §2.6) | change approach, not dose; probe prerequisites; human escalation if persistent across topics |

**Why the explanations come first.** In every row, the first candidates are properties of the *teaching system*: schedule, items, KC model, grader, prerequisites. The literature says child-level learning-rate differences are small or unproven (§3.1), that forgetting differences shrink once learning is equated (§3.2), and that massing produces fast-but-fragile performance (§3.3). **A pattern is attributed to the child only after the system explanations fail, and then only as "this is how [topic type] is going for her this term".**

### 6.2 Change over time (development)

Each child parameter is refitted with a forgetting prior. Child effects follow a random walk between monthly refits, u_c(m+1) ~ N(u_c(m), σ_drift²), with σ_drift set so the prior half-life is about 3-4 months [U, LT8]. That allows statements like "fractions are holding better this term than last". Because a child's parameter is pulled toward the class-band population, which itself shifts with age, the model separates *personal change* from *ordinary development*. Only personal change beyond the band trend is noteworthy, and only when the posterior supports it (§6.3).

### 6.3 Thresholds before anything reaches a parent

| claim level | requirement | example shape (slots, not script) |
|---|---|---|
| L0 counts | none | "{N} reviews of {topic} after a gap of a week or more; {M} correct" |
| L1 status | kt-algorithms display states (monotone; absence never lowers) | "{topic}: mastered, checked again after {k} days" |
| L2 pattern | durability posterior P(u_c,tt > 0.3) ≥ 0.9 (or < −0.3), **and** ≥ 30 randomised-lag delayed checks in tt, **and** LT3 has shown σ_u,tt ≥ 0.25 on real data, **and** the system explanations in §6.1 have been checked by rule | "For {topic type}, what {name} learns has been holding up well over 1-2 weeks" / "…tends to need a quick review after {d} days; Taxila now schedules that" |
| L3 change | L2 met in two periods, and the posterior of the difference passes 0.9 | "Compared with {earlier period}, {topic type} is holding up better" |
| never | acquisition-rate claims; cross-child rankings; sleep or habit inferences; consolidation or interference per child; any trait wording | n/a |

Thresholds are [U]. Set them by simulation (LT6) so that the false-pattern rate among children with σ-typical true parameters is ≤ 5%.

---

## 7. Communicating with parents

**Principles** (these extend vibe-temperament §2 L1-L5 and learning-science §8.1):
1. **Describe learning, not the learner.** "Fractions are holding up well" rather than "she has a good memory".
2. **Scope everything** to topic type, time period, and conditions ("with Taxila's review schedule").
3. **Show the evidence**: counts, and the dates of delayed checks. Every L2+ sentence links to its Why records (kt-algorithms §2.6).
4. **Say what Taxila does about it, and what helps at home.** Every pattern comes with an action.
5. **Normalise forgetting.** Forgetting is how memory works for everyone. Review is the design, not a remedy for a weak child (Soderstrom & Bjork 2015; Vlach 2014 "time to forget").
6. **Uncertainty is information.** "Still learning how {topic type} holds up for {name}" is the default L2 state, and it is honest.
7. **No comparisons with other children.** Class-band norms are used internally for shrinkage only. The one exception is the grade-equivalent band for θ (C9), framed as level, never rank.
8. **Avoid deficit framing, and give hope backed by evidence.** The strongest finding in this literature is that practice opportunities, not fixed rates, drive differences (Koedinger et al. 2023). It is the right message for anxious parents, and it is true at the population level.

**Banned wording** (enforced in report generation evals; English and Hindi/Hinglish variants):
- "slow learner", "weak memory", "forgets everything", "not a quick learner", "kamzor dimaag", "yaad nahi rehta isko"
- "fast learner" as a trait
- "learning speed" scores
- any IQ-like or percentile language about rate or memory
- sleep or habit inferences ("she's tired", "late nights")
- predictions of future achievement from durability.

**Report block shapes** (an LLM fills the slots from numeric state only; it never invents patterns):

```
[Progress]      {subject}: level band {GE band} (was {GE band} on {date}); ribbon shown.
[Holding up]    {topic type}: {L0 counts}; {L2 sentence if threshold met, else "still learning how this holds up"}.
[What we do]    review interval now {d} days for {topic type}; {next check date}.
[At home]       one evidence-based tip matched to the pattern (e.g., "ask her to explain {topic} to you tomorrow": retrieval + teach-back).
[Change]        {L3 sentence if met}.
```

**Child-facing:** none of the durability language is shown to the child. Children see review as normal practice ("chalo, ek purana sawaal": "come on, one old question"), never as "you forgot this".

---

## 8. Research programme: what could be published

The approach is preregistered, uses within-child micro-randomisation where possible, and requires ethics review with a child-safeguarding advisor. Children get the evidence-based core regardless of arm (learning-science §8.4 hard constraints).

| id | hypothesis / estimand | design | analysis | contribution |
|---|---|---|---|---|
| H1 | Learning-rate regularity holds in Indian children aged 6-15 under an MNAR-robust design | fixed-length calibration sequences (§5.8.3) plus natural data | iAFM per class band; truncation sensitivity (Lee et al. 2026); report sequence-length distributions | first test outside US/EU platforms, across ages 6-15, with exit bias handled |
| H2 | Learning efficiency in children: ρ(β_c, φ_c) < 0 (Zerr) vs ≈ 0 (Underwood with degree equated) | joint model §5.5, with and without the S_ck conditioning | posterior of Ω[2,3] by class band | developmental extension of Zerr et al. 2018 |
| H3 | Forgetting rate declines with age once degree of learning is equated (Brainerd) | cross-sectional by class, plus longitudinal within child | φ0 by class band; within-child φ_c drift | large-n test of a 35-year-old developmental question |
| H4 | Optimal gap/RI ratio differs by age band and topic type | micro-randomised lag jitter (§5.8.1) | IPW gap × RI surface per band (Cepeda ridgeline) | first children's temporal ridgeline in the wild |
| H5 | Overnight consolidation: next-day first attempts beat same-day matched-lag checks, more for T2/T3 than T4 | natural variation + jitter | κ by band × topic type | in-the-wild replication of Henderson 2012 / Weighall & Kellar |
| H6 | Interference: confusable intervening learning lowers retention, more for younger children | randomise inter-skill spacing for confusable pairs within safe bounds | ι_e by band | ages 6-15 extension of Darby & Sloutsky |
| H7 | Break effects: ψ by break length and band, with test-invariant measurement | natural breaks; re-probe items calibrated across time | state-space model; measurement-invariance checks (Workman et al. 2023 lesson) | Indian vacation-loss evidence with replication discipline |
| H8 | Durability is a stable child characteristic within topic type over 3-6 months | split-half and test-retest of u_c | reliability and stability coefficients | prerequisite for any parent claim (LT-D1) |

**Publication hygiene.** Report all specifications, not one; share code and simulated data. Data sharing requires consent scope and the DPDP opinion (learning-science §4.3). Negative results (e.g. H8 fails) are published and change the product: if durability is not stable, L2 claims are removed.

---

## 9. Measurements this design depends on

| id | question | method | blocks |
|---|---|---|---|
| LT1 | Child slope SD under MNAR-robust data | iAFM on calibration sequences, ≥ 500 children per class band | LT-D1 reversal; H1 |
| LT2 | ρ(acquisition, durability) by band | joint model §5.5 | H2; §6.1 interpretation |
| LT3 | σ_u,tt: real child variance in durability per topic type | HLR-C on randomised-lag checks | L2 parent claims (§6.3) |
| LT4 | Gap × RI surface by band | IPW on jittered lags | scheduler targets; replaces FSRS desired retention defaults if better |
| LT5 | Overnight κ by band × topic type | joint model | LT-D6 design rule |
| LT6 | Parameter recovery and false-pattern rate at Taxila's data shape | simulation with real event-time distributions | §6.3 thresholds |
| LT7 | Break ψ and growth-rate SD σ_S | state-space model; GRR/ECR | C9 reporting; Glicko c constant (kt-algorithms §3.2) |
| LT8 | Drift of child parameters over months | monthly refits; test-retest | σ_drift; H8 |
| LT9 | Recall vs recognition sensitivity of delayed checks for ages 6-9 | paired open vs MCQ checks | check format rules |
| LT10 | Does reporting durability to parents change home behaviour, child stress or engagement? | randomised report variants (L0 only vs L0 + L2) | whether L2 reports ship at all (wellbeing gate) |

LT10 is a wellbeing gate. If L2 reports increase parent pressure or child anxiety (measured by parent survey and child session-avoidance), they are withdrawn even if accurate [U].

---

## 10. Invariants (eval-gated)

1. No parent- or child-facing text contains a learning-rate claim, a cross-child rank, or any §7 banned phrase.
2. Every L2/L3 sentence has a backing record with posterior probability, n delayed checks, the topic-type scope, and the list of ruled-out system explanations.
3. Durability estimates never lower displayed mastery. They only set `refresh` and schedule reviews (gurukul A2 law, kt-algorithms §2.6).
4. No feature derived from clock time of day is an input to any model in this document. The overnight flag is calendar-date only.
5. Randomised scheduling never pushes predicted retention below 0.6 for a mastered skill.
6. Child-level parameters are scoped per (subject × topic type), have posterior SDs stored, and decay toward the population.
7. Within-session accuracy is never presented to parents as "learning".

---

## 11. Open questions

1. Is the small learning-rate variance real for children aged 6-9, whose attention, language and ASR noise differ from the adolescent and college samples behind the 2023 claim? [U]
2. Do Indian multilingual children show topic-type-by-language interactions in durability, for example vocabulary learned through Hindi vs English? [U]
3. What delayed-check format is valid for 6-7-year-olds who cannot read? Picture choice is recognition (weaker), and spoken recall carries ASR risk (LT9).
4. How should family-chosen session schedules (I11) be handled? They confound durability estimates, and the habit itself belongs to a separate review.
5. Can relearning savings (C7) be estimated well enough to support the reassuring "comes back quickly" message after breaks? [U]

---

## 12. References

**Learning curves and learning rate**
- Koedinger, K. R., Carvalho, P. F., Liu, R., & McLaughlin, E. A. (2023). An astonishing regularity in student learning rate. *PNAS* 120. https://doi.org/10.1073/pnas.2221311120 [V abstract via Europe PMC]
- Lee, Lichand, Barnard, Klotz, Thille, Kim & Domingue (2026). Revisiting the regularity of student learning rate: sensitivity to which observations are included. arXiv 2605.01690. https://arxiv.org/abs/2605.01690 [V]
- Simpson, M. A., Norberg, K. A., & Fancsali, S. E. (2024). Replicating an "astonishing regularity in student learning rate". EDM 2024. https://educationaldatamining.org/edm2024/proceedings/2024.EDM-short-papers.40/index.html [V]
- Gold, G., Borchers, C., & Carvalho, P. F. (2024). Further evidence for regularity in student learning rates across demographic, academic proficiency, and motivational groups. LAK24 Companion. [S]
- Cen, H., Koedinger, K., & Junker, B. (2006). Learning Factors Analysis. ITS 2006. https://doi.org/10.1007/11774303_17 [S]
- Heathcote, A., Brown, S., & Mewhort, D. J. K. (2000). The power law repealed: the case for an exponential law of practice. *Psychonomic Bulletin & Review* 7, 185-207. [S]
- Newell, A., & Rosenbloom, P. (1981). Mechanisms of skill acquisition and the law of practice. [S via Heathcote]
- Pavlik, P., Cen, H., & Koedinger, K. (2009). Performance Factors Analysis. AIED. [V via kt-algorithms]
- Kail, R. (1991). Developmental change in speed of processing during childhood and adolescence. *Psychological Bulletin* 109, 490-501. [S]
- Siegler, R. S. (1996). *Emerging Minds: The Process of Change in Children's Thinking* (overlapping waves). [S]

**Forgetting**
- Murre, J. M. J., & Dros, J. (2015). Replication and analysis of Ebbinghaus' forgetting curve. *PLOS ONE* 10(7): e0120644. https://doi.org/10.1371/journal.pone.0120644 [S]
- Averell, L., & Heathcote, A. (2011). The form of the forgetting curve and the fate of memories. *J. Mathematical Psychology* 55, 25-35. [V]
- Rubin, D. C., & Wenzel, A. E. (1996). One hundred years of forgetting. *Psychological Review* 103, 734-760. [S via Averell & Heathcote]
- Brainerd, C. J., Reyna, V. F., Howe, M. L., & Kingma, J. (1990). The development of forgetting and reminiscence. *Monographs of the SRCD* 55(3-4). [V abstract]
- Brainerd, C. J., Kingma, J., & Howe, M. L. (1985). On the development of forgetting. *Child Development* 56, 1103-1119. [S]
- Underwood, B. J. (1954). Speed of learning and amount retained: a consideration of methodology. *Psychological Bulletin* 51, 276-282. [S]
- Zerr, C. L., Berg, J. J., Nelson, S. M., Fishell, A. K., Savalia, N. K., & McDermott, K. B. (2018). Learning efficiency: identifying individual differences in learning rate and retention in healthy adults. *Psychological Science* 29 (PubMed 29953332). [V abstract]

**Spacing, retrieval, schedulers**
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. *Psychological Bulletin* 132, 354-380. [S]
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychological Science* 19, 1095-1102. https://files.eric.ed.gov/fulltext/ED505660.pdf [V]
- Latimier, A., Peyre, H., & Ramus, F. (2021). A meta-analytic review of the benefit of spacing out retrieval practice episodes on retention. *Educational Psychology Review* 33, 959-987. [S]
- Yang, C., Luo, L., Vadillo, M. A., Yu, R., & Shanks, D. R. (2021). Testing (quizzing) boosts classroom learning: a systematic and meta-analytic review. *Psychological Bulletin* 147, 399-435. [V abstract]
- Murray, E., et al. (2025). A meta-analytic review of the effectiveness of spacing and retrieval practice for mathematics learning. *Educational Psychology Review* 37:75. [S]
- Vlach, H. A., & Sandhofer, C. M. (2012). Distributing learning over time: the spacing effect in children's acquisition and generalization of science concepts. *Child Development* 83, 1137-1144. [S]; Vlach, H. A. (2014). The spacing effect in children's generalization of knowledge. *Child Development Perspectives* 8, 163-168. [S]
- Barzagar Nazari, K., & Ebersbach, M. (2019). Distributing mathematical practice of third and seventh graders. *Applied Cognitive Psychology* 33, 288-298. [S]
- Ebersbach, M., & Barzagar Nazari, K. (2020). No robust effect of distributed practice on the short- and long-term retention of mathematical procedures. *Frontiers in Psychology* 11:811. [V]
- Lindsey, R. V., Shroyer, J. D., Pashler, H., & Mozer, M. C. (2014). Improving students' long-term knowledge retention through personalized review. *Psychological Science* 25, 639-647. [S]
- Soderstrom, N. C., & Bjork, R. A. (2015). Learning versus performance: an integrative review. *Perspectives on Psychological Science* 10, 176-199. [S]
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning (HLR). ACL. https://aclanthology.org/P16-1174.pdf [V]
- Pavlik, P. I., & Anderson, J. R. (2005). Practice and forgetting effects on vocabulary memory: an activation-based model of the spacing effect. *Cognitive Science* 29, 559-586. [S]
- Walsh, M. M., Gluck, K. A., Gunzelmann, G., Jastrzembski, T., Krusmark, M., et al. (2018). Mechanisms underlying the spacing effect in learning: a comparison of three computational models. *JEP: General*. [S]; PPE equations as restated in Sense et al. (2022), ICCM. https://www.floriansense.com/files/Sense_etal_2022_ICCM.pdf [V]
- Choffin, B., Popineau, F., Bourda, Y., & Vie, J.-J. (2019). DAS3H: modeling student learning and forgetting for optimally scheduling distributed practice of skills. EDM. https://arxiv.org/abs/1905.06873 [V]
- Open Spaced Repetition. srs-benchmark (10 k Anki users, ~350 M reviews). https://github.com/open-spaced-repetition/srs-benchmark [V]

**Interference, consolidation, sleep**
- Darby, K. P., & Sloutsky, V. M. (2015a). The cost of learning: interference effects in memory development. *JEP: General*. https://doi.org/10.1037/xge0000051 [V abstract]
- Darby, K. P., & Sloutsky, V. M. (2015b). When delays improve memory: stabilizing memory in children may require time. *Psychological Science* 26, 1937-1946. [V abstract]
- Lee, K., & Bussey, K. (2001). Children's susceptibility to retroactive interference: the effects of age and degree of learning. *J. Experimental Child Psychology*. [S]
- Weighall, A., & Kellar, I. (2023). Sleep and memory consolidation in healthy, neurotypical children, and adults: a summary of systematic reviews and meta-analyses. *Emerging Topics in Life Sciences* 7, 513-524. https://doi.org/10.1042/ETLS20230110 [V]
- Henderson, L. M., Weighall, A. R., Brown, H., & Gaskell, M. G. (2012). Consolidation of vocabulary is associated with sleep in children. *Developmental Science* 15, 674-687. [S]
- Wilhelm, I., Rose, M., Imhof, K. I., Rasch, B., Büchel, C., & Born, J. (2013). The sleeping child outplays the adult's capacity to convert implicit into explicit knowledge. *Nature Neuroscience* 16, 391-393. [S]
- Souabni, M., et al. (2025). Napping and memory consolidation in early childhood: a systematic review and meta-analysis. *Sleep Medicine*. [S]
- Dewald, J. F., Meijer, A. M., Oort, F. J., Kerkhof, G. A., & Bögels, S. M. (2010). The influence of sleep quality, sleep duration and sleepiness on school performance in children and adolescents: a meta-analytic review. *Sleep Medicine Reviews* 14, 179-189. [S]

**Transfer, fade-out, long-horizon growth**
- Bailey, D., Duncan, G. J., Odgers, C. L., & Yu, W. (2017). Persistence and fadeout in the impacts of child and adolescent interventions. *J. Research on Educational Effectiveness* 10, 7-39. [S]; Bailey, D. H., Duncan, G. J., Cunha, F., Foorman, B. R., & Yeager, D. S. (2020). Persistence and fade-out of educational-intervention effects. *Psychological Science in the Public Interest* 21, 55-97. [S]
- Barnett, S. M., & Ceci, S. J. (2002). When and where do we apply what we learn? A taxonomy for far transfer. *Psychological Bulletin* 128, 612-637. [U]
- Rohrer, D., Dedrick, R. F., Hartwig, M. K., & Cheung, C.-N. (2020). A randomized controlled trial of interleaved mathematics practice. *J. Educational Psychology* 112, 40-52. [S via learning-science §3.5]
- Brinkhuis, M. J. S., Savi, A. O., Hofman, A. D., Coomans, F., van der Maas, H. L. J., & Maris, G. (2018). Learning as it happens: a decade of analyzing and shaping a large-scale online learning system. *J. Learning Analytics* 5(2), 29-46. https://doi.org/10.18608/jla.2018.52.3 [V abstract]
- Chow, S.-M., Lee, J., Hofman, A., van der Maas, H., Pearl, D., & Molenaar, P. (2025). Control theory forecasts of optimal training dosage to facilitate children's arithmetic learning in a digital educational application. *Psychometrika*. [S]
- Workman, J., von Hippel, P. T., & Merry, J. (2023). Findings on summer learning loss often fail to replicate, even in recent data. *Sociological Science* 10, 251-285. https://doi.org/10.15195/v10.a8 [V]
- Kuhfeld, M. (2019). Surprising new evidence on summer learning loss. *Phi Delta Kappan* 101(1). [S]
- Azim Premji Foundation (2021). Loss of learning during the pandemic. http://publications.azimpremjifoundation.org/2490/ [S]

**Measurement of change**
- Brandmaier, A. M., von Oertzen, T., Ghisletta, P., Lindenberger, U., & Hertzog, C. (2018). Precision, reliability, and effect size of slope variance in latent growth curve models. *Frontiers in Psychology* 9:294. https://doi.org/10.3389/fpsyg.2018.00294 [V full text via Europe PMC]
- Rast, P., & Hofer, S. M. (2014). Longitudinal design considerations to optimize power to detect variances and covariances among rates of change. *Psychological Methods* 19, 133-154. [S]
- Willett, J. B. (1989). Some results on reliability for the longitudinal measurement of change. *Educational and Psychological Measurement* 49, 587-602. [S via Brandmaier]
