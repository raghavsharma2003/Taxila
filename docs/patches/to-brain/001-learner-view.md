# F Learning → A Brain, 001: the learner view and today's subjects (round 7 F items 1 and 4)

Both are reads Learning owns; the call sites are Brain's (server/routes/lesson.js, server/director/state.js). No patch to
your files is needed for them to work: until you call them, lessons start exactly as today.

## 1. θ, weak, minutes-left: `server/learner/view.js`

```js
import { learnerViewOf } from "../learner/view.js";
// in startLesson, after `const live = await liveP` and the kit are known (pass both: no second fold, no second kit read)
const view = await learnerViewOf(child, { topicId: topic.id, ledger: live.state, kit });   // null on any failure
// view.theta.value  number on the GE scale, or null (fewer than 2 scored observations: keep today's C - 0.5 default)
// view.weak.weak    boolean; view.weak.reasons ("topic" | "prereq" | "theta"); view.weak.skills
// view.minutesLeft  { limitsOn, today, slot, by, deadlineAt }: today is null when the family's limits are off
```

- Item selection: `buildPracticeQueue(kit, { activeMisconceptionIds, classLevel, theta: view?.theta?.value ?? undefined, weak: !!view?.weak?.weak })`
  in `server/director/state.js` initLessonState (today it passes neither, so every child is treated as on-track).
- D5 mid-lesson limit: when `view.minutesLeft.today != null`, a turn after `deadlineAt` finishes the current question, then wraps.
  `deadlineAt` is computed at start; for a long lesson, call `minutesLeft(await limitsFor(child))` again (`server/routes/child.js`).
- Pure parts (`strandTheta`, `weakOn`, `minutesLeft`, `learnerView`) are unit-tested in `tests/r7-learning-view.test.mjs`.

## 2. Today's subjects: `server/reports/truth.js subjectsToday`

`nextTopicOf(child)` (home and a plain Start with no topic) now follows the rotation (timetable → test window → due
reviews → least-recently-taught). For the session-first intake:

```js
import { subjectsToday } from "../reports/truth.js";
const today = await subjectsToday(child).catch(() => null);
sessionStartCtx({ ..., subjects: today?.subjects ?? [] })   // director/session/start.js keeps the first two
```

For QA D10 (a mid-lesson subject switch): re-plan with `nextTopicFor(child, { subject })` (content/next-topic.js), or say
"today is {today.subject}" using `today.why` ("timetable" | "test_window" | "due_review" | "rotation").

## 3. The lesson-1 placement warm-up (round 7 F item 6)

The placement API is live behind migration 036 (registered through `server/routes/child.js`):
`POST /api/placement/start { childId, subject? }` → `{ placementId, item }` or `{ skip: true }` (classes 1-2, or no bank);
`POST /api/placement/answer { childId, placementId, itemId, response }` → `{ done: false, item }` or `{ done: true, summary }`;
`GET /api/placement/result?childId=`. Items carry `prompt_en`/`prompt_hi`, `format` ("numeric" | "mcq") and shuffled `options`;
never the key. The verdict per item is never returned (it must not feel like a test).

Start hook (yours): on a child's first lesson (no prior lesson row) for classes 3-9, run 5-12 placement items as the warm-up
beat, game-like, before the topic's hook; send each answer to `/api/placement/answer`. When it is done, the next topic
choice already uses the result (`reports/truth.js nextTopicForPlan` passes `startGE` to `nextTopicFor`; the school's chapter,
when the parent set one, still comes first). The parent sees "Where {child} is starting" on Progress.

Not yet wired (Learning, week 2): seeding the KT strand prior from `result.placement` (`kt/ability.js initialBase({ placement })`)
needs a per-child fold context that replay also uses; until then placement steers topic choice only.
