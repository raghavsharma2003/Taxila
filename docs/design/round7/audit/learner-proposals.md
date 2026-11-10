# Audit 2026-11-09, learner: proposals for main and the owner

These are the findings in `learner.md` that are not plain bugs: model changes (they need a params version bump), redesigns,
deletions and owner choices. Each says what a child or parent sees now, the change, and what it costs. Nothing here is
built. Ids match `learner.md`.

## Learner model (each needs a params version bump; a replay re-scores stored children)

**LEARN-02 (P1). A child who gets everything wrong ends with a high estimate.**
- Now: 60 wrong answers on a pilot topic end at 0.75-0.83. The "weak foundation" rule and the support level stop treating
  the child as struggling. No screen says "mastered" (the word stays "practising"), but the teacher stops going back.
- Change, pick one: (a) no learning step on a card that ended without a right answer; or (b) drop the 1/j weighting on the
  failure side only, so each wrong card counts in full. Also cap re-teach gain per skill per lesson (today +0.10 each).
- Cost: about half a day with a replay of the pilot sims. (b) is the smaller change.

**LEARN-04 (P2). "Gets the answers" is true for a child who never answered unaided.** Gate the estimate arm of `does` on
the ledger's unaided flag. Only the Director's probes read it today. An hour.

**LEARN-05 (P1). The same answer gets a different mastery when the blind grader is late.** Hold the fallback as
no-evidence and let the late verdict carry the full step. Half a day: it touches `ledger.js` and `later.js` together.

**LEARN-28 (P2). Two open lessons reset every per-lesson evidence cap.** Keep recent lesson budgets by lesson id, not "the
current one". A few hours.

**LEARN-29 (P2, narrowed). A leaked answer counts in full on choice items and probes.** Apply `preAttemptHelp` in
`temper`, as facets already do (half weight). An hour.

**LEARN-25 (P2). Rebuilding a child's model is quadratic** (10 s at 8,000 events on the one replica). Copy the ledger once
per fold, not once per event. Pure speed; no score changes, so no version bump. An hour.

**LEARN-26 (P2). Writers outside the turn fold before taking the lock; Studio answers never reach `skill_state`.** Re-read
`max(seq)` after the lock and refold if it moved; project Studio events like lesson events. Half a day, and Studio owns
half of it.

## Placement and set-up

**LEARN-07 (P1). Any feel answer, even "Easy", starts the child 5-8 chapters back and says "a little before".**
- Now: a class-5 child on 9 Nov with no answer starts at chapter 9 (the calendar); "About right" → chapter 1; "Easy" →
  chapter 2.
- Change: an answer with no below-level signal ("About right", "Easy") sets no start: the calendar start stands. Only
  "Hard" or a child's "tricky" moves the start back. The note follows the start.
- Cost: an hour. Check against `rj-topic-relative-difficulty-easiest-first` (chapter-1 starts were rejected once already).

**LEARN-06 (migration).** `docs/patches/to-platform/003-placement-subjects.patch` widens the `placement` subject check to
the six cold-start subjects. When it lands, widen `PLACEMENT_TABLE_SUBJECTS` in `server/routes/placement.js` to match (the
test `r7-audit-placement-subjects` pins the two together).

**LEARN-10 (P1). Set-up shows raw developer text** ("Failed to fetch", "internal error"). Use the parent corner's error
sentences, but keep field 400s (the spoken-name rule) on their field. Two hours.

**LEARN-43 (P2).** The child step can sit on "One moment" for ever when the PIN read fails. Add "Try again". An hour.
**LEARN-44 (P2).** Classes 1-2 see an EVS chip the server drops; "Not sure" cannot clear an earlier answer. Chips from the
class's own subjects; send "unsure". An hour.
**LEARN-45 (P2).** Board must be picked, but nothing but the header reads it. Default CBSE, not required. Minutes.
**LEARN-46 (P2).** A signed-in parent with no child is asked for consent twice. Skip to the child step when consent is on
file. An hour.

## Conductor

