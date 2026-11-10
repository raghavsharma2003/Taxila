# Audit: platform (area 8), 2026-11-09

Branch `claude/r7-audit-platform`, from `int/r6` at integration 21a. 60 findings survived the skeptic pass (none refuted;
9 corrected in detail or severity, noted in the evidence). Ranked by severity, then by how much breaks.

Counts: **P0 2, P1 3, P2 30, P3 25.** By kind: broken 25, inconsistent 21, not good enough 10, no longer needed 4.

Phase 2 (2026-11-10, second session): statuses below are current. Proposals are in `platform-proposals.md`; migrations
are written, not applied. Status words: **fixed** (sha given), **fixing** (I fix it under the phase 2 rule: in my area, broken or inconsistent, no
migration, no deploy-script behaviour, no deletion), **main** (needs main's reply: deploy script, migration, deletion,
redesign), **routed** (another stream owns the file).

## Table

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| PLAT-01 | P0 | broken | platform | One request `GET /%` kills the web process | `server/serve.mjs:137` | catch the decode, answer 400 | fixed 6fa4df68 |
| PLAT-03 | P0 | broken | platform | Rollback after a failed web deploy sends production to the revision that just failed | `scripts/deploy-azure.mjs:116-124, 134-140, 470-475`; `scripts/release.mjs:140` | no `previous` label = refuse; add `--to <revision>` fed from the captured revision; drop `web` from the hint | fixed 891d1d8c |
| PLAT-04 | P1 | broken | platform | The nightly job cannot load its sweep in the worker image, so trace retention (30/90-day deletion) never runs | `Dockerfile.worker:9-14`; `server/conductor/sweep.js:23`; `server/conductor/ops.mjs:60-69` | `COPY src ./src` in `Dockerfile.worker` and in `deploy-worker.mjs` `localContext()`; extend the packaged test to import `sweep.js` | fixed 891d1d8c |
| PLAT-06 | P1 | broken | voice | A paired child device is refused on the same-origin D5 voice socket | `server/duplex/d5route.js:113`; `server/auth.js:68`; `server/serve.mjs:166-171` | set the child-scope mark on the request in `handleD5Upgrade` before `authorizeD5` | routed |
| PLAT-07 | P1 | broken | platform + learning | On a paired device the child's avatar, interests and Hello picks never save (403, swallowed) | `server/pair/scope.js:9-16`; `src/child/api.ts:119,123`; `src/child/screens/Hello.tsx:102,117`; `Me.tsx:72` | add both routes to the scope AND make `updateChild` / onboarding refuse parent-only fields from a device (see note) | fixed 083f8de8 (platform half); learning half: patch to-learning/005 |
| PLAT-05 | P2 | broken | platform | The 5-wrong-tries limit on emailed sign-in codes does not hold under parallel requests | `server/signin/code.js:118-126` | record the attempt first, then count | fixed 14b31b7b |
| PLAT-08 | P2 | broken | learning | A password set through reset with a leading or trailing space can never log in | `server/routes/account.js:163,172` vs `:30,57`; `server/http.js:57-63` | read the password untrimmed in signup and login | routed |
| PLAT-09 | P2 | broken | learning | Deleting a child leaves that child's paired device signed in, able to act on a sibling's lesson | `server/routes/account.js:410-415`; `db/migrations/041…sql:12`; `server/brain/turn.js:110,121`; `server/routes/studio.js:43` | delete the device's `auth_session` rows in `deleteChild`'s transaction | routed |
| PLAT-10 | P2 | broken | learning | The burst limiter on sign-in routes is keyed on a value the caller chooses | `server/routes/parent.js:82`; `server/router.js:86-90` | with no valid session, key on `ipOf(req)` | routed |
| PLAT-11 | P2 | inconsistent | platform | Each new sign-in code resets the wrong-try count while older codes stay valid | `server/signin/code.js:92-95, 115-118` | spend open codes when a new one is made | fixed 14b31b7b |
| PLAT-12 | P2 | broken | platform | A non-UUID child id answers 500, not 4xx | `server/auth.js:104` | UUID test at the top of `requireChild` | fixed d3cf6170 |
| PLAT-13 | P2 | inconsistent | platform | A paired device's flight recording is stored with no child, cannot be tier 2, and survives a child erase | `server/pair/scope.js`; `server/trace/routes.js:30-32, 65, 92`; `src/trace/bus.ts:128` | add the two trace routes to the scope | fixed d3cf6170 |
| PLAT-14 | P2 | broken | platform | Anyone can forge the ops page's numbers | `server/trace/routes.js:45-58`; `server/ops/routes.js:36-45` | `and src = 'server'` on the three queries | fixed 14b31b7b |
| PLAT-15 | P2 | inconsistent | games | Code reads `child_controls.play_verb`; no migration creates it | `server/play/dress.js:34`; `server/play/routes.js:70,83,139,151` | a migration plus the parent control, or remove `withVerb` | migration 042 written 8d9c6161 (not applied); parent control: games |
| PLAT-16 | P2 | broken | studio | Revealing a practice play offer throws inside `onReveal` | `server/studio/seam.js:615-617, 895-897`; `server/studio/archetypes/index.js:34-37` | return early for `play` as for `scene` | routed |
| PLAT-19 | P2 | not good enough | platform | The web process's database pool has no connect or statement timeout | `server/db.js:49-53` (vs `server/conductor/pg.js:41`) | `connectionTimeoutMillis: 10_000` and a statement timeout | proposal |
| PLAT-20 | P2 | broken | platform | The Forge G2 runner cannot be redeployed: its own closure guard exits 1 | `scripts/forge-g2-deploy.mjs:27-48`; `infra/forge-runner/Dockerfile:11-16` | add the seven missing files, or retire the lane (its nightly job is paused) | proposal |
| PLAT-22 | P2 | not good enough | platform | A release that crosses 18:00 IST stops half done: web new, worker old | `scripts/release.mjs:81-82`; `scripts/deploy-worker.mjs:50`; `scripts/release-core.mjs:44` | pass `--force` to the worker step once the release's own freeze step passed | fixed 891d1d8c |
| PLAT-23 | P2 | inconsistent | platform | `deploy-azure.mjs` has no evening-freeze check | `scripts/deploy-azure.mjs` (none) | the same `inFreeze` check unless `--force` | fixed 891d1d8c |
| PLAT-24 | P2 | inconsistent | main | CLAUDE.md and HANDOFF.md describe a deploy that leaves the worker and jobs on the old image | CLAUDE.md "Deploy", "Gates"; `HANDOFF.md:139`; `RELEASE-16.md:3-4`; `infra/gate.mjs:23` | CLAUDE.md "Deploy" = `node scripts/release.mjs <sha>`; one gate definition | routed |
| PLAT-25 | P2 | inconsistent | main | CI runs the prompt-budget check; the commit gate does not | `.github/workflows/gates.yml:40`; CLAUDE.md "Gates" | a `tests/*.test.mjs` that runs `scripts/check-prompt-budget.mjs` | routed |
| PLAT-26 | P2 | not good enough | platform | Re-running `infra/eyes.mjs` switches the worker-liveness alert off | `infra/eyes.mjs:34-36, 66-69`; `server/worker.mjs:218` | enable the rule when `taxila-worker` exists | fixed 891d1d8c |
| PLAT-27 | P2 | inconsistent | platform | The handoff key list lacks six names the release and server need | `scripts/handoff/keys.json` | add the six names | fixed 891d1d8c |
| PLAT-28 | P2 | not good enough | platform | The worker rollback can be refused while the web is already rolled back | `scripts/release-core.mjs:128`; `scripts/deploy-worker.mjs:55, 73-75` | a rollback path that skips gate evidence for an image that already served | fixed 891d1d8c |
| PLAT-30 | P2 | broken | platform | Client clock skew is subtracted twice | `src/trace/bus.ts:61, 107`; `server/trace/routes.js:53,56` | one side only | fixed a7f5ecfd |
| PLAT-31 | P2 | broken | platform | Two model calls within 10 ms overwrite each other's trace blob | `server/trace/model.js:61`; `server/trace/blob.js:20,24` | a seq that keeps its counter inside 12 characters | fixed a7f5ecfd |
| PLAT-32 | P2 | broken | platform | One string cut mid-emoji fails the whole client trace batch (500) | `server/trace/routes.js:54, 76`; `server/trace/writer.js:74` | `scrubUnstorable` in `clientRow` | fixed a7f5ecfd |
| PLAT-33 | P2 | inconsistent | platform | The client never sends the page-load id the server reads | `server/trace/context.js:28-33`; `src/trace/net.ts` | send `x-taxila-pid` | fixed a7f5ecfd |
| PLAT-34 | P2 | not good enough | platform | A trace blob whose row is gone or never landed is never deleted | `server/trace/erase.js:15-19, 54, 61-72`; `src/trace/tier2.ts:31` | retention also lists the container by day and deletes by age | proposal |
| PLAT-35 | P2 | broken | platform + voice | D5 voice spend never reaches `lesson.cost` | `server/duplex/d5route.js:138`; `server/cost/meter.js:16`; `server/cost/rollup.js:54` | pass the lesson, child and guardian ids through `d5Session` | fixed 4e0904a5 (meter); routed (call site) |
| PLAT-36 | P2 | broken | brain | The lesson cost rollup runs before its events land, once; abandoned lessons never get a cost | `server/routes/lesson.js:436-438, 828`; `server/trace/writer.js:11` | flush before the rollup; re-roll the last day's lessons nightly | routed |
| PLAT-37 | P2 | inconsistent | platform | `taxila-fast-bg` is charged at about 19 times its price | `server/cost/prices.js:13-28, 64` | add the row | fixed 4e0904a5 |
| PLAT-38 | P2 | not good enough | platform | The ledger never uses the cached-token price | `server/azure.js:197-200, 492-494` | pass the normalised usage | fixed 4e0904a5 |
| PLAT-39 | P2 | broken | platform + voice + studio | Three kinds of spend have no meter | `server/voice/speech.js:504-506`; `server/trace/model.js:42`; `server/forge/g2/model.js:42` | meter each | routed |
| PLAT-40 | P2 | inconsistent | platform | The teacher-agent deployment is not protected as a hot pool | `server/lanes.js:9, 35-41`; `server/agent/flags.js:38` | add it to `sharedHot()` | fixed 4e0904a5 |
| PLAT-17 | P3 | inconsistent | brain | Migration 016 was edited in place after it was applied | `db/migrations/016_brain.sql:38-41`; `server/brain/trace.js:141` | a new migration with the two columns, then drop the probe | migration 043 written 8d9c6161 (not applied); probe removal: brain |
| PLAT-18 | P3 | inconsistent | platform | `migrate.mjs --job` skips the `--prod` / `--backup` check | `scripts/migrate.mjs:31-37` | require them on the job path too | fixed 891d1d8c |
| PLAT-21 | P3 | broken | platform | RELEASE-16 §6 (`--migrate job`, after the India move) cannot finish | `RELEASE-16.md:137-145`; `scripts/release-core.mjs:42`; `scripts/deploy-azure.mjs:269-270` | pass the db-copy report as migrations evidence to both deploys | fixed 891d1d8c |
| PLAT-29 | P3 | not good enough | face | The greeting-clip check looks at a path the image does not have | `server/face-puppet/greetings.js:51,54` | check under `dist/` too | routed |
| PLAT-02 | P3 | broken | platform | A cookie with a bare `%` fails every signed-in route | `server/http.js:48` | keep the raw value | fixed 6fa4df68 |
| PLAT-41 | P3 | not good enough | platform | About 200 server settings exist only on the live Container App | `server/**` (249 names read, 201 in neither deploy script nor `keys.json`) | one checked-in manifest the deploy diffs | proposal |
| PLAT-42 | P3 | broken | platform | The ops page understates cost per lesson-minute | `server/ops/routes.js:47-49, 56, 63` | minutes of costed lessons only | fixed 14b31b7b |
| PLAT-43 | P3 | broken | platform | Trace batch size is counted in characters, the server limit is bytes | `src/trace/bus.ts:99`; `server/trace/routes.js:61-62` | count bytes | fixed a7f5ecfd |
| PLAT-44 | P3 | inconsistent | platform | After a lesson the client keeps recording under that lesson's id | `src/trace/lesson.ts:17` | clear it on unmount | fixed a7f5ecfd |
| PLAT-45 | P3 | inconsistent | platform | The client and server masks have drifted; sign-in and pairing codes are stored in request traces | `src/trace/mask.ts:10-26`; `server/trace/mask.js:6-19`; `shared/trace.ts:104-107` | one shared list; mask the code on the two routes | proposal |
| PLAT-46 | P3 | inconsistent | platform + voice | `d5.session` names two different events | `src/voice/trace.ts:429`; `server/cost/meter.js:16`; `server/cost/rollup.js:29,54` | rollup counts only the server one | fixed 4e0904a5 |
| PLAT-47 | P3 | broken | platform | Failed image and speech calls count as spend | `server/cost/rollup.js:23`; `server/studio/picture.js:76-79` | skip rows whose status is not 2xx | fixed 4e0904a5 |
| PLAT-48 | P3 | inconsistent | platform | `taxila-transcribe` is priced at $1.02/h instead of $0.36/h | `server/cost/prices.js:40-45, 75` | key the deployment names | fixed 4e0904a5 |
| PLAT-49 | P3 | broken | platform | `VITE_BUILD_SHA` is set by nothing | `src/main.tsx:15`; `Dockerfile` | build arg from the deploy script | fixed 84543940 |
| PLAT-50 | P3 | not good enough | platform | The worker never flushes the recorder on shutdown | `server/worker.mjs:193-205` | flush before closing the pool | proposal |
| PLAT-51 | P3 | not good enough | platform | First concurrent queries each build a pool; the pool is never closed | `server/db.js:56-63` | memoise the promise; export a close | proposal |
| PLAT-52 | P3 | inconsistent | learning | `PATCH /api/children` skips the validation `POST` has; account delete leaves the `tx_in` cookie | `server/routes/account.js:305-306, 325, 412` | reuse the normaliser; clear both cookies | routed |
| PLAT-53 | P3 | inconsistent | platform | `TAXILA_TRACE=0` leaves the recorder on; `TAXILA_BOOT_WARM=off` leaves warm-up on | `server/trace/writer.js:32`; `server/boot-warm.js:14` | both accept `off`, `0`, `false` | fixed 4e0904a5 |
| PLAT-54 | P3 | inconsistent | platform | The classify deployment default differs between code and deploy | `server/azure.js:22`; `scripts/deploy-azure.mjs:406` | one default | proposal (brain) |
| PLAT-55 | P3 | inconsistent | platform | Migrations README and RELEASE-16 text are behind the code | `db/migrations/README.md:54-58`; `RELEASE-16.md:93, 121, 149-150` | correct the lines | fixed 8d9c6161 |
| PLAT-56 | P3 | no longer needed | main | Six tables nothing reads or writes | `module_run`, `calendar`, `rate_bucket`, `kt_params`, `voicesig.calibration`, `voicesig.population_norm` | one drop migration | migration 050 written 8d9c6161 (not applied; calendar kept, it is read) |
| PLAT-57 | P3 | no longer needed | several | Dead routes and route tables | `server/duplex/routes.js`; `server/routes/modules.js`; placement registered twice; three uncalled routes | delete | deleted 36339683 (platform parts); voice, games, studio parts left to them |
| PLAT-58 | P3 | no longer needed | platform | Scripts nothing depends on | see note | delete three now; four after their docs are updated | deleted 36339683 (three); four kept (docs or context cite them) |
| PLAT-59 | P3 | no longer needed | platform | Dead exports and set-only settings | see note | delete | deleted 36339683 (most); TRACE_KINDS kept; test-only and deploy-set names kept |
| PLAT-60 | P3 | inconsistent | platform | `deploy-worker.mjs --from-tree` defaults to an old session branch | `scripts/deploy-worker.mjs:64` | require the branch | fixed 891d1d8c |

