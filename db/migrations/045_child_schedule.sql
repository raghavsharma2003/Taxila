-- 045 (round 7 F, app-parent-schedule; Learning's range 044-049): the parent's lesson schedule. anchor (004) is the
-- start time; these add the lesson days (JS weekdays, 0 = Sunday) and the lesson length. The Conductor reads them as
-- parent.setting_changed { restDays, anchor, lessonMin } (server/routes/parent.js schedule); the planner starts the
-- sitting at the anchor and never plans it longer than lesson_min. Additive and re-runnable.
alter table child_routine add column if not exists lesson_days smallint[] check (lesson_days is null or (cardinality(lesson_days) <= 7 and lesson_days <@ array[0,1,2,3,4,5,6]::smallint[]));
alter table child_routine add column if not exists lesson_min int check (lesson_min is null or lesson_min between 10 and 60);
