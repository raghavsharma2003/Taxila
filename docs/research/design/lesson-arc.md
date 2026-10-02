# Lesson arc: the live lesson, phase by phase, and its screen states (Taxila)

**Date:** 2026-10-02 · **Scope:** the 30-45 minute live voice lesson (web + Android, portrait 360 × 800 dp budget phones, shared family phones, patchy data, Hindi / Hinglish / English) for Classes 1-9, plus a 10-minute micro-session for 6-year-olds.
**Question:** What is the phase sequence of a lesson (warm-up with memory callback and spaced retrieval, goal setting with choice, short teaching turns with modules, covert probes, game-wrapped practice, teach-back to a protégé, wrap-up with preview and parent note)? How does each phase map to the four screen regions (teacher stage, module canvas, whiteboard strip, mic/control bar) and to the four-state status rule (listening, thinking, speaking, your turn)?
**Builds on (read first, not repeated):** `docs/research/learning-science.md` (§6 rules 1-38, §7 probe catalogue P1-P24, §7.2 fusion rules), `docs/harvest/gurukul.md` §4.7 (NEVER MANIPULATE) and §6 (4-state rule, one ember, honest waits, copy gate), `docs/research/design/kids-ux-ages.md` (bands B1-B4, tokens, S2/S3 stages, components), `docs/research/design/parent-experience.md` (pakka vs aa gaya, Kaise pata?, ≤2 messages/week), `docs/research/voice/indian-teacher-discourse.md` (move set, DL1-DL12, caps), `docs/ARCHITECTURE.md` (Director, ModuleHost, Stage), `context/decisions.md#voice-turn-config`.

