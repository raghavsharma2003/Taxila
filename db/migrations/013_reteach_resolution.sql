-- W1-C (BUILD-PLAN §3 #5; comprehension audit G9, personalisation 1): the re-teach loop learns. reteach_attempts rows
-- (written by the turn since 007) are resolved from the child's own later evidence at the next lesson start
-- (server/comprehension/resolve.js): repaired_now (the in-lesson re-check), resolved_next (the next lesson that touches
-- the skill), resolved_delayed (a success ≥ 20 h later), or failed / induced_bug / contaminated. When an attempt's
-- outcome is final its bandit reward goes to arm_posteriors ONCE (population level, no child id) and rewarded_at is
-- stamped, so a retried resolution cannot count it twice.
alter table reteach_attempts add column if not exists rewarded_at timestamptz;
alter table reteach_attempts add column if not exists cluster text;
create index if not exists reteach_attempts_open on reteach_attempts (child_id, at) where rewarded_at is null;
