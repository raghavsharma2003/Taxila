# TEACHER BRAIN: the AI teacher that runs the whole app

**Date:** 2026-10-04 · **Status:** spec (buildable), with two measurements taken this session on Azure Foundry ·
**Directive:** `context/decisions.md#owner-superhuman-teacher-2026-10-04` ("the whole app, from the start, is
controlled by an AI teacher brain with components; the goal is a superhuman personalised teacher") · **Owner of this
spec:** main loop · **Code touched:** none in product paths; probes only under `evals/teacher-brain/`.
**Companion:** `docs/design/superhuman/STUDENT-FLOW.md` (every screen state and transition the brain drives).

**Tags.** **[V]** read in a primary source this session. **[S]** secondary (press, review, search summary).
**[U]** unverified or a design inference that must be measured. **[M]** measured by this session on Azure (method
and n in §14). **[T]** read in Taxila's own code, docs or `context/` this session.

**Read first, not repeated here:** `docs/research/conductor/CONDUCTOR.md` (the day actor, events, jobs, guards),
`docs/research/conductor/adaptation-policy.md` (R0-R14, `resolveKnob`), `docs/research/learner/LEARNER-MODEL.md`,
`docs/research/comprehension/COMPREHENSION-ENGINE.md`, `docs/research/psychology/RESEARCH-PROGRAM.md` (claim tiers,
`DecisionRecord`, MRT rules), `docs/research/world-best/*` (the 25 steals and five bets), `docs/design/PRODUCT-DESIGN-V2.md`,
`docs/design/gap-audit/BUILD-PLAN.md`, and the sibling superhuman specs `LIVE-STUDIO.md` (how things are built live),
`HUMAN-VOICE.md` (how she sounds) and `RELATIONAL-OS.md` (the bond; its contracts in §13 there are now the ones this
spec consumes: `RelationalDirective`, `TeacherAffect`, `Stage`).

**Critic pass (2026-10-04).** All five superhuman specs were reconciled into one system: one band table, one affect
producer, one memory owner, one authority order, one quota plan, and a turn-timing program (§5.4). Every change is
marked "critic" where it lands; the open items are in §21. This spec is the layer that **decides**: it says when Studio builds,
what Voice expresses, what the Relational OS may do, and how the day, the lesson and the turn fit together.

**Copy law.** Teacher speech appears here only as shapes, ⟨like this⟩. Nothing in this file is prompt text.

---

## 0. The answer on one page

**What the Teacher Brain is.** One per-child decision system with four clocks: the **turn** (one exchange, ~3 s),
the **beat** (a 30-180 s teaching segment: hook, explain, worked example, contrast, practice set, probe, reflect,
recap), the **lesson/day** (the sitting the Conductor planned), and the **long arc** (weeks to months: what this child
knows, how they learn, what they have made, how the relationship stands). Eight components feed it:

| component | owns | clock | today's code |
|---|---|---|---|
| **Conductor** | the day, week and term: what sitting, when, which lane, which topic | day | `server/conductor/*` (code reducer, M0 built) |
| **Director** | the lesson: phase, beat, move, item, hint rung | turn, beat | `server/director/state.js` `step()` |
| **Learner model** | what the child knows (KT ledger, θ, FSRS), how they learn (format and guidance posteriors), live experiments | turn → long arc | `server/learner/*`, `server/learner/kt/*` |
| **Comprehension engine** | did they *understand* (facets K/U/T/M, probes, re-teach) | turn, session | `server/comprehension/*` |
| **Relational OS** | the bond: stage, rituals, memory items, repair, dependency guard | turn, long arc | `rel_state` (session count only), floor predicates |
| **Live Studio** | what is built now and shown (games, sims, animations, diagrams, charts, images, mini-sites) | beat | `LIVE-STUDIO.md` (new `server/studio/*`) |
| **Voice and Face expression** | how each turn sounds and looks (moment → delivery plan, avatar program) | turn | `HUMAN-VOICE.md`, `src/avatar/behaviour.ts` |
| **Parent loop** | what the family sees and does (notes, evidence, try-at-home, controls) | day, week | `server/reports/*`, `src/parent/*` |

**The central decision: a code kernel arbitrates; models perceive, word and build.** Every *decision* (which beat,
which move, whether to build and what kind, which representation, when to stop) is made by deterministic code over
typed state, with randomisation only where an experiment is registered and logged. Models are used for exactly four
things: **perceiving** the child's words (classify + signals), **wording** her turns (the reply), **building** things
(Studio), and **writing** for adults (parent texts). This is measured, not assumed: on 12 labelled beat situations
the code policy was admissible 11/12 at 0 ms and fully reproducible, while the best LLM proposer was admissible
57/72 runs at 1.4 s p50, reproducible on 10-12/12 scenarios, and two models broke hard constraints (build with no
budget, build during strain) in 1/72 and 4/72 runs [M §14.1]. The labels and the code share an author, so the code's
11/12 is an upper bound; the latency, reproducibility and hard-violation results do not depend on the labels.

**Key decisions (reversal conditions in §19):**

| # | decision | evidence |
|---|---|---|
| TB1 | **One kernel, four loops.** `server/brain/kernel.js` runs `perceive → propose → arbitrate → act` per turn; `planBeat` at beat boundaries with a 1-2 beat lookahead; the Conductor's `decide` per day event; `foldLongArc` at lesson end and nightly. Components never call each other; they return typed **proposals** and **facts** | `conductor-code-reducer` [T]; MAST: 36.9% of multi-agent failures are inter-agent misalignment [S via T]; StratL steers an LLM tutor with a transition graph of intents chosen outside the model [V abs] |
| TB2 | **The beat is the planning unit for builds and pedagogy.** Beats are typed, have a duration estimate and a `neededAt` for any visual, and are planned 1-2 ahead so Studio gets ≥ 90 s of lead time | Studio's race needs 37-54 s p50 to playable, p90 ≤ 75 s [T LIVE-STUDIO §7]; the router demands lead ≥ 90 s [T] |
| TB3 | **What to build is a scored policy in code** over need × content affordance × kit truth × this child's format evidence × vibe and relationship modifiers × budget and lead time; library first; ≤ 1 piece on screen; ≤ 3 live builds per lesson; strain forbids a new build | §6; M1 [M]; `learner-one-engagement-machine` [T]; LIVE-STUDIO caps [T] |
| TB4 | **Per-turn signals ride on the classify call** (dialogue act, IDK split, personal share, interest tag, humour, meta requests): +25 ms (taxila-fast) / +91 ms (grok-4-20-non-reasoning) p50, grading labels unchanged 30/30, acts 29-30/30. **Critic re-run on the deployment production actually classifies with** (`grok-4-1-fast-non-reasoning`, `deploy-classify-grok`): see §14.3 | M2 [M §14.2, §14.3] |
| TB5 | **Negotiation is a priority-ordered auction with budgets, not a conversation.** Authority order (§10.1, reconciled with RELATIONAL-OS §2 precedence): safety and the relational floor (F1-F6, F8-F9) > the child's goodbye (RELEASE) > consent > parent controls > policy caps > cost governor > plan > **teacher-owned repair** > Director pedagogy > comprehension probes > rapport moves (callbacks, rituals, notices) > vibe > Studio novelty. Shared budgets: turn latency, the child's attention (one new thing at a time), the test budget, the novelty budget, money | `conductor-code-reducer` authority order [T]; `comprehension-probe-budget-scheduler` [T]; RELATIONAL-OS §2, §13 [T]; §10 |
| TB6 | **One `Moment` per turn drives voice and face together.** The kernel emits `Moment {move, verdict, engagement, teacherAffect, bondStage, safety, studio, band, lang}`; `teacherAffect` is produced by exactly one component, the RELATIONAL-OS affect engine (`appraise()`, TA1-TA8); HUMAN-VOICE's `momentPlan` and the avatar behaviour controller both read the Moment, so what she says, how she says it and what her face does cannot disagree. Neither voice nor face is keyed to the verdict (TA7, `design-v2-face-verdict-neutral`) | HUMAN-VOICE §5.1 [T]; RELATIONAL-OS §7 [T]; `design-v2-face-verdict-neutral` [T] |
| TB7 | **Experiments are first-class and bounded.** Every randomisable decision point is registered (`server/brain/experiments.js`), logs a `decision_record` with propensities, keeps a floor ≥ 0.10, runs in frozen 6-week windows, has harm outcomes as co-primary, and never touches the never-randomise list (safety, honesty, answer truth, the hint ceiling, consent, praise category, limits) | `decision-records-with-propensities`, RP-D7, RP-D12 [T]; Thompson with no floor inflated type-I error to .111, a .10 floor restored .048 [T] |
| TB8 | **"How this child learns" is a hierarchical posterior, never a label.** Per-child format, guidance and representation effects are shrunk to the population and act only as knobs inside admissible sets; parents never see "works for your child" claims | `psych-claim-tiers`, RP-D4 [T]; per-child format effect needs 78-487 delayed comparisons per arm [T]; CK-12 1M students: contextual bandits rarely beat a good one-for-all policy [T via world-best] |
| TB9 | **Nothing on the per-turn critical path is a new model call, and the turn gets faster, not just "no slower".** The brain's added work on the turn is ≤ 10 ms of code plus ≤ 100 ms of piggybacked output tokens; everything else (Studio plans and builds, memory distillation, parent texts, the LLM day-plan shadow) is off-path. The brain also owns the turn-timing program (§5.4): predictive end-of-turn, a visible receipt ≤ 150 ms, first audible teacher sound p50 ≤ 1.6 s, first reply audio p50 ≤ 2.5 s | cascade turn today: plan 2 ms median (max 5), store 65 ms, total 2.97-3.2 s speech-end → first audio [T measurements, `deploy-classify-grok`]; world-best S1/S3 [T] |
| TB10 | **The tutor leads, always.** No passive "ask me anything" mode; auto-start; the brain takes the initiative on every mistake; help is always reachable and never time-locked | `rj-passive-tutor` (Khanmigo 17% use), `rj-timed-help-lockout`, `rj-default-answer-mode` [T]; Khanmigo's 2026 redesign made the tutor auto-activate after 15% uptake [S] |
| TB11 | **Surveillance-grade engagement sensing is rejected.** No camera, gaze, face-affect or keystroke surveillance; engagement is inferred from task evidence and the child's own words only | Microsoft Code of Conduct (`ct-no-voice-emotion-inference`) [T]; Alpha School's "anti-pattern" vision model and "waste meter" with facial-expression tracking and offshore camera watchers, reported by former students as "a lab rat" [S] |
| TB12 | **Everything the brain decides is explainable after the fact.** Each turn writes a `brain_trace` row (inputs digest, proposals, winner, reason codes, latency); the parent's "How Taxila teaches {child}" page and every support question are answered from these rows, never from a model's recollection | `reports-*` gates [T]; replay contract CONDUCTOR §3.11 [T] |

**What "superhuman" means here, operationally** (each is a measurable product property, §15):
1. **It knows, turn by turn, whether the child understood**, with calibrated uncertainty and an honest "still
   checking" state, from conversation, play and delayed checks (comprehension engine), not from a quiz score.
2. **It makes the right thing for this child's mistake within one explanation**: a game, simulation or animation
   built for that misconception, correct by construction, waiting on cue (Studio, lead-time planning).
3. **It remembers every attempt and every thing the child made, for months** (with consent), and brings the right
   one back at the right time (FSRS, weave, relational callbacks).
4. **It learns how children like this one learn from every child**, through registered experiments, and applies it
   with shrinkage to this child (bandits, MRT, hierarchical posteriors).
5. **It never tires, never shames, never leaks the answer, and never pretends to be human** (floors in code).
6. **It tells the family the truth, with the evidence attached** (claim gates, the evidence sheet).

What it deliberately does not do: infer emotion from voice or face, rank children, label a child's "style",
gamify with currencies or streaks, or hold the child in a session (NEVER MANIPULATE).

---

## 1. Scope, laws, and what this spec changes

**In scope:** the brain's state, its loops, the component contracts, negotiation and budgets, the code-versus-model
split, the build decision, experiments, failure modes, acceptance tests, and the exact changes to
`server/conductor`, `server/director`, `server/learner`, `server/comprehension`, `server/persona`, `server/routes/lesson.js`,
`src/child`, `src/parent`. **Out of scope** (owned by siblings, consumed here through contracts): Studio's build
pipeline and gate (LIVE-STUDIO), the voice expressive layer and engines (HUMAN-VOICE), the relational OS's prompt
block, memory policy and dependency overlay (RELATIONAL-OS), the face rig (TEACHER-VISUAL / W1-F).

**Inherited laws that shape every section** (from html-portfolio and Taxila's own measurements [T]):
1. Sentence-shaped prompt text gets recited → the brain sends models telegraphic rows and shapes, never lines.
2. Position is mechanism → the per-turn MOVE and SAFETY sections are appended last (`learner-brief-and-tail-order`).
3. Truncation is silent → every compiled prompt goes through `compile()`'s budget gate, which throws.
4. Safety by predicate, not instruction → `floorViolations`, `scanSafety`, `revealsAnswer` are code gates.
5. A model never grades → verdicts come from the verified key through `classify` labels and code.
6. One `compile()` for every lane → the brain never builds its own prompt.
7. Identity is an authenticated child id, never a device.

**What this spec changes in existing decisions** (proposed entries in §19):
- Adds the **beat** layer between `LessonPhase` and the turn (the Director's phases stay; beats subdivide them).
- Makes the Director's `step()` the **pedagogy proposer** inside a kernel rather than the whole turn decision; the
  route's inline orchestration in `lesson.js` moves into `server/brain/turn.js`.
- Extends `classify` with a signals block (TB4).
- Gives `rel_state` real (bounded, consented) content, per RELATIONAL-OS, and a turn-level proposal interface.
- Wires `decision_record` (specified in RESEARCH-PROGRAM §4.3, not yet built [T: no table in `db/migrations`]).

---

## 2. World best, read for the brain (extends `world-best/*`; nothing below is repeated from there)

| product / work | what its *brain* does that matters | Taxila takes | Taxila rejects | tag |
|---|---|---|---|---|
| **Alpha School / 2 Hour Learning / TimeBack** | mastery gating at ≥ 90% before new material; 25-min focused blocks per subject; academic years cut into "visible, actionable goals"; XP-driven motivation; adaptive tutoring with real-time skill tracking; guides (humans) run motivation; a vision model watching screens for "anti-patterns" (rushing, topic-shopping) and a "waste meter" | mastery gating as a *ledger condition* (not a %); time-boxed sittings set by the Conductor; adult-owned dose; "anti-patterns" as **task-evidence** detectors (rapid guessing, option cycling, hint abuse) | camera/eye/face tracking and offshore watchers ("you've been nuked" lockouts, "Rocket Ship / Pirate Ship" tracks, children crying when excluded, reported by former students); XP, internal currency, public tracks; "10x" claims with no controlled evidence | [V] alpha.school blog; [S] Cognitive Resonance former-student reports; [S] The Batch |
| **Synthesis Tutor** | voice-first Socratic dialogue that adapts to *how* the child reasons, not only right/wrong; hand-built manipulatives tightly coupled to the talk; micro-assessments in every lesson before advancing; 15-20 min sittings several times a week; read-aloud for under-7s | manipulatives as first-class beats (Studio + T1 engines); process signals from play (`Studio.event`) into the comprehension engine; read-aloud default for B1 | none structural; no outcome data published | [V] synthesis.com; [S] reviews |
| **Khanmigo (2026 learnings)** | ~20 A/B tests over 15M threads (Oct 2025-Apr 2026): structured recent-problem history **+3.4%** next-item correctness, prerequisite review **+2.7%**, combined **+6.1%**; full in-session log **+5.09%** engagement; a faster model **-0.3 s**, concise replies **-3 s** mean; "examples of other problem types": no effect; different help before vs after an attempt; first-time vs review | the next-item-unaided metric as the brain's proximal reward; structured history rows in the brief (already `renderChildBrief`); latency as a learning lever; before/after-attempt help modes; prerequisite descent | the passive, opt-in tutor (fixed in their own redesign) | [V] blog.khanacademy.org (May 2026) |
| **Duolingo Birdbrain + Session Generator** | per-learner × per-exercise P(correct) model feeding a generator that picks from ~200 candidate challenges per session; target ~70% success for a succeeding learner, easier when struggling; generator rewritten 750 → 14 ms; A/B: more lessons and more return days | a P(correct) admissibility band for practice items inside the difficulty bandit (steal 22) with mastery gating; session assembly in code in milliseconds | engagement as the reward without a learning check (engagement-without-mastery monitor stays) | [V] blog.duolingo.com; [S] IEEE Spectrum |
| **Duolingo Video Call (Lily)** | a fixed conversational blueprint (opener → first question → conversation → programmatic closer after N exchanges); separate "conversation prep" and "main conversation" calls because one prompt with both degraded quality; post-call fact extraction ("what important information have we learned about the user?") into a facts list in later system instructions; mid-call evaluation for confusion or unsafe content | blueprint-per-beat with a programmatic close; preparation off the critical path; post-lesson memory distillation **with cited source turns and a code grounding check** | free-text facts in the prompt (Taxila already rejected memory text as the child's words: `reports-interest-from-memory-text`) | [S] ZenML LLMOps case write-up of Duolingo's blog |
| **Speak** | "made for you" lessons built from the learner's most frequent mistakes; smart review with spaced repetition and per-concept mastery; turn-taking that tolerates learner pauses | "made for you" = Studio builds and practice sets from the child's own error history; FSRS review | none | [S] reviews; [V via T] |
| **Ello** | child-trained ASR; decodable library of 700+ books; **Storytime**: the child picks setting, characters and plot and the AI writes a story that uses the week's phonics targets ("ch" → chair, cheer); hard safety lines | co-created content constrained by curriculum targets (the interest re-skin pipeline with a code isomorphism check, steal 21); child choice inside an adaptive sequence | none | [S] press, Ello site |
| **Brilliant** | authors fix objective, progression and the "aha"; AI implements and varies puzzles; representation design beat model upgrades (gear generator 0% → 93% in 48 h); multiple rounds of human review; Koji tutor sketches on screen | archetypes with an "aha" field (Studio §3.3); library promotion with sampled human review; representation-first | none | [V] blog.brilliant.org |
| **LearnLM** | "pedagogical instruction following": behaviour is conditioned on system instructions describing the desired pedagogy; rubric of six dimensions (cognitive load, active learning, metacognition, curiosity, adaptivity, overall quality incl. uncertainty); experts preferred it over GPT-4o by 31% average preference strength, Claude 3.5 Sonnet by 11% | the six dimensions as the brain's **turn-quality rubric** in `evals/brain-sim` (advisory, binary items, cross-family judge); pedagogy as structured per-turn instructions (our MOVE section already is) | the model itself (Gemini is barred for minors and outside Azure) | [V] arXiv 2412.16429 |
| **StratL** (ACL Findings 2025) | a multi-turn strategy as a transition graph of single-turn "tutoring intents" re-chosen after every student utterance, then the LLM is prompted to follow the intent; field study n = 17 | the kernel's move graph (beats and moves) chosen outside the model, per turn | — | [V abs] arXiv 2410.03781 |
| **Next-move prediction** (arXiv 2507.06910) | LLMs predict the *next tutor move* poorly (F1 49% MathDial, 27% AlgebraNation) but predict student outcomes well | do not let a model choose the pedagogical move; do use models to perceive outcomes | — | [V abs] |

**What the field teaches, in one line each.** (1) The best systems separate deciding from wording (StratL, Bridge,
Lily's prep/conversation split). (2) Structured history beats clever prompting (Khanmigo +6.1%). (3) Speed is
pedagogy (Khanmigo, Birdbrain's 14 ms). (4) Representation design beats bigger models (Brilliant). (5) Choice helps
only inside an adaptive sequence (ZPDES, world-best §1.6). (6) Engagement machinery without a learning check, and
surveillance, harm children (Alpha's former students; Prodigy).

---

## 3. Architecture

```
                          ┌──────────────────────── LONG ARC (lesson end + nightly) ────────────────────────┐
                          │ foldLongArc: KT ledger, θ, FSRS, facets, format/guidance posteriors (population  │
                          │ + shrunk child), rel_state + memory items (cited), studio library stats, claims  │
                          └───────────────▲──────────────────────────────────────────────┬──────────────────┘
                                          │ facts                                        │ views (recorded reads)
   ┌───────────────── DAY (Conductor actor: decide(state, event) per event; planDay pure) ▼─────────────────┐
   │ app.opened / lesson.ended / limits / test window → DayPlan{slots: purpose, topic, lane, minutes,      │
   │ opener, successFirst, newSkillBudget, studioPrefetch[], relational{ritual?, callback?}}               │
   └───────────────────────────────────────────────┬────────────────────────────────────────────────────────┘
                                                   │ LessonBrief + slot (at /api/lesson/start)
   ┌─────────────────── LESSON (server/brain/lesson.js: LessonPlan = ordered beats) ▼──────────────────────┐
   │ planLesson(brief, slot, learnerView, relState) → beats[] with estimates; Studio prefetch intents       │
   └───────────────────────────────────────────────┬────────────────────────────────────────────────────────┘
                                                   │ at each beat boundary: planBeat(+lookahead 1-2)
   ┌─────────────────── BEAT (server/brain/beat.js) ▼──────────────────────────────────────────────────────┐
   │ beat type, items, representation, guidance level, StudioIntent? (kind, need, neededAt, priority)      │
   └───────────────────────────────────────────────┬────────────────────────────────────────────────────────┘
                                                   │
   ┌─────────────────── TURN (server/brain/turn.js; kernel.js) ▼───────────────────────────────────────────┐
   │ perceive: classifyFast (code) ∥ classify+signals (model) ∥ safety predicate ∥ speculative replies     │
   │ propose:  Director.step → pedagogy  · Comprehension → probe/reteach · Relational → open/repair/close   │
   │           Learner(vibe) → knobs · Studio → reveal/highlight/retire · Conductor guard → wrap/limit      │
   │ arbitrate: authority order + budgets (latency, attention, test, novelty, cost) → TurnPlan              │
   │ act: compile() → reply (model) → guards (code) → Moment → DeliveryPlan (voice) + avatar program (face) │
   │      → UiDirectives (screen) → commit tx (kt rows, facets, rel, decision_record, brain_trace, hooks)   │
   └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
        off-path (never blocks a turn): Studio plan/build/gate · memory distillation · parent texts · LLM day-plan shadow
```

### 3.1 Code versus model (the complete list)

| decision or task | code or model | where | why |
|---|---|---|---|
| day plan, re-plan, notifications, holds | **code** (LLM day plan in shadow only) | `server/conductor/planner.js`, `decide.js` | `conductor-code-reducer` [T] |
| lesson plan (beat sequence) | **code** | `server/brain/lesson.js` (new) | deterministic, replayable; M1 [M] |
| beat choice, representation, guidance level | **code**, randomised only by a registered experiment | `server/brain/beat.js` (new), `server/director/fading.js` (W2-C) | M1 [M]; RP-D7 |
| Studio intent (whether, which kind, when) | **code** policy (§6) | `server/brain/studio-policy.js` (new) | M1 [M]; LIVE-STUDIO §3.1 assigns this to the brain |
| move within a beat, item choice, hint rung | **code** | `server/director/state.js` | existing, tested |
| probe scheduling, re-teach selection | **code** (+ population bandit) | `server/comprehension/schedule.js`, `reteach.js` | existing decisions |
| answer label vs key | **model** labels, **code** verdict | `server/director/classify.js` | "a model never grades" |
| dialogue act, IDK split, personal share, interest, humour | **model**, piggybacked on classify | `classify.js` signals block | TB4, M2 [M] |
| distress | **predicate first, then model**, fail closed | `server/director/safety.js`, `classify.js distressCheck` | floor |
| her words | **model** (`taxila-fast`), **code** guards | `lesson.js textReply` → `server/brain/say.js` | existing |
| delivery (emotion arc, pauses, non-verbals) | **code** (`momentPlan`, aligner) | `server/voice/expressive/*` (HUMAN-VOICE) | 0 ms; LLM planner ≥ 0.9 s [T] |
| face program | **code** | `src/avatar/behaviour.ts` | existing controller |
| Studio plan strings, teacher cue | **model** (`taxila-fast`), Q8-gated | `server/studio/plan.js` | LIVE-STUDIO |
| Studio build | **model** race (terra ∥ sol), gate in code | `server/studio/build.js` | LIVE-STUDIO |
| memory items after a lesson | **model proposes** (`taxila-fast`, one call), **code** grounds (cited turn contains the content words; allowlist kinds; mode and consent tiers) | **`server/relational/consolidate.js` (owned by RELATIONAL-OS §3.0, §8)**; the brain only schedules it from `onLessonEnd` and adds the interest two-day rule as one of its validators | M2 over-inference (pizza → "cooking" 6/6) [M]; one owner, so there is one memory write path (LM §6.8) |
| parent texts | **model** wording over code facts, claim gate | `server/reports/*` | existing gates |
| experiment allocation | **code** (seeded draw, logged propensity) | `server/brain/experiments.js` (new) | RP-D2 |

### 3.2 Components mapped to files

| component | files (new unless marked edit) | notes |
|---|---|---|
| Contracts | `shared/brain.ts` | §4, §5, §6 types; `shared/contracts.ts` (edit): `TurnResponse` gains `studio?`, `moment?`; `UiDirectives` gains `beat`, `studioSlot` |
| Kernel | `server/brain/kernel.js` | `arbitrate(proposals, budgets, authority) → TurnPlan`; pure |
| Turn orchestrator | `server/brain/turn.js` | moved out of `server/routes/lesson.js turn()` (lines 757-1095 today): perceive ∥, propose, arbitrate, act, commit; the route becomes a thin adapter |
| Lesson planner | `server/brain/lesson.js` | `planLesson(brief, slot, view, rel) → LessonPlan`; pure |
| Beat planner | `server/brain/beat.js` | `planBeat(lessonState, view, rel, budgets) → BeatPlan` + lookahead; pure |
| Studio policy | `server/brain/studio-policy.js` | §6; emits `StudioIntent` (LIVE-STUDIO §3.1 shape) |
| Moment | `server/brain/moment.js` | `momentOf(turnPlan, verdict, affect, rel) → Moment` for voice and face |
| Experiments | `server/brain/experiments.js`, `server/brain/experiments.json` | registry, allocation, availability, propensity, frozen windows |
| Memory | none in `server/brain/` | **owned by RELATIONAL-OS** (`server/relational/consolidate.js`, `claims.js`, `callbacks.js`); the brain consumes `BondSnapshot.callbacks` and `RelationalDirective`. A second memory module here would create two write paths to `memory` (critic fix) |
| Long-arc fold | `server/brain/fold.js` | lesson-end + nightly: population format posteriors, studio library stats; calls RELATIONAL-OS `bond.js` for stage (it does not compute stage itself); called from `onLessonEnd` hook and the Conductor night fold |
| Trace | `server/brain/trace.js` | `brain_trace` statement builder; pure |
| Brain sim | `evals/brain-sim/*` | end-to-end lesson simulations over `STUDENT-SIM` personas, with the turn-quality rubric (§15) |
| Probes (this session) | `evals/teacher-brain/beat-policy.mjs`, `classify-piggyback.mjs`, `results/*` | §14 |
| Migration | `db/migrations/0NN_brain.sql` (number from the main loop) | `decision_record`, `brain_trace`, `lesson_plan`, `format_posterior` (population rows only; see §4). No memory table: RELATIONAL-OS uses the existing `memory` table and owns `0NN_relational.sql` |

---

## 4. The brain's state

State is layered by **lifetime** and by **legal mode** (`learner-legal-mode-ratchet` [T]). Nothing below NM-3
(affect, engagement, trust, latency, free text about the child) is ever persisted, in any mode.

| layer | lifetime | storage | written by | legal mode | contents |
|---|---|---|---|---|---|
| `TurnFrame` | one turn | memory | `turn.js` | all | the child's input, ASR confidence, classify label + signals, safety flags, speculative replies, proposals, the winner |
| `LessonState` | one lesson | `lesson.state` jsonb (existing) | Director + kernel | all | phase, beat cursor, items done, hint level, pending probe/why, `probeSess`, `persona`/vibe knobs, `comp` snapshot, studio slots, test/novelty budgets |
| `SessionAffect` | one session | memory (`LIVE_FOLD_CTX`) | `server/learner/affect.js` | never persisted | engagement state machine (warming/engaged/strained/disengaging/stopped), streaks, suspicion flags |
| `LessonPlan` | one lesson | `lesson_plan` row (new) | `lesson.js` planner | M1+ | the planned beats with estimates and prefetch intents; replay key |
| `LearnerView` | long | `kt_*`, comprehension tables (existing) | ledger writers | M1+ | pL, θ, FSRS, facets, misconceptions, delayed checks, re-teach arms |
| `FormatPosterior` | long | `format_posterior` (new; **population rows only, no child id**) | `fold.js` | all | Beta/normal posteriors per (format × topicType × Band4). A per-child deviation `u[child, format, topicType]` is NM-3 ("format-preference posteriors are never persisted", dpdp-deep NM-3) everywhere except the LM9 exception: M3 **and** the HTE gate **and** E-PROFILE passed, decaying to 0 with a 90-day half-life (LEARNER-MODEL §6.5b). Until then the child deviation is session-only (critic fix: the earlier draft persisted it under M3 alone) |
| `RelState` | long | `rel_state` (edit), `rel_event`, `memory`, `relational_note` (RELATIONAL-OS §5.3) | RELATIONAL-OS writers | M1 (stage, address, teacher-owned events, christened methods, milestones, rituals), M2+/M3 with P3 (likes, tier B), M3 (overlay counters) | stage `meeting`/`first_sessions`/`regular`/`long_haul` (S0-S3), address, cited memory; never trust, mood or child-affect ruptures (NM-3) |
| `DayState` | long | `conductor_state` (existing) | Conductor | all | plan, slots, limits, usage, promises, adapt memory |
| `StudioMounts` | long | `studio_mount` (LIVE-STUDIO) | Studio | M1+ | what was built for this child, outcome |
| `DecisionRecord` | study window | `decision_record` (new) | kernel, Conductor, schedulers | research consent P4 for research arms; P1 production arms logged under service | §11 |
| `BrainTrace` | 90 days | `brain_trace` (new) | `trace.js` | all, no free text | inputs digest, proposals, winner, reasons, timings |

### 4.1 Contracts (`shared/brain.ts`)

```ts
export type BeatType = "arrive" | "warmup" | "hook" | "explain" | "worked_example" | "contrast" | "practice_set"
  | "probe" | "explore_question" | "teachback" | "reflect" | "recap" | "wrap" | "break" | "safeguard";
export type Representation = "concrete" | "pictorial" | "symbolic";
export type GuidanceLevel = "worked" | "faded" | "attempt";           // wb-guidance-ladder
export type EngagementState = "warming" | "engaged" | "strained" | "disengaging" | "stopped";
// Bands: ONE table for every superhuman spec, `shared/bands.ts` (LEARNER-MODEL §3): Band4 B1-B4 by class
// (1-2, 3-4, 5-7, 8-9), Band3 A/B/C for register knobs, ContractBand "6-9" | "10-15" (age) for legacy contracts.
// No spec may key behaviour on an ad-hoc "6-9" that could be read as class or age (critic fix).
import type { Band4 } from "./bands";
import type { Stage, TeacherAffect, RelationalDirective } from "./relational";   // RELATIONAL-OS §13
export type BondStage = Stage;                                          // meeting | first_sessions | regular | long_haul (S0-S3)

export interface BeatPlan {
  beatId: string; type: BeatType; skillId?: string; itemIds: string[];
  estMs: number;                        // estimated duration from the band's pacing table (§7.2)
  representation: Representation; guidance: GuidanceLevel;
  studio?: StudioIntent;                // LIVE-STUDIO §3.1 shape; neededAtMs on the lesson clock
  probeBudget: number;                  // test weight this beat may spend
  reason: ReasonCode[];                 // why this beat (codes, never prose)
  experiment?: { pointId: string; arm: string; p: number };
}
export interface LessonPlan {
  v: 1; lessonId: string; purpose: "lesson" | "practice" | "ask" | "homework";
  beats: BeatPlan[]; cursor: number; plannedMin: number; wrapAtMs: number;
  prefetch: StudioIntent[];             // opportunistic intents issued at start for beats 2-4
  inputsHash: string;                   // replay key (same discipline as PlannerInputs)
}
export interface TurnSignals {          // from the classify call (TB4); a hypothesis, never stored as a trait
  act: "answer" | "question_curious" | "question_clarify" | "chit_chat" | "idk_not_known" | "idk_cant_recall"
     | "frustration_words" | "pride_words" | "meta_slow" | "meta_break";
  personalShare: boolean; interest: InterestTag | "none"; humour: boolean;
}
export type ProposalSource = "safety" | "consent" | "conductor" | "governor" | "director" | "comprehension"
  | "relational" | "vibe" | "studio";
export interface Proposal {
  source: ProposalSource; kind: string;            // e.g. "move", "probe", "open_callback", "reveal", "wrap"
  payload: unknown; priority: number;              // derived from source authority + urgency (§10)
  costs: { latencyMs: number; attention: 0 | 1; testWeight: number; novelty: number; usd: number };
  mandatory?: boolean;                             // safety, mandatory probes, parent limits
  reason: ReasonCode[];
}
export interface TurnPlan {
  move: Move;                                      // existing shared Move
  probe?: { shapeId: string; facet: "K" | "U" | "T" | "M"; weight: number };
  relational?: RelationalDirective;                // RELATIONAL-OS decide() output, after arbitration (moveOverlay may be vetoed)
  studio?: { reveal?: string; highlight?: string; retire?: string; setParam?: { intentId: string; name: string; value: unknown } };
  knobs: VibeKnobs;                                // persona adapter output
  ui: UiDirectives;
  accepted: Proposal[]; rejected: { p: Proposal; why: ReasonCode }[];
}
export interface Moment {                          // TB6: one object for voice and face
  move: MoveKind; verdict: "correct" | "not_yet" | "partial" | "ungraded";   // for licences only (no laugh after not_yet), never for affect
  engagement: EngagementState;                     // affect machine: task evidence + the child's words, never tone (ct-no-voice-emotion-inference)
  teacherAffect: TeacherAffect;                    // RELATIONAL-OS appraise(): display + intensity + cause; the ONLY affect producer
  bondStage: BondStage; safety: boolean; childLaughed: boolean; thinkAloud: boolean;
  studio?: "announcing" | "revealing" | "narrating";
  band: Band4; lang: "hi" | "hinglish" | "en";
  uptakePrelude?: { text: string };                // §5.4 L3: the child's own key token, verdict-neutral; null on safety turns
}
export type ReasonCode = string;                   // closed vocabulary in server/brain/reasons.js
```

---

## 5. The per-turn loop

### 5.1 Stages, in order, with budgets

| # | stage | what runs | code / model | budget p50 / p90 | measured today [T] |
|---|---|---|---|---|---|
| 0 | endpoint + STT | VAD silence, live-transcribe final | service | 1.0-1.1 s + 0.2-0.5 s | endpoint 1032-1146 ms; final +225-504 ms |
| 1 | **perceive** | `classifyFast` (bytes, chips, numbers) → if undecided, `classify` (+ signals block) ∥ `scanSafety` predicate ∥ speculative replies for likely outcomes | code + model | ≤ 600 / 900 ms (grok) or ≤ 1.1 / 1.5 s (fast) | classify median 571 ms (grok path) |
| 2 | **fold** | `nextAffect`, `foldEvidence`, facets, `personaStep`, relational turn update | code | ≤ 3 ms | plan 1-2 ms median |
| 3 | **propose** | Director `step()`, comprehension `nextProbe`/`selectReteach`, relational `propose`, Studio `propose` (reveal/highlight/retire), Conductor guard (wrap/limits), vibe knobs | code | ≤ 3 ms | — |
| 4 | **arbitrate** | `kernel.arbitrate` (§10) | code | ≤ 1 ms | — |
| 5 | **word** | `compile()` → reply (`taxila-fast`) unless a speculative reply's key matches | model | ≤ 760 / 1400 ms | reply 652-760 ms; spec hits 10-11/12 |
| 6 | **guard** | `revealsAnswer`, `floorViolations`, praise/screen/stage/ask-parity guards, drift repair | code | ≤ 5 ms (+ 1 rewrite call on fail) | rewrites 0-2 of 12 |
| 7 | **express** | `momentOf` → HUMAN-VOICE `momentPlan` + aligner → DeliveryPlan; avatar program; `UiDirectives` | code | ≤ 3 ms | — |
| 8 | **speak** | TTS first byte (DragonHD) | service | ≈ 230 ms | 228 ms p50 |
| 9 | **commit** | one tx: turn rows, kt rows, facets, rel, `decision_record`, `brain_trace`, conductor hooks | code + DB | ≤ 70 / 100 ms, after first audio | store 60-65 ms median |

**Regression floor (BR1-BR2):** child speech end → first teacher audio p50 ≤ 3.2 s, p90 ≤ 3.9 s (today 2.97-3.2 /
3.2-3.9 [T]). The brain may add at most **+150 ms p50**: TB4's piggyback (+25-148 ms by deployment, §14.3) and ≤ 10 ms
of kernel code. **This floor is not the target.** A 3 s dead gap after every answer is not a smooth lesson; the target
is §5.4, owned by this spec. The body-first wait (avatar think pose within 150 ms of speech end; `heard` receipt)
covers stages 0-5 visually (`rj-symbolic-wait-indicator`).

### 5.2 Lanes

- **Cascade (default):** the whole loop above; the Director is on the reply path, so the turn's move is current.
- **Realtime (premium, budgeted):** the S2S model words and speaks; the kernel runs on the transcript
  (`/api/lesson/turn` with the realtime transcript) and pushes the **next** move as session instructions
  (`instructionsAfter`), one turn behind (known lag, `voice-lane-cascade-default` [T]). Studio reveals and safety are
  pushed immediately via `response.create` after cancel (`realtime-create-after-cancel` [T]).
- **Text and tap:** identical kernel; tap answers skip the model classify (`classifyFast` decides).

### 5.3 A turn, worked (class 4, Hinglish, cascade)

Child: ⟨says 1/4 is bigger because 4 is bigger⟩ on item "which is bigger, 1/2 or 1/4".
1. **Perceive** (0-570 ms): `classify` → `match: m1` (bigger-denominator-bigger), signals `act: answer`; safety none;
   speculative replies for `incorrect` and `misconception` launched at speech end.
2. **Fold**: affect wrong-streak 2; facet M for the misconception rises to p 0.82 (second contradicting turn).
3. **Propose**: Director → `reteach` (kit primary arm, first re-teach of a confirmed misconception: deterministic,
   `reteach-randomise-from-second`); comprehension → mandatory verifier later (different family); Studio policy
   (beat boundary reached: practice → contrast) → intent `{kind: game, need: contrast_misconception,
   misconceptionId, priority: on_cue}`; library hit for archetype `shade-the-fraction` → mount now; relational → no
   proposal (no callback during a correction: RELATIONAL-OS repair rules); vibe → humour off (re-teach).
4. **Arbitrate**: all compatible; attention budget: the game takes the one new-thing slot; the probe waits (never two
   tests in a row).
5. **Word**: reply ⟨uptake of the child's reason → promise to show it → one concrete instruction⟩, with
   `StudioFacts` (pizza 4 slices vs 2 slices) in the facts block; the speculative `misconception` reply matched.
6. **Express**: Moment `{move: reteach, verdict: not_yet, engagement: engaged, teacherAffect: calm_curious/confusion}` → correct row, slow pace, 400-650 ms pause
   before the look-again clause, no laugh, no sigh; face verdict-neutral, lean-in at the hand-over.
7. **UI**: tray kind `studio` revealed; Question card keeps the ask; dock lamp on at hand-over.
8. **Commit**: `kt_evidence` (misconception), facets, `decision_record` (re-teach point: arm, p = 1, not
   randomised: first re-teach), `brain_trace`.

### 5.4 Turn timing: the program that makes the lesson smooth (added by the critic pass)

**Why the brain owns it.** Every sibling spec optimised its own slice: HUMAN-VOICE hides ≈ 200 ms of TTS first byte
behind a leading clip, LIVE-STUDIO hides 40-60 s of build behind a skeleton, and this spec promised "+100 ms at
most". Nobody owned the ≈ 3 s of silence between a child's last word and the teacher's first sound, which is the
single most frequent moment in the product (≈ 400 per child-month). Teachers in classrooms answer a student in under
1 s; *deliberately* extending wait time II (after the student's answer) to ≥ 3 s raises the length and quality of
student answers (Rowe 1986, J. Teacher Education 37(1): 43-50 [S: ERIC EJ333700 abstract]). The lesson from Rowe is
not "a 3 s gap is fine": it is that the pause helps only while the teacher is *visibly listening and the child can
still add more*. Today's gap is the opposite: the turn is already committed, the child cannot extend it, and the
teacher is computing. So the program is: listen longer *when the child is mid-thought*, answer faster *when the child
is done*, and make the gap legible as listening.

| layer | mechanism | owner / files | target | evidence |
|---|---|---|---|---|
| L0 receipt | `heard` receipt + avatar consider-answer pose ≤ 150 ms after the client commit; no glyph near the face | `src/lesson/floor.ts`, avatar (W1-F) | ≤ 150 ms p95 | `rj-symbolic-wait-indicator`; world-best S3 (gesture won 87.5%) [T] |
| L1 predictive end-of-turn | world-best **S1**: 400-500 ms candidate silence + on-device Smart Turn v3.2 score; threshold schedule from the beat (high for `teachback`/why-probes, low for numbers and taps); low P → keep listening and merge the next fragment | `src/lesson/turnModel.ts`, `vad.ts`, `cascadeLink.ts`; threshold from `ui.beat` | endpoint p50 ≈ 450-550 ms on complete answers (from ≈ 1.0-1.1 s); cut-offs no worse than the fixed arm | IWSDS 2026 child VAP bAcc 94 vs silence AUC 0.62 [T via world-best §0.1]; [U] for Hindi/Hinglish until S1(a) runs |
| L2 speculation at the candidate | speculative replies (`cascade-speculative-reply`, hits 10-11/12) start at the stage-1 candidate, not at the final commit; classify ∥ replies | `server/brain/turn.js` | removes ≈ classify latency from the critical path on hits | [T] |
| L3 grounded uptake prelude | world-best **S3**: if the reply's first audio will be later than 1.2 s after commit, the turn opens with the child's own key token (the number or noun they said) synthesized in the same voice with **verdict-neutral** delivery; the reply then strips a leading echo. Never on safety turns, never in the realtime lane, never a stock filler | `Moment.uptakePrelude` (built in `turn.js` from the guarded transcript) → HUMAN-VOICE aligner slot (§5.11 there) | first audible sound p50 ≤ 1.6 s | ConvFill grounded-first-part [T via world-best]; **gated**: blind verdict-leak check ≤ 55% (listeners cannot tell right/wrong from it) and the ear test, else off |
| L4 leading non-verbal | HUMAN-VOICE §5.8: a licensed breath/hum clip plays before TTS first byte on think-aloud and wonder turns | `server/voice/expressive/splice.js` | −150-200 ms perceived on those turns | HV-8 [T] |
| L5 faster perceive | classify on the faster production deployment with signals (§14.3); hedge at 1.5 s (`TAXILA_CLASSIFY_HEDGE_MS`) | `classify.js`, router | perceive p50 ≤ 0.8 s | §14.3 [M] |

**Targets (cascade, measured from the client's commit, Central India, n ≥ 30 turns per band):** visible receipt
≤ 150 ms p95; first audible teacher sound (prelude, clip or reply) **p50 ≤ 1.6 s, p90 ≤ 2.2 s**; first reply audio
**p50 ≤ 2.5 s, p90 ≤ 3.2 s**; cut-off rate (child resumes speaking within 2 s of a teacher onset) no worse than the
900 ms fixed-silence arm. These are [U] targets until BR2b measures them; the regression floor in §5.1 stays a hard
gate meanwhile. Build step **BR2b** (§18) carries L1-L3; HUMAN-VOICE B4 carries L4.

---

## 6. The beat loop and the build decision

### 6.1 When beats are planned

- **At lesson start**: `planLesson` lays out the whole sequence (§7) and issues **prefetch intents** for beats 2-4
  (opportunistic priority), so a live build has 3-6 minutes of lead instead of 90 s. Prefetches count toward the
  ≤ 3 live builds per lesson; a library hit costs nothing.
- **At each beat boundary** (a beat's exit condition fires: items done, facet resolved, time estimate reached, or a
  child event: curiosity question, strain, stop): `planBeat` re-plans the next beat and refreshes the lookahead.
- **Never mid-beat**, except for safety, a stop, strain (step down), or a curiosity question (which inserts an
  `explore_question` beat after the current item resolves, never mid-item).

### 6.2 Beat exit conditions (code)

| beat | exits when |
|---|---|
| warmup | 2-4 retrieval items resolved (band) or first two correct-unaided |
| hook | one child response, or 45 s |
| explain | the teach plan's steps done, or the child answers the embedded check |
| worked_example | each step explained by the child or faded (W2-C `fading.js`) |
| contrast | the misconception's verifier probe answered (different family) |
| practice_set | 3-6 items, or K ≥ 0.8 with ≥ 2 unaided, or a stuck rule (wheel-spin) |
| probe | answered, or two non-answers |
| explore_question | the child's question answered with one check, or 2 min |
| teachback | covered ideas ≥ threshold or 2 follow-ups |
| reflect / recap / wrap | one response |

### 6.3 What to build: the policy

`studioPolicy(beat, view, rel, affect, budgets) → StudioIntent | null`, pure. It runs only when the next or
lookahead beat is one of `hook, explain, worked_example, contrast, practice_set, explore_question, recap`.

**Step 1: is a visual needed at all?** (each a reason code)
- `need.misconception`: a misconception at p ≥ 0.7 with a kit diagnostic → `contrast_misconception`.
- `need.new_skill`: K < 0.3 on a new skill with guidance `worked` → `introduce` / worked example.
- `need.curiosity`: the child's `question_curious` on topic → `explore_question` (priority opportunistic).
- `need.practice_variety`: a practice set where the last two sets were the same format → `practice`.
- `need.transfer`: K ≥ 0.8, U high, T unknown → `practice` in a new context (transfer).
- `need.celebrate`: a milestone (Secure) → no build (the world changes on the map; PRODUCT-DESIGN-V2 §3.10).
- otherwise `null` (talk and the board are enough; most beats have no build).

**Step 2: hard admissibility** (any false → `null` or the closest admissible kind; every rejection is a reason code):
1. engagement ≠ strained and ≠ disengaging (`learner-one-engagement-machine`): a struggling child gets smaller
   steps, never a new thing to learn to operate;
2. safety mode off; consent core on;
3. kit truth exists for the kind (LIVE-STUDIO §3.2: verified integers/fractions, data sets, flow lists, diagnostics);
4. attention: nothing else new on screen this beat;
5. budget: library hit, **or** (live builds this lesson < 3 **and** child spend today < $0.60 **and** month < $8
   **and** lead time ≥ the archetype's race p90, default 90 s);
6. band and device: B1 never gets `minisite`; tier D devices get static diagrams and T1 engines only;
7. the child has not dismissed this archetype twice this week (`studio.dismissed`).

**Step 3: choose the kind** (content affordance first; this is the representation-first rule, Brilliant):

| content signal (kit + misconception class) | kind ranking |
|---|---|
| quantity (fractions, place value, money, measurement) | game (manipulate) > simulation > diagram |
| process / causation (photosynthesis, water cycle, circuits, forces) | animation > simulation > diagram |
| data (graphs, tallies, census) | chart (interactive) > game (sort/tally) |
| structure / parts (flower, cell, map, triangle types) | diagram (explorable labels) > explorable |
| sequence / timeline (history, steps of an algorithm) | explorable (scrub) > animation |
| language (grammar, vocabulary, phonics) | game (sort/match/build) > image (scene, text-free) |
| curiosity question | explorable > diagram > minisite (B3-B4 only) |

**Step 4: personalise inside the admissible kinds** (score = population prior × shrunk child deviation; §8):
- format evidence: next-item-unaided correctness after each kind for this topic type and band (population), plus the
  child's deviation shrunk by n (M3 only); a kind that failed this child twice on this skill is excluded
  (`reteach` exclusion rule, extended);
- representation: `concrete` for B1, low baseline tercile and guidance `worked`; `pictorial` in between; `symbolic`
  only for high prior (expertise reversal; `rj-blocked-warmup-before-interleave` exception for representations);
- interest: an allowlisted interest re-skins the context (steal 21) only when the child said it themselves on ≥ 2
  separate days (M2 showed a single mention over-infers: "pizza mummy ne kaata" → `cooking` 6/6 [M]);
- motion: `calm` for B1, strained-recently, or reduced-motion settings; `lively` otherwise;
- bond: at stage `meeting` (S0, the first session) **only** library-promoted archetypes, the skeleton or a T1 engine
  are admissible, never a live build (a first impression must not be a failed or unreviewed build; STUDENT-FLOW §3.3
  says the same); the parent control "Only ready-made ones" (STUDENT-FLOW §12.1) makes this permanent for the child.

**Step 5: experiment hook.** If a registered decision point covers this choice (e.g. `F-KIND-QUANTITY`: game vs
animation for quantity misconceptions), the policy returns the admissible set and `experiments.allocate` draws with
a floor ≥ 0.10 and logs the propensity (§11). Otherwise the top-ranked kind wins deterministically.

**Step 6: timing.** `neededAtMs` = the lesson clock at which the beat that uses it starts (from the beat estimates).
Priority `on_cue` if the beat cannot run well without it (contrast, worked example on a new skill); else
`opportunistic`. If lead < race p90, the router downgrades to library-only or the skeleton (LIVE-STUDIO §3.2), and
the beat runs with the fallback ladder; the child never waits.

### 6.4 Reveal, use, retire (the brain's side of LIVE-STUDIO §3.8)

- The kernel accepts a Studio `reveal` proposal only at a turn boundary where the move's words can refer to it
  (`screenHasTargets` reads Studio state). The reply gets `StudioFacts` as values in the facts block.
- During use, each `Studio.answer` is a graded turn (host-graded, `via: studio`, weight ×0.75); `Studio.event` feeds
  process facts (hesitation, undo, strategy) to the comprehension engine's process channel, never correctness.
- `stuck` (20 s no action or the same wrong twice) → a hint proposal (rung +1), or retire to the skeleton.
- Retire when the beat exits; the piece goes to the child's Notebook ("made for you") if it was revealed.

### 6.5 Measured check of the policy shape

M1 [M §14.1]: on 12 situations (misconception quantity/process, strain, correct streak, curiosity, new skill low
prior, wrap time, budget out, Young data, short lead, transfer ready, gaming suspicion) the code policy prototype in
`evals/teacher-brain/beat-policy.mjs` chose an admissible beat 11/12 (miss: a tag question "…na?" read as curiosity).
LLM proposers given the same rules as notes: `taxila-fast` 57/72 runs admissible, 0/72 hard violations, 1.41 s p50;
`grok-4-20-non-reasoning` 52/72, 1/72 hard violations, 0.42 s p50; `DeepSeek-V4-Flash` 51/72, 4/72 hard violations,
0.91-1.05 s p50 with a 15 s outlier. Reading: a model in the beat loop buys nothing and costs latency, replayability
and occasional constraint breaks; the policy stays code, and a model may only ever be an *offline* proposer evaluated
in `brain-sim` (TB1 reversal condition).

---

## 7. The lesson loop

### 7.1 Lesson templates (R0), per purpose and band

| purpose | B1 (cl 1-2) | B2 (cl 3-4) | B3 (cl 5-7) | B4 (cl 8-9) |
|---|---|---|---|---|
| lesson | arrive · warmup(2) · hook · explain/worked · practice(3) · teachback(protégé) · wrap; 10-15 min | arrive · warmup(3) · hook · explain · worked · practice(4) · probe · teachback · wrap; 15-20 min | arrive · warmup(3) · hook · explain · worked/faded · practice(5) · contrast? · probe · teachback · reflect · wrap; 20-25 min | as B3 with transfer practice and reflect; 25-30 min |
| practice | 4 items, no greeting | 5 items | 5 items + 1 transfer | 5 + 1 transfer |
| ask (B3-B4) | — | — | listen · explain (board) · one similar problem · wrap | same |
| homework | — | pick-first (CONDUCTOR §6) | same | same |

The planner fills the template from the slot (`opener`, `successFirst`, `newSkillBudget`), the learner view (due
items, active misconceptions, guidance level per skill), the relational state (an opening ritual or callback at
`arrive`, per RELATIONAL-OS), and the band's pacing table. Beats with nothing to do drop out (a skill already
secure skips `worked`).

### 7.2 Pacing and time

- Band pacing table (`server/brain/pacing.js`): seconds per beat type, per band, from the lesson-arc research
  ([I] values; replaced by measured medians after 200 lessons): e.g. B3 explain 90 s, worked 120 s, practice item
  45 s, probe 30 s, teachback 120 s.
- The voice layer adds +29-31% speaking time with pauses and clips [T HUMAN-VOICE §7]; the pacer counts delivered
  audio seconds, not characters.
- **Wrap is a natural stop**, never mid-item: at `wrapAtMs` (from the Conductor's cap, bedtime or `plannedMin`) the
  current item finishes, then `wrap`. Block renewal every 5 min (CONDUCTOR §4.6).

### 7.3 Re-planning inside the lesson

Triggers: strain (drop `contrast` and remaining new-skill beats; add `break` with choices), a curiosity question
(insert `explore_question`), a verified misconception (insert `contrast` before the next practice set), mastery
early (skip to `teachback` or transfer), time short (drop to `recap` + `wrap`). Each re-plan writes a `lesson_plan`
revision (cursor + reason codes) so replay reproduces it.

---

## 8. The learner model: how this child learns, with live experiments

**Three layers of "how this child learns"** (TB8):
1. **Population policy** (always on, every consent tier): the best known default per (topic type × band ×
   baseline tercile), learned from every child through registered experiments (§11).
2. **Shrunk child deviation** (persisted only under LEARNER-MODEL LM9: M3 **and** the HTE gate **and** E-PROFILE
   passed, 90-day half-life; otherwise computed within the session only, because NM-3 bars persisting
   format-preference posteriors): a hierarchical posterior per knob (format kind, guidance entry level,
   representation, pace), `child = pop + τ²/(τ² + σ²/n) × (child_mean − pop)`; it moves a knob only when
   P(|child − band| > δ) ≥ 0.9 (RP-D5 (ii)); otherwise the population default stands. Expect the population layer to
   do almost all the work: per-child format effects need 78-487 delayed comparisons per arm [T].
3. **Session-only adaptation** (all tiers): the vibe adapter's knobs (turn words, wait time, humour dose, register,
   energy, examples) from the child's own words and actions this session (`vibe-adapter-compiled-row`), plus the
   engagement machine. Never persisted (NM-3).

**Proximal reward for everything the brain adapts:** next same-skill item correct **unaided** (Khanmigo's metric;
steal 22), with the delayed covert check as the distal reward (re-teach reward 0.3 now + 0.3 next unaided + 0.4
delayed, `reteach-randomise-from-second`). Engagement is never a reward on its own; the engagement-without-mastery
monitor (≤ 10%) gates every engagement-moving arm.

**Explicit choices are data.** The child's picks (a ritual, "show me another way", "what helped?" at reflect) are
explicit preferences: they move a knob immediately inside the admissible set (ZPDES: choice helps inside an adaptive
sequence [T]), and they are recorded as choices, not as effects.

---

## 9. Components: role, inputs, outputs, and exactly what changes

### 9.1 Conductor (the day)

- **Keeps:** the code reducer, `planDay`, events, jobs, wakeups, guards, notification policy (CONDUCTOR.md).
- **Adds to `DayPlan` slots:** `studioPrefetch: {skillId, misconceptionId?, kind}[]` (the 2 most likely intents for
  the slot's topic, from active misconceptions and the kit; the Studio library warms them at `app.opened`, never a
  per-child night pipeline: `per-child-night-pipeline` [T]); `relational: {ritualId?, callbackRef?}` (from RELATIONAL-OS);
  `parentAsk?` (a try-at-home result to collect, §9.8).
- **Adds events:** `studio.mounted{intentId, buildSha, outcome}`, `brain.replan{reason}`, `memory.proposed{n}`,
  `experiment.exposed{pointId, arm}` (counts only; payload rules CONDUCTOR §2.3).
- **Files:** `server/conductor/planner.js` (edit: R2/R4 from W3-C + prefetch fields), `events.js` (edit),
  `validate.js` (edit: V28 prefetch ≤ 2 per slot, V29 no prefetch under safety hold).

### 9.2 Director (the lesson)

- **Becomes the pedagogy proposer** inside the kernel: `step(prev, input)` keeps its signature and tests, and its
  output becomes a `Proposal{source: director}`; the kernel can veto (safety, limits) or merge (relational
  open/close, studio reveal).
- **Gains beats:** `LessonState.beat = {id, type, startedAt, exitRule}`; phase transitions become beat transitions
  driven by `server/brain/beat.js`; `teach()`'s `teachPlan` is replaced by the beat's steps; `warmup/practice/
  teachback` logic stays as the move logic inside those beats.
- **Files:** `server/director/state.js` (edit: beat cursor, `uiFor` adds `ui.beat`; no change to verdict, hint,
  probe, safety logic), `server/director/fading.js` (W2-C), `shapes.js` (edit: shapes for `explore_question`,
  `contrast` with studio, `reflect`), `say.js` (edit: `screenHasTargets` reads Studio state, already planned W2-B).

### 9.3 Learner model

- **Keeps:** KT ledger (BKT-R, θ, FSRS), affect machine, vibe adapter, brief.
- **Adds:** `format_posterior` (population + shrunk child, §8), `server/brain/fold.js` lesson-end update, the
  signals from TB4 into `personaStep` (`meta_slow` → wait +; `humour` → humour dose uptake; `idk_cant_recall` vs
  `idk_not_known` → recall cue vs teach, steal 8), interest hypotheses (two-day rule) into the interest registry.
- **Files:** `server/learner/affect.js` (edit: signals), `server/persona/signals.js` (edit: take `TurnSignals`
  instead of regexes where present; regexes stay as the fallback), `server/learner/writer.js` (edit:
  `formatPosteriorStmt`, memory kinds), `server/learner/brief.js` (edit: one STUDIO row: what was made last time and
  how it went, telegraphic; within the 600-token cap).

### 9.4 Comprehension engine

- **Keeps:** facets, fusion, the probe scheduler and budgets, re-teach selection, weave, delayed checks.
- **Adds:** Studio as an evidence source (`via: studio`, ×0.75 until `ledger-game-full-weight` resolves) and a
  **process channel** from `Studio.event` (time to first action, undo count, strategy tag) feeding a facet
  likelihood only as a tie-breaker (never alone); the beat exit for `contrast` is its verifier.
- **Files:** `server/comprehension/facets.js` (edit: `GAME_VIA` gains studio), `fuse.js` (edit: process channel
  weight 0 until calibrated on 200 real Studio sessions), `schedule.js` (edit: beat-aware `eligible`).

### 9.5 Relational OS

- **Contract to the brain (reconciled with RELATIONAL-OS §13, which was written after the first draft of this
  section):** each turn the kernel calls `relational/policy.decide(snapshot, session, signals, ctx)` after the safety
  predicate and classify and before arbitration; the returned `RelationalDirective` is split into proposals by tier:
  - `floor` (`SAFETY`, `HOLD_ONE_TURN`) and `floorFix` → `source: safety` (top authority);
  - `moveOverlay` `RELEASE` and `CHECK_IN` (I-7) → the RELEASE tier, above every pedagogy, plan and cap except
    safety: the child's goodbye ends the lesson (NEVER MANIPULATE; the Conductor's "finish the item" wrap rule does
    not apply to a child-initiated goodbye);
  - `OWN_SLIP`, `AFFIRM_RECHECK` (teacher-owned repair; ownership only from the key or the verifier,
    `own-mistake-note-false-confession` [T]) → the repair tier, above Director pedagogy;
  - `WARM_BOUNDARY`, `POINT_OUT` → merged *into* the Director's move (shape overlay), never vetoed by pedagogy;
  - `NOTICE`, `CHRISTEN`, `SHARE_UPTAKE`, `LAUGH_WITH`, `HOME_TEACH_BACK`, `callbackId` → rapport tier, below
    probes, with the conflict rules of §10.3;
  - `affect` → `Moment.teacherAffect` (no proposal; it cannot be outbid, only suppressed by safety: TA8).
  Memory is written only by RELATIONAL-OS `consolidate.js` after the lesson (cited, code-grounded, mode- and
  consent-gated); the brain never writes memory.
- **Feeds** `Moment.bondStage` and `Moment.teacherAffect` (HUMAN-VOICE §5.1 reads both) and the RELATIONSHIP block of
  `compile()` (RELATIONAL-OS §6.1: five lines, quote-free).
- **Files:** per RELATIONAL-OS; this spec adds `server/brain/kernel.js` handling of `source: relational` and the
  tier split above (`server/brain/relational-adapter.js`, pure).

### 9.6 Live Studio

- The brain owns *when and why* (§6); Studio owns *how* (LIVE-STUDIO). The interface is `StudioIntent` out,
  `StudioStatus`/`StudioFacts` in, and `studio.reveal/highlight/setParam/retire` in the turn response.
- **Files:** `server/studio/seam.js` (LIVE-STUDIO) called from `server/brain/turn.js`.

### 9.7 Voice and Face expression

- The kernel produces one `Moment` per turn (TB6). Voice: `server/voice/expressive/moment.js momentPlan(moment)`
  takes the `Moment` itself as its only context (HUMAN-VOICE §5.1); the row it picks is keyed on `move` and
  `teacherAffect.display`, never on `verdict` alone. Face: `src/avatar/behaviour.ts` receives
  `ui.teacherAffect = moment.teacherAffect` (RELATIONAL-OS §7.3, inside ReactionGate; lean-in at hand-over; think
  look-away during THINKING; studio gesture toward the tray on reveal). The cascade TTS never receives a separate
  affect hint from RELATIONAL-OS: there is one path, Moment → momentPlan → engine compiler.
- `childLaughed` comes from TB4's `humour` signal (text) or the client's laugh detector on the child's own transcript
  tokens ("haha", "😂" typed); never from audio prosody (`ct-no-voice-emotion-inference`).
- **Files:** `server/brain/moment.js` (new), `src/avatar/behaviour.ts` (edit: `studio` gesture), `src/lesson/
  uiBridge.ts` (edit: pass `moment.studio`).

### 9.8 Parent loop

- **Daily note** (after the day's lesson, opt-in push; the in-app card always): what was practised, one "made for
  {child}" item with why (from `studio_mount` + the misconception id → plain words via the reports lexicon), one
  thing still being practised with **How do we know?**.
- **Try at home** (one 5-minute activity from the child's actual error, Parent CoPilot card, steal 25) and a one-tap
  result ("We tried it" / "Not today") that becomes a Conductor event (`parent.try_result`), never evidence about the
  child's knowledge.
- **"How Taxila teaches {child}"** (now built, PRODUCT-DESIGN-V2 §3.11 hid it until it exists): population-framed
  approach summary, the made-for-you list, the memory list with delete, experiment participation (P4 only) with
  opt-out. All rows from `brain_trace`, `decision_record`, `studio_mount`, `memory_item`; claim gates apply.
- **Files:** `server/reports/facts.js` (edit: studio facts), `server/routes/parent.js` (edit: `/api/parent/teaching`),
  `src/parent/Teaching.tsx` (new), `src/parent/Home.tsx` (edit: made-for card).

---

## 10. Negotiation: priorities and budgets

### 10.1 Authority order (strict; a higher source's veto cannot be outbid)

1. **safety and the relational floor** (distress, safeguarding F6, identity F1, romance/secrecy/contact F2/F4,
   feeling and memory claims F8/F9, floor violations) → freezes everything else; on F6 the lesson becomes the Help
   sheet.
2. **the child's goodbye** (RELEASE, with one CHECK-IN after distress, I-7) → ends the lesson; outranks the plan,
   caps and pedagogy (RELATIONAL-OS §2 precedence; NEVER MANIPULATE).
3. **consent** (legal mode, P3/P4) → removes proposals that need a missing consent (memory callbacks, child rows).
4. **parent controls** (daily limit, hours, tap-only, captions, address term, "Only ready-made activities") → constraints.
5. **policy caps** (live builds ≤ 3/lesson; probes per 10 turns; one new thing on screen; experiments ≤ 3 concurrent).
6. **cost governor** (voice lane minutes, Studio spend) → degrade, never stop.
7. **plan** (Conductor slot: purpose, topic, wrapAt).
8. **teacher-owned repair** (OWN-SLIP / AFFIRM-RECHECK from the key or verifier) → said before the next move.
9. **Director pedagogy** (the move; WARM-BOUNDARY / POINT-OUT overlays merge into it).
10. **comprehension probes** (mandatory probes are budget-exempt but take the lowest-weight shape).
11. **rapport** (callbacks, rituals, NOTICE, CHRISTEN, LAUGH-WITH).
12. **vibe** (style knobs).
13. **Studio novelty** (opportunistic builds and reveals).

(Critic fix: the first draft put all relational proposals at rank 9, below pedagogy, which would have let a practice
item outrank a child's goodbye or a teacher-owned repair, contradicting RELATIONAL-OS §2 and §13.)

### 10.2 Shared budgets

| budget | unit | per | cap | who spends |
|---|---|---|---|---|
| turn latency | ms on the critical path | turn | +100 ms over today's median | perceive piggyback, kernel code |
| attention | "new things on screen" | beat | 1 | Studio reveal, a new board, a new module |
| test | weight units | 10 child turns / session | 1.5-2.5 / 20-25% (band) | probes, items (`comprehension-probe-budget-scheduler`) |
| novelty | new formats or rituals | lesson | B1 1, B2-B4 2 | Studio kinds the child has not seen, new rituals |
| money | USD | lesson / day / month | Studio $0.60/day, $8/month; voice per tier | Studio, voice lanes |
| talk share | child words / all words | lesson | child ≥ 35% target (steal 10) | Director moves (a monitor, not a hard cap) |

### 10.3 Arbitration algorithm (`kernel.arbitrate`)

```
proposals sorted by (authority rank, mandatory desc, urgency desc)
plan = {}
for p in proposals:
  if any accepted proposal's veto covers p.kind: reject(p, "vetoed_by_" + source); continue
  if !fits(budgets, p.costs): if p.mandatory: take cheapest shape of p; else reject(p, "over_budget"); continue
  if conflicts(plan, p): reject(p, "conflict"); continue        // e.g. a reveal and a new probe in one turn
  accept(p); spend(budgets, p.costs)
return TurnPlan(plan)   // deterministic; ties broken by reason-code order, never by randomness
```

Conflict table (code): one question per turn (never a probe and an item ask together); no reveal during a
correction's first clause; no relational callback in a correction; no humour in a re-teach; no build announcement
while the child is answering.

---

## 11. Experiments within ethics (bandits and MRT)

**The rule.** Taxila learns how children learn by randomising **only between options that are each acceptable
standard practice** (equipoise), at registered decision points, with logged propensities, floors, frozen windows and
harm outcomes. Per-child adaptation uses the results with shrinkage (§8).

### 11.1 Registry (`server/brain/experiments.json`)

```json
{ "pointId": "F-KIND-QUANTITY", "decision": "studio.kind", "arms": ["game", "animation"],
  "availability": "need=contrast_misconception & class=quantity & both admissible & engagement=engaged",
  "allocation": { "type": "thompson-floor", "floor": 0.20 }, "window": "2026-11-01/2026-12-13",
  "proximal": "next_item_unaided", "distal": "delayed_covert_check", "harm": ["strain_within_2_turns", "stop_within_5_turns"],
  "consent": "P1", "maxPerChildPerLesson": 1, "status": "draft" }
```

Floors: ≥ 0.10 for every point (type-I control [T]); **≥ 0.20 for format-allocation points** (`F-KIND-*`, `F-CONC`),
because LEARNER-MODEL §6.5b fixes a ≥ 20% exploration floor for format allocation (critic fix: the draft used 0.10).

Initial points (each with a frozen 6-week window; ≤ 3 concurrent per child; components touching the same outcome
are factorial): F-ENTRY (worked vs faded entry for mid prior), F-FADE (fading pace), F-KIND-QUANTITY, F-KIND-PROCESS
(animation vs simulation), F-CONC (concreteness fading order), F-PROBE-FAMILY (why vs error-spot), F-INT (interest
re-skin vs neutral; engagement knob until it shows learning), F-WAIT (wait-time band, vibe), RT-ARM (re-teach arm,
from the second re-teach; existing).

### 11.2 Never randomised (code-enforced list in `experiments.js`)

Safety and safeguarding; helplines; the never-deny-AI rule; answer truth and grading; the hint ceiling and the
never-an-answer floor; consent and limits; the praise category and dose; the face's verdict neutrality; withholding
help; anything that removes a support the child asked for; anything in a test window; the first re-teach of a
confirmed misconception; anything for a child flagged by the dependency overlay or in safety hold.

### 11.3 Mechanics

- **Allocation:** seeded counter-based draw (`rand(seed, n)` already in `state.js`), Thompson with floor 0.10, or
  fixed randomisation for MRTs; the draw and seed reference go into `decision_record`.
- **Availability** is computed and logged even when not randomised (needed for MRT excursion effects).
- **Consent:** P1 (service) covers population bandits inside equipoise arms whose results only improve the default;
  P4 (research) adds MRTs for publication, extracts and research-only arms; assent per RP-D11 by a neutral narrator,
  never the tutor persona.
- **Harm monitoring:** strain within 2 turns, stops within 5 turns, opt-outs, parent complaints; an arm that raises
  engagement and a harm marker beyond its pre-registered threshold fails; an independent monitor can pause any point
  (an `experiment.paused` Conductor authority event, effective at lesson boundaries).
- **Analysis:** WCLS excursion effects for MRTs; adaptive-data estimators for bandits; tercile tables (equity gate
  ≥ 0.8 bottom/top gain ratio, `wb-equity-release-gate`).

---

## 12. Model routing for the brain

| task | deployment (primary → fallback) | on path? | budget | evidence |
|---|---|---|---|---|
| classify + signals | **production today: `grok-4-1-fast-non-reasoning`** (`deploy-classify-grok`, set in `scripts/deploy-azure.mjs`, hedge 1.5 s) → `taxila-fast` (effort low); `model-router-v2` names `grok-4-20-non-reasoning` as the fallback/upgrade. The deployment that carries signals is whichever passes G-SIG on the full item set first | yes | ≤ 0.8 s p50 | M2: grok-4-20-nr 598 ms, taxila-fast 1090 ms p50 with signals [M]; §14.3: grok-4-1-fast-nr 808 ms p50 with signals (+148 ms), labels 30/30, acts 29/30, no single-mention interest over-inference (0/3) [M] |
| distress | predicate → `taxila-fast` → `DeepSeek-V4-Pro`; filter block = distress | yes (parallel) | ≤ 1 s | `model-router-v2` [T] |
| reply | `taxila-fast` (effort none) → `DeepSeek-V4-Pro` | yes | TTFT ≤ 1.0 s | `model-router-v2` [T] |
| Studio plan | `taxila-fast` (none) | no | 3.25 s p50 | LIVE-STUDIO [T] |
| Studio build race | gpt-5.6-terra ∥ `taxila-brain` (sol), effort low | no | 37-54 s p50 | LIVE-STUDIO [T] |
| memory distillation (RELATIONAL-OS `consolidate.js`) | `taxila-fast` (low) → `taxila-brain` | no (lesson end, job) | ≤ 10 s | grounding check in code; M2 over-inference [M] |
| parent texts | `taxila-brain` → `taxila-fast` | no (night/job) | — | `model-router-v2` [T] |
| LLM day plan (shadow) | `taxila-fast` | no | — | CONDUCTOR §3.7 |
| offline proposer eval (brain-sim) | `gpt-6-sol` when deployed (ask O-B2) | no | — | for the TB1 reversal test only |

**Capacity isolation (critic addition; one system, one quota plan).** Today one deployment serves several lanes:
`taxila-fast` carries the live reply, the classify fallback, the distress check, Studio plans, the voice annotator and
lesson-end consolidation; `taxila-brain` (gpt-5.6-sol) is both a Studio race arm (≈ 6 k output tokens per build) and
the parent-text and Hindi Q8 model. A burst of Studio races or nightly consolidation can therefore 429 a live reply
or a safety turn, which a child hears as silence (RELATIONAL-OS P2: 66/168 rate-limited responses at 3-wide on
`taxila-realtime`). Rule: **hot-path lanes (reply, classify, distress, realtime) never share a quota pool with
background lanes (Studio build/plan, consolidation, annotator, parent texts, router bench).** Implementation:
`server/router.js` tags each call `lane: hot | background`; background calls go to separate deployments of the same
models (owner ask O-B4) and are shed first by a per-deployment token bucket; safety turns reserve headroom on the hot
pool (RELATIONAL-OS §16). Until O-B4 lands, background calls on a shared deployment are capped at 30% of its TPM by
the bucket.

**Deploy asks (owner):** O-B4 create background twins `taxila-fast-bg` (gpt-5.6-luna) and a second sol deployment
for Studio (or confirm terra + a new `taxila-studio-sol` carry all Studio traffic, leaving `taxila-brain` for adult
writing and Q8). O-B1 raise the production classifier's TPM (`grok-4-1-fast-non-reasoning` today; `grok-4-20-non-reasoning` if it wins G-SIG) for classify at pilot scale (it becomes the per-turn
perceiver); O-B2 deploy `gpt-6-sol` and `gpt-6-luna` (router upgrade path) to re-run M1 as an offline proposer and the
reply bake-off; O-B3 confirm Central India capacity for the classify deployment (all measurements here are US →
eastus2).

---

## 13. Latency and cost budgets

**Per turn (critical path):** §5.1. The brain's own additions: kernel ≤ 10 ms p99 (unit benchmark gate), signals
≤ +100 ms p50 (M2 measured +25/+91 ms), trace and decision rows inside the existing commit tx (≤ +5 ms).

**Per beat (off path):** `planBeat` ≤ 5 ms; Studio intent → skeleton ≤ 300 ms; library hit → revealable ≤ 1 s +
background G-mount; live race 37-54 s p50 (needs ≥ 90 s lead; prefetch at lesson start gives 3-6 min).

**Per lesson (off path):** `planLesson` ≤ 20 ms; memory distillation one call (~2 k in / ~200 out tokens on
`taxila-fast`: ≈ $0.0006) [U: measure]; fold ≤ 50 ms.

**Per child-month (brain-attributable, USD, Azure list prices):** signals +30 output tokens × ~400 turns ≈ $0.01
(fast) / $0.006 (grok); memory ≈ $0.012 (20 lessons); Studio live ≈ $0.60 at ≥ 90% library hit rate [T, U];
parent texts per the reports budget. The brain adds ≈ $0.63/child-month, almost all of it Studio, which is capped.

---

## 14. Measurements (this session, 2026-10-04, US sandbox → eastus2)

### 14.1 M1: who should make the beat decision (`evals/teacher-brain/beat-policy.mjs`)

- **Method:** 12 BrainState snapshots, each with admissible {move, kind} pairs **written before any run by the spec
  author (single rater)**; code policy prototype vs three LLM proposers given the same rules as notes (no example
  decisions), strict JSON schema; 3 reps per scenario per model; two full runs (run 2 saved as
  `results/beat-policy-2026-10-04-run2.json`; run 1 figures from the console log). Hard violations computed in code:
  a non-`none` kind that is neither a library hit nor buildable (live budget > 0 and lead ≥ 90 s), or any build
  during strain.
- **Results:**

| policy | admissible | hard violations | reproducible scenarios (3/3 same) | p50 / p90 |
|---|---|---|---|---|
| code prototype | 11/12 (both runs, deterministic) | 0 | 12/12 | ~0 ms |
| `taxila-fast` (effort low) | 30/36 + 27/36 = **57/72** | 0/36 (run 2) | 10/12, 12/12 | 1412 / 1932-2243 ms |
| `grok-4-20-non-reasoning` | 27/36 + 25/36 = **52/72** | 0 (run 1 by inspection) + 1/36 | 10/12, 10/12 | 417-429 / 491-518 ms |
| `DeepSeek-V4-Flash` | 27/36 + 24/36 = **51/72** | 2 + 2 = **4/72** | 5/12, 4/12 | 914-1045 / 1332-2957 ms |

- **Commonest LLM departures:** attaching a chart to a 2-minute recap (all three models, every rep: defensible but
  costs the attention budget at wrap), a game for a suspected gamer (grok 3/3), contrasting a misconception at p 0.55
  before verifying it, and a build with zero live budget or during strain (DeepSeek-V4-Flash).
- **Limits:** single rater; the code policy was written alongside the labels (its 11/12 is an upper bound); 12
  scenarios; synthetic states. The latency, reproducibility and hard-violation rows do not depend on the labels.
- **Decision it drives:** TB1/TB3 (code decides beats and builds; no model on the beat path).

### 14.2 M2: can perception signals ride on classify (`evals/teacher-brain/classify-piggyback.mjs`)

- **Method:** the production-shaped item classify prompt (class 4, 1/2 vs 1/4, one misconception), 10 Hinglish
  child replies × 3 reps × 2 arms (plain schema vs + `act`, `personal_share`, `interest`, `humour`) × 2 models;
  expectations written before the run (single rater). `results/classify-piggyback-2026-10-04.json`.
- **Results:**

| model | arm | match label | act | p50 / p90 |
|---|---|---|---|---|
| `taxila-fast` (low) | plain | 30/30 | — | 1065 / 1450 ms |
| `taxila-fast` (low) | signals | 30/30 | 29/30 | 1090 / 1274 ms |
| `grok-4-20-non-reasoning` | plain | 30/30 | — | 507 / 687 ms |
| `grok-4-20-non-reasoning` | signals | 30/30 | 30/30 | 598 / 693 ms |

- The IDK split (can't recall vs never learned) was right 12/12 on both models; meta-slow and frustration words
  12/12. **Over-inference:** "maine pizza mein dekha tha, mummy ne kaata tha" → `interest: cooking` 6/6 (both
  models): a single mention is a hypothesis, which is why interests need the two-day rule (§6.3 step 4).
  Humour was in the schema but not scored.
- **Limits:** one item, 10 replies, single rater, synthetic text (no ASR noise). Run `evals/classify-accuracy.mjs`
  with the signals block before the switch (§15 gate G-SIG).
- **Decision it drives:** TB4.

### 14.3 M2b (critic pass): the same probe on the production classifier (`evals/teacher-brain/classify-piggyback-prod.mjs`)

- **Why:** M2 measured `grok-4-20-non-reasoning`, but production classifies with `grok-4-1-fast-non-reasoning`
  (`deploy-classify-grok`, 2026-10-03). TB4 decides what rides on the production call, so it had to be measured there.
- **Method:** identical prompt, schema, replies and expectations (copy of the M2 script; only the output path
  differs); 10 replies × 3 reps × 2 arms; 2026-10-04, US sandbox → eastus2.
  `results/classify-piggyback-prodclassifier-2026-10-04.json`.
- **Results:** plain 30/30 labels, p50 660 / p90 980 ms; signals 30/30 labels, acts **29/30** (one "thoda dheere
  boliye" read as `meta_break` instead of `meta_slow`, 1/3), p50 **808** / p90 927 ms (+148 ms p50, p90 lower). IDK
  split 6/6, chit-chat and frustration 6/6. **Interest over-inference: 0/3** on the pizza reply (it marked a personal
  share but `interest: none`), unlike both M2 models (6/6). The two-day rule stays: one model's restraint on one
  reply is not evidence.
- **Reading:** signals fit on the production classifier inside the +150 ms allowance (§5.1). G-SIG on the full item
  set decides between this deployment and grok-4-20-nr (598 ms in M2).
- **Limits:** as M2 (one item, synthetic text, single rater).

Spend for all three probes: under $0.15.

---

## 15. Quality gates and acceptance tests

### 15.1 Code gates (CI, `npm test`)

| gate | test |
|---|---|
| G-KERNEL-PURE | `arbitrate` is pure: equal inputs → byte-equal TurnPlan; a planted `Date.now()` / `Math.random()` is caught (negative control) |
| G-KERNEL-ORDER | for every pair of sources, a lower-authority proposal never overrides a higher one's veto (property test over generated proposals) |
| G-BUDGET | 10k random turns: attention ≤ 1 per beat, never two asks in a turn, live builds ≤ 3 per lesson, probes within caps |
| G-NEVER-RAND | every registry entry is checked against the never-randomise list; a planted safety arm fails the build |
| G-PROPENSITY | every randomised decision writes `decision_record` with p; replay reproduces 100% of chosen actions (LAM1) |
| G-SIG | classify-accuracy eval with the signals block: label agreement with the plain arm ≥ 99% on the full item set; act accuracy ≥ 0.9 on a 120-reply labelled set (two raters, κ reported) |
| G-MOMENT | for each move family, the voice `momentPlan` and the face program derived from the same Moment agree on register (no laugh in a correction; no "delighted" face or voice arc on a bare verdict); property test: flipping `verdict` correct ↔ not_yet with the same `teacherAffect` changes neither the face program nor the voice emotion arc (only non-verbal licences) |
| G-MEMORY | (RELATIONAL-OS AT-B3 and `consolidate.js` validators) every memory item cites a turn whose child text contains its content words; 0 items from teacher turns; 0 under consent "No"; a single-mention interest never becomes an item |
| G-AUTHORITY | the relational adapter: a child goodbye in the same turn as any pedagogy, plan or Studio proposal → RELEASE wins in 100% of 10k generated turns; a teacher-owned repair precedes the next item |
| G-QUOTA | load test: 20 concurrent Studio races + consolidation burst on a shared deployment → 0 hot-path 429s (bucket sheds background first) |
| G-FLOOR | persona-invariants, never-rules, parse, prompt budget (unchanged, must stay green) |
| G-LAT | kernel p99 ≤ 10 ms over 10k simulated turns on the ACA image |

### 15.2 Simulation gates (`evals/brain-sim`, STUDENT-SIM personas)

- **Pedagogy:** on 40 personas × 3 lessons: misconception holders get a contrast beat within 2 turns of
  verification in ≥ 90%; strained personas get 0 new builds; correct-answer-trap personas get a why-probe before any
  "learned" state; low-baseline personas get worked entry ≥ 90%.
- **Builds:** prefetch hit rate (the intent used was prefetched or a library hit) ≥ 70% [U target]; 0 reveals
  without a grounded reference; 0 waits shown to the child.
- **Turn quality (advisory):** the LearnLM-derived six-dimension rubric as binary items, cross-family judge pair
  (`rj-holistic-model-judge-gate`: never a 1-10 score, never a gate until calibrated against two humans on 100 turns).
- **Equity:** bottom/top tercile proximal-reward ratio ≥ 0.8 in the sim before production.

### 15.3 Production acceptance (`tests/prod/brain.mjs`, from the Azure probe fleet)

1. A scripted misconception child (fractions, Hinglish voice) gets a Studio piece for that misconception revealed on
   cue within the first contrast beat; the reply refers to what is on screen; the answer in the piece is graded and
   appears as a `via=studio` evidence row.
2. A scripted strained child (three "pata nahi") gets a step-down and a break with choices; no build is requested
   (trace shows `studio.rejected: strained`).
3. A curiosity question mid-explain inserts an `explore_question` beat after the item resolves, never mid-item.
4. Speech end → first audio p50 ≤ 3.2 s, p90 ≤ 3.9 s over 30 turns (regression floor, from BR1); after BR2b:
   first audible teacher sound p50 ≤ 1.6 s / p90 ≤ 2.2 s and first reply audio p50 ≤ 2.5 s / p90 ≤ 3.2 s from
   Central India, cut-off rate no worse than the fixed-silence arm (§5.4).
5. The parent "How Taxila teaches" page lists the made-for item with its reason and the memory items with delete.
6. Kill the classify deployment: turns continue on `taxila-fast`; kill Studio: the beat runs on the skeleton or
   the T1 engine; no error card reaches the child.

---

## 16. Failure modes

| failure | detection | response |
|---|---|---|
| classify times out | hedge timer (`classifyHedgeMs`) | fallback deployment; then `no_evidence` + a narrower re-ask; never a guess at the verdict |
| signals block malformed | schema | drop signals for the turn (regex fallbacks in `persona/signals.js`); labels unaffected |
| a component throws in propose | try/catch per component | that component's proposal is absent; trace `component_error`; the Director's move still runs |
| kernel invariant violated (e.g. two asks) | G-BUDGET runtime assert | drop the lower-priority proposal; alert |
| Studio late / failed | `StudioStatus` | fallback ladder (LIVE-STUDIO §3.12); beat continues; never mentioned |
| a reveal the words do not reference | `screenProblem` guard | reply regenerated with the facts block (existing guard path) |
| memory grounding fails | G-MEMORY check | item dropped; counted |
| experiment allocation unavailable (DB down) | allocation error | deterministic default arm, `availability: false` logged later from the trace |
| over-adaptation (knob flapping) | hysteresis (one step per 2 consistent signals per 10 turns; ≤ 1 non-explicit step per 10 min) | `vibe-adapter-compiled-row` rule applies to every knob |
| safety mid-build | safety proposal | all Studio pieces retired (frozen frame, no reveal); Help sheet |
| realtime lane one-turn lag misfires a reveal | reveal only via `response.create` after cancel with facts | reveal deferred to the next boundary |
| child dismisses a build ("I don't want this") | chip / words | retire, `studio.dismissed`; that archetype is excluded for this child for a week |

---

## 17. Mapping to existing code: exactly what changes

| file | change | owner wave |
|---|---|---|
| `server/routes/lesson.js` | `turn()` (757-1095) and `planTurn` (1135-1248) move into `server/brain/turn.js`; `start()` calls `planLesson`; the route keeps HTTP, auth, replay, late-turn and outbox semantics | hot file: through the seam commit |
| `server/director/state.js` | beat cursor in `LessonState`; `teach()` driven by `BeatPlan` steps; `uiFor` adds `ui.beat`; no change to verdict/hint/probe/safety | hot file owner of the wave |
| `server/director/classify.js` | signals block appended to every model classify schema (TB4); `parseClassification` returns `signals` | |
| `server/director/shapes.js` | shapes: `exploreQuestion`, `contrastWithStudio`, `reflect`, `studioAnnounce`, `studioReveal` (shapes only) | |
| `server/director/say.js` | `screenHasTargets` reads Studio state | W2-B (planned) |
| `server/learner/affect.js`, `server/persona/signals.js` | consume `TurnSignals` | |
| `server/learner/writer.js` | `formatPosteriorStmt`, `decisionRecordStmt`, `brainTraceStmt`, memory kinds | |
| `server/learner/brief.js` | STUDIO row | |
| `server/comprehension/facets.js`, `fuse.js`, `schedule.js` | studio source; process channel (weight 0 until calibrated); beat-aware eligibility | |
| `server/conductor/planner.js`, `events.js`, `validate.js`, `hooks.js` | prefetch + relational slot fields; new events; V28-V29; `onLessonEnd` calls `fold.js` | |
| `server/reports/facts.js`, `server/routes/parent.js` | studio facts; `/api/parent/teaching` | |
| `shared/contracts.ts`, `shared/brain.ts` (new), `shared/studio.ts` (LIVE-STUDIO) | §4.1 | |
| `src/lesson/runtime.ts`, `uiBridge.ts`, `src/child/lesson/{Desk,WorkTray}.tsx` | `ui.beat`, studio tray kind, moment → avatar | STUDENT-FLOW §16 |
| `src/parent/Teaching.tsx` (new), `Home.tsx` | STUDENT-FLOW §12 | |
| `db/migrations/0NN_brain.sql` | `decision_record`, `brain_trace`, `lesson_plan`, `format_posterior` | main loop allots |

---

## 18. Build order (the full version, sequenced)

The full version is everything above. It is built in this order so each step is testable on its own and nothing
child-visible regresses. Estimates are agent-days including tests.

| step | what | depends on | est. | exit test |
|---|---|---|---|---|
| **BR0** | contracts (`shared/brain.ts`), migration, `trace.js`, `reasons.js`, `decision_record` writer; kernel skeleton that wraps today's `step()` with no behaviour change | W1 seams | 2.5 | replay of 30 recorded lessons byte-identical; G-KERNEL-PURE |
| **BR1** | `server/brain/turn.js` extracted from `lesson.js` (behaviour-identical), kernel arbitration live with today's proposers (safety, director, comprehension, vibe, conductor guard) | BR0 | 3.0 | cascade-latency no regression; all lesson tests green |
| **BR2** | signals piggyback (TB4) + consumers (affect, persona, IDK split) + `Moment` → HUMAN-VOICE + avatar | BR1, HUMAN-VOICE S1 | 2.5 | G-SIG, G-MOMENT |
| **BR2b** | turn timing (§5.4): Smart Turn scorer + threshold schedule from the beat (world-best S1), speculation at the stage-1 candidate, uptake prelude (S3) behind its verdict-leak and ear gates, hot/background lane tags + token buckets | BR2, world-best S1(a) offline AUC run | 3.0 | prod acceptance 4 (targets); G-QUOTA |
| **BR3** | beats: `lesson.js` planner, `beat.js`, pacing table, re-plan triggers, `ui.beat`; Director driven by beats | BR1, W2-C fading | 4.0 | brain-sim pedagogy gates; Desk shows beats |
| **BR4** | Studio policy + prefetch + reveal/use/retire integration; evidence `via=studio`; Notebook "made for you" | BR3, LIVE-STUDIO S1-S4 | 4.0 | prod acceptance 1-3, 6 |
| **BR5** | relational adapter (directive → tiered proposals, §9.5), `Moment.teacherAffect`/`bondStage` from RELATIONAL-OS, consolidation scheduled at lesson end (the module itself is RELATIONAL-OS R6) | BR1, RELATIONAL-OS R1/R4 | 2.0 | G-AUTHORITY; G-MEMORY; RELATIONAL-OS AT-B1 on the cascade lane |
| **BR6** | experiments registry, allocation, availability, harm monitors, pause events; first two points in shadow (logged, not randomised) | BR0, BR4 | 3.5 | G-NEVER-RAND, G-PROPENSITY |
| **BR7** | long-arc fold: format posteriors (population; child under M3), knob shrinkage, Conductor prefetch and relational slot fields | BR4, BR6 | 3.0 | sim: knobs move only past the distinctiveness rule |
| **BR8** | parent loop: daily made-for card, try-at-home result, "How Taxila teaches" page | BR4, BR5, BR6 | 3.0 | prod acceptance 5; claim gates |
| **BR9** | brain-sim at scale + offline proposer harness (the TB1 reversal test) + dashboards | BR3-BR8 | 3.0 | gates §15.2 all green |
| **BR10** | turn experiments on (P1 equipoise points) after a 2-week shadow; MRT points under P4 at pilot | BR6-BR9, pilot consent | 1.5 | first frozen window opened with monitors |

**Total ≈ 35 agent-days** (critic: +3.0 BR2b, −1.0 BR5 now that memory is RELATIONAL-OS's). Placement in BUILD-PLAN: BR0-BR2b in W2 (with W2-C/W2-D), BR3-BR5 in W3 (with W3-C/W3-D
and Studio), BR6-BR10 in W4 (with W4-B/W4-C). The STUDENT-FLOW build order (§17 there) runs alongside.

---

## 19. Reversal conditions and proposed context entries

Proposed entries (for `context/inbox/teacher-brain.json`, merged by the main loop):

- **decision `teacher-brain-code-kernel`** (TB1/TB3/TB9): a code kernel arbitrates typed proposals per turn and plans
  beats and builds; models perceive, word, build and write for adults; nothing new on the turn path.
  **Reverse if** an offline LLM proposer beats the code policy on `brain-sim` by ≥ 10 pp admissible with 0 hard
  violations over 1,000 scenarios *and* a pre-registered micro-RCT shows better next-item-unaided outcomes; then it
  may propose inside the admissibility predicate, off the critical path.
- **decision `teacher-brain-beat-layer`** (TB2): beats between phases and turns, planned with 1-2 lookahead and
  lesson-start prefetch. **Reverse if** the prefetch hit rate stays < 40% after 500 lessons (then plan builds only at
  boundaries and rely on the library).
- **decision `teacher-brain-signals-on-classify`** (TB4). **Reverse if** G-SIG label agreement < 99% on the full item
  set, or the p50 cost exceeds +150 ms in production.
- **decision `teacher-brain-moment`** (TB6). **Reverse if** the ear and eye panels find voice and face read better
  driven separately (they never have in the literature reviewed).
- **decision `teacher-brain-experiments-registry`** (TB7). **Reverse:** never on the never-randomise list; arms and
  windows change per pre-registration.
- **decision `teacher-brain-interest-two-day`**: an interest moves content only after the child names it on ≥ 2
  separate days. **Reverse if** the interest-corpus audit shows single-mention tags are right ≥ 95% on real children.
- **decision `teacher-brain-no-surveillance`** (TB11): no camera, gaze, face-affect or keystroke engagement sensing.
  **Reverse:** never while the Microsoft Code of Conduct restriction stands and for children regardless.
- **measurement `teacher-brain-beat-policy-2026-10-04`** and **`teacher-brain-classify-piggyback-2026-10-04`** (§14).
- **rejection `llm-beat-proposer-live`**: an LLM choosing the beat/build on the live path (M1: 0.4-1.4 s, 4-12/12
  reproducible, up to 4/72 hard-constraint breaks, no admissibility gain).
- **rejection `alpha-style-surveillance-and-tracks`**: vision "anti-pattern" monitoring, waste meters, public
  performance tracks and XP economies (former-student reports [S]; Code of Conduct [T]).

---

## 20. Sources (accessed 2026-10-04)

- Alpha School, "Introducing TimeBack" — https://alpha.school/blog/introducing-timeback-the-next-evolution-of-alphas-model/ [V]
- Alpha School, "The two-hour school day" — https://alpha.school/blog/the-two-hour-school-day-how-ai-tutors-are-redefining-learning-efficiency/ [V]
- Cognitive Resonance, "Fourth report: former Alpha School students speak out" — https://buildcognitiveresonance.substack.com/p/fourth-report-former-alpha-school [S]
- The Batch, "Inside Alpha School" — https://www.deeplearning.ai/the-batch/inside-alpha-school-a-texas-based-program-using-algorithms-and-video-monitors-to-teach-children [S]
- Khan Academy, "How Khan Academy is building a better AI tutor: our most recent learnings" (May 2026) — https://blog.khanacademy.org/how-khan-academy-is-building-a-better-ai-tutor-our-most-recent-learnings/ [V]
- Duolingo, "Learning how to help you learn: introducing Birdbrain" — https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain [V]
- IEEE Spectrum, "How Duolingo's AI learns what you need to learn" — https://spectrum.ieee.org/duolingo [S]
- ZenML LLMOps database, "Duolingo: structured LLM conversations for language-learning video calls" — https://www.zenml.io/llmops-database/structured-llm-conversations-for-language-learning-video-calls [S]
- Synthesis Tutor — https://www.synthesis.com/tutor [V]; reviews https://www.unite.ai/synthesis-tutor-review/ [S]
- Speak — https://www.speak.com/ [V]; review https://languatalk.com/blog/speak-app-review/ [S]
- Ello Storytime — https://finance.yahoo.com/news/ello-launches-storytime-version-ai-150500669.html [S]
- Brilliant, "Hand-crafted, machine-made" — https://blog.brilliant.org/hand-crafted-machine-made/ [V]
- LearnLM: Improving Gemini for Learning — https://arxiv.org/abs/2412.16429 [V]
- Puech et al., "Towards the pedagogical steering of LLMs for tutoring" (StratL), ACL Findings 2025 — https://arxiv.org/abs/2410.03781 [V abs]
- "Exploring LLMs for predicting tutor strategy and student outcomes in dialogues" — https://arxiv.org/abs/2507.06910 [V abs]
- Rowe, M. B. (1986). Wait times: slowing down may be a way of speeding up. *J. Teacher Education* 37(1), 43-50 — https://eric.ed.gov/?id=EJ333700 [S: abstract]
- Taxila internal: `context/decisions.md`, `rejected.md`, `measurements.md`; CONDUCTOR.md; adaptation-policy.md;
  RESEARCH-PROGRAM.md; COMPREHENSION-ENGINE.md; LIVE-STUDIO.md; HUMAN-VOICE.md; PRODUCT-DESIGN-V2.md; BUILD-PLAN.md;
  world-best/* [T]

---

## 21. One system: seams and open items (critic pass, 2026-10-04)

### 21.1 Who owns each shared thing (one owner each; every other spec consumes it)

| shared thing | single owner | consumers | the conflict it closes |
|---|---|---|---|
| bands | `shared/bands.ts` (LEARNER-MODEL §3): Band4 by class, Band3, ContractBand | all five specs | "6-9" meant classes in HUMAN-VOICE and ages in RELATIONAL-OS and LIVE-STUDIO |
| per-turn decision and authority order | this spec §10.1 (kernel) | all | relational moves ranked below pedagogy here vs above it in RELATIONAL-OS §2 |
| teacher affect | RELATIONAL-OS `appraise()` → `Moment.teacherAffect` | HUMAN-VOICE `momentPlan`, avatar | three affect producers (Moment `affectBand`, RO TTS hints, HV's own `affect` input) and a voice "praise on correct" row that contradicted TA7 and the verdict-neutral face |
| memory (write path, kinds, claims) | RELATIONAL-OS (`consolidate.js`, `claims.js`, `callbacks.js`) | this spec (schedules), STUDENT-FLOW (screens) | `server/brain/memory.js` vs `server/relational/consolidate.js`; jar text stored outside the write path |
| relationship stages | RELATIONAL-OS §5.2 | STUDENT-FLOW §11.1, HUMAN-VOICE warmth cap, Studio S0 rule | STUDENT-FLOW's lapse regression and "warm closes" gate (usage- and affect-keyed) |
| what Studio may build, when | this spec §6.3 | LIVE-STUDIO router (admissibility only) | S0 "prefers" vs "only" library builds |
| the turn's timing | this spec §5.4 | HUMAN-VOICE (L4 clip, prelude synthesis), client floor | nobody owned the ≈ 3 s gap |
| quota pools | this spec §12 (hot vs background lanes) | LIVE-STUDIO, RELATIONAL-OS, HUMAN-VOICE annotator | Studio races and consolidation could 429 a live reply or a safety turn |
| child memory page | STUDENT-FLOW §11.4 (Teacher screen) | RELATIONAL-OS §10.3 | two locations; Young children not told what she keeps |

### 21.2 The lesson budget, end to end (one child, one 20-minute B2 lesson, cascade)

| resource | spend | source |
|---|---|---|
| turns | ≈ 20, each ≤ +150 ms over the regression floor, targets §5.4 | §5 |
| hot-path model calls | ≈ 20 classify (+signals) + ≈ 20 replies + distress checks; no other model call on the turn | TB9, RELATIONAL-OS ROS-12, HUMAN-VOICE decision 1 |
| background model calls | ≤ 3 Studio plans, ≤ 3 live races (usually 0 at ≥ 90% library hits), 1 consolidation | LIVE-STUDIO §7, RELATIONAL-OS §15 |
| new things on screen | ≤ 1 per beat | §10.2 |
| speaking time | +29-31% from the expressive layer, counted by the pacer in audio seconds | HUMAN-VOICE §7, §7.2 here |
| money (brain-attributable) | ≈ $0.03 per lesson at library-hit steady state; ≤ $0.60 per child-day hard cap | §13, LIVE-STUDIO §7 |

### 21.3 Still open after this pass (not fixable by editing a spec)

1. **Turn-timing targets are [U].** §5.4's numbers need world-best S1(a) (offline Smart Turn AUC on our children's
   Hindi/Hinglish audio) and a Central India run; the regression floor stays the hard gate until then.
2. **Every latency number is US sandbox → eastus2.** Central India (owner O-B3, HUMAN-VOICE O-2) is unmeasured.
3. **No live-build archetype meets the ship bar** (n ≥ 30, P(pass by lead) ≥ 0.95); the label-anchoring check makes
   the true strict pass rate for animations lower than §14 of LIVE-STUDIO shows. Library-first is a requirement, not
   an optimisation, until S4 lands.
4. **The relational batteries ran only on the realtime lane**, text-in, single coder. AT-B1 now requires the cascade
   lane and audio-in; until it runs, the cascade lane's dependency safety rests on the shared floor predicates.
5. **Safety-turn capacity.** A rate-limited heavy turn is silence (RELATIONAL-OS P2). Reserved headroom and the
   fixed-wording safety opening are specified; the background twin deployments (O-B4) are an owner action.
6. **The blind ear test (HUMAN-VOICE O-7) and the Omni-sourced clip licence (HUMAN-VOICE O-1)** decide whether the
   clip bank ships; the AI judge cannot.
7. **Beat policy labels have a single author** (M1), as do M2/M2b expectations; two-rater labels (κ) are a G-SIG and
   brain-sim prerequisite.
8. **LEARNER-MODEL is internally inconsistent** on per-child format posteriors (LM9 allows them in M3 after gates;
   its own NM-3 list and dpdp-deep NM-3 say never). This spec persists nothing per child until all three LM9 gates pass
   *and* counsel confirms the exception survives NM-3; until then the child deviation is session-only (§4, §8) (proposed context entry in `context/inbox/superhuman-critic.json`).