**Evidence tags:** **[V]** read this session in the primary source or its abstract (Europe PMC / ERIC records, the paper, the curriculum PDF, the product's own page) · **[S]** secondary only · **[M]** prior knowledge, not re-checked · **[T]** measured in Taxila's own `context/measurements.md` · **[I]** design inference by this document; each [I] that matters has a named measurement in §13.

**Method and limits.** This session's web-search budget was already spent by sibling workstreams, so literature was found through the Europe PMC and ERIC APIs and direct fetches (Rosenshine 2012 full text; NCF-FS 2022 full PDF, 360 pp, grepped; Clark et al. 2016 full text from PMC; abstracts for the rest; four product pages). **No source studies a 30-45 minute voice lesson with an AI teacher for Indian children.** Phase durations below are design hypotheses anchored to two real lesson models (Rosenshine's 40-minute period, NCF-FS's 60-minute maths Four Blocks) and must be replaced by measured values (§13).

---

## 0. The answer in fourteen lines

1. **The arc is the evidence pipeline.** Mastery needs (a) an independent correct attempt, (b) a generative or transfer probe, and (c) delayed retrieval in a later session (learning-science rule 2). Each lesson produces (a)+(b) for today's concept and (c) for earlier ones. Warm-up is where "aa gaya" becomes "pakka" for the parent.
2. **Eight phases, run by the Director as a state machine with min/max durations, never a timetable:** P0 arrive · P1 warm-up · P2 goal + choice · P3 teach · (break) · P5 practice · P6 teach-back · P7 wrap. Covert probes (P4) are not a phase; they are embedded in P1, P2, P3, P5, P6 (§6).
3. **Two real lesson models agree on the shape.** Rosenshine: begin with short review (8 min/day in an elementary maths experiment), small steps with practice after each, about 80% success [V]. NCF-FS maths Four Blocks: oral warm-up 5-10 min, skills teaching 20-25, practice 15, game 15 [V]. Taxila's 30-minute arc is that shape, compressed (§2).
4. **Four screen regions, five layout modes** (Face, Teach, Canvas, Duo, Close). One region is dominant per phase; the others shrink but never disappear (§3).
5. **Four states describe who holds the floor.** YOUR TURN (floor handed over, nothing started) → LISTENING (child has started) → THINKING (child finished, teacher composing; typically ~2.1-2.4 s [T]) → SPEAKING (her audio playing). Derived from voice and module events, never from literals. **The `turn` ring exists only in YOUR TURN, on exactly one element** (§4).
6. **B1-B2 use tap-to-talk with a single tap that auto-closes at the endpoint, never hold-to-talk**, because long-press is banned for B1-B2 (kids-ux row 6). Tapping the mic while she speaks is the young child's barge-in.
7. **Warm-up = one real memory callback + 2-4 due retrieval items**, easiest-predicted first, feedback after each (prequestion and retrieval benefits rise with feedback [V]). A failed prerequisite re-plans the lesson (TaRL backward chaining); it does not turn the warm-up into a re-teach.
8. **Goal setting gives the child 2-4 cheap choices across the lesson** (Patall 2008: strongest with 2-4 successive choices, stronger for children [V]), co-sets a proximal goal (Schunk 1985 [V]), announces the teach-back (expectancy g ≈ 0.48 vs −0.02 [S]) and asks one prediction about the core idea (prequestions g = 0.66 for the targeted content [V]).
9. **Teaching runs in micro-cycles:** one idea ≤ band word cap → a hand-over that is not always a question (DL7) → the module changes on her words. Modules appear on the first audio frame of the turn that names them, not before [I].
10. **Practice is game-wrapped only when the game action *is* the skill** (intrinsic integration: more learning in fixed time and longer engagement, n = 58 [V]). The same wrapper returns across lessons, because games beat non-game instruction over multiple sessions but not in single ones [V]. Adaptive item choice holds rolling success near 80% [V]. No points, coins, unlocks.
11. **Teach-back is to a protégé character the child picks and names, who is obviously not a real child** (no fake peers, kids-ux row 19). It speaks only pre-rendered kit lines, asks one naive follow-up that carries the item's most likely misconception, and is "new to this", which helped low-self-efficacy children (n = 166 [V]).
12. **Wrap-up ends on a real success item, re-voices the child's own explanation, and previews the next topic plainly.** No cliffhanger, no "come back tomorrow"; if the child says they are going, the lesson ends that turn (gurukul §4.7).
13. **The parent note is an in-app lesson card, not a push.** Parent messages are capped at ≤2/week (parent-experience §0.6). The card states actions, not minutes, and shows "pakka" only after a delayed re-check.
14. **The 10-minute micro-session for 6-year-olds** keeps every phase in miniature: 2 retrieval items, 2 picture choices, 3-4 concrete teaching cycles, a 30-second movement moment, 4-6 blocked game items, and a choose-or-fix teach-back. NCF-FS stages D/E "sustain engagement with a task" for ~20 / ~30 min and attend to adult-initiated tasks [V]; 10 minutes leaves headroom for a bad day (§10).

---

## 1. Evidence the arc rests on (what each source studied, what transfers)

| source | studied | what Taxila takes | tag |
|---|---|---|---|
| Rosenshine 2012, *Principles of Instruction* (American Educator) | synthesis of process-product, cognitive-science and cognitive-support research | the 10 principles; daily review ("spend eight minutes every day on review" in a successful elementary maths experiment); small steps with practice after each; the most effective maths teachers spent ~23 of 40 minutes presenting and guiding, the least effective 11, and asked only nine questions in a period; Grade 4 success 82% (best teachers) vs 73%; "optimal success rate … about 80 percent" | [V] |
| NCERT, *NCF for Foundational Stage* 2022 | national curriculum, ages 3-8 | maths **Four Blocks**: oral math talk 5-10 min "as a warm-up", skills teaching 20-25 (Gradual Release of Responsibility: I do, we do, you do), skills practice 15, math game 15; "physical activity at regular intervals … helps to increase children's attention span"; Table 65 (C-13.1) stages D/E "sustain engagement with a task" ~20 / ~30 min; stages "approximately map to an age group" but are not tied to one | [V] |
| Patall, Cooper & Robinson 2008, *Psych. Bull.* | meta-analysis, 41 studies | choice raised intrinsic motivation, effort, performance and perceived competence; strongest with 2-4 successive choices; stronger for children than adults; instructionally irrelevant choices worked best | [V] |
| Schunk 1985, *J. Special Education* | 30 Grade 6 children with maths difficulties | children who *participated* in setting proximal goals beat assigned-goal and no-goal groups on self-efficacy and subtraction skill | [V] |
| King-Shepard et al. 2025, *Educ. Psych. Rev.*; Motz et al. 2026 (ManyClasses 2), *J. Educ. Psych.* | prequestion meta-analysis; 30 classes, n = 1,571, Grade 6 to college | prequestions help the prequestioned content (g = 0.66), not other content (g = 0.01), and more with feedback; delayed learning improved, but some students disengaged and the benefit was rich-get-richer | [V] |
| Habgood & Ainsworth 2011, *J. Learning Sciences* | Zombie Division, 58 children | the intrinsically integrated version produced more learning under fixed time limits, and children engaged with it significantly longer than with extrinsic variants | [V] abstract |
| Clark, Tanner-Smith & Killingsworth 2016, *RER* (PMC4748544) | K-16 game meta-analysis | games vs non-game d = 0.33; augmented vs standard designs d = 0.34; **multiple play sessions beat controls, single sessions did not**; enhanced scaffolding g = 0.41; schematic visuals beat realistic (b = 0.45, attenuated after controls) | [V] |
| Chase et al. 2009; Pareto 2014; Tärning et al. 2019; Pareto, Ekström & Serholt 2022 | teachable agents: Grades 5 and 8; 443 children Grades 2-8 over 3 months; 166 aged 10-11; robot vs younger-child tutees | more effort for the agent than for self, largest for lower achievers; significant gains in a 3-month classroom game, younger children could tutor; a low-self-efficacy agent produced better performance and raised low-SE children's self-efficacy; a robot tutee drew more mathematical language and challenging questions | [V] abstracts |
| Rowe 1972/1986 (ERIC) | teacher wait time, elementary science | extending wait time from about 1 s to 3-5 s increased response length, confidence, questions and participation by slower students | [V] abstracts |
| Mahar et al. 2006, *MSSE*; Mahar 2011 review | classroom activity breaks | on-task behaviour +8% (ES 0.60), +20% in the least on-task children; curriculum-linked bouts +8.3% vs −3.1% | [V] abstracts |
| Vlach & Sandhofer 2012, *Child Dev.*; Vlach, Sandhofer & Bjork 2014 | ages 5-7, n = 36; categorisation | spaced lessons beat massed ones for generalisation; expanding schedules beat equal spacing at 24 h | [V] abstracts |
| Bradbury 2016, *Adv. Physiol. Educ.* | review of the "10-minute attention span" | "the available primary data do not support" a 10-15 min limit; variability is mostly between teachers | [V] |
| Finn 2010, *JEP:LMC* | adding a less effortful end to study | the longer session with an easier end was remembered as better and chosen again, although the shorter one scored higher | [V] abstract |
| Castro-Alonso et al. 2021; Noetel et al. 2022; Schroeder et al. 2013 | pedagogical-agent meta-analyses | agents give small gains (g = 0.20); 2D agents (g = 0.38) beat 3D (g = 0.11); agents help more in system-paced settings; K-12 benefit more than post-secondary | [V] abstracts |
| Wilson et al. 2019, *Nat. Commun.* | optimal training difficulty in learning models | ~85% training accuracy optimal for gradient learners; convergent with Rosenshine's 80%, not a classroom result | [V] |
| Third Space Learning, Skye (UK, Years 3-11) | product page | voice + shared screen; "at the start of each lesson, Skye will start with a short formative assessment and adapt"; after 3 wrong answers it talks the pupil through; teachers get a log of every session | [V] page |
| Duolingo Max, Video Call with Lily | product blog | calls last about a minute early in a course, up to 3 minutes later; the character opens the call; no grammar correction during the call; hang up any time | [V] page |
| Synthesis Tutor (5-11), Ello (4-9) | product pages | read-aloud under 7, on-screen manipulatives, micro-assessments, advance only on mastery (Synthesis); real-time listening, daily parent report (Ello). Neither page shows independent outcome data | [V] pages |

**What none of these settle:** total lesson length for an AI voice lesson, the right thinking-gap tolerance for children, and whether a game wrapper beats plain items on *delayed* outcomes in Taxila's formats. Those are measured in §13.

---

## 2. The arc at a glance

Durations are **starting targets**; the Director moves on when the phase's exit condition is met, or at its max, whichever comes first.

| phase | job | 30-min (B2-B4) | 45-min (B3-B4) | 10-min micro (B1) | exit condition | evidence produced |
|---|---|---|---|---|---|---|
| P0 Arrive | identity, audio, disclosure | 0:00-0:45 | 0:00-1:00 | 0:00-0:30 | first usable child utterance or tap | none (audio level, ASR baseline) |
| P1 Warm-up | memory callback + 2-4 due retrieval items | 0:45-4:30 | 1:00-6:00 | 0:30-2:00 (2 items) | all due items attempted, or max 6 min | P10 delayed retrieval, P11 gist (older) |
| P2 Goal + choice | goal as capability, choices, expectancy, one prediction | 4:30-6:00 | 6:00-8:00 | 2:00-2:30 | prediction logged | P5 prior model |
| P3 Teach | GRR "I do / we do" in micro-cycles, modules appear | 6:00-15:00 | 8:00-17:00 (concept A) | 2:30-5:30 | guided attempts succeed on 2 in a row, or ladder exhausted → re-plan | P2, P3, P8, P14, P15, P23 |
| Break | movement or stretch | ~12:00, required B1-B2 | ~17:00, offered to all | 5:30-6:00 | 30-60 s | none |
| P5 Practice | "you do" in a game wrapper, interleaved later | 15:00-24:00 | 17:00-35:00 (A, then extension A′ with its own short teach) | 6:00-8:30 (4-6 items) | target count reached in the success band, or max | P15, P9, P6, P12, P21, P22 |
| P6 Teach-back | child teaches the protégé | 24:00-27:30 | 35:00-40:00 | 8:30-9:30 | protégé's follow-up answered | P1 (highest value) |
| P7 Wrap | real success item, re-voice, plain preview, parent note | 27:30-30:00 | 40:00-45:00 | 9:30-10:00 | goodbye | none scored; seeds next P11 |

- **Proportions check:** in the 30-minute arc, teaching plus guided attempts take ~9 of 30 min and practice ~9. Rosenshine's best teachers spent ~23 of 40 min presenting and guiding [V], and NCF-FS gives 20-25 of 60 min to skills teaching [V]. Taxila's teaching share is lower because guidance continues inside practice (the hint ladder) and the one-to-one format removes class management [I].
- **The 45-minute arc adds a second small step (A′), not a longer lecture.** Small steps with practice after each is the principle [V]; a 45-minute lesson that stretched P3 would break the band's spoken-turn caps and the transient-information limit (learning-science rule 17).
- **Who picks 30 vs 45:** the parent sets the cap (kids-ux row 21); the Director chooses the arc that fits. B1 defaults to the micro-session; B2 to 30 minutes; B3-B4 to 30 or 45.

---

## 3. The screen: four regions, five layout modes

**Regions (portrait, top to bottom):**
- **Teacher stage**: the illustrated 2D teacher (2D agents beat 3D, g = 0.38 vs 0.11 [V]), whose body carries status (§4). Karaoke caption line sits directly under her (kids-ux row 4).
- **Whiteboard strip**: the *persistent* anchor of the current idea, unlike captions, which are transient. It holds 1-3 chips: a symbol, number, term or tiny picture, in the school medium's script (DL2), newest on the right. Tapping a chip replays her line about it from the client's own audio buffer (teacher audio only; child audio is never stored). Height 72 dp (B1-B2) / 56 dp (B3-B4). Labels follow kids-ux type tokens. It survives turns and carries over from P3 into P5. It clears at P1→P2 and P6→P7.
- **Module canvas**: the sandboxed engine (ARCHITECTURE §1.4). Frozen and desaturated while she speaks in B1-B2 (Sesame "freeze hot spots", kids-ux row 8); live when it holds the ring.
- **Control bar**: mic (kids-ux `mic.size`), answer tiles when the hand-over is a choice, and, for B3-B4, the chips `Hint` · `Show me why` · `I know this` plus the quiet-mode toggle. Home and pause sit top-left and top-right with the progress path (kids-ux S2/S3).

**Layout modes** (share of the 800 dp height after system insets; Young = B1-B2, Older = B3-B4):

| mode | used in | teacher | whiteboard | module | control bar |
|---|---|---|---|---|---|
| **L1 Face** | P0, P2 choices, break | 55% / 45% | hidden | hidden or choice cards | mic + choice cards |
| **L2 Teach** | P1, P3 explaining | 40% / 30% | shown | 35% / 45% (anchor or demo) | mic, tiles when choosing |
| **L3 Canvas** | P3 attempts, P5 practice | 28% band / 96 dp picture-in-picture | shown | 55% / 65% | mic (+ chips for Older) |
| **L4 Duo** | P6 teach-back | 22% side panel | shown (the anchor stays) | 30% "show me" area | mic |
| **L5 Close** | P7 | 35% | hidden | summary card (what they made) | one large next/finish tile |

- Young bands never drop the teacher below ~28%, because under-6s and early primary children need exaggerated, visible feedback from the character (NN/g via kids-ux §2) [V]. Older bands get picture-in-picture, as in kids-ux S3.
- Transitions: transform/opacity only, `motion.enter` 240 ms / `exit` 160 ms (B1-B2), `prefers-reduced-motion` → 1 ms (gurukul §6.2). A layout change is a **Director output applied at the start of her next audio**, so the screen changes as she names the thing [I; temporal contiguity, M].
- Low-end devices: the module iframe for P3/P5 is pre-mounted hidden during P2. Images are requested at P2, because generation took 23 s [T] and can never sit on a spoken turn's critical path.

```
L2 Teach, Young (B2, 360 × 800)          L3 Canvas, Older (B3, practice)
┌──────────────────────────────┐          ┌──────────────────────────────┐
│ ⌂            ●●○○○       (⏸) │          │ ←  Fractions · compare  ●●●○ │
│ ┌──────────────────────────┐ │          │ ┌──────────────────────────┐ │
│ │  TEACHER 40%             │ │          │ │ MODULE 65%       ┌─────┐ │ │
│ │  body = status           │ │          │ │ roti-cutter game │ PiP │ │ │
│ └──────────────────────────┘ │          │ │ (ringed: try it) └─────┘ │ │
│  ▌आधा ▌रोटी ▌...  (karaoke)  │          │ └──────────────────────────┘ │
│ [ ½ ] [ 🍕½ ]   whiteboard   │          │ [ 1/3 ] [ 1/4 ]  whiteboard  │
│ ┌──────────────────────────┐ │          │ CC  captions (off for R2)    │
│ │ MODULE / ANCHOR 35%      │ │          │ [Hint] [Show me why] [I know]│
│ │ (frozen while she talks) │ │          │ ┌──────────────────┐  (🎤)   │
│ └──────────────────────────┘ │          │ │ type or speak…   │  ⌨/🔇   │
│  ┌──────────┐  ┌──────────┐  │          │ └──────────────────┘         │
│  │ tile ≥96 │  │ tile ≥96 │  │          └──────────────────────────────┘
│  └──────────┘  └──────────┘  │
│           ( 🎤 88 )          │   ring on the tiles OR the mic, never both
└──────────────────────────────┘
```

---

## 4. The four-state status rule inside a lesson

**The floor model:** at any moment either the system holds the floor (THINKING, SPEAKING) or the child does (YOUR TURN, LISTENING). Exactly one state is shown. Pause, offline and system error are **overlays outside the four states**; only a system error uses the `stop` token, and a wrong answer never does (kids-ux §4.3).

| state | meaning | entered on (event, never a literal or timer) | teacher body | mic | ring | sound | module / tiles |
|---|---|---|---|---|---|---|---|
| **YOUR TURN** | floor handed over, child has not started | her playback ended on a turn whose `handover` ≠ `chain` | leans in, open face, gaze at the ringed element | open (Older) / armed for tap (Young) | **`turn` marigold + `turn-ring`, on exactly one element**: mic (question, cued slot, invite-to-ask), tiles (choice) or module frame (try-this) | soft transition earcon (Young) | live |
| **LISTENING** | child has started | `input_audio_buffer.speech_started`, or pointer-down on the ringed element | nods, small listening loop | `listen` sky pulse driven by input level | **removed** (the turn is being used) | none | live (Older); the touched tile shows pointer-down feedback ≤100 ms |
| **THINKING** | child finished, teacher composing | VAD endpoint/commit, or an answer committed in a module | eyes up, hand to chin; no spinner | closed (Young) / open for barge (Older) | none | none | inert; a local "received" tick may show, **never a verdict before her turn** (gurukul §6.2) |
| **SPEAKING** | her audio is playing | first audio frame *played on device*, not first byte received | mouth on the playback clock (companion-tech) | Young: closed, but the mic is tappable to interrupt; Older: open, barge-in on | none | her voice | frozen (Young) / visible, not interactive unless she demos (Older) |

**Rules (each becomes a gate in §13):**
1. **One ring, only in YOUR TURN.** The Director's `handover` field picks the ring target; the client renders it. `chain` (she continues) → THINKING, no ring. A statement she expects a reaction to is a YOUR TURN on the mic, never an ambiguous idle screen.
2. **Status comes from events.** Realtime events (`speech_started`, endpoint, first played audio frame, playback end) and module events (`answer`, `goal_met`) drive the machine. Timers only escalate *inside* YOUR TURN.
3. **THINKING is usually ~2.1-2.4 s** (endpoint ~0.9 s + model ~0.9-1.5 s [T], US container, not yet from India). This falls in the gurukul honest-wait band "1-4 s: thinking pose, not a spinner". Past 4 s: Young sees a "one moment" visual with a soft earcon; Older sees a named phase. Past 8 s with no audio, the client offers the cached offline card for the current item (kids-ux S5).
4. **Escalation inside YOUR TURN** uses kids-ux tokens: glow at 4 s (B1-B2) / 6 s (B3-B4), then a verbal re-entry that *narrows* (PROBE → CHOICE), never repeats louder and never names the silence (DL, discourse §3.4). kids-ux sets the re-prompt at 8-10 s; discourse proposes 5-6 s; Rowe's 3-5 s wait-time gains [V] say the floor must be at least ~4 s. **This doc uses glow 4 s → re-entry 8 s → tap options at ~15 s for B1-B2** and records the disagreement for M-UX-4.
5. **Barge-in:** Older open mic: SPEAKING → LISTENING on `speech_started` (measured 7-260 ms cancel [T]). Young tap-to-talk: a tap on the mic during SPEAKING stops her and enters LISTENING. **Single tap opens and the 900 ms endpoint closes**; hold-to-talk is a long-press and is banned for B1-B2.
6. **Module-local feedback is independent of status.** A drag snaps and a tile depresses at pointer-down in every state where the element is live. Correctness is revealed only in her next turn, or by the engine's concept-shaped payoff after commit.
7. **Young: no words for status** (body, ring, earcon). **Older: an optional one-word label** beside the mic (kids-ux row 17). Parent-facing replays label all four states in words (gurukul "each state has a word").

---

## 5. Phases in detail

Each phase lists: **why** (evidence) · **Director** (moves from discourse §3.1; structure in code per learning-science rule 14) · **screen** · **status flow** · **band differences** · **failure paths**.

### P0 Arrive (30-60 s)
- **Why:** identity is by child id, never device (ARCHITECTURE §3); a sibling on the wrong profile corrupts evidence (kids-ux S1).
- **Director:** OPEN with the name; the fixed band disclosure copy on the first sessions and whenever asked (never improvised, kids-ux §7). No mood question and no stored affect (learning-science rule 9). At most one rapport turn.
- **Screen:** L1 Face; progress path shows today's 3-5 stones (Young) or the skill name (Older).
- **Status:** SPEAKING → YOUR TURN (ring on mic) → LISTENING. The first utterance doubles as the audio-level and ASR-confidence baseline. It is **not** evidence.
- **Failure:** low ASR confidence on the first two utterances → the session switches to tap-first answers (mic still offered) and a note goes to the parent card. The child is never told they were not understood twice (kids-ux S4).

### P1 Warm-up: memory callback + 2-4 spaced retrieval items (3-6 min)
- **Why:** daily review opens effective lessons (Rosenshine, 8 min [V]); NCF-FS oral math talk 5-10 min [V]; Skye opens every lesson with a short formative check [V]; delayed retrieval (P10) is the highest-validity probe and the calibration target (learning-science §7.2.6); spacing helps 5-7-year-olds generalise [V].
- **Director:**
  - **Callback**: one *real*, cited last-session fact (a thing they made or said). If memory consent is off, the callback is only to lesson content. Never fabricated; never about absence ("THEIR ABSENCE IS NEVER A SUBJECT", gurukul §4.7).
  - **Items**: 2-4 due items from the expanding-interval scheduler (learning-science rule 18). Order: highest predicted recall first, then most overdue. Formats vary across items (spoken, tile, mini-module), but each item keeps its tested format so the delayed result compares like with like.
  - **Feedback** after each attempt. Retrieval and prequestion gains rise with feedback [V]. One REPAIR, then TELL plainly (DL8); no full hint ladder here.
  - **Older bands**: one P11 "big idea of last time in a few words". The delayed gist is diagnostic; an immediate one is not (Thiede, learning-science §1.9).
  - **Prerequisite rule**: if a failed item is a prerequisite of today's goal, the Director re-plans P3 to that prerequisite (TaRL backward chaining, rule 28) and says so plainly. Otherwise the miss only shortens that item's interval.
  - **Identity check**: "I didn't do that" → possible profile mix-up, asked once (kids-ux S1).
- **Screen:** L2 Teach; the item's anchor goes on the whiteboard strip; ring on tiles or mic per item.
- **Status:** cycles of SPEAKING → YOUR TURN → LISTENING → THINKING, one cycle per item, ~45-75 s each.
- **Band:** B1-B2 picture tiles first, 2 items; B3-B4 up to 4 items including one interleaved "which method?" (P9).
- **Failure:** if the child gets all items wrong, the scheduler's intervals are too long or the child is having a bad day. The Director drops to an easier P3 plan and lowers today's target, never comments on it. The parent card states the facts.

### P2 Goal setting with choice (60-120 s)
- **Why:** choice raises motivation and performance, most with 2-4 successive choices and most for children [V]; participating in setting a proximal goal beats an assigned one [V]; teaching expectancy must be set *before* learning (Kobayashi [S]); a prediction on the core idea primes exactly that content (g = 0.66 [V]).
- **Director:**
  - **Goal as capability** in the child's terms ("by the end you can …" shape), drawn from the plan. The *content* is not negotiable; choices are among cheap, real options (learning-science rule 26).
  - **Choice points (2-4 across the whole lesson, not per screen):** context skin from interest tags (cricket, kitchen, market, trains); protégé (first lesson only, then it persists); for B3-B4, sub-goal order and pace ("quick" / "go deeper"). Options per choice: 2 (B1), 3 (B2), 3-4 (B3-B4) (kids-ux `choices.max`). Each choice is logged as a preference, never as evidence (kids-ux `ChoiceOffer`).
  - **Proximal target, Older only:** the child picks how many game rounds to try (e.g. 5 or 8). Young children get the path of stones instead of a number.
  - **Expectancy:** the protégé peeks in, and the teacher says it will learn this from the child at the end.
  - **One prediction** (PROBE or CHOICE): it is logged as a prior-model row (P5), not graded, and answered with "let's find out", never a verdict. It **must** be resolved explicitly in P3 (Brod: younger and low-EF children need explicit resolution, rule 5). ManyClasses 2 saw disengagement [V], so it is one quick item, in choice format for B1-B2.
  - **"I know this" (B3-B4)** runs a 1-2 item check (kids-ux S3): pass → jump to A′ or P5; fail → carry on, no shame.
- **Screen:** L1 Face with `ChoiceOffer` cards (picture-first for Young); the module pre-mounts hidden.
- **Status:** YOUR TURN rings the **cards** (not the mic) for each choice; the mic still accepts a spoken pick.

### P3 Teach in short turns, modules appearing (8-15 min per concept)
- **Why:** small steps with practice after each, many questions, check understanding by what students produce (Rosenshine [V]); I do → we do → you do (NCF-FS [V]); guidance depends on prior knowledge (rule 16); spoken information is transient, so anchor it visually (rule 17).
- **Director, the micro-cycle (repeat 4-8 times):**
  1. FRAME with a concrete object from the child's world → EXPLAIN one idea within the band's word cap (`speech.turn.maxWords` 15 / 20 / 30 / 40; enforced last-line, measured 25 words/turn on gpt-realtime-2.1 [T]). One new term at most, GLOSSed once.
  2. The module changes **on her words**: concrete → pictorial → symbolic as successive engine states (concreteness fading, rule 19). The symbol lands on the whiteboard strip.
  3. A hand-over that is not always a question (DL7): TRY-THIS on the module, CHOICE, CUED-SLOT (Young), PROBE, or an invitation to ask. At most 2 closed display questions in a row; an open or child-initiated turn about every 4 exchanges (discourse §3.3).
  4. Uptake on the child's words (DL5), then the next micro-step.
- **Guidance ladder:** novice: worked example → faded example → guided attempt; experienced: attempt first, then instruction that builds on the attempt (productive failure with fidelity, learning-science §3.4). The position comes from the learner model, not from the model's whim.
- **Resolve the P2 prediction** at the moment the module shows the outcome: "what you thought / what happened / why", spoken and drawn.
- **Embedded probes:** see §6. "Samjha?" is rapport only and never precedes a mastery update (DL4).
- **Hint ladder:** pump → hint → prompt → assertion, then an isomorphic item the child must solve (rule 15). After 2-3 failed ladder steps, or wheel-spinning (no 3-in-a-row in ~10 opportunities), the Director changes representation or drops to the prerequisite (rule 10).
- **Exit:** two consecutive correct guided attempts with at most one hint → P5. Ladder exhausted twice → re-plan (prerequisite or a different engine), never "one more of the same".
- **Screen:** L2 while explaining; L3 for attempts. The module freezes while she speaks (Young). Her gaze and hand point at the canvas region she is talking about.
- **Status:** mostly SPEAKING ↔ YOUR TURN (ring on the module for TRY-THIS). Turns stay short, so no SPEAKING span runs past ~10 s for Young or ~15 s for Older [I, from caps].

### Break (30-60 s)
- **Why:** curriculum-linked activity bouts raised on-task behaviour, most in the least on-task children [V]; NCF-FS asks for physical activity at regular intervals [V]. There is no evidence for a fixed attention limit [V], so the break is placed by plan and by behaviour.
- **Design:** B1-B2: required once in any lesson ≥ 20 min, around the P3→P5 boundary, and pulled earlier by dialogue-observable fatigue (pata-nahi loops, minimal answers, gaming signs; never acoustic emotion). The teacher demonstrates a curriculum-linked movement (jump the count, clap the pattern). B3-B4: offered (stretch, water), skippable, never forced or mocked.
- **Screen:** L1 Face with a full-width movement picture. The mic is closed and **no evidence is recorded**.
- **Status:** SPEAKING (demo) → YOUR TURN on a single large "ready" tile → back into the arc.

### P5 Practice with game wrappers (8-12 min; 45-min arc: two blocks)
- **Why:** intrinsic integration [V]; games pay off over multiple sessions, not single ones [V]; enhanced, adaptive scaffolding g = 0.41 [V]; about 80% success during practice [V]; interleaving once the basic skill is acquired (Rohrer, rule 18).
- **Director:**
  - Uses the **same wrapper family the child saw before** for that skill (familiar shell, new items), skinned by the P2 context choice.
  - **Success band:** adaptive item choice holds a rolling success rate of 75-85% for B3-B4 and 80-90% for B1-B2 [I; Rosenshine 80% V, measure M-ARC-3]. Above the band → harder variant or near-transfer; below → easier item plus a hint.
  - **Blocked first, then mixed:** 3 blocked items, then interleave 1-2 earlier skills for B3-B4, mildly for B2, not at all in B1 first exposure (learning-science §3.5).
  - **Teacher speaks less:** she watches the canvas (gaze down), reacts at commit, and NAME-STEPs the specific move (DL6). At most one praise token per 5 turns.
  - **FLIP inside the game** (after basic mastery only, ≤1 per lesson, always resolved): the teacher "takes a turn" with a planted misconception-typed error and the child checks it. A child who misses it gets the correction before moving on (rule 6).
  - **Confidence bet (B3-B4, learning move):** "a little sure / very sure" chips before feedback on some items (hypercorrection, learning-science §1.9). Not used as evidence below age 10.
  - **Gaming detector:** rapid taps or option cycling discount that window's evidence and slow the pace (rule 4 of §7.2).
- **Payoff:** concept-shaped and immediate (the roti is shared equally, the train couples at the right place value), then on to the next item. **No points, coins, unlocks, combo counters or timers on items.** Progress is the path of stones.
- **Screen:** L3 Canvas; ring on the module frame; the hint chip (B3-B4) or a teacher-offered hint after timeout (B1-B2).

**Wrapper catalogue (where the game action is the skill):**

| skill family | wrapper | the action that is the learning | evidence emitted |
|---|---|---|---|
| fractions, equal sharing | roti / laddoo cutter | cut into *equal* parts, give each plate its share | partition equality, unit-fraction choice |
| number line, add/subtract | frog or auto-rickshaw jumps | choose the jump size and count, land on the answer | strategy (count-on vs jump-by-10), landing error size |
| place value | train couplings (ones / tens / hundreds wagons) | load wagons, couple 10 ones into a ten | regrouping step correctness |
| money, decimals | kirana shop | pay exact amounts, give change | change calculation, decimal alignment |
| classification (science) | kabadiwala sorting yard | sort by the property the lesson taught | which property drove the sort (misconception ID) |
| cause and effect (science) | predict-then-run simulation | commit a prediction, then run it | P5 prediction + explanation of the difference |

Each wrapper must also run **without** its skin (plain items, same engine), so the format-efficacy layer can A/B it on delayed outcomes once that layer is cleared legally (ARCHITECTURE §1.3; M-ARC-6).

### P6 Teach-back to the protégé (2-4 min)
- **Why:** learning by teaching, with expectancy set earlier (Kobayashi [S]; Chase [V]: largest for lower achievers); the explanation is the richest single covert probe (P1). A low-self-efficacy agent helped [V]. A robot tutee drew more mathematical language [V].
- **The protégé (character contract):**
  - Chosen by the child from 3 designs at first use and named by the child. It persists across lessons and subjects. It is an obviously fictional creature or little robot, **never presented as a classmate or a real child** (no fake peers), never claims feelings, never competes with the child.
  - **"New to this", not helpless:** it says it hasn't learned this yet and tries after being taught. It never models giving up.
  - **Speaks only pre-rendered lines from the kit** (2-4 naive questions per concept, each tied to a catalogued misconception, plus thanks shapes): a distinct timbre from the teacher, generated offline, shipped in the lesson pack, so it works offline and cannot improvise. The realtime session keeps one voice [I; inference that mid-session voice switching is not available, verify].
  - Its thanks restate the *content* the child taught; it never grades.
- **Flow:** the protégé asks how to do the thing → the child explains (voice) **or shows** on the module while talking (representation translation P14, which protects language-weak children from the fluency confound in P1) → the protégé asks one naive follow-up carrying the item's most likely misconception (e.g. "4 is bigger than 3, so a quarter is bigger?" as a *shape*) → the child resolves it → the teacher closes: NAME-STEP on what the child got right and a plain correction of anything wrong that the child taught (no false fact left standing).
- **Scaffolding by band:** B1-B2 choose-or-complete (the protégé shows two attempts and asks which is right and why, or the child finishes the protégé's sentence) (Rittle-Johnson; Brod: open explanation is weak before ~age 9). B3-B4: open explanation, then the follow-up. If stuck for one re-entry, the teacher offers a sentence starter, never the answer.
- **Grading:** a classifier against the item's expectation list and misconception list (AutoTutor EMT, rule 4). Low ASR confidence = no evidence (fusion rule 3). Never a free "was this good?" judgment.
- **Screen:** L4 Duo, with the protégé centre-stage and the teacher reduced to a listening side panel. The anchor stays on the whiteboard; the "show me" area is live.
- **Status:** the protégé's clip plays as SPEAKING; then YOUR TURN on the mic (or module frame for "show"). The teacher's body stays in listening pose throughout the child's explanation.

### P7 Wrap-up, preview, parent note (1-2 min; skippable to one turn)
- **Why:** a less effortful end changes how a study session is remembered and whether it is chosen again (Finn 2010 [V], adults); an immediate summary is a weak probe but a good cue for the next delayed one (Thiede); NEVER MANIPULATE bans suspense hooks and holding at goodbye (gurukul §4.7).
- **Director:**
  1. **One real success item** chosen from the child's consolidated skills (high predicted success). It is a real item, never a rigged one; if missed, it is handled like any other item.
  2. **CLOSE:** what we did, re-voiced in the child's own words from the teach-back (discourse CLOSE shape). It is not a "what did you learn?" interrogation. Keywords are stored as the cue for next lesson's P11.
  3. **Capability line, only where the evidence allows:** "aa gaya today" for a concept with (a)+(b); "pakka" never on the same day (parent-experience §0.4).
  4. **Preview, stated plainly:** the next topic named and why it connects. B3-B4 pick next from 3 (kids-ux S6). No question left hanging, no "you'll find out…" shapes. The prequestion for that topic is asked at the *start* of the next lesson (P2), where the evidence says it works.
  5. **Outward relatedness (Young):** show the parent the thing you made (kids-ux S6). The phone hand-over card shows one picture and one line.
  6. **Goodbye:** brief, no "come back tomorrow", no streak, no counting.
- **Leaving early, any phase:** the moment the child says they are going, or taps home and confirms, the teacher gives one CLOSE turn and stops, even mid-derivation. Evidence so far is kept. The next lesson resumes through retrieval, never through "where we left off" suspense.
- **Screen:** L5 Close; one large finish tile.
- **Parent note** (generated by `/api/lesson/end`, shown in Parent corner → Lessons, never pushed per lesson):
  - date · minutes (secondary) · topic as syllabus outcome text, never a lower class label shown to the child;
  - 2-3 **action** facts (explained it in own words; fixed the teacher's planted mistake; tried again after a mistake ×3);
  - per-skill state in the parent vocabulary (Seekh rahi / Aa gaya / Pakka) with **Kaise pata?** opening the evidence sheet;
  - one child quote ≤ 25 words from the teach-back, subject to the visibility policy by age (parent-experience §12);
  - next re-check date; any ASR fallback noted plainly ("answered by tapping today; our listening had trouble");
  - written as if the child will read it (shared phone); safety items never appear here (separate alert path).

---

## 6. Covert probe schedule across the arc

Probe IDs are learning-science §7.1. Budget per 30-minute lesson (starting policy, fusion rule 5):

| phase | probes | count | notes |
|---|---|---|---|
| P1 | P10 delayed retrieval; P11 gist (B3-B4) | 2-4; 0-1 | the calibration truth for every other probe |
| P2 | P5 prediction | 1 | prior model only, never graded to the child |
| P3 | P2 why-after-correct (100% on the new concept; as CHOICE "because A or B?" for B1-B2); P3 near transfer ×1; P8 contrast or P14 translation ×1; P23 paraphrase before multi-step tasks | 3-5 | P2 is sampled at 30-50% once consolidating |
| P5 | P15 hint consumption, P16 self-correction, P21 wheel-spin, P22 gaming (passive); P9 which-method (interleaved, B3-B4); P6 FLIP ≤1 after mastery; P12 confidence bet (B3-B4, learning move) | passive + 1-2 | gaming discounts the window |
| P6 | P1 teach-back | 1 | the main end-of-concept probe |
| P7 | none scored | 0 | summary keywords seed next P11 |
| all | P18-P20 latency, disfluency, pata-nahi loops | passive, capped | tie-breakers and triggers only; normalised per child; low-ASR turns excluded |

- **The two "never" rows:** a yes to "samjha?" never updates mastery (DL4), and nothing is marked mastered within one lesson.
- **Probe cost check:** the 30-minute budget is about 8-12 elicited probes, roughly one every 2.5-4 minutes, inside the teaching rather than added to it [I]. M-ARC-1 watches for interrogation feel (shorter answers, more pata-nahi as probes accumulate).

---

## 7. Phase × screen × status map (the state table the client implements)

| phase | layout | dominant cycle | ring target(s) | mic mode Young / Older | whiteboard | captions |
|---|---|---|---|---|---|---|
| P0 | L1 | S → YT → L | mic | tap / open | hidden | on / per setting |
| P1 | L2 | (S → YT → L → T) × items | tiles or mic, per item | tap / open | item anchor | on / per setting |
| P2 | L1 | S → YT(cards) → L/T | choice cards | tap / open | hidden → goal chip | on |
| P3 explain | L2 | S → YT → L → T | mic or tiles | tap / open | accumulating symbols | on |
| P3 attempt | L3 | S → YT(module) → T | module frame | available, unringed | kept | on |
| Break | L1 | S → YT(ready tile) | one large tile | closed | kept | on |
| P5 | L3 | YT(module) → T → S(short) | module frame; hint chip is never ringed | available, unringed | kept | on (Young) |
| P6 | L4 | S(protégé clip) → YT → L → T | mic, or show-me area | tap / open | kept | on |
| P7 | L5 | S → YT(finish tile) | finish tile | tap / open | hidden | on |

S = SPEAKING, YT = YOUR TURN, L = LISTENING, T = THINKING. "Available, unringed": the mic accepts speech (Older open mic; Young tap) but the single ring is on the module, because the expected act is a touch.

---

## 8. Director and client contract additions

`/api/lesson/turn` already returns `{ instructions, moduleCommands[], ui }` (ARCHITECTURE §1.2). This arc needs `ui` to carry:

```
ui: {
  phase: 'P0'|'P1'|'P2'|'P3'|'BREAK'|'P5'|'P6'|'P7',   // set only by the Director
  layout: 'L1'|'L2'|'L3'|'L4'|'L5',
  handover: 'question'|'choice'|'try'|'cued'|'invite'|'chain',  // → ring target, client-computed
  whiteboard: [{ id, kind: 'symbol'|'term'|'number'|'picture', text, script, replayTurnId }],
  choices?: [{ id, picture, label, audio }],           // ≤ choices.max for the band
  protege?: { clipId, pose },                          // pre-rendered kit clip, never generated text
  apply: 'at_next_audio' | 'now',                      // layout/module changes sync to her first played frame
  budget: { phaseElapsed, phaseMax, lessonCap }        // the Director, not the client, decides to move on
}
```

- **Client owns:** the four-state machine (events → state), ring placement from `handover` + state, YOUR TURN escalation timers, pointer-down feedback, holdover guard, offline fallback card.
- **Director owns:** phase, layout, item choice, probe schedule, success-band control, break placement, early wrap. The model never decides phase or mastery (rule 14).
- **New components** (extend kids-ux §6): `PhaseRail` (stones / skill map), `LayoutStage` (L1-L5 with token-driven proportions), `WhiteboardStrip`, `ProtegeStage` (clip player + poses, distinct from `TeacherStage`), `BreakCard`, `WrapCard`, `ParentLessonCard` (parent surface, gurukul type scale with the 11 px floor).

---

## 9. Copy tone notes per phase (shapes, never lines)

> Anything sentence-shaped in a prompt gets recited (repo law). These are registers for the Director's move shapes and for reviewed UI strings, not text for `compile()`.

- **P0:** name + one warm token at most; the disclosure is fixed product copy.
- **P1:** callback names a *specific* thing the child did; items sound like a quick game between two people, not a test. No "let's revise" framing, no score.
- **P2:** goal said as what the child will be able to *do*; choices offered as real either/or (CHOICE shape); the teach-back announced as an honour, not a test.
- **P3:** FRAME before EXPLAIN; one idea per turn; the action word at the end of the sentence (Hindi verb-final helps, kids-ux row 2); GLOSS once per term.
- **Break:** playful and physical for Young; plain and optional for Older.
- **P5:** fewer words; NAME-STEP vs the child's own earlier attempt; mistakes are information about the step (DL8).
- **P6:** the teacher goes quiet; the protégé is curious and literal; the teacher's close names what the child taught.
- **P7:** re-voice the child's words; preview as a plain statement; goodbye short. Lexicon predicate bans suspense, absence, streak and urgency shapes (gate G-ARC-4).

---

## 10. The 10-minute micro-session (age 6, B1, Class 1)

**Why 10 minutes:** NCF-FS Table 65 puts "sustains engagement with a task" at ~20 min for stage D, the stage where children also begin attending to adult-initiated tasks; stages only approximately map to ages [V]. There is no fixed attention limit [V], but a 6-year-old on a phone at home has a worse day than a classroom child, so 10 minutes leaves room. Spaced short lessons beat massed ones for 5-7-year-olds' generalisation [V]. The duration is a starting point, not a finding (M-ARC-7). Duolingo's adult calls are 1-3 minutes [V], which shows how short a voice exchange can usefully be.

| clock | phase | what happens | screen | evidence |
|---|---|---|---|---|
| 0:00-0:30 | P0 | name, smile; tap-to-talk demonstrated by her, not explained (no tutorial, TIDRC #38) | L1 | none |
| 0:30-2:00 | P1 | one callback (the picture they made last time) + 2 due items as picture tiles or one spoken word | L2 | P10 ×2 |
| 2:00-2:30 | P2 | 2 picture choices (context skin); the protégé waves: "it will learn from you"; one 2-option prediction | L1 | P5 |
| 2:30-5:30 | P3 | 3-4 micro-cycles, ≤15 words each, concrete → picture (no symbols in first exposure for R0); CHOICE and CUED-SLOT hand-overs; one why as "because A or B?" | L2/L3 | P2 (choice), P14 |
| 5:30-6:00 | Break | body maths (jump the count), mic closed | L1 | none |
| 6:00-8:30 | P5 | one familiar wrapper, 4-6 blocked items, success band 80-90%, hint by the teacher after timeout | L3 | P15, P21 |
| 8:30-9:30 | P6 | choose-or-fix: the protégé shows two attempts, the child picks and says why (or fixes the protégé's one slip on the module) | L4 | P1 (scaffolded) |
| 9:30-10:00 | P7 | the thing they made, one-line re-voice, "show your parent" hand-over card, goodbye | L5 | none |

**Micro-session rules:**
- Hard stop at 12 minutes, even mid-item. A parent may allow 2 sessions a day, spaced at least ~2 hours apart [I, measure].
- Every instruction spoken *and* shown; no text-only anything; captions karaoke; tiles ≥112 dp (B1 `tile.answer.min`); the ring on one element; tiles inert while she talks.
- Probes are lighter: no FLIP, no confidence bets, no open "why", no interleaving on first exposure.
- Mastery logic is unchanged: today can only reach "aa gaya"; tomorrow's P1 decides "pakka".
- B2 children (8-9) default to 30 minutes but can be switched to two 15-minute halves (P0-P3 + P5-P7 the same day, with P1 re-run as a 1-item check) [I].

```
Micro-session, P3 (B1, 360 × 800)
┌──────────────────────────────┐
│ ⌂            ●●○○○       (⏸) │  5 stones = the whole session
│ ┌──────────────────────────┐ │
│ │  TEACHER 40%, points ↓   │ │
│ └──────────────────────────┘ │
│   ▌दो ▌लड्डू ▌...  karaoke    │
│  [ 🟠🟠 ]  whiteboard: one chip│
│ ┌──────────────────────────┐ │
│ │ MODULE: laddoos on plates│ │  frozen while she talks
│ └──────────────────────────┘ │
│  ┌───────────┐ ┌───────────┐ │  tiles ≥112 dp, picture only
│  │  🟠🟠      │ │  🟠🟠🟠    │ │
│  └───────────┘ └───────────┘ │
│           ( 🎤 96 )          │  single tap; endpoint closes it
└──────────────────────────────┘
```

---

## 11. Adaptive length, interruptions and degraded conditions

- **Fatigue and drift** (dialogue-observable only): 3+ minimal answers or pata-nahi loops in a row, or a gaming window → a smaller step or a CHOICE first, then the break, then an early wrap. The Director never extends a lesson to "finish the plan". Unfinished plan items return through the scheduler.
- **Offering more is banned; asking for more is allowed.** The teacher never offers "one more?" (an engagement nudge). If the child asks, the Director allows one extra practice item within the parent cap.
- **Network:** within a phase, a stall past 8 s switches to the cached offline card for the current item (kids-ux S5). A dropped call keeps the lesson state server-side, and rejoining resumes at the current phase's start with one recap turn. P1 items and the protégé clips are in the offline lesson pack.
- **Long sessions:** a 45-minute realtime call needs the session-rotation fix flagged in companion-tech ("rotation-amnesia gap before 30-60 min lessons"). The Director's child brief and lesson summary carry continuity across a rotation (ARCHITECTURE §1.1), and a rotation must land on a phase boundary [I].
- **Someone else answers** (a parent or sibling helping): speaker ID was rejected (hp-main-voice-surfaces). The teacher addresses the child by name and asks them to try (DL10: one addressee). Evidence in a window with suspected help is marked low-confidence rather than discarded. This is an open measurement problem (§14).

---

## 12. Decisions to log (each with its reversal condition)

| id | decision | reverse if |
|---|---|---|
| D-ARC-1 | Every lesson opens with 2-4 delayed-retrieval items before new content (B1: 2) | P1 causes measurable early quitting (> 10% of lessons end in P1 for reasons other than time) or retrieval success shows no relation to later outcomes |
| D-ARC-2 | Phases are a Director state machine with min/max and exit conditions, not a clock | schools or parents need fixed blocks (then fix the clock and keep the exit conditions) |
| D-ARC-3 | Four states derived from events; the ring only in YOUR TURN, on one element | children miss their turn (> 15% of YOUR TURN windows hit the 15 s tap fallback in M-ARC-1); then add a spoken cue, not a second ring |
| D-ARC-4 | B1-B2 tap-to-talk is a single tap with auto-close; no hold-to-talk | open mic with 6-year-olds in real homes shows false barge-ins and cut-offs as low as tap mode |
| D-ARC-5 | The protégé is a child-chosen fictional character speaking only pre-rendered kit clips | children find the clips repetitive (recognised repeats in M-ARC-4 transcripts) *and* a generated protégé passes the safety predicates and the never-a-real-child rule |
| D-ARC-6 | The prequestion sits in P2; the preview in P7 is plain, with no suspense shapes | an A/B shows end-of-lesson prequestions improve next-lesson learning without raising return-pressure complaints (still subject to gurukul §4.7) |
| D-ARC-7 | A break is required for B1-B2 in lessons of 20 minutes or more | M-ARC-5 shows no effect on post-break engagement or delayed retrieval |
| D-ARC-8 | The per-lesson parent note is an in-app card, not a push | parents ask for per-lesson messages in research *and* the opt-out rate stays flat above 2/week |
| D-ARC-9 | The B1 default is a 10-minute micro-session with a 12-minute hard stop | M-ARC-7 shows 15 minutes keeps completion ≥ 85% with equal next-day retrieval |
| D-ARC-10 | Game wrappers are kept only where the action is the skill, and each must run unskinned | M-ARC-6 shows skinned and plain items are equal on delayed retrieval *and* engagement (then keep only what children choose) |

---

## 13. Gates and measurements

**Build gates (deterministic, each with a negative control, in the gurukul `check-*.mjs` style):**
- **G-ARC-1 one ring:** exhaustive over phase (8) × layout (5) × status (4) × band (4) × handover (6) × mic mode (2) = 7,680 inputs: ≤ 1 ringed element, and a ring only when status = YOUR TURN. Negative control: a fixture that rings mic and tiles together must fail.
- **G-ARC-2 status from events:** replay recorded realtime + module event logs (including barge-in, endpoint without speech, dropped audio) and assert the state sequence. No state may be set from a literal or a timer outside YOUR TURN escalation.
- **G-ARC-3 Director properties:** P6 never runs before ≥ 1 independent correct attempt; a P2 prediction is always resolved before P5; mastery never updates from a yes/no row; P7 is reachable within one turn from any phase on a "going" intent; no phase exceeds its max.
- **G-ARC-4 close lexicon:** a predicate on P7 and preview turns for suspense, absence, streak, urgency and "come back" shapes (bilingual), reusing the gurukul NEVER MANIPULATE lexicon.
- **G-ARC-5 spoken-turn caps per band** on the teacher transcript, checked per turn, against `speech.turn.maxWords`.

**Measurements (each logged to `context/measurements.md` with n, method, date):**

| id | question | method | n (minimum) | decision it feeds |
|---|---|---|---|---|
| M-ARC-1 | real phase durations, completion, YOUR TURN timeouts, interrogation feel | phase timestamps + transcripts from pilot lessons | 20 children per band × 3 lessons | all durations in §2; D-ARC-3 |
| M-ARC-2 | P1 retrieval success distribution | scheduler logs | 500 items | interval tuning (aim the mean near 70-85% [I]) |
| M-ARC-3 | does adaptive choice hold practice success in band? | rolling success per lesson | 200 practice blocks | §5 P5 bands |
| M-ARC-4 | teach-back grader agreement | two blind human raters vs classifier on transcripts | 200 teach-backs | κ ≥ 0.7 before teach-back drives mastery (rule 11 target) |
| M-ARC-5 | break vs no break (B1-B2) | within-child randomised, delayed retrieval + post-break minimal-answer rate | 60 children | D-ARC-7 |
| M-ARC-6 | wrapper vs plain items | randomised per item family, next-lesson retrieval | 1,000 items | D-ARC-10 |
| M-ARC-7 | micro 10 vs 15 min (B1) | randomised, completion + next-day retrieval + parent fatigue report | 40 children | D-ARC-9 |
| M-ARC-8 | THINKING gap from India on device | p50/p90 child-endpoint → first played frame | 500 turns | rule 3 in §4; `voice-turn-config` |
| M-ARC-9 | P2 prediction disengagement | answer rate and pass-on rate for the prediction | 300 lessons | D-ARC-6 |
| M-ARC-10 | teach-back expectancy announced vs not | randomised, teach-back coverage + delayed retrieval | 80 children | replicates Kobayashi in voice |
| M-UX-4 | YOUR TURN re-entry timing (8 s vs 5-6 s) | randomised, self-started answers vs re-entries | 40 children per band | §4 rule 4; kids-ux row 10 |

---

## 14. Open questions and risks

1. **Lesson length is unvalidated.** 30-45 minutes comes from classroom periods and tuition norms, not from AI voice lessons. If M-ARC-1 shows completion falling off past ~25 minutes for B2, the B2 default becomes two halves.
2. **Protégé voice:** the inference that one realtime session keeps one voice needs checking against current Azure realtime docs. If voice switching is possible, pre-rendered clips still win on safety and offline use.
3. **Helper contamination:** a parent answering for the child is common at home and undetectable by audio (speaker ID rejected). Discounting evidence is a stopgap. A parent-onboarding norm and a measured rate are needed.
4. **DPDP §9(3):** the probe schedule is behavioural observation of a child. It runs under the learning-science §4.3 legal question; the format-efficacy A/Bs (M-ARC-6) stay off until counsel clears them.
5. **Cost:** a 45-minute arc is ~$3.9 on gpt-realtime-2.1 with context pruning (ARCHITECTURE §1.1). The micro-session and the passive practice stretch (less teacher speech) are the cheapest minutes; measure cost per phase before any pricing decision.
6. **Young children and the THINKING gap:** a 2+ second silence after every answer may read as patience or as "she didn't hear me". The body pose carries it until M-ARC-8 and M-ARC-1 say otherwise.

---

## 15. Sources

**Read this session (primary or abstract):**
- Rosenshine, B. (2012). *Principles of Instruction*. American Educator. https://www.aft.org/ae/spring2012/rosenshine (PDF: https://www.aft.org/sites/default/files/Rosenshine.pdf)
- NCERT (2022). *National Curriculum Framework for Foundational Stage* (Four Blocks maths §4.5, Table 4.5A; GRR §4.2; daily routines §7; Table 65 C-13.1). https://ncert.nic.in/pdf/NCF_for_Foundational_Stage_20_October_2022.pdf
- Patall, Cooper & Robinson (2008), Psych. Bull.; Mahar et al. (2006), MSSE; Mahar (2011), Prev. Med.; Vlach & Sandhofer (2012), Child Dev.; Vlach, Sandhofer & Bjork (2014), JECP; Bradbury (2016), Adv. Physiol. Educ.; Finn (2010), JEP:LMC; Wilson et al. (2019), Nat. Commun.; Pareto, Ekström & Serholt (2022), Front. Robot. AI. Abstracts via Europe PMC REST: https://www.ebi.ac.uk/europepmc/webservices/rest/search
- Clark, Tanner-Smith & Killingsworth (2016). Digital Games, Design, and Learning. RER. Full text: https://europepmc.org/article/PMC/PMC4748544
- Habgood & Ainsworth (2011), JLS; Schunk (1985), J. Special Ed.; King-Shepard et al. (2025), Educ. Psych. Rev.; Motz et al. (2026), ManyClasses 2, J. Educ. Psych.; Chase et al. (2009), JSET; Pareto (2014), IJAIED; Tärning et al. (2019), IJAIED; Rowe (1972, 1986, 1987); Schroeder, Adesope & Gilbert (2013), JECR; Castro-Alonso et al. (2021), Educ. Psych. Rev.; Noetel et al. (2022), RER. Records via the ERIC API: https://api.ies.ed.gov/eric/
- Third Space Learning, Skye: https://thirdspacelearning.com/maths-tutoring/ai-maths-tutor/
- Duolingo, Video Call with Lily: https://blog.duolingo.com/video-call/
- Synthesis Tutor: https://www.synthesis.com/tutor · Ello: https://www.ello.com/

**Internal (Taxila):** `docs/research/learning-science.md`; `docs/research/design/kids-ux-ages.md`; `docs/research/design/parent-experience.md`; `docs/research/voice/indian-teacher-discourse.md`; `docs/harvest/gurukul.md` §4.7, §6; `docs/harvest/companion-tech.md`; `docs/harvest/hp-main-voice-surfaces.md`; `docs/ARCHITECTURE.md`; `context/decisions.md` (`voice-realtime-model`, `voice-turn-config`); `context/measurements.md` (`realtime-teacher-bakeoff-2026-10-02`, `realtime-audio-in-2026-10-02`, `infra-smoke-2026-10-02`).

**Cited from earlier Taxila docs, not re-read here:** Kobayashi 2019/2024 [S], Thiede et al. 2003 [S], Brod 2021 [V there], Rohrer et al. 2020 [S], Sesame Workshop 2012 and TIDRC 2019 [V there], Tanaka & Matsuzoe 2012 [M].