## Evidence notes

**PLAT-01.** Reproduced: started `server/serve.mjs` locally, `curl localhost:18080/%` got no answer, the log shows
`URIError: URI malformed at serve.mjs:137` and the process exited. Nothing under `server/` handles `uncaughtException`.
Every lesson, stream and voice socket on that replica drops, from one request with no sign-in. Fixed with
`tests/r7-audit-platform-serve.test.mjs` (fails before, passes after).

**PLAT-02.** `Cookie: promo=100%` made `parseCookies` throw; the router turns that into 500 on every route that reads the
session. Same commit and test.

**PLAT-03.** The deploy's own PATCH sets traffic to `[{prev, 100, "current"}]`, which drops the `previous` label. When the
smoke fails, traffic stays that way and the new revision is deactivated (`:470-475`). `trafficRoles` (`:116-123`) finds no
`previous` label and falls back to the newest revision that is not current and not `Unhealthy`: the one that just failed.
`rollback()` re-activates an inactive revision and gives it 100%. `release.mjs:140` prints the `--rollback` hint exactly
when the web step failed. Not checked against live Azure: whether a deactivated revision reports `Unhealthy` (if it does,
the fallback picks the release before last instead, which is also wrong).

**PLAT-04.** `sweep.js:23` imports `routes/account.js`; its static imports reach `server/director/engine-check.js:6-14`,
which imports `../../src/modules/frame/engines/*.logic.ts`. `Dockerfile.worker` copies `server`, `shared`, `data`,
`db/migrations` only. The nightly job (`ops.mjs --nightly`, run from the worker image, `deploy-worker.mjs:154`) throws at
line 62 into the outer catch, so line 65, the only caller of `traceRetention`, never runs. The worker itself boots (its
static graph has no `src/` import). The existing image tests check `Dockerfile` and `worker.mjs` only. Kept at P1: the
30/90-day deletion of children's recordings is a promise that is not being kept.

