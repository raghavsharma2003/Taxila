# Hybrid side-by-side pilot, 2026-11-04 (stream A Brain; main's approval of the same day)

`node --env-file=.env.local evals/hybrid-side-by-side.mjs` at claude/r4-conversation. No database. Production deployments:
reply `taxila-fast`, classify `grok-4-1-fast-non-reasoning` (hedge 1500 ms), agent `taxila-gpt6`. Topic c6-maths-ch06-t01,
class 6, Hinglish. The child is scripted (evals/hybrid-side-by-side.mjs SCENARIOS): the same lines for both lanes. The lanes
ran one after the other.

- Written: `steady` and `offtopic` (10 child turns per lane each).
- Not written: `stuck`. The 150-call hard cap was reached during that scenario at about $0.26 estimated (input ≈ request
  chars / 4, output ≈ 300 tokens a call). About 60 calls per scenario. No auth refusal.
- `replyReadyMs` per teacher turn = classifier + her whole line (Director: textReply; agent: agentTurn, plus the Director
  line when the agent fell back). Console p50: steady, Director 2033 ms vs agent 3818 ms; offtopic, Director 2569 ms vs
  agent 3183 ms. One agent turn fell back (taxila-gpt6 timed out at 6 s).
- Not scored by the harness or by stream A: main judges.
