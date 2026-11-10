# Seams audit (area 12), 2026-11-10

Audit only: no product code changed. Scope is what falls between the areas: `shared/contracts.ts` against both sides,
the route table against client calls, environment variables and flags, the import graph, and jobs done twice in two
places. Findings already in the seven area reports (app, content-data, docs-memory, face, learner, platform, voice) are
not repeated; where one of mine touches theirs, the note says so.

The sweeps are scripts, so they can be re-run: `docs/design/round7/audit/seams-scripts/` (see "How to re-run" at the end).

## Findings

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| SEAM-01 | P1 | broken | games | A child who says "solah", "chaudah", "बीस" or any number above 13 (except 15 and 20) in a game is not heard as a number | `src/play/core/voice.ts:24-29,83,91` | read number words with `spokenNumber` from `server/grading/spoken-number.js` (pure, already the one reader the lesson uses) when `NUM` has no entry | open |
| SEAM-02 | P2 | inconsistent | brain + voice | Reading fluency is built on both ends and fed by nothing: the client waits for `ui.readAloud`, no server code ever sends it, so WCPM is never measured and `GET /api/voice/trends` has no caller | `shared/contracts.ts:96-97`; `src/lesson/runtime.ts:583,594-597,910`; `src/voice/features.ts:205`; `server/voice/features.js:3,348,369-370` | Director sets `ui.readAloud` on a read-aloud item (English reading items have the passage), or mark the field "not built" and drop the reader | open |
| SEAM-03 | P2 | inconsistent | studio (forge) | Forge's band table puts class 7 in B4; every other table and `shared/bands.ts` put it in B3. Two more private copies sit in the Conductor and comprehension | `server/forge/strings.js:130` (used `server/forge/planner.js:34`, live through `server/routes/lesson.js:457`); `server/conductor/config.js:10`; `server/comprehension/params.js:38`; canonical `shared/learner.ts:20-24` | each file imports `band4Of` from `shared/bands.ts` (or `server/learner/bands.js`) | open |
| SEAM-04 | P3 | no longer needed | main | The signals layer (about 1,000 lines, server and client) was built on 2026-10-04 and never wired; `TAXILA_SIGNALS` can never flip anything | `server/signals/{index,backstop,priors,quality,session,states}.js`; `src/signals/*.ts`; `context/decisions.md:3241-3243` | owner's call: wire it per SIGNALS-SPEC §8.2 or retire it (keep `server/signals/text.js` and `linguistic.js`, which are live) | open |
| SEAM-05 | P3 | inconsistent | brain + voice | The contract says the server "marks the unsaid tail" from `heardUpTo`; the client never sends it and no live server code reads it | `shared/contracts.ts:294-299,310`; PIPELINE A11 / Voice 8 | write "not built yet (PIPELINE Brain 11, Voice 8)" on both fields until they are | open |
| SEAM-06 | P3 | no longer needed | games + studio | Four routes with no screen: the child's game world, the child's own builds, the play gate, and hiding a "Made for you" card | `server/play/routes.js:156,168,179`; `server/routes/studio.js:207-213,229` | build the screen or delete the route (platform's PLAT-57 lists `play/world` only) | open |

## Evidence

**SEAM-01.** `parseVoice` (the game's own voice grammar, used by `PlayStage`, `PlayStudioRenderer` and both 3D engines)
has a private `NUM` table: Latin words for 0-13, 15 and 20, Devanagari words for 1-10. Any other number word is "a word
outside the grammar" (`voice.ts:91`) and the utterance is not a game command. Run (Node 22, type stripping):
`parseVoice("solah")` → `null`, `parseVoice("सोलह")` → `null`, `parseVoice("ग्यारह")` → `null`, `parseVoice("bees")` →
`{verb:"number",n:20}`, `parseVoice("16")` → `{verb:"number",n:16}`. The lesson's reader on the same words:
`spokenNumber("solah")` → 16, `spokenNumber("सोलह")` → 16, `spokenNumber("ग्यारह")` → 11, `spokenNumber("pachchees")` → 25.
The Hindi speech recogniser writes number words in Devanagari, so a Hindi-medium child answering "सोलह" to a times-table
game gets nothing back from the game. `spoken-number.js` says it exists because five graders each had their own reader
and each was wrong; this is a sixth.

**SEAM-02.** `grep -rn readAloud server` is empty. The contract field (`contracts.ts:96-97`) says "voice features
measure WCPM against it"; `runtime.ts:910` passes `ui.readAloud ?? null` on every turn, so the target is always null
and `features.ts` never computes `wcpm` (`server/voice/features.js:369-370` reads rows `context = 'read_aloud'`, which
are never written). `GET /api/voice/trends` (weekly speech rate, onset latency, WCPM) is called only by
`tests/voice-features-server.test.mjs`. Nothing is broken for the child; a parent-facing reading measure is half
built at both ends with nothing between them.

**SEAM-03.** `bandOf` in `server/forge/strings.js:130` is `<=2 B1, <=4 B2, <=6 B3, else B4`; its own comment says the
mapping is "[I] until the design workstream fixes it". `shared/bands.ts:1-6` says every band read must come from that
table "so a second band table can never appear". The forge planner (`planner.js:34`) passes `band` into every fill it
plans at lesson start (`lesson.js:457`), so a class 7 child's forge fills are planned as class 8-9. The Conductor and
comprehension copies agree with the table today but are free to drift. Face's FACE-08 covers `shared/tutors.js` against
`src/child/band.ts`; this finding is the server copies.

**SEAM-04.** The decision entry says "Nothing is wired into a W2-E/W2-I file; the integration steps are in the spec
§8.2". Five weeks on, `server/signals/index.js` (`step`, `signalsMode`) is imported only by
`tests/signals-server.test.mjs` and `evals/signals/run.mjs`; `src/signals/index.ts` only by `tests/signals-client.test.mjs`
and `evals/signals/es2-run.mjs` (`seams-scripts/imports.mjs`). `TAXILA_SIGNALS` and `TAXILA_SIGNALS_OFF` are read only
inside `signalsMode`, which nothing live calls. The voice-signal adapter (`server/voicesig/**`) took over the job the
layer was meant for.

**SEAM-05.** `contracts.ts:294-299`: "how much of her LAST line the child heard … The server marks the unsaid tail and
gives the move an 'interrupted after X' fact". `grep heardUpTo server/brain server/director server/routes` is empty
(only the dead `server/duplex/{bargein,floorManager,slice,routes}.js` mention it); in `src/`, `heardUpTo` lives inside
the duplex engine and is never put on a turn body. PIPELINE lists both halves as round-7 work not yet done (Brain item
11, Voice item 8). The risk is a reader of the contract assuming the teacher already knows where she was cut off.

**SEAM-06.** `seams-scripts/routes.mjs` lists every registered route that no file under `src/` or `public/` names.
Beyond PLAT-57's list: `GET /api/play/builds` (the child's own game builds; only `tests/prod/r4-khand-loop.mjs`),
`GET /api/play/admit` (only `tests/prod/*`), `POST /api/studio/made-for/hide` (no caller at all; the shelf on Home, the
Debrief and the Notebook has no hide control). `GET /api/studio/timing`, `/api/ops`, `/api/ops/summary`,
`/api/test/*` and `/api/voicesig/status` are operator or test routes and are fine without a client.

## Coverage

(filled in at the end)

## How to re-run

All scripts read the working tree; none touches the network or a database.

- `DATABASE_URL= node docs/design/round7/audit/seams-scripts/routes.mjs` — the route table (from `server/index.js` and
  `server/router.js`), key collisions, routes no client names, client paths with no route. Needs `npm ci` (route modules
  import `zod`).
- `DATABASE_URL= node docs/design/round7/audit/seams-scripts/route-methods.mjs` — client calls whose method differs from
  the registered one (heuristic; both hits today are false: the method is set on a later line).
- `node docs/design/round7/audit/seams-scripts/env.mjs [--only-unset]` — every environment name read, its default as
  written, where it is set (Dockerfiles, infra, deploy and release scripts, CI, `keys.json`), and test use.
- `node docs/design/round7/audit/seams-scripts/imports.mjs` — files no product entry reaches, and who imports them.
- `node docs/design/round7/audit/seams-scripts/contracts.mjs [Type …]` — per contract field: does the server write it,
  does the client read it.
- `node docs/design/round7/audit/seams-scripts/number-words.mjs` — the Hindi number-word tables and what each lacks.
