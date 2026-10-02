# Temperament, personality and "vibe" in children 6-15: what Taxila may infer, how it adapts, and what parents hear

**Date:** 2026-10-02 · **Scope:** classes 1-9 (ages ~6-15), voice-first Hindi/English/Hinglish tutor with lesson games, logged over months.
**Builds on, does not repeat:**
- `learner/vibe-temperament.md` (**VT**): the operational VibeProfile. That includes the L1-L5 legitimacy test, 14 teacher knobs, signals V1-V18, Beta/EWMA updates, invariants VI1-VI11, banned inferences (§4.9), modes and storage.
- `learner/motivation-interest.md` (**MI**): state curiosity, the moment filter, interest phases.
- `psychology/cognitive-development.md` (**CD**): reliability arithmetic §2.2-2.3, weather vs climate §2.7, the parent contract §8.2.
- `learning-science.md` (**LS**): §2 learning styles rejected, §7 probes, §8 LearningProfile.

**This file supplies the psychology underneath VT.** It covers what the constructs are, how they develop from 6 to 15, which behaviours are valid analogues, which measurement models are defensible, how reliable they can be, and why the ladder of inference stops where it does. It then proposes the parent-facing **Interaction Style Profile (ISP)**.

**Evidence tags.**
- **[V]**: checked this session against a primary abstract or full text (Europe PMC, Crossref abstract, arXiv).
- **[S]**: existence and bibliographic details checked (Crossref, Semantic Scholar TLDR), but the content is from a secondary summary or memory.
- **[U]**: unverified, or a Taxila design default that must be measured.

Every numeric threshold in §5-§6 is [U] by construction. None may enter `context/` or parent-facing copy until measured.

**Method.** The shared WebSearch budget was exhausted before this review started (200/200). Discovery and verification used:
- the Europe PMC REST API (~35 queries)
- Crossref metadata and abstracts (~35 lookups)
- Semantic Scholar DOI lookups (~12; its search endpoint was rate-limited)
- the arXiv API (4 queries)

OpenAlex was rate-limited. APA journals (JPSP, Psych Bull, Dev Psych) usually expose no abstract, so several classics are [S]. The calculations in §4.3 and §5 are reproducible with `docs/research/psychology/temperament-vibe-calc.py`.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| TV1 | **Taxila estimates *interaction signatures* (if-then contingencies observed with Taxila), never traits.** Every estimate is scoped "with Taxila, lately". | Taxila is one informant in one situation class. Different informants agree at about r ≈ .28 on child behaviour (Achenbach 1987) [S]. Informant effects drove most variance in youth personality-psychopathology links (Katz 2026) [V]. Stable *if-then* profiles are the coherent unit of child behaviour (Shoda, Mischel & Wright 1994) [V]. | Nothing in-product. Trait-level questions are answered only in consented research studies with validated instruments (TV12). |
| TV2 | **No temperament or personality label, type, score or percentile** in parent UI, teacher prompt, database, analytics dashboards, or exports. | §8: validity ceiling, context-specificity, developmental instability, harm from identity language, the Barnum effect, gender confounding. | None for the product. |
| TV3 | **Each ISP dimension must pass a latent state-trait (LST) test.** If occasion-specificity ≥ consistency, the dimension stays session-only: it adapts within the session and is never persisted or reported. | Children's states vary as much within as between persons (Fleeson 2001 [S]; CD §2.7). Persisting a state as a trait is the core "vibe" error. | Measured Con > OSpe in S-TV1 for that dimension and age band. |
| TV4 | **A contingency estimate changes a slow knob, or reaches a parent, only at empirical-Bayes reliability ≥ .70.** | §5.2: reliability .70 needs ~37-150 contrast trials per child (computed). Below that, the estimate is mostly prior. | S-TV1 shows smaller trial needs (larger between-child spread τ). |
| TV5 | **Priors are population-calibrated (hierarchical Beta-binomial per age band)**, replacing VT's fixed prior strength s0 = 4. | s0 = 4 implicitly assumes an ICC of .20 for every dimension. Real ICCs differ, and shrinkage should match them (§5.1). | Fewer than 200 active children in a band. Keep s0 = 4 until then. |
| TV6 | **Parent text uses action-and-situation language** (verb + condition + count + "with Taxila" + time window). It never uses identity nouns or trait adjectives. A lexicon gate enforces this (TVI1). | Generic person praise ("you are a good drawer") made children more helpless after mistakes than process praise (Cimpian 2007) [S]. "Be a helper" backfired after setbacks (Foster-Hanson 2020) [V]. Action wording ("do science") raised girls' persistence over identity wording ("be scientists") (Rhodes 2019) [V]. | A preregistered parent-report RCT (S-TV4) shows no difference in parent essentialism or child outcomes. |
| TV7 | **Curiosity appears only as counted behaviour** (own questions, optional explorations, follow-ups), never as "a curious child". I-type and D-type are labels on *teaching moves and question types*, never on children. | Parent-reported curiosity did not predict children's information-seeking in a game (Ryan, Dodd & FitzGibbon 2025, n=133) [V]. Children's curiosity has no agreed operational definition (Jirout & Klahr 2012) [V]. | S-TV5 shows convergence (r ≥ .3) between the behavioural index and an I/D questionnaire. |
| TV8 | **Humour: Taxila measures reciprocity, never the child's humour *style*.** Aggressive and self-defeating styles are adjustment-linked, which puts them next to mental health. | HSQ-Y styles relate to psychosocial adjustment (James & Fox 2016) [V]. | None. |
| TV9 | **Adaptation is keyed to observed contingencies under micro-randomised exploration, never to an inferred trait.** | Personality-to-strategy maps have no child outcome evidence (VT §3.7). Without randomisation, "the child responds better to X" is confounded by when the teacher chose X (§5.2). | An RCT shows trait-keyed adaptation beats contingency-keyed adaptation on delayed learning. |
| TV10 | **Change is the default expectation.** Evidence decays (VT H = 60 d), a changepoint detector runs, and a change in band C is never reported as a regression. | Rank-order stability is low in childhood (.31) and rises with age (Roberts & DelVecchio 2000 [V]; Bleidorn 2022 [V]). Conscientiousness and agreeableness dip in early adolescence (Van den Akker 2021, n=2,640) [V]. | — |
| TV11 | **Defaults are gender-, language- and region-blind, with a DIF audit for every extractor and dimension.** | Girls are much higher on effortful control, and boys higher on surgency (Else-Quest 2006) [V]. A naive "vibe" detector will encode gender, and likewise dialect (VT: Hofmann 2024). | — |
| TV12 | **Questionnaires (TMCQ, EATQ-R, HSQ-Y, I/D) are used only in consented research sub-studies.** Results inform group-level validity and never write to a child's profile. | Keeps the research publishable (multi-method validity) without turning the product into a personality test. | — |

---

## 1. Executive summary

1. **Temperament and personality are real, partly heritable, partly stable and predictive.** They are also the constructs Taxila is *least* able to measure validly from its own logs. The gap between "real" and "measurable by us" is the whole design problem.
   - Rothbart's three factors (surgency/extraversion, negative affectivity, effortful control) are reliably recovered in caregiver reports at ages 3-7, including in China and Japan (Rothbart et al. 2001) [V].
   - Youth Big Five traits shape life outcomes (Soto & Tackett 2015) [V].
2. **Achievement links are specific.**
   - Effortful control correlates r = .31 with achievement and surgency r ≈ .00 (VT, Nasvytienė 2021) [V].
   - Conscientiousness is the robust Big Five predictor. Openness, extraversion and agreeableness matter *more* at elementary and middle school than later (Mammadov 2021: 267 samples, N = 413,074) [V].
   - Self-discipline predicted 8th-grade grades better than IQ (Duckworth & Seligman 2005) [V].
   - Grit adds little beyond conscientiousness; perseverance of effort is the useful facet (Credé 2017) [V].
   - **Reading for Taxila:** persistence-after-error is worth adapting to. Talkativeness is not evidence of anything academic.
3. **Development 6-15 is a moving target.**
   - Rank-order consistency is .31 in childhood against .54 in college (Roberts & DelVecchio 2000, 152 studies) [V]. Stability rises through early life (Bleidorn 2022, k = 189) [V].
   - Late childhood and adolescence show *negative* maturity trends that are unusual across the lifespan (Soto 2011, N = 1.27 M) [V]. C and A dip and N rises in early adolescence, only weakly tied to puberty (Van den Akker 2021) [V].
   - Personality changes through intervention (Roberts 2017, 207 studies) [S].
   - A 12-year-old who seems "less careful" than at 10 is developmentally typical, not regressing.
4. **Under ~10, children cannot report their own personality coherently.** Big Five self-reports at 10-12 show large acquiescence and poor differentiation, improving to 20 (Soto 2008) [V]. Younger children need puppet interviews (Measelle 1998) [S]. So Taxila cannot validate a young child's "profile" against the child's own view either.
5. **Machine inference of personality from conversation is weak, and weakest exactly where Taxila sits.**
   - A GPT-4 chatbot reached mean r = .44 when it was *prompted to elicit* personality, .22 in naturalistic chat, and **.12 when acting as a helpful assistant** (Peters, Cerf & Matz 2024) [V].
   - Three LLMs on 555 interviews reached max r = .27, κ < .10, with predictions biased upward (Zhu et al. 2025) [V].
   - There is no validation for children at all [U: none found].
   - Users still rated LLM profiles as accurate as questionnaires (arXiv 2602.15848, N = 33) [V-abstract]. **Felt accuracy does not track validity.**
   - At r = .27, a child labelled "top third" is actually top third only 44% of the time, and bottom third 23% of the time (§4.3, computed).
6. **Behaviour is situation-specific, so "how she is with Taxila" is the honest unit.** Shoda, Mischel & Wright (1994) [V] showed that children at a summer camp had stable *if-then* behavioural signatures that ordinary trait scores miss. Parents, teachers and children agree only modestly (Achenbach 1987 [S]; De Los Reyes 2015 [S]). The ISP is built as if-then contingencies: *when Taxila does X, this child tends to do Y*. That is both what is measurable and what the teacher can act on.
7. **Shyness is not one thing, and its meaning is cultural.**
   - Behavioural inhibition is a reaction to novelty and unfamiliar people (Fox 2005) [V].
   - Conflicted shyness differs from social disinterest (Coplan 2004) [S].
   - In Chinese children, shyness predicted achievement in 1990, nothing in 1998, and peer rejection and depression in 2002 (Chen et al. 2005) [V].
   - Indian equivalents are unmeasured [U]. In a 1:1 AI tutor the "unfamiliar adult" trigger fades with exposure, so a falling warm-up curve is *familiarity*, not trait change (§3.5).
8. **Humour develops in stages and is learned through pragmatics.**
   - Puns and multiple meanings arrive around 7 (McGhee) [S].
   - Sarcasm's hurtful intent is read only around 9-10 (VT, Glenwright & Pexman 2010) [V].
   - Intonation is the key irony cue for children (Smith & Glenwright 2025 review) [V], which synthetic TTS prosody may not carry [U].
   - Children's humour styles are measurable from 8 (HSQ-Y; James & Fox 2016) [V], but they are adjustment-linked, so Taxila measures only *reciprocity* (TV8).
9. **Curiosity as a trait is real but poorly operationalised in children.**
   - Litman's interest-type (I) and deprivation-type (D) epistemic curiosity has a parent-report form for young children (Piotrowski, Litman & Valkenburg 2014) [S].
   - Overall curiosity predicted early scientific reasoning, and I-type predicted later science knowledge (Koerber & Osterhaus 2026, n = 122, grade 1 to 3-4) [V].
   - Curiosity is a third pillar of achievement beside intelligence and effort (von Stumm 2011) [V].
   - Questionnaire curiosity and behavioural information-seeking dissociate (Ryan 2025) [V]. Taxila therefore measures curiosity *behaviour*, and reports it as behaviour.
10. **What parents get.** Up to six lines on "how learning with Taxila goes best for Aarav lately". Each line is a counted, context-scoped, uncertainty-marked observation tied to what Taxila changed because of it, with a toggle. There are no adjectives about the child, no types, no comparisons, and no "personality". Behavioural description supports goodness-of-fit thinking ("what helps") rather than essentialism ("what she is") (§8, §9).

