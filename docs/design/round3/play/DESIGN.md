# Round 3 · play · DESIGN: Khel — the idea is the controller, the teacher plays alongside, the world is what you understand

**Stream:** play · **Date:** 2026-10-09 · **Inputs:** `docs/design/round3/game/concepts/{mechanics,world,live-tech}.md`,
`RESEARCH.md` (this folder), `context/rejected.md` (read first), `docs/design/reset/{VALUES-100,DESIGN-V3,STUDIO-V2}.md`,
`docs/research/content/game-mechanics.md` (G1-G14). **Contract:** `GRAMMAR.md` and `shared/play.ts`. **What was built and
measured:** `RESULTS.md` (every number with n, method and where); the hot-file patches: `APPLY.md`.

The child-safety floor and NEVER MANIPULATE sit above everything in this document. Teacher lines quoted below are
illustrations of register for human readers; they are never pasted into a prompt.

---

## 0. The design on one page

1. **What changes.** Today a lesson is a quiz with a postage stamp beside it: a dark 16:10 engine scaled into whatever box the
   cards leave (181 × 113 px on a phone), in one dark style, often bound to the wrong skill. Khel replaces the stamp with a
   **play mode in which the game owns the screen** and the child's input is an operation on the idea itself.
2. **Seven laws** (from the mechanics concept, kept nearly verbatim because they are right):
   L1 the idea is the controller · L2 the law runs, not a judge · L3 shortcut-free levels (a solver proves it) · L4 levels are
   experiments that tell the child's live misconceptions apart · L5 the teacher plays alongside · L6 fade to the symbol, and
   only a bare item outside the game buys "secure" · L7 a few deep families, not many thin engines.
3. **Grafted from live-tech:** a complete level is built by code in milliseconds with no model; play mode owns the phone
   screen; layout is solved at the device's real box with legibility as a hard constraint (text ≥ 14 px, targets ≥ 44 px);
   art directions through one style interface; child-facing words from an authored bank checked in code; the teacher speaks
   only at play turn-points, never mid-drag.
4. **Grafted from world:** the progression layer is a pure view of the learner ledger, drawn as **pencil** (got it today) and
   **ink** (secure: right again on a later day, in a new form, without help); routes between stations are only real
   prerequisite edges; nothing decays with time; there are no points, coins, XP, counters, unlocks, streaks or clocks; wrong
   ideas always arrive labelled (an apprentice's work, never the teacher's own belief).
5. **Four flagship families** (each a deep engine with its own law, solver, mal-rules, fade, board twin and Spot-the-slip mode):
   - **Todo-Jodo** (split and merge): number atoms (primes, factorisation, HCF/LCM), fraction strips (equal parts,
     equivalence, comparison, adding), place-value bundles (regrouping, borrowing).
   - **Taraazu** (balance): equality and equations as a two-pan scale with mystery bags.
   - **Nishana** (land it on the line): whole numbers, fractions, decimals, integers and measures on a number line; place,
     compare, and round (which landmark is nearer).
   - **Kyun-Lab** (fair test): twelve science labs whose outcomes are computed by reviewed causal models (germination,
     evaporation, pendulum, rusting, dissolving, shadows, absorbing heat, floating and sinking, keeping ice, magnets,
     conductors in a circuit, mould on bread, starch in a leaf), each with its own drawn apparatus.
6. **Four art directions** through one style interface, chosen per topic and per child: **Kagaz** (paper-cut, warm cream
   ground, matches the shipped Desk), **Chalk** (slate board, chalk strokes), **Blueprint** (deep blue drafting sheet),
   **Raat** (the night-lab instrument look, refined).
7. **The in-lesson loop:** the Director admits play by *skill* (never by topic mention); the Desk switches to play mode; the
   engine emits moments; the server answers with a micro-reaction chosen from an authored bank and filled with on-screen facts
   (guarded: no verdict words, no key, never-rules); full teacher turns happen at seams (level end, impasse, a committed
   prediction, the child speaking) through the existing Director with a telegraphic play facts row; then a bare kit item.
