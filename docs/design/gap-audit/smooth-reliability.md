# Gap audit: a smooth experience and a product that works (production, 2026-10-04)

Pillar: an extremely smooth experience and a product that works. This is an audit only. No code, config or commits
were changed. The only file written is this report, plus 27 screenshots in `docs/design/gap-audit/shots/smooth/*-r2.png`.

Everything was measured on **production** (`taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`, revision
`taxila-web--saa263ce-4ir3`, image `taxila-web:aa263ce`, bundle `main-W1OdjGXm.js`), 04:30 to 04:50 UTC on
2026-10-04, from the US build sandbox through its egress proxy. Azure resources were read with read-only ARM GETs.
Neon was read with read-only MCP calls.

Severity: **BLOCKS** means the owner cannot test that feature thoroughly. **DEGRADES** means it works, but it is
slower, more fragile or less trustworthy than the product needs. **POLISH** means it is visible but small.

## 0. Method and cleanup

| probe | what it does | n |
|---|---|---|
| `scripts/prod-smoke.mjs` | runs as written: 1 text lane and 2 cascade | 3 lessons |
| `lt.mjs 1 cascade` / `lt.mjs 1 text` (scratchpad) | one lesson each: start, then 3 turns, each followed by the speech request the client makes (`/api/voice/tts-stream` or `/api/tts`), then end | 2 lessons |
| `lt.mjs 10 cascade` | **10 concurrent lessons**, each on its own new account, same steps. Wall time 15.7 s, which is well under the 5-minute cap | 10 lessons, 30 turns, 40 speech streams |
| `voice.mjs` | realtime lesson start, then `/api/realtime/token` ×3, `/api/voice/stt-token` ×2, and `/api/voice/transcribe` ×4 on a real 4 s speech clip (the teacher's own TTS PCM as WAV) | 1 account |
| `perf.mjs` (Playwright Chromium 1194) | cold cache, new context per page. Viewport 360×740, DPR 2, touch, Android UA, 9 pages, under three profiles: none; **Fast 3G (562.5 ms RTT, 1.44 Mbps down) + 4× CPU**; Slow 4G (150 ms, 1.6 Mbps) + 4× CPU. LCP, CLS and long tasks come from PerformanceObserver; bytes from CDP `loadingFinished` | 27 page loads |
| ARM | resources in the resource group and the subscription; the `taxila-web` template, scale and probes; `taxila-env` logging; the `forge-g2-runner` job and its executions; metric alerts, action groups and scheduled-query rules; `Requests` by status for 48 h; CPU, memory and replicas during the load test; model deployment quotas; Blob service properties | — |
| DB (`server/db.js`, read-only selects) | row counts in the Conductor tables, applied migrations, leftover test guardians | — |

- **Cleanup.** Every account this audit created (16) was deleted through `DELETE /api/account` in a `finally` block,
  and every delete returned 200. The `@taxila.test` guardian count was **6 before this audit and 6 after** (see
  §4). Those 6 are `it+…@taxila.test`, created 2026-10-03 16:06 to 16:10 UTC by an older run of
  `tests/lesson-api-e2e.mjs`. They are not this audit's, so I left them.
- **Every shell command ran under `timeout`.** Total load-test wall time was 15.7 s (10 lessons) plus about 14 s
  each for the n=1 runs.
- **Harness note.** Chromium through the proxy worked directly this time: 1.3 s for the first load, then 0.13 s.
  So the page-load numbers are the browser's own, with no `context.route` fulfilment. The network origin is the US
  sandbox, **not an Indian phone**. See gap 5 for what that hides.

## 1. Verdict

**The live lesson path is fast and stable at the owner's testing scale.** At 10 concurrent cascade lessons:
- 0 errors in 130 requests;
- turn latency did not move: p50 1.22 s (1.28 s at n=1);
- the replica peaked at 0.095 vCPU of 0.5;
- the server-side TTS prewarm hit on every reply, so the first audio byte came 0.13 s (p50) after the client asked.

The DB is 8 ms per query from the container.

**Everything that happens *between* lessons is not running.**
- **The Conductor is not wired into the product.** No route ingests an event, every Conductor table has 0 rows,
  and the worker app does not exist.
- **So these never happen:** daily notes, weekly parent letters, nightly Forge G2 builds, wake-ups and day plans.
- **There is no monitoring or alerting.** The Container Apps environment sends its logs nowhere, so a production
  error leaves no trace.
- **Backup is 24 h of Neon point-in-time restore,** with no snapshots and no Blob soft-delete.
- **Three experience gaps the owner will feel:**
  - the text lane's voice arrives 1.6 to 2.1 s after its text, because `/api/tts` is unstreamed;
  - the landing LCP is 5.1 s on Fast 3G;
  - every serving component (app, models, DB) is in the US East region, about 250 ms away from an Indian phone,
    and each voice turn pays that 3 times.

## 2. Measurements (production)

### 2.1 Lesson path, server latency seen from the sandbox

| step | n=1 text | n=1 cascade | 10 concurrent cascade: p50 / p90 / max | prod-smoke ×3 |
|---|---|---|---|---|
| `POST /api/lesson/start` | 1004 ms | 1436 ms | 1274 / 1853 / 1853 ms | 1215 to 1359 ms |
| `POST /api/lesson/turn` (Director reply) | 1305 to 2669 ms | 1276 ms p50, 2675 max | **1217 / 1546 / 2065 ms** (n=30) | 958 to 2242 ms |
| cascade `tts-stream`, first PCM byte | — | 144 ms p50 / 180 max | **135 / 193 / 211 ms** (n=40; prewarm hit 40/40) | — |
| text lane `/api/tts` (whole mp3, unstreamed), first byte | **1616 to 2085 ms** (n=4) | — | — | — |
| `POST /api/lesson/end` (summary model call, awaited) | 1599 ms | — | 1603 / 1856 ms | 1353 to 1608 ms |
| realtime lesson start (instructions only) | — | 142 ms | — | — |
| `/api/realtime/token` | — | 164 to 170 ms (n=3) | — | — |
| `/api/voice/stt-token` | — | 152 to 163 ms (n=2) | — | — |
| `/api/voice/transcribe` (4 s clip) | — | **366 to 506 ms** (n=4; confidence 0.83 to 0.98, correct Hinglish) | — | — |
| signup (scrypt) | 540 ms | 562 ms | **1436 / 1562 ms** (CPU-bound on 0.5 vCPU) | — |
| `/api/health?db=1` | 5× `select 1` = 8 to 9 ms each, n=3 | | | |

**Composite: speech end to first teacher audio on the cascade lane, server and sandbox.** It is about 0.9 s
endpoint silence + 0.45 s transcription + 1.2 s turn + 0.14 s TTS ≈ **2.7 s**, before the India-to-eastus2 round
trips (gap 5). That is consistent with `cascade-latency-integration-2026-10-03` (median 3.2 s from the sandbox
in-process).

**Composite: typed answer to teacher voice on the text lane.** It is turn 1.3 s + `/api/tts` 1.6 to 2.1 s ≈
**3 to 4.8 s**. The caption appears about 1.7 s before the voice.

### 2.2 Page loads, 360×740, cold cache (`docs/design/gap-audit/shots/smooth/<profile>-<page>-360-r2.png`)

| page | none: FCP / LCP | **Fast 3G + 4× CPU: FCP / LCP** | Slow 4G + 4× CPU: FCP / LCP | transferred (JS) | API chain on Fast 3G |
|---|---|---|---|---|---|
| landing `/` | 1636 / 1784 | **3792 / 5112** | 2508 / 3296 | 345 KB (125) | `/api/me` 401 at 4.4 s |
| `/promises` | 956 / 956 | 3180 / 3180 | 1828 / 1828 | 232 KB (124) | |
| `/start` (onboarding step 1) | 1292 / 1292 | 3764 / 3764 | 2072 / 2072 | 224 KB (136) | |
| `/who` | 904 / 904 | 3052 / 3052 | 1764 / 1764 | 204 KB (117) | lock, pin, me in parallel at 3.0 s |
| child home `/c/:id` (lands on Hello) | 1544 / 1544 | **4980 / 4980** | 2916 / 2916 | 254 KB (137) | **serial**: me 3.0 s → plan 4.5 s → tutors 5.6 s |
| map | 1368 / 2008 | 4108 / **6856** | 2256 / 4040 | 443 KB (132) | me 3.1 s → plan 4.8 s / map 4.8 s |
| notebook | 1340 / 1660 | 3880 / 5724 | 2068 / 3024 | 298 KB (126) | me → plan |
| parent `/parent` | 1168 / 1328 | 3420 / 4100 | 2024 / 2320 | 236 KB (145) | |
| lesson `?mode=text` | 1168 / 1440 | 4128 / 5580 | 2352 / 2988 | 416 KB (163) | me 3.0 s → **start 5.5 s → tts 7.3 s** (first voice) |

- **CLS** is at most 0.036 everywhere (parent page). **Long tasks** under 4× CPU: 1 to 3 per page, at most 340 ms
  total, on the lesson page. **No horizontal scroll** at 360 on any page.
- **Bundles** (local `dist/`, the same `main-W1OdjGXm.js` as prod), compressed with brotli:
  - the 87 JS chunks total **472 KB**;
  - initial landing JS is about 125 KB on the wire;
  - the largest chunks are `stage3d` 110 KB (lazy, never requested in these loads), `jsx-runtime` 59 KB (it
    carries React plus the router: a misleading name), `LessonScreen` 40 KB, `useTeacher` 32 KB, `parent` 14 KB.
- **Delivery.** Hashed assets are served brotli with `immutable`, and HTML with `no-cache`.
- **Image weight.** The container image carries **66.7 MB of `dist/`, of which 59 MB is `.glb`**, including 6
  `teacher-bakeoff/**` heads of 5.6 to 5.9 MB each. The app's source references none of them (grep `\.glb` in
  `src/`: none).

