# RS1 pre-work report (2026-10-05)

## RS-1 pre-work: v3 design system and screens for ages 9-15

The v3 screens are built and they pass every check I ran on them. The numbers come from the v3 components with sample data in a dev gallery, not from the real app, because the data wiring needs Wave 2 to integrate first. Final gates passed: `npx tsc -b` exit 0, `npx vite build` exit 0, and my tests 16/16. Azure spend was USD 0, nothing calls a model, and no existing file was changed.

The harness refused to let me write `docs/design/reset/prework/rs1/REPORT.md` because subagents may not create report files. Its full content is in this summary; the main loop can save it there.

### What was built (all new paths)
**Design system, `src/ui-v3/`**
- **Tokens:** `tokens.ts` is the single source and `tokens.css` mirrors it, scoped to `.v3` so the Wave 2 screens are untouched. Night is the default and Day is the opt-in. Motion tokens are in `motion.ts`, and reduced motion works from both the OS setting and an in-app switch.
- **Fonts:** Bricolage Grotesque (77 KB) and Geist Mono (23 KB) are now self-hosted in `src/ui-v3/fonts/`.
- **Flag:** `flag.ts` holds `ui.v3`, default off (`?uiv3=1`, localStorage `tx.flag.ui.v3`, or `VITE_UI_V3=1`).
- **Primitives:** buttons (only the primary one is lime "volt"), chips, tags, cards, segmented control, stepper, switch, tick/magnifier verdict marks, mastery shapes, and skeletons that never carry a label.
- **Scheduler (`Scheduler.tsx` + `schedule.ts`):** day toggles, a 15-minute time rail, a 14-day date strip, and a time grid that greys out clashes, past times and times outside lesson hours. There is no native date or time picker, everything works by keyboard and screen reader, and the rules never read the device clock, so the server can reuse them.
- **Hands-free readout (`floor.ts`, `TurnIndicator.tsx`):** the duplex engine's floor states map to what the screen shows. There is no talk button; the mic is a state readout plus a mute switch.
- **Stage (`Stage.tsx`):** one slot that letterboxes the artifact, a 62 px rail for the "your move" cue and readouts, swaps that never leave the stage empty, a teacher tile on wide screens and a picture-in-picture on phones (never both mounted).
- **Teacher face (`TeacherFace.tsx`):** screens render a face slot whose default is the existing in-house `<TutorFace>` from `src/avatar`. RS-7 swaps in the style-C puppet with one call, `setFaceRenderer()`. No portraits or raster images appear anywhere in v3, and the lint enforces that.
- **Toasts:** `toast.ts` drops any build, loading or error wording before it can show.
- **Also:** `V3Root.tsx`, `Preview.tsx`, a dev-only `gallery/`, and the shared lint rules in `lint/rules.mjs`.

**Screens, `src/ui-v3/screens/`**
- **Onboarding for classes 4-7:** class and board, name and how she talks, pick a teacher by hearing them, the real scheduler, parent hand-off, then ready.
- **Home:** one next lesson, a teacher note, made-for-you, parked questions, this week, subjects.
- **Lesson shell:**
  - stage with board/game/animation slot, teacher tile or picture-in-picture, transcript, steer chips, hands-free dock;
  - the "Later" pill;
  - diversion cards for park, quick detour, warm decline, and the stop check-in ("3-min break" or "Wrap up in 2");
  - a pause sheet with Childline 1098 and Tele-MANAS 14416;
  - a typed lane.
- **End of lesson:** capability in the child's words, evidence, the parked question, what's next.
- **Progress:** skill mastery by chapter, shape-coded.
- **Parent corner:** Day theme, English or Hindi report, "How do we know?", working reschedule, limits, safety.
- **Stand-ins:** `demo/` has a draggable triangle-proof board, a leaf animation and a real-time canvas game. They exist to prove the stage slot; RS-4 owns the real engines.

**Tests and shots**
- `tests/ui-v3-lint.test.mjs`: 8 tests covering copy, visual, contrast, safety floor and toast rules. Every rule trips on a planted bad sample.
- `src/ui-v3/__tests__/schedule.test.mjs`: 8 tests pinning the scheduling rules.
- `docs/design/reset/prework/rs1/shoot.mjs` produces `measurements.json` and `shots/`: 106 PNGs, 23 MB.

