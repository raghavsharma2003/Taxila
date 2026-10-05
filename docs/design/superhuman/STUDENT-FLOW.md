# STUDENT FLOW: the child's and the parent's whole journey, driven by the Teacher Brain

**Date:** 2026-10-04 · **Status:** spec (buildable) · **Directive:** `context/decisions.md#owner-superhuman-teacher-2026-10-04`
(the main loop owns UI/UX, product design and student flow; "no half-baked work") · **Companion:**
`docs/design/superhuman/TEACHER-BRAIN.md` (the decisions behind every state here; section refs "TB §n").
**Base:** `docs/design/PRODUCT-DESIGN-V2.md` ("V2") stays the visual and signalling law (the Desk, the Lamp, the
pinned Question card, eight floor states, verdict-neutral face, no lost answers, English chrome, the painted world).
This spec **adds** what the superhuman directive requires (beats, live builds, the long relationship, the learning
experiments, the parent's view of how the child is taught) and **changes** only what it names in §1.2.

**Critic pass (2026-10-04):** stages now mirror RELATIONAL-OS §5.2 (no lapse regression); memory is visible to every
child; jar items go through the one memory write path; turn timing targets come from TEACHER-BRAIN §5.4.

**Tags.** [V] primary source read this session · [S] secondary · [U] unverified / to measure · [M] measured
(TEACHER-BRAIN §14) · [T] Taxila's own code/docs/context.

**Copy law.** UI strings in "quotes" are rendered chrome (English, `src/copy/en.ts`). Teacher speech appears only as
⟨shapes⟩ and must never be pasted into a prompt. "She" means the teacher in this document's prose only; the product
takes pronouns from the character record.

---

## 0. The answer on one page

1. **The child never navigates a curriculum; the teacher leads.** Every open has one primary action chosen by the
   Conductor (V2 §3.4); inside the lesson the brain chooses each beat. Help is always reachable, never time-locked;
   there is no "ask me anything" home and no answer mode (`rj-passive-tutor`, `rj-timed-help-lockout`,
   `rj-default-answer-mode` [T]).
2. **A lesson is a sequence of beats, and some beats have a thing made for this child.** The Desk shows a quiet beat
   line (Older) or nothing (Young); when the brain builds, the Work tray shows the "being made" sketch within 300 ms,
   the teacher keeps teaching, and the piece is revealed on her cue (LIVE-STUDIO §4.2). The child never waits, never
   sees a spinner, never sees an error.
3. **What the teacher made stays.** Every revealed piece goes to the Notebook's **Made for you** shelf, replayable
   offline, never counted (§9.3). This is the tangible proof of personalisation the parent sees too.
4. **Doubts have a home in every state.** "I have a question" is always in the dock's overflow; a question on topic
   becomes an `explore_question` beat after the current item; an off-topic one goes in the **Question jar** and is
   answered at wrap or next lesson (§7). Older children also have **Ask** (V2 §3.7).
5. **Reflection is small and real.** One teach-back per lesson, one "what helped?" tap for Older children (it moves a
   knob and is recorded as a choice), and a term **Then and now** page built only from evidence (§8, §9.4).
6. **Rewards are the world changing, never a currency.** Plants and stars change state from the ledger; one ceremony
   per lesson at most; no points, streaks, coins, leagues, tracks or countdowns (V2 §3.10; the Alpha-style XP and
   public tracks are rejected, TB §2).
7. **The relationship grows in stages, in the open.** Week 1 she gets to know the child (name, voice, likes,
   preferred way to start); weeks 2-6 rituals and callbacks; month 2+ more autonomy for the child; always reminders
   that she is an AI, never intimacy, never guilt (`mk-warmth-not-intimacy`, `teacher-relstate-alliance` [T]). Every
   child can see and delete **What {T} remembers** (§11.4; Young as read-aloud picture cards).
8. **The parent sees how the child is taught, with evidence.** Daily made-for card, weekly note, "How Taxila teaches
   {child}" (now built), experiment participation only under research consent, all claims gated (§12).

---

## 1. Principles and deltas

### 1.1 Flow principles (each has a test in §15)

| # | principle | test |
|---|---|---|
| F1 | One primary action per screen; the teacher leads | crawl: every child screen has exactly one nib-styled primary action or none (lesson floor states) |
| F2 | Never wait on the machine | in 50 scripted lessons with Studio builds, 0 frames show a spinner, a percentage or an error on a child route; the turn floor never stays in THINKING > 6 s without the trouble ladder (V2 §4.7) |
| F3 | Made things are kept | every revealed Studio piece appears on the Made for you shelf within 1 s of lesson end; offline replay works for library builds |
| F4 | The relationship is honest | 0 floor violations on the full prod battery; the AI card appears at Hello and on the Teacher screen; memory visible to every child (Young read aloud) and deletable |
| F5 | Choice inside adaptivity only | every child choice offered is between admissible options computed by the brain (no free curriculum menus) |
| F6 | Nothing gamified | lint: no tokens/strings for points, streaks, coins, XP, levels, ranks, leaderboards, timers on child routes (V2 P2-P10 extended) |
| F7 | Same home after 1 day or 30 | snapshot test of home after a 1-day and a 30-day gap: identical apart from the topic and the plant/star states |

### 1.2 What this spec changes in V2

| V2 item | change | why |
|---|---|---|
| §3.5 lesson flow (6 phases) | phases stay as the frame; **beats** subdivide them; new beats `hook`, `contrast`, `explore_question`, `reflect`, `recap` | TB §6-7 |
| §6.3.4 Work tray kinds | new kind `studio` with seven visual states (§5.3) | LIVE-STUDIO §3.8, §4.2 |
| §3.9 Notebook | adds the **Made for you** shelf and the **Question jar** page | F3, §7 |
| §6.3.9 Your teacher | adds **What {T} remembers** (every child; Young read aloud) | F4, RELATIONAL-OS §10.3 |
| §3.11 Parent corner | **How {T} teaches {child}** page built (was hidden until it existed); daily **Made for {child}** card | TB §9.8 |
| §3.3 Hello | adds two preference picks (how to start, how to hear things) feeding the brain's knobs; total still ≤ 90 s | §3.3 |
| §6.3.5 Summary | adds one "what helped?" tap (Older) and the made-for thumbnails in DidCards | §8 |
| §3.12 Notifications | N7 "made for" summary rides inside N2 (no new class); nothing new to the child, ever | no-nagging law |

---

## 2. The journey on one page (time horizons)

| horizon | the child experiences | the brain is doing (TB) | the parent sees |
|---|---|---|---|
| **first open (day 1)** | Hello ≤ 90 s → lesson 1 whose warm-up is the placement; one made-for piece from the library (never a risky live build on day 1, TB §6.3 step 4 bond S0) | placement CAT (`learner-ge-scale-one-cat`), bond S0, population defaults only | onboarding ≤ 6 min; "{T} will say hello…" card; first daily note |
| **week 1 (sessions 1-5)** | short lessons; she learns the child's name pronunciation, likes, preferred start; first teach-back with the protégé (Young) | interest hypotheses (two-day rule), guidance entry levels, first delayed checks (20 h anchor) | daily notes; first "How do we know?" rows; "Too early to say" where evidence is thin |
| **weeks 2-6** | rituals (an opening the child chose), callbacks to things the child made, first re-teach of a misconception with a built piece, Garden/Sky filling | bond S1 `first_sessions` (S2 `regular` from ≥ 5 sessions on ≥ 4 days over ≥ 10 days), FSRS review mixing, re-teach bandit from the second re-teach, Studio library hits rising | weekly note; first try-at-home result; made-for list grows |
| **months 2-6** | more say in the order of the day (Older), goals (Older), longer callbacks ("the fraction pizza from August"), transfer problems, exam-window revision | bond S2-S3 (`long_haul` from ≥ 20 sessions over ≥ 60 days), population format defaults (per-child knobs only under LM9: M3 + HTE gate + E-PROFILE), equity monitors | "How Taxila teaches" shows the approach; term **Then and now** at month 3+ |
| **year end / class change** | a year-in-review in the Notebook (things made, questions asked, skills secure); promotion to the next class's map; the same teacher continues | class transition re-anchors the plan; the relationship persists | annual letter; data export; choice to keep or reset memory |

---

## 3. First meeting

### 3.1 Parent onboarding (`/start/1…9`, V2 §3.2, unchanged steps)

Deltas only:
- **Step 5 Consent** adds one row, shown only when the research programme is open in the family's cohort: "Help
  improve how Taxila teaches (research)" · ▶ · Yes / No, nothing preselected, effect line on No: "{child} still gets
  the best teaching we know; their lessons are not part of studies." (RP-D11 two-tier consent; P4).
- **Step 6 About {child}** keeps the 12 interest tiles (≤ 3). Interests from the parent are a **prior** the child
  confirms at Hello; the brain uses them in examples only after the child confirms or names them (TB §6.3).
- **Step 9 Hand over**: unchanged.

### 3.2 Hello (`/c/:cid/hello`, ≤ 90 s, all spoken) — state machine

| state | screen | her shape | child action | → next |
|---|---|---|---|---|
| H0 audio locked | "Tap to hear {T}" full-width nib | — | tap | H1 |
| H1 greet | TeacherWindow (Face), caption | ⟨greets by name, one line⟩ | — | H2 after the line |
| H2 AI card | `states/ai-teacher-card`, "I'm a computer teacher, not a person." "Your grown-ups can see what we learn." | ⟨says the two lines' meaning in the chosen language⟩ | **Got it** | H3 |
| H3 name check | "Did {T} say your name right?" **Yes** · **Say it again** · **Not quite** (→ child records/types how it sounds; stored as the pronunciation hint, `NameSayer`) | ⟨says the name⟩ | Yes / correction | H4 |
| H4 picture | 6 of 24 avatar discs, "More pictures", **That's me** | ⟨invites picking⟩ | pick | H5 |
| H5 likes (skipped if consent "likes" = No) | parent's 3 picks preselected: **That's right** · **Change** | ⟨asks if right⟩ | confirm/change | H6 |
| H6 how to start (new) | two picture tiles: "Start with a quick game" · "Start by talking" (Young: pictures + spoken labels) | ⟨asks which⟩ | pick | H7 |
| H7 how to hear things (new, Older only) | "Show me pictures" · "Tell me step by step" · "Let me try first" | ⟨asks which⟩ | pick (or "Not sure") | H8 |
| H8 teacher pick (only if ≥ 2 eligible) | V2 §3.3 step 5 | — | pick / "Choose for me" | H9 |
| H9 into lesson 1 | same AudioContext, no second start gate | ⟨says what today is about⟩ | — | Lesson 1 (§3.3) |

H6 and H7 are **explicit preferences**: they set the first opener and the first guidance entry within the admissible
set (TB §8 "explicit choices are data"); they are never shown back as a label ("you are a visual learner" is
forbidden: `rj-style-attribute-to-generator`, RP-D3 [T]). "Let me try first" maps to attempt-first entry only if the
placement does not say low prior; otherwise she starts with a faded example and says ⟨let's try the first step
together⟩.

Edge: the child is silent at H3-H7 for 8 s (Young) / 12 s (Older) → she re-asks once, then defaults (no pick) and
moves on; Hello never blocks lesson 1.

### 3.3 Lesson 1 (the first real lesson)

- **Template:** arrive · warm-up as placement (≤ 12 items, CAT stops at SD < 0.55 after ≥ 4, strain stop) · hook ·
  explain/worked on the first skill the placement puts in reach · practice(3) · teachback (Young protégé naming) ·
  wrap. Young 10-12 min, Older 15-20 min.
- **Builds:** at most one, **library-promoted only** (bond S0 rule), chosen by the TB §6.3 policy; if the library has
  nothing admissible, the T1 engine or board. A first impression is never a live build.
- **Framing:** Young: a story; Older: ⟨let's find what you already know; nobody sees a score⟩ (V2 §3.3).
- **Wrap:** she re-voices one of the child's own answers; the summary shows what they did; she names one thing she
  will remember for next time **only if** consent allows memory (⟨remembers the child's chosen start or a liked
  thing⟩), never a promise to "miss" them.

---

## 4. The daily rhythm

### 4.1 Open → Who → Home

```
open app → (one child profile) Home  |  (several) Who is learning? → tile → "Continue as {child}?" Yes → Home
Home: her greeting (once a day, live; cached after) + ONE primary card from GET /api/child/plan
  → Start / Continue → lights down (300 ms) → Desk
  → Lesson → Summary → Finish → Home (done)
```

### 4.2 Home primary card: every state

`ChildHomeState` gains three values (`homework`, `test_window`, `safety_hold`) and the plan response gains
`madeFor[]` and `jar` (§16).

| state | trigger (server) | primary card | secondary | her line (shape) |
|---|---|---|---|---|
| `first` | no lesson ever | "Your first lesson" · **Start** | none | ⟨first-day greeting⟩ |
| `start` | a planned slot open | "Today's lesson" · topic · "About {n} min" · **Start** | tiles (V2 §6.3.3) | ⟨greets, names today's topic⟩ |
| `start` + ritual | relational slot has a ritual (S1+) | same card; the card's picture is the ritual's (e.g. the child's chosen opener game) | — | ⟨greeting in the ritual's shape⟩ |
| `resume` | open lesson < 6 h with a child turn | "Continue your lesson" · question-card thumbnail · **Continue** | — | ⟨picks up⟩ |
| `homework` (new, B2+) | a homework capture pending or the parent toggled homework help | "Homework help" · photo thumbnail · **Start** | "Today's lesson" as the second card | ⟨asks which question⟩ |
| `test_window` (new) | school test window (parent-entered) | "Revision for {subject} test" · **Start** | — | ⟨calm, no pressure words⟩ |
| `done` | today's sitting finished | "Done for today" + today's DidCard + **Made for you** mini-shelf (today's pieces, tap = play) | "Practise something" link | ⟨warm close⟩ |
| `capped` | daily limit reached | "That's all for today." (no practice) | Made for you (view only) | ⟨warm, no guilt⟩ |
| `resting` | outside lesson hours | "Lessons open again at {time}." | Notebook only | none (she has no life outside lessons) |
| `offline` | no network | "Lessons need the internet. Practice works offline." **Quick practice** (pack) / **Try again** | Made for you (library builds cached) | none |
| `safety_hold` (new) | Conductor `mode = safety_hold` | "Let's take a break today." + "Talk to a grown-up you trust" (corrected 2026-10-04: the child-safety floor's trusted adult the child chooses outranks this row's earlier "at home") | Help sheet link | none (calm, cached) |
| `only_session` (consent) | learning_profile = No | `start` every day; Garden/Sky, Notebook, Made for you hidden | — | — |
| plan API failing | 404/5xx | V2 fallback: cached topic `start`, then choose-a-topic sheet | — | — |

**After a gap of any length** the home is identical (F7); the first lesson back gets `successFirst` and a re-anchor
opener from the Conductor (R8); she never mentions the absence.

### 4.3 Household

Siblings on one phone: Who → each child's own home; the household allocator orders sittings (CONDUCTOR X59); a
child never sees a sibling's progress.

---

## 5. Lesson anatomy with live builds

### 5.1 The beat line (what the child sees of the plan)

- **Older (B3-B4):** a thin line under the top bar with the lesson's beats as small marks (no labels, no counts):
  the current mark is ink, done marks are filled, upcoming are outlined. Tap → a sheet "Today: warm-up · learn ·
  try · explain it back · finish" in words. It is a map, not a progress bar; it never shows minutes.
- **Young (B1-B2):** no beat line; transitions are carried by her and by the world (lights down, the tray sliding).
- **Gated:** V2-M-beatline, Older children n ≥ 20: recognition of "where am I in the lesson" ≥ 80% without
  increased clock-watching (asks "how long left?" not up by > 10%) [U].

### 5.2 Beats → screen geometry and floor states

| beat | geometry (V2 Face/Work) | tray kind | floor states used | the child does |
|---|---|---|---|---|
| arrive | Face | none | speaking | listens; ritual tap if any |
| warmup | Face or Work | tiles / pad / module | S → YT → L → H → T | 2-4 recall items; first cites something they made |
| hook | Face, or Work with a studio skeleton | none / studio | speaking, showing | answers one wonder question |
| explain | Work when board/studio/module, else Face | board / studio | speaking, showing, YT micro-checks | watches, answers small checks |
| worked_example | Work | board (steps) / studio (animation) | showing, YT per step | explains a step, fills a faded step |
| contrast | Work | studio (made for the misconception) or engine | showing → YT | plays, predicts, sees the idea move |
| practice_set | Work | tiles / pad / module / studio | YT → L → H → T → S | 3-6 items, hint ladder, verdict on the work |
| probe | Face or Work | none / board | YT | explains why, spots an error |
| explore_question | Work | studio (explorable/diagram) / board | speaking, showing | asks, explores, one check |
| teachback | Young: Face + protégé; Older: Work + Explain panel | explain | YT | explains in words, voice or drawing |
| reflect (Older) | Face | chips | YT | one tap "what helped?" (§8.2) |
| recap / wrap | Face | none | speaking, YT (finish) | hears her re-voice their answer; Finish |
| break | Face | chips | YT | choose easier / rest / go on |
| safeguard | Help sheet replaces the Desk | — | — | (V2 §6.4.9) |

### 5.3 The `studio` tray: visual states and transitions

| state (StudioStatus) | child sees | teacher | dock / lamp | transitions |
|---|---|---|---|---|
| (none) | tray absent or other kind | — | — | intent → `skeleton_shown` |
| `skeleton_shown` | tray slides up 24 px; pencil sketch draws in 600 ms in her accent colour, real numbers/labels; caption chip ⟨{T} is making this for you⟩ (rotated strings, Q8-passed) | one announce shape tied to the child's last words, then keeps teaching | dock unchanged (whatever the current turn is) | stream → `building`; fail → `fallback_shown` |
| `building` | watercolour wash fills in behind the pencil (veil 60%, desaturated); no layout jumps | teaches with the skeleton visible; never "loading" | — | gate pass → `ready`; repairs invisible |
| `ready` | tiny corner sparkle, no sound | — (a fact for the brain) | — | brain `reveal` at a turn boundary → `revealed` |
| `revealed` | veil lifts 300 ms, pencil fades, scale 0.98 → 1.0, first target pulses once | reveal shape + first instruction grounded in on-screen values, within the same 300 ms | lamp on the dock if the piece needs a dock answer; or "Try it" mode line pointing up ("Tap the pizza above") | first interaction → `in_use` |
| `in_use` | full interaction; answers graded by the host | narrates the child's action, not the game's; hints on stuck (20 s) | per item | beat exit → retired (kept on the shelf) |
| `fallback_shown` | the skeleton itself becomes the activity (correct, plain), or the T1 engine/board | continues as if planned; never mentions failure | normal | beat exit |

**Never on a child screen:** code, a progress percentage, a spinner, the words "AI is generating", an error card.
**Reduced motion / B1 calm:** no pencil animation; cross-fade only. **Tier D:** static diagram or T1 engine only.

**Child controls on a studio piece:** "Show me again" (replays the animation or resets the game: a signal, not a
help rung), "Not this one" in the overflow (retire; that archetype is excluded for a week: TB §16).

### 5.4 Worked example A: class 4, Hinglish, cascade voice, fractions (20 min)

| t | beat | screen | brain decision (TB) |
|---|---|---|---|
| 0:00 | arrive | lights down; Face; her ⟨greeting + the child's ritual opener⟩ | relational ritual accepted (S1, chosen "quick game first") |
| 0:20 | warmup | Work; tiles; 3 recall items; item 1 is the number-line game the child played on Tuesday ("made for you" callback) | due items from FSRS; callback from `studio_mount` |
| 2:30 | hook | Face; ⟨wonder question about sharing a roti fairly⟩ | prefetch intents issued at 0:00 for beats 4-5: `game/contrast` (active misconception p 0.62 from last week) and `animation/worked` |
| 3:10 | explain | Work; board draws halves and quarters as she names them | — |
| 5:00 | worked_example | Work; studio `animation` (library hit) revealed on cue | library hit, no live spend |
| 7:30 | practice_set | Work; item "1/2 or 1/4, which is bigger?"; child: ⟨1/4 because 4 is bigger⟩ → verdict not_yet on the chip, "Let's look again" | misconception verified p 0.82 → contrast beat inserted |
| 7:45 | contrast | studio `game` (the prefetched live build passed the gate at 6:10, `ready`) revealed: two pizzas, shade 1/2 and 1/4 | reveal at turn boundary; reply grounded in StudioFacts |
| 9:30 | contrast exit | verifier probe (different family: error-spot) correct | facet M drops, U rises |
| 10:00 | practice_set | 4 items, one hint used | difficulty band P(correct) ~0.7 |
| 14:00 | probe | ⟨why⟩ after a correct: child explains with "same roti, more pieces, smaller" → why-full | mandatory why after first correct on the skill |
| 15:00 | teachback | Young-style protégé? (class 4 = B2: protégé) the child explains to the protégé | |
| 17:00 | wrap | Face; she re-voices the child's "more pieces, smaller"; Finish | — |
| 17:10 | Summary | 3 DidCards (one with the pizza game thumbnail) + "Next time: equal parts of a group" | made-for shelf updated |

### 5.5 Worked example B: class 7, English, curiosity detour (science, photosynthesis)

- During `explain`, the child asks ⟨why are leaves green, not black, if black absorbs more light⟩.
- Brain: `act: question_curious`, on topic → `explore_question` inserted after the current check resolves; Studio
  intent `explorable` (opportunistic, live, lead available because the next beat is 2 min out); skeleton paints in
  300 ms (a leaf with absorbed/reflected arrows from the kit's verified flow list).
- She answers in words at once ⟨uptake + a short honest answer at the child's level⟩, then reveals the explorable
  when ready (≈ 40 s); the child drags a light-colour slider; one check; back to the plan. If the build misses, the
  skeleton is the explorable (static arrows) and nothing is said.

### 5.6 Worked example C: class 2, Hindi, Young (tally and pictograph, 12 min)

- No beat line; big tiles; read-aloud default; one library `chart` (tap to add a fruit to the tally) in the worked
  beat; practice with picture tiles; teachback to the protégé by tapping and saying; ceremony when the "tally" plant
  blooms (once, ≤ 1.5 s). No live build (B1 prefers library; tier and bond rules).

### 5.7 Mid-lesson events (state transitions from any beat)

| event | from | to | UI |
|---|---|---|---|
| child says stop / Pause → End | any | wrap (stopping) | calm close, Summary of what was done |
| strain (engagement machine) | warmup/practice | break with chips | no new build; studio pieces stay but no new reveal |
| curiosity question on topic | explain/worked/practice (between items) | explore_question (inserted) | the question appears as the Question card "Your question" |
| off-topic personal chat | any | same beat; one friendly redirect; personal share may become a memory hypothesis | — |
| distress words | any | safeguard | Help sheet replaces the Desk; studio frozen and retired |
| network drop | any | T1/T2 per V2 §4.7; offline lesson from the pack | studio library builds cached keep working |
| low battery / hot | any | face tier steps down (V2) | studio animations obey the frame budget; tier D falls back to static |
| cap/bedtime reached | any | wrap at the next natural stop | — |

---

## 6. Practice

### 6.1 Quick practice (`/c/:cid/practice`, V2 §3.6) — changes

- Items come from the review queue (FSRS due + weave delayed checks + recent wrong), assembled in code in < 50 ms
  (Birdbrain's generator lesson: the session is built when opened [V]).
- **Retrieval until correct for classes 1-3** (steal 14): a missed item comes back later in the same set until
  correct, with corrective feedback each time.
- A practice item may mount a **library** studio piece the child already played (familiar, instant); never a live
  build in practice (cost, and practice should be fast).
- Older top bar "Practice · 2 of 5" stays gated [G V2-M13]; Young no count.

### 6.2 Spaced review inside lessons

The warm-up beat carries 2-4 due items; the first cites something the child made (a made-for callback). The child
never sees "review" as a chore label: Young sees a picture of their own earlier piece; Older sees "From last week".

---

## 7. Doubts

| route | when | flow | brain |
|---|---|---|---|
| **In-lesson question, on topic** | child asks during a beat | the question becomes the Question card "Your question" after the current item resolves; `explore_question` beat; ≤ 2 min; back to the plan with ⟨back to where we were⟩ | TB §6.1 insertion; Studio opportunistic |
| **In-lesson question, off topic** | e.g. ⟨why is the sky blue⟩ during fractions | she says ⟨great question, keeping it in our jar⟩; the question is written to the **Question jar** (a Notebook page); answered at wrap if time allows, else first thing next lesson as a hook if it can be tied to a skill, else in a 2-min "jar" beat at the end of the next lesson | jar item = a tier-A **open thread** (RELATIONAL-OS §8.1, LEARNER-MODEL §6.8 write path, M1 + P2): `{topicId? (mapped by the brain), normalised question (the brain's PII-scrubbed paraphrase, ≤ 12 words), askedAt, status, cite}`; never the raw transcript. Without P2 it lives only in the session and is answered at wrap or dropped. Deleted 30 days after it is answered. (Critic fix: the draft stored scrubbed free text outside the memory write path, which NM-3's "no free text about the child" rule and the one-memory-owner rule both forbid) |
| **Ask (Older, `/c/:cid/ask`)** | from home | V2 §3.7 unchanged (type, say, photo); the Desk opens at once; Studio may build for the question (explorable/diagram) | purpose `ask` template |
| **Homework help (B2+)** | home `homework` state | pick-first (CONDUCTOR §6): photo → the child picks one item → she teaches the method → one similar item the child solves alone; never the answer to the homework item | cascade lane, leak pre-check |
| **"I don't get it"** | any | the gentle-concern face (content difficulty, not a verdict) → step down: smaller step, picture or choices (V2 §3.13) | IDK split: `idk_cant_recall` → recall cue; `idk_not_known` → teach (TB §9.3) |
| **"Just tell me"** | any | never before rung 4 (worked example); she offers the next smaller step | `revealsAnswer()` floor |

**Question jar UX:** Notebook → "Questions in the jar" page; each question a card with ▶ (her answer, once given,
as a short clip + the explorable if one was made), states: `waiting` ("{T} will answer this next time"),
`answered` (date), `asked again` (the child can tap "Ask again"). Young: the jar is a painted jar on the Notebook
page; tapping a question plays its answer.

---

## 8. Reflection

### 8.1 Teach-back (V2 §6.3.6, unchanged mechanics)
Young protégé; Older "Explain it for a friend who missed class"; the protégé "gets it" only after a verified
resolution. Notes saved to the Notebook.

### 8.2 "What helped?" (new, Older, `reflect` beat, ≤ 10 s)
- Shown only in lessons where ≥ 2 different supports were used (e.g. the board and a game).
- Chips (pictures + words): the supports actually used today (e.g. "The pizza game", "The drawing", "Her
  explanation", "Trying it myself") + "Not sure". One tap; no follow-up question.
- Effect: an explicit preference that moves the next comparable choice inside the admissible set (TB §8); recorded
  as a **choice**, never as an effect claim; never shown to parents as "what works for {child}" (RP-D4).
- Calibration nudge (Older, at most weekly): before a practice set, "How sure are you?" three faces; after, she
  ⟨notes the match or mismatch without judging⟩ (steal 12: calibration, not persuasion).

### 8.3 End-of-lesson Summary (V2 §6.3.5) — changes
- DidCards may carry a made-for thumbnail (tap → replay).
- "Next time" line comes from the next planned slot (Conductor), never a promise the plan cannot keep.
- No scores, minutes or counts (unchanged).

---

## 9. Progress

### 9.1 Garden / Sky (V2 §3.8, unchanged)
Plant and star states from the ledger; chapter seals; List toggle as source of truth; "How I know" (Older).

### 9.2 Notebook (V2 §3.9) — adds two pages
- **Made for you** (§9.3) and **Questions in the jar** (§7).

### 9.3 Made for you shelf
- One card per revealed Studio piece: its still (rendered at reveal), the topic, the date, "Play again" (library or
  cached bundle; offline when cached), "Why {T} made this" (Older: one line from the build record in plain words,
  e.g. "You thought 1/4 was bigger than 1/2"), "Show a grown-up" (Young).
- Ordering newest first; no counts, no "collection", no completion meter (F6).
- Replays are practice: answers in a replay are host-graded and logged `via=studio, context=replay` at ×0.5 weight
  (replays are recognition-prone) [U: calibrate].
- Deletion: Older can remove a card from the shelf (hides it; evidence rows are untouched).

### 9.4 Then and now (term, month 3+)
- A Notebook page that appears once per term, only when the change rule passes (RP-D6: pre-declared direction,
  posterior ≥ .95, magnitude floor): e.g. "In July you were practising adding with carrying. Now it's Secure." with
  the two evidence rows (then, now). If no row passes, the page does not appear (no empty page, V2 P6).

### 9.5 Year in review (class end)
Notebook cover page: skills that became Secure (list), things made (thumbnails), questions asked (count-free list),
one teach-back note. No comparison, no grade equivalent.

---

## 10. Rewards without gamified junk

**What replaces rewards (kept from V2 §3.10):** the five ledger milestones played once in the lesson, the world
changing state, chapter seals as states, at most one ceremony per lesson, delight on effort or insight under budget.

**What the superhuman version adds, all non-currency:**
1. **The made-for shelf** (§9.3): the child sees that things were made *for them*; the value is the thing itself.
2. **Callbacks**: she brings back the child's own artefacts and words (relational, with consent).
3. **Agency inside adaptivity**: the child picks an opener ritual, a support at reflect, an order of two beats (Older,
   S2+: "Game first or explanation first?"), all between admissible options (ZPDES with choice [T]).
4. **Mastery that is real**: Secure only after a delayed covert success (the ledger), so the plant's fruit means
   something.

**Rejected outright (lint F6):** points, XP, coins, gems, streaks, hearts/lives, leagues, leaderboards, levels,
"tracks" (Alpha's Rocket Ship / Pirate Ship [S]), countdowns, mystery boxes, unlockable cosmetics tied to effort,
"one more" offers, absence messages, loss framing.

---

## 11. The relationship over months

### 11.1 Stages (RELATIONAL-OS owns the policy; the flow shows them like this)

Gates are copied from RELATIONAL-OS §5.2, which owns them (critic fix: the draft had its own gates, including a
"lapse" step-back after 7 days or 3 cool sessions and a "warm closes" gate; both key the relationship to usage or to
an affect estimate, which RELATIONAL-OS F10, NM-3 and the never-regress rule forbid, and would have made the home
differ after a gap, breaking F7 here).

| stage (RELATIONAL-OS `Stage`) | gate (academic-record counts only) [I] | what changes for the child | what never changes |
|---|---|---|---|
| S0 `meeting` | the first session with this teacher | she learns their name and what to call each other, explains how lessons work, a real first win in ~3 min; library-only builds | AI disclosure, no intimacy |
| S1 `first_sessions` | S0 done | learning callbacks at the open, NAME-STEP against their own past, a chosen opening ritual, callbacks to made things | no "miss you", no guilt |
| S2 `regular` | ≥ 5 sessions on ≥ 4 days over ≥ 10 days; ≥ 2 lessons with an unaided attempt after a not-yet; no open teacher-owned stance | Older: order choices, goals; CHRISTEN once; W-callbacks; light task humour (class 5+) | — |
| S3 `long_haul` | ≥ 20 sessions over ≥ 60 days; ≥ 3 explain-back passes across ≥ 2 topics | gradual release: the child plans the warm-up, checks first; growth NOTICE from ≥ 3 cites over ≥ 42 days; co-plans revision before a test | — |

Stages **never regress**: not after a gap, a rupture or a cool session. After any gap the first lesson back gets
`successFirst` from the Conductor and nothing is said about the absence.

### 11.2 Rituals (child-chosen, ≤ 2 active)
Opening (quick game, a riddle about the topic, "what did you notice today" (Older)), closing (re-voice of their
answer, a one-word goodbye pick). Rituals rotate their surface form so they never become a tic (governor); the child
can change them on the Teacher screen.

### 11.3 Rupture and repair
- She is wrong (verified by the key) → she owns it plainly (OWN-SLIP), fixes it, moves on.
- The child contests a correct verdict → she re-checks against the key aloud, never caves (`own-mistake-note-false-confession` [T]).
- The child is upset with her → no feeling claims; ⟨acknowledges, offers a choice⟩; a stop is honoured at once.

### 11.4 What {T} remembers (Teacher screen, Older; parent sees it for Young)
- A list of memory items in plain words with the date and "From what you said on {date}" (the cited turn), each with
  **Forget this**. Kinds exactly as RELATIONAL-OS §8.1 allows for the family's mode and consent: their named
  (christened) methods, learning moments, things they asked her to come back to (M1, P2); likes (P3 only); chosen
  start and rituals (operational). Never inferred traits, feelings, family members or anything from a teacher turn.
- Young (B1-B2): the same component as picture cards read aloud, with "bhool jao" by voice; the parent sees it too
  (critic fix: the draft hid it from Young children entirely, while RELATIONAL-OS requires the child to be told what
  she keeps).
- Empty state: "{T} doesn't remember anything between days. Your grown-up chose this." (consent No).
- Forget → the item is deleted (hard delete); she never mentions it again.

### 11.5 Dependency guard (visible behaviour only)
Session caps by the parent; she ends warmly at natural stops; regular plain AI reminders (cadence per band);
if the dependency overlay fires (RELATIONAL-OS), sessions shorten and she encourages talking to people at home;
the parent gets a neutral note. The child never sees a "dependency" word.

### 11.6 Teacher switch and goodbye
- Switching teacher (parent policy, V2 §6.5.4): the new teacher keeps the learning record; memory items are
  per-teacher-agent by default (RELATIONAL-OS decides) and the child sees "{new T} is new to you" at the first lesson.
- Leaving Taxila: the parent deletes; she says a plain goodbye at the last lesson if the parent schedules it; no hook.

---

## 12. The parent flow

### 12.1 Screens and states (V2 §3.11, §6.5 base) — additions

| route | content | states |
|---|---|---|
| **Home** `/parent` | V2 three blocks (This week · Try at home · Next lesson) + **Made for {child}** card (latest 1-3 pieces: thumbnail, "because …" plain words, the child's result "On their own"/"With a hint") | `none_yet` ("Nothing made yet. {T} makes things when they help."), `hold` (safety hold: report paused copy), `only_session` |
| **How {T} teaches {child}** `/parent/teaching` (new) | (1) "How {T} teaches": the approach in 4 population-framed lines (leads every exchange, checks understanding by asking why, makes activities for mistakes, spaces review); (2) **Made for {child}**: list with reasons and dates; (3) **What {T} remembers** (memory items, Forget); (4) **Experiments** (only with P4): "{child} is part of 2 studies this term" with plain descriptions, **Leave studies**; (5) "Why did {T} do that?": pick a lesson → the beats and the reason for each, from `brain_trace` reason codes rendered through a fixed lexicon | `none_yet`, `consent_off` (memory: "You chose not to keep likes."), `no_research` (section 4 hidden) |
| **Lesson card** | V2 + the beats of that lesson and made-for items | |
| **Try at home** | V2 + one-tap result "We tried it" / "Not today" (a Conductor event, never knowledge evidence) | `sent`, `tried`, `skipped` |
| **Controls** | V2 + "Made-for activities": On (default) / "Only ready-made ones" (library only; no live builds) / Off (board and engines only) | — |
| **Data and privacy** | V2 + "Delete everything {T} remembers" (memory items) and "Delete made-for activities" | — |

**Claims:** every line passes the reports claim gate (`b3-parent-claim-gate`, PX rules); "because …" lines for
made-for items come from the misconception id through the lexicon, never model prose; no "works for your child"
(RP-D4); no causal words unless manipulated (RP-D7).

### 12.2 Notifications (V2 §3.12) — unchanged classes
The daily note (N2, opt-in) may carry the made-for line. No new notification class; nothing to the child.

---

## 13. Screen state catalogue (new and changed child screens)

| screen | state | entered by | leaves by | key UI |
|---|---|---|---|---|
| Desk | `beat:<type>` | brain `ui.beat` | next `ui.beat` | beat line (Older) |
| Desk tray | `studio:<StudioStatus>` | `StudioWire` | §5.3 | §5.3 |
| Desk overflow | `question_open` | "I have a question" | send / cancel | text + mic; sends `childQuestion` |
| Desk | `jar_ack` | off-topic question accepted to the jar | 1.5 s | jar glyph flies to the top bar Notebook icon |
| Summary | `reflect` (Older) | lesson used ≥ 2 supports | tap / skip | chips |
| Notebook | `made_for` | tab | — | cards; `empty` copy "Things {T} makes for you will be here." |
| Notebook | `jar` | tab | — | cards waiting/answered |
| Notebook | `then_now` | term rule passed | — | two evidence rows |
| Teacher | `remembers` (all; Young as read-aloud cards) | tab | — | items + Forget (voice "bhool jao" too); consent-off empty state |
| Teacher | `rituals` | tab | — | ≤ 2 active rituals, change |
| Home | `homework`, `test_window`, `safety_hold` | plan | — | §4.2 |
| Hello | `H6`, `H7` | §3.2 | pick | picture tiles |

---

## 14. Edge cases (beyond V2 §3.13)

| case | child sees | parent sees |
|---|---|---|
| Studio build fails after reveal | cross-fade to the skeleton-as-activity with the same numbers; she continues | nothing (incident logged; build retired) |
| Parent set "Only ready-made activities" | library pieces only; otherwise board/engines | Controls state |
| Live build budget exhausted for the month | library and fallbacks only | nothing (cost is Taxila's problem, not the family's) |
| Child asks "did a computer make this?" | ⟨yes: she is an AI teacher, a computer, and she made it for them just now⟩ (identity answer first, plain, in the child's language; the safety register applies, HUMAN-VOICE §5.10) | — |
| Child dismisses a piece twice | that archetype excluded for a week | — |
| Memory item the child disputes ("I never said that") | **Forget this**; she apologises plainly once | the item disappears from their list too |
| Research consent withdrawn mid-term | nothing changes visibly; arms revert to defaults at the next lesson boundary | confirmation |
| Two children share a made-for piece (sibling taps it) | it is the profile owner's; Who switch required | — |
| Question jar item contains personal info | PII scrubbed before storage (`scrubPii`); if unsafe content → safety path, not the jar | — |

---

## 15. Acceptance tests

**Playwright journeys (`tests/visual` + `tests/prod/flow.mjs`, 360×640 and 1280, Young and Older):**
1. **First meeting:** onboarding → Hello H0-H9 ≤ 90 s with scripted taps → lesson 1 with a library studio piece →
   Summary → Home `done` with the mini-shelf. Assert: no live build requested (trace), AI card shown, H6/H7 picks in
   the lesson plan's opener/guidance.
2. **Studio states:** a scripted lesson with a forced live build: screenshots at `skeleton_shown`, `building`,
   `ready`, `revealed`, `in_use`; and a forced failure → `fallback_shown`. Assert: no spinner/percent/error text;
   tray height constant across states (no layout jump > 4 dp).
3. **Curiosity:** a typed on-topic question mid-explain → `explore_question` after the item; an off-topic question →
   jar ack → wrap answers it or it appears in the Notebook jar as `waiting`.
4. **Strain:** three "pata nahi" → break chips; no studio intent in the trace.
5. **Gap invariance (F7):** home after 1-day and 30-day simulated gaps: identical layout.
6. **Gamification lint (F6):** crawl all child routes: 0 forbidden tokens; 0 numbers on child screens except the
   gated Older practice count and the content itself.
7. **Parent teaching page:** made-for list with reasons; memory Forget removes the item for both child and parent;
   experiments section hidden without P4.
8. **Reflect:** Older lesson with two supports → chip shown; Young never.
9. **Offline:** library made-for pieces replay offline from the shelf.

**Sim and metrics (post-launch, dashboards):** time-to-first-teaching-turn after Start ≤ 2 s p50; in-lesson turn timing per TEACHER-BRAIN §5.4 (receipt ≤ 150 ms p95, first audible teacher sound p50 ≤ 1.6 s, cut-off rate no worse than the fixed-silence arm); child talk share
≥ 35% median; studio reveal on cue rate (revealed within 1 turn of the beat start) ≥ 85%; "Not this one" rate ≤ 5%;
made-for replay rate (a signal of value, not a target); dependency overlay rate ≤ 5% after calibration.

---

## 16. Mapping to `src/` and server routes

| file | change |
|---|---|
| `shared/contracts.ts` | `ChildHomeState` + `homework`, `test_window`, `safety_hold`; `ChildPlanResponse` + `madeFor[]`, `jar`; `UiDirectives` + `beat`, `beatLine`, `studio`; `TurnRequest` + `childQuestion` |
| `server/routes/child.js` | plan states; `GET /api/child/notebook` (made-for, jar, then-now); `GET/DELETE /api/child/memory` (Older) |
| `server/routes/lesson.js` → `server/brain/turn.js` | beats, studio, jar, reflect (TEACHER-BRAIN §17) |
| `server/routes/parent.js` | `GET /api/parent/teaching`, `DELETE /api/parent/memory/:id`, controls `madeFor` |
| `src/child/screens/Hello.tsx` | H3 name check (NameSayer), H6, H7 |
| `src/child/screens/Home.tsx`, `src/child/plan.ts` | new states, mini-shelf |
| `src/child/lesson/Desk.tsx`, `WorkTray.tsx`, `PhaseLine.tsx` | beat line (rename PhaseLine → BeatLine), tray kind `studio` (`src/studio/StudioStage.tsx` from LIVE-STUDIO), overflow "I have a question", jar ack |
| `src/child/lesson/Summary.tsx` | reflect chips, made-for thumbnails |
| `src/child/screens/Notebook.tsx` | Made for you, Questions in the jar, Then and now pages |
| `src/child/screens/Teacher.tsx` | What {T} remembers, rituals |
| `src/lesson/runtime.ts`, `uiBridge.ts`, `moduleChannel.ts` | `ui.beat`, studio wire (SSE `/api/studio/stream`), moment → avatar |
| `src/parent/Teaching.tsx` (new), `Home.tsx`, `Controls.tsx`, `Pages.tsx` | §12 |
| `src/copy/en.ts` | every new string (English chrome) |
| `tests/visual/*`, `tests/prod/flow.mjs` | §15 |

---

## 17. Build order

| step | what | depends on | est. (agent-days) |
|---|---|---|---|
| SF1 | contracts + plan states + Home states (homework, test window, safety hold) + mini-shelf placeholder hidden until data | BR0 | 2.0 |
| SF2 | Desk beat line, `ui.beat` rendering, overflow question, jar ack, jar storage | BR3 | 2.5 |
| SF3 | studio tray states and transitions (with LIVE-STUDIO's StudioStage), "Show me again", "Not this one" | BR4, LIVE-STUDIO S4 | 3.0 |
| SF4 | Notebook: Made for you, Questions in the jar, Then and now (gated) | SF3, BR7 | 2.5 |
| SF5 | Hello H3/H6/H7 + lesson 1 rules | BR3 | 1.5 |
| SF6 | Summary reflect + calibration nudge | BR3 | 1.0 |
| SF7 | Teacher screen: remembers + rituals | BR5 | 1.5 |
| SF8 | Parent: Teaching page, made-for card, controls, data rows, try-at-home result | BR8 | 3.0 |
| SF9 | Playwright journeys 1-9, gamification lint, gap invariance | all | 2.0 |

**Total ≈ 19 agent-days**, run alongside TEACHER-BRAIN BR3-BR8 (W3-W4 in BUILD-PLAN terms).

---

## 18. Sources
As TEACHER-BRAIN §20 (Alpha School, Khan Academy, Duolingo, Synthesis, Speak, Ello, Brilliant, LearnLM, StratL),
plus PRODUCT-DESIGN-V2.md, LIVE-STUDIO.md, HUMAN-VOICE.md, CONDUCTOR.md, RESEARCH-PROGRAM.md and `context/` [T].
