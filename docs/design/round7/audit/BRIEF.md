# Whole-project audit, 2026-11-09: brief for the audit sessions

The owner asked main: **"read this entire project and find everything broken, inconsistent, not good enough, or no longer needed. fix everything."**

Thirteen sessions each take one area. Main (your parent session) runs the round-7 build, integrates stream branches into `int/r6`, and decides what happens to each finding. You start from `int/r6` at integration 21a.

Read the shared rules, then your own section under "Areas".

## Phase 1: audit

Read your area fully. Where you sample or skip (bulk data, generated files), say so in a coverage section. You have your own container, so you may build, run tests and run the app locally.

Report four kinds of finding:

| Kind | What it means |
|---|---|
| broken | Cannot work as written, or fails on a concrete input you can name. Reproduce it. |
| inconsistent | Two places that disagree: a contract and its use, a doc and the code, duplicated logic that has drifted, flag defaults. |
| not good enough | It works, but a child, a parent or the owner would experience it as poor (name what they see), or it will predictably cause the next bug (name the mechanism). |
| no longer needed | Dead code, superseded versions, stale docs, unused assets, obsolete scripts, flags that can never flip. |

**The bar for a finding:**
- Evidence at `file:line` that a skeptic can check in two minutes.
- A specific fix: the smallest change that solves it.
- A severity:
  - P0: a child's lesson, stored data or production breaks.
  - P1: a defect a child or parent sees.
  - P2: quality that will cause bugs.
  - P3: cleanup.
- No style nits, no "might", no generic advice. Do not cap the count; do rank.

**For "no longer needed", prove nothing live depends on it.** Check importers (dynamic imports too), `package.json` scripts, CI, Dockerfiles, tests, docs that tell someone to run it, and `context/` entries that cite it as evidence.

**Skeptic pass before you report.** Give one sub-agent your full list (the findings, not your reasoning) and ask it to refute each one. It defaults to "refuted" when it cannot reproduce the evidence. Drop what it refutes.

## What is not a finding

- **Missing safety, compliance or large-test work.** The owner deferred these on purpose (CLAUDE.md, "Build first"). Existing safety code (`server/safety/**`, the child-safety floor, safetyStrings) is frozen: do not propose removing, extending or re-measuring it. A real bug in how product code calls it is still a finding.
- **Anything already queued for director17.** Read `docs/design/round7/judgements/director16-2026-11-09.md` from "Decision: dc-r7-held-board" down. The Brain, Studio and Learning streams are building those now.
- **A fix that was already tried and rejected.** Search `context/rejected.md` for your topic before you propose one.

## Write-up

Write `docs/design/round7/audit/<area>.md` on your branch `claude/r7-audit-<area>`:
- one table: id (`<AREA>-NN`), severity, kind, owner, title, where, fix, status;
- a short evidence note per finding;
- a coverage section: read fully, sampled, not read.

"Owner" is the stream that owns the path in `docs/design/round7/OWNERSHIP.md`: brain, voice, studio, games, face, app, learning or platform. Use "main" for docs, `context/`, evals, repo hygiene and anything cross-cutting.

Commit and push it. Then send main one message (send_message to your parent session) with:
- counts by severity and by kind;
- the top 10 findings, one line each;
- the path and sha;
- which findings you will fix yourself under the phase 2 rule for your area.

## Phase 2: fix

Each area below says "fix" or "audit only".

**Fix areas.** After you send the report, go straight on:
- Fix every confirmed broken and inconsistent finding inside your area, smallest change first.
- Each fix gets a test that fails before it and passes after.

**Wait for main's reply before any of these:**
- deleting anything (another area may depend on it);
- a "not good enough" redesign;
- anything outside your area;
- a change to `shared/contracts.ts`;
- a database migration.

**Audit-only areas.** A stream session is mid-build in those files. Main routes your findings to it. Change no product code unless main replies with a list.

**Gates before every push that touches code:** `npx tsc -b && npx vite build && npm run test:all` (about 10 minutes).
- One browser suite, `studio-stage-states`, can time out on page load when the machine is busy. Re-run it once alone before treating it as a failure.
- Merge `origin/int/r6` before your final push, then send main the sha and the list of finding ids it closes.