### 2.3 Error rate (ARM `Requests` metric, last 48 h, all traffic)

- **Totals:** 5,449 requests; 2xx 5,306, 4xx 137, **5xx 6 (0.11%)**.
- **The six 5xx:** 4 × 503 and 2 × 502.
  - 503 means "no teaching content for this topic" (`lesson.js:97/510`). Today every one of the 830 curriculum
    topics has a file kit, so the cause is unknown.
  - 502 means an AzureError from speech or transcription (`tts.js:58`, `voice.js:104/138/235`).
- **The routes behind these cannot be found, because no logs are retained (gap 2).** During this audit's own runs
  there were 0 5xx in about 220 API calls.

## 3. Gaps, ranked

### G1. BLOCKS: the Conductor is not connected and its worker is not deployed

As a result, there are no daily notes, weekly letters, nightly Forge, wake-ups or day plans.

- **Evidence: the worker does not exist.**
  - ARM `GET containerApps/taxila-worker` returns **404 ResourceNotFound**.
  - The resource group holds only `taxila-web`, `forge-g2-runner` (job), `taxila-env`, `taxila-forge-untrusted`,
    `taxilacr`, `taxilaforge` and the Foundry account.
- **Evidence: the Conductor tables are empty on prod.**

  | table | rows |
  |---|---|
  | `job` | **0** |
  | `wakeup` | **0** (none ever fired) |
  | `student_event` | **0** |
  | `conductor_state` | **0** |
  | `day_plan` | **0** |
  | `decision_log` | **0** |
  | `notification` | **0** |
  | `parent_report` | **0** |

  For comparison, the same database holds 12 lessons, 134 turns and 36 `kt_evidence` rows.
