# World concept: the Atlas, a living India where what grows is your understanding

**Status:** concept proposal. Round 3, game stream, designer "world" (one of three independent concepts). Written
2026-10-09. No product code was written or changed.

**Binding inputs:**
- the owner directive of 2026-10-09 (two-way teacher, voice signals, live-build content, duplex, natural, relational,
  human; "the content which is built is cheap and basic and nonsense and in particular style only and when seen in the
  site is not viewed properly and totally broken"; "we are cracking the gamification of learning");
- `docs/design/reset/VALUES-100.md`;
- `context/rejected.md` (read first);
- `docs/design/reset/DESIGN-V3.md` and `STUDIO-V2.md`;
- `docs/research/content/game-mechanics.md` (rules G1-G14);
- `docs/research/design/motivation-without-rewards.md` (MWR);
- `docs/research/psychology/motivation-habits.md`;
- `docs/design/round2/content/RESEARCH.md`.

The child-safety floor and NEVER MANIPULATE outrank everything here.

**Evidence tags.**

| tag | meaning |
|---|---|
| **[V]** | read this session in the primary source or its abstract (OpenAlex abstract index, Crossref record, publisher or author page, the article itself) |
| **[S]** | secondary: news, a law-firm or press summary, a registry entry, a search-engine summary of an abstract |
| **[M]** | from memory or from an older sibling document, not re-checked today |
| **[U]** | a design hypothesis or estimate. It must be measured before anyone relies on it |
| **[C]** | computed or measured in this repo this session; n and method are given in §9 |

"via game-mechanics" or "via MWR" means the number comes from that sibling document and keeps that document's tag.

**Method and limits.** On 2026-10-09 I ran about 25 web searches and about 20 fetches: OpenAlex abstracts, Crossref,
publisher, news and registry pages. I also made three small measurements in this repo (§9). **No study tests a
learner-model-driven world for Indian 9-15-year-olds, or for any voice-first AI tutor.** Every transfer to Taxila is
labelled as one. Nothing in this document has been tried on a child.

**Verification pass (same day, a second sitting).** I re-checked every repo claim against the files and re-derived
every number. Seven errors were found and fixed, and each is listed in §9.6 so the fixes are visible:
1. lens and route edges that do not exist (Bundi off Vadgaon; a "value" lens to a dairy co-op);
2. a maths engine spec whose compare beat would never have fired;
3. two delayed checks aimed at the wrong skill;
4. an SST close that claimed `got_it` on an untaught skill;
5. the hour of the heat-lab minimum (03:00, not 04:00);
6. ambiguous kit item labels, now kit item ids;
7. a labelled wrong claim placed on a skill that was still practising, against the document's own Q6 rule.

One [M] tag was upgraded to [V] (IMD Chennai normals), and one new measurement was added (SST has no prerequisite
edges).

**The teacher lines below are illustrations of shape and register for human readers.** They must never be pasted into
a prompt: sentence-shaped prompt text gets recited (inherited law). Prompts carry shapes and facts, as everywhere else
in this repo.

---

## 0. The concept on one page

1. **The Atlas.** The world is a set of real Indian places drawn as stations on a route map. Examples: a fishing
   hamlet near Ennore, a village outside Nashik, a stepwell town, one riverside market seen across 4,000 years, a
   railway junction, a high-altitude observatory, a dairy co-op. The routes between stations are the real prerequisite
   edges from `data/curriculum`. Every place is open from day 1. There are no locks.
2. **A place is a working system, and that system is the concept.**
   - On the coast, the sea breeze that sets the boats' day *is* convection.
   - In the village, 24 m of fencing gives two families gardens of different sizes. That *is* area versus perimeter.
   - In a market where nobody has coins, a pot costs three trades. That *is* the double coincidence of wants.

   If the concept is not genuinely the place's system, the topic gets no place. It lives in an honest hub instead
   (Workshop, Lab, Reading Room). In a seeded random sample of 30 class 4-7 maths, science, EVS and SST topics, 24
   had a natural place, 5 went to a hub and 1 was excluded by the sensitivity policy [C, single rater, §9].
3. **The world always runs. What grows is the child's "why layer".** This layer is her own arrows, unit squares and
   trust chains, drawn over the living place:
   - **Pencil:** got it today.
   - **Ink:** right again on a later day, in a new form, without help. This is the learner model's `secure` state,
     drawn.

   Nothing wilts, and time never changes anything. Two delayed misses turn ink back to pencil. Nothing is ever erased.
4. **Today's lesson is a quest at one place.** It runs in this order:
   1. the delayed check comes first, so last lesson's pencil turning to ink is the opening moment;
   2. a resident's question;
   3. the child's prediction;
   4. an act inside a hand-built engine dressed as that place;
   5. one spoken "why";
   6. a labelled wrong claim to test;
   7. an abstract act;
   8. the child's own words go into that place's page of the Log.
5. **The teacher is a co-player, never an oracle and never a fake.** She proposes tests and holds the thermometer
   while the child steers. She relays the residents' claims and talks with the child while the child acts (duplex).
   She keeps quiet while the child works, and she never pretends to believe something false.
6. **Residents are present only through their work and their artifacts:** a wind board, a panchayat note, a stall.
   They never speak, never wait for the child and never plead. The teacher is the only voice in the world.
7. **Lenses.** A representation the child built in one place travels to others, but only along a prerequisite edge
   that really exists in `data/curriculum` or the kits. Her unit squares lay over a kite-maker's paper sheet (area of
   a triangle needs area of a rectangle), and her air-current arrows lie over a haveli's jaali. Far transfer is
   practised *in the world*. A lens is not an unlock: it exists because she made it.
8. **Family and peers.**
   - **Family:** in a slot the parent chooses, the child can give a family member a three-minute tour of one place,
     explaining its system in her own words. The reaction is passed back once, in speech.
   - **Peers:** deliberately not in v1 (§2.9).
9. **None of the following exist, on the Atlas or inside quest engines:** points, coins, XP, streaks, levels,
   leaderboards, unlocks, loot, collection counters, countdowns or lose states. The lint list is in §2.11.
10. **Built from verified parts.** Places, art, engines and facts are hand-built and reviewed offline. Live, the parts
    work like this:
    - code picks the quest;
    - one small model call may word it, inside a closed grammar;
    - each engine gets a spec and a skin.

    There is no live codegen (`forge-live-codegen-race`). A model failure makes a plainer quest, never a broken one.
11. **Phone first.** Every place plate is authored for the 326 × 334 px phone stage slot before anything else. Round 2
    measured 2886 of 3011 authored boards (95.8%) failing the fit gate at the phone tray.
12. **The honest expectation.** A world and a story are not the learning lever:
    - medium-depth stories gave g = −0.03 in Clark 2016, and realism gave −0.01 (via game-mechanics);
    - narrative games taught less than a slideshow in Adams 2012 [V].

    The world's job is the quality of motivation, return without pressure, transfer and the parent's view. It must
    prove it does no harm to delayed learning, and earn its place on return and transfer (§7). If it fails that test,
    it goes.

---

## 1. Research

### 1.1 Why worlds and stories usually fail to teach, and what that forces

| source | what it measured | finding | tag |
|---|---|---|---|
| Clark, Tanner-Smith & Killingsworth 2016, *RER* | K-16 game media comparisons, k = 57 | story depth: none 0.44, thin 0.47, **medium −0.03**, thick 0.36 (k = 5). Visual realism: schematic 0.48, cartoon 0.32, **realistic −0.01**. Anthropomorphism: low 0.37, **medium 0.04**. Single player without competition 0.45 vs competitive −0.06. Teacher-provided scaffolding 0.58. Multiple sessions 0.44 vs single 0.08 | via game-mechanics [V full text] |
| Adams, Mayer, MacNamara, Koenig & Wainess 2012, *J Ed Psych* 104:235 (doi 10.1037/a0025595) | college students; *Crystal Island* (pathogens) and *Cache 17*; matched slideshow controls; Exp. 2 removed the narrative theme | the game groups did **worse** than the slideshow on retention, transfer and rated difficulty. Removing the detective story changed nothing. No support for the discovery or narrative hypotheses in sessions under two hours, and longer play was untested | [V abstract] |
| Wouters et al. 2013, *J Ed Psych* | serious games, k = 77 learning, k = 31 motivation | learning d = 0.29, but **not more motivating** (d = 0.26, ns) | via game-mechanics [V abstract] |
| Habgood & Ainsworth 2011 | Zombie Division, ages 7-11 | intrinsic integration (the maths *is* the combat) gave more learning and **7× the voluntary play time** of the same maths placed between fights | via game-mechanics [V] |
| Barab et al. 2009, *IJLM* (doi 10.1162/ijlm.2009.0023) | Quest Atlantis, a 3D multi-user world for ages 9-14 | "transformational play": the player is a protagonist who must use the curricular concepts to change the fictional situation. Worked examples only; this session found no comparative effect sizes | [V abstract] |
| Rowe, Shores, Mott & Lester 2011 | Crystal Island, 153 eighth graders | engagement during play correlated with learning gains, independent of prior knowledge. Correlational | [S] |
| Rodrigues et al. 2022, *IJETHE* (doi 10.1186/s41239-021-00314-6) | gamified vs plain system, N = 756, 14 weeks, 7 measurement points | **novelty effect**: the gamification gain began to fade at about week 4. Between weeks 6 and 10 it partly recovered ("familiarisation"), a U shape | [V abstract] |
| Slattery et al. 2025, *Review of Education* | Minecraft, 29 pre-post studies to Feb 2024 | promising for spatial, creative, maths and science outcomes, but **every study was at medium or high risk of bias** | [S] |
| Roblox systematic review 2023 (Educ. Sci., 40 studies) | Roblox in learning | positive attitudes and engagement; small single-group studies; cyberbullying and weak teaching design were flagged | [S] |
| Long & Aleven 2014; Nuraydin, Stricker & Schneider 2022 | DragonBox; a fraction number-line game RCT, n = 188 | in-game success did not transfer to paper or to untrained tasks (`in-game-success-as-mastery`) | via rejected.md |

