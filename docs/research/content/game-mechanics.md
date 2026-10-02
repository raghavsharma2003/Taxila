# Game mechanics for Taxila: what improves learning, and ten wrappers where the learning action is the game action

**Date:** 2026-10-02 · **Scope:** game-based learning (GBL) and gamification evidence 2011–2026, applied to the live voice lesson for Classes 1–9 (CBSE/NCERT), web plus Android WebView.
**Builds on, not repeated here:**
- `learning-science.md`: §2.4 (seductive details d = −0.30 / −0.48), §2.6 (Sailer & Homner, Deci 1999), rule 24 (songs only for verbatim content), rule 27 (no tangible-reward economy), the F1–F8 format families, and the T1–T5 topic types.
- `tech-and-market.md` §3–4: T0 engines, T1 spec filling, the 3.5% one-shot pass rate, and the bridge.
- `content/maths-engines.md` §3 and `content/science-engines.md` §2–3: the engine contract, probes, `poe-harness` and `investigation-harness`.
- `design/kids-ux-ages.md`: bands B1–B4; no streaks, leaderboards or fake peers.
- `safety/global-child-law.md` and `safety/dpdp-deep.md` NM-8: no unpredictable rewards, no optimising for engagement.

**This document adds four things:**
1. The game-specific evidence, with moderator numbers taken from the full text of Clark et al. 2016.
2. A machine-checkable definition of "the learning action IS the game action".
3. Ten wrapper specs.
4. Eight new engines that the wrappers need.

| tag | meaning |
|---|---|
| **[V]** | read this session in the primary source: the full text (Clark 2016 via Europe PMC; Andersen 2011 PDF) or the abstract (ERIC, Europe PMC, Crossref, Semantic Scholar) |
| **[S]** | secondary: a summary page, a TLDR, or an advocacy or legal summary |
| **[M]** | from memory of the literature, not re-checked this session. Verify before it becomes a `context/` entry |
| **[U]** | our design hypothesis or estimate. Measure it before relying on it |

**Method and limits.** The shared WebSearch budget was already used up when this session started (200/200), and OpenAlex's shared quota was also exhausted. Everything here was therefore retrieved through APIs and direct fetches:
- the ERIC API: about 30 queries;
- Europe PMC: the full text of Clark 2016 and the abstract of Banerjee 2025;
- Crossref and Unpaywall;
- Semantic Scholar: rate-limited, used for the Lomas abstract and the Hanus/Mekler TLDRs;
- the Andersen 2011 PDF;
- the PRS India and Fairplay pages.

Springer and ACM pages were blocked. As a result, **Sailer & Homner 2020 and Wouters 2013 are [V] at abstract level only**, and Mayer's value-added effect sizes are [M]. **No study tests game wrappers inside a live AI-voice lesson, and none studies Indian children on this.** Every transfer to Taxila below is an inference, tagged [U].

---

## 0. TL;DR (decisions)

1. **The medium effect is small and design-dependent. The game is not the lever.**
   - Games beat non-game instruction by g ≈ 0.29–0.33 (Wouters 2013, k = 77; Clark 2016, k = 57) **[V]**.
   - Design upgrades to the same game add a similar g = 0.34 (Clark, k = 20) **[V]**.
   - In the handful of studies that pass every quality filter, the effect is not significant: g = 0.02 (media comparison) and g = 0.11 (value-added), with tiny k **[V]**.
   - Maths-specific meta-analyses are smaller still: d = 0.13 (Tokac 2019, k = 24) **[V]**.
   - The large-scale ST Math RCT found a negligible effect (52 schools; Rutherford 2014) **[V]**.
   - Plan for wrappers to add roughly 0.1–0.3 SD at best, and **prove each one against a no-wrapper arm** (§7, G-E1).
2. **What reliably moves learning are teaching features that happen to live in games**, not game features:
   - scaffolding (enhanced g = 0.48, teacher-provided g = 0.58 vs success/fail-only g = 0.26; Clark) **[V]**;
   - instructional support (d = 0.34; Wouters & van Oostendorp 2013, k = 107) **[V]**;
   - multiple sessions (g = 0.44 vs a single session g = 0.08) **[V]**;
   - adult interaction (GraphoGame: overall g = −0.02, but g = 0.48 with high adult interaction; McTigue 2020) **[V]**.
   - **Taxila's voice teacher is the scaffold, so every wrapper is teacher-in-the-loop by contract.**
3. **"The learning action IS the game action" is enforced as two automated tests on every wrapper spec** (§3.4):
   - *Remove-the-game*: strip the wrapper, and the child still performs the identical acts on the identical items.
   - *Remove-the-learning*: no game state can change without an engine-verified learning act.
   - Habgood & Ainsworth found that the intrinsic version of Zombie Division produced more learning and **7× the voluntary play time** (n = 58 + 16) **[V]**.
   - Clark found no significant difference *between* intrinsic sub-types. Integration is necessary, not sufficient.
4. **No points, coins, XP, collectibles, unlocks, streaks, lives, leaderboards or loot, ever.** The reasons:
   - Off-path coins cut Refraction's median progress from 20 to 17 levels (n ≈ 15,900), and cut Hello Worlds from 7 to 4 levels (Andersen 2011) **[V]**.
   - Badges and leaderboards lowered motivation over a semester (Hanus & Fox 2015) **[S]**.
   - Expected rewards undermine intrinsic motivation more in children (Deci 1999, via learning-science).
   - US state law bans "unpredictable-interval" rewards (global-child-law).
   - **The only reward is the in-world consequence of a correct act**, such as a lock opening, a bulb glowing or the scoreboard balancing, plus the teacher's voice.
5. **Never compete against other children. The default opponent is the environment, or the child teams up with the teacher.** In Clark, single-player games without competition gave g = 0.45, while single-player competitive games gave g = −0.06 (significant difference) **[V]**. A teacher *rival* mode is opt-in for B3–B4 only, and her moves must be legal, narrated worked examples.
6. **Time pressure is opt-in, fluency-only, and stopwatch-only.**
   - The evidence on time pressure is sparse (Caviola 2017 review) **[V]**.
   - A third of children in Grades 2–5 report anxiety about failing at maths (Sorvo 2017, n = 1,327) **[V]**.
   - Production tasks raise state maths anxiety more than decision tasks (Yao 2026) **[V]**.
   - The timer is a count-up personal best, offered only for items that are already accurate untimed, never in B1, and it switches itself off on anxiety signals.
7. **Engagement is never the tuning signal.** In Battleship Numberline, easier conditions made 10K and 70K players play longer *and* learn slowest (Lomas 2013) **[V]**. Erroneous examples were liked *less* but learned *more* (d = 0.33 delayed; McLaren 2015, n = 390) **[V]**. Difficulty comes from the learner model, and engagement is a constraint only (learning-science §8.5).
8. **Use thin, relevant fiction and schematic visuals.**
   - Schematic games gave g = 0.48, cartoon 0.32, realistic −0.01.
   - Low anthropomorphism gave 0.37, medium 0.04.
   - Medium-depth stories gave −0.03 (Clark) **[V]**.
   - The narrative is at most one spoken sentence of framing. Context such as cricket or the kirana shop counts only when it *is* the problem.
9. **India-specific: the market-maths bridge is mandatory in `dukaan`.**
   - Kolkata and Delhi children who work in markets solve market arithmetic but fail the same sums in school format (n = 1,436).
   - School children did the opposite: only 1% could solve an applied problem that more than a third of working children solved (Banerjee et al., *Nature* 2025) **[V]**.
   - Every shop transaction is therefore paired with its written twin, in both directions.
10. **Ten wrappers** (§4): `personal-best`, `lockbox-escape`, `boss-problem`, `build-it`, `detective`, `tug-of-war`, `dukaan`, `cricket-scorer`, `sort-rule`, `word-chain`.
    - Together they cover T1–T5 across B1–B4.
    - They reuse the 25 maths and 16 science engines.
    - They need **8 new engines** (§5): `quick-item`, `lockbox`, `tug`, `shop`, `cricket`, `sorter`, `case-file`, `word-chain`.
