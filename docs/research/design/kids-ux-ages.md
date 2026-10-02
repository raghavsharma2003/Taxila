# Kids UX by age band: design rules for Taxila

**Date:** 2026-10-02 · **Scope:** child-facing surfaces (lesson stage, modules, profile picker, waits, parent gate) for Classes 1-9 (ages ~6-15), web + Android, shared family phones, low-end devices, patchy data, Hindi / Hinglish / English.
**Question:** How must the UI differ between pre/early readers (6-9) and older children (10-15)? What do NN/g, Sesame Workshop, PBS KIDS, Khan Academy Kids, Lingokids, Toca Boca and the Indian context say? Output: age-band rules, tokens, screens, components, copy-tone notes, gates.
**Builds on (read first, not repeated here):** `docs/research/learning-science.md` (§3.7 motivation, §3.8 age table, §4.5 healthy bond, §5.4-5.5 language and devices) and `docs/harvest/gurukul.md` §6 (4-state status rule, one "your turn" highlight, 11 px floor, contrast and motion gates, copy gate, honest waits).

**Evidence tags** (same as learning-science.md, plus one): **[V]** read this session in the primary source (the organisation's own page or PDF, or the paper's abstract) · **[S]** secondary source or search summary only · **[M]** prior knowledge, not re-checked: verify before it becomes a `context/` entry · **[I]** design inference by this document. Treat [I] rules as hypotheses with a named test (§10).

**Method and limits.** About 35 fetches of primary pages and PDFs (NN/g articles, the Sesame Workshop 2012 PDF, the TIDRC framework, Anthony et al. 2013, PBS producer guidelines, ICO Annex B, Apple and Android docs, Europe PMC abstracts), plus about 20 searches. This session's web-search budget ran out partway, so several Indian-context claims are [S] or [M]. **No source studies Indian children using a voice-first AI tutor.** Most of the child-UX literature is US/UK/Israel/China, 2001-2019, and centres on tablets and websites. Every transfer to a phone voice lesson in Hindi is an extrapolation, tagged as such.

---

## 0. The answer in twelve lines

1. **Age is not one dial; it is three.** *Visual maturity* follows the child's age and class. *Reading support* follows measured reading level. *Content level* follows TaRL placement. In India these routinely disagree: a Class 7 child placed at Class 3 maths who reads at Class 2 level must get older-looking visuals, full audio support, and Class 3 content. Showing them a "babyish" screen loses them (NN/g: a 6-year-old dismissed a site as "for babies") [V]. See §1.
2. **Four bands, two families.** Young: B1 6-7 (Classes 1-2), B2 8-9 (Classes 3-4). Older: B3 10-12 (Classes 5-7), B4 13-15 (Classes 8-9). The bands follow NN/g's 6-8 / 9-12 / 13-17 splits and ICO Annex B's 6-9 / 10-12 / 13-15 stages [V].
3. **Young children: audio carries meaning, the screen carries the anchor.** Every instruction is spoken *and* shown, because children "typically do not pay attention to audio instructions alone" (Sesame) [V]. Any text can be tapped to hear it (Khan Academy Kids) [V]. Captions highlight word by word, karaoke-style, which India's same-language-subtitling evidence supports [S].
4. **Targets: 64 dp minimum, 96 dp for answers (B1-B2); 48 dp minimum (B3-B4).** Children aged 7-10 missed about 30% of 0.25-inch (40 dp) targets (Anthony et al.) [V]. NN/g recommends 2 cm × 2 cm for young children [V]. Hit areas should forgive misses by up to 10 mm (TIDRC) [V].
5. **Gestures in B1-B2: tap, drag with partial credit, and trace. Nothing else.** No double-tap, long-press, pinch, required multi-touch, or swipe-only control; every swipe has a tap twin (Sesame, TIDRC) [V]. No vertical scrolling on the lesson stage [V]. **Older bands get no hidden gestures either** (NN/g teens: avoid precision interactions) [V].
6. **Feedback starts at finger-down, with a sound** (Sesame: register on touch, not lift) [V]. **Ignore holdover touches**: taps that land on the next screen where the previous button was. The mean per-user rate was 3.93% of touches for ages 7-10 vs 0.56% for adults; 81% of all holdovers came from children (Anthony) [V].
7. **One "your turn" highlight on screen, and it is marigold with a dark ring.** The marigold fill alone (`#FFB21E`) measured **1.71:1** on the cream background (`#FFF8EE`), which fails WCAG's 3:1 non-text rule. Adding the `#9A5B00` ring gives **5.15:1** (computed this session, §4.3). Sesame independently uses a single bright-yellow highlight that appears "only when they are touchable" [V].
8. **Wait before re-prompting, and re-prompt by escalating.** Glow first, words second, hint third; at most two re-prompts, then offer tapping instead of speaking. Sesame's time-outs are 3-5 s for stories and 6-8 s for games [V]. A thinking child needs the longer end (§3, row 10).
9. **Older children: respect over cuteness.** NN/g found teens read below adult level, have "dramatically lower" patience, and call the word "kid" a "teen repellent" [V]. Interventions that honour adolescents' need for status and respect succeed where others fail (Yeager, Dahl & Dweck 2018) [V]. Give B3-B4 real choices, pace control, a quiet mode, and the plain truth about what their parent sees.
10. **Social proof only as honest "this is hard for many people", never as ranking.** Seeing exemplary peers *caused quitting* (Rogers & Feller 2016, n = 5,740) [V]. Automated social features did not raise engagement for ages 7-11 (TIDRC) [V]. Children aged 10-12 are "particularly susceptible to reward based systems" and FOMO (ICO) [V]. No leaderboards, streaks, or fake peers.
11. **"Exactly human" belongs in her voice, timing and memory, not her face.** The uncanny-valley reaction develops *after age ~9* (Brink, Gray & Wellman 2019, n = 240, ages 3-18) [V], exactly the B3-B4 boundary. Keep the teacher illustrated and test a near-photoreal variant only with B3-B4 (§11). Younger children anthropomorphise more (learning-science §3.8), so for B1-B2 the risk is believing she is real, not finding her creepy. Disclosure must be concrete.
12. **Shared phone:** pick the profile with a picture every session; notifications go to the parent and reveal nothing about the child's performance on the lock screen; parent areas sit behind the device's own lock (Android `DEVICE_CREDENTIAL`) [V], not a maths puzzle a Class 6 child can solve [I].

