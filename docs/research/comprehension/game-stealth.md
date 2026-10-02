# Stealth assessment inside games: what the evidence supports, and a telemetry→evidence mapping for Forge games and v1 engines

Date: 2026-10-02. Status: research sweep + design, input for the main loop (`comprehension-engine-program`).
Feeds: `server/comprehension/**`, `server/learner/kt/*` (LEARNER-MODEL §6.1), Forge kit telemetry (FACTORY §4.9-4.10),
observer@1 (sandbox-telemetry §5), bridge v2.1 (CONTENT-ENGINE §4), STUDENT-SIM, RESEARCH-PROGRAM.
Complements, does not repeat: learning-science.md §1.4 (ECD/stealth in one paragraph), §7 probe catalogue P1-P24;
comprehension/papers-2025-2026.md (dialogue KT); comprehension/products-live.md (shipping tutors).

## Evidence tags

| tag | meaning |
|---|---|
| **[V]** | Read this session in the primary source (full text PDF extracted with `pdftotext`, or the publisher/arXiv abstract page). Numbers quoted are from that text. |
| **[S]** | Search-engine summary, secondary page, or a fetch-model summary of a page whose text was not read directly. Re-check before a `context/` entry. |
| **[U]** | Our inference or extrapolation (to Indian children 6-12, voice, Hindi/English, our engines). Hypothesis. |
| **[C]** | Computed this session by `game-stealth-sim.mjs` (output `game-stealth-sim-2026-10-02.json`). Exact for the model, says nothing about children. |

**The caveat that governs everything below.** Every validated stealth assessment found in this sweep is on US/European
students, mostly grades 5-11, in English, with keyboard/mouse or iPad, and the best convergent validity any of them
reports against an external test is **r ≈ 0.3-0.5**. Nothing here is on Indian children aged 6-9, on a ₹10k Android,
with a voice teacher in the loop. Treat every number as an upper bound until our own pilot replicates it [U].

---

## 0. The answer on one screen

1. **Stealth assessment works, but modestly, and only when the level is designed for it.** Physics Playground (PP):
   n = 263 grades 9-11, the Bayes-net estimate of physics understanding correlated r = 0.36 with the pretest and
   r = 0.40 with the posttest; the authors say the literature's convergent correlations are typically **0.1-0.6** [V].
   Plants vs. Zombies 2: n = 47 grade 7, r = 0.40 (Raven) and 0.41 (MicroDYN) [V]. These are the ceiling to plan for.
   A game is a *moderate* evidence source, not a verdict machine.
2. **Game success is not understanding.** DragonBox players (grades 7-8, 3.5 h) did not improve on paper equations
   [S]. A fraction number-line game (Nuraydin, Stricker & Schneider 2022, n = 188 grades 5-8, RCT) improved the
   *trained* 0-1 estimation task but **not** 0-5 lines, fraction comparison or fraction arithmetic [S]. Our v1 flagship
   archetype is a number-line game. → In-game evidence can never set `mastered` on its own; a transfer check outside
   the trained representation is mandatory (§5 rule E4).
