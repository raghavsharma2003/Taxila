# Release 16: shipping int/r6 to taxila-web

Stream G (platform), 2026-11-09. This is a checklist for main, who runs it. Every step goes through
`scripts/release.mjs`, which records its progress, resumes after a failure and keeps the rollback target. Nothing on
this page has been run against production.

`<sha>` below is the int/r6 commit being shipped, as the full 40-character sha. The plan for `0dd31feb` (integration 16) is
printed in §1. Re-print it on the actual release commit.

## 0. Before the release

- **The owner's keys.** The Azure service principal (`AZURE_*` in `.env.local`) must be present for every step after `--plan`. A
  production migration also needs `NEON_API_KEY` and `NEON_PROJECT_ID`, because the backup branch is taken first.
- **The freeze.** Release outside 18:00-21:30 IST, the peak lessons. The `freeze` step refuses inside that window unless `--force` is given.
- **CI is green on `<sha>`.** The `evidence` step checks this: the build and every shard on that sha, or a clean local gate stamp.
- **Which database production is on: Neon.** The India cutover to Azure PG (`taxila-cin-pg` / `taxila-sin`) has not
  happened; it is still waiting for the owner's yes (OWNER.md item 5).
  - Production migrations therefore go over **Neon HTTP with a backup branch**, which is `--migrate neon`, the default.
  - `--migrate job` runs `scripts/region/db-copy.mjs --apply-migrations` inside the Azure VNet and is for Azure PG only.
    Use it only after the cutover. Against today's setup it would migrate the wrong database.
  - The checklist below uses `neon`, and §6 has the `--job` form for after a cutover.

## 1. The plan (no Azure, no database)

```
node scripts/release.mjs <sha> --plan
```

On `0dd31feb` it prints nine steps:

1. evidence
2. freeze
3. capture: the live web revision and its env names, and the worker image
4. images: `taxila-web:0dd31fe` and `taxila-worker:0dd31fe`, built from GitHub at that commit
5. migrate: `node scripts/migrate.mjs --prod --sha <sha> --backup pre-release-0dd31fe`
6. web: `node scripts/deploy-azure.mjs --image-tag 0dd31fe` (a canary revision, a smoke test, then 100%)
7. cohort: the new revision carries every env name the old one did
8. worker: `node scripts/deploy-worker.mjs --image-tag 0dd31fe --jobs`
9. record

## 2. Migrations: dry run first

```
node scripts/migrate.mjs --prod --sha <sha> --dry-run        # reads production's schema_migrations; writes nothing
```

**What to expect.** One of these, depending on what production already has:
- `pending 041_child_device_pairing.sql (3 statements)` alone, if 044-047 are already there;
- 041 together with whichever of 044-047 are missing, in name order.

**Stop if the list has anything else.** That includes anything below 034, or 042-043, which are unused numbers. Find out why first.

**Why 041 still applies after 044-047.** The runner (`scripts/migrate-core.mjs`) applies the **set difference**: the files at
`<sha>` that are not in `schema_migrations`, in name order. It does not apply only "files above the highest one applied". So
041 applies after 044-047. This is tested in `tests/migrate-tooling.test.mjs` and was seen on a branch database.

**What each file does.** Each runs in one transaction together with its `schema_migrations` row. None loses data:

| file | what it does |
|---|---|
| 041_child_device_pairing | `create table if not exists device_session` (FK to auth_session and child, on delete cascade) and `pair_code`. |
| 044_parent_report_monthly | Re-creates the `parent_report.cadence` check with `'monthly'` added. It only widens the check. |
| 045_child_schedule | Additive columns. |
| 046_child_map_marks | `child_map_mark` and `child_equip`. |
| 047_onboarding_answers | Additive. |

**Then the release itself:**

```
node scripts/release.mjs <sha>                  # migrate = --migrate neon (the default): a Neon backup branch pre-release-<sha7> first
```

**The order matters.** The new web code needs 041. Its parent-session check reads `device_session`, so without 041 every
signed-in request fails with 42P01. `release.mjs` runs `migrate` before `web` for this reason. If you deploy by hand,
`deploy-azure.mjs`'s migrations gate refuses an image whose sha has a migration the target lacks. Never skip it.

## 3. Env vars on the web revision

The new routes since the last release, and what they read:

| route(s) | env | status |
|---|---|---|
| `/api/pair/*` (child device pairing) | none of its own. `NODE_ENV=production` (set by `deploy-azure.mjs` and the Dockerfile) adds `Secure` to `tx_child` / `tx_paired`. | nothing to add |
| `POST /api/auth/code`, `/api/auth/code/verify` (App, guardian sign-in by an emailed code) | `ACS_CONNECTION_STRING`, `ACS_SENDER` (the ones forgot-password already uses) | check they're on the live web. Without them the route answers 503 `email.unavailable`. |
| the operator acceptance path of `/api/auth/code` (a `@taxila.test` account gets its code in the response) | `TAXILA_OPS_KEY` (also `/api/test/boom` and the health key fallback) | needed for §4's email check, which is otherwise MANUAL |
| `/ops` (the owner ops page) | `TAXILA_OPS_FOR` | optional: unset means the page is hidden (404) |

