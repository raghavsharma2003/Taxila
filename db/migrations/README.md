# db/migrations

Plain SQL, applied in file-name order, once each, by `node scripts/migrate.mjs` (reads `DATABASE_URL`; the applied set
is the `schema_migrations` table). One statement per `;` at line end; no `$$` blocks (the Neon HTTP driver runs one
statement per call).

- Test against the Neon **test branch** first (`DATABASE_URL=$CONDUCTOR_TEST_DATABASE_URL node scripts/migrate.mjs`).
- Production is migrated by the wave's integration step only, never by a stream (BUILD-PLAN §1.6).
- Numbers are allotted by the main loop in each wave's seam commit. Use only your stream's numbers; an unused number
  stays unused (a gap is harmless, a collision is not).

## Allotment

```
-- W0 seam commit (BUILD-PLAN §2), 2026-10-04 — Wave 1 numbers:
--   012_*.sql  W1-C  pending grade (held verdicts written by event id; held-verdict settle)
--   013_*.sql  W1-C  re-teach resolution (reteach_attempts outcomes, arm_posteriors, rep_fluency reads)
--   014_*.sql  W1-D  Conductor hooks, if needed
--   015_*.sql  W1-A  lesson truth / answer surfaces, if needed
-- Taken before W1: 001-011 (004 and 007 each hold two files from parallel streams; kept as applied).
-- Next free after W1: 016 (allotted in the W2 seam commit).

-- W2 seam commit (BUILD-PLAN §1.6, §4), 2026-10-04 — Wave 2 numbers:
--   016_brain.sql       W2-E  decision_record, brain_trace, lesson_plan, format_posterior (population rows only; no child id)
--   017_studio.sql      W2-H  studio_build, studio_library, studio_mount; ALSO widens kt_evidence_via_check to add 'studio'
--                             (012 set it to dialogue, game, module, callback, weave, late; shared/learner.ts `via` has 'studio')
--   018_relational.sql  W2-I  rel_state (edit), rel_event, relational_note (no NM-3 column)
--   019_*.sql           W2-A  home states (homework, test_window, safety_hold), if needed
--   020_reteach_child_history.sql  W2-C  widens reteach_attempts_chosen_by_check to add 'child_history' (selectReteach step 4b)
-- Streams apply their file ONLY to the Neon test branch (CONDUCTOR_TEST_DATABASE_URL); production is the integration
-- step's. 014 was never used (W1-D needed none): it stays a gap. W3 numbers are allotted in the W3 seam commit.
```