**PLAT-05, PLAT-11.** `verifyCode` reads the count (`:118`), tests the code (`:123`), then writes the attempt (`:126`).
N parallel requests all read "under 5". The limiter in front is PLAT-10. And tries are counted from the newest open
code, while `sendCode` never spends older ones: up to 5 codes an hour are live, each new one zeroing the count.
Severity lowered to P2 by the skeptic (a bound on guessing, not something a parent sees).

**PLAT-06.** Only `server/router.js:236` sets the child-scope mark. The socket upgrade does not go through the router, so
`requireGuardian` (`auth.js:68`) refuses a device-only session. It applies when no relay URL is set (the ticket route goes
through the router and works). The child falls back to the older voice lane without being told.

**PLAT-07.** The scope's comment (`scope.js:7`) leaves out "children" and "onboarding" on purpose, but the child screens
call both and swallow the 403. Adding the routes as they are is not safe: with no parent PIN set, `updateChild`
(`account.js:300-309`) would let the device change name, class, board, language and teacher, and onboarding
(`placement.js:87-90, 107`) accepts `parentView` from the body. The fix is two-sided: scope (platform) plus a
device check in both handlers (learning). I have not changed the scope.

**PLAT-08.** Reset hashes `String(body.password)`; signup and login go through `need()`, which trims. The client sends
the password raw (`src/onboarding/Forgot.tsx:70`).

