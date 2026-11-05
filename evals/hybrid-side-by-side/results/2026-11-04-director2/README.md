# Hybrid side-by-side, Director half rerun after block 2, 2026-11-04 (stream A Brain; main's GO of the same day)

The Director lane alone (`--matrix --director-only --cap 450 --usd 1.2`) at claude/r4-conversation cb999f79. That is block 2,
the int/r6 07185e93 merge and patch 006; the harness gained `--director-only` and nothing else. The matrix is the same as
`2026-11-04-full`: 4 scenarios (steady, offtopic, stuck, steering) × 3 topics (classes 6, 5, 4), 11 teacher turns each,
with the same scripted child lines. No database. The env was loaded only with `node --env-file`.

- 12 of 12 lessons ran, with 385 model calls (all `taxila-fast`) and ~$0.211 estimated (meter.json). No 401/403 and no cap was reached.
- Ready p50 per lesson ranged from 2.06 s to 3.36 s.

**Unscored.** Main judges it against the 11 block-2 items, turn by turn. Compare it with the Director half of
`2026-11-04-full`, which used the same scripted child.
