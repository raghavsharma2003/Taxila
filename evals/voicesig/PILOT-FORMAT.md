# Pilot row format (input to `evals/voicesig/harness.mjs` and `scripts/voicesig/k1-train.mjs`)

One JSON object per line, one line per child turn, in any order (the harness sorts per child by `day`, `session`, `turn`).
Rows hold numbers, flags and outcomes. A transcript (`text`) is optional; when present the harness derives the Tier-T
bits with the product's own `server/signals/linguistic.js readText()`. Pilot audio, if kept under V3, lives elsewhere
(Azure Storage, India) and is never referenced from a row.

| field | type | required | meaning |
|---|---|---|---|
| `child` | string | yes | pseudonymous child id (cluster for every interval) |
| `session` | `"S-A"` \| `"S-B"` \| `"S-C"` \| string | yes | SPEC §6.3 session |
| `day` | number | no | days since S-A |
| `turn` | number | yes | turn index within the session |
| `item`, `skill`, `form` | string | form recommended | `form` ∈ number, word, choice_spoken, explain, read_aloud (baseline key) |
| `verdict` | `correct` \| `partial` \| `not_yet` \| `ungraded` | yes | grader verdict (Tier T) |
| `text` | string | no | child transcript (evaluation copy; dropped at study end + 90 days) |
| `ling` | object | no | precomputed Tier-T bits `{ idk, hedge, fillerLex, repairDir, thinkAloud, tFluent }` (overrides `text`) |
| `words` | number | recommended | ASR word count |
| `kv` | KnowledgeVoice | yes | exactly what the device sent (`src/voicesig/types.ts`) |
| `safety` | boolean | yes for safety turns | `scanSafety` fired (the harness checks 100% abstain) |
| `o3History` | boolean | no | the same wrong answer was given earlier for this item |
| `pL`, `bt`, `hintRung` | number | no | text-only baseline covariates (pL, item b − θ, hint rung) |
| `deltaFitted`, `deltaZ` | boolean, number | no | item-difficulty onset adjustment, when fitted |
| `langMode`, `micClass`, `ageBand`, `gender`, `homeLang`, `speechDiff` | string / boolean | for VS-A6 | breakdown groups (`ageBand` ∈ `9-10`, `11-13`) |
| `outcomes` | `{ O1, O2, O3, O4 }` each 0 \| 1 \| null | yes | SPEC §1.2 task outcomes, joined from S-B / S-C and the in-episode probes |
| `coder` | `{ noAttempt?, onsetMs?, fillers? }` | no | blind behavioural marks: **evaluation only, never a training target** |

Outcome conventions: `O1` = 1 when the same skill is answered correctly at the delayed / transfer check (the harness
treats O1 = 0 on a correct answer as the positive "fragile" class); `O2` = 1 when the recognition probe after an IDK is
answered correctly; `O3` = 1 when the same wrong answer recurs after feedback; `O4` = 1 when an immediate re-ask gets
the same verdict.

`simulate-pilot.mjs` writes rows in this format with an extra `sim` field. `k1-train.mjs` refuses to write weights
under `models/` from any input containing `sim`.
