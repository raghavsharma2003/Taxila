# Products-live: how shipping tutors and research games detect understanding and re-teach (2025-2026)

Research sweep for `comprehension-engine-program` (context/decisions.md). Date: 2026-10-02.
Scope: live products and open-source/research systems that assess covertly or embed assessment in learning, and
how they re-teach. Feeds `server/comprehension/**`, the probe catalogue (learning-science.md §7, P1-P24), Forge game
telemetry (FACTORY.md §4.9) and STUDENT-SIM.

**Evidence tags.** [V] = primary source (paper/abstract/official post) read in this sweep. [S] = secondary report,
search snippet, or abstract-only of a paper whose body was not read. [U] = vendor marketing / self-report /
not independently verified. Effect sizes are as reported by the source; none are Taxila measurements.

---

## 0. The answer on one screen

1. **The binding constraint in shipped AI tutors is not detection, it is engagement with the tutor.** The largest
   independent RCT of Khanmigo (18 Tennessee middle schools, 2 years) found +0.06-0.08 SD/yr, no better than Khan
   practice without AI, because the median student messaged the tutor on 1/3 of practice days and in only 17% of
   sessions where they made a mistake; messages were "mostly bare answers or clicks on suggested prompts" [V]. An
   opt-in side-chat cannot observe understanding it is never shown. **Taxila's tutor-led voice design (the teacher
   initiates every probe) is the correct structural answer; a "help" button tutor would inherit this failure.**
2. **The most validated covert-assessment mechanism in production is the misconception-mapped choice** (Eedi,
   Mindspark): every wrong option is a named misconception, so one wrong pick is diagnostic of *which* model the
   child holds [V/S]. But a correct pick can hide flawed reasoning: on Eedi data the best frontier LLM caught only
   84% of "correct answer, wrong reasoning" cases with ~4 false alarms per true detection, and 71% of misses sat in
   two item types where wrong reasoning coincidentally yields the right number [V]. → P2 ("why?" after correct)
   must be *targeted* at items whose kit marks them as coincidence-prone, and its detector must only trigger a
   verifying probe, never write mastery (fusion rule 2 already says this; the base-rate number is now 4:1).
3. **Transfer to the next topic is the outcome that separates good tutors.** Eedi x LearnLM RCT (n = 165, UK):
   AI-drafted, human-supervised tutoring matched human-only tutors on fixing the immediate mistake (93.0 vs 91.2%)
   and resolving the misconception (95.4 vs 94.9%), but students were **+5.5 pp more likely to solve novel problems
   on subsequent topics** (66.2 vs 60.7%) [V]. Taxila's "check 2-3 topics later" probe (P3/P10 placed downstream)
   is the right ground truth; this is the only shipped number for it.
4. **Game telemetry can be a valid assessment if built evidence-centred.** Physics Playground stealth assessment
   (Bayes nets over in-game actions) correlated with external physics tests [V]; Zoombinis data-mined detectors of
   *implicit* strategy correlated with external CT measures while grade/gender did not [S]. **But adaptive level
   sequencing in Physics Playground did not beat linear or free choice (n = 263)** [V], and the most effective of
   eight in-game supports was an explanatory animation, i.e. re-teaching content beat adaptivity. → Forge games
   are an evidence source; do not expect the adaptation loop inside the game to carry the learning.
5. **Unguarded AI hurts learning measurably.** Bastani et al. PNAS 2025: GPT-4 "Base" +48% on practice but **-17%
   on the unaided exam**; a guarded "Tutor" +127% on practice and erased the harm, with no exam gain [V]. Practice
   performance with help is not evidence of understanding — only unaided, delayed or transferred performance is.
   This is already Taxila's assisted-vs-unaided split (STUDENT-SIM §4.4a); this paper is the field number for it.
6. **What moved the needle in Khanmigo's 15M-thread A/B programme was context, not cleverness**: feeding the tutor
   the child's recent attempt history (+3.4% next-item correctness), surfacing unmastered prerequisites (+2.7%),
   and readable plain-text 24 h history instead of JSON (+5.1% cognitive engagement); example problem types and
   "next content links" did nothing [V]. Total +6.1%. → the CHILD brief (LEARNER-MODEL §9.1) should carry recent
   attempts and the specific weak prerequisite as plain key=value text; this is a cheap, proven lever.

