# Play · the judging rubric (round 3, stream play)

**What it is for.** The brief asks that the play output be judged against Duolingo, Prodigy, Brilliant and DragonBox by two
independent model judges from different families, blind, and that the scores be reported honestly. This page is the written
rubric the judges are given (verbatim in `judge/judge.mjs`) and the rules for reading their answers.

**What it cannot do.** A model judge sees still screenshots. It cannot feel juice, hear sound, play a level, or see a
child learn. Holistic model scores correlate poorly with people on interactive content (`rj-holistic-model-judge-gate`:
ManimAgent r = −0.17; SciDraw-Bench inter-judge r 0.58-0.63), so: binary atomic checks are asked first, every verdict that
is reported as pass/fail is computed in code from those checks, the 1-5 scores are reported as the judges gave them with
both judges side by side, and nothing here is a learning claim. The product the judges are anchored to is described in
words only (no screenshots of the reference products were shown: we have no licence to their screens and could not
capture them here).

**Blindness.** The judges are never told which product, company or round made a screen. In part B the two screens of a
pair are shown as "Screen 1" and "Screen 2" in a random order recorded in the results, and every pair is asked twice with
the order swapped (position bias is measured, not assumed away).

**Judges.** `taxila-brain` (OpenAI gpt-5.6-sol, reasoning effort medium) and `grok-4-20-reasoning` (xAI): two families,
both vision models, both used as cross-family judges before (`evals/model-scout-2026-10-04/images`). Known weakness:
grok-4-20 gave 8/44 false passes on diagram labels (`rj-grok-label-judge`); its passes are read with that in mind.

---

## Part A · one game, three screens (phone 360 × 800, phone 412 × 915, laptop 1366 × 768; three art directions)

Passes 2 and 3 add a fourth screen: the 412 × 915 phone right after a typical mistake (the first of the level's own mal-rules,
played as a child holding that belief would play it; `harness/shots.mjs --mistakes`). Pass 1 judges could not see any
wrong-action state and said so; D2 and B4 need one.

### A1. Atomic checks (yes / no, each with a one-line reason)

| id | check |
|---|---|
| B1 | On every screen, every piece of text is fully readable: none cut off, none overlapping another, none too small to read on that device. |
| B2 | On every screen, every thing a child must tap is clearly a button or object and looks big enough to hit with a finger. |
| B3 | The main thing the child does is an operation on the maths or science object itself (split, cut, place on a line, balance, set a condition and run), not choosing an answer from a list of options. |
| B4 | At least one screen shows the result of the child's action as a visible consequence in the world (something moved, grew, tilted, landed, appeared), not only a right/wrong mark. |
| B5 | A written or symbolic form of the idea (an equation, a fraction, a written sum, a number) is shown alongside the picture. |
| B6 | No points, coins, stars, streaks, lives, timers, countdowns, leaderboards, ads or purchase prompts are visible. |
| B7 | The three screens look like one designed product (same game, consistent layout logic) while the art direction differs between them. |
| B8 | Nothing on any screen is factually wrong as far as the judge can tell (numbers, science, labels). |

**Code verdict:** a game PASSES part A when B1, B2, B3, B6 and B8 are all yes on both judges ("both judges agree"), and is
reported per check with the agreement rate between the judges.

### A2. Anchored scores (1-5, decimals allowed, never rounded up)

Each dimension has anchors that describe what the four reference products do on it (from their public descriptions and
the research in `RESEARCH.md` §2; the judges are asked to place this game on the same scale):

| dim | what is scored | 1 | 3 | 5 |
|---|---|---|---|---|
| **D1 the act is the idea** | does playing require doing the concept? | the maths is a quiz toll between the fun (Prodigy: answer a question to cast a spell) | mixed: some manipulation, mostly pick or type an answer (Duolingo Math) | the move IS the concept; you cannot progress without it (DragonBox: cancelling cards is the algebra) |
| **D2 feedback that teaches** | does a wrong action show WHY it is wrong? | right/wrong ding only | a hint or the right answer is shown | the world shows the specific consequence of the specific mistake (Brilliant-style simulation; DragonBox legal-move feedback) |
| **D3 legibility and fit** | readable and usable at this device size? | cramped, tiny, cut off | readable with effort | every label and target is comfortable on a phone and the laptop uses its space (the best of Duolingo's phone UI) |
| **D4 craft and finish** | polish, coherence, care in drawing and layout | clip-art, placeholder, mismatched | competent and clean, generic | premium studio quality (Brilliant / DragonBox level of finish) |
| **D5 world and style** | is there a real visual world with its own art direction? | a form with boxes | one decent style | distinct, coherent art directions that suit the topic (Prodigy's world appeal without its toll) |
| **D6 path to the symbol** | does it connect the picture to the written maths/science? | no symbol | symbol shown at the end | the symbol is live beside the world and can become the controller (DragonBox's fade from cards to x) |

For each dimension the judge also places this game against each reference product: **better / about equal / worse**.

## Part B · blind pairs (the same idea, two screens on the same 360 × 800 phone)

For each pair: which screen (1 or 2) is better on — **legible** (a 10-year-old can read and use it on this phone),
**idea** (the child has to do the maths or science idea to play), **craft** (looks made with care, premium), **overall**
(the better learning game) — with a confidence 1-3. Each pair is asked twice, order swapped; a judge's pick counts only
when it is the same screen in both orders (a flip is reported as "position-driven", not as a vote).

The pairs: the shipped studio-v2 engine as production showed it on a phone (its 16:10 world scaled into the lesson tray:
181 × 113 CSS px on a 360 × 800 page, measured by live-tech §1.1) against a play family on the same idea at the same phone,
in play mode. This is a comparison of what a child saw before with what this stream built; it is not a comparison with
the reference products. Each pair is asked in two variants: **tray** (the old engine at the box production gave it) and
**full** (the same old engine given the play world's own 360 × 576 box), so that a win can be read as "the box was
too small" (tray only) or "the game itself is better" (full as well).
