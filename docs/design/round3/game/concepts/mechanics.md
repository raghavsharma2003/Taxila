# Round 3 · Game concept (mechanics): the idea is the controller

**Date:** 2026-10-09 · **Stream:** r3 game, mechanics designer (one of three independent designers; no coordination with
the others) · **Status:** concept only. No product code, no commits, no deploys.
**Owner directive (2026-10-09):** two-way teacher, voice signals and live-build content, with duplex play, natural and
relational conversation; content today is "cheap and basic and nonsense and in particular style only and when seen in the
site is not viewed properly and totally broken"; Taxila cracks the gamification of learning "in a revolutionary way".
**Binding inputs:** `context/rejected.md` (read first), `docs/design/reset/VALUES-100.md` (V1, V3), `STUDIO-V2.md`,
`STAGECRAFT.md`, `docs/research/content/game-mechanics.md` (G1-G14, kept), `docs/research/comprehension/game-stealth.md`,
`docs/ops/MODEL-STACK.md`, the kits and `data/curriculum/*.json`. The child-safety floor and NEVER MANIPULATE sit above
everything here.

**Tags.** **[V]** read in a primary source or its abstract this session (2026-10-09). **[S]** secondary or summary source.
**[M]** from memory of the literature, not re-checked; verify before it becomes a `context/` entry. **[T]** Taxila's own
code, docs or `context/`. **[R]** measured this session for this document (method and n given where the number appears).
**[U]** design inference, not yet measured.

**Register note.** The worked examples in §8 include a few illustrative teacher utterances so the reader can hear the
register. They are illustrations for humans. They must never be pasted into a prompt (inherited law: sentence-shaped
prompt text gets recited).

---

## 0. The answer on one page

1. **What the child gets today is a worksheet with a postage stamp beside it.** In the round-2 review walks (73 in-lesson
   frames, local production build of the round-2 tree, 2026-10-07), a visual was on screen in 15 frames, at a median 21%
   of the screen. None of the 15 was a game the child could play with the idea. The one game that appeared exercised a
   different skill from the one being taught and ended on a "Shop closed 0/2 served" fail screen. A numbers-only board
   "14 · 18 · 10" was still up beside a new question about a 50 m × 30 m rectangle. **[R]** (§1). The learning act
   stayed the typed or spoken answer to a question card. The piece was decoration.
2. **The fix is not more archetypes. It is a different contract between the child, the idea and the teacher.** Seven laws
   (§2):
   - L1. **The idea is the controller.** The child's input is an operation of the concept itself: split, merge, balance,
     turn, route, vary a condition, rotate. Answer buttons and numpads are only for the final "name it" act and the bare
     transfer item.
   - L2. **The law runs, not a judge.** Feedback is the world obeying exact maths or science, and a wrong act produces the
     consequence that this misconception would produce.
   - L3. **Shortcut-free levels.** A solver proves that a level can only be solved by using the concept (Smith, Butler &
     Popović 2013).
   - L4. **Levels are experiments.** The next level is the one that best tells apart the child's live hypotheses (the
     correct rule vs the kit's misconceptions run as mal-rules) inside the difficulty band (Rafferty, Zaharia & Griffiths
     2014).
   - L5. **The teacher plays alongside.** She sees the board. She reacts within about 250 ms through level-specific lines
     that were synthesised before the level began. She takes full turns only at seams, and she can make a narrated move in
     the world.
   - L6. **Fade to the symbol.** Every family runs concrete → linked symbol → symbol-only → a bare item outside the game.
     Only the bare item buys mastery.
   - L7. **Depth over breadth.** Eight deep family engines with level grammars replace one thin engine per idea.
3. **Eight families + one mode carry 224 of the 250 class 4-7 maths and EVS/science topics** (rule-based mapping with
   reviewed overrides, one rater [R]; §4.10):
   - F1 Todo-Jodo (split and merge);
   - F2 Taraazu (balance);
   - F3 Nishana (estimate and land);
   - F4 Chalao (program and run);
   - F5 Niyam (rule hunt);
   - F6 Kyun-Lab (investigate);
   - F7 Karkhana (run the system);
   - F8 Nazariya (perspective);
   - plus the mode **Galti Pakdo (spot and fix)**, which every family engine must support.

   The other 26 topics are teacher-conversation topics by default: c4-c5 EVS values, safety and social topics, and c7
   adolescence. Making them games would be the quiz-in-costume, or the wrong register.
