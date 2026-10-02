# Taxila Learning Science Research Program

**Date:** 2026-10-02 · **Status:** synthesis v1, input for the main loop. Not yet pre-registered, and not yet reviewed by an ethics committee. · **Scope:** Taxila, classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish tutor with probes, games, a Director and a Conductor.

**What this document is.** It is the single plan that turns Taxila's logs into three things:
1. honest, useful understanding of each child for parents;
2. better teaching decisions;
3. developmental science that a peer reviewer would accept.

It composes seven component reviews. Each component review ends with an adversarial methodologist review.

| code | file (this folder unless noted) | covers |
|---|---|---|
| **LOT** | `learning-over-time.md` | acquisition, forgetting, spacing, consolidation, interference, transfer, long-horizon growth |
| **CD** | `cognitive-development.md` | executive functions, speed, attention, reasoning, Hindi-English language, numeracy, Devanagari reading, the flag-for-professional pathway |
| **MS** | `metacognition-srl.md` | calibration, judgments of learning, error monitoring, help-seeking, planning, effort regulation |
| **MH** | `motivation-habits.md` | self-determination theory, interest, challenge-seeking, persistence, self-efficacy, emotions, engagement, habits, lapse, compulsion |
| **TV** | `temperament-vibe.md` | temperament, personality and "vibe", restated as interaction signatures (the ISP) |
| **LAM** | `learning-analytics-methods.md` | micro-randomised trials, bandits, hierarchical Bayes, accelerated longitudinal design, causal inference, invariance, pre-registration, ethics, the umbrella study |
| **PR** | `parent-reports.md` | the evidence on reporting to parents, and the original report design |
| **LS** | `../learning-science.md` | probes P1-P24, the learning-styles reframe, the LearningProfile, backlog E1-E8 |

**Companion files:**
- `PARENT-REPORT.md`: the weekly, monthly and term report specification.
- `PAPER-OUTLINE.md`: the first paper.
- `research-program-synthsim.py`: new computations for this synthesis, sections §A-§F. It uses numpy only, has a fixed seed and runs in about 30 s.

**Rule of precedence.** Several methodologist reviews corrected load-bearing numbers and readings. In most cases the component's main body still shows the uncorrected text; §15 lists the pending edits. **Where a review and its main body disagree, this program uses the reviewed version and says so.** Where two component documents conflict, §12 records the resolution.

**Evidence tags** are inherited from the component documents:
- **[V]**: the primary source was checked.
- **[V, sib]**: verified by a sibling file.
- **[S]**: secondary or bibliographic only.
- **[U]**: unverified, or a design default that must be measured.
- **[I]**: an inference.
- *computed*: a simulation output. Its assumptions are [U]; its arithmetic is reproducible. The script is named each time.

This document adds no new literature. Its new content is the composition, the instrumentation spec, the consolidated hypotheses, and the §A-§F computations.

---

## 0. Program decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| RP-D1 | **Three tiers of claim, decided per construct and per age band.** **S** (science): population-level and published. **K** (knob): internal teaching adaptation within bounded ranges. **P** (parent): facts (L0 counts, L1 ledger states), patterns (L2) and change (L3), each under gates. A construct can be S without being K or P, and most are. | Most constructs that can be published at population level cannot be estimated for one child at realistic data volume. This follows from LT-D1, MS-D3, MH-D2, TV4 and LAM-D7, and from the computed reliabilities in §3. | Per construct: its own reversal measurement, listed in §3. |
| RP-D2 | **Logs are policy outputs.** Every decision that could be randomised writes a `DecisionRecord` with propensity, availability, random draw and policy version (LAM-D1). No causal analysis uses a decision whose propensity was not logged. | The Director chooses observations in response to the child's state, so naive move-by-outcome correlations are confounded by indication (LAM T1). | None. This is the precondition for every causal claim. |
| RP-D3 | **Describe learning and behaviour in situations, never the learner.** No trait, type, label, score, percentile, diagnosis, attributed emotion, prediction or cross-child comparison, at any layer. It is enforced by a lexicon predicate, a semantic predicate and a structure predicate, not by instruction. | The union of LOT §7, CD §8.2, MS §7.4, MH §6, TV TVI1 and PR §5.4. Identity language changes children (Rhodes 2019 [V]; Foster-Hanson 2022 [V]). Machine personality inference is weak (r = .12 in assistant mode, Peters, Cerf & Matz 2024 [V, sib TV]). Barnum text is believed regardless of truth (Forer 1949 [S]). | Never. |
| RP-D4 | **Never-per-child list.** The following are never claimed for one child, in any form: learning rate, metacognitive efficiency, habit-formation time, a format or teaching-move effect "for your child", personality or temperament, a growth rate over less than 12 months, a trajectory class, and any cognitive-process change over less than 12 months. | *Computed* reliabilities: learning-rate slope .01-.04 below 210 observations (LOT §5.6). M-Ratio test-retest ICC .42 at 400 trials in adults (Rahnev 2025 [V-full]). Habit t95 r = .26-.42 (MH §5.8). Format ρ = .70 needs 78-487 comparisons per arm (LAM §5.4). GRR .35 at 6 months (LOT R7; §D). Growth-mixture over-extraction (LAM §6.4). Change-score ρ_D = .25 (CD P1). | Each item's own reversal measurement: LT1, MS3, MH3, LAM3, LT7, S-TV1. |
| RP-D5 | **The individual-claim gate** has four parts: (i) an in-deployment reliability card at the claim's own interval, with ρ ≥ .80 for parent text and ≥ .70 for knobs; (ii) distinctiveness from the band default, P(\|child − band\| > δ) ≥ .90; (iii) replication of the claim type in a non-overlapping window, re-appearance ≥ 70%; (iv) for contrasts, a two-groups (spike-and-slab) hierarchical posterior. Counts (L0) and ledger states (L1) are facts and skip (i)-(iv). | TV review C1, C3 and M3; PR review R1 and R2; CD P4. *Computed* §A: under the original independent-prior gate, a report with no true effects carried 4.9 false pattern claims while the budget believed 0.2. A normal-normal pooled prior is still miscalibrated when real effects are sparse. A two-groups prior is calibrated. | PRM5 shows that a simpler gate is calibrated on held-out delayed checks. |
| RP-D6 | **The change ("then → now") rule.** Each row has a pre-declared direction. Rows are evaluated once per term, on windows matched for information (or on an unpooled contrast). Each needs a magnitude floor and a posterior ≥ .95, or ≥ .975 when more than 4 rows are candidates. SRL rows also need a transfer check. Band drift is shown as context. The raw-count route is deleted. Change in cognitive-process metrics is suppressed under 12 months. Release metric: fewer than 0.1 false rows per child-year on simulated nulls. | MS review P2: 99% of children got at least one false row a year. *Computed* §B: 5.6 false rows per child-year under the raw-count route, against 0.05-0.11 under the corrected rule. CD P1 and P2: shrinkage manufactures change. | PRM5 or the false-row audit (MSI10) fails on real nulls. |
| RP-D7 | **Causal claims come only from randomisation.** Teaching-move questions use MRTs analysed with WCLS excursion effects, with composite proximal outcomes that count non-return as failure. Distal effects use between-child RCTs (E-PROFILE, delayed-start). Bandits run only with a floor ≥ .10 and adaptive-data estimators. Parent text contains no causal word unless Taxila manipulated the cause. | LAM-D2 and LAM-D3; LAM review R3; PR review R4 and R5. | None. |
| RP-D8 | **Clock time of day is not a feature in any product model or `DecisionRecord.context`.** Three exceptions: (a) the bedtime safety predicate, stored as a boolean; (b) a coarse daypart band in a research-only P4 extract, used only for population balancing (LOT H5, CD S6); (c) parent-opted n-of-1 alternations, analysed as a population study. | Shared phones mean clock time is confounded with who holds the phone and why (LOT invariant 4, MHI3). Phase delay is keyed to pubertal stage, which Taxila must not infer (CD R8). The n-of-1 per-child rule fires on noise (PR R7). | Never for product models. |
| RP-D9 | **Durability is "ecological retention".** It is retention in the child's whole learning ecology (school, tuition, homework, parent help). It is modelled with a school-exposure covariate and is never paraphrased as "memory". | LOT review R3: the same chapters are taught at school during the retention interval. | None. This is a naming and modelling invariant. |
| RP-D10 | **The umbrella study is an 18-month accelerated longitudinal design.** N ≈ 4,000 research-consented children enrol, plus a 600-child delayed-start efficacy sub-cohort. Measurement gates G0-G5 must pass before the hypotheses they protect are tested. Growth uses a vertically linked logit scale, never grade equivalents. Age, schooling, calendar period and exposure are separated by design. | LAM-D4 and LAM-D5; LAM review R1 and R2 (the age-period-cohort constraint); LOT review R6. | Cohort-by-age non-convergence beyond a pre-set bound. Then only per-cohort curves are reported. |
| RP-D11 | **Two-tier consent and an assent process at the ICMR standard.** P1 (service) gives production adaptation and no research-only randomisation. P4 (research) adds research arms, extracts and publication. Assent: a willingness check at 6; oral, recorded, with a parent present from 7; written and co-signed from 12. Dissent is honoured at any time. A neutral narrator gives assent, never the tutor persona. | LAM-D10 and LAM-D11, with LAM review R7.2 resolving the inconsistency; ICMR 2017 Box 6.6 [V, via LAM full-text read]; Ondrusek 1998: under-9s' understanding was poor [V]. | An IEC ruling. |
| RP-D12 | **Harm outcomes are co-primary in every experiment.** They cover compulsion markers, parent-pressure markers, distress or avoidance markers (each with a false-alarm budget) and opt-outs. An arm that raises engagement and a harm marker beyond its pre-registered threshold fails. An independent monitoring group can pause any experiment. | MH-D10, LAM-D12, PR §10; MH review R9 on false-alarm budgets. | Never. |
| RP-D13 | **Pre-registration on data that keeps arriving.** A sealed 70% confirmatory holdout, declared *partial* because dashboards leak. Registered Reports for PH1, PH4, PH6 and the first paper. A multiverse analysis for every observational claim. Holm correction across the confirmatory family. | LAM-D9; LAM review R7.4; Weston 2019 [V]. | None. |
| RP-D14 | **External instruments are research criteria only.** Questionnaires (TMCQ, EATQ-R, HSQ-Y, I/D, SRBAI, self-efficacy scales) and external tests (oral reading and arithmetic, grade-appropriate written forms) run only in consented sub-studies. They never write to a child's profile. | TV12, MS-D10, LAM §9. | None. |
| RP-D15 | **Firewalls.** The cognitive layer, the ISP and every research extract never write to mastery, difficulty selection, praise category or the child's profile. Knobs move only within bounded ranges, and are periodically re-randomised. | CD1; TV A5 and TVI4; LAMI5 (the DPDP s.17(2)(b) research exemption needs this); CD review R4 (mis-set knobs act as lowered expectations). | CD1's reversal: AUC +.02 in two refits, after which the metric may enter as a prior covariate only. |

---

## 1. Executive summary

1. **What Taxila can know.** Taxila sees thousands of policy-generated observations per child. That density makes **population science strong**: learning curves, forgetting by age, spacing, help-seeking, calibration development, habit formation, measurement invariance and causal effects of teaching moves through micro-randomisation. It makes **per-child inference weak for most psychological constructs**, because the reliability arithmetic does not care how many observations there are when they are the wrong kind (short sequences, range-restricted lags, rare errors, rare choices).
2. **What a parent can be told now.** Three kinds of statement:
   - **Facts**: what the child can do, and when it was checked again; counts of actions such as self-started sessions, own questions, unprompted retries, help requests when stuck, and harder-option choices; session regularity; what Taxila is doing about each.
   - **A small number of gated patterns.**
   - **Change rows**, at term boundaries.

   *Computed* (§A): with a correctly specified two-groups prior and realistic data (12-40 comparisons per arm), within-child pattern claims are nearly always "still learning". About 0-1.5 claims pass per month, and almost none are false. Under the original spec, every claim admitted in a null report was false. **The honest report is mostly facts. That is a feature.**
3. **What each domain contributes.**
   - Learning over time (LOT): durability is the first per-child memory construct that might reach parents, but it needs about 80 randomised-lag checks per topic type. That is about 27 weeks at 4 sessions a week (*computed* §F). Learning rate never reaches parents.
   - Cognition (CD): domain-cognitive constructs are the flagships (number line, fractions, akshara, decoding fluency, vocabulary across both languages). General executive-function profiles stay research-only.
   - Metacognition (MS): calibration tables in counts, from B2. No resolution sentence until a θ-adjusted resolution index is validated.
   - Motivation and habits (MH): behaviour counts and regularity. Habit and motivation constructs are population findings.
   - Temperament (TV): interaction signatures that are mostly expected to be state-like. The ISP is gated and lean.
   - Parent reports (PR): the report is an intervention on the parent and is evaluated as one.
4. **The publishable core** (§8.7): eight confirmatory hypotheses, PH1-PH8:
   - efficacy (delayed-start RCT);
   - learning-rate heterogeneity on fixed-length calibration sequences;
   - forgetting by age with degree of learning equated by design;
   - the effect of delivering a probe (MRT);
   - expertise reversal (MRT);
   - per-child format personalisation versus population-best (equivalence);
   - competence → self-initiated sessions (within-child, ages 10-15);
   - context-consistent repetition and re-anchoring.

   Eight secondary hypotheses follow, then a measurement paper. **The first paper** is a Registered Report on reliability, invariance and the limits of individual inference (`PAPER-OUTLINE.md`). Its simulation study can be written before any child data exist.
5. **The engineering precondition is the instrumentation spec (§4).** Without decision records, outcome classes, ASR confidence, lag provenance, `startedBy`, the knob state in force, school-exposure flags, consent tiers and assent records, nothing here is publishable. §4.7 lists the gaps against `db/migrations/001_core.sql`.
6. **Honest priors about the results:**
   - most per-child format differences will be indistinguishable from 0;
   - learning-rate heterogeneity will stay small or unresolved;
   - child variance in durability is unknown, and may be too small to report;
   - interaction signatures will be mostly state-like;
   - the motivational decline will be small;
   - habits will be measurable as regularity, not automaticity;
   - efficacy will be small: plan for 0.10-0.25 SD, and pre-register a null reading.

   Each of these is publishable either way. Several are more useful as nulls.
7. **Ethics posture.** The owner has deprioritised compliance. The child-safety floor and *scientific* ethics (IEC approval, ICMR-standard assent, two-tier consent, equipoise, harm as a co-primary outcome) are still non-negotiable, because without them nothing is publishable. They are also what makes the program trustworthy to families.

---

## 2. Program architecture

### 2.1 Three layers and their firewalls

```
                  RUNTIME (teaches)                                   RESEARCH (learns)                         PARENT (tells)
 Director · KT ledger (BKT-R + FSRS) · VT knobs ·          nightly derived features (§4.3)           claim builder (PARENT-REPORT §5)
 MI moment filter · Conductor (day, scheduler)  ──events──►  ├─► research extract (P4 only, pseudonymous,   ├─► gate · budget · shapes
        ▲    │                                                │     holdout-sealed, NEVER writes back)        └─► report render
        │    └─ DecisionRecord (p, available, draw) ─────────►├─► reliability cards (§6.1)                         ▲
        │                                                    └─► knob estimator (bounded; re-randomised)      │ facts + gated claims only
        └──────────── knob values only ◄──────────────────────────┘                                                │
   FIREWALLS: CognitiveLayer, ISP and research extracts never write mastery, difficulty, praise category or profile (RP-D15).
              Questionnaire data never writes a child profile (RP-D14). Time of day never enters product models (RP-D8).
```

### 2.2 Claim tiers and levels

| tier | who sees it | allowed content | gates |
|---|---|---|---|
| S (science) | papers, aggregate parent page | population and band estimates, causal excursion effects, invariance results | pre-registration, holdout, multiverse, Holm/FDR (§8.9) |
| K (knob) | the teacher's knob values only | bounded instructional settings (chunk length, wait time, break offer, error frame, humour dose) | ρ ≥ .70 card, bounded range, population default, periodic re-randomisation |
| P-L0 | parent | counts with numerator, denominator and window | structure predicate only |
| P-L1 | parent | ledger states (*Abhi nahi / Seekh rahi / Aa gaya / Pakka*), checked-again dates | KT rules; *Pakka* needs ≥ 2 delayed successes (PR R12) |
| P-L2 | parent (monthly or term) | a within-child pattern scoped to "with Taxila, {topic type}, {window}" | RP-D5 gate, plus report false-claim budget (PARENT-REPORT §5) |
| P-L3 | parent (term) | then → now change | RP-D6 rule |
| never | nobody | §3.8 list | lexicon, semantic and structure predicates |

### 2.3 Age bands and clocks

- **Bands** follow the day-cycle convention: **B1 6-7, B2 8-9, B3 10-12, B4 13-15.** Every model also carries **age in months** as a continuous covariate (TV review M7, MS review P4). Band steps in priors are replaced by age-continuous priors.
- **Class** (grade) is a separate variable: one of the three clocks (§5, M1). LOT's class bands (1-2/3-5/6-8/9) and CD's `ageBand` ('6-9'/'10-12'/'13-15') are re-mapped to B1-B4 (§12).
- **Identity:** the authenticated child id, never a device (CLAUDE.md law). Profile confirmation happens at session start. Assisted sessions are flagged and excluded from cognitive and SRL estimates. A household id clusters siblings on shared devices (LAM open question 7).

---

## 3. Constructs catalogue

