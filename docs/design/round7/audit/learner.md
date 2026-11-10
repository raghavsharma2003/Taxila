# Audit 2026-11-09: learner (learning engine, Conductor, parent corner, placement, set-up)

Branch `claude/r7-audit-learner`, from `int/r6` at integration 21a. Owner of almost every path here is the Learning stream.

## The four questions, answered

**1. Does a lesson turn on the script-walk path update the learner model?** Yes. I drove the real turn planner (`planTurn`,
`server/brain/turn.js:1642`) over the four pilot scripts on default flags, with a default (M1) child.

- A right answer on a script card (`script:<skill>:ask:e1`) makes one evidence row (`evidenceFrom`, `server/director/state.js:3748`),
  one ledger event, and in the turn's one transaction writes `evidence`, `kt_evidence`, `kt_skill_state`, `skill_state` and
  `comp_facet_state`. Skill s1 of `c5-maths-ch02-t01` went 0.462 → 0.889 on the first right answer and reached "learned today"
  after the second. A whole lesson answered right ends with all three skills "learned today" on all four pilots, so the
  next-topic rule moves on.
- A wrong answer also reaches the store: 0.462 → 0.256, with a `reteach_attempts` row. The first wrong try on a card writes
  only the legacy `evidence` row; the ledger event is written when the card closes (by design, one event per card).
- Two things are wrong on this path: a child who gets everything wrong ends with a HIGH estimate (LEARN-02), and the
  parent's "How do we know?" sheet cannot find the question of a script card (LEARN-24).