8. **Truth:** the server holds the level, replays the child's raw acts through the same pure law, and grades; the frame's
   claim is never an input; a model never grades and never writes a key. In-game evidence enters the learner model at the
   game weight; only the bare item outside the game can make a skill secure.
9. **Honest status:** engineering only. Nothing here has met a child. The pilot design (§11) decides whether the teacher
   inside the play is the moat or a cost.

---

## 1. Synthesis: what was taken, grafted and rejected

| idea | from | verdict | why |
|---|---|---|---|
| The idea is the controller; the law runs; misconception-specific consequences | mechanics L1, L2 | **spine** | directly answers "cheap" and "nonsense"; Habgood 7×; Clark answer-display 0.40 vs 0.26 |
| Solver-proven, shortcut-free levels; levels as experiments | mechanics L3, L4 | **spine** | the copy-task defects (`rj-array-dims-binding`, `rj-engine-prompt-shows-target`) are shortcut levels; Rafferty halving |
| Fade to the symbol; only the bare item buys mastery | mechanics L6 | **spine** | DragonBox no paper transfer; Nuraydin narrow transfer |
| Deep families over thin engines | mechanics L7 | **spine, scoped to 4 families now** | eight deep families in one round would be eight thin ones |
| Teacher plays alongside: micro-reactions, seam turns, ghost moves | mechanics L5 | **spine** | Clark teacher scaffolding 0.58; no product has it |
| Code-first complete level; model optional | live-tech §3.2 | **grafted** | measured: full model specs 3.4-9.7 s; on a 429 the child must still get the game |
| Play mode owns the screen; layout solved at the real box | live-tech §3.6, §4.3 | **grafted** | the 181 × 113 px box is the "not viewed properly" defect |
| Art directions through one style interface | live-tech §3.5 | **grafted (4 directions)** | "particular style only" |
| Child-facing words from an authored bank, checked in code | live-tech §2.7 | **grafted** | free model strings broke limits 13/24 |
| Play turn-points; never speak mid-drag | live-tech §3.3 | **grafted** | DESIGN-V3 "she reacts at turn boundaries" |
| World = a view of the ledger; pencil and ink; no clock | world §2.3 | **grafted** | the only world that cannot be farmed, bought or rushed |
| Routes only on real prerequisite edges | world G-W11 | **grafted, enforced by test** | world caught two invented edges in its own first draft |
| Honest co-player; labelled wrong ideas; residents never speak | world §2.6, §2.7 | **grafted** | "no lying"; Radesky parasocial pressure |
| The two doors (in band / harder) | mechanics §6 | **grafted** | Lomas 2017: difficulty motivates when self-selected |
| Teacher's planted slip as her own belief | live-tech §3.3 | **rejected** | a pretend false belief is a lie; a labelled apprentice does the same pedagogical job |
| A model call per level to write the reaction bank | mechanics §5.1 | **rejected** | measured unreliable wording (live-tech); replaced by authored shapes filled with facts |
| 14 representations × 10 forms combinatorics | live-tech §3.1 | **rejected for now** | combinatorial breadth makes thin pairs; the grammar stays open for it later |
| Named real places with factual claims (Ennore, Vadgaon) | world §3 | **deferred** | needs sourced facts and a cultural review; world itself found a 4.5 °C false number; contexts here are fictional skins with no factual claims |
| Countdowns, drift, patience meters | studio-v2 engines | **rejected** | G10; Radesky "fabricated time pressure"; all play is untimed |
| Folk-art packs | live-tech §3.5 | **not built** | only by paid commission from artists of those communities |
| Child-built puzzles, family tours, peers | live-tech §3.4, world §2.9 | **open, not this round** | worth doing; each needs its own safety design |
| Voice as a game verb | mechanics §5.3, live-tech §3.3 | **built as a code grammar, discrete acts only** | STT partials 1.4-2.6 s make speech unfit for continuous control |

