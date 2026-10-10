# games-core (G1) patch requests

Each line: the patch file, the file it touches and its owner, why, and the test that proves it. Applied on
`claude/r4-games-core` only as separate `[patch-request] ...` commits; the main session drops and re-applies them at merge.

| # | patch | touches (owner) | why | proved by |
|---|---|---|---|---|
| 01 | `01-teacher-speaking-event.diff` | `src/lesson/runtime.ts` (stream 3) | O-G2: the play music bed must hard-duck to 0 within ~120 ms whenever she speaks. Play hears her only through a window event; the runtime emits `taxila:teacher-speaking` `{ on }` on each flip of `teacherSpeaking` (one place: `dispatch`). Without it, play still ducks under its own captions, but not under her lesson TTS. | `tests/r4-games-core-patch01.test.mjs` (LessonRuntime emits on/off on `teacher_audio_start/_end`, never twice for one state); the harness `checks` mode measures the bed's gain at 120 ms after the event |
| 02 | `02-parent-play-verb.diff` | `db/migrations/0NN_play_verb.sql` (main assigns the number), `server/routes/parent.js` (main) | O-G4: the parent's switch from "daago / fire" to "scan" wording. Adds `child_controls.play_verb` ('fire' default, 'scan') and `playVerb` in GET/POST `/api/parent/controls` (503 until the column exists, like `text_only`). Play already reads it (`server/play/dress.js withVerb`, a missing column = the operator default `TAXILA_PLAY_VERB`). The parent UI row (two options, "Daago" / "Scan") belongs to the owner of `src/parent/Controls.tsx` (stream 5 this round). | `tests/r4-games-core-server.test.mjs` (verbFor / withVerb); after the migration: POST controls `{ playVerb: "scan" }` → the next `/api/play/level` dress has `verb: "scan"` and the commit button reads "Scan karo" (harness `checks`) |
