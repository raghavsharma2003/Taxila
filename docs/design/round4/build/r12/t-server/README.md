# Release 12, the flight recorder: T-server (stream 3)

Brief: `docs/design/round4/build/r12/TRACKING-BRIEF.md`; decision `dc-r12-flight-recorder`. Branch `claude/r4-latency`,
restarted from base 84bc6050. The contract `shared/trace.ts` was pushed first (e376d62f).

## What the server records (tier 1, every account)

Everything goes through ONE buffered writer (`server/trace/writer.js`):
- `record()` is synchronous: it masks, fits the event to 8 KB and buffers it;
- one multi-row insert per second, or sooner when the buffer fills;
- the buffer is capped at 5,000 events. Past the cap, or on a failed or hung insert (deadline 8 s), events are dropped and
  counted, and the count is itself recorded as `trace.dropped`;
- it never throws and never awaits on a request.

| kind | where (the choke point) | what |
|---|---|---|
| `srv.req` / `srv.res` | `server/router.js` (every `/api` route except `/api/trace/*`, health, the error beacon) | route, rid (from `x-taxila-rid`, or `_rid` in the query for an EventSource; echoed as `x-taxila-rid`), status, ms, query, request and response bodies (masked, ≤ 8 KB) |
| `model.call` | `server/azure.js` `post()` and `chatStream()`, the one model-call wrapper | kind, deployment, lane, status, ms, attempt, tokens, ttft, prompt id (its first system line), prompt sha, output text; tier 2 adds a blob with the FULL request and raw response |
| `director.turn` | `server/brain/turn.js` after the commit | move, shape, beat, item, phase, lane, legal mode, ACCEPTED and REJECTED proposals (with why), all reason codes, speculation, guard, Studio slot / reasons / module commands, her reply |
| `studio.rung_replaced` | same | WHAT the live board replaced (module, engine, script ops, mounted?), BY what (slot, intent, state, artifact) and WHY |
| `turn.speculation_miss` | same | how the speculative reply's inputs differed from the real turn's |
| `classify.verdict`, `safety.scan`, `db.write` | same | outcome, source, confidence, verdict, flags (codes only); distress true/false with its sources and kind CODE (never the matched text); rows written |
| `studio.slot.<state>` | `server/studio/seam.js` `push()`, every slot status sent to the client | intent, slot, state, kind, archetype, source, fallback, why |
| `studio.slot.refused` | the tray gates (`studio/seam.js`, `stagecraft/seam-bridge.js`) | which gate, kind/rung, viewport class, the certificate's reason |
| `board.page` | `server/studio/seam.js` `writeBoardPage()` | page seq, mode, **clears** the board or **draws over** the last page, op count and kinds, the words drawn |
| `forge.job.start/end`, `job.start/end` | `server/conductor/jobs.js` `runJob()` (worker) | kind, attempt, ok, ms, error code |
| `tts.first`, `tts.end` / `tts.failed` | `server/routes/voice.js` `streamParts()` (tts-stream and turn-audio) | first-audio ms, setup ms, cache hit, engine, prewarmed ms; at the end: ok / empty / cut / failed / aborted (the child went away), bytes, ms, EVERY part's engine (a DragonHD → gpt-4o-mini-tts fallback shows) |
| `play.mount`, `play.act`, `play.outcome` | `server/play/routes.js` start / act | family, mode, level, skill; each act's grade moments and her reaction; the verdict when the level ends (on the lesson's timeline when the game runs in one) |

The child and guardian ids always come from auth (`requireGuardian`, `requireChild`, `loadTurnContext`, the tts-stream
ownership query), never from the client. The session id is:
- the lesson id inside a lesson (a start is keyed by the lesson it created);
- else the page-load id (`x-taxila-pid` header, or `_pid` in the query);
- else `g:<guardian>`.

**Masking** (`server/trace/mask.js`, gate-tested): password, PIN, email, phone, cookie, Authorization, any key, token or
secret is replaced by `[masked]`. Email-shaped strings, bearer and SharedKey strings, and long key-like runs are scrubbed
anywhere. Token COUNTS are kept.

## Tier 2 (owner cohort: `TAXILA_TRACE_FULL_FOR`, email or sha256, like `TAXILA_UI_KAKSHA`)

- `GET /api/me` returns `trace: { tier }`.
- Tier-2 server events (the full-prompt blobs) and tier-2 client events are accepted only for the cohort.
- Blobs go to the existing storage account in container **`trace`**, which is private. Path:
  `{yyyy-mm-dd}/{sid}/{src}-{seq}.{ext}`.
