# Asha round 4: integration (prepared, NOT applied)

Prepared 2026-10-10 by the Asha round-4 agent. Nothing here has been applied to the repo. The patches were cut with
`git diff --no-index --binary` from scratch copies of `src/ server/ shared/ tests/ public/face-puppet evals/face-puppet`
taken from the working tree; at 09:2x UTC those directories were byte-identical to HEAD `4bc655d`. Re-checked against
HEAD `36dade7` at ~09:45 UTC: every patch still passes `git apply --check` (each on its own against the current tree).

## Read this first: what to apply

| patch | what | apply now? |
|---|---|---|
| `05-one-teacher.patch` + `05b-one-teacher-puppetface.patch` | ONE teacher: Asha for classes 1-9; Arjun, the draft Uma and every teacher-choice step removed | **yes** (owner directive; independent of the puppet look) |
| `06-bilabials-from-text.patch` | lips seal on b / m / p words when Azure's viseme track leaves the seal out | **yes** (helps every look, r8 included) |
| `01-look-switch.patch` | `face.look` switch (`?look=r8\|lamp1`), per-look assets, contain-fit poster; default stays **r8** | yes, if the owner wants to see lamp1 in the real app |
| `02-runtime-lamp1.patch` | the shipped runtime becomes the lamp1-derived one (renders r8 pixel-identical) | with 01 |
| `03-pack-lamp1.patch` | `public/face-puppet/lamp1/` (pack + poster), binary | with 01 |
| `04-default-lamp1.patch` | makes lamp1 the default look (client + server rev) | **NO, not now** |

Why not 04: the live lamp1 puppet failed its blind gate. Uncanny 4/5 after three polish rounds (gate <= 1/5), premium
2.6/5, while the shipped r8 puppet, through the same page, scene, slot and prompt, scores uncanny 0/5 and premium 3.6
(`../evidence/judge-live-tally.md`). The brief's kill rule applies. 04 is kept for the day a lamp1 build passes.

## Order and commands

From the repo root, after round 3 has landed (re-check first; regenerate if a check fails):

```
for p in 05-one-teacher 05b-one-teacher-puppetface 06-bilabials-from-text 01-look-switch 02-runtime-lamp1 03-pack-lamp1; do
  git apply --check docs/design/round4/asha/integrate/$p.patch || break
done
for p in 05-one-teacher 05b-one-teacher-puppetface 06-bilabials-from-text 01-look-switch 02-runtime-lamp1 03-pack-lamp1; do
  git apply docs/design/round4/asha/integrate/$p.patch
done
npx tsc -b && npx vite build && npm test
```