3. **The evidence is in HOW the child plays, but only the first committed act is clean evidence.** What separates
   understanders in the validated systems: systematic testing vs trial-and-error, *acting inconsistent with evidence*
   already seen, efficient (under-par) solutions, tool choice, and named error patterns (Zoombinis, n ≈ 800-980
   grades 3-8: detectors AUC mostly 0.77-0.93, convergent with an external CT test [V]). Everything after feedback is
   learning, not assessment (Mislevy's "learning while assessed" problem [S]).
4. **Design the level so the commit IS the probe.** Predict-before-reveal (numberline-jump, predict-run), plan-before-run
   (grid-path), pick-the-tool-before-use (build-to-spec, shop-stall). Prediction is also a strong learning move: being
   proven wrong after an explicit commit produces more learning in children than not committing [S, Brod 2020-21].
5. **Children will find the exploit if the level allows one, and authors do not anticipate it.** Save Patch (fractions,
   n = 155): 19% of all errors came from an "everything in order" strategy (placing resources in the order the bin
   offered them), and the biggest error (47%), counting the dots instead of the spaces, was not anticipated by the
   designers [V]. Our sim [C]: on a 4-pad numberline-jump pack with MiscRule distractors, **shuffling pad positions
   does not remove the exploit** — "pick the second-smallest pad" wins 100% of levels because the add-across misc is
   always the smallest value; a rank-balanced filler cuts it to 44.5% first-try / 23.6% pass-3-of-4, still 2-5× chance.
   → A **dumb-policy bot battery** must be a Forge gate (§6).
6. **Game evidence is low-discrimination; weight it down and let other channels confirm.** PvZ2 set the discrimination
   of a typical game indicator to 0.3 ("fairly low because of the many confounds", Almond et al. 2013) [V]. Under our
   LEARNER-MODEL rules, 8 correct game predictions at weight 0.5 move pL 0.39 → 0.57; four predictions plus one
   teacher "why" (full weight) reach 0.89 [C]. That is the intended shape: games *nominate*, conversation and delayed
   probes *confirm*.
7. **Explaining a choice belongs in the game, but cheaply.** Selecting a reason from a short list after each move in a
   circuits game gave d = 1.20 on an embedded transfer test while typing a reason gave d = 0.06 (Johnson & Mayer 2010)
   [S]; in Decimal Point (n = 214 grades 5-6) a *focused* open prompt beat menu-based at the one-week delayed posttest
   (η²p = .028) [V]. Taxila's voice resolves the tension [U]: a spoken, focused "why that one?" costs no typing.
   Cap at one per level, after the commit, never before.
8. **Persistence and "grit" signals are only readable when the level is hard for that child.** PP persistence vs a
   performance task: r = 0.51 for low performers, r = 0.22 for high performers; self-report correlated with nothing
   (r = -0.01, -0.06) [V]. → Engagement constructs from games are band-conditional and never feed KT.
9. **Gaming the system is detectable and it predicts poor learning.** Decimal Point gaming detector AUC 0.85, κ 0.62;
   confrustion detector AUC 0.97, κ 0.81 (n = 191, 1,560 text-replay-labelled clips, κ_human = .74) [S, fetch summary of
   PMC full text]. Our GAME window already discounts evidence (LEARNER-MODEL rule 4); games add two patterns
   (positional/rank exploit, option cycling) that must be detected host-side.
10. **Use LLMs for evidence *identification* only, decomposed, and never as the grader of record.** A 2026 multi-agent
    LLM stealth assessment (193 K-12 players) reached r = 0.333 with the posttest; a single-LLM baseline r = 0.095 (ns)
    [S, arXiv abstract 2606.25358]. Same lesson as html-portfolio: decompose, and classify against keys — our host
    grader stays code; an LLM may label *strategy codes* offline for detector training.

---

## 1. Evidence-centred design (ECD) and how the validated systems actually built it

### 1.1 The three models (Mislevy, Steinberg & Almond 2003) [M via learning-science §1.4]
- **Competency model (CM):** what we want to know (per child, per skill). Taxila already has it: the skill graph +
  BKT-R `SkillState` + misconception logits (LEARNER-MODEL §6).
- **Evidence model (EM):** (a) *evidence identification* — rules that turn raw log events into scored observables
  ("indicators"); (b) *evidence accumulation* — the statistical model that updates the CM (Bayes net, IRT, BKT).
- **Task model (TM):** the situations that make the behaviour observable — for us, the LevelSpec.

### 1.2 Physics Playground (Shute, Rahimi, Ventura et al.)
- **Game:** draw/manipulate simple machines ("agents of force and motion": ramp, lever, pendulum, springboard) to move a
  ball to a balloon. Silver trophy = solved; gold = solved under par (usually ≤ 3 objects) [V, ShuteMoore].
- **Log content (deliberately small):** level entry, start time, time on level, objects created, restarts, agents used
  (via an agent-identification system on the drawn shapes), solved, trophy [V, Shute lessons 2015]. The Portal 2 study
  failed at evidence identification because Valve's log was "every single action ... in milliseconds" with no coding
  scheme [V]. → Lesson adopted: **log semantic events, not frames** (bridge v2 already does).
- **Accumulation:** one Bayes net per level (74 BNs in an early version) [S]; later a 3-level CM (physics understanding →
  force & motion / momentum / energy / torque → laws) with indicators linked to the lowest level [V, ETRD 2023].
- **Q-matrix with two difficulty columns:** each level has a primary (1) and secondary (2) concept, plus **game-mechanics
  difficulty (GM 1-5)** and **physics-understanding difficulty (PU 1-5)**, composite = sum. Column sums show evidence
  coverage per concept; this exposed that Newton's 2nd and 3rd laws had too few levels and led to a new level type
  (manipulation levels) [V]. → Lesson adopted as Forge rule T4 (§4) and the coverage lint (§6).
- **Validity:** r = .36 / .40 pre/post (n = 263) overall and significant per mid-level competency [V]. CPTs were the
  experts' original estimates, not refit; the authors expect refit to improve them [V].
- **Adaptivity:** if the estimate for a concept was > 0.33, give harder levels on it; if < 0.33, show a learning support
  first [V]. In the 4-arm RCT (adaptive / linear / free-choice / control) **delivery method had no significant effect
  on learning**; physics animations were the most effective of eight supports [S, ERIC abstract EJ1281101]. → Adaptive
  sequencing by a stealth estimate is not itself a proven lever; what to show when the estimate is low matters more.
- **Not hidden from the learner:** PP showed students a dashboard of their real-time estimates [V]. "Stealth" means
  unobtrusive, not secret.

### 1.3 Plants vs. Zombies 2 (Shute et al. 2016) — the clearest worked evidence rule [V]
- 32 indicators for four problem-solving facets (7 givens/constraints, 7 planning, 14 tool use, 4 monitoring); both
  positive and negative indicators; iteratively pruned for relevance and implementability.
- Indicator #37: "plants Iceberg Lettuce within the 3×3 range of a Snapdragon" (the fire melts the ice: poor tool use).
  Scored per level as a ratio (misplaced / all lettuces), binned into quartile states very good / good / ok / poor.
- CPT rows from **Samejima's graded response model**, discrimination **0.3 (low)**, difficulties 0/1/2/3; set by a
  learning scientist, two game experts and a psychometrician, then calibrated on pilot data; kept in an augmented
  Q-matrix for later adjustment.
- → What we copy: (i) indicators are *named, typed, binned* rules over semantic events; (ii) each has an explicit
  discrimination, low by default; (iii) parameters live in a versioned table, not in code.

### 1.4 Zoombinis (Rowe, Almeda, Asbell-Clarke, Baker et al. 2021) — bottom-up detectors on young children [V]
- Grades 3-8; ≥ 70 hand-labelled players per puzzle (labellers reached κ > 0.70 on 10 players first); validation on
  741-918 students per puzzle from 54 classes.
- Labels: phases of problem solving (trial and error, systematic testing, systematic testing with partial solution,
  implementing full solution), CT practices (decomposition, pattern recognition, abstraction, algorithm design), puzzle
  strategies (e.g., One at a Time, Winnowing), and gameplay efficacy (Highly Efficient Gameplay, Learning Game Mechanic,
  **Acting Inconsistent with the Evidence**).
- Detector AUCs: most 0.77-0.93; rare strategies fail (Winnowing: 10 labelled cases, κ 0.14, AUC 0.63).
- Convergent validity: systematic testing and full-solution incidence ↑ external CT score; trial-and-error incidence ↓;
  Acting-Inconsistent-with-Evidence and Learning-Game-Mechanic ↓.
- → What we copy: three **process indicators that transfer to any Forge archetype**: systematicity, inconsistency with
  evidence already shown, efficiency. Rare strategies need ≥ ~50 positives before a detector is trusted.

### 1.5 Save Patch (Kerr & Chung 2012) — fraction game, error patterns from clustering [V]
- 155 students (grades 6-8), unit / numerator / denominator / adding fractions. Fuzzy feature cluster analysis of
  first-attempt actions per level found a standard solution (42% of attempts) plus error patterns:
  - **partitioning error** (count the dividing dots, not the spaces → 2/2 instead of 2/3): **47% of all errors**,
    unanticipated by the designers;
  - **unitizing error** (assume the whole grid is one unit → 3/3 instead of 3/2): 22%;
  - **"everything in order"** (place coils in the order the bin lists them, a game exploit): 19% of errors, 32% of
    attempts in one level, reinforced because it happened to work in early levels;
  - misuse of resources 6%; adding unlike denominators only 5% (the targeted concept was mostly fine!).
- Clustering found the features in 89% of levels; only 3% of actions were mis-assigned.
- → Lessons: (i) the misconception library must be **extended from data**, not only authored; (ii) any non-mathematical
  regularity (bin order, pad order, value rank) becomes a strategy; (iii) early levels that an exploit can solve
  *teach the exploit*.

### 1.6 Simulations and inquiry (Inq-ITS, PhET)
- Inq-ITS (Sao Pedro, Baker, Gobert et al. 2013): detectors of "designing controlled experiments" and "testing stated
  hypotheses", trained on text-replay labels, estimated skill and **predicted two transfer tests** (paper MC and a
  hands-on data-collection transfer task) [S]. Other Inq-ITS detectors AUC 0.76-0.89 [S].
