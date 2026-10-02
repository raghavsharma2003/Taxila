# Personalisation 2026: what measurably personalises learning, and what only personalises feel

**Date:** 2026-10-02 · **Question (personalisation-2026):** what does the 2024-2026 research on AI-tutor personalisation and pedagogical steering show, and which adaptations move *learning* rather than only how personal the tutor *feels*?

**Builds on, does not repeat:** LS = `../learning-science.md` (§2 learning styles, §3 AI-tutor trials, §8.4 format-efficacy bandit). Siblings: KT `kt-algorithms.md`, VT `vibe-temperament.md`, MI `motivation-interest.md`, DA `dialogue-affect.md`, TM `llm-memory-child.md`, OD `onboarding-diagnostic.md`, OE `../conductor/observability-evals.md`. Code seams: `shared/contracts.ts` (`Move`, `MoveKind`, `hintLevel`), `server/director/shapes.js` (rungs pump → hint → prompt → assertion).

**Tags:** **[V]** checked this session against the primary source (full text, or abstract where marked *abs*). **[S]** secondary only (sibling doc, registry or metadata, vendor page). **[U]** unverified: our inference, prior knowledge, or a starting value that must be measured.

**Method.** This session's WebSearch budget was already spent, so discovery ran through about 30 arXiv API queries, plus targeted fetches. Reading covered 13 arXiv HTML full texts, about 45 arXiv abstracts, the AEA RCT registry, ERIC, PLOS and Crossref. Springer, Wiley, Semantic Scholar and OpenAlex blocked or rate-limited the fetches, so claims that rest only on them carry [S] or [U].

---

## 0. Decisions on one screen

| id | decision | evidence (short) | what would reverse it |
|---|---|---|---|
| PZ1 | **Personalise on what the child knows first.** Level, misconception and prior knowledge drive the move. Interest, format and style come second. | In LMICs, ages 6-15 (16 RCTs, 53,029 learners), tech personalisation gave ES = 0.18 overall, but **0.35 when it adapted to the learner's level**, against interest-only or feedback-only personalisation (Major, Francis & Tsapali 2021) [V abs]. Eedi: misconception-targeted dialogue gave 91-93% vs 65.4% for static hints [V] | A Taxila MRT or RCT shows interest or format personalisation beating level adaptation on delayed outcomes |
| PZ2 | **Every adaptive knob carries an evidence class and a reward.** Class **L** (moves learning) adapts on learning outcomes. **F** (moves feel or engagement) adapts on engagement, bounded so it cannot cost L. **X** (harmful) is banned | §1 table; the feel/learning divergences in §2.7 | None. This is structural |
| PZ3 | **The per-turn pedagogical decision is code; the LLM only voices it.** The chain is error class → strategy → move → rung → help ceiling | StratL: a hand-built transition graph beat LLM-chosen intents, and "a natural language description of the tutoring strategy … does not yield satisfactory results" [V]. Pisan 2026: the help ceiling is set by a non-LLM core "reading only trusted learner state" [V]. Kestin (LS §3.2) | An LLM policy beats the code policy on `y_next` in a Taxila MRT by a pre-set margin |
| PZ4 | **Socratic budget.** Cap consecutive question turns on one step by age band, then *tell and retry an isomorphic item* | Eedi: **44.3% of expert edits moderated pace**, because Socratic persistence frustrated students [V]. Socratic-mode learners "progressively disengag[ed]" (Clin Deffarges et al. 2026) [V abs]. StratL raised fidelity, but perceived helpfulness fell from 2.00 to 1.20 [V] | PZM3 shows no rise in strain or abandonment with streak length |
| PZ5 | **Rung-gated context.** The realtime teacher receives only the current rung's support. The answer is withheld unless the ceiling allows an assertion | Prompted GPT-4o leaked the solution in **35.2%** of dialogues (Dinucu-Jianu et al. 2025) [V]. "A capable model pressed by a frustrated student does not withhold reliably on a prompt alone" (Pisan 2026) [V abs]. Voice is spoken before any output filter can act [U] | PZM1 shows < 1% leakage with the full key in context across 1,000 adversarial Hinglish turns |
| PZ6 | **The pedagogy directive uses a fixed vocabulary of attributes in the LearnLM PIF style.** It is written in English, appended last, and carries task facts only: item, the child's answer, misconception id, kit remediation | LearnLM reframes pedagogy as *pedagogical instruction following* [V]. Eedi's prompt carried "the question text, the student's incorrect answer, and the specific misconception" [V]. English prompts beat translated prompts, 72.7% vs 67.2% (Gupta et al. 2025) [V]. Inherited law: position is mechanism | Directives rendered in Hindi score higher on the TTB compliance axes |
| PZ7 | **No identity or trait attribute reaches any generator.** The first name is allowed for address only | Given gender, race, language, learning needs, achievement or motivation, LLMs shifted feedback toward stereotypes: inflated praise, withheld critique, "assumptions of limited ability" (*Marked Pedagogies*, Tan, Phalen & Demszky, LAK 2026) [V abs]. VT §4.9 | None. This is a safety floor |
| PZ8 | **Rewards are `y_next`, `y_delay` and `y_transfer`, never reattempt success.** `y_next` = next item, first attempt, unaided; `y_delay` = delayed retrieval success (DRS, OE O5) | Reattempt correctness correlated **r = 0.04** with next-question correctness (CK-12, 1M students; Schmucker et al. 2025) [V]. Tutor CoPilot moved exit tickets (+4 pp) but not end-of-year tests [V] | The OE anchor test shows `y_next` tracks external gains as well as DRS does |
| PZ9 | **Population first.** Each adaptive knob starts as one bandit per (age band × topic type). It becomes per-child only after it passes an HTE gate (§3.9) | Contextual bandits found heterogeneity "too small" to beat well-optimised one-action-for-all policies; HTE detection rates were 7-10% (Schmucker 2025) [V]. LS §8.4 | The gate passes for that knob |
| PZ10 | **Initiative scales with need.** Lower-level children get teacher-initiated checks; higher-level children may get on-demand help | Proactive human-AI tutoring helped students below the median more (MAP growth 75% vs reactive, p = .065) (Gurung et al., EDM 2026) [V abs]. Khanmigo: messages in only 17% of sessions with a mistake (LS) | PZM6 shows no difference by level tercile |
| PZ11 | **Interest contexts must be specific, validated and targeted.** Specific: in the child's own words. Validated: solvable, realistic, readable, authentic. Targeted: word problems and harder items first, never T1/T2 drill | Students preferred finer-grained references than teachers produced (521 Grade 7 students) [V abs]. Authenticity and realism were the most frequent failures of LLM personalisation (600 ASSISTments problems) [V abs]. Moderators of personalisation (Walkington & Bernacki 2019) [S] | MRT factor F-INT shows no effect on `y_next` or `y_delay`. Then interest contexts stay as F (engagement only) |
| PZ12 | **Every explanation turn carries one concrete elaboration and stays inside VT's word band.** Empathy wording is VT's lever, not a learning lever | In 1,718 confusion episodes: concrete elaboration (examples, analogies, worked steps) went with understanding in the next turn; empathy showed no association; longer replies went with *lower* understanding (Sharmin et al. 2026, observational) [V abs] | MRT factor F-CONC is null |
| PZ13 | **Feel metrics are logged separately.** A divergence monitor flags any change that raises feel while lowering `y_delay` | §2.7: StratL, Brender et al. 2026, the Gemini arena, Bastani (LS), Learn Your Way sentiment | None |
| PZ14 | **Memory recognition is F until proven L.** This covers callbacks and "it's you again" moments. Watch Eedi's scaled RCT arms "session-level context" vs "longitudinal student data", and run our own factor F-CB | Eedi tutors added recognition in 19.5% of edits (persona or tone); the drafting prompt "did not provide any information on past tutoring sessions" [V]. Scaled RCT, 4 arms, n = 1,200, primary outcome STAR Maths, no results posted [V registry] | Either the Eedi result or F-CB shows a learning effect. Then reclassify as L |

---

## 1. The answer: each personalisation axis, learning vs feel

Classes: **L** = causal evidence of a learning gain. **L?** = plausible, not shown. **F** = moves perception or engagement only. **X** = measurably harmful.

