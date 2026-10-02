# The parent psychology report: what to tell parents about how their child learns, how to say it, and when

**Date:** 2026-10-02 · **Scope:** Taxila, classes 1-9 (ages ~6-15). Parents receive weekly, monthly and term reports, built from months of voice dialogue, probe outcomes, game telemetry, timing, choices and session habits.
**Question:** What does research on feedback to parents say? That covers report cards, growth reports, parent-teacher communication, strength-based reporting, labels and expectancy effects, how parents act on information, praise styles, and Indian exam pressure. From that research, what should the **parent psychology report** contain, section by section? What uncertainty-language rules should it follow, and how should the weekly, monthly and term layouts look? The report must give parents a deep, accurate, useful picture of their child's learning without pseudo-science, labels or claims beyond the evidence.

**Builds on, does not repeat:**
- `design/parent-experience.md` (PX): rules PX1-PX10, the four state words *Abhi nahi / Seekh rahi / Aa gaya / Pakka*, the weekly WhatsApp card, the cadence cap, the "Kaise pata?" evidence view, and the PTM.
- `conductor/parent-loop.md` (PL): PL1-PL12, the WeekStory pipeline, the home-activity catalogue and `pickHomeActivity`, the praise library, the claim-checker (PL4), and declined requests (PL10).
- The psychology series. Each defines the allowed statement shapes for one construct; this file **composes** them into one report and adds the report-level rules:
  - `learning-over-time.md` (LOT): claim levels L0-L3 (§6.3) and banned wording (§7)
  - `cognitive-development.md` (CD): the parent contract (§8.2) and the estimability matrix (§8.1)
  - `metacognition-srl.md` (MS): §7, calibration tables and the SRL growth card
  - `motivation-habits.md` (MH): §6 statement shapes and §7 wellbeing markers
  - `temperament-vibe.md` (TV): §8 why labels must not reach parents, and §9 PC1-PC10
- `learning-science.md` (LS) §8.4 sets the format-efficacy threshold for "how they learn best". `learner/dialogue-affect.md` (DA) supplies the behavioural affect detectors and DA9 (session-position hazard). `learner/need-goals.md` (NG) supplies test windows and parent check-ins. `learner/llm-memory-child.md` (MEM) §7.3 supplies the memory-derived line.

**Evidence tags** (same meaning as the sibling files):
- **[V]**: the primary abstract was read this session, through the Europe PMC REST API, the ERIC API or a Crossref abstract.
- **[V-partial]**: the abstract was truncated before the result quoted, so only the part read is relied on.
- **[V, sib]**: verified on the same date by a sibling file, not re-fetched.
- **[S]**: title or bibliographic record only, a secondary source, or memory of the primary.
- **[U]**: a Taxila design default or estimate that must be measured.
- **[I]**: my inference from the cited evidence.