---

## 1. Three axes, not one age (the key decision for India)

| axis | set by | drives | why it must be separate |
|---|---|---|---|
| **Visual maturity** (band B1-B4) | age/class from parent setup; child may move **up** one band, never pushed down | illustration style, teacher register, copy tone, density, earcons, choice count | NN/g: children reject content that looks younger than them ("for babies, maybe 4 or 5 years old. You can tell because of the cartoons") [V]; teens: "never use condescending language or babyish design" [V] |
| **Reading support** (R0 none-yet · R1 decoding · R2 fluent) | measured in-lesson (oral reading probe, tap-to-hear rate), never by class | tap-to-hear on all text, karaoke captions, text length, whether instructions can be text-only | ASER 2024: only 23.4% of government-school Std III children read a Std II text (learning-science §0) [S]; an older child may be R0 |
| **Content level** | TaRL placement + learner model | the lesson itself | learning-science §5.3: place by level, not grade |

Rules:
- **Never show a grade label below the child's own class.** Show skill names ("fractions: halves and quarters"), never "Class 3 maths" to a Class 7 child. The parent report states the level honestly (learning-science §4.5: parent sees all) [I].
- **Default reading support:** R0 for B1, R1 for B2, R2 for B3-B4 until measured otherwise; downgrade silently (more audio), upgrade only with evidence [I].
- **An R0/R1 child in B3-B4** gets B3-B4 visuals with B1-B2 audio mechanics: every text tappable, karaoke captions, spoken instructions. Nothing in the UI announces "reading help is on" [I].

---

## 2. What each source studied and what transfers

| source | what it is | key findings used here | tag |
|---|---|---|---|
| NN/g, *Children's UX* (article + 4th-ed. report) | 3 rounds, 125 children aged 3-12 (2001, 2010, 2018); US, China, Israel; 156 guidelines | segment 3-5 / 6-8 / 9-12; beginning readers "read tentatively", older kids scan like adults; children "skip the long paragraphs of instructions"; younger kids "mine-sweep" (tap everything); children enjoy sound and motion (adults don't); cannot tell ads from content; type 14 pt young / 12 pt older on web | [V] |
| NN/g, physical development | same research | 2 cm × 2 cm targets for young children (4x adult 1 cm); precise dragging "through a tunnel or to a specific spot was hard"; dragging hard under 9; 5 mm buttons frustrate | [V] |
| NN/g, cognition | same research | state the goal *and* how to reach it; under-6s miss subtle character feedback, so use "exaggerated facial expressions"; kids didn't know undo/redo icons but used an eraser; 7-11: self-explanatory UI, prevent errors, autocorrect spelling, avoid zero-result pages | [V] |
| NN/g, *Teenagers* (article + report) | 100 teens aged 13-17, 3 studies, US/UK/Australia | write at 6th-grade level or lower; "dramatically lower levels of patience"; slow load is "a deal-breaker"; small text causes problems; "kid" is a "teen repellent"; facilitate sharing "but don't force it"; teens "don't want to be social all the time"; avoid drag-drop and small buttons on mobile | [V] |
| Sesame Workshop, *Best Practices: Designing Touch Tablet Experiences for Preschoolers* (2012) | 50+ touch-screen studies, ages 2-5 | full rules in §3; the ones Taxila uses directly: greet → state objective + how; time-outs 3-5 s (stories) / 6-8 s (games); 3-step wrong-answer ladder; payoffs "reflect the curricular concept"; no text help; register on touch; icons off the bottom edge; one highlight colour; "objects should only look touchable when they are touchable"; freeze hot spots until narration ends; put the action at the *end* of the spoken sentence; make non-essential prompts interruptible; vertical scrolling is "conceptually difficult"; profiles recognisable by name + unique icon; parent section with a non-enticing icon behind a "baby gate" | [V] |
| TIDRC framework (Soni, Aloba, Morga, Wisniewski, Anthony; IDC 2019) | 57 evidence-based touch recommendations, ages 2-11 | accept taps up to 5 s and 10 mm offsets; partial gesture completion; avoid hierarchical menus (2-11); audio prompts need visual support; avoid progress bars for ≤4; **avoid in-app tutorials for 7-11** (guide during the task instead); **avoid computer-automated social interactions (7-11: no effect on engagement)**; let children credit each other; avoid heavy extrinsic rewards; child-like on-screen characters as guides help learning (2-11); give feedback while the app is busy | [V] |
| Anthony et al. 2013, *Designing Smarter Touch-Based Interfaces for Educational Contexts* | 74 participants aged 6-17 plus adults; >10,000 touches, ~7,000 gestures | 7-10s miss ~30% of 0.25" targets, so "the younger the child, the larger the targets"; holdovers 3.93% of touches (7-10) vs 0.56% (adults); insetting a target from the edge **nearly doubled misses**, with 99% of those misses in the gutter, so align targets to the edge or count gutter touches; children's gestures recognised at ~81% vs 90% for adults (user-dependent) | [V] |
| PBS producer guidelines (2007) | PBS KIDS (ages 2-8 on air, 2-12 online) | sites "navigable by the target ages"; "few links to outside content (all of which are reviewed)"; **bridge pages** warn when leaving; required formative testing with children of the target age; explicit age-appropriate educational goals. The detailed web manual is password-gated. Newer PBS KIDS games add spoken instructions with on-screen demos and WCAG AA colour | [V] / [S] |
| Khan Academy Kids (KA blog, May 2025) | free app, ages 2-8 | icons and animation over text; "every text element in the app is interactive" (tap to hear); Kodi Bear's gestures carry meaning; language-agnostic sounds: "a cheerful 'ding'" for correct, "a gentle 'bong'" for incorrect; animated step-by-step demos; sparkles fill a delivery truck (a reward economy Taxila rejects, §9) | [V] |
| Lingokids | ages 2-8, "Playlearning" | parental gate before device features (camera, audio, gallery); child-directed free navigation; efficacy pages give no sample sizes | [S] / [V] |
| Toca Boca | ages ~3-8 digital toys | "no language and no text" makes apps global; "a 'digital toy', not a game"; "no stress and especially no stressy music"; "the game has to work in real life before it can become an app" (paper prototyping with kids) | [S] (Observer 2018 via Gulf News) |
| Google Read Along (formerly Bolo), India | reading tutor with assistant "Diya" | offline after download; "entry level smartphones with 1GB RAM"; English + 7 Indic languages incl. Hindi; listens to oral reading and helps when stuck; stars and badges; the earlier Bolo trial in 200 UP villages reported 64% of children improved in 3 months (not an RCT) | [V] page; [S] trial |
| ICO Children's Code, Annex B | UK regulator's developmental stages | 6-9: family is the strongest influence, children comply with clear rules, peer fit-in rising. 10-12: "key age range" of change, more phone use, "particularly susceptible to reward based systems", FOMO, peer and influencer pressure. 13-15: identity, autonomy, may "reject or distance themselves" from parents' values, "susceptible to negative comparison" | [V] |
| Brink, Gray & Wellman 2019, *Child Development* (PMID 29236300) | 240 children aged 3-18 | uncanny-valley feelings emerge after ~age 9; robots creep children out when they seem to have human-like *minds* | [V] abstract |
| Rogers & Feller 2016, *Psych. Science* (PMID 26825105) | MOOC natural experiment, n = 5,740, plus n = 361 replication | exposure to exemplary peer work increased dropout | [V] abstract |
| Yeager, Dahl & Dweck 2018 (PMID 29232535); Bryan, Yeager et al. 2016 *PNAS* (n = 536 8th graders) | adolescent motivation | interventions work when they honour status and respect; framing healthy eating as autonomy / standing up to manipulation changed behaviour where health messaging did not | [V] abstracts |
| Lovato, Piper & Wartella 2019; Cheng et al. 2018 (via IIT Delhi review, 2022) | 5-6-year-olds and a smart speaker for 2 weeks (1,577 questions); 14 preschoolers with a buggy voice app | 89% transcribed correctly, but only ~50% of those answered correctly; when not understood, children repeat, get **louder**, change pitch; they cannot easily rephrase; parents model repair | [S] |
| Same-language subtitling (Kothari, IIM-A; PlanetRead) | Hindi film songs subtitled in Hindi on Doordarshan since 2002 | Nielsen-ORG 2002-2007: schoolchildren able to read a paragraph rose 25% → 56% with 30 min/week of subtitled *Rangoli*; syllable-synchronised colour change recommended | [S] (Wikipedia; Kothari 2008 *Int. Rev. Educ.*, DOI 10.1007/s11159-008-9110-3, not read) |
| Medhi, Sagar & Toyama 2007, *ITID* (DOI 10.1162/itid.2007.4.1.37) | text-free UIs, low-literate adults in India | voice + graphics beat text-based UIs for non-readers | [M] (metadata only) |
| Google Next Billion Users | shared-device research | phones shared across family while systems assume "one person, one account"; privacy exposure inside the household | [S] |
| Apple App Review 1.3; Android BiometricPrompt | platform rules | Kids apps: no links out, purchases or "other distractions" except behind a parental gate; no third-party analytics or ads [V]. Android: `setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)`; on API ≤ 29 `DEVICE_CREDENTIAL` is unsupported, so use `KeyguardManager` [V] |

