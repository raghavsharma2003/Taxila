# Stream 3 handoff: latency, overflow, regions

Branch `claude/r4-latency` (merged up to `int/r5-rel144` @ b8285b2b). Everything below is pushed. Production runs 14.4.2
(`taxila-web--sac4e8e8-3x6d`); the next base is `int/r5-rel1443` @ c61aed5c. Merge it in (don't rebase: this branch is
published and merge-built).

## What stream 3 owns

- **Latency on the hot path**:
  - lesson start: boot warm, two-wave reads, start-audio fold (opt-in, off);
  - a child turn → her first sound: device prefetch, the acknowledgement (echo + continuer), turn-audio with the agent
    lane's streamed speech;
  - TTS: framed v2, ADPCM on slow links, a headers deadline with one retry.
- **Model routing and hedges** (`server/azure.js`, shared with main):
  - the reply hedge (`TAXILA_REPLY_HEDGE_MS` 2200);
  - the understanding-note race;
  - the 429 overflow review (main built it);
  - the **reply twin on the overflow account** (14.4, mine).
- **Regions**:
  - TEST chat traffic runs on `taxila-ai-southindia`;
  - production's primary chat account is `raghavsharma1729-compan-resource` (eastus2), and its overflow is southindia;
  - `scripts/deploy-azure.mjs --profile india` exists but is NOT used (decision `india-ai-lanes-eastus2`).
- **Measurement**: the evals in `evals/latency/` and `evals/relational-human/first-sound.mjs`, plus the read-only
  production SQL (main runs it; this stream never reads production).

## Shipped and live (14.3.x / 14.4)

| What | Where | Switch |
|---|---|---|
| Continuer, positive gate (lesson turns only; 0 on safety / leaving / relational in two sim-lab runs) | `server/latency/ack.js` `lessonTurnOf` | `TAXILA_ACK_CONTINUER_FOR` (owner cohort, sha256 of guardian email; set in prod) |
| `ack.decision` / `ack.outcome` trace (codes only) | `server/latency/routes.js` `ackDecisionRow`, `src/latency/ack.ts` | always on |
| Reply twin on the overflow account at 2.2 s (hot reply only; `reply.twin` trace) | `server/azure.js` `chat({ twin: "overflow" })`, `server/brain/say.js` | `TAXILA_REPLY_TWIN=off` |
| Agent-lane streamed speech on turn-audio (clauses before the turn frame) | `server/routes/voice.js` `streamingSay`, `src/lesson/cascadeLink.ts` | client `VITE_TURN_AUDIO=1` / `?turnaudio=1` |
| Agent speculation on the prefetch | `server/latency/agentSpec.js` | **OFF** by default, `TAXILA_AGENT_SPEC=on` (measured ~0 ms gain) |
| ADPCM TTS on slow links | `server/voice/adpcm.js`, `src/lesson/adpcm.ts` | auto on effectiveType ≤ 3g; `?tts=` |
| Boot warm | `server/boot-warm.js` | `TAXILA_BOOT_WARM=0` |

## Open items (in priority order)

1. **Read 14.4's production numbers.**
   - Main runs `docs/design/round5/results/latency/r144-prod-read.sql` once real lessons exist on 14.4 (there were 0 at deploy).
   - It covers: `reply.twin` firings and winner; the timeout share by lane (reply / classify label / words-only distress read /
     understanding read); and the safety reads on safety-relevant turns.
   - Baseline: 2026-10-16 08:30-09:45Z, taxila-fast at the 6 s cap on 29% of reply calls.
   - Reversal for the twin: its 429 share > 5% over any day, or TEST > 450 RPM on southindia's taxila-fast.
2. **The continuer, production data.**
   - `docs/design/round5/results/latency/ack-cohort-query.sql`: decisions, outcomes, and the echo's late share.
   - The owner cohort had 0 continuer turns 10-15 → 10-21.
3. **The continuer's third pass** (agreed with main, waits on (2)). Narrow over-refusals:
   - paani only as a break;
   - ghar soft;
   - chhod / nahi hoga / thak first-person or giving-up only;
   - maza only with nahi;
   - cute only with a person object.
   Rules for it:
   - each narrowing gets a test pair;
   - romance, secrecy and are-you-real stay untouched;
   - then a fresh sim-lab voice-cont arm.
   The evidence (44 refusals attributed) is in `stream3-data/relational-refusals-why.json` and context node
   `ms-r5-lat-continuer-relational-refusals-2026-10-15`.