### Measured (2026-10-04, Chromium/Playwright, v3 components with sample data)
| measure | n | result |
|---|---|---|
| Horizontal scroll / off-screen boxes / clipped text / text spilling out of controls | 106 shots at 360×640, 390×844, 820×1180, 1440×900 | 0 / 0 / 0 / 0 |
| Tap targets under 36 px | 106 | 0 (22 on the first run, fixed) |
| Controls with no accessible name | 106 | 0 |
| Screens with more than one lime "volt" element | 104 (kit sheet exempt) | 0 |
| Console errors | 106 | 0 |
| Wording check on visible page text | 106 | 0 |
| Lesson layout: page scroll, artifact outside its slot, text under the teacher picture or label, zones overlapping | 36 lesson shots | all 0; smallest slot is 326×330 px at 360×640 |
| Contrast, 21 text pairs × 2 themes | 42 | all ≥ 5:1 after one fix (below) |
| Owner's failure: set 4:30 PM by tap, onboarding, 390×844 touch | 20 | 20/20 (quick pick 7, steppers 7, rail 6) |
| Same on the parent reschedule | 20 | 20/20; tapping a clash day or out-of-hours time changed nothing, 20/20 |
| Keyboard-only reschedule | 1 | pass (arrow keys skip the clash day and out-of-hours times) |
| Onboarding taps with defaults kept | 1 | 7 (target ≤ 7) |
| Smallest visible text | 106 | 11 px |
| Lint over `src/ui-v3` | 40 files | 0 hits |
| Lint over the rest of `src` (report only, Wave 2 mid-edit) | 345 files | 277 hits, about 0.6 precision on a sample of 26 I judged myself |
| v3 bundle size | 1 build | about 30.0 KB JS gzip and 11.2 KB CSS gzip; not in the shipped build today |

One spec number was wrong: Day-theme amber `#A86200` is only 4.76:1 on white, despite DESIGN-V3 saying every pair is ≥ 5:1. I changed it to `#965700` (5.74 on white).

### Bugs found by looking at the shots and fixed
The metrics alone missed the first one, so I added overlap and spill checks and confirmed each catches its bug when re-injected.
1. The wide lesson side column collapsed the teacher tile to 2 px and put the transcript over the chips.
2. `TutorFace`'s 120 px minimum height cropped the small face slots to the forehead.
3. "TOMORROW" spilled out of the date cells; tomorrow now shows its weekday and is still announced as "Tomorrow".
4. The leaf animation and the game showed a visible seam where their glow met the letterbox.
5. The paused (single-frame) game rendered blank in screenshots.
6. A grid sizing bug let the time rail push the primitives sheet sideways.
7. Decorative art used the lime accent, breaking the one-accent rule.
8. A focus ring showed on onboarding headings when focus moved by code.

### Merge notes
- `src/ui-v3/**`, the tests and `docs/design/reset/prework/rs1/**` collide with no existing file.
- `patches/01-router-ui-v3.patch` adds a lazy `/v3` preview route when the flag is on (404 when off), so the owner can see every v3 screen on staging before the data wiring lands. It applies cleanly to today's tree.
- `patches/02-npm-test-ui-v3.patch` adds the schedule tests to `npm test`. It uses a glob because `node --test src/ui-v3/__tests__/` fails on Node 22.
- `patches/README.md` says where the remaining hookups go: the `ui.v3` flag-table entry (RS-0); the lesson shell hookup to the duplex engine (RS-3); studio artifacts as the stage's children (RS-4); the face renderer swap (RS-7); onboarding and reschedule saves (RS-2); and widening the lint, which needs a visible-text-only mode first.
- `context/inbox/prework-rs1.json` holds 6 decisions with reversal conditions, 6 measurements, 4 rejections and edges using valid graph relations.

### What is left
- **The real app:** the screens are not wired to real data yet, and the layout checks still need rerunning on the real app at 5 viewports × 2 themes.
- **Screens not built:** Notebook/Library, Me, Teacher, Ask and the public site.
- **Old assets:** the age-wrong assets in the rest of `src` have not been retired.
- **Not proven here:** duplex turn-taking itself (RS-3's acceptance) and the puppet face (RS-7's).
- **No people or network yet:** the "for my age" panel and home time-to-Start on 4G have not been run.
- **Contrast:** it is checked on colour pairs only, not sampled from rendered pixels.

### Files created
- `/home/user/Taxila/src/ui-v3/` (39 files, including `fonts/`, `gallery/`, `lint/`, `__tests__/`, `screens/`, `screens/demo/`)
- `/home/user/Taxila/tests/ui-v3-lint.test.mjs`
- `/home/user/Taxila/docs/design/reset/prework/rs1/shoot.mjs`
- `/home/user/Taxila/docs/design/reset/prework/rs1/measurements.json`
- `/home/user/Taxila/docs/design/reset/prework/rs1/shots/` (106 PNG, 23 MB)
- `/home/user/Taxila/docs/design/reset/prework/rs1/patches/01-router-ui-v3.patch`
- `/home/user/Taxila/docs/design/reset/prework/rs1/patches/02-npm-test-ui-v3.patch`
- `/home/user/Taxila/docs/design/reset/prework/rs1/patches/README.md`
- `/home/user/Taxila/context/inbox/prework-rs1.json`

## Review (PASS after fixes. RS-1's numbers are real and the patches apply. The safety floor is untouched. I fixed one crash, three sideways-scroll failures and one real layout bug the stream's own metric could not see.)

I re-ran every RS-1 gate and measurement myself, then tried to break the screens with bad input. All edits are inside RS-1's own new paths, and nothing was committed.