---

## 2. A framework that makes "vibe" scientifically honest

### 2.1 Three levels of description, and where Taxila can stand
| level | what it is | examples | can Taxila estimate it? |
|---|---|---|---|
| **Traits / temperament** | decontextualised, relatively stable dispositions; usually measured by multi-item questionnaires from a knowledgeable informant | surgency, effortful control, conscientiousness, I-type curiosity | **No.** Wrong informant, one context, no validation in children, harmful if wrong |
| **Characteristic adaptations / if-then signatures** | context-bound regularities: *if situation S, then behaviour B* (Shoda 1994 [V]) | "if corrected with a question, retries within a turn"; "if offered two options, often picks the harder" | **Yes, within Taxila**, with reliability gates (§5) |
| **States** | momentary engagement, affect, energy | warming up, strained, playful today | **Yes, session-only** (VT SessionState, MI moment filter); never persisted |

The person-situation debate is resolved in a way that suits Taxila:
- Traits describe the *distribution* of a person's states (Fleeson 2001) [S].
- Coherence lives in the *pattern* of situation-behaviour links (Shoda 1994) [V].
- Latent state-trait theory splits any measurement into a stable person part, an occasion part and error (Steyer, Schmitt & Eid 1999) [S].

Taxila sees thousands of states, but from one class of situations: being tutored by Taxila, on a phone, at home. It can estimate the *Taxila-conditional* density and the if-then pattern within it. It cannot estimate the trait, because the trait is defined across situations Taxila never sees: school, playground, family, strangers.

### 2.2 The one-informant problem, quantified
- Achenbach, McConaughy & Howell (1987; 269 samples, 119 studies) [S] report cross-informant correlations for child behaviour problems of about .60 between similar informants (two parents), .28 between different kinds (parent vs teacher) and .22 between self-report and others.
- De Los Reyes et al. (2015) [S] argue that these discrepancies are *valid* information about contexts, not merely error.
- Katz et al. (2026, 147 studies, N = 46,369) [V] found that most variance in youth personality-psychopathology associations was driven by informant effects, especially when one person rated both.

**Implication:** treat Taxila as a new informant (an AI teacher in a home-phone context) whose correlation with any parent's or teacher's view is expected to be low, around .2-.3 [U, pending S-TV2]. A parent saying "he is not like that at home" is therefore *expected*, not a contradiction. The parent copy says so (§9).

### 2.3 Goodness of fit as the governing idea
Outcomes depend on the match between a child's style and the environment's demands (Thomas & Chess; VT §3.1 [S]). Teacher-child relationship trajectories vary with child surgency and effortful control (Harvey et al. 2024, n = 744, elementary) [V]. Both sides of the dyad move, so Taxila's job is to change *its* side.

The ISP describes the fit: *the settings under which this child engages, tries and continues*. That is exactly VT's definition. This file adds the psychometrics that decide when a "fit" claim is real.

---

## 3. Constructs, one by one

Each block covers:
- (a) definition
- (b) trajectory 6-15
- (c) Taxila-observable *analogues*: indicators of a contingency, never of the construct
- (d) measurement model
- (e) reliability and validity concerns
- (f) what may be said to parents

### 3.1 Rothbart's temperament model
**(a) Definition.** Temperament is constitutionally based individual differences in *reactivity* and *self-regulation* (Rothbart & Bates) [S]. The three broad factors:
- **Surgency/Extraversion (S):** activity, high-intensity pleasure, impulsivity, low shyness, positive anticipation.
- **Negative Affectivity (NA):** fear, frustration/anger, sadness, discomfort, low soothability.
- **Effortful Control (EC):** attentional focusing and shifting, inhibitory control, low-intensity pleasure, perceptual sensitivity.

Instruments: CBQ, 15 scales at 3-7 (Rothbart et al. 2001) [V]; TMCQ at 7-10 (Simonds & Rothbart) [S]; EATQ-R at 9-15, which adds affiliation and frustration (Ellis & Rothbart 2001) [S]. EATQ-R parent form: the lower-order structure reproduces on a reduced item set, with measurement invariance across samples and ADHD status (Kozlowski 2025) [V]. The higher-order structure has been contested [V, same abstract].

**(b) Trajectory.**
- EC grows steadily in early childhood (latent growth 4→6, n = 796, Romero 2026) [V]. It keeps improving through middle childhood and adolescence, alongside executive function (CD §3) [U for the temperament-specific slope after 10].
- Temperament dimensions are *less* rank-order consistent than adult traits (Roberts & DelVecchio 2000) [V].
- Gender: EC shows a large difference favouring girls; inhibitory control d = −.41 and perceptual sensitivity d = −.38 within it. Surgency favours boys (activity d = .33, high-intensity pleasure d = .30). NA differences are negligible (Else-Quest 2006, ages 3 months-13 years) [V].

**(c) Taxila analogues** (with the main confound for each):
- *EC-like:* retry within one turn after a correction (VT V10); sustained accuracy across a game block; waiting through a teacher turn rather than barging in (V17); no-go errors in designed game trials (CD §3.2). Confounded by **difficulty** (pSuccess from KT), fatigue, minute-in-session, and device.
- *S-like:* speed of approach to a new activity (warm-up turns); choosing fast or high-intensity game modes; child words per turn (V3). Confounded by **familiarity** (§3.5), parent presence, and shared rooms.
- *NA-like:* withdrawal after correction; "pata nahi" loops (V11); frustration lexicon. Confounded by difficulty and home events. NA sits next to mental health, so it is **session state only** (VT `strained`, MI moments). It is never aggregated across sessions as a dimension.

**(d) Model.** EC-like and S-like analogues enter only as **contingencies** (§5.2: retry | correction frame, difficulty) or as **LST-tested rates** (§5.3). There is no composite "EC score".

**(e) Concerns.**
- Analogues share the construct's *name*, not its *validity*. An EC questionnaire asks about behaviour across homework, queues and games. Taxila sees one task family, chosen by Taxila.
- Inhibition-type difference scores have poor individual reliability (CD §2.3, Hedge 2018 [V]).
- Gender differences in EC and S mean any S- or EC-like dimension will differ by gender. That difference must be audited (DIF, §5.8) so it is not baked into defaults (TV11).

**(f) Parents.** Never "temperament", "self-control", "impulsive" or "high-energy". Allowed: *"After a mistake, Aarav usually tries again straight away (14 of 18 times in the last month, with Taxila). So Taxila points to the exact step and lets him fix it himself."*

### 3.2 The Big Five in childhood (conscientiousness, agreeableness, openness, plus extraversion and neuroticism)
**(a) Definition.** These are characteristic patterns of thinking, feeling and behaving. Children's specific tendencies cohere into broad traits resembling adult ones, with differences (Soto & Tackett 2015) [V; Shiner & Caspi 2003 [V-abstract]]. Child-specific structures add an *activity* dimension ("little six") [U]. Parent-report instruments include the ICID and HiPIC [U].
- **Conscientiousness:** orderliness, persistence, responsibility.
- **Agreeableness:** cooperation, warmth, low antagonism.
- **Openness:** curiosity, imagination, intellect. It overlaps with the curiosity trait in §3.6.

**(b) Trajectory.**
- Self-report becomes coherent and differentiated only gradually from 10 to 20, with large acquiescence differences at younger ages. Extraversion gains coherence. A and C gain differentiation. N and O gain both (Soto 2008) [V].
- Mean levels: late childhood and adolescence show pronounced, sometimes *negative* maturity trends, and some gender differences first appear then (Soto 2011, ages 10-65, N = 1,267,218) [V].
- The early-adolescent "dip" (C and A down, N up) replicated in n = 2,640 aged 8-18. Hormonal and pubertal associations were small (Van den Akker 2021) [V].
- Rank-order stability rises across early life and plateaus in young adulthood (Bleidorn 2022) [V].

**(c) Achievement validity** (why the temptation exists):
- Conscientiousness predicts performance even controlling for cognitive ability. O, E and A effects are significantly *larger at elementary/middle school* (Mammadov 2021) [V].
- Adult-rated C and O correlate strongly with primary performance (Poropat 2014; VT) [V].
- Self-discipline predicted grades, attendance and selection beyond IQ (Duckworth & Seligman 2005, n = 140 and 164, grade 8) [V].
- Grit is "very strongly correlated" with C. Its perseverance facet carries the validity (Credé 2017, 88 samples) [V].

**(d) Taxila analogues.**
- *C-like:* completing a started activity; returning at the routine time (habits review); retry-after-error.
- *O-like:* choosing unfamiliar formats; optional exploration; "what if" questions (§3.6).
- *A-like:* doing what the teacher asks. **This is the dangerous one.** Compliance with an AI is not agreeableness. Optimising for it would train obedience to software, which conflicts with NEVER MANIPULATE and with autonomy support (MI). A-like behaviour is *not* an ISP dimension.

**(e) Concerns.**
- *Inference ceiling:* §1 item 5 and §4.3.
- *Context:* C in a 15-minute voice lesson is not C in a school year.
- *Self-fulfilling risk:* expectancy effects are typically small, but larger for stigmatised groups (Jussim & Harber 2005) [V]. An AI teacher that "expects" low C could create the very pattern it predicts. That is why ISP values never reach KT, difficulty selection or the praise channel except through VT knobs (§7, TVI4).

**(f) Parents.** No Big Five vocabulary at all. Behaviour plus context only: *"Finished 11 of 12 activities she started this month."*

### 3.3 Stability and change across 6-15 (cross-cutting)
| fact | evidence | design consequence |
|---|---|---|
| Low but real rank-order stability in childhood | .31 (childhood) → .54 (college) → .74 (50-70), interval fixed at 6.7 y; temperament less consistent than adult traits (Roberts & DelVecchio 2000) [V] | Over Taxila's horizons (weeks to years), a child's ordering *can* change. Evidence must decay (VT H = 60 d: a 90-day-old session keeps 35% weight; computed). |
| Stability grows with age | Bleidorn 2022 [V] | Band C may use a longer half-life than band A [U: H_A = 45, H_B = 60, H_C = 75 d, tune in S-TV1]. |
| Normative dips in early adolescence | Soto 2011 [V]; Van den Akker 2021 [V] | A band-C fall in retry rate or completion is shown as a change and as *common at this age*, never as a decline in the child. |
| Traits change through intervention and environment | Roberts 2017 [S]; Chen 2005: the *meaning* of shyness changed within 12 years [V] | Teacher adaptation is itself an environment. Taxila's effect on the child's style is a research question (S-TV3), not a confound to hide. |
| Within-person variability is large | Fleeson 2001 [S]; WM fluctuation in grade 3-4 (CD §2.7) [V] | LST gate (TV3): dimensions dominated by occasion variance stay session-only. |

### 3.4 Humour development and humour style
**(a) Definition.** Humour involves *comprehension* (detecting and resolving incongruity, reading intent), *appreciation*, and *production*. **Humour styles** are the uses of humour: affiliative, self-enhancing, aggressive, self-defeating (HSQ; Martin et al. 2003) [S].

**(b) Trajectory.**

| age | what develops |
|---|---|
| ~7+ | incongruity humour with concrete-operational thought; puns, riddles, double meanings (McGhee stages) [S] |
| 5-6 | detect non-literal meaning, but not the speaker's intent |
| 9-10 | sarcasm judged meaner than irony (Glenwright & Pexman 2010; VT) [V] |

- Intonation is a central cue children weigh when learning irony, and the cue weights change with age and language (Smith & Glenwright 2025 review) [V].
- Measurable humour styles: a children's HSQ for older children (Fox et al. 2013) [S], and the HSQ-Y for 8-11. The HSQ-Y showed 3-week test-retest reliability, agreed with peer reports, and its styles related to psychosocial adjustment (James & Fox 2016) [V].

**(c) Taxila analogues.**
- Play-along, building on a joke, a lexical laugh token, or confusion after a humour move (VT V7)
- Child-initiated wordplay (V8)
- Which humour kinds land (VT `humourKinds`)

**(d) Model.**
- Humour *reciprocity* is a Beta-binomial per kind (§5.1), conditioned on age band and on recent error (VT rule: no humour within 2 turns of an error).
- Kind unlocks are a contingency: P(plays along | kind k), estimated only when kind k is within the band ceiling.