**2. Does the Conductor's plan reach the child's home screen, and does it use that state?** Mostly no. The plan is built
(at the first lesson start of the day, at 05:00 by the worker, and 5 minutes after a lesson ends) and it does read learner
state (due reviews, wheel-spinning, placement gap). But the home takes only two numbers from it (the daily cap and "about N
min"), the home's topic comes from a different function (`nextTopicOf`), and the lesson takes only two clock times. Every
learner-state decision the planner makes (opener, success-first, new-skill budget, foundation share, review burst) has no
reader (LEARN-20). One of the two clock times ends a late-evening lesson on the child's first answer (LEARN-01).

**3. Parent corner: real, placeholder or wrong?** Most numbers are real and come from one source (`server/reports/truth.js`).
Wrong or broken: "This month" / "This term" fail with an error for a period with no lessons (LEARN-11); a full week's letter
can fail its own length cap and is never stored (LEARN-12); the monthly hint count is wrong (LEARN-13); the same answer is
worded three different ways on three screens (LEARN-14, 15); Progress shows nothing for lessons on earlier-class topics
(LEARN-16); the Teaching page tells the parent "You thought …" (LEARN-17); "Earlier notes" is out of order (LEARN-18).
Placeholders: "5 minutes" on Try at home, "7 days" on the deletion receipt, a schedule sentence stating a plan nobody saved
(LEARN-39).

**4. Placement: can a new child get a wrong level?** Yes. The adaptive placement round is not reachable from any screen
(LEARN-42). What runs is the "how does school feel" chips. Any answer, even "Easy", starts a class-5 child 5–8 chapters
earlier than giving no answer (LEARN-07), and a chip for English, Hindi or SST makes the save fail (LEARN-06).

## Findings

Status: **fix** = I fix it now under the phase-2 rule; **main** = waits for main's reply (redesign, model change, deletion,
migration, or outside my paths); **report** = for the owner named.

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| LEARN-01 | P0 | broken | learning | A lesson started after the planned window's end wraps on the child's first answer | `server/conductor/slot.js:27-42` | No `hardStopAt` unless the family's limits are on; `wrapAt` = start + target minutes | fixed |
| LEARN-02 | P1 | broken | learning | A child who gets every answer wrong ends with a rising, then high, mastery estimate | `server/learner/kt/ledger.js:199-212,231`, `kt/bktr.js:99-108` | No learning step on a failed card; cap re-teach gain per skill per lesson (params version bump) | main |
| LEARN-03 | P1 | broken | learning | A mix-up can never be cleared in the ledger by lesson answers | `server/learner/live.js:141,148` | Pass `discriminates: item.targetsMisconception` on item events | fixed |
| LEARN-05 | P1 | inconsistent | learning | Same answer, same blind verdict: different mastery depending on whether the grader was late | `server/learner/kt/ledger.js:153`, `server/comprehension/later.js:321-358` | Hold the fallback as no-evidence; let the late verdict carry the full step (params version bump) | main |
| LEARN-06 | P1 | broken | learning | A "how does it feel" answer for English, Hindi or SST makes the save fail (500), then every later save too | `server/routes/placement.js:77,114-121`, `db/migrations/036_placement.sql:9` | Migration widening the subject check (main); until then skip a subject the table refuses instead of failing | fixed (interim) + main (migration: `docs/patches/to-platform/003-placement-subjects.patch`) |
| LEARN-07 | P1 | inconsistent | learning | Any feel answer, even "Easy", starts the child at chapter 1–2 and says "a little before" | `server/placement/coldstart.js:78-91`, `server/placement/note.js:39` | No `startGE` when the answer shows no below-level signal | main |
| LEARN-08 | P1 | broken | learning | A bad "how it sounds" spelling creates the child, then errors; the retry creates a twin | `server/routes/account.js:290-297` | Validate the spelling before the insert | fixed |
| LEARN-09 | P1 | broken | learning | "Add a child" after an interrupted set-up overwrites the existing child | `src/onboarding/ChildProfile.tsx:94-101`, `src/onboarding/draft.ts:50-53` | Clear the draft's child id when the add flow starts | fixed |
| LEARN-10 | P1 | not good enough | learning | Set-up shows raw developer text to the parent ("Failed to fetch", "internal error") | `src/onboarding/ChildProfile.tsx:65,126`, `Consent.tsx:97`, `Setup.tsx:62,98` | Use the parent-corner error sentences | main |
| LEARN-11 | P1 | broken | learning | "This month" and "This term" fail with an error when the period has no lessons | `server/reports/gate.js:106` | Exempt every `header.zero*` shape | fixed |
| LEARN-12 | P1 | broken | learning | A full week's letter with the "lessons getting longer" line fails its own cap and is never stored | `server/reports/claims.js:171,227-235`, `config.js:30` | The rest line takes a row's place on weekly | fixed |
| LEARN-13 | P1 | broken | learning | Monthly "gave a hint N times" counts answers that got no hint | `server/reports/claims.js:19-20`, `check.js:33-34` | Hinted = outcomes 2,3,4; solved = 2,3 | fixed |
| LEARN-14 | P1 | inconsistent | learning | The Notes "How do we know?" drawer and the skill sheet word the same answer differently | `server/routes/parent.js:1399-1400,1441-1442` vs `server/reports/truth.js:112-135` | The drawer uses `engineRow` | fixed |
| LEARN-15 | P1 | inconsistent | learning | The skill sheet says "Right, on their own" where the lesson card says "Right, with a hint" | `server/routes/parent.js:1020`, `src/parent/EvidenceSheet.tsx:48-49` | Send the hinted result word when the row was not first-try unaided | fixed |
| LEARN-16 | P1 | not good enough | learning | Progress shows nothing for lessons taught on earlier-class topics | `server/routes/parent.js:1187-1210` | An "Earlier steps" group per subject (no class number) | main |
| LEARN-17 | P1 | inconsistent | learning | The Teaching page tells the parent "You thought …" | `src/parent/Teaching.tsx:47` vs `src/parent/Home.tsx:253` | Same rewording as Home | fixed |
| LEARN-18 | P1 | broken | learning | "Earlier notes" is not newest first; daily notes fall off the list | `server/reports/store.js:25` | Order by the note's window end | fixed |
| LEARN-20 | P2 | not good enough | learning + brain | The plan's learner-state decisions reach neither the home nor the lesson | `server/routes/child.js:207,271-273`, `server/routes/lesson.js:366` | Needs a Director reader; a design call | main |
| LEARN-04 | P2 | inconsistent | learning | The belief "gets the answers" is true for a child who never answered unaided | `server/comprehension/state.js:33` | Gate the estimate arm on the ledger's unaided flag (params version bump) | main |
| LEARN-19 | P2 | inconsistent | learning | With limits on, the home's daily cap comes from the plan, which is stale and band-clamped against the parent's setting | `server/routes/child.js:156,256`, `server/conductor/planner.js:76` | Use the parent's saved cap | main |
| LEARN-21 | P2 | broken | learning | An Ask or Practice start uses up today's lesson slot and marks the prerequisite check as run | `server/conductor/decide.js:241-242,252-255` | Fall back to the lesson slot only for a live lesson | fixed |
| LEARN-22 | P2 | inconsistent | learning | The home card's lesson length changes after the first start of the day (25 → 22 min) | `server/routes/child.js:74,273` | Use the slot's length only while it is unstarted | fixed |
| LEARN-23 | P2 | not good enough | learning | A new Conductor actor ignores the parent's saved lesson days and length | `server/conductor/step.js:36-45`, `index.js:90-91` | Read them at creation and at sync | main |
| LEARN-24 | P3 | inconsistent | learning | "How do we know?" cannot find the question of a script card; it quotes the teacher's line before it instead | `server/routes/parent.js:974-982` | Resolve `script:` ids from the lesson script | fixed |
| LEARN-25 | P2 | not good enough | learning | Rebuilding a child's model after a restart is quadratic (10 s at 8,000 events) and blocks the one replica | `server/comprehension/fuse.js:47-52`, `server/learner/kt/ledger.js:105` | Copy the ledger once per fold | main |
| LEARN-26 | P2 | not good enough | learning + studio | Writers outside the turn fold before taking the lock; Studio answers never reach `skill_state` | `server/comprehension/later.js:373-391`, `server/placement/kt.js:20-28`, `server/studio/grade.js:173-180` | Guard on `max(seq)` after the lock; project Studio events | main |
| LEARN-27 | P2 | broken | learning | A re-teach nobody answered after is scored as a failed teaching method | `server/comprehension/resolve.js:83-84` | No reward when nothing was graded | fixed |
| LEARN-28 | P2 | not good enough | learning | Two open lessons reset every per-lesson evidence cap | `server/learner/kt/ledger.js:154` | Keep recent lesson budgets by id | main |
| LEARN-29 | P2 | inconsistent | learning | An answer the teacher leaked counts at full weight on mastery but half or none elsewhere | `server/learner/kt/bktr.js:64-71` vs `server/comprehension/facets.js:42` | Half weight in `temper` (params version bump) | main |
| LEARN-30 | P2 | inconsistent | learning (content) | A skill that was mastered and then clearly lost still counts as mastered for the next topic | `server/content/next-topic.js:24-26` | Test "weak" before "mastered" | report (content-data area) |
| LEARN-31 | P2 | inconsistent | learning | A child with no lessons gets a "Try at home" card with Done / Not this week | `server/routes/parent.js:820-831` | None when the week is empty | fixed |
| LEARN-32 | P2 | inconsistent | learning | Home says "This week: can now …" above "Lessons this week: 0" | `server/routes/parent.js:451-463` | One week window for both | fixed |
| LEARN-33 | P2 | broken | learning | An open lesson with no ledger row keeps adding minutes to the week (5,760 by Friday) | `server/reports/truth.js:52-57` | End it at its start, as the stored letter does | fixed (open lesson with no answer counts at most 60 min "so far", in both copies of the rule) |
| LEARN-34 | P2 | inconsistent | learning | Home's "Recent lessons" never gets the short title the Lessons list uses | `server/routes/parent.js:949` | Same topic mapper | fixed |
| LEARN-35 | P1 | not good enough | learning | At 900 px and wider, Teaching and Sign out cannot be reached | `src/parent/Shell.tsx:76-85` | Add both to the rail | main |
| LEARN-36 | P2 | inconsistent | learning | "Download everything" exports the old evidence table, not the one every screen shows | `server/routes/parent.js:1469,1483` | Export the ledger rows | main |
| LEARN-37 | P2 | no longer needed | learning | The "lessons started after the bedtime you set" line can never fire: nothing writes a bedtime | `server/reports/rest.js:17-21`, `templates.js:232-235` | Remove, or add the control | main |
| LEARN-38 | P2 | inconsistent | learning | An unanswered consent shows the "yes" effect text | `src/parent/Pages.tsx:164` | Show the "no" effect when not granted | fixed |
| LEARN-39 | P2 | not good enough | learning | Schedule states "planned for 5:00 pm on the days you chose" before anything is saved | `src/parent/Controls.tsx:87,121` | Say no time is set yet | main |
| LEARN-40 | P2 | inconsistent | learning | "Explained in their own words" has two rules (notes count a half explanation; the lesson card does not) | `server/reports/derive.js:15-16` vs `truth.js:355` | Open item of decision `w2a-checker-explained-line`; drop the half | main |
| LEARN-41 | P2 | inconsistent | owner | Home says "can now"; decision `reports-k7-locked-words` forbids it anywhere | `server/routes/parent.js:1270`, `src/parent/copy.ts:18` | Owner picks: narrow the decision or change the words | main |
| LEARN-42 | P2 | no longer needed | learning | The adaptive placement round (426 items) is not reachable from any screen | `server/placement/{session,grade,bank}.js` and the CAT half of `cat.js`, `server/routes/placement.js:35-67` | Mount it or remove it (keep `schoolYearFraction` and `startChapter`, which the cold start uses); if mounted, fix its class-9 and grader faults first | main |
| LEARN-43 | P2 | not good enough | learning | The child step can stay on "One moment" for ever | `src/onboarding/ChildProfile.tsx:59-67` | A "Try again" on a failed read | main |
| LEARN-44 | P2 | inconsistent | learning | Classes 1–2 are shown an EVS chip the server drops; "Not sure" cannot clear an earlier answer | `src/onboarding/ChildProfile.tsx:109-115,154-171` | Chips from the class's subjects; send "unsure" | main |
| LEARN-45 | P2 | not good enough | learning | "Board" must be picked but nothing reads it | `src/onboarding/steps/Class.tsx:28-44` | Default CBSE, not required | main |
| LEARN-46 | P2 | not good enough | learning | A signed-in parent on a new device is asked for consent twice | `src/onboarding/steps/Class.tsx:35` | Skip to the child step when consent is done | main |
| LEARN-47 | P2 | inconsistent | platform | On a paired child device the Hello feel picks are refused (same as PLAT-07) | `server/pair/scope.js:6,12` | Allow `POST /api/placement/onboarding` in the scope (platform); the handler now drops `parentView` from a device (learning half, fixed) | report (platform) |
| LEARN-48 | P3 | broken | learning | Weave callbacks that lose an opener slot are closed unasked (latent: no kit has hosts) | `server/comprehension/store.js:58-63` | Keep expired entries open | fixed |
| LEARN-49 | P3 | no longer needed | learning + owner | The session-first lane (1,069 lines) is off by default and no deploy file turns it on; parts of it run on every lesson (`schoolPointerStmts`) | `server/director/session/**`, `flags.js:20-23` | Owner decides: ship or shelve | main |
| LEARN-50 | P3 | no longer needed | learning | Dead code in the learner model and comprehension engine | see note | Delete | main |
| LEARN-51 | P3 | no longer needed | learning | Dead code in the Conductor; `conductor_usage` is read but never written | see note | Delete or wire | main |
| LEARN-52 | P3 | no longer needed | learning | Dead code in the parent routes and set-up screens | see note | Delete | main |
| LEARN-53 | P3 | inconsistent | learning | `shared/learner.ts` types lag the server | `shared/learner.ts:91,149-154` | Add `"late"` to `via` and `placementPending` to `Ledger` | fixed |
| LEARN-54 | P3 | inconsistent | learning | Small copy and rule mismatches in the parent corner | see note | See note | main |

