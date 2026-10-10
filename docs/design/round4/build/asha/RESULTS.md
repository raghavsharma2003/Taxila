# Stream 5 · Asha (`claude/r4-asha`) · RESULTS

Base: `claude/blissful-mayer-icwe2j` @ `8e438f04`. Database: my own Neon TEST branch only (`test-r4-asha`).
**No child has used any of this.** Every number below is from simulation (an LLM-played child), code checks, or a
model judge, and is labelled as such. Nothing here is deployed; making lamp1 the default needs the owner's yes.

## Status at a glance

| part | what | state |
|---|---|---|
| A | single teacher (Asha, classes 1-9, `TAXILA_SINGLE_TEACHER` default on), sheet widened, every teacher choice removed | **built, unit-gated**; full-suite gate and batteries: see below |
| B | look switch `r8` / `lamp1` (assets keyed per look, `look` in `/api/face/config`, `?look=`, lamp1 still as every Asha fallback) | **built, unit-gated** |
| C | integrate the final lamp1 pack, posters, runtime patch, `evals/face-puppet`, `p2-face` 31/31 | **waiting** for the Asha agent's final pack and `docs/design/round4/asha/integrate/` |

## Part A: what changed

Server (owned files):
- `server/compiler/characters/index.js`: `singleTeacher()` (env `TAXILA_SINGLE_TEACHER`; `off` / `0` / `false` is the
  rollback to Asha 1-4 / Arjun 5-9, read on every call). `teacherFor` serves Asha for every class whatever the row
  stored. `teacherForLesson` is unchanged: an open lesson keeps its pinned teacher, voice and face. `sheetFor(c, class)`
  picks Asha's register band; `SHEETS` lists every band for the gates. A stored custom name is honoured only on the look
  it was given to (a class 5-9 child who named Arjun meets Asha under her own name).
- `server/compiler/characters/asha.js`: `classes: [1, 9]`. Two bands. Classes 1-4 keep the sheet byte for byte. Classes 5-9
  get notes drawn from Arjun's competence notes ("competence before warmth: diagnose what they tried…", "picture → rule →
  number", "say plainly which step broke", "brisk but patient"), "never babyish", and the protégé "Bittu, a pretend new
  student who missed this class" (not a baby elephant). Notes and shapes only; a test bans quotes and first-person lines.
- `shared/tutors.js`: Arjun and Uma `status: "parked"`; Asha fits 1-9; `defaultTutorFor` is Asha (the server passes
  `single: false` for the rollback).
- `server/routes/tutor.js`: `GET /api/tutors` offers `[asha]` (mode `single`) for every class; `POST /api/tutors/choose`
  refuses anyone else (403) under any offer mode; a rename under the single teacher pins the name to Asha.

Client (owned files): Hello has no teacher card and no naming card (it goes picture → likes → lesson 1). "Your teacher" is
her card only, with nothing to press. Onboarding Meet shows one teacher, with no "your child will choose". `TutorPicker` and
`TeacherRoute` are deleted. The parent "Teacher's name" row keeps view + "Reset to Asha" and loses "Change name" (no new
names; stored ones are honoured). The landing shows one portrait with "One teacher for every lesson", and has no naming copy.
The naming component and its server code stay for the owner's one-line restore.

Patch requests (`patches/APPLY.md`, each also a `[patch-request]` commit here): 01 AvatarDev (drop the deleted picker),
02 `account.js` (the client gets the SERVED teacher id; create/PATCH write only a teacher who serves the class), 03 budget
gates + persona invariants compile Asha's 5-9 band, 04 lesson-truth reaches Arjun via a pinned lesson, 05 director-sim
`--class N`.

## Part B: what changed

`src/face-puppet/assets.ts` keys base, clear colour, views and posters per look (lamp1's are its `geom.json`'s own, and
a test checks them). `server/face-puppet/config.js` reports `look` (`TAXILA_FACE_LOOK`; unset or unknown is r8).
`src/face-puppet/look.ts` resolves the look: `?look=` on the device, else the server's look (remembered), else r8. One
config request carries both the kill switch and the look. Nothing paints until the look is known, so there is no face
swap. Under lamp1, every Asha fallback is her lamp1 still: a pre-reveal failure, a page that already failed, the server
kill switch, the device switch-off, and the landing portrait. None of them is TutorFace's Plate2D. r8 behaviour is unchanged.

## Gates and measurements

Base = untouched `8e438f04` in a separate worktree; branch = this tree. Same container, same Neon branch, 2026-10-10.

### Static gates