- **Nothing new is required.** No other new route reads a new env var: placement onboarding, the map marks and the Hangar equip
  read none. The release needs no `--set`.
- **The cohort check.** The `cohort` step compares the new revision's env names with the captured old ones and fails on any name
  that went missing. This protects the cohort switches, e.g. `DUPLEX_LIVE_FOR`, `TRACE_FULL_FOR`. `TAXILA_UI_KAKSHA` is retired: the release removes it
  itself (`scripts/release-core.mjs` RETIRED_ENV; the client ignores it). If a name is
  meant to go, pass `--allow-drop NAME`.
- **Check ACS before the release, without printing values.** The capture step prints only how many env names the live
  revision has, never the names or their values. Before the release, confirm `ACS_CONNECTION_STRING`, `ACS_SENDER` and
  `TAXILA_OPS_KEY` are among taxila-web's environment variables in the Azure portal (Container App → Containers).

## 4. After the deploy: App's live checks

```
TAXILA_OPS_KEY=<from the secret store> node scripts/live-checks.mjs https://taxila.dev
```

It makes one fresh `@taxila.test` guardian with two children, Riya and Kabir, and deletes the family in a `finally`. It
never touches a real family. Expected results:

| check | PASS means |
|---|---|
| pairing | Code to `/pair?code=` on an empty browser. The device sees only Riya: no guardian email and no "Kabir" in any `/api` body. A parent route answers 403 `scope.child_device`. After unpair, the device's next request is 401 and the app lands on `/pair?unpaired=1`. |
| placement | Onboarding answers produce a placement note, and the parent corner shows "Where Riya begins". |
| email | `/api/auth/code` with the ops key returns a `testCode`, and verify on a fresh client signs in as that guardian. The real inbox stays MANUAL. |
| timing | The question card's page switch lands within ±300 ms of the board's own page turn. This is best effort: no paged turn within `LIVE_TIMING_S` gives MANUAL. |

- **Exit codes.** Any FAIL exits 1; MANUAL rows are expected for the inbox and possibly for timing.
- **Run one check alone:** `--only pairing`. Run the pairing check first, because it covers the two device-scope fixes this release
  ships: the boot `me` cut to one child, and the sibling lesson refused.
- **Then the smoke tests already in the deploy.** `deploy-azure.mjs` smoke-tests the canary before it takes 100%.

## 5. Rollback

```
node scripts/release.mjs <sha> --rollback --plan     # print it
node scripts/release.mjs <sha> --rollback            # web traffic to the revision `capture` recorded (deploy-azure
                                                     # --rollback --to <it>), then the worker + jobs back to the captured
                                                     # image (--served: no fresh gate stamp asked), together
```

- **When.** Roll back on a live-check FAIL that is this release's, or on a smoke failure that `deploy-azure` did not already undo
  (it undoes canary failures itself).
- **The database stays as it is.** Migrations are not rolled back, and need not be: 041-047 only add tables and columns or
  widen a check, so the previous image runs on the new schema. The old code never reads `device_session` or `pair_code`.
- **After a rollback, devices are unpaired in effect.** Any device paired during the window keeps a `tx_child` cookie, but the old
  code ignores it. Those children use the parent's sign-in again, as before. When the release ships again, those devices work
  again with no re-pairing.
- **If the backup branch is needed** (a migration did something unexpected, which none of these should), it is
  `pre-release-<sha7>` on the production Neon project. Restoring it is an owner decision, because it loses every write since.
- **The rollback target is recorded at `capture`** in `node_modules/.cache/release/<sha>.json`. Without that state, for example on a
  different machine, roll the web back with `node scripts/deploy-azure.mjs --rollback --to <revision>` (without `--to` it goes to
  the revision labelled `previous`, and refuses when none is: after a failed deploy there is none) and the worker with
  `node scripts/deploy-worker.mjs --image-tag <previous tag> --jobs --served`.

## 6. After the India cutover only: migrations in the VNet

```
node scripts/migrate.mjs --prod --job --no-backup --sha <sha> --dry-run
node scripts/release.mjs <sha> --migrate job
```

This needs the `taxila-sin-dbcopy` ACA job and the target database inside the VNet. It applies the same set difference
(`scripts/region/db-copy.mjs --apply-migrations`, ls-tree at `<sha>`, name order). The job's report
(`node_modules/.cache/india-move/db-copy-apply-latest.json`) is the migrations evidence the release passes to both the web
and the worker deploy (`--migrations-evidence`), since neither can reach the in-VNet database. `--no-backup` says on the
record that Azure PG's point-in-time restore is the backup. The web and worker steps carry `--force`: the release's own
freeze step is the one evening-freeze check.

## 7. Afterwards

- **The record step** writes a `context/inbox` entry for the release. It names the sha, the web and worker revisions, and the
  migrations applied.
- **The shared TEST branch still lacks 041.** It is parked; see main's note of 2026-11-08. Until it is applied there, the two DB
  suites that sign in fail against it with 42P01. Production is unaffected.
- **Known limit carried forward.** On a paired device, the duplex and face config read the owner-cohort override only from
  `tx_session`, so a paired device gets the default lane and face. See `dc-r7-device-cohort-override-later`.