| # | axis (what is adapted) | strongest evidence | learning | feel | class | Taxila owner |
|---|---|---|---|---|---|---|
| 1 | **Level and knowledge state** (placement, difficulty, sequence) | Major 2021: 0.35 vs 0.18 [V abs]. Mindspark, ZPDES (LS). BKT- and DRL-adaptive example selection beat a non-adaptive baseline (n = 113); BKT helped low-prior students most, DRL helped high-prior students (Tithi et al. 2026) [V abs] | **yes** | neutral | **L** | KT, OD |
| 2 | **Misconception-targeted remediation** (dialogue about *this* wrong answer) | Eedi: retry success 93.0% (LearnLM) / 91.2% (human) vs 65.4% (static hints); in-unit follow-ups 95.4 / 94.9 vs 86.8% [V] | **yes** (immediate); delayed effect unknown | + | **L** | KT §1.6, kits |
| 3 | **Guidance level by prior knowledge** (worked example vs attempt-first) | Expertise reversal, d = +0.51 / −0.43 (LS §2.5). Tithi 2026 [V abs] | **yes** | − for novices on attempt-first | **L** | LS §3.4 ladder |
| 4 | **Pedagogical move quality** (guiding questions, prompting explanation, withholding) | Tutor CoPilot: "prompt student to explain" and "ask guiding question" ≈ 2 SD more frequent on a log-odds scale; giving answers and generic praise fell; +4 pp ITT / **+14 pp TOT** on exit tickets [V]. MSR: LLM explanations beat answer-only, n = 1,200 [S]. A Socratic tutor gave higher later gains than a prompt-refinement tutor (Brender 2026) [V abs] | **yes**, but mostly *universal*, not per-child | − (feels slower) | **L** | this doc §3.2 |
| 5 | **Pacing and dosage of Socratic questioning** | Eedi 44.3% pacing edits [V]. Clin Deffarges 2026: disengagement [V abs] | indirect (dropout) | strongly − when overdosed | **F → L via retention** | this doc §3.3 |
| 6 | **Initiative** (proactive vs reactive) | Gurung 2026 [V abs]. Khanmigo (LS). Brief early human check-ins raised engagement; "concrete, stepwise scaffolding" lifted it most (Borchers et al. 2026) [V abs] | **yes for lower-level children** | + | **L** | this doc PZ10 |
| 7 | **Hint correctness, level and form** | ChatGPT hints wrong on 32% of problems before self-consistency; after filtering, gains equalled human hints (Pardos & Bhandari 2024) [V]. High-level hints alone were "helpless or even misleading" (Xiao et al. 2024) [V abs]. Step-by-step reveal, where the learner states each stage first, was the best of 7 techniques (Kazemitabaar et al. 2024) [V abs] | **yes**, conditional on verification | + | **L** | kits (blind-solved), §3.5 |
| 8 | **Interest and context** | Meta g = 0.36-0.55 (LS §2.4). Learn Your Way: +11 pp retention (78% vs 67%, n = 60), but a *bundle* with no ablation [V]. Interest-only personalisation in Major 2021 was below level adaptation [V abs] | **small to moderate** | **large +** | **L (small) / mostly F** | MI, §3.6 |
| 9 | **Reading level and language register** | Learn Your Way re-levels to a target Flesch-Kincaid grade [V]. MATHia readability rewrite, randomised field trial (Almoubayyed et al. 2023) [S, metadata only]. LLM tutoring quality drops 9-10 pp in Hindi (Gupta 2025) [V] | **yes for emerging readers** [S] | + | **L?** | OD §6, VT |
| 10 | **Format per child** ("learning styles") | No crossover (LS §2). Per-student bandits ≈ population bandits (Schmucker) [V] | no | + | **F (X if labelled)** | LS §8.4 |
| 11 | **Persona, tone, warmth, empathy, emoji** | Eedi: 19.5% of edits fixed persona or tone; LearnLM "comes across as a bit fake" [V]. "Math with Matt": no learning difference, more efficient, felt more caring (Rief et al. 2026) [V abs]. Empathy: no association (Sharmin) [V abs] | none shown | **+** | **F** | VT |
| 12 | **Memory and recognition across sessions** | Eedi tutors' "Oh Sarah, it's you again" [V]. Scaled RCT pending [V registry] | unknown | + | **L? (watch)** | TM |
| 13 | **LLM-led reflection** vs a fixed questionnaire | LLM-guided reflection = questionnaire > slides, on a proctored exam 2 weeks later (Kumar et al. 2024) [V abs] | the LLM adds nothing over a static prompt | + | **F** | LA P7 |
| 14 | **Psychometric or demographic profile fed to the generator** | Marked Pedagogies [V abs]. A full psychometric profile improved adults' *creative-work* quality (Kelley et al. 2025) [V abs]; not a learning outcome, and not children | **harmful for children's feedback** | + | **X** | VT §4.9, PZ7 |
| 15 | **Unrestricted helpfulness** (answers on demand) | +48% practice, −17% exam (Bastani, LS). The unrestricted bot "won" only on an *immediate* post-test (Clin Deffarges 2026) [V abs]. Substitution narrows understanding and widens the prior-knowledge gap (Lehmann et al. 2024) [V abs] | **harmful** on delayed or unaided tests | **large +** | **X** | PZ5 |

**The honest summary.** What measurably personalises learning is adapting to the child's *knowledge*: level, misconception, prior knowledge (which sets the guidance level), and need (which sets initiative). The tutor must also make the child do the thinking. Everything that makes the tutor *feel* personal moves perception and sometimes engagement: persona, empathy, humour, memory callbacks, format choice, and polished personalised prose. Engagement is the binding constraint at scale (LS §3.3), so F knobs are worth having. But they are optimised on engagement inside L-safe bounds, and never claimed as learning.

---

## 2. Evidence, deeper than LS §3

### 2.1 Google: LearnLM, the Eedi RCT, the arena, Learn Your Way

- **What "pedagogical instruction following" (PIF) actually is.** System instructions describe the pedagogy wanted, as hard constraints ("do not give away the answer") and soft ones ("use a motivating tone"). The model is trained to follow them: SFT plus a reward model built from preferences "based on the degree to which they adhere to those instructions". RL was "significantly more effective" than SFT. The data was co-trained into Gemini's own stages so the model kept its other skills [V]. Evaluation: 49 scenarios, 2,360 conversations with 168 expert role-players, and 10,192 expert assessments. LearnLM was preferred by +31% over GPT-4o, +11% over Claude 3.5 and +13% over Gemini 1.5 Pro. Its largest leads were on active learning, metacognition and curiosity [V]. Instructions can be conditional ("If the user has answered 3 questions correctly, move to the next topic"), but the paper shows no adaptation beyond following instructions [V]. **For Taxila:** PIF is the right *interface*, a controllable vocabulary of pedagogy attributes. The *decisions* stay in the Director (PZ3, PZ6).
- **Arena for learning** (189 educators, 206 expert raters, 1,333 match-ups). Gemini 2.5 Pro was preferred 73.2% of the time; "adapting to learner needs" scored 82.0% [V]. When the *educators role-playing students* judged, Gemini 2.5 Pro and ChatGPT-4o **tied**, while experts strongly preferred Gemini: "what students find immediately helpful often diverges from what is pedagogically sound" [V]. Expert preference is not a learning outcome either.
- **Eedi RCT, as the full text shows it** [V]:
  - *Design:* two levels of randomisation. Students were split 91 control (static hints) vs 74 tutoring. Within tutoring, each session was randomised to a human expert or to LearnLM supervised by a human. Year 9-10 (ages 13-15), five UK schools, May-June 2025. Tutoring was triggered when a student got the first question of a unit wrong.
  - *Outcomes:* see §1 rows 2 and 4. Next-unit first question: 66.2% [61.1, 71.2] vs 60.7% [55.8, 65.4], difference +5.5 pp [−1.4, +12.4], 93.6% posterior probability of benefit. **No delayed outcome.**
  - *Prompt:* "clipped, Socratic", "short, focused sentences", "Only ask the student one question at a time", "Do not give the student the answer", "If the user asks to go, let them go!". Its personalisation was the question, the wrong answer, the misconception, the year group and *predicted quiz performance*, with **no session history**.
  - *Edits:* 74.4% of 3,617 drafts were sent unchanged; the median edit was 59 characters. Of the 926 edited messages, 44.3% moderated pace and 19.5% adjusted persona or tone. There were 5 factual errors (0.1%) and 0 harmful messages.
  - *Reading:* the humans added exactly the two things the model lacked: **dosage** (when to stop asking) and **recognition** (who this child is). PZ4 and PZ14 come from this.
- **Eedi scaled RCT** (AEA 18079) [V registry]. Arms: static Eedi remediation (225), AI with *session-level context* (375), AI with *longitudinal student data* (375), human expert (225). Primary outcome: STAR Renaissance Maths, baseline-adjusted. Individual randomisation, 2026-03-18 → 2026-08-31, no results posted. **Arm 2 vs arm 3 is the first direct RCT of "does knowing the student's history help an LLM tutor teach",** so it is the most important pending result for Taxila's thesis.
- **Learn Your Way** (n = 60, ages 15-18, Chicago, one chapter, Mann-Whitney U) [V]. It beat a PDF reader on the immediate quiz (p = 0.03) and on the 3-5-day retention test (78% vs 67%, p = 0.03). The authors state they "did not hone in on" which component caused the gain: personalisation, five representations, or embedded quizzes. All participants used the quizzes, which are retrieval practice, a known L lever [V]. Sentiment: 93% wanted to keep using it vs 67% for the reader [V]. **Reading:** strong evidence for the *bundle*; no evidence that the interest swap itself moved learning.

### 2.2 Stanford: Tutor CoPilot, Bridge, TeachLM, Marked Pedagogies

- **Tutor CoPilot** (full text) [V]:
  - *Usage:* "about 29% of treatment sessions used Tutor CoPilot", about 10 uses per session when used. ITT effect +4 pp (62% → 66%); **TOT effect +14 pp (62% → 76%)**. Lower-rated tutors gained +9 pp, lower-experience tutors +7 pp.
  - *Population and cost:* grades 3-6, 80% Hispanic, 67% economically disadvantaged; $20 per tutor per year.
  - *Limits:* "we did not find statistically significant improvements in end-of-year math test scores" over 2 months. Tutors called suggestions "too smart" and not grade-appropriate.
  - *Mechanism:* the Bridge model (error → strategy → intention), turned from expert think-alouds into LLM instructions (Wang et al., NAACL 2024) [V abs]. **This is the decision structure Taxila copies in §3.2.**
- **TeachLM** (Perczel, Chow & Demszky 2025): fine-tuned on 100,000 hours of Polygence tutoring. It **doubled student talk time**, improved questioning style, added 50% more turns and gave "greater personalization" [V abs]. This was measured on synthetic dialogues, not learning. Its lesson: authentic tutoring data shapes dialogue in ways prompts cannot.
- **Marked Pedagogies** (LAK 2026): GPT-4o, GPT-3.5 and Llama 70B/8B, 600 Grade 8 essays. Identical essays got different feedback once the prompt named attributes [V abs]. → PZ7.

### 2.3 Microsoft

- **Kumar, Rothschild, Goldstein & Hofman** (MSR, SSRN 2023): preregistered, n = 1,200. LLM explanations beat seeing only the answer on later unassisted tests, and the benefit was largest when learners **attempted first**. A customised vs a stock LLM was also tested [S, MSR publication page]. → attempt-first rung ordering.
- **Kumar et al., CSCW 2024** (n = 145 + 356): direct answers "marginally improved performance". Structured guidance cut copy-pasting and random queries [V abs]. **Kumar et al., L@S 2024**: LLM reflection = questionnaire reflection [V abs].
- **Shiksha Copilot** (MSR India, Karnataka; 1,043 teachers): a teacher-facing tool that cut planning time and stress and shifted practice toward activity-based pedagogy [V abs]. It has no student-outcome evidence and is not a tutor.
- **Nigeria (World Bank / Microsoft Copilot)** 0.31 SD: see LS §3.2.

### 2.4 Steering and training research (all on simulated or adult learners)