---

## 3. Age-band rules (the core table)

Columns: **Young** = B1 6-7 + B2 8-9 (differences inline) · **Older** = B3 10-12 + B4 13-15.

| # | dimension | Young (B1 / B2) | Older (B3 / B4) | basis |
|---|---|---|---|---|
| 1 | primary input | voice; tap as an equal fallback; tap-to-talk (push-to-talk) default for Classes 1-3 | open mic (VAD) default; tap and typed answers equal citizens; **quiet mode** (type/tap, earphones) one tap away | tech-and-market M3 [I]; learning-science §3.8 |
| 2 | instruction form | spoken + visual every time (highlight the path, animate the target); goal and how; action at the **end** of the sentence (Hindi's verb-final order helps) | spoken + short text; goal stated once; can stack two steps in B4 | Sesame [V]; NN/g cognition [V] |
| 3 | on-screen text | labels only, ≤ 4 words, every text node tappable to hear; no paragraphs; no text-only help | chunks ≤ 2 lines, 6th-grade level or lower; no dense text | Khan Kids [V]; NN/g [V] |
| 4 | captions | karaoke caption strip on by default, word highlight synced to her audio; script = the child's school medium (§8.1) | captions available, off by default for R2; on for R0/R1 | Sesame, TIDRC #37 [V]; SLS [S] |
| 5 | targets | min 64 dp hit (≈10 mm); answer tiles ≥ 96 dp (B1 ≥ 112 dp); gap ≥ 16 dp; nearest-target resolution for misses ≤ 10 mm | min 48 dp; answer tiles ≥ 64 dp; gap ≥ 8 dp | Anthony, NN/g, TIDRC #48/#52 [V]; Material 48 dp [S] |
| 6 | gestures | tap; drag with snap and partial credit (drop within 1 tile width counts); trace with partial completion. **Banned:** double-tap, long-press, pinch, rotate, flick-only, required multi-touch, swipe-only navigation. A press up to 5 s is still a tap | tap, drag, slider (with explicit end points), swipe with a visible affordance and a tap twin; no long-press-only or pinch-only functions | Sesame, TIDRC #43-48 [V]; NN/g teens [V] |
| 7 | navigation | no menus deeper than 1; one persistent "home" (house icon) and one "leave" guard; no scrolling on the lesson stage; horizontal strip for any list of > 4 | flat, ≤ 2 levels; vertical scroll allowed outside the lesson stage | TIDRC #17/#49, Sesame [V] |
| 8 | exploration | everything that looks tappable does something harmless and reversible (mine-sweeping); nothing tappable during her narration (freeze hot spots) | same reversibility; no freeze, but no surprise modals | NN/g, Sesame, TIDRC #18 [V] |
| 9 | onboarding | none; the teacher demonstrates inside the first lesson; parents get a separate how-to | ≤ 3 cards max, skippable, then learn by doing | Sesame, TIDRC #38 [V] |
| 10 | time-outs after her question | glow + listening pose at 4 s → spoken re-prompt (goal + action) at 8-10 s → hint or tap options at ~15 s; max 2 verbal re-prompts | glow at 6 s → "take your time" nudge only after ~12 s, and only if the child has not started speaking | Sesame 3-5 / 6-8 s [V]; VAD idle 8 s (tech-and-market) [I]; measure (§10 M-UX-4) |
| 11 | feedback on input | sound + visual on pointer-down within 100 ms; language-agnostic correct/incorrect earcons | visual on pointer-down; earcons optional (setting) | Sesame, Khan Kids [V]; gurukul §6.2 |
| 12 | wrong answers | 3-step ladder: (1) name it gently + retry; (2) restate the goal + hint; (3) highlight the path, then a fresh isomorphic item. Never red, never a buzzer | same ladder in words, with a "show me why" option; the child may ask for the hint first | Sesame [V]; ARCHITECTURE §1.2 |
| 13 | payoff | concept-shaped and specific (the fraction pizza actually gets shared), short, then on to the next thing; no points, coins or unlocks | quiet, specific acknowledgement; mastery milestones stated as capability | Sesame [V]; learning-science rule 27 |
| 14 | progress | concrete path of 3-5 stepping stones per lesson that fill with pictures; no bars or percentages | honest skill map with states; numbers allowed | TIDRC #35 [V] (≤4); [I] for 6-9 |
| 15 | choice offers | 2 (B1) or 2-3 (B2) picture choices, spoken; cheap choices (character, context, order) | 3-4 with text; includes pace ("go deeper" / "quicker") and format | learning-science §3.7 |
| 16 | teacher on screen | large (≈40% of height), exaggerated expressions, points at the module | smaller once a module opens (≈25% or picture-in-picture); subtler expressions | NN/g cognition [V]; [I] |
| 17 | status (4 states) | shown by her body (listening lean, thinking eyes-up, speaking mouth, your-turn ring on the mic or tiles) + a transition earcon; **no words** | same, plus an optional one-word label | gurukul §6.2; ARCHITECTURE §1.5; Sesame transition sound [V] |
| 18 | autonomy | choices inside the lesson; parent sets session length | pick the session goal (1 of 3), "I know this" (launches a quick check, not a free skip), pace control, voice/look choice within the set, quiet mode | Yeager 2018, ICO Annex B [V] |
| 19 | social | relatedness points outward: "show your parent what you made" | honest normative struggle only ("many students find this one tricky", from real aggregates); share own work to the parent, optionally; no feeds, ranks, streaks | Rogers & Feller, TIDRC #56, ICO [V]; learning-science §4.5 |
| 20 | transparency | disclosure in concrete terms she repeats when asked ("I'm a computer teacher, not a person"), plus parent framing | plain-language "what your parent can see" screen; never claims feelings | learning-science §4.5; Meera invariants |
| 21 | session shape | short blocks with a physical "do" moment; parent-set cap | longer focused blocks; break prompts | learning-science §3.8 [M]; measure |

---

## 4. Tokens per band

### 4.1 Size, spacing, timing (dp/sp on Android; same numbers as CSS px at density 1)

| token | B1 | B2 | B3 | B4 | note |
|---|---|---|---|---|---|
| `hit.min` | 64 | 64 | 48 | 48 | 64 dp ≈ 10.2 mm; 48 dp ≈ 7.6 mm by definition (Material says "about 9 mm") |
| `tile.answer.min` | 112 | 96 | 64 | 64 | two 160-dp tiles fit a 360-dp-wide budget phone [M: 720 px at 320 dpi] |
| `gap.target` | 16 | 16 | 8 | 8 | Sesame "adequately isolated" [V] |
| `mic.size` | 96 | 88 | 64 | 56 | B1-B2 centre-bottom, above the system gesture inset |
| `type.caption` (Latin / Devanagari) | 22 / 24 | 20 / 22 | 18 / 20 | 16 / 18 | child-facing floor: 16 sp Latin / 18 sp Devanagari; gurukul's 11 px floor applies to parent screens only |
| `type.label` | 20 / 22 | 18 / 20 | 16 / 18 | 15 / 17 | NN/g 14 pt young vs 12 pt older on web; TIDRC ≥ 14 pt for 7-11 [V] |
| `type.title` | 28 / 30 | 26 / 28 | 24 / 26 | 22 / 24 | |
| `leading` (Latin / Devanagari) | 1.35 / 1.6 | 1.35 / 1.6 | 1.4 / 1.6 | 1.4 / 1.6 | matras need vertical room [S]; never clip (§8.2) |
| `choices.max` | 2 | 3 | 4 | 4 | [I], measure |
| `speech.turn.maxWords` (teacher) | 15 | 20 | 30 | 40 | gpt-realtime-mini ran 41-53 words/turn unprompted (hp-main-engine) so this must be enforced, not hoped for [I] |
| `timeout.glow` / `timeout.reprompt` (s) | 4 / 8 | 4 / 10 | 6 / 12 | 6 / 12 | row 10 |
| `holdover.guard` | 400 ms within 1 target width of the last activated widget | same | 250 ms | 250 ms | Anthony gives the heuristic, not the threshold [I], measure |
| `press.maxTap` | 5 s | 5 s | 5 s | 5 s | TIDRC #48 [V] |
| `motion.enter / exit / press` | 240 / 160 / 100 ms | same | 160 / 140 / 100 | same | gurukul motion tokens; transform/opacity only; `prefers-reduced-motion` → 1 ms |
| `radius.tile` | 24 | 20 | 16 | 12 | rounder reads younger [I] |
| `illustration` | chunky outline, flat fill, big eyes | same, more detail | graphic-novel, fewer outlines | editorial, near-adult | NN/g "babyish" cue is the cartoons [V] |

### 4.2 Edge and inset rules
- Anthony: insetting targets from the screen edge nearly doubled misses [V], but Android reserves gesture insets (bottom home bar, side back swipes). **Rule:** respect `WindowInsets.systemGestures`; a touch in the gap between a target and the inset counts as the nearest target [V heuristic, I threshold].
- Keep primary targets off the bottom 24 dp in B1-B2. Children's palms and wrists rest on edges (Sesame, tablets) [V], and on phones the thumb sits there [I].

### 4.3 Colour tokens (measured 2026-10-02 with the WCAG 2 relative-luminance formula; deterministic, re-run with `python3 docs/research/design/kids-ux-contrast.py`)

| token | light | on `bg` | dark | on dark `bg` | use |
|---|---|---|---|---|---|
| `bg` | `#FFF8EE` warm cream | | `#16140F` | | page |
| `surface` | `#FFFFFF` | | `#221F19` | | tiles, cards |
| `ink` | `#1F1A14` | 16.37 | `#F6F1E8` | 16.36 | text |
| `ink-2` | `#5A5148` | 7.36 | `#BDB4A6` | 8.98 | secondary text (passes AA, unlike gurukul's `#7a7e74`) |
| `turn` (fill) | `#FFB21E` marigold | **1.71 fails** | `#FFB21E` | 10.20 | the single "your turn" glow. **Must carry `turn-ring`** in light mode; ink on marigold = 9.57 |
| `turn-ring` | `#9A5B00`, 3 px | 5.15 | (not needed) | | non-text indicator ≥ 3:1 |
| `done` | `#1F7A4D` leaf | 5.04 (white on it 5.32) | `#4CC38A` | 8.31 | done / correct state |
| `listen` | `#2563C9` sky | 5.37 | `#7FB0FF` | 8.38 | listening pulse |
| `think` | `#5B6470` slate | 5.69 | `#9AA3AF` | 7.21 | thinking, deliberately neutral (gurukul) |
| `stop` | `#B3261E` brick | 6.20 | `#FF8A80` | 8.06 | **system errors only, never a wrong answer** |
| `tile-border` | `#8C8478` | 3.50 | | | tile edge (non-text 3:1) |

- Gurukul's archival palette (paper `#f4f1e9`, forest, serif) is replaced for children; its *rules* carry over (4 states with words for parents, at most one ember).
- Few colours per screen for B1 (TIDRC #4: avoid many colours, ages 2-7) [V]. Module diagrams draw from a separate categorical set; `turn` marigold is never used in diagrams.
- Light is the default for B1-B2. B3-B4 may choose dark: teens' preference [I], and phones are used at night.

---

## 5. Screens

### S1 Profile picker, "who is learning now?" (every launch and after 10 min idle)
- Grid of avatar tiles (B1-B2 size): picture + name; tapping plays the name aloud and asks "is this you?" with a tick/cross pair (Sesame) [V]. An "add a child" tile goes to the parent gate.
- B3-B4 may set an optional 4-digit child PIN to keep siblings out. 13-15s seek autonomy (ICO) [V]; the PIN is privacy between siblings, not security [I].
- **Identity check without biometrics:** the retrieval opener names last lesson's topic; if the child says "I didn't do that", the Director flags a possible profile mix-up and asks once. A sibling on the wrong profile corrupts evidence (ARCHITECTURE: identity by child id, never device) [I].
- Parent corner: small, dull icon top-right, not enticing (Sesame) [V], behind S8.

### S2 Lesson stage, Young (portrait, 360 × 800 dp)
```
┌──────────────────────────────────┐
│ ⌂                  ○○●○○   (⏸)   │  home · stepping-stone path · pause
│ ┌──────────────────────────────┐ │
│ │      TEACHER (≈40%)          │ │  illustrated; points down at the anchor
│ │   expressive, body = status  │ │
│ └──────────────────────────────┘ │
│  ▌आधा  ▌ है  ▌ ना?               │  karaoke caption: current word lit
│ ┌──────────────────────────────┐ │
│ │   ANCHOR / MODULE            │ │  one idea: the pizza, the number line
│ │   (frozen while she talks)   │ │
│ └──────────────────────────────┘ │
│  ┌────────────┐  ┌────────────┐  │  answer tiles ≥ 96 dp, pictures first,
│  │   🍕½      │  │   🍕¼      │  │  tap-to-hear any label
│  └────────────┘  └────────────┘  │
│            ( 🎤 96dp )           │  your-turn ring sits here OR on tiles,
└──────────────────────────────────┘  never both
```
- Exactly one `turn`-ringed element. While she speaks, tiles look *inert* (desaturated, no ring): "objects should only look touchable when they are touchable" [V].
- No scroll. Everything interactive is on screen at load (Sesame) [V].
- Leave guard: the system back gesture opens a full-screen "stop the lesson?" card with a large tick/cross and a spoken question. The home gesture cannot be blocked; parents can turn on Android screen pinning from the parent area [M].

### S3 Lesson stage, Older (portrait; modules may request landscape in B3-B4 only)
```
┌──────────────────────────────────┐
│ ←  Fractions · comparing   ⓘ  ⋮  │  skill name, never a lower class label
│ ┌──────────────────────────────┐ │
│ │ MODULE (≈60%)        ┌─────┐ │ │  teacher shrinks to a picture-in-picture
│ │ simulation / diagram │ PiP │ │ │  when a module opens
│ │                      └─────┘ │ │
│ └──────────────────────────────┘ │
│  CC  "Which is bigger, 3/4 or…"  │  captions optional (R2 default off)
│ [Show me why] [Hint] [I know this]│  chips: autonomy, all ≥ 48 dp
│ ┌───────────────────────┐ ( 🎤 ) │  typed answer field (Hinglish OK)
│ │ type or just speak…   │  ⌨/🔇  │  quiet-mode toggle
│ └───────────────────────┘        │
└──────────────────────────────────┘
```
- "I know this" starts a 1-2 item check (evidence), never a silent skip. Pass → move on with a specific acknowledgement; fail → no shame, carry on [I], learning-science §1.

### S4 Answer moments by modality
- **Choose:** tiles (row 5). **Speak:** mic ring + listening pulse; if ASR confidence is low, show 2-3 tiles of what she thinks was said (never "I didn't understand you" twice). Children repair by repeating *louder* and cannot easily rephrase (Lovato, Cheng) [S], so offer the tap route on the second miss [I].
- **Drag (B1-B2):** large handles, magnetic drop zones, partial credit, a ghost hand showing the path the first time (Sesame) [V]. **Trace/draw:** accept lifts mid-stroke.

### S5 Waits and patchy data (extends gurukul's honest-wait ladder)
- < 1 s: nothing. 1-4 s: the teacher's thinking pose, not a spinner. 4-30 s: Young: she holds up a small "one moment" visual with a soft earcon (no text); Older: a named phase ("getting the simulation ready") with elapsed time counting up.
- Offline or the call drops: switch to a cached offline practice card from the lesson pack rather than an error. The error copy names whose problem it is ("our connection", never the child) (gurukul §6.2) [I].
- NN/g teens: slow is a "deal-breaker" [V]. Older bands get a text fallback the moment voice stalls.

### S6 End of lesson
- Young: one picture of what they made or solved, spoken summary, and the outward prompt "show your parent" (learning-science §4.5). No collection screen or loot.
- Older: a 3-line capability summary ("you can now…"), the next choice of 3, and an optional share to the parent.

### S7 Teach-back
- Young: a *child-like* character who "doesn't know" (TIDRC #3: child-like guides help, ages 2-11) [V]. The teacher announces it at the start (learning-science §1.5).
- Older: "explain it to a classmate who missed class" or record a 30-second explainer. Same probe, not babyish [I].

### S8 Parent gate and parent area
- Gate = the device's own lock: Android `BiometricPrompt` with `BIOMETRIC_STRONG or DEVICE_CREDENTIAL` on API 30+; `KeyguardManager` on API ≤ 29 [V]; a guardian PIN on web. Not a maths question, which B3-B4 children solve trivially [I].
- **Known weakness:** on family phones many children know the unlock pattern [I, unmeasured]. The gate prevents accidents, not a determined teen. **Consent-grade actions** (consent changes, deletion, export) re-authenticate the guardian account itself (password or OTP), in line with DPDP Rule 10 planning (learning-science §4.3).
- Every external link sits behind the gate plus a bridge page "you are leaving Taxila" (PBS bridge pages; Apple 1.3) [V].

### S9 "What your parent can see" (B3-B4, from onboarding and settings)
- Plain list: transcripts, what you got right and what you are still working on, time spent. Teens accept limits better when treated with respect and told the truth (Yeager 2018) [V]. **No secret monitoring.** This does not weaken "parent sees all"; it makes it honest [I].

### S10 Notifications (shared phone, addressed to the parent)
- Addressed to the parent, sent when the parent holds the phone (learned send window) [I].
- Lock-screen text reveals no performance ("Aarav's lesson summary is ready", never "Aarav struggled with fractions"). NBU: shared phones expose private content inside the household [S].
- No streak or guilt copy (learning-science §3.7).

---

## 6. Components (contracts for the build workstreams)

| component | band behaviour | must-haves |
|---|---|---|
| `ProfilePicker` | avatar + spoken name; optional child PIN for B3-B4 | identity check hook for the retrieval opener |
| `TeacherStage` | size, expression gain and illustration style by band; 5 states (idle, listening, thinking, speaking, delighted) | status shown by the body first; lip-sync on the playback clock (companion-tech) |
| `CaptionStrip` | karaoke word highlight (Young, R0/R1); plain toggle (Older) | per-word timing from the TTS/realtime transcript; script per §8.1; tap a word to replay it |
| `AnswerTile` | picture-first (Young), text-first (Older) | pointer-down feedback ≤ 100 ms; holdover guard; inert look when not answerable; tap-to-hear label |
| `MicButton` | tap-to-talk (B1-B2 default), open mic (B3-B4) | carries the `turn` ring only when it is the single your-turn element; listening pulse in `listen` |
| `YourTurn` | the only element allowed the `turn` token | gate: ≤ 1 per screen (reuse gurukul's exhaustive test) |
| `ChoiceOffer` | 2 / 3 / 4 options by band | choices are cheap and real; each choice is logged as a preference, never as evidence of learning (learning-science §2.6) |
| `HintLadder` | 3 visual steps (Young); "show me why" (Older) | never reveals before commit (gurukul: verdict never before commit) |
| `ProgressPath` | stepping stones (Young), skill map (Older) | no percentages for Young |
| `LeaveGuard` | full-screen confirm with tick/cross and a spoken question (Young); standard dialog (Older) | intercepts the back gesture; does not trap |
| `ParentGate` | device credential → guardian re-auth for consent-grade actions | no child-solvable puzzles |
| `WaitState` | thinking pose → "one moment" visual (Young) / named phase (Older) | elapsed time counts up; never a fake progress bar |

---

## 7. Copy tone notes, as shapes, never as lines

> **Warning for prompt writers.** Anything sentence-shaped in a prompt gets recited (repo law; recited 4/5 → 0 after removal). These notes describe registers for UI strings and for writing *shapes* into the Director. Do not paste them into `compile()` as example lines.

- **Young (B1-B2) UI strings:** ≤ 4 words, a picture always next to them, Hindi sentence frame, English nouns as labels the way NCERT does (learning-science §5.4). The action word comes last. No question marks on buttons. No dashes, version stamps or filler verbs (gurukul copy gate).
- **Young teacher register:** warm, like an older sister; one idea per turn; names the goal, then the action; praise names the *process* and the *concept*; mistakes are named plainly but softly, without "wrong!" or buzzers. Avoid "very good" loops and inflated praise (learning-science §3.5).
- **Older (B3-B4) register:** a respected older cousin. Talks *with*, not down; no diminutives ("kids", "little ones", "bachcho") (NN/g: "kid" is a teen repellent) [V]. Humour is dry and topical, never forced slang (borrowed slang reads as cringe [I]). States why something matters in terms of *their* goals (exam, a skill they want), consistent with Bryan/Yeager's values framing [V].
- **Disclosure lines are product copy, not improvisation:** a fixed, reviewed set per band, checked by the persona invariants (never deny being an AI).
- **Read-aloud test** for every string (gurukul), *in both Hindi and English voices*, because Young surfaces are heard more than read.

---

## 8. Indian context

### 8.1 Script and language on screen
- **Caption script follows the child's school medium**, the script they are learning to read: Hindi-medium → Devanagari; English-medium → Roman. English technical terms stay in Roman inside Devanagari captions, as NCERT labels do [I, test]. Gurukul measured that ASR returns Devanagari even for English words (`माय नेम इज़ राघव`), so captions need a script-normalisation step before display (gurukul §3.6) [V harvest].
- A three-way language choice (Hindi · Hinglish · English), not a single "Hindi/Hinglish" toggle; gurukul rejected the single toggle (`one-hindi-and-hinglish-toggle-hides-script-truth`).
- **Numerals:** international digits (1 2 3) by default; Devanagari digits only where the textbook uses them. Article 343 sets the international form for Union official use, and NCERT Hindi-medium maths books appear to use it [M: verify against the current textbooks].
- Same-language subtitling is the strongest Indian-specific argument for karaoke captions in B1-B2 [S].

### 8.2 Devanagari typography
- Devanagari has no x-height; size is judged by the mass between the shirorekha (headline) and baseline. "Devanagari may require additional line spacing" (Alphabettes) [V]; a practitioner guide gives ≥ 16 px body and 1.6-1.8 line height [S, weak source]. The tokens set Devanagari 2 sp larger than Latin and use 1.6 leading. **Confirm with a reading-speed test (M-UX-7).**
- **Never clip matras:** no fixed-height single-line boxes with `overflow: hidden`. Screenshot-test every type token with ि ी ु ू ृ ं ँ and conjuncts क्ष त्र ज्ञ श्र द्ध [I; gate G8]. Never letter-space or justify Devanagari, because it breaks the shirorekha (Alphabettes) [V]. No faux italics or underlines on Devanagari.
- Candidate OFL fonts: **Noto Sans Devanagari**, **Mukta**, **Hind**, and **Annapurna SIL** ("highly readable", includes alternate letterforms used by different communities) [V]. Pick by testing with Class 2-4 readers. School primer letterforms are the Hindi analogue of Sesame's Zaner-Bloser advice (letterforms close to what children are taught; Sesame [V], transfer [I]).

### 8.3 Shared family phone
- ASER 2024: ~90% of 14-16-year-olds have a smartphone at home, but only 27-38% have their own (learning-science §5.5) [S]. Sessions start when a parent hands over the phone. Design for: profile pick per session (S1), a lesson that survives a phone call interrupting it (pause + resume at the same step), notifications to the parent (S10), and sibling privacy for B3-B4.
- The parent may stay in the room. Young: invite them in ("show your parent"). Older: quiet mode lets a teen answer without the family hearing every attempt [I].

### 8.4 Low-end devices and data
- Read Along runs offline on 1 GB RAM phones [V]: the Indian bar for a children's learning app. Taxila's realtime voice needs a network, so offline lesson packs (practice, modules, captions) cover drops (S5).
- Animate with transform/opacity only. Rive/Lottie teacher assets get a frame-time budget measured on a 2-3 GB device (learning-science §5.5) [I; gate G9].
- No background music by default, for three reasons: it competes with ASR, costs data, and TIDRC #10 advises against background music with video for ≤ 5 [V]. Toca: "no stressy music" [S].

---

## 9. Where Taxila deliberately departs from the reference products

| product practice | Taxila | why |
|---|---|---|
| Khan Kids sparkles → truck; Read Along stars and badges; most kids' apps' collections | no tangible-reward economy; concept-shaped payoff + capability statements | learning-science rule 27 (undermining effect, stronger in children); ICO: 10-12 "particularly susceptible to reward based systems" [V] |
| Toca Boca: no goals, no winning | lessons have curricular goals; *modules* may be Toca-like sandboxes inside a goal; keep Toca's "no stress" and no punishing failure states | curriculum focus; Toca [S] |
| Sesame's third wrong answer highlights the right answer | highlight, then a fresh isomorphic item before credit | Director rule (ARCHITECTURE §1.2); learning-science §1.8 |
| NN/g teens: games, quizzes, voting, sharing work | quizzes as covert probes yes; voting and sharing outside the family no (v1) | minors, DPDP §9; Rogers & Feller [V] |
| Read Along / Khan Kids open-ended exploration homes | the lesson is teacher-led; the home screen is a single "start" + a small choice of 3 | Khanmigo's low initiative problem (learning-science §0 item 6): the teacher must drive |
| Gurukul archival, serif, light-only | warm cream, rounded sans, dark mode for B3-B4 | gurukul §6.1 inference: unsuitable for kids |

---

## 10. Gates and measurements

### 10.1 Build gates (same discipline as gurukul's `check-*.mjs`; each needs a negative control)
- **G1 target size:** every interactive node's hit box ≥ `hit.min` for its band; answer tiles ≥ `tile.answer.min`.
- **G2 gesture whitelist:** no double-tap, long-press, pinch or rotate handlers in Young-band components; any swipe handler has a paired tap control.
- **G3 audio coverage:** every text node rendered in a Young band (or at R0/R1) has an audio source.
- **G4 one your-turn:** ≤ 1 `turn` token on screen (port gurukul's exhaustive state test).
- **G5 no scroll on the Young lesson stage;** hidden content must show a "more" indicator (Sesame) [V].
- **G6 contrast:** text ≥ 4.5:1, non-text ≥ 3:1 in both themes; `turn` fill in light mode must render with `turn-ring` (the 1.71:1 trap).
- **G7 copy:** no "kid/kids/bachcho" in Older-band strings; gurukul copy gate (no dashes, filler verbs, codenames); bilingual read-aloud review.
- **G8 Devanagari clipping:** screenshot diff of matra/conjunct strings at every type token, on the smallest supported screen.
- **G9 motion/perf:** `prefers-reduced-motion` honoured; teacher animation frame time on the reference 2-3 GB device.
- **G10 holdover guard:** a unit test where a tap at the previous widget's location within the guard window is ignored, plus a negative control just outside it.

### 10.2 Pre-launch measurements (each logged with n, method and date per `context/` rules)

| id | question | method | n (min) | decides |
|---|---|---|---|---|
| M-UX-1 | miss rate by tile size per band | instrumented build; touches within 10 mm outside any target = near-miss | 12 children per band, 200+ taps each | `hit.min`, `tile.answer.min` |
| M-UX-2 | holdover frequency and best guard window | same logs; replay at 150/250/400/600 ms | same | `holdover.guard` |
| M-UX-3 | tap-to-talk vs open mic for Classes 1-3 | within-child A/B; false cut-offs, barge-ins, completion | 20 children | row 1 default (tech-and-market M3) |
| M-UX-4 | answer latency distribution after her questions, by band and question type | timestamps from transcripts | 30 lessons per band | `timeout.*` |
| M-UX-5 | "babyish" rating | card sort of 3 visual variants with B2-B4 children: "who is this app for?" | 8 per band | illustration tokens, band edges |
| M-UX-6 | teacher face: stylised vs near-photoreal | Brink-style creepy/likeable + "does she have feelings?" items, per band | 15 per band | §11 |
| M-UX-7 | Devanagari legibility | oral reading speed and errors, 3 fonts × 2 sizes, Class 2-4 Hindi-medium | 24 | font, `type.*` Devanagari |
| M-UX-8 | caption effect for R0/R1 | karaoke on vs off; delayed recall + word recognition | 40 | caption default |
| M-UX-9 | parent-gate leakage | 1-week home diary + logs: child entries into the parent area | 20 families | gate design |
| M-UX-10 | profile mix-ups on shared phones | identity-check flags vs parent confirmation | 50 families | S1 design |

**Testing protocol** (NN/g's 16 tips, adapted) [V + I]: segment by band; friendship pairs for 6-8; parents present but out of the child's view; neutral generic praise; easy task first. Sessions run ≤ 30 min for B1-B2 in homes (NN/g's 60-90 min lab sessions are too long for this setting [I]). Use real budget phones, not test devices. Recruit Hindi-medium and English-medium, urban and peri-urban. Paper-prototype modules with children before building them (Toca: "work in real life before it can become an app") [S]. PBS requires formative testing with the target age; so should Taxila's release gate [V].

---

## 11. Open questions and risks

1. **The owner's "exactly human" teacher on screen vs the uncanny valley.** The evidence (Brink 2019 [V]) predicts that a near-human face starts to creep out children at about 9+, the B3-B4 boundary. That reaction is tied to perceiving a human-like mind, which is exactly what a great voice tutor projects. Recommendation: human in voice, timing, memory and humour; **illustrated in face** for every band until M-UX-6 says otherwise. For B1-B2, a more human face adds a different risk: belief that she is real. That calls for concrete disclosure (learning-science §4.5).
2. **Teen autonomy vs "parent sees all".** Resolved here by transparency (S9), not by hiding anything. It may still depress candour in B4. Measure: compare B4 utterance length and question-asking before and after the S9 screen is introduced (an ethics-safe proxy).
3. **Quiet mode reduces voice evidence.** Typed Hinglish is noisier to grade than taps and lacks prosody. The Director must treat the modalities as equal evidence sources (learning-science §1.10: speech signals are weak anyway).
4. **Band edges are fuzzy.** A 9-year-old in Class 4 sits on the uncanny, reading and ICO boundaries at once. Let the child move up one band, and re-evaluate at each class change.
5. **Indian-specific child UX is under-studied.** Most items in §2 are Western. The first measurement round (§10.2) is Indian-native by design; treat its results as overriding the Western defaults.

---

## 12. Sources

- NN/g: [Children's UX: usability issues](https://www.nngroup.com/articles/childrens-websites-usability-issues/) · [Physical development](https://www.nngroup.com/articles/children-ux-physical-development/) · [Cognitive considerations](https://www.nngroup.com/articles/kids-cognition/) · [UX Design for Children 3-12 report](https://www.nngroup.com/reports/children-on-the-web/) · [Teenager's UX](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/) · [UX for Teenagers report](https://www.nngroup.com/reports/teenagers-on-the-web/) · [Usability testing with minors: 16 tips](https://www.nngroup.com/articles/usability-testing-minors/)
- Sesame Workshop (2012), [Best Practices: Designing Touch Tablet Experiences for Preschoolers (PDF via Joan Ganz Cooney Center)](https://joanganzcooneycenter.org/wp-content/uploads/2020/02/SesameWorkshop-2012.pdf)
- Soni et al. (IDC 2019), [TIDRC framework](https://init.cise.ufl.edu/wp-content/uploads/sites/378/2019/04/TIDRC-Framework-soni-et-al-IDC19-final.pdf)
- Anthony et al. (2013), [Designing Smarter Touch-Based Interfaces for Educational Contexts](https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf)
- PBS, [Producer Guidelines for Children's Content (2007)](https://klru-pdfs.s3.amazonaws.com/pbskidssubmissionguidelines.pdf) · [PBS KIDS accessibility coverage](https://www.parentingspecialneeds.org/article/pbs-kids-focus-is-on-content-accessibility-for-all/)
- Khan Academy, [Supporting English Language Acquisition with Khan Academy Kids (May 2025)](https://blog.khanacademy.org/?p=19410)
- Lingokids, [Research](https://lingokids.com/research) · [In-app audio, gallery and camera (parental gate)](https://help.lingokids.com/hc/en-us/articles/11465888382865-In-App-Audio-Gallery-and-Camera-Features)
- Toca Boca, [Gulf News / The Observer, 2018](https://gulfnews.com/amp/story/technology%2Fconsumer-electronics%2Ftoca-boca-glory-game-apps-children-love-even-though-they-cant-win-1.1328450)
- Google, [Read Along (India FLN page)](https://readalong.google/intl/en_in/fln/) · [Keyword: Read Along](https://blog.google/products-and-platforms/products/education/early-access-read-along/) · [Device-specific privacy (NBU)](https://design.google/library/device-specific-privacy) · [Teacher Approved](https://blog.google/products-and-platforms/platforms/google-play/teacher-approved-apps/) · [Material touch targets](https://m2.material.io/design/usability/accessibility.html)
- ICO, [Age appropriate design code, Annex B](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/annex-b-age-and-developmental-stages/)
- Brink, Gray & Wellman (2019) *Child Development*, [doi:10.1111/cdev.12999](https://doi.org/10.1111/cdev.12999) · Rogers & Feller (2016) *Psychological Science*, [doi:10.1177/0956797615623770](https://doi.org/10.1177/0956797615623770) · Yeager, Dahl & Dweck (2018) *Perspectives on Psychological Science*, [doi:10.1177/1745691617722620](https://doi.org/10.1177/1745691617722620) · Bryan, Yeager et al. (2016) *PNAS*, [doi:10.1073/pnas.1604586113](https://doi.org/10.1073/pnas.1604586113)
- Muthukkumar & Mukherjee (2022), [Interaction of Children with Voice Assistant Technologies, IIT Delhi](https://humansandtech.iitd.ac.in/wp-content/uploads/2023/04/Voice-Assistants-Children.pdf) (reviews Lovato 2015/2019, Cheng 2018, Druga 2017/2018)
- Same-language subtitling: [Wikipedia](https://en.wikipedia.org/wiki/Same_language_subtitling) · Kothari (2008), [doi:10.1007/s11159-008-9110-3](https://doi.org/10.1007/s11159-008-9110-3)
- Medhi, Sagar & Toyama (2007), [doi:10.1162/itid.2007.4.1.37](https://doi.org/10.1162/itid.2007.4.1.37)
- Devanagari: [Alphabettes, Devanagari Typography 101](https://www.alphabettes.org/devanagari-typography-101-a-guide-for-typesetting-with-latin/) · [hindicheck, Hindi fonts for web](https://www.hindicheck.in/blogs/best-hindi-fonts-for-websites) · [Annapurna SIL](https://software.sil.org/annapurna/)
- Platforms: [Apple App Review Guidelines 1.3](https://developer.apple.com/app-store/review/guidelines/) · [Android biometric auth / DEVICE_CREDENTIAL](https://developer.android.com/identity/sign-in/biometric-auth)
