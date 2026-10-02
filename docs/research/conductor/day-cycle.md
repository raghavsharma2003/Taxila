# The student's day with Taxila: day, week and term cycle for the Conductor

Status: research + design, 2026-10-02. Written for the design-review workflow; feeds the Conductor spec
(the orchestrator above the per-lesson Director in `docs/ARCHITECTURE.md` §1.2). Where this file and a
later `context/decisions.md` entry disagree, the decision entry wins.

Read with: `docs/research/learning-science.md` §3.5-3.8 and §6 (rules cited here as **LS-n**),
`learner/kt-algorithms.md` (FSRS memory model, mastery states), `learner/vibe-temperament.md` (session
states, `stopped` rule), `design/kids-ux-ages.md` (bands B1-B4, S10 notifications),
`design/parent-experience.md` (PX rules, cadence cap, controls, alerts).

**Evidence tags** follow learning-science §0: **[V]** primary source checked this session, **[S]**
secondary source or search summary only, **[M]** prior knowledge not re-checked. Two more, as in the
sibling docs: **[I]** our inference or design proposal, **[U]** unmeasured, must be measured on Taxila data.

---

## 0. Decisions on one screen

| # | decision | why | what would reverse it |
|---|---|---|---|
| DC1 | **The day is built around one anchored "Taxila time" slot after school, not around notifications.** The cue is an existing household routine (bag down + snack, or after tuition), chosen with the parent at onboarding as an if-then plan. | Habits are context-response associations cued by stable contexts, not by intentions (Wood & Rünger 2016 [S]); if-then plans d = 0.65 over 94 studies (Gollwitzer & Sheeran 2006 [S]); routine-based and time-based cues worked equally (Keller et al. 2021, n = 192 [V]) | Measured: children with a set anchor do not show more days-with-a-session at week 8 than children without one (DC-M1) |
| DC2 | **No streaks, no "you missed a day", no absence pushes, ever.** Missing a day is designed as normal. | Missing one opportunity "did not materially affect" habit formation (Lally et al. 2010 [S]); broken streaks demotivate out of proportion to what was missed (Silverman & Barasch 2023 [S]); LS-27, PX7 | None. This is a floor, like the crisis lines |
| DC3 | **Habit is expected to take about two months, and the product plans for that.** The first 8-10 weeks have a lighter default plan and an explicit "tiny day" (one 3-minute burst) that counts as showing up. | Median 66 days to automaticity, range 18-254 (Lally 2010 [S]); 59 days in Keller 2021 [V]; repetition of the planned behaviour in response to the planned cue was the key predictor [V] | Taxila's own automaticity curve (DC-M2) plateaus much faster, in which case shorten the ramp |
| DC4 | **Live lesson length by band: 20 / 25 / 35 / 45 min** (B1 6-7 · B2 8-9 · B3 10-12 · B4 13-15), split into activity segments of about 5 / 7 / 10 / 12 min, with a "do" or movement break at the half. | Sustained attention rises steeply from 5-6 to 8-9 and plateaus after ~10 (Betts et al. 2006 [S]); the "10-minute attention limit" has no primary support (Bradbury 2016 [S]), so the segment length is a design default, not a law [I]; parent-experience §10 defaults (20/30/45) | Drop-off or minimal-answer runs (vibe V-signals) cluster at a different minute than the segment boundary (DC-M3) |
| DC5 | **Homework help is guided, time-boxed and never returns a final answer to a school item.** Photo → item match → hint ladder → child writes their own answer → optional "check my working". | Unguarded GPT-4 raised practice grades 48% but cut later exam performance 17%; the guarded tutor arm avoided the harm (Bastani et al. 2025, PNAS [S]); LS-15 | A preregistered micro-RCT shows the "check my working" mode reduces independent-test performance vs no help (DC-M5) |
| DC6 | **Revision is scheduled across nights: a newly learned skill's first re-check is the next day, never the same evening.** | Children's declarative memory benefits from sleep (Wilhelm et al. 2008/2013 [S]; Ashworth 2014 [S]); sleep between sessions halved relearning trials and improved one-week retention (Mazza et al. 2016 [S]); matches `kt-algorithms` §2.6 (delayed success ≥ 20 h later) | Taxila delayed-check data show no difference between same-evening and next-day first re-checks on 1-week retention (DC-M6) |
| DC7 | **Taxila protects sleep: no new teaching in the last 60 min before the parent-set bedtime; the day-end reflection is voice-led with a dimmed screen and ends ≥ 30 min before bedtime; nothing extends a session for exam prep.** | Screen use associates with later bedtimes and shorter sleep in 67 studies (Hale & Guan 2015 [S]); sacrificing sleep to study more than usual predicted next-day learning problems (Gillen-O'Neel et al. 2013, n = 535 [S]); AASM: 9-12 h for 6-12, 8-10 h for 13-18 (Paruthi 2016 [S]) | None for the principle; the 60/30 min margins can move with measured bedtime drift (DC-M7) |
| DC8 | **Notifications go to the parent, about logistics, capped, and never about the child's performance or absence.** The child is never pushed on a shared phone. | Kids-ux S10; PX7; teens already receive a median 237 notifications/day (Radesky et al. 2023 [S]); CCPA 2023 lists nagging and confirm-shaming as dark patterns [S]; ICO Code std 13 [S] | None for the bans; caps move only on measured opt-out (DC-M8) |
| DC9 | **Parent day-end note is pull, not push.** Generated every day a session happens, read in Parent corner; WhatsApp carries it only if the parent explicitly chooses "daily", and it then replaces the milestone message within the ≤ 2/week learning cap. | Parent cadence evidence: 3/week preferred, 5/week raised opt-out (Cortes et al. [S], parent-experience §2); a daily push would breach parent-experience decision 6 | Opt-out among "daily" choosers ≤ weekly-only choosers at 8 weeks (DC-M9) |
| DC10 | **Tomorrow is prepared overnight, from the library first.** The night job parameterises engines (T1) and scene DSL (T2) and pre-renders images for tomorrow's 1-2 likely topics; free-form generated games (T3) go to the offline validation and review queue and only reach a child after review. | ARCHITECTURE §1.4 (T3 offline-only, headless validation, human review); latency budget during a live call | Review throughput and T3 safety pass rates justify a faster lane (DC-M10) |
| DC11 | **Exam weeks change the mix, not the dose.** A test date turns on a test-window plan (spaced, interleaved retrieval over the test chapters, back-scheduled from the date) inside the same daily time cap. | Optimal gap ~10-20% of the retention interval (Cepeda et al. 2008 [M]); interleaving d = 0.83 in grade 7 (Rohrer 2020 [S]); DC7 | Parents override the cap in > 30% of test windows (that is a signal the cap is wrong, not that sleep stops mattering) |
| DC12 | **No VM per student.** A child's "workspace" is rows in Neon plus an object-storage prefix; generation runs in shared, ephemeral Azure Container Apps jobs. | A per-child VM is idle >95% of the day [I], is a larger attack surface for code generated for minors [I], and adds nothing a per-child parameter set does not | A per-child capability appears that genuinely needs a persistent process (none identified) |

---

## 1. Evidence, compressed to what changes the design

### 1.1 Habits

- **What a habit is.** A context-response association in memory, learned by repetition in a stable
  context; once formed, the context triggers the response without a goal in between, so changing
  intentions changes habits little (Wood & Rünger 2016, *Annu Rev Psychol* 67:289 [S]). → The product
  should own a *context* (a household moment), not a *reminder*.
- **How long.** Lally, van Jaarsveld, Potts & Wardle 2010 (*EJSP*), 96 adults, one daily behaviour in a
  consistent context for 12 weeks: median **66 days** to 95% of asymptotic automaticity, range
  **18-254** days; the model fitted well for only about half of participants; **missing one opportunity
  did not materially affect the process** [S]. Keller, Lally et al. 2021 (*BJHP*), RCT n = 192, 84 days:
  median **59 days** for those who formed habits; routine-based and time-based cue plans **did not
  differ**; repeated enactment in response to the cue predicted automaticity [V]. All adults; there is
  no comparable child study we found [I]. For a child, the household (usually the mother, BaSE 2025 via
  parent-experience §0) supplies the context, so the habit is partly the parent's.
- **Context disruption breaks habits.** Students transferring universities kept exercise and TV habits
  only when performance contexts stayed the same (Wood, Tam & Guerrero Witt 2005, *JPSP* 88:918 [S]).
  → Vacations, festivals, exam timetables and tuition changes are predictable habit breakers; plan a
  re-anchor after each (§7.4).
- **Flexibility vs routine.** Paying people to exercise at a fixed daily time produced *fewer* gym
  visits than paying for any time, during and after incentives (Beshears et al. 2021, *Mgmt Sci* 67(7)
  [S]). → One anchor plus a named backup window, never "only at 5 pm".
- **Tiny habits.** Fogg's recipe (after ANCHOR, I will TINY BEHAVIOUR, then celebrate) and B = MAP
  (behaviour when motivation, ability and a prompt coincide) [S]. Practitioner model, little RCT
  evidence [I]. We use the *shape* (anchor + shrinkable behaviour) and drop the "celebration" as an
  external reward because expected rewards undermine children's motivation (LS §3.7).
- **Fresh starts.** Aspirational behaviour spikes after temporal landmarks: new week, month, term,
  birthdays, holidays (Dai, Milkman & Riis 2014, *Mgmt Sci* 60:2563 [S]). → Re-entry is framed at
  natural landmarks (Monday, the day school reopens after Diwali), never as making up lost time.
- **If-then plans for students.** MCII (wish, outcome, obstacle, plan) made high-school students
  complete >60% more practice questions (Duckworth et al. 2011, n = 66 [S]). → The day-end
  reflection ends with a child-voiced if-then plan for tomorrow (§5.7) for B3-B4; for B1-B2 the parent
  holds the plan.

### 1.2 Sleep and consolidation

- Children 6-8 recalled word pairs better after sleep than after equal wake (Wilhelm et al. 2008 [S]);
  children turned implicit sequence knowledge into explicit knowledge after sleep better than adults,
  linked to slow-wave sleep (Wilhelm, Rose, Imhof, Rasch, Büchel & Born 2013, *Nat Neurosci* 16:391
  [S]); sleep benefit for children's declarative memory replicates (Ashworth et al. 2014, *J Sleep Res*
  [S]). Procedural tasks show a weaker sleep benefit in children [S].