Counts after the skeptic pass: P0 1 · P1 18 · P2 27 · P3 8. Broken 16 · inconsistent 21 · not good enough 11 · no longer
needed 6. None refuted; 15 corrected (see "Skeptic pass" below).

### Routed in from other audits (all fixed on this branch)

| id | sev | from | title | fix | status |
|---|---|---|---|---|---|
| CD-01 (parent copy) | P1 | content-data | Progress counted every kit skill, so a topic with a skill that has no item (reading aloud, or all items dropped at load) never showed as finished | One helper, `askableSkillIds` / `decidingStates` in `server/content/next-topic.js`, decides a topic on its askable skills for both `nextTopicFor` and the parent's Progress page | fixed |
| CD-13/14 (placement side) | P2 | content-data | Placement must skip `retired: true` items and never ask two items of one `pairId` | `poolFor` draws only usable items; `nextItem` drops a candidate whose `pairId` was asked; `loadBank` keeps retired items so an old round still reads | fixed |
| homework | P1 | content-data | "fractions ka homework hai" found only the subject: findTopic got the whole sentence | The caller strips filler and activity words (`FILLER`), tries the words together then one by one; `findTopic` unchanged; subject names reach the subject rung | fixed |
| PLAT-07 (learning half) | P1 | platform | A paired device could change parent fields when no PIN is set, and send `parentView` | `updateChild` refuses parent fields from a device (403); onboarding takes only `childPicks` from a device. The scope change stays with platform | fixed |
| PLAT-08 | P2 | platform | A password with a space at either end, set through reset, could never log in | Signup and login read it as typed; `passwordMatches` also tries the trimmed form so older accounts still log in | fixed |
| PLAT-09 | P2 | platform | Deleting a child left its paired device's session alive, read as a parent session by three hand-written joins | `childEraseStmts` deletes the devices' `auth_session` rows in the erasure's transaction, before the child row | fixed |
| PLAT-10 | P2 | platform | The sign-in burst limiter was keyed on a cookie the caller chooses | Keyed on the ingress's address (rightmost hop) unless the caller already checked the session | fixed |
| PLAT-52 | P3 | platform | PATCH child skipped POST's checks; account delete left `tx_in` | `childPatchOf` checks and shapes every field as POST does; both cookies cleared | fixed |