---

## 2. The play loop inside a lesson

```
Director beat (practice / contrast / explore)                         seam turn = a normal Director turn
  │  admit by SKILL: playFor(skillId) → family, mode, grammar             ▲            ▲
  ▼                                                                       │            │
play slot on the turn ──► Desk enters PLAY MODE ──► level 1 (code, <50 ms) ──► acts ──► moments ──► micro-reaction
                               (game owns the screen)        │                            (bank line, ≤ 1 per 4 s,
                                                             ▼                             never mid-drag)
                                         level end → server replays acts → grade → evidence (game weight)
                                                             │
                                          the two doors: "garam" (in band) / "teekha" (harder)
                                                             │
                                         fade 1 → 2 → 3 inside the game; then OUT of play mode
                                                             ▼
                                   the bare kit item (typed or spoken) — the only act that can buy "secure"
                                                             ▼
                                   a later day: the delayed check in a new form → pencil turns to ink
```

**Beat order inside one play segment** (graft of world §2.5 onto mechanics §3):
1. *Frame* (one spoken sentence at most; the goal is a world object, not a question card).
2. *Predict* where the family has a run step (Kyun-Lab always, Todo-Jodo two-benches, Nishana compare): committed before run.
3. *Act* in the world: untimed, no lose state, free undo.
4. *The law responds* in ≤ 100 ms (in the client, from the same pure logic the server grades with).
5. *Name it* (fade 2: the symbol is live beside the world; fade 3: the symbol is the controller).
6. *Spot the slip*: the apprentice's labelled mistake, only on a skill the child already has at "got it" (world G-W12).
7. *Why*: one spoken "kaise pata?" at a seam (graded by the existing closed comprehension grader, never by the game).
8. *Out*: the bare item from the kit.

**Class placement of first contact** (Sinha & Kapur): class 4-5 → the teacher's ghost hand makes the first legal move in the
world while she says the clause, then the child continues; class 6-7 → attempt first when the prerequisite skills are at
"got it" or better, consolidation after.

---

## 3. The four families

Each family is one TypeScript module split into a **pure logic half** (`src/play/families/<f>/logic.ts`: law, apply, goal,
generator, solver, shortcut check, mal-rules, grader, facts, board twin, apprentice bug) that both the server and the client
import, and a **view half** (`view.ts`: layout at the real box, drawing through the style interface, input, juice, sound,
ghost moves). The contract is `FamilyLogic` / `FamilyView` in `shared/play.ts`.

### 3.1 Todo-Jodo · split and merge

**Mode `atoms`** (c6 prime/composite, prime factorisation, co-prime; c7 HCF and LCM by primes):
- *World:* a number is a block. Tap it and choose a divisor on the chisel pad; the crack runs, the block splits into two
  blocks whose product is the parent, joined by a bond, so a factor tree grows as a molecule. Primes crystallise and ring.