**(e) Concerns.**
- Laughter is not reliably transcribed (VT open question 4).
- Silliness can be avoidance (LS P22).
- Taxila's TTS may not render ironic prosody [U]. That gives one more reason for VT's ban on irony with bands A-B and on any irony aimed at the child.
- **No style inference.** Repeated self-defeating jokes ("main toh buddhu hoon haha") are handled as self-doubt *talk* in MI's session counters, met with a task-focused reframe, and never stored as a style. Persistent distress follows the safeguarding route (LS §4.5.6).
- Teacher humour helps relationships when course-related and hurts when aggressive (Banas et al. 2011 review [S]; Bieg & Dresel via VT [S]).

**(f) Parents.** *"Light riddles about the lesson go down well (he joined in 7 of 9 times), so Taxila uses one now and then. Toggle off."* Never "he has a great sense of humour" (that is a trait praise), and never "he uses humour to cope" (a clinical interpretation).

### 3.5 Social and communication style
**(a) Definition.** This is the cluster of how a child enters and sustains interaction:
- Approach or withdrawal to novelty and to unfamiliar people. *Behavioural inhibition* is the temperament version, studied from infancy and linked to fear circuitry and later anxiety risk (Fox et al. 2005) [V].
- Social motivation. *Conflicted shyness* (wants to engage, but anxious) differs from *social disinterest* (prefers solitary activity, not anxious) (Coplan et al. 2004) [S].
- Conversational style: turn length, latency, initiative, register, code-switching (VT §3.2, §3.8).

**(b) Trajectory and culture.**
- Shyness-sensitivity related to *positive* social and academic outcomes in a 1990 Chinese cohort, to nothing in 1998, and to peer rejection, school problems and depression in 2002 (Chen et al. 2005, M age 10) [V]. An earlier Chinese-Canadian comparison found shyness valued in China (Chen, Rubin & Sun 1992) [S].
- Indian norms (deference to teachers, not questioning authority) are plausible but unmeasured in this age range [U].
- India's cVEDA/PARAM cohort measures temperament in Indians aged 6-23 at eight sites (Holla et al. 2025 protocol) [V]. It is the most plausible source of Indian reference data and a potential research partner [U].

**(c) Taxila analogues.**
- Warm-up turns before the first open answer
- Child words per turn (V3)
- Onset latency after think-questions (V4)
- Volunteered turns (V5)
- Social-talk appetite and return to task (V16)
- Address and register choices (V13-V15)

**(d) Model: separate familiarity from style.** Behavioural inhibition is a response to *unfamiliar* people. For a child meeting Taxila, early sessions confound style with novelty. Fit a per-child familiarity curve:
```
W_is = W∞_i + (W0_i − W∞_i) · exp(−λ_i · s) + β·ctx_is + e_is        s = session index, W = warm-up turns
W0_i: first-meeting warm-up; W∞_i: settled warm-up; λ_i: rate of getting used to Taxila
(W0, log W∞, log λ)_i ~ MVN(μ_band, Σ)   (hierarchical; ctx = time of day, subject, hard first item)
```
- Report and persist only **W∞** (settled warm-up), and only once the curve has flattened: posterior P(dW/ds > −0.1 turns/session) > .8 [U].
- W0 says nothing stable about the child. It is mostly "Taxila is new".
- A *rise* in W after a long break is expected (re-familiarisation) and is not a changepoint.

**(e) Concerns.**
- Talk volume and latency carry **no academic signal**. Teacher-rated achievement penalises shy children, while test scores do not (VT §3.2, Hughes & Coplan 2010) [V].
- A parent or sibling in the room, a shared phone, and ASR drop-outs on quiet speech all depress these indicators.
- Code-switching ratios reflect home language, not style (CD §4).

**(f) Parents.** *"Aarav takes a few warm-up turns before he talks freely (usually 3-5 lately, fewer than in his first week). Taxila starts each lesson with quick tap-and-choose questions."* Never "shy", "introvert", "quiet type" or "sharmila".

### 3.6 Curiosity as a trait (epistemic curiosity, Litman)
**(a) Definition.** Epistemic curiosity is the desire for knowledge that motivates exploring ideas and closing knowledge gaps (Litman 2008) [S]. Two factors:
- **I-type (interest):** the pleasure of new ideas, diversive and open-ended.
- **D-type (deprivation):** the felt need to resolve a specific gap, specific and tension-reducing.

Related systems: Kashdan's multidimensional framework, with facets such as joyous exploration, deprivation sensitivity and stress tolerance (used in Sönnichsen 2026) [V-existence]. The *state* information-gap mechanism is MI §1.5. Here the question is the stable individual difference.

**(b) Trajectory and validity.**
- A parent-report I/D measure exists for young children (Piotrowski, Litman & Valkenburg 2014, *Infant Child Dev* 23:542) [S]. It has been used with Korean parents of 7-9-year-olds (Chung & Schulz 2026, n = 1,020) [V].
- Overall curiosity at grade 1 predicted early scientific reasoning, and I-type predicted later science knowledge at grades 3-4, beyond prior knowledge and cognitive ability (Koerber & Osterhaus 2026, n = 122) [V].
- Curiosity (as typical intellectual engagement) and effort (as C) jointly rival intelligence in predicting performance (von Stumm, Hell & Chamorro-Premuzic 2011) [V].
- *Operationalisation is the weak point.* Most curiosity measures are adult questionnaires. Jirout & Klahr (2012) [V] propose defining children's exploratory curiosity as their **threshold of desired uncertainty**, measured behaviourally by choices between more- and less-uncertain options.
- In 8-12-year-olds, parent-reported curiosity related to *feeling happier* under uncertainty but **not** to how much information children actually sought (Ryan, Dodd & FitzGibbon 2025) [V]. Questionnaire and behaviour are different things.
- Trajectory 6-15: curiosity is commonly claimed to decline in school [U: Engel 2011 per MI]. Intrinsic motivation declines linearly from grade 3 to 8 (MI §1.1) [V].

**(c) Taxila analogues** (behavioural, opportunity-adjusted):
- Child-initiated questions per opportunity-minute. Typed by form: explanatory *why/how* vs factual *what/which*; and by role: tangent (I-like) vs pursuit of an unresolved item, i.e. returning to it or asking a follow-up after the answer (D-like) [U mapping].
- Optional exploration actions in simulations and games: manipulating a variable beyond what the task required; opening an "extra" card.
- Choices of the more uncertain option in a designed choice (Jirout-style): "this box we know; this one is a mystery".
- "Aur batao" or follow-up after the answer. Interest *after* the answer mattered more for adolescents (Fandakova & Gruber 2021 via MI) [V].

**(d) Models.**
```
Question rate:   Q_is ~ NegBin(μ_is, κ);  log μ_is = log(opp_min_is) + α_i + β1·licence_is + β2·subject_is + β3·pSuccess_is
                 α_i ~ N(μ_band, σ_α²)    licence = Taxila's explicit question invitations in session s (Taxila manufactures the opportunity)
Uncertainty choice: P(choose uncertain option | ΔU) = logistic(θ_i − b·ΔU)   →  threshold of desired uncertainty u*_i = θ_i / b
Follow-up:       Beta-binomial on P(follow-up | answer given to a child question)
```
Persist α_i, u*_i and the follow-up rate only after the LST gate (TV3) and reliability ≥ .70 (TV4).

**(e) Concerns.**
- Questions depend on licensing, on the culture of questioning adults [U], on language comfort and on ASR quality. The offset and covariates handle some of this, not all.
- An I/D split of *children* has no behavioural validation. An I/D split of *question types and teaching moves* is harmless and useful (§7).
- Curiosity is the trait parents most want to hear about ("is my child curious?"). That is exactly why it must stay behavioural (TV7).

**(f) Parents.** *"Asked 9 of her own questions this week, mostly 'why' questions about plants. Taxila saves one of them to open the next lesson."* This links to MI's child-thread mechanism. Never "a curious child" or "not curious".

---

## 4. What is ethically and validly inferable: the inference ladder

### 4.1 The ladder
| rung | what | example | status |
|---|---|---|---|
| R0 | **Explicit statement** by child or parent | "jokes kam karo"; parent sets "speak slower" | allowed; sticky until revoked (VT V1/V2) |
| R1 | **Session state** | warming, strained, playful today | allowed in memory only; never persisted or reported (VT, MI) |
| R2 | **Counted behaviour with Taxila**, with n and window | "asked 9 questions this week" | allowed; parent-visible |
| R3 | **Context-conditioned contingency** with reliability ≥ .70 | "after question-first corrections, retries 80% (12/15); after direct ones 55% (6/11)" | allowed; drives slow knobs (mode-gated, VT §4.10); parent-visible with uncertainty |
| R4 | **Cross-context Taxila style**: an R3 that holds across subjects and months and passes the LST gate | "takes a few warm-up turns, across subjects, since July" | allowed only as a summary of R3s; always scoped "with Taxila" |
| R5 | **Trait or temperament** | "introvert", "low conscientiousness", "curious child" | **banned in product.** Research only, group-level, consented, validated instruments (TV12) |
| R6 | **Clinical, mental-health or moral attribution** | "anxious", "ADHD-like", "lazy", "attention-seeking" | **banned everywhere.** Safeguarding and referral paths only (LS §4.5.6, CD §7.3) |

### 4.2 Why the ladder stops at R4
1. **Validity ceiling.** §1 item 5: assistant-style conversation reaches r ≈ .12 (Peters 2024) [V]. Digital footprints sit at the "correlational upper limit" of behaviour predicting personality, around .3-.4 [S: Azucar 2018 TLDR; U: exact values]. There is nothing validated for children.
2. **Context specificity** (§2.2): R5 claims generalise to contexts Taxila never sees.
3. **Instability** (§3.3): childhood ordering changes, so a trait claim made at 8 is out of date by 11.
4. **Actionability.** R3 is what the teacher can act on (VT L2: one knob per variable). An R5 label adds no knob that R3 lacks. It adds only risk.
5. **Harm** (§8).

### 4.3 How wrong would labels be? (computed; `temperament-vibe-calc.py` §A, §E)
Tercile labels ("high / medium / low"), from an estimate correlating r with the true trait:

| r (estimate, true trait) | P(true top third, given "top third" label) | P(true *bottom* third, given "top third" label) | overall tercile agreement |
|---|---|---|---|
| .12 (assistant-style LLM, Peters 2024) | .38 | .29 | .37 (chance = .33) |
| .27 (best LLM on interviews, Zhu 2025) | .44 | .23 | .41 |
| .44 (LLM eliciting personality, Peters 2024) | .52 | .16 | .47 |
| .60 | .60 | .10 | .53 |
| .80 (well beyond any realistic ceiling) | .72 | .03 | .65 |

**Base rates make it worse for minority labels.** Suppose a "shy" detector had sensitivity .70 and specificity .80, and 10-20% of children were truly highly inhibited. Then 53-72% of labelled children would be mislabelled (PPV .28-.47).

Even a detector far better than anything published would put a wrong label on a large share of children. A wrong label then stays in a parent's mind (§8).

---

## 5. Measurement models

### 5.1 Population-calibrated Beta-binomial (replaces VT's fixed prior strength)
For a binary-outcome dimension k (humour play-along, harder-choice, retry, choice uptake), child i in age band b:
```
y_ik ~ Binomial(n_ik, p_ik),   p_ik ~ Beta(μ_bk·φ_bk, (1 − μ_bk)·φ_bk)
ICC_bk = 1 / (φ_bk + 1)                      (share of trial variance that is between-child)
posterior mean  p̂_ik = (y_ik + μ_bk φ_bk) / (n_ik + φ_bk)     shrinkage weight w = n/(n+φ)
reliability of child estimate  ρ_ik = n_ik / (n_ik + φ_bk)    (Spearman-Brown on the ICC)
```
- (μ, φ) per band and dimension are estimated by marginal maximum likelihood or a hierarchical Bayes fit across all children, refreshed monthly.
- VT's s0 = 4 is the special case φ = 4, meaning ICC = .20 and ρ = .70 at n ≈ 9.3. If the real ICC for humour play-along is .05 (φ = 19), then ρ = .70 needs n ≈ 44. VT's current N_FLOOR = 8 would then move knobs on noise.
- **TV5 makes the floor dimension-specific:** move only when ρ_ik ≥ .70.
- Decay (VT §4.5) still applies. It is equivalent to a power prior that discounts old trials by γ = 0.5^(Δd/H).