**What this forces, as rules:**
- **R-W1. Thin inside, thick around.** Inside a learning act, the place gets at most one or two spoken sentences of
  framing (Clark's thin-story row). The world's richness lives around the act: the Atlas, the opener, the close, the
  Log. It never covers an open probe.
- **R-W2. Painterly places, schematic acts.** The place plate can be cinematic. The things the child manipulates and
  reads (grid cells, arrows, thermometers, goods) stay schematic, code-drawn and labelled by code (Clark's realism
  rows; `generated-media-carries-facts`).
- **R-W3. The act is the game.** Every quest beat inherits G1 and G2: remove the world and the child performs the same
  acts on the same items; remove the learning and nothing in the world changes.
- **R-W4. The teacher is the active ingredient.** Clark's teacher-provided scaffolding is 0.58, and GraphoGame's
  high-adult-interaction row is 0.48 (via game-mechanics). The world exists so the voice teacher has something to
  teach *about*, not to replace her.
- **R-W5. Judge it at 12+ weeks.** Any week-2 retention win is presumed to be novelty (Rodrigues 2022).

### 1.2 What brings 9-15-year-olds back without dark patterns

| source | what it measured | finding | what transfers to Taxila |
|---|---|---|---|
| Ryan, Rigby & Przybylski 2006, *Motiv Emot* (doi 10.1007/s11031-006-9051-8) | 4 studies; players of 1, 2 and 4 games, plus an online multiplayer community | in-game autonomy and competence predicted enjoyment, preference and short-term well-being. In the multiplayer study, relatedness also independently predicted enjoyment and future play | [S] the "pull" is need satisfaction, not rewards |
| Sailer, Hense, Mayr & Mandl 2017, *Comput Hum Behav* (doi 10.1016/j.chb.2016.12.033) | randomised, game elements varied in a simulation | badges, leaderboards and performance graphs raised **competence** satisfaction and task meaningfulness. **Avatars, meaningful stories and teammates raised social relatedness.** No element moved autonomy as intended | [V abstract] Story's real job is relatedness, not learning. Competence can come from *performance graphs* (information) without badges |
| Birk, Atkins, Bowey & Mandryk 2016, CHI | 126 players, endless runner | identifying with the avatar (similarity, embodied, wishful) went with more autonomy, immersion, effort and enjoyment, and with **longer free play** | [V abstract] Identity investment drives return. Taxila's version: the child's own representations and words in her world, plus the teacher she chose |
| Bureau, Howard, Chong & Guay 2022 ("Pathways to student motivation") | meta-analysis, 144 studies, > 79,000 students | autonomous motivation goes with well-being, persistence and achievement; autonomy support feeds it | [V abstract] |
| Deci, Koestner & Ryan 1999 | 128 experiments | expected contingent rewards lower free-choice motivation (−0.28 to −0.40) and are worse for children; informational positive feedback raises it (+0.33) | via MWR [V]. **The world must deliver information, not prizes** |
| Patall, Cooper & Robinson 2008 | 41 studies | choice raises intrinsic motivation; strongest for children with 2-4 options and no reward afterwards | via MWR [V] |
| Ten, Kaushik, Oudeyer & Gottlieb 2021 | free-choice learning | learning *progress* explains what people choose | via MWR [V] adult sample |
| Yeager, Dahl & Dweck 2018; Bryan, Yeager, Hinojosa et al. 2016, *PNAS* | adolescents; 536 eighth graders, randomised | teens respond to status and respect. Framing healthy eating as standing up to manipulative marketers changed real snack choices a day later | [S] for Bryan. A respectful "this app does not use streaks, because streaks are built to make you anxious" is a values-aligned message for teens, not a lecture [U] |
| Ghibellini & Meier 2025, *Humanit Soc Sci Commun* | meta-analysis of interrupted-task studies | the **Ovsiankina** tendency to resume an unfinished task is general; the Zeigarnik memory advantage is not | [S] An open question visible at a place is a legitimate pull, as long as nothing is lost by waiting |
| Long & Aleven 2013 (AIED) / 2017 (*UMUAI* 27:55) | 62 seventh graders, an open learner model with self-assessment prompts | students with the open learner model learned more on the post-test | [S] showing the child her own model helps her learn |
| Kobayashi 2024 (learning by teaching) | meta-analysis | expecting to teach g ≈ 0.48; without the expectation ≈ 0 | via MWR [S] The family tour gives the child something real to teach *for* |
| Silverman & Barasch 2022 | 7 studies | a broken streak lowers engagement through how it is *drawn*, more so with self-blame | via MWR [V] |

**What transfers:**
1. Competence information beats rewards.
2. Relatedness is what story and avatars actually buy.
3. Choice between 2 and 4 options.
4. Identity investment.
5. Respect for teens.
6. Open questions that wait without loss.

All six can be built without one manipulative mechanic, and the concept is assembled from exactly these six.

### 1.3 Product teardown: what keeps children coming back, the evidence, the critique

| product | what pulls children back | evidence | critique | Taxila takes | Taxila rejects |
|---|---|---|---|---|---|
| **Duolingo** | streaks, leagues, the owl, short sessions; hearts until July 2025, then **energy**, which drains on every exercise | the company's own A/B posts (e.g. +3.3% day-14 retention from separating the daily goal from the streak) [S]. 7-day streak ↔ 3.6× completion (correlational), via MWR [V]. **No independent controlled study of streaks and long-term learning was found** [S] | streak anxiety and sunk cost ("losing almost 1k days", via MWR). The energy system was read as monetised pressure [S] | short sessions; the character opens the lesson | every loss-framed or currency mechanic |
| **Prodigy** | an RPG world, pets, a membership tier | efficacy reports published by the company compare high-usage schools with state averages, with no matched controls [S]. A district analysis found +0.73 scale points per hour (correlational) [S]. A 2022 causal-comparative study found no achievement difference (via game-mechanics [V abstract]) | Fairplay's FTC complaint: "16 unique advertisements for membership and only four math problems" in 19 minutes; paid players progress faster (via MWR [S]). The maths is the toll for the fun | children love a world that evolves with them | maths as a toll; pay-to-progress; status that can be bought |
| **Roblox (incl. Roblox Education)** | creating and owning worlds, identity through avatars, social play | learning studies are small, mostly single-group (2023 review) [S] | state attorneys general sued over child sexual exploitation (Louisiana Aug 2025, Kentucky Oct 2025, Texas Nov 2025). Federal cases were centralised as MDL 3166 (Dec 2025). Facial age checks became mandatory for chat worldwide in Jan 2026, and several states settled in 2026 [S]. The economy critique: the creator payout rate is far below the purchase price of Robux (People Make Games 2021 and later reporting) [S] | ownership of a place; identity; a world that persists | open child-to-child chat; a creator economy; any currency |
| **Minecraft Education** | building, freedom, persistence | 29 studies, all at medium or high risk of bias [S] | the learning depends on teacher design | building inside constraints; the child's work persists | an open sandbox with no learning model behind it |
| **Quest Atlantis / River City** | being the protagonist whose knowledge changes the world; a persistent multi-user world | worked examples and design-based research [V abstract]; this session found no clean effect sizes | needed heavy teacher orchestration | **transformational play** as the quest shape | multi-user worlds for children (safety; Clark MMO −0.05) |
| **Knowledge-gated games** (*Outer Wilds*, *Tunic*; "Metroidbrainia") | progression gated by what the player has *understood*, not items. *Outer Wilds* keeps only the player's knowledge (its ship log) between loops | design genre; scholarly description only [S] | can frustrate without scaffolding | **knowledge as the only progression**; the log as the "collection" | (none: the scaffold is the teacher) |
| **Khan Academy** | mastery levels, course mastery, energy points and badges | via MWR [M] | points and badges | named mastery states and mixed review | points and badges |
| **NCERT's own new books** | maths chapters are already set in places: *The Cleanest Village*, *The Transport Museum*, *The Dairy Farm*, *Coconut Farm*, *We the Travellers* | `data/curriculum/c4-maths.json`, `c5-maths.json` [C] | — | the Atlas can share the textbook's own settings, so school and Taxila agree | — |

**The cross-cutting lesson** (it extends MWR §2): each product's world is shaped by what that product is paid for.
Prodigy's world sells membership, Roblox's world sells Robux, Duolingo's owl sells daily actives. A world whose only
state is the *calibrated delayed-retention ledger* cannot be bent toward any of those. That is the core design move
here.

### 1.4 Dark patterns and the law

- **Radesky et al. 2022, *JAMA Netw Open* 5(6):e2217641.** In apps used by 160 children aged 3-5, most apps had
  manipulative design, and only about 1 in 5 had none. The categories were parasocial relationship pressure,
  fabricated time pressure, navigation constraints, attractive lures and advertising pressure. Exposure was higher in
  lower-income homes [S]. Two of these categories shape this design: **parasocial pressure** is why residents never
  speak or wait, and **fabricated time pressure** is why quest engines run untimed.
- **FTC and HoYoverse (*Genshin Impact*), January 2025.** A $20 M settlement over loot boxes marketed to children and
  misleading odds. Purchases by under-16s now need parental consent, and odds must be disclosed [S].
- **EU Commission guidelines on protecting minors under DSA Art. 28 (14 July 2025).** They recommend switching off
  features that encourage excessive use, naming streaks, read receipts, autoplay and push notifications. They also
  recommend guarding against manipulative design and the exploitation of virtual currencies and loot boxes [S].
- **India.** The Online Gaming Act 2025 bans money games whose stakes include coins or tokens convertible to money
  (via game-mechanics [S]). DPDP NM-8 bars engagement as an objective (via game-mechanics). Having no currency at all
  keeps both questions simple.

### 1.5 Families: what parent-visible progress does and does not do

- **Berkowitz et al. 2015, *Science* 350:196.** 587 first graders were randomised to short parent-child maths story
  problems on an iPad, or to a reading control. Maths achievement rose over the year, most for children of
  maths-anxious parents [V abstract]. *What transfers:* the active ingredient was a **parent-child interaction about
  the content**, not a progress report.
- **Bergman & Chan (*J Hum Resour* 2021; 2019 working paper).** Weekly automated texts to parents in 22 middle and
  high schools cut course failures by about 28% and raised attendance by about 12%, with no effect on state tests [S].
- **Rocket Learning, Amravati trial registry (AEA 17446).** The base WhatsApp programme engaged parents but **did not
  improve** children's outcomes. An intensive version with personalised messaging and worker support gave +0.12σ [S].
  *What transfers:* a notification to a parent is not learning. The tour (§2.9) puts the child's explanation, the
  learning act, in front of the parent.
- **ASER 2024 (rural India, ages 14-16).** About 90% of households have a smartphone, and 82% of these children can use
  one. Of those who can, 57% used it for education in the past week and 76% for social media [S]. *What transfers:*
  the phone is shared and is a family object, so a family-facing world fits real homes.

### 1.6 India facts that shape the world

- **Market maths.** Children who work in markets solve market sums but fail them in school format, and school
  children fail applied problems (Banerjee et al., *Nature* 2025, n = 1,436 + 471; via game-mechanics [V]). Places
  where the concept is a real working system build that bridge in both directions. Every place quest ends in the
  written form (G8).
- **Local expert knowledge exists and has words.** Chennai fishers name their winds. *Kachan eeran* is a south-easterly
  sea breeze that sets in by about 10 am and strengthens through the day. *Kodai* is a westerly. *Odukkam* is the
  pre-dawn drop to calm, around 5:45 am. The article explains the cycle the way NCERT does: land heats faster than the
  sea (Nityanand Jayaraman, "A Good Storm", *The Wire Science*, 2022-04-07) [V]. A world built on that respects
  fishers as experts. It does not use their community as a backdrop.
- **Harappan weights.** They were standardised, mostly cubes of banded chert. The small ones were binary (1, 2, 4,
  8, 16, 32 …) and the large ones decimal. Weights from five layers show no significant drift, which suggests strong
  control over about 500 years (harappa.com; CSMVS museum notes) [S]. This is a real link between maths and SST in one
  place.
- **Maps of India are legally and politically sensitive** [M]. The Atlas is drawn as a **route diagram**, never a
  national outline. The existing `map-route@1` engine already draws Natural Earth land with no borders.
- **Sacred places and contested history.** One sampled topic, *How the Land Becomes Sacred* (Char Dham, Kumbh), is not
  turned into a quest place. Sacred sites are never quest objects. Contested framings (for example the kit's
  "Sindhu-Sarasvati") are taught as the textbook states them, with the uncertainty the kit already carries.
  Myth is never presented as fact.

### 1.7 What this repo already decided that the world must respect

| id | what it says | what the world does |
|---|---|---|
| `design-v3-no-streaks-mastery` | no streaks, points, XP, levels or leaderboards; progress = shape-coded mastery | the Atlas uses the same shapes. Pencil = "met once" (outlined), ink = "secure" (filled) |
| `ds-progress-no-meters` | progress is a monotone, absence-invariant map. No props, no name boards, no persistent family-reaction chip | the why layer is monotone except on evidence. It has no props and no boards; reactions are relayed once in speech |
| G1-G14 (game-mechanics §2) | VerifiedAct only; remove-the-game and remove-the-learning tests; no RNG in the progress path; no currency or unlocks; only artifacts and capability statements persist; untimed by default | the world is not game state. It is a **view of the ledger plus the child's artifacts**, so G5 holds |
| `design-v3-one-band-9-15`, `design-v3-dark-instrument-identity` | one grown-up band, dark instrument UI; images are cinematic material renders or the teacher | proposes **one amendment**: a third image kind, "place plates" (§8) |
| `design-v3-stage-contract`, round-2 fit finding | one fixed slot, 326 px floor, labels ≥ 12.4 px | plates and overlays are authored at the floor slot first |
| `forge-live-codegen-race`, `live-free-generation` | no generated code reaches a child live; the live path is engine params and the scene DSL | quests are specs over hand-built engines |
| `generated-media-carries-facts`, `diagram-router-no-baked-labels` | generated pixels carry no facts and no baked labels | plates are ambience only; every fact is drawn by code |
| `w2i-floor-goodbye-line`, `open-goodbye-continue-policy`, `never-rules-teaser-continue-next-time` | goodbye: one short warm close, no plan, no hook | the world never supplies a goodbye hook. The open question sits on the place, visible, with no clock |
| `wb-dose-by-schedule` | an adult fixes the dose; nudges never use mood or streaks | the world does not drive *frequency*. It drives *wanting to come*, inside the parent's slots and caps |
| `alpha-style-surveillance-and-tracks`, `ct-no-voice-emotion-inference` | no emotion inference; engagement from task evidence and the child's words only | voice-signal moves use knowledge states only (§2.6) |
| `rj-share-uptake-follow-up-question` | a share gets one warm specific line, no follow-up question | an on-topic share becomes a test in the engine, never a chat thread |

---

## 2. The concept in detail

### 2.1 The Atlas

```
┌────────────────────────────────────┐
│ Atlas                 Maths ▾  List │   "List" is the source of truth (existing)
│                                     │
│   ● Workshop ──────── ◯ Bundi       │   hub (common factors) → HCF tiles
│                                     │   routes = real prerequisite edges
│   ◐ Vadgaon ───────── ◯ Patang gali │   area → area of a triangle
│                                     │   shapes = design-v3 states, colour last
│   ◑ Ghat Bazaar                     │   SST system: no edge exists yet, no line
│    ▲ your class is here             │   school-alignment marker (existing idea)
│ ┌─────────────────────────────────┐ │
│ │  painted plate: Vadgaon at dusk  │ │   cinematic, no text in pixels
│ │  fence posts in pencil           │ │   why layer drawn by code
│ │  "Same wire, same garden?"       │ │   the open question, Q8-checked text
│ └─────────────────────────────────┘ │
│ [ Start lesson · Vadgaon ]          │   the screen's one volt
└────────────────────────────────────┘
```

**What the Atlas shows and why:**
- **Stations are places, plus three hubs:**
  - *Workshop*: abstract maths (integers, algebra, number play, constructions);
  - *Lab*: microscopic and bodily science (cells, stomata, breathing rate);
  - *Reading Room*: languages, values, and SST topics about sacred or contested matters.

  A hub never pretends to be a place.
- **Routes are prerequisite edges, and only real ones.** Every line is an edge in `data/curriculum` or a kit's
  `prereqSkillIds`; nothing is drawn because it would look good.
  - *Patang gali*, a kite-makers' lane, sits on Vadgaon's route because the kit's triangle skill
    (`c6-maths-ch06-t03-s1`, a right triangle as half a rectangle) requires `c6-maths-ch06-t02-s2`.
  - *Bundi* hangs off the Workshop's common-factors line (`c7-maths-ch11-t01` ← `c6-maths-ch05-t01`, `t04`), not off
    Vadgaon. The first draft of this document drew Bundi on Vadgaon's route; no such edge exists
    (`rj-world-invented-edges`, §8).

  A child sees *why* one thing comes before another. This is the open-learner-model value of MWR's Aasmaan, carried
  over.
- **Measured gap: SST has no edges.** All 250 class 4-7 maths, science and EVS topics carry at least one prerequisite
  edge, but none of the 34 class 6-7 SST topics does [C, §9.5]. Until reviewed SST edges are authored, SST systems are
  drawn as stations with no line. They are never connected by invented edges (`open-world-sst-edges`).
- **Shapes follow DESIGN-V3 §10 exactly:**
  - filled = secure (ink);
  - outlined = met once (pencil);
  - hatched = working on it;
  - dark = ahead;
  - amber dot = check-in due, drawn only from a server `recheck_scheduled` row.

  There is no percentage and no "12 of 40 places" (`rj-world-collection-counter`, §8).
- **"Your class is here"** marks the place hosting the school's current chapter. A child placed below class level sees
  the route *to* it, never a deficit (MWR §6).
- **Everything is open.** The child can wander to any station between lessons and read its open question. A visit
  outside a lesson shows the plate, the question and the child's why layer. It holds no content loop to get lost in,
  so it is not a time sink.
- **The Atlas is not India's outline.** It is a route diagram (§1.6).

### 2.2 A place is a working system: the place file

Each place is a hand-authored, reviewed data file. It holds no code and no prose the teacher could recite.

| field | what it holds | who writes it | checked by |
|---|---|---|---|
| `id`, `region`, `kind` (place / hub) | `ennore-kuppam`, `Tamil Nadu coast`, place | author agent | schema |
| `facts[]` | each cultural, geographic or historical claim the place makes, with a source URL and date | author agent + blind fact-checker | 100% sourced, or the claim is dropped; human cultural reviewer |
| `params` | the physical or economic numbers engines use at this place (land and sea temperature curves, prices, distances), each sourced | author agent | sourced values within engine clamps; otherwise the place stays unnamed |
| `systems[]` | `{id, topicIds[], skillIds[], misconceptionIds[], archetypes[], board kinds[], lens}` | author agent from the kits | every id exists in `data/kits`; every archetype exists in the studio registry |
| `questions[]` | the open questions the place asks (closed list, ≤ 48 characters each, bilingual) | author agent | Q8 text safety; human review |
| `artifacts[]` | the residents' artifacts (wind board, notice, ledger page) as code-drawn templates with slots | author agent | no names of real private people; no PII |
| `skins{}` | for each archetype: plate, palette, sprite atlas, ambient loop | art pipeline | budgets, OCR no-text, human review |
| `sensitivity` | religious, caste, occupational and contested-history flags, plus the reviewer's notes | cultural reviewer | blocks shipping until resolved |

**The admission test for a place:** if you remove the place, the system must still be the concept (remove-the-world).
If you remove the concept, the place must have no system left (remove-the-learning). A place that is only a costume
around a quiz is rejected. This is the owner's "nonsense" complaint turned into a gate.

### 2.3 The world is a view of the ledger

`worldOf(ledger, artifacts, choices) → AtlasState` is a pure, deterministic, clock-free fold:

| input | from |
|---|---|
| skill states (`not_started`, `practising`, `got_it`, `secure`) and `recheckScheduled` | the existing `ChildMapSkill` (`shared/contracts.ts`) |
| the child's artifacts | stored acts: her plot rectangle, her arrows, her cleaned explanation phrase, each with evidence ids |
| her choices | which station is "next of 3", her chosen skin, the time-of-day slider positions she left |

The output, for each place and each system:
- the why-layer state: `question`, `pencil`, `ink` or `pencil-again`;
- the evidence ids behind it;
- the lens availability, and the Log entries.

**The four invariants**, each a code gate:
1. **Absence invariance.** Move the clock forward 365 days and the render is byte-identical. This extends PD-G19.
   There is **no real-clock content**: no day/night by device time, no "the boats leave at 5 am, come and see"
   (`rj-world-real-clock-ambient`, §8). Time of day is a slider the child owns, and in heat-lab it is the experiment
   variable itself.
2. **Evidence.** 100% of visible why-layer changes cite ledger rows, and the child and parent can open "How do we know?"
3. **Determinism.** Replaying the event log reproduces the world exactly, the same discipline as the learner fold.
4. **No other state.** The world has no inventory, no currency, no counters and no quest-completion flags. A finished
   lesson changes the world only through the ledger it wrote.

**Consequence, not decoration.** Every world change is a consequence the concept predicts, drawn by the place model:
- the child's arrows on the coast;
- her unit squares in the field;
- her trust chain over the market.

Nothing ornamental appears as a result of learning: no fireworks, no new buildings, no flowers for a right answer.
The world was always alive. What changes is that the child can now *see why*. This is Deci's informational feedback
in its purest form, and it is not an expected tangible reward, because there is nothing to have.

### 2.4 Lenses: your representations travel

When a system turns to ink, the representation the child built becomes a **lens**:
- the unit-square overlay she laid;
- the air-current arrows she placed;
- the trust chain she explained.

At any later place with a system that a real prerequisite edge connects (curriculum `prerequisites` or kit
`prereqSkillIds`), she can switch the lens on. It overlays her own representation onto the new engine or board. The
examples below use only edges that exist today [C]:
- at Patang gali (`c6-maths-ch06-t03`, area of a triangle), her unit squares go over the paper sheet a diamond kite is
  cut from, and show the diamond is half its rectangle. The triangle skill requires her area skill
  (`c6-maths-ch06-t03-s1` ← `c6-maths-ch06-t02-s2`). The same lens is admissible in class 8 at "doubling and halving a
  square" (`c8-maths-ch09-t01` ← `c6-maths-ch06-t02`);
- in a Jaisalmer haveli, her air-current arrows say where the jaali and ventilators must go. These are the kit's s4
  design items (AC high, exhaust high), and s4 requires s1. The other two edges out of convection go to the water
  cycle (`c7-science-ch07-t04`) and, in class 8, formation of winds (`c8-science-ch06-t02`).

Where no edge exists, no lens is offered. The barter-to-money topic has no outgoing edge at all (§3.3).

**This is the knowledge-gated progression of *Outer Wilds* without its frustration and without any unlock.**
- Places are never locked.
- The lens is not a power-up; it is her artifact.
- Using it well requires the understanding it came from.
- The teacher offers it ("tumhare Vadgaon wale squares yahan kaam aayenge?") only when the transfer edge exists.
- A wrong lens use is information, never a penalty.

### 2.5 Today's lesson as a quest

The arc maps onto the existing lesson arc and Conductor plan. It adds no new phase.

| beat | what happens | existing machinery it uses |
|---|---|---|
| Q0 Atlas | Home leads with one place card: its open question, and the reason ("your class is on Area"; "you fenced Kaveri tai's plot last week") | DESIGN-V3 §9 "Up next", phrased as a question |
| Q1 Opener | a due delayed check takes the first slot; if it passes, last lesson's pencil turns to ink. This is the only ceremony of the lesson (≤ 1.5 s, interruptible) | `truth-d6-delayed-check-first-slot`; MWR §8 ceremony rules |
| Q2 Hook | a resident's artifact poses the question. The teacher relays it in one or two sentences | R-W1 thin framing; place `questions[]` |
| Q3 Predict | the child commits a prediction; no verdict before commit | kit `predict` items |
| Q4 Act | a studio-v2 engine, skinned as the place, untimed, with no lose state | `studio-spec@2` + `skin`; G6 in-world consequence; §5.5 |
| Q5 Why | one short spoken "how do you know" | G9 |
| Q6 Claim | a labelled wrong claim to test (a resident's note, or "a common idea"), only on skills at `got_it` or above | kit `error_spot` items; §2.6 honesty rule |
| Q7 Abstract | the written or symbolic form, on the board | G8; the board-first path |
| Q8 Log | the teach-back phrase, cleaned (≤ 12 words), joins the place's page of the Log | kit `teachback`; scanSafety + scrubPii |
| Q9 Close | the place shows today's pencil; the end card cites the evidence; the goodbye is one warm line with no hook | `w2i-floor-goodbye-line` |

Stop, break, leave and diversion follow CONVERSATION-V2 unchanged:
- stop gets one check-in;
- a second stop pauses the lesson;
- "leaving" pauses at once;
- no child request closes the day.

The world adds **one banned family of shapes**: world pressure. The banned shapes are "almost done with the harbour",
"the fishers need you", "don't leave Kaveri tai's plot half done" and "come back and see". These are candidates for
`floorViolations`. Following `never-rules-teaser-continue-next-time`, they are coded on a held-out corpus before
enforcement, not tuned to one coder.

### 2.6 The teacher as co-player

**Moves she has in the world** (shapes, not lines):
- **Proposes a test** of the child's own prediction ("test karte hain").
- **Shares the act:** "you steer, I'll read the thermometer". The child does the learning act; the teacher holds a
  tool or reads a value.
- **Relays a claim.** A wrong idea always arrives *labelled*: as a resident's note, as "a common idea", or as a kit
  `error_spot` character. **She never sincerely asserts a false belief as her own.** This is the honesty floor under
  the owner's "no lying". It is stricter than an unlabelled planted mistake (`world-honest-coplayer`, §8).
- **Offers a lens** when a transfer edge exists.
- **Names the concept** after the child has seen it, never before (predict → act → name).
- **Remembers the child's work** with evidence ids ("tumhara 6 by 6 wala plot"). This is the relational core without
  the companion register: she remembers the child's *work*, never her own feelings about the child.

**Duplex behaviour** follows the V5 bars, unchanged:
- **During an open engine act** she only backchannels ("hmm", "haan"). She never talks over a probe (G12).
- **On a barge-in** ("ruko, ulta kyun?") she yields, with a p50 ≤ 200 ms bar, and takes up the question.
- **During a child's thinking pause** in mid-explanation she waits. The tuned-silence bar applies.
- **On "haan" or "acchha"** while she speaks, she keeps going.

**Voice-signal moves** use knowledge states only (V2), never emotions. Each goes live only at precision ≥ 0.80 on
children, and runs in shadow until then.

| state (V2) | world move |
|---|---|
| confident-wrong | **the world runs the child's own model.** Her arrow is set and LOCK runs the truth, so both are visible side by side (Clark's "answer display"; G6) |
| fragile-correct | an on-path "prove it" (Andersen's only safe secondary objective): "ek square metre dikhao" |
| searching | she waits, with no hint |
| not-known | she teaches: worked example, then the faded version |
| guessing (rapid acts) | G13: two rapid guesses in a row pause the engine, and she asks for a prediction first |

### 2.7 People in the world

Residents exist through their **work and artifacts**: the crew's wind board, the panchayat noticeboard, a potter's
stall, a trader's boat. Plates may show distant figures at work, never close faces. They never speak in their own
voice, never address the child, never wait, never suffer from the child's absence and never thank her.

Why so strict:
- Clark's medium-anthropomorphism row is 0.04, against 0.37 for low.
- "Parasocial relationship pressure" is Radesky's first category.
- The kids-ux rule bans fake peers.
- One teacher, one voice keeps the relationship clear.

Their *problems* are puzzles, never emergencies. Real occupations appear as **expertise**: the fishers' wind names, the
potter's matka, the co-op's accounts. They never appear as poverty or as backdrop.

### 2.8 The Log: collections, done honestly

The task brief asks for "collections tied to real mastery". G4 bans collectibles, and the chapter seal was allowed only
as "never collected or counted". The honest version is a **Log** in the *Outer Wilds* ship-log sense: one page per
place, holding:
- the child's own explanation phrases;
- the representations she drew, which become lenses;
- the claims she disproved;
- the dates and the evidence.

It is the existing Notebook / Explainer notes, given a home in each place.

**Rules:**
- no counter;
- no empty slots "waiting to be filled";
- no completion art;
- no page appears without a ledger row.

For older children it doubles as a revision sheet in NCERT outcome language. That is where the world meets test prep,
and it is the only place it does. MW-M3 (MWR) is the watch: if children start asking "what do I get", the Log loses
its place framing first.

### 2.9 Family and peers

**The tour (family):**
- It is offered in a parent-chosen slot, at most once a week, and always optional for the child.
- The teacher prepares the child in one short move ("kis jagah ka tour doge?").
- The child explains one place's system to a family member at the phone, in her own words, with the place on screen.
- Nothing is recorded: no adult audio is stored (MWR §10, v1 rule).
- The parent can tap one reaction afterwards. The teacher relays it **once, in speech**, at the next opener. No chip
  persists (`ds-progress-no-meters`).

Why the tour exists:
- Berkowitz 2015: the parent-child interaction about content is the active ingredient.
- Kobayashi: expecting to teach is what makes teaching work.
- Rocket Learning: notifications alone did not move learning.

A tour has no "failed" outcome, and a parent never sees one.

**The parent's Atlas:**
- The Parent corner shows the same Atlas in the Day theme.
- Each place carries "How do we know?" links: date, help or no help, and the child's own words.
- The meaning of pencil and ink is written in plain words.
- The weekly report row names the place and the capability, for example: "worked out why the sea breeze comes in by
  mid-morning, and explained it in her own words; a check is due later this week."

**Peers are deliberately not in v1.** The evidence and the floor both say no:
- Clark: competitive −0.06 and MMO −0.05.
- Exemplary peers cause dropout (Rogers & Feller, via MWR).
- Roblox's child-safety record (§1.3).
- There is no safe way to show one child's words to another without moderation, a PII review and consent design.

One future direction is logged as open, not designed: a classroom "co-op place", where a class restores one place
together and no individual contribution is ranked (`open-world-peer-coop`).

### 2.10 Choice and autonomy

These choices follow Patall's 2-4 options, and none has a reward attached:
- **next of 3** places on the route, where several are admissible;
- **the order** of due checks (MWR §9);
- **the time-of-day slider** where physics needs it;
- **the skin of the route map** (stations or a riverline);
- **which place** to tour.

The rule from learning-science rule 26 holds: never offer a choice between the evidence-based core and fluff.

### 2.11 NEVER MANIPULATE: the world lint

| mechanic | verdict | test | enforced by |
|---|---|---|---|
| points, coins, XP, gems, currency of any kind | banned | G4 | studio lint L3 (existing `points/coins/score` identifier ban) + a world-data schema with no numeric fields shown to the child |
| place locks, unlockable areas, cosmetics earned by learning | banned | G4; T5 toll test (MWR) | schema: every station is `open: true`; nothing in `skins` keys on a ledger state |
| "N of M places" counters, completion bars, set-completion art | banned on the Atlas (counts stay on the Progress screen with their definition) | goal gradient (Kivetz 2006, via motivation-habits); `ds-progress-no-meters` | a lint over child routes (extends PD-G20) |
| anything that changes with time: wilting, decay, device-clock day and night, timed events | banned | T2 absence | PD-G19 extended to the world fold (byte-identical render at +365 days) |
| random or surprise drops, variable-ratio anything | banned | G3; FTC / DSA | no RNG import in `server/world/*`; seeded RNG only in item generation before display |
| countdowns, patience meters, lose states in a quest engine | banned in first learning; count-up personal best opt-in only after untimed accuracy (G10) | G10; Radesky's "fabricated time pressure" | spec validator: `untimed: true` for quest beats (§5.5) |
| residents who speak, wait, plead or thank | banned | parasocial pressure; anthropomorphism | the place schema has no dialogue field; Q8 checks on artifact text |
| world-pressure lines ("almost done", "they need you", "come back to see") | banned | NEVER MANIPULATE | candidate `floorViolations` family, measured before enforcement (§2.5) |
| child-to-child chat, sharing, rankings | banned in v1 | T4 comparison; safety | none of these exist in the contracts |
| payment changing anything in the world | banned | T6 purchase | the world fold has no billing input |

---

## 3. Three worked examples, turn by turn

Conventions:
- **T** = the teacher. The child named her "Ira"; her voice is Diya, in the family's Hinglish.
- **C** = the child.
- **Stage** = the fixed slot (the phone layout, with the teacher in picture-in-picture).
- **Under the hood** = what the system does.

Teacher lines are illustrations (see the header): the live teacher words her moves from facts and shapes.

### 3.1 Maths: area of rectangles and squares (c6-maths-ch06-t02), at Vadgaon, a village outside Nashik

**The place's system.** The panchayat gives each family the same 24 m roll of fencing wire for a kitchen-garden plot.
The fiction is plausible, not claimed as fact. Its mathematics is exact.

The kit supplies:
- **Skills:** s1, counting unit squares including halves; s2, length × breadth with square units; s3, same perimeter
  can mean different area.
- **Misconceptions:** `m-same-perimeter-area`, `m-cm-units`, `m-add-for-area`.

The **engine** is `area-claim@1` with `drift: 0`. Today the schema requires `seconds` (10-60) and has a timeout "lost"
state, so the quest needs the untimed mode in §5.5. The spec has three rounds:
- r1: perimeter 24;
- r2: perimeter 24 with `different: true`. The engine refuses a repeat of r1's shape, then draws its same-perimeter
  compare lay-out, which needs two earlier plots;
- r3: the largest area for perimeter 24 (`maxAreaForPerimeter(24) = 36`).

The default 14 × 8 grid holds both 10 × 2 and 6 × 6. The first draft put `different: true` on a single first round.
With no earlier shape the engine neither enforces it nor shows the compare view, so the lesson's key beat would
silently not have happened [C, `src/studio-v2/engines/area.ts`, the `different` checks at lines 52 and 83].

**The lens** made here is "unit squares".

The child is Meher, class 6. Last week at Vadgaon she worked out the fence lengths (perimeter, c6-maths-ch06-t01).
They are in pencil.

**Session 1** (about 18 minutes; the beat order is from §2.5)

| # | beat | T (voice) | C | stage | under the hood |
|---|---|---|---|---|---|
| 1 | Q0 | — | taps **Start lesson · Vadgaon** | Atlas card: "Same wire, same garden?", with the reason "your class is on Perimeter and Area" | Conductor plan → topic. `questFor()` (code) picks place, hook and beats in a few ms [U]. The polish call runs during the greeting (§5.3) |
| 2 | Q1 | "Pichhli baar tumne Kaveri tai ke plot ki baad naapi thi. Ek naya plot: 9 metre lamba, 4 metre chauda. Kitni taar lagegi?" | "26 metre." | board: a 9 × 4 outline, no grid; the answer chip shows a tick; her face stays verdict-neutral | due delayed check on t01, new form, unaided, ≥ 20 h after the anchor → `secure`. The fold inks last week's fence posts: the one ceremony, ≤ 1.5 s |
| 3 | Q1 | "Ye ab pakka hai: kuch din baad bhi, bina hint ke." | — | the Vadgaon plate: the fence posts are now ink | a capability statement shape; no person praise (Kamins & Dweck, via MWR) |
| 4 | Q2 | "Panchayat ke board pe Salim bhai ne likha hai: taar same hai, toh bagicha bhi same. Tumhe kya lagta hai?" | — | the noticeboard artifact; the note is code-drawn text, Q8-checked | the hook comes from `questions[]`; the claim slot is bound to `m-same-perimeter-area` |
| 5 | Q3 | — | "Haan, same hi hoga na, taar toh utni hi hai." | the prediction is pinned on the QuestionCard | classify: the prediction matches the misconception. Voice signal: confident-wrong (shadow unless precision ≥ 0.80). **No verdict before commit** |
| 6 | Q4 | "Theek hai, test karte hain. 24 metre taar se do alag plot banao." | drags out 10 × 2 | soil-toned grid, 1 cell = 1 m²; fence glyph along the drag; live readouts: perimeter 24 m, area 20 m², and 20 cells fill | r1 graded right (perimeter 24). Engine skin `vadgaon-soil`, untimed. The act is the learning act (G1) |
| 7 | Q4 | (backchannel only) "hmm" | "das aur do… ab doosra." Drags 6 × 6 | 36 cells fill | r2 (`different: true`; a 2 × 10 would be refused as the same shape). Duplex: no talk-over during an open act |
| 8 | Q4 | — | "Arre! Ye toh 36 aa gaya, pehle 20 tha!" | the two plots side by side (the engine's same-perimeter compare lay-out) | VerifiedAct ×2; evidence for s3 |
| 9 | Q5 | "Taar utni hi. Phir zameen zyada kaise ho gayi?" | "Kyunki ye square jaisa hai… lamba-patla wala mein andar jagah kam hai." | — | one spoken why (G9). The understand note matches kit expectations 4 and 5 |
| 10 | name | "Haan: baad same, andar alag. Baad ko perimeter kehte hain, andar ki zameen ko area." | — | labels "perimeter" and "area" appear on the readouts | T2 vocabulary named *after* the experience |
| 11 | Q4 | "Ab 24 metre se sabse bada bagicha?" | 7 × 5 = 35, then 6 × 6 = 36 | r3, the maxArea round; 36 cells fill | host-graded: 7 × 5 is "partial" (right perimeter, not the largest area), 6 × 6 is right |
| 12 | Q6 | "Salim bhai ne ek aur cheez likhi: 'mera plot 36 m hai.' Kuch gadbad?" | "36… m? Ya square m?" (rising pitch, a 1.2 s pause) | — | the claim runs only if the learner model already holds s2 at `got_it` (here from the spoken 7 × 5 = 35 and 6 × 6 = 36); otherwise it moves to session 2 (G-W12). Voice signal: fragile-correct (shadow or live) → on-path "prove it" |
| 13 | Q6 | "Ek square metre dikhao." | taps one cell: "Ye ek square metre. Toh 36 square metre." | one cell outlines in volt | `m-cm-units` evidence; the claim is resolved; still the child's act |
| 14 | Q7 | "Ab bina grid ke. Kamra 7 metre by 5 metre: area, aur baad?" | starts "Area 35…" | board: rows of unit squares draw one row per clause, then `7 × 5` | the board-first path; kit-true numbers only |
| 15 | barge-in | T begins "har line mein 7 dabbe, aur 5 lin–" | cuts in: "35 square metre, aur baad 24!" | — | duplex yield ≤ 200 ms; she takes it up: "Haan, wahi." Both answers are graded host-side |
| 16 | Q8 | "Apne ghar ke kisi kamre se samjhao: area aur perimeter mein farak." | explains, about 20 s, with one long pause (she waits) | the transcript tail | scanSafety + model distress read + scrubPii. The cleaned phrase "Baad same, andar alag; square jaisa plot sabse bada" joins the Vadgaon page of the Log |
| 17 | Q9 | "Aaj tumne Salim bhai ka sawaal pakad liya. Bye, Meher." | — | Kaveri tai's plot shows her 6 × 6 in **pencil**. End card: "Got it today: the same perimeter can hold a different area. It becomes secure after a check on a later day." | skill `got_it`; the parent report row is queued; the goodbye follows the floor (no plan, no hook) |

**Session 2, at least two days later.** The opener holds a new-form check from the kit (contrast: a 1 × 12 strip and
a 3 × 4 rectangle, same area, different perimeter), unaided.
- **If it is right:** the pencil 6 × 6 plot inks. That check is `i09`, an s3 item. The unit-square rows (s2) ink when
  a new-form s2 check passes at a later opener (`rl-o2`, a kabaddi mat 8 m by 5 m). Only then does **unit squares**
  become a lens, because the edge that carries it starts from s2. When her class reaches area of a
  triangle (c6-maths-ch06-t03), the quest is at Patang gali: how much paper does a diamond kite really use? Ira asks:
  "Vadgaon wale squares yahan lagaoge?" The edge is real (`c6-maths-ch06-t03-s1` ← `c6-maths-ch06-t02-s2`).
- **If it is wrong:** the plot stays pencil and nothing is removed. The re-teach uses the kit's string-loop
  representation for `m-same-perimeter-area` (an arm not yet used, per the re-teach policy).

**The parent sees:** "Meher showed that the same fence can hold different gardens (20 m² vs 36 m²) and explained it with
a room at home. Check due later this week. How do we know? → 3 moments."

**Built live in this lesson:**
- the quest choice (code);
- the polished strings (one taxila-fast call, optional);
- the area-claim spec, two rounds;
- the board plan, from the kit;
- the teacher's words.

**Offline:** Vadgaon's plate and soil skin, the noticeboard template, the facts and the engine.

```json
{ "quest": "quest-spec@1", "placeId": "vadgaon-fields", "topicId": "c6-maths-ch06-t02", "hook": "q-same-wire",
  "claim": { "via": "artifact:noticeboard", "misconceptionId": "c6-maths-ch06-t02-m-same-perimeter-area" },
  "beats": [
    { "k": "check", "due": "c6-maths-ch06-t01" },
    { "k": "predict", "itemKind": "predict" },
    { "k": "engine", "archetype": "area-claim@1", "skin": "vadgaon-soil", "untimed": true,
      "spec": { "drift": 0, "grid": { "cols": 14, "rows": 8 }, "rounds": [
        { "goal": "perimeter", "target": 24, "different": false },
        { "goal": "perimeter", "target": 24, "different": true,
          "targets": "c6-maths-ch06-t02-m-same-perimeter-area" },
        { "goal": "maxArea", "target": 24, "different": false } ] } },
    { "k": "claim", "itemKind": "error_spot", "targets": "c6-maths-ch06-t02-m-cm-units" },
    { "k": "abstract", "board": "rows-of-units" },
    { "k": "log", "itemKind": "teachback" } ],
  "strings": { "title": "Same wire, same garden?" } }
```

### 3.2 Science: convection, land and sea breeze (c7-science-ch07-t02), at a fishing hamlet near Ennore

**The place's system.** The crew's wind board uses the fishers' own wind names: *kachan eeran*, the south-easterly sea
breeze that sets in by about 10 am, and *odukkam*, the pre-dawn calm (Jayaraman 2022 [V]).

The kit supplies:
- **Skills:** s1, convection in liquids and gases; s2, heat flows every way, while warm fluid rises; s3, sea breeze by
  day and land breeze by night; s4, applying it to design.
- **Misconceptions:** m1, heat only moves upward; m2, the daytime breeze blows from land to sea; m3, cold air rises.

The **engine** is `heat-lab@1` in breeze mode (sun slider, thermometers on land and in the sea, set the breeze, LOCK
runs the convection loop).

A **truth problem found while writing this example:** the engine's generic land curve bottoms out at 17.0 °C at 03:00
(17.3 °C at 04:00) [C]. IMD's 1991-2020 climatological table for Chennai (Nungambakkam) gives a mean daily minimum of
21.5 °C in January, the coolest month, and 25.1 °C for the year [V]. The engine's night is 4.5 °C colder than an average
January night there. Under a named Ennore skin, the thermometer would state a false number. The place therefore must supply sourced `params` (IMD climatology) within the
engine's clamps, or stay an unnamed coast (`world-place-parameterised-truth`, §8). The *direction* cycle is already
right: the generic model gives a sea breeze from 10:00 to 19:00 [C], matching "by 10 am".

**The lens** made here is "air currents".

The child is Ishaan, class 7. Conduction (t01) is in pencil from the last lesson.

**Session 1**

| # | beat | T (voice) | C | stage | under the hood |
|---|---|---|---|---|---|
| 1 | Q1 | a due check on conduction (t01), new form, from the kit | answers right | the board | `secure` → the fold inks the t01 page (a steel railing and a wooden bench at the hamlet's chai stall) |
| 2 | Q2 | "Yahan ke machuare hawaon ke naam rakhte hain. Ek hai *kachan eeran*: samundar se aane wali hawa, subah das baje ke aas-paas. Das baje hi kyun?" | — | the wind board artifact: the name, a direction glyph and "≈10:00" (code-drawn) | the fact comes from `facts[]` with its source. The name is pronounced by ear-tuned romanisation (risk in §6) |
| 3 | Q3 | "Dopahar do baje hawa kidhar se chalegi: zameen se samundar, ya samundar se zameen?" | "Zameen garam hai, toh garam hawa zameen se samundar jaayegi." | pinned prediction | m2 matched; confident-wrong (if live) → the world runs his model |
| 4 | Q4 | "Chalo, tum sooraj do baje pe rakho. Main thermometer padhti hoon." | drags the sun to 14:00, dips the thermometer: sand 35 °C, sea 28 °C (place params) | breeze mode skinned as the hamlet: catamarans on the sand, a kite, the wind board | the shared act: he steers, she reads (§2.6) |
| 5 | Q4 | — | sets the breeze "← to sea" (his prediction) and hits LOCK | the convection loop runs **the true way**: air rises over the land and sea air flows in. His arrow stays visible, faint, beside the true one. The kite leans inland | the host grades from `breezeAt(14)` = sea; verdict "look again" (magnifier, amber, never red) |
| 6 | barge-in | starts "Dekho, hawa ka–" | "Ruko ruko, ulta kyun hua?" | — | duplex yields; she takes up his question instead of her line |
| 7 | Q5 | "Achha sawaal. Garam hawa ka kya hota hai?" | "Upar jaati hai… umm…" (2.5 s pause) | — | the voice signal says searching → **she waits**. The thinking pause is not cut |
| 8 | Q5 | — | "…toh neeche jagah khaali, samundar wali thandi hawa aa jaati hai!" | — | expectation 3 matched; s1 and s3 evidence |
| 9 | Q4 | "Ab raat ke das baje." | sets 22:00 and predicts "zameen se samundar" before LOCK | land 24 °C, sea 28 °C; the loop reverses; the kite leans seaward | an unaided correct (s3) |
| 10 | share | — | "Main Goa gaya tha, wahan shaam ko bahut hawa thi." | — | an on-topic share → one warm line and a test, with no follow-up question (`rj-share-uptake-follow-up-question`): "Shaam ki hawa: achha data. Sooraj shaam 6 pe rakh ke dekho." This uses the spec's third ask, 18:00 (sea breeze; land 32 °C vs sea 28.5 °C in the generic curve) |
| 11 | teach s2 | "Ab chai stall ke heater ko dekho. Kaunse teer garmi ke hain, aur kaunse garam hawa ke?" | "Ye side wale aur neeche wale garmi ke… upar wala hawa ka." | board: the kit's m1 remediation, a room with heat arrows going sideways and down from a heater and only the warm-air arrows going up | s2 is still practising, so no labelled claim yet (the Q6 rule). The kit's error_spot `i11` ("heat only moves up, so the floor by a heater can't get warm") waits for a later session once s2 is `got_it`. Today uses the kit's remediation move instead |
| 12 | Q7 | "Ab do tasveerein: dopahar aur raat. Arrows kahan?" | says them aloud | board: a two-panel beach; arrows are drawn from his words where they are kit-true, and a wrong arrow would appear amber with the magnifier | kit translate_rep; abstract act (G8) |
| 13 | Q8 | "Chhote bhai ko coloured ice cube se samjhao: convection kya hai." | explains | — | teachback → the Log phrase "Garam hawa uthti hai, thandi neeche aake jagah bharti hai" |
| 14 | Q9 | short warm close, no plan | — | the wind board shows **his** two-panel arrows in pencil | `got_it` on s1 and s3; s2 practising |

**Session 2.** The opener asks a new-form check on s3, the skill that reached `got_it`: the kit's near-transfer item
`i09` (fishers in coastal Kerala sail out early in the morning and return in the afternoon; how do the breezes help?).
It is answered in words, with no engine, unaided. The s1 check (`rl-o1`, which way does ink move in a heated beaker)
is due at a later opener.
- The first draft used "why is an AC fitted high and a heater low?" here. That item (`i07`) checks s4, which session 1
  never taught, so a right answer could not have made s1 or s3 secure. Delayed checks must target the skill being
  checked.
- **If it is right:** the day and night breeze arrows (s3) ink. The rising-and-sinking loop (s1) inks when `rl-o1`
  passes, and only then does "air currents" become a lens, because the edge that carries it (s4 requires s1) starts
  from s1. Later, at a Jaisalmer haveli, s4 is taught with the kit's design items (`i07`, AC high and heater low;
  `i10`, kitchen exhausts and openings near the roof). Ira offers: "Ennore wale arrows yahan?"
- The hamlet's ambient life does not change: the boats were always there. What has changed is that the board above
  them is now in his own ink.

**The parent sees:** "Ishaan worked out why the sea breeze comes in by mid-morning, and why it reverses at night, and
explained it with a coloured ice cube. How do we know? → 4 moments."

**Built live:**
- the quest (code), plus polish;
- the heat-lab spec (three breeze asks, 14, 22 and 18, the schema's maximum; breezeClear holds at all three [C]);
- the board, from the kit;
- the words.

**Offline:** the plate, the catamaran and kite sprites, the wind board template, sourced `params`, and the cultural
review of the wind names.

### 3.3 Social science: from barter to money (c7-sst-ch11-t01), at Ghat Bazaar, one riverbank across 4,000 years

**The place's system.** One market, with a time slider the child owns. It is told honestly as an imagined device:
"ek hi nadi ka kinara, alag zamane: kalpana hai, taaki badlaav dikhe."

There are four layers:
- a Harappan-era riverside port, with no coins found and standardised weights in use [S, §1.6];
- a market of the age of punch-marked coins, about the 6th century BCE (kit);
- 1935, when the Reserve Bank of India was set up (kit);
- 2016, when UPI launched (kit).

The kit supplies:
- **Skills:** s1, barter and its problems; s2, how money changed; s3, the three functions of money; s4, why money has
  value (trust) and digital safety.
- **Misconceptions:** m1, money has value in itself; m2, barter is easy; m3, UPI creates money.

**Engines:**
- `town-lab@1` barter mode (traders swap only for what *they* want; then the same round with money);
- `era-drop@1`, an order round. It is a falling-pod timing game, so first exposure starts at its slowest fall;
- the board's trust-chain picture (the kit's remediation for m1).

**The lens** this place would make is the trust chain. It stays in the Log only, because no edge leaves this topic
yet (session 2 below).

The child is Zoya, class 7. Last week, at the 2016 layer of the same place, she added prices on a grocery bill
(decimals, c7-maths-ch03-t04): one place hosting both maths and SST.

**Session 1**

| # | beat | T (voice) | C | stage | under the hood |
|---|---|---|---|---|---|
| 1 | Q1 | a due delayed check on adding decimals: a new bill at the sabzi stall | answers right | the 2016 layer; a code-drawn bill | `secure` → the bill on the stall inks (the decimals system) |
| 2 | Q2 | "Ab chaar hazaar saal peeche. Is kinare pe koi sikka nahi mila. Toh log ghada kaise lete the?" | "Exchange karke?" | she drags the time slider to the Harappan layer; the plate crossfades | her choice moves the time slider, not a clock |
| 3 | Q3 | "Tumhare paas chawal hai, chahiye ek ghada. Kitne trade lagenge, socho pehle." | "Ek. Potter ko chawal de dungi." | pinned prediction | m2 ("barter is easy") matched |
| 4 | Q4 | "Try karo." | taps the Potter with rice | the Potter refuses: "wants salt" (an in-world, misconception-specific consequence; G6) | VerifiedAct: a wrong path, free retry |
| 5 | Q4 | — | Weaver (rice → cloth), boat Trader (cloth → salt), Potter (salt → pot) | goods move along the chain; "3 trades" | `barterPlan` = 3; graded right |
| 6 | Q5 | "Teen trade, ek ghade ke liye. Dikkat kya hai?" | "Sabko alag cheez chahiye. Jo mere paas hai woh usko nahi chahiye." | — | expectation 1; she names it after: "double coincidence of wants" |
| 7 | Q4 | "Ab wahi bazaar, par sikke ke saath." | sells rice at the market, buys the pot: 2 moves | the slider moves to the punch-marked-coin layer; trade lines connect any stall to any stall | money: true round; medium of exchange made visible |
| 8 | Q4 | "Teen asli tareekhein: punch-marked sikke, RBI, UPI. Pehle kaun?" | drops each pod on the timeline, then taps the earlier of each pair | era-drop on the kit's three dated events only (about 6th century BCE, 1935, 2016), slowest fall. The undated steps (barter, grain and cowries) are ordered aloud as the kit's ordering item `i04`, because the engine grades only real dates | the kit's `i06` (translate_rep) + `i04` (practice); s2 |
| 9 | Q3 | "Socho: agar koi bhi ghar pe ₹100 ke note chhaap sake, toh?" | "Sab ameer ho jaayenge!" | — | the kit's predict item `i10` (targets m1); m1 surfaces |
| 10 | Q7 | "Dekhte hain note ki value kahan se aati hai." | — | board: the trust chain (RBI and the government → law → shopkeeper accepts → you accept), drawn link by link; then one link breaks | the kit's remediation representation; board-first |
| 11 | Q5 | "Ab batao: kaagaz ki value kitni, aur note ki kitni?" | "Kaagaz ki kuch nahi… log maante hain isliye chalta hai. Sab chhapenge toh cheezein mehengi." | — | m1 resolving; s4 evidence |
| 12 | Q5 (safety why) | "Ek message aaya: 'refund ke liye apna UPI PIN bhejo.' Bhejogi?" | "Nahi! PIN se paise jaate hain, aate nahi." | the 2016 layer: a phone drawn only as a "remote control" between two banks | the kit's why item `rl-h3` (s4, digital safety): a real-world safety rule taught as content. It is not a Q6 claim, because s4 is still practising. The bank-to-bank picture is aimed at m3, whose own check is the error_spot `i11` at a later opener |
| 13 | Q8 | "Ek dost ko samjhao: paisa kyun bana. Barter se shuru karo." | explains | — | teachback → the Log phrase "Barter mein sabko alag cheez chahiye; paisa sab le lete hain kyunki bharosa hai" |
| 14 | Q9 | short close | — | the barter chain over the Harappan layer in **pencil**. The trust chain is in the Log as today's work but is not yet drawn on the place, because s4 is still practising | `got_it` s1; practising s2, s3 and s4. Only one function of money (medium of exchange) was shown, so s3 is not claimed |

**Session 2.** The opener is a new-form delayed check on s1, the skill that reached `got_it`: the kit's `rl-o1` (at a
school fair, a bat, a racket and a football; which barter problem stops the swap?).
- **If it is right:** the barter chain inks.
- The first draft opened with the why item `i09` ("why does a ₹100 note have value?") and claimed `got_it` on s3.
  `i09` checks s4, which was still practising, and s3 had not been taught, so both were corrected. `i09` becomes the
  delayed check for s4 after a later session teaches it to `got_it`. When it passes, the trust chain inks.
- **No lens is offered from this topic yet.** `c7-sst-ch11-t01` has no
  outgoing edge in the curriculum or the kits, and no class 6-7 SST topic has any edge [C, §9.5]. The first draft sent
  a "value" lens to a dairy co-op (c5-maths "The Dairy Farm"); that edge does not exist, and it pointed a class 7 child
  back at a class 5 chapter (`rj-world-invented-edges`). The candidate edges, to banks (`c7-sst-ch20-t01`, "Banks and
  the Magic of Finance") and to markets (`c7-sst-ch12-t01`), wait for reviewed kit authoring
  (`open-world-sst-edges`). Both would share Ghat Bazaar and `town-lab@1`, which already lists them among its skills.
- **The tour:** that week she chooses Ghat Bazaar and explains barter and trust to her grandmother, who paid in notes
  (a kit near-transfer item about generations). Nothing is recorded. If the parent taps a reaction, Ira says once at
  the next opener: "Naani ne tumhara bazaar wala tour dekha."

**Built live:**
- the quest (code), plus polish;
- the town-lab spec (two barter rounds, money off and on, validated by `barterPlan`);
- the era-drop spec;
- the board, from the kit;
- the words.

**Offline:**
- four layer plates of one riverbank (ambience only; every good, coin and label is code-drawn);
- the facts table: Harappan weights [S]; dates from the verified kit;
- a sensitivity review: no religious markers as quest objects, and the "Sindhu-Sarasvati" naming taught as the kit
  states it.

---

## 4. Why this is revolutionary rather than points-on-quizzes, and what is not new

**What is new.** This session found no product that does any of the following, which is a search result, not proof:
1. **The world's only state is a calibrated, delayed-retention learner model.**
   - It is not quest completion, XP or currency.
   - Ink means what V1 means by secure (right again days later, in a new form, unaided). The world therefore cannot be
     farmed, bought or rushed. It also cannot lie, because it is the same ledger the parent audits.
2. **Learning and performance are drawn differently.** Pencil and ink make the Bjork distinction visible to a
   12-year-old. The dramatic beat of returning is a real pedagogical event, the delayed check, not a hook.
3. **Knowledge is the only progression, and it travels.** Lenses turn far transfer into the way you move through the
   world (the knowledge-game genre plus transfer), with no locks.
4. **The teacher is a duplex co-player inside the world.** She talks while you act, yields when you interrupt, waits
   while you think and runs your own model so you can see it fail. That is teacher-provided scaffolding (Clark's 0.58
   row) delivered as play.
5. **Indian places where the concept is local expertise.** The fishers' wind names and the market without coins are
   the textbook's own settings, made explorable. This is the Banerjee bridge, built in both directions.
6. **Live composition from verified parts, which makes it unbreakable by construction.** Places × engines × kit
   items, with the model only wording within a grammar, means a failure degrades to plain. A quest is also a *plan*,
   which gives speculative stagecraft its best prior (§5.6).

**What is not new, and is used on purpose:**
- maps, places and quests (Quest Atlantis, Prodigy);
- open learner models (Long & Aleven; Khan; MWR's Aasmaan, which this concept extends);
- intrinsic integration (Habgood).

**Against points-on-quizzes:** a quiz in costume fails the admission test (§2.2). A point has nowhere to live, because
the world has no counters. A reward has no meaning, because the world was already alive.

---

## 5. How it is built and generated live on this stack

### 5.1 Components (proposed owned paths; nothing is built yet)

| component | path (proposed) | kind | notes |
|---|---|---|---|
| place files, hubs, route graph | `data/world/places/*.json`, `data/world/atlas.json` | data, reviewed | `data/` is in the production image |
| world contracts | `shared/world.ts` (`AtlasState`, `quest-spec@1` schema, `skin` field) | types + zod | the `studio-spec@2` envelope gains `skin` and `untimed` |
| world fold | `server/world/fold.js` (pure), `server/world/quest.js` (`questFor`, validation, defaults) | ESM | no clock, no RNG, no DB writes |
| route | `GET /api/child/world?childId=` → `AtlasState` | `requireChild` | the parent corner reads the same fold |
| Director row | `WORLD` key=value row in `compile()` (place, system, hook id, claim id, lens list; ≤ 60 tokens) | compile | telegraphic, never sentences; budget-checked by `check-prompt-budget`; stage-facts guard extended to world facts |
| engine skins | `src/studio-v2/engines/*` read `spec.skin` → plate, palette, sprite atlas; unknown skin → today's instrument look | client | a skin is data; a failed skin load renders the plain engine |
| Atlas and place screens | `src/child/screens/Map.tsx` successor (Atlas), Home's "Up next" place card, the Log on Notebook | client | the List toggle stays the source of truth |
| art | `public/assets/world/<place>/` via `scripts/gen-assets.mjs` budgets | offline | through `vite build` into `dist/` (the image copies `dist`) |
| gates | `tests/world-*.test.mjs` (fold invariants, lint, fit), `evals/world/*` (admission test, coverage) | CI | tests use hooks inside a `describe` only |

### 5.2 Offline: places, facts, art and skins

1. **Place authoring.** An agent drafts the place file from the kits and sourced facts. A blind fact-checker from a
   second model family re-sources every claim, and unsourced claims are dropped. A human cultural reviewer clears
   `sensitivity`. Admission tests run in `evals/world/admission.mjs`.
2. **Coverage.** Every class 4-7 maths, science, EVS and SST topic (284) is assigned to a place system or a hub. The
   coverage report states the natural share honestly; the 30-topic sample estimate is 80%, Wilson 95% [0.63, 0.91],
   single rater [C]. The 101 language topics go to the Reading Room, because invented companion texts are rejected
   (`kit-invented-companion-texts`) and the world must not invent passages (`open-world-language-topics`).
3. **Art.** Each place gets about 8 plates (base, detail plates, and engine skin backgrounds); lighting variants are
   tinted by code, not painted.
   - **Lane:** Azure only. `taxila-image25-flare` low ($0.0066 per image, 15.1 s p50, 4 RPM subscription-wide) or
     `gpt-image-2` (MODEL-STACK row "Images"). FLUX.2 failed Indian prompts and labels and stays out
     (`rj-flux2-pro-labels-and-indian-prompts`).
   - **Checks:** OCR no-text check, budget (≤ 350 KB of art per first child screen), human review.
   - **Model cost:** 12 places × 8 plates × 4 candidates ≈ 384 images ≈ $3-20 [U estimate]. The real cost is human
     review time.
4. **Skins.** Per archetype per place: a background plate, a palette inside the design-v3 tokens, and a sprite atlas
   (catamaran, kite, stall, soil cell). Code draws every fact-bearing object.

### 5.3 Live: the per-lesson path, its latency and cost, and the 429 fallback

1. **Lesson open (existing).** The Conductor plan supplies the topic and due checks. `questFor(child, topicId)` is
   code: it ranks host places by fit, the child's last place, interest tags (memory consent only) and the school
   chapter, then picks hook, claim and beat skeleton from the place file and kit. It takes milliseconds [U].
2. **Optional polish.** One `taxila-fast` call at effort none, inside a closed grammar. It picks among admissible
   hooks and skins and writes the strings table (≤ 48 characters each, Q8-checked). The cost and latency class is the
   Forge G1 flavour pick: 1.88 s p50, about $0.0002 (MODEL-STACK). It runs during the greeting. **On 429, a timeout
   or an invalid result, the code pick ships**; the only visible difference is blander strings.
3. **Engine specs** follow today's Studio plan path (3.25 s p50, 8/8 schema-valid, < $0.001; MODEL-STACK) or the
   archetype's kit-seeded default spec, now carrying `skin` and `untimed`. Validation repairs or replaces; it never
   fails visibly (STUDIO-V2 §8).
4. **During the lesson** the Director reads the `WORLD` row. The teacher's words are grounded only in world facts
   plus the kit, and she never names a place feature that is not drawn.
5. **After the lesson** the fold recomputes from the ledger. The Atlas reads it on the next Home render, server-side
   (`homeState` discipline).

| `quest-spec@1` field | decided by | validated by |
|---|---|---|
| `placeId`, `topicId`, systems | code (`questFor`) | the place hosts the topic; `sensitivity` is clear |
| hook, claim (`misconceptionId`) | code; polish may choose among admissible ones | ids exist in the place file and kit; claims only on skills ≥ `got_it` |
| beats and order | code skeleton from the kit's formats; polish may reorder within the arc | the arc grammar (§2.5): check first, abstract act present, at most one ceremony |
| engine archetype + spec | code / Studio plan | the archetype's schema and semantic checks; `untimed: true` |
| skin | place file | the asset exists and is in budget; otherwise the plain engine |
| strings | polish (optional) | ≤ 48 characters, no markup, Q8 per string, fail closed → place defaults |

**Added cost per lesson:** about one polish call, ≈ $0.0002-0.001 [U estimate]. Places and art are fixed costs. Live
image generation is zero.

### 5.4 Rendering and the phone (the "not viewed properly, totally broken" fix)

- **Floor first.** Plates are composed for the 326 × 334 px stage slot first, with the phone picture-in-picture
  corner and the 62 px HUD rail reserved, then scaled up with letterboxing (stage contract).
- **Per-place gates:**
  - 0 overflows across 5 viewports;
  - every label ≥ 38 canvas units per 1000 (≥ 12.4 px at the floor);
  - targets ≥ 130 units;
  - a screenshot per place and per engine skin in CI.

  The round-2 cause, boards drawn at 800 × 500 and shrunk to 0.39×, is designed out because nothing is authored
  wide-first.
- **Weight.** Layered WebP or AVIF parallax (3-5 layers), transform and opacity animation only, ≤ 350 KB on first
  paint, lazy per place, flat fallbacks on tier D. The target is 60 fps on the ₹10k reference phone (X6); this is not
  yet demonstrated for any engine (STUDIO-V2 QB-G9).
- **No visible build** (`design-v3-no-visible-build`): no spinner, caption or error card. A missing plate renders the
  instrument ground, and a missing skin renders the plain engine.
- **No national outline; no device clock** (§1.6, §2.3).

### 5.5 What has to change in existing engines

- **Round clocks.** 6 of 42 studio-v2 engine files carry an explicit round clock, a patience meter or a timeout/lost
  state: `area-claim`, `vault`, `angle`, `rail`, `dukaan` and the shadow-play catch step [C]. G10 allows only an
  opt-in count-up personal best after untimed accuracy. Quest beats need `untimed: true`: no clock, no lost state,
  free retry. For example, `AreaSchema.rounds[].seconds` is required (10-60) today. Falling-pod action games
  (`catch-on-line`, `era-drop`) are timing by design and owner-approved (R3); in quests they start at their slowest
  setting for first exposure.
- **Place parameters.** Engines with physical or economic numbers (heat-lab, shadow, motion, dukaan prices, map
  scale) must accept sourced `params` within their clamps. Otherwise a named place states a false number
  (§3.2, `rj-world-generic-numbers-in-named-places`).
- **A `skin` field** in the envelope, read only by the drawing layer, never by the truth layer.

### 5.6 Duplex, voice signals and speculative stagecraft

- **Duplex** is unchanged; the world adds the "no talk-over during an open act" rule, which G12 already implies.
- **Voice signals** feed the knowledge-state moves in §2.6, with the existing precision gate.
- **The content duplex (V3).** Because a quest is a plan, Stagecraft knows that beat N+1 is, for example, "heat-lab
  breeze at 22:00" before beat N ends, and can prebuild and validity-key it. **Hypothesis [U]:** quest-planned lessons
  reach the V3 bar "right artifact ready when needed ≥ 90%" more often than unplanned ones, with 0 stale reveals.
  Measure it with the existing 240-lesson simulator by comparing quest-planned against conversation-only triggers.

### 5.7 Safety integration

- **Every committed turn keeps scanSafety and the model distress read.** Out-of-bounds asks are declined in code
  (`lexicon.js`, `screen.js`). The stop check-in, the safeguard hand-off and the exact Childline 1098 and Tele-MANAS
  14416 numbers are all unchanged. A quest never resists a stop.
- **Log phrases** pass scanSafety, the model distress read and cued `scrubPii`. Only the child and her parent see them
  (existing visibility policy).
- **Place and artifact strings** get per-string Q8 checks (Content Safety + the Hinglish blocklist + the classifier,
  fail closed).
- **No real private person** is named in any place; residents are fictional, and the fishers' wind words are
  community vocabulary, not a person.
- **Child-safety floor:** she never denies being an AI. The co-player never claims feelings ("I'm so happy for the
  fishers" is a banned shape). There is no romance or companion register, and Microsoft CoC restriction 12 applies:
  knowledge states, never emotions.

### 5.8 Build order (estimates are [U])

1. Contracts, the fold and its invariant tests, with no UI. This proves absence invariance and evidence completeness
   on real ledgers from the Neon TEST branch.
2. Untimed mode, `skin` and `params` for the four engines in the worked examples plus `shadow-play`.
3. Three places end to end (Vadgaon, Ennore hamlet, Ghat Bazaar), each through the admission test, fit gates and
   cultural review.
4. The Atlas screen, Home card, Log, the parent Atlas, the `WORLD` row and `questFor`.
5. Run the EXP-30 battery and 200 simulated lessons with world on: 0 visible failures, 0 stale reveals.
6. Child panel tests (§7), then expand to about 12 places only if those pass.

---

## 6. Risks

| # | risk | evidence | mitigation | kill or change signal |
|---|---|---|---|---|
| 1 | the world is a seductive detail and lowers learning | Adams 2012 [V]; Clark story rows; Rey 2012 (via learning-science) | R-W1 thin inside acts; the world never covers an open probe; schematic acts | X-W3: delayed-check accuracy on world-on below world-off by more than the margin |
| 2 | ink becomes a collectible; goal gradient; completion-driven performative learning | `design-v2-painted-world` reversal condition; Kivetz 2006 (via motivation-habits) | no counters; no completion art; one ceremony per lesson | X-W4 goal-gradient test positive, or "what do I get" in > 1 of 20 sessions → ink becomes silent (list only) |
| 3 | forced places become "nonsense" (the owner's complaint) | 6/30 sampled topics had no natural place [C] | admission test; hubs; no place for sacred or contested topics | any shipped place failing the blind "is this the real system?" check |
| 4 | false local facts (17.0 °C at Ennore at 3 am, against an IMD January mean minimum of 21.5 °C) | §3.2 [C] [V] | sourced `params` or unnamed places; a facts table gate | any unsourced number in a named place |
| 5 | cultural misrepresentation, stereotype, communal or caste sensitivity | §1.6 | cultural reviewer; occupations as expertise; regional spread; no sacred quest objects | a reviewer flag, or any parent complaint, unpublishes the place until it is resolved |
| 6 | reads as babyish to 13-15 | DESIGN-V3 F4 | cinematic plates; no mascots; grown-up copy | X1 extended to Atlas screens fails (< 80% "for my age" in either age half) |
| 7 | the tour becomes pressure to perform for parents | [U] | optional, child-initiated, no failure state, nothing recorded | X-W6: parent or child reports pressure in ≥ 2 of 20 families |
| 8 | novelty inflates early numbers | Rodrigues 2022 [V] | judge at ≥ 12 weeks | — |
| 9 | cost and art production stall coverage | [U] | 3 places first; code-tinted lighting; one style bible | coverage below 60% natural after 12 places |
| 10 | Tamil, Marathi and other local words are mispronounced by the Hindi voice | DragonHD prosody and SSML limits (`rj-ssml-in-voice-live-text`) | an ear-tuned romanisation table per place word | the owner's ear test fails on any place word |
| 11 | the expectation of revolution versus a 0.1-0.3 SD reality for games | game-mechanics TL;DR | say it plainly: the world is a motivation and transfer layer, not the learning engine | — |
| 12 | performance on low-end phones | X6 unmeasured for all engines | budgets; tier D flats | p95 frame > 20 ms on the reference phone |
| 13 | design-v3 identity drift ("one style only" replaced by a mess of styles) | owner complaint | one UI grammar; variety only inside the stage and plates | X1 or the owner rejects the mix |

---

## 7. How to measure that it works

**Tier 0: engineering gates.** These can run now, with no children involved.

| gate | bar |
|---|---|
| G-W1 absence | world fold render byte-identical at clock +365 days, on 100 real TEST-branch ledgers |
| G-W2 evidence | 100% of why-layer cells cite ledger rows; 0 orphans |
| G-W3 determinism | replay reproduces `AtlasState` exactly, 100 of 100 |
| G-W4 lint | 0 currency or counter identifiers, 0 clock or RNG imports in the world fold, 0 locked stations |
| G-W5 admission | every shipped place passes remove-the-world and remove-the-learning, with two blind reviewers (κ reported) |
| G-W6 facts | 100% of `facts[]` and `params` sourced; 0 open sensitivity flags |
| G-W7 fit | 0 overflows across 5 viewports, including 326 × 334, for every plate and skin |
| G-W8 failure | 0 visible failures across EXP-30 + 200 simulated world lessons, with the polish call killed (429 injection) in half of them |
| G-W9 floor | persona invariants green; never-rules on all world lines; the prompt budget passes with the `WORLD` row |
| G-W10 frames | p95 frame ≤ 20 ms on the reference phone for each skinned engine (X6) |
| G-W11 edges | every Atlas route and lens offer cites an edge in `data/curriculum` `prerequisites` or a kit's `prereqSkillIds`; 0 uncited lines (added after the verification pass, §9.6) |
| G-W12 check targeting | every delayed-check beat and every claim beat names an item whose `skillId` is a skill at `got_it` or above; 0 mismatches over the quest specs (added after §9.6, rows 4, 5 and 7) |

**Tier 1: owner and child panel.** This uses the consented panel (n ≥ 24, split 9-11 and 12-15).

| id | question | method | bar |
|---|---|---|---|
| X-W1 | "for my age" | X1 with Atlas and place screens added | ≥ 80% in each age half |
| X-W2 | legibility of pencil and ink | a greyscale screenshot: "which ones are pakka?" and "why is this one pencil?" | ≥ 90% correct; ≥ 80% can say "checked again on another day" |
| X-W5 | understanding the honest co-player | after a session: "Did Ira believe the heater idea?" | ≥ 80% say no, it was something to test |
| X-W6 | the tour | uptake, plus a 2-item parent survey | no pressure reported in ≥ 18 of 20 families |
| owner | the owner's own walk-through of the three worked examples on the deployed build | — | pass |

**Tier 2: efficacy and motivation.** The design does not change for a small pilot, but the sample needs to grow before
any efficacy claim.

| id | question | design | primary measure | power [C] |
|---|---|---|---|---|
| X-W3 | does the world hurt learning? | between-child A/B, world-on vs world-off (same lessons, engines and teacher; world-off = today's Home and Progress) | delayed-check accuracy on new-form items, non-inferiority, margin 5 pp at p ≈ 0.85 | ≈ 631 delayed checks per arm before clustering; with children as clusters, a pilot-scale cohort, not the n ≥ 24 panel |
| X-W7 | does it travel? | the same A/B | far-transfer item accuracy at lens-connected places | d = 0.3 needs about 175 children per arm; d = 0.2 about 393 |
| X-W8 | does it bring them back, without pressure? | within-child crossover on the panel (world weeks vs plain weeks), then the A/B | share of sessions the child started (MH-D4), own questions per lesson, harder-option choices, retries after error | 30% → 40% child-started needs about 356 per arm between children; the crossover on the panel is exploratory |
| X-W4 | manipulation guardrails (always on) | — | goal gradient (inter-session gaps shrinking as a place nears all-ink vs a null), compulsion markers (after bedtime, pleas past cap), "what do I get" utterances, return rising while delayed retention falls, a monthly 4-item child need-satisfaction check (autonomy, competence, relatedness, pressure) | any positive signal triggers the reversal in §8 |
| X-W9 | novelty | the A/B, tracked weekly for ≥ 12 weeks | the trajectory of X-W8 measures | judged at weeks 10-12, not week 2 |

**What would make the world go:**
- X-W3 shows learning harm beyond the margin;
- X-W4 fires and the reversal does not fix it;
- X-W8 shows no gain at 12 weeks while costing art and authoring.

In those cases Taxila keeps the parts that stand on their own (lenses, the Log, untimed engines, place-parameterised
truth) and drops the Atlas.

---

## 8. Conflicts, amendments and proposed context entries

**The proposed entries** are in `context/inbox/r3-game-world.json`, for the main loop to merge.

**Decisions** (each has its reversal condition in the inbox):

| id | decision |
|---|---|
| `world-as-ledger-view` | the Atlas renders only from ledger, artifacts and choices |
| `world-why-layer-pencil-ink` | progress is drawn as the child's why layer over a world that always runs |
| `world-consequence-not-decoration` | every world change is a consequence the concept predicts |
| `world-no-real-clock` | time of day is a slider the child owns, never the device clock |
| `world-route-map-not-outline` | the Atlas is a route diagram, never a national outline |
| `world-residents-through-artifacts` | residents appear only through their work and artifacts |
| `world-honest-coplayer` | wrong ideas arrive labelled; she never sincerely asserts a false belief |
| `world-lens-is-the-childs-representation` | a lens is the child's own artifact, not an unlock |
| `world-place-parameterised-truth` | a named place's numbers come from sourced parameters |
| `world-untimed-first-learning` | quest engines run untimed, with no lose state |
| `world-quest-spec-closed-grammar` | code picks the quest; a model only words it inside a closed grammar |
| `world-family-tour` | an optional weekly tour, with the reaction relayed once in speech |
| `world-peers-not-in-v1` | no peer features in v1 |
| `world-place-plates-third-image-kind` | an amendment to DESIGN-V3 §3.4 |
| `world-real-edges-and-check-targeting-gates` | gates G-W11 (routes and lenses only on real edges) and G-W12 (checks and claims target skills at `got_it` or above) |

**Rejections**, design-time, before any build:

| id | rejected idea |
|---|---|
| `rj-world-real-clock-ambient` | world time driven by the device clock |
| `rj-world-talking-residents` | residents who speak |
| `rj-world-locked-places` | places locked until mastery |
| `rj-world-generic-numbers-in-named-places` | generic engine numbers shown under a named place |
| `rj-world-india-outline` | drawing the Atlas as India's outline |
| `rj-world-collection-counter` | "N of M" counters on the Atlas |
| `rj-world-invented-edges` | routes or lenses drawn on prerequisite edges that do not exist. This one was caught in this document's own first draft (§9.6), not only imagined |
| `rj-world-check-off-skill` | delayed checks or claims aimed at a skill other than the one taught (§9.6, rows 4, 5 and 7) |
| `rj-world-area-claim-single-different-round` | one `different: true` perimeter round, whose compare beat never fires (§9.6, row 3) |

**Measurements:**
- `ms-world-coverage-sample-2026-10-09`;
- `ms-engine-clocks-2026-10-09`;
- `ms-heat-breeze-curve-2026-10-09`;
- `ms-curriculum-edge-coverage-2026-10-09`.

**Open:**
- `open-world-language-topics`;
- `open-world-peer-coop`;
- `open-world-motivation-proof`;
- `open-world-sst-edges`.

**Gates this adds to §7:**
- **G-W11 edges.** Every Atlas route and every lens offer must cite an edge id that exists in `data/curriculum`
  `prerequisites` or a kit's `prereqSkillIds`, with 0 uncited lines. This is a schema check on the place files and the
  fold.
- **G-W12 check targeting.** Every delayed-check beat and every claim beat names an item whose `skillId` is at
  `got_it` or above.

**The amendment that needs the owner's call:** DESIGN-V3 §3.4 allows two image kinds, cinematic material renders and
the teacher. The Atlas needs a third, **place plates**: cinematic and painterly, real Indian places, no text, no
close faces, ambience only. The chrome stays the dark instrument. The proposed reversal: if X-W1 fails, plates fall
back to material renders of each place's *system* (a glass coastline with air-current light, for example), and the
Atlas stays a route diagram.

---

## 9. Measurements made this session (2026-10-09)

1. **`ms-world-coverage-sample-2026-10-09`.**
   - **Method:** 30 topics drawn with a seeded LCG (seed 20261009) from the 284 class 4-7 maths, science, EVS and SST
     topics in `data/curriculum`. I judged each one by a single question: is there a real Indian place whose working
     system *is* this concept?
   - **Result:**
     - 24 of 30 had a natural place: 80%, Wilson 95% [0.627, 0.905];
     - 5 of 30 went to a hub (17%; science as evidence, vertically opposite angles, ahimsa, breathing rate, stomata);
     - 1 of 30 was excluded by the sensitivity policy (*How the Land Becomes Sacred*).
   - **Limits:** single rater, not blind, and the author has an interest in the result, so the estimate is probably
     biased upward. G-W5 needs two blind raters.
2. **`ms-engine-clocks-2026-10-09`.**
   - **Method:** grep over the 42 `src/studio-v2/engines/**/*.ts` engine files for round timers, patience meters and
     `timeout`/`lost` states.
   - **Result:** 6 files: `area.ts` (`seconds` 10-60, required in `AreaSchema`; timeout → "lost"), `vault.ts`,
     `angle.ts`, `ext/rail.ts`, `ext/dukaan.ts` (patience) and `shadow.ts` (catch step). The falling-pod games
     (`landfall`, `era`) and `runner.ts` (timing as position) are timing by design and were counted separately.
   - **Re-check in the verification pass:** the folder holds 46 `.ts` files. Two `index.ts` files, `ext/glyphs.ts` and
     `ext/kit.ts` are helpers, which leaves 42 engines. A regex pass plus reading each flagged file reproduced the same
     6. `motion.ts` matched on `seconds`, but it is physics time, not a round clock.
3. **`ms-heat-breeze-curve-2026-10-09`.**
   - **Method:** I evaluated `landC` and `seaC` from `shared/studio-spec-ext/heat.ts` at each hour, 0-23.
   - **Result:** land 17.0-35.0 °C, with the minimum at 03:00 (17.3 at 04:00); sea 25.5-28.5 °C. Sea breeze
     10:00-19:00; land breeze 21:00-08:00; 09:00 and 20:00 are rejected as turnover hours. At 14:00 the land is
     34.7 °C and the sea 27.8 °C; at 22:00, 23.7 and 27.8; at 18:00, 32.4 and 28.5.
   - **Reading:** the direction cycle matches the Chennai fishers' account of a sea breeze by about 10 am (Jayaraman
     2022 [V]). The IMD 1991-2020 table for Chennai (Nungambakkam) gives a mean daily minimum of 21.5 °C in January,
     the coolest month [V]. The engine's 17.0 °C is 4.5 °C below that, so a *named* Chennai skin would display a false
     number unless the place supplies sourced parameters.
4. **Sample sizes** for §7, two-sided α = .05 unless stated, power .8:
   - d = 0.2 → 393 per arm; d = 0.3 → 175; d = 0.5 → 63;
   - proportions 30% vs 40% → 356 per arm; 30% vs 45% → 163;
   - non-inferiority at p = .85 with a 5 pp margin, one-sided α = .05 → 631 checks per arm, before clustering.

   These were recomputed in the verification pass with a normal approximation, giving identical values; the 24/30
   Wilson interval also reproduced.
5. **`ms-curriculum-edge-coverage-2026-10-09`** (verification pass).
   - **Method:** I walked every topic in `data/curriculum/c*-*.json`, then counted, for the 284 class 4-7 maths,
     science, EVS and SST topics, those with at least one incoming or outgoing `prerequisites` edge.
   - **Result:**

     | subject | topics | with an incoming edge | with an outgoing edge | with any edge |
     |---|---|---|---|---|
     | maths | 141 | 141 | 115 | 141 |
     | science | 69 | 68 | 47 | 69 |
     | EVS | 40 | 39 | 26 | 40 |
     | SST (classes 6-7) | 34 | 0 | 0 | **0** |

     Overall, 250 of 284 topics (88.0%) have an edge.
   - **Edges out of the three worked-example topics:**
     - `c6-maths-ch06-t02` → `c6-maths-ch06-t03`, `c8-maths-ch09-t01`;
     - `c7-science-ch07-t02` → `c7-science-ch07-t04`, `c8-science-ch06-t02`;
     - `c7-sst-ch11-t01` → none.

     `c7-maths-ch11-t01` (HCF) requires `c6-maths-ch05-t01` and `c6-maths-ch05-t04`, not area.
   - **Reading:** "routes = prerequisite edges" works for maths, science and EVS. For SST it draws nothing until
     reviewed edges are authored.
6. **What the verification pass corrected** (each change is in place in the text above):

   | # | first draft said | the repo says | fix |
   |---|---|---|---|
   | 1 | Bundi (HCF tiles) on Vadgaon's route; the unit-squares lens offered there | no edge from area to HCF (measurement 5) | the lens goes to Patang gali, area of a triangle (`c6-maths-ch06-t03-s1` ← `c6-maths-ch06-t02-s2`); Bundi hangs off the common-factors line |
   | 2 | the "value" lens goes to a dairy co-op (c5 "The Dairy Farm") | no outgoing edge from `c7-sst-ch11-t01`, and the target is a class 5 chapter for a class 7 child | no lens; candidate edges to `c7-sst-ch20-t01` and `c7-sst-ch12-t01` go to `open-world-sst-edges` |
   | 3 | the area-claim spec has one perimeter round with `different: true` | `area.ts` enforces `different` and shows the compare lay-out only when earlier plots exist (lines 52, 83) | three rounds: perimeter 24, perimeter 24 with `different`, then maxArea |
   | 4 | the science session-2 opener uses "AC high, heater low" | that is `i07`, an s4 item; session 1 made s1 and s3 `got_it` | the opener uses `i09` (s3) and later `rl-o1` (s1); `i07` and `i10` teach s4 at the haveli |
   | 5 | the SST close claims `got_it` on s1 and s3, and the opener is `i09` | only one function of money (s3) was shown; `i09` checks s4, which was still practising | close: `got_it` s1 only; opener `rl-o1` (s1); `i09` later, for s4 |
   | 6 | heat-lab "17 °C at 04:00"; labels such as "predict/4" | the minimum is at 03:00; the SST kit has one predict item, `i10` | corrected hour; every kit reference is now an item id |
   | 7 | the science session puts a labelled wrong claim (`i11`, "heat only moves up") on s2 | s2 was still practising, and the document's own Q6 rule allows claims only on skills at `got_it` or above | that beat now uses the kit's m1 remediation move; `i11` waits for a later session. The SST PIN beat is relabelled as a why item, not a claim |

   **Why it matters:** both invented edges were plausible, and they are exactly the "fake assumption" the owner rules
   out. A G-W11 edge gate would have caught them mechanically, and G-W12 would have caught rows 4, 5 and 7 (§7).

---

## 10. Sources

Read or checked this session:
- Adams, D. M., Mayer, R. E., MacNamara, A., Koenig, A., & Wainess, R. (2012). Narrative games for learning: Testing
  the discovery and narrative hypotheses. *J Ed Psych* 104(1), 235-249. doi 10.1037/a0025595. Abstract via OpenAlex
  [V].
- Barab, S. et al. (2009). Transformational play and virtual worlds: Worked examples from the Quest Atlantis project.
  *IJLM*. doi 10.1162/ijlm.2009.0023 [V abstract]. Barab et al. (2009), Transformational play as a curricular
  scaffold, *J Sci Educ Technol*, doi 10.1007/s10956-009-9171-5 (abstract not retrieved) [S].
- Rodrigues, L. et al. (2022). Gamification suffers from the novelty effect but benefits from the familiarization
  effect. *IJETHE*. doi 10.1186/s41239-021-00314-6 [V abstract].
- Sailer, M., Hense, J. U., Mayr, S. K., & Mandl, H. (2017). How gamification motivates. *Comput Hum Behav*. doi
  10.1016/j.chb.2016.12.033 [V abstract].
- Birk, M. V., Atkins, C., Bowey, J. T., & Mandryk, R. L. (2016). Fostering intrinsic motivation through avatar
  identification in digital games. CHI [V abstract].
- Bureau, J. S., Howard, J. L., Chong, J. X. Y., & Guay, F. (2022). Pathways to student motivation (meta-analysis, 144
  studies) [V abstract].
- Berkowitz, T. et al. (2015). Math at home adds up to achievement in school. *Science* 350(6257), 196-198 [V
  abstract].
- Ryan, R. M., Rigby, C. S., & Przybylski, A. (2006). The motivational pull of video games. *Motiv Emot*. doi
  10.1007/s11031-006-9051-8 [S].
- Jayaraman, N. (2022-04-07). A good storm. *The Wire Science*. https://science.thewire.in/?p=466850 [V; re-read in
  the verification pass: kachan eeran is a south-easterly sea breeze that sets in "by 10 am"; odukkam is the calm
  "around 5:45 am"; kodai is the westerly].
- India Meteorological Department, Regional Meteorological Centre Chennai. Chennai (Nungambakkam), climatological
  table 1991-2020 (with October extremes). https://mausam.imd.gov.in/chennai/mcdata/extreme_chennai.pdf. Mean daily
  minimum: January 21.5 °C, annual 25.1 °C [V, read from the PDF image].
- Ghibellini, R., & Meier, B. (2025). The Zeigarnik and Ovsiankina effects (meta-analysis). *Humanit Soc Sci Commun*
  12. doi 10.1057/s41599-025-05000-w [S].
- Bryan, C. J., Yeager, D. S., Hinojosa, C. P. et al. (2016). Harnessing adolescent values to motivate healthier
  eating. *PNAS*. PMC5047199 [S].
- Long, Y., & Aleven, V. (2013 AIED; 2017 *UMUAI* 27(1):55-88). Open learner model studies [S].
- Radesky, J. et al. (2022). Prevalence and characteristics of manipulative design in mobile applications used by
  children. *JAMA Netw Open* 5(6):e2217641. PMC9206186 [S].
- FTC (2025-01). Business guidance blog on the Genshin Impact / HoYoverse settlement [S].
- European Commission (2025-07-14). Guidelines on the protection of minors under DSA Art. 28 (law-firm summaries:
  Taylor Wessing, Osborne Clarke, CMS) [S].
- Roblox: state attorney-general suits (Louisiana Aug 2025, Kentucky Oct 2025, Texas Nov 2025); MDL 3166 (N.D. Cal.);
  Roblox age-check press release (2026-01-07); 2026 settlement reporting [S]. People Make Games (2021) and later
  DevEx reporting [S]. Roblox-in-learning systematic review (2023, 40 studies) [S].
- Slattery et al. (2025). Minecraft systematic review. *Review of Education*. doi 10.1002/rev3.70035 [S].
- Prodigy research page and state efficacy white papers (company-published); the Council Bluffs district analysis
  [S].
- Duolingo blog, "Improving the streak"; reporting on the July 2025 energy system (Android Authority; UX Collective)
  [S].
- Bergman, P., & Chan, E. (2021). Leveraging parents through low-cost technology. *J Hum Resour*; 2019 J-PAL working
  paper [S].
- AEA RCT Registry 17446 (Rocket Learning, Amravati) [S].
- ASER 2024 (Pratham / ASER Centre), digital module coverage (PIB factsheet; press) [S].
- Harappan weights: harappa.com slides; CSMVS collection notes [S]. Lothal dockyard: IIT Gandhinagar study coverage
  [S].
- Metroidbrainia / knowledge-based games: a scholarly abstract (academia.edu); *Outer Wilds* ship-log descriptions
  [S].

From sibling documents, with their tags: Clark et al. 2016; Wouters et al. 2013; Habgood & Ainsworth 2011; Andersen et
al. 2011; Deci, Koestner & Ryan 1999; Patall et al. 2008; Ten et al. 2021; Silverman & Barasch 2022; Kamins & Dweck
1999; Lomas et al. 2013; McLaren et al. 2017; Banerjee et al. 2025; Kobayashi 2024; Fairplay FTC complaint 2021;
Kivetz 2006; Rogers & Feller 2016. See `docs/research/content/game-mechanics.md`,
`docs/research/design/motivation-without-rewards.md` and `docs/research/psychology/motivation-habits.md`.

Repo facts: `data/curriculum/*.json`, `data/kits/c6-maths.json`, `c7-science.json` and `c7-sst.json`;
`shared/studio-spec.ts`; `shared/studio-spec-ext/heat.ts` and `town.ts`; `src/studio-v2/engines/**`;
`docs/ops/MODEL-STACK.md`; `docs/design/round2/content/RESEARCH.md`; `context/decisions.md`; `context/rejected.md`.
