# BUILD-PLAN: from today to "the owner can test the full product thoroughly, and it works"

**Date:** 2026-10-04. **Author:** product lead, synthesising the six pillar audits in this folder, the world-best
STEAL-LIST and `context/`. **Status:** a plan. No code, kit, context or commit was changed to write it.

> **Rev 2 (2026-10-04, later the same day): Waves 2-4 rewritten for the superhuman product.** The owner's directive
> `owner-superhuman-teacher-2026-10-04` (full product now, no MVP; live building while she talks; an exact human
> voice; a relational OS; an AI teacher brain running the whole app) produced five specs in
> `docs/design/superhuman/` (TEACHER-BRAIN, LIVE-STUDIO, HUMAN-VOICE, RELATIONAL-OS, STUDENT-FLOW), reconciled by a
> critic pass into one system. Rev 2 places every build step of those specs into Waves 2-4, next to every item the
> waves already held.
> - **W0 and W1 are unchanged.** W1 is being built now. §2 and §3 are byte-identical to rev 1.
> - **Live Studio and Human Voice are pulled into W2.** That is the earliest slot that does not touch W1.
> - **The Teacher Brain stream owns the per-turn hot files from W2 onward** (§1.5). It extracts the turn into
>   `server/brain/turn.js` in W2.
> - **Owner inputs (§10) now include a measured deployment table.** It comes from a read-only ARM probe run today:
>   `evals/build-plan/deployments.mjs`, results in `evals/build-plan/results/deployments-2026-10-04.json`. Some asks
>   fit the existing quota and are one click. Others need a quota request, and §10.2 says which.
> - **Proposed context entries** are in `context/inbox/superhuman-specs.json`.

**Inputs read:**
- the audits: `flows-ux.md`, `live-content.md`, `teacher-anim.md`, `comprehension.md`, `personalisation.md`,
  `smooth-reliability.md`;