- *Law:* exact integer division. A divisor that does not divide makes the crack bounce and the leftover is shown
  ("36 ÷ 5 → 7, 1 bacha"). A 1-split releases a "1" that evaporates and nothing changes (`m-include-one`'s consequence).
- *Goal:* every leaf an atom, then "ho gaya"; the atoms fly together and multiply back into the parent. Declaring done with
  a composite leaf: the leaf keeps humming with its crack line lit, nothing fuses (`m-stop-composite`'s consequence).
- *Two benches* (`m-different-trees`): the apprentice's tree of the same number starts with another split; the child
  predicts "same atoms or different" before finishing; both strips slide together.
- *HCF/LCM:* two molecules; shared atoms are dragged to the middle tray (HCF = product of the shared), the union is the LCM.
- *Fade:* 1 blocks only · 2 live product strip under the molecule · 3 the strip is the controller (split numbers in the
  notation) · 4 bare item ("Write 84 as a product of primes").
- *Solver:* the prime multiset is unique; minimal splits = Ω(n) − 1; a level is admitted only if every solution reaches the
  multiset (always true by the law) and the level's discriminating split exists (below).
- *Level as experiment:* `m-stop-composite` is discriminated by a number whose natural first split (the factor pair nearest
  √n) leaves two composite factors (72 → 8 × 9); `m-include-one` by any first move; `m-different-trees` by two-bench levels.

**Mode `strips`** (c4 equal parts and unit fractions; c5 comparing and equivalent fractions; c6 fractional units, equivalence,
comparison, adding and subtracting):
- *World:* up to three bars, each one whole, cut into equal parts; shaded parts are the amount.
- *Verbs:* re-cut every part of a bar into k (the amount never moves; 3/4 becomes 6/8 visibly), join k neighbours (only when
  the pieces are alike and the shading aligns), shade/unshade a part, pour the shaded pieces of one bar into another.
- *Law:* exact rationals. Pieces of different sizes do not fit each other's slots: pouring 1/3-pieces into a bar cut in
  quarters overlaps and leaves gaps (the consequence of `m-add-same`, adding tops and bottoms).
- *Goals:* make a fraction; make the same amount with different parts (equivalence); compare (cut to a common size, then
  choose); add or subtract onto a third bar; unit fractions (more parts, smaller parts).
- *Fade:* 1 bars · 2 bars with the live fraction under each · 3 the fraction is the controller (multiply top and bottom by
  dragging a ×k chip; the bar follows) · 4 bare item.
- *Discrimination:* `bigger denominator means bigger` by unit-fraction pairs; `compare numerators only` by pairs where the
  bigger numerator is the smaller amount; `add tops and bottoms` by unlike-denominator sums.

**Mode `bundles`** (c4 4-digit numbers and subtraction with borrowing; c5 5- and 6-digit numbers; c7 Indian place value):
- *World:* place-value columns of blocks (thousands plates, hundreds flats, tens rods, ones cubes). Take a number away
  column by column.
- *Law:* conservation under regrouping. "Take 4 ones from 0" cannot happen: the column refuses until the child unbundles a
  ten into ten ones (the arrow is drawn on the written twin at fade 2). Taking the smaller digit from the larger one (the
  classic `smaller-from-larger` bug) is impossible in the world and visible in the apprentice's column at Spot-the-slip.
- *Fade:* 1 blocks · 2 blocks + written column with borrow marks drawn by the child's own unbundle · 3 the written column is
  the controller · 4 bare item.

### 3.2 Taraazu · balance

- *World:* a two-pan scale. Unit weights are cubes; a mystery bag holds x cubes (x is hidden; the beam's tilt comes from the
  true x). The beam's angle is computed from the exact difference.
- *Verbs:* take a cube or a bag off a pan; split both pans into equal groups and keep one group each; open the bag (only when
  it sits alone on a level scale); in equality mode, drop cubes into the empty box.
- *Law:* L − R decides the tilt. Taking from one side tips the beam (the consequence of `do it to one side only`); the bag
  will not open while the scale is not level ("jab tak taraazu seedha nahi, bag ka wazan pata nahi chalega").
- *Goal:* the bag alone on one pan, cubes on the other, level → open → x cubes inside; then name x. Equality mode
  (c4-c5 relational equal sign, "3 + 4 = □ + 2"): fill the box so the beam levels; the box value is the answer.
- *Fade:* 1 scale · 2 scale + the live equation under it · 3 the equation is the scale (drag terms; the scale mirrors) · 4
  bare item.
- *Solver:* breadth-first search over (a, b, c, d) with legal moves; shortest solution length sets the move budget display
  (never a penalty).
- *Scope (honest):* positive terms and positive solutions only (`RESEARCH.md` §3.5: the balance model's evidence is unclear,
  and a balance cannot hold negatives). Negative terms wait for a tested extension.

### 3.3 Nishana · land it on the line

- *World:* a number line drawn at the device box with major and minor ticks; a marker the child drags.
- *Verb:* place, then "yahan!" (commit). Compare mode: place two values and read the order. Hop mode (integers): build the
  hops for s + k and s − k.
- *Law:* the true position is computed from the exact value. The pod lands where the child put it, the true flag rises at
  the truth, and the gap is labelled exactly only when it IS a simple fraction of the line's step ("¼ ka farak");
  otherwise it says "lagbhag" (about). An earlier build printed "1/3 ka farak" for a 0.18 gap: the label was a lie.
- *Round goal* (class 4-5 rounding): the value is placed between two landmarks (hundreds, thousands …), the halfway mark is
  drawn, and the child sends it down or up. Wrong answers are matched to named mal-rules (truncate, chain-round, round on
  the last digit).
- *Discrimination by range and form:* 3/4 on a 0-2 line separates the line-as-unit belief from the truth; 0.07 vs 0.7 on 0-1
  separates the place-value slip; −3 on −10…10 separates the sign-ignored placement; ranges and forms are mixed on purpose
  (Nuraydin's narrow transfer).
- *Fade:* 1 all ticks labelled · 2 major ticks only · 3 ends only · 4 bare item.

### 3.4 Kyun-Lab · fair test

- *World:* two (or three) set-ups side by side (trays of moong on cotton, two wet shirts on a line, two pendulums, two nails in
  test tubes …), each with condition chips; a day/time dial; a tally or readout per set-up.
- *Law:* a deterministic causal model per lab (`src/play/families/kyun-lab/labs.ts`, pure, shared by client and server),
  written from the kit's expectations: each factor level multiplies a rate or a final amount, or a binary outcome (sticks,
  glows, starch) is decided by rule; outcomes animate from the model, never from free generation. A model that is only
  approximate (how far a shadow falls, how long a swing takes) is shown as "lagbhag"; only labs marked `exact` print bare
  numbers.
- *Apparatus:* `scenes.ts` draws each lab's set-up from its chosen conditions (the wool-wrapped ice, the bulb in the cell
  circuit, the leaf with a foil strip) and animates the outcome by the run's progress; the race clock follows the faster
  set-up so the slow one is visibly behind.
- *The fair-test meter* lights every condition that differs between the set-ups. A confounded test may run; its result is
  marked "do badlav — kis wajah se?" and "can't tell" is then the right conclusion.
- *Verbs:* set a chip; commit a prediction; run time; conclude which condition made the difference.
- *Misconceptions as wrong models:* each kit misconception is stored as the model the child would believe (e.g. "seeds need
  light": dark × 0). The level picker prefers set-ups where the believed model and the true model disagree.
- *Spot the slip:* "Golu's test" is the kit's unfair test; the child finds the extra difference and fixes it.

### 3.5 Spot the slip (every family)

Every family renders a bugged state from a named mal-rule as the apprentice's work, labelled on screen with the apprentice's
name and an "uska kaam" tag: a tree stopped at 8, a pour of thirds into quarters, a one-sided removal, a 3/4 placed at 3, a
confounded test. The child finds and repairs it. The teacher never claims the mistake as her own.

---

## 4. Art directions

One style interface (`PlayStyle` in `shared/play.ts`, implemented in `src/play/core/styles.ts`): the views never pick a
colour; they ask the style for a ground, a panel, a stroke of a kind, a fill of a role, a text role, a particle kind and a
sound palette.

| direction | ground | relevant objects | type | motion signature | sound palette | fits |
|---|---|---|---|---|---|---|
| **Kagaz** | warm cream paper with grain, matches the Desk | layered paper-cut shapes with soft offset shadows; haldi, neel, terracotta, leaf | Bricolage + Atkinson + Mukta | slide and settle, paper flutter on a split | soft wood taps, paper rustle (filtered noise) | science labs, fractions, class 4-5 |
| **Chalk** | slate green-black board | chalk strokes with a small seeded jitter, two chalk colours, dust on a cut | Kalam-like hand via Atkinson weights; mono numerals | stroke draw-on | chalk tick (band-passed noise), soft tap | atoms, balance, worked moves |
| **Blueprint** | deep blue drafting sheet with a grid | cyan line work, dimension arrows, hatched fills | Geist Mono labels | plotted lines | clean sine blips | number line, measures, bundles |
| **Raat** | the night-lab instrument ground | glowing edges, ion and mint | Bricolage + Geist Mono | glow pulses | glassy FM bell | older children who choose dark; pendulum, shadows |

Rules (all checked in code or tests):
- **Pick per topic and child** (`pickArt` in `shared/play.ts`, pure): the family's compatible directions ∩ the topic's
  preference; the child's own choice wins when it is compatible; class 4-5 default to light grounds; never the same direction
  twice in a row for the same child and subject.
- **Status by shape, not colour alone:** a tick for a met goal, a magnifier for "look again", never a red cross; the one
  "your move" hue is reserved (DESIGN-V3 volt rule); no hue within 12° of it in any direction.
- **Contrast:** text ≥ 4.5:1 against its ground and graphical objects ≥ 3:1, per direction (unit-tested from the tokens).
- **Juice (J1):** every effect is caused by, and proportional to, the child's act and the law's answer (Kao 2024: success-
  dependent feedback helps, amplification hurts agency). Squash and stretch on a split, a crack run, a ring on a refused
  split, a rising chime per atom, hit-stop ≤ 80 ms, shake ≤ 6 px, celebration ≤ 800 ms. No confetti, stars, coins, mascots,
  music under her voice, idle loops or faces on pieces.
- **Reduced motion:** effects become cross-fades; the game still works.

---

## 5. The teacher in the play

| channel | when | how | guards |
|---|---|---|---|
| **micro-reaction** (2-8 words, noticing, never judging) | engine moments: first act, a split made, a refused split, a misconception consequence, a prediction committed / violated / confirmed, an impasse, solved | `server/play/react.js` picks a shape from `data/play/reactions.json` for the moment and language, fills it with on-screen facts, rotates deterministically | no verdict words (sahi/galat/right/wrong…), no key value that is not already on screen, `floorViolations` clean, no identical line twice in a session, ≤ 1 per 4 s, never while a finger is down or within 600 ms of release, never while the child holds the floor |
| **seam turn** (a full Director turn) | level end, impasse (no productive act for the child's own p75 hesitation, floor 8 s), a committed prediction, the child speaks, a confirmed mal-rule signature | the existing turn path, plus a telegraphic `PLAY` facts row (values only) | everything the turn path already has: scanSafety + model distress read on every committed turn, rung rules, the stop check-in |
| **ghost move** (teacher as teammate) | class 4-5 first contact; "aap karke dikhao"; the worked-example rung | the view animates one legal act with a soft hand in the direction's style, timed to her clause | only legal acts; never on the item being assessed; never the last step of a graded level; it is evidence of nothing |

**Voice as a verb** (`src/play/core/voice.ts`, built): a closed code grammar maps a committed utterance's numbers and verbs
in Hindi, English and Hinglish ("teen se todo", "4 by 4", "aadha", "ho gaya", "yahan", "phir se") to the same control
presses touch makes (`pressesFor`), tagged `via: "voice"`; a spoken act is echoed in the world at once and undo is free.
Discrete acts only; at most six words; any unknown word makes the whole utterance not a command. "Bas", "stop", "ruko",
"help", "madad", feelings and sentences are never acts: they stay ordinary turns, so the safety path sees every one (patch
05 dispatches each committed utterance to the game AND sends the turn as before).

**Knowledge states only** (Microsoft CoC restriction 12): play signals (time to first act, undo bursts, oscillation,
search-like divisor sequences) are candidate knowledge states for the comprehension engine, in shadow until precision ≥ 0.80
on children. No emotion is inferred or named; the face stays verdict-neutral.

---

## 6. The world: what grows is what you understand

`server/play/world.js` folds the learner ledger (`loadTruth` from `server/reports/truth.js`, the same truth the Garden/Sky
map and the parent reports read) and the curriculum's real prerequisite edges into a per-family map:
- **stations** = the topics a family covers for this child's class span; each station's state is
  `ahead` (not started) · `hatched` (practising) · `pencil` (got it today) · `ink` (secure) · plus an amber dot only when the
  server scheduled a re-check;
- **routes** = edges that exist in `data/curriculum` `prerequisites` or a kit's `prereqSkillIds`, each with its citation; no
  line is drawn for looks (test: every route cites an edge);
- **no other state:** no counts, percentages, completion art, unlocks or numbers that grow; every station is open;
- **absence invariance:** the fold has no clock input; the same ledger renders byte-identically a year later (test);
- **consequence, not decoration:** a station changes only because the ledger changed. The one ceremony of a lesson is the
  delayed check turning pencil to ink (≤ 1.5 s).

The play stage shows the map as a route diagram in the current art direction (the station the child is on is marked; the
child may look at any station; nothing is locked). Named real Indian places are deferred (§1).

---

## 7. The screen

**Play mode** takes the Desk over while a play segment runs. Two forms were built: the standalone stage drawn below
(`src/play/PlayStage.tsx`, the dev harness and the screenshots) and the **embedded** form inside the lesson Desk (patch 04:
the question card folds because the game's goal rail is the card, her speech row keeps its minimum, the tray takes the
rest; the embedded stage drops its own teacher row and refuses any box under 300 × 440 so the board twin shows instead):

```
phone (≤ 600 px wide)                 wide (≥ 900 px)
┌──────────────────────────────┐      ┌──────────────────────────────────────────┬─────────────┐
│ ‖  Todo-Jodo · 72      map ⋯ │ 44   │                                          │ (face)      │
│ (face) caption, 2 lines      │ 64   │                 WORLD                    │ caption     │
│ ┌──────────────────────────┐ │      │        (solved at this box)              │─────────────│
│ │          WORLD           │ │ rest │                                          │ goal rail   │
│ │  1 layout px = 1 CSS px  │ │      │                                          │ readouts    │
│ └──────────────────────────┘ │      │                                          │ controls    │
│ GOAL · live readouts         │ 52   │                                          │             │
│ [undo] [ho gaya] [mic]       │ 64   └──────────────────────────────────────────┴─────────────┘
└──────────────────────────────┘
```

At 360 × 800 the world is 360 × 576 CSS px (today's tray: 181 × 113); at 412 × 915, 412 × 691; at 1366 × 768,
1006 × 768. Every family solves its own arrangement inside the box (a molecule grows downward on a phone and sideways on a
laptop; two bars stack on a phone and sit side by side on a laptop; the scale's pans shrink before any label does). If an
arrangement cannot meet the floors, it steps down (fewer items, then the board twin); a font is never shrunk below the floor.

---

## 8. Truth, grading and evidence

- The server builds the level (code), stores it with the session, and sends the client the level. The client runs the same
  pure law for instant consequences.
- The client sends **raw acts** (with sequence numbers). The server replays them through `apply()` from `init(level)` and
  grades: `solved` / `partial` / `not_yet`, the misconception signatures matched, the discriminating corrects. Any field named
  like a verdict in an act is stripped before replay (`rj-ot-frame-claim-as-grade`).
- **Evidence:** one row per level per skill at the game weight (`via: "game"`, the existing `sourceOf` path), first committed
  act per level only; misconception hits and discriminating corrects through the existing log-LR machinery
  (`server/learner/kt/misconception.js`: LR_HIT 6.9, LR_DISCRIMINATING_CORRECT 0.49) scaled by the game weight.
- **The path, as built:** the play server signs what it graded (`server/play/evidence.js`: an evidence token per level and a
  seam token carrying the PLAY facts row, HMAC, bound to child and lesson); the Desk forwards the tokens as module events
  (`src/play/lessonBridge.ts`); the lesson turn verifies them, folds one `item.open` episode per level on the lesson's kit
  skills only, and gives the reply the facts row (patch 03). Anything the device sends besides a token is deleted first.
- **Mastery:** no play act can make a skill secure. The bare item and the delayed check do that, as today; patch 02 makes the
  ledger enforce it (a `via: "game"` event is never the delayed check and never sets `unaided`).
- **A model never grades** and never writes a key, a position, a count or a physical outcome.

---

## 9. Live generation, latency and degradation

| step | where | target | model? |
|---|---|---|---|
| admit by skill (`playFor`) | server | < 1 ms | no |
| enumerate, solve, shortcut-check, score, pick two doors | server (`server/play/levels.js`) | p95 ≤ 50 ms | no |
| reaction bank for the level | server | < 2 ms | no |
| pre-synthesise the 3 most likely reaction clips | server, TTS lane | overlaps play | TTS only (NOT built this round: reactions show as captions; the seam turn speaks) |
| client layout + first frame | device | ≤ 300 ms warm | no |

There is no model call on the play path at all. The teacher's full turns at seams are the existing Director turns. On a
TTS 429 the micro-reaction shows as a caption only; on any server failure the client keeps playing locally (no evidence is
recorded and the session says so to the Director on reconnect).

---

## 10. Safety (unchanged floor)

- Every committed child utterance during play is a normal turn: scanSafety, the model distress read, the out-of-bounds
  lexicon (`server/conversation/lexicon.js`, `screen.js`), the stop check-in. "Bas" mid-level gets the one warm check-in; the
  level waits, nothing is lost, so there is nothing to threaten.
- No play on or after a safeguarding turn until the hand-off is done. No play for the adolescence topics (c7-science-ch06),
  ever, and none for the c4-c5 EVS values, safety and feelings topics.
- Reaction lines pass `floorViolations` and the play guards before they can be spoken; never-deny-being-an-AI, Childline 1098
  and Tele-MANAS 14416 are untouched by this stream.
- NEVER MANIPULATE in play: no streaks, FOMO, guilt, loot, variable-ratio anything, lives, countdowns, leaderboards or
  pay-to-win; the world lint in tests enforces the vocabulary and the absence of counters.

---

## 11. How we will know (bars; the numbers measured this round are in `RESULTS.md`)

**Engineering (this round, offline or local):**
| id | bar |
|---|---|
| P-O1 solver correctness | 100% vs brute force on small grammars |
| P-O2 generator latency | p95 ≤ 50 ms (server, local) |
| P-O3 shortcut-free served levels | 100% |
| P-O4 grading truth | 0 wrong grades over ≥ 2,000 randomised right / wrong / partial act sequences per family; 0 forged claims accepted |
| P-O5 fit | 0 overflow, labels ≥ 14 px, targets ≥ 44 px at 360 × 800, 412 × 915, 1366 × 768 for every family × art direction |
| P-O6 frame rate | ≥ 50 fps median under 4× CDP CPU throttling at 412 × 915 (proxy, software raster; labelled) |
| P-O7 reaction guards | 0 verdict words, 0 unrevealed keys, 0 floor violations over the whole bank × all moments × all facts |
| P-O8 world | absence invariance byte-identical at +365 days; 100% of routes cite a real edge |
| P-O9 misconception diagnosis (simulated) | information-gain level choice needs ≤ 50% of random's levels to classify a mal-rule (synthetic learners; labelled simulated). Measured 0.60 mean: short of the bar, see `RESULTS.md` |
| P-J judges | two blind model judges of different families score on the written rubric (`RUBRIC.md`) vs Duolingo, Prodigy, Brilliant, DragonBox; reported as measured, no bar invented |

**Children (pilot; not this round):** within-child crossover (family session vs today's lesson, equal time) and a
teacher-ablation arm (the same family with and without her channels), outcome = bare items in a new form ≥ 2 days later;
about 105 completers for d_z = 0.3 on two contrasts (mechanics §12). Until then every claim reads "engineering-complete,
unproven on children".

**Reversal conditions** are in `context/inbox/r3-play.json` with each decision.
