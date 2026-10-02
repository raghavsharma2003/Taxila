# Paper 1 outline: what can an AI tutor know about one child?

**Date:** 2026-10-02 · **Status:** outline for a Stage 1 Registered Report. Not submitted; not yet reviewed by an ethics committee. · **Program context:** `RESEARCH-PROGRAM.md` §8.11 lists this as output 1. It is the measurement gate (G1-G5) that every later Taxila paper depends on.

**Why this paper first:**
1. **Its Study 1 needs no child outcomes.** It needs only the generative assumptions and the platform's event-time distributions from the Phase 0 pilot, so Stage 1 can be submitted before the main cohort starts.
2. **Every later paper needs its results.** PH1-PH8 cite its reliability cards, invariance results and external validity.
3. **It answers the owner's question directly**: what Taxila can validly say about one child's learning, cognition, metacognition, motivation and style, and when.
4. **It is publishable whatever the result.** "Mostly facts, few patterns" is itself the contribution.

---

## Working title

**How much can an AI tutor know about one child? A Registered Report on the reliability, invariance and limits of individual inference from embedded learning measures in Indian children aged 6-15**

Alternative titles:
- *Dense data, thin individuals: in-deployment reliability of learning, metacognitive, motivational and interaction measures in a voice AI tutor*
- *What a tutor can honestly say: simulation-calibrated limits of per-child inference from learning logs*

**Format:** a Registered Report with two studies.
- Study 1: a pre-registered simulation, complete at Stage 1.
- Study 2: a pre-registered prospective measurement study, run after Stage 1 acceptance in principle.