- **Open item:** the `trace` container must be created in the storage account (private access). I did not create it: no
  Azure resource changes. Until it exists, blob PUTs fail, and a server tier-2 event records `model.call.blob_failed`.

## Client endpoints (for T-client / T-voice)

- `POST /api/trace/batch {v, pid, skewMs?, events}`:
  - at most 256 KB (413 above that);
  - rate limited per pid and per address;
  - anonymous allowed (pid only);
  - `src` must be `client`;
  - tier-2 events are refused outside the cohort;
  - `cid` is set only when the event's `sid` is a lesson of THIS guardian;
  - `t` is corrected by `skewMs`.
  - Response `{accepted, rejected, tier}`.
- `POST /api/trace/blob?sid=&src=client&seq=&ext=&type=`, raw bytes up to 12 MB, tier 2 only. `seq` is a number or a letter and a number (audio blobs: `b3`). Returns `{ref, bytes, type}`
  for `data.blob`.

## Erasure and retention

- `trace_event.cid` and `.gid` cascade from child and guardian (`029_trace.sql`), so the parent corner's DELETE
  `/api/children` and DELETE `/api/account` take the rows inside their own transaction.
- Rows keyed only by an erased lesson (no cid on them, e.g. tts-stream before identification) are deleted after the
  commit, by the lesson ids read before it.
- Blob refs are read before the erasure and the blobs deleted after the commit.
- Nightly (`server/conductor/ops.mjs --nightly`): tier 1 after 30 days, tier 2 after 90 days, blobs first.

## Reading it: `scripts/trace.mjs`

```
TAXILA_DB=test node --env-file=.env.local scripts/trace.mjs --recent [--guardian <email|sha256>] [--child <prefix>]
TAXILA_DB=test node --env-file=.env.local scripts/trace.mjs --session <lesson-id|child-prefix|pid> [--from hh:mm --to hh:mm] [--json] [--all]
TAXILA_DB=test node --env-file=.env.local scripts/trace.mjs --flags [--since 2026-10-11]
node scripts/trace.mjs --replay <session> --at hh:mm:ss   (T-client's scripts/trace-replay.mjs)
```

- `--session` merges the lesson's events, the page loads that led into it, and every event of the same REQUESTS (a
  start's model calls run before the lesson id exists).
- ★ marks the owner's flags; ⚠ marks failures (errors, `*.failed`, refused slots, 5xx, dropped events).

## Evidence

- `session-prod-build.txt`: a 6-turn scripted lesson on a **packaged production build** (`server/serve.mjs`,
  `NODE_ENV=production`, production routing) against TEST, driven by `evals/relational-human/first-sound.mjs --base`.
  It has 191 events, every turn, and one ⚠: `studio slot refused … game is only its board twin at p360`, exactly the
  kind of silent fallback the owner asked to see.
- `recent.txt`: `--recent`.
- Client events (T-client) and `--replay` are not in this timeline yet: T-client's batcher was not on a branch I could
  run when this was recorded. The batch endpoint is tested end to end (`tests/r12-trace-db.run.mjs`).

## Budgets (measured 2026-10-11, in-process server, 3 lessons × 10 turns, real Azure, `TAXILA_TRACE_PROFILE=1`)

| what | n | p50 | p95 | max |
|---|---|---|---|---|
| recorder time inside a `/api/lesson/turn` request (all its `record()` calls, about 7 events) | 29 turns | 0.69 ms | **1.62 ms** | 1.65 ms |
| recorder time per request, every route | 175 | — | 1.32 ms | 1.76 ms |
| flush serialisation (off the request, same event loop), per turn | 6-turn session, 82 rows | 0.11 ms | | |

The budget is ≤ 10 ms p95 per turn: met with about 8 ms to spare. A turn writes about 21.6 KB of events.

## Tests (all pass)

- `tests/r12-trace-unit.test.mjs` (11):
  - masking;
  - 8 KB fit;
  - tier cohort;
  - the writer: never throws; context carried; tier 2 only for the cohort; a dead DB drops and counts; buffer cap;
    `trace.dropped`; a HUNG insert does not stall it; off switch;
  - client row rules;
  - **a broken recorder leaves a request identical** (status, body, headers);
  - per-request isolation.
- `tests/r12-trace-db.test.mjs` → `.run.mjs` (4, Neon TEST, in-process API):
  - srv events keyed by lesson, child and guardian, bodies masked; `/api/me` tier;
  - the batch route: ownership, tier, 413, anonymous;
  - the **delete cascade** (child, then account: rows and blobs);
  - retention.

