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
| `npm test` (merged with base 343fa08c, head 0ee71c68) | | 2,598 tests: 2,533 pass, 60 fail (the same 60), 5 skipped; 0 failures not on the base | |
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
| class 6, branch, Asha band **v3, SHIPPED** (Arjun's notes verbatim, "didi-tutor" register) | 9 | 0.164 | 0.164 0.197 0.161 0.186 0.155 0.142 0.170 0.189 0.161 | 389 / 79, drop -2.5% (a rise): **PASS** (`scripts/talk-gate.mjs --baseline base-c6 --candidate asha3-c6`) |

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

### Owner batteries: owner-1..5 and round3-conversation (base vs branch)

Method: local production builds (`server/serve.mjs` + `server/worker.mjs`, `NODE_ENV=production`, prod model routing), my
Neon branch, seed 774993, n = 1 run each, one tree at a time. Children are scripted personas (no real child) and the
grading is code. Load: shared Azure quota.

| battery | base 8e438f04 | branch | note |
|---|---|---|---|
| owner-1 grading | 6/7 | 6/7 | one false_fail re-ask on both |
| owner-2 no-confusion | 8/12 | 9/12 | R5.loop and R7.defer on both; base's R6.gutted gone |
| owner-3 ending | 48/48 | 48/48 | |
| owner-4 steering | 17/17, then 17/17 and 17/17 on re-run | 17/18, then 17/17 and 17/17 on re-run | the one FAIL was cleanup held by the safeguarding guard: in one lesson the scripted "explain it differently" was classified to the safeguard move (model request classifier) and she gave the helplines. It did not recur in 2 re-runs on the branch: classifier variance on the safe side (reported to 4A) |
| owner-5 visual | 10/14 | 11/14 | the same failure classes on both |
| round3-conversation | 24/26 | 25/27 | the same B (R7.defer) and C (promise kept) failures on both |

No persona regression. All numbers come from simulated children.

### DB-backed proofs (Neon test branch, real routes, no model calls)

- `tests/lesson-safety-naming-db.run.mjs` 9/9, new test 7: classes 1-9 (rows as they exist: Arjun stored for 5-9) start a
  real lesson. Each gets Asha, "she", Diya's DragonHD voice (`dhdVoiceFor`), the band's register in the compiled
  instructions, the band's protégé (Golu 1-4, Bittu 5-9) and the pinned `ctx.teacherId = asha`.
- `tests/tutor-db-e2e.mjs` 9/9: the offer is `[asha]`; uma and arjun are refused with nothing written; a pick of Asha over
  an old Arjun row logs the switch; 409 while live; the B1 parent gate; erasure cascades.
- `child-routes-db`, `reports-db`, `ship5-review-filter-face-db`: green on the branch (`child-routes-db` with patch 07).
  These suites SKIP inside `npm test` in a stream session (see APPLY.md note), on the base too, so they were run
  separately with a decoy `DATABASE_URL`.

### e2e harnesses (mocked API, production build, Chromium)

- `tests/e2e-design-lesson-safety-naming.mjs`: 136 / 145. Every Hello / Your-teacher / parent-row / N-REAL check passes
  (N-REAL on the real routes: a pre-round-4 Arjun row reaches `/api/me` as Asha under her own name; her stored name
  is honoured; the parent's Reset is stored on Asha). The 9 failures are outside stream 5: the lesson hint line (4,
  lesson code), unnamed date inputs in parent Controls' "open now" (4), and a sandboxed-frame serviceWorker page error (1).
- `tests/e2e-design-b2.mjs --quick`: 429 / 433. One was my harness still expecting "he" (fixed). The other 3 are
  V-TGT 48 px "Me" on the young home (shared chrome).

### lamp1 trial with the WIP pack (NOT integrated, nothing committed from the pack)

In a scratch worktree: the current `art/character/puppet2d/lamp1/` was copied to `public/face-puppet/lamp1/`, the rest
posters were rendered from the live rig (`run.mjs poster --look lamp1`: medium 46.9 KB, close 60.4 KB), and the shot battery
ran with `--look lamp1`: 489 / 525. **Every non-chrome check passed:** every face is Asha painted in lamp1, no Arjun/Uma,
no choice, no overflow, no page errors, and the map sheet. The 36 failures are the shared-chrome text sizes. The live
puppet runs in the lesson Face layout, the SpeechRow face and Your teacher. Payload note for the Asha agent: the pack's wire
size is 156.5 KB (`pack-report.json`), over r8's 142 KB budget (BUILD-PLAN §3.5).

### Main-session asks of 2026-10-10 (after the Asha agent's final)

- **Part C on hold.** lamp1's live puppet failed the blind uncanny gate (4, 5, 3, 4 / 5 against ≤ 1; r8 is 0 / 5). lamp1
  is now HELD in code (`HELD_LOOKS` on client and server). `?look=lamp1`, a stored lamp1, and `TAXILA_FACE_LOOK=lamp1` all
  resolve to r8. A dev build can trial a held pack with `&heldlook=1` (the shot battery). r8 stays the default and the only
  live look. A passing rig (lamp2) joins the switch as a new look.
- **Bilabials from the text** (agent patch 06, `addBilabials` in `src/face-puppet/visemes.ts`). The agent measured one
  line (9 words). The 24-line battery (`evals/face-puppet/bilabial-battery.mjs`, offline, Diya's committed lines at rate -35):
  b/m/p words sealed **35 / 76 by Azure alone → 76 / 76 with the rule, 0 false seals**. Timing by lipsync-offset's E2
  (seal centre minus the deepest audio-energy dip within ±120 ms): Azure's own seals median 5 ms, IQR [-90, 95],
  |median| 95 (n 92); the added seals median 15 ms, IQR [-55, 80], |median| 80 (n 41). The added seals land as close to
  the acoustic closure as Azure's own. p2-face unit suite 33 / 33 with it.
- **Blink rate.** The "46/min" came from one 15.2 s clip. Measured through the real `PuppetDriver` path on Diya's 24
  lines (simulation, n = 8 seeds):

  | | rate -35 (committed lines, 2.8 min) | rate 0 (production, 1.9 min) |
  |---|---|---|
  | before | 27.9 / min (26.1-29.7) | 29.4 / min (26.8-31.5) |
  | after (event blinks move the next blink, never add one) | | **26.8 / min (22.0-27.3)** |

  The target is the table's 26 while speaking: human conversation is about 26 / min, rest 17, reading 4.5 (Bentivoglio et
  al. 1997). The "15-20" in the ask is the resting rate, and idle stays near it (19). In the first 15.2 s of speech, the
  old behaviour read 24-39 / min across the 8 seeds, so one short clip can read high. Regression: `tests/r4-asha-blink.test.mjs`.

### 5a live; 5b prep: the owner cohort for a candidate look (2026-10-10)

5a (single teacher + look switch + lamp1 held + bilabials + blinks) is LIVE: base 9920f21, prod revision
taxila-web--s9920f21-e9c2 (main session: gate 2,614 / 0 / 3 skipped, canary smoke 4/4).

For 5b, a candidate look (lamp2, if the owner picks it) goes to the owner's own accounts first, server-side and never by a
URL switch in production:
- `TAXILA_FACE_LOOK_FOR` (guardian emails or their sha256) + `TAXILA_FACE_COHORT_LOOK` (a look in `COHORT_FACE_LOOKS`)
  on the server (`server/face-puppet/config.js` `faceConfigFor`, the duplex cohort's helpers).
- A signed-in guardian on the list gets `{ look, cohort: "owner" }`. Everyone else gets the global look, and so does any
  lookup that is missing, expired or slower than 2.5 s. A held look is never served. The kill switch is unchanged.
- A cookie-dependent answer is `private, no-store` with `vary: cookie`. The list never leaves the server.
- On the client, a cohort-only look is admitted only from the server's cohort answer, never from `?look=`, and that
  answer is not remembered on the device.
- (Inert when written; 5b below wires lamp2.) Wiring lamp2 means keying its pack, adding it to both
  lists and setting the two env values on the Container App. Tests: `tests/r4-asha-cohort.test.mjs` (4).

### 5b: lamp2 for the owner cohort only (2026-10-10)

The main session's decision, as the owner's delegate: lamp2 (rig2 v3 K3, `claude/r4-asha-rig2` @ 9a43c6ba) goes to the
owner's own accounts only. Everyone else stays on r8. The owner's eye on real lessons decides a general rollout.
- **Keyed as cohort-only**: `COHORT_FACE_LOOKS` = `COHORT_LOOKS` = `["lamp2"]`.
  - Served only when `/api/face/config` answers a signed-in guardian on `TAXILA_FACE_LOOK_FOR`, with
    `TAXILA_FACE_COHORT_LOOK=lamp2`. The main session sets both at deploy.
  - Never from `?look=`, a stored device choice or `TAXILA_FACE_LOOK`. lamp1 stays held.
  - Pack: `rig: "keys"`, clear colour from its own `geom.json`, rig2's two framings.
- **The stage** (rig2 integrate patch 01, stage hunk): a keys look loads rig2's `KeyRig` (Canvas 2D, no WebGL2 needed)
  from `src/face-puppet/rig-keys/`. It adds `KEY_LEAD_MS` to the viseme lead, sets `rig.calm` from the driver's safety
  turn every frame, and skips the GL context-restore path. Its fallbacks (and the landing portrait) hold her lamp2 still,
  never the r8 vector.
- **Pack**: `public/face-puppet/lamp2/`, 130 KB of rig layers + keys, 180 KB with both posters (r8: 210 KB).
- **Tests**:
  - `tests/r4-asha-cohort.test.mjs`: a cohort account gets lamp2. A non-cohort account, a signed-out page and an unset
    list get r8, though the pack ships in `public/`. `?look=lamp2`, with or without `&heldlook=1`, and a stored lamp2
    are ignored. lamp2 without the cohort mark is r8. A cohort answer is not remembered. The stage's calm and keys
    wiring.
  - `tests/r4-asha-look.test.mjs` updated. `tests/r4-asha-rig2.test.mjs`: rig2's 7 schedule tests, incl. the
    safety-turn calm mouth.
  - Full gate: `npx tsc -b && npx vite build && npm test` = 2,549 pass / 60 fail (the same 60 browser-engine failures,
    the container's Chromium build) / 0 new. check-prompt-budget PASS. lint-ui 353 (= baseline).
- **Shot battery, lamp2 served through the cohort answer** (`--look lamp2`: the mocked config says
  `{ look: "lamp2", cohort: "owner" }`). 360 / 412 / 1366, young and older. `shots/lamp2/`: **609 / 648**.
  - Every ONE (Asha everywhere, every puppet paints lamp2, at most one live face the child can see), NAMES, CHOICE and
    ERR check passes, incl. the Trouble (T1) calm-safety face and the help sheet.
  - The 39 failures are all FIT `text ≥ 14 px` (13 px "Talk", the child nav, onboarding "Step 2 of 9", landing
    "Sample"). The same checks fail on r8 (the r8 run: 36); they are not lamp2's.
  - Non-cohort pass: the server answers r8 and the page asks `?look=lamp2`; every puppet paints r8.
  - Note: the r8 run found 2 canvases on the help sheet; the second is the lesson face under it, covered. It is not
    drawing: the stage runs one stage per page (`foreground` in `stage.ts`), and the covered one is suspended.
- **Bilabials on lamp2** (rig2's `battery.mjs`, offline, the stored Diya battery, product timing path → lamp2
  `MouthKeys` at 60 fps): 123 / 132 bilabial words sealed with the product's text rule (`visemes.ts` addBilabials).
  rig2's extension (`bilabial2.js`) gets 132 / 132; its 9 misses are single internal or final b/m/p words (tum, Ab,
  about, carbon, dhoop, lagbhag, खुशबू, Shabash, vaashpikaran). The extension changes the text rule for every look,
  r8 too, so it is NOT wired: an owner or main-session call.
- **lamp2 lip-sync offset** (same run): median +5 ms (IQR -15..+40), 67% within ±50 ms; 76% with the lag search held to
  ±150 ms. The median passes; the ≥ 80% share target does not (rig2 measured the same).
- **lamp2 blinks**: rig2's own schedule, 16.0 / 18.7 per minute quiet / speaking over 10 simulated minutes
  (`tests/r4-asha-rig2.test.mjs`).
- **One live face, fps**: rig2 measured lamp2 at 59.9 fps on the 80 px speech row and on the 412 desk, at a 4x CPU
  throttle (headless Chromium, not a phone; rig2 `evidence/fps-*.json`). Not re-measured here.

### Main-session asks on 5b (2026-10-10, after 51a2aaf5)

**1. The 60 `npm test` failures, by name.** All 60 are in `tests/engines-browser.test.mjs`, and all 60 fail one
assertion, "no console errors (engine crash, CSP violation) in the frame". The console error is the same each time:
`Refused to connect to 'ws://localhost:<port>/?token=…' because it violates … "connect-src 'none'"`. Nothing in the
engine code opens that socket.

**Cause:** this container's browser pairing. Playwright 1.63 expects Chromium build 1243; the container ships build 1194,
which is symlinked under the 1243 name (`/opt/pw-browsers`). The old build trips the engine frame's CSP. Evidence:
- The base tree (9920f21, a separate worktree) fails the same 60 in this container.
- The main session's integration tree passes them (2,672 / 0).

The 60, each with that one cause (Chromium 1194 under Playwright 1.63, CSP refusal of a `ws://localhost` connection):
- number-line@1 place 3/4 (one wrong commit first)
- number-line@1 read a decimal marker (Hindi labels)
- number-line@1 jump 7 → 12 with +1/+5 (ages 6-9, 64 px targets)
- number-line@1 from Director context only (fractions extracted from the prompt)
- collections@1 count 7 (tag each, one wrong total first)
- collections@1 make 13 with +10/+1 (ages 6-9)
- collections@1 compare from Director numbers (spread side wrong first, stuck after two)
- place-value@1 build 305 (Hinglish place names)
- place-value@1 read 305: concatenated '3005' graded wrong and tagged
- place-value@1 compare 2,999 vs 10,001 (lakh grouping)
- fractions@1 make 3/4 on a circle (roti)
- fractions@1 compare 2/3 vs 3/4 (bigger)
- fractions@1 equivalent to 1/2 on quarters
- fractions@1 add 1/4 + 2/4 (add_across tagged)
- multiply-divide@1 array 3 × 4
- multiply-divide@1 share 7 among 3 (deal rounds, keep 1 back)
- multiply-divide@1 every rectangle of 6
- geoboard@1 build area 6, perimeter 10
- geoboard@1 measure the perimeter of a 3×2 rectangle (area given first = swap)
- geoboard@1 contrast: same area, different perimeter (ages 6-9)
- data-graphs@1 read a pictograph: most
- data-graphs@1 read a value with the key (icons counted = icon_ignores_key)
- data-graphs@1 build a bar graph from a table
- patterns@1 repeat ● ■ ● ■ _ _
- patterns@1 grow 3, 6, 9, 12 → 15, 18
- patterns@1 grid: multiples of 3 up to 12
- measure@1 broken ruler: object from 2 cm, 5 cm long (end read first)
- measure@1 pour 600 mL into the jug
- measure@1 read 25 °C on a thermometer (Hindi)
- sky@1 day and night: turn India into night
- sky@1 shadow stick with POE (predict noon, then find the shortest shadow)
- sky@1 moon phases: find the full moon
- motion-lab@1 speed: reach 20 m in 5 s (a run that falls short first)
- motion-lab@1 friction: test every surface, then pick the farthest
- motion-lab@1 pendulum: a fair test on mass, then 'the same' (animated)
- water-cycle@1 cycle: one wrong process, then all the way round
- water-cycle@1 states with POE: temperature stays while boiling
- water-cycle@1 groundwater: forest cover, pump 2, run 10 years
- scene@1 compare-choice: tap the side with more
- scene@1 sequence-steps: swap into order, Check
- scene@1 sort-bins: tap a piece, tap a bin (the drag twin)
- scene@1 predict-reveal: commit a prediction (reveal timeline plays)
- scene@1 slider-explore: move the Sun until the shadow is under 1 m (goal, no probe)
- scene@1 count-group: deal mangoes onto 2 plates (voice-commit probe, goal by taps)
- scene@1 Forge choice-card (G1 fill)
- planned: c4 'Round 3620 to the nearest 100' → number-line rounding (target never shown)
- planned: c4 '2, 5, 8, 11, ___' → number-line jump from 11 by 3
- planned: c5 'Fill in: 1/3 = ?/6' → fractions equivalent on a fixed sixths shape
- planned: c4 'Write in numbers: four thousand fifty' → place-value build from the name (numeral never shown)
- planned: c4 'Key: 1 star = 100 people … 7 stars' → data-graphs pictograph read
- planned: c4 'What is 7 × 8?' → multiply-divide product entry (building 7×8 alone is not graded)
- planned: c4 'Eggs come in trays of 6 … 3 trays' → product entry, the expression is not shown
- planned: c1 '4 tens and 6 ones. Write the number.' → place-value read of the given pieces (46 never shown)
- predict: fractions@1 compare hides the shapes until the pick (Director predict, engine mode kept)
- predict: multiply-divide@1 product hides the dots until the verdict
- predict: number-line@1 place hides the marker readout until the verdict
- data-graphs@1 bar read: a labelled value axis (gridlines every step) makes the value readable
- commands: fractions@1 highlight + reveal before the child acts, set_param starts a new goal
- commands: scene@1 reveal marks the right choice-card option
- commands: unknown param and bad values degrade with params_adjusted, not a crash

**2. The bilabial extension on r8** (`evals/face-puppet/lipsync-looks.mjs`, one harness and one line set for both looks;
`./bilabial2.js` is rig2's rule copied as a candidate, not wired). Offline: Diya's 24 stored lines, the product timing
path, 60 fps; 132 bilabial words; the offset over the 21 lines with a forced-alignment track.

| look / rule | sealed | offset median | within ±50 ms | ±150 ms lag search | within ±50 at 30 fps |
|---|---|---|---|---|---|
| r8 / product rule | 122 / 132 | +10 ms | 95% | 100% | 90% |
| r8 / + extension | **132 / 132** | +10 ms | 95% | 100% | 90% |
| lamp2 / product rule | 123 / 132 | +5 ms | 67% | 76% | 52% |
| lamp2 / + extension | **132 / 132** | +5 ms | 67% | 76% | 52% |

- On r8, the extension seals all 10 product-rule misses and leaves the offset unchanged.
- **Blind judge: not run.** The available judge (`evals/face-puppet/judge-blind.mjs`) scores a still 3×3 grid for look
  (premium / uncanny). It doesn't see audio, so it can't judge whether lips close in time with a sound, and no available
  Azure model judges audio-video sync. Per the repo law (a model never grades; classify against verified keys), the
  seal count above is the instrument.
- Main's rule was: adopt for both if r8 is the same or better on all three; for lamp2 only if r8 is worse anywhere. r8
  is better on seals and the same on offset; the third (the judge) is missing. **Not wired**, and the call goes back to
  the main session.

**3. lamp2 lip sync: 67% within ±50 ms against r8's 95%**, same harness. Per the main session's rule, this blocks lamp2
beyond the owner cohort; it doesn't block the cohort. Root cause, line by line (`out/lipsync-looks.json` `perLine`):
- **Not the TTS word-boundary or viseme events.** r8 gets 95% from the same events.
- **Not a constant lead or lag.** lamp2's median is +5 ms.
- **The drawn signal's shape.** 4 of 21 lines lock a whole syllable away (±235-320 ms; r8 on the same lines: -15..+50),
  and 3 are 65-85 ms off. A stepped mouth (a few painted openness levels, each held ≥ 70 ms, crossfaded) correlates with
  the audio envelope at the neighbouring syllable too. A ±150 ms search recovers 2 of those lines (76%).
- **Frame pacing amplifies it.** At 30 fps lamp2 falls to 52%, r8 only to 90%. The stage speaks at 60 fps, so the 67%
  is the speaking figure.
- What would move it: a mouth closer to continuous (more painted openness levels, or a short-hold tween between keys).
  The open-mouth texture flicker rig2's judges saw argues against more keys; rig2's RESULTS names an artist-drawn mouth
  sheet.

**4. 13 px text: 39 on lamp2 vs 36 on r8.** The 3 extra are `FIT noncohort-lesson-speaking-b3` at 360 / 412 / 1366, a
NEW surface in the lamp2 battery: the non-cohort pass re-shows the lesson-speaking fixture. It fails on the same 13 px
"Talk" label as `FIT lesson-speaking-b3` on r8 (all three widths). The label is `src/child/lesson/TalkButton.tsx`,
stream 2's Desk, not this stream's. No new 13 px text on any screen.

### The turn POST waited behind the puppet: turn first (open-r4lat-puppet-delays-turn-post, 2026-10-10)

The r4-latency finding: on tap-to-talk, final transcript → turn POST was p50 ~205 ms with the puppet on, against 8-29 ms
with it off.

**Root cause** (CPU profile + `tests/prod/r4-asha-taskwait.mjs`, headless Chromium, software GL):
- On this machine every puppet frame is one long main-thread task: 50-100 ms unthrottled, up to 170 ms at a 4× CPU
  throttle. The page manages only 9-21 frames a second.
- Almost all of it is native WebGL rasterisation of the 656×724 canvas: `(program)` 3,022 of 3,166 ms profiled. The
  frame's JavaScript is ~100 ms per 3 s.
- The runtime sends the turn after a chain of macrotasks: `queueTurn` → `runTurn` → the outbox's IndexedDB reserve +
  write → `fetch`. Each waits behind the frame holding the thread.
- Probe, puppet on vs off: `setTimeout(0)` wait p50 50-200 ms vs ~4 ms; an outbox-shaped IndexedDB chain 350-660 ms vs
  2-7 ms.
- The stage's governor never steps down, because it times only the frame's JavaScript (~1 ms). Not changed here:
  counting raster time would step r8 down to its 20 fps floor and its still on the very headless machines the look
  reviews measure on. A real phone GPU makes this raster far cheaper (not measured).

**Fix** (`src/face-puppet/stage.ts`):
- On the child's turn, the stage draws nothing for `TURN_HOLD_MS` = 300 ms. It listens for the `taxila:play-heard` page
  event, which the runtime fires synchronously on `child_final` just before `queueTurn`, and for `taxila:turn-sending`
  (patch request 08, not applied: shared file).
- Never while she speaks. The held gap is not counted as a stall.
- In tap-to-talk she is in her thinking hold then (breath, drift), so the held frame is not seen.
- `tests/r4-asha-turnfirst.test.mjs` pins the hold and the runtime coupling.

**Before / after on the r4-timeline driver** (r4-latency's own; local production build, real models and DragonHD TTS,
fixed 750 ms fake ASR, synthetic child clip (gpt-4o-mini-tts ×1.2: not a child), plain account class 7, tap-to-talk, Done
0.7 s after speech, r4-latency's 12 lines, one lesson per arm on a fresh browser context, phone 360, headless Chromium
software GL; `latency/ptt-*.jsonl`):

| arm | n | final → POST p50 | p90 | min-max | stage drawn fps p50 / interval p95 / stalls |
|---|---|---|---|---|---|
| before (puppet on) | 24 | 149 ms | 538 ms | 47-717 | 30.0 / 67 ms / 5 |
| **after (puppet on)** | 24 | **16 ms** | **23 ms** | 9-56 | 29.9 / 67 ms / 3 (12 turn holds) |
| puppet off (same after build) | 12 | 11 ms | 14 ms | 8-16 | n/a |

**Again with production routing**, as the main session asked (merged tree 79c14571; server
`--env-file=.env.local --env-file=tests/prod/prod-routing.env`, so `TAXILA_TURN_PREFETCH=on`; same driver, lines and
phone; `latency/ptt-prodrouting-*.jsonl`):

| arm | n | final → POST p50 | p90 | min-max | stage drawn fps p50 / interval p95 / stalls |
|---|---|---|---|---|---|
| before (puppet on) | 12 | 244 ms | 534 ms | 71-729 | 20 / 67 ms / 4 (2,150 first load; 183-450) |
| **after (puppet on)** | 12 | **15 ms** | **21 ms** | 10-40 | 20 / 67 ms / 6 (2,133 first load; 217-433) |
| puppet off | 12 | 10 ms | 13 ms | 7-14 | n/a |

- Stalls 4 vs 6 sit in the same 183-450 ms range on both builds. The hold's own gap is exempt from stall counting, so
  this is headless jitter. Read the counts as noise at n = 1 lesson each.
- Prefetch is on in the server env, but the client sends none on tap-to-talk in this tree: a 2-turn check read
  `prefetch: []`. The client fix that makes tap-to-talk prefetch (`cascadeLink.talkEnd`) is on `claude/r4-latency`,
  not yet in base.

The bar (p50 ≤ 30 ms, n ≥ 12) is met in both runs. The before arm's two runs read p50 322 and 146: it swings with where the frame
clock is when the final lands.

**Probe** (`tests/prod/r4-asha-taskwait.mjs`, `/dev/desk` fixture, the runtime's own sequence: `play-heard` → 2
IndexedDB writes → `fetch`, n = 12 per arm; `latency/taskwait-*.json`):

| state | CPU | before p50 / p90 | after p50 / p90 | puppet off p50 |
|---|---|---|---|---|
| your turn (thinking alike) | 1× | 251.8 / 337.8 | **1.9 / 2.8** | 1.7 |
| your turn | 4× | 371.6 / 420.5 | **5.5 / 7.8** | 6.5 |
| she is speaking | 1× | 296.5 / 318.6 | 250.9 / 316.6 (no hold, by design) | 2.1 |

The speaking row is a child turn sent while she talks, e.g. a typed barge-in. Holding there would freeze her mouth
mid-sentence, so it keeps the old cost. On tap-to-talk (the measured path) the child's turn lands in her thinking or
listening hold.

**The other bars:**
- **fps:** drawn fps and interval p95 are unchanged (table).
- **Lip sync:** the hold never runs while she speaks, and the viseme schedule is untouched, so lip sync can't move; not
  re-measured.
- **Look:** no look or pack code changed.

**Real phone:** not profiled. There is no Android device on this cloud container, so there was no CDP trace on one.
Every number here is headless Chromium with software rendering.

## Not met / open

- Part C waits on the pack.
- The puppet governor counts only the frame's JavaScript, not raster time, so it can't see a page it starves (above).
  The turn POST is covered by the hold. A raster-aware governor needs a decision on what headless review machines
  should show.
- A child turn sent while she speaks still waits behind frames (~250 ms, headless). Patch 08 doesn't change that.
- A real Android profile is still owed.
- lamp2: rig2's bilabial extension (123 → 132 / 132 on lamp2) changes the text rule for every look: needs a call.
  lamp2's lip-sync share within ±50 ms is 67-76% against the ≥ 80% target.
- Owner decisions needed: (1) lamp1 as the default (`TAXILA_FACE_LOOK=lamp1`), only after Part C and their phone look;
  (2) "Asha didi" as her address for classes 5-9 (kept, since the persona invariants are tuned on it); (3) the naming
  card: removed here as a teacher choice, restorable in one line.