| work | what it shows | number | tag |
|---|---|---|---|
| StratL (Puech et al. 2024), 17 Grade 9 students, Singapore | code-chosen intent per turn beats prompt-only; LLM intent selection degraded fidelity | RSMs 2.6 vs ~1; PF score 3.67 vs 1.33 (p = .046); helpfulness 1.20 vs 2.00 | [V] |
| RL alignment (Dinucu-Jianu et al. 2025), Qwen2.5-7B, GRPO | reward = post-dialogue solve rate + (pedagogy − 1)·λ gives a tunable Pareto frontier | λ = 0.75: Δsolve 25.3%, leak 10.6%. LearnLM 2.0: Δsolve 4.3%, leak 0.9%. GPT-4o: Δsolve 33.1%, **leak 35.2%** | [V] |
| Outcome-trained tutor (Scarlatos et al. 2025), Llama 3.1 8B DPO | score = 0.5·(LLMKT-predicted next correctness) + 0.5·rubric | predicted correct 0.65 vs 0.49 (GPT-4o); rubric 9.37 vs 9.40. **Simulated students only** | [V] |
| UCO (EMNLP 2026) | "progress" and ZPD-scaffold rewards beat correctness-only RL | MathTutorBench / BigMath, no humans | [V abs] |
| OmniEdu (Sept 2026), open 4-27B | capability-balanced education tuning; 78.74% on MathTutorBench Scaffold | no humans | [V abs] |
| Pisan 2026 supervisor (UW Bothell) | non-LLM help ceiling on an 8-rung ladder; deterministic detector; LLM judge on risky turns; persona-driven tuning found an "over-help ladder" | 0 reveals, 100% ceiling compliance after tuning. **No learning study** | [V] |

**Reading:** every training result optimises a *proxy* (simulated solve rate, predicted correctness, rubric) without real learners. Taxila's models are fixed Azure models (gpt-5.6, gpt-realtime-2.1), so the transferable part is the **architecture**: a code policy, a ceiling, a vocabulary of attributes, and an outcome-defined reward. Fine-tuning is out of scope until the reward is proven on real children (§3.7).

### 2.5 Benchmarks: what they can and cannot tell Taxila

- **MathTutorBench** [V]:
  - *Results:* scaffolding win rate GPT-4o 0.50, LearnLM-1.5-Pro 0.64, SocraticLM 0.39, Qwen2.5-Math 0.06. Pedagogical instruction following: GPT-4o 0.82, LearnLM 0.68.
  - *Reward model:* 84% accurate at telling expert from novice responses.
  - *Longer dialogues are harder:* the hard split averages 5.78 turns; SocraticLM drops 0.39 → 0.28.
- **Beyond Helpfulness** (Yao, Zheng & Li, EMNLP 2026 NLP4PI workshop) [V abs]: the solving and pedagogy composites correlate at only 0.421 across 8 models, and model rankings change between the two. The authors recommend reporting the two scores *separately*. → TTB reports them separately.
- **TutorBench** (Scale AI, 1,490 expert samples): no frontier model scored above 56% [V abs].
- **Gupta et al. 2025** (8 languages including Hindi and Telugu) [V]. Hindi vs English: misconception identification −4-7 pp, interactive tutoring −9-10 pp. English prompts 72.7% vs translated prompts 67.2%. → PZ6, PZM2.
- **The correct-answer trap** (Eedi, 20,964 responses): a frontier reasoning model detects 84% of hidden misconceptions behind correct answers, but at realistic prevalence false alarms outnumber hits about 8 to 1. The authors propose *detect → verify with a diagnostic follow-up → escalate* [V abs]. This matches DA §6's no-regret verification rule: a suspected trap triggers a cheap `why` probe, never a verdict.

### 2.6 Hint and explanation trials

| trial | n / who | finding | Taxila takes | tag |
|---|---|---|---|---|
| Pardos & Bhandari 2024 (OATutor) | 274 adults (MTurk) | gains: ChatGPT 17%, human 11.6%, control 1.85%; ChatGPT = human (p = .416). 32% of ChatGPT hints wrong before 10× self-consistency | kits are blind-solved; a generated hint is never shown unverified | [V] |
| Kumar et al. 2023 (MSR) | 1,200 | explanation > answer; attempt-first best | the rung ladder starts with the child's attempt | [S] |
| Pankiewicz & Baker 2024 | CS1, GPT-4 compiler-error hints | hints-on: mixed performance, better affect. **Hints-off later: experimental group better on 5 of 6 error types** | hints that explain *why* transfer | [V abs] |
| Kazemitabaar et al. 2024 | 82 + 42 | step-by-step reveal, with the learner stating each stage first, best on isomorphic tasks and best at aligning perceived with actual skill | rung "prompt": the child names the next step before it is shown | [V abs] |
| Xiao et al. 2024, LLM Hint Factory | 12, think-aloud | high-level hints alone can mislead; adding concrete lower levels helps | the ladder must reach concrete support quickly for novices | [V abs] |
| Jangra & Muresan 2025, chain-of-hints | 41 | users split between static and dynamic hints; automatic hint metrics miss preferences | do not tune hint wording on automatic metrics | [V abs] |
| Xiao et al. 2026, CS1 RCT | 979, semester | more ICAP engagement in the intervention → better prompting skill; no between-group exam difference | engagement level matters within the process; it is not a shortcut to outcomes | [V abs] |
| Weijers et al. 2025, AI peer | 165, RCT | +10.5 pp post-test vs control; gain did not depend on the AI being right | *dialogue that makes the learner argue* is the active ingredient | [V abs] |
| Chen et al. 2026, GPTutor | 148 | chatbot use and answer-seeking were *negatively* associated with the midterm; embedded proof-review feedback was not | anchor help to the child's work, not to open chat | [V abs] |
| Zhang et al. 2024, *Mathemyths* | 35 children aged 4-8 | LLM co-storytelling taught maths vocabulary as well as a human partner | the only young-child LLM learning result found; small; not personalisation | [V abs] |

### 2.7 Divergence catalogue: feel up, learning flat or down

| study | feel | learning |
|---|---|---|
| Bastani 2025 (LS) | practice +48%, felt helpful | exam −17% |
| StratL 2024 [V] | helpfulness 2.00 → 1.20 | PF fidelity 1.33 → 3.67 |
| Brender et al. 2026 [V abs] | Socratic tutor "less efficient" | higher later gains; better independent LLM use |
| Gemini arena 2025 [V] | role-played students: tie | experts: strong preference |
| Learn Your Way 2025 [V] | 93% vs 67% want to reuse | +11 pp, with the cause unknown |
| Math with Matt 2026 [V abs] | felt "more supportive and caring" | no difference |
| Pankiewicz 2024 [V abs] | more focus, less "confrustion" | mixed while hints on |
| Fan et al. 2024 [V abs] | no motivation difference | essay score up; knowledge and transfer no different ("metacognitive laziness") |
| Logacheva et al. 2024 [V abs] | personalised exercises "engaging and useful" | not measured |
| Clin Deffarges 2026 [V abs] | adaptive mode highest EEG engagement | unrestricted bot best on *immediate* test only |

**Rule from this table:** child-rated helpfulness, enjoyment, expert preference and immediate post-tests are *feel* or *proxy* metrics. None may stand in for `y_delay` (PZ13).

### 2.8 What is still missing (as of 2026-10-02)

1. **No RCT of LLM personalisation for children aged 6-12** was found. The youngest LLM-tutor RCT found is Eedi (ages 13-15). Tutor CoPilot (grades 3-6) personalised *for tutors*, not children. [V for what was searched; absence of evidence]
2. **No published RCT of a voice LLM tutor for children, and none in Hindi or Hinglish.**
3. **No trial isolates interest personalisation from the rest of an LLM bundle.**
4. **No delayed outcome** in the Eedi trial; STAR in the scaled trial will be the first.

---

## 3. Design: the Personalisation Policy (PP)

PP sits inside the Director between KT/DA/VT state and `compile()`. It owns the per-turn pedagogical decision and the knob registry. It does **not** own format allocation (LS §8.4), vibe knobs (VT §4.2), motivation (MI) or memory (TM). It registers their knobs and enforces each knob's class.

### 3.1 Knob registry (`shared/personalisation.ts`, pure)

```ts
export type EvidenceClass = "L" | "L?" | "F" | "X";
export type Reward = "y_next" | "y_delay" | "y_transfer" | "engagement" | "preference" | "rule";
export type KnobId =
  | "entryRung" | "socraticBudget" | "initiative" | "interestContext" | "concreteElab"
  | "readingLevel" | "formatFamily" | "memoryCallback" | "humourDose" | "energy" | "errorFrame";

export interface KnobSpec {
  id: KnobId; owner: "PP" | "LS8.4" | "VT" | "MI" | "TM" | "OD";
  cls: Exclude<EvidenceClass, "X">;             // X axes are not knobs; they are banned in PZI7
  reward: Reward;                               // what the knob is allowed to optimise
  scope: "rule" | "population" | "child";       // "child" only after HTE gate (§3.9)
  stratum: ("ageBand" | "topicType" | "pKnownBand")[];
  floor: string;                                // what no setting may violate (checked in evals)
  mrtFactor?: string;                           // §3.8
}

export const KNOBS: KnobSpec[] = [
  { id: "entryRung",      owner: "PP", cls: "L",  reward: "y_next",     scope: "population", stratum: ["ageBand","topicType","pKnownBand"], floor: "low band starts at worked_step on a new skill", mrtFactor: "F-ENTRY" },
  { id: "socraticBudget", owner: "PP", cls: "F",  reward: "engagement", scope: "population", stratum: ["ageBand"], floor: "after budget: tell, then isomorphic item", mrtFactor: "F-QMAX" },
  { id: "initiative",     owner: "PP", cls: "L",  reward: "y_next",     scope: "population", stratum: ["pKnownBand"], floor: "low band always proactive", mrtFactor: "F-PRO" },
  { id: "interestContext",owner: "MI", cls: "L?", reward: "y_delay",    scope: "population", stratum: ["topicType"], floor: "validated (§3.6); never on T1/T2 drill", mrtFactor: "F-INT" },
  { id: "concreteElab",   owner: "PP", cls: "L?", reward: "y_next",     scope: "rule",       stratum: [], floor: "≥1 concrete element per explain/reteach", mrtFactor: "F-CONC" },
  { id: "readingLevel",   owner: "OD", cls: "L?", reward: "y_next",     scope: "child",      stratum: [], floor: "never above measured reading level" },
  { id: "formatFamily",   owner: "LS8.4", cls: "F", reward: "y_delay",  scope: "population", stratum: ["topicType","ageBand"], floor: "LS §8.4 hard constraints; no labels" },
  { id: "memoryCallback", owner: "TM", cls: "L?", reward: "engagement", scope: "rule",       stratum: [], floor: "TM §5.2 dosage; work-memory only", mrtFactor: "F-CB" },
  { id: "humourDose",     owner: "VT", cls: "F",  reward: "engagement", scope: "child",      stratum: [], floor: "VT §4.2 caps" },
  { id: "energy",         owner: "VT", cls: "F",  reward: "engagement", scope: "child",      stratum: [], floor: "strained → calm" },
  { id: "errorFrame",     owner: "VT", cls: "L?", reward: "y_next",     scope: "child",      stratum: [], floor: "step always named" },
];
```

