# Learning science for Taxila: evidence review and design rules

**Date:** 2026-10-02
**Scope:** An AI voice teacher for Indian K-9 students (ages ~6-15), voice-first on low-end Android, Hindi/English/Hinglish.
**Question:** What does the evidence say about (1) finding out whether a child understood something without testing them, (2) "learning styles", (3) what works in AI tutoring, (4) the child-AI relationship and the law around it, and (5) the Indian context? What should Taxila do as a result?

---

## 0. How to read this document

### Evidence tags

Every non-obvious claim carries a tag:

| tag | meaning |
|---|---|
| **[V]** | Checked this session against the primary source: abstract, full text, trial registry, or statute/rules text page. |
| **[S]** | Checked only against a secondary source: news, law-firm commentary, vendor page, or search-engine summary. Directionally reliable; check exact numbers before quoting them outside the team. |
| **[M]** | From prior knowledge of the literature and **not re-checked this session**. Probably right, but check it before it becomes a `context/` entry or appears in marketing. |

Confidence on design rules (section 6): **High** = several converging, well-designed studies, ideally including RCTs in school-age populations. **Medium** = consistent evidence with caveats (adult samples, lab settings, small n, or extrapolation to voice). **Low** = plausible inference, little direct evidence; treat it as a hypothesis to test.

### Biggest caveats up front

1. **Almost no rigorous evidence covers *voice-first* AI tutoring for children aged 6-15.** Most LLM-tutor RCTs are text-based, involve teenagers or adults, run for 1-12 weeks, and measure outcomes soon after. Section 3 lists them. Everything about voice in this document is extrapolated from adjacent research.
2. **Effects shrink at scale and on independent tests.** Tutoring meta-analyses lose 45-60% of their effect when restricted to large programs with standardized outcomes (Kraft et al.) [S]. Plan for the smaller number.
3. **Indian children's speech is a measurement problem before it is a pedagogy problem.** Speech recognition (ASR) error on child speech, and more so on code-switched Hinglish, contaminates every "invisible" signal. See section 1.10.
4. **The "learning profile" may conflict with India's DPDP Act section 9(3)**, which bans "tracking or behavioural monitoring" of children. The exemption covers "educational institutions", and it is unclear whether a direct-to-consumer app counts. This is a **legal question that needs counsel before launch**, not a research question. See section 4.3.

### Method

About 90 web searches and roughly 40 primary-source fetches: Europe PMC full text and abstracts, arXiv abstracts, EdWorkingPapers PDFs, the AEA RCT registry, and DPDP Rules text pages. The Semantic Scholar and OpenAlex APIs were rate-limited from this environment and were not used. Several publisher pages (PNAS, Nature, Springer, SAGE) blocked fetching, so where an abstract could not be reached, claims carry [S].

---

## Executive summary (for people who read only this)

1. **"Do you understand?" is worthless as evidence.** Students say yes even when their understanding is vague or wrong, and the better students are the ones who say no (Graesser & Person 1994) [V]. Children aged 6-12 are systematically overconfident [S]. Everything Taxila learns about understanding must come from what the child *produces*: explanations, predictions, transfer answers, error catches, and delayed recall.
2. **The strongest invisible probes:** explain-it-to-someone (with teaching expectancy set beforehand), a "why?" after a correct answer, near-transfer variants, predict-before-reveal, and re-asking in a later session (delayed retrieval). Speech latency and disfluency are real but weak signals, especially in children, and ASR and turn-detection noise confound them. Use them only as tie-breakers.
3. **Learning styles, as the owner means them** (visual / rhyme / song / game "types"): matching instruction to a self-reported style does not reliably improve learning. Pashler et al. 2008 [V]; Rogowsky et al. 2015 and 2020 (including 5th graders) [S]; Clinton-Lisell & Litzinger 2024 meta-analysis: only 26% of outcome measures showed the required crossover [V]; Hattie & O'Leary 2025: matching studies d = 0.04 [S]. Preference predicts how much children *think* they learned, not how much they *did* learn (Knoll et al. 2017) [S].
4. **The feature survives as a measured "learning profile"**: per child, per topic type, which *format* produced better **delayed** recall and transfer, plus engagement and stated preference, learned by careful experimentation. The robust individual difference to adapt to is **prior knowledge**. In the expertise reversal meta-analysis, novices gain from more guidance (d = 0.51) and advanced learners are harmed by it (d = -0.43) (Tetzlaff et al. 2025) [S]. Interest-based context personalization also works (retention g = 0.48) [S].
5. **What works in LLM tutoring is structure, not the model.** Kestin et al. (Harvard) gained 0.73-1.3 SD on an *immediate* post-test with a tutor that had pre-written solutions and platform-enforced step order, after finding that "a system prompt could not reliably provide enough structure" [V]. In Bastani et al., unguarded GPT-4 raised practice scores 48% but then cut unaided exam scores 17%; the guarded tutor largely avoided the harm [V].
6. **The binding constraint at scale is engagement and initiative.** Khanmigo's two-year RCT in 18 middle schools produced 0.06-0.08 SD per year, because students rarely talked to it: only 17% of sessions containing a mistake included a message [V]. Taxila's teacher must *drive* the dialogue.
7. **Voice is not a learning advantage in itself.** In the only within-student voice-vs-text RCT found (adults), learning was equal, interaction doubled, students preferred voice, and voice cost 2.8x more [V]. For 6-9-year-olds who cannot yet read or type fluently, voice is a requirement, not an option. Spoken explanations are *transient*, so long monologues overload working memory: keep spoken segments short and pair them with on-screen visuals (Leahy & Sweller 2011) [S].
8. **Relational risk is real and now regulated.** Common Sense Media rates social AI companions an "unacceptable risk" for under-18s [S]. The FTC opened a 6(b) inquiry in September 2025 [S]. California SB 243 requires AI disclosure, break reminders for minors, and crisis protocols [S]. UNICEF's AI-and-children guidance v3 (2025) now covers AI companions [S]. Design Taxila as a *teacher with warmth*, not a friend: no claims of feelings, no exclusivity, nudges toward people, and full parent visibility.
9. **India:** most children are behind grade level. ASER 2024 found 23.4% of government-school Std III children read a Std II text [S]. In Mindspark's Delhi study, the average Grade 6 student was about 2.5 grade levels behind in maths, and a single grade spanned 5-6 levels [S]. Teaching at the Right Level (placing by level, not grade) and adaptive software (Mindspark: +0.37 SD maths in 4.5 months [S]) have the best Indian evidence. Taxila should **place by diagnosed level, not by class**.
10. **India's DPDP Rules were notified 13 Nov 2025.** Verifiable parental consent (Rule 10) applies from 13 May 2027 [V]. The section 9(3) ban on behavioural monitoring of children carries penalties up to ₹200 crore [S]. Get a legal opinion on the learning profile before building it.

---

## 1. Covert comprehension detection

### 1.1 The core problem: the child's own report is invalid evidence

- **The comprehension-gauging question fails.** In naturalistic tutoring (college research methods; 7th-grade algebra), students answered "Do you understand?" with "yes" most of the time even when their understanding was "vague, incomplete, or incorrect". The students who answered "no" tended to be the *better* students, who monitor themselves more accurately (Person, Graesser, Magliano & Kreuz 1994; Graesser & Person 1994, *AERJ* 31:104-137) [V]. The question harms twice: it yields false positives and wrongly reassures the tutor.
- **Illusion of explanatory depth.** People, children included, rate their understanding higher *before* trying to explain something than *after*. Attempting an explanation exposes the gaps (Rozenblit & Keil 2002 [M]; Mills & Keil 2004, *J Exp Child Psychol*) [S]. Asking a child to explain is therefore both a probe *and* a correction to their own over-rating.
- **Children are overconfident, and calibration develops slowly.** Young children's monitoring is "best characterized by overconfidence". Between about 8 and 11, children get better at recognising their wrong answers, and confidence reaches near-adult accuracy around age 12 [S, review-level]. A 7-8-year-old sample stayed inaccurate even with feedback (*Z. Entwicklungspsychol.*, title only) [S].
- **Fluency feels like learning.** Students prefer massed over spaced study (72% in Kornell & Bjork 2008) and passive lectures over active classes (Deslauriers et al. 2019, *PNAS*), and believe they learned more from the worse method [S]. Students who learned in their *preferred* style gave higher immediate judgments of learning but did not recall more (Knoll et al. 2017) [S].

**Implication.** Taxila needs evidence models, not self-report. This is exactly the idea of **stealth assessment** (section 1.4): design the activity so that evidence of understanding falls out of it.

### 1.2 What expert human tutors do, and how good they actually are

- **The five-step tutoring frame** (Graesser, Person & Magliano 1995) [M]: (1) the tutor asks a question, (2) the student answers, (3) the tutor gives short feedback, (4) tutor and student collaboratively improve the answer, (5) the tutor checks comprehension, usually badly, with "Do you understand?". Step 4 is where diagnosis actually happens: the student's *elaborations* reveal what they know.
- **AutoTutor formalised step 4** as *Expectation-Misconception Tailored* (EMT) dialogue. Each question stores a set of expected good-answer components and a set of known misconceptions. The tutor moves through **pump** ("what else?"), **hint**, **prompt** (a fill-in-the-blank cue), and **assertion** (telling), and scores student turns by semantic match to expectations and misconceptions. Reported gains average about 0.8 SD across studies (range 0.6-2.0), or about 0.5 SD against textbook-reading controls, depending heavily on test type [S]. This is the closest validated template for Taxila's covert diagnosis.
- **Prompting can replace explaining.** In Chi et al. 2001 (*Cognitive Science* 25:471-533), tutors were told to stop explaining and only prompt. Students learned just as well, and became more constructive [S].
- **Human tutors are not good diagnosticians.** Chi, Siler & Jeong (2004, *Cognition and Instruction* 22:363-387) found tutors fairly accurate about what students knew *correctly* but poor at detecting students' *misconceptions* [M: from memory of the paper; the search could only confirm the citation]. A related paper's title is "Expertise amiss: interactivity fosters learning but expert tutors are less interactive than novice tutors" (*Instructional Science* 2015) [S, title only]. **An AI tutor can beat the human baseline here**, because it can carry an explicit misconception library and hold every probe to the same standard.
- **Feedback style is contested.** Lepper's studies of expert tutors (the INSPIRE model) describe *indirect* feedback: questions that imply an error so the student catches it [S]. A finer-grained analysis of 10 expert tutors across 50 sessions found feedback that was **"direct, immediate, discriminating"** (D'Mello, Lehman & Person 2010, FLAIRS) [V]. A reasonable reading: experts are direct about correctness but indirect about *why*, leaving the student to find the fix. Taxila should not claim to "teach like expert tutors" as if there were one agreed style.

### 1.3 ICAP and self-explanation: learning activities that are also evidence

- **ICAP** (Chi & Wylie 2014, *Educational Psychologist* 49:219-243): Passive < Active < Constructive < Interactive. Across about 225 studies, Interactive, Constructive, and Active activities all beat Passive [S]. Constructive and interactive activities *produce output*, which is evidence about understanding. Passive listening produces none. **In a voice tutor, every minute the teacher talks without the child producing something is a minute without evidence.**
- **Self-explanation.** Bisra et al. 2018 meta-analysis: g ≈ 0.55. Inducing it with prompts: about 0.33 short-term (as reported in Brod 2021) [V via Brod]. Self-explanation works with 2nd-5th graders in maths (Rittle-Johnson; McEldoon et al. 2013). Scaffolded prompts (choosing or completing an explanation) beat open "explain this" prompts, especially for conceptual knowledge (Rittle-Johnson, Loehr & Durkin 2017, *ZDM*) [S].
- **Age matters.** Brod's review (2021, *Educ Psych Review* 33:1295) finds "an age-related increase in the benefit from generating explanations". Practice testing and **predicting** work from lower elementary school; **drawing and question-generation** are largely ineffective until secondary school [V].

### 1.4 Stealth assessment and evidence-centered design

- **Evidence-centered design (ECD)** (Mislevy, Steinberg & Almond 2003) [M] separates three models: the **competency model** (what we want to know about the learner), the **evidence model** (which observable behaviours count as evidence, and how much), and the **task model** (situations that elicit those behaviours). **Stealth assessment** (Shute 2011) weaves these invisibly into an activity [S].
- **Physics Playground** ran three stealth assessments at once (qualitative physics understanding, persistence/conscientiousness, creativity) inside a drawing-physics game. In a field study with 167 grade 8-9 students, in-game measures (e.g., gold and silver trophies) correlated significantly with external tests [S]. Exact correlations not re-checked; they are moderate in the cited literature [M].
- **Lesson for Taxila.** Specify the competency model per NCERT learning outcome, *write the evidence rules before the dialogue*, and design probes as tasks whose answers discriminate between "understood" and "not understood". Stealth assessment comes from task design, not from mood-reading the child's voice.

### 1.5 Learning by teaching (teach-back, the protégé effect)

- **The protégé effect.** In the Betty's Brain studies, students who believed they were teaching their own teachable agent spent more time on learning activities and learned more than students using the same software for themselves (Chase, Chin, Oppezzo & Schwartz 2009, *J Sci Educ Technol* 18:334) [S].
- **Meta-analytic size.** Preparing to teach: g = 0.35; preparing then teaching: g = 0.56; benefits held after a delay; interactive teaching beat non-interactive (Kobayashi 2019, 28 studies) [S]. Kobayashi 2024 (39 studies): **teaching benefits depended on having studied with the expectation of teaching** (g = 0.48) versus without that expectation (g = -0.02, i.e., none) [S].
- **Young children.** Children aged 3-6 learned English verbs better when "teaching" a care-receiving robot (Tanaka & Matsuzoe 2012) [M].
- **Design consequence.** Announce the teach-back *at the start* of a concept ("at the end you'll teach this to [character]"), not as a surprise. The child's explanation to the protégé is the richest single covert probe: AutoTutor-style expectation coverage, plus misconception detection, plus a learning boost.

### 1.6 Predict-observe-explain

- Predicting before seeing an outcome improves learning, partly through surprise when the prediction is wrong (Brod, Hasselhorn & Bunge 2018, *Learning & Instruction* 55:22-31) [S]. It has helped 2nd graders (facts), 3rd-5th graders (belief revision), and 4th graders (conservation) [V via Brod 2021].
- **Boundary condition for children:** in 9-12-year-olds, only those with better inhibitory control learned from wrongly predicted outcomes (Brod et al. 2020, *Dev Science*) [V]. Predictions are excellent *probes* at all ages, because they reveal the child's prior model and misconceptions. As a *learning* move for younger or lower-EF children, they need the teacher to resolve the conflict explicitly.

### 1.7 Error-spotting ("the teacher makes a deliberate mistake")