- Cock, Marras, Giang & Käser 2021 (EDM): early prediction of conceptual understanding from PhET clickstream, 192
  undergraduates [S]; follow-ups find inquiry strategies are fairly consistent across later activities in different
  domains [S]. → Strategy (how variables are varied) is a per-child trait worth carrying across games [U].

### 1.7 Persistence (DiCerbo 2014, Poptropica, ages 6-14) [S]
Two features (completion, time) over three quests, CFA, α = .87. A reliable non-cognitive measure *can* come from
telemetry with two features per task — but see §0.8: it is only valid where the task is hard for that child.

### 1.8 The 2026 reviews and the LLM turn
- Rahimi et al. (JRTE 58(1), 2026): systematic review of 161 publications (164 studies, 2004-2026); most studies are
  validational, convergent validity is the dominant evidence type [S, abstract]. Full text 403 to our fetcher.
- Agentic KT (Santos, Julia & Nascimento 2026, arXiv 2606.25358): structured event log → LLM action classifier
  (Fleiss κ = .624 vs experts) → four domain agents → mastery synthesis; r = .276 with gains, .333 with posttest, ns
  with pretest (discriminant), single-LLM baseline r = .095 [S, abstract].
- Bias: deep stealth-assessment models in a game-based environment encoded bias by gender and **prior game-playing
  experience**; debiasing techniques reduced it [S, IJAIED 2023 abstract].
- Lomas, Forlizzi & Koedinger 2013 (CHI): > 80,000 players, > 14,400 design variants of Battleship Numberline; what
  maximised engagement was not what maximised learning [S].

---

## 2. What, in gameplay, actually discriminates understanding (indicator families)

Ranked by how well the validated literature supports them as *understanding* evidence (not engagement).

| # | indicator family | example in our engines | support | why it discriminates | main confound |
|---|---|---|---|---|---|
| I1 | **Committed prediction before reveal** | numberline-jump pad tap before the jump plays; predict-run commit before "run" | High [S: POE, Brod]; maps to P-catalogue P3 | the commit is made from the child's model with no feedback yet; misc-mapped options name the model | guessing (chance = 1/k); rank/position exploits (§0.5) |
| I2 | **First-attempt solution vs named error pattern** | build-to-spec unit multiset; fraction-bars shade count; shop-stall change tendered | High [V Save Patch, PvZ] | error patterns are misconception fingerprints | interface slips (mis-tap), mechanic not yet learned |
| I3 | **Tool / representation choice** | pick 1/4-bricks vs 1/3-bricks; pick the coin set; choose the lever vs ramp | Medium-High [V PP agents, PvZ tool facet] | choosing a tool requires knowing what it does | menu position, colour salience |
| I4 | **Systematic vs trial-and-error process** | changes before commit; monotone convergence vs oscillation (`flip`, `circling`) | Medium-High [V Zoombinis] | systematic testing ↑ external scores; T&E ↓ | personality/impulsivity; age (6-7 year-olds explore by tapping) |
| I5 | **Acting inconsistent with evidence already shown** | after seeing 2/5 is too short, choosing 2/5 again or a pad further left | Medium-High [V Zoombinis] | ignoring disconfirmation = no causal model | not attending (distraction), audio missed |
| I6 | **Efficiency / under-par** | gold-trophy analogue: fewest units, fewest jumps, shortest grid path | Medium [V PP trophies] | efficient routes need the structure, not search | prior gaming skill (bias) |
| I7 | **Transfer level performance** | same concept, new representation: 0-1 → 0-2 line; unit → non-unit fraction; bars → money | High as *criterion* [S Nuraydin, DragonBox] | the trained surface no longer works | new mechanic load if the representation also changes the controls |
| I8 | **Explain-a-choice** (spoken, focused, after commit) | "why that pad and not the one before it?" | High [V McLaren; S Johnson & Mayer] | distinguishes coincidental-correct from principled | verbal ability, ASR, Hinglish discourse markers (LEARNER-MODEL floor 7) |
| I9 | **Time-to-insight signature** | abrupt drop in changes-before-commit and a run of correct commits after a switch | Low-Medium [U; insight-memory literature S] | "got it" is a step change, practice is a slope | a lucky streak; needs ≥ 3 items after the switch |
| I10 | **Hint consumption / dwell after hint** | `hint` rung, `dwell_after_hint` | High as KT feature [learning-science P15] | assistance needed | strategic hint use (gaming) |
| I11 | **Unprompted reuse later** | uses equal-parts reasoning in a later, different game | High when present [P24] | integration | rare; needs cross-game concept tagging |
| I12 | **Persistence on unsolved** | time on unsolved + revisits | engagement only [V PP] | — | valid only inside the child's challenge band |

