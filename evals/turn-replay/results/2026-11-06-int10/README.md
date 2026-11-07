# Turn replay: the production first-audio-ready figure on integration 10 (2026-11-06)

**What it is.** director8's 16 lessons (the same 4 topics × 4 personas, the same H1.2 reactive child), driven through the **real turn path**:
- `POST /api/lesson/start`, then `POST /api/lesson/turn`, on the in-process API (server/index.js);
- spoken cascade turns (`asrConfidence` 0.95) on the clause stream (`Accept: text/event-stream`).

So every production stage runs:
- perceive / speculate (replies started while the classifier is out);
- the distress read;
- the note;
- the guards;
- the early-clause lock;
- the store.

Harness: `evals/turn-replay.mjs` (Brain 32ed8de8, in the run tree).

**Run tree:** a clean worktree at **int/r6 7e2d7eea7** (integration 10), the same tree as director8, plus the harness-only fbaa0f4c.

**Database:** a throwaway local Postgres in the container, built only for this run:
- every migration was applied there;
- TLS on, localhost only (the harness refuses any other host);
- Neon was never touched.

**What isn't measured:**
- No TTS: the server's TTS prewarm is off, and no speech call is made.
- **first-audio-ready** is the moment the first speakable clause is guarded and sent (the first `clause` event), which is what TTS starts on. The child's first teacher sound is this plus the TTS first byte, which Voice measures.
- Every Azure service except the chat models was removed from the environment.

**Command:** `NODE_EXTRA_CA_CERTS=<local cert> TAXILA_REPLAY_DB=postgres://…@localhost:55432/… TAXILA_R7_SCRIPT=on node --env-file=.env.local evals/turn-replay.mjs --cap 3200 --usd 2.00`

## Calls and spend

| | Calls | Spend |
|---|---|---|
| Dry count (2026-11-06, the pre-int10 tree) | 2,412 | – |
| **Live** | **2,265** | **about $1.42** |
| Against the approved 3,200 / $2.00 | 71% | 71% |

Live calls by deployment:

| Deployment | Calls |
|---|---|
| taxila-fast (classify, reply, speculation, note) | 1,637 |
| taxila-gpt6-luna (Studio planning, background) | 292 |
| DeepSeek-V4-Pro (grading) | 178 |
| grok-4-1-fast-non-reasoning (the distress read) | 157 |
| taxila-brain | 1 |

## The figure

| 432 teacher turns, 16 lessons | p50 | p90 |
|---|---|---|
| **first-audio-ready** (request → first guarded clause) | **1,896 ms** | **3,055 ms** |
| the turn event (whole reply stored, response written) | 1,936 ms | 3,123 ms |
| director8 harness, the same tree: sequential classify + reply (for comparison) | 2,287 ms | 3,763 ms |

### By path

| Path | Turns | first-audio-ready p50 / p90 | @classified p50 | @replied p50 |
|---|---|---|---|---|
| Speculation **hit** (the reply written while the classifier ran was used) | 81 | **1,612 / 2,441** | 1,110 | 1,507 |
| Speculation **miss** (written again after the plan; its instructions differed) | 76 | 2,491 / 3,668 | 1,244 | 2,452 |
| No speculation (classified in code: exact, script key, request, lexical) | 275 | 1,779 / 2,998 | **799** | 1,829 |
| Early first clause locked (`guard.clause.sent`) | 64 | 1,634 / 2,111 | | |
| Draft rewritten by a guard | 164 | 2,718 / 3,449 | | |
| Rewrite skipped (cut 1) | 44 | 1,599 / 2,289 | | |
| No rewrite caught | 224 | 1,656 / 2,234 | | |

Server phase marks (ms from the request; p50 / p90):

| Mark | p50 | p90 |
|---|---|---|
| ctx | 1 | 2 |
| kit | 2 | 2 |
| settled | 915 | 1,233 |
| classified | 963 | 1,453 |
| planned | 972 | 1,455 |
| replied | 1,897 | 3,030 |
| stored | 1,913 | 3,104 |

Model calls, p50 / p90:

| Call | Count | p50 | p90 |
|---|---|---|---|
| taxila-fast chat | 898 | 1,008 ms | 1,319 ms |
| taxila-fast stream | 354 | 797 ms | 1,011 ms |
| grok chat | 151 | 781 ms | 982 ms |

## What the replay shows

1. **The largest lever: about 800 ms before the plan on turns code has already classified.**
   - On the 275 turns graded in code (no classify model call), `@classified` still lands at a p50 of 799 ms, because the turn waits for the model distress read (grok, p50 781 ms) before it plans.
   - Production speculates replies only when the classifier asks the model. So on these turns, which are the majority, the reply starts only after the distress read.
   - Starting the reply for a code-classified turn in parallel with the distress read would let the reply overlap the read: about 1.0 s at p50 on 64% of turns. The distress read would still gate release, as on the speculated path.
   - That change is in the safety-adjacent turn path: proposed, not built.
2. **Speculation misses cost about 900 ms.** 76 of 157 speculated turns missed because the speculated plan's instructions differed from the real plan's. The `differs` field names the part each time; it is in the per-turn rows.
3. **A guard rewrite costs about 1.1 s** (rewritten 2,718 vs no rewrite 1,656 at p50). Cut 1 skipped 44 rewrites, and those turns ran at 1,599.
4. **A production defect the harness cannot see: 3 script cards were skipped for the prompt budget.**
   - c4 s1 e3 was skipped twice and c4 s1 e4 once. Their compiled "move" section needed 262–270 tokens against a cap of 260.
   - instructionsAfter then skips the item, so that explain beat is never taught.
   - The harness compiles without the skip path, which is why director runs never showed it.
   - Fixed after this run, in Brain 9b2c3b4d: a script card's move note is shortened before any skip, and the card stays. Not in this run tree.

## Files

- `<persona>-<topic>.json`: one row per teacher turn, with these fields:
  - `firstAudioReadyMs`, `turnMs`;
  - `earlyClause`, `s1Ms`;
  - `speculation`;
  - `classifySource`, `outcome`;
  - `rewrite`, `rewriteSkipped`;
  - `marks` (the server's phase marks);
  - `models` (every model call: kind, deployment, ms).
  
  No lesson ids, no child words, no model text.
- `summary.json`, `meter.json`.
- Note: `summary.json`'s `speculationHit` group matched any turn that tried speculation (the word "hit" appears in misses too). The hit and miss rows above are computed from the per-turn `speculation.hit`. The harness is fixed for the next run.