## Fixes on this branch (phase 2)

Each has a test that fails without the fix. Tests: `tests/r7-audit-learner.test.mjs` (LEARN-21, 24, 27, 31, 38, 48, 53),
`r7-audit-reports` (11, 12, 13, 18), `r7-audit-parent-words` (14, 15, 17), `r7-audit-mixup-discriminates` (03),
`r7-audit-placement-subjects` (06), `r7-audit-onboarding-add` (09), `r7-learning-day-plan` (01), and for 08 the account suite.

| id | what changed |
|---|---|
| LEARN-01 | `server/conductor/slot.js`: the plan's window binds a lesson only when the family's limits are on; otherwise the lesson wraps at its planned length from the start. |
| LEARN-03 | `server/learner/live.js`: a right answer on an item that targets a mix-up carries `discriminates`, so the ledger's mix-up can come down. |
| LEARN-06 | `server/routes/placement.js`: a feel answer for a subject the table refuses is kept but makes no row. **Interim**: the migration widening 036's check is `docs/patches/to-platform/003-placement-subjects.patch`. |
| LEARN-08 | `server/routes/account.js`: the spoken-name check runs before the child insert. |
| LEARN-09 | `src/onboarding`: Add a child forgets a stale draft child id. |
| LEARN-11, 12, 13, 18 | `server/reports`: empty month and term notes pass the gate; the weekly rest line takes a row's place; hints are counted from C2 (one pinned count in `r7-learning-reports-monthly` changed); notes are listed by window end. |
| LEARN-14, 15, 17 | `server/routes/parent.js`, `src/parent`: the Notes drawer reads results through `engineRow`; a right answer after help is "with a hint" on the skill sheet; Teaching names the child. |
| LEARN-21 | `server/conductor/decide.js`: only a lesson (kind `live`, or none) falls back to today's lesson slot. |
| LEARN-24 | `server/routes/parent.js` `scriptCardOf`: a `script:` item key resolves to its authored prompt on the skill sheet. |
| LEARN-27 | `server/comprehension/resolve.js`: no answer within the 30-day horizon closes the attempt with no outcome and no reward. `tests/comprehension-reteach.test.mjs` pinned "failed, reward 0" for this case with no recorded reason; it now expects the new result. **Main: say if the old result was intended.** |
| LEARN-31 | `server/routes/parent.js` `tryAtHomeFrom`: no card for a week with no lesson. |
| LEARN-34 | `server/routes/parent.js`: Home's recent lessons use the Lessons list's topic mapper. |
| LEARN-38 | `src/parent/copy.ts` `consentEffect`: an unanswered choice shows the "without it" effect. |
| LEARN-48 | `server/comprehension/store.js`: expired weave entries stay out of the closing update. |
| LEARN-53 | `shared/learner.ts`: `via` gains `late` and `placement`; `Ledger.placementPending`. |

