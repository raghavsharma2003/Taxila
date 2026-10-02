# Metacognition and self-regulated learning 6-15: what Taxila can validly estimate, how, and what it may say

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish tutor with probes, games and a Conductor-run day.
**Question:** How do calibration, help-seeking, planning, monitoring, effort regulation and the illusion of competence develop between 6 and 15? Which of them leave valid traces in Taxila's logs? Which measurement models turn months of turns into honest per-child statements? Which interventions demonstrably help children? How can *growth* in self-regulation be shown to a parent without labels or pseudo-science?
**Builds on, does not repeat:**
- `learning-science.md` (LS): §1.1 (self-report is invalid evidence), §1.9 (confidence and hypercorrection), probe catalogue P12 (confidence bet), P15 (hint-ladder consumption), P16 (self-correction), P22 (gaming), rules 10 (wheel-spinning) and 15 (answer withheld until the ladder is exhausted).
- `learner/kt-algorithms.md` (KT): categorical outcomes C0-C4 (§1.2), gaming tempering (§1.4), wheel-spinning (§2.6). This file *consumes* KT's pL and θ; it never writes to them.
- `psychology/motivation-habits.md` (MH): M4 persistence after error and M5 self-efficacy. MH §4.4 models *prospective* confidence ("can you do this one?") as efficacy. This file models *retrospective* confidence (after answering, before feedback) and judgments of learning as monitoring. The two share one ordinal model (§4.1, last paragraph).
- `psychology/cognitive-development.md` (CD): reliability arithmetic §2.2, lognormal response times §2.5, weather versus climate §2.7, the reliability card CD9. Planning as an executive function lives in CD §3; here it is a learning behaviour.
- `psychology/learning-over-time.md` (LOT): delayed checks with randomised lags (LT-D3), which supply the criterion for judgments of learning.
- `learner/vibe-temperament.md` (VT) §4.9 banned inferences; `learner/motivation-interest.md` (MI) move shapes and invariants.

**Evidence tags.**
- **[V]** checked this session against the primary abstract via the Europe PMC or ERIC APIs. Effect sizes are quoted only where the abstract gives them.
- **[V-full]** checked against the full text (Europe PMC full-text XML).
- **[V, sib]** verified on the same date by a sibling file, not re-fetched.
- **[S]** secondary only: a title record, a citation inside a [V] source, or an abstract truncated before the number quoted.
- **[U]** unverified: from memory, or a Taxila design default that must be measured.
- *computed*: from `metacognition-srl-calibsim.py` in this folder (numpy, seed 11, ~25 s). Its generative assumptions are [U]; its arithmetic is reproducible.

**Method.** The shared WebSearch budget was already spent (200/200) when this review began. Discovery used ~130 structured queries against Europe PMC (REST, core) and ERIC, two full-text reads (Rahnev 2025; Guggenmos 2021), and Crossref for one title. Semantic Scholar and OpenAlex were rate-limited. No study found here measures metacognition or SRL **from AI-tutor dialogue logs in Indian children aged 6-15**. Almost all developmental data come from Western European, US, Chinese, Japanese and Israeli samples. Everything about Taxila's population is extrapolation plus the measurement plan in §10.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| MS-D1 | **Calibration is two numbers, never one.** Taxila estimates a confidence *offset* κ (bias) and a *resolution* ψ (does confidence separate right from wrong?) from retrospective bets. Raw "confidence minus accuracy" is never reported or used as a child feature | Raw bias is confounded with ability by construction. *Computed:* with κ generated independent of ability, r(raw bias, θ) = −.53 to −.74 by band, and the lowest-ability quartile looks +0.13 to +0.37 "overconfident" (§3.2). The accuracy-independent offset gives r(·, θ) ≈ 0. No metacognition measure is free of type-1 performance (Guggenmos 2021; Rahnev 2025) [V-full] | A Taxila validation (MS2) shows that raw bias predicts later control behaviour better than κ̂ does, controlling for θ |
| MS-D2 | **Confidence bets are a learning move first and a measure second.** At most 3 per session, on items sampled *across* difficulty (not only hard ones), no points or stakes, and the bet is always followed by feedback | High-confidence errors are hypercorrected in grades 3-6 (Metcalfe & Finn 2012) [V]. Monitoring tools are reactive: d = .42 on achievement (Dignath et al. 2023) [V]. Stakes add risk preference to the judgement [U] | MS6 shows bets lower delayed learning or raise avoidance markers |
| MS-D3 | **Offset statements need ≥ 30 bets; resolution statements need ≥ 120 bets and a measured split-half ≥ .70.** Resolution is never reported for B1 (6-7) | *Computed* (3 bets/session, session-state noise): offset test-retest r = .73-.75 at 30 bets, .92 at 120. Resolution (ΔConf) .36-.57 at 30, .72-.85 at 120. If between-child spread is adult-like it is .65 at 120 and .79 at 240 (§3.3). In adults, no normalised or model-based index reached test-retest ICC .5 even at 400 trials; the best simple index, ΔConf, reached .75 (Rahnev 2025) [V-full] | MS3 measures split-half ≥ .70 at fewer bets in real data |
| MS-D4 | **Help-seeking is measured as coupling to need, plus counts by kind, with the initiator logged.** The coupling slope λ_c (does the child ask more when KT says the skill is weak?) is research-only until ~400 child-initiated opportunities. Parents see counts of *explain-again* versus *tell-me-the-answer* requests | *Computed:* λ̂ test-retest .21 at 50 opportunities, .51 at 200, .66 at 400, .79 at 800. Base propensity η is reliable early (.71 at 50) but is not a skill (§4.4). Adaptive peer help-seeking declines and expedient help rises over grades 6-7. Expedient increases predicted achievement decline (Ryan & Shim 2012) [V] | MS4 shows λ̂ reliable at ≤ 200 opportunities |
| MS-D5 | **"Help avoidance" is not flagged before ≥ 2 failed attempts on the step.** Trying first is protected | Avoiding help and failing repeatedly on low-prior-knowledge steps was associated with *better* learning than asking (Roll et al. 2014, n = 38, within-student) [V]. This matches LS rule 10 | A Taxila analysis of the Roll design (H3) reverses the sign for children |
| MS-D6 | **Asking for help never costs anything.** No stars, points, streak or mastery penalty for a hint, ever. A bottom-out answer is still an opportunity (KT §1.4) | Children who conceal difficulty become "poorer", and those who seek help become "richer", via teacher support (Marchand & Skinner 2007, grades 3-6, N = 765) [V]. Avoidance tracks low efficacy (Ryan et al. 1998) [V] | Never (ethical floor) |
| MS-D7 | **"Just tell me" goes through the ladder and is counted, not obeyed** (= LS rule 15). Answer requests are the measured face of the crutch risk | Unguarded GPT-4 access raised practice grades 48% and lowered later unaided exam grades 17%. Guardrails largely removed the harm (Bastani et al. 2025, PNAS, ~1,000 high-school students) [V]. ChatGPT support produced "metacognitive laziness" signs (Fan et al. 2025) [V] | Never for the routing. The count is dropped if MS4 finds it does not separate gaming from genuine help need |
| MS-D8 | **A claim of SRL *growth* needs three things:** a within-child change with posterior P ≥ .9 over ≥ 3 windows (= MH, LOT); a transfer check on a new item format or domain; and the band-drift prior | Retrospective *control* improved over a year mainly from task familiarity, not development (Bayard et al. 2021, N = 305, 7-10 y) [V]. Monitoring is partly topic-specific in 7-8-year-olds (Grenell 2024) [V] | Never for the posterior rule. The transfer check can be dropped if MS7 shows familiarity gains are negligible after the first month |
| MS-D9 | **No SRL trait labels, at any layer.** "Overconfident", "careless", "doesn't ask for help", "good self-regulator", "lazy", "impulsive" are banned. Parents see calibration *tables* in counts, and behaviour counts with windows | Labels outlive evidence (VT §4.9). Overconfidence in 6-8-year-olds is the developmental norm, and is partly self-protective (van Loon et al. 2017; Destan & Roebers 2015) [V] | Never for labels |
| MS-D10 | **No metacognition questionnaires as child measures or parent outputs.** MSLQ, Jr MAI and similar are research criteria for B3-B4 only | Prospective questionnaires have poor convergent and predictive validity in maths, and on-line measures stand out (Veenman & van Cleef 2019) [V]. Self-reported and traced goal orientation did not correlate (Zhou & Winne 2012) [V]. Self-reports describe global, not strategy-level, SRL (Rovers 2019) [V] | A Taxila study shows questionnaire scores add ≥ .05 R² over traces in predicting delayed learning |
| MS-D11 | **Taxila keeps the schedule; the child's choices are measured, not obeyed.** Bounded choices ("which one shall we practise?") are offered, logged and compared with KT need | Grade 3 restudy choices were random. Grade 5 showed some monitoring-based choice but no consistent benefit. Computer choice by the Region-of-Proximal-Learning rule improved recall (Metcalfe & Finn 2013) [V]. Learners under-use retrieval when they control study (Karpicke 2009) [V] | MS8 shows B4 children's own choices match or beat the scheduler on delayed outcomes |
| MS-D12 | **Training moves are age-gated** (§5.3): B1 experiential (postdiction, "check with the answer"); B2 confidence-accuracy feedback in counts; B3-B4 explicit strategy instruction (delayed keywords, teach-back, self-questioning, planning prompts) | Monitoring feedback over 12 sessions did not help 6-year-olds (Kolloff et al. 2025, N = 214) [V]. Six sessions *did* help 7-year-olds' monitoring, but not memory (Buehler et al. 2025, N = 127) [V]. Delayed keywords helped grades 6-7, not grade 4 (de Bruin et al. 2011) [V] | Taxila micro-RCTs (H5) show the B3-B4 moves work in B2 |
| MS-D13 | **Wheel-spinning and rapid responding are system signals first, child signals second.** Each triggers a pedagogical action (prerequisite probe, new representation, a break). Each enters a parent report only as a count of what Taxila changed | Prerequisite knowledge predicts wheel-spinning: bottom-quintile 50%, top-quintile 10% (Wan & Beck 2015) [V]. Gaming detectors can fail construct validity across conditions (Huang et al. 2022) [V] | Never for the ordering |

---

## 1. Executive summary

1. **Monitoring is present early, but children start out overconfident and improve unevenly.**
   - Three-year-olds' certainty judgments already discriminate right from wrong answers, and they rely on response latency (Lyons & Ghetti 2011) [V].
   - Reliable performance monitoring appears by about 6, and early monitoring predicts later control (Wan et al. 2025, longitudinal, 4-6 y) [V].
   - Retrospective monitoring (confidence after answering) improves between 7 and 10. Prospective monitoring (judgments of learning) does not, over the same year (Bayard et al. 2021) [V].
   - Metacognition keeps maturing into adolescence, and the maturation explains why adolescents can ignore misleading advice (Moses-Payne et al. 2021, N = 107) [V].
   - Arithmetic calibration was still developing across grades 5-8, even as accuracy reached ceiling. Grade-5 calibration predicted accuracy gains to grade 8 (Rinne & Mazzocco 2014) [V].
   - Schneider's review: declarative metacognitive knowledge grows steadily; age trends are significant for self-control activities "but not pronounced for monitoring" (Schneider 2008) [V].
2. **Monitoring is not the bottleneck in middle childhood; turning it into action is.**
   - Grade 3 and grade 5 children made *excellent* delayed judgments of learning, yet grade 3 restudy choices were random (Metcalfe & Finn 2013) [V].
   - Control stayed suboptimal at 7-10 because monitoring stayed overoptimistic (Bayard 2021) [V].
   - Only children 6+ practised the harder game when the test was uncertain (Serko et al. 2025) [V].
   - In grade 7, monitoring-based restudy began to predict scores at the second wave (van Loon & Laninga-Wijnen 2025) [V].
   - **Implication:** Taxila owns scheduling (MS-D11). Children's choices are an SRL *measurement*, and the bridge from monitoring to control is the skill to grow.
3. **Confidence is cue-driven, and the cues can mislead.**
   - From grade 3, children use the memorising-effort cue ("easily learned, easily remembered"); grades 1-2 do not yet (Koriat et al. 2009) [V].
   - Choice latency is a valid cue that 6-year-olds use (Kolloff 2025) [V].
   - Fluent readers in grade 5 were *more* overconfident (Markovich et al. 2026) [V].
   - Children are most confidently wrong when they apply a misconception strategy (Grenell et al. 2022; 2024) [V].
   - **Implication:** a confident wrong answer is diagnostic of a *misconception* (KT §1.6), not of a character trait.
4. **Illusions of competence are general, and AI makes them easier.** Learners feel they learned more from passive instruction (Deslauriers 2019) [V], predict no gain from further study (stability bias; Kornell & Bjork 2009) [V], and drop items instead of practising retrieval (Karpicke 2009) [V]. An unguarded LLM tutor creates this illusion at scale: practice performance goes up, unaided learning goes down (Bastani 2025) [V].
5. **Help-seeking declines and turns expedient in early adolescence, and the design of help decides whether it helps.**
   - Help-seeking declines across grades 3-6, and concealment grows with a sense of incompetence (Marchand & Skinner 2007) [V].
   - Adaptive peer help declines and expedient help rises over grades 6-7 (Ryan & Shim 2012) [V].
   - In ITSs, students "are not using help facilities effectively" (Aleven et al. 2003) [V].
   - Real-time feedback on help-seeking improved help-seeking, and the improvement lasted, but domain learning did not improve: "help helps, but only so much" (Roll et al. 2011; Aleven et al. 2016) [V].
6. **Measurement is the hard part, and the numbers say so.**
   - All 17 metacognition measures have high split-half reliability but mostly poor *test-retest* reliability. M-Ratio's ICC is .23 at 100 trials and .42 at 400. The simple ΔConf reaches .53 and .75 (Rahnev 2025, Confidence Database) [V-full].
   - About 400 trials is a sensible minimum for M-Ratio (Guggenmos 2021) [V-full].
   - Taxila collects about 12 bets a week. So *offset* is estimable in weeks and *resolution* in months. Metacognitive *efficiency* (meta-d′/d′) is not estimable per child at all (§3.3).
7. **Interventions work, with stable moderators.**
   - SRL training averages d = 0.69 across 84 school studies, higher when researcher-led and in mathematics (Dignath & Büttner 2008) [V].
   - Computer-based SRL scaffolds: 0.44 (Zheng 2016) [V]. Self-explanation prompts: g = .55 (Bisra 2018) [V]. Monitoring tools: d = .42 on achievement, but only .19 on SRL itself (Dignath 2023) [V].
   - Effects shrink on standardised tests (de Boer et al. 2014) [V].
   - Child-specific RCTs:
     - A brief metacognitive lesson helped grades 1-2 on accuracy and monitoring at a 2-week delay (Fyfe et al. 2022, n = 135) [V].
     - Teaching a computer agent raised effort in grades 5 and 8, most for lower achievers (Chase et al. 2009) [V].
     - Delayed keywords improved metacomprehension in grades 6-7 (de Bruin 2011) [V].
8. **For parents, the honest and useful product is a calibration table and a few behaviour counts, shown as *then → now*.** Examples: "when she said *pakka*, she was right {a} of {n} times (was {a′} of {n′} in {month})"; "asked to have it explained again {x} times, asked for the answer {y} times"; "fixed her own mistake before being told {z} of {m} times". Each row carries a window, n, a "Kaise pata?" evidence link, what Taxila is doing, and at most one home suggestion (§7). Never a score, a label, a percentile, or a comparison with another child.

---

## 2. Constructs at a glance

Bands follow DC: **B1 6-7, B2 8-9, B3 10-12, B4 13-15.** Per-child reliability is the *expected* value at Taxila's data shape. Values marked *computed* come from §3.3; all others are [U] until §10 measures them.