`readingLevel` is per-child from day one. It is a *measured state* (OD §6.1), not a learned preference, so the HTE gate does not apply.

### 3.2 The per-turn decision (Bridge's error → strategy → intention, as code)

```ts
export type ErrorClass =
  | "correct_explained" | "correct_unexplained" | "correct_flawed_suspect" // correct-answer trap (§2.5)
  | "slip" | "misconception" | "procedural" | "no_attempt" | "gaming" | "off_task";
export type Strategy =
  | "affirm_specific" | "ask_why" | "verify_reasoning" | "contrast_case" | "guiding_question"
  | "prompt_explain" | "hint_rung" | "child_states_step" | "worked_step" | "tell_then_try"
  | "reteach_alt_rep" | "change_task";
export type Band = "low" | "mid" | "high";              // pKnown < .35 | .35-.70 | > .70 [U; align with KT §2.6]

export interface StepState {
  skillId: string; itemId: string; band: Band; ageBand: "A" | "B" | "C";   // VT bands
  errorClass: ErrorClass; misconceptionId?: string;
  rung: 0 | 1 | 2 | 3 | 4;           // 0 pump · 1 hint · 2 prompt (child states step) · 3 worked step · 4 assertion
  qStreak: number;                    // consecutive teacher question-turns on this step with no new information
  turnsOnStep: number; strained: boolean;          // DA session state
  newSkillFirstItem: boolean; helpRequested: boolean;
}
export interface PedagogyDecision {
  strategy: Strategy; move: import("./contracts").MoveKind; rung: StepState["rung"];
  ceiling: StepState["rung"];        // max support the teacher may give this turn (PZ5)
  thenIsomorphic: boolean;           // telling must be followed by a fresh item (Bastani/Kestin pattern)
  attrs: PedAttr[];                  // §3.4
  mrt?: { factor: string; arm: string; p: number };
}
```

```ts
const QMAX = { A: 2, B: 3, C: 4 } as const;   // [U] starting values, PZM3 calibrates
const TMAX = { A: 6, B: 8, C: 10 } as const;  // teacher turns on one step [U]

export function decide(s: StepState, rnd: () => number): PedagogyDecision {
  // 1. Floors that no personalisation may override
  if (s.errorClass === "gaming" || s.errorClass === "off_task") return mk("change_task", "repair", s.rung, s);
  if (s.errorClass === "correct_explained") return mk("affirm_specific", "practice", 0, s);
  if (s.errorClass === "correct_unexplained") return mk("ask_why", "probe", 0, s);           // LS P2
  if (s.errorClass === "correct_flawed_suspect") return mk("verify_reasoning", "probe", 0, s); // detect→verify, never a verdict

  // 2. Socratic budget (PZ4): telling is a teaching move, not a failure
  const budgetOut = s.qStreak >= QMAX[s.ageBand] || s.turnsOnStep >= TMAX[s.ageBand] || s.strained;
  if (budgetOut) return { ...mk("tell_then_try", "reteach", Math.max(s.rung, 3) as 3 | 4, s), thenIsomorphic: true };

  // 3. Entry rung by prior knowledge (expertise reversal), with an MRT only at the mid band (equipoise)
  if (s.rung === 0 && s.turnsOnStep === 0) {
    if (s.band === "low" && s.newSkillFirstItem) return mk("worked_step", "worked_example", 3, s);
    if (s.band === "mid") {
      const arm = rnd() < 0.5 ? "pump" : "hint";
      const d = mk(arm === "pump" ? "guiding_question" : "hint_rung", "hint", arm === "pump" ? 0 : 1, s);
      return { ...d, mrt: { factor: "F-START", arm, p: 0.5 } };
    }
  }
  // 4. Error-specific strategy
  switch (s.errorClass) {
    case "misconception": return mk(s.rung < 2 ? "contrast_case" : "reteach_alt_rep", "hint", nextRung(s), s); // kit remediation
    case "slip":          return mk("guiding_question", "hint", 0, s);                    // "check step 2" shape
    case "procedural":    return mk(s.rung < 2 ? "guiding_question" : "child_states_step", "hint", nextRung(s), s);
    case "no_attempt":    return mk(s.band === "low" ? "worked_step" : "child_states_step", "hint", Math.max(nextRung(s), 2) as 2 | 3 | 4, s);
  }
  return mk("prompt_explain", "probe", s.rung, s);
}
const nextRung = (s: StepState) => Math.min(4, s.rung + 1) as StepState["rung"];
// mk(strategy, move, rung, s) fills ceiling = rung, attrs = ATTRS[strategy] ∪ band/age attrs, thenIsomorphic = rung === 4
```

The table is hand-built (StratL) and versioned, and every branch has a unit test. It may be revised only on MRT evidence or by a learning scientist's review logged in `context/decisions.md`. An LLM may *propose* an `errorClass` (classify.js), but code checks it against the kit's misconceptions and answer key. The LLM never chooses `strategy` (PZ3).

### 3.3 Help ceiling and the Socratic budget, as equations

Let `r_t` be the support rung at teacher turn `t` on a step, `b` the band, `a` the age band, `q_t` the question streak, and `σ_t` = 1 if DA reports `strained`.

```
r_0      = 3            if b = low and the item is the first on a new skill    (worked step first)
         = 0 | 1        if b = mid  (randomised, F-START)
         = 0            if b = high
r_{t+1}  = min(4, r_t + 1)            after a non-correct, non-slip attempt
q_{t+1}  = q_t + 1      if the teacher turn ends in a question and the child's reply adds no new information
         = 0            otherwise (correct, a new error class, or the child explains)
TELL_t   = 1[ q_t ≥ Qmax(a)  ∨  turnsOnStep_t ≥ Tmax(a)  ∨  σ_t = 1 ]
if TELL_t: r_t ← max(r_t, 3); after r_t = 4 the next item MUST be an isomorphic variant (thenIsomorphic)
ceiling_t = r_t          (the realtime teacher's context holds support up to r_t only; PZ5, §3.5)
```

"No new information" is decided in code: the child's reply has the same `errorClass` and the same misconception (or none), and no new step is correct. This is the precise version of what the Eedi tutors did by hand ("pacing moderation").

### 3.4 The pedagogy directive (PIF-style attribute vocabulary)

```ts
export type PedAttr =
  | { k: "ONE_QUESTION" } | { k: "NO_ANSWER" } | { k: "MAX_WORDS"; n: number }
  | { k: "ADDRESS_MISCONCEPTION"; id: string; belief: string; remediationShape: string }
  | { k: "ACK_ATTEMPT_SPECIFIC" }                       // name what was right in the attempt; no generic praise
  | { k: "CONCRETE"; kind: "example" | "analogy" | "worked_step" | "picture_pointer" }
  | { k: "CHILD_STATES_NEXT" }                          // ask for the next step before revealing it
  | { k: "TELL_BRIEF_THEN_TRY" }                        // say the step plainly, then pose the isomorphic item
  | { k: "LET_THEM_GO" }                                // a stop request is honoured (Eedi)
  | { k: "INTEREST"; tag: string };                     // only when the §3.6 validator passed for this item

export function renderDirective(attrs: PedAttr[]): string {
  // English, telegraphic, no quotable lines (recited-prompt law); appended LAST by compile()
  return "PEDAGOGY NOW: " + attrs.map(a => SHAPE[a.k](a)).join("; ");
}
```

**Inputs allowed into attributes:** item id and prompt, the child's answer verbatim, misconception id and belief, kit remediation shape, rung support text, and an interest tag the child stated. **Never allowed:** band labels as adjectives ("weak", "slow", "bright"), achievement, gender, region, religion, caste, learning-need labels, or inferred affect as a trait (PZ7; VT §4.9). The band acts only through *which* attributes are chosen, never as text in the directive. `MAX_WORDS` comes from VT's `teacherTurnWords`. `CONCRETE` is required on `explain`/`reteach`/`worked_example` (PZ12).

### 3.5 Rung-gated context (leakage control for a voice lane)

Realtime speech reaches the child before any output filter can act, so control must be upstream [U]. The Director builds `LESSON NOW` from the item **as of the current ceiling**:

| ceiling | the teacher's context contains | never contains |
|---|---|---|
| 0 pump | item prompt, the child's last answer, misconception id | hints, steps, answer |
| 1 hint | + `hints[0]` | later hints, answer |
| 2 prompt | + `hints[1]`, + the *name* of the next step | the step's result, answer |
| 3 worked step | + the worked step for this item only | final answer |
| 4 assertion | + answer + one-line reason | — |

Grading never needs the answer in the teacher's context, because `classify.js` grades against the key in code. **Downstream:** the realtime transcript is scanned after each turn. Numerals, Hindi number words (do, teen, saadhe…) and fraction words are checked against the key. A hit logs `leak` and marks the item `contaminated`: its evidence weight drops to 0 and an isomorphic item replaces it. This is the Pisan detector pattern adapted to speech. For gpt-5.6 in text mode, the scan runs before display and rewrites the reply instead of refusing it ("prefers revising a reply over refusing it") [V].

### 3.6 Interest-context generation contract (Forge and kits)