Checked here: every patch passes `git apply --check` on the base; all seven applied in order (01 to 06, with 04) to a
fresh copy give exactly the tree that was tested; 05, 05b and 06 also apply alone on the base. On the patched copy:
`tsc -p tsconfig.json` clean, `vite build` succeeds, and these test files pass: p2-face-look (5), p2-face-unit (17),
p2-face-server (7), p2-face-flag (4), p2-face-player (2), p2-face-bilabial (3), avatar-face (27),
round3-relational-human-face (7), avatar-tutors (8), avatar-tutor-routes (4), teacher-name (11), gates (6),
lesson-truth (23), w2a-experience (28), ui-v2-b2 (13), voice-expressive-plan (8), ui-v2-copy (5), round3-fix (77).
kit-budget (3/3: every queued item and diagnostic compiles on both lanes, every language and age band, now with Asha's
class 5-9 register in place of Arjun's sheet; about 12 minutes). w2c-director has 1 failure both before and after the
patches (24/1 on the untouched copy too). NOT run here: the full `npm test` in the real repo, browser e2e scripts, DB
runs, and the prod acceptance script.

Instead of applying 02 + 03 you can regenerate them: after 01, `node evals/face-puppet/sync-runtime.mjs lamp1` writes the
same `src/face-puppet/runtime/*.js` and `public/face-puppet/lamp1/*` (it needs `scripts/character/puppet2d/lamp1/runtime/`
and `art/character/puppet2d/lamp1/`, both committed with this round).

## What each patch does

### 05 / 05b: one teacher
- `shared/tutors.js`: TUTORS = [asha]; her offer / wide / serve ranges are 1-9; `defaultTutorFor` returns "asha";
  `NAME_SUGGESTIONS` = Asha, Uma (a man's name is no longer suggested for the one woman teacher). The eligibility helpers
  stay, and answer `mode: "single"` for every child, which installed clients (the APK) already render as her card.
- `server/compiler/characters/asha.js`: classes [1, 9]; classes 1-4 keep her sheet unchanged; classes 5-9 take `older`,
  the register written and tested for those classes (Arjun's notes and protégé), with only the role word changed
  ("bhaiya-tutor" -> "didi-teacher"). `arjun.js` is deleted.
- `server/compiler/characters/index.js`: `CHARACTERS = { asha }`; `forClass()` picks the register; `teacherFor`,
  `teacherForLesson`, `characterForState` all use it. A row still holding `teacher_id = 'arjun'` is Asha (name, voice,
  she / her); an OPEN lesson pinned to "arjun" at deploy continues as Asha under her own name (her voice from the next
  reply: deploy between lessons, or accept that).
- `server/routes/tutor.js`: `POST /api/tutors/choose` and its SQL are gone; GET and the name routes stay.
- `server/routes/account.js`: the teacher is "asha" on create; `teacherId` in a PATCH is ignored (no switch, no name reset).
- Client: the Your-teacher screen is her card + "Change name"; Hello loses the "pick a teacher" card; onboarding Meet has
  one card; the picker (`TutorPicker`, `TeacherRoute`) is deleted (only the dev page used it); `chooseTutor` / `offerOf`
  and the choice copy are gone; `faceTutor` falls back to Asha; dev fixtures use Asha.
- Tests updated for all of the above; `tests/tutor-db-e2e.mjs` (the choose flow) is deleted; the two DB runs
  (`child-routes-db.run.mjs`, `lesson-safety-naming-db.run.mjs`) are updated but were not run here.
- Left alone, flagged: `server/voice/voices.js` / `speech.js` keep an unused "arjun" voice row; `db/migrations/008`
  (`tutor_switch`, `tutor_chosen_at`) stays, now unused; the child-safety regexes in `server/director/safety.js` still
  name Arjun (harmless, and the floor is not weakened); the browser e2e scripts below still assert Arjun-specific screens.

### 06: bilabials from the text
`src/face-puppet/visemes.ts` `addBilabials()`, called first in `resolveVisemes()`: a word with no Azure viseme 21 gets
one at its start (b / bh / p / m onset, Roman or Devanagari) or at an internal bb / pp / mm / mb / mp. Measured on one
line (9 b/m/p words): 5/9 sealed from Azure alone, 9/9 with the rule. One line is thin evidence: run the 24-line battery
(`evals/face-puppet/lipsync-offset.mjs`, `retro-words.mjs`) before trusting the timing rule widely.

### 01: the look switch
- `src/face-puppet/look.ts` (new): `?look=r8|lamp1|default`, localStorage `tx.flag.face.look`, `VITE_FACE_LOOK`, then
  `DEFAULT_LOOK` ("r8"). Read once per page, so a lesson never changes face.
- `src/face-puppet/assets.ts`: a table of looks (rev, cream, framings, poster). The old exports keep their names
  (`PUPPET_REV`, `PUPPET_BASE`, `PUPPET_CLEAR`, `PUPPET_VIEW`, `puppetPoster`) and now come from the active look.
  lamp1's framings are 4-element regions `[x0, y0, w, h]` that the runtime fits contain-centred (medium
  `[110, 25, 830, 875]`, close `[160, 40, 730, 730]`), so the Home card (319 x 172) never crops her chin.
  `posterStyle()` places lamp1's single 1024 x 1024 poster with the same fit in container units (no JS).
- `PuppetFace.tsx`: host background = the look's cream, `container-type: size`, poster styled by `posterStyle()`.
- `stage.ts`, `runtime/rig.d.ts`: views are `number[]` (3 or 4 elements).
- `evals/face-puppet/sync-runtime.mjs`: knows lamp1's source paths and `face.js`.
- `tests/p2-face-look.test.mjs` (new).

### 02: the runtime
`scripts/character/puppet2d/lamp1/make-runtime.py` derives it from r8's runtime by asserted string replacements: every
c-front constant reads `F` (`face.js`, defaults = c-front), plus per-face extras (lid shade, eye rounding, upward gaze
travel, interior tints, neck follow shape, expression preset overrides). The r8 pack through it is pixel-identical on
12 poses (`../evidence/r8-parity.json`, max |diff| 0). This is what lets one runtime serve both looks.

### 03: the pack
29 files, 233,955 B raw (layers 143 KB + geom 40 KB + poster 51 KB); 157 KB on the wire for the rig itself (gzip geom).

### 04 (hold): lamp1 by default
`DEFAULT_LOOK = "lamp1"`, `server/face-puppet/rev.js` -> "lamp1", the p2-face-server test checks the active look's
poster files, `evals/face-puppet/bundle-size.mjs` reads the rev.

## Test plan (after applying)

Automated: `npx tsc -b && npx vite build && npm test`, then `node evals/face-puppet/face-puppet.test.mjs` if you use it.

Manual, on a LOCAL dev server (`npm run dev`), never taxila.dev with a test account (it writes to the database):
1. Default (r8): every face slot looks exactly as today (the runtime changed under it; parity says identical).
2. `?look=lamp1`: lesson desk at 360 x 800, 412 x 915, 1366 x 768 (window 325 x 316 / 375 x 405 / 440 x 440); switch Face
   <-> Work so the 80 px SpeechRow adopts the stage (close framing); child Home card (319 x 172 / 240, 279 x 312), Hello,
   onboarding Meet (220 x 222), lesson Summary. Look for: poster -> live with no jump, no cropped chin in wide windows, no
   cut sleeve in tall ones, her cream ground inside the frame.
3. Safety: a turn marked calm_steady: no smile while she speaks, no listening nods (measured in the demo: smile 0, no nods).
4. `?puppet=0`: the TutorFace fallback appears. KNOWN GAP: that fallback face is still the old Asha plate (teal jacket,
   ponytail), not lamp1. A lamp1 plate / stills set is a separate job.
5. One teacher: classes 1-9 in onboarding all meet Asha; Hello has no teacher card; `/c/:cid/teacher` shows her card and
   Change name; a child stored with "arjun" gets Asha everywhere (name, she / her, her voice); a class 7 lesson compiles
   with the older register (protégé Bittu); `POST /api/tutors/choose` -> 404; PATCH `teacherId` is ignored.
6. Bilabials: on the lipsync battery, count seals before / after 06 and look for mistimed ones.

Browser e2e / prod scripts that still assert Arjun and need a follow-up edit: `tests/e2e-design-b2.mjs` (class 6 meets
Arjun, the choose flow), `e2e-design-lesson-safety-naming.mjs` (suggestions Asha / Arjun / Uma, "Keep Arjun"),
`e2e-design-lesson-truth.mjs` (V-LT4 "Arjun, he"), `e2e-design-b1.mjs`, `e2e-design-b1-route.mjs`,
`e2e-design-b3-parent.mjs`, `tests/prod/p2-face-acceptance.mjs` (the "Arjun keeps TutorFace" block). The studio /
module-tray / whiteboard browser tests only use "arjun" as fixture data and should still pass.

## Rollback
- Look: `?look=r8` on a device, or revert 04 (if it was ever applied). Puppet off: `?puppet=0` or `TAXILA_FACE_PUPPET2D=0`.
- One teacher: revert 05 / 05b. No data was migrated, so rows still holding "arjun" become Arjun again.