| gate | base | branch | note |
|---|---|---|---|
| `npx tsc -b` | pass | pass | |
| `node scripts/check-prompt-budget.mjs` | PASS, worst 1,645 / 2,600 (character 232) | PASS, worst 1,645 / 2,600 (v3 band; v1 was 1,672) | patch 03 makes the gate compile Asha's 5-9 band and Arjun (the rollback) |
| `node evals/persona-invariants.mjs` | ALL 70 PASS, 2 characters | ALL 105 PASS, 3 sheets (asha 1-4, asha 5-9, arjun) | patch 03 |
| `node --test tests/kit-budget.test.mjs` | pass | pass | patch 03 |
| `node scripts/lint-ui.mjs --json` | 353 findings | 353 findings, 0 new (diffed by rule + file + text) | |
| `node scripts/context.mjs --check` | ok | ok | |
| `npm test` | 2,575 tests: 2,505 pass, 64 fail, 6 skipped | 2,593 tests: 2,527 pass, 60 fail, 6 skipped; 0 failures not on the base (diffed by test name) | the branch's 60 are the base's 60 engines-browser scenarios; the base's other 4 (frame/tray timing tests) passed on the branch. The branch run had sheet v2; v3 differs only in notes data, and its targeted tests (114), budget and invariants were re-run green | all 64 base failures are Chromium-iframe tests: the container has Chromium 1194, playwright 1.63 wants 1243 (linked locally, never downloaded), and its CSP console wording differs from the harness's dev-noise filter. Environmental. |

### Talk gate (persona change): child talk share, director-sim

Method: `evals/director-sim.mjs` (patch 05 adds `--class`), in-process API on my Neon branch, real classifier + reply
models, **LLM-played child (simulation, not a child)**, 14 turns. Concurrency ≤ 3 lessons. Load: shared Azure quota.

| arm | n | median | values | teacher / child words per lesson (mean) |
|---|---|---|---|---|
| class 4, base (Asha, unchanged sheet) | 3 | 0.163 | 0.152 0.165 0.163 | |
| class 4, branch | 3 | 0.163 | 0.174 0.163 0.157 | drop 0: PASS |
| class 6, base (**Arjun**) | 9 | 0.160 | 0.177 0.138 0.178 0.135 0.150 0.178 0.139 0.160 0.164 | 390 / 73 |
| class 6, branch, Asha band **v1** (her young warmth, humour, pace notes) | 6 | 0.138 | 0.177 0.159 0.129 0.137 0.133 0.138 | 390 / 67, drop 16%: **FAIL**, rejected |
| class 6, branch, Asha band **v2** (Arjun's notes + "ask more than tell" + "never babyish") | 9 | 0.145 | 0.142 0.139 0.145 0.155 0.143 0.183 0.160 0.138 0.166 | 397 / 71, drop 9.4%: passes the 10% rule only narrowly; rejected for v3 |
| class 6, branch, Asha band **v3, SHIPPED** (Arjun's notes verbatim, "didi-tutor" register) | 6 (3 more running) | 0.163 | 0.164 0.197 0.161 0.186 0.155 0.142 | 389 / 78, drop -1.6% (a rise): **PASS** |

Reading: with the same teaching notes, the simulated class 6 child talks as much to Asha as to Arjun, so the
name, the voice and "didi" are not what moved the number. The notes were. Asha's young-band warmth, humour and pace
notes, and the "never babyish" / "ask more than tell" additions, both lowered child talk. The 5-9 band is therefore
Arjun's measured notes, re-registered. Class 1-4 notes are byte-identical to the base.

The official `verify-release --persona-change` compares against `evals/results/talk-baseline.json` (median 0.238,
2026-10-05, an older tree). The untouched base fails it too (class 4: 0.163, a 31.5% drop), so that file is stale. The
fair comparison is the same harness on the base, above. Main session: refresh `talk-baseline.json` on the integrated tree.

Every arm, base included, fails director-sim's own strict checks (b, a reply over 40 words, in 28 of 30 lessons; d/e on class 4).
Pre-existing, the same on both trees.

### Shot battery (`tests/prod/r4-asha-shots.mjs`, mocked API, production build with dev routes, look r8)

Face surfaces × 360x800, 412x915, 1366x768: lesson speaking / your_turn / work-speaking / work-your_turn / summary /
trouble T1 / help (b2 and b3), Hello, Home, Map sheet, Your teacher (young and older), onboarding Meet (class 3 and 7),
landing. First run: 483 / 531 checks. **ONE (every face is Asha), NAMES (no Arjun/Uma), CHOICE (no teacher choice),
overflow and page errors: 0 failures.** Failures: the map-sheet selector (fixed in the harness), and text < 14 px in shared
chrome I do not own (13 px "Talk" mic label, the bottom nav, "Step 2 of 9", "Sample"), which the base comparison will place.

## Not met / open

- Part C waits on the pack.
- Owner decisions needed: (1) lamp1 as the default (`TAXILA_FACE_LOOK=lamp1`), only after Part C and his phone look;
  (2) "Asha didi" as her address for classes 5-9 (kept, since the persona invariants are tuned on it); (3) the naming
  card: removed here as a teacher choice, restorable in one line.