**PLAT-09.** `device_session` cascades on child delete; its `auth_session` row (180 days) stays. `requireGuardian` refuses
such a session, but three hand-written session joins treat "no device row" as a full parent session. It needs a sibling's
lesson id. The orphan no longer shows in the parent's device list, so it cannot be revoked there.

**PLAT-12.** `GET /api/play/world?childId=abc` (signed in) → Postgres 22P02 → 500. Other unvalidated callers:
`routes/forge.js:53`, `relational/routes.js:102`.

**PLAT-13.** On a device `guardianOrNull` swallows the scope refusal: rows get no guardian or child and the answer says
tier 1, which the client obeys (`bus.ts:128`), undoing the tier it read at boot. Rows whose session id is the page id
match neither erase path (`erase.js:15-18, 31-34`).

**PLAT-14.** `clientRow` keeps any `kind` and forces only `src: "client"`. The ops queries filter `kind = 'srv.res'` with no
`src`. One anonymous batch adds a fake live lesson, a 5xx and a latency sample.

**PLAT-15.** No `play_verb` anywhere under `db/`; README line 52 keeps 027 a gap. The catch at `dress.js:35` hides one
failing query on each of four play routes, and the parent wording switch does not exist.

**PLAT-16.** Corrected by the skeptic: the failure is earlier than first reported. `onReveal` returns early only for
`scene`; for a play offer `createGradeSession("play:…")` throws "unknown archetype" (reproduced), so the status push is
skipped and the throw is swallowed by `seamSafe`.