| id | construct | Taxila indicators (logs) | model | per-child reliability | parent-facing? |
|---|---|---|---|---|---|
| S1 | Monitoring offset (bias) κ | P12 bets (3-level) after answering, before feedback | ordinal type-2 model, κ_c (§4.1) | *computed* .73-.75 at 30 bets; .92 at 120 | yes, as a calibration table in counts (≥ 30 bets) |
| S2 | Monitoring resolution ψ | same bets × outcome | ψ_c; ΔConf; AUROC2 | *computed* .36-.57 at 30; .65-.85 at 120 | B2+ only, ≥ 120 bets, after MS3 |
| S3 | Prospective monitoring (JOL) and illusion of competence | end-of-skill "kal yaad rahega?" × LOT delayed check; in-session vs delayed gap | same model, delayed outcome as o (§4.2) | low; JOLs ~1-2 per week [U] | as counts only, B3+ |
| S4 | Error monitoring | P16 self-corrections; P6 error-spot catches; "ruko, galat hai" utterances | rate per opportunity, hierarchical binomial (§4.3) | moderate [U] | yes, as counts |
| S5 | Monitoring-based control | restudy or practice choice vs KT need; "pass / skip" on hard items vs later accuracy | choice-need coupling (§4.3) | low-moderate [U] | B3+ as counts |
| S6 | Help-seeking | child-initiated requests by kind (explain-again, hint, answer), timing, dwell, rung | help-need logistic: η_c, λ_c; Aleven-style step classes (§4.4) | η *computed* .71 at 50 opportunities; λ .51 at 200, .66 at 400 | counts by kind; λ research-only |
| S7 | Planning | plan prompt responses (rubric); pre-action latency on multi-step vs single-step; subgoal order in games | rubric rate; latency ratio (§4.5) | low [U] | as "planned before starting {x} of {n}" counts, B3+ |
| S8 | Effort regulation | rapid-response share; time-difficulty slope; productive persistence vs wheel-spinning | lognormal mixture RT; slope ζ_c (§4.6) | moderate for rapid share [U] | as what Taxila changed |
| S9 | Strategy choice | "quiz me" vs "explain again" when both are offered | share of retrieval choices (§4.2) | low [U] | B3+ counts |
| S10 | Evaluation and reflection | end-of-session "how did it go?" vs the KT record | postdiction match (§4.7) | low [U] | no (child-facing use only) |

---

## 3. Measurement foundations specific to metacognition

### 3.1 Self-report is the wrong instrument, and traces are the right one
- **Questionnaires do not track behaviour.**
  - Prospective questionnaires (MSLQ, ILS) had poor convergent and predictive validity for secondary-school maths. Observation and think-aloud were valid (Veenman & van Cleef 2019, n = 30) [V].
  - A systematic review and meta-analysis found that self-reports capture two broad factors, knowledge and regulation, which "do not adequately relate to metacognitive behavior" (Craig et al. 2020, 37 studies) [V].
  - Self-reported goal orientation did not correlate with traced goal orientation, and the traces predicted achievement better (Zhou & Winne 2012) [V].
  - Granularity matters: self-reports describe global SRL; strategy-level SRL needs behavioural measures (Rovers et al. 2019) [V].
  - Students were only "moderately calibrated" between their recalled and their actual studying (Chu, Jamieson-Noel & Winne 2000) [S].
- **Measurement type moderates every relation.** Metacognition-achievement correlations differ by measure type (Ohtani & Hisasaka 2018, 149 samples; Dent & Koenka 2016) [V]. The SRL-achievement correlation is small overall, r = .20 for metacognitive processes and .11 for cognitive strategies. It varies by grade and by measure (Dent & Koenka 2016) [V].
- **Young children need behavioural or observational measures.** The CHILD 3-5 observational checklist was built because verbal methods underestimate early metacognition (Whitebread et al. 2009) [V]. Taxila's logs are an observational instrument by design (Winne 2010; Aleven et al. 2010: "automated, unobtrusive, action-by-action assessment") [V].

### 3.2 Type-1 performance contaminates every metacognitive index (and manufactures "unskilled and unaware")
- No current metacognitive measure is independent of type-1 performance (Guggenmos 2021, N = 6,912) [V-full]. Rahnev (2025) found "many strong dependencies on task performance" across 17 measures [V-full].
- *Computed* (`calibsim` B, N = 240 bets): κ and ψ were generated independent of ability θ. Even so:

| band | r(raw bias, θ) | raw bias by ability quartile, low → high | r(offset κ̂_mid, θ) | r(mean confidence, θ) |
|---|---|---|---|---|
| B1 | −.74 | +.37 +.24 +.12 −.01 | .00 | .28 |
| B2 | −.65 | +.26 +.14 +.06 −.04 | .03 | .49 |
| B3 | −.56 | +.16 +.06 .00 −.07 | .01 | .60 |
| B4 | −.53 | +.13 +.05 −.01 −.07 | .00 | .68 |

- **Consequence.** The classic "low performers overestimate, high performers underestimate" plot (Kruger & Dunning 1999 [S]; replicated in classrooms, Callender et al. 2016 [V]) appears *by construction* when bias = confidence − accuracy. Part of it is a statistical artefact (Gignac & Zajenkowski 2020, title and a 2023 comment) [S]. Taxila never reports raw bias. It reports the accuracy-independent offset (§4.1) or, to parents, the conditional table "when she said *pakka*, right {a} of {n}". That table is honest because it conditions on the child's own confidence level.
- **Mean confidence is highly reliable and only partly valid.** *Computed:* test-retest .80-.81 at 30 bets, yet r = .73 with the true offset and .28-.68 with ability. In adults, mean confidence was the only index with test-retest > .86 at all trial counts (Rahnev 2025) [V-full]. Reliability is not validity: mean confidence reliably measures a *mix* of offset and skill.

### 3.3 How many bets? Reliability against data volume
*Computed* (`calibsim` A), 3-level bets, 3 bets per session, session-to-session state SDs of κ 0.5 and ψ 0.4 [U]. Test-retest is Pearson r between two independent windows of N bets. At ~4 sessions a week, N = 60 is ~5 weeks, N = 120 ~10 weeks, N = 240 ~5 months.

| index | B1 N=30 / 120 / 240 | B3 N=30 / 120 / 240 | note |
|---|---|---|---|
| offset κ̂_mid (mean of conf\|correct and conf\|wrong) | .74 / .92 / .96 | .74 / .92 / .96 | r = .96 with true κ at N = 240; r ≈ 0 with θ |
| resolution ΔConf | .36 / .72 / .85 | .57 / .85 / .92 | assumes between-child SD(ψ) = 0.3-0.4 |
| Goodman-Kruskal γ | .21 / .58 / .75 | .38 / .79 / .88 | worse than ΔConf at every N; biased with ties (Masson & Rotello 2009) [V] |
| ΔConf if SD(ψ) = 0.15 (adult-like) | — | .25 / .65 / .79 | Rahnev's adult ΔConf ICC: .39 at 50, .53 at 100, .75 at 400 trials [V-full] |

- Adults' test-retest reliability is "very low" for normalised and model-based indices: M-Ratio ICC .16 (50 trials), .23 (100), .29 (200), .42 (400). No index exceeded .75 at 400 (Rahnev 2025) [V-full]. Guggenmos recommends ≥ 400 trials for M-Ratio. Simultaneous choice-and-confidence reports improved reliability most [V-full]; Taxila's bet is effectively simultaneous.
- **Decision consequences:** MS-D3. Metacognitive *efficiency* (M-Ratio, meta-d′/d′) is **not estimated per child**: 400+ bets would take > 8 months at 3 per session, against a developing, non-stationary child. ΔConf (or the model-based ψ) is preferred over γ for resolution. Offset becomes parent-reportable after ~30 bets; resolution after ≥ 120, and only if measured reliability agrees (MS3).
- **Without state noise** (`calibsim` A1, an upper bound), ΔConf is .69 at 30 and .91 at 120. The gap from the realistic case is the "weather" (CD §2.7). Session-to-session variation is real in adults (Rahnev) [V-full], so Taxila plans for it.

### 3.4 The tutor is part of the measurement (policy dependence)
- Help-seeking can only be observed when help is not already being given. If the Director offers a hint after every error, child-initiated help vanishes from the data. That is the *assistance dilemma*: how much to give versus withhold remains "a fundamental open problem" (Koedinger & Aleven 2007) [V].
- **Rule:** every help event logs `initiator ∈ {child, tutor, parent}` (§6.1). λ_c is fitted only on *help-eligible windows*: steps where the policy waited at least `waitNudgeSec` (VT) without offering help.
- Likewise, bets are informative only if the items span difficulty. Sampling bets only on hard items range-restricts accuracy and inflates "overconfidence" (§3.2). Bet items are drawn stratified by predicted P(correct) tercile (MS-D2), which mirrors LT-D3's randomisation.

### 3.5 Reactivity: measuring monitoring changes it
- Monitoring tools raised achievement (d = .42) more than SRL itself (.19) (Dignath 2023) [V]. Hypercorrection means that a bet followed by feedback is itself a learning event (Metcalfe & Finn 2012) [V].
- Measurement and intervention cannot be separated. Analyses treat bet frequency as a design variable, randomised within limits (H1), and never infer development from a period in which bet frequency changed.

### 3.6 Domain and topic specificity
- In children, metacognition looks partly domain-specific:
  - 5-year-olds' numerical metacognition (from bets) was unrelated to their emotion-discrimination metacognition, and only the numerical one predicted school maths (Vo et al. 2014) [V].
  - 7-8-year-olds showed no robust cross-topic association between equivalence and fractions (Grenell 2024) [V].
- By 12-15, metacognitive skilfulness is "predominantly general". A small domain-specific component in years 1-2 had "disintegrated" by year 3 (van der Stel & Veenman 2014) [V]. Skilfulness was already general across age groups in grades 4-8 on inductive tasks (Veenman et al. 2004) [V].
- **Model consequence:** κ and ψ carry a child-general effect plus child × domain deviations, with the domain variance prior larger in B1-B2 than in B4 [U]. Statements are always domain-scoped ("in fractions").