- Sleep between two practice sessions: ~3 vs ~6 relearning trials, better recall at one week (Mazza et
  al. 2016, *Psych Sci* 27(10), adults, n = 40 [S]).
- Trading sleep for study predicts next-day trouble understanding class and doing tests (Gillen-O'Neel,
  Huynh & Fuligni 2013, *Child Dev* 84:133, n = 535 adolescents, 14-day diaries [S]).
- Screens before bed associate with delayed bedtime and shorter sleep; interactivity, content and timing
  matter (Hale & Guan 2015, *Sleep Med Rev* 21:50, 67 studies [S]). An interactive voice lesson is the
  interactive kind [I].
- Targets: 9-12 h (6-12 yrs), 8-10 h (13-18) (AASM/Paruthi 2016 [S]); IAP repeats 9-12 h for 5-10 [S].

### 1.3 Attention and fatigue by age

- Sustained selective attention increases fast from 5-6 to 8-9 and plateaus after ~10 (Betts et al.
  2006, n = 57 [S]); refinement continues into adolescence [S].
- "Attention drops after 10-15 minutes" is folklore: the primary data do not support it (Bradbury 2016,
  *Adv Physiol Educ* 40:509 [S]). Segment lengths in DC4 are therefore defaults to be tuned from drop-off
  data, not facts.
- Cognitive fatigue is real across a school day: each hour later cost 0.9% SD on Danish national tests;
  a 20-30 min break more than recovered it (Sievertsen, Gino & Piovesan 2016, *PNAS* 113:2621 [S]).
  → The after-school slot starts after a real break (snack, play), not straight from the school bag.
- Movement breaks improve classroom behaviour (Daly-Smith et al. 2018, *BMJ Open SEM*, 6-13 yrs [S]);
  a 2021 meta-analysis of active breaks found an effect on selective attention (*Brain Sci* 11:675 [S]).

### 1.4 Homework, tuition and screens

- Homework-achievement correlation ~0 in grades 3-5, small in 6-9 (Cooper, Robinson & Patall 2006 [S]);
  the "10 minutes per grade" rule comes from the same line of work [S]. → Taxila must not lengthen the
  homework a young child already has; its homework help is about getting unstuck and understanding.
- Private coaching: 27% of students nationally, higher in cities (NSO CMS-Education 2025 [S]); 19.8% in
  NSS 2017-18 [S]. Taxila's after-school slot competes with tuition timings; the plan must accept
  "after tuition" as an anchor.
- IAP 2021: < 2 h/day total screen for 5-10, *including* educational and homework screen time; screens
  must not replace study, play, sleep, family time (Indian Pediatrics [S]). Outdoor time protects eyes:
  +40 min/day outdoors at school cut 3-year myopia incidence 39.5% → 30.4% (He et al. 2015, *JAMA*
  314:1142 [S]).

### 1.5 Engagement mechanics to refuse

- Broken streaks reduce subsequent engagement beyond the missed behaviour (Silverman & Barasch 2023,
  *JCR* 49:1095 [S]); expected tangible rewards undermine children's intrinsic motivation (LS §3.7).
- India's CCPA Dark Patterns Guidelines 2023 name 13 patterns, including false urgency, confirm-shaming,
  forced action, nagging and interface interference [S]. The UK Children's Code std 13 bars nudges that
  weaken protections and *encourages* nudges toward wellbeing [S]. ICO also flags 10-12 year olds as
  "particularly susceptible to reward based systems" (kids-ux §0 [V]).

---

## 2. The constraint map: an Indian school day

A day plan is a fit to fixed blocks the product does not control. Typical shapes [I, to verify per
school via school sync; urban private/CBSE skew]:

| block | B1-B2 (Classes 1-4) | B3-B4 (Classes 5-9) | what it means for Taxila |
|---|---|---|---|
| wake → leave | 06:00-07:15 | 05:45-07:00 | morning slot is tiny or absent; never a wake-up push |
| school | ~07:45-13:30 | ~07:30-14:30 | quiet: app shows "school time", no pushes |
| return, eat, rest | 13:30-15:30 | 14:30-16:00 | the break that recovers fatigue (§1.3) |
| tuition / activities | 0-2 days/week | often 16:00-18:00, 3-6 days/week | tuition is an anchor candidate, not a competitor |
| school homework | 10-40 min | 40-90 min | homework help happens here |
| phone availability | when the parent hands it over (shared phone, ASER 2024 [S]) | own phone for 27-38% of 14-16s [S] | slot timing follows parent availability, learned |
| dinner, family TV | 20:00-21:00 | 20:30-21:30 | reflection before dinner or just after |
| bedtime | 21:00-21:30 | 21:30-22:30 | DC7 margins computed from the parent-set bedtime |

Two consequences. First, the realistic after-school window for a B1-B2 child on a shared phone is
**16:00-19:30**, and for B3-B4 it is **17:00-21:00** with a tuition gap. Second, the parent is the real
scheduler for B1-B3: the phone, the snack, and the permission are theirs. The design therefore makes
the parent the author of the anchor and the child the author of choices inside it.

---

## 3. The day: phases and slots

### 3.1 Day phases (a state machine per child per local date)

```
           06:00                 school start            school end + rest            bedtime-60   bedtime-30   bedtime        06:00
  ┌──────────┐   ┌───────────┐      ┌──────────┐      ┌────────────────┐      ┌──────────┐  ┌──────────┐  ┌─────────┐
  │ morning  │──►│ at_school │─────►│ recovery │─────►│ learning_window│─────►│ wind_down│─►│ closing  │─►│ night   │──► next day
  └──────────┘   └───────────┘      └──────────┘      └────────────────┘      └──────────┘  └──────────┘  └─────────┘
   preview≤3min    no pushes,         no Taxila         homework help,          reflection,   app shows     overnight
   (opt-in)        "school time"      prompts           live lesson, bursts     no new teach  "rest" screen  prep jobs
```

- Holidays and weekends replace `at_school` with `free_day` and widen `learning_window` but not the
  daily cap (§7.2).
- Phase boundaries come from `child_routine` (parent-set) and are refined from observed session times
  (learned send window, kids-ux S10) [I].
- Allowed hours from parent-experience §10 (07:00-20:30 default) intersect with these; the stricter wins.

### 3.2 Slot kinds

| slot | length B1 / B2 / B3 / B4 | when | what it is | evidence |
|---|---|---|---|---|
| `morning_preview` | 0 / 2 / 3 / 3 min, opt-in | morning | audio-led: "today in school you'll see X; one question to wonder about". Before a test day: 3 retrieval items, no new content | prequestioning helps later learning (Pan & Carpenter 2023 review [M]); retrieval LS-18 |
| `homework_help` | ≤ 15 / 20 / 25 / 30 min per day | learning window | §4 | DC5 |
| `live_lesson` | 20 / 25 / 35 / 45 min | learning window | Director-run lesson; opens with 2-4 spaced retrieval items (LS-18) | DC4 |
| `burst` | 3-5 / 4-6 / 5-8 / 5-10 min | anywhere in the window, or as the "tiny day" | 4-8 interleaved retrieval/fluency items, mostly due reviews; a burst can be a game engine round | retrieval [S], interleaving [S] |
| `offline_task` | 2-10 min | inside a lesson or after | off-screen "do": draw, measure the table, count rotis, read aloud to a parent; logged by photo or by tap | concreteness fading LS-19; screen balance §8 |
| `reflection` | 2 / 3 / 4 / 4 min | wind_down | §5.7; voice-led, screen dimmed | DC6/DC7 |
| `parent_note` | (generated) | closing | §6 | DC9 |
| `night_prep` | (server) | night | §9 | DC10 |

**Daily cap** (all slots summed, parent-adjustable, +10 min needs the parent gate): **30 / 40 / 60 /
75 min** for B1-B4 [I]. For 5-10 year olds this keeps Taxila inside a third of IAP's 2-hour total screen
envelope, which also has to hold school assignments and recreation [S + I].

### 3.3 A day, per band (default weekday, school term, no test)

**B1 (Class 1-2, 6-7 yrs), cap 30 min, parent-held plan**

| time | slot | shape |
|---|---|---|
| 15:45 | anchor | "after milk and snack" (parent-chosen if-then) |
| 15:50 | `homework_help` if the parent photographs the diary page or a sheet; else skipped | ≤ 10 min typical |
| 16:00 | `live_lesson` 20 min | 4 segments of ~5 min: retrieval warm-up → concrete teach with an object at home → game round → teach-back to a child-like character; one `offline_task` at minute 10 ("find 3 things longer than your pencil") |
| 16:25 | close | "show Mumma what you made" (outward relatedness, LS-31) |
| 19:30 | `reflection` 2 min (optional, parent present) | free recall of one thing + one picture; no screen brightness |

**B2 (Class 3-4, 8-9 yrs), cap 40 min**

| time | slot | shape |
|---|---|---|
| 16:30 | anchor "after play" | |
| 16:30 | `homework_help` ≤ 15 min | |
| 16:50 | `live_lesson` 25 min | segments ~7 min; movement break at the half |
| 19:15 | `burst` 4 min (optional) | due reviews from yesterday's lesson are *not* here; they wait for tomorrow's warm-up (DC6) unless it is a T1 fluency item already learned on an earlier day |
| 20:00 | `reflection` 3 min | |

**B3 (Class 5-7, 10-12 yrs), cap 60 min, child picks the session goal (1 of 3, kids-ux row 18)**

| time | slot | shape |
|---|---|---|
| 17:00 | anchor "after tuition / after tea" | backup window 19:00 |
| 17:05 | `homework_help` ≤ 25 min | |
| 17:30 | `live_lesson` 35 min | segments ~10 min; break at the half |
| 18:30-20:30 | 1-2 `burst`s, child-initiated | |
| 20:45 | `reflection` 4 min + if-then plan for tomorrow | |

**B4 (Class 8-9, 13-15 yrs), cap 75 min, quiet mode one tap away**

| time | slot | shape |
|---|---|---|
| 18:00 | anchor child-set (B4 may own their plan if the parent allows) | backup 20:00 |
| 18:00 | `homework_help` ≤ 30 min | |
| 18:30 | `live_lesson` 45 min | segments ~12 min; one break |
| 20:00-21:00 | `burst`s, child-initiated | none in the last 60 min before bedtime |
| 21:15 | `reflection` 4 min | |

These are templates. The Conductor fills them per day (§3.4); the child and parent can always do less.

### 3.4 Building the day plan (Conductor, at night and again on first open)

Priority stack, highest first, packed into the daily cap [I]:

1. **Safety and wellbeing holds.** A pending safety follow-up, a `stopped` exit yesterday (vibe §4.6),
   or a parent-set "rest day" ⇒ plan = reflection only or nothing.