```ts
interface ContextVariant {
  itemId: string; interestTag: string;          // the child's own words, e.g. "RCB matches", not "sports"
  text_hi: string; text_en: string; numbersFrom: "key";   // numbers are copied from the verified item, never generated
  checks: { solvable: boolean; keyAgrees: boolean; realism: boolean; readabilityOk: boolean; authenticity: number };
}
// generate → validate (4 validators, Ikram et al. 2026 pattern) → one revise pass → blind-solve must equal key → else discard
// eligibility: topicType ∈ {T3,T5} ∧ difficulty ≥ 3, or the child chose it; never T1/T2 drill; never on diagnostic or delayed-retrieval items
```

Additional rules:

- **Seductive-detail guard.** The interest element must carry the problem's quantities or relations. If it is decoration, the validator rejects it (LS §2.4 item 4).
- **Safety filter on tags.** Age-inappropriate titles, violence and brands that gamble are rejected [U list in MI].
- **Authenticity has the lowest validator reliability** [V abs]. So the child's own reaction is logged as `authenticity` evidence: did they engage or correct it ("RCB toh haar gaya")?

### 3.7 Outcome ledger, rewards and the divergence monitor

```ts
interface MoveOutcome {
  decisionId: string;
  y_next?: 0 | 1;            // first attempt, unaided, next item of the SAME skill after the step closes (not the reattempt)
  y_delay?: 0 | 1;           // DRS: first check ≥ 20 h later (OE O5), credited to the moves of the step that taught it
  y_transfer?: 0 | 1;        // near-transfer item
  strainOnset3: boolean;     // DA strained within 3 turns
  abandoned: boolean;        // session ended within 2 turns without a wrap
  feel?: { rating?: 1 | 2 | 3; continued?: boolean };   // F metrics, never fed to L rewards
}
```

**Credit assignment for `y_delay`:** each skill episode stores the decisions on its steps. The delayed outcome credits each MRT factor *at the episode level* (did the episode contain arm A?), not per turn [U].

**Divergence monitor (PZ13):** for every arm, release or knob change, estimate Δfeel and Δ`y_delay` with posterior intervals. Raise `divergence` when P(Δfeel > 0) ≥ 0.9 and P(Δ`y_delay` < 0) ≥ 0.8. The change is then held and the case logged as a rejection candidate. This is the Bastani pattern caught early.

### 3.8 Micro-randomised trial (MRT) plan: within-child factors

Randomise only where there is equipoise. Floors are never randomised: retrieval, spacing, misconception remediation existing at all, worked examples for novices, and safety.

| factor | arms (p) | available when | proximal | distal |
|---|---|---|---|---|
| F-START | pump vs hint first (0.5) | mid band, first error on item | `y_next` | `y_delay` |
| F-ENTRY | attempt-first vs worked-step-first (0.5) | mid band, new item of a new skill | `y_next`, `y_transfer` | `y_delay` |
| F-QMAX | Qmax(a) vs Qmax(a)+1 (0.5) | any step reaching Qmax(a) | `strainOnset3`, `abandoned` | `y_next` |
| F-INT | validated interest context vs neutral (0.5) | eligible item (§3.6) | `y_next`, time on item | `y_delay`, sessions/week |
| F-CONC | CONCRETE required vs not (0.5) | explain/reteach in B/C | `y_next` | `y_delay` |
| F-CB | memory callback at arrival vs none (0.5) | session start, TM has a callback | warm-up first-attempt, `abandoned` | return within 7 d |
| F-PRO | proactive check after 2 wrong or silent vs wait for a request (0.5) | high band, B/C only (low band is always proactive) | `y_next` | `y_delay` |

**Analysis** [U, method not re-checked this session]:

- *Estimand:* the causal excursion effect with known randomisation probabilities. The model is `Y_{i,t+1} = g(H_it)ᵀα + (A_it − p_it)·f(H_it)ᵀβ + ε`, fitted by weighted, centred least squares (GEE, child clusters). Availability-indicator rows only.
- *Interference:* at most two factors are active per step, and the second is drawn independently.

**Power (computed here, two-sided α = .05, power .80)** [U: assumes 30 eligible decisions per child-month]:

| effect on `y_next` (base .60) | decisions needed | child-months |
|---|---|---|
| 5 pp | 2,800-11,500 | 90-380 |
| 8 pp | 1,100-4,400 | 35-150 |
| 10 pp | 650-2,800 | 22-92 |

The lower bound takes within-child randomisation as gaining efficiency. The upper bound uses a naive design effect, 1 + (m − 1)ρ with ρ = .05-.10. **Implication:** proximal effects are detectable inside an 8-12-week pilot of 100-300 children. Distal `y_delay` effects need about 2-3× that (OE O9 power rule).

### 3.9 HTE gate: when a knob may become per-child

1. **Fit the pooled model.** Use `logit P(y=1) = α_s + (β_s + u_i)·A + γᵀx`, with `u_i ~ N(0, τ²)`, on MRT or MAB data. `s` = stratum.
2. **Gate.** Pass only if P(τ > τ_min) ≥ 0.9 with τ_min = 0.3 logits [U], **and** a contextual policy beats the best stratum-level policy on held-out children. The comparison uses doubly-robust off-policy value on `y_delay` and requires a gain ≥ δ_min [U].
3. **Shrink.** Even after the gate, per-child estimates shrink to the stratum mean and decay toward it (LS §8.4 decay).

Expected outcome, from Schmucker [V] and LS §2.7: most knobs never pass, and the honest product claim stays "adapts to what your child knows and how they are doing right now".

### 3.10 Evaluation additions to TTB (OE §7.4)