4. **The moat is the live teacher inside the play loop.** The strongest game evidence is about the adult, not the game:
   - teacher-provided scaffolding g = 0.58 vs success/fail feedback 0.26 (Clark et al. 2016) **[T]**;
   - GraphoGame g = −0.02 overall, but 0.48 with high adult interaction **[T]**;
   - enhanced simulations beat the same simulations without enhancement, g = 0.49 (k = 50; D'Angelo et al. 2014) **[V]**.

   No product puts a human-like voice teacher, who sees every act, inside the game loop. No study tests one with
   children either (search 2026-10-09 found none) **[V]**. So Taxila has to measure it itself (§12, the teacher-ablation
   arm).
5. **How it ships on this stack** (§10):
   - Hand-built family engines run on the existing Studio V2 core: Canvas 2D, a guarded loop and the board twin.
   - A code level generator (target under 50 ms, unmeasured) runs grammar enumeration, then the solver, the shortcut
     check, mal-rule discrimination and the difficulty band.
   - One `taxila-fast` call per level writes the reaction bank, and DragonHD pre-synthesises it.
   - Stagecraft decides when the world appears.
   - No codegen runs live (`forge-live-codegen-race`), and no model is in any truth path.
   - The world takes at least 65% of the phone screen, and the question card leaves.
6. **How we will know** (§12):
   - offline gates: solver, shortcut-free, fuzz, 60 fps on a real phone, legibility;
   - a synthetic-learner simulation of levels-as-experiments, whose bar is half the levels random selection needs;
   - a consented child pilot as a within-child crossover with a teacher-ablation arm. The outcome is delayed (≥ 2 days)
     bare items in a new form. About 105 completers give 80% power for d_z = 0.3 on two contrasts.

   Until the pilot reads out, this concept is "engineering-complete, unproven on children" (VALUES-100 honesty rule).

---

## 1. What the child sees today (measured before designing)

**Source:** `docs/design/round2/review-shots/{c4-voice-and-next-day,c6-typed-c7-voice,c7-voice}` and `data/walk-*.json`.
These are the round-2 review harness captures of a **local production build of the round-2 tree** (requests to
127.0.0.1:8811, captured 2026-10-07; the folder was committed in 2736b33), not taxila.dev. **This session drove no browser.** It is a concept document,
and these captures are the most recent child-eye view of the content path.

**Method [R].**
- Scope: every in-lesson frame, n = 73 (signup and home frames excluded), 720 × 1600 PNGs.
- Detection: a luminance < 80 row detector found dark stage blocks of at least 35% row width and at least 60 rows, below
  the teacher tile.
- Classification: each of the 15 detected stage crops was put on one contact sheet and classified by eye by one rater.
- Script: `tools/stage_area.py` in this stream's scratchpad (regenerable).

| finding | value |
|---|---|
| frames with any board or Studio piece on screen | **15 / 73** |
| screen area of that piece | **median 21%** (min 8%, max 38%) |
| pieces the child could manipulate to do the maths or science | **0 / 15** |
| the one game seen (`dukaan@1`, 2 frames, c4) | Tagged to the topic (c4-maths-ch07-t01), but the mechanic was "Enough / Not enough" taps on ₹ amounts while the lesson taught regrouping in 5000 − 1834. HUD labels overlapped ("PATIENCE 5%" under the menu button). It ended on "Shop closed 0/2 served", a failure state. |
| numbers-only board, then stale | 2 frames: "14 · 18 · 10" with no shape and no labels; in the second it was still up beside a new question ("50 m aur 30 m wale rectangle ka perimeter") |
| same word board repeated | 3 frames: "fraction — of — fraction → multiply" (c7, including the answer to "animation dikhao") |
| "animation" requests | answered with text cards ("For a rectangle, there are two equal lengths…") or a column diagram with text overflowing the card |
| empty or defective picture | 1 frame: a c7 pie with nothing shaded, sectors drawn unevenly, and a stray stroke |

**Read with what is already logged:**
- The Studio tray is a fitted box of **328 × 290 CSS px on a 360 × 800 phone**. A portrait build is scaled to about 0.37
  in it, and 44 px targets become about 16 px **[T: `rj-w2f-probe-portrait-viewport`]**.
- 2886 / 3011 authored catalogue boards (95.8%) fail `W1.fits_stage` at the live tray **[T: round2/content RESEARCH §0]**.
- A frame archetype could mount on only 23 / 385 class 4-7 topics, all of them fractions
  **[T: `rj-reset-w2h-library-as-visual-answer`]**.
- The Studio V2 engines are thin:
  - the 16 core engines run 126-405 lines each **[R: `wc -l src/studio-v2/engines/*.ts`]**;
  - the 26 extension engines and their three helper files total 5,539 lines, under 213 lines per engine on average
    **[R]**.
  - Their concepts are often good: Landfall, Circuit Lab and Food Web make the act the learning act. But a 200-line engine
    cannot carry Monument-Valley craft, a level grammar, a solver and mal-rules.

**Diagnosis.** The owner's four complaints are four separate failures. Each needs its own fix:
- "cheap and basic": thin engines and no level design;
- "nonsense": the pictures are not bound to the skill at hand;
- "particular style only": one dark-card template for everything;
- "not viewed properly / broken": the piece is glance-sized inside a text layout, with overlapping HUD and fail screens.

The root cause under all four is structural. **The lesson is a quiz, and the game is an attachment to it.** §2 inverts
that.

---

## 2. The concept: seven laws

These laws sit on top of `game-mechanics.md` G1-G14, which all stay:
- G1: every state change is a verified learning act;
- G3: no RNG in progress or feedback;
- G4: no currency, points, XP, collectibles or unlocks;
- G6: misconception-specific consequences, no lives, no game over;
- G7: no child-vs-child competition;
- G8: every session ends on an abstract act;
- G10: no countdown timers;
- G11: difficulty comes from the learner model, never from engagement.

### L1 · The idea is the controller
- **Rule.** The child's verbs are the concept's own operations:
  - split, merge, regroup (quantity structure);
  - add or remove on both pans (equality);
  - place on a scale (magnitude);
  - compose instructions and run them (procedure);
  - choose an example to test a rule (induction);
  - set conditions and run time (causation);
  - route a flow through stations (systems);
  - rotate, reflect, project (space).

  A numeral appears as a **read-out of a state the child built**, not as a thing to type. Answer-entry inputs
  (choice, numpad, free text) are allowed in two places only: the final "name it" act and the bare transfer item.
- **Why.**
  - Intrinsic integration gave more learning and 7× the voluntary play time (Habgood & Ainsworth 2011) **[T]**.
  - "Simplistically intrinsic" designs (one mechanic that is both the game and the learning) scored g = 0.49 in Clark 2016
    **[T]**.
  - Doing beat watching or reading by about 6× in the CMU doer-effect analyses (Koedinger et al. 2015). That analysis is
    correlational, with causal follow-ups **[S]**.
  - The algebra RCT with 3,600+ grade-7 students found that the two games where students *manipulate expressions as
    objects* (From Here to There, DragonBox 12+) beat the active control. Problem sets with immediate feedback did not
    (Decker-Woodrow et al. 2023, analytic N = 1,850, nine 30-minute sessions) **[S]**.
- **Measure.** At least 80% of graded acts in a family session are manipulations (§12, M-I1).

### L2 · The law runs, not a judge
- **Rule.** Every act changes the world by exact rules:
  - rational arithmetic, prime decomposition, exact geometry;
  - a nodal circuit solver (exists: `circuit-bench@1`);
  - a deterministic germination model taken from the kit expectations;
  - a digestion state machine.

  Feedback is the world's response, shown within 100 ms (STUDIO-V2 QB-G3). A wrong act produces the consequence its
  misconception would produce:
  - a composite leaf keeps humming;
  - a drowned tray does not sprout;
  - a bypassed small intestine leaves the blood meter empty.

  There is no red cross, no "galat" and no lost life.
- **Why.**
  - Feedback that shows the answer or more beats success/fail feedback: answer display g = 0.40 and enhanced scaffolding
    g = 0.48, vs success/fail/points 0.26 (Clark 2016) **[T]**.
  - Simulations vs no simulation: g = 0.62 (k = 46, N = 2,947; D'Angelo et al. 2014) **[V]**.
- **Measure.** 100% of verdicts come from the host's exact check. Frame claims are never trusted
  (`rj-ot-frame-claim-as-grade`).

### L3 · Shortcut-free levels
- **Rule.** Each family ships a complete solver for its level grammar. A generated level is served only if:
  1. it is solvable;
  2. every solution uses the target concept features;
  3. no solution achieves the goal while bypassing them.

  Point 3 is the "shortcut" (undesirable-solution) check.
- **Why.**
  - Refraction's designers found that "the quality of a puzzle is critically sensitive to the presence of alternative
    solutions with undesirable properties", and built answer-set-programming generators that guarantee no shortcut exists
    across the whole play space (Smith, Butler & Popović 2013) **[V]**.
  - Harpstead et al. (CHI 2014) built a method that checks how a game responds to solutions that do and do not follow the
    target principles, using RumbleBlocks **[S]**.
  - Taxila's own engines-v1 copy tasks are the domestic proof: `rj-array-dims-binding` and `rj-engine-prompt-shows-target`
    **[T]**.
- **Measure.** Shortcut-free rate of served levels = 100% (solver check in CI and at serve time).

### L4 · Levels are experiments
- **Rule.** The generator scores each candidate level on four things:
  - **(a) discrimination:** the probability that the act a child holding misconception *m* would make (simulated by *m*'s
    mal-rule) differs observably from the correct act, weighted by the child's current P(*m*) from
    `server/learner/kt/misconception.js`;
  - **(b) band fit:** predicted first-try success in the G11 band (70-85% [U]);
  - **(c) novelty vs the last levels**, kept moderate;
  - **(d) fade stage.**

  The pick is the best weighted score. Outcomes update the existing per-misconception logit through the existing log-LR
  machinery, at the game weight w = 0.5 (`game-evidence-into-kt-not-bayesnets`).
- **Why.**
  - Treating game design as optimal experiment design found games that needed about half as many players for the same
    precision of the cognitive-model estimate (Rafferty, Zaharia & Griffiths 2014) **[S]**.
  - Mal-rule simulation is the classic diagnostic method for procedural bugs (Brown & Burton 1978; VanLehn 1990) **[M]**.
  - The kits already give every topic named misconceptions with signs and diagnostics **[T]**.
  - Moderate novelty maximised intrinsic motivation (n = 5,065; Lomas et al. 2017) **[S]**.
- **What adaptivity is NOT.**
  - It is not the learning lever. Physics Playground's adaptive sequencing had no delivery effect (n = 263)
    **[T: `adaptive-sequencing-as-the-lever`]**.
  - L4 exists to diagnose fast and to keep the child in band. The learning lever is the teacher, the representation and
    the consequence.
- **Measure.** M-S1 (§12): in the synthetic-learner simulation, information-gain selection identifies the mal-rule in at
  most half the levels random selection needs.

### L5 · The teacher plays alongside (duplex play)
- **Rule.** She sees the same state the engine sees. She acts on three channels (§5):
  1. **micro-reactions:** level-specific lines pre-synthesised before the level, chosen by code from engine moments, at
     about 250 ms p50;
  2. **seam turns:** full Director turns at level end, at an impasse, after a committed prediction, or whenever the child
     speaks;
  3. **in-world moves:** a narrated ghost-hand demonstration, the worked example inside the world.

  The world never freezes while she thinks or talks. The child can talk while playing.
- **Why.** Teacher-provided scaffolding g = 0.58 vs 0.26 (Clark 2016); adult interaction 0.48 vs −0.02 (McTigue 2020)
  **[T]**. Unstructured Logo with minimal teacher intervention left children with fragile angle knowledge (Simmons &
  Cope 1990) **[S]**. The adult is the active ingredient.

### L6 · Fade to the symbol, and only the symbol buys mastery
- **Rule.** Every family's level grammar has four stages:
  1. concrete world;
  2. world + live symbol read-out, two linked representations driven by one state;
  3. symbol-only control (the child manipulates the notation itself, as in From Here to There);
  4. a bare kit item outside the game, typed or spoken.

  A skill is "secure" only after a non-game delayed check (V1 bar 3).
- **Why.**
  - DragonBox gave no paper-equation gain in a 3.5 h study **[T: `in-game-success-as-mastery`]**.
  - A fraction number-line game improved only the trained task (Nuraydin et al. 2022, n = 188) **[T]**.
  - Concreteness fading is the recommended path from concrete to abstract (Fyfe et al. 2014 review) **[S]**. In Fyfe,
    McNeil & Borjas 2015 the concrete-only group did worst on transfer **[S]**.

### L7 · Depth over breadth
- **Rule.** Build eight family engines, each one deep:
  - a hand-tuned feel;
  - a level grammar spanning 2-3 grade levels;
  - a solver and mal-rules;
  - a board twin;
  - many skins and contexts, so the families do not all share one style.

  This replaces 42 one-idea engines as the build target. The existing engines are folded in as family instances (§4).
- **Why.**
  - Brilliant's humans own "the learning objective, the progression, and the aha moment" while AI fills variants
    **[T: STUDIO-V2 §2]**.
  - Refraction's automatic progression matched an expert progression on engagement after iteration (2,377 players;
    Butler et al. 2015), but only because the level grammar and the solver existed **[V abstract]**.
  - Children below grade level are the norm in India: in rural India only 30.7% of Std V children can do a Std III-IV
    division sum (ASER 2024) **[S]**. A family must reach down without changing world.

---

## 3. Core loops per learning goal

Every family runs one of four loops, chosen by the topic's goal. Kit `topicType` T1-T5 and `formats` hints map onto them.

| goal | loop (one level) | the failure that teaches | fade | teacher's job in the loop | evidence |
|---|---|---|---|---|---|
| **Conceptual** (fractions, primes, place value, equality, light, Moon) | predict → manipulate → the law responds → notice the invariant → name it with the symbol → same idea in a new representation | The misconception's consequence happens in the world (the composite leaf hums; the equal-looking pieces do not tile). | world → linked symbol → notation-as-object → bare item | Asks for the prediction. Names the invariant after the child sees it, never before. | concreteness fading [S]; manipulatives, 55 studies, N = 7,237, small-to-moderate effects, moderated by guidance (Carbonneau et al. 2013) [S] |
| **Procedural** (column subtraction, long division, constructions, order of operations, turns) | watch one (teacher's narrated ghost move) → do it with the machine's steps visible → steps hidden → debug Bittu's run → find a shorter program → bare item | The program runs and visibly goes wrong at the buggy step (the regrouping arrow never fires; the turtle overshoots). | machine visible → machine hidden → symbol | Models first for class 4-5. Picks the moment to hide steps. Asks "kahan galti hui?" on Bittu's run. | programming → transfer g = 0.49, maths among the beneficiaries (Scherer et al. 2019) [S]; erroneous examples, delayed d = 0.33 (McLaren 2015, n = 390) and the Decimal Point game built on them, delayed d = 0.37 (n = 153) [T]; comparing solution methods → flexibility (Rittle-Johnson & Star 2007) [S] |
| **Factual** (organs, materials, plant types, units, vocabulary of science) | the fact is a working rule of a system the child runs → a wrong fact makes the system fail where it matters → the fact is retrieved later in another family and form (spacing) → teach-back to Bittu | The system misbehaves (no energy reaches the blood; the separation line clogs). | system → labelled system → unlabelled → bare recall item | Ties the fact to its function in one clause. Schedules retrieval across days (FSRS exists). | structure-behaviour-function models for complex systems (Hmelo-Silver & Pfeffer 2004) [M]; retrieval with corrective feedback (`rj-schedule-shape-tuning`) [T] |
| **Reasoning** (fair tests, rules, classification, patterns, data claims) | question → committed prediction → design a test (the fair-test meter lights every difference) → run → evidence vs prediction → spoken "why" → revise | A confounded test gives an ambiguous result the child must notice; a wrong rule fails the world's counter-example. | lab → lab with record table/graph → table only → bare planning item | Teaches the control-of-variables rule explicitly at the moment of confusion, not as pure discovery. | Chen & Klahr 1999 (N = 87, ages 7-10: explicit CVS training + probes → learn and transfer) [V]; Klahr & Nigam 2004 (N = 112: 40 → 80% with instruction, discovery no gain) [S]; predicting as a learning strategy (Brod 2021) [V] |

**Productive failure, placed by class** (Sinha & Kapur 2021: problem-solving before instruction g = 0.36 over 53 studies,
0.37-0.58 at high fidelity, **but the trend reversed for grades 2-5**) **[V]**:

| class | first contact with a new idea | why |
|---|---|---|
| 4-5 | The teacher makes the first move in the world (narrated ghost hand), then the child continues. Attempt-first only on review items. | grades 2-5 favoured instruction first [V] |
| 6-7 | Attempt-first level ("make 36 into atoms any way you can"), consolidation by the teacher after, but only when the prerequisite skills are secure in the learner model. | PS-I effect in grades 6-10 [V]; expertise reversal (Kalyuga) [M] |

---

## 4. The eight families and the mode

Each family is one engine with:
- a world;
- a closed verb set;
- an exact law and its solver;
- mal-rules generated from kit misconceptions;
- a 4-stage fade;
- a board twin (the "rung 4" fallback);
- skins: context sets chosen from the child's interest tags, such as laddoo boxes, a cricket scoreboard, a kirana shelf or
  a monsoon field. Skins change the look. They never change the maths.

Topic counts come from §4.10.

| # | family | learning goal · mechanism | the controller (verbs) | topics (of 250) |
|---|---|---|---|---|
| F1 | **Todo-Jodo** · split and merge | conceptual + procedural · conservation of quantity under regrouping; part-whole | split, merge, bundle, unbundle, cancel a zero pair, cut into equal parts | 49 |
| F2 | **Taraazu** · balance | conceptual + reasoning · equality as a relation; invariants under transformation | add or remove on both sides, swap equal for equal, find the balance point | 15 |
| F3 | **Nishana** · estimate and land | conceptual · magnitude on a continuous scale; calibration by error | place, steer to, read off, zoom | 16 |
| F4 | **Chalao** · program and run | procedural · externalised procedure; debugging; economy | compose steps, run, step, rewind, edit, shorten | 44 |
| F5 | **Niyam** · rule hunt | reasoning + factual · induction from self-chosen examples; contrasting cases | test an example, sort, propose a rule, face the world's counter-example | 15 |
| F6 | **Kyun-Lab** · investigate | reasoning · prediction error; control of variables; evidence → explanation | set conditions, commit a prediction, run time, compare, record | 37 |
| F7 | **Karkhana** · run the system | factual + conceptual · structure-behaviour-function; flows and stations | place stations, connect, open and close valves, route, diagnose | 20 |
| F8 | **Nazariya** · perspective | conceptual (spatial) · mental transformation trained by manipulation with linked views | rotate, reflect, project, move the light or the viewer | 28 |
| M | **Galti Pakdo** · spot and fix | all · erroneous examples; error detection + self-explanation | find the faulty step in Bittu's build, repair it, explain | runs inside every family |

### 4.1 F1 Todo-Jodo (split and merge)

- **The law.** Exact integer and rational arithmetic; prime decomposition; place-value regrouping; zero pairs.
- **The solver.** A bounded search over split and merge sequences.
- **Worlds and skins.**
  - Number blocks that crack along their factors, the "atoms" of §8.1.
  - Bundles of tens, hundreds and thousands on a conveyor (place value, lakhs and crores).
  - Rotis, bars and ribbons that cut into equal parts and re-cut without the amount moving (fractions, equivalence).
  - Token pairs that annihilate (integers).
  - Unit bundles: 1 kg = 1000 g crates, km/m/cm strips.
  - Tiles that fill an area (area by counting, same area with different shapes).
- **Failure that teaches.**
  - An unequal cut will not tile the whole.
  - A fraction "added tops and bottoms" visibly overflows the bar (`m-add-same`).
  - A composite leaf keeps humming.
  - A 1-fragment evaporates without changing anything (`m-include-one`).
- **Fade.**
  1. objects;
  2. blocks with live notation (2 × 2 × 3 × 3 under the molecule);
  3. the child drags the notation itself, e.g. regrouping 3/4 into 6/8 on the symbols;
  4. bare item.
- **Folds in.** `slice-at@1`, `fraction-ops@1`, `zero-pair@1`, `area-claim@1`, `vault-heist@1`; `dukaan@1` as a context
  skin with the market-maths bridge kept, so every shop transaction is paired with its written twin (Banerjee et al.
  2025) **[T]**.
- **Evidence.**
  - Manipulatives (above).
  - Refraction's equal-partitioning mechanic, with its shortcut-free generator **[V]**.
  - Motion Math: a 122-pupil crossover with +15% on a fractions test after 5 × 20 minutes (vendor-commissioned) **[S]**.
  - Slice Fractions: learned as much as conventional teaching (Cyr et al. 2015) **[S]**.

### 4.2 F2 Taraazu (balance)

- **The law.** An exact equality checker; balance torque computed as exact rationals (the physics only animates; the law
  judges, per `game-kit-frameworks` §0.4).
- **Worlds.**
  - A scale with weights and mystery bags (equations, c7 ch15).
  - Equal-amount scales for equivalent and compared fractions or measures.
  - A see-saw of data points whose pivot is the mean (c7 ch13 t02).
  - The acid-base neutral point as an F6 crossover (c7 ch02 t02).
- **Failure that teaches.** Acting on one side only tips the scale (`do the same to both sides`). "=" read as "the answer
  comes next" fails when the child builds 3 + 4 = □ + 2 and the pans refuse to level (the relational equal sign) **[M:
  McNeil & Alibali on equal-sign understanding]**.
- **Fade.** Bags and weights → bags labelled x → the equation is the scale (drag terms across, as in DragonBox and FH2T)
  → a written equation.
- **Folds in.** `balance-beam@1`.
- **Evidence.** The FH2T and DragonBox RCT result above **[S]**. Its warning is DragonBox's missing transfer: L6 is
  mandatory here **[T]**.

### 4.3 F3 Nishana (estimate and land)

- **The law.** Exact positions on lines and scales (whole numbers, fractions, decimals, integers, units, time, angle
  measure, map scale, graph axes). The error is shown as distance from the truth, e.g. "off by about 1/8".
- **Worlds.** Landfall (pods land where a number lives), a runner who jumps at a value, a zoomable number line, an
  instrument bench (reading scales), a bar-graph builder.
- **Failure that teaches.** The pod lands where the value really lives, and the gap is drawn. "Longer decimal = bigger"
  lands visibly short.
- **Fade.** Marked line → unmarked line → symbol comparison → bare item. Mix ranges (0-1, 0-2, 0-5) and equivalent forms
  to push transfer.
- **Folds in.** `catch-on-line@1`, `line-runner@1`, `instrument@1`, `data-rush@1`, `pictograph@1`.
- **Evidence.** Number-line estimation (PAE) is the standard magnitude measure (Siegler & Booth 2004) **[M]**. Narrow
  transfer is a known risk (Nuraydin 2022) **[T]**. Easier variants were more engaging and learned slowest (Battleship
  Numberline, Lomas et al. 2013) **[T]**.

### 4.4 F4 Chalao (program and run)

- **The law.** An interpreter for a tiny instruction set per world. The child composes and runs; the engine executes step
  by step, with rewind.
  - **Turtle and route:** forward n, turn θ; angles as turns, directions, maps, polygons (c5 ch03, ch14; c6 ch02).
  - **Arithmetic machines:** column addition and subtraction with visible regrouping carriers; a long-division machine;
    a remainder sorter (c4 ch13, c5 ch09).
  - **Expression evaluators:** brackets reroute the order (c7 ch02).
  - **Sequence generators:** rule → next terms (c6 ch01, Virahanka-Fibonacci).
  - **Compass and straightedge programs:** constructions (c6 ch08, c7 ch07, ch14).
  - **Clock machine:** elapsed time.
- **Failure that teaches.**
  - The program runs and fails at the faulty step.
  - The turtle's "turn 60" for an equilateral triangle leaves a gap: the exterior vs interior angle.
  - The subtraction machine shows "0 − 4" stuck until the child sends a regroup.
- **Economy as the replay driver.** After a solve, the solver shows the child's program beside the shortest known one:
  "kya tum ise 4 step mein kar sakte ho?". This is comparison of solution methods, not a score. It follows Euclidea's L/E
  move counts **[S]** and Zachtronics' per-metric histograms **[S]**, except that the comparison is with the child's own
  earlier solution and the teacher's, never other children.
- **Folds in.** `angle-cannon@1`, `map-route@1`, `geo-forge@1`, `rule-machine@1` (as a machine), `angle-sum@1` (as an
  explainer ending in a construction).
- **Evidence.**
  - Programming instruction transfer g = 0.49 (105 studies; Scherer et al. 2019) **[S]**.
  - Logo and angle concepts (Clements & Battista 1989/1990) **[M]**, with the counterpoint that unstructured Logo leaves
    fragile angle knowledge (Simmons & Cope 1990) **[S]**, so the teacher stays in the loop.
  - Erroneous examples **[T]**.

### 4.5 F5 Niyam (rule hunt)

- **The law.** A hidden rule (a predicate over numbers, shapes or materials) and a **counter-example engine**. When the
  child states a rule, the world searches for the smallest case where the child's rule and the true rule disagree, and
  shows it.
- **Worlds.**
  - A number gate that lets some numbers through (odd/even, divisibility tests, primes, palindromes, parity).
  - A sorting bench for materials and organisms by property: magnetic, conductor, metal, living, herb/shrub/tree, leaf
    venation, renewable.
  - Polygon families.
- **Failure that teaches.** An over-narrow rule ("odd numbers are prime") meets 9 at the gate. A property-free
  classification ("all metals are magnetic") meets aluminium at the magnet.
- **Fade.** Physical tests → the child's rule card → a rule stated in words → a bare item ("Is 2,346 divisible by 3?").
- **Folds in.** `sieve-storm@1`, `sort-storm@1`, `pattern-lab@1`, `beat-line@1` (rhythm of multiples).
- **Evidence.** Contrasting cases and comparison **[S]**. The counter-example mechanic is Zendo/Eleusis-style inductive
  play **[U]**: a design reference, not a learning study.

### 4.6 F6 Kyun-Lab (investigate)

- **The law.** A deterministic causal model per lab, written from the kit's expectations and reviewed:
  - germination (water, air, warmth needed; light and soil not needed for germination, needed after);
  - evaporation factors;
  - magnets;
  - conductors;
  - indicators and neutralisation;
  - rusting;
  - floating and sinking;
  - pendulum (length sets the period, mass does not);
  - photosynthesis conditions;
  - food spoilage.

  Every outcome is computed, never drawn freely (`generated-media-carries-facts`).
- **The fair-test meter.** When the child compares two set-ups, every differing condition is highlighted. A confounded
  comparison is allowed, and its result is ambiguous ("2 badlav: kis wajah se?"). That is productive failure for class
  6-7, and the teacher teaches the control-of-variables rule there.
- **Failure that teaches.** The prediction is committed first. Then the world contradicts the misconception: moong sprouts
  in the dark; a drowned tray fails; the heavier bob swings at the same rate.
- **Fade.** Lab → lab + tally/graph (the F3 crossover) → table only → a bare planning item ("plan a fair test at home").
- **Folds in.** `circuit-bench@1`, `fair-test@1`, `field-lab@1`, `heat-lab@1`, `phase-shift@1`, `motion-lab@1`,
  `life-lab@1`, `town-lab@1`, `land-lab@1`.
- **Evidence.** Chen & Klahr 1999 **[V]**; Klahr & Nigam 2004 **[S]**; Brod 2021 **[V]**; D'Angelo 2014 **[V]**.
  PhET's implicit scaffolding means affordances cue exploration without instructions **[T: STUDIO-V2 §2]**.

### 4.7 F7 Karkhana (run the system)

- **The law.** A state machine of stations, connections and flows, with tokens that transform at stations:
  - digestion (chains → units; villi absorb units only);
  - the water cycle and groundwater;
  - food chains and energy;
  - a river from source to sea;
  - fibre to fabric;
  - recycling paper;
  - separation pipelines;
  - heat transfer in nature;
  - transport in plants;
  - respiration.
- **Failure that teaches.** A mis-ordered line does not flow. A missing station leaves the output starved. A wrong
  connection (bile to the stomach) does nothing for fat. The fact is learned as the reason the system works.
- **Fade.** The system → the system with labels hidden → an unlabelled diagram → bare recall in a new form.
- **Folds in.** `food-web@1`, `water-cycle@1` (from animation to operable system).
- **Evidence.** Structure-behaviour-function models **[M]**; simulations g = 0.62 **[V]**. This family has the weakest
  direct evidence of the eight. Its pilot readout is the one to watch (§11, R4).

### 4.8 F8 Nazariya (perspective)

- **The law.** Exact 3D projection and geometry: views of solids, reflection, rotation, shadows from a point or parallel
  light, Moon phases, eclipses, day and night, seasons (axial tilt).
- **Worlds.** A block-builder with top, front and side silhouettes; a mirror and kaleidoscope bench; a torch and screen; an
  orbit view linked to "from Earth"; a tile-fit floor (tilings, congruence by rotate or flip).
- **Failure that teaches.**
  - The silhouette does not match the target.
  - The first-quarter Moon sits far from Earth's shadow and is still half dark (`orbital-explainer@1` already shows this).
- **Craft target.** This is where "Monument Valley-level" applies literally. The perspective is the mechanic and
  everything needed sits within one screen (Ken Wong, GDC Europe 2014, "less game, more experience") **[S]**.
- **Folds in.** `orbital-explainer@1`, `shadow-play@1`, `ray-lab@1`, `mirror-paint@1`, `solid-view@1`, `sky-lab@1`,
  `scale-cinematic@1`.
- **Evidence.** Spatial training g = 0.47 over 217 studies. The effect is durable and transfers to untrained spatial tasks
  (Uttal et al. 2013) **[V]**. A larger effect for children under 13 is reported second-hand only **[S]**.

### 4.9 Mode M · Galti Pakdo (spot and fix)

- **Rule.** Every family engine must render a **bugged state from a named mal-rule**: Bittu's tree stopped at 8; Golu's
  confounded trays; a factory that bypasses the small intestine. The child finds and repairs the faulty step, then says
  why. Bittu is a clearly fictional apprentice. **The teacher never pretends to make a mistake** (no lying).
- **Evidence.**
  - Erroneous examples were *liked less* than plain problem solving and *learned more*: delayed d = 0.33, n = 390
    (McLaren 2015) **[T]**.
  - Decimal Point, a game built on erroneous examples and self-explanation: d = 0.43 immediate and 0.37 delayed vs
    conventional software, n = 153, with higher enjoyment (McLaren et al. 2017) **[T]**.
  - Teachable agents: students worked harder for their agent, most for lower achievers (Chase et al. 2009). A 2017
    replication found no link with test scores **[S]**.
  - Ganita Prakash 7 ch15 t03 is literally "Mind the mistake" **[T]**.

### 4.10 Coverage (measured on the curriculum, not assumed) [R]

**Method.**
- Script: `tools/coverage.mjs` + `tools/finalize.mjs` in the scratchpad, over `data/curriculum/c4-c7-{maths,evs,science}.json`.
- Assignment: keyword rules over topic, chapter and skill titles give the primary family; then 21 reviewed overrides.
- One rater (this designer), not validated by a second rater, 2026-10-09.

| family | topics | by subject |
|---|---|---|
| F1 Todo-Jodo | 49 | maths c4 11, c5 13, c6 12, c7 13 |
| F4 Chalao | 44 | maths c4 5, c5 9, c6 14, c7 16 |
| F6 Kyun-Lab | 37 | EVS c4 2, c5 4; science c6 14, c7 17 |
| F8 Nazariya | 28 | maths 15; EVS 4; science 9 |
| F7 Karkhana | 20 | EVS 8; science 12 |
| F3 Nishana | 16 | maths 13; science 3 |
| F2 Taraazu | 15 | maths 14; science 1 |
| F5 Niyam | 15 | maths 6; EVS 3; science 6 |
| **game topics** | **224 / 250** | |
| teacher-conversation by default | 26 | c4 EVS 10, c5 EVS 9, c6 science 2, c7 science 5 |

**The 26 non-game topics.** Community, communicating, neighbourhood services, money and saving, traditional ways, healthy
plate, junk food, sleep/play/feelings, landforms, houses suited to the land, school safety, languages and music, national
symbols, special places, stitching, caring for Earth, how scientists find out, why diversity matters, science as evidence
and as a human effort, and all three adolescence topics (c7 ch06).

**Borderline.** Four could take a family later: money and saving (F1, a dukaan skin), healthy plate (F2), and houses
suited to the land and landforms (F6, design for climate). **The adolescence topics stay out of game form permanently:**
that is a safety and relational register, not a play register.

**Not covered here.** The 135 English, Hindi and SST topics of the 385. This concept is maths and science only.

Secondary families appear on most topics (F3 on 95, F5 on 65, Spot and Fix on 36). A lesson can move between families
without changing topic. Per-family topic ids are listed in Appendix A.

---

## 5. How the teacher plays alongside (duplex play)

The owner asked for a two-way teacher and duplex conversation. In play, this means **neither side has to stop for the
other**:
- the world keeps running while she talks;
- she keeps watching while the child talks;
- the child can talk with their hands busy.

### 5.1 Three channels

| channel | when | latency | how it is made | guards |
|---|---|---|---|---|
| **Micro-reaction** (2-6 words, noticing, never judging) | on engine moments: first act, a split made, a prediction violated, an impasse forming, a near-miss, a new strategy, level solved | **event → audio ≤ 250 ms p50, ≤ 400 ms p90 [U target]** | Before each level, one `taxila-fast` call writes a **reaction bank** from the level's facts (numbers, objects, the child's earlier acts): 2-3 variants per moment class. DragonHD pre-synthesises the 8 most likely first. First byte 228 ms per clip **[T: MODEL-STACK]**. Code picks the clip. | Every line passes the never-rules, persona invariants, `revealsAnswer()`, the praise/deny guards and the Devanagari step before synthesis. A failing line is dropped, never repaired live. No verdict words ("galat", "sahi"). Never the key. Deterministic rotation, never random (G3). |
| **Seam turn** (a full Director turn) | level end; impasse (no productive act for N s, or an oscillating undo pattern); a committed prediction to discuss; the child speaks; a mal-rule signature confirmed | the existing turn path, ~3.2 s to first audio today [T]. The world keeps running, so the wait is covered by play, not a spinner. | The existing compile prompt, plus an `on screen now · world ·` facts row (the board-first pattern: telegraphic values, the drawn counts, never sentences) | everything the turn path already has: scanSafety + model distress read on every committed turn; the rung rules (key never spoken before rung 4); the stop check-in |
| **In-world move** (teacher as teammate) | class 4-5 first contact (§3); the child asks "aap karke dikhao"; the worked-example rung | clause-level cues with 400 ms pre-roll [T: `teacher-stage-cue-scheduler`] | `engine.teacherAct(act)` animates a ghost hand doing a legal act in sync with her line. The act is evidence of nothing, so it never moves the learner model. | Only legal moves. Never on the item being assessed. Never the last step of a graded level. |