- **Erroneous examples.** 6th graders who found, explained, and fixed errors in decimal problems matched controls on the immediate test but did better a week later (d = 0.33 on gains; n = 390 replication) (McLaren, Adams et al. 2016, *IJAIED*) [S].
- **Interaction with prior knowledge.** Correct-plus-incorrect examples helped far transfer *only* for learners with good prior knowledge. For low-prior-knowledge learners, correct examples alone were better (Große & Renkl 2007, *Learning & Instruction*) [S]. In the worked-examples meta-analysis, correct examples alone gave larger effects than incorrect examples alone or mixed (Barbieri et al. 2023, g = 0.48 overall) [S].
- **The "derring effect"** (deliberately making your *own* errors; Wong & Lim 2022, *JEP:General*) has **failed independent preregistered replications** [S]. Do not build on it.
- **Design consequence.** The teacher's deliberate mistake is a strong probe of *discrimination* (can the child tell right from wrong?), but only once the child has some mastery. For novices, show correct worked examples first. Every planted error must be **explicitly resolved**, whether or not the child catches it, so that no false fact is left standing. LLMs are sycophantic toward student suggestions (accuracy falls by up to 15 points when the student proposes a wrong answer; Arvin 2025) [V], so **the correctness of the child's "catch" must be judged against the answer key, never against the child's confidence.**

### 1.8 Transfer probes and the correct-answer trap

- Near transfer (same deep structure, new surface) and far transfer (new context) are the standard evidence of understanding versus memorisation. The Eedi/LearnLM RCT used "novel problems on subsequent topics" as its main outcome [V].
- **A correct answer is not proof of understanding.** In 20,964 Eedi responses, students often reached correct answers through faulty reasoning. Fine-tuned classifiers caught only 57% of these hidden misconceptions; a reasoning model caught 84%. At realistic prevalence, **false alarms outnumbered true detections about 8 to 1**. The authors propose *detect, then verify with a diagnostic follow-up question, then escalate* (Imran & Bulathwela 2026, arXiv 2606.23205) [V]. This is the clearest quantitative argument for a **cheap "why?" follow-up after correct answers** rather than acting on a classifier's guess.

### 1.9 Confidence and calibration

- **Hypercorrection works in Grades 3-6.** High-confidence errors are *more* likely to be corrected after feedback than low-confidence ones (Metcalfe & Finn 2012, *Learning & Instruction*) [S]. A quick confidence check ("a little sure or very sure?") before feedback is worth the time, because a surprising correction sticks.
- **As a probe of understanding, confidence is weak below about age 10**, because young children are systematically overconfident (section 1.1). Use it mainly as a *learning* move, and for 10-15-year-olds as a calibration skill to train.
- **Delayed summaries are diagnostic, immediate ones are not.** Comprehension judgments made after generating keywords *at a delay* correlated with test performance at G = 0.70, versus 0.29 when keywords were generated immediately (Thiede, Anderson & Therriault 2003) [S]. The same effect has been reported in elementary and middle-school children [S, title only]. **Ask for "the main idea in a few words" at the end of the session or in the next one, not right after the explanation.**

### 1.10 Speech signals: latency, hesitation, prosody

What the literature supports:

- **Conversational timing.** Across languages, answers typically begin within about 200 ms of the question ending (Stivers et al. 2009, *PNAS*) [S]. As silence grows past about 700 ms, dispreferred responses outnumber preferred ones (Kendrick & Torreira 2015) [S].
- **Children are slower.** Young children's median answer latency was more than 1.5x adults' (625 vs 371 ms), and longer for complex questions (Casillas, Bobb & Clark 2016) [S]. **Adult turn-taking thresholds will misread children.**
- **Listeners hear knowing.** Rising intonation and longer latency on answers lowered listeners' ratings of whether the speaker knew. For *non-answers*, longer latency *raised* them (Brennan & Williams 1995, *JML* 34:383) [S]. Speakers signal metacognitive state through fillers and prosody (Smith & Clark 1993) [S].
- **Children's uncertainty cues are weaker.** In 7-8-year-olds, audiovisual cues of uncertainty "were relatively small and less often significant" than adults', and both adults and children recognised children's uncertainty *less* accurately (Krahmer & Swerts 2005, *Language and Speech* 48:29) [S].
- **But disfluency does predict accuracy in young children.** In 5-8-year-olds, fillers, hedges, and longer speech onset were more frequent on *incorrect* and low-confidence trials. The relationship broke down exactly where it matters most, when confidence and accuracy diverged (West, Baer, Yu & Odic 2025, *Dev Science*) [V].
- **Adapting to uncertainty helps, and full automation is harder.** In ITSPOKE (spoken physics tutoring), responding to student uncertainty with extra remediation improved learning when a *human* detected the uncertainty (Wizard-of-Oz). The fully automatic version faced real detection challenges (Forbes-Riley & Litman 2011, *Speech Communication*) [S].

What makes these signals noisy for Taxila specifically:

- **ASR on child speech.** Even fine-tuned Whisper models show about 9-14% WER on the MyST corpus of US children (Kid-Whisper) [S]. Code-switched speech raises ASR WER by 30-50% relative, and HiACC (2025) is the first public Hinglish corpus to include children: 1,858 child segments [V]. A misrecognised correct answer becomes a false "wrong".
- **Turn detection (VAD/endpointing).** Children pause mid-utterance. An endpointer tuned on adults will cut them off, producing artificial "short, wrong" answers and inflating apparent hesitation. Latency measured end-to-end also includes network and device delay.
- **Language switching.** A child searching for the English word, then answering in Hindi, produces a delay that has nothing to do with conceptual uncertainty.

**Verdict.** Latency and disfluency are *real but weak* evidence (likelihood ratio probably in the 1.1-1.5 range; uncalibrated guess). Use them only **normalised per child and per question type**, only after ASR confidence filtering (low-confidence ASR turns should be excluded from evidence, or the child asked to repeat), and only as **tie-breakers or triggers for a follow-up probe**, never as grounds for marking mastery or non-mastery.

### 1.11 Affect: confusion, frustration, boredom