Column meanings:
- **Indicators** name §4 fields.
- **Model** names a §5 block.
- **Reliability now** is the best current estimate with its tag; corrected values from the reviews are used.
- **Gate / target** is what must hold before the stated parent use.
- **Parent** values are: *Fact* (L0/L1), *Counts*, *Pattern* (L2, gated), *Change* (L3, term), *Example* (a dated, evidenced episode), *Design note* (a population-level statement about how Taxila runs sessions), *No*.
- **v1** is ship / gated / research / system / banned.

### 3.1 Knowledge, learning and memory (LOT, KT, LS)

| id | construct | operational definition | indicators (§4) | model | reliability now | gate / target | parent | v1 |
|---|---|---|---|---|---|---|---|---|
| KT-1 | Skill state | ledger display state per skill | `ItemAttempt.outcomeClass`, probe outcomes, `checkKind` | BKT-R + FSRS (KT) | ledger fact | *Pakka* needs ≥ 2 delayed successes on distinct items, or a KT posterior that includes slip and guess. Every row shows "last checked {date}". "Due for a check" after 60 days unchecked [U] | Fact | ship |
| KT-2 | Misconception | a hypothesised way of thinking that fits the child's errors | `misconceptionIds` on diagnostic items (P5-P7) | KT §1.6 | unstable across occasions (VanLehn 1990 [S]) | hedged wording ("answers like {k} of {n} fit a common way of thinking"), and only after a diagnostic item set passes threshold (PR R11) | Hedged fact | ship hedged |
| LOT-C1 | Prior knowledge | performance before practice | diagnostic CAT θ; first-attempt success on new skills | M1; iAFM intercept (M2) | .64-.68 at 35 observations; .80-.81 at 70 (*computed*, Monte Carlo ±.05-.08; LOT R8) | low-stakes routing from ~70 observations | Curricular content only ("started at: {outcome}") | ship (routing) |
| LOT-C2 | Acquisition rate | log-odds gain per practice opportunity | first-attempt correctness by opportunity index, on fixed-length calibration sequences | M2 (linear and concave) | ≤ .04 below 210 observations; .23 at 100 skills × 10; .25 at 30 × 15; .53-.61 at 30 × 30 (*computed*; LOT R8) | never per child | No | research (PH2) |
| LOT-C3 | Durability (ecological retention) | how slowly recall decays with time since the last successful retrieval, given degree of learning | delayed checks with lag provenance (`ScheduleRecord`); S0; `schoolExposure` | M3; φ_c in M4 | .31 / .43 / .49 at 20 / 40 / 80 checks under the scheduler as specified; .36 / .52 / .67 in the widest window the R ≥ .6 bound allows (*computed*, LOT R1) | L2 needs all of: LT3 shows σ_u ≥ .25 on real data; a floor from LT6 (expected ≥ 80 checks per topic type); the same sign under three functional forms (LOT R9); a school-exposure adjustment | Pattern per topic type, rare | research → gated |
| LOT-C4 | Spacing responsiveness | dependence of retention on the gap/retention-interval ratio | M-LAG jittered lags | M4 interaction; IPW ridgeline | not identifiable per child | population only | No | research (PH10) |
| LOT-C5 | Overnight-interval effect | next-day retention beyond the decay curve, after a date change *and* ≥ 8 h elapsed | `hoursSincePrev`, date change | κ in M4 | population only | never called sleep consolidation (LOT R11) | No | research (PH11) |
| LOT-C6 | Interference | loss on skill k from learning a confusable skill j in between | confusable-edge intervening counts | ι_e in M4 | low per child | population only; a randomised arm (M-CONFUS), not a hard-coded rule (LOT R15) | No | research (PH12) |
| LOT-C7 | Relearning savings | faster recovery after a lapse than the original learning | attempts to regain C0 after a lapse | PPE / FSRS post-lapse stability | moderate [U] | after LT validation | Fact ("back after {k} reviews") | gated |
| LOT-C8 | Transfer durability | near and far transfer success against delay | delayed P3/P4 probes, grader confusion folded in | M4 with probe-class emissions | low-moderate [U] | concrete examples only | Example | ship as example |
| LOT-C9 | Long-horizon growth | change in subject ability over months | *occasion-specific* θ, from that month's responses only (LOT R7) | M1 / M5 | GRR .35 at 6 months of monthly data, .78 at 12, .92 at 18 (σ_S .5 [U], σ_ε .3; *computed* §D) | a trajectory with its uncertainty ribbon on an unlabelled scale. No growth-rate statement under 12 months. **No grade equivalents** (LOT R6) | Trajectory (term) | ship display |
| LOT-C10 | Learning efficiency | correlation between child acquisition and forgetting terms | as C2 and C3 | Ω[2,3] in M4 | weakly identified if σ_β ≈ .015 (LOT R13) | gated on LT1 showing σ_β > 0; LKJ 1/2/4 prior sensitivity | No | research |

### 3.2 Cognitive development (CD)

| id | construct | operational definition | indicators (§4) | model | reliability now | gate / target | parent | v1 |
|---|---|---|---|---|---|---|---|---|
| CD-flu | Skill fluency | time to correct answers on a skill, adjusted for item time intensity | `ItemAttempt.rtMs/latencyMs`, code-graded fact items | lognormal RT (M8) | high-ish [U] | a learning metric, so change is allowed, after a practice-adjusted RCI | Fact per skill ("answers in about {x} s, was {y} s, same accuracy") | ship |
| CD-speed | Processing speed (drift v) | evidence quality on two-choice game trials | `GameTrial`, correct trials | contaminant-mixture hierarchical DDM (M9). EZ for dashboards only | single 30-trial block r .36-.59 under an assumed between-child SD [U]; ≥ 60 trials per estimate; 2-4 blocks for .70 (CD R8) | own in-deployment card; lapse-aware model required | No | research + knob |
| CD-wm | Working-memory span | capacity κ from an adaptive staircase, reported at its 70.7% convergence point | `GameTrial.load`, correct | span IRT (M12a) | anchors .39-.56 [V] | ≥ 4 blocks; card ρ ≥ .80 for parent text; never a span number | Teaching adjustment only | knob (bounded, re-randomised) |
| CD-wmload | Working-memory load in lessons | failure that scales with step count on items whose components are mastered | `ItemAttempt` + step count | logistic with κ covariate | [U] | M-CHUNK experiment | No | research |
| CD-inh | Response inhibition | no-go commission rate | `GameTrial` rare no-go trials | hierarchical binomial (M12b) | low-moderate [V anchors] | research and knob only | No | research |
| CD-int | Interference / switch cost | RT difference scores | `GameTrial` | trial-level hierarchical (M10) | trial noise ~8× individual spread in adults (Rouder, Kumar & Haaf 2023 [V]), so L ≈ 512 trials per condition [S, adult] | never individual | No | banned individually |
| CD-flex | Flexibility | perseveration after a rule switch (game); a better strategy when the numbers invite one (items) | `GameTrial` switches; strategy codes | NB perseveration; strategy softmax | game r .28 [V] | game: research. Item version: examples | Example (item version) | research / example |
| CD-attn | Within-session attention ("weather") | decline on the difficulty-adjusted scale; lapse tail | `minutesIntoSession`, IRT residuals | vigilance slope with informative censoring (M12c) | weather, not trait | population design note; randomised break timing (M-BREAK) | Design note | knob |
| CD-reason | Relational reasoning | item-feature effects (relational complexity, surface lures) | items with LLTM tags | LLTM+ε (M12g) | moderate-high once calibrated [U]; random slopes research-only | examples of reasoning in action | Example | ship as example |
| CD-vocab | Conceptual vocabulary | concepts known in either language, plus labels per language | vocabulary items by language | concept × label model with guessing (M12h) | [U] | S-series validation first | Counts ("{n} of {m} words; {p} in Hindi, {q} also in English") | gated |
| CD-lang | Language mix and narrative | code-switch ratio; retell structure | `VoiceTurnFeatures.csRatio`; rubric | descriptive; ASR-gated; dialect-fairness audit | [U] | research | No | research |
| CD-nl | Number-line estimation | PAE on 0-100, then 0-1,000, then fractions 0-1 (scale progression) | placements | PAE; cyclic-power β is research-only (M12d) | PAE correlates with maths at r = .44 [V]; β is unstable | PAE change allowed (a learning metric) | Fact | ship |
| CD-symcmp | Symbolic magnitude comparison | accuracy and drift with distance | items | M12e | r .30 with maths [V] | — | Fact | ship |
| CD-frac | Fraction magnitude | comparison and placement on a calibrated item set | items | IRT | strong predictor of later algebra [V] | a calibrated set, never one pair (CD R4) | Fact | ship |
| CD-ctx | Applied vs abstract transfer gap | φ_ic | context triads | M12f | Banerjee 2025 is a *between-population* contrast [V] | research until S5 shows within-child stability | No | research |
| CD-strat | Arithmetic strategy use | counting / decomposition / retrieval | P2 explanations, latency signature | strategy-mix softmax (overlapping waves) | [U] | — | Example | research / example |
| CD-aksh | Akshara knowledge by complexity class | V, CV, CV + matra, conjunct | items (hear-and-tap, see-and-say, audited) | explanatory IRT (M12i) | Kannada data are a descriptive anchor from another script (CD R1) | S8; ASR evidence must be audited | Fact by class | ship |
| CD-pa | Phonological awareness | syllable, then phoneme: blend, delete, rhyme | voice with tap fallback | IRT | ASR-limited | audit | Fact | ship with audit |
| CD-orf | Decoding and oral reading fluency | correct words per minute on equated passages; pseudoword decoding | voice, ASR-scored, human-audited | ORF growth (M12j) | ASR-limited | human audit before any flag | Fact | ship with audit |
| CD-lcrc | Listening vs reading comprehension gap | z(LC) − z(RC) on matched passages | items | difference score | low | reviewer input only | No | research |
| CD-spatial | Spatial reasoning (candidate) | mental rotation, visualisation | games | IRT | [U]; training g = .47 (Uttal 2013 [V]) | S-series validation | No | candidate |
| CD-climate | Weather vs climate | today's state vs a smoothed trend | any metric | local-level filter *with a practice term* (M11) | — | weather never reported as climate | No | knob |
| CD-flag | Reading and maths flag pathway (a process, not a construct) | persistent difficulty despite ≥ 12 weeks of targeted teaching with logged fidelity | audited reading and number evidence | rule plus human reviewer | PPV ≈ .16 at CPT-like accuracy and 7% prevalence; ≈ .38 with a strong screener [U]. Compute across Scaria's 4-11% CI | reviewer gate; disproportion is a reviewer note, not a gate (CD R4); ≤ 1 message per domain per 6 months; S9 kill if the upper 95% PPV bound < .5 | Separate reviewed channel, non-diagnostic | gated pathway |

### 3.3 Metacognition and self-regulated learning (MS)

| id | construct | operational definition | indicators (§4) | model | reliability now | gate / target | parent | v1 |
|---|---|---|---|---|---|---|---|---|
| MS-S1 | Monitoring offset κ | confidence level independent of accuracy | `MetaEvent.bet`: retrospective, before feedback, ≤ 3 per session, stratified across difficulty | ordinal type-2 model (M6) | .73-.75 at 30 bets, .92 at 120 (*computed*). At 82% accuracy ΔConf is .38 at 30 bets, and 31% of children have < 3 errors (MS P3) | ≥ 30 bets **and** ≥ 10 wrong-answer bets per domain; cells with n < 5 suppressed; difficulty mix shown | Table in counts, B2+ only; no change line in v1 (MS P9) | ship table |
| MS-S2 | Resolution ψ | does confidence separate right from wrong answers | as S1 | θ-adjusted ψ (M6) | .36-.57 at 30 bets; .72-.85 at 120. But r(ΔConf, d′) = +.85: mostly knowledge (MS P1) | no parent sentence at any band until θ-adjusted ψ passes MS2 net of θ | No (v1) | research |
| MS-eff | Metacognitive efficiency | meta-d′/d′ | — | — | M-Ratio ICC .23 at 100 trials, .42 at 400 (adults; Rahnev 2025 [V-full]) | never per child | No | banned per child |
| MS-S3 | Judgments of learning and illusion of competence | delayed "kal yaad rahega?" against the delayed check; in-session vs delayed gap | `MetaEvent.jol`; checks | M6 with the delayed outcome | ~1-2 JOLs a week [U] | research for ≥ 6 months; the gap is a *pedagogy* metric first | No | research |
| MS-S4 | Error monitoring | W→R self-corrections per wrong first response, adjusted for pL; planted-error catches at pL ≥ .8 | `ItemAttempt.selfCorrected`; P6 | hierarchical binomial (M7b) | moderate [U]; ASR turn-splitting risk | MS5 precision ≥ .9; ≥ 10 opportunities | Counts | gated (after MS5) |
| MS-S5 | Monitoring-based control | restudy or practice choice coupled to KT need | `ChoiceEvent` + need | ω_c1 coupling | low (choices are rare) | research | No | research |
| MS-S6 | Help-seeking | child-initiated requests by kind; coupling to need λ; Aleven-style step classes | `MetaEvent.help` (initiator, eligible, **pL at step onset**) | M7 | η .71 at 50 opportunities. λ .21 / .51 / .66 / .79 at 50 / 200 / 400 / 800 (*computed*). Reading pL after the help event gives a spurious λ of +.33 (MS P6) | counts need ≥ 10 child requests; "when stuck after two tries" needs q ≥ 10. **v1 shows parents no per-kind answer-request counts** (MS E1). λ is research-only until MS4 | Counts (restricted) | ship counts |
| MS-S7 | Planning | plan-prompt rubric 0-2 (B3+); pre-action latency ratio | `MetaEvent.plan` | ordinal | low | LLM rubric scoring is research-only until human-LLM agreement ≥ .7 per band and language | Counts B3+ | gated |
| MS-S8 | Effort regulation | rapid-response share (classified by time alone, then validated at chance accuracy); productive vs unproductive persistence | `rtMs`; wheel-spin flags | lognormal mixture (M8) | moderate [U] | a system signal | Taxila's actions only | system |
| MS-S9 | Strategy choice | share of "quiz me" vs "explain again" when both are offered | `ChoiceEvent` | logistic ρ_c | low | B3+, c ≥ 10 | Counts B3+ | gated |
| MS-S10 | Reflection | end-of-session self-assessment against the record | — | — | — | child-facing only | No | child-facing |

### 3.4 Motivation, engagement and habits (MH)

| id | construct | operational definition | indicators (§4) | model | reliability now | gate / target | parent | v1 |
|---|---|---|---|---|---|---|---|---|
| MH-M1 | Self-initiated sessions (behavioural; **not** "autonomous motivation", LAM R4.6) | child-started share; voluntary continuation (kept disjoint from post-cap pleas, MH R17); choice uptake; exploration | `SessionRecord.startedBy`; `SessionAgg` | monthly latent growth with invariance tests and a weakly informative population prior, no band split (M13a) | counts are reliable; construct validity is weak in B1-B2, where parents schedule sessions | n ≥ 8 sessions. Stay silent when the value is unusually high *or* low in B1 (MH review E) | Counts | ship counts |
| MH-M2 | Interest per domain | own questions, topic choices, one-more requests, exploration, rejections, per exposure (child-started) | `VoiceTurnFeatures.childQuestion`; `ChoiceEvent`; `SessionAgg` | Poisson rate (M13b) | moderate after ~6 sessions per domain [U]; confounded by temperament, deference, language and ASR (MH R14) | a within-child cross-domain contrast with P ≥ .9 and ≥ 6 sessions per domain. The "q ≥ 3, most about" rule is dropped | Counts; contrast gated | ship counts |
| MH-M3 | Challenge-seeking | harder-option choice on offers with a *perceptible* contrast (ΔpSuccess ≥ .15, shown to the child), option order randomised | `ChoiceEvent` | logistic α_c (M13c) | moderate after ~20 offers [U] | counts n ≥ 10; change n ≥ 20 per window under the term rule | Counts | ship counts |
| MH-M4 | Persistence after error | unprompted re-attempt; give-up hazard on items with pSuccess ≥ .4 | `retryUnprompted`, `quitLatencyMs` | discrete hazard ρ_c (M13d) | moderate [U] | e ≥ 10 eligible errors | Counts | ship counts |
| MH-M5 | Task self-efficacy (prospective confidence) | pre-answer confidence against the KT prediction | `MetaEvent.bet` (prospective variant) | ordered logit shared with M6 | resolution is unreliable in young children | MS-D3 counts plus MH5 validity | No (v1) | research |
| MH-M6 | Academic emotions (aggregate) | lexicon-marker rates, conditioned on difficulty and exam windows | `MarkerCounts` | NB rates (M13e) | low (rare events) | never attributed to the child. Fear-of-harm utterances go to safeguarding, not this model (MH R20) | No | research / safety |
| MH-M7 | Within-session affect dynamics | transitions between coded moments | coded transcripts (MM2), never the filter's own output | Markov with child effects; L with and without self-transitions | not per child | population; a per-band minimum sequence count; small-sample L bias | No | research |
| MH-M8 | Across-session engagement state | latent mode of use | session summaries | mixed IO-HMM (M15) | state posteriors | Conductor only; state names never stored | No | system |
| MH-M9 | Session regularity | days with a session per 28 (D28); share in the anchored slot | `SessionRecord.localDate`, `slot` | recurrent-event day model (M14a) | D28 .83-.88; anchor share .58-.69 (*simulated* with iid day noise; the real value is MH2) | D28 is always shown. A "was" value is shown only if \|Δ\| ≥ 2·SEM_diff (~7 days; MH R7) | Counts | ship |
| MH-M10 | Habit automaticity | context-triggered sessions | context-predictability AUC curve | M14b | per child r .26-.42 (*computed*); not identifiable per child (MH R11) | band-level only, windows ≥ 56 days | No | research (population) |
| MH-M11 | Lapse hazard | P(≥ 14 days without a session) | all | weekly hazard (M16) | population AUC | system actions only; never shown to anyone | No | system |
| MH-M12 | Compulsion markers | after-bedtime starts, session-length creep without learning gain, post-cap pleas, distress about missing, weekend displacement | `SafetyMarker` | monitored counts | safety signal | thresholds need an absolute floor, a minimum count and a replay-estimated false-alarm budget. The own-75th-percentile rule fires for ~46% of children a year with no change (MH R9) | Facts + one suggestion (wellbeing card) | ship (safety) |
| MH-recip | Competence ↔ self-initiation | within-child cross-lags | monthly mastery gain *per unit of practice*; self-start share | continuous-time DSEM or RI-CLPM, with adaptive actions as treatments (M17) | population | confirmatory in B3-B4 only (PH7) | No | research |