2. **School homework due tomorrow** (from diary photo or parent/child entry). Time-boxed; whatever does
   not fit is not Taxila's to finish.
3. **Test window** (§7.3) ⇒ the live lesson topic comes from the test chapters.
4. **Due reviews** (FSRS R < 0.9, `kt-algorithms` §2.6) ⇒ always inside the lesson warm-up (2-4 items)
   and the bursts; never a separate chore.
5. **Level path vs school chapter.** For a child placed below class level (TaRL, LS-28), split new
   learning time roughly **60% foundation path / 40% current school chapter**; test windows flip it to
   **30/70** [I, to tune]. Parent sees the split in both terms (LS-28, parent-experience §7).
6. **Preview tomorrow's school topic** when school sync knows it (a 2-minute prequestion inside today's
   lesson wrap) [M: prequestioning].
7. **Enrichment** (interest-themed game, song for verbatim content only, LS-24) only with time left.

Adaptation inputs and what they may change:

| signal | source | may change | may never change |
|---|---|---|---|
| yesterday ended `strained`/`stopped` | vibe session state | today's opening ramp longer, lesson shorter, offer a burst-only day | evidence standards, the probe budget |
| homework load (photo count, child says "bahut homework hai") | homework_request | lesson shrinks to the minimum segment; bursts dropped | the cap upward |
| test date within window | school_calendar_event | topic choice, mix | sleep margins, cap |
| late start (anchor missed, child opens at 20:30) | day events | plan collapses to a burst or "tiny day" | no "catch-up" next day |
| festival / holiday | calendar | §7.4 holiday mode | |
| parent "rest day" | control | everything off except reflection if the child asks | |
| learning ability (η, θ in KT) | learner model | pace, item difficulty, fast-forward | the cap, the dose of praise |

**No catch-up debt.** A skipped day never doubles the next day. FSRS due items simply stay due; the
scheduler re-prioritises by overdueness [I]. This is DC2 in code.

---

## 4. Homework help (photo → guided help, no answers)

### 4.1 Flow

```
 photo / pick page ─► OCR + layout (taxila-fast vision) ─► item split ─► match to kit item or template
        │                                                              │
        │                                         matched (skill, answer key known)   unmatched
        ▼                                                              ▼                    ▼
 child chooses ONE item ◄────────────────────────────── guided ladder (Director)     "explain the idea"
        │                                                (pump → hint → prompt →      mode: teach the
        ▼                                                 worked ISOMORPHIC item)     concept on a parallel
 child writes their own answer in the notebook ─► optional "check my working" photo   example, never the item
        ▼
 feedback on the STEP that went wrong, not the final value ─► next item or done
```

### 4.2 Rules

- **H1 Never the final answer to the school item.** The Director's answer-leak check (LS-15: code-level,
  "does the output contain the final answer?") runs on every teacher turn in homework mode against the
  answer the matcher computed. The worked example is always an *isomorphic* item with different numbers
  or wording (ARCHITECTURE §1.2: after an assertion, an isomorphic item). [V for the harm: Bastani 2025]
- **H2 Check-my-working tells where, not what.** Allowed: "step 2, look at the borrowing again".
  Not allowed: the corrected number. Free-response language subjects (essays, letters): feedback on
  structure and one sentence the child rewrites; never a rewritten paragraph [I].
- **H3 Time box** per §3.2; at the box the teacher stops at a natural point and says what is left is
  for the child or for school tomorrow. The parent note lists items attempted, not items "done".
- **H4 Evidence.** Homework turns produce evidence in the ledger like lesson turns, tagged
  `context = 'homework'`, but because the parent or sibling may be helping off-mic, homework evidence
  is down-weighted [I: weight to be fitted; start at 0.5 of the folded LR] and never counts as the
  delayed success that makes a skill "pakka".
- **H5 Copied-answer guard.** If the photographed sheet already has answers written (answer key from a
  guide book), the teacher asks the child to explain one; no grading of the rest [I].
- **H6 Privacy.** Diary photos may show other children's names, school names, teacher notes. OCR keeps
  only item text and the chapter guess; the image is deleted after extraction unless the parent turns on
  notebook keep (parent-experience §10 "notebook camera" default off) [I].
- **H7 School sync side effect.** Each homework photo updates the "school is at chapter X" estimate,
  confirmed by the parent once (parent-experience §7 school sync).

### 4.3 Homework state machine

```ts
type HomeworkState =
  | "capturing" | "extracting" | "choosing" | "laddering" | "child_writing"
  | "checking" | "explaining_unmatched" | "timeboxed" | "done" | "abandoned";
// transitions (code, not prompt)
// capturing → extracting (photo ok) | abandoned
// extracting → choosing (≥1 item) | explaining_unmatched (0 matched, ≥1 readable) | capturing (unreadable: retake)
// choosing → laddering (item picked)
// laddering → child_writing (child says ready, or ladder step 3 done with isomorphic item solved)
// child_writing → checking (photo/tap) | choosing (next item)
// checking → laddering (step error found) | choosing | done
// any → timeboxed (minutesUsed ≥ cap) → done
// any → abandoned (exit intent; vibe 'stopped' rule: let them go at once)
```

---

## 5. Inside the slots

### 5.1 Live lesson shape by band

The Director (ARCHITECTURE §1.2) owns the lesson. The Conductor hands it a `LessonBrief`: topic,
segment plan, due-review items, target minutes, hard stop, and tomorrow's preview topic.

| band | segments (minutes) | break | teach-back | wrap |
|---|---|---|---|---|
| B1 20 | retrieve 3 · teach 5 · play 5 · do (offline) 3 · teach-back 3 · wrap 1 | the offline task is the break | child-like character | picture + "show your parent" |
| B2 25 | retrieve 4 · teach 7 · play/practice 7 · break 2 · teach-back 4 · wrap 1 | 2 min movement | child-like character | picture + one sentence |
| B3 35 | retrieve 4 · teach 10 · practice 10 · break 3 · transfer/teach-back 6 · wrap 2 | 3 min | "explain to a classmate who missed it" | 3-line can-do, next choice of 3 |
| B4 45 | retrieve 5 · teach 12 · practice 12 · break 3 · transfer/error-spot 10 · wrap 3 | 3 min | 30-second explainer | can-do + if-then for tomorrow |

The "generated game while the teacher teaches theory" from the owner brief fits the `teach` segment:
the Module planner (ARCHITECTURE §1.2 step 4) configures a library engine in ~2 s; the night job (§9)
has already prepared the parameter sets and images so the in-lesson cost is selection, not generation.

**Hard stop.** At the target minutes the Director moves to wrap at the next natural boundary, never
mid-item; a cliffhanger ending is banned (parent-experience §10) because it is a re-engagement hook [I].

### 5.2 Practice bursts

- 3-10 minutes, entered from the home screen ("ek chhota round?") or as the planned "tiny day".
- Content: due reviews first (overdue first), then interleaved items across 2-3 recently learned skills
  (mild interleaving for B1-B2 after blocked learning, LS §3.5).
- A burst is evidence-producing: its first retrieval of a skill that day updates FSRS S (kt §2.3).
- Ends on a success when possible (pick the last item at pSuccess ≥ 0.8) [I]; never "one more round?"
  prompts more than once.