**What checked out**
- **Numbers:** the 106-shot battery gave the same summary as the stream's report, field for field, before I changed anything.
- **Tests:** 16/16 pass (lint 8, schedule 8).
- **Patches:** both apply cleanly to today's tree (`git apply --check`).
- **New paths only:** no file outside RS-1's paths references `ui-v3`. The only change to an existing file is in a patch file.
- **Safety floor:** Childline 1098 and Tele-MANAS 14416 appear digit-exact in the pause sheet and parent corner. "AI teacher" appears on every teacher surface.
- **Teacher face:** comes from the in-house `TutorFace`. Its 2D plate image is rendered from the in-house rig, not a mockup portrait.
- **Not a quiz in costume:** the stand-in game is a real-time steering game on a canvas, and the board lets the child drag the triangle's top point. No babyish copy turned up.

**Problems found and fixed**
1. **Crash:** `Onboarding` with an empty teacher list crashed (`teacher.id` on undefined). It now falls back to an empty teacher.
2. **Sideways scroll at 360 px:** a 24-character unbroken name (the input allows that many) scrolled the onboarding Ready page, home and the parent header sideways. Fixed by letting prose and name slots wrap anywhere (`v3.css`, plus a shrinkable `.v3-kid` in `screens.css`).
   - I first applied the wrap to the whole `.v3` root. That turned control labels that don't fit into silent mid-word breaks, and the "Tomorrow" spill check stopped catching its bug. So I limited the wrap to prose and name slots, and the check catches it again.
3. **Real bug the metric missed:** in the parent reschedule grid, "11:00 AM" overflowed its 59 px cell at 360×640 (68 vs 59 px) and at 390×844. The report said 0 spills because the metric only checked child elements, never a control's own text.
   - `shoot.mjs` now checks the control's own text too.
   - The grid now puts AM/PM under the time when the grid is narrower than 310 px (`Scheduler.tsx` + `v3.css`).
4. **Smaller fixes:**
   - The triangle drag could stick if the touch was cancelled; it now ends cleanly.
   - In the stand-in game, holding a finger still made the ship drift past it to the edge; it now stops at the finger.
   - The welcome line "She builds the lesson around you" became "She shapes…", because the owner's reset says the child never knows things are being built.

**Measured after the fixes (2026-10-05, Chromium/Playwright, gallery sample data)**

| check | n | result |
|---|---|---|
| sideways scroll / text spill / off-screen / clipped / tap targets under 36 px / no accessible name / more than one lime "volt" / console errors / wording check | 106 shots | all 0 |
| lesson layout checks | 36 lesson shots | all 0; smallest slot 326×330 px |
| set 4:30 PM by tap, onboarding | 20 | 20/20 |
| set 4:30 PM by tap, parent reschedule | 20 | 20/20 |
| keyboard-only reschedule | 1 | pass |
| onboarding taps with defaults kept | 1 | 7 |
| bad-input cases (15 cases × 360 and 1440) | 30 | 1 crash and 3 sideways-scroll pages before the fixes; 0 and 0 after |
| re-injected bugs: overlap, small tap target, spill | 3 | all caught |

Final gates: `npx tsc -b` exit 0 and `npx vite build` exit 0, with Wave 2 still editing other files. Azure spend USD 0. The shots were rewritten (106 PNGs, 23 MB). I added 1 measurement and 2 rejections, with edges, to `context/inbox/prework-rs1.json`. The temporary bad-input page I used for testing was deleted.

**Files I changed** (all RS-1 paths, under `/home/user/Taxila`):
- `src/ui-v3/v3.css`
- `src/ui-v3/screens/screens.css`
- `src/ui-v3/Scheduler.tsx`
- `src/ui-v3/screens/Onboarding.tsx`
- `src/ui-v3/screens/demo/TriangleBoard.tsx`
- `src/ui-v3/screens/demo/PilotGame.tsx`
- `docs/design/reset/prework/rs1/shoot.mjs`
- `docs/design/reset/prework/rs1/measurements.json`
- `docs/design/reset/prework/rs1/shots/`
- `context/inbox/prework-rs1.json`

**Remaining risks**
- **Owner judgement needed on the face:** the in-house 2D plate looks cartoonish in the small slots. That belongs to RS-7, but the owner should judge it against "not babyish".
- **Long readout labels:** a very long label in the lesson's bottom bar is clipped with no ellipsis.
- **Lesson hours:** the parent copy says "Times above follow it", but shortening lesson hours does not re-check lessons already booked.
- **Flag:** if storage is blocked, `?uiv3=1` does nothing. The flag is read once when the routes load, so switching it during in-app navigation has no effect.
- **The `/v3` preview:** once patch 01 lands, it shows sample data, including a parent corner with no PIN, to anyone on a device with the flag on.
- **Gallery only:** everything here is measured on sample data. The real-app re-run, the duplex engine and the puppet face are still unproven.
- **Missing report:** `REPORT.md` still does not exist; the main loop needs to save it from RS-1's summary.