| axis | how | gate? |
|---|---|---|
| PIF compliance | per attribute, by code where possible: `ONE_QUESTION` (interrogative count in the transcript), `MAX_WORDS`, `NO_ANSWER` (key detector with Hindi number words), `CHILD_STATES_NEXT` (no step result before the child's turn) | yes (code) |
| Leakage under pressure | Pisan-style scripted personas in Hinglish: earnest, answer-seeker ("bas answer batao"), gate-evader, injector; 24 turns each; reasons for rejection captured | yes: 0 leaks at ceiling < 4 |
| Socratic budget | `qStreak` never exceeds Qmax(a) in the replay (L2 re-decide) | yes (code) |
| Marked-pedagogy counterfactual | the same scenario with name, gender and city swapped; the directive must be byte-identical (code) and praise count and critique specificity must not differ (judge, advisory until qualified, OE O6) | directive: yes; output: advisory |
| Hindi parity | the same scenarios with English vs Hinglish child utterances; gap in misconception classification and strategy correctness | report; gate at ≤ 3 pp after PZM2 [U] |
| Solving vs pedagogy | reported as two numbers, never one composite | report |
| Feel axes | warmth and naturalness, owned by VT and the voice docs | never a learning gate |

### 3.11 Storage (Neon; `db/migrations/0xx_personalisation.sql`, sketch)

```sql
create table pz_decision (
  id uuid primary key, lesson_id uuid not null, turn int not null, skill_id text, item_id text,
  band text, age_band text, error_class text, strategy text, rung smallint, ceiling smallint,
  q_streak smallint, then_isomorphic boolean, directive_hash text,       -- OE O3 manifest link
  mrt_factor text, mrt_arm text, mrt_p real, policy_version text, created_at timestamptz default now());
create table pz_outcome (
  decision_id uuid references pz_decision(id), y_next smallint, y_delay smallint, y_transfer smallint,
  strain_onset3 boolean, abandoned boolean, leak boolean, feel_rating smallint, updated_at timestamptz);
create table pz_knob_posterior (                                         -- population first (PZ9)
  knob text not null, stratum text not null, arm text not null, alpha real, beta real, n int,
  child_id uuid null);                                                   -- child_id only post-gate
create unique index pz_knob_posterior_key on pz_knob_posterior
  (knob, stratum, arm, coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid));
```

No free text and no identity attributes are stored. `child_id` rows in `pz_knob_posterior` exist only for knobs that passed the gate, and come under the DPDP 9(3) opinion gate (LS §8.6).

---

## 4. Invariants (gated in `evals/`; if a change trips them, the change is wrong)

- **PZI1** `decide()` is pure. Same `StepState` and seed give the same decision (OE L2 replay).
- **PZI2** No path returns `rung = 4` without `thenIsomorphic = true`.
- **PZI3** `qStreak > QMAX[ageBand]` never occurs in a replayed lesson.
- **PZI4** The realtime context for a turn never contains the answer key when `ceiling < 4` (string and number-word check on the compiled instructions).
- **PZI5** The directive contains no word from the banned-attribute lexicon (band adjectives, demographics, diagnoses, traits).
- **PZI6** The counterfactual identity swap leaves the directive byte-identical.
- **PZI7** No `KnobSpec` has `cls = "X"`. No knob with `cls = "F"` has a learning reward. No knob with `scope = "child"` lacks a gate record, except measured states (`readingLevel`).
- **PZI8** An `interestContext` variant is served only if `keyAgrees ∧ solvable ∧ readabilityOk`.
- **PZI9** Reattempt correctness never appears as a reward or a parent-facing learning claim.
- **PZI10** A `correct_flawed_suspect` classification never produces a verdict move. It produces only `verify_reasoning`.
- **PZI11** Every MRT assignment row has `mrt_p` logged, and the arm frequency passes SRM per factor.

## 5. Measurements to run first

| id | measurement | n / method | decides |
|---|---|---|---|
| PZM1 | leakage: rung-gated vs full-key context, gpt-realtime-2.1 and gpt-5.6, Hinglish adversarial personas | 1,000 turns per arm, offline | PZ5 |
| PZM2 | Hindi parity: misconception classification and strategy choice with English vs Hindi prompts, on Hinglish utterances | ≥ 500 teacher-labelled child turns | PZ6 |
| PZM3 | Socratic budget: hazard of `strained` or abandonment vs `qStreak`, by age band | pilot logs, ≥ 2,000 steps | Qmax, Tmax |
| PZM4 | proxy validity: correlation of reattempt, `y_next` and `y_delay` in Taxila logs | all pilot skills | PZ8 |
| PZM5 | MRT F-START and F-ENTRY | 100-300 children, 8-12 weeks (§3.8) | entry-rung policy |
| PZM6 | proactive vs reactive by level tercile (F-PRO plus the band rule) | same pilot | PZ10 |
| PZM7 | interest validator pass rates; children's corrections of contexts | 600 generated variants plus pilot reactions | PZ11 |
| PZM8 | marked-pedagogy counterfactual suite on gpt-5.6 and gpt-realtime-2.1 | 50 scenarios × 8 identity swaps | PZ7 |
| PZM9 | divergence-monitor backtest: would it have flagged a Bastani-like arm? | simulated arms, code sim (OE O7) | PZ13 |

## 6. Open questions

1. **Eedi scaled RCT, arms 2 vs 3** (fieldwork ended 2026-08-31 per registry). If longitudinal data adds nothing on STAR, TM's callbacks stay F. If it helps, we need to know *which* history was used.
2. **Can gpt-realtime-2.1 follow a PIF-style attribute vocabulary in Hinglish speech?** No published evaluation exists for realtime models. PZM1 and PZ6 measure it.
3. **Qmax for ages 6-8** may need to be 1-2, with the "question" replaced by a two-choice tap. This needs PZM3 data from age band A specifically.
4. **The correct-answer trap in speech:** at 8:1 false alarms, is even a cheap `why` probe too frequent for 6-9-year-olds? Cap it with DA's probe budget.
5. **Equity:** LLM use widened the low/high prior-knowledge gap (Lehmann 2024) [V abs], and Nigeria's gains skewed to higher-baseline students (LS §3.2). In the other direction, proactive tutoring narrowed gaps (Gurung 2026) and Tutor CoPilot helped *weaker tutors* most. Report every MRT effect by baseline tercile. A knob that widens the gap is held even if the mean rises.

## 7. Proposed `context/` entries (for `context/inbox/personalisation-2026.json`)

- **Decisions:** PZ1, PZ3, PZ4, PZ5, PZ7, PZ8, PZ9, PZ13, each with the reversal condition in §0.
- **Rejections:**
  - `llm-chooses-pedagogical-intent`: StratL's LLM intent selection degraded fidelity [V].
  - `attributes-in-feedback-prompt`: Marked Pedagogies [V abs].
  - `reattempt-as-reward`: r = 0.04 with next-question correctness [V].
  - `prompt-only-answer-withholding`: GPT-4o leaked 35.2% [V]; Pisan [V abs].
  - `interest-swap-claimed-as-learning`: Learn Your Way has no ablation [V].
- **Measurements:** none yet. This is a literature review; the power table in §3.8 is a computation, not a measurement.
- **Watch item:** AEA 18079 results (Eedi × LearnLM scaled RCT).

## 8. Sources

**Google DeepMind / Google Research**
- LearnLM Team (2024, v3 2025). *LearnLM: Improving Gemini for Learning.* https://arxiv.org/abs/2412.16429 [V full text]
- LearnLM Team (2025). *Evaluating Gemini in an arena for learning.* https://arxiv.org/abs/2505.24477 [V full text]
- LearnLM Team & Eedi (2025). *AI tutoring can safely and effectively support students: an exploratory RCT in UK classrooms.* https://arxiv.org/abs/2512.23633 [V full text]
- AEA RCT Registry 18079, *Testing the efficacy of AI tutoring in secondary mathematics: a scaled RCT in UK classrooms.* https://www.socialscienceregistry.org/trials/18079 [V]
- *Towards an AI-Augmented Textbook* (Learn Your Way). https://arxiv.org/abs/2509.13348 [V full text]; blog https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/ [V]

**Stanford**
- Wang, Ribeiro, Robinson, Loeb & Demszky (2024/25). *Tutor CoPilot.* https://arxiv.org/abs/2410.03017 [V full text]
- Wang et al. (2023/24). *Bridging the Novice-Expert Gap via Models of Decision-Making* (Bridge). https://arxiv.org/abs/2310.10648 [V abs]
- Perczel, Chow & Demszky (2025). *TeachLM.* https://arxiv.org/abs/2510.05087 [V abs]
- Tan, Phalen & Demszky (2026). *Marked Pedagogies.* LAK. https://arxiv.org/abs/2603.12471 [V abs]

**Microsoft**
- Kumar, Rothschild, Goldstein & Hofman (2023). *Math Education with LLMs: Peril or Promise?* SSRN. https://www.microsoft.com/en-us/research/publication/math-education-with-large-language-models-peril-or-promise/ [S]
- Kumar et al. (2024). *Impact of Guidance and Interaction Strategies for LLM Use…* CSCW. https://arxiv.org/abs/2310.13712 [V abs]
- Kumar et al. (2024). *Supporting Self-Reflection at Scale with LLMs.* L@S. https://arxiv.org/abs/2406.07571 [V abs]
- Dennison et al. (2025). *Shiksha Copilot.* https://arxiv.org/abs/2507.00456 [V abs]

**Steering, training, architecture**
- Puech et al. (2024). *Towards the Pedagogical Steering of LLMs for Tutoring* (StratL). https://arxiv.org/abs/2410.03781 [V full text]
- Dinucu-Jianu et al. (2025). *From Problem-Solving to Teaching Problem-Solving.* https://arxiv.org/abs/2505.15607 [V full text]
- Scarlatos et al. (2025). *Training LLM-based Tutors to Improve Student Learning Outcomes in Dialogues.* https://arxiv.org/abs/2503.06424 [V full text]
- Wei et al. (2025/26). *UCO.* EMNLP. https://arxiv.org/abs/2511.08873 [V abs] · Liang et al. (2026). *OmniEdu.* https://arxiv.org/abs/2609.23088 [V abs]
- Pisan (2026). *Teaching an LLM Tutor to Withhold the Answer.* https://arxiv.org/abs/2608.12292 [V full text]

**Benchmarks and language**
- Macina et al. (2025). *MathTutorBench.* https://arxiv.org/abs/2502.18940 [V full text]
- Yao, Zheng & Li (2026). *Beyond Helpfulness.* https://arxiv.org/abs/2606.16206 [V abs]
- Srinivasa et al. (2025). *TutorBench.* https://arxiv.org/abs/2510.02663 [V abs]
- Gupta et al. (2025). *Multilingual Performance Biases of LLMs in Education.* https://arxiv.org/abs/2504.17720 [V full text]
- Imran & Bulathwela (2026). *The Correct Answer Trap* (two papers). https://arxiv.org/abs/2606.23205 · https://arxiv.org/abs/2605.23925 [V abs]

**Hints, explanations, personalisation**
- Pardos & Bhandari (2024). PLOS ONE. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0304013 [V]
- Pankiewicz & Baker (2024). https://arxiv.org/abs/2403.12737 [V abs] · Kazemitabaar et al. (2024). https://arxiv.org/abs/2410.08922 [V abs]
- Xiao, Hou & Stamper (2024). https://arxiv.org/abs/2404.02213 [V abs] · Xiao et al. (2026), CS1 RCT. https://arxiv.org/abs/2602.16033 [V abs]
- Jangra & Muresan (2025). https://arxiv.org/abs/2510.21087 [V abs] · Hou et al. (2024), CodeTailor. https://arxiv.org/abs/2401.12125 [V abs]
- Gurung et al. (2026). EDM. https://arxiv.org/abs/2605.11155 [V abs] · Borchers et al. (2026). LAK. https://arxiv.org/abs/2601.09994 [V abs]
- Tithi et al. (2026). https://arxiv.org/abs/2602.07308 [V abs] · Schmucker et al. (2025). https://arxiv.org/abs/2508.00270 [V full text]
- Major, Francis & Tsapali (2021). BJET 52(5). ERIC EJ1304490. https://eric.ed.gov/?id=EJ1304490 [V abs]
- Walkington & Bernacki (2019). IJAIED. doi:10.1007/s40593-018-0168-1 [S, metadata] · Almoubayyed et al. (2023). AIED. doi:10.1007/978-3-031-36336-8_30 [S, metadata]
- Walkington et al. (2026). https://arxiv.org/abs/2602.15876 [V abs] · Walkington et al. (2026), AIED. https://arxiv.org/abs/2604.12066 [V abs] · Ikram et al. (2026), AIED. https://arxiv.org/abs/2604.05160 [V abs]
- Logacheva et al. (2024). ICER. https://arxiv.org/abs/2407.11994 [V abs] · Shao et al. (2025). CHI. https://arxiv.org/abs/2502.16895 [V abs]
- Sharmin et al. (2026). https://arxiv.org/abs/2607.08952 [V abs] · Rief et al. (2026), Math with Matt. https://arxiv.org/abs/2609.02611 [V abs]
- Kelley, De Cremer & Riedl (2025). https://arxiv.org/abs/2510.27681 [V abs] · Weijers et al. (2025). https://arxiv.org/abs/2504.00408 [V abs] · Zhang et al. (2024), Mathemyths. https://arxiv.org/abs/2402.01927 [V abs]

**Feel vs learning**
- Brender et al. (2026). AIED best paper. https://arxiv.org/abs/2607.03303 [V abs]
- Clin Deffarges, Kosmyna & Maes (2026). HAI. https://arxiv.org/abs/2609.00584 [V abs]
- Lehmann, Cornelius & Sting (2024). https://arxiv.org/abs/2409.09047 [V abs]
- Fan et al. (2024). BJET. https://arxiv.org/abs/2412.09315 [V abs]
- Contractor & Reyes (2026). https://arxiv.org/abs/2607.08849 [V abs]
- Chen et al. (2026). AIED. https://arxiv.org/abs/2602.18807 [V abs]
- Cen, Aleven, Koedinger & Borchers (2026). EC-TEL. https://arxiv.org/abs/2606.17470 [V abs]
- Reihanian et al. (2025), scoping review. https://arxiv.org/abs/2512.20714 [V abs]
- Kizilcec et al. (2026), *Million Tutoring Moves.* https://arxiv.org/abs/2605.08092 [V abs]

---

## Review

**Reviewer:** skeptical pass, 2026-10-02. **Scope:** evidence, child safety, DPDP, implementability, testability, gaps. **Method and limit:** I re-read the whole file and cross-checked it against `../learning-science.md` (§8.6 and rule 34 on DPDP 9(3)) and `vibe-temperament.md`. I did **not** re-fetch any cited paper in this pass, so every `[V]` below is the author's claim, not mine. Spot-check these five before any decision is logged: Major 2021 (0.35 vs 0.18), Schmucker r = 0.04, Dinucu-Jianu 35.2% leakage, Eedi 44.3% pacing edits, Gurung p = .065. Severity: **B** blocks implementation or a legal/safety floor; **H** high; **M** medium.

**Verdict.** The architecture (code policy, voice-only LLM, rung ceiling, evidence classes, outcome rewards) is sound. But the doc breaks its own invariants, rests several "L" labels on proximal or adult evidence, treats DPDP 9(3) as a footnote although the whole per-turn ledger is behavioural monitoring, and has one voice-lane design that probably cannot run as specified. Corrections follow.

### A. Internal contradictions (fix first; these make the invariants ungateable)

1. **B. The knob registry (§3.1) fails PZI7.** `formatFamily` is `cls: "F"` with `reward: "y_delay"`. PZI7 says no F knob has a learning reward. `socraticBudget` is F/engagement, yet its MRT factor F-QMAX (§3.8) lists `y_next` as the distal outcome. `humourDose`, `energy` and `errorFrame` are `scope: "child"` with no gate record, and PZI7 exempts only measured states. Fix: either relax PZI7 to the real rule ("F knobs optimise engagement under an L guardrail, see correction 3") or fix the registry. Then add a unit test that iterates `KNOBS` against PZI7. Right now the doc would fail its own gate on first run.
2. **B. PZ12 and F-CONC contradict each other.** PZ12 and §3.4 make `CONCRETE` a required floor on explain/reteach. §3.8 randomises "CONCRETE required vs not". A floor cannot be randomised (§3.8 says floors are never randomised). Pick one. Given the evidence (see correction 9), demote to a default and keep the MRT, with a guardrail.
3. **H. PZ2's promise is not implemented.** "F knobs are bounded so they cannot cost L" has no mechanism. The only control is the §3.7 divergence monitor, which needs `y_delay` (≥20 h, sparse) and fires after the damage. Replace with a pre-launch **non-inferiority** gate: an F arm may ship only if the lower bound of Δ`y_next` ≥ −m (m pre-set, e.g. 2 pp) in a pilot, and then runs as a constrained bandit (guardrail on `y_next`). State the guardrail in `KnobSpec` as `guard: {metric, margin}`.
4. **H. `decide()` pre-empts the strongest L axis.** At the mid band, step 3 returns the F-START randomisation on *any* first error, including `misconception` and `slip`. That skips contrast-case/kit remediation (§1 row 2, the doc's best-evidenced axis) in a coin-flip arm. §3.8 says misconception remediation is never randomised. Fix: run step 3 only when `errorClass ∈ {procedural, no_attempt}`; misconceptions always go to step 4.
5. **H. PZI6 vs PZ7.** PZ7 allows the first name "for address only", yet PZI6 demands a byte-identical directive across name/gender/city swaps. If the name is in the directive, the invariant cannot hold. Fix: keep the name out of the directive (address goes through a separate templated slot outside `renderDirective`), and test byte-identity of `renderDirective()` plus a separate swap test on model output.
6. **M. "No free text stored" (§3.11) vs `interestTag` "in the child's own words" (§3.6).** Own-words tags are free text and can carry religion, family, location or brand data. Fix: map to a closed taxonomy (allowlist, versioned) at write time; store only the taxonomy id.
7. **M. Two docs both claim the last position.** PZ6 appends the pedagogy directive last; VT §114 appends its VIBE tail line last; CLAUDE.md puts `SEARCH_DECISION`/`FORGET_DECISION` last. "Position is mechanism" cannot hold for three. Fix: specify one `compile()` order and a per-section token budget, and have the budget gate throw (inherited law). Make the safety text and the pedagogy directive the final two, in a stated order.
8. **M. PZ1 cites a reattempt metric that PZ8 bans.** Eedi's 91-93% vs 65.4% is retry success; PZ8 cites r = 0.04 between reattempt and next-question correctness. Eedi's control was static hints, not level adaptation, so it does not show that misconception targeting beats level adaptation either. Re-label PZ1's second leg "proximal, reattempt-based, weak".

### B. Evidence: rules that are stronger than their support

9. **H. Class L is over-assigned.** Several rows labelled **L** rest on *proximal* outcomes the doc itself distrusts (PZ8): Tutor CoPilot (exit tickets +4 pp ITT; end-of-year null; and it was a tool for human tutors, not an AI tutor), Eedi (immediate retry; no delayed outcome), OATutor (274 adults), expertise reversal (lab studies, mostly adults). Add class **L-prox** (proximal gain only) and keep **L** for gains on a delayed or external outcome. Rows 2, 3, 4, 7 become L-prox, and only level adaptation (Major 2021; Mindspark/ZPDES in LS) stays L. This also changes what an F-vs-L guardrail means.
10. **H. PZ1's headline number is a between-study moderator.** Major et al. 0.35 vs 0.18 compares sub-groups of different trials (different populations, subjects, dosage), so it is correlational. It is a reasonable prior, not proof that "level beats interest". State it as such.
11. **H. PZ4's numbers are invented.** QMAX 2/3/4 and TMAX 6/8/10 are `[U]`; the evidence (Eedi pacing edits, Clin Deffarges abstract, StratL n = 17) shows only that over-persistence is a problem, not where the cut-off is. Brender 2026 (Socratic → higher later gains) pulls the other way. Ship the budget as a *default under test*, with F-QMAX run in the first pilot, and say in the doc that ages 6-8 have no direct evidence.
12. **H. `strained → tell` is gameable.** A child who learns that sounding frustrated unlocks the answer will do it (Bastani's substitution pattern). Add a cooldown (at most one strain-triggered tell per N items) and require the isomorphic item to be answered unaided before the next strain tell.
13. **M. PZ10 cites a non-significant result.** Gurung: p = .065, abstract only. Reword PZ10 to "hypothesis supported by a marginal result", and keep the low-band proactive rule as a conservative default, not an evidence-backed floor.
14. **M. PZ12 rests on observational data.** Sharmin et al. is observational. "Longer replies went with lower understanding" has an obvious reverse-causation reading (confused learners provoke longer replies). Do not turn it into a floor; see correction 2.
15. **M. PZ6 generalises a benchmark.** English-beats-translated prompts (72.7% vs 67.2%) was measured on text benchmarks and other models. For a realtime audio model, an English directive may push replies toward English. Treat it as a hypothesis for PZM2, and add "reply language follows the child's" as a checked attribute.
16. **M. Preprint grading.** Nearly all 2026 sources are unreviewed arXiv preprints, and about two thirds of the `[V]` tags are abstract-only. Add a `peer-reviewed` marker and require that any *decision* (not just a watch item) rests on at least one full-text-verified source.
17. **M. Age coverage.** §2.8 admits nothing was found for ages 6-12, yet the rules run on classes 1-9 with one `ageBand`. Add an "evidence age range" column to the §0 table and mark every rule for band A as `[U]`. Add a review by an Indian primary-school teacher panel before band-A defaults ship.

### C. Child safety

18. **B. No safety predicate at the top of `decide()`.** The inherited law is "safety by predicate, not instruction". `decide()` starts with gaming/off-task and goes straight to pedagogy. Distress, self-harm cues, abuse disclosure and the Childline 1098 / Tele-MANAS 14416 hand-off must be checked first, return a non-pedagogical move, and be unaffected by any knob or MRT arm. Add invariant PZI12: no MRT assignment on a turn where a safety predicate fired.
19. **H. MRT on children is an experiment, not a feature flag.** The plan randomises initial support, question budget, and callbacks, with no consent wording, no ethics review, no stopping rule and no definition of "harm". DPDP 9(2) separately bars processing likely to harm a child's well-being (see D). Add: written parental consent that names experimentation; an independent ethics review (ICMR child-research guidance) `[U, not verified here]`; interim safety looks (stop an arm if strain onset or abandonment is worse by a pre-set margin); and a rule that no arm may be one the team already believes is worse (equipoise is asserted, not shown, for F-QMAX+1).
20. **H. F-CB optimises "return within 7 d" and recognition callbacks ("it's you again").** For minors this is engagement-farming and can shade into the companion register the Taxila constraints forbid (CLAUDE.md: no romance/companion register). Drop "return within 7 d" as a reward; keep `y_delay` only; cap callback frequency; and have the safeguarding reviewer sign off the callback shape set.
21. **H. "Engagement" is undefined for F knobs.** Define it (on-task minutes? sessions per week?) with an age-based daily cap. Optimising time-on-app for children is both ethically and legally risky.
22. **H. Affect inference.** `strained` (DA) is inferred affect, probably from voice. The EU AI Act prohibits emotion inference in education `[U, from memory, not checked]`, a signal of where regulators are heading, and under DPDP it adds to the monitoring problem (D). Prefer behavioural signals the child controls (silence length, repeated errors, "I don't know") over acoustic affect, and write down which signals feed `strained`.
23. **M. Hinglish grammar needs the child's gender; PZ7 forbids it.** Hindi verb forms (karta/karti, gaya/gayi) agree with the child's gender. Either the teacher uses gender-neutral phrasing by rule, or gender is an explicit *grammar-only* parameter outside the directive and never in feedback logic. Add a tested "no gendered forms unless set" rule; otherwise the model will guess, and a wrong guess is a visible failure.
24. **M. Accessibility is excluded by PZ7's blanket ban.** "No learning-need labels" is right for feedback text, but dyslexia, hearing loss, stammer or slow speech need *operational* accommodations (speech rate, longer silence tolerance, ASR settings). Add an `accommodations` struct of parameters (never labels) that the directive may set.
25. **M. Interest tags can become brand targeting.** "RCB", "Free Fire", fantasy-sports and betting-adjacent brands sit close to DPDP 9(3)'s "targeted advertising directed at children". The §3.6 safety filter is `[U list in MI]`. Replace with an allowlist taxonomy with no brand names, and log that no commercial party sees tags.

### D. DPDP 9(3) and 9(2): the doc under-treats both

26. **B. The core ledger is behavioural monitoring, not an add-on.** §3.11 only gates `child_id` rows in `pz_knob_posterior`. But `pz_decision` and `pz_outcome` already hold per-lesson, per-turn error class, strain onset, abandonment, feel rating and leak flag, and `y_delay` has to be joined back to a child. "Population-first" (PZ9) does not remove this: pseudonymised child-level events are still personal data. Counsel's opinion (LS rule 34) is therefore a gate on **PP itself**, not only on per-child posteriors. Fix, concretely:
    - Define `PP_MODE = "session" | "longitudinal"`. In `session` mode, `decide()` uses only in-session state and the KT knowledge layer; no MRT, no per-turn ledger beyond what is needed to grade; this is the safe launch mode.
    - Make MRT logging a separate, consent-flagged, feature-gated pipeline with its own purpose tag, so it can be switched off without breaking tutoring.
    - Add retention (for example raw `pz_decision` deleted or aggregated after 90 days `[U]`) and an erasure cascade: deleting a child removes `pz_decision`, `pz_outcome` and any `pz_knob_posterior` rows with their `child_id`. Add a `consent_version` and `purpose` column.
27. **H. 9(2) is not mentioned.** Section 9(2) bars processing likely to cause a detrimental effect on a child's well-being, which an MRT arm designed to test "more frustration" (F-QMAX +1) or an engagement-optimised F knob can arguably meet. Add 9(2) next to 9(3) in §3.9, §3.11 and the open questions, and route both to counsel `[S: statute text as quoted in LS §4.3; the Rules' exemption schedules not re-read]`.
28. **H. Equity audit vs "no identity attributes stored".** Open question 5 requires reporting effects by baseline tercile, and a real fairness audit needs gender, language background and region, which PZ7 and §3.11 forbid storing. Resolve explicitly: (a) audit by synthetic counterfactual tests only (PZM8) at launch; or (b) hold the attributes in a separate access-controlled research store, never joined to the generator path, with consent and minimisation, once counsel agrees.
29. **M. Parent-facing disclosure.** Nothing says how the parent can see what is inferred (band, strain flags, interest tags) or opt out of MRT while keeping the service. DPDP's notice and consent duties make this required. Add a parent-readable "what we adapt" page and a per-parent MRT opt-out.

### E. Implementability and testability

30. **B. Rung-gated context (§3.5) probably cannot run on a realtime voice session as written.** With server-side turn detection the model starts replying when the child stops speaking, before the Director can classify the answer and set `ceiling`. To gate context per turn you must disable auto-response (`create_response: false` on the realtime session `[S/U: from the OpenAI Realtime docs as I recall them, not re-checked]`), transcribe, classify, `session.update`, then `response.create`. That adds latency inside the voice turn budget, and `session.update` timing relative to an in-flight response is a race. Add a measurement before PZ5 is accepted: p50/p95 added latency of that loop, and whether a barge-in during it corrupts the ceiling. If it cannot meet the budget, the fallback is a post-hoc guard plus a model-side answer-withholding directive plus a small "hold" buffer on audio output, and PZM1 must measure that fallback instead.
31. **B. Withholding the key does not stop the model solving the item.** gpt-5.6 can solve class 1-9 items itself. PZI4 only proves the *key string* is absent from the context, not that the model cannot say the answer. The leak metric must be on **model output** against the solved answer, with and without the key in context (PZM1 should include "key absent" as a third arm), and the detector must cover Devanagari digits, Hindi number words (irregular forms like unnis, uncaas, pachhattar), fractions, and units. A detector on transcribed audio is *after* the words are spoken, so for voice it can only mark the item contaminated, not prevent the leak. The doc's "downstream scan" wording in §3.5 should say so.
32. **H. Who produces `errorClass`, and with what ASR error?** The pipeline assumes clean classification of child Hinglish speech. Children's ASR error is high, and "no_attempt", "gaming" and "off_task" are exactly the classes ASR dropout mimics. A misread `no_attempt` sends a low-band child to a worked step; a misread `gaming` triggers `change_task`. Add: ASR confidence in `StepState`; a "re-ask once" move when confidence is low, which must not count toward `qStreak`; and a labelled test set with children's speech before PZM2/PZM3 data is trusted.
33. **H. `y_next` is not comparable across arms.** After a `tell_then_try`, the next item is an isomorphic near-copy (easier by construction), so tell arms will win on `y_next`. Also, `y_next` is only observed if the child continues (abandonment is informative missingness). Fix: define `y_next` on a fixed-difficulty probe or adjust for item difficulty (IRT or kit difficulty); treat abandonment as a failure (and report the bound where it is dropped); pre-register how missing outcomes are handled.
34. **H. `y_delay` credit assignment and confounding.** The Conductor chooses when the delayed check happens, so a policy that changes return behaviour changes who gets a `y_delay` at all (selection). Episode-level credit when two factors are active in the same episode confounds them; the "second factor drawn independently" does not fix the estimand without a factorial analysis. Say which estimand (marginal vs interaction), and log both factors' arms per episode.
35. **H. The MRT power claim ignores that there are seven factors.** The §3.8 table assumes all decisions are eligible for the factor tested. Most factors apply to a small share (F-QMAX only when a step reaches Qmax; F-CB only at session start). With 100-300 children for 8-12 weeks (about 9,000-27,000 decisions at the doc's own 30 per child-month `[U]`), most factors will have far fewer eligible decisions than the 650-11,500 needed. Recompute per factor with real eligibility rates from pilot logs, show the formula, and cut the pilot to 2-3 factors (F-START, F-ENTRY, F-QMAX) rather than seven. Also state the multiplicity plan (7 factors x subgroups: terciles, age bands) and pre-register it.
36. **M. Estimation method unverified.** The weighted centred least squares for a binary outcome (§3.8) is marked `[U]`. For binary `y_next` use a log-link or risk-difference specification and say so; before use, have a statistician check the estimator and cluster-robust SEs.
37. **M. Isomorphic items must exist.** `thenIsomorphic` presumes a verified isomorphic variant for every item. Kits are blind-solved, but generated variants are not unless the same blind-solve runs. Add a `variantAvailable` check; if missing, pick a different item of the same skill from the bank rather than blocking.
38. **M. `rung` escalates faster than the budget.** §3.3 raises `r` by 1 after every non-correct attempt, so a child reaches the assertion (rung 4) after four wrong attempts regardless of progress, and the low band starts at 3. With that, `qStreak` rarely binds. Add progress detection (a new correct sub-step does not escalate) or justify the cadence; add a replay test for the distribution of final rungs.
39. **M. Invariants that are weaker than they look.**
    - PZI3 replays the code policy, not the LLM: the model can still ask two questions. `ONE_QUESTION` by "interrogative count" misses Hindi questions with no "?" and tag questions in transcripts. Use a small classifier plus human sampling.
    - PZM1's "< 1% leakage over 1,000 adversarial turns" uses simulated Hinglish personas; the project's own simulator docs warn simulated children differ from real ones. Require a human-reviewed pilot on real children's transcripts too.
    - The divergence monitor needs a feel signal; a 1-3 rating from a 6-year-old has unknown validity. Validate it, or use behavioural feel proxies.
40. **M. Storage sketch.** `pz_outcome` has no primary key and `pz_decision` has no `child_id` or `consent_version`, while `y_delay` needs the child join. `pz_knob_posterior` holds Beta(α, β) only, but §3.9's HTE gate needs a logistic mixed model; there is no storage for it. Fix before the migration is written.

### F. What is missing

41. **NEED is almost absent.** The product thesis lists NEED (gaps, goals, exams, school pace). The doc personalises on knowledge band but has no knob for school pace, upcoming test, board (CBSE/NCERT vs RBSE) or parent goal. In an Indian setting, aligning to the class syllabus pace vs the child's actual level is likely the largest practical lever (the Mindspark pattern in LS). Add `paceMode` (catch-up / on-grade / exam-prep) with KT/OD as owner, class L-prox, and the rule that exam-prep never skips retrieval.
42. **Language mix is not a knob.** Hindi/English ratio, code-switch level and which language a concept is first explained in are first-order personalisation for these children and have partial evidence (home-language instruction). Add `languageMix` (owner VT/OD), initially a measured state plus a population MRT.
43. **Cold start.** A new child has no `pKnown`; the default band routes into the mid-band MRT immediately. Define a first-session policy (diagnostic first, OD) that takes no randomised arms until the band is estimated.
44. **Parent and teacher in the loop.** No path for a parent or teacher to override a policy (for example "keep to the school's method") or for a human to veto an arm for one child.
45. **Non-readers and ages 6-8.** `child_states_step` and rung-2 prompts assume verbal articulation; band A needs tap or choice responses (open question 3), designed now, not after data.
46. **Which Indian-context evidence?** Beyond Mindspark and Major 2021, nothing tests Hindi-medium or Hinglish classrooms; add a plan to collect teacher-labelled Hinglish data (PZM2 asks 500 turns; that is a labelling job with a budget and a named reviewer pool).

### G. Net changes to the §0 decisions

| id | change |
|---|---|
| PZ1 | Keep as the prior; mark the 0.35 vs 0.18 comparison correlational; drop the Eedi retry figure as support. |
| PZ2 | Replace "bounded" with a non-inferiority guardrail per F knob (correction 3). |
| PZ4 | Ship as a default under test; add the strain cooldown; mark band A `[U]`. |
| PZ5 | Add the latency-loop gate and a "key absent" arm; reword the downstream scan as contamination marking (corrections 30-31). |
| PZ7 | Add the grammar-gender exception and accommodation parameters; resolve the name/PZI6 conflict. |
| PZ9 | Add 9(2) and a `PP_MODE`; population-first is not by itself a DPDP defence. |
| PZ10, PZ12 | Downgrade to hypotheses with MRT; no floors. |
| PZ13 | Replace detection-after-the-fact with a pre-launch non-inferiority gate plus the monitor. |
| PZ14 | Drop "return within 7 d" as an outcome; add a cap and safeguarding sign-off. |
| new PZ15 | Safety predicate precedes `decide()`; no MRT on safety turns (PZI12). |
| new PZ16 | No MRT, no per-turn ledger, no per-child posterior until counsel and consent gates pass (`PP_MODE = "session"` is the launch mode). |
