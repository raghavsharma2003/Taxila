# Audit 2026-11-09, learner: proposals for main and the owner

What is not fixed on the branch, in main's three groups: decisions first (each with a failing test on a concrete child),
one-line calls, real redesigns. Then the controls hidden for SEAM-09 and what is left of the deletions. Ids match
`learner.md`. Nothing here is built.

## 1. Decisions first (learner model, placement, set-up)

Each has a test in `tests/r7-audit-learner-pending.test.mjs` that fails today. It is marked `todo`, so the gate stays
green; drop the `todo` with the fix. A model change needs a params version bump, and a replay re-scores stored children.

**LEARN-02 (P1). A child who gets every answer wrong ends with a high estimate.**
- Test: one class-5 skill, 10 cards in one lesson, each ending without a right answer (C4). After 1 card the estimate is
  0.147; after 10 it is 0.704. The weak-foundation rule (`next-topic.js`: 3+ attempts and below 0.4) never fires, so the
  child is moved on instead of back.
- Smallest change (tried against the test: it passes): in `kt/ledger.js` (line 231), no learning step (`transition`) for an
  item event whose evidence is negative. A card that ended without a right answer teaches nothing, so the estimate cannot
  climb on failures.
- What else it moves:
  - Every wrong-then-right sequence loses one learning step per failed card, so "learned today" can come one right answer
    later on a hard skill.
  - More "weak" topics mean more back-chaining to prerequisites, and the support level stays higher for longer.
  - Replay the four pilots and the next-day-check sim before shipping.
- Tried and not enough: weighing failed cards in full instead of 1/j (`bktr.js` `spend`). The session clamp (±log 50)
  still stops them, and the learning steps still climb: 0.704 after 10, as now.
- Re-teach gain (+0.10 per re-teach, `applyTeach`) adds to the climb on the script walk. Cap it per skill per lesson as a
  second step if the replay still climbs.

**LEARN-04 (P2). "Gets the answers" is true for a child who never answered.**
- Test: taught twice and never answered (estimate 0.659, no answers at all). The ladder (`comprehension/state.js:33`)
  reads `does` and puts the child above "not yet".
- Smallest change: `does = recent ≥ 2 right || (pL ≥ K_DO && the ledger's unaided flag)`.
- What it moves: only the Director's probe choice. No screen shows this state today.

**LEARN-05 (P1). The same blind "why" verdict gives a different state when it arrives late.**
- Test: two right answers, then a "why". The classifier guessed "none" and the blind grader says "present".
  - In time: learned today (0.980).
  - Late: practising (0.905). The late verdict reaches U and T but never K (`ledger.js:153`).
- Smallest change: when a why is held for the blind grader, fold the fallback as no-evidence on K. Let the late
  correction carry the K step (`later.js` `lateEvent` drops `via: late` for K and keeps it for U/T).
- What it moves: every why answer whose verdict settles late (the settle stats log the share) moves K by the verdict
  instead of the guess. The replay order changes, so the ledger's "byte for byte" replay test needs its seq strip extended.

**LEARN-07 (P1). Any "how does school feel" answer starts a class-5 child 7 chapters back.**
- Test: class 5 maths on 9 Nov. The calendar alone gives chapter 9; a parent's "Easy" gives chapter 2 and "About right"
  chapter 1. The note then says "starts a little before".
- Smallest change: in `coldstart.js` `coldStartResult`, return no start (null) for "fine" and "easy" with no child
  "tricky". Only a below-level signal moves the start back. The note follows (no `easier` line without a start).
- What it moves: most families answer "About right", so most children start at the calendar chapter. Placement still
  learns from lessons (`refinedStart`). Check against `rj-topic-relative-difficulty-easiest-first`: chapter-1 starts were
  rejected once already, by another route.

**LEARN-10 (P1). Set-up shows raw developer text** ("Failed to fetch", "internal error").
- Test: `ChildProfile.tsx`, `Consent.tsx` and `Setup.tsx` set the error from `errText(e)`, which is `e.message`.
- Smallest change: `setErr(parentError(e))` (`src/parent/copy.ts`). Keep a 400 that names a field (the spoken-name rule)
  on its field.
- What it moves: copy only.

**LEARN-06 (migration).** `docs/patches/to-platform/003-placement-subjects.patch` widens the placement subject check to
the six cold-start subjects. When it lands, widen `PLACEMENT_TABLE_SUBJECTS` in `server/routes/placement.js` to match;
`r7-audit-placement-subjects` pins the two together.

## 2. One-line calls (small; mostly need a yes)