- **Evidence: nothing in the product writes to the Conductor.** `ingestStmt` (`server/conductor/index.js:32`) has
  **no caller** outside `server/conductor/` (grep over `server/` and `src/`). The routes import only the clock
  helpers (`parent.js:27`, `child.js:20`). So even a deployed worker would find nothing to do.
- **Evidence: Forge G2 only runs by hand.** `forge-g2-runner` is `triggerType: Manual`. All 18 executions ran
  2026-10-03 05:58 to 07:24 UTC (the e2e test runs; 2 Failed). The only automatic starter is the `forge.g2.nightly`
  Conductor job (`decide.js:161`), which never runs.
- **Owner impact while testing:**
  - the parent "reports" area stays empty forever;
  - no Sunday letter arrives;
  - nothing is built overnight for "tomorrow";
  - the decision `conductor-hosting-lanes` describes a system that does not exist on Azure.
- **Work to close it:**
  1. Emit `ingestStmt` events inside the existing lesson transactions (start, turn commit, end, consent change,
     controls change) and run one inline `step()` after each ingest, as the decision specifies.
  2. Run `node scripts/deploy-worker.mjs`. It already builds the image, derives the direct Neon URL and sets the
     liveness probe. Note: taxila-web pulls from ACR with a registry password, so the AcrPull note does not apply.
  3. Add the ACA scheduled job for the nightly rollups and the canary.
  4. Write an e2e test on a Neon branch: a lesson day yields `report.daily` at 04:10 IST the next day, and a Sunday
     yields `parent.letter`.
  5. Wire `forge.g2.nightly` into the night fold (open item `open-forge-g2-integration`).
