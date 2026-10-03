# Gap audit: content generated live during a lesson

Audit date: 2026-10-03. Auditor: a gap-audit subagent. This is an audit only, so no code was changed.
Production: `https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io`, tested from the US sandbox over the agent proxy. No timing below includes the round trip from India.

**Owner intent being tested:** "on-the-go generation of the content by animation, image generation, animation n diagram and game generated that time only using code and deployed there only while the kid have extreme smooth experience."

## Verdict in one paragraph

A real production lesson almost never shows the child working content. Across 8 lessons and 80 turns (maths, science, EVS and English; classes 4-7), the Director sent 9 mount commands. 7 named engines that do not exist, so the frame showed "This activity can't open here" and the tray was left as an empty box. 2 mounted a real engine (`number-line@1`, `fraction-bars@1`). In the number-line case the frame is 150 px tall, so its Check button cannot be seen. None of the 9 mounts was tied to an item, so modules produced **0 pieces of machine-truth evidence**. Forge G1 is not connected to the lesson at all: neither the Director nor the client calls it. When I called its own `/api/forge/requests` route directly, it answered `gap` for 40 of 40 items. Nothing generates diagrams, images or animations live. Forge G2 mechanics have no path to a child.

The parts themselves are real and measured: 13 engines and `scene@1` in the frame, G1 at 0 ms on a memory hit, a G2 QA gate with 1.0 recall. **The wiring between them and the lesson is what is missing.**

## What was measured

### M1: API probe, 8 production lessons (`text` lane, `purpose: practice`)