| LEARN-22 | `server/routes/child.js` `cardMinutes`: the card shows the plan slot's length only while no lesson has started today. |
| LEARN-32 | `server/routes/parent.js` `homeHeadline`: no lesson this calendar week → "No lessons this week", never a claim from last week. |
| LEARN-33 | `server/reports/truth.js`, `claims.js` `lessonEndMs`: an open lesson with no answer counts at most `OPEN_SO_FAR_MAX_MIN` (60) in a "so far" view. |

LEARN-22, 32 and 33 were fixed by the second learner session (tests in `r7-audit-parent-home`); the two sessions ran in
parallel and their fixes were merged into one version each. More tests: `r7-audit-askable-skills`,
`r7-audit-placement-retired-pairs`, `r7-audit-homework-sentence`, `r7-audit-account-platform` (routed findings),
`r7-audit-weave-expired`, `r7-audit-script-card-prompt`, `r7-audit-learner-types`.

Proposals for every **main** item (model changes, redesigns, deletions, owner choices): `learner-proposals.md`. Proposed
context entries: `context/inbox/r7-audit-learner.json`.

## Evidence notes

Scratch scripts named below were run with `DATABASE_URL=` blank, pure functions only, and are not in the repo.

**LEARN-01.** `lessonBriefOf` sets `hardStopAt` to the slot's window end on the learning day and rebuilds `wrapAt` from
HH:MM on that day. `server/routes/lesson.js:366` puts both on the lesson; `server/director/state.js:2523` wraps as soon as
`hardStopAt` has passed. Run: class 2, plan built 05:20, window 15:00–20:00, lesson started 20:05 → the first child turn's
move is `wrap` (phase `done`); the same lesson without the brief → `hook`. Class 5, window 16:00–21:00, started 21:10 →
`wrap`. Window ends are 20:00 (classes 1–2), 20:30 (3–4), 21:00 (5–7), 21:30 (8–9). This is a clock gate on default flags,
which decision `dc-r14-no-clock-gates` removed ("I am not even able to test after the time").

**LEARN-02.** Two mechanisms, one result. (a) Every new card applies the learning step whatever its outcome
(`ledger.js:231`), while wrong answers weigh 1/j and their lesson total is clamped (`bktr.js:99-104`), so after two failed
cards the bad evidence is spent and each further failed card only adds. Six failed cards: 0.218, 0.262, 0.395, …, 0.666.
(b) Every re-teach adds up to +0.10 (`applyTeach`, `TEACH_CAP`), and on the script walk every wrong answer brings a
re-teach. My all-wrong lesson on `c5-maths-ch02-t01`: 0.462 → 0.256 → 0.226 → 0.319 → 0.401 after 11 wrong answers; 60
wrong answers end at 0.755 / 0.76 / 0.825 on the three pilots tried. Effect: the "weak foundation" rule
(`server/content/next-topic.js:26`, attempts ≥ 3 and estimate < 0.4) and the support level (`server/director/fading.js`)
stop treating this child as struggling. The display word stays "practising", so no screen claims mastery. Decision
`learner-bktr-ledger` set the budget for the positive side only. `rejected.md:291` (re-teach on every graded turn) fixed
the count of re-teaches, not their gain.