- **Estimate:** 3 to 4 engineer-days (wiring 2, worker deploy and verify 0.5, scheduled job 0.5, e2e 1).

### G2. BLOCKS (for thorough testing): no logs, metrics, alerts or error reporting

Every bug the owner hits during testing will be undiagnosable after the fact.

- **Evidence: logs go nowhere.** `taxila-env` has `appLogsConfiguration: { destination: null }`, and there is no
  Log Analytics workspace in the resource group (the only one in the subscription is `vyakti-voice-law`). The
  server's only error output is `console.error("route error", …)` (`server/router.js:38`), so stdout is visible
  only in a live `az containerapp logs show` stream and is then lost. The same is true for `forge-g2-runner`
  (decision `forge-g2-runner-aca-job`: "no Log Analytics").
- **Evidence: there are no alerts.** The subscription has 1 metric alert and 1 action group, both for
  `vyakti-replica-processing` and none for Taxila, and 0 scheduled-query rules.
- **Evidence: there is no external probe.** No availability test or uptime probe watches the site.
- **Evidence: the health check never touches the DB.** Liveness and readiness hit `/api/health`, which does not
  query the database (`router.js:14`; DB only with `?db=1`). A dead Neon connection leaves the replica "healthy".
- **Evidence: the client reports nothing.** There is no `unhandledrejection` or `window.onerror` reporter in
  `src/`, so a white screen on the owner's phone is invisible.
- **Evidence: no request logging.** There is no request log and no latency histogram per route. The 6 5xx in §2.3
  cannot be attributed to a route.
- **Work to close it:**
  1. Create a Log Analytics workspace and attach it to `taxila-env` and `taxila-forge-untrusted` (both are ARM
     PATCHes).
  2. Write one structured JSON access-log line per API request: route, status, ms, revision, lessonId hash, and
     the error class for 5xx.
  3. Add a client error beacon (`POST /api/client-error`, rate-limited, with no child text).
  4. Create Azure Monitor alerts that email the owner:
     - 5xx above 1% over 5 minutes;
     - replica restarts;
     - p90 of `/api/lesson/turn` above 3 s (log query);
     - worker liveness;
     - Forge job `Executions{state=Failed}` above 0. The vyakti alert is the template.
  5. Add a DB check to readiness only. Liveness stays shallow, so a Neon blip does not cause restart loops.
  6. Set a Log Analytics daily cap so cost stays inside the grant.
- **Estimate:** 1.5 to 2 days.

### G3. DEGRADES (risk of data loss during testing): backups are 24 h PITR only

- **Evidence: Neon.** Project `taxila-us` (`royal-fire-14595065`) has `history_retention_seconds: 86400`. The
  snapshot schedule is `[]` and there are no snapshots. Branch `main` is `protected: false`. Compute is fixed at
  1 CU (min 1 = max 1).
- **Evidence: Blob.** Storage `taxilaforge` is Standard_LRS with blob `deleteRetentionPolicy.enabled: false`, and
  versioning is not set. A bad migration, an errant `DELETE`, or a test script run against prod (the evals
  default to the prod `DATABASE_URL`) is recoverable for 24 h only. Forge G2 review evidence and the published
  child folders are not recoverable at all.
- **Work to close it:**
  - raise PITR to 7 days (the Launch plan allows it);
  - add a daily Neon snapshot schedule;
  - protect `main`;
  - enable Blob soft-delete (7 days) and container soft-delete;
  - write a one-page restore drill: branch from a timestamp, then point a revision at it, done once and timed;
  - point test scripts at a Neon test branch by default (`TEST_DATABASE_URL` already exists).
- **Estimate:** 0.5 day.

### G4. DEGRADES: the text lane's voice lags its text by 1.6 to 2.1 s

The text lane is the quiet mode, the `?mode=text` lessons, and the fallback whenever the mic is unavailable.

- **Evidence: the server.** `/api/tts` (`server/routes/tts.js`) synthesises the whole reply to mp3 and only then
  sends it. Measured first byte: 1616, 1700, 2085 and 1623 ms (n=4). The cascade lane's
  `/api/voice/tts-stream` streams sentences with a server prewarm, and its first byte is 135 ms p50 (n=40).