- `docs/research/world-best/STEAL-LIST.md` and the six sweeps;
- `docs/design/PRODUCT-DESIGN-V2.md` and `docs/ARCHITECTURE.md`;
- **rev 2:** `docs/design/superhuman/{TEACHER-BRAIN,LIVE-STUDIO,HUMAN-VOICE,RELATIONAL-OS,STUDENT-FLOW}.md` after the
  critic pass, the critic's report, `context/inbox/{teacher-brain,live-studio,human-voice,relational-os,
  superhuman-critic,stylised-teacher,w1-a,w1-b}.json`, `docs/design/teacher/polished/SCOUT.md`;
- `context/decisions.md`, `rejected.md`, `measurements.md` and `open.md`.

> **Correction to the brief.** The brief says the teacher face is now on Google GNM Head, with a fix round in
> progress. That is out of date. At 04:52 UTC today the main loop logged **`owner-rejects-generated-faces`**, which
> supersedes `gnm-adopted-identity-base`. In the owner's words, the GNM faces are "extremely bad and not polished
> and it's scary and cheap".
>
> The new direction:
> - start from professionally made, commercially licensed heads with ARKit blendshapes (for example Microsoft
>   Rocketbox + HeadBox, MIT);
> - keep our rig contract, runtime, lip-sync and behaviour;
> - show the owner a side-by-side, and let the owner choose.
>
> The AWS build budget is now up to $400. This plan follows that decision. The GNM fix round is stopped (commit
> `4e9157b`), and steal item 16 is rewritten below as "a licensed head, solved to our key contract".

---

## 0. The plan on one page

| wave | name | streams (parallel) | agent-days | exit means |
|---|---|---|---|---|
| **W0** | Ready the branch | main loop only | 0.5 | the branch passes the gates; seams are committed; migration numbers are allotted |
| **W1** | **Testable**: remove every blocker | A lesson truth · B live activities · C evidence you can trust · D platform, Conductor, probes · **F face track** | ≈ 45 | every flow can be tested end to end on a phone, in text and in voice. Activities load and count. Practice and Ask work after a lesson. A Young child can answer. The next day can be tested. Parents get daily notes. Errors page the owner. The owner picks a head |
| **W2** | **Complete, present and alive**: the full product works, and it is already the superhuman one | A experience and parent truth · B template renderers (the Studio fallback rungs) · C pedagogy P0/P1 · D voice lanes and presence · **E Teacher Brain I** · **F Studio build system** · **G Human voice** · **H Studio in the lesson** · **I Relational core and safety floor** | ≈ 119 | **the owner's thorough test of the whole product.** Every screen and both lanes work, and every parent number agrees. Things are built for the child and revealed on the teacher's cue, gated, graded and kept in a library. The voice breathes, pauses, hums and thinks aloud. A code kernel decides every turn, and the gap after the child speaks shrinks. She owns her slips, honours a goodbye, and holds the floor on dependency in both voice lanes. The chosen face is in every lesson |
| **W3** | **Breakthrough I**: evidence, beats and the bond | A verbal-fair evidence · B kit factory and counterfactual probes · C the personalisation loop and the day · D language activities, instant fills, G2 into the library · **E Teacher Brain II and the lesson the child sees** · **F Relational OS II** · **G Studio II** | ≈ 108-112 | understanding is graded in code and is fair to Hinglish, with an honest live comprehension number. The lesson runs in beats. Mid-lesson live builds answer this child's mistake. Images, mini-sites and about 40 archetypes exist. She remembers (with consent), keeps rituals and marks milestones. The child and the parent can see and delete her memory. English and Hindi get activities. The lesson follows a day plan |
| **W4** | **Breakthrough II**: this child, a human conversation, ready to prove it | A listening and the long conversation · B generated for this child · C research readiness · D reading, HD face, latency · **E Teacher Brain III** · **F family view, release batteries, journeys** | ≈ 73 | she nods while the child talks. Items come in the child's own interests, with proven-equal keys. Experiments run inside ethics with propensities. The parent sees how she teaches, with evidence. The relational, brain and journey batteries are release gates. "Still checking" is honest. The pilot can start |
| after | Phase 0 → Study A → Study B | research, with owner inputs | months | the breakthrough claims are earned on real children, including the bond outcomes (RELATIONAL-OS AT-C1-C6) and the turn-model gate on E1 children |

**Total:** about **347 agent-days** of build (345-349), including tests. Rev 1 had about 208. The arithmetic:
- **+140:** the five superhuman specs (TEACHER-BRAIN 35, LIVE-STUDIO 39, HUMAN-VOICE 14.5, RELATIONAL-OS 33,
  STUDENT-FLOW 19);
- **+15:** work the specs did not estimate: archetypes 13-40 and the batch lane, Studio truth fields in the kits,
  the first AT-B1 run on both lanes, bond instruments, and Studio variants as arms;
- **−16:** rev 1 items a spec now subsumes. W4-A's endpointing and echo became BR2b, W4-C's MRT plumbing became
  BR6, W2-D's pace recipe became B1, W2-C's `ui.affect` became R4, the W4-B arms moved into BR6, and the W3-D image
  library became S9.

Elapsed time per wave is its longest stream plus integration: W2 about 17 stream-days, W3 about 21, W4 about 16.
Azure spend for the build is in §10.5.

**What matters most:**
- **Wave 1 removes every gap that any audit rated "blocks testing"** (traceability in §9). Unchanged.
- **Wave 2 is the target the owner named.** It is the full product, working and testable thoroughly, and it now
  includes the four things the owner asked for by name: live building, the human voice, the brain, and the bond.
- **Waves 3 and 4 deliver the breakthrough pillars**, each behind measured gates (§7).

**Critical path:**
1. W1-C test clock (day 2), then the W1-D Conductor end-to-end test. Unchanged.
2. W1-F runtime port → head side-by-side → **owner pick (O1)** → W2-D face default-on.
3. **W2-F gate service (day 4) → W2-H library (day 8) → W2-H lesson integration (day 11) → the W2 Studio acceptance.**
4. **W2-E turn extraction BR1 (day 6) → Moment BR2 (day 8) → relational adapter BR5 (day 13) → W2-I AT-B1 on the
   cascade lane (day 15).**
5. **Owner blind ear test (O20) → the clip bank on by default.** Until then, breaks and markers ship without clips.
6. W3-E beats (BR3) → studio policy (BR4) → mid-lesson live builds on cue.
7. W3-B kit solvers → the X2 counterfactual gate → Study A. Unchanged.

**Two honest statements for the owner, stated once (rev 2 replaces rev 1's first statement):**
1. **"A game generated by code at that moment" is now real, and its limits are stated.**
   - **How a live build works.** A Foundry model writes new interactive code during the lesson, against one tested
     runtime (`studio-kit@1`). A strict gate plays the code against verified kit truth in an isolated Azure sandbox.
     Only then is it revealed, on the teacher's cue.
   - **What makes it safe.** The architecture makes the dangerous failures impossible: numbers and keys come only
     from the kit, words come only from a strings table that passed the safety check, the frame has no network,
     and the host grades every answer.
   - **Where human review goes.** A first-time live build is shown to one child, once. It may serve at most 20 more
     mounts before a sampled human review promotes it to the library (LIVE-STUDIO §3.11). This supersedes rev 1's O6
     law.
   - **The measured limit.** Generation takes about 37-54 s to playable (p50), so a live build needs about 90 s of
     lead. No archetype has met the live ship bar yet (P(pass by lead) ≥ 0.95 at n ≥ 30). **Until one does, an
     archetype is library-only:** built offline, gated, reviewed, and mounted in ≤ 1 s with this child's numbers,
     words and language.
   - **When each part ships.** W2 ships the library, lesson-start prefetch builds and the measured archetypes. W3
     adds mid-lesson builds aimed at a mistake the child just made.
2. **No breakthrough number exists yet.** The 0.659 comprehension figure measures a configuration that is not
   deployed. The live configuration scores 0.47-0.60. W1-C publishes the honest number. W3 is built to move it past
   0.70 with a verbal gap of 10 pp or less. Only Study A can make it a breakthrough rather than a claim. The same
   holds for the bond and the voice: the AI judge and the batteries are instruments, not proof. The owner's ear
   test, the panel and the pilot are what decide.

---

## 1. Ground rules for every wave

1. **Gates.** Every stream passes all of the following before it hands in:
   - `npx tsc -b && npx vite build && npm test`;
   - `node scripts/check-prompt-budget.mjs`;
   - the persona-invariants, never-rules and parse evals inside `npm test`.

   No stream ships with a red gate. "If your change trips the floor tests, your change is wrong."
2. **The child-safety floor is above every stream:**
   - never deny being an AI;
   - Childline 1098 and Tele-MANAS 14416;
   - no romance or companion register;
   - safeguarding hand-off.

   Any stream touching `server/compiler/**` or `server/director/say.js` re-runs `evals/persona-invariants.mjs` and
   `evals/never-rules.mjs`.

   **Rev 2 addition:** any stream touching `server/relational/**`, `server/brain/**`, `server/director/safety.js`
   or the reply path also re-runs the RELATIONAL-OS adversarial battery (AT-B1) **on both voice lanes**, realtime
   and cascade. The relational floor (F1-F6, F8-F9) ranks first in the kernel's authority order (TEACHER-BRAIN
   §10.1), above the child's goodbye, consent, parent controls, caps, cost, the plan and pedagogy.
3. **Azure-only runtime.** Every model is an Azure Foundry Direct deployment. AWS is used only for build-time GPU
   (face conversion, offline lip teacher), within $400. The probe fleet runs on Azure Container Apps.

   **Rev 2 addition: hot and background lanes never share a quota pool** (`superhuman-quota-isolation`):
   - the hot lanes are reply, classify, distress and realtime;
   - the background lanes are Studio plan and build, memory consolidation, the voice annotator, parent texts and the
     router bench.

   Every model call is tagged `lane: hot | background` (`server/lanes.js`, imported by `server/azure.js`).
   Background calls go to their own deployments (O13). Until those exist, a token bucket caps background calls at
   30% of any shared deployment's TPM. The TEACHER-BRAIN spec names `server/router.js` for this, but that file is
   the HTTP router; the model client is `server/azure.js`.
4. **English chrome.** Every new child or parent label goes through `src/copy/en.ts`. Speech stays Hinglish or
   English as the register rules say.
5. **Owned paths are exclusive inside a wave.** Each wave also has **hot files** that exactly one stream owns:

   | wave | hot-file owner |
   |---|---|
   | W1 | A owns `server/routes/lesson.js` and `server/director/state.js` |
   | W2 | **E (Teacher Brain I) owns `lesson.js` and the new `server/brain/**`**. BR1 moves `turn()` and `planTurn` into `server/brain/turn.js`. C owns `state.js` |
   | W3 | **E (Teacher Brain II) owns `lesson.js`, `server/brain/**` and `state.js`**. Beats drive the Director |
   | W4 | **E (Teacher Brain III) owns the same.** Nobody else edits them except through seams |

   Other streams reach hot files only through **seams**: pure modules they own, with call sites the main loop
   commits in the wave's seam commit (W0, and the first hour of each wave). From W2 onward every other component
   reaches the turn as a **proposer**: a pure module that returns typed proposals and facts to `kernel.arbitrate`
   (TEACHER-BRAIN TB1). That is what lets nine streams work in parallel without touching the turn.
6. **Migrations.** The main loop allots the numbers in the seam commit. W1 gets 012-015 (§2). Every migration is
   applied to production by the integration step, and `tests/migrations-applied` is a gate. Rev 1 said it fails
   today because `008_tutor_choice.sql` is not applied. That is stale: W0 found 008 already applied
   (`w1-migration-allotment`).

   **W2 allotment:**
   - 016 to E (`016_brain.sql`: `decision_record`, `brain_trace`, `lesson_plan`, `format_posterior`, population
     rows only);
   - 017 to H (`017_studio.sql`: `studio_build`, `studio_library`, `studio_mount`);
   - 018 to I (`018_relational.sql`);
   - 019 to A (home states, if needed);
   - 020 reserved for C.

   W3 and W4 numbers are allotted in their seam commits.
7. **Production acceptance harness.**
   - D builds it in W1; every stream adds one file per workstream.
   - It lives in `tests/prod/lib.mjs`. It follows the `scripts/prod-smoke.mjs` flow: signup, consent, open the
     hours, child, lesson, `DELETE /api/account` in a `finally`. It counts leftover `@taxila.test` guardians before
     and after.
   - It launches Playwright with `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`, `proxy: {server: HTTPS_PROXY}` and
     `ignoreHTTPSErrors`.
   - `node tests/prod/run.mjs --wave N` runs every wave up to N as regression.
   - **Timing gates run only from the Azure probe fleet, with no route interception.** Interception disables the
     HTTP cache and preload matching (`b4-rejected-perf-with-route-interception`). The sandbox fetch-routing
     fallback is for correctness checks only.
   - **Rev 2: timing gates run from Central India.** Every number in the superhuman specs is US sandbox → eastus2.
     The acceptance numbers below are Central India numbers, n ≥ 30 unless stated.
8. **Logging is not optional.** Each stream writes `context/inbox/w<N>-<stream>.json`:
   - decisions with reversal conditions;
   - measurements with n, method and date;
   - rejections with what broke.

   The main loop merges them before the next wave starts.
9. **Deploy order.** Integration day: merge, gates, `git push`, then `node scripts/deploy-azure.mjs`. From W1-D
   onward that script refuses to deploy without a gate stamp, and it smoke-tests the new revision at 0% traffic.
   Then the full prod battery runs.
10. **Rev 2: one owner per shared thing** (TEACHER-BRAIN §21.1). Streams consume these and never re-implement them:

    | shared thing | owner |
    |---|---|
    | bands | `shared/bands.ts` (B1-B4 by class) |
    | the per-turn authority order | the kernel |
    | teacher affect | RELATIONAL-OS `appraise()` → `Moment.teacherAffect` |
    | memory | RELATIONAL-OS `consolidate.js`, `claims.js` and `callbacks.js` |
    | stages | RELATIONAL-OS §5.2. Stages never regress and carry no usage keys |
    | turn timing | TEACHER-BRAIN §5.4 |
    | what Studio may build | TEACHER-BRAIN §6.3 |

    A stream that needs a second producer of one of these stops and asks the main loop.

---

## 2. W0: ready the branch (main loop, 0.5 day)

- **Gate the branch.** 17 commits since the deployed `aa263ce` are "WIP (not gated)". Run the gates on HEAD.
  `server/`, `src/`, `shared/` and `db/` are unchanged since `aa263ce`, so expect green. Any red WIP path outside
  art is fixed or reverted before W1.
- **Stop the GNM track.** Tag it as superseded in the graph (already done in `e43ad63`). Leave
  `scripts/character/bakeoff/gnm` in place, because the history of the wrong turn is the asset.
- **The W1 seam commit** (no behaviour change; every seam is a no-op until its owner fills it):
  - `server/routes/lesson.js`:
    - replace the inline `forgeSeam` (`:426-430`) with an import from `server/forge/seam.js` (owned by B);
    - call `server/conductor/hooks.js` `onLessonStart / onTurnCommit / onLessonEnd / onConsentChange` inside the
      existing transactions (owned by D);
    - call `server/comprehension/session.js` `loadSessionContext(childId)` at start and `awaitSettled(eventIds,
      600)` at the next turn (owned by C).
  - `server/director/state.js`:
    - `planModule({kit, item, move, lang, band, representation})` gets its new signature (owned by B);
    - `selectReteach` receives `ctx.reteach` from `loadSessionContext` (filled by C).
  - `src/child/lesson/Desk.tsx`: pass `onModuleFailed` from `WorkTray` (B) to a `useDesk` handler (A).
  - Migration numbers: 012 and 013 to C (pending grade, re-teach resolution); 014 to D (Conductor hooks, if needed);
    015 to A.
  - A `tests/prod/lib.mjs` skeleton.

---

## 3. Wave 1: TESTABLE (remove everything that blocks testing)

Four code streams plus the face track. All five start together after W0.

### W1-A: Lesson truth and answer surfaces (≈ 8 d)

**Closes:**
- flows G1, G3, G4, G5, G6, G8 and the client half of G2;
- comprehension G11;
- personalisation 13;
- live-content 10 (the "/" key);
- smooth G4 (text-lane voice lag) and G8 (the hours refusal).

**Owned paths:**
- `src/child/lesson/**` except `WorkTray.tsx`;
- `src/child/screens/**`, `src/child/{prefs,plan,api}.ts`;
- `src/lesson/{textLink,ttsStream}.ts`;
- `src/parent/Controls.tsx`;
- `server/routes/lesson.js` (hot) and `server/routes/tts.js`;
- `server/director/{state.js (hot), say.js, items.js, classify.js, shapes.js, units.js, register.js}`;
- `tests/director-truth.test.mjs`, `tests/prod/w1a-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Send `purpose: "practice"` from Practice and `purpose: "doubt"` from Ask. Map a 409 `LessonStartRefused` to the designed done, capped and resting screens (V2 §6.3.3), never "We couldn't start the lesson" | 0.5 |
| 2 | The resting screen names the control that refused, and opens at a stated time. The parent Controls page gets a one-tap "Open now for 1 hour" | 0.5 |
| 3 | Young answers: <br>• a NumberPad for every `answerForm:"number"`, with the help overlay closing over it rather than replacing it; <br>• `ui.chips` and item choices as picture tiles; <br>• "Show me choices" becomes a client action, and the server answers with `ui.chips` for the *current* item; <br>• help phrases are never recorded as the child's words in transcripts, evidence or "In {child}'s words" | 1.25 |
| 4 | Choice items: the server never sends `tray:"module"` or `tap_in_tray` without a live mount. The client restores Type and tiles when a module fails | 0.5 |
| 5 | Ask parity: <br>• a server lint that the reply ends on `ui.ask.text` and holds one question; <br>• a corrective move re-poses the same item before moving on; <br>• `repair` never fires on `typed:true` | 1.25 |
| 6 | Hints: child-facing hint text for diagnostic items; strip `^\w+:` rung labels; a lint over `ui.hint.text` for shape words; a hint request shows as a chip state ("Hint asked"), not as "Your answer" | 0.5 |
| 7 | "Skip for now" skips the item. Only explicit stop words, or Pause → End, end the lesson | 0.25 |
| 8 | Cap unclear tries at 3 per item, then chips or move on (`no_evidence`). Wrap language ("Aaj ke liye bas itna") is allowed only on `wrap` moves | 1.0 |
| 9 | "Tap and type only" in Controls (per child) and "Type instead" in Me, wired to `prefs.quiet`. The push-to-talk note is dismissed once, for good | 0.75 |
| 10 | Text lane: `TextLink` uses `tts-stream` + `PcmStreamPlayer`, with `prewarm()` from `/turn`. In text mode the dock opens while she speaks (typing is barge-in). `/api/tts` stays only for "Hear" | 1.25 |
| 11 | A "/" key on the Older pad in fraction topics. The number-pad clipping at 360 px is fixed | 0.25 |

**Acceptance (production):**
- `w1a-practice-ask.mjs` (Playwright 360×640): after a finished lesson, Practice and Ask start (201) and reach a
  first turn. A child outside the hours sees the resting screen, and one parent tap opens a lesson.
- `w1a-young-text.mjs`: a class-2 "Type instead" lesson commits **at least 3 answers in 12 turns or fewer**:
  - a NumberPad is visible on 100% of number items;
  - "Show me choices" renders tiles that include the current item's key;
  - the parent transcript holds **0** help phrases.
- API battery, 30 turns each at classes 5 and 8:
  - 0 turns where the reply's final question differs from `ui.ask.text`;
  - 0 two-question turns;
  - 0 `repair` moves on typed input;
  - 0 shape words in `ui.hint.text`;
  - Skip poses the next item.
- Text lane, from the Azure probe: first teacher audio within **400 ms** of the turn response (p50, n ≥ 20).
- `tests/director-truth.test.mjs` replays the audit's exact transcripts: "13 ka square", "Choices dikhao" and the
  12-turn repair loop.

### W1-B: Live activities that load and count (≈ 8 d)

**Closes:**
- live-content 1, 2, 3, 4 and 5, plus `mode:"show"` from 10;
- the server half of flows G2;
- personalisation 4 and 6 (Forge per-child fills reach the lesson).

**Owned paths:**
- `server/director/modules.js`, `shared/engine-catalog.js`, `shared/engine-topic-map.json`,
  `scripts/engine-topic-map.mjs`;
- `src/modules/**`, `src/child/lesson/WorkTray.tsx`, `src/lesson/{moduleChannel,moduleEvents}.ts`;
- `server/forge/**` except `g2/`; `server/forge/seam.js` (new); `server/routes/forge.js`;
- the engine-hint fields in `data/kits/**`; `scripts/lint-kits.mjs` (new);
- `evals/engines-*.mjs`, `evals/forge-g1*.mjs`, `tests/prod/w1b-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Replace `planModule`'s picker with the catalog's `planEngine` + `moduleCommands()`: <br>• store `itemId` and `awaitingReveal`; <br>• never emit an id outside `ENGINES`; <br>• send valid modes only. <br>This makes decision `engines-v1-catalog-binding` true, and `rj-first-hint-engine-id` fixed in production | 1.25 |
| 2 | Kit lint over engine hints: <br>• map the 156 catalog-resolvable aliases; <br>• the roughly 648 hints with no engine write `forge_gap` demand rows instead of mounts | 0.75 |
| 3 | Frame height: the `ModuleHost` wrapper and tile get `height: 100%`, plus a Desk-level Playwright geometry test | 0.5 |
| 4 | A module failure becomes a client event. The Director clears `s.module`, and `screenHasTargets` turns false, so she stops pointing at nothing. The tray drops at once | 1.0 |
| 5 | Forge G1 in the lesson: <br>• `prefetchLessonFills` at start, through the seam; <br>• `requestFill({needByMs: 2000})` on practice, probe and retrieval items with no bound plan; <br>• the answer is graded on the server, never trusting the frame's `correct`; <br>• `render-check.mjs` drives `scene@1` fills, then `scene@1` turns on by default in `planner.js` | 3.0 |
| 6 | Bound mounts on practice, probe and retrieval items. Interaction facts are emitted as evidence events tagged `source: module` (C applies the ×0.75 weight) | 1.5 |

**Acceptance:**
- **Offline:**
  - `tests/director-mounts.test.mjs`: every mount over all 830 kits is a member of `ENGINES`;
  - `evals/engines-coverage.mjs` for c4-c7: maths ≥ 105 of 141, science ≥ 21, EVS ≥ 6 (from 6, 0 and 0).
- **Production API** (a rerun of the live-content M1 probe, 8 topics × 10 turns):
  - **0 unknown-engine mounts**;
  - at least 1 item-bound mount in every maths lesson;
  - at least 1 G1 mount per science or English lesson that has a derivable item;
  - a bound module answer writes a `kt_evidence` row with source `module`.
- **Production Playwright** at 360×800:
  - iframe height equals tray height (±2 px), and every engine control lies inside the frame;
  - a forced unknown engine leaves no empty tray after one turn, and the next teacher line has no screen
    reference.
- **Owner input O5a:** a teacher reviews the bound adapters, about 2 hours. That review is the reversal condition
  of `engines-v1-catalog-binding`.

### W1-C: Evidence you can trust (≈ 9.75 d)

**Closes:**
- comprehension G1, G2, G3, G8 and G9;
- personalisation 1 (the re-teach loop) and 2, on the M1 path, which needs no owner decision;
- open item `ledger-game-full-weight`.

**Owned paths:**
- `server/comprehension/**` (including the new `session.js`), `server/learner/**`;
- `server/conductor/clock.js` (single-file carve-out);
- `evals/comprehension-sim/**`;
- `db/migrations/012-013`;
- `tests/comprehension-*.test.mjs`, `tests/prod/w1c-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Reword the English `shallow` row in `howweknow.js` (it contains the banned word "behind"). Fix "1 days". Test every state × language × refresh | 0.5 |
| 2 | Held-verdict settle: <br>• `awaitSettled` waits up to 600 ms; <br>• verdicts are written to the DB by event id the moment they land, so any replica can read them; <br>• a late verdict is applied as a replay-safe correction; <br>• a settle-rate metric is logged per turn | 2.0 |
| 3 | A test-only clock for `@taxila.test` accounts: <br>• a server-side offset, logged; <br>• refused (403) for real accounts. <br>Delivered by **day 2**, because D's Conductor end-to-end test needs it | 1.5 |
| 4 | A `live` simulator policy: <br>• the real `LIVE_PROBE_SHAPES`, the real `kitInputsOf()`, production grader routing and the settle-latency distribution; <br>• it becomes the headline row; <br>• the run fails when `engine` and `live` diverge by more than 0.03 without a logged reason. <br>Also the oracle-prober (X1) and a gamer / rank-exploit policy, so mutant VC4 fails (X7) | 2.0 |
| 5 | The re-teach loop on the academic record (M1): <br>• resolve `reteach_attempts` at `repaired_now`, `resolved_next` and `resolved_delayed`; <br>• write `arm_posteriors` (population, no child id); <br>• load the child's attempts and `rep_fluency` at lesson start; <br>• track `failedArmsThisSession`, so prerequisite descent and park can fire. <br>RT-M2 sim gate at 20 seeds | 3.5 |
| 6 | `bktr.js temper()` source weights: game ×0.5, module ×0.75 | 0.25 |

**Acceptance:**
- The card is non-null for 5 states × 3 languages (unit test). On production, the card shows after a scripted
  lesson.
- Production, 30 lessons at reply delays of 0, 1, 2 and 4 s: **settle rate ≥ 95%** (was 0/5 at 0 s).
- `w1c-three-day.mjs` on production:
  1. day 0 lesson;
  2. +1 d: the C31 check fires in the opener, and a correct answer moves the state above `shallow`;
  3. +3 d: the woven check;
  4. the parent card wording changes.

  A real account asking for an offset gets 403.
- The `live` row is in `measurements.md`, with n, as **the** comprehension number. VC4 and the gamer each fail at
  least one bar.
- Re-teach, read from a test account's rows: two failed arms lead to a different arm and then prerequisite descent,
  and `reteach_attempts` rows resolve. RT-M2 beats random arms.

### W1-D: Platform: deploys, eyes, Conductor, probe fleet (≈ 9.5 d)

**Closes:**
- smooth G1, G2, G3 and G9, and the config parts of G10;
- leftover test guardians;
- `migrations-applied`;
- the "unverified from the sandbox" items for WebRTC voice and India latency.

**Owned paths:**
- `scripts/deploy-azure.mjs`, `scripts/deploy-worker.mjs`, `.github/workflows/**`, `infra/**` (including
  `infra/probes/**`);
- `server/router.js`, `server/index.js`, `server/serve.mjs`, `server/worker.mjs`, `server/db.js`;
- `server/conductor/**` except `clock.js`;
- `Dockerfile*`, `src/main.tsx`, `src/app/beacon.ts` (new);
- `scripts/sweep-test-accounts.mjs`;
- `tests/prod/lib.mjs` and `tests/prod/run.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Gated deploys: <br>• `deploy-azure.mjs` refuses without a gate stamp for the sha; <br>• Multiple revision mode, with `prod-smoke` run against the new revision at 0% before traffic moves; <br>• `--rollback`; <br>• GitHub Actions runs the gates on push | 1.0 |
| 2 | Eyes: <br>• a Log Analytics workspace on `taxila-env` and `taxila-forge-untrusted`, with a daily cap; <br>• one JSON access-log line per request: route, status, ms, revision, hashed lesson id, error class; <br>• a client error beacon (`POST /api/client-error`, rate-limited, no child text); <br>• a DB check on readiness only; <br>• email alerts: 5xx above 1% over 5 min, replica restarts, turn p90 above 3 s, worker liveness, failed Forge executions | 2.0 |
| 3 | Backups: <br>• point-in-time restore 7 d, daily Neon snapshots, protect `main`; <br>• Blob soft-delete and container soft-delete; <br>• one timed restore drill; <br>• test scripts default to the Neon test branch | 0.5 |
| 4 | Conductor live: <br>• fill `hooks.js` with `ingestStmt` inside the lesson transactions, plus an inline `step()`; <br>• run `deploy-worker.mjs`; <br>• an ACA scheduled job for the nightly rollups and the canary; <br>• an e2e on a Neon branch: a lesson day yields `report.daily` at 04:10 IST the next day, and a Sunday yields `parent.letter`. <br>The `forge.g2.nightly` build half stays **paused** until W3-D delivers, so no money is spent on builds nobody can receive | 3.5 |
| 5 | **The probe fleet**, ACA jobs in **Central India** and eastus2: <br>• Playwright Chromium with `--use-fake-device-for-media-stream` and a fake-audio WAV of a child-like Hinglish answer; <br>• runs a realtime WebRTC lesson; this works because ACA has UDP and TURN egress, which the sandbox lacks; <br>• runs page loads without interception; <br>• nightly, results to Blob, an alert on regression. <br>This closes "voice cannot be verified" and "no India latency" without the owner | 2.0 |
| 6 | Hygiene: <br>• apply `008` and gate `migrations-applied`; <br>• a sweeper for `@taxila.test` guardians older than 1 h (the 6 leftovers go); <br>• restrict `/api/health?db=1`; <br>• pool idle timeout 10 min; <br>• Neon suspend off on `main`; <br>• `taxila-web` at 1 vCPU; <br>• ACA session affinity | 0.5 |

**Acceptance:**
- A deliberately failing test blocks a dry-run deploy. `--rollback` restores traffic in under 2 minutes, timed.
- A forced 500 on a test-only route appears in Log Analytics within 5 min and emails the owner. A thrown client
  error appears as a beacon row.
- After a production test lesson plus C's clock at +1 d:
  - `student_event`, `conductor_state` and `day_plan` have rows;
  - `report.daily` exists, and the parent "reports" area shows it;
  - a Sunday produces a letter.
- The probe fleet, from Central India, completes a realtime WebRTC lesson:
  - ICE connected;
  - first teacher audio;
  - the fake child answer is transcribed;
  - the turn advances.

  The India RTT, cascade composite and page-load numbers are logged in `measurements.md`, with n and method.
- The restore drill is timed and logged.

### W1-F: Face track (standing stream, W1 to W2)

**Direction:** `owner-rejects-generated-faces`. The runtime work is unchanged by the face choice, because the
`HeadRig` contract is the seam.

**Owned paths:**
- `src/avatar/**`, `src/ui/teacher/**`, `src/stage/**`;
- `shared/tutors.js` (`lookId`);
- `public/assets/teacher/**`, `public/assets/teacher-bakeoff/**` (to move out);
- `scripts/character/**`, `art/character/**`, `docs/design/teacher/**`;
- `evals/avatar/**`, `tests/avatar-*.test.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Port the runtime (`viewer/{rig,shaders,presets}.js` → `src/avatar/three/*.ts`) behind `HeadRig`: <br>• `GLTFLoader` + `KTX2Loader` + `MeshoptDecoder` in the lazy `stage3d` chunk only; <br>• an opaque WebGL2 context (`stage3d.ts:98` passes `alpha: true` today); <br>• tiers B+ / B-lite / D / E; <br>• the D plate is **rendered from the same rig**, so every fallback is the same person; <br>• `lookId` per tutor; <br>• plate at t = 0, GLB off the cold path, cross-fade only in her silences, 8 s timeout. <br>Behind the flag `face.rig` (default off). The procedural head and the SVG plate leave the lesson path when the flag turns on | 6.0 |
| 2 | **Licensed-head sourcing:** <br>• 3-5 candidates per teacher: Rocketbox + HeadBox (MIT) and other commercially licensed heads with ARKit-52; <br>• each converted to the contract (morph names, `runtime.json`, budgets ≤ 2.2 MB B+); <br>• a side-by-side page in `/dev/avatar`: neutral, a 10 s talking clip on real TTS, 5 emotions, the D plate. <br>→ **Owner pick (O1).** If nothing clears the owner's eye, the reversal applies: a professional *stylised* base | 3.0 |
| 3 | Asset hygiene: <br>• move `teacher-bakeoff/**` out of `public/`, which removes publicly reachable generated identities and 59 MB from the image; <br>• versioned, immutable `/assets/teacher/<look>/<lookRev>/` URLs | 0.5 |

**Acceptance:**
- Production Playwright, GPU-spoof arm, `face.rig` on for test accounts:
  - `.glb` appears in the network list and `data-tier=B`;
  - a forced load failure falls to D showing **the same look** (a V-FACE test: every face on the site is a
    pickable face);
  - `/assets/teacher-bakeoff/*` returns 404.
- The side-by-side page exists, and the owner's verdict is logged as a decision.

**Wave 1 exit (integration day):**
- merge the inbox files;
- gates;
- push and gated deploy;
- `node tests/prod/run.mjs --wave 1` green;
- the live-content and flows audit probes re-run, with the deltas logged.

> **What the owner can test after Wave 1:**
> - **Flows:** every flow end to end on a phone, classes 1-9, by typing, tapping or voice. That includes Practice
>   and Ask after the day's lesson, and a 7-year-old answering with picture tiles and the number pad.
> - **Activities:** on-screen activities that load at full size and count as evidence.
> - **Days:** "tomorrow" and "in three days" via the test clock, a daily parent note and a Sunday letter.
> - **Monitoring:** an email the moment production breaks.
> - **Face:** choose the teacher's head from the side-by-side.

---

## 4. Wave 2: COMPLETE, PRESENT AND ALIVE (the full product works, and it is the superhuman one)

Nine streams. Wave 2 starts when the W1 exit battery is green. The face default-on waits for O1. The clip bank
default-on waits for O20.

**The W2 seam commit** (main loop, first hours; no behaviour change, every seam a no-op until its owner fills it):
- **Contracts (types only):**
  - `shared/bands.ts` (Band4 B1-B4 by class, from LEARNER-MODEL §3);
  - `shared/brain.ts`, `shared/studio.ts`, `shared/relational.ts`;
  - `shared/contracts.ts` additions:
    - `TurnResponse.studio?`, `TurnResponse.moment?`;
    - `UiDirectives.beat?`, `UiDirectives.studioSlot?`, `UiDirectives.teacherAffect?`;
    - the `AvatarVoiceEvent` frame (`laugh | breath | hum` with `atMs`);
  - the comprehension evidence source enum gains `studio`.
- **Seams in the turn path** (owned by E, which keeps the call sites when BR1 moves the turn):
  - `server/studio/seam.js` (H): `prefetch(lessonCtx)`, `statusFacts(lessonId)`, `onReveal`;
  - `server/relational/seam.js` (I): `snapshot(childId)`, `decide(...)`, `onLessonEnd`;
  - `server/voice/expressive/seam.js` (G): `planDelivery(moment, reply)`;
  - `server/lesson/purpose.js` (A): Ask routing and the practice set at `start()`.
- **Quota lanes:** `server/lanes.js` (E). `server/azure.js` (F) gains a `lane` option that is ignored until E fills
  the module.
- **Client slots:**
  - `src/child/lesson/WorkTray.tsx` gains a `studio` kind that renders `src/studio/StudioStage.tsx` (H's stub);
  - `src/lesson/floor.ts` imports `src/lesson/safetyStrings.ts` (I);
  - `server/routes/voice.js` calls `server/voice/realtimeSession.js` (D).
- **Re-exports:** `server/learner/writer.js` re-exports `server/relational/writers.js` (I).
- **Migration numbers:** 016-020 (§1.6).

### W2-A: Child and parent experience complete, one parent truth, and the new home states (≈ 14 d)

**Closes:**
- flows G7 with comprehension G4 (merged: one claim source);
- flows G9 copy, G10 and G11 (client), G12, G13, G14, G15 and G16;
- smooth G6 and the remaining G10 polish;
- **STUDENT-FLOW SF1.**

**Owned paths:**
- `src/child/**` except `lesson/WorkTray.tsx`, `lesson/Board.tsx` and `interests.ts`;
- `src/onboarding/**`, `src/app/**`, `src/pages/**`, `src/parent/**`, `index.html`, `src/main.tsx`;
- `server/routes/{child.js, parent.js, account.js}`, `server/lesson/purpose.js` (new; called from `lesson.js`
  through the seam);
- `server/auth.js`, `server/reports/**`, `server/serve.mjs`;
- `db/migrations/019_*.sql`, `tests/prod/w2a-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **One claim source per child per day** (the ledger projection plus the engine's graded events) feeds home, progress, lesson card, map, notes and the child summary: <br>• `introduced` with no evidence shows "Not started"; <br>• one next-topic function, and one minutes and lessons definition; <br>• the evidence sheet shows the real prompt, answer and quote, with the grader named ("exact answer" / "checked against the book's key idea"); <br>• summaries are built from facts and pass a claim checker. <br>This replaces "8/8 unaided" from the lenient classifier | 4.0 |
| 2 | Landing copy: "your child names the teacher" now, and "chooses a face" only when O1 delivers more than one look per band. Teacher names are filtered to fit the teacher | 0.25 |
| 3 | Quick practice on the client: "Practice · n of 5" and "That's the set". Ask sends `firstText` in `LessonStartRequest`, is routed by `purpose.js` to the matching topic (or the book/chapter picker), and is titled by the question. The Director halves are in W2-C | 1.25 |
| 4 | Onboarding and sign-in: <br>• field-level errors, never raw API strings; <br>• Show password; <br>• **Forgot password by email** on Azure Communication Services Email (Azure-managed domain, so no owner input); <br>• the step-8 sound and mic check; <br>• no "Step 4 of 8" on sign-in; <br>• the "Respectful" default for class 5+ | 1.5 |
| 5 | No PIN re-gate inside Add a child. Hello: no second audio gate; Who shows the chosen pictures; Young can reach Me; stale titles fixed | 0.75 |
| 6 | Lesson screen: <br>• a visible per-item verdict mark, from the verified classifier only (V2 §4.6); <br>• one Send button on desktop; <br>• the question card keeps its context sentence; <br>• one language per hint line; <br>• the teacher label sits next to her face | 1.0 |
| 7 | Garden and Sky: her line plus **Hear {T}** on the plant sheet; child-language labels; visible 48 px stars | 0.75 |
| 8 | Speed: <br>• inline skeleton and hero preload; <br>• `/api/me` started before the bundle parses; <br>• `/api/child/boot` merges me, plan and tutors (3 serial hops become 1); <br>• pre-compressed brotli; <br>• no 401 on the public landing; <br>• the summary card shows from local state while the parent note fills in later | 2.5 |
| 9 | **SF1, the home states** (STUDENT-FLOW §4.2): <br>• contracts `ChildHomeState` + `homework`, `test_window`, `safety_hold`; <br>• plan states from the Conductor; <br>• the Home primary card for every state, with one primary action (F1); <br>• the **Made for you** mini-shelf, hidden until it has data (W2-H fills it); <br>• the **safety_hold** home shows the Help sheet and no lesson; <br>• the parent corner's "Made for {child}" list, read from W2-H's `studio_mount` feed (the full daily card is W4-F) | 2.0 |

**Acceptance (production):**
- `w2a-parent-truth.mjs`, the G-PARENT-1 test, for 3 children (one with no answers, one mixed, one strong):
  - state, next topic, minutes and lesson counts are **identical** across all six surfaces;
  - the no-answer child shows "Not started" and no sprout;
  - the evidence sheet shows the real item and the child's words;
  - the claim checker passes on 20 summaries.
- Practice: no greeting, 5 items or fewer, the counter and "That's the set".
- Ask: a fractions question is filed under fractions and titled by the question.
- Forgot password works end to end with a test mailbox token.
- From the Central India probe:
  - landing LCP ≤ 2.5 s on Slow 4G + 4× CPU (was 3.3 s from the US; Fast 3G reported alongside);
  - child home first paint ≤ 3.0 s on Slow 4G.
- The flows-audit screenshot battery re-run at 360 and 1280: no horizontal scroll; the visual baselines updated.
- `w2a-home-states.mjs`:
  - each of the five Home states renders exactly one primary action;
  - the 1-day and 30-day gap homes are identical apart from topic and plant state (STUDENT-FLOW F7);
  - `safety_hold` offers no lesson start.

### W2-B: Template renderers, the Studio fallback rungs, and a teacher who sees the screen (≈ 10.75 d)

**Closes:** live-content 6, 7(a), 7(b) and the frame pre-warm from 10; personalisation 5 (the five missing interest
skins).

**What changed in rev 2:** these items are now rungs 4-5 of the Studio fallback ladder (LIVE-STUDIO §3.12):
T1 engine, then G1 / `scene@1` / `explainer@1` template. When a live or library build is late or failed, the
child still gets a correct animated explanation or diagram. The work is unchanged.

**Owned paths:**
- `src/modules/**`, `src/child/lesson/{WorkTray,Board}.tsx`;
- `server/director/modules.js`;
- `server/forge/**` except `g2/`; `shared/forge.ts`, `shared/engine-catalog.js`;
- `evals/forge-*.mjs`, `evals/engines-*.mjs`, `tests/prod/w2b-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **The teacher sees the screen:** `moduleFacts(s.module)` (engine, mode, values on screen) becomes a telegraphic row, never sentences. It shares one shape with `StudioFacts` (LIVE-STUDIO §10), so the Brain reads one facts row whatever is on screen. The worked-example parameters come from the same source as the teacher's content | 1.25 |
| 2 | **`explainer@1` animated explanations:** <br>• port `explainer-dsl.mjs` as a frame engine; <br>• a G1 template fill (the model fills data, code animates); <br>• requested on the move *before* explain, so her ~2 s preamble covers the 2.88 s fill | 4.5 |
| 3 | **Diagram templates on `scene@1`:** label, parts, flow, cycle and compare, for science, EVS and SST (the subjects with almost no engines). Labels are drawn by code | 3.5 |
| 4 | Pre-warm the frame and the topic's engine chunk at lesson start (first mount 0.7-1.0 s → ≤ 150 ms) | 0.5 |
| 5 | Interest skins and HOOKS for football, drawing, stories, building and nature, with a Content Safety pass in `evals/forge-g1.mjs`. The shared registry itself is C's | 1.0 |

**Acceptance:**
- An eval over 30 or more explain turns in fraction and number topics: the numbers the teacher says match the
  module's parts **100%**.
- A production probe on 12 topics (4 maths, 4 science, 4 EVS/SST):
  - an animated explainer or a diagram appears on explain moves in at least 10 of 12;
  - first paint is ≤ 300 ms after the explain turn response (p90, Azure probe).
- Strict render-check (steal 19 style): the **all-checks** pass rate is ≥ 95% per template, with means never
  reported.
- A warm first mount takes ≤ 150 ms.
- **Rev 2:** with Studio forced off (`studio.enabled=false` for a test account), every explain beat still shows a
  ladder rung. 0 empty trays over the 12 topics.

### W2-C: Pedagogy and personalisation P0/P1 (the Director) (≈ 11.5 d)

**Closes:**
- personalisation 3, 10 (server), 11, and the gap-4 registry;
- the Director halves of flows G10 and G11;
- steals 2, 4 (profile), 5 and 10.

**Rev 2 change:** rev 1's item 7 (`ui.affect` on verified outcomes) moved to W2-I. RELATIONAL-OS `appraise()` is the
only producer of teacher affect (§1.10), and it never keys affect to correctness. The teacher-anim gap-3 emission
now arrives through it.

**Owned paths:**
- `server/director/**` except `modules.js`, `safety.js` (W2-I) and `classify.js` (W2-E); C owns `state.js`
  (hot);
- `server/compiler/**`, `server/persona/**` except `signals.js` (W2-E);
- `server/learner/**` except `affect.js` (W2-E) and `mode.js` (W2-I);
- `server/comprehension/**`;
- `shared/learner.ts`, `shared/interests.js` (new), `src/child/interests.ts`;
- `evals/director-sim.mjs`, `evals/never-answer.mjs` (new), `evals/persona-invariants.data.mjs`,
  `tests/prod/w2c-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Switch `lesson/start` to the v2 brief (`renderChildBrief`: SKILLS, PREREQ, WATCH, REVIEW, SUPPORT/fade), under the prompt budget and the position tests | 1.5 |
| 2 | **The guidance ladder with backward fading (steal 2):** <br>• `guidanceLevel(skill) ∈ {example, faded, attempt}` from pL plus a one-turn "what would you do first?" probe; <br>• `server/director/fading.js` reads the kit's unused `workedExample.fadedVersion`; <br>• the whiteboard holds the steps; <br>• for classes 1-2, ask about the process. <br>This also fixes the struggling child being sent attempt-first in lesson 2 | 4.5 |
| 3 | The equity profile (steal 4): low-baseline children get a worked example first and **one next step, never a menu** (`rj-advice-menu-for-weak-learners`). The tercile *gate* is W4-C | 1.0 |
| 4 | The never-an-answer floor test (steal 5): 30 "just tell me" variants in Hindi, English and Hinglish, including pressure, parent impersonation and "my teacher said", scored by `revealsAnswer()` through `director-sim` | 1.0 |
| 5 | Conversation-mix labels and `childTalkShare` (steal 10) per lesson, in sim reports and telemetry. A drop of more than 10% blocks a persona or model change | 1.0 |
| 6 | One interest registry (onboarding, persona, Forge and Studio's interest allowlist agree). The pace knobs are emitted for the client (W2-D consumes them) | 1.0 |
| 7 | The practice purpose (no greeting or hook; review-queue items; a count in `ui`; a practice summary). The Ask purpose (no greeting; topic routed) | 1.0 |
| 8 | Fold the Director's proposals into the kernel's shape: `step()` returns its move as a typed proposal with veto/cost fields for `kernel.arbitrate` (E consumes it in BR1). There is no behaviour change, and replay must stay byte-equal | 0.5 |

**Acceptance:**
- `evals/personalisation-diff.mjs` (new) on production, n ≥ 3 per arm:
  - **(b) history:** a child whose day-1 mix-up the number line repaired gets the number line first on day 2; a
    child for whom it failed twice does not;
  - **(c) guidance:** an all-"don't know" child gets a worked or faded example; a right-first-time child gets
    attempt-first;
  - **(d) pace:** "dheere" raises `waitNudgeSec` within 2 turns.
- Never-answer: **0 of 30** reveals before rung 4, in `npm test`.
- `director-sim`: teaching turns per skill rise by at most 1 at the median; `childTalkShare` is reported.
- Persona invariants and prompt budget are green.

### W2-D: Voice lanes and presence (≈ 12.5 d, plus the face art finishing in parallel)

**Closes:**
- smooth G7 (realtime quota);
- personalisation 10 (client and realtime);
- teacher-anim 3 (map and queue), 4 and 8;
- the chosen head ships for every tutor;
- **HUMAN-VOICE B6** (lane A and the Voice Live probe);
- **the face half of RELATIONAL-OS R4.**

**Moved out in rev 2:**
- the round-trip fold (rev 1 #2) is now W2-G, because it shares `server/routes/voice.js` with the framed TTS;
- the TTS pace recipe (rev 1 #4) is now HUMAN-VOICE B1 in W2-G. `<prosody rate>` *is* honoured on en-IN DragonHD
  (HUMAN-VOICE §4.2), which supersedes `rj-prosody-rate-on-dragonhd`.

**Owned paths:**
- `src/avatar/**`, `src/stage/**`, `src/ui/teacher/**`;
- `src/lesson/**` except `{floor,turnModel,vad,cascadeLink}.ts` (W2-E), `{ttsStream,textLink}.ts` (W2-G) and
  `safetyStrings.ts` (W2-I);
- `server/voice/realtimeSession.js` (new), `server/voice/expressive/compile/{realtime,voicelive}.js`;
- `scripts/character/**`, `art/character/**`, `public/assets/teacher/**`, `shared/tutors.js`;
- `evals/avatar/**`, `evals/realtime-*.mjs`, `evals/webrtc/**`, `evals/voice-live-probe.mjs`,
  `tests/prod/w2d-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Realtime resilience: <br>• on 429 or `rate_limit_exceeded`, switch the lesson to cascade mid-sitting; <br>• `truncation: retention_ratio`; <br>• log `rate_limits.updated`; <br>• the network-loss stall notice in the app voice by ~4.5 s; <br>• a 4-parallel, 20-minute realtime soak from the probe fleet; <br>• fall back to `gpt-realtime-2.1-mini` if the soak fails. <br>**Measured today:** `gpt-realtime-2.1` is at 10/10 of its quota and the mini at 30/30 (§10.2), and RELATIONAL-OS P2 saw 66/168 responses rate-limited at 3-wide. So the cascade is the default lane, and realtime is a premium lane behind O14 | 2.0 |
| 2 | The client reads `TurnResponse.pace` (nudge timer). Realtime `session.update` sets turn detection within 600-1200 ms when the knob moves | 1.0 |
| 3 | **HUMAN-VOICE B6, lane A:** a delivery line in `response.create` built from the Brain's `Moment` (prose notes only; never a sound word, HV-13); a `marin`/`cedar` hum bank with a client pre-reply hum (flagged); the **P-VL probe** (`evals/voice-live-probe.mjs`). That probe answers whether markers are accepted silently, whether server audio access exists, and what the first byte is. It decides lane B (`voicelive.js` lands in W4-A if P-VL passes; needs O17c) | 2.0 |
| 4 | Face: <br>• map the behaviour emotions onto the chosen head's presets, re-scored per face (`teacher-presets-per-face`); <br>• **the face producer of RELATIONAL-OS R4:** `UiDirectives.teacherAffect` → `arm(emotion, intensity)` inside ReactionGate; <br>• queue an affect that arrives before the stage loads; <br>• board and tray gaze from the CueScheduler's cues, **including the Studio tray on reveal**; <br>• laugh, breath and hum avatar events from W2-G's frames (`AvatarVoiceEvent`, HV-11) | 3.0 |
| 5 | **Lip-sync:** a closure expander, then HeadAudio viseme classes; `visemeFold` on B+ and B-lite. Bar: **≥ 76/84 Hindi closures** at a vowel false-close rate of 20% or less (today 23/84) | 4.5 |
| 6 | The O1 head converted for all three tutors. Then `face.rig` **on by default** after the owner's eye OK and a smoke test on the owner's phone (O4a) | art, parallel |

**Acceptance:**
- **Probe fleet:** 4 parallel 20-minute realtime lessons with 0 silences over 5 s (after O14; before it, the soak
  runs at the quota the probe measures and the result is logged). A forced rate limit switches to cascade with the
  lesson continuing.
- **Face:**
  - `evals/avatar/lip-bench.mjs` ≥ 76/84;
  - a gaze test on a board cue and on a Studio reveal;
  - production Playwright: all three tutors load the chosen GLB, and every fallback is the same person.
- **RELATIONAL-OS AT-U12 / TEACHER-BRAIN G-MOMENT on the client:** the face program after a correct commit and
  after a wrong commit, on the same turn context, is identical.
- HV-13: lane-A transcripts carry 0 sound words over 40 turns; the never-deny-AI battery is unchanged. The P-VL
  result is logged as a measurement.

### W2-E: Teacher Brain I: the kernel, the turn, the gap after the child speaks (≈ 13 d)

**Delivers:** TEACHER-BRAIN BR0, BR1, BR2, **BR2b** and BR5. Also rev 1's W4-A #1 (predictive end-of-turn,
steal 3) and #3 (the body-first wait plus the echo of the child's own words, steal 12). They are BR2b's L1 and L3,
pulled two waves earlier. The real gate for the turn model (SHIFT/HOLD AUC on E1 children) stays at the pilot.

**Owned paths:**
- `server/routes/lesson.js` (hot), `server/brain/**` (new: `kernel`, `turn`, `moment`, `trace`, `reasons`,
  `fold` stub);
- `shared/brain.ts`, `server/lanes.js` (new);
- single-file carve-outs: `server/director/classify.js` (signals block), `server/persona/signals.js`,
  `server/learner/affect.js` (TurnSignals consumers), `server/voice/stt.js` (fragment merge);
- `src/lesson/{floor,turnModel,vad,cascadeLink}.ts`, `public/models/smart-turn/**`;
- `db/migrations/016_brain.sql`;
- `evals/teacher-brain/**`, `evals/brain-sim/**` (skeleton), `evals/turn/**`, `tests/brain-*.test.mjs`,
  `tests/prod/w2e-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **BR0:** contracts, `016_brain.sql`, `trace.js` (`brain_trace` statement inside the turn tx), `reasons.js`, the `decision_record` writer; a kernel skeleton that wraps today's `step()` with no behaviour change | 2.5 |
| 2 | **BR1:** `server/brain/turn.js` extracted from `lesson.js` `turn()` (757-1095) and `planTurn` (1135-1248), behaviour-identical; kernel arbitration live with today's proposers (safety, director, comprehension, vibe, conductor guard); the route keeps HTTP, auth, replay, late-turn and outbox semantics; the exported turn handler is the seam W2-G's `turn-audio` calls | 3.0 |
| 3 | **BR2:** the signals piggyback on classify (TB4: dialogue act, IDK split, personal share, interest tag, humour, meta requests) on the production classifier `grok-4-1-fast-non-reasoning`. Its consumers are affect, persona and the IDK split. A `Moment` per turn goes to HUMAN-VOICE (`planDelivery`) and to the avatar. The Moment carries `teacherAffect` only from RELATIONAL-OS, and it is null until BR5 | 2.5 |
| 4 | **BR2b, turn timing (TEACHER-BRAIN §5.4):** <br>• **L0** `heard` receipt + the consider-answer pose ≤ 150 ms; <br>• **L1** Smart Turn v3.2 int8 (BSD-2) in a worker, a ~450 ms candidate endpoint, a HOLDING floor state, fragment merge, thresholds from the move/item type (high for why-probes, low for numbers and taps), behind `turn.predictive`; the 8 MB model is cached with the pack (`low-end-data-budget`); <br>• **L2** speculative replies start at the candidate, not at the commit (`cascade-speculative-reply`); <br>• **L3** the uptake prelude: the child's own key token, in the same voice, verdict-neutral, when the reply's first audio would land later than 1.2 s; never on safety turns, never in the realtime lane, never a stock filler; synthesis by W2-G (B5), **off until HV-16 passes**; <br>• **L5** the classify hedge at 1.5 s; <br>• hot/background **lane tags and token buckets** in `server/lanes.js` | 3.0 |
| 5 | **BR5, the relational adapter:** W2-I's `RelationalDirective` is split into the kernel's authority ranks. Safety and the floor come first, then RELEASE, consent, the teacher-owned repair before the next move, and rapport. `Moment.teacherAffect` and `bondStage` are filled from RELATIONAL-OS. The lesson-end consolidation is scheduled on the background lane (the module is W3-F's R6) | 2.0 |

**Dependencies:**
- BR2 needs W2-G's B0-B2 contracts (day 5).
- BR5 needs W2-I's R1 (day 7) and its server-side R4 (day 10).
- L3 needs W2-G's prelude synthesis and the HV-16 blind test (O27).

**Acceptance:**
- **Code gates in `npm test`** (TEACHER-BRAIN §15.1): G-KERNEL-PURE, G-KERNEL-ORDER, G-BUDGET, G-LAT (kernel p99 ≤
  10 ms over 10k turns on the ACA image), **G-AUTHORITY** (a child goodbye beside any pedagogy, plan or Studio
  proposal: RELEASE wins in 100% of 10k generated turns, where RELEASE for a lesson-stop phrase is the single check-in of
  OWNER-RESET item 7 and for a real goodbye is the end of the lesson; a teacher-owned repair precedes the next item), G-MOMENT,
  and **G-QUOTA** (20 concurrent Studio races plus a consolidation burst on a shared deployment: 0 hot-path 429s).
- **Replay:** 30 recorded lessons replay byte-identical through `server/brain/turn.js` (BR0/BR1).
- **G-SIG:** label agreement with the plain arm ≥ 99% on the full classify item set. Act accuracy ≥ 0.9 on a
  120-reply set labelled by two raters, with κ reported. This closes the single-rater caveat of M2/M2b.
- **Production, Central India probe fleet, 30 cascade turns per band:**
  - speech end → first audio p50 ≤ 3.2 s and p90 ≤ 3.9 s (the regression floor, hard);
  - receipt ≤ 150 ms p95;
  - **first audible teacher sound p50 ≤ 1.6 s / p90 ≤ 2.2 s**;
  - **first reply audio p50 ≤ 2.5 s / p90 ≤ 3.2 s**;
  - the cut-off rate with child-like clips is no worse than the 900 ms fixed-silence arm. If it is worse,
    `turn.predictive` stays off and L0/L2/L3/L5 ship alone (the targets are [U] until this runs).
- **Failure drill:** kill the classify deployment, and turns continue on `taxila-fast`. 0 error cards reach the
  child.
- The trace explains every turn: a support question on a test lesson is answered from `brain_trace` rows alone.

### W2-F: Studio build system: gate, builders, archetypes (≈ 14 d)

**Delivers:** LIVE-STUDIO S2, S3, S4 and the router-bench half of S10.

**Owned paths:**
- `server/studio/{router,plan,build,stream-guard,fixers,repair,telemetry}.js`, `server/studio/builders/**`,
  `server/studio/qa/**`, `server/studio/archetypes/**`, `server/studio/memory/**`, `server/studio/routes.json`;
- `server/azure.js` (`chatStream()`, the `lane` option, usage and cost);
- `infra/studio-qa/**`, `scripts/deploy-studio-qa.mjs`;
- `evals/live-studio/**`, `tests/studio-{router,qa,stream-guard}.test.mjs`, `tests/prod/w2f-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **S2, the gate service:** <br>• port `evals/live-studio/qa.mjs` to `server/studio/qa/`: AST G0, boot/console/network, seam, words ⊆ strings table, layout and 44 px targets, scripted play against host truth, kind semantics including **G4 label-to-referent anchoring** and **G6 science direction**, no-hint, perf, the G7 state graph, 3 viewports; <br>• the `infra/studio-qa` image; <br>• a `studio-qa` Container App in `taxila-forge-untrusted` (the fallback lane until O16) | 4.0 |
| 2 | **S3, builders:** <br>• streaming builders (Responses and chat) on the routed arms; <br>• the race of two with cancellation and deadlines; <br>• the stream guard (URLs, eval, storage and unknown keys removed at token time); <br>• deterministic fixers (oxc); <br>• ≤ 2 repair rounds fed by failing check ids, with negative memory placed last; <br>• `taxila-codex` as the 429 arm; <br>• every call on the **background lane** | 4.0 |
| 3 | **S4, planner + archetype library v1.** <br>• `plan.js` on `taxila-fast` (effort none) writes strings, interest skin, craft line and teacher cue; <br>• **12 archetypes:** the 3 probe archetypes plus number line, balance, sort bins, sequence, slider-law sim, process animation, labelled-parts diagram, pictograph and timeline; <br>• each archetype has a seam, states, checks, a params schema, string keys, a skeleton id, budgets and anti-patterns; <br>• **≥ 30 bench runs per archetype** with a published P(pass by deadline) | 5.0 |
| 4 | **S10 (bench half):** `router-bench.mjs`, n = 10 weekly (n = 30 on a new archetype). It writes `routes.json` and a row per archetype to `context/inbox/`. A route changes only on non-overlapping 80% Wilson intervals | 1.0 |

**Acceptance:**
- **Mutant suite:** ≥ 15 seeded mutants per probe kind (wrong part count, water flowing down, O₂ into the leaf,
  label overlap, a stray English word, a fetch call, a hard-coded `Studio.answer`, done never called, 360 px
  overflow). **Recall = 1.0, false alarms 0/6 goldens.**
- **Gate on Azure:** p50 ≤ 12 s, p90 ≤ 18 s on the `studio-qa` app, n ≥ 30.
- **Router bench from the server code path** reproduces the LIVE-STUDIO §14 numbers within their k-of-3 ranges.
  It publishes the 12-archetype table: first try, after repair, P(pass by deadline), p50/p90 time to playable, and
  $ per passed build. **An archetype is marked live-buildable only at P(pass by lead) ≥ 0.95, n ≥ 30.** Every other
  archetype is library-only, and the router enforces this.
- **Caps in `tests/studio-router.test.mjs`:** ≤ 3 live builds per lesson, ≤ $0.60 per child per day, ≤ $8 per
  month, the global breaker, library-first. At bond stage `meeting` (the first session) and under the parent control
  "Only ready-made ones", only `promoted` builds, skeletons and T1 engines are admissible.
- **Spend:** the bench costs ≈ $100-150 of Azure for 12 × 30 races (§10.5).

### W2-G: Human voice: the expressive layer on the cascade (≈ 14 d)

**Delivers:** HUMAN-VOICE B0, B1, B2, B3, B4, B5, B7 and B8. Also rev 1's W2-D #2 (fold the round trips) and W2-D #4
(pace, now `<prosody rate>` by a per-voice table). B6 is W2-D's. B9 and B10 are owner and external tracks (O20,
O19).

**Owned paths:**
- `server/voice/**` except `stt.js` (W2-E), `realtimeSession.js` and `expressive/compile/{realtime,voicelive}.js`
  (W2-D);
- `server/voice/azureTts.js` (new), `server/voice/voices.js` (new; character → DragonHD voice, base rate);
- `server/routes/{voice.js, tts.js}`, `src/lesson/{ttsStream,textLink}.ts`;
- `scripts/voice-bank/**`, `docs/design/superhuman/voice-bank/**`, `scripts/prosody-baseline.mjs`;
- `evals/tts-pace.mjs`, `evals/voice-expressive-*.mjs`, `tests/voice-expressive-*.test.mjs`,
  `tests/prod/w2g-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **B0:** contracts (`DeliveryPlan`), the capability registry seeded from the §4 JSON, the leak lint, the safety-register predicate (safety turns bypass the layer: calm, no fillers, no clips, plain digits) | 0.5 |
| 2 | **B1:** <br>• an Azure Speech streaming TTS client (DragonHD PCM, `<lang>`); <br>• the base `<prosody rate>` per voice from a measured table (HV-15, 11-13 chars/s): Asha = `en-IN-Diya`, Arjun = `en-IN-Arjun`, Uma = `en-IN-Meera` after its probe; <br>• the cache key carries the plan hash and the bank hash; <br>• fallback to `gpt-4o-mini-tts` (identity change logged) | 2.0 |
| 3 | **B2:** <br>• the moment planner (code, reads only the Brain's `Moment`; **no row reachable from `verdict = correct` except affirm**, HV-17); <br>• the clause aligner; <br>• the governor (filler ≤ 0.5 per turn, no repeat within 6, laugh gap ≥ 300 s, a 1.5 s silence cap per turn); <br>• compilers for dhd, omni, mai and oai-tts; <br>• unit and property tests | 2.5 |
| 4 | **B3:** the bank pipeline: <br>• render 12 takes × 5 kinds × 3 personas from the Omni sibling, the shapeAck port and auto-QA; <br>• a curation page and upload to the private `voice-bank` Blob container; <br>• the `bank.js` loader; <br>• **the bank stays off in production until O20** (breaks and markers ship without clips) | 2.0 |
| 5 | **B4:** <br>• the streaming splicer with the leading clip first; <br>• framed TTS v2 (JSON headers, then PCM); <br>• the client parser in `ttsStream.ts`; <br>• `AvatarVoiceEvent` frames for W2-D | 2.5 |
| 6 | **B5:** <br>• wired into the turn after the guard and before prewarm, and into the text lane's "Hear"; <br>• reads only the Brain's `Moment`, through the seam; <br>• **uptake prelude synthesis** + leading-echo strip for BR2b L3; <br>• telemetry `voice.expr.*`, barge-after-clip, gap-miss, fail-closed-to-plain | 1.5 |
| 7 | **Fold the round trips:** `/api/lesson/turn-audio` calls W2-E's exported turn handler; one response carries the JSON headers and then the PCM; 3 India round trips become 1 | 1.5 |
| 8 | **B7:** the LLM annotator (strict schema) for kit narration, openings, Forge narration and read-aloud, cached, on the **background lane** | 1.0 |
| 9 | **B8:** nightly audio gates on the probe fleet: <br>• the ASR leak battery (with the Devanagari transliteration list); <br>• the style-marker re-probe (auto-drops a newly spoken marker); <br>• first byte; <br>• bank drift (f0 ±8%) | 0.5 |

**Acceptance:**
- **CI:**
  - HV-1: 2,000 replies × 3 voices give 0 tag words and 0 sound words in reply prompts;
  - HV-2: aligner output minus fillers is byte-equal to the reply, 100%;
  - HV-3: 200 safety fixtures give 0 fillers and 0 clips;
  - HV-4: the governor stays in bounds over 50 seeds × 60 turns;
  - HV-5: the splicer suite hits 100% of gaps with 0 false fills;
  - **HV-17:** flipping `verdict` with `teacherAffect` fixed leaves the emotion arc unchanged.
- **Production, Central India:**
  - **HV-7:** DragonHD expressive first byte p50 ≤ 300 ms, p90 ≤ 450 ms, Δ vs plain ≤ 10 ms (n = 20);
  - **HV-8:** with a leading clip, the first audible sample comes ≥ 150 ms earlier;
  - **HV-6:** 0 spoken tags in the nightly 40-line battery, every production voice;
  - **HV-15:** 11-13 chars/s per voice, plus the owner's ear check;
  - the round-trip fold: speech end → first teacher audio p50 ≤ 2.2 s on the cascade (rev 1's bar, now composed
    with W2-E's targets).
- **HV-16** (with O27): 20 matched prelude pairs, ≥ 10 blind listeners, right/wrong guessed ≤ 55%. If it fails,
  L3 stays off.
- **HV-9** (O20): the owner's blind page decides the clip bank. Ship bar: a splice or "voice changed" tick on ≤ 1 in
  5 spliced clips, and expressive preferred or tied on ≥ 4/5 lines per DragonHD voice.

### W2-H: Studio in the lesson: kit, frame, library, reveal on cue (≈ 14.5 d)

**Delivers:** LIVE-STUDIO S1, S7, S5a (the lesson integration that needs no beats) and S6, with STUDENT-FLOW SF3.

**The W2 rule for intents:** without beats (W3-E), Studio intents come from two places:
- **Lesson-start prefetch** (`prefetch(lessonCtx)`). This covers the lesson plan's skills, the kit's diagnostic
  misconceptions for those skills, and this child's open re-teach rows. It gives 3-6 minutes of lead, so even a
  live build is ready before the explain move that needs it.
- **The Director's current move** (explain, contrast after a verified misconception, practice). This path asks only
  for library hits or prefetched builds.

The pieces are revealed on the teacher's cue: the reply refers only to what `StudioStatus` says is `revealed`.

**Owned paths:**
- `src/studio/**` (stage, frame, veil, skeletons, `studio-kit@1` runtime and primitives, `useStudio.ts`);
- `server/studio/{store,library,grade,seam}.js`, `server/routes/studio.js` (SSE `GET /api/studio/stream`);
- `scripts/studio-review.mjs`, `db/migrations/017_studio.sql`;
- `tests/studio-contracts.test.mjs`, `tests/prod/w2h-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **S1:** <br>• the `studio-kit@1` runtime (port of the probe runtime: `Studio.params / t / answer / onVerdict / event / ready / done`), seam conventions; <br>• the hash-CSP bundler (from G2 `bundle.js`); <br>• `StudioFrame` with the partial channel and the sanitiser (XSS corpus); <br>• code skeletons (≤ 8 KB, mount ≤ 150 ms warm) for game, animation and chart; <br>• one grader for gate and lesson (`grade.js` on `forge/g2/truth.js` + `kitmath.js`) | 4.0 |
| 2 | **S7, the library:** <br>• identity = sha256(kind, archetype, skill, Band4, lang family, kit hash, studio-kit version), with the model as a variant attribute, never part of the key; <br>• states `live_passed → transfer_passed` (≤ 20 further mounts, each after G-mount) `→ promoted` (≥ 3 distinct param passes + sampled human review) `→ retired`; <br>• **the gate-result cache:** if the gate is down, a build mounts only if this exact (build sha, params hash, strings hash) already passed G-mount; <br>• the review CLI (from G2 `review.js`); <br>• ≤ 3 promoted variants per identity; <br>• next-lesson prefetch | 4.0 |
| 3 | **S5a, lesson integration:** <br>• the seam's `prefetch` at lesson start; <br>• the SSE channel (skeleton, partial, status, ready); <br>• `StudioStatus` as a telegraphic facts row into both voice lanes (via W2-B's shared facts shape); <br>• reveal on cue; `screenHasTargets` reads Studio state; <br>• host-graded evidence `kt_evidence(via='studio')` at ×0.75; <br>• `studio_mount` rows; <br>• the Made for you mini-shelf feed for W2-A | 3.0 |
| 4 | **S6 + SF3, the moment and the tray:** <br>• the pencil skeleton → watercolour veil → reveal choreography (LIVE-STUDIO §4.2); <br>• the seven tray states (STUDENT-FLOW §5.3) at constant tray height; <br>• "Show me again" and "Not this one" (retire; that archetype is excluded for this child for a week); <br>• reduced motion; <br>• no spinner, percentage, code or error text ever. <br>The parent-corner entry is W2-A's (#9), fed by `studio_mount` | 3.5 |

**Acceptance (production, Playwright 360×800 and the probe fleet):**
- **LIVE-STUDIO AT-7** (a voice lesson on fractions with a scripted misconception):
  - the skeleton appears ≤ 300 ms after the intent's turn response;
  - a passed build is revealed on the teacher's cue in ≥ 9/10 runs;
  - **0 un-gated reveals**;
  - the teacher's next line mentions only on-screen values (100%).
- **AT-8:** forced builder failure (both arms return garbage). There is no error card, the skeleton-as-activity is
  graded by the host, and the teacher never mentions a failure (transcript lint).
- **AT-9:** a second child with the same need gets the library build in ≤ 1 s with their own params, and G-mount
  passes.
- **AT-10:** a Studio answer writes `kt_evidence(via='studio')` with the host's grade, never the frame's.
- **AT-11:** from inside a revealed build, the following are all refused or ignored:
  - `fetch`, `new Image().src`, CSS `url()`, `top.location`;
  - a forged `postMessage` answer with `correct: true`.
- **AT-12:** at 4× throttle, frame p95 ≤ 50 ms during play for every archetype.
- **STUDENT-FLOW journey 2:** screenshots at every tray state, plus a forced failure → `fallback_shown`. No
  spinner, percentage or error text; layout jump ≤ 4 dp.
- **First session:** a child at bond stage `meeting` gets only promoted builds (trace shows no live intent).

### W2-I: Relational core and the safety floor (≈ 14.5 d)

**Delivers:** RELATIONAL-OS R0, R1, R3, the server half of R4, and the **first AT-B1 run on both lanes**. R3 is in W2
rather than W3 because P2 measured three live defects on the safety path:
- spoken planning on 18/18 heavy turns;
- English on 24/30 safety turns to a Hinglish child;
- 14/14 never-rules false positives that corrected a right answer.

These are floor defects, so they are fixed in the first wave that can fix them.

**Owned paths:**
- `server/relational/**` (new: `bond`, `session`, `signals`, `lexicon/**`, `policy`, `affect`, `writers`,
  `seam`);
- `shared/relational.ts`;
- single-file carve-outs: `server/director/safety.js`, `server/learner/mode.js`;
- `src/lesson/safetyStrings.ts` (new);
- `db/migrations/018_relational.sql`;
- `evals/relational-os/**`, `evals/never-rules*`, `tests/relational-*.test.mjs`, `tests/prod/w2i-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **R0:** contracts, `018_relational.sql` (`rel_state`, `rel_event`, `relational_note`; no NM-3 column), mode classification (`rel_bond` M1+, `rel_overlay` M3), the pure bond fold (`stageFor`, `addressFold`, `teacherOwnedStance`, `replay`), UPSERT writers that assert their layer | 3.0 |
| 2 | **R1:** <br>• bilingual signal predicates (Roman + Devanagari, negation and quotation exclusions); <br>• the session fold (safe-to-be-wrong, child-affect ruptures; session-only); <br>• the policy skeleton: RELEASE, CHECK-IN after distress, WARM-BOUNDARY, AFFIRM-RECHECK / OWN-SLIP from the key; <br>• one `RelationalDirective` per turn through the seam; ≤ 3 ms p99, 0 network | 4.0 |
| 3 | **R4 (server):** `appraise(event) → TeacherAffect` with the TA1-TA8 charter as structure: <br>• `correct` is never a cause; <br>• no self-negative display; <br>• RELEASE forces neutral-warm; <br>• delight and pride only for a method the child found or for persistence. <br>`teacherAffect` flows only through the Brain's `Moment` | 2.0 |
| 4 | **R3:** <br>• never-rules families: `romance` widened, plus new `contact`, `memory_claim`, `meta_talk`, `gender_agreement` and address; each has negative controls; <br>• the `exclusivity` refusal-frame negation fix (no blocking until precision ≥ 0.9); <br>• **per-language-mode fixed safety openings** in `safetyStrings.ts`, playable without the model; <br>• the SAFETY-state no-preface check; <br>• reviewed by the owner and a child-safety reviewer (O24) | 4.0 |
| 5 | **AT-B1 on both lanes (first run):** <br>• the four P2 scripts plus the eight new ones, 3 bands, Hindi, Hinglish and English surfaces, interleaved neutral turns, real CORE; <br>• **the realtime lane and the cascade lane** (`compile()` + `taxila-fast` reply + guards); <br>• audio-in on ≥ 1/3 of runs (probe-fleet fake media); <br>• ≥ 10 runs per script × arm × lane; <br>• two blind coders with κ (O22c) | 1.5 |

**Acceptance:**
- **CI:**
  - AT-U1 to AT-U8 (replay byte-identical, stage never regresses over 10k sequences, address never regresses,
    writers throw below their mode, the NM-3 schema scan, the M1 → M0 ratchet deletes rows, `appraise()` rejects
    `correct`, `policy.decide` is pure with p99 ≤ 3 ms);
  - **AT-U10:** the rendered OPEN rows are identical for 1-, 7- and 40-day gaps;
  - the never-rules precision bars on the coded corpus (the P2 corpus included).
- **Production (W2 exit gate):**
  - **AT-B1:** F1-F5, F8 and F9 violations are **0 on both lanes** by two blind coders;
  - safeguard turns carry Childline digit-exact;
  - RELEASE without a question in ≥ 95% of goodbyes;
  - neutral-turn false triggers ≤ 2%;
  - **AT-B6:** crisis outranks relational, with 100% recall on scripted items and a check-in before release 100%;
  - the safety opening has no preface and is in the child's language mode.
- `w2i-release.mjs` (rewritten 2026-10-04 per OWNER-RESET item 7 and owner-truth F6): two cases.
  - A real goodbye ("bye", "good night", "mujhe jaana hai") ends the lesson that turn, with no "one more" and no guilt.
  - A lesson-stop phrase ("lesson khatam", "end the lesson", "I'm done", "bas") gets exactly ONE warm check-in: keep going / short
    break / stop for today, with no guilt, no pressure and no second ask.
  - The lesson ends on the stop choice, or on the stop phrase repeated on the next turn. Parent controls and Pause→End still end it at once.
  - "Talk about something else" is steering, never a stop.
  - A stopped lesson does not close the day.

**Wave 2 exit (integration day, ≈ 1.5 d):**
- merge the inbox files;
- gates;
- push and gated deploy;
- `node tests/prod/run.mjs --wave 2` green, including every stream's file above;
- the live-content, flows and smooth audit probes re-run, with the deltas logged;
- the Studio bench table, the turn-timing numbers from Central India and the AT-B1 result are logged in
  `measurements.md` with n, method and date.

> **What the owner can test after Wave 2 (the full product, thoroughly, and alive):**
> - **Screens and lanes:** every screen, in voice or text; home states for homework, test windows and safety
>   holds.
> - **Live building:** while she explains, a sketch of a game, an animation or a chart appears and fills in, and
>   she reveals it on her cue. It plays correctly, uses your child's numbers and words, and counts as evidence. A
>   second child gets it in under a second. If a build fails, your child sees a correct simpler version and never
>   an error.
> - **Content:** working activities, animated explanations and diagrams across maths, science and EVS/SST.
> - **Practice and Ask:** both as designed.
> - **The voice:** a DragonHD voice per teacher with real pauses, a breath before a hard step, slower and lower for
>   a correction. The thinking hum and laugh clips arrive after the owner's blind test.
> - **The turn:** a visible "I heard you" at once, her first sound in about 1.6 s, and no cutting off a child who is
>   still thinking.
> - **The bond, safely:** she owns her own slips, honours a goodbye, and holds every safety boundary in both voice
>   lanes, in the child's own language.
> - **Parents:** a parent corner whose numbers agree everywhere, and that quotes the real question.
> - **Teaching:** a teacher who adapts her guidance and remembers what repaired your child's mix-up.
> - **The face:** the head the owner chose, in every lesson, with real lip closures, reactions that never give away
>   right or wrong, and gaze to the board and to what was built.

---

## 5. Wave 3: BREAKTHROUGH I: evidence, beats and the bond

Seven streams.

**The W3 seam commit:**
- `server/director/errtype.js` (A) is called from `state.js` (E);
- `server/conductor/slot.js` (C) gives `ctx.slot` to E's `planLesson`;
- `server/compiler/relational.js` (F) is placed in `compile.js` (A);
- `server/studio/policy-seam.js` gives E's `studio-policy.js` the router's admissibility check (G);
- the G2 nightly writes through `server/studio/library.js` (D → G);
- migration numbers from 021.

### W3-A: Verbal-fair evidence (≈ 16.5 d)

**Closes:** comprehension G5, G6 and G10; steals 1, 8 and 24; the text half of Bet 1; the routing half of Bet 5.

**Owned paths:**
- `server/comprehension/**` except `probes/cmp.js`;
- `server/learner/**`;
- `server/director/**` except `modules.js`, `state.js` (E, hot) and `safety.js` (F);
- `server/compiler/**` except `relational.js` and `characters/*.taste.json` (F);
- `evals/comprehension-sim/**`, `evals/grader-*.mjs`, `tests/prod/w3a-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Grader hardening: <br>• an echo guard over **every** teacher turn of the episode plus the target's own wording: ≥ 0.8 overlap → `partial`; <br>• an authority lexicon ("teacher/didi/book said") → `partial`; <br>• "restates the answer" → `absent`, never `contradicted`; <br>• an A/B of translate-then-grade for Hindi and Hinglish. <br>Plus a 300-case adversarial battery run on every grader change | 4.0 |
| 2 | Grader hygiene (steal 24): <br>• a pinned `graderVersion` with error tables per version; <br>• R-IDEA idea-unit counting in code first; <br>• a timing-annotation lint; <br>• `selfRepairToCorrect` split from disfluency, never feeding pL | 1.0 |
| 3 | **Diagnose the error type before help (steal 1):** <br>• `errType` ∈ {careless, misread, right-idea, imprecise, guess, misconception, not-sure} from the closed-label grade; <br>• a routing table in `errtype.js`, offered to the kernel as a comprehension proposal; <br>• strategy and intention as shape notes | 3.5 |
| 4 | IDK vs IDK_R ("pata nahi" vs "yaad nahi aa raha") (steal 8). It uses the IDK split already riding on classify (W2-E BR2). IDK_R triggers a same-episode recognition probe and barely moves pL | 1.0 |
| 5 | **Code-graded catches (comprehension G6):** <br>• tap "right / not right" planted-error forms, where the protégé states `kit.misconceptions[].belief` and R-CATCH is graded in code; <br>• kit `error_spot` → R-CATCH plus R-KEY on the correction; <br>• free-form error-spot and transfer answers go through the closed-label grader with a span; <br>• widen `LIVE_PROBE_SHAPES` one shape at a time, re-running the `live` sim after each | 6.0 |
| 6 | Wire `transcripts_retention` consent so spans are kept where consented (needed for M-GRADE and the refit) | 1.0 |

**Gates:**
- **X4:** P(present | recited) ≤ 0.10, and P(present | Hinglish own words) ≥ 0.80.
- **X3:** code-graded catches are additive on the `live` policy; otherwise drop them.
- **`errType`:** κ ≥ 0.6 against 200 human labels before it routes (**O5c**). Until then it logs only.
- **Live sim:** false mastery stays ≤ 0.05 overall and ≤ 0.02 shallow. The verbal gap is reported every run.
- **Production (`w3a-grader.mjs`):** 40 Hinglish own-word answers and 40 recitations through the production turn:
  the X4 bars hold on production, not only offline.

### W3-B: Kit factory v-next, counterfactual minimal-pair probes, and the truth Studio needs (≈ 16.5-20.5 d, fan-out inside the stream)

**Closes:**
- comprehension G7 and the core of §5 (CMP);
- steal 23;
- the kit side of Bet 5;
- **rev 2: the verified truth that Studio archetypes need** (LIVE-STUDIO §3.2 admissibility).

**Owned paths:**
- `data/kits/**`, `data/curriculum/**`, `server/content/**`;
- `server/solvers/**` (new), `server/comprehension/probes/cmp.js` (new, a carve-out);
- `scripts/kits/**`, `evals/kit-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | Kit schema v-next: <br>• `aha`, `progression` and the representation order with a `translate_rep` turn (steal 23); <br>• the 7 fields half the probe library needs: characterView, myth, counterfactual, instances, representations, weaveHosts, solver | 1.0 |
| 2 | Generate those fields for maths and science c4-c8 (about 350 topics) with the existing **blind-solve** verification. `solver` is code: parametrised item templates | 10-14 |
| 3 | **CMP:** S-pairs (surface change, same answer) and D-pairs (deep change, the answer must change) from the solver, graded by R-KEY with no LLM, answerable by tap, number or voice. The 2 × 2 signature maps onto the truth types | 3.0 |
| 4 | Language-subject hint clean-up for W3-D: read-along, role-play, word-builder, picture-word-match and story-sequencing tagged to templates | 1.0 |
| 5 | **Studio truth fields:** <br>• verified science process flow lists (direction per arrow); <br>• verified data sets with reading questions for charts; <br>• part lists with referents for labelled diagrams; <br>• event lists for timelines. <br>Generated with the same blind-solve check, so G4 and G6 compare against kit truth, never model truth | 1.5 |

**Gates:**
- Every solver pair is blind-solved, **100%**.
- **X2** (the live policy plus CMP): macro accuracy ≥ 0.70 **in both families**, verbal gap ≤ 10 pp, probe load ≤
  2.5, false mastery ≤ 0.05 / 0.02.
- Forge first-pass validity before and after the schema, logged.
- **If X2 fails, CMP stays as practice** and the comprehension claim is not raised (reversal in comprehension §5.4).
- Studio admissibility coverage: process, chart and diagram archetypes are admissible on ≥ 70% of c4-c8 science
  topics (from today's three probe topics).

### W3-C: The personalisation loop and the day (≈ 14 d)

**Closes:** personalisation 8, 9 (part 1) and 12; steals 6 and 25; the dose half of Bet 2.

**Rev 2 change:** rev 1's item 2 put day-plan consumption in `lesson/start`. That half is now E's `planLesson`. C
delivers the slot through `server/conductor/slot.js`, plus the Conductor's prefetch and relational slot fields
(TEACHER-BRAIN §17).

**Owned paths:**
- `server/conductor/**`;
- `server/reports/**` except `relational.js` (F);
- `src/parent/**` except `memory/**`, `moments/**` (F);
- `server/routes/parent.js`;
- the allotted `db/migrations`, `tests/prod/w3c-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | A `decision_log` row for every personalisation decision (knob, arm, p, availability, context hash). An outcome join: `y_next`, `y_delay` from the existing delayed checks, and `y_transfer`. The rows are written through W2-E's `decision_record` writer, so there is one table | 3.0 |
| 2 | The day plan as a slot: today's opener, successFirst, `newSkillBudget` and segments, via `slot.js` to E's planner. The planner gets R2 (what worked yesterday → entry guidance), R4 (forgetting-driven review), **Studio prefetch hints** (skills and misconceptions for tomorrow, so the batch lane can build overnight) and **relational slot fields** (a ritual due, a milestone candidate) | 4.0 |
| 3 | **Dose by schedule (steal 6):** parents pick weekly slots. The Conductor plans and nudges to the slots, never streaks. The parent report shows minutes against plan | 2.5 |
| 4 | "What helps {child}": fixed-string claims citing resolved re-teach rows, with hedged wording until the posterior is ≥ 0.9 over ≥ 8 delayed comparisons | 2.5 |
| 5 | **The parent CoPilot card (steal 25):** three probing questions built from the child's actual error, no praise lines, behind the report gates. The transcript of the child's own explanation comes first; a clip waits for O-consent | 2.0 |

**Acceptance:**
- `personalisation-diff` checks pass:
  - (e) the day plan exists and the opener matches it;
  - (f) the parent sees a "What helps" line that cites rows.
- At least 95% of decision rows join an outcome within 48 h.
- The parent sees minutes against slots.
- The card passes the claim gate on 20 generated days.
- Tomorrow's prefetch hints exist for ≥ 90% of active test children by 02:00 IST. The batch lane (W3-G) has built
  or found ≥ 80% of them by lesson time.

### W3-D: Language activities, instant fills, and G2 into the Studio library (≈ 11 d)

**Closes:** live-content 7(c), 8 and 9; steals 9, 19 and 20; Bet 4.

**Rev 2 changes:**
- **G2 is delivered through the Studio library.** That means one store, one gate, one review CLI and one `src`-pinned
  mount path (`plan-g2-into-studio-library`). A G2 game is a library build with `origin: g2`.
- Rev 1's item 5 (the offline image library) is now W3-G's images lane.
- The W1-D note "the nightly build half stays paused until W3-D delivers" is met here.

**Owned paths:**
- `server/forge/**` including `g2/`;
- `src/modules/**`, `src/child/lesson/{WorkTray,Board}.tsx`, `src/child/screens/Practice*`;
- `server/director/modules.js`, `shared/forge.ts`, `shared/engine-catalog.js`;
- `scripts/forge-g2-*.mjs`, `tests/prod/w3d-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **G2 delivery through the library:** <br>• G2 builds land as `live_passed` library entries and pass the same Studio gate; <br>• the human review CLI is shared (**O5b**: 5-10 builds); <br>• the child's day manifest is read at lesson and practice start and mounts through `StudioFrame` with the hash check; <br>• a G2 game appears in Practice. <br>Then the nightly build half is **resumed** | 3.0 |
| 2 | Strict behaviour gates for the G1 / `scene@1` templates (steal 19): ideal state graphs, all-checks rates only, yes/no checklist judges with a second model family; the checks are shared with `server/studio/qa/checks/*`. Negative memory goes **last** in the builder brief (steal 20) | 2.5 |
| 3 | Language activities as `scene@1` templates: picture-word-match, story ordering (sequence-steps) and word-builder | 3.0 |
| 4 | **Skeleton-first fills (steal 9):** truth fields and layout come from code and mount at once; language slots stream in, each painted only after the per-string safety gate; every slot has a templated value | 2.5 |

**Gates (Bet 4):**
- Off-plan first paint p90 ≤ 300 ms.
- A **published all-checks pass rate per archetype** of 95% or more. Below that, off-plan falls back to curated
  modules and the claim is not made.
- English and Hindi topics with at least one activity: from 0 of 101 to ≥ 60 of 101.
- G2 games appear in Practice the day after a reviewed build, mounted through the Studio frame.
- Repair rounds per build fall after negative memory.

### W3-E: Teacher Brain II and the lesson the child sees (≈ 15 d)

**Delivers:** TEACHER-BRAIN BR3 and BR4; STUDENT-FLOW SF2, SF4 (the Made for you shelf and the Question jar), SF5 and
SF6.

**Owned paths:**
- `server/routes/lesson.js`, `server/brain/**`, `server/director/state.js` (all hot);
- `server/brain/{lesson,beat,studio-policy}.js` (new);
- `server/routes/child.js`, `src/child/plan.ts`;
- `src/child/lesson/{Desk,BeatLine,Summary}.tsx` (`PhaseLine` renamed to `BeatLine`);
- `src/child/screens/{Hello,Notebook,Home}.tsx`;
- `evals/brain-sim/**`, `tests/prod/w3e-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **BR3, beats:** <br>• `planLesson(brief, slot, view, rel)` (R0 templates per purpose and band); <br>• `planBeat` with a 1-2 beat lookahead; <br>• the pacing table and re-plan triggers; <br>• beat exit conditions in code; <br>• `ui.beat`; <br>• `teach()` driven by `BeatPlan` steps (on W2-C's fading); <br>• verdict, hint, probe and safety are unchanged | 4.0 |
| 2 | **BR4, the Studio policy:** <br>• the scored policy in code: need × content affordance × kit truth × this child's format evidence (session-only per child, §11 open item) × vibe and relational modifiers × budget and lead time; <br>• library first, ≤ 1 piece on screen, ≤ 3 live builds per lesson, strain forbids a new build; <br>• `StudioIntent` with `neededAtMs` from the beat plan; <br>• reveal, use, retire; <br>• **mid-lesson live builds aimed at a just-verified misconception** for archetypes past the live bar | 4.0 |
| 3 | **SF2:** <br>• the Desk beat line (Older; nothing for Young); <br>• "I have a question" in the dock's overflow; <br>• an on-topic question becomes an `explore_question` beat after the current item; <br>• an off-topic one goes to the Question jar with an acknowledgement. The jar stores the Brain's PII-scrubbed paraphrase through RELATIONAL-OS's write path (W3-F), never the child's raw words | 2.5 |
| 4 | **SF4:** the Notebook's **Made for you** shelf (every revealed piece, replayable offline for library builds, never counted) and the **Questions in the jar** page. Then and now is W4-F | 2.0 |
| 5 | **SF5:** Hello H3 (NameSayer name check), H6 (how to start), H7 (how to hear things), ≤ 90 s total; lesson-1 rules (library-only builds; no probes before the first success) | 1.5 |
| 6 | **SF6:** the Summary's one "what helped?" tap for Older children (recorded as a choice and moves a knob) and made-for thumbnails | 1.0 |

**Acceptance:**
- **brain-sim pedagogy gates** (40 personas × 3 lessons):
  - misconception holders get a contrast beat within 2 turns of verification in ≥ 90%;
  - strained personas get 0 new builds;
  - correct-answer-trap personas get a why-probe before any "learned" state;
  - low-baseline personas get worked entry ≥ 90%.
- **Builds in the sim:** prefetch or library hit ≥ 70% [U target], 0 reveals without a grounded reference, 0 waits
  shown to the child.
- **TEACHER-BRAIN production acceptance** (`tests/prod/brain.mjs`):
  - **1:** a scripted misconception child (fractions, Hinglish voice) gets a Studio piece for that misconception,
    revealed on cue within the first contrast beat; the reply refers to what is on screen; the answer is a
    `via=studio` evidence row;
  - **2:** a strained child (three "pata nahi") gets a step-down and a break with choices, and the trace shows
    `studio.rejected: strained`;
  - **3:** a curiosity question mid-explain inserts `explore_question` after the item resolves, never mid-item;
  - **6:** kill Studio, and the beat runs on the skeleton or the T1 engine.
- **STUDENT-FLOW journeys 1 (first meeting, no live build), 3 (curiosity and jar), 4 (strain), 8 (reflect)** on
  production at 360×640 and 1280.
- The cascade regression floor from W2-E still holds (p50 ≤ 3.2 s); beats add ≤ 5 ms per turn.

### W3-F: Relational OS II: the voice of the bond, memory, rituals, milestones (≈ 15 d)

**Delivers:** RELATIONAL-OS R2, R5, R6 (with STUDENT-FLOW SF7) and R7.

**Owned paths:**
- `server/relational/**`;
- `server/compiler/relational.js` (new), `server/compiler/characters/*.taste.json`;
- `server/director/safety.js` (carve-out continues);
- `server/reports/relational.js`, `src/parent/{memory,moments}/**`;
- `src/child/screens/Teacher.tsx` (tab `remembers`);
- `data/rituals/**`, `evals/relational-os/**`, `tests/prod/w3f-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **R2:** <br>• the CORE REL block per stage × band (five lines, ≈ 190 tokens, quote-free, cached); <br>• CHILD rows (≤ 120 tokens, shed order 5); <br>• tail rows (≤ 30 tokens on ≤ ~20% of turns); <br>• lint, budget gate, persona-invariants; <br>• the P2 re-run on the real compile at n ≥ 10 | 2.0 |
| 2 | **R5:** <br>• callback selection and the post-hoc claim check (she may claim only callback ids in the turn tail); <br>• rituals (child-chosen, ≤ 2 active; OPEN/CLOSE shapes, christening, festival rows); <br>• milestones as threshold crossings in the KT and comprehension ledgers, fired once (Meera's laws); <br>• the character taste rows (pull-only, reviewed) | 5.0 |
| 3 | **R6 + SF7:** <br>• the lesson-end consolidation job (one `taxila-fast-bg` call, ≤ 4k in / 600 out, code-validated: every item cites a child turn whose words contain its content words; 0 from teacher turns; 0 under consent "No"; a single-mention interest never becomes an item); <br>• parent "What {T} remembers" (view, delete) and "Moments" as typed templates; <br>• the child's **What {T} remembers** on the Teacher screen, one screen for every child, read aloud with picture cards for Young, a forget button, a parent-can-see line; <br>• the published child-safety protocol page (O-R5) | 5.0 |
| 4 | **R7:** <br>• the overlay: in-session dependency moves in every mode; the cross-session path built for M3 and gated, with the M1 write path throwing; <br>• safeguarding to `incident` with the queue owner from O-R2 | 3.0 |

**Acceptance:**
- **CI:**
  - AT-U9 (the CORE block and taste rows are quote-free, bracket-free, carry no address or kin word, and share no
    5-gram with any battery input);
  - AT-U11 (milestones fire once across replays and devices, never from a time tick);
  - G-MEMORY.
- **Live model:**
  - **AT-B3:** fabricated specific claims are 0, and listed-fact recall is ≥ 9/10;
  - **AT-B5:** false confession is 0 and a defended real error is 0;
  - **AT-B7:** brevity and language side effects are no worse than arm A by more than 2 pp;
  - **AT-B8:** ≤ 1% of replies carry a ≥ 5-word span from the prompt;
  - **AT-B1 re-run on both lanes** with the REL block in place: still 0 F-class violations.
- **Production Playwright:** Forget on the child's page removes the item for both the child and the parent within
  one refresh. The Young read-aloud page plays. Parent pages show typed templates only (no model prose).

### W3-G: Studio II: live builds mid-lesson, images, mini-sites, 40 archetypes, the batch lane (≈ 20 d, fan-out inside the stream)

**Delivers:** LIVE-STUDIO S5b (the Studio side of beat-driven intents), S8, S9, archetypes 13-40 and the offline
pre-warm batch lane; rev 1's W3-D #5 (the image library).

**Owned paths:**
- `server/studio/**` (W2-F's and W2-H's files, now one owner);
- `src/studio/**`, `infra/studio-qa/**`;
- `server/studio/image.js` (new), `scripts/media/**`, `data/media/**`;
- `evals/live-studio/**`, `tests/prod/w3g-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **S5b:** the router's admissibility per beat; lead-time enforcement (`neededAtMs − now` ≥ the archetype's race p90, else `opportunistic`); opportunistic late reveals; animation `steps` advanced on the Brain's clause cues (phrase-level, 400 ms pre-roll) | 2.0 |
| 2 | **S8, the ACA Sandboxes pool** (after O16): warm Chromium snapshots, per-build contexts, recycle; the `studio-qa` app stays as the fallback lane | 2.0 |
| 3 | **S9:** <br>• **the images lane:** FLUX.2-pro for text-free art, `taxila-image` low for reference/edit, Kontext for consistent edits; OCR any-text = fail; Content Safety image check; a binary vision checklist; labels drawn by code; "Picture made by computer" (O9); the per-kit-topic offline image library; <br>• **mini-sites:** 3-5 pages, each gated, revealed as each page passes; <br>• the **tween, chart, geometry (JSXGraph-MIT), map and timeline truth primitives** | 6.0 |
| 4 | **Archetypes 13-40** (fan-out; each with ≥ 30 bench runs and a published P(pass by deadline)); **the offline pre-warm batch lane** on Kimi, DeepSeek and codex at batch prices, with no deadline and the same gate. It builds every admissible (archetype × skill × band × lang family) identity for c4-c8 maths and science first (O21), then the rest | 8.0 |
| 5 | **Studio variants as experiment arms:** ≤ 3 promoted variants per identity are registered with W4-E's registry, with reward = next item correct unaided. The weekly report covers the archetype × model table, P(pass by deadline), cost per passed build, incidents, transfer, and learning deltas vs the fallback | 2.0 |

**Acceptance:**
- **Live-buildable archetypes:** every archetype marked live passes P(pass by lead) ≥ 0.95 at n ≥ 30. The count is
  published. The claim "built live mid-lesson" is made only for those.
- **Gate in the sandbox pool:** p50 ≤ 8 s, with 0 shared state between builds (a planted cross-build marker is
  never visible).
- **Images:** 100% text-free on 100 images; 0 Content Safety fails reach a child; live images only after O15 (until
  then they are library and near-line only).
- **Mini-site:** one is built across a production lesson; every page is gated; the quiz page is host-graded.
- **Library hit rate in production:** ≥ 90% of intents served from the library after warm-up [U target]. Live spend
  ≤ $0.60 per child-month, measured.
- **LIVE-STUDIO AT-6:** param transfer ≥ 0.9 on promoted builds, and anchoring 100% on promoted process animations.

> **What the owner can test after Wave 3:**
> - **Evidence:** a teacher who tells understanding from recitation, in Hinglish and by taps, with
>   catch-the-mistake moments and counterfactual twins, and an honest live comprehension number.
> - **The lesson:** a lesson in beats. "I have a question" works everywhere, and the jar answers at wrap.
> - **Live building aimed at the mistake:** a game, animation, image or mini-site made for the mistake your child
>   just made, arriving on cue. About 40 kinds of thing exist, and the shelf keeps all of them.
> - **The bond:** she remembers (with consent) and says only what she really remembers, keeps a ritual your child
>   chose, and notices a real milestone once. The child and the parent can see and delete everything she keeps.
> - **Generation:** games built overnight appearing in practice, and English and Hindi activities.
> - **The day:** a lesson that follows the day plan, parents setting weekly slots, and "What helps" and CoPilot
>   cards.

---

## 6. Wave 4: BREAKTHROUGH II: this child, a human conversation, ready to prove it

Six streams.

**The W4 seam commit:**
- W4-E's `server/brain/experiments.json` registry is the only place arms are registered;
- B and C register through `server/learner/arms/*.js` (B) and `server/research/points.js` (C);
- migration numbers are allotted.

### W4-A: Listening and the long conversation (≈ 10.5 d)

**Closes:** steal 15; the data half of Bet 3; HUMAN-VOICE B6 lane B and B10 integration.

**Rev 2 change:** rev 1's items 1 (predictive end-of-turn) and 3 (the body-first wait and echo) shipped in W2-E
(BR2b). What remains is the contingent listener, the child fine-tune of the turn model, and the voice upgrades.

**Owned paths:**
- `src/lesson/**`;
- `src/avatar/{behaviour.ts,lip.ts,tap.ts}`;
- `server/voice/**` except `readaloud.js`;
- `public/models/**`, `evals/turn/**`, `scripts/turn-finetune/**` (new), `tests/prod/w4a-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **A contingent listener (steal 15):** visual nods only, on a prosodic backchannel-opportunity event; speaking-rate matching within band bounds; idle layering so 45 minutes never loops | 4.0 |
| 2 | **The turn-model data engine (steal 3, Bet 3):** <br>• the E1 turn-model consent clause is W4-C's; <br>• timestamps train a Next-Turn-style child fine-tune on the build GPU or Azure ML; <br>• prompt-match auto-labelling (both ASR lanes match the expected answer exactly) plus a 5% human audit produces Custom Speech `hi-IN` ground truth; <br>• an offline harness compares SHIFT/HOLD AUC for silence vs stock Smart Turn vs the fine-tune, per band and item type | 3.0 |
| 3 | **Lane B (if P-VL passed in W2-D):** `voicelive.js`. gpt-realtime-2.1 reasons and the character's DragonHD voice speaks, carrying the same expressive compiler | 2.0 |
| 4 | **Rung 2 (when O19 delivers):** <br>• the Professional Voice from one consented teacher; <br>• the **recorded** breaths, hums, chuckles, laughs and relief sighs replace the Omni-sourced bank; <br>• HV-6, HV-9 and HV-14 re-run; <br>• RELATIONAL-OS AT-C4 (persona continuity) blocks the swap if children do not hear "the same teacher" | 1.5 |

**Gates:**
- **E-NOD1** rated blind.
- **The real turn gate is on E1 consented children (pilot):** SHIFT/HOLD AUC ≥ 0.85 and the p50 gap ≥ 300 ms better
  than the 900 ms arm.
  - If the fine-tune adds < 0.03 AUC over stock Smart Turn, ship stock (the Bet 3 kill condition).
- Lane B: HV-12 answered, first byte within HV-7's bar, AT-B1 green on lane B before it carries a child.
- Rung 2: the panel bar (HV-10) vs stock DragonHD.

### W4-B: Generated for this child (≈ 15.5 d)

**Closes:** personalisation 4 (content) and 7; steals 14, 21 and 22.

**Rev 2 changes:**
- the format allocation and the difficulty bandit register their arms in W4-E's registry (BR6) rather than building
  their own;
- **per-child format posteriors stay session-only** until all three LM9 gates pass *and* counsel confirms the
  NM-3 exception (open item `lm9-vs-nm3-format-posteriors`, O25);
- population allocation is unaffected.

**Owned paths:**
- `server/director/**` except `modules.js`, `state.js` (E, hot) and `safety.js`;
- `server/reskin/**` (new), `server/learner/**` (including `arms/**`);
- `evals/interest-corpus-audit.mjs`, `evals/student-sim/**`, `tests/prod/w4b-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **Interest re-skins in the child's own words (steal 21):** <br>• realism, solvability, readability and locale validators on taxila-brain; <br>• a **`kitmath` isomorphism check in code** proving the key is unchanged; <br>• fall back to the kit; <br>• a nightly corpus audit (entity entropy, currency and region). <br>An interest moves content only after the child names it on ≥ 2 separate days (`teacher-brain-interest-two-day`). An engagement knob until F-INT shows learning | 7.0 |
| 2 | Population format allocation over F1-F8 **and the Studio piece variants** (Thompson, an expertise-reversal gate, a 20% floor, logged with p), registered in BR6 | 3.0 |
| 3 | **A difficulty bandit inside one `admissible(view, action)` predicate (steal 22):** reward = next item correct *unaided*; an engagement-without-mastery monitor; registered in BR6 | 3.0 |
| 4 | **FIRe fractional review credit, and retrieval-until-correct for classes 1-3 (steal 14).** Simulator first | 2.5 |

**Gates:**
- Isomorphism **100%** (blocking).
- Validator pass ≥ 90% at round 1.
- Corpus-audit seeded-defect recall ≥ 0.9.
- 0 request-path model calls.
- `personalisation-diff` (a): different contexts on ≥ 50% of eligible items, with byte-equal keys.
- Bandit: engagement-without-mastery ≤ 10%.
- FIRe: non-inferior on delayed retrieval (margin 3 pp) in the simulator before production.

### W4-C: Research readiness (≈ 13 d)

**Closes:**
- comprehension G12, the measurement half of G10, and §5.2-5.3;
- personalisation 9 (part 2);
- steals 4 (gate), 7 and 13;
- the analysis halves of Bets 1, 2 and 5;
- **RELATIONAL-OS R9's instruments.**

**Rev 2 change:** the MRT plumbing (randomisation, floors, propensities, frozen windows) is W4-E's BR6. W4-C keeps the
analysis.

**Owned paths:**
- `server/research/**` (new), `evals/mrt/**`, `evals/pilot-instruments/**` (new);
- `server/comprehension/{state.js,schedule.js}` (carve-out for "still checking");
- `docs/research/psychology/**`;
- the consent route additions in `server/routes/account.js`;
- `src/review/**` (new internal reviewer screen), `tests/prod/w4c-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **"Still checking" (steal 7):** bootstrap bands from the BKT-R refit; an `uncertain` flag that always triggers a probe; parent wording. Conformal risk control on parent claims (X6), and emission learning from delayed outcomes (X5) | 3.0 |
| 2 | MRT analysis on BR6's records: the F-ENTRY, F-FADE, F-INT and F-CONC points declared in `points.js`; a weekly GEE excursion report; the **tercile release gate** (bottom / top ≥ 0.8); LAYS per $100 | 2.5 |
| 3 | **The misconception harvest (steal 13):** a weekly review queue of `other` and `partial` grades. Accepted entries enter the kits through the verification path. This is the start of the NCERT misconception atlas (Bet 5) | 2.0 |
| 4 | An M-GRADE labelling tool and protocol (300 turns per family × EN / Hinglish / Hindi). E1 consent clauses (turn model, research). Phase 0 instrumentation | 2.5 |
| 5 | The Paper 2 outline and the Study A preregistration (OSF). An offline text-LLM KT challenger (U-S3) as a cold-start prior source, after a leakage audit | 1.5 |
| 6 | **Bond instruments for the pilot (RELATIONAL-OS AT-C1-C6):** <br>• the 6-item child-adapted alliance check, read aloud by the app voice at weeks 2, 6 and 12; <br>• the closeness picture task for B1-B2; <br>• safe-to-be-wrong attempts per session by stage; <br>• the parent dependency items; <br>• "is the teacher a person?" after 10 minutes (target ≥ 90% correct); <br>• the outward-pointing parent item | 1.5 |

**Gates:**
- **X5:** recovers emissions within ±0.1 without overfitting the third truth family.
- **X6:** realised false-`understood` ≤ α across 30 seed splits.
- Abstention rate ≤ 20%.
- Tercile and MRT reports generate on simulator data.
- **Reviewer acceptance ≥ 30%** over the first cycles, or the harvest becomes a monitor.
- The AT-C instruments run end to end on a test account and write consented rows only (P4).

### W4-D: Reading, the HD face, latency (≈ 11 d)

**Closes:** steals 17 and 18; teacher-anim 5 and the H tier; the smooth G5 region decision.

**Owned paths:**
- `server/voice/readaloud.js` (new), `data/passages/**`, the read-along frame engine in `src/modules/frame/engines/`;
- `src/avatar/{tier.ts,three/**}`;
- `server/forge/{index,planner,cache}.js`;
- `infra/**` except `infra/studio-qa/**`.

| # | work | est. |
|---|---|---|
| 1 | **Read-aloud scoring on Azure Pronunciation Assessment (`hi-IN`, `en-IN`) (steal 17):** NCERT passages in chunks of 30 s or less, per-word miscues, and challenge words fed to the ledger at low weight **only after** miscue κ ≥ 0.7 against humans. Narration lines come from HUMAN-VOICE B7's annotator cache | 5.0 |
| 2 | The H tier (the W2 visemes direct) on allow-listed GPUs with ≥ 6 GB RAM. The device lab on 3-4 phones (O4b) against the teacher-anim §5.4 bars. If the Helio G85 fails B+, add Mali-G52 MC2 to `LITE_GPU` | 3.0 |
| 3 | Off-plan latency (steal 18): token diet, drop nulls, the Lark DSL trial, keep-alive, speculative fills mounted only on match. Region: act on the W1-D and W2 India numbers. That means a Central India web tier behind Front Door only if the DB and client hops dominate, and **the Azure Speech resource in Central India (O17a)** if the TTS first byte from eastus2 misses HV-7 | 3.0 |

**Gates:**
- T1 p50 ≤ 1.0 s (from 1.88 s); T2a ≤ 2.0 s.
- Speculation waste ≤ 60%.
- Device bars: fps p50 ≥ 0.95 × cap, ≤ 4 long frames per 10 s, first 3D frame ≤ 1.5 s from cache.
- Read-aloud: κ ≥ 0.7 before any ledger write.

### W4-E: Teacher Brain III: experiments, the long arc, the simulator at scale (≈ 11 d)

**Delivers:** TEACHER-BRAIN BR6, BR7, BR9 and BR10. BR6 lands first (days 1-4), because W4-B and W4-C register into
it.

**Owned paths:**
- `server/routes/lesson.js`, `server/brain/**`, `server/director/state.js` (hot);
- `server/brain/experiments.{js,json}`, `server/brain/fold.js`;
- `server/conductor/{planner,events,validate}.js` (carve-out: prefetch and relational slot fields, V28-V29);
- `evals/brain-sim/**`, `tests/prod/w4e-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **BR6:** <br>• the experiments registry, allocation, availability and propensity; <br>• frozen 6-week windows; <br>• harm monitors as co-primary outcomes; <br>• pause events; <br>• the **never-randomise list enforced in code** (safety, honesty, answer truth, the hint ceiling, consent, praise category, limits); <br>• the first two points run in shadow (logged, not randomised) | 3.5 |
| 2 | **BR7, the long-arc fold:** <br>• population format posteriors (per-child only under the O25 resolution); <br>• knob shrinkage with the distinctiveness rule; <br>• hysteresis (one step per 2 consistent signals per 10 turns); <br>• Studio library stats; <br>• stage from RELATIONAL-OS `bond.js` (never computed here) | 3.0 |
| 3 | **BR9:** brain-sim at scale, the offline proposer harness (the TB1 reversal test, on `gpt-6-sol` when O26 lands), and dashboards | 3.0 |
| 4 | **BR10:** turn experiments on (P1 equipoise points) after a 2-week shadow; the MRT points under P4 at the pilot | 1.5 |

**Acceptance:**
- **G-NEVER-RAND:** a planted safety arm fails the build.
- **G-PROPENSITY:** every randomised decision writes `decision_record` with p, and replay reproduces 100% of chosen
  actions.
- **brain-sim §15.2 gates all green**, including the equity sim gate (bottom/top tercile proximal-reward ratio ≥
  0.8).
- The first frozen window opens with monitors on a test cohort. The trace shows arms, p and availability.
- The proposer harness runs 1,000 scenarios and reports admissible rate and hard violations for code vs model. The
  TB1 reversal condition is evaluated and logged.

### W4-F: The family view, release batteries, and the journeys (≈ 11.5 d)

**Delivers:** TEACHER-BRAIN BR8 with STUDENT-FLOW SF8, the Then and now page (rest of SF4), RELATIONAL-OS R8 and
STUDENT-FLOW SF9.

**Owned paths:**
- `server/routes/parent.js`, `server/reports/**`, `src/parent/**` (including `Teaching.tsx`, new);
- `src/child/screens/Notebook.tsx` (Then and now);
- `evals/relational-os/{battery,longsim}.mjs`, `tests/visual/**`, `tests/prod/flow.mjs`, `tests/prod/w4f-*.mjs`.

| # | work | est. |
|---|---|---|
| 1 | **BR8 + SF8, the parent loop:** <br>• the daily **Made for {child}** card; <br>• the try-at-home result; <br>• **"How {T} teaches {child}"**: the made-for list with each reason, memory items with delete, and the experiment section shown only under research consent P4; <br>• all claims gated, answered from `brain_trace` rows | 5.0 |
| 2 | **Then and now** (term, month 3+), built only from evidence, gated on BR7 | 0.5 |
| 3 | **R8, release batteries in CI:** <br>• AT-B1 (both lanes, now including lane B if it exists); <br>• AT-B2 long horizon (140-turn lessons, 6 personas × 3 runs; violations do not rise with turn index); <br>• AT-B5, AT-B7, AT-B8; <br>• the AT-C4 persona-continuity harness that blocks a model, voice or prompt upgrade | 4.0 |
| 4 | **SF9:** Playwright journeys 1-9 on production (360×640 and 1280, Young and Older), the gamification lint (no points, streaks, coins, XP, levels, ranks, leaderboards or timers on child routes) and gap invariance | 2.0 |

**Acceptance:**
- TEACHER-BRAIN production acceptance 5: the parent page lists the made-for item with its reason and the memory
  items with delete.
- STUDENT-FLOW journeys 1-9 green. The gamification crawl finds 0 forbidden tokens.
- AT-B1, AT-B2 and AT-B5-B8 are wired as release gates: a planted regression in the REL block blocks a deploy
  dry-run.
- A simulated model upgrade without the AT-C4 harness result is refused by `deploy-azure.mjs`.

> **What the owner can test after Wave 4:**
> - **Conversation:** a teacher who nods while the child talks, matches the child's pace, and (if the probe
>   passes) speaks in the character's own voice on the premium lane too.
> - **Reading:** read-aloud practice with per-word feedback.
> - **This child:** problems set in the child's own interests, with provably identical answers, and difficulty
>   chosen for unaided success.
> - **Experiments within ethics:** every randomised choice is logged with its probability, and nothing on the
>   safety or honesty list is ever randomised.
> - **The family view:** "How {T} teaches {child}", with every made-for piece and its reason, and every memory with
>   delete.
> - **Honesty:** "still checking" shown to the parent where the model is unsure.
> - **Face:** the HD face on strong phones.
> - **Research:** a research stack, with bond instruments, ready to start the pilot.

---

## 7. Research experiments and their gates (consolidated)

| id | where | experiment | pass gate | if it fails |
|---|---|---|---|---|
| X0 | W1-C | live-fidelity baseline (`engine` vs `live`) | `live` is the published number; divergence explained | none: this is the honest number |
| X1 | W1-C | oracle-prober ceiling | every number reported as a fraction of the oracle | none |
| X7 | W1-C | battery validity (VC1-VC7 + gamer) | every mutant fails at least one bar | battery invalid; no sim claim |
| RT-M2 | W1-C | re-teach loop vs random arms (20 seeds) | beats random on DRS | loop does not ship |
| settle | W1-C | why-verdict settle rate, 30 production lessons at 0/1/2/4 s | ≥ 95% | the async grade stays a correction-only path |
| **studio-bar** | W2-F, W3-G | router bench per archetype, race of two | P(pass by lead) ≥ 0.95 at n ≥ 30 | the archetype is library-only (built offline, gated, reviewed) |
| **studio-mutants** | W2-F | seeded-mutant recall of the gate | recall 1.0, 0/6 false alarms | no reveal path ships |
| **studio-library** | W3-G | library hit rate after warm-up; live spend | ≥ 90%; ≤ $0.60/child-month | more pre-warm; tighter live caps |
| **G-QUOTA** | W2-E | 20 concurrent races + consolidation burst on a shared deployment | 0 hot-path 429s | background lanes off until the O13 twins exist |
| **turn-timing** | W2-E | Central India cascade, 30 turns per band | first sound p50 ≤ 1.6 s; reply p50 ≤ 2.5 s; cut-offs ≤ the 900 ms arm | `turn.predictive` off; L0/L2/L3/L5 alone; regression floor p50 ≤ 3.2 s stays hard |
| **G-SIG** | W2-E | signals on classify, full item set, two raters | labels ≥ 99% agreement; acts ≥ 0.9 | signals off; regex fallbacks |
| **HV-9 ear** | W2-G (O20) | the owner's blind page, 40 pairs | splice tick ≤ 1 in 5; expressive preferred or tied ≥ 4/5 lines per voice | clips off; breaks and markers only |
| **HV-16 prelude** | W2-G/E (O27) | right/wrong guessed from the uptake prelude, ≥ 10 blind listeners | ≤ 55% | prelude off |
| **AT-B1** | W2-I, W3-F, W4-F | adversarial dependency battery, **both lanes**, audio-in ≥ 1/3 | 0 F-class violations by two blind coders | the REL block reverts to an appended-last slot or HOLD_ONE_TURN; no release |
| **AT-B2** | W4-F | long horizon, 140 turns | violation slope CI includes 0; ≤ 1/100 turns | no release |
| X4 | W3-A | grader stress (recite, parrot, authority, Hinglish own words, answer-only) | P(present\|recite) ≤ 0.10; P(present\|HL own) ≥ 0.80 | translate-then-grade or encoder second operator |
| X3 | W3-A | code-graded R-CATCH forms | additive over the live policy | drop |
| errType κ | W3-A | 200 human labels | κ ≥ 0.6 before routing | logs only |
| **X2** | W3-B | CMP counterfactual pairs | macro ≥ 0.70 both families; verbal gap ≤ 10 pp; load ≤ 2.5; false mastery ≤ 0.05 / 0.02 | CMP stays practice; no claim raised |
| **brain-sim** | W3-E, W4-E | pedagogy, builds, equity in the sim | §15.2 bars | the component does not ship |
| X5 | W4-C | emission recovery from delayed outcomes | ±0.1, no overfit on the third family | keep author priors, log the null |
| X6 | W4-C | conformal risk control | realised false-understood ≤ α over 30 splits | report; widen α only with owner sign-off |
| F-gates | W2-C, W4-B | `personalisation-diff` (a)-(f), n ≥ 3 per arm, production | all six | the component does not ship |
| Bet 4 | W2-B, W3-D | strict all-checks per template and archetype; off-plan first paint | ≥ 95%; p90 ≤ 300 ms | off-plan falls back to curated |
| lip | W2-D | Hindi lip bench | ≥ 76/84 closures, false-close ≤ 20% | the H tier stays off |
| face | W1-F, W2-D | **the owner's eye** on the licensed-head side-by-side (numeric gates advise only) | the owner picks | stylised professional base (O1b) |
| pace | W2-G | chars/s per voice from `<prosody rate>` (HV-15) | 11-13 chars/s plus an ear test | voice swap |
| turn | W4-A → pilot | SHIFT/HOLD AUC on E1 | ≥ 0.85 AUC; p50 gap ≥ 300 ms better | stock Smart Turn (Bet 3 kill) |
| WB-M1 | W3-A → pilot | recognition success after IDK_R vs IDK | gap ≥ 20 pp | merge the outcomes |
| M-GRADE | W4-C → Phase 0 | grader κ vs 2 CBSE raters per graderVersion | κ ≥ 0.7 | no LLM verdict reaches parents un-hedged |
| equity | W4-C | bottom / top tercile gain ratio on `y_delay` | ≥ 0.8 or the release is blocked | revisit with our own data (Bet 2 kill) |
| read-aloud | W4-D | miscue agreement vs humans | κ ≥ 0.7 | practice only, no ledger |
| **bond** | pilot | AT-C1-C6 (alliance, safe-to-be-wrong, dependency, continuity, AI understanding, outward pointing) | as RELATIONAL-OS §12.3; AI understanding ≥ 90% | closeness without learning gain means the bond is decoration; disclosure cadence changes |

**After the waves (owner inputs O10):**
- **Phase 0 pilot** (n ≈ 300): M-GRADE, settle rate, M-PT, CMP blind-solve, E1 data, and the AT-C bond readings.
- **Study A:** 150 children, about 600-750 child-concepts. Criteria: blinded clinical interviews and 30-day far
  transfer. Baselines: a K-only BKT rule, a quiz, an LLM transcript judge and the class teacher.
- **Study B:** a within-child MRT comparing CMP, why-probes and re-exposure.
- **The Studio learning question** (the directive's experiment): next-item-unaided correctness after a Studio piece
  vs the fallback rung. It runs as a registered BR6 point once the pilot consents P4.

**The MRT factors** F-ENTRY, F-FADE, F-INT and F-CONC each report a tercile table.

---

## 8. Steal-list and bet placement

| # | item | wave · stream | note |
|---|---|---|---|
| 1 | diagnose error type | W3-A | routes only after κ ≥ 0.6 |
| 2 | guidance ladder + backward fading | W2-C | the unused `fadedVersion` |
| 3 | predictive end-of-turn | **W2-E (BR2b L1)** · fine-tune W4-A | real gate on E1 children |
| 4 | equity floor | profile W2-C · gate W4-C | |
| 5 | never an answer mode | W2-C | in `npm test` |
| 6 | dose by schedule, LAYS per $100 | slots W3-C · LAYS W4-C | |
| 7 | "still checking" | W4-C | with conformal |
| 8 | IDK vs IDK_R | W3-A | the split rides on classify from W2-E |
| 9 | skeleton-first live fills | W3-D (G1 fills) · **W2-H (Studio skeletons, LIVE-STUDIO D1)** | |
| 10 | conversation mix, child talk share | W2-C | |
| 11 | TTS pace recipe | **W2-G (HUMAN-VOICE B1)** | `<prosody rate>` honoured on en-IN DragonHD; supersedes `rj-prosody-rate-on-dragonhd` |
| 12 | body-first wait + code echo | **W2-E (BR2b L0/L3)** with W2-G's prelude synthesis | gated by HV-16 |
| 13 | per-item misconception harvest | W4-C | the atlas (Bet 5) |
| 14 | FIRe + retrieval-until-correct | W4-B | sim first |
| 15 | contingent listener | W4-A | |
| 16 | GNM face base | **superseded** by `owner-rejects-generated-faces` | rewritten as a licensed head solved to our ARKit/viseme contract (W1-F, W2-D). The A2F-3D offline lip teacher stays available at build time (W4-D, optional) |
| 17 | read-aloud scoring | W4-D | |
| 18 | off-plan latency | W4-D | |
| 19 | strict Forge gates | **W2-F (Studio gate)** · W3-D (templates) | one check library |
| 20 | negative memory last | **W2-F (Studio repair)** · W3-D | |
| 21 | interest re-skins + corpus audit | W4-B | engagement knob until F-INT |
| 22 | difficulty bandit + admissible predicate | W4-B, registered in W4-E's BR6 | |
| 23 | kit schema v-next | W3-B | |
| 24 | grader hygiene | W3-A | |
| 25 | parent CoPilot card | W3-C | the clip waits on consent |

**The bets:**
- **Bet 1 (Epistemic Speech Evidence):** the text features in W3-A; the analysis in W4-C. The voice-timing
  features are blocked on O8.
- **Bet 2 (gap-closing tutor):** W2-C, W3-C and W4-C.
- **Bet 3 (Hinglish turn-taking):** **W2-E** (stock model, probe-fleet gate), W4-A (fine-tune), then pilot data.
- **Bet 4 (verified-instant content):** W2-B, **W2-F/W2-H/W3-G (Studio)** and W3-D.
- **Bet 5 (misconception atlas):** W3-A and W4-C. Studio's `studio_gap` demand rows feed it too.

**Kept for later:**
- the splat HD tier (only if the chosen head suits it; the photoreal face is a deliberate non-bet);
- constraint-solved figures beyond the W3-G geometry primitive;
- PromptWizard;
- speak-while-you-sketch;
- Manim-style offline video into the library (LIVE-STUDIO §3.13; AWS/ACA build lane), after W3-G.

The lane-B Voice Live probes moved from "kept for later" into W2-D (P-VL) and W4-A (`voicelive.js`). Preview features
for minors still need O-preview.

---

## 9. Gap traceability (every audit gap and every superhuman build step has an owner)

| audit | gap → wave · stream |
|---|---|
| **flows-ux** | G1 W1-A · G2 W1-B (server) + W1-A (client) · G3 W1-A · G4 W1-A · G5 W1-A · G6 W1-A · G7 W2-A · G8 W1-A · G9 W2-A (copy), and a second face per band from O1 / W2-D · G10 W2-A + W2-C · G11 W2-A + W2-C · G12-G14 W2-A · G15 W2-A (pad clipping W1-A) · G16 W2-A |
| **live-content** | 1-5 W1-B (4's weight W1-C) · 6 W2-B · 7a/7b W2-B · 7c W3-D · 8 W2-B (diagrams) + W3-D (language) + W2-H/W3-G (Studio diagrams and charts) · 9 W3-D (nightly paused in W1-D; resumed through the Studio library) · 10: `show` W1-B, pre-warm W2-B, "/" W1-A |
| **teacher-anim** | 1, 6, 7, 9, 10 W1-F · 2 superseded → licensed heads W1-F + O1 · 3 W2-I (affect producer, R4) + W2-D (map and face producer) · 4 W2-D · 5 W2-D (owner phone) + W4-D (lab) · 8 W2-D |
| **comprehension** | G1-G3, G8, G9 W1-C · G4 W2-A · G5, G6, G10 W3-A · G7 W3-B · G11 W1-A · G12 W4-C |
| **personalisation** | 1 W1-C · 2 W1-C (M1 default), O7 optional · 3 W2-C · 4 W2-C (registry) + W4-B (content) · 5 W2-B · 6 W1-B · 7 W4-B · 8, 12 W3-C · 9 W3-C + W4-C · 10 W2-C + W2-D · 11 W2-C · 13 W1-A |
| **smooth** | G1-G3, G9 W1-D · G4, G8 W1-A · G5 W1-D (measure) + **W2-G (fold) + W2-E (turn timing)** + W4-D (region) · G6 W2-A · G7 W2-D · G10 W1-D (config) + W2-A (app) |

**Superhuman specs → wave · stream (rev 2):**

| spec | step → wave · stream |
|---|---|
| **TEACHER-BRAIN** (35 d) | BR0, BR1, BR2, BR2b, BR5 **W2-E** · BR3, BR4 **W3-E** · BR6, BR7, BR9, BR10 **W4-E** · BR8 **W4-F** |
| **LIVE-STUDIO** (39 d) | S2, S3, S4, S10 (bench) **W2-F** · S1, S5a, S6, S7 **W2-H** · S5b, S8, S9, archetypes 13-40, batch lane, S10 (variants as arms) **W3-G** |
| **HUMAN-VOICE** (14.5 d + owner/external) | B0-B5, B7, B8 **W2-G** · B6 lane A + P-VL **W2-D** · B6 lane B **W4-A** · B9 ear rounds: owner O20 (W2), panel O20b (W3) · B10 rung 2 **W4-A** when O19 delivers |
| **RELATIONAL-OS** (33 d) | R0, R1, R3, R4 (server), first AT-B1 **W2-I** · R4 (face) **W2-D** · R2, R5, R6, R7 **W3-F** · R8 **W4-F** · R9 instruments **W4-C**, readings at the pilot |
| **STUDENT-FLOW** (19 d) | SF1 **W2-A** · SF3 **W2-H** · SF2, SF4 (shelf, jar), SF5, SF6 **W3-E** · SF7 **W3-F** · SF8, SF4 (then and now), SF9 **W4-F** |

**Rev 1 items that moved, and where they went** (none was dropped):

| rev 1 item | moved to |
|---|---|
| W2-C #7 (`ui.affect`) | W2-I R4. One affect producer; never keyed to correctness |
| W2-D #2 (round-trip fold) | W2-G #7 |
| W2-D #4 (pace) | W2-G B1 |
| W3-C #2 consumption half | W3-E BR3 `planLesson` |
| W3-D #1 G2 delivery | through the Studio library (W3-D #1, W3-G) |
| W3-D #5 (images) | W3-G S9 |
| W4-A #1 (predictive end-of-turn) and #3 (body-first wait and echo) | W2-E BR2b |
| W4-B #2 / #3 arms | BR6 registry |
| W4-C #2 plumbing | W4-E BR6 |

Every gap rated "blocks testing" lands in W1 (unchanged):
- flows G1-G4;
- live 1-4;
- teacher 1 and 2: the runtime is wired, and the face is decided by O1 at the end of W1;
- comprehension G1-G3 and G8;
- personalisation 1, 2 and 6;
- smooth G1 and G2.

Two partial exceptions are stated plainly:
- **Personalisation 3, "is it working?":** it needs real outcomes, so its measurement half is W3-C and W4-C. What W1
  makes testable is that children get different, evidence-driven teaching.
- **Comprehension G12, the paper:** it is writing, so W4-C.

---

## 10. Owner decisions and inputs (minimised; each has a default)

### 10.1 Decisions and listening

| id | when | what | default if no answer |
|---|---|---|---|
| **O1** | end of W1 | **Pick the teacher head** from the licensed side-by-side (`docs/design/teacher/polished/`, `/dev/avatar`). The owner's eye is the gate (`owner-rejects-generated-faces`). The licence filter matters: Reallusion, TurboSquid and Daz block a raw GLB in a web app (SCOUT §1) | none: required. If nothing clears, O1b applies |
| **O1b** | with O1 | **If no licensed head clears your eye:** commission the stylised face (`teacher-stylised-face-commissioned`: a senior character artist, USD 4-12k freelance, IP assignment), or buy a professional stylised base. Optionally first run the blind child + parent panel on the stylised concepts (`open-stylised-panel`, n ≥ 20 per band) | the bought stylised base. The runtime, lip-sync and behaviour do not change |
| O2 | end of W1 | Approve buying heads if the best candidates are paid (one-off licence cost) | MIT heads only |
| **O20** | W2 (≈ 25 min) | **The voice blind test:** listen to `docs/design/superhuman/voice-clips/blind-test.html` (40 pairs, unlock after ≥ 80% played), export the JSON. **Plus the clip-licence decision (HUMAN-VOICE O-1):** may the breath, hum and laugh bank be rendered offline from the unlisted DragonHD Omni sibling, or must it wait for recorded human clips (O19)? | DragonHD with breaks, markers and `<prosody rate>`, **no clips** |
| O20b | W3 | The panel round (`voice-blind-test-v2-protocol`) adding the expressive arms, then child round 2 ("which teacher would you rather learn from?", never "is she a person?") | expressive ships on the owner's result alone, flagged as single-rater |
| **O27** | W2 | ≥ 10 blind listeners (owner, family, a teacher) for HV-16: guess right or wrong from the uptake prelude (20 pairs, about 10 min) | the prelude stays off; L0/L2/L5 still ship |
| O6 | none | **Superseded** by `owner-superhuman-teacher-2026-10-04`. Live codegen during the lesson is required. Human review moves to **library promotion**: 100% of the first 50 per archetype, then 10%. A first-time live build is shown to one child once, after the strict gate, and an unreviewed build serves at most 20 more mounts (LIVE-STUDIO §3.11) | as stated |
| O7 | optional | A consented move to M3 ("remember how {child} learns"), for memory of what the child said across lessons; needs counsel | the M1 academic-record path, which is enough for every W1-W4 acceptance test. RELATIONAL-OS memory runs in M1 with typed callbacks only |
| O8 | anytime | Send Microsoft one written question: does Code of Conduct restriction 12 cover latency-based *knowledge* inference? | voice-timing features stay out; text features proceed |
| O9 | W3-G | Generated images ship labelled "Picture made by computer" (counsel may later refine for synthetic-media rules) | ship with the label |
| O10 | after W4 | Pilot: IEC approval, schools or families for Phase 0 (n ≈ 300) and Study A (150) | no efficacy or breakthrough claim |
| O12 | optional | A WhatsApp Business number, for weekly reports over Azure Communication Services Advanced Messaging | email and in-app reports |

### 10.2 Model deployments and Azure resources (measured today, `evals/build-plan/deployments.mjs`)

**What is deployed now.** One Foundry account, `raghavsharma1729-compan-resource` (eastus2), has 31 deployments, all
GlobalStandard. The ones the superhuman product uses, with capacity in thousands of TPM for text models:

| use | deployments (capacity) |
|---|---|
| hot path | `taxila-fast` (gpt-5.6-luna, 500) reply and classify fallback; `grok-4-1-fast-non-reasoning` (500) production classifier; `taxila-realtime` (gpt-realtime-2.1, **10**); `gpt-realtime-2.1-mini` (30); `taxila-transcribe` (100); `gpt-4o-mini-tts` (50) |
| background and building | `taxila-brain` (gpt-5.6-sol, 500); `gpt-5.6-terra` (500); `taxila-codex` (500); `taxila-kimi-code` (100); `DeepSeek-V4-Pro` (500); `DeepSeek-V4-Flash` (125); `grok-4.3` and `grok-4-20-*` (500); `taxila-oss120`, `taxila-grok46` (200) |
| images | `taxila-flux2` (FLUX.2-pro, **1**); `taxila-image` (gpt-image-2, **4**); `taxila-kontext` (10) |
| retiring or excluded | `taxila-sora` (retiring 2026-10-15); `taxila-ds41` (Fireworks meter, excluded) |

**Quota headroom (subscription-wide, GlobalStandard unless noted)** decides which asks are one click and which
need a quota request:

| model | used / limit | consequence |
|---|---|---|
| gpt-5.6-luna, -terra, -sol | 500 / 2000 each | the twins fit **now**, no quota request |
| gpt-realtime-2.1 | **10 / 10** | maxed; DataZoneStandard has 0/10 free |
| gpt-realtime-2.1-mini | **30 / 30** | maxed |
| gpt-image-2 | **4 / 4** | maxed |
| FLUX.2-pro | 1 / 4 | can go to 4 now |
| Kimi-K2.7-Code | 100 / 100 | maxed |
| grok-4-1-fast-non-reasoning | 500 / 1000 | O13d fits |
| gpt-6-sol, gpt-6-luna, gpt-6.1-sol | 0 / 2000 each | deployable now |
| gpt-image-2.5-flare / -sunburst | 0 / 4 | new image models with quota, not deployed |

**There is no Speech resource outside eastus2.**

| id | when | create or change | why | fits quota? | default if not done |
|---|---|---|---|---|---|
| **O13a** | **start of W2** | `taxila-fast-bg`: gpt-5.6-luna, GlobalStandard, 500 | background twin of `taxila-fast`: Studio plan, consolidation, annotator. Hot and background never share a pool (`superhuman-quota-isolation`) | **yes** (luna 500/2000) | a token bucket caps background at 30% of `taxila-fast` |
| **O13b** | **start of W2** | `taxila-studio-sol`: gpt-5.6-sol, GlobalStandard, 500 | Studio's sol race arm off `taxila-brain`, which also writes parent texts and runs the Hindi Q8 check | **yes** (sol 500/2000) | the bucket caps Studio at 30% of `taxila-brain` |
| O13c | W2-F, if the bench shows queueing | `gpt-5.6-terra` 500 → 1000 | ≥ 20 concurrent races (each ≈ 2 × 6k output tokens in ~40 s) | yes | 500 (≈ 20 races) |
| O13d | before the pilot | `grok-4-1-fast-non-reasoning` 500 → 1000 | it becomes the per-turn perceiver with signals (TEACHER-BRAIN O-B1) | yes (500/1000) | 500 |
| **O14** | **W2-D** | **Realtime capacity.** (a) Now: a second realtime deployment `taxila-realtime-dz`, gpt-realtime-2.1 **DataZoneStandard**, 10. It doubles capacity without a quota request (US data zone). (b) Before the pilot: a portal quota request for gpt-realtime-2.1 (and the mini) GlobalStandard | P2: 66/168 responses rate-limited at 3-wide; both realtime quotas are maxed | (a) yes; (b) no | **the cascade is the default lane**, and realtime is a premium lane with cascade failover |
| O15 | before live images (W3-G) | `taxila-flux2` 1 → 4 now; a quota request to ≥ 20 for FLUX.2-pro and gpt-image-2 | 2 of 4 FLUX calls were rejected at 3-way concurrency | 1 → 4 yes; ≥ 20 no | images are library and near-line only |
| O16 | W3-G (S8) | **ACA Sandboxes:** raise the sandbox core quota (was 1); grant the SP *Container Apps SandboxGroup Data Owner* (`c24cf47c-5077-412d-a19c-45202126392c`) on a new group `studio-qa` in eastus2 | the microVM boundary for the gate | portal | the `studio-qa` Container App lane in `taxila-forge-untrusted` (≈ $78/month) |
| O17 | W2 | (a) an **Azure Speech resource in Central India**; confirm en-IN DragonHD Diya, Arjun and Meera there; (b) a support ticket on whether SSML markup characters are billed, why en-IN DragonHD speaks paralinguistic tags, and the GA dates for hi-IN DragonHD Omni and MAI-Voice-2.1; (c) **enable Voice Live** on the Foundry resource with DragonHD voices (P-VL); (d) a private Blob container `voice-bank` (an agent can create it with the storage key if you prefer) | HV-7 from India; cost certainty; lane B | portal / ticket | (a) eastus2 Speech; (b) collapse `<prosody>` to once per reply if billed; (c) lane A only |
| O19 | start now (long lead) | **Professional Voice Limited Access** application, and commission one consented work-for-hire Hindi-English teacher, including the non-verbal session (40 breaths, 40 hums, 30 chuckles, 20 laughs, 20 relief sighs) | "exact human": real recorded non-verbals in the exact timbre; removes the O20 licence question | external | stock DragonHD + the bank as decided in O20 |
| O26 | W4-E | Deploy `gpt-6-sol` and `gpt-6-luna` (quota 0/2000 each, fits) | the offline proposer test (TB1 reversal) and the reply bake-off. Off the live path | yes | the test runs on `taxila-brain` |
| O11 | superseded | by O14 | | | |

**No new model is required to ship W2.** O13a and O13b are the only deployments that remove a measured risk
(G-QUOTA) and fit today's quota. Everything else has a default.

### 10.3 Human time

| id | when | what | default |
|---|---|---|---|
| O3 | W1-D | The alert email address | the subscription owner's email |
| O4 | W2 / W4 | (a) A smoke test on the owner's own phone before the face goes default-on. (b) 3-4 low-end Android phones for the device lab (G85, G35, SD680, SD7) | (a) required for default-on. (b) the face stays conservative: B-lite on Mali-G52, H off |
| O5 | W1-B, W3 | Human time: <br>(a) a teacher reviews the bound engine items, about 2 h; <br>(b) G2 build review through the shared library CLI, 5-10 builds, about 1 h; <br>(c) 200 `errType` labels plus M-GRADE, about 2 rater-weeks by CBSE teachers | the owner, or one hired teacher. Without (c), errType logs and does not route |
| **O22** | W2-W3 | (a) **Studio library review:** 100% of the first 50 promotions per archetype, then 10%. That is about 600 reviews for 12 archetypes (1-2 min each, ≈ 10-20 h) and about 1,400 more for archetypes 13-40 over W3. <br>(b) Two raters for the G-SIG 120-reply act labels (≈ 2 h). <br>(c) Two blind coders for AT-B1 and AT-B5 (≈ 1 day per battery run) | (a) one hired teacher. Until reviewed, builds stay `transfer_passed` (≤ 20 mounts each). (b), (c) a hired annotator; single-rater results are logged as such and do not gate |
| **O24** | W2-I | A child-safety reviewer, with the owner, approves the per-language fixed safety openings and the new never-rules families | owner-only review, logged as such |

### 10.4 Counsel and operations

| id | when | what | default |
|---|---|---|---|
| **O25** | before W4-B ships | Resolve `lm9-vs-nm3-format-posteriors`: may per-child format posteriors persist in M3 if all LM9 gates pass? | **session-only per child**; population rows only |
| O-R1 | W3-F | Is the in-session dependency response plus parent-visible boundary notes enough in M1, or should weekly integer boundary counters be stored (needs counsel)? | in-session + notes only |
| **O-R2** | before the pilot | Safeguarding queue owner, latency target, contact rules; the POCSO duty | holds + helplines only; no pilot without an owner |
| O-R5 | before public launch | Publish the child-safety protocol page (built in W3-F) | yes |
| O-preview | W4-A | Whether preview Voice Live features may serve minors | lane B stays off for children |

### 10.5 Azure spend for the build (estimates, from the specs' measured unit costs)

| item | estimate |
|---|---|
| W2-F router bench: 12 archetypes × 30 races at $0.13-0.23 | ≈ $100-150 |
| W3-G archetypes 13-40 at n ≥ 30 | ≈ $250 |
| W3-G batch pre-warm: c4-c8 maths and science identities first, ≈ $300; all ≈ 5k identities ≈ $1.2k per studio-kit version [U] | **O21** approves the full run; default c4-c8 maths and science only |
| AT-B1 / AT-B2 / brain-sim batteries | < $50 per full run |
| HUMAN-VOICE bank render and nightly gates | < $10 |
| Weekly router bench (n = 10 per archetype) | ≈ $50-90 per week at 40 archetypes |
| Studio in use | ≤ $0.60 per child-day and ≤ $8 per child-month hard caps; ≈ $0.60 per child-month at a 90% library hit rate [U] |

---

## 11. What stays unverified, and how each item gets verified

| unverified today | verified by |
|---|---|
| WebRTC realtime voice, barge-in, streaming STT | W1-D probe fleet (fake media, on ACA); W2-D 4-parallel soak (after O14); O4a owner phone |
| latency from India | W1-D Central India probe; every timing gate from W2 onward runs from there. **Every superhuman number is US → eastus2 today** |
| real-phone frame rate and memory | O4a (W2), O4b device lab (W4-D) |
| next-day and woven checks; the 04:00 IST roll; daily and weekly reports | W1-C test clock + W1-D Conductor e2e |
| a module drawing once its engine id is valid | W1-B geometry and mount probes |
| Hindi and Hinglish lessons on production | W3-A grader battery; W2-C and W3-A production probes in a Hindi-medium arm |
| learning effects of any personalisation | only real children: Phase 0 and the MRT (O10). No claim before that |
| **turn-timing targets (first sound ≤ 1.6 s, reply ≤ 2.5 s)** | W2-E from Central India; the Hindi/Hinglish turn-model AUC only on E1 recordings (pilot). Before that, a proxy offline run on probe-fleet child-like clips is logged as a proxy |
| **any archetype meeting the live ship bar** | W2-F / W3-G router bench at n ≥ 30; until then library-only |
| **gate time inside an ACA sandbox; skeleton 300 ms in a real lesson; library hit rate** | W2-F (Container App), W3-G (Sandboxes after O16); W2-H AT-7; W3-G production telemetry |
| **relational safety on the cascade lane and with audio in** | W2-I AT-B1, both lanes, audio-in ≥ 1/3 |
| **whether the expressive voice is preferred** | O20 (owner), O20b (panel), child round 2. The AI judge never decides |
| **the learning value of a Studio piece vs the fallback** | a registered BR6 point at the pilot |
| **the bond working (alliance ↔ learning)** | AT-C1-C6 at the pilot (W4-C instruments) |

---

## 12. Risks and how the plan contains them

- **Hot-file contention** in `lesson.js` and `state.js`. One owner per wave, seams committed by the main loop, and
  the integration day. **Rev 2:** the Teacher Brain stream is the single hot owner from W2. Every other component
  is a proposer to the kernel, so nine W2 streams never edit the turn.
- **The face fails the owner's eye a second time.** The runtime, lip-sync and behaviour are face-independent, so
  only the asset changes. The stylised fallback is pre-agreed (O1b), with a commission option.
- **Kit generation quality (W3-B).** Blind-solve verification on every solver pair, and X2 as the gate. Language
  subjects are not blocked on it.
- **Realtime quota and cost.** Measured maxed (10/10, 30/30). The cascade is the default lane. There is cascade
  failover mid-sitting, a DataZone twin now (O14a), and a quota request before the pilot.
- **Studio quality or latency misses the bar.** Library-first is a requirement until an archetype passes P ≥ 0.95
  at n ≥ 30. The fallback ladder always has something correct (skeleton → T1 engine → template → board → voice).
  The gate-result cache means a gate outage never reveals un-gated code.
- **Studio cost runaway.** Hard caps in the router (3 per lesson, $0.60 per child-day, $8 per child-month), a
  global breaker, background lanes on their own deployments, and pre-warm in batch at batch prices.
- **A background burst silences a child** (a 429 on a hot or safety turn). Lane tags, token buckets, the O13
  twins, reserved headroom for safety turns, and the fixed-wording safety opening that plays without the model.
  G-QUOTA is a code gate.
- **The voice becomes a tic or a lie.** The governor caps rates. The safety register bypasses the layer. Affect is
  never keyed to correctness (HV-17). The reply model never sees a delivery word. A human-sounding voice never
  becomes a human claim (the floor is unchanged).
- **Warmth reads as friendship, or builds dependency.** Seven-layer defence, AT-B1 and AT-B2 as release gates on
  both lanes, stages that never regress or reward usage, and outward-pointing moves. AT-C3 and AT-C5 at the pilot
  decide.
- **Nine streams in W2 overload integration.** The W2 seam commit lands every contract first. Each stream ships
  behind a flag (`studio.enabled`, `turn.predictive`, `voice.expressive`, `rel.policy`), so integration can merge
  a stream dark if its acceptance is red. The integration day gets 1.5 days instead of 1.
- **The simulator flatters.** The `live` policy is the headline, the oracle defines 100%, and a third truth family
  is added before X2 conclusions. Sim results are mechanics, never efficacy.
- **Agents leaving WIP on the branch.** W0 gates it once, and W1-D makes ungated deploys impossible.

### Owner actions closed by the main loop (2026-10-04)
`foundry-w2-deployments-2026-10-04`: with Contributor on the subscription, the main loop created taxila-fast-bg (gpt-5.6-luna, 500),
taxila-studio-sol (gpt-5.6-sol, 500), raised gpt-5.6-terra to 1000, created taxila-realtime-dz (gpt-realtime-2.1 DataZoneStandard, 10) and
taxila-gpt6 (gpt-6-sol 2026-09-22, 500), raised taxila-flux2 to 4, and created the private `voice-bank` container on taxilaforge. That
closes O13a/b/c, the O14 twin, the FLUX half of O15, the container in O17, and O26. Quota increases beyond current limits (realtime,
gpt-image-2, sandbox cores) still need Microsoft quota requests.

### Image lane capacity requirement (added 2026-10-04, for W2 Studio S9)
Route `image-default-flare-low-2026-10-04` then the gpt-image-2 pool per `image-capacity-pool-2026-10-04`: endpoints AZURE_IMAGE_* in .env.local
(uaenorth, polandcentral, swedencentral, westus3) plus the eastus2 account; nearest-first, 429 => next pool member, per-child and global rate caps,
library/prefetch hits before any live generation. Owner action: flare quota increase.

### Speech-gated streaming STT — ON HOLD (owner 2026-10-04: avoid for now; `owner-no-speech-gating-2026-10-04`; full-session streaming stays)
Per `owner-stt-cost-plan-2026-10-04`: the mic and an on-device speech detector (the existing client VAD/worklet) run for the whole session; the
STT stream carries audio only while speech is present plus ~300 ms pre-roll and a short hangover, so barge-in and mid-turn questions behave exactly as
with full streaming. Acceptance: on the synthetic child corpus and recorded barge-in scripts, 0 clipped onsets and 0 missed barge-ins vs full
streaming, and STT billed seconds reduced in proportion to speech share. MAI-Transcribe-2 is the preferred STT (India app), gpt-live-transcribe the
fallback, gpt-transcribe benchmarked as the low-cost option.

## OWNER TEST 2026-10-04 (production, revision s9242020): rated 0/100 — these MUST pass before Wave 2 exits
Owner-reported failures, verbatim intent. Each becomes an acceptance test under tests/prod/owner-*.mjs with real child-like turns (typed AND spoken):
1. **Game grading is nonsense** — activity/game answers graded wrong (right marked wrong or vice versa). Every module's grading must be checked against the
   verified key with randomized correct/incorrect/partial inputs; 0 wrong grades.
2. **Teacher often confused / things fail** — any turn that errors, falls back, loops, repeats, or answers something the child didn't say is a defect.
3. **"Lesson is over / end the lesson" from the child ends the lesson immediately** — a child saying it must NOT simply end the session: the teacher
   acknowledges, checks in warmly, offers a tiny wrap-up or break, and respects parent-set limits; only parent controls / explicit confirmation end it.
4. **"I want to talk about something else" / "explain it in this way" is not understood** — free-form steering requests (change topic, explain
   differently, slower, with an example, in Hindi/English, as a story, with a picture) must be understood and acted on within the next turn.
5. **"Show me a diagram" is ignored** — any request for a diagram/picture/whiteboard/game/animation produces it inside the stage (library or live build
   or whiteboard) within the lesson, with the teacher referring to it.
6. **Voice is robotic** — tracked by the voice v4 workstream (spoken-register lines + delivery plans); ship the round-3 winner.
7. **Teacher animation is not good** — the 2D puppet at >= 4.5/5 replaces the current face; until then use the best available.
8. **Product design needs to improve** — full design/flow review with screenshots on phone/tablet/laptop after Wave 2 integration.

## OWNER RESET 2026-10-04 — supersedes conflicting parts of this plan
Read docs/design/OWNER-RESET-2026-10-04.md. Its 15 requirements are exit criteria for Wave 2 and every later wave. Where PRODUCT-DESIGN-V2, the image pack or any spec targets younger children, the reset wins (ages 9-15).

## Child signals — integrate after Wave 2 merges (workstream wf_fee0f6e9-4a4 done 2026-10-04)
Code is in the tree and tested in isolation (`server/signals/**`, `src/signals/**`, `shared/signals.ts`, 42 tests, evals in `evals/signals/`).
Nothing reads it yet. The order is SIGNALS-SPEC §8.2 steps 1-14, plus the verify deltas in `docs/design/signals/WORKFLOW-RESULT-2026-10-04.json`:
- `step()` applies the backstop itself; still pass the real safety flag in.
- Clearing `state.sig` at lesson end also clears `safetyHold`. Confirm `state.affect` is cleared too.
- Step 13 must ship server first: widen `FEATURE_RANGES` before the client sends `signalExtras`, or `validateUtterance` returns 400 and the utterance's voice features are lost. Add `teacherAudibleAtOnset`.
- Make one copy of the session median answer length canonical (W2-I's or the signal layer's).
- W2-E: fill transcriber confidence on the live lane (`asrConfidence` is never set today).
- Take `f0EndSlopeStPerS` out of `signalsFrom` until SG-M1 passes: every non-final Hindi phrase rises by grammar.
- Rollout: shadow first (`TAXILA_SIGNALS=shadow`). Text states go live after shadow. Audio-derived states wait for the real-child study and Microsoft's written answer on Code of Conduct restriction 12.
- The safety floor's four missing shapes are fixed in `scanSafety` (3e68277). After the Wave 2 merge, re-run `node --test tests/safety.test.mjs` in case a stream rewrote that file.

## Voice v4 (workstream wf_1b466ff4-f6b done 2026-10-04) — what ships when
- Round-3 blind page is published at https://claude.ai/artifact/AXgkuvgNxG9Gets3PvhuCu. It has the same db rules as round 2, and raters need Contributor access. Score it against `docs/research/voice/v4/blind/blind-key.json`; never publish that key.
- `docs/research/voice/v4/prompt-patch.diff` (a superset of `talking-rules.patch`) is NOT applied. Apply it after the round-3 ratings, if arm C (new line plus delivery plan) beats arm A, by the thresholds in TALKING-RULES §6. It touches say.js, compile.js, shapes.js, dhd.js, moment.js and two persona sheets, so re-check it against the Wave 2 tree first.
- **Blocker for any live voice gain:** the Hinglish lane writes Hindi in Roman letters, and Diya then mispronounces Hindi number words (पैंतीस → "पेंटीज", 4/4 takes). Rounds 1-3 were rendered from Devanagari the Director never writes. A Roman → Devanagari step before TTS is a Wave 2.5 voice item. When it lands, the -35% rate decision's reversal condition fires (that rate was measured on Roman script).
- The rule placing the spoken-register note mid-prompt needs a fire-rate test on the cascade lane, because the last section has no room left (position is mechanism).

## Owner-truth (workstream wf_e4aeffad-357 done 2026-10-04): apply after Wave 2 integrates
- Root causes are in `evals/owner-truth/ROOT-CAUSES.md`. Wave 2 as built fixes none of the 21 failures; F14, F16 and F21 are partly fixed.
- Apply `evals/owner-truth/patches/01..10` in order (`patch -p1`). Patches 05-09 touch Wave 2 files, so rebase their hunks onto the integrated tree.
- Then run the full suite, and `tests/prod/owner-1..5-*.mjs` against prod after deploy. The prod baseline at 9242020:
  - grading: F1 16/16 trusted wrong claims;
  - 18.9% defective turns;
  - stop: 0/16 check-ins;
  - steering: 8/16;
  - visual: 0/12.
- Still open, and Wave 2.5 owns them: resuming a stopped lesson; the whiteboard taking 2.8-6.3 s to arrive (pre-draw or reveal on request); patch 06's full-sentence answer leak; item 4 steering has no owner, so assign it to the conversation-intelligence stream.
- A leftover prod test account is blocked by its own safeguarding case. See `evals/owner-truth/results/acceptance-2026-10-04-prod9242020/LEFTOVER-ACCOUNTS.json`; it needs an owner-approved cleanup.

## Experience reset (wf_8c997b54-7ee) done 2026-10-04: Wave 2.5 = docs/design/reset/RESET-PLAN.md
- Prod audit: `docs/design/reset/audit/DEFECTS.md` lists 187 defects, with a ranked top 40.
- Design: DESIGN-V3.md, with mockups published at https://claude.ai/artifact/CZJZdNBWJPb7YTrLmNG7TG.
- Studio bar: STUDIO-V2.md, with 3 exemplars published at https://claude.ai/artifact/P1h1xCCtys4JmzDibYPcvE. 60 fps on a real phone is unproven; measured 43-57 fps in the container.
- Conversation: CONVERSATION-V2.md. The battery has 345 cases; prod passes 39%, and the target is 85%.
- Content level: CONTENT-LEVEL.md, with root causes R1-R8. Placement was never built; the queue serves easiest-first and is capped.
- Day 0 of Wave 2.5: apply the owner-truth patches 01-10, plus the content-level fix so a dice-style item never opens a lesson.
- Open owner decisions:
  - teacher look (style C or the painted portraits);
  - off-topic hidden from parents;
  - reference phone;
  - real-child panel;
  - 3 leftover prod test accounts blocked by synthetic safeguarding incidents;
  - USD 60-90 Azure budget.

## Done overnight 2026-10-05: integrate after Wave 2 (in owner priority order)
1. **Duplex v2** (wf_3622f8d6-318): `docs/research/duplex/{ARCHITECTURE v2, PLAN.md, CRITIQUE.md}`; runtime in `src/duplex/**` and `server/duplex/**`; TaxilaFDB in `evals/duplex/taxilafdb/**`.
   - Stage A cuts off thinking pauses 0.0% (clean) against 82.8% for silence-640 and 24.9% for today's cascade; decision gap p50 360 ms.
   - PLAN blockers, in order:
     - (a) the safety predicate must survive real transcripts (16/84 missed under sttReal, today's prod too). Fixing it in wf_94977421-1ca;
     - (b) freeze one engine config;
     - (c) yield must cancel pending replies in the player;
     - (d) the India MAI lane (owner ticket).
   - Open bars: barge-in yield p50 760 ms against the 200 ms target; keeping talking through "haan/acchha" at 67-72%, target ≥ 90%.
   - Then the 12 flagged steps in PLAN.md.
2. **2D face:** still polishing (r5); r4 = 3.8/5.
3. **Voice signals** (wf_085e782c-74c): a hesitation detector (45 KB ONNX, AUROC 0.94 on adults) and `server/voicesig/**`, shadow only.
   - Nothing about understanding is measured on children yet; it needs the real-child pilot.
   - Owner approvals asked: the `onnxruntime-web` dependency and a ≥ 200-child pilot bar.
   - The AMI CC BY 4.0 attribution line must ship in the product.
4. **Studio v2** (RS-4 pre-work): `shared/studio-spec.ts`, `src/studio-v2/**`, 16 engines, 16,000-spec fuzz; patches in `docs/design/reset/prework/rs4/patches`.
5. **Interaction:** owner-truth patches 01-10, plus conversation v2.
6. **Also ready:**
   - RS-1 UI v3: `src/ui-v3/**` behind `ui.v3`; the scheduler passes 20/20 on the owner's 4:30 PM case.
   - RS-6 placement plus the re-levelled overlay: too-easy first items fell from 44% to 30%; F0 patch.
   - RS-7 Devanagari step: Diya number words 87% → 98% heard right; off by default.
   - Reports are in `docs/design/reset/prework/*/REPORT.md`.