### 5.2 If-then contingency model (the core of R3)
```
logit P(y_ij = 1) = (β0 + u0_i) + (β1 + u1_i)·x_ij + γᵀ c_ij
  y  = child response after teacher move j (e.g., retry within 1 turn)
  x  = move variant (e.g., question-first = +½, direct-specific = −½)
  c  = covariates: KT pSuccess for the item, minute-in-session, subject, time of day, session index
(u0_i, u1_i) ~ MVN(0, Σ),  τ1² = Σ[1,1]
child signature  s_i = β1 + u1_i ;  empirical-Bayes reliability  λ_i = τ1² / (τ1² + SE(û1_i)²)
```
Approximate SE² ≈ 16/n for n contrast trials split evenly at p ≈ .5. Reliability by between-child spread τ (computed):

| τ (between-child SD of slope, logit) | n = 20 | 40 | 80 | 160 | 320 | n for λ = .70 |
|---|---|---|---|---|---|---|
| 0.25 | .07 | .14 | .24 | .38 | .56 | 597 |
| 0.50 | .24 | .38 | .56 | .71 | .83 | 149 |
| 0.75 | .41 | .58 | .74 | .85 | .92 | 66 |
| 1.00 | .56 | .71 | .83 | .91 | .95 | 37 |

**Causal identification needs micro-randomisation.** If Taxila picks the direct frame *because* the child looks robust, the observed contingency is confounded by Taxila's own policy.
- Whenever the safety and invariant envelope allows, choose x by randomisation with probability π ∈ [0.2, 0.8]. Log π, and estimate with inverse-propensity weights. This is the micro-randomised-trial logic used in mobile health (Klasnja et al. 2015) [U].
- Randomisation happens *only between variants that both satisfy every invariant*. For example, both error frames name the step (VT VI1). So no child is ever given a worse-than-acceptable move for the sake of measurement.
- Taxila's density turns this from a cost into an asset. Thousands of turns per child make per-child causal contingencies feasible where τ ≥ 0.5.

### 5.3 Latent state-trait decomposition (the TV3 gate)
For a continuous indicator Y (log words per turn, log onset latency, warm-up turns, question rate) measured on indicator t within session s:
```
Y_its = τ_i + ζ_is + ε_its        τ_i ~ N(μ, σ_τ²) person;  ζ_is ~ N(0, σ_ζ²) occasion;  ε ~ N(0, σ_ε²)
Con  = σ_τ² / (σ_τ² + σ_ζ² + σ_ε²)      consistency (trait-like share)
OSpe = σ_ζ² / (σ_τ² + σ_ζ² + σ_ε²)      occasion specificity (state-like share)
Rel  = Con + OSpe
reliability of a child's mean over k sessions:  ρ_k = σ_τ² / (σ_τ² + (σ_ζ² + σ_ε²/m)/k),  m = indicators per session
```
- **Gate.** A dimension may be persisted (R3/R4) only if Con ≥ OSpe and ρ_k ≥ .70 for the evidence window in use. Otherwise it is session-only (R1), and VT uses it only to set SessionState.
- If an intermediate dimension has ρ₁ = .3 per session, it needs 5.4 sessions for .70 and 9.3 for .80 (Spearman-Brown, computed). At ρ₁ = .1 it needs 21 and 36. Under 60-day decay, ~9 recent sessions is attainable for a daily user. ~36 is not.
- Fit with covariates (subject, time of day, difficulty) so that "situation" variance is not misread as person variance. Context effects that are *consistent within the child* (child × subject random effects) become R3 conditional statements ("in maths more than in Hindi").

### 5.4 Change over time
- **Smooth drift:** VT's decay plus a local-level filter per child-dimension (CD §2.7 form): η_t = η_{t−1} + w_t, y_t = η_t + e_t.
- **Abrupt change:** Bayesian online changepoint detection (Adams & MacKay 2007) [U] on session aggregates, with hazard 1/60 sessions. Flag "pattern changed" when P(run length < 5) > .8 holds for 3 consecutive sessions.
  - After a flag, reset the arm's evidence to the population prior blended 50:50 with the post-change data [U].
  - Tell the parent only "this has changed lately". Never a reason, because Taxila does not know it.
- **Known breakpoints:** the school-year start, exam season, a long gap (the §3.5 familiarity curve restarts), and a new device. These are covariates, not changepoints.

### 5.5 Intraindividual variability (research only)
A mixed location-scale model gives each child both a mean μ_i and a variability σ_i: y_is ~ N(μ_i, σ_i²), log σ_i ~ N(·). How variable a child is may itself be a stable individual difference (Fleeson 2001 [S]; CD §2.7 links WM variability to fluid intelligence [V]). It is **not** reported to parents ("varies a lot" reads as "unreliable child"). It is used only to widen intervals and in S-TV1.

### 5.6 Fairness and invariance (TV11)
- **Extractor DIF:** for each extractor e (laugh token, "pata nahi", question detector, slang) and group g (Hindi-dominant vs English-dominant sessions, gender, region), require |precision_e,g − precision_e,ref| ≤ .05 on the M1 labelled set (VT §6). Otherwise the extractor is dropped or group-calibrated.
- **Dimension DIF:** in the validation sample (S-TV2), fit y_dim ~ criterion + group + criterion × group. A significant group or interaction term means the dimension measures group membership, not just the criterion.
- **Default audit:** age-band defaults and priors are fitted *without* gender, region or language covariates. A monthly report checks that knob distributions do not diverge by gender beyond what is explained by explicit preferences [U threshold: standardised difference < 0.2].

### 5.7 Validity design (makes the work publishable)
A multitrait-multimethod design (Campbell & Fiske 1959) [U] in a consented sub-sample:
- **Methods:** Taxila ISP; parent questionnaire (TMCQ for 7-10, EATQ-R parent for 9-15; HSQ-Y for 8-11; I/D curiosity parent form); child self-report (EATQ-R self ≥ 10 only, Soto 2008 caveat); teacher rating where a school partner exists.
- **Pre-registered convergent hypotheses** [U, all expected modest given §2.2]:
  - settled warm-up W∞ with TMCQ/EATQ-R shyness: r ≈ .20-.35
  - retry-after-error contingency with attentional focusing or inhibitory control: r ≈ .15-.30
  - question rate α_i with I/D curiosity: r ≈ .15-.30
  - humour reciprocity with HSQ-Y affiliative: r ≈ .15-.25
- **Pre-registered discriminant hypotheses:** |r| < .10 between W∞, words per turn or latency and KT mastery (θ) after age adjustment. This *tests* the claim that quietness carries no academic signal *in Taxila data*. |r| < .10 with SES proxies, collected only with consent.
- **Power:** detecting r = .20 at 80% power, two-sided α = .05, needs n ≈ 194. r = .15 needs n ≈ 346 per age band analysed.
- **Measurement invariance:** configural, metric and scalar across Hindi/English instruction language and gender for the questionnaires (adaptations need translation and back-translation) [U standard practice].

---

## 6. The Interaction Style Profile (ISP): specification

### 6.1 What it is
The ISP is the **parent-facing and research-facing view of VT's slow knobs**. It shows each R3/R4 contingency or rate that passed its gates, with uncertainty and with what Taxila changed because of it. The ISP and VibeProfile share one data source. The ISP adds the psychometric gates (TV3-TV5), the uncertainty states, and the parent copy rules.

### 6.2 Dimensions
| id | dimension (internal name, never shown) | estimand | signals (VT) | model | knob(s) it explains | expected LST class [U] |
|---|---|---|---|---|---|---|
| ISP1 | settled warm-up | W∞_i, turns before a free open answer once Taxila is familiar | V3, V5 | §3.5 curve | `openingRamp` | mixed; trait-leaning after week 2 |
| ISP2 | think time | median onset after think-questions (log), ASR-confident turns only | V4 | §5.3 | `waitNudgeSec` | mixed (device and network add occasion noise) |
| ISP3 | turn length and pace tolerance | log words per turn; barge-ins per 10 turns; "aur batao" rate | V3, V17 | §5.3 + §5.1 | `teacherTurnWords`, `endpointSilenceMs` | mixed |
| ISP4 | own questions | α_i (question rate per opportunity), share of why/how; follow-up rate | V5, MI curiosityQs | §3.6 | `choiceRate`, thread openers, curiosity teasers (MI D10) | unknown; S-TV1 |
| ISP5 | correction-frame fit | s_i: retry given question-first vs direct-specific | V10 | §5.2 (micro-randomised) | `errorFrame` | contingency; unknown |
| ISP6 | bounce-back after error | P(retry within 1 turn given an error), adjusted for pSuccess | V10 | §5.2 (intercept) | `challengeFrame`, scaffold timing | trait-leaning [U] (EC-like) |
| ISP7 | challenge appetite | P(chooses harder when offered), randomised option order | V9 | §5.1 | `challengeFrame` | state-leaning (depends on day and mood) |
| ISP8 | choice style | P(takes a choice); share of "teacher's pick" (MI D9) | V9 | §5.1 | `choiceRate` | unknown |
| ISP9 | humour reciprocity | P(play-along given kind k), within the band ceiling | V7, V8 | §5.1 per kind | `humourDose`, `humourKinds` | unknown |
| ISP10 | social-talk appetite | social turns initiated; return-to-task latency | V16 | §5.1 + §5.3 | `socialTurns` | state-leaning |
| ISP11 | exploration in optional parts | optional actions per module minute; uncertainty-choice threshold u*_i | module events | §3.6 | Forge "explore" extensions offered | unknown; S-TV5 |

**Not ISP dimensions** (and why):
- A-like compliance: §3.2, manipulation risk.
- Any negative-affect aggregate: R6 adjacency.
- Humour style: TV8.
- Talkativeness as "confidence": a false inference.
- Speed as "intelligence": CD §2.5.
- Variability: §5.5.
- Anything gender-, region- or dialect-derived: VT §4.9.

### 6.3 Uncertainty states (what the parent sees beside each line)
| state | rule [U thresholds] | display |
|---|---|---|
| `not_enough_yet` | ρ < .50 or n below the dimension floor | the line is not shown, or "Taxila is still getting to know how Aarav likes to learn" (once, globally) |
| `early_pattern` | .50 ≤ ρ < .70 | shown only if the knob already moved by explicit preference; tag "early" |
| `consistent` | ρ ≥ .70, LST gate passed, no changepoint in 21 days | the line, with counts and a range |
| `changing` | changepoint flagged (§5.4) | "This has changed recently. Taxila is adjusting." No reason given. |
| `depends_on_the_day` | Con < OSpe (fails TV3) | **not shown**. The knob runs session-only. |

Ranges are given in natural units, as an 80% interval of the child's typical value: "usually 3-6 seconds", "about 7 in 10 times". **Never** a percentile, a score, or a comparison with other children (CD4).

### 6.4 Types (sketch; extends VT `src/learner/vibe/types.ts`)
```ts
// src/learner/isp/types.ts — pure; derived from VibeProfile + aggregates; no free text from any LLM
import type { AgeBand, Knob } from '../vibe/types';
export type IspDim = 'warmup'|'thinkTime'|'turnPace'|'ownQuestions'|'correctionFit'|'bounceBack'
                   |'challenge'|'choiceStyle'|'humour'|'socialTalk'|'exploration';
export type IspStatus = 'not_enough_yet'|'early_pattern'|'consistent'|'changing'|'depends_on_the_day';
export interface IspContext { subject?: string; difficulty?: 'easier'|'matched'|'harder'; daypart?: 'morning'|'afternoon'|'evening' }
export interface IspEstimate {
  dim: IspDim; ageBand: AgeBand; context: IspContext | null;   // null = across contexts (R4)
  value: number; interval80: [number, number]; unit: 'seconds'|'turns'|'per10'|'proportion'|'perWeek';
  nTrials: number; reliability: number;                        // EB or Spearman-Brown, §5.1-5.3
  lst?: { con: number; ospe: number };                         // TV3 gate inputs
  randomised: boolean; propensityLogged: boolean;              // §5.2 causal status
  status: IspStatus; since: string; lastChangeAt?: string;
  knobs: Knob[];                                               // what Taxila changed because of it
  evidence: { count: number; of: number; windowDays: number }; // rendered verbatim, e.g. "12 of 15, last 30 days"
}
export interface InteractionStyleProfile { childId: string; computedAt: string; mode: 'session_adaptive'|'persisted_adaptive'; items: IspEstimate[] }
```
Storage: derived nightly from VT's `vibe_session_agg` and `vibe_slow`. There is no new behavioural table. Retention and cascade follow VT §4.10.

