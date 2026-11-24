# F Learning → A Brain, 006: lesson start applies the Conductor's LessonBrief (round 7 F, learning-conductor-day-plan)

**The gap.** The planner writes today's lesson slot into `day_plan`: opener, success-first, the new-skill budget, the test
chapters, promises due, and now R5's prerequisite check and R9's foundation share. No start reads it.
`server/routes/lesson.js` passes `dayPlan.plan` to `sessionStartCtx`, but `dayPlan` is `routes/child.js planFor`'s
summary for the home (`{ openLesson, window, openUntil, limits }`), which has no `slots`. So
`director/session/prior.js planPrior` always sees no lesson and falls back to its defaults (`standard_retrieval`,
`successFirst: false`, `newSkillBudget: 1`).

**Learning's side (landed, `server/conductor/slot.js`):**
- `lessonBriefFor(childId, { now, lessonId })` returns `{ plan, brief }`:
  - `plan` is today's adopted conductor plan (latest version), which is what `planPrior` expects.
  - `brief` is the §4.5 LessonBrief cut from its `live_lesson` slot.
- It returns `null` when the child has no plan today or on any read error. The start then runs exactly as now.
- The brief carries no θ, η, gap or sibling field (V26, V30).

Brief fields:
- `slotId`, `planVersion`, `subject`, `targetMin`, `segments[{ kind, minutes, lane }]`;
- `wrapAt` (start + targetMin, never past the window) and `hardStopAt` (the slot's window end, ≤ bedtime − 60);
- `holdNewTopics`, `newSkillBudget`, `opener`, `successFirst`, `soloRounds`, `promisesDue`, `reviewItemIds`, `testChapters?`;
- `prereqCheck? { skillId, forTopicId, prereqTopicId }` (R5);
- `foundationShare?` (R9);
- `why[]` and `adaptTrace[]` (ops only, never compiled into a prompt).

## The patch (yours to apply; all in files you own)

1. **`server/routes/lesson.js`, at the start (next to `planP`):**
   ```js
   import { lessonBriefFor } from "../conductor/slot.js";
   // next to: const planP = planFor(child, guardian);
   const briefP = early(lessonBriefFor(child.id, { now: new Date() }));
   ```
   Then where `sessionStartCtx({ ... plan: dayPlan.plan ?? null ... })` is built:
   ```js
   const today = await briefP;                       // null → exactly today's behaviour
   const sessionFirst = sessionStartCtx({ purpose, child, plan: today?.plan ?? null, /* unchanged: */ levelPathTopic: topic.id, ledger, now,
     guardian, topicChosen: !!body.topicId || !!routed });
   ```
   Then keep the brief on the lesson state for the governor and the wrap, e.g. in `initLessonState({ ctx: { …, lessonBrief: today?.brief ?? null } })`.

2. **Wrap:** where the lesson decides it is time to wrap (cap or bedtime), also wrap at the next natural stop once `now ≥
   lessonBrief.wrapAt`, and never run past `hardStopAt`. Finish the current item, at most one wrap per item (§4.6, D5).

3. **`server/director/session/prior.js planPrior`** (already reads `opener`, `successFirst`, `pace.newSkillBudget` and
   `why` from the slot) gains the two new knobs:
   ```js
   prereqCheck: lesson?.prereqCheck ? { skillId: lesson.prereqCheck.skillId, forTopicId: lesson.prereqCheck.forTopicId, prereqTopicId: lesson.prereqCheck.prereqTopicId } : null,
   foundationShare: typeof lesson?.foundationShare === "number" ? lesson.foundationShare : null,
   ```
   - `decide.js`: when `prior.prereqCheck` is set and the session's topic is its `forTopicId`, treat its `prereqTopicId` as a
     known foundation: `foundation_first` with that foundation. Check it before teaching, the way `foundationFor` would
     after a missed confirm probe. At most once per lesson (V18).
   - `foundationShare` is the share of the lesson's teaching minutes the level path may give to foundation work (R9; ≤ .6).
     Use it as the ceiling on foundation segments, never as a line she says.

## Check
- `tests/r7-learning-day-plan.test.mjs` covers the brief and `lessonBriefFor` (latest version, null without a plan, null on a read error).
- After (1), a session-first start on a day with a plan should show `prior.opener` and `prior.successFirst` equal to the slot's.