4. **The echo latency.**
   - The echo is at ~2.0 s after the stop; under 1 s is not reachable: the words arrive 1.1 s after the stop.
   - The 1.2 s fixed instant can't come down: prod classify p90 is 2.2 s.
   - Waiting levers:
     - (a) a faster device prefetch trigger (needs 4B);
     - (c) a faster classify on 1-3 word answers (the classify owner).
   - Node `ms-r5-lat-echo-stages-2026-10-21`.
5. **Root cause of 10-16** (closed on our side).
   - The primary account degraded: every outbound model and speech call on it slowed, while the server, DB and replicas
     were healthy.
   - That account is NOT in the subscription our service principal sees, so its ARM metrics are unreadable.
   - Main raised the subscription / grant question with the owner.

## Half-done

Nothing is uncommitted.

## Harnesses (all in the repo)

- **`evals/latency/reply-hedge-arm.mjs`**: the reply twin, with the primary hung, slow or real.
  - Run with `--mode hang|slow|real`.
  - `real` hits production's account: one call at a time, only with main's OK.
- **`evals/latency/overflow-arm.mjs`**: a throttled minute, with eastus2 stubbed to 429 and southindia real.
- **`evals/latency/turn-e2e.mjs --turn-audio [--prefetch]`**: an agent-lane end-to-end run. It times "streaming" turn-audio from its own first frame.
- **`evals/relational-human/first-sound.mjs --prefetch --ack [--continuer]`**: the child stops → first sound, with ack stages.
- **`evals/latency/start-phone.mjs`**: tap → first sound on a phone profile (Playwright, throttled).
- **`evals/latency/agent-json.mjs`, `agent-models.mjs`**: the agent call shape and model bake-off.
- **Running against TEST**:
  - Chat traffic to southindia: `stream3-data/si-run.sh <cmd>` sets the CHAT/RESPONSES lanes from `.env.local`'s `*_SIN`
    vars, in-process only.
  - Plus `TAXILA_DB=test` and `tests/prod/prod-routing.env`.
- **Gates**: run CI-style (`CI=1`, empty `DATABASE_URL` / `DATABASE_URL_DIRECT` / `TAXILA_DB`), i.e. `infra/gate.mjs`
  `gateEnv`: `npx tsc -b && npx vite build && npm test && node scripts/check-prompt-budget.mjs`.
  - `npm test` runs every suite in ONE process (`tests/index.js`): a root hook timeout fails everything after it.
  - The 4-core container is slow; a known load flake is learner-order's perf guard (main made it a same-run ratio).

## Data

- **Committed results**: `docs/design/round5/results/latency/`.
  - echo stages (`echo/`), reply-hedge (`reply-hedge-*.json`), overflow-arm, agent-e2e;
  - the SQL files (`overflow-prod-query.sql`, `ack-cohort-query.sql`, `r144-prod-read.sql`).
- **Container-only data**: `docs/handoff/stream3-data/`.
  - analysis scripts, run logs, the agent-spec probes, the 44-refusal attribution, `si-run.sh`;
  - npm test logs and build output are not kept;
  - no keys: scanned for keys, connection strings and emails.
- **Context**: every decision and measurement went through `context/inbox/r5-latency.json`; main merged them (`merged/`).
- **Transcript**: `docs/handoff/transcripts/stream3.jsonl.gz`, redacted (emails, connection strings, key-like tokens and
  long base64 removed).

## Rules this stream ran under (still binding)

- The database is ONLY this branch's Neon branch: host sha256[0:16] = `f47b22100116a310`. Production is off-limits: main
  runs every production read.
- Never print or commit a key or a database URL.
- Never run `deploy-*` or `migrate.mjs` against anything but the branch DB.
- `server/director/safety.js`, `server/compiler/floor.js` and `src/lesson/safetyStrings.ts` are FROZEN.
- `classify.js` `BESIDE_NAME_WAIT_MS` changes need main's safety review.
- HARD RULE: nothing she says precedes the model distress read; safeguard turns never stream.
- Azure-only AI.
- **Current owner directive: no model, speech or Azure calls until main says otherwise (spend stop, 2026-10-24).**