**PLAT-17.** The file's own comment says the two `alter` lines were added for "a database that ran the first 016".
Files are tracked by name, so such a database never gets them; the per-process probe `columnReady` exists for this. History
is squashed, so which databases are affected cannot be told from the repo. Lowered to P3.

**PLAT-19, PLAT-51.** A web query on an exhausted pool or a stalled connection waits with no limit; the Conductor pool
sets 10 s. `_driver` is assigned after an `await`, so concurrent first callers each build a pool.

**PLAT-20.** Replaying the script's own walk from `server/forge/g2/job-entry.js` finds seven files outside its context
list (`endpoints.js`, `lanes.js`, `trace/model.js`, `cost/prices.js`, `trace/writer.js`, `director/friend.js`,
`learner/kt/ability.js`); it exits 1.

**PLAT-21 to PLAT-23, PLAT-28.** Read from the scripts; none was run. PLAT-21 lowered to P3: production migrations are on
Neon today, so §6 is not in use yet.

**PLAT-24, PLAT-25.** Three gate definitions exist: CLAUDE.md (`test:all`), the deploy stamp (`infra/gate.mjs:23`:
single-process `npm test` plus the prompt-budget check) and CI (shards plus the prompt-budget check). No test runs the
prompt-budget script, so a commit can pass the commit gate and fail CI's build job.