---

## 1. Product-by-product

| product / system | what it observes | how it infers understanding | how it re-teaches | evidence | tag |
|---|---|---|---|---|---|
| **Khanmigo** (Khan Academy) | chat turns + exercise attempts | Socratic coaching; mastery comes from Khan's exercise engine, not the chat | prerequisite surfacing; hints | 2-yr cluster RCT, 18 schools: +0.06-0.08 SD/yr, ≈ Khan w/o AI; use was rare and shallow (Oreopoulos & Low, Aug 2026) | [V] |
| Khanmigo A/B programme | ~15M threads, ~20 tests (Oct 2025-Apr 2026) | next-item correctness as outcome | history + prereqs in prompt | +6.1% combined; "narrow focus on student's work" halved answer give-aways; examples / links / JSON = null (Khan blog, 6 May 2026) | [V] |
| Khanmigo (internal observational) | 340k users | — | — | 22% vs 9% proficiency gain for ≥30 min/wk users: **selection-confounded**, ignore for design | [U] |
| **Eedi** (+ Google LearnLM) | 4-option diagnostic questions, each distractor = named misconception; free-text explanations | distractor → misconception identity; explanations classified (Kaggle MAP, 52k explanations, MAP@3) | AI-drafted Socratic dialogue, human tutor approves (76-82% sent with no/minimal edit) | RCT n = 165: parity on fix/resolve, **+5.5 pp next-topic novel problems**; 0.1% factual errors (Dec 2025); 2nd RCT and US RCT with Accelerate launched | [V] |
| Eedi "Correct Answer Trap" | correct answers + reasoning | LLM vs T5 classifiers | — | 84% vs 57% detection; ~4 false alarms per hit; misses concentrated in coincidence-prone item types (Imran & Bulathwela, Apr 2026) | [V] |
| **Google Learn Your Way** (LearnLM) | textbook → personalised multi-format (mind map, narrated slides, audio lesson, quizzes) with interest-based re-framing | embedded quizzes per section | regenerate in another representation | RCT n = 60 (ages 15-18): +9% immediate, **+11% 3-5 days later** vs PDF reader (Sep 2025) | [S] |
| Gemini Guided Learning / LearnLM arena | multi-turn dialogue | asks questions, "tests to check understanding" after explaining | — | expert arena: failure mode named was "gave information too quickly without checking understanding" (May 2025) | [S] |
| **Synthesis Tutor** (ages 5-11) | voice + on-screen manipulatives | conversational: how the child reasons, not only the answer | same idea via blocks / number line / word problem | no peer-reviewed efficacy found; "99.99%" claims are marketing | [U] |
| **Alpha School** (2-hour learning) | adaptive apps (IXL etc.) + AI layers; mastery gates | test-out / mastery thresholds | app re-routing; human guides for motivation | claims 2x pace, top 1-2% MAP; Texas/PA regulators sceptical; Arizona charter 10% math proficient yr 1 | [U]/[S] |
| **Squirrel AI** | ~10k+ "nano" knowledge points per subject | probabilistic links across a fine knowledge graph; fast diagnosis of prerequisite gaps | route to the missing nano-node | one SRI-linked quasi-RCT, n = 155 8th graders; little independent replication | [S] |
| **Duolingo Birdbrain + HLR** | every exercise | σ(ability − difficulty) IRT-style online update of both learner and item; HLR half-life per word for spacing | schedule review when predicted recall ≈ 50% | HLR is public (Settles & Meeder 2016); Birdbrain internal | [S] |
| Duolingo Video Call (Lily) | voice conversation | adapts speed / simplicity live; memory of user facts reused later | — | product feature, no outcome data | [U] |
| **Speak** | spoken attempts | error log | mistakes + history → personalised review sets | no independent efficacy found | [U] |
| **ASSISTments** | homework attempts, hint use, attempt counts | correctness-only + hint ladder; teacher reports | immediate feedback, scaffold sub-questions | RCT Maine (43 schools) +0.18 SD; NC replication (9,703 students) sustained effect one year after | [S] |
| **Mindspark** (Ei, India) | adaptive items with misconception-mapped wrong answers | misconception detection from wrong answers | **cognitive-dissonance remedial modules** (confront the misconception, then explain) | AER 2019 Delhi lottery RCT: +0.36 SD math, +0.22 SD Hindi in 4.5 months; Rajasthan scale RCT (≈20x): +0.22 / +0.20 SD after 18 months; gains ∝ time on platform (NBER w34205, 2025) | [V]/[S] |
| **DreamBox** | every manipulative move, strategy, sequence (~50k points/hr claimed) | infers *strategy* (e.g., counting-on vs make-ten) from manipulative use, not only answers | within-lesson branch to a different model | impact claim from usage-dosage correlation (9.9 MAP percentile) — observational | [U]/[S] |
| **Zearn** | "Tower of Power" end-of-lesson check, scaffolding decreases stage by stage | pass required to finish; repeated failure alerts teacher | in-the-moment support, then teacher | RAND RCT, 64 schools, 10k+: positive (median → 53-54th pct) but **not significant** (Jun 2025) | [V] |
| **Prodigy** | game battles = math items | correctness | adaptive item selection | only correlational / vendor studies | [U] |
| **ST Math** (visual puzzles, no words) | puzzle attempts | correctness on spatial-temporal puzzles | animated feedback showing *why* | quasi-experiments 0.17-0.42 SD; **RCT (52 schools) 0.05-0.10, n.s.** | [S] |
| **Brilliant** (Koji tutor) | interactive problem steps | tracks mastered/missed, backfills fundamentals | re-plan path | no independent efficacy | [U] |
| **CK-12 Flexi** | chat + adaptive practice quizzes | "assesses through conversation" + adaptive quiz | study plan | no efficacy data | [U] |
| **OATutor** (open source, Berkeley) | step-level attempts, hints | BKT mastery | BKT-driven problem selection; ChatGPT-generated hints matched human-authored hints on learning gains | MIT-licensed, React; useful reference for BKT + A/B harness | [S] |
| **Betty's Brain** | child-built causal map that "teaches" an agent | agent answers quiz questions from the child's map → errors expose the child's model | metacognitive prompts from a mentor agent | learning-by-teaching transfer (oxygen→nitrogen cycle) in multiple studies | [S] |
| **Tutor CoPilot** (Stanford) | live tutor chats | — | AI suggests expert-like moves to human tutors | RCT 900 tutors / 1,800 students: +4 pp mastery, +9 pp for weaker tutors; more probing questions, less generic praise | [S] |
| **Physics Playground** (Shute) | drawing/manipulating physics objects | evidence-centred design, Bayes nets over actions | in-game supports (animations best of 8) | stealth estimates valid vs external test; adaptive sequencing = n.s. (n = 263, 2021) | [V] |
| **Zoombinis** (TERC/EdGE) | puzzle play logs | data-mined detectors of implicit CT strategies | teacher "bridge" activities to make implicit explicit | detectors correlate with external CT; grade/gender not | [S] |
| **Mission HydroSci** | 3D game, argumentation tasks | stealth-assessment pipeline from telemetry | narrative tasks | RCT: equal content learning, **higher argumentation**; affect slightly negative in both arms | [S] |
| Kestin et al. (Harvard) | structured AI tutor sessions | — | research-designed scaffolding, worked steps | RCT crossover n = 194 undergrads: gains > 2x active learning, 49 vs 60 min (Sci Reports, Jun 2025) | [S] |
| MagicSchool | teacher-facing generators | not a learner-model product | — | out of scope for comprehension | [U] |