**LEARN-20 (P2). The plan's learner-state decisions (opener, success-first, new-skill budget, foundation share, review
burst) reach neither the home nor the lesson.** A design call for Brain and Learning together: the lesson start would pass
the whole brief, and the Director would read it. Do not turn `TAXILA_CONDUCTOR_PLAN` on before LEARN-01 is in (it is now).

**LEARN-19 (P2).** With limits on, the home's daily cap comes from a stale, band-clamped plan. Use the parent's saved cap.
An hour.
**LEARN-23 (P2).** A new Conductor actor ignores the parent's saved lesson days and length; `settingChangedStmts` has no
caller. Read them at creation, and emit the event from `setControls`. Half a day.

## Parent corner

**LEARN-35 (P1). At 900 px and wider, Teaching and Sign out cannot be reached** (the rail has neither). Add both to the
rail. An hour. This is App's shell pattern: Learning owns `src/parent`, so it is ours, but it changes the look.
**LEARN-16 (P1).** Progress shows nothing for lessons on earlier-class topics. An "Earlier steps" group per subject, with no
class number (`grade-equivalent-parent-band` rejects a class label). Half a day.
**LEARN-36 (P2).** "Download everything" exports the old evidence table. Export the ledger rows (`kt_evidence`), which
every screen shows. An hour.
**LEARN-39 (P2).** Schedule says "planned for 5:00 pm on the days you chose" before anything is saved. Say no time is set
yet. Minutes.
**LEARN-40 (P2).** "Explained in their own words" has two rules. Decision `w2a-checker-explained-line` left it open: drop
the half explanation from the notes so both say the same. Minutes once decided.
**LEARN-41 (P2, owner).** Home says "can now", and decision `reports-k7-locked-words` forbids it anywhere. Owner picks:
narrow the decision to the letters, or change the Home words.
**LEARN-54 (P3).** Small copy and rule mismatches (listed in `learner.md`). An hour together.
**LEARN-30 (P2, content).** A skill mastered and then clearly lost still counts as mastered for the next topic: test
"weak" before "mastered" in `topicStatus`. Minutes; it changes topic choice, so run the pilot sims.

## Deletions (each needs main's go; one commit, with an inbox entry naming the last commit that holds each path)

- **LEARN-37.** The after-bedtime rest line can never fire (nothing writes a bedtime). Remove the after-bedtime branch,
  its templates and its test, or add the bedtime control. Keep the "longer lessons" line.
- **LEARN-42.** The adaptive placement round is unreachable. Mount it or remove `session.js`, `grade.js`, `bank.js` and the
  CAT half of `cat.js`. Keep `schoolYearFraction` and `startChapter` (the cold start uses them). Removing also means
  `tests/rs6-placement`, `r7-learning-placement`, `pair-scope`, two evals, and the decision `rs6-placement-cat`. The fixes
  routed here (retired items, pairs) are on it now, so mounting it is cheaper than it was.
- **LEARN-49 (owner).** The session-first lane (1,069 lines) is off by default but partly runs on every lesson. Ship or
  shelve; shelving is a refactor, not a deletion.
- **LEARN-50.** Dead code in the learner model: `bkt.js` except `MIN_DELAY_MS`, the dead readers in `model.js`,
  `briefSkills`, `reteachOutcomeStmt`, `armPosteriorStmt`, `ratchetStmts`, `COMP_TABLES`. Do not delete `kt/gen.js` (test
  fixture) or `kt/index.js` (an eval); `rep_fluency` and the seam patches are cited by decisions; `protege.js` is specified.
- **LEARN-51.** Conductor: `settingChangedStmts` (or wire it, LEARN-23), `consentChangedStmts`, `actorRowStmts`, `floorTo`,
  `sessionFirstOn`, the handlers with no emitter, and the Scheduler gallery helpers together with their test.
  `conductor_usage` is read and never written: wire or drop the voice-budget rule.
- **LEARN-52.** `parent.js`: `delayedCheckMap`, `topicParentState`, `hafteSpeech`, the `what=hafte` alias, unused
  response fields, and the `comprehension` card (a full fold per evidence open). Set-up: `MeetStep`, `TrustStep` (unrouted).
  `SummaryStep`, `VerifyStep`, `ControlsStep` are reachable by URL and used by e2e tests: keep.