**Candidate venues** [U: verify each journal's current Registered Report policy and scope before choosing]: *Advances in Methods and Practices in Psychological Science*, *Developmental Science*, *Collabra: Psychology*, *Journal of Learning Analytics*. A companion data descriptor would go to a data journal after Stage 2.

**Team (to be confirmed):**
- a developmental psychologist (lead);
- a psychometrician;
- an independent biostatistician, who holds the analysis keys for the confirmatory holdout;
- an Indian education researcher, with links to an Indian university IEC;
- Taxila engineering (instrumentation);
- a child-safeguarding advisor.

**Conflict of interest:** Taxila builds the product. This is declared. The independent statistician and the sealed holdout are the mitigations (RESEARCH-PROGRAM §8.10).

---

## Abstract (draft; brackets mark Stage 2 placeholders)

Learning platforms now record thousands of interactions per child. AI tutors can turn those records into fluent descriptions of how a child thinks, and people believe such descriptions whether or not they are valid. Whether they are reliable for an individual child is rarely tested.

We report a Registered Report on Taxila, a voice-first Hindi-English AI tutor used by children aged 6-15 (classes 1-9) in India.

**Study 1** simulated 15 embedded measures at the platform's real data shape and under its wellbeing constraints. The measures span knowledge and memory, domain cognition, metacognition, motivation and habits, and interaction style. For each measure the simulation predicted per-child reliability. For each candidate statement to parents it predicted the false-claim rate.

**Study 2** [tests / tested] these predictions in N = [X] research-consented children over six months:
- reliability estimated across non-overlapping in-deployment windows;
- measurement invariance tested across item language, response modality and age band;
- convergent validity assessed against grade-appropriate external assessments.

**We predicted that:**
- counts of behaviour (session regularity; confidence-by-accuracy tables) would be reliable (ρ ≥ .80);
- per-child learning rates would not be (ρ < .30);
- per-child retention would be limited by the platform's own wellbeing bound on review timing (ρ ≤ .55 at 40 checks);
- interaction signatures would be mostly state-like;
- observed reliabilities would fall within ±.10 of the simulated ones.

[Results.]

A reporting gate that pools within-child contrasts with a two-groups prior [kept / did not keep] false parent claims at the stated rate. A per-claim rule with independent priors did not; in simulation it admitted 4.9 false claims in a report with no true effects.

The results set out what an AI tutor can honestly say about one child, and after how much data.

---

## 1. Introduction

### 1.1 The promise
- Learning products are now large longitudinal instruments.
  - Math Garden used more than a billion children's responses to steer and study learning (Brinkhuis et al. 2018 [V]).
  - Learning-curve regularity was estimated from 1.3 M observations across 27 datasets (Koedinger et al. 2023 [V]).
  - A gamified, IRT-scored cognitive assessment was validated longitudinally in Hindi-speaking children in rural India (DEEP; Bhavnani et al. 2025 [V]).
- Parents want an individual account of their child.
- AI tutors make such accounts cheap to produce, and personal: an LLM can write a "learning profile" in seconds.

### 1.2 The problem
1. **Group results do not transfer to individuals.** Within-person variance was 2-4× larger than group-level variance across six repeated-measures samples (Fisher, Medaglia & Jeronimus 2018 [V]).
2. **The reliability paradox.** Robust experimental effects have little between-person variance, so they make poor individual-difference measures (Hedge et al. 2018 [V]). Trial noise was about 8× individual variability across 24 tasks in adults. Hierarchical models quantify that uncertainty but cannot remove it (Rouder & Haaf 2019 [V]; Rouder, Kumar & Haaf 2023 [V]).
3. **Purpose-built child batteries have modest long-term reliability.** NIH Toolbox 1-3-year ICCs were .31-.76 in 9-15-year-olds, with site differences (Taylor et al. 2022 [V]).
4. **Metacognitive efficiency** has test-retest ICC of .42 even at 400 trials in adults (Rahnev 2025 [V-full]). About 400 trials is a sensible minimum (Guggenmos 2021 [V-full]).
5. **Learning-rate heterogeneity** looks small (Koedinger et al. 2023 [V]), but that estimate is sensitive to which observations are included under mastery-based exit (Lee et al. 2026 [V]).
6. **Adaptive tutors choose what they observe.**
   - Scheduling creates range restriction: half-life regression reached AUC .538 on range-restricted recall data (Settles & Meeder 2016 [S]).
   - Policies create confounding by indication (Klasnja et al. 2015 [V]; Boruvka et al. 2018 [V, sib]).
7. **People rate personality descriptions as accurate regardless of validity.** This is the Forer effect (Forer 1949 [S]). LLM profiles were rated as accurate as questionnaire results by adults (arXiv 2602.15848, N = 33 [V-abstract, preprint]). Conversational personality inference reached only r = .12 when the chatbot acted as an assistant (Peters, Cerf & Matz 2024 [V, sib]).

### 1.3 The gap
To our knowledge, pending a systematic search, no study has done the following for children aged 6-15 in a multilingual, non-Western setting:
- estimated **in-deployment** individual-level reliability of embedded measures across several psychological domains, in the same children;
- tested whether **simulations at the platform's data shape predict** that reliability;
- tested whether **rule-based individual claims** made to parents meet their stated false-claim rates.

DEEP (Bhavnani 2025) is a supervised, non-embedded assessment of young children (39-95 months). Skill Lab (Pedersen et al. 2023 [V]) validated game-based cognition in adults 16+.

### 1.4 Research questions
- **RQ1.** How reliable, in deployment, are 15 embedded measures for individual children, by age band, item language and response modality?
- **RQ2.** Do simulations at the platform's real data shape predict observed reliability, so that a design team can know in advance what it will be able to say?
- **RQ3.** Are embedded measures invariant across Hindi, English and Hinglish item versions, across voice and tap, and across age bands?
- **RQ4.** Do embedded ability estimates converge with external, grade-appropriate assessments? Is voice-based measurement biased against shy children?
- **RQ5.** Do the parent-report gates meet their stated false-claim rates? How long does each claim type take to become eligible, and for which children?

### 1.5 Contribution in one paragraph
The paper delivers four things:
- an **in-deployment reliability map** for individual children across five domains;
- a **tested method (simulation-before-claim)** for deciding, before shipping, which statements about a child a platform may make;
- an **invariance and fairness audit** for voice AI measurement in Hindi-English children;
- a **calibrated reporting gate** that other platforms can adopt.

The results directly inform what AI tutors should and should not say to parents.

---

## 2. Related work (with references)

### 2.1 Learning curves, forgetting and individual differences
- Koedinger et al. (2023), *PNAS* [V]: learning-rate regularity; initial-knowledge variance far exceeds learning-rate variance.
- Lee et al. (2026), arXiv 2605.01690 [V]: slope-variance estimates depend on sequence length. The sign of the exit bias is unknown, so a concave form must be tested.
- Averell & Heathcote (2011), *J Math Psychol* [V]: the form of the forgetting curve, with a non-zero asymptote.
- Zerr et al. (2018), *Psychol Sci* [V abstract]: learning efficiency in adults, reliable over 3 years.
- Shuell & Keppel (1970), *J Educ Psychol* [S]: fast and slow learners among schoolchildren forget at the same rate once degree of learning is equated.
- Cepeda et al. (2008), *Psychol Sci* [V]: the spacing ridgeline in adults.
- Brandmaier et al. (2018), *Front Psychol* [V]: growth-rate reliability and effective curve reliability.

### 2.2 Measuring cognition from games and telemetry in children
- Hedge, Powell & Sumner (2018), *Behav Res Methods* [V]: the reliability paradox.
- Rouder & Haaf (2019) and Rouder, Kumar & Haaf (2023), *Psychon Bull Rev* [V].
- Enkavi et al. (2019), *PNAS* [V]: test-retest of self-regulation measures.
- Taylor et al. (2022), *Psychol Med* [V]: NIH Toolbox reliability in children.
- Younger et al. (2023), *Front Hum Neurosci* [V]: ACE, adaptive EF assessment in grades 3-8.
- Lee, Bull & Ho (2013), *Child Dev* [V]: EF structure across 6-15.
- Pedersen et al. (2023), *Cogn Sci* [V]: Skill Lab.
- Bhavnani et al. (2025), *PLOS Digit Health* [V]: DEEP in rural India.
- Wagenmakers, van der Maas & Grasman (2007), *Psychon Bull Rev* [V]: EZ-diffusion.
- Schneider et al. (2018), *Child Dev* [V]: number-line estimation and maths, r = .44.
- Siegler et al. (2012), *Psychol Sci* [V, sib CD]: fraction knowledge predicts later algebra.
- Banerjee et al. (2025), *Nature* [V]: applied vs academic arithmetic in Indian children.

### 2.3 Metacognition and self-regulated learning traces
- Fleming & Lau (2014), *Front Hum Neurosci* [V]: bias vs sensitivity vs efficiency.
- Guggenmos (2021), *Neurosci Conscious* [V-full]: performance dependence of metacognitive measures.
- Rahnev (2025), *Nat Commun* [V-full]: test-retest of 17 metacognitive measures.
- Bayard et al. (2021) [V, sib MS]: monitoring and control in 7-10-year-olds; gains in control partly from task familiarity.
- Rinne & Mazzocco (2014) [V, sib MS]: arithmetic calibration in grades 5-8.
- Roll et al. (2014), *J Learn Sci* [V]: help-seeking and learning in tutors.
- Aleven et al. (2003, 2016) [V]: help-seeking in ITSs.

### 2.4 Motivation and habits from logs
- Frenzel et al. (2012), *Dev Psychol* [V]: interest is measurement-non-invariant across grades.
- Scherrer & Preckel (2019), *Rev Educ Res* [V]: the motivational decline across schooling.
- Lally et al. (2010), *Eur J Soc Psychol* [V abstract]: habit formation curves.
- Buyalskaya et al. (2023), *PNAS* [V]: habit formation from behavioural big data.
- Hamaker, Kuiper & Grasman (2015), *Psychol Methods* [V]: RI-CLPM.
- Talsma et al. (2018), *Learn Individ Differ* [V/S]: self-efficacy ↔ performance, with an age moderator.
- Moldon, Strohmaier & Wachs (2021), ICSE [V]: streak counters steer behaviour.

### 2.5 Personality and "style" inference
- Roberts & DelVecchio (2000), *Psychol Bull* [V]: rank-order consistency (.43 for 6-17.9-year-olds at a 6.7-year interval; full text Table 3, TV review M1).
- Shoda, Mischel & Wright (1994), *JPSP* [V]: if-then behavioural signatures.
- Achenbach, McConaughy & Howell (1987), *Psychol Bull* [S]: low cross-informant agreement.
- Soto et al. (2008) [V, sib TV]: children's self-reports of personality.
- Peters, Cerf & Matz (2024) [V, sib TV] and Zhu et al. (2025) [V, sib TV]: LLM personality inference.
- Forer (1949) [S]: the fallacy of personal validation.

### 2.6 Reporting to parents and feedback as intervention
- Wisniewski, Zierer & Hattie (2019), *Front Psychol* [V]: feedback effects and their heterogeneity.
- Bergman (2015) [V]: parents' beliefs and achievement.
- Kraft & Rogers (2015) [V]: teacher-parent messages.
- Rhodes et al. (2019) [V] and Rhodes, Gelman & Leslie (2025) [V]: generic and identity language.
- Brummelman et al. (2014), *Psychol Sci* [V]: inflated praise.
- Watkins & Canivez (2004) [V, sib PR]: profile strengths and weaknesses replicate at chance.
- van der Bles et al. (2020) [V, sib PR] and Wintle et al. (2019), *PLoS One* [V]: communicating uncertainty.

### 2.7 Indian ed-tech and learning context
- Muralidharan, Singh & Ganimian (2019), *Am Econ Rev* [V]: Mindspark.
- Scaria, Bhaskaran & George (2023), *Indian J Psychol Med* [V]: SLD prevalence.
- ASER and TaRL (via `learning-science.md` §5 [S]).
- ICMR (2017) national ethical guidelines [V, full text via LAM].

### 2.8 Methods for adaptive and longitudinal data
- Qian et al. (2022), *Psychol Methods* [V]: MRT design.
- Zhang, Janson & Murphy (2020) [V]: inference under bandits.
- Hadad et al. (2021), *PNAS* [V]: confidence intervals in adaptive experiments.
- Gelman et al. (2020) [V]: Bayesian workflow.
- Talts et al. (2018) [V]: simulation-based calibration.
- Putnick & Bornstein (2016), *Dev Rev* [V]: measurement invariance.
- Parsons, Kruijt & Fox (2019), *AMPPS* [S]: reliability reporting as standard practice.
- Weston et al. (2019), *AMPPS* [V]: pre-registration with pre-existing data.
- Bauer & Curran (2003), *Psychol Methods* [V]: over-extraction in growth mixtures.

---

## 3. Study 1: simulation-before-claim (complete at Stage 1)

### 3.1 Purpose
For each of the 15 measures (§4.3), and for each parent-claim type built on them, Study 1 predicts:
- the per-child reliability as a function of data volume;
- the false-claim rate and yield of each claim type under the reporting gate;
- the time until a typical child becomes eligible for each claim.

### 3.2 Generative models
These are the RESEARCH-PROGRAM §5 models, each with parameter grids drawn from the literature and marked [U]:

| measure | model | key parameters |
|---|---|---|
| learning-curve slope | iAFM | child intercept SD .59, slope SD .015 (Koedinger), with × 2.5 sensitivity |
| durability | HLR-C v2 | child half-life SD .25 / .5 log2-units; lag design = scheduler × U(.6, 1.6), clipped to R ∈ [.6, .95] |
| calibration | ordinal SDT | κ, ψ by band; accuracy .70-.90 |
| help coupling | logistic | base rate .15; SD(λ) .5-1.0 |
| regularity | day-level habit model | as in the habit simulation |
| signatures | three-level beta-binomial and TSO | ICC .05-.30 |
| drift | DDM with lapses | lapse rate 1-5% |

**Data shape:**
- sessions, items, bets, checks and choices per child per week are taken from the Phase 0 pilot event-time distributions (RESEARCH-PROGRAM §10, LAM2; outcomes are *not* used);
- the wellbeing constraints (retention bound, bet cap, session caps) are applied exactly as in production.

### 3.3 Estimands and procedure
- **Reliability:** corr(estimate, truth)², plus test-retest correlation between non-overlapping simulated windows. Reported across ≥ 20 seeds with intervals, not as two-decimal points (LOT review R8).
- **Claim calibration:** false claims per report vs Σ(1 − P), under three priors (independent, normal-normal, two-groups), across K, n and effect prevalence.
- **Time to eligibility:** weeks, by usage tercile.

### 3.4 Preliminary results available now (from the component simulations; all assumptions [U])

| measure / claim | preliminary prediction | source |
|---|---|---|
| learning-curve slope reliability | ≤ .04 below 210 observations; .23 at 100 skills × 10; .53-.61 at 30 × 30 | `learning-over-time-relsim.py`; LOT review R8 |
| prior-knowledge θ | .64-.68 at 35 observations; .80-.81 at 70 | same |
| durability offset | .31 / .43 / .49 at 20 / 40 / 80 checks as scheduled; .36 / .52 / .67 in the widest permitted window | LOT review R1 |
| calibration offset κ | .73-.75 at 30 bets; .92 at 120 (at 82% accuracy, ΔConf .38 at 30) | `metacognition-srl-calibsim.py`; MS review P3 |
| resolution ψ | .36-.57 at 30; .72-.85 at 120; r(ΔConf, d′) = .85 | same; MS review P1 |
| help coupling λ | .21 / .51 / .66 / .79 at 50 / 200 / 400 / 800 opportunities | same |
| D28 regularity | .83-.88; anchor share .58-.69 | `motivation-habits-habitsim.py` |
| per-child habit time | r .26-.42 with the truth | same |
| contingency signature | ρ .70 needs 37-597 trials for τ from 1 to .25 | `temperament-vibe-calc.py` |
| drift v | single 30-trial block .36-.59; 3% lapses bias v by −35% | `cognitive-development-reviewsim.py` |
| per-child format effect | ρ .70 needs 78 / 217 / 487 comparisons per arm at τ .5 / .3 / .2 | `learning-analytics-methods-sim.py` |
| claim gate, null report | independent priors: 4.9 false claims (budget believed 0.2); two-groups: 0 | `research-program-synthsim.py` §A |
| claim gate, 30% real effects, n = 120 per arm | two-groups: 7.24 admitted, 0.10 false (believed 0.12); normal-normal: 2.90 false (believed 0.20) | §A |
| change rows, null year | raw-count route 5.6 per child-year; corrected rule 0.05-0.11 | §B |
| time to eligibility (4 sessions a week) | calibration table ~8 weeks; durability L2 ~27 weeks per topic type | §F |

Stage 1 will re-run all of these on one shared generative framework and the pilot data shape, and report intervals.

---

## 4. Study 2: pre-registered measurement study (after Stage 1 acceptance)

### 4.1 Design
- A prospective, embedded measurement study covering the first six months of the Taxila research cohort (RESEARCH-PROGRAM §8).
- External assessment at X0 and X6.
- A supervised 2-week retest sub-sample (n ≈ 300), used for validity only.
- Identifiability randomisations are logged in `DecisionRecord`s: lag jitter, fixed-length calibration sequences, stratified bet sampling and randomised option order.
- Frozen 6-week policy windows.

### 4.2 Participants and sample size
- Research-consented (P4) children in classes 1-9, with age-appropriate assent (ICMR standard: oral, recorded, parent present from 7; written from 12; a willingness check at 6).
- Stratified by class, medium and region.
- **Target ≥ 403 analysable children per age band** (B1-B4), which gives a 95% CI half-width of ±.05 for a test-retest r of .70 (*computed* §C). That is ≥ 1,600 analysable.
- Assuming ~60% are still active at six months [U], enrol ≈ 2,700.
- **Sub-studies:**
  - an external assessment sample of n ≈ 600;
  - a questionnaire sample (parent-rated temperament, from age 10 self-report) of n ≥ 194 per analysed band, which gives r = .20 at 80% power.

### 4.3 Measures (15, in five families)

| family | measure | indicator | model | reliability design |
|---|---|---|---|---|
| knowledge and memory | 1 prior-knowledge θ | diagnostic + first attempts | IRT | odd/even skills; windows |
| | 2 learning-curve slope | fixed-length 8-opportunity calibration sequences | iAFM, linear and concave | independent sequences |
| | 3 durability offset | randomised-lag checks per topic type | HLR-C v2 | non-overlapping windows |
| | 4 skill fluency | correct-answer RT on fact items | lognormal | windows |
| domain cognition | 5 number-line PAE | placements | PAE | windows; alternate forms |
| | 6 fraction-comparison θ | calibrated item set | IRT | windows |
| | 7 akshara θ by class (Hindi-medium B1-B3) | audited items | explanatory IRT | windows |
| | 8 processing speed (drift v) and 9 WM span κ | game blocks | contaminant-mixture DDM; span IRT | blocks; bursts |
| metacognition | 10 calibration offset κ | retrospective bets | ordinal SDT (θ-adjusted) | windows by bet count |
| | 11 help-seeking η and coupling λ | child-initiated requests | logistic | windows by opportunity count |
| | 12 self-correction (W→R) | first responses | hierarchical binomial | windows |
| motivation and habits | 13 regularity D28 and anchor share; challenge-seeking α; persistence ρ | sessions; offers; errors | counts, logistic, hazard | consecutive windows |
| interaction style | 14 think time, words per turn, choice-taking; 15 humour reciprocity | voice turns; offers | TSO; three-level beta-binomial | non-overlapping windows at 4-6 week and 12-week lags |

### 4.4 Procedure
- Product use proceeds as usual.
- External assessors are blind to Taxila data.
- Assessments are given in the child's medium, with grade-appropriate instruments per band. ASER-style tools are used only in foundational bands (LAM review R5.2).
- Questionnaires are translated, back-translated and cognitively interviewed before use.
- Data are pseudonymised and held in the sealed holdout schema.

### 4.5 Data quality and exclusions (pre-registered)
- Events with ASR confidence below ASR_MIN carry no evidence.
- Assisted-suspect sessions are excluded from cognitive and SRL measures.
- Gaming windows are discounted.
- Device-change breakpoints are applied.
- Children with fewer than the minimum data for a measure are excluded *from that measure only*, and the exclusion rates by subgroup are reported, because exclusion is itself a result (RQ5 equity).

---

## 5. Hypotheses (confirmatory; Holm across MP-H1 to MP-H8)

| id | hypothesis | prediction (from Study 1) | supported if | falsified if |
|---|---|---|---|---|
| MP-H1 | **Counts are reliable.** D28 and the calibration table meet individual-reporting reliability. | D28 test-retest ≥ .80; calibration offset ≥ .70 at ≥ 30 bets with ≥ 10 wrong-answer bets | lower 95% CI bound ≥ .75 for D28 in every band, and ≥ .65 for κ in every band from B2 | upper 95% CI bound < .70 in any band |
| MP-H2 | **Per-child learning rate is not measurable** at realistic sequence lengths | slope reliability < .30 on calibration sequences | upper 95% CI bound < .30 in every band | ≥ .60 with lower CI bound ≥ .50 in any band (this would reverse LT-D1) |
| MP-H3 | **Durability is capped by the wellbeing bound** | reliability ≤ .55 at 40 checks under the permitted lag design | point estimate ≤ .55 with upper CI bound < .65 | lower CI bound > .65 |
| MP-H4 | **Simulations predict observed reliability** | each measure within ±.10 of its simulated value at the observed data volume | ≥ 75% of measures pass two one-sided tests at ±.10, and the mean absolute deviation is < .07 | < 50% of measures pass |
| MP-H5 | **Interaction signatures are mostly state-like** | occasion variance ≥ trait variance for ≥ half the dimensions; non-overlapping window agreement r < .50 | true for ≥ 3 of 4 dimensions | trait variance > occasion variance with agreement r ≥ .50 for ≥ 3 of 4 |
| MP-H6 | **Invariance** | partial scalar invariance of θ across Hindi, English and Hinglish versions; voice-vs-tap DIF concentrated in B1 and moderated by literacy | ΔCFI and DIF effect-size criteria met for ≥ 80% of anchor items | configural non-invariance across language versions |
| MP-H7 | **Convergence and shyness × modality bias** | r(θ, grade-appropriate external maths and reading) ≥ .60 disattenuated; the voice-minus-tap θ gap grows with parent-rated shyness | both hold with 90% CI excluding the null | r < .40, or the shyness slope has the opposite sign with P > .9 |
| MP-H8 | **The two-groups gate is calibrated, and the independent-prior gate is not** | on held-out windows, the disconfirmation rate of L2 claims ≈ 1 − P (calibration slope ≈ 1) under the two-groups prior; the independent prior over-claims (replayed on the same data) | calibration slope CI includes 1, and the independent gate's slope CI excludes it | the two-groups slope CI excludes 1 on the over-claiming side |

**Descriptive aims (no inference criterion):**
- D1: weeks to first eligibility per claim type, by usage tercile.
- D2: the reliability distribution by band, language and device class.
- D3: the share of children reaching each gate by gender, medium and SES proxy (equity).

---

## 6. Planned analyses

1. **Reliability estimation.**
   - (a) Split-half by odd/even *sessions*, Spearman-Brown corrected, with children as the bootstrap unit (BCa 95% CIs).
   - (b) Test-retest between non-overlapping 4-week windows, at 4-6 week and 12-week lags, with matched information per window (CD review P2).
   - (c) Hierarchical trial-level reliability from variance components fitted in deployment (Rouder & Haaf).
   - (d) The supervised 2-week retest, reported separately as a validity anchor (CD review P4).
   - Model-based measures use posterior draws and propagate their uncertainty.
2. **Simulation calibration (MP-H4).** For each measure, compute the difference between observed and Study-1-predicted reliability *at that child's actual data volume*, then run TOST at ±.10. Meta-analytic pooling across measures uses a random effect for domain. The pre-registered success rule is in §5.
3. **Invariance (MP-H6).** Logistic-regression DIF with effect-size flags; regularised explanatory-IRT DIF; MNLFA with age in months and language-mix proportion; alignment for many groups; longitudinal invariance across X0 and X6. Modality is modelled as a person-by-item covariate and crossed with literacy band.
4. **Convergent validity (MP-H7).** Correlations between θ and external scores per band, raw and disattenuated, with reliabilities from analysis 1. The shyness × modality test regresses (θ_voice − θ_tap) on parent-rated shyness with band and language covariates, in the questionnaire sub-sample.
5. **Gate calibration (MP-H8).** Replay the frozen gate code on months 1-4. Score admitted claims against months 5-6 held-out windows, and compute calibration slopes (logistic of confirmation on stated P) for the two-groups and independent-prior gates.
6. **Missing data and attrition.** Shared-parameter joint models of measure and dropout. δ-adjusted pattern-mixture sensitivity analysis. Mid-sequence abandonment on calibration sequences reported (LOT review R18). ITT and active populations reported separately.
7. **Multiplicity.** Holm across MP-H1 to MP-H8. The descriptive aims carry no inferential claims.
8. **Robustness.** A multiverse over ASR thresholds, exclusion rules, window lengths and model forms (linear vs concave learning curves; exponential vs power forgetting). Results reported as specification curves.
9. **Holdout.** Analysis code is frozen on simulated data and on the 30% exploratory split. The 70% confirmatory split is unsealed only with the Stage 1 registration id. The seal is declared partial, because product dashboards see aggregate data.
10. **Deviations.** A public, dated deviation log.

**Exploratory (labelled; holdout replication before any claim):** reliability by device class; the familiarity curve for warm-up; EF factor structure by band; correlations among reliable measures (a "monitoring-control" factor, MS H2); per-band minimum-data curves for future products.

---

## 7. Expected contributions

1. **An in-deployment reliability map for individual children** across five psychological domains, in a multilingual Indian sample aged 6-15, with intervals by band, language and modality.
2. **A validated "simulation-before-claim" method.** If MP-H4 holds, platforms can decide before shipping which per-child statements are honest. If it fails, they must measure in deployment before making any statement, which is also a usable rule.
3. **An empirical honesty budget for AI tutors and parent reports.** The paper shows what is reliable for one child (counts, ledger facts, some calibration tables) and what is not (learning rates, most within-child contrasts, personality-like profiles, short-horizon growth rates). This is policy-relevant for EdTech marketing claims and for LLM "profiles" of children.
4. **An invariance and fairness audit** of voice AI measurement in Hindi-English children, including a direct test of whether voice-first assessment penalises shy children.
5. **A calibrated, open reporting gate**, the two-groups prior with fixed menus and budget, with code and synthetic data.
6. **Open materials:** simulation code, reliability cards, analysis code and a synthetic dataset matching the marginals. A controlled-access de-identified extract follows, subject to DPDP counsel.

**What each pattern of results would mean:**

| result pattern | meaning for the field | meaning for Taxila |
|---|---|---|
| counts reliable, patterns not | individual psychological profiling from logs is mostly unsupported, even at high density | a fact-first report is validated |
| simulations accurate (MP-H4) | design-time honesty is possible | thresholds can be set before launch for new constructs |
| simulations miss in one direction | simulation assumptions are systematically optimistic or pessimistic | measure first, simulate second |
| signatures trait-like (MP-H5 fails) | AI tutors may measure stable interaction styles | the ISP gets more lines, still without labels |
| invariance fails across languages | cross-language comparisons from voice AI are unsafe | report within language only |
| shyness × modality bias present | voice-first assessment needs tap alternatives | adaptive modality for affected children |

---

## 8. Limitations and threats to validity

- **Self-selection:** "Taxila users", not Indian children in general.
- **ASR and device heterogeneity:** gated and modelled, but residual.
- **The product changes:** frozen windows plus policy-version effects.
- **Parent help during sessions:** detection is imperfect.
- **School and tuition exposure:** ecological retention by design, plus a covariate.
- **Attrition:** informative; modelled; sensitivity reported.
- **Holdout leakage through dashboards:** a partial seal is declared.
- **Construct transfer:** many constructs come from Western samples. Invariance testing and qualitative studies (MH7, MS9) mitigate this.
- **Simulation assumptions are [U] by construction.** MP-H4 exists to test them.
- **Conflict of interest:** the independent statistician and the Registered Report format mitigate it.

---

## 9. Ethics statement (draft)

- Approval comes from a registered Indian university IEC under ICMR 2017. "Routine research on children" is a minor increase over minimal risk, so full-committee review is expected.
- Two-tier consent: service and research. Declining research never changes the service.
- Assent: a willingness check at 6; oral, recorded, with a parent present, by a neutral narrator (never the tutor persona) at 7-11; written and co-signed from 12. Dissent is honoured at any time.
- Incomplete disclosure ("Taxila tries different good ways of teaching") with an annual debrief, approved by the IEC.
- No raw audio or transcripts leave the restricted store.
- Safeguarding SOP with the Childline 1098 / Tele-MANAS 14416 hand-off. POCSO duties resolved with counsel before submission.
- An independent monitoring group can pause any part of the study.
- Research data never write back to a child's profile (DPDP s.17(2)(b)).

---

## 10. Data and code availability (planned)

- **Public:** analysis code, simulation code, model files, reliability cards and a synthetic dataset.
- **Controlled access:** de-identified event-level extracts with pseudonymous ids, month-level dates and coarsened age; small cells suppressed (k < 10). Released under a data-use agreement, subject to DPDP counsel.
- **Never released:** audio and transcripts.

---

## 11. Timeline (indicative)

| month (relative to cohort start) | step |
|---|---|
| −3 to 0 | Phase 0 pilot (n ≈ 300): instrumentation audits, ASR, assent comprehension, event-time distributions |
| −1 | Study 1 complete; Stage 1 submission |
| 0 | cohort enrolment (after in-principle acceptance; otherwise the pre-registration goes to OSF) |
| 0-6 | Study 2 data collection; X0 and X6 assessments |
| 7-8 | holdout unsealed; confirmatory analyses; Stage 2 submission |

---

## 12. Figures and tables plan

- **Fig 1:** the data flow from runtime to research extract to claim gate, showing the firewalls.
- **Fig 2:** predicted (Study 1) against observed (Study 2) reliability by measure, with ±.10 equivalence bands.
- **Fig 3:** reliability against data volume curves per measure, with the vertical lines at the reporting gates.
- **Fig 4:** time to eligibility per claim type by usage tercile, and the share of children reaching each gate by subgroup.
- **Fig 5:** gate calibration plots (stated P against the confirmation rate) for the three priors.
- **Table 1:** the measures, indicators, models and reliability designs.
- **Table 2:** invariance results.
- **Table 3:** convergent validity, and the shyness × modality test.

---

## References (tags as in the component documents)

- Achenbach, T. M., McConaughy, S. H., & Howell, C. T. (1987). Child/adolescent behavioral and emotional problems: implications of cross-informant correlations. *Psychol Bull* 101:213. doi:10.1037/0033-2909.101.2.213 [S]
- Aleven, V., Stahl, E., Schworm, S., Fischer, F., & Wallace, R. (2003). Help seeking and help design in interactive learning environments. *Rev Educ Res*. [V, sib MS]
- Averell, L., & Heathcote, A. (2011). The form of the forgetting curve and the fate of memories. *J Math Psychol* 55:25-35. [V, sib LOT]
- Banerjee, A. V., Bhattacharjee, S., Chattopadhyay, R., Duflo, E., et al. (2025). Children's arithmetic skills do not transfer between applied and academic mathematics. *Nature*. doi:10.1038/s41586-024-08502-w [V, sib CD]
- Bauer, D. J., & Curran, P. J. (2003). Distributional assumptions of growth mixture models. *Psychol Methods* 8:338. doi:10.1037/1082-989X.8.3.338 [V, sib LAM]
- Bergman, P. (2015). Parent-child information frictions and human capital investment. doi:10.2139/ssrn.2622034 [V, sib PR]
- Bhavnani, S., et al. (2025). A non-specialist worker delivered digital assessment of cognitive development (DEEP) in young children: a longitudinal validation study in rural India. *PLOS Digit Health*. doi:10.1371/journal.pdig.0000824 [V, sib CD]
- Brandmaier, A. M., von Oertzen, T., Ghisletta, P., Lindenberger, U., & Hertzog, C. (2018). Precision, reliability, and effect size of slope variance in latent growth curve models. *Front Psychol* 9:294. doi:10.3389/fpsyg.2018.00294 [V, sib LOT]
- Brinkhuis, M. J. S., Savi, A. O., Hofman, A. D., Coomans, F., van der Maas, H. L. J., & Maris, G. (2018). Learning as it happens: a decade of analyzing and shaping a large-scale online learning system. *J Learn Anal*. [V, sib LAM]
- Brummelman, E., Thomaes, S., Orobio de Castro, B., Overbeek, G., & Bushman, B. J. (2014). "That's not just beautiful, that's incredibly beautiful!" *Psychol Sci*. doi:10.1177/0956797613514251 [V, sib PR]
- Buyalskaya, A., Ho, H., Milkman, K. L., Li, X., Duckworth, A. L., & Camerer, C. (2023). What can machine learning teach us about habit formation? *PNAS* 120:e2216115120. [V, sib MH]
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychol Sci*. [V, sib LOT]
- Enkavi, A. Z., et al. (2019). Large-scale analysis of test-retest reliabilities of self-regulation measures. *PNAS*. doi:10.1073/pnas.1818430116 [V, sib CD]
- Fisher, A. J., Medaglia, J. D., & Jeronimus, B. F. (2018). Lack of group-to-individual generalizability is a threat to human subjects research. *PNAS*. doi:10.1073/pnas.1711978115 [V, sib LAM]
- Fleming, S. M., & Lau, H. C. (2014). How to measure metacognition. *Front Hum Neurosci*. doi:10.3389/fnhum.2014.00443 [V, sib MS]
- Forer, B. R. (1949). The fallacy of personal validation. *J Abnorm Soc Psychol*. doi:10.1037/h0059240 [S]
- Frenzel, A. C., Pekrun, R., Dicke, A.-L., & Goetz, T. (2012). Beyond quantitative decline: conceptual shifts in adolescents' development of interest in mathematics. *Dev Psychol* 48:1069. doi:10.1037/a0026895 [V, sib MH]
- Gelman, A., Vehtari, A., Simpson, D., et al. (2020). Bayesian workflow. arXiv:2011.01808 [V, sib LAM]
- Guggenmos, M. (2021). Measuring metacognitive performance: type 1 performance dependence and test-retest reliability. *Neurosci Conscious*. doi:10.1093/nc/niab040 [V-full, sib MS]
- Hadad, V., Hirshberg, D. A., Zhan, R., Wager, S., & Athey, S. (2021). Confidence intervals for policy evaluation in adaptive experiments. *PNAS*. doi:10.1073/pnas.2014602118 [V, sib LAM]
- Hamaker, E. L., Kuiper, R. M., & Grasman, R. P. P. P. (2015). A critique of the cross-lagged panel model. *Psychol Methods*. doi:10.1037/a0038889 [V, sib LAM]
- Hedge, C., Powell, G., & Sumner, P. (2018). The reliability paradox. *Behav Res Methods* 50:1166. doi:10.3758/s13428-017-0935-1 [V, sib CD]
- Indian Council of Medical Research (2017). *National Ethical Guidelines for Biomedical and Health Research Involving Human Participants*. New Delhi: ICMR. [V full text, sib LAM]
- Klasnja, P., Hekler, E. B., Shiffman, S., Boruvka, A., Almirall, D., Tewari, A., & Murphy, S. A. (2015). Microrandomized trials. *Health Psychol*. doi:10.1037/hea0000305 [V, sib LAM]
- Koedinger, K. R., Carvalho, P. F., Liu, R., & McLaughlin, E. A. (2023). An astonishing regularity in student learning rate. *PNAS*. doi:10.1073/pnas.2221311120 [V, sib LAM]
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed. *Eur J Soc Psychol* 40:998. doi:10.1002/ejsp.674 [V abstract, sib MH]
- Lee, K., Bull, R., & Ho, R. M. H. (2013). Developmental changes in executive functioning. *Child Dev*. doi:10.1111/cdev.12096 [V, sib CD]
- Lee, Lichand, Barnard, Klotz, Thille, Kim & Domingue (2026). Revisiting the regularity of student learning rate: sensitivity to which observations are included. arXiv:2605.01690 [V, sib LOT]
- Moldon, L., Strohmaier, M., & Wachs, J. (2021). How gamification affects software developers: cautionary evidence from a natural experiment on GitHub. ICSE. doi:10.1109/icse43902.2021.00058 [V, sib MH]
- Muralidharan, K., Singh, A., & Ganimian, A. J. (2019). Disrupting education? Experimental evidence on technology-aided instruction in India. *Am Econ Rev*. doi:10.1257/aer.20171112 [V, sib LAM]
- Parsons, S., Kruijt, A.-W., & Fox, E. (2019). Psychological science needs a standard practice of reporting the reliability of cognitive-behavioral measurements. *AMPPS*. [S]
- Pedersen, M. K., et al. (2023). Measuring cognitive abilities in the wild: validating a population-scale game-based cognitive assessment. *Cogn Sci* 47:e13308. [V, sib CD]
- Putnick, D. L., & Bornstein, M. H. (2016). Measurement invariance conventions and reporting. *Dev Rev*. doi:10.1016/j.dr.2016.06.004 [V, sib LAM]
- Qian, T., Walton, A. E., Collins, L. M., Klasnja, P., Lanza, S. T., Nahum-Shani, I., et al. (2022). The microrandomized trial for developing digital interventions. *Psychol Methods*. doi:10.1037/met0000283 [V, sib LAM]
- Rahnev, D. (2025). A comprehensive assessment of current methods for measuring metacognition. *Nat Commun*. doi:10.1038/s41467-025-56117-0 [V-full, sib MS]
- Roberts, B. W., & DelVecchio, W. F. (2000). The rank-order consistency of personality traits from childhood to old age. *Psychol Bull* 126:3. doi:10.1037/0033-2909.126.1.3 [V, sib TV]
- Roll, I., Baker, R. S. J. d., Aleven, V., & Koedinger, K. R. (2014). On the benefits of seeking (and avoiding) help in online problem-solving environments. *J Learn Sci*. [V, sib MS]
- Rouder, J. N., & Haaf, J. M. (2019). A psychometrics of individual differences in experimental tasks. *Psychon Bull Rev*. doi:10.3758/s13423-018-1558-y [V, sib CD]
- Rouder, J. N., Kumar, A., & Haaf, J. M. (2023). Why many studies of individual differences with inhibition tasks may not localize correlations. *Psychon Bull Rev*. doi:10.3758/s13423-023-02293-3 [V, sib CD]
- Scaria, L. M., Bhaskaran, D., & George, B. (2023). Prevalence of specific learning disorders among children in India: systematic review and meta-analysis. *Indian J Psychol Med*. doi:10.1177/02537176221100128 [V, sib CD]
- Scherrer, V., & Preckel, F. (2019). Development of motivational variables and self-esteem during the school career: a meta-analysis of longitudinal studies. *Rev Educ Res* 89:211. doi:10.3102/0034654318819127 [V, sib MH]
- Schneider, M., et al. (2018). Associations of number line estimation with mathematical competence: a meta-analysis. *Child Dev* 89:1467. doi:10.1111/cdev.13068 [V, sib CD]
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL*. doi:10.18653/v1/P16-1174 [S]
- Shoda, Y., Mischel, W., & Wright, J. C. (1994). Intraindividual stability in the organization and patterning of behavior. *JPSP* 67:674. doi:10.1037/0022-3514.67.4.674 [V, sib TV]
- Talsma, K., Schüz, B., Schwarzer, R., & Norris, K. (2018). I believe, therefore I achieve (and vice versa). *Learn Individ Differ* 61:136. doi:10.1016/j.lindif.2017.11.015 [V/S, sib MH, LAM]
- Talts, S., Betancourt, M., Simpson, D., Vehtari, A., & Gelman, A. (2018). Validating Bayesian inference algorithms with simulation-based calibration. arXiv:1804.06788 [V, sib LAM]
- Taylor, B. K., et al. (2022). Reliability of the NIH toolbox cognitive battery in children and adolescents: a 3-year longitudinal examination. *Psychol Med*. doi:10.1017/s0033291720003487 [V, sib CD]
- Wagenmakers, E.-J., van der Maas, H. L. J., & Grasman, R. P. P. P. (2007). An EZ-diffusion model for response time and accuracy. *Psychon Bull Rev* 14:3-22. [V, sib CD]
- Weston, S. J., Ritchie, S. J., Rohrer, J. M., & Przybylski, A. K. (2019). Recommendations for increasing the transparency of analysis of preexisting data sets. *AMPPS*. doi:10.1177/2515245919848684 [V, sib LAM]
- Wintle, B. C., Fraser, H., Wills, B. C., Nicholson, A. E., & Fidler, F. (2019). Verbal probabilities: very likely to be somewhat more confusing than numbers. *PLoS One*. doi:10.1371/journal.pone.0213522 [V, sib PR]
- Wisniewski, B., Zierer, K., & Hattie, J. (2019). The power of feedback revisited. *Front Psychol*. doi:10.3389/fpsyg.2019.03087 [V, sib PR]
- Younger, J. W., et al. (2023). Better together: novel methods for measuring and modeling development of executive function diversity while accounting for unity. *Front Hum Neurosci*. doi:10.3389/fnhum.2023.1195013 [V, sib CD]
- Zerr, C. L., Berg, J. J., Nelson, S. M., Fishell, A. K., Savalia, N. K., & McDermott, K. B. (2018). Learning efficiency: identifying individual differences in learning rate and retention in healthy adults. *Psychol Sci* 29. [V abstract, sib LOT]
- Zhang, K. W., Janson, L., & Murphy, S. A. (2020). Inference for batched bandits. *NeurIPS*. arXiv:2002.03217 [V, sib LAM]

Bibliographic details marked [S] or carried from sibling files are re-checked against the primary source before Stage 1 submission. A systematic search (PRISMA-style, documented) backs every "to our knowledge" statement.

---

## Roadmap after paper 1 (from RESEARCH-PROGRAM §8.11)

2. A measurement and data descriptor (G1-G5).
3. Micro-randomised trials of teaching moves (PH4 + PH5).
4. Personalisation versus population-best, as a Registered Report (PH6).
5. Efficacy, as a Registered Report (PH1).
6. Learning rate and forgetting across ages 6-15 (PH2 + PH3).
7. Competence, self-initiation and context-consistent repetition (PH7 + PH8).
8. The parent-report RCT.
