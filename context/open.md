

<!-- merged from inbox/comprehension-build.json -->
## ledger-game-full-weight
`server/learner/kt/bktr.js temper()` has no source weight, so game and Forge-module commits move pL at full LR. The spec (§1.1) says ×0.5 game and ×0.75 module, and `facets.js` already applies that to U and T. In the 20-seed sim, not_yet accuracy was 0.62 with game evidence and 0.75 without, because lucky game predictions carry guessers over pL 0.6. The one-line diff is in INTEGRATION.md §5.1. The learner workstream owns the file.


<!-- merged from inbox/comprehension-review.json -->
## comprehension-review-open-2026-10-02
- The CE-M1 bar fails under both families (0.627 / 0.475), and CE-M4 now fails at 14 pp after the truth-leak fix. Per SIM6, thresholds were NOT tuned to the simulator.
- Mutants VC2 and VC4 do not fail CE-M3 under bkt2, and VC4 does not fail under cfrag-lite either. By §8.3 the battery is therefore not yet valid for those mutants. The likely cause is too little game evidence: 2 C35 commits per fresh topic. A gamer or rank-exploit policy is needed.
- The oracle-prober control is not built, so 100% is undefined.
- cfrag-lite is not the evals/sim cfrag (no 4PL, no per-item γ).


<!-- merged from inbox/integration-learner-comp.json -->
## integration-learner-open-2026-10-03
- **learner-no-kt-backfill is now live.** Every existing child cold-starts in the kt ledger, and the first turn that touches a skill overwrites its skill_state row with the ledger projection (a legacy learned_today becomes practising/introduced). Its reversal condition (backfill through kt/adapter.js before the first real family) now applies to the next release.
- **grade_audit never keeps the span**: keepSpan is false everywhere; the transcripts_retention consent lookup (conductor latestConsent) is not wired into the turn.
- **TurnResponse.pace** (waitNudgeSec, endpointSilenceMs) is sent but no client consumes it; the realtime session's turn detection is minted once per token.
- **Weave hosting**: onTopicPlanned runs at lesson start and the queue is persisted, but a hosted woven sub-step has no host item (Forge/engine seam `forgeSeam.wovenSubStep`, no-op in routes/lesson.js); entries expire into C31 callbacks. The Conductor's planner does not call planChecks (lesson start does).
- **Re-teach outcomes and arm posteriors**: reteach_attempts rows are written, never resolved (reteachOutcomeStmt/armPosteriorStmt unused); prereq_descent has no cross-kit prerequisite item.
- **Voice branches** (branchesFor) simulate on the beliefs held in state before the reply, not after a synthetic fold, so a scheduler trigger the reply would add (verify_first_correct) is not in the branch.
- **shared/learner.ts**: EvidenceEvent CE fields added; CompState / FacetState / ComprehensionBelief / ProbePlan / WeaveEntry / VibeDirective types (INTEGRATION §6) not yet.
- **NM-3 question**: the vibe persona state (signal log, knobs) lives in lesson.state like the affect state does; lesson rows are M0 history. Whether session-only processing in the lesson row satisfies NM-3 is for the owner/counsel.
- **Held-verdict settle rate** at the next turn is unmeasured in production (debug.carried[].graded); the e2e saw the held why flushed at end.
- **008_tutor_choice.sql** is not applied to the Neon database (tests/migrations-applied fails); owner: the tutor-choice workstream.
- **not_yet accuracy** fell with the misconception cap (comp-sim-integration-2026-10-03); mut_vc4 still does not fail.