Not evidence of understanding (log only): raw response latency (tie-break only, already ruled in FACTORY §4.9),
taps per second, frame rate, session length, enjoyment ratings, self-report ("samjha?" — LEARNER-MODEL floor 6).

---

## 3. Validity vs gaming: the threats and the counter-design

| threat | what it looks like | evidence | counter-design (rule id) |
|---|---|---|---|
| **Construct-irrelevant mechanic difficulty** | child understands but cannot drag precisely / does not get the controls | PP GM vs PU columns [V]; GBA fairness lit. [S] | T4: tutorial levels with zero concept load; evidence from levels with GM > band cap discounted; tap-only commits for B1-B2 |
| **Prior gaming experience** | fast, efficient play from gamers, not from understanding | deep SA bias by game experience [S] | E6: efficiency (I6) never enters KT, only nominates; fairness audit by self-declared game use and device (G-M5) |
| **Exploits / regularities** | order, position, value-rank, colour, "the odd one out" | Save Patch 19% [V]; our sim [C] | Q-gate: dumb-policy bot battery (§6); per-pack rank-uniformity lint; randomised layouts |
| **Guessing** | 1/k first-try success | chance math [C]: 4 pads, 4 levels → 25% / 5% pass-3-of-4 | E2: prediction LR 1.7 (LEARNER-MODEL probe.predict) is already low; never a mastery gate from k ≤ 3 options alone |
| **Learning while assessed** | later attempts improve because of feedback | Mislevy GlassLab [S] | E1: only the **first committed act per item** is evidence; retries feed the hint ladder / C1 class only |
| **In-game ≠ out-of-game** | trained-surface success with no transfer | DragonBox [S], Nuraydin [S] | E4: `mastered` requires one non-game or different-representation confirmation (transfer, why, or delayed P10) |
| **Assessment awareness (Goodhart)** | child learns that a "why?" follows a correct answer and pre-empts; or games become tests | [U] | randomise which correct commits get a why (≈ 1 in 3, plus all coincidence-prone items); never announce scoring; no scores shown to the child mid-game |
| **Gaming the system** | rapid guesses, cycling options, hint spam | DP gaming AUC .85 [S]; Baker detectors [S] | existing GAME window (LR^0.25) + game patterns G7 (rank/position streak), G8 (cycling all options across retries) |
| **Ceiling (task too easy)** | no persistence or strategy signal | PP high performers r = .22 [V] | engagement indicators only within `challenge band`; KT unaffected |
| **Rare-strategy detectors** | an indicator fires on noise | Zoombinis Winnowing κ .14 [V] | no detector enters KT until ≥ 50 positives and precision CI lower bound ≥ .7 vs human labels (G-M3) |

---

## 4. Level design rules (the task model): so that HOW the child plays reveals understanding

These are Forge `LevelSpec` lints (FACTORY Q5) unless marked "teacher". Written as shapes, not lines.

- **T1 Commit before consequence.** Every judged level opens with one irreversible commit (prediction, plan, tool pick)
  before anything reveals the answer. The reveal is the teaching moment; the commit is the evidence. A level whose first
  child act can be undone without cost before the reveal is not judged (log only).
- **T2 Discriminating affordances.** Each strong MiscRule for the level's skill has an option/affordance that a child
  holding that misconception would take, with a *visibly different* in-world consequence (already FACTORY §4.10
  "misconception trigger"). Coverage: each strong misc in ≥ 2 levels per pack (existing Q5 "trap coverage").
- **T3 Exploit-proof.** No policy that holds no model of the concept may beat chance + 10 pp first-try or chance + 5 pp
  on the pack's mastery gate (dumb-policy bot battery, §6). Positions shuffled per attempt; key rank among options
  approximately uniform across the pack; resources never listed in solution order.
- **T4 Mechanic before concept.** Q-matrix carries `gm` and `cd` (concept difficulty) 1-5 per level. The first level of
  any archetype is `cd = 0` (learn the controls with whole numbers / no trap). Evidence weight is 0 when `gm` exceeds the
  band cap (B1 ≤ 2, B2 ≤ 3, B3-B4 ≤ 4) [U thresholds].
- **T5 Coincidence flag.** Items where a misconception produces the right answer (e.g., 1/2 + 1/2 under add-across gives
  2/4 = 1/2) are flagged `coincident:[misc ids]`. A correct commit on them carries **no positive KT evidence** unless
  followed by I8 (why) or a non-coincident item. products-live §0.2 measured 71% of misconception misses on such items.
- **T6 Par.** Every build/route level has a solver-computed par (fewest units/moves). Under-par is I6.
- **T7 Transfer ladder.** Each pack ends with ≥ 1 near-transfer level (same representation, new numbers) and ≥ 1
  far-transfer level (new representation or context, *same controls*). Far levels are `probe.transfer.far` evidence.
