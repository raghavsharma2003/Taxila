# Stream 4A (conversation) · patch requests

Apply in this order, after the stream's own commits. Each was applied on `claude/r4-conversation` only as a separate
`[patch-request]` commit, so the main session can drop and re-apply it at merge (BUILD-PLAN §4 rule 2).

| # | file | owner | why | proved by |
|---|---|---|---|---|
| 01 | `db/migrations/024_school_chapter.sql` (new; main assigns the number) | main | `child.school_chapter` (jsonb { subject: chapter }) is read by `content/next-topic.js schoolStartIndex` since F0.4 but no migration ever created it (TUTOR-MODEL §2.4), so placement always fell back to the calendar. The session-first intake writes it when it confirms today's school topic. Additive, nullable. NOT applied to any database by this stream. | patch 02's end route wraps the write in a catch, so the tree runs with or without it; `tests/r4-conversation-session.test.mjs` (schoolPointerStmts) |
| 02 | `server/routes/lesson.js` | main | session-first start: `purpose: "session"` (served only when `TAXILA_SESSION_FIRST=on`; otherwise identical to "lesson") passes `ctx.session` from `director/session/start.js sessionStartCtx` (the day plan as a private prior, due reviews, the school pointer) to `initLessonState`; the Director then opens on the intake beat. End: the summary, kit and `lesson.topic_id` follow the session's last segment (segments re-point the state inside the same lesson row); the confirmed school position is written to `child.school_chapter` (needs 01; never the end's error). | `tests/r4-conversation-session-db.test.mjs` (real route + Neon TEST branch: a session start opens on the intake; a plain start is unchanged), `tests/r4-conversation-session.test.mjs` |

Not patches (switches for owner decisions, TUTOR-MODEL §9; all default off, `server/director/session/flags.js`):
`TAXILA_SF_H3_PERSIST`, `TAXILA_SF_LIFE_CALLBACKS`, `TAXILA_SF_EXPLORE`, `TAXILA_SF_START_ONLY_HOME`, `TAXILA_SF_NOTEBOOK_CAMERA`,
`TAXILA_SF_PARENT_INTAKE_C12`.

Client follow-ups (not this stream's files; listed for the owners of `src/child` and `src/lesson`):
- the Start-only home (owner decision; `TAXILA_SF_START_ONLY_HOME`) sends `purpose: "session"` to `POST /api/lesson/start`;
- the intake's chips (`intake:subject:<s>`, `intake:test`, `intake:homework`) are ordinary `ui.chips`; a tap sends its `chipId` as today;
- a `move.segment` on a turn ({ n, topicId, purpose, mode }) means the lesson moved to a new topic in the same lesson: the
  client may refresh its topic title; nothing else changes (same lessonId, same turn route).
