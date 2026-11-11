# F Learning → A Brain, 007: the homework start (round 7 F, learning-homework-help; shape agreed with App 2026-11-04)

App's Home sends "HOMEWORK HELP" to Ask with `?homework=1`. Learning has landed the match ladder:
- `POST /api/homework/match { childId, text } → { match }` on `claude/r7-learning`, implemented in `server/homework/match.js` and routed in `server/routes/child.js`.
- `match` is `{ rung: "kit_item" | "topic" | "subject", topicId, subject, chapter, topicTitle, itemId? }`, or null.
- It runs in memory with no model call: about 4 ms warm, about 170 ms on a class's first call.

App shows "Is this from <chapter>?" for the kit_item and topic rungs, then starts the lesson. Two pieces are yours.

## 1. `shared/contracts.ts` (single owner: you)
```ts
export type LessonPurpose = /* existing */ | "homework";
// LessonStartRequest: purpose gains "homework"; plus
//   matchTopicId?: string | null   // null = the child said "Not this" to the matched chapter (ignore any match)

export type HomeworkRung = "kit_item" | "topic" | "subject";
export interface HomeworkMatchRequest { childId: string; text: string }            // text ≤ 500
export interface HomeworkMatch {
  rung: HomeworkRung; topicId: string | null; subject: string; chapter: number | null; topicTitle: string | null;
  itemId?: string;        // rung kit_item: the kit question it matched (a look-alike comes from the same topic)
  score?: number;         // rung kit_item: the word overlap, 0.6-1
}
export interface HomeworkMatchResponse { match: HomeworkMatch | null }
```

## 2. `server/routes/lesson.js` start
- Add `"homework"` to `START_PURPOSES`.
- The start body is `{ childId, purpose: "homework", firstText, topicId? , matchTopicId? }`:
  - `topicId` is present only when the child tapped Yes on the chip.
  - `matchTopicId: null` means "Not this".
  - With no `topicId`, route `firstText` exactly as a `doubt` start does (`purposeSeam.routeAsk`).
- Safety: `firstText` passes `scanSafety` exactly as a doubt's does. A homework start is a doubt start with `purpose: "homework"`.
- Your Ask beat (pipeline item 14, brain-ask-homework-flow) teaches the method: the problem on the board, the steps, never the answer. The card is a kit-verified look-alike from `topicId`; with `itemId`, avoid that exact item.
- The parent's "Homework help today" (`child_controls.homework_until`) already puts Home in the homework state. No Conductor change is needed for v1.

## Check
- `tests/r7-learning-homework.test.mjs` covers the ladder: a kit question, reworded, maps to its item; a chapter word maps to the topic; subject words alone give the subject rung, only for subjects the class has; anything else gives null.
- After your step 2, a start `{ purpose: "homework", firstText, topicId }` should open on that topic with the Ask beat.
