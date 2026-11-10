# The learner model's facts, for the round-8 reader (2026-11-10)

Main asked six questions before a Director-side reader trusts what the learner model knows. Each answer below was
checked against the code and has a test in `tests/r7-learner-evidence.test.mjs` (the test number matches the question).
Where the code was wrong, it is now fixed on `claude/r7-audit-learner`.

## 1. Which params version is written on an evidence row?

- **Was wrong.** `ktEvidenceStmt` stamped every row with a hard-coded `"kt-r2-2026-10-07"` when the event carried none
  (`server/learner/writer.js:159`). No event sets its own version.
- **Fixed:** it now writes the ledger's own constant, `PARAMS_VERSION` (`server/learner/kt/ledger.js:31`, kt-r3).
- **No row was ever folded with the wrong parameters.** Nothing in `server/` reads `kt_evidence.params_version` back:
  every fold replays every row with the code's current parameters. The column is a label only.
- **Rows already written:**
  - Rows from before kt-r3 say kt-r2 and were written under kt-r2. That is correct.
  - Rows written between the kt-r3 commit and this fix say kt-r2 but were written under kt-r3. kt-r3 reached int/r6 today
    and has not been released, so production has none of them.
  - No migration is needed. If a reader ever splits rows by params version, it should use the row's `created_at`, not
    this label, for rows written today.

## 2. Help on a script card

**Was wrong. Help on a script card never raised the hint level.** I drove the real turn planner over the
`c5-maths-ch02-t01` pilot:

- **Authored simpler.** "pata nahi" gets the card's simpler, the hint level stays 0, and the next right answer was
  stored as **C0**: unaided, first try.
- **A miss.** A miss on a script card closes it as C4, then a re-teach, then the remediation's follow-up card. When the
  card came back, a right answer was stored as **C0** again.

**The fix is written but not applied: it changes what the Director does.** It is
`docs/patches/to-main/001-script-card-help.patch` (`server/learner/live.js` only).

What the patch does:

- `closeEvents` records three things in the lesson's `kt.ep`, carried from episode to episode:
  - a script card that had its simpler said;
  - a card that was missed and closed;
  - a card whose key was said at a give-up.
- `answerEvents` uses that record for a later right answer on the same card (`cardHelp`):
  - simpler said, or a miss → one rung → **C2** (assisted);
  - key said → **C4**, the same as a kit item that closes without a right answer (a "leave").

Why it is held:

- With it, three Brain replay predicates fail:
  - `r7-brain-v64` "R3 predicate", offtopic and steady c5-t01: a bare word-for-word re-pose;
  - `r7-brain-v68` "B1‴: the live part".
- Those runs were recorded with every such answer counted C0. Counted C2, the Director's beliefs are lower and the walk
  re-poses a card.
- So the evidence fix has to land together with a Brain change, or with re-recorded runs.
- Its tests (2b to 2d) are in `tests/r7-learner-evidence.test.mjs`, marked todo.

**The key after a give-up, against a kit item's leave:**

- On the walk, a card's first miss closes it as C4. That is the same outcome a kit item gets when its episode ends
  without a right answer (`closeEvents`, `hintsUsed: 4` with the episode ended).
- A script card that is let go has its key said in code (`state.js` `gave`) but is not marked spoiled. So if it comes
  back, her answer counts as a fresh C0 today. The patch makes it C4.

## 3. A lesson that opens at a learned skill's check card

What the ledger does today (`server/learner/kt/ledger.js:358`, `393`):

- **No double "learned".** Learned-today can only be reached from practising or below (line 393). A second right
  answer on a learned skill raises pL and nothing else; `learnedAt` stays.
- **It is the delayed check only when all of these hold:**
  - a later lesson;
  - at least 2 learning days after the anchor;
  - an item this skill was never answered on (`novel`, line 297);
  - before any re-teach of the skill in that lesson.
- **Outcomes when it is the check:** a pass sets `flags.delayed` (mastered); a miss counts in `delayedMisses`, and two
  misses demote.
- **Otherwise it is ordinary evidence:** the next day, or a repeated item, is a review. It neither counts for the check
  nor uses it up.

**For the reader:**

- The ledger already handles it as "a delayed check passing or failing". The reader does not need to tell it anything.
- **There is one trap.** A script check card's id is the same in every lesson (`script:<skill>:c1`). Once she has
  answered it, it is never novel again. A lesson that opens on the check card she answered yesterday cannot pass the
  delayed check, however well she does.
- **The reader should open on a check card of that skill she has not answered.** For example `c2` or `c3`, or a kit
  item of the skill. Otherwise the check needs another source of novelty, which would be a ledger change.

## 4. What games add, and who reads it

- **How game answers get in.** A game round's answers come in as `play:<levelId>` events with `via: "game"` inside the
  lesson turn (`server/brain/turn.js:1706`). They go into `kt_evidence` and `kt_skill_state`, and into `skill_state`
  through the turn's own projection.
- **What counts and what doesn't:**
  - They count on K at half weight (`SOURCE_WEIGHT.game`).
  - They are never "unaided" for learned, and they can never be the delayed check (`game` excluded, ledger line 358).
- **Readers:**
  - The next lesson reads the ledger through `loadLive`, so its `skills` snapshot (`snapshotFromKt`) sees what games
    added.
  - The Conductor reads `kt.wheelSpin` from `kt_skill_state` and `kt.dueCount` from `skill_state`, both of which include
    game rows.
- **Test 4:** six game levels cleared on a skill raise pKnown above the prior in the next lesson's snapshot. They do
  not make the skill learned or checked.

## 5. The same decisions at a start with no day plan

- **New:** `lessonDecisions` (`server/conductor/planner.js:154`) holds the planner's rules for the lesson slot:
  - R8: the opener;
  - R1 and R15: success-first;
  - R15 and a test under 2 days away: the new-skill budget;
  - R5: the prerequisite check;
  - R9: the foundation share.
- **The planner now calls it.** Every planner test is unchanged, and the plan hashes are the same.
- **New:** `lessonDecisionsAtStart(childId, { now, subject })` (`server/conductor/slot.js:105`) computes the same
  decisions at a lesson start without a plan, from the same inputs read at that moment:
  - the Conductor state, when the child has one: last active day, success-first-next, prerequisite checks already run,
    test windows;
  - the view's wheel-spinning skills, placement gap and first-week rule;
  - the lesson's subject.
- `decisionsFromState` (line 119) is its pure half.
- **Test 5:** the two paths give equal results on the same inputs. With no Conductor state, the result is the plain
  defaults.
- **One difference to know:** the plan picks its subject by rotation (`slotSubject`); a start passes the lesson's own
  subject. They agree when the subjects agree.

## 6. "Learned and its delayed check passed", per skill

- **Added.** `snapshotFromKt` (`server/learner/live.js:276`) now carries `learnedChecked`: display at least learned
  today, and `flags.delayed`. It reaches the lesson through the `skills` map that `initLessonState` already receives.
- **Test 6:** false right after learning, true after a passed delayed check on a new item.
