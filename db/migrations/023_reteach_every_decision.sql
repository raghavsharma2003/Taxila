-- round3 truth (docs/design/round3/truth; prod w1c-reteach 7/13 on 2026-10-07: re-teach moves, 0 reteach_attempts rows).
-- Additive only: widens two checks, no row changes.
--
-- Every re-teach the Director takes is one reteach_attempts row (the Decision Service rule: the action actually taken is
-- logged where it is taken). The Director's own paths (director/state.js afterMiss / trap: the kit's remediation for a
-- misconception the child's answer just showed; the P21 change-of-approach fallback) never went through selectReteach, so
-- they wrote nothing. Their rows need two values 007 / 020 do not allow:
--   trigger   'misconception_seen'  one answer classified as the misconception (not the belief's confirmed misconception,
--                                   which stays 'misconception_confirmed')
--   chosen_by 'rule'                the fixed change-of-approach fallback (the worked example), chosen by no policy
-- Without this migration the first such row would fail the turn's one transaction (rejected rj-w2c-child-history-unwritable),
-- so the director patch must not ship before it.
alter table reteach_attempts drop constraint if exists reteach_attempts_trigger_check;
alter table reteach_attempts add constraint reteach_attempts_trigger_check
  check (trigger in ('misconception_confirmed', 'wheel_spin', 'two_fails_post_rung3', 'u_low_after_practice', 'transfer_fail', 'delayed_fail', 'misconception_seen'));
alter table reteach_attempts drop constraint if exists reteach_attempts_chosen_by_check;
alter table reteach_attempts add constraint reteach_attempts_chosen_by_check
  check (chosen_by in ('kit_primary', 'thompson', 'explore', 'recap', 'pick', 'child_history', 'rule'));
