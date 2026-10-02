# Conversation probes: knowing what a child understood without it feeling like a test

Date: 2026-10-02. Scope: conversational and game-embedded **covert probes** for children aged 6-15 (launch focus
Classes 4-7, ages about 9-13). The goal is to find out whether the child understood **without quiz or MCQ-style
checking**, grade each probe against the verified kit, and feed `server/comprehension/**` and the learner model.

This builds on and does not repeat `docs/research/learning-science.md` §1 and §7 (probe catalogue P1-P24, fusion
rules), `comprehension/papers-2025-2026.md` (mechanisms M1-M11) and `comprehension/products-live.md`. It uses the
contracts in `docs/research/learner/LEARNER-MODEL.md` §6.1 (`EvidenceClass`, outcome tables, LR defaults) and
`data/kits/SCHEMA.md` (`expectations`, `misconceptions[].signs/diagnostic/remediation`, `items[].kind/answer/acceptable/hints`).

## Evidence tags

| tag | meaning |
|---|---|
| **[V]** | Checked this session against the primary source (abstract page or full text). |
| **[S]** | From a search summary, review or secondary page. Direction reliable; re-check numbers before a `context/` entry. |
| **[U]** | Our inference, extrapolation (to Indian children, voice, Hinglish), or an uncalibrated design value. A hypothesis. |
| **[LS]** | Already established in `learning-science.md` with its own tag; cited there. |

**Inherited law applies to this document.** Every probe below is a **shape**: a situation, a move and what to listen
for. None of it is a line to say. The realtime teacher receives shape ids and kit fields, never sample sentences
(sentence-shaped prompt text gets recited; html-portfolio measurement, CLAUDE.md).

---

## 0. The answer on one screen

1. **"Not a test" is a property of the move's *pragmatics*, not its content.** Children notice tests through
   *known-answer questions* (the adult already knows the answer and is checking), *repetition* (asking again signals
   "you were wrong"), *evaluation language* and *visible stakes*. Covert probes remove those cues. The child still
   has to *use* the concept, because the situation does not work without it [S: display vs referential questions;
   Rose & Blank 1974 and Poole & White 1991 on the repeated-question effect; Nystrand & Gamoran on authentic questions].
2. **Four reframes make almost any check covert.** (a) **Role reversal**: the child is the expert, and a protégé,
   puppet or "confused" teacher needs help. (b) **Preference framing**: "would you rather" choices where only the
   concept tells you which option is better. (c) **Story or world consequence**: the story or game only goes on if the
   concept is applied. (d) **Authentic question**: ask about the child's own world, which the teacher genuinely does
   not know, but grade it by membership in a class the kit has verified.
3. **Covert is also more valid for the children who matter most.** Framing a task as a game rather than an
   evaluation removed a performance gap for low-SES 6-9-year-olds (Désert, Préaux & Jund 2009) [S]. A 2025
   meta-analysis found stereotype threat depresses performance in grades 2-5 but not younger (17 studies, 25 effects)
   [S]. Low-stakes practice tests *reduce* test anxiety (g = −0.52, 24 studies, n = 3,374), and **easy** practice tests
   reduce it most (Yang et al. 2023) [V]. Evaluation framing therefore *adds measurement error* for anxious or
   stereotyped children. Removing the framing is psychometrics, not only kindness [U].
4. **The richest covert probes are teaching-shaped.** Explaining to mum produced better explanations and the most
   transfer in 5-year-olds (Rittle-Johnson, Saylor & Swygert 2008) [S]. Children who taught a robot retained more
   than self-practice, most of all low-prior-knowledge children (Tarakli et al. 2025, n = 58) [V]. Puppets raised
   children's reasoning talk, including among children who usually stay quiet (Simon, Naylor, Keogh et al., ages
   7-11) [S]. The protégé's misconception must be **held in code** so that the protégé cannot sycophantically "get it"
   (AlgoBo Reflect-Respond) [S].
5. **Grading is the hard part, not eliciting.** Every shape below names its rubric against kit fields. LLM graders
   are sycophantic toward confident students and give way under social pressure (Kasneci & Kasneci 2026,
   EduFrameTrap) [V], and up to 15 points under a student-proposed answer [LS]. So the grade is **code against the
   key** wherever the shape allows: choice → `misconceptionId`, number → `answer/acceptable`, sort → bins. An LLM
   judges one kit `expectation` at a time, into closed labels.
6. **Delayed and woven probes are the truth signal.** Callbacks 2-3 topics later and in the next session are the
   calibration target for every other probe (learning-science §7.2 rule 6) [LS]. They work best when they show up
   inside new work or a continuing story, not as "revision".
7. **36 probe shapes** in nine families (§4), each mapped to topic types T1-T5, bands B1-B4, the `EvidenceClass` it
   emits, its LR band, its perceived-test risk, its confounds, and its kit rubric. No new `EvidenceClass` is needed;
   each shape maps onto LEARNER-MODEL's closed set (§5).

---

## 1. Why children feel tested, and how to remove each cue