**Why a pre-synthesised bank and not a model call per event.**
- The Director stage alone is 1562 / 2328 ms (p50 / p90), and first audio end to end is about 3.2 s **[T]**. A reaction
  generated per event would land after the child's next act.
- Bastion is the craft reference for reactive narration: about 3,000 recorded lines, triggered by what the player
  actually does, and never repeated unless the player repeats the content **[S: Supergiant]**. Taxila's version writes the
  lines per level from that level's facts. That also answers the logged tic risk of fixed filler lists
  (`rj-static-filler-list`).

**On quota trouble.** If the bank call hits a 429, three fallbacks apply:
1. a small family-generic bank per language, cached and rotated, capped at 2 uses per lesson;
2. the 2D puppet's listening and noticing poses;
3. silence.

The level is never blocked.

**Cost [estimate].**
- One level's bank: 8 clips × about 30 characters = 240 characters at $22 per 1M = $0.0053, plus about $0.0003 for the
  `taxila-fast` call.
- First clips for both "door" options: about $0.008 per level.
- A 30-minute play segment of about 12 levels: about $0.10, against a lesson-hour TTS line of $0.381 **[T]**.

### 5.2 Floor rules in play (reusing the duplex engine, adding nothing new to safety)

- She never speaks over the child. Micro-reactions obey the floor manager (no clip while the child holds the floor or in
  `hold`), at most 1 per 4 s, and none during a sustained manipulation gesture.
