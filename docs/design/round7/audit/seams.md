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
| SEAM-03 | P2 | inconsistent | studio (forge) + voice + learning | Six private class-to-band tables beside `shared/bands.ts`. Forge's puts class 7 in B4 (the table: B3); speech-to-text and spoken-number reading put class 4 in "6-9" (the table: "10-15") when no lesson is open | `server/forge/strings.js:130` (live via `server/forge/planner.js:34`, `server/routes/lesson.js:457`); `server/voice/stt.js:46`; `server/voice/spoken.js:580`; `server/conductor/config.js:10`; `server/comprehension/params.js:38`; `server/forge/g2/brief.js:11`; canonical `shared/learner.ts:20-24` | each file imports `band4Of` / `contractBandOf` from `shared/bands.ts` (or `server/learner/bands.js`) | open |
| SEAM-04 | P3 | no longer needed | main | The signals layer (about 1,000 lines, server and client) was built on 2026-10-04 and never wired; `TAXILA_SIGNALS` can never flip anything | `server/signals/{index,backstop,priors,quality,session,states}.js`; `src/signals/*.ts`; `context/decisions.md:3241-3243` | owner's call: wire it per SIGNALS-SPEC §8.2 or retire it (keep `server/signals/text.js` and `linguistic.js`, which are live) | open |
| SEAM-05 | P3 | inconsistent | brain + voice | The contract says the server "marks the unsaid tail" from `heardUpTo`; the client never sends it and no live server code reads it | `shared/contracts.ts:294-299,310`; PIPELINE A11 / Voice 8 | write "not built yet (PIPELINE Brain 11, Voice 8)" on both fields until they are | open |
| SEAM-07 | P3 | no longer needed | brain (server/ui) + platform + app | The Kaksha cohort switch still runs end to end and decides nothing: the server hashes the guardian's email on every `/api/me` and child boot to answer `ui.kaksha`, the release carries `TAXILA_UI_KAKSHA` over, and the client ignores the answer | `server/ui/kaksha-cohort.js:1-29`; `server/routes/account.js:240`; `server/routes/child.js:185-187`; `scripts/release-core.mjs:100-102`; `src/ui-v3/kaksha/flag.ts:26-29,71-82` | drop `uiFlagsFor`, the `ui` field and the env name, or rewrite the server comment to say the switch is inert (APP-49 covers the client comments) | open |
| SEAM-08 | P3 | inconsistent | voice | The voice-signal mode has two readers with two defaults, and the client's type lacks the mode the server sends by default | `server/voicesig/lesson.js:49-52` (default `internal`); `server/voicesig/adapter.js:42-45` (`vsMode`, default `off`, no caller); `src/voicesig/flag.ts:15,63` (`internal` read as `shadow`) | delete `vsMode`; add `internal` to `VoicesigConfig.mode` | open |
| SEAM-09 | P1 | inconsistent | learning + app + voice | Four parent controls save and do nothing: "Extra time to answer", "Data saver", "Words on screen" and "Larger text and a calmer screen". Each shows the parent a sentence promising what the child will get | `src/parent/Controls.tsx:370-379,409-417`; stored `server/routes/parent.js:559-584`; read back only by `server/routes/child.js:122,129` (into an object nothing reads); the child's lesson uses device prefs (`src/child/lesson/LessonScreen.tsx:85`, `src/child/ChildShell.tsx:123`) | hide the four until a reader exists (decision dc-r7 D5: "a control that does nothing is hidden"); then send them in the child plan and let the device prefs default from them | open |
| SEAM-10 | P3 | not good enough | app | With limits on, a resting child reads the opening time as a 24-hour code: "Lessons 17:00 baje phir khulenge", "Lessons open again at 06:30" | `server/routes/child.js:282` (`opensAt` = `hours_start`, "HH:MM"); `src/ui-v3/kaksha/views.tsx:84`; `src/ui-v3/kaksha/copy.ts:26`; the dev page passes "5:00 pm" (`kaksha/dev/main.tsx:52`) | format on the client in the child's language ("5 pm", "shaam 5 baje", "शाम 5 बजे") | open |
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

**SEAM-03, the speech copies.** `stt.js:43-46` and `spoken.js:580` use the lesson's `ctx.ageBand` when a lesson is
open (that one comes from `server/learner/model.js:104`, the shared table) and fall back to `class_level <= 4 ? "6-9"`
otherwise. The fallback runs for the Ask screen's transcription (`/api/voice/transcribe` before a lesson exists), so a
class 4 child is described to the speech model as "a young child aged 6 to 9" on Ask and as 10-15 in the lesson.

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

**SEAM-07.** `kakshaDecision` (`flag.ts:26-29`) returns `i.device !== false`: the server answer, the build default
(`VITE_UI_KAKSHA`) and dev/prod are inputs it no longer reads (release 11 made Kaksha the app for everyone). The server
file still says "In production builds Kaksha is ON exactly when the server said true … Unset or empty: nobody (the
default)", the opposite of what the client does, and `envDropped` in the release names `TAXILA_UI_KAKSHA` as a cohort
switch whose loss "silently turns a feature off". Nothing turns off.

**SEAM-08.** `config()` (`lesson.js:315-321`) answers `mode: "internal"` unless `TAXILA_VOICESIG` says otherwise; the
client's `voicesigConfig` maps anything but `off`/`on` to `shadow` and its type has no `internal`. Nothing on the client
branches on `shadow` against `on` today, so no child sees it; the risk is the next client check written against the
type. `vsMode` reads the same env name with default `off` and has no caller (voice's V-21 covers the comments).

**SEAM-09.** `grep -rn "extraTime\|dataSaver\|extra_time\|data_saver"` over `server/brain`, `server/director`,
`server/routes/lesson.js`, `server/voice`, `server/duplex`, `src/child`, `src/lesson`, `src/duplex`, `src/ui-v3` finds
nothing; `server/routes/child.js:129` copies them into the controls it builds for the home state, which reads only the
hours, cap and limits. `captions_always` and `comfort_mode` are read nowhere outside `server/routes/parent.js`. The child
app's captions come from `prefs.captionsAlways` (the child's own Me screen) and its larger text from `prefs.largeText`.
So the parent of a child who is hard of hearing picks "Words on screen: always" (set-up also writes it from the
"hard to hear" answer, `src/onboarding/Setup.tsx:80`), reads "{name} always sees what {T} says, as words", and the
child's device never learns of it. The learner report notes the set-up draft fields; this is the saved control.

**SEAM-10.** `homeStateOf` returns `resting` only when the family's limits are on and the time is outside the hours
(`child.js:105`); the default (limits off) never rests, so few children see it today. The copy rows put `{time}` straight
in: `"Lessons open again at {time}"`, `"Lessons {time} baje phir khulenge"`.

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