**LEARN-03.** `grep -rn discriminates server` finds it set only in `play/evidence.js`, `play/grade.js` and
`studio/grade.js`. Run: three hits on a mix-up, then six unaided right answers on items that target it → `p=0.983 hits=3
resolvedAt=null` throughout. The legacy `misconception_state` row does resolve (`brain/turn.js:1780`), so the teacher's
brief and the parent Home (legacy table) say cleared while the Director's beliefs and the reports (ledger) say open.

**LEARN-04.** `does = recent ≥ 2 || pL ≥ 0.6`. Runs: taught but never answered → 0.659; six failed cards → 0.666; one
leaked answer → 0.907; all read "shallow" (does: yes). The parent text for it ("Gets the answers on their own") is computed
on every evidence open but no screen renders it, so today this steers only the Director's probes.

**LEARN-05.** Two right answers then a "why": blind grader says full, in time → understanding 0.437, "learned today"; same
verdict arriving late → 0.159, "practising". Blind grader says absent, in time → "practising"; late → "learned today".

**LEARN-06.** Table check: `subject in ('maths','evs','science')`; no later migration changes it. `COLD_SUBJECTS` has six.
`mergeAnswers` commits the answers first (`placement.js:110`), so every later save re-hits the refused subject. The parent
corner shows a chip per subject (`src/parent/SchoolPlan.tsx:155`). Confirmed at the SQL level on a scratch Postgres with 036.

**LEARN-07.** Class 5 maths on 9 Nov: no answer → chapter 9 (calendar); parent "About right" → chapter 1, note says "starts
a little before the class's current chapter"; parent "Easy" → chapter 2; only parent "Easy" + child "easy" → chapter 4.
The class prior sits at the start of the class year, the expectation at 73% through it. `rejected.md`
`rj-topic-relative-difficulty-easiest-first` is the same outcome (chapter-1 starts) by another route.

**LEARN-08.** `insert into child` (290-293) runs before `spokenNameOf(body.nameSpoken)` (296), which throws 400 on a
digit, full stop or quote. The client stores the child id only on success (`ChildProfile.tsx:100-101`).

**LEARN-09.** Code read, not run. The draft's `childId` is saved right after the create and cleared only at the end of the
step. If a later request fails and the parent leaves, both "Add a child" entries reuse the draft and PATCH the first child
with the sibling's name and class. `clearDraftChild` exists and has no caller.

**LEARN-11.** `gate.js:106` exempts only `header.zero`; `header.zero_month` and `header.zero_term` also carry no facts.
Run: monthly and term previews throw `ReportGateError … claim_without_facts(header:header.zero_month…)`; the route does
not catch it.

**LEARN-12.** Weekly caps: strength 1 + rows 2 + tricky 1 + home 1 + rest 1 = 6 against body 5. Run (four 10-minute then
four 25-minute lessons, all sections present): `cap(body 6 > 5)` for the preview and for the stored letter. The letter job
dies and Home's Try at home goes with it.

**LEARN-13.** Outcome 1 is "a later try, no hint" (`learner/kt/adapter.js:8,26`) but is in the hinted set. Run, five such
rows: "gave a hint before any answer 5 times; 5 of those were then solved". `check.js` mirrors the rule, so the checker
agrees with the error.

**LEARN-14, 15.** A second-try answer: skill sheet "Right, with a hint" (via `engineRow`), Notes drawer "Partly right · on
their own" (local sets at `parent.js:1399`). A right answer after asking for help: lesson card "Right, with a hint",
skill sheet "Right, on their own" (`result: right` hides the help words).

**LEARN-16.** The page lists `topicSequence(child.class_level, …)` only. The curriculum has 248 cross-class prerequisite
links and `pickTopic` follows them. Not to be fixed with a class label (`rejected.md` `grade-equivalent-parent-band`).

**LEARN-18.** `order by period desc` sorts four text formats together. Run: `2026-W45, 2026-W32, 2026-T1, 2026-11-08, …`.

**LEARN-19, 22, 23.** Runs on the planner: class 2, parent chose 45 minutes → plan cap 30; class 7, parent lowers 45 → 15
→ next day's plan still 45 (`setControls` emits no setting-changed event; `settingChangedStmts` has no caller). Class 5
home card: "about 25 min" before the first start, "about 22 min" after.

**LEARN-20.** `grep` for `.successFirst`, `.opener`, `.newSkillBudget`, `.foundationShare`, `.promisesDue`,
`.holdNewTopics`, `.reviewItemIds` outside `server/conductor/` and `server/director/session/prior.js`: nothing.
`planToday` on home open is behind `TAXILA_CONDUCTOR_PLAN=on`, which no deploy file sets. Do not turn that on before
LEARN-01 is fixed: more children would have a plan and so a hard stop.

