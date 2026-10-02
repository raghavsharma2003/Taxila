# Motivation, engagement and habits over time: what Taxila can validly estimate, how, and what it may say

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish tutor with games, probes and a Conductor-run day.
**Question:** How do children's motivation, interest, self-beliefs, academic emotions, engagement and learning habits develop and change between 6 and 15? Which of them leave valid traces in Taxila's logs? Which longitudinal models can turn months of sessions into honest, per-child statements? What can a parent be told, and what can be published?
**Builds on, does not repeat:**
- `learning-science.md` (LS) §1.11 (affect, behaviour-only inference), §3.6-3.8 (mindset, SDT, age table), §8.5 (engagement as a constraint), rules 25-28.
- `learner/motivation-interest.md` (MI). Its in-session 11-state moment filter, interest-phase estimator, move shapes, invariants MI1-MI13 and storage are the *runtime* layer. This file is the *longitudinal and research* layer above it, and adopts MI's evidence base.
- `learner/vibe-temperament.md` (VT): legitimacy tests L1-L5, banned inferences §4.9, modes §4.10.
- `conductor/day-cycle.md` (DC): anchor slot DC1, no streaks DC2, the ~2-month ramp DC3, notification policy DC8. DC already designs the habit; this file *measures* it.
- `design/motivation-without-rewards.md` (MWR): progress UX, no wilting, milestones.
- `psychology/learning-over-time.md` (LOT): hierarchical per-child estimates, randomised identifiability, parent contract.
- `psychology/cognitive-development.md` (CD): reliability arithmetic, the estimability matrix.

**Evidence tags.**
- **[V]** checked this session against the primary abstract or text, via the Europe PMC, ERIC, Crossref, OpenAlex, Semantic Scholar or arXiv APIs. Effect sizes are quoted only where the abstract gives them.
- **[V, MI]** verified on the same date by the sibling file `motivation-interest.md`, and not re-fetched here.
- **[S]** secondary only: a title record, a machine summary (tldr), or a citation inside a [V] source.
- **[U]** unverified: from memory, or a Taxila design default that must be measured.
- A number marked *computed* comes from the simulation `motivation-habits-habitsim.py` in this folder. Its assumptions are [U]; its arithmetic is reproducible (numpy, fixed seed, ~4 s).

**Method.** The shared WebSearch budget was exhausted (200/200) before this review began. Discovery used about 60 structured API queries (Europe PMC REST, ERIC, Crossref, OpenAlex, Semantic Scholar, arXiv) and two direct fetches. Several Elsevier and Springer abstracts are elided in every API, so those items rest on [S]. No study found here measures motivation or habit *from AI-tutor logs in Indian children aged 6-15*. Everything about that population is extrapolation plus the measurement plan in §9.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| MH-D1 | **Motivation is reported as behaviour, never as a trait or a type.** Parents see counts of *self-started sessions, own questions, harder-option choices, retries after error, topic choices*, with time windows. They never see "motivated", "interested in X", "fixed mindset", "low confidence" or "anxious" | Motivational constructs change *meaning* with age: maths "interest" shifts from an affect-laden concept in grade 5 to a cognitive one in grade 9, and its measurement is non-invariant across waves (Frenzel et al. 2012, N=3,193) [V]. One behaviour has many motives. Labels outlive their evidence (VT §4.9) | Never for labels. Construct-level wording (e.g. "chooses challenge more often") is allowed only after MH6 shows that the behavioural index converges with a validated child measure (r ≥ .4) |
| MH-D2 | **The first longitudinal construct reported is session regularity (days with a session per 28 days, and share started by the child), not "habit formed"** | *Computed*: a 28-day count has test-retest r = 0.83-0.88 from logs alone. A per-child habit-formation time (Lally's t95) correlates only r = 0.26-0.42 with the truth, even after 12-36 weeks, and almost no child yields a good curve fit (§5.8) | Taxila data show a context-predictability habit curve (§5.5) with split-half reliability ≥ .7 per child |
| MH-D3 | **The motivational decline from 6 to 15 is the prior, not a finding about the child.** Per-child slow trajectories are partially pooled toward an age-band mean that declines | 107 longitudinal studies: motivational variables declined by Glass's Δ = −0.108 over ~1.65 years, most for intrinsic motivation, maths/language self-concept and mastery goals. Academic self-efficacy did *not* decline (Scherrer & Preckel 2019) [V]. Intrinsic motivation fell from grade 3 to 8 (Lepper 2005) [V, MI] yet stayed rank-stable and grew more stable with age (Gottfried 2001) [V] | Taxila band means are flat or rising (H3). Then the prior is replaced by the observed one, and the finding is published |
| MH-D4 | **Who started the session is a first-class field on every session** (`child`, `parent`, `scheduled`, `teacher_thread`, `school_homework`). No motivation statement mixes them | In Indian homes the parent often supplies the routine [U; DC §1.1]. "Child came back" means something else when a parent opened the app. Autonomy versus control is the core SDT distinction (Howard 2021) [V, MI] | Never. Without it, every engagement model is confounded |
| MH-D5 | **Engagement-state models run at two timescales.** Within a session: MI's online moment filter (never stored). Across sessions: an offline mixed hidden Markov model over session summaries (§5.3) that powers research and Conductor planning. It is never shown as a state name to anyone | Affect dynamics are real but short (confusion↔flow, frustration↔boredom oscillations; D'Mello & Graesser 2012 [V]). Session-level patterns (lapsing, returning) are the habit-relevant ones. Naming a child's state violates MI11/VT VI6 | The across-session HMM fails MH4: its states do not predict next-28-day self-starts better than D28 alone (ΔAUC < .03). Then drop it for D28 + a lapse hazard |
| MH-D6 | **No streaks, no loss framing, no absence push: re-affirmed with new evidence.** Removing GitHub's streak counter changed behaviour: long streaks were abandoned and weekend activity fell (Moldon et al. 2021) [V]. The counter itself was driving the behaviour | Streaks become goals in themselves, and breaks cut engagement independent of actual behaviour (Silverman & Barasch 2022) [V]. Goal-gradient acceleration is a reward-proximity effect (Kivetz 2006) [V]. 3-5-year-olds' apps already contain parasocial and time-pressure dark patterns (Radesky 2022) [V] | Never (ethical floor, = DC2, MI1-MI2) |
| MH-D7 | **Dropout prediction exists only to change what Taxila does** (lighter plan, re-anchor offer, easier entry, a parent logistics check-in). It is never a risk score shown to anyone, and never triggers child-facing pressure | Attrition is the normal shape of digital interventions ("law of attrition", Eysenbach 2005) [V]. Predictive models in MOOCs routinely leak future data and filter populations (Gardner & Brooks 2018) [V]. Stopout and wheel-spinning share predictive features (Botelho 2019) [V], so the first response is pedagogical (prerequisites), not motivational | Never shown. The model is retired if its interventions do not raise 28-day self-starts in the MH9 trial |
| MH-D8 | **Growth mindset is not a measured construct and not an intervention module.** Taxila measures *challenge-seeking and persistence behaviour* directly, and keeps only the one-clause "difficulty means learning" reframe (MI M.REFRAME) | Best-practice meta-analysis: d = 0.02 [−0.06, 0.10] in the highest-quality studies (Macnamara & Burgoyne 2023) [V]. The proponents' meta-analysis gives d = 0.14 for targeted, high-fidelity subsamples (Burnette 2023) [V]. Null effects in 9-13-year-old Chinese children (Li & Bates 2019) [V] and at scale in Argentina (Ganimian 2020) [V]. The robust behavioural signature is challenge-seeking (Rege 2021) [V] | An Indian RCT of a mindset module shows ≥ .10 SD on delayed learning or challenge-seeking |
| MH-D9 | **Self-efficacy is grown through mastery experiences and measured through calibration**, never through "do you believe you can?" questions alone | Performance predicts later self-efficacy more strongly than the reverse (β = .205 vs .071; Talsma 2018, k=11) [V]. Mastery experience is typically the strongest source (Usher & Pajares 2008) [V] | MH5 shows self-report efficacy items predict next-week choice and persistence better than behaviour |
| MH-D10 | **Too much is measured as carefully as too little.** Compulsion markers (use after bedtime, session-length creep, repeated pleas past the cap, distress about missing) are first-class outcomes in every retention experiment | Moderate digital use is not harmful but the relation is curvilinear (Przybylski & Weinstein 2017, n=120,115) [V]. A habit product for children can fail by succeeding | Never removed |

---

## 1. Executive summary

1. **Motivation declines on average from about age 8 to 15, but it does not decline uniformly or inevitably.**
   - The meta-analytic decline is small: Δ = −0.108 over ~1.65 years. It is largest for intrinsic motivation, domain self-concepts and mastery goals. General academic self-efficacy and self-esteem did not change. School transitions did not moderate it, and the decline was smaller in Asia and North America than in Europe (Scherrer & Preckel 2019) [V].
   - Rank order is stable and becomes more stable with age (Gottfried 2001) [V].
   - A stimulating home environment at age 8 predicted academic intrinsic motivation at 9, 10 and 13, beyond SES (Gottfried 1998) [V].
   - **Implication:** for a 13-year-old, "holding steady" is a real achievement. Taxila must report change against the child's own past, with the age-band drift as context.
2. **The constructs change shape, not just level.** Maths interest is affect-driven in grade 5 and cognitive by grade 9, and its measurement is non-invariant across waves (Frenzel 2012) [V]. A single "interest score" tracked from age 6 to 15 is not one quantity. Taxila tracks *behaviours* whose meaning is stable (choosing a topic, asking your own question, starting a session) and lets interpretation be age-banded.
3. **Competence feeds motivation more than the reverse.**
   - Self-efficacy: performance → efficacy β = .205, efficacy → performance β = .071 (Talsma 2018) [V].
   - Emotions: enjoyment and pride predicted later maths achievement, and achievement predicted them. Anger, anxiety, shame, boredom and hopelessness showed the mirror pattern, grades 5-9, N=3,425 (Pekrun et al. 2017) [V].
   - Competence is the strongest SDT predictor (Bureau 2022) [V, MI].
   - **Implication:** the motivational engine is the learning engine (MI D2). Longitudinal models must estimate *reciprocal* paths with random intercepts (RI-CLPM), because a plain cross-lagged model gives spurious directions (Hamaker 2015) [V].
4. **Academic emotions are measurable as consequences and as risks.**
   - Enjoyment ρ = .27 with performance; anger −.35; boredom −.25; frustration ≈ 0 (−.02). Relations are stronger in secondary than primary school (Camacho-Morles 2021, 68 studies) [V].
   - Maths anxiety correlates r = −.34 with performance. The correlation is stronger on multistep tasks and on grade-relevant tests (Namkung 2019, 131 studies) [V].
   - Frustration is not the enemy. Boredom is the persistent, costly state (Baker 2010) [S]; frustration during learning co-occurs with good outcomes (Pardos 2014) [V, MI].
5. **Habits take months, vary hugely, and are about context, not counting.**
   - Lally: 96 adults, one daily behaviour in a fixed context. Time to 95% of asymptotic automaticity ranged **18-254 days**. Only 39 of 82 analysable participants gave a good fit, and missing one day did not matter [V]; the 66-day median is [S].
   - Systematic review: medians 59-66 days, means 106-154, range 4-335 (Singh 2024, 20 studies, all adults) [V].
   - Behavioural big data: gym habits take *months*, hospital handwashing *weeks*. Predictable individuals were less responsive to incentives, consistent with habits being insensitive to reward devaluation (Buyalskaya 2023, >52 M observations) [V].
   - **There is no study of learning-habit formation time in children aged 6-15.** The closest evidence: adolescent homework and study habits mediated the effect of self-control on homework completion and GPA (Galla & Duckworth 2015) [V]; and a review argues habits are an overlooked route in student self-regulation (Fiorella 2020) [V].
6. **Streaks and points move behaviour by becoming the goal.** They are effective, and that is the problem (MH-D6).
   - Gamification shows small positive effects: cognitive g = .49, motivational .36, behavioural .25, with the motivational and behavioural effects unstable under rigour (Sailer & Homner 2020) [V].
   - A semester-long gamified course *lowered* intrinsic motivation and satisfaction over time (Hanus & Fox 2015) [S].
