# Round 3 · play · RESEARCH: how the best products and papers solve "a game that teaches", and what transfers

**Stream:** play (round 3) · **Date:** 2026-10-09 · **Status:** research before build. The design that follows from it is in
`DESIGN.md`; the contract is in `GRAMMAR.md` and `shared/play.ts`.

**Tags.** **[V]** read in a primary source or its abstract (this session or a sibling concept doc's verification pass, named).
**[S]** secondary (press, a summary, a vendor page). **[M]** from memory of the literature, not re-checked. **[T]** Taxila's own
code, data or `context/`. **[R]** measured this session for this stream (method and n where the number appears). **[U]** a design
inference, unmeasured.

**What this document adds.** Three concept documents already surveyed the field in depth
(`docs/design/round3/game/concepts/{mechanics,world,live-tech}.md`, 2026-10-09, about 80 sources between them, each tagged).
I do not repeat their tables. I re-read their load-bearing claims against the repo, ran six new searches for the questions
the build depends on (juice and agency; number-line vs area models; the balance model's evidence; DevTools CPU calibration;
Duolingo Math's manipulatives; DragonBox's fade), and wrote down, for each product we will be judged against, the specific
mechanism it uses and whether it transfers to a Hinglish voice tutor for 9-15-year-olds on Azure-only compute.

---

## 1. The question, stated so it can fail

The owner (2026-10-09): the content is "cheap and basic and nonsense and in particular style only and when seen in the site
is not viewed properly and totally broken"; education is gamification and test prep, and Taxila must crack the gamification
of learning "in a revolutionary way".

Four failures, each measured before this round (sources in the concept docs, all on the round-2 production review shots of
2026-10-07, which were a **local production build of the round-2 tree**, not taxila.dev):

| complaint | measured cause | source |
|---|---|---|
| cheap and basic | 16 core engines of 126-405 lines; 26 extension engines under 213 lines on average; 382/385 topics share one generic explainer | mechanics §1, live-tech §1.3 [R there] |
| nonsense | a perimeter lesson mounted an area task; `dukaan@1` exercised "enough / not enough" while the lesson taught borrowing; 0/15 visible pieces were playable | live-tech §1.4, mechanics §1 [R there] |
| one style | 16/16 core engines on near-black grounds; 24/26 extension engines call one `backdrop()`; inside a cream app shell | live-tech §1.2 [R there] |
| not viewed properly | the piece rendered at 181 × 113 CSS px on a 360 × 800 phone; the 1000 × 625 world's 38-unit label floor became 6.9 px and its 130-unit target 24 px | live-tech §1.1 [R there] |

I re-derived the last row from the host constants in `src/studio-v2/core/tokens.ts` (`W = 1000`, `MIN.label = 38`,
`MIN.target = 130`): at a 181.5 px wide box the scale is 0.1815 px/unit, so 38 units = 6.9 px and 130 units = 23.6 px [R,
arithmetic]. The cause is structural: every engine draws a fixed 16:10 world that the tray scales down.

The test this stream must pass is therefore not "does a game exist for the topic". It is:
1. the child's act **is** the maths or science act (remove the game and the same acts remain; remove the learning and nothing
   in the world moves);
2. a wrong act produces the consequence its misconception predicts, computed, never drawn freely;
3. the piece is legible and playable at the box it actually gets, on a mid-range phone, at ≥ 50 fps;
4. there is more than one art direction and the choice is per topic and per child;
5. the teacher reacts to what the child does, inside the play, without talking over a drag;
6. no model grades, no model writes a key, and no manipulative mechanic exists.

---

## 2. What the four reference products actually do

The owner asked that the output be judged against Duolingo, Prodigy, Brilliant and DragonBox. For each, the mechanism, the
evidence, and the transfer decision.

### 2.1 DragonBox (and From Here to There)

- **Mechanism.** The equation is a board of cards; the child's moves are the algebra (cancel a card with its opposite, do the
  same to both sides, isolate the box). Monster cards are replaced by numbers and letters "little by little" once the rules
  are fluent [S: Getting Smart interview with the DragonBox team, 2013; Hechinger/Quartz excerpt of Toppo, *The Game Believes
  in You*]. The fade from object to symbol is the design.