---

## 2. Mechanisms that work in the field, mapped to Taxila

**M1 Misconception-keyed options, spoken (Eedi/Mindspark → P7).** Each wrong option of a spoken choice maps to one
kit misconception id. Children 6-9 get two options plus a picture. One pick updates misconception identity strongly
and mastery weakly (guess rate 33-50%). Implement as kit data, not model judgement (inherited law: classify against
verified keys).

**M2 Targeted "why?" on coincidence-prone correct answers (Correct-Answer-Trap → P2).** Kits flag items where a
known wrong procedure yields the right answer (e.g., 0.5 + 0.5, 2×2 vs 2+2). On those items the "why?" fires at
100%; elsewhere sample at the §7.2 rate. Detector output only *schedules* a verifying contrasting-case or
near-transfer probe (P8/P3). Expect ~4 false alarms per hit at Eedi prevalence.

**M3 Downstream transfer probe as the ground-truth outcome (Eedi x LearnLM).** When topic B depends on topic A, the
first problems of B are tagged as transfer evidence for A. This is invisible to the child (it is just the next
lesson) and is the outcome the only RCT that measured it found tutors differ on. Use it as the calibration target
for every other probe's likelihood ratio alongside P10.

**M4 Cognitive-dissonance re-teach (Mindspark → P5 + re-teach).** When a misconception is confirmed, the re-teach
starts with a predict-then-reveal that the misconception gets wrong, then the explanation. This is the only re-teach
recipe in the list with large Indian RCT evidence behind the whole system (not isolated). Pair with representation
switch: the representation chosen is the one in this child's history that last preceded a success (LEARNER-MODEL
§6.5), defaulting to the kit's concrete → pictorial → abstract ladder.