### 6.5 Rendering pipeline (deterministic; the LLM never writes a parent line)
`IspEstimate → template(dim, status, context) → slot-fill(counts, range, knob) → lexicon gate (TVI1) → structure gate (TVI2) → parent card`.
Templates are authored and reviewed copy, one per dimension × status, in Hindi and English. They are UI strings, not prompt text, so the recitation rule does not apply. They are still reviewed for the §9 rules.

---

## 7. How the teacher should adapt

### 7.1 Principles
- **A1. Adapt to the contingency, not the construct.** Literature tells Taxila *which knobs are worth having*. The child's own R3 data tells it *where to set them*.
- **A2. Defaults first, personalisation second.** Age-band defaults (VT §4.2, §5) carry most of the value. If VT's E-VIBE RCT (M6) shows that session-adaptive beats defaults-plus-explicit, personalisation earns its place. Otherwise it is removed.
- **A3. The safe direction is fast; the stretching direction is slow** (VT hysteresis). Taxila retreats from humour, dares or slang after one bad signal, and advances only after two sessions on two days.
- **A4. Scaffold and stretch, for every child.** INSIGHTS reframed shy children as observers and used scaffold-then-stretch. Shy children then gained in maths and critical thinking (VT §3.1) [V]. The move is universal, triggered by state, never by type.
- **A5. Expectation firewall.** ISP values never enter KT, item difficulty selection, mastery thresholds or the praise *category*. They act only through VT knobs, which change *how* Taxila teaches, never *what it expects* (TVI4). This blocks the self-fulfilling channel (Jussim & Harber 2005) [V].
- **A6. Explore honestly.** Use micro-randomised variants within the invariant envelope (§5.2). Give a child-facing explanation if asked ("I try different ways to see which helps you most"). That is honest and autonomy-supportive, not manipulation.
- **A7. Let the child steer.** Explicit statements (R0) override everything except invariants. Asking the child is cheaper and more valid than inferring: "short answers or long ones today?" is a legitimate move at most once per session [U].
- **A8. Development-aware.** Band-C dips (TV10) loosen nothing about standards. They shift framing toward autonomy, personal-best goals and identified value (MI D6-D7).

### 7.2 Literature → knob → contingency that sets it
| what the literature says matters | knob (VT) | the contingency that sets it (ISP) |
|---|---|---|
| EC predicts achievement; persistence is the active ingredient (Nasvytienė; Credé) [V] | segmenting, hint timing, `challengeFrame` | ISP6 bounce-back: low → shorter steps, earlier first rung, named difficulty; high → delay hints, allow "dare" |
| Surgency-like approach and activity favour active formats [U] | `teacherTurnWords`, `choiceRate`, module pacing | ISP3 barge-ins and ISP8 choices taken |
| NA-like withdrawal after harsh correction; negative relationships hurt more in primary (Roorda 2011, VT) [V] | `errorFrame`, `energy` | ISP5 randomised frame contrast; session `strained` |
| Inhibition is a reaction to novelty (Fox 2005) [V] | `openingRamp`, `waitNudgeSec` | ISP1 settled warm-up (not first-meeting warm-up); ISP2 think time |
| I-type vs D-type curiosity (Litman) [S] | *move typing*: I-moves (tangent, "what if", new example), D-moves (pinpoint the gap, predict-then-reveal) | ISP4: is the child's follow-up rate higher after I-moves or D-moves? Randomise move type between invariant-safe options |
| Threshold of desired uncertainty (Jirout & Klahr) [V] | size of curiosity teasers (MI D10, verge of knowing) | ISP11 u*_i |
| Humour helps when course-related and affiliative (Banas; Bieg & Dresel) [S] | `humourDose`, `humourKinds` | ISP9 per-kind reciprocity |
| Choice helps most when culturally congruent; "teacher's pick" matters (MI D9) [V] | `choiceRate` | ISP8 |

### 7.3 Personality-matched teaching: what not to import
- Personality-keyed tutoring maps (e.g. PATS) were evaluated only on simulated students (VT §3.7) [V].
- Learning-styles matching failed the crossover test (LS §2).
- There is no evidence that "introverts learn better with X" holds for children in a way that beats observing each child's response to X.
- The ISP therefore never has a "type → strategy" table.

---

## 8. Why personality labels must not be shown to parents

1. **They would be invalid.** §4.3: at the best published conversational accuracy, a "top third" label is wrong more often than right, and wrong in the opposite direction about one time in four. No child validation exists.
2. **They would claim the wrong context.** A label generalises "with Taxila" to "is". Cross-informant agreement of ~.28 (§2.2) means Taxila's view and the parent's view will often differ. A label then invites the parent to doubt either their child or their own eyes.
3. **They would go stale.** Childhood rank-order stability is low (.31), and adolescence carries normative dips (§3.3). Labels persist in memory longer than the behaviour does [U].
4. **Identity language changes children.**
   - Generic person praise produced more helplessness after mistakes than process praise (Cimpian 2007) [S].
   - Category framing ("be a helper") backfired after setbacks (Foster-Hanson 2020) [V].
   - Identity framing ("be a scientist") lowered girls' persistence relative to action framing (Rhodes 2019) [V].
   - Children readily form essentialist beliefs from category language (Rhodes & Mandalaywala 2017) [V].
   - A parent who reads "Taxila says he's a shy one" will say it to the child. *The parent is the transmission channel.*
5. **Expectations feed back.** Teacher-expectancy effects are small on average, but larger among stigmatised groups (Jussim & Harber 2005) [V]. In India, labels like *sust*, *kamzor* or *shararti* travel through family and school [U]. A machine-issued label carries false authority.
6. **People believe personality descriptions whether or not they are valid.** This is the Barnum/Forer effect (Forer 1949) [U: bibliographic check failed this session]. Participants rated LLM-generated profiles as accurate as questionnaire results (arXiv 2602.15848) [V-abstract]. Parent satisfaction with a label therefore says nothing about its truth, and A/B tests on "parent liked the report" would select for Barnum text.
7. **Labels would encode gender and dialect.** EC and surgency differ by gender (Else-Quest 2006) [V]. LLMs carry dialect prejudice (VT) [V]. A label pipeline would launder those differences into "personality".
8. **Labels are not actionable.** Every useful thing a label could prompt is already expressed as an R3 contingency with a knob and a toggle.
9. **Labels sit next to diagnosis.** "Anxious", "hyper" and "inattentive" are a short step from clinical claims, which are banned (CD8; VT §4.9).

**What replaces labels:** behavioural, situational, counted, revocable descriptions of *what helps*. This is the goodness-of-fit stance, applied to parent communication.

---

## 9. What can be said to parents

### 9.1 The parent contract for style statements (extends CD §8.2)
| # | rule | check |
|---|---|---|
| PC1 | Describe **actions in situations**: verb + condition. | template structure |
| PC2 | Scope every line: "with Taxila", plus a time window ("lately", "this month"). | structure gate (TVI2) |
| PC3 | Give the count ("12 of 15") or a natural-unit range ("usually 3-6 seconds"). | slot required |
| PC4 | Say what Taxila does about it, with an on/off toggle. | slot required |
| PC5 | No adjectives or nouns about the child's nature, in any language. | lexicon gate (TVI1) |
| PC6 | No comparison with other children, siblings, "most kids" or norms. | lexicon + structure |
| PC7 | Say once, on the overview: "Children often behave differently with different people and on different days. What you see at home is just as real." | fixed copy |
| PC8 | Changes are reported as changes, without guessed reasons. | template |
| PC9 | Maximum 6 style lines. Show only `consistent` or `changing` status. Order by usefulness to the parent (has a toggle, recently changed). | renderer |
| PC10 | Nothing in the ISP is ever shown or read to the child as a description of themselves. The child hears only explicit-preference confirmations ("okay, fewer jokes"). | VT VI6 + this file's TVI3 |

### 9.2 Examples
| don't (fails) | do (passes) |
|---|---|
| "Aarav is shy and introverted." | "With Taxila, Aarav usually takes a few warm-up turns before talking freely (3-5 lately, down from 8 in his first week). Taxila starts lessons with quick tap-and-choose questions. [toggle]" |
| "Meera has low self-control / is impulsive." | "Meera often answers before Taxila finishes the question (about 3 times per 10 turns). Taxila now keeps its questions shorter. [toggle]" |
| "Riya is very curious!" | "Riya asked 9 of her own questions this week, mostly 'why' questions about plants. Taxila keeps one to start the next lesson." |
| "Kabir has a great sense of humour." | "Kabir joins in with lesson riddles (7 of 9 times), so Taxila uses one now and then. [toggle]" |
| "Ishaan gives up easily." | "After a mistake on a new kind of problem, Ishaan does better when Taxila asks a question about the step first (retried 12 of 15 times) than when it states the step (6 of 11). Taxila uses the question style with him." |
| "Ananya is sensitive; handle with care." | (no line: a negative-affect aggregate is never persisted or reported) |
| "Compared with other Class 5 children, Dev is more talkative." | (no line: comparison and talkativeness are both banned) |

### 9.3 What parents *can* usefully do with this
- Recognise the conditions under which their child does well ("starts better with an easy warm-up").
- Turn off any adaptation they disagree with.
- Tell Taxila something it cannot see ("he's like this only when his sister is around"). That becomes an explicit setting (R0), not an inference.
- Apply goodness of fit at home: they can reproduce what helps at home without changing who they think the child is. Whether this actually changes parent behaviour is S-TV4's question [U].

---

## 10. Research programme (publishable, pre-registered)

| id | study | design | primary outcome | n [U] |
|---|---|---|---|---|
| S-TV1 | **Reliability and stability of AI-tutor interaction signatures in Indian children 6-15** | Observational, all consenting users. LST decomposition (§5.3) and EB reliability (§5.2) per dimension × band. Familiarity curves (§3.5). Stability over 1, 3 and 6 months. | Con/OSpe per dimension; trials needed for ρ = .70; 6-month stability | ≥ 300 per band |
| S-TV2 | **Convergent and discriminant validity against temperament, curiosity and humour questionnaires** | MTMM (§5.7). TMCQ/EATQ-R parent; EATQ-R self ≥ 10; HSQ-Y 8-11; I/D parent form; invariance testing across Hindi/English | Pre-registered r ranges; discriminant \|r\| < .10 with mastery | ≈ 200-350 per band |
| S-TV3 | **Does contingency-keyed adaptation beat age-band defaults?** | VT M6 arms, *plus* a micro-randomised trial (MRT) within the adaptive arms to estimate proximal knob effects (e.g. errorFrame → retry; ramp → first open answer) | Proximal: retry, continuation. Distal: delayed learning (non-inferiority 0.05 SD) and voluntary return | 6 weeks; ≥ 600 children |
| S-TV4 | **Parent report format RCT: trait labels vs behavioural descriptions** | Randomise parents to (a) ISP behavioural lines, (b) the same information plus a *mock* trait summary in a vignette study only (never about their own child), (c) no style section. Measure essentialist beliefs about the child, intended actions, comprehension and trust calibration. | Parent essentialism scale [U instrument]; accuracy of understanding; trust | ≥ 400 parents |
| S-TV5 | **Behavioural curiosity in an AI tutor** | Embedded Jirout-style uncertainty choices plus question-rate model (§3.6) vs I/D parent report; 3- and 6-month prediction of science-topic learning gains (KT) beyond prior knowledge | Convergence r; incremental prediction ΔR² | ≥ 300 aged 6-11 |
| S-TV6 | **Humour comprehension and reciprocity across 6-15 in Hinglish** | Cross-sectional using humour-kind outcomes; small comprehension probes ("what did Taxila mean?") on reviewed content-irony items in band C only | Age curves of play-along and confusion by kind; misfire rate (VT M3) | ≥ 200 per band |