- Child speech during play is a normal committed turn: scanSafety, the distress read, the stop check-in. "Bas" mid-level
  gets the one warm check-in. The world pauses only if the child picks break or stop, and it resumes on the same level.
  Nothing is lost, so there is nothing to threaten ("progress chala jayega" is a NEVER MANIPULATE violation by
  construction).
- The backchannel policy stays content-blind (`server/duplex/backchannel.js`). Micro-reactions are content-aware, so they
  are restricted to noticing the world's state ("andhere wale bhi phoot gaye!"), never the child's correctness.

### 5.3 Speech as a game verb (honest limits)

- Streaming STT gives its first partial at 1.4-2.6 s and its final in 68 ms from Chennai after the endpoint **[T:
  MODEL-STACK]**. Speech is therefore a verb only for **discrete, non-time-critical acts**:
  - committing a prediction ("dark wala nahi ugega");
  - choosing a split ("teen se todo");
  - naming a rule;
  - asking for a door ("spicy wala").
- Touch carries all continuous control.
- A spoken verb echoes in the world at once (the split happens visibly), and undo is free, so a misrecognition costs one
  tap.

### 5.4 Relational, not scripted

- She remembers the child's own strategies, from the evidence rows, and names them back on later days ("tum hamesha 2 se
  shuru karti ho"). She can use the child's name for a strategy if the child coined one.