- **Evidence.** The grade-7 RCT of 3,600+ students (analytic N = 1,850, nine 30-minute sessions): the two games where students
  manipulate expressions as objects (From Here to There, DragonBox 12+) beat the active control; problem sets with immediate
  feedback did not [S: Decker-Woodrow et al. 2023, via mechanics §2]. Against that: DragonBox in grades 7-8 for 3.5 h gave no
  gain on paper equations; players never wrote an equation (Long & Aleven 2014) [T: `in-game-success-as-mastery`].
- **Transfer.** Take the mechanism (the notation as a manipulable object; legal moves only) and the fade. Add what it lacks:
  a mandatory bare written item outside the game, and a live adult. Reject treating in-game success as mastery.

### 2.2 Brilliant

- **Mechanism.** Short interactive problems where the learner manipulates a representation (drag a point, change a parameter)
  before the abstraction is named; humans own "the learning objective, the progression and the aha"; AI fills variants
  [T: STUDIO-V2 §2 quoting Brilliant's "Hand-crafted, machine-made"]. DESIGN-V3 F8 records state-driven animation responding to
  the learner's actions rather than canned clips [T]. I could not find Brilliant's own engineering write-up this session
  (search 2026-10-09 returned only third-party Rive tutorials) [V, negative search].
- **Evidence.** No independent controlled study found (also in the concept docs).
- **Transfer.** Take: humans author the representation and the progression; variants are generated in code; every screen is
  one manipulable idea. Do not copy its streaks and league economy (it has both).

### 2.3 Duolingo (Math)

- **Mechanism.** Short lessons, replayable with fresh numbers each time; some classroom-style manipulation (a virtual ruler;
  dragging rectangle corners to make an area) [S: PopSci and The 74 coverage of the beta; Duocon description]. Retention is
  driven by streaks, leagues and (since 2025) an energy system [S: world §1.3].
- **Evidence.** Company A/B results on engagement (e.g. +3.3% day-14 retention from separating the daily goal from the
  streak) [S]; no independent controlled study of streaks and long-term learning found [S, world §1.3].
- **Transfer.** Take: replayable levels generated from a grammar so no two runs are the same; very short loops. Reject every
  loss-framed mechanic (streaks, energy, leagues): NEVER MANIPULATE, and F6 in DESIGN-V3.

### 2.4 Prodigy

- **Mechanism.** An RPG world where maths questions gate combat; pets, gear and a membership tier. The maths is a toll paid
  to reach the fun [S: world §1.3].
- **Evidence.** Company-published efficacy reports without matched controls; ESSA Tier 3 [S]; a causal-comparative study
  found no achievement difference (via game-mechanics) [V abstract there]. Fairplay's FTC complaint: "16 unique advertisements
  for membership and only four math problems" in 19 minutes [S].
- **Transfer.** Take the one true thing: children love a world that changes with them. Reject the toll structure, the
  currency, the pay tier and the quiz gate. A world here may only show what the child understands (§4.3).

### 2.5 What none of them has

No product found puts a human-like voice teacher who sees every act inside the play loop (search 2026-10-09, via mechanics
§0 and §14) [V, negative search]. That is the strongest evidence-backed lever available:
- teacher-provided scaffolding g = 0.58 vs success/fail feedback 0.26 (Clark, Tanner-Smith & Killingsworth 2016, RER) [V full
  text, via game-mechanics.md];
- GraphoGame g = −0.02 overall but 0.48 with high adult interaction (McTigue 2020) [V, via game-mechanics.md];
- simulations with enhancement vs plain simulations g = 0.49 (D'Angelo et al. 2014, k = 50) [V, via mechanics].

---

## 3. Papers that decide the build (new checks this session marked *)

### 3.1 The act must be the idea
- Intrinsic integration (Zombie Division): more learning and **7×** voluntary play time than the same maths between fights
  (Habgood & Ainsworth 2011) [V, via game-mechanics.md].
- Meta-analytic ceiling: games vs conventional instruction g ≈ 0.29-0.33; maths-specific d = 0.13; the ST Math scale-up null
  [V, via game-mechanics.md]. **So the game is not the lever on its own; the teaching features inside it are.** This is why
  the teacher-in-the-loop and the misconception-specific consequence are built first, and why every claim waits for children.

### 3.2 Feedback that teaches
- Feedback showing the answer or more (g = 0.40) and enhanced scaffolding (0.48) beat success/fail (0.26) (Clark 2016) [V].
- Erroneous examples: liked less, learned more, delayed d = 0.33 (McLaren 2015, n = 390); Decimal Point delayed d = 0.37
  (n = 153) [V, via game-mechanics.md]. → a labelled apprentice's mistake to find and fix, in every family.
- Predict-before-run: children 9-11 remembered more after generating predictions; explicit predictions boost learning of
  expectancy-violating outcomes (Breitwieser & Brod 2021; Brod 2021) [S/V, via live-tech, mechanics].

### 3.3 Juice: contingent on the child's act, never amplified for its own sake *
- Kao 2020 (*Entertainment Computing* 34): four juiciness levels in one action RPG; medium and high beat none and extreme on
  experience, intrinsic motivation, playtime and performance [S: survey arXiv 2011.09201 and the author's summary; exact n not
  re-verified this session].
- **New, and it changes the rule:** Kao, Ballou, Gerling, Breitsohl & Deterding, CHI 2024 (pre-registered, n = 1,699, 2×2 +
  control): **success-dependence** of juicy feedback enhanced effectance, competence and curiosity; **amplification
  unexpectedly reduced them**, possibly by undermining the player's sense of agency; curiosity was the strongest predictor of
  enjoyment and the only predictor of playtime [V abstract, spiral.imperial.ac.uk, doi 10.1145/3613904.3642656].
- → Rule J1: every juice event is caused by, and proportional to, the child's own act and the law's response to it. No idle
  loops, no "big win" escalation, no celebration that is bigger than the event. Celebration ≤ 800 ms (G12).
- Emotional design of relevant elements (warm colours, round shapes on the things that matter) g = 0.35 retention (Wong &
  Adesope 2021) [V, via game-mechanics.md]; schematic 0.48 vs realistic −0.01 (Clark) [V]. → art directions restyle the
  relevant objects; nothing decorative is added.

### 3.4 Number lines over area models for magnitude *
- Hamdan & Gunderson 2017 (*Developmental Psychology*, grades 2-3): number-line training improved number-line representation
  **and transferred to fraction magnitude comparison**; area-model training did not transfer [S: NSF PAR copy and ECR Hub
  summary, read via search 2026-10-09].
- Gunderson, Hamdan, Hildebrand & Bartek 2019: the unidimensional number line was the critical feature (pre-registered) [S].
- Tian, Bartek, Rahman & Gunderson 2021 (grades 4-5, improper fractions): **no** transfer from either training [S].
- Nuraydin, Stricker & Schneider 2022 (RCT n = 188): a fraction number-line game improved the trained 0-1 task only [T:
  `in-game-success-as-mastery`].
- → Nishana (the number-line family) mixes ranges (0-1, 0-2, 0-5, negative ranges) and forms (fraction, decimal, mixed),
  and its mastery claim still needs the bare item outside the game.

### 3.5 The balance model is weaker evidence than it looks *
- Otten, van den Heuvel-Panhuizen & Veldhuis 2019 (*IJ STEM Education* 6:30), a systematic review of 34 articles: no clear
  pattern of when the balance model helps; "a fairly complex teaching tool" [V abstract via DOAJ/NordOpen, 2026-10-09].
- Known limit [M]: a physical balance cannot hold negative quantities or subtraction cleanly.
- → Taraazu (balance) ships for positive-term equations and relational equality first, fades to the written equation as the
  scale (DragonBox's move, which does have RCT support), and is the family whose pilot readout is most uncertain. Negative
  terms wait for a "balloon" extension that must be tested before it ships.

### 3.6 Fair tests need explicit teaching at the moment of confusion
- Chen & Klahr 1999 (N = 87, ages 7-10): explicit control-of-variables training plus probes → learning and transfer; Klahr &
  Nigam 2004: direct instruction 40 → 80% vs discovery no gain [V/S, via mechanics].
- → Kyun-Lab shows a fair-test meter that lights every differing condition, lets a confounded test run (ambiguous result),
  and hands the teacher a seam turn exactly there.

### 3.7 Adaptivity diagnoses; it does not teach
- Physics Playground adaptive vs linear vs free sequencing: no delivery effect (n = 263) [T: `adaptive-sequencing-as-the-lever`].
- Optimal-experiment design halved the players needed to estimate a cognitive model (Rafferty, Zaharia & Griffiths 2014) [S].
- Moderate difficulty was most motivating only when self-selected (Lomas et al. 2017, n = 10,472) [S].
- → The level picker chooses levels that tell the child's live misconceptions apart (fast diagnosis), inside a 70-85% band,
  and offers a two-door choice (in-band or harder). It is not sold as the learning lever.

### 3.8 Productive failure reverses for young children
- Problem-solving before instruction g = 0.36 overall, but the trend favours instruction-first in grades 2-5 (Sinha & Kapur
  2021, 53 studies) [V abstract, via mechanics]. → class 4-5 first contact starts with the teacher's narrated ghost move; class
  6-7 may attempt first when prerequisites are secure.

### 3.9 Motivation without rewards
- Expected contingent rewards lower free-choice motivation, more for children (Deci, Koestner & Ryan 1999, 128 experiments);
  informational feedback raises it [V, via world/MWR].
- Badges/leaderboards raise competence satisfaction; stories and avatars raise relatedness; nothing raised autonomy as
  intended (Sailer et al. 2017) [V abstract, via world]. → competence comes from information (the world shows what you can now
  do), relatedness from the teacher, autonomy from real choices (the door, the art direction).
- Off-path coins cut Refraction's median progress 20 → 17 levels (Andersen 2011) [V, via game-mechanics.md].

### 3.10 The phone *
- Lighthouse throttles CPU 4× by default to move a desktop into "mid-tier mobile"; DevTools' calibrated mid-tier preset came
  out at 3.7× on Chrome's own example machine and matched a real mid-tier phone trace [S: Chrome DevTools blog "more accurate
  performance debugging using real-world data"; DebugBear]. → the fps gate here is 4× CDP CPU throttling at a phone viewport
  and DPR, in headless Chromium with **software rasterisation** (no GPU), which is pessimistic for canvas fill and optimistic
  for nothing else. It is a proxy, not a phone, and is labelled so everywhere.
- Children's touch: small and corner targets were hard for 7-11-year-olds (Brown & Anthony, CHI 2012 EIST, 8 children) [S];
  WCAG 2.5.8 floor 24 px; Android 48 dp [S, via live-tech]. → targets ≥ 44 px CSS with ≥ 8 px gaps; text ≥ 14 px (16 px for
  class 4-5 labels), solved at the real box, never scaled down.

---

## 4. What transfers to a Hinglish voice tutor for 9-15-year-olds in India, on Azure only

| lever | evidence | transfer to Taxila | constraint it must respect |
|---|---|---|---|
| the act is the idea | Habgood; FH2T/DragonBox RCT | family engines whose verbs are the concept's operations | remove-the-game / remove-the-learning tests (G2) |
| the law runs | Clark answer-display; D'Angelo | exact rational/causal models compute every consequence | `generated-media-carries-facts`: no model draws a fact |
| erroneous examples | McLaren | a *labelled* apprentice ("Bittu") makes the mistake; the child finds it | **no lying**: the teacher never pretends to believe a wrong idea (rejects live-tech's planted teacher slip) |
| live adult in the loop | Clark 0.58; McTigue 0.48 | micro-reactions at play turn-points + full turns at seams + ghost moves | never mid-drag; knowledge states only (CoC restriction 12); no verdict on the face |
| fade to the symbol | Fyfe; DragonBox | 4-stage fade; only the bare item outside the game counts toward "secure" | `in-game-success-as-mastery`; V1 bar 3 |
| juice | Kao 2020; Kao 2024 | contingent, proportional, ≤ 800 ms, one earcon class per art direction | DESIGN-V3 babyish lint (no confetti, stars, mascots) |
| number line | Hamdan & Gunderson; Nuraydin | mixed ranges and forms in one family | narrow-transfer risk logged |
| world that grows with you | Prodigy's pull; Outer Wilds' knowledge log (world §1.3) | the world is a view of the ledger: pencil = got it today, ink = secure | no points, coins, XP, counters, unlocks, clocks, streaks |
| choice | Patall; Lomas 2017 | two doors (in band / harder); art direction choice | both doors pedagogically valid; engagement never sets difficulty (G11) |
| Hinglish and India | Banerjee 2025 market maths; ASER | contexts (kirana, khet, chhat, tiffin) as skins; bilingual labels; Devanagari in a real font | contexts carry no factual claims about real places (world's `place-parameterised-truth`) |
| Azure-only | — | no third-party AI; the only live model call is optional (polish) and the game works without it | quotas maxed: degrade on 429 to the code path |

---

## 5. The design this research selects, and what it rejects

Full synthesis in `DESIGN.md`. In one paragraph: **the mechanics concept is the spine** (the idea is the controller, the law
runs, solver-proven shortcut-free levels, levels chosen to tell misconceptions apart, the teacher plays alongside, fade to the
symbol, a few deep families instead of many thin engines). **From live-tech** it takes the code-first base level with the
model optional, play mode owning the phone screen, legibility as a layout constraint at the real box, art directions through
one style interface, child-facing words from an authored bank checked in code, and play turn-points. **From world** it takes
the world as a pure view of the learner ledger (pencil and ink), routes only along real prerequisite edges, the honest
co-player (wrong ideas always labelled), residents who never speak, and no real-clock content.

Rejected, with the reason:
- **The teacher's planted slip as her own belief** (live-tech §3.3): breaks "no lying"; replaced by a labelled apprentice.
- **A model call per level writing the reaction bank** (mechanics §5.1): live-tech measured free model strings breaking their
  limits 13/24 and word-bounded grammars leaving junk 5/12 [R there]; replaced by an authored shape bank filled with level
  facts in code; a model may only choose among bank ids.
- **14 representations × 10 forms** (live-tech §3.1): breadth by combinatorics produces thin pairs (the owner's "cheap"); four
  deep families now, the grammar open to more.
- **Named real Indian places with factual claims in v1** (world §2.2): each needs sourced facts and a cultural review that
  this stream cannot do honestly in one round (world itself found a 4.5 °C false temperature); contexts are fictional skins.
- **Countdowns, drift and patience meters** (6 of 42 studio-v2 engines, world §9.2 [R there]): all play is untimed.
- **Folk-art packs generated by a model** (live-tech §3.5): never; commissioned only, not in this build.
- **Peers, family tours, child-built puzzles shared to family** (world §2.9, live-tech §3.4): valuable, out of scope for this
  round; logged as open.

---

## 6. Sources used directly in this document (beyond the concept docs' lists)

- Kao, D., Ballou, N., Gerling, K., Breitsohl, H., & Deterding, S. (2024). How does juicy game feedback motivate? Testing
  curiosity, competence, and effectance. CHI '24. doi 10.1145/3613904.3642656.
  https://spiral.imperial.ac.uk/entities/publication/253c32f5-d124-4a23-88b5-9aaaf114608d [V abstract]
- Designing Game Feel: A Survey. arXiv 2011.09201 (summarises Kao 2020). https://arxiv.org/pdf/2011.09201 [S]
- Otten, M., Van den Heuvel-Panhuizen, M., & Veldhuis, M. (2019). The balance model for teaching linear equations: a
  systematic literature review. *IJ STEM Education* 6:30. https://doaj.org/article/b332ab9319134adaa076247c3118c3fd [V abstract]
- Hamdan, N., & Gunderson, E. A. (2017). The number line is a critical spatial-numerical representation. *Developmental
  Psychology*. https://ecrhub.org/publications/number-line-critical-spatial-numerical-representation-evidence-fraction-intervention [S]
- Tian, J., Bartek, V., Rahman, M. Z., & Gunderson, E. A. (2021). Learning improper fractions with the number line and the
  area model. https://sites.temple.edu/cognitionlearning/files/2021/08/Tian-et-al-2021.pdf [S]
- Gunderson et al. (2019). Number line unidimensionality is a critical feature.
  https://ecrhub.org/publications/number-line-unidimensionality-critical-feature-promoting-fraction-magnitude-concepts [S]
- Chrome DevTools: More accurate DevTools performance debugging using real-world data (CPU calibration).
  https://developer.chrome.com/blog/devtools-grounded-real-world?hl=en [S]; DebugBear, CPU throttling in Chrome DevTools and
  Lighthouse. https://www.debugbear.com/blog/cpu-throttling-in-chrome-devtools-and-lighthouse [S]
- DragonBox fade: Getting Smart (2013), "DragonBox: This Is How You Gamify". https://www.gettingsmart.com/2013/05/24/dragonbox-this-is-how-you-gamify/ [S];
  Quartz/Hechinger excerpt of Toppo. https://qz.com/390854/the-video-game-that-teaches-algebra-to-4-year-olds [S]
- Duolingo Math: PopSci, "Duolingo math app beta testing". https://www.popsci.com/technology/duolingo-math-app-beta-testing/ [S];
  The 74, "Duolingo, the language learning app giant, wants to teach kids math".
  https://www.the74million.org/article/duolingo-the-language-learning-app-giant-wants-to-teach-kids-math/ [S]
- Everything else: the source tables of `docs/design/round3/game/concepts/mechanics.md` §14, `world.md` §10,
  `live-tech.md` §11 and `docs/research/content/game-mechanics.md`, with their tags.
