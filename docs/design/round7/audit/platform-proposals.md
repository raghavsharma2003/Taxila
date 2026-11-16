# Audit platform: proposals for the owner (2026-11-10)

These are the platform findings that are not plain bugs: each changes a design, what gets deployed, or its cost, so none
was built. Each says what happens now, the change, and what it costs. Finding ids are from `platform.md`.

## PLAT-19: the web's database pool has no time limit

**Now.** A request on the web waits for a database connection or a query with no limit. If the database stalls, or every
pooled connection is busy, a child's lesson turn hangs until the browser gives up. The Conductor's own pool already stops
after 10 seconds.

**Change.** Give the web pool the same limits: 10 s to get a connection, and a statement timeout (15 s, the worker's
value) in `server/db.js pgPoolConfig`.

**Cost.** One config line. Risk: a slow but legitimate query (a parent report, an export) that today takes more than
15 s would start to fail; we should look at the slowest queries in the access log before choosing the number.

## PLAT-20: the Forge G2 runner cannot be redeployed

**Now.** `scripts/forge-g2-deploy.mjs` checks that every file the runner imports is in its small image, and refuses.
The runner's imports have grown: 18 files outside the image today (the endpoint and lane config, the flight recorder,
the price book, the database module, four learner-model files). Its nightly job is paused, so no child is affected.

**Change, one of:**
1. **Retire the lane**: delete `infra/forge-runner/`, the deploy script and the paused job (one deletion commit). The
   Studio's other build paths stay.
2. **Keep it**: cut the runner's imports back (pass the price and the endpoint in, instead of importing the recorder and
   the lanes), then add what is left to the image. Copying the 18 files as they are would put the database module and
   the recorder into the untrusted build container, which the runner's design keeps out.

**Cost.** Option 1: an hour, and the lane is gone until rebuilt. Option 2: a day of Studio's time plus one Azure image
build when it is next deployed.

## PLAT-34: trace blobs whose row is gone are never deleted

**Now.** Nightly retention deletes a trace row's blob (an rrweb chunk, an audio clip, a model call's full request) only
by looking at the rows. A blob whose row never landed (the batch failed) or was already deleted stays in the `trace`
container for good. Those can hold a tier-2 account's recordings.

**Change.** Retention also lists the container by day folder (paths start with the date) and deletes every blob older
than 90 days, whatever the rows say.

**Cost.** A small change to `server/trace/erase.js` and the blob module. One list call per day folder per night, a few
storage transactions a day: well under $1 a month.

## PLAT-41: about 200 server settings exist only on the live Container App

**Now.** The server reads about 250 settings. About 200 of them are set by neither deploy script nor the key list; they
live only on the live `taxila-web` template. Each has a default in code, so nothing breaks, but if the Container App
were lost, its settings could not be rebuilt from the repo.

**Change.** One checked-in manifest of setting names and their non-secret values (secrets by name only), and the
deploy prints the difference between it and the live template (no automatic change).

**Cost.** Half a day to write the manifest from a read of the live template (names and plain values only). No Azure spend.

## PLAT-45: the trace masks have drifted, and sign-in codes are stored

**Now.** The browser's mask and the server's mask hide different lists of keys. The server's leaves `parentPhone`,
`pinHash`, `otpCode` and phone numbers inside text. Neither side hides the key `code`, so the bodies of
`POST /api/auth/code/verify` and `POST /api/pair/redeem` are stored with the one-time code in them. The codes expire in
minutes and work once, so the harm is small, but they should never be stored.

**Change.** One shared list in `shared/trace.ts` used by both sides, and mask `code` on those two routes only. Masking
`code` everywhere would also hide every error code in the traces, which we read to debug.

**Cost.** Half a day, platform only.

## PLAT-40: the teacher agent shares taxila-gpt6 with Studio builds (measure first)

**Now.** When a lesson runs on the teacher agent lane, its turns go to `taxila-gpt6`, which Studio's build arms also use.
That pool is deliberately uncapped: capping it starved live Studio builds (measured, the 21st prefetch build waited 55 s).
The audit's fix (cap background calls there) was reverted for that reason.

**Measure.** Over a day with the agent lane on for the owner cohort: count `model.call` rows on taxila-gpt6 with
status 429 or a retry, split by lane (agent turn vs Studio build), from `trace_event`. If agent turns see none, there is
nothing to fix.

**Change, only if they do.** Give the agent its own deployment (one `TAXILA_TEACHER_DEPLOY`), so neither pool is capped.

**Cost.** The query is free. A new deployment is a quota request and no standing cost (pay per token).

## PLAT-50: the worker does not flush its flight recorder on shutdown

**Now.** When the worker stops (a deploy, a restart), up to a second of its trace events in memory is lost. The web
already flushes on shutdown.

**Change.** Call the recorder's flush before closing the pool in `server/worker.mjs shutdown()`.

**Cost.** Two lines. It changes the worker's shutdown order, so it ships with the next worker deploy.

## PLAT-51: the first queries can build more than one pool, and the pool is never closed

**Now.** `server/db.js` makes its pool on first use. If several requests arrive together at boot, each can build its own
pool (only one is kept); the others hold connections until they time out. The pool is also never closed on shutdown.

**Change.** Keep the promise of the pool, not the pool, so concurrent first callers share one; export a `closeDb()` the
web's shutdown calls.

**Cost.** A small change; it touches every query's first call, so it should go in with PLAT-19 and be watched on the
test branch first.

## PLAT-54: two defaults for the answer-check model

**Now.** The code's default for the answer-check (classify) model is `taxila-fast`; the deploy sets
`grok-4-1-fast-non-reasoning`. Production uses Grok. A local run or test that does not set it uses taxila-fast, so the
hedge and fallback logic (which only fires when the two differ) behaves differently from production.

**Change.** One default: the code default becomes `grok-4-1-fast-non-reasoning` and the deploy stops setting it. Brain owns
the classify code, and many of its tests assume the current default, so Brain should make this change.

**Cost.** Brain's time to re-check its classify tests. No change to production.

## Also seen: `TAXILA_HOST` and `TAXILA_REGION`

Both are set on the revision by the deploy scripts and read by no code. Removing them changes what gets deployed (two env
names), so they stay until the next planned change to the deploy env.
