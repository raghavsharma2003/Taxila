# World-best: how a child learns best, and hyper-personalisation that moves learning

**Date:** 2026-10-03 · **Area:** learning styles and what replaces them; guidance level (worked-example fading, the expertise
reversal effect, rapid diagnosis of expertise); concreteness fading and choosing a representation; retrieval practice,
spacing and interleaving for children; interest-based (context) personalisation and LLM-generated personalised
problems, explanations and stories; bandits and RL for instructional sequencing (2024-2026); motivation and affect
adaptation; the products that do this best. · **Status:** a research extension. Nothing here has been run on children.

**What this file is NOT.** It does not repeat what Taxila has already researched. Read these first:
`../learning-science.md` (LS) §2 (learning styles, the meshing test, ATI, format bandits) and §3.5;
`../learner/personalisation-2026.md` (PZ1-PZ14, the L/F/X knob classes, the MRT factors F-START…F-PRO, the HTE gate);
`../learner/motivation-interest.md` (MI; it already uses ZPDES-with-choice, Clément et al. 2024);
`../comprehension/reteach-personalisation.md` (RT, the re-teach arm bandit);
`../conductor/adaptation-policy.md`; `../learner/kt-algorithms.md` (BKT-R, FSRS-6); and the two sibling world-best
files from today: `understanding-detection.md` and `tutoring-products-pedagogy.md` (products, Bridge, Khanmigo,
Maryland, Chung 2026 adaptive difficulty). This file adds: **newer child-age evidence (2024-2026) on fading,
interleaving and retrieval that partly contradicts the current lesson rules; a reading of the Taxila code showing which
kit fields the Director ignores; the Math Academy FIRe mechanism mapped onto `weave.js` and `fsrs.js`; the
corpus-level failures of LLM context personalisation in Hindi; a structural (not post-hoc) constraint for any bandit; and
two corrections to the Eedi registry facts in PZ14.**

**Tags.** **[V]** read in the primary source this session ("abs" = abstract only). **[S]** secondary (a search summary,
a blog, a citation inside another source). **[U]** unverified, or a Taxila design inference that must be measured.
**[T]** confirmed by reading Taxila's own code or docs this session.

---

## 0. The answer on one screen

1. **Learning styles are still dead in 2026, and LLM papers keep reviving them by confounding.** Nothing new shows a
   meshing crossover. New "personalised to learning style" LLM work bundles style with interests and the learner's
   major, so it cannot isolate style. PAIGE (n = 180 adults) is one example: personalised podcasts beat textbooks in
   some subjects [V abs]. The one 2026 study that tests trait × format interactions properly (222 Grade 10 students;
   TTS dialogues between teacher and student, student and student, or teacher and teacher) found small to medium
   interactions on *motivation*. On learning outcomes there were only trends, and the authors call it "preliminary"
   [V abs]. LS §2 stands unchanged.
2. **What really varies between children is how much guidance they need, and Taxila adapts it as a single on/off
   switch.** `server/director/state.js isNovice()` gives a novice one worked example in at most 2 parts; everyone else
   attempts first [T]. Every kit already holds a `workedExample.fadedVersion`, with every step blanked, and
   `server/content/kits.js` loads it. **No code in `server/` reads it** [T]. The evidence for a graded ladder is
   strong. Adaptive fading driven by the learner's own step explanations gave the best delayed transfer: 6.67 vs 4.50
   for fixed fading and 4.66 for problem solving, replicated *in vivo* (Salden et al. 2010) [S]. The expertise
   reversal meta-analysis found high generalisability and that "giving assistance to novices appears more important
   than withholding it for experts" (Tetzlaff et al. 2025) [S]. This is the cheapest high-value steal in this file (S1).
3. **Interleaving for children is real but conditional, and the most important new result is a year-long null in an
   LMIC.** In 62 Nigerian classrooms, interleaved problem sets raised short-term retention by **+0.29 SD**, but
   **had no effect on a cumulative end-of-year test**. Large gains at the bottom of the distribution were offset by
   *losses at the top* (van der Haar, Gray-Lobe, Kremer & de Laat 2023) [V]. Against it: Rohrer et al. 2020, US
   Grade 7, 787 students, d = 0.83 on an unannounced test a month later [V], and Scheitz et al. 2025 (238 German
   third graders, gains lasting 16 weeks) [V abs]. Interleaving also helped mainly children with *high* prior
   knowledge in spelling (Klimovich & Richter 2025, n = 147) [V abs]. **So interleaving is gated by prior
   knowledge, and Taxila must check its effect by tercile** (S4).
4. **"Blocked first, then mixed" is not supported as a general rule.** Scheitz 2025 tested blocked-then-interleaved
   against pure interleaving: "neither initial blocking nor self-explanation prompts yielded additional benefits over
   pure interleaving" [V abs]. The exception is *representations*: for low-prior fifth and sixth graders, blocking
   graphical representations of fractions and then moving to an increasingly interleaved sequence worked best (Rau,
   Aleven & Rummel 2010) [V]. LS §3.5 and the lesson rule ("3 blocked items, then interleave", `docs/research/design/lesson-arc.md`)
   need to separate *problem types* from *representations* (§4 C2).
5. **Retrieval practice works for 7-year-olds, but the benefit grows with age, and spacing inside a class is often
   null.** The ability to benefit from testing rises from age 7 to 14, while re-study shows no age trend
   (Rodríguez-Gonzalo et al. 2024) [V abs]. In real Grade 5 classrooms, testing with feedback until 100% correct beat
   re-reading, but lengthening the spacing interval did nothing (Franzoi et al. 2025) [V abs]. Expanding and
   equal-interval schedules ended equal for 4-5-year-olds (Leonard et al. 2024) [V abs]. **For classes 1-3, the
   lever is retrieval with corrective feedback until the child is right. Fine-tuning the shape of the schedule is
   not** (S5).
6. **Math Academy is the most rigorous production system for spacing over a prerequisite graph.** Its FIRe method
   ("fractional implicit repetition") lets a review of an advanced topic count as a fractional review of the topics it
   encompasses. It chooses the reviews that clear the most due items ("repetition compression"), and it turns implicit
   credit off for any topic the student is learning slowly [V, vendor engineering blog]. Taxila already has the hard
   part: `weave.js` hosts an earlier skill as a *necessary sub-step* of a later topic [T]. But that event only grades
   the earlier skill. It does not feed the FSRS schedule (S3).
7. **Interest personalisation raises motivation reliably, but its learning effect is small, uneven and fragile in
   LLM form.** Meta-analysis (Lin, Lin, Zhang & Ginns 2024, 34 publications): interest g = 0.55, retention g = 0.48,
   transfer g = 0.36. But transfer rests on only k = 6 (n = 375), and retention was *larger in quasi-experiments* [V abs].
   Randomised LLM context personalisation of vocabulary examples (n = 272): **no learning difference, higher
   motivation** (Leong et al., CHI 2024) [V abs]. Students prefer *fine-grained* pop-culture references. With a
   teacher in the loop, personalisation came out coarse and did not get faster with practice (Walkington et al. 2026,
   521 Grade 7 students) [V abs]. **PZ11 already has interest contexts as an F knob that must earn L in F-INT. This
   evidence keeps them there.**
