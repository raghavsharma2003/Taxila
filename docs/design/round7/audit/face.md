# Whole-project audit 2026-11-09: face

Area 9 of `BRIEF.md`. Branch `claude/r7-audit-face`, from `int/r6` at integration 21a.

## The short version

- **The face a child sees today is r8**, the cartoon 2D puppet (`public/face-puppet/r8`, runtime in `src/face-puppet`). The owner's own accounts can be shown lamp2 (painted portrait, `public/face-puppet/lamp2`), and lamp2 with a moving jaw on `?jaw=1`. Nobody else can reach lamp2.
- **Every failure holds her own still.** No WebGL, a slow phone, a failed download, a lost GPU context or the server's kill switch all end on the rest picture of the same look. I found no path that swaps her for another face.
- **Two real defects on the live face, both fixed:** the lesson's face froze for up to 10 seconds after the safety Help sheet closed (FACE-01), and the daily greeting could never find its sound clip in production (FACE-02).
- **One mismatch a young child will notice, not fixed (needs Brain):** in classes 1 to 3 she asks the child to teach "Golu, a baby elephant", and the screen shows a cloud pup, a pebble or a sprout (FACE-03).
- **Weight:** the face area carries about 690 MB of art, scripts and prototypes. None of it reaches the production image. About 400 MB belongs to faces that lost and can go once main agrees (section "Deletions waiting for main").

Counts: 16 findings. By severity: P1 × 3, P2 × 6, P3 × 7. By kind: broken 3, inconsistent 6, not good enough 3, no longer needed 4.

## Findings