**LEARN-21.** Run: a 2-minute homework lesson → `doneSlotIds ['2026-11-10:L1']` and `prereqChecked` set for a check that
never ran (suppressed for 3 days).

**LEARN-24.** Script cards are stored with `item_key = script:<skill>:ask:<beat>` / `:<checkId>` / `:then:<mix-up>`;
`itemPrompt` looks only in the kit's items. On the script walk that is every card of the taught part.

**LEARN-25.** Timed: 1,000 events 267 ms, 4,000 events 2.1 s, 8,000 events 10.6 s; the same 8,000 in one batch 160 ms.
`scripts/deploy-azure.mjs:90,420` runs one replica.

**LEARN-27.** Run: no answer at all, 32 days later → `{"outcome":"failed","final":true,"reward":0}`, which adds a failure
to that method's shared posterior for every child.

**LEARN-33.** An open lesson (`ended_at` null) with `state.did` but no `kt_evidence` row runs to "now" in the Home tally.

**LEARN-42.** No file under `src/` calls `/api/placement/start` or `/answer`. If it is mounted: the bank has classes 3–8
only, so a class-9 child answering class-8 items right is declared "ahead" (start 9.35); an all-wrong round extrapolates to
start 0.9; the grader credits "not Roots" on a key of Roots (940 of 968 negated keys), credits "no one" on a key of 1, and
rejects "3.25 pm" on a key of "3:25 p.m.". These are beyond the cases `rj-rs6-grader-letter-index-first` fixed.

**LEARN-48.** Run (six entries, three opener slots, second lesson start): `done,done,done,expired,expired,expired`,
nothing kept open. Latent: no kit carries `weaveHosts`.

**LEARN-50 (each checked for importers in `server/ src/ scripts/ api/ tests/ evals/`, package scripts, Dockerfiles).**
`server/learner/bkt.js`: only `withDue` and `MIN_DELAY_MS` are used by live code, the rest by two tests.
`server/learner/model.js`: `loadSkillStates`, `loadDueSkills`, `saveSkillState`, `flagMisconception`,
`loadKtSkillStates`, `loadKtMisconceptions`, `ktDueCount` have no caller; `loadLedger` has one test and differs from the
live fold. `brief.js briefSkills`: tests only. `comprehension/probes/protege.js`: no caller at all.
`comprehension/store.js`: `reteachOutcomeStmt`, `armPosteriorStmt`, `ratchetStmts`, `COMP_TABLES`. `rep_fluency` is read
(`session.js:90`) and never written. `comprehension/seam-patches/*.patch`: both already applied (they no longer apply
forward or in reverse) and the Dockerfile ships them. `kt/gen.js`, `kt/index.js`: tests and evals only. Nothing moves a
child out of legal mode M1, so every M0, M2 and M3 branch is unreachable today (keep: it is the consent design).

**LEARN-51.** No caller: `settingChangedStmts`, `consentChangedStmts`, `actorRowStmts` (`conductor/index.js:75-88`),
`floorTo`, `sessionFirstOn`. No statement anywhere writes `conductor_usage`, so the voice-budget rule cannot fire from it.
Handlers with no emitter: `slot.shown/started/completed/skipped`, `skill.milestone`, `parent.pause`, `parent.resume`,
`budget.threshold`, `school.day_override`, `app.closed`. In `Scheduler.tsx` / `schedule.ts`: `TimeGrid`, `timeGrid`,
`moveSummary`, `weeklySummary`, `defaultTimeOptions`, `fmtTimeCompact` are used only by the dev gallery, which is not a
build input. Stale comments: `hooks.js:61-65`, `index.js:10-17`.

**LEARN-52.** `parent.js`: `delayedCheckMap`, `topicParentState`, `hafteSpeech`, the `what=hafte` alias, unused imports
`topicStatus` and `GRADER_WORDS`; `foldDelayedChecks` is tests-only. Response fields no client reads: `isHafte`,
`chaptersTouched`, `topicsPakka`, syllabus `next`, lessons `evidence_count`, reports `today/thisWeek/lang/langs`, and the
`comprehension` card (a full ledger fold on every evidence open, read by one prod test). Set-up: `MeetStep`, `TrustStep`,
`SummaryStep`, `VerifyStep`; draft fields no screen sets (`reportChannel`, `child.address`, `comfort`, `hardToHear`,
`interests`, `schoolMedium`). `ControlsStep`, `CheckStep`, `HandoverStep` are reachable only by URL but e2e tests use them.

**LEARN-54.** "So far. It updates after the day ends." on week, month and term previews (`Report.tsx:81`); the drawer's
lesson minutes use `ended_at` only (`parent.js:1446`); "Listen to this page" leaves out the next lesson in three home
states (`parent.js:1301`); the drawer and the skill sheet use different words for the grader; FSRS has no longest gap (a
sixth on-time review is scheduled for 2042, `kt/fsrs.js:52-54`); `ledger.js:17` says replay is "byte for byte" but
`prior.seq` differs (tests strip it).