**Method.** The shared WebSearch budget was exhausted (200/200) before this review began. Discovery used about 70 structured queries against Europe PMC (core), ERIC and Crossref. No study found here evaluates **AI-generated psychological reports to parents of Indian children**. Most of the field-experiment evidence on parent messaging comes from the US (with Botswana, Malawi and Indian programme evaluations as exceptions), and most of the praise and expectancy evidence comes from US, European and Chinese samples. Everything about how Indian parents read and act on *this* report is extrapolation, until the measurement plan in §12 is run.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| PR-D1 | **The report is an intervention on the parent, and it is evaluated like one.** Its success measures are (a) calibrated parent beliefs, (b) autonomy-supportive parent behaviour, and (c) the child's delayed learning and wellbeing. Parent satisfaction is not a success measure | Information to parents changes what they do: upward-biased beliefs about effort were corrected and achievement rose (Bergman 2015) [V]. Feedback effects are large on average but highly heterogeneous, so they can be negative (Wisniewski et al. 2019, d = .48) [V]; Kluger & DeNisi 1996 [S]. Parents rate personality-like text as accurate whether or not it is valid (Forer 1949 [S]; TV §8 item 6 [V, sib]) | Never for the principle. Individual measures can be swapped if PRM1-PRM4 show they do not track child outcomes |
| PR-D2 | **Describe learning and actions in situations, never the learner.** Every child-describing sentence names a behaviour or skill, a condition, a count, a window, and what Taxila does (= TV PC1-PC5, CD §8.2, LOT §7, MS §7.1, MH §6) | Person praise and person criticism predict entity beliefs and challenge avoidance (Pomerantz & Kempner 2013 [V]; Gunderson et al. 2018 JECP [V]; Barger et al. 2022 [V]). Generic language makes children treat categories as natural kinds (Rhodes, Gelman & Leslie 2025) [V]. Identity framing lowered persistence relative to action framing (Rhodes et al. 2019) [V]. *The parent is the transmission channel* (TV §8) | Never |
| PR-D3 | **Compare the child only with herself and with the syllabus.** Self-referenced (ipsative) change and curricular level are allowed. Ranks, percentiles, norms, "most children" and sibling views are banned | Exposure to exemplary peers caused quitting (Rogers & Feller 2016, N = 5,740) [V]. Teachers' individual reference norm relates positively to self-concept, especially for struggling learners (Lohbeck & Freund 2021 [V]; Wilbert & Grunke 2010 [V]). Parents misremember norm-referenced results (Hopper 1977) [V] | Never for ranks. Band norms stay internal, for shrinkage only (LOT §7 item 7) |
| PR-D4 | **The strength-first rule, with a verified strength.** Every report opens with a real, evidenced strength: a skill now secure, or a counted action. If none passes threshold, it opens with what the child did this week | Parents' beliefs about a child's ability predict the child's later self-concept (Pesu et al. 2016) [V-partial]. Mothers' beliefs affect attainment via the child's aspirations (Scherr et al. 2011, N = 332) [V]. Inflated praise backfires for low-self-esteem children (Brummelman et al. 2014) [V], so the strength must be *true and modest*, never inflated | PRM3 shows strength-first framing lowers parents' calibration (they discount real problems) |
| PR-D5 | **Every pattern sentence passes a report-level false-claim budget.** Each L2 or L3 claim needs posterior ≥ .9, and the expected number of false pattern claims in one report, Σ(1 − Pᵢ), must stay ≤ 0.2 (weekly) or ≤ 0.3 (monthly or term) | Per-claim thresholds alone let a report with 8 pattern lines carry nearly one false line on average [I]. The sibling thresholds (LOT L2, MS-D3, LS §8.4) are per claim | PRM5 calibration shows the posteriors are under-confident, which would allow a looser budget |
| PR-D6 | **Uncertainty is shown as counts plus one of five fixed frequency words, never percentages or adjectives.** Words map to posterior rules (§5.2). *Pakka* is reserved for the mastery state and never means "certain" | Verbal probability terms are read very differently from person to person (Wintle et al. 2019, n = 924) [V]; Teigen 2022 [V]; Mosteller & Youtz 1990 [S]. Communicating uncertainty costs little trust, and numbers cost less than words (van der Bles et al. 2020, n = 5,780) [V]; Kerr et al. 2023, n = 10,519 [V]. Counts ("7 of 10") are natural frequencies [S: Gigerenzer & Hoffrage 1995] and read for a low-numeracy audience [I] | PRM6 shows Hindi-speaking parents misread a count format more than a word format |
| PR-D7 | **"How they learn best" reports only measured format effects that pass LS §8.4.** Below threshold it says "still learning what works for {topic type}". It never names a style. "No clear difference" is reported as a valid finding | The style-matching hypothesis fails the crossover test (LS §2.2) [V, sib]. Most children's format deviation u is expected to stay near 0 (LS §8.4) [V, sib] | E-PROFILE kill criterion fires (LS §8.7). The section then shows only what the child chose and enjoyed, plus population-best formats |
| PR-D8 | **Learning rhythms are descriptive by default. A time-of-day *claim* requires a parent-opted n-of-1 alternation (§6.3).** Within-session decline and break effects can be reported from ordinary data | In observational data, clock time is confounded with who holds the phone and why (LOT invariant 4, MHI3) [repo]. Time-of-day effects on performance are real at population level: −0.9% SD per hour later, and +1.7% SD after a 20-30 minute break (Sievertsen et al. 2016) [V]. They interact with chronotype (Goldin et al. 2020, randomised school shifts) [V]. An individual claim needs design-based identification [I] | Never for the observational ban. The n-of-1 protocol is dropped if PRM7 finds no child with P(δ) ≥ .9 after 8 weeks of alternation |
| PR-D9 | **One home action per report, and it is a talk, listening or everyday task, never homework help or checking.** It is paired with one process-praise cue and, when needed, one failure-response cue (= PL6, §6.1) | How parents are involved matters more than how much: quality, not quantity (Moroni et al. 2015, N = 1,685) [V]. Controlling involvement follows low self-concept and predicts worse outcomes (Silinskas & Kikas 2019) [V]. Parent autonomy support goes with achievement and psychological health (Vasquez et al. 2016, 36 studies) [V]. One text a week is too little and five too many (Cortes et al. 2021) [V] | PL6 reversal (PLM3/PLM5) |
| PR-D10 | **Pressure-proof by construction.** The report contains no countdown, no predicted mark, no "behind", no rank, no risk score. In exam windows it switches to the exam shape (§8.4): readiness counts plus a calm-response cue. After a parent-entered result, a failure-response card is always shown | Pressure turns mothers controlling (Grolnick et al. 2002, experimental) [V]. Parents' failure-oriented responses account for children's distress (Ng et al. 2019) [V]. Contingent self-worth drives psychological control (Ng, Pomerantz & Deng 2014) [V]. Higher parental expectations predicted *more* anxiety the following year (Sakaki et al. 2026) [V]. In Kolkata, 35% of class 10/12 students reported high academic stress and 37% exam anxiety (Deb, Strodl & Sun 2014) [V] | Never |
| PR-D11 | **No trait, type, diagnosis, affect or personality wording at any layer.** This is the union of the banned lists in LOT §7, CD §8.2, MS §7.4, MH §6 and TV §9, plus §5.4. It is enforced by predicate, not by instruction | The label-specific evidence: the "learning disability" label lowers teachers' expectations (Kashikar et al. 2023) [V]. Essentialist beliefs about personality are coherent and consequential (Haslam et al. 2004) [V]. Expectancy effects are small on average but larger for stigmatised groups (Jussim & Harber 2005) [V]. Further reasons in TV §8 | Never |
| PR-D12 | **The weekly report is short, the monthly report is the psychology report, and the term report is a narrative of growth.** Weekly: ≤ 5 lines, 60-90 s of voice (PX §8). Monthly: up to 8 sections, with the "then → now" card and a PTM agenda. Term: a learning story (§7.3) with an HPC-compatible competency page and the child's own voice | Weekly, specific, actionable teacher messages changed parent-child talk (Kraft & Rogers 2014/2015) [V]. Parents preferred standards-based report cards to single grades (Swan, Guskey & Jung 2014, n = 115 parents) [V]. Parents prefer cards combined with conferences (Gilbert & Ellis 1972) [V]. Narrative "learning stories" are an established formative format [S: Carr 2001; Sands & Lee 2024 V] | PRM8: parents do not open monthly reports (< 30%), in which case the content folds into the PTM |
| PR-D13 | **"Kaise pata?" on every line, and "what would change our mind" on every pattern.** The parent can open the evidence (items, dates, the child's own words) and see what result would revise the statement | PX1 and PX3 [repo]. Transparency about the limits of knowledge barely dents trust (van der Bles 2020) [V]. Parents' beliefs are often far off and need calibration rather than reassurance (Dizon-Ross 2019 [S]; Bergman 2015 [V]) | PRM2 shows the evidence view confuses parents (comprehension < 60%) → simplify it, keep the link |
| PR-D14 | **The report's validity is tested with a shuffled-report (anti-Barnum) test before any psychological section ships.** Parents must pick their own child's section over a level-matched decoy above chance | Barnum text is rated accurate regardless of truth (Forer 1949) [S]. People rate LLM profiles as accurate as questionnaire results (arXiv 2602.15848, via TV) [V, sib]. Satisfaction therefore cannot validate the report [I] | Never for the test. A section that fails it (discrimination ≤ 55%) is removed or reduced to counts |

---

## 1. Executive summary

1. **A psychology report to parents is an intervention, and interventions can harm.** Feedback averages d = .48, with large heterogeneity (Wisniewski 2019) [V]. In Kluger & DeNisi's 1996 meta-analysis a substantial share of feedback interventions *lowered* performance, especially when feedback pointed at the self rather than the task [S]. A parent report is feedback twice over: to the parent, and through the parent to the child. The design question is therefore which messages make parents act in ways that help, not how much to tell them.
2. **What parents do with information is the mechanism.** Detailed progress information corrected parents' over-optimistic beliefs, raised monitoring and raised achievement (Bergman 2015) [V]. Correcting parents' misbeliefs about absences cut chronic absence (Rogers & Feller 2018) [V, sib]. Weekly teacher messages changed the *content* of parent-child conversations (Kraft & Rogers 2014) [V]. The report's first job is **calibration**: closing the gap between what the parent believes and what the evidence shows, in both directions.
3. **How parents are involved decides whether involvement helps.** The evidence points the same way across several lines:
   - autonomy support (Vasquez 2016) [V]
   - quality over quantity in homework help (Moroni 2015) [V]
   - controlling help following low self-concept and predicting worse outcomes (Silinskas & Kikas 2019) [V]
   - process praise predicting incremental beliefs and later achievement (Gunderson 2013, 2018) [V]
   - person responses predicting poorer maths adjustment (Barger 2022) [V]
   - parents' *failure* mindsets, more than their intelligence mindsets, predicting children's mindsets (Haimovitz & Dweck 2016) [V].

   The caution: preregistered person-versus-process praise differences failed in one experiment (Bennett-Pierre 2024) [V], so process praise is a "name what she did" practice, not a mindset cure.
4. **Labels travel and stick.** A label in a parent report becomes a sentence said to the child. Generic and identity language shapes children's essentialist thinking (Rhodes et al. 2019, 2025) [V]. The "learning disability" label lowers expectations (Kashikar 2023) [V]. Expectancy effects are small on average, but concentrated in stigmatised groups (Jussim & Harber 2005) [V], and they are larger when the perceiver knows the child less (Raudenbush 1984) [V]. A machine-issued label carries false authority (TV §8).
5. **Indian parents bring high expectations, and the report must channel them.** Expectations correlate with achievement (r ≈ .28 longitudinal; Pinquart & Ebeling 2020, 169 studies) [V]. The benefit is in *expectations*, while aspiration-expectation gaps are harmful (Marsh et al. 2023, N = 16,197) [V], and high expectations predicted later anxiety (Sakaki 2026) [V]. Exam stress is high (Deb et al. 2014 [V]; NCERT 2022, 81% name studies, exams and results [V, sib]), and student suicides in India have risen (Dandona et al. 2026) [S]. The report never feeds marks pressure. It answers the marks question with skills-secure counts for the test chapters, and offers a calm-response cue.
6. **The report architecture** (§4-§8):
   - Every sentence is a *claim object* with counts, window, scope, level, posterior and evidence ids. A gate checks thresholds, the report-level false-claim budget and the banned lexicon.
   - The LLM only fills shapes. It never invents a pattern (PL4; inherited law: shapes, not lines).
   - Ten sections, in the owner's list, each with defined sources, thresholds and fallbacks, appear at different cadences (weekly ⊂ monthly ⊂ term).
7. **Uncertainty rules are concrete:** counts first; five frequency words with posterior definitions; "still learning" as an honest default state; "what would change our mind" for patterns; no percentages, no adjectives, no reasons guessed.
8. **Publishable research falls out of the design** (§11):
   - parent-belief calibration as an outcome (Brier score of one-tap parent predictions)
   - a shuffled-report anti-Barnum test of AI-written psychological descriptions
   - an RCT of report variants (process versus outcome framing, uncertainty display, strength-first) on parent behaviour and children's delayed learning
   - n-of-1 time-of-day alternations at scale.

---

## 2. Evidence, compressed to what changes the design

### 2.1 Feedback science: what level the feedback points at

| source | finding | design consequence |
|---|---|---|
| Wisniewski, Zierer & Hattie 2019, 435 studies, k = 994, N > 61,000 [V] | d = .48. Heterogeneity is large, and impact depends on the information content. Effects are higher on cognitive and motor outcomes than on motivational or behavioural ones | The report must carry *information* (what, how known, what next), not affirmation |
| Hattie & Timperley 2007 [V, ERIC desc.] | Feedback can be positive or negative. Its effectiveness depends on type and level (task, process, self-regulation, self) | Report lines target task (skill), process (what helped) and self-regulation (her own checks). The self level ("she's bright") is banned |
| Kluger & DeNisi 1996, *Psych Bull* [S, title] | Feedback-intervention theory: feedback that moves attention to the self (meta-task) weakens or reverses effects | No person-level summaries ("she's doing great"). Every positive line names a task |
| Butler 1987, 1988 (grades 5-6) [S] | Comments alone sustained interest and performance better than grades, or grades with comments | Counts and a comment, never a composite score or grade (PX §3 rejected Cuemath's composite) |
| Fong, Patall et al. 2019, 78 studies [V] | Negative feedback did not lower intrinsic motivation relative to neutral feedback. It was less demotivating when it included instructional detail on how to improve | Each "growth edge" carries what Taxila is doing and what helps (§6.8). A growth edge is never bare |
| Brooks, Carroll, Gillies & Hattie 2019 [V] | In upper primary classrooms, "feed forward" (next steps) was the least common feedback type | Every report ends with "what we are trying next" (§6.10) |

### 2.2 Report cards, growth reports and narrative assessment

- **Standards-based beats single grades for parents.** In a district where parents received both formats, they "overwhelmingly preferred the standards-based form" (Swan, Guskey & Jung 2014) [V]. Kentucky's statewide standards-based card was built with teachers (Guskey et al. 2010, 2011) [V]. Consequence: report against **NCERT learning outcomes** (skill rows), not a subject score. This matches PX's chapter frame and NEP's Holistic Progress Card direction [S: PARAKH HPC; M: verify the current HPC template].
- **Parents misunderstand norm-referenced information.** Parents of grade 4-5 children held "considerable misunderstanding and erroneous perceptions" about test results explained to them at conferences (Hopper 1977) [V]. Recent score-report studies still find limited comprehension (May 2024, dissertation) [V]. So: no percentiles and no stanines, and every number is a count of things the parent can picture.
- **Ipsative (self-referenced) feedback.** Comparison with the learner's own previous performance supports engagement with feedback (Hughes, Wood & Kitagawa 2014 [V]; Malecka & Boud 2023 [V], conceptual). For children, the teacher's *individual* reference norm related positively to self-concept in elementary school (Lohbeck & Freund 2021, n = 850) [V]. Social comparison is argued to be inappropriate for struggling learners (Wilbert & Grunke 2010) [V]. Consequence: "then → now" is the backbone of the monthly and term reports.
- **Narrative assessment.** *Learning Stories* (Carr 2001 [S]; Sands & Lee 2024 [V]; Reisman 2011 [V]) is a sociocultural, formative narrative format: what the child did, what it shows about learning, what next, plus the family's voice. Consequence: the term report is a learning story, but every sentence in it is still a claim object (§4). A narrative is a layout, not a licence to generalise.
- **Parent portals.** In correlational data, portal use goes with fewer ninth-grade course failures, but many families face access and usefulness barriers (Mac Iver et al. 2021) [V]. Technology-based communication alone showed no significant effect beyond elementary school (Jeynes 2025) [V, sib]. Consequence: the channel is not the effect. WhatsApp plus voice reaches parents (PX), and the *content* carries the effect.

### 2.3 Field experiments on messaging parents: dose, specificity, personalisation

| study | design and result | design consequence |
|---|---|---|
| Kraft & Rogers 2014/2015 [V] | Weekly individualised teacher messages: +6.5 pp credit earning (41% fewer failing). The messages shaped the content of parent-child conversations. Improvement-focused messages beat positive ones [V, sib PX] | The weekly report names one specific, improvement-framed thing to talk about |
| Bergman 2015 (LA field experiment) [V] | Parents held upward-biased beliefs about the child's effort. Detailed information reduced the bias, increased monitoring and produced achievement gains at low cost | Report effort as counted actions (PX §0.8), because parents' unaided beliefs are biased |
| Bergman & Chan 2021 [S, title; PX S] | Automated alerts: course failures −27%, attendance +12%, no test-score effect | Expect parent-behaviour effects before learning effects. Measure both |
| Cortes, Fricke, Loeb & Song 2021 [V] | A single weekly text did less than a set of three (information + actionable advice + encouragement). Five, with more advice, did worse than three | Each report carries *fact → tip → encouragement*. The weekly cap is ≤ 2 learning messages (PX) |
| Doss, Fahle, Loeb & York 2017 [V] | Differentiated, personalised texts: children 50% more likely to read at a higher level than general texts; parent literacy activity +0.31 SD; effects driven by children far from average | Personalise the home action to the child's actual skill state (PL §6.3 already does). The biggest gain is for children far from typical |
| Doss, Fricke, Loeb & Doromal 2022 [V] | A maths-only text programme showed no benefit. A combined maths, literacy and SEL programme helped, mainly girls and the lower half | Do not expect maths-only home prompts to work by themselves. Mix in talk and everyday contexts (PL rank 1-2) |
| Cortes et al. 2019 (timing) [V] | Weekend delivery was more beneficial on average | The parent chooses the report day; default to the weekend [U] |
| India: CHAMP/MLAP [V, sib PL]; Pandey, Goyal & Sundararaman 2008 [S]; Banerjee et al. 2010 [S, memory] | Home-visit and workbook support for mothers: +0.032 SD. Community information campaigns had modest effects. Information alone did not mobilise parents in Uttar Pradesh | Indian evidence predicts small effects from information alone. The report must hand over a *doable action*, and the PTM carries the conversation |

### 2.4 Praise, criticism and responses to failure

- **Process versus person.**
  - Parents' process praise at 14-38 months predicted incremental frameworks at 7-8 years (Gunderson et al. 2013, N = 53) [V], and fourth-grade achievement via trait beliefs (Gunderson et al. 2018 *Dev Psych*) [V].
  - Mothers' daily *person* praise, not process praise, predicted children's entity theory and challenge avoidance six months later (Pomerantz & Kempner 2013, N = 120, mean age 10) [V].
  - Perceived process praise predicted learning goals, and perceived criticism predicted entity theories (Gunderson et al. 2018 *JECP*, N = 317 + 282) [V].
  - Parents' person responses to maths success and failure predicted poorer later maths adjustment, |β| = .06-.16 (Barger et al. 2022, N = 546, age ~7.5) [V].
  - Lab origins: Mueller & Dweck 1998 [S]; Kamins & Dweck 1999 [S]; Cimpian et al. 2007 (generic "you are a good drawer") [S].
- **Caveat.** A preregistered experiment (N = 150, age ~8) found no person-versus-process difference in its primary analysis. In exploratory analyses, process praise beat control on persistence after failure (d = .61) (Bennett-Pierre et al. 2024) [V]. Consequence: the cue is "name what she did, then ask how she did it" (PL §6.4). The report never sells it as a mindset intervention.
- **Inflated praise.** Adults give more inflated praise to children with low self-esteem. That praise lowered challenge-seeking in those children and raised it in high-self-esteem children (Brummelman et al. 2014) [V]. Brummelman, Crocker & Bushman 2016 describe a downward spiral [V]. Modest praise may support exploration (Brummelman et al. 2022, VR experiment, ages 8-12) [V-partial]. Consequence: praise cues are **modest and specific** ("tried again 4 times"), never superlative. The report's own tone has no hype (PX §14).
- **Praise works under conditions.** Praise helps intrinsic motivation when it is sincere, attributes to controllable causes, supports autonomy, avoids social comparison and conveys attainable standards. Age, gender and culture moderate it (Henderlong & Lepper 2002) [V]. Consequence: the report never coaches praise tied to comparison ("better than your cousin") or to marks.
- **Failure mindsets are what children see.** Parents' views of failure, as debilitating or enhancing, predicted parenting practices and, through them, children's intelligence mindsets. Children perceived these failure mindsets accurately (Haimovitz & Dweck 2016) [V]. Parents' result-oriented day-to-day feedback related negatively to adolescents' growth mindset (Benneker et al. 2025, daily diary, Dutch) [V]. Consequence: the single most valuable parent cue is **how to respond to a wrong answer or a bad test**, and it is shown after every parent-entered result (PL §1.2).
- **Talk about difficulty.** Families vary in how they talk about "hard". Mothers who highlighted task features as the source of difficulty showed positive correlations with child outcomes (Bennett-Pierre et al. 2023) [V-partial]. Consequence: growth edges are written as *features of the task* ("comparing fractions with different denominators is the tricky step"), not features of the child.

### 2.5 Expectancy, labels, and the parent as Pygmalion

- **Teacher expectancy.** Effects "do occur, but … are typically small, do not accumulate greatly … may be more likely to dissipate". Powerful effects may occur among stigmatised groups, and expectations predict outcomes partly because they are accurate (Jussim & Harber 2005) [V]. Effects are smaller when teachers already know the pupils (Raudenbush 1984, 18 experiments) [V]. The original Pygmalion data were heavily criticised (Elashoff & Snow 1970) [V]. **Implication for Taxila:** an AI report arrives as a credible, novel and specific expectation induction, precisely the condition under which Raudenbush found larger effects [I]. That makes false or fixed statements more dangerous, not less.
- **Parent expectations.**
  - Longitudinal r = .28 with achievement; cross-lagged effects ran from expectations to achievement change (Pinquart & Ebeling 2020) [V].
  - Mothers' beliefs about adolescents' educational outcomes affected attainment indirectly through the adolescents' aspirations (Scherr et al. 2011) [V].
  - Parents' grade-7 beliefs about the child's ability predicted the adolescent's later self-concept of ability (Pesu et al. 2016) [V-partial].
  - Expectations help, but aspirations above expectations hurt (Marsh et al. 2023 [V]; Yang & Wang 2025, inverted U, N = 3,448 [V]). Higher parental expectations predicted more anxiety a year later (Sakaki et al. 2026, five waves) [V].
  - **Consequence:** the report feeds *accurate, attainable* expectations (what she can do now, what is next and reachable). It never feeds aspirations ("topper", "IIT"), and never comparisons that widen the aspiration-expectation gap.
- **Labels.** The explicit "learning disability" label lowers teachers' performance expectations (Kashikar et al. 2023) [V]. Generic statements lead children to treat categories as natural, objective and explanatory, and narrowing a generic to one individual limits this (Foster-Hanson, Leslie & Rhodes 2022) [V]; review in Rhodes, Gelman & Leslie 2025 [V]. Essentialised personality beliefs are coherent and judged immutable (Haslam et al. 2004) [V]. **Consequence:** even positive labels ("gifted", "maths kid", "a natural") are banned. "Gifted" labels have mixed, under-studied effects on family and self-concept (Ring & Shaughnessy 1993) [V] and are fixed-ability talk.
- **Barnum risk.** People accept generic descriptions as uniquely about them (Forer 1949) [S]. LLM-written profiles were rated as accurate as questionnaire results (via TV §8) [V, sib]. **Consequence:** the anti-Barnum test (PR-D14, §11.2).

### 2.6 How parents act on information

- **Autonomy support versus control.**
  - Parent autonomy support goes with achievement, autonomous motivation, perceived competence and, most strongly, psychological health (Vasquez et al. 2016, 36 studies) [V].
  - Psychological and harsh control relate to lower achievement (Pinquart 2016, 308 studies) [V].
  - Involvement helps when it is autonomy-supportive and affectively positive, and costs when it is controlling, most often around homework (Grolnick & Pomerantz 2022) [V].
- **The report itself can be the pressure.** Mothers put in a high-pressure condition were more controlling with their third-graders on homework-like tasks (Grolnick et al. 2002) [V]. A report that makes a parent anxious ("behind", red bars, countdowns) is an experimental pressure induction [I]. That is why PR-D10 exists.
- **The low self-concept → control spiral.** Low maths self-concept in grades 3-6 predicted more parental control, which predicted lower performance, persistence and self-concept (Silinskas & Kikas 2019, n = 512) [V]. Parents' emotion dysregulation and low mentalisation predict counterproductive homework involvement (Cohen et al. 2024) [V]. **Consequence:** when the report shows a growth edge, it gives the parent a *non-controlling* action and a reason the difficulty is ordinary. It never gives a supervision task.
- **Homework help.** Quality, not quantity, predicts outcomes (Moroni et al. 2015) [V]. Homework assistance r = −.15 (Barger et al. 2019) [V, sib]. Maths-anxious parents' frequent help hurts (Maloney 2015) [V, sib]. → PL "never asked" list.
- **Strength-based parenting** relates concurrently to adolescents' wellbeing, but random-intercept cross-lagged models found no lagged effects (Waters et al. 2019, N = 202) [V]. **Consequence:** the strengths section helps the parent *now*, week by week. It is not sold as a long-term wellbeing intervention.
- **Fathers.** Father involvement relates to achievement too (Kim & Hill 2015, meta-analysis) [V-partial]. The report is addressed to "parents", and multi-guardian delivery is supported (PL §9.3).

### 2.7 Indian parental expectations and exam stress

- **Prevalence.** In private schools in Kolkata (classes 10 and 12, n = 400), 35% reported high or very high academic stress and 37% exam anxiety. Students with lower grades reported more stress (Deb, Strodl & Sun 2014) [V]. NCERT's 2022 mental-health survey: 81% of students in grades 6-12 named studies, exams and results as a source of anxiety [V, sib NG]. Recent Indian work links parental expectations to academic stress and self-injury among NEET and JEE aspirants (Biswas & Maji 2026) [S, title], and anxiety and depression to coaching attendance (Indian J Psychiatry 2026) [S, title]. Student suicide deaths are rising (Dandona, Kumar & Sagar 2026, *Lancet Reg Health SE Asia*) [S, title].
- **Mechanism, from the closest cultural evidence.** In Chinese families, mothers' worth was more contingent on children's performance, and this accounted for their higher psychological control (Ng, Pomerantz & Deng 2014, "my child is my report card") [V]. Learning was seen as reflecting morality and parental support as love (Ng, Pomerantz & Lam 2013) [V]. Self-improvement goals led to failure-oriented responses, which accounted for children's emotional distress (Ng et al. 2019) [V]. **Transfer to India is plausible but unmeasured [I].** Taxila must not assume it, and PRM9 measures it.
- **High stakes reach classes 1-9.** Board exams start in class 10, but the population includes children preparing for class 5-6 entrance tests (Navodaya JNVST, Sainik schools) [S], school half-yearly and annual exams, and olympiads. Older siblings' board years also raise household stress [I].
- **Design moves.**
  - Expectations are an asset (Jeynes 2024 [V]; Pinquart & Ebeling 2020 [V]). The report channels them into *what is next and reachable* and into academic socialisation (PL §1.4).
  - Marks questions are answered with skills-secure counts for the test chapters, never a predicted mark (PX §1.2).
  - The exam shape (§8.4) removes everything except readiness counts, one calm-response cue and the routine.
  - The safeguarding route (PL §8.3) is live whenever the child states distress. The report never infers it.

### 2.8 Communicating uncertainty to non-specialists

- Communicating uncertainty raised perceived uncertainty and caused only a small decrease in trust, mostly with *verbal* rather than numeric uncertainty (van der Bles et al. 2020, five experiments including a BBC field experiment) [V]. A numeric range slightly lowered trust in the number, but not in the source (Kerr et al. 2023, N = 10,519) [V].
- Verbal probabilities ("very likely") are interpreted inconsistently, and numeric translations alongside help only partly (Wintle et al. 2019, ICD-203 formats) [V]. Verbal terms and ranges also carry pragmatic signals, such as the speaker's direction and expectations (Teigen 2022) [V]. The spread of meanings for probability words is well established (Mosteller & Youtz 1990) [S].
- Natural frequencies ("7 of 10") improve lay reasoning compared with percentages or probabilities [S: Gigerenzer & Hoffrage 1995; Pighin et al. 2026 V-partial].
- **Consequence (§5):** counts, plus a small fixed vocabulary whose meanings are defined, tested with Hindi-, English- and Hinglish-speaking parents (PRM6), and *never* used without the count.

### 2.9 Learning rhythms: what is known about time of day and session length

- In population data, test performance declines 0.9% SD per hour later in the day, and a 20-30 minute break restores 1.7% SD (Sievertsen et al. 2016, all Danish public-school tests) [V]. Pope 2016 reports time-of-day productivity effects from school schedules [S, title].
- In adolescents, chronotype × school timing matters: in the morning, early chronotypes outperform late ones, the effect vanishes in the afternoon, and late chronotypes benefit from evening classes (Goldin et al. 2020, random assignment to shifts, N = 753) [V].
- Within sessions, low-effort responding rises across the school day, and mind-wandering begins around items 11-15 (DA9) [V, sib].
- **Why Taxila cannot just correlate clock time with accuracy:** the phone is shared (PX §1.1). The session time is chosen by the parent's schedule, the child's mood, and whether homework is done. Late sessions select for tired days, so the confounding runs in both directions [I]. LOT invariant 4 and MHI3 forbid clock time as a model input for that reason. §6.3 offers the honest path: descriptive counts, within-session effects, and a parent-opted alternation design for any time-of-day claim.

---

## 3. What the report is for

**Four jobs.**
1. **Calibrate** the parent's beliefs about what the child can do, in both directions (Bergman 2015; Dizon-Ross 2019).
2. **Channel** expectation and worry into autonomy-supportive action: one doable home action, process praise, a calm response to failure (§2.4, §2.6).
3. **Make learning visible as a process**, with what helped, what was tricky and what is next, so that difficulty reads as ordinary rather than as a verdict on the child (Fong 2019; Bennett-Pierre 2023).
4. **Give hope that is backed by evidence**: then → now in the child's own record, which is ipsative and therefore available to every child (§2.2).

**Three harms the design must prevent.**
1. **Labels**, including positive ones, which travel through the parent to the child and harden (§2.5).
2. **Pressure**, which turns parents controlling (Grolnick 2002) and feeds the Indian exam-stress spiral (§2.7).
3. **Barnum text**: plausible, flattering, untestable descriptions that parents like and that are not about their child (§2.5, PR-D14).

**Audiences.**
- The parent, who may have low literacy, read only Hindi, or be unable to check the maths (PX §1.1).
- The child, who shares the phone and may read the report (PX8: write every string as if the child will read it).
- The other guardian, who receives forwards (PX: the image card survives forwarding).

---

## 4. The report model: every sentence is a claim object

### 4.1 Claim object

```ts
// shared/parent/report.ts (proposed)
export type ClaimLevel = 'L0_count' | 'L1_status' | 'L2_pattern' | 'L3_change';
export interface Claim {
  id: string;
  section: SectionId;                       // §6
  construct: string;                        // e.g. 'kt.mastery', 'mh.persistence', 'ms.calibration', 'ls.formatFit'
  shapeId: string;                          // an allowed shape from the owning doc (LOT §6.3, MS §7.2, MH §6, TV §9, CD §8.2)
  slots: Record<string, string | number>;   // filled from numbers only
  counts?: { k: number; n: number };        // numerator / denominator behind any frequency word
  window: { from: string; to: string };     // dates
  scope: { subject?: string; topicType?: string; skillIds?: string[]; condition?: string }; // "with Taxila", plus condition
  level: ClaimLevel;
  posterior?: number;                       // P(claim direction) for L2/L3
  reliability?: number;                     // expected ρ at this n (CD reliability card CD9)
  systemExplanationsChecked?: string[];     // LOT §6.1: schedule, item level, KC, grader, ASR...
  taxilaAction: string;                     // what Taxila does about it (required for L2/L3 and growth edges)
  reviseIf?: string;                        // "what would change our mind" (required for L2/L3)
  factIds: string[];                        // ledger rows → "Kaise pata?"
}
```

### 4.2 Gate (pure code, before any wording is generated)

A claim is **eligible** iff it satisfies all of the following:
- (i) its owning doc's threshold, for example ≥ 30 bets for MS offset and ≥ 10 errors for MH persistence
- (ii) a reliability gate
- (iii) the level rule
- (iv) a non-empty `taxilaAction` where required
- (v) no banned lexeme in its slots (§5.4).

**Reliability gate.** With a per-observation reliability ρ₁ (from the owning doc, or measured), the Spearman-Brown reliability of a mean over n observations is

  ρₙ = n·ρ₁ / (1 + (n − 1)·ρ₁),  so the minimum n for target ρ* is  n* = ρ*(1 − ρ₁) / (ρ₁(1 − ρ*)).

Pattern statements (L2) need ρₙ ≥ .70. Counts (L0) need none, because a count is a fact, not an estimate of a trait.

**Frequency claims** use a beta-binomial posterior with a weak band prior (prior strength a₀ + b₀ ≤ 4, so the child's data dominate quickly):

  p | k, n ~ Beta(a₀ + k, b₀ + n − k).

**Change claims (L3)**, comparing window A with window B:

  Δ = p_B − p_A,  eligible iff P(Δ > δ_min | data) ≥ .9, and ≥ 3 windows show a non-reversing direction (MH §6; MS-D8; LOT L3).

δ_min defaults to 0.10 on a proportion scale, or to the owning doc's value [U]. For IRT-scaled constructs (θ, level band), change is evaluated on the calibrated scale with item difficulty held fixed, so that "now" is not simply easier items (LOT §6.2; MS-D8 transfer check).

**Report-level false-claim budget (PR-D5).** Order the eligible L2/L3 claims by usefulness to the parent (has an action; recently changed; matches a parent worry), then admit them while

  Σ_{admitted i} (1 − Pᵢ) ≤ ε,  with ε = 0.2 (weekly) or 0.3 (monthly or term).

This is a Bayesian expected-false-discovery bound [I]. With Pᵢ ≈ .9 it admits about 2 pattern claims a week and 3 a month. Counts (L0) and status lines (L1) are outside the budget, since they are ledger facts. This is the mechanism that keeps a report from becoming a horoscope.

**Winner's curse guard (strengths).** Choosing "her strongest area" as the maximum of K noisy domain estimates inflates it. Strengths are therefore drawn from:
- (a) L1 facts (skills *pakka* after a delayed check), which need no selection
- (b) a within-child relative strength only if P(θ_d − θ̄_c > δ | data) ≥ .9, computed jointly from the shrunken posterior with all K domains in the model. Here θ̄_c is the child's own mean across domains, after band adjustment.

**Who decides.** The gate is code. The LLM receives only eligible claims and fills wording slots. The PL4 claim-checker verifies that every rendered sentence maps to a claim id, and the banned-lexicon predicate runs last (inherited law: safety by predicate).

### 4.3 Report assembly

```
ledger + sibling estimators ─► candidate claims (per section, per shape)
   ─► gate: thresholds · reliability · level rules · action present · lexicon
   ─► budget: admit L2/L3 by usefulness while Σ(1−P) ≤ ε ; strengths via winner's-curse guard
   ─► section fallbacks ("still learning …") for empty sections that the cadence requires
   ─► slot fill (shapes only) ─► PL4 claim-check ─► lexicon predicate ─► render (card / voice / app / PDF)
```

---

## 5. Uncertainty language rules

### 5.1 Principles
1. **Counts before words.** Every frequency statement shows k of n and a window. The word is a gloss on the count, never a substitute for it.
2. **Five fixed frequency words, defined by posterior rules** (§5.2). No other frequency adverbs are allowed: no "often", "rarely" or "tends to" outside the table.
3. **Reserved words.** *Pakka*, *Aa gaya*, *Seekh rahi* and *Abhi nahi* belong to the PX2 mastery ladder and are never used for certainty or frequency. "Sure", "definitely" and "guaranteed" are banned in every language.
4. **"Still learning" is a first-class state, not an apology.** Every section that cannot pass its gate renders its fallback shape, so the parent sees *what is being learned about* rather than silence. For required sections the fallback appears on cadence. Optional sections are omitted.
5. **Scope is part of the claim.** "With Taxila", the subject or topic type, and the window are always present (TV PC2). Statements never generalise to "is" or "always".
6. **No guessed reasons.** Changes are reported as changes (TV PC8). A causal word ("because", "since") is allowed only when Taxila *manipulated* the cause: a randomised format comparison, the n-of-1 rhythm design, or a teaching-move comparison.
7. **What would change our mind.** Every L2/L3 line carries `reviseIf` in the evidence view ("if the next 4 delayed checks in fractions go wrong, Taxila will revise this").
8. **No percentages, decimals, probabilities, scores or intervals in parent text.** The posterior lives in "Kaise pata?" for the curious parent, rendered as "Taxila is fairly confident (about 9 in 10)" [U: PRM6 tests whether this helps or harms].
9. **Same rule in every language.** The table below is the contract. Translations are reviewed by native speakers, not generated per report (CD §8.2 item 5).

### 5.2 The frequency vocabulary (posterior definitions) [U: calibrate in PRM6]

| word (en) | Hindi / Hinglish shape [U: native review] | rule (beta-binomial, §4.2) | min n |
|---|---|---|---|
| every time so far | *ab tak har baar* | k = n | 5 |
| usually | *zyaadatar* | P(p > .6) ≥ .9 | 10 |
| about half the time | *lagbhag aadhi baar* | P(.35 < p < .65) ≥ .8 | 10 |
| sometimes | *kabhi-kabhi* | P(.1 < p < .5) ≥ .8 | 10 |
| not yet seen | *abhi tak nahi dekha* | k = 0 | 5 |
| (otherwise) | — | count only: "{k} of {n}" | any |

### 5.3 Confidence tiers for pattern and change statements

| tier | rule | parent wording shape | where it appears |
|---|---|---|---|
| Fact | L0 count or L1 status (ledger) | plain statement + date | all cadences |
| Found | L2/L3 passed gate and budget | ⟨"Taxila has found"⟩ + scope + count + ⟨reviseIf in evidence view⟩ | monthly, term |
| Trying | an active comparison (format, rhythm, teaching move) | ⟨"Taxila is trying … to find out"⟩ + end date | weekly (one line), monthly |
| Still learning | below threshold | ⟨"still learning how {construct} goes for {name}"⟩ | monthly, term (required sections only) |
| Never | traits, types, ranks, predictions, diagnoses, affect | — | — |

### 5.4 Banned at every layer (union of LOT §7, CD §8.2, MS §7.4, MH §6, TV §9; report-specific additions)
- **Everything in the sibling lists** (traits, IQ and "smart", labels in English, Hindi and Hinglish such as *kamzor*, *tez*, *aalsi*, *laaparwah*, style labels, diagnoses, affect labels, mindset labels, streaks, risk scores, comparisons).
- **Report-specific:**
  - aspiration or prediction talk: "topper", "will score", "on track for 90%", "doctor/engineer material", "behind", "falling behind", "catch up with class" (use the level bridge, PX §0.9)
  - urgency: "only N days left", "must", "should immediately", red or alarm styling
  - superlatives and inflation: "excellent", "outstanding", "amazing", "brilliant", and exclamation hype (Brummelman 2014)
  - identity nouns, even positive ones: "a maths person", "a reader", "a natural", "gifted", "genius"
  - person-level summaries: "doing great", "good child", "needs to work harder"
  - for parent-directed lines: "you should help her with", "check her homework", "make her practise" (PL §6.1)
  - certainty words: "definitely", "guaranteed", "100%".
- **Predicate, not instruction:** `lintReport(text, lang)` runs the union lexicon plus structure checks (every frequency word has a count in the same sentence; every L2/L3 has a scope and a window). A failure blocks the send and writes an incident.

---

## 6. Sections: sources, thresholds, shapes, fallbacks

Each section names its owning estimator. **This file adds no new child measure.** It decides what is shown, when, and in what shape. Shapes are slot patterns, not sentences (inherited law), so nothing here is pasted into a prompt.

### 6.1 What your child can now do (required: W, M, T)
- **Source:** KT display states (PX2 ladder; LOT L1) and transfer probes (LS P-catalogue). Curricular level band (CD level bridge; need-goals).
- **Shapes:** ⟨skill in outcome language⟩ ⟨state word⟩ ⟨checked again after {d} days⟩ · ⟨chapter: {pakka} of {total} skills⟩ · ⟨level: working on Class {x} {topic}, building toward the Class {y} chapter⟩.
- **Rules:** *Pakka* only after a delayed success (PX §0.4). The display never goes down through absence (LOT invariant 3). A drop is handled as a review in the growth edge, never as "lost". At most 2 rows weekly, 6 monthly, all outcome rows at term.
- **Fallback:** the week's counted actions (PL WeekStory `highlight`).

### 6.2 How they learn best: evidence-based formats (optional: M, T; one "Trying" line allowed weekly)
- **Source:** LS §8.4 `formatFit` posterior per (format family × topic type). Engagement and preference layers (LS §8.5) are shown *separately*, as what she chose and enjoyed.
- **Found shape** (LS §8.4 threshold: P ≥ .9, ≥ N delayed comparisons, and inside the budget): ⟨for {topic type}, explanations with {format family, in plain words} held up better a week later: {k₁}/{n₁} vs {k₂}/{n₂}⟩ + ⟨Taxila now starts {topic type} that way⟩ + ⟨reviseIf⟩.
- **No-difference shape** (posterior concentrated near 0): ⟨Taxila compared {A} and {B} for {topic type}; both worked about equally well for {name}, so Taxila mixes them and lets {name} choose⟩. This is a positive finding: it is what the evidence predicts for most children (LS §2, §8.7), and it inoculates against the style myth [I].
- **Choice and enjoyment shape** (MH M1/M3): ⟨when offered, chose {story/picture/game} {k} of {n} times⟩. Labelled as *what she likes*, never as *how she learns*.
- **Banned:** "visual/auditory/kinaesthetic learner", "learns best by", "her style", and any format claim drawn from immediate correctness (LS §2.6).
- **Fallback:** ⟨still learning what works best for {topic type}; trying {A} and {B} until {date}⟩.

### 6.3 Learning rhythms: time of day, session length, breaks (optional: M, T)
- **Descriptive, always allowed (L0):** ⟨sessions on {n} of the last 28 days; {k} at the time you chose⟩ (MH M9) · ⟨usual session length {median} min; ended early {e} times⟩ · ⟨{b} breaks taken⟩. Slot-relative only (anchor, backup, other), never clock analysis (LOT invariant 4).
- **Within-session pattern (L2, allowed from ordinary data):** accuracy and effort across the session, adjusted for item difficulty:

    logit P(y_ij = 1) = θ_{c,s(j)} − b_j + γ_c · m_ij + κ · post_break_ij,  γ_c ~ N(γ_band, τ²),

  where m_ij is minutes into session i at item j. A claim requires P(γ_c < −γ_min) ≥ .9 and ≥ 15 sessions of ≥ 15 minutes. The shape is a *design note*: ⟨in sessions longer than ~{t} min, answers after minute {t} were right less often ({k₁}/{n₁} vs {k₂}/{n₂}); Taxila now offers a break at {t}⟩. It describes a session design, not stamina, attention or a trait (CD §8.1: "sustained attention, weather, not trait").
- **Time of day (L2) only through a parent-opted n-of-1 alternation.** The parent agrees to alternate two feasible slots (say, after school and after dinner) in randomised one-week blocks, for ≥ 4 blocks each (8 weeks). The model adds δ_c · slot_ij to the equation above. The outcome is difficulty-adjusted accuracy *and* delayed retention of material taught in each slot (not minutes). A claim needs P(|δ_c| > δ_min) ≥ .9. The randomisation is what removes the shared-phone confounding [I]. Shape: ⟨over 8 weeks of trying both times, {slot A} sessions went better: {counts}; you may want to keep {slot A}⟩. A null is reported plainly ("both times worked about the same, so pick whichever suits the family").
- **Banned:** sleep inferences, "tired", "morning person", "night owl", chronotype words (Goldin 2020 is population evidence), and attention-span scores.
- **Fallback:** descriptive counts only.

### 6.4 Persistence and frustration patterns (optional: W one line; M, T)
- **Source:**
  - MH M4 (retry after error, per opportunity)
  - DA detectors, as behaviour only (asked for a break; "pata nahi" loops; rapid wrong answers), consumed as *Taxila's actions*
  - TV §9.2 conditional contingencies (which teaching move preceded a retry)
  - MS-D13 wheel-spinning, reported only as what Taxila changed.
- **Shapes:**
  - ⟨tried again on her own after {r} of {e} mistakes⟩ (e ≥ 10)
  - ⟨after a mistake on a new kind of problem, retried {k₁}/{n₁} when Taxila asked a question about the step, {k₂}/{n₂} when it explained the step; Taxila uses the question way⟩, with a two-posterior rule P(p₁ > p₂) ≥ .9, n each ≥ 10
  - ⟨when answers got fast and mostly wrong, Taxila switched to {action} {n} times⟩
  - ⟨asked for a break {b} times; Taxila now {action}⟩.
- **"Frustration" never appears as a word about the child** (PX5: no affect claims). The section title shown to parents is *"When it gets hard"* [U].
- **Change shape (L3):** ⟨retried after {r/e} of mistakes now vs {r′/e′} in {month}⟩ under the §4.2 change rule.
- **Banned:** "gives up easily", "frustrated child", "low resilience", "grit", and any persistence score (MH §6).
- **Fallback:** ⟨Taxila is watching what helps {name} when a problem gets hard⟩ (monthly only).

### 6.5 Curiosity and interests (optional: W one line; M, T)
- **Source:** MH M2 own questions (per invitation, and per minute uninvited); MI interest indicators; interest tags (LS §8.5, parent-editable); MEM §7.3 memory line.
- **Shapes:**
  - ⟨asked {q} of her own questions; most about {topic}⟩ (q ≥ 3)
  - ⟨chose {topic tag} examples {k} of {n} times⟩
  - ⟨her question about {thread} became the start of {lesson}⟩
  - interest tags shown as an editable list.
- **Banned:** "very curious", "curious child", "not interested in {subject}" (MH §6), *padhai mein mann nahi lagta*.
- **Home link:** ⟨ask her to teach you what she found out about {topic}⟩ (MH; Chase 2009 via MS) [V, sib].

### 6.6 Confidence calibration (optional: M, T; B2+ only for patterns)
- **Source:** MS §7.2 shapes exactly: the calibration table in counts (≥ 30 bets in the domain), resolution only for B2+ after MS3 (≥ 120 bets), and change under MS §6.3.
- **Layout:** a three-row table (*pakka-meter* words for the child's bet: sure, maybe, guess) × right/total. No single index. B1 adds the fixed normalising note: optimism at 6-7 is normal (MS-D9).
- **Parent cue:** ask "how sure are you, and how could we check?" rather than "is it right?" (MS §7.3).
- **Banned:** "overconfident", "underconfident", "low confidence", "self-doubt", calibration percentages (MS §7.4).
- **Fallback:** ⟨still collecting her "how sure" answers in {subject}; {n} of 30 so far⟩.

### 6.7 Strengths (required: W one line; M, T)
- **Source:** L1 *pakka* skills, counted process actions (PL `effortActions`), and within-child relative strengths only through the winner's-curse guard (§4.2). CD estimable constructs (number line, fraction magnitude, reading fluency) are allowed as own-trend descriptions (CD §8.1).
- **Shapes:**
  - ⟨{skill} is now *pakka*: still right {d} days later⟩
  - ⟨explained {topic} in her own words {k} times⟩
  - ⟨in {subject}, she has moved from {level A} to {level B} since {month}⟩
  - (monthly or term, passed guard) ⟨compared with her own other subjects, {domain} is where her work is most secure right now: {counts}⟩.
- **Rules:** modest and specific (Brummelman). Always a doing or a skill, never a being (Rhodes 2019). Order: strength first (PR-D4).
- **Banned:** "talented", "gifted", "naturally good at", "her strong suit is maths" as identity, "best in", "better than".

### 6.8 Growth edges (required: M, T; one line W)
- **Source:** KT `working` skills and misconception flags (in kitchen-table words, PX §14), LOT §6.1 durability patterns (after the system explanations are ruled out), and readiness counts for test chapters (NG).
- **Shape (always three parts):** ⟨the tricky step, as a feature of the task⟩ + ⟨her reasoning, shown as sensible (e.g. "4 is bigger than 3, so she expects a quarter to be bigger")⟩ + ⟨what Taxila is doing, and the re-check date⟩ (Fong 2019; Bennett-Pierre 2023).
- **Caps:** 1 weekly, ≤ 3 monthly. Never more growth edges than strengths in one report [U].
- **Banned:** "weakness", "weak in", "problem area", "behind", "careless mistakes", "needs to concentrate".
- **Decline after a break:** shown as review (⟨{k} skills from before the holiday are being refreshed this week⟩), with LOT's normalising principle ("forgetting is how memory works for everyone").

### 6.9 What you can do at home this week (required: W, M; T as a term plan)
- **Source:** PL §6.3 `pickHomeActivity` (one catalogue item, tied to a ledger fact) + the PL §6.4 praise cue + the failure-response cue when a test result was entered or a growth edge is new.
- **Shape (the Cortes fact → tip → encouragement triple):** ⟨what she is learning (fact)⟩ → ⟨the one activity: object, question to ask, what a good answer sounds like⟩ → ⟨praise cue: the action to name⟩ → ⟨if it goes wrong: ask what she tried and what she'd try next⟩.
- **Rules:** doable without the maths (`parentNeedsMaths: false`, PL). Never homework help, checking or extra worksheets. "Zero minutes" is respected (capacity dial).
- **Age split:**
  - B1-B2: everyday-object activities and listening to the child explain.
  - B3-B4: value talk (connect the skill to *her* stated interest) and teach-back. The parent asks; the child decides how much to share (Stattin & Kerr via PL) [V, sib].

### 6.10 What we are trying next (required: M, T; one line W when an experiment starts)
- **Source:** the Conductor plan (next skills, review schedule), active comparisons (format bandit arms, a teaching-move comparison, the rhythm alternation if opted in), and open parent commitments (PL §7.4).
- **Shape:** ⟨next: {skills}, re-check {skill} on {date}⟩ · ⟨trying: {A} vs {B} for {topic type} until {date}; you'll see what we found⟩ · ⟨you asked about {worry}; here is what we found / will check by {date}⟩.
- **Honesty rule:** experiments are disclosed in plain words. The child is never assigned an arm that falls below the evidence-based core (LS §8.4 allocation policy).

### 6.11 Fixed copy (overview, once per monthly and term report)
- TV PC7, adapted: children behave differently with different people and on different days, and what you see at home is just as real.
- What these reports are not: not a test score, not a comparison with other children, not a prediction.
- How to read "Kaise pata?"

---

## 7. Cadence: weekly, monthly, term

### 7.1 Which sections appear when

| section | weekly (card + voice) | monthly (app + PDF + PTM agenda) | term (learning story + HPC page) |
|---|---|---|---|
| 6.1 can now do | ≤ 2 rows (required) | ≤ 6 rows + chapter counts | all outcome rows, then → now |
| 6.2 how they learn best | "Trying" line only | Found / no-difference / choice | Found + what changed since last term |
| 6.3 rhythms | — | descriptive + within-session | + n-of-1 result if run |
| 6.4 when it gets hard | ≤ 1 line | counts + contingencies | then → now |
| 6.5 curiosity and interests | ≤ 1 line | counts + tags | the term's question thread |
| 6.6 confidence | — | table (B2+ patterns) | then → now (MS §6.3) |
| 6.7 strengths | 1 line (first) | first block | first block |
| 6.8 growth edges | 1 | ≤ 3 | ≤ 3 + what resolved this term |
| 6.9 at home | 1 activity + praise cue | the month's plan + failure cue | term plan (habits, talk) |
| 6.10 trying next | when an experiment starts | required | required |
| false-claim budget ε | 0.2 | 0.3 | 0.3 |
| length | ≤ 5 lines; 60-90 s voice | one screen per section; voice 3 min [U] | 2-4 pages PDF + 5 min voice [U] |

### 7.2 Monthly: the psychology report
- Built at the month boundary from claims passing the gate, and delivered in the app (PX Parent corner). A utility WhatsApp message carries one line and a link (PX cadence cap).
- Doubles as the **PTM agenda** (PL §7): the teacher walks the parent through it in voice and answers only from claim ids.
- The **SRL growth card** (MS §7.2) and the motivation rows (MH §6) are rendered inside sections 6.4-6.6, not as separate cards. This keeps one report with one budget.
- A printable PDF (PX §9) holds competency rows and counts, with no psychological sections. It is safe to show a school teacher [U: the parent decides].

### 7.3 Term: the learning story
- **Aligned to the school's own terms** (half-yearly and annual), taken from NG events. If unknown, every ~4 months.
- **Structure:**
  1. ⟨this term in one view⟩: level band ribbon then → now
  2. ⟨a learning story⟩: 2-3 episodes, each a dated, evidenced moment (a question she asked, a hard problem she got through, a misconception that resolved), told as what happened → what it shows about her *learning* (a task or process statement) → what came next
  3. ⟨growth⟩: L3 claims that passed
  4. ⟨still learning⟩
  5. ⟨her voice⟩: for B2+, the child's own reflection, collected by the teacher as an open prompt shape ("what did you get better at; what do you want to learn next"), quoted ≤ 20 words with consent, never edited into praise. This is consistent with HPC self-assessment [S].
  6. ⟨your voice⟩: one optional parent observation line, stored as `parent_said`, never as evidence (NG N4)
  7. ⟨next term⟩: focus skills, routine, one home habit.
- **HPC-compatible page:** competency rows in outcome language, the four-state words, and no psychological sections [M: map to the current PARAKH HPC template].
- **Child-facing version (B3+):** the same story without sections 6.3, 6.4 and 6.6 detail, in capability statements (MI M.CAPABILITY). Shown to the child only if the parent agrees (PL11 transparency).

---

## 8. Example layouts (layout only; never prompt text)

These are **layouts with slots**. They must never be pasted into a prompt (inherited law: anything sentence-shaped gets recited). Braces are slots filled from claim objects.

### 8.1 Weekly card (WhatsApp image + 5 lines; PX §8 extended)

```
┌ {Name} · Class {c} · {dates} ────────────────────────────┐
│ {lessons} lessons · {days} days · {min} min                │
│ ★ {strength line: counted action or pakka skill}           │
│ PAKKA     {skill}          AA GAYA   {skill}                │
│ TRICKY    {task feature} → Taxila: {action}, re-check {day}│
│ GHAR PAR  {object}: ask "{question shape}"                  │
│           praise: {action she did}                          │
│ {optional: TRYING {A} vs {B} for {topic type} till {date}} │
│ Taxila AI teacher · Kaise pata? in app                      │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Monthly report (app; one card per section, scrollable)

```
{Name} · {month} · "How {Name} is learning"            [Listen 3 min] [PTM book]
───────────────────────────────────────────────────────────────────────────────
1 STRENGTHS          ★ {strength 1}  ★ {strength 2}                      [Kaise pata?]
2 CAN NOW DO         {subject}: {pakka}/{total} skills · level {band A}→{band B}
                     ribbon: ▢▢▣▣▣■■  (four-state words under each, no colours alone)
3 HOW {NAME} LEARNS  FOUND  {topic type}: {format} held up better {k1/n1} vs {k2/n2}
                     or NO CLEAR DIFFERENCE {A}≈{B} → mixing + her choice
                     or STILL LEARNING · trying {A}/{B} till {date}
                     she chose: story {k} · picture {k} · game {k} (what she likes)
4 WHEN IT GETS HARD  retried on her own {r} of {e} mistakes (was {r'}/{e'})
                     what helped: {move A} {k1/n1} vs {move B} {k2/n2}
5 CURIOSITY          {q} own questions · mostly {topic} · tags: {tags} [edit]
6 HOW SURE           sure {a1}/{n1} right · maybe {a2}/{n2} · guess {a3}/{n3}
7 RHYTHMS            {n}/28 days · {k} at your chosen time · median {m} min
                     {design note: break offered at minute t}   [try both times? →]
8 GROWTH EDGES       {task feature} · her thinking: {reasoning} · Taxila: {action} · re-check {date}
9 AT HOME            this month: {activity} · praise: {action} · if wrong: {cue}
10 NEXT              {skills} · re-check {dates} · trying {experiment} · your question: {answer/date}
───────────────────────────────────────────────────────────────────────────────
Children behave differently with different people and days; what you see at home is real too.
Every line: [Kaise pata?] → items, dates, her words, and "what would change this".
```

### 8.3 Term report (PDF + voice; learning-story layout)

```
Page 1  {Name} · Class {c} · Term {t} ({dates})
        Level ribbon per subject: {band at term start} → {band now}   (syllabus frame, no rank)
        This term's story:
          ① {date} · {episode: what she did}  → shows: {task/process statement} → next: {step}
          ② {date} · {episode}                 → shows: {…}                   → next: {…}
          ③ {date} · {episode}                 → shows: {…}                   → next: {…}
Page 2  Growth (then → now, passed rules only):  {construct shape} {month A} → {month B}
        Still learning: {constructs without enough data, named plainly}
        Her voice (B2+, consented): "{≤20-word quote}"
        Your note (optional): {parent_said}
Page 3  Competency rows (HPC-compatible): {outcome} · {state word} · {date checked}
Page 4  Next term: focus {skills} · routine {anchor} · home habit {one} · how we'll know {checks}
```

### 8.4 Exam shape (replaces the weekly card inside a confirmed test window, NG)

```
{Name} · {subject} test {date range}
Test chapters: {chapter}: {pakka}/{total} skills pakka · {k} being refreshed this week
Taxila this week: review of {skills}, no new topics
At home: keep the usual time · after the test ask "which question did you like, which was tricky"
If marks disappoint: ask what she tried and what she'd do next; Taxila will re-check {skills}
```
No countdown, no predicted mark, no "revise harder", no comparison. After the parent enters a result (NG §8.2), the next report always opens with the failure-response card (Haimovitz & Dweck 2016), whatever the marks.

---

## 9. Indian-context rules

1. **The marks question** is always answered with skills-secure counts for the test chapters, plus what is being refreshed. A predicted mark is never given (PX §9).
2. **Aspiration language is declined, not argued with.** "Will she get into Navodaya / IIT?" → what she can do now, what comes next and how long it usually takes to learn the next step [U: from population data, framed as typical, never as a forecast] (Marsh 2023 aspiration-gap harm).
3. **Exam windows** switch to the exam shape (§8.4). Growth edges outside the test chapters are deferred, and nothing new is flagged within 3 days of a test [U].
4. **Joint families and multiple guardians:** one report per child, forwardable as an image. Guardian-specific views never differ in content about the child (PL §9.3).
5. **Shared phone:** every string passes PX8 (child-safe). Growth-edge text in particular must not humiliate if the child reads it.
6. **Gender:** no gendered framing of confidence, maths or persistence (MS §7.4). The report equalises *attention* by reporting the same sections for every child [I], because households already spend more on boys (PX §0.10) [S].
7. **Language:** Hindi-first where chosen, with English school nouns (fraction, chapter). The voice note carries the report for low-literacy parents (PX10). The uncertainty vocabulary is native-reviewed (§5.2).
8. **Tuition and coaching:** if the child also attends tuition, the report does not compete with or criticise it. It reports Taxila's evidence only [I].
9. **NEP and HPC:** the term competency page uses outcome language compatible with the HPC. The psychological sections stay out of anything a school receives (PX §9 PDF rule).

---

## 10. Wellbeing guardrails specific to reports

| risk | mechanism | guard |
|---|---|---|
| The report induces parental pressure | Pressure → controlling behaviour (Grolnick 2002) [V]; low self-concept → control spiral (Silinskas & Kikas 2019) [V] | PR-D10 shapes. Growth edges always carry a Taxila action. No parent supervision tasks. PRM4 measures parent controlling responses |
| Positive labels harden into identity | Generic and identity language (Rhodes 2019, 2025) [V] | §5.4 bans identity nouns. Strengths are doings |
| Parents over-read "Found" patterns | Barnum and authority effects (§2.5) | Budget (PR-D5). "What would change our mind". Anti-Barnum test (PR-D14) |
| Child reads a growth edge as a verdict | Shared phone (PX §1.1) | PX8. Task-feature framing. Growth edges never outnumber strengths |
| Aspiration-expectation gap widens | Marsh 2023; Sakaki 2026 [V] | No aspiration talk. Next-step framing |
| Report becomes surveillance for 10-15 | Disclosure, not tracking, carries the benefit (Stattin & Kerr via PL) [V, sib] | Sections 6.3-6.6 for B4 are visible to the child, who is told what the parent sees (PL11). Personal talk is never reported |
| Bad weeks produce deficit reports | A zero-lesson or low week | The report still goes, with facts and no guilt (PL §5.3), and with a strength from the record (the latest *pakka* skill) |
| Distress signals | Child-stated only (PL9) | Never in the report. The safeguarding route only (PL §8.3; Childline 1098 / Tele-MANAS 14416 floor) |

**Rule** (mirrors MH-D10): any report variant that raises a parent-engagement metric *and* raises the parent-pressure markers (PRM4), or the child's MH §7 markers, beyond threshold fails, whatever its other effects.

---

## 11. Research programme (publishable, pre-registered)

### 11.1 Parent-belief calibration as an outcome
Before each monthly report, the parent answers up to 3 one-tap predictions: "Can {name} do {skill} on her own right now?" (yes / not yet / not sure), for skills that will be checked in the following week. With f_j ∈ {1, 0, 0.5} and the outcome o_j from the delayed check:

  Brier_m = (1/M) Σ_j (f_j − o_j)².

The hypothesis is that Brier falls across months in report arms that show counts and "Kaise pata?" (Dizon-Ross-style belief correction measured inside a product). Analysis: mixed model Brier_{p,m} = β₀ + β₁·month + β₂·arm + β₃·month×arm + u_p. This has not been measured at scale in Indian families [I]. Belief *direction* (over versus under) is analysed separately, by child gender and by subject (PX §0.10).

### 11.2 The anti-Barnum (shuffled-report) test
For each psychological section (6.2-6.6), show the parent their child's real section and a decoy section from a child matched on band, level band and activity volume, in randomised order: "Which one sounds like {name}?" Discrimination d̂ = proportion correct, tested against 0.5 (binomial; target ≥ 0.65 [U]). A section with d̂ ≤ 0.55 is reduced to counts or removed (PR-D14). The same test run on LLM free-text summaries (the banned alternative) gives a publishable contrast: structured, counted, scoped claims versus fluent AI profiles.

### 11.3 RCT of report variants (parent behaviour → child outcomes)
- **Arms** (factorial, randomised by family):
  - A: process framing (counts of actions and what helped) versus outcome framing (skills and scores only)
  - B: uncertainty display (counts + tiers + "Kaise pata?") versus plain statements
  - C: strength-first versus chronological order.
- **Outcomes:**
  - primary: children's delayed retention on matched held-out items at 4 and 12 weeks
  - parent outcomes: Brier (11.1); home-activity completion; parent person versus process responses on a short adapted Barger 2022 measure [U: adaptation and translation]; PTM use
  - harm outcomes: MH §7 markers; parent pressure markers (PRM4); opt-out.
- **Power:** expect small effects (CHAMP +0.03 SD; Jeynes programmes ~0.3 SD as an upper bound), so plan for thousands of families. Preregister.

### 11.4 n-of-1 rhythm trials at scale
Aggregate the §6.3 alternations into a hierarchical model. This gives the distribution of within-child time-of-day effects δ_c in Indian children 6-15, by band and by the reported chronotype item for B4 [U]. It is an ecological, randomised, within-child design that the population literature (Sievertsen 2016; Goldin 2020) does not have.

### 11.5 Cultural moderation
Does the contingent-worth mechanism (Ng 2014) operate in Indian parents, and does process-framed reporting weaken it? Optional, consented parent items (a short child-based-worth scale [U: translation and validation]) are collected at baseline and at term.

---

## 12. Measurements this design depends on

| id | what | method | decides |
|---|---|---|---|
| PRM1 | report comprehension | 5-item read-back quiz after the monthly report, by language and literacy (voice-only arm) | layout and length; ≥ 80% target [U] |
| PRM2 | "Kaise pata?" use and comprehension | open rate; 2-item check | keep or simplify the evidence view (PR-D13) |
| PRM3 | calibration (Brier) by arm | §11.1 | PR-D4, PR-D6 |
| PRM4 | parent pressure markers | PL10 decline-request rate; parent-reported responses to failure; child "parent said" pressure lexicon (child-stated only) | PR-D10 guard |
| PRM5 | posterior calibration of L2/L3 claims | held-out delayed checks: of claims stated at P ≈ .9, the share later confirmed | budget ε |
| PRM6 | frequency-word interpretation | parents map each §5.2 word to a number (Wintle 2019 design), in Hindi, English and Hinglish | the vocabulary table |
| PRM7 | n-of-1 yield | share of opted-in families reaching P(δ) ≥ .9 | keep or drop the rhythm claim (PR-D8) |
| PRM8 | monthly open and PTM rates | product logs | PR-D12 |
| PRM9 | contingent-worth prevalence | §11.5 | framing defaults for Indian parents |
| PRM10 | anti-Barnum discrimination per section | §11.2 | ship gate for sections 6.2-6.6 |

---

## 13. Invariants (eval-gated; "if your change trips them, your change is wrong")

| # | invariant | test |
|---|---|---|
| PRI1 | Every rendered sentence about the child maps to a claim id with factIds (PL4) | claim-checker on a generated corpus |
| PRI2 | Every frequency word has its count in the same sentence, and satisfies §5.2 | structure predicate |
| PRI3 | Every L2/L3 claim has posterior ≥ .9, a scope, a window, a `taxilaAction` and a `reviseIf` | gate unit tests |
| PRI4 | Σ(1 − Pᵢ) over admitted L2/L3 claims ≤ ε for the cadence | gate unit tests with adversarial claim sets |
| PRI5 | No lexeme from the §5.4 union list in any language; no identity nouns, including positive ones | lexicon predicate (shared with LOT, CD, MS, MH, TV) |
| PRI6 | No comparison with other children, siblings, norms or "most children" | lexicon + structure |
| PRI7 | No predicted marks, ranks, countdowns or aspiration talk; the exam shape applies inside confirmed windows | template tests with test-window fixtures |
| PRI8 | Format statements come only from `formatFit` passing LS §8.4. No style words. Choice lines are labelled as preference | fixture: below-threshold profile → fallback only |
| PRI9 | No clock time-of-day claim without a completed n-of-1 alternation record | gate test |
| PRI10 | Strengths: first block, from L1 facts or the winner's-curse guard; never superlatives | renderer test |
| PRI11 | Growth edges ≤ strengths, and each has three parts (task feature, her reasoning, Taxila action with date) | renderer test |
| PRI12 | Home section: exactly one activity, `parentNeedsMaths: false`, no homework help or checking verbs | catalogue + lexicon |
| PRI13 | Every report, including zero-lesson weeks, is sent on schedule and contains no guilt or "come back" copy (PX7, PL §5.3) | fixture |
| PRI14 | Psychological sections never appear in the school-facing PDF or HPC page | export test |
| PRI15 | B1 reports contain no calibration pattern lines; B4 child sees what the parent sees for sections 6.3-6.6 | band fixtures |

---

## 14. Open questions

1. What prior strength should the frequency-word posteriors use per band? It is ≤ 4 now [U]. Too weak a prior makes "usually" flip week to week; PRM5 decides.
2. Does strength-first ordering reduce calibration for anxious parents (they skim to the growth edge) or improve it (lower defensiveness)? PRM3 decides.
3. Is a parent-opted n-of-1 alternation acceptable to families with fixed routines? It may only be feasible on weekends [U].
4. How should the term learning story select episodes without cherry-picking? Proposal: one from each of {question asked, hard problem persisted, misconception resolved}, chosen by recency among claim-backed events. Audit for selection bias against quieter children (ClassDojo critique, PX §3).
5. What should happen when parent and Taxila observations disagree ("she never asks questions at home")? Show both, with the fixed cross-context copy, and record the parent's view as `parent_said` (TV §9.3). Never adjudicate.
6. Can the HPC page be produced without importing a school's grading scale? [M: PARAKH template review]
7. Should the child (B3+) co-author a line in the monthly report? It is attractive for autonomy (Vasquez 2016), but risks performative self-reports [U].

---

## 15. Proposed `context/` entries (for the main loop to merge; every decision has its reversal condition in §0)

- `decision` **pr-report-is-intervention** (PR-D1), **pr-false-claim-budget** (PR-D5), **pr-frequency-vocabulary** (PR-D6), **pr-rhythm-n-of-1** (PR-D8), **pr-pressure-proof** (PR-D10), **pr-anti-barnum-gate** (PR-D14), **pr-cadence-structure** (PR-D12).
- `rejected` **pr-learning-style-section**: "how they learn best" as a style label. Rejected for the LS §2 evidence and the parent-label harm. It is replaced by measured format effects plus a labelled preference line.
- `rejected` **pr-observational-time-of-day**: correlating clock time with accuracy and reporting a "best time". Rejected because the shared-phone and selection confounding make it non-identifiable (LOT invariant 4). It is replaced by the n-of-1 design.
- `rejected` **pr-composite-learning-score**: one psychology or learning score per child. Rejected on Butler 1987, the Cuemath teardown (PX §3) and the CD banned list.
- `measurement` placeholders PRM1-PRM10 (no numbers yet; each needs n, method and date when run).

---

## 16. References

**Feedback and reporting**
- Brooks C, Carroll A, Gillies RM, Hattie J (2019). A matrix of feedback for learning. *Australian Journal of Teacher Education*. ERIC EJ1213749 [V]
- Butler R (1987). Task-involving and ego-involving properties of evaluation. *J Educ Psychol* 79(4):474. doi:10.1037/0022-0663.79.4.474 [S]; Butler R (1988). *Br J Educ Psychol*. ERIC EJ380489 [S]
- Fong CJ, Patall EA, Vasquez AC, Stautberg S (2019). A meta-analysis of negative feedback on intrinsic motivation. *Educ Psychol Rev*. ERIC EJ1206583 [V]
- Gilbert KJ, Ellis EN (1972). An evaluation of current methods to report pupil progress. ERIC ED077975 [V]
- Guskey TR, Swan GM, Jung LA (2010, 2011). Kentucky standards-based report card. ERIC ED509404, EJ943649 [V]
- Hattie J, Timperley H (2007). The power of feedback. *Rev Educ Res*. ERIC EJ782448 [V]
- Hopper G (1977). Parental understanding of their child's test results. *Meas Eval Guid*. ERIC EJ161871 [V]
- Hughes G, Wood E, Kitagawa K (2014). Self-referential (ipsative) feedback. *Open Learning*. ERIC EJ1031790 [V]; Malecka B, Boud D (2023). ERIC EJ1398654 [V]
- Kluger AN, DeNisi A (1996). The effects of feedback interventions on performance. *Psychol Bull* 119(2):254. doi:10.1037/0033-2909.119.2.254 [S]
- Lohbeck A, Freund PA (2021). Students' own and perceived teacher reference norms. *Educ Psychol*. ERIC EJ1303201 [V]
- Mac Iver MA, Wills K, Sheldon S, Clark E (2021). Urban parents at the portal. *School Community J*. ERIC EJ1305386 [V]
- May TA (2024). Parent perceptions of standardized test score reports. ERIC ED652006 [V]
- Sands L, Lee W (2024). Teacher inquiry and Learning Stories. ERIC EJ1457628 [V]; Carr M (2001). *Assessment in Early Childhood Settings: Learning Stories* [S]
- Swan GM, Guskey TR, Jung LA (2014). Parents' and teachers' perceptions of standards-based and traditional report cards. *Educ Assess Eval Account*. ERIC EJ1040847 [V]
- Wilbert J, Grunke M (2010). Norms and goals of appraisal of German teachers. ERIC EJ914124 [V]
- Wisniewski B, Zierer K, Hattie J (2019). The power of feedback revisited. *Front Psychol*. doi:10.3389/fpsyg.2019.03087 [V]

**Parent messaging field experiments**
- Bergman P (2015). Parent-child information frictions and human capital investment. doi:10.2139/ssrn.2622034 [V]
- Bergman P, Chan EW (2021). Leveraging parents through low-cost technology. *J Hum Resour* 56(1). doi:10.3368/jhr.56.1.1118-9837r1 [S]
- Cortes KE, Fricke H, Loeb S, Song DS (2021). Too little or too much? *Educ Finance Policy*. ERIC EJ1306630 [V]; (2019) timing. ERIC ED670946 [V]
- Dizon-Ross R (2019). Parents' beliefs about their children's academic ability. NBER w24610; *AER* [S]
- Doss C, Fahle EM, Loeb S, York BN (2017). Differentiated and personalized text-messaging. ERIC ED579680 [V]
- Doss C, Fricke H, Loeb S, Doromal JB (2022). Engaging girls in math. ERIC ED671483 [V]
- Kraft MA, Rogers T (2014/2015). The underutilized potential of teacher-to-parent communication. doi:10.2139/ssrn.2528688; *Econ Educ Rev* [V]
- Pandey P, Goyal S, Sundararaman V (2008). Community participation in public schools: information campaigns in three Indian states. World Bank WPS 4776. doi:10.1596/1813-9450-4776 [S]
- Rogers T, Feller A (2018). Reducing student absences at scale by targeting parents' misbeliefs. *Nat Hum Behav*. doi:10.1038/s41562-018-0328-1 [V, sib]
- York BN, Loeb S (2014/2019). One step at a time (READY4K). NBER w20659 [S]
- Banerjee AV, Banerji R, Duflo E, Glennerster R, Khemani S (2010). Pitfalls of participatory programs. *AEJ: Economic Policy* [S, memory]

**Praise, criticism, failure**
- Barger MM, Wu J, Xiong Y, Oh DD, Cimpian A, Pomerantz EM (2022). Parents' responses to children's math performance. *Child Dev*. doi:10.1111/cdev.13834 [V]
- Benneker IMB, de Swart F, Lee NC, van Atteveldt NM (2025). Daily fluctuations in adolescents' mindset. *Eur J Psychol Educ*. doi:10.1007/s10212-025-01009-6 [V]
- Bennett-Pierre G, Chernuta T, Altamimi R, Gunderson EA (2024). Effects of praise and "easy" feedback. *J Exp Child Psychol*. doi:10.1016/j.jecp.2024.106032 [V]
- Bennett-Pierre G, Weinraub M, Newcombe NS, Gunderson EA (2023). "This is hard!" *Dev Psychol*. doi:10.1037/dev0001555 [V-partial]
- Brummelman E, Thomaes S, Orobio de Castro B, Overbeek G (2014). "That's not just beautiful, that's incredibly beautiful!" *Psychol Sci*. doi:10.1177/0956797613514251 [V]
- Brummelman E, Crocker J, Bushman BJ (2016). The praise paradox. *Child Dev Perspect*. doi:10.1111/cdep.12171 [V]
- Brummelman E, Grapsas S, van der Kooij K (2022). Parental praise and children's exploration. *Sci Rep*. doi:10.1038/s41598-022-08226-9 [V-partial]
- Cimpian A, Arce HM, Markman EM, Dweck CS (2007). Subtle linguistic cues affect children's motivation. *Psychol Sci*. doi:10.1111/j.1467-9280.2007.01896.x [S]
- Gunderson EA, Gripshover SJ, Romero C, Dweck CS, Goldin-Meadow S, Levine SC (2013). Parent praise to 1- to 3-year-olds. *Child Dev*. doi:10.1111/cdev.12064 [V]
- Gunderson EA, Sorhagen NS, Gripshover SJ, et al. (2018). Parent praise to toddlers predicts fourth grade achievement. *Dev Psychol*. doi:10.1037/dev0000444 [V]
- Gunderson EA, Donnellan MB, Robins RW, Trzesniewski KH (2018). The specificity of parenting effects. *J Exp Child Psychol*. doi:10.1016/j.jecp.2018.03.015 [V]
- Haimovitz K, Dweck CS (2016). Parents' views of failure predict children's fixed and growth intelligence mind-sets. *Psychol Sci*. doi:10.1177/0956797616639727 [V]
- Henderlong J, Lepper MR (2002). The effects of praise on children's intrinsic motivation. *Psychol Bull*. doi:10.1037/0033-2909.128.5.774 [V]
- Kamins ML, Dweck CS (1999). Person versus process praise and criticism. *Dev Psychol*. doi:10.1037/0012-1649.35.3.835 [S]
- Mueller CM, Dweck CS (1998). Praise for intelligence can undermine children's motivation. *JPSP*. doi:10.1037/0022-3514.75.1.33 [S]
- Pomerantz EM, Kempner SG (2013). Mothers' daily person and process praise. *Dev Psychol*. doi:10.1037/a0031840 [V]

**Expectancy, labels, essentialism, Barnum**
- Elashoff JD, Snow RE (1970). Reconsideration of the Rosenthal-Jacobson data. ERIC ED046892 [V]
- Forer BR (1949). The fallacy of personal validation. *J Abnorm Soc Psychol*. doi:10.1037/h0059240 [S]
- Foster-Hanson E, Leslie SJ, Rhodes M (2022). Speaking of kinds: correcting generic statements. *Cogn Sci*. doi:10.1111/cogs.13223 [V]
- Haslam N, Bastian B, Bissett M (2004). Essentialist beliefs about personality. *PSPB*. doi:10.1177/0146167204271182 [V]
- Jussim L, Harber KD (2005). Teacher expectations and self-fulfilling prophecies. *PSPR*. doi:10.1207/s15327957pspr0902_3 [V]
- Kashikar L, Soemers L, Lüke T, Grosche M (2023). Does the "learning disability" label lower teachers' performance expectations? *Soc Psychol Educ*. ERIC EJ1383375 [V-partial]
- Marsh HW, Pekrun R, Guo J, Hattie J (2023). Too much of a good thing: parental aspiration-expectation gaps. *Educ Psychol Rev*. ERIC EJ1374167 [V]
- Pesu L, Aunola K, Viljaranta J, Nurmi JE (2016). Adolescents' self-concept of ability and parental beliefs. *Frontline Learn Res*. ERIC EJ1110419 [V-partial]
- Pinquart M, Ebeling M (2020). Parental educational expectations and academic achievement: a meta-analysis. *Educ Psychol Rev*. ERIC EJ1255671 [V]
- Raudenbush SW (1984). Magnitude of teacher expectancy effects on pupil IQ. *J Educ Psychol*. ERIC EJ304954 [V]
- Rhodes M, Leslie SJ, Yee KM, Saunders K (2019). Subtle linguistic cues increase girls' engagement in science. *Psychol Sci*. doi:10.1177/0956797618823670 [V]
- Rhodes M, Gelman SA, Leslie SJ (2025). How generic language shapes the development of social thought. *Trends Cogn Sci*. doi:10.1016/j.tics.2024.09.012 [V]
- Ring B, Shaughnessy MF (1993). The gifted label. ERIC EJ472667 [V]
- Rogers T, Feller A (2016). Discouraged by peer excellence. *Psychol Sci*. doi:10.1177/0956797615623770 [V]
- Sakaki M, Murayama K, Frenzel AC, Goetz T (2026). Parents' academic expectations and aspirations predict students' achievement emotions. *J Educ Psychol*. ERIC EJ1507479 [V]
- Scherr KC, Madon S, Guyll M, Willard J, Spoth R (2011). Self-verification as a mediator of mothers' self-fulfilling effects. *PSPB*. doi:10.1177/0146167211399777 [V]
- Yang J, Wang Y (2025). The Goldilocks effect of parental educational aspirations. *Eur J Psychol Educ*. ERIC EJ1451584 [V]

**How parents act; involvement quality**
- Cohen R, Gershy N, Davidov M (2024). Why things can go wrong when parents help with homework. *J Educ Psychol*. ERIC EJ1434749 [V]
- Grolnick WS, Gurland ST, DeCourcey W, Jacob K (2002). Antecedents and consequences of mothers' autonomy support. *Dev Psychol*. ERIC EJ647703 [V]
- Grolnick WS, Pomerantz EM (2022). Should parents be involved in their children's schooling? *Theory Into Practice*. ERIC EJ1366080 [V]
- Hill NE, Tyson DF (2009). Parental involvement in middle school: a meta-analysis. *Dev Psychol*. ERIC EJ838541 [V, sib]
- Jeynes WH (2024). Parental expectations component meta-analysis. *Urban Educ*. ERIC EJ1402483 [V]
- Kim SW, Hill NE (2015). Including fathers in the picture. *J Educ Psychol*. ERIC EJ1082651 [V-partial]
- Moroni S, Dumont H, Trautwein U, Niggli A (2015). Quantity and quality in parental homework involvement. *J Educ Res*. ERIC EJ1071754 [V]
- Pinquart M (2016). Parenting styles and academic achievement: a meta-analysis. *Educ Psychol Rev*. ERIC EJ1110201 [V]
- Silinskas G, Kikas E (2019). Parental involvement in math homework. *Scand J Educ Res*. ERIC EJ1198227 [V]
- Vasquez AC, Patall EA, Fong CJ, Corrigan AS (2016). Parent autonomy support: a meta-analysis. *Educ Psychol Rev*. ERIC EJ1110197 [V]
- Waters LE, Loton D, Grace D, Jacques-Hamilton R (2019). Strength-based parenting and subjective wellbeing over time. *Front Psychol*. doi:10.3389/fpsyg.2019.02273 [V]
- Barger MM, Kim EM, Kuncel NR, Pomerantz EM (2019), *Psychol Bull*; Maloney EA et al. (2015), *Psychol Sci*; Stattin H, Kerr M (2000); CHAMP/MLAP (J-PAL): all [V, sib] via `conductor/parent-loop.md` §1

**India and culture**
- Deb S, Strodl E, Sun J (2014). Academic-related stress among private secondary school students in India. *Asian Educ Dev Stud*. doi:10.1108/aeds-02-2013-0007 [V]
- Dandona R, Kumar GA, Sagar R (2026). Beyond the numbers: the rise in student suicide deaths in India. *Lancet Reg Health SE Asia*. doi:10.1016/j.lansea.2026.100822 [S, title]
- Biswas S, Maji S (2026). Parental expectations, academic stress and NSSI among NEET and JEE aspirants. *Glob Ment Health* [S, title]
- Ng FF, Pomerantz EM, Deng C (2014). "My child is my report card". *Child Dev*. doi:10.1111/cdev.12102 [V]
- Ng FF, Pomerantz EM, Lam S (2013). Mothers' beliefs about children's learning in Hong Kong and the US. *IJBD*. ERIC EJ1019592 [V]
- Ng J, Xiong Y, Qu Y, Cheung C (2019). Chinese and American mothers' goals and children's emotional distress. *Dev Psychol*. ERIC EJ1234779 [V]
- Sahoo AK, Bajpai A (2025). PARAKH Rashtriya Sarvekshan 2024. ERIC EJ1505843 [V]; PARAKH Holistic Progress Card templates [M]
- NCERT (2022) mental health and wellbeing survey [V, sib via `learner/need-goals.md` §1.7]

**Uncertainty communication**
- Kerr J, van der Bles AM, et al. (2023). Communicating uncertainty around statistics and public trust. *R Soc Open Sci*. doi:10.1098/rsos.230604 [V]
- Mosteller F, Youtz C (1990). Quantifying probabilistic expressions. *Stat Sci*. doi:10.1214/ss/1177012242 [S]
- Teigen KH (2022). Dimensions of uncertainty communication. *Curr Psychol*. doi:10.1007/s12144-022-03985-0 [V]
- van der Bles AM, van der Linden S, Freeman ALJ, Spiegelhalter DJ (2020). The effects of communicating uncertainty on public trust in facts and numbers. *PNAS*. doi:10.1073/pnas.1913678117 [V]
- Wintle BC, Fraser H, Wills BC, Nicholson AE, Fidler F (2019). Verbal probabilities: very likely to be somewhat more confusing than numbers. *PLoS One*. doi:10.1371/journal.pone.0213522 [V]
- Gigerenzer G, Hoffrage U (1995). Natural frequencies and Bayesian reasoning. *Psychol Rev* [S]

**Rhythms**
- Goldin AP, Sigman M, Braier G, Golombek DA, Leone MJ (2020). Interplay of chronotype and school timing predicts school performance. *Nat Hum Behav*. doi:10.1038/s41562-020-0820-2 [V]
- Pope NG (2016). How the time of day affects productivity: evidence from school schedules. *Rev Econ Stat*. doi:10.1162/rest_a_00525 [S]
- Sievertsen HH, Gino F, Piovesan M (2016). Cognitive fatigue influences students' performance on standardized tests. *PNAS*. doi:10.1073/pnas.1516947113 [V]