8. **LLM localisation into Hindi fails at the corpus level, where no single-item check can see it.** Claude Opus 4,
   GPT-4.1 and Gemini 2.5 Pro adapted 60 maths word problems into 7 languages, including Hindi (6,489 annotated
   entity changes). The models agreed on the specific substitution only **33.5%** of the time. All 21 model × language
   combinations showed **entropy collapse**: adaptation compressed cultural diversity rather than expanding it.
   There was regional misattribution (Bangladeshi taka for Indian Bengali) and contamination ("egg hunts as Eid
   activities") (arXiv 2606.11009) [V abs]. A per-item gate cannot catch this (S6, S7).
9. **Any bandit or RL policy must have its admissible actions constrained by the child's mastery state, structurally.**
   Across 21 M logged interactions, "engagement events without corresponding mastery gains" were **26.5%** of
   interactions on Junyi (72,758 students) and 3.1% on XES3G5M. A policy whose action set expands only as
   prerequisites are mastered was "the only method to reduce reward hacking severity across all conditions" (MC-CPO,
   arXiv 2604.04251) [V abs; offline simulation, not a learner trial]. Taxila's code guards already do this for the
   re-teach bandit (RT exclusions). The steal is to make it a *named invariant* plus a monitored rate (S8).
10. **Corrections to PZ14 (Eedi scaled RCT, AEA 18079).** The registry, last updated 2026-06-30, gives the
    intervention period as **2026-04-13 → 2026-06-21**, not 03-18 → 08-31. It states **58.6% power to detect 0.1 SD
    between the two AI arms** (session context vs longitudinal data) [V]. A null between those arms is therefore
    uninformative. Taxila must not read "memory did not help" from it (§4 C1).

---

## 1. Landscape: who and what is best at each piece (2024-2026)

### 1.1 Learning styles: what changed since LS §2

| work | what it does | what it shows | tag |
|---|---|---|---|
| LS §2 corpus (Pashler 2008 → Hattie & O'Leary 2025) | the meshing test | no crossover; matching d = 0.04 | [S], unchanged |
| PAIGE (Do et al. 2024, arXiv 2409.04645), n = 180 adults | podcasts personalised to "majors, interests and learning styles" vs generic podcasts vs textbook | "significantly improved learning outcomes, although this was subject-specific". Style is **confounded** with interest and major | [V abs] |
| Dialogue format × learner traits (arXiv 2608.20822, 2026), n = 222, Grade 10 | LLM+TTS lessons as teacher-student, student-student or teacher-teacher dialogue; Kolb factors and critical-thinking disposition as moderators | small-medium interactions on ARCS motivation; learning only "a trend toward significance"; the teacher-teacher format was rated *lower* overall even where motivation rose | [V abs] |
| Hartwig & Rohrer 2025, Grade 7, n = 174 + 233 | how students judge strategies | students rate interleaving "less effective, less preferable, more time-consuming, and more difficult"; nearly half fail to see that spacing works | [V abs] |
| Zheng et al. 2025 (SIGCITE), students choose among LLM explanations | knowledge level vs hobbies vs favourite subject vs all three, as the profile fed to the LLM | students preferred responses built from their **knowledge level**; the pattern varied by scenario | [V abs] |

**Reading.** The 2026 LLM literature has a "learning style" problem with a new mechanism: the profile fed to the
generator is a bundle, so any gain gets credited to "style". Taxila's PZ7 rule (no identity or trait attribute
reaches a generator) already blocks this. Add *self-reported style* to that list explicitly (§4 C4). The
preference-vs-efficacy gap is now measured in children's own words (Hartwig & Rohrer). Any *child-facing* choice about
practice strategy will pick blocking.

### 1.2 Guidance level: worked examples, fading and the expertise reversal effect

| work | n / who | finding | tag |
|---|---|---|---|
| Tetzlaff, Simonsmeier, Peters & Brod 2025, *L&I* 98:102142 (meta) | — | novices learn more with high assistance and experts with low assistance; moderated by how prior knowledge is measured, educational status and domain; "high generalizability"; assistance for novices matters more than withholding it from experts | [S] (search summary; ScienceDirect blocked; CC BY-NC-ND) |
| Salden, Aleven, Schwonke & Renkl 2010, *Instr Sci* | geometry Cognitive Tutor, lab + in vivo | **adaptive** fading, where a step is faded once the student's self-explanation of that step's principle is correct, beat fixed fading and plain tutored problem solving on the **delayed** test (6.67 vs 4.50 vs 4.66); the lab and classroom studies agreed on the delayed result | [S] |
| Kalyuga & Sweller 2004/2005, *ETR&D* | algebra tutor, yoked control | **first-step rapid diagnosis**: show a problem and ask only for the first step. This tailored instruction to changing expertise and gave higher knowledge and efficiency gains than the yoked control; the rapid test took 3.7× less time than traditional tests | [S] |
| Tithi, Tian, Limke, Chi & Barnes 2026 (arXiv 2602.16806) | 155 undergraduates, logic tutor | both interactive example types beat control. **Buggy** examples (find the error) helped *high*-prior learners; **guided** examples (fill the missing rule) helped *low*-prior learners | [V abs] |
| McGinn, Booth & Huyghe 2025, *JECP* | 58 US Grade 4-5 classrooms, a year, cluster-randomised | MathByExample (worked examples + self-explanation prompts on worksheets): **no overall effect**. More self-explanation attempts helped only at high worksheet dosage. **Higher-prior students were hurt by attempting more worksheets.** Self-explanation helped preparation for future learning only at average or higher prior knowledge | [V abs] |
| Stone et al. 2026, *J Intell* | 201 children aged 4-6 | watching correct *or* incorrect sharing strategies and explaining them beat baseline. Children who referred to the **process** outperformed those who referred to the outcome | [V abs] |
| He-Yueya, Goodman & Brunskill 2024 (arXiv 2403.02795) | GPT-3.5 as simulated expert | an LM judge **reproduced the expertise reversal and variability effects** and was used as the reward for generating worksheets; teachers agreed with its preferences | [V abs] |

**Reading.** Three things are new for Taxila. (a) The decision is a **continuum** (full example → faded → completion →
attempt), and the strongest delayed results come from fading *per step* on the child's own step explanations. (b)
Error-spotting is a *high-prior* move and completion is a *low-prior* move, at least in adults (Tithi). Taxila already
holds error-spot back until mastery (`items.js ERROR_SPOT_P = 0.7`) [T]. (c) In a year-long primary trial, the
intervention mainly reached the children who already had the knowledge, and **extra practice hurt high-prior
children** (McGinn). Mastery-based stopping is a learning lever, not only a time saver.

### 1.3 Concreteness fading and choosing a representation

| work | finding | tag |
|---|---|---|
| Fyfe & McNeil (Notre Dame poster; *L&I* 2015 paper) | for children with low equivalence knowledge, concrete → fading worksheets → abstract beat concrete-only, abstract-only and abstract→concrete on transfer | [V poster] |
| "One instructional sequence fits all?", *EPR* 2021 (ERIC EJ1310124) | evidence mostly positive for basic maths, "less convincing" in science; CF "may not be as generalizable as has been suggested" | [S] |
| Rau, Aleven & Rummel 2010 (ITS) | Grade 5-6 Fractions Tutor: "an advantage for blocking representations and for moving from a blocked to an interleaved sequence … especially pronounced for students with low prior knowledge" | [V] |
| Rau, Aleven & Rummel 2017, *Instr Sci* 45:331 | 74 Grade 3-5 children: **sense-making first** (explaining verbally how two representations map) then perceptual-fluency practice; the reverse order did not help | [S] |
| Concreteness Fading for Primary School Computing, *ACM TOCE* 2026 | CF applied outside maths; not read | [S, title] |

**Reading.** Taxila's engines already fade from concrete to symbolic on the child's words (rule 19, LS) [T]. Two
refinements: (1) *within* a skill, the order is: one representation blocked, then a **verbal mapping** turn between
the two representations (sense-making), then mixed representations; (2) in science kits, CF is a hypothesis, not a
rule.

### 1.4 Retrieval, spacing and interleaving in children: the 2023-2026 evidence

| work | population | result | tag |
|---|---|---|---|
| Rodríguez-Gonzalo, Arnaez-Telleria & Paz-Alonso 2024, *Front Behav Neurosci* | ages 7-14, word pairs | the ability to benefit from testing **increases with age**; mechanisms "may not be fully in place by early middle childhood" | [V abs] |
| Franzoi et al. 2025, *Front Psychol* | real Grade 5 classes, history texts | testing with feedback until 100% correct > re-reading; **spacing manipulation: no effect** | [V abs] |
| Carvalho & Godwin 2025, *JEP:Applied* | 90 children, mean age 7 | retrieval practice gave better learning; generating predictions gave more attention | [V abs] |
| Leonard et al. 2024, *JSLHR* | 28 children aged 4-5 (with and without DLD) | expanding vs equal spacing converged by the final test; early short gaps "might give a misleading picture" | [V abs] |
| Rohrer, Dedrick, Hartwig & Cheung 2020, *J Ed Psych* 112:40 | 787 Grade 7 students, 54 classes, cluster RCT | interleaved 61% vs blocked 38% on an unannounced test a month later, **d = 0.83**; OSF data public | [V] |
| Brunmair & Richter 2019, *Psych Bull* (meta) | 59 studies, 238 effects | overall g = 0.42; **mathematics g = 0.34**; no effect for expository text; "similarity matters" | [S] |
| **van der Haar, Gray-Lobe, Kremer & de Laat 2023**, EdWorkingPaper 23-876 | **62 classrooms, Nigeria (NewGlobe schools), full year** | short-term retention **+0.29 SD**; **no average effect on a cumulative year-end test**; large gains at the bottom offset by **negative effects at the top** | [V] |
| Scheitz et al. 2025 (PsyArXiv mqcnp) | 238 Grade 3 students, subtraction strategies, 3×2 | interleaved and blocked-to-interleaved both beat blocked on flexibility, adaptivity and conditional strategy knowledge, **lasting 16 weeks**; no direct accuracy gain; initial blocking and self-explanation added nothing | [V abs] |
| Klimovich & Richter 2025, *Cogn Res* | 147 Grade 3 students, spelling rules, preregistered | interleaved < blocked errors at the immediate and 8-week tests; "primarily among children with high prior knowledge" | [V abs] |
| Dong et al. 2025, *J Intell* | children vs young adults, rock categories | interleaving helps both, adults more; it **reduces children's overconfidence** | [V abs] |
| Ingebrigtsen et al. 2025 (PsyArXiv) | 799 nursing students, 19 campuses, campus-randomised | teacher-made spaced-repetition flashcards: users d = 0.42 vs non-users, but **only a third used them** | [V abs] |

**Reading.** For a 6-15-year-old Indian audience the honest priors are these. Retrieval: yes, always, with feedback
until correct. The schedule shape (expanding vs equal): second-order. Interleaving: yes *after* the strategies have
been taught, with a measured distributional check, because the only LMIC year-long trial found it moved learning from
the top of the class to the bottom with no average gain on the outcome that matters. Interleaving also improves
children's calibration (Dong), which plugs into the existing metacognition work.

### 1.5 Interest (context) personalisation and LLM-generated problems, explanations and stories

| work | what | finding | tag |
|---|---|---|---|
| Lin, Lin, Zhang & Ginns 2024, *EPR* (meta, 34 publications) | personalisation by interest | interest g = 0.55 (26 ES, n = 5,335); cognitive load g = 0.54; retention g = 0.48 (46 ES); transfer g = 0.36 (**6 ES, n = 375**). Interest effect moderated by diagnostic approach, **grain size** and domain; retention effect varies by continent and is **larger in quasi-experiments** | [V abs] |
| Walkington 2013; Bernacki & Walkington 2018 | Cognitive Tutor algebra | performance, efficiency, less gaming, classroom exam gains | [V] in MI/LS |
| Walkington, Feng, Pruitt-Britton, Beauchamp & Lan 2026 (arXiv 2602.15876) | 7 teachers × ChatGPT, 521 Grade 7 students | teacher-in-the-loop personalisation lands at a **broad grain size**; students prefer specific pop-culture references; teachers spent "a lot of effort", and it **did not become time efficient** | [V abs] |
| Ikram, …, Walkington, Heffernan & Lan 2026 (arXiv 2604.05160) | 600 ASSISTments problems × 20 interests, GPT-5.2 at T = 0 | four validators (**realism, solvability, readability, authenticity**); authenticity and realism the most common zero-shot failures; solvability failures about 10%; most gain after **one** generate-validate-revise round; decentralised refinement fastest for realism and readability, centralised-with-planning best for authenticity. **No learner outcomes** | [V full text] |
| Leong, Pataranutaporn, Danry, Perteneder, Mao & Maes, CHI 2024 | n = 272, vocabulary, randomised | generated sentence or story from the learner's own input vs a sourced sentence: **no learning difference**, higher motivation | [V abs] |
| Lim et al. 2025, PAGE (arXiv 2509.15068) | LLM-contextualised content | higher perceived relevance and trust; no effect size in the abstract | [V abs] in reteach-personalisation |
| "Who Brought Easter Eggs to Eid?" (arXiv 2606.11009, 2026) | 3 frontier models × 7 languages incl. **Hindi, Bengali, Punjabi** | 62.5% agreement on transformation type, **33.5% on specific substitutions**; **entropy collapse in all 21 combinations**; surface markers (names, foods, currency) changed while deep assumptions (grade systems) were kept; regional misattribution and cross-cultural contamination | [V abs] |
| "Bridging the Culture Gap" (arXiv 2508.14913) | localising MWP benchmarks | translated problems keep English-centric entities; native entities change measured maths ability | [V abs] |
| "The Easy Trap" (arXiv 2607.26067, 2026) | 4 LLM systems rate 32 arithmetic items; 770 students | Spearman ρ = 0.52-0.70 overall, but systematic **underestimation of misconception-driven items** (fractions: "100 : 1/2" had 34% correct and was rated easy) | [V abs] |
| Sirnoorkar et al. 2025 (arXiv 2511.04290) | 839 physics students | when free to choose their own context, 96.5% produced analogies; only ~40% did when told to explain "to a second grader" | [V] |
| Zhang et al. 2024 *Mathemyths* | 35 children aged 4-8 | LLM co-storytelling taught maths vocabulary as well as a human partner | [V abs] in PZ |

**Reading.** The evidence supports (a) contexts at the **child's own grain size**, which in a voice product means
the child's words, not a category id; (b) a **validate-revise loop** with named dimensions and one round; (c) a
**corpus-level** cultural audit, because the failures that matter (collapse, misattribution) are invisible per item;
(d) **never** trusting an LLM's difficulty rating on misconception-heavy items, fractions above all (Taxila classes 3-7). It
does not support claiming interest personalisation as a learning effect until F-INT shows one.

### 1.6 Bandits and RL for instructional sequencing (2024-2026)

| work | finding | what Taxila takes | tag |
|---|---|---|---|
| ZPDES with choice (Clément et al. 2024, arXiv 2402.01669), 265 children aged 7-8, RCT | ZPDES beat a hand-designed curriculum on learning and experience; adding *irrelevant* choice raised intrinsic motivation and learning; **choice added to a fixed linear curriculum hurt learning** | choice only inside an adaptive sequence (in MI already) | [V abs] |
| MC-CPO (arXiv 2604.04251, 2026) | engagement-without-mastery in 26.5% (Junyi) / 3.1% (XES3G5M) of interactions; prerequisite-gated action space; mastery gain +18.3% / +54.0% over baselines, **offline** | structural admissibility + an EWM-rate monitor | [V abs] |
| Schmucker et al. 2025 (CK-12, 1M students) | personalisation through contextual bandits rarely beats a good one-for-all policy | PZ9 (population first) — already in Taxila | [V] in PZ |
| WAPTS (Song, …, Rafferty & Williams 2025, arXiv 2501.03999) | Thompson sampling adjusted for sparse data identifies good arms earlier | candidate for the re-teach bandit's cold arms | [V abs] |
| Lin, Ham & Bojinov 2026 (arXiv 2604.24652) | adaptive Neyman allocation improves precision at finite n; policies that trade inference against regret | for the research arm (PH family), not the live re-teach bandit | [V abs] |
| "Stochasticity Is Not the Hard Part" (arXiv 2608.05455, 2026) | sequencing over a prerequisite DAG reduces exactly to a deterministic shortest path on a lattice | a theory result; it says optimal order matters only through prerequisite structure plus success probability, which Taxila already models | [V abs] |
| Access timing RL (arXiv 2605.15850, 2026), n = 105 undergraduates | RL-timed access to GenAI > unrestricted on post-test and metacognitive accuracy | the help ceiling as a *timing* decision; compare the sibling's `rj-timed-help-lockout` (time locks hurt) | [V abs] |
| On-demand tutoring HTE (arXiv 2602.19296, 2026), 5,000+ sessions | +4 pp next-problem, +3 pp next skill; session effects −20 to +20 pp; **larger for lower prior mastery**; talk time did not track impact | the "initiative scales with need" rule (PZ10) gets a second source | [V abs] |
| Doroudi, Aleven & Brunskill 2019 review (IJAIED) | over half of RL policies tested on students beat all their baselines, often weak ones | treat RL claims with a strong baseline | [S] |
| Chung et al. 2026 (sibling file) | adaptive difficulty +0.15 SD unassisted in Taipei | re-opens `adaptive-sequencing-as-the-lever` | [S] here |

**Reading.** In 2024-2026 no RL sequencing result on real children beats ZPDES-style learning-progress bandits with
code constraints. Taxila's choice of TS-PostDiff with exclusions (decisions.md, re-teach) is current practice. What
is new is the explicit measurement of the failure mode: engagement without mastery, which is reward hacking.

### 1.7 Motivation and affect adaptation (only what is new beyond MI and DA)

- **Kong et al. 2025, *J Big Data* (n = 271, 4 arms).** This is a multimodal (face, voice, physiology) affect-cognition
  tutor with a constrained bandit. It reports +15 pp and d ≈ 0.8 for mid-ability learners and affect recognition at
  82-88% [V abs]. **It is unusable for Taxila twice over.** Its modalities fall under the Microsoft Code of Conduct
  restriction (`ct-no-voice-emotion-inference`). And its numbers have no replication or published code; treat them as
  [U]. Keep it only as the pattern "the intervention type depends on the state": content changes for confusion,
  interface changes for frustration, motivational support for boredom. That is already MI §3.2.
- **Feng, …, Arroyo, Woolf & Allessio 2025 (AIED, MathSpring line).** A personalised tutor that "responds to affect".
  The abstract is elided by the publisher, so nothing is claimed [U].
- **Choice, without a reward economy.** ZPDES 2024 above. This is the cleanest child-age evidence that *agency* improves
  learning only when sequencing is adaptive.

### 1.8 Products: what each does better than anyone (beyond `tutoring-products-pedagogy.md`)

| product | what it does better than anyone | evidence | tag |
|---|---|---|---|
| **Math Academy** | spacing over a knowledge graph of thousands of topics: FIRe implicit credit, repetition compression, per student-topic learning speed (0.5x-2x), an information-maximising adaptive diagnostic, **halting a lesson** once struggle becomes inefficient, remedial review of failed prerequisites, interleaved quizzes | vendor reports (Pasadena cohort: AP Calculus BC 5s); no independent trial | [V vendor] mechanism / [U] effect |
| **Duolingo** (Birdbrain + session generator) | a learner × exercise difficulty model choosing from a lesson's allowed pool; half-life regression gave +12% daily engagement | secondary only; engagement, not learning | [S] |
| **Squirrel AI** | "nano-level" decomposition: ~300 junior-secondary maths points → 3,000-30,000 knowledge components | vendor experiment (1,662 Grade 5-6); not independent | [S] |
| **Amira** (voice reading tutor) | ASR-scored oral reading with a tutor voice; ESSA "moderate", mean ES +0.15; an old student-randomised RCT +0.64 (n = 178) | **SFUSD 2026:** children "yell" to be understood, it fails on accents, kindergarten usage ~12 of 120 intended minutes a month, an avatar parents found "creepy" | [S] / [S, press] |
| **ZPDES / Adaptiv'Math** (France) | learning-progress bandit at national scale: 53,000 teachers and 1.3 M students in 2023-24; a 900-student classroom evaluation registered | registry; results not found | [S] |

---

## 2. STEAL LIST (ranked by expected impact per unit of work)

Each item says what to build, where, the expected effect, how we would know, and the constraints. All models stay
Azure Foundry Direct (taxila-brain / taxila-fast deployments); none of these items needs a third-party model or code
licence. Math Academy's FIRe is a published *idea*; we write our own code and copy none of theirs.

### S1. Adaptive backward fading of the worked example the kits already contain

- **What.** Replace the one-shot `worked_example` teach step with a per-step ladder: full step → faded step (the kit
  `fadedVersion` line, "___" blank) → child produces the step. Fade step *j* once the child has correctly *named or
  justified* step *j* (or its principle) once, the way Salden faded on self-explanation, not on a schedule. Fade
  **backward** first (the last step blanked first, Renkl and Atkinson's order [S]) for B1-B2. Let B3-B4 fade on evidence
  in any order.
- **Where.** A new pure module, `server/director/fading.js` (`nextWorkedStep(we, stepEvidence, band) → {mode: 'show'|'blank'|'produce', step}`).
  Call it from `state.js`'s `worked_example` branch in place of `workedContent(we, part, parts)`. Add a shape
  `SH.complete({ blankIdx })` in `shapes.js`, written as a note, not a line (house rule). The step's evidence is a
  P15/P2 event on the skill, through the existing `answerEvents` adapter. The kit field already exists
  (`shared/contracts.ts:29`, `server/content/kits.js:119`) [T]. The kit lint must check that `fadedVersion.length === steps.length`
  and that each blank removes a *key* part (one line in `scripts/` kit lint) [U].
- **Expected impact.** The largest delayed-transfer gain in the guidance literature (Salden, delayed 6.67 vs 4.50) [S].
  The expertise reversal meta-analysis says novices gain most from the extra support [S].
- **Measure.** Add the factor **F-FADE** (adaptive fading vs today's one-shot example, p = 0.5) to the PZ §3.8 MRT,
  available for novice × new skill. Proximal: `y_next`; distal: `y_delay`, `y_transfer`. Gate on director-sim: the
  number of teach turns per skill must not rise by more than 1 at the median.
- **Constraint.** Voice is transient. Each faded step goes on the whiteboard (`whiteboard: { kind: "math" }`)
  so the child is not holding the earlier steps in memory (LS §2.4 item 3).

### S2. A graded guidance level from a first-step probe (rapid diagnosis of expertise)

- **What.** Replace the boolean `isNovice` with `guidanceLevel ∈ {example, faded, attempt}`. It is set from (a) the
  ledger's pL for the skill and its prerequisites and (b) for a skill with no evidence, a **first-step probe**:
  "what would you do first?" on the kit's worked problem (Kalyuga & Sweller). The probe is one turn, code-graded
  against `steps[0]` with the existing closed classifier. Correct → attempt-first. Partial → faded. Wrong or IDK →
  full example.
- **Where.** `server/director/state.js` (`isNovice` → `guidanceLevel`). The probe is a new `kind: "first_step"`
  in `items.js PROBE_FOR_KIND`, mapped to the P10 family weight. The probe scheduler (`comprehension/schedule.js`) must
  count it as test load. Add a stop rule from McGinn 2025: high-pL children stop practice at the mastery
  criterion and do not finish the queue (`QUEUE_MAX` becomes a cap, not a target).
- **Expected impact.** It moves "worked example vs attempt-first" from a two-state guess to a measured decision. It is
  the exact individual difference the ATI literature says is real (LS §2.5).
- **Measure.** The existing PH5 expertise-reversal MRT (decisions.md, research programme). Add the probe's own
  validity: the agreement of first-step correctness with the first unaided attempt (target κ ≥ 0.5) on 200 logged
  turns [U].
- **Constraint.** The probe must not reveal the answer, so it uses only the *first step*. Under PZ5, its grader
  runs on code.

### S3. FIRe for Taxila: implicit spaced credit through `weave.js`, and repetition compression in the planner

- **What.** When a later item *necessarily* exercises an earlier skill (the `weave` host contract already requires
  "a NECESSARY sub-step") [T], post a **fractional FSRS review** to the earlier skill with weight w ∈ (0, 1]. w is set
  per (host topic, hosted skill) in the curriculum graph. Credit flows down. A failure on the earlier skill flows up as
  a penalty to the hosts. **Speed gate (Math Academy's rule):** if the earlier skill is fragile or its FSRS stability is
  below the band median, discard implicit credit and force an explicit review. **Repetition compression:** when the
  Conductor picks review items for a day, prefer the item whose host coverage clears the most due skills.
- **Where.** `server/learner/kt/fsrs.js` (a `reviewFractional(card, grade, w)`), `kt/ledger.js` (prerequisites already
  pass through `prereqsOf`) [T], `server/comprehension/weave.js` (emit the fractional event when hosted), and the
  Conductor `planner.js` review selection. The open item `integration-learner-open-2026-10-03` already notes that a
  hosted woven sub-step has no host item yet [T]. This steal gives that seam its second purpose.
- **Expected impact.** Fewer explicit review turns per retained skill, at equal or better delayed retrieval success,
  in a product where session time is the binding constraint. [U]: Math Academy publishes no controlled effect.
- **Measure.** (1) In the comprehension sim: explicit reviews per skill-month, and DRS (OE O5), with FIRe on vs
  off, 20 seeds. (2) In production: a **non-inferiority** test on DRS (margin −2 pp) with reviews per retained skill
  as the primary outcome.
- **Constraint.** Implicit credit never counts toward mastery (`quiz-k-only-mastery`, `in-game-success-as-mastery`
  rejections). It changes *when* a review is due, never whether a skill is learned.

### S4. Interleave by discrimination need and prior knowledge, then check by tercile

- **What.** Interleave **problem types** (choose the strategy) only after each strategy has been taught and the child
  has ≥ 1 unaided success on it. Do it in mixed review, with no mandatory blocked warm-up (Scheitz). For low-prior
  children, interleave **less** and add explicit contrast prompts (Klimovich: guidance helped low prior in blocked
  practice). Use mixed review especially where the child is overconfident (Dong). Interleave **representations**
  differently: blocked first, then increasingly mixed (Rau).
- **Where.** `server/director/items.js` (queue ordering; `KIND_ORDER` already has `contrast` and `translate_rep`)
  [T]. Review-session composition in the Conductor (`planner.js`, day-cycle). The LS §3.5 rule text in
  `design/lesson-arc.md` needs editing (§4 C2).
- **Expected impact.** Lasting strategy flexibility (Scheitz: 16 weeks) and calibration. It protects against the
  Nigerian pattern, where top students lost.
- **Measure.** `y_delay` and `y_transfer` **by baseline tercile**. The release rule: no tercile below its blocked
  control by more than 3 pp. This plugs into the sibling's proposed `open-equity-tercile-gate`.
- **Constraint.** Children rate interleaving as harder and less effective (Hartwig & Rohrer). Never offer
  "mixed vs same-type" as a child choice. Choice stays on irrelevant dimensions (ZPDES 2024).

### S5. Retrieval with feedback until correct for classes 1-3; stop tuning the schedule shape

- **What.** For B1-B2, every warm-up retrieval miss gets immediate corrective feedback and a re-retrieval later in
  the same session, until correct (Franzoi's procedure). For B1, do not add spacing complexity beyond FSRS defaults.
  For classes 1-3, a retrieval item may be **recognition** (choose of 2-3) before recall, because the testing benefit
  is still developing at that age (Rodríguez-Gonzalo) [U: the recognition step is our inference].
- **Where.** `server/director/shapes.js retrievalNext` and the warm-up path in `state.js` (`greet` → P10). FSRS
  parameters in `kt/fsrs.js` per band (none new; freeze the shape).
- **Expected impact.** Protects the one strategy with consistent child-age evidence. Saves the engineering time
  earmarked for schedule optimisation [U].
- **Measure.** DRS by band; the share of warm-up misses re-retrieved correctly in-session (target ≥ 0.8).

### S6. The interest-context pipeline: own-words grain, four validators, one revision round, code-checked isomorphism

- **What.** A personalised item is produced as follows. (1) The child's **own words** about the interest, captured in
  dialogue and stored as a closed interest id plus a ≤ 6-word phrase. The phrase is checked against PII (the existing
  scrubber) and is never a trait (PZ7). (2) Re-skin the kit item (`interestContexts`) into that phrase. (3) Run four
  validators: **realism** (plausible numbers and units; INR, km, Indian prices), **solvability**, **readability** (the
  class-band word list) and **authenticity** (age-appropriate, relatable). Add a **locale validator** (region, festival,
  currency, food consistency, Hindi register). (4) One revise round, then accept or fall back to the kit's own context.
  (5) **Code check:** the re-skinned item's numbers and operation solve by `forge/kitmath.js` to the same key as the
  source item. The model never grades its own work.
- **Where.** `server/forge/generator.js` (the "skin" already exists) [T], `server/forge/gate.js`, `server/forge/kitmath.js`,
  `server/forge/g2/critic.js` (the validator agents fit the existing critic slot) [T]. Models: taxila-fast to
  generate, taxila-brain to validate, both Azure Direct.
- **Expected impact.** Motivation and engagement (F) with high confidence. Learning (L) small and unproven (Leong
  null; meta transfer k = 6). It stays F until F-INT says otherwise (PZ11).
- **Measure.** Validator pass rate at round 0 and round 1, and a human audit of 100 items per class band
  (authenticity, locale). F-INT in the MRT for learning. Engagement: time on item and self-initiated sessions.
- **Constraint.** Generated media never carry facts (`generated-media-carries-facts` rejection). The phrase is
  child data under DPDP. Retain it only while the interest is active.

### S7. A corpus-level cultural and diversity audit for everything generated

- **What.** A nightly eval over the last N generated contexts per language: the **entropy** of named entities (names,
  foods, places, festivals) against the kit's own distribution; cross-region contamination (a festival from another
  community, the wrong currency or state); and **substitution agreement** between two model runs. It fails when
  entropy falls below the kit baseline by more than a set margin, or when contamination exceeds 1%.
- **Where.** `evals/interest-corpus-audit.mjs` (new), reading `forge` cache rows. Fixtures: Hindi, Hinglish and English.
- **Expected impact.** It catches the class of failure that per-item gates structurally miss (arXiv 2606.11009).
- **Measure.** The audit itself, plus a seeded-defect test: inject 20 contaminated items and require recall ≥ 0.9.
- **Constraint.** None beyond Azure. Annotation is code plus taxila-brain, spot-checked by a human.

### S8. Mastery-conditioned admissibility as a named invariant, plus an engagement-without-mastery monitor

- **What.** For every adaptive chooser (the re-teach bandit, Conductor rules R0-R14, Forge activity choice), the
  candidate set is computed by code from mastery state *before* the policy sees it. Today this is done case by case
  (RT exclusions, guards) [T]. Make it one predicate, `admissible(view, action)`, with a test that the policy is
  never called with an inadmissible arm. Add an **EWM rate**: the share of engagement events (game completions,
  module interactions, streak days) with no mastery gain on the next unaided item. Log it beside the PZ13 divergence
  monitor.
- **Where.** `server/conductor/guards.js`, `server/comprehension/reteach.js`, `server/forge/planner.js`;
  the monitor in `server/reports/derive.js` or the observability evals (`conductor/observability-evals.md`).
- **Expected impact.** It prevents the "fun and easy" drift that LS §2.7 warns about. The monitor turns that warning into a
  number (Junyi: 26.5%).
- **Measure.** EWM rate per week per band. Alert if it rises more than 5 pp after any policy change.

### S9. Representation sequencing inside a skill: blocked, then a verbal mapping turn, then mixed

- **What.** When a skill has two or more representations (`formats.secondary`, `engineHints`) [T]: first use one
  representation; then one **sense-making** turn ("how does this bar show the same thing as 3/4?", a P14
  `translate_rep` item); then mix representations. A re-teach that switches representation must include the mapping
  turn, not just the new picture.
- **Where.** `server/director/items.js` (P14 placement), `server/comprehension/reteach.js` (representation arms),
  engine modules under `src/modules/`.
- **Expected impact.** Low-prior children gain most (Rau 2010) [V]. Sense-making first is the order that worked (Rau
  2017) [S].
- **Measure.** P14 success, and `y_transfer` on items in the *other* representation.

### S10. Pick the example type by prior knowledge: guided (completion) for low, buggy (find the error) for high

- **What.** Extend the existing rule "error-spot after mastery". For skills with pL < 0.5, the post-teach example is
  a *completion* item. For pL ≥ 0.7 it is a *buggy* example: the teacher's deliberate mistake (P6; keep the
  `own-mistake-note-false-confession` guard). For B1, the ask is about the *process* ("how did she share?"), not
  the outcome (Stone 2026).
- **Where.** `server/director/items.js` (`ERROR_SPOT_P`), `shapes.js` (`probe`, `why`).
- **Expected impact.** Moderate. Evidence in adults (Tithi) and pre-schoolers (Stone) [V abs], not yet in classes 1-9.
- **Measure.** A two-arm F-EX factor in the MRT for the mid band, where equipoise exists.

### S11. LLM judges as an offline pre-screen for materials, never for difficulty on misconception items

- **What.** Use a taxila-brain "simulated expert" panel (He-Yueya 2024) to rank *alternative* generated worked
  examples or contexts before human review. Never use LLM-estimated difficulty for items tagged with a misconception,
  or for fractions or ratio items, until they have empirical calibration ("Easy Trap"). This tightens
  understanding-detection S7 ("b only, never a").
- **Where.** `server/forge/g2/review.js`, `server/learner/kt/priors.js` (cold-start b).
- **Measure.** Spearman correlation of LLM b against first-50-attempt empirical b, *separately* for misconception-tagged
  and other items. Block the tagged items if ρ < 0.5.

### S12. Show the child the evidence that hard practice works (calibration, not persuasion)

- **What.** After an interleaved or retrieval set where the child predicted poorly and then did well a few days later,
  the teacher points to the child's *own* data ("you thought mixing was harder; your mixed answers came back
  stronger"). It is a shape in a note, not a sentence. This is the only remedy for the preference-vs-efficacy gap
  (Hartwig & Rohrer) that respects the never-manipulate floor. It uses the child's real numbers.
- **Where.** `server/director/shapes.js` (wrap, callback), with facts from `server/reports/facts.js` style derivations.
- **Measure.** Self-initiated review sessions (B3-B4), and confidence calibration (metacognition-srl).

---

## 3. Anti-patterns the field learned the hard way

1. **"Personalised to learning style" that is really personalised to everything.** PAIGE-style bundles credit style
   with gains caused by interest, format novelty or retrieval quizzes (Learn Your Way, PZ §2.1). Taxila must never
   collect a style self-report. If a parent supplies one, it is ignored by every generator (PZ7 extension).
2. **Interleaving judged on the short-term test.** Nigeria: +0.29 SD short-term, null cumulative, top students harmed
   [V]. Any interleaving claim must be on a delayed, cumulative outcome, broken out by tercile.
3. **Adding a blocked warm-up "to be safe".** It cost time and added nothing in the 2025 Grade 3 trial [V abs].
4. **Spacing by schedule shape.** Expanding vs equal converged (Leonard 2024), and the classroom spacing manipulation was null
   (Franzoi 2025). Energy goes to retrieval with feedback instead.
5. **More practice for everyone.** High-prior Grade 4-5 children were *hurt* by more worksheets (McGinn 2025) [V abs].
6. **Teacher-in-the-loop personalisation at scale.** It is coarse, and it does not get faster (Walkington 2026). Taxila's
   generator must work at the child's grain with code validation, not route personalisation through a human queue.
7. **Single-item review of localised content.** Collapse and misattribution show up only across the corpus (Easter
   eggs at Eid) [V abs].
8. **Trusting an LLM's sense of what is easy.** It tracks the curriculum order, not misconceptions (Easy Trap) [V abs].
9. **Optimising RL for engagement.** Engagement without mastery is a large, measurable share of real traffic (MC-CPO)
   [V abs]. Post-hoc filtering is weaker than a constrained action space.
10. **Choice in a fixed path.** Choice helped only inside an adaptive sequence and *hurt* in a linear curriculum
    (ZPDES 2024) [V abs].
11. **Affect detection from face and voice for children.** It is legally barred for Taxila (Microsoft CoC restriction 12), and
    the strongest-looking 2025 result (Kong et al.) is unreplicated [U].
12. **A voice tutor for young children that has not proven its ASR in the field.** Amira's 2026 SFUSD rollout: children
    shouting, accents failing, usage at ~10% of intended minutes, an avatar seen as creepy [S, press]. This is a
    reminder for `voice/` and the avatar work, not a learning-science finding.

---

## 4. Corrections and clarifications to existing docs

- **C1 (PZ14, personalisation-2026 §2.1).** The Eedi scaled RCT (AEA 18079) intervention ran **2026-04-13 →
  2026-06-21**. The registry was last updated 2026-06-30, with no results. Power for the arm-2 vs arm-3 contrast is
  **58.6% for 0.1 SD** [V]. PZ14's reversal condition ("the Eedi result … shows a learning effect") holds only if
  that contrast is positive. A null must not reclassify memory as F-proven.
- **C2 (LS §3.5; `design/lesson-arc.md` "Blocked first, then mixed").** Split the rule. *Problem types:* no mandatory
  blocked phase once each strategy is taught; interleave less for low prior knowledge and check by tercile (S4).
  *Representations:* blocked → increasingly interleaved for low prior (Rau 2010).
- **C3 (LS §2.4 item 7, "Interest-based personalization: real and well supported").** Downgrade to "motivation:
  well supported; learning: small-to-moderate, mostly from older and quasi-experimental studies; transfer k = 6;
  the one LLM RCT (n = 272) found no learning difference". The 2024 meta is now [V abs]: Lin, Lin, Zhang & Ginns, *EPR*,
  doi 10.1007/s10648-024-09933-7.
- **C4 (PZ7).** Add "self-reported or parent-reported learning style" to the list of attributes that never reach a
  generator.
- **C5 (code, [T]).** `workedExample.fadedVersion` is authored in every kit and loaded by `server/content/kits.js`, but
  never read by the Director. Either S1 uses it or the kit schema drops it. Today it costs authoring time for nothing.
- **C6 (rule "worked example for novices", state.js line 75).** The binary novice test treats pL ≥ 0.5 on *any*
  skill of the topic as non-novice for *all* skills of that topic (`some(...)`) [T]. Under the expertise reversal effect,
  guidance is per skill. S2 makes it per skill.

---

## 5. Measurement backlog this file adds

| id | what | method | n / effort | gates |
|---|---|---|---|---|
| WB-HP1 | F-FADE MRT factor | PZ §3.8 excursion model | inside the 8-12-week pilot | S1 |
| WB-HP2 | first-step probe validity | κ(first-step, first unaided attempt) | 200 logged turns | S2 |
| WB-HP3 | FIRe on/off | comprehension sim, 20 seeds; then DRS non-inferiority | sim: 1 day | S3 |
| WB-HP4 | interleaving by tercile | `y_delay`, `y_transfer` per baseline tercile, interleaved vs blocked review | MRT factor | S4 |
| WB-HP5 | in-session re-retrieval rate (B1-B2) | log rate | free | S5 |
| WB-HP6 | context validator pass rate and human audit | 100 items × 4 bands × 3 languages | ~2 days review | S6 |
| WB-HP7 | corpus audit + seeded-defect recall | eval | 1 day | S7 |
| WB-HP8 | EWM rate baseline | weekly derived metric | free | S8 |
| WB-HP9 | LLM-b vs empirical b, split by misconception tag | Spearman | first 50 attempts per item | S11 |

---

## 6. Sources (accessed 2026-10-03)

**Guidance level, fading, worked examples**
- Tetzlaff, L., Simonsmeier, B., Peters, T., & Brod, G. (2025). A cornerstone of adaptivity: a meta-analysis of the expertise reversal effect. *L&I* 98:102142. https://doi.org/10.1016/j.learninstruc.2025.102142 [S]
- Salden, R. J. C. M., Aleven, V., Schwonke, R., & Renkl, A. (2010). The expertise reversal effect and worked examples in tutored problem solving. *Instr Sci*. https://www.researchgate.net/publication/226748784 [S]
- Kalyuga, S., & Sweller, J. Rapid dynamic assessment of expertise to improve the efficiency of adaptive e-learning. *ETR&D*. https://link.springer.com/article/10.1007/BF02504800 [S]
- Tithi, S. D., Tian, X., Limke, A., Chi, M., & Barnes, T. (2026). Interactive worked examples for learners with varying prior knowledge. https://arxiv.org/abs/2602.16806 [V abs]
- McGinn, K. M., Booth, J. L., & Huyghe, A. (2025). Preparing 4th and 5th graders to learn algebra with worked examples and self-explanation prompts. *JECP*. https://doi.org/10.1016/j.jecp.2025.106348 [V abs]
- Stone, T., et al. (2026). The role of worked examples in supporting early math learning. *J Intell* 14. https://doi.org/10.3390/jintelligence14090192 [V abs]
- He-Yueya, J., Goodman, N., & Brunskill, E. (2024). Evaluating and optimizing educational content with LLM judgments. https://arxiv.org/abs/2403.02795 [V abs]

**Concreteness fading and representations**
- Fyfe, E. R., & McNeil, N. M. Benefits of "concreteness fading" for children with low knowledge of mathematical equivalence. https://cladlab.nd.edu/assets/251363/concreteness_fading.pdf [V]
- One instructional sequence fits all? (2021). *EPR*. https://eric.ed.gov/?id=EJ1310124 [S]
- Rau, M. A., Aleven, V., & Rummel, N. (2010). Blocked versus interleaved practice with multiple representations in an ITS for fractions. https://www.cs.cmu.edu/~marau/RauAlevenRummel2010_ITS.pdf [V]
- Rau, M. A., Aleven, V., & Rummel, N. (2017). Sense-making competencies enhance perceptual fluency, but not vice versa. *Instr Sci* 45:331. https://eric.ed.gov/?id=EJ1142102 [S]

**Retrieval, spacing, interleaving**
- Rodríguez-Gonzalo, S., Arnaez-Telleria, J., & Paz-Alonso, P. M. (2024). Developmental improvements in the ability to benefit from testing. https://doi.org/10.3389/fnbeh.2024.1501866 [V abs]
- Franzoi, L., et al. (2025). Retrieval practice enhances learning in real primary school settings, whether distributed or not. https://doi.org/10.3389/fpsyg.2025.1632206 [V abs]
- Carvalho, P. F., & Godwin, K. E. (2025). Generating predictions vs retrieval practice for primary school children. https://doi.org/10.1037/xap0000523 [V abs]
- Leonard, L. B., et al. (2024). Does expanding retrieval provide additional benefit? *JSLHR*. https://doi.org/10.1044/2024_jslhr-23-00528 [V abs]
- Rohrer, D., Dedrick, R. F., Hartwig, M. K., & Cheung, C.-N. (2020). A randomized controlled trial of interleaved mathematics practice. https://eric.ed.gov/?id=EJ1237752 ; https://ies.ed.gov/use-work/awards/efficacy-study-interleaved-mathematics-practice [V]
- Brunmair, M., & Richter, T. (2019). Similarity matters: a meta-analysis of interleaved learning. https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf [S]
- van der Haar, L., Gray-Lobe, G., Kremer, M., & de Laat, J. (2023). The long-term distributional impacts of a full-year interleaving math program in Nigeria. EdWorkingPaper 23-876. https://edworkingpapers.com/sites/default/files/ai23-876.pdf [V]
- Scheitz, N., et al. (2025). Interleaving subtraction strategies goes solo. https://doi.org/10.31234/osf.io/mqcnp_v2 [V abs]
- Klimovich, M., & Richter, T. (2025). Spelling acquisition through interleaved practice. https://doi.org/10.1186/s41235-025-00680-z [V abs]
- Dong, X., et al. (2025). Interleaving practice in children and young adults. https://doi.org/10.3390/jintelligence13090107 [V abs]
- Hartwig, M. K., & Rohrer, D. (2025). Students' perceptions of effective math learning strategies. https://doi.org/10.3390/bs15081047 [V abs]
- Ingebrigtsen, M., et al. (2025). Teacher-made digital flashcards. https://doi.org/10.31234/osf.io/h2kgx_v2 [V abs]
- Skycak, J. Individualized spaced repetition in hierarchical knowledge structures (FIRe). https://www.justinmath.com/individualized-spaced-repetition-in-hierarchical-knowledge-structures/ [V vendor]
- Math Academy, How our AI works. https://www.mathacademy.com/how-our-ai-works [V vendor]

**Interest and LLM personalisation**
- Lin, L., Lin, X., Zhang, X., & Ginns, P. (2024). The personalized learning by interest effect: a meta-analysis. *EPR*. https://link.springer.com/article/10.1007/s10648-024-09933-7 [V abs]
- Walkington, C., Feng, M., Pruitt-Britton, I., Beauchamp, T., & Lan, A. (2026). Should there be a teacher in-the-loop? https://arxiv.org/abs/2602.15876 [V abs]
- Ikram, F., et al. (2026). A multi-agent approach to validate and refine LLM-generated personalized math problems. https://arxiv.org/html/2604.05160v1 [V]
- Walkington, C., Beauchamp, T., Lan, A., & Pruitt-Britton, I. (2025). The efficiency of teacher-driven context personalization with LLMs. AIED. https://doi.org/10.1007/978-3-031-98459-4_7 [S, metadata]
- Leong, J., et al. (2024). Generative AI-enabled context personalization for vocabulary learning improves learning motivation. CHI. https://doi.org/10.1145/3613904.3642393 [V abs]
- Do, T. D., et al. (2024). PAIGE: personalized AI-generated educational podcasts. https://arxiv.org/abs/2409.04645 [V abs]
- Zheng, Y., et al. (2025). Personalizing educational responses with LLMs: knowledge, interests, and preferences. https://doi.org/10.1145/3769694.3771123 [V abs]
- Who brought Easter eggs to Eid? Auditing cultural translation of math word problems (2026). https://arxiv.org/abs/2606.11009 [V abs]
- Bridging the culture gap: socio-cultural localization of math word problems (2025). https://arxiv.org/abs/2508.14913 [V abs]
- The Easy Trap: why LLMs underestimate misconception-driven difficulty (2026). https://arxiv.org/abs/2607.26067 [V abs]
- Sirnoorkar, A., et al. (2025). Student and AI generated personalized analogies in introductory physics. https://arxiv.org/html/2511.04290 [V]
- Interaction effects between learner characteristics and dialogue format in TTS dialogue-based lessons (2026). https://arxiv.org/abs/2608.20822 [V abs]

**Bandits, RL, HTE**
- Clément, B., Sauzéon, H., Roy, D., & Oudeyer, P.-Y. (2024). Combining machine learning and learner choice. https://arxiv.org/abs/2402.01669 [V abs]
- MC-CPO: mastery-conditioned constrained policy optimization (2026). https://arxiv.org/abs/2604.04251 [V abs]
- Song, H., et al. (2025). Adaptive experiments under data sparse settings (WAPTS). https://arxiv.org/abs/2501.03999 [V abs]
- Lin, Y.-S. W., Ham, D. W., & Bojinov, I. (2026). Benefits and costs of adaptive sampling. https://arxiv.org/abs/2604.24652 [V abs]
- Stochasticity is not the hard part: instructional sequencing over prerequisite DAGs (2026). https://arxiv.org/abs/2608.05455 [V abs]
- Access timing as scaffolding: an RL approach to GenAI in education (2026). https://arxiv.org/abs/2605.15850 [V abs]
- A causal framework for estimating heterogeneous effects of on-demand tutoring (2026). https://arxiv.org/abs/2602.19296 [V abs]
- Schmucker, R., et al. (2025). Learning to optimize feedback for one million students. https://arxiv.org/html/2508.00270 [V, via PZ]
- Doroudi, S., Aleven, V., & Brunskill, E. (2019). Where's the reward? https://cpb-us-e2.wpmucdn.com/faculty.sites.uci.edu/dist/f/847/files/2019/11/IJAIED-RL-Review-Author-Version.pdf [S]
- Eedi scaled RCT registry, AEA 18079. https://www.socialscienceregistry.org/trials/18079 [V]

**Affect and products**
- Kong, K., et al. (2025). Real-time cognitive and emotional state tracking in ITS. *J Big Data*. https://doi.org/10.1186/s40537-025-01333-0 [V abs]
- Feng, M.-Y., et al. (2025). A personalized tutoring platform that responds to affect. AIED. https://doi.org/10.1007/978-3-031-99264-3_15 [S, metadata only]
- Amira, Evidence for ESSA. https://www.evidenceforessa.org/program/amira/ [S]; SF Standard, 2026-09-25. https://sfstandard.com/pacific-standard-time/2026/09/25/pst-sf-amira-ai-in-schools/ [S, press]
- Duolingo Birdbrain (IEEE Spectrum). https://spectrum.ieee.org/duolingo [S]
- Squirrel AI (Springer chapter). https://link.springer.com/chapter/10.1007/978-981-97-8144-7_7 [S]
- Adaptiv'Math / ZPDES evaluation registration. https://osf.io/v2gya/overview [S]