- **Affect dynamics model** (D'Mello & Graesser 2012, *L&I* 22:145): confusion that is resolved leads back to engagement; confusion that stays unresolved becomes frustration, and persistent frustration becomes boredom. Time-series analyses supported the confusion↔engagement and confusion↔frustration oscillations [S].
- **Confusion helps if it is resolved.** Induced contradictions improved learning when learners were confused *and* the confusion was resolved (D'Mello, Lehman, Pekrun & Graesser 2014, *L&I* 29:153) [S]. Not all confusion induction is productive (2020 follow-up, title only) [S].
- **Boredom is the dangerous one.** It was observed only 4-6% of the time, but it was the most persistent state and led to "gaming the system" (Baker, D'Mello, Rodrigo & Graesser 2010, *IJHCS*) [S].
- **Detection reliability.** AutoTutor detected affect from *conversational cues* (dialogue features, not audio) above chance but far from perfect (D'Mello et al. 2008, *UMUAI*) [S; exact accuracies not re-checked]. Child speech-emotion-recognition papers report 75-86% accuracy on acted or curated datasets, but reviews stress data scarcity and lack of age-adapted models [S]. **Treat lab accuracy as an upper bound; in-the-wild child affect from audio alone is unreliable.**
- **Design consequence.** Infer affect from *behaviour in the dialogue*: repeated wrong attempts, "pata nahi" or "I don't know" loops, very short answers, topic-switching, "just tell me", long silences, and drop-off. Then choose responses that are cheap and safe even if the inference is wrong: offer a hint, a smaller step, a choice, or a break. Do not build product logic on an acoustic emotion classifier, and do not *store* inferred emotions in the child's profile (privacy; section 4).

### 1.12 Knowledge tracing (KT): from BKT to LLMs

- **BKT** (Corbett & Anderson 1995) [M] models each skill as a hidden known/unknown state with learn, guess, and slip parameters. It is interpretable and data-cheap.
- **DKT** (Piech et al. 2015) reported AUC 0.86 vs 0.69 for BKT on ASSISTments [S]. Part of that gap came from **duplicated records in the dataset** that inflated DKT (Xiong et al. 2016) [S]. BKT with forgetting, ability, and skill-discovery extensions performs "indistinguishable from DKT" (Khajah, Lindsey & Mozer 2016) [S].
- **LLMs for KT, 2024-2026.**
  - Predicting student responses: *specialised KT models beat LLMs* on accuracy and F1, and are "orders of magnitude" faster and cheaper (Bhattacharyya, Mitton, Abboud & Woodhead [Eedi], EDM 2026) [V].
  - KT from *dialogue* (the setting closest to Taxila): an LLM labels the knowledge component and correctness of each turn, then a KT model tracks mastery. LLMKT beat classic KT, but dialogue KT tops out around 76% AUC versus 80%+ for standard KT. GPT-4o's final-turn correctness labels were about 78% accurate, close to human annotators (Scarlatos, Baker & Lan, LAK 2025) [V].
  - "Language bottleneck models" have an LLM write a *textual* knowledge-state summary (which can include misconceptions) that another LLM uses to predict performance. They are competitive and more interpretable (Berthon & van der Schaar 2025/26) [V].
- **Wheel-spinning.** Students who have not mastered a skill (3 correct in a row) within about 10 opportunities are unlikely ever to master it in that system, and are prone to gaming and disengagement (Beck & Gong 2013) [S]. This is a cheap, robust "stuck" detector: **change the approach rather than serving the 11th similar item**.
- **Design consequence.** Use a small, interpretable model per skill (BKT-family or an Elo/IRT variant) as the mastery ledger. Use the LLM as the **turn-labeller** (which skill, correct or not, which misconception) and as a **textual-summary writer**, and audit its labels against human ratings on Indian child transcripts. Do not ask the LLM to "decide whether the child has mastered X" freehand.

### 1.13 Misconception libraries

- **Eedi / NeurIPS-Kaggle "Mining Misconceptions in Mathematics" (2024):** 1,857 K-12 diagnostic multiple-choice questions, each with three expert-written distractors mapped to 2,586 misconceptions; 1,446 teams; scored by MAP@25 [S]. This is the best open model of what a misconception library looks like. It is UK-curriculum maths, so mapping to NCERT is needed.
- **LLMs as diagnosers:** about 80-88% accuracy in diagnosing college-algebra errors, falling when an answer contains several errors. Up to 35% of LLM hints in one study were too general, wrong, or gave the answer away. A middle-school algebra misconception benchmark reported about 84% precision and recall when restricted by topic and given educator feedback. For C++ misconceptions, GPT-4's κ was 0.18 and GPT-5's 0.38 [all S, secondary summaries of 2025 papers].
- **Science:** large misconception item banks exist for middle-school science (e.g., AAAS Project 2061) [M]. No validated open NCERT-aligned Hindi/English misconception library was found. **Building one, with distractors mapped to misconceptions, per NCERT learning outcome, in Hindi and English, is a moat-grade asset for Taxila.**

### 1.14 Taxonomy of invisible probes (summary; full catalogue in section 7)

Probes fall into five families by what they yield:

| family | what it reveals | best probes | validity as evidence of understanding |
|---|---|---|---|
| **A. Generative** | the content of the child's mental model | explain-to-protégé, "why?" after correct, paraphrase-the-idea, "what would happen if…" | **High**, the richest evidence; needs good LLM grading against expectations and misconceptions |
| **B. Discriminative** | whether the child can tell right from wrong, or one type from another | teacher's deliberate mistake, contrasting cases, "which method?" in interleaved sets, diagnostic distractors | **High** for misconception *identity* (once items are validated); moderate alone, because guessing is possible |
| **C. Transfer / durability** | whether the knowledge is flexible and lasting | near-transfer variant, real-life application, re-asking next session (delayed retrieval) | **Highest** for "really learned"; delayed retrieval is the closest available proxy for exam-relevant learning |
| **D. Process / metacognitive** | how much help was needed; whether the child monitors themselves | hint-ladder consumption, self-corrections, confidence bets, child-initiated questions | **Medium**; good KT inputs, weak alone |
| **E. Paralinguistic / affective** | effort, uncertainty, disengagement | latency (normalised), disfluency, silence, "pata nahi" loops, drop-off | **Low-Medium**; tie-breakers and triggers only |

Rules for combining probes are in section 7.2.

---

## 2. Learning styles: the honest evidence

### 2.1 Why the belief is attractive, and the part that is true

About 89% of educators surveyed believe matching instruction to learning styles helps (Newton & Salvi 2020, pragmatic systematic review) [S]. The intuition rests on true facts: **children differ, and how material is presented matters a great deal.** The scientific claim that fails is narrower. It is the **meshing hypothesis**: each child has a stable sensory or format style (visual, auditory, kinaesthetic, "song", "game"), and teaching *in that style* produces more learning than teaching the same child another way.

### 2.2 The test that matters: the crossover interaction

Pashler, McDaniel, Rohrer & Bjork (2008, *Psych Sci Public Interest* 9:105-119) set the bar. To support meshing, you must classify learners by style, randomise each group to each method, and show a **crossover**: visual learners do better with method V *and* verbal learners do better with method A. They found "virtually no evidence" from adequately designed studies, and several well-designed studies "flatly contradict" meshing [S].

### 2.3 Later evidence

| study | population | finding | tag |
|---|---|---|---|
| Rogowsky, Calhoun & Tallal 2015, *J Educ Psych* | college-educated adults | no relation between auditory/visual preference and learning from audiobook vs e-text, immediate or delayed | [S] |
| Rogowsky, Calhoun & Tallal 2020, *Frontiers* | **5th graders** | matching instruction to auditory or visual style had **no effect**; "visual-preference" children did better on *both* modalities | [S] |
| Knoll, Otani, Skeel & Van Horn 2017, *Br J Psych* | adults | style unrelated to recall; studying in one's preferred style raised **judgments of learning**, not learning | [S] |
| Husmann & O'Loughlin 2019, *Anat Sci Educ* | 426 anatomy students | most did not study in line with their VARK style; VARK scores unrelated to grades | [S] |
| Clinton-Lisell & Litzinger 2024, *Frontiers in Psych* meta | 21 studies, 101 effects, 1,712 participants | g = 0.31 [0.05, 0.57], but **only 26% of outcome measures showed a crossover**; low study quality; "too small and too infrequent to warrant widespread adoption" | [V] |
| Hattie & O'Leary 2025, *Educ Psych Review* | 17 meta-analyses | matching studies **d = 0.04**; correlational "styles" research (r ≈ 0.24) mostly reflects learning *strategies*, not styles | [S] |
| Touloumakos et al. 2023, *Mind Brain Educ* (frequentist + Bayesian) | — | "Visual type? Not my type" | [S, title only] |

**Verdict (High confidence):** there is no defensible basis for diagnosing a child as a "visual / rhyme / song / game learner" and routing instruction by that label. A product that claims to do so is exposed to expert criticism, and in the Indian edtech market that criticism will come.

### 2.4 What does work (and is where the owner's intuition can live)

**1. Dual coding and multimedia principles: they work for everyone, not for "visual types".**
- Words plus relevant pictures beat words alone (dual coding: Paivio; Clark & Paivio 1991) [M].
- A meta-meta-analysis of 29 reviews (1,189 studies, 78,177 participants) found 11 multimedia principles with significant positive effects. The largest were for captioning second-language video, temporal/spatial contiguity, and **signalling**. Robust effects also for modality, coherence (removing seductive details), segmenting, personalization (conversational style), pedagogical agents, and others. **Good design mattered more for complex material and for system-paced media** (Noetel et al. 2022, *RER* 92:413) [S]. A voice tutor is system-paced.

**2. The modality effect (narration plus picture beats on-screen text plus picture) is real but smaller than first thought, and depends on conditions.**
- Ginns 2005: d = 0.72 [S].
- Reinwein 2012 reanalysis: d = 0.38, and about 0.20 after correcting for publication bias. Strong for *system-paced* presentation (d = 0.93), reversed for self-paced (d = -0.14) [S].

**3. Spoken information is transient: the voice-tutor trap.**
- When long spoken explanations accompany diagrams, written text can win, because the listener cannot re-inspect what was said. Short segments restore the modality advantage (Leahy & Sweller 2011; Wong, Leahy, Marcus & Sweller 2012) [S].
- **For Taxila:** keep each spoken chunk short (one idea), put the persistent element on screen (numbers, a diagram, the key word in Devanagari or Latin script), and let the child say "phir se" (again) to replay.

**4. Seductive details hurt.**
- Interesting but irrelevant additions (songs, jokes, game decorations unrelated to the concept) reduce retention (d = -0.30) and transfer (d = -0.48) (Rey 2012) [S], confirmed by Sundararajan & Adesope 2020 [S]. **A song that is *about* the content can help memory. A song *added for fun* harms learning.**

**5. Songs and rhythm help verbatim and sequence recall, not understanding.**
- Melody helps verbatim recall of text, especially when it is simple and repeated (Wallace 1994) [M].
- Results are mixed in children: 4-year-olds learned novel words better from speech than from song [S]. In one study sung text helped comprehension more than written text but not verbatim recall [S].
- **Use chant and rhythm for sequences that must be verbatim** (multiplication tables, varnamala, months, planet order, formulae), not for concepts.

**6. Games: a modest effect on learning; motivation effects are less robust.**
- Gamification meta-analysis: cognitive outcomes g = 0.49 (stable in rigorous studies), behavioural g = 0.25; motivational effects unstable in rigorous studies (Sailer & Homner 2020, *EPR*) [S]. Serious games were found more effective for learning but not more motivating than conventional instruction (Wouters et al. 2013) [M].
- **Expected tangible rewards undermine intrinsic motivation** (d ≈ -0.28 to -0.40 by reward type), and do so *more* for children (Deci, Koestner & Ryan 1999, 128 studies) [S]. Game wrappers are fine; points-for-completion economies are risky.

**7. Interest-based personalization: real and well supported.**
- Personalising algebra story problems to students' interests (sports, games, music) in Cognitive Tutor improved performance and efficiency and reduced gaming (Walkington 2013, *J Educ Psych* 105:932; 145 students) [S].
- 2024 meta-analysis (34 publications): interest g = 0.55, **retention g = 0.48, transfer g = 0.36**, cognitive load g = 0.54 [S; direction of the cognitive-load effect not re-checked].
- Personalisation, choice, and fantasy context in a maths game raised 4th-5th graders' motivation and learning (Cordova & Lepper 1996) [M].
- **For India:** cricket, chai-stall arithmetic, festival preparations, train journeys, local bazaar prices, auto-rickshaw fares.

**8. Choice.** Providing choice raised intrinsic motivation, effort, and performance, with **larger effects in children than adults**, and strongest with **2-4 choices** and for instructionally *irrelevant* choices (e.g., which character, which context) (Patall, Cooper & Robinson 2008, 41 studies) [S].

**9. Content-format fit beats learner-format fit.** Match the format to the *content*: maps for geography, diagrams for fractions and geometry, spoken dialogue for language and pronunciation, a number line for integers (Willingham et al. 2015) [M]. This is the honest version of "visual for some things, rhyme for others": the right format depends on the topic, not on a fixed trait of the child.

### 2.5 Aptitude-treatment interactions (ATI): the ones that are real

Cronbach & Snow's decades-long ATI search (1977) [M] found that the reliable interactions involve **prior knowledge and general ability**, not sensory styles. The modern, quantified version is the **expertise reversal effect**:

- **Low-prior-knowledge learners learn better with high assistance** (worked examples, step-by-step, explicit explanation): d = 0.505. **High-prior-knowledge learners learn *worse* with high assistance**: d = -0.428. The effect generalises, moderated by educational level and domain (Tetzlaff, Simonsmeier, Peters & Brod 2025, *L&I* 98) [S]. An earlier narrative review of 26 studies found effect-size differences of d = 0.45-2.99 (Kalyuga 2007) [S].
- **This is the individual difference Taxila must adapt to first.** It is measurable from KT, and adapting to it is backed by meta-analytic evidence.

### 2.6 Preference ≠ efficacy (why stated preference cannot be the learning signal)

Students prefer what feels fluent: massed practice, passive explanation, their "style". They judge it as better learning when it is not (Kornell & Bjork 2008; Deslauriers 2019; Knoll 2017) [S]. In Bastani et al., unguarded AI access *felt* helpful while it lowered later independent performance [V for the performance result; the perception finding is M]. **Preference is still worth recording**: it drives engagement, and engagement is the binding constraint (section 3.3). But it must be modelled *separately* from efficacy.

### 2.7 Learning formats by experiment (bandits): promise and traps

- **ZPDES and RiARiT** (Clément, Roy, Oudeyer & Lopes 2015, *JEDM*): bandit sequencing based on learning progress, tested with **400 children aged 7-8** learning number decomposition with money. Children progressed further than with an expert hand-designed sequence [S]. This is evidence that bandits can personalise *sequence and difficulty* for young children.
- **The statistical cost.** Bandit-run experiments benefit students during the experiment but need **at least twice as many participants** for acceptable power, and they bias naive effect estimates (Rafferty, Ying & Williams 2019, *JEDM*) [S].
- **Personalisation often does not beat a good uniform policy.** In a 1-million-student tutoring system, contextual (personalised) bandits found some heterogeneity, but "effect sizes may often be too small for CB policies to provide significant improvements beyond well-optimized MAB policies that deliver the same action to all students" (Schmucker et al. 2025, arXiv 2508.00270) [V].
- **Traps specific to a per-child format profile:**
  1. *Reward hacking:* optimise for engagement or immediate correctness and the bandit learns "fun and easy". Reward must be **delayed retrieval and transfer**.
  2. *Sparse data per child × topic type:* use hierarchical (partially pooled) estimates, never raw per-child win rates.
  3. *Non-stationarity:* children change fast at these ages. Decay old evidence.
  4. *Confounding by difficulty:* compare formats on matched items.
  5. *Labelling harm:* a profile shown to parents becomes a fixed identity ("he's a visual learner"). Never output style labels.

The full model is specified in section 8.

### 2.8 The reframe the owner can defend

> **Not:** "Taxila discovers your child's learning style (visual, rhyme, song, game)."
> **Instead:** "Taxila keeps measuring which kinds of explanation help *your* child remember and use what they learned a week later, in each kind of topic. It also tracks what keeps them engaged and what they enjoy, and adapts. It shows you the evidence."

What this lets the product truthfully do: use visuals, rhymes, songs, games, stories, and teach-back; give children choices; and personalise by *measured* outcome, not by quiz-derived type. What it rules out: a "learning style quiz" at onboarding that routes instruction, and parent-facing labels. Section 8 gives defensible and indefensible claim wording.

---

## 3. What works in AI tutoring: the 2023-2026 evidence

### 3.1 Baselines: how big should we expect effects to be?

| benchmark | effect | note | tag |
|---|---|---|---|
| Bloom's "2 sigma" (1984) | 2.0 SD | based on two small dissertations; tutoring was combined with mastery learning and never replicated; "exaggerated and oversimplified" (von Hippel 2024, *Education Next*) | [S] |
| Tutoring RCT meta-analysis (Nickow, Oreopoulos & Quan 2020/2024) | 0.37 SD | larger for teacher/paraprofessional tutors and in earlier grades | [S] |
| Tutoring at scale (Kraft, Schueler & Falken 2024/2026, *RER*) | 0.40 pooled → **shrinks 45-60%** for large programs on standardized tests | the realistic planning number | [S] |
| VanLehn 2011 (*Educ Psychologist*) | human tutoring 0.79; step-based ITS 0.76; substep-based 0.40; answer-based ~0.31 | the "interaction plateau": finer granularity stops helping beyond step level | [S; 0.31 is M] |
| Math practice software (computer-assisted learning, CAL) | 0.05-0.20 SD typical | per Oreopoulos & Low 2026's review | [V] |
| **Mindspark, Delhi** (Muralidharan, Singh & Ganimian 2019, *AER*) | **+0.37 SD maths, +0.23 SD Hindi in 4.5 months**; IV estimate for 90 days: 0.6 / 0.39 | adaptive, level-targeted; n = 619 by lottery | [S] |
| **Rori, Ghana** (Henkel et al. 2024) | d = 0.36 on growth score | WhatsApp text tutor, grades 3-9, 2 sessions/week; school-level randomisation with only 11 schools, so treat as fragile | [S] |

### 3.2 LLM-tutor trials

| study | who / n / duration | design | result | what it teaches Taxila | tag |
|---|---|---|---|---|---|
| **Kestin, Miller et al. 2025, *Sci Rep*** (Harvard PS2) | 194 undergrads, 2 lessons | crossover RCT; AI tutor at home vs active-learning class | learned more in less time (median 49 vs 60 min); **effect 0.63 (OLS) / 0.73-1.3 SD (quantile)**; test **immediately** after | design was decisive: prompts carried **pre-written step-by-step solutions**; the **platform enforced part order** because "a system prompt could not reliably provide enough structure to scaffold problems with multiple parts" | [V] |
| **Bastani et al. 2025, *PNAS*** | ~1,000 Turkish high-schoolers | field RCT: GPT Base vs GPT Tutor (guarded) vs control | practice grades +48% (Base) / +127% (Tutor); **unassisted exam −17% for Base**; Tutor "largely mitigated" the harm | unguarded help becomes a crutch; **guardrails against answer-giving are mandatory** (a correction notice exists; its content was not checked) | [V] |
| **De Simone et al. 2025** (World Bank, Edo State, Nigeria) | SS1 students, 9 schools, 6 weeks after school | RCT; pairs using Copilot (GPT-4) with **teacher facilitation** | **0.31 SD** overall, 0.23 SD English; largest for girls and **higher-baseline** students | a human-structured setting; gains skewed to stronger students, so watch equity for low-level learners | [S] |
| **Tutor CoPilot** (Wang, Demszky et al. 2024/25) | 900 tutors, 1,800 K-12 students | RCT; LLM suggests moves to human tutors | +4 pp mastery; **+9 pp for lower-rated tutors**; more probing questions, less generic praise; ~$20/tutor/year | the LLM's value was *pedagogical moves* (probing questions) | [S] |
| **LearnLM × Eedi 2025** (Google DeepMind) | 165 students, 5 UK schools | session-level RCT; LearnLM drafts, expert tutor approves | as good as human tutors on all outcomes; **+5.5 pp on novel next-topic problems** (66.2% vs 60.7%); **76.4% of drafts sent with zero or minimal edits** | human-supervised; a scaled 4-arm RCT (~1,200-1,525 students, STAR Maths outcome) ran April-June 2026; **results not yet public** | [V] |
| **Khanmigo, 2-year cluster RCT** (Oreopoulos & Low 2026) | 18 Tennessee middle schools, remedial maths | cluster RCT | **0.06-0.08 SD/year**; about 0.14 for a full year of active use; similar to Khan Academy *without* AI | 96% tried it, but the median student messaged on a third of practice days and in **only 17% of sessions with a mistake**; messages mostly bare answers. Khan relaunched with auto-activation in 2026. **Engagement is the bottleneck; a passive "ask me" tutor fails** | [V] |
| **Medly micro-RCTs** (Harrison et al. 2026) | 929 → 644 GCSE science students, 4 weeks | teacher-led micro-RCTs | g = 0.33 [0.18, 0.48]; 30.7% attrition; authors call it preliminary | fast in-school micro-RCTs are a viable evaluation design for Taxila too | [V] |
| **"When AI Tutors Speak"** (Yang, Van Alstyne & Dellarocas 2026) | 86 online-MBA students | preregistered RCT; weekly within-student voice/text alternation | structure mattered (+6.63 points); **voice = text for learning**; voice doubled interaction, cost **2.8x**, and was preferred | **voice is not a learning advantage by itself**; adult sample, so extrapolate cautiously | [V] |
| Contractor & Reyes 2026 | undergraduates | RCT; AI access while learning and writing | +0.27 SD immediately, persisting a week | AI can help when used for information-seeking rather than doing the work | [V] |
| **Alpha School** ("2-hour learning") | private schools | **no RCT, no control group**, self-reported MAP scores | claims of 99th percentile; the affiliated Unbound Academy reported 10% maths proficiency vs a 60% prediction | **unverified; do not cite as evidence** | [S] |

### 3.3 Patterns across the evidence

1. **Pedagogical structure, enforced by the platform, matters more than the model.** Kestin's platform-enforced sequence plus pre-written solutions, Bastani's guardrails, "When AI Tutors Speak" (structure +, modality 0). (High)
2. **Ground every item in verified solutions and misconceptions.** Hallucinated maths and confident wrong marking are known failure modes. Kestin injected step-by-step solutions [V]. (High)
3. **Initiative and engagement decide outcomes at scale.** In the Khanmigo trial, students "struggled to formulate the questions a conversational tutor requires" [V]. Every successful LLM study had a *structured session* (class time, after-school slots, or a tutor-initiated chat). Taxila's teacher must lead: ask, probe, and schedule. (High)
4. **Human-in-the-loop studies dominate the positive results** (Nigeria teachers, Eedi expert approvers, Tutor CoPilot). Fully autonomous LLM tutoring for young children has **no RCT evidence found**. For Taxila the realistic loop is the *parent* (weekly evidence report) and, via school partnerships, the *teacher*. (Medium)
5. **Solving ≠ teaching.** MathTutorBench: subject expertise "does not immediately translate to good teaching"; pedagogy and expertise trade off; "tutoring appears to become more challenging in longer dialogs" (Macina et al., EMNLP 2025) [V]. The correlation between solving and pedagogy composites is only 0.42 (Yao et al. 2026) [V]. **Evaluate Taxila's tutor on pedagogy, not on whether the model can solve the problems.**
6. **Answer leakage and sycophancy are persistent LLM failure modes.** Reported answer-disclosure rates reach 14-38% of responses in 2026 benchmarks [S]. A student's wrong suggestion lowers LLM accuracy by up to 15 points (30 for small models) [V]. Guard in code with answer-key checks and output filters, not only in the prompt.
7. **Short horizons flatter results.** Kestin tested immediately; most others test within weeks. The Khanmigo two-year result is the sober counterweight. (High)

### 3.4 Socratic questioning vs telling

- **Minimal guidance fails novices** (Kirschner, Sweller & Clark 2006) [M]. **Worked examples help in maths** (g = 0.48; Barbieri et al. 2023) [S]. **Expertise reversal** (section 2.5) means novices need more telling and experts less.
- **Productive failure** (problem-solving *before* instruction) beats instruction-first for conceptual understanding and transfer: g = 0.36, rising to 0.37-0.58 with high fidelity, across 53 studies and 166 comparisons, without hurting procedural knowledge (Sinha & Kapur 2021, *RER* 91:761) [S]. Fidelity means the failure is followed by **instruction that builds on the students' attempts**.
- **Prompting can substitute for explaining** in human tutoring (Chi et al. 2001) [S]. The interaction plateau (VanLehn 2011) suggests diminishing returns from ever-finer Socratic steps [S].
- **Synthesis: the guidance ladder.** For a *new* concept with a low-prior-knowledge child: a short worked example → a faded example → a guided attempt → independent attempt → probe. For a child with some prior knowledge: try first (productive-failure style) → targeted instruction that builds on their attempt → transfer probe. Use Socratic prompts (pump, hint, prompt) inside attempts. Give the answer (assertion) only after the hint ladder is exhausted, and then follow it with an isomorphic problem the child must solve. The ladder position comes from KT, not from the LLM's whim. (High in principle; Medium on the exact sequence for voice)

### 3.5 Learning strategies with strong evidence

| strategy | evidence | age notes | tag |
|---|---|---|---|
| **Retrieval practice** | 57% of 50 classroom experiments (n = 5,374) showed medium or large benefits (Agarwal, Nunes & Blunt 2021); g ≈ 0.61 in Adesope et al. 2017 | works from lower elementary (Brod 2021) | [S]/[M] |
| **Spacing** | robust; optimal gap about 10-20% of the desired retention interval (Cepeda et al. 2006, 2008) | works in children | [M] |
| **Interleaving (maths)** | 54 grade-7 classes, 4 months: **61% vs 38%** on an unannounced test a month later, d = 0.83 (Rohrer et al. 2020, *J Educ Psych* 112:40) | strongest evidence is grade 7; for ages 6-9 use mild interleaving after initial blocked learning | [S] |
| **Worked examples** | g = 0.48 in maths; correct examples beat incorrect-only (Barbieri et al. 2023) | essential for novices | [S] |
| **Self-explanation** | g ≈ 0.55 (Bisra et al. 2018); scaffolded prompts best (Rittle-Johnson et al. 2017) | benefit grows with age; for ages 6-9 use choose-or-complete explanations | [V via Brod]/[S] |
| **Elaborative interrogation ("why?")** | moderate utility (Dunlosky et al. 2013) | needs some prior knowledge | [M] |
| **Prediction** | positive across ages, no meta-analysis yet (Brod 2021) | younger and low-EF children need explicit conflict resolution | [V] |
| **Concreteness fading** (concrete → bridging → abstract) | systematic review supports it for maths and science (Fyfe, McNeil, Son & Goldstone 2014) | ideal for 6-11 (fractions, place value, equivalence) | [S] |
| **Feedback** | average d ≈ 0.48, highly variable (Wisniewski, Zierer & Hattie 2020); over a third of feedback interventions *lowered* performance (Kluger & DeNisi 1996) | task- and process-focused feedback helps; ego-focused feedback harms | [M] |
| **Praise** | ability praise ("you're so smart") led to worse persistence after failure than effort/process praise (Mueller & Dweck 1998); inflated praise backfires for low-self-esteem children (Brummelman et al. 2014) | very relevant to a "warm" AI persona | [M] |
| **Low-utility techniques** | rereading, highlighting, summarising (untrained), keyword mnemonics (Dunlosky et al. 2013) | avoid as main activities | [M] |

### 3.6 Growth mindset: current status

- Small average effects: d ≈ 0.08 (Sisk et al. 2018) [M]. The US national study found about +0.10 GPA points for lower-achieving students (Yeager et al. 2019, *Nature*) [M].
- Macnamara & Burgoyne 2023 (*Psych Bull*): 94% of interventions had confounds, financially interested authors reported larger effects, and apparent effects may be attributable to bias [S]. Burnette et al. 2023 found effects for focal (at-risk) groups using heterogeneity-aware methods; Tipton et al. 2023 argue the same data show meaningful effects in at-risk subgroups [S].
- **Verdict:** do not build a "growth mindset module" or market one. Do the cheap, low-risk parts: process praise, normalising mistakes and struggle ("galti se hi seekhte hain" — we learn from mistakes), and attributing success to strategy and effort. (Medium)

### 3.7 Motivation (self-determination theory) for a child-facing AI

- **Autonomy:** offer 2-4 meaningful-but-cheap choices (character, context, order) [S].
- **Competence:** success rate in the "zone" (ZPDES used learning progress rather than fixed difficulty) [S]; visible progress; feedback that is specific and true.
- **Relatedness:** warmth matters, but see section 4: relatedness should point *outward* (to parents, teachers, friends) as well as toward the agent.
- **Avoid:** expected tangible rewards for completion (undermining effect, stronger in children) [S]; streak-loss guilt; leaderboards for young children (social comparison) [M].

### 3.8 Age-appropriate design: ages 6-9 vs 10-15

| dimension | 6-9 (Classes 1-4; foundational/preparatory) | 10-15 (Classes 5-9; preparatory/middle) | basis |
|---|---|---|---|
| Input channel | voice-first is **mandatory**; many cannot read Std II text (ASER) | voice plus typed/visual; reading is common but not universal | [S] |
| Spoken segment length | very short; one idea per turn; on-screen anchor | short-to-medium; can hold two-step explanations | transient info [S]; working-memory development [M] |
| Turn-taking | slower answers (child median ~625 ms vs adult ~371 ms); long mid-utterance pauses; endpointing must wait longer | closer to adult, still slower on complex questions | [S] |
| Metacognition | strongly overconfident; confidence ratings weak evidence | improving; near-adult calibration around 12; train it | [S] |
| Generative strategies that work | **practice testing, prediction** (with explicit resolution), choose-or-complete self-explanation, teaching a care-receiving character | explanation, self-explanation, elaborative interrogation, concept mapping (from about grade 4 with support), questioning | Brod 2021 [V] |
| Representations | concrete → pictorial → abstract (concreteness fading); manipulatives on screen | can start abstract with concrete back-up | [S] |
| Error-spotting | sparingly, only after mastery, always resolved | effective for discrimination and transfer | [S] |
| Anthropomorphism | **higher** in younger children; more prosocial behaviour toward agents believed to have feelings | lower but still present; teens use AI companions widely | [S] |
| ASR reliability | worst (younger means higher WER) | better | [S] |
| Session shape | short sessions, frequent breaks, physical "do" moments [M: no strong evidence on optimal length; measure it] | longer focused blocks possible | [M] |

---

## 4. The relational bond with a child

### 4.1 Why the bond matters, and why it is dangerous

- **It matters.** A conversational agent replicated the benefits of dialogic reading with a human partner for 3-6-year-olds, increasing story-relevant talk and comprehension (Xu et al. 2022, *Child Development*; n = 117) [S]. Relatedness is a core SDT need. The protégé effect shows children try harder *for* a character (section 1.5).
- **It is dangerous.**
  - Younger children anthropomorphise more, attribute feelings, share more with agents they believe can feel, and tend to over-trust robots [S].
  - A 2026 systematic review of 35 studies of children with LLM chatbots found "dual consciousness" (they know it's a machine yet treat it socially), "varying social ties", and boundary exploration (Jayathilake & Ma, ACM IDC '26) [V].
  - In adults, heavier daily chatbot use correlated with more loneliness, more dependence, and less socialisation across modalities (MIT Media Lab / OpenAI 2025, n = 981 four-week RCT plus 4M-conversation analysis) [S]. Not causal and not children, but the direction is the warning.
  - 72% of US teens have used AI companions; a third chose to discuss serious matters with an AI instead of a person; 24% shared personal information. Common Sense Media judged social AI companions an **"unacceptable risk"** for under-18s; the companions it tested routinely claimed to be real and to have feelings (2025) [S].

### 4.2 The 2025-2026 regulatory and industry trajectory

- **US FTC 6(b) orders (11 Sep 2025)** to Alphabet, Character.AI, Instagram, Meta, OpenAI, Snap, and xAI about how they test and monitor harms to children and teens from companion-style chatbots [S].
- **California SB 243** (signed 13 Oct 2025, effective 1 Jan 2026): clear AI disclosure where a user could be misled; for known minors, an **AI disclosure and a break reminder every 3 hours** of sustained interaction; blocks on sexual content; **crisis-response protocols** for self-harm; annual reporting from 1 July 2027; private right of action ($1,000 per violation) [S]. New York passed a companion-chatbot law at the same time [S].
- **Character.AI** removed open-ended chat for under-18s by 25 Nov 2025, with age assurance [S].
- **APA Health Advisory on AI and Adolescent Well-being (June 2025):** age-appropriate defaults, protection against manipulation and the "erosion of real-world relationships", data and likeness protection, and AI literacy [S].
- **UNICEF Guidance on AI and Children v3 (2025):** 10 requirements: regulation and oversight, safety, data and privacy, non-discrimination, transparency, child rights, best interests and well-being, inclusion, AI skills, and an enabling environment. **New in v3: AI companions** [S].

### 4.3 India: DPDP Act 2023 and DPDP Rules 2025

- **The Act, section 9.** Everyone under 18 is a "child".
  - **9(1):** the data fiduciary must obtain **verifiable consent of the parent or lawful guardian** before processing a child's data.
  - **9(2):** no processing likely to have a detrimental effect on a child's well-being.
  - **9(3):** **"shall not undertake tracking or behavioural monitoring of children or targeted advertising directed at children."**
  - **9(5):** the government may exempt fiduciaries that process children's data in a "verifiably safe" manner, above a notified age.
  - Breach of the section 9 duties carries penalties **up to ₹200 crore** [S].
- **The Rules (notified 13 Nov 2025).**
  - **Rule 10 (from 13 May 2027):** before processing a child's data, the fiduciary must verify that the consenting person is an **identifiable adult**. Routes: identity and age details already held, details provided voluntarily, or a **virtual token from an authorised entity such as DigiLocker** [V].
  - **Rule 12 / Fourth Schedule** exempts specified classes from 9(1) and 9(3). Part A includes an **"educational institution"** ("an institution of learning that imparts education, including vocational education"), which may do **"tracking and behavioural monitoring (a) for the educational activities of such institution; or (b) in the interests of safety of children enrolled with such institution"** [V]. Part B lists purposes: email account creation, safety location tracking, filtering harmful content, and age verification [V].
- **The open question for Taxila.** Knowledge tracing, a per-child learning profile, and "covert comprehension detection" are, on a plain reading, *behavioural monitoring*. Whether a direct-to-consumer edtech app is an "educational institution" is **unsettled**. Law-firm commentary leans toward "edtech platforms likely don't qualify" and suggests structuring through schools [S]. A different reading treats adaptive learning as the service itself rather than "monitoring". **This is the single biggest regulatory risk to the learning-profile feature. Get a written legal opinion before building it.** Options to put to counsel:
  1. Deliver through partner schools, with Taxila as data processor under the school's exemption.
  2. Seek section 9(5) "verifiably safe" notification.
  3. Narrow the profile to session-scoped, purpose-bound learning state, with no cross-context profiling, no affect inference, and no use beyond teaching, all parent-visible and deletable.
- **Engineering consequence, independent of the legal answer:** data minimisation by design. Store derived skill-mastery estimates, not raw audio. Make no inferences about emotion or personality. Do no advertising. Give parents a dashboard with deletion. Keep consent records auditable.

### 4.4 US COPPA (relevant if any US users, and as a design reference)

The amended COPPA Rule was published 22 Apr 2025, took effect about 21 Jun 2025, with **compliance required by 22 Apr 2026** [S]. Changes: **separate verifiable parental consent for disclosure to third parties**; written data-retention limits; a broader definition of personal information, including **biometric identifiers** [S; whether "voiceprints" is named explicitly: M, verify]. The FTC's 2017 enforcement policy on children's voice recordings allowed audio collected *only* as a replacement for written words and deleted immediately [M]. That remains the safest pattern: **transcribe, then delete audio**.

### 4.5 Healthy-bond design principles (teacher, not friend replacement)

These consolidate the APA, UNICEF, SB 243, and Common Sense recommendations; mapping each item to a specific source line is approximate.

1. **Always honest about being an AI.** Never claim to be human, to have feelings, or to "miss" the child. Warmth comes through attention, memory of the child's work, and humour, not through simulated emotional need.
2. **No exclusivity or dependency hooks.** Nothing like "I'm your best friend", "only I understand you", or guilt for leaving. Do not position the AI as the child's confidant for personal problems. Redirect to parents or trusted adults.
3. **Outward-pointing relatedness.** Prompt the child to show a parent, explain the idea to a sibling or friend (also a strong probe), or ask their teacher.
4. **Parent visibility by default.** A weekly evidence report, access to transcripts, topic logs, and alerts for safety triggers.
5. **Time boundaries.** Session caps and break prompts far stricter than SB 243's 3 hours, set by the parent. No dark-pattern streaks.
6. **Crisis protocol.** Detect self-harm, abuse, or danger disclosures. Respond with care, give **India helplines** (CHILDLINE 1098 and Tele-MANAS 14416 [M: verify the current numbers and routing before launch; CHILDLINE has been integrated with the 112 emergency system]), and notify the parent unless that would endanger the child. That last judgment needs a child-safeguarding expert, not an engineer.
7. **Content boundaries.** Teaching scope only. Refuse romantic or sexual content, and deflect off-curriculum emotional deep-dives with a gentle hand-off.
8. **Persona consistency without persona capture.** Warm, encouraging, and specific, with process praise and no inflated praise (section 3.5).

---

## 5. The Indian context

### 5.1 Curriculum structure

- **NEP 2020 → NCF-FS 2022 and NCF-SE 2023.** The "5+3+3+4" stages:
  - **Foundational:** ages 3-8, preschool to Grade 2
  - **Preparatory:** Grades 3-5
  - **Middle:** Grades 6-8
  - **Secondary:** Grades 9-12

  The framework flows down from aims → curricular goals → competencies → learning outcomes, and shifts from rote learning to competencies [S]. NCERT has introduced new textbooks for Grades 1-9 under NCF-SE [S; exact rollout by grade not re-checked].
- **Assessment shift.** For CBSE Class 10 from 2025-26, about **50% competency-based questions** (case- and source-based, application MCQs), 20% objective, 30% constructed response [S: education publishers, not the CBSE circular]. **PARAKH**, the national assessment centre, ran the Rashtriya Sarvekshan for Grades 3, 6, and 9 in December 2024 [S].
- **NIPUN Bharat** targets foundational literacy and numeracy by the end of Grade 3 [M].
- **Implication.** Build the skill graph on NCERT/NCF learning outcomes and competencies, keyed to the new textbooks. Competency-style questions are a natural fit for transfer and application probes.

### 5.2 Learning levels

- **ASER 2024 (rural):**
  - Government-school Std III children able to read a Std II text rose from 16.3% (2022) to **23.4%**
  - Std III subtraction (government schools): 20.2% → **27.6%**
  - Std V reading Std II text (government schools): **44.8%**
  - Std VIII arithmetic: about **45.8%**

  [S]
- **PARAKH 2024:** Grade 3 language 64%, maths 60%; Grade 9 language 54%, maths about **37%**. Maths is weakest at every grade and declines with grade [S]. Grade 6 maths averaged about 46% [M]. One competency-level figure of 38% is reported in secondary sources [S].
- **Within-grade spread:** in Delhi, the average Grade 6 student was about 2.5 grade levels behind in maths (about 4.5 by Grade 9), and students within one grade spanned **5-6 grade levels** (Muralidharan et al.) [S].
- **Implication.** A Class 7 child may need Class 3 place value. **A grade-locked curriculum fails most users.** Diagnostic placement and backward-chaining through prerequisites are core features, not edge cases.

### 5.3 Teaching at the Right Level (TaRL): the strongest Indian evidence

Pratham's TaRL groups children by learning level for part of the day and teaches to that level (Banerjee, Banerji, Berry, Duflo et al. 2017, *JEP* 31(4):73) [S]:

- **Balsakhi** (Vadodara and Mumbai, 2001-04): **+0.28 SD** for lagging Grade 3-4 children [V].
- **Bihar and Uttarakhand** versions largely **failed**. In regular classes only 0-4% of classrooms were actually grouped by level; when training, materials, or follow-through broke down, effects vanished [V].
- **Haryana:** over 90% of schools grouped by level, thanks to monitoring and mentoring by academic coordinators [V].
- **Uttar Pradesh in-school learning camps (50 days):** children able to read a paragraph rose to **49% vs 24% in control**; letter non-recognisers fell to 8% vs 24% [V].
- J-PAL's synthesis: "simply training teachers" or "providing materials alone" does not work. What works is clear learning goals, data-driven progress tracking, and mentoring [S].
- **Pratham is now building an AI tool for TaRL**, with J-PAL researchers (Acemoglu, Dhaliwal, Gallego) evaluating it (MIT News, Feb 2026) [S]. This is likely the most relevant Indian comparison for Taxila.

**Implication.** Taxila is, in effect, a one-child TaRL implementation. The lesson from TaRL's failures is that *the pedagogy only works if level-grouping actually happens*, which for Taxila means placement and prerequisite remediation must be enforced in the product logic, not left to the LLM.

### 5.4 Language: Hindi, English, Hinglish

- NEP 2020: the medium of instruction "at least up to Grade 5, but preferably till Grade 8 and beyond" should be the home language, mother tongue, or regional language, with bilingual teaching where the home language differs [S].
- Studies of Indian classrooms report pervasive mixing of languages even under monolingual-medium policies. Teachers and students describe code-switching as aiding comprehension, "good for weaker students" (Lightfoot et al. 2022 and others; mostly qualitative) [S].
- Mindspark improved Hindi as well as maths [S].
- **ASR penalty:** code-switched speech raises WER 30-50% relative to monolingual speech, and child speech is worse still (HiACC 2025) [V].
- **Implications:**
  1. Let the child answer in any mix. Grade *concepts*, not language, except in language lessons.
  2. For ages 6-9, teach concepts in the home language with English terms introduced as labels (the way NCERT Hindi-medium books handle technical terms).
  3. Benchmark ASR on *Indian child Hinglish* before trusting any speech-derived signal.

### 5.5 Devices and connectivity

- Android is about **93%** of India's mobile OS share (StatCounter, 2026) [S].
- Median mobile download speed was about **131 Mbps** (Ookla, mid/late 2025) [S]. Medians hide the rural tail, congestion, and data-pack limits.
- ASER 2024: about **90%** of 14-16-year-olds have a smartphone at home, but only 27% (age 14) to 38% (age 16) have their *own*. Of those who can use one, 57% used it for an educational activity in the past week and 76% for social media [S]. **The device is usually a shared family phone**, often the parent's, which affects consent, profiles, notification timing, and parent visibility (sessions happen when the parent hands over the phone).
- Entry-level phones in India still ship with 2-4 GB RAM [S].
- **Implications:**
  - small APK size
  - offline-capable lesson packs
  - low-bitrate speech audio (e.g., Opus at about 16-24 kbps [M])
  - a strict latency budget, because the voice round-trip is part of the pedagogy (section 1.10)
  - graceful fallback to "tap to answer" when ASR confidence is low
  - multi-child profiles on one device

### 5.6 Indian precedents worth studying

- **Mindspark (Educational Initiatives):** RCT evidence [S]; now in Telangana government labs [S].
- **Vachan Samiksha (Wadhwani AI with the Gujarat government):** ASR-based oral reading fluency assessment used by about **120,000 teachers for 2.5 million students** since July 2023 [S]. This proves that speech-based assessment of Indian children works at state scale for *reading fluency*, a narrower and easier task than conceptual dialogue.
- **Andhra Pradesh's AI tutor pilot** (IIT Madras platform) [S].
- **The Pratham AI-TaRL tool** [S].

---

## 6. Design implications for Taxila

Each rule gives: **the rule** · *evidence* · **confidence**.

### A. Knowing whether the child understood

1. **Never use the child's self-report as evidence of understanding.** Remove "Samjha? / Do you understand? / Is that clear?" as a decision point. If it is used conversationally, ignore the answer and follow it with a real probe.
   *Graesser & Person 1994 [V]; Mills & Keil 2004 [S]; children's overconfidence [S].* **High.**

2. **No concept is marked "mastered" without three kinds of evidence:**
   (a) a correct independent attempt (no hints),
   (b) a generative or transfer probe passed: an explanation covering the required expectations, a "why?" after a correct answer, or a near-transfer variant,
   (c) a **delayed retrieval** success in a *later session*.
   Until (c), the concept is "learned today", not "mastered".
   *Delayed tests reveal effects that immediate tests miss (McLaren 2016 [S]; Rohrer 2020 [S]); hidden misconceptions behind correct answers (Imran & Bulathwela 2026 [V]).* **High.**

3. **After a correct answer, ask a cheap follow-up "why/how" on a schedule:** always for new concepts, sampled for consolidated ones. Treat a correct answer with a wrong explanation as a misconception flag, not as success.
   *Correct-answer trap: 57-84% detection with an 8:1 false-alarm ratio, so verify with a follow-up rather than a classifier [V].* **High.**

4. **Set teaching expectancy up front:** "At the end you'll teach this to [character]". Then run the teach-back as the main end-of-concept probe. Grade it against the item's expectation list and misconception list (AutoTutor EMT), not with a freeform "is this good?" judgment.
   *Kobayashi 2019/2024: without expectancy, g ≈ −0.02; with it, g ≈ 0.48 [S]; AutoTutor EMT [S].* **High** (ages 10-15) / **Medium** (6-9: use a care-receiving character; explanation benefits grow with age [V]).

5. **Use predict-before-reveal as a standing probe in science and maths.** The child's prediction is logged as evidence of their prior model, mapped to known misconceptions. Always resolve the conflict explicitly; for younger children, walk through why the outcome differed.
   *Brod 2018 [S]; Brod 2020 (EF boundary) [V]; Brod 2021 [V].* **Medium-High.**

6. **Plant deliberate teacher mistakes only after the child shows basic mastery, never for novices, and always resolve them.** The child's catch is graded against the answer key, never by agreement. If the child fails to catch a planted error, the teacher must correct it before moving on.
   *Große & Renkl 2007 [S]; Barbieri 2023 [S]; McLaren 2016 [S]; LLM sycophancy (Arvin 2025) [V]; derring effect failed replication [S].* **Medium-High.**

7. **Paralinguistic signals (latency, fillers, hedges, rising pitch) are tie-breakers and triggers only.** Normalise per child and per question type, and exclude low-ASR-confidence turns. Allowed uses: trigger a follow-up probe, choose a gentler hint, or slow down. Not allowed: changing mastery estimates by more than a small, calibrated amount, or labelling the child.
   *Children's cues are weaker and recognised less well (Krahmer & Swerts 2005) [S]; disfluency predicts accuracy in 5-8-year-olds but not where confidence and accuracy diverge (West et al. 2025) [V]; ASR and code-switch WER [V].* **High** (as a constraint) / **Low** (for any stronger use until calibrated on Taxila data).

8. **Tune turn-taking for children.** Endpointing silence thresholds and "wait time" must be calibrated on Indian children, separately for ages 6-9 and 10-15. Default to *waiting longer* after questions (children answer about 1.5x slower and pause mid-utterance). Never let pipeline latency be read as child hesitation: log child-speech onset relative to the end of the TTS audio actually played on the device.
   *Casillas et al. 2016 [S]; Stivers 2009 [S].* **Medium** (direction is clear; exact thresholds must be measured).

9. **Do not build or ship acoustic emotion recognition for decisions.** Infer affect from dialogue behaviour (repeated failure, "pata nahi" loops, minimal answers, "just tell me", silence, drop-off) and respond with cheap, reversible moves: a hint, a smaller step, a choice, or a break. Do not store inferred emotions.
   *Child SER reliability [S]; affect dynamics [S]; DPDP minimisation [V].* **Medium-High.**

10. **Let confusion run, on a timer.** Productive confusion is allowed, but if it is unresolved after N attempts or turns (start around 2-3 failed hint-ladder steps), escalate support. Detect **wheel-spinning** (no 3-in-a-row within about 10 opportunities on a skill) and change approach (prerequisite check, new representation, worked example) instead of serving more of the same.
    *D'Mello 2012/2014 [S]; Beck & Gong 2013 [S]; boredom persistence (Baker 2010) [S].* **Medium-High.**

11. **The mastery ledger is a small interpretable model per skill** (BKT with forgetting, or Elo/IRT). The LLM's job is turn labelling (skill, correctness, misconception ID) and writing a textual summary, not deciding mastery. Audit LLM turn labels against human raters on Indian child transcripts. Target κ ≥ 0.7 on correctness before relying on them (target is our proposal, not a literature standard).
    *KT beats LLMs at prediction (Bhattacharyya et al. 2026) [V]; dialogue KT about 76% AUC and LLM correctness labels about 78% (Scarlatos 2025) [V]; BKT extensions match DKT [S].* **High.**

12. **Build an NCERT-aligned misconception library** (Hindi and English) per learning outcome: diagnostic items with distractors mapped to misconceptions, expectation lists for explain-back probes, and remediation per misconception. This is content work, and it is the moat.
    *Eedi dataset model [S]; AutoTutor EMT [S]; tutors are poor at misconception diagnosis (Chi 2004) [M].* **High.**

### B. Teaching moves

13. **The teacher drives the session.** Taxila asks, probes, schedules reviews, and opens each session with retrieval. A child-initiated "ask me anything" mode is a side door, not the main path.
    *Khanmigo: 17% engagement on mistakes, 0.06-0.08 SD/yr [V]; successful trials were all structured [V].* **High.**

14. **Enforce lesson structure in code, not in the prompt.** The lesson state machine controls step order, hint-ladder position, and when the answer may be revealed. The LLM generates language *within* the current step. Every item carries pre-written, verified solutions and the misconception list in context.
    *Kestin et al.: system prompt "could not reliably provide enough structure" [V].* **High.**

15. **Withhold final answers until the hint ladder is exhausted (pump → hint → prompt → assertion).** After any assertion, the child must solve an isomorphic item. Guard answer leakage with code-level checks (does the output contain the final answer?), not only with instructions.
    *Bastani −17% unguarded [V]; disclosure rates in benchmarks [S].* **High.**

16. **Adapt guidance to prior knowledge (expertise reversal).** Novices: worked example → faded example → attempt. Experienced learners: attempt first (productive-failure style) → targeted instruction that builds on their attempt. Fading is triggered by KT mastery, not by time.
    *Tetzlaff 2025 [S]; Sinha & Kapur 2021 [S]; Barbieri 2023 [S].* **High.**

17. **Keep spoken turns short and anchor them visually.** One idea per spoken chunk; a persistent on-screen element (number, diagram, keyword); instant "phir se" replay. Avoid spoken monologues over about 20-30 seconds (proposed limit; needs measurement).
    *Transient information effect [S]; segmenting and signalling [S]; system-paced design matters more [S].* **High** (principle) / **Low** (exact limit).

18. **Build retrieval, spacing, and interleaving into the scheduler**, not into the persona. Every session opens with 2-4 retrieval items from earlier sessions, spaced by an expanding schedule; practice sets interleave once the basic skill is acquired.
    *Agarwal 2021 [S]; Rohrer 2020 [S]; Cepeda [M].* **High.**

19. **Use concreteness fading for foundational maths and science** (place value, fractions, equivalence, measurement): concrete (Indian everyday objects) → pictorial → symbolic.
    *Fyfe et al. 2014 [S].* **Medium-High.**

20. **Feedback is specific, about the task and process, and true. Praise is about process, not inflated, never "you're so smart".**
    *Kluger & DeNisi 1996 [M]; Mueller & Dweck 1998 [M]; Brummelman 2014 [M].* **Medium-High.**

21. **No standalone growth-mindset curriculum or marketing.** Embed normalising-struggle language and strategy attributions.
    *Macnamara & Burgoyne 2023 [S]; Tipton 2023 [S].* **Medium.**

### C. Formats ("learning styles" → learning profile)

22. **Never label a child with a learning style, never run a learning-style quiz to route instruction, and never show style labels to parents.**
    *Pashler 2008 [S]; Rogowsky 2020 (5th graders) [S]; Clinton-Lisell & Litzinger 2024 [V]; Hattie & O'Leary 2025 [S].* **High.**

23. **Choose formats first by content-format fit and by prior knowledge**, then refine with the measured learning profile (section 8). Use dual coding by default for everyone: words plus relevant visuals.
    *Noetel 2022 [S]; expertise reversal [S]; content modality (Willingham) [M].* **High.**

24. **Songs, chants, and rhymes only for verbatim or sequence content** (tables, varnamala, ordered lists, formula wording), and only when the lyric *is* the content. No decorative songs or jokes inside concept explanations.
    *Seductive details d = −0.30 / −0.48 [S]; melody aids verbatim recall [M]; mixed results in young children [S].* **Medium-High.**

25. **Personalise context to the child's interests** (cricket, cooking, festivals, trains, local markets), learned conversationally and stored as a small set of interest tags.
    *Walkington 2013 [S]; 2024 meta: retention g = 0.48, transfer g = 0.36 [S].* **High.**

26. **Offer 2-4 low-stakes choices per session** (character, context, which problem first). Do not offer choices between the evidence-based core (retrieval, worked examples) and fluff.
    *Patall 2008 [S].* **Medium-High.**

27. **Game wrappers are fine; tangible-reward economies are not.** No points, coins, or unlocks paid per completed task; no streak-loss guilt. Celebrate mastery milestones informatively ("you can now do X, which you couldn't last week").
    *Deci, Koestner & Ryan 1999 (children more affected) [S]; Sailer & Homner 2020 [S].* **Medium-High.**

### D. Indian context

28. **Place by diagnosed level, not by class.** Onboarding runs a short adaptive diagnostic (oral for ages 6-9). The skill graph backward-chains to prerequisites, and grade-level content is reached through them. Report to parents in both terms ("Class 6 child, working on Class 4 fractions, closing the gap").
    *TaRL (Balsakhi +0.28 SD; UP camps 24% → 49%) [V]; Mindspark +0.37 SD; 5-6-grade spread within one class [S].* **High.**

29. **Language-agnostic answers, home-language concepts.** Accept Hindi, English, or Hinglish answers in any non-language subject. For ages 6-9, teach concepts in the home language with English terms as labels. Before launch, measure ASR WER on Indian children's Hinglish, by age band, and fall back to tap-to-answer when ASR confidence is low.
    *NEP 2020 [S]; HiACC code-switch WER +30-50% [V]; Kid-Whisper [S].* **High.**

30. **Design for the shared family phone and patchy data.** Multi-child profiles; parent-handover flows; offline lesson packs; low-bitrate audio; a latency budget; graceful degradation.
    *ASER 2024 device ownership [S]; Android 93% [S].* **Medium-High.**

### E. Relationship, safety, law

31. **Teacher with warmth, not a friend replacement.** The persona never claims to be human or to have feelings, never seeks exclusivity, and points the child outward to parents, siblings, friends, and teachers. Personal-problem disclosures get care plus a hand-off.
    *Common Sense 2025 [S]; APA 2025 [S]; UNICEF v3 [S]; anthropomorphism review [V]; MIT/OpenAI 2025 [S].* **High** (risk is established) / **Medium** (exact design efficacy).

32. **Parents see everything by default:** weekly evidence report, transcripts on request, safety alerts, time controls, and deletion.
    *DPDP 9(1) and Rule 10 [V]; FTC 6(b) focus on parental information [S]; SB 243 [S].* **High.**

33. **Crisis protocol, built and tested with child-safeguarding experts before launch.** India helplines (verify current numbers), parent notification logic, no "therapist" role-play.
    *SB 243 crisis protocols [S]; APA [S].* **High.**

34. **DPDP: get a legal opinion on section 9(3) before building the learning profile.** In parallel: verifiable parental consent via the Rule 10 routes (DigiLocker token or existing verified adult identity), data minimisation, no advertising, auditable consent records, and evaluation of a school-partnership route that could use the educational-institution exemption.
    *DPDP Act section 9 [S]; Rules 10 and 12, Fourth Schedule [V]; edtech commentary [S].* **High** (that the risk exists) / **Low** (on how it will be interpreted).

35. **Voice data: transcribe, then delete audio by default.** No voiceprints and no speaker-ID models. Any retained audio for ASR improvement needs separate, explicit, revocable parental opt-in.
    *COPPA 2025 amendments (biometrics, retention) [S]; FTC 2017 audio policy [M]; DPDP minimisation [V].* **High.**

### F. Evidence discipline (how Taxila proves it works)

36. **Every efficacy claim is measured on delayed, independent outcomes**: next-week retrieval, transfer items, and ideally an external test (an ASER-style tool or PARAKH-aligned items). Expect the effect to shrink at scale.
    *Kraft 2024/26 [S]; Khanmigo 2-year [V]; Kestin's immediate-test caveat [V].* **High.**

37. **Run micro-RCTs continuously, preregistered:** within-product randomisation of pedagogical moves, with delayed outcomes and a kill criterion for each feature. Use bandits for allocation *only* with uniform-random exploration floors and proper inference.
    *Medly micro-RCTs [V]; Rafferty 2019 [S].* **High.**

38. **Evaluate the tutor model on pedagogy, not solving.** Maintain an internal benchmark of Indian child dialogues scored for answer leakage, hint quality, probe quality, sycophancy, and misconception handling. Gate model or prompt changes on it.
    *MathTutorBench [V]; Yao et al. 2026 (r = 0.42) [V]; Arvin 2025 [V].* **High.**

---

## 7. Invisible probe catalogue

### 7.1 Catalogue

**Reliability** below means *validity as evidence that the child durably understood*. It is a judgment from the literature in section 1, **not yet calibrated on Taxila data**. Likelihood-ratio (LR) bands are design starting points to be replaced with measured values: High ≈ LR 3-10; Medium ≈ 1.5-3; Low ≈ 1.1-1.5.

**Ages:** ● good fit · ◐ use with adaptation · ○ avoid or low value. **Cost** is rough seconds of dialogue.

The "how the teacher runs it" column gives *shapes* of moves, not scripts.

| # | probe | how the teacher runs it | signal yielded | reliability | 6-9 | 10-15 | cost | main confounds / failure modes | evidence |
|---|---|---|---|---|---|---|---|---|---|
| P1 | **Teach-back to a protégé** | announce at the start; at the end the child explains to a character who "doesn't know"; the character asks one naive follow-up | coverage of expected answer components; misconception presence; vocabulary use | **High** | ◐ (care-receiving character, short, scaffolded) | ● | 60-120 | ASR errors; verbal fluency ≠ understanding (language-weak children under-score); LLM grader leniency | Chase 2009; Kobayashi 2019/24; AutoTutor EMT [S] |
| P2 | **"Why/how?" after a correct answer** | short follow-up after a correct answer: "how did you know?" or "why does that work?" | separates rote/guessed from reasoned; detects hidden misconceptions | **High** | ◐ (choice format: "because A or because B?") | ● | 15-30 | young children can't verbalise yet do understand (false negatives); overuse feels like distrust, so sample it | Imran & Bulathwela 2026 [V]; Bisra 2018 [V via Brod] |
| P3 | **Near-transfer variant** | same structure, new surface (new numbers or context, ideally the child's interest) | flexible schema vs memorised instance | **High** | ● | ● | 30-60 | variant accidentally easier or harder; surface too similar (tests recall) | ECD task models [M]; Eedi/LearnLM outcome [V] |
| P4 | **Real-life application (far transfer)** | apply the idea to a familiar Indian situation: market, cricket score, cooking, travel | depth and transfer | **High** (when passed) / ambiguous when failed | ◐ | ● | 45-90 | failure may reflect an unfamiliar context, not the concept; cultural fit | Walkington 2013 [S]; competency-based CBSE items [S] |
| P5 | **Predict-before-reveal (POE)** | "What do you think will happen if…?" before showing or telling; then reveal and ask "why the difference?" | the child's prior model; misconception identity; surprise as a learning moment | **Medium-High** (as misconception evidence) | ◐ (explicit resolution) | ● | 30-60 | guessing; low-EF children don't learn from the conflict | Brod 2018/2020/2021 [S]/[V] |
| P6 | **Teacher's deliberate mistake** | teacher "solves" with one planted error typical of a known misconception and asks the child to check; always resolved | discrimination; misconception absence; confidence in correct knowledge | **Medium-High** (after basic mastery) | ○/◐ (only well-mastered, simple content) | ● | 30-60 | novices adopt the error; children defer to authority (false negative); LLM sycophancy in grading the catch | Große & Renkl 2007; McLaren 2016; Barbieri 2023 [S]; Arvin 2025 [V] |
| P7 | **Spoken diagnostic choice** | two or three spoken options where each wrong option maps to a known misconception | misconception identity | **High** for *which* misconception / **Medium** for mastery (guessing at 33-50%) | ● (2 options, with visuals) | ● | 15-30 | guessing; wording artefacts; ASR on option labels (use tap fallback) | Eedi [S] |
| P8 | **Contrasting cases** | "These two look similar; what's different, and which one is a [concept]?" | category boundaries; key-feature recognition | **Medium-High** | ● (visual pairs) | ● | 30-45 | perceptual rather than conceptual difference | contrasting-cases literature [M]; interleaving logic [S] |
| P9 | **"Which method?" (interleaved)** | mixed problem types; ask which strategy before solving | strategy selection (often the real gap) | **High** (maths) | ◐ | ● | 15-30 | needs several taught strategies | Rohrer 2020 [S] |
| P10 | **Delayed retrieval** | at the next session's start, re-ask a key item or a variant from days ago, without warning | durable learning; forgetting rate (feeds spacing) | **Highest** | ● | ● | 15-30 | interference from intervening practice; topic seen elsewhere (school) | Agarwal 2021 [S]; Cepeda [M] |
| P11 | **Delayed "main idea in a few words"** | at the end of the session or the next one: "tell me the big idea of yesterday in one line" | gist comprehension; also better self-monitoring | **Medium-High** | ◐ | ● | 20-40 | verbal ability; ASR | Thiede 2003 (G = 0.70 vs 0.29) [S] |
| P12 | **Confidence bet** | before feedback: "a little sure or very sure?" | calibration; and (as a learning move) hypercorrection | **Low** (6-9) / **Medium** (10-15) as evidence; **High** value as a learning move | ◐ (learning move only) | ● | 5 | overconfidence in young children; social desirability | Metcalfe & Finn 2012; development reviews [S] |
| P13 | **Reverse / inverse problem** | give the answer and ask for a question or situation that produces it | flexible, generative knowledge | **Medium-High** | ○/◐ | ● | 30-60 | open-ended grading difficulty | [M] (problem-posing literature; weakly verified) |
| P14 | **Representation translation** | move between words, numbers, and picture: "show it on the number line / say it as a story" | conceptual vs symbolic-only knowledge | **Medium-High** | ● (with on-screen manipulative) | ● | 30-60 | interface skill confounds (tapping or drawing) | concreteness fading [S]; multimedia [S] |
| P15 | **Hint-ladder consumption** | log how many pumps, hints, and prompts were needed before success | the amount of assistance needed; the best KT input | **High** (as a KT feature) | ● | ● | 0 (passive) | child asking for hints strategically (gaming) | AutoTutor [S]; KT practice [M] |
| P16 | **Self-correction in a turn** | passive: the child revises their own answer before feedback | active monitoring (positive) | **Medium** | ● | ● | 0 | ASR splitting turns | West 2025 (disfluency link) [V]; metacognition [S] |
| P17 | **Child-initiated questions** | passive, invited occasionally ("what would you like to ask about this?") | depth of engagement; deep questions indicate comprehension | **Medium** (rare in 6-9) | ○ | ◐ | 0-20 | personality and shyness; culture of not questioning teachers | Graesser & Person 1994 [V]; Brod: questioning ineffective before secondary [V] |
| P18 | **Response onset latency** | passive; normalised per child × question type × language | effort and uncertainty (tie-breaker) | **Low** | ◐ | ◐ | 0 | ASR/VAD errors, network lag, language switching, distraction at home | Casillas 2016; Brennan & Williams 1995; Kendrick & Torreira 2015 [S] |
| P19 | **Disfluency and hedges** | passive: fillers ("umm", "matlab"), hedges ("shayad", "I think") | uncertainty (tie-breaker) | **Low-Medium** | ◐ | ◐ | 0 | Hinglish discourse markers are not uncertainty; ASR drops fillers | West 2025 [V]; Krahmer & Swerts 2005 [S] |
| P20 | **"Pata nahi" / silence / minimal-answer loops** | passive pattern over 3+ turns | unresolved confusion → frustration → boredom | **Medium** (for affect state) | ● | ● | 0 | shyness; a parent present; noise | D'Mello & Graesser 2012; Baker 2010 [S] |
| P21 | **Wheel-spinning detector** | passive: no 3-in-a-row within about 10 opportunities on a skill | stuck on the current approach | **High** (as a "change approach" trigger) | ● | ● | 0 | skill-graph granularity | Beck & Gong 2013 [S] |
| P22 | **Gaming detector** | passive: rapid guesses, cycling options, "just tell me", hint spam | engagement validity (discount other evidence) | **Medium** | ● | ● | 0 | fast-but-correct experts mistaken for gamers | Baker 2010 [S] |
| P23 | **Instruction paraphrase** | "Tell me what we're going to do" before a multi-step task | task comprehension (common failure for 6-9) | **Medium** | ● | ◐ | 10-20 | verbal ability | multimedia/segmenting [S]; [M] |
| P24 | **Unprompted connection** | passive: the child links the idea to something else ("this is like…") | integration | **High** when present; cannot be elicited on demand | ◐ | ● | 0 | rare | ICAP constructive [S] |

**Probes Taxila should not use as evidence:** "Samjha? / Do you understand? / Is it clear?" [V]; a single correct answer to a recall item, alone [V]; acoustic emotion classifier output [S]; immediate self-rating of learning [S]; time-on-task as learning (Kestin found no correlation between time and post-test score) [V].

### 7.2 Signal fusion rules

1. **Evidence accumulates; single cues don't decide.** Maintain per-skill mastery as a probability. Each probe outcome updates it by its (eventually calibrated) likelihood ratio. Passive paralinguistic signals are capped at a small update.
2. **Base rates matter.** Rare-event detectors (hidden misconceptions, affect) produce mostly false alarms at realistic prevalence (8:1 in the Eedi hidden-misconception data) [V]. So a detector *triggers a verifying probe* and never acts directly.
3. **Low ASR confidence = no evidence.** Ask again, rephrase, or switch to tap-to-answer. Never score an uncertain transcript as wrong.
4. **Gaming and inattention discount everything else** recorded in that window.
5. **Probe budget.** Covert probes cost time and, overused, feel like an interrogation. As a starting policy (to be tuned): one generative or transfer probe per concept, a "why?" on about 30-50% of correct answers for consolidating skills and 100% for new ones, 2-4 delayed retrieval items per session start, and paralinguistic signals free.
6. **Calibrate against the truth Taxila can observe.** The calibration target for every probe's likelihood ratio is performance on *delayed* items (P10) and periodic external benchmark items. Re-estimate per age band and language mix.

---

## 8. Learning profile model: specification

### 8.1 Purpose and claims

**Purpose:** choose, for this child and this kind of topic, the teaching format most likely to produce **durable learning**, while keeping the child engaged and giving them real choices. This replaces "learning styles".

**Defensible claims (marketing and parents):**
- "Taxila keeps measuring which kinds of explanation help your child *remember and use* what they learned, a week later, for each kind of topic."
- "It notices what your child enjoys and gives them choices."
- "You can see the evidence behind every adjustment."

**Indefensible claims (do not use):** "identifies your child's learning style"; "your child is a visual/auditory/musical learner"; "teaches in your child's learning style"; any claim of a measured improvement that the section 8.7 evaluation has not produced.

### 8.2 Components

```
LearningProfile(child) = {
  knowledge:   per-skill mastery state                        # §8.3  (drives what to teach)
  priorKnow:   per-domain prior-knowledge level               # derived from knowledge; drives guidance level
  formatFit:   per (formatFamily × topicType) efficacy posterior   # §8.4  (drives how to teach)
  engagement:  per (formatFamily × topicType) engagement posterior # §8.5  (constraint)
  preference:  stated + revealed preferences, interest tags   # §8.5  (choice, context, tie-breaks)
  meta:        evidence counts, last-updated, decay state, consent scope
}
```

### 8.3 Knowledge layer (what to teach)

- **Skill graph:** NCERT/NCF learning outcomes broken into skills, with prerequisite edges spanning grades (a Class 7 skill can depend on a Class 3 skill). Each skill links to items, expectations (for P1/P2 grading), misconceptions (for P5-P7 diagnosis), and remediation moves.
- **Model:** a BKT-family model with forgetting and a per-child ability term, or an Elo/IRT-style rating per skill. Inputs: correctness without hints, hint-ladder depth (P15), probe outcomes (P1-P14) weighted by likelihood ratio, delayed retrieval (P10, weighted highest).
- **States:** `unseen → introduced → practising → learned-today → mastered (needs delayed success) → due-for-review`. Plus misconception flags `{misconceptionId, evidenceCount, lastSeen, resolved?}`.
- **Textual summary:** an LLM-written, human-readable summary of what the child knows, can't yet do, and their active misconceptions, regenerated from the ledger. It is *derived from* the numeric state, never the source of truth. It is good for parent reports and for the tutor's context window.

### 8.4 Format-efficacy layer (how to teach)

**Format families** (not styles; each is a *teaching move* with an evidence base):

| id | format family | evidence status | default use |
|---|---|---|---|
| F1 | Short spoken explanation + on-screen anchor (dual coding) | strong (multimedia, dual coding) | default for all |
| F2 | Worked example → faded example | strong for novices (g = 0.48; expertise reversal) | low prior knowledge |
| F3 | Visual-first (diagram, number line, manipulative) with narration | strong *where content is spatial or quantitative* | content-fit driven |
| F4 | Story or real-life context from the child's interests | strong (interest meta g = 0.36-0.55) | everywhere context can be swapped |
| F5 | Rhythm, chant, song for verbatim sequences | moderate, verbatim only | only for topicType = sequence/verbatim |
| F6 | Game or challenge wrapper (no tangible reward economy) | moderate (gamification g = 0.49 cognitive) | practice phases |
| F7 | Learn-by-teaching (protégé) | strong for 10-15, moderate for 6-9 | end-of-concept consolidation |
| F8 | Attempt-first (productive failure) → instruction | strong *with prior knowledge and fidelity* | medium/high prior knowledge only |

**Topic types:** T1 verbatim/sequence facts · T2 vocabulary and language · T3 concepts and explanations (science "why") · T4 procedures (algorithms) · T5 problem-solving and reasoning (word problems, competency items).

**Outcome (reward) for format comparisons:** the probability of success on **delayed** items (the next session or later), plus near-transfer items, for skills taught primarily in that format. Immediate correctness is recorded but **must not** be the reward, because it optimises for "easy and fluent" (section 2.6).

**Model:** hierarchical Bayesian, for example `logit P(delayed success) = skillDifficulty + childAbility + β[format, topicType] + u[child, format, topicType]`. Here β is the population effect, and u is the child-level deviation, shrunk toward 0 by a prior learned from the population. Most children's u will stay near 0, and that is the honest expectation (Schmucker et al. 2025; Hattie & O'Leary 2025).

**Priors (before any per-child data):**
- β from content-format fit (e.g., T1 favours F5; geometry and fractions favour F3; T3 favours F1 + F7) and from global experiments.
- Prior knowledge gates F2 vs F8 (expertise reversal); this is a *rule*, not a learned preference.

**Allocation policy:**
1. Hard constraints first: expertise-reversal gate; F5 only for T1/T2; the evidence-based core (retrieval, spacing, worked examples for novices) is never subject to the bandit.
2. Among eligible formats, use Thompson sampling on the delayed-success posterior with a **uniform-random exploration floor** (e.g., ≥ 10-20% of allocations), so that population-level effects stay estimable (Rafferty 2019).
3. Compare formats on *matched* skills of similar difficulty, so that a format is not credited with an easy topic's success.
4. **Engagement constraint:** if the chosen format's predicted engagement for this child is below a threshold, choose the next-best format that clears it.
5. **Choice:** when two or more formats are within a small margin of expected learning, *offer the child the choice* (2-3 options) instead of deciding silently. This is autonomy at zero learning cost.

**Decay:** child-level u estimates decay toward the population prior, with a half-life of a few months (to tune), because children change quickly between ages 6 and 15.

**Thresholds before anything is shown to a parent as "Taxila found":** posterior probability ≥ 0.9 that format A beats B by a meaningful margin for this child × topic type, based on ≥ N delayed comparisons (N to be set by simulation; likely ≥ 8-10). Otherwise the report says "still learning what works best for [topic type]".

### 8.5 Engagement and preference layers

- **Engagement signals:** session start without prompting, session completion, voluntary continuation ("one more?"), time to drop-off, disengagement patterns (P20, P22), and return the next day. Modelled per format × topic type as a constraint, never as the objective.
- **Stated preference:** a light, conversational check every few weeks ("which did you like more, the story way or the picture way?"). **Revealed preference:** the child's choices when offered.
- **Interest tags:** a small set of interests (cricket, cooking, animals, trains, films) learned in conversation, used for F4 contexts. Parent-visible and editable. Sensitive categories (religion, caste, family situation) are excluded and never inferred.

### 8.6 Privacy, consent, and safety constraints (binding)

- **Legal gate:** the learning profile ships only after the section 9(3) DPDP opinion (rule 34). Where the opinion requires it, run in the narrowest mode: knowledge layer plus session-scoped format choice, with no cross-session format modelling.
- **Data stored:** skill states, probe outcomes (structured), misconception flags, format allocations and outcomes, interest tags, and consent records. **Not stored:** raw audio (delete after transcription by default), voiceprints, inferred emotions, personality traits, or free-text "about the child" notes beyond the derived learning summary.
- **Purpose limitation:** used only to teach this child. No advertising, no resale, no cross-product profiling.
- **Parent controls:** view, export, correct interest tags, reset the profile, delete the account; all logged.
- **No labels:** the system never emits "visual/auditory learner" or any fixed-type label, internally or externally.

### 8.7 How we find out whether the profile helps (falsification plan)

- **Experiment E-PROFILE:** randomise children to (A) profile-driven format allocation or (B) the population-best format per topic type, with the same knowledge layer, scheduler, and choice offers. Primary outcome: delayed retention and transfer on matched held-out items at 1 and 4 weeks. Secondary: engagement and retention of users. Preregister. Power with the bandit inflation factor in mind (≥ 2x).
- **Kill criterion:** if (A) fails to beat (B) by a pre-set minimal effect on delayed outcomes after the planned sample, **drop per-child format personalisation** and keep only population-best formats, choice offers, interest contexts, and the knowledge layer. The product can still honestly say it adapts to *what your child knows* and *what they enjoy*. Literature priors suggest this outcome is quite likely, so plan the messaging for it.

---

## 9. What to measure first (pre-launch research backlog)

| id | question | why first | method sketch |
|---|---|---|---|
| E1 | ASR WER and endpointing behaviour on Indian children's Hindi/English/Hinglish, by age band, on target phones | every speech-derived signal depends on it | record about 50-100 children (with consent), hand-transcribe, compute WER and cut-off rates by age, language mix, and noise |
| E2 | Agreement between LLM grading of teach-back and "why?" answers and expert teachers | probes P1-P4 depend on it | 300+ child explanations, two teacher raters, κ against the LLM with the expectation/misconception rubric |
| E3 | Validity of latency and disfluency as accuracy predictors in our pipeline | decides whether P18/P19 are kept | logistic model of correctness on normalised latency/disfluency, controlling for item difficulty and ASR confidence |
| E4 | Optimal spoken-segment length and wait time per age band | rules 8 and 17 | within-child micro-RCT of segment lengths; outcomes are immediate and delayed recall |
| E5 | Delayed-retention effect of teach-back with announced expectancy vs none | rule 4 | micro-RCT |
| E6 | E-PROFILE (section 8.7) | the core claim of the "learning styles" reframe | preregistered RCT |
| E7 | Relationship-health indicators (attachment talk, disclosures, session-length creep, late-night use) | safety | monitor aggregate rates; review flagged transcripts with a child-safeguarding advisor |
| E8 | Diagnostic placement accuracy vs an ASER-style oral test | rule 28 | compare placements on 100+ children |

---

## 10. References

Grouped by section; tags as in section 0.

### Comprehension detection, tutoring dialogue, metacognition
- Graesser, A. C., & Person, N. K. (1994). Question asking during tutoring. *AERJ* 31(1):104-137. https://journals.sagepub.com/doi/10.3102/00028312031001104 · PDF https://gwern.net/doc/psychology/spaced-repetition/1994-graesser.pdf [V via search excerpt]
- Person, N. K., Graesser, A. C., Magliano, J. P., & Kreuz, R. J. (1994). Inferring what the student knows in one-to-one tutoring. https://digitalcommons.memphis.edu/facpubs/8069/ [S]
- Chi, M. T. H., Siler, S. A., Jeong, H., Yamauchi, T., & Hausmann, R. G. (2001). Learning from human tutoring. *Cognitive Science* 25:471-533. https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog2504_1 [S]
- Chi, M. T. H., Siler, S. A., & Jeong, H. (2004). Can tutors monitor students' understanding accurately? *Cognition and Instruction* 22(3):363-387. [M for findings]
- Chi, M. T. H., & Wylie, R. (2014). The ICAP framework. *Educational Psychologist* 49(4):219-243. https://education.asu.edu/sites/g/files/litvpz656/files/lcl/chiwylie2014icap_2.pdf [S]
- D'Mello, S., Lehman, B., & Person, N. (2010). Expert tutors' feedback is immediate, direct, and discriminating. FLAIRS-23. https://cdn.aaai.org/ocs/1215/1215-7820-1-PB.pdf [V]
- Lepper & Woolverton, INSPIRE model. https://www.eoas.ubc.ca/research/cwsei/resources/INSPIRE-Guidelines.pdf [S]
- Graesser et al., AutoTutor; Nye, Graesser & Hu (2014) AutoTutor and family. https://link.springer.com/article/10.1007/s40593-014-0029-5 [S]
- Mills, C. M., & Keil, F. C. (2004). Knowing the limits of one's understanding. *J Exp Child Psychol*. [S]
- Metacognitive development reviews: https://link.springer.com/article/10.1007/s11409-014-9133-z ; https://pmc.ncbi.nlm.nih.gov/articles/PMC12598454/ [S]
- Metcalfe, J., & Finn, B. (2012). Hypercorrection of high confidence errors in children. *L&I*. https://www.columbia.edu/cu/psychology/metcalfe/PDFs/MetcalfeFinn2012.pdf [S]
- Thiede, K. W., Anderson, M. C. M., & Therriault, D. (2003). Accuracy of metacognitive monitoring affects learning of texts. https://wp.stolaf.edu/cila/files/2012/11/thiede_jedp.pdf [S]
- Shute, V. J., stealth assessment and Physics Playground. https://myweb.fsu.edu/vshute/pdf/ShuteMoore.pdf ; https://files.eric.ed.gov/fulltext/ED612156.pdf [S]
- Chase, C. C., Chin, D. B., Oppezzo, M. A., & Schwartz, D. L. (2009). Teachable agents and the protégé effect. *J Sci Educ Technol* 18:334-352. https://link.springer.com/article/10.1007/s10956-009-9180-4 [S]
- Kobayashi, K. (2019). Learning by preparing-to-teach and teaching: a meta-analysis. *Jpn Psychol Res*. https://onlinelibrary.wiley.com/doi/10.1111/jpr.12221 [S]
- Kobayashi, K. (2024). Interactive learning effects of preparing to teach and teaching. *EPR*. https://link.springer.com/article/10.1007/s10648-024-09871-4 [S]
- Brod, G., Hasselhorn, M., & Bunge, S. A. (2018). When generating a prediction boosts learning. *L&I* 55:22-31. https://escholarship.org/content/qt0qn99739/qt0qn99739.pdf [S]
- Brod, G., Breitwieser, J., Hasselhorn, M., & Bunge, S. A. (2020). Being proven wrong elicits learning in children, but only in those with higher executive function skills. *Dev Science*. https://onlinelibrary.wiley.com/doi/10.1111/desc.12916 [V]
- Brod, G. (2021). Generative learning: which strategies for what age? *EPR* 33:1295-1318. https://d-nb.info/1222972298/34 [V]
- McLaren, B. M., Adams, D. M., et al. (2016). Delayed learning effects with erroneous examples. *IJAIED*. https://link.springer.com/article/10.1007/s40593-015-0064-x [S]
- Große, C. S., & Renkl, A. (2007). Finding and fixing errors in worked examples. *L&I*. https://www.researchgate.net/publication/248498146 [S]
- Wong, S. S. H., & Lim, S. W. H. (2022). The derring effect. *JEP:General* 151(1):25-40; failed replications: https://discovery.ucl.ac.uk/id/eprint/10203955/ [S]
- Imran, M., & Bulathwela, S. (2026). The correct answer trap. arXiv 2606.23205. https://arxiv.org/abs/2606.23205 [V]
- Arvin, C. (2025). "Check my work?": measuring sycophancy in a simulated educational context. arXiv 2506.10297. https://arxiv.org/abs/2506.10297 [V]

### Speech, prosody, affect
- Stivers, T., et al. (2009). Universals and cultural variation in turn-taking. *PNAS*. https://www.pnas.org/doi/10.1073/pnas.0903616106 [S]
- Kendrick, K. H., & Torreira, F. (2015). The timing and construction of preference. *Discourse Processes*. https://eric.ed.gov/?id=EJ1059968 [S]
- Casillas, M., Bobb, S. C., & Clark, E. V. (2016). Turn-taking, timing, and planning in early language acquisition. *J Child Lang*. https://chatterlab.uchicago.edu/lab-publications/Casillas_et_al_2016_Turn_taking_timing_and_planning_in_early_language_acquisition_JCL.pdf [S]
- Brennan, S. E., & Williams, M. (1995). The feeling of another's knowing. *JML* 34:383-398. [S]
- Krahmer, E., & Swerts, M. (2005). How children and adults produce and perceive uncertainty in audiovisual speech. *Language and Speech* 48(1):29-54. https://repository.tilburguniversity.edu/server/api/core/bitstreams/1f83ced7-120c-422a-90f8-baaf94d4f95a/content [S]
- West, E., Baer, C., Yu, L., & Odic, D. (2025). Do young children use verbal disfluency as a cue to their own confidence? *Dev Science*. https://onlinelibrary.wiley.com/doi/10.1111/desc.13617 [V]
- Forbes-Riley, K., & Litman, D. (2011). Benefits and challenges of real-time uncertainty detection and adaptation in a spoken dialogue computer tutor. *Speech Communication*. https://www.sciencedirect.com/science/article/abs/pii/S0167639311000318 ; https://people.cs.pitt.edu/~litman/50910060.pdf [S]
- D'Mello, S., & Graesser, A. (2012). Dynamics of affective states during complex learning. *L&I* 22(2):145-157. https://eric.ed.gov/?id=EJ950444 [S]
- D'Mello, S., Lehman, B., Pekrun, R., & Graesser, A. (2014). Confusion can be beneficial for learning. *L&I* 29:153-170. https://acuresearchbank.acu.edu.au/item/8v7v6/confusion-can-be-beneficial-for-learning [S]
- Baker, R. S., D'Mello, S. K., Rodrigo, M. M. T., & Graesser, A. C. (2010). Better to be frustrated than bored. *IJHCS* 68:223-241. https://archium.ateneo.edu/discs-faculty-pubs/92/ [S]
- D'Mello, S. K., et al. (2008). Automatic detection of learner's affect from conversational cues. *UMUAI* 18:45-80. https://link.springer.com/article/10.1007/s11257-007-9037-6 [S]
- Speech emotion recognition in adults and children: a review (2025). https://link.springer.com/article/10.1007/s10772-025-10229-6 [S]
- Kid-Whisper (AIES). https://ojs.aaai.org/index.php/AIES/article/view/31618 [S]
- Singh, S., Singh, M., & Kadyan, V. (2025). HiACC: Hinglish adult & children code-switched corpus. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12329218/ [V]

### Knowledge tracing and misconceptions
- Khajah, M., Lindsey, R., & Mozer, M. (2016). How deep is knowledge tracing? EDM. https://arxiv.org/pdf/1604.02416 [S]
- Xiong, X., Zhao, S., Van Inwegen, E., & Beck, J. (2016). Going deeper with deep knowledge tracing. EDM. http://beardeer.github.io/wpi_public_html/papers/edm_2016_xiong_zhao.pdf [S]
- Piech, C., et al. (2015). Deep knowledge tracing. https://web.stanford.edu/~cpiech/bio/papers/deepKnowledgeTracing.pdf [S]
- Bhattacharyya, P., Mitton, J., Abboud, R., & Woodhead, S. (2026). Specialised knowledge tracing models outperform LLMs. EDM 2026. https://arxiv.org/abs/2603.02830 [V]
- Scarlatos, A., Baker, R. S., & Lan, A. (2025). Exploring knowledge tracing in tutor-student dialogues using LLMs. LAK 2025. https://doi.org/10.1145/3706468.3706501 [V]
- Berthon, A., & van der Schaar, M. (2025/26). Language bottleneck models for qualitative knowledge state modeling. https://arxiv.org/abs/2506.16982 [V]
- Beck, J. E., & Gong, Y. (2013). Wheel-spinning: students who fail to master a skill. AIED. [S]
- Eedi, Mining Misconceptions in Mathematics (Kaggle 2024). https://www.kaggle.com/competitions/eedi-mining-misconceptions-in-mathematics [S]
- A benchmark for math misconceptions (2025). https://link.springer.com/article/10.1007/s44217-025-00742-w [S]

### Learning styles, multimedia, personalization
- Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: concepts and evidence. *PSPI* 9(3):105-119. https://digitalcommons.usf.edu/psy_facpub/1765/ [S]
- Rogowsky, B. A., Calhoun, B. M., & Tallal, P. (2015). *J Educ Psych*. https://www.apa.org/pubs/journals/features/edu-a0037478.pdf ; (2020) *Frontiers in Psychology*. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.00164/full [S]
- Knoll, A. R., Otani, H., Skeel, R. L., & Van Horn, K. R. (2017). *Br J Psych* 108(3):544-563. doi:10.1111/bjop.12214 [S]
- Husmann, P. R., & O'Loughlin, V. D. (2019). *Anat Sci Educ*. https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ase.1777 [S]
- Clinton-Lisell, V., & Litzinger, C. (2024). Is it really a neuromyth? *Frontiers in Psych*. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1428732/full [V]
- Hattie, J., & O'Leary, T. (2025). Learning styles, preferences, or strategies? *EPR*. doi:10.1007/s10648-025-10002-w [S]
- Newton, P. M., & Salvi, A. (2020). How common is belief in the learning styles neuromyth? *Front Educ*. doi:10.3389/feduc.2020.602451 [S]
- Noetel, M., et al. (2022). Multimedia design for learning: meta-meta-analysis. *RER* 92(3):413-454. https://journals.sagepub.com/doi/abs/10.3102/00346543211052329 [S]
- Ginns, P. (2005). Meta-analysis of the modality effect. *L&I* 15:313-331; Reinwein, J. (2012). Does the modality effect exist? https://link.springer.com/article/10.1007/s10936-011-9180-4 [S]
- Leahy, W., & Sweller, J. (2011). Cognitive load theory, modality of presentation and the transient information effect. https://www.researchgate.net/publication/230074023 [S]
- Rey, G. D. (2012). Meta-analysis of the seductive detail effect; Sundararajan & Adesope (2020). https://link.springer.com/article/10.1007/s10648-020-09522-4 [S]
- Walkington, C. (2013). *J Educ Psych* 105(4):932-945. [S]
- Personalized learning by interest meta-analysis (2024). *EPR*. https://link.springer.com/article/10.1007/s10648-024-09933-7 [S]
- Patall, E. A., Cooper, H., & Robinson, J. C. (2008). Effects of choice. *Psych Bull* 134:270-300. https://selfdeterminationtheory.org/wp-content/uploads/2019/10/2008_PatallCooperRobinson_PsychBulletin.pdf [S]
- Tetzlaff, L., Simonsmeier, B., Peters, T., & Brod, G. (2025). A cornerstone of adaptivity: a meta-analysis of the expertise reversal effect. *L&I* 98. https://www.sciencedirect.com/science/article/pii/S0959475225000660 [S]
- Kornell, N., & Bjork, R. A. (2008). https://web.williams.edu/Psychology/Faculty/Kornell/Publications/Kornell.Bjork.2008a.pdf [S]; Deslauriers, L., et al. (2019). *PNAS*. https://e.math.cornell.edu/sites/activelearn/active-learning-resources/active_learning_Deslauriers_et_al.pdf [S]
- Sailer, M., & Homner, L. (2020). The gamification of learning: a meta-analysis. *EPR* 32:77-112. [S]
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). *Psych Bull* 125:627-668. https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf [S]
- Clément, B., Roy, D., Oudeyer, P.-Y., & Lopes, M. (2015). Multi-armed bandits for intelligent tutoring systems. *JEDM*. https://arxiv.org/pdf/1310.3174 [S]
- Rafferty, A., Ying, H., & Williams, J. J. (2019). Statistical consequences of using multi-armed bandits. *JEDM* 11(1):47-79. https://eric.ed.gov/?id=EJ1220507 [S]
- Schmucker, R., et al. (2025). Learning to optimize feedback for one million students. https://arxiv.org/abs/2508.00270 [V]
- Song and memory: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5767298/ ; https://www.cambridge.org/core/journals/journal-of-child-language/article/spoken-or-sung-examining-word-learning-in-childdirected-speech-and-in-song/C70C79DE915B639AE84D2BC6D710D95B [S]

### AI tutoring evidence
- Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). AI tutoring outperforms in-class active learning. *Sci Rep*. https://www.nature.com/articles/s41598-025-97652-6 (PMC12179260) [V]
- Bastani, H., et al. (2025). Generative AI without guardrails can harm learning. *PNAS* 122(26). https://www.pnas.org/doi/10.1073/pnas.2422633122 [V]
- De Simone, M. E., et al. (2025). From chalkboards to chatbots (World Bank WPS 11125). https://ideas.repec.org/p/wbk/wbrwps/11125.html [S]
- Wang, R., Ribeiro, A., Robinson, C., Loeb, S., & Demszky, D. Tutor CoPilot. https://arxiv.org/abs/2410.03017 [S]
- LearnLM Team & Eedi (2025). AI tutoring can safely and effectively support students. https://arxiv.org/abs/2512.23633 [V]; scaled RCT registry https://www.socialscienceregistry.org/trials/18079 [V]
- Oreopoulos, P., & Low, N. (2026). One click away: AI tutoring with Khanmigo in a two-year school experiment. EdWorkingPaper 26-1551. https://edworkingpapers.com/sites/default/files/ai26-1551.pdf [V]
- Harrison, W., et al. (2026). Practitioner-led micro-randomised trials of an AI tutoring platform in GCSE science. https://arxiv.org/abs/2609.14789 [V]
- Yang, S., Van Alstyne, M., & Dellarocas, C. (2026). When AI tutors speak. https://arxiv.org/abs/2609.23958 [V]
- Contractor, Z., & Reyes, G. (2026). Experimental evidence on the learning impact of generative AI. https://arxiv.org/abs/2607.08849 [V]
- Henkel, O., et al. (2024). Effective and scalable math support (Rori, Ghana). https://arxiv.org/abs/2402.09809 [S]
- Muralidharan, K., Singh, A., & Ganimian, A. (2019). Disrupting education? *AER* 109(4):1426-60. https://www.aeaweb.org/articles?id=10.1257%2Faer.20171112 [S]
- von Hippel, P. (2024). Two-sigma tutoring. *Education Next*. https://www.educationnext.org/two-sigma-tutoring-separating-science-fiction-from-science-fact/ [S]
- Nickow, A., Oreopoulos, P., & Quan, V. (2020). https://www.nber.org/papers/w27476 [S]; Kraft, M., Schueler, B., & Falken, G. What impacts should we expect from tutoring at scale? https://edworkingpapers.com/sites/default/files/ai24-1031.pdf [S]
- VanLehn, K. (2011). *Educational Psychologist*. https://eric.ed.gov/?id=EJ946764 [S]
- Macina, J., et al. (2025). MathTutorBench. EMNLP. https://aclanthology.org/2025.emnlp-main.11/ [V]; Yao, J., et al. (2026). Beyond helpfulness. https://arxiv.org/abs/2606.16206 [V]
- LearnLM (2025). Evaluating Gemini in an arena for learning. https://arxiv.org/abs/2505.24477 [S]; Jurenka et al. (2024). https://arxiv.org/abs/2407.12687 [S]
- Alpha School evidence status: https://www.theargumentmag.com/p/why-parents-love-a-school-with-bogus ; https://en.wikipedia.org/wiki/Alpha_School [S]
- Sinha, T., & Kapur, M. (2021). When problem solving followed by instruction works. *RER* 91(5):761-798. https://journals.sagepub.com/doi/pdf/10.3102/00346543211019105 [S]
- Rohrer, D., Dedrick, R. F., Hartwig, M. K., & Cheung, C.-N. (2020). A randomized controlled trial of interleaved mathematics practice. *J Educ Psych* 112(1):40-52. https://eric.ed.gov/?id=EJ1237752 [S]
- Agarwal, P. K., Nunes, L. D., & Blunt, J. R. (2021). *EPR*. https://link.springer.com/article/10.1007/s10648-021-09595-9 [S]
- Barbieri, C. A., et al. (2023). A meta-analysis of the worked examples effect on mathematics performance. *EPR*. https://link.springer.com/article/10.1007/s10648-023-09745-1 [S]
- Rittle-Johnson, B., Loehr, A. M., & Durkin, K. (2017). *ZDM* 49:599-611. [S]
- Fyfe, E. R., McNeil, N. M., Son, J. Y., & Goldstone, R. L. (2014). Concreteness fading. *EPR*. https://link.springer.com/article/10.1007/s10648-014-9249-3 [S]
- Macnamara, B. N., & Burgoyne, A. P. (2023). *Psych Bull*. https://artscimedia.case.edu/wp-content/uploads/sites/141/2020/06/26110416/Macnamara-Burgoyne-2023.pdf [S]; Tipton et al. (2023) commentary [S]

### Children and AI relationships, regulation
- Xu, Y., et al. (2022). Dialogue with a conversational agent promotes children's story comprehension. *Child Development* 93:e149-e167. https://onlinelibrary.wiley.com/doi/10.1111/cdev.13708 [S]
- Jayathilake, H. M., & Ma, R. (2026). Anthropomorphism in children's interactions with LLM chatbots: a systematic review. ACM IDC '26. https://arxiv.org/abs/2607.18250 [V]
- Common Sense Media (2025). AI risk assessment: social AI companions. https://www.commonsensemedia.org/sites/default/files/pug/csm-ai-risk-assessment-social-ai-companions_final.pdf [S]
- MIT Media Lab / OpenAI (2025) affective use studies. https://pmc.ncbi.nlm.nih.gov/articles/PMC12137280/ (critical perspective) [S]
- FTC (2025). FTC launches inquiry into AI chatbots acting as companions. https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions [S]
- California SB 243 summaries: https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/ ; https://www.skadden.com/insights/publications/2025/10/new-california-companion-chatbot-law [S]
- Character.AI under-18 changes: https://blog.character.ai/u18-chat-announcement/ [S]
- APA (2025). Health advisory on AI and adolescent well-being. https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-ai-adolescent-well-being.pdf [S]
- UNICEF Innocenti (2025). Guidance on AI and children v3. https://www.unicef.org/innocenti/reports/policy-guidance-ai-children ; checklist https://www.unicef.org/innocenti/media/11996/file/UNICEF-Innocenti-Guidance-on-AI-and-Children-3-Checklist-2025.pdf [S]
- DPDP Act 2023, section 9: https://www.dpdpa.com/dpdpa2023/chapter-2/section9.html [S]; DPDP Rules 2025, Rule 10: https://dpdprules.org/rules/10 [V]; Fourth Schedule: https://dpdprules.org/rules/fourth-schedule [V]
- Edtech interpretation commentary: https://www.mondaq.com/india/privacy-protection/1710322/ [S]; https://www.pacta.in/post/impact-of-dpdp-rules-on-educational-institutions-part-ii-of-a-3-part-series [S]
- COPPA amended rule (2025): https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect ; https://www.hunton.com/privacy-and-information-security-law/ftc-publishes-final-coppa-rule-amendments [S]

### Indian context
- ASER 2024 (Annual Status of Education Report): https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2099725 ; https://www.drishtiias.com/daily-updates/daily-news-analysis/aser-2024-and-elementary-education [S]
- PARAKH Rashtriya Sarvekshan 2024: https://parakh.ncert.gov.in/blog/parakh-rashtriya-sarvekshan-2024 [S]
- Banerjee, A., Banerji, R., Berry, J., Duflo, E., Kannan, H., Mukerji, S., Shotland, M., & Walton, M. (2017). From proof of concept to scalable policies. *JEP* 31(4):73-102. https://economics.mit.edu/sites/default/files/publications/proof_to_scale_sep_2017.pdf [V]
- J-PAL TaRL case study: https://www.povertyactionlab.org/case-study/teaching-right-level-improve-learning [S]
- J-PAL / Pratham AI initiative (2026): https://news.mit.edu/2026/new-j-pal-research-policy-initiative-to-test-scale-ai-innovations-fight-poverty-0212 [S]
- NCF-SE 2023 release: https://www.pib.gov.in/PressReleasePage.aspx?PRID=1951485 [S]
- CBSE competency-based question share (publisher summary): https://blog.mtg.in/decoding-the-new-cbse-exam-pattern/ [S]
- NEP 2020 language provisions (summary): https://www.thequint.com/news/education/emphasis-on-mother-tongue-as-medium-of-instruction-till-5th-nep [S]
- Translanguaging in Indian classrooms: https://wrap.warwick.ac.uk/id/eprint/164132/ [S]
- Wadhwani AI, Vachan Samiksha: https://www.wadhwaniai.org/vaachan-samiksha-leveraging-ai-to-bridge-the-literacy-divide/ [S]
- StatCounter India mobile OS: https://gs.statcounter.com/os-market-share/mobile/india [S]; Ookla India speeds: https://telecomtalk.info/india-sees-median-mobile-download-speed-jump/1000114/ [S]
