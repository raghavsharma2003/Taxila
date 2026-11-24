# Reply-model A/B (S6), 2026-11-04 (stream A Brain; main's GO of the same day)

The same 12 lessons as `2026-11-04-director2` (4 scenarios × classes 6/5/4, the same scripted child), Director lane only, with
**`DEPLOY_REPLY=taxila-gpt6`**; classify stays on `taxila-fast`. Run at claude/r4-conversation **fb995233**: the director2 code
repairs after a failed rewrite are in, the S1 final enforcement is not. `--matrix --director-only --cap 450 --usd 3.00`, no DB, env
only via `node --env-file`.

- 12 of 12 lessons ran, with 402 model calls and ~$1.257 estimated (meter.json). No 401/403 and no cap was reached.
- The meter counts output as 300 tokens a call.

| lesson | ready p50, fast (director2) | ready p50, gpt6 | first drafts a guard caught, fast / gpt6 |
|---|---|---|---|
| steady-c6 | 2404 | 3523 | 2 / 5 |
| offtopic-c6 | 2913 | 3001 | 6 / 4 |
| stuck-c6 | 3357 | 3827 | 7 / 6 |
| steering-c6 | 2671 | 3556 | 5 / 3 |
| steady-c5 | 2100 | 3701 | 1 / 4 |
| offtopic-c5 | 2731 | 3229 | 6 / 5 |
| stuck-c5 | 2954 | 3423 | 6 / 5 |
| steering-c5 | 2063 | 2377 | 1 / 2 |
| steady-c4 | 2539 | 3188 | 3 / 4 |
| offtopic-c4 | 2757 | 3836 | 5 / 7 |
| stuck-c4 | 2906 | 2870 | 5 / 4 |
| steering-c4 | 2913 | 3585 | 3 / 4 |

**Caveat:** the fast arm is director2 (cb999f79), which lacks fb995233's code repairs, so the two arms do not have
identical guards. The guards only act after the draft, so the first-draft quality of each model is comparable, but the shipped
lines are not. A fast arm on the same head costs ~$0.21.

Rows now carry `guardAfter` (afterRewrite, replaced, repaired), so caught and fixed can be told apart. **Unscored.**
