# Round 3 relational-human: how to apply

Base: HEAD `cadf527` (branch `claude/blissful-mayer-icwe2j`). Every patch passes `git apply --check` on HEAD on its own, and
the set applies in order 01 → 05. Patches 01 and 03 touch the same file (`server/brain/turn.js`) in different hunks. 03 was
generated on top of 01, and it also applies alone.

The owned paths are already edited in the working tree and need no patch. Their tests run in `npm test` today:
- `server/relational/**`
- `server/latency/**`
- `src/latency/**`
- `src/face-puppet/**`
- `server/voice/**` (untouched)

The new tests are `tests/round3-relational-human-{ack,face,memory}.test.mjs`.

No migration. Every table used exists: `memory`, `relational_note`, `turn`, `kt_evidence`, `consent`, `audit`.

## Order, what each does, the test that proves it

| # | file(s) | what | proving test |
|---|---|---|---|
| 01 | `server/brain/turn.js` | Publishes the turn's own classify on the perception bus (`server/latency/bus.js`) for a spoken answer on a text lane. Carries the duplex partial-safety bit. Adds no model call. | `tests/round3-relational-human-ack.test.mjs` (bus), `tests/prod/round3-relational-human.mjs` §1b (an echo when the device asks on the final words) |
| 02 | `src/lesson/cascadeLink.ts` | The device plays the echo through `AckClient` on its own `PcmStreamPlayer` into the same output. It plays only when the final transcript equals the decided words, and only before her reply. The reply waits for clip end plus 180 ms. Child speech or VAD sustain stops it. Echo guard on its own sound. Sends `puppetBus` ack start/end (face K2). Duplex end-of-turn: `registerLatencyTarget` so duplex `think/prepare` sends the prefetch at once and `voice/speak` asks for the echo. | `npx tsc -b`; `tests/round3-relational-human-ack.test.mjs` (AckClient play rule, duplexTurn sink), `tests/round3-relational-human-face.test.mjs` (K2); `tests/p1-duplex-link.test.mjs`, `tests/voice-cascade.test.mjs` unchanged and green |
| 03 | `server/brain/turn.js` | Passes the skill on the table to the relational decide (deixis). Carries the accepted callback's closed fragment to the compile (`relationalSeam.callbackOf`). Claim check F9 (`relationalSeam.claimCheck`): a backed past-reference is no memory_claim, an unbacked one is, and a promise always is. Writes `meta.callback` on the teacher row (the parent's "used" list). | `tests/round3-relational-human-memory.test.mjs` (seam), `evals/relational-human/memory-2day.mjs`, `tests/prod/round3-relational-human.mjs` §3 |
| 04 | `server/compiler/compile.js` + NEW `tests/round3-relational-human-compile.test.mjs` | Renders the callback. A memory about the child opens the turn from the LAST section ("OPEN THIS TURN WITH …"). An interest stays in the MOVE section as the setting of an example. Droppable. Not on safeguard, wrap or floor-fix turns. The turn-shape rule stays the last line. | the new test (in the patch), `node scripts/check-prompt-budget.mjs`, `tests/w2c-director.test.mjs`, `tests/ship5-integration.test.mjs` |
| 05 | `server/index.js` | Registers `server/relational/routes.js` (GET/DELETE `/api/parent/memory`). | `tests/prod/round3-relational-human.mjs` §2 |

After applying: `npx tsc -b && npx vite build && npm test`, then `node tests/runtime-image-imports.test.mjs` (the image
copies server, shared, data, src and dist only; every new import is inside those).

## Flags (all default to the shipped behaviour below)

| flag | where | default | meaning |
|---|---|---|---|
| `TAXILA_ACK` | server | `on` | `off`: the ack route answers 204 off. `shadow`: decides without audio (measurement). |
| `TAXILA_ACK_AT_MS` | server | `1200` | The FIXED decision instant after the perception starts. When classify is not in by then, there is no echo. `floor` restores the round-2 floor rule (measured verdict leak: do not use). Set from the prod classify tail (`grok-4-1-fast-non-reasoning` + 1.5 s hedge). If the classify deployment changes, re-measure with `evals/relational-human/ack-leak.mjs` and move this. |
| `TAXILA_ACK_FLOOR_MS` | server | `750` | Floor mode only. |
| `?ack=1/0`, `localStorage tx.flag.latency.ack`, `VITE_TURN_ACK` | device | on | Device kill switch for the echo. |
| `TAXILA_TURN_PREFETCH` | server | on in code, **`off` in prod today** | The echo needs the prefetch to be ready before the final transcript. Recommended `on`: its cost is measured in `RESULTS.md` §3. With it off, the echo can only be asked on the final words (later, and rarely before the reply). |
| `?prefetch=1/0`, `VITE_TURN_PREFETCH` | device | on | as round 2 |

## What ships without any patch (owned paths, already in the tree)

- The ack route `POST /api/lesson/turn-ack` and its decision (`server/latency/routes.js` `ackDecision`, fixed instant,
  perception bus, verdict-neutral clip cache `server/latency/ackAudio.js`). Without patch 02, nothing on a device asks
  for it. Without patch 01, it only answers on the prefetch's words.
- The perception bus (`server/latency/bus.js`). The prefetch publishes to it today.
- Relational memory: callbacks from the record (`server/relational/memory.js`), the policy's memory shapes and forget
  request, the seam's record loader and forget delete (`seam.js`, `writers.js memoryForgetStmt`), and the lexicon fixes
  (memory questions and forget requests addressed to her, with gaps). The callback reaches the reply only with patches 03
  and 04, and the parent page only with 05.
- The face's knowledge states (`src/face-puppet/knowledge.ts`, driver, bus, stage), and the duplex end-of-turn tap
  (`src/face-puppet/duplexBridge.ts` → `src/latency/duplexTurn.ts`).

## Known and not fixed here (other owners)

- **Guard rewrites drop the callback.** A rewritten reply (leak/long/drift guards, `server/director` and the conversation
  stream's guards) is redrafted without the callback note. In memory-2day, 1 of 3 opener callbacks was lost this way
  before the last-section placement. The rewrite prompt is not this stream's file.
- **`memoriesSaved` in the lesson-end response** counts inserts before the forget delete in the same transaction
  (`server/routes/lesson.js`). The parent page is right; the response number can be one high on a forget lesson.
- **The parent UI card for `/api/parent/memory`** is not built (src/pages is a shared hot file). The route is ready, and
  the memory consent's copy already promises it.
- **AT-U8** (`tests/relational-policy.test.mjs`, p99 ≤ 3 ms) fails under machine load on HEAD and on this tree alike. An
  alternating same-process benchmark shows identical cost: HEAD p99 0.071 ms vs this tree 0.070 ms, n = 24,000 turns
  each (`RESULTS.md` §8).