**Ethics for all studies.** Questionnaire data never writes to the product profile (TV12). Every analysis is group-level. Children can stop at any time. Results are reported with the null findings. Indian adaptation of instruments needs translation, cognitive interviewing and invariance testing before use [U]. Partnering with cVEDA/PARAM investigators for norms is worth exploring [U].

**Why this is publishable.** No published study has measured within-child if-then interaction signatures at this density in children, in a non-Western multilingual setting, with micro-randomised identification and multi-method validity [U: based on this session's searches only]. The contribution stands even if the result is "mostly state-like, weakly trait-related". That result would itself argue against personality-inferring EdTech.

---

## 11. Measurements this design depends on (and kill criteria)
| id | measurement | decides | bar [U] |
|---|---|---|---|
| TM1 | ICC per Beta-binomial dimension per band (§5.1) | dimension-specific floors (TV5) | — (descriptive) |
| TM2 | Con vs OSpe per continuous dimension (§5.3) | persist or session-only (TV3) | Con ≥ OSpe |
| TM3 | τ of contingency slopes (§5.2) | whether ISP5/ISP6 are estimable per child | τ ≥ 0.5 on logit, else population-level policy only |
| TM4 | Extractor precision by group (§5.6) | which extractors ship | \|Δprecision\| ≤ .05 |
| TM5 | Parent-report comprehension test (5 lines, 3 regions, 2 languages) | template wording | ≥ 80% correctly paraphrase "with Taxila, lately" scope |
| TM6 | Lexicon gate recall on 1,000 adversarial parent-line generations (from template bugs, not an LLM) | gate completeness | 100% catch on the banned list; review misses quarterly |

**Kill criteria.**
- If TM2 shows that every ISP dimension fails the LST gate in a band, the ISP section is removed for that band. Parents then get only explicit settings and age-band explanations.
- If S-TV3 shows no benefit of contingency-keyed adaptation, the ISP survives only as an *explanation* of explicit settings.
- If S-TV4 shows behavioural lines increase parent essentialism vs no section, the style section is removed entirely.

---

## 12. Invariants (eval-gated, alongside VT VI1-VI11 and MI's MI*; "if your change trips them, your change is wrong")
| id | predicate | method |
|---|---|---|
| TVI1 | No parent-facing or child-facing text contains trait or type vocabulary. EN: shy, introvert(ed), extrovert(ed), lazy, stubborn, naughty, sensitive, nervous, anxious, moody, hyper, impulsive, slow learner, gifted, genius, curious child, personality, temperament, "type of child", "kind of learner". HI/Hinglish: sharmila/sharmili, sust, aalsi, ziddi, shararti, nazuk, ghabraata/ghabraati, kamzor, dheela, tez dimaag, swabhav, fitrat, "nature hi aisa". | lexicon (case- and script-insensitive; Devanagari + roman) |
| TVI2 | Every ISP line contains a scope token ("with Taxila" / "Taxila ke saath"), a window token, and a count or range slot, and names its knob. | structure check |
| TVI3 | No ISP value appears in the teacher prompt as anything other than VT knob values. No dimension names, no statuses, no "the child is…" in the prompt. | prompt assembly test |
| TVI4 | ISP values are not inputs to KT, difficulty selection, mastery thresholds or the praise category. | import graph check (module boundary) + unit test |
| TVI5 | No comparison with other children in any ISP output (percentile, "most children", "for his age"). | lexicon + structure |
| TVI6 | Micro-randomisation only chooses between variants that both pass VI1-VI11. Propensity is logged for every randomised move. | event-log audit |
| TVI7 | An NA-like aggregate, humour-style estimate or A-like compliance metric is never written to storage. | schema test (no such columns/keys) |
| TVI8 | A dimension's parent line renders only when status ∈ {consistent, changing}, reliability ≥ .70 and the LST gate passes. | renderer unit test |

---

## 13. Open questions
1. **Indian reference data.** Can Taxila obtain Indian TMCQ/EATQ-R (or CBQ) distributions? cVEDA/PARAM measures temperament [V], but its instrument choice and data access are unknown [U].
2. **Instrument adaptation.** Hindi versions of TMCQ, EATQ-R, HSQ-Y and the I/D child form are unknown [U]. Building them is a study in itself.
3. **Familiarity vs style.** How many sessions until W∞ is identifiable? This should be measured in S-TV1, not assumed.
4. **TTS and irony.** Does Azure TTS render ironic or teasing prosody well enough for band-C content irony? This needs a blind listening test before VT unlocks `contentIrony`.
5. **Parent-in-room.** Not inferred (VT). Should parents be able to mark "I was helping today", so the session is excluded from the ISP?
6. **Micro-randomisation consent.** Compliance is deprioritised, but the honesty floor stands. Is a one-line parent disclosure ("Taxila tries different teaching styles to learn what helps") sufficient? [U: owner decision]
7. **Adolescent self-view.** From ~12, should a child see their own ISP and edit it? This is autonomy-supportive, but it risks the identity effects in §8.4. It belongs in S-TV4 extended to children.
8. **Half-life by band.** Should the decay half-life follow age (TV10 suggestion), or stay VT's single H = 60 d until S-TV1?

---

## 14. Proposed `context/` entries (for the main loop to merge; all `decision` entries need the reversal conditions in §0)
- **decision `isp-signatures-not-traits`** (TV1/TV2). Reverse: none for the product.
- **decision `isp-lst-gate`** (TV3). Reverse: per-dimension S-TV1 evidence.
- **decision `isp-eb-reliability-70`** (TV4/TV5), *supersedes* the fixed `N_FLOOR = 8` in VT §4.5 for slow-knob movement.
- **decision `parent-style-action-language`** (TV6) + invariant TVI1/TVI2.
- **decision `micro-randomised-knob-variants`** (§5.2, TVI6).
- **rejection candidate `llm-personality-inference-for-children`**: what was considered was inferring Big Five or temperament from the child's dialogue. What breaks: best published conversational accuracy is r = .12-.44 in adults (.12 in assistant mode), with no child validation; at r = .27 a "top third" label is right 44% of the time (computed). This is not tried in-house. It is a literature-based rejection and should be tagged as such.
- **measurement placeholders TM1-TM6**: no numbers until measured.

---

## 15. References

**Temperament (Rothbart) and instruments.**
- Rothbart MK, Ahadi SA, Hershey KL, Fisher P 2001, *Child Dev* 72:1394, doi:10.1111/1467-8624.00355 [V]
- Simonds J, Rothbart MK, TMCQ, PsycTESTS doi:10.1037/t70081-000 [S]
- Ellis LK, Rothbart MK 2001, EATQ-R, PsycTESTS doi:10.1037/t07624-000 [S]
- Kozlowski MB et al. 2025, *Psychol Assess*, doi:10.1037/pas0001368 [V]
- Romero EY et al. 2026, *Child Youth Care Forum*, doi:10.1007/s10566-025-09868-2 [V]
- Else-Quest NM, Hyde JS, Goldsmith HH, Van Hulle CA 2006, *Psych Bull* 132:33, doi:10.1037/0033-2909.132.1.33 [V]
- Zentner M, Bates JE 2008, *Int J Dev Sci* 2:7, doi:10.3233/dev-2008-21203 [S]
- Harvey E, Déry M, Lemelin JP, Bégin V 2024, *Child Dev*, doi:10.1111/cdev.14150 [V]
- Nasvytienė & Lazdauskas 2021 and Poropat 2014: see VT §8 [V]

**Personality in youth, stability and change.**
- Soto CJ, Tackett JL 2015, *Curr Dir Psychol Sci* 24:358, doi:10.1177/0963721415589345 [V]
- Shiner R, Caspi A 2003, *J Child Psychol Psychiatry* 44:2, doi:10.1111/1469-7610.00101 [V-abstract]
- Soto CJ, John OP, Gosling SD, Potter J 2008, *JPSP* 94:718, doi:10.1037/0022-3514.94.4.718 [V]
- Soto CJ et al. 2011, *JPSP* 100:330, doi:10.1037/a0021717 [V]
- Van den Akker AL et al. 2021, *Dev Psychol*, doi:10.1037/dev0001135 [V]
- Roberts BW, DelVecchio WF 2000, *Psych Bull* 126:3, doi:10.1037/0033-2909.126.1.3 [V]
- Bleidorn W et al. 2022, *Psych Bull*, doi:10.1037/bul0000365 [V]
- Roberts BW, Luo J, Briley DA et al. 2017, *Psych Bull* 143:117, doi:10.1037/bul0000088 [S]
- Measelle JR, Ablow JC, Cowan PA, Cowan CP 1998, *Child Dev* 69:1556, doi:10.2307/1132132 [S]
- Katz BA, Shields AN, Watts AL, Wu C, Tackett JL 2026, *Psych Bull*, doi:10.1037/bul0000515 [V]

**Personality and achievement.**
- Mammadov S 2021/2022, *J Pers* 90:222, doi:10.1111/jopy.12663 [V]
- Duckworth AL, Seligman MEP 2005, *Psych Sci* 16:939, doi:10.1111/j.1467-9280.2005.01641.x [V]
- Credé M, Tynan MC, Harms PD 2017, *JPSP*, doi:10.1037/pspp0000102 [V]
- von Stumm S, Hell B, Chamorro-Premuzic T 2011, *Perspect Psychol Sci*, doi:10.1177/1745691611421204 [V]

**Person-situation, informants, state-trait.**
- Fleeson W 2001, *JPSP* 80:1011, doi:10.1037/0022-3514.80.6.1011 [S]
- Shoda Y, Mischel W, Wright JC 1994, *JPSP* 67:674, doi:10.1037/0022-3514.67.4.674 [V]
- Steyer R, Schmitt M, Eid M 1999, *Eur J Pers* 13:389 [S]
- Achenbach TM, McConaughy SH, Howell CT 1987, *Psych Bull* 101:213, doi:10.1037/0033-2909.101.2.213 [S]
- De Los Reyes A et al. 2015, *Psych Bull* 141:858, doi:10.1037/a0038498 [S]
- Campbell & Fiske 1959 MTMM [U]
- Adams & MacKay 2007 BOCPD [U]
- Klasnja P et al. 2015, micro-randomised trials [U]

**Shyness, inhibition, culture.**
- Fox NA, Henderson HA, Marshall PJ, Nichols KE, Ghera MM 2005, *Annu Rev Psychol* 56:235, doi:10.1146/annurev.psych.55.090902.141532 [V]
- Coplan RJ, Prakash K, O'Neil K, Armer M 2004, *Dev Psychol* 40:244, doi:10.1037/0012-1649.40.2.244 [S]
- Chen X, Cen G, Li D, He Y 2005, *Child Dev* 76:182, doi:10.1111/j.1467-8624.2005.00838.x [V]
- Chen X, Rubin KH, Sun Y 1992, *Child Dev* 63:1336, doi:10.2307/1131559 [S]
- Holla B et al. 2025 (PARAM/cVEDA protocol), *BMC Psychiatry*, doi:10.1186/s12888-025-07492-x [V]
- Hughes & Coplan 2010 and O'Connor et al. 2014 INSIGHTS: see VT §8 [V]

**Humour.**
- James LA, Fox CL 2016, *HUMOR* 29, doi:10.1515/humor-2016-0042 [V]
- Fox CL, Dean S, Lyford K 2013, Child HSQ, PsycTESTS doi:10.1037/t25581-000 [S]
- Martin RA et al. 2003, HSQ, PsycTESTS doi:10.1037/t07239-000 [S]
- Banas JA, Dunbar N, Rodriguez D, Liu SJ 2011, *Commun Educ* 60:115, doi:10.1080/03634523.2010.496867 [S]
- Smith J, Glenwright M 2025, *Front Psychol*, doi:10.3389/fpsyg.2025.1672104 [V]
- Glenwright & Pexman 2010, McGhee, Bieg & Dresel: see VT §8

**Curiosity.**
- Litman JA 2008, *Pers Individ Differ* 44:1585, doi:10.1016/j.paid.2008.01.014 [S]
- Piotrowski JT, Litman JA, Valkenburg P 2014, *Infant Child Dev* 23:542, doi:10.1002/icd.1847 [S]
- Jirout J, Klahr D 2012, *Dev Rev* 32:125, doi:10.1016/j.dr.2012.04.002 [V]
- Koerber S, Osterhaus C 2026, *Br J Dev Psychol*, doi:10.1111/bjdp.70041 [V]
- Ryan ZJ, Dodd HF, FitzGibbon L 2025, *Q J Exp Psychol*, doi:10.1177/17470218241252651 [V]
- Chung Y, Schulz PJ 2026, *JMIR Pediatr Parent*, doi:10.2196/89929 [V]
- Sönnichsen H et al. 2026, *Sci Rep*, doi:10.1038/s41598-026-61554-y [V-existence of 5DC facets]
- MI §1.5 for state curiosity

**Labels, identity language, expectancy.**
- Cimpian A, Arce HMC, Markman EM, Dweck CS 2007, *Psych Sci* 18:314, doi:10.1111/j.1467-9280.2007.01896.x [S]
- Foster-Hanson E, Cimpian A, Leshin RA, Rhodes M 2020, *Child Dev*, doi:10.1111/cdev.13147 [V]
- Rhodes M, Leslie SJ, Yee KM, Saunders K 2019, *Psych Sci*, doi:10.1177/0956797618823670 [V]
- Rhodes M, Mandalaywala TM 2017, *WIREs Cogn Sci*, doi:10.1002/wcs.1437 [V]
- Jussim L, Harber KD 2005, *PSPR* 9:131, doi:10.1207/s15327957pspr0902_3 [V]
- Forer BR 1949 [U]

**Machine inference of personality.**
- Peters H, Cerf M, Matz SC 2024, arXiv:2405.13052 [V]
- Zhu J, Jin R, Coifman KG 2025, arXiv:2507.14355 [V]
- "Can LLMs Assess Personality?" 2026, arXiv:2602.15848 [V-abstract]
- Park G et al. 2015, *JPSP* 108:934, doi:10.1037/pspp0000020 [S]
- Azucar D, Marengo D, Settanni M 2018, *Pers Individ Differ* 124:150, doi:10.1016/j.paid.2017.12.018 [S]
- VT §8 for Staab, Peters & Matz, Hofmann, CUPID

**House.**
- `docs/research/learner/vibe-temperament.md`, `learner/motivation-interest.md`, `psychology/cognitive-development.md`, `learning-science.md`
- `docs/research/psychology/temperament-vibe-calc.py` (computations in §4.3 and §5.2-5.3)

---

## Methodologist review

**Reviewer stance.** Adversarial review by a developmental psychologist and psychometrician, 2026-10-02. The question asked of every claim: would it survive peer review at *Child Development* or *Psychological Assessment*, and would it be safe if a parent acted on it? The document's overall stance (signatures, not traits; no labels; counted behaviour; randomised identification) is sound and better than most EdTech practice. The problems below are where the document's own machinery is miscalibrated, where a citation does not say what it is used for, or where it states a result the evidence cannot support.

**Verification done in this review.** Abstracts were re-read via the Europe PMC REST API, Crossref and the arXiv API. WebSearch was unavailable because the shared budget was exhausted.
- Confirmed as stated: Roberts & DelVecchio 2000 (abstract figures); Bleidorn 2022; Van den Akker 2021 (N = 2,640, ages 8-18, pubertal links small); Mammadov 2022 (267 samples, N = 413,074; O/E/A larger at elementary/middle); Peters, Cerf & Matz 2024 (.443 / .218 / .117); Zhu 2025 (max r = .27, κ < .10); Katz 2026 (informant effects); Ryan, Dodd & FitzGibbon 2025 (n = 133, 8-12); Else-Quest 2006; Rothbart 2001; Soto 2008; Soto 2011; Koerber & Osterhaus 2026; Chung & Schulz 2026; Holla 2025 (PARAM/cVEDA); James & Fox 2016; Rhodes 2019 (N = 501); Foster-Hanson 2020.
- Found to be misread or misapplied: Fleeson 2001, Roberts & DelVecchio 2000 (as applied), Cimpian 2007, arXiv 2602.15848, Shoda 1994 (as generalised), Hughes & Coplan 2010 (as generalised).
- All calculations in `temperament-vibe-calc.py` re-run and reproduced. The arithmetic is correct. The issues are in its assumptions (M3, M4).

### C. Critical: fix before any parent-facing or published use

**C1. The TV3 LST gate (Con ≥ OSpe) is the wrong criterion and contradicts the source it cites.**
- Fleeson (2001) [V, abstract re-read] is an experience-sampling study of **adults**, not children. It found within-person variability was high, *and also* that "individual differences in central tendencies of behavioral distributions were almost perfectly stable". High occasion variance does not stop a person's *mean* from being a reliable, stable individual difference. That is the paper's central point.
- In the doc's own §5.3 formula, a dimension with Con = .20 and OSpe = .40 (m = 3 indicators) reaches ρ_k = .79 over k = 10 sessions and .88 over 20 (computed). Gate TV3 would ban it, even though its 10-session mean is more reliable than many questionnaire scales.
- The gate also lets through dimensions it should stop. With sessions close together, states carry over from one session to the next. A random-intercept LST model then counts that carried-over state as trait, which inflates Con.
- **Correction:**
  - Replace "Con ≥ OSpe" with two conditions. (i) Aggregate reliability ρ_k ≥ threshold over the window actually used. (ii) **Retest stability of the aggregate** across non-overlapping windows, for example r(window₁, window₂) ≥ .50 at a 4-6 week lag.
  - Fit a trait-state-occasion or STARTS model (autoregressive occasion residuals) instead of the independent-ζ model, so carry-over is not counted as trait.
  - Remove the Fleeson citation from TV3 and from the children claim in §3.3. For children, cite only CD §2.7.

**C2. Reliability is computed as if trials were independent, so it is overstated.**
- §5.1 (ρ = n/(n+φ)) and §5.2 (SE² ≈ 16/n) treat every trial as an independent Bernoulli draw from the child's true rate. In practice, trials cluster inside sessions, and sessions have their own states (the very occasion variance §5.3 describes).
- Forty retries from 3 sessions carry far less person-level information than 40 retries from 20 sessions. A two-level Beta-binomial cannot tell these apart, so its "ρ ≥ .70" can be mostly session state.
- **Correction:** use a three-level model (trial within session within child) for every binary dimension. Compute reliability from the child-level variance against the error of the child mean, using effective n = sessions × design effect, not raw trial count. TM1 must report the session-level ICC as well as the child-level ICC.

**C3. The reliability gate does not protect against the Barnum effect, which the document itself identifies.**
- Reliability is a *between-child* ratio, τ²/(τ² + SE²). A line can pass ρ ≥ .70 and still describe behaviour that is typical for the age band. Showing "usually 3-6 seconds of think time" to a parent then presents a population fact as a personal insight. That is a Forer statement with a count attached, the very pattern §8.6 warns about.
- Conversely, when τ is small, a shrunken estimate is mostly the prior. Its "80% interval of the child's typical value" is then mostly the band distribution.
- **Correction:** add a **distinctiveness gate** to TVI8. A line renders only if P(|child − band default| > δ_dim) ≥ .90, with δ_dim set to a practically meaningful unit, *or* if a knob actually moved away from its default because of it. Otherwise the honest line is the band default, which PC6 forbids framing as a comparison, so no line is shown.

**C4. The document's own flagship example fails its own gates.**
- §9.2 (Ishaan): 12/15 vs 6/11 retries. Fisher's exact test gives p = .22. The slope reliability at τ = 1.0 is about .56, and at τ = 0.5 about .24 (computed, using p-specific variances).
- That example would be blocked by TV4 and TVI8. Showing it as a "do (passes)" example teaches copywriters and engineers that 26 trials is enough.
- **Correction:** replace it with counts that clear the gate (at τ = 1.0 and p ≈ .8, about 58 contrast trials; see M3), or label it "illustrative only, would not render".

**C5. The discriminant-validity prediction is implausible and its criterion is contaminated.**
- §1 item 2 ("talkativeness is not evidence of anything academic"), §3.5(e) ("talk volume and latency carry no academic signal") and the pre-registered |r| < .10 between W∞, words per turn or latency and KT mastery are overclaims.
  - Words per turn (MLU-like) indexes expressive language proficiency and age.
  - Response latency is a classic index of retrieval fluency and item mastery.
  - Shyness *depresses measured performance in face-to-face oral testing*. Shy Year-5 pupils scored lower on vocabulary than peers when tested individually or orally, but not in group written testing (Crozier & Hostettler 2003, *Br J Educ Psychol*, doi:10.1348/000709903322275858) [V, abstract re-read]. Socially withdrawn children's achievement is lower and bidirectionally linked in boys aged 6-14 (BJEP 2022, doi:10.1111/bjep.12504) [V].
- Taxila is a face-to-face *oral* assessor, so its KT θ for inhibited children is plausibly biased downward. Testing W∞ against KT θ is then circular: a near-zero r could mean "no link" or "both measures share the same oral-format bias".
- The Hughes & Coplan 2010 claim ("test scores do not penalise shy children") could not be verified (no abstract available). It is contradicted by Crozier & Hostettler and should be downgraded to [S] with that conflict noted.
- **Corrections:**
  1. Rewrite §3.5(e): *"Talk volume and latency are confounded with language proficiency, age and item mastery. They are not evidence of ability or of its absence, and must never be read as either."*
  2. Pre-register a small negative W∞-mastery correlation (r ≈ −.10 to −.20), not a null.
  3. Use a **non-oral criterion** (tap or written items, or a school test) for the discriminant test, with language proficiency partialled out.
  4. Add a fairness study: does KT mastery for high-W∞ children differ between voice-answered and tap-answered items of matched difficulty? If it does, inhibited children are being under-estimated, which is a learner-model bias, not a style finding.

**C6. Barge-in is a system artefact, and the parent line built on it re-encodes "impulsive".**
- V17 barge-ins (an EC-like analogue in §3.1, ISP3, and the §9.2 Meera example) are driven largely by voice-activity-detection and endpointing thresholds, echo cancellation, network latency, TTS turn length and device. These are properties of Taxila, not the child.
- "Meera often answers before Taxila finishes the question (about 3 times per 10 turns)" will be read by Indian parents as *jaldbaaz* or impulsive. That is exactly the R5/R6-adjacent inference the lexicon gate exists to block. It passes TVI1 only because it avoids the word.
- **Correction:** drop barge-in as an EC-like analogue. Keep it as an *endpointing knob input* only (internal, never parent-facing), and audit it by device and network class before using it even there.

**C7. Ethics approval and consent are prerequisites for publication, not compliance extras.**
- The owner deprioritised compliance. Journals, however, will not publish child research without:
  - prospective ethics-committee approval (in India: ICMR *National Ethical Guidelines for Biomedical and Health Research Involving Human Participants*, 2017, which include child participants and require assent from about age 7) [S]
  - informed parental consent obtained *before* the data are collected
- S-TV1 ("all consenting users"), S-TV3 (the MRT) and the in-product micro-randomisation are human-subjects research on minors. Logs collected without research consent cannot be retro-fitted into a paper.
- India's DPDP Act 2023 §9(3) restricts "tracking or behavioural monitoring of children". The scope of the exemptions under the 2025 Rules for educational purposes is unverified here [U]. It is a viability risk for the ISP as a whole, not only a paperwork item.
- **Correction:** add an ethics row to §10. It should cover protocol approval before S-TV1 starts, research consent separate from product consent, child assent wording, and the open question 6 disclosure made a hard requirement for the MRT.

### M. Major

**M1. Roberts & DelVecchio (2000) is misapplied to ages 6-15.**
- The .31 figure is a meta-regression estimate for "childhood" *at a fixed 6.7-year retest interval* [V, abstract]. As I recall the paper, the "childhood" estimate leans on infant and preschool temperament data, and age-period estimates for 6-11.9 and 12-17.9 were roughly .45-.47 at their observed intervals [S, from memory; verify against Table 2].
- So "a trait claim made at 8 is out of date by 11" (§4.2.3) and "rank-order stability is low in childhood (.31)" (TV10, §8.3) overstate instability for Taxila's age range and horizons. Over the 1-3 year intervals Taxila works on, stability in middle childhood is moderate.
- The anti-label argument does not need this overstatement. Context-specificity and the validity ceiling carry it.
- **Correction:** state ".31 at a 6.7-year interval, across a childhood period that includes early childhood". Present stability in 6-15 as *moderate and rising*. Delete "out of date by 11".

**M2. The population trend is turned into an individual reassurance (ecological fallacy).**
- The early-adolescent C/A dip is a small mean-level effect. Soto 2011 is *cross-sectional* web self-report from age 10, which is exactly the age at which Soto 2008 shows large acquiescence differences. Part of the 10-12 "dip" may be measurement, not development.
- "A 12-year-old who seems less careful than at 10 is developmentally typical, not regressing" (§1 item 3) tells a parent something about *their* child that a small mean shift cannot support.
- **Correction:** say "small average dips in carefulness are common in early adolescence. A change in one child's pattern with Taxila is not, on its own, a sign of a problem." Note in §3.2(b) that Soto 2011 is cross-sectional and self-report.

**M3. The reliability table assumes p = .5, which is optimistic.**
- SE² ≈ 16/n holds only at p = .5. Retry and play-along rates are likely around .7-.85. At p = .8 the trials needed for λ = .70 rise from 37 to about 58 (τ = 1.0) and from 149 to about 233 (τ = 0.5) (computed).
- Between-child SDs of *treatment-effect slopes* are usually much smaller than intercept SDs. τ ≈ 0.25-0.5 is the realistic prior, which means 150-600+ contrast trials.
- With H = 60 d decay, the effective window is about 87 days.
- **Correction:**
  - Report the table at p = .5 and p = .8.
  - State that ISP5 (correction-frame fit) is expected to be per-child estimable only for heavy users. The default expectation should be a population-level frame policy with child-level estimates as the exception (TM3 already allows this; make it the stated prior).

**M4. Reliability ≥ .70 is a group-research convention, not an individual-reporting standard.**
- Conventional guidance (Nunnally) is about .70 for group comparisons, about .80 for low-stakes individual use, and about .90 for consequential individual decisions [S].
- Knob movement is reversible and low-stakes, so .70 is defensible there. A parent statement about one named child is an individual-level report that will be remembered.
- For a *decision* (which frame to use), reliability is also the wrong quantity. Use the posterior probability that the effect exceeds a minimum important difference, and the expected loss.
- **Correction:**
  - Keep .70 (with C2 and C3) for slow knobs.
  - Raise the parent-render threshold to .80, plus the distinctiveness gate.
  - Make knob choice in ISP5 decision-theoretic: P(s_i > δ) ≥ .9 under the IPW-adjusted posterior.

**M5. The micro-randomised contingency is not identified as written.**
- *Outcome mechanics.* A question-first correction frame asks the child something, so it elicits a response by construction. "Retry within 1 turn" is then partly demanded by the frame. The contingency compares a prompt with a non-prompt, not two child responses. Fix: define the outcome as *correct* retry on the next opportunity of the same skill, or align response windows so both frames give an equal response opportunity.
- *Carry-over and learning.* Repeated within-session randomisation produces carry-over: the child learns the frame, and the previous frame affects the next response. The MRT literature estimates *causal excursion effects* with lagged treatment indicators. Per-child random slopes with IPW is not a standard estimator. Fix: include lag-1 and lag-2 treatment terms, and validate the estimator by simulation before relying on it.
- *Citation.* Klasnja 2015 (*Health Psychol* 34(S):1220) is a well-known paper and should be [S], not [U].

**M6. Multiplicity across dimensions, contexts and time.**
- There are 11 dimensions × context splits (subject, difficulty, daypart; §5.3 R3 "in maths more than in Hindi") × monthly refits × a changepoint detector.
- Some lines will clear a .70 gate or fire a "changed" flag by chance. For example, at a 2% monthly false-alarm rate per dimension, about 1 child in 5 would get a spurious "this has changed recently" line each month [U, illustrative].
- **Corrections:**
  1. Shrink context effects hierarchically toward the child's overall value. Only the shrunken difference may qualify.
  2. Cap context-conditional lines.
  3. Calibrate the BOCPD hazard and flag rule by simulation under the no-change model to a target false-alarm rate. Add this as TM7.

**M7. Within-band age and ASR error are uncontrolled confounds.**
- Bands span about 3 years. Words per turn, latency, question detection and humour comprehension all change steeply with age, so a band-level prior is the wrong shrinkage target for the youngest and oldest children in a band.
- ASR word-error rate is higher for younger children and quieter speakers, and it differs by dialect. It therefore biases every speech-derived dimension by age.
- **Correction:** add continuous age (months) as a covariate in every model and as a DIF grouping in §5.6. Add *recall* (missed detections) and calibration to the extractor DIF criterion, which is currently precision only; a detector that misses quiet children's questions passes a precision test. Size the labelled set so the CI on Δprecision and Δrecall is narrower than .05.

**M8. The identity-language evidence comes from 4-5-year-olds and from speech directed at the child.**
- Cimpian 2007 [S]: the experimental contrast is *generic vs non-generic* praise ("you are a good drawer" vs "you did a good job drawing") in 4-year-olds. It is **not** person vs process praise, which is Kamins & Dweck 1999 [S]. TV6 and §8.4 misdescribe it. Correct the wording.
- Foster-Hanson 2020 (ages 4-5) [V] and Rhodes 2019 (young children, N = 501) [V] also study preschoolers hearing language about an activity.
- TV6 applies these to *adults reading reports* about children aged 6-15. That transfer is plausible but untested [U]. It is S-TV4's question, and §0 should say so.
- Behavioural lines with "usually" are themselves characterising generics about an individual ("Aarav usually takes warm-up turns"). They may be essentialised as well. That is why the S-TV4 kill criterion matters. Keep it, and add a *child-outcome* harm measure: whether parents repeat the line to the child, and whether children's self-descriptions change.

**M9. Shoda, Mischel & Wright (1994) is over-generalised.**
- The sample was children in a residential summer treatment programme for children with adjustment problems [S]. Signatures were built from very dense, multi-observer coding over about 6 weeks.
- Later work found that *distinctive* (normative-profile-removed) situation-behaviour profiles are only modestly consistent [S: Furr & Funder 2004; Sherman, Nave & Funder 2010].
- TV1's "stable if-then profiles are *the* coherent unit of child behaviour" overstates it. **Correction:** "if-then signatures exist alongside mean-level differences and can be stable (Shoda 1994, clinical camp sample). Their distinctive part is modest, so S-TV1 must test it."

**M10. The arXiv 2602.15848 citation is quoted selectively.**
- The same abstract reports *moderate convergent validity (r = .38-.58)* in N = 33 guided conversations, with three traits statistically equivalent to the questionnaire.
- The "felt accuracy ≠ validity" point stands, because the authors offer no evidence that perceived accuracy tracks validity. But omitting the r = .38-.58 result reads as cherry-picking.
- **Correction:** report it alongside the other estimates, note the tiny N, the adult sample and the eliciting conversation design, and keep the inference: user ratings cannot validate profiles.

**M11. The S-TV3 and S-TV4 designs cannot answer their questions.**
- *S-TV3:* non-inferiority at 0.05 SD on a continuous delayed-learning outcome needs about 2(1.645 + 0.842)²/0.05² ≈ **4,950 per arm** (one-sided α = .05, 80% power; computed). "≥ 600 children" is underpowered by about 8×. Use a margin of about 0.15 SD (≈ 550 per arm), or the realistic n, or a cluster design with a pre-test covariate (ANCOVA cuts n by 1 − ρ²_pre).
- *S-TV4:* arm (b) is a vignette, while arms (a) and (c) are about the parent's own child. Arm differences are then confounded with vignette vs own child. Make S-TV4 fully vignette-based (between-subjects, three formats) for the essentialism question. Run a separate own-child two-arm trial ((a) vs (c)) for comprehension, trust calibration and harm.

**M12. Under-10 self-report is overstated.**
- Soto 2008 covers ages 10-20 only, so it says nothing directly below 10.
- Measelle 1998 [S] shows that 5-7-year-olds give reasonably reliable, partly valid self-reports by puppet interview.
- **Correction:** "Questionnaire self-report is weak below about 10 (and noisy at 10-12). Age-appropriate methods (puppet interviews) can work from about 5, but none has been adapted for Hindi or for a voice tutor."

### m. Minor

- **m1.** §3.4(b) table rows are out of age order (7+ before 5-6). Glenwright & Pexman's 5-6 finding is that children detect non-literal meaning but do not yet distinguish sarcasm from irony; "not the speaker's intent" oversimplifies it. McGhee's stage model (1979) is largely untested and should be presented as [S] heuristics only.
- **m2.** §2.2 applies Achenbach (1987) cross-informant figures, which concern *behaviour problems*, to temperament and style. Parent-teacher agreement on temperament is in a similar modest range [S], but say which construct the .28 refers to.
- **m3.** Nasvytienė & Lazdauskas 2021 [V, abstract]: the EC-achievement link was *moderated by source of report*, so part of r = .31 is shared-informant variance. The r = .31 figure is not in the abstract; keep it as [S] via VT.
- **m4.** von Stumm 2011 is mostly drawn from adolescent and university samples. Don't present "third pillar" as established for ages 6-11.
- **m5.** §4.3 treats r with the *self-report questionnaire* as r with the "true trait". The criterion is itself unreliable: Zhu used the BFI-10, which has 2-item scales. Disattenuated values would be modestly higher. The conclusion is unchanged, but the label is wrong.
- **m6.** §3.5 familiarity model: warm-up turns are small counts, so use a Poisson or negative-binomial likelihood, not Gaussian error. Three random parameters per child need many sessions. Report identifiability (posterior contraction) in S-TV1 before any W∞ is persisted.
- **m7.** §6.3 "80% interval of the child's typical value" is ambiguous. Parents read "usually 3-6 seconds" as the range of the child's *behaviour*, which needs a posterior **predictive** interval (wider), not a credible interval for the mean. Specify which, and render the predictive one.
- **m8.** HSQ-Y affiliative humour concerns humour use with peers. Reciprocity to a tutor's lesson riddles is a different construct, so an expected r of .15-.25 is optimistic. Pre-register it as exploratory.
- **m9.** A4 (INSIGHTS) is a classroom and parent programme for children of about 5-7. "Scaffold-then-stretch as a universal AI move" is an extrapolation and should be [U] for transfer.
- **m10.** Counts shown without a reference ("asked 2 of her own questions") invite *self-supplied* norm comparison and sibling comparison, which PC6 cannot block. S-TV4 should measure it. Consider a rule that count lines appear only with the knob action, never as a bare tally.
- **m11.** TVI1 is necessary but not sufficient. Implicature ("takes a while to open up") passes the lexicon. Add a human review of every template × status × language before release, and re-run TM5 comprehension with a "what kind of child is this?" probe to detect essentialised readings.

### What survives intact
- TV1 and TV2 (no trait labels): strongly supported. The C1-C3 corrections make the gates stricter, not looser.
- The §4.3 label-accuracy and §4.3 PPV arithmetic: reproduced exactly.
- The A-like compliance and NA-aggregate exclusions (TVI7): correct and important.
- The expectation firewall (A5, TVI4): correct.
- The humour-style ban (TV8): correct.
- Questionnaires kept research-only (TV12): correct.
- The behavioural-curiosity stance (TV7): supported by Ryan 2025 (re-verified).

### Required additions to §11 and §12
- **TM7:** changepoint false-alarm rate under simulated no-change data, per dimension and across all dimensions per child per month. Bar: under 5% of children per month receive a spurious "changed" line.
- **TM8:** voice-vs-tap mastery gap by settled warm-up quartile, a test of oral-format bias in KT (C5).
- **TM9:** session-level vs child-level ICC per binary dimension (C2).
- **TVI9:** a parent line renders only if the distinctiveness gate (C3) passes and the render reliability is ≥ .80 (M4).
- **TVI10:** no V17 or barge-in-derived content in any parent-facing text (C6).