### 3.5 Interaction signatures (TV: the ISP)

Every ISP parent line needs all of the following:
- an in-deployment ρ ≥ .80 on the evidence window actually used, counted in effective sessions rather than trials (TV C2);
- the distinctiveness gate (TV C3);
- agreement r ≥ .50 between non-overlapping windows at a 4-6 week lag (TV C1, replacing the Con ≥ OSpe gate);
- stratification by the knob state in force, which the line must name (TV R8);
- status changes driven by the child's own data only (TV R10);
- no comparison with the first week (TV R9).

Expected outcome: few ISP lines will render. That is honest (§3.5 kill criteria in TV §11).

| id | dimension (internal name, never shown) | estimand | indicators | model | reliability now | gate notes | parent | v1 |
|---|---|---|---|---|---|---|---|---|
| ISP1 | settled warm-up | turns before a free open answer, once the familiarity curve plateaus | `VoiceTurnFeatures` | familiarity curve on NB counts | [U] | a hypothesis for S-TV1, not an application of Fox 2005 (TV R12) | Style line (gated) | gated |
| ISP2 | think time | onset after think-questions, ASR-confident turns only | `onsetLatencyMs` | TSO (M18c) | [U]; device and network noise | thresholds per child *and* per modality | Style line (gated) | gated |
| ISP3 | turn length and pace | words per turn; "aur batao" rate | `words`; barge-ins kept internal | M18c | [U]; tracks language and age | **barge-ins are never shown** (TV C6) | Style line (gated) | gated |
| ISP4 | own questions | rate per opportunity-minute; why/how share; follow-ups | `childQuestion` | NB with an invitation offset | [U] | reported through MH-M2 counts | Counts | ship counts |
| ISP5 | correction-frame fit | slope of correct re-attempt at the next same-skill opportunity, question-first vs direct frame, micro-randomised, with lag-1 and lag-2 terms | `DecisionRecord` (M-FB) | M18b | ρ .70 needs 37 / 66 / 149 / 597 trials at τ 1 / .75 / .5 / .25 (p = .5); 58 / 233 / 933 at τ 1 / .5 / .25 (p = .8). About 2.7 randomised new-kind errors a day are needed at τ .5 (TV R6) | **defaults to one population-level policy**; any individual frame by decision rule P(s_i > δ) ≥ .9 | No (v1) | research |
| ISP6 | bounce-back | *unprompted* re-attempt after an error. Prompted retry is a knob input only (TV R7) | `retryUnprompted` | Beta-binomial, pSuccess-adjusted | [U] | reported through MH-M4 | Counts | ship counts |
| ISP7 | challenge appetite | = MH-M3 | `ChoiceEvent` | — | — | — | Counts | ship counts |
| ISP8 | choice style | takes an offered choice; "teacher's pick" share | `ChoiceEvent` | Beta-binomial (M18a) | [U] | — | Style line (gated) | gated |
| ISP9 | humour reciprocity | play-along given humour kind, within the band ceiling | `humourKind`, `playAlong` | Beta-binomial per kind | [U] | never humour *style* (TV8) | Style line (gated) | gated |
| ISP10 | social-talk appetite | child-initiated social turns; return-to-task latency | `socialTurn` | M18 | state-leaning | — | No (v1) | knob |
| ISP11 | exploration | optional actions per module minute; uncertainty-choice threshold u* | module events | Jirout-style choice model | [U] | S-TV5 | Counts (curiosity) | gated |

### 3.6 Parent and family constructs (PR)

| id | construct | definition | indicators | model | use |
|---|---|---|---|---|---|
| PF-1 | Parent belief calibration | accuracy of the parent's probability that the child can do a skill *not stated in recent reports* | `ParentEvent.prediction` on a 5-point probability scale; opt-in, rare, game-framed; the outcome is a ≥ 3-item check | proper score with Murphy decomposition (M23) | research outcome; never shown to the parent as a score (PR R9) |
| PF-2 | Parent pressure and control responses | report-triggered scolding or extra sessions; decline requests (PL10); child-stated "parent said" pressure lexicon; parent-reported responses to failure | `ParentEvent`, `MarkerCounts` | counts; RCT outcomes | harm outcome (RP-D12) |
| PF-3 | Home-activity uptake | done taps; PTM use | `ParentEvent` | counts | shown to the parent; RCT outcome |
| PF-4 | Contingent self-worth (research) | an adapted child-based-worth scale | questionnaire sub-study | IRT after translation and validation | moderation study (PR §11.5) |
| PF-5 | Report comprehension | a read-back quiz | `ParentEvent.quiz` | proportion correct | PRM1 ship gate |

### 3.7 Causal and policy estimands (LAM)

| id | estimand | data | model | tier |
|---|---|---|---|---|
| X-exc | causal excursion effect of a teaching move on a delayed proximal outcome, with moderation by band, θ and topic type | `DecisionRecord` + outcomes | WCLS (M19) | S |
| X-tau | between-child SD τ of child × format and child × move effects | E-PROFILE, MRTs | hierarchical (M21) | S; LAM-D7 reverses if τ ≥ .5 logit |
| X-pol | value of adaptive policies | logged propensities | AW-AIPW, off-policy evaluation (M20) | S, plus product choice |
| X-eff | intention-to-treat effect of Taxila access on external delayed outcomes | delayed-start RCT | ANCOVA + remnant adjustment; IV for dose | S (PH1) |

### 3.8 Not constructs: never estimated per child, or never at all

| item | status | reason (source) |
|---|---|---|
| IQ, "general ability", brain age, "smart" | banned everywhere | CD4, CD §8.2 |
| learning style (visual/auditory/kinaesthetic), "learns best by", "her style" | banned everywhere | LS §2 crossover failure; PR-D7 |
| personality traits, temperament labels, "type of child" | banned in product; group-level research only with validated instruments | TV1, TV2, TV12; computed label accuracy (TV §4.3) |
| ADHD, dyslexia or dyscalculia "detection"; attention-span scores | banned; the reading and maths flag pathway is reviewer-gated and non-diagnostic | CD8, CD §7.3 |
| growth mindset as a measured construct or module | not measured; behaviour (challenge-seeking, persistence) instead | MH-D8 |
| habit formed, habit score, streaks | banned | MH-D2, MH-D6 |
| dropout or risk score | never shown to anyone | MH-D7 |
| per-child metacognitive efficiency | not estimable | MS §3.3 |
| ANS dot-comparison Weber fraction | not used | CD §6.1 |
| interference or switch-cost RT for one child | not estimable | CD2 |
| per-child learning rate | not estimable | LT-D1 |
| trajectory classes, "learner types" | exploratory papers only | LAM-D6 |
| sleep, tiredness, chronotype | never inferred | LT-D6, PR §6.3 |
| attributed emotions ("anxious", "frustrated") | never attributed | MH §6, PX5 |
| humour style, compliance (A-like), negative-affect aggregates, variability | never stored | TV TVI7 |
| grade-equivalent band | never shown to parents | LOT R6 |
| cross-domain "relative strength" | removed | PR R3 (WISC profile scatter replicates at chance, Watkins & Canivez 2004 [V, sib]) |

---

## 4. Data instrumentation spec (for engineering)

This section is the contract engineering builds against. **P0 fields must exist before the first research-consented child.** P1 fields are needed before month 3. P2 fields are for sub-studies. Field names are proposals in the style of `shared/contracts.ts`. Storage rides the Conductor's commit-ordered per-child `student_event` ledger (CONDUCTOR.md §2.4), plus the tables in §4.7.

### 4.1 Principles

- **I1. Log the decision, not only the outcome.** Every adaptive choice records its candidates, propensities and random draw (RP-D2).
- **I2. Raw behaviour plus system context, never labels.** Store what the child did and what Taxila did. Never store an interpretation of the child. State names, trait estimates, emotions and risk scores are never stored in any child-visible or parent-visible table, and never in research tables either. Model outputs are derived, versioned and kept separately.
- **I3. Version everything.** Every event carries `policyVersion`, `appVersion` and the model and prompt versions (LAM T7). Every classifier output carries its classifier version.
- **I4. Who and where.** Every session carries `startedBy`, profile confirmation, a parent-declared presence flag and an assisted-suspect flag (MH-D4, T6).
- **I5. Time handling.**
  - Raw events keep UTC timestamps, for ordering only.
  - Derived features use local dates, session index, elapsed hours and slot-relative position (anchor / backup / other).
  - Clock time of day never enters a product model (RP-D8).
  - Research extracts drop clock time, except for a coarse daypart band in the restricted P4 extract.
- **I6. Minimise.** Store month and year of birth, never the full date. Store the state of schooling, not an address. No caste, religion or income. An optional asset index is allowed only in the consented sub-study.
- **I7. Text, not audio.** Audio is deleted after transcription by default. Research tables hold features and counts, never raw transcripts. Transcripts used for coding stay in the restricted research store, under P4 and the safeguarding SOP.
- **I8. Private stays private.** Anything the child asked to keep private, and anything the child said about adults, never reaches a parent-visible table, even as a count (MH R19).
- **I9. Separation.** Research enrolment, holdout split and arm assignments live in a restricted schema. Product code cannot read them (LAMI7). Research extracts never write back (LAMI5).
- **I10. Retention matches the purpose.** The Conductor's `decision_log` keeps a 90-day replay window. The research `decision_record` is retained for the study plus the publication window under P4, then deleted or de-identified.

### 4.2 Event inventory

| event / table | grain | written by | needed for | priority |
|---|---|---|---|---|
| `session_record` | one per sitting | Conductor | M1, M9, M11, M12, every model's covariates | **P0** |
| `item_attempt` (extends KT `EvidenceEvent` and the existing `evidence` table) | one per item | Director / KT | everything that uses knowledge, learning or RT | **P0** |
| `decision_record` | one per randomisable decision | Director, Conductor, scheduler, bandit | all causal estimands, MRTs, OPE | **P0** |
| `schedule_record` | one per scheduled review or check | scheduler (FSRS + jitter) | durability, spacing, calibration probes | **P0** |
| `knob_snapshot` | on every knob change; referenced by id on each item | VT | ISP stratification, knob-state confounding | **P0** |
| `consent`, `assent`, `dissent`, `research_enrolment` | per event / per child | onboarding, neutral narrator | everything research | **P0** |
| `calendar_context` | per child-day (board, term, exams, school chapter) | Conductor `calendar` + parent one-tap | school-exposure covariate, period terms, exam windows | **P0** |
| `meta_event` | per bet, JOL, help, self-correction, plan, pass | Director | MS constructs | P1 |
| `choice_event` | per offer | Director / Conductor | MH-M3, MS-S5, S9, ISP8 | P1 |
| `voice_turn_features` | per turn | voice pipeline | ISP, MH-M2, CD-lang, ASR gate | P1 |
| `game_trial` | per trial in a measurement micro-task | module host | CD constructs | P1 |
| `session_agg`, `marker_counts` | per session | MI aggregator | MH-M1, M2, M6 | P1 |
| `safety_marker` | per marker hit | MI / Conductor | MH-M12, harm outcomes | **P0** |
| `parent_event` | per parent interaction | parent surfaces | PF constructs, report evaluation | P1 |
| `linking_form_response` | per item on reserved forms | assessment scheduler | vertical linking, growth (M1) | P1 |
| `external_assessment` | per instrument administration | sub-study staff | G3 validity, PH1 | P2 |
| `questionnaire_response` | per item | sub-study | TV, MH, MS validity | P2 |
| `research_ops` (holdout access log, policy windows, deviation log, reliability-card registry, model registry) | per action | research pipeline | pre-registration integrity | **P0** |

### 4.3 Field-level contract