| cue that says "this is a test" | evidence | the covert counter-move |
|---|---|---|
| **Known-answer (display) question**: the adult obviously knows the answer | Display questions elicit short, low-level answers. Authentic questions (no pre-set answer) go with engagement and achievement growth in grades 8-9 (Nystrand & Gamoran; Applebee et al. 2003) [S] | Ask about something the teacher truly cannot know (the child's house, game, opinion, prediction), but choose it so that a correct concept is *needed* to answer well. Grade the concept, not the opinion |
| **Repetition of the same question** | Children read a repeated question as a signal to change their answer. Piagetian conservation results partly came from this (Rose & Blank 1974). 4-year-olds change answers to repeated yes/no questions more than adults (Poole & White 1991) [S] | **Never re-ask the same question in the same form after an answer.** The "why" after a correct answer is framed as curiosity about the child's method ("how did your brain do that"), and is applied to correct *and* wrong answers alike, so it never signals error [U] |
| **Evaluation language** ("let's test", "quiz", "check if you know", scores) | Evaluative vs game instructions changed low-SES children's Raven scores (Désert 2009) [S]. Diagnostic-of-ability framing hurts stereotyped groups at 6-10 (McKown & Weinstein 2003) [S] | No probe is named as a check. Game and story vocabulary. No visible score on probes; game points come from play, not from correctness on probes |
| **Authority asymmetry** (the adult knows, the child performs) | Children defer to adults, which is why the Truth Value Judgment Task has a "not very smart" puppet make the statements (Crain & Thornton 1998) [S]. Children 4+ track informant accuracy and correct informants (Koenig & Harris lineage) [S] | Put the claim in the mouth of a fallible character: protégé, puppet, "my friend", or the teacher's own "slip". The child corrects *someone*, not answers *to* someone |
| **Hard items in a row** | Easy practice tests reduce test anxiety more than hard ones (Yang 2023 moderator) [V]. Boredom and frustration dynamics [LS] | Target a predicted success of about 0.7-0.85 for covert probes (the KT `pSuccessNext` of the probe item) and interleave probes with genuine play [U] |
| **Interrogation density** | Overused "why?" feels like distrust [LS P2] | Probe budget (§6.3): at most 1 generative probe per concept per session, and no two probes back to back without a non-probe turn [U] |

**What covert must not mean.** Covert means *not test-shaped*. It does not mean deceptive. The child-safety floor
holds: the teacher never denies being an AI. The puppet or protégé is openly a pretend character the teacher plays
(children aged 4+ handle pretend frames easily). Stakes are genuinely low, so nothing false is said about them.
Every planted error is resolved before moving on [LS rule 6]. If the child asks "are you testing me?", the honest
shape is: yes, I'm checking how well *my* explaining worked, and nothing bad happens if it didn't. Parents are told
in onboarding, and in every report, that understanding is checked through conversation and games, and the report
cites the evidence [U, product rule].

---

## 2. What the evidence says about each probe family (new this session)

### 2.1 Role reversal: teach-back, protégé, puppet
- **Audience matters even at 5.** Explaining correct examples *to mum* gave higher-quality explanations and the
  greatest procedural transfer, compared with explaining to oneself or restating (Rittle-Johnson, Saylor & Swygert
  2008, *JECP* 100:215) [S]. A *real* listener is better than a solo explanation. A voice tutor can offer a
  pretend listener (protégé) or a real one (a parent relay, see C2).
- **Teachable robots work in real classrooms.** 58 primary children: teaching an interactive-RL robot gave higher
  retention than tablet self-practice, especially on the inference (grammar) task, and low-baseline children gained
  most (Tarakli, Vinanzi, Moore & Di Nuovo 2025, arXiv 2506.18365) [V]. CoWriter: children aged 6-8 corrected a
  robot's deliberately poor handwriting. The robot can copy *the child's own* error to target it (EPFL; Hood,
  Lemaignan, Dillenbourg 2015) [S]. That is exactly the "protégé holds this child's misconception" shape.
- **Code-held tutee knowledge.** AlgoBo's Reflect-Respond pipeline holds a prescribed misconception and stops the LLM
  self-correcting until the learner teaches it. It produced knowledge-dense conversations (d = 0.71; Jin et al.
  CHI 2024, 40 novices) [S]. Expectancy is required: teaching helps only if the child studied *expecting* to teach
  (Kobayashi 2024) [LS].
- **Puppets increase reasoning talk.** In the PUPPETS project (16 teachers, ages 7-11, London and Manchester),
  puppet-posed problems increased engagement, justification and argumentation. Usually quiet children contributed,
  and teachers asked more open questions (Simon, Naylor, Keogh, Maloney & Downing 2008) [S].

### 2.2 Evaluating claims: the silly puppet, concept cartoons, would-you-rather
- **The Truth Value Judgment Task** is a 40-year-old validated developmental method. A story is acted out, then a
  puppet makes a statement and the child says whether the puppet is right, then why. It requires **plausible
  dissent**: the false reading must be easy to imagine (Crain & McKee 1985; Crain & Thornton 1998) [S]. This is the
  methodological ancestor of "help me check" and "is my friend right?".
- **Concept cartoons** show 3-5 characters with different opinions on a phenomenon, mostly common misconceptions
  plus one scientific view. They elicit children's ideas and drive argumentation without teacher intervention, and
  they are used as assessment tools for alternative ideas (Keogh & Naylor 1993 onward; Naylor, Keogh & Downing
  2007) [S]. **"Who do you agree with?" is a two- or three-option diagnostic choice in disguise.** Each character's
  view maps to a kit `misconceptionId`.
- **Comparison.** Comparing two worked solutions side by side beat studying them one at a time for 7th-grade
  equation solving: better procedural flexibility and transfer (Rittle-Johnson & Star 2007) [S]. Correct plus
  incorrect examples helped 4th-5th graders with decimals (Durkin & Rittle-Johnson 2012) [S]. Would-you-rather and
  two-character disagreement are comparison probes.

### 2.3 Prediction, counterfactual and "what if"
- **Prediction** works as a probe at all ages, but as a learning move it needs explicit resolution for children with
  low executive function (Brod 2018/2020/2021) [LS].
- **Counterfactual "what if" answers become reliable by 6-7 and reach ceiling by 8-9** in developmental tasks. Their
  executive-function and verbal load is high (McCormack et al.; Kominsky; reviews) [S]. Counterfactual prompts can
  scaffold both inquiry and concept learning, helping children get past misconceptions [S]. **Rule:** at B1, ask
  "what if" with a picture or sim showing both worlds; from B2, voice-only is fine [U].

### 2.4 Stories, roles and real-life contexts
- **Story completion** is validated mostly for *socio-emotional* constructs (MacArthur Story Stem Battery). No
  validated story-completion instrument for science or maths concepts was found [S]. **Its use here is a design
  extrapolation [U].** It is graded by the concept-bearing outcome and its causal link, never by story quality.
- **Interest personalisation** helped Algebra I students (145 students, Cognitive Tutor; Walkington 2013).
  Superficial name-swaps triggered interest but did little for performance (Walkington et al. 2013/2015) [S]. **The
  interest context must change the quantitative or causal engagement**, not only the nouns. This is what makes C20
  a real transfer probe rather than a re-skin.
- **Conversation-based assessment (ETS trialogues):** answers given to virtual agents did not differ on the
  constructs from answers given to human interviewers, and students perceived the tasks positively (Zapata-Rivera et
  al.; Lopez et al. 2021, English learners) [S]. This is evidence that agent-mediated conversational evidence is not
  degraded by the agent.

### 2.5 Games and dynamic assessment
- **Stealth assessment** in Plants vs Zombies 2 and Physics Playground: in-game measures correlated significantly
  with external measures (Shute et al. 2016) [S]. A game-based rational-number assessment for 4th graders was
  comparable to paper (Kiili et al.) [S]. Number-line estimation is a valid achievement marker (6,484
  Luxembourgish 9th graders) [S].
- **Games and anxiety:** the maths-anxiety reduction from games is small and not robust, and weaker for digital games
  (meta-analysis, *Computers & Education* 2022) [S]. **Do not claim that games remove anxiety. Claim that they remove
  evaluation framing**, which is the validity mechanism (§0.3).
- **Dynamic assessment (graduated prompts):** static and dynamic scores predict achievement similarly, but
  learning-potential scores add unique variance (24 studies; Caffrey, Fuchs & Fuchs 2008) [S]. Hint-ladder depth on
  a *new* item (C34) is a learning-potential measure, not only a knowledge measure.

### 2.6 Delayed probes
- Successive relearning (retrieve to criterion, then relearn in later sessions) gives large long-term retention
  gains. Evidence in children is thin: about one experiment in middle school (Rawson & Dunlosky lineage) [S].
  Delayed keyword summaries diagnose at G = 0.70 vs 0.29 when given immediately (Thiede 2003) [LS]. Pre-questions
  before teaching help kindergarten and early-elementary children but not preschoolers (pretesting reviews) [S]. So
  an **opening prediction or guess** is both a pretest benefit and a prior-model probe (C14).

---

## 3. Probe-shape record (the registry fields)

Each shape in §4 becomes one record in `server/comprehension/probes/shapes.js` [U, proposed]:

```ts
interface ProbeShape {
  id: string;                       // 'C01'…'C36'
  family: 'roleRev'|'evaluate'|'compare'|'predict'|'story'|'apply'|'represent'|'delayed'|'game';
  topicTypes: TopicType[];          // T1 verbatim · T2 vocab/language · T3 concept/why · T4 procedure · T5 problem-solving
  bands: Band4[];                   // B1 (Cl 1-2) · B2 (3-4) · B3 (5-7) · B4 (8-9)
  gate: 'any'|'introduced'|'learned_today'|'mastered';   // earliest skill display state at which it may run
  emits: EvidenceClass;             // LEARNER-MODEL §6.1 closed set
  kitInputs: ('expectations'|'misconceptions'|'items.kind:*'|'interestContexts'|'workedExample')[];
  grader: 'code'|'llm-closed'|'code+llm';   // never free-form LLM verdicts
  lrBand: 'high'|'medHigh'|'med'|'low';     // design prior; replaced by calibration (§7)
  testRisk: 'veryLow'|'low'|'med';          // perceived-test risk (§1), measured by §7 M-PT
  costSec: [number, number];
  confounds: string[];
  needsVisual: boolean;             // B1 often true; tap fallback for ASR-risky answers
}
```

LR bands follow learning-science §7.1: High ≈ 3-10, Medium-High ≈ 2-4, Medium ≈ 1.5-3, Low ≈ 1.1-1.5. These are
priors for the outcome tables in LEARNER-MODEL §6.1. Shapes emitting the same class share that class's table at
launch [U].

---

## 4. The library: 36 probe shapes

Notation: **Shape** describes the move. **Listen for** is the evidence. **Rubric** is how it is graded against the
kit. T and B columns use ● good fit, ◐ with adaptation, ○ avoid.

### Family A — Role reversal (the child is the expert)

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C01 | Announced protégé teach-back | ◐ | ◐ | ● | ● | ● | ◐ | ● | ● | ● | probe.teachback | high | low |
| C02 | Real-listener relay (explain to a family member) | ○ | ◐ | ● | ◐ | ◐ | ● | ● | ◐ | ○ | probe.teachback | medHigh | veryLow |
| C03 | Protégé's naive "but why" | ○ | ○ | ● | ◐ | ● | ◐ | ● | ● | ● | probe.why | high | veryLow |
| C04 | Protégé holds the child's misconception | ◐ | ● | ● | ● | ● | ◐ | ● | ● | ● | probe.errorspot | high | veryLow |
| C05 | Revoice with a twist | ○ | ◐ | ● | ● | ◐ | ○ | ◐ | ● | ● | probe.errorspot | medHigh | low |
| C06 | "Say more" uptake on the child's own word | ◐ | ● | ● | ◐ | ● | ◐ | ● | ● | ● | probe.why | med | veryLow |

**C01 Announced protégé teach-back.**
*Shape:* At concept start, a pretend character (care-receiving and younger for B1-B2, a curious peer or alien
for B3-B4) is set up as the one the child will explain to at the end. At the end the child explains. The
character asks at most one naive follow-up, aimed at the first uncovered expectation.
*Listen for:* coverage of each kit `expectations[i]`; any `misconceptions[].signs`; correct vocabulary.
*Rubric:* the LLM judges each expectation separately into {present, partial, absent, contradicted}. The outcome is
the coverage fraction mapped to the `probe.teachback` buckets (≥ .8 / .5-.8 / < .5 / misconception). A
"contradicted" verdict, or a matched sign, routes to the misconception bucket and schedules a C04 or C09 verifier
(detect → verify, M2).
*Confounds:* verbal fluency in the language of explanation. An English-weak child explaining in Hinglish must not be
penalised; grading is language-agnostic. ASR quality. Parent coaching (`assisted`).
*Evidence:* Kobayashi 2019/2024 [LS]; Rittle-Johnson 2008 [S]; Tarakli 2025 [V]; AutoTutor EMT [LS].

**C02 Real-listener relay.**
*Shape:* The child records a short voice note for a named family member ("for dadi", "for papa at dinner")
explaining the day's idea. The family member gets it in the parent loop. Alternatively, the child is asked to
explain it at dinner and the parent taps a three-face recap.
*Listen for:* the same as C01. Scored from the recorded note only; the parent's tap is engagement, not evidence.
*Rubric:* as C01. `assisted = 'parent'` if a parent voice is detected on the note → LR^0.5 (LEARNER-MODEL rule 4).
*Confounds:* privacy (voice note to family only, consented); performance pressure for shy children, so it is opt-in.
*Evidence:* Rittle-Johnson, Saylor & Swygert 2008 (explaining to mum gave the most transfer) [S]; Kobayashi 2019:
actually teaching beats preparing to teach [LS].

**C03 Protégé's naive "but why".**
*Shape:* After a child's answer or explanation, the character, not the teacher, asks the obvious-sounding why
question that targets the one expectation the child skipped. Because it comes from a character who "doesn't
know", it reads as curiosity, not doubt.
*Listen for:* the causal or structural reason.
*Rubric:* `probe.why` {full, partial, none, misconception}. Graded against the single target expectation plus the
misconception signs.
*Confounds:* B1 children who understand but cannot verbalise. Offer a two-reason choice instead (C10 form).
*Evidence:* "why" after a correct answer exposes hidden misconceptions (Imran & Bulathwela 2026) [LS]; the
TVJT/puppet authority inversion [S].

**C04 Protégé holds the child's misconception.**
*Shape:* The character confidently says or does the thing the child's active misconception predicts. The
misconception is code-held and frozen until the child corrects it with a reason. The character does not concede to
a reasonless "no".
*Listen for:* does the child notice, contest it, and give the right reason?
*Rubric:* `probe.errorspot` {caught+fixed, caught, missed}. "Caught" = the child disputes; "fixed" = the reason
matches the kit expectation or remediation. "Missed" (the child agrees) is strong evidence *for* the misconception
→ misconception layer +1, with verification by a different shape.
*Gate:* `introduced` at least (the child has seen the right idea). For novices, use C01 first [LS rule 6].
*Confounds:* children defer to a confident character. Mitigate with a "not very smart" persona (TVJT).
*Evidence:* AlgoBo [S]; CoWriter copying the child's own errors [S]; papers M6 [LS].

**C05 Revoice with a twist.**
*Shape:* The teacher paraphrases what the child just said ("so you're saying …") but bends it slightly toward the
nearest kit misconception. The child accepts or corrects it. Revoicing is a standard classroom talk move, so it does
not feel like a check.
*Listen for:* acceptance of the distorted version (bad), correction (good), and the reason.
*Rubric:* as C04, graded by code on accept/reject plus the LLM on the reason against the target expectation.
*Gate:* B3+ only, and at most once per concept. Always restate the correct version afterwards.
*Confounds:* the repeated-question effect and politeness, since children agree with adults' summaries. This is the
riskiest shape for deference, so its LR is capped at medHigh [U].
*Evidence:* Accountable Talk revoicing and press-for-reasoning (Michaels, O'Connor & Resnick); talk-move classrooms
had higher standardised maths scores [S]; deference literature [S].

**C06 "Say more" uptake.**
*Shape:* Pick up a specific word or idea the child used and ask the child to expand on it (uptake), without
evaluating it.
*Listen for:* elaboration that adds a new expectation, or exposes a sign.
*Rubric:* incremental expectation coverage added to the same episode. It does not emit on its own unless a
misconception sign appears.
*Evidence:* uptake predicts achievement growth (Nystrand & Gamoran) [S]; AutoTutor "pump" [LS].

### Family B — Evaluate a claim (someone else is maybe wrong)

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C07 | Help me check my work (teacher slip) | ◐ | ● | ◐ | ● | ● | ○ | ◐ | ● | ● | probe.errorspot | medHigh | low |
| C08 | Silly-puppet story statement (TVJT) | ● | ● | ● | ◐ | ◐ | ● | ● | ◐ | ○ | item.mcq2 | med | veryLow |
| C09 | Two friends disagree (concept cartoon) | ○ | ◐ | ● | ◐ | ● | ◐ | ● | ● | ● | item.mcq3 (+ probe.why) | medHigh | low |
| C10 | Would-you-rather where the concept decides | ○ | ◐ | ● | ● | ● | ● | ● | ● | ◐ | item.mcq2 (+ probe.why) | med | veryLow |
| C11 | Spot the fake (two truths and a myth) | ● | ● | ● | ○ | ○ | ○ | ◐ | ● | ● | item.mcq3 | med | low |
| C12 | Odd one out, with no single right answer | ◐ | ● | ● | ◐ | ◐ | ● | ● | ● | ● | probe.why | med | veryLow |

**C07 Help me check my work.** *Shape:* The teacher "solves" a problem aloud or on screen with one planted step
error drawn from a kit misconception, and asks the child to look it over, as if the teacher were unsure.
*Rubric:* `probe.errorspot`: locating the step is code (tap or step index); the fix is code against `answer`; the
explanation is the LLM against the target expectation. *Gate:* `learned_today` [LS]. Always resolved. *Evidence:*
McLaren 2016, Große & Renkl 2007 [LS]; "verification" feedback had the best productive-continuation rate (Abrar
2026) [LS].

**C08 Silly-puppet story statement.** *Shape:* A tiny story or scene is shown or told, then a "not very smart"
puppet sums it up with one statement that is either right or wrong (with plausible dissent). The child is the
referee: right or wrong, then why. *Rubric:* right/wrong verdict by code (`item.mcq2` table: weak alone, guessing at
50%); a "why" follow-up upgrades it to `probe.why`. Two statements per story, one true and one false, keep yes-bias
out. *Best for:* B1-B2 language (plurals, tense, prepositions), EVS facts, magnitude comparisons. *Evidence:*
TVJT (Crain & Thornton 1998) [S]; puppets and engagement [S].

**C09 Two friends disagree.** *Shape:* Two (B1-B2) or three (B3+) named pretend children hold different views
about a phenomenon. Each wrong view is a kit misconception. The child picks who is right and says what they would
tell the others. *Rubric:* choice → `misconceptionId` by code (from the kit `diagnostic.options`, re-voiced as
characters); "what would you tell them" → `probe.why`. *Evidence:* concept cartoons [S]; Eedi-style diagnostic
distractors [LS].

**C10 Would-you-rather where the concept decides.** *Shape:* Offer the child a preference choice between two
things whose value depends on the concept: the bigger share, the faster route, the cheaper deal, the plant that will
grow, the sentence that sounds right to a British friend. The child picks for themselves and the teacher asks,
playfully, why that one. *Rubric:* choice vs key by code; reason via `probe.why`. A "because I like it" answer
gets one more playful push, then is scored NA (no update), not wrong. *Why it is covert:* the question asks for
the child's *preference*, an authentic question, and correctness emerges from it. *Confounds:* genuine preference
overriding value (a child who hates the "better" fruit); the reason disambiguates. *Evidence:* comparison
learning [S]; authentic questions [S]; design extrapolation [U].

**C11 Spot the fake.** *Shape:* The teacher says three "amazing facts" about the topic. One is a myth built from a
kit misconception. The child guesses which is fake. *Rubric:* code; the myth's `misconceptionId` is recorded if
the child accepts it as true. *Confounds:* trivia guessing, so it needs a "why" to count above `item.mcq3`.
*Evidence:* discrimination probes [LS §1.14 B]; [U] for the format.

**C12 Odd one out, with no single right answer.** *Shape:* Four items in which several could be the odd one out on
different grounds. The child picks one and justifies it. *Rubric:* the LLM labels the *ground* named into a closed
set derived from the kit (deep feature vs surface feature). A deep-feature justification is evidence for
T2/T3 understanding. Because more than one answer is right, it never feels like a trap. *Evidence:*
deep-structure vs surface sorting in expertise research (Chi, Feltovich & Glaser 1981 lineage) [S]; [U] for
children.

### Family C — Compare and sort

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C13 | Sort by "same trick inside" | ○ | ● | ● | ◐ | ● | ◐ | ● | ● | ● | probe.transfer.near | medHigh | low |
| C14 | Which way would you do it? (method choice) | ○ | ○ | ◐ | ● | ● | ○ | ◐ | ● | ● | item.mcq2 → probe.why | high (maths) | low |
| C15 | Which one would you give a friend to trick them? | ○ | ● | ● | ● | ● | ○ | ◐ | ● | ● | probe.errorspot | med | veryLow |

**C13 Sort by "same trick inside".** *Shape:* 4-6 mini-problems or examples. The child groups the ones that "work
the same way" into bins (on screen). *Rubric:* code compares the bins with the kit's skill labels. Grouping by deep
structure = pass; grouping by surface (same context or numbers) = fail. *Evidence:* card-sort expertise tasks
[S]; interleaving [LS].
**C14 Method choice.** *Shape:* Before solving a mixed problem, the child says which approach they would use (or
which of two shown approaches is smarter here). *Rubric:* choice vs key by code; reason via `probe.why`.
*Evidence:* Rohrer interleaving [LS]; Rittle-Johnson & Star 2007 comparison [S].
**C15 Which one would you give a friend to trick them?** *Shape:* After practice, the child picks (or invents) the
item most likely to trick a friend, and says what the friend would wrongly answer. *Listen for:* the child naming
the misconception's predicted wrong answer means they know where the trap is. That is strong evidence of
discrimination, and it makes the child the "trickster". *Rubric:* the predicted wrong answer is matched by code to
the kit misconception's diagnostic option; the item choice is checked by code against items that `targetsMisconception`.
*Evidence:* [U]. Related to problem-posing [LS P13] and metacognitive monitoring.

### Family D — Predict, what-if, make it happen

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C16 | Prediction bet before the reveal | ○ | ○ | ● | ◐ | ● | ◐ | ● | ● | ● | probe.predict | medHigh (misc id) | veryLow |
| C17 | What would happen if… (counterfactual) | ○ | ○ | ● | ○ | ● | ◐ | ● | ● | ● | probe.transfer.far | high | low |
| C18 | Make it happen (reverse design) | ○ | ◐ | ● | ● | ● | ○ | ◐ | ● | ● | probe.transfer.far | high | low |
| C19 | Ballpark first (estimation) | ○ | ○ | ◐ | ● | ● | ◐ | ● | ● | ● | probe.transfer.near | med | veryLow |

**C16 Prediction bet.** *Shape:* Before a sim run, animation, or a "what happened next" in the story, the child
commits to a prediction (tap a pad, choose, or say it), optionally with a pretend-coin bet for B3+. *Rubric:* the
prediction is mapped by code to the kit misconception it signals (`probe.predict` {right, mapped-wrong, other}).
Bet size is calibration data for B3+ only. *Evidence:* Brod [LS]; pretesting benefits in early elementary [S];
hypercorrection [LS].
**C17 What would happen if.** *Shape:* Remove or change one cause in a familiar situation (no friction, no sun for a
week, double the denominator, take away the helping verb) and the child says what changes and why. B1: show both
worlds visually. *Rubric:* LLM, closed labels {correct consequence + causal link, consequence only, wrong, signs a
misconception}. *Evidence:* counterfactual competence reaches ceiling around 8-9 [S]; counterfactual prompts aid
concept learning [S].
**C18 Make it happen.** *Shape:* Give the outcome and ask the child to set up the conditions (build a circuit that
lights only one bulb; give a number that rounds to 50; write a sentence where "bank" means river). *Rubric:* code
verifies the construction wherever possible (the sim evaluates it, or the solver checks the number). The LLM is used
only for open language items. *Evidence:* reverse and problem-posing tasks [LS P13]; the sim law evaluator
(FACTORY `predict-run`).
**C19 Ballpark first.** *Shape:* Before an exact calculation, a quick "roughly how much?" framed as a guessing game.
*Rubric:* code checks that the estimate is within a tolerance band of the true value. A wildly off estimate with a
correct exact answer means procedure without magnitude sense (a misconception flag). *Evidence:* number-line
estimation validity [S]; Kiili [S].

### Family E — Story and role-play

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C20 | Story that stops where the concept decides | ◐ | ● | ● | ◐ | ● | ● | ● | ● | ◐ | probe.transfer.near | medHigh | veryLow |
| C21 | Role-play shop, kitchen, station or match | ○ | ● | ◐ | ● | ● | ● | ● | ● | ◐ | item.open (in role) | high (T4) | veryLow |
| C22 | Advice to a character in trouble | ○ | ◐ | ● | ◐ | ● | ◐ | ● | ● | ● | probe.transfer.far | high | veryLow |
| C23 | Choose-the-path adventure | ○ | ● | ● | ◐ | ● | ● | ● | ● | ◐ | item.mcq2/3 | med | veryLow |

**C20 Story that stops where the concept decides.** *Shape:* A short serial story (it can carry on across sessions;
TeacherMemory) pauses at the moment where only the concept determines what happens next. The child finishes the
moment. *Rubric:* the LLM labels the *outcome* the child gives into {concept-correct, misconception-predicted, other}
plus whether a causal link was stated. Story quality is ignored. *Evidence:* story completion is validated for
socio-emotional constructs only [S]; its use for concepts is [U]. Graded as near transfer because the deep structure
matches the taught case.
**C21 Role-play.** *Shape:* The child plays a role whose job needs the concept: shopkeeper giving change,
station master reading the 24-hour clock, cricket scorer working out run rate, cook halving a recipe, editor fixing
a headline's tense. *Rubric:* each in-role answer is an `item.open` graded by code against the solver. Hint use in
role counts as rungs. *Evidence:* FACTORY `shop-stall`/`dukaan` [LS]; interest personalisation needs real
quantitative engagement (Walkington) [S].
**C22 Advice to a character in trouble.** *Shape:* A character has a problem in a situation the child knows (a plant
wilting in a dark cupboard, ice cream melting on the way home, a friend's email that sounds rude). The child advises.
*Rubric:* the LLM checks whether the advice applies the target expectation (closed labels). Then code checks that
the advised action is in the kit's verified set (answer/acceptable). *Evidence:* far-transfer application [LS P4];
[U] for the shape.
**C23 Choose-the-path adventure.** *Shape:* A branching mini-story. At each fork, the right concept picks the path
that works and a misconception picks a path with a visible, funny consequence. *Rubric:* each fork is an
`item.mcqK` with misconception-mapped options (code). *Evidence:* FACTORY misconception trap design [LS]; [U].

### Family F — Apply to the child's own world (authentic questions)

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C24 | Where have you seen this? (child's own example) | ○ | ● | ● | ◐ | ◐ | ◐ | ● | ● | ● | probe.transfer.far | high | veryLow |
| C25 | Hunt in your house (find real instances) | ○ | ● | ● | ○ | ◐ | ● | ● | ● | ◐ | probe.transfer.far | high | veryLow |
| C26 | Interest-context remix (deep, not cosmetic) | ○ | ◐ | ◐ | ● | ● | ◐ | ● | ● | ● | probe.transfer.near | high | veryLow |
| C27 | Make a puzzle for me | ○ | ● | ◐ | ● | ● | ○ | ◐ | ● | ● | probe.transfer.far | medHigh | veryLow |

**C24 Where have you seen this?** *Shape:* A genuinely curious question about the child's life ("is there one of
these in your house or game?"). *Rubric:* the LLM classifies the child's example as {valid instance, invalid
instance matching a misconception, irrelevant} against the kit's concept definition and expectations. **A valid
example never seen in the lesson is strong far-transfer evidence.** An invalid example schedules a verifier (it is a
detection, not a verdict). *Evidence:* learning-science P24 "unprompted connection", here elicited [LS];
authentic questions [S].
**C25 Hunt in your house.** *Shape:* A 60-second real-world hunt (find something that floats, a three-sided shape, a
word with "ph", a conductor). The child reports or holds it up to the camera if the camera is permitted (default
voice only). *Rubric:* as C24. It also counts as a movement break (motivation layer). *Evidence:* [U]; physical
activity break before a maths test reduced test anxiety in one study [S, PMC7084198, adjacent only].
**C26 Interest-context remix.** *Shape:* Re-pose a taught structure inside the child's interest tag, in a way that
changes what the child does with quantities or causes, not only the nouns (cricket: required run rate, not
"Virat has 3 apples"). *Rubric:* code against the solver. *Evidence:* Walkington 2013 vs the superficial-swap
null [S]; kit `interestContexts`.
**C27 Make a puzzle for me.** *Shape:* The child invents a problem for the teacher (or the protégé) whose answer
is a given number or idea. The teacher solves it, and sometimes "gets it wrong" so the child can mark it (B3+).
*Rubric:* code checks that the child's problem actually yields the target (the solver runs on the child's numbers).
A malformed problem is labelled into kit signs. *Evidence:* problem-posing [LS P13]; Brod: question generation is
weak as a learning move before secondary school, so at B2 it is used as a probe only [LS].

### Family G — Show it (representation)

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C28 | Show me on the thing (translate representation) | ○ | ◐ | ● | ● | ● | ● | ● | ● | ● | probe.transfer.near | medHigh | low |
| C29 | Finish my drawing / diagram | ○ | ○ | ● | ◐ | ◐ | ○ | ◐ | ● | ● | probe.transfer.near | med | low |
| C30 | Act it out / be the particle | ◐ | ● | ● | ○ | ○ | ● | ● | ◐ | ○ | item.mcq2 | low-med | veryLow |

**C28 Show me on the thing.** *Shape:* The child moves between representations on a manipulative (put 3/4 on the
bar, place −2 on the line, drag the sentence parts into order). *Rubric:* code reads the manipulative state.
*Evidence:* concreteness fading [LS]; FACTORY `match-reps` [LS].
**C29 Finish my drawing.** *Shape:* A partially drawn diagram (food chain arrows, a circuit gap, a shadow) for the
child to complete. Drawing is only used with partial scaffolds. *Rubric:* code where elements snap to slots;
otherwise the LLM vision model labels into closed elements. *Evidence:* drawing-to-learn depends on guidance;
partially provided drawings are the best-supported form (Fiorella & Zhang 2018; 2025 meta-analysis "without
integration everything is nothing") [S]; Brod: drawing is weak as a learning move in primary [LS].
**C30 Act it out.** *Shape:* B1-B2 embodiment: "be the water when it gets cold" (child says or does slow/fast,
spread/close), or "show me 'under' with your hand". Voice or camera is optional; the child self-reports a choice.
*Rubric:* closed choice by code. Low LR, mainly engagement. *Evidence:* [U].

### Family H — Delayed and woven (the durability truth signal)

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C31 | Callback in passing ("remember the …?") | ● | ● | ● | ● | ● | ● | ● | ● | ● | (same class as the original, with Δt) | highest | veryLow |
| C32 | Woven sub-step 2-3 topics later | ○ | ◐ | ● | ● | ● | ◐ | ● | ● | ● | item.open / probe.transfer.near | highest | veryLow |
| C33 | Headline for yesterday's episode | ○ | ◐ | ● | ◐ | ◐ | ○ | ◐ | ● | ● | probe.teachback (short) | medHigh | low |
| C34 | New protégé arrives (delayed teach-back) | ○ | ◐ | ● | ● | ● | ◐ | ● | ● | ● | probe.teachback | highest | low |

**C31 Callback in passing.** *Shape:* At session open, or mid-story, the teacher references a shared moment from
an earlier session (TeacherMemory: "the pizza", "the rude email", "the melting kulfi") and continues the thread with
a new twist that needs the earlier idea. It is never phrased as "do you remember what X is". *Rubric:* as the
original shape's class. KT handles Δt via retrieval gating (rule 3). *Evidence:* delayed retrieval [LS P10];
successive relearning [S]; G = 0.70 delayed vs 0.29 immediate [LS].
**C32 Woven sub-step.** *Shape:* A problem in the *current* topic is built so that an earlier topic's skill is a
necessary sub-step (fractions inside a ratio problem; past tense inside a story-writing task). The child meets the
earlier concept as part of new work. *Rubric:* code grades the sub-step separately (a conjunctive item with blame on
the weakest skill, KT §1.5). *Evidence:* the LearnLM RCT outcome (a novel problem on a subsequent topic) [LS];
papers M7 [LS]. **This is the owner's "2-3 topics later" request, done covertly.**
**C33 Headline for yesterday's episode.** *Shape:* The child gives the "title", "WhatsApp status" or one-line
headline of the last session's idea, for the parent card or the protégé's diary. *Rubric:* the LLM checks the
single core expectation (kit `expectations[0]` or the item `answer` key idea) {present, partial, absent,
misconception}. *Evidence:* Thiede 2003 [LS].
**C34 New protégé arrives.** *Shape:* Days later, a different character arrives who missed the lesson. The child
brings them up to speed. *Rubric:* as C01, with Δt. It is the strongest single durable-understanding probe, because
it combines generation, delay and no warning. *Evidence:* Kobayashi (delayed benefits held) [LS]; [U] for the
combination.

### Family I — Game-embedded (Forge telemetry)

| id | shape | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | emits | LR | test-risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C35 | Misconception trap level | ◐ | ● | ● | ● | ● | ● | ● | ● | ● | item.mcqK / ModuleEvent | med-high | veryLow |
| C36 | Graduated-prompt new item (learning potential) | ○ | ◐ | ◐ | ● | ● | ● | ● | ● | ● | item.open (C0-C4 rungs) | high (KT) | low |

**C35 Misconception trap level.** *Shape:* A Forge level whose distractor pads, bins or paths are kit misconception
predictions (FACTORY §4.10 `numberline-jump`, `sort-build`, `predict-run`). The child's choice has an in-world
consequence. *Rubric:* the host re-grades the claim (bridge `answer` → host `verdict`). `misc` maps to
`misconceptionId`. `gaming` patterns discount the evidence. *Evidence:* stealth assessment validity [S];
papers M5 (r = 0.333 with post-test) [LS].
**C36 Graduated-prompt new item.** *Shape:* A slightly novel item with the four-rung hint ladder (pump → hint →
prompt → assertion, kit `hints`). Rungs consumed are the measure, and the next near-transfer item after the hints
shows whether the help was absorbed. *Rubric:* `item.open` C0-C4 by code. A second, unaided item after help = the
learning-potential signal. *Evidence:* Caffrey, Fuchs & Fuchs 2008 (learning potential adds variance) [S];
Resing dynamic testing of strategy change [S]; hint-ladder KT [LS P15].

**Passive signals that run under every shape** (not shapes themselves; learning-science P15-P22): hint use,
self-correction, child-initiated questions, onset latency and disfluency z-scored per child (LR ≤ 1.5 or trigger
only; `voice-features-longitudinal`), and "pata nahi" loops. These never decide on their own [LS rule 7].

---

## 5. Grading rubric against kit expectations (code first, LLM closed)

### 5.1 The six rubric operators

| op | used by | input from kit | how | output |
|---|---|---|---|---|
| **R-KEY** | C07 fix, C10, C14, C18, C19, C21, C26, C27, C28, C32, C36 | `items[].answer`, `acceptable`, solver | **code**: normalise (numerals in EN/Hindi words, units, ₹, fractions as `MathValue` strings) → exact or tolerance match; the solver runs on child-generated numbers | correct / wrong / NA |
| **R-OPT** | C08, C09, C11, C16, C23, C35 | `misconceptions[].diagnostic.options[].misconceptionId` | **code**: the chosen option → its `misconceptionId` or `correct` | key / misc-id / other |
| **R-EXP** | C01-C03, C06, C17, C20, C22, C33, C34 | `expectations[]` | **LLM-closed, one expectation per call**: {present, partial, absent, contradicted} with a quoted span from the transcript (no span → absent). Reasoning model, moderate effort, single sample (papers M9) | coverage fraction |
| **R-MIS** | all generative shapes | `misconceptions[].signs`, `belief` | **retrieve → rerank** into the closed misconception list (papers M3); an LLM match needs a quoted span; it is a *detection* → schedules a verifier (C04/C09/C35) | candidate misc-id (hypothesis) |
| **R-INST** | C12, C24, C25, C29 | expectations + concept definition + the kit's verified example set | **LLM-closed classification** {valid instance, invalid-misc, irrelevant}, then code checks against the verified list where one exists; unknown valid instances are queued for human review into the kit | instance verdict |
| **R-CATCH** | C04, C05, C07, C15 | the planted error's misc-id | **code** for accept/reject and the locate step; R-EXP for the reason | caught+fixed / caught / missed |

### 5.2 Rules every grader obeys
1. **The child's confidence is not evidence of correctness**, and the grader never sees the teacher's reaction
   turn. It grades the child span against the key only, to block the sycophancy drift seen in EduFrameTrap
   (Kasneci & Kasneci 2026) [V] and the up-to-15-point drop under student-proposed answers [LS].
2. **Language-agnostic.** The expectation is judged on meaning, whether the child answered in English, Hindi,
   Hinglish or a mix. The rubric prompt includes the kit `prompt_en` and `prompt_hi` and the expectation in English.
   Vocabulary expectations (T2 English) are the only place where the language of the answer is itself the target
   [U].
3. **"Partial" never scores.** It routes to one follow-up shape from a different family (papers M9: graders are
   weakest in the mid band) [LS].
4. **Low ASR confidence = NA**, never wrong (LEARNER-MODEL rule 0). Prefer a tap or show fallback (C28) for
   numbers and choices.
5. **One quoted span per positive verdict.** No span means absent, so the grader cannot hallucinate coverage
   [U, mirrors LBM auditability].
6. **Calibration before trust:** a 300-turn human-labelled Indian-child set per family, EN and Hinglish
   stratified. Target κ ≥ 0.7 on R-EXP before its LR leaves the launch prior (learning-science rule 11) [LS].

### 5.3 Outcome → `EvidenceClass` mapping (no new classes)

| shape outcome | class | outcome index |
|---|---|---|
| coverage ≥ .8 / .5-.8 / < .5 / misc | probe.teachback | 0/1/2/3 |
| full / partial / none / misc on the target expectation | probe.why | 0/1/2/3 |
| caught+fixed / caught / missed | probe.errorspot | 0/1/2 |
| right / mapped-wrong / other | probe.predict | 0/1/2 |
| R-KEY pass/fail on a structure-matched novel item | probe.transfer.near | 0/1 |
| R-KEY/R-INST pass/fail on a new context the child chose or the teacher counterfactually built | probe.transfer.far | 0/1 |
| R-OPT on 2/3/4 options | item.mcqK | first-attempt correct / wrong |
| graded role-play or game step with rungs | item.open | C0…C4 / IDK / NA |

A delayed shape (C31-C34) uses its underlying class. The delay is carried by Δt in KT rule 1, not by a new class.
The `mastered` display state needs a delayed success (learning-science rule 2) [LS].

---

## 6. Selection policy (Director code, not LLM)

### 6.1 Which evidence is missing → which family
Per skill, the ledger flags (`unaided`, `generative`, `delayed`) say what evidence is still missing:
- missing **generative** → A (C01, C03, C06), D (C17), E (C20, C22)
- an active misconception **hypothesis** → a verifier from a *different* family from the detector: B (C04, C09), I (C35)
- missing **transfer** → F (C24-C27), D (C18), C (C13)
- missing **delayed** → H (C31-C34), scheduled when `retention` decays to the band (papers M7)
- novice (`introduced`) → only A, D (C16), G, I. No planted-error shapes before `learned_today`.

### 6.2 Filters
Topic type × band (tables above) → gate → `needsVisual` vs the current surface → the child's vibe layer (humour
and formality pick the *character* skin: a silly puppet for a playful B1, a deadpan alien for a sarcastic B4; it
never changes the rubric) → the novelty rule (§6.3).

### 6.3 Budget and novelty [U, starting values to tune in STUDENT-SIM]
- **At most one generative probe per concept per session.** No two probes back to back; at least one non-probe turn
  or a play beat between them.
- **No shape more than twice per session, and no identical shape on the same skill on consecutive days.**
  Rotating families stops a child learning the "tell", which would make any shape a recognisable test.
- **Predicted success for covert probes is 0.7-0.85** (anxiety moderator: easier is calmer) [V-derived].
  Discriminative difficulty comes from the misconception trap, not from a hard item.
- **Delayed probes:** 2-4 at session open, woven into the warm-up story [LS rule 5].
- **"Why" is applied to correct and wrong answers alike** at a sampled rate (100% for new skills, 30-50% for
  consolidating ones), so that it never becomes a signal of error (repeated-question effect) [S + LS].

### 6.4 Re-teach after a failed probe (the second half of the owner goal)
1. The failed probe's misc-id (if verified) → kit `remediation.representation` + `moveShape`.
2. Among eligible representations, pick by this child's **"worked after a failure" posterior** (LEARNER-MODEL §6.5
   format-efficacy layer; papers M11), with an exploration floor. Never by a "learning style" [LS §2].
3. Re-probe with a **different family** than the one that failed, at the next opportunity, and again delayed. This
   cross-family check is what separates "fixed" from "learned to pass that shape".

---

## 7. Validity threats and how each is measured

| threat | which shapes | detection / mitigation | measurement (feeds `context/measurements.md` when run) |
|---|---|---|---|
| **Deference/agreement bias** (child agrees with any confident speaker) | C04, C05, C07, C08 | TVJT plausible dissent; a "not very smart" character; balanced true and false statements; the yes-rate per child is monitored | **M-DEF:** the per-child agreement rate on true vs false statements; a child with > 80% "yes" on both has errorspot evidence discounted [U] |
| **Verbal-expression confound** (understands, cannot say it) | A, D17, E | choice or show fallbacks (C10 form, C28); language-agnostic R-EXP | **M-VERB:** DIF of R-EXP pass vs code-graded transfer by English-medium vs Hindi-dominant children |
| **Shape learned as a tell** | all | novelty rotation | **M-PT (perceived test):** after a sample of sessions, a three-face "did that feel like a test / a game / a chat" tap, per shape family, by band. Target: < 15% "test" for families A-I [U] |
| **Grader leniency/sycophancy** | R-EXP, R-INST | quoted-span rule; grader blind to the teacher's turns | **M-GRADE:** κ against human labels (300 turns per family, EN + Hinglish) |
| **Parent/sibling help** | C02, C25, home sessions | `assisted` flag → LR^0.5 | **M-ASSIST:** the rate of second-voice detection |
| **Covert probes are less valid than overt ones** (the core claim) | all | — | **E-COVERT** (STUDENT-SIM first, then pilot): for matched skills, compare each family's outcome against the **delayed** item (P10) and an overt kit diagnostic given at the end of the unit. Report each family's LR. Kill any family whose LR is < 1.5 after n ≥ 200 child-episodes [U] |
| **Anxiety moves the measurement** | evaluative vs covert | — | **E-FRAME:** randomise item framing (overt quiz vs covert shape, same item and key) within child; compare accuracy by an anxiety proxy (parent-reported or onboarding). The Désert prediction: the covert-framing gain is larger for anxious or low-SES children [S→U] |

STUDENT-SIM can test the *mechanics* (rubric code paths, selection policy, the budget, deference discounting) using
persona cards with `deference` and `verbal` knobs [U, a proposed card extension]. It **cannot** establish validity
on real children (papers §3: the simulated-vs-real AUC gap) [LS]. E-COVERT and M-PT need real pilots.

---

## 8. Bilingual quality (English-first, Hindi/Hinglish equal)

- Every shape is language-neutral. The character, story seed and stakes are rendered by the voice teacher in the
  child's current language mix (`language-english-first-bilingual`). The kit supplies `prompt_en`/`prompt_hi` for
  item content. The shape supplies only structure.
- **English-medium children:** English T2 shapes (C08 silly puppet on grammar, C10 "which sounds right to a
  British/American friend", C05 revoice for B4 writing) probe English *usage* without a grammar quiz. Hindi-transfer
  misconceptions (the plural-s gap in `c1-english` m1) are the planted errors.
- **Hindi/Hinglish children:** the same shapes. Discourse markers ("matlab", "na", "achha") are not disfluency
  (learning-science P19). A Hinglish answer to an English prompt is never a fail on T3-T5.
- Characters' names and contexts are Indian and varied across regions and genders. Humour skins come from the vibe
  layer. No sensitive categories (learning-science §8.5).

---

## 9. Implementable mechanisms (build list for `server/comprehension/**`)

1. `probes/shapes.js`: the 36-record `ProbeShape` registry (§3), a pure data plus an eval predicate that each record
   names a kit input and an `EvidenceClass` from the closed set.
2. `probes/select.js`: the Director-side selection (§6), with missing-evidence → family, the gate, the band filter,
   the budget and novelty. Property tests: no planted-error shape before `learned_today`; no repeat beyond the
   budget; "why" sampled independently of correctness.
3. `probes/protege.js`: the code-held protégé state (C01/C03/C04/C34). The misconception is frozen until a
   reasoned correction is graded `caught+fixed`. The LLM only skins words.
4. `grade/ops.js`: R-KEY, R-OPT and R-CATCH in pure code. R-EXP, R-MIS and R-INST are closed-label LLM calls (Azure
   OpenAI reasoning model, moderate effort), one expectation per call, with the quoted-span requirement.
5. `probes/weave.js`: C31/C32 schedulers. When decayed retention crosses the band, inject the earlier skill as a
   sub-step in the next generated item (Forge `ModuleRequest.want`) or as a story callback (TeacherMemory thread).
6. Kit additions (kit workflow, blind-verified): per misconception, a `characterView` (for C09) and a `myth` (for
   C11); per topic, a verified `instances[]` list (for R-INST); per T3 topic, one `counterfactual` stem (C17).
   These are data shapes, not teacher lines.
7. Measurements M-DEF, M-VERB, M-PT, M-GRADE and experiments E-COVERT and E-FRAME (§7) go to
   `context/inbox/*.json` as proposed measurement entries once run.

---

## 10. Sources

- Agarwal, D'Antonio, Roediger, McDermott & McDaniel 2014, *JARMAC* 3:131 — retrieval practice and test anxiety
  (1,408 students; 72% less nervous) [S]. https://pdf.retrievalpractice.org/guide/Agarwal_etal_2014_JARMAC.pdf
- Yang, Li, Zhao & Luo 2023, *Educ Psychol Rev* — practice tests reduce test anxiety, g = −0.52, 24 studies; only
  practice-test performance (easiness) moderated [V]. https://link.springer.com/article/10.1007/s10648-023-09801-w
- Désert, Préaux & Jund 2009, *Eur J Psychol Educ* — evaluative vs game instructions, ages 6-9, low-SES gap [S].
  https://link.springer.com/article/10.1007/BF03173012
- Stereotype threat in elementary children, meta-analysis 2025, *Eur J Psychol Educ* (17 studies, 25 effects; grades
  2-5) [S]. https://link.springer.com/article/10.1007/s10212-025-01025-6
- Rittle-Johnson, Saylor & Swygert 2008, *JECP* 100:215 — learning from explaining: does it matter if mom is
  listening? [S]. https://cdn.vanderbilt.edu/vu-sub/wp-content/uploads/sites/280/2023/08/04183157/ATME_MatthewsandRittle-Johnson_2009.pdf (cited within)
- Tarakli, Vinanzi, Moore & Di Nuovo 2025 — children teaching peer-like robots, n = 58 [V]. https://arxiv.org/abs/2506.18365
- CoWriter (EPFL): children aged 6-8 correct a robot's handwriting [S]. https://www.edweek.org/teaching-learning/robot-teaches-handwriting-by-turning-students-into-teachers/2015/03
- Jin, Lee, Shin & Kim, CHI 2024 — AlgoBo / TeachYou, Reflect-Respond [S]. https://arxiv.org/html/2309.14534v3
- Simon, Naylor, Keogh, Maloney & Downing 2008 — Puppets Project, ages 7-11 [S]. https://discovery.ucl.ac.uk/id/eprint/10000661/1/SimonNaylore2008Puppets1229.pdf
- Crain & Thornton 1998; TVJT overview [S]. https://www.researchgate.net/publication/242459343_The_Truth-Value_Judgment_Task
- Naylor & Keogh — concept cartoons [S]. https://www.tused.org/index.php/tused/article/view/273
- Rose & Blank 1974; Poole & White 1991; Siegal et al. 1988 — the repeated-question effect [S]. https://www.researchgate.net/publication/233822491_Conservation_or_conversation_A_test_of_the_repeated_question_hypothesis
- Display vs referential questions [S]. https://en.wikipedia.org/wiki/Display_and_referential_questions
- Nystrand, Gamoran et al. — authentic questions and uptake [S]. https://files.eric.ed.gov/fulltext/ED415525.pdf
- Michaels, O'Connor & Resnick — Accountable Talk; talk moves at scale [S]. https://arxiv.org/pdf/2311.10749
- Counterfactual reasoning development (ceiling 8-9) [S]. https://languageandlearninglab.com/wp-content/uploads/Chil-Dev-and-Behavior_2021-Chapter-7.pdf
- Walkington 2013 and the moderators paper (context personalisation) [S]. https://link.springer.com/article/10.1007/s40593-018-0168-1
- Zapata-Rivera et al.; Lopez et al. 2021 — conversation-based assessment [S]. https://onlinelibrary.wiley.com/doi/full/10.1002/ets2.12315
- Shute, Lu & Rahimi — stealth assessment [S]. https://files.eric.ed.gov/fulltext/ED612156.pdf
- Kiili et al. — game-based rational-number assessment [S]. https://www.semanticscholar.org/paper/Rational-Number-Knowledge-Assessment-and-Training-a-Kiili-Ojansuu/73007e8e132d72c8a57d9276de6f7aba91322377
- Number-line estimation validity, 6,484 ninth graders [S]. https://www.sciencedirect.com/science/article/abs/pii/S0022096522001503
- Games and maths anxiety meta-analysis 2022 [S]. https://www.sciencedirect.com/science/article/abs/pii/S0360131522002214
- Bonefont et al. 2022 — game-based assessment and test anxiety (n = 29 undergraduates; weak) [V]. https://pmc.ncbi.nlm.nih.gov/articles/PMC9274963/
- Caffrey, Fuchs & Fuchs 2008 — predictive validity of dynamic assessment [S]. https://link.springer.com/article/10.1007/s11145-022-10312-3 (cited within)
- Rittle-Johnson & Star 2007; Durkin & Rittle-Johnson 2012 — comparison and incorrect examples [S]. https://www.researchgate.net/publication/228339259
- Pretesting / prequestion review 2023 [S]. https://link.springer.com/article/10.1007/s10648-023-09814-5
- Successive relearning (Dunlosky & Rawson) [S]. https://www.apa.org/pubs/journals/features/stl-0000024.pdf
- Fiorella & Zhang 2018; drawing-to-learn meta-analysis 2025 [S]. https://link.springer.com/article/10.1007/s10648-025-10067-7
- Hasan, Bagayoko & Kelley 1999 — CRI; later work finds confidence does not cleanly separate misconception from
  ignorance [S]. https://iopscience.iop.org/article/10.1088/0031-9120/34/5/304
- Kasneci & Kasneci 2026 — sycophancy is an educational safety risk (EduFrameTrap) [V]. https://arxiv.org/abs/2605.14604
- Card-sort expertise (deep vs surface) [S]. https://www.lifescied.org/doi/full/10.1187/cbe.22-11-0230
- Story-completion methods (socio-emotional validation only) [S]. https://link.springer.com/article/10.1007/s12187-020-09745-5