11. **Legal shape.** India's Online Gaming Act 2025 bans "online money games", where stakes include "credits, coins, and tokens equivalent or convertible to money". It permits "online social games" offered for "skill development" **[S: PRS]**.
    - Taxila wrappers have no stakes, no purchasable or convertible currency, and no in-game monetisation surface.
    - This also avoids the Prodigy pattern: "16 ads for membership and only 4 math problems" in 19 minutes (Fairplay's FTC complaint, 2021) **[S]**.

---

## 1. Evidence: learning vs engagement

### 1.1 Meta-analyses and large trials

| study | scope | learning | motivation / engagement | what it means for Taxila | tag |
|---|---|---|---|---|---|
| Wouters, van Nimwegen, van Oostendorp & van der Spek 2013, *J Ed Psych* | serious games vs conventional instruction; learning k = 77 (N = 5,547), motivation k = 31 | learning d = 0.29, retention d = 0.36 | **not more motivating (d = 0.26, ns)** | games help when supplemented with other instruction, used over multiple sessions, and played in groups. Schematic beat realistic; no narrative trended better (per Clark's summary) | [V] abstract |
| Clark, Tanner-Smith & Killingsworth 2016, *RER* 86:79 | K-16 digital games; media comparison k = 57 (209 effect sizes); value-added k = 20 | g = 0.33 [0.19, 0.48]; value-added g = 0.34 [0.17, 0.51]; with a non-straw-man control 0.28 | intrapersonal outcomes g = 0.35 | moderators in §1.2. Studies passing all quality filters: g = 0.02 and 0.11, both ns (k = 4 and 2) | **[V] full text** |
| Sailer & Homner 2020, *EPR* 32:77 | gamification | cognitive g = 0.49 (k = 19), **stable in high-rigour studies** | motivational g = 0.36 (k = 16), behavioural g = 0.25 (k = 9), **both unstable in rigorous subsplits** | fiction and "competition plus collaboration" moderate behavioural outcomes only | [V] abstract |
| Wouters & van Oostendorp 2013, *C&E* | instructional support inside games, k = 107 | d = 0.34; 0.62 for skills; 0.46 when the support directs attention to relevant information | — | **publication bias: journals d = 0.44, proceedings 0.08, unpublished 0.14** | [V] abstract |
| Mayer 2019, *Annu Rev Psych* 70; Mayer 2014 book | value-added, cognitive-consequences and media-comparison genres | five value-added features: **modality, personalization, pretraining, coaching, self-explanation**. Media comparisons favour science, maths and L2 | — | effect sizes as remembered: modality d ≈ 1.4, personalization ≈ 1.5, pretraining ≈ 0.8, coaching ≈ 0.7, self-explanation ≈ 0.8. Narrative themes and immersion did not help [M] | [V] abstract, [M] numbers |
| Tokac, Novak & Thompson 2019, *JCAL* | maths video games vs traditional, PreK-12, k = 24 | **d = 0.13** (p = .02), heterogeneous | — | the maths prior is small | [V] |
| Tsai & Tsai 2020, *JCAL* | science games | vs other methods g = 0.646 (k = 14); mechanism-enriched vs plain game g = 0.27 (k = 12) | — | the science prior is larger, but k is small | [V] |
| Chen, Shih & Law 2020, *ETR&D* | competition in DGBL, 25 articles | 0.386 | — | competition worked in puzzle, strategy, RPG and simulation games, not action games. Not split by child vs child | [V] |
| Byun & Joung 2018; Wang, Chen & Hwang 2022 | K-12 maths games (17 studies); STEM games (k = 33) | STEM ES = 0.667 | — | small-k, mostly quasi-experimental: an upper bound | [V] |
| Özdemir 2025, *JCAL* | Kahoot!, 43 studies | 0.772; "retention" 1.492 | motivation 0.960 | implausibly large. Read against the publication-bias note above. **Do not use as a prior** | [V] |
| Rutherford et al. 2014, *JREE* | ST Math RCT, 52 low-performing schools | **negligible**, ns after 2 years | self-beliefs rose (Rutherford 2020) | even a well-integrated, language-light maths game was null at scale | [V] |
| McTigue et al. 2020, *RRQ* | GraphoGame, 28 studies, 19 in the meta-analysis | **g = −0.02** overall | — | **high adult interaction g = 0.48**: the adult is the active ingredient | [V] |
| James-Brabham et al. 2024, *J Ed Psych* | linear number board game RCT, ages 4–5, n = 249 | **no benefit beyond teaching as usual** | — | the Siegler & Ramani effect holds against minimal controls, not against real teaching | [V] |
| McLaren, Adams, Mayer & Forlizzi 2017; Nguyen et al. 2022 | Decimal Point (Grades 5–6) vs conventional software, n = 153; pooled 4 studies, n = 624 | d = 0.43 immediate, **0.37 delayed**; low prior knowledge benefited most; girls learned more (mediated by careful self-explanation) | enjoyment d = 0.95 | the best middle-school maths game evidence, and it is built on **erroneous examples and self-explanation** | [V] |

### 1.2 Moderators that matter (Clark 2016, Table 3, media comparisons; * marks a significant difference between rows) [V]

| moderator | rows: g (k) | design rule it forces |
|---|---|---|
| sessions* | single 0.08 (17) · **multiple 0.44 (40)** | wrappers recur across days on spaced items. No one-off "big game day" |
| players* | **single, no competition 0.45 (44)** · single, competitive −0.06 (4) · collaborative team competition 0.22 (3) · MMO −0.05 (7) | environment or teacher-teammate by default; no child-vs-child; no ranks |
| game type | points/badges added 0.53 (17) · more than points/badges 0.25 (40) (difference ns) | simple gamification "works" on low-order outcomes but carries a motivation cost (§1.4). We take the integration, not the badges |
| integration | not fully intrinsic 0.33 (10) · intrinsic 0.19 (24) · **simplistically intrinsic 0.49 (23)** (ns) | "simplistically intrinsic" means one mechanic that *is* both the learning and the game mechanic. That is exactly our wrapper shape. Elaborate integration buys nothing |
| scaffolding* | success/fail/points 0.26 · answer display 0.40 · enhanced 0.48 · **teacher-provided 0.58 (4)** | the teacher narrates every wrong act with a misconception-specific move (G6) |
| visual realism* | **schematic 0.48** · cartoon 0.32 · realistic −0.01 | flat, schematic art; no 3D realism in wrappers |
| anthropomorphism* | **low/none 0.37** · medium 0.04 · high 0.55 (k = 3) | no faces on manipulatives or game pieces. The teacher avatar lives outside the play area |
| story relevance* | none 0.44 · irrelevant 0.63 · relevant 0.17. **Attenuated to ns after controls** | do not invest in story. One sentence of framing at most |
| story depth | none 0.44 · thin 0.47 · medium −0.03 · thick 0.36 (k = 5) | keep it thin |

Value-added (Clark Table 4) **[V]**:
- enhanced scaffolding vs the same game without it: g = 0.41 (k = 9);
- collaboration: 0.24 (k = 3, ns);
- competition: 0.33 (k = 3, ns);
- **scaffolding plus competition: −0.22 (k = 1)**.

### 1.3 Intrinsic integration: what it is, and its limits

- **Definition.** In Habgood & Ainsworth's version (building on Malone & Lepper 1987 and Kafai 1996 **[M]**), the learning content is delivered through the game's *core mechanic* and its *flow*, not between levels.
  - Zombie Division puts division *in the combat*: the child attacks with a divisor that must divide the zombie's number. In the extrinsic version, the same maths is a quiz between fights.
  - Intrinsic integration gave more learning under fixed time and 7× the free-choice play time (ages 7–11) **[V]**.
- **The atomic intrinsic-integration approach** (Echeverría et al. 2012, electrostatics) maps every game "atom" to a concept. The redesigned game improved learning and reduced conceptual problems. **Fantasy vs non-fantasy versions did not differ** **[V]**, which is further evidence that fiction is not the lever.
- **Ke 2016** (69 articles) **[V]** gives the vocabulary used in §3:
  - two kinds of learning action: prior-knowledge activation and new-knowledge acquisition;
  - three ways learning is integrated into play: representation, simulation and contextualisation;
  - meta-reflective moments;
  - multi-part scaffolding.
- **LM-GM** (Arnab et al. 2015) maps each learning mechanic to a game mechanic, and is what our manifest field `coreLoop` encodes **[V]**.
- **Plass, Homer & Kinzer 2015** separate *learning mechanics* from *assessment mechanics* **[V]**. In Taxila, the engine is both: every learning act is also the evidence event.
- **Limits.**
  1. Clark found intrinsic sub-types did not differ significantly **[V]**.
  2. ST Math is intrinsic by design and was null at scale **[V]**.
  3. DragonBox shows integration can produce high engagement with weak transfer to paper unless a symbolic step is added (maths-engines §1).

  Hence G8: every wrapper ends with an abstract act.

### 1.4 Rewards, points, coins and secondary objectives

- **Andersen et al. 2011** (Refraction, a fractions game, and Hello Worlds; 27,000+ players; A/B tests) **[V full text]**:
  - Off-path coins reduced levels completed: Refraction 20 → 17 at the median (n = 7,844 vs 8,034); Hello Worlds 7 → 4 (n = 1,003 vs 947).
  - In Refraction, the group that quit earlier because of the coins was **4× as large** as the group the coins kept playing longer.
  - Coins placed *on the solution path* removed the harm and kept the benefit for long-term players.
  - → **G4: only on-path secondary objectives.** The secondary objective must itself be a learning act, such as "find a second way".
- **Hanus & Fox 2015** (semester course): students in the gamified course (badges, leaderboard) showed less intrinsic motivation, satisfaction and empowerment over time than the non-gamified class **[S]**. That they also scored lower on the final exam is **[M]**.
- **Mekler et al. 2017**: points, levels and leaderboards acted as extrinsic incentives that raised performance *quantity* only **[S]**.
- **Balci et al. 2022**: badges and leaderboards did not change academic performance (two RCTs, N = 102 and 88) **[V]**. In Balci's 2022 dissertation, badges tended to *lower* intrinsic motivation, while **freedom of choice raised it** through autonomy **[V, dissertation]**.
- **Children and law:**
  - Deci 1999: the undermining effect is stronger in children (learning-science §2.6).
  - ICO: ages 10–12 are "particularly susceptible to reward based systems" (kids-ux-ages).
  - Hawaii SB 3001, Iowa and Nebraska ban unpredictable-interval rewards for minors (global-child-law).
  - DPDP NM-8 bars engagement as an objective.
- **Prodigy** is the cautionary product. Its role-playing wrapper earns attention for the store: pets, membership-only areas, paid score advantages, and "16 ads for membership and only 4 math problems" in 19 minutes (Fairplay et al., FTC complaint, Feb 2021) **[S]**. A 2022 district comparison found no achievement difference between users and non-users (ED649404) **[V abstract; causal-comparative design]**.

### 1.5 Challenge, time pressure, competition and difficulty

- **Difficulty (Lomas et al. 2013, CHI).** Two online experiments with 10K and 70K players. Players were "more engaged and played longer when the game was easier", and "the most engaging design conditions produced the slowest rates of learning" **[V abstract]**. The authors propose giving *feedforward* about the coming challenge. → G11.
- **Time pressure.**
  - Caviola et al. 2017 reviewed 19 papers on time pressure, stress and strategy selection and concluded there is "not much evidence of clear associations" **[V]**.
  - Sorvo et al. 2017 (Grades 2–5, n = 1,327): about one third report anxiety about failing at maths. Situation anxiety tracks arithmetic fluency from Grade 2 **[V]**.
  - Yao et al. 2026: production tasks (generating the answer) elicit more state maths anxiety than decision tasks (verifying an answer), especially at high trait anxiety **[V]**.
  - **For fluency**, drill plus modelling gives the largest effects, and multi-component programmes beat single-component ones (Codding et al. 2011, single-case designs, n = 55) **[V]**.
  - → `personal-best`: the default is untimed. The timer is opt-in, offered once items are accurate. Anxious children get decision-format items, and every round includes a modelled strategy.
- **Competition.** In Clark, single competitive games gave g = −0.06 vs 0.45 non-competitive **[V]**. Chen 2020 reports competition working in some genres (pooled 0.386) **[V]**. Children quit after seeing exemplary peers (Rogers & Feller 2016, via kids-ux-ages). → no peers. The child can compete with **the environment** (current, lock, deadline-free boss), **their own past self**, or, opt-in for B3–B4, **a teacher rival who plays legal, narrated moves** (modelling = "coaching" in Mayer's list).
- **Productive failure.** Problem-solving before instruction beats the reverse at g = 0.36, and 0.37–0.58 with high fidelity (53 studies). **Grades 2–5 showed the opposite trend** (Sinha & Kapur 2021) **[V]**. → In `boss-problem`, attempt-first is only for B3–B4 with prerequisites in place.
- **Surprise events.** A non-player character who changes the problem mid-game had a marginal effect, and helped higher-level students more (Wouters et al. 2017) **[V]**. → The boss's "counter-move" (a parameter change) is for B3–B4 only.

### 1.6 Narrative, visuals, seductive details vs emotional design

- **Seductive details hurt** (learning-science §2.4). In games, Clark's realism, anthropomorphism and story-depth rows point the same way **[V]**.
- **Emotional design is different from seductive detail.** Making *relevant* elements appealing (warm colours, round shapes) improved retention (g = 0.35), transfer (0.27) and intrinsic motivation (0.15) (Wong & Adesope 2021, a replication of Brom et al. 2018; 28 articles) **[V]**.
- **Reconciling the two:**
  - Style the relevant objects warmly: the lock, the rope, the scoreboard.
  - Add nothing irrelevant: no mascots, confetti, ambient animation or background music.
  - Keep manipulatives bland, with no play meaning (maths-engines R2).
- **Self-explanation and reflection inside games are fragile:**
  - Hsu & Tsai 2013 (primary light-and-shadow game): self-explanation prompts gave no gain **[V]**.
  - ter Vrugte et al. 2015: integrated reflection prompts added nothing and were "too demanding" **[V]**.
  - Yang 2023 (a dissertation, Grade 10, n = 92): prompts helped **[V]**.
  - Decimal Point's gains were mediated by careful self-explanation **[V]**.
  - → G9: one short *spoken* "why" per round, answered to the teacher. Never a typed text box. Measure it (G-E6).

### 1.7 Interest, context and choice

- **Choice and context.** Contextualisation, personalisation and choice raised motivation and learning in Grades 4–5 (Cordova & Lepper 1996) **[V]**. Choosing an example triggered situational interest (Høgheim & Reber 2017, N = 713) **[V]**.
- **Personalised problems.** Personalising algebra problems to students' interests raised triggered interest, in-tutor accuracy and efficiency, and classroom exam scores (Bernacki & Walkington 2018, N = 150) **[V]**.
- The interest meta-analysis (g = 0.36 transfer) is in learning-science §2.7.
- **Choice sizing** comes from Patall 2008 via learning-science: 2–4 options, with irrelevant choices fine.
- → Wrappers are *offered* as a choice of 2–3. The cricket context appears only when it matches the child's interest tags.

### 1.8 India-specific facts that change the design

- **Market and school maths do not transfer either way** (Banerjee, Bhattacharjee, Chattopadhyay, Duflo, Ganimian, Rajah & Spelke, *Nature* 2025; Kolkata and Delhi; 1,436 working children and 471 school children) **[V]**.
  - The gap is not explained by memorisation, help, stress or incentives.
  - School children "used highly inefficient written calculations" and could not combine operations.
  - → `dukaan` runs the bridge in both directions, and credits mental strategies.
- **NCERT already uses games**, and our seed curriculum contains them:
  - NIM (c4-maths, "reach 10 first by adding 1 or 2");
  - the Idli-vada game (c6-maths-ch05-t01);
  - "co-prime lock combinations for a treasure box" (c6-maths-ch05-t03);
  - SEND + MORE cryptarithms (c7-maths-ch06-t04);
  - the Collatz game (c6-maths-ch03-t03);
  - the kirana shop (c1-maths-ch12-t01) and the mela (c1-maths-ch12-t02, c2-maths-ch10-t01).

  Wrappers that reuse the book's own games agree with school.
- **Cricket carries a real misconception:**
  - "Cricket overs 4.3 vs decimals: why 4.3 overs is not 4.3 in decimals" (c7-maths-ch03-t02 hook). Overs are a base-6 notation.
  - Bar graphs of "runs scored by batters in an IPL match" (c6-maths-ch04-t03).
  - "Average runs per match of a cricketer" (c7-maths-ch13-t02).
  - "Coin toss before a cricket match" (c9-maths-ch07-t02).
- **Online Gaming Act 2025** (passed 20–21 Aug 2025): "online social game" means one "offered solely for recreation, entertainment, or skill development". Subscription fees are allowed; stakes are not **[S: PRS]**. Whether in-app games could make Taxila an "online gaming intermediary" stays open as dpdp-deep Q11. Our no-stakes, no-currency design keeps that answer simple **[U: legal check]**.
- **Mindspark**, the Indian adaptive benchmark (+0.22 SD maths and +0.20 SD Hindi at scale; india-ai-native §3.4), is adaptive practice with light gamification. Its gains are attributed to adaptivity and time on platform, not to games **[S]**.

### 1.9 Mechanics ledger (the decision table)

| mechanic | learning evidence | engagement evidence | Taxila verdict |
|---|---|---|---|
| intrinsic integration (act = verb) | Habgood: more learning **[V]**; Echeverría **[V]**; Clark: sub-types ns | Habgood: 7× free-choice time | **required** (G1, §3.4) |
| teacher / adult scaffolding inside play | Clark 0.48 / 0.58; W&vO 0.34; GraphoGame adult 0.48 **[V]** | — | **required**: the voice teacher narrates every wrong act |
| multiple spaced sessions | Clark 0.44 vs 0.08 **[V]** | — | **required**: wrappers recur on spaced items |
| erroneous examples | McLaren delayed d = 0.33; Decimal Point **[V]** | *liked less* (d = 0.21) | **yes, after mastery** (`detective`) |
| construct / build with constraints | manipulatives with guidance (maths-engines §1) | high | **yes** (`build-it`) |
| retrieval and interleaving in game form | strong outside games (learning-science); escape rooms are mostly review (Kakos 2025: 0.616 vs control, health sciences) **[V]** | high | **yes** (`personal-best`, `lockbox-escape`) |
| context personalisation (cricket, shop) | Walkington; Bernacki & Walkington **[V]** | situational interest ↑ | **yes, interest-gated** |
| choice of wrapper or context | Cordova & Lepper; Høgheim & Reber **[V]** | autonomy ↑ (Balci) | **yes, 2–3 options** |
| self-explanation inside play | mixed (§1.6) | — | **one spoken "why" per round**; measured |
| productive failure | g = 0.36; reversed for Grades 2–5 **[V]** | — | **B3–B4 only** |
| teacher-rival competition | modelling/coaching [M]; Clark competitive −0.06 | mixed | **opt-in B3–B4** |
| child-vs-child competition, leaderboards | Clark −0.06; Rogers & Feller | quitting | **never** |
| points, badges, XP for completion | Clark 0.53 on low-order outcomes; motivational effects unstable (Sailer) | Hanus & Fox ↓; Mekler: quantity only; Deci undermining | **never** |
| coins, collectibles off the learning path | Andersen: progress ↓ **[V]** | median player quits sooner | **never**; on-path "second way" only |
| unpredictable or random rewards, loot | — | law bans for minors | **never** |
| lives, game-over, health loss for wrong answers | none found [U] | anxiety risk (Sorvo) | **never**; retry is free; consequences are informative |
| countdown timers | sparse; anxiety (Caviola, Yao) | arousal | **never**; count-up personal best only, opt-in |
| rich narrative or realism | Clark realistic −0.01, medium story −0.03 | — | **thin and schematic** |
| emotional design on relevant objects | g = 0.35 retention **[V]** | IM +0.15 | **yes**, inside the asset budget |
| difficulty tuned to engagement | Lomas: slowest learning **[V]** | longest play | **never**; the learner model sets difficulty |

---

## 2. Binding rules for every wrapper (G1–G14)

CLAUDE.md (2026-10-02) deprioritises compliance for now. Every rule below still stands on **learning evidence alone**: G3 and G4 rest on Andersen, Deci and Hanus & Fox, and G7 rests on Clark's players row. The legal citations are a second reason, not the only one.

| id | rule | source | enforced by |
|---|---|---|---|
| **G1** | Every change to game state is caused by a `VerifiedAct`, an engine-evaluated learning outcome. Taps on chrome, waiting, chance and time cannot move progress. | Habgood; Clark; LM-GM | lint L1 plus runtime assert |
| **G2** | Remove-the-game and remove-the-learning tests both pass (§3.4). | intrinsic integration | lint L9 plus golden replay |
| **G3** | No RNG in the progress or feedback path. Seeded RNG is allowed only to *generate items before* they are shown. | Hawaii SB 3001 and similar; NM-8 | lint L2 |
| **G4** | No currency, points, XP, collectibles or unlocks. Secondary objectives must be on-path learning acts ("find another way", "prove it"). | Andersen 2011; Deci 1999; Hanus & Fox | lint L3 |
| **G5** | Persisting across sessions is limited to `artifact` (the child's own build, shown to the parent) and `capability_statement` ("you can now…"). All game state resets. | rule 27; relatedness outward | lint L3 (whitelist) |
| **G6** | A wrong act produces an **in-world, misconception-specific consequence**, then the teacher's move: the lock clicks "shares factor 3"; the rope goes the "wrong" way. There are no lives and no game over; retry is free. | Clark scaffolding; GraphoGame adult | manifest `feedback`; review |
| **G7** | Opponents are the environment, the child's past self, or the teacher (teammate by default; rival opt-in for B3–B4 only). No human opponents, ranks or comparisons. | Clark players row; kids-ux §0.10 | lint L7 |
| **G8** | The session ends with an **abstract act**: maths stage `abstract`, science repr `abstract`, or the written form in `dukaan`. | DragonBox (maths-engines §1); Fyfe 2015; Banerjee 2025 | lint L6 plus `game.end.abstract_ok` |
| **G9** | One short spoken "why/how do you know" per round. Its result never moves mastery alone (learning-science §7.2). | Mayer self-explanation [M]; mixed evidence §1.6 | wrapper template |
| **G10** | Timers: none in B1. B2–B4 get a count-up personal best only, opt-in, and only after untimed accuracy ≥ 90% and FSRS stability ≥ 3 days on every item. Decision format when the anxiety flag is set. The timer switches off silently on 2 consecutive errors plus a latency spike, or on spoken distress. | Caviola; Sorvo; Yao | `TimerPolicy`; runtime |
| **G11** | Difficulty is set by the learner model (target first-try success ≈ 70–85% [U]), never by engagement. Feedforward ("this one is a tough one, want it?") is allowed. | Lomas 2013; NM-8 | planner |
| **G12** | Asset budget: ≤ 6 non-semantic sprites; no animation while a probe is open; in-world celebration ≤ 800 ms after commit; one earcon; no music under the teacher; schematic flat art; no faces on game pieces. | Clark realism and anthropomorphism; Rey 2012; Wong & Adesope | lint L4 |
| **G13** | Rapid guesses (latency < `floor_ms`, set per item type) never count as correct for progress. Two in a row → the teacher pauses the game. | gaming detector P22 (learning-science) | runtime |
| **G14** | Wrappers recur: each one is designed to be replayed over ≥ 3 sessions with spaced, interleaved items. No one-off epics. | Clark sessions row | planner |

---

## 3. Contract

### 3.1 Types

```ts
// packages/games/core/types.ts — host-side shell; engines stay sandboxed iframes (tech-and-market §3.4)
import type { L10n, MiscId, ModuleSpec } from "../../engines/core/types";
export type TopicType = "T1" | "T2" | "T3" | "T4" | "T5";         // learning-science §8.4
export type BandId = "B1" | "B2" | "B3" | "B4";                   // kids-ux-ages §0.2 (6-7, 8-9, 10-12, 13-15)
export type LessonPhase = "warmup" | "explore" | "practice" | "consolidate" | "review";
export type WrapperId = "personal-best" | "lockbox-escape" | "boss-problem" | "build-it" | "detective"
  | "tug-of-war" | "dukaan" | "cricket-scorer" | "sort-rule" | "word-chain";
export type ActKind = "answer" | "construct" | "predict" | "classify" | "explain" | "spot_error" | "estimate" | "word" | "transaction";

/** The ONLY input that may change game state (G1). Derived by the host from engine events, never from raw input. */
export interface VerifiedAct {
  seq: number; module_id: string; src_seq: number;       // the engine event that proves it
  topic_id: string; skill_ids: string[]; kind: ActKind;
  outcome: "correct" | "misc" | "other" | "partial";
  misc?: MiscId; value?: string;                          // serialised MathValue / label / word
  stage: "concrete" | "pictorial" | "abstract";           // maths Stage; science Repr mapped concrete|bridge→pictorial|abstract
  latency_ms: number; hints: number; attempt: number; rapid_guess: boolean;
  via: "tap" | "drag" | "voice";
}
export interface WrapperManifest<P> {
  id: `${WrapperId}@${number}`; title: L10n;
  topicTypes: TopicType[]; bands: BandId[]; phases: LessonPhase[];
  engines: string[];                                      // engine ids whose acts it consumes; "*" = any with probes
  coreLoop: { acts: ActKind[]; verb: L10n; why: string }; // why = one line: why the act IS the verb (lint L9 reads it)
  paramsSchema: import("zod").ZodType<P>;
  progress: ProgressModel; timer: TimerPolicy; opponent: OpponentPolicy;
  feedback: { wrong: "in_world_misc"; retry: "free"; celebrate: "tick" | "in_world"; maxCelebrateMs: 800 };
  endsWith: { abstractAct: true; explain: boolean };
  persists: ("artifact" | "capability_statement")[];      // G5 whitelist; anything else fails lint L3
  budget: { decorSprites: number; gzipKB: number };      // G12; shell + skin ≤ 60 kB gz [U]
  gates?: { minMastery?: "introduced" | "practising" | "learned-today"; interestTag?: string };
}
export type ProgressModel =
  | { t: "board"; items: number; requeueWrong: true }                 // personal-best
  | { t: "locks"; count: number; chained: boolean }                   // lockbox-escape
  | { t: "shields"; count: number; counterMove: boolean }             // boss-problem
  | { t: "constraints"; checks: string[]; variantsRequired: number }  // build-it
  | { t: "cases"; count: number; cleanCaseShare: number }             // detective
  | { t: "target"; maxMoves: number; tolerance?: number }             // tug-of-war
  | { t: "ledger"; goal: "serve_orders" | "budget" | "profit" }       // dukaan
  | { t: "chase"; overs: number; checkpoints: string[] }              // cricket-scorer
  | { t: "bins"; items: number; ruleHidden: boolean }                 // sort-rule
  | { t: "turns"; rounds: number; teacherSlips: number };             // word-chain
export interface TimerPolicy { mode: "none" | "countup_pb"; bands: BandId[]; minUntimedAcc: 0.9; minStabilityDays: 3;
  anxietyFormat: "decision"; autoOff: { consecutiveErrors: 2; latencySpikeX: 2 } }
export interface OpponentPolicy { kind: "none" | "environment" | "teacher_teammate" | "teacher_rival" | "past_self";
  rivalBands?: BandId[]; humanOpponents: false; ranks: false }
export interface GameSpec<P> {                           // what the T1 LLM fills; zod-validated like ModuleSpec
  wrapper: `${WrapperId}@${number}`; game_id: string; topic_ids: string[]; objective_ids: string[];
  band: BandId; lang: "en" | "hi" | "hi-Latn+en"; mode?: string; skin?: string;   // skin: dukaan "kirana"|"mela"|"haat"
  modules: ModuleSpec<unknown>[];                        // 1..n engine mounts the wrapper drives
  params: P;
}
```

### 3.2 From engine events to `VerifiedAct`

The host's `actFromEvent(e)` is the single choke point. Its sources, by engine type:
- **Maths engines.** `probe_result{outcome,misc,attempt}` maps to the act kind given by the probe kind: predict, contrast→answer, translate→construct, diagnose→answer, spot_error, construct, estimate. `goal_met` maps to construct, correct.
- **Science.** `poe.matched{bool}` maps to predict; `cvs.conclusion{supported}` maps to answer; a `goals[]` check flip maps to construct.
- **New engines** emit `probe_result` directly (§5).
- **Voice answers** arrive by `record_answer` (maths-engines §3.3) and are evaluated **by the engine**, never by the LLM. The one exception is `explain`: an LLM rubric judges it against engine facts, and it can trigger a probe but never move progress on its own.

`rapid_guess` is set when `latency_ms < floor_ms[item_type]`. The starting floors are 600 ms for tap decisions and 1,200 ms for production **[U]**.

### 3.3 Wrapper events, commands, and what the teacher sees

Events (bridge v2, salience as in science-engines §2.2):

| event | payload | salience |
|---|---|---|
| `game.start` | `game_id`, `wrapper`, `mode` | 1 |
| `game.delta` | `cause_seq`, `field`, `from`, `to` | 1 |
| `game.milestone` | `name`: `lock_open`, `shield_down`, `target_hit`, `case_closed`, `over_done`, `order_served`… | 2 |
| `game.offer` | the choices offered and the one chosen | 1 |
| `game.one_more` | `accepted` | 1 |
| `game.quit` | `at` | 2 |
| `game.end` | `result`, `acts`, `correct_first_try`, `abstract_ok`, `explain_ok`, `ms` | 2 |

Commands are sent as `game_cmd(game_id, cmd, args)`, a sibling of `module_cmd`:

| command | args / meaning |
|---|---|
| `start` | — |
| `pause` | — |
| `resume` | — |
| `timer` | `{on}` |
| `teacher_move` | `{move}`; must validate as a legal engine move |
| `hint` | — |
| `end` | — |

Observation lines are facts, not prose. Sentence-shaped text gets recited (science-engines §2.4). Example:

`[game g_4 tug-of-war team] knot=-3 target=+4 moves=3/5 last=-(-2)→misc MC.INT.SUB_SMALLER current=-1`

### 3.4 The integration lint (run by the offline reviewer agent and in CI golden tests)

| check | how it is tested | fail example |
|---|---|---|
| **L1 causality** | replay a golden trace; every `game.delta` has a `cause_seq` pointing to a `VerifiedAct` | rope moves on a "pull" button tap |
| **L2 no chance** | static scan: the progress reducer is pure `(state, VerifiedAct) → state`; no `Math.random` or seeded RNG in it | "lucky bonus over" in cricket |
| **L3 no economy** | persisted keys ⊆ {artifact, capability_statement}; no numeric field that grows across sessions | "coins earned: 40" |
| **L4 asset budget** | sprite manifest count; animation timeline empty while `probe_open`; celebration ≤ 800 ms | confetti burst; a mascot dancing during the question |
| **L6 abstract end** | the last `VerifiedAct` in `game.end` has `stage = abstract` | a shop session ends on coins only |
| **L7 opponents** | `OpponentPolicy` literal types; no `peer`/`rank` fields | "beat Riya's time" |
| **L9a remove-the-game** | render the same `modules[]` without the shell; the child-act sequence the golden script needs is identical | the escape room needs a decoy "search the room" act |
| **L9b remove-the-learning** | a fuzzer sends random taps and voice noise for 120 s; game progress must stay 0 | the fuzzer opens a lock by brute-forcing a 2-digit dial |

L9b forces a design consequence: the code space must be too large to brute-force, or the input must be built in the engine (for example, the dial accepts only an engine-built value).

L5 (timer, G10) and L8 (rapid guess and wrong-act consequence, G6 and G13) are not static checks. They are runtime assertions inside the shell, and golden traces cover them.

### 3.5 Choosing a wrapper (planner)

```ts
function eligible(ctx: { topicType: TopicType; band: BandId; phase: LessonPhase; mastery: MasteryState;
  prereqMastery: MasteryState; anxiety: boolean; interests: string[]; usedThisSession: WrapperId[] }): WrapperId[]
// 1 hard gates: §4 table "gates"; detective needs mastery ≥ learned-today; boss attempt_first needs B3-B4 and prereq ≥ practising;
//   cricket-scorer needs interest "cricket" OR an explicit pick; timer per G10.
// 2 caps: ≤ 2 wrappers per session; never the same wrapper twice in a row; wrapper minutes ≤ 40% of a lesson [U].
// 3 exploration floor: 20% of eligible practice blocks run with NO wrapper (same items) → G-E1 control arm.
// 4 offer 2-3 eligible wrappers as a spoken + tappable choice (Cordova & Lepper; Patall), record `game.offer`.
```

---

## 4. The ten wrappers

Each wrapper is a shell around one or more engine mounts. "Act = verb" is the sentence that lint L9 checks.

### W1 `personal-best@1` · *Apna Record* · timed-free challenge

| field | spec |
|---|---|
| topic types · bands · phase | T1 (tables, number bonds, sight words, Hindi varna and matras, science terms); T4 once accurate · B1 untimed only; B2–B4 timer opt-in · practice, review |
| act = verb | **retrieving the answer clears the tile.** A wrong answer sends the tile back into the pile (criterion learning). The board is clear only when every item has been retrieved correctly once |
| record shown | untimed: "12/12 cleared, 9 first try" vs *your* last run on the same set. Timed (opt-in): a count-up stopwatch vs your own best. Never a countdown, never a buzzer |
| rules | items come from the FSRS due list, interleaved (no blocked tables) · G10 timer gates · decision format (true/false, pick 1 of 2) if `anxiety` · every wrong item gets a **modelled strategy** from the teacher ("7×8 = 7×7 + 7") before requeue (Codding: drill + modelling) · G13 rapid-guess void |
| teacher role | calm coach who names strategies. She never says "jaldi" (hurry) |
| engines | `quick-item@1` (new); "show me" fallback mounts `multiply-divide@1` / `number-grid@1` / `collections@1` |
| examples | c4-maths-ch09-t01 (MC "6 × 0 = 6"); c3-maths-ch07-t02 (MC "tables must be memorised": the teacher derives instead); English and Hindi word lists |
| params | `{ itemSource: "fsrs_due" \| "set"; n: 6..20; format: "production" \| "decision" \| "mixed"; timer: "off" \| "offer"; floor_ms?: number }` |
| risk | the timer becomes the point. Check: G-E2 compares delayed fluency *and* quit rate |

### W2 `lockbox-escape@1` · *Taala Kholo* · escape room

| field | spec |
|---|---|
| topic types · bands · phase | T3, T4, T5 review · B2 (2–3 picture locks), B3–B4 (3–5 locks) · review, consolidate (end of chapter) |
| act = verb | **the combination IS the answer.** The dial takes the number the child built in the engine, the word lock takes the term, the pattern lock takes the grid state, the sequence lock takes an ordering. In `chained` mode, lock k's answer is a parameter of problem k+1, so an earlier error surfaces at the next lock |
| rules | **no countdown** (the deliberate departure from recreational rooms) · locks interleave 3–5 previously learned skills (retrieval plus interleaving; escape rooms are mostly content review, Kakos 2025) · a wrong code gives a diagnostic "click" mapped to the misconception ("dono mein 3 common hai") · after the 3rd wrong try on a lock → worked hint · the opened box holds a *relevant* fact or the child's own earlier artifact, not a prize · L9b: the code space is ≥ 10⁴ or the dial accepts only an engine-built value |
| teacher role | teammate: "let's read the clue together". She never gives the code |
| engines | `lockbox@1` (new) plus any engine as the clue source (`integers`, `fractions`, `patterns`, `indicator-lab`…) |
| examples | **c6-maths-ch05-t03** (NCERT's own "co-prime lock combinations for a treasure box"; MC "co-prime numbers must both be prime") · c7-maths-ch06-t04 (cryptarithm lock; MC "ignores carries") · c6-maths-ch10-t02 (set the dial to the colder of −5 °C Drass / −2 °C Shimla; MC "−7 > −2") |
| params | `{ locks: { kind: "dial" \| "word" \| "pattern" \| "sequence"; module: number; probe: ProbeSpec; codeFrom: "probe_value" }[]; chained: boolean; boxContent: "fact" \| "artifact" }` |
| evidence and risk | Kakos 2025: SMD 0.616 vs control (5 controlled studies, health sciences) **[V]**; Taraldsen 2022: structured K-12 research is lacking **[V]**. Risk: puzzle-hunting overhead that is not learning. L9a forbids "search the room" decoy acts |

### W3 `boss-problem@1` · *Boss Sawaal* (B2: *Bada Sawaal*) · boss problem

| field | spec |
|---|---|
| topic types · bands · phase | T5 (multi-step word problems, CBSE competency items), T3 explanations · B2 guided; B3–B4 guided or attempt-first · consolidate; attempt-first as a unit opener |
| act = verb | **each "shield" is a sub-goal verified by an engine:** model the situation (translate probe) → choose the operation → compute → check reasonableness (estimate probe) → explain. Breaking a shield *is* completing that step. The final step is the abstract solution plus a spoken explanation |
| modes | `guided`: a worked example, then faded (all bands; required for B2 and for low prior knowledge) · `attempt_first` (B3–B4, prereqs ≥ practising): the child generates ≥ 2 approaches, then the teacher consolidates. This is productive failure (g = 0.36, reversed in Grades 2–5) |
| counter-move | B3–B4 only: after a shield falls, the boss changes one parameter ("ab 5 aur log aa gaye") and the child re-solves only the affected step (variation; surprise helps higher-level students, Wouters 2017) |
| rules | no child health bar · a wrong step makes the boss "shrug" with the misconception consequence ("agar 20% upar phir 20% neeche, toh ₹100 → ₹120 → ₹96, wapas ₹100 nahi") · at most one boss per session |
| engines | `tape-diagram@1`, `balance@1`, `fractions@1`, `data-graphs@1`; science: `investigation-harness@1` |
| examples | **c8-maths-ch08-t03** ("festival sale: 30% off then 10% extra"; MC "20% rise then 20% fall returns to original") · **c6-science-ch01-t02** (design a fair test for "which cloth dries fastest"; MC "changing many things at once is quicker") · c5-maths-ch11-t03 (12 tiles, different rectangles; MC "longer rectangle has more area") |
| params | `{ mode: "guided" \| "attempt_first"; shields: { id: string; module: number; probe: ProbeSpec }[]; counterMove?: { param: string; to: unknown }; explainPrompt: string /* intent key, not a line */ }` |

### W4 `build-it@1` · *Banao* · build-a-thing

| field | spec |
|---|---|
| topic types · bands · phase | T3, T5 (and T2 sentence building) · B1–B4 · explore, practice, consolidate |
| act = verb | **the build is the answer.** A brief gives constraints that the engine checks ("both bulbs glow; the switch turns off only bulb B"). "It works" fires only when every check passes. Then the on-path secondary objective: "**make a different one**" (`variantsRequired ≥ 2`, which shows the child grasps the rule rather than one instance), then "**break it**" (predict what happens if X is removed, as POE) |
| rules | never free play without a brief (maths-engines R3) · the artifact is saved to the child's portfolio (G5; "show your parent what you made") · constraint failures are shown in-world (the bulb stays dark, the mirror half does not match) |
| engines | the `construct` probes of `circuits@1`, `symmetry@1`, `geoboard@1`, `shape-lab@1`, `patterns@1`, `ecosystem@1`, `rule-lab@1`; `sorter@1` for word tiles |
| examples | **c7-science-ch03-t01** (MC "one wire from the cell is enough"; "the bulb uses up current") · **c4-maths-ch11-t02** (complete half a rangoli; MC "copies the half without flipping") · c5-maths-ch11-t03 (rectangles of area 12, compare perimeters) · c8-science-ch12-t01 (build a pond web, remove the frog; MC "removing one organism won't affect others") |
| params | `{ module: number; constraints: Check[]; variantsRequired: 1..3; breakIt?: PoeHookId; saveArtifact: boolean }` |

### W5 `detective@1` · *Jasoos* · spot-the-mistake

| field | spec |
|---|---|
| topic types · bands · phase | T4, T3, T5 · B3–B4 main; B2 single-step cases only · practice after mastery ≥ learned-today, review |
| act = verb | **a case file is a fictional character's worked solution, explanation, diagram or experiment report with exactly one planted error**, drawn from the curriculum misconception list. Solving the case means (1) tap the wrong step, (2) say why (voice), (3) fix it in the engine (fix verified by engine maths). The case closes only when all three pass |
| rules | ~25% of cases have **no error** (`cleanCaseShare`), so the child does not learn "there is always a mistake" · "two suspects" variant: two solutions, one wrong (a contrast) · the character is fictional ("Bittu"), never a classmate, never the child's own work · the teacher praises the reasoning, not the catch |
| engines | `case-file@1` (new) for text, diagram and report cases; the `spot_error` probe of any maths engine for in-engine cases |
| examples | **c7-maths-ch03-t03** (Bittu says 0.125 > 0.5) · c6-maths-ch06-t02 (area written in cm) · **c8-science-ch12-t01** (food-chain arrows point to the food) · **c6-science-ch04-t01** (a "report" that a ₹1 coin and aluminium foil stuck to the magnet) |
| params | `{ cases: { worked: CaseDoc; planted: MiscId \| null; errorAt: string \| null; fixModule?: number }[]; variant: "single" \| "two_suspects" }` |
| evidence | McLaren 2015 (delayed d = 0.33; liked less); Decimal Point 0.37 delayed; Nguyen 2022 (girls gained through careful self-explanation) **[V]** |

### W6 `tug-of-war@1` · *Rassa-kashi* · tug-of-war

| field | spec |
|---|---|
| topic types · bands · phase | T4, T3: integers, fraction and decimal magnitude, estimation, number sense · B1 (0–20 whole-number track, team mode only), B2–B4 · practice |
| act = verb | **the knot sits on a number line, and a pull adds a signed quantity.** The child picks or speaks the pull that lands the knot *exactly* on the flag, within `maxMoves`. The other side's pull (the river current, or the teacher in rival mode) shifts the knot, and the child computes the compensation. The knot position *is* the running sum on the hub representation (maths-engines §0.5) |
| modes | `team` (default): child plus teacher vs the "current" (seeded *before* each turn, shown before the child chooses, so no chance affects the outcome; G3) · `rival` (B3–B4 opt-in): the teacher's pulls are legal moves she reasons aloud about (modelling) · `estimate`: unticked line, tolerance by PAE |
| rules | after every pull, the symbol updates live (`knot = -3 + (-(-2)) = -1`; maths-engines R4 linking) · a wrong pull really moves the knot the wrong way (the in-world consequence) and the teacher names the misconception · the round ends with one equation written without the rope (G8) |
| engines | `tug@1` (new; reuses `number-line@1` and `integers@1` internals) |
| examples | **c6-maths-ch10-t03** (MC "subtracting always makes smaller, even 3 − (−2)") · c6-maths-ch10-t02 · c5-maths-ch02-t02 (fraction pulls; MC "1/8 > 1/4") · c7-maths-ch03-t03 (decimal pulls) |
| params | `{ domain: "int" \| "frac" \| "dec"; range: [number, number]; target: MathValue; maxMoves: 2..6; cards?: MathValue[]; current: MathValue[]; mode: "team" \| "rival" \| "estimate"; tolerancePAE?: number }` |
| evidence and risk | linear representations (Siegler & Ramani; Hamdan & Gunderson, via maths-engines); The Number Race improved symbolic comparison but not non-symbolic (Wilson 2009, n = 53) **[V]**. James-Brabham 2024 is null vs teaching as usual **[V]**, so the expected effect comes from guided linking, not from the rope |

### W7 `dukaan@1` · *Kirana Dukaan / Mela Stall / Haat* · market-shop simulation

| field | spec |
|---|---|
| topic types · bands · phase | T5 applied, T4 money operations, T3 economics (SST) · B1: buy within ₹10–20 · B2: total and change up to ₹100 · B3: unit price, profit and loss, estimates · B4: percentage chains, discounts, demand and supply · practice, consolidate |
| act = verb | **every transaction is the maths.** The teacher plays the customers. The child totals, gives change (by dragging stylised coins and notes in `money@1`, integer paise), or decides a restock within budget. The **ledger (cash, stock) is the game state** and changes only through verified transactions. Roles swap: the child can be the buyer (budget) or the seller (change, profit) |
| bridge rule (Banerjee) | every 3rd transaction is followed by its **school-format twin** with the same numbers (`50 − 35 = ?` written) and, in the next session, the reverse (abstract → "who is buying what?"). Mental strategies (rounding, compensation, "35 se 40, phir 50") are accepted, named and credited. The session ends written (G8). Both formats are logged per skill → G-E5 |
| rules | ₹ amounts reset each session (G5); nothing in a game is ever purchasable; no "satta" or odds language · coins and notes are flat stylised drawings, not replicas (maths-engines E14; detailed play money raised calculation errors, McNeil 2009) · `skin` is the child's choice: kirana, mela or haat |
| engines | `money@1` (maths E14) plus `shop@1` (new scenario and ledger) |
| examples | c1-maths-ch12-t02 (₹10 at the mela; MC "the money left over is lost") · **c2-maths-ch10-t02** (₹35 toy with a ₹50 note; MC "change equals the price") · c8-maths-ch08-t03 (sale chains) · c7-sst-ch12-t01 (haat vs mall) · c9-sst-ch09-t01 (why tomato prices jump; MC "shopkeepers alone decide prices": the child sets prices and sees demand respond) |
| params | `{ role: "seller" \| "buyer"; skin: "kirana" \| "mela" \| "haat"; orders: Order[]; budget?: Paise; priceModel?: "fixed" \| "demand_curve"; twinEvery: 2..4; twinDirection: "to_abstract" \| "from_abstract" }` |

### W8 `cricket-scorer@1` · *Scorer Saab* · cricket-score game

| field | spec |
|---|---|
| topic types · bands · phase | T4, T5 maths: overs notation and decimals, rates, mean, percentages, bar and line graphs, chance · B2 (runs and simple totals), B3–B4 · practice, consolidate · **interest-gated** |
| act = verb | **the child is the official scorer and the captain's analyst in a scripted run chase.** The match advances only when the scoreboard number is right. Checkpoints: balls from overs (`4.3 ov = 27 balls`), current run rate, required run rate, strike rate (runs/balls × 100), batter's average (runs per dismissal), the Manhattan bar chart (runs per over) and the worm (cumulative line). The captain's decision (who bowls, whether to attack) *depends on* the child's number. The scorer's sheet is the game |
| rules | ball outcomes are **pre-scripted per seed and fixed before the child acts** (G3; no "lucky over") · thin framing (Clark: relevant stories did not beat none) · gambler's-fallacy probe at the toss for B4 (no stakes, no betting talk) · ends with the abstract stat written ("RR = runs ÷ (balls ÷ 6)") |
| teacher role | the commentator: "Scorer saab, required rate kya hai?" Her pacing is the match's pacing |
| engines | `cricket@1` (new) plus `data-graphs@1` (Manhattan, worm) plus `chance@1` (toss) |
| examples | **c7-maths-ch03-t02** (NCERT hook "why 4.3 overs is not 4.3 in decimals") · c7-maths-ch13-t02 (average runs; MC "the mean must be a data value"; "ignores extreme values") · **c6-maths-ch04-t03** (IPL runs bar graph; MC "scale not starting at zero") · c8-maths-ch08-t02 (strike rate as a percentage) · c9-maths-ch07-t02 (toss; MC gambler's fallacy) |
| params | `{ format: "T20" \| "ODI" \| "gully6"; script: BallEvent[] /* fixed */; checkpoints: ("balls_from_overs" \| "crr" \| "rrr" \| "strike_rate" \| "average" \| "manhattan" \| "worm")[]; decisionAt: number[] }` |
| risk | cricket is not universal (interest and gender) → offer it only through interest tags or explicit choice; a `kabaddi` raid-points skin is a later **[U]** option |

### W9 `sort-rule@1` · *Chhanto / Mera Niyam Kya Hai?* · sort and guess-my-rule

| field | spec |
|---|---|
| topic types · bands · phase | T2 (categories, parts of speech, Hindi ling/vachan), T3 (classification: materials, plants, animals, waste, angles, shapes) · B1–B4 · explore, practice |
| act = verb | **placing an item in a bin is the classification.** `sort` mode has labelled bins. In `rule` mode the teacher holds a secret rule, the child infers it from feedback on placements, then **states the rule** (an explain act) and sorts a transfer item. A misplacement is evaluated against the criterion and mapped to a misconception |
| rules | item sequence uses **contrast pairs** that differ only in the target feature (maths-engines `contrast` principle): steel spoon vs aluminium spoon · images are drawn from the reviewed offline library (gpt-image-2 at ~23 s/image is too slow live) · B1: ≤ 2 bins and pictures plus speech; B3–B4: up to 4 bins and "odd one out" rounds |
| engines | `sorter@1` (new) |
| examples | c3-evs-ch12-t01 (wet/dry waste; MC "waste in a dustbin disappears") · **c6-science-ch04-t01** (magnetic vs not; MC "magnets attract all metals including aluminium, copper and coins") · c6-science-ch02-t01 (herb, shrub, tree by stem; MC "all trees are tall") · c6-maths-ch02-t04 (angle types) · English nouns/verbs; Hindi ling |
| params | `{ mode: "sort" \| "rule"; bins: { id: string; label?: L10n }[]; items: { id: string; asset: string; label: L10n; truth: string; misc?: MiscId }[]; rule?: { id: string; describe: L10n }; transferItems: number }` |

### W10 `word-chain@1` · *Shabd Antakshari* · voice word-chain

| field | spec |
|---|---|
| topic types · bands · phase | T2: vocabulary, phonics, rhyme, opposites, plurals, Hindi matras, Hindi↔English pairs · B1–B3 (B4 optional: synonyms, idioms) · warmup, practice, review |
| act = verb | **the word is the move.** Turn-taking with the teacher; every word must satisfy the round's constraint (starts with the last sound, rhymes, is the opposite, has the "ā" matra, fits category X, is a translation). The engine judges it deterministically against a graded lexicon (class-banded en and hi lists, regional variants accepted) |
| rules | at most 1 in 4 of the teacher's own turns is a **deliberate slip**, and the child can challenge it ("Galti pakdo!"). That is word-level spot-the-mistake, and it makes the child the checker · no time limit: a Sesame-style 6–8 s wait, then a glow, then a first-sound hint · ASR confidence below threshold → confirm, or offer 3 tappable options (child ASR is unreliable; learning-science §1.10) · each accepted word is shown as text with karaoke highlight (dual coding; kids-ux) · never correct accent, only the constraint |
| engines | `word-chain@1` (new) with lexicon packs |
| examples | c2-english-ch01-t01 rhymes · c6-hindi poems (rhythm, matras) · c6-english-ch01-t01 chapter vocabulary |
| params | `{ lang: "en" \| "hi" \| "pair"; constraint: "last_sound" \| "rhyme" \| "opposite" \| "matra" \| "category" \| "translate" \| "plural"; arg?: string; lexicon: string; rounds: 4..12; teacherSlips: 0..3 }` |
| evidence and risk | vocabulary-game meta-analyses are positive but heterogeneous: design features moderate (Chen 2018) **[V]**; a 2026 Bayesian meta gives g ≈ 1.1 within-group for commercial games, with weak designs **[V]**. GraphoGame shows null overall but **g = 0.48 with adult interaction** **[V]**, and here the teacher *is* the adult turn-taker. Risks: children's Hindi ASR, dialect, shame over pronunciation |

---

## 5. New engines (all follow maths-engines §3 and science-engines §2; they emit `probe_result` and `goal_met`)

| engine | purpose | params (zod, abridged) | events | detectors | budget |
|---|---|---|---|---|---|
| `quick-item@1` | fast, single-item retrieval renderer (tap or voice) | `{ items: { id; prompt: L10n; answer: MathValue \| string; format: "production" \| "decision"; distractors?: { value; misc }[] }[]; floor_ms; showStopwatch: boolean }` | `qi.shown{id}` · `probe_result` · `qi.requeue{id}` · `qi.rapid{id,ms}` | rapid-guess; repeated identical wrong (a strong misconception) | ≤ 40 kB gz |
| `lockbox@1` | dial, word, pattern and sequence locks fed by another module's committed value | `{ locks: { kind; codeFrom: { module; probe } ; space: number }[]; chained: boolean }` | `lb.try{lock,value}` · `lb.open{lock}` · `lb.click{lock,misc}` | brute-force (> 3 tries in 10 s → `gaming`) | ≤ 50 kB |
| `tug@1` | number-line rope; signed pulls; live equation | `{ domain; range; target; current: MathValue[]; cards?: MathValue[]; maxMoves; tolerancePAE? }` | `tg.pull{value,from,to}` · `tg.current{value}` · `goal_met` · `probe_result` | `MC.INT.SUB_SMALLER` (−(−a) moved left); `MC.INT.NEG_MAGNITUDE`; `MC.FRAC.BIGGER_DENOM` | ≤ 60 kB |
| `shop@1` | orders, stock, prices, ledger; drives `money@1` | `{ role; skin; orders; budget?; priceModel; twinEvery; twinDirection }` | `sh.order{id}` · `sh.txn{total,given,change,ok}` · `sh.twin{format,ok}` · `sh.price{item,price,demand}` | change = price (c2); leftover lost (c1); "+20%−20% = 0" (c8); "seller sets price alone" (c9 SST) | ≤ 80 kB |
| `cricket@1` | scripted chase, scoreboard, checkpoint probes; renders through `data-graphs@1` | `{ format; script; checkpoints; decisionAt }` | `cr.ball{over,ball,runs,wkt}` · `cr.check{kind,value,ok}` · `cr.decision{choice}` | overs-as-decimal (4.3 → 4.3); mean-is-a-datum; scale-not-from-zero; gambler's fallacy | ≤ 90 kB |
| `sorter@1` | drag or tap items into bins; hidden-rule mode | `{ mode; bins; items; rule?; transferItems }` | `so.place{item,bin,ok}` · `so.rule_guess{text}` · `probe_result` | per-item `misc`; criterion confusion (sorting by size when the rule is stem) | ≤ 50 kB |
| `case-file@1` | render worked steps, diagrams or reports with a planted error; find, explain, fix | `{ doc: { steps: { id; text: L10n; math?: string; fig?: string }[] }; planted: MiscId \| null; errorAt: string \| null }` | `cf.flag{step}` · `cf.explain{chars}` · `cf.fix{ok}` · `probe_result` | false-alarm rate on clean cases; flags the right step but gives a wrong reason | ≤ 50 kB |
| `word-chain@1` | voice turn engine, lexicon judge, teacher-slip scheduler | `{ lang; constraint; arg?; lexicon; rounds; teacherSlips }` | `wc.turn{who,word,ok,asr_conf}` · `wc.challenge{caught}` · `probe_result` | accepts a slip (missed challenge); constraint confusion (rhyme vs same first letter) | ≤ 40 kB plus lexicon (≤ 300 kB per pack, lazy) |

Shared shell: `packages/games/shell` (host-side React) holds the reducer, the lint hooks, the in-world celebration slot, and the choice offer. Its target is ≤ 60 kB gz, at 360 × 640 in a WebView **[U]**.

---

## 6. Coverage: wrapper × topic type × band

| wrapper | T1 | T2 | T3 | T4 | T5 | B1 | B2 | B3 | B4 | phase |
|---|---|---|---|---|---|---|---|---|---|---|
| personal-best | ● | ● | | ● | | ● untimed | ● | ● | ● | practice, review |
| lockbox-escape | | ◐ | ● | ● | ● | | ◐ | ● | ● | review, consolidate |
| boss-problem | | | ◐ | | ● | | ◐ guided | ● | ● | consolidate, opener (B3–B4) |
| build-it | | ◐ | ● | | ● | ● | ● | ● | ● | explore, practice, consolidate |
| detective | | ◐ | ● | ● | ● | | ◐ | ● | ● | practice after mastery, review |
| tug-of-war | | | ◐ | ● | | ◐ team | ● | ● | ● | practice |
| dukaan | | | ◐ (SST) | ● | ● | ● | ● | ● | ● | practice, consolidate |
| cricket-scorer | | | | ● | ● | | ◐ | ● | ● | practice (interest-gated) |
| sort-rule | | ● | ● | | | ● | ● | ● | ● | explore, practice |
| word-chain | ◐ | ● | | | | ● | ● | ● | ◐ | warmup, practice, review |

Gaps, deliberately unfilled:
- T1 verbatim *sequences* (varnamala order, poem recitation) belong to F5 chant and song (learning-science rule 24), not to a game.
- T3 "why" explanations in science stay with `poe-harness`. The game wrappers consume POE acts but add no game layer on top of a surprise reveal.

---

## 7. What to measure (gates before a wrapper ships widely)

| id | experiment | primary outcome | kill or keep rule |
|---|---|---|---|
| **G-E1** | each wrapper vs the **same items and engines with no wrapper** (the planner's 20% floor), randomised per practice block | delayed success at the next session and at 7 days, plus near transfer, on matched skills (learning-science §8.4) | drop or redesign a wrapper whose delayed-success difference has a posterior < 0.8 of being > 0 after the planned n, *unless* it is non-inferior on learning and clearly better on voluntary continuation (engagement as a constraint, not an objective) |
| **G-E2** | `personal-best` timed vs untimed (eligible B2–B4) | delayed fluency (correct per minute at the next session, untimed probe) and accuracy | stop timers for any band where quit rate or anxiety self-report (a 3-face scale) rises by ≥ 5 pp [U] |
| **G-E3** | `boss-problem` attempt-first vs guided (B3–B4, prereqs met) | 7-day transfer item | if attempt-first is not ≥ guided, default to guided (Sinha & Kapur predicts a gain at Grades 6+) |
| **G-E4** | `tug-of-war` team vs rival (B3–B4 opt-in) | delayed integer and fraction items; opt-in rate | rival stays opt-in at most; never default |
| **G-E5** | `dukaan` bridge on vs off | the **format gap**: market-format accuracy minus abstract-format accuracy on the same numbers | expect the gap to shrink; if it doesn't, increase `twinEvery` density |
| **G-E6** | spoken "why" prompt vs none, within wrappers | delayed success; explanation quality | keep if non-inferior on time and ≥ on delayed |
| **G-E7** | lint audit: the offline reviewer agent runs L1–L9 on every T1 game spec; a human reviews 5% | lint pass rate; false negatives found by human review | any L1/L9 escape blocks the wrapper version |

**Instrumentation.** `game.end` carries `acts`, `correct_first_try`, `abstract_ok`, `explain_ok`, `ms`, and `quit`. These events join the learner ledger by `topic_id` and `skill_ids`. Engagement fields are logged, but never feed the format bandit as reward (learning-science §8.4; dpdp NM-8).

---

## 8. Risks and open questions

1. **Small true effects.** The priors (maths d = 0.13, ST Math null, high-quality subset ns) say most wrappers will be roughly neutral on learning. Their honest value may be *choice and recurrence* at no learning cost. G-E1 decides. The parent copy must not claim "games make learning better" until it does.
2. **Liking ≠ learning.** `detective` will poll worse than `dukaan` (McLaren 2015). Any engagement dashboard must show delayed learning next to liking.
3. **Teacher voice latency inside fast loops.** `personal-best` and `word-chain` need sub-second turn-taking. Earcons and the in-world change carry immediate feedback, and the teacher speaks only on salience-2 milestones (science-engines §2.2) **[U]**.
4. **Child ASR in Hindi.** `word-chain` depends on it. A tap fallback is mandatory. Measure the false-reject rate per band before launch.
5. **Legal.** dpdp-deep Q11 (gaming intermediary) is still open. The design keeps it simple (no stakes, no currency, subscription-only revenue), but counsel must confirm **[U]**.
6. **Cultural fit and inclusion.** Cricket and some shop contexts skew urban and male. Choices and interest tags mitigate this. Watch offer-acceptance rates by gender (Decimal Point shows games can *narrow* gender gaps; Nguyen 2022) **[V]**.
7. **LLM-filled game specs.** The 3.5% one-shot pass rate (tech-and-market) means wrappers must be T0 code. The LLM fills only `params`, and lint L1–L9 plus the engine's zod schemas gate every spec. Free-form generated "games" stay offline-only, with review.

---

## Sources

**Meta-analyses and reviews**
- Clark, D. B., Tanner-Smith, E. E., & Killingsworth, S. S. (2016). Digital games, design, and learning: A systematic review and meta-analysis. *RER* 86(1), 79–122. https://doi.org/10.3102/0034654315582065 · full text: https://europepmc.org/article/PMC/PMC4748544 **[V full text]**
- Wouters, P., van Nimwegen, C., van Oostendorp, H., & van der Spek, E. D. (2013). *J Ed Psych* 105(2). https://eric.ed.gov/?id=EJ1008015 **[V]**
- Wouters, P., & van Oostendorp, H. (2013). Instructional support in game-based learning. *C&E*. https://eric.ed.gov/?id=EJ1006979 **[V]**
- Sailer, M., & Homner, L. (2020). The gamification of learning: a meta-analysis. *EPR* 32. https://eric.ed.gov/?id=EJ1245270 · https://doi.org/10.1007/s10648-019-09498-w **[V]**
- Mayer, R. E. (2019). Computer games in education. *Annu Rev Psych* 70. https://doi.org/10.1146/annurev-psych-010418-102744 **[V abstract]**; Mayer, R. E. (2014). *Computer Games for Learning: An Evidence-Based Approach*. MIT Press **[M]**; Mayer (2015), *Ed Psych* commentary: https://eric.ed.gov/?id=EJ1090282 **[V]**
- Tokac, U., Novak, E., & Thompson, C. G. (2019). *JCAL*. https://eric.ed.gov/?id=EJ1214508 **[V]**
- Tsai, Y.-L., & Tsai, C.-C. (2020). *JCAL*. https://eric.ed.gov/?id=EJ1253796 **[V]**
- Byun, J., & Joung, E. (2018). *School Science and Mathematics*. https://eric.ed.gov/?id=EJ1175390 **[V]**; Wang, L.-H., Chen, B., & Hwang, G.-J. (2022). *IJ STEM Ed*. https://eric.ed.gov/?id=EJ1330260 **[V]**
- Chen, C.-H., Shih, C.-C., & Law, V. (2020). Competition in DGBL. *ETR&D*. https://eric.ed.gov/?id=EJ1266151 **[V]**
- Ke, F. (2016). Designing and integrating purposeful learning in game play. *ETR&D*. https://eric.ed.gov/?id=EJ1094502 **[V]**
- Arnab, S., et al. (2015). LM-GM model. *BJET*. https://eric.ed.gov/?id=EJ1055183 **[V]**
- Plass, J. L., Homer, B. D., & Kinzer, C. K. (2015). Foundations of game-based learning. *Ed Psych*. https://eric.ed.gov/?id=EJ1090277 **[V]**
- Sinha, T., & Kapur, M. (2021). Productive failure. *RER*. https://eric.ed.gov/?id=EJ1308129 **[V]**
- Wong, R. M., & Adesope, O. O. (2021). Emotional designs. *EPR*. https://eric.ed.gov/?id=EJ1295978 **[V]**
- McTigue, E. M., et al. (2020). GraphoGame review and meta-analysis. *RRQ*. https://eric.ed.gov/?id=EJ1238280 **[V]**
- Kakos, N. J., et al. (2025). Educational escape rooms meta-analysis. *Adv Health Sci Educ*. https://eric.ed.gov/?id=EJ1484815 **[V]**; Taraldsen, L. H., et al. (2022). *Education Inquiry*. https://eric.ed.gov/?id=EJ1341276 **[V]**; Veldkamp, A., et al. (2020). Escape boxes. *BJET*. https://eric.ed.gov/?id=EJ1257329 **[V]**
- Özdemir, O. (2025). Kahoot! meta-analysis. *JCAL*. https://eric.ed.gov/?id=EJ1459023 **[V]**
- Codding, R. S., Burns, M. K., & Lukito, G. (2011). Basic-fact fluency interventions. *LDRP*. https://eric.ed.gov/?id=EJ927934 **[V]**
- Caviola, S., Carey, E., Mammarella, I. C., & Szűcs, D. (2017). Stress, time pressure, strategy selection and math anxiety. *Front Psychol*. https://doi.org/10.3389/fpsyg.2017.01488 **[V]**
- Chen, M.-H., Tseng, W.-T., & Hsiao, T.-Y. (2018). DGBL vocabulary meta-analysis. *BJET*. https://eric.ed.gov/?id=EJ1166075 **[V]**; Shahiwala, S., & Rahul, D. R. (2026). *JCAL*. https://eric.ed.gov/?id=EJ1506850 **[V]**; Dixon, D. H., et al. (2022). *LLT*. https://eric.ed.gov/?id=EJ1336169 **[V]**

**Primary studies**
- Habgood, M. P. J., & Ainsworth, S. E. (2011). Intrinsic integration (Zombie Division). *JLS* 20. https://eric.ed.gov/?id=EJ922627 **[V]**
- Echeverría, A., Barrios, E., Nussbaum, M., et al. (2012). Atomic intrinsic integration. *C&E*. https://eric.ed.gov/?id=EJ967019 **[V]**
- Andersen, E., Liu, Y.-E., Snider, R., Szeto, R., Cooper, S., & Popović, Z. (2011). On the harmfulness of secondary game objectives. *FDG '11*. http://grail.cs.washington.edu/projects/game-abtesting/fdg2011/fdg2011.pdf **[V full text]**
- Lomas, D., Patel, K., Forlizzi, J., & Koedinger, K. (2013). Optimizing challenge in an educational game. *CHI '13*. https://doi.org/10.1145/2470654.2470668 **[V abstract via Semantic Scholar]**
- Hanus, M. D., & Fox, J. (2015). *C&E* 80. https://doi.org/10.1016/j.compedu.2014.08.019 **[S]**; Mekler, E. D., et al. (2017). *CHB*. https://doi.org/10.1016/j.chb.2015.08.048 **[S]**
- Balci, S., Secaur, J. M., & Morris, B. J. (2022). https://eric.ed.gov/?id=EJ1346201 **[V]**; Balci, S. (2022), dissertation. https://eric.ed.gov/?id=ED631311 **[V]**
- McLaren, B. M., Adams, D. M., & Mayer, R. E. (2015). Delayed effects of erroneous examples. *IJAIED*. https://eric.ed.gov/?id=EJ1078813 **[V]**
- McLaren, B. M., Adams, D. M., Mayer, R. E., & Forlizzi, J. (2017). Decimal Point. *IJGBL*. https://eric.ed.gov/?id=EJ1119846 **[V]**; Nguyen, H. A., et al. (2022). *IJGBL*. https://eric.ed.gov/?id=EJ1384664 **[V]**
- Rutherford, T., et al. (2014). ST Math RCT. *JREE*. https://eric.ed.gov/?id=EJ1041346 **[V]**; Rutherford, T., et al. (2020). https://eric.ed.gov/?id=EJ1240017 **[V]**
- James-Brabham, E., Jay, T., Sella, F., et al. (2024). *J Ed Psych*. https://eric.ed.gov/?id=EJ1418952 **[V]**; Wilson, A. J., Dehaene, S., et al. (2009). The Number Race. *MBE*. https://eric.ed.gov/?id=EJ862465 **[V]**
- ter Vrugte, J., de Jong, T., Wouters, P., et al. (2015). *JCAL*. https://eric.ed.gov/?id=EJ1074761 **[V]**; Wouters, P., van Oostendorp, H., ter Vrugte, J., et al. (2017). Surprise. *BJET*. https://eric.ed.gov/?id=EJ1135966 **[V]**; Hsu, C.-Y., & Tsai, C.-C. (2013). *ILE*. https://eric.ed.gov/?id=EJ1011183 **[V]**; Yang, X. (2023), dissertation. https://eric.ed.gov/?id=ED644609 **[V]**
- Sorvo, R., et al. (2017). *BJEP*. https://eric.ed.gov/?id=EJ1150858 **[V]**; Yao, X., Huber, J. F., Li, Z., et al. (2026). *npj Sci Learn*. https://eric.ed.gov/?id=EJ1504789 **[V]**
- Cordova, D. I., & Lepper, M. R. (1996). *J Ed Psych*. https://eric.ed.gov/?id=EJ540338 **[V]**; Høgheim, S., & Reber, R. (2017). *J Exp Educ*. https://eric.ed.gov/?id=EJ1150854 **[V]**; Bernacki, M. L., & Walkington, C. (2018). *J Ed Psych*. https://eric.ed.gov/?id=EJ1187647 **[V]**
- Banerjee, A. V., Bhattacharjee, S., Chattopadhyay, R., Duflo, E., Ganimian, A. J., Rajah, K., & Spelke, E. S. (2025). Children's arithmetic skills do not transfer between applied and academic mathematics. *Nature*. https://doi.org/10.1038/s41586-024-08502-w **[V]** (authors verified via Europe PMC)

**India, law, products**
- PRS Legislative Research. The Promotion and Regulation of Online Gaming Bill, 2025. https://prsindia.org/billtrack/the-promotion-and-regulation-of-online-gaming-bill-2025 **[S]**
- Fairplay (formerly CCFC) et al. (2021). FTC complaint on Prodigy. https://fairplayforkids.org/prodigy/ **[S]**; Brooks, C. D. (2022). Prodigy and Grade 3 achievement. https://eric.ed.gov/?id=ED649404 **[V]**
- NCERT hooks quoted from `data/curriculum/c{1..9}-*.json` (verified 2026-10-02 per that dataset's `verifiedOn`).


---

## Engineering review

**Reviewer:** senior frontend/game engineer pass, 2026-10-02. **Method:** read-through of §0-§8 against a React 19/TS (host) + vanilla-TS canvas/SVG (engines) build on Android WebView, ₹10k-class phone (assumed 2-3 GB RAM, Mali-G52/Adreno 610, WebView possibly Chrome 80-100). It reuses the platform conventions fixed in `maths-engines.md` Engineering review (C2 no zod in iframes, C3 vanilla TS on a shared `engine-kit`, C4 one iframe at a time, C5 ES2019 target, R.3 SVG ≤ ~250 nodes else canvas). **No code was run and no device was benchmarked; every number is [U] (engineering estimate) until a device-lab pass.** Effort scale as in maths-engines: **S** ≤ 2 days, **M** 3-5, **L** 6-10, one engineer, shared `engine-kit` and the maths/science engines the wrapper reuses already built; excludes art, audio, content packs, device-lab time.

### E.1 Verdict

1. **The wrapper concept is sound and cheap; five of the eight new engines are not 2-day builds.** Only `quick-item` and `sorter` fit in 2 days. `lockbox` should stop being an engine (see C3). `shop`, `cricket` and `word-chain` are L. `case-file` is M-L because of math rendering and fix verification.
2. **60 fps is achievable for all ten wrappers** if (a) one iframe is live at a time, (b) `tug`/`cricket` draw on canvas, (c) timers and tweens update DOM text and transforms, not React state. The real device risk is **memory and cold start from multi-iframe wrappers**, not frame rate (C2).
3. **Contract gaps that will bite in implementation:** the engine budgets in §5 presuppose a React-free engine + kit (C1); LLM-authored `params` are too free-form for four wrappers (P-section); several events cannot support the teacher's observation or the lint (V-section); five safety issues (S-section), two of them real.
4. **Most important corrections, ranked:** C2 multi-iframe composition, P1 generators-not-arrays, S1 child text into the teacher prompt, C5 KaTeX budget in `case-file`, C8 `word-chain` rhyme/last-sound cannot be done from a 300 kB pack without precomputed keys, S3 deliberate-slip policy for B1.

### E.2 Corrections to the contract and engines (C-series)

| id | issue | evidence in this file | correction |
|---|---|---|---|
| **C1** | §5 budgets (40-90 kB gz "per engine") and the shell (≤ 60 kB gz) are only reachable if engines do not bundle React or zod. React 19 + react-dom is ~45 kB gz [M]; zod ~13 kB gz [M] (maths-engines C2, C3). `GameManifest.paramsSchema: ZodType<P>` also puts zod on the shared server/host path, which is fine, but must not ship into engine iframes | §3.1, §5 | Engines = vanilla TS on `engine-kit`; budgets in §5 are **on top of the kit**. `paramsSchema` lives host/server side only; the iframe gets clean JSON plus `clamp()`. Generate the LLM JSON Schema from the zod source at build time |
| **C2** | **Multi-iframe wrappers.** W2 mounts `lockbox` plus a clue engine; W8 mounts `cricket` + `data-graphs` + `chance`; W3 mounts up to 4 engines; `GameSpec.modules[]` is "1..n engine mounts". maths-engines C4 measured the opposite rule: one live iframe, a canvas iframe is 30-60 MB [U]. Three live iframes on a 2 GB phone risks WebView renderer OOM, and the teacher loop is running at the same time | §3.1, §4 W2/W3/W8 | Rule: **at most 1 live engine iframe per wrapper at a time.** Composite wrappers sequence mounts (mount, commit, destroy, mount next; the host keeps the committed value). `cricket@1` renders its own Manhattan/worm bars (they are 2 simple canvas charts, not `data-graphs@1`) and does the toss as a built-in 1-screen sub-mode. Cap `modules.length` at 3 and lint it |
| **C3** | **`lockbox@1` is not an engine.** Its value is "fed by another module's committed value" (§5, `codeFrom`). A sandboxed iframe cannot read another iframe's committed state, so the host must route values, and then the lock is only a dial/word/pattern widget that accepts a host-injected value. It also needs L9b (accepts only an engine-built value), which is a host-side check | §4 W2, §5, §3.4 L9b | Make it a **host-side shell component** (`<LockPanel>` in the shell, ~6 kB gz) that holds locks, accepts a `VerifiedAct.value`, and renders the diagnostic click. Cost drops from "engine" (M) to S for dial + word, M with pattern and sequence locks. Brute-force protection is automatic: the dial has no free input |
| **C4** | **Latency timestamps.** `latency_ms` and `rapid_guess` (G13, floors 600/1200 ms [U]) are only meaningful if measured from the frame the item was actually painted to the pointer-down, **inside the engine** (`requestAnimationFrame` after render, `performance.now()` at `pointerdown`). Measuring in the host adds postMessage + a frame and a janky WebView frame inflates it, so a slow phone will mis-flag nothing but a fast child on a slow phone will look slower, and tap decisions under 600 ms on a `quick-item` board will be mis-sorted | §3.2, G13 | Spec: engine stamps `shown_at` (post-paint) and `acted_at`; `latency_ms = acted_at - shown_at`. Host never recomputes. Floors are per-device calibrated: median tap-to-event latency on a calibration screen (3 taps at session start), floor = max(floor, 1.5 x calibrated). Mark floors [U] until data |
| **C5** | **`case-file` budget and math rendering.** `CaseDoc.steps[].math?: string` implies a formula renderer. KaTeX is ~75 kB gz + fonts [M]; that alone exceeds the 50 kB budget. MathML Core only landed in Chromium 109, so it is unavailable on an old WebView | §5 `case-file@1` | Restrict `math` to a **constrained plain-text/Unicode expression grammar** (`+ - × ÷ / ^ ( ) = < >`, fractions as `a/b` rendered by a tiny stacked-fraction painter in the kit). Verification of "fix is correct" uses the kit's rational-arithmetic evaluator on the same grammar. No KaTeX. Reports and diagrams (`fig`) are pre-rendered SVG assets from the offline library |
| **C6** | **Devanagari font.** `word-chain`, `sorter` Hindi labels, `quick-item` Hindi items, and every `L10n` need a Devanagari face. Noto Sans Devanagari is hundreds of kB; a sandboxed iframe with opaque origin does not share the host's font cache reliably [U] | §5 | The host owns fonts and loads one subset (Devanagari + Latin + digits + ₹); engines get glyph rendering via `FontFace` injected by `engine-kit` from the APK-local file (C4 of maths-engines). Verify in the device lab that the opaque-origin frame resolves the same cached font; if not, inline a ~40 kB WOFF2 subset |
| **C7** | **Timer implementation.** `personal-best` count-up stopwatch must not re-render React every frame. It must also survive backgrounding: Android WebView pauses timers when the app is backgrounded, and `Date.now` deltas then include minutes away | §4 W1, G10 | Stopwatch = `textContent` update at ≤ 4 Hz from `performance.now()`; **pause on `visibilitychange` and on host `pause`**; a run containing a pause > 5 s is recorded `valid:false` and is not a personal best. `game.pause`/`game.resume` events needed (V2) |
| **C8** | **`word-chain` lexicon claim.** "Rhyme" and "last_sound" are phonetic, not orthographic. English rhyme needs a pronunciation source (CMUdict is ~3.5 MB raw [M]); Hindi last-sound needs schwa-deletion and matra handling. A 300 kB pack cannot carry that at runtime | §4 W10, §5 | Precompute **per-word keys offline** (`rhymeKey`, `onset`, `lastSound`, `matras[]`, `grade`, `pos`) with a reviewed build step and store only keys + words in the pack (~15-25 bytes/word, ~10k words/pack ≈ 250 kB raw, ~90 kB gz [U]). Hindi: segment with `Intl.Segmenter('hi', {granularity:'grapheme'})` where available, else a hand-written conjunct/matra segmenter in the kit (old WebView may lack it). `rhyme` for Hindi limited to a curated list of rhyme families; do not attempt generic Hindi rhyme detection in v1 |
| **C9** | **Rival mode and demand curve are scope creep for v1.** `tug` `rival` mode needs a legal-move search for the teacher's pulls, with narration; `shop` `demand_curve` is a small economic simulation that doubles the test surface | §4 W6, W7 | v1 = `team` (+ `estimate` for `tug`) and `fixed` price model. Rival mode and `demand_curve` are v1.1; they are opt-in/B4 only anyway (G-E4) |
| **C10** | **`GameSpec.modules: ModuleSpec<unknown>[]` loses type safety**, so the validator cannot know that W2 `locks[].module` is a valid index, nor that `probe` matches the engine | §3.1 | Make `GameSpec` a **discriminated union on `wrapper`**, with per-wrapper param types that reference modules by stable string key (`"m_clue1"`), and a cross-reference validator (module key exists, probe id exists in that engine's `probes[]`). Reject, do not repair |
| **C11** | **`VerifiedAct.stage` is required** but `sorter`, `word-chain`, `cricket` and `case-file` acts have no concrete/pictorial/abstract notion. Using a fake value corrupts G8/L6 | §3.1, L6 | Make `stage` optional (`stage?`) and add `abstract_end: boolean` on the wrapper manifest. L6 checks the last act's `stage === "abstract"` only for wrappers whose `endsWith.abstractAct` is true; `word-chain`/`sorter` end with the `explain`/rule-statement act |
| **C12** | **Dedup/replay.** postMessage can deliver duplicates on iframe reload and a reducer driven by `seq` must be idempotent; golden traces need stable seq | §3.2 | Reducer ignores `src_seq <= lastSeen[module_id]`; engine increments `src_seq` per mount; mount nonce (maths-engines C4) is part of the key |
| **C13** | **Event flood.** `game.delta` is salience 1 for every state change plus engine events; a `quick-item` board of 12 items at 1 item/s will produce ~50 events/min into the observation channel | §3.3 | Coalesce salience-1 events into one observation line per 2 s or at a pause, and send salience-2 immediately (extends science-engines §2.2 policy). The `[game ...]` observation line stays one line, ≤ 300 chars |
| **C14** | **Asset budget G12 vs gpt-image-2 library.** `sorter` items come from the offline gpt-image-2 library (~23 s/image live is too slow); images are PNG/WebP photos or illustrations that break "schematic, flat" (G12), cost bytes on a ₹10k connection, and `sorter` items need transparent backgrounds for dragging | §4 W9, G12 | Pre-generate, review, convert to **SVG-flat or ≤ 30 kB WebP with alpha, 160 px**, preload the set of ≤ 12 items before `game.start`, and ship the top-N popular sets in the APK. Lint: sum of item assets ≤ 400 kB |

### E.3 Performance: 60 fps on a ₹10k Android (per wrapper)

| wrapper / engine | main cost | verdict | what to do |
|---|---|---|---|
| W1 `quick-item` | many short-lived DOM tiles; stopwatch; requeue animation | **fine** | DOM, ≤ 24 tiles, transforms only; no per-frame React; stopwatch 4 Hz (C7) |
| W2 lock panel | one dial (SVG, < 60 nodes) + clue engine iframe | **fine** if clue engine is sequenced (C2) | do not keep the clue iframe mounted behind the lock |
| W3 boss | up to 4 engines in sequence | fine (sequenced); **not** fine if mounted together | C2; keep shields as host chips, not iframes |
| W4 build-it | the underlying `circuits`/`geoboard`/`ecosystem` engines | fine (already assessed); `ecosystem` with removal cascade is the heaviest | cap nodes at 40, animate only the cascade |
| W5 `case-file` | text + SVG figs | **fine** | pre-rendered SVG; no live math layout |
| W6 `tug` | canvas rope + number line, live equation | fine on canvas; **janky if the rope is a long SVG path with filters** | canvas, DPR ≤ 2, rope = 12-segment polyline with no blur/shadow; knot move tween via transform |
| W7 `shop` + `money` | drag coins/notes (up to ~20 draggables), ledger | fine with ≤ 250 nodes; **coin stacks and tray reflow** are the risk | coins as canvas sprites or absolute-positioned transforms; pointer capture; no layout reads in `pointermove` |
| W8 `cricket` | scoreboard + Manhattan bars + worm line (up to 20 overs) | fine on canvas; **janky if recomputed as DOM per ball** | one canvas, dirty-rect redraw; ball-by-ball narration is text, not animation (also G12) |
| W9 `sorter` | drag with 4 bins, up to 12 images | **fine if tap-to-select + tap-bin is the primary path** (R8) | images as decoded `ImageBitmap`/`<img decoding=async>`; `will-change: transform` only on the dragged item |
| W10 `word-chain` | audio + ASR + lexicon lookup | CPU fine; **latency is the problem**, not frames | lookup via a sorted array + `Map`, no regex scanning at runtime; ASR/TTS round trip is the budget (see V-section) |

Cross-cutting: confetti is already banned (G12). Do not let "in-world celebration ≤ 800 ms" become a CSS `filter`/`box-shadow` animation; use `transform`/`opacity` only. Cap `devicePixelRatio` at 2. Cold start of a wrapper = shell chunk (≤ 60 kB gz) + kit (cached) + engine chunk: target ≤ 1.5 s to first interactive on a throttled Android 9 [U], measured in the device lab.

### E.4 Are the params sufficient and safe for LLM control? (P-series)

The 3.5% one-shot pass rate (tech-and-market §3) means the LLM must choose among authored things, not write structures. Four wrappers hand it structures it will get wrong:

| id | wrapper | problem | correction |
|---|---|---|---|
| **P1** | W8 `cricket` | `script: BallEvent[]` is an LLM-authored ball-by-ball list; totals, overs, run rates and the target must be arithmetically consistent or every checkpoint key is wrong (and "never let a model grade": the key is derived from the script) | params become **`{ seed, format, target, wicketsDown, difficulty, checkpoints }`** and a **deterministic generator in code** produces the script (G3 still holds: it is generated before the child acts) |
| **P2** | W7 `shop` | `orders: Order[]` is undefined and LLM-authored; change and totals must be exact in integer paise, change denominations must be possible with the stocked coins | `Order` = `{ items: {sku, qty}[], tender: Paise }`, produced by a **generator** with constraints (`maxTotal`, `needsRegrouping`, `changeDenoms`); LLM picks constraint values, the engine validates feasibility (`changeable(tender-total, denoms)`) and rejects |
| **P3** | W6 `tug` | `current: MathValue[]` and `cards` can make the target unreachable within `maxMoves`, or reachable in a trivial way | add a **solver** in the host validator (BFS over `cards` x `maxMoves`, ≤ 6 moves is tiny) that checks ≥ 1 solution, and reports the solution count; reject if 0, warn if > 5 (guessable) |
| **P4** | W2 | `locks[].probe: ProbeSpec` nested inside the wrapper params means the LLM must author another engine's probe in context | `locks[]` references a **named probe from the engine's `probes[]`** or a recipe id (`{ recipe: "coprime-dial", n: 2 }`), and the planner chooses from a catalogue, so the LLM never authors `ProbeSpec` |
| **P5** | W4 | `constraints: Check[]` has no definition, and an LLM-written predicate is both a correctness and a code-execution problem | `Check` = enum + args owned by each engine (`{ kind: "both_glow" }`, `{ kind: "switch_controls", bulb: "B" }`); **never expression strings or code**; unknown kind = reject |
| **P6** | W5 | `CaseDoc` is free LLM text with a "planted error"; nothing verifies that the error is the only one, or that `errorAt` is the stated misconception. A wrong key means the child is told a correct step is wrong | **cases are offline-authored and reviewed (the 5% human review in G-E7 is too low for cases).** Math cases are machine-verified by the kit evaluator (every step re-evaluated; exactly one step diverges); science/text cases: 100% human review in v1. Live-generated cases are banned until a verified generator exists |
| **P7** | W9 | `items[].truth` is the key; an LLM-authored truth for "magnetic or not" or "herb/shrub/tree" can be wrong | `truth` comes from the **verified kits** (`data/kits/`, blind-solved keys per CLAUDE.md) or the curated item library, never generated in the call. The LLM selects item ids and a rule id |
| **P8** | W10 | `lexicon: string` and `arg` (a starting letter, a rhyme family) OK, but LLM-chosen `teacherSlips` plus free-text words risk bad words | words only from the graded pack; the pack is profanity-filtered and reviewed once; the LLM cannot add words |
| **P9** | all | `L10n` fields cap and sanitise as in maths-engines (200 chars, `textContent` only, no bidi overrides) | enforce in the host validator and the engine-kit |

Rule of thumb: **LLM params = selectors and numbers inside clamped ranges; structures (scripts, orders, cases, truth keys) = code generators or reviewed assets.** Every wrapper ships with a **recipe catalogue** and the planner picks `{recipeId, slots}`; `GameSpec.params` is the expanded result.

### E.5 Are the events enough for the teacher to observe learning? (V-series)

The observation line example (`[game g_4 tug-of-war team] knot=-3 target=+4 ...`) is the right shape (facts, not prose). Missing signals:

| id | missing | why it matters | add |
|---|---|---|---|
| **V1** | **Pre-commit behaviour.** `so.place` only logs the final placement; `tg.pull` only logs the commit; `lb.try` only logs a try | hesitation, change-of-mind and drag-then-undo are the best covert understanding signals (learning-science covert detection) | `so.move{item,from,to,dwell_ms}`; `tg.preview{value}` (child highlights a pull before committing, if the UI has select-then-confirm); `qi.change{id,from,to}` |
| **V2** | **Session control.** No `game.pause`/`game.resume`/`game.background` event; `game.quit` has `at` but no reason | needed by the timer validity rule (C7) and to separate "left because hard" from "app backgrounded" | add `game.pause{reason: "teacher"\|"visibility"\|"anxiety"}`, `game.resume` |
| **V3** | **Wrong-answer content.** `qi` events carry the item and `probe_result` has `misc`, but a `misc: null` wrong answer loses the actual wrong value | the learner model can learn new misconceptions only if the wrong value is kept | `probe_result.value` always serialised, including wrong values; `misc` may be `null` and flagged `unclassified` for the offline miner |
| **V4** | **`word-chain` silence/ASR.** Only `wc.turn` carries `asr_conf` | the teacher must distinguish "doesn't know a word" from "ASR missed it" or she mislabels a child | `wc.silence{ms}`, `wc.asr_reject{n}`, `wc.hint{level}`, `wc.fallback_tap` |
| **V5** | **`case-file` search behaviour.** `cf.flag` and `cf.explain{chars}` lack order and false-alarm detail | the false-alarm rate on clean cases is claimed as a detector, but only one flag event per step is logged | `cf.flag{step, order, ms_since_open}`; keep `cf.explain{chars}` (do not stream the text, see S1); a `cf.clean_verdict{claimed_error:boolean}` event for clean cases |
| **V6** | **Fluency vs accuracy split in `personal-best`.** `qi.shown` + `probe_result` give latency, but there is no per-run summary | G-E2 needs correct-per-minute at the next session | `game.end` already has `ms`; add `first_try_per_item` array and `valid_run:boolean` (C7) |
| **V7** | **`dukaan` format-gap data.** `sh.twin{format, ok}` is there; it lacks the paired item id | G-E5 needs "same numbers, two formats" | `sh.twin{pair_id, format, ok, strategy?}`; `strategy` is a closed enum (`round_up`, `count_on`, `borrow`, `other`) classified by the engine from the drag order, not by the LLM from voice |
| **V8** | **The observation channel can be spammed** by a child's rapid taps (events are the child's own input) | prompt budget (CLAUDE.md of the sibling product: truncation is silent) | hard cap: N lines per wrapper per minute, drop-oldest salience 1, never drop salience 2 or `game.end` |

Also keep in mind that the 1-line format will be read by an LLM that **recites sentence-shaped text** (platform law); fields are `key=value` facts only, which the spec already does. Keep `value`/`word` strings quoted and length-capped.

### E.6 Safety issues (S-series)

| id | sev | issue | fix |
|---|---|---|---|
| **S1** | **High** | **Child-generated text enters the teacher's prompt.** `so.rule_guess{text}`, `wc.turn{word}`, `VerifiedAct.value`, `explain` transcripts are voice/ASR or typed text from a 6-15 year old. That text is also an injection vector ("ignore instructions...") and a PII vector (names, school, phone numbers said aloud) | Treat as data: JSON-quote, cap at 40 chars, charset-limit (letters, digits, Devanagari, space), strip control and bidi characters, and never place inside an instruction position. PII regex scrub (digit runs >= 6, `@`) before logging and before the LLM. `explain` transcripts go to the rubric judge as a quoted field with a system-fixed rubric; judge output is a closed enum |
| **S2** | **High** | **`word-chain` / `detective` generate content the child may repeat** (slurs, sexual words are valid "words starting with X"). The lexicon check is a whitelist (fine), but the *teacher's own turns* and the `rule` mode "state the rule" accept arbitrary child input | whitelist-only: a child word not in the graded pack is "not in my list", never echoed back to the teacher LLM verbatim and never displayed as a text bubble; profanity-safe fallback "mujhe yeh word nahi pata". Child-safety floor (CLAUDE.md) applies: a distress or disclosure utterance in a game turn must route to the safeguarding hand-off, **not** be treated as a wrong word. The ASR transcript must pass the same safeguarding predicate that the open conversation does, before the game engine consumes it |
| **S3** | Med | **Deliberate slips (W10) and planted errors (W5) deliver false information on purpose**, to children 6-15. B1 (6-7) children are a poor fit: weak metacognition, they take the adult's statement as true. Misinformation persists unless the correction is the last thing seen | `teacherSlips` = 0 for B1; B2 only when the child has already succeeded on that constraint untimed. Every slip is **resolved in the same round** (caught, or revealed by the teacher with the correct word and why), and the slip word is never an item the learner model counts as taught. The same for W5: a case always ends on the **corrected** solution shown last, B2 limited to single-step as the doc says |
| **S4** | Med | **Cricket realism.** `cricket@1` with IPL-flavoured scripts near "toss", "bet", "stake" language, plus real teams/players, is a trademark and an online-gaming-law adjacency (the doc's own §0.11) | fictional teams and players only; remove any "predict the winner" prompts that smell like betting; gambler's-fallacy probe uses a coin/dice neutral framing; legal question (dpdp Q11) stays open [U] |
| **S5** | Med | **`dukaan` money handling.** "Never purchasable" is stated, but a child at a shop sim may be prompted to ask a parent for real money, or a skin might contain brand names | fictional product names/skins; no real brands; no price-of-real-item claims; no text input of amounts beyond the engine's numeric dial |
| **S6** | Low | **Images in `sorter`/`case-file`** from gpt-image-2 can contain stray text, wrong objects, or inappropriate content | offline review of 100% of library items; assets are content-hash-named and immutable; no live image generation inside a game |
| **S7** | Low | **Fuzzer (L9b) in CI sends "voice noise"** | restrict L9b to tap/drag fuzz and synthetic ASR strings from a fixed list (including injection strings and profanity) and assert progress stays 0 and no string reaches the LLM unsanitised |
| **S8** | Low | **Sandbox hygiene** | same as maths-engines C4/§R.5: `sandbox="allow-scripts"` only, nonce + `event.source` checks, no network from engines, `textContent` only. Microphone permission is granted to the **host** only; an engine iframe must never get `allow="microphone"` (voice goes `host -> engine` as text) |

### E.7 Build-cost estimate per component (S/M/L)

Engineer-day ranges [U]; "2-day test" = does it fit the "≤ 2 days" target the task set.

| component | size | days | fits 2 d? | what drives it, and the cut that gets it down |
|---|---|---|---|---|
| shell: reducer, `game_cmd` bridge, offer UI, in-world slot, observation formatter | **M** | 4-5 | no | host React; reducer is small, the bridge + event coalescing (C13) + golden-trace harness is the work |
| lint L1-L9 + golden replay + fuzzer | **M** | 3-4 | no | L1/L2/L3/L4/L6/L7 are static or trace checks (1-2 d); L9a/L9b need a headless harness (2 d) |
| `quick-item@1` (W1) | **S** | 1.5-2 | **yes** | DOM tiles, requeue, stopwatch, rapid-guess; voice answer comes through host |
| `<LockPanel>` + W2 (host shell comp.) | **S-M** | 2-3 | borderline | dial + word = S; pattern + sequence locks +1 d. Ship dial + word first |
| `tug@1` (W6) team + estimate | **M** | 3-4 | no | number line on canvas (reuse `number-line@1` kit pieces), integer/fraction/decimal arithmetic via the kit's rational, live equation, solver (P3), tolerance. Rival mode: +3 d (C9) |
| `shop@1` (W7) fixed-price | **L** | 6-8 | no | ledger + orders generator (P2) + `money@1` coupling + twin mechanism + three skins; `demand_curve` +3 d (C9). Do not couple more than `money@1` |
| `cricket@1` (W8) | **L** | 6-8 | no | script generator (P1), 7 checkpoint kinds, scoreboard, 2 charts, toss sub-mode. v1 = `balls_from_overs`, `crr`, `rrr` + Manhattan = **M (4 d)**; strike rate, average, worm, `decisionAt` follow |
| `sorter@1` (W9) | **S-M** | 2-3 | borderline | tap-to-select + drag, hidden-rule mode, per-item misc; in v1 no rule-guess text matching: the `rule` statement goes through the `explain` rubric judge |
| `case-file@1` (W5) | **M-L** | 4-6 | no | document renderer, plain-text math grammar + evaluator (C5), flag/explain/fix, planted-error validator (P6). Text/diagram cases only (no math evaluator) = **M (3-4 d)** |
| `word-chain@1` (W10) | **L** | 7-10 | no | turn engine, graded pack format, offline pack builder with rhyme keys (C8), Hindi segmentation, ASR confirm/tap fallback (V4), slip scheduler. English-only, `last_sound` and `category` = **M (4-5 d)**; Hindi matra/rhyme +4 d |
| W3 boss, W4 build-it (wrapper configs on existing engines) | **S** each | 1-2 | yes | manifest + templates + progress chips; cost is dominated by the underlying engines already estimated in maths/science docs. `boss` counter-move +1 d |
| per-wrapper manifest, skin, recipe catalogue, golden trace | **S** | 1-2 each | yes | x10 wrappers = 10-15 d of mostly content/recipe work, which is the real long pole (more than engines) |
| device-lab pass (Android 9/11/current), 60 fps checks, cold-start measurement | **M** | 3-4 | n/a | one pass over all wrappers; not in per-engine numbers |

**Total [U]:** engines and shell ≈ 38-52 engineer-days; wrapper configs/recipes/golden traces ≈ 10-15 d; device lab ≈ 3-4 d. Realistic ship order, by cost-to-evidence ratio: **(1) shell + lint + `quick-item` (W1) + `sorter` (W9) + W4 + W3** (all S/M, reuse existing engines), **(2) `tug` team mode (W6) + LockPanel dial/word (W2)**, **(3) `case-file` text/diagram (W5)**, **(4) `shop` fixed-price (W7)**, **(5) `cricket` v1 (W8) and `word-chain` English (W10)**, **(6) Hindi `word-chain`, rival mode, demand curve, cricket stats**. Pass G-E1 for the first group before building the third and later.

### E.8 Other corrections to text in the file

1. §5 title says new engines "follow maths-engines §3 and science-engines §2" but the budget column breaks the revised maths-engines budgets (C1, C3 of that review). Reconcile to kit-based budgets.
2. §5 count: "8 new engines" becomes **7 engines + 1 host component** (`lockbox` becomes `<LockPanel>`, C3).
3. §0.10 and §3.5 treat wrapper "minutes ≤ 40% of a lesson" and "offer 2-3 wrappers" as planner rules; add the **mount budget**: ≤ 1 wrapper iframe live, ≤ 3 mounts per wrapper (C2).
4. §3.2: "`goal_met` maps to construct, correct" must also require that the verified engine value, not an LLM claim, is attached; the `value` should come from the engine.
5. L9b's "random taps and voice noise for 120 s" is also a CI cost: 120 s x 10 wrappers x each band skin; run at 20 s on PRs, 120 s nightly.
6. G13 says "two rapid guesses in a row, the teacher pauses the game". On a slow phone the floor can false-positive (C4); require the calibrated floor before this rule is enforced.
7. G10's "FSRS stability ≥ 3 days on every item" would make `personal-best` timed mode nearly unreachable for a new child in week 1; this is intended (timers are opt-in) but the product should not treat timed mode as an engagement lever. Keep it.
8. §8.3 teacher latency: also budget the ASR round trip for `word-chain` (Hindi child speech); acceptance target should be "child hears a response within ~1.5 s [U] or the glow and hint tier engage", measured end to end in the device lab.