- **Evidence: what the child sees.** In the browser, a text lesson on Fast 3G shows `lesson/start` at 5.5 s and
  `/api/tts` at 7.3 s (`fast3g-lesson-text-360-r2.png`). Each turn reads as "caption, then a pause, then the
  teacher starts".
- **Work to close it:**
  1. Have `TextLink` use the same `tts-stream` + `PcmStreamPlayer` path and call `prewarm()` from `/turn` for
     text-lane replies too (it already runs for cascade, `lesson.js:889`).
  2. Keep `/api/tts` only for "Hear" replays.
  3. Re-measure with `evals/cascade-latency.mjs` in a text arm.
- **Estimate:** 1 day.

### G5. DEGRADES: everything serves from US East, about 250 ms from India, and voice turns pay it 3 times

- **Evidence: placement.**
  - The app is in eastus2.
  - Neon is in aws-us-east-1. Mumbai is not offered to this Neon org (decision `infra-segment`).
  - All models, including `taxila-realtime`, are on `raghavsharma1729-compan-resource` in eastus2.
- **Evidence: the cascade turn is three round trips.** The client makes 3 sequential requests per child turn:
  `transcribe`, then `turn`, then `tts-stream`. India to US-East RTT is roughly 220 to 280 ms [U, not measured
  from India].
- **Evidence: the hidden cost.** The 2.7 s composite in §2.1 is from a US sandbox. From India, add about 0.7 to
  0.9 s for cascade. For realtime, add about 0.25 s each way of WebRTC media on every exchange. All page loads add
  about 0.25 s per serial API hop, and child home has 3 serial hops (me → plan → tutors).
- **Work to close it:**
  1. **Cheap, about 1.5 days:** fold transcription into `/turn`, so the turn accepts the audio clip or the
     streamed-STT final, and start the `tts-stream` from the turn's own response (one request returns JSON
     headers, then PCM). That cuts the turn to 1 round trip. Also make child home fetch `plan` and `tutors` in
     parallel with `/api/me`, or return them from one `/api/child/boot`.
  2. **Structural, about 3 to 5 days plus quota work:** move `taxila-web` to Central India behind Azure Front
     Door and keep the models where quota exists. Measure first: one `curl -w` probe from an Indian vantage point,
     or the owner's phone, against `/api/health` and `/api/health?db=1`. Model calls are still about 250 ms per
     hop to eastus2, so this only pays if the DB and the client hops dominate. **Measure before moving.**
- **Estimate:** 1.5 days for the round-trip consolidation. The region move is a separate decision.

### G6. DEGRADES: the landing LCP on Fast 3G + 4× CPU is 5.1 s, against the 2.5 s gate in `b4-hero-art-lcp`

Other first-paint pages land at 3 to 5 s.

- **Evidence: the numbers.** §2.2 table:
  - landing FCP 3.8 s / LCP 5.1 s;
  - map LCP 6.9 s;
  - child home FCP 5.0 s, because Hello renders only after `me → plan → tutors`, with 1.5 s and 1.1 s gaps
    between hops.
- **Evidence: the payload.** Every page pulls 117 to 163 KB of compressed JS before any API call can start.
  `/api/me` is first issued at about 3.0 s on Fast 3G. Slow 4G is better (landing LCP 3.3 s), but still over the
  gate.
- **Caveat.** Fast 3G latency emulation in CDP applies to every request, including the first TLS handshake via
  the proxy, so the absolute value is pessimistic against the decision's own harness. The serial API chain is
  real under any network.
- **Work to close it:**
  1. Inline a skeleton and the hero art preload for `/` and `/c/:id` in `index.html`.
  2. Start `/api/me` from an inline script before the bundle parses, as a promise the app awaits.
  3. Parallelise or merge `plan` and `tutors` (see G5).
  4. Split React Router plus React from the app code only if measurement shows it matters.
  5. Re-run `perf.mjs fast3g` as a CI-style gate (it is self-cleaning and runs in about 60 s).
- **Estimate:** 1.5 to 2 days.

### G7. DEGRADES (unverified risk): the realtime lane's quota may cap concurrent voice lessons at about 2 to 3

- **Evidence: the quota.** `taxila-realtime` (gpt-realtime-2.1) is GlobalStandard capacity 10, which means
  **100,000 tokens/min and 200 requests/min** (ARM `rateLimits`).