| id | sev | what is wrong now | the change | cost |
|---|---|---|---|---|
| LEARN-19 | P2 | With limits on, the home's daily cap comes from a stale, band-clamped plan, not the parent's setting | `child.js:266`: use `controls.capMin` first | minutes |
| LEARN-29 | P2 | A leaked answer counts in full on choice items and probes | `bktr.js` `temper`: half weight on `preAttemptHelp`, as facets do (params bump) | an hour |
| LEARN-30 | P2 | A skill mastered then clearly lost still counts as mastered for the next topic | `topicStatus`: test "weak" before "mastered" (rerun pilot sims) | minutes |
| LEARN-36 | P2 | "Download everything" exports the old evidence table | export `kt_evidence` rows | an hour |
| LEARN-39 | P2 | Schedule says "planned for 5:00 pm on the days you chose" before anything is saved | say no time is set yet | minutes |
| LEARN-40 | P2 | "Explained in their own words" has two rules | drop the half explanation from the notes (decision `w2a-checker-explained-line` left it open) | minutes |
| LEARN-41 | P2 | Home says "can now"; `reports-k7-locked-words` forbids it anywhere | owner: narrow the decision to letters, or change Home's words | minutes |
| LEARN-43 | P2 | The child step can sit on "One moment" for ever when the PIN read fails | a "Try again" on a failed read | an hour |
| LEARN-44 | P2 | Classes 1-2 get an EVS chip the server drops; "Not sure" cannot clear an answer | chips from the class's subjects; send "unsure" | an hour |
| LEARN-45 | P2 | Board must be picked, but only the header shows it | default CBSE, not required | minutes |
| LEARN-46 | P2 | A signed-in parent with no child is asked for consent twice | skip to the child step when consent is on file | an hour |
| LEARN-25 | P2 | Rebuilding a child's model is quadratic (10 s at 8,000 events, one replica) | copy the ledger once per fold, not once per event (no score change) | an hour |
| LEARN-28 | P2 | Two open lessons reset every per-lesson evidence cap | keep recent lesson budgets by lesson id (params bump) | a few hours |
| LEARN-37 | P2 | The after-bedtime rest line can never fire: nothing writes a bedtime | owner: add a bedtime control, or remove the branch (`rest.js`, two templates, `check.js:268`, its test) | an hour either way |

## 3. Real redesigns

**LEARN-20 (P2). The plan's learner-state decisions reach neither the home nor the lesson.** These are the opener,
success-first, the new-skill budget, the foundation share and the review burst. The lesson takes only the two clock times.
Brain and Learning together: the lesson start passes the whole brief, and the Director reads it. Turning
`TAXILA_CONDUCTOR_PLAN` on is now safe for the clock (LEARN-01 is fixed), but it is pointless until there is a reader.

**LEARN-23 (P2). A new Conductor actor ignores the parent's saved lesson days and length**, and `settingChangedStmts` has
no caller. Read them when the actor is created, and emit `parent.setting_changed` from `setControls`. Half a day.

**LEARN-26 (P2). Writers outside the turn fold before taking the lock; Studio answers never reach `skill_state`.**
Re-read `max(seq)` after the lock and refold if it moved; project Studio events as lesson events are projected. Half a
day; Studio owns half of it.

**LEARN-16 (P1). Progress shows nothing for lessons on earlier-class topics.** Add an "Earlier steps" group per subject,
with no class number (`grade-equivalent-parent-band` rejects a class label). Half a day.

**LEARN-42 (P2). The adaptive placement round is unreachable.** Main told content-data to use its code (retired items,
pairs), so it is not deleted. Mount it (fix the class-9 and grader faults in `learner.md` first) or remove it later.

**LEARN-49 (P3, owner). The session-first lane** (1,069 lines) is off by default but partly runs on every lesson. Ship it
or shelve it. Shelving is a refactor, not a deletion.

## 4. Controls hidden for SEAM-09: wiring them into the child plan

Hidden on the branch (values kept): Extra time to answer, Data saver, Words on screen, Larger text and a calmer screen.
`src/parent/controlReaders.ts` lists each with `reader: null`. A control comes back when its reader is named there, and
`r7-audit-control-readers` checks the reader really reads the column. What each would take:

- **Words on screen** (`captions_always`): send it in the home payload (`child.js` already reads it into `controls`).
  The child app makes it the default of `prefs.captionsAlways` (`src/child/ChildShell.tsx:123`), and the child's own Me
  switch still overrides it. App owns the client half. Two hours. This one matters most: set-up writes it from the
  "hard to hear" answer.
- **Larger text and a calmer screen** (`comfort_mode`): the same path into `prefs.largeText` plus reduced motion. Two
  hours, App.
- **Extra time to answer** (`extra_time`): pass it in the lesson start, and Voice scales the end-of-turn silence and
  barge-in timers (normal / more / most, for example ×1, ×1.5, ×2). Half a day, Voice.
- **Data saver** (`data_saver`): pass it in the lesson start. Voice picks the lower-rate audio and the client skips
  pictures above a size. Half a day across Voice and App, and only worth it once audio cost per lesson is measured.
- **Weekly letter channel** (`report_channel`): already hidden until a second channel sends. Its reader is Platform's
  Notifier.

## 5. Deletions done and left

Done (`15969844`, inbox entry `r7-audit-learner-dead-code-removed`): the dead readers and writers in `learner/model.js`,
`floorTo`, `sessionFirstOn`, `delayedCheckMap`, `topicParentState`, `hafteSpeech`, two unused parent imports, and the
`TrustStep` alias.

Left on purpose, each with its reason in the inbox entry:
- Cited by context as open work: `reteachOutcomeStmt`, `armPosteriorStmt`, `actorRowStmts`.
- Designed call sites: `consentChangedStmts`, `settingChangedStmts` (LEARN-23).
- Used by a test, an eval or a pending patch: `kt/gen.js`, `kt/index.js`, `withDue`, `loadLedger`, `MeetStep`.
- Waiting on a decision: the placement CAT (LEARN-42), the session-first lane (LEARN-49), the bedtime branch (LEARN-37).
- Not done yet: the Scheduler gallery helpers and their test (LEARN-51), and the unused response fields and the
  `comprehension` card in `parent.js` (LEARN-52). The client must be checked field by field first.