## Coverage

- **Read fully (by me or a sub-audit):** `server/learner/**` (except `affect.js`, skimmed), `server/comprehension/**`
  (`probes/shapes.json` by shape only), `server/conductor/**` (seven small plumbing files read without comments;
  `jobs.js` first 60 lines), `server/reports/*.js`, `server/placement/**`, `server/routes/parent.js`, `account.js`,
  `placement.js`, `child.js`, `server/director/session/**` (`intake.js` header and exports only), `src/parent/**`,
  `src/onboarding/**` (not the two CSS files), `src/ui-v3/Scheduler.tsx`, `schedule.ts`, `shared/interests.js`.
- **Sampled:** `shared/learner.ts` (most), `server/brain/turn.js` (the turn planner and its writes),
  `server/routes/lesson.js` (start, end, summary), `server/director/state.js` (script walk, evidence, wrap),
  `server/director/script.js`, `server/content/next-topic.js`, `server/reports/truth.js` (full for the trace), migrations
  by grep, `data/placement` by shape and counts.
- **Not read:** `server/reports/eval/**` and its two result files, `src/parent/parent.css` beyond the rail rules, the live
  Container App's own environment (flags are judged from the Dockerfiles and deploy scripts only).
- **Run:** the turn planner over the four pilot scripts (all right, all wrong, mixed, an M0 child); the planner and brief
  for LEARN-01, 19, 21, 22; report previews for LEARN-11, 12, 13, 18; ledger folds for LEARN-02 to 05, 25, 27 to 29, 48;
  the cold start for LEARN-07. Not run against a database or a browser: LEARN-08, 09, 26, 43, 46, 47 are from the code.
- **Skeptic pass:** see below.

## Skeptic pass

One sub-agent was given the 54 findings and asked to refute each at its `file:line`, defaulting to refuted when it could not
reproduce. I then re-read the code for LEARN-01, 03, 11, 12, 13, 14 and 24 myself. Result: none refuted, 37 upheld, 15
corrected. The corrections are now in the table and here:

- **LEARN-06:** set-up offers only maths and EVS or science (`src/child/feel.ts:10`), so the failing save is reachable from the
  parent corner's School plan (`SchoolPlan.tsx:155`), not from set-up.
- **LEARN-14:** the example was wrong. A second-try answer (C1) reads "Right, on their own" on the skill sheet (`truth.js:117`)
  and "Partly right" in the Notes drawer. The disagreement and the fix stand.
- **LEARN-20:** no child or parent sees it; unused wiring and a design call. P1 → P2.
- **LEARN-24:** the fallback quotes the teacher's line just before the child's answer, which is normally the turn that asked
  the card. P2 → P3.
- **LEARN-29:** narrower. On open items a leak becomes C4 on mastery, not full weight; full weight holds only for choice items
  and probes (`temper` ignores `preAttemptHelp`, facets halve it).
- **LEARN-35:** a parent on a laptop cannot sign out. P2 → P1.
- **LEARN-39:** the deletion receipt's "7 days" is not a placeholder: decision `dek-in-pitr-database` backs it. The schedule
  sentence finding stands.
- **LEARN-42:** `cat.js` cannot go whole: `schoolYearFraction` and `startChapter` are live in the cold start.
- **LEARN-45:** the board is shown in the parent header (`Shell.tsx:111`); only logic ignores it. The fix stands.
- **LEARN-47:** the same finding as PLAT-07. The handler side is fixed here; the scope is platform's.
- **LEARN-49:** 1,069 lines, and not inert: `state.js`, `lesson.js`, `compile.js` and `rows.js` import it and
  `schoolPointerStmts` runs at every lesson end. Shelving it is a refactor, not a deletion.
- **LEARN-50:** `withDue` is dead too. Not to be deleted: `kt/gen.js` (a fixture for five tests) and `kt/index.js` (an eval
  uses it) move instead; `rep_fluency` read-only is a recorded decision (`decisions.md:2138`); the seam patches are cited at
  `decisions.md:2138,2177`; `protege.js` is specified in COMPREHENSION-ENGINE §4.4.
- **LEARN-51:** the Scheduler helpers are pinned by `src/ui-v3/__tests__/schedule.test.mjs`; delete together if at all.
- **LEARN-52:** `SummaryStep` and `VerifyStep` are routed (reachable by URL only), like `ControlsStep`. Only `MeetStep` and
  `TrustStep` are unrouted.
- **LEARN-53:** `OUTCOMES` matches the server. The real lags are `via` without `"late"` and `Ledger` without
  `placementPending`.

Fix notes from the skeptic: LEARN-02 can also be fixed by dropping the 1/j weighting on the failure side; LEARN-03's fix
should also cover script `:then:<mix-up>` cards; LEARN-10's fix should keep field-level 400 messages (the spoken-name rule)
on their field.
