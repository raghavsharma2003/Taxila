# RS-1 prework patches: where each one applies after Wave 2 integrates

RS-1 pre-work touched no existing file. Everything that must reach an existing or Wave-2 file is here. Apply these
after the Day-0 seam commit (RESET-PLAN §3.1), in this order. Each patch was checked with `git apply --check` against the
tree as it stood on 2026-10-04 (before Wave 2 integrated), so rebase the hunks if they no longer apply.

| # | file | owner after landing | what it does | flag |
|---|---|---|---|---|
| 01 | `src/app/routes.tsx` | RS-1 (router reviewed by RS-0) | Adds the lazy route `/v3`. It renders `src/ui-v3/Preview.tsx` (every v3 screen with fixtures) when `ui.v3` is on, and a 404 when it is off. `?uiv3=1` on any URL turns the flag on for that device. The owner and the EXP browser lane can then see v3 on staging before the data wiring. | `ui.v3` (off by default) |
| 02 | `package.json` | RS-0 | Adds `src/ui-v3/__tests__/*.test.mjs` to `npm test`. Use the glob: `node --test src/ui-v3/__tests__/` fails on Node 22 with "Cannot find module" (measured), even though `tests/` works. `tests/ui-v3-lint.test.mjs` is already under `tests/`, so it runs today. | — |

## Not diffs: the seams this pre-work needs from other streams

These target files are still being edited by Wave 2. A diff written today would be stale by integration day, so each
item says where the change goes instead.

1. **Flag table (RS-0 seam commit, RESET-PLAN §3.1 step 5).** Add `ui.v3`:
   - device key `tx.flag.ui.v3`;
   - URL switch `?uiv3=1|0|default`;
   - build default `VITE_UI_V3=1`;
   - default off.

   `src/ui-v3/flag.ts` already implements this.
2. **Screen data shapes.** `src/ui-v3/screens/types.ts` holds `HomeData`, `LessonData`, `EndData`, `ProgressData`,
   `ParentData`, `LaterItem` and `Moment`. RS-0 may hoist them into `shared/contracts.ts` at the seam commit.
   - `LaterItem` must match RS-5's `LaterItem`.
   - `Moment.kind` (`park | brief | decline | stop`) must match RS-5's diversion routing.
3. **RS-3 (lesson):** mount `LessonShell` from `src/ui-v3/screens` behind `ui.v3`.
   - Feed `data.floor` from the governor's `FloorPhase` (`src/duplex/engine.ts`). Pass `"yielding"` for the hand-over fade.
   - Pass `watching` while a game runs.
   - Feed `level` from the mic meter.
   - `onSteer(intent)` sends the same intent as the spoken phrase.
   - `onTyped` is the typed lane.
   - `onEndRequest` goes into RS-5's stop check-in. The shell never ends a lesson itself.
   - `onMoment("stop", "break" | "wrap")` maps to RS-5's stop protocol.
4. **RS-4 (studio):** render the gate-passed artifact as `LessonShell`'s children.
   - Put the artifact kind in `data.artifact`.
   - Changing `data.artifact.key` triggers the continuity cross-fade. The outgoing piece is held until the new one paints.
   - The reference artifacts in `src/ui-v3/screens/demo/` are stand-ins that prove the slot contract. They are not product engines.
5. **RS-7 (face):** call `setFaceRenderer()` from `src/ui-v3/TeacherFace.tsx` at boot when the style-C puppet passes
   ≥ 4.5/5.
   - Until then the slot renders `src/avatar`'s `<TutorFace>`: a 3D head, else the 2D plate of the same look.
   - The PiP and chips zoom the plate with `--face-zoom: 1.5`. Set `--face-zoom: 1` once the renderer honours
     `framing="close"`.
6. **RS-2 (onboarding, parent):**
   - `Onboarding.onDone(result)` returns `{ classLevel, board, name, lang, teacherId, schedule{days,start,length}, parent }`.
     Persist `lang` end to end (O-14).
   - `ParentCorner` takes `lessons`, `limits`, `today` and `nowMin` from the server; it never reads the device clock.
   - Wire the reschedule save to the schedule API and add `daysOff` from `schedule_exceptions` to `dateStrip`.
   - All clash, past and lesson-hours rules live in `src/ui-v3/schedule.ts`. They are pure, so the server can
     re-validate with the same code.
7. **Lint widening (RESET-PLAN RS-1 step 3).** The gate runs on `src/ui-v3/**` today. Run
   `UI_LINT_ROOTS=src node --test tests/ui-v3-lint.test.mjs` to see the rest of the tree.
   - Measured on 2026-10-04: 277 hits in 345 files. A sample of 26 hits judged about 0.6 precision.
   - Before the gate widens, its L-MACHINE and L-RASTER rules need a visible-text-only mode, because console strings
     and non-teacher rasters are false positives outside v3. The rendered-text lint in `shoot.mjs` (`lintRendered`) is
     that mode for real pages.