### 3.7 Voice-specific threats
- In 5-8-year-olds, disfluency tracked *accuracy* but not confidence where the two diverged (West et al. 2025) [V]. So paralinguistic cues cannot replace an explicit bet, and they are never used to *impute* confidence.
- ASR errors on "pakka / shayad" are a new failure mode. The bet is also offered as three tap targets, and low-ASR-confidence bets are dropped (LS §7.2 rule 3).
- The lowest level must mean *uncertain about this answer*, not "I don't know the topic". "Pata nahi" conflates the two. The proposed levels are **pakka / shayad / andaaza** (sure / maybe / guess) [U: wording to test in MS1]. For B1 the levels are three faces, with no words needed (Whitebread's non-verbal indicators) [V].

---

## 4. Constructs: definition, trajectory, indicators, model, validity, parents

### 4.1 Calibration: offset and resolution (S1, S2)

**Definition.** *Calibration* is the match between confidence and accuracy (Schraw 2009, the five indices: absolute accuracy, relative accuracy, bias, scatter, discrimination) [V]. Taxila separates three concepts (Fleming & Lau 2014) [V]:
- **metacognitive bias**: the confidence level regardless of accuracy (κ)
- **sensitivity**: separating one's correct from incorrect answers (ψ)
- **efficiency**: sensitivity given type-1 performance. Efficiency is not estimated (§3.3).

Ten common calibration scores reduce to two near-orthogonal factors (Schraw, Kuch & Gutierrez 2013) [V], which supports a two-number model.

**Developmental trajectory, 6-15.**

| band | what the evidence shows | sources |
|---|---|---|
| B1 6-7 | Monitoring exists: confidence discriminates in 6-year-olds, and better discrimination goes with better control. Strong optimism: "under-estimators" outperformed "over-estimators" in discrimination and control, with no difference in EF. Predictions stay overconfident with practice even when postdictions are accurate. Six-year-olds are more self-protective than eight-year-olds. Feedback training did not improve monitoring at 6 | Destan & Roebers 2015 [V]; Lipko et al. 2009 (preschool) [V]; van Loon et al. 2017 [V]; Kolloff 2025 [V]; Wan 2025 [V] |
| B2 8-9 | Retrospective monitoring improves naturally from 7/8 to 9/10. Prospective monitoring and control lag. Grade 2 discriminates more than kindergarten. Feedback can improve 7-year-olds' monitoring | Bayard 2021 [V]; Destan et al. 2017 [V]; Buehler 2025 [V]; Wall et al. 2016 (number line, grades 1-4) [V] |
| B3 10-12 | The memorising-effort and ease cues are in use. Delayed JOLs show excellent resolution in grade 5. Arithmetic calibration is still developing in grades 5-8 and predicts later gains. Fluent readers are more overconfident. In sixth grade, general confidence relates to learning attributes; resolution less so | Koriat 2009 [V]; Metcalfe & Finn 2013 [V]; Rinne & Mazzocco 2014 [V]; Markovich 2026 [V]; Chen et al. 2026 (N = 3,946, China) [V] |
| B4 13-15 | Metacognition matures from childhood to adolescence and supports independent judgement. Metacognitive skills grow non-linearly between 12 and 15, with a temporary plateau around 15 | Moses-Payne 2021 [V]; van der Stel & Veenman 2014 [V] |
| all | Confidence and accuracy go together at every age 6-13, but young children make more high-confidence working-memory errors. Children with mathematics learning disability had distinctively poor calibration | Greene et al. 2024 [V]; Rinne & Mazzocco 2014 [V] |

LS §1.1 gives "near-adult around 12" as a review-level summary [S]. The primary studies above say that *retrospective* monitoring is decent by 9-10, *prospective* monitoring and control lag behind, and calibration keeps refining into adolescence.

**Indicators in Taxila logs.**
- P12 bets r ∈ {0, 1, 2} (andaaza, shayad, pakka) after the answer and before feedback, on ≤ 3 sampled items per session
- outcome o = KT class C0 (first try, unaided) versus anything else. Bets are taken only on items whose first attempt is graded by code or by a verified key ("a model never grades").
- item difficulty b_k and child θ from KT
- latency to the bet (Kolloff: latency is a cue children use) [V], logged for research only.

**Measurement model.** An ordinal type-2 signal-detection model, hierarchical over children c, domains d and sessions s:
```
y*_{cks} = κ_{cd} + ψ_{cd} · (2·o_{ck} − 1) + u_{cs} + ε_{cks},      ε ~ N(0, 1)          (ordered probit)
r_{ck}   = j   iff  τ_{j−1} < y* ≤ τ_j,   τ = (−∞, τ_1, τ_2, ∞) fixed per band for identification
κ_{cd}   = μ_κ[band(c, t)] + a_c + a_{cd},                  a_c ~ N(0, σ_a²), a_{cd} ~ N(0, σ_ad²[band])
ψ_{cd}   = softplus( μ_ψ[band(c, t)] + g_c + g_{cd} ),      g_c ~ N(0, σ_g²), g_{cd} ~ N(0, σ_gd²[band])
u_{cs}   ~ N(0, σ_u²)                                       session "weather" (CD §2.7)
```
- **Why condition on o.** The model separates bias from sensitivity at any accuracy level. κ is the midpoint of the confidence distributions for correct and wrong answers, which is what makes it accuracy-independent (§3.2).
- **Quick estimators** (dashboards and sanity checks, same logic): κ̂_mid = ½(mean conf | correct + mean conf | wrong); ψ̂ = ΔConf = mean conf | correct − mean conf | wrong; AUROC2 = P(conf_correct > conf_wrong) + ½·P(tie).
- **Calibration curve per child:** h_{cj} = P(o = 1 | r = j), with a hierarchical binomial shrunk to the band curve:
  ```
  h_{cj} ~ Beta(m_j·φ, (1 − m_j)·φ)
  ```
  This curve *is* the parent-facing table. Brier/Murphy decomposition (BS = reliability − resolution + uncertainty) [U] is used only in research, because verbal levels have no agreed probability mapping.
- **Prospective link to MH §4.4.** MH models the pre-answer rating as OrderedLogit(κ_pro + ψ_pro·(θ_c − b_k)). That is the same structure with the *expected* rather than the realised outcome. A joint model shares a_c between the two, with a correlation parameter. The prospective-retrospective gap is itself developmental (Bayard 2021) [V].

**Reliability and validity concerns.**
- the trial-count limits of §3.3
- performance dependence (§3.2)
- topic specificity (§3.6)
- reactivity (§3.5)
- misconception-driven confidence: high-confidence errors cluster on misconceptions (Grenell 2022) [V]. A κ̂ estimated mostly from misconception items is not a stable trait, so the model includes a misconception-item indicator as a covariate.
- social desirability: "pakka" may be a politeness default toward an adult-like voice in Indian homes [U: MS1].
- **Validity criteria (MS2):** κ̂ and ψ̂ should predict (i) hypercorrection rates, (ii) monitoring-based control (S5), and (iii) delayed-learning gains net of θ (Rinne & Mazzocco's predictive pattern) [V].

**What can be said to parents** (thresholds in §7):
- B1-B4, ≥ 30 bets in a domain: the conditional table only ("said pakka {n} times, right {a}; said shayad {m} times, right {b}"), with one plain-language reading slot from a fixed set ("her 'pakka' is usually right", "her 'pakka' and 'shayad' are right about equally often").
- Resolution phrasing ("she can tell when she might be wrong") only in B2+ after MS3, at ≥ 120 bets.
- Never "overconfident". For B1 the table is paired with a fixed normalising note: being very sure at this age is typical and does not need fixing.

### 4.2 Prospective monitoring, illusions of competence, and strategy choice (S3, S9)

**Definition.** An *illusion of competence* is a gap between felt and actual learning. It is produced by cues present at study but absent at test, such as foresight bias (Koriat & Bjork 2005) [V], by fluency, and by the stability bias, the belief that memory will neither grow with study nor decay (Kornell & Bjork 2009) [V]. *Strategy choice* is whether learners pick retrieval and spacing when they control study.

**Evidence and trajectory.**
- Students in active classrooms learned more but *felt* they learned less than those taught passively (Deslauriers et al. 2019, PNAS) [V].
- Given control, learners remove items instead of practising retrieval, which produces poor retention (Karpicke 2009) [V]. Without support, learners do not see testing as a learning tool, and they test themselves only under conditions that favour retrieval success (Rivers 2021 review) [V].
- Failed tests followed by immediate feedback potentiate learning (Hays, Kornell & Bjork 2013) [V]. This is the evidence behind "try first" (MS-D5).
- **Children.**
  - Delayed JOLs and JOKs (judgment of knowing) in grades 3 and 5 had excellent resolution (Metcalfe & Finn 2013) [V].
  - From grade 3, JOLs fall with study time (memorising-effort heuristic), but not in grades 1-2 (Koriat 2009; Hoffmann-Biencourt 2010, grades 1-8) [V].
  - Preschoolers' predictions stay overconfident with practice, while their postdictions are accurate (Lipko 2009) [V].
  - Generating delayed keywords improved metacomprehension and study regulation in grades 6-7, not grade 4 (de Bruin 2011) [V]. Concept mapping did so in grade 7 (Redford 2012) [V].
- **Debiasing.** Theory-based debiasing ("tell them how memory works") transferred to new items; mnemonic-cue training did not (Koriat & Bjork 2006, adults) [V].
- **AI crutch.** Unguarded LLM help gave large practice gains and harmed unaided performance (Bastani 2025) [V]. Hybrid support changed SRL process sequences and raised dependence ("metacognitive laziness"), with no knowledge or transfer advantage (Fan 2025, university) [V]. ChatGPT-generated hints produced learning gains equivalent to human hints, but failed quality checks on 32% of problems before filtering (Pardos & Bhandari 2024) [V].

**Indicators.**
1. **JOL prompt** at the end of a skill episode, ≥ 5 minutes after last practice (delayed-JOL design) [U: delay length]: "kal yaad rahega?" with pakka / shayad / andaaza.
2. **Criterion:** the LOT delayed check on that skill (randomised lag, LT-D3), C0 versus other.
3. **Performance-learning gap:** in-session success on the last 3 items versus the delayed check. This gap is partly the *system's* doing (massed practice inflates it), so it is a pedagogy metric before it is a child metric.
4. **Strategy choice:** when both are pedagogically fine, offer "quiz me" versus "explain again", and log the share of retrieval choices.
5. **Answer-request share** (MS-D7): "bas answer batao" requests per help request.

**Model.**
- JOL resolution and offset use the §4.1 model with o = delayed outcome and its own (κ_JOL, ψ_JOL). Prospective JOLs are fewer (~1-2 per week [U]), so they are pooled across domains and reported only in research for at least 6 months.
- Strategy choice: logit P(retrieval choice)_{ct} = ρ_c + ρ_1·(1 − pL_{ct}) + ρ_2·t_since_study.
- *Learning about memory* is tracked as a within-child increase in ρ_c after Taxila's theory-based explanations (H6). This is the Koriat-Bjork transfer test.

**Validity.** JOLs are reactive [U, adult literature]. The delayed criterion depends on the schedule (LT-D3 randomisation protects it). Choice shares are policy-dependent: choices are offered only when both options are acceptable, and that rule is logged.

**Parents.**
- B3-B4 only, as counts: "chose 'quiz me' {q} of {n} times when given the choice (was {q′} of {n′})".
- Plus a fixed, evidence-based explanation slot about *why* testing feels harder and works better. This is psycho-education for the parent, which is the theory-based route that transfers.
- Never "she thinks she knows more than she does".

### 4.3 Error monitoring and monitoring-based control (S4, S5)

**Definition.** *Error monitoring*: detecting one's own errors or a planted error (P16, P6). *Monitoring-based control*: acting on monitoring, by restudying what feels unlearned, withdrawing an uncertain answer, checking before committing, or choosing practice that fits a goal.

**Evidence.**
- Under-estimating 6-year-olds controlled incorrect answers better, and allocated more study time to low-JOL items, than over-estimators (Destan & Roebers 2015) [V].
- Early monitoring predicted later control, 4-6 years (Wan 2025) [V].
- Control at 7-10 was suboptimal, and its improvement over a year reflected task familiarity (Bayard 2021) [V].
- Grade 3 restudy choices were random; grade 5 showed a trend (Metcalfe & Finn 2013) [V].
- By grade 7, monitoring-based restudy predicted scores at the second wave, and decision accuracy (which answers to submit) strongly predicted scores (van Loon & Laninga-Wijnen 2025) [V].
- Practice choice adapted to the test goal from ages 4-8; preparing for uncertainty appears between 4 and 6 (Serko 2025) [V].
- **Error-spotting** (LS §1.7) is a strong probe after basic mastery. Novices adopt the planted error [V, LS].

**Indicators.**
- self-corrections before feedback, per answered item (P16)
- caught-and-fixed planted errors per P6 probe
- spontaneous error utterances ("ruko", "nahi nahi", "galat ho gaya")
- `pass` use on items offered with a skip option (rare; research arm), against the later accuracy of passed versus answered items
- restudy and practice choices against KT need.

**Model.**
```
self-correction:   k_c ~ Binomial(n_c, π_c),  logit π_c = μ_π[band] + v_c + β·difficulty     (hierarchical; per domain optional)
  validity split:  self-corrections that turn wrong→right (W→R) vs right→wrong (R→W); only W→R − R→W counts as monitoring
control coupling:  logit P(choose restudy of item i)_{c} = ω_c0 + ω_c1 · (1 − pL_{ci})          ω_c1 > 0 ⇒ monitoring-based control
withdrawal:        accuracy(answered) − accuracy(passed), shrunk                                  > 0 ⇒ adaptive withdrawal
```
- R→W "corrections" are frequent in anxious or uncertain children [U]. Counting raw changes would reward dithering, hence the validity split.
- P6 outcomes already enter KT as evidence about knowledge (KT §1.1). Here only the *catch rate given mastery* (pL ≥ .8) is used, to separate monitoring from knowing.

**Reliability.** Self-correction opportunities are plentiful (every answer), so π_c is plausibly estimable in weeks, but ASR turn-splitting creates false self-corrections (LS P16) [U, MS5]. Choice coupling ω_c1 suffers the same opportunity-count problem as λ_c (§4.4), because choices are offered rarely (~2 per week [U]).

**Parents.** "Fixed her own mistake before being told {k} of {n} times this month (was {k′} of {n′})". "Spotted the teacher's deliberate mistake {a} of {b} times on topics she knows well". Choice coupling only in research until reliable.

### 4.4 Help-seeking (S6)

**Definition.** *Adaptive* (instrumental) help-seeking asks for help that builds capability when it is needed. *Expedient* (executive) help-seeking asks for the answer or for work to be done (Newman 2000; Ryan & Shim 2012) [V]. In ITSs, help-seeking is a self-regulation strategy that can be assessed action by action (Aleven et al. 2003; 2010) [V].

**Developmental trajectory.**
- **Grades 3-6:** help-seeking declines and concealment rises with a sense of incompetence. Relatedness predicted increases in help-seeking. Rich-get-richer cycles ran through teacher support (Marchand & Skinner 2007) [V].
- **Grades 6-7:** adaptive peer help declined and expedient help increased. The expedient increase predicted achievement decline, and both were sensitive to perceived mastery climate (Ryan & Shim 2012) [V; also Shim et al. 2013, Kilday & Ryan 2023 [V]].
- **Sixth grade:** avoidance of help related to low academic efficacy, less so where teachers attended to social-emotional needs (Ryan, Gheen & Midgley 1998) [V]. Performance-avoid goals predicted avoiding help (Middleton & Midgley 1997) [V]. Perceived threat to competence moderated help-seeking (Butler 1998) [V].
- **Age and achievement:** older, high-achieving children showed more self-regulated help-seeking (Puustinen 1998) [V]. Grade 9 students wrote more explicit, contextualised help requests than grade 6 in a maths help forum (Puustinen et al. 2009) [V].
- **Parenting** related to help-seeking style in school-age children (Puustinen et al. 2008) [V]. Parents, teachers and peers shape adaptive help-seeking (Newman 2000) [V].

**Help in ITSs: what is known.**
- Help-seeking interacts with prior knowledge: individual differences in learner-tutor interaction relate to prior knowledge and outcomes (Wood & Wood 1999) [V-abstract minimal; that the neediest seek least is S].
- Asking for help on *challenging* steps was associated with learning, and *overusing* help with poorer learning. Avoiding help on low-prior-knowledge steps, and failing repeatedly, was associated with *better* learning than asking (Roll et al. 2014) [V].
- The Help Tutor (feedback on help-seeking errors) improved help-seeking, and the gain transferred to new content a month later, but domain learning did not improve (Roll 2011; Aleven 2016) [V].
- Students differ in *hint-processing* proficiency, by hint level (ProfHelp, a PFA extension; Goldin et al. 2012) [V].
- Gaming the system is driven by motivations and emotions (Baker et al. 2008) [V], clusters at session start and end (Dang & Koedinger 2020) [V], and gaming-prone students may benefit from *delayed* hints (Vanacore et al. 2024) [V]. One validated detector failed to relate to learning across conditions (Huang et al. 2022) [V].
- Two wheel-spinning profiles in ASSISTments involve bottom-out hint patterns and short inter-problem delays (Kai et al. 2018) [V].
- Aleven's executable help-seeking model classified actions as help abuse, help avoidance, try-step abuse and appropriate. The exact rules and thresholds are [U] here: Aleven 2010 and 2016 describe the model, but not its parameters, in the abstracts read.

**Indicators in Taxila logs.**
- Child-initiated requests, classified by a code-level lexicon plus an LLM fallback into: `explain_again` ("phir se samjhao", "samajh nahi aaya"), `hint` ("hint do", "thoda help"), `answer` ("answer batao", "aap hi bata do", "just tell me"), `check` ("sahi hai na?"), `off_topic` [U: lexicon in MS4].
- Request timing: before any attempt, after the first error, after ≥ 2 errors.
- Dwell after a hint before the next attempt. Very short dwell signals click-through, as do "next hint" requests within 3 s [U].
- Rung reached on the ladder (P15).
- The initiator of every help event (§3.4).

**Model.**
```
help-need coupling (fit on help-eligible windows only):
   logit P(h_{ct} = 1) = η_c + λ_c · w_{ct} + β_1·errors_on_step + β_2·rung + β_3·minute_in_session + β_4·band
   w_{ct} = (1 − pL_{ct}) − 0.5,    η_c ~ N(μ_η[band], σ_η²),  λ_c ~ N(μ_λ[band], σ_λ²)
step classes (Taxila adaptation of Aleven's rules; thresholds [U], to fit in MS4):
   appropriate ask      h = 1 and (pL < .4  or  errors ≥ 1 and pL < .6)
   protected try        h = 0, first attempt, pL < .4                  (NOT an error: Roll 2014)
   help avoidance       h = 0 after ≥ 2 errors with pL < .4             (MS-D5)
   help overuse         h = 1 before any attempt with pL > .8,  or dwell < τ_read on ≥ 2 rungs in a row
   expedient request    kind = answer (any pL)
hint processing (Goldin-style):  logit P(correct next attempt | hint level ℓ) = θ_c − b_k + γ_ℓ + γ_{cℓ}
```
- *Computed* reliability (`calibsim` C; base rate ~15%, SD(λ) = 1.0, KT pL with logit noise 0.8):

| opportunities | 50 | 100 | 200 | 400 | 800 |
|---|---|---|---|---|---|
| r(λ̂ window 1, window 2) | .21 | .35 | .51 | .66 | .79 |
| r(λ̂, true λ) | .46 | .58 | .69 | .81 | .89 |
| r(η̂ window 1, window 2) | .71 | .82 | .90 | .95 | .97 |

- **Reading the table.** *How often* a child asks (η) is measurable early, but frequency is not skill. *Whether asking tracks need* (λ) takes ~400 help-eligible windows. At ~10-15 eligible steps per session [U], that is about 2-3 months.

**Validity concerns.**
- KT noise attenuates λ.
- The Director's policy changes eligibility (§3.4).
- In Indian classrooms, asking an adult may carry deference or shame norms [U: MS9]. A voice tutor may lower the threshold (an anonymous, non-judgemental helper) or reproduce it.
- "Pata nahi" is ambiguous between a help request, disengagement and a genuine answer. It is classified only with context (preceding attempt, latency).

**Parents.**
- "Asked to have it explained again {a} times; asked for a hint {h}; asked for the answer {y}" (per month, with the previous month).
- "When stuck after two tries, asked for help {p} of {q} times".
- Plus one home suggestion from §7.3.
- Never "doesn't ask for help" or "gives up". λ wording only after MS4.

### 4.5 Planning (S7)

**Definition.** Forethought: goal-setting and strategic planning before acting. It is the first phase of the cyclical SRL model (Zimmerman 2002) [V], also COPES/Winne & Hadwin [S], and part of metacognitive skilfulness (Veenman).

**Trajectory.**
- Metacognitive skilfulness (planning, monitoring, evaluation from think-aloud) grows across grades 4-8 and contributes to learning partly independent of intelligence (Veenman et al. 2004; van der Stel & Veenman 2008, 2010) [V].
- Its growth from 12 to 15 is non-linear, with a temporary plateau around 15 (van der Stel & Veenman 2014) [V].
- Teachers spend little time explicitly teaching metacognitive strategies, especially in primary school (Dignath & Büttner 2018) [V].
- Planning as an executive function (Tower tasks) sits with CD §3.

**Indicators.**
1. **Plan prompt** before a multi-step problem (≤ 1 per session, B3+; B2 optional): a prompt *shape* asking how they will start. Responses get a rubric score: 0 none or "pata nahi"; 1 names a first step; 2 names an ordered sequence or a checking step. LLM-graded with a rubric confusion matrix folded in, as KT §1.3.
2. **Pre-action latency ratio:** median latency to first action on multi-step items over single-step items, within child (CD lognormal model).
3. **Plan execution:** did the attempt follow the stated plan? Rubric, research only.
4. **Game telemetry:** first-move latency and moves-to-optimal in planning games (CD).
5. **Goal-setting:** one-week child goals for 12-15 (need-goals) and whether they were met.

**Model.**
- Plan quality q ∈ {0, 1, 2} uses an ordinal hierarchical model with a band prior, a child effect and a problem-type effect.
- The latency ratio uses a log-scale hierarchical model. Its interpretation is *ambiguous*: longer pre-action time can mean planning or confusion, so it is never reported alone.

**Validity.** The plan prompt is itself an intervention (IMPROVE-style self-questioning) [V, §5]. LLM rubric grading is noisy (KT §1.3). Think-aloud is the gold standard (Veenman & van Cleef 2019) [V], and voice gives Taxila a partial think-aloud channel, which is a research opportunity (H7).

**Parents.** B3-B4: "Before starting a long problem, said how she would begin {p} of {n} times (was {p′} of {n′})". No planning "ability" statements.

### 4.6 Effort regulation (S8)

**Definition.** Maintaining effort when a task is hard or dull, and allocating effort to where it pays. In university students, effort regulation is one of three non-intellective correlates of GPA with a medium-sized correlation (Richardson, Abraham & Bond 2012) [V; r ≈ .32 from memory, U]. MH M4 covers persistence after error; this section covers *allocation* and *disengagement*.

**Evidence, children.**
- 7-12-year-olds discount effort by difficulty but not by age. Effort valuation was predicted by actual effort engagement and not by success, so "poor performance may often reflect reluctance to engage cognitive effort rather than low ability" (Chevalier 2018, N = 73) [V].
- Rapid guessing is "a choice by the test taker to momentarily opt out of being measured" (Wise 2017) [V]. Response-time effort (RTE) has supportive reliability and validity evidence (Wise & Kong 2005) [V]. Rapid guessing rises with text length and item position (Wise et al. 2009) [V].
- Persistence can be measured behaviourally as time on unsolved problems, and it correlated with self-report (Ventura et al. 2013) [V].
- Not all persistence is good: wheel-spinning is unproductive persistence, distinguishable from productive persistence in games and tutors (Owen et al. 2019; Kai 2018) [V]. Wheel-spinning is mostly a prerequisite problem (Wan & Beck 2015) [V].

**Indicators.** All are latencies after the TTS end on the device (LS rule 8); taps for MCQ.
- rapid-response share per session, against item-type thresholds
- time-difficulty slope: does solution time rise with item difficulty?
- productive versus unproductive persistence per (child, skill) episode
- end-of-session decay in solution time and accuracy.

**Model.**
```
rapid responding (Wise-style, per item type m):  rapid_{ck} = 1[t_{ck} < T_m],  T_m = 10% of median solution time or a mixture-based cut [U]
lognormal mixture: log t_{ck} ~ π_c·N(μ_R, σ_R²) + (1−π_c)·N(τ_c + β_k, σ_c²)        (solution behaviour = CD §2.5 lognormal)
effort allocation:  log t_{ck} (solution component) = τ_c + β_k + ζ_c·b_k,   ζ_c > 0 ⇒ more time on harder items
persistence episode outcome (per child × skill): productive (mastery ≤ 10 opportunities) vs wheel-spin (Beck & Gong criterion, KT §2.6)
```
**Use.**
- π_c drives the evidence-validity flag (KT gaming tempering, LS P22) and Director actions (smaller step, a break, a choice).
- ζ_c is research only.
- Wheel-spinning triggers prerequisite probing first (MS-D13).

**Validity.** Fast correct answers by experts are not rapid guesses: the cut is applied only to *incorrect* or MCQ answers, or to answers under T_m where accuracy is at chance [U]. Device and pipeline latency confound response times (CD §2.4). Gaming detectors can drift and lose validity (Levin et al. 2022; Huang 2022) [V].

**Parents.** Only what Taxila did: "when answers got very quick and mostly wrong, Taxila switched to {action} {n} times". Never "careless", "lazy" or "not trying".

### 4.7 Evaluation and reflection (S10)
- **Evidence.**
  - Preschool *postdictions* were accurate even when predictions were not (Lipko 2009) [V].
  - Self-assessment and peer assessment improve SRL strategies and affect (g = .205-.683; Yan, Panadero et al. 2026, 75 studies) [V]. Rubrics improve performance (g = .45; Panadero et al. 2023) [V].
  - A structured diary *alone* did not help university students, and lowered motivation; diary plus SRL information did help (Fabriz et al. 2014) [V].
  - Giving middle-schoolers the correct definition as a standard reduced overconfidence in self-scoring (Lipko, Dunlosky et al. 2009) [V].
- **Taxila use:** an end-of-session "kaisa raha?" plus, for B3+, one "what helped you?" shape. The reply is compared *with the record in front of the child* (the standard), in counts. That makes it a calibration *exercise*, not a measure. It is not reported to parents, because evaluations are social and reactive [U].

---

## 5. Interventions that work for children, and what Taxila does with each

### 5.1 Meta-analytic baseline

| synthesis | population | effect | moderators that matter for Taxila |
|---|---|---|---|
| Dignath & Büttner 2008 [V] | 49 primary + 35 secondary studies, 357 effect sizes | mean 0.69 | researcher-led > teacher-led; mathematics > reading/writing |
| Dignath, Büttner & Langfeldt 2008 [V] | primary, 48 comparisons | effective "even at primary school level" (value [S]) | metacognitive reflection + motivation components [S] |
| de Boer, Donker & van der Werf 2014 [V] | learning-strategy instruction | moderated by implementer, duration | **smaller on standardised tests** than on researcher-made tests |
| Zheng 2016 [V] | computer-based SRL scaffolds, 29 articles, n = 2,648 | 0.438 | domain-general and domain-specific scaffolds both work |
| Dignath et al. 2023 [V] | monitoring tools, 32 studies | achievement .42; SRL .19; motivation .17 | content + behaviour monitoring; stimulate metacognitive monitoring; feedback on entries |
| Bisra et al. 2018 [V] | self-explanation prompts, 69 effect sizes | g = .55 | across tasks and levels |
| Panadero et al. 2023 [V] | rubrics | g = .45 (performance) | with self-/peer assessment |
| Dent & Koenka 2016 [V] | correlational, K-12 | metacognitive processes r = .20 | grade level and measure type moderate |
| Perry, Lundie & Golder 2019 [V] | > 50 school studies (EEF context) | "very positive" when well taught | wellbeing evidence thinner |

Effects on the *SRL process itself* (d ≈ .19) are much smaller than effects on achievement (d ≈ .4-.7). The likely reasons are measurement weakness (§3.1) and the fact that tools improve learning partly without changing measured SRL. Taxila should expect SRL indices to move slowly even while learning improves.

### 5.2 Child-specific trials

| intervention | age / grade | result | Taxila move | confidence |
|---|---|---|---|---|
| Metacognitive questions inside a lesson | grades 1-2, n = 135, RCT | higher accuracy and monitoring at post and at 2-week retention; transfer sometimes; no effect on control (Fyfe et al. 2022) [V] | the bet and "how could we check?" shapes inside the lesson state machine, B1+ | High |
| Hypercorrection after confident errors | grades 3-6 | high-confidence errors more likely corrected (Metcalfe & Finn 2012) [V] | bet → feedback → the corrected item reappears in LOT's next delayed check | High |
| Metacognitive (calibration) feedback | 7 y, 6 sessions | monitoring improved, memory did not (Buehler 2025) [V] | B2+: show "you said pakka, you were right" in counts | Medium |
| Same, younger | 6 y, 12 sessions | no improvement in monitoring (Kolloff 2025) [V] | B1: no calibration feedback; postdiction and "check with the answer" only | Medium (as a null) |
| Delayed keywords before judging | grades 6-7 (not 4) | better metacomprehension and study regulation (de Bruin 2011) [V] | B3+: "say three key words" before "kal yaad rahega?" | Medium |
| Concept mapping | grade 7 | reduced illusion of knowing (Redford 2012) [V] | B4 optional (Forge concept-map module) | Low-Medium |
| Standards for self-scoring | middle school | providing the correct answer reduced overconfidence (Lipko 2009) [V] | always show the standard after a self-evaluation | High |
| Help Tutor | high-school geometry | better and lasting help-seeking; no domain gain (Roll 2011; Aleven 2016) [V] | no nagging help feedback; shape the *ladder* (MS-D5, MS-D7) | Medium |
| Delayed hints for gaming-prone students | ASSISTments RCT | differential benefit (Vanacore 2024) [V] | if P22 fires: delay the next hint by one attempt [U] | Low-Medium |
| IMPROVE self-questioning (comprehension, connection, strategy, reflection) | grades 7-8, n = 384 | outperformed controls, especially with cooperation (Mevarech & Kramarski 1997; Kramarski & Mevarech 2003) [V] | B3-B4 question shapes in problem solving; the plan prompt (§4.5) | Medium |
| Teachable agent (protégé effect) | grades 5 and 8 | more effort and learning, largest for lower achievers (Chase et al. 2009); Betty's Brain over 10 years (Biswas 2016) [V] | teach-back (LS P1) framed as teaching the tutor's "student" [U: India test] | Medium |
| Strategy training + incentive | grades 4-5, n = 35 | better performance, confidence, calibration (Gutierrez de Blume 2017) [V] | small n; incentives are excluded (MI no-reward) | Low |
| Metacognitive/affective support in a maths ITS | middle school, Wayang Outpost | engagement and affect gains attributed to metacognitive components (Arroyo et al. 2014) [V] | progress views (MWR) are the analogue | Low-Medium |
| Theory-based debiasing ("how memory works") | adults | transferred to new items (Koriat & Bjork 2006) [V] | B3+: one-clause explanations of why testing beats rereading, then let them choose | Medium (extrapolated) |

### 5.3 Age-gated training policy (MS-D12)

| band | default moves | not used |
|---|---|---|
| B1 6-7 | bets as faces; postdiction ("how did that one go?") then show the answer; "let's check together"; a worked example before planted errors | calibration feedback summaries; plan prompts; JOLs |
| B2 8-9 | the B1 moves + calibration feedback in counts, monthly ("pakka and right {a} of {n}"); an "explain again" versus "hint" choice made explicit | explicit strategy lectures |
| B3 10-12 | + delayed keywords before JOLs; IMPROVE-style question shapes; plan prompt ≤ 1 per session; "quiz me / explain again" choices; theory-based memory explanations | grading the child's plan aloud |
| B4 13-15 | + one-week goals with if-then plans (need-goals); their own calibration chart if they want it; concept-map option | any league table or comparison |

**Guardrails for every band:** no stakes on bets; no penalty for help (MS-D6); answers only after the ladder (MS-D7); confusion allowed on a timer (LS rule 10). Never tell a child they are "overconfident". Feedback is about the item ("this one was tricky"), never the self.

---

## 6. The SRL profile over time: data, joint model, growth

### 6.1 Data contract (new fields marked ✚; the rest are emitted by KT, LS or MH)
```ts
// shared/contracts.ts (proposed additions)
type MetaEvent =
 | { kind: 'bet'; itemKey: string; skillIds: string[]; level: 0 | 1 | 2; via: 'voice' | 'tap'; asrConf?: number;
     latencyMs: number; firstOutcome: 'C0' | 'other'; graderVersion: string; sampledTercile: 0 | 1 | 2 }   // ✚
 | { kind: 'jol'; skillId: string; level: 0 | 1 | 2; delayMin: number; keywordsFirst: boolean }              // ✚
 | { kind: 'help'; initiator: 'child' | 'tutor' | 'parent'; reqType: 'explain_again' | 'hint' | 'answer' | 'check' | 'other';
     errorsOnStep: number; rungBefore: number; pL: number; eligible: boolean; dwellAfterMs?: number }       // ✚ (eligible = policy waited)
 | { kind: 'selfcorr'; dir: 'W2R' | 'R2W' | 'W2W'; asrSplitSuspect: boolean }                                 // ✚
 | { kind: 'choice'; options: string[]; chosen: string; needByOption: number[]; offeredBecause: string }     // ✚
 | { kind: 'plan'; problemKey: string; rubric: 0 | 1 | 2; grader: 'llm'; graderVersion: string }             // ✚
 | { kind: 'pass'; itemKey: string; laterOutcome?: 'C0' | 'other' };                                          // ✚ research arm only
// every MetaEvent carries childId, sessionId, at, band, domain, startedBy (MH-D4)
```
None of these is a label. All of them are raw behaviour plus the system context needed to interpret it (initiator, eligibility, sampling).

### 6.2 Joint hierarchical model (research layer; offline, monthly)
- **Child-level latent vector.** z_c(t) = (κ_c, ψ_c, ψ_JOL,c, π_selfcorr,c, η_c, λ_c, q_plan,c, π_rapid,c), each with a band-specific population mean μ[band(t)].
- **Change over time.** z_c(t) = z_c0 + z_c1·(age_t − age_0) + band drift, with a correlated random intercept and slope (a multivariate growth model). This sits within the session-level measurement models of §4.
- **Development versus learning versus familiarity:**
  - age enters through μ[band] interpolated by age in months (MH §3.5)
  - *Taxila exposure* enters as cumulative sessions
  - *task familiarity* is a decaying term for the first 4 weeks of any new bet or prompt format [U]
  - all three must be in the model, or growth is misattributed (Bayard 2021) [V].
- **Cross-construct structure.** A low-dimensional factor (a "monitoring-control" factor) is *tested*, not assumed. Child metacognition is partly domain- and task-specific (§3.6), and the Schraw two-factor result is for adults [V]. If a factor is not supported (H2), constructs are reported separately and never summed into an "SRL score".
- **Reciprocal effects.** Does monitoring predict later learning? Use RI-CLPM or DSEM (dynamic structural equation modelling), never a plain CLPM (MH §1 item 3; Hamaker 2015) [V, sib]. The developmental anchor is Rinne & Mazzocco: calibration in grade 5 predicted arithmetic gains to grade 8 [V].

### 6.3 Showing growth (the rule set behind every "then → now")
1. **Windows:** 28-day windows; a change statement compares the current window with one ≥ 2 months earlier.
2. **Evidence:** posterior P(change in the stated direction) ≥ .9 in the §6.2 model, or the raw counts change consistently over ≥ 3 consecutive windows (= MH, LOT).
3. **Transfer check (MS-D8):** the improvement must also appear on a format or domain the child met less than a month ago. Otherwise the statement is scoped ("in the fractions bets") and withheld from the summary.
4. **Band drift is context, not credit.** If the band mean moves by the same amount, the statement says what changed without implying that Taxila caused it.
5. **Regression to the mean:** first-window extremes are shrunk before any comparison. The hierarchical model does this by construction.
6. **What counts as SRL growth** (all within-child):
   - offset κ moves toward 0 *without* resolution falling (B2+)
   - resolution ψ rises (B2+, after MS3)
   - more W→R self-corrections per answer
   - help shifts from `answer` toward `explain_again` / `hint`, and asks follow need (λ, after MS4)
   - more plan-rubric 1-2 responses (B3+)
   - a lower rapid-response share at equal difficulty
   - retrieval chosen more often when offered (B3+).

### 6.4 Estimability matrix (v1)

| construct | per-child estimable? | after how much data | v1 status |
|---|---|---|---|
| offset κ (S1) | yes | ~30 bets (~3 weeks) | ship as a table |
| resolution ψ (S2) | B2+, conditionally | ≥ 120 bets plus MS3 | research → ship |
| efficiency (meta-d′/d′) | **no** | > 400 bets | never per child |
| JOL resolution (S3) | not in v1 | > 6 months | research |
| self-correction (S4) | likely | weeks (opportunity-rich) [U] | ship as counts after MS5 |
| choice coupling (S5) | not in v1 | choices are rare | research |
| help counts by kind (S6) | yes, as counts | ≥ 10 child-initiated requests | ship |
| help-need coupling λ (S6) | conditionally | ~400 eligible windows | research → ship after MS4 |
| plan rubric (S7) | weakly | ≥ 10 prompts | counts, B3+ |
| rapid share (S8) | yes | weeks | system use; parents only as Taxila's actions |
| effort slope ζ (S8) | no | — | research |
| reflection (S10) | not measured | — | child-facing only |

---

## 7. What can be said to parents

### 7.1 The contract (extends LOT §7, CD §8.2, MH §6; every SRL statement must satisfy all of it)
1. describe behaviour, with numerator, denominator, window and domain
2. compare only with the child's own past
3. pass the growth rules of §6.3 for any change claim
4. say what Taxila is doing
5. carry at most one home suggestion (§7.3)
6. link to a "Kaise pata?" evidence view (items, bets and answers, dates)
7. pass the banned-wording gate (§7.4).

Slots are filled from numbers only. The LLM fills shapes; it never invents a pattern (the inherited law: write shapes, not lines).

### 7.2 Allowed statement shapes

| construct | shape (slots) | threshold |
|---|---|---|
| calibration (S1) | in {domain}: said "pakka" {n1} times, right {a1}; "shayad" {n2}, right {a2}; "andaaza" {n3}, right {a3}. (In {month}: …) | ≥ 30 bets in the domain; B1 adds the fixed normalising note |
| calibration change (S1/S2) | her "pakka" was right {a/n} now vs {a′/n′} in {month} | §6.3 rules; ≥ 30 bets in each window |
| resolution (S2) | {pick from fixed set}: "her 'shayad' answers are wrong more often than her 'pakka' ones — she can tell when to double-check" | B2+, ≥ 120 bets, MS3 passed |
| self-correction (S4) | fixed her own mistake before being told {k} of {n} answers that needed it | ≥ 10 W→R opportunities |
| error spotting (S4) | caught the teacher's planted mistake {a} of {b} times, on topics she knows well | b ≥ 5 |
| help by kind (S6) | asked to explain again {e}; for a hint {h}; for the answer {y}. Answer requests go through hints first | ≥ 10 child requests |
| help when stuck (S6) | when stuck after two tries, asked for help {p} of {q} times | q ≥ 10 |
| planning (S7) | before a long problem, said how she'd start {p} of {n} times | B3+, n ≥ 10 |
| strategy choice (S9) | chose "quiz me" {q} of {c} times when offered | B3+, c ≥ 10 |
| effort (S8) | when answers got very fast and mostly wrong, Taxila switched to {action} {n} times | always as a system action |

**The SRL growth card** (monthly, at most 4 rows, only rows that pass thresholds):
```
[Then → now]    {construct shape} {month A} → {month B}            (only §6.3-passing rows)
[What we do]    {Taxila action tied to the row}                      e.g., "more 'how sure?' moments in fractions"
[At home]       one §7.3 suggestion matched to the row
[Kaise pata?]   link to items, bets and dates
[Still learning] the constructs without enough data yet, named plainly (honest uncertainty, LOT §7 principle 6)
```

### 7.3 Home suggestions (one per report; each is evidence-backed)
- **Ask "how sure are you?" and "how could we check?", rather than "is it right?"** These mirror the metacognitive-question lesson that helped grades 1-2 (Fyfe 2022) [V]. Pair them with showing the answer as the standard (Lipko 2009) [V].
- **Let her try first, then help, and help with a hint before an answer.** Trying before help supports learning (Roll 2014; Hays 2013) [V]. Answer-giving is the expedient pattern linked to decline (Ryan & Shim 2012) [V].
- **Support rather than control.** How parents are involved matters more than how much (Pomerantz et al. 2007) [V]. Trained homework involvement raised completion in elementary school, while correlational associations were *negative* in middle school (Patall et al. 2008) [V]. Mothers induced into an entity mindset were more controlling and performance-oriented (Moorman & Pomerantz 2010) [V].
- **Make asking for help safe.** Relatedness predicted increases in help-seeking, and concealment followed felt incompetence (Marchand & Skinner 2007) [V].
- **For 10-15: ask her to explain or teach a topic to you the next day.** This is retrieval plus teach-back (LS P1; LOT). It is the protégé effect at home (Chase 2009) [V].

### 7.4 Banned at every layer (English, Hindi, Hinglish; extends MH §6, VT §4.9, LOT §7)
- trait and character words: overconfident, careless / *laaparwah*, lazy / *aalsi*, impulsive, "doesn't think", "gives up easily", "too dependent", "can't plan", "poor self-control", "weak metacognition"
- scores: SRL score, metacognition score, calibration percentage as a grade, help-seeking index, any percentile or comparison with other children or siblings
- predictions: "will struggle in higher classes", "needs to learn to be independent"
- diagnoses or hints of diagnoses (ADHD, learning disability). The CD §7.3 flag-for-professional pathway is the only route, and calibration is never an input to it. The MLD calibration finding (Rinne & Mazzocco) is a group result [V].
- gendered framing of confidence. Gender differences in technology use and benefit exist at group level (Arroyo et al. 2013) [V], but no parent text may attribute a child's confidence to gender.

### 7.5 Child-facing
- Children see the work and their own calibration only as a game-like reflection for B2+ ("pakka-meter": how often your pakka was right), opt-in for B4.
- No child-facing summary uses the words above.
- The tutor's statements about the child are capability statements backed by KT (MI M.CAPABILITY).

---

## 8. Wellbeing guardrails specific to metacognition

| risk | why it matters | guard |
|---|---|---|
| Crushing young children's optimism | Optimism is normative at 6-8, and self-protective motives drive part of it (van Loon 2017) [V]. In adults a positive confidence bias goes with acting on intentions (Zajkowski et al. 2022) [V]. Persistence may depend on it [U] | B1: no calibration feedback summaries (MS-D12); feedback targets items, not the self |
| Turning learning into testing | Bets and prompts are reactive and take time | ≤ 3 bets, ≤ 1 plan prompt, ≤ 1 JOL per session; a total metacognitive-prompt budget of ≤ 10% of session turns [U] |
| Making help shameful | concealment cycles (Marchand & Skinner 2007) [V] | MS-D6; no "you used {n} hints" anywhere child-facing |
| Anxiety and underconfidence | Persistent "andaaza" on correct answers can be evaluation worry, not a monitoring deficit | route to MH §7 (sustained evaluation markers); never label; capability statements with evidence (MI) |
| Crutch dependence on the AI | Bastani 2025; Fan 2025 [V] | MS-D7; transfer checks without help; the delayed unaided check is the learning outcome |
| Parent pressure from reports | Middle-school homework involvement correlates negatively with achievement (Patall 2008) [V] | at most one suggestion; autonomy-supportive framing; MH10-style test of report variants (MS10) |

Rule: any experiment arm that raises a measured SRL index *and* raises MH §7 compulsion or avoidance markers beyond threshold fails (= MH-D10).

---

## 9. Research programme: what could be published

All studies need preregistration, ethics review with a child-safeguarding advisor, a separate research-consent scope, and pseudonymised data. Every arm keeps the evidence-based core (LS §8.4). Negative results are published and change the product.

| id | hypothesis / estimand | design | analysis | contribution |
|---|---|---|---|---|
| H1 | Bet frequency (1 vs 3 per session) changes delayed learning (hypercorrection) and κ/ψ trajectories | micro-randomised bet frequency within child | MRT, delayed-check outcome; §4.1 model | first in-tutor test of confidence-bet reactivity in children 6-15 |
| H2 | Structure of child SRL from traces: is there a monitoring-control factor, and does it differentiate with age? | natural data, ≥ 500 children per band | multilevel factor models; measurement invariance across bands | the trace-based analogue of Veenman's generality question, at intensive-longitudinal scale |
| H3 | Roll 2014 replicated for children: within-child effect of asking versus trying on the same skill, by prior knowledge and band | natural variation + randomised hint-delay arm | skill-level local learning (Roll 2014) with KT | does "try first" hold for 6-9-year-olds? |
| H4 | Calibration predicts later learning gains beyond θ (Rinne-Mazzocco in Indian children) | longitudinal | RI-CLPM / DSEM on monthly κ, ψ, θ | first longitudinal calibration-learning evidence outside the US/Europe, ages 6-15 |
| H5 | Age gating of metacognitive training: calibration feedback in B1 vs B2 vs B3 | randomised feedback type (none / performance / metacognitive), Buehler-Kolloff design | ψ change and delayed learning; band interaction | resolves the 6 vs 7 conflict (Kolloff 2025 null vs Buehler 2025 positive) at scale |
| H6 | Theory-based memory explanations raise retrieval choices (transfer of debiasing) | randomise the explanation's presence before choice offers | ρ_c change; delayed retention | Koriat & Bjork 2006 in children |
| H7 | Voice as think-aloud: do spontaneous metacognitive utterances (plan, monitor, evaluate), coded from transcripts, predict learning beyond outcomes? | human-coded subsample + LLM coder with measured agreement | hierarchical models; coder κ reported | a scalable on-line metacognition measure for children (Veenman's gold standard, automated) |
| H8 | Help request kinds (explain-again vs answer) by band; effect of the answer-through-ladder rule on expedient requests over months | natural data + rule A/B in a pilot | trajectory models; ITT | developmental help-seeking from an AI tutor; the AI-crutch question in children |
| H9 | Parent SRL growth cards change parent behaviour (fewer answer-giving reports, more "how sure?" questions) without raising child stress | randomise card variants | parent diary + child markers (MH §7) | first test of metacognition-focused parent reporting |

---

## 10. Measurements this design depends on

| id | question | method | decides | bar |
|---|---|---|---|---|
| MS1 | Do "pakka / shayad / andaaza" (and faces for B1) mean ordered confidence to Indian children of each band, in Hindi and English? | cognitive interviews (n ≈ 40) + ordering task; ASR WER on the three words | §3.7 wording | ordered in ≥ 90% of children; WER < 5% |
| MS2 | κ̂ and ψ̂ predictive validity | κ̂/ψ̂ vs hypercorrection, control coupling and delayed gains, net of θ | MS-D1, MS-D3 | ψ̂ adds ΔAUC ≥ .02 for delayed gains |
| MS3 | Real split-half and test-retest of κ̂ and ψ̂ by bet count and band | odd/even and consecutive windows | §7.2 thresholds | ≥ .70 at the stated N |
| MS4 | Help lexicon accuracy; λ̂ reliability; eligible-window counts per session | 500 hand-labelled requests per band; consecutive windows | §4.4, MS-D4 | lexicon F1 ≥ .85; λ̂ ≥ .65 |
| MS5 | Self-correction detection versus ASR turn-splitting | human-labelled audio subsample | §4.3 shipping | precision ≥ .9 |
| MS6 | Bet reactivity and safety | H1 pilot | MS-D2 | no delayed-learning loss; no rise in avoidance markers |
| MS7 | Task-familiarity term size | new-format versus old-format comparisons | MS-D8 transfer rule | familiarity < 25% of the observed 3-month change |
| MS8 | Do B4 children's own choices beat the scheduler? | randomised honour/dishonour of choices (Metcalfe & Finn design) | MS-D11 | non-inferior on delayed outcomes |
| MS9 | Indian help-seeking norms with a voice tutor (shame, deference, parent presence) | mixed methods, n ≈ 40 families + logs | interpretation of η, λ | qualitative report before help text ships |
| MS10 | Do SRL growth cards help or pressure? | H9 | §7 shipping | no rise in parent-pressure items or child avoidance |

---

## 11. Invariants (eval-gated; "if your change trips them, your change is wrong")

| id | predicate | method |
|---|---|---|
| MSI1 | No parent- or child-facing string contains a §7.4 banned term, an SRL score, a percentile or a cross-child comparison | lexicon gate (English, Hindi, Roman Hindi), shared with MHI1 |
| MSI2 | No feature, model or report uses raw (confidence − accuracy) bias | code audit; unit test that bias is computed only via κ̂_mid or the §4.1 model |
| MSI3 | Bets are drawn stratified across predicted-difficulty terciles, ≤ 3 per session, never with stakes | log audit per release |
| MSI4 | No help event changes stars, points, mastery display or streak-like UI | UI and state audit (= MI2) |
| MSI5 | "Answer" requests never yield the final answer before the ladder is exhausted | code-level answer-leak check (= LS rule 15) |
| MSI6 | Every help event carries `initiator` and `eligible`; λ is fitted on eligible windows only | schema + analysis-code test |
| MSI7 | Resolution statements are impossible for B1 and for < 120 bets | report-generator unit test |
| MSI8 | Change statements satisfy §6.3 (posterior ≥ .9 or ≥ 3 windows, plus the transfer check) | report-generator unit test (= MHI7) |
| MSI9 | Every SRL metric carries a reliability card (ρ, n, method, date, band) before any person or prompt sees it | = CD9 |

---

## 12. Open questions

1. **Which confidence wording works in Hinglish for 6-year-olds?** Faces versus words, and does the voice of an adult-like tutor bias "pakka"? (MS1)
2. **Should young children's bets be prospective ("can you do this one?") rather than retrospective?** Bayard 2021 suggests retrospective develops first, so v1 uses retrospective [V]. MH uses prospective for efficacy. Do both per child, or alternate?
3. **Parent-assisted sessions.** If a parent sits beside a B1 child, help requests and bets partly reflect the parent. Should `startedBy` and a "parent present" flag gate SRL statements? (MH-D4 analogue)
4. **The voice think-aloud channel (H7).** How much of Veenman's on-line measurement can an LLM coder reproduce, with what agreement, in code-switched speech?
5. **Ethics of the "pakka-meter" for children.** Is self-calibration feedback motivating or discouraging for anxious children in B3-B4? MS6 and H5 should include anxiety markers as outcomes.
6. **Domain granularity.** Is "fractions" the right domain unit for κ and ψ, or does the child-domain variance live at the topic-type level (T1-T5)?
7. **Board and exam seasons.** Exam pressure may move confidence and help-seeking in ways that look like SRL change. Should exam windows be covariates or exclusions?

---

## 13. Proposed `context/` entries (for the main loop to merge)

- **decision** `calibration-two-numbers` (MS-D1), `bets-learning-move-first` (MS-D2), `resolution-needs-120-bets` (MS-D3), `help-coupling-research-only` (MS-D4), `try-first-protected` (MS-D5), `help-never-costs` (MS-D6), `answer-through-ladder-counted` (MS-D7), `srl-growth-needs-transfer-check` (MS-D8), `no-srl-labels` (MS-D9), `no-metacog-questionnaires` (MS-D10), `scheduler-keeps-control` (MS-D11), `age-gated-metacog-training` (MS-D12), `wheelspin-system-first` (MS-D13). Each carries its reversal condition from §0.
- **measurement** `calibration-reliability-sim-2026-10-02`: n = 2,000 simulated children per band; method `metacognition-srl-calibsim.py`, seed 11.
  - offset test-retest .73-.75 at 30 bets, .92 at 120
  - ΔConf .36-.57 at 30, .72-.85 at 120 (.65 at 120 if SD(ψ) = 0.15)
  - raw-bias × ability r = −.53 to −.74 with independent truth
  - help-coupling λ̂ test-retest .21 / .51 / .66 / .79 at 50 / 200 / 400 / 800 opportunities
  - assumptions [U].
- **measurement** (external, for comparison) `rahnev-2025-metacog-test-retest`: Confidence Database, Haddara dataset (70 participants, 6 days). M-Ratio ICC .16/.23/.29/.42 at 50/100/200/400 trials; ΔConf .39/.53/.65/.75; mean confidence > .86 [V-full].
- **rejected**
  - `raw-bias-as-overconfidence-measure`: ability-confounded by construction (sim B; Guggenmos 2021).
  - `per-child-metacognitive-efficiency`: > 400 trials needed (Guggenmos 2021; Rahnev 2025).
  - `metacognition-questionnaires-for-children`: poor validity (Veenman & van Cleef 2019; Craig 2020).
  - `child-chosen-restudy-as-scheduler`: grade 3 choices random (Metcalfe & Finn 2013).
  - `help-seeking-feedback-agent-for-learning-gains`: improves help-seeking, not learning (Roll 2011; Aleven 2016).
  - `calibration-feedback-for-6-year-olds`: null after 12 sessions (Kolloff 2025).

---

## 14. References

**Development of monitoring and control.**
Lyons KE, Ghetti S 2011, *Child Dev*, doi:10.1111/j.1467-8624.2011.01649.x, PMID 21954871 [V] · Wan Q et al. 2025, *Child Dev*, doi:10.1111/cdev.70029, PMC12598454 [V] · Leckey S et al. 2025, *Child Dev*, doi:10.1111/cdev.14174, PMC11693819 [V] · Destan N, Roebers CM 2015, *Metacogn Learn*, ERIC EJ1081621 [V] · Destan N, Spiess MA, de Bruin A, van Loon M, Roebers CM 2017, *Metacogn Learn*, ERIC EJ1160460 [V] · van Loon M, Destan N, Spiess M, Roebers C 2017, AERA paper repository (6- vs 8-year-olds, self-protection) [V] · Bayard NS, van Loon MH, Steiner M, Roebers CM 2021, *Child Dev* (cross-sectional and longitudinal, N = 305) [V] · Buehler FJ, Ghetti S, Roebers CM 2025, *J Cogn Enhanc*, doi:10.1007/s41465-025-00322-8, PMC12122647 [V] · Kolloff K, Ger E, Roebers CM 2025, *Metacogn Learn*, doi:10.1007/s11409-025-09422-4, PMC12141379 [V] · Lipko AR, Dunlosky J, Merriman WE 2009, *J Exp Child Psychol*, ERIC EJ838279 [V] · Wall JL, Thompson CA, Dunlosky J, Merriman WE 2016, *Dev Psychol*, ERIC EJ1115978 [V] · Rinne LF, Mazzocco MMM 2014, *PLoS One*, doi:10.1371/journal.pone.0098663 [V] · Grenell A, Nelson LJ, Gardner B, Fyfe ER 2022, *Cogn Dev*, doi:10.1016/j.cogdev.2022.101167 [V] · Grenell A, Butts JR, Levine SC, Fyfe ER 2024, *J Exp Child Psychol*, doi:10.1016/j.jecp.2024.106003 [V] · Greene NR et al. 2024, *J Exp Psychol Gen*, doi:10.1037/xge0001551, PMC12036004 [V] · Moses-Payne ME et al. 2021, *Dev Sci*, doi:10.1111/desc.13101, PMC8612133 [V] · Vo VA, Li R, Kornell N, Pouget A, Cantlon JF 2014, *Psychol Sci*, doi:10.1177/0956797614538458 [V] · Metcalfe J, Finn B 2012, *Learn Instr*, ERIC EJ964332 [V] · Metcalfe J, Finn B 2013, *Metacogn Learn*, ERIC EJ996258 [V] · Koriat A, Ackerman R, Lockl K, Schneider W 2009, *J Exp Child Psychol*, ERIC EJ869742 [V]; and *Cogn Dev*, ERIC EJ839233 [V] · Hoffmann-Biencourt A et al. 2010, *Br J Dev Psychol*, ERIC EJ906898 [V] · Serko D, Leonard J, Ruggeri A 2025, *Child Dev*, doi:10.1111/cdev.14268 [V] · van Loon M, Laninga-Wijnen L 2025, *J Res Adolesc*, doi:10.1111/jora.70072 [V] · Markovich V et al. 2026, *J Intell*, PMC13027792 [V] · Chen J et al. 2026, *J Intell*, doi:10.3390/jintelligence14080178 [V] · Schneider W 2008, *Mind Brain Educ*, ERIC EJ835177 [V] · West E, Baer C, Yu L, Odic D 2025, *Dev Sci*, doi:10.1111/desc.13617 [V] · Veenman MVJ, Wilhelm P, Beishuizen JJ 2004, *Learn Instr*, ERIC EJ731625 [V] · van der Stel M, Veenman MVJ 2008, ERIC EJ786719; 2010, ERIC EJ883444; 2014, *Eur J Psychol Educ*, ERIC EJ1036469 [V] · Whitebread D et al. 2009, *Metacogn Learn*, ERIC EJ827763 [V] · Roebers CM et al. 2012 (EF, metacognition, self-concept, grade 1-2) [V-abstract partial]

**Measurement of metacognition.**
Fleming SM, Lau HC 2014, *Front Hum Neurosci*, doi:10.3389/fnhum.2014.00443 [V] · Guggenmos M 2021, *Neurosci Conscious*, doi:10.1093/nc/niab040, PMC8633424 [V-full] · Rahnev D 2025, *Nat Commun*, doi:10.1038/s41467-025-56117-0, PMC11735976 [V-full] · Schraw G 2009, *Metacogn Learn*, ERIC EJ827760 [V] · Schraw G, Kuch F, Gutierrez AP 2013, *Learn Instr*, ERIC EJ1002057 [V] · Masson MEJ, Rotello CM 2009, *JEP:LMC*, ERIC EJ831506 [V] · Gignac GE, Zajenkowski M 2020, *Intelligence* (title via 2023 comment, doi:10.1016/j.intell.2023.101732) [S] · Kruger J, Dunning D 1999 [S, via Callender 2016] · Maniscalco B, Lau H 2012 (meta-d′) [S, via Rahnev 2025] · Murphy AH 1973 (Brier decomposition) [U]

**SRL theory, self-report vs traces.**
Zimmerman BJ 2002, *Theory Pract*, ERIC EJ656632 [V] · Winne PH 2004, ERIC EJ724153; 2010, *Educ Psychol*, ERIC EJ902593 [V] · Roll I, Winne PH 2015, *J Learn Anal*, ERIC EJ1126934 [V] · Zhou M, Winne PH 2012, *Learn Instr*, ERIC EJ978025 [V] · Rovers SFE et al. 2019, *Metacogn Learn*, ERIC EJ1213679 [V] · Veenman MVJ, van Cleef D 2019, *ZDM*, ERIC EJ1222654 [V] · Craig K et al. 2020, *Metacogn Learn*, ERIC EJ1259737 [V] · Ohtani K, Hisasaka T 2018, *Metacogn Learn*, ERIC EJ1187774 [V] · Dent AL, Koenka AC 2016, *Educ Psychol Rev*, ERIC EJ1110189 [V] · Segedy JR, Kinnebrew JS, Biswas G 2015, *J Learn Anal*, ERIC EJ1126937 [V] · Lajoie SP 2008, ERIC EJ817569 [V] · Efklides A 2006, ERIC EJ800695; 2017, ERIC EJ1143721 [V]

**Illusions of competence and strategy choice.**
Koriat A, Bjork RA 2005, *JEP:LMC*, ERIC EJ689198 [V]; 2006, ERIC EJ743255 [V] · Kornell N, Bjork RA 2009, *JEP:Gen*, ERIC EJ860919 [V] · Karpicke JD 2009, *JEP:Gen*, ERIC EJ860923 [V] · Rivers ML 2021, *Educ Psychol Rev*, ERIC EJ1310156 [V] · Hays MJ, Kornell N, Bjork RA 2013, *JEP:LMC*, ERIC EJ1008661 [V] · Deslauriers L et al. 2019, *PNAS*, doi:10.1073/pnas.1821936116 [V] · Dunlosky J, Rawson KA 2012, *Learn Instr*, ERIC EJ964388 [V] · de Bruin ABH, Thiede KW, Camp G, Redford J 2011, *J Exp Child Psychol*, ERIC EJ919448 [V] · Redford JS et al. 2012, *Learn Instr*, ERIC EJ964330 [V] · Thiede KW et al. 2012, *J Educ Psychol*, ERIC EJ993873 [V] · Bastani H et al. 2025, *PNAS*, doi:10.1073/pnas.2422633122 [V] · Fan Y et al. 2025, *Br J Educ Technol*, ERIC EJ1460793 [V] · Pardos ZA, Bhandari S 2024, *PLoS One*, doi:10.1371/journal.pone.0304013 [V]

**Help-seeking and gaming.**
Aleven V, Stahl E, Schworm S, Fischer F, Wallace R 2003, *Rev Educ Res*, ERIC EJ782605 [V] · Aleven V, Roll I, McLaren BM, Koedinger KR 2010, *Educ Psychol*, ERIC EJ902595 [V]; 2016, *IJAIED*, ERIC EJ1091255 [V] · Roll I, Aleven V, McLaren BM, Koedinger KR 2011, *Learn Instr*, ERIC EJ908875 [V] · Roll I, Baker RSJd, Aleven V, Koedinger KR 2014, *J Learn Sci*, ERIC EJ1044739 [V] · Koedinger KR, Aleven V 2007, *Educ Psychol Rev*, ERIC EJ785065 [V] · Wood H, Wood D 1999, *Comput Educ*, ERIC EJ608445 [V-abstract minimal] · Goldin IM, Koedinger KR, Aleven V 2012, EDM, ERIC ED537206 [V] · Salden RJCM et al. 2010, *Educ Psychol Rev*, ERIC EJ906658 [V] · Marchand G, Skinner EA 2007, *J Educ Psychol*, ERIC EJ754548 [V] · Skinner E, Pitzer J, Steele J 2013, ERIC EJ1019073 [V] · Ryan AM, Gheen MH, Midgley C 1998, *J Educ Psychol*, ERIC EJ576504 [V] · Middleton MJ, Midgley C 1997, ERIC EJ560303 [V] · Ryan AM, Shim SS 2012, *J Educ Psychol*, ERIC EJ994031 [V] · Shim SS, Kiefer SM, Wang C 2013, ERIC EJ1012005 [V] · Kilday JE, Ryan AM 2023, ERIC EJ1376140 [V] · Butler R 1998, *J Educ Psychol*, ERIC EJ587334 [V] · Newman RS 2000, *Dev Rev*, ERIC EJ613563; 2002, ERIC EJ656640 [V] · Puustinen M 1998, *Eur J Psychol Educ*, ERIC EJ586813 [V] · Puustinen M et al. 2008, *Learn Instr*, ERIC EJ788078 [V]; 2009, *Comput Educ*, ERIC EJ854612 [V] · Baker R, Walonoski J, Heffernan N, Roll I 2008, *J Interact Learn Res*, ERIC EJ789079 [V] · Dang SC, Koedinger KR 2020, EDM, ERIC ED608056 [V] · Huang Y et al. 2022, EDM, ERIC ED624075 [V] · Levin N et al. 2022, EDM, ERIC ED624076 [V] · Vanacore K et al. 2024, ERIC (grantee submission) [V] · Paquette L, Baker RS 2019, ERIC EJ1219256 [V] · Kai S et al. 2018, *J Educ Data Min*, ERIC EJ1183799 [V] · Wan H, Beck JB 2015, EDM, ERIC ED560558 [V] · Owen VE et al. 2019, EDM, ERIC ED599202 [V] · Beck JE, Gong Y 2013 [S, via Park 2023, ERIC EJ1377740]

**Effort regulation.**
Chevalier N 2018, *Child Dev*, ERIC EJ1184818 [V] · Wise SL, Kong X 2005, *Appl Meas Educ*, ERIC EJ724818 [V] · Wise SL 2017, *EM:IP*, ERIC EJ1162502 [V] · Wise SL, Pastor DA, Kong XJ 2009, ERIC EJ834164 [V] · Ventura M, Shute V, Zhao W 2013, *Comput Educ*, ERIC EJ1006982 [V] · Richardson M, Abraham C, Bond R 2012, *Psychol Bull*, ERIC EJ962899 [V; r value U] · Pardos ZA et al. 2014, *J Learn Anal* (affect and state tests) [V-abstract partial]

**Interventions.**
Dignath C, Büttner G 2008, *Metacogn Learn*, ERIC EJ817558 [V] · Dignath C, Büttner G, Langfeldt H-P 2008, *Educ Res Rev*, ERIC EJ813065 [V] · Dignath C, Büttner G 2018, ERIC EJ1187785 [V] · Dignath C, van Ewijk R, Perels F, Fabriz S 2023, *Educ Psychol Rev*, ERIC EJ1379416 [V] · de Boer H, Donker AS, van der Werf MPC 2014, *Rev Educ Res*, ERIC EJ1044437 [V] · Zheng L 2016, *Asia Pac Educ Rev*, ERIC EJ1101311 [V] · Bisra K et al. 2018, *Educ Psychol Rev*, ERIC EJ1186664 [V] · Panadero E et al. 2023, *Educ Psychol Rev*, ERIC EJ1403066 [V] · Yan Z, Lao H, Panadero E, Fernández-Castilla B 2026, *Assess Educ*, ERIC EJ1515032 [V] · Perry J, Lundie D, Golder G 2019, *Educ Rev*, ERIC EJ1219099 [V] · Fyfe ER, Byers C, Nelson LJ 2022, *J Educ Psychol*, doi:10.1037/edu0000715, PMC10153571 [V] · Lipko AR, Dunlosky J, Hartwig MK, Rawson KA 2009, *J Exp Psychol Appl*, ERIC EJ867031 [V] · Mevarech ZR, Kramarski B 1997, *AERJ*, ERIC EJ548387 [V] · Kramarski B, Mevarech ZR 2003, *AERJ*, ERIC EJ677680 [V] · Chase CC, Chin DB, Oppezzo MA, Schwartz DL 2009, *J Sci Educ Technol*, ERIC EJ855299 [V] · Biswas G, Segedy JR, Bunchongchit K 2016, *IJAIED*, ERIC EJ1091349 [V] · Arroyo I et al. 2014, *IJAIED* [V]; Arroyo I et al. 2013, *J Educ Psychol*, ERIC EJ1054448 [V] · Gutierrez de Blume AP 2017, *Cogent Educ*, ERIC EJ1168477 [V] · Gutierrez AP, Schraw G 2015, ERIC EJ1060472 [V] · Callender AA, Franco-Watkins AM, Roberts AS 2016, *Metacogn Learn*, ERIC EJ1106004 [V] · Miller TM, Geraci L 2011, ERIC EJ946398 [V] · Hacker DJ, Bol L, Bahbahani K 2008, ERIC EJ801242 [V] · Fabriz S et al. 2014, *Eur J Psychol Educ*, ERIC EJ1036510 [V] · Azevedo R, Cromley JG 2004, *J Educ Psychol*, ERIC EJ685011 [V] · Zajkowski W et al. 2022, *PLoS One*, doi:10.1371/journal.pone.0268501 [V]

**Parents and dashboards.**
Pomerantz EM, Moorman EA, Litwack SD 2007, *Rev Educ Res*, ERIC EJ782048 [V] · Moorman EA, Pomerantz EM 2010, *Dev Psychol*, ERIC EJ897242 [V] · Patall EA, Cooper H, Robinson JC 2008, *Rev Educ Res*, ERIC EJ896560 [V] · Molenaar I, Knoop-van Campen CAN 2019, *IEEE TLT*, ERIC EJ1247133 [V] · Knoop-van Campen CAN et al. 2024, *J Comput Assist Learn*, ERIC EJ1424190 [V-abstract partial] · Dizon-Ross R 2019, *AER*, doi:10.1257/aer.20171172 [V, sib: need-goals] · Hamaker EL et al. 2015 (RI-CLPM) [V, sib: motivation-habits]


---

## Methodologist review

**Reviewer stance:** an adversarial developmental psychologist and psychometrician. **Date:** 2026-10-02.

**Method.**
- Re-pulled 40 primary abstracts this session from the Europe PMC REST API and the ERIC API. Three full texts were read: Rahnev 2025, Guggenmos 2021, and Rinne & Mazzocco 2014.
  - Europe PMC: Rahnev 2025, Guggenmos 2021, Bayard 2021, Bastani 2025, Rinne & Mazzocco 2014, Kolloff 2025, Buehler 2025, Wan 2025, Fyfe 2022, Moses-Payne 2021, Greene 2024, Lyons & Ghetti 2011, Grenell 2022, Grenell 2024, West 2025, van Loon & Laninga-Wijnen 2025, Serko 2025, Vo 2014, Markovich 2026, Zhao et al. 2022, Double, Birney & Walker 2018, Double & Birney 2019a/b, Deslauriers 2019.
  - ERIC: Metcalfe & Finn 2012 and 2013, Roll 2014, Marchand & Skinner 2007, Ryan & Shim 2012, Dignath 2023, Koriat 2009, van der Stel & Veenman 2014, Schneider 2008, Dignath & Büttner 2008, Veenman & van Cleef 2019, Craig 2020, Zhou & Winne 2012, de Bruin 2011, Chevalier 2018, Richardson 2012, Wan & Beck 2015, Huang 2022, Fan 2025, Destan & Roebers 2015, Hoffmann-Biencourt 2010, Dent & Koenka 2016 and Lipko et al. 2009 (*JEP: Applied*).
- Web search was not available (the session budget was exhausted). Lipko et al. 2009 (*JECP*) timed out and was not re-checked.
- Ran five checks in `metacognition-srl-reviewsim.py`, saved in this folder (numpy, seed 7). Its generative assumptions are [U]. The arithmetic is reproducible.

**Overall verdict.** This document is unusually careful, and its main structure is right:
- traces over questionnaires
- no per-child efficiency estimate
- help never costs anything
- the scheduler keeps control
- no labels.

Most citations are read correctly. The serious problems are of four kinds:
- (a) The headline psychometric results come from a simulation whose generator *builds in* the properties being claimed. Under a standard signal-detection generator, "resolution" ψ is mostly type-1 knowledge, not monitoring (P1).
- (b) One branch of the growth rule produces false "then → now" rows for almost every child every year (P2).
- (c) Several evidence anchors use the very raw-bias index the document bans, or are adult, self-report or peer-help studies used to justify child-trace decisions (R1).
- (d) Three parent- and child-facing outputs reintroduce costs and labels that the document's own decisions forbid (E1-E3).

None of this needs a redesign. Several items must change before the spec workstream copies §6-§7.

### R1. Citation checks

| claim in doc | what the source says | verdict |
|---|---|---|
| Rahnev 2025: M-Ratio ICC .16/.23/.29/.42; ΔConf .39/.53/.65/.75; mean confidence > .86 | Exact match [V-full]. Two further points from the same paper. First, the five non-normalised measures, ΔConf included, "are strongly dependent on task performance". Second, test-retest came from **one** adult perceptual dataset (Haddara, n = 70), which Rahnev says "should be interpreted with caution". | Numbers correct. **Material omission.** The doc picks ΔConf for resolution *because* it is the most reliable, without saying that its reliability is partly borrowed from type-1 performance. That is the confound MS-D1 exists to avoid. See P1. |
| Guggenmos 2021: "test-retest"; "≥ 400 trials" | 400 is the "minimum recommended trial number" [V-full]. Rahnev 2025 notes that Guggenmos "computes split-half reliability but … calls it test-retest". Guggenmos also shows that **accuracy level dominates**: M-Ratio r ≈ .4 at ≤ 60% correct versus ≈ .8 at 80%, for 400-600 trials. | Relabel it as split-half. The accuracy dependence matters for Taxila. See P3. |
| Rinne & Mazzocco 2014 is the predictive anchor for κ̂/ψ̂ (MS2, H4, §6.2) | [V-full] N = 190 at grade 5, from one Baltimore County longitudinal cohort (86% of one ethnic group). The task was rapid **verification** (true/false judgements on arithmetic expressions), not answer production. The "calibration score" is a per-item 0-2 *absolute-accuracy* score. The authors note that high overall confidence "produce[s] a natural association between high accuracy and good calibration". Year-to-year ICC of mean calibration was .59. | **Construct mismatch.** The anchor is an accuracy-confounded absolute index, not an offset or a resolution. Controlling grade-5 accuracy, which is itself measured with error, leaves residual ability confounding. It supports "calibration-type indices predict gains". It does not support "κ or ψ predicts gains". |
| Markovich 2026: fluent grade-5 readers more overconfident | [V] N = 104, exploratory SEM. Overconfidence was indexed as **"confidence minus performance"**, the raw bias MSI2 bans. | Downgrade to "exploratory, raw-bias index". Do not use it as evidence for cue-driven overconfidence. |
| Destan & Roebers 2015: under-estimators out-monitor over-estimators | [V] N = 93 six-year-olds, grouped by *global performance-estimation accuracy*, which is a raw-bias-type grouping. | Read correctly, but it is the same artefact-prone index. Group differences may partly be ability differences. Note it wherever this study is cited (§0 MS-D9, §4.1, §4.3). |
| Wan 2025: "reliable performance monitoring appears by about 6" | [V] US sample, N = 148. Monitoring was reliable by 6 **"only on self-generated measures"**. Experimenter-elicited judgements did not show it. | **Omitted qualifier with direct design consequences.** Taxila's bet *is* an experimenter-elicited judgement. B1 bets may under-read monitoring. See E2. |
| Bayard 2021 (exec. summary item 2: "monitoring is not the bottleneck … turning it into action is") | [V] "Control remained suboptimal, **seemingly a consequence of overoptimistic monitoring**." The task was paired associates. | **Internal contradiction.** Bayard says monitoring *is* a bottleneck at 7-10. Metcalfe & Finn 2013 (delayed JOLs, target absent) say it is not. Rewrite item 2: the answer is paradigm-dependent. Delayed, target-absent judgements are accurate by grade 3. Immediate or retrospective ones stay optimistic. |
| Koriat 2009: memorising-effort cue "from grade 3; not grades 1-2" | [V] Correct: grades 3-6 (9-12 years) versus grades 1-2 (7-8 years). **Hoffmann-Biencourt 2010** (n = 160, grades 1-8, picture pairs) [V] found the inverse JOL-study-time relation even in young children, only *weaker*. | It is a gradient, not a step. In §4.1 the cue belongs from B2 (grade 3 ≈ age 8-9), not B3. |
| Marchand & Skinner 2007: "help-seeking declines across grades 3-6" | [V] N = 765, fall and spring of **one** school year. "Help-seeking generally declines across early adolescence" is the paper's *premise*. Its own finding is that age differences in motivational resources *paralleled* age differences in help-seeking. All measures are self- and teacher-reported coping. | Weaken it to "age differences, cross-sectional, reported". The doc's developmental help-seeking story rests on **questionnaire** data, which MS-D10 rules out as evidence for children. It is fine as a population prior. Say so. |
| Ryan & Shim 2012: "grades 6-7"; expedient help "predicted" decline | [V] **Peer** help-seeking, self-report, N = 655 (US, African American and European American), three waves at 6-month intervals across the elementary-to-middle-school transition. Expedient increases "were associated with" achievement declines. | Use "associated with", not "predicted", and name the transition, not grades. Asking an AI tutor for the answer is not shown to be the same construct as expedient peer help [U]. H8 is the test. |
| Roll 2014 for MS-D5 (protect try-first until ≥ 2 failures) | [V] **38 high-school students**, Geometry Cognitive Tutor, within-student and correlational. | Read correctly, but the doc uses it as a shipping threshold for 6-year-olds. Hays 2013 is adult word pairs. Keep MS-D5 as a *default*, but make the failure count band-specific: ≤ 1 failure for B1 with frustration markers [U]. Mark the rule [U for children] until H3. |
| Dignath 2023, d = .42, as evidence that **bets** are reactive (MS-D2, §3.5) | [V] The "tools" are learning journals, portfolios and rubrics: 32 studies, 3,492 participants, largest effects in *shorter* studies. | **Construct leap.** Use the direct evidence instead (all [V]): **Zhao et al. 2022, *Child Dev*** (190 Chinese children, grades 1/3/5): making JOLs raised retention, d = 0.40-1.33, with a larger effect in grade 5. **Double, Birney & Walker 2018** (meta-analysis): overall g = .054, n.s.; positive for related pairs and lists. **Double & Birney 2019, *PBR***: reactivity to confidence ratings was driven by the *word* "confident", and rephrasing removed it. That last finding bears directly on "pakka" wording, so add it to MS1. §4.2 "JOLs are reactive [U, adult literature]" is now [V] *in children*. |
| Fan 2025: ChatGPT "produced 'metacognitive laziness' signs" (MS-D7) | [V] 117 **university** students, a writing task. The abstract says ChatGPT "may promote dependence … and potentially trigger" metacognitive laziness. That is an interpretation, not a measured outcome. | **Overclaimed.** Keep Bastani 2025 as the evidence for MS-D7. Its figures (48% / 127% / −17%, nearly 1,000 Turkish high-school students) are correct [V]. Cite Fan as speculation from adults. |
| Wan & Beck 2015: "wheel-spinning is mostly a prerequisite problem" (§4.6) | [V] There is a strong gradient (50% versus 10%). But adding prerequisite performance moved detection only from AUC .884 to .888 (R² .264 → .268). | "Strongly associated with weak prerequisites" is supported. "Mostly a prerequisite problem" is not. MS-D13's action (probe prerequisites first) is still a reasonable default. |
| Craig 2020 | [V] The doc omits the second half of the conclusion: "subscales strongly correlate across self-reports and metacognitive tasks". | Add it for balance. MS-D10 stands, because the evidence for it rests mainly on Veenman & van Cleef (n = 30), Zhou & Winne (undergraduates) and Rovers. Note that these samples are small or adult. |
| Metcalfe & Finn 2012 and 2013; Kolloff 2025; Buehler 2025; Fyfe 2022; Lyons & Ghetti 2011; Greene 2024; Grenell 2022/2024; West 2025; van Loon & Laninga-Wijnen 2025; Serko 2025; Vo 2014; Moses-Payne 2021; Schneider 2008; van der Stel & Veenman 2014; Dignath & Büttner 2008; Dent & Koenka 2016; de Bruin 2011; Chevalier 2018; Huang 2022; Lipko 2009 (*JEP: Applied*); Veenman & van Cleef 2019; Zhou & Winne 2012; Deslauriers 2019 | All [V] and read correctly. Ns and ages match. | Two nuances. Lipko's standard *reduced* overconfidence but did not remove it: commission errors given credit fell from 73% to 44%. Greene 2024 adds that "individuals with generally weaker memories are less adept at … calibration", which is the performance confound again. |
| H4 "first longitudinal calibration-learning evidence outside the US/Europe"; H1 "first in-tutor test of confidence-bet reactivity in children" | Chen 2026 (China, N = 3,946) is cited in this doc, and Zhao 2022 (China) tested reactivity in children. | **"First" is unsafe** for both. Narrow the claims (H4: Indian, 6-15, trace-based, intensive-longitudinal; H1: in-product, randomised frequency), and run a systematic search before submission. |

### R2. Psychometric problems (ranked by consequence)

**P1. "Resolution" ψ is mostly knowledge, and the doc's own simulation cannot see it.**
- `calibsim` generates confidence as y = κ + ψ(2o − 1) + ε, with ψ drawn independent of θ. Resolution is then performance-free *by assumption*.
- `reviewsim` R2 uses a standard type-1 signal-detection generator instead: evidence e ~ N(±d′/2, 1), confidence driven by |e|, metacognitive sensitivity *fixed* across children, κ independent of d′.
  - r(ΔConf, d′) = **+.85**, and r(ΔConf, true κ) = .02.
  - κ̂_mid behaves well (r = .96 with κ, .12 with d′).
  - Raw bias correlates only −.11 with d′ under this generator, not −.53 to −.74.
- **Consequences:**
  - (i) The *size* of the unskilled-and-unaware artefact quoted in §3.2 is a property of the chosen generator. Say "can be large; the size is model-dependent". MS-D1 still stands.
  - (ii) ΔConf, γ and AUROC2 between children largely rank **knowledge**. A parent sentence such as "she can tell when to double-check" (§7.2, S2) would mostly restate θ as a metacognitive capability. That is a construct-validity failure and an implicit trait claim.
  - **Fix:** ψ is reportable only as *resolution beyond type-1 performance*. Use a model with θ_c − b_k as a covariate of y*, or a meta-d′-style constraint pooled hierarchically, and validate it in MS2 *net of θ*. Until then, no resolution sentence for any band. The conditional table (S1) already shows parents the same information without the inference.
- **Related:** the §4.1 confidence model has **no item-difficulty term**. With bets stratified by *predicted* P(correct) terciles, which are child-relative, ψ mixes two things: using item-difficulty cues, and monitoring within an item. The sampling design also changes the estimand from child to child. Add b_k (or the predicted logit) to y* and define ψ as within-difficulty separation.

**P2. The raw-count growth route produces false "then → now" rows almost every year.**
- §6.3 rule 2 accepts "posterior ≥ .9 **or** raw counts change consistently over ≥ 3 consecutive windows".
- `reviewsim` R1: with no true change and binomial counts (n = 30, p = .7):
  - a monotone rise over 3 windows occurs with probability .12 per row, or .21 if ties are allowed
  - over 12 monthly windows and 4 rows, **99% of children receive at least one false growth row a year (mean 2.9)**.
- The transfer check removes some of these, but not most: transfer is checked on counts that are just as noisy.
- **Fix:**
  - Delete the raw-count branch.
  - Require the posterior rule with a *pre-declared* direction per row.
  - Cap looks: one growth evaluation per construct per term, not monthly.
  - Report the expected false-row rate per child-year as a release metric (target < 0.1).
  - The posterior P ≥ .9 bar itself admits about 1 wrong-direction claim in 10. With four rows a month that still needs the cap.

**P3. Error scarcity, not bet count, limits everything; the thresholds are set in the wrong unit.**
- `calibsim` targets ~60% first-try accuracy. Mastery-paced practice will run nearer 80-85% [U: KT logs].
- `reviewsim` R4 (calibsim's own model, B3, ~82% accuracy):
  - ΔConf test-retest falls from .57 to **.38 at 30 bets**, and from .85 to .70 at 120
  - **31% of children have fewer than 3 wrong-answer bets after 30 bets**.
- At that point the S1 parent table's "andaaza … right {a3}" and "pakka … wrong" cells rest on 0-3 events.
- Guggenmos shows the same accuracy dependence in adults.
- **Fix:**
  - Set thresholds on **errors with bets**: say ≥ 10 for any offset statement and ≥ 30 for any research resolution estimate [U, to be set by MS3].
  - Suppress table cells with n < 5.
  - MS-D2's stratified sampling should *over-sample* the lowest predicted-P tercile, and record the oversampling weights.

**P4. The offset κ̂_mid is not separable from ψ near the ceiling.**
- `reviewsim` R3 holds κ fixed at the B1 mean of 1.0 under calibsim's own model. Raising ψ from 0 to 1.2 lowers mean κ̂_mid from .80 to .70, because conf | correct saturates at "pakka".
- So the §6.3 growth criterion "κ moves toward 0 without resolution falling" will register *rising* resolution as *falling* bias in young, confident children.
- **Fix:** growth claims about κ use only the model-based κ from the ordered-probit model, never κ̂_mid. κ̂_mid stays a dashboard check.

**P5. Comparisons across band boundaries are not identified.**
- τ is "fixed per band for identification". B1 uses faces and B2+ uses words. μ_κ[band(c,t)] is a step prior (§4.1), whereas §6.2 says the prior is interpolated by age.
- So a child's κ̂ can jump on their 8th birthday from a change of instrument and prior alone.
- **Fix:**
  - One age-continuous prior.
  - Treat a change of response format as a new instrument: reset the familiarity term and block any change statement that spans the switch.
  - Add threshold-invariance testing across bands and languages to H2 *before* any κ trajectory is published.
  - Shrinkage plus growing information also manufactures change (sibling CD review P2). §6.3 rule 5 ("the hierarchical model does this by construction") is not correct. Compare windows of matched information.

**P6. The help-need slope λ is mechanically biased if pL is read after the help event.**
- `reviewsim` R5: true λ = 0, and KT lowers pL after a logged hint (KT §1.4 treats an aided step as not-C0).
- The mean slope is −.001 when pL is read before the step and **+.33** when it is read after.
- **Fix:** `help.pL` in §6.1 must be the KT snapshot *at step onset*, before any update from this step. Add it to MSI6.
- `β_4·band` in §4.4 double-counts `μ_η[band]`. Drop one.

**P7. Self-correction and rapid-guess indices repeat the raw-bias mistake.**
- **W→R self-corrections.** Their rate rises with knowledge: you can only fix what you know.
  - A per-answer π_c (§4.3) is therefore ability-confounded, like raw bias.
  - Model W→R per *wrong first response*, with pL as a covariate.
  - The §7.2 denominator ("answers that needed it") requires grading partial utterances. Under the inherited law, that grading must be against keys, not by a model.
- **Rapid guessing.** §4.6 applies the time cut "only to incorrect … answers".
  - That is selection on the outcome: it removes fast wrong answers, keeps fast right ones, and inflates accuracy and pL.
  - Wise's procedure classifies by time alone. It then *validates* the cut by showing that rapid responses are at chance.
  - Use time alone, with item-type thresholds and a validity check.

**P8. Simulated reliabilities are design guesses printed as findings.**
- Every reliability in §0, §2, §3.3 and §4.4 is fixed by the assumed variance ratios: SD(κ) .6 against state .5, and ε = 1.
- Two decimals and band-by-band ranges imply an empirical precision that does not exist.
- **Fix:** label MS-D3 and MS-D4 "provisional, simulation-set", round to one decimal, and replace the numbers with MS3/MS4 values as soon as they exist.
- Plan rubric (S7): LLM rubric scoring is grading. Keep it research-only until H7 reports human-LLM agreement (κ ≥ .7 [U]) per band and language.

### R3. Developmental accuracy

- **Monitoring is paradigm-dependent, not age-staged.** Delayed, target-absent JOLs are accurate by grade 3 (Metcalfe & Finn 2013). Retrospective confidence improves from 7 to 10 (Bayard 2021). Immediate judgements stay optimistic. Self-generated judgements show monitoring at 6 when elicited ones do not (Wan 2025). The §4.1 band table should be organised by *paradigm × age*, not by age alone.
- **B1 evidence base.** The 6-7 band rests on N = 93 (Destan & Roebers, a raw-bias grouping), a 12-session null (Kolloff, N = 214), a 6-session positive at 7.45 years (Buehler, N = 127), a conference paper (van Loon 2017, AERA; not peer-reviewed, so tag it [S]), and preschool studies. That is a thin base for any B1 parent output.
- **Population.** The verified child samples are Swiss, US, Chinese and Israeli. The doc says so. Note also that Zhao 2022 (China) found reactivity *increasing* with grade, so the reactivity confound H1 must handle is age-dependent.
- **"Help-seeking declines with age"** is self-report and peer-directed (R1). Whether a voice tutor shows the same decline is an open question, not a prior to bake into band means of η.

### R4. Ethically risky outputs (each contradicts a decision in this doc)

- **E1. Showing parents "asked for the answer {y} times" puts a cost on help.**
  - MS-D6 says asking never costs anything. A parent who reads 14 answer requests can scold the child, and that is a cost delivered at home.
  - Concealment follows felt incompetence (Marchand & Skinner 2007) [V].
  - **Fix:** in v1, parents see only what Taxila did ("answer requests went through hints first"). Per-kind counts wait until MS10/H9 shows no rise in concealment, or in parent-pressure items.
- **E2. B1 calibration tables for parents.**
  - Overconfidence is normative at 6-7. B1 bets are elicited judgements, which under-read monitoring at this age (Wan 2025). The tables invite parents to "correct" a child's optimism.
  - **Fix:** no S1 table for B1 parents. B1 bets feed the system and research only.
- **E3. A child-facing "pakka-meter" by default for B2.**
  - The only B2-age evidence is a monitoring gain with no memory gain (Buehler 2025). Nothing is known about its effect on motivation or anxiety.
  - **Fix:** make it a randomised arm inside H5 with anxiety markers as outcomes, not a default (§7.5).
- **Inferring anxiety from "andaaza" on correct answers** (§8) depends on wording, politeness and ASR, which MS1 has not yet validated.
  - **Fix:** use it only as a trigger for supportive moves. Never use it as a flag, a route into MH §7 or a parent statement until MS1 and MS9 report.
- **Parent presence** (open question 3) should be a **gate**, not a question. No SRL statement for B1-B2 is built from sessions flagged as parent-assisted.
- **Sentence-shaped slots.** "She can tell when to double-check" and the hard-coded "she/her" in §7.2 break the inherited law (write shapes, not lines) and make an inference.
  - **Fix:** use pronoun slots and descriptive fixed readings only.

### R5. Required changes (for the main loop)

1. §1 item 2 and §4.1 table: rewrite as paradigm × age, and resolve the contradiction with Bayard.
2. MS-D1 and §3.2: say that the artefact's size depends on the generator. Add ΔConf's dependence on performance (Rahnev). Mark Markovich 2026 and Destan & Roebers 2015 as raw-bias-indexed.
3. S2 resolution: no parent sentence at any band until a θ-adjusted ψ passes MS2 net of θ. Add an item-difficulty term to the §4.1 model.
4. §6.3: delete the raw-count route, pre-declare the direction of each row, evaluate at most once a term, and make the false-row rate a release metric. Add an invariant `MSI10`: simulated null false-row rate < 0.1 per child-year.
5. MS-D3 and §7.2: thresholds counted in wrong-answer bets, cells with n < 5 suppressed, and over-sampling of the low-P tercile with weights logged.
6. Growth uses model-based κ only, never κ̂_mid. Compare windows of matched information. Use one age-continuous prior. Block change statements across a response-format switch.
7. `help.pL` = snapshot at step onset (MSI6). Drop `β_4·band`.
8. Model self-correction per wrong first response, adjusted for pL. Classify rapid guesses by time alone, then validate.
9. MS-D2 and §3.5: replace Dignath 2023 with Zhao 2022, Double et al. 2018 and Double & Birney 2019 as the reactivity evidence. Add "confidence-word priming" to MS1.
10. MS-D7: cite Fan 2025 as adult speculation. MS-D5: make the failure threshold band-specific, [U for children].
11. E1-E3 above. Make parent presence a gate.
12. H1 and H4: drop "first" until a systematic search has been done.
13. Rinne & Mazzocco: describe it as an absolute-accuracy calibration index (N = 190, verification task). Do not present it as evidence for κ or ψ.

**Proposed `context/` entries.**
- **rejected** `raw-count-growth-route`: 99% of children get ≥ 1 false growth row per year under the null (`reviewsim` R1).
- **measurement** `metacog-review-sim-2026-10-02`, n = 4,000 simulated children per condition, seed 7:
  - R2: r(ΔConf, d′) = .85 under SDT
  - R3: κ̂_mid falls .80 → .70 as ψ rises 0 → 1.2
  - R4: ΔConf test-retest .38 at 30 bets and 82% accuracy; 31% of children have < 3 errors
  - R5: spurious λ = +.33 if pL is read after help.
- **decision** `resolution-must-be-theta-adjusted`. Reversal condition: MS2 shows that raw ΔConf predicts delayed gains net of θ as well as the θ-adjusted ψ does.

### R6. Addendum: second verification pass (2026-10-02, later the same day)

**Method.**
- Re-ran `metacognition-srl-reviewsim.py`. All R1-R5 numbers reproduce exactly (seed 7).
- Web search was available for this pass. Ten further abstracts were pulled from ERIC, Europe PMC and Crossref:
  - Lipko, Dunlosky & Merriman 2009 (*JECP*), the item R1 could not check
  - Chase 2009; Kornell & Bjork 2009; Karpicke 2009; Hays 2013; Roll 2011; Aleven 2016; Zheng 2016; Ryan, Gheen & Midgley 1998; Bisra 2018
  - Chen et al. 2026 (Crossref abstract)
  - Destan et al. 2017; the van Loon et al. 2017 publication record.

**Corrections to this review itself.**

| R-item | correction |
|---|---|
| R3, "B1 evidence base" | **van Loon et al. 2017 is not a conference paper.** It is published and peer-reviewed: van Loon MH, Destan N, Spiess MA, de Bruin A, Roebers CM 2017, "Developmental progression in performance evaluations: Effects of children's cue-utilization and self-protection", *Learning and Instruction* 51, 47-60, doi:10.1016/j.learninstruc.2016.11.011. Keep it at [V-record] (abstract not re-read), not [S]. Fix the reference entry in §14, which points to the AERA repository. The B1 base is still thin, but one item stronger than R3 said. |
| R1, H4 row | **Chen et al. 2026 is cross-sectional**: one assessment wave, 3,946 Chinese sixth-graders, post-test estimates, multilevel. It does not show that H4's *longitudinal* claim was already made. The recommendation stands (drop "first" until a systematic search), but for the right reason: it is unsearched, not refuted. The doc's §4.1 summary of Chen ("general confidence relates to learning attributes; resolution less so") matches the abstract. The authors' own caveat should be carried over: the R² increment is "order-dependent" and "not interpreted as evidence that the block is inherently more important". |

**New findings (not in R1-R5).**

**P9. The parent calibration table is the raw-bias confound one layer up.**
- S1's table cell, and §7.2's "calibration change" row, report h_pakka = P(correct | "pakka"). That is conditional *accuracy*. It rises with θ and falls when the scheduler moves the child to harder items, with no change in monitoring at all.
- The "then → now" row "her 'pakka' was right a/n now vs a′/n′" will therefore record ordinary learning, or a difficulty-mix shift, as calibration growth. That is exactly the inference MS-D1 bans for raw bias.
- **Fix:**
  - Keep the table only as a *description* ("when she said pakka, the answer was right a of n times").
  - Drop the "calibration change" shape from v1.
  - Any change claim must come from the model-based κ (P4), with item difficulty in y* (P1), and must pass §6.3.
  - Each table window shows the share of items at each difficulty level next to the counts, so a parent can see a harder mix.

**P10. A fixed "reading" slot makes a resolution claim through the back door.**
- At ≥ 30 bets in any band, §4.1 and §7.2 allow the fixed reading "her 'pakka' and 'shayad' are right about equally often". That is a statement that ψ ≈ 0, made below the 120-bet bar and in B1, where MS-D3 bans resolution outright.
- Its reliability at 30 bets is .36-.57 by the doc's own computation, and about .38 at mastery-level accuracy (R4).
- **Fix:** no reading slot compares bet levels below the S2 threshold. The S1 reading set may describe only one level ("her 'pakka' answers were right a of n times").

**P11. The outcome coded against the bet is not the outcome the child judged.**
- The bet comes after the answer and before feedback, so the child judges "is *this* answer right?".
- But o = 1 only for KT class C0 (correct on the first try, with **no hint**). A correct answer that followed a hint is C2/C3 and is coded o = 0.
- As a result, a confident, *correct* aided answer enters the parent table as a "pakka … wrong". This happens most for exactly the children who use help well (MS-D5/D6), and so it penalises help in the metric.
- **Fix:**
  - o := correctness of the answer that was bet on.
  - Either take no bet on an item where help came before the first attempt, or code "aided" as a separate covariate.
  - Add an invariant: `bet.outcome` is the graded correctness of the bet-on response, never a KT class.

**Citation nuances (all [V] this pass).**
- **Lipko, Dunlosky & Merriman 2009 (*JECP*)** is read correctly: preschool predictions stayed overconfident across trials, and postdictions were "quite accurate".
  - But Experiment 2 found the same overconfidence when children predicted *another child's* recall: "wishful thinking cannot fully account for their overconfidence".
  - Destan et al. 2017 found own-favouring judgements and credit at both 6 and 8.
  - So "self-protective" (MS-D9, §8) is *one* contributor with mixed evidence. Write "partly self-protective, partly a general optimism that is not self-specific".
- **Chase et al. 2009.**
  - The learning gain and the "most pronounced for lower achieving" result come from the **grade-8** study only. The grade-5 study was a verbal-protocol study of time on task and attributions.
  - §5.2 ("grades 5 and 8 … more effort and learning, largest for lower achievers") should say: effort in both; learning gain and the low-achiever effect in grade 8.
  - §7.3 "the protégé effect at home" is an extrapolation: Chase used a computer teachable agent, not a parent as the learner. Tag it [U].
- **Roll et al. 2011** (58 and 67 high-school geometry students) reported that improved help-seeking *transferred* to new content a month later. The "no domain-level learning gain" result is Aleven 2016's summary of the programme. §1 item 5 and the §5.2 row should attribute the null to Aleven 2016, not to both papers.
- **Ryan, Gheen & Midgley 1998** is N = 516 *sixth-graders*, with avoidance measured by **self-report**. MS-D6 may cite it, but as reported avoidance at age 11-12, with no data for 6-10.
- **Adult evidence used for children's illusions of competence** (§1 item 4, §4.2):
  - **Kornell & Bjork 2009:** adults, word pairs, 12 experiments
  - **Karpicke 2009:** adults, foreign-language items
  - **Hays, Kornell & Bjork 2013:** adults, and the benefit requires *immediate* feedback
  - **Deslauriers 2019:** university physics.
  - Each is read correctly, but the claim that illusions of competence "are general" should say "shown in adults; children's evidence is Metcalfe & Finn 2013 and Lipko 2009". The Hays result supports MS-D5 only when feedback is immediate, which Taxila's ladder must guarantee.
- **Zheng 2016** (ES = 0.438, 29 articles, N = 2,648) and **Bisra 2018** (g = .55, 69 effect sizes) are correct. Neither is child-specific, and neither should be cited as such.

**Additional required changes (continuing R5).**
14. §14 reference for van Loon 2017: replace it with the *Learning and Instruction* citation. Undo the [S] instruction in R3.
15. Drop the "calibration change" parent shape. Show the difficulty mix next to the S1 table (P9).
16. Remove every comparative reading slot below the S2 threshold (P10).
17. Bet outcome = correctness of the bet-on response. No bets after pre-answer help, or code aided as a covariate. Add invariant `MSI11` (P11).
18. Apply the citation nuances above: Lipko and Destan on self-protection, Chase's grade split, Roll 2011 versus Aleven 2016, and adult tags on Kornell, Karpicke, Hays and Deslauriers.

**Additional proposed `context/` entry.**
- **rejected** `conditional-accuracy-as-calibration-growth`: P(correct | "pakka") over time tracks θ and the difficulty mix, not monitoring. It is not a change metric.
