-- A lesson's turns are numbered by the lesson state (routes/lesson.js stageTurns), and a turn's evidence and
-- incident rows find their turn by (lesson_id, seq) inside the same transaction: one row per seq, enforced.
-- Replaces the plain index from 001 (a unique index serves the same lookups).
create unique index if not exists turn_lesson_seq_unique on turn(lesson_id, seq);
drop index if exists turn_lesson;
