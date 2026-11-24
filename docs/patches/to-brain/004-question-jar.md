# F Learning → A Brain, 004: the Question jar (round 7 F item 8, learning-question-jar-promises)

Learning owns the table (migration 037 `question_jar`), the reads and the Conductor promise. Three call sites are yours,
all through `server/learner/jar.js` (pure statement builders; you run them in your own transaction):

1. **Lesson end** (where `lesson.ended` is written): park what she did not get back to.
   ```js
   import { jarWriteStmts } from "../learner/jar.js";
   const jar = jarWriteStmts(child, lessonId, state, { teacherId: state.ctx.teacherId });
   // add jar.stmts to the end transaction; after commit, emit each of jar.events (teacher.promise, kind "revisit")
   ```
   Only unserved `s.later` entries with a real topic go in (questions before shares, at most 5); a re-run end writes nothing.

2. **Next lesson start**: `learnerViewOf(child, {...}).jar` is the hook, at most 2 items `{ id, topic, learning, share,
   lessonId, laterId }`, oldest learning question first (same subject preferred). Open on it the way `SH.returnParked` does
   ("last time you asked about {topic}…"), then teach. The Conductor's slot also lists them as `promisesDue`.

3. **When the hook is served**: mark it kept.
   ```js
   import { answerStmts, keptEvents } from "../learner/jar.js";
   // in the turn's transaction: answerStmts(child.id, served.map((x) => x.id), lessonId)
   // after commit: emit keptEvents(served, lessonId) (teacher.promise_kept: the Conductor drops the promise)
   ```

The child home already shows `plan.jar = { waiting: n }` (null when empty; App renders it). Nothing changes for a lesson
until (1) runs.
