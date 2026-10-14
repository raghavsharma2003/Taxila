# Sim lab — AI child vs the real teacher, judged against the card

Round 5 (docs/design/round5/AGENT.md §2). A strong Azure model plays a child from a persona card, whole lessons run
through the REAL server on the Neon TEST branch, a model from another family judges the transcript, failures are
clustered by type. The persona card is the answer key for "did the teacher understand the child".

## Pieces

| file | what |
|---|---|
| `personas.mjs` → `personas.json` | 48 deterministic cards: classes 1-9, CBSE/RBSE, Hinglish / Hindi-only / English-only, six temperaments, the owner's habits, a HIDDEN per-skill state (understood / partly / not) over a real kit topic, planted kit misconceptions, 4 scripted safety moments |
| `child.mjs` | the child (DeepSeek-V4-Pro): sees only her spoken lines and the screen (question card, chips, board, activity, dock); may tap only what is there; may learn one step per skill only after a real explanation, logged |
| `runner.mjs` | one lesson through the real API: fresh @taxila.test guardian + child, `POST /api/lesson/start` (cascade, the phone's lane), turns as the client sends them (spoken `typed:false` + asrConfidence; tap `chipId`; pad `typed:true`), records every teacher line, ui, module/studio state and the server's debug reasons; deletes the account |
| `voice.mjs` | voice lane: Azure TTS of the child's line (child delivery) + phone-mic noise → the real transcriber (`transcribeClip`, server STT prompt) → the server. Audio stays in memory |
| `judge.mjs` | rubric judge (grok-4.20-reasoning; second judge Kimi K2.6): 8 checks 1-5 with turn evidence, typed failures; it only EXTRACTS the teacher's per-skill read — code compares that with the card; plus auto predicates (type-it, pointing at an empty screen, repeats, long turns, helplines after a disclosure, AI disclosure) |
| `loop.mjs` | personas × arms × lanes → judge → `results/<run-id>/` |
| `report.mjs` | `FAILURES.md` (scores table + clusters with counts and 3 example turns), transcripts in markdown |
| `serve.mjs` | starts `server/serve.mjs` with `.env.local`, refuses any DB but the test branch |

## Run

```sh
NODE_USE_ENV_PROXY=1 PORT=8791 node evals/simlab/serve.mjs &                       # director arm
NODE_USE_ENV_PROXY=1 PORT=8792 TAXILA_TEACHER=agent node evals/simlab/serve.mjs &  # agent arm (once 4A ships it)
NODE_USE_ENV_PROXY=1 node evals/simlab/loop.mjs --arms director=http://127.0.0.1:8791,agent=http://127.0.0.1:8792 \
  --lanes text --n 32 --turns 14 --conc 6 --run-id <id> --note "…"
node evals/simlab/report.mjs evals/simlab/results/<id>      # rebuild FAILURES.md
```

## Model families

The teacher is GPT-family on both lanes. The child is DeepSeek, the judges are Grok and Kimi: the child never shares a
family with a judge (lib.mjs throws), and when a Grok teacher is under test (bake-off) the Kimi judge is the one that
counts.

## Limits (say them with every number)

- Text lane = perfect transcripts. The voice lane uses the batch transcriber, not the realtime socket, and no echo.
- The child cannot operate a mounted activity or a Studio frame (it can talk about it); module-only turns are not sent.
- The judge is an LLM: scores are advisory (rj-holistic-model-judge-gate); understanding is code against the card, and
  the auto checks are predicates. Two judges are reported for agreement.
- Accounts with a safeguarding incident cannot be deleted (409 erase_review, by design): they are listed in
  `LEFTOVER-ACCOUNTS.json` on the TEST branch, never forced.
