# World-best AI tutoring products and the pedagogy behind them: what Taxila should steal

**Date:** 2026-10-03. **Scope:** AI tutoring products and their pedagogy: Khanmigo, Google LearnLM / Gemini Guided Learning / Learn About, ChatGPT Study Mode, Claude learning mode, Synthesis, Alpha School, Duolingo Max, Speak, Ello, Amira, Microsoft Reading Coach / Reading Progress, Squirrel AI, BYJU'S and PhysicsWallah AI, Brilliant, Prodigy, MATHia, and the 2025-2026 standouts. It also covers the research behind them: the LearnLM reports, Tutor CoPilot, Bloom's 2-sigma and its replications, the Nigeria World Bank trial, the Harvard physics RCT, and the Kenya, Ghana and Sierra Leone results.

**This document extends, and does not repeat:**
- `../market/global-ai-tutors.md`: 16-product teardown, retention, pricing, Khanmigo RCT detail, Speak, Ello, Amira, Synthesis, Alpha;
- `../learning-science.md` §3: the LLM-tutor RCT table, Kestin, Bastani, LearnLM×Eedi, the guidance ladder;
- `../learner/personalisation-2026.md` §2.1: LearnLM PIF, the Eedi RCT design, the Gemini arena, Learn Your Way, TeachLM;
- `../market/china-asia.md` (Squirrel AI); `../market/india-incumbents.md` (BYJU'S, PW, LEAD); `../market/bigtech.md`;
- `../comprehension/products-live.md` (Squirrel, MATHia granularity).

Read those for the baseline. This document covers **evidence published or found since they were written** (several 2026 trials are new to the corpus). It turns that evidence into a steal list mapped onto Taxila's code.

**Evidence tags.**
- **[V]**: read at the primary source in this session (the paper's PDF, abstract or HTML, the vendor's own page, or a licence file).
- **[S]**: secondary (a search snippet, press, or a primary source quoted by another source).
- **[U]**: unverified or my inference.

A [V] on a vendor page means *the vendor says so*.

**Method.** About 30 WebSearch queries and about 25 primary fetches: arXiv abstracts, EdWorkingPapers and IZA PDFs parsed locally with `pdftotext`, the DeepMind and Google blogs, Microsoft Learn source markdown on GitHub, and licence files on raw.githubusercontent. The OpenAI pages returned 403 (study-mode launch and learning-outcomes post), as did the World Bank OKR and Taylor & Francis pages, so those are [S].

---

## 0. The 12 findings that change something for Taxila

1. **A third consumer "learning mode" now has a school RCT, and it worked because a teacher ran the room.** In Sierra Leone, Gemini Guided Learning was tested with **1,763 junior-secondary students in 12 schools (Port Loko), randomised by school, over 8 weeks**. The result was **+0.258 SD in maths** ("1.2 to 1.7 years of typical progress"), and **1.8-2.5 years** in classrooms that met the **12-hour target**.
   - **69%** of students met the usage target.
   - Teachers designed the lessons and ran discussion, using Gemini in about half of them.
   - Over 8 weeks, solution-seeking fell **from 25% to 10%** of queries and skill-building rose **from 68% to 90%**.
   - **76%** of Gemini's responses posed a question and **2%** gave the solution.
   - **Students with stronger baseline maths gained most** [V, DeepMind blog 2026-06-09; evaluators Laterite and Oxford MeasurEd].
2. **The largest new trial of an AI tutor is negative, and the mechanism is displacement.** At the University of Maryland, **2,379 students and 30 instructors** took part, randomised by instructor within course blocks, in fall 2025.
   - The tutor was a GPT-4o course tutor using RAG over course materials, with a **default "direct instruction" mode** that few instructors switched off.
   - It **cut final grades by 0.27-0.37 SD** and cut **participation in instructor-designed activities by 0.90 SD**.
   - **First-generation students lost more than twice as much** (−0.50 vs −0.22 SD).
   - Only about **15%** of treated students used it.
   - **73.8%** of requests sought information, explanations or solutions, and **0.7%** asked for feedback on the student's own work [V, EdWorkingPaper 26-1598, Oct 2026].
3. **The "learning penalty" grows with time, so short trials cannot see it.** A panel of **26,811 Chinese students in grades 7-12 over 30 months** found the following when students used general-purpose AI:
   - homework scores went up **18%** and homework time down **about 30%**;
   - **closed-book exam scores fell about 20% within six months**, and entrance-exam scores fell **18-24%**, with the largest falls after about two years [S, Strömberg, Lei & Wu, CEPR DP21577 / SSRN 6868618].

   This is the long-horizon version of Bastani's −17% [V via learning-science.md].
4. **The equity gradient points the same way in every trial.** Gains concentrate in stronger and better self-regulated students, and the weakest can be harmed:
   - Sierra Leone: stronger baseline gained most [V];
   - Nigeria: largest effects for higher-baseline students [S];
   - Kenya (Otis et al., *Management Science*): a GPT-4 WhatsApp business mentor had **no average effect, about +15% for high performers and about −10% for low performers**. The difference came from *which advice they chose to act on*, not from the questions they asked [S, HBS/HKS summaries];
   - Fischer, Rau & Rilke 2025: biggest benefit for **low prior knowledge but strong self-regulation** [V, IZA DP 18338];
   - Maryland: first-generation students lost twice as much [V];
   - the K-12 ITS meta-analysis: effects were "lower in studies including rural schools" [V abs, arXiv 2511.04997].

   Taxila's wedge is tier-2 Hinglish families, classes 4-7, so this is the central risk for Taxila's own users.
5. **Dose is the effect, and someone other than the child has to make the dose happen.** Each programme below had a fixed schedule, an adult enforcing it, or both:

   | programme | what scheduled the dose | result |
   |---|---|---|
   | Nigeria | after-school sessions | "each additional day of attendance" improved outcomes, and gains "did not taper" [S, World Bank blog] |
   | Sierra Leone | a 12-hour target | +0.258 SD at target vs 1.8-2.5 years in rooms that met it [V] |
   | Rori (Ghana) | 2 × 30 min a week inside study hall | 0.36 SD [S] |
   | Uttar Pradesh | lab in-charges | 0.45 SD [V via global-ai-tutors] |
   | EIDU (Kenya) | **classroom-integrated** digital learning | 4.61-5.47 learning-adjusted years of schooling (LAYS) per $100 |
   | M-Shule (SMS) and Oppia (Kenya) | **standalone** | 1.68 and 1.4 LAYS per $100 |

   EIDU and M-Shule/Oppia are compared in one cost-effectiveness paper [V, F1000Research 15-925]. EIDU's RCT covered 291 schools, n = 1,995, with effects reported as 0.425-0.534 SD [S].
6. **Expert remediation is a three-step decision, and giving the model the decision is what helps.** Bridge (Wang et al., NAACL 2024) captured expert decisions as **(A) error type → (B) strategy → (C) intention**, and only then the words:
   - error types: guess, misinterpret, careless, right-idea, imprecise, not-sure;
   - 11 strategies;
   - 11 intentions.

   GPT-4 responses conditioned on expert decisions were **+76% more preferred**, and **random decisions made them −67% worse than expert ones** [V, arXiv 2310.10648]. Tutor CoPilot built this into a product. The v2 paper (Nov 2025) reports **>700 tutors and 1,000 students**, **+4 pp mastery**, and **+9 pp for students of lower-rated tutors**. It also reports more probing questions, less generic praise, about **$20 per tutor per year**, and a full-year MAP extrapolation of only **+0.024 SD** [V, EdWorkingPaper 24-1054 v2]. This corrects the "900 tutors / 1,800 students" [S] figure in `learning-science.md` §3.2.
7. **Locking help away is worse than leaving it open.** In a pre-registered experiment with **334 students**, the AI tutor added **+0.23 SD**. **Unrestricted** access beat "read for 10 minutes first" access by **+0.21 SD**: the lockout produced **intensive bursts of prompting** that broke the flow of study [V, IZA DP 18338]. The sample was university students, so treat it as directional for children. The lesson is that productive struggle comes from the *structure of help*, a graduated ladder, and not from *timers*.
8. **Prompt-only learning modes are inconsistent and optional, and the vendors say so.**
   - OpenAI built Study Mode from system instructions written with educators from 40+ institutions. OpenAI itself notes this "may result in some inconsistent behavior" [S, launch coverage; the launch page returned 403]. The leaked prompt is five rules plus "DO NOT DO THE USER'S WORK FOR THEM" [S, Simon Willison].
   - OpenAI's own RCT (300+ college students) found neuroscience (the primary outcome) **"not distinguishable" from traditional online resources**, with about +15% in microeconomics [S, OpenAI and Axios via search].
   - Anthropic's usage report found **about 47% of student conversations were "Direct"** (answer-seeking with minimal engagement), which motivated Claude's learning mode [V, Anthropic education report].
   - All three modes are **user-switchable toggles**, and that is the anti-pattern for children.
9. **Fine-tuned "learning" models move style, not outcomes, unless the platform is built around them.**
   - LearnLM is now inside Gemini ("Gemini 3.1… LearnLM infused") and is marketed on five principles: active learning, cognitive load, metacognition, curiosity and adapting to the learner [V, Google LearnLM prompt guide].
   - TeachLM (100,000 h of Polygence tutoring) **doubled student talk time** and added 50% more turns [V abs].
   - Neither reports a learning outcome on its own. The Sierra Leone gain came with teacher-run classrooms.
   - Gemini APIs are also barred for under-18 services and fall outside Azure (`ct-no-gemini-api-for-minors`), so Taxila can borrow the *rubric* and not the model.
10. **New evidence partly reopens Taxila's adaptive-sequencing rejection.** Chung, Zhang, Kung, H. Bastani & O. Bastani (2026) paired a chatbot with **RL that chose practice-problem difficulty from chat signals** in **10 Taipei high schools over 5 months** (Python). The result was **+0.15 SD on an unassisted final exam**, which mediation analysis attributes to **higher engagement** [V abs, arXiv 2608.16907]. `adaptive-sequencing-as-the-lever` rested on Physics Playground (n = 263, null). This is a larger and longer counter-example, so the rejection should become an *open* question with a measurement (§2, S10).
11. **For reading, the world-best products score against the text, not what the child "meant", and Azure can do this in Hindi.**
   - Microsoft Reading Progress / Reading Coach, Amira and Ello all score oral reading against reference text.
   - **Azure Pronunciation Assessment supports `hi-IN` and `en-IN`** [V, MicrosoftDocs `pronunciation-assessment.md` locale table]. Scripted mode with `EnableMiscue` returns **Omission/Insertion** per word (≤30 s per utterance; continuous mode must diff against the reference itself). **Prosody scoring is `en-US` only** [V].
   - Reading Coach's loop is: read aloud → **challenge words** detected → targeted word practice → a moderated **AI story the child co-designs** (character, setting, level). It is available in 81 languages [S, Microsoft Tech Community].
   - Reading Progress's evidence is a vendor-paid ESSA Level II quasi-experiment. The firm LearnPlatform matched 1,404 K-6 students by propensity score; English learners moved from the **50th to the 59th percentile** [V, vendor].

    Taxila has no read-aloud scorer today (grep: no `pronunciation` in `server/`, `src/` or `shared/`).
12. **Generators work when the representation is right, not when the model is bigger.** Brilliant's authors fix "the learning objective, the progression, and the 'aha moment'", and AI implements and varies puzzles. Its gear-train generator went from **0% to 93% correct in 48 hours** "through improved representation design rather than model upgrades". Every generated problem gets "multiple rounds of human review" [V, Brilliant blog, Jan 2025]. Duolingo did the opposite in public: 148 AI-generated courses the day after an "AI-first" memo, a backlash it managed through PR [S, TechCrunch].

---

## 1. Landscape: who is best at what (2026-10)

Products already torn down in `global-ai-tutors.md` get one line each. New entries carry evidence.

| product / project | what it does better than anyone | best evidence | tag |
|---|---|---|---|
| **Khanmigo** (Khan Academy) | Running the largest A/B programme on tutor *behaviour*: about 20 tests over 15M+ threads; a structured student summary gave +6.1% next-item correctness; JSON→plain-text log; latency cuts halved give-aways | independent RCT 0.06-0.08 SD/yr; redesigned to auto-activate in 2026 | [V via global-ai-tutors] |
| **Gemini Guided Learning** (Google) | A teacher-integrated LMIC classroom deployment with conversation analytics (solution-seeking share tracked weekly) | **Sierra Leone RCT +0.258 SD**, 8 weeks, n = 1,763 | [V] |
| **LearnLM** (Google) | A *rubric* for tutor behaviour (five principles) and pedagogical instruction following; human-in-loop Eedi results | Eedi: 93.0% vs 91.2% fix rate; scaled RCT (AEA 18079, 1,200 students, STAR Maths) **results still not public** at 2026-10-03 | [V]/[S] |
| **Google Learn About / Learn Your Way** | Structured "textbook-like" responses: interactive lists, quizzes, definition boxes, related media; Learn Your Way re-levels and personalises only "amenable" spans | Learn Your Way +11 pp retention, n = 60 (in personalisation-2026) | [S]/[V] |
| **ChatGPT Study Mode** | Reach (Free tier); the clearest public statement of a tutor prompt (5 rules + "don't do the work") | own RCT: primary outcome null vs online resources; micro +15% | [S] |
| **Claude learning mode** | Socratic mode for universities; in Claude Code, "Learning" output style pauses at decision points and leaves `TODO`s for the human | Anthropic report: 47% Direct conversations (motivation, not outcome) | [V]/[S] |
| **Tutor CoPilot** (Stanford, FEV Tutor) | Turning expert *decisions* into a cheap real-time aid for novice humans | RCT +4 pp mastery, +9 pp for weakest tutors, $20/tutor/yr | [V] |
| **Synthesis Tutor** | Hand-built manipulatives and step-level voice guidance for ages 5-11 | none published | [V via g-a-t] |
| **Alpha School** | Motivation design: guides, internal currency, time-boxed academics | no controlled evidence; Unbound 10% vs 60% projected | [S] |
| **Duolingo Max / Video Call** | Retention craft at scale; restraint in the call (no mid-call grammar correction) | vendor studies; CURR 84% | [V via g-a-t] |
| **Speak** | Learner-grade turn-taking (pauses ≠ end of turn); selective correction | none independent | [V via g-a-t] |
| **Ello** | Child ASR on 100k+ h; published child-safety hard lines | vendor only | [V via g-a-t] |
| **Amira** | Oral-reading tutor plus assessment at school scale | vendor-paid ESSA II QED, n = 79k, g 0.03-0.22 | [V via g-a-t] |
| **Microsoft Reading Coach / Reading Progress** | Free, Azure-native reading-fluency loop: miscues → challenge words → co-designed AI story; Teams integration | Reading Progress QED n = 1,404; ELs 50th→59th pct | [V vendor]/[S] |
| **Snorkl** | "Explain your thinking": the student talks while drawing on a whiteboard, and AI gives feedback against teacher criteria (multimodal) | none found | [S] |
| **Squirrel AI** | Very fine knowledge-point graph (about 10k "nano" points) | SRI RCT with company co-authors (china-asia.md) | [V via china-asia] |
| **MATHia / LiveHint AI** (Carnegie Learning) | 25 years of step-level ITS data (5.5M students, 1.2B problems) behind an LLM hint tutor; published bias audits across GPT-4, GPT-4o and Claude 3.5 | MATHia RAND RCT year-2 effect; LiveHint no outcome study | [S] |
| **Brilliant** | Interactive-first design; human-set objective and "aha", AI-implemented variants; representation over model | 0→93% generator correctness | [V] |
| **Prodigy** | Engagement of a game wrapper (and the cautionary tale; §3) | FTC complaint 2021: up to 4× more ads than maths questions at home | [S] |
| **PhysicsWallah Alakh AI / AI Guru** | Indian scale: about 2M students a day; MSR-built RAG on GPT-4/4o, PromptWizard, a 150k math-trace SLM with reward model + MCTS; a proactive tutor in beta (95% lesson accuracy, <1% hallucination, 1.8-2.2 s, 300+ students) | company-reported | [V vendor]/[S] |
| **BYJU'S** | Cautionary (india-incumbents §4.1) | n/a | [V via i-i] |
| **Rori** (Rising Academies, Ghana) | WhatsApp maths tutor inside the school timetable; low cost | 0.36 SD, 11 schools (fragile); **a 100+ public-school RCT planned for Sep 2026** | [S] |
| **EIDU** (Kenya) | Teacher-led, classroom-integrated digital personalised learning on cheap Android | RCT 291 schools; 4.61 LAYS per $100 | [S]/[V] |

### 1.1 Effect-size ladder, updated (planning numbers)

| benchmark | effect | tag |
|---|---|---|
| Bloom 1984 "2 sigma" | 2.0 SD, never replicated; it was mastery learning plus tutoring (von Hippel 2024, *Education Next*) | [S] |
| Tutoring at scale (Kraft, Schueler & Falken 2026, *RER*) | pooled shrinks 45-60% on independent standardised tests: **0.22 SD for programmes of 400-999 students, 0.16 SD for 1,000+** | [S, abstract via search] |
| K-12 ITS in the US (Leite et al., arXiv 2511.04997) | **g = 0.271** (18 studies, 77 effects, 11 ITS); top moderators: **worked-out examples**, duration, condition, outcome type, **immediate measurement** | [V abs] |
| LMIC LLM tutors, teacher-integrated | Nigeria 0.31 (0.23 English), 6 weeks; Sierra Leone 0.258, 8 weeks; Ghana 0.36 (11 schools) | [S]/[V]/[S] |
| Adaptive difficulty with chatbot (Taipei) | 0.15 SD unassisted, 5 months | [V abs] |
| Unrestricted vs restricted AI help (university) | +0.21 SD for unrestricted | [V] |
| Course AI tutor, default direct mode (Maryland) | **−0.27 to −0.37 SD** | [V] |
| General AI on homework, 30 months (China) | exams −20% within 6 months | [S] |

**The planning number for Taxila at scale is 0.15-0.25 SD against an active control, and only with a structured dose.** Anything claiming more on a short horizon should be read through the "immediate measurement" moderator.

---

## 2. STEAL LIST

Each item names where it lands in the tree. Files were checked to exist on 2026-10-03.

### S1. Error-type-first remediation (Bridge / Tutor CoPilot)
- **Mechanism.** Before choosing a help move, classify *why* the answer was wrong, then pick a strategy and an intention, then generate words. The Bridge taxonomy:
  - errors: `guess · misinterpret · careless · right_idea · imprecise · not_sure`;
  - strategies: ask a question, explain the concept, hint, strategy, worked example, minor correction, similar problem, simplify the question, affirm, encourage;
  - intentions: diagnose, elaborate, hint at the mistake, correct, clarify, motivate, and so on.
- **Why it beats Taxila's current path.** `server/director/state.js` runs one uniform ladder per item: pump → hint → prompt → assertion. It branches only for a *kit misconception* (re-teach) and wheel-spinning. A careless slip by a strong child therefore spends a rung, and a misread question gets a content hint when it needed the question re-posed more simply.
- **Adaptation.**
  1. `server/director/classify.js` adds `errorType` to the wrong-answer verdict. Use closed labels only, decided by code where possible:
     - `careless`: the child's answer matches a known slip pattern of the key (digit swap, sign, off-by-one) from `server/comprehension/grade/numbers.js`, and the skill's pL ≥ 0.7;
     - `misconception:<id>`: this branch already exists via `server/learner/kt/misconception.js`;
     - `misinterpret`: the answer is correct for a different reading of the item (the kit can list `alt_readings`);
     - `right_idea` / `imprecise`: a partial match on the key or span (`grade/span.js`);
     - `guess`: an answer under 1.5 s on an MCQ item, or a third different answer;
     - otherwise `not_sure`.
  2. `state.js` routes as follows:

     | error type | move | rung spent? |
     |---|---|---|
     | careless | "check that step" re-ask | no |
     | misinterpret | simplify or re-pose the question | no |
     | right_idea / imprecise | minor correction + elaborate | — |
     | guess | ask for the reasoning before any hint | — |
     | misconception | the existing re-teach | — |
     | not_sure | the existing ladder | — |

  3. `server/director/shapes.js` carries `{strategy, intention}` as *shape notes*, never sentences. This follows the inherited law that sentence-shaped prompt text gets recited.
- **Expected impact.** Bridge: +76% preference, random decisions −67%. Tutor CoPilot: +4 pp mastery, and +9 pp in the weakest-tutor arm, which is the arm a fast LLM lane most resembles [V]. Fewer wasted rungs for strong children and fewer content hints for misreads.
- **Measure.**
  - `evals/director-sim.mjs` and `evals/lesson-truth.mjs` with new sim children carrying slip and misread profiles: rungs spent per wrong answer, and next-item correctness (Khan's metric).
  - Blind pairwise preference by two teachers on 60 real wrong-answer turns, old route vs new.
  - Reverse if next-item correctness does not improve by ≥3 pp at n ≥ 400 wrong answers.
- **Licence.** Bridge code is MIT [V]. **The Bridge dataset is CC-BY-NC-4.0 [V], so do not train or evaluate on it commercially without permission.** Use the published taxonomy (an idea, not data) and Taxila's own transcripts.

### S2. An equity floor: baseline-tercile release metric plus a low-baseline structure profile
- **Mechanism.** Every 2025-2026 trial found gains concentrated in stronger or self-regulated students and possible harm for the weakest (§0 #4). The fix in the literature is more structure for those students, not more choice: Kenya's low performers picked bad advice from a menu, and Fischer's beneficiaries had strong self-regulation.
- **Adaptation.**
  1. `server/learner/bands.js` takes a `baselineTercile` per subject from the onboarding diagnostic (`docs/research/learner/onboarding-diagnostic.md`), frozen for evaluation and never shown to anyone.
  2. In `state.js`, a low-tercile child on a new skill always gets worked example → faded → attempt. Today the choice between worked example and attempt-first keys off "novice/experienced"; make the low tercile force the worked-example path. The ITS meta-analysis's top moderator is worked-out examples [V abs].
  3. Low tercile never gets a menu of options; it gets one concrete next step. This touches `break` choices and Conductor offers in `server/conductor/planner.js`.
  4. Reports: `server/reports` adds no child-facing label. The tercile lives in evaluation only, in line with PX4 (no ability labels).
- **Expected impact.** It protects the population most likely to be in Taxila's wedge. Without it, Taxila could repeat the Maryland −0.50 SD first-generation pattern.
- **Measure.** A new release gate: **bottom-tercile gain ≥ 0.8 × top-tercile gain** on next-item correctness and on the ≥20 h delayed check (`comprehension-engine` `durable`), each week. Use simulated children in `evals/comprehension-sim` first, then live.
- **Licence.** None.

### S3. Dose by schedule, not by mood, reported as cost per learning-adjusted year
- **Mechanism.** Nigeria's per-day dose-response, Sierra Leone's 12-hour target, Rori's study-hall slots, EIDU's classroom integration and UP's lab in-charges (§0 #5) all show that the dose is set by an adult and a calendar.
- **Adaptation.**
  1. Onboarding (`docs/research/design/onboarding-flow.md`, `src/child/...` hello flow): the parent picks **fixed weekly slots** (default 4 × 25 min for 6-9, 4 × 35 min for 10-15, matching `LIMITS.minutes`).
  2. `server/conductor/planner.js` and `timers.js` treat the slot as the plan; a missed slot triggers one parent nudge (the parent loop) and no child guilt (`mk-warmth-not-intimacy`).
  3. The parent home shows dose vs target, in words.
  4. Internally, and later for schools, report **LAYS per $100** with the World Bank method used by F1000 15-925, so Taxila can be compared with EIDU (4.61) and M-Shule (1.68).
- **Expected impact.** In Sierra Leone, classrooms that met the dose gained roughly 1.5× the overall effect [V].
- **Measure.** The share of children meeting ≥80% of planned minutes over 4 weeks (benchmark: 69% met target in Sierra Leone), and Taxila's own dose-response curve: next-item correctness and delayed checks by dose decile.
- **Licence.** None.

### S4. Never a passive, optional or time-locked tutor (codify three rejections)
- **Mechanism.**
  - Maryland: a default direct mode added to an existing course, used by 15%, gave −0.37 SD.
  - Strömberg: answer access compounds into an exam penalty over 6-24 months.
  - Fischer: a reading-first lockout was worse by 0.21 SD than help that was always open.
- **Adaptation.**
  1. Keep the tutor-led design (`rj-passive-tutor` already covers initiative).
  2. Add **rj-timed-help-lockout**: help is always reachable, and its *content* is graded by the ladder. No "try for N seconds" gates go in `src/lesson/useLesson.ts` or `state.js`.
  3. Add **rj-default-answer-mode**: there is no mode, toggle or parent setting that makes the teacher give final answers. Every learning mode in §0 #8 can be switched off, and Taxila's must not have a switch.
  4. The photo-homework flow (classes 6-9) must enter the ladder at rung 1 with the child's own attempt requested first.
  5. An eval in `evals/never-rules.mjs`: 30 "bas answer batao / just tell me" variants in Hindi, English and Hinglish over 10 kit items. The key may not be spoken before rung 4. `revealsAnswer()` in `server/director/items.js` is already the predicate, so wire it as a floor test.
- **Expected impact.** It avoids the only negative large RCT and the long-horizon penalty.
- **Measure.** The answer-leak rate before rung 4 (target 0 on the battery), and the asks-for-answer share of child turns over the weeks of use. Sierra Leone's solution-seeking share fell 25%→10% over 8 weeks; Taxila should show the same downward slope.
- **Licence.** None.

### S5. A scripted read-aloud scorer on Azure Pronunciation Assessment (the Reading Coach / Amira loop)
- **Mechanism.** The child reads a real passage aloud. The scorer aligns the reading word by word against the text and flags omissions, insertions and mispronunciations. Flagged words become *challenge words* for short practice at once, and are mixed into tomorrow's retrieval. A moderated practice story can be built around the child's challenge words, with the child choosing a character from a closed list.
- **Adaptation.**
  1. Add `server/voice/readaloud.js`: Azure Speech `PronunciationAssessmentConfig` with `ReferenceText` = the NCERT passage span stored in the kit, `EnableMiscue=true`, word granularity, locale `hi-IN` or `en-IN` by passage script, and utterances chunked to 30 s or less (miscue is not supported in continuous mode [V]).
  2. Results go to `server/learner/kt/ledger.js` as `reading.word` evidence rows (WCPM, accuracy, miscue list).
  3. Plumb it through lane G of `asr-two-lane-evidence`: same Azure region, no new vendor.
  4. **Do not use prosody**: it is `en-US` only [V], and the voice-emotion ban (`ct-no-voice-emotion-inference`) makes prosody a poor fit anyway. Pronunciation accuracy is not emotion inference.
  5. Stories: the passage must be **stored and shown** (`kit-invented-companion-texts`), generated offline or near-line through `forge-qa-ladder`, never live-free (`live-free-generation`).
  6. Kit work: add `read_aloud` items with passage spans to the English and Hindi kits, `data/kits/c1-c5-*`.
- **Expected impact.** It gives Taxila a strand that today's ASR cannot do honestly. Intent-recovering ASR passes misread words (Speak ACL 2026, Praktika reviews [V via g-a-t]). The products with the best school evidence (Amira, Reading Progress) are built on exactly this loop.
- **Measure.**
  - E1 (80 real children, already planned): miscue F1 against two human annotators. Target ≥0.8 for omissions and substitutions in Hindi and in en-IN, separately for classes 1-3.
  - WCPM test-retest r ≥ 0.85 across two days.
  - **[U] Accuracy on Indian child voices is unknown.** Azure's model is adult-trained. If E1 F1 < 0.7, keep the scorer for practice only and do not let it touch the ledger.
- **Licence or compliance.** Azure Speech is first-party Azure and fits the Azure-only rule. The child's audio is processed per the existing STT consent; store no audio beyond the ASR retention policy already in force.

### S6. Track the conversation mix: answer-seeking down, feedback-on-own-work up
- **Mechanism.** Sierra Leone tracked solution-seeking vs skill-building queries weekly. Maryland found 0.7% of requests sought feedback on the student's own work. Khanmigo found 14.5% of messages contained reasoning.
- **Adaptation.**
  1. `server/director/classify.js` already flags `asksForAnswer`. Add closed intent labels per child turn: `attempt`, `explain`, `ask_answer`, `ask_check` (feedback on own work), `idk`, `off_task`.
  2. Aggregate them in `server/comprehension/report` and expose them on an internal observability panel (`docs/research/conductor/observability-evals.md`).
  3. Feed `ask_check` as a positive self-regulation signal into the metacognition work (`docs/research/learner/metacognition-srl.md`).
- **Expected impact.** A leading indicator weeks before delayed checks mature, and a direct read of S4's failure mode.
- **Measure.** The weekly per-child slope of `ask_answer` share (should fall) and of `ask_check` + `explain` share (should rise). Validate the labels against 200 hand-labelled turns at κ ≥ 0.7.
- **Licence.** None.

### S7. A child-talk-share metric (TeachLM's yardstick)
- **Mechanism.** TeachLM's main gain was **student talk time ×2** and **+50% turns** [V abs]. The weak Khanmigo usage was largely bare answers.
- **Adaptation.**
  1. From the lesson transcripts already written by `src/lesson/outbox.ts` and `server/routes/lesson.js`, compute the child's words / total words, child turns with a reasoning step (S6's `explain`), and the teacher's words per turn.
  2. Add the metric to `evals/director-sim.mjs` output and to the live panel.
  3. Add a regression gate: a persona or model upgrade may not lower child talk share by more than 10% relative (an extension of `mk-warmth-not-intimacy`'s persona-regression evals).
- **Expected impact.** It catches lecture drift, the commonest LLM tutor failure ("tutoring appears to become more challenging in longer dialogs", MathTutorBench [V via learning-science]).
- **Measure.** Target child talk share ≥ 30% in practice phases. The voice cost model already assumes 25-35% (`voice/v2/stt-hinglish.md`), so this also checks a cost assumption.
- **Licence.** None.

### S8. A "Parent CoPilot" card for try-at-home (the Tutor CoPilot pattern for the human Taxila already has)
- **Mechanism.** Tutor CoPilot gives a novice human **three suggested next moves** at the moment of a mistake, de-identified, editable and optional. Eedi's human-in-loop arm roughly doubled the human-only gain over static hints (10 vs 4.5 pp, press release) [S].
- **Adaptation.**
  1. The parent's try-at-home (`b3-try-at-home-one-state`, `b3-parent-try-at-home-from-letter`) gains a card built from the child's actual last misconception or `errorType` (S1). It shows **three probing-question shapes** rendered in the parent's language family (`b3-parent-text-english-voice-family`), and no praise lines (Tutor CoPilot reduced generic praise).
  2. Generation is offline at day end (`reports-end-of-day-jobs`), passes `reports-gate-throws` and the PII scrub, and every card is tied to a ledger row (`PX1 evidence or silence`).
- **Expected impact.** It turns the parent, Taxila's "human who makes practice happen", into a better tutor at the margin, where Tutor CoPilot found its +9 pp.
- **Measure.** Randomise card vs no card per skill from the second eligible event (the `reteach-randomise-from-second` pattern). Outcome: the delayed check on that skill. Secondary: the parent-tap rate.
- **Licence.** None; the taxonomy is from a paper.

### S9. Representation-first generators, with an "aha" field per skill (Brilliant)
- **Mechanism.** Humans set the learning objective, the progression and the "aha moment". Generators emit parameters in a representation the author designed, and variants keep the objective. Invest in representation before swapping models: 0→93% in 48 h [V].
- **Adaptation.**
  1. Taxila already does template fills (`forge-live-is-g1-fill`, `content-live-tiers`). Add to `data/kits/SCHEMA.md` a per-skill `aha` field (the one insight a child should leave with) and `progression` (ordered sub-goals), written by humans or the kit workflow and blind-checked.
  2. In `server/forge/g2/kit/`, a mechanic's generator must cite the `aha` it serves.
  3. In Forge QA (`forge-qa-ladder`), track **first-pass validity per mechanic**. When validity falls below 90%, the playbook is "change the representation", logged before any model bake-off.
- **Expected impact.** Fewer invalid generations, and engines that teach the concept rather than decorate it (`in-game-success-as-mastery` warns of the gap).
- **Measure.** `evals/forge-g1.mjs`: first-pass validity per mechanic, before and after each representation change.
- **Licence.** None.

### S10. Re-open adaptive difficulty as a measured question
- **Mechanism.** Chung et al. 2026: RL chose next-problem difficulty from chatbot-interaction signals, giving +0.15 SD unassisted after 5 months, mediated by engagement [V abs]. This partly contradicts `adaptive-sequencing-as-the-lever` (Physics Playground, n = 263, 1 study).
- **Adaptation.** `server/director/items.js` `selectNext()` already has `easier`.
  1. Add a bounded difficulty target: aim for about 70-85% first-try success per skill (the `lesson-arc.md` Rosenshine/Wilson band).
  2. Use a Thompson-sampling bandit over item difficulty tiers, with reward = next-item correctness without help, not engagement. Engagement is the *mediator* Chung found, but reward-hacking on engagement is the Duolingo trap.
  3. Keep it off the safety and floor paths.
- **Expected impact.** Uncertain: one positive study (Taipei, programming, high school) against one null (physics game).
- **Measure.** Within-child randomisation, fixed-easy-to-hard order vs bandit, per skill. Outcome: the ≥20 h delayed check. Pre-register the 0.05 SD MDE first: the power check sets n.
- **Licence.** The paper is CC-BY-4.0; no code was found, so implement from the description.

### S11. Optimise prompt *shapes* offline against Taxila's own evals (PromptWizard)
- **Mechanism.** Microsoft's PromptWizard (MIT [V]) was used for PhysicsWallah's tutor. It iteratively mutates and critiques instructions against a scorer.
- **Adaptation.**
  1. Run it offline on Azure OpenAI over `server/director/shapes.js` notes and `server/compiler/instructions.js`, scored by `evals/director-sim.mjs` + `evals/never-rules.mjs` + `evals/persona-invariants.mjs`.
  2. **Constrain the search space**: no few-shot examples and no sentence-shaped lines (inherited law: these get recited). Gated rules stay appended last (position is mechanism). Mutations run only inside the shape vocabulary.
  3. Accept a candidate only if every floor eval passes and the recitation probe does not rise.
- **Expected impact.** Moderate; cheap to try.
- **Measure.** Director-sim composite, never-rules violations (must stay 0), and recitation n-gram overlap with the instructions.
- **Licence.** MIT; Azure OpenAI only.

### S12. "Show me while you say it" for classes 4-9 maths (Snorkl's multimodal explanation)
- **Mechanism.** The child speaks while sketching their working; feedback goes against teacher-set criteria.
- **Adaptation.**
  1. The existing whiteboard (`src/lesson/uiBridge.ts`, desk layout) gains a child scratch layer.
  2. Strokes are captured as vectors, and recognised digits and operators are matched by code against the kit's worked steps (`server/comprehension/grade/ops.js`). This follows "a model never grades — classify against verified keys".
  3. The spoken part goes through the existing `why` closed-label grader.
- **Expected impact.** It adds an evidence channel for *process*, the thing Kestin's platform enforced.
- **Measure.** Agreement with a human rater on "the step was correct" on 100 boards (κ ≥ 0.7), plus the latency added.
- **Licence.** None; build in-house.

---

## 3. Anti-patterns the field learned the hard way

| # | anti-pattern | who learned it | evidence | what Taxila does instead |
|---|---|---|---|---|
| A1 | An **optional tutor added to an existing course** | Maryland VSA; Khanmigo v1 | 15% uptake, −0.37 SD, participation −0.90 SD; Khanmigo 17% of mistake sessions [V] | tutor-led, scheduled (S3, S4) |
| A2 | A **default "direct answer" mode** that adults must remember to switch off | Maryland (few instructors switched); Bastani GPT Base | −0.37 SD; −17% unassisted [V] | no answer mode exists (S4) |
| A3 | **Learning mode as a user toggle**, built by prompt only | ChatGPT Study Mode, Claude learning mode, Gemini Guided Learning | "inconsistent behavior" by OpenAI's own account; 47% Direct conversations [S]/[V] | structure in code (`state.js`), no toggle |
| A4 | **Timed lockouts** to force struggle | Fischer et al. | −0.21 SD vs unrestricted; prompting bursts [V] | graded ladder, always reachable |
| A5 | **Menus of advice** for weak learners | Otis et al., Kenya | low performers about −10% [S] | one next step for the low tercile (S2) |
| A6 | Trusting **short horizons** | Strömberg; ITS meta-analysis moderator; Kestin (immediate test) | the penalty appears at 6 months; immediate measurement inflates g [S]/[V] | the ≥20 h delayed check is the outcome (`learner-delayed-check-session-clock`) |
| A7 | Marketing **"2 sigma"** | Alpha, many vendors | Bloom unreplicated; Kraft: 0.16 SD at 1,000+ students [S] | plan for 0.15-0.25 SD; never claim beyond measured (`b4-site-claims-shipped-only`) |
| A8 | **Vendor-paid quasi-experiments sold as proof** | Reading Progress (LearnPlatform), Amira | ESSA Level II, propensity-matched [V] | in-house micro-RCTs (`psych-claim-tiers`) |
| A9 | **Monetising the child**: upsells and pay-to-win inside the learning game | Prodigy | FTC complaint by 22 groups; up to 4× ads vs maths questions at home; premium perks apply in school [S] | no paywall or offer ever on a child surface (`mk-no-sales-no-emi-monthly`) |
| A10 | **"AI-first" content at catalogue scale**, announced as replacing humans | Duolingo (148 AI courses, Apr 2025); Khan: AI "not good at generating standards-aligned content on the fly" | public backlash; social accounts wiped [S]; [V via g-a-t] | humans set objective and "aha"; AI implements under gates (S9) |
| A11 | **Standalone apps** where an integrated adult routine was available | Kenya DPL cost-effectiveness | standalone 1.4-1.7 vs integrated 4.6-5.5 LAYS per $100 [V] | the parent slot routine now, the school routine later (`mk-school-seeded-parent-paid`) |
| A12 | Assuming the **model upgrade** fixes pedagogy | Brilliant (representation fixed it); Khan (latency and context fixed more than models) | 0→93% without a model change [V]; +6.1% from context [V] | representation and context first (S9, `learner-brief-and-tail-order`) |
| A13 | **Surveillance chilling questions** | Maryland: instructors could view chats, which "may also have influenced what students were willing to ask" [V] | uptake 15% | parent sees evidence and patterns, never raw transcripts by default; keep `reports-lane-a-evidence-rows` |
| A14 | **Generic praise** in tutor turns | Tutor CoPilot measured it falling with expert decisions [V] | — | `lt-praise-guard`, `lt-praise-effort` already in place |

---

## 4. Corrections to existing research docs

1. `learning-science.md` §3.2, Tutor CoPilot: the row says "900 tutors, 1,800 K-12 students" [S]. The **v2 (Nov 2025) paper says >700 tutors and 1,000 students** [V]. Add the full-year MAP extrapolation (+0.024 SD) and the $20/tutor/yr cost [V].
2. `learning-science.md` §3.2, Nigeria: keep 0.31 / 0.23 SD [S]. Add the per-day dose-response, "did not taper", **girls gained more**, the 1.5-2 years equivalence, and the date (WB PRWP 11125, May 2025) [S].
3. `learning-science.md` §3.1, Rori: add that a **100+ public-school RCT in Ghana starts September 2026** [S].
4. `learning-science.md` §3.3 pattern 4 says "Fully autonomous LLM tutoring for young children has no RCT evidence found". This still holds for ages 6-12: Sierra Leone was junior secondary and teacher-facilitated.
5. `learning-science.md` §3.1, baselines: add Kraft et al. 2026 at 0.22 / 0.16 SD by programme size [S], and Leite et al. 2025's K-12 ITS g = 0.271 with its moderators [V abs].
6. `context/rejected.md` `adaptive-sequencing-as-the-lever`: add the Chung et al. 2026 counter-evidence and move it to an `open` (S10).
7. `market/global-ai-tutors.md` §1: add Gemini Guided Learning (Sierra Leone RCT) and ChatGPT Study Mode's own RCT (primary outcome null) as the first outcome data on big-tech learning modes.
8. LearnLM × Eedi scaled RCT (AEA 18079): **still no public results** found on 2026-10-03; keep it on the watch list.

---

## 5. Open questions this research could not close

- Azure Pronunciation Assessment accuracy on **Indian child** voices in hi-IN and en-IN. No public number was found [U]. Measure it in E1.
- Whether the equity gradient holds for **voice-first** tutoring of **ages 9-12**. Every trial in §0 #4 was text-based and older. Taxila's own tercile gate (S2) is the only way to know.
- What PhysicsWallah's proactive tutor measures beyond "lesson-level accuracy". The Q2 FY27 letter is due about Nov 2026 (`op-pw-k8-ai-tutor-watch`).
- Whether OpenAI's study-mode RCT and Learning Outcomes Measurement Suite publish method detail. The pages returned 403 here.

---

## 6. Sources (all accessed 2026-10-03)

**Trials and papers**
- Gemini Guided Learning RCT, Sierra Leone — https://deepmind.google/blog/measuring-the-impact-of-learning-with-ai-in-sierra-leone-and-beyond/ [V]
- Liu et al. 2026, course-integrated AI tutoring RCT, EdWorkingPaper 26-1598 — https://edworkingpapers.com/sites/default/files/ai26-1598.pdf [V]
- Strömberg, Lei & Wu 2026, the generative AI learning penalty — https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6868618 ; https://cepr.org/publications/dp21577 ; https://voxdev.org/topic/education/generative-ai-learning-penalty-secondary-school [S]
- Fischer, Rau & Rilke 2025, IZA DP 18338 — https://docs.iza.org/dp18338.pdf [V]
- Contractor & Reyes 2026 — https://arxiv.org/abs/2607.08849 [V abs]
- Chung, Zhang, Kung, Bastani & Bastani 2026, LLM-guided RL tutors — https://arxiv.org/abs/2608.16907 [V abs]
- Leite et al. 2025, K-12 ITS meta-analysis — https://arxiv.org/abs/2511.04997 [V abs]
- Kraft, Schueler & Falken 2026, *RER* — https://doi.org/10.3102/00346543261446660 ; https://edworkingpapers.com/sites/default/files/ai24-1031.pdf [S]
- von Hippel 2024, *Education Next* — https://www.educationnext.org/two-sigma-tutoring-separating-science-fiction-from-science-fact/ [S]
- Wang et al. 2025, Tutor CoPilot v2 — https://edworkingpapers.com/sites/default/files/ai24_1054_v2.pdf [V]
- Wang et al. 2024, Bridge (NAACL) — https://arxiv.org/html/2310.10648 [V]; code MIT https://raw.githubusercontent.com/rosewang2008/bridge/main/LICENSE [V]; data CC-BY-NC-4.0 https://huggingface.co/datasets/rose-e-wang/bridge [V]
- De Simone et al. 2025, WB PRWP 11125 — https://eric.ed.gov/?q=source:%22World+Bank%22&id=ED676624 ; https://blogs.worldbank.org/en/education/From-chalkboards-to-chatbots-Transforming-learning-in-Nigeria [S]
- Henkel et al. 2024, Rori Ghana — https://arxiv.org/pdf/2402.09809 [S]; scale-up RCT note https://the-learning-agency.com/the-cutting-ed/article/rori-the-empathetic-math-tutor-transforming-student-confidence/ [S]
- Kenya DPL cost-effectiveness (EIDU, M-Shule, Oppia) — https://f1000research.com/articles/15-925 [V]; EIDU RCT — https://edtechhub.org/2023/08/15/emerging-findings-from-a-randomised-controlled-trial-involving-pre-primary-learners-and-eidu/ ; https://www.tandfonline.com/doi/full/10.1080/02671522.2025.2605645 [S]
- Otis et al., Kenya entrepreneurs — https://www.hbs.edu/faculty/Pages/item.aspx?num=65159 ; https://pubsonline.informs.org/doi/abs/10.1287/mnsc.2024.06909 [S]
- TeachLM — https://arxiv.org/abs/2510.05087 [V abs]
- Vanacore, Baker, Closser & Roschelle 2026 — https://arxiv.org/abs/2602.19303 [V abs]
- Eedi × LearnLM — https://arxiv.org/pdf/2512.23633 ; registry https://www.socialscienceregistry.org/trials/18079 ; press https://www.morningstar.com/news/business-wire/20251111406294/ [V]/[S]

**Products**
- Gemini Guided Learning — https://blog.google/products-and-platforms/products/education/guided-learning/ [V]; LearnLM prompt guide — https://services.google.com/fh/files/misc/learnlm_prompt_guide.pdf [V]
- Google Learn About — https://www.maginative.com/article/google-launches-learn-about-an-interactive-ai-powered-learning-experience/ [S]
- ChatGPT Study Mode — https://openai.com/index/chatgpt-study-mode/ (403); https://simonwillison.net/2025/Jul/29/openai-introducing-study-mode/ [S]; https://www.infoq.com/news/2025/08/study-mode-chatgpt [S]; outcomes RCT https://openai.com/index/understanding-ai-and-learning-outcomes/ (403), https://www.axios.com/2026/03/04/openai-chatgpt-learning-students-cognitive [S]
- Anthropic education report — https://www.anthropic.com/news/anthropic-education-report-how-university-students-use-claude [V]; learning mode — https://www.engadget.com/ai/anthropic-brings-claudes-learning-mode-to-regular-users-and-devs-170018471.html [S]; https://code.claude.com/docs/en/output-styles [S]
- Microsoft Reading Progress study — https://www.microsoft.com/en-us/education/blog/2024/08/new-study-shows-improved-reading-scores-by-using-reading-progress/ [V]; Reading Coach — https://techcommunity.microsoft.com/blog/educationblog/reading-coach-the-ai-powered-fluency-practice-tool-is-now-generally-available-in/4291953 [S]
- Azure Pronunciation Assessment locales — https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/main/articles/ai-services/speech-service/includes/language-support/pronunciation-assessment.md [V]; how-to (miscue, 30 s, prosody en-US only) — https://raw.githubusercontent.com/MicrosoftDocs/azure-ai-docs/main/articles/ai-services/speech-service/how-to-pronunciation-assessment.md [V]
- Brilliant — https://blog.brilliant.org/hand-crafted-machine-made/ [V]
- Prodigy FTC complaint — https://fairplayforkids.org/feb-19-2021-advocates-to-ftc-prodigy-math-game-preys-on-kids-and-families/ ; https://www.edweek.org/technology/popular-interactive-math-game-prodigy-is-target-of-complaint-to-federal-trade-commission/2021/02 [S]
- Duolingo AI-first — https://techcrunch.com/2025/08/07/the-backlash-against-duolingo-going-ai-first-didnt-even-matter/ ; https://techcrunch.com/2025/04/30/duolingo-launches-148-courses-created-with-ai-after-sharing-plans-to-replace-contractors-with-ai [S]
- MSR × PhysicsWallah — https://www.microsoft.com/en-us/research/blog/microsoft-research-and-physics-wallah-team-up-to-enhance-ai-based-tutoring/ [V]; PW AI tutor — https://www.medianama.com/2026/08/223-physicswallah-personal-ai-tutoring-services/ [S]; PromptWizard licence — https://raw.githubusercontent.com/microsoft/PromptWizard/main/LICENSE [V]
- Carnegie Learning LiveHint AI — https://www.businesswire.com/news/home/20231130974040/en/Carnegie-Learning-Announces-LiveHint-AI ; bias audit https://renzheyu.com/papers/AIED2025_Tutor.pdf [S]
- Snorkl — https://help.snorkl.app/en/articles/12615061-what-is-snorkl ; https://thejournal.com/articles/2026/03/04/partnership-adds-snorkl-ai-feedback-to-math-instruction-for-modern-classrooms-project.aspx [S]
- Khanmigo 2026 learnings — https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ [V via global-ai-tutors]