## Rules

- **Nothing paid.** No Azure, no model or speech calls, no deploys, no director runs. Tests run with `DATABASE_URL` blank.
- **No secrets.** Never read, print or commit `.env*` files or keys.
- **No tools that wait on a person.** Do not use scheduling tools (send_later, triggers) or web fetches: they stop on a permission prompt nobody is watching. If you are blocked, message main and stop.
- **No real children's words in commits.**
- **Plain words.** The owner reads these reports.
- **`context/`:** do not edit `context/*.md` or `graph.json` (main's integrations rewrite them). Put proposed entries in `context/inbox/r7-audit-<area>.json`, in the same shape as the files in `context/inbox/merged/`. A rejection (what was tried and what broke) is the most valuable kind.

## Areas

Paths follow `docs/design/round7/OWNERSHIP.md`; read it for the exact split.

### 1. teacher (audit only; owner: brain)

**Paths:** `server/brain`, `server/director` (not `session/`), `server/lesson`, `server/conversation`, `server/agent`, `server/persona`, `server/compiler`, `server/grading`, `server/relational`, `server/signals`, `server/ui`, `server/routes/lesson.js`, `shared/contracts.ts`, `shared/brain.ts`, `shared/bands.ts`, `shared/relational.ts`, and the harness code in `evals/hybrid-side-by-side/*.mjs` (not its results).

**Look for:**
- Which lesson lanes are live by default and which are dead (the Director, the agent, the script walk behind `TAXILA_R7_SCRIPT`). What does a child get in production today, and what is unreachable?
- Paths the script walk superseded that still run or still ship.
- Grading: every place an answer is judged. Is there exactly one grader? Does any path let a model grade?
- `say.js` and `propose.js`: where the structure will cause the next bug.
- Prompt budgets: any prompt that can be silently cut.

### 2. learner (fix; owner: learning)

**Paths:** `server/learner`, `server/comprehension`, `server/conductor`, `server/reports`, `server/placement`, `server/director/session`, `server/routes/parent.js`, `child.js`, `account.js`, `placement.js`, `shared/learner.ts`, `shared/interests.js`, `src/parent`, `src/onboarding`, `src/ui-v3/Scheduler.tsx`, `src/ui-v3/schedule.ts`.

**Look for:**
- Does a lesson turn on the script-walk path actually update the learner model? Trace one right answer and one wrong answer from the turn to the stored state.
- Does the Conductor's plan reach the child's home screen, and does it use that state?
- Parent corner: every number or sentence a parent sees. Is it real data, a placeholder, or wrong?
- Placement: can a new child get a wrong level, and what happens next?

**Do not touch** `data/lesson-scripts/**` or `scripts/lesson-scripts/**` (Learning's D11 is in them).

### 3. content-data (fix, with limits; owner: learning)

**Paths:** `data/curriculum`, `data/kits`, `data/kits-relevel`, `data/lesson-scripts-staged`, `data/placement`, `data/arena`, `data/geo`, `scripts/kits`, `server/content`.

**Look for:**
- Wrong answer keys, wrong maths or science, wrong class level. Blind-solve a real sample of items per subject and class, and say how many you solved. A wrong key is P0.
- Hinglish that no teacher would say.
- Topics in the curriculum graph with no kit; kits nothing loads; duplicate or contradictory topics.
- Staged lesson scripts (30) against the current validator and against what director14–16 found in the four pilots.

**Limits:**
- Fix provably wrong data in kits, curriculum, arena and placement.
- For `data/lesson-scripts-staged`, report only: Learning regenerates it after D11.
- Do not touch the four pilots in `data/lesson-scripts`.

### 4. studio (audit only; owner: studio)

**Paths:** `server/studio`, `server/stagecraft`, `server/forge` (not `g2/`), `server/forge3` (not `live.js`, `play-cert.js`, `certs/play.json`, `certs/modules.json`), `server/routes/studio.js`, `forge.js`, `src/studio`, `src/studio-v2`, `src/stagecraft`, `src/modules/whiteboard`, `shared/whiteboard.js`, `shared/studio*.ts`, `shared/studio-spec-ext`, `shared/stagecraft.ts`, `shared/forge.ts`, `data/studio-catalogue`, `infra/studio-qa`.

**Look for:**
- `src/studio` against `src/studio-v2`, and `server/forge` against `server/forge3`: which is live, which is left over?
- Board templates: any that can draw something false (a wrong label, a shaded count that disagrees with its fraction), clip at 360 px, or fail their own lint.
- The catalogue (386 files): entries nothing can reach.
- Speculative builds: what a child sees when one fails or is late.

### 5. games (audit only; owner: games)

**Paths:** `server/play`, `src/play`, `src/modules` (not `whiteboard/`), `data/play`, `shared/play.ts`, `shared/engine-catalog.js`, `shared/engine-topic-map.json`, `server/forge3/live.js`, `play-cert.js`, `certs/`, `server/forge/g2`, `modules.html`.

**Look for:**
- Play each family's logic against its own kit: a game that accepts a wrong answer, rejects a right one, or can be won by tapping at random.
- Families or engines registered but unreachable from any topic; topics mapped to a game that does not teach them.
- What a child sees at 360 px: clipped controls, tap targets under 44 px, text nobody in class 4 can read.
- Older engines the families replaced.

### 6. voice (fix; owner: voice)

**Paths:** `src/duplex`, `src/voice`, `src/voicesig`, `src/latency`, `src/lesson`, `src/child/lesson/headset.ts`, `src/pages/LessonDev.tsx`, `server/duplex`, `server/voice`, `server/voicesig`, `server/latency`, `server/routes/voice.js`, `tts.js`, `scripts/voice`, `scripts/duplex`, `scripts/voicesig`.

**Look for:**
- The path a child's speech takes to her reply and back to sound, as shipped by default. Where can it hang, double-speak, cut her off, or go silent with no recovery?
- Barge-in and turn-taking state machines: states with no exit.
- More than one live voice path (cascade, realtime, duplex): which is the product, and which is left over?
- Any call to a non-Azure paid service.

### 7. app (fix; owner: app)

**Paths:** `src/child` (not `lesson/headset.ts`), `src/ui-v3` (not the Scheduler files), `src/app`, `src/ui` (not `teacher/`), `src/copy`, `src/styles`, `src/main.tsx`, `index.html`, `vite.config.ts`, `public/site`, `public/landing`, `public/brand`, `public/fonts`, `public/manifest.webmanifest`, `data/kaksha`.

**Look for:**
- Every route and screen: reachable? Does it handle loading, empty and error states without showing raw errors or English developer text to a child?
- `src/ui` against `src/ui-v3`: what is live, what is left over?
- Copy: mixed registers, the same thing named two ways, text that does not fit at 360 px.
- State that is lost on refresh or app switch in the middle of a lesson.

### 8. platform (fix, with limits; owner: platform)

**Paths:** `server/*.js` and `*.mjs` at the top level, `server/routes` (the ones no other area lists), `server/signin`, `server/ops`, `server/cost`, `server/trace`, `server/pair`, `src/trace`, `shared/trace.ts`, `api/`, `db/migrations`, `infra/` (not `studio-qa/`), `Dockerfile*`, `.github`, `package.json`, `vercel.json`, the top-level `scripts/*.mjs`, `scripts/region`, `scripts/handoff`.

**Look for:**
- Routes registered but never called; client calls to routes that do not exist; auth gaps where one child can read another child's data.
- Migrations: order, idempotence, anything the code expects that no migration creates.
- The deploy path: does `docs/design/round7/platform/RELEASE-16.md` match the scripts?
- Environment variables: read in code but set nowhere, or set but never read.
- CI: what it runs against what the gates say.

**Limits:**
- `infra/m3/**` and `scripts/m3.mjs` run the live Azure grant keepers. Report only; never change them.
- No migrations and no deploy-script behaviour changes without main's reply.

### 9. face (fix; owner: face)

**Paths:** `src/face-puppet`, `src/avatar`, `src/ui/teacher`, `server/face-puppet`, `server/routes/tutor.js`, `public/face-puppet`, `public/assets/teacher*`, `public/assets/gen/protege`, `art/`, `scripts/character` (over 1,000 files), `scripts/gpu`, `prototypes/`, `models/`, `shared/tutors.*`.

**Look for:**
- Which face a child sees today, and everything that belongs to faces that lost: old rigs, candidates and generators.
- The live face: mouth and speech out of step, states that stick (thinking, listening), what shows when assets fail to load.
- Repo weight: the largest directories and whether anything at runtime or in a test reads them.

The owner has not yet picked Asha's final look (r8, lamp2, or lamp2 with jaw). Keep those three; list them as an open choice, not as dead.

### 10. docs-memory (fix, with limits; owner: main)

**Paths:** `HANDOFF.md`, `CLAUDE.md`, `docs/**`, `context/**`.

**Look for:**
- `HANDOFF.md` and the round-7 docs (`docs/design/round7/*.md`) against the code and the latest judgement: every statement that is no longer true.
- `context/`:
  - decisions whose reversal condition has fired without a follow-up;
  - nodes superseded in fact but not marked;
  - measurements that contradict each other;
  - `open.md` items that are closed;
  - `architecture.md` against the code.
- Docs that instruct something that no longer exists (scripts, routes, flags, Vercel).
- Whole doc trees from earlier rounds that nothing links to.

**Limits:**
- Fix stale statements in `HANDOFF.md` and `docs/`.
- For `context/`, propose inbox entries only.
- Deleting or archiving doc trees waits for main.

### 11. tests-evals (fix, with limits; owner: main)

**Paths:** `tests/`, `scripts/test-shard.mjs`, `evals/` (harness code and the shape of the results), root strays such as `_q.mjs`, `.gitignore`.

**Look for:**
- Tests that are skipped or todo, tests that assert nothing, tests pinned to behaviour that was removed, and tests that pass when the code under test is broken (mutate and check a sample).
- Browser tests that depend on the wall clock or machine load. `studio-stage-states` timed out on page load in integration 21a's gate and passed alone; make that class robust without weakening an assertion.
- Evals: which harnesses still run against today's code, and which are left from finished experiments. Which result folders does `context/` cite as evidence?
- What the repo carries that it does not need: size by directory, and the biggest files.

**Limits:**
- Fix flaky and broken tests and harnesses.
- Deletions wait for main.
- Do not add coverage for its own sake (deferred by the owner).

### 12. seams (audit only; owner: main)

**Scope:** cross-cutting, across `server/`, `src/`, `shared/` and `scripts/`.

**Look for:**
- `shared/contracts.ts` against the server routes and the client callers: fields one side sends and the other never reads, optional fields treated as required, types that lie.
- Every route in the route tables against every client `fetch` and WebSocket message: dead routes and missing routes.
- Every environment variable and feature flag (`process.env.*`, `import.meta.env.*`):
  - its default;
  - where it is set (Dockerfiles, `infra/`, deploy scripts, CI);
  - whether it can ever flip.
  - Flag a default-off flag that hides the product, and a default-on flag for something abandoned.
- The import graph: files nothing imports, exports nothing uses. Check dynamic imports and script entry points before calling anything dead.
- The same job done twice in different areas (two graders, two board renderers, two voice paths, two sign-in flows).

### 13. journey (audit only; owner: main)

**Scope:** the product as a child and a parent meet it, on default flags, at 360×640 and 412×860.

- Run the app locally with Playwright (Chromium is installed; do not install another). The browser tests show how to serve it with mocked APIs: see `lessonWith` in `tests/studio-stage-states.test.mjs` and the `*-browser.test.mjs` suites.
- Walk the journey: landing, sign-in, who is learning, onboarding and placement, home, starting a lesson, the board, an answer, a game, the end of a lesson, the parent corner.
- Report what is broken or poor on screen, with a screenshot per finding in `docs/design/round7/audit/journey/` (small PNGs). Dead ends, raw errors, English developer text, clipped or overlapping elements, tap targets under 44 px, and screens that contradict each other all count.
- Read `docs/design/OWNER-RESET-2026-10-04.md` first: it is the owner's standard.
- Say plainly which parts you could not reach without the live services.
