# Motivation without rewards: Taxila's progress UX for ages 6-9 and 10-15

**Date:** 2026-10-02 · **Scope:** every child-facing surface that shows progress, growth, milestones or choice (home, the progress map, the protégé, milestone moments, the end of a lesson), plus how each one appears in the parent view. Web + Android, shared family phones, low-end devices, Hindi / Hinglish / English.
**Question:** How does Taxila keep a child coming back and trying hard with no points, coins, streaks, leagues or unlocks? The design levers are mastery maps, character growth (the protégé learns as the child teaches), meaningful milestones, autonomy, relatedness and competence feedback. What do Duolingo, Khan Academy, Prodigy and Synthesis teach us?
**Builds on (read first, not repeated):** `learning-science.md` §3.7 (SDT), §1.5 (protégé effect), §4.5 (healthy bond), rules 26-28; `harvest/gurukul.md` §3.2 and §4.7 (rejected mechanics, NEVER MANIPULATE table), A1 (cited moments), A2 (no decay by absence), A4 (ability-label fence), §6 (4-state rule, gates); `design/kids-ux-ages.md` (bands B1-B4, tokens, ProgressPath); `design/lesson-arc.md` (P1 warm-up, P6 protégé contract, P7 wrap); `design/parent-experience.md` (PX1-PX10, the four state words); `learner/kt-algorithms.md` §2.6 (ledger states and the display fold).