- **Method:** sign up → child of the topic's class → consent → controls set to 00:00-23:59 → `POST /api/lesson/start {topicId}`.
- Then `POST /api/forge/prefetch` and 5 × `POST /api/forge/requests` (the topic's first 5 kit items, `needByMs 2000`).
- Then 10 child turns: ready / don't know / wrong number / "explain with an example" / still confused / a fraction / ok / don't know / number / ok.
- Then end, and `DELETE /api/account`.
- Raw data: `docs/design/gap-audit/shots/live-content/prod-probe-2026-10-03.json`.

| topic | kit's first hint | module commands over 10 turns | does the frame have the engine? | G1 `/api/forge/requests` (n=5) |
|---|---|---|---|---|
| c5-maths-ch02-t01 fractions on a line | number-line | explain → mount `number-line@1`; practice → unmount | yes | 5/5 gap, 73-81 ms |
| c6-maths-ch07-t01 fractional units | fraction-bars | explain → mount `fraction-bars@1`; practice → unmount | yes | 5/5 gap |
| c4-maths-ch05-t01 equal shares | fraction-folding-paper | explain → mount `fraction-folding-paper@1` | **no** | 5/5 gap |
| c7-maths-ch08-t01 fraction × fraction | area-model-grid | explain → mount `area-model-grid@1`; probe → mount again (predict, diagnostic item) | **no** | 5/5 gap |
| c6-science-ch02-t01 grouping plants | plant_card_sort | explain → mount `plant-card-sort@1` | **no** | 5/5 gap |
| c4-evs-ch01-t01 community | concentric-circle-map | explain → mount `concentric-circle-map@1` | **no** | 5/5 gap |
| c5-english-ch02-t01 story order | story-sequencing | explain → mount `story-sequencing@1` | **no** | 5/5 gap |
| c7-english-ch01-t01 poem | read-along | explain → mount `read-along@1` | **no** | 5/5 gap |

**Totals (n = 80 turns):**
- 9 mounts: 8 on `explain` and 1 on `probe`. 2 of 9 mount a registered engine. 0 of 9 are bound to an item: every `itemId` is null except the c7 diagnostic, whose engine does not exist.
- Each module stays up for 3 turns (explain plus two worked-example turns). The Director then unmounts it on the first `practice`/`retrieval` move.
- Turn latency: p50 1,349 ms, p90 2,420 ms, max 2,963 ms. Lesson start: 1,078-2,006 ms.
- Moves seen: repair 20, hint 19, worked_example 16, hook 8, explain 8, practice 6, retrieval 2, probe 1.

**G1, 40 of 40 gap.** I replayed `server/forge/planner.js plan()` offline on the same 40 items:
- With production's renderer set (`fraction-bars@1` only): 0 of 40 can mount.
- With `scene@1` turned on: 3 of 40 can mount (2 `sequence-steps@1`, 1 `choice-card@1`).
- 37 of 40 are `no_activity_for_item`.
- This matches `forge-g1-coverage-2026-10-03`: an activity can be derived for about 20% of items, and with bars only that falls to 1.3% of maths.

### M2: the real child client in Chromium (Playwright, 360 × 800, production)

- **Method:** `/c/<cid>/practice/<topic>`, the text-only Desk, typing into `child-input`. The sandbox proxy returned `ERR_TOO_MANY_RETRIES` on static assets (a blank page; the sandbox's fault, not production's), so I served every same-origin request through Node `fetch` with `page.route`.
- Screenshots: `docs/design/gap-audit/shots/live-content/`. Raw data: `prod-ui-2026-10-03.json`. n = 1 run per topic, plus a second run for frame geometry.

| what | evidence |
|---|---|
| A registered engine mounts in the sandboxed frame on production | `c5-maths-ch02-t01-02-explain.png` (number line), `r2-c6-maths-ch07-t01-02-explain.png` (4-part fraction bar). Visible 722 ms and 1,030 ms after the turn response on the first mount (cold chunk, US sandbox); 13-97 ms for later turns. No CSP errors. |
| **The frame is 150 px tall in a 404 px tray** | iframe box `{h:150}`, tray `{h:404}`. Number-line document `scrollHeight 283`; its ◀ ▶ buttons sit at y = 163 and **Check at y = 223, outside the frame's view**. The child sees the line and the target but not the controls. |
| An unknown engine leaves an empty tray | `c4-maths-ch05-t01-02..04*.png`, `c6-science-ch02-t01-02..04*.png`: inside the frame, the `coming-soon` card ("This activity can't open here") is rendered and then hidden by `.dk-module[data-failed]`. The Desk keeps `data-kind="module"`, so about half the screen is an empty beige box for 3 turns. |
| The teacher talks about a picture that is not there | c4 equal shares: "Board par do barabar tukde dikh rahe hain" ("two equal pieces are showing on the board"). Nothing is showing. `screenHasTargets` (server/director/say.js:113) is true because `s.module.id` is set on the server, so the screen-reference guard does not fire. |
| The teacher and the module disagree | c5 fractions on a line: the teacher says "0 se 1 tak 4 equal gaps" (quarters) while the mounted line shows fifths with "Marker ko yahan rakho: 2/5". The params come from `extractValues` of the worked example, and the teacher's line is generated without seeing them. |
| The practice item that matches the engine gets a number pad instead | `c5-maths-ch02-t01-05-practice.png`: "road divided into 2 equal parts, what number is at the middle mark?" is exactly a number-line *place* item, but practice unmounts the line and opens a digits-only pad (it has no "/" key; the dock's text box still accepts "1/2"). |

### M3: offline, every c4-c7 kit topic (385)

Which engine the **production Director** picks (`server/director/modules.js engineId(hints[0])`), compared with the catalog the decisions say it uses (`shared/engine-catalog.js pickEngine`):

| subject | topics | Director hint[0] registered | any hint registered | catalog `pickEngine` |
|---|---|---|---|---|
| maths | 141 | 6 | 14 | 105 |
| science | 69 | 0 | 0 | 21 |
| EVS | 40 | 0 | 0 | 6 |
| English | 53 | 0 | 0 | 0 |
| Hindi | 48 | 0 | 0 | 0 |
| SST | 34 | 0 | 0 | 0 |
| **all** | **385** | **6 (1.6%)** | **14 (3.6%)** | **132 (34.3%)** |

So on production, about 98% of mounts name an engine the frame does not have. This is exactly the failure that `rj-first-hint-engine-id` records as already fixed.

## The gaps, ranked

Severity scale: **B** = blocks testing the pillar · **D** = degrades the experience · **P** = polish. Estimates are build-agent days, including tests.

### 1. [B] The Director plans modules with the old `engineId(hints[0])`, not `shared/engine-catalog.js`

- **Evidence:**
  - `server/director/modules.js:20-27` (its own `pickEngine` slugifies free-form hints).
  - It is called from `server/director/state.js:592`.
  - `shared/engine-catalog.js` is imported by nothing in `server/director/` or `server/routes/`. Its header claims that `server/director/modules.js` reads it.
  - Decision `engines-v1-catalog-binding` describes code that is not live, and `git show 58d843c` shows modules.js was never migrated.
  - In production, 7 of 9 mounts named nonexistent engines (M1). Offline: 6 of 385 topics resolve (M3).
- **Work:** replace `planModule`'s picker and params with `planEngine({kit, item, lang, mode, representation, ageBand})` plus the catalog's `moduleCommands()`. Store `itemId` and `awaitingReveal` from `plan.itemId` and `plan.predict`. Never mount an id that is not in `ENGINES`.
- **Tests:**
  - Re-run `tests/engine-catalog.test.mjs` and `evals/engines-coverage.mjs`.
  - Add a Director test: every mount engine is a member of `ENGINES`.
  - Add a production-probe assertion: 0 unknown-engine mounts.
- **Estimate:** 1-1.5 days.
- **Expected effect:**
  - Maths topics with an engine go from 6 to 105 (of 141), science from 0 to 21, EVS from 0 to 6.
  - Item-bound plans become possible (65 bound items across c4-c7, `engines-v1-item-binding` fixer re-run).

### 2. [B] Forge G1 is not called from the lesson, and its scene renderer is switched off in production

- **Evidence:**
  - `requestFill` and `prefetchLessonFills` are called only from `server/routes/forge.js:60,73`.
  - The lesson route keeps a no-op seam: `server/routes/lesson.js:426-430` `forgeSeam = { wovenSubStep: () => undefined }`.
  - `grep '/api/forge'` in `src/` finds nothing, so the client never calls it.
  - `server/forge/planner.js:14-17` `liveRenderers()` adds `scene@1` only when `FORGE_SCENE_RENDERER=1`. Production does not set it (`scripts/deploy-azure.mjs` sets no FORGE_* variable). Yet `scene@1` is already in the frame registry (`src/modules/frame/registry.ts:20`).
  - In production, 40 of 40 `requests` returned gap; offline, 3 of 40 mount once scene@1 is on.
  - The measurement `forge-g1-turn-path-2026-10-03` ("call site 2") measured a call site that does not exist in production code.
- **Work:**
  1. At lesson start, fire and forget `prefetchLessonFills({lessonId, childId, topicId})`: it covers 99% of the mountable planned queue, per `forge-g1-prefetch-hitrate`.
  2. In the turn path, for practice/probe/retrieval moves on an item with no bound engine plan, call `requestFill({… needByMs: 2000})`. Put its `command` into `moduleCommands` and set `s.module = {id, itemId, binding}` so `gradeEvent` grades the answer. Never trust the frame's `correct`.
  3. Extend `server/forge/render-check.mjs` to drive `scene@1` fills (`forge-g1-render` notes they are not render-checked). Then set `FORGE_SCENE_RENDERER=1` in the deploy script.
  4. Add a production probe: at least one G1 mount per English/science lesson that has a derivable item.
- **Estimate:** 2.5-3.5 days.

### 3. [B] The module frame renders 150 px tall, so engine controls are clipped

- **Evidence:**
  - M2 measured iframe h = 150 inside a tray of h = 404. The number line's Check sits at y = 223, outside that 150 px.
  - Cause: `src/modules/host.tsx:224-226`. The host wrapper `<div data-module-host>` has no class when used from `WorkTray`, and each tile `<div style={{position:"relative"}}>` has no height. So `height: 100%` on the iframe (`WorkTray.tsx:55`) resolves against an auto-height parent and falls back to the 150 px iframe default.
  - The tests in `tests/engines-browser.test.mjs` mount the frame directly at 360 × 900, which is why they never saw this.
- **Work:**
  - Pass `className` to `ModuleHost` from `ModuleTray`, and give the wrapper and the tile `height: 100%`. Alternatively, set the frame's height from a `resize` message.
  - Add a Desk-level Playwright check: iframe height = tray height, and every engine button lies inside the iframe's box.
- **Estimate:** 0.5 day.

### 4. [B for comprehension, D for experience] Modules never carry the lesson's evidence

- **Evidence:**
  - Mounts happen only on `SHOW_MOVES` (explain, reteach, worked_example, show_module), plus predict on diagnostic and contrast items (`modules.js:7,40-41`).
  - Practice unmounts the module (M1: every lesson, at the first practice or retrieval).
  - 0 of 9 production mounts were bound. So `classify.js:263-269`'s machine-truth module path never fires in production, and the "did the child understand" pillar gets no interaction evidence from activities: no drags, no predictions, no misconception facts.
  - A child who answers correctly never reaches `explain`, so they would see no module at all. This is inferred from the code and was not run.
- **Work:**
  - After gap 1, mount bound `planEngine` plans on practice, probe and retrieval items.
  - Keep unbound show mounts on explain.
  - Feed `interaction` facts into the comprehension ledger at the module source weight (×0.75; see open `ledger-game-full-weight`).
  - Have a teacher review the bound adapters. That review is the reversal condition of `engines-v1-catalog-binding`.
- **Estimate:** 1.5-2 days of code, plus teacher review time.

### 5. [D] When a module fails, the tray stays empty and the teacher still points at it

- **Evidence:**
  - M2: empty tray for 3 turns, and the teacher says "do barabar tukde dikh rahe hain".
  - The server keeps `s.module` (`state.js:663` sets `ui.tray = "module"`), and `screenHasTargets` (`say.js:113`) counts it as a target.
  - `Desk.tsx:191` does not pass `onModuleFailed`. The tray collapses only if `useDesk`'s `moduleFailed` wins, and in production it did not: `data-kind` stayed `module` across the 3 turns.
- **Work:**
  - On the server, mount only engines in `ENGINES` (this comes with gap 1).
  - The client sends the frame `error` on the next turn as a module event. The Director clears `s.module` and stops counting it as a screen target.
  - The Desk drops the tray to board or none at once.
  - Add a test: unknown engine → no empty tray, and the next teacher line has no screen reference.
- **Estimate:** 1 day.

### 6. [D] The teacher's words and the visual are produced separately and can contradict each other

- **Evidence:** M2 c5: the teacher says quarters while the line shows fifths and a 2/5 target. `planModule` takes `extractValues` of the worked-example text, and the reply prompt is never told what the module shows.
- **Work:**
  - Give the reply instructions a facts line about the module: engine, mode, the values on screen, written as shapes and never as sentences (law: sentence-shaped prompt text gets recited).
  - Take the worked-example params from the same source the teacher's content uses.
  - Add an eval: across n ≥ 30 explain turns in fraction and number topics, the numbers the teacher says match the module's parts.
- **Estimate:** 1-1.5 days.

### 7. [D] No diagram, image or animation is generated live, and none of the planned renderers exists

- **Evidence:**
  - The whiteboard is `{kind: text|math|image(URL)}` (`shared/contracts.ts:80`, `src/child/lesson/Board.tsx`). No server code produces an `image` board or calls an image model at runtime. Image calls exist only in `scripts/character/**` bake-offs.
  - `explainer@1` (8 templates, 8/8 valid, 2.88 s p50 in `docs/research/content/explainer-bench`) and the diagram spec-fill layer (CONTENT-ENGINE §0.1 item 3) appear nowhere in `src/modules/frame/registry.ts`, and no server module mentions them.
  - Images are measured at 37-47 s and $0.053 each (gpt-image-2, `image-bench-2026-10-02`), which is too slow for a turn. CONTENT-ENGINE already rules images library-only.
- **Work:**
  - (a) `explainer@1` renderer in the frame: port `docs/research/content/explainer-dsl.mjs` as a frame engine plus a G1 template fill (model fills data, code animates). About 4-5 days.
  - (b) Diagram layer: label and flow diagram templates on the `scene@1` layout engine. It serves science, EVS and SST, which are otherwise empty. About 3-4 days.
  - (c) Offline image library per kit topic: gpt-image-2 or FLUX.2-pro on Azure, a vision check, labels drawn by code and never baked into the image, served to `board.image`. About 3 days plus roughly $0.05 × images.
- **Be honest with the owner:** "game generated at that moment by code" is rejected for the live path (`forge-live-codegen-race`). Generated code needs review, so the live path is data filling tested code (T1/T2a), and new mechanics arrive the next day (G2).

### 8. [D] Whole subjects get nothing

- **Evidence:**
  - Catalog coverage for English, Hindi and SST is 0 of 135 topics; science 21/69, EVS 6/40 (M3, and `engines-v1-coverage`).
  - In production, all four non-maths lessons mounted only unknown engines.
  - G1 scene fills reach about 20-26% of items (`forge-g1-coverage`).
  - The top unresolved hints are read-along (91), role-play (78), word-builder (66), picture-word-match (60) and story-sequencing (57).
- **Work:**
  - Language activities as `scene@1` templates first, since they need no new engine: picture-word-match → choice-card with images from 7(c); story-sequencing → sequence-steps, which already exists; word-builder → a new tile template. About 1 day per template.
  - Then the v1.1 engine order from `content-v1-engine-set`, by topics gained per day.
  - Close the 2-3 biggest language hints: about 1-1.5 weeks.

### 9. [D] Forge G2 next-day mechanics cannot reach a child

- **Evidence:**
  - `server/forge/g2/serve.js:23 mountFor()` has no caller outside g2.
  - The client has no handler for `g2:<id>` engines or `src`-based mounts: `registry.ts` has 14 ids, none of them g2.
  - No route serves the child's day manifest.
  - All built mechanics are `pending_review`; 12 of them are stale under tgk-lite@1 (`forge-g2-queue-scan`).
  - The nightly runs (`server/conductor/decide.js:161`), so builds cost about $0.20 each with nothing delivered.
- **Work:**
  - Review UI or CLI sign-off for 5-10 builds, done by a human (`forge-g2-review-human-only`).
  - At lesson or practice start, read the child's day manifest and add `mountFor` commands.
  - Teach ModuleHost a `src`-pinned mount, with the play-origin CSP and the hash check.
  - Put a G2 module in the Practice screen.
  - About 3-4 days plus review time.
- **Optional:** pause the nightly's build half until delivery exists, so money is not spent on undeliverable builds.

### 10. [P] Smaller items

- **`mode: "show"`:** the Director sends `mode: "show"` to `number-line@1`, whose modes are place, read and jump. The frame's `resolveParams` adjusts it to a default. This goes away with gap 1.
- **First mount:** 722-1,030 ms after the turn response, measured from the US sandbox. Warm the frame and the topic's engine chunk at lesson start with a hidden, pre-handshaken iframe, so the explain-turn mount is under about 150 ms (local first mount: 146 ms at 1× CPU, 406 ms at 4× CPU). About 0.5 day.
- **Fraction answers on the pad:** the Older-band number pad has no "/" key in fraction topics, so a fraction answer means switching to the text box. About 0.25 day.

## What live generation needs to feel smooth (latency budget)

| stage | budget | today (measured) | how |
|---|---|---|---|
| Director turn (text/cascade) | ≤ 1.5 s p50 | 1.35 s p50, 2.42 s p90 (n = 80, US sandbox) | already close |
| Module command in the same response | 0 ms extra | 0 ms (rides `moduleCommands`) | keep |
| T1 engine plan | < 5 ms | pure code | `planEngine` (gap 1) |
| G1 fill on the turn path | ≤ 50 ms | memory hit 0-1 ms; Neon hit 49 ms p50; cold 62 ms p50 code pick (`forge-g1-turn-path`, eval only) | prefetch at lesson start (gap 2); a cold miss ships the code pick, and the model pick upgrades it in the background |
| T2a scene fill, cold | never on the turn path | 1.1-1.6 s p95 (`forge-g1-latency`) | prefetch only |
| `explainer@1` fill | request one move ahead | 2.88 s p50 (bench) | request it on the move *before* explain, with the teacher's ~2 s preamble covering the rest, or prefetch per topic |
| Frame boot plus engine chunk | ≤ 150 ms | 722-1,030 ms first mount (prod, US sandbox); 13-97 ms warm | pre-warm the frame at lesson start (gap 10) |
| Images | never live | 37-47 s | library only (gap 7c) |

**Fallback ladder, never a placeholder:**
1. Bound engine plan.
2. G1 fill from cache.
3. G1 code pick.
4. Unbound engine show.
5. Board text or math.
6. Voice only.

Each step down writes a `forge_gap` demand row, which G2 and v1.1 work from.

## Not verified from this sandbox

- **Voice lanes.** The voice (WebRTC `gpt-realtime-2.1`) and cascade TTS lanes were not run. Module commands come from the same `step()`, but per `open-lt-voice-lane-truth` the realtime lane answers before the Director runs. So whether the teacher speaks before the module mounts, and whether the voice model refers to a module, is unmeasured.
- **Real devices.** No real phone was tested: the V15 reference phone, a ₹8-10k device with 3 GB, was not used. No frame-time p95 was measured.
- **Network from India.** No round trip from India was measured; all timings are from the US.
- **Children.** Engine play by children, and teacher review of bound adapters, were not done.
- **G2 on production.** G2 mechanics were not exercised in production, since there is no path for them.
- **Sample size.** Playwright UI runs: n = 1 per topic, 3 topics, plus 2 for geometry.

## Raw evidence

- `docs/design/gap-audit/shots/live-content/*.png`: production Desk screenshots per turn; `r2-*` is the geometry run.
- `docs/design/gap-audit/shots/live-content/prod-probe-2026-10-03.json`: M1, 8 lessons × 10 turns plus 40 G1 requests.
- `docs/design/gap-audit/shots/live-content/prod-ui-2026-10-03.json`: M2 turn log.
- Every test account was deleted with `DELETE /api/account`, which returned 200 each time.