```ts
// shared/research/events.ts (proposed). Every type carries the common envelope.
type Band = 'B1' | 'B2' | 'B3' | 'B4';
interface Envelope {
  eventId: string;          // ULID
  childId: string;          // authenticated child id (never a device id)
  sessionId: string;
  seq: number;              // per-child commit order (Conductor student_event seq)
  at: string;               // UTC ISO; ordering only (I5)
  localDate: string;        // YYYY-MM-DD in the child's timezone
  policyVersion: string;    // Director + Conductor policy bundle hash
  appVersion: string;
  models: { asr: string; tts: string; llm: string; promptHash: string };
  band: Band; ageMonths: number; classLevel: number;   // derived at event time
  consentTier: 'P1' | 'P4';
}

interface SessionRecord extends Envelope {
  startedBy: 'child' | 'parent' | 'scheduled' | 'teacher_thread' | 'school_homework';
  startEvidence: 'child_profile_tap' | 'parent_gate' | 'notification_open' | 'homework_link';
  profileConfirmed: boolean;                 // identity check at start (MH1)
  slot: 'anchor' | 'backup' | 'other';       // relative to the parent-set anchor; never clock time
  plannedMin: number; actualMin: number;
  endKind: 'natural' | 'exit_intent' | 'cap' | 'crash' | 'network';
  inputDefault: 'voice' | 'tap'; audioRoute: 'speaker' | 'headset';
  deviceId: string; deviceClass: string; tapBaselineMs?: number;   // per-session latency calibration
  parentPresent: 'declared' | 'not_declared';                      // parent-declared only; never inferred
  assistedSuspect: boolean; assistedReasons?: string[];            // detector output
  gapDays: number; hoursSincePrev: number;                         // derived; overnight = date change AND >= 8 h
  noveltyWeek: number;                                             // weeks since first session
  afterBedtime: boolean;                                           // safety predicate vs the parent-declared bedtime
  policyWindowId: string;                                          // frozen research window (LAM §13.6)
}

interface ItemAttempt extends Envelope {                 // extends KT EvidenceEvent
  itemKey: string; templateId?: string; kitVersion: string;
  formVersion: string; itemLang: 'hi' | 'en' | 'hinglish'; numeralForm?: 'digits' | 'words';
  skillIds: string[]; topicType: 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  cls: string; outcomeClass: 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | string;   // final class of the hint ladder
  firstAttemptCorrect: boolean | null;
  rungs: Array<{ rung: 0 | 1 | 2 | 3 | 4; requestedBy: 'child' | 'tutor'; atMs: number }>;
  modality: 'voice' | 'tap' | 'drag' | 'draw';
  grader: 'code' | 'key' | 'llm' | 'human'; graderVersion: string;
  asrConf?: number; asrDropped: boolean;                 // below ASR_MIN means no evidence (LS §7.2 rule 3)
  latencyMs?: number; latencyRef?: 'tts_end_device' | 'item_shown';
  rtMs?: number;                                         // tap or drag response time
  retryUnprompted: boolean; retryPrompted: boolean; quit: boolean; quitLatencyMs?: number;
  selfCorrected?: 'W2R' | 'R2W' | 'W2W'; asrSplitSuspect?: boolean;
  misconceptionIds?: string[]; diagnosticItem: boolean;  // can this item distinguish a misconception from a slip?
  checkKind: 'none' | 'scheduled_review' | 'jittered_review' | 'calibration_probe' | 'linking_form'
           | 'fixed_length_calibration' | 'transfer_near' | 'transfer_far';
  scheduleId?: string; decisionId?: string;
  schoolExposure: 'taught_this_month' | 'not_yet' | 'unknown';   // board calendar + one-tap report (LOT R3)
  stepsInItem?: number;                                  // working-memory load (CD-wmload)
  relTags?: string[];                                    // LLTM features (relational complexity, lure)
  gaming: boolean; disengagedProb?: number;              // engagement tracing (MH §4.7)
  knobSnapshotId: string;                                // VT state in force (TV R8)
  assisted: boolean;
}

interface DecisionRecord extends Envelope {               // LAM §2.2 plus additions
  decisionId: string; experimentId?: string; menuId?: string;
  pointType: 'post_learned_probe' | 'review_lag' | 'format_choice' | 'feedback_type' | 'error_frame' | 'chunk_size'
           | 'worked_example' | 'predict_first' | 're_anchor_offer' | 'lapse_action' | 'bet_frequency' | 'hint_delay'
           | 'break_offer' | 'move_type' | 'confusable_spacing' | 'choice_honour' | string;
  available: boolean; availabilityReason?: string;       // e.g. distress, last 2 min before the cap, non-P4
  candidates: string[]; p: number[];                     // propensities, sum to 1
  draw: number; seedRef: string; chosen: string;
  context: { thetaBucket: string; topicType: string; langMixBucket: string; startedBy: string;
             minutesInSession: number; deliveriesLastSession: number; pLAtOnset?: number };  // no clock time
  hardConstraintsApplied: string[];                      // expertise gate, R >= .6, caps, distress
  exclusionReason?: 'safety' | 'consent_tier' | 'holdout_policy' | 'burden_cap';
}

interface ScheduleRecord extends Envelope {
  scheduleId: string; skillId: string; kind: 'review' | 'calibration_probe' | 'linking';
  optimumLagDays: number; jitterMultiplier: number;      // U(0.6, 1.6) draw
  scheduledLagDays: number; predictedRAtSchedule: number; predictedRAtCheck?: number;
  clippedByRetentionBound: boolean;                      // R >= 0.6 invariant applied
  decisionId: string;
}

type MetaEvent = Envelope & (
  | { kind: 'bet'; attemptId: string; level: 0 | 1 | 2; wording: 'faces' | 'words'; via: 'voice' | 'tap';
      asrConf?: number; latencyMs: number;
      outcomeOfAnswerBetOn: boolean;                      // correctness of the answer bet on (MS P11)
      helpBeforeFirstAttempt: boolean;                    // if true the bet must not be taken; logged as a violation
      predictedPSuccess: number; sampledTercile: 0 | 1 | 2; samplingWeight: number; prospective: boolean }
  | { kind: 'jol'; skillId: string; level: 0 | 1 | 2; delayMin: number; keywordsFirst: boolean }
  | { kind: 'help'; initiator: 'child' | 'tutor' | 'parent';
      reqType: 'explain_again' | 'hint' | 'answer' | 'check' | 'other'; classifierVersion: string;
      timing: 'before_attempt' | 'after_1_error' | 'after_2plus_errors'; errorsOnStep: number; rungBefore: number;
      pLAtStepOnset: number;                              // KT snapshot at step onset (MS P6)
      eligible: boolean; policyWaitedMs: number; dwellAfterMs?: number }
  | { kind: 'plan'; problemKey: string; rubric: 0 | 1 | 2; grader: 'llm' | 'human'; graderVersion: string }
  | { kind: 'pass'; itemKey: string; laterOutcome?: boolean }
);

interface ChoiceEvent extends Envelope {                  // merges the MH, MS and TV offer schemas
  offerId: string; offeredBecause: string; decisionId?: string;
  options: Array<{ optionId: string; kind: 'harder' | 'same' | 'different_way' | 'teacher_pick' | 'topic' | 'quiz_me'
                 | 'explain_again' | 'restudy'; pSuccessKT?: number; needKT?: number; difficultyCueShown: boolean;
                 position: number }>;
  optionOrderRandomised: boolean; chosen: string | 'declined'; latencyMs: number;
}

interface VoiceTurnFeatures extends Envelope {
  turnId: string; speaker: 'child' | 'teacher'; words: number; onsetLatencyMs?: number; endpointSilenceMs?: number;
  bargeIn: boolean;                                       // internal endpointing input only (TV C6)
  csRatio?: number; asrConf: number;
  invitedQuestion: boolean;
  childQuestion?: { type: 'why' | 'how' | 'what' | 'other'; followUp: boolean; classifierVersion: string };
  socialTurn: boolean; humourKind?: string; playAlong?: boolean;
  markerHits: Record<string, number>;                     // counts by marker family and lexicon version; no text
}

interface KnobSnapshot { knobSnapshotId: string; childId: string; at: string;
  values: Record<string, number | string>;                // openingRamp, waitNudgeSec, teacherTurnWords, errorFrame, ...
  source: Record<string, 'default' | 'explicit' | 'estimated' | 'randomised'>; }

interface GameTrial extends Envelope {                    // CD §10 plus corrections
  game: string; formId: string; blockId: string; burstId?: string;   // alternate forms; measurement bursts
  trialIndex: number; condition: string; load?: number; staircaseLevel?: number;
  stimulus: string; response?: string; correct?: boolean; rtMs?: number; omitted?: boolean;
  tapBaselineMs?: number; minutesIntoSession: number; assisted: boolean; gaming: boolean;
}

interface SafetyMarker extends Envelope {
  marker: 'after_bedtime_start' | 'cap_override_plea' | 'distress_about_missing' | 'weekend_displacement'
        | 'session_length_creep';
  lexiconVersion?: string;                                // fear-of-harm utterances go to the safeguarding route, not here
}

interface ParentEvent { eventId: string; guardianId: string; childId: string; at: string;
  kind: 'report_rendered' | 'report_opened' | 'section_viewed' | 'kaise_pata_opened' | 'home_activity_done'
      | 'prediction' | 'parent_said' | 'toggle_changed' | 'ptm_session' | 'decline_request' | 'result_entered'
      | 'n_of_1_enrol' | 'opt_out' | 'quiz_answer' | 'frequency_word_mapping';
  reportId?: string; variantArm?: string; claimIds?: string[];
  payload: Record<string, unknown>; }                     // e.g. prediction: { skillId, prob5: 0 | .25 | .5 | .75 | 1 }

interface AssentRecord { childId: string; at: string; ageMonths: number;
  mode: 'willingness_check' | 'oral_recorded' | 'written_cosigned'; narrator: 'neutral';
  parentPresent: boolean; scriptVersion: string; language: string;
  comprehension: { canStop: boolean; dataForResearch: boolean }; granted: boolean; }
interface DissentRecord { childId: string; at: string;
  kind: 'research_participation' | 'task_refusal'; action: 'assent_recheck' | 'pedagogical' | 'withdrawn'; }
interface ResearchEnrolment {                             // restricted schema (I9)
  childId: string; enrolledAt: string; cohortClass: number; stratum: string;
  split: 'confirmatory' | 'exploratory'; efficacyArm?: 'now' | 'plus3m'; eProfileArm?: 'profile' | 'population_best';
  birthMonth: number; birthYear: number; schoolingState: string; schoolType: string; medium: string;
  householdId?: string; withdrawnAt?: string; }
```

### 4.4 Derived features (nightly; deterministic from the ledger; versioned)

| feature | definition | used by |
|---|---|---|
| `opportunityIndex(c, k)` | prior unaided attempts *and* instruction events on KC k (AFM convention) | M2, M4 |
| `successesMassed / successesSpaced` | same-session successes vs successes ≥ 1 day apart (LOT R9 addendum) | M3, M4 |
| `S0(c, k)` | end-of-acquisition strength: successes, pL at exit, FSRS S0 | M3, M4 (degree-of-learning conditioning) |
| `lagDays(c, k)` | days since the last successful retrieval | M3, M4 |
| `overnight` | local date changed **and** `hoursSincePrev` ≥ 8 | M3, M4 |
| `confusableIntervening(c, k)` | items on confusable-edge KCs between two checks of k | M4 |
| `schoolExposure` | chapter taught at school during the interval (board calendar + one-tap) | M3, M4 |
| `D28`, `anchorShare`, `selfStartShare` | 28-day windows | M13, M14 |
| `effectiveSessions` | evidence-decayed session count (TV R10) | M18 gates |
| `rapidFlag` | t < T_m by time alone; validated against chance accuracy (MS P7) | M8 |
| `lapse` | ≥ 14 days without a session of any `startedBy`; declared holidays are censored | M16 |
| `knobStratum` | knob values in force, grouped | ISP lines, M18 |

### 4.5 Forbidden fields and features

- Raw audio retained beyond transcription (default); voiceprints.
- Inferred emotion states; trait, temperament or personality scores; negative-affect aggregates; humour style; compliance metrics; variability as a child attribute (TVI7).
- Sleep estimates; clock-time-of-day features in product models (RP-D8).
- Caste, religion, income; full date of birth; precise location.
- HMM state names, lapse probabilities or flags in any child-visible or parent-visible table (MHI4).
- Free-text "about the child" notes beyond the derived learning summary (LS §8.6).
- Anything the child asked to keep private, in any parent-visible table (I8).

### 4.6 Data quality audits (run before any analysis uses the data)

| audit | method | bar | source |
|---|---|---|---|
| Propensity replay | re-draw actions from logged `p` and `seedRef`; compare with `chosen` | 100% reproducible | LAM1 |
| `startedBy` validity | parent diary for 2 weeks (n = 60 families) against logs | agreement ≥ 90% | MH1 |
| ASR gate | WER and endpointing by band, language mix and device (pilot n ≈ 50-100 hand-transcribed) | within LS E1 limits; else spoken-only items leave confirmatory models | LS E1, G4 |
| Grader agreement | LLM vs two teacher raters on 300+ explanations | κ reported; folded into emissions | LS E2 |
| Self-correction vs turn-split | human-labelled audio subsample | precision ≥ .9 | MS5 |
| Help lexicon | 500 hand-labelled requests per band | F1 ≥ .85 | MS4 |
| Extractor fairness | precision **and recall** by language, gender and region, with CI half-width < .05 | \|Δ\| ≤ .05 | TV TM4, M7 |
| Assisted-session detector | spot audits of flagged and unflagged sessions | report misclassification | CD §2.8 |
| Device latency | robot-tap rig or high-speed video on target phones | touch latency distribution per device class | CD open question 1 |

### 4.7 Gaps against the current schema (`db/migrations/001_core.sql`) and the migration plan