## Gates (2026-10-11)

- `npx tsc -b`: pass. `npx vite build`: pass. Prompt budget: pass. lint-ui: 353 (the baseline).
- `npm test` on 18dc7f22: **3,044 pass, 0 fail**, browser tests included.
- After the play events: the play tests pass (126/126), and so do `r12-trace-unit` (11/11) and `r12-trace-db` (4/4).

## Not done in this pass

- `safety.*` outside the turn: the lesson start's safety reads. The turn's `safety.scan` is there.
- The `trace` storage container (above).

## Release 12.1 (main's live tier-2 proof on taxila.dev found three bugs in `scripts/trace.mjs`)

1. **`--replay` was broken.** It handed its own arguments to `scripts/trace-replay.mjs`, which answered with its usage line.
   - Now `trace.mjs --replay <session> --at hh:mm:ss[,…] [--out dir] [--base origin] [--tz +05:30] [--keep]`:
     - resolves the session (any form `--session` takes);
     - gathers its `rrweb.chunk` events and downloads each `data.blob.ref` from the private `trace` container
       (`getTraceBlob`, new in `server/trace/blob.js`) into a temp dir, in time order;
     - calls `trace-replay.mjs --events <dir> --at … --out … --base …`.
   - `--base` defaults to the recording's own origin (its rrweb meta event), else `https://taxila.dev`.
   - The chunk format is T-client's `src/trace/tier2.ts`: each blob is a JSON array of rrweb events, which is what
     trace-replay's `loadEvents()` reads.
2. **`--session <child-prefix>` found only the guardian stream.** A child prefix now resolves to EVERY session of that child:
   - its lesson ids;
   - every sid its own rows sit under;
   - the page loads whose requests named it. The Desk runs under the page id, and its client events carry no cid, so they
     are joined by request id: a client event shares its rid with the server request event that auth stamped with the
     child;
   - `g:<gid>`.
   An ambiguous prefix is an error. `--day` sets the day `--from` / `--to` refer to.
3. **"← undefined undefined undefinedms".** A response body too big for 8 KB (seen: `GET /api/child/map`) fell through
   `fit()` to its summary, which kept no fields, so `route`, `status` and `ms` were lost.
   - `fit()` now also cuts long arrays (to 20, then 5 items) before giving up.
   - Its summary keeps the event's own small fields.
   - `lineFor()` never prints `undefined` and marks a cut body.

Also found by the proof, and fixed:
- **A late event of an erased account broke the foreign key, and that dropped its whole chunk** (up to 400 events). The
  DELETE request's own `srv.res` is flushed after the commit. `insertTraceRows` now skips only the rows naming an erased
  child or guardian.
- The server's `tts.*` lines render as "audio stream …" (the client's `tts.end` keeps "she finished"). Their engines read
  `oai` instead of `null`.

### Proof on TEST (`replay-proof.mjs`, 2026-10-11 18:16-18:18 UTC)

- **Setup:** packaged production build (`server/serve.mjs`, `NODE_ENV=production`, production routing) on the TEST branch.
  The proof account is the only `TAXILA_TRACE_FULL_FOR` entry, so `GET /api/me` returns `{"tier":2}`.
- **Run:** Playwright Chromium at 412x915 opens `/c/<child>/lesson/new` and taps "Tap to hear Asha". The lesson starts with
  a real model call, and the screenshot is taken 30 s later.
- **Blob store:** this container has no storage key, so the server and `trace.mjs` both used `TAXILA_TRACE_BLOB_DIR` (a
  local directory in place of the container: same paths, same `/api/trace/blob` route; never set in production). With the
  key set, the same run uses the `trace` container.
- **Results:**
  - `proof-session.txt` (`--session <child-prefix>`): 99 events from the lesson, the guardian stream and the page session
    (`pages=…`), with no `undefined`. It includes `← GET /api/child/map 200 1452ms (body cut)`, the bug-3 response, now
    rendered.
  - `trace.mjs --replay <child-prefix> --at 18:17:37` read 6 chunks and wrote `proof-replay/replay-181737.png`.
  - Against the real screenshot (`proof-screen.png`), the replay differs in **0.0 %** of pixels (grey difference > 32).
  - DELETE /api/account returned 200, and 0 trace rows of the child are left.

Tests:
- `r12-trace-unit` (13): bug 3, and the `fit()` summary.
- `r12-trace-db` (5, Neon TEST):
  - the child prefix gets the Desk page by rid and never another page;
  - the CLI timeline;
  - `gatherReplay` (both chunks in order, the origin);
  - the late-event foreign-key case.