- **Evidence: the per-lesson load.** The realtime instructions are 4,137 characters, about 1.2k tokens
  (measured). Each response re-reads the whole conversation (instructions plus accumulated audio tokens), and the
  session sets no `truncation` or retention (grep). Measurement `forge-azure-capacity` found that Azure's limiter
  counts cached tokens. So a 20-minute lesson at about 4 responses/min with about 10k tokens of context costs
  about 40k TPM. **Inference, not measured.** Two or three simultaneous realtime lessons could get rate-limited.
- **Evidence: what the child would get.** In the client, a realtime `error` or `response.failed` emits a
  non-fatal error ("the teacher could not answer", `src/lesson/realtime.ts:322/347`). There is **no automatic
  fall to the cascade lane** on 429. So the owner testing with 3 or 4 children, or 3 or 4 tabs, at once could
  hear a teacher who stops answering.
- **Work to close it:**
  1. Run a 4-parallel realtime soak from a machine with WebRTC (a 20-minute lesson each, logging
     `rate_limits.updated` events, which the client currently drops at `realtime.ts:326`).
  2. Request a capacity raise for `taxila-realtime`, or route to `gpt-realtime-2.1-mini` (300k TPM, already
     deployed).
  3. On a 429 or `rate_limit_exceeded`, switch the lesson to cascade mid-sitting. The `voice-lane-budget` decision
     already allows a lane change "for an outage".
  4. Set `truncation: { type: "retention_ratio" }` on the session.
- **Estimate:** 0.5 day soak, 1 day failover, plus the quota request (owner action).

### G8. DEGRADES: lessons refuse to start outside 07:00 to 21:00 IST by default

- **Evidence:** `context/open.md:44`. `prod-smoke.mjs` and all of this audit's probes had to
  `POST /api/parent/controls` with `00:00–23:59` before `lesson/start` returned anything other than 409. The owner
  testing late at night with a fresh child gets a refusal (the flows audit records the same 409 as its gap 1).
- **Work to close it:** show the parent an explicit "outside learning hours, open now?" with one tap that writes
  the controls row, or default a new account's first day to open hours. Make the 409 copy say which control
  refused the start.
- **Estimate:** 0.5 day.

### G9. DEGRADES: deploys are not gated, and the branch carries ungated WIP

- **Evidence: no CI.** There is no `.github/workflows/`. `scripts/deploy-azure.mjs` builds whatever is pushed on
  the current branch. It runs no `tsc`, no `npm test` and no `verify-release`, and checks only `/api/health` on
  the new revision.