- **`evidence`**: add `outcome_class`, `first_attempt_correct`, `grader`, `grader_version`, `asr_conf`, `modality`, `item_lang`, `form_version`, `latency_ms`, `rt_ms`, `check_kind`, `schedule_id`, `decision_id`, `school_exposure`, `gaming`, `assisted`, `knob_snapshot_id`, `policy_version`, `session_id`, `steps_in_item`. Today it holds only `probe`, `outcome`, `hints_used` and `weight`, which is not enough for M1-M4 or MS.
- **`format_trial`**: add `decision_id`, `propensity`, `policy_version`, `delayed_item_ids` and `delayed_lag_days`. Child-chosen trials (`allocated_by = 'choice'`) are **excluded from efficacy estimates** (PR R5).
- **`consent.purpose`**: add `research_p4`, `n_of_1`, `questionnaire_substudy` and `external_assessment`. New tables `assent` and `dissent`.
- **`child`**: add `birth_month` (beside `birth_year`), `schooling_state`, `school_type` and `pronoun` (PR review D4).
- **New tables:** `session_record` (a `lesson` is a topic, not a sitting), `decision_record`, `schedule_record`, `knob_snapshot`, `meta_event`, `choice_event`, `voice_turn_features`, `game_trial`, `session_agg`, `marker_counts`, `safety_marker`, `calendar_context` (or extend the Conductor's `calendar`), `research_enrolment` (restricted schema), `parent_event`, `linking_form_response`, `external_assessment`, `questionnaire_response`, `holdout_access_log`, `policy_window`, `reliability_card`, `model_registry`.
- **`turn.meta`** is a jsonb catch-all today. Research fields move to typed columns or to `voice_turn_features`.
- **Distinct from the Conductor's `decision_log`.** That table is a replay trace with a 90-day window. `decision_record` is the randomisation record, retained per I10. Both carry `build_sha` / `policyVersion`.

---

## 5. Measurement models

Each block states what it is used for, which gates it feeds, and which review corrections are built in. Priors marked [U] are design defaults that the §5.0 workflow must check.

### 5.0 Workflow every model follows (LAM §5.2, Gelman 2020 [V])

1. Prior predictive checks.
2. Parameter recovery and simulation-based calibration at Taxila's real data shape (Talts 2018 [V]).
3. Fit (Stan via `brms`/`cmdstanr`, or NumPyro), with R̂ < 1.01, bulk and tail ESS > 400, and no divergences.
4. Leave-future-out validation, never random-split; posterior predictive checks on *held-out delayed* observations by band, language and lag bin.
5. Report posterior medians, 90% intervals and the posterior probability of the pre-registered direction.

Nightly per-child posteriors use Laplace or grid approximations with the hyperparameters fixed.

### M1. Master measurement-and-growth model (LAM §5.1, corrected by LAM review R1-R2)

```
Response (child i, item j, occasion t). Hint-ladder outcomes are ordered categories, not covariates:
  logit P(O_ijt = c | O_ijt ≥ c) = θ_i(t) − b_j − τ_c ,  c ∈ {C0, C1, C2, C3}          (continuation-ratio IRT)
  b_j = w_j′δ + ε_j + d_{j,g},   ε_j ~ N(0, σ_b²),   d_{j,g} ~ N(0, σ_DIF²)                (LLTM+ε; regularised DIF, g = language × modality × band)
Ability, on a vertically linked LOGIT scale (never grade equivalents):
  θ_i(t) = μ(age_i(t)) + ψ·G_i(t) + π_{p(t)} + h(E_i(t)) + c_{cohort(i)} + u_0i + u_1i·(age_i(t) − 10) + x_i(t)
  dx_i(t) = −λ·x_i(t)·dt + σ_x·dW_i(t)                                                   (OU "weather" on elapsed time; irregular occasions)
  G_i(t): grade, instrumented by Z_i = 1[birth month after the state's school-entry cutoff]     (fuzzy RD; first-stage F ≥ 10)
  π_p: calendar-period (academic-term) effects   ·   h(E): monotone spline in cumulative active hours, DESCRIPTIVE only
  (u_0i, u_1i) ~ MVN(0, Σ_u),  Σ_u = diag(σ_u)·Ω·diag(σ_u),  Ω ~ LKJ(2)
ASR confidence: an exclusion threshold (asrConf < ASR_MIN → no evidence) and a multiverse covariate, never a free covariate.
Gate G1b (dimensionality): bifactor or multidimensional IRT per strand, with Q3 local-dependence checks, before any 6-15 curve.
```

ψ is reported only from the RD contrast, as a "schooling effect on curriculum knowledge". Placebo cutoffs (±3 months) and a donut RD run as sensitivity analyses.

### M2. Learning curves (LOT §5.2, corrected by LOT review R5 and R8)

```
linear  : logit P(y_cj = 1) = θ_c + Σ_k q_jk·(β_k + γ_k·T_ck) + b1_c·T_ck
concave : the same with T_ck replaced by log(1 + T_ck)
(θ_c, b1_c) ~ MVN(0, Σ)
report σ_b1 × 10 opportunities (linear) or × log(11) (concave) beside σ_θ, so the comparison is dimensionless
```

Fit only on fixed-length 8-opportunity calibration sequences (at most one per child per month) and on truncation-sensitivity subsets. Report the sequence-length distributions and mid-sequence abandonment, which is MNAR and is reported in LT1. Monthly KC audit: flag a KC when γ_k ≤ 0 or its curve is non-monotone at ≥ 30 children × 7 opportunities.

### M3. Durability: HLR-C v2 (LOT §5.4, corrected by LOT review R1, R3, R9 and the addendum)

```
P(y = 1) = a_tt + (1 − a_tt) · r0_cjk · 2^(−Δ_ck / h_cjk)                                  (a: asymptotic floor)
logit r0_cjk = ι_tt + ι_c + ω_m·√s^massed_ck                                               (massed same-session successes raise initial strength)
log2 h_cjk  = μ_tt + u_{c,tt} + v_template + ω_s·√s^spaced_ck + ω_f·√f_ck + ω_0·log2(1 + S0_ck)
              + ω_n·overnight_ck + ω_x·schoolExposure_ck
u_{c,tt} ~ N(0, σ_u,tt²)   (child ecological-retention offset per topic type; one unit = a doubling of half-life)
v ~ N(0, σ_v²)             (template difficulty; ≥ 30 observations before departing from the prior)
fit: Bernoulli likelihood + priors (not squared loss on p)
```

- **Identifiability.** Lags are the scheduler optimum × U(0.6, 1.6), clipped so that predicted R ∈ [0.6, 0.95]. The program default for calibration probes is LOT R2 option (a): probes are exempt from the R ≥ .6 bound, at ≤ 5% of review slots, only on skills mastered ≥ 2 weeks ago, and a failed probe triggers immediate review. The owner must sign off (§13).
- **Robustness.** Refit with a power form (FSRS-6) and compare with Loftus horizontal time-to-equal-performance. A child-level L2 claim needs the same sign and similar size under all three forms.

### M4. Joint hierarchical learning-forgetting model (LOT §5.5, corrected by LOT review R13 and R14)

```
m_o = α_c + δ_j + Σ_{k∈K(j)} [ (β0 + β_c + β_k)·log(1 + N_ck)
                              − (φ0 + φ_c + φ_k)·log(1 + Δ_ck/τ)·e^(−λ·log(1 + S*_ck))
                              + κ·overnight_ck − ι_e·log(1 + I_ck) ] + χ·schoolExposure
P(y_o = 1) = g_j + (1 − g_j)·σ(m_o)              (g_j = 1/K for MCQ, else ≈ 0)
S*_ck: LATENT degree of learning, measured with error (not the raw success count, which is post-treatment)
(α_c, β_c, φ_c) ~ MVN(0, Σ_child),  Ω ~ LKJ(η), with sensitivity at η ∈ {1, 2, 4}
```

- PH3 (forgetting by age) equates the degree of learning **by design**, using learn-to-criterion inside the fixed calibration sequences. It uses common anchor tasks across bands, invariance checks and ASR-confidence strata.
- The learning-efficiency correlation Ω[2,3] is estimated only if LT1 shows σ_β clearly above 0, and ρ recovery is added to LT6.

### M5. Long-horizon growth and its reliability (LOT §5.7, corrected by LOT review R7)

```
θ_c(m) estimated from month m's responses only (occasion-specific; filtered Glicko μ snapshots have autocorrelated errors)
θ_c(m) = θ_c0 + μ_c·t_m + ε_cm ;   GRR = σ_S² / (σ_S² + σ_ε² / SST),   SST = Σ_m (t_m − t̄)²
computed (§D): monthly, σ_ε = .3, σ_S = .5 → GRR .35 at 6 months, .78 at 12, .92 at 18
```

Parents see the trajectory and its ribbon. There is no growth-rate statement under 12 months, and no grade equivalent at any time.

### M6. Calibration: ordinal type-2 model (MS §4.1, corrected by MS review P1-P11)

```
y*_cks = κ_cd + ψ_cd·(2·o_ck − 1) + β_b·(b_k − θ_c(t)) + u_cs + ε_cks ,   ε ~ N(0, 1)      (θ-adjusted: item difficulty relative to ability)
o_ck   = correctness of the answer bet on (no bet after pre-attempt help)
r_ck = j  iff  τ_{w, j−1} < y* ≤ τ_{w, j}      (thresholds per wording version w: faces or words; tested for invariance across bands and languages)
κ_cd = μ_κ(ageMonths) + a_c + a_cd ;   ψ_cd = softplus( μ_ψ(ageMonths) + g_c + g_cd )        (age-continuous priors, no band steps)
u_cs ~ N(0, σ_u²)                     (session weather)
descriptive table only: h_cj = P(o = 1 | r = j) ~ Beta(m_j·φ, (1 − m_j)·φ)  (conditional accuracy moves with θ and difficulty mix)
```

- MS2 validity: θ-adjusted ψ must predict hypercorrection, control coupling and delayed gains *net of θ* before any resolution wording exists.
- Offset and growth claims use the model-based κ, never κ̂_mid. κ̂_mid falls from .80 to .70 as ψ rises from 0 to 1.2 with κ fixed (MS P4).
- No change statement may span the switch from faces (B1) to words (B2).
- The prospective variant (MH-M5) shares a_c through a correlation parameter.

### M7. Help-seeking, self-correction and hint processing (MS §4.4, corrected by MS review P6-P7)

```
help-need coupling (help-eligible windows only):
  logit P(h_ct = 1) = η_c + λ_c·w_ct + β1·errorsOnStep + β2·rung + β3·minuteInSession ,   w_ct = (1 − pL_ct^onset) − 0.5
  η_c ~ N(μ_η(ageMonths), σ_η²),  λ_c ~ N(μ_λ(ageMonths), σ_λ²)                (no separate β4·band term: double counting)
step classes [U thresholds, fitted in MS4]: appropriate ask · protected try (h = 0, first attempt, pL < .4) ·
  help avoidance (h = 0 after ≥ 2 errors, pL < .4; band-specific threshold, [U] for children) · overuse · expedient (kind = answer)
hint processing:  logit P(correct next attempt | hint level ℓ) = θ_c − b_k + γ_ℓ + γ_{cℓ}
self-correction (M7b), per wrong first response:  logit P(W→R) = μ(ageMonths) + v_c + β·pL     (R→W counted separately)
```

### M8. Response times: speed, rapid guessing, effort allocation (CD §2.5, MS §4.6)

```
log T_ij ~ N(β_j − τ_i, 1/α_j²) ,  (θ_i, τ_i) ~ BVN                       (τ_i: fluency on items like these; not processing speed)
rapid flag: t < T_m (10% of the item-type median, or a mixture cut) by TIME ALONE; then check rapid accuracy ≈ chance
mixture: log t_ck ~ π_c·N(μ_R, σ_R²) + (1 − π_c)·N(ν_c + β_k + ζ_c·b_k, σ_c²)   (ζ_c > 0: more time on harder items; research only)
latency reference: onset after TTS end, measured on the device; per-child and per-modality thresholds (MH R14)
```

### M9. Diffusion models for game trials (CD §2.4, corrected by CD review P5 and R8)

```
reported drift v: hierarchical DDM with a contaminant mixture
  f(t, resp | v_i, a_i, Ter_i, π_i) = (1 − π_i)·DDM(t, resp; v_i, a_i, Ter_i) + π_i·½·U(t; t_min, t_max)
EZ (dashboards only): L = logit(Pc); v = sign(Pc − ½)·s·[L(L·Pc² − L·Pc + Pc − ½)/VRT]^(1/4); a = s²L/v; Ter = MRT − MDT
  rules: MRT and VRT from CORRECT trials only; Pc = 1 → 1 − 1/(2n); exclude blocks with Pc ≤ .5; ≥ 60 trials per estimate;
         reject fits with Ter < 0.15 s or Ter > MRT. Lapse rate is reported as a separate weather variable.
computed (CD R8): 3% slow lapses bias raw v −35%; trimming to 0.2-2.5 s gives −4%; 5% mid-range lapses still give −15% after the trim
```

### M10. Difference scores and the reliability paradox (CD §2.3)

```
y_ijk = α_i + x_k·θ_i + ε_ijk ,  x_k ∈ {−½, +½} ;   θ_i ~ N(μ_θ, σ_θ²)
ρ(L) = σ_θ² / (σ_θ² + 2σ²/L)   →   L = 2ρ / ((1 − ρ)·γ²),  γ = σ_θ/σ
at γ = 1/8 (adult trial-to-person noise ratio, Rouder 2023 [S, adult]): ρ = .8 needs L ≈ 512 trials per condition
```

Hierarchical models quantify how uncertain such an estimate is. They do not create individual precision (Rouder, Kumar & Haaf 2023 [V]).

### M11. Weather vs climate (CD §2.7, corrected by CD review P3)

```
η_t = η_{t−1} + w_t ,                  w_t ~ N(0, q)            (climate: slow)
y_t = η_t + γ·log(1 + n_t) + s_t + e_t ,  s_t ~ N(δ′state_t, r_s)  (practice term n_t; state = minutes-in-session, device, assisted; NO clock time)
```

Practice and development are nearly collinear within a child. They are separated only by the accelerated design and by measurement bursts on fresh alternate forms, with exposure held constant at each burst.

### M12. Domain-cognitive models (CD §3-§7, corrected by CD review P6-P9)

```
(a) WM span:     P(correct_ij) = σ(κ_i − λ·load_j − δ_type) ;  staircase (2-up/1-down) point = (κ_i − δ − 0.88)/λ ;  κ_i fitted from all trials
(b) no-go:       logit P(commit_it) = ζ_i + β_age·ageMonths + β_rate·goRate_t + β_min·minutes_t + β_dev·device
(c) vigilance:   logit P(correct_t) = π_i + (ψ + ψ_i)·minutes_t − b_t   (difficulty-adjusted IRT scale; drop-off modelled jointly or fixed-length blocks)
(d) number line: PAE_i = mean|est − target|/scale (reported);  E[est/scale] = p^β/(p^β + (1 − p)^β)  (β research-only)
(e) symbolic comparison: v_ij = v_i·g(|n1 − n2|/max(n1, n2))
(f) context transfer:    logit P(correct_ijc) = θ_i + φ_ic − b_j ,  c ∈ {abstract, verbal, market}   (φ_ic research-only)
(g) relational reasoning: logit P(correct_ij) = θ_i − Σ_k q_jk·η_k − ε_j    (LLTM + random item residual)
(h) vocabulary (disjunctive): P(knows concept c) = σ(θ_i^concept − b_c) ;
                              P(correct on (c, L) | knows c) = σ(θ_i^L − b_cL) ;  P(correct | not known) = g (4-AFC ≈ .25)
(i) akshara:     logit P(correct_ia) = θ_i − (b_class(a) + b_a) ,  class ∈ {V, CV, CV + matra, conjunct}
(j) ORF:         cwpm_it = (β0 + u0_i) + (β1 + u1_i)·weeks_it + ε_it   on equated passages (passage effects removed)
```

### M13. Motivation models (MH §4, corrected by MH review R2, R10, R12, R14)

```
(a) latent growth:  logit/log μ_cmj = ν_j + λ_j·η_cm + ζ_cj ;  η_cm = η0_c + η1_c·(m/12) + ε_cm ,  ε_cm = φ·ε_c,m−1 + ω_cm
    η1_c ~ N(μ1, σ1²) with ONE weakly informative population prior (no band split; population estimation only); loadings per band,
    invariance-tested; indicators: self-start share (B3-B4 confirmatory), continuation, choice uptake, exploration
(b) interest:       N_cdwi ~ Poisson(E_cdwi·exp(β_0i + u_ci + v_cd + τ_dw)) ;  report v_c,d1 − v_c,d2 only if P > .9, ≥ 6 sessions per domain
(c) challenge:      logit P(harder_ck) = α_c + β1·ΔpSuccess_k + β2·moment_k + γ·policy_k     (perceptible contrast only)
(d) persistence:    logit h_ck(a) = θ_a + ρ_c + δ1·pSuccess_k + δ2·hints_k,a                 (items with pSuccess ≥ .4)
(e) emotion markers: K_cdme ~ NegBin(T_cdm·exp(β_e + a_ce + b_de + γ_e·exam_m + δ_e·pSuccessMean_cdm + ω_e·asrConfMean), φ_e)
(f) engagement tracing: P(o = 1) = P(E)·σ(θ_c − b_k) + (1 − P(E))·g_k ;  logit P(E) = ε_c + ε1·log(RT/RT̄_c) + ε2·position
```

### M14. Habits (MH §5.4-5.5, corrected by MH review R11)

```
(a) day level:  logit P(S_cd = 1) = α_c + f(τ_cd) + g(dow_d) + h(calendar_d) + β_H·H_cd + β_P·plan_cd ,   H_cd = 1 − exp(−k·n^anchor_cd)
    anchor share: logit P(slot = anchor | S_cd = 1) = ξ_c + χ·H_cd + calendar terms
    β_H is causal only through the anchor-slot randomisation (PH8); observationally it is descriptive
(b) context predictability: π_c(w) = AUC_cv(S_cd ~ LASSO(context_cd)) over windows ≥ 56 days; habit time by BAND, never per child
```

### M15. Across-session engagement states (MH §5.3)

A mixed input-output HMM over session summaries, with gap-aware transitions:

```
P(z_s = j | z_{s−1} = i, g_s, x_s) = softmax_j(α_ij + β_j′x_s + λ_j·log(1 + g_s) + b_cj)
```

Emissions are minutes, `startedBy`, own questions, harder share, end kind and disengaged share. K is selected by a pre-registered rule. The model is used for Conductor planning only. It is retired if ΔAUC < .03 over D28 alone (MH4).

### M16. Lapse hazard (MH §5.7)

```
logit h_c(w) = α(w_since_start) + β′z_{c,w−1} + band + calendar_w
```

The Gardner & Brooks evaluation rules are binding:
- temporal split only;
- features from before the prediction week only;
- no filtering to active users;
- AUC reported by week since start, with calibration slope and intercept and Brier score;
- subgroup calibration, with a slope of .8-1.2 in every band and language;
- no per-child explanations shown to staff.

The model may trigger system actions only.

### M17. Reciprocal and dynamic effects (MH §5.6, LAM §6.5, corrected by MH review R1, R12 and LAM review R4.6)

```
continuous-time DSEM / RI-CLPM on monthly or weekly aggregates:
  X_cm = μ_X,m + κ_X,c + x*_cm ,   Y_cm = μ_Y,m + κ_Y,c + y*_cm
  x*_cm = a_XX·x*_c,m−1 + a_XY·y*_c,m−1 + e ,   y*_cm = a_YY·y*_c,m−1 + a_YX·x*_c,m−1 + e
X = mastery gain PER UNIT OF PRACTICE (so self-starts cannot feed X mechanically through dose); Y = self-initiated session share
adaptive Conductor actions = time-varying treatments → MSM weights; child prior for a_XY ≈ 0 (Talsma 2018 child moderator)
effects reported as within-person standardised, across several lag intervals
```

### M18. Interaction signatures (TV §5, corrected by TV review C1-C3, M3-M6, R4-R10)

```
(a) 3-level beta-binomial: y_ist ~ Bern(p_is), logit p_is = μ_b(ageMonths) + τ_i + ζ_is
    reliability of the child's mean over S effective sessions with m̄ trials each:
    ρ_S = σ_τ² / (σ_τ² + σ_ζ²/S + (π²/3)/(S·m̄))
(b) contingency (micro-randomised; Y = correct re-attempt at the NEXT same-skill opportunity):
    logit P(Y_i,t+1 = 1) = β0 + u0_i + (A_it − p_it)(β1 + u1_i) + β2(A_i,t−1 − p_i,t−1) + β3(A_i,t−2 − p_i,t−2) + γ′c_it
(c) trait-state-occasion (replaces the Con ≥ OSpe gate):  Y_is = μ + T_i + O_is + e_is ,  O_is = φ·O_i,s−1 + δ_is
    gate: ρ_S ≥ .80 on the window used, AND agreement r ≥ .50 between non-overlapping windows at a 4-6 week lag
(d) distinctiveness:  P(|p_i − μ_b| > δ | data) ≥ .90
(e) changepoint: Bayesian online changepoint detection on AGE-ADJUSTED residuals; false-alarm rate < 5% of children a month,
    calibrated by simulation; changes caused only by a band transition are suppressed (TVI12)
(f) fairness: measurement error and benefit compared across gender, language and region (MRT moderation) and the criterion
    treated as latent (MIMIC). "Knob distributions must not diverge by gender" is retired (TV R4).
```

### M19. Micro-randomised trials (LAM §3, corrected by LAM review R3)

```
β(t; s) = E[ Y_i,t+Δ(Ā_i,t−1, 1) − Y_i,t+Δ(Ā_i,t−1, 0) | I_it = 1, S_it = s ]               (causal excursion effect)
WCLS:  Σ_i Σ_t I_it·W_it·( Y_i,t+Δ − g_t(H_it)′α − (A_it − p̃_t(S_it))·S_it′β )·[g_t(H_it); (A_it − p̃_t(S_it))·S_it] = 0
W_it = p̃^A (1 − p̃)^(1−A) / [ p^A (1 − p)^(1−A) ] ;  child-clustered CR2 sandwich standard errors
primary proximal outcome: 1[success at a check within 7 days], with NON-RETURN coded 0 (composite)
secondary: return within 7 days; principal-stratification or bounds sensitivity for success | return
```

### M20. Adaptive-data inference (LAM §4)

- **Batched OLS** (Zhang, Janson & Murphy 2020 [V]): the default.
- **Adaptively weighted AIPW** (Hadad 2021 [V]):

  ```
  Γ̂_a = Σ_t h_t·[μ̂_a(H_t) + 1{A_t = a}(Y_t − μ̂_a(H_t))/π_t(a)] / Σ_t h_t ,  with h_t ∝ √π_t(a)
  ```

- **Confidence sequences / always-valid p-values** (Johari 2022 [V]): for monitored dashboards.
- **Off-policy evaluation**: IPS, V̂(π) = (1/n) Σ π(A|H)/p(A|H)·Y, or doubly robust. It is used to choose which policies to test online, never instead of the online test.

### M21. Per-child effects and the parent-claim prior (LAM §5.3-5.4; new computation §A)

```
û_i = ρ_i·(own estimate) + (1 − ρ_i)·(population mean) ,   ρ_i = τ²/(τ² + V_i) ,  V_i ≥ 2/(n·p(1 − p))
ρ = .70 needs 1,945 / 487 / 217 / 78 comparisons per arm at τ = .1 / .2 / .3 / .5 logit (LAM §5.4; lower bounds per LAM R6.5)
two-groups prior for every within-child contrast on a parent-report menu item k:
  d_ik ~ π0·δ_0 + (1 − π0)·N(0, s1²)        (π0, s1 by marginal likelihood across children, per menu item, refreshed monthly)
  P(claim correct)_ik = (1 − lfdr_ik)·Φ(|m_ik|/s_ik)
computed (§A): this prior is calibrated (false claims per report ≈ what the budget believes); a normal-normal prior is not when
real effects are sparse; independent weak priors admit 4.9 false claims per null report
```

### M22. Reliability and decision arithmetic (CD §2.2; CD P1; PR R2)

```
Spearman-Brown: ρ_k = kρ_1/(1 + (k − 1)ρ_1)          SEM = SD·√(1 − ρ)            attenuation: r_obs = r_true·√(ρ_xx·ρ_yy)
RCI = (x2 − x1)/(SD·√2·√(1 − ρ))                     change-score reliability: ρ_D = (ρ_xx − r_12)/(1 − r_12)   (.70, .60 → .25)
contrast reliability: ρ_D = (½(ρ_xx + ρ_yy) − ρ_xy)/(1 − ρ_xy)   (.80/.80 at ρ_xy = .3/.5/.7 → .71/.60/.33)
PPV = sens·prev/(sens·prev + (1 − spec)(1 − prev))
Fisher-z CI for a reliability r: half-width ≈ 1.96(1 − r²)/√(n − 3) → n per band for ±.05 at r = .7: 403 (§C)
```

### M23. Parent-side models (PR §11, corrected by PR review R8-R9)

```
prediction score: BS = (1/M)·Σ (f_j − o_j)²  with f on a 5-point probability scale; Murphy decomposition BS = REL − RES + UNC;
  skills NOT stated in recent reports; o_j from a ≥ 3-item check, or with modelled error
anti-Barnum (predictive): for section s, AUC_s = P( score(own section → own held-out behaviour) > score(synthetic decoy section → same behaviour) )
  decoys generated from the population model, never from another child's record; parent recognition is secondary and read alongside priors
```

### M24. Observational causal inference (LAM §7)

- Target-trial emulation: eligibility, strategies, time zero, outcome and causal contrast, written first.
- MSM stabilised weights, SW_i = Π_t P(A_t | Ā_{t−1}) / P(A_t | Ā_{t−1}, L̄_t), truncated at the 1st and 99th percentiles.
- Debiased ML with cross-fitting *by child*; negative-control outcomes (topics not yet taught).
- E-value E = RR + √(RR(RR − 1)); Cinelli-Hazlett omitted-variable bounds benchmarked against observed covariates.
- Remnant-based variance reduction for RCTs (Sales 2018 [V]; Gagnon-Bartsch 2023 [V]).

### M25. Measurement invariance and DIF (LAM §8)

```
logistic DIF: logit P = β0 + β1θ + β2g + β3θg   (effect-size flags, not p-values alone, at Taxila's N)
MNLFA: λ_j(x) = λ_0j + λ_1j′x ,  ν_j(x) = ν_0j + ν_1j′x ;  x = age in months, language-mix proportion, modality
alignment for many groups; longitudinal invariance within child before any growth claim; modality × literacy, not a fixed direction
```

---

## 6. Reliability, validity and fairness programme

### 6.1 Reliability cards (CD9, extended)

Every metric that a person, a prompt or a knob consumes carries a card. A card records:
- metric, band, language, device class and modality;
- ρ, SEM and n;
- method: split-half by session block, test-retest across *non-overlapping in-deployment windows at the claim's interval*, or hierarchical trial-level;
- the prior pooling group (which acts as a hidden norm group, CD P2);
- measured-at date, study id and data snapshot.

Supervised short-interval retests (S1) inform validity only (CD P4). A metric without a card is research-only.

### 6.2 Gates (consolidated)

| claim type | statistical gate | other gates |
|---|---|---|
| L0 count | none | numerator, denominator, window and scope present; `startedBy` split for motivation counts |
| L1 ledger state | KT rules | *Pakka*: ≥ 2 delayed successes; "last checked" date shown |
| L2 level pattern (e.g. durability, ISP rate) | card ρ ≥ .80 at the claim's interval; distinctiveness P ≥ .90; type-level re-appearance ≥ 70% | system explanations checked by rule (LOT §6.1); same sign under alternative functional forms where relevant; report budget |
| L2 contrast (two conditions within a child) | two-groups posterior P(claim correct) ≥ .90; randomised or propensity-logged allocations only | fixed small menu per section per month (≤ 6), screened count logged; report budget validated on simulated nulls and mixtures |
| L3 change | RP-D6: pre-declared direction, once per term, matched information, magnitude floor, P ≥ .95 (≥ .975 above 4 rows) | transfer check (SRL); band drift as context; ≤ 2 change rows per monthly report |
| knob (K) | card ρ ≥ .70 | bounded range around the population default; periodic re-randomisation |
| flag pathway | human reviewer | CD §7.3 conditions; S9 kill criterion |

### 6.3 Data budgets: when can anything be said? (*computed* §F; usage rates are assumptions [U])

| construct (gate) | 2 sessions/week | 4 sessions/week | 6 sessions/week |
|---|---|---|---|
| calibration table, one domain (≥ 30 bets **and** ≥ 10 wrong-answer bets) | 17 weeks | 8 | 6 |
| durability L2 per topic type (≥ 80 randomised-lag checks; pending LT6) | 53 | 27 | 18 |
| (superseded ≥ 30-check rule, for comparison) | 20 | 10 | 7 |
| persistence count (≥ 10 eligible errors) | 2 | 1 | 1 |
| choice counts (≥ 10 offers) / change line (≥ 20) | 10 / 20 | 5 / 10 | 3 / 7 |
| help counts (≥ 10 child requests) | 2 | 1 | 1 |
| help-need coupling λ (~400 eligible windows; research) | 17 | 8 | 6 |
| session regularity D28 | 4 at any usage; a "was" comparison needs two windows and \|Δ\| ≥ ~7 days | | |
| per-child learning rate, metacognitive efficiency, per-child format effect | not reachable in v1 | | |

**Reading.** In month 1 a parent sees facts and counts. Calibration tables arrive around month 2 for a 4-sessions-a-week child. Durability patterns arrive, if ever, in the second or third term. **PARENT-REPORT §7 designs the report around this curve rather than around the constructs.** Every value in this table is an output of assumed rates. Pilot logs (LAM2) replace them.

### 6.4 Validity

- **Convergent and discriminant validity** in the consented sub-studies (S-TV2, MH6, MS2, CD S1), with disattenuated correlations reported beside raw ones. The discriminant claim "quietness carries no academic signal" is replaced by a **modality × shyness DIF test**: the gap between voice and tap θ as a function of a temperament covariate. Shy children under-perform in face-to-face oral testing (Crozier & Hostettler 2003 [V]), and Taxila is a quasi-face-to-face oral assessor (TV C5; LAM R5.1).
- **External criterion sub-study (G3).** n ≈ 600, at months 0, 6, 12 and 18. Instruments are grade-appropriate per band: ASER-style tools only for foundational bands, because they hit a ceiling above about class 3-5 (LAM R5.2). Target: r(θ, external) ≥ .60, reported raw and disattenuated.
- **Predictive validity**: month-0 θ predicts the month-12 external score beyond the month-0 external score (incremental ΔR²).
- **Anti-Barnum (predictive) test** for every psychological report section (M23). Parent recognition is secondary.
- **Simulation calibration (G5).** Each per-child claim type has a simulation at the real data shape, from pilot event-time distributions, that estimates its false-claim rate before shipping. Observed in-deployment reliabilities are later compared with the simulation's predictions. That comparison is a hypothesis of the first paper.

### 6.5 Invariance and fairness

- DIF and invariance tests across language version (Hindi, English, Hinglish), modality (voice, tap), band, gender and region precede every cross-group or cross-age comparison (LAM-D8).
- Longitudinal invariance within child precedes every growth claim (the Frenzel lesson).
- The ASR gate (G4) excludes spoken-only items from confirmatory models wherever WER fails LS E1 limits.
- Fairness is defined as **equal estimation error and equal benefit**, tested through MRT moderation, not as equal knob distributions (TV R4).
- Report the share of children reaching each gate by gender, language and SES proxy. Heavy users are a selected group (TV R6, TM10).

---

## 7. Experiments: micro-randomised and between-child trials

### 7.1 Design rules

1. **Equipoise.** Every arm is a move the team would ship to everyone (LAM §3.5; Meyer 2019 "A/B effect" [V]).
2. **Hard constraints come before randomisation** and are never relaxed by it: the expertise-reversal gate (except inside M-WE, within equipoise bounds), retention R ≥ 0.6, session caps, no randomisation during detected distress, and the evidence-based core.
3. **Availability** is pre-defined, logged and not randomised. Effects are defined only on available decision points.
4. **Probabilities.** p ∈ [0.2, 0.8]. Use 0.3-0.4 for costly components such as a 60 s teach-back. Bandits need a floor ≥ .10 plus adaptive-data estimators.
5. **Carry-over and burden.** "Deliveries in the last session" is a pre-specified moderator. Delivery caps per session apply. The metacognitive prompt budget is ≤ 10% of session turns.
6. **Interference between experiments.** Different MRTs use different decision points. Components that touch the same outcome are randomised factorially. Each child has at most 3 concurrent experiments [U].
7. **Frozen policy windows** of 6 weeks, versioned (LAM §13.6). Analyses include `policyVersion` fixed effects.
8. **Outcomes.** Proximal outcomes are composites in which non-return counts as failure (M19). They are never immediate correctness.
9. **Harm.** Every experiment's analysis plan lists the RP-D12 harm outcomes as primary safety outcomes (MHI6).
10. **Consent tier.** Research-only arms run for P4 children only. P1 children receive production adaptation (RP-D11).
11. **Disclosure.** Families are told "Taxila tries different good ways of teaching and checks what helps". An annual debrief appears in the Parent corner. Incomplete disclosure needs IEC approval (ICMR §5.11 [V, via LAM]).

### 7.2 Catalogue

| id | question | decision point | arms (p) | proximal outcome | key moderators | sources | notes |
|---|---|---|---|---|---|---|---|
| **M-PROBE** | does *delivering* a teach-back or why-probe raise later retrieval? | skill reaches `learned-today` | probe vs none vs **time-matched re-exposure** (⅓ each) | composite: success at a check within 7 days | band (linear trend), θ, topic type | LAM H4; LS E5 | the time-matched arm tests the active ingredient (LAM R3.2) |
| **M-PRED** | does predict-before-reveal beat tell-first, and is it moderated by inhibition? | new concept with a predictable outcome | predict vs tell (.5) | delayed transfer item | inhibition proxy ζ (research estimate), band | CD S4; Brod 2020 (n = 51) | a replication, not established mechanism |
| **M-CHUNK** | steps per teacher turn × working memory | instruction turn | 1 / 2 / 3 steps | hints on the next item; delayed success | κ (WM), band | CD S3 | replaces the invented "one step at 6" norm (CD R8) |
| **M-LAG** | gap/retention-interval ridgeline by band; durability identifiability | review scheduling | lag multiplier U(0.6, 1.6), clipped to R ∈ [.6, .95] | retrieval at the check | band, topic type, S0 | LOT H4 | widens the permitted lag window (LOT R1) |
| **M-CONFUS** | does introducing a confusable neighbour soon after k cause interference? | sequencing of confusable pairs | j introduced 1-2 days after k vs ≥ 3 days after (.5) | retention of k at the next check | band | LOT H6, R15 | replaces hard-coded rule (b), [U, low confidence] |
| **M-FB** | error frame × feedback content (merges the TV, MH and LAM proposals) | after an error on a new kind of problem | 2 × 2: question-first vs direct-specific frame × process vs neutral feedback | correct re-attempt at the next same-skill opportunity; harder-option choice; return within 7 days | band, θ, lag-1 and lag-2 treatments | TV ISP5, S-TV3; MH H7; LAM M-FB | one experiment, so the same children are not randomised twice (LAM §17.5) |
| **M-WE** | expertise reversal | new procedure | worked example first vs attempt first (.5), within equipoise bounds | delayed success on matched items | **skill-specific prior knowledge (latent, errors-in-variables)** | LAM H5; LS F2/F8 | no "crossover near the median" prediction (LAM R4.4) |
| **M-ANCHOR** | do re-anchor offers raise self-started sessions, and more so after a context change? | eligible reminder slot, inside the parent's allowed windows | offer vs none (.5) | self-started session within 48 h | weeks enrolled, recent context change | MH H2, H6; LAM H8 | B1-B2 effects are read as a family-routine effect |
| **M-BET** | bet reactivity (hypercorrection vs burden) | session plan | 1 vs 3 bets per session, by session (.5) | delayed retention; avoidance markers | band | MS H1, MS6 | wording faces vs words is not randomised across B1/B2 |
| **M-HINTDELAY** | does trying first help children? | step with a help request available | hint available immediately vs after the first attempt (.5) | local learning on the skill | pL, band | MS H3; Roll 2014 (n = 38, high school) | the MS-D5 threshold is band-specific [U] |
| **M-METAFB** | age-gating of metacognitive feedback | end of a bet block (B2+; B1 only with a null-safe arm) | none / performance / metacognitive feedback | change in θ-adjusted ψ; delayed learning | band (6 vs 7 vs 8-9) | MS H5 | resolves Kolloff 2025 (null at 6) vs Buehler 2025 (positive at 7) |
| **M-MEMEXPL** | do theory-based memory explanations raise retrieval choices? | before a quiz-me vs explain-again offer | explanation vs none (.5) | ρ_c change; delayed retention | band (B3+) | MS H6 | Koriat & Bjork 2006 in children |
| **M-MOVETYPE** | interest-type vs deprivation-type curiosity moves | tangent opportunity | I-move vs D-move (.5), both invariant-safe | follow-up questions; exploration | band | TV ISP4 | population first |
| **M-BREAK** | when should Taxila offer a break? | session minute | offer at t ∈ {8, 12, 16} min [U] | difficulty-adjusted accuracy after the offer; continuation | band | PR R6; CD §3.5 | identifies the break effect; child-requested breaks are endogenous |
| **M-LAPSE** | do lapse-response actions help without harm? | predicted-lapsing child-week | lighter plan / re-anchor offer / easier entry / none (weekly switchback) | 28-day self-starts | band | MH H8, MH9 | compulsion markers are non-inferiority outcomes |
| **M-CHOICE** | should B4 children's restudy choices be honoured? | restudy choice | honour vs scheduler (.5) | delayed outcomes (non-inferiority) | band (B4) | MS-D11, MS8 | Metcalfe & Finn design |

**Between-child and quasi-experimental studies:**

| id | design | primary outcome | n | sources |
|---|---|---|---|---|
| **R-EFF** | delayed-start RCT: start now vs +3 months (partner schools or waitlists) | external maths and reading at month 3 (ANCOVA + remnant adjustment) | 600 (MDES .16 SD at R² .5; *computed* §E) | PH1; LAM H1 |
| **R-PROFILE** (E-PROFILE) | profile-driven format allocation vs population-best | matched delayed items at 1 and 4 weeks (TOST ±0.10 SD) | ≈ 1,285 per arm, ≈ 2,570 total (*computed* §E; LAM R4.5) | PH6; LS §8.7 |
| **R-VIBE** (E-VIBE) | age-band defaults vs contingency-adaptive knobs | delayed learning (margin 0.15 SD, ≈ 550 per arm, or ANCOVA) and voluntary return | ≈ 1,100 | TV S-TV3, TV review M11 |
| **R-REPORT** | parent-report variants, factorial A × B × C | children's delayed retention on fixed scheduled assessments for all arms; parent calibration; parent behaviour; harm | 1,570 per arm at d = .10 (*computed* §E) | PARENT-REPORT §11 |
| **R-REACT** | regression discontinuity at the first report exposure | shift in reported-on behaviours vs a never-reported indicator family | all | MH R15 |
| **R-VIGNETTE** | trait summary vs behavioural lines, vignettes only | parent essentialism; comprehension | ≥ 400 parents | TV S-TV4 (vignette-only, TV review M11) |
| **R-NOF1** | parent-opted time-of-day alternation in 1-week blocks, ≥ 8 weeks | population τ_δ; individual verdicts are not expected | opt-in | PR §11.4 + R7 |

### 7.3 Power (*computed*; corrected)

- **MRT, 3 pp effect:** power .83 at N = 400 and T = 30 decision points; .58 at N = 200. For 5 pp: .94 at N = 200. These are upper bounds, because the simulation ignores within-session correlation, missingness and carry-over (LAM R3.4).
- **MRT band contrasts:** power about .54 for a 3 pp difference *between* bands and .28 for 2 pp. Band interactions are therefore a pre-registered linear trend or a secondary analysis (LAM R3.3).
- **Type-I error:** .060 at 1,000 replications, which is within Monte Carlo error (SE .0069). CR2 standard errors are used on principle.
- **Bandit inference:** with no floor, the naive type-I error is .111. With a floor of .10 it is .048, but power falls to .43 against .63 under uniform allocation (LAM §4.2).

---

## 8. The longitudinal study: *How Indian children learn with an AI tutor*

### 8.1 Aims

1. **Describe**, with measurement invariance established, how learning, forgetting, metacognition, motivation, habits and interaction style develop from 6 to 15 in children using an AI tutor.
2. **Test mechanisms** with embedded MRTs: which teaching moves cause durable learning, and for whom.
3. **Test the personalisation claim** (E-PROFILE).
4. **Estimate efficacy** on external, delayed outcomes.
5. **Publish the measurement**: reliability, validity and invariance of embedded measures, as a public good.

### 8.2 Design overview

```
months:            −3 .. 0          0       3       6       9       12      15      18
phase 0 pilot:  [n≈300: G0, G4 ASR, E2 grader κ, MS1 words, LAM8 assent comprehension, LT6/G5 sims on real event-time shape]
cohorts C1..C9 (class 1-9 at enrolment; accelerated, overlapping in age):
all P4:                          [enrol + assent][======= continuous logs + embedded MRTs (6-week frozen policy windows) =======]
linking forms (reserved pool, rotated anchors):  F0      F3      F6      F9      F12     F15     F18
external sub-study (n≈600):                      X0              X6              X12             X18
E-PROFILE (between-child):                               [==== 12 weeks ====][1- and 4-week delayed tests]
delayed-start efficacy sub-cohort (n≈600):       randomise now vs +3 months; X0 and X3 in both arms
gates: G0 instrumentation · G1 invariance · G1b dimensionality · G2 reliability · G3 external validity · G4 ASR · G5 simulation calibration
```

### 8.3 Population and generalisability

- **Frame:** families who install Taxila and pass verified parental consent, plus partner schools or waitlists for the efficacy sub-cohort.
- **Strata:** class (1-9) × medium (Hindi / English) × region (4 zones) [U]. Hindi-medium and government-school children are oversampled. No city exceeds 25%.
- **Eligibility:** age 6-15, class 1-9, a device at minimum spec, P4 consent and age-appropriate assent.
- **Exclusions:** none on ability. Children with disabilities are included with accommodations, and the analyses report how many.
- **Generalisability:** every paper says "Taxila users" (self-selected families with device access), not "Indian children aged 6-15" (LOT R18).

### 8.4 Sample size

| requirement | basis | children (analysable) |
|---|---|---|
| MRT, 3 pp effect, power ≥ .80, per band (4 bands) | *computed* LAM §3.4 (an upper bound) | 4 × 400 = 1,600 |
| E-PROFILE equivalence, ±0.10 SD, power .80 | TOST n = 2(z.95 + z.90)²/Δ² × (1 − R²) × 1.5 bandit inflation (*computed* §E) | ≈ 2,570 |
| Reliability CIs, ±.05 at r = .7, per band | Fisher z (*computed* §C) | 403 per band per measure |
| DIF / invariance, medium × band (8 groups) | ≈ 300 per group [U] | 2,400 |
| Delayed-start efficacy, MDES .16 SD | 300 per arm, R² .5 (*computed* §E) | 600 (separate) |

**Target: 4,000 enrolled plus 600.**
- Assumed attrition: 50% active at 12 months and 40% at 18 months, informative [U]. That is outside the range Galbraith 2017 studied (LAM R2.5).
- If attrition is worse, the MRT and invariance aims survive, because they use within-child data from whoever stays active. E-PROFILE is the first aim to lose power, and the pre-registration says so.

### 8.5 Measures

- **Continuous logs** per §4.
- **Linking forms:** 12-minute, game-framed forms every 3 months from a reserved pool never used in teaching, with common items across adjacent classes. Anchors are rotated across waves so the same child never repeats them (LAM R5.5). Per-child 3-month gains are difference scores, used for group growth only.
- **External sub-study:** grade-appropriate oral and written maths and reading per band, plus questionnaires in consented sub-studies (TMCQ or EATQ-R parent forms; EATQ-R self-report from age 10; HSQ-Y 8-11; I/D curiosity parent form; brief self-efficacy and autonomy scales from 10; SRBAI items for B4). All are translated and back-translated, cognitively interviewed and invariance-tested first.
- **Harm and wellbeing:** compulsion markers, parent-pressure items, distress and avoidance flags (with false-alarm budgets), opt-outs and dissent events.
- **Covariates (minimised):** month and year of birth, state, school type, medium, class, device class and household language(s). No caste, religion or income.

### 8.6 Measurement gates

| gate | what passes | blocks |
|---|---|---|
| G0 instrumentation | propensity replay audit 100%; P0 fields present; `startedBy` agreement ≥ 90% | all causal analyses |
| G1 invariance | scalar or partial invariance of θ across medium and modality | cross-group comparisons; PH1-PH3 subgroup claims |
| G1b dimensionality | per-strand dimensionality and Q3 checks | any 6-15 growth curve |
| G2 reliability | in-deployment cards for every moderator and outcome measure | PH5, PH7, secondary hypotheses |
| G3 external validity | r(θ, grade-appropriate external) ≥ .60 (raw and disattenuated reported) | PH1 interpretation; all θ-based claims |
| G4 ASR | WER and endpointing within LS E1 limits by band × language | spoken-only items in confirmatory models |
| G5 simulation calibration | parameter recovery / SBC at the real data shape; false-claim rates for every parent claim type | shipping L2/L3 claim types; PH2, PH3 |

### 8.7 Confirmatory hypotheses (one family; Holm across PH1-PH8)

| PH | hypothesis | estimand / model | design | prediction [U] | reading of the result | sources |
|---|---|---|---|---|---|---|
| **PH1** | Access to Taxila improves external, delayed maths and reading outcomes | ITT at month 3; ANCOVA on X0 + remnant adjustment; IV for dose | R-EFF (n = 600) | +0.10 to +0.25 SD maths (Mindspark's 0.37 SD in 4.5 months is the ceiling [V]) | **supported**: lower 90% bound > 0. **Null-equivalent**: 90% CI inside ±0.10. Otherwise **inconclusive** (LAM R4.1). Add a design effect if schools are cluster-randomised | LAM H1 |
| **PH2** | Children differ more in prior knowledge than in learning rate, once data are free of mastery-exit bias | σ_slope × 10 opportunities vs σ_intercept on fixed-length 8-opportunity calibration sequences, by band; linear and concave forms | observational + calibration sequences | σ_slope × 10 < 0.5 × σ_intercept in every band | falsified if σ_slope × 10 ≥ σ_intercept with test-retest r ≥ .6 on independent sequences. If the two forms disagree, the result is inconclusive (Lee 2026 [V]) | LAM H2; LOT H1 |
| **PH3** | With degree of learning equated by design, forgetting slows with age | φ0 by band in M4; within-child drift of φ_c | M-LAG + learn-to-criterion sequences + common anchor tasks | monotone decline across bands, P > .9, derived from strategy development (7-10) and knowledge-base growth | falsified if P(decline) < .5. Not interpreted unless G1, G4 and anchor-task invariance pass (LOT R14) | LAM H3; LOT H3 |
| **PH4** | Delivering a retrieval or explanation probe raises next-check retrieval | excursion effect β on the composite outcome (WCLS) | M-PROBE | +3 to +6 pp overall; the time-matched arm tells probe content from time on task | falsified if the upper 95% bound of β < 2 pp. The band trend is secondary | LAM H4; LS E5 |
| **PH5** | Expertise reversal in children | moderation of the worked-example-first effect by latent skill-specific prior knowledge | M-WE | negative moderation slope | falsified if slope ≥ 0 with P > .9 | LAM H5 |
| **PH6** | Per-child format personalisation does not beat population-best formats | TOST ±0.10 SD on matched delayed items; posterior τ of child × format | R-PROFILE; batched OLS in the profile arm | equivalence; τ < 0.2 logit | if the profile arm is superior by > 0.10 SD, the LS kill criterion reverses. A Registered Report: publishable either way | LAM H6; LS §8.7 |
| **PH7** | Within children aged 10-15, competence gains predict later self-initiated sessions more than the reverse | continuous-time DSEM, within-person standardised, several lags; X per unit of practice; adaptive actions as treatments | observational panel | a_YX > a_XY with P > .9; child prior a_XY ≈ 0 | falsified if the ordering reverses, or both ≈ 0. **Behavioural** wording: not "autonomous motivation" (LAM R4.6) | LAM H7; MH H4 |
| **PH8** | Context-consistent repetition predicts future self-started sessions beyond total repetition, and re-anchor offers raise self-starts | β_H (M14a, identified by anchor-slot randomisation); M-ANCHOR excursion effect | observational + M-ANCHOR | β_H > 0; offer effect +2-5 pp | falsified if β_H ≤ 0 after α_c and total sessions. Worded as context-consistent repetition, not automaticity; B1-B2 read as family routine | LAM H8; MH H1-H2 |

### 8.8 Secondary confirmatory and exploratory aims

**Secondary confirmatory** (FDR within the family; each pre-registered):

| PH | hypothesis | design | sources |
|---|---|---|---|
| PH9 | θ-adjusted calibration (κ, ψ) predicts later learning gains beyond θ | DSEM on monthly κ, ψ, θ | MS H4 (drop "first", MS R6) |
| PH10 | The optimal gap/retention-interval ratio differs by band and topic type | M-LAG; IPW ridgeline | LOT H4 |
| PH11 | An overnight-interval effect (date change + ≥ 8 h) is larger for T2/T3 than T4 | natural variation; daypart balancing in the P4 extract | LOT H5 renamed (R11) |
| PH12 | Confusable intervening learning lowers retention, more in younger bands | M-CONFUS | LOT H6 |
| PH13 | Trying first before help on low-pL steps yields better local learning in children, by band | M-HINTDELAY | MS H3 |
| PH14 | Metacognitive feedback improves θ-adjusted resolution from age 7-8, not at 6 | M-METAFB | MS H5 |
| PH15 | Most interaction-signature dimensions are state-like: occasion variance ≥ trait variance, and 6-month stability < .5 | TSO (M18c) | TV S-TV1 |
| PH16 | Three bets per session (vs one) improve delayed retention without raising avoidance markers | M-BET | MS H1 |

**Exploratory** (labelled; replicated on the holdout before any claim):
- growth-mixture trajectories (with skew-robust refits and GRoLTS reporting);
- EF structure differentiation (CD S2; timing contested, Lee, Bull & Ho 2013 [V]; Karr 2018);
- affect-transition structure (MH H5);
- habit curves by band (MH H1);
- cognitive weather (CD S6, P4 extract only);
- microgenetic strategy change (CD S7);
- akshara acquisition curves (CD S8);
- context-transfer longitudinal change (CD S5);
- curiosity behaviour (S-TV5);
- humour comprehension (S-TV6);
- relearning savings (C7);
- learning efficiency ρ (gated on σ_β);
- break effects (LOT H7).

### 8.9 Analysis plan essentials

- **Estimation:** the §5.0 workflow for every model. MRT estimands use WCLS with CR2, plus a Bayesian hierarchical analogue as sensitivity.
- **Missing data:**
  - within-child missingness modelled as MAR given the ledger;
  - dropout through shared-parameter joint models of the θ trajectory and dropout hazard;
  - δ-adjusted pattern-mixture sensitivity, with dropouts' θ shifted by −0.25 and −0.5 logit-SD [U];
  - composite MRT outcomes plus bounds;
  - ITT and "active" populations reported separately.
- **Age-period-cohort.** ψ comes from the RD only. Calendar-period terms are included. Cohort covariate balance and attrition-by-age models are pre-registered as part of the convergence test (LAM R2.4).
- **Scale.** Vertical linking is pre-registered, with concurrent and separate calibration as a sensitivity analysis. For every group-growth claim, a scale-free version is reported: the share of group A above group B's median, or quantile effects (Bond & Lang [S]).
- **Multiplicity:** Holm across PH1-PH8; Benjamini-Hochberg FDR for PH9-PH16; exploratory analyses labelled; MRT moderators shrunk hierarchically.
- **Heterogeneity:** pre-specified moderators only (band, medium, θ, gender, device class). Causal forests are exploratory and need holdout replication.
- **Robustness:** a multiverse over exclusions, ASR thresholds, KC mapping and linking method, with the full distribution reported.
- **Deviations:** a public log with dates.

### 8.10 Pre-registration and open science

- **Sealed 70% confirmatory holdout.** Reads are logged and need an OSF id (LAMI7). The seal is declared *partial*, because holdout children feed dashboards and the Director (LAM R7.4). Option: exclude holdout children from analytic dashboards.
- **Data-access declaration** in every pre-registration (Weston 2019 [V]).
- **Registered Reports:** the first paper, PH1, PH4 and PH6.
- **Sharing:**
  - code and simulation code are public;
  - de-identified event-level extracts (pseudonymous ids, month-level dates, coarsened age, small cells k < 10 suppressed) go out under controlled access, gated by DPDP counsel;
  - a synthetic dataset matching the marginals is released;
  - no raw transcripts or audio, ever.
- **Negative results are published and change the product** (the LOT, MH and TV kill criteria).

### 8.11 Output sequence

1. **Paper 1 (Registered Report):** reliability, invariance and the limits of individual inference (`PAPER-OUTLINE.md`). Stage 1 can be submitted before child data exist.
2. **Measurement and data descriptor** (G1-G5) with the controlled-access dataset.
3. **PH4 + PH5:** micro-randomised trials of teaching moves.
4. **PH6:** personalisation versus population-best (Registered Report; the expected null is the more valuable result).
5. **PH1:** efficacy (Registered Report).
6. **PH2 + PH3:** learning rate and forgetting across 6-15.
7. **PH7 + PH8:** competence, self-initiation and context-consistent repetition.
8. **Parent-report RCT** (PARENT-REPORT §11).

---

## 9. Ethics, safeguarding and wellbeing

### 9.1 Committee and risk class

- ICMR 2017 covers research "for health". Education has no statutory analogue [U], but journals require IEC approval.
- **Use ICMR 2017 as the standard**, with a registered university IEC that includes a child-development member and a lay member.
- "Routine research on children and adolescents" and "use of personal identifiable data" are a **minor increase over minimal risk**, so expect full-committee review (Table 2.1 [V, via LAM]).
- The exemption for "comparison of instructional techniques" requires *no linked identifiers*, so it does not apply (Table 4.2 [V, via LAM]).

### 9.2 Consent and assent

| age | assent (ICMR Box 6.6 [V, via LAM]) | Taxila implementation |
|---|---|---|
| < 7 | no documentation required | a spoken willingness check ("do you want to play this?"); behavioural refusal ends research tasks |
| 7-11 | oral, recorded, parent present | neutral narrator (never the tutor persona or voice); age-band script; comprehension check that the child can stop *and* that data are used for research (LAM8 extended, R7.1); an occasional neutral willingness check with no parent prompt |
| 12-15 | written, co-signed by the parent | in-app signature by child and parent (CD's secondary reading said 13; the stricter reading, 12, is adopted) |
| all | failure to object is not assent; dissent is honoured | re-asked at enrolment, at age birthdays (7, 12) and annually; assent is revocable, including for "her voice" quotes |

- **Two tiers.** P1 (service) covers production adaptation. P4 (research) covers research-only randomisation, extracts and publication. Declining P4 never changes the core service. Non-P4 children are excluded from extracts and from research-only arms (LAM review R7.2 resolution).
- **Dissent comes in two kinds** (LAM R7.3):
  - *research dissent* is a refusal of participation itself. It triggers an assent re-check and withdrawal on request;
  - *task refusal* ("I don't want to do this teach-back") is honoured pedagogically for every child, and is not treated as withdrawal.

### 9.3 Wellbeing gates and monitoring

- **RP-D12 applies to every experiment.**
- Harm-marker thresholds are set from the LAM9 baseline plus a pre-registered margin, with false-alarm budgets (MH R9).
- **The independent monitoring group** has three members: a child psychologist, an independent biostatistician and a parent representative. It reviews harm markers, complaints, opt-outs and subgroup imbalances quarterly, and can pause any experiment.
- **Inferred harm markers are for study monitoring only.** They never become labels to parents or children, and their misclassification rates are reported (LAM R7.5).

### 9.4 Safeguarding

- Transcripts can contain disclosures. The safeguarding SOP covers the flagging path, a designated lead and the reporting route.
- The Childline 1098 / Tele-MANAS 14416 hand-off is part of the product floor.
- Fear-of-harm utterances ("daant padegi", hitting, fear) route to safeguarding, never to motivation models or parent reports (MH R20).
- POCSO reporting duties (ss. 19-21) must be resolved with counsel **before** ethics submission (dpdp-deep Q7 [U]).

### 9.5 Data protection

- Research rests on P4 consent and possibly the DPDP s.17(2)(b) exemption. That exemption fails if results feed decisions about a specific child, so research extracts never write back (LAMI5).
- The s.9(3) behavioural-monitoring question must be answered before launch (LS §8.6).

### 9.6 Children's voice and adolescent autonomy

- For B4, the psychological report sections are shared with parents only on the adolescent's opt-in. The default is competency rows plus the home action (PR review D1).
- The child sees what the parent sees for any section that is shared.
- Private requests and statements about adults are never repeated to parents (MH R19).

### 9.7 Equity, benefit return and publication ethics

- **Equity audit** by language, region, gender and device class, covering both effects and harms.
- **Benefit return:** aggregate findings in plain Hindi and English. There is no commercial use of research-only data.
- **Publication language:** no "first" claim without a systematic search (MS R6, MH R22, CD R1: DEEP exists). "Taxila users", not "Indian children". Population findings are told to parents as "on average", never as a finding about their child (Fisher 2018 [V]).

---

## 10. Measurement backlog (phased; each result goes to `context/measurements.md` with n, method and date)

| phase | ids | what | bar | decides |
|---|---|---|---|---|
| **0: pre-launch pilot** (n ≈ 300, months −3..0) | LAM1 | propensity replay audit | 100% | G0 |
| | LS E1 / G4 | ASR WER and endpointing by band × language × device | LS E1 limits | spoken-item use |
| | LS E2, PLM7 | LLM grader agreement; claim-checker precision and recall | κ reported | grader confusion; PL4 |
| | MS1 | do *pakka / shayad / andaaza* (faces for B1) mean ordered confidence? | ordered ≥ 90%; WER < 5% | bet wording |
| | MH1 | `startedBy` vs parent diary | ≥ 90% | MH-D4 |
| | LAM8 | assent comprehension (can stop; data used for research), 30 per band × 2 languages | ≥ 80% | assent scripts |
| | LAM2 | decision-point counts per child per policy window | ≥ 30 M-PROBE points per 6 weeks | MRT T |
| | LT6 / G5 | parameter recovery and false-pattern rates at the real event-time shape | false-pattern rate ≤ 5% | durability floor (expected ≥ 80); every L2 type |
| | PRM6 | parents' numeric reading of the frequency words, by language | — | vocabulary table |
| | device | touch and audio latency per device class | — | CD speed constructs |
| **1: months 0-3** | MH2, MS3, TM1-TM2 | real reliabilities: D28, anchor share, κ, ψ, Beta-binomial ICCs, TSO | per §6.2 | thresholds |
| | LT3 | σ_u,tt for durability on randomised-lag checks | σ_u ≥ .25 | durability L2 at all |
| | MS4, MS5 | help lexicon F1; self-correction vs ASR splitting | .85; .9 | MS counts |
| | LAM9 | harm-marker baselines | — | stopping thresholds |
| | PRM1, PRM2 | report comprehension; "Kaise pata?" use | ≥ 80% | layouts |
| | LAM5 | first-stage F of the school-entry RD | F ≥ 10 | RD use |
| **2: months 3-9** | LT1 | child slope SD on calibration sequences (linear and concave) | — | PH2; LT-D1 reversal |
| | LAM3 | τ of child × format effects (E-PROFILE pilot) | τ ≥ .5 reverses LAM-D7 | per-child format claims |
| | MS2, MH5, MH6 | predictive and convergent validity of κ/ψ, efficacy calibration, behavioural motivation | ΔAUC ≥ .02; r ≥ .4 | wording levels |
| | TM3 | τ of contingency slopes | τ ≥ .5, else population policy | ISP5 |
| | PRM5 | posterior calibration of L2/L3 claims on held-out delayed checks | stated ≈ observed | report budget ε |
| | PRM10 | predictive anti-Barnum per section | AUC above chance (target ≥ .65 [U]) | section ships |
| | MH4, MH8 | HMM value; lapse-model calibration and fairness | ΔAUC ≥ .03; slope .8-1.2 | M15, M16 use |
| **3: months 9-18** | LT7, LT8 | break effects; growth-rate SD; drift of child parameters | — | trajectory display; decay half-life |
| | LAM6 | vertical-linking stability | difference < 0.2 logit-SD [U] | growth claims |
| | LT10, MH10, MS10, R-REPORT | do L2 reports change parent behaviour, child stress or engagement? | no rise in harm | whether L2 ships at all |
| | S9 | real PPV of the flag pathway | upper 95% bound ≥ .5, else kill | flag pathway |

---

## 11. Program invariants (eval-gated; "if your change trips them, your change is wrong")

| id | predicate | covers |
|---|---|---|
| RPI1 | every randomised or adaptive decision writes a `DecisionRecord` with `p`, `available`, `draw` and `policyVersion`; replay reproduces 100% | LAMI1, LAM1 |
| RPI2 | no randomised arm violates a hard constraint (expertise gate except M-WE, R ≥ .6, caps, distress) | LAMI2 |
| RPI3 | bandit allocations respect min p ≥ .10 | LAMI3 |
| RPI4 | non-P4 children receive no research-only randomisation and are absent from research extracts | LAMI4 (corrected) |
| RPI5 | research extracts, CognitiveLayer, ISP and questionnaires never write to mastery, difficulty, praise category or the child profile | LAMI5, CD (i), TVI4, TV12 |
| RPI6 | no clock-time-of-day feature in any product model or `DecisionRecord.context`; `overnight` = date change and ≥ 8 h | MHI3, LOT inv 4, RP-D8 |
| RPI7 | no parent- or child-facing string contains a banned lexeme or fails the semantic predicate (trait attribution, deficit framing, cross-child comparison, prediction, diagnosis, attributed emotion) | MHI1, MSI1, TVI1, PRI5, CD (ii) |
| RPI8 | no trajectory class, MRT moderator estimate, per-child causal effect, risk score or HMM state in any parent or child surface | LAMI6, MHI4 |
| RPI9 | every per-child metric shown to anyone has a reliability card measured in deployment | CD9, MSI9 |
| RPI10 | change statements obey RP-D6; simulated-null false-row rate < 0.1 per child-year | MHI7, MSI8, new |
| RPI11 | no raw (confidence − accuracy) bias anywhere; bets are on the answer bet on; no bet after pre-attempt help | MSI2, MSI11 |
| RPI12 | help never changes stars, points, mastery display or streak-like UI; "answer" requests never yield the final answer before the ladder is exhausted | MSI4, MSI5 |
| RPI13 | assent is presented by the neutral narrator, never the tutor persona | LAMI8 |
| RPI14 | confirmatory-holdout reads are logged and blocked without an OSF registration id | LAMI7 |
| RPI15 | every retention experiment lists the harm markers as primary safety outcomes | MHI6 |
| RPI16 | private requests and fear-of-harm utterances never reach parent-visible tables or reports | MH R19-R20 |
| RPI17 | no streak representation anywhere | MHI8 |
| RPI18 | flags exist only for `read.*` and `num.*`, need a reviewer id, and never appear in child-visible UI or prompt context | CD (iv), CD §7.3 |
| RPI19 | the teacher prompt receives knob values only; no dimension names, statuses or "the child is…" | TVI3, CD (v) |
| RPI20 | durability and other estimates never lower displayed mastery | LOT inv 3 |

---

## 12. Conflicts between component documents, and their resolutions

| # | conflict | where | resolution |
|---|---|---|---|
| 1 | per-child format threshold "≥ 8-10 comparisons" vs 78-487 per arm computed | LS §8.4 vs LAM §5.4 | no per-child format claim in v1 (LAM-D7); revisit after LAM3 |
| 2 | time of day as a feature: CD S6 and TV `IspContext.daypart` vs LOT invariant 4 and MHI3 | CD, TV vs LOT, MH | RP-D8: removed from all product models and from `IspContext`; S6 runs on the P4 research extract only |
| 3 | feedback-type MRT proposed twice | TV S-TV3 / ISP5, MH H7, LAM M-FB | one factorial M-FB (§7.2) |
| 4 | grade-equivalent band for parents | LOT §7 principle 7, PR §7.3 and §8 wireframes vs LOT R6 | no GE band; criterion-referenced outcome rows and a θ trajectory on an unlabelled scale |
| 5 | durability L2 floor: 30 checks vs ≥ 80 implied by the permitted design | LOT §6.3 vs LOT R1 | the floor is set by LT6; expect ≥ 80. Owner chooses the operating point (§13) |
| 6 | change rules: "≥ 3 windows OR posterior ≥ .9" | MH §6, MS §6.3, PR §4.2 vs MS P2, MH R8 | RP-D6 |
| 7 | reliability gates: Spearman-Brown ρ ≥ .70 (PR), Con ≥ OSpe (TV), card ρ ≥ .7 (CD) | PR §4.2, TV TV3, CD (ii) | RP-D5: ρ ≥ .80 for parent text at the claim interval, plus distinctiveness, replication, and a two-groups posterior for contrasts |
| 8 | B1 calibration: table plus normalising note (PR §6.6, MS §4.1) vs no B1 tables (MS E2) | PR, MS | no calibration table for B1 parents |
| 9 | assent from 10+ (CD §9) vs 7+ (ICMR) | CD vs LAM | ICMR standard (§9.2) |
| 10 | LAM-D10: P1 "covers equipoise variation" yet non-P4 children are "deterministic" | LAM §0 | P1 = production adaptation without research-only randomisation (LAM R7.2) |
| 11 | MH-D3 band-split declining prior | MH vs MH R2, R10 | one weakly informative population prior, for population estimation only |
| 12 | "growth edges ≤ strengths" | PR PRI11 vs PR R14 | a fixed cap (≤ 3 monthly); strengths filled with counted actions |
| 13 | age bands differ across documents | LOT (class bands), CD ('6-9'…), MS/MH (B1-B4) | B1-B4 plus continuous age in months (§2.3) |
| 14 | Talsma 2018 used as support for competence → motivation in children | MH-D9, LAM H7 vs MH R1, LAM R4.6 | child prior a_XY ≈ 0; the construct renamed "self-initiated sessions" |
| 15 | conceptual vocabulary via a bifactor general factor | CD §4 vs CD P8 | disjunctive concept × label model (M12h) |

---

## 13. Owner decisions needed

1. **The durability operating point.** The wellbeing bound (predicted retention ≥ 0.6 for every randomised check) and identifiability of per-child durability pull against each other (LOT R1). Options:
   - (a) keep the bound and accept ~27 weeks per topic type before any durability line;
   - (b) widen to the widest permitted window (reliability .67 at 80 checks);
   - (c) add exempt calibration probes, where a failed probe costs one item plus an immediate review.

   Recommended: (b) + (c) at ≤ 5% of slots, with LT6 deciding the floor.
2. **Delayed-start design in D2C.** Is a 3-month delayed start acceptable for families who sought the product? Recommended: partner schools or waitlists only.
3. **Micro-randomisation disclosure.** Is the one-line disclosure plus an annual debrief enough (TV open question 6)? The IEC decides; Taxila proposes it.
4. **Adolescent opt-in for psychological sections** (B4 default: off).
5. **The IEC home and the human reviewers for the flag pathway** (CD open question 6). The pathway must not ship without them.
6. **Research consent at onboarding**, before the paper cohort. Service-consent data cannot be repurposed for publication (MH R21).
7. **Funding and staffing for the external sub-study** (assessors, n ≈ 600, four waves) and the independent monitoring group.

---

## 14. Risks to the program

| risk | consequence | mitigation |
|---|---|---|
| attrition far above 60% | E-PROFILE and the growth aims lose power | within-child aims survive; pre-registered fallbacks; the efficacy sub-cohort runs in partner schools |
| ASR fails G4 for B1 Hinglish | spoken items leave confirmatory models | tap-first items for B1; report voice and tap separately |
| product changes weekly | estimands drift | 6-week frozen policy windows; `policyVersion` fixed effects |
| dashboards leak holdout data | pre-registration credibility | declare a partial seal; holdout children excluded from analytic dashboards |
| L2 yield near zero | parents see few patterns | designed for: reports are fact-first (PARENT-REPORT §7); "still learning" is a first-class state |
| report pressure in exam culture | harm to children | the exam shape; pressure markers as co-primary outcomes; the R-REPORT harm rule |
| LLM paraphrase escapes the lexicon | labels leak | deterministic templates for L2/L3, plus the semantic predicate and claim-checker (PARENT-REPORT §9) |
| a "first" claim fails peer review | credibility | a systematic search before every submission; cite DEEP |

---

## 15. Pending corrections in component documents (checklist for the main loop)

These reviews are complete, but their corrections are not yet applied to the main bodies:
- **LOT:** §0 LT-D1 and LT-D3 rationale; §1 point 4 (Brainerd reading); §3.2 "argue that"; §5.6 add the permitted-design rows and the 100 × 10 row; §5.7 GRR; §6.3 L2 floor; §7 remove the GE band and fix the sleep tip and the hope message; §5.4-5.5 massed/spaced split; H5 renamed; Shuell & Keppel cited.
- **CD:** R6 items 1-26. Highest priority: the parent example sentences (R4), the change-score gate, the shrinkage rule, EZ rules, the bilingual meta-analyses, assent, DEEP.
- **MS:** §6.3 rule 2 (delete the raw-count route); the §7.2 calibration-change shape (delete); the comparative reading slot; bet outcome coding; pL at step onset; the β4 band term; citation fixes per R6.
- **MH:** R1-R22. Highest priority: the §4.5 parent example that breaches the child's confidence (R19), fear-of-harm routing (R20), the alert false-alarm rule (R9), the change rule (R8), the Talsma child prior (R1).
- **TV:** C1-C7, M1-M12, R1-R12. Highest priority: Roberts & DelVecchio .43 (M1), the Ishaan example (C4), barge-in lines (C6), the LST gate replacement (C1), the distinctiveness gate (C3).
- **LAM:** R1-R8. Highest priority: logit scale, hint categories, APC terms, composite MRT outcomes, H1 three-way reading, H6 n, H7 construct, the LAM-D10 fix, "remember next time" wording (R8).
- **PR:** R1-R15 and C1-C18 (folded into `PARENT-REPORT.md`, which supersedes PR §4-§8 wherever they differ).
- **LS §8.4:** replace "≥ N delayed comparisons (likely ≥ 8-10)" with "no per-child format claim in v1 (LAM-D7)".

---

## 16. Context entries

Proposed entries for the main loop are in `context/inbox/psychology.json`:
- **decisions:** claim tiers; decision records with propensities; the parent claim gate; the term change rule; no clock-time features; the umbrella accelerated study; two-tier consent and assent;
- **measurement:** the identifiability simulations;
- **rejections:** the independent-prior claim budget; the raw-count growth route; the grade-equivalent parent band;
- **open:** the durability operating point.

---

## References (load-bearing subset; full lists and tags are in the component documents)

- Bauer, D. J., & Curran, P. J. (2003). Distributional assumptions of growth mixture models. *Psychol Methods* 8:338. [V, LAM]
- Bhavnani, S., et al. (2025). DEEP: a digital assessment of cognitive development in young children, rural India. *PLOS Digit Health*. doi:10.1371/journal.pdig.0000824 [V, CD]
- Brandmaier, A. M., et al. (2018). Precision, reliability, and effect size of slope variance in latent growth curve models. *Front Psychol* 9:294. [V, LOT]
- Fisher, A. J., Medaglia, J. D., & Jeronimus, B. F. (2018). Lack of group-to-individual generalizability. *PNAS*. doi:10.1073/pnas.1711978115 [V, LAM]
- Guggenmos, M. (2021). Measuring metacognitive performance. *Neurosci Conscious*. doi:10.1093/nc/niab040 [V-full, MS]
- Hadad, V., et al. (2021). Confidence intervals for policy evaluation in adaptive experiments. *PNAS*. doi:10.1073/pnas.2014602118 [V, LAM]
- Hamaker, E. L., Kuiper, R. M., & Grasman, R. P. P. P. (2015). A critique of the cross-lagged panel model. *Psychol Methods*. doi:10.1037/a0038889 [V, LAM]
- Hedge, C., Powell, G., & Sumner, P. (2018). The reliability paradox. *Behav Res Methods* 50:1166. [V, CD]
- Indian Council of Medical Research (2017). *National Ethical Guidelines for Biomedical and Health Research Involving Human Participants*. [V full text, LAM]
- Klasnja, P., et al. (2015). Microrandomized trials. *Health Psychol*. doi:10.1037/hea0000305 [V, LAM]
- Koedinger, K. R., Carvalho, P. F., Liu, R., & McLaughlin, E. A. (2023). An astonishing regularity in student learning rate. *PNAS*. doi:10.1073/pnas.2221311120 [V, LAM]
- Lee, Lichand, Barnard, Klotz, Thille, Kim & Domingue (2026). Revisiting the regularity of student learning rate. arXiv:2605.01690. [V, LOT]
- Muralidharan, K., Singh, A., & Ganimian, A. J. (2019). Disrupting education? *Am Econ Rev*. doi:10.1257/aer.20171112 [V, LAM]
- Qian, T., et al. (2022). The microrandomized trial for developing digital interventions. *Psychol Methods*. doi:10.1037/met0000283 [V, LAM]
- Rahnev, D. (2025). Test-retest reliability of metacognitive measures. *Nat Commun*. doi:10.1038/s41467-025-56117-0 [V-full, MS]
- Rouder, J. N., Kumar, A., & Haaf, J. M. (2023). Why many studies of individual differences with inhibition tasks may not localize correlations. *Psychon Bull Rev*. doi:10.3758/s13423-023-02293-3 [V, CD]
- Shoda, Y., Mischel, W., & Wright, J. C. (1994). Intraindividual stability in the organization and patterning of behavior. *JPSP* 67:674. [V, TV]
- Taylor, B. K., et al. (2022). Reliability of the NIH Toolbox cognitive battery in children and adolescents. *Psychol Med*. doi:10.1017/s0033291720003487 [V, CD]
- Weston, S. J., Ritchie, S. J., Rohrer, J. M., & Przybylski, A. K. (2019). Recommendations for increasing the transparency of analysis of preexisting data sets. *AMPPS*. doi:10.1177/2515245919848684 [V, LAM]
- Wisniewski, B., Zierer, K., & Hattie, J. (2019). The power of feedback revisited. *Front Psychol*. doi:10.3389/fpsyg.2019.03087 [V, PR]
- Zhang, K. W., Janson, L., & Murphy, S. A. (2020). Inference for batched bandits. *NeurIPS*. arXiv:2002.03217 [V, LAM]

---

## Appendix A. New computations in this synthesis (`research-program-synthsim.py`, seed 20261002)

**§A. Parent-report gate under screening.**
- Setup: 3,000 children per cell. K candidate within-child contrasts per report. n trials per arm. Baseline success .6 with child SD .5 logit. Real effects are ±1.0 logit in a share of contrasts. Admission requires P ≥ .9 and budget ε = .3.

| K | n/arm | real | independent Beta(1,1): admitted / false / believed | normal-normal EB | two-groups EB (adopted) |
|---|---|---|---|---|---|
| 30 | 12 | 0 | 4.89 / 4.89 / 0.21 | 0 / 0 / 0 | 0 / 0 / 0 |
| 30 | 40 | 10% | 6.88 / 4.57 / 0.24 | 1.46 / 0.39 / 0.09 | 0.08 / 0.00 / 0.01 (yield .03) |
| 30 | 120 | 10% | 7.71 / 4.78 / 0.22 | 5.10 / **2.22** / 0.17 | 1.97 / 0.03 / 0.04 (yield .65) |
| 30 | 120 | 30% | 12.75 / 3.91 / 0.21 | 11.68 / 2.90 / 0.20 | 7.24 / 0.10 / 0.12 (yield .80) |
| 6 | 40 | 30% | 2.29 / 0.87 / 0.07 | 1.45 / 0.33 / 0.06 | 0.29 / 0.01 / 0.01 (yield .16) |
| 6 | 120 | 10% | 1.73 / 1.14 / 0.06 | 1.07 / 0.49 / 0.04 | 0.40 / 0.01 / 0.01 (yield .66) |

  **Reading:**
  - The independent prior is wrong by an order of magnitude.
  - Normal-normal pooling fixes the full null but not sparse real effects: it believed 0.17 false claims where there were 2.22.
  - The two-groups prior is calibrated. At realistic data volumes (12-40 per arm) it finds 0-16% of real effects. Most real within-child differences will go unreported, which is the price of not reporting false ones.

**§B. False change rows per child-year under the null** (n = 30 per 28-day window):
- The raw-count route gives 5.63 rows a year with 6 rows, and 100% of children get at least one.
- The corrected rule (pre-declared direction, once per term, δ = .10, P ≥ .95) gives 0.107 with 6 rows, 0.071 with 4 rows, and 0.050 with 6 rows at P ≥ .975.
- Hence RP-D6's P ≥ .975 above 4 rows.

**§C. Children per band for a reliability CI half-width h:**

| true r | h = .10 | h = .07 | h = .05 |
|---|---|---|---|
| .5 | 220 | 444 | 868 |
| .7 | 103 | 207 | 403 |
| .8 | 53 | 105 | 203 |

**§D. GRR** with monthly occasions and σ_ε = .3, at σ_S = .25 / .5 / .75 / 1.0:

| span | σ_S = .25 | .5 | .75 | 1.0 |
|---|---|---|---|---|
| 6 months | .12 | .35 | .55 | .68 |
| 12 months | .47 | .78 | .89 | .93 |
| 18 months | .73 | .92 | .96 | .98 |

**§E. Sample sizes:**
- TOST ±0.10: 1,713 per arm raw; 856 after R² .5; 1,285 with ×1.5 bandit inflation; 2,569 in total.
- Delayed-start MDES: 0.162 SD.
- Parent RCT: 17,442 / 6,279 / 1,570 families per arm at d = .03 / .05 / .10.

**§F.** The time-to-first-claim table in §6.3.