- **T8 Callback level (2-3 topics later).** The Conductor schedules a callback: the same skill inside a *different*
  archetype or context (e.g., fraction magnitude inside `shop-stall` paise or a `grid-path` with fractional steps),
  days later. It is the game form of P10 (delayed retrieval), weighted as `item.open` at full code-grader weight because
  it is unannounced and off-surface.
- **T9 One spoken why per level, after the commit (teacher).** Triggered for every coincident correct commit, every
  first correct commit after a misc commit, and ~1 in 3 other correct commits. Focused shape: contrast with the nearest
  distractor. Never before the commit (it would cue), never twice in a level (flow). Graded as `probe.why` by the turn
  labeller with the kit's verified key notes.
- **T10 Inconsistency opportunity.** Packs include a level where the previous reveal is still visible and contradicts a
  misc-consistent choice, so I5 can fire.
- **T11 Challenge band for persistence.** Persistence indicators are computed only on levels where the child's pre-level
  `pSuccessNext` ∈ [0.4, 0.75] [U].
- **T12 Age.** B1 (classes 1-2): ≤ 3 options, tap only, no timed elements, the teacher voices every instruction; I4 and
  I9 are not computed (young children explore by tapping) [U, cognitive-development.md].

---

## 5. Evidence accumulation: mapping into the existing learner model (no second statistical engine)

Decision: **do not build per-level Bayes nets.** PP and PvZ needed them because their CM *was* the game. Taxila already
has an interpretable accumulator (BKT-R + misconception logits + θ, LEARNER-MODEL §6) with floors, budgets and
replay. Games feed it as one more evidence source with explicit, low weights. Rules:

- **E1 First committed act only.** Per (child, level, item): the first commit is the evidence event; retries are
  ladder events (C1-C4 semantics of `item.open`) or misconception repeats; actions after a reveal are never evidence.
- **E2 Class mapping, not new classes** (keeps LEARNER-MODEL §6.1 tables and EM refits valid):
  - prediction commit (I1) → `probe.predict` (right / mapped-wrong / other; LR 1.7 / 0.43 / 0.83);
  - first-try build / shade / tender (I2) → `item.open` (C0 / C1 / C2-C4 by hint rung);
  - multiple-choice tool pick (I3) with k options → `item.mcqK`;
  - far-transfer level (I7) → `probe.transfer.far`; near → `probe.transfer.near`;
  - spot-the-slip → `probe.errorspot`; spoken why (I8) → `probe.why`;
  - misc-mapped wrong commits additionally raise the misconception logit (existing path; evidence, not verdict).
- **E3 Game weight.** New `EvidenceEvent.via: 'game'` and `ebo: string` (evidence-bearing-opportunity id). LR ← LR^w_game
  with **w_game = 0.5 at launch** (same mechanism as `controllerEasy`), refit by G-M2. Rationale: PvZ discrimination 0.3,
  r ≈ 0.4 ceiling, gaming-experience bias [V/S]. Computed effect [C]: 8 right predictions at w = 0.5 → pL 0.39 → 0.568
  (w = 1.0 → 0.73); 4 first-try builds → 0.848; 4 predictions + 1 far-transfer level → 0.76; 4 predictions + 1 full
  teacher why → 0.893.
- **E4 No game-only mastery.** `display = mastered` requires ≥ 1 event with `via ≠ 'game'` *or* a T8 callback level in a
  different archetype, in addition to the existing `generative`/`delayed` flags. Game evidence may set `learned_today`.
- **E5 Coincident items** (T5): correct → no update; wrong → normal update.
- **E6 Process indicators nominate, they do not grade.** I4 (systematic), I5 (inconsistent with evidence), I6 (efficiency),
  I9 (insight) are written to `ComprehensionSignal` rows that the Director reads to choose the next probe (e.g., an
  inconsistency fires a why or a teach move; an insight signature schedules an early callback). They never enter the KT
  log-likelihood until G-M3 shows ≥ 0.65 AUC against delayed probes **within** skill. This is the games version of the
  rule that voice/vibe signals are tie-breakers.