**M5 Strategy inference from manipulatives (DreamBox, Zoombinis → Forge telemetry).** The answer is not the signal;
the sequence is. Forge kits should emit *strategy events* (e.g., `count_all` vs `count_on` vs `make_ten`;
`denominator_added`) defined per engine with a detector rule, not just `correct/incorrect`. Data-mined detectors
(Zoombinis) need labelled play; start with hand-written rules from kit misconceptions, log the raw sequences for
later mining.

**M6 Evidence-centred design for every game (Physics Playground).** Each Forge game declares its competency model,
evidence rules and task model up front; scoring is a Bayes-net/LR update into the same per-concept belief as
dialogue probes. Validate per game against delayed probes before giving it full weight (FACTORY's 0.75 weight
until agreement is shown is consistent with this).

**M7 Don't rely on in-game adaptivity for learning (Physics Playground null).** Spend the game budget on the
explanatory support (animation that shows *why*) and on assessment validity; keep level sequencing simple.

**M8 Learning-by-teaching protégé (Betty's Brain → P1).** The child's explanation becomes the protégé's "brain";
the protégé then answers a question using only what the child said, and its mistake reveals the gap in the child's
model to both of them. This is assessment the child experiences as play, and it is the best covert design for
ages 10-15; for 6-9 keep it short and the protégé care-receiving.

**M9 Feed the tutor plain-text recent history and the weak prerequisite (Khanmigo A/B).** Recent N attempts with
correctness and hint use, plus the single most likely unmastered prerequisite, as key=value text in the CHILD brief.
Measured +3.4% and +2.7% next-item correctness at scale; JSON blobs and example banks were null.

**M10 Narrow the tutor's view to the child's work (Khanmigo A/B).** Not showing the model the remaining solution
steps halved answer give-aways. For Taxila: the realtime teacher sees the current step and the kit key's verdict,
not the full worked solution, unless in an explicit worked-example move.

**M11 Separate assisted from unaided performance (Bastani PNAS).** Mastery may only be written from unaided items
(or with an assistance-discounted LR). Assisted success counts toward "learning in progress", never "understood".

**M12 Spacing by predicted forgetting (Duolingo HLR).** Delayed probe (P10) timing per concept from a half-life
model (RESEARCH-PROGRAM M3 HLR-C v2 already specifies this); schedule the 2-3-topics-later check when predicted
recall falls toward the target, not at a fixed gap.

**M13 Personal memory reused in conversation (Duolingo Lily, Learn Your Way interest re-framing).** Examples and
transfer contexts drawn from the child's stated interests (cricket, cooking, a sibling). Learn Your Way's
interest-personalised content had the only measured delayed-retention gain (+11%) among these products, though
n = 60 and teenage.

**M14 Engagement is the first-order metric (Khanmigo RCT, SCALE review, Mindspark dosage).** Mindspark's scale RCT
found gains proportional to time on platform; Khanmigo's failed on usage; SCALE's literacy RCTs found nearly half
the control never used the platform. Comprehension detection is worthless without the child talking; the Conductor
and parent loop own this metric.

---

## 3. What failed, and why it matters here

| failure | where | lesson for Taxila |
|---|---|---|
| Opt-in AI tutor rarely used; messages were bare answers | Khanmigo 2-yr RCT [V] | the teacher must lead; never rely on the child asking for help |
| Unguarded GPT improved practice, hurt the exam (-17%) | Bastani PNAS 2025 [V] | assisted success ≠ understanding; no answer giving |
| Adaptive level sequencing ≈ linear | Physics Playground 2021 [V] | invest in explanation and evidence, not game adaptivity |
| Strong quasi-experimental effects shrank to n.s. under RCT | ST Math, Zearn [S]/[V] | don't trust our own dosage correlations; pre-register |
| "Correct answer" hides wrong reasoning, LLM detectors ~4:1 false alarms | Eedi CAT [V] | detectors trigger probes, never decide |
| LLM student simulators flip answers under *any* feedback (near-zero selective flip) | arXiv 2605.12748 [V] | STUDENT-SIM must keep code-defined misconception truth; never let an LLM role-play the student's beliefs unchecked |
| Example banks and next-content links in the prompt did nothing | Khanmigo A/B [V] | don't bloat the brief |
| Bold acceleration claims without independent tests | Alpha School, Synthesis [U] | don't benchmark ourselves against marketing |

---

## 4. Gaps nobody has closed (where Taxila can lead)

- **No shipped product uses voice/prosody as a comprehension signal.** No 2025 paper found on detecting confusion
  from children's speech in tutoring; work is on reading miscues and fluency (Whisper miscue prompting) [S]. This
  confirms `voice-features-longitudinal`: features as tie-breakers with a small cap, WCPM as the one robust use.
- **No product measures "understood" via delayed transfer as a live per-child belief** — Eedi measured it as a
  trial outcome only. Taxila making downstream-topic transfer a first-class live signal is novel.
- **No conversational product publishes its comprehension detector's accuracy** (Synthesis, Flexi, Khanmigo, Koji).
  Taxila's simulator gate + delayed-probe calibration would be the first public number.
- **Hinglish/Hindi**: Mindspark is the only system with Hindi-medium RCT evidence, and it is MCQ-based. Spoken
  bilingual covert probing is untested anywhere.

---

## Sources

- Oreopoulos & Low, "One Click Away: AI Tutoring with Khanmigo in a Two-Year School Experiment", EdWorkingPaper 26-1551, Aug 2026 — https://edworkingpapers.com/sites/default/files/ai26-1551.pdf
- Khan Academy blog, "How Khan Academy Is Building a Better AI Tutor", 6 May 2026 — https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/
- LearnLM Team & Eedi, "AI tutoring can safely and effectively support students: An exploratory RCT in UK classrooms", arXiv 2512.23633, Dec 2025 — https://arxiv.org/abs/2512.23633
- Eedi news, second RCT / Accelerate US RCT — https://www.eedi.com/news/just-launched---our-second-ai-tutor-rct ; https://www.eedi.com/news/eedi-labs-selected-for-accelerates-national-program-to-scale-evidence-based-ai-math-tutoring-in-us-middle-schools
- Imran & Bulathwela, "Catching The Correct Answer Trap", arXiv 2605.23925, Apr 2026 — https://arxiv.org/abs/2605.23925
- Kaggle MAP competition / Eedi — https://www.kaggle.com/competitions/map-charting-student-math-misunderstandings ; https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions ; https://aclanthology.org/2025.aimecon-wip.3.pdf
- LearnLM Team, "Towards an AI-Augmented Textbook", arXiv 2509.13348 — https://arxiv.org/pdf/2509.13348
- LearnLM arena, arXiv 2505.24477 — https://arxiv.org/pdf/2505.24477 ; Guided Learning — https://blog.google/products-and-platforms/products/gemini/guided-learning-google-gemini/
- Synthesis Tutor — https://www.synthesis.com/tutor ; review https://opened.co/tools/synthesis
- Alpha School — https://en.wikipedia.org/wiki/Alpha_School ; https://danmeyer.substack.com/p/does-alpha-school-work-for-regular
- Squirrel AI — https://en.wikipedia.org/wiki/Squirrel_AI ; https://www.technologyreview.com/2019/08/02/131198/china-squirrel-has-started-a-grand-experiment-in-ai-education-it-could-reshape-how-the/
- Duolingo HLR / Birdbrain / Video Call — https://www.researchgate.net/publication/306093511_A_Trainable_Spaced_Repetition_Model_for_Language_Learning ; https://blog.duolingo.com/ai-and-video-call/
- Speak — https://www.speak.com/
- ASSISTments — https://www.sri.com/publication/education-learning-pubs/digital-learning-pubs/how-big-is-that-reporting-the-effect-size-and-cost-of-assistments-in-the-maine-homework-efficacy-study/ ; https://www.arnoldventures.org/stories/a-replication-randomized-controlled-trial-rct-of-assistments-an-online-study-tool-to-improve-student-math-outcomes-in-seventh-grade
- Mindspark — Muralidharan, Singh & Ganimian, AER 2019 https://econweb.ucsd.edu/~kamurali/papers/Working%20Papers/Disrupting%20Education%20(Current%20WP).pdf ; NBER w34205 (2025) https://www.nber.org/papers/w34205 ; https://ei.study/personalized-and-adaptive-learning-with-mindspark/
- DreamBox — https://dreamboxlearning.zendesk.com/hc/en-us/articles/27281843188243-How-Does-DreamBox-Math-Work ; https://files.eric.ed.gov/fulltext/ED544506.pdf
- Zearn — Pane et al., RAND, EdWorkingPaper 25-1211, Jun 2025 https://edworkingpapers.com/sites/default/files/ai25-1211.pdf ; https://help.zearn.org/hc/en-us/articles/115007900828-Lesson-level-assessments
- Prodigy — https://www.prodigygame.com/main-en/research ; https://thelearningstandard.org/news/prodigy-wins-edtech-award-but-does-it-actually-improve-math
- ST Math — https://www.evidenceforessa.org/program/st-math-spatial-temporal-math/ ; https://learninglab.uchicago.edu/Publications_files/Rutherford%20et%20al_A%20Randomized%20Trial...Spatial-Temporal%20Math.pdf
- Brilliant — https://brilliant.org/ai/
- CK-12 Flexi — https://info.ck12.org/flexi-overview
- OATutor — https://github.com/CAHLR/OATutor ; https://pmc.ncbi.nlm.nih.gov/articles/PMC11125466/
- Betty's Brain — https://link.springer.com/article/10.1007/s40593-015-0057-9
- Tutor CoPilot — https://files.eric.ed.gov/fulltext/ED661562.pdf
- Physics Playground — Shute et al. 2021 https://eric.ed.gov/?id=EJ1281101 ; http://www.johnnietfeld.com/uploads/2/2/6/0/22606800/shute_rahimi_2021.pdf
- Zoombinis — Rowe et al. 2021 https://learninganalytics.upenn.edu/ryanbaker/CHB-D-19-03159R1.pdf
- Mission HydroSci — https://jedm.educationaldatamining.org/index.php/JEDM/article/view/761 ; https://www.ed.gov/sites/ed/files/2021/12/S411B210031_Narrative.pdf
- Bastani et al., PNAS 2025 — https://www.pnas.org/doi/10.1073/pnas.2422633122
- Kestin et al., Sci Reports 2025 — https://www.semanticscholar.org/paper/AI-tutoring-outperforms-in-class-active-learning:-a-Kestin-Miller/23c1bcb0c0450d79abbe0a1c2a9b4a3b60b6fe03
- Stanford SCALE review 2026 — https://nssa.stanford.edu/sites/default/files/ai26-1451.pdf ; https://www.edtechinnovationhub.com/news/stanford-report-finds-limited-evidence-behind-ai-impact-in-k-12-classrooms
- LLM student-simulator misconception faithfulness, arXiv 2605.12748 — https://arxiv.org/abs/2605.12748
- Contractor & Reyes, arXiv 2607.08849 (augmentation vs automation users) — https://arxiv.org/abs/2607.08849
- Child speech miscue detection — https://arxiv.org/pdf/2505.23627
