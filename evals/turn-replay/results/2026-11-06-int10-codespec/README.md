# Turn replay A/B: code-classified speculation (dc-r7-code-spec) on integration 10 (2026-11-06)

**What changed, and nothing else:**
- Run tree: int/r6 7e2d7eea7 (integration 10), plus the harness-only fbaa0f4c, plus Brain 61fb6850.
- Brain 61fb6850 is server/latency/perceive.js rule 6 (`TAXILA_CODE_SPEC=on`). On a turn the bytes decided, her reply starts alongside the model distress read instead of after it.
- Release is unchanged: the turn plans after the read and uses the reply only on an exact key match.

**Scope:**
- The 4 steady lessons (c4 ch05-t01, c5 ch02-t01, c5 ch02-t02, c6 ch06-t01): 160 turns.
- The same harness, child and throwaway local Postgres as `2026-11-06-int10/`, whose steady rows are the baseline.

**Cost:** 939 calls, about $0.62, against the approved 1,000 / $0.70.

## Result: no gain as built. The flag stays off.

first-audio-ready (request → first guarded clause), p50 / p90 in ms:

| | Baseline (int10) | Code-spec on |
|---|---|---|
| All 160 turns | 1,852 / 3,123 | 1,954 / 3,498 |
| Code-classified turns | 98 · 1,710 / 2,915 | 96 · 1,747 / 2,981 |
| … speculated reply used | – | 78 · **1,490** / 2,614 |
| … speculation missed (the plan's instructions differed) | – | 18 · 2,168 / 3,598 |
| … early first clause streamed | 21 · **970** / 1,497 | 3 · 2,012 / 2,190 |
| Model-classified turns | 62 · 2,109 / 3,278 | 64 · 2,369 / 4,010 |

**Why it doesn't pay:**

1. **It overlaps the read, but gives up the early clause.**
   - Where the speculated reply was used, code turns fell to 1,490 ms at p50, about 220 ms better than the baseline's code turns.
   - But a speculated reply is written without the clause stream: the whole line is ready, then sent.
   - In the baseline, 21 code turns streamed their first guarded clause early, at a p50 of 970 ms, the fastest path in the system. With the flag on, those turns took the speculated reply instead, and only 3 streamed early.
2. **Misses cost more.** 18 of 96 code turns missed: the real plan's instructions differed, most often in the on-screen facts row the turn adds after Studio's pick. Those turns ran at 2,168 ms.
3. Model-classified turns were also slower (2,369 vs 2,109). The extra reply calls compete for the same deployment, and this run is n = 64, so treat it as noise-sized; it points the same way.

## What would work (proposed; not built)

Keep the overlap and the early clause together:
- Start the speculated reply through the same streamed path (`streamAsk` with its clause lock).
- Hold its first guarded clause until the distress read returns clean, then release it at once.
- On a distress read or a key miss, discard it, as now.

Expected first-audio-ready on code turns is about max(read, first clause) ≈ 0.8–1.0 s, against today's 1.71 s, with release still gated by the read.

The miss rate (19%) needs the facts-row difference fixed first: the speculated plan should read the same Studio pick the real plan reads, or the key should leave that row out.

## Files

- `steady-<topic>.json`: per-turn rows, the same fields as `../2026-11-06-int10/`.
- `summary.json`, `meter.json`.