- **E7 GAME window.** Existing gaming discount (LR^0.25) applies; games add patterns **G7** rank/position streak (≥ 3
  consecutive commits on the same screen position or same value rank when that is not the key's) and **G8** option
  cycling (each retry picks an untried option in screen order). Both derive only from held fields (choice ids, rank,
  position), never timing — consistent with floor 8's isolation test.
- **E8 Evidence budget.** Existing per-(skill, session) clamp (±log 50, 1/j weights) applies across game and dialogue
  combined, so a long game session cannot flood a skill.
- **E9 Re-teach selection uses the game's own trace.** When a misc is confirmed, the re-teach move picks the
  representation by the child's history (Conductor adaptation-policy) and the game supplies the *specific* contrast
  (the pad they chose vs the true landing, replayed with `ghost`). The evidence row records which representation was
  used so later success can be credited to it (representation bandit input).

### 5.1 Data shape (proposed additions)

```ts
// shared/learner.ts — additive
interface EvidenceEvent { /* … existing … */ via?: 'dialogue'|'game'|'callback'; ebo?: string /* level:item */; gameW?: number }

// server/comprehension/game/indicators.js — pure functions over the observer@1 child-event window (fake-timer tested)
export type IndicatorId = 'I1.commit'|'I2.first_try'|'I3.tool'|'I4.systematic'|'I5.inconsistent'|'I6.under_par'
  |'I7.transfer'|'I9.insight'|'I10.hint'|'I12.persist'|'G7.rank_streak'|'G8.cycling';
export interface ComprehensionSignal {          // nominations, not KT evidence (E6)
  childId: string; sessionId: string; skillId: string; ind: IndicatorId; value: number | string;
  bin?: 'very_good'|'good'|'ok'|'poor';          // PvZ-style quartile bins where the indicator is a ratio
  ebo: string; engine: string; at: number; paramsVersion: string;
}
// LevelSpec (Forge) — additive, the task-model metadata the indicators read
interface LevelEbo { skills: { id: string; role: 1|2 }[]; gm: 0|1|2|3|4|5; cd: 0|1|2|3|4|5; par?: number;
  coincident?: string[] /* MiscIds */; transfer?: 'near'|'far'; commitKind: 'predict'|'build'|'pick'|'plan'|'none';
  whyEligible: boolean }
```

---

## 6. The telemetry → evidence mapping (v1 live engine + the eight v1 archetypes)

Input events are bridge v2.1 (`answer{value, attempt, changes, latency_ms, claim, misc, state}`, `interaction{name,
facts}`, `goal_met`, `stuck`, `progress`) after observer@1 coalescing (§5.2 there) and host re-grading (FACTORY §4.9:
the kit's `outcome`/`mastered` are claims). "→ class" is the KT class from E2; "signal" is an E6 nomination.

### 6.1 `fraction-bars@1` (shipped, `src/modules/frame/engines/fractionBars.*`)
| raw (emits) | observable | → class / signal |
|---|---|---|
| `compare_answer` first per question (`answer`, correct by host) | first committed comparison | `item.mcq2`/`mcq3` (bigger / smaller / same) |
| `compare_answer` choice equals the whole-number-bias pick (larger denominator = larger) | misc commit | misc logit `MC.FRAC.WNB` (+ `item.mcqK` wrong) |
| `compare_retap` | play after correct | log only (the engine already treats it as not-an-answer) |
| `shade_changed` stream until `goal_met` | changes before goal, monotone vs oscillating | I4 signal; `goal_met` with changes ≤ par → `item.open` C0; else C1 |
| `stuck{many_changes_without_goal}` / `{repeated_wrong_compare}` | impasse | hint ladder (rung ↑); `item.open` C3/C4 when solved after |
| shade with **unequal-part counting** (counts boundaries, Save Patch partitioning error) | shaded = parts ± 1 pattern | candidate misc `MC.FRAC.PARTITION` (new, needs MiscRule review) |
Gap: compare mode has k ≤ 3 → low information; pair each compare level with a shade level of the same fraction (T7 near).

### 6.2 `numberline-jump` (v1 archetype 1)
| raw | observable | → class / signal |
|---|---|---|
| `game.answer{ref=pad}` first commit, before the jump plays | prediction | `probe.predict`: right / misc-mapped (pad = MiscRule prediction) / other |
| pad = add-across or whole-number-bias pad | misc commit | misc logit; T9 why eligible on the *next* correct |
| retry after reveal | — | not evidence (E1); `fast_retry` fact → GAME |
| same value-rank or same screen slot across ≥ 3 commits, key elsewhere | G7 | GAME window |
| level on 0-2 or 0-5 line after 0-1 pack | far transfer | `probe.transfer.far` (Nuraydin: this is exactly where gains fail to transfer) |
| correct commit on a coincident item | — | no positive update (E5) unless why follows |
**Measured design risk [C]:** with MiscRule distractors + a naive filler, the key is always second-smallest; "second
from left" passes 100% even with shuffled positions. Rank-balanced filler: 44.5% first-try, 23.6% pass-3-of-4 (chance
25% / 5%). Fix needed in the generator: add a sub-misc filler *below* the add-across value on ~1/k of levels and rotate
which misc is present, so the key's rank is uniform. Gate in §6.10.

### 6.3 `build-to-spec`
| raw | observable | → class / signal |
|---|---|---|
| `game.unit` op stream to first `answer` (host replays shadow) | first-try unit multiset | `item.open` C0 if readout ≡ key; misc if multiset matches a MiscRule (e.g., 406 as 4 hundreds + 6 tens) |
| units added then removed before submit | self-correction | P16 signal (positive), not KT |
| solution units ≤ par | under-par | I6 signal |
| unit choice mismatched to target (e.g., 1/3-bricks for a quarters target) | tool choice | I3 → `item.mcqK` only if the brick tray is a k-choice; else signal |
| bins presented in solution order | — | **lint failure** (T3, Save Patch "everything in order") |

### 6.4 `sort-build`
first placement per item → `item.mcqK` (k = bins); near-miss distractor in the misc bin → misc logit; moving an item
after the bin rule visibly rejected it, back into a bin of the same rule → I5 inconsistent. Positional exploit: bins
shuffled per level; items never streamed grouped by answer.

### 6.5 `match-reps`
first pairing per card → `item.mcqK` with k = remaining cards (information falls as the board empties: **only the first
⌈n/2⌉ pairings are evidence**); unequal-parts pairing → misc logit; elimination-by-leftover is not evidence.

### 6.6 `shop-stall` (`dukaan`)
change tendered on first attempt → `item.open`; regrouping slip pattern (e.g., ₹50 − ₹23 → ₹33) → misc logit;
choosing exact coins vs overpay-then-count → I3/I6 signals; far transfer = a word-problem shop or a different currency
amount format (paise ↔ ₹ decimals).

### 6.7 `predict-run` (POE)
prediction commit → `probe.predict`; "explain after observe" turn (teacher, T9) → `probe.why`; changing the setup
**before** running to make the predicted outcome happen (gaming the reveal) → G-pattern, discount; second prediction on
a *changed* setup after a disconfirmation → I5 if it repeats the disconfirmed model. Learning move value is high
regardless of evidence value (Brod) [S].

### 6.8 `spot-the-slip`
tap on the wrong step + choose fix → `probe.errorspot` (caught+fixed / caught / missed); the planted slip is the child's
own suspected misc — a catch is strong counter-evidence for that misc (lower the logit). Eligible only after basic
mastery (FACTORY §4.10).

### 6.9 `grid-path`
first full plan before "go" → `item.open` (rule satisfied / violated at cell x); plan length vs BFS par → I6; editing
the plan only at the violating cell after a reveal → systematic (I4+); restarting from scratch each time → T&E (I4−).

### 6.10 Forge gates added by this note (FACTORY Q5 "pedagogy & truth")
- **Q5-DB dumb-policy bot battery:** for every pack, run policies {random, first-slot, last-slot, leftmost-value,
  rightmost-value, k-th-rank for each k, solution-order, each MiscRule-as-policy, "largest number in the prompt",
  "repeat last answer"}; fail if any non-understanding policy exceeds chance + 10 pp first-try or chance + 5 pp on the
  pack's mastery gate. Seeded, ≤ 2 s per pack in CI. Prototype: `game-stealth-sim.mjs` (§A there).
- **Q5-QM Q-matrix coverage:** each skill in the pack has ≥ 3 primary levels with `commitKind ≠ none`, each strong misc
  ≥ 2 trap levels, ≥ 1 near and ≥ 1 far transfer level.
- **Q5-GM mechanic gate:** first level `cd = 0`; no judged level with `gm` above band cap.
- **Q5-CO coincidence lint:** solver marks items where any MiscRule yields the key; they must be `coincident`-tagged.

---

## 7. Implementable mechanisms (build order)

| # | mechanism | where | depends on | cost [U] |
|---|---|---|---|---|
| M1 | `LevelEbo` metadata in LevelSpec + Q5-QM/GM/CO lints | Forge kit, `harness@1` | FACTORY §4.10 generators | S-M |
| M2 | Dumb-policy bot battery (Q5-DB) | `harness@1` | M1 | S |
| M3 | Game → `EvidenceEvent` mapper (E1, E2, E3, E5) with `via`, `ebo`, `gameW` | `server/comprehension/game/toEvidence.js` | observer@1 reducer, host grader | M |
| M4 | Indicator library I4/I5/I6/I9/I12 + G7/G8 as pure functions | `server/comprehension/game/indicators.js` | M3 | M |
| M5 | No-game-only-mastery rule (E4) | `server/learner/kt/display.js` | M3 | S |
| M6 | T9 why trigger for coincident / post-misc / sampled correct commits; Director move `probe.why` with the nearest-distractor contrast shape | `server/director/` | M3, turn labeller | S |
| M7 | T8 callback scheduler: cross-archetype callback 2-3 topics later | Conductor day-cycle | skill↔archetype map | M |
| M8 | Offline strategy-code labelling (LLM-assisted on an Azure Foundry Direct model, decomposed per strategy family as Agentic-KT did; human-verified, κ ≥ .70) on NDJSON `play_event` exports → fuzzy clustering → new MiscRule *candidates* (human review) | research lane | ≥ 70 children per level (Zoombinis floor) | M |
| M9 | STUDENT-SIM game policies: understanders, each MiscRule holder, guessers, rank exploiters, mechanic-strugglers | `evals/` | M3, M4 | M |
| M10 | Fairness audit of game evidence by device tier, declared game use, language, gender | RESEARCH-PROGRAM | pilot data | S |

---

## 8. Measurements to run (none run on children yet)

| id | question | method | decides |
|---|---|---|---|
| G-M1 | Do our generators leak the key to non-understanding policies? | Q5-DB on all v1 packs (sim, seeded) | generator fixes before any pilot (§6.2 already fails) |
| G-M2 | What is w_game? | EM refit of game-class LRs against **delayed** probes (P10/T8 callbacks) per skill cluster; compare to dialogue LRs | E3 weight; whether games deserve their own class |
| G-M3 | Do process indicators (I4/I5/I6/I9) add information? | logistic model of delayed-probe success on KT pL + indicator, within skill; AUC gain with CI | whether any indicator graduates from nomination to evidence |
| G-M4 | In-game vs out-of-game transfer gap | % of children with game `learned_today` who pass a teacher far-transfer probe or T8 callback | the size of the DragonBox/Nuraydin gap for our engines |
| G-M5 | Bias | evidence-weighted pL by device tier, declared game use, language, gender, controlling delayed-probe outcome | fairness floor |
| G-M6 | Why-prompt cost | flow disruption (quit/idle within 30 s after a T9 why) vs delayed gain, randomised 1/3 vs 2/3 sampling | T9 sampling rate |
| G-M7 | Exploit discovery in the wild | G7/G8 rate per pack; clustering of first-attempt traces | lints to add |

Criterion for "it works": game-inclusive pL predicts 1-week delayed probe success better than dialogue-only pL by
≥ 0.02 AUC with no fairness gap > 0.05 between device tiers [U threshold]. Expect convergent r with an external test
in the 0.3-0.5 range at best (§0.1).

---

## 9. Proposed context entries (for the main loop to merge)

- **decision `game-evidence-into-kt-not-bayesnets`:** games feed BKT-R via existing classes with `via:'game'`,
  LR^0.5, first-commit-only, coincident items no-positive, no game-only mastery. Reverse if G-M2 shows game LRs equal
  dialogue LRs within CI on delayed probes (raise w_game to 1), or a per-level Bayes net beats it by ≥ 0.03 AUC.
- **decision `forge-dumb-policy-gate`:** every pack passes the dumb-policy battery. Reverse: never removed; thresholds
  may move if G-M7 shows children never use rank/position strategies (unlikely, Save Patch 19%).
- **measurement `game-stealth-sim-2026-10-02`:** numberline-jump 4-pad pack, n = 20,000 simulated players × 4 levels:
  second-smallest-pad policy 100% first-try with naive filler even with shuffled positions; 44.5% / 23.6% with
  rank-balanced filler (chance 25% / 5%). Posterior: 8 game predictions at w 0.5 → pL 0.39 → 0.568.
- **rejection (literature) `adaptive-sequencing-as-the-lever`:** PP 4-arm RCT (n = 263) found no effect of adaptive vs
  linear vs free-choice level delivery on learning; the support shown when the estimate is low mattered more [S].
- **rejection (literature) `in-game-success-as-mastery`:** DragonBox (no transfer to paper) and a fraction number-line
  game RCT (no transfer beyond the trained 0-1 line, n = 188) [S].

---

## Sources

- Rahimi & Shute (2023). Stealth assessment: a theoretically grounded and psychometrically sound method… ETRD. https://myweb.fsu.edu/vshute/pdf/ETRD2023.pdf [V]
- Shute, Wang, Greiff, Zhao & Moore (2016). Measuring problem solving skills via stealth assessment in an engaging video game (PvZ2). CHB 63. https://myweb.fsu.edu/vshute/pdf/pvz.pdf [V]
- Shute et al. (2015). Lessons learned and best practices of stealth assessment. IJGCMS 7(4). https://myweb.fsu.edu/vshute/pdf/IJGCMS.PDF [V]
- Shute & Moore. Consistency and validity in game-based stealth assessment. https://myweb.fsu.edu/vshute/pdf/ShuteMoore.pdf [V, partial]
- Shute, Rahimi et al. (2021). Maximizing learning without sacrificing the fun… JCAL. https://eric.ed.gov/?id=EJ1281101 [S abstract]
- Rowe, Almeda, Asbell-Clarke, Scruggs, Baker et al. (2021). Assessing implicit computational thinking in Zoombinis puzzle gameplay. CHB. https://learninganalytics.upenn.edu/ryanbaker/CHB-D-19-03159R1.pdf [V]
- Kerr & Chung (2012). Identifying key features of student performance in educational video games and simulations through cluster analysis. JEDM 4(1). https://files.eric.ed.gov/fulltext/EJ1115399.pdf [V]
- McLaren, Richey, Nguyen & Mogessie. Focused self-explanations lead to the best learning outcomes in a digital learning game. https://par.nsf.gov/servlets/purl/10400363 [V]
- Johnson & Mayer (2010). Applying the self-explanation principle to multimedia learning in a computer-based game-like environment. CHB. https://www.researchgate.net/publication/220495649 [S]
- Mogessie, Richey, McLaren, Andres-Bray & Baker (2020). Confrustion and gaming while learning with erroneous examples in a decimals game. https://pmc.ncbi.nlm.nih.gov/articles/PMC7334704/ [S]
- Nuraydin, Stricker & Schneider (2022). No transfer effect of a fraction number line game… JECP 217. https://pubmed.ncbi.nlm.nih.gov/35078086/ ; https://www.uni-trier.de/fileadmin/fb1/prof/PSY/PAE/Team/Schneider/NuraydinEtAl2022_FractionGame.pdf [S]
- Fazio, Kennedy & Siegler (2016). Improving children's knowledge of fraction magnitudes. PLOS ONE. https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0165243 [S, fetch summary]
- Long & Aleven (2014) DragonBox vs tutor; via https://www.tandfonline.com/doi/full/10.1080/19345747.2023.2269918 and https://web.stanford.edu/~kdevlin/Papers/Matlen-Devlin_CHI2020.pdf [S]
- Lomas, Forlizzi & Koedinger (2013). Optimizing challenge in an educational game using large-scale design experiments. CHI. https://pact.cs.cmu.edu/pubs/Lomas,%20Forlizzi%20&%20Koedinger%202013.pdf [S]
- Lomas et al. (2011). Battleship Numberline. https://eric.ed.gov/?id=ED528880 [S]
- Sao Pedro, Baker, Gobert, Montalvo & Nakama (2013). Leveraging machine-learned detectors of systematic inquiry behavior to estimate and predict transfer of inquiry skill. UMUAI 23. https://link.springer.com/article/10.1007/s11257-011-9101-0 [S]
- Cock, Marras, Giang & Käser (2021). Early prediction of conceptual understanding in interactive simulations. EDM. https://eric.ed.gov/?id=ED615540 [S]
- DiCerbo (2014). Game-based assessment of persistence. ET&S. https://eric.ed.gov/?id=EJ1018718 [S]
- Mislevy, Oranje, Bauer, von Davier, Hao et al. (2014). Psychometric considerations in game-based assessment. GlassLab. https://www.envisionexperience.com/~/media/files/blog/glasslab-psychometrics.pdf [S]
- Rahimi et al. (2026). Stealth assessments in digital learning environments (special issue / systematic review). JRTE 58(1). https://www.tandfonline.com/doi/full/10.1080/15391523.2025.2587551 [S]
- Santos, Julia & Nascimento (2026). Agentic knowledge tracing… arXiv 2606.25358. https://arxiv.org/abs/2606.25358 [S]
- Akram, Min, Wiebe, Mott, Boyer & Lester. Improving stealth assessment in game-based learning with LSTM-based analytics. EDM. https://files.eric.ed.gov/fulltext/ED593099.pdf [V abstract]
- Detecting and mitigating encoded bias in deep learning-based stealth assessment models (2023). IJAIED. https://link.springer.com/article/10.1007/s40593-023-00379-6 [S]
- Brod (2021). Predicting as a learning strategy. PBR. https://pmc.ncbi.nlm.nih.gov/articles/PMC8642250/ ; Brod et al. Being proven wrong elicits learning in children. Dev Sci. https://onlinelibrary.wiley.com/doi/10.1111/desc.12916 [S]
- Baker, Corbett, Roll & Koedinger (2008). Developing a generalizable detector of when students game the system. https://pact.cs.cmu.edu/pubs/Baker,Corbett,%20Roll%20&%20Koedinger%2008.pdf [S]
- Local: `docs/research/comprehension/game-stealth-sim.mjs`, output `game-stealth-sim-2026-10-02.json` [C]