7. **Engagement has three faces** (behavioural, emotional, cognitive; Fredricks 2004) [V]. They follow *different* downward trajectories in adolescence: belonging declines most but predicts grades least (Wang & Eccles 2011, grades 7-11) [V]. Taxila sees mostly the behavioural face, a little of the cognitive face (own questions, elaboration, self-explanation quality), and the emotional face only indirectly. Reports must say which face a number describes.
8. **Mindset: keep the behaviour, drop the construct.** Correlational links between mindset and achievement are weak (Sisk 2018, k=273) [V]; intervention effects are near zero or small and context-dependent (MH-D8). Two findings are worth keeping:
   - Mindset interventions increased challenge-seeking on a behavioural task, where school policy allowed it (Rege 2021) [V].
   - Parents' process praise at 14-38 months predicted incremental beliefs at 7-8 years (Gunderson 2013, N=53) [V]. Yet a preregistered test found no person-versus-process praise difference in 8-year-olds' persistence (Bennett-Pierre 2024, N=150) [V].
9. **Dropout is predictable, but the prediction is only worth something if it changes Taxila's behaviour.**
   - Weekly clickstream history predicts MOOC dropout better than baselines once history exists (Kloft 2014) [V].
   - The literature's common errors are filtered subpopulations, weak evaluation, and features unavailable at prediction time (Gardner & Brooks 2018) [V].
   - For children the default prediction target is a **lapse** (≥ 14 days without a child- or parent-started session), modelled as a discrete-time hazard with time-varying covariates and evaluated on a strict temporal split (§5.7).