Status "fixed" means fixed on this branch with a test in `tests/r7-audit-face.test.mjs` that fails before the fix.

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| FACE-01 | P1 | broken | face | Lesson face freezes for 1.5 s to 10 s after the Help sheet closes | `src/face-puppet/stage.ts` (start, dispose), `src/face-puppet/PuppetFace.tsx` park(), `src/child/lesson/Desk.tsx:310` | A parked stage hands the running slot back at once (`PuppetStage.park()`) | fixed, `bb152ef5` |
| FACE-02 | P1 | broken | face | Daily greeting clip can never be found in the production image | `server/face-puppet/greetings.js:51-54`, `Dockerfile` final stage | Look in the served build (`dist/audio`, `TAXILA_DIST`) first, then `public/audio` | fixed, `bb152ef5` |
| FACE-03 | P1 | inconsistent | brain + face | Classes 1-3: she says "teach Golu, a baby elephant"; the screen shows a cloud pup, pebble or sprout | `server/compiler/characters/asha.js:25`, `server/director/shapes.js:438`, `src/ui/teacher/Protege.tsx:10` | Make the spoken description species-free ("a little friend just starting school"), or paint an elephant | waits for main (Brain's file) |
| FACE-04 | P2 | broken | face | Greeting is marked "given today" before it plays; the trigger cannot unlock sound on a touch | `src/face-puppet/useDailyGreeting.ts` | Mark the day at the clip's first sound; listen for `pointerup` and `keydown` | fixed, `931e6091` |
| FACE-05 | P2 | inconsistent | face | She is asked to glance at the protégé while listening, and that glance is always dropped | `src/ui/teacher/Teacher.tsx:90`, `src/avatar/behaviour.ts:265` | Ask for the glance only while she speaks or waits; correct the comment | fixed, `931e6091` |
| FACE-06 | P2 | inconsistent | face | Caption says the name the child gave her; the face's accessible name and the voice ring say "Asha" | `src/face-puppet/PuppetFace.tsx:105`, `src/avatar/TutorFace.tsx:131,271`, `src/ui/teacher/Teacher.tsx` | Pass the shown name down to the face | fixed, `931e6091` |
| FACE-07 | P2 | not good enough | face | Greeting lines: one in three repeats next day; six lines claim history a new child does not have; the day turns at midnight, not 04:00 | `server/face-puppet/greetings.js:16-32,42,66` | Skip yesterday's line; rewrite or drop the six lines; use the 04:00 day | fixed, `shared/day.js`, `greetings.js` (new ids `*-m4`, `*-a4`) |
| FACE-08 | P3 | inconsistent | face | Two class-to-band tables disagree for class 4 | `shared/tutors.js:102`, `src/child/band.ts:17` | Same cut in both; a test keeps them equal | fixed, `931e6091` |
| FACE-09 | P3 | inconsistent | face | `GET /api/tutors` answers the raw saved teacher id beside a list that does not contain it | `server/routes/tutor.js:106` | Answer the teacher the child really has | fixed, `931e6091` |
| FACE-10 | P3 | inconsistent | face | Comments that still describe a fallback to another face | `src/face-puppet/flag.ts`, `src/face-puppet/safety.ts`, `src/ui/teacher/Teacher.tsx` header | Correct the comments | fixed, `931e6091` (comments only, no test) |
| FACE-11 | P3 | no longer needed | face, app | Dead code in the face area | see evidence | Delete | face part deleted; app part is `docs/patches/to-app/008-face-dead-code.patch`; `adapter.tsx` kept |
| FACE-12 | P2 | no longer needed | face | Art and scripts of faces that lost: about 400 MB | see "Deletions waiting for main" | Delete | deleted (one commit, see inbox `dc-r7-audit-face-deleted-lost-looks`) |
| FACE-13 | P3 | no longer needed | face | 418 files are tracked although `.gitignore` lists their folders | `art/character/puppet2d/{P,V}/work`, `scripts/gpu/jobs/hello/runs` | Untrack (all but four files r8 still reads) | untracked; `.gitignore` and the tracked set agree |
| FACE-14 | P2 | not good enough | face | lamp2, one of the owner's three choices, cannot be rebuilt from the repo | `scripts/character/puppet2d/lamp2/common.py:6`, `pack.py:105-110` | Recover and commit the painted key sources, or record that the shipped pack is the only copy | closed as a record: lamp2 sources are gone for good, the shipped pack is the only copy |
| FACE-15 | P3 | not good enough | face, app | About 700 KB ships to every user that no default user can request | `public/assets/teacher/basis`, `teal`, `slate`, `plum` | Strip from the build as the 3D models already are (`vite.config.ts`, app's file) | waits for main |
| FACE-16 | P3 | inconsistent | main | r9 was judged better than r8 and its sync was "due"; nothing records why it never happened | `context/measurements.md:3365`, `art/character/puppet2d/polish-r9`, `polish-r10` | Decide: sync, or record the rejection; then r9 and r10 (42 MB) can go | deferred to the owner's look pick; r9 and r10 kept |

## Evidence

**FACE-01.** `Desk.tsx:310` renders `<HelpSheet>` beside the lesson body, and `HelpSheet.tsx:45` mounts a second live `<Teacher>`. In `stage.ts`, `start()` stops every other running stage (one running face per page) and only `dispose()` restarted the one underneath. When the sheet closed, `PuppetFace.park()` called `stage.stop()` and kept the stage for the next mount: 1.5 s normally, 10 s when the rig draws in a worker, which is the default. During that time the lesson's face was not drawing. Reproduced with two stages in node: the lesson stage stayed stopped after the sheet's stage was parked, and resumed only on dispose. It needs the live face (the default) and the sheet's face to have gone live, which it does after a few idle seconds; the sheet stays up at least 10 s. I did not check it on a phone.

**FACE-02.** The final image copies `dist`, `server`, `shared`, `data` and `src`. `greetings.js` checked `../../public/audio/hello-day-<id>.mp3`, which is `/app/public/...` in the container and never exists. Today no clip is rendered at all (27 lines, waiting on the owner's spend, decision B in `face/OWNER-FACE-REVIEW.md`), so no child is affected yet. Without this fix the spend would have produced clips that production never plays.

**FACE-03.** `asha.js:25`: `protege: { name: "Golu", what: "a pretend baby elephant just starting school" }`. `shapes.js:438` puts both into the teach-back prompt, and the hook at `shapes.js:44,50` promises "teach this to Golu". The skeptic confirmed that all class 1-3 topics take this path (the scripted lessons that drop the protégé are classes 4-6). `Protege.tsx` picks cloud-pup, pebble-friend or sprout-sprite from the child's name. There is no elephant art. The decision record (`dc-r7-face-teachback-protege`) does not mention Golu.

**FACE-04.** Before the fix: `mark(g.day)` ran on the first gesture, before `audio.play()`. A refused play, a load error, or a first tap on Start (the page leaves and the cleanup pauses the audio) spent the day's greeting in silence. The listeners were `pointerdown` and `keydown`; for touch, browsers grant the right to play sound on `pointerup`, so the first touch on a fresh page would be refused. This part is from the HTML rules, not run on a phone. Latent until clips exist.

**FACE-05.** `Behaviour.lookAt()` returns at once in `listening` and `thinking`; its comment says she listens with her eyes on the child. `Teacher.tsx` asked `<Protege>` to glance in `listening` too, so a cue went out every 3.6 s and was dropped. The rule in `behaviour.ts` is deliberate, so the request was the wrong side. `context/decisions.md` (`dc-r7-face-teachback-protege`) still says "while she listens, speaks or waits": inbox entry proposed.

**FACE-06.** Custom names still exist: `child.teacher_name`, `GET/POST /api/tutors/name`, and `TeacherNameProvider` in `ChildShell.tsx:172` and `LessonScreen.tsx:168`. No child can create a new one today (the naming card is not mounted), so this affects rows named before round 4.

**FACE-07.** `hash(child|day) % 3` picks the line. Lines `en-m2`, `hi-m2`, `hg-m2` ("pick up where we left off") and `en-a1`, `hi-a1`, `hg-a1` ("Hi again") break the file's own rule on line 7, "no claim about the child". `localDay` turns at 00:00 IST; `KakshaHome.tsx:28` starts the learning day at 04:00. Cheap to change now, before the 27 clips are rendered.

**FACE-08.** `bandOfClass(4)` was `b2`; `bandForClass(4)` is `b3` (class 4 left the young register in round 7). The server value feeds the `band` field of two tutor routes and the dev pages. The parent-gate check (`=== "b1"`) is unaffected.

**FACE-09.** For a row saved with `arjun`, the route answered `current: "arjun"` with `tutors: ["asha"]`. No client calls this route today. `current` stays `null` for a child with no saved teacher (an existing test pins that).

**FACE-11.** Checked across `src`, `server`, `shared`, `tests`, `evals`, `scripts`, including dynamic imports.
- `src/ui/teacher/useDelight.ts`: whole file, no importer.
- `getTutors`, `chooseTutor` in `src/child/api.ts:149`: no callers (the server routes stay for old clients).
- `TeacherPortrait`, `SITE_TUTORS` in `src/app/landing/Site.tsx:165-185`: defined, never used; the only use of `Plate2D` outside `src/avatar`.
- `voiceOnly` and `gentle` props on `TutorFace`/`PuppetFace`: no caller passes either.
- The picker block in `src/avatar/avatar.css:10-34`: no element uses those classes.
- Unused exports: `prefetchLook`, `lookIds` (`looks.ts`), `faceRigFailed` (`TutorFace.tsx`).
- `src/face-puppet/adapter.tsx` is installed only by `src/ui-v3/V3Root.tsx`, which nothing reaches from `src/main.tsx`. **Not safe to delete alone:** `evals/face-puppet/bundle-size.mjs:14` builds from it and `tests/r7-face-fallback.test.mjs:29` reads it. It goes when app removes the unrouted ui-v3 shell.
- The old 3D head and vector plates (`src/avatar/three/*`, `Plate2D`, `PlatePerson`, `plateMouth`, `looks.ts`, `looks.gen.json`, `flags.ts`) are reachable only for a lesson pinned to the parked tutor Arjun, or with `?facerig=1`. They are the `TAXILA_SINGLE_TEACHER=off` rollback. Not dead; listed so main can decide whether that rollback is still wanted.

**FACE-13.** `git ls-files` shows 413 files (192 MB) under `art/character/puppet2d/{P,V}/work` against `.gitignore:18`, and 5 files under `scripts/gpu/jobs/hello/runs` against `scripts/gpu/.gitignore`.

**FACE-14.** `lamp2/common.py:6` points at a session scratch folder (`L2_SCRATCH`); `pack.py` and `keys.py` read the painted keys from it. None is tracked. `art/character/puppet2d/lamp2` holds only `demo.html` and `pack-report.json`. Rebuilding lamp2 means paying for the images again. r8 has a smaller gap: `polish-r8/layers.py` reads the untracked `polish-r8/work`, so r8 can be re-packed from its tracked layers but not re-cut.

**FACE-15.** `public/assets/teacher/basis/r180` (584 KB) is read only by `src/avatar/three/rig.ts`. The `teal`, `slate`, `plum` pictures and JSON (116 KB) are read only when the `face.rig` flag is on, default off. `vite.config.ts:81-102` already removes the 3D models (7.5 MB) from the build but not these.

**FACE-16.** `context/measurements.md:3365` (`v4-review2-r9-sync-due`, 2026-10-05): r9 judged 4.2 against r8's 4.1, sync "a main-loop call". Production is still r8. No `JUDGE-r10.md`, no decision, no rejection.

## The open choice (keep all of it)

The owner has not picked Asha's final look. These stay:

| Look | Shipped pack | Runtime | What rebuilds or judges it |
|---|---|---|---|
| r8 (default) | `public/face-puppet/r8` (37 files, 344 KB) | `src/face-puppet/runtime/*` (checked: byte-identical to `scripts/character/puppet2d/polish-r8/runtime`) | `scripts/character/puppet2d/polish-r8`, `art/character/puppet2d/polish-r8`, `polish-r2/layers`, four files in `P/work`, `scripts/character/puppet2d/P`, `judge-r8*.mjs`, `evals/face-puppet/sync-runtime.mjs` |
| lamp2 (owner accounts) | `public/face-puppet/lamp2` (22 files, 216 KB) | `src/face-puppet/rig-keys/*` | `scripts/character/puppet2d/lamp2`, and from `lamp1`: `demo/bilabial.js`, `demo/page.html`, `judge-live.mjs`, `rigspace.py` |
| lamp2 + jaw (`?jaw=1`) | same pack | `rig-keys/keyrig.ts` jaw layer | `scripts/character/puppet2d/route-b`, `evals/face-puppet/route-b-sheet.mjs` |

Also unresolved, so also kept for now: r9 and r10 (FACE-16).

## Deletions waiting for main

Nothing here is deleted on this branch. Sizes are tracked files on disk. "Proof" is what reads the path outside its own generator folder; the skeptic re-ran these greps over `tests/`, `evals/`, `src/`, `server/`, `package.json`, `.github`, `Dockerfile*` and `context/*.md`. `.dockerignore` already keeps `/art` out of the image, so this is repository weight only.

| What | Size | Files | Proof that nothing reads it | Note |
|---|---|---|---|---|
| `art/character/puppet2d/polish-r3` … `polish-r7` | 106 MB | 483 | Read only by their own `scripts/character/puppet2d/polish-rN`. Named in `docs/design/teacher/puppet2d/JUDGE-r*.md` as the candidates judged then. No `context/` entry cites them. | Each round is a full copy of the one before |
| `scripts/character/puppet2d/polish-r3` … `polish-r7`, `judge-r1` … `judge-r7` | 2.4 MB | about 310 | Self-references only | Go with the row above |
| `art/character/puppet2d/V` and `scripts/character/puppet2d/V` | 91 MB | 255 + scripts | Own scripts and one design doc | The vector puppet that lost |
| `art/character/puppet2d/P`, except four files | about 136 MB | about 238 | r8 reads only `P/work/mouth-ref-cfront.png`, `mouth-base-blank.png`, `mouth-mask2.png`, `rest.png` (`polish-r8/gen-mouths-r2.mjs:8-13`, `cut-mouths-r2.py:19,48`) | **Keep those four files** and `scripts/character/puppet2d/P` |
| `art/character/bakeoff`, `bakeoff-assets` | 126 MB | 163 | Read by `scripts/character/bakeoff/**` and `scripts/gpu/jobs/face3d/job.json`. Cited as evidence by `teacher-gnm-identity-base`, `teacher-gnm-round2`, `teacher-gnm-slate-plum`, `w1f-versioned-look-urls` | 3D bake-off; evidence only. `tests/avatar-rig.test.mjs:230` walks `scripts/character/bakeoff`, so the scripts stay unless that test changes |
| `art/character/candidates`, `stylised` | 11 MB | 64 | Own scripts; cited by `teacher-polished-2026-10-04`, `stylised-*` entries | 3D candidates; evidence only |
| `art/gen/teacher` | 38 MB | 161 | `scripts/character/build.mjs:101-110` (3D pipeline); 157 rows in `public/assets/gen/INDEX.json` that the build skips | Reference pictures for the 3D build |
| `prototypes/reset/studio/recordings` | 42 MB | 14 | Cited in docs only | Studio's area by content; listed because the brief put `prototypes/` here |
| `scripts/gpu/jobs/hello/runs/**` | 32 KB | 5 | A run log, ignored by `scripts/gpu/.gitignore` | Untrack |
| `scripts/character/polished` | 12 KB | 1 | One design-doc mention | |
| Dead code in FACE-11 | small | | See FACE-11 | `adapter.tsx` only together with app's ui-v3 shell |

Must stay because a test reads it: `art/character/looks-out/teal` and `scripts/character/publish-look.mjs` (`tests/avatar-rig.test.mjs:211-214`), `art/character/candidates-built` and `scripts/character/candidates` (`tests/r7-face-cleanup.test.mjs:11-13`), `public/assets/teacher/{teal,slate,plum,basis}` (`tests/avatar-rig.test.mjs`, `tests/r7-face-rig-glbs.test.mjs`). These all belong to the 3D head. If main retires the Arjun rollback (FACE-11, last bullet), they and those tests can go together: a further 55 MB.

About 125 MB of the area is exact duplicate files (897 files with the same content as another tracked file), mostly keys and layers copied from one polish round to the next. The deletions above remove most of them.

`models/` is not face: `models/voicesig/filler-gru-r3.*` is live (voice, `src/voicesig/ort.ts`); `filler-gru.*` is read by one test and one eval; `models/duplex/cce-stageb-*` by evals and scripts only. `scripts/gpu` is the AWS GPU harness used by the 3D face jobs and by voice training scripts (`scripts/voice/v3`, `stt-v3`); it calls a non-Azure service and nothing in the product runs it. Left for main and voice.

## The live face: what I checked

- **Which face, and when.** `LessonFace.tsx` sends Asha to the puppet on every screen. Voice-only (`tier E`) shows the voice ring. `form="plate"`, the kill switch, `?puppet=0` and weak devices show her rest still. The look is fixed per page (`look.ts`): a page waits up to 1.5 s for the server's answer and then never changes it.
- **Mouth and speech.** Two sources: the speech service's mouth-shape events on the audio player's clock (`track.ts`, shifted 50 ms earlier, measured in an earlier round), and the audio level when there are no events. A cut (`puppetCut`) clears the mouth at once. I read this code and its tests; I could not measure timing without the speech service. The last measurements are in `face/OWNER-FACE-REVIEW.md` (r8: 89% of replies within ±50 ms).
- **States that stick.** The floor state comes from `floorState()` every frame, so thinking and listening follow the lesson's status and her audio. The acknowledgement hold (`knowledge.echoing`) is set and cleared from one place in `cascadeLink.ts:744-749`, and the end is sent on every exit. The one stuck state I found is FACE-01. One smaller case, not fixed because it sits on the frozen safety behaviour: the page-level safety latch (`latch.ts`) clears only when a live stage leaves the safety turn, so a child who leaves a lesson during a safety turn sees her neutral face on Home until the next lesson exchange.
- **When assets fail.** Pack or script fails: her still, with the light mouth for r8. Poster picture fails: the backdrop colour with her label, and the live stage still loads over it. Context lost: rebuilt once, her still after a second loss.
- **Server side.** `GET /api/face/config` holds no child data. Every tutor route calls `requireChild`; one account cannot read or change another's teacher. The lesson still pins its teacher.

## Coverage

- **Read fully:** `src/face-puppet` except the files named below; `server/face-puppet/*`; `server/routes/tutor.js`; `shared/tutors.*`; `src/ui/teacher/*`; in `src/avatar`: `TutorFace`, `Plate2D`, `PlatePerson`, `behaviour`, `compositor`, `faceCues`, `flags`, `lip`, `looks`, `tap`, `tier`, `three/contract`, `three/stage3d`.
- **Skimmed (headers, exports, tests):** `src/face-puppet/visemes.ts`, `rig-keys/schedule.ts`, `runtime/*.js` (the judged runtime, confirmed identical to its source by hash), `src/avatar/three/{head,rig,shaders,presets}.ts`.
- **Sampled by listing, size and reference search, not opened file by file:** `art/` (1,830 files), `scripts/character` (1,038), `scripts/gpu`, `prototypes/`, `models/`.
- **Not done:** nothing run on a phone or against the speech service; no visual check of the face in a browser (the earlier rounds' sheets are in `docs/design/round7/face/`).
- **Tests run:** the full gate before each push.
- **Skeptic pass:** one sub-agent tried to refute all 16. All stood. It corrected two: `adapter.tsx` is read by a test and an eval (FACE-11), and r8 reads four files in `P/work`, not three (FACE-12).
- **`context/rejected.md`:** searched for face, avatar, puppet, lip, greeting, protégé before each fix. None repeats a rejected approach.

## Close-out, 2026-11-10

- **Re-pack proof after the deletions.** Before and after deleting, on the same tree: `python3 scripts/character/puppet2d/polish-r8/pack.py` gives the same pack (sha256 of all pack files `9da63b92…`, 143,430 bytes of WebP, no git diff); `node evals/face-puppet/sync-runtime.mjs r8` changes only the manifest's date; `node scripts/character/puppet2d/polish-r8/build.mjs` re-runs `pack.py` and writes the same `demo.bundle.js` before and after (that file differs from the committed one before and after alike, a bundler version difference unrelated to this work). Re-cutting the mouths (`cut-mouths-r2.py`) still has its four `P/work` files and `polish-r2/layers`; re-cutting the layers still needs the untracked `polish-r8/work`, as before.
- **Kept:** 3D head and Arjun, r9, r10, `prototypes/`, `adapter.tsx`, lamp1, lamp2, route-b, `bakeoff`, `candidates`, `art/gen/teacher`, `scripts/gpu`.
- **Not changed:** FACE-03 (Brain's file), FACE-15 (app's `vite.config.ts`).