### 5.3 Spaced revision (the cross-day scheduler)

- Memory state per skill/item from FSRS-6 (`kt-algorithms` §2.3). Desired retention 0.9.
- **Night rule (DC6):** a skill acquired today (first G ≥ 3) is not re-checked today. Its first delayed
  check is placed in tomorrow's lesson warm-up (≥ 20 h, matching the "mastered" criterion).
- **Daily review budget:** ≤ 25% of the day's live-lesson minutes + all burst minutes [I]. If due items
  exceed the budget, schedule by `overdueness = (now - due) / S` and let the rest slide; FSRS tolerates
  late reviews.
- **Interference guard:** do not schedule two confusable skills (same misconception family) as the first
  items of the same warm-up [I].

### 5.4 Morning preview (opt-in)

- B2-B4 only; the parent enables it, and it never fires a notification. It appears if the child opens
  the app before school: 2-3 minutes, audio-led, one prequestion about today's school topic or, on a test
  morning, 3 retrieval items with a calm close ("you know more than you think; read every question
  twice"). Never new teaching, never a score.

### 5.5 Offline tasks

At least one per live lesson in B1-B2 and one every other lesson in B3-B4 [I]. Logged by tap ("ho
gaya") or photo; contributes to screen-time balance (§8) and to concreteness fading (LS-19).

### 5.6 Breaks

In-lesson breaks are short (2-3 min) movement or eyes-off tasks (look out of the window, 20-20-20 for
B3-B4 [M]). Between slots, a ≥ 20-minute gap is enforced between homework help and the live lesson only
if together they exceed 40 minutes (B1-B2) or 60 minutes (B3-B4) [I, motivated by Sievertsen 2016].

### 5.7 Day-end reflection with the teacher

Purpose: one free-recall retrieval of the day (cheap, effective, LS-18), a feeling-free summary, and an
implementation intention for tomorrow. Not purposes: rating understanding (self-report is invalid
evidence, LS-1), extending engagement, or emotional companionship (LS-31).

Shape (as moves, never as lines; persona text is written as shapes):

1. **Recall** - the child says one thing they did or learned today (any language). Logged as a free-recall
   probe; it updates nothing in FSRS (same-day; kt §2.3 counts only the first retrieval per session) but
   tags which memory is salient [I].
2. **Connect** - teacher adds one concrete link (the roti fractions from the lesson, the cricket score in
   the word problem).
3. **Plan** - B3-B4: the child states an if-then for tomorrow ("after tuition, I'll do the fractions
   game"); stored as `routine_anchor.child_plan` and shown back tomorrow. B1-B2: the teacher offers two
   picture choices for tomorrow's game theme (cheap choice, LS-26).
4. **Close** - goodbye at once; no "wait, one more thing", no hooks, no "I'll miss you" (LS-31; vibe
   `stopped` rule). Voice-only with the screen dimmed after the first 10 seconds [I].

If the child skips reflection, nothing happens. If the day had no session, there is no reflection prompt.

---

## 6. Parent day-end note

- **Generated** at the `closing` phase on any day with ≥ 1 completed slot, from ledger facts only
  (parent-experience PX1: evidence or silence).
- **Delivered** in Parent corner (pull) by default; spoken version available (PX10). WhatsApp only if the
  parent picks "daily" (DC9).
- **Shape** (≤ 4 short lines, never pasted into a prompt as a line):
  facts (what was done, minutes) · one specific action the child took (an action, not a trait, PX5) ·
  homework: items attempted with help, not "completed" · tomorrow: the planned topic and whether a test
  is near.
- **Never**: comparisons, inferred feelings, "struggled", red, scores, predictions, or any ask to buy
  (PX4-PX8). On a day with no session: no note, no message (PX7).
- **Lock-screen copy** if pushed: "Riya's day note is ready" (kids-ux S10). Nothing about performance.

---

## 7. Week and term

### 7.1 The week

| day | default shape [I] |
|---|---|
| Mon | fresh-start framing (Dai 2014): the week's 1-2 goals chosen by the child (B3-B4) or shown to the parent (B1-B2); normal day |
| Tue-Thu | normal days |
| Fri | lighter: bursts + a game-heavy lesson; weekly review items |
| Sat | optional; "project" lesson (make something: a model, a story, a song for verbatim content); one family activity in the parent's language (the weekly home task, parent-experience decision 5) |
| Sun | rest by default; the weekly report goes on the parent's chosen day (parent-experience §8); night job builds the week plan |

Weekly targets are **days with any session ≥ 3** and **delayed checks done**, never minutes or streaks.
The child never sees a weekly count; the parent sees it as a fact, not a grade.

### 7.2 Weekends and free days

Same cap; wider window; offline and project tasks preferred; no morning preview. A parent can mark the
weekend "off" in one tap; the Conductor then plans nothing and sends nothing.

### 7.3 Exam-prep windows (unit tests, periodic tests, half-yearly, annual)

Indian CBSE middle-school pattern: Periodic Test 1 a few months into term 1, **half-yearly around
September-October**, Periodic Test 2 mid term 2, **annual in February-March**; the annual includes a
slice of the half-yearly syllabus (10/20/30% for Classes 6/7/8) [S, school and publisher pages; each
school sets its own dates]. State boards differ [I].

Test-window plan, created when a test date and its chapters are entered (by parent, child B3-B4, or
diary-photo OCR confirmed by the parent):

- **Window length:** unit test 5 days; periodic test 7 days; half-yearly/annual 14-21 days [I].
- **Back-scheduling:** for each test skill, place 2-4 retrieval sessions so the last gap before the test
  is ~10-20% of the time to the test, then shorten (Cepeda et al. 2008 [M]); FSRS R-targets are raised to
  0.95 for test skills inside the window [I].
- **Mix:** interleaved, test-format items (competency-style case items for Classes 6-9, LS §5.1); one
  "mock" burst at test length × 0.25 in the last 3 days [I].
- **Last 2 days:** no new content; only retrieval of already-learned skills; misconception cleanup [I].
- **Night before:** short (≤ 15 min), ends early, ends with the if-then for the morning ("when I get the
  paper, I'll read all the questions first") [I + Duckworth 2011].
- **Unchanged:** the daily cap, the sleep margins (DC7, Gillen-O'Neel), the no-streak floor, and honest
  reporting: the parent sees which test skills are pakka vs aa gaya, never a predicted mark
  (parent-experience §9).
- **After the test:** a 2-minute debrief: which questions felt new (school-sync data), then the window
  closes and the plan goes back to normal; results entered by the parent are evidence only for skills
  with item-level detail [I].

### 7.4 Holidays and festivals

- Calendar layers: national gazetted holidays, state/regional festivals (Dussehra ~20 Oct 2026 and
  Diwali ~8 Nov 2026, with Diwali breaks in many schools spanning ~5-24 Nov [S, school calendar
  aggregators]), the school's own calendar (from school sync), and family-entered days (weddings, travel).
- **Festival days:** default plan = nothing. If the child opens the app, offer a festival-themed burst
  (rangoli symmetry, counting diyas, Diwali market prices) - interest-context personalisation (LS-25),
  never pressure.
- **Long breaks (Diwali, winter, summer May-June):** "light mode": 3 days/week suggested, 15-20 min, mostly
  spaced maintenance of skills due + one project per week. Summer vacation is also the best window to
  close TaRL gaps; offer the parent a "summer bridge" plan explicitly, opt-in [I].
- **Re-anchor after every break** (Wood 2005: context change breaks habits). On the first school day
  after a break, the Conductor shows the parent the anchor again ("Taxila time is still after snack?
  change it?") - one card, no push beyond the allowed logistics push [I].

### 7.5 The term and the year

```
Apr        May-Jun        Jul-Aug          Sep-Oct            Oct-Nov            Dec-Jan        Feb-Mar         
session    SUMMER BREAK   PT1 window       HALF-YEARLY        Dussehra/Diwali    PT2 window     ANNUAL window   
start:     light mode +   normal + PT1     14-21 day window   light mode,        normal +       14-21 day window
diagnostic summer bridge  7-day window     (Cepeda back-      festival bursts,   7-day window   + cumulative
+ anchor   (TaRL gap)                       schedule)         re-anchor after                   review of H-Y
setup                                                                                           slice
```

At **session start (April)**, run placement (LS-28, kt §3.4), set the anchor with the parent, and build
the year's level path. Monthly PTM (parent-experience §9) reviews the month.

---

## 8. Screen-time balance

- Taxila's daily cap (§3.2) is a ceiling, not a target; the plan aims at ~70% of it on a normal day [I].
- Every live lesson has an off-screen task (B1-B2) or break (all bands); B1-B2 lessons are audio-led
  enough that the child can look away during the teach segment [I].
- Parent sees Taxila minutes and the off-screen task count; Taxila does not track other apps.
- **Outdoor nudge**: on weekdays where the child's Taxila time ends before 18:00 in daylight, the close
  suggests one outdoor thing, never as a condition ("go play outside" is not a reward for finishing)
  [I; He 2015 for outdoor benefit].
- No autoplay, no infinite feed, no "next lesson starts in 5 s" (CCPA interface interference; LS-27).
- Generated videos (sora-2) are short (≤ 60 s), only where motion is the content (a seed growing, a
  lever balancing), and never queue another [I].

---

## 9. Next-day preparation (overnight)

### 9.1 What runs at night and why at night

The live call cannot wait for generation, and tomorrow is predictable from: school-sync chapter, the
level path, FSRS due list, test windows and the child's chosen theme. The night is when the latency
budget is free and model capacity is cheaper to schedule [I].

Pipeline per child (an Azure Container Apps scheduled job at 22:30 IST enqueues; ACA event-driven jobs
execute; deadline 05:30; hosting is Azure-only per the 2026-10-02 owner directive, all models Azure
OpenAI first-party):

```
build_week_plan (Sun) / build_day_plan (daily)       ─ pure code: §3.4 priority stack
   └─► predict_topics(top 2 with p≥0.3)              ─ from plan + school sync
         ├─► select_engines + params (T1)             ─ taxila-fast, from kit engineHints; cheap; always
         ├─► scene_dsl (T2) where no engine fits      ─ taxila-fast; validated by renderer schema
         ├─► images (gpt-image-2): cache-first by     ─ shared across children by (topic, theme, style)
         │     (topic, theme); per-child only text overlay
         ├─► video (sora-2): LIBRARY ONLY             ─ per topic, not per child; human-reviewed
         ├─► T3 game request → codegen queue          ─ gpt-5.3-codex in a sandboxed job; headless
         │     (only if no engine/DSL fits)              validation; HUMAN REVIEW before library entry;
         │                                               never served to a child the next morning unreviewed
         ├─► lesson_brief draft (Director input)      ─ items from kits; misconceptions; preview prequestion
         └─► parent_note shape check of yesterday     ─ lint PX4/PX5 (already sent? no; only audit)
```

### 9.2 Rules

- **N1 Library first, child second.** Anything visual is generated for a (topic, theme) key and shared;
  per-child personalisation happens through parameters, names and interest context (LS-25) [I].
- **N2 Nothing generated tonight is the only path tomorrow.** Every lesson must run if every night job
  failed (engines + kits are static). Night output is an upgrade, never a dependency [I].
- **N3 Speculation budget.** Prepare at most 2 topics/child/night; measure hit rate (was the prepared
  topic taught?) and cut when hit rate < 50% (DC-M10) [U].
- **N4 Cost cap per child per night** set from `docs/research/realtime-cost-model.py`'s per-lesson
  economics; the job sheds T2/images before it sheds the lesson brief [U: number to be set].
- **N5 Codegen safety.** Generated game code runs only in the existing sandbox (`sandbox="allow-scripts"`,
  no network, typed postMessage, ARCHITECTURE §1.4); headless checks: renders, no network calls, no
  external URLs, no text outside the kit's strings, touch targets per kids-ux tokens, completes its goal
  with a scripted agent [I]. Review is human (ARCHITECTURE §1.4).
- **N6 No per-student VM (DC12).** State = Neon rows + `blob://child/{id}/` prefix; compute = shared
  ephemeral jobs. The owner's "little VM per student" is satisfied *logically*: each child has a durable,
  private workspace (plan, ledger, assets, memories) that the Conductor operates on.

---

## 10. Notification policy

### 10.1 Principles

1. **Recipient = parent** on shared devices (always for B1-B3; B4 on their own phone may receive only
   reminders they set themselves).
2. **Logistics, not learning pressure.** Allowed: a parent-requested reminder at the anchor time, the
   weekly report, a milestone (≤ 1/week), safety, account, payment (parent-experience §11).
3. **Never**: absence ("we miss you"), streaks, countdowns, "your child is falling behind", unread badges
   on the child's profile, variable-reward teasers ("a surprise is waiting"), "last chance", FOMO,
   confirm-shaming opt-outs ("No, I don't care about Riya's marks"), notifications that open into an
   upsell (CCPA 2023 [S]; ICO std 13 [S]; LS-27; PX7).
4. **Self-limiting.** A reminder ignored 3 times in a row pauses itself and asks the parent once, in-app,
   whether to change the time or stop (Beshears flexibility; anti-nagging) [I].
5. **Quiet hours** 20:30-08:00 and during `at_school`, except safety (parent-experience §11).
6. **Lock-screen privacy**: no performance, no topic weakness, no child quote (kids-ux S10).

### 10.2 Caps

| class | recipient | cap | default |
|---|---|---|---|
| anchor reminder ("Taxila time, if it suits today") | parent (B4: self) | ≤ 1/day, ≤ 5/week, paused on holidays/test days off/rest days | off; offered once at onboarding |
| weekly report | parent | 1/week | on (one-tap at onboarding, parent-experience decision 7) |
| milestone or daily note (if "daily" chosen) | parent | together ≤ 1 extra/week, or daily note replaces milestone | milestone on |
| test-window start ("plan for the half-yearly is ready") | parent | 1 per window | on |
| safety | parent | none | on, cannot be turned off |
| account / payment | parent | per event | on |
| **child-addressed** | child | **0** on shared device; B4 own device ≤ 1/day self-set | none |

Total learning-related pushes ≤ 2/week by default (parent-experience decision 6); anchor reminders are
counted separately because the parent asked for them, and they stop when ignored.

### 10.3 Copy rules (lint-gated, bilingual)

Shapes only: name + neutral fact + optional action; no exclamation stacks, no emoji pressure, no time
scarcity words (abhi, jaldi, last, only today, miss), no guilt or loss words (miss, lose, break,
streak, behind, peeche), no anthropomorphic need ("Asha is waiting for you") (LS-31) [I]. The ban list
lives next to PX4's lint and runs in `verify-release` with a negative control.

### 10.4 Implementation notes

- Android 13+ requires the `POST_NOTIFICATIONS` runtime permission [M]; ask for it only when the parent
  turns on a reminder, never at first launch. One channel per class so the parent can mute classes in OS
  settings [M].
- Scheduling: server decides, device displays (Azure Notification Hubs → FCM data message → local
  notification; FCM is the Android transport, not a paid AI/compute service) so caps are enforced in one
  place (`notification_log`) [I].
- WhatsApp: utility templates only (parent-experience §8); reminders are not sent on WhatsApp [I].

---

## 11. Data model

The implementable contracts are in two sibling files so they can be lifted straight into the build:

- `docs/research/conductor/day-cycle.contracts.ts` - `ChildRoutine`, `CalendarEvent`, `PlannedSlot`,
  `PlanReason`, `DayPlan`, `LessonBrief` (Conductor → Director), the `DayEvent` union (app_open,
  profile_selected, slot_offered/started/completed/skipped with `endedBy`, homework_photo,
  calendar_event_added, routine_changed, phase_entered, notification_sent/opened/dismissed, night_job),
  `NotificationClass`, `NotificationIntent`, and the pure gate `mayNotify()`.
- `docs/research/conductor/day-cycle.sql` - `child_routine`, `calendar_event`, `day_plan` (versioned
  jsonb), `day_event`, `homework_request`, `notification_log` (records blocked decisions too, with the
  reason), `night_job` (per step, with cost and output asset keys).

Design points that matter more than the field lists:

- **`mayNotify()` is the only path to a push.** Safety bypasses every cap and quiet hour; anchor reminders
  self-pause after 3 ignored; `milestone` is blocked when the parent chose a daily note (DC9); every
  lock-screen string passes the copy lint. There is **no notification class** for absence, streaks,
  re-engagement or offers, so those messages cannot be sent by construction.
- **`NotificationIntent` has a `notAfter`.** An intent that misses its window expires; it never queues up
  into a burst the next morning [I].
- **`DayPlan.reason[]` per slot** makes every planned activity auditable ("why is fractions on today?"),
  the same discipline as "Kaise pata?" for evidence (parent-experience §7).
- **`day_plan` is versioned** (night job → first open → replan) so a replan after a late homework photo
  never silently overwrites what the parent saw in the morning.
- **`homework_request.image_kept` defaults to false** (H6).

Invariants (tests in `tests/`, each with a negative control): no `day_plan` with `plannedMin > capMin`;
no live-lesson slot whose hard stop is later than bedtime − 60 min; no review of a skill acquired the
same day; `notification_log` never contains a class outside the enum; a skipped day never raises the
next day's `plannedMin` above the normal-day plan; `homework_request` turns never contain the matched
final answer (answer-leak check).

---

## 12. Measurements (log each with n, method, date in `context/measurements.md`)

| id | question | method | decision it feeds |
|---|---|---|---|
| DC-M1 | Does a set anchor raise weekly session days? | randomise "set an anchor now" vs "later" at onboarding; outcome: days-with-session weeks 5-8 | DC1 |
| DC-M2 | How long until Taxila use is automatic? | SRHI-4-style 2-question parent check-in at weeks 2/4/8/12 [U: instrument for children not validated] + session-time regularity | DC3 |
| DC-M3 | Where does attention actually drop? | minute-of-lesson distribution of minimal answers, pata-nahi runs, exits, by band | DC4 segments |
| DC-M4 | Real after-school windows | session start times by band, city tier, own vs shared phone | §2 table |
| DC-M5 | Does homework help hurt independent performance? | preregistered micro-RCT: ladder-only vs ladder + check-my-working; outcome: next-week unaided items on the same skills | DC5 |
| DC-M6 | Same-evening vs next-day first re-check | randomise first re-check timing for T3/T4 skills; outcome: 7-day delayed check | DC6 |
| DC-M7 | Bedtime drift | parent-reported bedtime weekly vs session end times | DC7 margins |
| DC-M8 | Notification opt-out | per class, per cap setting | DC8 caps |
| DC-M9 | Daily vs weekly parent note | parent choice at onboarding; opt-out and report reading at 8 weeks | DC9 |
| DC-M10 | Night-prep hit rate and cost | prepared topic taught next day / prepared; ₹ per child-night | DC10, N3, N4 |
| DC-M11 | Test-window value | skills pakka at test date, window vs no window (natural variation first, RCT later) | DC11 |

---

## 13. Open questions and risks

1. **Child-specific habit evidence is thin.** Lally and Keller are adults; the habit here is partly the
   parent's. DC-M1/M2 are the only way to know.
2. **The day-note vs cadence-cap conflict** (DC9) is resolved by pull-by-default; the design review
   should confirm parent-experience decision 6 stands.
3. **Homework matching coverage.** Many school worksheets will not match a kit item; the
   "explain the idea on a parallel example" fallback needs its own leak check (answer unknown) [U].
4. **School sync quality.** Diary OCR on handwritten Indian school diaries is unmeasured (parent-
   experience §7 [M]).
5. **B4 autonomy vs "parent sees all".** A teen-owned plan on their own phone is good for autonomy
   (Yeager 2018 via kids-ux) but parents may expect control; visibility rules stay as in parent-experience §12.
6. **DPDP 9(3).** Day plans, routines and session-time learning are behavioural data about a child.
   Compliance is deprioritised by owner directive (2026-10-02), so this does not block the build, but the
   design keeps a cheap fallback ready: routine parent-entered only, no learned send window, if counsel
   later rules against it (LS-34). The child-safety floor (DC2, DC7, DC8 bans, safety alerts) is product,
   not compliance, and is not deprioritised.
7. **Festival calendars are regional and religious;** default to national + parent-entered days, never
   infer a family's religion from anything [I].

---

## 14. Sources

Habits and planning
- Lally P, van Jaarsveld CHM, Potts HWW, Wardle J. How are habits formed: modelling habit formation in the real world. *Eur J Soc Psychol* 2010;40:998-1009. https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674 [S]
- Keller J, Kwasnicka D, Klaiber P, Sichert L, Lally P, Fleig L. Habit formation following routine-based versus time-based cue planning: an RCT. *Br J Health Psychol* 2021. doi:10.1111/bjhp.12504. https://discovery.ucl.ac.uk/id/eprint/10118622/1/Jan%20paper.pdf [V]
- Wood W, Rünger D. Psychology of habit. *Annu Rev Psychol* 2016;67:289-314. [S]
- Wood W, Tam L, Guerrero Witt M. Changing circumstances, disrupting habits. *JPSP* 2005;88:918-933. https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Tam_.GuerreroWitt.2005_Changing_circumstances_disrupting_habits.pdf [S]
- Gollwitzer PM, Sheeran P. Implementation intentions and goal achievement: a meta-analysis. *Adv Exp Soc Psychol* 2006;38:69-119. https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes [S]
- Duckworth AL, Grant H, Loew B, Oettingen G, Gollwitzer PM. Self-regulation strategies improve self-discipline in adolescents: benefits of mental contrasting and implementation intentions. *Educ Psychol* 2011;31(1):17-26. [S, summarised in https://lifechangingprinciples.com/wp-content/uploads/2022/07/LCP-Research-Duckworth-2011-Mental-Contrasting-and-Implementation-Intentions.pdf and the 2013 follow-up https://journals.sagepub.com/doi/abs/10.1177/1948550613476307]
- Fogg BJ. *Tiny Habits* (2019); Fogg Behavior Model. https://www.thebehavioralscientist.com/articles/fogg-behavior-model [S]
- Beshears J, Lee HN, Milkman KL, Mislavsky R, Wisdom J. Creating exercise habits using incentives: the trade-off between flexibility and routinization. *Mgmt Sci* 2021;67(7). https://dl.acm.org/doi/abs/10.1287/mnsc.2020.3706 [S]
- Dai H, Milkman KL, Riis J. The fresh start effect. *Mgmt Sci* 2014;60(10):2563-2582. https://pubsonline.informs.org/doi/10.1287/mnsc.2014.1901 [S]
- Silverman J, Barasch A. On or off track: how (broken) streaks affect consumer decisions. *J Consum Res* 2023;49(6):1095-1117. https://www.insead.edu/faculty-research/publications/journal-articles/or-track-how-broken-streaks-affect-consumer [S]

Sleep
- Wilhelm I, Rose M, Imhof KI, Rasch B, Büchel C, Born J. The sleeping child outplays the adult's capacity to convert implicit into explicit knowledge. *Nat Neurosci* 2013;16:391-393. https://www.nature.com/articles/nn.3343 [S]
- Wilhelm I et al. 2008 (children 6-8 vs adults, word pairs), via Peiffer et al. 2020 *Sci Rep*. https://www.nature.com/articles/s41598-020-66880-3 [S]
- Ashworth A et al. Sleep enhances memory consolidation in children. *J Sleep Res* 2014. https://onlinelibrary.wiley.com/doi/abs/10.1111/jsr.12119 [S]
- Mazza S et al. Relearn faster and retain longer: along with practice, sleep makes perfect. *Psychol Sci* 2016;27(10). https://www.sciencedaily.com/releases/2016/08/160822083446.htm [S]
- Gillen-O'Neel C, Huynh VW, Fuligni AJ. To study or to sleep? *Child Dev* 2013;84:133-142. https://www.srcd.org/news/sacrificing-sleep-study-can-lead-academic-problems [S]
- Hale L, Guan S. Screen time and sleep among school-aged children and adolescents: a systematic review. *Sleep Med Rev* 2015;21:50-58. https://www.sciencedirect.com/science/article/abs/pii/S1087079214000811 [S]
- Paruthi S et al. Recommended amount of sleep for pediatric populations (AASM). *J Clin Sleep Med* 2016;12(6):785. https://aasm.org/resources/pdf/pediatricsleepdurationconsensus.pdf [S]

Attention, fatigue, breaks
- Betts J, McKay J, Maruff P, Anderson V. The development of sustained attention in children. *Child Neuropsychol* 2006 (n = 57), as summarised in https://cerj.educ.cam.ac.uk/archive/v8_2021/3.pdf [S]
- Bradbury NA. Attention span during lectures: 8 seconds, 10 minutes, or more? *Adv Physiol Educ* 2016;40:509-513. https://journals.physiology.org/doi/full/10.1152/advan.00109.2016 [S]
- Sievertsen HH, Gino F, Piovesan M. Cognitive fatigue influences students' performance on standardized tests. *PNAS* 2016;113:2621. https://ui.adsabs.harvard.edu/abs/2016PNAS..113.2621S/abstract [S]
- Daly-Smith AJ et al. Systematic review of acute physically active learning and classroom movement breaks. *BMJ Open Sport Exerc Med* 2018. https://www.researchgate.net/publication/324061078 [S]
- Active school breaks and students' attention: a systematic review with meta-analysis. *Brain Sci* 2021;11(6):675. https://www.mdpi.com/2076-3425/11/6/675 [S]

Homework, AI help, screens, Indian context
- Cooper H, Robinson JC, Patall EA. Does homework improve academic achievement? *Rev Educ Res* 2006;76:1-62. https://nces.ed.gov/pubs2009/2009033.pdf [S]
- Bastani H et al. Generative AI without guardrails can harm learning. *PNAS* 2025;122(26). https://www.pnas.org/doi/10.1073/pnas.2422633122 [S]
- Indian Academy of Pediatrics. Guidelines on screen time and digital wellness. *Indian Pediatr* 2021/2022. https://www.indianpediatrics.net/mar2022/235.pdf [S]
- He M et al. Effect of time spent outdoors at school on the development of myopia: an RCT. *JAMA* 2015;314(11):1142-1148. https://jamanetwork.com/journals/jama/fullarticle/2441261 [S]
- NSO CMS-Education 2025 (27% private coaching). https://www.business-standard.com/education/news/education-mospi-survey-private-school-government-scholarship-fees-coaching-tuition-urban-rural-125082601316_1.html [S]
- CBSE middle-school assessment pattern (PT1/half-yearly/PT2/annual). https://www.esaral.com/cbse-class-8-exam-pattern/ [S]; school calendars 2026-27 https://www.cbseguidanceweb.com/cbse-holiday-list-2026-27-complete-school-holidays-vacation-calendar-for-students/ [S]
- Radesky J et al. Constant Companion: a week in the life of a young person's smartphone use. Common Sense Media 2023. https://www.commonsensemedia.org/press-releases/teens-are-bombarded-with-hundreds-of-notifications-a-day [S]

Dark patterns and children's design codes
- CCPA. Guidelines for Prevention and Regulation of Dark Patterns, 2023. https://www.nls.ac.in/wp-content/uploads/2021/04/Dark-Patterns.pdf ; https://iapp.org/news/a/india-s-ccpa-guidelines-on-dark-patterns-welcome-signal-but-law-is-still-soft [S]
- ICO. Age appropriate design code, standard 13 (nudge techniques). https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/code-standards/ [S]

Prior knowledge, not re-checked this session [M]
- Cepeda NJ, Vul E, Rohrer D, Wixted JT, Pashler H. Spacing effects in learning: a temporal ridgeline of optimal retention. *Psychol Sci* 2008.
- Pan SC, Carpenter SK. Prequestioning and pretesting effects: a review. *Educ Psychol Rev* 2023.
- Android `POST_NOTIFICATIONS` runtime permission (API 33) and notification channels.