- She notices process (strategy, a new way, persistence after a failed run), never person traits. Brain Points rewarded
  effort and strategy in Refraction and kept more low performers playing (about 15,000 children; O'Rourke et al. 2014).
  The same group later found that random brain points did nothing, and that growth-mindset animations made many children
  quit **[S]**. So Taxila uses her contingent spoken notice, never points and never mindset lectures.
- Knowledge states only (Microsoft Code of Conduct restriction 12):
  - the engine's process indicators (searching vs not-known, guessing, stuck-productive vs stuck-unproductive) are
    ComprehensionSignal nominations, as already decided;
  - no emotion is ever inferred or named.

---

## 6. Difficulty, adaptivity and challenge

1. **Between levels: L4.** The generator picks the level with the best discrimination × band-fit × novelty × fade score.
   Its inputs are the learner model's skill states and misconception posteriors.
2. **The door.** After each level the child chooses between two generator-chosen next levels: "garam" (in band) and
   "teekha" (harder, still valid). Both are pedagogically sound. In a 10,472-player experiment, moderately difficult
   levels were the most motivating **only when self-selected**, and when difficulty was assigned blind the easiest were
   most motivating (Lomas et al. 2017) **[S]**. The door gives autonomy without letting engagement set difficulty (G11).
3. **Within a level: DDA inside clamps.** Speed, tolerance and scaffold marks change (STUDIO-V2 QB-G5), and every change is
   logged as an `adapt` event.
4. **Feedforward.** "Yeh wala thoda mushkil hai — try karoge?" is allowed. Lomas 2013 proposed it **[T]**.
5. **Below grade level.** Every family grammar spans 2-3 grade levels downward in the same world. A class-6 child who
   needs c4 regrouping gets it in the same Todo-Jodo world, not a "baby" world (ASER 2024 **[S]**; Mindspark's
   at-the-child's-level adaptivity gave +0.37 SD maths and +0.23 SD Hindi in about 4.5 months, Muralidharan, Singh &
   Ganimian 2019 **[V abstract]**).
6. **Rapid guesses** never count (G13). Brute force is bounded three ways:
   - a committed prediction before a run (F6), or before a split on discriminating levels (F1);
   - move budgets from the solver's optimal plus a margin;
   - search-like act traces are logged as process indicators, not credit.

---

## 7. Feedback, juice and why the child plays again

- **Feedback is the law** (L2), in 100 ms, showing the truth: where the value lives, which leaf is unfinished, which
  condition differed.
- **Juice on the learning act only, at medium-high.** Squash and stretch on a split, a crack and ring when an atom cannot
  be split, a rising pitch per atom found, hit-stop ≤ 80 ms, shake ≤ 6 units. Juice goes on relevant objects only (warm
  colours, round shapes; Wong & Adesope 2021 **[T]**). No confetti, mascots, music under her voice or ambient animation.
  Medium and high juiciness beat none and extreme (Kao 2020) **[S]**. Schematic beats realistic (g 0.48 vs −0.01, Clark
  2016) **[T]**.
- **Why the child plays again** (no currency, ever: G4):
  1. **Consequence.** The thing the child built works: the molecule fuses back into 36, the trays sprout, the blood meter
     fills.
  2. **Another way.** An on-path secondary objective that is itself a learning act ("ab doosre pehle tukde se"). Off-path
     coins cut Refraction's median progress from 20 to 17 levels (Andersen et al. 2011) **[T]**.
  3. **A shorter way.** Comparison with the shortest known solution and with the child's own earlier one. Comparing
     solution methods improved accuracy and flexibility (Rittle-Johnson & Star 2007) **[S]**.
  4. **The door.**
  5. **Her notice.** The specific, contingent, spoken recognition of the child's move.
- **What persists across sessions.** Only the child's artefacts (their builds, shown to the parent) and capability
  statements (G5). The "atlas" of numbers decomposed is a view of knowledge. It has no completion percentage, no unlocks
  and no rewards. If the pilot finds compulsion markers (repeat play with no learning acts), it goes (§11).
- **NEVER MANIPULATE in play.**
  - No streaks, no FOMO ("aaj nahi khela toh…"), no loot or variable-ratio anything, no lives, no countdowns (G10), no
    leaderboard, no pay-to-win.
  - The stop check-in and the real goodbye work mid-level.

---

## 8. Three worked examples, turn by turn

Real NCERT topics with kit misconception ids. Utterances are illustrative register (see the note at the top). "μ" marks a
pre-synthesised micro-reaction. "Seam" marks a full Director turn.

### 8.1 Maths · c6-maths-ch05-t04 Prime factorisation · F1 Todo-Jodo "Number Atoms"

**Child:** Riya, class 6. Learner model: s1 (split with a factor tree) fair; s2 (product of primes) shaky;
`c6-maths-ch05-t04-m-stop-composite` P = 0.55 after yesterday's "72 = 8 × 9"; `-m-include-one` P = prior 0.15;
`-m-different-trees` unseen.

**World.** Full-screen workbench. A number is a glowing block.
- Drag a crack across a block and it splits into two blocks whose product is the parent, joined by a bond, so a factor
  tree grows as a molecule.
- Primes are crystal atoms. A crack across one rings and refuses.
- A "1 × n" split releases a "1" that evaporates, and the parent is unchanged.
- A strip under the molecule shows the live product of the leaves (the stage-2 linked symbol).
- Goal: every leaf an atom. Then the atoms fuse back into the parent (the multiply-back check).

| turn | screen and act | what the engine and the teacher do | evidence |
|---|---|---|---|
| 0 | The world opens on a tray of 36 laddoos (skin from her interest tags: "packing laddoos"). Stage 1, concrete. | Seam: one framing line (the goal is the world: "sab laddoo-atoms tak todo"). The question card is gone. Her face is a PiP. | — |
| 1 | Riya drags across the tray: 4 rows of 9. The tray splits into blocks **4** and **9**. | μ "4 aur 9!" (bank, written from this level's numbers). Strip: `4 × 9`. | split(36 → 4, 9) |
| 2 | She cracks 9 → 3, 3. Both ring as atoms. | Juice: two rising chimes. μ "teen — yeh toot-ta hi nahi". Strip: `4 × 3 × 3`. | split(9 → 3, 3) |
| 3 | She says "ho gaya" (spoken verb: declare done). The **4 keeps humming** with a faint crack line, and its strip entry stays grey. | Mal-rule signature confirmed (stop at a composite). Seam turn: a question, not a telling: "4 ko dekho — kya woh atom hai?". | declare_done with a composite leaf → **hit** on m-stop-composite (game LR, w = 0.5) |
| 4 | She cracks 4 → 2, 2. The strip completes: `2 × 2 × 3 × 3`. The atoms fly together and fuse into 36. | μ "wapas 36!" The multiply-back check is shown, not told. | goal met; verified |
| 5 | Door: "garam" 60 or "teekha" 72. The generator chose 72 because its natural first split (8 × 9) **discriminates** m-stop-composite (P now about 0.76: logit +½·ln 6.9 from 0.55). She picks 72. | She splits 8 × 9 → 3 × 3 → 8 → 2 × 4 … and this time cracks the 4 without a prompt. | discriminating correct → logit down |
| 6 | "Two benches" (L4, targeting the unseen m-different-trees). Bittu's bench splits 36 as 6 × 6; hers as 4 × 9. Before running: "kya dono ke atoms alag honge?" She predicts "haan, alag". | Both molecules finish. The strips slide together and match. μ "arre — same!" Seam: "kyun?" Her spoken why goes to classify / comprehension. | prediction (committed) = misconception hit on m-different-trees; the why is graded by the closed grader |
| 7 | Stage 3, notation as object. Only the strip: she drags `2 × 2 × 3 × 3` into groups to show 36 = 4 × 9 = 6 × 6. | Another-way objective: "360 ko kisi doosre pehle tukde se?". Her two trees are shown side by side (comparing methods). | acts on notation |
| 8 | Stage 4, bare: the kit item "Write 84 as a product of primes." spoken or typed, no world. | The only act that can count toward "secure". She notices strategy: "tum hamesha 2 se shuru karti ho — tez tarika". | non-game evidence (item c6-maths-ch05-t04-iNN) |
| next day | Delayed check in a new form (s3): "Does 6 divide 84? atoms se batao." | Scheduled by the existing delayed-check rule. | V1 "secure" needs this |

**Why this is not a quiz in costume.**
- Remove the game and she still performs the identical acts on identical numbers (G2 remove-the-game).
- No state changes without a split, a declaration or a prediction (G2 remove-the-learning).
- The misconception shows itself as a humming block, not a red cross.
- The level that came next was chosen because it could tell whether the misconception was gone.

### 8.2 Science · c6-science-ch10-t02 Conditions for germination · F6 Kyun-Lab "Ankur Lab"

**Child:** Kabir, class 6. Learner model: `c6-science-ch10-t02-m1` ("seeds need soil and sunlight") P = 0.40 from the
diagnostic; m2 ("more water is better") and m3 ("warmth doesn't matter") at prior.

**World.** A kitchen windowsill and a cupboard.
- Trays of moong seeds on cotton.
- Each tray has condition chips: water (dry / damp / submerged), air (open / sealed jar), place (fridge / shelf),
  light (cupboard / window), base (cotton / soil).
- A day dial runs time 0 → 7 days, and the trays animate from the deterministic model (from the kit expectations:
  germination needs water, air and suitable warmth; light and soil are not needed for germination; after germination,
  seedlings in the dark grow pale and long).
- A tally row counts sprouted seeds per tray (the F3 crossover).

| turn | screen and act | what the engine and the teacher do | evidence |
|---|---|---|---|
| 0 | Two trays: damp cotton in the window, damp cotton in the cupboard. | Seam: one framing question ("moong ko ugne ke liye kya chahiye?"). | — |
| 1 | **Commit a prediction:** Kabir taps the cupboard tray and says "andhere wala nahi ugega". A prediction tag pins to the tray in his own words. | The prediction is locked before time can run (L4: this level was chosen because it discriminates m1). | prediction = m1 hit, P(m1) up |
| 2 | He drags the day dial 0 → 3. Seeds crack open in **both** trays, with a tiny pop per seed and tallies ticking. | μ "andhere mein bhi!" (prediction-violated class). The world keeps animating. | — |
| 3 | — | Seam: "na mitti, na dhoop… phir kaise?" He says "paani se?". Classify: partial. She gives the stored-food idea (rung) in one clause. | why → partial |
| 4 | He drags on to day 7. The cupboard seedlings grow pale and long; the window ones grow green and short. | μ "dekho, kitne peele!" Seam: germination vs growth, the kit's s3 distinction. | — |
| 5 | **Design:** "ab tum dikhao: paani zaroori hai?" Kabir builds dry + window vs damp + cupboard. The fair-test meter lights **2 differences**. He runs anyway: dry 0, damp 10. | Seam (the control-of-variables moment, taught explicitly as in Klahr): "do cheezein badli — kis wajah se hua?" He fixes it to one difference and re-runs. | CVS act logged; skill s2 evidence |
| 6 | Door: "submerged challenge" (discriminates m2) or "fridge challenge" (m3). He picks submerged and predicts it sprouts fastest. | Run: submerged 2/10, damp 10/10. Bubbles show air. μ "itna paani…". Seam leads to air, then to the sealed-jar test. | m2 hit, then a discriminating correct on the jar test |
| 7 | **Galti Pakdo:** Golu's lab (the kit `error_spot` item: wet + warm vs dry + fridge, "water is needed"). He finds both conditions changed. | She notices: "tumne turant pakda". | error_spot verified |
| 8 | Bare far-transfer item (kit): "plan a fair test for warmth at home without a heater". Spoken. | Graded by the existing closed comprehension grader. | non-game evidence |
| home | The real-world bridge she offers: soak moong on two plates, one in the fridge, and report tomorrow. Only seeds and water; the parent sees it in the feed. | Next lesson's retrieval opens with his own result. | delayed retrieval |

### 8.3 Choice · c7-science-ch09-t01 Digestion in humans · F7 Karkhana "Andar ki Yatra"

Chosen to show that a **factual** topic, the usual home of labelling quizzes, becomes a system the child runs.

**Child:** Meher, class 7. Learner model: s1 (order of organs) unseen; `c7-science-ch09-t01-m2` ("all digestion happens
in the stomach") flagged in a previous chat turn, P = 0.35.

**World.** A tall, schematic, non-gory digestive line that fits a portrait phone; the camera follows the food.
- Food arrives as a bite of aloo paratha (skin: "school tiffin"), made of tokens: starch chains, protein chains, fat
  droplets, water, fibre.
- Stations transform tokens:
  - mouth: chew by tapping a rhythm; a saliva valve turns starch → some sugar;
  - food pipe: swipe down to drive the wave;
  - stomach: churn by circling; an acid + juice tap starts proteins; a mucus-layer slider;
  - small intestine: a bile duct from the liver emulsifies fat; a pancreatic duct and intestinal juice finish chains into
    units; villi absorb **single units only** into a blood meter;
  - large intestine: water absorption;
  - rectum.
- Goal per level: fill the body's energy meter with the right units and little waste, or diagnose a broken factory.

| turn | screen and act | what the engine and the teacher do | evidence |
|---|---|---|---|
| 0 | "Build the line": organ stations sit in a tray. | Seam: one line of framing. | — |
| 1 | Meher drops the stomach above the food pipe. Food cannot reach it; the line does not flow. | μ "kuch atka". She fixes the order. The line flows. | s1 order evidence (first committed order) |
| 2 | Run 1. She chews 3 taps and opens saliva. A few starch beads turn sweet. | μ "meetha!" Seam: the kit predict item, the real-world bridge ("roti ek minute chabao, kya meethi lagegi?"). | predict item |
| 3 | She pushes food down. Gravity toggle: the "astronaut" level, so food still moves, because the wave pushes it. | μ "ulta bhi chalta hai". | predict item (astronaut) |
| 4 | In the stomach she turns **mucus off** to see what happens. The wall shimmers a warning (schematic, no injury depicted). | Seam: why the stomach does not digest itself (m3). | exploration act |
| 5 | **Galti Pakdo, Bittu's factory:** the energy meter barely moves. She hunts and finds a pipe bypassing the small intestine. | Discriminates m2. She repairs it and the meter fills. The camera dives into the villi: finger-like, a huge surface. μ "yahin asli kaam!" | m2 discriminating correct |
| 6 | — | Seam: "dal seedha khoon mein kyun nahi ja sakti?" Her spoken why (chains too big; only units pass) is graded closed. | why item |
| 7 | **Diagnose the patient** (far-transfer item): "gall bladder removed; oily meal". She runs it. Fat droplets pass through unabsorbed. She names bile's role and its source (the liver, not the pancreas: the kit's contrast item). | — | far_transfer + contrast |
| 8 | Bare items, labels hidden: "after idli leaves the stomach, which part next?"; a delayed check the next day in a new form. | — | non-game evidence |

---

## 9. Why this is revolutionary, not points glued onto quizzes

| | points-on-quizzes (Prodigy-style quiz gates; most "gamified" apps) | Taxila mechanics |
|---|---|---|
| the child's input | an answer: a choice, a number, a string | **an operation on the idea** (L1) |
| feedback | tick / cross, then points | **the law runs**; the misconception's own consequence (L2) |
| content | an item bank, often random | **levels generated per child**, solver-proven solvable and shortcut-free (L3) |
| adaptivity | harder or easier items | **levels as experiments** on this child's live misconception states (L4) |
| guide | none, or canned hints | **a live teacher who sees the board**, reacts in ~250 ms, teaches at the seams, can play a move (L5) |
| mastery | in-game score | **only a bare item later counts** (L6) |
| motivation | currency, streaks, loot | competence (it works), autonomy (the door), relatedness (she noticed *your* move) |
| look | one template | eight worlds, each with its own visual grammar, and many skins |
| evidence about the product category | Prodigy: company-run, non-randomised, ESSA Tier 3 **[S]**; ads to children (Fairplay complaint) **[T]**. Khan Kids: one preliminary RCT, on pre-literacy **[S]**. Toca Boca: digital toys, no winning or losing, no outcome research found **[S]** | built to be measured against a no-game arm and a no-teacher arm from day one (§12) |

**The genuinely new part is the combination**: a solver-backed, shortcut-free level space; a mal-rule-driven experiment
selector; and a human-like voice teacher reacting inside the play loop in under a second, in Hinglish, on a ₹10k phone.
- Refraction had the solver and the progression but no teacher.
- DragonBox and FH2T have the notation-as-object but no live adult and no per-child diagnosis.
- Khanmigo-class tutors have the voice but no world.

**What it is not.** It is not proven. Every learning claim for the combination is a hypothesis until §12's pilot. The
pieces each have evidence; the whole does not yet.

---

## 10. How it is built and generated live on this stack

### 10.1 What exists and is reused [T]

- **Studio V2 core** (`src/studio-v2/core`):
  - a Canvas 2D stage with fit, DPR and adaptive resolution;
  - a guarded loop with last-good-frame restore (`studio-v2-frame-guard`);
  - tweens, FX, synth sound, the board twin and fuzz tools;
  - host grading of raw acts (`shared/studio-spec.ts`; claims never trusted).
- **Stagecraft:** the reveal policy, the beat hint, child-request intents and the quota scheduler.
- **The learner model:** BKT-R skill states, per-misconception logits, FSRS, delayed checks, game evidence at w = 0.5.
- **The duplex engine:** the floor manager and backchannel policy.
- **The Director turn path:** compile, classify, guards, rung rules.
- **Kits:** misconceptions with signs, diagnostics, items with `kind` (`predict`, `error_spot`, `contrast`, `teachback`,
  `far_transfer`) and verified keys.

### 10.2 The family engine contract (proposal; no code written)

```text
FamilyEngine<State, Act, Level> {
  family, version
  // truth (pure, deterministic, unit-tested like product code)
  init(level) -> State
  apply(state, act) -> { state, moments[] }            // the LAW
  goal(level, state) -> bool                           // closed predicate list
  // pedagogy model (used by the server-side generator; same module, no DOM)
  grammar: LevelGrammar                                // parametric level space per fade stage and grade span
  solve(level) -> Solution[]                           // complete within the grammar's bounds
  features(solution) -> ConceptFeature[]               // which concept atoms a solution uses
  shortcuts(level) -> Solution[]                       // goal-reaching solutions missing target features: must be []
  malrules: { [misconceptionId]: (level) -> PredictedActs }   // from kit misconceptions, reviewed
  // presentation (client)
  render(state, t); juice(moments); teacherAct(act)    // ghost-hand narrated move
  board(state) -> BoardSpec                            // rung-4 twin, same values
  facts(state) -> telegraphic rows                     // what is on screen, for her lines
  // seams
  moments: MomentClass[]                               // for the reaction bank
  bug(level, misconceptionId) -> State                 // Galti Pakdo mode
}
```

The truth and pedagogy halves are one erasable-TS module that both server and client import. That pattern is already
proven by `shared/studio-spec.ts` under Node 22 type stripping (`rs4-erasable-ts`). The production image copies `shared`
and `src` (`tests/runtime-image-imports.test.mjs`).

### 10.3 Live generation, per level (all in code except the words)

1. **Admission by skill, not by topic mention.** A family runs for a skill only if the skill is in its grammar's coverage
   map. Two incidents argue for this:
   - `rj-studio-fraction-mention-as-topic`: a pizza game in a litres lesson;
   - the review-walk `dukaan`: tagged to the topic, but it exercised the wrong skill.
2. **Candidate levels:** the grammar is enumerated for (skill, fade stage, grade span), about 10³-10⁴ candidates.
3. **Filter:** solvable, shortcut-free, features ⊇ target.
4. **Score:** discrimination over the child's misconception posteriors × band fit × novelty × fade.
5. **Pick two** for the door. Target budget **≤ 50 ms [U]**, measured in M-O2.
6. **Words:**
   - one `taxila-fast` call (effort none) writes the framing line and the reaction bank from `facts(level)` with the key
     withheld (the W9 analogue);
   - the skin pick (from the child's interest tags within the family's enums) reuses the Forge G1 flavour pick (1.88 s
     p50) **[T]**;
   - both run during the previous level, so nothing waits.
7. **Voice:** the guards run, then DragonHD pre-synthesises the first 3 clips of both doors, and the rest after the
   choice.
8. **Reveal:** Stagecraft treats an active family session as **one persistent world per lesson segment**. Levels change
   inside it. Mounting is not repeated per request, and "game khelna hai" becomes the next level of a warm engine, not a
   new piece.

**No model writes code, positions, counts, keys or physics.** This keeps `live-free-generation`,
`generated-media-carries-facts` and `forge-live-codegen-race` intact. New families and new grammar regions are built
offline (STUDIO-V2 T-forge), behind human review, and ranked by `studio_gap` demand.

### 10.4 The screen: world-first

During play, three layout changes apply:
- The world takes **≥ 65% of a 360 × 800 viewport** (e.g. 360 × 540 CSS px), not today's 328 × 290 tray.
- The teacher becomes a 72-96 px puppet PiP whose listening and noticing poses carry the waits.
- The question card leaves the screen: the goal is a world object plus her voice, with an optional one-line caption strip.

Targets are ≥ 44 px and labels ≥ 12 CSS px. Every family is designed portrait-first at that size, which is how Monument
Valley-style "everything within one screen" is reached on a phone **[S]**.

This is a layout change with owners outside this stream. It is listed here because the mechanics depend on it: the
precision of a split, a dial or a ghost-hand demonstration fails at 0.37 scale **[T]**.

### 10.5 Evidence pipeline (no second statistical engine)

- Engine acts go to `Studio.answer` rows: raw act, host grade, item or level id, the mal-rule matched (if any), and
  latency.
- The existing KT path takes these with `via = 'game'` at w = 0.5, first committed act per item only.
- Process indicators (systematic, search-like, under-par, insight) are ComprehensionSignal nominations.
- An act pattern that no mal-rule explains is logged as an **unknown pattern** for offline clustering, never forced into
  a known misconception. Save Patch found 19% of errors were an exploit pattern **[T: `forge-dumb-policy-gate`]**.

### 10.6 Build plan and honest cost [U]

| step | content | gate |
|---|---|---|
| 1 | F1 Todo-Jodo and F6 Kyun-Lab first: the largest maths and science shares (86 topics) and the two §8 examples | M-O1…O5, M-S1, owner test |
| 2 | Spot and Fix mode in both; the reaction bank + floor rules; the world-first layout | M-T1…T4 |
| 3 | F4, F8, F7, then F3, F2, F5 | per family: M-O gates, craft rating |
| 4 | Pilot (§12) on F1 + F6 before scaling claims | M-P1, M-P2 |

**Effort.** Per family: engine + solver + grammar + mal-rules + art + QA is estimated at **3-6 agent-weeks plus human
review**. Unmeasured. Studio V2's three exemplars are the nearest data point, and they did not include solvers or
grammars. The estimate is replaced by measured engineer-days after F1.

---

## 11. Risks

| # | risk | what would show it is real | mitigation |
|---|---|---|---|
| R1 | Engagement without learning (DragonBox, Battleship Numberline) | in-game success rises, bare delayed items do not | L6 (only bare items buy mastery); w = 0.5; the pilot's primary outcome is delayed bare items |
| R2 | Brute force: wiggling until it balances | high solve rate with search-like traces, low prediction accuracy | committed predictions, move budgets, shortcut-free levels, search indicators never credited |
| R3 | Teacher reactions become tics or leak verdicts or keys | repeated text across lessons; `revealsAnswer` hits | per-level banks from level facts; repetition guard (no identical line within 3 lessons); key withheld from the bank call; guards before synthesis |
| R4 | F7 systems is the weakest-evidenced family | the pilot shows no gain on F7 topics vs board teaching | ship F7 behind the pilot readout; it falls back to F5/F6 forms for those topics |
| R5 | Build cost and scope: eight deep engines are a lot | F1 takes far longer than estimated | build in order of topic share; measure engineer-days per topic after F1; reverse L7 if a family costs as much per topic as a fresh archetype |
| R6 | Low-end phones and screen size | real-device fps < 50, or targets < 44 px | adaptive resolution (exists), static layers (exists), portrait-first design, real-device trace gate |
| R7 | Hinglish child speech misrecognised as verbs | wrong splits from voice | a closed verb grammar; the world echoes at once; free undo; voice only for discrete acts |
| R8 | Failure states cause anxiety | quitting after failed runs; spoken distress | no lives, no game over, informative consequences; the distress read on every committed turn is unchanged; the stop check-in mid-level |
| R9 | Novelty wears off | voluntary replay falls over weeks | Clark: multiple sessions 0.44 vs single 0.08 [T]; pilot over ≥ 3 weeks; moderate novelty in the generator |
| R10 | Mal-rules miss real misconceptions | many unknown patterns | unknown-pattern logging and offline clustering; new mal-rules through review |
| R11 | Compulsion from the atlas view | repeat play with no new learning acts | the atlas has no percentage, unlocks or rewards; remove it if compulsion markers appear |
| R12 | Gamifying sensitive topics | — | the 26 non-game topics, adolescence permanently out |

---

## 12. How to measure that it works

**Honesty rule.** Every number is labelled real-child, adult, simulated or offline. Nothing here is "100%" until the
child pilot reads out.

### 12.1 Offline gates (no children; per family, before any child sees it)

| id | metric | bar |
|---|---|---|
| M-O1 | solver correctness (property tests vs brute force on small grammars) | 100% |
| M-O2 | generator latency (enumerate + filter + score + pick two) | ≤ 50 ms p95 on the server |
| M-O3 | shortcut-free rate of served levels | 100% |
| M-O4 | zero visible failure (fuzzed levels, injected faults, 200 simulated lessons) | 0 visible failures (frame guard + board twin) |
| M-O5 | 60 fps target on the reference ₹10k phone (real-device rAF trace); legibility on 360 × 800 | p50 ≥ 55 fps and no stutter below 45; stage ≥ 65% of viewport; labels ≥ 12 px; targets ≥ 44 px |
| M-I1 | integration: share of graded acts that are manipulations; remove-the-game and remove-the-learning lints | ≥ 80%; both lints pass |

### 12.2 Simulation (synthetic learners; labelled simulated)

**M-S1 · levels as experiments.**
- Population: simulated children, each holding 0-2 kit mal-rules with slip and guess noise.
- Arms: information-gain selection vs random-valid selection vs kit order.
- Outcome: levels needed until the posterior classifies the mal-rule correctly (≥ 0.9).
- **Bar:** ≤ 50% of random's level count. This tests L4, not learning. The bar is from Rafferty et al.'s halving
  **[S]**, pre-registered.

### 12.3 Adult and owner (labelled adult)

- **M-A1 craft.** Blind side-by-side ratings of 60-second clips (owner + 2 raters):
  - family pieces vs reference games (DragonBox, Slice Fractions, Monument Valley, Euclidea);
  - family pieces vs today's Studio pieces.
  - Bar: family pieces ≥ 4/5 and preferred over today's pieces in ≥ 80% of pairs.
- **M-T1…T4 teacher in play** (logs):
  - T1: event → audio for micro-reactions, p50 ≤ 250 ms and p90 ≤ 400 ms;
  - T2: talk-over-child = 0;
  - T3: every reaction refers to on-screen state (facts row) = 100%;
  - T4: answer leaks in bank lines = 0, and no identical reaction text within 3 lessons.

### 12.4 Child pilot (the consented panel; labelled real-child)

- **M-P1 · does the family beat today's lesson?**
  - Design: a within-child crossover by topic. Matched topics are counterbalanced between a family session and today's
    lesson (board + practice), with equal time.
  - Primary outcome: accuracy on **bare items in a new form, ≥ 2 days later** (V1 bar 3), with ≥ 6 items per topic.
- **M-P2 · is the live teacher the active ingredient?**
  - Design: the same family, with and without her micro-reactions, seam turns and in-world moves, on matched topics.
  - Outcome: the same as M-P1.
  - This is the experiment that decides whether L5 is the moat or a cost.
- **Power.**
  - Two primary contrasts at α = 0.025 each (Bonferroni), 80% power, d_z = 0.3:
    n = ((2.24 + 0.84) / 0.3)² ≈ **105 completers**, about 130 enrolled at 20% attrition.
  - Three arms per child across 3 topic pairs, in a Latin square.
  - Results are broken out by baseline tercile (`rj-interleave-judged-short-term`).
- **Secondary measures (constraints, never tuning targets: G11, NM-8):**
  - voluntary "again" (Fun Toolkit again-again);
  - quit rate after failed runs;
  - delayed-check accuracy on skills marked "secure" (V1 bar 6: ≥ 85%);
  - in-game → bare-item correlation (whether to raise w per G-M2).
- **M-P3 · productive failure A/B (class 6-7 only).** Attempt-first vs teacher-first on matched topics. It keeps or drops
  §3's class placement.
- **Pre-registration.** Arms, outcomes, analysis and stopping rules are written before the first child session, and
  nothing is tuned on the pilot's held-out topics (`rj-w2ifix-tuning-on-heldout`).

---

## 13. Proposed context entries (also in `context/inbox/r3-game-mechanics.json`; not merged)

**Measurements**
- `ms-r3g-review-walk-stage-audit-2026-10-09`: the §1 audit (n = 73 frames, local production build of the round-2 tree,
  2026-10-07 captures, one rater).
- `ms-r3g-family-coverage-2026-10-09`: 224 / 250 class 4-7 maths and EVS/science topics have a primary family; 26 are
  conversation topics (rules + 21 overrides, one rater).

**Decisions, each with its reversal condition**
- `r3g-idea-is-the-controller` (L1). Reverse if the pilot shows no delayed-transfer difference between manipulation and
  answer-entry versions of the same family (CI excludes d ≥ 0.15).
- `r3g-eight-deep-families` (L7). Reverse if, after F1, the engineer-days per topic in a family are ≥ a fresh archetype's,
  or blind craft ratings do not beat today's pieces.
- `r3g-levels-as-experiments` (L3 + L4). Reverse if M-S1 needs ≥ 80% of random's levels, or the pilot shows no faster
  misconception resolution.
- `r3g-teacher-plays-alongside` (L5, §5). Reverse if M-P2 shows no benefit of the teacher channels (CI excludes
  d ≥ 0.15). Then the voice budget moves to seams only.
- `r3g-world-first-screen` (§10.4). Reverse if goal comprehension (the intended first act on the first try) drops below
  the card layout in usability tests (n ≥ 10 children per band).
- `r3g-voice-verbs-discrete-only` (§5.3). Reverse if streaming or on-device keyword spotting reaches ≤ 300 ms at ≥ 95%
  precision on child Hinglish game verbs.
- `r3g-pf-by-class` (§3). Reverse if M-P3 shows class 4-5 benefit from attempt-first (CI > 0).
- `r3g-door-choice` (§6). Reverse if children pick "garam" > 80% of the time and learn slower than an assigned-difficulty
  arm.
- `r3g-admission-by-skill` (§10.3). A family runs for a skill only if that skill is in its grammar's coverage map, never by
  topic tag or keyword mention. Reverse if, after F1-F8 ship, ≥ 20% of class 4-7 maths and science skills still have no
  family level, and a topic-level fallback shows 0 off-skill pieces over 50 scripted lessons.

**Rejections**
- `rj-r3g-piece-beside-the-quiz`: the Studio piece as a card beside the question card. It stays glance-sized (8-38% of the
  screen), and the learning act stays the typed or spoken answer; 0 / 15 visuals in the walks were playable. Replaced by
  the world-first, persistent world.
- `rj-r3g-model-turn-per-play-event`: a Director turn per game event (rejected by measurement: the Director stage alone is
  1562 / 2328 ms; reactions would land after the next act). Replaced by the per-level reaction bank.
- `rj-r3g-topic-tag-admission`: admitting a game by topic tag. `dukaan@1` was tagged c4-maths-ch07-t01 but exercised a
  different skill from the one being taught. Replaced by admission by skill coverage in the family grammar.

---

## 14. Sources (what each measured)

| source | what it measured | tag |
|---|---|---|
| Smith, Butler & Popović 2013, "Quantifying over Play: Constraining Undesirable Solutions in Puzzle Design" (Center for Game Science, UW) | Refraction 2 puzzle generation with extended answer set programming. Generating solvable puzzles with no undesirable (shortcut) solutions is NP^NP-complete. A "qualitative leap" in reliably generated puzzles | [V] grail.cs.washington.edu/wp-content/uploads/2015/08/smith2013qop.pdf |
| Butler, Andersen, Smith, Gulwani & Popović, CHI 2015 | Automatic progression from solution features. In Refraction, 2,377 players: comparable to the expert progression on a key engagement metric after design iterations | [V abstract] microsoft.com/en-us/research/?p=334439 |
| O'Rourke, Haimovitz, Ballweber, Dweck & Popović 2014; L@S 2016 follow-up | ~15,000 children: brain points (effort/strategy) kept more low performers playing Refraction and raised time, strategy use and perseverance. 2016 (25,000): random points ineffective; mindset animations made many quit | [S] grail.cs.washington.edu orourke2014bpa |
| Andersen et al., CHI 2012, tutorials | 45,000+ players, three games: tutorials raised play time up to 29% only in the most complex game | [V abstract] grail.cs.washington.edu/projects/game-abtesting/chi2012 |
| Andersen et al. 2011 (Refraction, Hello Worlds) | Off-path coins cut median progress 20 → 17 and 7 → 4 levels | [T: game-mechanics.md, V there] |
| Rafferty, Zaharia & Griffiths 2014, Proc R Soc A 470:20130828 | Optimal experiment design applied to game design (MDP models of play). The best games needed about half the players for equal precision | [S] PMC4032552 |
| Harpstead, MacLellan, Aleven & Myers, CHI 2014 | Checks game responses to principle-following vs principle-violating student solutions (RumbleBlocks); alignment-driven redesign | [S] tail.cc.gatech.edu |
| Clark, Tanner-Smith & Killingsworth 2016, RER | Games g = 0.33. Teacher-provided scaffolding 0.58 vs success/fail 0.26. Schematic 0.48 vs realistic −0.01. Single non-competitive 0.45 vs competitive −0.06. Multiple sessions 0.44 vs single 0.08 | [T: game-mechanics.md, V full text there] |
| D'Angelo et al. 2014, SRI, Simulations for STEM Learning | K-12: simulation vs none g+ = 0.62 (k = 46, N = 2,947). Simulation + enhancement vs plain simulation g+ = 0.49 (k = 50, N = 3,342). Inquiry skills 0.26 ns (k = 6) | [V executive summary] sri.com |
| Decker-Woodrow et al. 2023, AERA Open | 3,600+ grade-7 students randomised to 4 conditions, nine 30-minute sessions. From Here to There and DragonBox 12+ beat the active control; immediate-feedback problem sets did not (analytic N = 1,850) | [S] doaj 28d05a10… |
| Long & Aleven 2014 (ITS); CMU coverage | DragonBox vs a CMU algebra tutor, grades 7-8: DragonBox did not improve standard equation solving; "too much scaffolding", players never write equations | [T: in-game-success-as-mastery] [S] |
| Siew, Geofrey & Lee 2016 | DragonBox 12+, grade 8, quasi-experimental n = 30 + 30: higher algebraic thinking and attitudes | [S] |
| Riconscente 2013, Games and Culture 8(4) | Motion Math, 122 grade-5 pupils, class-level crossover, 5 days × 20 min: +15% fractions test, +10% self-efficacy. Commissioned by the Cooney Center | [S] |
| Cyr et al. 2015 (Slice Fractions) | Grade 3: learned as much as conventional teaching (TIMSS items) | [S] library.iated.org |
| Pope & Mangram 2015, IJSG (Wuzzit Trouble) | Grade 3, n = 59, 120 min over 4 weeks: number sense rose vs comparison (quasi-experimental) | [S] |
| Habgood & Ainsworth 2011 | Intrinsic (Zombie Division) vs extrinsic: more learning, 7× voluntary play | [T, V there] |
| Uttal et al. 2013, Psych Bull | 217 studies: spatial training g = 0.47 (SE 0.04), durable, transfers to untrained spatial tasks | [V abstract] PubMed 22663761 |
| Carbonneau, Marley & Selig 2013, J Ed Psych | 55 studies, N = 7,237: small-to-moderate effects for manipulatives vs abstract-only; moderate-large on retention; moderated by guidance and age | [S] |
| Fyfe, McNeil, Son & Goldstone 2014, EPR; Fyfe, McNeil & Borjas 2015 | Concreteness fading review; concrete-only worst on transfer | [S] |
| Chen & Klahr 1999, Child Dev | N = 87, ages 7-10: explicit CVS training + probes → learned and transferred | [V abstract] cmu.edu chen-klahr.pdf |
| Klahr & Nigam 2004, Psych Sci | N = 112, grades 3-4: direct instruction 40 → 80% CVS, discovery no significant gain; classroom 30 → 96% | [S] |
| Brod 2021, Psychon Bull Rev | Predicting as a learning strategy: mechanisms include surprise after a wrong prediction; predicting differs from guessing by confidence | [V abstract] PMC8642250 |
| Sinha & Kapur 2021, RER | 53 studies, 166 comparisons: PS-I g = 0.36; high fidelity 0.37-0.58; grades 2-5 trend favours instruction first | [V abstract] |
| Scherer, Siddiq & Sánchez Viveros 2019, J Ed Psych | 105 studies, 539 ES: programming transfer g = 0.49 (near 0.75, far 0.47); maths among the beneficiaries | [S] |
| Clements & Battista 1989, 1990 (JRME) | Logo and geometric concepts and angle | [M] |
| Simmons & Cope 1990, ESM | Unstructured Logo with minimal teacher intervention → fragile angle knowledge | [S abstract] |
| Rittle-Johnson & Star 2007, J Ed Psych | 70 grade-7 students: comparing solution methods → more accurate and flexible equation solving; a 2018 classroom scale-up was weaker | [S] |
| McLaren, Adams, Mayer & Forlizzi 2017 (Decimal Point); McLaren 2015 (erroneous examples) | Decimal Point vs conventional software, n = 153: d = 0.43 immediate, 0.37 delayed, enjoyment higher. Erroneous examples, n = 390: delayed d = 0.33, liked less | [T: game-mechanics.md] |
| Chase, Chin, Oppezzo & Schwartz 2009, JSET | Teachable agents: more effort for the agent, largest for lower achievers; 2017 replication: no test-score link | [S] |
| Kao 2020, Entertainment Computing 34 | Four juiciness levels: medium and high beat none and extreme | [S]; n = 3,018 [T] |
| Lomas et al. 2013 (CHI) | 10K + 70K players: easier = more play, slowest learning | [T] |
| Lomas et al. 2017 (CHI), "Is Difficulty Overrated?" | Choice n = 10,472: moderate difficulty most motivating only when self-selected. Novelty n = 5,065: moderate optimal. Suspense n = 6,511: beneficial | [S abstract] |
| Koedinger, Kim, Jia & Bier 2015 (L@S) | Doer effect: doing ≈ 6× watching or reading in a MOOC; correlational, with later causal analyses | [S] |
| Settles & Meeder 2016 (ACL); Duolingo blog | Half-life regression: 45%+ error reduction; company A/B +12% activity | [S] |
| Muralidharan, Singh & Ganimian 2019, AER | Mindspark (Delhi): +0.37 SD maths, +0.23 SD Hindi in about 4.5 months | [V abstract] aeaweb.org |
| ASER 2024 (rural all-India) | Std III subtraction 33.7%; Std V division 30.7% | [S] ASER deck / PIB |
| Banerjee et al. 2025, Nature | Market vs school maths fail to transfer in either direction (1,436 working + 471 school children) | [T, V there] |
| Supergiant (Kasavin), Bastion writing | About 3,000 narration lines reacting to player actions; no repeats unless the player repeats | [S] supergiantgames.com/blog/in-depth-writing-bastion |
| Ken Wong, GDC Europe 2014, "Designing Monument Valley: Less Game, More Experience" | Every screen a piece of art; puzzles traded for an aesthetic journey; everything needed within one screen | [S] gdcvault |
| Euclidea FAQ | L and E move counts as elegance targets; mastered constructions become tools | [S] euclidea.xyz/faq |
| Zachtronics (descriptions, Game Maker's Toolkit) | Open-ended solutions; per-metric histograms after a solve | [S] |
| Toca Boca (design sources) | Digital toys: no winning or losing, no high scores; no outcome research found | [S] |
| Prodigy efficacy white papers | Company-run, non-randomised, usage-selected; ESSA Tier 3 | [S] prodigygame.com/research |
| Khan Academy Kids (UMass, Arnold) | One preliminary RCT, pre-literacy, low-income 4-5-year-olds | [S] |
| LLM tutor inside a children's game, randomised | None found (search 2026-10-09) | [V, negative search] |
| Brown & Burton 1978; VanLehn 1990 | Diagnosing procedural bugs with mal-rules | [M] |
| Taxila internal | Tray size; catalogue legibility; turn latency; TTS first byte; MAI partials; misconception logit model; game weight w = 0.5; engine sizes | [T] / [R] as cited inline |

---

## Appendix A · Primary family per topic (method in §4.10; "4m" = c4-maths, "6s" = c6-science, "5e" = c5-evs)

- **F1 Todo-Jodo (49):** 4m-ch04-t01 t03, ch05-t01 t02, ch06-t02, ch07-t01 t02, ch09-t01 t02, ch10-t01, ch13-t01 ·
  5m-ch01-t01 t02, ch02-t01 t03, ch04-t01 t02, ch05-t01 t02, ch06-t01, ch11-t01 t03, ch13-t01 t02 · 6m-ch03-t04,
  ch05-t01 t02 t03 t04, ch07-t01 t02 t03 t05, ch10-t01 t02 t03 · 7m-ch01-t01 t02, ch03-t01 t02 t03 t04, ch08-t01 t03,
  ch10-t01, ch11-t01 t02 t03, ch12-t01
- **F2 Taraazu (15):** 4m-ch04-t02, ch08-t01 t02 · 5m-ch02-t02, ch08-t01 t02 · 6m-ch07-t04 · 7m-ch02-t01, ch04-t01 t02,
  ch13-t02, ch15-t01 t02 t03 · 6s-ch03-t03
- **F3 Nishana (16):** 4m-ch06-t01, ch10-t02, ch14-t01 t02 · 5m-ch12-t01 t02, ch15-t01 t02 · 6m-ch04-t01 t02 t03 ·
  7m-ch13-t01 t03 · 6s-ch03-t04, ch05-t01 t02
- **F4 Chalao (44):** 4m-ch02-t02, ch03-t02, ch12-t01 t02, ch13-t02 · 5m-ch03-t01 t02, ch06-t02, ch07-t02, ch09-t01 t02,
  ch11-t02, ch14-t01 t02 · 6m-ch01-t01 t02 t03, ch02-t01 t02 t03 t04, ch03-t03, ch06-t01 t02 t03, ch08-t01 t02 t03 ·
  7m-ch01-t03, ch02-t02, ch04-t03, ch05-t01 t03, ch06-t02 t03 t04, ch07-t01 t02 t03, ch08-t02, ch09-t03, ch10-t02,
  ch12-t02, ch14-t01
- **F5 Niyam (15):** 4m-ch03-t01 · 5m-ch07-t01 · 6m-ch03-t01 t02, ch05-t05 · 7m-ch06-t01 · 4e-ch03-t01, ch04-t02, ch08-t02 ·
  6s-ch02-t01 t02 t03, ch03-t01, ch10-t01, ch11-t02
- **F6 Kyun-Lab (37):** 4e-ch07-t01 t02 · 5e-ch03-t01 t02, ch07-t01 t02 · 6s-ch01-t02, ch03-t02, ch04-t01 t02 t03,
  ch05-t03, ch06-t01 t02, ch07-t01 t02, ch08-t01 t02 t03, ch10-t02 · 7s-ch02-t01 t02, ch03-t01 t02 t03, ch04-t01 t02 t03,
  ch05-t01 t02 t03, ch08-t01 t02 t03, ch10-t01 t02, ch11-t01
- **F7 Karkhana (20):** 4e-ch03-t02, ch06-t02, ch08-t01 · 5e-ch01-t01 t02, ch02-t01 t02, ch08-t01 · 6s-ch09-t01 t02,
  ch10-t03, ch11-t01 · 7s-ch07-t01 t02 t03 t04, ch09-t01 t02 t03, ch10-t03
- **F8 Nazariya (28):** 4m-ch01-t01 t02 t03, ch02-t01, ch11-t01 t02 · 5m-ch10-t01 t02 · 6m-ch01-t04, ch09-t01 t02 ·
  7m-ch05-t02, ch09-t01 t02, ch14-t02 · 4e-ch10-t01 t02 · 5e-ch09-t01 t02 · 6s-ch12-t01 t02 t03 · 7s-ch11-t02 t03 t04,
  ch12-t01 t02 t03
- **Conversation by default (26):** 4e-ch01-t01 t02, ch02-t01 t02, ch04-t01, ch05-t01 t02, ch06-t01, ch09-t01 t02 ·
  5e-ch04-t01 t02, ch05-t01 t02, ch06-t01 t02, ch08-t02, ch10-t01 t02 · 6s-ch01-t01, ch02-t04 · 7s-ch01-t01 t02,
  ch06-t01 t02 t03

## Appendix B · Reproducing the measurements

- **Stage audit:**
  1. `python3 -I <scratch>/r3-game-mechanics/tools/stage_area.py docs/design/round2/review-shots` gives the per-frame
     stage fraction.
  2. Keep blocks that start at or below y = 420, are ≥ 60 rows tall and end above y = 1400. That leaves 15 frames.
  3. Classify the contact sheet of the 15 crops by eye.
- **Coverage:** `node <scratch>/tools/coverage.mjs <repo>` writes the rule output. Then `node <scratch>/tools/finalize.mjs
  coverage.txt` applies the 21 overrides listed in the script.
- Both tools sit in this stream's scratchpad (`r3-game-mechanics/`). They are regenerable and are not product code.
