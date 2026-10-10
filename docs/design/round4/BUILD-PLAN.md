# Round 4 · BUILD-PLAN: one grown-up teacher, games that work, content that is true, a teacher who answers fast

**Date:** 2026-10-10 · **Base:** `claude/blissful-mayer-icwe2j` (round 3 release candidate `7f3fedf`, being deployed)
**Status:** plan only. Nothing here is built, measured on a child or deployed.

> **2026-10-10, later the same day: partly superseded.** The owner set a new direction
> (`dc-r4-owner-vision-superhuman-tutor`, `context/inbox/merged/r4-owner-vision-2026-10-10.json`). It asks for:
> - a session-first "tuition teacher" flow, with no modules;
> - a fully gamified app UI;
> - games at real-game quality (the owner's bar: Minecraft or space-fighter), built live from the lesson;
> - SketchMind-style live content;
> - an evolving bond;
> - duplex fully working.
>
> **Wave 1** uses this plan's briefs unchanged, with v2 notes (`docs/design/round4/build/SESSIONS.md`). It runs
> streams 2, 3, 4A, 4B and 5.
>
> **Re-planned in BUILD-PLAN v2:** the games lanes (1A-1D), the app shell ("keep today's shell" no longer holds)
> and the session-first Director.

**Owner scope (2026-10-10). This supersedes the Prakash plan.**
> "lets not care even a bit about prakash and lets focus on only 1 teacher that is asha (new grown up version)"
> "the game/content development and its deploy for the student is extremely fucked up and nonsense and fully broken"

The owner wants everything finished at 100% quality, tested with no gaps, and deployed to production. He has approved
as many parallel cloud sessions as needed.

What this means for the plan:
- There is no world UI rebuild. `src/prakash`, the dusk tokens, the scenes, the jharokha and the valley map are all dropped.
- `docs/design/round4/world/` is kept on file as a parked direction.
- The main session logs `dc-r4-asha-only` with a `supersedes` edge to `dc-r4-direction-prakash-grownup-face`.

Read with this plan:
- `CLAUDE.md`, and `context/rejected.md` first;
- `docs/design/round3/fix/RESULTS.md` (the round 3 gaps);
- `docs/design/reset/VALUES-100.md` (the five values and their 100% bars);
- `docs/design/round3/game/concepts/mechanics.md` (game families per topic);
- `docs/design/round3/play/RESULTS.md`, `docs/design/round3/forge/RESULTS.md`, `docs/design/round3/duplex/CRITERIA.md`;
- `docs/design/round4/asha/PROGRESS.md`, `docs/design/round4/face/RIG-NOTES.md`.

---

## 1. The target, on one screen

**What the child sees.** The child sees today's app and today's screens, with these changes:
- **One teacher everywhere.** The child meets and learns with one teacher, the new grown-up Asha:
  - face option 4 "Lamplight flat", with the cardigan and block-print kurta;
  - the `lamp1` puppet pack, which is arriving in `art/character/puppet2d/lamp1/`. On 2026-10-10 it already holds 28
    layers, `geom.json`, `manifest.json` and `pack-report.json`. Its wire payload is 123 KB, against 142 KB for r8.
- She replaces the chibi r8 puppet on every surface that draws a teacher:
  - the lesson TeacherWindow and SpeechRow, Summary, TroubleScreen and HelpSheet;
  - Hello, Home, the Map sheet and the Teacher screen;
  - the onboarding Meet step and the landing portraits;
  - the play micro-face.
  These surfaces route through `src/ui/teacher/Teacher.tsx` → `src/face-puppet/LessonFace.tsx` → `PuppetFace.tsx` and
  `TutorFace.tsx` / `Plate2D.tsx`. The landing calls `Plate2D` directly (`src/app/landing/Site.tsx TeacherPortrait`).
- **In the lesson:**
  - **She answers fast.** Her first sound comes soon after the child stops talking (§3.3).
  - **Games are real.** When the child asks for a game, or a game would help (practice, probe, a misconception), the
    child gets a real game for the skill being taught, and it fits the phone.
  - **Her words match the screen.** Every board, explainer, animation or simulation is correct, readable at the child's
    size and named truthfully in what she says.
- **Talking with her:**
  - She keeps a natural conversation: diversions are parked and come back, a stop phrase gets one warm check-in, and
    steering is acted on.
  - Hands-free duplex goes live to the owner cohort first, then to everyone once its criteria hold.

**What is removed:**
- Every teacher choice in the child and parent flows:
  - the onboarding pick (`src/onboarding/steps/Meet.tsx`);
  - the `/c/:cid/teacher` picker (`src/avatar/picker/TeacherRoute.tsx`, `TutorPicker.tsx`);
  - the parent "change teacher" control (`src/parent/Controls.tsx`, `Pages.tsx`);
  - the Hello naming card (`src/child/teacher/TeacherNamer.tsx`). A stored custom name is still honoured. The server
    keeps the naming code, so the owner can restore the card with a one-line revert.
- Arjun and Uma from every child, parent and landing surface. Both persona sheets stay in code as **parked**.
- The r8 chibi face, once `lamp1` becomes the default.
- The flat `Plate2D` vector drawing as a fallback face for Asha. Her still poster is the fallback, because no fallback
  may ever change the face.
- Studio v2 HUD pieces on child screens unless they are certified at all three viewports. Today they are 0/1155
  certified at 360 and 378/378 were judged broken.
- Uncertified or contradicting boards.
- The "Thinking… N s" seconds counter in the dock.

**What stays as it is:**
- the app shell and screens (`src/app`, `src/child`, `src/parent`, `src/onboarding`);
- the lesson runtime (`src/lesson`), the Director, grading, the learner ledger and model, the Conductor and the reports;
- the round 3 play families;
- the whole child-safety floor: AI disclosure, Childline 1098, Tele-MANAS 14416, never deny being an AI, no
  companion register, safety by predicate, and the model distress read before anything she says;
- NEVER MANIPULATE: no points, coins, streaks, timers or locks in any game.

**In scope:**
- Games and content: the **385 class 4-7 topics** (VALUES V3.1). That is maths 141, science 69, EVS 40, English 53,
  Hindi 48 and SST 34, counted from `data/curriculum/c[4-7]-*.json`.
- Classes 1-3 and 8-9 keep everything they have, and every battery must show no regression for them.
- The single teacher applies to **every class 1-9**. Asha's persona sheet covers classes 1-4 today
  (`server/compiler/characters/asha.js`), so stream 5 must widen it.
- Permanently out of game form: the three adolescence topics (c7 ch06). That is a safety register, not a play
  register (mechanics.md §4.10). They are reported as `excluded: safety`, never counted as gaps.

**Honesty rule (VALUES-100).**
- A bar is met only when it is met in production, on the integrated tree, with the evidence named.
- No child has used any of this, so every child-dependent result is "engineering-complete, unproven on children".
- The round does **not** end on day 4. The main session relaunches a lane on the list of what it left unmet, until the
  bar is met or the only thing left is an owner decision or a real child.

### 1.1 Where we start (measured, round 3)

| value / owner item | today | 100% bar | source |
|---|---|---|---|
| first sound after the child finishes (V4.3) | p50 6,070 / p90 7,583 ms, 0/43 turns ≤ 900 | p50 ≤ 900 ms | `ms-r3fix-latency-breakdown-2026-10-10`, `ms-r3rv-silence-after-answer-2026-10-10` |
| topics with a real game (V3.1) | 47/250 maths, science, EVS (32/141, 13/69, 2/40); 0/135 languages and SST | 385/385 (minus 3 safety exclusions) | `data/play/coverage.json`, play RESULTS §1 |
| playable at the child's size (forge R2b) | 3/18 views | 18/18 | round3-forge, RESULTS.md |
| game or animation asks that end in something to do | 1/6 | 6/6 | round3-forge |
| owner-5 visual | 11/14 | 14/14 | RESULTS.md |
| request to piece on stage (V3.3) | p90 2,273 ms, n = 1 | p90 ≤ 3,000 ms, n ≥ 20 | round3-forge |
| conversation battery (V5.2) | strict 56.3%, J1 60.3% (n = 355, local); prod 39% (human-adjudicated) | ≥ 85%, every family ≥ 75% | `p5-ms-conv2-battery`, CONVERSATION-V2 |
| duplex switch criteria (V5.1) | 3 of 9 met (R1b, R2b, R7) | 9/9, then `on` | round3/duplex/CRITERIA.md |
| teacher | chibi r8 Asha for classes 1-4; flat-vector Arjun for 5-9 | one grown-up Asha, live everywhere, ≥ 4.0 judge panel | AUDIT §5 cause 1, VALUES V4.2 |
| game frame rate (proxy) | 6/16 modes ≥ 50 fps at 4× throttle | all ≥ 50 on the proxy; the device run is owner-dependent (O-R4) | play RESULTS P-O6 |

---

## 2. Step 0: the main session lands this before any stream branches (about half a day)

This replaces the Prakash "foundation". Its purpose is to make the parallel work separable and to give every session
the same instruments. Everything below is committed to `claude/blissful-mayer-icwe2j` and pushed. Streams are then cut
from that commit.

| # | what | files it creates or changes | why |
|---|---|---|---|
| S0.1 | Confirm the round 3 RC is live on taxila.dev. Record the prod baseline: `tests/prod/round3-play.mjs` P0 (`/api/play/admit` 200), `w0-smoke`, `round3-forge`, `owner-5-visual`, n = 1 per file. | `docs/design/round4/build/BASELINE.md` | "deploy for the student is broken": round 4 is measured against what students actually meet. The audit found `/api/play/*` returning 404 on prod. |
| S0.2 | Commit the round 3 review-timeline harness. It is the only instrument behind the 6,070 ms number, and it lives only in this session's scratchpad (`scratchpad/r3-review/driver.mjs`, `accounts.mjs`, `openchild.mjs`, `preload.mjs`), which cloud sessions cannot see. Make its absolute paths relative. | `tests/prod/r4-timeline/{driver,accounts,openchild,preload}.mjs` | Without it, stream 3 cannot reproduce its own baseline. See the speech-clip note under this table. |
| S0.3 | Split the shared play lists into one block per family, with no change in behaviour: build-coverage `RULES` → per-family rule files; `data/play/reactions.json` → per-family files (loader reads both); `shared/play.ts` `FAMILIES` / `MODES` and `src/play/families/index.ts` `LOGIC` one family per line. | `server/play/tools/rules/{todo-jodo,taraazu,nishana,kyun-lab}.mjs` + `index.mjs`, `data/play/reactions/*.json`, the two lists above | Four game lanes would otherwise all edit the same arrays. After the split, each lane adds only its own files and lines. `build-coverage --check` and `tests/play-*.test.mjs` must be byte-identical before and after. |
| S0.4 | The one coverage number. A reader over `data/play/coverage.json`, `server/forge3/certs/{play,catalogue}.json`, `shared/engine-topic-map.json` and `shared/engine-catalog.js` that prints, for each of the 385 topics, `game` / `interactive` / `none` / `excluded(reason)`, plus skill coverage. | `scripts/r4-coverage.mjs`, output `docs/design/round4/build/coverage.json` | Coverage is computed, never typed. Every lane reports against it, and so does the status page. |
| S0.5 | The **stage box contract**: the tray box and the play-mode world box the Desk gives a piece at 360×800, 412×915 and 1366×768, measured from the `/dev/desk` fixtures. | `docs/design/round4/build/box-contract.json` | Games and content certify against these boxes. Stream 2 owns the Desk and may grow a box, never shrink it. |
| S0.6 | One Neon branch per session (`test-r4-<stream>`), cut from the TEST branch with migrations 001-023 applied, plus a per-session `.env.local` holding only that stream's keys (§3, "keys"). | Neon and container setup only; nothing is committed | In round 3, `conductor-db` raced another stream's worker on the shared TEST branch. Per-branch databases end that. |
| S0.7 | Context: log the scope change, mark Prakash as parked, open `docs/design/round4/build/<stream>/` for each stream. | `context/inbox/r4-scope.json` (merged by main) | |
| S0.8 | Settle the Asha hand-off with the Asha agent. It delivers the pack plus any runtime changes to `src/face-puppet/runtime/*.js` as a patch with notes in `docs/design/round4/asha/integrate/`. **Stream 5 owns all integration code.** | none | Prevents two owners of `src/face-puppet`. |
| S0.9 | Announce the freeze list (§4). | this file | |

**About the S0.2 speech clip.** `speech.wav` is described in the harness as "a real child's recorded speech clip".
Commit it only if its provenance and licence allow that. Otherwise, synthesise the child's voice the way
`evals/relational-human/first-sound.mjs` does (gpt-4o-mini-tts at 1.2× pitch). Label the change and re-measure the
baseline with the new clip.

---

## 3. The streams

There are five streams, as the owner listed them. Two of them run as several sessions (lanes), because the code
separates them cleanly and one session could not reach the bar in 2-4 days:
- **Games** has four lanes, one per family group. Each family is its own directory.
- **Conversation and duplex** has two lanes. They are different subsystems with different batteries:
  `server/conversation` + `server/director` for conversation, `src/duplex` + `server/duplex` for duplex.

That makes **nine sessions**, plus the main session.

| stream | session / branch | what it delivers | biggest file areas |
|---|---|---|---|
| 1 Games | 1A `claude/r4-play-core` | play core, in-lesson play mode, the yard path; Todo-Jodo, Taraazu, Nishana (80 maths topics) | `src/play/core`, `server/play`, `shared/play.ts` |
| | 1B `claude/r4-play-maths` | new families Chalao (procedures), Niyam (rule hunt), Nazariya (perspective) (87 topics) | `src/play/families/{chalao,niyam,nazariya}` |
| | 1C `claude/r4-play-science` | Kyun-Lab labs, new family Karkhana (systems), review of the 26 "conversation by default" topics (83 topics) | `src/play/families/{kyun-lab,karkhana}` |
| | 1D `claude/r4-play-language` | English, Hindi, SST interactives (135 topics) | `src/play/families/{shabd,…}` |
| 2 Live content | `claude/r4-content` | boards, explainers, animations, simulations, Studio, the Desk tray | `server/forge3`, `server/stagecraft`, `server/studio`, `src/studio`, `src/child/lesson` |
| 3 Latency | `claude/r4-latency` | first sound, per-sentence TTS start, prefetch, echo | `server/brain/turn.js`, `server/brain/say.js`, `server/latency`, `server/voice`, `src/lesson`, `src/latency` |
| 4 Conversation + duplex | 4A `claude/r4-conversation` | battery ≥ 85%, steering, stop, diversions | `server/conversation`, `server/director`, `server/relational` |
| | 4B `claude/r4-duplex` | hands-free duplex to its switch criteria | `src/duplex`, `server/duplex` |
| 5 Asha | `claude/r4-asha` | one teacher everywhere, `lamp1` look switch then default, her register for classes 1-9 | `src/face-puppet`, `src/avatar`, `shared/tutors.js`, `server/compiler/characters` |

**Start order.**
- All nine sessions start right after Step 0.
- Stream 5 lands its single-teacher change first (target: end of day 1), because that change moves the conversation
  numbers. 4A takes its final measurement on the tree after stream 5.
- Stream 5's `lamp1` live-face part lands when the pack is final. RIG-NOTES estimates 1-1.5 agent-weeks after the new
  front, but layers are already arriving.

**Common to every session:**
- **Gates:** `npx tsc -b && npx vite build && npm test` on its own Neon branch. The full suite is 2,591 tests and takes
  about 22 minutes.
- **Prompt budget:** `node scripts/check-prompt-budget.mjs` (worst case today 1,696 / 2,600).
- **lint-ui:** `node scripts/lint-ui.mjs --json` may not add a finding. The baseline is 353 findings, kept by owner
  decision. Every file the stream owns must be at 0 or at its baseline.
- **Screenshots:** for anything on screen, Playwright with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` at 360×800,
  412×915 and 1366×768. Checks: 0 horizontal overflow, text ≥ 14 px (≥ 16 for classes 4-5, numerals ≥ 18), targets
  ≥ 44 px, 0 clipped labels, 0 page errors.
- **Local production build:** `node server/serve.mjs` + `server/worker.mjs`, `NODE_ENV=production`, its own Neon
  branch, prod model routing (`DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning`, `TAXILA_CLASSIFY_HEDGE_MS=1500`). The
  stream's `tests/prod/*` files run against this build.
- **Baseline:** before changing anything, the session re-runs its own baseline on the untouched base and records it.
  Every "after" number uses the same harness and the same n.
- **Honesty:** a number from simulation, adult speech or a model judge is labelled as such every time.

### 3.1 Stream 1: GAMES / PLAY for students (lanes 1A-1D)

**Goal.** Every in-scope topic gets a real game or interactive:
- it exercises the skill being taught;
- it renders correctly at 360, 412 and 1366;
- it is offered when the child asks and when it helps;
- her words match what is on screen.

**What "covered" means: the topic certificate.** It is computed by `scripts/r4-coverage.mjs` and is never typed. A
topic is covered only when at least one piece passes C1-C10 for at least one of its kit skills:

| # | check | instrument |
|---|---|---|
| C1 | Admitted by a skill of the topic, never by a topic tag (`dec-r3fix-play-admission-by-skill`) | `node server/play/tools/build-coverage.mjs --check` |
| C2 | Law, solver and shortcut-free levels (P-O1, P-O3). Generator CPU p95 ≤ 50 ms (P-O2). | `tests/play-logic.test.mjs`, `tests/play-server.test.mjs` |
| C3 | Grading truth: 0 wrong grades over ≥ 2,000 random acts per mode; forged, tampered and replayed acts refused (P-O4) | same |
| C4 | Fit at the stage box contract (S0.5) at all three viewports, for every art pack and both class bands: text ≥ 14 / 16 px, targets ≥ 44 px, 0 overflow, 0 clipped labels | `server/forge3/play-cert.js` → `server/forge3/certs/play.json`; `docs/design/round3/play/harness/shots.mjs` |
| C5 | The act is the idea: at least 80% of graded acts are manipulations, not a pick from a list (`r3g-idea-is-the-controller`). No quiz in costume (V3.2). | the logic's act log; RUBRIC B3/B4 atomic checks from two judge families (advisory) |
| C6 | Words: 0 verdict words, 0 unrevealed keys, 0 floor violations in the reaction bank; a seam turn says only what is in the PLAY facts row | `tests/play-react.test.mjs`; a meaning scan of seam turns |
| C7 | Evidence: signed, folds into the ledger as `via: "game"`, never counts as a delayed check; a forged token folds nothing | `tests/play-evidence.test.mjs`, `tests/play-ledger-seam.test.mjs` |
| C8 | No reward economy: no points, coins, streaks, timers or locks (B6) | `tests/play-style-lint.test.mjs` |
| C9 | Reachable: on the local production build, a scripted lesson on the topic gets the game both when asked ("game khelna hai") and at a practice beat, through the server grade and into the ledger | the `tests/prod/round3-play.mjs` P8 loop, extended per family |
| C10 | Frame rate reported (≥ 50 fps median at 4× throttle on the proxy). The phone run stays owner-dependent (O-R4). | the harness `--fps` mode |

The coverage report also prints **skill coverage**: admitted skills out of the topic's game-able kit skills. The game
is offered only on an admitted skill. Otherwise she draws on the board (compose ladder).

**How the lanes divide.** The primary family for each topic comes from mechanics.md Appendix A. It was one rater's
assignment and has not been validated, so a lane may move a topic with a reason.

| lane | owns (may edit) | topics, primary | expected by day 4 [estimate] |
|---|---|---|---|
| 1A core | `src/play/core/**`, `src/play/{PlaySession,PlayStage,PlayStudioRenderer}.tsx`, `src/play/{client,copy,lessonBridge,lessonLang}.ts`, `src/play/world/**`, `src/play/dev/**`, `src/play/families/{todo-jodo,taraazu,nishana}/**`, `src/play/families/views.ts`, `shared/play.ts`, `server/play/**` (except other lanes' rule files), `server/forge3/play-cert.js`, `server/forge3/certs/play.json`, `data/play/reactions/{todo-jodo,taraazu,nishana}.json`, `docs/design/round3/play/harness/**`, `tests/play-*.test.mjs`, `tests/prod/round3-play.mjs` | F1 Todo-Jodo 49, F2 Taraazu 15, F3 Nishana 16 (80 maths). New modes the families already imply: decimals, integers and fractions on the line; ratio; regroup-add; multi-bag equations. | most of the 80, plus the core fixes: fps on 10/16 short modes, a play kill switch `TAXILA_PLAY=off` (compose admits nothing), the yard path |
| 1B maths | `src/play/families/{chalao,niyam,nazariya}/**`, `server/play/tools/rules/{chalao,niyam,nazariya}.mjs`, `data/play/reactions/{chalao,niyam,nazariya}.json`, `tests/play-{chalao,niyam,nazariya}*.test.mjs` | F4 Chalao 44 (multi-step procedures: long division, column multiplication, conversion chains), F5 Niyam 15 (patterns, data), F8 Nazariya 28 (shapes, symmetry, views, angles, area, perimeter, including its EVS and science topics) | 2-3 families, 2-3 modes each, about 40-60 topics |
| 1C science | `src/play/families/{kyun-lab,karkhana}/**`, `server/play/tools/rules/{kyun-lab,karkhana}.mjs`, `data/play/reactions/{kyun-lab,karkhana}.json`, `tests/play-{lab,karkhana}*.test.mjs` | F6 Kyun-Lab 37 (12 labs exist, 13 topics covered), F7 Karkhana 20 (flows and stations: digestion, circulation, water, circuits), and a per-topic decision for the 26 "conversation by default" EVS and science topics (four borderline ones per §4.10) | about 50-70 |
| 1D language and SST | `src/play/families/<its new ids>/**`, its rule and reaction files, its tests, `docs/design/round4/build/play-language/DESIGN.md` | English 53, Hindi 48, SST 34. No design exists yet ("Not covered here", §4.10). Day 0.5: a design note mapping each topic's kit skills to the round 3 forms (sort-by-rule, order, build-a-sentence, spot-the-slip) over representations (token-strip, timeline, map-grid, set), every word from the kit's verified text. Then build. | about 40-70. The main session may split it into language and SST lanes after the design note. |

**May read, not edit:**
- `src/child/lesson/**` (stream 2);
- `server/forge3/compose.js` (stream 2): `admitPlay` reads 1A's `entryFor` and the coverage file;
- `server/director/**` (4A);
- `data/kits/**`, `data/curriculum/**`;
- `src/studio/renderers.ts` (stream 2).

**Interfaces:**
- **1A provides:**
  - `entryFor({ skillId, topicId })` and the coverage file (consumed by `server/forge3/compose.js admitPlay`);
  - `PlayStudioRenderer` (consumed by `src/studio/renderers.ts`);
  - signed tokens → `lessonBridge` → module events → `POST /api/lesson/turn`;
  - `playFactsRow` (consumed by the Director).
- **1A consumes** the box contract (S0.5) and the Desk play mode (`src/child/lesson/deskLayout.ts` `play`, `Desk.tsx`
  `playMode`, owned by stream 2). A change there is a patch request.
- **1B-1D consume** 1A's core API exactly as it is on the base: `FamilyLogic`, `Painter`, `stage.ts`, `juice.ts`,
  `sound.ts`, `voice.ts`. A missing helper is built inside the lane's own family directory. A core change is a patch
  request.

**The yard path (1A).** A game outside a lesson must fold evidence through the same signed-evidence path. It writes no
new kind of ledger row. It goes in 1A's existing `server/play/routes.js` table, so `server/index.js` is untouched.
Build it only if the owner keeps a standalone practice entry. Today, practice is a practice-variant lesson.

**Keys (least privilege):**
- Azure OpenAI or Foundry for the lesson stack the C9 loop needs: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`,
  `DEPLOY_FAST`, `DEPLOY_BRAIN`, `DEPLOY_CLASSIFY`, `DEPLOY_REPLY`, `DEPLOY_TRANSCRIBE`. Reaction banks are written by
  one guarded `taxila-fast` call per bank, off the turn path.
- Judges (advisory): `taxila-brain` + grok.
- Speech for the seam turn's voice in C9: `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION`, or the CENTRALINDIA pair mapped
  at launch (`o-integ-local-speech-env`).
- A test `TAXILA_PLAY_KEY` (never the production one) and the lane's own Neon branch.
- No image deployment: games are drawn in code. No storage.

**Gates:** the common gates, C1-C10, and `round3-play` at 93/93 or better on the lane's tree.

**Acceptance (lane merge):**
- Every topic the lane claims passes C1-C10 in `scripts/r4-coverage.mjs`.
- 0 regressions in existing modes.
- Shots for every mode at all three viewports, under `docs/design/round4/build/<lane>/shots/`.
- Round bar: covered topics = 385 minus the 3 safety exclusions. Any other topic left uncovered goes to the owner as a
  named list with a reason. It never silently counts as covered.

### 3.2 Stream 2: LIVE CONTENT (boards, explainers, animations, simulations, Studio, the Desk tray)

**Goal:**
- Nothing nonsense and nothing broken on screen.
- Her words point only at what is actually shown.
- A request becomes a piece fast.
- Game, animation and simulation asks end in something the child can **do**.

**Owns (may edit):**
- server: `server/forge/**`, `server/forge3/**` (except `play-cert.js` and `certs/play.json`, which are 1A's),
  `server/stagecraft/**`, `server/studio/**`, `server/routes/{studio,forge,modules}.js`,
  `server/director/{modules,engine-check,units}.js`;
- shared: `shared/{studio.ts,studio-spec.ts,studio-spec-ext/**,stagecraft.ts,forge.ts,whiteboard.js,whiteboard.d.ts,engine-catalog.js,engine-topic-map.json}`;
- client: `src/studio/**`, `src/stagecraft/**`, `src/studio-v2/**`, `src/modules/**` (the frame engines and the
  whiteboard), **`src/child/lesson/**` (the Desk: tray, stage, board, dock, layout)**, `src/ui/copy.ts` (Desk copy);
- data: `data/studio-catalogue/**`;
- tests: `tests/{studio-,stagecraft-,forge-,engines-,engine-catalog,module-,w2b-,whiteboard-,round3-forge-,director-mounts,units-guard,ui-v2-deskLayout}*`;
- prod harnesses: `tests/prod/{round3-forge,owner-5-visual,w2h-studio,w2f-studio-gate,w2b-explain-rungs,w2b-first-paint,p4-content-*,w1b-*}.mjs`.

**May read, not edit:** `src/play/**`, `server/play/**` (1A), `server/brain/**` (3), the rest of `server/director/**`
(4A), `src/lesson/**` (3), `src/face-puppet/**` (5).

**Interfaces:**
- **Provides:**
  - the stage box contract (S0.5; grow, never shrink);
  - the compose ladder (`admitPlay` order, `INTERACTIVE_ASKS`, `INTERACTIVE_NEEDS`);
  - the single certificate gate;
  - the Desk's play mode, for 1A's patch requests;
  - the screen facts the reply guards read (`screenProblem`, `screenContradiction`).
- **Consumes:** 1A's `entryFor`, the coverage file and the play certificates; 4A's Director needs; 5's
  `<Teacher>` face (unchanged props).

**Work, in order:**
1. **One gate.** Write a test that lists every path that can put pixels in the tray and proves each one passes the
   forge3 certificate at the device's viewport class before reveal:
   - Studio slot (`/api/studio/slot` and the SSE stream);
   - stagecraft reveal;
   - Director module mount (`modules.js mountable`);
   - forge-g2 "made for you";
   - explainer fill;
   - whiteboard;
   - play.

   The test fails if a path is added without the gate.
2. **Studio v2.** Retire it from the child path unless certified. A piece the owner wants back is fixed until it passes
   C4-equivalent floors at all three viewports. Then it counts as an interactive in `scripts/r4-coverage.mjs`.
3. **Boards.** Her line matches the board (board-sync W-checks, `board-legible`): 0 contradictions on ≥ 50 boards in the
   battery. The board-fallback stays gated (`rj-ship5-board-fallback-ungated`). Fix the measure engine's tick labels at
   360. The hand font: the frame CSP allows no web fonts, so measure before changing it.
3. **Animation and simulation asks.** Answer with something that moves and is correct: a play level, the whiteboard
   player drawing on the clause, or a certified explainer. Never a static board under an "animation" label. Build the
   "half ka half" content (B8b).
4. **Speed.** Request to piece on stage within 3 s p90, n ≥ 20 (V3.3), using prefetch planned by skill
   (`forge-g1-prefetch-planned`).
5. **Owner-5.** The two failing Studio slots that never became an artifact.
6. **V3.3 at scale:** right-artifact-ready ≥ 90%, stale or wrong reveals 0, visible failures 0 over EXP-30 + 200
   simulated lessons, and at least one visual every 3 minutes of teaching.

**Keys:**
- the lesson stack (as in 1A);
- `DEPLOY_CODEX` / `DEPLOY_STAGECRAFT_SPEC` where the builds use them;
- `DEPLOY_IMAGE` only if a picture ask is in the battery;
- storage: a SAS for one **test** container (for example `forge-test-r4`), never the account key or a production
  container;
- its own Neon branch;
- the forge3 QA service runs locally (`server/forge3/qa-service.mjs`). Its deploy (`scripts/deploy-studio-qa.mjs`)
  belongs to the main session.

**Acceptance:**

| check | bar |
|---|---|
| round3-forge R1 (real on stage) | 12/12 |
| R2 (interactive asks end in something to do) | 6/6 |
| R2b (playable at the child's size) | 18/18 (≥ 15/18 is the honest in-round expectation) |
| R3 (nonsense boards) | 0 |
| R4 (views pass at all three sizes) | 3/3 for every case |
| owner-5 | 14/14 |
| p4 board lateness | p90 ≤ 1,500 ms |

Plus: 0 uncertified mounts in every battery, and shots of every artifact kind at all three viewports.

### 3.3 Stream 3: LATENCY (first sound ≤ 900 ms p50 after the child finishes)

**Goal:** VALUES V4.3. Measure on the page clock, from the end of the child's speech to the first audible sound of
her reply, and separately to the echo, split by talk mode (`dec-r3rv-silence-metric-end-to-end`).

**Owns (may edit):**
- server: `server/brain/turn.js`, `server/brain/say.js`, `server/brain/arith.js`, `server/latency/**`,
  `server/voice/**` (prewarm, speech, `azureTts*`, sentences, stt, expressive, `realtimeSession.js`; the `lane` routes
  stay registered last), `server/routes/{voice,tts}.js`;
- client: `src/lesson/**` (runtime, cascadeLink, ttsStream, voiceLink, turnModel, vad, realtime, floor), `src/latency/**`;
- evals: `evals/latency/**`, `evals/relational-human/{first-sound,ack-leak}.mjs`, `evals/cascade-latency.mjs`;
- tests: `tests/{latency-,voice-cascade,voice-latency,voice-player-clock,round3-relational-human-ack,w2d-voice-lanes,brain-turn,client-runtime}*`;
- prod harnesses: `tests/prod/r4-timeline/**` (S0.2), `tests/prod/{round2-latency,w2d-voice-lanes,w2g-voice}.mjs`.

**May read, not edit:**
- `server/director/**` and `server/conversation/**` (4A): the guards `say.js` calls;
- `server/director/safety.js` (frozen);
- `src/duplex/**` (4B);
- `src/child/lesson/**` (2): the dock counter change is a patch request.

**What `context/rejected.md` already rules out (read before building):**
- `reply-streaming-no-gain`: streaming the reply model alone gains at most about 37-140 ms. The first content delta
  already holds a full sentence. TTS first byte does not depend on input length (262 vs 260 ms).
- `tts-first-clause-no-gain`: same finding for the first clause.
- `v4-rj-words-with-visemes-part0`: asking for word events on part 0 adds about 480 ms. Keep part 0 visemes-only.
- `rj-r3rh-token-ack-before-distress`: **nothing she says may precede the model distress read.** This is a hard
  child-safety rule.
- `rj-r3rh-floor-only-ack-timing`: the echo is decided at a fixed instant, to keep verdict timing neutral.
- `rj-static-filler-list`: no stock fillers.
- `decision voice-turn-config`: 600 ms of VAD silence cut children off; 900 ms did not.
- Implication: "stream the first sentence" pays off only where it takes the guard, rewrite and commit chain off the
  path. It does not pay off on the reply model.

**Where the 6,070 ms goes** (round 3 timeline, n = 48-50):

| step | p50 |
|---|---|
| end of speech → commit | 1,037 ms |
| → final transcript | 1,792 ms |
| → turn POST | 1,844 ms |
| turn duration | 3,050 ms (p90 4,791) |
| → TTS request | 5,163 ms |
| → audible | 6,070 ms |

**Work, in order:**
1. Reproduce the baseline with `tests/prod/r4-timeline` (n ≥ 48, within ±15% of 6,070 ms).
2. Commit a per-stage turn trace: classify, note, plan, reply first and last token, each guard, rewrite, commit,
   prewarm first byte, client receive, playback start.
3. **L1 levers:**
   - `TAXILA_TURN_PREFETCH=on`. Measured turn p50 3,614 → 2,521 ms. Check the +62% model calls against quota
     (`dec-r3rh-prefetch-on`).
   - Raise speculative-reply adoption on the stable partial.
   - Run the note in parallel on non-answers (`TAXILA_NOTE_PARALLEL`; it was 1 in 8 useful, so re-measure).
   - **Per-sentence safety:**
     - Sentence 1 starts TTS once it passes every per-sentence guard: `floorViolations`, `revealsAnswer`,
       `scrubPii`, `arithmeticSlip`, `praiseProblem`, screen references, script and register.
     - Whole-reply guards (`askParity`, `endOnAsk`, length, drift, wrap) may change only later sentences. If one of
       them would rewrite sentence 1, that turn falls back to today's path.
     - Safeguard turns never stream.
     - Behind `TAXILA_TTS_FIRST_SENTENCE` (default off).
   - The client opens the audio stream for the expected seq together with the turn POST. This removes the
     response → request hop (~270 ms) and the TLS setup.
   - Keep the DragonHD WebSocket pool warm (`TAXILA_DHD_WS_POOL`).
   - Remove the dock's seconds counter (patch to stream 2). The face carries the wait (`rj-symbolic-wait-indicator`).
4. **L2, the echo on graded answers.** Lower the fixed instant (`TAXILA_ACK_AT_MS`, today 1,200 ms) only as far as
   `evals/relational-human/ack-leak.mjs` allows: AUC(right decided sooner) ≤ 0.65 and P(echo|right) − P(echo|wrong)
   ≤ 0.15, at n ≥ 40 graded.
5. **L3, the 900 ms bar.** Build it **in shadow only.** It logs "would have sounded at X ms" and changes no behaviour.
   It needs two inputs this stream does not own:
   - an end of turn at ≤ 400 ms, from 4B's word-aware EOT meeting R1;
   - a distress read that finishes within about 300 ms of the stable partial: code predicate plus a fast model pass,
     measured for recall on the safety batteries.

   The main session takes the resulting numbers to an owner and safety decision.

**Honest budget.**
- Under today's safety rule and server VAD, the best echo is about speech end + 0.6 s (stable partial or eager EOT)
  + the fixed instant + clip start, which comes to about 1.5-1.9 s.
- The full reply cannot reach 900 ms: classify about 0.5-0.6 s, plus the reply model, plus TTS about 0.43 s, all after
  the commit.
- So **p50 ≤ 900 ms is not reachable in round 4 without the L3 decisions.** The plan does not claim it.

**Keys:**
- the lesson stack: `AZURE_OPENAI_*`, `DEPLOY_CLASSIFY`, `DEPLOY_FAST`, `DEPLOY_REPLY`, `DEPLOY_BRAIN`,
  `DEPLOY_TRANSCRIBE`, `DEPLOY_TTS`;
- Speech (Diya DragonHD): `AZURE_SPEECH_*` and `_SIN`;
- the India lane endpoints (`AZURE_AI_CENTRALINDIA_*`, `AZURE_AI_SOUTHINDIA_*`, `AZURE_OPENAI_*_SIN`), for lane
  comparisons only. They are measured from a US container and labelled that way;
- its own Neon branch.

**Acceptance (merge):**

| check | bar |
|---|---|
| reply first audible (same harness, same n) | p50 ≤ 3,000 ms and p90 ≤ 4,500 ms (from 6,070 / 7,583) |
| echo on graded answers | p50 ≤ 1,500 ms, ack-leak bars held |
| safety | 0 safety regressions (`w2i-safety` 39/39, adversarial 13/13 blocking, persona invariants 70/70) |
| conversation | no conversation-battery regression |
| L3 | shadow numbers reported |

The V4.3 bar (≤ 900 ms) is reported as **not met** unless it is measured met.

### 3.4 Stream 4: CONVERSATION, TWO-WAY and DUPLEX (lanes 4A, 4B)

**4A Conversation.**

**Goal:** VALUES V5.2-V5.3.
- the CONVERSATION-V2 battery at ≥ 85% (345 cases), with every family ≥ 75%;
- diversions parked and returned: 100%;
- a stop phrase gets one warm check-in: 100%;
- steering acted on: ≥ 90%;
- owner-truth harnesses green.

**Owns (may edit):**
- `server/conversation/**`;
- `server/director/**` except `modules.js`, `engine-check.js` and `units.js` (stream 2) and `safety.js` (frozen;
  changes only as a patch with a safety review);
- `server/relational/**`, `server/persona/**`;
- `server/brain/{kernel,propose,moment,beat,reasons,rows,trace,relational-adapter}.js`;
- `server/compiler/{compile,instructions,gates}.js` (`floor.js` is frozen; `characters/**` is stream 5's);
- `evals/conversation-{v2,r2,r3}/**`, `evals/director-sim.mjs`;
- `docs/design/round3/adversarial/**`;
- tests: `tests/{round2-conversation,round3-conversation,p5-interaction-,w2c-,relational-,owner-requests,classify,never-rules,leak-paraphrase}*`;
- prod harnesses: `tests/prod/{owner-2-no-confusion,owner-3-ending,owner-4-steering,round3-conversation,round3-relational-human,round2-conversation,p5-interaction-acceptance}.mjs`.

**Reads:** `server/brain/say.js` and `turn.js` (3). A new guard call there is a patch request, which stream 3 or the
main session applies.

**Weakest families to start from** (work-2, strict):

| family | strict pass |
|---|---|
| G | 22.7% |
| D | 45.2% |
| A | 54.0% |
| C | 58.4% |
| E | 65.6% |
| F | 76.5% |
| B | 80.0% |

Weakest intents: animation 0/5, answer_partial 0/4. Also owner-2 R7.defer ("wapas aate hain" after an honest answer;
10/12 today).

**Rules:**
- "Sentence-shaped prompt text gets recited." Write shapes and notes, never lines.
- "Position is mechanism." A rule that must fire goes LAST.
- Judges are advisory. The official number needs the human read of disputes, the same method as prod's 39%. The owner
  or a named human adjudicates.
- N1 conflicts with the owner-3 goodbye rule. It needs an owner decision, not a code change.

**Keys:** the lesson stack plus the two judge deployments (J1 gpt-6-sol, J2 gpt-6-luna); its own Neon branch.

**Acceptance (merge):**

| check | bar |
|---|---|
| battery | ≥ 85% strict, two judges, every family ≥ 75% (the honest in-round expectation is about 70-75%; the main session relaunches on the failing families) |
| owner-2 | 12/12 |
| owner-3 | 48/48 |
| owner-4 | 17/17 |
| round3-conversation | 27/27 |
| round3-relational-human | 29/29 |
| adversarial | 23/23 (or N1 decided) |
| persona invariants | 70/70 |
| check-prompt-budget | PASS |
| `w2i-safety` | 39/39 |

**4B Duplex (two-way, hands-free).**

**Goal:** the round 2 switch criteria, scored by `evals/duplex-r3/criteria.mjs` on the same recorded events:

| id | criterion | bar | today |
|---|---|---|---|
| R1 | thinking-pause cut-offs | ≤ 3% and ≤ silence-900 | 4.1% (MAI) / 4.8% (D4) |
| R2 | decision gap p50, India lane | ≤ 350 ms | 1,011 ms |
| R3 | keeps talking through continuers | ≥ 90% | 79.0% |
| R4 | stops within 200 ms on real barge-ins | ≥ 50% | 47.1% (two short) |
| R5 | false yields to other voices | ≤ 10% | 13.4% |
| R6 | self-yields on her own bleed | ≤ 2% | 13.8% |
| R1b, R2b, R7 | | | met |

Then the switch: `TAXILA_DUPLEX=shadow` with the owner cohort (`TAXILA_DUPLEX_LIVE_FOR`), then `on` once all nine
criteria hold on real speech.

**Owns (may edit):**
- `src/duplex/**`, `server/duplex/**`;
- `evals/duplex*/**`, `evals/p1-duplex/**`;
- tests: `tests/{duplex-,round3-duplex-,p1-duplex-,ship5-fix-duplex-revoke,ship5-review-duplex-safety}*`;
- prod harnesses: `tests/prod/{round3-duplex,p1-duplex-acceptance,round2-duplex-real}.mjs`.

**Reads:** `src/lesson/cascadeLink.ts` (3). The link owns the call, the mic and the player; `CascadeDuplex` owns the
engine. A seam change is a patch request.

**Interfaces:**
- **Provides** to stream 3 the eager end of turn (`hint.eager` → `src/latency/duplexTurn.ts`, already wired) and an
  R1-qualified EOT for L3.
- **Consumes** the `scanSafety` and partial-safety floor, unchanged. `safetyPending` only ever adds a safeguard.

**Honest scope.**
- R5 and R6 need a target-speaker model (X3), which is research-sized. Expect R1, R3 and R4 in-round.
- R2 needs the India lane measured from India (open-duplex-gap-at-ear).

**Keys:**
- the replay suites are offline and need none;
- live runs need `DEPLOY_TRANSCRIBE` (taxila-live-transcribe), the MAI India endpoint if it is used, and
  `AZURE_SPEECH_*`;
- its own Neon branch.

**Acceptance (merge):** every criterion re-scored before and after, on TRAIN and TEST splits. No turn may get worse
(0 → 1 cut-off changes = 0). R7 stays green. The cohort works from the owner's phone on the local build.

### 3.5 Stream 5: ASHA INTEGRATION (one teacher, the grown-up face)

**Goal:**
- one teacher, Asha, on every surface for every class 1-9;
- the `lamp1` pack behind a look switch, then made the default;
- her register suits classes 1-9;
- every teacher choice removed.

**Owns (may edit):**
- the face: `src/face-puppet/**` (including `runtime/` once the Asha agent's runtime patch is handed over, S0.8),
  `src/avatar/**` (`TutorFace`, `Plate2D`, picker, looks), `src/ui/teacher/**`, `src/ui/TeacherFace.tsx`,
  `src/stage/**`, `public/face-puppet/**` (a new `public/face-puppet/lamp1/`, copied from
  `art/character/puppet2d/lamp1/` plus the rendered `rest-medium.webp`, `rest-close.webp` and `nape.webp`);
- the teacher on child and onboarding screens: `src/child/teacher/**`, `src/child/screens/{Hello,Teacher}.tsx`,
  `src/child/routes.tsx` (only to retire `/teacher`), `src/child/copy.ts`, `src/child/voice.ts`,
  `src/onboarding/steps/{Meet,Class}.tsx`, `src/onboarding/index.tsx` (the step list), `src/onboarding/Setup.tsx`
  (the teacher parts);
- the parent corner: `src/parent/{Controls,Pages}.tsx` (the teacher rows only), `src/parent/copy.ts`;
- the landing: `src/app/landing/{Site,Landing}.tsx` (`TeacherPortrait`, `SITE_TUTORS`);
- shared and server: `shared/tutors.js`, `shared/tutors.d.ts`, `server/compiler/characters/**`,
  `server/routes/tutor.js`, `server/face-puppet/**`;
- evals: `evals/face-puppet/**`, `evals/p2-face/**`, `evals/teacher-names.data.mjs`;
- tests: `tests/{avatar-,teacher-name,p2-face-,tutor-db-e2e,e2e-design-b2,e2e-design-b3-parent,lesson-safety-naming}*`;
- prod harnesses: `tests/prod/{p2-face-acceptance,w1f-face}.mjs`.

**Work:**
1. **Single teacher (lands first, by the end of day 1).**
   - `teacherFor` serves `asha` for every class. Arjun and Uma are status `parked` in `shared/tutors.js`.
     `GET /api/tutors` → `[asha]`. `POST /api/tutors/choose` accepts only `asha`.
   - Open lessons keep their pinned teacher until they end (`teacherForLesson`). There is no migration, and
     `child.teacher_id` stays as it is.
   - Runtime flag `TAXILA_SINGLE_TEACHER`, default on, so it can be rolled back.
   - Remove every teacher choice from the UI (§1).
   - Asha's sheet `classes: [1, 4]` → `[1, 9]`. Add band notes for classes 5-9, drawn from Arjun's competence notes
     ("competence before warmth", "diagnose what they tried"). The class 5-9 protégé is not a baby elephant; it is a
     "pretend new student who missed this class".
   - Gates: `node scripts/verify-release.mjs --persona-change <candidate.json>` (the talk gate: it runs director-sim
     lessons), persona invariants, check-prompt-budget, and the conversation and owner batteries showing no regression
     against the same harness run on the base.
2. **The look switch.**
   - `PuppetLook = "r8" | "lamp1"`, with `PUPPET_BASE`, `PUPPET_CLEAR`, `PUPPET_VIEW` and the posters keyed per look
     (`src/face-puppet/assets.ts` today hard-codes `r8` and the cream clear colour).
   - The server reports `look` in `GET /api/face/config` (`TAXILA_FACE_LOOK`). The client override is `?look=`, the
     same pattern as `?puppet=`.
   - The Asha fallback on tiers D and E, and after a failure, is the `lamp1` still. It is never `Plate2D`'s vector.
3. **Integrate `lamp1` when the pack is final.**
   - rest posters rendered by `node evals/face-puppet/run.mjs poster`;
   - judged blinks, gaze, listening tilt, thinking aversion, and lip-sync from Diya's visemes;
   - the governor unchanged;
   - payload no larger than r8's 142 KB.
4. **Tests.** Other streams' test files that use Arjun as a fixture are changed only as `[patch-request]` commits. They
   are applied by the main session when stream 5 merges, before any other merge.

**Keys:**
- `AZURE_SPEECH_*` (Diya visemes for `p2-face`);
- the lesson stack and director-sim for the talk gate;
- its own Neon branch;
- no image deployment. The pack comes from the Asha agent, and posters are rendered locally.

**Acceptance (merge):**
- A scan test proves that no child, parent, onboarding or landing surface offers a teacher choice or names Arjun or
  Uma.
- Every class 1-9 test child's next lesson is with Asha (Diya's voice).
- `p2-face` acceptance 31/31 on `lamp1`.
- Shots of every face surface at all three viewports.
- Judge panel ≥ 4.0 (the owner's ship bar, V4.2).
- The `dc-r4-face-lamplight-flat` reversal checks: a blind "childish" rating ≤ 1/5, and "reads premium" at the
  lesson's real slots (TeacherWindow, SpeechRow 80 px, the play micro-face).
- Owner sign-off before `lamp1` becomes the default.

---

## 4. Shared-file conflict map

**Ownership rules:**
1. **One owner per file.** The owner's version wins at merge.
2. **Changing a file you do not own.** Write a patch request: `docs/design/round4/build/<stream>/patches/NN-<slug>.diff`
   plus a line in that folder's `APPLY.md` with why and which test proves it. To test it, a stream may apply it on its
   own branch, but only as a separate commit whose subject starts with `[patch-request]`. The main session drops and
   re-applies those commits at merge, in the order of §5.
3. **Generated files are never hand-merged.** `data/play/coverage.json`, `server/forge3/certs/*.json` and
   `docs/design/round4/build/coverage.json` are regenerated from the merged sources.
4. **Allowed hand-merges.** The only ones are the one-family-per-line lists from S0.3, and the `// r4-<stream>` blocks
   in `shared/contracts.ts`. The main session keeps every stream's lines.

| file | who wants it | rule |
|---|---|---|
| `server/index.js` (route register) | 1A, 2, 3, 4B | **main only.** Add routes to your existing table (`server/play/routes.js`, `server/routes/studio.js`, `server/latency/routes.js`, `server/duplex/routes.js`). A new module is a patch. `...lane` stays the LAST spread (`tests/round3-integration.test.mjs`). |
| `server/router.js`, `server/routes/account.js`, `server/routes/lesson.js`, `server/routes/child.js`, `server/routes/parent.js` | 3, 4A, 5 | **main only** (patch). Stream 5's single teacher is done inside `server/compiler/characters/index.js` and `shared/tutors.js`, not in the routes. |
| `shared/contracts.ts` | 2, 3, 4A, 4B | Additive optional fields only, in a `// r4-<stream>` block at the end of the interface. `TurnRequest` / `TurnResponse` / `TtsRequest` / `VoiceUtterance`: 3, 4A, 4B blocks. `UiDirectives` / `TeacherCard`: 2, 4A blocks. Everything else is a patch. |
| `shared/play.ts` | 1A-1D | 1A owns. Each lane adds only its own `FAMILIES` / `MODES` lines (S0.3). Any other change is a patch to 1A via main. |
| `src/play/families/index.ts` (`LOGIC`) | 1A-1D | one import and one block per family. Each lane adds only its own. |
| `server/play/tools/build-coverage.mjs` | 1A-1D | 1A owns the tool. Lanes edit only `server/play/tools/rules/<family>.mjs`. |
| `server/forge3/compose.js` (`admitPlay`, the ladder) | 1A, 2 | **2 owns.** 1A owns `entryFor` and the coverage file. Ladder changes are a patch to 2. |
| `src/child/lesson/**` (Desk, deskLayout, WorkTray, AnswerDock, useDesk, TeacherWindow) | 1A (play mode), 2, 3 (dock counter), 4B (hands-free cues), 5 (face slot) | **2 owns.** The others send patches. Stream 5 needs no Desk edit: the face changes inside `<Teacher>`. |
| `src/studio/renderers.ts` | 1A, 2 | 2 owns. |
| `src/lesson/cascadeLink.ts` | 3, 4B | **3 owns.** `src/duplex/cascadeDuplex.ts` is 4B's. Seam changes are patches. |
| `server/brain/say.js`, `server/brain/turn.js` | 3, 4A, 2 | **3 owns.** 4A's guards live in `server/conversation/guards.js` and `server/director/say.js`, which 4A owns. 2's screen guards live in `server/director/modules.js`. A new call site in `brain/say.js` is a patch, applied after 3. |
| `server/director/classify.js`, `requests.js`, `state.js`, `shapes.js` | 4A, 3, 2 | 4A owns. |
| `server/director/safety.js`, `server/compiler/floor.js`, `src/lesson/safetyStrings.ts` | anyone | **frozen.** Safety-floor changes are a patch plus a safety review by the main session, and need `w2i-safety`, adversarial and persona invariants green. |
| `server/compiler/characters/**` | 5, 4A | 5 owns. 4A owns `compile.js`, `instructions.js` and `gates.js`. Both run check-prompt-budget. The main session re-runs it on the merged tree. |
| copy: `src/child/copy.ts`, `src/ui/copy.ts`, `src/copy/en.ts`, `src/parent/copy.ts`, `src/avatar/picker/copy.ts`, `src/play/copy.ts` | 5, 2, 1A | `child/copy.ts`, `parent/copy.ts` and `avatar/picker/copy.ts`: 5. `ui/copy.ts` and `copy/en.ts`: 2. `play/copy.ts`: 1A. |
| CSS tokens: `src/styles/tokens.css`, `src/play/core/styles.ts` | 2, 1A, 5 | `tokens.css`: frozen (main). Play art packs (`styles.ts`): 1A. A new colour elsewhere is a patch. lint L-HEX applies. |
| `src/child/routes.tsx`, `src/app/routes.tsx` | 5 | 5 owns `child/routes.tsx` this round (to retire `/teacher`). `app/routes.tsx` is main only. |
| `scripts/lint-ui.mjs`, `scripts/check-prompt-budget.mjs`, `scripts/verify-release.mjs`, `scripts/deploy-*.mjs`, `scripts/migrate.mjs` | anyone | **main only.** No stream runs a deploy script. |
| `db/migrations/**` | anyone | **main only.** None is expected. A needed migration is a patch, and the main session assigns the number. |
| `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `modules.html`, `server/serve.mjs`, `Dockerfile*`, `.github/**` | anyone | **main only** (patch with a reason). No new dependency without the owner's directive check (Azure-only). |
| `tests/*.test.mjs` | all | New files: `tests/r4-<stream>-*.test.mjs`. Existing files: the owner of the code under test (lists in §3). Anything else is a patch. |
| `tests/prod/*.mjs`, `tests/prod/lib.mjs`, `_owner.mjs` | all | New files: `tests/prod/r4-<stream>-*.mjs`. The shared libraries are main only. |
| `context/*.md`, `context/graph.json` | all | **main only.** Each stream writes only `context/inbox/r4-<stream>.json`. |
| `docs/design/round4/build/<stream>/**` | each | owned by that stream (RESULTS.md, shots, patches, APPLY.md). |
| `art/character/puppet2d/lamp1/**`, `scripts/character/puppet2d/lamp1/**` | Asha agent (main session) | read-only for every stream. Stream 5 copies the pack into `public/face-puppet/lamp1/`. |

---

## 5. Merge order, integration and release (main session)

Every merge follows the same procedure:
1. `git merge` the stream branch into a fresh integration branch cut from the current base.
2. Apply that stream's `[patch-request]` commits and patches in APPLY order.
3. Regenerate the generated files.
4. Run the static gates.
5. Run that stream's batteries **on the integrated tree, never on the stream's base** (`r3i-apply-order-and-conflicts`).
6. Fast-forward the base and push.
7. Tell the still-running sessions to merge the base into their branches.

**Order:**

| # | merge | why this position |
|---|---|---|
| 0 | Step 0 | before any stream branches |
| 1 | **5a** single teacher + persona + look switch (r8 still the default) | it changes who teaches classes 5-9 and Asha's register. Every conversation and owner battery after it must run on it. Its test-fixture patches to others' files land here. |
| 2 | **2** live content | it owns the Desk, the box contract and the compose ladder that the games rely on |
| 3 | **1A** games core, then **1B**, **1C**, **1D** | coverage and certificates are regenerated after each. `round3-play` and `round3-forge` re-run after each. |
| 4 | **4A** conversation | after 5a, so its final battery measures Asha's register |
| 5 | **4B** duplex | engine changes stay shadow and cohort |
| 6 | **3** latency | last, because it restructures the reply path that the 4A guards and the stream 2 screen guards plug into. It must prove guard parity per sentence on the merged tree. |
| 7 | **5b** `lamp1` live and made the default | whenever the pack is final and the owner has signed off. It can follow the first deploy. |

**Before every production deploy, the full battery on the integrated tree:**
- **Static:**
  - `npx tsc -b`, `npx vite build`, `npm test` (on a clean TEST branch);
  - `node scripts/verify-release.mjs` (with `--persona-change` if 5a is in);
  - check-prompt-budget, `scripts/lint-kits.mjs`, `scripts/lint-ui.mjs` (no new findings);
  - `node scripts/context.mjs --check` after the inbox merge (`scripts/merge-inbox.mjs`);
  - `build-coverage --check`, runtime-image-imports, `scripts/r4-coverage.mjs`.
- **Local production-image copy** (with the worker-image copy running): every file in the RESULTS.md battery table must
  equal or beat round 3. That covers `w2i-safety`, `owner-1..5`, `round3-*`, `round2-*`, `p5`, `w2a-parent-truth`,
  `w1a`, `w1b`, `w2flow-walk`, `w2i-release` and the adversarial suite. Add each stream's new `r4-*` harnesses and
  `tests/prod/r4-timeline`, with the release flags set as they will ship.
- **Screens:** the shot battery at 360×800, 412×915 and 1366×768 for every face surface, every game mode and every
  artifact kind.
- **Production:** `node scripts/deploy-azure.mjs --gate` (gate stamp, migrations, ACR build from the pushed sha, canary
  at 0%, `w0-smoke`), then 100% traffic. Then the prod battery: `round3-play` P0-P8, `round3-forge`, `owner-1..5`,
  `w2i-safety`, `p2-face`. Deploy the worker (`scripts/deploy-worker.mjs`) if conductor, reports or worker code
  changed. **Push before deploy:** ACR builds from GitHub.

**Release flags.** Everything ships with its default equal to today's behaviour. The main session then switches a flag
on the running Container App with `--set` or an env change, so rollback needs no rebuild.

| flag | ships as | switched on when |
|---|---|---|
| `TAXILA_SINGLE_TEACHER` (new, 5a) | `on` (owner directive) | already on; `off` is the rollback |
| `TAXILA_FACE_LOOK` (new, 5) | `r8`, then `lamp1` for the owner cohort, then everyone | the 5b acceptance holds, the owner looks on his phone and says go, and `p2-face` is green on prod |
| `TAXILA_FACE_PUPPET2D` (existing kill) | on | unchanged |
| `TAXILA_PLAY` (new kill, 1A) | on | `off` only if a game is found broken on prod |
| coverage entries, certificates | data | each entry is live once its certificate passes; a broken entry gets `excluded` |
| `TAXILA_TURN_PREFETCH` | `on` after the stream 3 battery | 0 hot-lane 429s caused by the prefetch on prod load (`dec-r3rh-prefetch-on`) |
| `TAXILA_TTS_FIRST_SENTENCE` (new, 3) | off, then on | per-sentence guard parity on the merged tree, 0 safety regressions, the latency gain measured on prod |
| `TAXILA_ACK_AT_MS` | 1,200 → tuned | the ack-leak bars hold at n ≥ 40 graded |
| L3 early first sound (new, 3) | `shadow` | an owner and safety decision on the early distress read, plus 4B's EOT meeting R1 |
| `TAXILA_DUPLEX` / `TAXILA_DUPLEX_LIVE_FOR` | `shadow` + owner cohort | `on` for everyone only when all nine criteria hold on real speech, and the owner's own hands-free test passes |
| `TAXILA_P5_*` / `TAXILA_CONV2` (4A's new behaviour) | default as today | the battery bars in §3.4 |

**Decisions the main session takes to the owner** (each logged with a reversal condition):
1. The 900 ms path: may an echo sound on an early distress read? It is a safety-floor change and needs safeguarding
   review.
2. N1 (the goodbye rule) versus `rj-fixr2-checkin-wrap-exempt`.
3. Asha's address form for classes 5-9: "Asha didi" (today) or another. The persona invariants are tuned on today's
   form.
4. The naming card: removed as a teacher choice (this plan), or kept.
5. Classes 8-9 and 1-3 are out of the game-coverage bar this round.
6. The topics left with no game after the lanes, named and with reasons. The safety exclusions stay.
7. The reference phone (O-R4) for the frame-rate and device runs.

---

## 6. Risks, and what would make us change the plan

| risk | what we do | what changes the plan |
|---|---|---|
| The `lamp1` pack is late or fails the kill rule (RIG-NOTES §7: "not her" or "not premium" after the gate or L3) | 5a ships with r8 behind the look switch. Asha's still poster (option 4 front) is the fallback face. | A kill verdict: stop, report, and return to the owner. No polish loop on the same method. |
| Asha's widened register (classes 1-9) moves the conversation or owner batteries | 5a lands first; 4A re-measures on it; talk gate | A regression the persona notes cannot fix: split the sheet into two class bands (same face and voice), with the owner's agreement |
| Coverage stalls well short of 385 by day 4 | the main session relaunches lanes on the `scripts/r4-coverage.mjs` remainder, and may split 1D into language and SST lanes | A family whose topics take as long as a fresh engine (`r3g-eight-deep-families` reversal): build it as one-off engines, or give the owner the list |
| "Quiz in costume" in the language and SST lane | C5 at ≥ 80% manipulation, judged by atomic checks, plus the owner's eye on 5 sample pieces before the lane scales | The owner rejects the samples: language topics stay board and conversation until a new design |
| Nine sessions, merge conflicts in hot files | the §4 map, patch requests, the fixed merge order, regenerated files | Two streams repeatedly needing the same unowned file: give it to one stream for the rest of the round |
| Shared Azure quota: batteries from nine sessions plus the prefetch's +62% calls cause 429s and distort latency numbers | per-stream runs labelled with time and load; stream 3's timed runs scheduled when no battery is running; quotas checked before switching the prefetch on | 429s on prod attributable to the prefetch: the prefetch goes back off |
| CI (`gates.yml` runs on every push to every branch) uses one shared TEST branch, so DB tests race | a red CI from DB races is not a stream's gate. The local run on its own Neon branch is. The main session's gate stamp is the deploy evidence. | Persistent CI noise: set the CI DB tests to the per-branch Neon URL, or restrict CI to the base branch for the round |
| The 900 ms bar is structurally out of reach under the safety rule | L1 and L2 ship; L3 is measured in shadow; decision 1 | The owner and the safety review approve an early read: L3 ships behind its flag with its own battery |
| Duplex R5 and R6 need a target-speaker model | expect R1, R3, R4; cohort only | A licensed, commercial-use target-speaker model that runs on device: a dedicated stream |
| The frame rate on a ₹10k phone is unmeasured (only a SwiftShader proxy) | the proxy is reported every time; the device run waits on O-R4 | The device run shows the 20 fps p95 floor missed: degrade (DPR, particles) before any release claim |
| The game look stays four round-3 art packs (kagaz, chalk, blueprint, raat), now that Prakash is dropped | fit and correctness are the bars this round | The owner calls the games' look childish or basic again: a look pass for games as its own stream, with the owner choosing by looking |
| Production deploy breaks the student path, as it did in round 3 (patches not applied, `/api/play` 404) | S0.1 and the prod battery after every deploy, run as a student account walk (`round3-play` P0-P8, `round3-forge` on taxila.dev) | Any P0 failure on prod: roll back (`--rollback`, one traffic patch) before anything else |

---

## 7. Per-stream briefs (paste as the first prompt of each cloud session)

Every brief assumes the session has a fresh clone of the repo and its own `.env.local`. Every brief repeats the common
rules, so each one stands alone.

### Brief 1A · play core (`claude/r4-play-core`)

```
You are stream 1A of Taxila round 4: GAMES CORE + the number and algebra families. Repo: the Taxila clone in this
container. Read CLAUDE.md, context/rejected.md (play, forge and r3 sections), docs/design/round4/BUILD-PLAN.md §1, §3.1,
§4, docs/design/round3/play/{RESULTS,DESIGN,GRAMMAR}.md, mechanics.md §4.1-4.3 and Appendix A.
Branch: git checkout -b claude/r4-play-core origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this
branch; never merge into another branch; never deploy or run scripts/deploy-*.mjs.
Data: DATABASE_URL / TEST_DATABASE_URL in .env.local is YOUR Neon test branch. Never use a production database. Never
print, write or commit a key; .env.local stays gitignored.
GOAL: every class 4-7 topic whose primary family is Todo-Jodo (49), Taraazu (15) or Nishana (16) gets a certified game
(BUILD-PLAN §3.1 C1-C10): admitted by SKILL, solver-proven and shortcut-free levels, 0 wrong grades over >= 2,000 random
acts per mode, fits the stage box contract (docs/design/round4/build/box-contract.json) at 360x800, 412x915 and 1366x768
for every art pack (text >= 14 px, >= 16 for classes 4-5, numerals >= 18, targets >= 44 px, nothing clipped), >= 80% of
graded acts are manipulations, her reaction lines pass tests/play-react, evidence folds as via:"game", no points or
streaks. New modes the families imply: decimals, integers and fractions on Nishana; ratio; regroup-add; multi-bag
equations.
CORE WORK: bring the 10/16 modes under 50 fps (4x throttle) up; add a TAXILA_PLAY=off kill switch (compose admits nothing);
make the in-lesson play loop (PlayStudioRenderer, lessonBridge, voice verbs) solid; extend tests/prod/round3-play.mjs so
P8 runs per family. Build the yard path only if docs/design/round4/build/BASELINE.md says the owner keeps one.
OWN: src/play/core/**, src/play/{PlaySession,PlayStage,PlayStudioRenderer}.tsx, src/play/{client,copy,lessonBridge,
lessonLang}.ts, src/play/world/**, src/play/dev/**, src/play/families/{todo-jodo,taraazu,nishana}/**,
src/play/families/views.ts, shared/play.ts, server/play/** (not other lanes' rules/*.mjs), server/forge3/play-cert.js,
server/forge3/certs/play.json, data/play/reactions/{todo-jodo,taraazu,nishana}.json,
docs/design/round3/play/harness/**, tests/play-*.test.mjs, tests/prod/round3-play.mjs,
docs/design/round4/build/play-core/**. Other lanes add only their own lines to FAMILIES/MODES and LOGIC.
READ ONLY: src/child/lesson/** and server/forge3/compose.js (stream 2), server/director/** (4A), data/kits/**.
A change to a file you do not own: write docs/design/round4/build/play-core/patches/NN-*.diff plus an APPLY.md line (why,
which test proves it). You may apply it locally only as a separate commit titled "[patch-request] ...".
KEYS: AZURE_OPENAI_ENDPOINT/API_KEY + DEPLOY_FAST/BRAIN/CLASSIFY/REPLY/TRANSCRIBE, AZURE_SPEECH_*, a test
TAXILA_PLAY_KEY. Model judges are advisory only.
GATES before each push that touches code: npx tsc -b && npx vite build && npm test; node scripts/check-prompt-budget.mjs;
node server/play/tools/build-coverage.mjs --check; node scripts/r4-coverage.mjs; lint-ui adds no finding. Shots at all
three sizes with PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers. tests/prod/round3-play.mjs against a local production build
(node server/serve.mjs + server/worker.mjs, NODE_ENV=production, your Neon branch).
FIRST: re-run the baseline (round3-play, coverage) on the untouched base and record it.
LOG: context/inbox/r4-play-core.json (decisions with a reversal condition; measurements with n, method and date;
rejections with what broke; supersedes edges). Write results and shots in docs/design/round4/build/play-core/RESULTS.md.
DONE when: every topic you claim passes C1-C10 in r4-coverage; 0 regressions in existing modes; round3-play >= 93/93;
fps per mode reported; every gate green; the branch is pushed. Report in plain words: covered / claimed, what is not
met and why, and the topics you could not cover, by name.
```

### Brief 1B · maths procedures, rules and shape (`claude/r4-play-maths`)

```
You are stream 1B of Taxila round 4: NEW maths game families. Read CLAUDE.md, context/rejected.md (play and forge
sections, rj-r3g-*, rj-mean-check-pass-as-quality), docs/design/round4/BUILD-PLAN.md §3.1 and §4, and
docs/design/round3/game/concepts/mechanics.md §4.4 (Chalao), §4.5 (Niyam), §4.8 (Nazariya) and Appendix A.
Branch: git checkout -b claude/r4-play-maths origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this
branch; never deploy; never touch a production database; never print or commit a key.
GOAL: certified games (BUILD-PLAN §3.1 C1-C10) for the class 4-7 topics whose primary family is F4 Chalao (44: multi-step
procedures), F5 Niyam (15: patterns, data) or F8 Nazariya (28: shapes, symmetry, views, angles, area, perimeter,
including its EVS and science topics). Each family is a law plus a solver, shortcut-free levels, kit misconceptions run
as mal-rules, a view and a board twin. The act must BE the idea (compose and run steps; test an example against a rule;
rotate, reflect or project). Never a pick from a list. Every number, key and layout comes from code, never from a model.
Words come from the authored bank (dec-r3-child-facing-words-from-bank).
BUILD ON the core API exactly as it is on the base (FamilyLogic, Painter, stage.ts, juice.ts, sound.ts, voice.ts). A
missing helper goes inside your own family directory. A core change is a patch request.
OWN: src/play/families/{chalao,niyam,nazariya}/**, server/play/tools/rules/{chalao,niyam,nazariya}.mjs,
data/play/reactions/{chalao,niyam,nazariya}.json, tests/play-{chalao,niyam,nazariya}*.test.mjs, your own lines in
shared/play.ts FAMILIES/MODES and src/play/families/index.ts LOGIC, and docs/design/round4/build/play-maths/**.
READ ONLY: everything else. Patch requests: docs/design/round4/build/play-maths/patches/ plus APPLY.md; local commits
titled "[patch-request] ...".
KEYS: the lesson stack (AZURE_OPENAI_*, DEPLOY_FAST/BRAIN/CLASSIFY/REPLY/TRANSCRIBE, AZURE_SPEECH_*) for the in-lesson
C9 check; a test TAXILA_PLAY_KEY; your own Neon branch.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; build-coverage --check; node
scripts/r4-coverage.mjs; lint-ui adds no finding; shots at 360x800, 412x915 and 1366x768 for every mode, every art pack
and both class bands; the C9 lesson loop on a local production build. Re-run the baseline first.
PLAN YOUR TIME: about one day per family to its first certified mode. Then widen modes for coverage. Ship families that
are certified; never ship a half family.
LOG: context/inbox/r4-play-maths.json; docs/design/round4/build/play-maths/RESULTS.md (per topic: covered or not, and
why).
DONE when: every claimed topic passes C1-C10; tests/play-logic-style suites exist for each mode (>= 2,000 random acts, 0
wrong grades); shots are committed; every gate is green; the branch is pushed. Report the topics covered and the topics
not covered, by name.
```

### Brief 1C · science and EVS (`claude/r4-play-science`)

```
You are stream 1C of Taxila round 4: SCIENCE and EVS games. Read CLAUDE.md, context/rejected.md (play, forge,
generated-media-carries-facts, sim-* sections), docs/design/round4/BUILD-PLAN.md §3.1 and §4, and
docs/design/round3/game/concepts/mechanics.md §4.6 (Kyun-Lab), §4.7 (Karkhana), §4.10 (the 26 "conversation by default"
topics) and Appendix A.
Branch: claude/r4-play-science from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch;
never deploy; never touch a production database; never print or commit a key.
GOAL: certified games (BUILD-PLAN §3.1 C1-C10) for the class 4-7 topics whose primary family is F6 Kyun-Lab (37; 12 labs
and 13 topics exist today) or F7 Karkhana (20: flows and stations, such as digestion, circulation, water and circuits).
Then a per-topic decision, with a reason, for the 26 "conversation by default" EVS and science topics: an interactive
that truly exercises the skill (Niyam sort, a Karkhana system, a Kyun-Lab design task), or "no game", with the reason, in
your RESULTS. The three adolescence topics (c7 ch06) stay excluded permanently (safety register). Causal models are
code, and every apparatus is drawn true to the science ("no air" means air pumped out, never a sealed box).
BUILD ON the core API exactly as it is on the base. A core change is a patch request.
OWN: src/play/families/{kyun-lab,karkhana}/**, server/play/tools/rules/{kyun-lab,karkhana}.mjs,
data/play/reactions/{kyun-lab,karkhana}.json, tests/play-{lab,karkhana}*.test.mjs, your own FAMILIES/MODES and LOGIC
lines, and docs/design/round4/build/play-science/**.
READ ONLY: everything else. Patch requests: docs/design/round4/build/play-science/patches/ plus APPLY.md; local commits
titled "[patch-request] ...".
KEYS: the lesson stack (AZURE_OPENAI_*, DEPLOY_FAST/BRAIN/CLASSIFY/REPLY/TRANSCRIBE, AZURE_SPEECH_*); a test
TAXILA_PLAY_KEY; your own Neon branch. No image deployment: apparatus is drawn in code.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; build-coverage --check; node
scripts/r4-coverage.mjs; lint-ui adds no finding; shots at 360x800, 412x915 and 1366x768 for every lab and mode; the C9
loop on a local production build (asked AND at a practice beat). Re-run the baseline first.
LOG: context/inbox/r4-play-science.json; docs/design/round4/build/play-science/RESULTS.md.
DONE when: every claimed topic passes C1-C10; each of the 26 topics has a decision with a reason; every gate is green;
the branch is pushed. Report covered and not covered by name, and say plainly which "no game" calls need the owner.
```

### Brief 1D · English, Hindi and SST interactives (`claude/r4-play-language`)

```
You are stream 1D of Taxila round 4: games and interactives for the 135 class 4-7 English (53), Hindi (48) and SST (34)
topics. Nothing has been designed for these yet. Read CLAUDE.md, context/rejected.md (play, forge, kit-invented-
companion-texts, forge-g1-case-folded-keys, the recitation law), docs/design/round4/BUILD-PLAN.md §3.1 and §4, and
docs/design/round3/game/concepts/{mechanics,live-tech}.md (the forms x representations grammar).
Branch: claude/r4-play-language from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch;
never deploy; never touch a production database; never print or commit a key.
STEP 1 (half a day): write docs/design/round4/build/play-language/DESIGN.md. Map each topic's kit skills to a form
(sort-by-rule, order or sequence, build-a-sentence, spot-the-slip) over a representation (token-strip, timeline,
map-grid, set). Every word on screen comes from the kit's VERIFIED text and keys: never invented, and graded on the exact
text where case, apostrophe or matra IS the answer. Mark the topics where a game would be a quiz in costume as "no game",
with a reason. Put 5 sample screens (360x800) in RESULTS for the owner's eye before you scale.
STEP 2: build the families (your own new ids) to the BUILD-PLAN §3.1 C1-C10 certificate. Devanagari text >= 16 px with no
letter-spacing; Hinglish, Hindi and English labels follow the lesson language.
OWN: src/play/families/<your new ids>/**, server/play/tools/rules/<ids>.mjs, data/play/reactions/<ids>.json,
tests/play-<ids>*.test.mjs, your own FAMILIES/MODES and LOGIC lines, and docs/design/round4/build/play-language/**.
READ ONLY: everything else. Core changes are patch requests (docs/design/round4/build/play-language/patches/ plus
APPLY.md; local commits titled "[patch-request] ...").
KEYS: the lesson stack (AZURE_OPENAI_*, DEPLOY_*, AZURE_SPEECH_*); a test TAXILA_PLAY_KEY; your own Neon branch. Advisory
judges: taxila-brain + grok.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; build-coverage --check; r4-coverage; lint-ui adds no
finding (L-DEVA: lesson words are content, so mark them as in src/play); shots at all three sizes; the C9 loop on a local
production build. Re-run the baseline first.
LOG: context/inbox/r4-play-language.json; docs/design/round4/build/play-language/RESULTS.md.
DONE when: the design note exists, every claimed topic passes C1-C10, every "no game" has a reason, every gate is green,
and the branch is pushed. Report covered and not covered by name. If you can see the SST topics deserve their own
session, say so on day 1.
```

### Brief 2 · live content (`claude/r4-content`)

```
You are stream 2 of Taxila round 4: LIVE CONTENT (boards, explainers, animations, simulations, Studio) and the lesson
Desk's tray. Owner: "the game/content development and its deploy for the student is extremely fucked up and nonsense
and fully broken". Read CLAUDE.md, context/rejected.md (forge-*, w2*, studio, stagecraft, board, rj-holistic-model-judge-
gate, rj-mean-check-pass-as-quality), docs/design/round4/BUILD-PLAN.md §3.2 and §4, docs/design/round3/forge/
{RESULTS,APPLY}.md, docs/design/round4/audit/AUDIT.md §3.8.
Branch: claude/r4-content from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch;
never deploy (the QA service deploy belongs to the main session); never touch a production database or a production
storage container; never print or commit a key.
GOAL, in order:
(1) ONE certificate gate. A test lists every path that can put pixels in the tray (studio slot/stream, stagecraft reveal,
Director module mount, forge-g2 made-for, explainer, whiteboard, play) and proves each passes the forge3 certificate at
the device's viewport class before reveal.
(2) Studio v2 off the child path unless certified at all three sizes (0/1155 pass today).
(3) Her line matches the board: 0 contradictions on >= 50 battery boards; the board fallback stays gated.
(4) Game, animation and simulation asks end in something the child can DO: a play level, the whiteboard player drawing
on her clause, or a certified explainer. Never a static board labelled as an animation. Build "half ka half".
(5) Request to piece on stage <= 3 s p90, n >= 20.
(6) The owner-5 Studio slots that never became an artifact.
(7) V3.3 over EXP-30 + 200 simulated lessons: right-artifact-ready >= 90%, stale or wrong reveals 0, visible failures 0.
You also own the Desk: keep the stage box contract (docs/design/round4/build/box-contract.json); grow a box, never
shrink one. Apply the other streams' Desk patch requests only if the main session asks you to.
OWN: server/forge/**, server/forge3/** (not play-cert.js or certs/play.json), server/stagecraft/**, server/studio/**,
server/routes/{studio,forge,modules}.js, server/director/{modules,engine-check,units}.js, shared/{studio.ts,
studio-spec.ts,studio-spec-ext/**,stagecraft.ts,forge.ts,whiteboard.*,engine-catalog.js,engine-topic-map.json},
src/studio/**, src/stagecraft/**, src/studio-v2/**, src/modules/**, src/child/lesson/**, src/ui/copy.ts, src/copy/en.ts,
data/studio-catalogue/**, your tests (BUILD-PLAN §3.2), tests/prod/{round3-forge,owner-5-visual,w2h-studio,
w2f-studio-gate,w2b-*,p4-content-*,w1b-*}.mjs, docs/design/round4/build/content/**.
READ ONLY: src/play/** and server/play/** (1A), server/brain/** and src/lesson/** (3), the rest of server/director/**
(4A), src/face-puppet/** (5). Patch requests go to docs/design/round4/build/content/patches/ plus APPLY.md.
KEYS: the lesson stack; DEPLOY_CODEX / DEPLOY_STAGECRAFT_SPEC; DEPLOY_IMAGE only for picture asks; a SAS for ONE test
blob container; your own Neon branch.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; lint-ui adds no finding; shots of every artifact
kind at 360x800, 412x915 and 1366x768; round3-forge and owner-5 on a local production build. Re-run the baseline first.
LOG: context/inbox/r4-content.json; docs/design/round4/build/content/RESULTS.md.
DONE when: round3-forge R1 12/12, R2 6/6, R2b >= 15/18 (bar 18/18), R3 0 nonsense, R4 3/3 per case; owner-5 14/14;
request to piece p90 <= 3 s at n >= 20; 0 uncertified mounts in every battery; every gate is green; the branch is pushed.
Report plainly what is still short.
```

### Brief 3 · latency (`claude/r4-latency`)

```
You are stream 3 of Taxila round 4: LATENCY. VALUES V4.3: her first sound p50 <= 900 ms after the child finishes. Today
the reply's first word is p50 6,070 / p90 7,583 ms (n = 48-50). Read CLAUDE.md, context/rejected.md (reply-streaming-
no-gain, tts-first-clause-no-gain, v4-rj-words-with-visemes-part0, rj-r3rh-token-ack-before-distress, rj-r3rh-floor-only-
ack-timing, rj-static-filler-list, rj-symbolic-wait-indicator), the decisions dec-r3rh-* and dec-r3rv-silence-metric-
end-to-end, docs/design/round4/BUILD-PLAN.md §3.3 and §4, and docs/design/round3/fix/RESULTS.md (B1).
Branch: claude/r4-latency from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch; never
deploy; never touch a production database; never print or commit a key.
HARD RULE: nothing she says may precede the model distress read. Safeguard turns never stream.
STEPS:
(0) Reproduce the baseline with tests/prod/r4-timeline (n >= 48, within ±15% of 6,070 ms) and commit a per-stage turn
trace.
(1) L1: TAXILA_TURN_PREFETCH=on; raise speculative-reply adoption; note-parallel on non-answers (re-measure); per-sentence
safety, i.e. sentence 1 starts TTS after every per-sentence guard (floorViolations, revealsAnswer, scrubPii,
arithmeticSlip, praise, screen, script, register), while whole-reply guards may change only later sentences or the turn
falls back; behind TAXILA_TTS_FIRST_SENTENCE (default off). The client opens the audio stream with the turn POST. Keep
the DHD WebSocket pool warm. Send a patch to stream 2 that removes the "Thinking... N s" counter.
(2) L2: lower TAXILA_ACK_AT_MS only while evals/relational-human/ack-leak.mjs keeps AUC <= 0.65 and the P(echo) gap
<= 0.15 at n >= 40.
(3) L3: SHADOW only. Log the "would have sounded at" time for an EOT at <= 400 ms plus an early distress read. It needs
an owner and safety decision; never ship it live.
OWN: server/brain/{turn,say,arith}.js, server/latency/**, server/voice/**, server/routes/{voice,tts}.js, src/lesson/**,
src/latency/**, evals/latency/**, evals/relational-human/{first-sound,ack-leak}.mjs, evals/cascade-latency.mjs, your
tests (BUILD-PLAN §3.3), tests/prod/r4-timeline/**, tests/prod/{round2-latency,w2d-voice-lanes,w2g-voice}.mjs,
docs/design/round4/build/latency/**. In server/index.js the ...lane spread stays LAST; you do not edit that file.
READ ONLY: server/director/** and server/conversation/** (4A); server/director/safety.js (frozen); src/duplex/** (4B);
src/child/lesson/** (2). Patch requests go to docs/design/round4/build/latency/patches/ plus APPLY.md.
KEYS: the lesson stack (AZURE_OPENAI_*, DEPLOY_CLASSIFY/FAST/REPLY/BRAIN/TRANSCRIBE/TTS), AZURE_SPEECH_* and _SIN, the
India endpoints for lane comparisons (label them "from a US container"); your own Neon branch.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; verify-release; w2i-safety 39/39; the adversarial
suite (13/13 blocking); persona invariants; voice-cascade tests; the timeline on a local production build with prod
routing (DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning, TAXILA_CLASSIFY_HEDGE_MS=1500). Run timed runs when no other
battery is running, and label the load.
LOG: context/inbox/r4-latency.json; docs/design/round4/build/latency/RESULTS.md (the stage table before and after).
DONE when: the reply's first audible sound is p50 <= 3,000 / p90 <= 4,500 ms on the same harness and n; the echo on
graded answers is p50 <= 1,500 ms with the ack-leak bars held; 0 safety regressions; the L3 shadow numbers are reported;
the branch is pushed. Say plainly that 900 ms is NOT met unless you measured it met.
```

### Brief 4A · conversation (`claude/r4-conversation`)

```
You are stream 4A of Taxila round 4: NATURAL CONVERSATION. VALUES V5.2-V5.3: the CONVERSATION-V2 battery >= 85% of 345
cases with every family >= 75%; diversions parked and returned 100%; a stop phrase gets one warm check-in 100%; steering
acted on >= 90%; owner-truth green. Today: strict 56.3% / J1 60.3% (n = 355, local); family G 22.7, D 45.2, A 54.0;
owner-2 is 10/12 (R7.defer). Read CLAUDE.md, context/rejected.md (never-rules-*, rj-ot-*, rj-r3adv-*, rj-w2i-*, the
recitation and position laws), docs/design/reset/CONVERSATION-V2.md, docs/design/round4/BUILD-PLAN.md §3.4 and §4.
Branch: claude/r4-conversation from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch;
never deploy; never touch a production database; never print or commit a key.
RULES: prompt text is shapes and notes, never lines she could say; a rule that must fire goes LAST; the compile budget
gate throws and never truncates; safety is by predicate; server/director/safety.js and server/compiler/floor.js are
frozen (a change is a patch with a safety review). Judges are advisory: report strict and judge numbers, and flag that
the official number needs a human read of disputes. N1 (goodbye rule) is an owner decision: do not "fix" it in code.
MERGE NOTE: stream 5 widens Asha to classes 1-9 and lands first. When the main session says it has landed, merge the
base into your branch and re-run your baseline.
OWN: server/conversation/**, server/director/** (not modules/engine-check/units.js, which are stream 2's; not safety.js),
server/relational/**, server/persona/**, server/brain/{kernel,propose,moment,beat,reasons,rows,trace,
relational-adapter}.js, server/compiler/{compile,instructions,gates}.js, evals/conversation-*/**, evals/director-sim.mjs,
docs/design/round3/adversarial/**, your tests and tests/prod files (BUILD-PLAN §3.4), docs/design/round4/build/
conversation/**.
READ ONLY: server/brain/{turn,say}.js (stream 3: a new guard call is a patch), server/compiler/characters/** (5).
KEYS: the lesson stack plus the judge deployments (J1 gpt-6-sol, J2 gpt-6-luna); your own Neon branch.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; verify-release (persona invariants 70/70);
w2i-safety 39/39; adversarial; owner-2/3/4, round3-conversation and round3-relational-human on a local production build.
Re-run the baseline first. Work family by family, weakest first; measure each change on held-out cases (no tuning on
held-out data).
LOG: context/inbox/r4-conversation.json; docs/design/round4/build/conversation/RESULTS.md (per family, before and after).
DONE when: the battery is >= 85% strict with every family >= 75% (report honestly if not), owner-2 12/12, owner-3 48/48,
owner-4 17/17, round3-conversation 27/27, every safety gate green, and the branch is pushed. List the failing intents
for a relaunch.
```

### Brief 4B · duplex (`claude/r4-duplex`)

```
You are stream 4B of Taxila round 4: TWO-WAY hands-free DUPLEX, to its switch criteria. Read CLAUDE.md,
context/rejected.md (rj-silence-gated-turn-taking, rj-duplex-*, duplex round 3 rejections, open-duplex-*),
docs/design/round3/duplex/{CRITERIA,RESEARCH,APPLY}.md, docs/design/round2/duplex-real/CRITERIA.md, and
docs/design/round4/BUILD-PLAN.md §3.4 and §4.
Branch: claude/r4-duplex from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch; never
deploy; never change TAXILA_DUPLEX on any server but your local build; never touch a production database; never print or
commit a key.
GOAL, on the same recorded events and scorer (evals/duplex-r3/criteria.mjs), with TRAIN and TEST split:
R1 thinking-pause cut-offs <= 3% and <= silence-900 (today 4.1% MAI, 4.8% D4); R2 decision gap p50 <= 350 ms on the
India lane (1,011); R3 keeps talking through continuers >= 90% (79.0); R4 stops within 200 ms on >= 50% of real
barge-ins (47.1); R5 false yields <= 10% (13.4); R6 self-yields <= 2% (13.8); R1b, R2b and R7 stay met. No turn may get
worse. The child-safety floor is never weaker (safetyPending only ever ADDS a safeguard).
Expect R1, R3 and R4 this round. R5 and R6 probably need a target-speaker model: report what it would take; do not fake
it. Hand stream 3 an R1-qualified end-of-turn signal (src/latency/duplexTurn.ts already consumes hint.eager).
OWN: src/duplex/**, server/duplex/**, evals/duplex*/**, evals/p1-duplex/**, tests/{duplex-,round3-duplex-,p1-duplex-,
ship5-fix-duplex-revoke,ship5-review-duplex-safety}*, tests/prod/{round3-duplex,p1-duplex-acceptance,
round2-duplex-real}.mjs, docs/design/round4/build/duplex/**.
READ ONLY: src/lesson/cascadeLink.ts (stream 3; a seam change is a patch), src/child/lesson/** (2; hands-free cues are a
patch), server/director/safety.js (frozen).
KEYS: none for the replay suites; DEPLOY_TRANSCRIBE, the MAI India endpoint (if used) and AZURE_SPEECH_* for live runs;
your own Neon branch.
GATES: npx tsc -b && npx vite build && npm test; the duplex unit and replay suites; round3-duplex 18/18 and
p1-duplex-acceptance on a local production build; the cohort path checked with TAXILA_DUPLEX=shadow plus
TAXILA_DUPLEX_LIVE_FOR set to a TEST account's hash. Re-run the baseline first.
LOG: context/inbox/r4-duplex.json; docs/design/round4/build/duplex/RESULTS.md (the nine-criteria table before and after,
with CIs).
DONE when: every criterion is re-scored before and after on TRAIN and TEST, no turn got worse, R7 is green, every gate is
green, and the branch is pushed. State plainly which criteria still block "on" for everyone.
```

### Brief 5 · Asha (`claude/r4-asha`)

```
You are stream 5 of Taxila round 4: ASHA, the ONE teacher. Owner: "only 1 teacher that is asha (new grown up version)":
face option 4 "Lamplight flat", cardigan + block-print kurta. Arjun, Uma and every teacher choice leave the child flow.
Read CLAUDE.md, context/rejected.md (avatar-*, teacher-*, rj-gnm-*, p2d-*, avatar-m0-review-traps), the decisions
dc-r4-face-lamplight-flat, dc-r4-outfit-cardigan-print-kurta and dc-r4-single-teacher-asha, docs/design/round4/asha/
PROGRESS.md, docs/design/round4/face/RIG-NOTES.md, docs/design/ship5/p2-face/APPLY.md, and
docs/design/round4/BUILD-PLAN.md §3.5 and §4.
Branch: claude/r4-asha from origin/claude/blissful-mayer-icwe2j. Commit small and often; push ONLY this branch; never
deploy; never touch a production database; never print or commit a key.
PART A (land within day 1, then tell the main session):
- teacherFor serves asha for EVERY class 1-9 behind TAXILA_SINGLE_TEACHER (default on). Arjun and Uma are "parked" in
  shared/tutors.js. GET /api/tutors returns [asha]; POST /api/tutors/choose accepts only asha. Open lessons keep their
  pinned teacher. No migration.
- Widen Asha's sheet (server/compiler/characters/asha.js) from classes [1,4] to [1,9], with band notes for classes 5-9
  (from Arjun's competence notes) and a class 5-9 protege that is not a baby elephant. Notes and shapes only, never
  lines.
- Remove every teacher choice: the onboarding pick (Meet.tsx), the /teacher picker route (TeacherRoute, TutorPicker), the
  parent Controls/Pages teacher switch, the Hello naming card (stored names are still honoured), and Arjun on the landing.
- Gates: verify-release --persona-change <candidate.json> (talk gate), persona invariants, check-prompt-budget, and
  owner-1..5 / round3-conversation with no regression against the base.
PART B: the look switch, PuppetLook "r8"|"lamp1", keyed in src/face-puppet/assets.ts (base, clear colour, views,
posters). GET /api/face/config reports `look` (TAXILA_FACE_LOOK); the client override is ?look=. Asha's fallback on any
tier is the lamp1 still, never the Plate2D vector.
PART C (when the Asha agent's pack is final in art/character/puppet2d/lamp1/ plus its notes in
docs/design/round4/asha/integrate/): copy it to public/face-puppet/lamp1/, render the rest posters, apply the runtime
patch, run evals/face-puppet and tests/prod/p2-face-acceptance.mjs.
OWN: src/face-puppet/**, src/avatar/**, src/ui/teacher/**, src/ui/TeacherFace.tsx, src/stage/**, public/face-puppet/**,
src/child/teacher/**, src/child/screens/{Hello,Teacher}.tsx, src/child/routes.tsx, src/child/copy.ts, src/child/voice.ts,
src/onboarding/{index.tsx,Setup.tsx,steps/**}, the teacher parts of src/parent/{Controls,Pages}.tsx, src/parent/copy.ts,
src/app/landing/{Site,Landing}.tsx, shared/tutors.*, server/compiler/characters/**, server/routes/tutor.js,
server/face-puppet/**, evals/{face-puppet,p2-face}/**, your tests (BUILD-PLAN §3.5), docs/design/round4/build/asha/**.
Other streams' tests that use Arjun as a fixture change only as "[patch-request] ..." commits.
READ ONLY: art/character/puppet2d/lamp1/** (the Asha agent's), src/child/lesson/** (2), everything else.
KEYS: AZURE_SPEECH_* (Diya visemes), the lesson stack for the talk gate; your own Neon branch. No image deployment.
GATES: npx tsc -b && npx vite build && npm test; check-prompt-budget; verify-release; lint-ui adds no finding; shots of
every face surface (lesson Face and Work layouts, Summary, Trouble, Help, Hello, Home, Map sheet, Teacher, onboarding,
landing, play) at 360x800, 412x915 and 1366x768; p2-face on a local production build. Re-run the baseline first.
LOG: context/inbox/r4-asha.json; docs/design/round4/build/asha/RESULTS.md.
DONE when: a scan test proves no surface offers a teacher choice or names Arjun or Uma; every class 1-9 child's next
lesson is Asha in Diya's voice; p2-face is 31/31 on lamp1; the judge panel is >= 4.0 with blind "childish" <= 1/5;
every gate is green; the branch is pushed. Making lamp1 the default needs the owner's yes: say so, and do not flip it.
```