**Evidence tags:** **[V]** read this session in the primary source (abstract, full text, the organisation's own page or PDF) · **[S]** secondary source (news, Wikipedia, review site) · **[M]** prior knowledge, not re-checked: verify before it becomes a `context/` entry · **[I]** design inference by this document, with a named test in §14 · **[V, script]** from the Play Store review pulls already saved beside the sibling docs.

**Method and limits.** The session's shared web-search budget was exhausted before this question began (0 searches available). Everything new here comes from about 35 direct fetches of known sources: Europe PMC and PubMed abstracts, Crossref records, Duolingo's and Synthesis's own pages, news coverage of the Prodigy complaint, and the three NCERT PARAKH Holistic Progress Card PDFs (Aug 2025 edition), which I downloaded and read. Khan Academy's help centre returned 403 behind a bot wall, so the Khan mastery mechanics are [M]. **No study tests a reward-free progress UX for Indian children, or for any voice-first AI tutor.** The motivation literature is mostly US/European lab work with 4-11-year-olds and undergraduates. Every transfer to Taxila is an extrapolation and is tagged.

---

## 0. The answer in fourteen lines

1. **Rewards work, and that is the trouble with them.** Expected, contingent rewards undermine free-choice intrinsic motivation: engagement-contingent d = -0.40, completion-contingent -0.36, performance-contingent -0.28, over 128 studies. "Tangible rewards tended to be more detrimental for children than college students" (Deci, Koestner & Ryan 1999) [V]. A material reward made 20-month-olds help less afterwards (Warneken & Tomasello 2008) [V]. **Positive, informational feedback did the opposite: d = +0.33 on free choice** [V]. That one number is the design brief: replace rewards with information.
2. **Show learning progress, not position.** When people choose freely what to learn, a model that includes *learning progress* fits their choices best. They use percent-correct only to avoid tasks that are too easy (Ten, Kaushik, Oudeyer & Gottlieb 2021, adults) [V]. The thing to make visible is the slope ("then vs now"), not a score.
3. **Streaks are rejected on evidence, not taste.** Across 7 studies, an intact streak shown in a log raises engagement and a broken one lowers it. The effect follows the *representation*, not the behaviour, and it is stronger when people blame themselves for the break (Silverman & Barasch 2022) [V]. Duolingo's own blog: a 7-day streak goes with 3.6x course completion, and doubling streak freezes added +0.38% daily actives [V]. These are retention tools, built on loss aversion. **Taxila never draws time as a row or grid**, because a grid makes every missed day visible (§4).
4. **Two progress worlds, one ledger.** B1-B2 (6-9) get **Bagiya**, a garden where each skill is a plant that grows only from evidence. B3-B4 (10-15) get **Aasmaan**, a sky map of chapters as constellations, with prerequisites drawn as lines and real counts. Both are renders of the same ledger states that parents see (*Abhi nahi · Seekh rahi · Aa gaya · Pakka*, parent-experience PX2) (§5, §6).
5. **Nothing wilts.** Math Garden's plants wither when a child stops practising [M], and that is the loss-by-absence pattern gurukul A2 forbids. In Bagiya and Aasmaan the display is the maximum level reached. A month away changes nothing on screen. Only evidence can demote: two consecutive delayed misses (kt-algorithms §2.6). Review-due appears as an *invitation* the teacher acts on, never as decline.
6. **"Pakka" is the milestone that matters.** It can only happen in a *later* session, when a delayed re-check passes, so the most meaningful moment in the product sits naturally in the next lesson's warm-up. It turns "come back" into curiosity ("is it still there?") with no obligation attached (§8).
7. **The protégé grows only from what the child teaches.** Its notebook gains a page per concept the child explained, in the child's own words. Later it *tries* what it was taught and the child checks it, which doubles as retrieval and error-spotting. It never gets hungry, sad, lonely or smaller, and nothing about it reads a clock (§7). Off-task chatter with teachable agents went with lower gains (Liu et al. 2025, n = 533) [V], so the protégé talks only about the content.
8. **Milestones are capability changes with citations.** Each one names what the child can now do, in curriculum outcome language, and points to the attempts that prove it (gurukul A1 moments). There is at most one ceremony per lesson, it lasts at most 1.5 s, and its payoff is shaped like the concept. Lessons done, days, minutes and right answers are never milestones (§8).
9. **Praise the process, never the person, and never inflate it.** After person praise, 5-6-year-olds showed more helpless responses, including self-blame, on every measure. The same held after person criticism (Kamins & Dweck 1999, n = 131) [V]. Intelligence praise cut persistence and enjoyment in 5th graders (Mueller & Dweck 1998) [V]. Inflated praise made low-self-esteem children avoid challenge (Brummelman et al. 2014) [V]. Gurukul's ability-label fence applies to every progress string.
10. **Choice is a feature, not a garnish.** Choice raised intrinsic motivation, effort and performance. The effect was stronger for children, and strongest with 2-4 successive choices *without rewards afterwards* (Patall, Cooper & Robinson 2008, 41 studies) [V]. Duolingo removed learner choice of order when it moved from tree to path in 2022 [V]. Taxila keeps order choice for due items, map skins, goals and "next of 3".
11. **Relatedness points outward and is about work, not feelings.** The teacher remembers the child's own explanations, mistakes and comebacks, with citations. She never claims to miss or wait for anyone (learning-science §4.5). New: a **parent-reaction loop**. A parent taps a reaction to a milestone on WhatsApp, and the child hears that a family member saw it at the next lesson start. The ICO notes that for 6-9-year-olds family is the strongest influence [V via kids-ux] (§10).
12. **Teens get respect, numbers and a goal of their own.** Aasmaan shows real counts ("4 of 6 pakka") and the chapter their class is on. It never shows a percentile, rank or time-as-virtue. The goal card mirrors NCERT's Holistic Progress Card ("My Goal Setting… important to me because… I will achieve this by", Middle Stage, Aug 2025) [V], so the child and parent meet the same language at school.
13. **Prodigy is the anti-pattern in one sentence.** Maths is the toll paid to refill spell points [S]. Fairplay counted "16 unique advertisements for membership and only four math problems" in 19 minutes [S], and paying members progress faster with better pets [S]. Taxila's rule is the inverse: **learning is never the toll for the fun, and nothing grows or unlocks by payment.**
14. **The honest risk.** Reward-free design probably costs some short-term retention. Duolingo reviews that mention streaks or motivation average 4.6 stars [V, script], and Mindspark, the strongest Indian evidence product, uses a points system ("Sparkies") [M]. §15 logs the reversal condition: change course only if delayed-retention *learning* suffers, not if daily actives dip.

---

## 1. The evidence, compressed (what each source studied and what transfers)

| source | studied | finding used here | tag |
|---|---|---|---|
| Deci, Koestner & Ryan 1999, *Psych Bull* (PMID 10589297) | meta-analysis, 128 experiments | contingent rewards undermine free choice (-0.40 / -0.36 / -0.28), also all tangible and all expected rewards; positive feedback +0.33 free choice, +0.31 interest; tangible rewards worse for children, verbal rewards less enhancing for children | [V] |
| Warneken & Tomasello 2008, *Dev Psych* (PMID 18999339) | 20-month-olds, helping | a material reward lowered later helping vs praise or nothing ("overjustification") | [V] |
| Lepper, Greene & Nisbett 1973 | preschoolers drawing with markers | children who *expected* a reward drew less later; unexpected reward did no harm | [S] |
| Henderlong & Lepper 2002, *Psych Bull* (PMID 12206194) | review of praise studies | praise helps when it credits controllable causes, supports autonomy and conveys realistic standards; otherwise it undermines or does nothing | [V] |
| Kamins & Dweck 1999, *Dev Psych* (PMID 10380873) | 131 children aged 5-6, role-play | person praise *and* person criticism both produced helpless responses and contingent self-worth; process feedback did not | [V] |
| Mueller & Dweck 1998, *JPSP* (PMID 9686450) | 6 studies, 5th graders | intelligence praise → performance goals, less persistence and enjoyment, worse performance, fixed-trait beliefs | [V] |
| Cimpian et al. 2007; Zhao et al. 2017 (*Psych Sci*) | ~4-year-olds; 3- and 5-year-olds in China | generic praise ("you are a good drawer") worse after mistakes than "you did a good job drawing"; "smart" praise increased cheating | [M] (abstracts not retrievable) |
| Brummelman et al. 2014, *Psych Sci* (PMID 24434235) | 3 studies | adults give low-self-esteem children inflated praise; it lowers their challenge seeking | [V] |
| Patall, Cooper & Robinson 2008, *Psych Bull* (PMID 18298272) | 41 studies | choice raises intrinsic motivation, effort, performance, perceived competence; stronger for children; best with 2-4 successive choices and no reward after | [V] |
| Cordova & Lepper 1996, *J Educ Psych* 88:715 | 5th graders, maths game | contextualisation, personalisation and cheap choices raised motivation, depth of engagement and learning | [M] (citation [V]) |
| Ten, Kaushik, Oudeyer & Gottlieb 2021, *Nat Commun* | free-choice exploration among learning tasks | competence used to avoid easy tasks; learning progress best explains task choice | [V] (adult sample [M]) |
| Wisniewski, Zierer & Hattie 2020, *Front Psychol* | 435 studies, N > 61,000 | feedback d = 0.48, heavily moderated by information content; weaker on motivational outcomes than cognitive | [V] |
| Kluger & DeNisi 1996, *Psych Bull* | feedback-intervention meta-analysis | about a third of feedback interventions *lowered* performance; feedback aimed at the self is the worst | [M] |
| Silverman & Barasch 2022, *JCR* (doi 10.1093/jcr/ucac029) | 7 studies, consumers | intact logged streaks raise engagement, broken ones lower it; driven by the representation; stronger with self-blame; weaker if repairable | [V] abstract |
| Hanus & Fox 2015, *Comput Educ* 80:152 (corrigendum 2018) | 16-week course with badges + leaderboard vs none | gamified group lower on intrinsic motivation, satisfaction, empowerment and exam scores | [M] (citation [V]) |
| Sailer & Homner 2020, *Educ Psych Rev* 32:77 | gamification meta-analysis | small positive effects on cognitive, motivational and behavioural outcomes, highly variable; fiction and collaboration moderate | [M] (citation [V]) |
| Hilz et al. 2023, *J Intell* | Math Garden, 20.7 weeks | maths self-concept rose; no effect on maths anxiety | [V] abstract |
| Liu et al. 2025, *Sci Rep* | middle-schoolers with AI teachable agents (n = 206 declined, 327 improved) | improvers were 62.78% constructive; decliners mostly passive; "activity and positive emotions were sometimes associated with lower learning gains" when dialogue was off-task | [V] abstract |
| Long & Aleven 2014-2017 (ITS, UMUAI) | 7th-8th graders, algebra tutor with an open learner model (skill bars) and shared problem selection | showing students their own skill model, plus self-assessment prompts, supported learning; mastery-oriented shared control kept quality | [M] (citations [V]) |
| Lin-Siegler et al. 2016, *J Educ Psych* | high-schoolers reading scientists' struggle stories | struggle stories improved science grades, mostly for low performers | [M] |
| Rogers & Feller 2016; ICO Annex B; Yeager, Dahl & Dweck 2018 | via kids-ux §2 | exemplary peers caused dropout; 10-12 "particularly susceptible to reward based systems"; teens respond to status and respect | [V via kids-ux] |
| NCERT PARAKH Holistic Progress Card, Aug 2025, Foundational / Preparatory / Middle | official card PDFs | three levels *Beginner / Proficient / Advanced*; picture and emoji self-assessment ("I liked doing this", "I found this easy", "To do this I needed… classmate, teacher, books, computer, none"; "I asked for help if I didn't understand", "I am proud of my work", "I want to do this task again"); Middle Stage "My Goal Setting", "My Ambition Card", and a "Student Progress Wheel" whose levels "grow in strength outwards from the center"; low attendance should "trigger timely support for the child rather than punitive action" | [V] |

---

## 2. Teardown: what each product does to motivation

| product | mechanic | what it optimises | evidence | Taxila takes | Taxila rejects |
|---|---|---|---|---|---|
| **Duolingo** | streaks, streak freeze, streak wager, XP leagues, hearts → energy (2025), the owl's reminders | daily return | blog: >6M users on 7+ day streaks; streak animation +1.7% day-7 retention; 7-day streak ↔ 3.6x completion (correlational); doubling freezes (up to 2 equipped) +0.38% DAU [V]; gem wager +14% day-7 [V via onboarding-flow]; owl "stalking" memes [S]; Duolingo-funded 2023 study: learners "did not significantly learn much grammar" [S] | short sessions; the character opens; spaced mixing (the stated reason for the path) | every loss-framed mechanic (gurukul §3.2); leagues; energy/hearts gating practice |
| Duolingo path (2022) | linear path replaced the skill tree | guidance, spacing | "a clear path to follow"; lost: choice of order, crowns, levelling a skill "gold" [V]; criticised widely, CEO: "no plans to reverse" [S] | one recommended next step | removing choice; Taxila keeps cheap order choices (§9) |
| Duolingo reviews (India, Sep 2026) | | | "only tries to milk you… I deleted [the] app 3 month ago, losing almost 1k days" (the streak as sunk cost); "batteries instead of hearts… I can't practice English comfortably"; a Speak reviewer: Duolingo "gameif[ies] it way too much and make[s] it all about your streak" [V, script]. Counterpoint: reviews in the motivation/streak/fun theme average **4.6 stars** (n = 62 of 600) [V, script]. Many users like streaks | | |
| **Khan Academy** | per-skill mastery levels (Attempted, Familiar, Proficient, Mastered, about 0/50/80/100 mastery points), course mastery %, unit tests and course challenges that can move levels up *or down*; energy points, badges, avatars | competence information plus points | mastery levels [M] (help centre blocked); badges and energy points [S]; Khan Academy reviewer asks for a streak "not like Duolingo" [V, script] | named mastery levels; mixed review that confirms mastery | one wrong unit-test item lowering a level (Taxila demotes only on two delayed misses); points and badges; % for young children |
| Khan Academy Kids | sparkles fill a delivery truck; collectibles | session completion | [V via kids-ux §9] | tap-to-hear, character gestures | collection economy |
| **Prodigy** | maths refills spell points in an RPG; pets; freemium membership (Core / Plus / Ultra) | membership conversion | 2021 complaint to the FTC by Fairplay and 21 other groups: "16 unique advertisements for membership and only four math problems" in 19 min; free players see "up to four times as many advertisements than math questions"; members get more stars, faster progress, better pets, exclusive clothes; prompts to "ask a parent or guardian"; 95% of players don't pay; children see "who has the cool stuff and who doesn't" [S] (NBC, EdWeek, The Conversation) | children love a world and a companion that evolves | maths as a toll (extrinsic integration); pay-to-grow; social display of purchased status |
| **Synthesis Tutor** (5-11) | hand-built manipulatives, levels that unlock, mastery-gated advance, micro-assessments | mastery, delight | "move on… once they demonstrate they have understood and mastered the material"; levels "increase her confidence"; no outcome data on the page [V]; "three right in a row, the difficulty bumped up… stumbled… tried a different visual"; ASR marks spoken correct answers wrong; a 6-year-old "loses interest after about 15 minutes" [S] | mastery gating; switching representation on struggle; quality bar for modules | marketing that treats hours of use as success ("could spend two hours", "ALL. THE. TIME.") [V]; level unlocks as the reward |
| Synthesis (the school's team games) | collaborative simulation challenges, no grades | intrinsic challenge, peers | [M] | challenge-as-motivation for B4 | (peer play is out of scope for v1) |
| **Math Garden / Rekentuin** (NL) | a plant per game grows with the child's rating; plants wilt without practice; coins won or lost on fast answers | practice volume | self-concept up, anxiety unchanged [V]; wilting and coins [M]; kt-algorithms rejects its speed-stakes scoring | the garden metaphor; per-skill adaptivity | wilting; coins; visible time pressure |
| **NCERT HPC** (school) | 3 levels, self/peer/parent input, goal and ambition cards, progress wheel | descriptive, competency-based reporting | [V] | vocabulary, goal card, "what I needed" self-report, the wheel's grow-outward shape | nothing (it is not a motivation product) |

**The cross-cutting lesson.** Each product's mechanics show what it is paid for. Duolingo's are tuned to daily actives, Prodigy's to membership, Khan's to completion. A tutor paid for *learning that lasts* should optimise for what Pakka measures: still right a week later. Every mechanic below is chosen against that target [I].

---

## 3. The model: six sources of motivation, six tests

**Sources (what Taxila supplies instead of rewards):**
1. **Competence information.** "You can now do X." Specific, true and cited (Deci +0.33; Wisniewski).
2. **Visible learning progress.** Then vs now, on the child's own past attempts (Ten 2021).
3. **Autonomy.** Real, cheap choices whose effects the child can see later (Patall; Cordova & Lepper).
4. **Relatedness.** A teacher who remembers your work, and a family that sees it (learning-science §4.5; ICO).
5. **Purpose.** A goal the child chose, said in their own words (HPC goal card; Yeager values framing via kids-ux).
6. **Being needed as a teacher.** The protégé learns only what the child teaches (Chase 2009 [S]; Kobayashi expectancy g ≈ 0.48 [S]).

**Tests every mechanic must pass** (the first is gurukul's, the rest are added here):
- **T1 Fear-and-obligation test:** a mechanic is allowed only if removing every fear and obligation from it leaves it intact (gurukul §3.2).
- **T2 Absence test:** nothing visible gets worse because time passed. Fake the clock forward 365 days and the render is byte-identical (gate MW-G2).
- **T3 Evidence test:** every visible state change has a ledger row behind it, and the child or parent can open it (PX1, "Kaise pata?").
- **T4 Comparison test:** nothing compares the child to another child, a sibling, or an invented average (PX6; Rogers & Feller).
- **T5 Toll test:** learning is never the price of the fun. If the fun can be reached without the skill, or the skill is a gate in front of unrelated fun, it fails (Prodigy; intrinsic integration, lesson-arc §0.10).
- **T6 Purchase test:** nothing grows, unlocks or looks better because someone paid. Paid plans buy *more lessons*, never progress or status [I].

---

## 4. Mechanics: banned, allowed, and why

| mechanic | verdict | test failed / reason | allowed replacement |
|---|---|---|---|
| points, XP, coins, gems, stars-as-currency shown to the child | banned | Deci (performance-contingent -0.28); ICO 10-12 | capability statement + concept-shaped payoff |
| streaks, streak freeze, "X days in a row", day counters | banned | T1, T2; Silverman & Barasch | a lesson journal ordered by lesson, not by date |
| **calendar grids, heatmaps, "this week" dot rows** | **banned on child surfaces** | a grid makes gaps visible, which is a broken streak drawn without the word [I] | the list of things made, newest first |
| leagues, leaderboards, class ranks, "ahead of X%" | banned | T4; Hanus & Fox; PX6 | own-past-self comparison only |
| badges per completed lesson or per N answers | banned | completion-contingent -0.36 | milestones by capability (§8) |
| unlockable cosmetics, chests, surprise drops, spin wheels | banned | expected/variable reward; DPDP §9(2) (gurukul §4.7) | the child *chooses* looks freely from the start (autonomy, not a prize) |
| hearts, lives, energy | banned | punishes attempts; review evidence above | unlimited tries; the hint ladder (kids-ux row 12) |
| timers, speed bonuses, countdowns | banned | punishes checking (gurukul); kt-algorithms rejects hidden-speed scoring | none needed; exam *windows* only for B4 parents |
| plants wilt, stars fade, protégé sad or hungry | banned | T2; gurukul A2 | review-due as an invitation (bird visits, ring) |
| "come back tomorrow", "don't lose…", "we miss you", push re-engagement | banned | gurukul §4.7 "their absence is never a subject" | nothing; the parent's weekly report is the only cadence |
| % complete bars for B1-B2 | banned | TIDRC (≤4 years); kids-ux row 14 | stepping stones, plant stages |
| counts for B3-B4 ("4 of 6 pakka") | allowed | informational, own-referenced | with "Kaise pata?" |
| mastery map with honest states | allowed | T1-T6 pass | Bagiya / Aasmaan |
| protégé notebook and capability props | allowed, with a watch | T1 passes; risk of being *read* as a prize (MW-M3) | never announced in advance, never chosen as a prize |
| child-set goals | allowed (B3-B4; B2 picture version) | autonomy, purpose | HPC-style goal card |
| milestone moment | allowed | informational, ≤ 1 per lesson | §8 |

---

## 5. Ages 6-9 (B1-B2): Bagiya, the garden that only grows

**Concept.** Each chapter is a flower bed (*kyaari*). Each skill in it is a plant. A plant's stage *is* its ledger state, drawn as a shape, so a non-reader can read it. State is never shown by colour alone, and the word appears on tap.

| ledger state (kt-algorithms §2.6) | parent word (PX2) | Bagiya shape | evidence required |
|---|---|---|---|
| unseen | Abhi nahi | a marked, empty plot with a seed packet | none |
| introduced / practising | Seekh rahi | sprout (2 leaves) | ≥ 1 evidence event |
| learned-today | Aa gaya | bud opening into a flower | unaided correct + generative pass (same day) |
| mastered | Pakka | the same plant bearing fruit, with a `done` ring | delayed success ≥ 20 h later, in a different session |
| due-for-review (mastered, R < 0.9) | Pakka (parent sees "re-check due") | a bird sits on the plant, a visitor and not a decline | FSRS retrievability |

**Rules.**
- **Monotone display.** The plant shows the maximum stage reached. A demotion happens only after two consecutive delayed misses (kt-algorithms). The teacher then names it plainly in the lesson, and the fruit returns to flower *without* any wilting animation or sad face. Absence never changes anything (T2).
- **The bird is the teacher's job, not the child's.** It means "she will check this one next time". Warm-up picks it up automatically (lesson-arc P1). It is never pushed and never counted, and no copy says "you need to" [I].
- **Only nearby beds are visible:** the current chapter, finished ones, and one seed-packet bed ahead. Later chapters stay off-screen, which keeps the garden finite and avoids an overwhelming wall of empty plots [I].
- **Labels are skills, never classes.** A Class 3 child working on Class 1 content sees "adding up to 20", never "Class 1" (kids-ux §1).
- **Autonomy:** the child picks each bed's plant kind from 3 picture choices (flower, vegetable, fruit tree). The choice is cheap and visible later (Patall). No sacred or community-coded plants, and no marigold, which kids-ux reserves for `turn` [I].
- **Payoff is concept-shaped:** the plant grows *during* the warm-up item that proved it, not on a separate reward screen (Sesame "payoffs reflect the concept", kids-ux).
- **Navigation:** a horizontal panorama, one bed per screen width, with tap-twin arrows (kids-ux rows 6-7; no vertical scroll for B1-B2). Tapping a plant plays the teacher's one-line capability note and shows the thing the child made or solved.

**Screen Y1: Bagiya (360 × 800 dp, B1-B2, light)**
```
┌────────────────────────────────────┐
│ [house]                 [parent ⚙] │  parent corner dull, behind S8 gate
│                                    │
│   (teacher, small, pointing)       │  taps → "garden walk" (§10), ≤ 3 turns
│                                    │
│  ┌──────── Ginti ki kyaari ───────┐│  bed name = chapter skill, never a class
│  │  🌱      🌸      🍇🟢     🐦🍇🟢 ││  sprout · flower · fruit+ring · bird on fruit
│  │ (plot)                          ││  each plant ≥ 112 dp hit, gap 16 dp
│  └─────────────────────────────────┘│
│  ◀                              ▶  │  64 dp arrows = tap twin for swipe
│                                    │
│  ┌──────────────────────────────┐  │
│  │      ▶  Aaj ka paath          │  │  the ONE `turn`-ringed element
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```
(Emoji stand in for illustrations. Real assets are flat SVG/Rive, under 150 KB per garden state, and cached offline [I].)

**Screen Y2: plant tapped.** The plant fills the top half, with the thing the child made beside it: the module snapshot or their drawn answer. The teacher gives a capability note shaped as [skill, in outcome words] + [when it was proven] + [one specific thing the child did]. For Pakka, a small "then" thumbnail shows the first wobbly attempt next to today's (§8 "then vs now"). A speaker button replays it. There is no number anywhere.

**Lesson-level path.** Inside a lesson, kids-ux's 3-5 stepping stones stay as they are. At P7 the stone that was "today's skill" plants itself into the bed as a sprout or flower, so the lesson and the garden are visibly one thing [I].

---

## 6. Ages 10-15 (B3-B4): Aasmaan, an honest map of the subject

**Concept.** Each subject is a sky, each chapter a constellation, each skill a star. The lines between stars are the real prerequisite edges from the skill graph, so the child can *see why* fractions come before ratios. This is an open learner model (Long & Aleven [M]) with a skin that does not read as babyish (NN/g "kid" repellent, kids-ux §0.9).

| state | star encoding (shape first, colour second) | count shown |
|---|---|---|
| Abhi nahi | outline ring, 12 dp | in "6 skills" total |
| Seekh rahi | small filled dot, 14 dp | "2 practising" |
| Aa gaya | filled, 18 dp | "1 got it today" |
| Pakka | filled + halo, 22 dp | "3 pakka" |
| re-check due | Pakka star with a thin blue ring | "1 re-check ready" (in-app only) |

Colour contrast was computed this session (`motivation-contrast.py`). Every star state and edge clears 3:1 on the `#0F1A33` panel (4.54-17.27), and labels reach 15.35:1. **Adjacent states differ from each other by only 1.42-1.72:1**, so colour cannot carry state. Size, fill and halo do, and the word appears on tap (WCAG 1.4.1) [V computed].

**Rules.**
- **Real numbers, own-referenced.** "Chapter 5: 4 of 6 pakka" is allowed. Percentile, rank and minutes-as-virtue are not. Exam proximity appears only as a *window* in the parent view (parent-experience §1.2), never as a countdown on the child's sky.
- **School alignment.** A small marker shows "your class is here" on the constellation the school is teaching now. A child placed below class level sees the path of stars leading *to* that marker. This is the level bridge (learning-science rule 28) told as a route, never as a deficit. The words "behind" and lower class labels never appear (kids-ux §1).
- **"I know this"** on any unlit star starts a 2-item check (kt-algorithms fast-forward). It is never a free skip, and a pass lights the star to Aa gaya. Pakka still needs a later session.
- **Skins as identity, chosen once and changeable:** sky (default) or route map (metro lines). Same data and the same encoding rules. 13-15-year-olds are working out identity (ICO) [V via kids-ux]. Build cost limits this to two skins [I].
- **Privacy:** the B3-B4 child PIN protects Aasmaan from siblings (kids-ux S1). S9 "What your parent can see" says plainly that the parent sees the same states.

**Screen O1: Aasmaan (portrait, B3-B4)**
```
┌────────────────────────────────────┐
│ Maths ▾            [goal] [notes]  │  subject switch; goal card; explainer notes
│ ┌────────────────────────────────┐ │
│ │  ·──●        ✦══✦              │ │  sky panel #0F1A33 in both themes
│ │      \      //   \\            │ │  edges = prerequisites (3.82:1)
│ │   ○   ●───✦      ✦◎  ← re-check│ │  ○ abhi nahi · ● seekh rahi · ✦ pakka
│ │        Fractions   ▲ your class│ │  "your class is here" marker
│ └────────────────────────────────┘ │
│ Fractions · 4 of 6 pakka · 1 ready │  counts, never %
│ ┌────────────────────────────────┐ │
│ │ Then → now: "which is bigger,  │ │  ThenNowCard (§8), one at a time
│ │ 3/4 or 4/5?" missed 12 Sep,    │ │
│ │ solved and explained today     │ │
│ └────────────────────────────────┘ │
│ [ Next: choose 1 of 3 ]            │  the ONE `turn` element
└────────────────────────────────────┘
```

**Screen O2: star tapped.** The skill appears in outcome language. Below it sits the child's own "Kaise pata?": the 2-3 attempts that set the state, with dates, the child's own explanation (re-voiced from the teach-back) and the next re-check date. This is the same evidence the parent sees. Teens can trust it because they can audit it (Yeager respect framing) [I].

**Screen O3: goal card (HPC-aligned).** A choice of 3 suggested goals plus "my own": a chapter before the school test, a skill, or a project. The child completes "important to me because ___" and picks 2 "I'll do it by" steps from a list (typing optional). The teacher checks the goal in the next lessons' P2 (lesson-arc) and closes it when the ledger shows it is done. A missed goal is simply re-set, never "failed" [I]. One active goal at a time.

---

## 7. The protégé: character growth that only the child can cause

The contract in lesson-arc P6 stands: chosen from 3 and named by the child; obviously fictional; never a classmate; pre-rendered lines only; never claims feelings; never grades. This section adds **growth**.

| element | how it grows | what it never does |
|---|---|---|
| **Notebook** (*kitaab*) | one page per concept the child explained in teach-back. The page holds the child's phrase (≤ 12 words, cleaned and re-voiced), the module picture they used, and the date. A wrong explanation is corrected in P7 and the page shows the corrected version, marked "fixed together" | no blank pages "waiting to be filled"; no page count shown to B1-B2 |
| **Tries it** | in a later warm-up, the protégé attempts an item using what it was taught. The child judges "sahi ya galat?" and why. For Aa gaya+ skills only, sometimes carrying a catalogued misconception, always resolved (learning-science §3.8 error-spotting rule) | never fails at something the child never taught; never mocks; never wins against the child |
| **Capability props** | when the protégé has been taught a whole skill, it *uses* a prop for it in its pre-rendered clips (a ruler after measurement, a number strip after place value). The prop is the skill made visible | never announced in advance ("teach me and I'll get…"), never chosen as a prize, never purchasable (T6) |
| **Needs** | none | hunger, sadness, loneliness, "I waited for you", shrinking, sleeping until fed: all banned (T2; learning-science §4.5) |

**Why this shape.** Learning by teaching works when the child *expects* to teach (Kobayashi 2024: g ≈ 0.48 with expectancy, -0.02 without [S via learning-science §1.5]). The notebook makes that expectancy concrete across lessons, because the child can see what the protégé has learned *from them*. "Protégé tries, child judges" turns growth into delayed retrieval plus error-spotting, so the growth mechanic is also an evidence mechanic [I]. The off-task finding (Liu 2025 [V]) is why the protégé has no small talk.

**By band.** B1-B2: the protégé is centre-stage, with choose-or-complete teach-back (lesson-arc). B3-B4: the default is **Explainer notes**, the child's own notebook of explanations, framed as "for a classmate who missed class" (kids-ux S7). It works as a revision sheet before tests. The protégé stays optional for older children who like it [I]. **Measure whether the notebook reads as a collection** (MW-M3). If children start asking "what will I get", strip the props first.

**Screen P1: protégé notebook (B1-B2).** A two-page spread. The left page shows the child's picture or answer. The right page shows the protégé "writing" the child's phrase in a big, karaoke-highlighted caption, with a speaker button that plays the child's phrase in the protégé's pre-rendered voice frame. Horizontal page turns use tap-twin arrows. No count is shown.

---

## 8. Meaningful milestones

**Definition.** A milestone is a capability change confirmed by the ledger, named in curriculum outcome words, that the child can show to someone. Each carries the evidence ids that prove it (gurukul A1: "the attempts it is made of, the citation, never decoration").

| milestone | trigger (ledger) | child surface (Young / Older) | parent surface | cap |
|---|---|---|---|---|
| **First Pakka ever** | first mastered state | the teacher explains what fruit means; the first fruit appears / the first halo star | WhatsApp milestone (≤ 1/week, parent-experience §11) | once |
| **Pakka** | mastered | fruit appears during the warm-up item that proved it / the star gains its halo | weekly report row | ≤ 1 ceremony per lesson; others appear quietly |
| **Comeback** | a skill with ≥ 2 earlier misses reaches Pakka (gurukul `comeback_after_miss`) | then vs now: the old attempt beside today's | report row with both dates | ≤ 1 per lesson |
| **Bed or constellation complete** | every skill in a chapter Pakka | the bed gets a name board with the child's name and the chapter outcome; "show your parent" card / the constellation's lines all light up | milestone message | per chapter |
| **Bridge crossed** | a placement gap closed (the child reaches the school chapter's prerequisites) | Young: the garden path reaches the gate to "the chapter your class is on" / Older: the "your class" marker is reached | the level bridge line in the report | per bridge |
| **Taught it** | protégé "tries" the skill and the child correctly judges a planted error | the notebook page gets a small "the protégé can now do this" tick | quote in report (visibility policy by age) | ≤ 1 per lesson |
| **Goal done** (B3-B4) | ledger meets the goal card's condition | goal card closes, shown in the child's own words | report row | per goal |

**Never milestones:** lesson count, day count, minutes, number of correct answers, "1st in…", the first purchase, a subscription anniversary.

**Ceremony rules.** At most one per lesson, lasting ≤ 1.5 s of motion, interruptible, transform/opacity only. `prefers-reduced-motion` collapses it to a crossfade (gurukul motion gate). For Young: the teacher's delight pose plus one earcon, then a spoken capability line built from shape [skill] + [proof]. For Older: a quiet card with no sound unless enabled. **Then vs now** is the default content of an Older ceremony, because progress, not position, is what drives free choice (Ten 2021) [V]. Process feedback names the strategy the child used (Kamins & Dweck) [V].

---

## 9. Autonomy: choices that change something visible

| choice | B1 | B2 | B3-B4 | visible consequence |
|---|---|---|---|---|
| plant kind per bed / map skin | 2 pictures | 3 pictures | sky or route | the garden or sky looks the way the child chose |
| protégé design and name | 3 designs | 3 designs | optional | it persists across subjects |
| which due item first (warm-up order) | 2 | 2-3 | 3 | order is the child's; *what* is due stays the teacher's |
| next topic | (teacher picks) | 2 | 3 (kids-ux S6) | the chosen star or bed lights as "next" |
| "I know this" | no | no | yes | a 2-item check, not a skip |
| goal | no | picture goal ("a full bed") | goal card | the teacher checks it in P2 |
| share with family | "show your parent" card | same | optional share; the parent still sees the ledger | a family reaction may come back (§10) |
| look (teacher outfit, garden decorations) | available from day 1 | same | same | never earned, never unlocked |

Rule from learning-science 26: **never offer a choice between the evidence-based core and fluff** ("skip review?"). Choices are about order, context and look. Patall's "no rewards after the choice" holds automatically because there are no rewards [V].

---

## 10. Relatedness: the teacher remembers your work, and your family sees it

- **What she remembers is the child's work, not her feelings about them.** Memory callbacks cite specific attempts, explanations, comebacks and stated interests (learning-science §4.5; lesson-arc P1 memory callback). Every progress-related callback must carry an evidence id, the same rule as the milestones [I].
- **Garden walk / sky tour.** Tapping the teacher on Bagiya or Aasmaan gives at most 3 turns: one thing that grew, one comeback, and what is next. It is offered every 4th lesson by *lesson count*, never by days, so a gap cannot trigger it [I].
- **Banned shapes:** missing or waiting for the child; being proud *of the child* as a feeling claim; exclusivity ("only I know how you learn", gurukul §4.7); comparisons with other children; anything about time away.
- **Parent-reaction loop (new).** The WhatsApp milestone message and the weekly report carry a one-tap reaction for the parent (3 pictures: clap, heart, "show me tonight"). At the child's next P0, the teacher passes it on: [family member] + [saw] + [the specific thing]. A small "Mummy ne dekha" chip then appears on that plant or star. A parent voice note (≤ 10 s) is **v2**. It means storing adult audio and playing it on a shared phone, so it needs a retention rule first (learning-science rule 35, data minimisation) [I]. The loop puts relatedness where the ICO says it lives at 6-9, in the family, and it gives a parent who cannot do the maths a real role (parent-experience §0.5).
- **No reaction is never a subject.** If the parent never reacts, nothing is shown and nothing is said (T2) [I].

---

## 11. Competence feedback (in lessons and on progress surfaces)

| rule | basis |
|---|---|
| Feedback is about the task and the process, never the person ("you're smart", "you're a maths kid" are banned shapes, with the bilingual ability-label fence) | Kamins & Dweck; Mueller & Dweck [V]; gurukul A4; PX4 |
| Specific and true: name the step, the strategy, or the representation the child used | Wisniewski (information content) [V]; Henderlong & Lepper [V] |
| No inflated praise. Big acknowledgement only after real difficulty, calibrated to the item's predicted difficulty from the ledger | Brummelman [V]; learning-science §3.5 |
| Compare only with the child's own past | Rogers & Feller [V]; T4 |
| Normalise struggle with real aggregates only ("this one trips up many students" when the item's error rate supports it); B4 may hear short, true struggle stories of real scientists or mathematicians | Lin-Siegler [M]; kids-ux row 19 |
| Verdict never before commit; the wrong-answer ladder stays as kids-ux row 12 | gurukul §6.2 |
| A demotion is told plainly as a fact plus a plan, never as a loss | kt-algorithms display rule; PX7 |
| The child gets a light HPC-style self-check at P7, at most once a week: B1-B2 pick a picture ("easy / tricky", "I needed: teacher, protégé, nothing"); B3-B4 tap one line. It is logged as *preference*, never as evidence (overconfidence, learning-science §1.9) | HPC Foundational/Preparatory [V]; learning-science §2.6 |

---

## 12. Components and tokens

| component | contract |
|---|---|
| `GrowthGarden` (B1-B2) | pure render of `display` states per skill; input = ledger fold + child choices; **no clock input**; horizontal panorama; one `turn` element max on screen |
| `PlantTile` | stage shape from state; ≥ 112 dp (B1) / 96 dp (B2) hit; tap → capability note + artifact; bird overlay iff `refresh`; "Mummy ne dekha" chip iff reaction exists |
| `SkyMap` (B3-B4) | constellations from the skill graph; star size/fill/halo from state (§6); edges from prerequisites; "your class" marker from the school-chapter mapping; pinch-free (zoom by tap) |
| `StarNode` | ≥ 48 dp hit even when drawn at 12 dp; label and state word on tap |
| `ThenNowCard` | requires two cited attempts ≥ 7 days apart on the same skill (the earlier one missed or hinted, the later unaided); refuses to render otherwise |
| `GoalCard` | one active goal; closes only on a ledger condition; "re-set", never "failed" |
| `ProtegeNotebook` | pages = teach-back events with a pass or a corrected pass; props = skills taught and mastered; no time-based state |
| `MilestoneMoment` | ≤ 1 per lesson; needs `evidenceIds.length ≥ 1`; ≤ 1.5 s; reduced-motion crossfade |
| `ShowParentCard` | one picture + one line; the hand-over card from lesson-arc P7 |
| `LessonJournal` | the list of things made or solved, newest first, grouped by lesson; **no dates in a grid, no gaps rendered** |

**Tokens (adds to kids-ux §4.3; computed by `motivation-contrast.py`):**

| token | light (on `#FFF8EE`) | dark (on `#16140F`) | use |
|---|---|---|---|
| `grow.plot` | `#8C8478` 3.50 | | empty plot outline (= kids-ux `tile-border`) |
| `grow.leaf` | `#2F7A3E` 5.01 | `#5FBF73` 8.05 | sprout, Seekh rahi |
| `grow.flower` | `#A8326E` 5.95 | `#F08BBE` 8.01 | Aa gaya |
| `grow.fruit` | `#5B2E91` 8.87 | `#C3A6F5` 8.85 | Pakka. Same values as `jamun` in `visual-identity-contrast.py`, so the fruit and the brand accent are one hue. Never marigold `turn`, never brick `stop` |
| `grow.ring` | `#1F7A4D` 5.04 | `#4CC38A` 8.31 | Pakka ring (= `done`) |
| `grow.visitor` | `#2563C9` 5.37 | `#7FB0FF` 8.38 | review-due bird (= `listen` hue) |
| `sky.panel` | `#0F1A33` | same | sky panel in both themes |
| `sky.star.0/1/2/3` | `#7383A6` 4.54 · `#8FA6D6` 7.07 · `#C9D8FF` 12.13 · `#FFFFFF` 17.27 | same | Abhi nahi → Pakka (shape carries state; adjacent pairs only 1.42-1.72) |
| `sky.edge` | `#6276A3` 3.82 | same | prerequisite lines |
| `sky.label` | `#F6F1E8` 15.35 | same | star labels |
| `motion.milestone.max` | 1500 ms | | content animation; UI transitions keep gurukul's ≤ 300 ms |

---

## 13. Copy tone notes (shapes, never lines)

> **Prompt-writer warning (repo law):** anything sentence-shaped in a prompt gets recited. These are *shapes* for UI strings and Director templates. Never paste them into `compile()` as example lines.

- **Capability shape:** [what the child can do, in outcome words] + [how we know, one fact] + optional [what is next]. No adjectives about the child.
- **Comeback shape:** [the earlier attempt, neutral] + [today's attempt] + [the strategy that changed]. Never "finally".
- **Demotion shape:** [the skill] + [it slipped on two checks] + [the plan]. Never "lost", "forgot", "dropped" or "again?!".
- **Young:** ≤ 4-word labels; the Hindi sentence frame with English skill nouns (NCERT style); the action word last; speaker on everything.
- **Older:** dry, respectful, a numbers-literate cousin; no "kids", no "champ", no "superstar", no "topper".
- **Banned everywhere (bilingual lint list, extending PX4 and gurukul A4):** streak, din lagataar, XP, coins/sikke, level up, unlock, reward/inaam, rank, topper, percentile, "ahead of", jaldi/hurry, "last chance", "don't lose", miss/yaad aayi (about absence), wait/intezaar, kamzor, slow, tez as praise, smart/hoshiyaar as praise, genius.

---

## 14. Gates and measurements

**Build gates** (each needs a negative control, following gurukul's `check-*.mjs` discipline):
- **MW-G1 no-economy lint:** child-facing code, copy and asset names contain none of the §13 banned tokens or keys (`xp`, `coins`, `streak`, `unlock`, `leaderboard`, `rank`, `badge`). The negative control is a fixture string that must fail.
- **MW-G2 absence invariance:** render `GrowthGarden`, `SkyMap` and `ProtegeNotebook` with the clock at t and at t + 365 d and the same events. The DOM snapshots must be identical. This is gurukul A2 made executable.
- **MW-G3 cited milestones:** `MilestoneMoment`, `ThenNowCard` and progress callbacks throw without evidence ids, and the test feeds one without ids.
- **MW-G4 no time grids:** no calendar, heatmap or day-row component is importable from child surfaces (an import-boundary test).
- **MW-G5 one `turn` per screen** on all progress screens (reuse gurukul's exhaustive test).
- **MW-G6 protégé purity:** protégé state = f(teach-back events). A grep and type test ensures no `Date.now`, timers or `lastSeen` in its module.
- **MW-G7 contrast:** `motivation-contrast.py` thresholds go into CI next to `kids-ux-contrast.py`.

**Pre-launch measurements** (log each with n, method and date in `context/measurements.md`):

| id | question | method | decision it informs |
|---|---|---|---|
| MW-M1 | Does a progress surface raise *free-choice* persistence? | after the lesson ends, offer "one more item, or stop"; compare the progress surface on vs a minimal end card; primary outcome = delayed retention, secondary = free-choice uptake (Deci's classic measure) | keep or simplify Bagiya/Aasmaan |
| MW-M2 | Can 6-7-year-olds read plant stages? | think-aloud, n ≥ 20 per band, "show me the one you know best" | stage shapes |
| MW-M3 | Is the protégé notebook read as a collection or prize? | code children's talk for "what will I get" / count-seeking; compare teach-back quality with vs without the notebook | strip props or the notebook |
| MW-M4 | Does the parent-reaction loop happen and matter? | % of milestones with a reaction; child-initiated next sessions on shared phones (hard: log who taps start) | keep, or move to the weekly report only |
| MW-M5 | Is Aasmaan babyish or cringe for 13-15? | 5-point rating + interview, n ≥ 15 | skin choice |
| MW-M6 | Harm watch | session-length tail, late-night share, B3-B4 single item "this app makes me feel pressured" | hard ceiling on any mechanic that moves these |
| MW-M7 | Counter-metric | learning (Pakka rate, delayed transfer) must not fall when engagement rises; report both together | blocks any "engagement win" that trades learning |

---

## 15. Decisions to log (each with its reversal condition)

| id | decision | rationale | reverse if |
|---|---|---|---|
| `mw-no-reward-economy` | no points, coins, badges, unlocks or streaks on any child surface | Deci 1999; Warneken; Silverman & Barasch; ICO | an RCT-quality comparison in Indian children shows a reward layer raises *delayed retention* (not DAU) without lowering free-choice persistence |
| `mw-no-time-grids` | no calendars, heatmaps or day rows on child surfaces | a grid is a streak without the word | children cannot find past work without dates (MW-M2 interviews) |
| `mw-display-monotone` | garden and sky show the max level reached; only two delayed misses demote | gurukul A2; kt-algorithms §2.6 | parents read Pakka as dishonest because it ignores decay (parent interviews) |
| `mw-two-worlds` | Bagiya for B1-B2, Aasmaan for B3-B4, one ledger | NN/g "babyish" risk; three-axis rule (kids-ux §1) | MW-M5: a single design rates fine in both bands |
| `mw-protege-grows-from-teaching` | protégé growth = teach-back events only; no needs | Kobayashi expectancy; T2; Liu 2025 | MW-M3 shows prize-seeking, or no gain in teach-back quality |
| `mw-milestones-cited` | milestones are capability changes with evidence ids, ≤ 1 ceremony per lesson | gurukul A1; Deci positive feedback | children ignore them (MW-M1 null on every secondary) |
| `mw-parent-reaction-loop` | one-tap family reaction relayed at the next lesson start | ICO family influence; PX one action | reaction rate < 10% after 4 weeks, or any sign of parent pressure through it |
| `mw-hpc-vocabulary` | goal card and self-check mirror the NCERT HPC | the child and parent meet the same language at school | NCERT revises the HPC (re-read the PDFs yearly) |

---

## 16. Open questions and risks

- **Retention cost.** Every competitor uses some reward layer, and Mindspark's Indian evidence comes bundled with its points system [M: verify "Sparkies" in the Muralidharan et al. papers]. Taxila cannot cite evidence that reward-free design retains *as well*. It is a bet on the fear-and-obligation test plus the Pakka loop. Run MW-M1 and MW-M7 before scale, and accept a DAU gap if learning holds.
- **Parents raised on ranks.** Indian parents may ask for marks and ranks (parent-experience §1). Aasmaan's counts and "your class is here" are the honest answer. A rank must never appear on the child side, even if a parent asks.
- **DPDP §9(3).** These surfaces only *display* the learning ledger that already exists. They add no new monitoring. Compliance is deprioritised by owner directive (CLAUDE.md, 2026-10-02). This note exists so the question is not lost when the learning profile gets its legal opinion (learning-science rule 34).
- **The bird could still feel like a chore** to some children. If MW-M2 interviews show "I have to feed it" readings, draw review-due on the teacher's side ("she has a question saved") instead of on the plant.
- **Asset cost on low-end phones.** Plant stages × plant kinds × beds is a large illustration set. Generate the variants procedurally from a small parts atlas, and measure frame time on a 2-3 GB device (kids-ux gate G9).
- **Verify before quoting:** Khan mastery points and level drops; Math Garden wilting and coins; Cimpian 2007 and Zhao 2017 details; Hanus & Fox and Sailer & Homner effect sizes; Long & Aleven results; the adult sample in Ten 2021.

---

## 17. Sources

- Deci, Koestner & Ryan 1999, PMID 10589297 (Europe PMC abstract) · Warneken & Tomasello 2008, PMID 18999339 · Henderlong & Lepper 2002, PMID 12206194 · Patall, Cooper & Robinson 2008, PMID 18298272 · Mueller & Dweck 1998, PMID 9686450 · Kamins & Dweck 1999, PMID 10380873 · Brummelman et al. 2014, PMID 24434235 · Cimpian et al. 2007, PMID 17470255 · Zhao et al. 2017, PMID 28898167. All via https://www.ebi.ac.uk/europepmc/webservices/rest/search and https://eutils.ncbi.nlm.nih.gov/
- Ten, Kaushik, Oudeyer & Gottlieb 2021, *Nature Communications*, "Humans monitor learning progress in curiosity-driven exploration" (Europe PMC)
- Wisniewski, Zierer & Hattie 2020, "The power of feedback revisited", *Frontiers in Psychology* (Europe PMC)
- Silverman & Barasch 2022, *JCR*, doi:10.1093/jcr/ucac029 (Crossref record with abstract) · Hanus & Fox 2015, doi:10.1016/j.compedu.2014.08.019 · Sailer & Homner 2020, doi:10.1007/s10648-019-09498-w · Cordova & Lepper 1996, doi:10.1037/0022-0663.88.4.715 · Long & Aleven, doi:10.1007/s11257-016-9186-6, 10.1007/978-3-319-39583-8_9, 10.1007/978-3-319-07221-0_47 (Crossref, https://api.crossref.org/)
- Hilz et al. 2023, *J Intell* 11(6) (Math Garden) · Liu et al. 2025, *Sci Rep* (AI teachable agents) · Jaeger et al. 2019, *Cogn Res* (Betty's Brain) (Europe PMC)
- Duolingo, streaks: https://blog.duolingo.com/how-duolingo-streak-builds-habit/ · path redesign: https://blog.duolingo.com/new-duolingo-home-screen-design/ · Wikipedia, Duolingo (criticism, 2023 grammar study, AI-first backlash): https://en.wikipedia.org/wiki/Duolingo
- Prodigy: NBC News https://www.nbcnews.com/tech/tech-news/child-protection-nonprofit-alleges-manipulative-upselling-with-math-game-prodigy-n1258294 · Education Week https://www.edweek.org/technology/popular-interactive-math-game-prodigy-is-target-of-complaint-to-federal-trade-commission/2021/02 · The Conversation https://theconversation.com/why-freemium-software-has-no-place-in-our-classrooms-181148 · Wikipedia https://en.wikipedia.org/wiki/Prodigy_Math_Game
- Synthesis Tutor: https://www.synthesis.com/tutor · https://www.synthesis.com/ · review comparison https://www.aitoolsforkids.com/blog/synthesis-tutor-vs-khanmigo-ai-math-tutor-comparison
- Khan Academy: https://en.wikipedia.org/wiki/Khan_Academy (help centre 403, mastery mechanics [M])
- Overjustification overview: https://en.wikipedia.org/wiki/Overjustification_effect
- NCERT PARAKH Holistic Progress Cards (Aug 2025): https://parakh.ncert.gov.in/hpc, Foundational, Preparatory and Middle Stage card PDFs under `/themes/parakh/hpc-files/cards-pdf/`
- Play Store review pulls (India and US storefronts, 2026-09-04 to 09-22, n = 600 per app): `docs/research/market/global-tutors-review-themes-2026-10-02.json`, `docs/research/design/onboarding-reviews-2026-10-02.json`. The US and IN samples are identical per app, so treat them as one sample
- Contrast computation: `docs/research/design/motivation-contrast.py` (WCAG 2 relative luminance, run 2026-10-02)

---

## Critique

**Reviewer stance:** senior children's product designer, adversarial. Written 2026-10-02 against the document as it stood. No new fetches. Every point below is an [I] inference from the document's own text unless it cites a section. Severity: **BLOCKER** (the document contradicts itself or a binding rule), **FIX** (change before build), **WATCH** (add a measurement).

### What holds up
Two worlds on one ledger, monotone display, cited milestones, protégé with no needs and the T1-T6 tests are sound. The evidence table is honest about [M] items. The attacks below are about places where the design breaks its own tests.

### A. Self-contradictions (BLOCKER)

- **C1. The review-due bird breaks T2 and MW-G2.** §5 draws the bird from "FSRS retrievability R < 0.9". R is a function of elapsed time. T2 says the render must be byte-identical after the clock moves +365 days, and MW-G2 tests exactly that. A plant that gains a bird *because time passed* is a decay display. **Correction:** the bird must be a function of an explicit ledger event, not of R. The server (or the Conductor) writes a `recheck_scheduled` row when it decides to schedule one at lesson start. The client renders from that row only. Remove "FSRS retrievability" from the evidence column. If the child is away a year, the garden is identical and the bird appears only once the teacher has queued the check. Same fix for the Aasmaan "re-check ready" ring.
- **C2. Capability props are a surprise-drop mechanic.** §4 bans "chests, surprise drops, spin wheels" as variable reward. §7 says props appear when a skill has been taught and "never announced in advance". An unannounced reward that arrives on mastery is a surprise drop, and it becomes expected after the second one (Lepper 1973: expected rewards are the harmful ones [S]). It is also a collection (a ruler, a number strip, ...) that a child can count. **Correction:** drop props from v1. If the protégé needs to show growth, the notebook page is enough. Re-admit props only if MW-M3 is run first and shows no collection-seeking. Delete "never announced in advance" as a defence; concealment is not a safeguard.
- **C3. Several "milestones" are badges with a different name.** "First Pakka ever", "bed complete" with a name board, "Pakka" fruit and "bridge crossed" are completion-contingent and countable, and the garden itself is a completion collection (a full bed is the visible goal). Deci's completion-contingent effect (-0.36) applies to expected, tangible-feeling markers. **Correction:** (a) remove the name board with the child's name and the "show your parent" card as a bed-complete artefact; (b) the child-facing milestone is only the spoken capability line plus the artifact, with no new object added to the world; (c) the garden shows no empty-plot count and no "x of y beds"; (d) rename the cap "≤ 1 ceremony per lesson" to a rule that the *absence* of a ceremony is never visible (today a skipped Pakka ceremony is "shown quietly", which is fine, but it must not queue a ceremony for later, since a queue is an unlock).
- **C4. The "Mummy ne dekha" chip is a parent-approval economy and breaks T2 and T4.** A chip that appears on some plants and not others makes the *absence* of a reaction visible on every other plant, which is the broken-streak pattern (Silverman & Barasch) applied to approval. §10's "no reaction is never a subject" is false at the pixel level. A 6-9 child will also learn that fruit earns a parent's attention, which is a contingent social reward. For teens it is surveillance-by-chip and conflicts with S9. **Correction:** show reactions only inside the next lesson's spoken hand-over (one time, no persistent chip). B3-B4: reaction is opt-in per milestone by the *child* ("share with family?"). "Show me tonight" is removed (it creates an obligation on the child). Add a hard rule that a reaction is never requested from the parent; the WhatsApp message offers it as one of three optional pictures and the default is no action.
- **C5. The goal card's "I'll do it by" is a deadline.** A date step fails T1 (remove the fear and obligation and the date is meaningless). **Correction:** steps are "what I'll do first" with no dates; the teacher proposes timing in lesson, not on the card. "One active goal" stays.
- **C6. §13 lint list would break real teaching content.** Banning "coins/sikke", "slow", "wait/ruko", "miss", "rank", "unlock" across child-facing code and copy (MW-G1) hits NCERT Class 1-5 money chapters (sikke, rupaye), slow-motion physics modules, "ruko" as an instruction and "rank" inside words (frank). **Correction:** MW-G1 scans *progress chrome* only (strings and keys in the Bagiya, Aasmaan, notebook, milestone and goal components), and lesson content has its own allow-list. Match whole words in Devanagari and Latin with word-boundary tests, plus negative controls for "frank" and "sikke" in a money lesson.

### B. Babyish for 10-15 (FIX)

- **C7. The 9 to 10 cliff.** Bagiya (B2, to 9) switches to Aasmaan (B3, 10+) by age alone. A mature 8-year-old, or a Class 5 child placed at Class 2 level, may find a garden babyish; a young 10-year-old may miss it. Placement is by level (learning-science), and the world is chosen by age band. **Correction:** at first run and in settings, the child (not the parent) can switch worlds; default by band, switch is one tap and keeps the ledger. Test both worlds with 9-11-year-olds in MW-M5, not only 13-15.
- **C8. ICO says 10-12 are the most reward-susceptible, and B3 gets the least.** The design offers 10-12 nothing playful beyond a map skin. Risk: churn to reward-based competitors. **Correction (no economy needed):** give B3 genuine autonomy and craft: a skin choice of three (sky, metro, "workshop" blueprint), freedom to reorder the map's *view*, and challenge-as-motivation (an optional "stretch" item framed as a puzzle with no reward). Add MW-M6b: B3 week-4 return rate against a reward-using control for information only.
- **C9. The protégé and the "garden walk" are weak for B3.** "A classmate who missed class" is better, but "tries it" with a deliberately wrong protégé is still a character. **Correction:** B3-B4 default to Explainer notes only; the protégé is off unless chosen. Remove the garden walk for B3-B4 and replace it with a 1-line tap on the map ("what changed since last time", from ledger rows, no days).
- **C10. Naming and tone.** "Pakka" fruit in purple is fine for 6-9; for 13-15 the halo star reads as a game rank. Keep the same states but allow the Older skins to use plain words ("solid", "pakka") and no halo glow; use a tick in a ring.

### C. Accessibility (FIX)

- **C11. Star size alone cannot carry state.** The §6 encodings are 12 / 14 / 18 / 22 dp. Abhi nahi (12 dp ring) versus Seekh rahi (14 dp dot) differ by 2 dp and by ring versus fill. On a low-end 5-6 inch LCD in sunlight, for low vision, and at the contrast of 1.42-1.72 between neighbours, they will be confused. **Correction:** minimum 16 dp drawn, state shape distinct in *silhouette* (ring, dot, four-point star, four-point star with ticked ring), no size dependence, and the label (state word) always shown beside the selected star, not only on tap.
- **C12. No non-visual route through the map.** A constellation canvas has no reading order for TalkBack. **Correction:** every map has a built-in **list view** (chapter, skill, state word, evidence link) which is also the low-end fallback (see C21). The sky is an enhancement; the list is the source of truth. For Bagiya, a spoken "garden summary" (3 short sentences) on the teacher tap, with captions.
- **C13. Audio on shared phones.** Earcons and spoken capability lines play in public places and while a sibling sleeps. **Correction:** earcons off by default, spoken line honours the lesson's volume state, and every spoken line has a caption (hard-of-hearing children, noisy homes).
- **C14. Reduced motion and vestibular.** The 1.5 s milestone and the plant "growing during the warm-up item" are motion on a screen that also carries a live lesson. **Correction:** `prefers-reduced-motion` and an in-app "kam halchal" toggle for all growth animation; growth is then a 150 ms crossfade; test that the final state is the same.
- **C15. Colour tokens and the bird.** The bird is blue (same hue as `listen`) sitting on a purple fruit: two hues carrying two meanings (review-due vs listening). Never rely on the hue; the bird must be a silhouette. Add a colour-vision simulation (protan/deutan) of all five Bagiya states to MW-G7, not just contrast ratios.
- **C16. Devanagari legibility.** "≤ 4-word labels" at an 11 px floor is too small for Devanagari matras at ages 6-7. **Correction:** a 16 sp floor for B1-B2 labels in Devanagari (not 11), and test with Noto Sans Devanagari at system font scale 130-200%.

### D. Too text-heavy for 6-9 (FIX)

- **C17. The capability note is a sentence with three parts.** [skill in outcome words] + [when it was proven] + [one specific thing the child did] is a long utterance for a 6-year-old, and "when it was proven" (a date) is an abstract concept before age 7-8. **Correction:** B1 gets a single spoken clause plus the artifact picture; no date. "Then vs now" is shown as two pictures with a gesture, not words. The three-part shape is for B2 upward.
- **C18. The notebook shows a transcribed child phrase in karaoke text.** ≤ 12 words of text for a non-reader is wasted, and ASR of child Hindi-English is error-prone, so "cleaned and re-voiced" can misquote the child, which breaks the "your own words" promise and T3. **Correction:** B1 notebook pages are the child's *picture or module snapshot* plus the child's own **audio clip** (≤ 5 s, local only until a retention rule exists, consistent with the v2 parent voice-note caveat), or the corrected pictures. Text only for B2 upward, with the original clip one tap away.
- **C19. Bed names are skill labels.** "adding up to 20" is text for non-readers. **Correction:** bed identity is a picture (the thing the skill is about) with the spoken name on tap.
- **C20. Self-check at P7.** HPC pictures are good; keep them to **three** faces and drop "I needed: teacher, protégé, nothing" for B1 (it is a three-way abstract question).

### E. Low-end Android and patchy data (FIX)

- **C21. A glow, halo and constellation canvas is a GPU cost on 2 GB devices.** Halos (blur/box-shadow), 100+ star nodes per subject for Class 8-9, and Rive/Lottie runtime alongside a live voice stream, modules and the teacher. **Correction:** budget a number, not a hope: Bagiya and Aasmaan must hold ≥ 30 fps on the reference low-end device *while a lesson's audio runs*, and there is a degrade ladder: full (halo, motion), reduced (static SVG with no halo), list-only. Choose by a first-run frame-time probe, and by `Save-Data` and device memory. Drop halos in favour of shape. Avoid a Rive WASM runtime for these screens; use static SVG state swaps plus CSS transform/opacity.
- **C22. Asset size claims are unverified.** "Under 150 KB per garden state" is [I]; multiplied by plant kinds × stages × beds it is not a budget. **Correction:** parts atlas total ≤ 300 KB gzipped for the whole of Bagiya, shared by all kinds (recolour/shape swaps by SVG `<use>`), cached by the service worker with a version key; state `display` is computed client-side from a *small ledger fold* (≤ 5 KB per child) that is synced when data allows and rendered from the last copy offline.
- **C23. Stale or conflicting state.** On patchy data and shared phones, the garden can show an old fold. A plant that grows *during* the warm-up item needs the server's verdict. **Correction:** growth animates only after the ledger acknowledges (with a short optimistic hold ≤ 2 s); if offline, the verdict is queued and the plant grows next time with no apology copy. Never show "syncing" to a child.
- **C24. Dynamic capability notes need TTS.** The doc says pre-rendered lines only for the protégé but capability lines name "one specific thing the child did", which is dynamic. On 2G/3G that is a latency and data cost, and offline it cannot play. **Correction:** compose capability lines from a **small set of pre-rendered clauses** (skill name clip + proof-type clip + strategy clip) so they can be cached, and fall back to caption-only when offline. Test the byte cost in the low-end data budget script.
- **C25. Shared family phones: B1-B2 has no PIN.** Aasmaan has a child PIN (S1); Bagiya shows a child's garden, names and "Mummy ne dekha" chips on a phone a sibling can open. **Correction:** a picture-PIN (3 pictures) at child-profile selection for B1-B2 as well, or hide parent-reaction chips entirely on B1-B2 (see C4). Do not show the child's protégé name on the lock screen or in notifications.
- **C26. Emoji in the mockups.** On Android 7-9 low-end devices emoji fonts vary or are missing. The mockups are fine as sketches, but the build must not use emoji glyphs for state (tofu squares would erase state).

### F. Evidence handling (WATCH)

- **C27. Effect sizes are borrowed from the wrong populations.** Deci -0.40/-0.36/-0.28 are free-choice outcomes in short lab tasks; Silverman & Barasch is adult consumer logs; Ten 2021 is adults. They support the *direction*, not the size, of what happens in a long-term tutor for Indian children, and §0.14 admits no reward-free UX has been tested. **Correction:** reword §0 points 1-3 so that the effect sizes read as "direction supported" rather than as predictions, and make MW-M1 and MW-M7 launch gates for the whole progress layer (not "before scale"), with a stated stop rule: if delayed retention drops against a minimal end card, remove the surface.
- **C28. The monotone display needs an honesty check.** Showing Pakka a month later while the teacher knows retrievability has fallen can be dishonest to a parent who is told "re-check due" elsewhere. Aasmaan's "re-check ready" is in-app only, but the parent sees it. **Correction:** keep monotone *for the child*, but define precisely that the parent view's word is the ledger word and that the child's map is "what you have shown", labelled so (a one-line "Kaise pata?" caption on every map: "shows what you have shown so far"). Add the question to MW-M4 parent interviews.
- **C29. Three [M] claims drive design decisions.** Math Garden wilting, Khan level drops and Mindspark Sparkies are marked "verify" but the product thesis cites them. Do not log them to `context/` until verified.

### G. Priority order for the author
1. C1, C2, C4 (internal contradictions that fail the document's own gates).
2. C3, C5, C6 (reward creep and lint scope).
3. C11, C12, C16, C21-C25 (accessibility and low-end, because they decide whether the product works on the target devices).
4. C7-C10, C17-C20 (age fit).
5. C27-C29 (evidence wording and logging discipline).
