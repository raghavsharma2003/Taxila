# Hybrid side-by-side, agent half rerun, 2026-11-04 (stream A Brain; main's GO of the same day)

The agent lane alone (`--matrix --agent-only --cap 450 --usd 1.2`) at claude/r4-conversation b022df8a, run in a worktree of that
commit. The harness applies the agent-lane invariants exactly as brain/turn.js does: #3 (stop check-in / end), #8 (level floor),
#9 (diversion). This replaces the agent half of `../2026-11-04-full/`, which ran without them. The Director half there stands.
Same setup as the full run: production deployments (classify grok-4-1-fast-non-reasoning, hedge 1500 ms; agent taxila-gpt6;
the Director fallback line taxila-fast), no DB, Hinglish, scripted child.

- 11 of 12 lessons written. The spend cap ($1.20) was reached during `steering-c4`, which is not written. 334 calls
  (taxila-gpt6 115, grok 168, taxila-fast 51), about $1.20 estimated. No 401/403.
- Agent turns the Director took (the `fellBack` field on the turn):
  - an invariant: diversion_no_return ×3 (offtopic c4, c5, c6), diversion_set_aside ×2 (steering c5, c6), level_count_on ×1
    (stuck c6);
  - a taxila-gpt6 6 s timeout ×2 (offtopic c6, steady c6).
- Agent reply-ready p50 per lesson: 3460-4735 ms (in the run log; per turn in each md).

Not scored by the harness or by stream A: main judges.