10. **What can honestly be said to parents** (§6): regularity counts, who started sessions, how the child spends choice (harder, different, teacher's pick), own questions by subject, persistence after errors, and change against the child's own past. Each comes with a window, n, and what Taxila is doing about it. Never a label, a risk score, a percentile, a "habit formed" badge, or an emotion attributed to the child.

---

## 2. Constructs at a glance

Per-child reliability is the *expected* value at Taxila's data shape. Every entry not marked *computed* is [U] until §9 measures it.

| id | construct | working definition | Taxila observable (log fields) | model (§5) | per-child reliability | parent-reportable? |
|---|---|---|---|---|---|---|
| M1 | Motivation quality (SDT) | how autonomous (intrinsic or identified) versus controlled (introjected or external) the reasons for learning are | share self-started; voluntary continuation ("one more" requests, I2); choice uptake; persistence without prompts | latent growth on monthly indicator vector; band-pooled | moderate for self-start share (count-based) | as counts only |
| M2 | Interest (per domain/tag) | the phase-graded predisposition to re-engage with a content area (Hidi & Renninger 2006) [V, MI] | MI indicators I1-I8 by domain | MI §2.7 phase rules + Poisson rate model (§4.2) | moderate for rates after ~6 sessions in the domain [U] | as counts by subject |
| M3 | Challenge-seeking | the tendency to pick a harder option when one is genuinely offered | `choice` events where offered options differ in difficulty, with KT pSuccess of each | hierarchical logistic, pSuccess-adjusted (§4.3) | moderate after ~20 choice events [U] | yes, as counts |
| M4 | Persistence after error | unprompted retry or continued effort after an incorrect attempt | VT V10 retries; time-to-quit after error; hint-ladder completion | hierarchical survival of "time to give up" within an item (§4.3) | moderate [U] | yes, as counts |
| M5 | Self-efficacy (task-level) | confidence in being able to do a specific kind of task | pre-answer confidence ratings (LS §1.9); "mujhse nahi hoga" counts (MI selfDoubt) | calibration model: bias and resolution vs KT accuracy (§4.4) | bias moderate; resolution low [U] | only as "confidence matched results" style statements, after MH5 |
| M6 | Academic emotions (aggregate) | enjoyment, anxiety, boredom, frustration and pride in learning, appraised from control and value (Pekrun 2006) [V] | session-level counts only (MI policy): lexBored, avoidTalk, normTalk, lexHard; optional monthly pictorial check-in (research consent) | counts → monthly rates; no state stored | low (rare events) | **no** (wellbeing gate, §7) except routing to parent support content when sustained avoidance co-occurs with exam talk |
| M7 | Within-session engagement dynamics | moment-to-moment flow, struggle, boredom or frustration and their transitions | MI TurnFeatures | MI online filter; offline transition statistics with self-transition correction (§5.2) | not a per-child construct | no |
| M8 | Across-session engagement state | the child's current mode of use (e.g. routine, sporadic, lapsing, returning) | session summaries + gaps | mixed hidden Markov model (§5.3) | state posteriors, not reliabilities | no (drives the Conductor only) |
| M9 | Session regularity | how consistently sessions occur, and in the anchored context | daily session indicator; slot index relative to the parent-set anchor (never clock time) | discrete-time recurrent-event hazard with frailty (§5.4) | **D28: 0.83-0.88** *computed*; anchor share 0.58-0.69 *computed* | yes, as counts |
| M10 | Habit automaticity | the degree to which the anchored context alone triggers the session | context predictability over time (Buyalskaya-style), Lally curve | §5.5 | **poor**: r(t̂95, t95) = 0.26-0.42 *computed* | **no** |
| M11 | Lapse / dropout risk | hazard of ≥ 14 days without a session | all of the above + plan, subscription, calendar | discrete-time hazard (§5.7) | population-level AUC; not a child trait | **never** |
| M12 | Compulsion markers | signs that use is crowding out sleep, play or family, or carries distress | sessions after parent bedtime; session-length creep; cap-override pleas; distress words about missing | monitored counts; alert thresholds (§7) | n/a (safety signal) | yes, to the parent, as facts with a suggestion |

---

## 3. Measurement foundations specific to motivation

### 3.1 Self-report is weak below about 9, and changes meaning after
- Young children overestimate their competence; their self-assessments become more accurate, and lower, through the primary years (Stipek & Mac Iver 1989) [S title; U detail]. LS §0 already found children 6-12 systematically overconfident [S].
- Elementary-school emotion questionnaires exist with pictorial formats (AEQ-ES, Lichtenfeld et al. 2012, grades 2-3) [S title]. They are research instruments: Taxila may use a 3-item pictorial check-in *with research consent*, never as a gate or a report.
- Measurement non-invariance across age (Frenzel 2012) [V] means that a latent mean change in "interest" between grades 5 and 9 is partly a change in what the items measure. Longitudinal comparisons need invariance tests or behavioural indicators.
- Cultural meaning varies. Korean, Filipino and US adolescents weighed the same efficacy sources differently: Filipino students' efficacy was best predicted by peer persuasion (Ahn, Usher, Butz & Bong 2016) [V]. Choice and "teacher's pick" carry different meanings in Asian-heritage children (Iyengar & Lepper 1999) [V, MI]. Indian norms are [U] until measured (MH7).

### 3.2 Behaviour is many-to-one
A session started by the child can reflect interest, a parent's instruction ten minutes earlier, avoidance of something worse (chores), a tuition-free day, or a sibling using the phone. Taxila therefore:
- records *who started it* (MH-D4)
- reports behaviours, not motives (MH-D1)
- treats any motive interpretation as a research hypothesis that needs convergent validity (MH6).

### 3.3 The system is part of the data (policy dependence)
Taxila's own moves change the behaviours used to measure motivation: an offered choice creates a choice event, a thread creates a return, a plan creates a session. Three consequences:
1. Every indicator is defined *per opportunity*: the harder-choice rate is per offer with a genuine difficulty contrast, and own questions are per M.QLICENSE invitation and per minute uninvited.
2. Policy changes (new Conductor defaults, a new thread mechanic) are logged as `policy_version` and enter models as covariates or break points.
3. A small randomised component is kept in what is offered (as LOT-D3 does for delayed checks), so that indicator differences can be separated from offer differences [U].

### 3.4 Within-person versus between-person
"Children who enjoy maths do better" (between) is not "when this child enjoys maths more, she does better next month" (within). Reciprocal-effects findings (Pekrun 2017; Talsma 2018) are mostly between-person cross-lagged estimates. A random-intercept CLPM separates stable differences from within-person carry-over, and the classic CLPM can get even the *sign* wrong (Hamaker, Kuiper & Grasman 2015) [V]. Taxila's intensive longitudinal data suit dynamic multilevel models (DSEM: random means, autoregressions and cross-lags per person; Hamaker et al. 2018, ~100 days × >100 people) [V]. Taxila will have far more occasions per child than any panel study. That is the publishable advantage (§8).

### 3.5 Ages, bands and the hinge
This file uses DC's bands: B1 6-7, B2 8-9, B3 10-12, B4 13-15. The motivational hinge is around 9-12 (MI §4): effort and ability concepts separate, performance goals rise from grade 5 (Bong 2009) [V, MI], and praise begins to signal low ability (Barker & Graham 1987) [V, MI]. Every pooled prior in §5 is band-specific, and a child changes band mid-year without a discontinuity: priors are interpolated by age in months [U].

---

## 4. Constructs: definition, trajectory, indicators, model, validity, parents

### 4.1 Motivation quality (SDT) — M1

**Definition.** SDT orders regulation from external (rewards, punishment) through introjected (guilt, pride, "mummy will be upset") and identified (personal value) to intrinsic (interest, enjoyment). Satisfying the needs for competence, autonomy and relatedness moves regulation toward the autonomous end. Intrinsic motivation tracks success and well-being; introjection tracks persistence *and* ill-being (Howard 2021) [V, MI].

**Trajectory 6-15.**
- Intrinsic motivation declines linearly from grade 3 to 8 (Lepper 2005) [V, MI] and is the largest decliner in the meta-analysis (Scherrer & Preckel 2019) [V].
- Need satisfaction is the proposed buffer: an accelerated cohort analysis of adolescent motivation decline tested need satisfaction as the moderator (Gnambs & Hanfstingl 2016) [S title].
- Individual differences are stable and increasingly so (Gottfried 2001) [V].
- Home environment matters early (Gottfried 1998) [V].
- [U] For Indian children, controlled regulation (exam pressure, family pride) is probably higher at B3-B4 (Deb 2014, older sample [V, MI]).

**Indicators in Taxila logs.** Each is per opportunity and split by `started_by`:
- S1 self-start share: child-started sessions / all sessions (28-day window)
- S2 voluntary continuation: "one more" requests per session that reached the planned end (MI I2; never prompted after exit intent)
- S3 choice uptake: share of offers where the child chose, rather than deferring, excluding "teacher's pick", which is a legitimate choice (MI D9)
- S4 exploration: module events beyond the task per module minute (MI I6)
- S5 introjection markers (count only): "mummy/papa ko batana", "daant padegi" and similar (MI lexicon gate MM1)
- S6 exit pattern: share of sessions ending at a natural close versus mid-item exit.

**Measurement model.** A monthly multivariate latent growth model per child, pooled by band:
```
y_{c,m,j} ~ BinomialLogit or Poisson(offset = opportunities_{c,m,j})
logit/log μ_{c,m,j} = ν_j + λ_j · η_{c,m} + ζ_{c,j}            (j indexes S1..S4; ζ = indicator-specific child effect)
η_{c,m} = η0_c + η1_c · (m / 12) + ε_{c,m},   ε_{c,m} = φ ε_{c,m-1} + ω_{c,m}    (AR(1) monthly deviations)
η0_c ~ N(μ0[band(c)], σ0²),   η1_c ~ N(μ1[band(c)], σ1²)
prior: μ1[B3,B4] ≈ −0.065 SD/yr (Scherrer & Preckel Δ −0.108 / 1.65 yr) [V]; μ1[B1,B2] ≈ 0 ± 0.1 [U]
```
- Loadings λ_j are estimated per band and tested for invariance across bands, the Frenzel lesson. If invariance fails, the indicator is reported alone and the composite η is not used.
- S5 never loads on η. It is a separate count, used only to suppress introjection-like teacher moves (MI3).

**Validity concerns.** S1 is confounded by family routine (MH-D4). S2 is confounded by session cap and fatigue. Convergent validity needs a child-level criterion: a validated self-report of autonomous motivation in B3-B4, or blinded teacher/parent ratings in B1-B2 (MH6) [U].

**What can be said to parents.** "In the last 4 weeks Riya started 9 of 15 sessions herself (in July: 4 of 13)". "She asked for one more problem 3 times". Never "she is intrinsically motivated". If S1 is low for a 7-year-old: say nothing evaluative, because parent-started sessions are the norm at that age [U]. Offer the anchor-routine tip (DC1).

### 4.2 Interest development — M2

**Definition.** Interest is both a psychological state of attention and affect toward a topic and an enduring predisposition to re-engage (Harackiewicz, Smith & Priniski 2016) [V]. It develops through four phases: triggered situational, maintained situational, emerging individual, and well-developed individual (Hidi & Renninger 2006) [V, MI]. Four intervention families have support: attention-getting settings, contexts that evoke existing interests, problem-based learning, and utility value (Harackiewicz 2016) [V].

**Trajectory.** Average academic interest declines through adolescence. It also changes *kind* (Frenzel 2012) [V]; family and school context influence the trajectory of maths interest (Frenzel, Goetz, Pekrun & Watt 2010) [S title]. Curiosity before an answer drives memory in children and adolescents alike; interest *after* the answer adds more for adolescents (Fandakova & Gruber 2021) [V, MI].

**Indicators.** MI I1-I8 (own question, one-more, chose topic, outside knowledge, unprompted retry, exploration, self-started on the domain, rejection), per domain and per interest tag.

**Measurement model.** MI §2.7 rules give the runtime phase. For research and reporting, a per-child per-domain rate model:
```
N_{c,d,w,i} ~ Poisson( E_{c,d,w,i} · exp(β_{0,i} + u_{c,i} + v_{c,d} + τ_{d,w}) )
   i = indicator, w = 4-week window, E = exposure (minutes in domain d, or offers for I3)
   v_{c,d} ~ N(0, σ_v²)            child × domain interest (the quantity of interest)
   τ_{d,w}                          domain-wide seasonality (exam months, curriculum position)
interest contrast for child c: v_{c,maths} − v_{c,science}, reported only if P(contrast > 0) ≥ .9 and ≥ 6 sessions per domain
```
**Validity.** Exposure is endogenous: the Conductor schedules more of the subject the parent asked for. The model therefore conditions on `started_by` and uses *child-started* exposure for the I7 term. Phase transitions need MM8's predictive check (phase at day 30 → self-started sessions in days 31-60; AUC ≥ .60) [V, MI design].

**Parents.** "Asked 7 of her own questions about plants this month; picked science 4 of 6 times she was given a choice". Never "she is a science person". Phase labels are never shown (MI).

### 4.3 Challenge-seeking, persistence and the mindset question — M3, M4

**Why these replace "mindset".** The mindset construct predicts achievement weakly (Sisk 2018) [V]. Interventions average d ≈ 0.02-0.05 under best-practice filters (Macnamara & Burgoyne 2023) [V], or d = 0.14 for targeted subsamples with a wide prediction interval of −0.08 to 0.35 (Burnette 2023) [V]. The national US experiment found grade benefits for lower achievers, conditional on peer norms (Yeager 2019) [V]. In Chinese 9-13-year-olds, mindset was unrelated to resilience after failure or to grades (Li & Bates 2019) [V]. An SMS programme in Brazil reports large effects (Lichand et al. 2025, preprint, 108,345 students) [V, preprint; unreviewed]. Heterogeneity is the honest summary.

What *is* behavioural and robust:
- choosing challenge (Rege 2021's "make-a-math-worksheet" task) [V]
- persisting after failure, the original Mueller & Dweck outcome, which Li & Bates partly replicated (p = .049) [V].

**Trajectory.** [U] Challenge-seeking probably dips in B3-B4 as performance-approach goals and social evaluation rise (Bong 2009 [V, MI]). Persistence after errors is shaped by feedback type more than age, and the evidence for children is mixed (Bennett-Pierre 2024: no person/process difference at age 8; process praise > control, d = .61) [V].

**Indicators.**
- `choice_harder`: on offers whose options differ in KT pSuccess by ≥ .15
- `retry_unprompted` after an incorrect attempt
- `quit_latency`: time from the first error on an item to abandonment or "pata nahi"
- `hint_request_timing`: immediate versus after an attempt.

**Measurement models.**
```
Challenge-seeking:  logit P(harder_{c,k}) = α_c + β1·ΔpSuccess_k + β2·moment_k + β3·band + γ·policy_k
                    α_c ~ N(μ_α[band], σ_α²)       α_c is the challenge-seeking index (pSuccess-adjusted)
Persistence:        hazard of giving up at attempt a after first error on item k:
                    logit h_{c,k}(a) = θ_a + ρ_c + δ1·pSuccess_k + δ2·hintsUsed_{k,a} + δ3·moment_k
                    ρ_c ~ N(0, σ_ρ²)              lower ρ_c = more persistent
```
**Validity concerns.**
- Harder-choice depends on what was offered and on the child's moment (fatigue). It must be adjusted, and is reported only with ≥ 20 qualifying offers [U].
- Persistence is not always good: wheel-spinning is unproductive persistence and is a prerequisite problem (Wan & Beck 2015 [V, MI]; Park 2023) [V]. ρ_c is reported only on items where KT says the child *could* succeed (pSuccess ≥ .4).

**Parents.** "When given a harder option, chose it 6 of 14 times; tried again on her own after 11 of 18 mistakes". Plus an evidence-based home tip: praise the method, ask her to explain how she got unstuck (VT, MWR §11). Never "growth mindset" or "fixed mindset", in English or in Hindi paraphrase.

### 4.4 Self-efficacy and self-concept — M5

**Definition.** Self-efficacy is task-specific confidence in one's capability to organise and execute actions to reach a goal (Bandura 1977) [S]. It has four sources: mastery experience, vicarious experience, social persuasion, and physiological/affective states (Usher & Pajares 2008) [V]. Academic self-concept is the broader, comparison-laden judgement of one's ability in a domain [U].

**Trajectory.**
- Domain self-concepts decline across schooling; *academic self-efficacy does not* on average (Scherrer & Preckel 2019) [V].
- Self-concept and achievement are reciprocally related over time (Wu et al. 2021 meta-analysis) [S title].
- Children's ability judgements become more realistic with age (Stipek & Mac Iver 1989) [S].
- Sources differ by culture and by who delivers them (Ahn 2016) [V]. Peer models raised children's efficacy more than teacher models (Schunk & Hanson 1985) [V, MI].

**Indicators.**
- Optional pre-answer confidence ("pakka / shayad / pata nahi") on a probe subset (LS §1.9)
- self-doubt utterance counts (MI selfDoubt)
- choice of harder (M3)
- latency to start answering on new-skill items relative to the child's baseline (weak; VT V4).

**Measurement model: calibration rather than level.** For a confidence rating r ∈ {0, .5, 1} and outcome o ∈ {0, 1} on item k:
```
bias_c      = mean_k(r_{c,k}) − mean_k(o_{c,k})                      (overconfidence > 0)
resolution_c = Goodman–Kruskal γ between r and o within child          (discrimination)
hierarchical: o_{c,k} ~ Bernoulli(σ(θ_c − b_k)),  r_{c,k} ~ OrderedLogit(κ_c + ψ_c·(θ_c − b_k))
   κ_c = confidence offset (efficacy level), ψ_c = sensitivity to own skill (resolution)
```
**Validity.**
- Confidence ratings are reactive. Asking too often turns teaching into testing (LS §1.9), so ratings are capped at ≤ 3 per session [U].
- Young children's resolution is near zero [S], so ψ_c is not estimated for B1.
- Mastery experiences dominate, which is why Taxila's lever is capability statements backed by KT evidence (MI M.CAPABILITY, MI12) and not persuasion.

**Parents.** Only after MH5 validates the measure: "Her confidence matches her results well in fractions; in word problems she says 'pata nahi' even when she gets them right, so we show her the evidence". Never "low self-esteem", "lacks confidence" or "overconfident".

### 4.5 Academic emotions (Pekrun's control-value theory) — M6

**Definition.** Achievement emotions are tied to achievement activities (enjoyment, boredom, frustration, anger) or to their outcomes (pride, hope, anxiety, shame, hopelessness). They arise from appraisals of **control** (can I do this?) and **value** (does it matter?), are domain-specific, are reciprocally linked to achievement, and are relatively universal across cultures (Pekrun 2006) [V].

Core appraisal predictions (Pekrun 2006) [V; the function forms below are an interpretive sketch, U]:
```
enjoyment ≈ f(+control, +positive value of the activity)      boredom ≈ f(control very high or very low, −value)
anxiety   ≈ f(uncertain control over outcome, +value)          hopelessness ≈ f(no control, +value)
pride     ≈ f(success attributed to self, +value)               shame ≈ f(failure attributed to self, +value)
```
Note the multiplicative role of value: an emotion's intensity scales with how much the outcome matters. For Indian exam culture [U], this predicts that high-value, low-control moments (marks talk on a hard topic) are the anxiety hot spots. That is why MI routes `lexEval` and `avoidTalk` to M.PRIVATE and M.PB.

**Trajectory.**
- Emotions and achievement reinforce each other from grade 5 to 9 (Pekrun 2017) [V].
- Emotion-performance relations are *stronger in secondary school* (Camacho-Morles 2021) [V].
- The anxiety-performance link is stronger for grade-relevant tests and multistep tasks (Namkung 2019) [V].
- Boredom relates to achievement at r = −.24 (Tze 2016) [V, MI]. Among grades 5-9, boredom arises from under-challenge in 21% and over-challenge in 13% (Schwartze 2024) [V, MI].

**Indicators.** Taxila never stores momentary affect (MI §2.2). The longitudinal record holds only per-session *counts* of lexicon markers (bored, hard, eval, avoid, fatigue), the diagnostic-choice picks, and early exits. An optional monthly 3-item pictorial check-in (enjoy / worry / bored, for the current subject) is collected only under research consent and never shown to parents individually.

**Model.** Monthly marker rates per 100 child turns, by domain:
```
K_{c,d,m,e} ~ NegBin( T_{c,d,m} · exp(β_e + a_{c,e} + b_{d,e} + γ_e·examWindow_{m} + δ_e·pSuccessMean_{c,d,m}) , φ_e )
```
Conditioning on mean pSuccess separates "the work was too hard" from "this child expresses worry". Exam windows are a known within-person moderator [U].

**Validity.** Lexicon precision has to pass MM1 (≥ .80) [V, MI design]. Low counts make per-child rates noisy. Code-switched ASR may drop the very tokens ("bore", "tension") that matter (MI open question 1).

**Parents.** No emotion is attributed to the child in reports (wellbeing gate, §7). When avoidance and evaluation talk is sustained (§7 thresholds), the parent sees a *factual* note ("in 4 of the last 6 sessions she asked whether this would come in the exam and asked not to tell anyone her mistakes"), Taxila's response (practice rounds, no scores), and parent guidance content on lowering exam pressure. It is never "your child is anxious". Clinical concerns follow the existing safeguarding hand-off (Tele-MANAS 14416, Childline 1098), not this model.

### 4.6 Boredom and frustration dynamics — M7

**Definition and theory.** D'Mello & Graesser's model: engagement/flow → confusion at impasses → back to flow if the impasse is resolved, or on to frustration → boredom if not. Time-series data confirmed confusion-flow, boredom-frustration and confusion-frustration oscillations (D'Mello & Graesser 2012) [V]. Boredom is the most persistent and most damaging state, and is associated with gaming the system (Baker et al. 2010) [S]. The boredom/frustration distinction matters because the remedies are opposite (MI D3).

**Methodological trap: self-transitions.** Transition likelihood statistics (D'Mello's L) behave differently depending on whether self-transitions (bored → bored) are included. Karumbaiah, Baker & Ocumpaugh (2019) [S title] argue they must be handled explicitly or the transition findings are distorted. Taxila's offline analysis therefore reports both:
```
L(A→B) = [ P(B_next | A_now) − P(B_next) ] / [ 1 − P(B_next) ]        (D'Mello's L)
computed (i) on all transitions, (ii) excluding self-transitions with P(B_next) re-based on non-A states;
plus a first-order Markov chain with child random effects as the model-based alternative (§5.2).
```
**Trajectory.** [U] No developmental study of affect dynamics across ages 6-15 was found. Emotion-performance links strengthen with age (Camacho-Morles 2021) [V]. Taxila's data could provide the first such description (§8 H5).

**Parents.** Nothing about moment states. At most: "when work got hard, she usually kept going (stayed with it in 9 of 12 hard stretches); we break hard steps into smaller ones when it lasts".

### 4.7 Engagement (behavioural, emotional, cognitive) — M7-M8

**Definition.** Behavioural (participation, effort), emotional (affect, belonging) and cognitive (investment, strategy use) engagement (Fredricks, Blumenfeld & Paris 2004) [V].

**Trajectory.** All three decline across grades 7-11, at different rates and with different predictive weight (Wang & Eccles 2011) [V].

**Taxila's view.** Behavioural engagement is well observed: time on task, response rates, early exits. Cognitive engagement is partly observed: elaborated answers, own questions, self-explanation quality, teach-back depth (LS §1.3 ICAP). Emotional engagement is only inferred, from lexicon and uptake.

**Engagement tracing.** Beck's idea: model each response as coming from an engaged or a disengaged process, with disengagement flagged by implausibly fast responses (Beck 2005) [U: not re-fetched]:
```
P(o_{c,k}=1) = P(E_{c,k}) · σ(θ_c − b_k)  +  (1 − P(E_{c,k})) · g_k
P(E_{c,k}) = σ( ε_c + ε1 · log(RT_{c,k} / RT̄_{c}) + ε2 · position_in_session )          (ε_c: child engagement offset)
```
This feeds KT: disengaged responses are down-weighted (LS §7.2 rule 4; MI `fastWrong`, gaming). It also yields a session-level disengagement share, which the across-session HMM (§5.3) uses as an emission.

### 4.8 Habit formation — M9, M10

**Definition.** A habit is a learned context→response association. Once formed, the context triggers the response without deliberation, and the behaviour becomes insensitive to changes in goals and rewards (Wood & Neal 2007; Wood & Rünger 2016) [S]. Buyalskaya 2023's finding that predictable gymgoers respond less to incentives is behavioural evidence of that insensitivity [V]. Self-report automaticity is measured by the 4-item SRBAI (Gardner et al. 2012) [V], which is suitable for adolescents [U] but not for 6-9-year-olds.

**Time course (adult evidence only).**
- Lally 2010: asymptotic curves, 18-254 days to 95% of asymptote; a good fit for only 39 of 82; consistency of performance associated with better fit; one missed day immaterial [V].
- Singh 2024: medians 59-66 days, range 4-335. Morning practice and self-chosen habits were stronger [V].
- Buyalskaya 2023: months for gym, weeks for handwashing. There is no magic number [V].
- Gardner, Rebar & Lally 2022 give design guidelines for tracking real-world habit formation [S title].

**Children and learning.**
- Self-control's benefits run substantially *through* habits, including homework and study habits, in adolescents and students (Galla & Duckworth 2015, 6 studies, N = 2,274) [V].
- Habits are argued to be the missing piece in student self-regulation research. Interventions should stabilise supportive contexts and disrupt cues for bad habits (Fiorella 2020) [V].
- For 6-9-year-olds, the habit is substantially the *family's* routine (DC §1.1) [U].

**Context change is the window for change.** The habit-discontinuity hypothesis: interventions work better shortly after a life-context change. In a field experiment with 800 households, the window was about three months after relocation (Verplanken & Roy 2016) [V]. For Taxila: the start of the school year, a move from one board to another, the start of tuition, and post-vacation restarts are windows to *re-anchor*. Festivals and exam timetables are predictable *disruptions* (DC §7.4).

**Reminders can substitute for habit.** App reminders support the behaviour but can hinder the automaticity that needs to form. Contextual cues and implementation intentions support habit formation better (Stawarz, Cox & Blandford 2015) [S tldr]. This supports DC8: no child pushes, and an anchor rather than a notification.

**Indicators.**
- daily session indicator
- `slot` relative to the anchor (anchor / backup / other), never clock time-of-day (LOT invariant 4, VT L3)
- `started_by`
- days since last session
- calendar flags (school day, holiday, exam window, festival)
- for B4, an optional monthly SRBAI item pair under research consent.

**Models.** §5.4 (recurrent-event hazard) and §5.5 (automaticity curves); simulation results in §5.8.

**Parents.** "Sessions happened on 17 of the last 28 days, 13 of them at the after-snack time you chose". "After the Diwali break it took 4 days to get back to the routine". Never "the habit is formed", "habit score", a calendar grid of missed days (MWR §0.3), or day counts framed as streaks.

### 4.9 Streaks, rewards and engagement mechanics: the evidence on harm

- **Mechanism.** A logged streak becomes a goal in itself. Intact versus broken streaks shift engagement independent of the actual behaviour, more so when the break is self-attributed, and less when the streak can be "repaired" (Silverman & Barasch 2022, 7 studies) [V].
- **Natural experiment.** When GitHub removed its streak counter without announcement, long streaks were abandoned, weekend activity fell and single-contribution days declined (Moldon, Strohmaier & Wachs 2021) [V]. The counter itself produced the weekend work. That is the harm model for a child: work done for the counter, on days a family might rest.
- **Goal gradient.** Effort accelerates as a reward nears, and even an *illusion* of progress accelerates it (Kivetz, Urminsky & Zheng 2006) [V]. Progress bars toward a reward are a lever on behaviour, not on learning.
- **Rewards in children.** Tangible, expected rewards undermine free-choice intrinsic motivation, more so for children (Deci, Koestner & Ryan 1999) [V, MI].
- **Gamification evidence.** Small average benefits, unstable for motivational and behavioural outcomes (Sailer & Homner 2020) [V]; declines over a semester in a gamified course (Hanus & Fox 2015) [S].
- **Dark patterns in children's apps.** Among apps used by 3-5-year-olds: parasocial relationship pressure (24.8% of apps with characters), time pressure (17.3%), navigation constraints (45.9%) and attractive lures (45.1%) to prolong play. These were more prevalent for lower-education households (Radesky et al. 2022) [V].
- **Industry benchmark** (from market/MWR [V there]). Duolingo reports that a 7-day streak goes with 3.6× course completion, and that streak freezes lifted daily actives. These are retention numbers, not learning numbers.

**Taxila stance.** Unchanged (MI1-MI2, DC2, MWR). The new rule is that **every retention experiment must report compulsion markers** (MH-D10, §7) alongside learning and return.

### 4.10 Dropout and lapse prediction — M11

- **Attrition is normal.** In eHealth and self-help applications, a substantial share of users stop. Kaplan-Meier and proportional-hazards attrition curves should be standard reporting (Eysenbach 2005) [V].
- **What predicts.** Weekly behavioural history predicts MOOC dropout once it exists (Kloft 2014) [V]. In ASSISTments, middle-school stopout and wheel-spinning detectors share learned features: low and unproductive-high persistence are related (Botelho et al. 2019) [V]. Online-programme dropout hazard is highest early and declines (Coleman 2019, survival analysis) [V abstract, graduate sample].
- **What goes wrong** (Gardner & Brooks 2018) [V]:
  - filtering to active subpopulations
  - weak evaluation
  - features unavailable at prediction time (look-ahead leakage)
  - explainers that disagree on feature importance for the same model (Swamy et al. 2022) [V].
- **For Taxila**, the outcome is a lapse: ≥ 14 consecutive days with no session of any `started_by` [U threshold; tuned so that < 10% of lapses are holidays the parent declared]. Model in §5.7.

---

## 5. Longitudinal models Taxila can fit

### 5.1 Data contract (all already emitted or proposed in MI/DC; the new fields are marked ✚)

| table | grain | fields used here |
|---|---|---|
| `session` | one per session | child_id, date (local), slot (anchor/backup/other ✚), started_by ✚, planned_min, actual_min, end_kind (natural/exit_intent/cap/crash), policy_version ✚, calendar flags ✚ |
| `motivation_session_agg` (MI §7) | one per session | choices_offered/taken, teacher_pick, harder_picked, own_questions, one_more, diag_choice, prereq_routes, framing |
| `choice_event` ✚ | one per offer | options with KT pSuccess, chosen option, moment argmax *bucket* (cheap/costly class only; no state name stored) |
| `item_attempt` (KT) | one per attempt | correct, RT, hints, retry_unprompted, quit |
| `marker_counts` ✚ | one per session × marker | lexBored, lexHard, lexEval, avoidTalk, normTalk, selfDoubt, fatigue counts (counts only) |
| `checkin` ✚ (research consent) | monthly | pictorial enjoy/worry/bored (B1-B3); SRBAI-2 + autonomy items (B4) |

Retention follows MI §7 and VT §4.10 modes. Research tables need the research-consent flag and pseudonymised ids.

### 5.2 Within-session affect transitions (research model on MI's coded transcripts)
A first-order Markov chain over coded moments (from MM2's teacher-coded transcripts, not the filter's own output, to avoid circularity):
```
P(z_{t+1} = j | z_t = i, c) = exp(γ_ij + u_{c,ij}) / Σ_j' exp(γ_ij' + u_{c,ij'}),   u_{c,·} ~ N(0, Σ_u)   (sparse: only named edges get random effects)
```
Estimands: band differences in γ for struggle→flow versus struggle→frustrated; the persistence of boredUnder; and whether Taxila's moves (M.SHRINK, M.CHOICE2) change the next-state distribution. The last uses a micro-randomised design in which the move is randomised among equally eligible moves [U]. MI's online filter keeps its fixed transition matrix. This model only *re-estimates* it, by band, for the next MI version.

### 5.3 Across-session engagement states: mixed hidden Markov model
Latent session-level state z_{c,s} ∈ {1..K}, K chosen by BIC and interpretability (expected K = 4-5) [U]. Candidate interpretations, for analysts only: *routine*, *exploring*, *sporadic*, *lapsing*, *returning*. Names are never stored or shown.
```
Transition (input-output, gap-aware):
  P(z_s = j | z_{s-1} = i, g_s, x_s) = softmax_j( α_ij + β_jᵀ x_s + λ_j · log(1 + g_s) + b_{c,j} ),   b_c ~ N(0, Σ_b)
     g_s = days since previous session; x_s = calendar flags, plan type, policy_version, band
Emissions (conditionally independent given z):
  minutes_s        ~ LogNormal(μ_z, σ_z)
  started_by=child ~ Bernoulli(π_z)           (B1-B2: emission weight shrunk toward band mean)
  own_questions_s  ~ Poisson(minutes_s · ρ_z)
  harder_share_s   ~ Beta-Binomial(offers_s, a_z, b_z)
  end_kind_s       ~ Categorical(κ_z)
  disengaged_share ~ Beta(·)   (from engagement tracing, §4.7)
Fit: EM (Baum–Welch) with child random effects via MCEM or a variational approximation; or Bayesian (Stan, marginalised states).
```
- **Identifiability.** Emission vectors must separate the states. Label switching is fixed by ordering on μ_z.
- **Validation (MH4).** Hold out the last 28 days. The model's predicted P(lapsing) must beat D28-only logistic prediction of next-28-day self-starts and of lapse (ΔAUC ≥ .03) [U].
- **Use.** Conductor planning only: a "lapsing" posterior > .6 → lighter plan, re-anchor offer to the parent (DC), easier first item.

### 5.4 Session regularity as recurrent events (the habit-behaviour model)
Discrete-time, day-level, per child (the at-risk day is every day the child has an active plan):
```
logit P(S_{c,d} = 1) = α_c + f_band(τ_{c,d}) + g(dow_d) + h(calendar_d) + β_H · H_{c,d} + β_P · plan_{c,d}
   τ_{c,d} = days since last session (gap time; piecewise: 1, 2, 3-4, 5-7, 8-14, 15+)
   H_{c,d} = 1 − exp(−k · n^anchor_{c,d})   (cumulative anchored repetitions; k shared by band, Lally-shaped)
   α_c ~ N(μ_α[band], σ_α²)   (frailty: stable proneness to sessions)
Anchor share:  logit P(slot = anchor | S_{c,d}=1) = ξ_c + χ · H_{c,d} + calendar terms,   ξ_c ~ N(μ_ξ, σ_ξ²)
```
- **Estimands.** σ_α² is between-child regularity. β_H tests whether anchored repetition, as distinct from total repetition, predicts future sessions: the habit hypothesis in children. The holiday-recovery curve after a calendar disruption is P(S) by days since school reopened.
- **Censoring.** Plan end, subscription end and account deletion are censoring, not lapse. The continuous-time analogue is an Andersen-Gill or gap-time (PWP) Cox model with gamma frailty [U: standard survival methods].

### 5.5 Habit automaticity from behaviour (research model)
Two estimators, both research-only:
1. **Lally curve on behaviour.** Fit A_c(t) = a_c − b_c·e^{−c_c t} to the 7-day rolling session rate, with t95 = ln(20)/c_c. This is the self-report method transplanted to logs, and §5.8 shows it fails per child.
2. **Context predictability (after Buyalskaya 2023) [V].** For each child and a sliding 28-day window w, fit a penalised logistic model predicting S_{c,d} from context only (day of week, anchor-slot availability, school/holiday flag, lag-1 and lag-7 sessions). The habit curve is the window-wise cross-validated AUC:
```
π_c(w) = AUC_cv( S_{c,d∈w} ~ LASSO(context_{c,d}) )
habit time_c = first w at which π_c(w) is within .02 of its plateau (fit π_c(w) = p∞ − (p∞ − p0)·e^{−r·w})
population estimand: distribution of habit time by band and by anchor type (routine-based vs time-based; Keller 2021 via DC)
```
Per-child habit time is reported to no one until its split-half reliability is shown to be ≥ .7 (MH-D2). It *is* publishable at population level (§8 H1).

### 5.6 Slow trajectories and reciprocal effects
- **Growth.** The §4.1 latent growth model, with band-specific priors from Scherrer & Preckel [V].
- **Reciprocal competence ↔ motivation (RI-CLPM, monthly).** Let X = monthly mastery gain (KT, delayed-verified; LOT), Y = self-start share or challenge-seeking index:
```
X_{c,m} = μ_X,m + κ_X,c + x*_{c,m},     Y_{c,m} = μ_Y,m + κ_Y,c + y*_{c,m}            (κ: stable random intercepts)
x*_{c,m} = a_XX · x*_{c,m-1} + a_XY · y*_{c,m-1} + e_X
y*_{c,m} = a_YY · y*_{c,m-1} + a_YX · x*_{c,m-1} + e_Y                         (within-child cross-lags)
```
The prediction from Talsma 2018 and Pekrun 2017 is a_YX > a_XY (competence → motivation stronger). Taxila tests it *within child* (Hamaker 2015) [V]. With far more occasions per child, DSEM (Hamaker 2018) [V] estimates random cross-lags, which says *for whom* competence drives return.

### 5.7 Lapse prediction (discrete-time hazard, weekly)
```
logit h_c(w) = α(w_since_start) + βᵀ z_{c,w-1} + band + calendar_w,      h = P(lapse begins in week w | active until w)
z_{c,w-1}: last-week D7, D28 trend, self-start share, HMM state posterior, mean pSuccess (too hard?), wheel-spin flags,
           early-exit share, plan adherence, parent-report recency, policy_version
```
**Evaluation rules** (the Gardner & Brooks checklist made binding):
1. Temporal split only: train on cohorts that started before date T, test after it.
2. Features computed strictly from data before the prediction week.
3. No filtering to "active" users.
4. Report AUC *by week since start*, calibration slope and intercept, and Brier score.
5. Subgroup calibration by band, language and device class.
6. No individual explanations are shown to staff as causes, given explainer disagreement (Swamy 2022) [V].

**Allowed actions** are system changes only (MH-D7). The causal value of the model is tested in MH9: randomise the action, not the prediction.

### 5.8 How much can logs tell? (*computed* this session)
`motivation-habits-habitsim.py` simulates 400 children per run under a Lally-shaped, repetition-driven habit model:
- day-level noise
- a lower weekend propensity
- a 10-day festival disruption
- per-child variation in baseline propensity, habit gain and anchor consistency.

All parameters are [U].

| observation span | children reaching 95% habit strength within span | median fit R² of Lally curve on behaviour | r(log t̂95, log t95) all | r, fits with R² ≥ .5 | D28 test-retest r | anchor-share test-retest r |
|---|---|---|---|---|---|---|
| 12 weeks | 16% | 0.03 | 0.26 | n/a (too few) | 0.83 | 0.61 |
| 24 weeks | 52% | 0.16 | 0.42 | 0.70 | 0.88 | 0.58 |
| 36 weeks | 73% | 0.21 | 0.42 | 0.51 | 0.85 | 0.69 |

**Reading.**
1. Binary daily behaviour is too noisy for per-child formation curves. Even Lally, with *daily self-reported automaticity*, got good fits for under half [V]. With behaviour alone, almost no child does.
2. The correlations in the table are conditional on the child reaching 95% within the span (selection), so they are optimistic.
3. Simple counts are reliable enough to report: D28 at 0.83-0.88, far above the 0.7 bar. Anchor share is moderate, so it is reported as a count with its window and never as a trend from two blocks.
4. Habit is a *population* finding for Taxila, a *count* for a parent, and a *curve* for nobody.

---

## 6. What can be said to parents

**The contract.** It extends LOT §7, CD §8.2 and MI §5. Every motivational or habit statement must:
1. describe behaviour, with numerator, denominator and window
2. separate who started sessions
3. compare only with the child's own past
4. state what Taxila is doing about it
5. carry at most one home suggestion drawn from evidence (autonomy support, process praise, routine anchoring)
6. pass the banned-wording gate.

Statements of *change* need ≥ 3 windows, or a posterior P(change in the stated direction) ≥ .9 in the §4.1 model.

| construct | allowed statement shape (slots filled from numbers only) | threshold | home suggestion (one) |
|---|---|---|---|
| regularity (M9) | sessions on {n} of last 28 days; {k} at the time you chose; (was {n'} in {month}) | always (D28 reliable) | keep the anchor; a "tiny day" counts (DC3) |
| who started (M1) | {child} started {a} of {n} sessions; you or the plan started {b} | n ≥ 8 | let her choose the topic once a week |
| choice (M1, M3) | given a choice {n} times: harder {h}, a different way {d}, teacher's pick {t} | n ≥ 10 (≥ 20 for any change statement) | ask "which one do you want to try?" rather than assigning |
| own questions (M2) | asked {q} of her own questions; most about {topic} | q ≥ 3 | ask her to teach you what she found out |
| persistence (M4) | tried again on her own after {r} of {e} mistakes | e ≥ 10 | praise how she got unstuck, not that she is smart |
| return after a break (M9) | after {break}, back to the routine in {d} days | a declared break occurred | a fresh-start day after holidays (Dai 2014 [S]) |
| sustained exam worry markers (M6) | factual counts (as in §4.5), plus Taxila's response | §7 threshold | parent guidance on exam talk; safeguarding route if indicated |
| compulsion markers (M12) | facts: {k} sessions after the bedtime you set; sessions getting longer | §7 thresholds | adjust the bedtime cap in Parent corner |

**Banned at every layer** (English, Hindi, Hinglish; extends MI, VT §4.9, LOT §7):
- motive and trait words: lazy / *kaamchor* / *aalsi*, unmotivated, not interested in {subject}, *padhai mein mann nahi lagta*
- mindset labels: fixed/growth mindset
- confidence and emotion labels: low confidence, low self-esteem, anxious child, frustrated child, bored child
- usage judgements: addicted, "the habit is formed", habit score, streak, days missed, "{child} skipped"
- any risk or dropout score
- any comparison with other children or siblings
- predictions of future motivation.

**Child-facing.** None of this is shown to the child. The child sees the work: progress maps (MWR), the open thread (MI §5), and capability statements.

---

## 7. Wellbeing guardrails: measuring too much as well as too little

A product that is good at building habits in children can harm them. The relation between digital time and adolescent well-being is curvilinear, and moderate use is not harmful (Przybylski & Weinstein 2017) [V]. The harm sits at the extremes and in what use displaces: sleep, play, family (DC §1.4).

| marker | definition | alert threshold [U] | action |
|---|---|---|---|
| after-bedtime use | session start later than the parent-set bedtime − 30 min (DC7) | ≥ 2 in 14 days | parent note (facts); Conductor refuses new teaching in the window (DC7) |
| session-length creep | 28-day median actual_min rising > 50% with no rise in delayed mastery gain | 2 consecutive windows | parent note; Conductor reverts plan length |
| cap-override pleas | child requests to continue past the cap | ≥ 3 sessions in 14 days | teacher closes warmly (MI M.CLOSE-OPEN); parent note |
| distress about missing | lexicon on missing or losing ("chhoot gaya", "miss ho gaya toh") | ≥ 2 in 14 days | teacher normalises the gap (no-wilting rule, MWR); review whether any UI implies loss |
| sustained evaluation + avoidance talk | avoidTalk + lexEval rate > child's own 75th percentile for 3 of 4 weeks | as stated | M.PRIVATE default; parent guidance; safeguarding route if indicated |
| weekend displacement | share of sessions on Sundays or family days rising with no parent plan change | rising over 2 windows | report only; this is the GitHub-streak pattern (Moldon 2021) [V] |

**Rule.** Any experiment whose arm raises 28-day return *and* raises any marker beyond threshold fails, whatever its learning effect (MH-D10). This mirrors LOT LT10.

---

## 8. Research programme: what could be published

All studies need preregistration, ethics review with a child-safeguarding advisor, research-consent scope (separate from service consent), and pseudonymised data. Every child gets the evidence-based core in every arm (LS §8.4). Negative results are published and change the product.

| id | hypothesis / estimand | design | analysis | contribution |
|---|---|---|---|---|
| H1 | Learning-habit formation in children: the distribution of context-predictability habit time by band and anchor type; routine-based vs time-based anchors | natural data + randomised anchor-type suggestion at onboarding (DC1) | §5.5 π_c(w) curves; hierarchical plateau model | first behavioural habit-formation curves for children's learning, extending Lally and Buyalskaya to ages 6-15 |
| H2 | Anchored repetition, not total repetition, predicts future sessions (β_H > 0, net of α_c) | natural variation + anchor-slot randomisation within the parent's allowed windows | §5.4 | test of habit-as-context in children |
| H3 | Age-band trajectories of self-start share, challenge-seeking and own questions from 6 to 15, with measurement invariance tested | accelerated longitudinal (all bands enrol at once) | §4.1 growth model; invariance across bands | the first intensive-longitudinal motivation trajectories in Indian children; replication of the Scherrer & Preckel decline outside Europe/US |
| H4 | Within-child competence → motivation cross-lag exceeds motivation → competence | RI-CLPM / DSEM, monthly | §5.6 | within-person test of Talsma and Pekrun reciprocal effects at very high occasion counts |
| H5 | Affect-transition structure by age band (struggle→flow vs →frustration; boredom persistence) | MM2 coded transcripts, ≥ 300 children per band | §5.2, with self-transition correction | first developmental account of D'Mello-Graesser dynamics, ages 6-15 |
| H6 | Habit discontinuity: re-anchoring offers within 3 months of a context change (new school year, new tuition) beat the same offers at other times | micro-randomised timing of re-anchor offers | §5.4 hazard after offer | children's replication of Verplanken & Roy |
| H7 | Challenge-seeking responds to process praise versus capability statements (band C) | within-child micro-RCT of feedback type (MI MM9) | §4.3 α_c shift | behavioural test of mindset-adjacent claims in Indian adolescents, after Li & Bates |
| H8 | Lapse-response interventions (lighter plan, re-anchor, easier entry) raise 28-day self-starts without raising compulsion markers | randomise the action among predicted-lapsing children | ITT on self-starts; marker non-inferiority | evidence that prediction plus a humane action helps, not just prediction |

---

## 9. Measurements this design depends on

| id | question | method | decides | bar |
|---|---|---|---|---|
| MH1 | Is `started_by` recorded correctly on shared phones? | parent diary for 2 weeks (n = 60 families) vs logs | MH-D4 usability | agreement ≥ 90% |
| MH2 | D28 and anchor-share reliability in real data | split-half and consecutive-window test-retest | §6 thresholds | D28 ≥ .8; anchor ≥ .6 (else counts only, no change claims) |
| MH3 | Context-predictability habit time: split-half reliability per child | odd/even days, §5.5 | MH-D2 reversal | ≥ .7 to become reportable; else population only |
| MH4 | Across-session HMM adds predictive value | temporal holdout, ΔAUC vs D28-only | MH-D5 | ΔAUC ≥ .03 |
| MH5 | Calibration measure validity (B3-B4) | κ_c vs a brief validated self-efficacy scale; ψ_c vs later accuracy | §4.4 reporting | r ≥ .4 |
| MH6 | Convergent validity of behavioural motivation indices | S1-S4, α_c vs child self-report (B3-B4) and blinded parent/teacher ratings (B1-B2) | MH-D1 construct-level wording | r ≥ .4 |
| MH7 | Indian norms: meaning of teacher's pick, parent-started sessions, introjection markers | mixed methods: interviews (n ≈ 40 families) + logs | interpretation rules §4.1 | qualitative report before any parent text ships |
| MH8 | Lapse model calibration and fairness | temporal split; subgroup calibration | §5.7 use | calibration slope .8-1.2 in every band and language |
| MH9 | Lapse actions work (H8) | randomise action | MH-D7 | self-starts ↑, markers not ↑ |
| MH10 | Do motivation and habit reports change parent behaviour, child stress or autonomy? | randomise report variants (counts only vs counts + suggestions) | whether §6 slices ship | no rise in parent-pressure items or child avoidance markers |

---

## 10. Invariants (eval-gated; "if your change trips them, your change is wrong")

| id | predicate | method |
|---|---|---|
| MHI1 | No parent- or child-facing string contains a §6 banned term, a risk score or a cross-child comparison | lexicon gate, Hindi + English + Roman Hindi |
| MHI2 | Every motivation/habit statement has numerator, denominator, window and `started_by` split in its backing record | structural check on report records |
| MHI3 | No model in this file uses clock time-of-day or infers sleep; regularity uses the anchor-slot index only | feature audit (= LOT invariant 4) |
| MHI4 | No moment state, HMM state name or lapse probability is stored in any parent- or child-visible table | schema audit |
| MHI5 | Lapse predictions can trigger only the allowed system actions (§5.7); never a child notification or loss framing | action-log audit (= MI13, DC8) |
| MHI6 | Every retention experiment's analysis plan lists the §7 compulsion markers as primary safety outcomes | preregistration template check |
| MHI7 | Change statements need ≥ 3 windows or posterior ≥ .9 | report generator unit test |
| MHI8 | No streak representation: no consecutive-day counts, no calendar grid of missed days, no "don't break" copy | UI string and component audit (= MI2, MWR) |

---

## 11. Open questions

1. **Family habit versus child habit.** For 6-9-year-olds, is the right unit the household routine? Should the habit model include the parent's app-open events as a separate cue channel? [U]
2. **Shared devices.** Siblings on one phone corrupt `started_by` and regularity. Does voice profile or login-at-start solve it without friction (MH1)?
3. **Tuition and school calendars.** Board-specific exam calendars and festival dates by state are needed as calendar covariates. The owner is the Conductor (DC §7).
4. **Self-report in B1-B2.** Is any child self-report valid enough for research at ages 6-8, or must criteria come from adults (MH6)?
5. **What is a "good" regularity for a 6-year-old?** There is no normative data. Taxila should not imply one until H3 provides it, and even then only as context, never as a target.
6. **Novelty decay.** Weeks 1-3 inflate every engagement indicator [U; MI §1.7]. Should models start the clock at week 4, or carry a novelty term?
7. **Exam-season inversion.** Exam windows may raise sessions (parent-driven) while lowering autonomous indicators. Report them separately?

---

## 12. Proposed `context/` entries (for the main loop to merge)

- **decision** `motivation-reported-as-behaviour` (MH-D1), `regularity-before-habit` (MH-D2), `decline-is-the-prior` (MH-D3), `started-by-first-class` (MH-D4), `two-timescale-engagement-models` (MH-D5), `lapse-prediction-system-actions-only` (MH-D7), `no-mindset-construct` (MH-D8), `efficacy-via-mastery-and-calibration` (MH-D9), `compulsion-markers-primary-safety-outcome` (MH-D10). Each carries its reversal condition from §0.
- **measurement** `habit-identifiability-sim-2026-10-02`: n = 400 simulated children per span; method `motivation-habits-habitsim.py`. D28 test-retest 0.83-0.88. Lally-curve per-child r(t̂95, t95) 0.26-0.42. Median fit R² 0.03-0.21 over 12-36 weeks. Assumptions [U].
- **rejected** `per-child-habit-formation-time`: not estimable from behaviour logs (sim above; Lally fit good for < half even with self-report). `growth-mindset-module-as-lever`: best-quality d = 0.02 (Macnamara & Burgoyne 2023); nulls in Chinese children (Li & Bates 2019) and at scale (Ganimian 2020). `classic-CLPM-for-reciprocal-claims`: confounds stable differences with within-person effects (Hamaker 2015). `dropout-risk-score-to-parents`: no action value, labelling risk. `streak-counters`: re-affirmed with Moldon 2021 (supersedes nothing; adds evidence to MI's `streaks-and-tokens`).

---

## 13. References

**Motivation development and SDT.**
- Scherrer V, Preckel F 2019, *Rev Ed Res* 89:211, doi:10.3102/0034654318819127 [V]
- Gottfried AE, Fleming JS, Gottfried AW 2001, *J Ed Psych* 93:3, doi:10.1037/0022-0663.93.1.3, ERIC EJ638721 [V]
- Gottfried AE, Fleming JS, Gottfried AW 1998, *Child Dev*, doi:10.2307/1132277, PMID 9839427 [V]
- Gnambs T, Hanfstingl B 2016, *Educ Psychol* 36, doi:10.1080/01443410.2015.1113236 [S title]
- Lepper MR, Corpus JH, Iyengar SS 2005 [V, MI]
- Howard JL et al. 2021 [V, MI]
- Bureau JS et al. 2022 [V, MI]
- Deci EL, Koestner R, Ryan RM 1999 [V, MI]
- Iyengar SS, Lepper MR 1999 [V, MI]
- Deb S et al. 2014 [V, MI]

**Interest.**
- Hidi S, Renninger KA 2006 [V, MI]
- Renninger KA, Hidi S 2016, *The Power of Interest for Motivation and Engagement*, Routledge, doi:10.4324/9781315771045 [S title]
- Harackiewicz JM, Smith JL, Priniski SJ 2016, *Policy Insights Behav Brain Sci* 3:220, doi:10.1177/2372732216655542 [V]
- Frenzel AC, Pekrun R, Dicke A-L, Goetz T 2012, *Dev Psych* 48:1069, doi:10.1037/a0026895, PMID 22288365 [V]
- Frenzel AC, Goetz T, Pekrun R, Watt HMG 2010, *J Res Adolesc*, doi:10.1111/j.1532-7795.2010.00645.x [S title]
- Fandakova Y, Gruber MJ 2021 [V, MI]

**Mindset and praise.**
- Sisk VF, Burgoyne AP, Sun J, Butler JL, Macnamara BN 2018, *Psych Sci* 29:549, doi:10.1177/0956797617739704 [V]
- Macnamara BN, Burgoyne AP 2023, *Psych Bull*, doi:10.1037/bul0000352, PMID 36326645 [V]
- Burnette JL et al. 2023, *Psych Bull*, doi:10.1037/bul0000368, PMID 36227318 [V]
- Yeager DS et al. 2019, *Nature* 573:364, doi:10.1038/s41586-019-1466-y, PMC6786290 [V]
- Rege M et al. 2021, *Am Psychol*, doi:10.1037/amp0000647, PMC8113339 [V]
- Li Y, Bates TC 2019, *JEP: General*, doi:10.1037/xge0000669 [V]
- Ganimian AJ 2020, *Educ Eval Policy Anal*, doi:10.3102/0162373720938041 [V]
- Lichand G et al. 2025, preprint, doi:10.21203/rs.3.rs-6683253/v1 [V preprint]
- Barnett MK, Macnamara BN 2023, *J Intell*, PMC10299668 [V]
- Gunderson EA et al. 2013, *Child Dev*, doi:10.1111/cdev.12064 [V]
- Bennett-Pierre G et al. 2024, *J Exp Child Psychol*, doi:10.1016/j.jecp.2024.106032 [V]
- Bong M 2009 [V, MI]; Barker GP, Graham S 1987 [V, MI]

**Self-efficacy and self-concept.**
- Bandura A 1977, *Psych Rev* 84:191, doi:10.1037/0033-295x.84.2.191 [S]
- Usher EL, Pajares F 2008, *Rev Ed Res* 78:751, doi:10.3102/0034654308321456 [V]
- Talsma K, Schüz B, Schwarzer R, Norris K 2018, *Learn Individ Differ* 61:136, doi:10.1016/j.lindif.2017.11.015 [V]
- Ahn HS, Usher EL, Butz A, Bong M 2016, *BJEP*, doi:10.1111/bjep.12093 [V]
- Wu H, Guo Y, Yang Y, Zhao L, Guo C 2021, *Ed Psych Rev*, doi:10.1007/s10648-021-09600-1 [S title]
- Stipek D, Mac Iver D 1989, *Child Dev* 60:521, doi:10.2307/1130719 [S title]
- Schunk DH, Hanson AR 1985 [V, MI]

**Academic emotions.**
- Pekrun R 2006, *Ed Psych Rev* 18:315, doi:10.1007/s10648-006-9029-9, ERIC EJ757715 [V]
- Pekrun R, Lichtenfeld S, Marsh HW, Murayama K, Goetz T 2017, *Child Dev* 88:1653, doi:10.1111/cdev.12704 [V]
- Camacho-Morles J et al. 2021, *Ed Psych Rev*, doi:10.1007/s10648-020-09585-3, ERIC EJ1310152 [V]
- Namkung JM, Peng P, Lin X 2019, *Rev Ed Res*, doi:10.3102/0034654319843494 [V]
- Lichtenfeld S et al. 2012, AEQ-ES, doi:10.1037/t12242-000 [S title]
- Tze VMC et al. 2016 [V, MI]; Tze V, Parker P, Sukovieff A 2022, ERIC EJ1326667 [V]
- Schwartze MM et al. 2024 [V, MI]

**Affect dynamics and engagement.**
- D'Mello S, Graesser A 2012, *Learn Instr* 22:145, ERIC EJ950444 [V]
- Baker RSJd, D'Mello SK, Rodrigo MMT, Graesser AC 2010, *IJHCS* 68:223, doi:10.1016/j.ijhcs.2009.12.003 [S tldr]
- Karumbaiah S, Baker RS, Ocumpaugh J 2019, AIED, doi:10.1007/978-3-030-23204-7_15 [S title]
- Pardos ZA et al. 2014 [V, MI]
- Fredricks JA, Blumenfeld PC, Paris AH 2004, *Rev Ed Res* 74:59, doi:10.3102/00346543074001059 [V]
- Wang M-T, Eccles JS 2011/2012, *J Res Adolesc*, doi:10.1111/j.1532-7795.2011.00753.x [V]
- Beck JE 2005, "Engagement tracing", AIED [U]
- Wan H, Beck JB 2015 [V, MI]
- Park S 2023, *TechTrends*, ERIC EJ1377740 [V]
- Flores RM, Rodrigo MMT 2020, ERIC EJ1262069 [V]

**Habits.**
- Lally P, van Jaarsveld CHM, Potts HWW, Wardle J 2010 (online 2009), *Eur J Soc Psychol* 40:998, doi:10.1002/ejsp.674 [V abstract; 66-day median S]
- Singh B, Murphy A, Maher C, Smith AE 2024, *Healthcare* 12:2488, PMC11641623 [V]
- Buyalskaya A, Ho H, Milkman KL, Li X, Duckworth AL, Camerer C 2023, *PNAS* 120:e2216115120, PMC10151500 [V]
- Gardner B, Abraham C, Lally P, de Bruijn G-J 2012, *IJBNPA* 9:102, PMC3552971 [V]
- Gardner B, Rebar AL, Lally P 2022, *Cogent Psychol*, doi:10.1080/23311908.2022.2041277 [S title]
- Wood W, Neal DT 2007, *Psych Rev* 114:843, doi:10.1037/0033-295x.114.4.843 [S]
- Wood W, Rünger D 2016, *Annu Rev Psychol* 67:289, doi:10.1146/annurev-psych-122414-033417 [S]
- Wood W, Quinn JM, Kashy DA 2002, *JPSP*, doi:10.1037/0022-3514.83.6.1281 [S title]
- Neal DT, Wood W, Labrecque JS, Lally P 2012, *JESP*, doi:10.1016/j.jesp.2011.10.011 [S title]
- Galla BM, Duckworth AL 2015, *JPSP* 109:508, PMC4731333 [V]
- Fiorella L 2020, *Ed Psych Rev*, ERIC EJ1263167 [V]
- Verplanken B, Roy D 2016, *J Environ Psychol* 45:127, doi:10.1016/j.jenvp.2015.11.008 [V]
- Stawarz K, Cox AL, Blandford A 2015, CHI, doi:10.1145/2702123.2702230 [S tldr]
- Dai H, Milkman KL, Riis J 2014, *Mgmt Sci*, doi:10.1287/mnsc.2014.1901 [S]
- Rebar AL et al. 2022, PMC9615635 [V]

**Streaks, rewards, gamification, dark patterns.**
- Silverman J, Barasch A 2022, *J Consum Res*, doi:10.1093/jcr/ucac029 [V]
- Moldon L, Strohmaier M, Wachs J 2021, ICSE, doi:10.1109/icse43902.2021.00058; arXiv:2006.02371 [V]
- Kivetz R, Urminsky O, Zheng Y 2006, *J Mark Res* 43:39, doi:10.1509/jmkr.43.1.39 [V]
- Sailer M, Homner L 2020, *Ed Psych Rev*, ERIC EJ1245270 [V]
- Hanus MD, Fox J 2015, *Comput Educ* 80:152, doi:10.1016/j.compedu.2014.08.019 [S tldr]
- Radesky J, Hiniker A, McLaren C et al. 2022, *JAMA Netw Open*, doi:10.1001/jamanetworkopen.2022.17641 [V]
- Przybylski AK, Weinstein N 2017, *Psych Sci*, doi:10.1177/0956797616678438 [V]

**Dropout, attrition and longitudinal methods.**
- Eysenbach G 2005, *J Med Internet Res* 7:e11, PMC1550631 [V]
- Kloft M, Stiehler F, Zheng Z, Pinkwart N 2014, EMNLP MOOC workshop, doi:10.3115/v1/w14-4111 [V]
- Gardner J, Brooks C 2018, *UMUAI* 28:127, doi:10.1007/s11257-018-9203-z; arXiv:1711.06349 [V]
- Botelho AF et al. 2019, *IEEE TLT*, doi:10.1109/tlt.2019.2912162 [V]
- Swamy V et al. 2022, EDM, ERIC ED624070 [V]
- Coleman SL 2019, ERIC ED609501 [V]
- Martínez-Carrascal JA et al. 2023, *IRRODL*, ERIC EJ1380308 [V]
- Hamaker EL, Kuiper RM, Grasman RPPP 2015, *Psych Methods* 20:102, doi:10.1037/a0038889 [V]
- Hamaker EL, Asparouhov T, Brose A, Schmiedek F, Muthén B 2018, *Multivar Behav Res*, doi:10.1080/00273171.2018.1446819 [V]
- Boroujeni MS et al. 2016, EC-TEL, doi:10.1007/978-3-319-45153-4_21 [S tldr]
- Tissenbaum M et al. 2016 (HMM, game telemetry), ERIC ED592698 [V]
- Sharma P et al. 2024 (HMM, SRL states), ERIC ED675539 [V]
- Andersen-Gill / PWP recurrent-event models, gamma frailty [U: standard methods]

---

## Methodologist review

**Reviewer stance.** Adversarial review by a developmental psychologist and psychometrician, 2026-10-02. Scope: overclaims, constructs that logs cannot validly measure, reliability, developmental accuracy, ethically risky inferences, and citation fidelity.

**How the review checked things.**
- Key abstracts were re-fetched this session from OpenAlex, Semantic Scholar and Europe PMC. Items re-checked: Scherrer & Preckel 2019, Frenzel 2012, Lally 2010, Talsma 2018, Camacho-Morles 2021 (full author manuscript), Li & Bates 2019, Bennett-Pierre 2024, Buyalskaya 2023, Radesky 2022, Singh 2024, Macnamara & Burgoyne 2023, Burnette 2023, Moldon 2021, Silverman & Barasch 2022, Rege 2021, Galla & Duckworth 2015, Verplanken & Roy 2016, Wang & Eccles 2012, Ahn 2016, Namkung 2019, Pekrun 2017, Gottfried 2001 and Przybylski & Weinstein 2017.
- `motivation-habits-habitsim.py` was re-run. It reproduces the §5.8 table exactly.
- One extra computation was run on the same simulator (N = 2,000, 36 weeks). It is quoted as *computed-R*.

**Overall verdict.** The architecture is sound and unusually careful: behaviour not traits, `started_by`, per-opportunity indicators, no streaks, RI-CLPM instead of CLPM, and compulsion markers as outcomes. The defects sit in four places:
- Four citations are misread in ways that change a design claim (R1-R4).
- Simulated reliability is presented as if it were empirical, and per-child *change* statements have no noise criterion (R5-R7).
- Two parent-facing statements breach the child's confidence (R8-R9).
- The publication programme ignores informative dropout and the tutor's own adaptive policy as confounders (R12-R13).

None of these needs a redesign. All of them need edits before any parent text ships or any paper is drafted.

### A. Citation fidelity (verified this session)

**R1. Talsma 2018 is cited without its age moderator, and the moderator is the finding that matters for Taxila. [V]**
- Abstract: "reciprocity holds for adults, but not for children (in whom performance uniquely impacts subsequent self-efficacy beliefs, but not the reverse)". Pooled k = 11, N = 2,688.
- The β = .205 vs .071 contrast is therefore an all-ages pooled estimate.
- Fix MH-D9, §1.3 and §5.6/H4. In children the prior expectation is a_XY ≈ 0 (motivation → competence), not merely a_XY < a_YX.
- This strengthens MH-D9 (grow efficacy through mastery). It also makes H4 a sharper and more falsifiable test.
- Note too that Talsma concerns *self-efficacy*. Using it to predict cross-lags for *self-start share* or *challenge-seeking* (§5.6) is a construct substitution. State it as an analogy [U], not a prediction derived from Talsma.

**R2. Scherrer & Preckel 2019 contradicts two statements in this file. [V]**
- (a) Performance-*approach* goals declined significantly, alongside intrinsic motivation, maths/language self-concept and mastery goals. §3.5 and §4.3 say "performance goals rise from grade 5 (Bong 2009)", and §4.3 builds the challenge-seeking dip on that rise. Mark the "rise" as [U], or drop it. The meta-analytic mean-level evidence points the other way. Bong 2009 concerns goal *differentiation* with age, not level increases [S, reviewer recall].
- (b) "School stage and transition to middle school or high school were not significantly associated with the change." The §4.1 prior gives B1-B2 a slope of ≈ 0 ± 0.1 and B3-B4 a slope of −0.065 SD/yr. That band split is *not* supported by the source it cites. Either use one prior for all bands, or label the split [U]. (MH-D3 already reports correctly that transitions did not moderate the decline, so the file is internally inconsistent.)

**R3. Li & Bates 2019's p = .049 is a performance effect, not persistence. [V]**
- Abstract: the manipulation "was associated with performance on a moderate difficulty postfailure test (p = .049), but not with any of the 8 motivation and attribution measures" (mean p = .48). Persistence-type measures were among those eight.
- §4.3's "persisting after failure ... which Li & Bates partly replicated (p = .049)" misreads it. Li & Bates *failed* to replicate the persistence outcome.
- Add that Study 2 found one significant effect *opposite* to prediction (p = .007).

**R4. Bennett-Pierre 2024's d = .61 is exploratory. [V]**
- The preregistered primary analyses found no person-versus-process difference.
- "Process praise > control, d = .61" came from *exploratory* analyses, N = 150, a US sample (79% White). §1.8 and §4.3 must say "exploratory".
- The home tip "praise how she got unstuck, *not that she is smart*" (§6 table) asserts a contrast that the most recent preregistered test did not find. Rewrite it as strategy talk, which needs no contested contrast: "ask her how she got unstuck".

**R5. Smaller citation corrections.**

| where | file says | source says | fix |
|---|---|---|---|
| MH-D3, §4.1 | "Intrinsic motivation fell from grade 3 to 8 (Lepper 2005)", placed beside 107 *longitudinal* studies | Lepper, Corpus & Iyengar 2005 is a *cross-sectional* age comparison (title: "age differences"), so cohort and age are confounded [S, reviewer] | say "lower in older grades (cross-sectional)" |
| §1.5, §4.8 | Singh 2024: "medians 59-66 days, means 106-154, range 4-335 (20 studies)" | only **4 of the 20** studies reported a time to habit; 11/20 were high risk of bias; ages 21.5-73.5 [V] | "4 studies reported times"; keep "all adults" |
| §1.5, §4.8 | Lally: "18-254 days to 95% of asymptote" presented as observed | observation lasted **84 days**; every t95 > 84 is an extrapolation of the fitted curve. The model fitted 62 of 82, and 39 fitted well [V] | add "(beyond 84 days, extrapolated)" |
| MH-D1, §1.2 | interest becomes "cognitive by grade 9" (N = 3,193) | N = 3,193 shows *non-invariance*. The affect→cognitive shift is from Study 2: interviews with N = 70 about adolescents' *concept* of interest [V] | attribute the meaning shift to the N = 70 interview study |
| §1.4 | "Frustration is not the enemy" | Camacho-Morles: frustration ρ ≈ −.02 rests on **k = 9 samples, N = 1,418**, against 57 for enjoyment and 66 for boredom [V, full text] | "evidence on frustration is thin and near zero" |
| §1.4, §4.5 | relations "stronger in secondary" | true for *enjoyment and anger*; secondary is stronger than both primary *and* college [V] | qualify by emotion |
| §1.5, §4.8 | Buyalskaya: "predictable individuals were less responsive to incentives" | "a ... random-assignment intervention to increase gym attendance had a larger effect on gymgoers who were less predictably context-sensitive" (a multi-component megastudy, not incentives alone). Insensitivity to reward devaluation was *not tested* [V] | "less responsive to a gym-attendance intervention"; keep the devaluation point as "consistent with" |
| §4.8 | "Self-control's benefits run substantially *through* habits" | Galla & Duckworth: statistical mediation, mostly cross-sectional, mixed adult/college/teen samples [V] | "statistically mediated by habit"; drop causal "through" |
| MH-D6, §4.9 | streak evidence "re-affirmed" for children | Moldon (adult developers) and Silverman & Barasch (adult consumers) show that streaks *steer* behaviour. Neither shows *harm to children* [V] | keep MH-D6 as an ethical floor, and say that the child-harm link is [U] |
| MH-D10, §7 | the curvilinear well-being link as a general basis | 15-year-olds in England, self-reported *recreational* screen time [V]; nothing about 6-9-year-olds or educational use | add the population qualifier |
| §4.9 | Duolingo 3.6× is "[V there]" | company blog statistics, not peer reviewed | re-tag [S, industry] |
| §4.4 | "Young children's resolution is near zero [S]" | the sibling file `metacognition-srl.md` verified that 6-year-olds' confidence discriminates (Destan & Roebers 2015 [V]) and that 3-year-olds already discriminate (Lyons & Ghetti 2011 [V]). The real problem is *reliability*: ≥ 120 bets for resolution (MS-D3) | replace with "present but unreliable below ~120 ratings". Adopt MS-D3's counts (offset ≥ 30, resolution ≥ 120) here. At ≤ 3 ratings per session that is 10 and 40+ sessions |
| MH-D8 | "the robust behavioural signature is challenge-seeking (Rege 2021)" | one proponent-authored two-country paper, an adolescent sample, and an effect conditional on school policy [V] | "a replicated (2 samples) behavioural signature" |

### B. Reliability and the simulation

**R6. Simulated reliability is presented as empirical.**
- MH-D2 says D28 "has test-retest r = 0.83-0.88 from logs alone". §2 prints it as the per-child reliability of M9.
- It is a property of the *assumed* generative model: between-child baseline SD of 0.7 logit plus a gamma-distributed habit lift, against *iid* day noise (N(0, 0.6)) with no autocorrelation.
- Real day noise clusters (illness weeks, travel, exam fortnights, a sibling's phone). Clustering lowers 28-day-sum reliability. Real between-child variance is unknown.
- Fix: write "0.83-0.88 *in simulation under assumed variance*; real value = MH2" everywhere it appears (MH-D2, §2 M9, §5.8 reading 3, §12).

**R7. A test-retest r is not a per-child precision. Change statements about D28 currently have no noise floor. (*computed-R*)**
- In the file's own simulator, look at children whose habit strength changed by < .01 between the last two 28-day blocks (54%).
- Their block-to-block D28 difference has SD 3.1 days. 38% of them "change" by ≥ 3 days, and the 95% band is ±6 days.
- This is the optimistic iid model; real noise is larger.
- The §6 regularity row ("sessions on {n} of last 28 days ... (was {n'} in {month})", threshold "always") would therefore print noise as change in a large share of reports.
- Fix:
  - A comparison clause appears only when |n − n'| ≥ 2·SEM_diff. That is ≈ 7 days under the simulation, and is to be re-estimated from MH2.
  - Otherwise print the current count alone.
  - The same logic applies to every proportion in §6. A "harder" share at n = 20 has SE ≈ .11, so a two-window difference needs ≳ .30 to be stated.

**R8. The change rule is insufficient, and it ignores multiplicity.**
- "≥ 3 windows *or* posterior ≥ .9" (§6, MHI7) has two weaknesses:
  - Three consecutive windows can drift by chance.
  - A monthly report carries ~8 statement types × several subjects. At P = .9 per statement, false-direction claims will be routine across reports.
- Fix:
  - Require *both* a magnitude floor (≥ 2 SEM, as in R7) *and* posterior ≥ .95 for the stated direction.
  - Allow at most 2 change statements per report, chosen by a pre-declared priority.
  - Run a prior-sensitivity check: the statement must survive a flat-slope prior. This also fixes R10.
  - MHI7 must test all of this.

**R9. The §7 "own 75th percentile for 3 of 4 weeks" alert fires by construction. (computed analytically)**
- By definition, a child exceeds their own 75th percentile in 25% of weeks.
- With independent weeks, P(≥ 3 of 4) = 4(.25)³(.75) + .25⁴ ≈ .051 per 4-week window. Over 12 monthly checks, about **46% of children trigger at least once with no change at all**.
- For low-count children the 75th percentile is 0, so a single marker triggers.
- Fix: add an absolute rate floor (e.g. ≥ k markers per 100 turns, with k set from MM1 precision data), a minimum count, and a false-alarm budget estimated in MH-style replay on real logs before it ships.
- The same audit applies to every [U] threshold in §7.

**R10. MH-D3 lets the prior manufacture a decline that is then reported as the child's.**
- Pooling a sparse-data child's slope toward a *declining* band mean produces "decline" from the prior alone.
- §6 rule 3 ("compare only with the child's own past") forbids exactly that kind of normative content entering a per-child statement.
- There is also a units error: Glass's Δ = −0.108 is in *self-report questionnaire* SD units, while η in §4.1 is a latent *behavioural* factor with arbitrary scale. Using one as a prior for the other assumes the convergent validity that MH6 has not yet shown.
- Fix:
  - Use the decline prior for *population* estimation only.
  - Per-child statements need a data-dominated posterior (the R8 sensitivity check).
  - Re-express the prior as "slope ≤ 0 is plausible", with a weakly informative scale, until MH6 links the units.
  - §1.1's "holding steady is a real achievement" is a normative comparison. Keep it out of parent text (open question 5 already says so).

**R11. Further reliability and estimator problems.**
- **§5.5 context-predictability habit time is not estimable at the stated resolution.**
  - A cross-validated AUC from a LASSO on 28 daily binary outcomes has a sampling SE of roughly .08-.10 (Hanley-McNeil, prevalence ~.5, AUC ~.7) [reviewer computation].
  - A plateau criterion of "within .02" sits far below that SE.
  - Odd/even-day split-halves (MH3) break the lag-1 feature the model relies on.
  - Buyalskaya's estimates pool long histories (gym data over years) and report at population level.
  - Fix: estimate the π(w) curve hierarchically by band only, with windows of ≥ 56 days, and drop MH-D2's per-child reversal condition. It cannot be met.
- **The simulator's docstring is wrong about its own habit speed.**
  - It says the median t95 is "~60-70 days". The run gives medians *among children who reached 95%* of 64, 106 and 129 days at 12, 24 and 36 weeks, and 26% never reach it within 252 days (*computed-R*). The population median is therefore well above 129 days, about 2× Lally's figure.
  - Each table row is also an independently simulated population (one shared RNG), not the same children followed for longer.
  - Fix: correct the docstring, change its "§6.4" pointer to §5.8, and state both facts under the table.
- **The Lally-curve failure is partly built in.**
  - True t95 is defined over *anchored repetitions*, while the estimator fits *calendar-day* session rates through a sigmoid link. Misspecification, as well as noise, produces the failure.
  - The qualitative conclusion (no per-child curve) stands, and §5.8 reading 1 already rests on the stronger argument that Lally had poor fits even with self-report. But do not quote r = .26-.42 as a property of logs. It is a property of this model.
- **Ordinal confidence mapped to {0, .5, 1} (§4.4).**
  - The bias index treats "shayad" as p = .5, which is an arbitrary metric.
  - Goodman-Kruskal γ is unstable and biased with few trials and many ties.
  - Use the ordered-logit κ_c/ψ_c model only, at MS-D3 counts.
- **β_H in §5.4 is not identified observationally.**
  - Cumulative anchored repetitions are a function of past outcomes (state dependence vs heterogeneity). Families who set anchors also differ in organisation. A frailty term handles only a correctly specified time-invariant confounder.
  - "Anchored, *not total*, repetition" needs both terms in the model.
  - The estimand is identified only by the H2 anchor-slot randomisation. Say so, and treat the observational β_H as descriptive.

### C. Construct validity: what the logs can and cannot carry

**R12. The adaptive tutor is a time-varying confounder in every longitudinal model.**
- §3.3 recognises policy dependence but handles it only with `policy_version`.
- The bigger problem sits within child. The Conductor *reacts* to the very indicators it later measures: a lapsing posterior leads to a lighter plan and an easier first item, which changes mastery gain and return.
- In the §5.6 RI-CLPM/DSEM, Y (self-starts) also feeds X (mastery gain) *mechanically* through practice volume. That is dose, not psychology.
- Fix:
  - Define X per unit of practice, or include practice volume as a time-varying covariate.
  - Log every adaptive action as a time-varying treatment.
  - For causal cross-lag claims, use g-methods (marginal structural models / inverse-probability weighting) or the micro-randomised components only.
  - Without this, H4 is not publishable as a test of reciprocal effects.

**R13. Informative dropout biases every band trajectory (H3), and the accelerated design adds cohort non-equivalence.**
- Children whose motivation falls *leave*, so observed trajectories are conditional on retention (MNAR).
- A 13-year-old who joins an AI tutor is not a later version of a 6-year-old who joins. Cohort-equivalence is an assumption, and it is testable only where age cohorts overlap.
- Fix:
  - Fit joint longitudinal-survival (shared-parameter) or pattern-mixture models with sensitivity analysis.
  - Test cohort convergence at the overlapping ages.
  - Report the retained-sample selection on every figure.
- H3 is also not a "replication of Scherrer & Preckel". Their constructs are self-reported; Taxila's are behavioural. Call it "behavioural analogue".

**R14. Indicators confounded with temperament, language and ASR.**
- *Own questions* (M2, §6 "most about {topic}") depends on:
  - talkativeness and behavioural inhibition (VT temperament)
  - deference norms toward a teacher
  - language/register comfort
  - child-speech ASR accuracy, which is worse for younger children, code-switching, and noisy homes.
- Lexicon marker counts (M6, §7) share the ASR problem. The child effect a_{c,e} absorbs ASR quality, so a device or microphone change shows up as an affect change.
- Fix:
  - Report own-question data as *within-child cross-domain contrasts* only (the v_{c,d} model, which already does this), never as levels.
  - Raise "most about {topic}" from q ≥ 3 (2 of 3 qualifies) to the §4.2 contrast rule.
  - Add `asr_confidence` and `device_id` as covariates or break points for every lexicon-derived rate.
- RT-based engagement tracing (§4.7) in a voice-first product conflates disengagement with speech-onset latency, ASR endpointing and reading speed. Thresholds must be per child and per modality, and validated against coded transcripts before they down-weight KT evidence. The effort-moderated IRT literature (Wise & DeMars 2006) [S] is the closer validated model.
- **Challenge-seeking α_c** has its own confounds:
  - The child's ability: "harder" is relative.
  - The child sees a label, not KT pSuccess, so the ≥ .15 contrast must be one the child can perceive, which needs checking.
  - It overlaps with performance-approach motives ("show the parent").

**R15. Reports change the behaviour they report (reactivity).**
- Once "chose the harder option 6 of 14" or "tried again after 11 of 18 mistakes" reaches a parent in an exam-pressure household, the parent can coach the child to pick harder and to retry. The index then measures parental instruction.
- MH10 tests effects on parents, but no plan protects *measurement validity*.
- Fix:
  - Keep at least one research-only indicator family that is never reported.
  - Estimate the change in each reported indicator at first report exposure (a regression discontinuity at the first report).
  - Treat post-exposure changes as uninterpretable for motivation claims.

**R16. Convergent-validity bars are too low to license individual-level construct wording.**
- MH-D1/MH6 and MH5 use r ≥ .4, which is 16% shared variance.
- At that level a construct statement about an *individual* child is wrong for a large minority of children, even with perfect reliability.
- Fix:
  - r ≥ .4 can license *group-level* construct language in papers.
  - Individual parent wording stays behavioural unless the index reaches reliability ≥ .8 *and* shows individual-level classification accuracy against the criterion (e.g. AUC ≥ .8), checked by band.
  - The B1-B2 criterion (blinded parent/teacher ratings) is weak because parents also see the reports. Collect it before report exposure.

**R17. Same behaviour, opposite sign.**
- S2 "one more" requests at the planned end (M1, autonomous motivation) and "cap-override pleas" (M12, compulsion) are the same utterance whenever the planned end equals the cap.
- Fix: define them as disjoint events (within-plan request vs post-cap request), and stop the post-cap event from loading on M1.

**R18. MHI3 contradicts §7.**
- MHI3 says "no model uses clock time-of-day".
- §7's after-bedtime marker compares the clock time of session start with the parent-set bedtime (as DC7 does).
- Fix: either carve it out explicitly ("safety predicate, not a model input; compared with a parent-declared bedtime; never stored as a time-of-day feature"), or MHI3 will fail its own audit.

### D. Ethically risky inferences

**R19 (serious). The §4.5 example parent note breaches the child's confidence.**
- The note reads "...and asked not to tell anyone her mistakes".
- The child's request for privacy is exactly what MI routes to M.PRIVATE. Quoting it to the parent, in a file that names exam pressure as the risk, can expose the child to the pressure being avoided and teaches the child that the tutor reports what they say.
- Fix:
  - Parent notes never repeat, paraphrase or count what the child asked to keep private, or the child's statements about adults.
  - The factual note becomes Taxila's adaptation plus generic guidance: "we've been using more practice rounds without scores in maths; here is guidance on talking about exams".
  - Add this as an MHI invariant.

**R20 (serious). Fear-of-punishment utterances are safeguarding signals, not motivation data.**
- S5 counts "daant padegi" and similar as *introjection markers*. Some of these utterances are ordinary idiom. Some, especially recurrent ones or ones about hitting or fear, are safeguarding-relevant.
- Fix:
  - Route the fear-of-harm subset of the lexicon through the existing safeguarding predicate (the hand-off to Childline 1098 / Tele-MANAS 14416 under the safety floor) with its own precision bar.
  - Never surface it to the parent through this model: the parent may be the source of the risk.
  - Keep the rest as a suppression-only count, as now.

**R21. Research use needs prospective consent and assent, or nothing in §8 is publishable.**
- Journals and ethics boards will require prospective parental consent *and* child assent (customary from about age 7) for H1-H8. They will also require prior ethics approval for the micro-randomised designs (H5-H8; MI MM9).
- Data collected under service consent generally cannot be repurposed retroactively for publication.
- The owner deprioritised compliance; this point is publication feasibility, not compliance.
- Fix: put the research-consent and assent flow in onboarding *before* the cohort whose data a paper will use.

**R22. "First" claims are unverified.**
- H1, H3 and H5 claim "first" developmental accounts.
- The method note says the WebSearch budget was exhausted and discovery used about 60 API queries.
- Fix: change these to "to our knowledge, pending a systematic search".

### E. Developmental accuracy (smaller)

- **B1 regularity and self-start.** At 6-7, `started_by = child` largely reflects device access and literacy, not motivation. §4.1 says to stay silent when it is low. It should also stay silent when it is *high* for B1, because a high value does not mean what it means at 13.
- **D'Mello & Graesser dynamics come from undergraduates** (AutoTutor). Baker 2010 used Philippine high-school students plus US undergraduates. §4.6 should state the sample ages, since H5 is premised on age generalisation. The L statistic also has known small-sample and sequence-length biases beyond the self-transition issue (Bosch & Paquette 2021, JEDM) [S]. Require per-band minimum sequence counts.
- **Gunderson 2013** is correlational, N = 53. Gottfried 2001's stability is *self-report* rank stability in a US middle-class cohort, ages 9-17. Neither implies that Taxila's behavioural indices will be rank-stable from age 6.
- **Wang & Eccles** covers grades 7-11 in a US sample of African American and European American students. Nothing is said below grade 7. §1.7 should not imply the pattern holds from age 6.

### Net effect on the §0 decisions

| decision | status after review |
|---|---|
| MH-D1, D4, D6, D7, D10 | stand. D6 re-worded per R5 (an ethical floor, not demonstrated child harm) |
| MH-D2 | stands, but the reliability wording changes to "simulated" (R6) and the per-child reversal condition is removed (R11) |
| MH-D3 | weakened: prior for population estimation only, no band split, units caveat (R2b, R10) |
| MH-D5 | stands. K selection is preregistered (BIC plus interpretability is a forking path) |
| MH-D8 | stands. Li & Bates and Bennett-Pierre corrected (R3, R4); Rege "robust" softened |
| MH-D9 | strengthened by Talsma's child moderator (R1). Adopt MS-D3 rating counts |
| §6 table | needs magnitude floors (R7), the new change rule (R8), and removal of the private-request content (R19) before shipping |
| §7 | thresholds need false-alarm budgets (R9). Bedtime carve-out (R18). Fear-of-harm routing (R20) |
| §8 | H3 and H4 need the dropout and adaptive-policy machinery (R12, R13). Consent and assent first (R21) |
