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

## 7. Home play: what a level won at home does to the ledger

The rule (test 7, `server/learner/kt/ledger.js` `homeDay` / `homeSpend`, helper `server/learner/kt/home.js`):

- **How it is told apart.** A home level result is a game event (`via: "game"`) whose id starts `home:`
  (`home:<child>:<day>:<level>:<n>`; session `home:<child>:<day>`). `homePlayEvent` builds it from the signed result. The
  `kt_evidence.via` check has no "home", so the id carries it, and a replay of the stored rows gives the same answer.
- **Weight:** the game weight, ×0.5 (`SOURCE_WEIGHT.home`). A goal with one decision (a coin-flip goal) is also marked
  `controllerEasy`: the chance weight, and never clean.
- **Never unaided.** A home win never sets the "unaided" day, so home play alone can never make a skill learned today.
- **Never the delayed check, and never spends it.** It is a game act; the lesson's first new card that day is still the
  check.
- **Capped per skill per learning day:** its log-evidence is clamped to ±log 3 (`HOME_DAY_LOG_CAP`, a 3× likelihood
  ratio), and it takes at most one learning step a day. In the test, 40 clean wins in an afternoon move pL by at most that
  ratio and one step.

**Does the trail change the weight? No. It changes the outcome.**

- The process trail is read as a lesson card's episode is (`openOutcome`):
  - a first-try win is C0;
  - a win after misses is a later try (C1);
  - a win after hints is assisted (C2);
  - a loss is a miss.
- A named mal-rule in the trail becomes the event's `misconceptionId`, so a wrong rule she keeps using raises that mix-up,
  the same as in a lesson.
- Undos and step counts are ignored: they say how she played, not whether she knew.
- Weighting by trail on top of that would count the same signal twice.

## 8. The one mixed skill that moved from "learned today" to "practising"

In the pilot replay (`evals/learner-pilot-replay/results/2026-11-10/`), one mixed child's skill `c5-maths-ch02-t02` s1
was "learned today" under kt-r2 and is "practising" under kt-r3. Traced card by card:

- Two of her cards ended without a right answer: e2, and C4 twice. Under kt-r2 each still added a learning step. Under
  kt-r3 a failed card adds none (LEARN-02).
- At her third unaided right answer (e3, turn 9), her estimate is 0.9476 under kt-r3, just under the 0.95 that "learned
  today" needs. Under kt-r2 it was about 0.96, so she was learned there.
- By the time her estimate passes 0.95 (turn 14 on), her answers are hint-assisted (C2). "Learned today" also needs two of
  the last three answers unaided and right, and that fails. So she stays practising.

This is the intended effect of LEARN-02, not a new fault: her unaided answers came before her estimate earned them, and the
answers after it were helped.

## 9. Two rulings for the reader's compressed opener and its mix-up probe

**(a) A lesson the reader opened "compressed" at a learned skill's first check card** (test 8, `ledger.js` `RECHECK`):

- **How the reader marks it:** `recheck: true` on that card. `live.js` carries it to the event as `shapeId: "recheck"`,
  stored in `kt_evidence.shape_id`, so a replay folds it the same way.
- **A right answer** is a re-check of the learned skill:
  - It is the delayed check when the usual conditions hold: at least 2 learning days on, and a card she never answered
    (item 3's trap still applies).
  - Otherwise it is a review.
  - It never records a second "unaided on first exposure" day, and never a second "learned".
- **A miss** is an ordinary miss on K. Then the full unit is walked. Its effect on status, at once, from any level at or
  above "learned today":
  - display goes back to **practising**;
  - `flags.delayed`, `durable7` and `durable30` are cleared;
  - `learnedAt`, the unaided day and the generative day are reset;
  - `refresh` is set.
- **Why one miss is enough here** (an unmarked delayed check needs two): the reader skipped the teaching because of that
  status, and the miss withdraws it. The walk that follows can earn "learned today" again in the same lesson; the test
  shows it does.

**(b) A probe card posed first because she holds an open mix-up (`needsVerify`)** (test 9, `live.js` `disc`):

- A right, unaided answer on a card whose `targets` include that mix-up is discriminating evidence against it, as on a
  then-card today. This holds for a check card (`scriptCheck.targets`), an explain beat's card (`scriptAsk.targets`), a
  then-card or a kit item (`targetsMisconception`).
- **The reader also sets `probeFor: <mix-up id>` on the card.** When `targets` lists several mix-ups, the one it was
  posed for is the one discriminated. Without `probeFor`, the first listed is used.
- One event carries one `discriminates`, as the column does.

## 10. What the round-8 reader reads at a lesson start

Each one is tested in test 10.

- **`delayedPassed: boolean`** in each skill of the lesson's skills snapshot (`snapshotFromKt`): it is `sk.flags.delayed`.
  `learnedChecked` stays; it is the same flag and display at least learned today.
- **Mix-ups as rows:** `misconceptionRowsOf(ledger, k = 5)` in `server/learner/live.js` returns
  `[{ id, p, needsVerify, hits }]`. Unresolved ones only, highest p first; `needsVerify` is p ≥ 0.7.
- **The brief with no day plan:** `lessonBriefWithoutPlan(childId, { now, subject })` in `server/conductor/slot.js`
  returns `{ opener, successFirst, newSkillBudget, prereqCheck: { skillId, forTopicId, prereqTopicId } | null,
  adaptTrace }`. It includes `foundationShare` only when R9 fired. The pure half is `briefShapeOf(decisionsFromState(...))`.
  - `adaptTrace` lists the rules that fired. R1 means her last lesson ended hard. R15 means her first week. The two
    appear apart, so the reader can tell them apart.
  - The planner's `lessonDecisions` now returns the same list as `rules`.
- **Last active day and consent:** `startFactsOf(child)` in `server/conductor/slot.js` returns
  `{ lastActiveDay, rememberLikes }`.
  - `lastActiveDay` is the Conductor's counter. With no Conductor state, it is the learning day of her last lesson in her
    time zone.
  - `rememberLikes` is the guardian's "memory" consent for that child (`hasConsent(guardian, child, "memory")`), the flag
    that allows remembering what she likes.
