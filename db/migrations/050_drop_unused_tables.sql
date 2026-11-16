-- 050 (round 7 whole-project audit, platform PLAT-56; numbering: Platform also takes 050): five tables nothing reads or
-- writes. Checked 2026-11-10: no SQL use in server/, scripts/, src/, shared/, api/, infra/, evals/ or tests/ (names
-- appear only in code comments), and no foreign key points at any of them. The old image never reads them either, so a
-- web rollback over this migration is safe. Kept off the list: kt_child, notify_slot, lesson_plan (named in
-- server/learner/mode.js and a test), format_trial and tutor_switch (written, not read), and calendar (the audit listed
-- it, but server/conductor/view.js reads it for the Conductor's day kinds).
drop table if exists module_run;              -- made by 001
drop table if exists rate_bucket;             -- made by 004
drop table if exists kt_params;               -- made by 005
drop table if exists voicesig.calibration;    -- made by 021
drop table if exists voicesig.population_norm;-- made by 021