**PLAT-26.** The rule is PUT with `enabled` false unless `TAXILA_WORKER_LIVE=1`, a name that is in no key list. The worker
exists and logs the heartbeat the rule reads. Window: 15 min in `eyes.mjs`, "10 min" in the worker's comment.

**PLAT-27.** Missing names (names only were read): `NEON_API_KEY`, `NEON_PROJECT_ID`, `DATABASE_URL_DIRECT`,
`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `TAXILA_D5_TICKET_KEY`. A `.env.local` written from the list stops the default
release at the backup step, after both images are built.

**PLAT-30.** The client stamps `Date.now() - skewMs` and also sends `skewMs`; the server stores `t - skew`. With a client
clock 300 s ahead the stored time is 300 s behind true time.

**PLAT-31.** `${Date.now()}${++n}` is cut to 12 characters: the counter and the last millisecond digit are lost.
Reproduced: two paths 3 ms apart are identical.

**PLAT-32.** `clientRow` returned `"a\ud83d"` unchanged when run; Postgres jsonb refuses a lone surrogate; the route
answers 500 and the client drops the part.

**PLAT-35, PLAT-36, PLAT-39.** The D5 meter records with no session id and the upgrade path opens no trace store, so the
event lands under `"server"` and the rollup (`where sid = lessonId`) never sees the $0.082/min. The rollup itself fires
once, straight after the lesson-end transaction, while the writer buffers 1 s and the client reports `stt.session` later.
Push-to-talk transcription, the realtime lane and Forge G2 calls have no meter at all.

**PLAT-37, PLAT-48.** No price row → the `taxila-brain` fallback (in 4 vs 0.2 per million). Also unpriced:
`taxila-stagecraft`, `taxila-mistral-m35`, `taxila-gpt61-sol` (I add only the rows whose price the repo states).
`taxila-transcribe` falls to the live-transcribe price.

**PLAT-41.** Every one sampled has a code default, so nothing breaks unset; the risk is that the live values cannot be
rebuilt from the repo. Lowered to P3.

**PLAT-45.** The server mask leaves `parentPhone`, `pinHash`, `otpCode` and phone numbers in strings; neither side masks
the key `code`, so `POST /api/auth/code/verify` and `POST /api/pair/redeem` bodies are stored with the code. Masking the
key `code` everywhere would also wipe every error code in the trace, so this needs a decision, not a one-line change.

**PLAT-55.** README says "Applied so far: 034-040" while 041 and 044-047 exist; 032, 033, 042, 043 are allotted and unused
but not marked as gaps. RELEASE-16 says the capture step "lists the env names" (it prints a count) and that rollback goes
to "the captured previous revision" (the code goes by label; see PLAT-03).

**PLAT-56.** No SQL reader or writer in `server/`, `scripts/`, `evals/`, `tests/`, `src/`, `infra/` for the six. Three more
(`kt_child`, `notify_slot`, `lesson_plan`) have no SQL use but are named in `server/learner/mode.js` and a test, so they
are not on the list. Also written but never read: `format_trial`, `tutor_switch`.

**PLAT-57.** `server/duplex/routes.js`: five routes never registered (one test imports it). `server/routes/modules.js`: an
empty table, still registered. Placement routes are registered at `server/index.js:16,46` and again through
`server/routes/child.js:629`. No caller in client, tests, scripts or evals: `POST /api/forge/requests`,
`POST /api/forge/prefetch`, `GET /api/studio/health`. `verifyPassword` in `server/auth.js` has no importer
(`hashPassword` is used by evals and tests, so it stays).

**PLAT-58.** No importer, package script, workflow, Dockerfile or test for any. No reference at all:
`scripts/offkit-cards.mjs`, `scripts/reveals-unit-sweep.mjs`, `scripts/self-answer-sweep.mjs`. Named only in docs or
context as history: `scripts/handoff/blob.py`, `scripts/handoff/redact.py` (`docs/handoff/STORAGE.md:13`),
`scripts/r4-session-env.mjs` (`context/architecture.md:277`, round-4 docs), `scripts/region/staging.mjs`
(`docs/ops/INDIA-MOVE.md:792` still tells the reader to run it).

**PLAT-59.** No importer: `shared/trace.ts` `TRACE_KINDS`, `TraceKind`, `TraceMe`, `TraceBlobResponse`, `TraceSrc`;
`src/trace/bus.ts` `setTurn`; `src/trace/flag.ts` `flagStats`; `server/azure.js` `DEPLOY.stagecraftSpec`. Tests only:
`server/lanes.js` `twinFor`, `server/endpoints.js` `laneHost` / `laneHosts`. Set and read nowhere: `TAXILA_HOST`,
`TAXILA_REGION`.

**PLAT-60.** The default is `claude/blissful-mayer-icwe2j`. (The first report also said two scripts call a missing
`closeDb`; the calls are optional, nothing throws, so that part was dropped.)

## infra/m3 and scripts/m3.mjs (report only; not changed, not run)

Schedules agree between `infra/m3/plan.js:75-77`, `scripts/m3.mjs:20,30`, the job headers and
`docs/design/round7/M3.md:76-77,105`. One doc slip: `M3.md:57` says the two spares "each hold $1.25 alone"; lines 54-55
and the code say 1.32.

## Checked and fine

- Client calls: every `fetch`, `EventSource`, `sendBeacon` and audio path in `src/**` and `index.html` maps to a registered
  method and path.
- Cross-child reads with a live parent session: none found; every id-taking route resolves to a child and checks the
  guardian (the exceptions are PLAT-09 and PLAT-14).
- Migrations: all 43 files apply in `migrate.mjs` order on an empty Postgres 16 and again a second time; files are tracked
  by name, one transaction each; 540 static SQL statements in `server/**` parse against the result (only PLAT-15 fails);
  every `ON CONFLICT` target has its index.
- `server/relay-ticket.js`, `server/pair/routes.js`, `server/ws.js`, `server/shutdown.js`: no defect found.
- The Vercel shim still matches the router's interface. No code in scope calls a non-Azure AI provider.
- Gates on the branch with the first fix: 609 suites, 6318 pass, 0 fail, 13 skipped.

## Coverage

- **Read fully:** `server/*.js` and `*.mjs` at the top level, `server/signin`, `server/ops`, `server/pair`, `server/trace`,
  `server/cost`, `src/trace/*.ts`, `shared/trace.ts`, `api/`, `.github/workflows/gates.yml`, `package.json`, both
  Dockerfiles, `.dockerignore`, `vercel.json`, `RELEASE-16.md`, `scripts/release*.mjs`, `migrate*.mjs`, `deploy-azure.mjs`,
  `deploy-worker.mjs`, `test-shard*.mjs`, `verify-release.mjs`, `infra/azure.mjs`, `gate.mjs`, `eyes.mjs`, `backups.mjs`,
  `restore-drill.mjs`, `scratch-web.mjs`, `db/migrations/README.md`, `server/routes/account.js`.
- **Executed, not read line by line:** the migration files (applied to a throwaway local database).
- **Sampled** (headers, imports, auth call sites, targeted searches): the other top-level scripts, `scripts/region/**`,
  `scripts/handoff/*.py`, `infra/probes`, `infra/forge-runner`, `infra/m3/**`, `scripts/m3.mjs`, the route files other
  areas own (auth and id handling only), `src/trace/dev/*`.
- **Not read:** `infra/studio-qa/` (not this area), the bodies of `infra/m3/keeper-job.mjs`, `verify-job.mjs`, `vm.js`,
  `scripts/region/db-copy.sh`. No `.env*` file was read; `scripts/handoff/keys.json` holds names only.
- **Not run:** anything under `scripts/` or `infra/` that reaches Azure or a database; no deploy; no model call.

## Phase 2 notes (2026-11-10)

- **PLAT-56 corrected:** `calendar` is read (`server/conductor/view.js:108`, the Conductor's day kinds); migration 050
  drops the other five. The migration test checks every dropped table against server/ and scripts/ SQL.
- **PLAT-04 confirmed by loading:** an image-shaped directory without `src/` fails to load `routes/account.js`
  (ERR_MODULE_NOT_FOUND on `src/modules/frame/engines/geoboard.logic.ts`); the test now loads the sweep from exactly what
  `Dockerfile.worker` copies.
- **PLAT-07:** the router refuses, before the handler, any body field from a device-only session outside
  `server/pair/scope.js DEVICE_FIELDS`; the handlers' own check is patch to-learning/005.
- **PLAT-20** is a proposal, not a fix: the runner's imports now reach 18 files outside its image, including the database
  module and the recorder, which do not belong in the untrusted build container.
- **PLAT-40:** the teacher agent's deployment joins the hot pools only while some lesson can reach the agent lane
  (TAXILA_TEACHER=agent, or a cohort and not off), so the Studio arms on taxila-gpt6 stay uncapped otherwise.