- **Evidence: the branch history.** The last 27 commits after the deployed `aa263ce` include 17 "WIP checkpoint
  (not gated)" commits. `server/`, `src/`, `shared/` and `db/` happen to be unchanged since `aa263ce` (`git diff
  --stat`: empty), so prod is not at risk today. The next `deploy-azure.mjs` run from this branch would still ship
  whatever the agents left mid-edit.
- **Evidence: rollback is not scripted.** It is "re-activate the previous revision" by hand. Revisions are in
  Single mode.
- **Work to close it:**
  1. Have `deploy-azure.mjs` refuse unless `npx tsc -b && npx vite build && npm test` passed on the same sha
     (record a stamp file per sha).
  2. Run `scripts/prod-smoke.mjs` against the new revision's own FQDN before traffic moves, by switching to
     Multiple revision mode with a 0% label.
  3. Add `--rollback` to flip traffic to the previous ready revision.
  4. Add a GitHub Actions workflow running the gates on push.
- **Estimate:** 1 day.

### G10. POLISH: smaller items found on the way

- **Unauthenticated `/api/health?db=1`** runs 5 DB queries per call (`router.js:16`). It is a cheap abuse lever.
  Restrict it to an internal header or drop it in production (0.1 day).
- **The image carries 59 MB of unused `.glb`** (`public/assets/teacher*/**`), which slows the ACR builds (about
  50 s) and every revision pull. Move the bakeoff heads out of `public/` (0.1 day).
- **Brotli is compressed synchronously on the first hit** per file per replica (`serve.mjs:39`, quality 9). On a
  fresh revision, the first request for `stage3d` (523 KB raw) blocks the event loop for tens of milliseconds,
  in the middle of other children's turns. Pre-compress at build time (`vite-plugin-compression` or a post-build
  script) and serve the `.br` files (0.25 day).
- **`/api/me` returns 401 on the public landing,** which logs a red console error on every visit
  (`none-landing-360-r2.png` run). Make the public shell skip the call when there is no session cookie, or answer
  200 `{ guardian: null }` (0.1 day).
- **`lesson/end` awaits the summary model call**: 1.35 to 1.86 s (n=14). If the summary screen blocks on it, show
  the "what we did" card from local state and fill the parent note in later (0.5 day; check the client first).
- **Signup is CPU-bound** under concurrency: 0.56 s alone, 1.44 s p50 at 10 at once, from scrypt on 0.5 vCPU.
  This is fine at owner scale. Give `taxila-web` 1 vCPU before any public launch (config only).
- **Prewarm, the comprehension `PENDING` map and the TTS/clip limiters are per process.** At more than 1 replica
  (HTTP scale at 50 concurrent requests, max 5), `/turn` and `tts-stream` can land on different replicas. A miss
  costs a full `tts-stream` setup (about 50 to 490 ms, per `prewarm.js` comments) and silently loses the blind
  grader's verdict for that turn (`later.js:7`). There is no stickiness today (`stickySessions: null`). Enable
  ACA session affinity (config only) before load grows. The owner's testing will run on 1 replica.
- **Neon scales to zero** (`suspend_timeout_seconds: 0`, the default of 5 min). At 04:33:51 UTC the compute
  started cold on this audit's first query. The first request after an idle gap pays a Neon cold start (typically
  0.5 to 1 s [U], not isolated here). If it shows in the owner's first lesson of the day, disable suspend on
  `main` (cost line; it is always on anyway once the worker exists, X1).
- **The pg pool drops idle connections after 60 s** (`db.js` `idleTimeoutMillis: 60_000`). After about 4 idle
  minutes, the first `select 1` took **101 ms** and the next ones 7 ms (`/api/health?db=1` at 04:49:00 UTC). So
  the first turn after a child pauses for over a minute pays a new TLS connection to Neon. Raise the idle timeout
  to above 10 min, or keep 2 connections warm (0.1 day).
- **Leftover test guardians:** 6 × `it+…@taxila.test` from 2026-10-03 16:06 to 16:10. The current
  `tests/lesson-api-e2e.mjs` deletes its accounts in a `finally`, so these are from a run killed mid-way. Delete
  them, and add a sweeper that removes `@taxila.test` guardians older than 1 h (0.1 day).

## 4. What could not be verified from this sandbox

- **Realtime voice (WebRTC):** connecting, first audio, barge-in, audio quality, lip-sync, and behaviour under the
  100k TPM cap (G7). Only the token mint (165 ms) and the realtime `lesson/start` (142 ms) were measured.
- **Streaming STT over the realtime transcription session:** only the `stt-token` mint (about 160 ms) and batch
  `/api/voice/transcribe` (370 to 510 ms, correct) were measured. The flows audit saw the browser fall back to
  push-to-talk (`cascade: transcription call unavailable`), which may be a harness effect.
- **Mic capture, AudioWorklet, PCM playback underruns** on a real budget Android phone; real 3D/GPU face tiers;
  frame rate.
- **Latency from India:** every number above is from a US East sandbox. G5 is an estimate until it is measured
  from India.
- **Overnight behaviour:** the 04:00 IST learning-day roll, `report.daily` and `parent.letter`. They cannot run
  (G1) and could not be observed in any case without moving the clock.
- **Historical error rates per route:** no logs exist (G2). Only the aggregate status counts for 48 h are
  available.
- **Neon cold-start cost** was not isolated (see G10). The pool-reconnect cost was measured at 101 ms.
- **Final leftover check (04:49 UTC):** 6 `@taxila.test` guardians, the same 6 as before the audit, none of them
  created by this audit.

## 5. Reproduce

All probes are self-cleaning and capped:
- `scripts/prod-smoke.mjs`;
- the scratchpad probes `lt.mjs <N> <cascade|text> <tag>` (one account per lesson, each fetch capped at 60 s, the
  whole run at 200 s, a DELETE for each account in `finally`);
- `voice.mjs`;
- `perf.mjs <none|fast3g|slow4g>` (Playwright, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, proxy
  `HTTPS_PROXY`, a hard 270 s exit).

Promote them to `evals/` or `scripts/` to keep them. Leftover check: `select count(*) from guardian where email like
'%@taxila.test'` must equal the count before the run (6 at the time of writing).
