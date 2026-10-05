-- W2-C (BUILD-PLAN §4 W2-C; review 2026-10-05). Additive only.
--
-- selectReteach (server/comprehension/reteach.js) chooses an arm by THIS child's repair history (step 4b,
-- chosen_by 'child_history': the arm that repaired the child's mix-up before goes first). 007 limited
-- reteach_attempts.chosen_by to kit_primary, thompson, explore, recap, pick, so the turn's one transaction
-- (brain/turn.js reteachStmt) would fail its check the first time that step fired: a lesson error on exactly the
-- turn that personalises the re-teach. This widens the check; no row changes.
alter table reteach_attempts drop constraint if exists reteach_attempts_chosen_by_check;
alter table reteach_attempts add constraint reteach_attempts_chosen_by_check
  check (chosen_by in ('kit_primary', 'thompson', 'explore', 'recap', 'pick', 'child_history'));
